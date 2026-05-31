// CorePathHub — 三条创作路径的统一接线器
// 路径: 凤凰从零 / 导入新书续写 / 拆书融合
var CorePathHub = {
    routes: {
        phoenix: {
            label: '从零写一本',
            short: '从零写',
            desc: '题材、执行级细纲、实体图谱、正文',
            plain: '没有原稿；可先试写，也可先做细纲。',
            icon: 'fa-fire',
            color: 'orange',
            entry: 'phoenix',
            steps: ['开书', '细纲', '图谱', '正文']
        },
        import: {
            label: '导入新书材料',
            short: '导入新书',
            desc: '一句话开书、细纲入工作台、正文进执笔',
            plain: '细纲先进工作台，正文直进执笔台；精读解析交给凤凰流。',
            icon: 'fa-file-import',
            color: 'cyan',
            entry: 'world_engine',
            steps: ['开书', '细纲工作台', '执笔']
        },
        fusion: {
            label: '拆书融合出新书',
            short: '拆书融合',
            desc: '双书导入、循环拆技法、融合细纲、图谱正文',
            plain: '参考书只提技法；可先拆循环，也可先写样章。',
            icon: 'fa-code-compare',
            color: 'purple',
            entry: 'fusion_book',
            steps: ['双书', '循环技法', '新细纲', '正文']
        }
    },

    modules: {
        phoenix: {
            title: '凤凰创作流',
            role: '从零创世入口',
            focus: '从题材生成执行级细纲，再提实体进世界引擎，最后进执笔台。',
            next: '推进细纲/图谱',
            route: 'phoenix'
        },
        writer: {
            title: '长篇执笔',
            role: '正文生产终点',
            focus: '三条路径最后都回到这里写正文、润色、审稿。',
            next: '写当前章节',
            route: 'phoenix'
        },
        world_engine: {
            title: '世界引擎',
            role: '知识图谱与导入解析中枢',
            focus: '从零项目沉淀实体关系；导入项目先把细纲和正文放到对应位置，再由凤凰流/世界引擎精读解析。',
            next: '导入/入图谱',
            route: 'import'
        },
        fusion_book: {
            title: '融合拆书',
            role: '拆书融合入口',
            focus: '导入两本参考书，按循环/卷提取技法；也允许先写样章，再反拆成可复用模板。',
            next: '开始循环融合',
            route: 'fusion'
        },
        fusion_workbench: {
            title: '拆书工作台',
            role: '融合结果管理',
            focus: '查看拆解、对比、融合精华、细纲和正文结果。',
            next: '查看结果并送执笔',
            route: 'fusion'
        }
    },

    render(moduleId, options = {}) {
        const meta = this.modules[moduleId] || this.modules.writer;
        const compact = !!options.compact;
        const activeId = localStorage.getItem('genesis_active_project') || GenesisCore?._activeProjectId || '';
        const statusText = activeId ? '已激活项目' : '还没有活跃项目';
        const statusTone = activeId ? 'text-green-300 border-green-500/20 bg-green-500/10' : 'text-amber-300 border-amber-500/20 bg-amber-500/10';
        if (compact) {
            return `
                <div class="core-path-hub border-b border-white/5 bg-[#09090b] p-3 space-y-2">
                    <div class="rounded-lg border ${statusTone} px-3 py-2">
                        <div class="text-[9px] opacity-70">活跃项目</div>
                        <div class="text-[11px] font-bold truncate" data-core-path-active>${statusText}</div>
                    </div>
                    <div class="grid grid-cols-3 gap-1.5">
                        ${Object.entries(this.routes).map(([id, r]) => `
                            <button class="rounded-lg border ${meta.route === id ? `border-${r.color}-500/35 bg-${r.color}-500/15 text-${r.color}-300` : 'border-white/5 bg-white/[0.03] text-gray-400 hover:bg-white/[0.07]'} px-2 py-2 text-center transition" onclick="CorePathHub.openRoute('${id}')" title="${r.desc}">
                                <i class="fa-solid ${r.icon} block mb-1"></i>
                                <span class="text-[9px] font-bold">${r.short || r.label}</span>
                            </button>
                        `).join('')}
                    </div>
                    <div class="flex gap-1.5">
                        <button class="h-8 flex-1 rounded-lg bg-accent/15 text-accent border border-accent/30 text-[10px] font-bold hover:bg-accent/25" onclick="CorePathHub.next()">
                            <i class="fa-solid fa-forward-step mr-1"></i>下一步
                        </button>
                        <button class="h-8 px-2 rounded-lg bg-white/5 text-gray-300 border border-white/10 text-[10px] hover:bg-white/10" onclick="App.nav('project_manager')">
                            项目
                        </button>
                    </div>
                </div>`;
        }
        const routeButtons = Object.entries(this.routes).map(([id, r]) => {
            const isCurrent = meta.route === id;
            return `
                <button class="rounded-lg border ${isCurrent ? `border-${r.color}-500/35 bg-${r.color}-500/15 text-${r.color}-300` : 'border-white/5 bg-white/[0.03] text-gray-400 hover:bg-white/[0.07] hover:text-white'} px-3 py-2 text-left transition" onclick="CorePathHub.openRoute('${id}')">
                    <div class="flex items-center gap-2 text-[11px] font-bold">
                        <i class="fa-solid ${r.icon}"></i>${r.short || r.label}
                    </div>
                    <div class="text-[9px] opacity-70 mt-0.5">${r.plain || r.desc}</div>
                </button>`;
        }).join('');

        return `
            <div class="core-path-hub border-b border-white/5 bg-[#09090b] ${compact ? 'p-2' : 'p-3'}">
                <div class="flex items-center gap-3">
                    <div class="min-w-[190px]">
                        <div class="text-[10px] text-dim font-bold uppercase">当前模块</div>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-sm font-bold text-white">${meta.title}</span>
                            <span class="text-[9px] px-1.5 py-0.5 rounded border border-white/10 text-dim">${meta.role}</span>
                        </div>
                    </div>
                    <div class="min-w-[220px] rounded-lg border ${statusTone} px-3 py-2">
                        <div class="text-[9px] opacity-70">活跃项目</div>
                        <div class="text-[11px] font-bold truncate" data-core-path-active>${statusText}</div>
                    </div>
                    <div class="grid grid-cols-3 gap-2 flex-1 min-w-[360px]">
                        ${routeButtons}
                    </div>
                    <div class="w-[220px] hidden xl:block">
                        <div class="text-[10px] text-dim leading-relaxed">${meta.focus}</div>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        <button class="h-8 px-3 rounded-lg bg-accent/15 text-accent border border-accent/30 text-[11px] font-bold hover:bg-accent/25" onclick="CorePathHub.next()">
                            <i class="fa-solid fa-forward-step mr-1"></i>${meta.next}
                        </button>
                        <button class="h-8 px-3 rounded-lg bg-white/5 text-gray-300 border border-white/10 text-[11px] hover:bg-white/10" onclick="App.nav('project_manager')">
                            <i class="fa-solid fa-layer-group mr-1"></i>项目
                        </button>
                    </div>
                </div>
            </div>`;
    },

    async refresh() {
        const nodes = document.querySelectorAll('[data-core-path-active]');
        if (!nodes.length || typeof GenesisCore === 'undefined') return;
        const proj = await GenesisCore.getActiveProject();
        nodes.forEach(node => {
            node.textContent = proj ? `${proj.name} · ${this._modeLabel(proj.mode)}` : '还没有活跃项目';
            node.title = proj ? proj.id : '';
        });
    },

    async openRoute(mode) {
        const route = this.routes[mode] || this.routes.phoenix;
        const proj = await GenesisCore.getActiveProject();
        if (!proj) {
            return this.createProject(mode);
        }
        App.nav(route.entry);
        if (mode === 'import') {
            setTimeout(() => Modules.world_engine?._openNovelImportModal?.(), 180);
        }
        setTimeout(() => this.refresh(), 80);
    },

    async createProject(mode) {
        const route = this.routes[mode] || this.routes.phoenix;
        const name = prompt(`新建${route.label}项目名称：`, `${route.label}_${new Date().toLocaleDateString('zh-CN')}`);
        if (!name) return;
        const proj = await GenesisCore.createProject({
            name,
            mode,
            metadata: { intent: route.desc, createdFrom: 'core_path_hub' }
        });
        UI.toast(`已创建并激活：${proj.name}`);
        App.nav(route.entry);
        if (mode === 'import') {
            setTimeout(() => Modules.world_engine?._openNovelImportModal?.(), 180);
        }
        setTimeout(() => this.refresh(), 80);
    },

    async next() {
        const proj = await GenesisCore.getActiveProject();
        if (!proj) {
            UI.toast('先创建或激活一个项目');
            App.nav('project_manager');
            return;
        }
        await GenesisCore.continueWriting();
        setTimeout(() => this.refresh(), 80);
    },

    _modeLabel(mode) {
        return (GenesisCore.getModeConfig(mode) || {}).label || mode || '项目';
    }
};

if (typeof window !== 'undefined') window.CorePathHub = CorePathHub;
