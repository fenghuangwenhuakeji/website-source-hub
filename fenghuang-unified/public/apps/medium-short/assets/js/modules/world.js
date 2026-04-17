// ═══════════════════════════════════════════════════════════════
// 世界引擎 (World Engine) — 核心中转站
// 修复: 一键清空彻底 / 提取后同步刷新图谱+世界观 / 3D网络(非孤立点)
//       暂停关闭不清零 / 时间戳标注 / IDB writings store
// ═══════════════════════════════════════════════════════════════
Modules.world_engine = {
    currentTab: 'entities',
    worldCat: 'history',
    cur: null,
    _entityFilter: 'all',
    _typeFilter: '',
    _chapters: [],
    _currentChapter: null,
    _chapterFilter: 'all',

    // ===== 构建结构化注入包 =====
    buildInjectPackage(opts = {}) {
        const { includeEntities=true, includeWorld=true, includeFusion=true, includePipeline=false, includeChapters=true, maxLen=6000, chapterId=null } = opts;
        let pkg = '';
        
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
        <div class="flex h-full bg-[#F8F9FA] overflow-hidden">
            <div class="w-64 shrink-0 flex flex-col bg-[#F1F3F5] border-r border-gray-200">
                <div class="p-4 border-b border-gray-200 bg-gradient-to-r from-amber-900/20 to-transparent">
                    <div class="flex items-center gap-2">
                        <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex center text-gray-800 text-sm shadow-lg shadow-amber-500/20"><i class="fa-solid fa-atom"></i></div>
                        <div>
                            <div class="font-bold text-gray-800 text-base">世界引擎</div>
                            <div class="text-xs text-gray-600 font-bold">核心中转站 · 提取 · 注入</div>
                        </div>
                    </div>
                </div>
                <div class="p-2 space-y-1 border-b border-gray-200">
                    ${tabs.map(tb => `
                        <button class="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-sm font-bold transition-all ${t===tb.id ? 'bg-gradient-to-r from-gray-200 to-gray-100 text-gray-800 border-2 border-gray-300 shadow-sm' : 'text-gray-600 hover:bg-gray-100 border-2 border-transparent'}" onclick="Modules.world_engine.switchTab('${tb.id}')">
                            <i class="fa-solid ${tb.icon} ${tb.color} w-5 text-center text-base"></i>
                            <span class="text-sm">${tb.text}</span>
                            ${tb.id==='pipeline_overview' && hasPipeline ? '<span class="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>' : ''}
                            ${tb.id==='inject' ? '<span class="ml-auto text-xs font-bold text-green-600 bg-gradient-to-r from-green-100 to-emerald-100 px-2 py-1 rounded-lg border border-green-300 shadow-sm">核心</span>' : ''}
                        </button>
                    `).join('')}
                </div>
                <div class="flex-1 overflow-y-auto" id="we-sub-panel">
                    ${we._renderSubPanel()}
                </div>
                <div class="p-3 border-t border-gray-200 bg-white space-y-2">
                    <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full" onclick="Modules.world_engine.exportAll()"><i class="fa-solid fa-download mr-1"></i>导出全部设定</button>
                    <div class="flex gap-1">
                        <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 flex-1" onclick="Modules.world_engine.injectToWriter()"><i class="fa-solid fa-feather-pointed mr-1"></i>→执笔台</button>
                        <button class="btn btn-xs bg-orange-600/20 text-orange-400 border-orange-600/30 flex-1" onclick="Modules.world_engine.injectToPhoenix()"><i class="fa-solid fa-fire mr-1"></i>→凤凰流</button>
                    </div>
                    <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30 w-full" onclick="Modules.world_engine.extractFromFusion()"><i class="fa-solid fa-book-open-reader mr-1"></i>从拆书深度提取</button>
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
        if(tab === 'graph') setTimeout(() => Modules.world_engine._initGraph(), 100);
        if(tab === 'entities') Modules.world_engine._refreshEntities();
        if(tab === 'vectors') Modules.world_engine._refreshVectors();
        if(tab === 'world') Modules.world_engine._loadWorldCat();
        if(tab === 'inject') Modules.world_engine._refreshInjectPreview();
    },

    init: async () => {
        await Modules.world_engine._ensureCache();
        const t = Modules.world_engine.currentTab;
        if(t === 'graph') setTimeout(() => Modules.world_engine._initGraph(), 100);
        if(t === 'entities') Modules.world_engine._refreshEntities();
        if(t === 'vectors') Modules.world_engine._refreshVectors();
    },

    _renderSubPanel: () => {
        const we = Modules.world_engine;
        const t = we.currentTab;
        if(t === 'entities') {
            return `
                <div class="p-2 space-y-1">
                    <div class="flex flex-wrap gap-1 mb-2 px-1">
                        ${['all','pipeline','manual'].map(f => {
                            const labels = {all:'全部', pipeline:'流水线', manual:'手动'};
                            const active = we._entityFilter === f;
                            return `<button class="flex-1 text-xs py-2 rounded-lg font-bold transition-all ${active ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-2 border-amber-400 shadow-lg shadow-amber-500/30' : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-amber-300 hover:bg-amber-50'}" onclick="Modules.world_engine._entityFilter='${f}';Modules.world_engine._typeFilter='';Modules.world_engine._refreshEntities()">${labels[f]}</button>`;
                        }).join('')}
                    </div>
                    <div class="flex flex-wrap gap-1 px-1 mb-1">
                        ${['人物','物品','地点','势力','魔法','情节'].map(tp => {
                            const active = we._typeFilter === tp;
                            return `<button class="text-xs px-2 py-1.5 rounded-lg font-bold transition-all ${active ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-2 border-blue-400 shadow-lg shadow-blue-500/30' : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50'}" onclick="Modules.world_engine._typeFilter='${active ? '' : tp}';Modules.world_engine._entityFilter='all';Modules.world_engine._refreshEntities()">${tp}</button>`;
                        }).join('')}
                    </div>
                    <div class="px-1 mb-1">
                        <div class="text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                            <i class="fa-solid fa-filter text-indigo-400"></i>
                            章节筛选
                        </div>
                        <select id="we-chapter-filter" class="w-full text-xs text-gray-700 font-bold bg-white border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200" onchange="Modules.world_engine._chapterFilter=this.value;Modules.world_engine._refreshEntities()">
                            <option value="all" ${we._chapterFilter==='all'?'selected':''}>全部章节</option>
                            <option value="none" ${we._chapterFilter==='none'?'selected':''}>未分配</option>
                            ${(we._chapters||[]).sort((a,b)=>(a.number||0)-(b.number||0)).map(c => `<option value="${c.id}" ${we._chapterFilter===c.id?'selected':''}>第${c.number||'?'}章: ${c.title||'未命名'}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="p-2 space-y-1" id="we-entity-list"><div class="text-xs text-gray-600 font-bold p-3 flex items-center justify-center gap-2">
                            <i class="fa-solid fa-spinner fa-spin text-amber-500"></i>
                            加载中...
                        </div></div>
                <div class="p-2"><button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full" onclick="Modules.world_engine._addEntity()"><i class="fa-solid fa-plus mr-1"></i>新建实体</button></div>`;
        }
        if(t === 'inject') {
            return `<div class="p-3 space-y-3">
                <div class="text-xs font-bold text-green-600 flex items-center gap-2 mb-2">
                            <i class="fa-solid fa-syringe text-green-500"></i>
                            注入配置
                        </div>
                <label class="flex items-center gap-2 text-xs text-gray-700 font-bold cursor-pointer hover:text-gray-900 p-2 rounded-lg hover:bg-green-50 transition-all"><input type="checkbox" id="we-inj-entities" checked class="accent-green-500"> 实体库</label>
                <label class="flex items-center gap-2 text-xs text-gray-700 font-bold cursor-pointer hover:text-gray-900 p-2 rounded-lg hover:bg-green-50 transition-all"><input type="checkbox" id="we-inj-world" checked class="accent-green-500"> 世界观设定</label>
                <label class="flex items-center gap-2 text-xs text-gray-700 font-bold cursor-pointer hover:text-gray-900 p-2 rounded-lg hover:bg-green-50 transition-all"><input type="checkbox" id="we-inj-fusion" checked class="accent-green-500"> 融合技法精华</label>
                <label class="flex items-center gap-2 text-xs text-gray-700 font-bold cursor-pointer hover:text-gray-900 p-2 rounded-lg hover:bg-green-50 transition-all"><input type="checkbox" id="we-inj-pipeline" class="accent-green-500"> 流水线原始数据</label>
                <div class="border-t border-gray-200 pt-2 space-y-1">
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 w-full" onclick="Modules.world_engine._refreshInjectPreview()"><i class="fa-solid fa-eye mr-1"></i>预览注入包</button>
                    <button class="btn btn-xs bg-orange-600/20 text-orange-400 border-orange-600/30 w-full" onclick="Modules.world_engine.injectToPhoenix()"><i class="fa-solid fa-fire mr-1"></i>注入凤凰流</button>
                    <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30 w-full" onclick="Modules.world_engine.injectToWriter()"><i class="fa-solid fa-feather-pointed mr-1"></i>注入执笔台</button>
                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30 w-full" onclick="Modules.world_engine.injectToRAG()"><i class="fa-solid fa-database mr-1"></i>注入RAG上下文</button>
                </div>
            </div>`;
        }
        if(t === 'pipeline_overview') {
            return `<div class="p-2 space-y-2">
                <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30 w-full" onclick="App.nav('fusion_book')"><i class="fa-solid fa-book-open-reader mr-1"></i>前往融合拆书</button>
                <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full" onclick="Modules.world_engine.extractFromFusion()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>深度提取实体</button>
                <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30 w-full" onclick="Modules.world_engine.extractWorldView()"><i class="fa-solid fa-earth-americas mr-1"></i>提取世界观</button>
            </div>`;
        }
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
                <button class="btn btn-xs bg-gradient-to-r from-blue-100 to-cyan-50 text-cyan-400 border border-cyan-500/30 w-full font-bold" onclick="Modules.world_engine._openImportModal()">
                    <i class="fa-solid fa-file-import mr-1"></i>导入世界观设定
                </button>
                <div class="border-t border-gray-200 pt-2 mt-1">
                    <div class="text-xs font-bold text-blue-600 flex items-center gap-2 mb-2">
                            <i class="fa-solid fa-earth-americas text-blue-400"></i>
                            世界观分类
                        </div>
                </div>
                <div class="space-y-1">${cats.map(c => `
                    <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-bold transition-all ${we.worldCat===c.id ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-gray-800 border-2 border-blue-300 shadow-sm' : 'text-gray-700 hover:bg-gray-100 border-2 border-transparent'}" onclick="Modules.world_engine.worldCat='${c.id}';Modules.world_engine.switchTab('world')">
                        <i class="fa-solid ${c.icon} ${c.color} w-5 text-center text-base"></i>
                        <span class="text-sm">${c.label}</span>
                    </button>
                `).join('')}</div>
            </div>`;
        }
        if(t === 'graph') {
            return `<div class="p-2 space-y-2">
                <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30 w-full" onclick="Modules.world_engine._initGraph()"><i class="fa-solid fa-rotate mr-1"></i>刷新图谱</button>
                <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30 w-full" onclick="Modules.world_engine._refreshRAGContext()"><i class="fa-solid fa-database mr-1"></i>刷新RAG上下文</button>
                <div class="border-t border-gray-200 pt-2 mt-1">
                    <div class="text-xs font-bold text-purple-600 flex items-center gap-2 mb-2">
                            <i class="fa-solid fa-filter text-purple-400"></i>
                            章节筛选
                        </div>
                    <select id="we-graph-chapter-filter" class="w-full text-xs text-gray-700 font-bold bg-white border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200" onchange="Modules.world_engine._graphChapterFilter=this.value;Modules.world_engine._initGraph()">
                        <option value="all">全部章节</option>
                        ${(we._chapters||[]).sort((a,b)=>(a.number||0)-(b.number||0)).map(c => `<option value="${c.id}">第${c.number||'?'}章: ${c.title||'未命名'}</option>`).join('')}
                    </select>
                </div>
                <div class="border-t border-gray-200 pt-2 mt-1">
                    <div class="text-xs font-bold text-purple-600 flex items-center gap-2 mb-2">
                            <i class="fa-solid fa-circle-nodes text-purple-400"></i>
                            类型图例
                        </div>
                    <div class="grid grid-cols-2 gap-2 text-xs p-2">
                        <div class="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-all">
                            <span class="w-3 h-3 rounded-full bg-yellow-500 shadow-md"></span>
                            <span class="text-xs font-bold text-gray-700">人物</span>
                        </div>
                        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-500"></span>物品</div>
                        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-green-500"></span>地点</div>
                        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-red-500"></span>情节</div>
                        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-purple-500"></span>伏笔</div>
                        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-rose-500"></span>势力</div>
                        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-orange-500"></span>种族</div>
                        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-indigo-500"></span>魔法</div>
                        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-sky-500"></span>规则</div>
                        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-pink-500"></span>文化</div>
                        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-500"></span>历史</div>
                        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-teal-500"></span>技法</div>
                    </div>
                </div>
                <div class="border-t border-gray-200 pt-2 mt-1 space-y-1">
                    <div class="text-xs font-bold text-orange-600 flex items-center gap-2 mb-2">
                            <i class="fa-solid fa-bolt text-orange-400"></i>
                            快速整合
                        </div>
                    <button class="btn btn-xs bg-orange-600/20 text-orange-400 border-orange-600/30 w-full" onclick="Modules.world_engine._injectGraphToPhoenix()"><i class="fa-solid fa-fire mr-1"></i>→凤凰创作流</button>
                    <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30 w-full" onclick="Modules.world_engine._injectGraphToWriter()"><i class="fa-solid fa-feather-pointed mr-1"></i>→长篇执笔</button>
                </div>
            </div>`;
        }
        if(t === 'vectors') {
            return `<div class="p-2 text-[10px] text-dim space-y-2">
                <div class="p-2 bg-cyan-900/10 rounded border border-cyan-500/10"><div>状态: <span class="text-green-400">在线</span></div><div>索引: HNSW</div></div>
                <div class="text-center"><div class="text-lg font-bold text-gray-800" id="we-vec-count">0</div><div class="text-[9px] text-dim">总向量</div></div>
            </div>`;
        }
        return '';
    },

    _renderWorkspace: () => {
        const we = Modules.world_engine;
        const t = we.currentTab;

        if(t === 'entities') return `
            <div class="h-11 flex items-center justify-between px-5 bg-[#F1F3F5] border-b border-gray-200 shrink-0">
                <span class="text-sm font-bold text-amber-600 flex items-center gap-2">
                            <i class="fa-solid fa-boxes-stacked text-amber-500"></i>
                            实体详情编辑器
                        </span>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600 hover:text-gray-800" onclick="Modules.world_engine._clearAllEntities()"><i class="fa-solid fa-trash-can mr-1"></i>一键清空</button>
                    <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.world_engine._saveEntity()"><i class="fa-solid fa-cloud-arrow-up mr-1"></i>保存并同步向量库</button>
                </div>
            </div>
            <div class="flex-1 p-6 overflow-y-auto space-y-4">
                <div class="grid grid-cols-3 gap-4">
                    <div class="col-span-2 flex flex-col gap-1">
                        <span class="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                            <i class="fa-solid fa-tag text-amber-400"></i>
                            实体名称
                        </span>
                        <input id="we-ent-name" class="input bg-gray-100 border-gray-300 focus:border-amber-500 font-bold text-lg text-gray-800" placeholder="角色/物品/地点名称">
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                            <i class="fa-solid fa-layer-group text-blue-400"></i>
                            类型
                        </span>
                        <select id="we-ent-type" class="input bg-gray-100 border-gray-300 text-gray-800"><option>人物</option><option>物品</option><option>地点</option><option>情节</option><option>伏笔</option><option>势力</option><option>种族</option><option>魔法</option><option>规则</option><option>文化</option><option>历史</option><option>技法</option></select>
                    </div>
                </div>
                <div id="we-ent-source-badge"></div>
                <div class="flex flex-col gap-1">
                    <span class="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                            <i class="fa-solid fa-bookmark text-indigo-400"></i>
                            分配章节
                        </span>
                    <div class="flex flex-wrap gap-2 p-2 bg-gray-100 rounded-lg border border-gray-200" id="we-ent-chapters">
                        ${(we._chapters||[]).sort((a,b)=>(a.number||0)-(b.number||0)).map(c => {
                            return `<label class="flex items-center gap-1 text-[9px] text-dim cursor-pointer hover:text-gray-800"><input type="checkbox" class="accent-cyan-500 we-ent-chapter-check" data-chapter-id="${c.id}">第${c.number||'?'}章: ${c.title||'未命名'}</label>`;
                        }).join('')}
                    </div>
                </div>
                <div class="flex flex-col gap-1 flex-1">
                    <div class="flex justify-between items-center">
                        <span class="text-xs font-bold text-gray-700 flex items-center gap-2">
                            <i class="fa-solid fa-file-lines text-indigo-400"></i>
                            详细描述 <span class="text-xs text-gray-500 font-normal">(自动嵌入向量库)</span>
                        </span>
                        <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.world_engine._aiExpandEntity()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>AI 扩写</button>
                    </div>
                    <textarea id="we-ent-desc" class="textarea flex-1 bg-gray-100 border-gray-300 focus:border-amber-500 resize-none text-gray-600 leading-relaxed min-h-[300px]" placeholder="在此输入详细描述。保存后将自动同步到向量数据库用于 RAG 检索..."></textarea>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-xs font-bold text-gray-700 flex items-center gap-2">
                            <i class="fa-solid fa-link text-cyan-400"></i>
                            关联实体 <span class="text-xs text-gray-500 font-normal">(逗号分隔，支持 关系:实体名 格式)</span>
                        </span>
                    <input id="we-ent-relations" class="input bg-gray-100 border-gray-300 text-sm text-gray-600" placeholder="例如：师父:张三, 敌对:魔教, 所属:青云门">
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
            <div class="h-11 flex items-center justify-between px-5 bg-[#F1F3F5] border-b border-gray-200 shrink-0">
                <span class="text-xs font-bold text-blue-400"><i class="fa-solid fa-earth-americas mr-1"></i>${catLabels[we.worldCat] || '世界观'}</span>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.world_engine._aiGenWorld()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>AI 生成</button>
                    <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30" onclick="Modules.world_engine._saveWorld()"><i class="fa-solid fa-save mr-1"></i>保存</button>
                </div>
            </div>
            <div class="flex-1 p-0 min-h-0">
                <textarea id="we-world-editor" class="w-full h-full bg-transparent border-none resize-none font-mono text-gray-600 leading-loose focus:outline-none text-sm p-6" placeholder="# ${catLabels[we.worldCat]}\n\n在此详细描述..."></textarea>
            </div>`;
        }

        if(t === 'graph') return `
            <div class="h-11 flex items-center justify-between px-5 bg-[#F1F3F5] border-b border-gray-200 shrink-0">
                <div class="flex items-center gap-3">
                    <span class="text-xs font-bold text-purple-400"><i class="fa-solid fa-circle-nodes mr-1"></i>知识图谱 · 3D网络结构</span>
                    <span class="text-[10px] text-dim" id="we-graph-stats"></span>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.world_engine._refreshRAGContext()"><i class="fa-solid fa-rotate mr-1"></i>刷新RAG上下文</button>
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.world_engine._injectGraphToPhoenix()"><i class="fa-solid fa-fire mr-1"></i>→凤凰流</button>
                    <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30" onclick="Modules.world_engine._injectGraphToWriter()"><i class="fa-solid fa-feather-pointed mr-1"></i>→执笔台</button>
                    <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600 hover:text-gray-800" onclick="Modules.world_engine._clearAllEntities()"><i class="fa-solid fa-trash-can mr-1"></i>一键清空</button>
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.world_engine._exportGraph()"><i class="fa-solid fa-book-open mr-1"></i>导出到阅读</button>
                </div>
            </div>
            <div class="flex-1 relative min-h-0">
                <div id="we-graph-canvas" class="w-full h-full" style="background:#F8F9FA;"></div>
                <div class="absolute top-3 left-3 bg-gray-300 backdrop-blur-sm rounded-lg border border-gray-300 p-3 text-[10px] space-y-1 z-10" id="we-graph-info">
                    <div class="text-purple-400 font-bold text-xs mb-1">图谱统计</div>
                    <div class="text-dim">节点数: <span class="text-gray-800 font-bold" id="we-g-nodes">0</span></div>
                    <div class="text-dim">连线数: <span class="text-gray-800 font-bold" id="we-g-edges">0</span></div>
                    <div class="text-dim mt-1 text-[9px]">拖拽旋转 | 滚轮缩放 | 点击聚焦</div>
                </div>
                <div class="absolute top-3 right-3 bg-gray-300 backdrop-blur-sm rounded-lg border border-gray-300 p-3 text-[9px] space-y-1 z-10">
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
                <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gray-800 backdrop-blur-sm rounded-full border border-gray-300 px-4 py-2 z-10">
                    <button class="btn btn-xs bg-gray-200 text-gray-800 border-gray-300 rounded-full" onclick="Modules.world_engine._graphResetView()"><i class="fa-solid fa-crosshairs mr-1"></i>重置视角</button>
                    <button class="btn btn-xs bg-gray-200 text-gray-800 border-gray-300 rounded-full" id="we-g-physics-btn" onclick="Modules.world_engine._graphTogglePhysics()"><i class="fa-solid fa-atom mr-1"></i>物理模拟 (开启)</button>
                    <button class="btn btn-xs bg-gray-200 text-gray-800 border-gray-300 rounded-full" id="we-g-labels-btn" onclick="Modules.world_engine._graphToggleLabels()"><i class="fa-solid fa-tag mr-1"></i>显示标签</button>
                    <button class="btn btn-xs bg-gray-200 text-gray-800 border-gray-300 rounded-full" id="we-g-rotate-btn" onclick="Modules.world_engine._graphToggleRotate()"><i class="fa-solid fa-rotate mr-1"></i>自动旋转</button>
                </div>
            </div>`;

        if(t === 'vectors') return `
            <div class="h-11 flex items-center justify-between px-5 bg-[#F1F3F5] border-b border-gray-200 shrink-0">
                <span class="text-xs font-bold text-cyan-400"><i class="fa-solid fa-database mr-1"></i>向量数据库浏览器</span>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600 hover:text-gray-800" onclick="Modules.world_engine._clearAllVectors()"><i class="fa-solid fa-trash-can mr-1"></i>一键清空</button>
                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.world_engine._refreshVectors()"><i class="fa-solid fa-rotate mr-1"></i>刷新</button>
                </div>
            </div>
            <div class="flex-1 overflow-auto min-h-0">
                <div class="grid grid-cols-12 gap-4 p-4 text-[10px] text-dim font-bold uppercase border-b border-gray-200">
                    <span class="col-span-2">ID</span><span class="col-span-8">向量内容预览</span><span class="col-span-2 text-right">维度</span>
                </div>
                <div id="we-vec-list" class="p-2 space-y-1 font-mono text-xs"></div>
            </div>`;

        return `<div class="flex-1 flex items-center justify-center text-dim text-sm">选择左侧标签</div>`;
    },

    // ═══ 注入中心 ═══
    _renderInjectCenter: () => {
        return `
            <div class="h-11 flex items-center justify-between px-5 bg-[#F1F3F5] border-b border-gray-200 shrink-0">
                <span class="text-xs font-bold text-green-400"><i class="fa-solid fa-syringe mr-1"></i>注入中心 — 数据中转枢纽</span>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-red-600/15 text-red-400 border-red-600/20 hover:bg-red-600/30" onclick="document.getElementById('we-inject-preview').value='';document.getElementById('we-inject-stats').textContent='0 字'"><i class="fa-solid fa-trash-can mr-1"></i>清除</button>
                    <button class="btn btn-xs bg-gray-100 text-dim" onclick="Utils.copy(document.getElementById('we-inject-preview').value)"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.world_engine._refreshInjectPreview()"><i class="fa-solid fa-rotate mr-1"></i>刷新预览</button>
                </div>
            </div>
            <div class="flex h-full min-h-0">
                <div class="flex-1 flex flex-col border-r border-gray-200 min-w-0">
                    <div class="px-4 py-2 bg-gray-100 border-b border-gray-200 shrink-0 flex items-center justify-between">
                        <span class="text-[10px] text-green-400 font-bold uppercase">注入包预览</span>
                        <span class="text-[9px] text-dim font-mono" id="we-inject-stats">0 字</span>
                    </div>
                    <textarea class="flex-1 bg-transparent border-none p-5 font-mono text-xs text-gray-600 resize-none leading-relaxed focus:outline-none overflow-y-auto" id="we-inject-preview" readonly placeholder="勾选左侧数据源后点击刷新预览..."></textarea>
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
                    <div class="p-3 rounded-lg bg-black/2 border border-gray-200 space-y-1">
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
            <div class="h-11 flex items-center justify-between px-5 bg-[#F1F3F5] border-b border-gray-200 shrink-0">
                <span class="text-xs font-bold text-red-400"><i class="fa-solid fa-rocket mr-1"></i>流水线数据概览 (${steps.length}项)</span>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.world_engine._exportPipelineAll()"><i class="fa-solid fa-book-open mr-1"></i>全部存阅读</button>
                    <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.world_engine.extractFromFusion()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>提取实体</button>
                    <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.world_engine.extractWorldView()"><i class="fa-solid fa-earth-americas mr-1"></i>提取世界观</button>
                </div>
            </div>
            <div class="flex h-full min-h-0">
                <div class="w-52 shrink-0 bg-[#F1F3F5] border-r border-gray-200 overflow-y-auto p-2 space-y-1">
                    ${steps.map(key => `
                        <button class="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-[11px] font-bold transition-all hover:bg-gray-100 border border-transparent hover:border-gray-300 text-${colors[key]||'white'}-400" onclick="Modules.world_engine._viewPipelineStep('${key}')" id="we-pp-btn-${key}">
                            <i class="fa-solid ${icons[key]||'fa-circle'} w-4 text-center text-[10px]"></i>
                            <span class="flex-1 truncate">${labels[key]||key}</span>
                            <span class="text-[9px] text-dim">${pr[key].length}字</span>
                        </button>
                    `).join('')}
                </div>
                <div class="flex-1 flex flex-col min-w-0">
                    <div class="h-9 flex items-center px-4 bg-gray-100 border-b border-gray-200 shrink-0">
                        <span class="text-[10px] font-bold text-dim uppercase" id="we-pp-title">选择左侧步骤查看</span>
                        <button class="btn btn-xs bg-gray-100 text-dim ml-auto" onclick="Utils.copy(document.getElementById('we-pp-content').value)"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                    </div>
                    <textarea class="flex-1 w-full bg-transparent border-none p-5 font-mono text-sm leading-relaxed text-gray-600 resize-none focus:outline-none" id="we-pp-content" readonly placeholder="选择左侧步骤查看流水线结果..."></textarea>
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
        document.querySelectorAll('[id^="we-pp-btn-"]').forEach(btn => { btn.classList.remove('bg-gray-200','border-gray-300'); btn.classList.add('border-transparent'); });
        const ab = document.getElementById('we-pp-btn-' + key);
        if(ab) { ab.classList.add('bg-gray-200','border-gray-300'); ab.classList.remove('border-transparent'); }
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
        const list = Modules.world_engine._cachedEntities || [];
        const el = document.getElementById('we-entity-list');
        if(!el) return;
        let filtered = list.filter(e => !e.id.startsWith('world_'));
        const f = Modules.world_engine._entityFilter;
        const tf = Modules.world_engine._typeFilter;
        const cf = Modules.world_engine._chapterFilter;
        if(f === 'pipeline') filtered = filtered.filter(e => e.source === 'pipeline');
        if(f === 'manual') filtered = filtered.filter(e => e.source !== 'pipeline');
        if(tf) filtered = filtered.filter(e => e.type === tf);
        if(cf === 'none') filtered = filtered.filter(e => !e.chapters || !e.chapters.length);
        if(cf !== 'all' && cf !== 'none') {
            filtered = filtered.filter(e => e.chapters && e.chapters.includes(cf));
        }

        el.innerHTML = filtered.length ? filtered.map(e => {
            const isPipeline = e.source === 'pipeline';
            const iconMap = {'人物':'fa-user','地点':'fa-map-location-dot','物品':'fa-box','情节':'fa-film','伏笔':'fa-eye','势力':'fa-flag','种族':'fa-dragon','魔法':'fa-wand-sparkles','规则':'fa-gavel','文化':'fa-masks-theater','历史':'fa-scroll','技法':'fa-lightbulb'};
            const timeStr = e.updatedAt ? new Date(e.updatedAt).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : '';
            const chapterCount = (e.chapters || []).length;
            return `
            <button class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[11px] font-bold transition-all ${Modules.world_engine.cur===e.id ? 'bg-amber-500/10 text-gray-800 border border-amber-500/20' : 'text-dim hover:bg-gray-100 border border-transparent'}" onclick="Modules.world_engine._loadEntity('${e.id}')">
                <i class="fa-solid ${iconMap[e.type]||'fa-circle'} w-4 text-center text-[10px] text-amber-400/60"></i>
                <span class="truncate flex-1">${e.name}</span>
                ${isPipeline ? '<span class="text-[8px] text-red-400 bg-red-500/10 px-1 py-0.5 rounded shrink-0">流水线</span>' : ''}
                ${chapterCount>0 ? `<span class="text-[8px] text-cyan-400 bg-cyan-500/10 px-1 py-0.5 rounded shrink-0">${chapterCount}章</span>` : ''}
                ${timeStr ? '<span class="text-[8px] text-dim shrink-0">' + timeStr + '</span>' : ''}
                <span class="text-[9px] text-dim bg-gray-100 px-1.5 py-0.5 rounded">${e.type}</span>
            </button>`;
        }).join('') : '<div class="text-[10px] text-dim p-2">暂无实体' + (f !== 'all' || tf || cf !== 'all' ? '（当前有筛选）' : '') + '</div>';
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
            badge.innerHTML = badges[e.source] || '<div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 border border-gray-300 text-[10px] text-dim"><i class="fa-solid fa-pen mr-1"></i>手动创建' + (e.updatedAt ? ' · ' + new Date(e.updatedAt).toLocaleString('zh-CN') : '') + '</div>';
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
        if(isUpdate) { const ex = await DB.get('entities', id); if(ex && ex.source) source = ex.source; }
        Modules.world_engine.cur = id;
        await DB.put('entities', { id, name, type, desc, relations, chapters, source, updatedAt: Date.now() });
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
        
        if(!entities.length) {
            container.innerHTML = '<div class="flex items-center justify-center h-full text-dim text-sm">' + (chapterFilter !== 'all' ? '当前章节暂无实体数据' : '暂无实体数据，请先提取或创建实体') + '</div>';
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
                we.currentTab = 'entities';
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
            <div class="grid grid-cols-12 gap-4 px-4 py-2 rounded hover:bg-gray-100 items-center border-b border-white/3">
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
                <button class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[11px] font-bold transition-all ${we._currentChapter===c.id ? 'bg-cyan-500/10 text-gray-800 border border-cyan-500/20' : 'text-dim hover:bg-gray-100 border border-transparent'}" onclick="Modules.world_engine._loadChapter('${c.id}')">
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
                `<span class="px-2 py-1 rounded text-[9px] bg-gray-100 text-gray-400 border border-gray-300">${name}</span>`
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
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-gray-300 backdrop-blur-sm';
        modal.onclick = (e) => { if(e.target === modal) we._closeImportModal(); };
        modal.innerHTML = `
            <div class="bg-white rounded-2xl border border-gray-300 w-[900px] max-h-[85vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex center text-gray-800">
                            <i class="fa-solid fa-file-import text-lg"></i>
                        </div>
                        <div>
                            <div class="font-bold text-gray-800 text-base">世界观设定导入</div>
                            <div class="text-[10px] text-dim">支持导入并解析结构化世界观设定</div>
                        </div>
                    </div>
                    <button class="btn btn-sm bg-gray-100 text-dim hover:text-gray-800" onclick="Modules.world_engine._closeImportModal()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex-1 flex min-h-0 overflow-hidden">
                    <div class="w-1/2 flex flex-col border-r border-gray-200">
                        <div class="px-4 py-3 border-b border-gray-200 shrink-0">
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
                            <textarea id="we-import-source" class="w-full h-full bg-gray-100 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 resize-none font-mono leading-relaxed" placeholder="在此粘贴或导入世界观设定内容...

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
                        <div class="px-4 py-3 border-t border-gray-200 shrink-0">
                            <button class="btn btn-sm bg-amber-600/20 text-amber-400 border-amber-600/30 w-full font-bold" onclick="Modules.world_engine._parseImportContent()">
                                <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>解析设定
                            </button>
                        </div>
                    </div>
                    <div class="w-1/2 flex flex-col">
                        <div class="px-4 py-3 border-b border-gray-200 shrink-0">
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
                        <div class="px-4 py-3 border-t border-gray-200 shrink-0 space-y-2">
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
                                <select id="we-import-chapter" class="text-[10px] bg-gray-100 border border-gray-300 rounded px-2 py-1 text-dim">
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
                        ${items.map(e => `<span class="px-1.5 py-0.5 rounded text-[9px] bg-gray-100 text-gray-600">${e.name}</span>`).join('')}
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
                        ${items.map(e => `<span class="px-1.5 py-0.5 rounded text-[9px] bg-gray-100 text-gray-600">${e.name}</span>`).join('')}
                    </div>
                </div>`;
            }
            html += `</div></div>`;
        }
        
        if(previewEl) previewEl.innerHTML = html;
        UI.toast('AI智能解析完成');
    }
};
