Object.assign(Modules.writer, {
    // ===== 获取前章摘要(用于续写上下文) =====
    async _getPrevChapterSummary() {
        if (!this.currentChapterId) return '';
        const chaps = (await DB.getAll('chapters') || []).sort((a,b) => (a.order||0) - (b.order||0));
        const idx = chaps.findIndex(c => c.id === this.currentChapterId);
        if (idx <= 0) return '';
        const prev = chaps[idx - 1];
        if (!prev || !prev.content) return '';
        return '[前一章: ' + (prev.title || '') + ']\n' + prev.content.slice(-1500);
    },

    // ===== 获取提取的文风(用于续写) =====
    _getExtractedStyle() {
        const extracted = (document.getElementById('w-style-extracted') || {}).value || '';
        return extracted.trim();
    },


    // ===== AI Write (深度绑定融合拆书 + 文风提取) =====
    async aiWrite() {
        if(this._generating) return;
        if (!this.currentChapterId) return UI.toast('请先选择章节');
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        const outline = (document.getElementById('w-outline') || {}).value || '';
        const rules = (document.getElementById('w-rules') || {}).value || '';
        const contRules = (document.getElementById('w-continue-rules') || {}).value || '';
        const direction = (document.getElementById('w-ai-direction') || {}).value || '';
        const opts = this.aiOpts;
        const lenHint = this._getLenHint();

        // 获取提取的文风（优先级最高）
        const extractedStyle = this._getExtractedStyle();
        // 确定最终使用的文风规则
        let finalRules = rules;
        let styleSource = '默认写法';
        
        if (extractedStyle) {
            // 文风提取优先级最高
            finalRules = extractedStyle;
            styleSource = '文风提取';
        } else if (rules) {
            // 其次使用全局规则
            finalRules = rules;
            styleSource = '全局规则';
        }

        let promptTpl = await Modules.short.getPrompt('writer_ai');
        let prompt = promptTpl
            .replace('{{rules}}', finalRules)
            .replace('{{continue_rules}}', contRules + (opts.styleKeep ? '\n[风格锁定] 严格保持与前文一致的文风、人称、时态' : ''))
            .replace('{{outline}}', outline)
            .replace('{{input}}', content.slice(-3000));

        prompt += '\n\n[长度要求] ' + lenHint;
        if(direction) prompt += '\n[续写方向] ' + direction;
        prompt += '\n[当前风格来源: ' + styleSource + ']';

        // 导入续写模式：已有正文是原文资产，不重写；只从缺口或当前末尾继续。
        try {
            const activeProject = await GenesisCore.getActiveProject();
            if (activeProject?.mode === 'import') {
                const importCtx = await GenesisCore.buildWriterContext(activeProject.id, { maxLen: 3200 });
                if (importCtx) prompt = '[导入续写上下文]\n' + importCtx + '\n\n' + prompt;
                prompt += '\n\n[导入续写硬规则]\n1. 已有正文必须保留，不要重写、覆盖或总结替代。\n2. 如果当前章节已有正文，只能从末尾自然续写。\n3. 如果当前章节为空，视为缺章/下一章，从前章结尾、知识图谱、章节细纲继续。\n4. 必须优先读取每章章内分部分细纲，按“部分/场次”推进，不要跳写。\n5. 必须承接原文人物状态、世界规则、未回收伏笔和文风指纹。\n6. 生成内容仍遵守 M06：动作、物件、对话错位和物理细节，不写抽象空话。';
            }
        } catch(e) {
            console.warn('[Writer] import continuation context failed:', e);
        }

        // ★ NEXUS OS 前缀注入（强制铁律+四状态机）
        const nexusPrefix = await this._buildNexusPrefix();
        prompt = nexusPrefix + prompt;

        // 融合技法注入
        if (opts.fusionInject) {
            const fusionCtx = this._getFusionContext();
            if(fusionCtx) prompt = '[融合拆书技法 — 请运用这些技法写作]\n' + fusionCtx.slice(0, 3000) + '\n\n' + prompt;
        }

        // ★ 循环级上下文注入（精准到当前章节所属循环）
        const cycleCtx = await this._getCycleContext();
        if(cycleCtx) prompt = '[循环级技法约束 — 本章必须遵守的循环技法]\n' + cycleCtx.slice(0, 2500) + '\n\n' + prompt;

        // 前章摘要注入
        const prevSummary = await this._getPrevChapterSummary();
        if(prevSummary) prompt = prevSummary + '\n\n' + prompt;

        // ★ Phase 3: RAG 自动注入（使用 buildAutoInjectContext）
        let ragCtx = '';
        if (opts.ragInject && typeof RAGSystem !== 'undefined' && RAGSystem.buildAutoInjectContext) {
            const chapterNum = this._getCurrentChapterNum?.() || null;
            ragCtx = await RAGSystem.buildAutoInjectContext({
                query: content.slice(-500),
                chapterNum,
                maxTokens: 2000,
                mode: 'write',
                includeCycles: true,
                includeEntities: true,
                includeWorld: true,
                includeOutline: true,
                includePatterns: true
            });
        } else if (opts.ragInject && typeof ContextHelper !== 'undefined') {
            ragCtx = await ContextHelper.getEnhancedContext(content.slice(-500), 1500);
        }
        prompt = prompt.replace('{{context}}', ragCtx || '');

        this.updateIO(prompt, '生成中...');
        const st = document.getElementById('w-save-status');
        if (st) st.textContent = 'AI 生成中... (' + lenHint + ', ' + styleSource + ')';
        this._setGenerating(true);

        const startLen = content.length;
        await AI.generate(prompt, { flowMode: opts.flowMode || 'hybrid' }, c => {
            if (editor) { editor.value += c; this.onInput(); }
            this.updateIO(prompt, editor ? editor.value.slice(-2000) : c);
        });
        this._setGenerating(false);
        const added = (editor ? editor.value.length : 0) - startLen;
        if (st) st.textContent = '生成完成 (+' + added + '字)';
        await this.save({ silent: true, forcePostProcess: opts.flowMode !== 'manual' });
        if (typeof MemorySystem !== 'undefined') MemorySystem.addWorking('[执笔/AI续写] ' + (editor ? editor.value.slice(-200) : ''), 'generation', 3);
    },

    // ===== 融合技法写作 (新增: 专门用融合精华驱动写作) =====
    async fusionWrite() {
        if(this._generating) return;
        if (!this.currentChapterId) return UI.toast('请先选择章节');
        const fusionCtx = this._getFusionContext();
        if(!fusionCtx) return UI.toast('请先在融合拆书中运行流水线获取融合精华');

        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        const outline = (document.getElementById('w-outline') || {}).value || '';
        const rules = (document.getElementById('w-rules') || {}).value || '';
        const direction = (document.getElementById('w-ai-direction') || {}).value || '';
        const prevSummary = await this._getPrevChapterSummary();

        // ★ NEXUS 前缀 + 循环上下文
        const nexusPrefix = await this._buildNexusPrefix();
        const cycleCtx = await this._getCycleContext();

        const prompt = `${nexusPrefix}你是一位顶级网文写手，精通融合技法。请严格运用以下融合技法精华来创作/续写正文。

${fusionCtx}
${cycleCtx ? '[循环级技法约束]\n' + cycleCtx.slice(0, 2000) + '\n\n' : ''}${rules ? '[写作规则]\n' + rules.slice(0, 1000) + '\n\n' : ''}${outline ? '[本章大纲]\n' + outline.slice(0, 2000) + '\n\n' : ''}${prevSummary ? prevSummary + '\n\n' : ''}${content ? '[当前正文(末尾)]\n' + content.slice(-2000) + '\n\n' : ''}${direction ? '[续写方向] ' + direction + '\n\n' : ''}[核心要求]
1. 必须运用融合技法中的「开篇钩子模板」（如果是章节开头）
2. 严格按照「节奏公式」控制行文节奏
3. 在关键节点运用「爽点矩阵」制造情绪高潮
4. 运用「悬念体系」在段落末尾设置钩子
5. 对话要有潜台词，场景要有画面感
6. ${this._getLenHint()}
7. 直接输出正文，不要解释`;

        this.updateIO(prompt, '融合技法写作中...');
        const st = document.getElementById('w-save-status');
        if (st) st.textContent = '融合技法写作中...';
        this._setGenerating(true);

        const startLen = content.length;
        await AI.generate(prompt, { flowMode: 'fusion' }, c => {
            if (editor) { editor.value += c; this.onInput(); }
            this.updateIO(prompt, editor ? editor.value.slice(-2000) : c);
        });
        this._setGenerating(false);
        const added = (editor ? editor.value.length : 0) - startLen;
        if (st) st.textContent = '融合写作完成 (+' + added + '字)';
        await this.save({ silent: true, forcePostProcess: true });
        UI.toast('融合技法写作完成 (+' + added + '字)');
    },

    // ===== Polish (润色 — 红色预览 + 替换确认 + 文风提取优先) =====
    async polish() {
        if(this._generating) return;
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        if (!content.trim()) return UI.toast('编辑器为空');
        let promptTpl = await Modules.short.getPrompt('writer_polish');
        const rules = (document.getElementById('w-rules') || {}).value || '';
        const polishRules = (document.getElementById('w-polish-rules') || {}).value || '';
        
        // 获取提取的文风（优先级最高）
        const extractedStyle = this._getExtractedStyle();
        // 确定最终使用的文风规则
        let finalRules = '';
        let styleSource = '默认写法';
        
        if (extractedStyle) {
            // 文风提取优先级最高
            finalRules = extractedStyle;
            styleSource = '文风提取';
        } else if (polishRules) {
            // 其次使用润色规则
            finalRules = polishRules;
            styleSource = '润色规则';
        } else if (rules) {
            // 再次使用全局规则
            finalRules = rules;
            styleSource = '全局规则';
        }
        
        let prompt = promptTpl.replace('{{rules}}', finalRules).replace('{{input}}', content.slice(-4000));

        // 注入风格来源标识
        prompt = '[当前风格来源: ' + styleSource + ']\n\n' + prompt;

        // 融合技法注入润色
        if(this.aiOpts.fusionInject) {
            const fusionCtx = this._getFusionContext();
            if(fusionCtx) prompt = '[融合技法参考 — 请用这些技法润色]\n' + fusionCtx.slice(0, 2000) + '\n\n' + prompt;
        }

        this.updateIO(prompt, '润色中...');
        this._setGenerating(true);
        UI.toast('正在润色... (风格: ' + styleSource + ')');

        // 保存原文
        this._polishOriginal = content;

        let result = '';
        await AI.generate(prompt, {}, c => { result += c; this.updateIO(prompt, result); });
        this._setGenerating(false);

        if (!result || !result.trim()) return UI.toast('润色结果为空');

        // 红色预览模式 — 编辑器显示润色结果，加替换确认浮层
        if (editor) {
            editor.value = result;
            editor.style.color = '#f87171';
            this.onInput();
        }
        // 显示替换确认浮层
        let bar = document.getElementById('w-polish-confirm');
        if (bar) bar.remove();
        const editorWrap = editor?.parentElement;
        if (editorWrap) {
            const div = document.createElement('div');
            div.id = 'w-polish-confirm';
            div.style.cssText = 'position:absolute;bottom:16px;left:50%;transform:translateX(-50%);z-index:30;display:flex;align-items:center;gap:10px;padding:10px 24px;border-radius:14px;background:rgba(20,20,25,0.95);border:1px solid rgba(248,113,113,0.4);backdrop-filter:blur(12px);box-shadow:0 8px 32px rgba(0,0,0,0.5);';
            div.innerHTML = `
                <i class="fa-solid fa-gem text-purple-400"></i>
                <span style="font-size:12px;font-weight:700;color:#f87171;">润色预览</span>
                <span style="font-size:10px;color:#6b7280;">${result.length}字</span>
                <button onclick="Modules.writer._acceptPolish()" style="padding:4px 16px;border-radius:8px;font-size:11px;font-weight:700;background:rgba(34,197,94,0.2);color:#4ade80;border:1px solid rgba(34,197,94,0.3);cursor:pointer;">✓ 替换</button>
                <button onclick="Modules.writer._rejectPolish()" style="padding:4px 16px;border-radius:8px;font-size:11px;font-weight:700;background:rgba(239,68,68,0.2);color:#f87171;border:1px solid rgba(239,68,68,0.3);cursor:pointer;">✗ 还原</button>
            `;
            editorWrap.style.position = 'relative';
            editorWrap.appendChild(div);
        }
    },
    _acceptPolish() {
        const editor = document.getElementById('w-editor');
        if (editor) editor.style.color = '';
        const bar = document.getElementById('w-polish-confirm');
        if (bar) bar.remove();
        this._polishOriginal = null;
        this.onInput();
        UI.toast('已替换为润色版本');
    },
    _rejectPolish() {
        const editor = document.getElementById('w-editor');
        if (editor && this._polishOriginal != null) {
            editor.value = this._polishOriginal;
            editor.style.color = '';
        }
        const bar = document.getElementById('w-polish-confirm');
        if (bar) bar.remove();
        this._polishOriginal = null;
        this.onInput();
        UI.toast('已还原原文');
    },

    // ===== Chat (强化版：深度上下文注入 + 正文引用 + 实体关联 + 直接修改) =====
    _chatContextState: { content: true, outline: true, world: true, fusion: true, rag: true },
    _chatSelection: null,
    _chatHistory: [],

    _toggleChatContext(type) {
        this._chatContextState[type] = !this._chatContextState[type];
        const el = document.getElementById('w-chat-ctx-' + type);
        if (el) {
            el.textContent = type === 'content' ? '正文' : type === 'outline' ? '大纲' : type === 'world' ? '世界' : type === 'fusion' ? '融合' : 'RAG';
            el.textContent += this._chatContextState[type] ? ' ✓' : ' ✗';
            el.className = this._chatContextState[type] ? 
                (type === 'content' ? 'text-green-400' : type === 'outline' ? 'text-blue-400' : type === 'world' ? 'text-amber-400' : type === 'fusion' ? 'text-purple-400' : 'text-cyan-400') + ' cursor-pointer hover:underline' :
                'text-dim cursor-pointer hover:underline';
        }
    },

    _chatClear() {
        if (!confirm('清空所有对话记录？')) return;
        const log = document.getElementById('w-chat-log');
        if (log) log.innerHTML = '';
        this._chatHistory = [];
        UI.toast('对话已清空');
    },

    async _chatRefreshContext() {
        UI.toast('正在刷新上下文...');
        await this.refreshRAG();
        UI.toast('上下文已刷新');
    },

    _clearChatSelection() {
        this._chatSelection = null;
        const selDiv = document.getElementById('w-chat-selection');
        if (selDiv) selDiv.classList.add('hidden');
    },

    _selectTextRange() {
        const editor = document.getElementById('w-editor');
        if (!editor) return;
        
        const start = prompt('起始位置 (字符索引，从0开始):', '0');
        if (start === null) return;
        const end = prompt('结束位置:', String(editor.value.length));
        if (end === null) return;
        
        const startIdx = parseInt(start) || 0;
        const endIdx = parseInt(end) || editor.value.length;
        
        if (startIdx >= endIdx || startIdx < 0) {
            UI.toast('无效的范围', 'error');
            return;
        }
        
        this._chatSelection = {
            text: editor.value.slice(startIdx, endIdx),
            start: startIdx,
            end: endIdx
        };
        
        const selDiv = document.getElementById('w-chat-selection');
        const selText = document.getElementById('w-chat-selection-text');
        if (selDiv && selText) {
            selDiv.classList.remove('hidden');
            selText.textContent = `[${startIdx}-${endIdx}] ${this._chatSelection.text.slice(0, 200)}${this._chatSelection.text.length > 200 ? '...' : ''}`;
        }
        UI.toast(`已选中 ${this._chatSelection.text.length} 字`);
    },

    async _insertEntityRef() {
        try {
            const entities = await DB.getAll('entities') || [];
            if (entities.length === 0) {
                UI.toast('世界引擎暂无实体', 'error');
                return;
            }
            
            const modal = document.createElement('div');
            modal.id = 'w-entity-ref-modal';
            modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm';
            modal.innerHTML = `
                <div class="bg-[#1a1a2e] rounded-2xl border border-white/10 w-[500px] max-h-[70vh] flex flex-col shadow-2xl">
                    <div class="flex items-center justify-between px-4 py-3 border-b border-white/5">
                        <span class="font-bold text-white text-sm"><i class="fa-solid fa-at mr-2 text-amber-400"></i>选择要引用的实体</span>
                        <button class="text-dim hover:text-white" onclick="this.closest('#w-entity-ref-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="p-3 border-b border-white/5">
                        <input type="text" id="w-entity-search" class="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white" placeholder="搜索实体..." oninput="Modules.writer._filterEntityList(this.value)">
                    </div>
                    <div id="w-entity-list" class="flex-1 overflow-y-auto p-2 space-y-1">
                        ${entities.slice(0, 50).map(e => `
                            <div class="p-2 bg-black/20 rounded-lg border border-white/5 cursor-pointer hover:bg-white/5 transition-all" onclick="Modules.writer._selectEntity('${e.id}', '${this._esc(e.name)}')">
                                <div class="flex items-center gap-2">
                                    <span class="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-dim">${e.type || '其他'}</span>
                                    <span class="text-xs text-white font-bold">${this._esc(e.name)}</span>
                                </div>
                                <div class="text-[10px] text-dim mt-1 line-clamp-2">${this._esc((e.desc || '').slice(0, 100))}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            this._entityList = entities;
        } catch (e) {
            UI.toast('加载实体失败', 'error');
        }
    },

    _filterEntityList(keyword) {
        const list = document.getElementById('w-entity-list');
        if (!list || !this._entityList) return;
        
        const filtered = keyword ? 
            this._entityList.filter(e => e.name.includes(keyword) || (e.desc || '').includes(keyword)) :
            this._entityList;
        
        list.innerHTML = filtered.slice(0, 50).map(e => `
            <div class="p-2 bg-black/20 rounded-lg border border-white/5 cursor-pointer hover:bg-white/5 transition-all" onclick="Modules.writer._selectEntity('${e.id}', '${this._esc(e.name)}')">
                <div class="flex items-center gap-2">
                    <span class="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-dim">${e.type || '其他'}</span>
                    <span class="text-xs text-white font-bold">${this._esc(e.name)}</span>
                </div>
                <div class="text-[10px] text-dim mt-1 line-clamp-2">${this._esc((e.desc || '').slice(0, 100))}</div>
            </div>
        `).join('');
    },

    _selectEntity(id, name) {
        const modal = document.getElementById('w-entity-ref-modal');
        if (modal) modal.remove();
        
        const input = document.getElementById('w-chat-in');
        if (input) {
            input.value += `【引用实体: ${name}】`;
            input.focus();
        }
        UI.toast('已引用实体: ' + name);
    },

    async _chatQuickAction(action) {
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        const selection = this._chatSelection;
        
        const actions = {
            diagnose: {
                prompt: '请对以下内容进行诊断分析，指出问题并给出修改建议：',
                target: selection ? selection.text : content.slice(-2000)
            },
            polish: {
                prompt: '请润色以下内容，提升文笔和表现力：',
                target: selection ? selection.text : content.slice(-1500)
            },
            expand: {
                prompt: '请扩写以下内容，增加细节描写和情感深度：',
                target: selection ? selection.text : content.slice(-1000)
            },
            rewrite: {
                prompt: '请改写以下内容，保持核心意思但换一种表达方式：',
                target: selection ? selection.text : content.slice(-1000)
            },
            continue: {
                prompt: '请续写以下内容，保持风格和情节连贯：',
                target: content.slice(-1500)
            }
        };
        
        const act = actions[action];
        if (!act) return;
        
        const input = document.getElementById('w-chat-in');
        if (input) {
            input.value = act.prompt + '\n\n【目标内容】\n' + act.target;
        }
        
        if (action !== 'continue') {
            this.sendChat();
        }
    },

    async _getWorldEngineContext() {
        let ctx = '';
        try {
            const entities = await DB.getAll('entities') || [];
            const worldEntities = entities.filter(e => e.id && e.id.startsWith('world_'));
            if (worldEntities.length) {
                ctx += '[世界观设定]\n';
                worldEntities.forEach(e => { ctx += `【${e.name}】${(e.desc||'').slice(0,200)}\n`; });
            }
            // ★ 优先获取当前章节/循环相关的实体
            let charEntities = entities.filter(e => !e.id.startsWith('world_'));
            const ch = this.currentChapterId ? await DB.get('chapters', this.currentChapterId) : null;
            if(ch && ch.order) {
                const cycleInfo = Modules.world_engine ? Modules.world_engine.getCycleIdForChapter(ch.order, 5) : null;
                const cycleId = cycleInfo ? cycleInfo.cycleId : null;
                // 优先：当前循环实体 > 当前章节实体 > 其他
                const cycleEntities = charEntities.filter(e => cycleId && e.cycles && e.cycles.includes(cycleId));
                const chapterEntities = charEntities.filter(e => e.chapters && e.chapters.includes(this.currentChapterId));
                const otherEntities = charEntities.filter(e => !cycleEntities.includes(e) && !chapterEntities.includes(e));
                charEntities = [...cycleEntities, ...chapterEntities, ...otherEntities].slice(0, 25);
                if(cycleEntities.length) ctx += `\n[循环关联实体 (${cycleEntities.length})]\n`;
            } else {
                charEntities = charEntities.slice(0, 20);
            }
            if (charEntities.length) {
                ctx += '\n[相关实体]\n';
                charEntities.forEach(e => {
                    let line = `• ${e.name}(${e.type||'其他'}): ${(e.desc||'').slice(0,80)}`;
                    if(e.nexusState && e.nexusState.chrStatus) line += ` [${e.nexusState.chrStatus}]`;
                    ctx += line + '\n';
                });
            }
        } catch (e) {}
        return ctx;
    },

    async sendChat() {
        const input = document.getElementById('w-chat-in');
        const log = document.getElementById('w-chat-log');
        if (!input || !log) return;
        
        const txt = input.value.trim();
        if (!txt) return;
        input.value = '';
        
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        const outline = (document.getElementById('w-outline') || {}).value || '';
        const title = (document.getElementById('w-title') || {}).value || '';
        const selection = this._chatSelection;
        
        let userMsgHtml = `<div class="p-2 bg-accent/10 rounded-lg border border-accent/20">
            <div class="flex items-center gap-2 mb-1">
                <span class="text-accent font-bold text-[10px]">你</span>
                <span class="text-[9px] text-dim">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="text-gray-200 text-xs leading-relaxed">${this._esc(txt)}</div>`;
        
        if (selection) {
            userMsgHtml += `<div class="mt-2 p-2 bg-amber-500/10 rounded border border-amber-500/20">
                <div class="text-[9px] text-amber-400 font-bold mb-1"><i class="fa-solid fa-highlighter mr-1"></i>选中段落 [${selection.start}-${selection.end}]</div>
                <div class="text-[10px] text-dim font-mono">${this._esc(selection.text.slice(0, 150))}${selection.text.length > 150 ? '...' : ''}</div>
            </div>`;
        }
        userMsgHtml += '</div>';
        log.innerHTML += userMsgHtml;
        
        let contextPrompt = `[你是专业的小说写作助手，精通各种写作技法。你可以直接建议修改正文，格式为：
【修改建议】
原文：xxx
改为：xxx
理由：xxx

也可以直接输出修改后的完整段落，用【修改后】标记。

重要规则：
1. 修改必须保持与上下文的连贯性
2. 人物性格、世界观设定必须一致
3. 注意伏笔和细节的呼应
4. 如果涉及实体(人物/地点/物品等)，请标注【关联实体: xxx】
5. 如果需要新增实体，请标注【新增实体: 名称|类型|描述】
6. 如果发现逻辑问题，请标注【逻辑问题: xxx】
]
`;
        
        if (this._chatContextState.content && content) {
            contextPrompt += `[当前章节: ${title}]\n[完整正文]\n${content}\n\n`;
        }
        
        if (this._chatContextState.outline && outline) {
            contextPrompt += `[本章大纲]\n${outline}\n\n`;
        }
        
        if (this._chatContextState.world) {
            const worldCtx = await this._getWorldEngineContext();
            if (worldCtx) contextPrompt += worldCtx + '\n';
        }
        
        if (this._chatContextState.fusion) {
            const fusionCtx = this._getFusionContext();
            if (fusionCtx) contextPrompt += fusionCtx.slice(0, 2000) + '\n';
        }
        
        if (this._chatContextState.rag) {
            try {
                const ragResults = this._ragData?.entities?.slice(0, 10) || [];
                if (ragResults.length > 0) {
                    contextPrompt += `[RAG相关实体]\n`;
                    ragResults.forEach(e => {
                        contextPrompt += `${e.type}·${e.name}: ${(e.desc || '').slice(0, 100)}`;
                        if (e.relations && e.relations.length > 0) {
                            contextPrompt += ` | 关联: ${e.relations.slice(0, 3).join(', ')}`;
                        }
                        contextPrompt += '\n';
                    });
                    contextPrompt += '\n';
                }
                
                const relatedFromGraph = this._findRelatedEntitiesFromGraph(txt, this._ragData?.knowledgeGraph || { nodes: [], edges: [] }, 5);
                if (relatedFromGraph.length > 0) {
                    contextPrompt += `[知识图谱关联]\n`;
                    relatedFromGraph.forEach(e => {
                        contextPrompt += `${e.relationFrom} —[${e.relationType}]— ${e.label}\n`;
                    });
                    contextPrompt += '\n';
                }
            } catch(e) {}
        }
        
        if (selection) {
            contextPrompt += `[用户选中的正文段落 - 请针对此段落进行修改]\n位置: 第${selection.start}到第${selection.end}字符\n内容:\n${selection.text}\n\n`;
        }
        
        const relatedEntities = await this._findRelatedEntities(txt, content);
        if (relatedEntities.length > 0) {
            contextPrompt += `[相关实体参考]\n`;
            relatedEntities.slice(0, 5).forEach(e => {
                contextPrompt += `${e.type}·${e.name}: ${(e.desc || '').slice(0, 100)}`;
                if (e.relations && e.relations.length > 0) {
                    contextPrompt += ` | 关联: ${e.relations.slice(0, 3).join(', ')}`;
                }
                contextPrompt += '\n';
            });
            contextPrompt += '\n';
        }
        
        const prevChapters = await this._getRecentChaptersContext(3);
        if (prevChapters) {
            contextPrompt += `[前几章摘要]\n${prevChapters}\n\n`;
        }
        
        contextPrompt += `[用户需求]\n${txt}\n\n请给出专业的建议或直接修改。如果需要修改正文，请明确标注原文和修改后的内容。如果涉及实体关联，请标注【关联实体: xxx】。如果需要新增实体，请标注【新增实体: 名称|类型|描述】。`;
        
        const aiMsgId = 'w-chat-ai-' + Date.now();
        log.innerHTML += `<div id="${aiMsgId}" class="p-2 bg-white/5 rounded-lg border border-white/5">
            <div class="flex items-center gap-2 mb-1">
                <span class="text-green-400 font-bold text-[10px]">AI</span>
                <span class="text-[9px] text-dim">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="text-gray-300 text-xs leading-relaxed"><i class="fa-solid fa-spinner fa-spin mr-1"></i>思考中...</div>
        </div>`;
        log.scrollTop = log.scrollHeight;
        
        let reply = '';
        await AI.generate(contextPrompt, {}, c => {
            reply += c;
            const msgEl = document.getElementById(aiMsgId);
            if (msgEl) {
                const contentDiv = msgEl.querySelector('div:last-child');
                if (contentDiv) {
                    contentDiv.innerHTML = this._formatChatReply(reply);
                }
            }
            log.scrollTop = log.scrollHeight;
        });
        
        const msgEl = document.getElementById(aiMsgId);
        if (msgEl && (reply.includes('【修改后】') || reply.includes('【修改建议】') || reply.includes('改为：') || reply.includes('【关联实体') || reply.includes('【新增实体') || reply.includes('【逻辑问题'))) {
            const actionDiv = document.createElement('div');
            actionDiv.className = 'mt-2 flex gap-1 flex-wrap';
            actionDiv.innerHTML = `
                <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 flex-1" onclick="Modules.writer._applyChatModification('${aiMsgId}', ${selection ? selection.start : 'null'}, ${selection ? selection.end : 'null'})">
                    <i class="fa-solid fa-check mr-1"></i>应用修改
                </button>
                <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.writer._extractEntitiesFromChat('${aiMsgId}')">
                    <i class="fa-solid fa-cube mr-1"></i>提取实体
                </button>
                <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.writer._extractLogicIssues('${aiMsgId}')">
                    <i class="fa-solid fa-bug mr-1"></i>逻辑问题
                </button>
                <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.writer._copyChatReply('${aiMsgId}')">
                    <i class="fa-solid fa-copy"></i>
                </button>
                <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.writer._saveChatToRAG('${aiMsgId}')">
                    <i class="fa-solid fa-database mr-1"></i>存RAG
                </button>
            `;
            msgEl.appendChild(actionDiv);
        }
        
        this._chatHistory.push({ role: 'user', content: txt, selection: selection ? selection.text : null });
        this._chatHistory.push({ role: 'assistant', content: reply });
        
        if (typeof MemorySystem !== 'undefined') {
            MemorySystem.addWorking('[执笔/对话] ' + txt.slice(0, 50), 'chat', 2);
        }
    },

    async _getRecentChaptersContext(count) {
        if (!this.currentChapterId) return '';
        
        const chaps = (await DB.getAll('chapters') || []).sort((a, b) => (a.order || 0) - (b.order || 0));
        const currentIdx = chaps.findIndex(c => c.id === this.currentChapterId);
        if (currentIdx <= 0) return '';
        
        const recentChaps = chaps.slice(Math.max(0, currentIdx - count), currentIdx);
        if (recentChaps.length === 0) return '';
        
        return recentChaps.map(c => 
            `【${c.title}】\n${(c.content || '').slice(-500)}`
        ).join('\n---\n');
    },

    async _extractLogicIssues(msgId) {
        const msgEl = document.getElementById(msgId);
        if (!msgEl) return;
        
        const contentDiv = msgEl.querySelector('div:last-child');
        if (!contentDiv) return;
        
        const replyText = contentDiv.innerText || contentDiv.textContent;
        
        const logicMatch = replyText.match(/【逻辑问题[：:]\s*([^\]]+)\]/g);
        if (!logicMatch || logicMatch.length === 0) {
            UI.toast('未发现逻辑问题标注');
            return;
        }
        
        const issues = logicMatch.map(m => m.replace(/【逻辑问题[：:]\s*/, '').replace('】', '').trim());
        
        const resultEl = document.getElementById('w-diagnose-result');
        if (resultEl) {
            resultEl.innerHTML = `<div class="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <div class="text-sm font-bold text-red-400 mb-2"><i class="fa-solid fa-bug mr-1"></i>发现的逻辑问题</div>
                <ul class="text-xs text-gray-300 space-y-2">
                    ${issues.map(i => `<li class="flex items-start gap-2"><span class="text-red-400">•</span>${i}</li>`).join('')}
                </ul>
                <div class="mt-3 flex gap-2">
                    <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30" onclick="Modules.writer._saveLogicIssues()">保存到诊断</button>
                </div>
            </div>`;
        }
        
        this.tab('diagnose');
        UI.toast(`发现 ${issues.length} 个逻辑问题`);
    },

    _saveLogicIssues: async function() {
        const resultEl = document.getElementById('w-diagnose-result');
        if (!resultEl) return;
        
        await DB.put('settings', {
            id: 'writer_logic_issues_' + Date.now(),
            content: resultEl.innerHTML,
            createdAt: Date.now()
        });
        
        UI.toast('逻辑问题已保存');
    },

    async _saveChatToRAG(msgId) {
        const msgEl = document.getElementById(msgId);
        if (!msgEl) return;
        
        const contentDiv = msgEl.querySelector('div:last-child');
        if (!contentDiv) return;
        
        const replyText = contentDiv.innerText || contentDiv.textContent;
        const title = (document.getElementById('w-title') || {}).value || '对话记录';
        
        if (typeof RAGSystem !== 'undefined') {
            try {
                await RAGSystem.addDocument(
                    `对话建议_${title}_${Date.now()}`,
                    replyText,
                    'chat',
                    { chapterId: this.currentChapterId }
                );
                UI.toast('已保存到RAG');
            } catch(e) {
                UI.toast('保存失败: ' + e.message, 'error');
            }
        } else {
            UI.toast('RAG系统不可用', 'error');
        }
    },

    async _findRelatedEntities(query, content) {
        const results = [];
        try {
            const entities = await DB.getAll('entities') || [];
            const queryLower = query.toLowerCase();
            const contentLower = content.toLowerCase();
            
            for (const ent of entities) {
                if (!ent.name) continue;
                const nameLower = ent.name.toLowerCase();
                if (queryLower.includes(nameLower) || contentLower.includes(nameLower)) {
                    results.push(ent);
                }
            }
        } catch(e) {}
        return results.slice(0, 10);
    },

    async _extractEntitiesFromChat(msgId) {
        const msgEl = document.getElementById(msgId);
        if (!msgEl) return;
        
        const contentDiv = msgEl.querySelector('div:last-child');
        if (!contentDiv) return;
        
        const replyText = contentDiv.innerText || contentDiv.textContent;
        
        const entityMatch = replyText.match(/【关联实体[：:]\s*([^\]]+)\]/g);
        if (!entityMatch || entityMatch.length === 0) {
            UI.toast('未发现关联实体标注');
            return;
        }
        
        const entityNames = entityMatch.map(m => m.replace(/【关联实体[：:]\s*/, '').replace('】', '').trim());
        let count = 0;
        
        for (const name of entityNames) {
            const existing = await DB.getAll('entities') || [];
            const found = existing.find(e => e.name === name);
            
            if (!found) {
                await DB.put('entities', {
                    id: 'chat_entity_' + Utils.uuid(),
                    name: name,
                    type: '其他',
                    desc: `从对话中提取: ${replyText.slice(0, 200)}`,
                    source: 'chat',
                    extractedAt: Date.now()
                });
                count++;
            }
        }
        
        if (count > 0) {
            UI.toast(`已提取 ${count} 个新实体到世界引擎`);
            if (typeof RAGSystem !== 'undefined') {
                await RAGSystem.refreshEntityCache();
            }
        } else {
            UI.toast('所有实体已存在');
        }
    },

    _formatChatReply(text) {
        let formatted = text
            .replace(/【修改后】/g, '<span class="text-green-400 font-bold">【修改后】</span>')
            .replace(/【修改建议】/g, '<span class="text-amber-400 font-bold">【修改建议】</span>')
            .replace(/【原文】/g, '<span class="text-red-400 font-bold">【原文】</span>')
            .replace(/【改为】/g, '<span class="text-green-400 font-bold">【改为】</span>')
            .replace(/【理由】/g, '<span class="text-cyan-400 font-bold">【理由】</span>')
            .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
            .replace(/\n/g, '<br>');
        return formatted;
    },

    _applyChatModification(msgId, selStart, selEnd) {
        const msgEl = document.getElementById(msgId);
        if (!msgEl) return;
        
        const contentDiv = msgEl.querySelector('div:last-child');
        if (!contentDiv) return;
        
        const replyText = contentDiv.innerText || contentDiv.textContent;
        
        // 尝试提取修改后的内容
        let modified = '';
        
        // 格式1: 【修改后】xxx
        const modMatch = replyText.match(/【修改后】\s*([\s\S]*?)(?=【|$)/);
        if (modMatch) {
            modified = modMatch[1].trim();
        }
        
        // 格式2: 改为：xxx
        if (!modified) {
            const changeMatch = replyText.match(/改为[：:]\s*([\s\S]*?)(?=理由|$)/);
            if (changeMatch) {
                modified = changeMatch[1].trim();
            }
        }
        
        // 格式3: 整个回复作为修改内容（如果没有明确标记）
        if (!modified && replyText.length > 50) {
            // 尝试提取看起来像正文的内容
            const lines = replyText.split('\n').filter(l => !l.startsWith('【') && !l.startsWith('理由') && l.trim().length > 20);
            if (lines.length > 0) {
                modified = lines.join('\n').trim();
            }
        }
        
        if (!modified) {
            UI.toast('未能识别修改内容', 'error');
            return;
        }
        
        const editor = document.getElementById('w-editor');
        if (!editor) return;
        
        if (selStart !== null && selEnd !== null && selStart !== 'null') {
            // 替换选中部分
            const before = editor.value.slice(0, selStart);
            const after = editor.value.slice(selEnd);
            editor.value = before + modified + after;
            this._clearChatSelection();
        } else {
            // 追加到末尾或替换最后一段
            if (confirm('应用到哪里？\n确定 = 追加到末尾\n取消 = 替换最后500字')) {
                editor.value += '\n\n' + modified;
            } else {
                editor.value = editor.value.slice(0, -500) + modified;
            }
        }
        
        this.onInput();
        this.save();
        UI.toast('已应用修改');
    },

    _copyChatReply(msgId) {
        const msgEl = document.getElementById(msgId);
        if (!msgEl) return;
        const contentDiv = msgEl.querySelector('div:last-child');
        if (!contentDiv) return;
        const text = contentDiv.innerText || contentDiv.textContent;
        Utils.copy(text);
        UI.toast('已复制');
    },
});
