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
    _graphResetView() {
        if(this._graph3d) this._graph3d.cameraPosition({ x: 0, y: 0, z: 500 }, { x: 0, y: 0, z: 0 }, 1000);
    },
    _graphTogglePhysics() {
        this._graphPhysics = !this._graphPhysics;
        if(this._graph3d) {
            if(this._graphPhysics) {
                // 重新启用物理: 恢复力模型并重新加热
                this._graph3d.d3AlphaDecay(0.02);
                this._graph3d.d3VelocityDecay(0.3);
                this._graph3d.d3ReheatSimulation();
            } else {
                // 冻结物理: 将所有节点固定在当前位置
                const gd = this._graph3d.graphData();
                if(gd && gd.nodes) {
                    gd.nodes.forEach(n => { n.fx = n.x; n.fy = n.y; n.fz = n.z; });
                }
                // 停止模拟
                this._graph3d.d3AlphaDecay(1);
                this._graph3d.cooldownTicks(typeof MobileEngine !== 'undefined' && MobileEngine.isMobile() ? 10 : 0);
            }
        }
        const btn = document.getElementById('we-g-physics-btn');
        if(btn) btn.innerHTML = `<i class="fa-solid fa-atom mr-1"></i>物理模拟 (${this._graphPhysics ? '开启' : '关闭'})`;
    },
    _graphToggleLabels() {
        this._graphShowLabels = !this._graphShowLabels;
        const btn = document.getElementById('we-g-labels-btn');
        if(btn) btn.innerHTML = `<i class="fa-solid fa-tag mr-1"></i>${this._graphShowLabels ? '显示标签' : '隐藏标签'}`;
        
        if(!this._graph3d) return;
        
        if(this._graphShowLabels) {
            // 开启标签: 用 sprite 文字替代球体
            const T = window.THREE;
            const colorMap = {'人物':'#eab308','物品':'#3b82f6','地点':'#22c55e','情节':'#ef4444','伏笔':'#a855f7','势力':'#f43f5e','种族':'#f97316','魔法':'#6366f1','规则':'#0ea5e9','文化':'#ec4899','历史':'#f59e0b','技法':'#14b8a6'};
            if(T && T.CanvasTexture) {
                this._graph3d.nodeThreeObject(node => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const fontSize = Math.max(24, 18 + (node.degree || 0) * 4);
                    const text = node.name || '';
                    ctx.font = `${node.degree > 3 ? 'bold ' : ''}${fontSize}px sans-serif`;
                    const textWidth = ctx.measureText(text).width;
                    canvas.width = textWidth + 16;
                    canvas.height = fontSize + 12;
                    ctx.fillStyle = 'rgba(0,0,0,0.6)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.font = `${node.degree > 3 ? 'bold ' : ''}${fontSize}px sans-serif`;
                    ctx.fillStyle = node.color || colorMap[node.type] || '#fff';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
                    const texture = new T.CanvasTexture(canvas);
                    const spriteMat = new T.SpriteMaterial({ map: texture, depthWrite: false, transparent: true });
                    const sprite = new T.Sprite(spriteMat);
                    const scale = Math.max(8, 5 + (node.degree || 0) * 1.5);
                    sprite.scale.set(scale * (canvas.width / canvas.height), scale, 1);
                    return sprite;
                });
                this._graph3d.nodeThreeObjectExtend(false);
            } else {
                // THREE不可用时用tooltip
                this._graph3d.nodeThreeObject(null);
                this._graph3d.nodeLabel(n => `[${n.type}] ${n.name} (${n.degree}条连线)`);
            }
        } else {
            // 关闭标签: 恢复默认球体渲染
            this._graph3d.nodeThreeObject(null);
            this._graph3d.nodeThreeObjectExtend(false);
            this._graph3d.nodeLabel(n => `[${n.type}] ${n.name} (${n.degree}条连线): ${n.desc || ''}`);
        }
        // 触发重绘
        this._graph3d.refresh();
    },
    _graphToggleRotate() {
        this._graphAutoRotate = !this._graphAutoRotate;
        if(this._graph3d) {
            const controls = this._graph3d.controls();
            if(controls) {
                controls.autoRotate = this._graphAutoRotate;
                controls.autoRotateSpeed = 0.5;
            }
            // 如果controls不支持autoRotate，用手动旋转
            if(this._graphAutoRotate && (!controls || !controls.autoRotate)) {
                this._graphRotateTimer = setInterval(() => {
                    if(!this._graph3d || !this._graphAutoRotate) {
                        clearInterval(this._graphRotateTimer);
                        return;
                    }
                    const scene = this._graph3d.scene();
                    if(scene) scene.rotation.y += 0.003;
                }, 30);
            } else if(!this._graphAutoRotate && this._graphRotateTimer) {
                clearInterval(this._graphRotateTimer);
                this._graphRotateTimer = null;
            }
        }
        const btn = document.getElementById('we-g-rotate-btn');
        if(btn) btn.innerHTML = `<i class="fa-solid fa-rotate mr-1"></i>自动旋转${this._graphAutoRotate ? ' ●' : ''}`;
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

    // ═══ 导出全部设定 ═══
    exportAll: async () => {
        const we = Modules.world_engine;
        await we._ensureCache();
        const entities = (we._cachedEntities || []).filter(e => !e.id.startsWith('world_'));
        const worlds = (we._cachedEntities || []).filter(e => e.id.startsWith('world_') && e.desc);
        const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
        let md = '# 世界引擎 — 全部设定导出\n\n';
        md += `导出时间: ${new Date().toLocaleString()}\n\n`;
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
        const FB = Modules.fusion_book;
        if(FB) {
            const allPr = FB._allPipelineResults || {};
            const pr = FB._pipelineResults || {};
            const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
            if(fusion) md += '---\n## 融合技法精华\n\n' + fusion + '\n\n';
        }
        if(typeof ContextHelper !== 'undefined') ContextHelper.exportToLibrary('世界引擎全部设定_' + new Date().toLocaleTimeString(), md);
        UI.toast('全部设定已导出到阅读库');
    },
});
