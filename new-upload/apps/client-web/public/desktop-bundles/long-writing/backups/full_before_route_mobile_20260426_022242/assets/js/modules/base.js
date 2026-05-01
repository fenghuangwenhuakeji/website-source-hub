const Modules = {};

Modules.home = {
    _projects: [],
    _workspaceStats: null,

    render() {
        return `
        <div class="h-full overflow-y-auto bg-[#050505] text-white">
            <div class="min-h-full relative px-6 py-5">
                <div class="pointer-events-none absolute inset-0 opacity-60" style="background:
                    radial-gradient(circle at 16% 12%, rgba(249,115,22,.16), transparent 26%),
                    radial-gradient(circle at 78% 4%, rgba(6,182,212,.12), transparent 25%),
                    linear-gradient(180deg, rgba(255,255,255,.03), transparent 22%);"></div>

                <div class="relative z-10 max-w-[1500px] mx-auto space-y-5">
                    <section class="flex items-start justify-between gap-4">
                        <div class="min-w-0">
                            <div class="text-[10px] font-bold uppercase tracking-wider text-accent mb-2">从这里开始</div>
                            <h1 class="text-3xl font-bold tracking-tight">创世中心</h1>
                            <p class="text-sm text-dim mt-2 max-w-3xl leading-relaxed">别先找模块。先选你要做什么，系统会把你送到对应流程。</p>
                        </div>
                        <div class="flex gap-2 shrink-0">
                            <button class="btn btn-sm bg-accent/15 text-accent border-accent/30 hover:bg-accent/25" onclick="Modules.home._quickCreate('phoenix')">
                                <i class="fa-solid fa-plus mr-1"></i>新建项目
                            </button>
                            <button class="btn btn-sm bg-white/5 text-dim border-white/10 hover:bg-white/10" onclick="App.nav('project_manager')">
                                <i class="fa-solid fa-layer-group mr-1"></i>项目管理
                            </button>
                        </div>
                    </section>

                    <section class="genesis-start-section">
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <div class="text-sm font-bold">你现在要干嘛？</div>
                                <div class="text-[10px] text-dim mt-1">按手里的材料选，不用理解系统结构。</div>
                            </div>
                        </div>
                        <div class="genesis-path-grid grid grid-cols-3 gap-3">
                            ${this._renderModeCard('phoenix')}
                            ${this._renderModeCard('import')}
                            ${this._renderModeCard('fusion')}
                        </div>
                    </section>

                    <section id="genesis-active-command"></section>

                    <section class="grid grid-cols-12 gap-4">
                        <div class="col-span-8 space-y-4">
                            <div id="genesis-project-list"></div>
                        </div>
                        <aside class="col-span-4 space-y-4">
                            <div id="genesis-next-actions"></div>
                        </aside>
                    </section>

                    <details class="rounded-lg border border-white/5 bg-white/[0.025] overflow-hidden">
                        <summary class="cursor-pointer list-none px-4 py-3 flex items-center justify-between">
                            <span class="text-sm font-bold">数据概览和系统状态</span>
                            <span class="text-[10px] text-dim">需要时再看 <i class="fa-solid fa-chevron-down ml-1"></i></span>
                        </summary>
                        <div class="border-t border-white/5 p-4 grid grid-cols-12 gap-4">
                            <div id="genesis-kpi-grid" class="col-span-8 grid grid-cols-4 gap-3"></div>
                            <div id="genesis-system-health" class="col-span-4"></div>
                        </div>
                    </details>

                    <section>
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <div class="text-sm font-bold">常用模块</div>
                                <div class="text-[10px] text-dim mt-1">少绕路，直接进工具</div>
                            </div>
                        </div>
                        <div class="grid grid-cols-6 gap-3">
                            ${[
                                ['writer','fa-feather-pointed','长篇执笔','正文与章节', 'amber'],
                                ['world_engine','fa-atom','世界引擎','实体与设定', 'cyan'],
                                ['phoenix','fa-fire-flame-curved','凤凰流','从零构建', 'orange'],
                                ['fusion_book','fa-book-open-reader','融合拆书','技法萃取', 'emerald'],
                                ['creative_studio','fa-wand-magic-sparkles','创意工坊','灵感工具', 'pink'],
                                ['rag_context','fa-magnifying-glass-chart','RAG上下文','检索注入', 'teal']
                            ].map(([id, icon, title, sub, color]) => `
                                <button class="text-left rounded-lg border border-white/5 bg-white/[0.025] hover:bg-white/5 hover:border-${color}-500/30 p-3 transition-all" onclick="App.nav('${id}')">
                                    <i class="fa-solid ${icon} text-${color}-400 text-base mb-3"></i>
                                    <div class="text-xs font-bold text-white">${title}</div>
                                    <div class="text-[10px] text-dim mt-1">${sub}</div>
                                </button>
                            `).join('')}
                        </div>
                    </section>
                </div>
            </div>
        </div>`;
    },

    async init() {
        await this._refreshDashboard();
    },

    async _refreshDashboard() {
        await this._loadProjects();
        await this._loadWorkspaceStats();
        await this._renderActiveCommand();
        this._renderKpis();
        this._renderProjectList();
        this._renderNextActions();
        await this._renderSystemHealth();
        GenesisCore._updateUIIndicators();
    },

    async _loadProjects() {
        this._projects = await GenesisCore.getProjects();
    },

    async _loadWorkspaceStats() {
        const safeCount = async (store) => {
            try { return (await DB.getAll(store) || []).length; } catch(e) { return 0; }
        };
        const safeItems = async (store) => {
            try { return await DB.getAll(store) || []; } catch(e) { return []; }
        };
        const chapters = await safeItems('chapters');
        this._workspaceStats = {
            projects: this._projects.length,
            words: this._projects.reduce((sum, p) => sum + (p.wordCount || 0), 0) || chapters.reduce((sum, c) => sum + ((c.content || c.text || '').length), 0),
            chapters: this._projects.reduce((sum, p) => sum + (p.chapterCount || 0), 0) || chapters.length,
            entities: await safeCount('entities'),
            vectors: await safeCount('vectors'),
            sessions: await safeCount('chat_sessions')
        };
    },

    async _renderActiveCommand() {
        const el = document.getElementById('genesis-active-command');
        if (!el) return;
        const active = await GenesisCore.getActiveProject();
        if (!active) {
            el.innerHTML = `
            <div class="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 flex items-center justify-between gap-4">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex center shrink-0"><i class="fa-solid fa-bolt text-amber-400"></i></div>
                    <div class="min-w-0">
                        <div class="text-sm font-bold text-white">还没选中项目</div>
                        <div class="text-[11px] text-dim mt-1">上面可以直接新建；已有项目就去项目管理激活。</div>
                    </div>
                </div>
                <button class="btn btn-sm bg-accent/15 text-accent border-accent/30" onclick="App.nav('project_manager')">
                    <i class="fa-solid fa-layer-group mr-1"></i>去选项目
                </button>
            </div>`;
            return;
        }

        const config = GenesisCore.getModeConfig(active.mode);
        const stage = config.stages[active.stageIndex || 0] || config.stages[0];
        const progress = this._stageProgress(active);
        const route = this._routeForProject(active);
        const escapedName = this._escapeHtml(active.name);
        el.innerHTML = `
        <div class="rounded-lg border border-${config.color}-500/25 bg-${config.color}-500/[0.06] p-4">
            <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="w-8 h-8 rounded-lg bg-${config.color}-500/10 flex center"><i class="fa-solid ${config.icon} text-${config.color}-400"></i></span>
                        <span class="text-base font-bold text-white truncate">${escapedName}</span>
                        <span class="text-[10px] px-2 py-1 rounded bg-${config.color}-500/15 text-${config.color}-400 border border-${config.color}-500/25">${config.label}</span>
                        <span class="text-[10px] text-dim">${this._statusLabel(active.status)}</span>
                    </div>
                    <div class="mt-3 flex items-center gap-3">
                        <div class="flex-1 h-2 bg-black/30 rounded-full overflow-hidden min-w-[220px]">
                            <div class="h-full bg-${config.color}-400 rounded-full" style="width:${progress}%"></div>
                        </div>
                        <span class="text-[10px] text-${config.color}-400 font-bold">${stage ? stage.label : '准备'}</span>
                        <span class="text-[10px] text-dim">${active.chapterCount || 0}章 · ${this._formatNumber(active.wordCount || 0)}字</span>
                    </div>
                </div>
                <div class="flex gap-2 shrink-0">
                    <button class="btn btn-sm bg-accent/20 text-accent border-accent/30 font-bold" onclick="GenesisCore.continueWriting()">
                        <i class="fa-solid fa-arrow-right mr-1"></i>${route.label}
                    </button>
                    <button class="btn btn-sm bg-white/5 text-dim border-white/10 hover:bg-white/10" onclick="App.nav('project_manager')">
                        <i class="fa-solid fa-sliders mr-1"></i>治理
                    </button>
                </div>
            </div>
        </div>`;
    },

    _renderKpis() {
        const el = document.getElementById('genesis-kpi-grid');
        if (!el) return;
        const s = this._workspaceStats || {};
        const active = this._projects.find(p => p.id === GenesisCore._activeProjectId);
        const kpis = [
            ['项目', s.projects || 0, active ? '1 个活跃' : '未激活', 'fa-layer-group', 'blue'],
            ['字数', this._formatNumber(s.words || 0), '累计工程量', 'fa-keyboard', 'amber'],
            ['章节', s.chapters || 0, '可被执笔台读取', 'fa-book-open', 'emerald'],
            ['实体', s.entities || 0, '世界引擎资产', 'fa-cubes', 'pink']
        ];
        el.innerHTML = kpis.map(([label, value, sub, icon, color]) => `
            <div class="rounded-lg border border-white/5 bg-white/[0.025] p-4">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-[10px] text-dim font-bold uppercase">${label}</span>
                    <i class="fa-solid ${icon} text-${color}-400/70 text-xs"></i>
                </div>
                <div class="text-2xl font-bold text-white font-mono">${value}</div>
                <div class="text-[10px] text-dim mt-1">${sub}</div>
            </div>
        `).join('');
    },

    _renderProjectList() {
        const el = document.getElementById('genesis-project-list');
        if (!el) return;
        const recent = this._projects.slice(0, 5);
        if (!recent.length) {
            el.innerHTML = `
            <div class="rounded-lg border border-white/5 bg-white/[0.025] p-8 text-center">
                <i class="fa-solid fa-folder-open text-3xl text-white/20 mb-3"></i>
                <div class="text-sm font-bold text-white">项目库为空</div>
                <div class="text-xs text-dim mt-2">先建一个项目，系统才知道你的章节和设定归谁管。</div>
                <button class="btn btn-sm bg-accent/15 text-accent border-accent/30 mt-4" onclick="Modules.home._quickCreate('phoenix')">创建第一个项目</button>
            </div>`;
            return;
        }
        el.innerHTML = `
        <div class="rounded-lg border border-white/5 bg-white/[0.025] overflow-hidden">
            <div class="h-11 px-4 flex items-center justify-between border-b border-white/5">
                <div>
                    <span class="text-sm font-bold text-white">最近项目</span>
                    <span class="text-[10px] text-dim ml-2">${this._projects.length} 个</span>
                </div>
                <button class="text-[10px] text-dim hover:text-white" onclick="App.nav('project_manager')">查看全部 <i class="fa-solid fa-arrow-right ml-1"></i></button>
            </div>
            <div class="divide-y divide-white/5">
                ${recent.map(p => this._renderProjectRow(p)).join('')}
            </div>
        </div>`;
    },

    _renderProjectRow(p) {
        const config = GenesisCore.getModeConfig(p.mode);
        const isActive = p.id === GenesisCore._activeProjectId;
        const stage = config.stages[p.stageIndex || 0] || config.stages[0];
        const next = this._nextAction(p);
        const name = this._escapeHtml(p.name);
        return `
        <div class="px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/[0.025]">
            <div class="flex items-center gap-3 min-w-0">
                <span class="w-9 h-9 rounded-lg bg-${config.color}-500/10 flex center shrink-0"><i class="fa-solid ${config.icon} text-${config.color}-400"></i></span>
                <div class="min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-bold text-white truncate">${name}</span>
                        ${isActive ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-${config.color}-500/15 text-${config.color}-400">活跃</span>` : ''}
                    </div>
                    <div class="text-[10px] text-dim mt-1">${config.shortLabel} · ${this._statusLabel(p.status)} · ${stage ? stage.label : '准备'} · ${this._formatRelative(p.updatedAt)}</div>
                    <div class="text-[10px] text-gray-400 mt-1">下一步：${next.label}</div>
                </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
                <span class="text-[10px] text-dim hidden md:inline">${p.chapterCount || 0}章 · ${this._formatNumber(p.wordCount || 0)}字</span>
                ${isActive ? `
                    <button class="btn btn-xs bg-accent/15 text-accent border-accent/30" onclick="GenesisCore.continueWriting()">继续</button>
                ` : `
                    <button class="btn btn-xs bg-white/5 text-dim border-white/10 hover:bg-white/10" onclick="Modules.home._activateProject('${p.id}')">激活</button>
                `}
            </div>
        </div>`;
    },

    _renderNextActions() {
        const el = document.getElementById('genesis-next-actions');
        if (!el) return;
        const active = this._projects.find(p => p.id === GenesisCore._activeProjectId);
        const actions = active ? this._actionsForProject(active) : [
            ['project_manager','fa-layer-group','选择项目','已有项目从这里激活'],
            ['settings','fa-plug','配置 API','让生成能力可用'],
            ['reader_center','fa-book-open','导入素材','把已有文本放进系统']
        ];
        el.innerHTML = `
        <div class="rounded-lg border border-white/5 bg-white/[0.025] p-4">
            <div class="flex items-center justify-between mb-3">
                <div class="text-sm font-bold">下一步</div>
                <span class="text-[10px] text-dim">直接点</span>
            </div>
            <div class="space-y-2">
                ${actions.map(([id, icon, title, sub]) => `
                    <button class="w-full text-left rounded-lg bg-black/25 border border-white/5 hover:border-accent/25 hover:bg-white/[0.04] p-3 transition-all" onclick="App.nav('${id}')">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid ${icon} text-accent text-xs"></i>
                            <span class="text-xs font-bold text-white">${title}</span>
                        </div>
                        <div class="text-[10px] text-dim mt-1">${sub}</div>
                    </button>
                `).join('')}
            </div>
        </div>`;
    },

    async _renderSystemHealth() {
        const el = document.getElementById('genesis-system-health');
        if (!el) return;
        const count = async (store) => { try { return (await DB.getAll(store) || []).length; } catch(e) { return 0; } };
        const textApis = await count('text_api_pool');
        const imageApis = await count('image_api_pool');
        const s = this._workspaceStats || {};
        const items = [
            ['文本 API', textApis ? `${textApis} 条` : '未配置', textApis ? 'ok' : 'warn'],
            ['图像 API', imageApis ? `${imageApis} 条` : '可选', imageApis ? 'ok' : 'muted'],
            ['RAG 向量', `${s.vectors || 0} 条`, (s.vectors || 0) ? 'ok' : 'muted'],
            ['对话会话', `${s.sessions || 0} 个`, (s.sessions || 0) ? 'ok' : 'muted']
        ];
        const tone = { ok: ['emerald','fa-check'], warn: ['amber','fa-triangle-exclamation'], muted: ['gray','fa-minus'] };
        el.innerHTML = `
        <div class="rounded-lg border border-white/5 bg-white/[0.025] p-4">
            <div class="flex items-center justify-between mb-3">
                <div class="text-sm font-bold">系统状态</div>
                <button class="text-[10px] text-dim hover:text-white" onclick="Modules.home._refreshDashboard()">刷新</button>
            </div>
            <div class="space-y-2">
                ${items.map(([label, value, state]) => {
                    const [color, icon] = tone[state];
                    return `
                    <div class="flex items-center justify-between rounded-lg bg-black/20 border border-white/5 px-3 py-2">
                        <div class="flex items-center gap-2"><i class="fa-solid ${icon} text-${color}-400 text-[10px]"></i><span class="text-xs text-gray-300">${label}</span></div>
                        <span class="text-[10px] text-dim">${value}</span>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    },

    _pathProfile(mode) {
        const config = GenesisCore.getModeConfig(mode);
        const map = {
            phoenix: {
                headline: '我要从零写一本',
                plain: '没有原稿，先出细纲，再把人物、规则、伏笔提进世界引擎。',
                result: '产出：执行级细纲 + 知识图谱 + 正文上下文',
                target: 'phoenix',
                targetLabel: '进从零写',
                steps: ['开书', '细纲', '入图谱', '写正文']
            },
            import: {
                headline: '我要接着已有作品写',
                plain: '已有正文保留在执笔台，系统拆细纲、提实体，缺的章继续写。',
                result: '产出：原文章节 + 续写细纲 + 图谱上下文',
                target: 'world_engine',
                targetLabel: '去导入解析',
                steps: ['导入正文', '拆细纲', '入图谱', '补续写']
            },
            fusion: {
                headline: '我要拆书融合出新书',
                plain: '拿两本参考书，只提炼技法，不搬内容。',
                result: '产出：技法模板 + 融合细纲 + 新正文',
                target: 'fusion_book',
                targetLabel: '去融合拆书',
                steps: ['导入双书', '拆技法', '融合细纲', '写新书']
            }
        };
        return { ...map[mode], config };
    },

    _renderModeCard(mode) {
        const profile = this._pathProfile(mode);
        const config = profile.config;
        const active = this._projects.find(p => p.id === GenesisCore._activeProjectId && p.mode === mode);
        return `
        <div class="genesis-path-card rounded-lg border border-${config.color}-500/20 bg-${config.color}-500/[0.045] p-4 flex flex-col min-h-[210px]">
            <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg bg-${config.color}-500/10 border border-${config.color}-500/20 flex center shrink-0"><i class="fa-solid ${config.icon} text-${config.color}-400"></i></div>
                <div class="min-w-0">
                    <div class="text-base font-bold text-white leading-tight">${profile.headline}</div>
                    <div class="text-[11px] text-${config.color}-300 mt-1">${config.label}</div>
                </div>
            </div>
            <div class="text-xs text-gray-300 leading-relaxed mt-3">${profile.plain}</div>
            <div class="text-[10px] text-dim mt-2">${profile.result}</div>
            <div class="grid grid-cols-4 gap-1.5 mt-4">
                ${profile.steps.map((s, i) => `
                    <div class="rounded-md bg-black/22 border border-white/5 px-1.5 py-2 text-center">
                        <div class="mx-auto mb-1 h-5 w-5 rounded-full bg-${config.color}-500/${i === 0 ? '25' : '10'} text-${config.color}-300 flex center text-[9px] font-bold">${i + 1}</div>
                        <div class="text-[9px] text-gray-300 truncate">${s}</div>
                    </div>
                `).join('')}
            </div>
            <div class="mt-auto pt-4 grid grid-cols-2 gap-2">
                ${active ? `
                    <button class="btn btn-xs bg-accent/20 text-accent border-accent/30 font-bold" onclick="GenesisCore.continueWriting()">
                        继续当前
                    </button>
                ` : `
                    <button class="btn btn-xs bg-${config.color}-500/20 text-${config.color}-300 border-${config.color}-500/30 font-bold" onclick="Modules.home._quickCreate('${mode}')">
                        新建开始
                    </button>
                `}
                <button class="btn btn-xs bg-white/5 text-dim border-white/10 hover:bg-white/10" onclick="App.nav('${profile.target}')">
                    ${profile.targetLabel}
                </button>
            </div>
        </div>`;
    },

    _actionsForProject(p) {
        if (p.mode === 'phoenix') {
            if ((p.stageIndex || 0) <= 0) return [['phoenix','fa-fire','生成细纲','从题材和欲望做执行级细纲'], ['phoenix','fa-diagram-project','实体入图谱','把人物规则伏笔注入世界引擎'], ['writer','fa-feather-pointed','进入执笔','用图谱上下文写正文']];
            return [['phoenix','fa-fire','推进细纲','继续定稿和提取实体'], ['world_engine','fa-atom','查看图谱','复查实体、规则和关系'], ['writer','fa-feather-pointed','开始正文','按细纲写下一章']];
        }
        if (p.mode === 'import') return [['world_engine','fa-file-import','导入正文','原文进入执笔台保留'], ['world_engine','fa-diagram-project','拆纲入图谱','拆细纲并提取实体关系'], ['writer','fa-feather-pointed','补续写','已有正文不动，只写缺口和后续']];
        return [['fusion_book','fa-code-compare','运行拆书','提取两本书的技法差异'], ['fusion_workbench','fa-table-columns','查看成果','管理拆书输出'], ['writer','fa-feather-pointed','融合写作','把技法落到正文']];
    },

    _routeForProject(p) {
        if (p.mode === 'phoenix') return (p.stageIndex || 0) <= 1 ? { id: 'phoenix', label: '推进凤凰流' } : { id: 'writer', label: '继续写作' };
        if (p.mode === 'import') return (p.stageIndex || 0) <= 2 ? { id: 'world_engine', label: '拆纲入图谱' } : { id: 'writer', label: '补续写' };
        return (p.stageIndex || 0) <= 3 ? { id: 'fusion_book', label: '运行拆书' } : { id: 'writer', label: '融合写作' };
    },

    async _quickCreate(mode) {
        if (Modules.project_manager && Modules.project_manager._showCreateModal) {
            Modules.project_manager._showCreateModal(mode);
        } else {
            App.nav('project_manager');
        }
    },

    async _activateProject(id) {
        if (Modules.project_manager && Modules.project_manager._activateProject) {
            await Modules.project_manager._activateProject(id, { silent: true });
        } else {
            GenesisCore.setActiveProject(id);
        }
        UI.toast('项目已激活');
        await this._refreshDashboard();
    },

    _nextAction(p) {
        const idx = Number(p?.stageIndex || 0);
        const map = {
            phoenix: ['一句话开书', '定稿细纲', '实体入图谱', '进入执笔台'],
            import: ['导入正文', '拆成细纲', '实体入图谱', '补缺章/续写'],
            fusion: ['导入参考A', '导入参考B', '对比技法', '融合细纲', '进入执笔台']
        };
        const steps = map[p?.mode] || map.phoenix;
        return { label: steps[Math.min(idx, steps.length - 1)] || steps[0] };
    },

    _stageProgress(p) {
        const stages = GenesisCore.getModeConfig(p.mode).stages || [];
        if (stages.length <= 1) return 0;
        return Math.max(0, Math.min(100, Math.round(((p.stageIndex || 0) / (stages.length - 1)) * 100)));
    },

    _statusLabel(status) {
        return ({ creating: '刚开始', world_ready: '资料就绪', outlined: '大纲完成', writing: '写正文', completed: '已完结' })[status] || status || '未开始';
    },

    _formatNumber(n) {
        n = Number(n || 0);
        return n >= 10000 ? (n / 10000).toFixed(n >= 100000 ? 0 : 1) + '万' : n.toLocaleString();
    },

    _formatRelative(ts) {
        if (!ts) return '无记录';
        const diff = Date.now() - ts;
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
        if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
        return new Date(ts).toLocaleDateString('zh-CN');
    },

    _escapeHtml(text) {
        return String(text || '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    }
};
