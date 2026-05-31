// ═══════════════════════════════════════════════════════════════
// 世界引擎 (World Engine) — 核心中转站
// 修复: 一键清空彻底 / 提取后同步刷新图谱+世界观 / 3D网络(非孤立点)
//       暂停关闭不清零 / 时间戳标注 / IDB writings store
// ═══════════════════════════════════════════════════════════════
Modules.world_engine = {
    currentTab: 'dashboard',
    worldCat: 'history',
    cur: null,
    _entityFilter: 'all',
    _typeFilter: '',
    _chapters: [],
    _currentChapter: null,
    _chapterFilter: 'all',
    _cycleFilter: 'all',
    _cachedCycles: null,
    _graphCycleFilter: 'all',

    // ===== 构建结构化注入包 =====
    // ★ 新增 cycleId 路径：按循环粒度精准注入
    buildInjectPackage(opts = {}) {
        const { includeEntities=true, includeWorld=true, includeFusion=true, includePipeline=false, includeChapters=true, maxLen=6000, chapterId=null, cycleId=null } = opts;
        let pkg = '';

        // ★ 循环级注入（最高优先级）
        if(cycleId) {
            const cycle = (this._cachedCycles || []).find(c => c.id === cycleId);
            if(cycle) {
                pkg += `【循环级技法精华 | 第${cycle.startChapter}-${cycle.endChapter}章】\n`;
                if(cycle.fusionEssence) pkg += cycle.fusionEssence.slice(0, 2500) + '\n\n';
                if(cycle.compareResult) pkg += '【循环对比结论】\n' + cycle.compareResult.slice(0, 1200) + '\n\n';
                if(cycle.rhythmFormula) pkg += '【循环节奏公式】\n' + cycle.rhythmFormula.slice(0, 800) + '\n\n';
                if(cycle.emotionCurve) pkg += '【循环情绪曲线】\n' + cycle.emotionCurve.slice(0, 800) + '\n\n';
                if(cycle.patterns && cycle.patterns.length) {
                    pkg += '【可复用套路清单】\n';
                    cycle.patterns.forEach((p, i) => { pkg += `${i+1}. ${p.name}: ${p.desc.slice(0,120)}\n`; });
                    pkg += '\n';
                }
                // NEXUS 四状态机
                if(cycle.nexusCHR && cycle.nexusCHR.length) {
                    pkg += '【CHR角色状态】\n';
                    cycle.nexusCHR.forEach(c => { pkg += `• ${c.name}: ${c.from}→${c.to} | ${c.trigger}\n`; });
                    pkg += '\n';
                }
                if(cycle.nexusFOE && cycle.nexusFOE.length) {
                    pkg += '【FOE伏笔网络】\n';
                    cycle.nexusFOE.forEach(f => { pkg += `• ${f.desc.slice(0,80)} [${f.status}] 计划回收:${f.planRecycle||'?'}\n`; });
                    pkg += '\n';
                }
                if(cycle.nexusEMO && cycle.nexusEMO.length) {
                    pkg += '【EMO情绪锚点】\n';
                    cycle.nexusEMO.forEach(e => { pkg += `• 第${e.chapter}章 ${e.word} [${e.type}] 分值:${e.score}\n`; });
                    pkg += '\n';
                }
            }
            // 循环实体
            if(includeEntities && this._cachedEntities) {
                const cycleEntities = this._cachedEntities.filter(e => !e.id.startsWith('world_') && e.cycles && e.cycles.includes(cycleId));
                if(cycleEntities.length) {
                    pkg += `【循环实体 (${cycleEntities.length})】\n`;
                    const grouped = {};
                    cycleEntities.forEach(e => {
                        const t = e.type || '其他';
                        if(!grouped[t]) grouped[t] = [];
                        grouped[t].push(e);
                    });
                    for(const [type, items] of Object.entries(grouped)) {
                        pkg += `── ${type} (${items.length}) ──\n`;
                        items.forEach(e => {
                            let line = `• ${e.name}: ${(e.desc||'').slice(0,100)}`;
                            if(e.relations && e.relations.length) line += ` | 关联: ${e.relations.slice(0,3).join(', ')}`;
                            if(e.nexusState && e.nexusState.chrStatus) line += ` [${e.nexusState.chrStatus}]`;
                            pkg += line + '\n';
                        });
                    }
                    pkg += '\n';
                }
            }
            if(includeWorld && this._cachedEntities) {
                const worldItems = this._cachedEntities.filter(e => e.id.startsWith('world_') && e.desc);
                if(worldItems.length) {
                    pkg += '【世界观设定】\n';
                    const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
                    worldItems.forEach(w => {
                        const cat = w.id.replace('world_', '');
                        pkg += `── ${catLabels[cat] || cat} ──\n${(w.desc||'').slice(0,400)}\n\n`;
                    });
                }
            }
            return pkg.slice(0, maxLen);
        }

        // 如果指定了章节，只返回该章节的实体
        if(chapterId && includeEntities && this._cachedEntities) {
            const chapterEntities = this._cachedEntities.filter(e => !e.id.startsWith('world_') && e.chapters && e.chapters.includes(chapterId));
            const chapter = (this._chapters || []).find(c => c.id === chapterId);
            if(chapter) {
                pkg += `【第${chapter.number||'?'}章: ${chapter.title||'未命名'}】\n`;
                if(chapter.outline) pkg += `细纲: ${chapter.outline.slice(0, 500)}\n\n`;
            }
            if(chapterEntities.length) {
                pkg += '【本章实体】\n';
                const grouped = {};
                chapterEntities.forEach(e => {
                    const t = e.type || '其他';
                    if(!grouped[t]) grouped[t] = [];
                    grouped[t].push(e);
                });
                for(const [type, items] of Object.entries(grouped)) {
                    pkg += `── ${type} (${items.length}) ──\n`;
                    items.forEach(e => {
                        let line = `• ${e.name}: ${(e.desc||'').slice(0,100)}`;
                        if(e.relations && e.relations.length) line += ` | 关联: ${e.relations.slice(0,3).join(', ')}`;
                        if(e.nexusState && e.nexusState.chrStatus) line += ` [${e.nexusState.chrStatus}]`;
                        pkg += line + '\n';
                    });
                }
            }
            return pkg.slice(0, maxLen);
        }

        // 按章节组织实体
        if(includeChapters && this._chapters && this._chapters.length && includeEntities && this._cachedEntities) {
            pkg += '【章节实体分布】\n';
            const sortedChapters = [...this._chapters].sort((a,b) => (a.number||0) - (b.number||0));
            sortedChapters.forEach(ch => {
                const chEntities = this._cachedEntities.filter(e => !e.id.startsWith('world_') && e.chapters && e.chapters.includes(ch.id));
                if(chEntities.length) {
                    pkg += `第${ch.number||'?'}章 ${ch.title||'未命名'}: ${chEntities.map(e => e.name).join('、')}\n`;
                }
            });
            pkg += '\n';
        }

        if(includeEntities && this._cachedEntities) {
            const grouped = {};
            this._cachedEntities.filter(e => !e.id.startsWith('world_')).forEach(e => {
                const t = e.type || '其他';
                if(!grouped[t]) grouped[t] = [];
                grouped[t].push(e);
            });
            if(Object.keys(grouped).length) {
                pkg += '【实体库】\n';
                for(const [type, items] of Object.entries(grouped)) {
                    pkg += `── ${type} (${items.length}) ──\n`;
                    items.slice(0, 20).forEach(e => {
                        let line = `• ${e.name}`;
                        if(e.source === 'pipeline') line += ' [流水线]';
                        const chCount = (e.chapters || []).length;
                        if(chCount > 0) line += ` [${chCount}章]`;
                        const cyCount = (e.cycles || []).length;
                        if(cyCount > 0) line += ` [${cyCount}循环]`;
                        if(e.updatedAt) line += ` [${new Date(e.updatedAt).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}]`;
                        line += `: ${(e.desc||'').slice(0,120)}`;
                        if(e.relations && e.relations.length) line += ` | 关联: ${e.relations.slice(0,5).join(', ')}`;
                        pkg += line + '\n';
                    });
                    pkg += '\n';
                }
            }
        }
        if(includeWorld && this._cachedEntities) {
            const worldItems = this._cachedEntities.filter(e => e.id.startsWith('world_') && e.desc);
            if(worldItems.length) {
                pkg += '【世界观设定】\n';
                const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
                worldItems.forEach(w => {
                    const cat = w.id.replace('world_', '');
                    pkg += `── ${catLabels[cat] || cat} ──\n${(w.desc||'').slice(0,500)}\n\n`;
                });
            }
        }
        if(includeFusion) {
            const FB = Modules.fusion_book;
            if(FB) {
                const allPr = FB._allPipelineResults || {};
                const pr = FB._pipelineResults || {};
                const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
                const compare = (allPr.compare && allPr.compare.trim()) ? allPr.compare : (pr.compare || '');
                if(fusion) pkg += '【融合技法精华】\n' + fusion.slice(0, 2000) + '\n\n';
                if(compare) pkg += '【对比结论】\n' + compare.slice(0, 1000) + '\n\n';
            }
        }
        if(includePipeline) {
            const FB = Modules.fusion_book;
            if(FB) {
                const allPr = FB._allPipelineResults || {};
                const pr = FB._pipelineResults || {};
                ['left','right'].forEach(k => {
                    const v = (allPr[k] && allPr[k].trim()) ? allPr[k] : (pr[k] || '');
                    if(v) pkg += `【${k==='left'?'左书拆解':'右书拆解'}】\n` + v.slice(0, 1000) + '\n\n';
                });
            }
        }
        return pkg.slice(0, maxLen);
    },

    _cachedEntities: null,
    async _ensureCache() {
        let allEntities = await DB.getAll('entities') || [];
        const nameMap = new Map();
        const duplicates = [];
        allEntities.forEach(e => {
            if (!e.name) return;
            const normalizedName = e.name.toLowerCase().trim();
            if (nameMap.has(normalizedName)) {
                duplicates.push({ keep: nameMap.get(normalizedName), remove: e });
            } else {
                nameMap.set(normalizedName, e);
            }
        });
        if (duplicates.length > 0) {
            for (const dup of duplicates) {
                try {
                    await DB.del('entities', dup.remove.id);
                    try { await DB.del('vectors', dup.remove.id); } catch(e) {}
                } catch(e) {}
            }
            allEntities = Array.from(nameMap.values());
        }
        this._cachedEntities = allEntities;
    },

    // ═══════════════════════════════════════════════════════════════
    // ★ 循环层级核心 (Cycle Layer Core) — NEXUS OS v2.0
    // ═══════════════════════════════════════════════════════════════
    async _ensureCycleCache() {
        if(this._cachedCycles) return;
        this._cachedCycles = await DB.getAll('cycles') || [];
    },

    // 根据章节号计算循环ID
    getCycleIdForChapter(chapterNum, cycleSize = 5) {
        if(!chapterNum || chapterNum < 1) return null;
        const cycleNum = Math.ceil(chapterNum / cycleSize);
        const start = (cycleNum - 1) * cycleSize + 1;
        const end = cycleNum * cycleSize;
        return { cycleId: `cycle_${start}_${end}`, cycleNum, start, end };
    },

    // 查询章节所属循环对象
    async getCycleForChapter(chapterNum) {
        await this._ensureCycleCache();
        if(!this._cachedCycles || !this._cachedCycles.length) return null;
        // 先精确匹配
        const exact = this._cachedCycles.find(c => chapterNum >= c.startChapter && chapterNum <= c.endChapter);
        if(exact) return exact;
        // 模糊匹配：找包含该章号的
        return this._cachedCycles.find(c => c.chapterIds && c.chapterIds.includes('ch_' + chapterNum)) || null;
    },

    // ★ 核心同步接口：融合拆书调用此接口写入循环数据
    async syncCycle(cycleData) {
        if(!cycleData || !cycleData.id) { console.warn('[WorldEngine] syncCycle: invalid data'); return; }
        await this._ensureCycleCache();
        // 去重：先删除同ID旧数据
        try { await DB.del('cycles', cycleData.id); } catch(e) {}
        const payload = {
            ...cycleData,
            updatedAt: Date.now(),
            entityNames: cycleData.entityNames || [],
            chapterIds: cycleData.chapterIds || [],
            nexusCHR: cycleData.nexusCHR || [],
            nexusWLD: cycleData.nexusWLD || [],
            nexusFOE: cycleData.nexusFOE || [],
            nexusEMO: cycleData.nexusEMO || [],
            patterns: cycleData.patterns || []
        };
        await DB.put('cycles', payload);
        // 刷新缓存
        this._cachedCycles = null;
        await this._ensureCycleCache();
        // 同步更新实体 cycles 字段
        if(cycleData.entityNames && cycleData.entityNames.length) {
            await this._ensureCache();
            for(const entName of cycleData.entityNames) {
                const ent = (this._cachedEntities || []).find(e => e.name === entName);
                if(ent) {
                    if(!ent.cycles) ent.cycles = [];
                    if(!ent.cycles.includes(cycleData.id)) {
                        ent.cycles.push(cycleData.id);
                        ent.updatedAt = Date.now();
                        await DB.put('entities', ent);
                    }
                }
            }
            this._cachedEntities = null;
        }
        UI.toast(`[世界引擎] 循环 ${cycleData.startChapter}-${cycleData.endChapter} 已同步 (${cycleData.entityNames?.length||0}实体)`);
    },

    // 获取循环纯文本上下文（供writer.js使用）
    async getCycleContext(chapterNum, opts = {}) {
        const { maxLen = 4000 } = opts;
        const cycle = await this.getCycleForChapter(chapterNum);
        if(!cycle) return '';
        let ctx = `[NEXUS循环上下文 | 第${cycle.startChapter}-${cycle.endChapter}章]\n`;
        if(cycle.fusionEssence) ctx += `【技法精华】\n${cycle.fusionEssence.slice(0, 1200)}\n\n`;
        if(cycle.rhythmFormula) ctx += `【节奏公式】${cycle.rhythmFormula.slice(0, 400)}\n\n`;
        if(cycle.emotionCurve) ctx += `【情绪曲线】${cycle.emotionCurve.slice(0, 400)}\n\n`;
        if(cycle.patterns && cycle.patterns.length) {
            ctx += `【零件库】\n`;
            cycle.patterns.slice(0, 5).forEach((p, i) => { ctx += `${i+1}. ${p.name}: ${(p.desc||'').slice(0,80)}\n`; });
            ctx += '\n';
        }
        // 四状态机
        if(cycle.nexusCHR && cycle.nexusCHR.length) {
            ctx += `【角色约束】\n`;
            cycle.nexusCHR.forEach(c => { ctx += `• ${c.name}: ${c.status||c.to} ${c.constraint||''}\n`; });
        }
        if(cycle.nexusFOE && cycle.nexusFOE.length) {
            ctx += `【伏笔预警】\n`;
            cycle.nexusFOE.filter(f => f.status !== 'S3废弃').forEach(f => {
                ctx += `• ${f.desc.slice(0,60)} [${f.status}]${f.planRecycle ? ' 回收点:'+f.planRecycle : ''}\n`;
            });
        }
        return ctx.slice(0, maxLen);
    },

    // 构建NEXUS四状态机快照（供writer.js注入）
    async buildNexusSnapshot(chapterNum) {
        const cycle = await this.getCycleForChapter(chapterNum);
        const snapshot = { chr:'', wld:'', foe:'', emo:'' };
        if(!cycle) return snapshot;
        // CHR
        if(cycle.nexusCHR && cycle.nexusCHR.length) {
            snapshot.chr = cycle.nexusCHR.map(c => `${c.name}=${c.status||c.to}`).join('; ');
        }
        // WLD
        if(cycle.nexusWLD && cycle.nexusWLD.length) {
            snapshot.wld = cycle.nexusWLD.map(w => `${w.desc||w.ruleId}=${w.to}`).join('; ');
        }
        // FOE
        if(cycle.nexusFOE && cycle.nexusFOE.length) {
            const active = cycle.nexusFOE.filter(f => f.status !== 'S3废弃');
            snapshot.foe = active.map(f => `${f.desc.slice(0,30)}[${f.status}]`).join('; ');
        }
        // EMO
        if(cycle.nexusEMO && cycle.nexusEMO.length) {
            const current = cycle.nexusEMO.find(e => e.chapter == chapterNum);
            snapshot.emo = current ? `${current.word}(${current.score})` : `avg:${Math.round(cycle.nexusEMO.reduce((a,b)=>a+(b.score||0),0)/cycle.nexusEMO.length)}`;
        }
        return snapshot;
    },

    render: () => {
        const we = Modules.world_engine;
        const t = we.currentTab;
        const tabs = [
            {id:'entities', icon:'fa-boxes-stacked', text:'实体管理', color:'text-amber-400'},
            {id:'inject', icon:'fa-syringe', text:'注入中心', color:'text-green-400'},
            {id:'pipeline_overview', icon:'fa-rocket', text:'流水线概览', color:'text-red-400'},
            {id:'world', icon:'fa-earth-americas', text:'世界观构建', color:'text-blue-400'},
            {id:'graph', icon:'fa-circle-nodes', text:'知识图谱', color:'text-purple-400'},
            {id:'vectors', icon:'fa-database', text:'向量数据库', color:'text-cyan-400'}
        ];
        const FB = Modules.fusion_book;
        const hasPipeline = FB && FB._pipelineResults && Object.keys(FB._pipelineResults).length > 0;
        return `
        <div class="flex h-full bg-[#08080a] overflow-hidden">
            <div class="w-64 shrink-0 flex flex-col bg-[#0e0e10] border-r border-white/5">
                <div class="p-4 border-b border-white/5 bg-gradient-to-r from-amber-900/20 to-transparent">
                    <div class="flex items-center gap-2">
                        <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex center text-white text-sm shadow-lg shadow-amber-500/20"><i class="fa-solid fa-atom"></i></div>
                        <div>
                            <div class="font-bold text-white text-sm">世界引擎</div>
                            <div class="text-[10px] text-dim">NEXUS 世界观中枢</div>
                        </div>
                    </div>
                </div>
                <!-- 四大板块导航 -->
                <div class="p-2 space-y-1 border-b border-white/5">
                    <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all ${t==='dashboard' ? 'bg-white/10 text-white border border-white/10' : 'text-dim hover:bg-white/5 border border-transparent'}" onclick="Modules.world_engine.switchTab('dashboard')">
                        <i class="fa-solid fa-gauge-high text-cyan-400 w-5 text-center"></i>
                        <span>总览仪表盘</span>
                    </button>
                    <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all ${t==='world' ? 'bg-white/10 text-white border border-white/10' : 'text-dim hover:bg-white/5 border border-transparent'}" onclick="Modules.world_engine.switchTab('world')">
                        <i class="fa-solid fa-earth-americas text-blue-400 w-5 text-center"></i>
                        <span>世界观</span>
                        <span class="ml-auto text-[8px] text-dim" id="we-nav-world-progress">0/7</span>
                    </button>
                    <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all ${t==='entities' ? 'bg-white/10 text-white border border-white/10' : 'text-dim hover:bg-white/5 border border-transparent'}" onclick="Modules.world_engine.switchTab('entities')">
                        <i class="fa-solid fa-users text-amber-400 w-5 text-center"></i>
                        <span>角色与实体</span>
                        <span class="ml-auto text-[8px] text-dim" id="we-nav-ent-count">0</span>
                    </button>
                    <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all ${t==='graph' ? 'bg-white/10 text-white border border-white/10' : 'text-dim hover:bg-white/5 border border-transparent'}" onclick="Modules.world_engine.switchTab('graph')">
                        <i class="fa-solid fa-circle-nodes text-purple-400 w-5 text-center"></i>
                        <span>关系与图谱</span>
                    </button>
                    <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all ${t==='pipeline_overview' ? 'bg-white/10 text-white border border-white/10' : 'text-dim hover:bg-white/5 border border-transparent'}" onclick="Modules.world_engine.switchTab('pipeline_overview')">
                        <i class="fa-solid fa-rocket text-red-400 w-5 text-center"></i>
                        <span>融合数据</span>
                        ${hasPipeline ? '<span class="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>' : ''}
                    </button>
                    <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all ${t==='narrative_consistency' ? 'bg-white/10 text-white border border-white/10' : 'text-dim hover:bg-white/5 border border-transparent'}" onclick="Modules.world_engine.switchTab('narrative_consistency')">
                        <i class="fa-solid fa-shield-halved text-emerald-400 w-5 text-center"></i>
                        <span>叙事一致性</span>
                        <span class="ml-auto text-[8px] text-dim" id="we-nav-consistency-badge">监控中</span>
                    </button>
                </div>
                <div class="flex-1 overflow-y-auto" id="we-sub-panel">
                    ${we._renderSubPanel()}
                </div>
                <div class="p-3 border-t border-white/5 bg-[#0a0a0c] space-y-2">
                    <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full" onclick="Modules.world_engine.exportAll()"><i class="fa-solid fa-download mr-1"></i>导出全部设定</button>
                    <div class="flex gap-1">
                        <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 flex-1" onclick="Modules.world_engine.injectToWriter()"><i class="fa-solid fa-feather-pointed mr-1"></i>→执笔台</button>
                        <button class="btn btn-xs bg-orange-600/20 text-orange-400 border-orange-600/30 flex-1" onclick="Modules.world_engine.injectToPhoenix()"><i class="fa-solid fa-fire mr-1"></i>→凤凰流</button>
                    </div>
                </div>
            </div>
            <div class="flex-1 flex flex-col min-w-0" id="we-workspace">
                ${we._renderWorkspace()}
            </div>
        </div>`;
    },

    switchTab: (tab) => {
        Modules.world_engine.currentTab = tab;
        const view = document.getElementById('module-view-world_engine');
        if(view) view.innerHTML = Modules.world_engine.render();
        if(tab === 'dashboard') Modules.world_engine._refreshDashboard();
        if(tab === 'graph') setTimeout(() => Modules.world_engine._initGraph(), 100);
        if(tab === 'entities') Modules.world_engine._refreshEntities();
        if(tab === 'vectors') Modules.world_engine._refreshVectors();
        if(tab === 'world') Modules.world_engine._loadWorldCat();
        if(tab === 'inject') Modules.world_engine._refreshInjectPreview();
        if(tab === 'narrative_consistency') Modules.world_engine._refreshNarrativeConsistency();
    },

    init: async () => {
        await Modules.world_engine._ensureCache();
        const t = Modules.world_engine.currentTab;
        if(!t || t === 'dashboard') Modules.world_engine._refreshDashboard();
        if(t === 'graph') setTimeout(() => Modules.world_engine._initGraph(), 100);
        if(t === 'entities') Modules.world_engine._refreshEntities();
        if(t === 'vectors') Modules.world_engine._refreshVectors();
    },

    _renderSubPanel: () => {
        const we = Modules.world_engine;
        const t = we.currentTab;

        // === 仪表盘：快速入口 ===
        if(t === 'dashboard') {
            return `<div class="p-2 space-y-2">
                <div class="text-[9px] text-dim font-bold uppercase tracking-wider mb-1">快速操作</div>
                <button class="btn btn-xs bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-cyan-400 border border-cyan-500/30 w-full font-bold" onclick="Modules.world_engine._openImportModal()"><i class="fa-solid fa-file-import mr-1"></i>导入世界观</button>
                <button class="btn btn-xs bg-gradient-to-r from-amber-600/20 to-orange-600/20 text-amber-400 border border-amber-500/30 w-full font-bold" onclick="Modules.world_engine._openNovelImportModal()"><i class="fa-solid fa-book mr-1"></i>导入已有作品</button>
                <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 w-full" onclick="Modules.world_engine.injectToWriter()"><i class="fa-solid fa-feather-pointed mr-1"></i>注入执笔台</button>
                <button class="btn btn-xs bg-orange-600/20 text-orange-400 border-orange-600/30 w-full" onclick="Modules.world_engine.injectToPhoenix()"><i class="fa-solid fa-fire mr-1"></i>注入凤凰流</button>
                <div class="border-t border-white/5 pt-2 mt-1">
                    <div class="text-[9px] text-dim font-bold uppercase tracking-wider mb-1">数据流转</div>
                    <div class="text-[9px] text-gray-500 space-y-1">
                        <div class="flex items-center gap-1"><i class="fa-solid fa-arrow-right text-[8px] text-cyan-400"></i> 拆书 → 提取技法</div>
                        <div class="flex items-center gap-1"><i class="fa-solid fa-arrow-right text-[8px] text-amber-400"></i> 导入 → 解析实体</div>
                        <div class="flex items-center gap-1"><i class="fa-solid fa-arrow-right text-[8px] text-green-400"></i> 世界引擎 → 执笔台</div>
                        <div class="flex items-center gap-1"><i class="fa-solid fa-arrow-right text-[8px] text-purple-400"></i> 实体 → 知识图谱</div>
                    </div>
                </div>
            </div>`;
        }

        // === 世界观板块 ===
        if(t === 'world') {
            const cats = [
                {id:'history', icon:'fa-scroll', label:'历史与传说', color:'text-yellow-500'},
                {id:'geography', icon:'fa-map', label:'地理与地貌', color:'text-green-500'},
                {id:'magic', icon:'fa-wand-sparkles', label:'魔法/科技体系', color:'text-purple-500'},
                {id:'factions', icon:'fa-flag', label:'势力与组织', color:'text-red-500'},
                {id:'species', icon:'fa-dragon', label:'种族与生物', color:'text-orange-500'},
                {id:'rules', icon:'fa-gavel', label:'世界规则', color:'text-blue-500'},
                {id:'culture', icon:'fa-masks-theater', label:'文化与习俗', color:'text-pink-500'}
            ];
            return `<div class="p-2 space-y-2">
                <button class="btn btn-xs bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-cyan-400 border border-cyan-500/30 w-full font-bold" onclick="Modules.world_engine._openImportModal()"><i class="fa-solid fa-file-import mr-1"></i>导入世界观设定</button>
                <button class="btn btn-xs bg-gradient-to-r from-amber-600/20 to-orange-600/20 text-amber-400 border border-amber-500/30 w-full font-bold" onclick="Modules.world_engine._openNovelImportModal()"><i class="fa-solid fa-book mr-1"></i>导入已有作品</button>
                <div class="border-t border-white/5 pt-2 mt-1">
                    <div class="text-[9px] text-dim font-bold uppercase tracking-wider mb-1.5">七大维度</div>
                </div>
                <div class="space-y-1">${cats.map(c => `
                    <button class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[11px] font-bold transition-all ${we.worldCat===c.id ? 'bg-blue-500/10 text-white border border-blue-500/20' : 'text-dim hover:bg-white/5 border border-transparent'}" onclick="Modules.world_engine.worldCat='${c.id}';Modules.world_engine.switchTab('world')">
                        <i class="fa-solid ${c.icon} ${c.color} w-4 text-center text-[10px]"></i>
                        <span>${c.label}</span>
                    </button>
                `).join('')}</div>
            </div>`;
        }

        // === 角色实体板块 ===
        if(t === 'entities') {
            return `
                <div class="p-2 space-y-2">
                    <div class="flex gap-1">
                        ${['all','pipeline','manual'].map(f => {
                            const labels = {all:'全部', pipeline:'流水线', manual:'手动'};
                            const active = we._entityFilter === f;
                            return `<button class="flex-1 text-[9px] py-1 rounded font-bold transition-all ${active ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-dim border border-transparent hover:bg-white/10'}" onclick="Modules.world_engine._entityFilter='${f}';Modules.world_engine._typeFilter='';Modules.world_engine._refreshEntities()">${labels[f]}</button>`;
                        }).join('')}
                    </div>
                    <div class="flex flex-wrap gap-1">
                        ${['人物','物品','地点','势力','魔法','情节'].map(tp => {
                            const active = we._typeFilter === tp;
                            return `<button class="text-[8px] px-1.5 py-0.5 rounded font-bold transition-all ${active ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/3 text-dim border border-transparent hover:bg-white/5'}" onclick="Modules.world_engine._typeFilter='${active ? '' : tp}';Modules.world_engine._entityFilter='all';Modules.world_engine._refreshEntities()">${tp}</button>`;
                        }).join('')}
                    </div>
                    <div id="we-entity-list" class="space-y-1 max-h-[300px] overflow-y-auto"><div class="text-[10px] text-dim p-2">加载中...</div></div>
                    <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full" onclick="Modules.world_engine._addEntity()"><i class="fa-solid fa-plus mr-1"></i>新建实体</button>
                </div>`;
        }

        // === 关系图谱板块 ===
        if(t === 'graph') {
            return `<div class="p-2 space-y-2">
                <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30 w-full" onclick="Modules.world_engine._initGraph()"><i class="fa-solid fa-rotate mr-1"></i>刷新3D图谱</button>
                <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30 w-full" onclick="Modules.world_engine._refreshRAGContext()"><i class="fa-solid fa-database mr-1"></i>刷新RAG上下文</button>
                <div class="border-t border-white/5 pt-2">
                    <div class="text-[9px] text-dim font-bold uppercase tracking-wider mb-1">筛选</div>
                    <select id="we-graph-chapter-filter" class="w-full text-[9px] bg-white/5 border border-white/10 rounded px-2 py-1 text-dim mb-1" onchange="Modules.world_engine._graphChapterFilter=this.value;Modules.world_engine._initGraph()">
                        <option value="all">全部章节</option>
                        ${(we._chapters||[]).sort((a,b)=>(a.number||0)-(b.number||0)).map(c => `<option value="${c.id}">第${c.number||'?'}章</option>`).join('')}
                    </select>
                    <select id="we-graph-cycle-filter" class="w-full text-[9px] bg-white/5 border border-white/10 rounded px-2 py-1 text-dim" onchange="Modules.world_engine._graphCycleFilter=this.value;Modules.world_engine._initGraph()">
                        <option value="all">全部循环</option>
                        ${(we._cachedCycles||[]).sort((a,b)=>(a.startChapter||0)-(b.startChapter||0)).map(c => `<option value="${c.id}">循环${c.cycleNum||'?'}</option>`).join('')}
                    </select>
                </div>
                <div class="border-t border-white/5 pt-2">
                    <div class="text-[9px] text-dim font-bold uppercase tracking-wider mb-1">图例</div>
                    <div class="grid grid-cols-2 gap-1 text-[9px] text-gray-400">
                        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-yellow-500"></span>人物</div>
                        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-500"></span>物品</div>
                        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-green-500"></span>地点</div>
                        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-red-500"></span>情节</div>
                        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-purple-500"></span>伏笔</div>
                        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-rose-500"></span>势力</div>
                    </div>
                </div>
            </div>`;
        }

        // === 融合数据板块 ===
        if(t === 'pipeline_overview') {
            return `<div class="p-2 space-y-2">
                <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30 w-full" onclick="App.nav('fusion_book')"><i class="fa-solid fa-book-open-reader mr-1"></i>前往融合拆书</button>
                <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full" onclick="Modules.world_engine.extractFromFusion()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>深度提取实体</button>
                <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30 w-full" onclick="Modules.world_engine.extractWorldView()"><i class="fa-solid fa-earth-americas mr-1"></i>提取世界观</button>
                <div class="border-t border-white/5 pt-2 space-y-1">
                    <div class="text-[9px] text-dim font-bold uppercase tracking-wider mb-1">注入中心</div>
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 w-full" onclick="Modules.world_engine.injectToWriter()"><i class="fa-solid fa-feather-pointed mr-1"></i>注入执笔台</button>
                    <button class="btn btn-xs bg-orange-600/20 text-orange-400 border-orange-600/30 w-full" onclick="Modules.world_engine.injectToPhoenix()"><i class="fa-solid fa-fire mr-1"></i>注入凤凰流</button>
                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30 w-full" onclick="Modules.world_engine.injectToRAG()"><i class="fa-solid fa-database mr-1"></i>注入RAG</button>
                </div>
            </div>`;
        }

        return '';
    },

    _renderWorkspace: () => {
        const we = Modules.world_engine;
        const t = we.currentTab;

        // === 仪表盘 ===
        if(t === 'dashboard' || !t) return we._renderDashboard();

        if(t === 'entities') return `
            <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                <span class="text-xs font-bold text-amber-400"><i class="fa-solid fa-boxes-stacked mr-1"></i>实体详情编辑器</span>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600 hover:text-white" onclick="Modules.world_engine._clearAllEntities()"><i class="fa-solid fa-trash-can mr-1"></i>一键清空</button>
                    <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.world_engine._saveEntity()"><i class="fa-solid fa-cloud-arrow-up mr-1"></i>保存并同步向量库</button>
                </div>
            </div>
            <div class="flex-1 p-6 overflow-y-auto space-y-4">
                <div class="grid grid-cols-3 gap-4">
                    <div class="col-span-2 flex flex-col gap-1">
                        <span class="text-[10px] text-dim font-bold uppercase">实体名称</span>
                        <input id="we-ent-name" class="input bg-black/30 border-white/10 focus:border-amber-500 font-bold text-lg text-white" placeholder="角色/物品/地点名称">
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-[10px] text-dim font-bold uppercase">类型</span>
                        <select id="we-ent-type" class="input bg-black/30 border-white/10 text-white"><option>人物</option><option>物品</option><option>地点</option><option>情节</option><option>伏笔</option><option>势力</option><option>种族</option><option>魔法</option><option>规则</option><option>文化</option><option>历史</option><option>技法</option></select>
                    </div>
                </div>
                <div id="we-ent-source-badge"></div>
                <div class="flex flex-col gap-1">
                    <span class="text-[10px] text-dim font-bold uppercase">分配章节</span>
                    <div class="flex flex-wrap gap-2 p-2 bg-black/20 rounded-lg border border-white/5" id="we-ent-chapters">
                        ${(we._chapters||[]).sort((a,b)=>(a.number||0)-(b.number||0)).map(c => {
                            return `<label class="flex items-center gap-1 text-[9px] text-dim cursor-pointer hover:text-white"><input type="checkbox" class="accent-cyan-500 we-ent-chapter-check" data-chapter-id="${c.id}">第${c.number||'?'}章: ${c.title||'未命名'}</label>`;
                        }).join('')}
                    </div>
                </div>
                <div class="flex flex-col gap-1 flex-1">
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] text-dim font-bold uppercase">详细描述 (自动嵌入向量库)</span>
                        <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.world_engine._aiExpandEntity()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>AI 扩写</button>
                    </div>
                    <textarea id="we-ent-desc" class="textarea flex-1 bg-black/30 border-white/10 focus:border-amber-500 resize-none text-gray-300 leading-relaxed min-h-[300px]" placeholder="在此输入详细描述。保存后将自动同步到向量数据库用于 RAG 检索..."></textarea>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-[10px] text-dim font-bold uppercase">关联实体 (逗号分隔，支持 关系:实体名 格式)</span>
                    <input id="we-ent-relations" class="input bg-black/30 border-white/10 text-sm text-gray-300" placeholder="例如：师父:张三, 敌对:魔教, 所属:青云门">
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-red-500/10 text-red-400 flex-1" onclick="Modules.world_engine._deleteEntity()"><i class="fa-solid fa-trash mr-1"></i>删除</button>
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 flex-1" onclick="Modules.world_engine._entityToLib()"><i class="fa-solid fa-book-open mr-1"></i>存阅读</button>
                    <button class="btn btn-xs bg-orange-600/20 text-orange-400 border-orange-600/30 flex-1" onclick="Modules.world_engine._injectEntityToPhoenix()"><i class="fa-solid fa-fire mr-1"></i>注入凤凰</button>
                    <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30 flex-1" onclick="Modules.world_engine._injectEntityToWriter()"><i class="fa-solid fa-feather-pointed mr-1"></i>注入执笔</button>
                </div>
            </div>`;

        if(t === 'inject') return we._renderInjectCenter();
        if(t === 'pipeline_overview') return we._renderPipelineOverview();

        if(t === 'world') {
            const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
            return `
            <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                <span class="text-xs font-bold text-blue-400"><i class="fa-solid fa-earth-americas mr-1"></i>${catLabels[we.worldCat] || '世界观'}</span>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.world_engine._aiGenWorld()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>AI 生成</button>
                    <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30" onclick="Modules.world_engine._saveWorld()"><i class="fa-solid fa-save mr-1"></i>保存</button>
                </div>
            </div>
            <div class="flex-1 p-0 min-h-0">
                <textarea id="we-world-editor" class="w-full h-full bg-transparent border-none resize-none font-mono text-gray-300 leading-loose focus:outline-none text-sm p-6" placeholder="# ${catLabels[we.worldCat]}\n\n在此详细描述..."></textarea>
            </div>`;
        }

        if(t === 'graph') return `
            <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                <div class="flex items-center gap-3">
                    <span class="text-xs font-bold text-purple-400"><i class="fa-solid fa-circle-nodes mr-1"></i>知识图谱 · 3D网络结构</span>
                    <span class="text-[10px] text-dim" id="we-graph-stats"></span>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.world_engine._refreshRAGContext()"><i class="fa-solid fa-rotate mr-1"></i>刷新RAG上下文</button>
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.world_engine._injectGraphToPhoenix()"><i class="fa-solid fa-fire mr-1"></i>→凤凰流</button>
                    <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30" onclick="Modules.world_engine._injectGraphToWriter()"><i class="fa-solid fa-feather-pointed mr-1"></i>→执笔台</button>
                    <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600 hover:text-white" onclick="Modules.world_engine._clearAllEntities()"><i class="fa-solid fa-trash-can mr-1"></i>一键清空</button>
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.world_engine._exportGraph()"><i class="fa-solid fa-book-open mr-1"></i>导出到阅读</button>
                </div>
            </div>
            <div class="flex-1 relative min-h-0">
                <div id="we-graph-canvas" class="w-full h-full" style="background:#08080a;"></div>
                <div class="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-lg border border-white/10 p-3 text-[10px] space-y-1 z-10" id="we-graph-info">
                    <div class="text-purple-400 font-bold text-xs mb-1">图谱统计</div>
                    <div class="text-dim">节点数: <span class="text-white font-bold" id="we-g-nodes">0</span></div>
                    <div class="text-dim">连线数: <span class="text-white font-bold" id="we-g-edges">0</span></div>
                    <div class="text-dim mt-1 text-[9px]">拖拽旋转 | 滚轮缩放 | 点击聚焦</div>
                </div>
                <div class="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg border border-white/10 p-3 text-[9px] space-y-1 z-10">
                    <div class="text-dim font-bold text-[10px] mb-1">节点类型颜色</div>
                    <div class="grid grid-cols-2 gap-x-3 gap-y-0.5">
                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-yellow-500"></span><span class="text-dim">人物</span></div>
                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span><span class="text-dim">物品</span></div>
                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-green-500"></span><span class="text-dim">地点</span></div>
                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-red-500"></span><span class="text-dim">情节</span></div>
                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span><span class="text-dim">伏笔</span></div>
                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span><span class="text-dim">势力</span></div>
                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-orange-500"></span><span class="text-dim">种族</span></div>
                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span><span class="text-dim">魔法</span></div>
                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-sky-500"></span><span class="text-dim">规则</span></div>
                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-pink-500"></span><span class="text-dim">文化</span></div>
                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span><span class="text-dim">历史</span></div>
                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-teal-500"></span><span class="text-dim">技法</span></div>
                    </div>
                </div>
                <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur-sm rounded-full border border-white/10 px-4 py-2 z-10">
                    <button class="btn btn-xs bg-white/10 text-white border-white/10 rounded-full" onclick="Modules.world_engine._graphResetView()"><i class="fa-solid fa-crosshairs mr-1"></i>重置视角</button>
                    <button class="btn btn-xs bg-white/10 text-white border-white/10 rounded-full" id="we-g-physics-btn" onclick="Modules.world_engine._graphTogglePhysics()"><i class="fa-solid fa-atom mr-1"></i>物理模拟 (开启)</button>
                    <button class="btn btn-xs bg-white/10 text-white border-white/10 rounded-full" id="we-g-labels-btn" onclick="Modules.world_engine._graphToggleLabels()"><i class="fa-solid fa-tag mr-1"></i>显示标签</button>
                    <button class="btn btn-xs bg-white/10 text-white border-white/10 rounded-full" id="we-g-rotate-btn" onclick="Modules.world_engine._graphToggleRotate()"><i class="fa-solid fa-rotate mr-1"></i>自动旋转</button>
                </div>
            </div>`;

        if(t === 'narrative_consistency') return Modules.world_engine._renderNarrativeConsistency();

        if(t === 'vectors') return `
            <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                <span class="text-xs font-bold text-cyan-400"><i class="fa-solid fa-database mr-1"></i>向量数据库浏览器</span>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600 hover:text-white" onclick="Modules.world_engine._clearAllVectors()"><i class="fa-solid fa-trash-can mr-1"></i>一键清空</button>
                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.world_engine._refreshVectors()"><i class="fa-solid fa-rotate mr-1"></i>刷新</button>
                </div>
            </div>
            <div class="flex-1 overflow-auto min-h-0">
                <div class="grid grid-cols-12 gap-4 p-4 text-[10px] text-dim font-bold uppercase border-b border-white/5">
                    <span class="col-span-2">ID</span><span class="col-span-8">向量内容预览</span><span class="col-span-2 text-right">维度</span>
                </div>
                <div id="we-vec-list" class="p-2 space-y-1 font-mono text-xs"></div>
            </div>`;

        return `<div class="flex-1 flex items-center justify-center text-dim text-sm">选择左侧标签</div>`;
    },

    // ═══ 注入中心 ═══
    _renderInjectCenter: () => {
        return `
            <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                <span class="text-xs font-bold text-green-400"><i class="fa-solid fa-syringe mr-1"></i>注入中心 — 数据中转枢纽</span>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-red-600/15 text-red-400 border-red-600/20 hover:bg-red-600/30" onclick="document.getElementById('we-inject-preview').value='';document.getElementById('we-inject-stats').textContent='0 字'"><i class="fa-solid fa-trash-can mr-1"></i>清除</button>
                    <button class="btn btn-xs bg-white/5 text-dim" onclick="Utils.copy(document.getElementById('we-inject-preview').value)"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.world_engine._refreshInjectPreview()"><i class="fa-solid fa-rotate mr-1"></i>刷新预览</button>
                </div>
            </div>
            <div class="flex h-full min-h-0">
                <div class="flex-1 flex flex-col border-r border-white/5 min-w-0">
                    <div class="px-4 py-2 bg-black/20 border-b border-white/5 shrink-0 flex items-center justify-between">
                        <span class="text-[10px] text-green-400 font-bold uppercase">注入包预览</span>
                        <span class="text-[9px] text-dim font-mono" id="we-inject-stats">0 字</span>
                    </div>
                    <textarea class="flex-1 bg-transparent border-none p-5 font-mono text-xs text-gray-300 resize-none leading-relaxed focus:outline-none overflow-y-auto" id="we-inject-preview" readonly placeholder="勾选左侧数据源后点击刷新预览..."></textarea>
                </div>
                <div class="w-72 shrink-0 flex flex-col p-4 space-y-3 overflow-y-auto">
                    <div class="text-[10px] text-dim font-bold uppercase tracking-wider">快速注入目标</div>
                    <div class="p-3 rounded-lg bg-orange-900/10 border border-orange-500/15 space-y-2">
                        <div class="flex items-center gap-2"><i class="fa-solid fa-fire text-orange-400"></i><span class="text-[11px] font-bold text-orange-300">凤凰创作流</span></div>
                        <button class="btn btn-xs bg-orange-600/20 text-orange-400 border-orange-600/30 w-full" onclick="Modules.world_engine.injectToPhoenix()"><i class="fa-solid fa-arrow-right mr-1"></i>注入凤凰流</button>
                    </div>
                    <div class="p-3 rounded-lg bg-blue-900/10 border border-blue-500/15 space-y-2">
                        <div class="flex items-center gap-2"><i class="fa-solid fa-feather-pointed text-blue-400"></i><span class="text-[11px] font-bold text-blue-300">长篇执笔台</span></div>
                        <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30 w-full" onclick="Modules.world_engine.injectToWriter()"><i class="fa-solid fa-arrow-right mr-1"></i>注入执笔台</button>
                    </div>
                    <div class="p-3 rounded-lg bg-cyan-900/10 border border-cyan-500/15 space-y-2">
                        <div class="flex items-center gap-2"><i class="fa-solid fa-database text-cyan-400"></i><span class="text-[11px] font-bold text-cyan-300">RAG上下文</span></div>
                        <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30 w-full" onclick="Modules.world_engine.injectToRAG()"><i class="fa-solid fa-arrow-right mr-1"></i>注入RAG</button>
                    </div>
                    <div class="p-3 rounded-lg bg-white/3 border border-white/5 space-y-1">
                        <div class="text-[9px] text-dim font-bold uppercase">当前数据统计</div>
                        <div class="grid grid-cols-2 gap-2 text-center">
                            <div><div class="text-sm font-bold text-amber-400" id="we-inj-ent-count">0</div><div class="text-[8px] text-dim">实体</div></div>
                            <div><div class="text-sm font-bold text-blue-400" id="we-inj-world-count">0</div><div class="text-[8px] text-dim">世界观</div></div>
                            <div><div class="text-sm font-bold text-green-400" id="we-inj-fusion-ok">—</div><div class="text-[8px] text-dim">融合数据</div></div>
                            <div><div class="text-sm font-bold text-red-400" id="we-inj-pipeline-ok">—</div><div class="text-[8px] text-dim">流水线</div></div>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    async _refreshInjectPreview() {
        await this._ensureCache();
        const opts = {
            includeEntities: (document.getElementById('we-inj-entities') || {}).checked !== false,
            includeWorld: (document.getElementById('we-inj-world') || {}).checked !== false,
            includeFusion: (document.getElementById('we-inj-fusion') || {}).checked !== false,
            includePipeline: (document.getElementById('we-inj-pipeline') || {}).checked === true,
            maxLen: 8000
        };
        const pkg = this.buildInjectPackage(opts);
        const el = document.getElementById('we-inject-preview');
        if(el) el.value = pkg || '（无数据）';
        const stats = document.getElementById('we-inject-stats');
        if(stats) stats.textContent = (pkg||'').length + ' 字';
        const entities = (this._cachedEntities || []).filter(e => !e.id.startsWith('world_'));
        const worlds = (this._cachedEntities || []).filter(e => e.id.startsWith('world_') && e.desc);
        const FB = Modules.fusion_book;
        const hasFusion = FB && ((FB._allPipelineResults||{}).fusion || (FB._pipelineResults||{}).fusion);
        const hasPipeline = FB && FB._pipelineResults && Object.keys(FB._pipelineResults).length > 0;
        const ec = document.getElementById('we-inj-ent-count'); if(ec) ec.textContent = entities.length;
        const wc = document.getElementById('we-inj-world-count'); if(wc) wc.textContent = worlds.length;
        const fc = document.getElementById('we-inj-fusion-ok'); if(fc) fc.textContent = hasFusion ? '✓' : '—';
        const pc = document.getElementById('we-inj-pipeline-ok'); if(pc) pc.textContent = hasPipeline ? '✓' : '—';
    },

    // ═══ 注入操作 ═══
    async injectToPhoenix() {
        await this._ensureCache();
        const pkg = this.buildInjectPackage({ includeEntities:true, includeWorld:true, includeFusion:true, maxLen:6000 });
        if(!pkg) return UI.toast('没有可注入的数据');
        if(Modules.phoenix) {
            Modules.phoenix.data.worldContext = pkg;
            UI.toast('已注入凤凰创作流 (' + pkg.length + '字)');
        } else { UI.toast('凤凰创作流未加载'); }
    },

    // ═══ 叙事一致性监控中心 ═══
    _renderNarrativeConsistency: () => {
        return `
        <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
            <span class="text-xs font-bold text-emerald-400"><i class="fa-solid fa-shield-halved mr-1"></i>叙事一致性监控中心</span>
            <div class="flex gap-2">
                <button class="btn btn-xs bg-emerald-600/20 text-emerald-400 border-emerald-600/30" onclick="Modules.world_engine._refreshNarrativeConsistency()"><i class="fa-solid fa-rotate mr-1"></i>刷新状态</button>
                <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30" onclick="Modules.world_engine._syncConsistencyToFusion()"><i class="fa-solid fa-arrows-rotate mr-1"></i>同步到融合拆书</button>
            </div>
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-4" id="we-consistency-container">
            <!-- 顶部统计栏 -->
            <div class="grid grid-cols-4 gap-3">
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-3 text-center">
                    <div class="text-[10px] text-dim uppercase tracking-wider">实体总数</div>
                    <div class="text-2xl font-bold text-amber-400 mt-1" id="we-cs-ent-total">-</div>
                    <div class="text-[9px] text-dim mt-0.5" id="we-cs-ent-breakdown">-</div>
                </div>
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-3 text-center">
                    <div class="text-[10px] text-dim uppercase tracking-wider">待回收伏笔</div>
                    <div class="text-2xl font-bold text-red-400 mt-1" id="we-cs-pending-fs">-</div>
                    <div class="text-[9px] text-dim mt-0.5">未回收悬念</div>
                </div>
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-3 text-center">
                    <div class="text-[10px] text-dim uppercase tracking-wider">已回收伏笔</div>
                    <div class="text-2xl font-bold text-green-400 mt-1" id="we-cs-resolved-fs">-</div>
                    <div class="text-[9px] text-dim mt-0.5">悬念回收率</div>
                </div>
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-3 text-center">
                    <div class="text-[10px] text-dim uppercase tracking-wider">情绪均值</div>
                    <div class="text-2xl font-bold text-cyan-400 mt-1" id="we-cs-emo-avg">-</div>
                    <div class="text-[9px] text-dim mt-0.5">跨章情绪走势</div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <!-- 左侧：伏笔追踪器 -->
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-white"><i class="fa-solid fa-magnifying-glass-chart mr-1 text-purple-400"></i>伏笔追踪器</span>
                        <div class="flex gap-1">
                            <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.world_engine._showAddForeshadowingModal()"><i class="fa-solid fa-plus mr-1"></i>手动添加</button>
                        </div>
                    </div>
                    <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-3 space-y-2">
                        <div class="text-[10px] text-dim font-bold uppercase tracking-wider flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-red-500"></span>待回收伏笔
                            <span class="ml-auto text-red-400" id="we-cs-pending-count">0</span>
                        </div>
                        <div id="we-cs-pending-list" class="space-y-1.5 max-h-48 overflow-y-auto">
                            <div class="text-[10px] text-dim italic">加载中...</div>
                        </div>
                    </div>
                    <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-3 space-y-2">
                        <div class="text-[10px] text-dim font-bold uppercase tracking-wider flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-green-500"></span>已回收伏笔
                            <span class="ml-auto text-green-400" id="we-cs-resolved-count">0</span>
                        </div>
                        <div id="we-cs-resolved-list" class="space-y-1.5 max-h-36 overflow-y-auto">
                            <div class="text-[10px] text-dim italic">加载中...</div>
                        </div>
                    </div>
                </div>

                <!-- 右侧：情绪弧线 -->
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-white"><i class="fa-solid fa-chart-line mr-1 text-cyan-400"></i>情绪弧线</span>
                        <div class="flex gap-1">
                            <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.world_engine._showAddEmotionModal()"><i class="fa-solid fa-plus mr-1"></i>手动记录</button>
                        </div>
                    </div>
                    <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-3">
                        <div id="we-cs-emotion-chart" style="width:100%;height:220px;"></div>
                    </div>
                    <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-3 space-y-2">
                        <div class="text-[10px] text-dim font-bold uppercase tracking-wider">情绪异常预警</div>
                        <div id="we-cs-emo-alerts" class="space-y-1">
                            <div class="text-[10px] text-dim italic">分析中...</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 底部：世界观维度速览 + 实体一致性检查 -->
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-3 space-y-2">
                    <div class="text-xs font-bold text-white"><i class="fa-solid fa-globe mr-1 text-blue-400"></i>世界观维度完成度</div>
                    <div id="we-cs-world-dims" class="space-y-1.5">
                        <div class="text-[10px] text-dim italic">加载中...</div>
                    </div>
                </div>
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-3 space-y-2">
                    <div class="text-xs font-bold text-white"><i class="fa-solid fa-triangle-exclamation mr-1 text-amber-400"></i>一致性检查</div>
                    <div id="we-cs-conflicts" class="space-y-1.5">
                        <div class="text-[10px] text-dim italic">扫描中...</div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    async injectToWriter() {
        await this._ensureCache();
        const pkg = this.buildInjectPackage({ includeEntities:true, includeWorld:true, includeFusion:true, maxLen:5000 });
        if(!pkg) return UI.toast('没有可注入的数据');
        const ol = document.getElementById('w-outline');
        if(ol) {
            ol.value = (ol.value ? ol.value + '\n\n' : '') + '[世界引擎注入]\n' + pkg;
            UI.toast('已注入执笔台大纲 (' + pkg.length + '字)');
        } else { UI.toast('请先打开执笔台并选择章节'); }
    },
    async injectToRAG() {
        await this._ensureCache();
        const pkg = this.buildInjectPackage({ includeEntities:true, includeWorld:true, includeFusion:true, maxLen:8000 });
        if(!pkg) return UI.toast('没有可注入的数据');
        if(typeof RAGSystem !== 'undefined') {
            await RAGSystem.addDocument('世界引擎注入包_' + Date.now(), pkg, 'world_engine');
            UI.toast('已注入RAG上下文 (' + pkg.length + '字)');
        } else { UI.toast('RAG系统未加载'); }
    },
    _injectEntityToPhoenix() {
        const name = (document.getElementById('we-ent-name') || {}).value;
        const type = (document.getElementById('we-ent-type') || {}).value;
        const desc = (document.getElementById('we-ent-desc') || {}).value;
        if(!name || !desc) return UI.toast('实体为空');
        const text = `[${type}] ${name}: ${desc}`;
        if(Modules.phoenix) {
            Modules.phoenix.data.worldContext = (Modules.phoenix.data.worldContext || '') + '\n' + text;
            UI.toast('已注入凤凰流: ' + name);
        }
    },
    _injectEntityToWriter() {
        const name = (document.getElementById('we-ent-name') || {}).value;
        const type = (document.getElementById('we-ent-type') || {}).value;
        const desc = (document.getElementById('we-ent-desc') || {}).value;
        if(!name || !desc) return UI.toast('实体为空');
        const ol = document.getElementById('w-outline');
        if(ol) { ol.value = (ol.value ? ol.value + '\n' : '') + `[${type}] ${name}: ${desc}`; UI.toast('已注入执笔台: ' + name); }
        else UI.toast('请先打开执笔台');
    },

    // ═══ 流水线概览 ═══
    _renderPipelineOverview: () => {
        const FB = Modules.fusion_book;
        const allPr = (FB && FB._allPipelineResults) ? FB._allPipelineResults : {};
        const curPr = (FB && FB._pipelineResults) ? FB._pipelineResults : {};
        const pr = {};
        ['left','right','compare','fusion','world','outline','write'].forEach(k => {
            pr[k] = (allPr[k] && allPr[k].trim()) ? allPr[k] : (curPr[k] || '');
        });
        const hasData = Object.keys(pr).some(k => pr[k]);
        const labels = { left:'左书拆解', right:'右书拆解', compare:'对比结论', fusion:'融合精华', world:'实体提取', outline:'细纲', write:'正文' };
        const colors = { left:'blue', right:'pink', compare:'amber', fusion:'green', world:'cyan', outline:'orange', write:'purple' };
        const icons = { left:'fa-a', right:'fa-b', compare:'fa-scale-balanced', fusion:'fa-wand-magic-sparkles', world:'fa-atom', outline:'fa-feather-pointed', write:'fa-pen-nib' };

        if(!hasData) return `
            <div class="flex-1 flex items-center justify-center">
                <div class="text-center max-w-md">
                    <div class="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex center mx-auto mb-4"><i class="fa-solid fa-rocket text-2xl text-red-400/50"></i></div>
                    <div class="text-sm text-dim mb-2">暂无流水线数据</div>
                    <button class="btn btn-sm bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="App.nav('fusion_book')"><i class="fa-solid fa-book-open-reader mr-1"></i>前往融合拆书</button>
                </div>
            </div>`;

        const steps = Object.keys(pr).filter(k => pr[k]);
        return `
            <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                <span class="text-xs font-bold text-red-400"><i class="fa-solid fa-rocket mr-1"></i>流水线数据概览 (${steps.length}项)</span>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.world_engine._exportPipelineAll()"><i class="fa-solid fa-book-open mr-1"></i>全部存阅读</button>
                    <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.world_engine.extractFromFusion()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>提取实体</button>
                    <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.world_engine.extractWorldView()"><i class="fa-solid fa-earth-americas mr-1"></i>提取世界观</button>
                </div>
            </div>
            <div class="flex h-full min-h-0">
                <div class="w-52 shrink-0 bg-[#0d0d0f] border-r border-white/5 overflow-y-auto p-2 space-y-1">
                    ${steps.map(key => `
                        <button class="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-[11px] font-bold transition-all hover:bg-white/5 border border-transparent hover:border-white/10 text-${colors[key]||'white'}-400" onclick="Modules.world_engine._viewPipelineStep('${key}')" id="we-pp-btn-${key}">
                            <i class="fa-solid ${icons[key]||'fa-circle'} w-4 text-center text-[10px]"></i>
                            <span class="flex-1 truncate">${labels[key]||key}</span>
                            <span class="text-[9px] text-dim">${pr[key].length}字</span>
                        </button>
                    `).join('')}
                </div>
                <div class="flex-1 flex flex-col min-w-0">
                    <div class="h-9 flex items-center px-4 bg-black/30 border-b border-white/5 shrink-0">
                        <span class="text-[10px] font-bold text-dim uppercase" id="we-pp-title">选择左侧步骤查看</span>
                        <button class="btn btn-xs bg-white/5 text-dim ml-auto" onclick="Utils.copy(document.getElementById('we-pp-content').value)"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                    </div>
                    <textarea class="flex-1 w-full bg-transparent border-none p-5 font-mono text-sm leading-relaxed text-gray-300 resize-none focus:outline-none" id="we-pp-content" readonly placeholder="选择左侧步骤查看流水线结果..."></textarea>
                </div>
            </div>`;
    },

    _viewPipelineStep(key) {
        const FB = Modules.fusion_book;
        const allPr = (FB && FB._allPipelineResults) ? FB._allPipelineResults : {};
        const curPr = (FB && FB._pipelineResults) ? FB._pipelineResults : {};
        const val = (allPr[key] && allPr[key].trim()) ? allPr[key] : (curPr[key] || '');
        if(!val) return;
        const labels = { left:'左书拆解', right:'右书拆解', compare:'对比结论', fusion:'融合精华', world:'实体提取', outline:'细纲', write:'正文' };
        const el = document.getElementById('we-pp-content');
        const title = document.getElementById('we-pp-title');
        if(el) el.value = val;
        if(title) title.textContent = (labels[key]||key) + ' (' + val.length + '字)';
        document.querySelectorAll('[id^="we-pp-btn-"]').forEach(btn => { btn.classList.remove('bg-white/10','border-white/10'); btn.classList.add('border-transparent'); });
        const ab = document.getElementById('we-pp-btn-' + key);
        if(ab) { ab.classList.add('bg-white/10','border-white/10'); ab.classList.remove('border-transparent'); }
    },

    _exportPipelineAll() {
        const FB = Modules.fusion_book;
        const allPr = (FB && FB._allPipelineResults) ? FB._allPipelineResults : {};
        const curPr = (FB && FB._pipelineResults) ? FB._pipelineResults : {};
        const labels = { left:'左书拆解', right:'右书拆解', compare:'对比结论', fusion:'融合精华', world:'实体提取', outline:'细纲', write:'正文' };
        let md = '# 流水线全部数据\n\n';
        ['left','right','compare','fusion','world','outline','write'].forEach(k => {
            const v = (allPr[k] && allPr[k].trim()) ? allPr[k] : (curPr[k] || '');
            if(v) md += `## ${labels[k]||k}\n${v}\n\n`;
        });
        if(typeof ContextHelper !== 'undefined') ContextHelper.exportToLibrary('流水线数据_' + new Date().toLocaleTimeString(), md);
    },

    // ═══ 实体管理 ═══
    _refreshEntities: async () => {
        await Modules.world_engine._ensureCache();
        await Modules.world_engine._ensureCycleCache();
        const list = Modules.world_engine._cachedEntities || [];
        const el = document.getElementById('we-entity-list');
        if(!el) return;
        let filtered = list.filter(e => !e.id.startsWith('world_'));
        const f = Modules.world_engine._entityFilter;
        const tf = Modules.world_engine._typeFilter;
        const cf = Modules.world_engine._chapterFilter;
        const cyf = Modules.world_engine._cycleFilter;
        if(f === 'pipeline') filtered = filtered.filter(e => e.source === 'pipeline');
        if(f === 'manual') filtered = filtered.filter(e => e.source !== 'pipeline');
        if(tf) filtered = filtered.filter(e => e.type === tf);
        if(cf === 'none') filtered = filtered.filter(e => !e.chapters || !e.chapters.length);
        if(cf !== 'all' && cf !== 'none') {
            filtered = filtered.filter(e => e.chapters && e.chapters.includes(cf));
        }
        // ★ 循环筛选
        if(cyf === 'none') filtered = filtered.filter(e => !e.cycles || !e.cycles.length);
        if(cyf !== 'all' && cyf !== 'none') {
            filtered = filtered.filter(e => e.cycles && e.cycles.includes(cyf));
        }

        el.innerHTML = filtered.length ? filtered.map(e => {
            const isPipeline = e.source === 'pipeline';
            const iconMap = {'人物':'fa-user','地点':'fa-map-location-dot','物品':'fa-box','情节':'fa-film','伏笔':'fa-eye','势力':'fa-flag','种族':'fa-dragon','魔法':'fa-wand-sparkles','规则':'fa-gavel','文化':'fa-masks-theater','历史':'fa-scroll','技法':'fa-lightbulb'};
            const timeStr = e.updatedAt ? new Date(e.updatedAt).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : '';
            const chapterCount = (e.chapters || []).length;
            const cycleCount = (e.cycles || []).length;
            const nexusBadge = e.nexusState && e.nexusState.chrStatus ? `<span class="text-[8px] text-purple-400 bg-purple-500/10 px-1 py-0.5 rounded shrink-0">${e.nexusState.chrStatus}</span>` : '';
            return `
            <button class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[11px] font-bold transition-all ${Modules.world_engine.cur===e.id ? 'bg-amber-500/10 text-white border border-amber-500/20' : 'text-dim hover:bg-white/5 border border-transparent'}" onclick="Modules.world_engine._loadEntity('${e.id}')">
                <i class="fa-solid ${iconMap[e.type]||'fa-circle'} w-4 text-center text-[10px] text-amber-400/60"></i>
                <span class="truncate flex-1">${e.name}</span>
                ${isPipeline ? '<span class="text-[8px] text-red-400 bg-red-500/10 px-1 py-0.5 rounded shrink-0">流水线</span>' : ''}
                ${chapterCount>0 ? `<span class="text-[8px] text-cyan-400 bg-cyan-500/10 px-1 py-0.5 rounded shrink-0">${chapterCount}章</span>` : ''}
                ${cycleCount>0 ? `<span class="text-[8px] text-green-400 bg-green-500/10 px-1 py-0.5 rounded shrink-0">${cycleCount}循环</span>` : ''}
                ${nexusBadge}
                ${timeStr ? '<span class="text-[8px] text-dim shrink-0">' + timeStr + '</span>' : ''}
                <span class="text-[9px] text-dim bg-black/30 px-1.5 py-0.5 rounded">${e.type}</span>
            </button>`;
        }).join('') : '<div class="text-[10px] text-dim p-2">暂无实体' + (f !== 'all' || tf || cf !== 'all' || cyf !== 'all' ? '（当前有筛选）' : '') + '</div>';
    },
    _addEntity: () => {
        Modules.world_engine.cur = null;
        const n = document.getElementById('we-ent-name'); if(n) n.value = '';
        const d = document.getElementById('we-ent-desc'); if(d) d.value = '';
        const r = document.getElementById('we-ent-relations'); if(r) r.value = '';
        const badge = document.getElementById('we-ent-source-badge'); if(badge) badge.innerHTML = '';
        document.querySelectorAll('.we-ent-chapter-check').forEach(cb => cb.checked = false);
    },
    _loadEntity: async (id) => {
        Modules.world_engine.cur = id;
        const e = await DB.get('entities', id);
        if(!e) return;
        const n = document.getElementById('we-ent-name'); if(n) n.value = e.name || '';
        const t = document.getElementById('we-ent-type'); if(t) t.value = e.type || '人物';
        const d = document.getElementById('we-ent-desc'); if(d) d.value = e.desc || '';
        const r = document.getElementById('we-ent-relations'); if(r) r.value = (e.relations || []).join(', ');
        const entityChapters = e.chapters || [];
        document.querySelectorAll('.we-ent-chapter-check').forEach(cb => {
            cb.checked = entityChapters.includes(cb.dataset.chapterId);
        });
        const badge = document.getElementById('we-ent-source-badge');
        if(badge) {
            const badges = {
                pipeline: '<div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-400"><i class="fa-solid fa-rocket mr-1"></i>流水线提取' + (e.updatedAt ? ' · ' + new Date(e.updatedAt).toLocaleString('zh-CN') : '') + '</div>',
                phoenix: '<div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[10px] text-orange-400"><i class="fa-solid fa-fire mr-1"></i>凤凰创作流</div>',
                fusion: '<div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-400"><i class="fa-solid fa-book-open-reader mr-1"></i>融合拆书</div>'
            };
            badge.innerHTML = badges[e.source] || '<div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] text-dim"><i class="fa-solid fa-pen mr-1"></i>手动创建' + (e.updatedAt ? ' · ' + new Date(e.updatedAt).toLocaleString('zh-CN') : '') + '</div>';
        }
        Modules.world_engine._refreshEntities();
    },
    _saveEntity: async () => {
        const name = document.getElementById('we-ent-name').value.trim();
        const type = document.getElementById('we-ent-type').value;
        const desc = document.getElementById('we-ent-desc').value;
        const relStr = document.getElementById('we-ent-relations').value;
        const relations = relStr ? relStr.split(',').map(s => s.trim()).filter(Boolean) : [];
        const chapters = [];
        document.querySelectorAll('.we-ent-chapter-check:checked').forEach(cb => {
            chapters.push(cb.dataset.chapterId);
        });
        if(!name) return UI.toast('请输入实体名称');
        
        await Modules.world_engine._ensureCache();
        const existingEntities = Modules.world_engine._cachedEntities || [];
        const normalizedName = name.toLowerCase();
        
        let id = Modules.world_engine.cur;
        let isUpdate = false;
        
        for (const e of existingEntities) {
            if (e.name && e.name.toLowerCase() === normalizedName) {
                if (id && e.id === id) {
                    isUpdate = true;
                    break;
                } else if (!id) {
                    id = e.id;
                    isUpdate = true;
                    break;
                } else {
                    const confirmOverwrite = confirm(`已存在同名实体「${e.name}」，是否覆盖更新？`);
                    if (confirmOverwrite) {
                        await DB.del('entities', id);
                        try { await DB.del('vectors', id); } catch(err) {}
                        id = e.id;
                        isUpdate = true;
                        break;
                    } else {
                        return UI.toast('保存已取消');
                    }
                }
            }
        }
        
        if (!id) id = Utils.uuid();
        
        let source = 'manual';
        let existingCycles = [];
        let existingNexus = null;
        if(isUpdate) {
            const ex = await DB.get('entities', id);
            if(ex) {
                if(ex.source) source = ex.source;
                if(ex.cycles) existingCycles = ex.cycles;
                if(ex.nexusState) existingNexus = ex.nexusState;
            }
        }
        Modules.world_engine.cur = id;
        await DB.put('entities', { id, name, type, desc, relations, chapters, cycles: existingCycles, nexusState: existingNexus, source, updatedAt: Date.now() });
        await DB.put('vectors', { id, content: `[${type}] ${name}: ${desc}`, vector: Array.from({length:1536}, ()=>Math.random()), timestamp: Date.now() });
        Modules.world_engine._cachedEntities = null;
        UI.toast(isUpdate ? '实体已更新，向量库已同步' : '实体已保存，向量库已同步');
        Modules.world_engine._refreshEntities();
    },
    _deleteEntity: async () => {
        if(!Modules.world_engine.cur) return UI.toast('请先选择实体');
        if(!confirm('确定删除此实体？')) return;
        await DB.del('entities', Modules.world_engine.cur);
        try { await DB.del('vectors', Modules.world_engine.cur); } catch(e) {}
        Modules.world_engine.cur = null;
        Modules.world_engine._cachedEntities = null;
        const n = document.getElementById('we-ent-name'); if(n) n.value = '';
        const d = document.getElementById('we-ent-desc'); if(d) d.value = '';
        const r = document.getElementById('we-ent-relations'); if(r) r.value = '';
        const badge = document.getElementById('we-ent-source-badge'); if(badge) badge.innerHTML = '';
        Modules.world_engine._refreshEntities();
        UI.toast('已删除');
    },
    _entityToLib: async () => {
        const name = document.getElementById('we-ent-name').value;
        const desc = document.getElementById('we-ent-desc').value;
        if(!name || !desc) return UI.toast('实体为空');
        if(typeof ContextHelper !== 'undefined') ContextHelper.exportToLibrary('实体_' + name, desc);
    },
    _aiExpandEntity: async () => {
        const name = document.getElementById('we-ent-name').value;
        const type = document.getElementById('we-ent-type').value;
        const desc = document.getElementById('we-ent-desc').value;
        if(!name) return UI.toast('请先输入实体名称');
        let pipelineCtx = '';
        const FB = Modules.fusion_book;
        if(FB && FB._pipelineResults && FB._pipelineResults.fusion) pipelineCtx = '\n\n[流水线融合参考]\n' + FB._pipelineResults.fusion.slice(0, 800);
        const prompt = `请为以下${type}实体生成详细的设定描述：\n名称：${name}\n已有描述：${desc || '无'}${pipelineCtx}\n\n要求：\n1. 外貌/特征描述\n2. 背景故事\n3. 性格/属性\n4. 与其他实体的潜在关系\n5. 在故事中的作用和定位\n6. 独特的标志性特点`;
        const el = document.getElementById('we-ent-desc');
        el.value = '生成中...';
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; el.value = fullRes; });
        UI.toast('AI 扩写完成');
    },

    // ═══ 从融合拆书深度提取实体 (12类型) — 修复: 确保关系正确、同步刷新图谱+世界观 ═══
    extractFromFusion: async () => {
        const we = Modules.world_engine;
        const FB = Modules.fusion_book;
        if(!FB) return UI.toast('融合拆书模块未加载');
        const allPr = FB._allPipelineResults || {};
        const pr = FB._pipelineResults || {};
        const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
        const compare = (allPr.compare && allPr.compare.trim()) ? allPr.compare : (pr.compare || '');
        const left = (allPr.left && allPr.left.trim()) ? allPr.left : (pr.left || '');
        const right = (allPr.right && allPr.right.trim()) ? allPr.right : (pr.right || '');
        const src = [fusion, compare, left, right].filter(Boolean).join('\n\n');
        if(!src || src.length < 50) return UI.toast('流水线数据不足，请先运行融合拆书');

        // 获取已有实体名称，让AI建立关联
        await we._ensureCache();
        const existingNames = (we._cachedEntities || []).filter(e => !e.id.startsWith('world_')).map(e => e.name);
        const existingHint = existingNames.length ? `\n\n【已有实体(请在relations中引用这些名称建立关联)】\n${existingNames.join('、')}` : '';

        const prompt = `你是一个专业的小说实体提取引擎。请从以下融合拆书分析数据中，提取所有有价值的实体。

【数据来源】
${src.slice(0, 6000)}
${existingHint}

【提取要求】
请提取以下12种类型的实体：
1. 人物 — 角色名、身份、性格、外貌、能力
2. 物品 — 武器、法宝、道具、关键物件
3. 地点 — 场景、城市、秘境、地标
4. 情节 — 关键事件、转折点、冲突
5. 伏笔 — 暗示、线索、未解之谜
6. 势力 — 门派、组织、阵营、国家
7. 种族 — 种族、族群、特殊生物
8. 魔法 — 功法、技能、法术体系
9. 规则 — 世界运行规则、力量等级
10. 文化 — 风俗、信仰、语言、节日
11. 历史 — 历史事件、传说、纪元
12. 技法 — 写作技法、叙事手法、结构技巧

【输出格式】严格JSON数组：
[{"name":"实体名","type":"类型","desc":"详细描述(100-300字)","relations":["关系类型:关联实体名"]}]

【关键要求 - 关系网络】
- 每个实体的relations必须尽可能多地引用其他实体名称，用"关系类型:实体名"格式
- 关系类型例如：师父、徒弟、敌对、盟友、所属、位于、拥有、使用、参与、创造、守护、统治等
- 人物之间要有师徒/敌友/从属关系
- 人物与地点要有"位于"/"出没"关系
- 人物与物品要有"拥有"/"使用"关系
- 人物与势力要有"所属"/"统治"关系
- 情节与人物要有"参与"关系
- 这些关系是构建知识网络图的关键，不要遗漏！
- 直接输出JSON，不要包裹markdown代码块`;

        UI.toast('正在深度提取实体...');
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; });

        // ═══ 健壮JSON解析（6层容错） ═══
        let entities = null;
        // 预处理: 去掉markdown代码块包裹
        let cleanRes = fullRes.trim();
        cleanRes = cleanRes.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();

        // 尝试1: 直接解析
        try { entities = JSON.parse(cleanRes); } catch(e1) {
            // 尝试2: 提取最外层 [...]
            try {
                const s = cleanRes.indexOf('[');
                const e = cleanRes.lastIndexOf(']');
                if (s !== -1 && e > s) entities = JSON.parse(cleanRes.slice(s, e + 1));
            } catch(e2) {
                // 尝试3: 修复常见JSON问题（不做\n→\\n全局替换）
                try {
                    let fixed = cleanRes;
                    const s2 = fixed.indexOf('[');
                    const e2b = fixed.lastIndexOf(']');
                    if (s2 !== -1 && e2b > s2) fixed = fixed.slice(s2, e2b + 1);
                    fixed = fixed.replace(/,\s*([}\]])/g, '$1');
                    fixed = fixed.replace(/'/g, '"').replace(/[""]/g, '"');
                    fixed = fixed.replace(/[\u200B-\u200D\uFEFF]/g, '');
                    // 安全处理: 只替换字符串值内部的裸换行
                    fixed = fixed.replace(/"([^"]*)\n([^"]*)"/g, (m) => m.replace(/\n/g, '\\n'));
                    entities = JSON.parse(fixed);
                } catch(e3) {
                    // 尝试4: 逐个对象提取（支持含数组的对象）
                    const objMatches = cleanRes.match(/\{(?:[^{}]|\[[^\]]*\]|\{[^{}]*\})*"name"\s*:\s*"[^"]+?"(?:[^{}]|\[[^\]]*\]|\{[^{}]*\})*\}/g);
                    if (objMatches && objMatches.length) {
                        entities = [];
                        for (const objStr of objMatches) {
                            try {
                                let fixedObj = objStr.replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']')
                                    .replace(/'/g, '"').replace(/[""]/g, '"');
                                fixedObj = fixedObj.replace(/"([^"]*)\n([^"]*)"/g, (m) => m.replace(/\n/g, '\\n'));
                                entities.push(JSON.parse(fixedObj));
                            } catch(e) {
                                const nameM = objStr.match(/"name"\s*:\s*"([^"]+?)"/);
                                const typeM = objStr.match(/"type"\s*:\s*"([^"]+?)"/);
                                const descM = objStr.match(/"desc(?:ription)?"\s*:\s*"([\s\S]*?)"/);
                                const relM = objStr.match(/"relations"\s*:\s*\[([\s\S]*?)\]/);
                                let relations = [];
                                if (relM) { relations = (relM[1].match(/"([^"]+?)"/g) || []).map(r => r.replace(/"/g, '')); }
                                if (nameM) entities.push({ name: nameM[1], type: typeM?typeM[1]:'其他', desc: descM?descM[1]:'', relations });
                            }
                        }
                    }
                    // 尝试5: 逐行扫描
                    if (!entities || !entities.length) {
                        entities = [];
                        const lines = cleanRes.split('\n');
                        let cur = null;
                        for (const line of lines) {
                            const nm = line.match(/"name"\s*:\s*"([^"]+)"/);
                            if (nm) { if (cur && cur.name) entities.push(cur); cur = { name: nm[1], type: '其他', desc: '', relations: [] }; }
                            if (cur) {
                                const tm = line.match(/"type"\s*:\s*"([^"]+)"/);
                                if (tm) cur.type = tm[1];
                                const dm = line.match(/"desc(?:ription)?"\s*:\s*"([^"]+)"/);
                                if (dm) cur.desc = dm[1];
                            }
                        }
                        if (cur && cur.name) entities.push(cur);
                    }
                }
            }
        }
        if(!entities || !Array.isArray(entities) || !entities.length) return UI.toast('提取失败，AI返回格式异常');

        await we._ensureCache();
        const existingEntities = we._cachedEntities || [];
        const existingNameMap = new Map();
        existingEntities.forEach(e => {
            if (e.name) {
                existingNameMap.set(e.name.toLowerCase().trim(), e);
            }
        });

        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        const now = Date.now();
        for(const ent of entities) {
            if(!ent.name || !ent.type) continue;
            
            const normalizedName = ent.name.toLowerCase().trim();
            const existingEntity = existingNameMap.get(normalizedName);
            
            let relations = ent.relations || [];
            if(!Array.isArray(relations)) relations = [];
            relations = relations.map(r => typeof r === 'string' ? r : String(r)).filter(Boolean);

            if (existingEntity) {
                const newDesc = ent.description || ent.desc || '';
                if (existingEntity.desc !== newDesc || existingEntity.type !== ent.type) {
                    await DB.put('entities', {
                        id: existingEntity.id,
                        name: ent.name,
                        type: ent.type,
                        desc: newDesc || existingEntity.desc,
                        relations: [...new Set([...(existingEntity.relations || []), ...relations])],
                        source: existingEntity.source || 'pipeline',
                        updatedAt: now
                    });
                    await DB.put('vectors', { 
                        id: existingEntity.id, 
                        content: `[${ent.type}] ${ent.name}: ${newDesc}`, 
                        vector: Array.from({length:1536}, ()=>Math.random()), 
                        timestamp: now 
                    });
                    updatedCount++;
                } else {
                    skippedCount++;
                }
            } else {
                const id = 'ent_pipeline_' + Utils.uuid();
                await DB.put('entities', {
                    id, name: ent.name, type: ent.type,
                    desc: ent.description || ent.desc || '', relations,
                    source: 'pipeline', updatedAt: now
                });
                await DB.put('vectors', { id, content: `[${ent.type}] ${ent.name}: ${ent.description||ent.desc||''}`, vector: Array.from({length:1536}, ()=>Math.random()), timestamp: now });
                addedCount++;
            }
        }
        we._cachedEntities = null;
        let message = `深度提取完成: 新增 ${addedCount}，更新 ${updatedCount}`;
        if (skippedCount > 0) message += `，跳过 ${skippedCount}`;
        UI.toast(message);

        // ★ 同时刷新: 实体列表 + 知识图谱 + 世界观
        we.switchTab('graph');
    },

    // ═══ 从流水线提取世界观 — 修复: 提取后同步刷新图谱 ═══
    extractWorldView: async () => {
        const we = Modules.world_engine;
        const FB = Modules.fusion_book;
        if(!FB) return UI.toast('融合拆书模块未加载');
        const allPr = FB._allPipelineResults || {};
        const pr = FB._pipelineResults || {};
        const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
        const compare = (allPr.compare && allPr.compare.trim()) ? allPr.compare : (pr.compare || '');
        const left = (allPr.left && allPr.left.trim()) ? allPr.left : (pr.left || '');
        const right = (allPr.right && allPr.right.trim()) ? allPr.right : (pr.right || '');
        const src = [fusion, compare, left, right].filter(Boolean).join('\n\n');
        if(!src || src.length < 50) return UI.toast('流水线数据不足，请先运行融合拆书');

        const prompt = `你是一个专业的世界观构建引擎。请从以下融合拆书分析数据中，提取并构建完整的世界观设定。

【数据来源】
${src.slice(0, 6000)}

【提取要求】请为以下7个维度各生成详细的世界观设定：

1. history (历史与传说) — 世界的历史脉络、重大事件、传说故事、纪元划分
2. geography (地理与地貌) — 地理环境、重要地标、气候特征、空间布局
3. magic (魔法/科技体系) — 力量体系、等级划分、修炼/科技路线、核心规则
4. factions (势力与组织) — 主要势力、组织架构、势力关系、权力格局
5. species (种族与生物) — 种族分类、特殊生物、种族特征、种族关系
6. rules (世界规则) — 世界运行的底层规则、禁忌、自然法则
7. culture (文化与习俗) — 文化传统、社会制度、信仰体系、日常习俗

【输出格式】严格JSON对象：
{"history":"详细内容","geography":"详细内容","magic":"详细内容","factions":"详细内容","species":"详细内容","rules":"详细内容","culture":"详细内容"}

注意：每个维度至少200字，要具体、可直接用于创作。直接输出JSON，不要包裹markdown代码块`;

        UI.toast('正在提取世界观...');
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; });

        let worldData = null;
        try { worldData = JSON.parse(fullRes); } catch(e1) {
            try { worldData = JSON.parse(fullRes.replace(/```json?\s*/g,'').replace(/```/g,'').trim()); } catch(e2) {
                const m = fullRes.match(/\{[\s\S]*\}/);
                if(m) try { worldData = JSON.parse(m[0]); } catch(e3) {}
            }
        }
        if(!worldData || typeof worldData !== 'object') return UI.toast('提取失败，AI返回格式异常');

        const cats = ['history','geography','magic','factions','species','rules','culture'];
        let count = 0;
        const now = Date.now();
        for(const cat of cats) {
            if(worldData[cat]) {
                await DB.put('entities', { id: 'world_' + cat, name: cat, type: 'world', desc: worldData[cat], source: 'pipeline', updatedAt: now });
                count++;
            }
        }
        we._cachedEntities = null;
        UI.toast(`世界观提取完成: ${count} 个维度已更新`);

        // ★ 同时刷新: 世界观 + 知识图谱
        we.switchTab('graph');
    },

    // ═══ 世界观构建 ═══
    _loadWorldCat: async () => {
        const we = Modules.world_engine;
        const cat = we.worldCat;
        const data = await DB.get('entities', 'world_' + cat);
        const el = document.getElementById('we-world-editor');
        if(el) el.value = (data && data.desc) ? data.desc : '';
    },
    _saveWorld: async () => {
        const we = Modules.world_engine;
        const cat = we.worldCat;
        const el = document.getElementById('we-world-editor');
        const desc = el ? el.value : '';
        if(!desc) return UI.toast('内容为空');
        await DB.put('entities', { id: 'world_' + cat, name: cat, type: 'world', desc, source: 'manual', updatedAt: Date.now() });
        we._cachedEntities = null;
        UI.toast('世界观已保存: ' + cat);
    },
    _aiGenWorld: async () => {
        const we = Modules.world_engine;
        const cat = we.worldCat;
        const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
        const existing = (document.getElementById('we-world-editor') || {}).value || '';
        let refCtx = '';
        const FB = Modules.fusion_book;
        if(FB) {
            const allPr = FB._allPipelineResults || {};
            const pr = FB._pipelineResults || {};
            const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
            if(fusion) refCtx += '\n[融合技法参考]\n' + fusion.slice(0, 1500);
        }
        await we._ensureCache();
        const relatedEntities = (we._cachedEntities || []).filter(e => !e.id.startsWith('world_')).slice(0, 15);
        if(relatedEntities.length) {
            refCtx += '\n[已有实体参考]\n' + relatedEntities.map(e => `${e.type}·${e.name}: ${(e.desc||'').slice(0,80)}`).join('\n');
        }
        const prompt = `请为小说世界观的「${catLabels[cat]}」维度生成详细设定。\n${existing ? '【已有内容(请在此基础上扩展)】\n' + existing.slice(0, 1500) : '【当前为空，请从零构建】'}\n${refCtx}\n\n要求：\n1. 内容详细、具体、有层次感\n2. 包含具体的名称、数据、细节\n3. 适合直接用于小说创作\n4. 至少500字\n5. 使用清晰的分段和标题`;
        const el = document.getElementById('we-world-editor');
        if(el) el.value = '生成中...';
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; if(el) el.value = fullRes; });
        UI.toast('AI 世界观生成完成');
    },

    // ═══ 知识图谱 3D — 核心修复: 真正的网络结构，不是孤立的点 ═══
    // 每个实体(人物/物品/地点/情节/伏笔/势力/种族/魔法/规则/文化/历史/技法)
    // 都是一个具体节点，通过关系连线交织成3D网络
    _graph3d: null,
    _graphShowLabels: true,
    _graphPhysics: true,
    _graphAutoRotate: false,
    _graphRotateTimer: null,
    _graphChapterFilter: 'all',

    _initGraph: async () => {
        const we = Modules.world_engine;
        await we._ensureCache();
        const container = document.getElementById('we-graph-canvas');
        if(!container) return;

        // 清理旧图 + 旧定时器
        if(we._graphRotateTimer) { clearInterval(we._graphRotateTimer); we._graphRotateTimer = null; }
        if(we._graph3d) { try { we._graph3d._destructor && we._graph3d._destructor(); } catch(e){} we._graph3d = null; }
        container.innerHTML = '';

        let entities = (we._cachedEntities || []).filter(e => !e.id.startsWith('world_'));

        // 章节筛选
        const chapterFilter = we._graphChapterFilter;
        if(chapterFilter && chapterFilter !== 'all') {
            entities = entities.filter(e => e.chapters && e.chapters.includes(chapterFilter));
        }

        // ★ 循环筛选 (NEXUS)
        const cycleFilter = we._graphCycleFilter;
        if(cycleFilter && cycleFilter !== 'all') {
            entities = entities.filter(e => e.cycles && e.cycles.includes(cycleFilter));
        }

        if(!entities.length) {
            const msg = (cycleFilter !== 'all') ? '当前循环暂无实体数据' : (chapterFilter !== 'all' ? '当前章节暂无实体数据' : '暂无实体数据，请先提取或创建实体');
            container.innerHTML = '<div class="flex items-center justify-center h-full text-dim text-sm">' + msg + '</div>';
            return;
        }

        const colorMap = {'人物':'#eab308','物品':'#3b82f6','地点':'#22c55e','情节':'#ef4444','伏笔':'#a855f7','势力':'#f43f5e','种族':'#f97316','魔法':'#6366f1','规则':'#0ea5e9','文化':'#ec4899','历史':'#f59e0b','技法':'#14b8a6'};

        // ★ 构建 name→entity 映射 (模糊匹配)
        const nameToEntity = {};
        entities.forEach(e => {
            nameToEntity[e.name] = e;
            // 也用小写做映射，增加匹配率
            nameToEntity[e.name.toLowerCase()] = e;
        });

        // ★ 构建边 — 核心: 从relations字段解析真正的关系
        const links = [];
        const edgeSet = new Set();

        const addLink = (sourceId, targetId, label) => {
            if(!targetId || sourceId === targetId) return;
            const key = [sourceId, targetId].sort().join('_');
            if(edgeSet.has(key)) return;
            edgeSet.add(key);
            links.push({ source: sourceId, target: targetId, label: label || '' });
        };

        // 1. 从 relations 字段解析关系 (格式: "关系类型:实体名" 或 纯 "实体名")
        entities.forEach(e => {
            if(!e.relations || !e.relations.length) return;
            e.relations.forEach(rel => {
                if(!rel || typeof rel !== 'string') return;
                let label = '', targetName = rel.trim();
                if(rel.includes(':')) {
                    const colonIdx = rel.indexOf(':');
                    label = rel.slice(0, colonIdx).trim();
                    targetName = rel.slice(colonIdx + 1).trim();
                }
                // 精确匹配
                let target = nameToEntity[targetName] || nameToEntity[targetName.toLowerCase()];
                // 模糊匹配: 如果精确匹配失败，尝试包含匹配
                if(!target) {
                    for(const ent of entities) {
                        if(ent.id === e.id) continue;
                        if(ent.name.includes(targetName) || targetName.includes(ent.name)) {
                            target = ent;
                            break;
                        }
                    }
                }
                if(target) addLink(e.id, target.id, label);
            });
        });

        // 2. 描述文本交叉引用: 如果实体A的描述中提到了实体B的名称，建立"提及"关系
        entities.forEach(a => {
            const aText = (a.desc || '') + ' ' + (a.relations || []).join(' ');
            if(!aText || aText.length < 5) return;
            entities.forEach(b => {
                if(a.id === b.id) return;
                if(b.name.length < 2) return;
                if(aText.includes(b.name)) {
                    addLink(a.id, b.id, '提及');
                }
            });
        });

        // 3. 同类型实体链式连接 (让同类型的节点聚在一起但不是孤立的)
        const typeGroups = {};
        entities.forEach(e => { if(!typeGroups[e.type]) typeGroups[e.type] = []; typeGroups[e.type].push(e); });
        Object.values(typeGroups).forEach(group => {
            if(group.length < 2 || group.length > 40) return;
            for(let i = 0; i < group.length - 1; i++) {
                addLink(group[i].id, group[i+1].id, '同类');
            }
        });

        // 计算每个节点的连接数
        const degreeMap = {};
        entities.forEach(e => { degreeMap[e.id] = 0; });
        links.forEach(l => { degreeMap[l.source] = (degreeMap[l.source]||0) + 1; degreeMap[l.target] = (degreeMap[l.target]||0) + 1; });

        // 构建节点
        const nodes = entities.map(e => {
            const deg = degreeMap[e.id] || 0;
            return {
                id: e.id,
                name: e.name,
                type: e.type || '其他',
                desc: (e.desc || '').slice(0, 150),
                val: 3 + deg * 2,
                color: colorMap[e.type] || '#888',
                degree: deg
            };
        });

        // 更新统计
        const nodesEl = document.getElementById('we-g-nodes');
        const edgesEl = document.getElementById('we-g-edges');
        if(nodesEl) nodesEl.textContent = nodes.length;
        if(edgesEl) edgesEl.textContent = links.length;
        const statsEl = document.getElementById('we-graph-stats');
        if(statsEl) statsEl.textContent = `节点: ${nodes.length} | 连线: ${links.length}`;

        // 检查 3d-force-graph 是否可用
        if(typeof ForceGraph3D === 'undefined') {
            container.innerHTML = '<div class="flex items-center justify-center h-full text-dim text-sm">3D图谱库加载中，请稍后刷新...</div>';
            return;
        }

        const width = container.clientWidth || 800;
        const height = container.clientHeight || 600;

        const Graph = ForceGraph3D()(container)
            .width(width)
            .height(height)
            .backgroundColor('#08080a')
            .graphData({ nodes, links })
            .nodeVal('val')
            .nodeColor(n => n.color)
            .nodeOpacity(0.9)
            .nodeResolution(16)
            .linkColor(link => {
                // 有明确关系的连线更亮
                if(link.label && link.label !== '同类' && link.label !== '提及') return 'rgba(255,255,255,0.25)';
                if(link.label === '提及') return 'rgba(100,200,255,0.15)';
                return 'rgba(255,255,255,0.06)';
            })
            .linkWidth(link => {
                if(link.label && link.label !== '同类' && link.label !== '提及') return 1.2;
                return 0.4;
            })
            .linkOpacity(0.6)
            .linkDirectionalParticles(link => (link.label && link.label !== '同类') ? 2 : 0)
            .linkDirectionalParticleWidth(1)
            .linkDirectionalParticleColor(() => 'rgba(255,200,100,0.6)')
            .d3AlphaDecay(0.02)
            .d3VelocityDecay(0.3)
            .warmupTicks(80)
            .cooldownTicks(200)
            .onNodeHover(node => { container.style.cursor = node ? 'pointer' : 'default'; })
            .onNodeClick(node => {
                if(!node) return;
                const distance = 120;
                const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
                Graph.cameraPosition(
                    { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
                    node, 1000
                );
                we._loadEntity(node.id);
                we.currentTab = 'dashboard';
                const ws = document.getElementById('we-workspace');
                if(ws) ws.innerHTML = we._renderWorkspace();
                we._refreshEntities();
            });

        // 标签渲染
        if(we._graphShowLabels) {
            const T = window.THREE;
            if(!T || !T.CanvasTexture) {
                Graph.nodeLabel(n => `[${n.type}] ${n.name} (${n.degree}条连线): ${n.desc || ''}`);
            } else {
                Graph.nodeThreeObject(node => {
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
                    ctx.fillStyle = node.color || '#fff';
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
            }
        } else {
            Graph.nodeLabel(n => `[${n.type}] ${n.name} (${n.degree}条连线): ${n.desc || ''}`);
        }

        we._graph3d = Graph;
        if(we._graphAutoRotate) {
            const controls = Graph.controls();
            if(controls) {
                controls.autoRotate = true;
                controls.autoRotateSpeed = 0.5;
            }
            // 如果controls不支持autoRotate，用手动旋转
            if(!controls || !controls.autoRotate) {
                we._graphRotateTimer = setInterval(() => {
                    if(!we._graph3d || !we._graphAutoRotate) {
                        clearInterval(we._graphRotateTimer);
                        we._graphRotateTimer = null;
                        return;
                    }
                    const scene = we._graph3d.scene();
                    if(scene) scene.rotation.y += 0.003;
                }, 30);
            }
        }
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
                this._graph3d.cooldownTicks(0);
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

    // ═══ 章节细化功能 ═══
    async _loadChapters() {
        const we = Modules.world_engine;
        try {
            const saved = await DB.get('settings', 'world_engine_chapters');
            if(saved && saved.chapters) {
                we._chapters = saved.chapters;
            }
        } catch(e) {
            we._chapters = [];
        }
        we._refreshChaptersList();
    },

    async _saveChapters() {
        const we = Modules.world_engine;
        await DB.put('settings', { id: 'world_engine_chapters', chapters: we._chapters });
    },

    _refreshChaptersList() {
        const we = Modules.world_engine;
        const el = document.getElementById('we-chapter-list');
        if(!el) return;
        
        if(we._chapters.length === 0) {
            el.innerHTML = '<div class="text-[10px] text-dim p-2">暂无章节，点击下方按钮添加</div>';
            return;
        }
        
        el.innerHTML = we._chapters
            .sort((a,b) => (a.number||0) - (b.number||0))
            .map((c, i) => `
                <button class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[11px] font-bold transition-all ${we._currentChapter===c.id ? 'bg-cyan-500/10 text-white border border-cyan-500/20' : 'text-dim hover:bg-white/5 border border-transparent'}" onclick="Modules.world_engine._loadChapter('${c.id}')">
                    <i class="fa-solid fa-file-lines w-4 text-center text-[10px] text-cyan-400/60"></i>
                    <span class="truncate flex-1">${c.number ? `第${c.number}章` : '章节'}: ${c.title || '未命名'}</span>
                    <span class="text-[8px] text-dim shrink-0">${c.updatedAt ? new Date(c.updatedAt).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : ''}</span>
                </button>
            `).join('');
    },

    _addChapter() {
        const we = Modules.world_engine;
        const id = Utils.uuid();
        const newChapter = {
            id,
            title: '',
            number: we._chapters.length + 1,
            outline: '',
            entities: [],
            notes: '',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        we._chapters.unshift(newChapter);
        we._currentChapter = id;
        we._loadChapter(id);
        we._saveChapters();
        UI.toast('已添加新章节');
    },

    _loadChapter(id) {
        const we = Modules.world_engine;
        const chapter = we._chapters.find(c => c.id === id);
        if(!chapter) return;
        
        we._currentChapter = id;
        
        const titleEl = document.getElementById('we-chapter-title');
        const numberEl = document.getElementById('we-chapter-number');
        const outlineEl = document.getElementById('we-chapter-outline');
        const entitiesEl = document.getElementById('we-chapter-entities');
        const notesEl = document.getElementById('we-chapter-notes');
        
        if(titleEl) titleEl.value = chapter.title || '';
        if(numberEl) numberEl.value = chapter.number || '';
        if(outlineEl) outlineEl.value = chapter.outline || '';
        if(entitiesEl) entitiesEl.value = (chapter.entities || []).join(', ');
        if(notesEl) notesEl.value = chapter.notes || '';
        
        we._refreshChapterEntityPreview(chapter.entities || []);
        we._refreshChaptersList();
    },

    _refreshChapterEntityPreview(entityNames) {
        const we = Modules.world_engine;
        const previewEl = document.getElementById('we-chapter-entity-preview');
        if(!previewEl) return;
        
        if(!entityNames || !entityNames.length) {
            previewEl.innerHTML = '<span class="text-[9px] text-dim">暂无关联实体</span>';
            return;
        }
        
        const entities = (we._cachedEntities || []).filter(e => !e.id.startsWith('world_'));
        const typeColors = {
            '人物': 'yellow', '物品': 'blue', '地点': 'green', '情节': 'red',
            '伏笔': 'purple', '势力': 'rose', '种族': 'orange', '魔法': 'indigo',
            '规则': 'sky', '文化': 'pink', '历史': 'amber', '技法': 'teal'
        };
        
        const matchedEntities = [];
        entityNames.forEach(name => {
            const found = entities.find(e => e.name === name || e.name.includes(name) || name.includes(e.name));
            if(found) matchedEntities.push(found);
        });
        
        if(!matchedEntities.length) {
            previewEl.innerHTML = entityNames.map(name => 
                `<span class="px-2 py-1 rounded text-[9px] bg-white/5 text-gray-400 border border-white/10">${name}</span>`
            ).join('');
            return;
        }
        
        previewEl.innerHTML = matchedEntities.map(e => {
            const color = typeColors[e.type] || 'gray';
            return `<span class="px-2 py-1 rounded text-[9px] bg-${color}-500/10 text-${color}-300 border border-${color}-500/20 cursor-pointer hover:bg-${color}-500/20" onclick="Modules.world_engine._loadEntity('${e.id}');Modules.world_engine.switchTab('entities')">
                <i class="fa-solid fa-circle text-[6px] mr-1"></i>${e.name}
            </span>`;
        }).join('');
    },

    async _syncChapterEntities() {
        const we = Modules.world_engine;
        if(!we._currentChapter) {
            UI.toast('请先选择一个章节');
            return;
        }
        
        const chapter = we._chapters.find(c => c.id === we._currentChapter);
        if(!chapter) return;
        
        const entitiesEl = document.getElementById('we-chapter-entities');
        const entityNames = entitiesEl ? entitiesEl.value.split(',').map(s => s.trim()).filter(Boolean) : [];
        
        if(!entityNames.length) {
            UI.toast('请先输入实体名称');
            return;
        }
        
        await we._ensureCache();
        const entities = (we._cachedEntities || []).filter(e => !e.id.startsWith('world_'));
        let syncCount = 0;
        
        for(const name of entityNames) {
            const entity = entities.find(e => e.name === name || e.name.includes(name) || name.includes(e.name));
            if(entity) {
                if(!entity.chapters) entity.chapters = [];
                if(!entity.chapters.includes(we._currentChapter)) {
                    entity.chapters.push(we._currentChapter);
                    entity.updatedAt = Date.now();
                    await DB.put('entities', entity);
                    syncCount++;
                }
            }
        }
        
        we._cachedEntities = null;
        we._refreshChapterEntityPreview(entityNames);
        UI.toast(`已同步 ${syncCount} 个实体的章节关联`);
    },

    async _saveChapter() {
        const we = Modules.world_engine;
        if(!we._currentChapter) {
            UI.toast('请先选择或创建一个章节');
            return;
        }
        
        const chapter = we._chapters.find(c => c.id === we._currentChapter);
        if(!chapter) return;
        
        const titleEl = document.getElementById('we-chapter-title');
        const numberEl = document.getElementById('we-chapter-number');
        const outlineEl = document.getElementById('we-chapter-outline');
        const entitiesEl = document.getElementById('we-chapter-entities');
        const notesEl = document.getElementById('we-chapter-notes');
        
        if(titleEl) chapter.title = titleEl.value;
        if(numberEl) chapter.number = parseInt(numberEl.value) || 0;
        if(outlineEl) chapter.outline = outlineEl.value;
        if(entitiesEl) chapter.entities = entitiesEl.value.split(',').map(s => s.trim()).filter(Boolean);
        if(notesEl) chapter.notes = notesEl.value;
        
        chapter.updatedAt = Date.now();
        
        await we._saveChapters();
        we._refreshChaptersList();
        UI.toast('章节已保存');
    },

    async _deleteChapter() {
        const we = Modules.world_engine;
        if(!we._currentChapter) {
            UI.toast('请先选择一个章节');
            return;
        }
        if(!confirm('确定删除此章节？')) return;
        
        we._chapters = we._chapters.filter(c => c.id !== we._currentChapter);
        we._currentChapter = null;
        
        const titleEl = document.getElementById('we-chapter-title');
        const numberEl = document.getElementById('we-chapter-number');
        const outlineEl = document.getElementById('we-chapter-outline');
        const entitiesEl = document.getElementById('we-chapter-entities');
        const notesEl = document.getElementById('we-chapter-notes');
        
        if(titleEl) titleEl.value = '';
        if(numberEl) numberEl.value = '';
        if(outlineEl) outlineEl.value = '';
        if(entitiesEl) entitiesEl.value = '';
        if(notesEl) notesEl.value = '';
        
        await we._saveChapters();
        we._refreshChaptersList();
        UI.toast('章节已删除');
    },

    async _clearAllChapters() {
        const we = Modules.world_engine;
        if(!confirm('确定清空所有章节？此操作不可恢复。')) return;
        
        we._chapters = [];
        we._currentChapter = null;
        
        const titleEl = document.getElementById('we-chapter-title');
        const numberEl = document.getElementById('we-chapter-number');
        const outlineEl = document.getElementById('we-chapter-outline');
        const entitiesEl = document.getElementById('we-chapter-entities');
        const notesEl = document.getElementById('we-chapter-notes');
        
        if(titleEl) titleEl.value = '';
        if(numberEl) numberEl.value = '';
        if(outlineEl) outlineEl.value = '';
        if(entitiesEl) entitiesEl.value = '';
        if(notesEl) notesEl.value = '';
        
        await we._saveChapters();
        we._refreshChaptersList();
        UI.toast('所有章节已清空');
    },

    async _aiGenChapterOutline() {
        const we = Modules.world_engine;
        if(!we._currentChapter) {
            UI.toast('请先选择或创建一个章节');
            return;
        }
        
        const chapter = we._chapters.find(c => c.id === we._currentChapter);
        if(!chapter) return;
        
        await we._ensureCache();
        const entities = (we._cachedEntities || []).filter(e => !e.id.startsWith('world_'));
        const worlds = (we._cachedEntities || []).filter(e => e.id.startsWith('world_') && e.desc);
        
        let refCtx = '';
        if(entities.length) {
            refCtx += '\n【已有实体参考】\n' + entities.slice(0, 10).map(e => `${e.type}·${e.name}: ${(e.desc||'').slice(0,80)}`).join('\n');
        }
        if(worlds.length) {
            const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
            refCtx += '\n【世界观设定参考】\n' + worlds.slice(0, 3).map(w => {
                const cat = w.id.replace('world_', '');
                return `${catLabels[cat]||cat}: ${(w.desc||'').slice(0,150)}`;
            }).join('\n');
        }
        
        const FB = Modules.fusion_book;
        if(FB) {
            const allPr = FB._allPipelineResults || {};
            const pr = FB._pipelineResults || {};
            const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
            if(fusion) refCtx += '\n【融合技法参考】\n' + fusion.slice(0, 1500);
        }
        
        const prompt = `请为以下小说章节生成详细的写作细纲：
章节标题：${chapter.title || '待定'}
章节序号：第${chapter.number || '?'}章
已有细纲：${chapter.outline || '无'}
${refCtx}

【要求】
1. 情节脉络清晰，有起承转合
2. 明确关键事件和转折点
3. 规划人物出场和互动
4. 标注情感节奏和氛围营造
5. 与世界观和已有实体相结合
6. 字数约500-800字`;

        const outlineEl = document.getElementById('we-chapter-outline');
        if(outlineEl) outlineEl.value = '生成中...';
        
        let fullRes = '';
        await AI.generate(prompt, {}, c => { 
            fullRes += c; 
            if(outlineEl) outlineEl.value = fullRes; 
        });
        
        UI.toast('AI 细纲生成完成');
    },

    async _extractChapterEntities() {
        const we = Modules.world_engine;
        if(!we._currentChapter) {
            UI.toast('请先选择一个章节');
            return;
        }
        
        const outlineEl = document.getElementById('we-chapter-outline');
        const entitiesEl = document.getElementById('we-chapter-entities');
        if(!outlineEl || !outlineEl.value) {
            UI.toast('请先填写章节细纲');
            return;
        }
        
        await we._ensureCache();
        const existingEntities = (we._cachedEntities || []).filter(e => !e.id.startsWith('world_'));
        const existingNames = existingEntities.map(e => e.name);
        
        const prompt = `请从以下章节细纲中提取涉及的实体名称，只返回实体名称列表，用逗号分隔：
【章节细纲】
${outlineEl.value}

【已有实体库（请尽可能匹配这些名称）】
${existingNames.join('、') || '无'}

只返回实体名称，用逗号分隔，不要其他内容。`;

        UI.toast('正在提取实体...');
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; });
        
        const extractedNames = fullRes.split(/[,，\n]/).map(s => s.trim()).filter(Boolean);
        if(entitiesEl) entitiesEl.value = extractedNames.join(', ');
        
        UI.toast(`已提取 ${extractedNames.length} 个实体`);
    },

    async _injectChapterToPhoenix() {
        const we = Modules.world_engine;
        if(!we._currentChapter) {
            UI.toast('请先选择一个章节');
            return;
        }
        
        const chapter = we._chapters.find(c => c.id === we._currentChapter);
        if(!chapter) return;
        
        let injectContent = `【章节细化】\n`;
        injectContent += `章节：第${chapter.number || '?'}章 ${chapter.title || '未命名'}\n\n`;
        if(chapter.outline) injectContent += `【细纲】\n${chapter.outline}\n\n`;
        if(chapter.entities && chapter.entities.length) injectContent += `【关联实体】\n${chapter.entities.join('、')}\n\n`;
        if(chapter.notes) injectContent += `【备注】\n${chapter.notes}\n\n`;
        
        if(Modules.phoenix) {
            Modules.phoenix.data = Modules.phoenix.data || {};
            Modules.phoenix.data.worldContext = (Modules.phoenix.data.worldContext || '') + '\n' + injectContent;
            UI.toast('章节已注入凤凰创作流');
        } else {
            UI.toast('凤凰创作流未加载');
        }
    },

    async _injectChapterToWriter() {
        const we = Modules.world_engine;
        if(!we._currentChapter) {
            UI.toast('请先选择一个章节');
            return;
        }
        
        const chapter = we._chapters.find(c => c.id === we._currentChapter);
        if(!chapter) return;
        
        let injectContent = `【章节细化】\n`;
        injectContent += `章节：第${chapter.number || '?'}章 ${chapter.title || '未命名'}\n\n`;
        if(chapter.outline) injectContent += `【细纲】\n${chapter.outline}\n\n`;
        if(chapter.entities && chapter.entities.length) injectContent += `【关联实体】\n${chapter.entities.join('、')}\n\n`;
        if(chapter.notes) injectContent += `【备注】\n${chapter.notes}\n\n`;
        
        const ol = document.getElementById('w-outline');
        if(ol) {
            ol.value = (ol.value ? ol.value + '\n\n' : '') + injectContent;
            UI.toast('章节已注入执笔台');
        } else {
            UI.toast('请先打开执笔台');
        }
    },

    // ═══════════════════════════════════════════════════════════════
    // 世界观导入解析系统 - 支持外部设定文件导入并解析到世界引擎
    // ═══════════════════════════════════════════════════════════════
    _importModalOpen: false,
    _importPreview: null,
    _importParsed: null,

    _openImportModal() {
        const we = Modules.world_engine;
        we._importModalOpen = true;
        we._importPreview = null;
        we._importParsed = null;
        we._renderImportModal();
    },

    _closeImportModal() {
        const we = Modules.world_engine;
        we._importModalOpen = false;
        const modal = document.getElementById('we-import-modal');
        if(modal) modal.remove();
    },

    _renderImportModal() {
        const we = Modules.world_engine;
        let modal = document.getElementById('we-import-modal');
        if(!modal) {
            modal = document.createElement('div');
            modal.id = 'we-import-modal';
            document.body.appendChild(modal);
        }
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm';
        modal.onclick = (e) => { if(e.target === modal) we._closeImportModal(); };
        modal.innerHTML = `
            <div class="bg-[#1a1a2e] rounded-2xl border border-white/10 w-[900px] max-h-[85vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex center text-white">
                            <i class="fa-solid fa-file-import text-lg"></i>
                        </div>
                        <div>
                            <div class="font-bold text-white text-base">世界观设定导入</div>
                            <div class="text-[10px] text-dim">支持导入并解析结构化世界观设定</div>
                        </div>
                    </div>
                    <button class="btn btn-sm bg-white/5 text-dim hover:text-white" onclick="Modules.world_engine._closeImportModal()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex-1 flex min-h-0 overflow-hidden">
                    <div class="w-1/2 flex flex-col border-r border-white/5">
                        <div class="px-4 py-3 border-b border-white/5 shrink-0">
                            <div class="text-[10px] text-blue-400 font-bold uppercase mb-2">导入源</div>
                            <div class="flex gap-2">
                                <label class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30 flex-1 cursor-pointer text-center">
                                    <i class="fa-solid fa-upload mr-1"></i>选择文件
                                    <input type="file" accept=".txt,.md,.json" class="hidden" onchange="Modules.world_engine._handleImportFile(this)">
                                </label>
                                <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 flex-1" onclick="Modules.world_engine._pasteFromClipboard()">
                                    <i class="fa-solid fa-paste mr-1"></i>粘贴内容
                                </button>
                            </div>
                        </div>
                        <div class="flex-1 p-4 min-h-0">
                            <textarea id="we-import-source" class="w-full h-full bg-black/30 border border-white/5 rounded-lg p-3 text-xs text-gray-300 resize-none font-mono leading-relaxed" placeholder="在此粘贴或导入世界观设定内容...

支持的格式：
═══════════════════════════════
【历史与传说】
内容...

【地理与地貌】
内容...

【魔法/科技体系】
内容...

【势力与组织】
内容...

【种族与生物】
内容...

【世界规则】
内容...

【文化与习俗】
内容...

═══════════════════════════════
或者实体格式：
[人物] 张三
描述：主角，性格...

[物品] 神剑
描述：一把上古神剑...

[地点] 青云门
描述：修仙门派...
"></textarea>
                        </div>
                        <div class="px-4 py-3 border-t border-white/5 shrink-0">
                            <button class="btn btn-sm bg-amber-600/20 text-amber-400 border-amber-600/30 w-full font-bold" onclick="Modules.world_engine._parseImportContent()">
                                <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>解析设定
                            </button>
                        </div>
                    </div>
                    <div class="w-1/2 flex flex-col">
                        <div class="px-4 py-3 border-b border-white/5 shrink-0">
                            <div class="flex items-center justify-between">
                                <div class="text-[10px] text-green-400 font-bold uppercase">解析结果预览</div>
                                <div id="we-import-stats" class="text-[9px] text-dim"></div>
                            </div>
                        </div>
                        <div class="flex-1 overflow-y-auto p-4" id="we-import-preview">
                            <div class="text-center text-dim text-xs py-8">
                                <i class="fa-solid fa-file-lines text-3xl mb-2 opacity-30"></i>
                                <p>解析结果将显示在这里</p>
                            </div>
                        </div>
                        <div class="px-4 py-3 border-t border-white/5 shrink-0 space-y-2">
                            <div class="flex gap-2">
                                <label class="flex items-center gap-2 text-[10px] text-dim cursor-pointer">
                                    <input type="checkbox" id="we-import-merge" checked class="accent-green-500">
                                    <span>合并到现有设定</span>
                                </label>
                                <label class="flex items-center gap-2 text-[10px] text-dim cursor-pointer">
                                    <input type="checkbox" id="we-import-to-vectors" checked class="accent-cyan-500">
                                    <span>同步到向量库</span>
                                </label>
                            </div>
                            <div class="flex flex-col gap-1">
                                <div class="text-[9px] text-dim font-bold">分配到章节</div>
                                <select id="we-import-chapter" class="text-[10px] bg-white/5 border border-white/10 rounded px-2 py-1 text-dim">
                                    <option value="">不分配</option>
                                    ${(we._chapters||[]).sort((a,b)=>(a.number||0)-(b.number||0)).map(c => `<option value="${c.id}">第${c.number||'?'}章: ${c.title||'未命名'}</option>`).join('')}
                                </select>
                            </div>
                            <div class="flex gap-2">
                                <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30 flex-1 font-bold" onclick="Modules.world_engine._aiParseImportContent()">
                                    <i class="fa-solid fa-brain mr-1"></i>AI智能解析
                                </button>
                            </div>
                            <button class="btn btn-sm bg-green-600/20 text-green-400 border-green-600/30 w-full font-bold" onclick="Modules.world_engine._confirmImport()">
                                <i class="fa-solid fa-check mr-1"></i>确认导入
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    async _handleImportFile(input) {
        const we = Modules.world_engine;
        const file = input.files[0];
        if(!file) return;
        
        const text = await file.text();
        const sourceEl = document.getElementById('we-import-source');
        if(sourceEl) sourceEl.value = text;
        
        UI.toast(`已加载文件: ${file.name}`);
    },

    async _pasteFromClipboard() {
        const we = Modules.world_engine;
        try {
            const text = await navigator.clipboard.readText();
            const sourceEl = document.getElementById('we-import-source');
            if(sourceEl) sourceEl.value = text;
            UI.toast('已粘贴剪贴板内容');
        } catch(e) {
            UI.toast('无法访问剪贴板');
        }
    },

    async _parseImportContent() {
        const we = Modules.world_engine;
        const sourceEl = document.getElementById('we-import-source');
        if(!sourceEl || !sourceEl.value.trim()) {
            UI.toast('请先输入或导入内容');
            return;
        }
        
        const content = sourceEl.value;
        const parsed = we._parseWorldSetting(content);
        we._importParsed = parsed;
        
        const previewEl = document.getElementById('we-import-preview');
        const statsEl = document.getElementById('we-import-stats');
        
        if(!parsed.worldViews.length && !parsed.entities.length) {
            if(previewEl) previewEl.innerHTML = `
                <div class="text-center text-amber-400 text-xs py-8">
                    <i class="fa-solid fa-exclamation-triangle text-3xl mb-2"></i>
                    <p>未能识别出结构化内容</p>
                    <p class="text-dim mt-1">请检查格式是否符合要求</p>
                </div>`;
            return;
        }
        
        let statsText = [];
        if(parsed.worldViews.length) statsText.push(`世界观: ${parsed.worldViews.length}项`);
        if(parsed.entities.length) statsText.push(`实体: ${parsed.entities.length}个`);
        if(statsEl) statsEl.textContent = statsText.join(' | ');
        
        let html = '';
        
        if(parsed.worldViews.length) {
            html += `<div class="mb-4">
                <div class="text-[10px] text-blue-400 font-bold uppercase mb-2"><i class="fa-solid fa-earth-americas mr-1"></i>世界观设定</div>
                <div class="space-y-2">`;
            parsed.worldViews.forEach(w => {
                html += `<div class="p-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <div class="text-[11px] font-bold text-blue-300 mb-1">${w.label}</div>
                    <div class="text-[10px] text-dim leading-relaxed max-h-20 overflow-hidden">${w.content.slice(0, 200)}${w.content.length > 200 ? '...' : ''}</div>
                </div>`;
            });
            html += `</div></div>`;
        }
        
        if(parsed.entities.length) {
            const typeColors = {
                '人物': 'yellow', '物品': 'blue', '地点': 'green', '情节': 'red',
                '伏笔': 'purple', '势力': 'rose', '种族': 'orange', '魔法': 'indigo',
                '规则': 'sky', '文化': 'pink', '历史': 'amber', '技法': 'teal'
            };
            const grouped = {};
            parsed.entities.forEach(e => {
                const t = e.type || '其他';
                if(!grouped[t]) grouped[t] = [];
                grouped[t].push(e);
            });
            
            html += `<div>
                <div class="text-[10px] text-amber-400 font-bold uppercase mb-2"><i class="fa-solid fa-boxes-stacked mr-1"></i>实体提取</div>
                <div class="space-y-2">`;
            for(const [type, items] of Object.entries(grouped)) {
                const color = typeColors[type] || 'gray';
                html += `<div class="p-2 rounded-lg bg-${color}-500/5 border border-${color}-500/10">
                    <div class="text-[10px] font-bold text-${color}-300 mb-1">${type} (${items.length})</div>
                    <div class="flex flex-wrap gap-1">
                        ${items.map(e => `<span class="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-gray-300">${e.name}</span>`).join('')}
                    </div>
                </div>`;
            }
            html += `</div></div>`;
        }
        
        if(previewEl) previewEl.innerHTML = html;
        UI.toast('解析完成');
    },

    _parseWorldSetting(content) {
        const we = Modules.world_engine;
        const result = { worldViews: [], entities: [] };
        
        const catPatterns = [
            { id: 'history', patterns: ['历史与传说', '历史', '传说', '历史背景', '历史设定'] },
            { id: 'geography', patterns: ['地理与地貌', '地理', '地貌', '世界地图', '地理设定'] },
            { id: 'magic', patterns: ['魔法/科技体系', '魔法体系', '科技体系', '魔法', '功法体系', '修炼体系'] },
            { id: 'factions', patterns: ['势力与组织', '势力', '组织', '门派', '势力设定'] },
            { id: 'species', patterns: ['种族与生物', '种族', '生物', '种族设定'] },
            { id: 'rules', patterns: ['世界规则', '规则', '法则', '世界法则'] },
            { id: 'culture', patterns: ['文化与习俗', '文化', '习俗', '风俗'] }
        ];
        
        const catLabels = {
            history: '历史与传说', geography: '地理与地貌', magic: '魔法/科技体系',
            factions: '势力与组织', species: '种族与生物', rules: '世界规则', culture: '文化与习俗'
        };
        
        for(const cat of catPatterns) {
            for(const pattern of cat.patterns) {
                const regex = new RegExp(`[【\\[]${pattern}[】\\]][\\s\\S]*?(?=[【\\[](?:${catPatterns.flatMap(c => c.patterns).join('|')})[】\\]]|$)`, 'gi');
                const match = content.match(regex);
                if(match) {
                    let text = match[0].replace(new RegExp(`[【\\[]${pattern}[】\\]]`, 'i'), '').trim();
                    if(text && text.length > 10) {
                        result.worldViews.push({
                            id: cat.id,
                            label: catLabels[cat.id],
                            content: text
                        });
                        break;
                    }
                }
            }
        }
        
        const entityPatterns = [
            { type: '人物', patterns: ['人物', '角色', '人物设定', '角色设定'] },
            { type: '物品', patterns: ['物品', '道具', '装备', '物品设定'] },
            { type: '地点', patterns: ['地点', '场景', '地点设定', '场景设定'] },
            { type: '情节', patterns: ['情节', '剧情', '情节设定'] },
            { type: '伏笔', patterns: ['伏笔', '伏笔设定'] },
            { type: '势力', patterns: ['势力', '组织', '门派'] },
            { type: '种族', patterns: ['种族', '种族设定'] },
            { type: '魔法', patterns: ['魔法', '功法', '技能', '法术'] },
            { type: '规则', patterns: ['规则', '法则'] },
            { type: '文化', patterns: ['文化', '习俗'] },
            { type: '历史', patterns: ['历史事件', '历史记录'] },
            { type: '技法', patterns: ['技法', '写作技法'] }
        ];
        
        const entityRegex = /(?:^|\n)[【\[]?([^\n【\】\[\]]+)[】\]]?\s*[\n:：]\s*([\s\S]*?)(?=(?:^|\n)[【\[]?[^\n【\】\[\]]+[】\]]?\s*[\n:：]|$)/g;
        let entityMatch;
        while((entityMatch = entityRegex.exec(content)) !== null) {
            const name = entityMatch[1].trim();
            const desc = entityMatch[2].trim();
            
            if(name.length > 20 || desc.length < 5) continue;
            
            let type = '其他';
            for(const ep of entityPatterns) {
                for(const p of ep.patterns) {
                    if(name.includes(p) || content.slice(entityMatch.index - 50, entityMatch.index).includes(p)) {
                        type = ep.type;
                        break;
                    }
                }
                if(type !== '其他') break;
            }
            
            if(desc.length > 10) {
                result.entities.push({
                    id: Utils.uuid(),
                    name: name.replace(/^[【\[]?([^】\]]+)[】\]]?$/, '$1'),
                    type,
                    desc,
                    relations: [],
                    source: 'import',
                    createdAt: Date.now()
                });
            }
        }
        
        const simpleEntityRegex = /(?:^|\n)\[([^\]]+)\]\s*([^\n]+)/g;
        let simpleMatch;
        while((simpleMatch = simpleEntityRegex.exec(content)) !== null) {
            const typeStr = simpleMatch[1].trim();
            const rest = simpleMatch[2].trim();
            
            let type = '其他';
            for(const ep of entityPatterns) {
                if(ep.patterns.some(p => typeStr.includes(p))) {
                    type = ep.type;
                    break;
                }
            }
            
            const nameDesc = rest.split(/[:：]/);
            const name = nameDesc[0].trim();
            const desc = nameDesc.slice(1).join(':').trim() || rest;
            
            if(name.length > 0 && name.length < 30 && !result.entities.find(e => e.name === name)) {
                result.entities.push({
                    id: Utils.uuid(),
                    name,
                    type,
                    desc,
                    relations: [],
                    source: 'import',
                    createdAt: Date.now()
                });
            }
        }
        
        return result;
    },

    async _confirmImport() {
        const we = Modules.world_engine;
        if(!we._importParsed || (!we._importParsed.worldViews.length && !we._importParsed.entities.length)) {
            UI.toast('没有可导入的内容');
            return;
        }
        
        const mergeEl = document.getElementById('we-import-merge');
        const toVectorsEl = document.getElementById('we-import-to-vectors');
        const chapterEl = document.getElementById('we-import-chapter');
        const shouldMerge = mergeEl ? mergeEl.checked : true;
        const toVectors = toVectorsEl ? toVectorsEl.checked : true;
        const assignChapter = chapterEl ? chapterEl.value : '';
        
        await we._ensureCache();
        
        let worldCount = 0;
        let entityCount = 0;
        
        for(const wv of we._importParsed.worldViews) {
            const existingId = `world_${wv.id}`;
            if(shouldMerge) {
                const existing = we._cachedEntities.find(e => e.id === existingId);
                if(existing) {
                    existing.desc = (existing.desc || '') + '\n\n' + wv.content;
                    existing.updatedAt = Date.now();
                    await DB.put('entities', existing);
                    worldCount++;
                    continue;
                }
            }
            
            const worldEntity = {
                id: existingId,
                name: wv.label,
                type: '世界观',
                desc: wv.content,
                relations: [],
                chapters: assignChapter ? [assignChapter] : [],
                source: 'import',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            we._cachedEntities.push(worldEntity);
            await DB.put('entities', worldEntity);
            worldCount++;
        }
        
        for(const ent of we._importParsed.entities) {
            if(shouldMerge) {
                const existing = we._cachedEntities.find(e => e.name === ent.name && !e.id.startsWith('world_'));
                if(existing) {
                    existing.desc = (existing.desc || '') + '\n\n' + ent.desc;
                    existing.updatedAt = Date.now();
                    if(assignChapter) {
                        if(!existing.chapters) existing.chapters = [];
                        if(!existing.chapters.includes(assignChapter)) existing.chapters.push(assignChapter);
                    }
                    await DB.put('entities', existing);
                    entityCount++;
                    continue;
                }
            }
            
            if(assignChapter) {
                ent.chapters = [assignChapter];
            }
            we._cachedEntities.push(ent);
            await DB.put('entities', ent);
            entityCount++;
        }
        
        if(toVectors && typeof Modules.rag !== 'undefined') {
            for(const ent of we._importParsed.entities) {
                try {
                    await Modules.rag.addVector(ent.name + ': ' + ent.desc, { type: ent.type, source: 'world_import' });
                } catch(e) {}
            }
        }
        
        we._closeImportModal();
        we._refreshEntities();
        
        UI.toast(`导入完成: ${worldCount}项世界观, ${entityCount}个实体` + (assignChapter ? ' (已分配章节)' : ''));
    },

    async _aiParseImportContent() {
        const we = Modules.world_engine;
        const sourceEl = document.getElementById('we-import-source');
        if(!sourceEl || !sourceEl.value.trim()) {
            UI.toast('请先输入或导入内容');
            return;
        }
        
        const content = sourceEl.value;
        UI.toast('AI智能解析中...');
        
        await we._ensureCache();
        const existingEntities = (we._cachedEntities || []).filter(e => !e.id.startsWith('world_'));
        const existingNames = existingEntities.map(e => e.name);
        
        const prompt = `你是一个专业的小说世界观解析引擎。请从以下内容中提取结构化的世界观设定和实体。

【原始内容】
${content.slice(0, 8000)}

【已有实体库（请尽可能匹配这些名称建立关联）】
${existingNames.join('、') || '无'}

【提取要求】
请提取以下内容：

1. 世界观设定（7个维度）：
   - history (历史与传说)
   - geography (地理与地貌)
   - magic (魔法/科技体系)
   - factions (势力与组织)
   - species (种族与生物)
   - rules (世界规则)
   - culture (文化与习俗)

2. 实体（12种类型）：
   - 人物、物品、地点、情节、伏笔、势力、种族、魔法、规则、文化、历史、技法

【输出格式】严格JSON：
{
  "worldViews": [
    {"id": "history", "label": "历史与传说", "content": "详细内容..."}
  ],
  "entities": [
    {"name": "实体名", "type": "类型", "desc": "详细描述(100-300字)", "relations": ["关系类型:关联实体名"]}
  ]
}

【关键要求】
- 每个实体的relations必须尽可能多地引用其他实体名称
- 关系类型例如：师父、徒弟、敌对、盟友、所属、位于、拥有、使用等
- 直接输出JSON，不要包裹markdown代码块`;

        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; });
        
        let parsed = null;
        try {
            let cleanRes = fullRes.trim();
            cleanRes = cleanRes.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
            const s = cleanRes.indexOf('{');
            const e = cleanRes.lastIndexOf('}');
            if(s !== -1 && e > s) {
                parsed = JSON.parse(cleanRes.slice(s, e + 1));
            }
        } catch(e) {
            UI.toast('AI解析失败，请检查内容格式');
            return;
        }
        
        if(!parsed || (!parsed.worldViews?.length && !parsed.entities?.length)) {
            UI.toast('未能解析出有效内容');
            return;
        }
        
        // 标准化数据
        const result = {
            worldViews: (parsed.worldViews || []).map(w => ({
                id: w.id || 'other',
                label: w.label || w.id || '其他',
                content: w.content || ''
            })),
            entities: (parsed.entities || []).map(e => ({
                id: Utils.uuid(),
                name: e.name || '',
                type: e.type || '其他',
                desc: e.desc || e.description || '',
                relations: e.relations || [],
                source: 'import',
                createdAt: Date.now()
            }))
        };
        
        we._importParsed = result;
        
        const previewEl = document.getElementById('we-import-preview');
        const statsEl = document.getElementById('we-import-stats');
        
        let statsText = [];
        if(result.worldViews.length) statsText.push(`世界观: ${result.worldViews.length}项`);
        if(result.entities.length) statsText.push(`实体: ${result.entities.length}个`);
        if(statsEl) statsEl.textContent = statsText.join(' | ');
        
        let html = '';
        
        if(result.worldViews.length) {
            html += `<div class="mb-4">
                <div class="text-[10px] text-blue-400 font-bold uppercase mb-2"><i class="fa-solid fa-earth-americas mr-1"></i>世界观设定</div>
                <div class="space-y-2">`;
            result.worldViews.forEach(w => {
                html += `<div class="p-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <div class="text-[11px] font-bold text-blue-300 mb-1">${w.label}</div>
                    <div class="text-[10px] text-dim leading-relaxed max-h-20 overflow-hidden">${w.content.slice(0, 200)}${w.content.length > 200 ? '...' : ''}</div>
                </div>`;
            });
            html += `</div></div>`;
        }
        
        if(result.entities.length) {
            const typeColors = {
                '人物': 'yellow', '物品': 'blue', '地点': 'green', '情节': 'red',
                '伏笔': 'purple', '势力': 'rose', '种族': 'orange', '魔法': 'indigo',
                '规则': 'sky', '文化': 'pink', '历史': 'amber', '技法': 'teal'
            };
            const grouped = {};
            result.entities.forEach(e => {
                const t = e.type || '其他';
                if(!grouped[t]) grouped[t] = [];
                grouped[t].push(e);
            });
            
            html += `<div>
                <div class="text-[10px] text-amber-400 font-bold uppercase mb-2"><i class="fa-solid fa-boxes-stacked mr-1"></i>实体提取</div>
                <div class="space-y-2">`;
            for(const [type, items] of Object.entries(grouped)) {
                const color = typeColors[type] || 'gray';
                html += `<div class="p-2 rounded-lg bg-${color}-500/5 border border-${color}-500/10">
                    <div class="text-[10px] font-bold text-${color}-300 mb-1">${type} (${items.length})</div>
                    <div class="flex flex-wrap gap-1">
                        ${items.map(e => `<span class="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-gray-300">${e.name}</span>`).join('')}
                    </div>
                </div>`;
            }
            html += `</div></div>`;
        }
        
        if(previewEl) previewEl.innerHTML = html;
        UI.toast('AI智能解析完成');
    },

    // ═══════════════════════════════════════════════════════════════
    //  作品导入中心 — 外部已有小说导入 + 双向同步桥
    // ═══════════════════════════════════════════════════════════════

    _novelImportModalOpen: false,
    _novelImportText: '',
    _novelImportParsed: null,

    _openNovelImportModal() {
        const we = Modules.world_engine;
        we._novelImportModalOpen = true;
        we._novelImportText = '';
        we._novelImportParsed = null;
        we._renderNovelImportModal();
    },

    _closeNovelImportModal() {
        const we = Modules.world_engine;
        we._novelImportModalOpen = false;
        const modal = document.getElementById('we-novel-import-modal');
        if(modal) modal.remove();
    },

    _renderNovelImportModal() {
        const we = Modules.world_engine;
        let modal = document.getElementById('we-novel-import-modal');
        if(!modal) {
            modal = document.createElement('div');
            modal.id = 'we-novel-import-modal';
            document.body.appendChild(modal);
        }
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm';
        modal.onclick = (e) => { if(e.target === modal) we._closeNovelImportModal(); };

        const hasParsed = we._novelImportParsed && (we._novelImportParsed.volumes?.length || we._novelImportParsed.entities?.length);

        modal.innerHTML = `
            <div class="bg-[#1a1a2e] rounded-2xl border border-white/10 w-[960px] max-h-[90vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex center text-white">
                            <i class="fa-solid fa-book text-lg"></i>
                        </div>
                        <div>
                            <div class="font-bold text-white text-base">📥 导入已有作品</div>
                            <div class="text-[10px] text-dim">粘贴或上传已有小说全文，AI自动解析卷章结构、世界观与实体</div>
                        </div>
                    </div>
                    <button class="btn btn-sm bg-white/5 text-dim hover:text-white" onclick="Modules.world_engine._closeNovelImportModal()">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="flex-1 flex min-h-0 overflow-hidden">
                    <!-- 左侧面板：输入源 -->
                    <div class="w-[45%] flex flex-col border-r border-white/5">
                        <div class="px-4 py-3 border-b border-white/5 shrink-0">
                            <div class="text-[10px] text-amber-400 font-bold uppercase mb-2">导入源</div>
                            <div class="flex gap-2">
                                <label class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 flex-1 cursor-pointer text-center">
                                    <i class="fa-solid fa-upload mr-1"></i>选择文件
                                    <input type="file" accept=".txt,.md" class="hidden" onchange="Modules.world_engine._handleNovelImportFile(this)">
                                </label>
                                <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 flex-1" onclick="Modules.world_engine._pasteNovelFromClipboard()">
                                    <i class="fa-solid fa-paste mr-1"></i>粘贴内容
                                </button>
                            </div>
                        </div>
                        <div class="flex-1 p-4 min-h-0">
                            <textarea id="we-novel-import-source" class="w-full h-full bg-black/30 border border-white/5 rounded-lg p-3 text-xs text-gray-300 resize-none font-mono leading-relaxed" placeholder="在此粘贴或导入已有小说全文...&#10;&#10;支持自动识别以下分章格式：&#10;• 第1章 标题&#10;• 第一章 标题&#10;• ### 标题&#10;• ## 第一卷&#10;&#10;导入后AI将自动：&#10;1. 解析卷/章结构&#10;2. 提取世界观7维设定&#10;3. 提取角色/物品/地点等实体&#10;4. 构建循环(cycle)数据&#10;5. 同步到执笔台与世界引擎"></textarea>
                        </div>
                        <div class="px-4 py-3 border-t border-white/5 shrink-0 space-y-2">
                            <div class="flex gap-2">
                                <label class="flex items-center gap-2 text-[10px] text-dim cursor-pointer">
                                    <input type="checkbox" id="we-novel-import-merge" class="accent-amber-500">
                                    <span>合并到现有作品（不勾选则清空重建）</span>
                                </label>
                            </div>
                            <div class="flex gap-2">
                                <label class="flex items-center gap-2 text-[10px] text-dim cursor-pointer">
                                    <input type="checkbox" id="we-novel-import-extract-entities" checked class="accent-green-500">
                                    <span>自动提取实体</span>
                                </label>
                                <label class="flex items-center gap-2 text-[10px] text-dim cursor-pointer">
                                    <input type="checkbox" id="we-novel-import-build-cycles" checked class="accent-cyan-500">
                                    <span>构建循环</span>
                                </label>
                            </div>
                            <button class="btn btn-sm bg-gradient-to-r from-amber-600/20 to-orange-600/20 text-amber-400 border border-amber-500/30 w-full font-bold" onclick="Modules.world_engine._startNovelImport()">
                                <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>AI 智能解析并导入
                            </button>
                        </div>
                    </div>
                    <!-- 右侧面板：解析结果预览 -->
                    <div class="w-[55%] flex flex-col">
                        <div class="px-4 py-3 border-b border-white/5 shrink-0">
                            <div class="flex items-center justify-between">
                                <div class="text-[10px] text-green-400 font-bold uppercase">解析结果预览</div>
                                <div id="we-novel-import-stats" class="text-[9px] text-dim">${hasParsed ? we._novelImportParsed.volumes.length + ' 卷 / ' + we._novelImportParsed.chapters.length + ' 章 / ' + we._novelImportParsed.entities.length + ' 实体' : '等待解析'}</div>
                            </div>
                        </div>
                        <div class="flex-1 overflow-y-auto p-4" id="we-novel-import-preview">
                            ${hasParsed ? we._renderNovelImportPreview() : `
                            <div class="text-center text-dim text-xs py-12">
                                <i class="fa-solid fa-book-open text-4xl mb-3 opacity-30"></i>
                                <p>解析结果将显示在这里</p>
                                <p class="text-[10px] mt-1 opacity-50">AI将自动识别卷章结构、提取世界观与实体</p>
                            </div>`}
                        </div>
                        <div class="px-4 py-3 border-t border-white/5 shrink-0">
                            <button class="btn btn-sm bg-green-600/20 text-green-400 border-green-600/30 w-full font-bold" onclick="Modules.world_engine._confirmNovelImport()" ${!hasParsed ? 'disabled style="opacity:0.4"' : ''}>
                                <i class="fa-solid fa-check mr-1"></i>确认导入到数据库
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    _renderNovelImportPreview() {
        const p = Modules.world_engine._novelImportParsed;
        if(!p) return '';
        let html = '<div class="space-y-3 text-xs">';
        // 卷/章概览
        if(p.volumes?.length) {
            html += `<div class="p-2 rounded bg-amber-500/5 border border-amber-500/10">
                <div class="text-[10px] font-bold text-amber-400 mb-1">📚 卷章结构 (${p.volumes.length}卷 / ${p.chapters?.length||0}章)</div>`;
            p.volumes.forEach(v => {
                const vchaps = p.chapters?.filter(c => c.volumeId === v.id) || [];
                html += `<div class="ml-2 mb-1"><span class="text-white font-bold">${v.title}</span> <span class="text-dim">(${vchaps.length}章)</span></div>`;
                vchaps.slice(0, 3).forEach(c => {
                    html += `<div class="ml-4 text-[10px] text-gray-400 truncate">• ${c.title}</div>`;
                });
                if(vchaps.length > 3) html += `<div class="ml-4 text-[10px] text-dim">...还有${vchaps.length - 3}章</div>`;
            });
            html += '</div>';
        }
        // 世界观
        if(p.worldview && Object.keys(p.worldview).some(k => p.worldview[k])) {
            html += `<div class="p-2 rounded bg-blue-500/5 border border-blue-500/10">
                <div class="text-[10px] font-bold text-blue-400 mb-1">🌍 世界观设定</div>`;
            const wvLabels = {history:'历史', geography:'地理', magic:'魔法', factions:'势力', species:'种族', rules:'规则', culture:'文化'};
            Object.entries(p.worldview).forEach(([k, v]) => {
                if(v) html += `<div class="ml-2 text-[10px] text-gray-400"><span class="text-blue-300">${wvLabels[k]||k}:</span> ${String(v).slice(0,80)}${String(v).length>80?'...':''}</div>`;
            });
            html += '</div>';
        }
        // 实体
        if(p.entities?.length) {
            const grouped = {};
            p.entities.forEach(e => { grouped[e.type] = (grouped[e.type]||[]).concat(e); });
            html += `<div class="p-2 rounded bg-purple-500/5 border border-purple-500/10">
                <div class="text-[10px] font-bold text-purple-400 mb-1">🎭 实体库 (${p.entities.length}个)</div>
                <div class="flex flex-wrap gap-1">`;
            Object.entries(grouped).forEach(([type, items]) => {
                html += `<span class="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-gray-300">${type}:${items.length}</span>`;
            });
            html += '</div></div>';
        }
        html += '</div>';
        return html;
    },

    async _handleNovelImportFile(input) {
        const file = input.files[0];
        if(!file) return;
        const text = await file.text();
        const sourceEl = document.getElementById('we-novel-import-source');
        if(sourceEl) sourceEl.value = text;
        UI.toast(`已加载文件: ${file.name} (${text.length.toLocaleString()}字)`);
    },

    async _pasteNovelFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            const sourceEl = document.getElementById('we-novel-import-source');
            if(sourceEl) sourceEl.value = text;
            UI.toast(`已粘贴剪贴板内容 (${text.length.toLocaleString()}字)`);
        } catch(e) { UI.toast('无法访问剪贴板'); }
    },

    async _startNovelImport() {
        const we = Modules.world_engine;
        const sourceEl = document.getElementById('we-novel-import-source');
        if(!sourceEl || !sourceEl.value.trim()) { UI.toast('请先输入或导入小说内容'); return; }

        const text = sourceEl.value.trim();
        const merge = document.getElementById('we-novel-import-merge')?.checked;

        // 超长文本分块保护
        const MAX_CHARS_PER_CHUNK = 8000;
        let chunks = [];
        if(text.length <= MAX_CHARS_PER_CHUNK * 1.5) {
            chunks = [text];
        } else {
            // 按段落分块，尽量保持章节完整
            const paras = text.split(/\n{2,}/);
            let cur = '';
            for(const p of paras) {
                if(cur.length + p.length > MAX_CHARS_PER_CHUNK && cur.length > 1000) {
                    chunks.push(cur);
                    cur = p;
                } else {
                    cur += '\n\n' + p;
                }
            }
            if(cur) chunks.push(cur);
        }

        UI.toast(`开始解析，共 ${chunks.length} 个文本块...`);
        App.showProgress('AI解析小说结构', 0, chunks.length);

        try {
            // Step 1: 解析结构（用第一个chunk估计整体结构，如果有多个chunk则综合）
            const structure = await we._parseNovelStructure(text, chunks);
            App.showProgress('AI解析小说结构', 1, 3);

            // Step 2: 提取世界观与实体
            const extractEntities = document.getElementById('we-novel-import-extract-entities')?.checked !== false;
            let entities = [], worldview = {};
            if(extractEntities) {
                const extracted = await we._parseNovelEntities(text, structure.chapters);
                entities = extracted.entities || [];
                worldview = extracted.worldview || {};
                App.showProgress('提取实体与世界观', 2, 3);
            }

            // Step 3: 组装结果
            we._novelImportParsed = {
                volumes: structure.volumes || [],
                chapters: structure.chapters || [],
                entities,
                worldview,
                sourceText: text.slice(0, 500) + '...',
                importedAt: Date.now()
            };

            we._renderNovelImportModal();
            UI.toast(`解析完成: ${structure.volumes?.length||0}卷 / ${structure.chapters?.length||0}章 / ${entities.length}实体`, 'success');
        } catch(e) {
            console.error('小说导入解析失败:', e);
            UI.toast('解析失败: ' + e.message, 'error');
        } finally {
            App.hideProgress();
        }
    },

    async _parseNovelStructure(fullText, chunks) {
        // 先尝试规则分章（无需AI）
        const lines = fullText.split('\n');
        const volumes = [];
        const chapters = [];
        let currentVol = null;
        let currentChap = null;
        let chapOrder = 1;
        let volOrder = 1;
        let chapContentLines = [];

        // 分章正则：支持 "第1章" "第一章" "第1回" "Chapter 1" "### 标题" 等
        const chapRegex = /^(?:第[一二三四五六七八九十百千零\d]+[章回节]|Chapter\s+\d+[\.:\s]|\#{2,3}\s+)(.+)?$/i;
        const volRegex = /^(?:第[一二三四五六七八九十百千零\d]+[卷部篇]|Volume\s+\d+[\.:\s]|\#{2}\s+)(.+)?$/i;

        for(let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if(!line) continue;

            const volMatch = line.match(volRegex);
            const chapMatch = line.match(chapRegex);

            if(volMatch && !chapMatch) {
                // 保存上一章内容
                if(currentChap) {
                    currentChap.content = chapContentLines.join('\n').trim();
                    chapters.push(currentChap);
                    chapContentLines = [];
                }
                const volTitle = volMatch[1] ? volMatch[1].trim() : line;
                currentVol = { id: Utils.uuid(), title: volTitle, order: volOrder++ };
                volumes.push(currentVol);
            } else if(chapMatch) {
                // 保存上一章内容
                if(currentChap) {
                    currentChap.content = chapContentLines.join('\n').trim();
                    chapters.push(currentChap);
                    chapContentLines = [];
                }
                const chapTitle = chapMatch[1] ? chapMatch[1].trim() : line;
                currentChap = {
                    id: Utils.uuid(),
                    title: chapTitle,
                    order: chapOrder++,
                    volumeId: currentVol ? currentVol.id : null,
                    content: ''
                };
            } else if(currentChap) {
                chapContentLines.push(line);
            }
        }
        // 保存最后一章
        if(currentChap) {
            currentChap.content = chapContentLines.join('\n').trim();
            chapters.push(currentChap);
        }

        // 如果没有规则分章成功，尝试AI解析
        if(chapters.length === 0) {
            const sample = fullText.slice(0, Math.min(fullText.length, 12000));
            const prompt = `你是NEXUS OS v2.0小说结构解析引擎。请分析以下小说文本，识别其卷/章结构。\n\n要求输出严格JSON（不要markdown代码块，不要额外文字）：\n{\n  "volumes": [{"title":"卷名","order":1}],\n  "chapters": [{"title":"章名","order":1,"volumeOrder":1}]\n}\n\n规则：\n1. 如果没有明显的卷，则 volumes 留空数组，所有章的 volumeOrder 为 1\n2. 章按自然顺序编号\n3. 只输出能明确识别的章节标题\n\n文本开头（前12000字）：\n${sample}`;

            let raw = '';
            try {
                await AI.generate(prompt, (chunk) => { raw += chunk; }, { max_tokens: 2000, temperature: 0.1 });
                const json = (() => { try { const m = raw.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; } catch(e) { return null; } })();
                if(json) {
                    if(json.volumes?.length) {
                        json.volumes.forEach((v, i) => { v.id = Utils.uuid(); v.order = i + 1; });
                        volumes.push(...json.volumes);
                    }
                    if(json.chapters?.length) {
                        json.chapters.forEach((c, i) => {
                            const vol = volumes.find(v => v.order === (c.volumeOrder || 1));
                            chapters.push({
                                id: Utils.uuid(), title: c.title, order: i + 1,
                                volumeId: vol ? vol.id : null, content: ''
                            });
                        });
                    }
                }
            } catch(e) { console.warn('AI结构解析失败，尝试段落分章:', e); }
        }

        // 仍然没有章节？按段落 fallback
        if(chapters.length === 0) {
            const paras = fullText.split(/\n{2,}/).filter(p => p.trim().length > 50);
            const volId = Utils.uuid();
            volumes.push({ id: volId, title: '导入作品', order: 1 });
            paras.forEach((p, i) => {
                chapters.push({
                    id: Utils.uuid(), title: `第${i+1}章`, order: i+1,
                    volumeId: volId, content: p.trim()
                });
            });
        }

        // 为每章填充内容（按规则分章时已有，AI分章时需要从原文提取）
        if(chapters.every(c => !c.content)) {
            // 简单按字数均分原文
            const avgLen = Math.floor(fullText.length / chapters.length);
            chapters.forEach((c, i) => {
                const start = i * avgLen;
                const end = (i === chapters.length - 1) ? fullText.length : (i + 1) * avgLen;
                c.content = fullText.slice(start, end).trim();
            });
        }

        return { volumes, chapters };
    },

    async _parseNovelEntities(fullText, chapters) {
        // 抽取代表性样本（前3章+中1章+后1章）用于实体提取
        const sampleChaps = [];
        if(chapters.length > 0) sampleChaps.push(chapters[0]);
        if(chapters.length > 2) sampleChaps.push(chapters[Math.floor(chapters.length/2)]);
        if(chapters.length > 1) sampleChaps.push(chapters[chapters.length-1]);

        const sampleText = sampleChaps.map(c => `【${c.title}】\n${(c.content||'').slice(0, 3000)}`).join('\n\n---\n\n');

        const prompt = `你是NEXUS OS v2.0实体提取引擎。请分析以下小说片段，提取世界观设定和关键实体。\n\n要求输出严格JSON（不要markdown代码块，不要额外文字）：\n{\n  "worldview": {\n    "history":"历史与传说（100-300字）",\n    "geography":"地理与地貌（100-300字）",\n    "magic":"魔法/科技体系（100-300字）",\n    "factions":"势力与组织（100-300字）",\n    "species":"种族与生物（100-300字）",\n    "rules":"世界规则（100-300字）",\n    "culture":"文化与习俗（100-300字）"\n  },\n  "entities": [\n    {"name":"名称", "type":"人物|物品|地点|势力|魔法|规则|种族|文化|历史|情节|伏笔|技法", "desc":"描述（50-200字）", "relations":["关系类型:关联名称"]}\n  ]\n}\n\n规则：\n1. worldview 的每个维度如果没有相关内容则留空字符串""\n2. entities 最多提取30个最关键实体，优先主角、重要配角、核心物品、关键地点\n3. type 必须从给定的12种中选\n4. relations 可选，表示与其他实体的关系\n\n小说片段：\n${sampleText.slice(0, 10000)}`;

        let raw = '';
        try {
            await AI.generate(prompt, (chunk) => { raw += chunk; }, { max_tokens: 4000, temperature: 0.2 });
            const json = (() => { try { const m = raw.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; } catch(e) { return null; } })();
            if(json) {
                // 标准化实体
                const entities = (json.entities || []).map(e => ({
                    id: 'import_' + Utils.uuid(),
                    name: e.name || '未命名',
                    type: e.type || '人物',
                    desc: e.desc || '',
                    relations: e.relations || [],
                    chapters: [],
                    cycles: [],
                    source: 'import',
                    updatedAt: Date.now()
                }));
                return { entities, worldview: json.worldview || {} };
            }
        } catch(e) { console.warn('AI实体提取失败:', e); }
        return { entities: [], worldview: {} };
    },

    async _confirmNovelImport() {
        const we = Modules.world_engine;
        const data = we._novelImportParsed;
        if(!data || !data.chapters?.length) { UI.toast('没有可导入的数据'); return; }

        const merge = document.getElementById('we-novel-import-merge')?.checked;
        const buildCycles = document.getElementById('we-novel-import-build-cycles')?.checked !== false;

        // 如果不合并，先确认是否清空
        if(!merge) {
            const existing = await DB.getAll('chapters');
            if(existing.length > 0) {
                if(!confirm(`当前已有 ${existing.length} 个章节，导入将清空重建。确定继续？`)) return;
                // 清空相关数据
                for(const v of await DB.getAll('volumes')) await DB.del('volumes', v.id);
                for(const c of existing) await DB.del('chapters', c.id);
            }
        }

        App.showProgress('写入数据库', 0, data.chapters.length + data.entities.length + 5);

        try {
            // 1. 写入卷
            let progress = 0;
            for(const v of data.volumes) {
                await DB._rawPut('volumes', v);
                App.showProgress('写入数据库', ++progress, data.chapters.length + data.entities.length + 5);
            }

            // 2. 写入章节
            for(const c of data.chapters) {
                await DB._rawPut('chapters', c);
                App.showProgress('写入数据库', ++progress, data.chapters.length + data.entities.length + 5);
            }

            // 3. 写入世界观实体
            const wvLabels = {history:'历史与传说', geography:'地理与地貌', magic:'魔法/科技体系', factions:'势力与组织', species:'种族与生物', rules:'世界规则', culture:'文化与习俗'};
            for(const [key, desc] of Object.entries(data.worldview || {})) {
                if(!desc) continue;
                const ent = {
                    id: 'world_' + key,
                    name: wvLabels[key] || key,
                    type: 'world',
                    desc: String(desc),
                    category: key,
                    source: 'import',
                    updatedAt: Date.now()
                };
                await DB._rawPut('entities', ent);
                App.showProgress('写入数据库', ++progress, data.chapters.length + data.entities.length + 5);
            }

            // 4. 写入普通实体
            for(const e of data.entities || []) {
                // 去重检查
                const allEnts = await DB.getAll('entities');
                const existing = allEnts.find(ex => ex.name === e.name && ex.type === e.type);
                if(existing) {
                    // 合并描述
                    existing.desc = (existing.desc || '') + '\n\n[导入补充]\n' + e.desc;
                    existing.updatedAt = Date.now();
                    await DB._rawPut('entities', existing);
                } else {
                    await DB._rawPut('entities', e);
                }
                App.showProgress('写入数据库', ++progress, data.chapters.length + data.entities.length + 5);
            }

            // 5. 构建循环（每5章一个）
            if(buildCycles && data.chapters.length >= 3) {
                const cycleSize = 5;
                const numCycles = Math.ceil(data.chapters.length / cycleSize);
                for(let i = 0; i < numCycles; i++) {
                    const start = i * cycleSize + 1;
                    const end = Math.min((i + 1) * cycleSize, data.chapters.length);
                    const cycleChaps = data.chapters.filter(c => c.order >= start && c.order <= end);
                    await we.syncCycle({
                        id: `cycle_${start}_${end}`,
                        startChapter: start, endChapter: end, cycleNum: i + 1,
                        fusionEssence: `导入作品循环${i+1}：第${start}-${end}章`,
                        chapterIds: cycleChaps.map(c => c.id),
                        entityNames: (data.entities || []).slice(0, 10).map(e => e.name),
                        patterns: [],
                        nexusCHR: [], nexusWLD: [], nexusFOE: [], nexusEMO: [],
                        updatedAt: Date.now()
                    });
                }
            }

            // 6. 触发LocalSync
            ['volumes', 'chapters', 'entities', 'cycles'].forEach(s => LocalSync._scheduleWrite(s));

            // 7. 刷新缓存
            we._cachedEntities = null;
            we._cachedCycles = null;

            // 8. 通知writer刷新
            if(Modules.writer) {
                Modules.writer.loadTree();
                setTimeout(() => Modules.writer.loadTree(), 800);
            }

            App.hideProgress();
            we._closeNovelImportModal();
            UI.toast(`导入成功: ${data.volumes?.length||0}卷 / ${data.chapters.length}章 / ${data.entities?.length||0}实体`, 'success');

            // 提示用户下一步
            if(confirm('作品已导入成功！是否立即跳转到执笔台继续创作？')) {
                App.nav('writer');
            }
        } catch(e) {
            App.hideProgress();
            console.error('导入写入失败:', e);
            UI.toast('导入失败: ' + e.message, 'error');
        }
    },

    // ═══════════════════════════════════════════════════════════════
    //  双向同步桥：接收 writer 推送，更新世界引擎
    // ═══════════════════════════════════════════════════════════════

    async syncFromWriter(chapterData) {
        const we = Modules.world_engine;
        // chapterData: { chapterId, title, order, content, outline, extractedEntities? }
        if(!chapterData || !chapterData.chapterId) return;

        try {
            // 1. 刷新缓存
            await we._ensureCache();

            // 2. 更新实体关联
            if(chapterData.extractedEntities?.length) {
                for(const ent of chapterData.extractedEntities) {
                    const existing = (we._cachedEntities || []).find(e => e.name === ent.name && e.type === ent.type);
                    if(existing) {
                        // 更新关联章节
                        if(!existing.chapters) existing.chapters = [];
                        if(!existing.chapters.includes(chapterData.chapterId)) {
                            existing.chapters.push(chapterData.chapterId);
                        }
                        // 更新关联循环
                        const cycleInfo = we.getCycleIdForChapter(chapterData.order, 5);
                        if(cycleInfo && !existing.cycles?.includes(cycleInfo.id)) {
                            if(!existing.cycles) existing.cycles = [];
                            existing.cycles.push(cycleInfo.id);
                        }
                        existing.updatedAt = Date.now();
                        await DB.put('entities', existing);
                    } else {
                        // 新建实体
                        const newEnt = {
                            id: 'writer_sync_' + Utils.uuid(),
                            name: ent.name,
                            type: ent.type || '人物',
                            desc: ent.desc || '',
                            relations: ent.relations || [],
                            chapters: [chapterData.chapterId],
                            cycles: [],
                            source: 'writer_sync',
                            updatedAt: Date.now()
                        };
                        const cycleInfo = we.getCycleIdForChapter(chapterData.order, 5);
                        if(cycleInfo) newEnt.cycles = [cycleInfo.id];
                        await DB.put('entities', newEnt);
                    }
                }
            }

            // 3. 更新循环实体列表（如果这个章节属于某个循环）
            const cycleInfo = we.getCycleIdForChapter(chapterData.order, 5);
            if(cycleInfo) {
                await we._ensureCycleCache();
                const cycle = (we._cachedCycles || []).find(c => c.id === cycleInfo.id);
                if(cycle && chapterData.extractedEntities?.length) {
                    const newNames = chapterData.extractedEntities.map(e => e.name);
                    cycle.entityNames = [...new Set([...(cycle.entityNames||[]), ...newNames])];
                    cycle.updatedAt = Date.now();
                    await DB.put('cycles', cycle);
                }
            }

            // 4. 刷新缓存
            we._cachedEntities = null;
            we._cachedCycles = null;

            console.log('[WorldEngine] syncFromWriter OK:', chapterData.title);
        } catch(e) {
            console.error('[WorldEngine] syncFromWriter failed:', e);
        }
    },

    // ═══════════════════════════════════════════════════════════════
    //  仪表盘 — 世界引擎全景总览
    // ═══════════════════════════════════════════════════════════════

    _renderDashboard() {
        return `
        <div class="flex-1 overflow-y-auto p-6 space-y-6" id="we-dashboard-container">
            <!-- 标题 -->
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex center text-white shadow-lg shadow-amber-500/20">
                    <i class="fa-solid fa-gauge-high text-lg"></i>
                </div>
                <div>
                    <div class="text-lg font-bold text-white">世界引擎仪表盘</div>
                    <div class="text-[11px] text-dim">NEXUS 世界观中枢 · 数据全景</div>
                </div>
            </div>

            <!-- 六宫格数据卡片 -->
            <div class="grid grid-cols-3 gap-4">
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-earth-americas text-blue-400 text-sm"></i>
                        <span class="text-[10px] text-dim font-bold uppercase">世界观完成度</span>
                    </div>
                    <div class="text-2xl font-bold text-white" id="we-db-world-progress">—</div>
                    <div class="text-[9px] text-dim mt-1">7个维度</div>
                    <div class="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all" id="we-db-world-bar" style="width:0%"></div>
                    </div>
                </div>
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-users text-amber-400 text-sm"></i>
                        <span class="text-[10px] text-dim font-bold uppercase">实体总数</span>
                    </div>
                    <div class="text-2xl font-bold text-white" id="we-db-entity-count">—</div>
                    <div class="text-[9px] text-dim mt-1" id="we-db-entity-types">—</div>
                </div>
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-circle-nodes text-purple-400 text-sm"></i>
                        <span class="text-[10px] text-dim font-bold uppercase">知识图谱</span>
                    </div>
                    <div class="text-2xl font-bold text-white" id="we-db-graph-nodes">—</div>
                    <div class="text-[9px] text-dim mt-1" id="we-db-graph-edges">—</div>
                </div>
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-sync text-cyan-400 text-sm"></i>
                        <span class="text-[10px] text-dim font-bold uppercase">NEXUS循环</span>
                    </div>
                    <div class="text-2xl font-bold text-white" id="we-db-cycle-count">—</div>
                    <div class="text-[9px] text-dim mt-1">每5章一个循环</div>
                </div>
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-wand-magic-sparkles text-amber-400 text-sm"></i>
                        <span class="text-[10px] text-dim font-bold uppercase">融合技法</span>
                    </div>
                    <div class="text-2xl font-bold text-white" id="we-db-fusion-len">—</div>
                    <div class="text-[9px] text-dim mt-1">拆书精华字数</div>
                </div>
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-database text-green-400 text-sm"></i>
                        <span class="text-[10px] text-dim font-bold uppercase">向量库</span>
                    </div>
                    <div class="text-2xl font-bold text-white" id="we-db-vector-count">—</div>
                    <div class="text-[9px] text-dim mt-1">RAG语义检索</div>
                </div>
            </div>

            <!-- 四大板块入口 -->
            <div>
                <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-3">四大板块</div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="group cursor-pointer bg-[#0e0e12] rounded-xl border border-white/5 hover:border-blue-500/30 p-5 transition-all" onclick="Modules.world_engine.switchTab('world')">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex center"><i class="fa-solid fa-earth-americas text-blue-400 text-lg"></i></div>
                            <div><div class="font-bold text-white">世界观</div><div class="text-[9px] text-dim">7维设定 + 导入</div></div>
                        </div>
                        <div class="text-[10px] text-gray-400 leading-relaxed">构建你的宇宙：历史、地理、魔法体系、势力、种族、规则、文化。支持AI生成和批量导入。</div>
                    </div>
                    <div class="group cursor-pointer bg-[#0e0e12] rounded-xl border border-white/5 hover:border-amber-500/30 p-5 transition-all" onclick="Modules.world_engine.switchTab('entities')">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex center"><i class="fa-solid fa-users text-amber-400 text-lg"></i></div>
                            <div><div class="font-bold text-white">角色与实体</div><div class="text-[9px] text-dim">12类实体管理</div></div>
                        </div>
                        <div class="text-[10px] text-gray-400 leading-relaxed">管理人物、物品、地点、势力等12类实体。支持从拆书/导入自动提取，关联章节和循环。</div>
                    </div>
                    <div class="group cursor-pointer bg-[#0e0e12] rounded-xl border border-white/5 hover:border-purple-500/30 p-5 transition-all" onclick="Modules.world_engine.switchTab('graph')">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-10 h-10 rounded-lg bg-purple-500/10 flex center"><i class="fa-solid fa-circle-nodes text-purple-400 text-lg"></i></div>
                            <div><div class="font-bold text-white">关系与图谱</div><div class="text-[9px] text-dim">3D知识网络 + RAG</div></div>
                        </div>
                        <div class="text-[10px] text-gray-400 leading-relaxed">可视化3D知识图谱展示实体关系。向量数据库支撑RAG语义检索，为AI写作提供上下文。</div>
                    </div>
                    <div class="group cursor-pointer bg-[#0e0e12] rounded-xl border border-white/5 hover:border-red-500/30 p-5 transition-all" onclick="Modules.world_engine.switchTab('pipeline_overview')">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-10 h-10 rounded-lg bg-red-500/10 flex center"><i class="fa-solid fa-rocket text-red-400 text-lg"></i></div>
                            <div><div class="font-bold text-white">融合数据</div><div class="text-[9px] text-dim">拆书精华 + 注入中心</div></div>
                        </div>
                        <div class="text-[10px] text-gray-400 leading-relaxed">查看融合拆书流水线数据，提取技法精华。一键注入到凤凰流或执笔台，驱动创作。</div>
                    </div>
                </div>
            </div>

            <!-- 最近活动 -->
            <div>
                <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-3">最近活动</div>
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-4 space-y-2" id="we-dashboard-activity">
                    <div class="text-[10px] text-dim">加载中...</div>
                </div>
            </div>
        </div>`;
    },

    // ═══ 叙事一致性监控中心 — 数据刷新 ═══
    async _refreshNarrativeConsistency() {
        const we = Modules.world_engine;
        await we._ensureCache();

        const allEnts = we._cachedEntities || [];
        const pipelineEnts = allEnts.filter(e => e.source === 'pipeline' || e.source === 'world');
        const nonWorldEnts = pipelineEnts.filter(e => !e.id.startsWith('world_'));

        // 1. 统计卡片
        const entTotal = nonWorldEnts.length;
        const entBreakdown = {};
        nonWorldEnts.forEach(e => { entBreakdown[e.type || '其他'] = (entBreakdown[e.type || '其他'] || 0) + 1; });
        const breakdownText = Object.entries(entBreakdown).map(([t,c]) => `${t}:${c}`).join(' ');

        const elTotal = document.getElementById('we-cs-ent-total');
        const elBreak = document.getElementById('we-cs-ent-breakdown');
        if(elTotal) elTotal.textContent = entTotal;
        if(elBreak) elBreak.textContent = breakdownText || '暂无实体';

        // 2. 伏笔追踪（从 fusion_book 获取 + 世界引擎实体中的伏笔类型）
        const FB = Modules.fusion_book;
        let pendingFS = [], resolvedFS = [];
        if(FB) {
            const allOutlines = FB._allPipelineResults?.outline || '';
            const fsData = FB._extractForeshadowing ? FB._extractForeshadowing(allOutlines) : { pending: [], resolved: [] };
            pendingFS = fsData.pending || [];
            resolvedFS = fsData.resolved || [];
        }
        // 同时从实体库中查找伏笔类型实体
        const fsEntities = nonWorldEnts.filter(e => e.type === '伏笔');
        fsEntities.forEach(e => {
            const text = e.name + (e.desc ? ': ' + e.desc.slice(0, 80) : '');
            if(!pendingFS.includes(text) && !resolvedFS.includes(text)) pendingFS.push(text);
        });

        const elPending = document.getElementById('we-cs-pending-fs');
        const elResolved = document.getElementById('we-cs-resolved-fs');
        const elPCount = document.getElementById('we-cs-pending-count');
        const elRCount = document.getElementById('we-cs-resolved-count');
        if(elPending) elPending.textContent = pendingFS.length;
        if(elResolved) elResolved.textContent = resolvedFS.length;
        if(elPCount) elPCount.textContent = pendingFS.length;
        if(elRCount) elRCount.textContent = resolvedFS.length;

        // 渲染待回收列表
        const elPList = document.getElementById('we-cs-pending-list');
        if(elPList) {
            if(pendingFS.length === 0) {
                elPList.innerHTML = '<div class="text-[10px] text-dim italic">暂无待回收伏笔</div>';
            } else {
                elPList.innerHTML = pendingFS.map((f, i) => `
                    <div class="flex items-start gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10 group">
                        <span class="w-5 h-5 rounded bg-red-500/20 text-red-400 flex center text-[9px] font-bold shrink-0 mt-0.5">${i+1}</span>
                        <div class="flex-1 min-w-0">
                            <div class="text-[11px] text-white leading-relaxed">${f}</div>
                        </div>
                        <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onclick="Modules.world_engine._resolveForeshadowing(${i})" title="标记为已回收"><i class="fa-solid fa-check mr-1"></i>回收</button>
                    </div>
                `).join('');
            }
        }

        // 渲染已回收列表
        const elRList = document.getElementById('we-cs-resolved-list');
        if(elRList) {
            if(resolvedFS.length === 0) {
                elRList.innerHTML = '<div class="text-[10px] text-dim italic">暂无已回收伏笔</div>';
            } else {
                elRList.innerHTML = resolvedFS.map((f, i) => `
                    <div class="flex items-start gap-2 p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                        <i class="fa-solid fa-check-circle text-green-500 text-[10px] mt-0.5 shrink-0"></i>
                        <div class="text-[11px] text-white/70 leading-relaxed line-through">${f}</div>
                    </div>
                `).join('');
            }
        }

        // 3. 情绪弧线（ECharts）
        let emotionCurve = [];
        if(FB && FB._extractEmotionCurve) {
            emotionCurve = FB._extractEmotionCurve(FB._allPipelineResults?.outline || '');
        }
        // 同时从实体中查找情绪相关数据（EMO类型）
        const emoEnts = nonWorldEnts.filter(e => e.type === '技法' && (e.name || '').includes('情绪'));

        const elEmoAvg = document.getElementById('we-cs-emo-avg');
        if(elEmoAvg) {
            const avg = emotionCurve.length ? (emotionCurve.reduce((a,b) => a + b.score, 0) / emotionCurve.length).toFixed(1) : '-';
            elEmoAvg.textContent = avg;
        }

        const chartDom = document.getElementById('we-cs-emotion-chart');
        if(chartDom && typeof echarts !== 'undefined') {
            if(emotionCurve.length >= 2) {
                const chart = echarts.init(chartDom);
                const option = {
                    backgroundColor: 'transparent',
                    grid: { top: 30, right: 20, bottom: 30, left: 40 },
                    tooltip: { trigger: 'axis', backgroundColor: '#1a1a1e', borderColor: '#333', textStyle: { color: '#fff', fontSize: 11 } },
                    xAxis: { type: 'category', data: emotionCurve.map(e => '第' + e.chapter + '章'), axisLine: { lineStyle: { color: '#333' } }, axisLabel: { color: '#888', fontSize: 9 } },
                    yAxis: { type: 'value', min: 1, max: 10, axisLine: { lineStyle: { color: '#333' } }, axisLabel: { color: '#888', fontSize: 9 }, splitLine: { lineStyle: { color: '#1a1a1e' } } },
                    series: [
                        { name: '情绪分值', type: 'line', data: emotionCurve.map(e => e.score), smooth: true, symbol: 'circle', symbolSize: 8, lineStyle: { color: '#06b6d4', width: 2 }, itemStyle: { color: '#06b6d4' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(6,182,212,0.3)' }, { offset: 1, color: 'rgba(6,182,212,0)' }] } } },
                        { name: '张力等级', type: 'line', data: emotionCurve.map(e => e.tension), smooth: true, symbol: 'diamond', symbolSize: 6, lineStyle: { color: '#f59e0b', width: 1.5, type: 'dashed' }, itemStyle: { color: '#f59e0b' } }
                    ],
                    legend: { data: ['情绪分值', '张力等级'], textStyle: { color: '#888', fontSize: 9 }, top: 0 }
                };
                chart.setOption(option);
            } else {
                chartDom.innerHTML = '<div class="flex items-center justify-center h-full text-[10px] text-dim italic">情绪数据不足（需至少2章），处理更多章节后将自动绘制</div>';
            }
        }

        // 情绪异常预警
        const elAlerts = document.getElementById('we-cs-emo-alerts');
        if(elAlerts && emotionCurve.length >= 2) {
            const alerts = [];
            for(let i = 1; i < emotionCurve.length; i++) {
                const diff = Math.abs(emotionCurve[i].score - emotionCurve[i-1].score);
                if(diff > 3) alerts.push(`<span class="text-red-400">⚠️ 第${emotionCurve[i].chapter}章情绪跳变 ${diff} 分（${emotionCurve[i-1].score}→${emotionCurve[i].score}）</span>`);
            }
            const lowPoints = emotionCurve.filter(e => e.score <= 3);
            if(lowPoints.length > emotionCurve.length * 0.4) alerts.push(`<span class="text-amber-400">⚠️ 低情绪章节占比 ${Math.round(lowPoints.length/emotionCurve.length*100)}%，注意读者流失风险</span>`);
            if(alerts.length === 0) alerts.push('<span class="text-green-400">✓ 情绪曲线平稳，无明显异常</span>');
            elAlerts.innerHTML = alerts.map(a => `<div class="text-[10px] p-1.5 rounded bg-white/5">${a}</div>`).join('');
        } else if(elAlerts) {
            elAlerts.innerHTML = '<div class="text-[10px] text-dim italic">数据不足</div>';
        }

        // 4. 世界观维度完成度
        const worldCats = { history: '历史与传说', geography: '地理与地貌', magic: '魔法/科技体系', factions: '势力与组织', species: '种族与生物', rules: '世界规则', culture: '文化与习俗' };
        const elWorld = document.getElementById('we-cs-world-dims');
        if(elWorld) {
            let worldHtml = '';
            for(const [key, label] of Object.entries(worldCats)) {
                const ent = allEnts.find(e => e.id === 'world_' + key);
                const hasContent = ent && ent.desc && ent.desc.length > 50;
                const percent = hasContent ? Math.min(100, Math.round(ent.desc.length / 10)) : 0;
                worldHtml += `
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] text-dim w-20 shrink-0">${label}</span>
                        <div class="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div class="h-full rounded-full ${hasContent ? 'bg-blue-500' : 'bg-white/10'} transition-all" style="width:${percent}%"></div>
                        </div>
                        <span class="text-[9px] ${hasContent ? 'text-blue-400' : 'text-dim'} w-8 text-right">${hasContent ? '已建' : '未建'}</span>
                        ${hasContent ? `<button class="btn btn-xs bg-white/5 text-dim hover:text-white px-1.5 py-0.5" onclick="Modules.world_engine._editWorldDim('${key}')" title="编辑"><i class="fa-solid fa-pen text-[8px]"></i></button>` : ''}
                    </div>`;
            }
            elWorld.innerHTML = worldHtml;
        }

        // 5. 一致性冲突检查
        const elConflicts = document.getElementById('we-cs-conflicts');
        if(elConflicts) {
            const conflicts = [];
            // 检查同名不同类型实体
            const nameMap = {};
            nonWorldEnts.forEach(e => {
                if(!nameMap[e.name]) nameMap[e.name] = [];
                nameMap[e.name].push(e);
            });
            for(const [name, ents] of Object.entries(nameMap)) {
                const types = [...new Set(ents.map(e => e.type))];
                if(types.length > 1) {
                    conflicts.push(`<span class="text-amber-400">⚠️ "${name}" 存在 ${types.length} 种类型 (${types.join('/')})，请确认是否为同一实体</span>`);
                }
            }
            // 检查无关联实体（孤立节点）
            const isolated = nonWorldEnts.filter(e => !e.relations || e.relations.length === 0);
            if(isolated.length > 0 && isolated.length < nonWorldEnts.length) {
                conflicts.push(`<span class="text-blue-400">ℹ️ ${isolated.length} 个实体无关联关系，建议补充关系网络</span>`);
            }
            // 检查世界观维度缺失
            const missingWorld = Object.keys(worldCats).filter(k => !allEnts.find(e => e.id === 'world_' + k));
            if(missingWorld.length > 0) {
                conflicts.push(`<span class="text-purple-400">ℹ️ 缺失世界观维度：${missingWorld.map(k => worldCats[k]).join('、')}</span>`);
            }
            if(conflicts.length === 0) {
                conflicts.push('<span class="text-green-400">✓ 未检测到明显一致性冲突</span>');
            }
            elConflicts.innerHTML = conflicts.map(c => `<div class="text-[10px] p-1.5 rounded bg-white/5">${c}</div>`).join('');
        }
    },

    // ═══ 叙事一致性 — 交互方法 ═══

    /**
     * 标记伏笔为已回收
     */
    _resolveForeshadowing(index) {
        const FB = Modules.fusion_book;
        if(!FB) return;
        const allOutlines = FB._allPipelineResults?.outline || '';
        const fsData = FB._extractForeshadowing ? FB._extractForeshadowing(allOutlines) : { pending: [], resolved: [] };
        const pending = fsData.pending || [];
        if(index >= 0 && index < pending.length) {
            const item = pending[index];
            // 在 allPipelineResults.outline 中追加回收标记
            FB._allPipelineResults.outline = FB._allPipelineResults.outline + '\n\n【伏笔回收】已回收：' + item;
            UI.toast('已标记伏笔回收: ' + item.slice(0, 30) + '...');
            this._refreshNarrativeConsistency();
        }
    },

    /**
     * 手动添加伏笔
     */
    _showAddForeshadowingModal() {
        UI.dialog('添加伏笔', `
            <div class="space-y-3">
                <div>
                    <span class="text-[10px] text-dim">伏笔描述</span>
                    <textarea id="we-cs-add-fs-text" class="input w-full h-20 bg-black/30 border-white/10 text-white text-xs mt-1" placeholder="描述这个伏笔的内容..."></textarea>
                </div>
                <div>
                    <span class="text-[10px] text-dim">计划回收章节</span>
                    <input id="we-cs-add-fs-chapter" type="number" class="input w-full bg-black/30 border-white/10 text-white text-xs mt-1" placeholder="例如：8">
                </div>
            </div>
        `, {
            confirm: { text: '添加', action: async () => {
                const text = document.getElementById('we-cs-add-fs-text').value.trim();
                const ch = document.getElementById('we-cs-add-fs-chapter').value;
                if(!text) return UI.toast('请输入伏笔描述');
                const FB = Modules.fusion_book;
                if(FB && FB._allPipelineResults) {
                    FB._allPipelineResults.outline = (FB._allPipelineResults.outline || '') + '\n\n【手动添加伏笔】' + text + (ch ? ' [计划回收:第' + ch + '章]' : '');
                    UI.toast('伏笔已添加');
                    this._refreshNarrativeConsistency();
                }
            }},
            cancel: { text: '取消' }
        });
    },

    /**
     * 手动记录情绪
     */
    _showAddEmotionModal() {
        UI.dialog('记录情绪锚点', `
            <div class="space-y-3">
                <div>
                    <span class="text-[10px] text-dim">章节号</span>
                    <input id="we-cs-add-emo-ch" type="number" class="input w-full bg-black/30 border-white/10 text-white text-xs mt-1" placeholder="例如：5">
                </div>
                <div>
                    <span class="text-[10px] text-dim">情绪分值 (1-10)</span>
                    <input id="we-cs-add-emo-score" type="number" min="1" max="10" class="input w-full bg-black/30 border-white/10 text-white text-xs mt-1" placeholder="5">
                </div>
                <div>
                    <span class="text-[10px] text-dim">张力等级 (1-10)</span>
                    <input id="we-cs-add-emo-tension" type="number" min="1" max="10" class="input w-full bg-black/30 border-white/10 text-white text-xs mt-1" placeholder="5">
                </div>
                <div>
                    <span class="text-[10px] text-dim">钩子类型</span>
                    <input id="we-cs-add-emo-hook" class="input w-full bg-black/30 border-white/10 text-white text-xs mt-1" placeholder="例如：信息差钩子">
                </div>
            </div>
        `, {
            confirm: { text: '记录', action: async () => {
                const ch = document.getElementById('we-cs-add-emo-ch').value;
                const score = document.getElementById('we-cs-add-emo-score').value;
                const tension = document.getElementById('we-cs-add-emo-tension').value;
                const hook = document.getElementById('we-cs-add-emo-hook').value.trim();
                if(!ch || !score) return UI.toast('请输入章节号和情绪分值');
                const FB = Modules.fusion_book;
                if(FB && FB._allPipelineResults) {
                    FB._allPipelineResults.outline = (FB._allPipelineResults.outline || '') + `\n\n### 第${ch}章\n**情绪节奏:** 起→承→转→合\n**emotion_score:** ${score}\n**tension_level:** ${tension || 5}\n**hook_type:** ${hook || '待定'}`;
                    UI.toast('情绪锚点已记录');
                    this._refreshNarrativeConsistency();
                }
            }},
            cancel: { text: '取消' }
        });
    },

    /**
     * 同步一致性状态到融合拆书（刷新 _accContext）
     */
    async _syncConsistencyToFusion() {
        const FB = Modules.fusion_book;
        if(!FB) return UI.toast('融合拆书模块未加载');
        await this._ensureCache();
        const allEnts = this._cachedEntities || [];
        const nonWorld = allEnts.filter(e => !e.id.startsWith('world_'));

        // 构建最新的知识图谱文本
        let kg = '';
        const grouped = {};
        nonWorld.forEach(e => { const t = e.type || '其他'; if(!grouped[t]) grouped[t]=[]; grouped[t].push(e); });
        for(const [type, items] of Object.entries(grouped)) {
            kg += `【${type}】${items.map(e => e.name + (e.desc ? ':' + e.desc.slice(0,60) : '')).join(' | ')}\n`;
        }
        const worlds = allEnts.filter(e => e.id.startsWith('world_') && e.desc);
        if(worlds.length) {
            kg += '\n【世界观设定】\n';
            worlds.forEach(w => kg += `[${w.name}] ${w.desc.slice(0, 200)}\n`);
        }

        // 更新 fusion_book 的累积上下文
        FB._accContext = FB._accContext || {};
        FB._accContext.entities = kg;
        FB._accContext.knowledgeGraph = kg;
        UI.toast('一致性状态已同步到融合拆书 (' + nonWorld.length + ' 个实体)');
    },

    /**
     * 编辑世界观维度
     */
    _editWorldDim(cat) {
        const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
        const label = catLabels[cat] || cat;
        DB.get('entities', 'world_' + cat).then(ent => {
            const current = ent && ent.desc ? ent.desc : '';
            UI.dialog('编辑：' + label, `
                <textarea id="we-cs-edit-world-text" class="input w-full h-48 bg-black/30 border-white/10 text-white text-xs" placeholder="输入${label}的详细设定...">${current}</textarea>
            `, {
                confirm: { text: '保存', action: async () => {
                    const text = document.getElementById('we-cs-edit-world-text').value.trim();
                    await DB.put('entities', { id: 'world_' + cat, name: label, type: 'world', desc: text, source: 'pipeline', updatedAt: Date.now() });
                    this._cachedEntities = null;
                    UI.toast(label + ' 已更新');
                    this._refreshNarrativeConsistency();
                }},
                cancel: { text: '取消' }
            });
        });
    },

    async _refreshDashboard() {
        const we = Modules.world_engine;
        await we._ensureCache();
        await we._ensureCycleCache();

        const worldCats = ['history','geography','magic','factions','species','rules','culture'];
        let worldFilled = 0;
        const allEnts = we._cachedEntities || [];
        for(const cat of worldCats) {
            const ent = allEnts.find(e => e.id === 'world_' + cat);
            if(ent && ent.desc && ent.desc.length > 50) worldFilled++;
        }
        const worldProgress = Math.round((worldFilled / 7) * 100);
        const wpEl = document.getElementById('we-db-world-progress');
        const wbEl = document.getElementById('we-db-world-bar');
        if(wpEl) wpEl.textContent = `${worldFilled}/7`;
        if(wbEl) wbEl.style.width = `${worldProgress}%`;
        const wnEl = document.getElementById('we-nav-world-progress');
        if(wnEl) wnEl.textContent = `${worldFilled}/7`;

        const nonWorldEnts = allEnts.filter(e => !e.id?.startsWith('world_'));
        const ecEl = document.getElementById('we-db-entity-count');
        const etEl = document.getElementById('we-db-entity-types');
        const enEl = document.getElementById('we-nav-ent-count');
        if(ecEl) ecEl.textContent = nonWorldEnts.length;
        if(enEl) enEl.textContent = nonWorldEnts.length;
        const typeCounts = {};
        nonWorldEnts.forEach(e => { typeCounts[e.type] = (typeCounts[e.type]||0)+1; });
        const topTypes = Object.entries(typeCounts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([t,c])=>`${t}:${c}`).join(' ');
        if(etEl) etEl.textContent = topTypes || '暂无实体';

        const gnEl = document.getElementById('we-db-graph-nodes');
        const geEl = document.getElementById('we-db-graph-edges');
        if(gnEl) gnEl.textContent = nonWorldEnts.length;
        let edgeCount = 0;
        nonWorldEnts.forEach(e => { edgeCount += (e.relations?.length || 0); });
        if(geEl) geEl.textContent = `${edgeCount} 关系`;

        const ccEl = document.getElementById('we-db-cycle-count');
        const cycles = we._cachedCycles || [];
        if(ccEl) ccEl.textContent = cycles.length;

        const flEl = document.getElementById('we-db-fusion-len');
        const FB = Modules.fusion_book;
        let fusionLen = 0;
        if(FB) {
            const ps = FB._getPipelineStatus ? FB._getPipelineStatus() : null;
            if(ps?.results?.fusion) fusionLen = ps.results.fusion.length;
        }
        if(flEl) flEl.textContent = fusionLen > 0 ? `${(fusionLen/1000).toFixed(1)}k` : '—';

        const vcEl = document.getElementById('we-db-vector-count');
        try {
            const vectors = await DB.getAll('vectors');
            if(vcEl) vcEl.textContent = vectors.length;
        } catch(e) { if(vcEl) vcEl.textContent = '—'; }

        const actEl = document.getElementById('we-dashboard-activity');
        if(actEl) {
            let html = '';
            const recentEnts = nonWorldEnts.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).slice(0, 5);
            if(recentEnts.length) {
                recentEnts.forEach(e => {
                    const time = e.updatedAt ? new Date(e.updatedAt).toLocaleDateString() : '未知';
                    html += `<div class="flex items-center gap-2 text-[10px]"><span class="px-1.5 py-0.5 rounded text-[8px] bg-white/5 text-dim">${e.type}</span><span class="text-gray-300">${e.name}</span><span class="text-dim ml-auto">${time}</span></div>`;
                });
            } else {
                html = '<div class="text-[10px] text-dim">暂无活动 — 从「导入已有作品」或「融合拆书」开始构建你的世界</div>';
            }
            actEl.innerHTML = html;
        }
    },

    getCycleIdForChapter(chapterNum, cycleSize = 5) {
        const start = Math.floor((chapterNum - 1) / cycleSize) * cycleSize + 1;
        const end = start + cycleSize - 1;
        return { id: `cycle_${start}_${end}`, startChapter: start, endChapter: end };
    }
};
