/**
 * 融合拆书工作台 — 结果展示与管理
 * Modules.fusion_workbench
 * 
 * 独立导航页面，用于浏览、管理和导出融合拆书产生的全部结果。
 * 数据来源：settings / outlines / writings / entities / vectors
 */
Modules.fusion_workbench = {
    activeTab: 'overview',
    _data: {},
    _search: '',
    _loading: false,
    _pollTimer: null,

    render() {
        const FW = this;
        const tabs = [
            { id: 'overview', icon: 'fa-chart-pie', text: '总览', color: 'text-purple-400' },
            { id: 'analysis', icon: 'fa-magnifying-glass', text: '技法拆解', color: 'text-blue-400' },
            { id: 'compare', icon: 'fa-code-compare', text: '对比分析', color: 'text-amber-400' },
            { id: 'fusion', icon: 'fa-wand-magic-sparkles', text: '融合精华', color: 'text-green-400' },
            { id: 'outline', icon: 'fa-list-check', text: '融合细纲', color: 'text-cyan-400' },
            { id: 'entity', icon: 'fa-cubes', text: '实体库', color: 'text-pink-400' },
            { id: 'write', icon: 'fa-feather-pointed', text: '正文创作', color: 'text-orange-400' },
            { id: 'cycle', icon: 'fa-arrows-spin', text: '循环总结', color: 'text-indigo-400' }
        ];
        return `
        <div class="flex h-full bg-[#08080a] overflow-hidden" id="fw-container">
            <!-- 左侧导航 -->
            <div class="w-56 shrink-0 flex flex-col bg-[#0e0e10] border-r border-white/5">
                <div class="p-4 border-b border-white/5 bg-gradient-to-r from-green-900/20 to-transparent">
                    <div class="flex items-center gap-2">
                        <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex center text-white text-sm shadow-lg shadow-green-500/20">
                            <i class="fa-solid fa-book-open-reader"></i>
                        </div>
                        <div>
                            <div class="font-bold text-white text-sm">拆书工作台</div>
                            <div class="text-[10px] text-dim">融合结果 · 统一管理</div>
                        </div>
                    </div>
                </div>
                <div class="p-2 space-y-1 overflow-y-auto">
                    ${tabs.map(t => {
                        const count = FW._getTabCount(t.id);
                        return `
                        <button class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-bold transition-all ${FW.activeTab === t.id ? 'bg-white/10 text-white border border-white/10' : 'text-dim hover:bg-white/5 border border-transparent'}" onclick="Modules.fusion_workbench.switchTab('${t.id}')">
                            <div class="flex items-center gap-2.5">
                                <i class="fa-solid ${t.icon} ${t.color} w-4 text-center"></i>
                                <span>${t.text}</span>
                            </div>
                            ${count > 0 ? `<span class="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-dim font-mono">${count}</span>` : ''}
                        </button>`;
                    }).join('')}
                </div>
                <div class="mt-auto p-3 border-t border-white/5 space-y-1.5">
                    <button class="btn btn-xs w-full bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.fusion_workbench.refresh()">
                        <i class="fa-solid fa-rotate mr-1"></i>刷新数据
                    </button>
                    <button class="btn btn-xs w-full bg-white/5 text-dim" onclick="Modules.fusion_workbench.exportAll()">
                        <i class="fa-solid fa-download mr-1"></i>导出全部
                    </button>
                    <button class="btn btn-xs w-full bg-red-600/10 text-red-400 border-red-600/20 hover:bg-red-600/20" onclick="Modules.fusion_workbench.clearAll()">
                        <i class="fa-solid fa-trash mr-1"></i>清空结果
                    </button>
                </div>
            </div>
            <!-- 右侧工作区 -->
            <div class="flex-1 flex flex-col min-w-0">
                <!-- 顶部工具栏 -->
                <div class="h-10 shrink-0 flex items-center justify-between px-4 bg-[#0e0e10] border-b border-white/5">
                    <div class="flex items-center gap-2 text-xs text-dim">
                        <i class="fa-solid fa-folder-open text-green-400"></i>
                        <span id="fw-status">${FW._loading ? '加载中...' : '就绪'}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="relative">
                            <i class="fa-solid fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-dim"></i>
                            <input type="text" placeholder="搜索..." value="${FW._search}" 
                                class="pl-7 pr-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-dim focus:outline-none focus:border-green-500/50 w-48"
                                oninput="Modules.fusion_workbench._search = this.value; Modules.fusion_workbench._renderWorkspace();">
                        </div>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto p-5" id="fw-workspace">
                    ${FW._renderTab()}
                </div>
            </div>
        </div>`;
    },

    init() {
        this.refresh();
        this._startPoll();
    },

    _startPoll() {
        this._stopPoll();
        this._pollTimer = setInterval(() => {
            // 如果总览页面可见，刷新监控卡片
            if (this.activeTab === 'overview') {
                const monitor = document.getElementById('fw-pipeline-monitor');
                if (monitor) monitor.innerHTML = this._renderPipelineMonitorInner();
            }
        }, 500);
    },

    _stopPoll() {
        if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
    },

    async refresh() {
        this._loading = true;
        this._renderWorkspace();
        try {
            await this._loadAllData();
        } catch(e) {
            console.error('拆书工作台加载失败:', e);
        }
        this._loading = false;
        this._renderWorkspace();
    },

    // ───────────────────────────────────────────
    // 数据加载
    // ───────────────────────────────────────────
    async _loadAllData() {
        const d = this._data = {};

        // 1. 全局融合上下文
        try { d.fusionContext = await DB.get('settings', 'pipeline_fusion_context'); } catch(e) {}

        // 2. 技法拆解 (cycle_* 存储的分析结果)
        d.analysis = [];
        try {
            const all = await DB.getAll('settings');
            if (all) {
                d.analysis = all.filter(x => x.id && x.id.startsWith('cycle_') && !x.id.includes('_fusion_') && !x.id.includes('_patterns_'));
            }
        } catch(e) {}

        // 3. 循环融合总结
        d.cycles = [];
        try {
            const all = await DB.getAll('settings');
            if (all) {
                d.cycles = all.filter(x => x.id && x.id.startsWith('cycle_fusion_'));
            }
        } catch(e) {}

        // 4. 融合细纲 (outlines store)
        d.outlines = [];
        try {
            const all = await DB.getAll('outlines');
            if (all) d.outlines = all.filter(x => x.source === 'pipeline' || x.id?.startsWith('fusion_outline_'));
        } catch(e) {}

        // 5. 正文创作 (writings store)
        d.writings = [];
        try {
            const all = await DB.getAll('writings');
            if (all) d.writings = all.filter(x => x.id?.startsWith('fusion_write_'));
        } catch(e) {}

        // 6. 实体库
        d.entities = [];
        try {
            const all = await DB.getAll('entities');
            if (all) d.entities = all;
        } catch(e) {}

        // 7. 世界引擎循环数据
        d.worldCycles = [];
        try {
            const all = await DB.getAll('settings');
            if (all) {
                d.worldCycles = all.filter(x => x.id && x.id.startsWith('cycle_') && typeof x.cycleNum !== 'undefined');
            }
        } catch(e) {}
    },

    // ───────────────────────────────────────────
    // Tab 切换
    // ───────────────────────────────────────────
    switchTab(id) {
        this.activeTab = id;
        const container = document.getElementById('fw-container');
        if (container) {
            // 只重新渲染右侧工作区，保留左侧导航状态
            const ws = document.getElementById('fw-workspace');
            if (ws) ws.innerHTML = this._renderTab();
            // 更新导航激活状态
            const buttons = container.querySelectorAll('button[onclick^="Modules.fusion_workbench.switchTab"]');
            buttons.forEach(btn => {
                const match = btn.getAttribute('onclick').match(/switchTab\('(.+?)'\)/);
                const tabId = match ? match[1] : '';
                const isActive = tabId === id;
                btn.className = `w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-bold transition-all ${isActive ? 'bg-white/10 text-white border border-white/10' : 'text-dim hover:bg-white/5 border border-transparent'}`;
            });
        }
    },

    _renderWorkspace() {
        const ws = document.getElementById('fw-workspace');
        if (ws) ws.innerHTML = this._renderTab();
        const status = document.getElementById('fw-status');
        if (status) status.textContent = this._loading ? '加载中...' : `共 ${this._getTotalCount()} 条记录`;
    },

    _getTabCount(tabId) {
        const d = this._data || {};
        switch(tabId) {
            case 'overview': return this._getTotalCount();
            case 'analysis': return (d.analysis || []).length;
            case 'compare': return d.fusionContext?.content ? 1 : 0;
            case 'fusion': return (d.cycles || []).length + (d.fusionContext?.content ? 1 : 0);
            case 'outline': return (d.outlines || []).length;
            case 'entity': return (d.entities || []).length;
            case 'write': return (d.writings || []).length;
            case 'cycle': return (d.worldCycles || []).length;
            default: return 0;
        }
    },

    _getTotalCount() {
        const d = this._data || {};
        return (d.analysis || []).length + (d.cycles || []).length + (d.outlines || []).length +
               (d.writings || []).length + (d.entities || []).length + (d.worldCycles || []).length +
               (d.fusionContext?.content ? 1 : 0);
    },

    // ───────────────────────────────────────────
    // 各 Tab 渲染
    // ───────────────────────────────────────────
    _renderTab() {
        if (this._loading) return `<div class="flex center h-full text-dim text-sm animate-pulse"><i class="fa-solid fa-spinner fa-spin mr-2"></i>加载数据中...</div>`;
        switch(this.activeTab) {
            case 'overview': return this._renderOverview();
            case 'analysis': return this._renderAnalysis();
            case 'compare': return this._renderCompare();
            case 'fusion': return this._renderFusion();
            case 'outline': return this._renderOutline();
            case 'entity': return this._renderEntity();
            case 'write': return this._renderWrite();
            case 'cycle': return this._renderCycle();
            default: return `<div class="flex center h-full text-dim">未实现</div>`;
        }
    },

    // ── 总览 ──
    _renderOverview() {
        const d = this._data || {};
        const stats = [
            { label: '技法拆解', count: (d.analysis || []).length, icon: 'fa-magnifying-glass', color: 'blue' },
            { label: '对比分析', count: d.fusionContext?.content ? 1 : 0, icon: 'fa-code-compare', color: 'amber' },
            { label: '融合精华', count: (d.cycles || []).length + (d.fusionContext?.content ? 1 : 0), icon: 'fa-wand-magic-sparkles', color: 'green' },
            { label: '融合细纲', count: (d.outlines || []).length, icon: 'fa-list-check', color: 'cyan' },
            { label: '实体数量', count: (d.entities || []).length, icon: 'fa-cubes', color: 'pink' },
            { label: '正文创作', count: (d.writings || []).length, icon: 'fa-feather-pointed', color: 'orange' },
            { label: '循环总结', count: (d.worldCycles || []).length, icon: 'fa-arrows-spin', color: 'indigo' }
        ];
        const totalChars = [
            d.fusionContext?.content?.length || 0,
            ...(d.cycles || []).map(x => x.content?.length || 0),
            ...(d.outlines || []).map(x => x.content?.length || 0),
            ...(d.writings || []).map(x => x.content?.length || 0),
            ...(d.analysis || []).map(x => x.content?.length || 0)
        ].reduce((a, b) => a + b, 0);

        return `
        <div class="space-y-5">
            <!-- 流水线实时监控 -->
            <div id="fw-pipeline-monitor">
                ${this._renderPipelineMonitorInner()}
            </div>
            <!-- 统计卡片 -->
            <div class="grid grid-cols-4 gap-3">
                ${stats.map(s => `
                <div class="bg-[#0e0e10] rounded-xl border border-white/5 p-4 hover:border-${s.color}-500/30 transition-all cursor-pointer" onclick="Modules.fusion_workbench.switchTab('${s.label === '技法拆解' ? 'analysis' : s.label === '对比分析' ? 'compare' : s.label === '融合精华' ? 'fusion' : s.label === '融合细纲' ? 'outline' : s.label === '实体数量' ? 'entity' : s.label === '正文创作' ? 'write' : 'cycle'}')">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-7 h-7 rounded-lg bg-${s.color}-500/10 flex center">
                            <i class="fa-solid ${s.icon} text-${s.color}-400 text-xs"></i>
                        </div>
                        <span class="text-[10px] text-dim font-bold uppercase">${s.label}</span>
                    </div>
                    <div class="text-2xl font-bold text-white font-mono">${s.count}</div>
                </div>
                `).join('')}
            </div>
            <!-- 全局信息 -->
            <div class="bg-[#0e0e10] rounded-xl border border-white/5 p-5">
                <div class="flex items-center gap-2 mb-4">
                    <i class="fa-solid fa-database text-green-400"></i>
                    <span class="text-sm font-bold text-white">数据总览</span>
                </div>
                <div class="grid grid-cols-3 gap-4 text-xs">
                    <div class="space-y-1">
                        <div class="text-dim">总记录数</div>
                        <div class="text-lg font-bold text-white font-mono">${this._getTotalCount()}</div>
                    </div>
                    <div class="space-y-1">
                        <div class="text-dim">总字数</div>
                        <div class="text-lg font-bold text-white font-mono">${(totalChars / 10000).toFixed(1)}万</div>
                    </div>
                    <div class="space-y-1">
                        <div class="text-dim">实体类型分布</div>
                        <div class="text-lg font-bold text-white font-mono">${Object.keys(this._groupEntitiesByType()).length}类</div>
                    </div>
                </div>
            </div>
            <!-- 最近活动 -->
            <div class="bg-[#0e0e10] rounded-xl border border-white/5 p-5">
                <div class="flex items-center gap-2 mb-4">
                    <i class="fa-solid fa-clock-rotate-left text-blue-400"></i>
                    <span class="text-sm font-bold text-white">最近更新</span>
                </div>
                <div class="space-y-2">
                    ${this._getRecentActivity().slice(0, 8).map(a => `
                    <div class="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] border border-white/5">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid ${a.icon} text-${a.color}-400 text-[10px]"></i>
                            <span class="text-xs text-gray-300">${a.title}</span>
                        </div>
                        <span class="text-[10px] text-dim font-mono">${a.time}</span>
                    </div>
                    `).join('') || '<div class="text-xs text-dim py-4 text-center">暂无记录</div>'}
                </div>
            </div>
        </div>`;
    },

    _getRecentActivity() {
        const d = this._data || {};
        const items = [];
        const now = Date.now();
        const fmt = ts => {
            if (!ts) return '-';
            const diff = now - ts;
            if (diff < 60000) return '刚刚';
            if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
            if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
            return Math.floor(diff / 86400000) + '天前';
        };
        if (d.fusionContext?.updatedAt) items.push({ title: '融合精华上下文', time: fmt(d.fusionContext.updatedAt), _ts: d.fusionContext.updatedAt, icon: 'fa-wand-magic-sparkles', color: 'green' });
        (d.cycles || []).forEach(c => items.push({ title: `循环总结: ${c.id.replace('cycle_fusion_', '')}`, time: fmt(c.createdAt), _ts: c.createdAt, icon: 'fa-arrows-spin', color: 'indigo' }));
        (d.outlines || []).forEach(o => items.push({ title: o.title || '融合细纲', time: fmt(o.createdAt), _ts: o.createdAt, icon: 'fa-list-check', color: 'cyan' }));
        (d.writings || []).forEach(w => items.push({ title: w.title || '融合正文', time: fmt(w.createdAt), _ts: w.createdAt, icon: 'fa-feather-pointed', color: 'orange' }));
        (d.analysis || []).forEach(a => items.push({ title: `技法拆解: ${a.id.replace('cycle_', '')}`, time: fmt(a.createdAt), _ts: a.createdAt, icon: 'fa-magnifying-glass', color: 'blue' }));
        return items.sort((a, b) => (a._ts || 0) - (b._ts || 0));
    },

    // ── 技法拆解 ──
    _renderAnalysis() {
        const items = (this._data?.analysis || []).filter(x => this._matchesSearch(x.id + (x.content || '')));
        if (!items.length) return this._emptyState('暂无技法拆解结果', 'fa-magnifying-glass', 'blue');
        return `
        <div class="space-y-3">
            <div class="text-xs text-dim mb-2">共 ${items.length} 条记录</div>
            ${items.map((item, i) => `
            <div class="bg-[#0e0e10] rounded-xl border border-white/5 overflow-hidden">
                <div class="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/5 cursor-pointer" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">#${i + 1}</span>
                        <span class="text-xs font-bold text-white">${this._fmtCycleId(item.id)}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] text-dim font-mono">${(item.content || '').length}字</span>
                        <i class="fa-solid fa-chevron-down text-dim text-[10px]"></i>
                    </div>
                </div>
                <div class="hidden p-4 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto" id="fw-analysis-${i}">
                    ${typeof marked !== 'undefined' ? marked.parse(item.content || '') : (item.content || '')}
                </div>
            </div>
            `).join('')}
        </div>`;
    },

    // ── 对比分析 ──
    _renderCompare() {
        const ctx = this._data?.fusionContext;
        if (!ctx?.content) return this._emptyState('暂无对比分析结果', 'fa-code-compare', 'amber');
        // 提取对比部分（通常位于融合上下文的前部或标记为对比的部分）
        const content = ctx.content || '';
        const compareMatch = content.match(/(?:对比分析|技法差异|对比结果)[\s\S]*?(?=(?:融合精华|循环总结|细纲|$))/i);
        const displayContent = compareMatch ? compareMatch[0] : content.slice(0, 8000);
        return `
        <div class="bg-[#0e0e10] rounded-xl border border-white/5 overflow-hidden">
            <div class="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-white/5">
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-code-compare text-amber-400"></i>
                    <span class="text-sm font-bold text-white">对比分析</span>
                </div>
                <div class="flex gap-1">
                    <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.fusion_workbench._copyText('${this._escapeAttr(displayContent)}')">复制</button>
                    <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.fusion_workbench._download('对比分析.txt', '${this._escapeAttr(displayContent)}')">下载</button>
                </div>
            </div>
            <div class="p-5 text-sm text-gray-300 leading-loose whitespace-pre-wrap max-h-[calc(100vh-200px)] overflow-y-auto">
                ${typeof marked !== 'undefined' ? marked.parse(displayContent) : displayContent}
            </div>
        </div>`;
    },

    // ── 融合精华 ──
    _renderFusion() {
        const d = this._data || {};
        const cycles = (d.cycles || []).filter(x => this._matchesSearch(x.id + (x.content || '')));
        const hasGlobal = d.fusionContext?.content;
        if (!hasGlobal && !cycles.length) return this._emptyState('暂无融合精华', 'fa-wand-magic-sparkles', 'green');
        let html = '<div class="space-y-4">';
        if (hasGlobal) {
            const ctx = d.fusionContext;
            html += `
            <div class="bg-[#0e0e10] rounded-xl border border-white/5 overflow-hidden">
                <div class="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-white/5">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-star text-green-400"></i>
                        <span class="text-sm font-bold text-white">全局融合精华</span>
                    </div>
                    <span class="text-[10px] text-dim font-mono">${(ctx.content || '').length}字</span>
                </div>
                <div class="p-5 text-sm text-gray-300 leading-loose whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                    ${typeof marked !== 'undefined' ? marked.parse(ctx.content.slice(0, 5000)) : ctx.content.slice(0, 5000)}
                </div>
            </div>`;
        }
        html += cycles.map((c, i) => `
            <div class="bg-[#0e0e10] rounded-xl border border-white/5 overflow-hidden">
                <div class="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/5 cursor-pointer" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-mono">循环${i + 1}</span>
                        <span class="text-xs font-bold text-white">${c.id.replace('cycle_fusion_', '第').replace('_', '-')}章</span>
                    </div>
                    <span class="text-[10px] text-dim font-mono">${(c.content || '').length}字</span>
                </div>
                <div class="hidden p-4 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                    ${typeof marked !== 'undefined' ? marked.parse(c.content || '') : (c.content || '')}
                </div>
            </div>
        `).join('');
        html += '</div>';
        return html;
    },

    // ── 融合细纲 ──
    _renderOutline() {
        const items = (this._data?.outlines || []).filter(x => this._matchesSearch(x.title + (x.content || '')));
        if (!items.length) return this._emptyState('暂无融合细纲', 'fa-list-check', 'cyan');
        return `
        <div class="space-y-3">
            ${items.map((item, i) => `
            <div class="bg-[#0e0e10] rounded-xl border border-white/5 overflow-hidden">
                <div class="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/5 cursor-pointer" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">#${i + 1}</span>
                        <span class="text-xs font-bold text-white">${item.title || '未命名细纲'}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] text-dim font-mono">${(item.content || '').length}字</span>
                        <i class="fa-solid fa-chevron-down text-dim text-[10px]"></i>
                    </div>
                </div>
                <div class="hidden p-4 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                    ${typeof marked !== 'undefined' ? marked.parse(item.content || '') : (item.content || '')}
                </div>
            </div>
            `).join('')}
        </div>`;
    },

    // ── 实体库 ──
    _renderEntity() {
        const entities = (this._data?.entities || []).filter(e => this._matchesSearch(e.name + (e.desc || '') + (e.type || '')));
        if (!entities.length) return this._emptyState('暂无实体', 'fa-cubes', 'pink');
        const grouped = this._groupEntitiesByType();
        const types = Object.keys(grouped).sort();
        return `
        <div class="space-y-5">
            <!-- 类型筛选标签 -->
            <div class="flex flex-wrap gap-1.5">
                ${types.map(t => `
                <span class="px-2 py-1 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 text-[10px] font-bold">${t} (${grouped[t].length})</span>
                `).join('')}
            </div>
            <!-- 实体卡片网格 -->
            <div class="grid grid-cols-2 gap-3">
                ${entities.map((e, i) => `
                <div class="bg-[#0e0e10] rounded-xl border border-white/5 p-4 hover:border-pink-500/30 transition-all">
                    <div class="flex items-start justify-between mb-2">
                        <div>
                            <div class="text-sm font-bold text-white">${e.name}</div>
                            <div class="text-[10px] text-pink-400 mt-0.5">${e.type || '其他'}</div>
                        </div>
                        ${e.chapterRef ? `<span class="text-[9px] text-dim bg-white/5 px-1.5 py-0.5 rounded">第${e.chapterRef.join(',')}章</span>` : ''}
                    </div>
                    <div class="text-xs text-gray-400 leading-relaxed mb-2" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${e.desc || e.description || '暂无描述'}</div>
                    ${e.relations?.length ? `
                    <div class="flex flex-wrap gap-1">
                        ${e.relations.slice(0, 5).map(r => `<span class="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-dim">${r}</span>`).join('')}
                        ${e.relations.length > 5 ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-dim">+${e.relations.length - 5}</span>` : ''}
                    </div>` : ''}
                </div>
                `).join('')}
            </div>
        </div>`;
    },

    _groupEntitiesByType() {
        const grouped = {};
        (this._data?.entities || []).forEach(e => {
            const t = e.type || '其他';
            if (!grouped[t]) grouped[t] = [];
            grouped[t].push(e);
        });
        return grouped;
    },

    // ── 正文创作 ──
    _renderWrite() {
        const items = (this._data?.writings || []).filter(x => this._matchesSearch(x.title + (x.content || '')));
        if (!items.length) return this._emptyState('暂无正文创作', 'fa-feather-pointed', 'orange');
        return `
        <div class="space-y-3">
            ${items.map((item, i) => `
            <div class="bg-[#0e0e10] rounded-xl border border-white/5 overflow-hidden">
                <div class="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/5 cursor-pointer" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 font-mono">#${i + 1}</span>
                        <span class="text-xs font-bold text-white">${item.title || '未命名正文'}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] text-dim font-mono">${(item.content || '').length}字</span>
                        <i class="fa-solid fa-chevron-down text-dim text-[10px]"></i>
                    </div>
                </div>
                <div class="hidden p-4 text-sm text-gray-300 leading-loose whitespace-pre-wrap max-h-[500px] overflow-y-auto font-serif">
                    ${typeof marked !== 'undefined' ? marked.parse(item.content || '') : (item.content || '')}
                </div>
            </div>
            `).join('')}
        </div>`;
    },

    // ── 循环总结 ──
    _renderCycle() {
        const items = (this._data?.worldCycles || []).filter(x => this._matchesSearch(x.id + (x.content || '')));
        if (!items.length) return this._emptyState('暂无循环总结', 'fa-arrows-spin', 'indigo');
        return `
        <div class="space-y-3">
            ${items.map((item, i) => `
            <div class="bg-[#0e0e10] rounded-xl border border-white/5 overflow-hidden">
                <div class="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/5 cursor-pointer" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">循环${item.cycleNum || i + 1}</span>
                        <span class="text-xs font-bold text-white">第${item.startChapter || '?'}-${item.endChapter || '?'}章</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] text-dim font-mono">${(item.fusionEssence || item.content || '').length}字</span>
                        <i class="fa-solid fa-chevron-down text-dim text-[10px]"></i>
                    </div>
                </div>
                <div class="hidden p-4 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                    ${typeof marked !== 'undefined' ? marked.parse(item.fusionEssence || item.content || '') : (item.fusionEssence || item.content || '')}
                </div>
            </div>
            `).join('')}
        </div>`;
    },

    _emptyState(text, icon, color) {
        return `
        <div class="flex flex-col items-center justify-center h-full text-dim">
            <div class="w-16 h-16 rounded-full bg-${color}-500/5 flex center mb-3">
                <i class="fa-solid ${icon} text-${color}-400/30 text-2xl"></i>
            </div>
            <div class="text-sm font-bold text-white/30">${text}</div>
            <div class="text-[10px] text-dim mt-1">去「融合拆书」模块运行流水线后，结果将自动同步到这里</div>
            <button class="btn btn-xs bg-white/5 text-dim mt-4" onclick="App.nav('fusion_book')">
                <i class="fa-solid fa-rocket mr-1"></i>前往融合拆书
            </button>
        </div>`;
    },

    _matchesSearch(text) {
        if (!this._search) return true;
        return (text || '').toLowerCase().includes(this._search.toLowerCase());
    },

    // ───────────────────────────────────────────
    // 流水线实时监控
    // ───────────────────────────────────────────
    _renderPipelineMonitorInner() {
        const FB = Modules.fusion_book;
        if (!FB) return '';

        const isRunning = FB._pipelineRunning;
        const isPaused = FB._pipelinePaused;
        const hasSaved = FB._savedPipelineState;
        const stats = FB._agentScheduler?._stats || { pending: 0, running: 0, done: 0, failed: 0, startTime: 0 };
        const phase = FB._agentScheduler?._phase || 0;
        const results = FB._pipelineResults || {};

        // 计算进度
        const totalPairs = FB._plConfig?.leftChapters?.length || 0;
        const doneCount = stats.done;
        const progressPct = totalPairs > 0 ? Math.round((doneCount / totalPairs) * 100) : 0;
        const elapsedMin = stats.startTime ? ((Date.now() - stats.startTime) / 60000).toFixed(1) : '0.0';
        const speed = elapsedMin > 0 ? (doneCount / parseFloat(elapsedMin)).toFixed(1) : '0.0';

        // ── 未启动 ──
        if (!isRunning && !isPaused && !hasSaved) {
            return `
            <div class="bg-[#0e0e10] rounded-xl border border-white/5 p-5">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-rocket text-dim"></i>
                        <span class="text-sm font-bold text-white">流水线监控</span>
                        <span class="text-[10px] text-dim">未启动</span>
                    </div>
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.fusion_book.showPipelineConfig()">
                        <i class="fa-solid fa-play mr-1"></i>启动流水线
                    </button>
                </div>
            </div>`;
        }

        // ── 有保存进度但未运行 ──
        if (!isRunning && !isPaused && hasSaved) {
            const completed = hasSaved.completedPairs?.length || 0;
            const total = hasSaved.pairs?.length || 0;
            return `
            <div class="bg-[#0e0e10] rounded-xl border border-white/5 p-5">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-clock-rotate-left text-amber-400"></i>
                        <span class="text-sm font-bold text-white">流水线监控</span>
                        <span class="text-[10px] text-amber-400">上次进度: ${completed}/${total} 对章节</span>
                    </div>
                    <div class="flex gap-1.5">
                        <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.fusion_book._resumeFromSaved()">
                            <i class="fa-solid fa-play mr-1"></i>继续
                        </button>
                        <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.fusion_book.showPipelineConfig()">
                            <i class="fa-solid fa-gear mr-1"></i>重新配置
                        </button>
                    </div>
                </div>
            </div>`;
        }

        // ── 运行中 / 已暂停 ──
        const statusColor = isPaused ? 'amber' : 'green';
        const statusText = isPaused ? '⏸ 已暂停' : '🚀 运行中';
        const statusDot = isPaused ? '' : '<span class="animate-pulse text-green-400 mr-1">●</span>';

        // 阶段指示器
        const phases = [
            { num: 1, name: '分析', color: 'blue' },
            { num: 2, name: '融合', color: 'purple' },
            { num: 3, name: '循环', color: 'cyan' },
            { num: 4, name: '写作', color: 'orange' }
        ];

        // 实时写入状态
        const stepCards = [
            { key: 'left', label: '左书分析', color: 'blue', result: results.left },
            { key: 'right', label: '右书分析', color: 'pink', result: results.right },
            { key: 'compare', label: '对比', color: 'amber', result: results.compare },
            { key: 'fusion', label: '融合', color: 'green', result: results.fusion },
            { key: 'outline', label: '📋细纲', color: 'cyan', result: results.outline },
            { key: 'world', label: '实体提取', color: 'cyan', result: results.world },
            { key: 'write', label: '正文', color: 'purple', result: results.write }
        ];

        const stepHtml = stepCards.map(s => {
            const len = (s.result || '').length;
            const hasData = len > 0;
            const isActive = isRunning && !isPaused && !hasData;
            const bgClass = isActive ? `bg-${s.color}-500/10 border-${s.color}-500/30` : (hasData ? `bg-${s.color}-500/5 border-${s.color}-500/20` : 'bg-white/[0.02] border-white/5');
            const dotClass = isActive ? `bg-${s.color}-400 animate-pulse` : (hasData ? `bg-${s.color}-400` : 'bg-white/10');
            const textClass = isActive ? `text-${s.color}-400` : (hasData ? `text-${s.color}-400` : 'text-dim');
            const statusIcon = isActive ? '<i class="fa-solid fa-spinner fa-spin text-[8px]"></i>' : (hasData ? '<i class="fa-solid fa-check text-[8px]"></i>' : '<i class="fa-solid fa-minus text-[8px]"></i>');
            return `
            <div class="rounded-lg border p-2 ${bgClass} flex flex-col gap-1">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full ${dotClass}"></span>
                        <span class="text-[10px] font-bold ${textClass}">${s.label}</span>
                    </div>
                    ${statusIcon}
                </div>
                ${hasData ? `<span class="text-[9px] text-dim font-mono text-right">${len}字</span>` : ''}
            </div>`;
        }).join('');

        return `
        <div class="bg-[#0e0e10] rounded-xl border border-white/5 overflow-hidden">
            <!-- 头部状态栏 -->
            <div class="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/5">
                <div class="flex items-center gap-2">
                    ${statusDot}
                    <span class="text-sm font-bold text-white">流水线实时监控</span>
                    <span class="text-[10px] px-1.5 py-0.5 rounded bg-${statusColor}-500/10 text-${statusColor}-400 border border-${statusColor}-500/20">${statusText}</span>
                </div>
                <div class="flex gap-1.5">
                    ${isPaused ? `
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.fusion_book.plResume()">
                        <i class="fa-solid fa-play mr-1"></i>继续
                    </button>` : `
                    <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.fusion_book.plPause()">
                        <i class="fa-solid fa-pause mr-1"></i>暂停
                    </button>`}
                    <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30" onclick="Modules.fusion_book.plStop()">
                        <i class="fa-solid fa-stop mr-1"></i>停止
                    </button>
                    <button class="btn btn-xs bg-white/5 text-dim" onclick="App.nav('fusion_book'); setTimeout(() => Modules.fusion_book.plRestore(), 100);">
                        <i class="fa-solid fa-expand mr-1"></i>打开浮层
                    </button>
                </div>
            </div>
            <div class="p-4 space-y-3">
                <!-- 阶段 + 进度 -->
                <div class="flex items-center gap-3">
                    <div class="flex items-center gap-1 text-[10px]">
                        ${phases.map(p => `
                            <span class="px-1.5 py-0.5 rounded ${phase === p.num ? 'bg-' + p.color + '-500/20 text-' + p.color + '-400 font-bold' : 'text-dim'}">${p.num}${p.name}</span>
                            ${p.num < 4 ? '<span class="text-dim">→</span>' : ''}
                        `).join('')}
                    </div>
                    <div class="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300" style="width:${progressPct}%"></div>
                    </div>
                    <span class="text-[10px] text-dim font-mono">${doneCount}/${totalPairs || '?'} (${progressPct}%)</span>
                </div>
                <!-- Agent 统计 -->
                <div class="flex items-center gap-3 text-[10px]">
                    <span class="text-dim">Agent:</span>
                    <span class="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">${stats.pending}排队</span>
                    <span class="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">${stats.running}运行</span>
                    <span class="px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">${stats.done}完成</span>
                    ${stats.failed > 0 ? `<span class="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">${stats.failed}失败</span>` : ''}
                    <span class="text-dim ml-auto">${speed}章/分 · ${elapsedMin}分钟</span>
                </div>
                <!-- 实时写入状态 -->
                <div>
                    <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-2">实时写入状态</div>
                    <div class="grid grid-cols-4 gap-1.5">
                        ${stepHtml}
                    </div>
                </div>
                <!-- 当前输出预览 -->
                ${(results.fusion || results.outline || results.write) ? `
                <div class="bg-black/20 rounded-lg p-2.5 border border-white/5 max-h-[120px] overflow-y-auto">
                    <div class="text-[10px] text-dim mb-1">最新输出预览</div>
                    <div class="text-[10px] text-gray-400 leading-relaxed whitespace-pre-wrap">${(results.write || results.outline || results.fusion || '').slice(-300)}</div>
                </div>` : ''}
            </div>
        </div>`;
    },

    _fmtCycleId(id) {
        if (!id) return '未知';
        return id.replace('cycle_', '').replace(/_/g, ' - ');
    },

    _escapeAttr(text) {
        return (text || '').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '');
    },

    _copyText(text) {
        navigator.clipboard.writeText(text).then(() => UI.toast('已复制到剪贴板')).catch(() => UI.toast('复制失败'));
    },

    _download(filename, text) {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },

    // ───────────────────────────────────────────
    // 导出 & 清空
    // ───────────────────────────────────────────
    async exportAll() {
        const d = this._data || {};
        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            fusionContext: d.fusionContext,
            analyses: d.analysis,
            cycles: d.cycles,
            outlines: d.outlines,
            writings: d.writings,
            entities: d.entities,
            worldCycles: d.worldCycles
        };
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fusion_workbench_export_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        UI.toast('导出成功');
    },

    async clearAll() {
        if (!confirm('确定清空所有融合拆书结果？此操作不可恢复。')) return;
        try {
            // 删除 settings 中的融合相关数据
            const allSettings = await DB.getAll('settings') || [];
            for (const s of allSettings) {
                if (s.id && (s.id.startsWith('cycle_') || s.id === 'pipeline_fusion_context')) {
                    await DB.del('settings', s.id);
                }
            }
            // 删除 outlines / writings 中的 pipeline 来源数据
            const allOutlines = await DB.getAll('outlines') || [];
            for (const o of allOutlines) {
                if (o.source === 'pipeline' || o.id?.startsWith('fusion_outline_')) {
                    await DB.del('outlines', o.id);
                }
            }
            const allWritings = await DB.getAll('writings') || [];
            for (const w of allWritings) {
                if (w.id?.startsWith('fusion_write_')) {
                    await DB.del('writings', w.id);
                }
            }
            // 不删除 entities，因为可能是世界引擎共用的
            this._data = {};
            this._renderWorkspace();
            UI.toast('已清空融合拆书结果');
        } catch(e) {
            UI.toast('清空失败: ' + e.message);
        }
    }
};
