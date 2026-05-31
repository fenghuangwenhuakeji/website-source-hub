/**
 * 拆书弹药库 — 结果展示与管理
 * Modules.fusion_workbench
 * 
 * 独立导航页面，用于浏览、管理和导出融合拆书产生的全部弹药。
 * 数据来源：settings / outlines / writings / assets（暂存实体/弹药）/ entities（已发布回显）
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
            { id: 'analysis', icon: 'fa-magnifying-glass', text: '章节弹药', color: 'text-blue-400' },
            { id: 'compare', icon: 'fa-code-compare', text: '对比弹药', color: 'text-amber-400' },
            { id: 'fusion', icon: 'fa-wand-magic-sparkles', text: '融合弹药', color: 'text-green-400' },
            { id: 'outline', icon: 'fa-list-check', text: '创作细纲', color: 'text-cyan-400' },
            { id: 'entity', icon: 'fa-cubes', text: '实体库', color: 'text-pink-400' },
            { id: 'write', icon: 'fa-feather-pointed', text: '正文素材', color: 'text-orange-400' },
            { id: 'cycle', icon: 'fa-arrows-spin', text: '循环数据', color: 'text-indigo-400' }
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
                            <div class="font-bold text-white text-sm">拆书弹药库</div>
                            <div class="text-[10px] text-dim">给续写 / 新书写作</div>
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
                        <button class="btn btn-xs bg-emerald-600/20 text-emerald-400 border-emerald-600/30" onclick="Modules.fusion_workbench.goDeconstruct()">
                            <i class="fa-solid fa-book-open-reader mr-1"></i>去拆书
                        </button>
                        <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.fusion_workbench.useAmmoToWrite()">
                            <i class="fa-solid fa-feather-pointed mr-1"></i>用拆书写
                        </button>
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
            console.error('拆书弹药库加载失败:', e);
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

        // 2. 弹药资产：流水线实时写入这里，工作台直接消费
        d.ammo = [];
        try {
            const allAssets = await DB.getAll('assets');
            if (allAssets) d.ammo = allAssets.filter(x =>
                x.flowMode !== 'creative' &&
                x.sourceBook !== '融合细纲/正文原创' &&
                x.type === 'fusion_ammo'
            );
        } catch(e) {}

        const ammoByKind = kind => d.ammo.filter(x => (x.ammoKind || (kind === 'manual' ? 'manual' : '')) === kind);

        // 3. 章节技法拆解：只消费弹药模式写入的 assets
        const legacyAnalysis = [];
        d.analysis = [...ammoByKind('analysis'), ...legacyAnalysis];

        // 4. 逐章对比与融合弹药
        d.compares = ammoByKind('compare');
        d.fusionAmmos = d.ammo.filter(x => ['fusion', 'cycle', 'manual'].includes(x.ammoKind || 'manual'));

        // 5. 循环融合总结（旧 settings + 新工作台循环数据）
        d.cycles = [];
        try {
            const all = await DB.getAll('settings');
            if (all) {
                d.cycles = all.filter(x => x.id && x.id.startsWith('cycle_fusion_'));
            }
        } catch(e) {}

        // 6. 融合细纲 (outlines store)
        d.outlines = [];
        try {
            const all = await DB.getAll('outlines');
            if (all) d.outlines = all.filter(x => ['pipeline', 'batch_pipeline', 'fusion_workbench'].includes(x.source) || x.id?.startsWith('fusion_outline_'));
        } catch(e) {}

        // 7. 正文创作 (writings store)
        d.writings = [];
        try {
            const all = await DB.getAll('writings');
            if (all) d.writings = all.filter(x => ['pipeline', 'batch_pipeline', 'fusion_workbench'].includes(x.source) || x.id?.startsWith('fusion_write_'));
        } catch(e) {}

        // 8. 实体库：默认展示工作台暂存实体，不直接读取整套世界引擎图谱
        d.entities = [];
        try {
            const assets = await DB.getAll('assets') || [];
            const staged = assets
                .filter(x =>
                    x.flowMode !== 'creative' &&
                    x.sourceBook !== '融合细纲/正文原创' &&
                    (x.type === 'fusion_entity' || x.id?.startsWith('fusion_entity_'))
                )
                .map(x => ({
                    id: x.id,
                    name: x.name,
                    type: x.entityType || x.entity?.type || '其他',
                    desc: x.desc || x.entity?.desc || x.entity?.description || x.content || '',
                    relations: x.relations || x.entity?.relations || [],
                    source: x.source || 'fusion_workbench',
                    chapterRef: x.chapterRef || [],
                    createdAt: x.createdAt,
                    updatedAt: x.updatedAt,
                    publishedEntityId: x.publishedEntityId || '',
                    _staged: !x.publishedEntityId
                }));
            const publishedIds = new Set(staged.map(x => x.publishedEntityId).filter(Boolean));
            const legacy = (await DB.getAll('entities') || [])
                .filter(x => (x.source === 'pipeline' || x.source === 'fusion_workbench') && !publishedIds.has(x.id))
                .map(x => ({ ...x, _staged: false }));
            d.entities = [...staged, ...legacy];
        } catch(e) {}

        // 9. 循环数据：优先展示工作台暂存循环，兼容旧世界引擎循环
        d.worldCycles = [];
        try {
            const all = await DB.getAll('settings');
            if (all) {
                d.worldCycles = all.filter(x => x.id && x.id.startsWith('fwb_cycle_'));
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
            case 'compare': return (d.compares || []).length + (d.fusionContext?.content ? 1 : 0);
            case 'fusion': return (d.fusionAmmos || []).length + (d.cycles || []).length + (d.fusionContext?.content ? 1 : 0);
            case 'outline': return (d.outlines || []).length;
            case 'entity': return (d.entities || []).length;
            case 'write': return (d.writings || []).length;
            case 'cycle': return (d.worldCycles || []).length;
            default: return 0;
        }
    },

    _getTotalCount() {
        const d = this._data || {};
        return (d.analysis || []).length + (d.compares || []).length + (d.fusionAmmos || []).length + (d.cycles || []).length + (d.outlines || []).length +
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
}
};
