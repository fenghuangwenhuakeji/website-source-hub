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
            desc: '双书技法萃取',
            stages: [
                { id: 'deconstruct_a', label: '拆书A', icon: 'fa-book-open' },
                { id: 'deconstruct_b', label: '拆书B', icon: 'fa-book-open-reader' },
                { id: 'compare', label: '对比', icon: 'fa-scale-balanced' },
                { id: 'fuse', label: '融合', icon: 'fa-flask' },
                { id: 'write', label: '写作', icon: 'fa-pen-nib' }
            ],
            entryModule: 'fusion_book',
            dataSchema: { bookA: { name: '', chapters: [], patterns: [], essence: '', stats: {} }, bookB: { name: '', chapters: [], patterns: [], essence: '', stats: {} }, compareResult: { similarities: [], differences: [], insights: [] }, fusionTechniques: [], writingTemplates: [], fusionRules: '', pipelineResults: {} },
            features: ['dual_deconstruct', 'pattern_extract', 'compare_engine', 'fusion_lab']
        }
    },

    init() { this._activeProjectId = localStorage.getItem('genesis_active_project') || null; },
    async getActiveProject() { if (!this._activeProjectId) return null; return await DB.get('projects', this._activeProjectId); },
    setActiveProject(id) { this._activeProjectId = id; if (id) localStorage.setItem('genesis_active_project', id); else localStorage.removeItem('genesis_active_project'); this._updateUIIndicators(); },
    clearActiveProject() { this._activeProjectId = null; localStorage.removeItem('genesis_active_project'); this._updateUIIndicators(); },
    getModeConfig(mode) { return this.MODE_CONFIG[mode] || this.MODE_CONFIG.phoenix; },

    async createProject(opts = {}) {
        const id = Utils && Utils.uuid ? Utils.uuid() : ('proj_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8));
        const mode = opts.mode || 'phoenix';
        const config = this.MODE_CONFIG[mode] || {};
        const project = {
            id, name: opts.name || '未命名项目', mode, status: 'creating', stageIndex: 0,
            bookId: null, worldEngineId: null, fusionBookIds: [], chapterCount: 0, wordCount: 0,
            createdAt: Date.now(), updatedAt: Date.now(), metadata: opts.metadata || {},
            modeData: JSON.parse(JSON.stringify(config.dataSchema || {})), modes: [mode]
        };
        await DB.put('projects', project); this.setActiveProject(id);
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
