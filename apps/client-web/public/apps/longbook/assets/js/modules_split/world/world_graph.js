Object.assign(Modules.world_engine, {
    // ★ 移动端3D图谱降级
    _getMobileGraphData(data) {
        if (typeof MobileEngine === 'undefined' || !MobileEngine.isMobile()) return data;
        const maxNodes = 80;
        const nodes = (data.nodes || []).slice(0, maxNodes);
        const nodeIds = new Set(nodes.map(n => n.id));
        const links = (data.links || []).filter(l => nodeIds.has(l.source) && nodeIds.has(l.target)).slice(0, 150);
        return { nodes, links };
    },
    _getGraphDPR() {
        if (typeof MobileEngine !== 'undefined' && MobileEngine.isMobile()) return Math.min(window.devicePixelRatio, 1.5);
        return window.devicePixelRatio;
    },
    _graphSyncButtons() {
        const physicsBtn = document.getElementById('we-g-physics-btn');
        if(physicsBtn) physicsBtn.innerHTML = `<i class="fa-solid fa-atom mr-1"></i>物理模拟 (${this._graphPhysics === false ? '关闭' : '开启'})`;
        const labelsBtn = document.getElementById('we-g-labels-btn');
        if(labelsBtn) labelsBtn.innerHTML = `<i class="fa-solid fa-tag mr-1"></i>${this._graphShowLabels ? '隐藏标签' : '显示标签'}`;
        const rotateBtn = document.getElementById('we-g-rotate-btn');
        if(rotateBtn) rotateBtn.innerHTML = `<i class="fa-solid fa-rotate mr-1"></i>自动旋转 (${this._graphAutoRotate ? '开启' : '关闭'})`;
    },
    _graphResetView() {
        if(!this._graph3d) return;
        try {
            const scene = this._graph3d.scene?.();
            if(scene) scene.rotation.set(0, 0, 0);
        } catch(e) {}
        try { this._graph3d.cameraPosition({ x: 0, y: 0, z: 520 }, { x: 0, y: 0, z: 0 }, 700); } catch(e) {}
        setTimeout(() => {
            try { this._graph3d?.zoomToFit?.(700, 70); } catch(e) {}
        }, 80);
    },
    _graphApplyPhysicsState() {
        if(!this._graph3d) return;
        const gd = this._graph3d.graphData?.();
        if(this._graphPhysics === false) {
            if(gd && gd.nodes) gd.nodes.forEach(n => {
                if(Number.isFinite(n.x)) n.fx = n.x;
                if(Number.isFinite(n.y)) n.fy = n.y;
                if(Number.isFinite(n.z)) n.fz = n.z;
            });
            try { this._graph3d.d3AlphaDecay(1).cooldownTicks(0); } catch(e) {}
        } else {
            if(gd && gd.nodes) gd.nodes.forEach(n => {
                delete n.fx;
                delete n.fy;
                delete n.fz;
            });
            try {
                this._graph3d.d3AlphaDecay(0.02)
                    .d3VelocityDecay(0.3)
                    .cooldownTicks(typeof MobileEngine !== 'undefined' && MobileEngine.isMobile() ? 80 : 200)
                    .d3ReheatSimulation();
            } catch(e) {}
        }
        this._graphSyncButtons();
    },
    _graphTogglePhysics() {
        this._graphPhysics = this._graphPhysics === false;
        this._graphApplyPhysicsState();
    },
    _graphMakeLabelObject(node) {
        const T = window.THREE;
        if(!T || !T.CanvasTexture || !T.Sprite || !T.Group) return null;
        const rawText = String(node.name || node.id || '');
        const text = rawText.length > 28 ? rawText.slice(0, 27) + '…' : rawText;
        const fontSize = Math.max(18, Math.min(32, 17 + (node.degree || 0) * 1.4));
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = `${node.degree > 3 ? 'bold ' : ''}${fontSize}px sans-serif`;
        const width = Math.max(72, Math.ceil(ctx.measureText(text).width + 24));
        const height = Math.ceil(fontSize + 14);
        canvas.width = width;
        canvas.height = height;
        ctx.fillStyle = 'rgba(0,0,0,0.68)';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = 'rgba(255,255,255,0.16)';
        ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
        ctx.font = `${node.degree > 3 ? 'bold ' : ''}${fontSize}px sans-serif`;
        ctx.fillStyle = node.color || '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, width / 2, height / 2);
        const texture = new T.CanvasTexture(canvas);
        texture.needsUpdate = true;
        const material = new T.SpriteMaterial({ map: texture, depthWrite: false, depthTest: false, transparent: true, opacity: 0.96 });
        const sprite = new T.Sprite(material);
        const scale = Math.max(8, Math.min(18, 7 + (node.degree || 0) * 0.9));
        sprite.scale.set(scale * (width / height), scale, 1);
        sprite.position.set(0, Math.max(9, (node.val || 5) * 1.8), 0);
        const group = new T.Group();
        group.add(sprite);
        return group;
    },
    _graphApplyLabels() {
        if(!this._graph3d) return;
        const labelFn = n => `[${n.type || '实体'}] ${n.name || n.id} (${n.degree || 0}条连线): ${n.desc || ''}`;
        try { this._graph3d.nodeLabel(labelFn); } catch(e) {}
        if(this._graphShowLabels) {
            const T = window.THREE;
            if(T && T.CanvasTexture) {
                this._graph3d.nodeThreeObject(node => this._graphMakeLabelObject(node));
                this._graph3d.nodeThreeObjectExtend(true);
            } else {
                this._graph3d.nodeThreeObject(null);
                this._graph3d.nodeThreeObjectExtend(false);
            }
        } else {
            this._graph3d.nodeThreeObject(null);
            this._graph3d.nodeThreeObjectExtend(false);
        }
        try { this._graph3d.refresh?.(); } catch(e) {}
        this._graphSyncButtons();
    },
    _graphToggleLabels() {
        this._graphShowLabels = !this._graphShowLabels;
        this._graphApplyLabels();
    },
    _graphApplyRotate() {
        if(this._graphRotateTimer) {
            clearInterval(this._graphRotateTimer);
            this._graphRotateTimer = null;
        }
        if(!this._graph3d) {
            this._graphSyncButtons();
            return;
        }
        try {
            const controls = this._graph3d.controls?.();
            if(controls) {
                controls.autoRotate = false;
                controls.autoRotateSpeed = 0;
            }
        } catch(e) {}
        if(this._graphAutoRotate) {
            this._graphRotateTimer = setInterval(() => {
                if(!this._graph3d || !this._graphAutoRotate) {
                    clearInterval(this._graphRotateTimer);
                    this._graphRotateTimer = null;
                    return;
                }
                try {
                    const scene = this._graph3d.scene?.();
                    if(scene) scene.rotation.y += 0.0035;
                } catch(e) {}
            }, 30);
        }
        this._graphSyncButtons();
    },
    _graphToggleRotate() {
        this._graphAutoRotate = !this._graphAutoRotate;
        this._graphApplyRotate();
    },

    // ═══ 刷新RAG上下文 ═══
    async _refreshRAGContext() {
        await this._ensureCache();
        const entities = (this._cachedEntities || []).filter(e => !e.id.startsWith('world_'));
        const worlds = (this._cachedEntities || []).filter(e => e.id.startsWith('world_') && e.desc);
        if(!entities.length && !worlds.length) return UI.toast('无数据可刷新');
        UI.toast('正在刷新RAG上下文...');
        let count = 0;
        for(const e of entities) {
            const content = `[${e.type}] ${e.name}: ${(e.desc||'').slice(0,500)}${e.relations && e.relations.length ? ' | 关联: ' + e.relations.join(', ') : ''}`;
            if(typeof RAGSystem !== 'undefined') { await RAGSystem.addDocument(`实体_${e.type}_${e.name}`, content, 'world_engine'); count++; }
        }
        const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
        for(const w of worlds) {
            const cat = w.id.replace('world_', '');
            if(typeof RAGSystem !== 'undefined') { await RAGSystem.addDocument(`世界观_${catLabels[cat]||cat}`, (w.desc||'').slice(0,2000), 'world_engine'); count++; }
        }
        const FB = Modules.fusion_book;
        if(FB) {
            const allPr = FB._allPipelineResults || {};
            const pr = FB._pipelineResults || {};
            const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
            if(fusion && typeof RAGSystem !== 'undefined') { await RAGSystem.addDocument('融合技法精华_' + Date.now(), fusion.slice(0,4000), 'world_engine'); count++; }
        }
        UI.toast(`RAG上下文已刷新: ${count}条数据`);
    },

    // ═══ 图谱→凤凰流/执笔台 ═══
    async _injectGraphToPhoenix() {
        await this._ensureCache();
        const pkg = this.buildInjectPackage({ includeEntities:true, includeWorld:true, includeFusion:true, maxLen:6000 });
        if(!pkg) return UI.toast('没有可注入的数据');
        if(Modules.phoenix) {
            Modules.phoenix.data = Modules.phoenix.data || {};
            Modules.phoenix.data.worldContext = pkg;
            const entities = (this._cachedEntities || []).filter(e => !e.id.startsWith('world_'));
            const relSummary = entities.filter(e => e.relations && e.relations.length).map(e => `${e.name}(${e.type}): ${e.relations.join(', ')}`).join('\n');
            if(relSummary) Modules.phoenix.data.worldContext += '\n\n【实体关系网络】\n' + relSummary.slice(0, 2000);
            UI.toast('已注入凤凰创作流 (含关系网络)');
        } else { UI.toast('凤凰创作流未加载'); }
    },
    async _injectGraphToWriter() {
        await this._ensureCache();
        const pkg = this.buildInjectPackage({ includeEntities:true, includeWorld:true, includeFusion:true, maxLen:5000 });
        if(!pkg) return UI.toast('没有可注入的数据');
        const ol = document.getElementById('w-outline');
        if(ol) {
            ol.value = (ol.value ? ol.value + '\n\n' : '') + '[世界引擎·知识图谱注入]\n' + pkg;
            if(typeof MemorySystem !== 'undefined') MemorySystem.addWorking('[知识图谱注入] ' + pkg.slice(0, 500), 'world_graph', 5, { source: 'world_engine' });
            UI.toast('已注入执笔台 (含记忆关联)');
        } else {
            if(typeof MemorySystem !== 'undefined') MemorySystem.addWorking('[知识图谱] ' + pkg.slice(0, 800), 'world_graph', 5, { source: 'world_engine' });
            UI.toast('已存入工作记忆，打开执笔台后可用');
        }
    },
    _exportGraph: async () => {
        const we = Modules.world_engine;
        await we._ensureCache();
        const entities = (we._cachedEntities || []).filter(e => !e.id.startsWith('world_'));
        if(!entities.length) return UI.toast('无实体数据');
        let md = '# 知识图谱导出\n\n';
        const grouped = {};
        entities.forEach(e => { const t = e.type || '其他'; if(!grouped[t]) grouped[t] = []; grouped[t].push(e); });
        for(const [type, items] of Object.entries(grouped)) {
            md += `## ${type} (${items.length})\n`;
            items.forEach(e => {
                md += `### ${e.name}\n${e.desc || '无描述'}\n`;
                if(e.relations && e.relations.length) md += `关联: ${e.relations.join(', ')}\n`;
                if(e.updatedAt) md += `更新: ${new Date(e.updatedAt).toLocaleString('zh-CN')}\n`;
                md += '\n';
            });
        }
        if(typeof ContextHelper !== 'undefined') ContextHelper.exportToLibrary('知识图谱_' + new Date().toLocaleTimeString(), md);
        UI.toast('已导出到阅读库');
    },

    // ═══ 向量数据库 ═══
    _refreshVectors: async () => {
        const vecs = await DB.getAll('vectors') || [];
        const el = document.getElementById('we-vec-list');
        const countEl = document.getElementById('we-vec-count');
        if(countEl) countEl.textContent = vecs.length;
        if(!el) return;
        el.innerHTML = vecs.length ? vecs.map(v => `
            <div class="grid grid-cols-12 gap-4 px-4 py-2 rounded hover:bg-white/5 items-center border-b border-white/3">
                <span class="col-span-2 text-[10px] text-amber-400 truncate">${v.id}</span>
                <span class="col-span-8 text-[10px] text-gray-400 truncate">${(v.content||'').slice(0,120)}</span>
                <span class="col-span-2 text-right text-[10px] text-dim">${v.vector ? v.vector.length : '?'}d</span>
            </div>
        `).join('') : '<div class="text-center text-dim text-[10px] p-4">向量库为空</div>';
    },
    _clearAllVectors: async () => {
        if(!confirm('确定清空全部向量数据？此操作不可恢复。')) return;
        const vecs = await DB.getAll('vectors') || [];
        for(const v of vecs) { try { await DB.del('vectors', v.id); } catch(e) {} }
        Modules.world_engine._refreshVectors();
        UI.toast('向量数据库已清空');
    },

    // ═══ 一键清空 — 修复: 彻底清空所有实体+世界观+向量 ═══
    _clearAllEntities: async () => {
        if(!confirm('确定清空全部实体和世界观数据？此操作不可恢复。')) return;
        const entities = await DB.getAll('entities') || [];
        // ★ 清空所有实体，包括世界观(world_开头的)
        for(const e of entities) {
            try { await DB.del('entities', e.id); } catch(err) {}
            try { await DB.del('vectors', e.id); } catch(err) {}
        }
        Modules.world_engine.cur = null;
        Modules.world_engine._cachedEntities = null;
        Modules.world_engine._cachedLayeredGraphs = null;
        try { await DB.put('settings', { id: 'world_layered_graphs', graphs: { volumes: [], cycles: [], updatedAt: Date.now() }, updatedAt: Date.now() }); } catch(e) {}
        const n = document.getElementById('we-ent-name'); if(n) n.value = '';
        const d = document.getElementById('we-ent-desc'); if(d) d.value = '';
        const r = document.getElementById('we-ent-relations'); if(r) r.value = '';
        const badge = document.getElementById('we-ent-source-badge'); if(badge) badge.innerHTML = '';
        Modules.world_engine._refreshEntities();
        // 如果在图谱页面，也刷新图谱
        if(Modules.world_engine.currentTab === 'graph') {
            setTimeout(() => Modules.world_engine._initGraph(), 100);
        }
        UI.toast('全部实体和世界观已清空');
    },

    _hasExportProjectScopedRows(...groups) {
        return groups.some(rows => (rows || []).some(row => row && row.projectId));
    },

    _scopeExportRows(rows, projectId = null, hasProjectScopedRows = null) {
        const list = rows || [];
        if (!projectId || !list.length) return list;
        const shouldUseProjectScope = hasProjectScopedRows === null
            ? list.some(row => row && row.projectId)
            : hasProjectScopedRows;
        if (!shouldUseProjectScope) return list;
        return list.filter(row => row && row.projectId === projectId);
    },

    async _getCurrentProjectExportScope() {
        const project = (typeof GenesisCore !== 'undefined' && GenesisCore.getActiveProject)
            ? await GenesisCore.getActiveProject()
            : null;
        const projectId = project?.id || null;
        const [volumesRaw, chaptersRaw, outlinesRaw, writingsRaw, cyclesRaw, entitiesRaw] = await Promise.all([
            DB.getAll('volumes').catch(() => []),
            DB.getAll('chapters').catch(() => []),
            DB.getAll('outlines').catch(() => []),
            DB.getAll('writings').catch(() => []),
            DB.getAll('cycles').catch(() => []),
            DB.getAll('entities').catch(() => [])
        ]);
        const hasProjectScopedRows = this._hasExportProjectScopedRows(
            volumesRaw, chaptersRaw, outlinesRaw, writingsRaw, cyclesRaw, entitiesRaw
        );
        const scopeRows = rows => this._scopeExportRows(rows, projectId, hasProjectScopedRows);
        const volumes = scopeRows(volumesRaw).slice().sort((a, b) =>
            (a.order || 0) - (b.order || 0) ||
            (a.createdAt || 0) - (b.createdAt || 0) ||
            String(a.id || '').localeCompare(String(b.id || ''))
        );
        const chapters = scopeRows(chaptersRaw).slice().sort((a, b) =>
            (a.order || a.number || 0) - (b.order || b.number || 0) ||
            (a.createdAt || 0) - (b.createdAt || 0) ||
            String(a.id || '').localeCompare(String(b.id || ''))
        );
        const outlines = scopeRows(outlinesRaw);
        const writings = scopeRows(writingsRaw);
        const cycles = scopeRows(cyclesRaw);
        const entities = scopeRows(entitiesRaw);
        return { project, projectId, volumes, chapters, outlines, writings, cycles, entities, hasProjectScopedRows };
    },

    _safeExportFilename(name) {
        return String(name || '未命名项目')
            .replace(/[\\/:*?"<>|]/g, '_')
            .replace(/\s+/g, ' ')
            .trim() || '未命名项目';
    },

    _buildNovelTxt(project, volumes, chapters) {
        const projectName = project?.name || '未命名项目';
        const chaptersWithText = (chapters || []).filter(ch => (ch.content || '').trim());
        const totalWords = chaptersWithText.reduce((sum, ch) => sum + (ch.content || '').length, 0);
        const volumeMap = new Map((volumes || []).map(v => [v.id, v]));
        const lines = [
            `《${projectName}》`,
            `导出时间：${new Date().toLocaleString('zh-CN')}`,
            `章节数：${chaptersWithText.length}`,
            `正文字数：${totalWords}`,
            '',
            '============================================================',
            ''
        ];
        let lastVolumeId = null;
        chaptersWithText.forEach((ch, index) => {
            const volumeId = ch.volumeId || '';
            if (volumeId && volumeId !== lastVolumeId) {
                const vol = volumeMap.get(volumeId);
                if (index > 0) lines.push('============================================================', '');
                lines.push(`第${vol?.order || '?'}卷 ${vol?.title || vol?.name || '未命名卷'}`, '');
                lastVolumeId = volumeId;
            } else if (!volumeId) {
                lastVolumeId = null;
            }
            lines.push(`第${ch.order || ch.number || '?'}章 ${ch.title || '未命名'}`, '');
            lines.push((ch.content || '').trim(), '');
        });
        return lines.join('\n').replace(/\n{4,}/g, '\n\n\n').trim() + '\n';
    },

    renderExportMenu(label = '导出工程', fullWidth = false, direction = 'up') {
        const widthClass = fullWidth ? 'w-full' : '';
        const positionClass = direction === 'down' ? 'top-full mt-1' : 'bottom-full mb-1';
        return `
        <div class="relative inline-block ${widthClass}" data-export-menu-root>
            <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 ${widthClass} font-bold" onclick="Modules.world_engine.toggleExportMenu(this)">
                <i class="fa-solid fa-download mr-1"></i>${label}<i class="fa-solid fa-chevron-down ml-1 text-[9px]"></i>
            </button>
            <div class="hidden absolute right-0 ${positionClass} min-w-[160px] rounded-lg border border-white/10 bg-[#111113] shadow-2xl z-[80] overflow-hidden" data-export-menu>
                <button class="w-full text-left px-3 py-2 text-[11px] text-white hover:bg-white/10" onclick="Modules.world_engine.closeExportMenus();Modules.world_engine.exportAll()">导出工程 Markdown</button>
                <button class="w-full text-left px-3 py-2 text-[11px] text-amber-300 hover:bg-white/10" onclick="Modules.world_engine.closeExportMenus();Modules.world_engine.exportNovelTxt()">导出整本正文 TXT</button>
            </div>
        </div>`;
    },

    toggleExportMenu(btn) {
        if (!this._exportMenuEventsBound && typeof document !== 'undefined') {
            this._exportMenuEventsBound = true;
            document.addEventListener('click', evt => {
                if (!evt.target?.closest?.('[data-export-menu-root]')) Modules.world_engine.closeExportMenus();
            });
            document.addEventListener('keydown', evt => {
                if (evt.key === 'Escape') Modules.world_engine.closeExportMenus();
            });
        }
        const root = btn?.closest?.('[data-export-menu-root]');
        const menu = root?.querySelector?.('[data-export-menu]');
        if (!menu) return;
        const willShow = menu.classList.contains('hidden');
        this.closeExportMenus();
        menu.classList.toggle('hidden', !willShow);
    },

    closeExportMenus() {
        if (typeof document === 'undefined') return;
        document.querySelectorAll('[data-export-menu]').forEach(el => el.classList.add('hidden'));
    },

    _getScopedFusionPipeline(projectId) {
        const FB = Modules.fusion_book;
        if (!FB || !projectId) return null;
        const saved = FB._savedPipelineState || {};
        const markers = [
            FB._pipelineProjectId,
            FB._plConfig?.projectId,
            saved.projectId,
            saved.config?.projectId
        ].filter(Boolean).map(String);
        if (!markers.length || !markers.includes(String(projectId))) return null;
        return {
            allPr: FB._allPipelineResults || saved.allPipelineResults || {},
            pr: FB._pipelineResults || saved.results || {}
        };
    },

    exportNovelTxt: async () => {
        const we = Modules.world_engine;
        const { project, volumes, chapters } = await we._getCurrentProjectExportScope();
        if (!project) return UI.toast('请先创建或选择一个项目', 'warning');
        if (!chapters.length) return UI.toast('当前项目暂无章节正文可导出', 'warning');
        if (!chapters.some(ch => (ch.content || '').trim())) return UI.toast('当前项目章节暂无正文内容', 'warning');
        const txt = we._buildNovelTxt(project, volumes, chapters);
        const filename = `${we._safeExportFilename(project.name)}_整本正文_${new Date().toISOString().slice(0, 10)}.txt`;
        if (Utils.download) Utils.download(filename, txt, 'text/plain;charset=utf-8');
        UI.toast('已导出整本正文 TXT');
    },

    // ═══ 一键导出完整工程：世界引擎 + 细纲 + 正文 ═══
    exportAll: async () => {
        const we = Modules.world_engine;
        const { project: activeProject, projectId, volumes, chapters, outlines, writings, cycles, entities: scopedEntities } = await we._getCurrentProjectExportScope();
        if (!activeProject) return UI.toast('请先创建或选择一个项目', 'warning');
        const exportEntities = (scopedEntities || [])
            .filter(e => e && e.id)
            .map(e => ({ ...e, type: we._normalizeEntityType ? we._normalizeEntityType(e.type) : (e.type || '其他') }));
        const entities = exportEntities.filter(e => !String(e.id || '').startsWith('world_'));
        const worlds = exportEntities.filter(e => String(e.id || '').startsWith('world_') && e.desc);
        const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
        const sortedChapters = (chapters || []).slice().sort((a,b) => (a.order || a.number || 0) - (b.order || b.number || 0));
        const sortedVolumes = (volumes || []).slice().sort((a,b) => (a.order || 0) - (b.order || 0));
        const totalWords = sortedChapters.reduce((sum, ch) => sum + ((ch.content || '').length), 0);
        let md = '# 创作工程一键导出\n\n';
        md += `导出时间: ${new Date().toLocaleString()}\n\n`;
        md += `范围: 世界引擎全部内容 + 执笔台细纲 + 执笔台正文\n\n`;
        if (activeProject) {
            md += '---\n## 当前项目\n\n';
            md += `- 项目名: ${activeProject.name || '未命名'}\n`;
            md += `- 路线: ${activeProject.mode || '未标记'}\n`;
            md += `- 状态: ${activeProject.status || '未标记'}\n`;
            md += `- 章节: ${activeProject.chapterCount || sortedChapters.length}\n`;
            md += `- 字数: ${activeProject.wordCount || totalWords}\n\n`;
        }
        md += '---\n## 工程统计\n\n';
        md += `- 世界观维度: ${worlds.length}\n`;
        md += `- 实体: ${entities.length}\n`;
        md += `- 卷: ${sortedVolumes.length}\n`;
        md += `- 章节: ${sortedChapters.length}\n`;
        md += `- 细纲库条目: ${(outlines || []).length}\n`;
        md += `- 正文库条目: ${(writings || []).length}\n`;
        md += `- 循环图谱: ${(cycles || []).length}\n`;
        md += `- 执笔台正文字数: ${totalWords}\n\n`;

        if(worlds.length) {
            md += '---\n## 世界观设定\n\n';
            worlds.forEach(w => {
                const cat = w.id.replace('world_', '');
                md += `### ${catLabels[cat] || cat}\n${w.desc}\n`;
                if(w.updatedAt) md += `> 更新: ${new Date(w.updatedAt).toLocaleString('zh-CN')}\n`;
                md += '\n';
            });
        }
        if(entities.length) {
            md += '---\n## 实体库\n\n';
            const grouped = {};
            entities.forEach(e => { const t = e.type || '其他'; if(!grouped[t]) grouped[t] = []; grouped[t].push(e); });
            for(const [type, items] of Object.entries(grouped)) {
                md += `### ${type} (${items.length})\n`;
                items.forEach(e => {
                    md += `#### ${e.name}\n${e.desc || '无描述'}\n`;
                    if(e.relations && e.relations.length) md += `> 关联: ${e.relations.join(', ')}\n`;
                    md += `> 来源: ${e.source || 'manual'}`;
                    if(e.updatedAt) md += ` | 更新: ${new Date(e.updatedAt).toLocaleString('zh-CN')}`;
                    md += '\n\n';
                });
            }
        }
        if(cycles && cycles.length) {
            md += '---\n## 分层图谱 / 循环\n\n';
            cycles.slice().sort((a,b) => (a.startChapter || 0) - (b.startChapter || 0)).forEach(c => {
                const cycleTitle = c.title || ('循环 ' + (c.startChapter || '?') + '-' + (c.endChapter || '?'));
                md += `### ${cycleTitle}\n`;
                md += `- 范围: 第${c.startChapter || '?'}-${c.endChapter || '?'}章\n`;
                if(c.entityNames && c.entityNames.length) md += `- 实体: ${c.entityNames.join('、')}\n`;
                if(c.fusionEssence) md += `\n#### 技法弹药\n${c.fusionEssence}\n`;
                if(c.nexusCHR && c.nexusCHR.length) md += `\n#### CHR\n${c.nexusCHR.map(x => `- ${x.name || ''}: ${x.status || x.from || ''} ${x.to ? '→ ' + x.to : ''} ${x.trigger || x.constraint || ''}`).join('\n')}\n`;
                if(c.nexusFOE && c.nexusFOE.length) md += `\n#### FOE\n${c.nexusFOE.map(x => `- ${x.desc || ''} ${x.status ? '[' + x.status + ']' : ''} ${x.planRecycle ? '回收:' + x.planRecycle : ''}`).join('\n')}\n`;
                if(c.nexusEMO && c.nexusEMO.length) md += `\n#### EMO\n${c.nexusEMO.map(x => `- 第${x.chapter || '?'}章 ${x.word || ''} ${x.score ? '(' + x.score + ')' : ''}`).join('\n')}\n`;
                md += '\n';
            });
        }

        if(sortedChapters.length) {
            md += '---\n## 执笔台细纲\n\n';
            sortedChapters.forEach(ch => {
                md += `### 第${ch.order || ch.number || '?'}章 ${ch.title || '未命名'}\n\n`;
                md += (ch.outline && ch.outline.trim()) ? ch.outline.trim() + '\n\n' : '（无细纲）\n\n';
            });

            md += '---\n## 执笔台正文\n\n';
            sortedChapters.forEach(ch => {
                md += `### 第${ch.order || ch.number || '?'}章 ${ch.title || '未命名'}\n\n`;
                md += (ch.content && ch.content.trim()) ? ch.content.trim() + '\n\n' : '（无正文）\n\n';
            });
        }

        if(outlines && outlines.length) {
            md += '---\n## 细纲库补充\n\n';
            outlines.slice().sort((a,b) => (a.createdAt || 0) - (b.createdAt || 0)).forEach(o => {
                md += `### ${o.title || o.id || '未命名细纲'}\n`;
                if(o.source) md += `> 来源: ${o.source}\n\n`;
                md += `${o.content || ''}\n\n`;
            });
        }

        if(writings && writings.length) {
            md += '---\n## 正文库补充\n\n';
            writings.slice().sort((a,b) => (a.createdAt || 0) - (b.createdAt || 0)).forEach(w => {
                md += `### ${w.title || w.id || '未命名正文'}\n`;
                if(w.source) md += `> 来源: ${w.source}\n\n`;
                md += `${w.content || ''}\n\n`;
            });
        }

        const scopedPipeline = we._getScopedFusionPipeline(projectId);
        if(scopedPipeline) {
            const allPr = scopedPipeline.allPr || {};
            const pr = scopedPipeline.pr || {};
            const labels = { left:'左书拆解弹药', right:'右书拆解弹药', compare:'技法对比', fusion:'融合弹药', world:'实体提取', outline:'拆书生成细纲', write:'拆书生成正文' };
            const keys = ['left','right','compare','fusion','world','outline','write'];
            const hasPipeline = keys.some(k => ((allPr[k] && allPr[k].trim()) || (pr[k] && pr[k].trim())));
            if(hasPipeline) {
                md += '---\n## 融合拆书弹药\n\n';
                keys.forEach(k => {
                    const content = (allPr[k] && allPr[k].trim()) ? allPr[k] : (pr[k] || '');
                    if(content && content.trim()) md += `### ${labels[k] || k}\n\n${content.trim()}\n\n`;
                });
            }
        } else if(Modules.fusion_book) {
            const allPr = Modules.fusion_book._allPipelineResults || {};
            const pr = Modules.fusion_book._pipelineResults || {};
            const keys = ['left','right','compare','fusion','world','outline','write'];
            const hasUnscopedPipeline = keys.some(k => ((allPr[k] && allPr[k].trim()) || (pr[k] && pr[k].trim())));
            if(hasUnscopedPipeline) {
                md += '---\n## 融合拆书弹药\n\n';
                md += '> 当前拆书运行缓存未绑定到当前项目，已跳过导出以避免跨项目混入。\n\n';
            }
        }

        const filename = `创作工程_世界引擎_细纲_正文_${new Date().toISOString().slice(0,10)}.md`;
        if(Utils.download) Utils.download(filename, md);
        if(typeof ContextHelper !== 'undefined') {
            await ContextHelper.exportToLibrary('创作工程完整导出_' + new Date().toLocaleTimeString('zh-CN'), md);
        }
        UI.toast('已导出：世界引擎 + 细纲 + 正文');
    },
});
