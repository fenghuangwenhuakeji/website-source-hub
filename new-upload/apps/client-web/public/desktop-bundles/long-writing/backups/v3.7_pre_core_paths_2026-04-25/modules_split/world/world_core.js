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
};
