// 项目管理 — 项目生命周期、数据隔离、下一步路由
Modules.project_manager = {
    _projects: [],
    _currentProjectId: null,
    _query: '',
    _modeFilter: 'all',
    _statusFilter: 'all',
    _sortBy: 'updated',
    _viewMode: 'grid',

    render() {
        return `
        <div class="h-full flex flex-col bg-[#050505] overflow-hidden text-white pm-shell">
            <div class="shrink-0 border-b border-white/5 bg-[#0a0a0c]">
                <div class="h-14 px-5 flex items-center justify-between gap-4">
                    <div class="min-w-0">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-layer-group text-accent text-sm"></i>
                            <span class="font-bold text-white">项目管理</span>
                            <span class="text-[10px] text-dim">一本书一个项目</span>
                        </div>
                        <div class="text-[10px] text-dim mt-1">先选中项目；写、拆、续写、图谱和记忆都归到这本书。</div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <button class="btn btn-sm bg-accent/15 text-accent border-accent/30 hover:bg-accent/25" onclick="Modules.project_manager._showCreateModal()">
                            <i class="fa-solid fa-plus mr-1"></i>新建项目
                        </button>
                        <button class="btn btn-sm bg-white/5 text-dim border-white/10 hover:bg-white/10" onclick="Modules.project_manager._refresh()">
                            <i class="fa-solid fa-rotate mr-1"></i>刷新
                        </button>
                    </div>
                </div>

                <div class="pm-filter-wrap px-5 pb-4 space-y-3">
                    <div id="pm-quick-start"></div>
                    <div class="pm-filter-row grid grid-cols-12 gap-3">
                    <div class="col-span-4 relative">
                        <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-dim text-xs"></i>
                        <input id="pm-query" value="${this._escapeAttr(this._query)}" class="w-full bg-black/30 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-accent/40" placeholder="搜索项目、目标、标签" oninput="Modules.project_manager._query=this.value;Modules.project_manager._renderDynamic()">
                    </div>
                    <select class="col-span-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none" onchange="Modules.project_manager._modeFilter=this.value;Modules.project_manager._renderDynamic()">
                        ${this._option('all','全部路径',this._modeFilter)}
                        ${this._option('phoenix','从零写一本',this._modeFilter)}
                        ${this._option('import','导入续写',this._modeFilter)}
                        ${this._option('fusion','拆书融合',this._modeFilter)}
                    </select>
                    <select class="col-span-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none" onchange="Modules.project_manager._statusFilter=this.value;Modules.project_manager._renderDynamic()">
                        ${this._option('all','全部进度',this._statusFilter)}
                        ${this._option('creating','刚开始',this._statusFilter)}
                        ${this._option('world_ready','资料就绪',this._statusFilter)}
                        ${this._option('outlined','大纲完成',this._statusFilter)}
                        ${this._option('writing','写正文',this._statusFilter)}
                        ${this._option('completed','已完结',this._statusFilter)}
                    </select>
                    <select class="col-span-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none" onchange="Modules.project_manager._sortBy=this.value;Modules.project_manager._renderDynamic()">
                        ${this._option('updated','最近动过',this._sortBy)}
                        ${this._option('created','最新创建',this._sortBy)}
                        ${this._option('words','字数最多',this._sortBy)}
                        ${this._option('stage','进度最远',this._sortBy)}
                    </select>
                    <div class="col-span-2 flex rounded-lg border border-white/10 bg-black/30 overflow-hidden">
                        <button class="flex-1 text-xs ${this._viewMode==='grid'?'bg-white/10 text-white':'text-dim'}" onclick="Modules.project_manager._viewMode='grid';Modules.project_manager._renderDynamic()"><i class="fa-solid fa-table-cells-large mr-1"></i>卡片</button>
                        <button class="flex-1 text-xs ${this._viewMode==='list'?'bg-white/10 text-white':'text-dim'}" onclick="Modules.project_manager._viewMode='list';Modules.project_manager._renderDynamic()"><i class="fa-solid fa-list mr-1"></i>列表</button>
                    </div>
                    </div>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto p-5 space-y-5">
                <div id="pm-active-banner"></div>
                <div id="pm-stats-row"></div>
                <div id="pm-stage-lanes"></div>
                <div id="pm-project-grid"></div>
                <div id="pm-empty-state" class="hidden"></div>
            </div>
        </div>`;
    },

    async init() {
        this._currentProjectId = localStorage.getItem('genesis_active_project') || null;
        await this._refresh();
    },

    async _refresh() {
        await this._loadProjects();
        this._currentProjectId = localStorage.getItem('genesis_active_project') || GenesisCore._activeProjectId || null;
        this._renderDynamic();
    },

    async _loadProjects() {
        this._projects = await GenesisCore.getProjects();
    },

    _renderDynamic() {
        this._renderQuickStart();
        this._renderActiveBanner();
        this._renderStats();
        this._renderStageLanes();
        this._renderProjects();
    },

    _renderQuickStart() {
        const el = document.getElementById('pm-quick-start');
        if (!el) return;
        const modes = ['phoenix', 'import', 'fusion'];
        const isEmpty = this._projects.length === 0;
        const filterRow = document.querySelector('#module-view-project_manager .pm-filter-row');
        if (filterRow) filterRow.classList.toggle('hidden', isEmpty);
        const title = isEmpty ? '先选一种开始方式' : '快速新建';
        const sub = isEmpty ? '不用先懂内部模块，按你手里的材料选；后面可以随时改成先写或先拆。' : '需要开新书时，从这里直接建。';
        el.innerHTML = `
        <div class="pm-guide rounded-lg border border-white/5 bg-white/[0.025] p-3">
            <div class="flex items-center justify-between gap-3 mb-3">
                <div>
                    <div class="text-sm font-bold">${title}</div>
                    <div class="text-[10px] text-dim mt-0.5">${sub}</div>
                </div>
                ${!isEmpty ? `<button class="text-[10px] text-dim hover:text-white" onclick="Modules.project_manager._showCreateModal()">全部路径 <i class="fa-solid fa-arrow-right ml-1"></i></button>` : ''}
            </div>
            <div class="pm-guide-grid grid grid-cols-3 gap-2">
                ${modes.map(mode => {
                    const p = this._pathProfile(mode);
                    const count = this._projects.filter(item => item.mode === mode).length;
                    return `
                    <button class="text-left rounded-lg border border-${p.color}-500/20 bg-${p.color}-500/[0.045] hover:bg-${p.color}-500/[0.075] p-3 transition-all" onclick="Modules.project_manager._showCreateModal('${mode}')">
                        <div class="flex items-center justify-between gap-2">
                            <span class="w-8 h-8 rounded-lg bg-${p.color}-500/10 flex center"><i class="fa-solid ${p.icon} text-${p.color}-400"></i></span>
                            <span class="text-[10px] text-${p.color}-400">${count} 个</span>
                        </div>
                        <div class="text-xs font-bold mt-2">${p.headline}</div>
                        <div class="text-[10px] text-dim mt-1 leading-relaxed">${p.plain}</div>
                    </button>`;
                }).join('')}
            </div>
        </div>`;
    },

    _renderStats() {
        const el = document.getElementById('pm-stats-row');
        if (!el) return;
        const total = this._projects.length;
        if (!total) {
            el.innerHTML = '';
            return;
        }
        const active = this._projects.find(p => p.id === this._currentProjectId);
        const words = this._projects.reduce((s, p) => s + (p.wordCount || 0), 0);
        const chapters = this._projects.reduce((s, p) => s + (p.chapterCount || 0), 0);
        const writing = this._projects.filter(p => p.status === 'writing').length;
        const cards = [
            ['项目', total, active ? `正在做：${this._escapeHtml(active.name)}` : '还没选中', 'fa-folder-tree', 'blue'],
            ['写正文', writing, '可直接进执笔台', 'fa-pen-nib', 'emerald'],
            ['字数', this._formatNumber(words), '全部项目累计', 'fa-keyboard', 'amber'],
            ['章节', chapters, '已经建好的章节', 'fa-book-open', 'pink']
        ];
        el.innerHTML = `<div class="grid grid-cols-4 gap-3">${cards.map(([label, value, sub, icon, color]) => `
            <div class="rounded-lg border border-white/5 bg-white/[0.025] p-4">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-[10px] text-dim font-bold">${label}</span>
                    <i class="fa-solid ${icon} text-${color}-400/70 text-xs"></i>
                </div>
                <div class="text-2xl font-bold text-white font-mono">${value}</div>
                <div class="text-[10px] text-dim mt-1 truncate">${sub}</div>
            </div>
        `).join('')}</div>`;
    },

    _renderActiveBanner() {
        const el = document.getElementById('pm-active-banner');
        if (!el) return;
        const active = this._projects.find(p => p.id === this._currentProjectId);
        if (!active) {
            el.innerHTML = `
            <div class="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex center"><i class="fa-solid fa-triangle-exclamation text-amber-400"></i></div>
                    <div>
                        <div class="text-sm font-bold">先选中一个项目</div>
                        <div class="text-[11px] text-dim mt-1">选中后，正文、细纲、实体、RAG、记忆都会归到这本书下面。</div>
                    </div>
                </div>
                <button class="btn btn-sm bg-accent/15 text-accent border-accent/30" onclick="Modules.project_manager._showCreateModal()">现在创建</button>
            </div>`;
            return;
        }
        const config = GenesisCore.getModeConfig(active.mode);
        const stage = config.stages[active.stageIndex || 0] || config.stages[0];
        const progress = this._stageProgress(active);
        const next = this._nextAction(active);
        el.innerHTML = `
        <div class="rounded-lg border border-${config.color}-500/25 bg-${config.color}-500/[0.06] p-4">
            <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                    <div class="text-[10px] text-${config.color}-400 font-bold mb-2">当前正在做</div>
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="w-9 h-9 rounded-lg bg-${config.color}-500/10 flex center"><i class="fa-solid ${config.icon} text-${config.color}-400"></i></span>
                        <span class="text-base font-bold truncate">${this._escapeHtml(active.name)}</span>
                        <span class="text-[10px] px-2 py-1 rounded bg-${config.color}-500/15 text-${config.color}-400 border border-${config.color}-500/25">${config.label}</span>
                        <span class="text-[10px] text-dim">${this._statusLabel(active.status)}</span>
                    </div>
                    <div class="mt-3 flex items-center gap-3">
                        <div class="flex-1 min-w-[260px] h-2 rounded-full bg-black/30 overflow-hidden">
                            <div class="h-full bg-${config.color}-400 rounded-full" style="width:${progress}%"></div>
                        </div>
                        <span class="text-[10px] text-${config.color}-400 font-bold">${stage ? stage.label : '准备'}</span>
                        <span class="text-[10px] text-dim">${active.chapterCount || 0}章 · ${this._formatNumber(active.wordCount || 0)}字</span>
                    </div>
                    <div class="mt-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-[11px] text-gray-300">
                        <span class="text-dim">下一步：</span><span class="font-bold text-white">${next.label}</span>
                        <span class="text-dim ml-2">${next.help}</span>
                    </div>
                </div>
                <div class="flex gap-2 shrink-0">
                    <button class="btn btn-sm bg-accent/20 text-accent border-accent/30 font-bold" onclick="GenesisCore.continueWriting()">
                        <i class="fa-solid fa-arrow-right mr-1"></i>继续下一步
                    </button>
                    <button class="btn btn-sm bg-white/5 text-dim border-white/10 hover:bg-white/10" onclick="Modules.project_manager._saveProjectData('${active.id}');UI.toast('项目快照已保存')">
                        <i class="fa-solid fa-floppy-disk mr-1"></i>保存快照
                    </button>
                    <button class="btn btn-sm bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20" onclick="GenesisCore.clearActiveProject();Modules.project_manager._refresh()">
                        <i class="fa-solid fa-xmark mr-1"></i>取消激活
                    </button>
                </div>
            </div>
        </div>`;
    },

    _renderStageLanes() {
        const el = document.getElementById('pm-stage-lanes');
        if (!el) return;
        if (!this._projects.length) {
            el.innerHTML = '';
            return;
        }
        const lanes = ['creating','world_ready','outlined','writing','completed'].map(status => {
            const items = this._projects.filter(p => p.status === status);
            return { status, label: this._statusLabel(status), count: items.length };
        });
        el.innerHTML = `
        <div class="rounded-lg border border-white/5 bg-white/[0.025] p-4">
            <div class="flex items-center justify-between mb-3">
                <div class="text-sm font-bold">项目进度</div>
                <span class="text-[10px] text-dim">点一下可筛选</span>
            </div>
            <div class="grid grid-cols-5 gap-2">
                ${lanes.map((lane, i) => `
                    <button class="text-left rounded-lg border ${this._statusFilter===lane.status?'border-accent/40 bg-accent/10':'border-white/5 bg-black/20 hover:bg-white/[0.035]'} p-3 transition-all" onclick="Modules.project_manager._statusFilter='${lane.status}';Modules.project_manager._renderDynamic()">
                        <div class="flex items-center justify-between">
                            <span class="text-[10px] text-dim">${i + 1}</span>
                            <span class="text-lg font-bold text-white">${lane.count}</span>
                        </div>
                        <div class="text-xs font-bold mt-2">${lane.label}</div>
                    </button>
                `).join('')}
            </div>
        </div>`;
    },

    _renderProjects() {
        const grid = document.getElementById('pm-project-grid');
        const empty = document.getElementById('pm-empty-state');
        if (!grid || !empty) return;
        const items = this._filteredProjects();
        if (!items.length) {
            grid.innerHTML = '';
            empty.classList.remove('hidden');
            const noProjects = this._projects.length === 0;
            empty.innerHTML = `
            <div class="rounded-lg border border-white/5 bg-white/[0.025] py-14 text-center">
                <i class="fa-solid fa-folder-open text-4xl text-white/20 mb-4"></i>
                <div class="text-sm font-bold text-white">${noProjects ? '项目库还是空的' : '没有匹配项目'}</div>
                <div class="text-xs text-dim mt-2">${noProjects ? '先从上面的三种开始方式里选一个。' : '清空搜索或换一个筛选条件。'}</div>
                ${noProjects ? `
                    <button class="btn btn-sm bg-accent/15 text-accent border-accent/30 mt-4" onclick="Modules.project_manager._showCreateModal()">创建第一个项目</button>
                ` : `
                    <button class="btn btn-sm bg-white/5 text-dim border-white/10 mt-4" onclick="Modules.project_manager._query='';Modules.project_manager._modeFilter='all';Modules.project_manager._statusFilter='all';Modules.project_manager._renderDynamic();const q=document.getElementById('pm-query');if(q)q.value='';">重置筛选</button>
                `}
            </div>`;
            return;
        }
        empty.classList.add('hidden');
        grid.innerHTML = this._viewMode === 'list'
            ? `<div class="rounded-lg border border-white/5 bg-white/[0.025] overflow-hidden">${items.map(p => this._renderProjectRow(p)).join('')}</div>`
            : `<div class="pm-project-card-grid grid grid-cols-3 gap-4">${items.map(p => this._renderProjectCard(p)).join('')}</div>`;
    },

    _renderProjectCard(p) {
        const config = GenesisCore.getModeConfig(p.mode);
        const isActive = p.id === this._currentProjectId;
        const stage = config.stages[p.stageIndex || 0] || config.stages[0];
        const progress = this._stageProgress(p);
        const next = this._nextAction(p);
        const profile = this._pathProfile(p.mode);
        const intent = this._escapeHtml(p.metadata?.intent || p.metadata?.goal || '未填写创作目标');
        return `
        <article class="pm-project-card relative rounded-lg border ${isActive ? 'border-'+config.color+'-500/40 bg-'+config.color+'-500/[0.055]' : 'border-white/5 bg-white/[0.025]'} p-4 hover:border-white/15 transition-all">
            <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    <span class="w-10 h-10 rounded-lg bg-${config.color}-500/10 flex center shrink-0"><i class="fa-solid ${config.icon} text-${config.color}-400"></i></span>
                    <div class="min-w-0">
                        <div class="text-sm font-bold truncate">${this._escapeHtml(p.name)}</div>
                        <div class="text-[10px] text-dim mt-1">${profile.headline} · ${this._statusLabel(p.status)}</div>
                    </div>
                </div>
                ${isActive ? `<span class="text-[9px] px-2 py-1 rounded bg-${config.color}-500/15 text-${config.color}-400 border border-${config.color}-500/25">活跃</span>` : ''}
            </div>
            <div class="mt-4 text-[11px] text-gray-400 leading-relaxed min-h-[38px] overflow-hidden">
                <span class="text-dim">目标：</span>${intent}
            </div>
            <div class="mt-3 rounded-lg border border-${config.color}-500/15 bg-black/20 p-3">
                <div class="text-[10px] text-dim">下一步</div>
                <div class="text-xs font-bold text-white mt-1">${next.label}</div>
                <div class="text-[10px] text-dim mt-1">${next.help}</div>
            </div>
            <div class="mt-4 flex items-center gap-2">
                <div class="flex-1 h-1.5 bg-black/30 rounded-full overflow-hidden"><div class="h-full bg-${config.color}-400" style="width:${progress}%"></div></div>
                <span class="text-[9px] text-${config.color}-400">${stage ? stage.label : '准备'}</span>
            </div>
            <div class="mt-4 grid grid-cols-3 gap-2">
                <div class="rounded bg-black/25 border border-white/5 p-2 text-center"><div class="text-xs font-bold">${p.chapterCount || 0}</div><div class="text-[9px] text-dim">章节</div></div>
                <div class="rounded bg-black/25 border border-white/5 p-2 text-center"><div class="text-xs font-bold">${this._formatNumber(p.wordCount || 0)}</div><div class="text-[9px] text-dim">字数</div></div>
                <div class="rounded bg-black/25 border border-white/5 p-2 text-center"><div class="text-xs font-bold">${this._formatDate(p.updatedAt)}</div><div class="text-[9px] text-dim">更新</div></div>
            </div>
            <div class="mt-4 flex gap-2">
                ${isActive ? `
                    <button class="flex-1 btn btn-xs bg-accent/15 text-accent border-accent/30" onclick="GenesisCore.continueWriting()">继续下一步</button>
                ` : `
                    <button class="flex-1 btn btn-xs bg-${config.color}-500/10 text-${config.color}-400 border-${config.color}-500/20" onclick="Modules.project_manager._jump('${p.id}')">激活并继续</button>
                `}
                ${!isActive ? `<button class="btn btn-xs bg-white/5 text-dim border-white/10" onclick="Modules.project_manager._activateProject('${p.id}')" title="只激活"><i class="fa-solid fa-check"></i></button>` : ''}
                <button class="btn btn-xs bg-white/5 text-dim border-white/10" onclick="Modules.project_manager._advanceStage('${p.id}', 1)" title="推进阶段"><i class="fa-solid fa-forward-step"></i></button>
                <button class="btn btn-xs bg-white/5 text-dim border-white/10" onclick="Modules.project_manager._showRenameModal('${p.id}', '${this._jsArg(p.name)}')" title="重命名"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-xs bg-red-500/10 text-red-400 border-red-500/20" onclick="Modules.project_manager._deleteProject('${p.id}', '${this._jsArg(p.name)}')" title="删除"><i class="fa-solid fa-trash"></i></button>
            </div>
        </article>`;
    },

    _renderProjectRow(p) {
        const config = GenesisCore.getModeConfig(p.mode);
        const isActive = p.id === this._currentProjectId;
        const stage = config.stages[p.stageIndex || 0] || config.stages[0];
        const next = this._nextAction(p);
        const profile = this._pathProfile(p.mode);
        return `
        <div class="px-4 py-3 flex items-center justify-between gap-3 border-b border-white/5 last:border-b-0 hover:bg-white/[0.025]">
            <div class="flex items-center gap-3 min-w-0">
                <span class="w-9 h-9 rounded-lg bg-${config.color}-500/10 flex center shrink-0"><i class="fa-solid ${config.icon} text-${config.color}-400"></i></span>
                <div class="min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-bold truncate">${this._escapeHtml(p.name)}</span>
                        ${isActive ? `<span class="text-[9px] text-${config.color}-400">活跃</span>` : ''}
                    </div>
                    <div class="text-[10px] text-dim mt-1">${profile.headline} · ${this._statusLabel(p.status)} · ${stage ? stage.label : '准备'} · ${this._formatNumber(p.wordCount || 0)}字</div>
                    <div class="text-[10px] text-gray-400 mt-1">下一步：${next.label}</div>
                </div>
            </div>
            <div class="flex gap-2 shrink-0">
                ${isActive ? `<button class="btn btn-xs bg-accent/15 text-accent border-accent/30" onclick="GenesisCore.continueWriting()">继续</button>` : `<button class="btn btn-xs bg-${config.color}-500/10 text-${config.color}-400 border-${config.color}-500/20" onclick="Modules.project_manager._jump('${p.id}')">激活继续</button>`}
                ${!isActive ? `<button class="btn btn-xs bg-white/5 text-dim border-white/10" onclick="Modules.project_manager._activateProject('${p.id}')">只激活</button>` : ''}
                <button class="btn btn-xs bg-white/5 text-dim border-white/10" onclick="Modules.project_manager._advanceStage('${p.id}', 1)">推进</button>
            </div>
        </div>`;
    },

    _filteredProjects() {
        const q = this._query.trim().toLowerCase();
        let items = this._projects.filter(p => {
            if (this._modeFilter !== 'all' && p.mode !== this._modeFilter) return false;
            if (this._statusFilter !== 'all' && p.status !== this._statusFilter) return false;
            if (!q) return true;
            const hay = [p.name, p.status, p.mode, p.metadata?.intent, p.metadata?.goal, ...(p.metadata?.tags || [])].join(' ').toLowerCase();
            return hay.includes(q);
        });
        const sorters = {
            updated: (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0),
            created: (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
            words: (a, b) => (b.wordCount || 0) - (a.wordCount || 0),
            stage: (a, b) => (b.stageIndex || 0) - (a.stageIndex || 0)
        };
        return items.sort(sorters[this._sortBy] || sorters.updated);
    },

    async _activateProject(id, opts = {}) {
        if (!this._projects.length) await this._loadProjects();
        const proj = this._projects.find(p => p.id === id);
        if (!proj) return;
        const currentId = this._currentProjectId || GenesisCore._activeProjectId;
        if (currentId && currentId !== id) await this._saveProjectData(currentId);
        this._currentProjectId = id;
        GenesisCore.setActiveProject(id);
        localStorage.setItem('genesis_active_project_mode', proj.mode || 'phoenix');
        if (typeof MemorySystem !== 'undefined' && MemorySystem.setProjectContext) await MemorySystem.setProjectContext(id);
        await this._loadProjectData(id);
        if (typeof LocalSync !== 'undefined' && LocalSync._resetModuleStates) LocalSync._resetModuleStates();
        if (!opts.silent) UI.toast(`已切换到项目「${proj.name}」`);
        await this._refresh();
    },

    async _jump(id) {
        await this._activateProject(id, { silent: true });
        await GenesisCore.continueWriting();
    },

    async _advanceStage(id, delta) {
        const proj = await DB.get('projects', id);
        if (!proj) return;
        const config = GenesisCore.getModeConfig(proj.mode);
        const nextIndex = Math.max(0, Math.min((config.stages || []).length - 1, (proj.stageIndex || 0) + delta));
        const statusByIndex = ['creating','world_ready','outlined','writing','completed'];
        await GenesisCore.updateProject(id, {
            stageIndex: nextIndex,
            status: statusByIndex[Math.min(nextIndex, statusByIndex.length - 1)] || proj.status
        });
        await this._refresh();
        UI.toast('阶段已更新');
    },

    async _saveProjectData(projectId) {
        try {
            if (typeof LocalSync === 'undefined' || !LocalSync.FOLDER_STORES) return;
            const snapshot = {};
            for (const store of LocalSync.FOLDER_STORES) {
                try { snapshot[store] = await DB._rawGetAll(store) || []; } catch(e) { snapshot[store] = []; }
            }
            snapshot._meta = { projectId, syncTime: new Date().toISOString(), version: DB.version };
            const record = { id: 'project_snapshot_' + projectId, data: snapshot };
            if (DB.db && DB.db.objectStoreNames.contains('project_snapshots')) await DB._rawPut('project_snapshots', record);
            else await DB._rawPut('settings', record);
        } catch(e) {
            console.warn('[ProjectManager] 保存项目数据失败:', e);
            UI.toast('项目保存失败: ' + e.message, 'error');
        }
    },

    async _loadProjectData(projectId) {
        try {
            if (typeof LocalSync === 'undefined' || !LocalSync.FOLDER_STORES) return;
            await LocalSync._clearAllStores();
            let record = null;
            if (DB.db && DB.db.objectStoreNames.contains('project_snapshots')) record = await DB.get('project_snapshots', 'project_snapshot_' + projectId);
            if (!record) record = await DB.get('settings', 'project_snapshot_' + projectId);
            const snapshot = record?.data;
            if (!snapshot) return;
            for (const store of LocalSync.FOLDER_STORES) {
                if (Array.isArray(snapshot[store])) {
                    for (const item of snapshot[store]) await DB._rawPut(store, item);
                }
            }
        } catch(e) {
            console.warn('[ProjectManager] 加载项目数据失败:', e);
            UI.toast('项目加载失败: ' + e.message, 'error');
        }
    },

    async _createProject(name, mode, intent) {
        if (this._currentProjectId) await this._saveProjectData(this._currentProjectId);
        if (typeof LocalSync !== 'undefined' && LocalSync._clearAllStores) await LocalSync._clearAllStores();
        const proj = await GenesisCore.createProject({
            name,
            mode,
            metadata: { intent: intent || '', tags: [] }
        });
        this._currentProjectId = proj.id;
        localStorage.setItem('genesis_active_project', proj.id);
        localStorage.setItem('genesis_active_project_mode', mode);
        await this._saveProjectData(proj.id);
        await this._refresh();
        UI.toast(`项目「${name}」已创建`);
        if (mode === 'phoenix') App.nav('phoenix');
        else if (mode === 'fusion') App.nav('fusion_book');
        else App.nav('world_engine');
    },

    _showCreateModal(preselectedMode = 'phoenix') {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4';
        const modes = [
            ['phoenix','fa-fire-flame-curved','我要从零写一本','题材/试写 → 细纲 → 图谱 → 正文','orange'],
            ['import','fa-file-import','我要接着已有作品写','原文/手写 → 章内细纲 → 图谱 → 续写','cyan'],
            ['fusion','fa-code-compare','我要拆书融合出新书','双书/样章 → 循环拆技法 → 新细纲 → 正文','purple']
        ];
        overlay.innerHTML = `
        <div class="w-full max-w-[560px] rounded-lg border border-white/10 bg-[#101014] shadow-2xl overflow-hidden">
            <div class="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div>
                    <div class="text-sm font-bold text-white"><i class="fa-solid fa-plus text-accent mr-2"></i>你准备怎么开始？</div>
                    <div class="text-[10px] text-dim mt-1">先选目标。进入后可以随时先写、先拆、导入续写或混着来。</div>
                </div>
                <button class="text-dim hover:text-white pm-close"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="p-5 space-y-4">
                <div>
                    <label class="text-[10px] text-dim font-bold uppercase mb-1 block">项目名称</label>
                    <input id="pm-new-name" class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent/40" placeholder="例如：夜航者纪事">
                </div>
                <div>
                    <label class="text-[10px] text-dim font-bold uppercase mb-1 block">创作目标</label>
                    <textarea id="pm-new-intent" class="w-full h-20 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none resize-none focus:border-accent/40" placeholder="一句话写清：主角欲望、阻力、代价。"></textarea>
                </div>
                <div>
                    <label class="text-[10px] text-dim font-bold uppercase mb-2 block">创作路径</label>
                    <div class="grid grid-cols-3 gap-2">
                        ${modes.map(([id, icon, title, sub, color]) => `
                            <button class="pm-mode-btn text-left rounded-lg border p-3 transition-all ${id===preselectedMode?'border-'+color+'-500/50 bg-'+color+'-500/10':'border-white/10 bg-white/[0.025] hover:bg-white/5'}" data-mode="${id}" data-color="${color}">
                                <i class="fa-solid ${icon} text-${color}-400 mb-3"></i>
                                <div class="text-xs font-bold text-white leading-tight">${title}</div>
                                <div class="text-[10px] text-dim mt-1 leading-relaxed">${sub}</div>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="px-5 py-4 border-t border-white/5 flex gap-2">
                <button class="btn flex-1 bg-white/5 text-dim border-white/10 pm-close">取消</button>
                <button class="btn flex-1 bg-accent/20 text-accent border-accent/30 font-bold pm-create">创建并进入</button>
            </div>
        </div>`;
        document.body.appendChild(overlay);

        let selectedMode = preselectedMode;
        const close = () => overlay.remove();
        overlay.querySelectorAll('.pm-close').forEach(btn => btn.onclick = close);
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
        overlay.querySelectorAll('.pm-mode-btn').forEach(btn => {
            btn.onclick = () => {
                selectedMode = btn.dataset.mode;
                overlay.querySelectorAll('.pm-mode-btn').forEach(b => {
                    b.className = 'pm-mode-btn text-left rounded-lg border border-white/10 bg-white/[0.025] hover:bg-white/5 p-3 transition-all';
                });
                const color = btn.dataset.color;
                btn.className = `pm-mode-btn text-left rounded-lg border border-${color}-500/50 bg-${color}-500/10 p-3 transition-all`;
            };
        });
        overlay.querySelector('.pm-create').onclick = async () => {
            const nameEl = document.getElementById('pm-new-name');
            const intentEl = document.getElementById('pm-new-intent');
            const name = nameEl.value.trim();
            if (!name) { nameEl.focus(); return; }
            close();
            await this._createProject(name, selectedMode, intentEl.value.trim());
        };
        setTimeout(() => document.getElementById('pm-new-name')?.focus(), 50);
    },

    _showRenameModal(id, currentName) {
        const newName = prompt('重命名项目:', currentName);
        if (newName && newName.trim() && newName.trim() !== currentName) this._renameProject(id, newName.trim());
    },

    async _renameProject(id, newName) {
        await GenesisCore.updateProject(id, { name: newName });
        await this._refresh();
        UI.toast('项目已重命名');
    },

    async _deleteProject(id, name) {
        if (!confirm(`确定删除项目「${name}」？\n\n这会删除项目记录和项目快照；当前浏览器工作区数据也会在删除活跃项目时清空。`)) return;
        if (id === this._currentProjectId) {
            if (typeof LocalSync !== 'undefined' && LocalSync._clearAllStores) await LocalSync._clearAllStores();
            this._currentProjectId = null;
            GenesisCore.clearActiveProject();
        }
        try { await DB.del('project_snapshots', 'project_snapshot_' + id); } catch(e) {}
        try { await DB.del('settings', 'project_snapshot_' + id); } catch(e) {}
        await GenesisCore.deleteProject(id);
        await this._refresh();
        UI.toast('项目已删除');
    },

    _stageProgress(p) {
        const stages = GenesisCore.getModeConfig(p.mode).stages || [];
        if (stages.length <= 1) return 0;
        return Math.max(0, Math.min(100, Math.round(((p.stageIndex || 0) / (stages.length - 1)) * 100)));
    },

    _pathProfile(mode) {
        const profiles = {
            phoenix: {
                headline: '从零写一本',
                plain: '没有原稿；可以先试写一段，也可以先搭细纲。',
                icon: 'fa-fire-flame-curved',
                color: 'orange'
            },
            import: {
                headline: '导入续写',
                plain: '正文保留；缺细纲补细纲，缺正文补正文。',
                icon: 'fa-file-import',
                color: 'cyan'
            },
            fusion: {
                headline: '拆书融合',
                plain: '两本参考书按循环拆技法，也可先写样章反拆。',
                icon: 'fa-code-compare',
                color: 'purple'
            }
        };
        return profiles[mode] || profiles.phoenix;
    },

    _nextAction(p) {
        const idx = Number(p?.stageIndex || 0);
        const map = {
            phoenix: [
                ['一句话开书', '先写清题材、主角欲望、阻力和代价。'],
                ['做执行级细纲', '可以先写样章，也可以把每章冲突、转折、钩子写到能直接开写。'],
                ['实体入图谱', '把人物、规则、伏笔、地点注入世界引擎。'],
                ['进入执笔台', '带着知识图谱和记忆上下文写正文；写完会反向补细纲和实体。']
            ],
            import: [
                ['导入正文', '把已有小说放进系统；也可以直接在执笔台手写新章。'],
                ['拆成细纲', '按卷章拆出已写内容和后续缺口。'],
                ['实体入图谱', '人物、世界规则、伏笔、关系进入世界引擎。'],
                ['补缺章/续写', '已有正文不动，只从缺口、空章或末尾继续写。']
            ],
            fusion: [
                ['导入双书', '选择两本参考书，只作为技法来源。'],
                ['循环拆技法', '按5章/一卷提炼节奏、钩子、爽点和对话模板；不需要一次拆完。'],
                ['融合成细纲', '把技法变成原创人物、原创世界、原创章节。'],
                ['实体入图谱', '把新细纲里的实体、规则、伏笔、关系沉进世界引擎。'],
                ['进入执笔台', '按融合细纲写新正文；也能用样章反拆校准技法。']
            ]
        };
        const steps = map[p?.mode] || map.phoenix;
        const picked = steps[Math.min(idx, steps.length - 1)] || steps[0];
        return { label: picked[0], help: picked[1] };
    },

    _statusLabel(status) {
        return ({ creating: '刚开始', world_ready: '资料就绪', outlined: '大纲完成', writing: '写正文', completed: '已完结' })[status] || status || '未开始';
    },

    _formatNumber(n) {
        n = Number(n || 0);
        return n >= 10000 ? (n / 10000).toFixed(n >= 100000 ? 0 : 1) + '万' : n.toLocaleString();
    },

    _formatDate(ts) {
        if (!ts) return '-';
        const d = new Date(ts);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    },

    _escapeHtml(text) {
        return String(text || '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    },

    _escapeAttr(text) {
        return this._escapeHtml(text).replace(/`/g, '&#96;');
    },

    _jsArg(text) {
        return this._escapeAttr(String(text || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, ''));
    },

    _option(value, label, current) {
        return `<option value="${value}" ${value === current ? 'selected' : ''}>${label}</option>`;
    }
};
