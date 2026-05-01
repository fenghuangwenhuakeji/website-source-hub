// ============================================
// 万能工坊 - 工具执行模块
// 包含: 核心执行(run/continueRun)、跨模块导入/推送、历史记录、收藏、对比、跨模块联动
// ============================================
Object.assign(Modules.workshop, {
    toggleChain: () => { Modules.workshop.chainMode = !Modules.workshop.chainMode; UI.toast(Modules.workshop.chainMode ? '链式模式已开启' : '链式模式已关闭'); const view = document.getElementById('module-view-workshop'); if (view) view.innerHTML = Modules.workshop.render(); if (Modules.workshop.currentTool === 'fusion') Modules.workshop._initFusion(); },
    applyTemplate: (idx) => { const tpls = Modules.workshop.templates[Modules.workshop.currentTool]; if (!tpls || !tpls[idx]) return; const inEl = document.getElementById('ws-in'); if (inEl) { inEl.value = tpls[idx].text + '\n\n' + inEl.value; inEl.focus(); } UI.toast('已应用模板: ' + tpls[idx].name); },
    pasteFromClipboard: async () => { try { const text = await navigator.clipboard.readText(); const inEl = document.getElementById('ws-in'); if (inEl) inEl.value = text; UI.toast('已粘贴'); } catch(e) { UI.toast('粘贴失败'); } },

    // ===== 跨模块数据导入 =====
    _importFrom: async (source) => {
        const inEl = document.getElementById('ws-in');
        if (!inEl) return;
        let data = '';
        try {
            if (source === 'phoenix') {
                const P = Modules.phoenix;
                if (P && P.data) {
                    data = '【凤凰创作流数据】\n';
                    if (P.data.idea) data += '创意: ' + P.data.idea + '\n';
                    if (P.data.genre) data += '类型: ' + P.data.genre + '\n';
                    if (P.data.style) data += '风格: ' + P.data.style + '\n';
                    if (P.data.outlineRaw) data += '大纲:\n' + P.data.outlineRaw + '\n';
                    if (P.data.fusionContext) data += '融合上下文:\n' + P.data.fusionContext + '\n';
                }
                if (!data || data.length < 30) data = '凤凰创作流暂无数据，请先在凤凰创作流中创建大纲';
            }
            if (source === 'writer') {
                const W = Modules.writer;
                if (W && W.currentChapterId) {
                    const chap = await DB.get('chapters', W.currentChapterId);
                    if (chap) {
                        data = '【长篇执笔 - ' + (chap.title || '未命名') + '】\n';
                        if (chap.outline) data += '大纲:\n' + chap.outline + '\n\n';
                        if (chap.content) data += '正文:\n' + chap.content.slice(0, 5000);
                    }
                }
                if (!data) data = '请先在长篇执笔中选择一个章节';
            }
            if (source === 'world') {
                const entities = await DB.getAll('entities') || [];
                if (entities.length > 0) {
                    data = '【世界引擎实体 (' + entities.length + '个)】\n';
                    entities.slice(0, 30).forEach(e => {
                        data += `[${e.type}] ${e.name}: ${(e.desc || '').slice(0, 200)}\n`;
                    });
                } else {
                    data = '世界引擎暂无实体数据';
                }
            }
            if (source === 'fusion') {
                const output = document.getElementById('fb-output');
                if (output && output.innerText) {
                    data = '【融合拆书结果】\n' + output.innerText.slice(0, 5000);
                } else {
                    // 尝试从记忆中获取
                    if (typeof MemorySystem !== 'undefined') {
                        const items = MemorySystem.getLongTerm ? MemorySystem.getLongTerm() : [];
                        const fusionItems = items.filter(m => m.category === 'analysis').slice(-3);
                        if (fusionItems.length > 0) {
                            data = '【融合拆书记忆】\n' + fusionItems.map(m => m.content).join('\n---\n');
                        }
                    }
                    if (!data) data = '融合拆书暂无结果，请先在融合拆书中进行分析';
                }
            }
            if (source === 'creative') {
                const CS = Modules.creative_studio;
                if (CS && CS.shortDraft) {
                    data = '【创意工坊草稿】\n';
                    if (CS.shortDraft.title) data += '标题: ' + CS.shortDraft.title + '\n';
                    if (CS.shortDraft.genre) data += '类型: ' + CS.shortDraft.genre + '\n';
                    if (CS.shortDraft.outline) data += '大纲:\n' + CS.shortDraft.outline + '\n\n';
                    if (CS.shortDraft.content) data += '内容:\n' + CS.shortDraft.content.slice(0, 5000);
                }
                if (!data || data.length < 30) data = '创意工坊暂无草稿数据';
            }
        } catch(e) { data = '导入失败: ' + e.message; }
        inEl.value = data;
        UI.toast('已从' + {phoenix:'凤凰创作流',writer:'长篇执笔',world:'世界引擎',fusion:'融合拆书',creative:'创意工坊'}[source] + '导入');
    },

    // ===== 结果推送到各模块 =====
    _pushTo: async (target) => {
        const out = document.getElementById('ws-out');
        const content = out?.innerText || out?.value;
        if (!content) return UI.toast('暂无内容可推送');
        const title = Modules.workshop.tools[Modules.workshop.currentTool].name + '_' + new Date().toLocaleString();
        try {
            if (target === 'phoenix') {
                const P = Modules.phoenix;
                if (P) { P.data.fusionContext = (P.data.fusionContext || '') + '\n\n[万能工坊推送]\n' + content.slice(0, 3000); }
                UI.toast('已推送到凤凰创作流的融合上下文');
            }
            if (target === 'writer') {
                const W = Modules.writer;
                if (W && W.currentChapterId) {
                    const chap = await DB.get('chapters', W.currentChapterId);
                    if (chap) { chap.content = (chap.content || '') + '\n\n' + content; await DB.put('chapters', chap); UI.toast('已追加到当前章节正文'); }
                } else { UI.toast('请先在长篇执笔中选择章节'); }
            }
            if (target === 'world') {
                // 尝试提取实体
                const prompt = `从以下文本中提取所有实体信息，返回JSON数组格式：[{"name":"名称","type":"类型(人物/物品/地点/势力/规则等)","desc":"描述"}]\n\n${content.slice(0, 3000)}`;
                UI.toast('正在提取实体...');
                const res = await AI.generate(prompt);
                let entities = [];
                try { entities = JSON.parse(res.replace(/```json?\n?/g,'').replace(/```/g,'').trim()); } catch(e) {
                    const m = res.match(/\[[\s\S]*\]/); if (m) try { entities = JSON.parse(m[0]); } catch(e2) {}
                }
                for (const ent of entities) {
                    if (!ent.name) continue;
                    const id = 'ws_' + Utils.uuid();
                    await DB.put('entities', { id, name: ent.name, type: ent.type || '其他', desc: ent.desc || '', relations: [], source: 'workshop' });
                }
                UI.toast('已提取 ' + entities.length + ' 个实体到世界引擎');
            }
            if (target === 'library') {
                if (typeof ContextHelper !== 'undefined') ContextHelper.exportToLibrary(title, content);
                else await DB.put('library_books', { id: Utils.uuid(), name: title, content, size: content.length, date: new Date().toLocaleDateString() });
                UI.toast('已导入阅读中心');
            }
            if (target === 'rag') {
                if (typeof RAGSystem !== 'undefined') { RAGSystem.addDocument(title, content, 'workshop'); UI.toast('已存入RAG'); }
                else UI.toast('RAG系统不可用');
            }
            if (target === 'memory') {
                if (typeof MemorySystem !== 'undefined') { MemorySystem.addLongTerm(content.slice(0, 2000), 'analysis', 5); UI.toast('已存入长期记忆'); }
                else UI.toast('记忆系统不可用');
            }
        } catch(e) { UI.toast('推送失败: ' + e.message); }
    },

    // ===== 跨模块联动执行 =====
    runCrossMod: async () => {
        const W = Modules.workshop;
        const mode = W.currentSubMode;
        const outEl = document.getElementById('ws-out');
        const extra = document.getElementById('ws-in')?.value || '';
        if (!outEl) return;
        outEl.innerHTML = '<div class="flex items-center gap-2 text-blue-400 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin"></i> 正在执行跨模块联动...</div>';
        let prompt = '';
        try {
            if (mode === 'phoenix_outline') {
                const P = Modules.phoenix;
                const data = P ? P.data : {};
                prompt = `请对以下凤凰创作流大纲进行深度拆解分析，包括结构优化建议、情节张力分析、人物弧光评估：\n\n创意: ${data.idea||'无'}\n类型: ${data.genre||'无'}\n风格: ${data.style||'无'}\n大纲:\n${data.outlineRaw||'无大纲数据'}\n${extra ? '\n附加要求: ' + extra : ''}`;
            }
            if (mode === 'writer_chapter') {
                const chap = Modules.writer?.currentChapterId ? await DB.get('chapters', Modules.writer.currentChapterId) : null;
                if (!chap) return outEl.innerHTML = '<div class="text-red-400 text-sm">请先在长篇执笔中选择一个章节</div>';
                prompt = `请对以下章节进行全面润色和优化，提升文笔质量、情感表达和叙事节奏：\n\n章节: ${chap.title}\n大纲: ${chap.outline||'无'}\n正文:\n${(chap.content||'').slice(0,6000)}\n${extra ? '\n附加要求: ' + extra : ''}`;
            }
            if (mode === 'world_entity') {
                const entities = await DB.getAll('entities') || [];
                const entText = entities.slice(0, 20).map(e => `[${e.type}] ${e.name}: ${(e.desc||'').slice(0,150)}`).join('\n');
                prompt = `请基于以下世界引擎实体数据，进行深度扩展分析，补充缺失的关联关系、潜在冲突和故事可能性：\n\n${entText}\n${extra ? '\n附加要求: ' + extra : ''}`;
            }
            if (mode === 'full_context') {
                let ctx = '【全局创作上下文汇总】\n\n';
                const P = Modules.phoenix; if (P && P.data.outlineRaw) ctx += '[凤凰大纲]\n' + P.data.outlineRaw.slice(0,1000) + '\n\n';
                const entities = await DB.getAll('entities') || [];
                if (entities.length > 0) ctx += '[世界实体 ' + entities.length + '个]\n' + entities.slice(0,10).map(e => `${e.name}(${e.type})`).join(', ') + '\n\n';
                if (Modules.writer?.currentChapterId) { const c = await DB.get('chapters', Modules.writer.currentChapterId); if (c) ctx += '[当前章节] ' + c.title + '\n' + (c.outline||'').slice(0,500) + '\n\n'; }
                prompt = `请基于以下全局创作上下文，生成一份综合分析报告，包括：当前创作进度评估、各模块数据一致性检查、下一步创作建议：\n\n${ctx}\n${extra ? '\n附加要求: ' + extra : ''}`;
            }
            if (!prompt) return outEl.innerHTML = '<div class="text-dim text-sm">请选择联动模式</div>';
            let fullRes = '';
            await AI.generate(prompt, {}, c => { if (!fullRes) outEl.innerHTML = ''; fullRes += c; outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(fullRes) : fullRes; });
            W.history.push({ tool: '跨模块联动', mode, result: fullRes, ts: Date.now() });
        } catch(e) { outEl.innerHTML = '<div class="text-red-400 text-sm">执行失败: ' + e.message + '</div>'; }
    },

    _previewCrossModData: async () => {
        const mode = Modules.workshop.currentSubMode;
        const outEl = document.getElementById('ws-out');
        if (!outEl) return;
        let preview = '';
        try {
            if (mode === 'phoenix_outline') { const P = Modules.phoenix; preview = P ? JSON.stringify(P.data, null, 2) : '无数据'; }
            if (mode === 'writer_chapter') { const c = Modules.writer?.currentChapterId ? await DB.get('chapters', Modules.writer.currentChapterId) : null; preview = c ? `标题: ${c.title}\n大纲: ${c.outline||'无'}\n正文(${(c.content||'').length}字): ${(c.content||'').slice(0,500)}...` : '未选择章节'; }
            if (mode === 'world_entity') { const e = await DB.getAll('entities') || []; preview = e.length + ' 个实体:\n' + e.slice(0,20).map(x => `[${x.type}] ${x.name}`).join('\n'); }
        } catch(e) { preview = '预览失败: ' + e.message; }
        outEl.innerHTML = '<pre class="text-xs text-gray-400 whitespace-pre-wrap">' + preview + '</pre>';
    },

    // ===== 核心执行方法 =====
    run: async () => {
        const W = Modules.workshop;
        const t = W.currentTool;
        const outEl = document.getElementById('ws-out');
        const inEl = document.getElementById('ws-in');
        if (!outEl) return;

        let input = '', prompt = '';

        // 融合模式：收集所有素材槽
        if (t === 'fusion') {
            const slots = document.querySelectorAll('.ws-fusion-in');
            const texts = [];
            slots.forEach((s, i) => { if (s.value.trim()) texts.push(`[素材${String.fromCharCode(65+i)}]\n${s.value.trim()}`); });
            if (texts.length < 2) return UI.toast('请至少填写2个素材槽');
            input = texts.join('\n\n');
            const customPrompt = await Modules.short?.getPrompt?.('fusion');
            prompt = ((typeof customPrompt === 'string' && customPrompt) ? customPrompt : W.defaultPrompts.fusion).replace('{{input}}', input);
        }
        // 仿写模式
        else if (t === 'imitate') {
            const ref = document.getElementById('ws-ref')?.value || '';
            const ref2 = document.getElementById('ws-ref2')?.value || '';
            input = inEl?.value || '';
            if (W.currentSubMode === 'upgrade') {
                if (!input) return UI.toast('请输入待升级文本');
                const customPrompt = await Modules.short?.getPrompt?.('imitate_upgrade');
                prompt = ((typeof customPrompt === 'string' && customPrompt) ? customPrompt : W.defaultPrompts.imitate_upgrade).replace('{{input}}', input);
            } else {
                if (!ref) return UI.toast('请输入参考范文');
                if (!input) return UI.toast('请输入待写内容');
                const key = 'imitate_' + W.currentSubMode;
                const customPrompt = await Modules.short?.getPrompt?.(key);
                prompt = ((typeof customPrompt === 'string' && customPrompt) ? customPrompt : (W.defaultPrompts[key] || W.defaultPrompts.imitate_style))
                    .replace('{{ref}}', ref).replace('{{ref2}}', ref2).replace('{{input}}', input);
            }
        }
        // 自媒体文案
        else if (t === 'media') {
            input = inEl?.value || '';
            if (!input) return UI.toast('请输入素材内容');
            const tone = document.getElementById('ws-media-tone')?.value || '活泼';
            const modeNames = { xhs:'小红书爆款笔记', tiktok:'抖音短视频脚本', wx:'微信公众号深度长文', weibo:'微博热搜话题文案', blurb:'书评/推文' };
            prompt = `请将以下素材改写为${modeNames[W.currentSubMode]||'自媒体文案'}，语气风格：${tone}。\n\n要求：\n- 符合${W.currentSubMode==='xhs'?'小红书':W.currentSubMode==='tiktok'?'抖音':W.currentSubMode==='wx'?'公众号':W.currentSubMode==='weibo'?'微博':'推文'}平台调性\n- 有吸引力的标题/开头\n- 适当使用emoji和排版\n\n素材：\n${input}`;
        }
        // 拆解 / 逻辑纠错
        else {
            input = inEl?.value || '';
            if (!input) return UI.toast('请输入文本');
            if (t === 'split') {
                const key = 'ts_' + W.currentSubMode;
                const customPrompt = await Modules.short?.getPrompt?.(key);
                prompt = ((typeof customPrompt === 'string' && customPrompt) ? customPrompt : (W.defaultPrompts[key] || '请分析以下文本：')) + '\n\n' + input;
            } else if (t === 'logic') {
                const customPrompt = await Modules.short?.getPrompt?.('logic');
                prompt = ((typeof customPrompt === 'string' && customPrompt) ? customPrompt : W.defaultPrompts.logic).replace('{{input}}', input);
            }
        }

        if (!prompt) return UI.toast('无法构建提示词');

        outEl.innerHTML = '<div class="flex items-center gap-2 text-amber-400 animate-pulse p-4"><i class="fa-solid fa-circle-notch fa-spin"></i> 正在生成...</div>';
        W.updateIO(prompt, '生成中...');

        try {
            let fullRes = '';
            await AI.generate(prompt, {}, chunk => {
                if (!fullRes) outEl.innerHTML = '';
                fullRes += chunk;
                outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(fullRes) : fullRes;
                W.updateIO(prompt, fullRes);
            });

            // 链式模式：结果自动填入输入框
            if (W.chainMode && inEl) {
                inEl.value = fullRes;
                UI.toast('链式模式：结果已回填输入框');
            }

            // 记录历史
            W.history.push({ tool: W.tools[t].name, mode: W.currentSubMode, input: input.slice(0, 500), result: fullRes.slice(0, 2000), ts: Date.now() });
            if (W.history.length > 50) W.history.shift();
        } catch(e) {
            outEl.innerHTML = '<div class="text-red-400 text-sm p-4">生成失败: ' + e.message + '</div>';
        }
    },

    // ===== 继续生成 =====
    continueRun: async () => {
        const outEl = document.getElementById('ws-out');
        if (!outEl) return;
        const prev = outEl.innerText || '';
        if (!prev) return UI.toast('暂无内容可继续');
        const prompt = '请继续上文的内容，保持风格和逻辑一致，从上次结束的地方接着写：\n\n' + prev.slice(-2000);
        outEl.innerHTML += '<div class="text-amber-400 animate-pulse mt-2"><i class="fa-solid fa-circle-notch fa-spin"></i> 继续生成中...</div>';
        try {
            let fullRes = prev;
            await AI.generate(prompt, {}, chunk => {
                fullRes += chunk;
                outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(fullRes) : fullRes;
            });
            Modules.workshop.updateIO('继续生成', fullRes);
        } catch(e) { UI.toast('继续生成失败: ' + e.message); }
    },

    // ===== 导出到阅读中心 =====
    exportToLibrary: async () => {
        const out = document.getElementById('ws-out');
        const content = out?.innerText || '';
        if (!content) return UI.toast('暂无内容可导出');
        const title = Modules.workshop.tools[Modules.workshop.currentTool].name + '_' + new Date().toLocaleString();
        if (typeof ContextHelper !== 'undefined') {
            ContextHelper.exportToLibrary(title, content);
        } else {
            await DB.put('library_books', { id: Utils.uuid(), name: title, content, size: content.length, date: new Date().toLocaleDateString() });
        }
        UI.toast('已导出到阅读中心');
    },

    // ===== 历史记录 =====
    showHistory: () => {
        const W = Modules.workshop;
        if (W.history.length === 0) return UI.toast('暂无历史记录');
        const html = `<div class="p-4 max-h-[70vh] overflow-y-auto space-y-2">
            <div class="text-sm font-bold text-white mb-3"><i class="fa-solid fa-clock-rotate-left mr-1 text-amber-400"></i>历史记录 (${W.history.length})</div>
            ${W.history.slice().reverse().map((h, i) => `
                <div class="bg-white/5 rounded-lg p-3 hover:bg-white/10 cursor-pointer border border-white/5" onclick="Modules.workshop._loadHistory(${W.history.length - 1 - i})">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-xs font-bold text-amber-400">${h.tool} ${h.mode ? '· ' + h.mode : ''}</span>
                        <span class="text-[9px] text-dim">${new Date(h.ts).toLocaleString()}</span>
                    </div>
                    <div class="text-[10px] text-dim line-clamp-2">${(h.result || '').slice(0, 150)}...</div>
                </div>
            `).join('')}
        </div>`;
        UI.modal('历史记录', html);
    },

    _loadHistory: (idx) => {
        const W = Modules.workshop;
        const h = W.history[idx];
        if (!h) return;
        const outEl = document.getElementById('ws-out');
        if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(h.result) : h.result;
        const inEl = document.getElementById('ws-in');
        if (inEl && h.input) inEl.value = h.input;
        UI.toast('已加载历史记录');
        // 关闭弹窗
        document.querySelector('.modal-overlay')?.remove();
    },

    // ===== 收藏 =====
    addToFavorites: () => {
        const out = document.getElementById('ws-out');
        const content = out?.innerText || '';
        if (!content) return UI.toast('暂无内容可收藏');
        const W = Modules.workshop;
        W.favorites.push({
            tool: W.tools[W.currentTool].name,
            mode: W.currentSubMode,
            content: content.slice(0, 3000),
            ts: Date.now()
        });
        UI.toast('已收藏 ⭐ (共' + W.favorites.length + '条)');
    },

    // ===== 对比功能 =====
    saveToCompare: (slot) => {
        const out = document.getElementById('ws-out');
        const content = out?.innerText || '';
        if (!content) return UI.toast('暂无内容');
        Modules.workshop.compareSlots[slot] = content;
        UI.toast('已保存到对比槽 ' + slot.toUpperCase());
    },

    showCompare: () => {
        const W = Modules.workshop;
        const a = W.compareSlots.a;
        const b = W.compareSlots.b;
        if (!a && !b) return UI.toast('请先用 A/B 按钮保存对比内容');
        const html = `<div class="p-4 max-h-[70vh] overflow-hidden flex flex-col">
            <div class="text-sm font-bold text-white mb-3"><i class="fa-solid fa-code-compare mr-1 text-cyan-400"></i>A/B 对比</div>
            <div class="flex-1 grid grid-cols-2 gap-3 min-h-0 overflow-hidden">
                <div class="bg-white/5 rounded-lg p-3 overflow-y-auto border border-blue-500/20">
                    <div class="text-[10px] font-bold text-blue-400 mb-2">版本 A</div>
                    <div class="text-xs text-gray-300 leading-relaxed">${a ? (typeof marked !== 'undefined' ? marked.parse(a) : a) : '<span class="text-dim">空</span>'}</div>
                </div>
                <div class="bg-white/5 rounded-lg p-3 overflow-y-auto border border-purple-500/20">
                    <div class="text-[10px] font-bold text-purple-400 mb-2">版本 B</div>
                    <div class="text-xs text-gray-300 leading-relaxed">${b ? (typeof marked !== 'undefined' ? marked.parse(b) : b) : '<span class="text-dim">空</span>'}</div>
                </div>
            </div>
            ${a && b ? `<div class="mt-3 flex justify-center"><button class="btn h-8 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold" onclick="Modules.workshop.aiCompare()"><i class="fa-solid fa-robot mr-1"></i>AI 智能对比分析</button></div>` : ''}
        </div>`;
        UI.modal('A/B 对比', html, { width: '800px' });
    },

    aiCompare: async () => {
        const W = Modules.workshop;
        const a = W.compareSlots.a;
        const b = W.compareSlots.b;
        if (!a || !b) return UI.toast('需要A和B两个版本');
        const prompt = `请对比分析以下两个版本的文本，从文笔质量、情感表达、叙事技巧、信息密度等维度进行详细对比，并给出优劣评价和改进建议：\n\n[版本A]\n${a.slice(0, 3000)}\n\n[版本B]\n${b.slice(0, 3000)}`;
        const outEl = document.getElementById('ws-out');
        if (outEl) {
            outEl.innerHTML = '<div class="flex items-center gap-2 text-cyan-400 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin"></i> AI对比分析中...</div>';
            try {
                let res = '';
                await AI.generate(prompt, {}, c => { res += c; outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(res) : res; });
            } catch(e) { outEl.innerHTML = '<div class="text-red-400">对比分析失败: ' + e.message + '</div>'; }
        }
        // 关闭弹窗
        document.querySelector('.modal-overlay')?.remove();
    }
});
