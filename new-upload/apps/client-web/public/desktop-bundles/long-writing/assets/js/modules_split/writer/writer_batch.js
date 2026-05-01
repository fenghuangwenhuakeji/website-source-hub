Object.assign(Modules.writer, {
    // ===== Export =====
    async exportToLibrary() {
        const content = (document.getElementById('w-editor') || {}).value || '';
        const title = (document.getElementById('w-title') || {}).value || '未命名章节';
        if (!content.trim()) return UI.toast('内容为空');
        if (typeof ContextHelper !== 'undefined') {
            await ContextHelper.exportToLibrary(title, content);
        } else {
            await DB.put('library_books', { id: Utils.uuid(), name: title, type: 'txt', content, size: content.length, date: new Date().toLocaleDateString() });
            UI.toast('已导入沉浸阅读');
        }
    },

    // ===== 生成本章正文（只写当前选中的章节） =====
    async autoWriteCurrent() {
        const W = Modules.writer;
        const project = await W._requireActiveProject?.({ renderGate: true });
        if (!project) return;
        if (!W.currentChapterId) return UI.toast('请先选择章节');
        const chap = await DB.get('chapters', W.currentChapterId);
        if (!chap) return UI.toast('章节不存在');
        if (chap.projectId && chap.projectId !== project.id) return UI.toast('该章节不属于当前项目', 'warning');
        if (!chap.outline || chap.outline.trim().length < 20) return UI.toast('当前章节没有细纲，无法生成正文');
        if (chap.content && chap.content.trim().length > 100) {
            const overwrite = confirm('当前章节已有正文，是否覆盖重写？');
            if (!overwrite) return;
        }

        W._setGenerating(true);
        const st = document.getElementById('w-save-status');
        const editorEl = document.getElementById('w-editor');
        if (st) st.textContent = '① 构建写作上下文...';

        const chaps = W._scopeRecords(await DB.getAll('chapters') || [], project.id).sort((a,b) => (a.order||0) - (b.order||0));
        const targetWords = parseInt((document.getElementById('w-target-words') || {}).value) || 2500;

        // ── 获取上下文（带长度控制） ──
        const fusionCtx = W._getFusionContext ? W._getFusionContext() : '';
        let worldCtx = '';
        if (Modules.world_engine) {
            await Modules.world_engine._ensureCache();
            const entities = Modules.world_engine._cachedEntities || [];
            const worldEntities = entities.filter(e => !e.id.startsWith('world_'));
            const worldViews = entities.filter(e => e.id.startsWith('world_') && e.desc);
            if (worldEntities.length > 0) {
                worldCtx += '[世界引擎实体]\n';
                worldEntities.slice(0, 8).forEach(e => { // 从15减到8
                    worldCtx += `${e.type}·${e.name}: ${(e.desc || '').slice(0, 60)}\n`; // 从100减到60
                });
            }
            if (worldViews.length > 0) {
                const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
                worldCtx += '\n[世界观设定]\n';
                worldViews.slice(0, 3).forEach(w => {
                    const cat = w.id.replace('world_', '');
                    worldCtx += `${catLabels[cat] || cat}: ${(w.desc || '').slice(0, 120)}\n`; // 从200减到120
                });
            }
        }

        let ragContext = '';
        if (typeof RAGSystem !== 'undefined') {
            try {
                const ragQuery = (chap.title || '') + ' ' + (chap.outline || '').slice(0, 300);
                const ragResults = await RAGSystem.search(ragQuery, 3); // 从5减到3
                if (ragResults && ragResults.length > 0) {
                    ragContext = '[RAG参考上下文]\n' + ragResults.map(r => `[${r.source||''}] ${r.title}: ${r.content.slice(0, 250)}`).join('\n---\n') + '\n\n'; // 从400减到250
                }
            } catch(e) {}
        }

        let rules = '';
        const rulesData = await DB.get('settings', 'writer_rules');
        if (rulesData) rules = rulesData.rules || '';
        const mandatoryRules = W._mergeStyleRules
            ? W._mergeStyleRules(W._getExtractedStyle?.() || '', rules)
            : (rules || '');

        // 使用精简版 NEXUS 前缀，大幅缩短 prompt
        const nexusPrefix = await W._buildNexusPrefix(true);
        const cycleCtx = await W._getCycleContext();

        let prevContent = '';
        const prevIdx = chaps.findIndex(c => c.id === chap.id) - 1;
        if (prevIdx >= 0 && chaps[prevIdx].content) {
            prevContent = chaps[prevIdx].content.slice(-1200); // 从2000减到1200
        }

        // ── 构建 Prompt ──
        let writePrompt = nexusPrefix;
        if (fusionCtx) writePrompt += '[融合技法]\n' + fusionCtx.slice(0, 1500) + '\n\n'; // 限制长度
        if (worldCtx) writePrompt += worldCtx + '\n';
        if (cycleCtx) writePrompt += '[循环技法]\n' + cycleCtx.slice(0, 1200) + '\n\n'; // 从2000减到1200
        if (ragContext) writePrompt += ragContext;

        // 判断是否是黄金开篇（第1-3章）
        const isGoldenOpening = chap.order && chap.order <= 3;
        
        // 清理细纲中的元标记（如[情绪8|悬念|铺垫]），只保留纯情节描述
        let cleanOutline = (W._sanitizeOutlineDraft ? W._sanitizeOutlineDraft(chap.outline || '') : (chap.outline || ''))
            .replace(/\[情绪\d+\|[^\]]+\]/g, '')
            .replace(/读者期待[:：].*$/gm, '')
            .replace(/读者恐惧[:：].*$/gm, '')
            .replace(/反应涟漪[:：].*$/gm, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        const proseContract = W._buildWriterProseContract ? W._buildWriterProseContract({
            title: chap.title || '',
            targetWords: `约${targetWords}字`,
            hasContent: false
        }) : '';
        if (proseContract) writePrompt += proseContract + '\n\n';
        if (mandatoryRules) writePrompt += '【强制默认写文规则】\n' + mandatoryRules + '\n\n';
        
        writePrompt += `[本章标题] ${chap.title}\n\n[细纲]\n${cleanOutline.slice(0, 1500)}\n\n`; // 再缩短
        if (prevContent) {
            writePrompt += '[前文末尾]\n' + prevContent.slice(-400) + '\n\n'; // 前文再缩短
        }
        
        // ═══ 极简写作规则（只给命令，不给解释）═══
        const goldenExtra = isGoldenOpening ? '开篇300字必动作/冲突。人物出场带记忆点。反派台词带刺带毒。反杀≤300字干净利落。章末钩子必是新威胁。' : '';
        
        writePrompt += `规则：M06/M07强制默认规则最高优先级。长篇只允许第三人称有限。禁止第一人称视角。禁止上帝视角。禁止直接写非观察位内心。对话只能用中文双引号“”，严禁「」。动作短句≤25字，3-5短后接1长句。段落≤4行。禁情绪标签、禁解释癖、禁虚词、禁逻辑连词。章末钩子。${goldenExtra}约${targetWords}字。

⚠️ 只输出小说正文。禁止：分析、规划、字数统计、元评论、心理解释、标题、总结、任何非正文。
⚠️ 不要输出思考过程，不要解释你的写作决策，直接写正文第一句。

正文：`;

        // ── Prompt 长度诊断 ──
        const promptLen = writePrompt.length;
        const ctxSummary = [];
        if (fusionCtx) ctxSummary.push(`融合技法(${fusionCtx.slice(0,1500).length}字)`);
        if (worldCtx) ctxSummary.push(`世界引擎(${worldCtx.length}字)`);
        if (cycleCtx) ctxSummary.push(`循环技法(${cycleCtx.slice(0,1200).length}字)`);
        if (ragContext) ctxSummary.push(`RAG(${ragContext.length}字)`);
        if (rules) ctxSummary.push(`写作规则(${rules.slice(0,600).length}字)`);
        
        // 在控制台输出详细的Prompt诊断，方便用户查看"参考了什么"
        console.group(`[Writer] 第${chap.order}章《${chap.title}》生成诊断`);
        console.log(`Prompt总长度: ${promptLen}字`);
        console.log(`参考内容摘要: ${ctxSummary.join(' | ') || '无'}`);
        console.log(`细纲: ${chap.outline.slice(0,2000).length}字 | 前文: ${prevContent.length}字 | 目标: ${targetWords}字`);
        console.log(`NEXUS前缀: ${nexusPrefix.length}字 (精简模式)`);
        console.log(`max_tokens: 8192`);
        if (fusionCtx) console.log('【融合技法】\n' + fusionCtx.slice(0,500) + '...');
        if (worldCtx) console.log('【世界引擎】\n' + worldCtx.slice(0,500) + '...');
        if (cycleCtx) console.log('【循环技法】\n' + cycleCtx.slice(0,500) + '...');
        console.groupEnd();
        
        if (st) st.textContent = `② Prompt ${promptLen}字 · 参考:${ctxSummary.length}项 · 等待API首字响应...`;
        
        // 如果prompt过长，给出警告提示
        if (promptLen > 8000) {
            console.warn(`[Writer] Prompt过长(${promptLen}字)，可能导致API响应极慢。建议减少世界引擎实体或关闭RAG。`);
        }

        // ── 生成正文（带实时字数显示 + 流式输出） ──
        let content = '';
        let lastUpdate = 0;
        let firstChunkReceived = false;
        try {
            // max_tokens：8192（glm-5.1支持32K上下文，留足余量写2500字正文）
            const maxTokens = 8192;
            await AI.generate(writePrompt, { apiType: 'text', module: 'writer_auto_current', max_tokens: maxTokens, temperature: 0.85 }, c => {
                content += c;
                const now = Date.now();
                // 首字响应后立刻更新状态
                if (!firstChunkReceived && content.length > 0) {
                    firstChunkReceived = true;
                    if (st) st.textContent = `流式接收中... ${content.length}字`;
                    console.log('[Writer] API首字响应，开始流式输出');
                }
                // 每 100ms 或每收到 20 字更新一次 UI，确保跟手感
                if (editorEl && (now - lastUpdate > 100 || content.length - (editorEl.value?.length || 0) > 20)) {
                    editorEl.value = content;
                    W.onInput();
                    if (st) st.textContent = `流式接收中... ${content.length}字`;
                    lastUpdate = now;
                }
            });
            content = W._sanitizeGeneratedProse ? W._sanitizeGeneratedProse(content) : content;
            if (editorEl) { editorEl.value = content; W.onInput(); }

            // 最终更新
            if (editorEl) { editorEl.value = content; W.onInput(); }

            // ── 检查生成结果 ──
            if (!content || content.trim().length === 0) {
                console.error('[Writer] 正文生成结果为空，可能原因：\n1. API未返回内容\n2. 流式解析失败\n3. provider设置不匹配\n请按F12查看Console日志');
                UI.toast('生成失败：API未返回正文。请按F12查看Console排查', 'error');
                if (st) st.textContent = '生成失败：未收到正文 · 请检查Console';
                W._setGenerating(false);
                return;
            }

            chap.content = content;
            W._stampProject(chap, project.id);
            await DB.put('chapters', chap);

            if (typeof RAGSystem !== 'undefined') {
                try {
                    await RAGSystem.addDocument(`第${chap.order||''}章: ${chap.title}`, content, 'chapter', { chapterId: chap.id });
                } catch(e) {}
            }

            if (st) st.textContent = `生成完成 ${content.length}字 · 已保存 · 准备从正文+细纲提取`;
            UI.toast(`本章正文生成完成 (${content.length}字)，正在从正文+细纲提取`, 'info');
            W.loadTree();
            
            // ── 后处理：提取细纲 + 实体（非阻塞异步，不卡主线程）──
            setTimeout(async () => {
                try {
                    if (W._autoExtractOutline) {
                        if (st) st.textContent = `生成完成 ${content.length}字 · 正在从正文+细纲反推细纲...`;
                        await W._autoExtractOutline(content, chap.id);
                    }
                    if (W._autoExtractEntities) {
                        if (st) st.textContent = `生成完成 ${content.length}字 · 正在从正文+细纲提取实体...`;
                        await W._autoExtractEntities(content, chap.id);
                    }
                    if (st) st.textContent = `生成完成 ${content.length}字 · 正文+细纲已提取 · 已保存`;
                } catch(postErr) {
                    console.warn('[Writer] 后处理失败:', postErr);
                    if (st) st.textContent = `生成完成 ${content.length}字 · 已保存(后处理失败)`;
                }
            }, 100);
            
        } catch(e) {
            console.error('[Writer] autoWriteCurrent error:', e);
            if (editorEl && content) { editorEl.value = content; W.onInput(); } // 保留已生成的内容
            UI.toast('生成失败: ' + (e.message || '未知错误'), 'error');
        } finally {
            W._setGenerating(false);
        }
    },

    // ===== 一键写完指定卷章正文 =====
    async autoWriteScopedChapters() {
        const W = Modules.writer;
        const project = await W._requireActiveProject?.({ renderGate: true });
        if (!project) return;
        const chaps = W._scopeRecords(await DB.getAll('chapters') || [], project.id).sort((a,b) => (a.order||0) - (b.order||0));
        const targets = chaps.filter(c => c.outline && c.outline.trim().length > 20 && (!c.content || c.content.trim().length < 50));
        const esc = s => String(s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
        const labelOf = c => `${c.volumeTitle ? c.volumeTitle + ' / ' : ''}${c.title || '未命名章节'}`;
        
        if (targets.length === 0) {
            UI.toast('没有需要写正文的章节（需要有细纲且正文为空）');
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'w-scoped-write-modal';
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-[#1a1a2e] rounded-2xl border border-white/10 w-[560px] max-h-[85vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-5 py-3 border-b border-white/5">
                    <span class="font-bold text-white"><i class="fa-solid fa-rocket mr-2 text-amber-400"></i>一键写完指定卷章正文</span>
                    <button class="text-dim hover:text-white" onclick="this.closest('#w-scoped-write-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto p-5 space-y-4">
                    <div class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div class="text-sm font-bold text-amber-300 mb-1">待写章节: ${targets.length} 章</div>
                        <div class="text-[10px] text-dim">仅写所选范围内有细纲且正文为空的章节；M06/M07 强制执行</div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <div class="text-[10px] text-dim font-bold uppercase mb-1">起始章节</div>
                            <select id="w-scope-start" class="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white">
                                ${targets.map((c, i) => `<option value="${i}" ${i===0?'selected':''}>${i+1}. ${esc(labelOf(c))}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <div class="text-[10px] text-dim font-bold uppercase mb-1">结束章节</div>
                            <select id="w-scope-end" class="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white">
                                ${targets.map((c, i) => `<option value="${i}" ${i===targets.length-1?'selected':''}>${i+1}. ${esc(labelOf(c))}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <div class="text-[10px] text-dim font-bold uppercase mb-1">章间延迟(秒)</div>
                            <input type="number" id="w-scope-delay" value="2" min="0" max="60" class="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white">
                        </div>
                        <div>
                            <div class="text-[10px] text-dim font-bold uppercase mb-1">目标字数/章</div>
                            <select id="w-scope-words" class="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white">
                                <option value="1500">1500字 (短)</option>
                                <option value="2000" selected>2000字 (中)</option>
                                <option value="3000">3000字 (长)</option>
                                <option value="4000">4000字 (超长)</option>
                            </select>
                        </div>
                    </div>

                    <div class="rounded-lg bg-white/5 border border-white/10 p-3 text-[11px] text-gray-300 leading-relaxed">
                        自动带入融合技法、世界引擎、RAG、前文末尾和章节细纲；写完后自动保存，并从正文+细纲同步提取细纲/实体。
                    </div>
                    
                    <div class="border-t border-white/5 pt-3">
                        <div class="text-[10px] text-dim font-bold uppercase mb-2">写作风格提示</div>
                        <textarea id="w-scope-style" class="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-xs text-gray-300 resize-none h-20" placeholder="可选：额外风格只做补充，不覆盖 M06/M07；如'热血爽文'、'细腻言情'..."></textarea>
                    </div>
                </div>
                <div class="px-5 py-3 border-t border-white/5 flex gap-2">
                    <button class="btn btn-sm bg-white/5 text-dim flex-1" onclick="this.closest('#w-scoped-write-modal').remove()">取消</button>
                    <button class="btn btn-sm bg-gradient-to-r from-amber-600 to-red-600 text-white font-bold flex-1" onclick="Modules.writer._startScopedAutoWrite()">
                        <i class="fa-solid fa-rocket mr-1"></i>开始写作
                    </button>
                </div>
            </div>`;
        
        document.body.appendChild(modal);
    },

    async _startScopedAutoWrite() {
        const W = Modules.writer;
        const project = await W._requireActiveProject?.({ renderGate: true });
        if (!project) return;
        
        const startSelect = document.getElementById('w-scope-start');
        const endSelect = document.getElementById('w-scope-end');
        const delayInput = document.getElementById('w-scope-delay');
        const wordsSelect = document.getElementById('w-scope-words');
        const styleInput = document.getElementById('w-scope-style');
        
        const startIdx = parseInt(startSelect?.value || 0);
        const endIdx = parseInt(endSelect?.value || 0) + 1;
        const delaySeconds = parseInt(delayInput?.value || 2);
        const targetWords = parseInt(wordsSelect?.value || 2000);
        const styleHint = styleInput?.value?.trim() || '';
        
        const modal = document.getElementById('w-scoped-write-modal');
        if(modal) modal.remove();
        
        const chaps = W._scopeRecords(await DB.getAll('chapters') || [], project.id).sort((a,b) => (a.order||0) - (b.order||0));
        const targets = chaps.filter(c => c.outline && c.outline.trim().length > 20 && (!c.content || c.content.trim().length < 50));
        const toWrite = targets.slice(startIdx, endIdx);
        
        if(toWrite.length === 0) {
            UI.toast('没有选中任何章节');
            return;
        }

        let rules = '';
        const rulesData = await DB.get('settings', 'writer_rules');
        if (rulesData) rules = rulesData.rules || '';
        const mandatoryRules = W._mergeStyleRules
            ? W._mergeStyleRules(W._getExtractedStyle?.() || '', rules)
            : (rules || '');
        
        const fusionCtx = W._getFusionContext ? W._getFusionContext() : '';
        
        let worldCtx = '';
        if(Modules.world_engine) {
            await Modules.world_engine._ensureCache();
            const entities = Modules.world_engine._cachedEntities || [];
            const worldEntities = entities.filter(e => !e.id.startsWith('world_'));
            const worldViews = entities.filter(e => e.id.startsWith('world_') && e.desc);
            
            if(worldEntities.length > 0) {
                worldCtx += '[世界引擎实体]\n';
                worldEntities.slice(0, 15).forEach(e => {
                    worldCtx += `${e.type}·${e.name}: ${(e.desc || '').slice(0, 100)}`;
                    if(e.relations && e.relations.length) {
                        worldCtx += ` | 关联: ${e.relations.slice(0, 3).join(', ')}`;
                    }
                    worldCtx += '\n';
                });
            }
            if(worldViews.length > 0) {
                const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
                worldCtx += '\n[世界观设定]\n';
                worldViews.slice(0, 3).forEach(w => {
                    const cat = w.id.replace('world_', '');
                    worldCtx += `${catLabels[cat] || cat}: ${(w.desc || '').slice(0, 200)}\n`;
                });
            }
        }
        
        W._setGenerating(true);
        const st = document.getElementById('w-save-status');
        
        // 初始化全局进度面板
        if (typeof App !== 'undefined') {
            App.showProgress?.('指定卷章写正文', 0, toWrite.length, true);
            App.logIO?.(`开始指定卷章写正文，共 ${toWrite.length} 章`, 'info');
            App.resetStop?.();
        }
        
        for (let i = 0; i < toWrite.length; i++) {
            // 检查是否被停止
            if (typeof App !== 'undefined' && App.isStopped?.()) {
                App.logIO?.('用户停止了指定卷章写作', 'warning');
                if (st) st.textContent = '已停止';
                break;
            }
            
            const chap = toWrite[i];
            const currentNum = i + 1;
            
            // 更新全局进度
            if (typeof App !== 'undefined') {
                App.showProgress?.(`正在写作: ${chap.title}`, currentNum, toWrite.length, true);
                App.logIO?.(`[${currentNum}/${toWrite.length}] 开始写作: ${chap.title}`, 'input');
            }
            
            if (st) st.textContent = `指定卷章写正文 [${currentNum}/${toWrite.length}] ${chap.title}`;
            
            W.currentChapterId = chap.id;
            W.currentVolumeId = chap.volumeId || W.currentVolumeId;
            const titleEl = document.getElementById('w-title');
            const editorEl = document.getElementById('w-editor');
            const outlineEl = document.getElementById('w-outline');
            if (titleEl) titleEl.value = chap.title || '';
            if (editorEl) editorEl.value = '';
            if (outlineEl) outlineEl.value = chap.outline || '';
            W.onInput();
            W.loadTree();
            
            let prevContent = '';
            const prevIdx = chaps.findIndex(c => c.id === chap.id) - 1;
            if (prevIdx >= 0 && chaps[prevIdx].content) {
                prevContent = chaps[prevIdx].content.slice(-2000);
            }
            
            let ragContext = '';
            if (typeof RAGSystem !== 'undefined') {
                try {
                    const ragQuery = (chap.title || '') + ' ' + (chap.outline || '').slice(0, 300);
                    const ragResults = await RAGSystem.search(ragQuery, 5);
                    if (ragResults && ragResults.length > 0) {
                        ragContext = '[RAG参考上下文]\n' + ragResults.map(r => `[${r.source||''}] ${r.title}: ${r.content.slice(0, 400)}`).join('\n---\n') + '\n\n';
                    }
                } catch(e) {}
            }
            
            // ★ NEXUS 前缀 + 循环上下文（按章节动态获取）
            const nexusPrefix = await W._buildNexusPrefix();
            const cycleCtx = await W._getCycleContext();
            const proseContract = W._buildWriterProseContract ? W._buildWriterProseContract({
                title: chap.title || '',
                targetWords: `约${targetWords}字`,
                hasContent: false
            }) : '';

            let writePrompt = nexusPrefix + proseContract + `\n\n【强制默认写文规则】\n${mandatoryRules}\n\n你是一位专业小说家。请根据以下信息编写本章正文。\n\n`;
            if(fusionCtx) writePrompt += fusionCtx + '\n';
            if(worldCtx) writePrompt += worldCtx + '\n';
            if(cycleCtx) writePrompt += '[循环级技法约束]\n' + cycleCtx.slice(0, 2000) + '\n\n';
            if(ragContext) writePrompt += ragContext;
            if(styleHint) writePrompt += `[用户额外风格要求（只做补充，不得覆盖M06/M07）] ${styleHint}\n\n`;
            
            const cleanOutline = (W._sanitizeOutlineDraft ? W._sanitizeOutlineDraft(chap.outline || '') : (chap.outline || ''))
                .replace(/\[情绪\d+\|[^\]]+\]/g, '')
                .replace(/读者期待[:：].*$/gm, '')
                .replace(/读者恐惧[:：].*$/gm, '')
                .replace(/反应涟漪[:：].*$/gm, '')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
            writePrompt += `[本章标题] ${chap.title}\n\n[本章细纲]\n${cleanOutline.slice(0, 3000)}\n\n`;
            
            if(prevContent) {
                writePrompt += '[前文末尾(保持连贯性)]\n' + prevContent + '\n\n';
            }
            
            writePrompt += `要求：
1. 严格按照细纲展开情节
2. ${fusionCtx || cycleCtx ? '运用融合技法中的套路（钩子、节奏、爽点）' : '文风统一，情节连贯'}
3. ${worldCtx || ragContext ? '参考上下文保持世界观/人设/伏笔一致性' : '保持前后文一致'}
4. M06/M07强制默认规则最高优先级，必须同时遵守NEXUS OS L1铁律
5. 字数约${targetWords}字
6. 直接输出正文，不要标题`;
            try {
                let content = '';
                await AI.generate(writePrompt, { apiType: 'text', module: 'writer_scoped_auto', max_tokens: 8192, temperature: 0.85 }, c => {
                    content += c;
                    if (editorEl) editorEl.value = content;
                    W.onInput();
                });
                content = W._sanitizeGeneratedProse ? W._sanitizeGeneratedProse(content) : content;
                if (editorEl) { editorEl.value = content; W.onInput(); }
                
                chap.content = content;
                W._stampProject(chap, project.id);
                await DB.put('chapters', chap);
                
                if(typeof RAGSystem !== 'undefined') {
                    try {
                        await RAGSystem.addDocument(`第${chap.order||''}章: ${chap.title}`, content, 'chapter', { chapterId: chap.id });
                    } catch(e) {}
                }
                
                if (content.length > 500) {
                    try {
                        if (st) st.textContent = `正在从正文+细纲提取: ${chap.title}`;
                        if (W._autoExtractOutline) await W._autoExtractOutline(content, chap.id);
                        if (W._autoExtractEntities) await W._autoExtractEntities(content, chap.id);
                    } catch(e) { console.warn('实体提取失败:', e); }
                }
                
                if (typeof MemorySystem !== 'undefined') {
                    MemorySystem.addWorking(`[自动写作] ${chap.title} (${content.length}字)`, 'generation', 3);
                }
                
                if (st) st.textContent = `✓ ${chap.title} (${content.length}字) [${currentNum}/${toWrite.length}]`;
                if (typeof App !== 'undefined') App.logIO?.(`✓ ${chap.title} 完成 (${content.length}字)`, 'success');
            } catch(e) {
                if (st) st.textContent = `第${i+1}章写作失败: ${e.message}`;
                if (typeof App !== 'undefined') App.logIO?.(`✗ ${chap.title} 失败: ${e.message}`, 'error');
            }
            
            if (i < toWrite.length - 1 && delaySeconds > 0) {
                if (st) st.textContent += ` | 等待${delaySeconds}秒...`;
                await new Promise(r => setTimeout(r, delaySeconds * 1000));
            }
        }
        
        W._setGenerating(false);
        if (st) st.textContent = `指定卷章写作完成 (${toWrite.length}章)`;
        UI.toast(`指定卷章写作完成！共写 ${toWrite.length} 章`);
        W.loadTree();
    },

    // ===== 诊断与分析功能 =====
    async diagnoseContent() {
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        if (!content.trim()) return UI.toast('编辑器内容为空', 'error');
        
        const resultEl = document.getElementById('w-diagnose-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-center text-dim py-4"><i class="fa-solid fa-spinner fa-spin text-xl mb-2"></i><div>正在诊断...</div></div>';
        
        const prompt = `你是一位专业的小说编辑和文学评论家。请对以下小说内容进行全面诊断：

【小说内容】
${content.slice(0, 6000)}

【诊断要求】
请从以下维度进行分析：

1. **情节逻辑**
   - 是否有逻辑漏洞或前后矛盾
   - 因果关系是否合理
   - 冲突设置是否有效

2. **人物塑造**
   - 人物性格是否一致
   - 对话是否符合人物身份
   - 人物动机是否清晰

3. **文笔风格**
   - 叙事节奏是否恰当
   - 描写是否生动具体
   - 是否有冗余或重复

4. **读者体验**
   - 开头是否吸引人
   - 情绪曲线是否合理
   - 悬念和钩子设置

5. **改进建议**
   - 具体的修改建议
   - 优先级排序

请用清晰的Markdown格式输出诊断报告。`;

        let result = '';
        await AI.generate(prompt, {}, c => { result += c; });
        
        if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
        UI.toast('诊断完成');
    },

    async analyzeContent() {
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        if (!content.trim()) return UI.toast('编辑器内容为空', 'error');
        
        const resultEl = document.getElementById('w-diagnose-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-center text-dim py-4"><i class="fa-solid fa-spinner fa-spin text-xl mb-2"></i><div>正在深度分析...</div></div>';
        
        const outline = (document.getElementById('w-outline') || {}).value || '';
        const fusionCtx = this._getFusionContext();
        
        const prompt = `你是一位资深的网文分析师，精通各种写作技法和套路。请对以下内容进行深度分析：

【章节大纲】
${outline.slice(0, 1000) || '无'}

【正文内容】
${content.slice(0, 6000)}

${fusionCtx ? `【融合技法参考】\n${fusionCtx.slice(0, 2000)}\n` : ''}

【分析要求】
请进行以下深度分析：

1. **技法运用分析**
   - 使用了哪些写作技法
   - 技法运用是否到位
   - 与融合技法的对照

2. **节奏曲线分析**
   - 标注情绪高低点
   - 分析节奏控制效果
   - 提出优化建议

3. **爽点/看点分析**
   - 识别文中的爽点
   - 分析爽点设置效果
   - 建议增加的爽点

4. **悬念体系分析**
   - 伏笔设置情况
   - 钩子效果评估
   - 悬念链完整性

5. **读者心理分析**
   - 预期读者情绪变化
   - 可能的弃读点
   - 优化建议

请用Markdown格式输出详细分析报告。`;

        let result = '';
        await AI.generate(prompt, {}, c => { result += c; });
        
        if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
        UI.toast('深度分析完成');
    },

    async summarizeContent() {
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        if (!content.trim()) return UI.toast('编辑器内容为空', 'error');
        
        const resultEl = document.getElementById('w-diagnose-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-center text-dim py-4"><i class="fa-solid fa-spinner fa-spin text-xl mb-2"></i><div>正在总结...</div></div>';
        
        const prompt = `请对以下小说内容进行总结概述：

【内容】
${content.slice(0, 8000)}

【输出要求】
1. **一句话概括**（20字以内）
2. **核心情节**（100字以内）
3. **关键人物**（列出出场人物及其行动）
4. **重要场景**（列出主要场景）
5. **伏笔/悬念**（如有）
6. **情绪走向**（从...到...）

请简洁清晰地输出。`;

        let result = '';
        await AI.generate(prompt, {}, c => { result += c; });
        
        if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
        UI.toast('总结完成');
    },
});
