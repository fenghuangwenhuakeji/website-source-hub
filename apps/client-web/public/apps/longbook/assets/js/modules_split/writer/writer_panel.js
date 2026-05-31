Object.assign(Modules.writer, {
    async _refreshInfoTab() {
        const project = await this._requireActiveProject?.({ renderGate: true });
        if (!project) return;
        const statusLabels = { outline: '🟡 待写', draft: '🟠 草稿', done: '🟢 完成', polished: '🔵 已润色' };
        const statusColors = { outline: 'text-yellow-400', draft: 'text-orange-400', done: 'text-green-400', polished: 'text-blue-400' };
        const statusIconColors = { outline: '#fbbf24', draft: '#fb923c', done: '#4ade80', polished: '#60a5fa' };
        if (!this.currentChapterId) {
            const els = ['w-info-status','w-info-words','w-info-pct','w-info-created'];
            els.forEach(id => { const e = document.getElementById(id); if(e) e.textContent = '-'; });
            const p = document.getElementById('w-info-progress'); if(p) p.style.width = '0%';
            const t = document.getElementById('w-info-tags'); if(t) t.innerHTML = '<span class="text-[9px] text-dim">请选择章节</span>';
            const n = document.getElementById('w-info-neighbors'); if(n) n.innerHTML = '<div class="text-[9px] text-dim text-center py-2">请选择章节</div>';
            ['w-info-vol-total','w-info-vol-done','w-info-vol-words'].forEach(id => { const e = document.getElementById(id); if(e) e.textContent = '0'; });
            return;
        }
        const chap = await DB.get('chapters', this.currentChapterId);
        if (!chap) return;
        if (chap.projectId && chap.projectId !== project.id) return;
        const st = chap.status || 'outline';
        const words = (chap.content || '').length;
        const target = chap.targetWords || 2500;
        const pct = Math.min(100, Math.round((words / target) * 100));
        const stEl = document.getElementById('w-info-status');
        if (stEl) { stEl.textContent = statusLabels[st] || st; stEl.className = 'text-xs font-bold ' + (statusColors[st] || 'text-dim'); }
        const wEl = document.getElementById('w-info-words'); if (wEl) wEl.textContent = words + ' / ' + target;
        const pEl = document.getElementById('w-info-progress'); if (pEl) pEl.style.width = pct + '%';
        const pctEl = document.getElementById('w-info-pct'); if (pctEl) pctEl.textContent = pct + '%';
        const cEl = document.getElementById('w-info-created'); if (cEl) cEl.textContent = chap.createdAt ? new Date(chap.createdAt).toLocaleDateString() : '-';
        const tagsEl = document.getElementById('w-info-tags');
        if (tagsEl) {
            const tags = chap.tags || [];
            tagsEl.innerHTML = tags.length ? tags.map(t => '<span class="px-1.5 py-0.5 rounded-full bg-accent/10 text-accent text-[9px] border border-accent/20">' + this._esc(t) + '</span>').join('') : '<span class="text-[9px] text-dim">暂无标签</span>';
        }
        // 卷级统计
        const allChaps = this._scopeRecords(await DB.getAll('chapters') || [], project.id).sort((a,b) => (a.order||0) - (b.order||0));
        const volChaps = chap.volumeId ? allChaps.filter(c => c.volumeId === chap.volumeId) : [];
        const volTotal = volChaps.length;
        const volDone = volChaps.filter(c => ['done','polished'].includes(c.status||'')).length;
        const volWords = volChaps.reduce((sum, c) => sum + (c.content||'').length, 0);
        const vtEl = document.getElementById('w-info-vol-total'); if(vtEl) vtEl.textContent = volTotal;
        const vdEl = document.getElementById('w-info-vol-done'); if(vdEl) vdEl.textContent = volDone;
        const vwEl = document.getElementById('w-info-vol-words'); if(vwEl) vwEl.textContent = volWords > 9999 ? (volWords/10000).toFixed(1)+'万' : volWords;
        // 相邻章节（增强版）
        const idx = allChaps.findIndex(c => c.id === this.currentChapterId);
        const neighbors = document.getElementById('w-info-neighbors');
        if (neighbors) {
            let nh = '';
            if (idx > 0) {
                const prev = allChaps[idx - 1];
                const pSt = prev.status || 'outline';
                nh += `<div class="p-2 bg-black/20 rounded border border-white/5 cursor-pointer hover:bg-white/5 transition-all" onclick="Modules.writer.load('${prev.id}')">
                    <div class="flex items-center gap-1.5 mb-1"><i class="fa-solid fa-chevron-up text-[8px] text-dim"></i><span class="text-[10px] font-bold text-white">${this._esc(prev.title)}</span><span class="text-[8px] px-1 rounded" style="background:${statusIconColors[pSt]}22;color:${statusIconColors[pSt]}">${statusLabels[pSt]}</span></div>
                    <div class="flex items-center gap-2 text-[9px] text-dim"><span class="font-mono">${(prev.content||'').length}字</span>${prev.targetWords ? '<span>/ ' + prev.targetWords + '目标</span>' : ''}</div>
                </div>`;
            }
            if (idx < allChaps.length - 1) {
                const next = allChaps[idx + 1];
                const nSt = next.status || 'outline';
                nh += `<div class="p-2 bg-black/20 rounded border border-white/5 cursor-pointer hover:bg-white/5 transition-all" onclick="Modules.writer.load('${next.id}')">
                    <div class="flex items-center gap-1.5 mb-1"><i class="fa-solid fa-chevron-down text-[8px] text-dim"></i><span class="text-[10px] font-bold text-white">${this._esc(next.title)}</span><span class="text-[8px] px-1 rounded" style="background:${statusIconColors[nSt]}22;color:${statusIconColors[nSt]}">${statusLabels[nSt]}</span></div>
                    <div class="flex items-center gap-2 text-[9px] text-dim"><span class="font-mono">${(next.content||'').length}字</span>${next.targetWords ? '<span>/ ' + next.targetWords + '目标</span>' : ''}</div>
                </div>`;
            }
            neighbors.innerHTML = nh || '<div class="text-[9px] text-dim text-center py-2">无相邻章节</div>';
        }
    },

    async _quickStatus(status) {
        const project = await this._requireActiveProject?.({ renderGate: true });
        if (!project) return;
        if (!this.currentChapterId) return UI.toast('请先选择章节');
        const chap = await DB.get('chapters', this.currentChapterId);
        if (!chap) return;
        if (chap.projectId && chap.projectId !== project.id) return UI.toast('该章节不属于当前项目', 'warning');
        chap.status = status;
        this._stampProject(chap, project.id);
        await DB.put('chapters', chap);
        const stEl = document.getElementById('w-chap-status');
        if (stEl) stEl.value = status;
        this._refreshInfoTab();
        this.loadTree();
        UI.toast('状态已更新');
    },

    async _editTags() {
        const project = await this._requireActiveProject?.({ renderGate: true });
        if (!project) return;
        if (!this.currentChapterId) return UI.toast('请先选择章节');
        const chap = await DB.get('chapters', this.currentChapterId);
        if (!chap) return;
        if (chap.projectId && chap.projectId !== project.id) return UI.toast('该章节不属于当前项目', 'warning');
        const current = (chap.tags || []).join(', ');
        const input = prompt('输入标签，用逗号分隔:', current);
        if (input === null) return;
        chap.tags = input.split(',').map(t => t.trim()).filter(t => t);
        this._stampProject(chap, project.id);
        await DB.put('chapters', chap);
        this._refreshInfoTab();
    },

    _sanitizeOutlineDraft(text) {
        let out = (text || '').trim();
        out = out.replace(/^```(?:markdown|md|text)?\s*/i, '').replace(/\s*```$/i, '');
        out = out.replace(/^\s*\[情绪\d+\|[^\]]+\]\s*/gm, '');
        out = out
            .replace(/似乎/g, '看起来')
            .replace(/仿佛/g, '像是')
            .replace(/好像/g, '看起来');
        const forbidden = /(读者(期待|恐惧|画像|反馈|爽点|痛点|付费|追读|代入)|AI痕迹|内心OS|本章分析|反应涟漪|技法标签|写作意图|写作目的|付款|买单|M06|NEXUS|读者协议)/;
        out = out.split('\n')
            .filter(line => !forbidden.test(line))
            .map(line => line
                .replace(/^#+\s*/, '')
                .replace(/^情节要点[:：]/, '场次目标：')
                .replace(/^写作细节[:：]/, '动作与细节：')
                .replace(/（[^）]*(读者|写作|体现|带反讽|心理|功能)[^）]*）/g, '')
                .trimEnd())
            .join('\n');
        return out.replace(/\n{3,}/g, '\n\n').trim();
    },

    // ===== 大纲Tab增强：AI细化 =====
    async _aiRefineOutline() {
        if (this._generating) return UI.toast('已有任务在进行中，请稍候');
        const outlineEl = document.getElementById('w-outline');
        const outline = outlineEl ? outlineEl.value : '';
        if (!outline.trim()) return UI.toast('请先输入本章大纲', 'error');
        const chap = this.currentChapterId ? await DB.get('chapters', this.currentChapterId) : null;
        const title = chap ? chap.title : '';
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        
        this._setGenerating(true);
        const st = document.getElementById('w-save-status');
        if (st) st.textContent = '正在细化大纲...';
        UI.toast('AI 正在细化大纲...');
        const nexusPrefix = this._buildNexusPrefix ? await this._buildNexusPrefix(true) : '';
        const prompt = `${nexusPrefix}

你是长篇小说细纲工程师。你的任务不是讲解方法，而是把本章大纲改成可直接写正文的执行级场次细纲。

【硬性后台规则】
- 严格继承现有方向、人物欲望、世界规则、伏笔和下一步推进；不得擅自改主线。
- 读者协议只在后台执行：前三段留人、信息缺口、感官锚点、章末追读理由，都必须内化进场次设计。
- M06只在后台执行：动作、物件、环境、对话、规则后果呈现；禁止空话、总结、解释。
- 细纲是给正文落笔用的，不是给用户看分析报告。

【禁止出现在输出中的词和栏目】
读者期待、读者恐惧、读者画像、读者痛点、付费点、买单、追读率、AI痕迹、内心OS、本章分析、反应涟漪、技法标签、写作目的、写作意图、M06、NEXUS、读者协议。

【输出格式】
只输出细化后的大纲。每个场次使用以下格式，不要增加别的解释：

【场次1：短标题】
- 场次目标：
- 冲突阻力：
- 动作链：
- 物件与环境反馈：
- 对话关键句：
- 人物状态变化：
- 规则/伏笔影响：
- 实体线索：
- 本场信息缺口：

【章末钩子】
- 未完成动作：
- 意外信息/时间压力/信息差：
- 下一章接力点：

【章节标题】${title}

【当前大纲】
${outline}

${content ? '【已有正文片段】\n' + content.slice(0, 1000) + '\n\n' : ''}
【细化要求】
- 拆成3到6个场次。
- 每个场次必须有可拍出来的动作链，不能只有概念。
- 每个场次至少绑定1个物件或环境反馈。
- 对话关键句只给正文可用台词，不解释潜台词。
- 人物变化必须写成可观察变化，不写抽象心理。
- 规则/伏笔只写本章实际触碰、埋设、强化或回收的内容。
- 章末钩子必须是未完成动作 + 意外信息/时间压力/信息差。`;

        let result = '';
        try {
            await AI.generate(prompt, { apiType: 'text', module: 'writer_outline_refine' }, c => { result += c; });
            this._showOutlineConfirm(this._sanitizeOutlineDraft(result), outlineEl ? outlineEl.value : '');
            UI.toast('大纲细化完成，请确认是否替换');
        } catch(e) {
            UI.toast('细化失败: ' + (e.message || '未知错误'), 'error');
        } finally {
            this._setGenerating(false);
            if (st) st.textContent = '细化完成 · 待确认';
        }
    },

    async _aiExpandOutline() {
        if (this._generating) return UI.toast('已有任务在进行中，请稍候');
        const input = document.getElementById('w-outline-chat');
        const demand = input ? input.value.trim() : '';
        if (!demand) return UI.toast('请输入修改要求', 'error');
        const outlineEl = document.getElementById('w-outline');
        const outline = outlineEl ? outlineEl.value : '';
        if (!outline.trim()) return UI.toast('请先输入本章大纲', 'error');
        
        this._setGenerating(true);
        const st = document.getElementById('w-save-status');
        if (st) st.textContent = '正在修改大纲...';
        UI.toast('AI 正在修改大纲...');
        const nexusPrefix = this._buildNexusPrefix ? await this._buildNexusPrefix(true) : '';
        const prompt = `${nexusPrefix}

你是长篇小说细纲修订工程师。按用户要求修改当前章节大纲，但输出必须仍是可直接写正文的执行级细纲。

【硬性后台规则】
- 保留未被要求改动的内容。
- 不改人物核心欲望、不改世界规则、不乱加新设定。
- 读者协议和M06只在后台执行，不得以栏目或说明文字出现在输出里。
- 输出不得出现：读者期待、读者恐惧、读者画像、读者痛点、付费点、买单、追读率、AI痕迹、内心OS、本章分析、反应涟漪、技法标签、写作目的、写作意图、M06、NEXUS、读者协议。

【输出格式】
直接输出修改后的完整大纲。优先使用：
【场次X：短标题】
- 场次目标：
- 冲突阻力：
- 动作链：
- 物件与环境反馈：
- 对话关键句：
- 人物状态变化：
- 规则/伏笔影响：
- 实体线索：
- 本场信息缺口：

【用户要求】${demand}

【当前大纲】
${outline}

只输出修改后的完整大纲，不要解释修改过程。`;

        let result = '';
        try {
            await AI.generate(prompt, { apiType: 'text', module: 'writer_outline_edit' }, c => { result += c; });
            this._showOutlineConfirm(this._sanitizeOutlineDraft(result), outlineEl ? outlineEl.value : '');
            if (input) input.value = '';
            UI.toast('大纲修改完成，请确认是否替换');
        } catch(e) {
            UI.toast('修改失败: ' + (e.message || '未知错误'), 'error');
        } finally {
            this._setGenerating(false);
            if (st) st.textContent = '修改完成 · 待确认';
        }
    },

    // 显示大纲对比确认条
    _showOutlineConfirm(newOutline, oldOutline) {
        newOutline = this._sanitizeOutlineDraft(newOutline);
        this._outlineNew = newOutline;
        const confirmBox = document.getElementById('w-outline-confirm');
        const preview = document.getElementById('w-outline-preview');
        const diff = document.getElementById('w-outline-diff');
        if (preview) preview.textContent = newOutline;
        if (diff) diff.textContent = `原${(oldOutline || '').length}字 → 新${(newOutline || '').length}字`;
        if (confirmBox) confirmBox.classList.remove('hidden');
    },

    // 采纳新大纲替换
    async _confirmOutlineReplace() {
        const outlineEl = document.getElementById('w-outline');
        if (outlineEl && this._outlineNew) {
            outlineEl.value = this._outlineNew;
            await this.saveContent();
        }
        this._hideOutlineConfirm();
        UI.toast('已替换为新大纲');
    },

    // 放弃新大纲
    _cancelOutlineReplace() {
        this._outlineNew = null;
        this._hideOutlineConfirm();
        UI.toast('已放弃，保留原大纲');
    },

    _hideOutlineConfirm() {
        const confirmBox = document.getElementById('w-outline-confirm');
        if (confirmBox) confirmBox.classList.add('hidden');
        const st = document.getElementById('w-save-status');
        if (st) st.textContent = '就绪';
    },

    // ===== 上下文Tab（融合+RAG合并） =====
    async _loadContextTab() {
        const project = await this._requireActiveProject?.({ renderGate: true });
        if (!project) return;
        const resultsEl = document.getElementById('w-ctx-results');
        const fusionSection = document.getElementById('w-ctx-fusion-section');
        const fusionContent = document.getElementById('w-ctx-fusion-content');
        const fusionLen = document.getElementById('w-ctx-fusion-len');
        
        // 加载融合技法
        const fusionCtx = this._getFusionContext();
        if (fusionCtx && fusionSection && fusionContent) {
            fusionSection.classList.remove('hidden');
            fusionContent.textContent = fusionCtx;
            if (fusionLen) fusionLen.textContent = fusionCtx.length + '字';
        } else if (fusionSection) {
            fusionSection.classList.add('hidden');
        }
        
        if (!this.currentChapterId) {
            if (resultsEl) resultsEl.innerHTML = '<div class="text-center text-dim text-xs py-4">请选择章节</div>';
            return;
        }
        
        const chap = await DB.get('chapters', this.currentChapterId);
        if (!chap) return;
        if (chap.projectId && chap.projectId !== project.id) return;
        
        // 获取关联数据
        const allChaps = this._scopeRecords(await DB.getAll('chapters') || [], project.id).sort((a,b) => (a.order||0) - (b.order||0));
        const idx = allChaps.findIndex(c => c.id === this.currentChapterId);
        const nearby = allChaps.slice(Math.max(0, idx - 2), Math.min(allChaps.length, idx + 3));
        const entities = this._scopeRecords(await DB.getAll('entities') || [], project.id);
        const worldItems = entities.filter(e => e.id.startsWith('world_'));
        const charItems = entities.filter(e => !e.id.startsWith('world_'));
        
        // 更新统计
        const entEl = document.getElementById('w-ctx-entities');
        const chapEl = document.getElementById('w-ctx-chapters');
        const worldEl = document.getElementById('w-ctx-world');
        if (entEl) entEl.textContent = charItems.length;
        if (chapEl) chapEl.textContent = nearby.length;
        if (worldEl) worldEl.textContent = worldItems.length;
        
        // 渲染结果
        let html = '';
        // 前后章节
        nearby.forEach((c, i) => {
            const isCurrent = c.id === this.currentChapterId;
            html += `<div class="p-2 rounded border ${isCurrent ? 'bg-accent/10 border-accent/30' : 'bg-black/20 border-white/5'} text-[10px]">
                <div class="flex items-center gap-1.5 ${isCurrent ? 'text-accent font-bold' : 'text-white'}">
                    ${isCurrent ? '<i class="fa-solid fa-location-dot text-[8px]"></i>' : '<i class="fa-solid fa-file-lines text-[8px] text-dim"></i>'}
                    ${this._esc(c.title)} ${isCurrent ? '(当前)' : ''}
                </div>
                <div class="text-[9px] text-dim mt-0.5">${(c.content||'').length}字 · ${c.status || 'outline'}</div>
            </div>`;
        });
        // 实体
        if (charItems.length > 0) {
            html += `<div class="text-[9px] text-dim font-bold uppercase mt-2 mb-1">关联实体</div>`;
            charItems.slice(0, 8).forEach(e => {
                html += `<div class="p-1.5 bg-black/20 rounded border border-white/5 text-[10px] flex items-center gap-1.5">
                    <span class="text-[8px] px-1 rounded bg-cyan-500/20 text-cyan-300">${e.type || '其他'}</span>
                    <span class="text-white font-bold">${this._esc(e.name)}</span>
                </div>`;
            });
        }
        // 世界观
        if (worldItems.length > 0) {
            html += `<div class="text-[9px] text-dim font-bold uppercase mt-2 mb-1">世界观</div>`;
            worldItems.slice(0, 4).forEach(e => {
                html += `<div class="p-1.5 bg-black/20 rounded border border-white/5 text-[10px]">
                    <span class="text-green-400 font-bold">${this._esc(e.name)}</span>
                    <div class="text-dim line-clamp-1">${(e.desc||'').slice(0, 40)}</div>
                </div>`;
            });
        }
        if (resultsEl) resultsEl.innerHTML = html || '<div class="text-center text-dim text-xs py-4">暂无关联数据</div>';
    },

    _clearContextTab() {
        const resultsEl = document.getElementById('w-ctx-results');
        if (resultsEl) resultsEl.innerHTML = '<div class="text-center text-dim text-xs py-4"><i class="fa-solid fa-link text-2xl mb-2 opacity-30"></i><div>已清空</div></div>';
    },

    async _searchContext() {
        const project = await this._requireActiveProject?.({ renderGate: true });
        if (!project) return;
        const input = document.getElementById('w-ctx-search');
        const query = input ? input.value.trim() : '';
        if (!query) return;
        const resultsEl = document.getElementById('w-ctx-results');
        if (resultsEl) resultsEl.innerHTML = '<div class="text-center text-dim text-xs py-4"><i class="fa-solid fa-spinner fa-spin mr-1"></i>搜索中...</div>';
        
        const entities = this._scopeRecords(await DB.getAll('entities') || [], project.id);
        const chapters = this._scopeRecords(await DB.getAll('chapters') || [], project.id);
        const matches = [];
        entities.filter(e => (e.name||'').includes(query) || (e.desc||'').includes(query)).forEach(e => matches.push({type:'实体', title:e.name, desc:(e.desc||'').slice(0,60)}));
        chapters.filter(c => (c.title||'').includes(query) || (c.content||'').includes(query) || (c.outline||'').includes(query)).forEach(c => matches.push({type:'章节', title:c.title, desc:(c.content||c.outline||'').slice(0,60)}));
        
        if (resultsEl) {
            resultsEl.innerHTML = matches.length ? matches.map(m => `<div class="p-2 bg-black/20 rounded border border-white/5 text-[10px]">
                <span class="text-[8px] px-1 rounded ${m.type==='实体'?'bg-cyan-500/20 text-cyan-300':'bg-amber-500/20 text-amber-300'}">${m.type}</span>
                <span class="text-white font-bold ml-1">${this._esc(m.title)}</span>
                <div class="text-dim mt-0.5">${this._esc(m.desc)}</div>
            </div>`).join('') : '<div class="text-center text-dim text-xs py-4">无搜索结果</div>';
        }
    },

    _ctxFilter(type) {
        this._ctxCurrentFilter = type;
        this._loadContextTab();
    },

    async _injectContextToPrompt() {
        const ctx = this._getFusionContext() || '';
        const chap = this.currentChapterId ? await DB.get('chapters', this.currentChapterId) : null;
        let inject = '[关联上下文]\n';
        if (ctx) inject += ctx.slice(0, 1500) + '\n';
        if (chap && chap.outline) inject += '[本章大纲]\n' + chap.outline.slice(0, 500) + '\n';
        
        // 存入临时设置供续写使用
        const existing = await DB.get('settings', 'writer_context_inject') || {};
        await DB.put('settings', { id: 'writer_context_inject', content: inject, updatedAt: Date.now() });
        UI.toast('关联上下文已注入续写提示');
    },

    // ===== 文风Tab =====
    _loadStyleTab() {
        // 文风Tab加载时不需要额外操作，数据已保存在DOM中
    },

    // ===== AI助手Tab =====
    _assistantSelection: '',

    _updateAssistantSelection() {
        const editor = document.getElementById('w-editor');
        const sel = editor ? editor.value.substring(editor.selectionStart, editor.selectionEnd) : '';
        this._assistantSelection = sel;
        const box = document.getElementById('w-assist-selection-box');
        const text = document.getElementById('w-assist-selection');
        const len = document.getElementById('w-assist-sel-len');
        if (sel && sel.trim()) {
            if (box) box.classList.remove('hidden');
            if (text) text.textContent = sel;
            if (len) len.textContent = sel.length + '字';
        } else {
            if (box) box.classList.add('hidden');
        }
    },

    async _runAssistant(type) {
        const project = await this._requireActiveProject?.({ renderGate: true });
        if (!project) return;
        const editor = document.getElementById('w-editor');
        const selected = this._assistantSelection || '';
        const content = editor ? editor.value : '';
        const customInput = document.getElementById('w-assist-in');
        const custom = customInput ? customInput.value.trim() : '';
        
        if (!content.trim() && !selected.trim()) return UI.toast('编辑器内容为空', 'error');
        
        const log = document.getElementById('w-assist-log');
        if (log) log.innerHTML += `<div class="p-1.5 bg-accent/10 rounded border border-accent/20"><span class="text-accent font-bold text-[9px]">操作</span><div class="text-gray-200 mt-0.5 text-[10px]">${type === 'custom' ? custom : type}</div></div>`;
        
        let instruction = '';
        switch(type) {
            case 'polish': instruction = '润色以下段落：优化句式、增强画面感、提升文采，保持原意不变。'; break;
            case 'expand': instruction = '拓展以下段落：增加细节描写、丰富感官体验、深化情绪层次，字数增加到原来的1.5-2倍。'; break;
            case 'continue': instruction = '根据上下文风格，继续写下去（约300-500字），保持节奏和人物一致性。'; break;
            case 'trim': instruction = '精简以下段落：删除冗余描述，保留核心情节和冲突，让文字更紧凑有力。'; break;
            case 'rewrite': instruction = '改写以下段落：用不同的表达方式重新组织，保留核心情节但改变叙述角度或节奏。'; break;
            case 'custom': instruction = custom || '请按用户要求处理以下内容。'; break;
        }
        
        const targetText = selected.trim() ? selected : content.slice(-1500);
        const hardRules = this._mergeStyleRules ? this._mergeStyleRules(this._getExtractedStyle?.() || '') : '';
        const proseContract = this._buildWriterProseContract ? this._buildWriterProseContract({
            title: (document.getElementById('w-title') || {}).value || '',
            hasContent: !!content.trim()
        }) : '';
        const prompt = `你是一位专业网文编辑。${instruction}

${proseContract}

【强制默认写文规则】
${hardRules}

【待处理内容】
${targetText}

【要求】
	- 直接输出处理后的文本，不要任何开场白
	- 保持原有风格和人物设定一致
	- 如果是续写，确保无缝衔接上文
	- 如果样本文风或用户要求与强制默认写文规则冲突，按强制默认规则执行`;

        let result = '';
        await AI.generate(prompt, {}, c => { result += c; });
        if (this._sanitizeEditableProse) result = this._sanitizeEditableProse(result);
        
        if (log) log.innerHTML += `<div class="p-1.5 bg-white/5 rounded border border-white/5"><span class="text-green-400 font-bold text-[9px]">AI</span><div class="text-gray-300 mt-0.5 text-[10px] leading-relaxed">${result.slice(0, 200)}${result.length > 200 ? '...' : ''}</div></div>`;
        
        // 如果选中了文本，提供替换/插入选项
        if (selected.trim() && editor) {
            if (confirm('是否用AI结果替换选中的文本？\n（取消则复制到剪贴板）')) {
                const start = editor.selectionStart;
                const end = editor.selectionEnd;
                editor.value = editor.value.substring(0, start) + result + editor.value.substring(end);
                this.onInput();
            } else {
                await navigator.clipboard.writeText(result);
                UI.toast('已复制到剪贴板');
            }
        } else if (editor) {
            // 未选中则在末尾追加
            editor.value = editor.value + '\n\n' + result;
            this.onInput();
            UI.toast('已追加到正文末尾');
        }
        
        if (customInput) customInput.value = '';
        if (log) log.scrollTop = log.scrollHeight;
    },

    _assistantClear() {
        const log = document.getElementById('w-assist-log');
        if (log) log.innerHTML = '';
        this._assistantSelection = '';
        const box = document.getElementById('w-assist-selection-box');
        if (box) box.classList.add('hidden');
    },

    // ===== 诊断Tab增强：一致性检测 =====
    async _checkConsistency() {
        const project = await this._requireActiveProject?.({ renderGate: true });
        if (!project) return;
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        if (!content.trim()) return UI.toast('编辑器内容为空', 'error');
        
        const resultEl = document.getElementById('w-diagnose-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-center text-dim py-4"><i class="fa-solid fa-spinner fa-spin text-xl mb-2"></i><div>正在检测上下文一致性...</div></div>';
        
        const allChaps = this._scopeRecords(await DB.getAll('chapters') || [], project.id).sort((a,b) => (a.order||0) - (b.order||0));
        const idx = allChaps.findIndex(c => c.id === this.currentChapterId);
        const prevChaps = allChaps.slice(Math.max(0, idx - 3), idx);
        const prevContext = prevChaps.map(c => `【${c.title}】\n${(c.content||'').slice(-500)}`).join('\n\n');
        const entities = this._scopeRecords(await DB.getAll('entities') || [], project.id);
        const entityList = entities.filter(e => !e.id.startsWith('world_')).map(e => `${e.name}(${e.type})`).join('、');
        
        const prompt = `你是一位资深网文编辑，专门负责检查小说前后一致性。请对以下内容进行深度一致性检测。

【前文回顾（最近3章末尾）】
${prevContext.slice(0, 3000)}

【当前章节正文】
${content.slice(0, 4000)}

【已登记实体】
${entityList}

【检测维度】
1. **人物一致性**：角色性格、能力、行为模式是否前后一致？是否出现OOC（out of character）？
2. **设定一致性**：世界观规则、力量体系、地理设定是否前后矛盾？
3. **时间线一致性**：事件顺序、时间跨度是否合理？
4. **伏笔回收**：前文埋下的伏笔是否被提及或回收？
5. **逻辑一致性**：剧情推进是否合理？因果关系是否成立？
6. **称谓一致性**：同一角色/地点的称呼是否统一？

【输出格式】
### 总体评分：X/10
### 问题列表（按严重程度排序）
- [严重/中等/轻微] 具体问题描述 → 修复建议
### 未发现问题的维度
### 一句话总结

请用Markdown格式输出。`;

        let result = '';
        try {
            await AI.generate(prompt, {}, c => { result += c; });
            if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
            UI.toast('一致性检测完成');
        } catch(e) {
            if (resultEl) resultEl.innerHTML = `<div class="text-red-400 text-center py-4">检测中断：${e.message}</div>`;
        }
    },

    // ===== 文风提取功能 =====
    async extractStyle() {
        if (this._generating) return;
        const sourceEl = document.getElementById('w-style-source');
        const resultEl = document.getElementById('w-style-extracted');
        if (!sourceEl || !resultEl) return;
        
        const sourceText = sourceEl.value.trim();
        if (!sourceText) return UI.toast('请先粘贴原文样例', 'error');
        if (sourceText.length < 100) return UI.toast('原文样例太短，至少需要100字', 'error');

        const prompt = this._getStyleExtractPrompt(sourceText);

        this._setGenerating(true);
        UI.toast('正在分析文风...');
        
        let result = '';
        try {
            await AI.generate(prompt, {}, c => { result += c; });
            if (result.trim()) {
                resultEl.value = this._mergeStyleRules ? this._mergeStyleRules(result.trim()) : result.trim();
                UI.toast('文风提取完成！');
            } else {
                UI.toast('提取结果为空', 'error');
            }
        } catch (e) {
            UI.toast('提取失败: ' + e.message, 'error');
        }
        
        this._setGenerating(false);
    },

    // ===== 清空文风提取 =====
    clearStyleExtract() {
        const sourceEl = document.getElementById('w-style-source');
        const resultEl = document.getElementById('w-style-extracted');
        if (sourceEl) sourceEl.value = '';
        if (resultEl) resultEl.value = '';
        UI.toast('已清空文风提取；M06/M07强制默认仍会注入续写和润色');
    },

    // ===== 打开文风提取提示词配置弹窗 =====
    openStylePromptModal() {
        // 移除已存在的弹窗
        const existing = document.getElementById('w-style-prompt-modal');
        if (existing) existing.remove();

        // 获取保存的自定义提示词
        this._stylePromptCustom = this._stylePromptCustom || '';

        const modal = document.createElement('div');
        modal.id = 'w-style-prompt-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:1000;display:flex;align-items:center;justify-content:center;';
        modal.innerHTML = `
            <div style="width:90%;max-width:700px;max-height:85vh;background:#111113;border:1px solid rgba(255,255,255,0.1);border-radius:12px;display:flex;flex-direction:column;overflow:hidden;">
                <div style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:space-between;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <i class="fa-solid fa-palette text-emerald-400"></i>
                        <span style="font-size:14px;font-weight:700;color:#fff;">文风提取提示词配置</span>
                    </div>
                    <button onclick="this.closest('#w-style-prompt-modal').remove()" style="width:28px;height:28px;border-radius:6px;background:rgba(255,255,255,0.05);border:none;color:#888;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;">×</button>
                </div>
                <div style="padding:20px;overflow-y:auto;flex:1;">
                    <div style="margin-bottom:12px;">
                        <div style="font-size:11px;color:#888;margin-bottom:6px;">自定义提取提示词（留空使用默认）</div>
                        <textarea id="w-style-prompt-input" style="width:100%;height:280px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:12px;color:#ccc;font-size:12px;font-family:monospace;resize:none;line-height:1.6;" placeholder="输入自定义的文风提取提示词...

可使用变量：
{{source}} - 原文样例

默认提示词会从以下维度分析：
1. 叙事视角
2. 语言风格
3. 句式特点
4. 修辞手法
5. 情感基调
6. 描写偏好
7. 对话风格
8. 节奏控制
9. 特色表达">${this._stylePromptCustom || ''}</textarea>
                    </div>
                    <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:8px;padding:12px;">
                        <div style="font-size:11px;color:#10b981;font-weight:600;margin-bottom:6px;"><i class="fa-solid fa-lightbulb mr-1"></i>提示</div>
                        <div style="font-size:10px;color:#888;line-height:1.6;">
                            提示词用于指导AI如何分析原文并提取文风特征。好的提示词应该明确指出需要分析的维度和输出格式。
                        </div>
                    </div>
                </div>
                <div style="padding:16px 20px;border-top:1px solid rgba(255,255,255,0.1);display:flex;gap:10px;justify-content:flex-end;">
                    <button onclick="Modules.writer._resetStylePrompt()" style="padding:8px 16px;border-radius:6px;background:rgba(255,255,255,0.05);border:none;color:#888;font-size:12px;cursor:pointer;">恢复默认</button>
                    <button onclick="Modules.writer._saveStylePrompt()" style="padding:8px 20px;border-radius:6px;background:rgba(16,185,129,0.2);border:1px solid rgba(16,185,129,0.3);color:#10b981;font-size:12px;font-weight:600;cursor:pointer;"><i class="fa-solid fa-check mr-1"></i>保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 加载保存的提示词
        this._loadStylePrompt();
    },

    // ===== 加载文风提取提示词 =====
    async _loadStylePrompt() {
        try {
            const data = await DB.get('settings', 'writer_style_prompt');
            if (data && data.prompt) {
                this._stylePromptCustom = data.prompt;
                const input = document.getElementById('w-style-prompt-input');
                if (input) input.value = data.prompt;
            }
        } catch(e) {}
    },

    // ===== 保存文风提取提示词 =====
    async _saveStylePrompt() {
        const input = document.getElementById('w-style-prompt-input');
        if (!input) return;
        this._stylePromptCustom = input.value;
        await DB.put('settings', { id: 'writer_style_prompt', prompt: input.value });
        UI.toast('提示词已保存');
        const modal = document.getElementById('w-style-prompt-modal');
        if (modal) modal.remove();
    },

    // ===== 重置文风提取提示词 =====
    _resetStylePrompt() {
        const input = document.getElementById('w-style-prompt-input');
        if (input) input.value = '';
        this._stylePromptCustom = '';
        UI.toast('已恢复默认提示词');
    },

    // ===== 获取文风提取提示词 =====
    _getStyleExtractPrompt(sourceText) {
        const customPrompt = this._stylePromptCustom || '';
        if (customPrompt.trim()) {
            return customPrompt.replace(/\{\{source\}\}/gi, sourceText.slice(0, 3000));
        }
        // 默认提示词
        return `你是一位专业的文学分析师，擅长分析文本的写作风格。请仔细分析以下原文的文风特征，并提取出可以用于指导AI写作的风格描述。

[原文]
${sourceText.slice(0, 3000)}

[强制底线]
无论样本文风如何，输出的文风指南都必须兼容并强调：M06去AI味、长篇第三人称有限、禁止第一人称视角、禁止上帝视角、动作/物件/对话优先、少解释、禁情绪标签、禁陈旧比喻、短句短段、章末钩子。

[分析要求]
请从以下维度分析并提取文风特征：
1. **叙事视角**：只判断样文视角特征；写作建议必须转换为第三人称有限，不能建议第一人称或全知视角
2. **语言风格**：华丽/朴实，文言/白话，书面/口语化
3. **句式特点**：长句为主/短句为主，排比/对仗，断句节奏
4. **修辞手法**：比喻、拟人、夸张等常用手法
5. **情感基调**：严肃/轻松，压抑/明快，冷峻/热情
6. **描写偏好**：心理描写/动作描写/环境描写的比例和深度
7. **对话风格**：对话的密度、长度、语气特点
8. **节奏控制**：情节推进速度，场景切换方式
9. **特色表达**：作者的标志性用词、句式或表达习惯

[输出格式]
请以简洁的列表形式输出，每个维度1-2句话，总字数控制在300-500字。输出内容应该能直接作为AI写作的风格指南。`;
    },

    /** 一键智能诊断：综合分析正文质量 + 技法 + 节奏 */
    async _smartDiagnose() {
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        if (!content.trim()) return UI.toast('编辑器内容为空', 'error');

        const resultEl = document.getElementById('w-diagnose-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-center text-dim py-4"><i class="fa-solid fa-spinner fa-spin text-xl mb-2"></i><div>AI 正在全面诊断...</div></div>';

        const outline = (document.getElementById('w-outline') || {}).value || '';
        const fusionCtx = this._getFusionContext();
        const wordCount = content.length;

        const prompt = `你是一位资深网文编辑+读者体验分析师。请对以下内容进行「一键全面诊断」，输出必须实用、具体、可操作。

【章节信息】
字数：${wordCount} 字
大纲：${outline.slice(0, 500) || '无'}

【正文内容】
${content.slice(0, 6000)}

${fusionCtx ? `【融合技法参考】\n${fusionCtx.slice(0, 1500)}\n` : ''}

【诊断框架 — 请按以下5个维度输出】

### 1️⃣ 开篇吸引力（0-10分）
- 前200字是否能抓住读者？
- 问题与改进建议

### 2️⃣ 节奏与情绪（0-10分）
- 标注情绪高低点（一句话概括每200字的情绪）
- 是否有拖沓或跳脱？
- 爽点/钩子密度是否足够？

### 3️⃣ 描写质量（0-10分）
- 五感运用（视/听/嗅/味/触）
- 画面感强弱
- 是否有" telling 过多 "的问题？

### 4️⃣ 剧情结构（0-10分）
- 起承转合是否清晰
- 伏笔/悬念设置
- 与大纲的契合度

### 5️⃣ 综合评分与改进优先级
- 总分：/50
- Top 3 最优先改进点（具体到段落位置）
- 一句话总结：本章最大的亮点 + 最大的短板

请用清晰的Markdown格式输出。避免空泛评价，每个扣分点都要给出"怎么改"。`;

        let result = '';
        try {
            await AI.generate(prompt, {}, c => { result += c; });
            if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
            UI.toast('诊断完成');
        } catch(e) {
            if (resultEl) resultEl.innerHTML = `<div class="text-red-400 text-center py-4">诊断中断：${e.message}</div>`;
        }
    },

    /** 自定义需求诊断：用户输入自然语言指令 */
    async _customDiagnose() {
        const input = document.getElementById('w-diagnose-custom');
        const demand = input ? input.value.trim() : '';
        if (!demand) return UI.toast('请输入分析需求', 'error');

        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        if (!content.trim()) return UI.toast('编辑器内容为空', 'error');

        const resultEl = document.getElementById('w-diagnose-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-center text-dim py-4"><i class="fa-solid fa-spinner fa-spin text-xl mb-2"></i><div>正在分析「' + demand + '」...</div></div>';

        const outline = (document.getElementById('w-outline') || {}).value || '';
        const fusionCtx = this._getFusionContext();

        const prompt = `你是一位资深网文分析师。用户提出了以下分析需求：

【用户指令】
${demand}

【章节大纲】
${outline.slice(0, 1000) || '无'}

【正文内容】
${content.slice(0, 6000)}

${fusionCtx ? `【融合技法参考】\n${fusionCtx.slice(0, 1500)}\n` : ''}

【要求】
请严格按照用户的需求进行分析。输出要实用、具体、可操作。如果用户的问题不明确，请给出你最专业的解读。用 Markdown 格式输出。`;

        let result = '';
        try {
            await AI.generate(prompt, {}, c => { result += c; });
            if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
            UI.toast('分析完成');
            if (input) input.value = '';
        } catch(e) {
            if (resultEl) resultEl.innerHTML = `<div class="text-red-400 text-center py-4">分析中断：${e.message}</div>`;
        }
    },

    openSoloPromptModal() {
        const modal = document.createElement('div');
        modal.id = 'w-solo-prompt-modal';
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-[#1a1a2e] rounded-2xl border border-white/10 w-[700px] max-h-[85vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-5 py-3 border-b border-white/5">
                    <span class="font-bold text-white"><i class="fa-solid fa-wand-magic-sparkles mr-2 text-purple-400"></i>SOLO 自定义提示词</span>
                    <button class="text-dim hover:text-white" onclick="this.closest('#w-solo-prompt-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto p-5 space-y-4">
                    <div class="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <div class="text-sm font-bold text-purple-300 mb-1">自定义提示词模板</div>
                        <div class="text-[10px] text-dim">保存常用提示词，一键执行分析任务。支持变量：{{content}} = 当前正文，{{outline}} = 章节大纲</div>
                    </div>
                    
                    <div>
                        <div class="text-[10px] text-dim font-bold uppercase mb-1">提示词名称</div>
                        <input type="text" id="w-solo-name" class="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white" placeholder="例如：人物关系分析、场景描写优化...">
                    </div>
                    
                    <div>
                        <div class="text-[10px] text-dim font-bold uppercase mb-1">提示词内容</div>
                        <textarea id="w-solo-prompt" class="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-white min-h-[200px] font-mono" placeholder="输入你的自定义提示词...&#10;&#10;可用变量：&#10;{{content}} - 当前编辑器正文&#10;{{outline}} - 当前章节大纲&#10;{{title}} - 当前章节标题"></textarea>
                    </div>
                    
                    <div class="text-[10px] text-dim font-bold uppercase">已保存的提示词</div>
                    <div id="w-solo-saved-list" class="space-y-2 max-h-40 overflow-y-auto">
                        <div class="text-dim text-xs text-center py-2">加载中...</div>
                    </div>
                </div>
                <div class="flex gap-2 p-4 border-t border-white/5">
                    <button class="btn btn-primary flex-1" onclick="Modules.writer._saveSoloPrompt()"><i class="fa-solid fa-floppy-disk mr-1"></i>保存提示词</button>
                    <button class="btn bg-purple-600/20 text-purple-400 border-purple-600/30 flex-1" onclick="Modules.writer._runSoloPrompt()"><i class="fa-solid fa-play mr-1"></i>立即执行</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this._loadSoloPrompts();
    },

    async _loadSoloPrompts() {
        const listEl = document.getElementById('w-solo-saved-list');
        if (!listEl) return;
        
        try {
            const saved = await DB.get('settings', 'writer_solo_prompts') || { prompts: [] };
            const prompts = saved.prompts || [];
            
            if (prompts.length === 0) {
                listEl.innerHTML = '<div class="text-dim text-xs text-center py-2">暂无保存的提示词</div>';
                return;
            }
            
            listEl.innerHTML = prompts.map((p, i) => `
                <div class="flex items-center gap-2 p-2 bg-black/20 rounded-lg border border-white/5">
                    <span class="flex-1 text-xs text-white truncate">${p.name}</span>
                    <button class="text-purple-400 hover:text-purple-300 text-xs" onclick="Modules.writer._useSoloPrompt(${i})"><i class="fa-solid fa-play"></i></button>
                    <button class="text-dim hover:text-white text-xs" onclick="Modules.writer._editSoloPrompt(${i})"><i class="fa-solid fa-pen"></i></button>
                    <button class="text-red-400 hover:text-red-300 text-xs" onclick="Modules.writer._delSoloPrompt(${i})"><i class="fa-solid fa-trash"></i></button>
                </div>
            `).join('');
        } catch (e) {
            listEl.innerHTML = '<div class="text-dim text-xs text-center py-2">加载失败</div>';
        }
    },

    async _saveSoloPrompt() {
        const nameEl = document.getElementById('w-solo-name');
        const promptEl = document.getElementById('w-solo-prompt');
        const name = nameEl?.value?.trim();
        const prompt = promptEl?.value?.trim();
        
        if (!name || !prompt) return UI.toast('请填写名称和提示词', 'error');
        
        try {
            const saved = await DB.get('settings', 'writer_solo_prompts') || { prompts: [] };
            saved.prompts = saved.prompts || [];
            saved.prompts.push({ name, prompt, createdAt: Date.now() });
            await DB.put('settings', saved);
            UI.toast('提示词已保存');
            this._loadSoloPrompts();
            nameEl.value = '';
            promptEl.value = '';
        } catch (e) {
            UI.toast('保存失败', 'error');
        }
    },

    async _useSoloPrompt(index) {
        try {
            const saved = await DB.get('settings', 'writer_solo_prompts') || { prompts: [] };
            const prompt = saved.prompts?.[index];
            if (!prompt) return UI.toast('提示词不存在', 'error');
            
            const nameEl = document.getElementById('w-solo-name');
            const promptEl = document.getElementById('w-solo-prompt');
            if (nameEl) nameEl.value = prompt.name;
            if (promptEl) promptEl.value = prompt.prompt;
            
            UI.toast('已加载提示词: ' + prompt.name);
        } catch (e) {
            UI.toast('加载失败', 'error');
        }
    },

    async _editSoloPrompt(index) {
        await this._useSoloPrompt(index);
        await this._delSoloPrompt(index);
    },

    async _delSoloPrompt(index) {
        if (!confirm('确定删除此提示词？')) return;
        
        try {
            const saved = await DB.get('settings', 'writer_solo_prompts') || { prompts: [] };
            saved.prompts?.splice(index, 1);
            await DB.put('settings', saved);
            UI.toast('已删除');
            this._loadSoloPrompts();
        } catch (e) {
            UI.toast('删除失败', 'error');
        }
    },

    async _runSoloPrompt() {
        const promptEl = document.getElementById('w-solo-prompt');
        let promptText = promptEl?.value?.trim();
        
        if (!promptText) return UI.toast('请输入提示词', 'error');
        
        const editor = document.getElementById('w-editor');
        const content = editor?.value || '';
        const outline = (document.getElementById('w-outline') || {}).value || '';
        const title = (document.getElementById('w-title') || {}).value || '';
        
        promptText = promptText
            .replace(/\{\{content\}\}/g, content.slice(0, 6000))
            .replace(/\{\{outline\}\}/g, outline.slice(0, 2000))
            .replace(/\{\{title\}\}/g, title);
        const hardRules = this._mergeStyleRules ? this._mergeStyleRules(this._getExtractedStyle?.() || '') : '';
        const proseContract = this._buildWriterProseContract ? this._buildWriterProseContract({
            title,
            hasContent: !!content.trim()
        }) : '';
        promptText = `${promptText}

【强制默认写文底线】
如果上面的自定义提示词要求续写、润色、改写、扩写或生成小说正文，必须遵守以下规则；若只是诊断/分析，可只把规则作为审稿标准。
${proseContract}

${hardRules}`;
        
        const modal = document.getElementById('w-solo-prompt-modal');
        if (modal) modal.remove();
        
        const resultEl = document.getElementById('w-diagnose-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-center text-dim py-4"><i class="fa-solid fa-spinner fa-spin text-xl mb-2"></i><div>正在执行...</div></div>';
        
        this.tab('diagnose');
        
        let result = '';
        await AI.generate(promptText, {}, c => { result += c; });
        
        if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
        UI.toast('执行完成');
    },

    _formatMarkdown(text) {
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/^### (.+)$/gm, '<h4 class="text-accent font-bold mt-4 mb-2">$1</h4>')
            .replace(/^## (.+)$/gm, '<h3 class="text-white font-bold mt-4 mb-2">$1</h3>')
            .replace(/^# (.+)$/gm, '<h2 class="text-accent font-bold text-lg mt-4 mb-2">$1</h2>')
            .replace(/^- (.+)$/gm, '<li class="ml-4 text-dim">$1</li>')
            .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 text-dim"><span class="text-accent">$1.</span> $2</li>')
            .replace(/\n/g, '<br>');
    },

    _copyDiagnoseResult() {
        const resultEl = document.getElementById('w-diagnose-result');
        if (!resultEl) return;
        const text = resultEl.innerText || resultEl.textContent;
        Utils.copy(text);
        UI.toast('已复制结果');
    },

    _clearDiagnoseResult() {
        const resultEl = document.getElementById('w-diagnose-result');
        if (resultEl) {
            resultEl.innerHTML = `<div class="text-center text-dim py-8">
                <i class="fa-solid fa-stethoscope text-3xl mb-3 opacity-30"></i>
                <div>点击上方按钮进行诊断或分析</div>
                <div class="text-[10px] mt-1">支持内容诊断、深度分析、总结概述、自定义SOLO提示词</div>
            </div>`;
        }
        UI.toast('已清空');
    },

    async _syncToWorldEngine() {
        if (this.saveAndSync) return this.saveAndSync({ source: 'sync_world_button' });
        UI.toast('保存同步模块未加载', 'error');
    },
});
