// Genesis Core v2.2
const GenesisCore = {
    _activeProjectId: null,
    VERSION: '2.2',
    MODE_CONFIG: {
        phoenix: {
            label: '凤凰创作流', shortLabel: '凤凰', icon: 'fa-fire', color: 'orange', themeColor: '#f97316',
            bgGradient: 'from-orange-900/30 to-red-900/20',
            desc: '从零创世',
            stages: [
                { id: 'seed', label: '开书', icon: 'fa-seedling' },
                { id: 'outline', label: '细纲', icon: 'fa-list-ol' },
                { id: 'graph', label: '入图谱', icon: 'fa-diagram-project' },
                { id: 'write', label: '正文', icon: 'fa-pen-nib' }
            ],
            entryModule: 'phoenix',
            dataSchema: { worldSetting: {}, timeline: [], powerSystem: {}, factions: [], geography: {}, volumes: [], globalOutline: '', styleRules: '', nexusSnapshot: {} },
            features: ['world_builder', 'timeline', 'power_system', 'faction_map', 'auto_outline']
        },
        import: {
            label: '导入续写', shortLabel: '续写', icon: 'fa-file-import', color: 'cyan', themeColor: '#06b6d4',
            bgGradient: 'from-cyan-900/30 to-blue-900/20',
            desc: '已有作品续写',
            stages: [
                { id: 'import_text', label: '导入正文', icon: 'fa-file-lines' },
                { id: 'outline', label: '拆细纲', icon: 'fa-list-ol' },
                { id: 'graph', label: '入图谱', icon: 'fa-diagram-project' },
                { id: 'continue', label: '补续写', icon: 'fa-pen-nib' }
            ],
            entryModule: 'world_engine',
            dataSchema: { originalText: '', parsedStructure: {}, extractedEntities: [], styleFingerprint: '', continuationPoint: { chapterIndex: 0, position: 'end' }, importSummary: '', originalStats: { wordCount: 0, chapterCount: 0, genre: '' } },
            features: ['novel_parser', 'entity_extract', 'style_clone', 'continuation']
        },
        fusion: {
            label: '拆书融合', shortLabel: '拆书', icon: 'fa-code-compare', color: 'purple', themeColor: '#a855f7',
            bgGradient: 'from-purple-900/30 to-fuchsia-900/20',
            desc: '双书技法融合',
            stages: [
                { id: 'import_books', label: '导入双书', icon: 'fa-book-open' },
                { id: 'cycle_patterns', label: '循环拆技法', icon: 'fa-rotate' },
                { id: 'fusion_ammo', label: '融合弹药', icon: 'fa-box-open' },
                { id: 'graph', label: '入图谱', icon: 'fa-diagram-project' },
                { id: 'write', label: '写正文', icon: 'fa-pen-nib' }
            ],
            entryModule: 'fusion_book',
            dataSchema: { bookA: { name: '', chapters: [], patterns: [], essence: '', stats: {} }, bookB: { name: '', chapters: [], patterns: [], essence: '', stats: {} }, cycles: [], compareResult: { similarities: [], differences: [], insights: [] }, fusionTechniques: [], writingTemplates: [], fusionRules: '', pipelineResults: {} },
            features: ['dual_deconstruct', 'cycle_pattern_extract', 'fusion_ammo', 'graph_injection']
        }
    },

    READER_PROTOCOL: {
        truth: '读者不是买故事。读者是用故事完成自己的心理动作：出气、代入、确认、冒险、复购。',
        layers: [
            '路人：前三句没有反常/压力/信息差就走',
            '饥民：要情绪饲料，爽点/虐点/甜点必须快兑现',
            '熟客：要稳定配方，追作者和系列体验',
            '共谋：把主角当自己，打赏和追更是在嘉奖自己',
            '上瘾者：靠缺口、兑现、新缺口循环继续读'
        ],
        ladder: [
            '注意：前三段至少给反常动作、时间压力、信息差中的两项',
            '好奇：每章埋微缺口/中缺口/大缺口，按节奏回收',
            '代入：锁观察者位置，写微动作、感官、环境反馈',
            '痴迷：回收一个答案，同时埋两个新问题'
        ],
        scanTriggers: ['对话', '数字', '反常动作', '身体动作', '时间压力', '未完成动作'],
        segmentRules: [
            '写前先定：这一刻读者希望主角做什么',
            '写中只写：身体在干嘛，环境怎么动',
            '写后检查：情绪词删掉，感官锚点不断，章末没有安全点'
        ],
        fatalLeaks: ['解释感太强', '主角突然变傻', '伏笔不回收', '规则临时改', '连续抽象段落', '章末问题被填满']
    },

    ROUTE_READER_PROFILES: {
        phoenix: {
            service: '服务第一次进入世界的读者，让他在前三章明白主角想要什么、怕失去什么、为什么必须追。',
            payer: '愿意为新世界、新主角、新成长线持续付费的人。',
            watch: '看主角欲望被阻挡、被压迫、再用代价换突破。',
            retention: '前三章建契约；每章回收一个小满足；每卷兑现一次大变化。',
            depth: '表层追冲突，中层追伏笔，底层追主角成长代价。',
            routeRules: ['先锁读者契约，再做世界观', '细纲每章必须写读者期待和读者恐惧', '正文每章必须有感官锚点和章末钩子']
        },
        import: {
            service: '服务已经被原文绑定的读者，续写不能背叛原有手感、人设和未回收期待。',
            payer: '愿意为原故事继续活下去付费的人。',
            watch: '看熟悉人物按原逻辑继续行动，看旧伏笔被接住，看缺口被补齐。',
            retention: '先保留原文，再拆章内细纲，确认人物已知/未知信息后续写。',
            depth: '表层追后续剧情，中层查人设一致，底层看旧情绪是否被重新点燃。',
            routeRules: ['已有正文不重写', '续写前先查CHR/WLD/FOE/EMO', '每次续写必须标注继承了哪个旧缺口']
        },
        fusion: {
            service: '服务想要熟悉快感但拒绝旧内容的读者，用两本书的技法做全新故事。',
            payer: '愿意为新鲜设定里的成熟爽感、节奏和钩子付费的人。',
            watch: '看熟悉的阅读快感换皮变异，看原创角色吃到爆款节奏。',
            retention: '循环拆技法，融合细纲，实体入图谱，正文只落原创内容。',
            depth: '表层追爽点，中层看技法组合，底层看原创世界是否站住。',
            routeRules: ['只拆技法不搬内容', '每循环检查零件过曝', '融合细纲必须写读者付费点和新缺口']
        }
    },

    WORKFLOW_PROTOCOL: {
        modes: {
            hybrid: '写作与融合拆书交替：用户可写到一半去拆几章参考书，也可拆书拆一半停下来回执笔台写。',
            write_then_split: '写到一半找书拆：先保护作者手感；写不动时进入融合拆书，提取技法后回到当前章节继续。',
            outline_first: '先拆书再写：先在融合拆书里提炼技法、节奏、钩子，再回执笔台生成或续写正文。',
            continue_existing: '导入续写：用户已写正文先保留；导入后可融合拆书技法，再从缺章、断点或末尾继续写。',
            manual: '自由手写：AI只在被要求时续写、润色、同步图谱，不主动覆盖作者正文。',
            fusion: '用拆书技法写：只借参考书技法，不借原书内容；技法落到当前原创章节。'
        },
        invariants: [
            '“拆书”只指融合拆书：拆参考书技法，不是一次性全自动拆完',
            '用户手写内容永远是源事实，AI只能补齐、续写、润色、同步图谱或融合技法',
            '正文保存后的细纲/实体提取叫同步，不在界面上称为拆书',
            '融合拆书结果可随时注入凤凰流、导入续写和执笔台',
            '直接写、续写、拆书的设定信息最终汇聚到世界引擎',
            '细纲和正文最终以长篇执笔为准，其他模块只提供素材、弹药和约束',
            '不要把内部机制显式写给用户，只把机制藏进输出质量'
        ]
    },

    init() { this._activeProjectId = localStorage.getItem('genesis_active_project') || null; },
    async getActiveProject() { if (!this._activeProjectId) return null; return await DB.get('projects', this._activeProjectId); },
    setActiveProject(id) {
        this._activeProjectId = id;
        if (id) localStorage.setItem('genesis_active_project', id);
        else {
            localStorage.removeItem('genesis_active_project');
            localStorage.removeItem('genesis_active_project_mode');
        }
        this._updateUIIndicators();
    },
    clearActiveProject() {
        this._activeProjectId = null;
        localStorage.removeItem('genesis_active_project');
        localStorage.removeItem('genesis_active_project_mode');
        this._updateUIIndicators();
    },
    getModeConfig(mode) { return this.MODE_CONFIG[mode] || this.MODE_CONFIG.phoenix; },
    getReaderProfile(mode) { return this.ROUTE_READER_PROFILES[mode] || this.ROUTE_READER_PROFILES.phoenix; },
    buildReaderContext(mode) {
        const rp = this.getReaderProfile(mode);
        const core = this.READER_PROTOCOL;
        return [
            '【读者服务协议】',
            core.truth,
            `服务对象：${rp.service}`,
            `谁付款：${rp.payer}`,
            `他在看什么：${rp.watch}`,
            `怎么留住：${rp.retention}`,
            `看多深：${rp.depth}`,
            `路线铁律：${rp.routeRules.join('；')}`,
            `沉浸阶梯：${core.ladder.join('；')}`,
            `扫描触发词：${core.scanTriggers.join('、')}`,
            `每段规则：${core.segmentRules.join('；')}`,
            `毁灭性漏点：${core.fatalLeaks.join('、')}`
        ].join('\n');
    },
    buildWorkflowContext(mode, flowMode = 'hybrid') {
        const wf = this.WORKFLOW_PROTOCOL;
        const route = this.getModeConfig(mode);
        const current = wf.modes[flowMode] || wf.modes.hybrid;
        return [
            '【写作与融合拆书协议】',
            `当前路径：${route.label}`,
            `当前工作方式：${current}`,
            `不变量：${wf.invariants.join('；')}`,
            '执行原则：写作和融合拆书可以反复切换；导入旧稿后，旧正文保留，拆书技法只作为续写弹药注入。'
        ].join('\n');
    },

    async createProject(opts = {}) {
        const id = Utils && Utils.uuid ? Utils.uuid() : ('proj_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8));
        const mode = opts.mode || 'phoenix';
        const config = this.MODE_CONFIG[mode] || {};
        const readerProfile = this.getReaderProfile(mode);
        const project = {
            id, name: opts.name || '未命名项目', mode, status: 'creating', stageIndex: 0,
            bookId: null, worldEngineId: null, fusionBookIds: [], chapterCount: 0, wordCount: 0,
            createdAt: Date.now(), updatedAt: Date.now(), metadata: { ...(opts.metadata || {}), readerProfile },
            modeData: JSON.parse(JSON.stringify(config.dataSchema || {})), modes: [mode]
        };
        await DB.put('projects', project); this.setActiveProject(id); localStorage.setItem('genesis_active_project_mode', mode);
        console.log('[GenesisCore] 项目创建:', project.name, mode); return project;
    },

    async updateProject(id, updates) {
        const proj = await DB.get('projects', id); if (!proj) return null;
        Object.assign(proj, updates, { updatedAt: Date.now() }); await DB.put('projects', proj); return proj;
    },
    async updateActiveProject(updates) { if (!this._activeProjectId) return null; return await this.updateProject(this._activeProjectId, updates); },
    async deleteProject(id) { await DB.del('projects', id); if (this._activeProjectId === id) this.clearActiveProject(); },
    async getProjects() { const all = await DB.getAll('projects') || []; return all.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)); },

    async updateModeData(updates) {
        const proj = await this.getActiveProject(); if (!proj) return null;
        const modeData = { ...(proj.modeData || {}), ...updates };
        return await this.updateActiveProject({ modeData });
    },
    async getModeData() { const proj = await this.getActiveProject(); return proj?.modeData || {}; },

    async advanceStage() {
        const proj = await this.getActiveProject(); if (!proj) return null;
        const config = this.getModeConfig(proj.mode);
        const nextIndex = (proj.stageIndex || 0) + 1;
        if (nextIndex >= config.stages.length) return proj;
        return await this.updateActiveProject({ stageIndex: nextIndex, status: nextIndex >= config.stages.length - 1 ? 'writing' : 'creating' });
    },

    async setStatus(status) {
        const valid = ['creating', 'world_ready', 'outlined', 'writing', 'completed'];
        if (!valid.includes(status)) return; await this.updateActiveProject({ status });
    },

    async autoSyncWorldEngine(projectId, data) {
        const proj = await DB.get('projects', projectId); if (!proj) return;
        if (Modules.world_engine && Modules.world_engine.syncFromProject) await Modules.world_engine.syncFromProject(projectId, data);
        await this.updateProject(projectId, { worldEngineId: projectId, status: 'world_ready' });
    },

    async autoSyncWriter(projectId, bookData) {
        const updates = { bookId: bookData.bookId, status: 'writing' };
        if (bookData.chapterCount != null) updates.chapterCount = bookData.chapterCount;
        if (bookData.wordCount != null) updates.wordCount = bookData.wordCount;
        await this.updateProject(projectId, updates);
    },

    async buildWriterContext(projectId, opts = {}) {
        const proj = await DB.get('projects', projectId); if (!proj) return '';
        let ctx = '';
        if (Modules.world_engine && Modules.world_engine.buildInjectPackage) ctx += Modules.world_engine.buildInjectPackage({ ...opts, maxLen: 4000 }) || '';
        if (proj.mode === 'phoenix' && proj.metadata && proj.metadata.outline) ctx += '\n\n【凤凰创作流大纲】\n' + proj.metadata.outline.slice(0, 2000) + '\n';
        if (proj.mode === 'fusion' && Modules.fusion_book) {
            const FB = Modules.fusion_book; const allPr = FB._allPipelineResults || {};
            if (allPr.fusion) ctx += '\n\n【拆书融合技法】\n' + allPr.fusion.slice(0, 2000) + '\n';
        }
        if (proj.mode === 'import') {
            const md = proj.modeData || {};
            if (md.importSummary) ctx += '\n\n【导入续写概要】\n' + md.importSummary.slice(0, 2000) + '\n';
            if (md.styleFingerprint) ctx += '\n\n【原文文风指纹】\n' + String(md.styleFingerprint).slice(0, 1600) + '\n';
            if (md.continuationPoint) ctx += `\n\n【续写点】第${md.continuationPoint.chapterIndex || 0}章${md.continuationPoint.position === 'end' ? '结尾之后' : '开头'}。\n已有正文不要重写，只写缺章或后续正文。\n`;
            if (md.parsedStructure?.chapters?.length) {
                const recentOutlines = md.parsedStructure.chapters.slice(-5).map(c => {
                    const partCount = (c.sections || []).length;
                    return `第${c.order}章 ${c.title}（${partCount || '?'}部分 / ${c.outlineSource || '规则'}细纲）\n${String(c.outline || '').slice(0, 700)}`;
                }).join('\n---\n');
                ctx += '\n\n【导入章节细纲索引】\n' + recentOutlines.slice(0, 3000) + '\n';
            }
            if (md.continuationPolicy) ctx += '\n【续写策略】保留已导入正文；使用章内分部分细纲、知识图谱、世界规则和未回收伏笔生成后续。\n';
        }
        return ctx;
    },

    async getProjectStats(projectId) {
        const proj = await DB.get('projects', projectId); if (!proj) return null;
        const stats = { ...proj };
        if (proj.bookId) { const chaps = await DB.getAll('chapters') || []; stats.wordCount = chaps.reduce((s, c) => s + (c.content || '').length, 0); stats.chapterCount = chaps.length; }
        return stats;
    },

    async refreshStats(projectId) {
        const proj = await DB.get('projects', projectId); if (!proj) return;
        const chaps = await DB.getAll('chapters') || [];
        await this.updateProject(projectId, { chapterCount: chaps.length, wordCount: chaps.reduce((s, c) => s + (c.content || '').length, 0) });
    },

    _updateUIIndicators() {
        const indicator = document.getElementById('genesis-active-project-bar');
        if (indicator) this._renderActiveBar(indicator);
        const miniInd = document.getElementById('genesis-mini-indicator');
        if (miniInd) this._renderMiniIndicator(miniInd);
    },

    async _renderActiveBar(el) {
        if (!this._activeProjectId) { el.innerHTML = ''; el.style.display = 'none'; return; }
        const proj = await this.getActiveProject(); if (!proj || !el) return;
        const config = this.getModeConfig(proj.mode);
        const color = config.color || 'gray';
        const stage = config.stages[proj.stageIndex || 0] || config.stages[0];
        el.style.display = 'block';
        el.innerHTML = '<div class="flex items-center justify-between px-4 py-2 bg-' + color + '-500/10 border border-' + color + '-500/20 rounded-lg">' +
            '<div class="flex items-center gap-2">' +
            '<i class="fa-solid ' + config.icon + ' text-' + color + '-400"></i>' +
            '<span class="text-sm font-bold text-white">' + proj.name + '</span>' +
            '<span class="text-[10px] px-1.5 py-0.5 rounded bg-' + color + '-500/20 text-' + color + '-400 border border-' + color + '-500/30">' + config.label + '</span>' +
            '<span class="text-[10px] text-dim">' + (stage ? stage.label : '') + '</span>' +
            '</div>' +
            '<div class="flex items-center gap-2">' +
            '<span class="text-[10px] text-dim">' + (proj.chapterCount || 0) + '章 · ' + (proj.wordCount || 0).toLocaleString() + '字</span>' +
            '<button class="text-[10px] text-red-400 hover:text-red-300 px-1" onclick="GenesisCore.clearActiveProject(); GenesisCore._updateUIIndicators();"><i class="fa-solid fa-xmark"></i></button>' +
            '</div></div>';
    },

    async _renderMiniIndicator(el) {
        if (!this._activeProjectId) { el.innerHTML = ''; el.style.display = 'none'; return; }
        const proj = await this.getActiveProject(); if (!proj) return;
        const config = this.getModeConfig(proj.mode);
        el.style.display = 'inline-flex';
        el.innerHTML = '<i class="fa-solid ' + config.icon + ' text-' + config.color + '-400 mr-1"></i><span class="truncate max-w-[120px]">' + proj.name + '</span>';
    },

    async navToModule(moduleName) {
        const proj = await this.getActiveProject();
        if (!proj) return UI.toast('请先创建或选择一个项目');
        App.nav(moduleName);
    },

    // ★ 智能继续创作 — 基于阶段自动路由
    async continueWriting() {
        const proj = await this.getActiveProject();
        if (!proj) return UI.toast('请先选择一个项目');
        const config = this.getModeConfig(proj.mode);
        const stageIdx = proj.stageIndex || 0;
        const stage = config.stages[stageIdx];

        if (proj.mode === 'phoenix') {
            if (stageIdx <= 2) App.nav('phoenix');
            else App.nav('writer');
        } else if (proj.mode === 'import') {
            if (stageIdx <= 2) {
                App.nav('world_engine');
                if (stageIdx === 0) setTimeout(() => Modules.world_engine?._openNovelImportModal?.(), 180);
            } else App.nav('writer');
        } else if (proj.mode === 'fusion') {
            if (stageIdx <= 3) App.nav('fusion_book');
            else App.nav('writer');
        } else {
            App.nav('writer');
        }
    },

    async onProjectComplete(projectId) {
        await this.updateProject(projectId, { status: 'completed' });
        if (LocalSync && LocalSync.syncAll) await LocalSync.syncAll();
    }
};
GenesisCore.init();
