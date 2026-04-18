/**
 * RAG 上下文 UI 模块
 * Modules.rag_context
 */

// ================================================================
// ========== 模块2: RAG 上下文 (旗舰版) ==========
// 数据源过滤 · 多维评分 · 高亮片段 · AI摘要
//       结果高亮 · 批量导出 · 上下文模板切换
// ================================================================
Modules.rag_context = {
    _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; },
    _filters: ['chapter','outline','entity','fusion_book','pipeline','document','memory','library','vector'],
    _contextMode: 'linear',
    _results: [],
    _pinnedToMemory: [],

    render() {
        const RC = this;
        const sources = RAGSystem._SOURCES;
        return `
        <div class="flex h-full bg-[#F8F9FA] overflow-hidden">
            <!-- 左侧面板 -->
            <div class="w-72 shrink-0 flex flex-col bg-[#F1F3F5] border-r border-gray-200 overflow-hidden">
                <!-- 标题 -->
                <div class="p-4 border-b border-gray-200 bg-gradient-to-r from-cyan-900/20 to-transparent">
                    <div class="flex items-center gap-2">
                        <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex center text-gray-800 text-sm shadow-lg shadow-cyan-500/20"><i class="fa-solid fa-magnifying-glass-chart"></i></div>
                        <div>
                            <div class="font-bold text-white text-base">RAG 上下文</div>
                            <div class="text-xs text-gray-200 font-bold">智能检索 · 多源融合 · AI 摘要</div>
                        </div>
                    </div>
                </div>

                <!-- 数据源过滤 -->
                <div class="p-3 border-b border-gray-200 space-y-2">
                    <div class="text-xs font-bold text-gray-700 flex items-center gap-2">
                            <i class="fa-solid fa-database text-cyan-400"></i>
                            数据源
                        </div>
                    <div class="space-y-1">
                        ${Object.entries(sources).map(([k, v]) => `
                            <label class="flex items-center gap-3 text-xs cursor-pointer hover:bg-gray-100 px-3 py-2 rounded-lg border border-transparent hover:border-cyan-200 transition-all">
                                <input type="checkbox" class="accent-cyan-500 w-4 h-4" ${RC._filters.includes(k) ? 'checked' : ''} onchange="Modules.rag_context.toggleFilter('${k}', this.checked)">
                                <i class="fa-solid ${v.icon} text-${v.color}-400 w-5 text-center text-base"></i>
                                <span class="font-bold text-gray-700">${v.label}</span>
                                <span class="ml-auto text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded" id="rag-stat-${k}">-</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <!-- 上下文模式 -->
                <div class="p-3 border-b border-gray-200">
                    <div class="text-xs font-bold text-gray-700 flex items-center gap-2 mb-2">
                            <i class="fa-solid fa-sliders text-indigo-400"></i>
                            上下文模式
                        </div>
                    <div class="flex gap-1">
                        <button class="btn py-2.5 flex-1 ${RC._contextMode === 'linear' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-2 border-cyan-400 shadow-lg shadow-cyan-500/30' : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-cyan-300'} transition-all rounded-lg" onclick="Modules.rag_context._contextMode='linear';Modules.rag_context._refreshMode()">
                            <i class="fa-solid fa-bars mr-1.5"></i>
                            <span class="text-xs font-bold">线性</span>
                        </button>
                        <button class="btn py-2.5 flex-1 ${RC._contextMode === 'structured' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-2 border-indigo-400 shadow-lg shadow-indigo-500/30' : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-300'} transition-all rounded-lg" onclick="Modules.rag_context._contextMode='structured';Modules.rag_context._refreshMode()">
                            <i class="fa-solid fa-sitemap mr-1.5"></i>
                            <span class="text-xs font-bold">结构化</span>
                        </button>
                    </div>
                </div>

                <!-- 检索历史 -->
                <div class="flex-1 overflow-y-auto p-3 space-y-1">
                    <div class="text-xs font-bold text-gray-700 flex items-center gap-2 mb-2">
                            <i class="fa-solid fa-clock-rotate-left text-amber-400"></i>
                            检索历史
                        </div>
                    <div id="rag-history" class="space-y-1">
                        ${(RAGSystem._searchHistory || []).slice(0, 15).map(h => `
                            <div class="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 cursor-pointer px-3 py-2 rounded-lg hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all" onclick="document.getElementById('rag-search-input').value='${RC._esc(h.query)}';Modules.rag_context.doSearch()">
                                <i class="fa-solid fa-clock-rotate-left text-amber-400"></i>
                                <span class="flex-1 truncate font-bold">${RC._esc(h.query)}</span>
                                <span class="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">${h.resultCount}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 底部统计 -->
                <div class="p-3 border-t border-gray-200 space-y-1">
                    <button class="btn py-2.5 w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-400 hover:to-gray-500 text-white border-none shadow-lg shadow-gray-500/30 hover:shadow-gray-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.rag_context.loadStats()">
                        <i class="fa-solid fa-chart-bar mr-2"></i>
                        <span class="text-xs font-bold">刷新统计</span>
                    </button>
                    <button class="btn py-2.5 w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white border-none shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.rag_context.clearAll()">
                        <i class="fa-solid fa-trash-can mr-2"></i>
                        <span class="text-xs font-bold">一键清除全部</span>
                    </button>
                </div>
            </div>

            <!-- 右侧工作区 -->
            <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
                <!-- 搜索栏 -->
                <div class="px-5 py-3 bg-[#F1F3F5] border-b border-gray-200 shrink-0 space-y-2">
                    <div class="flex gap-2">
                        <input id="rag-search-input" class="input flex-1 bg-white border-2 border-gray-300 h-11 px-4 text-base text-gray-800 rounded-lg focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200" placeholder="输入检索关键词..." onkeydown="if(event.key==='Enter')Modules.rag_context.doSearch()">
                        <button class="btn h-11 px-5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white border-none shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.rag_context.doSearch()">
                        <i class="fa-solid fa-search mr-2"></i>
                        <span class="text-sm font-bold">检索</span>
                    </button>
                        <button class="btn h-11 px-5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white border-none shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.rag_context.buildCtx()">
                        <i class="fa-solid fa-layer-group mr-2"></i>
                        <span class="text-sm font-bold">构建</span>
                    </button>
                        <button class="btn h-10 px-4 bg-purple-600/30 text-purple-400 border-purple-600/30 hover:bg-purple-600 hover:text-gray-800 rounded-lg font-bold" onclick="Modules.rag_context.aiSummarize()"><i class="fa-solid fa-brain mr-1"></i>AI摘要</button>
                        <button class="btn h-10 px-4 bg-amber-600/30 text-amber-400 border-amber-600/30 hover:bg-amber-600 hover:text-gray-800 rounded-lg font-bold" onclick="Modules.rag_context.aiRerank()"><i class="fa-solid fa-ranking-star mr-1"></i>AI重排</button>
                    </div>
                </div>

                <!-- 结果区 -->
                <div class="flex-1 overflow-y-auto p-5 space-y-3" id="rag-results">
                    <div class="text-center text-dim text-sm py-20"><i class="fa-solid fa-magnifying-glass text-3xl mb-3 block opacity-20"></i>输入关键词开始检索</div>
                </div>

                <!-- 上下文面板 (可折叠) -->
                <div class="border-t border-gray-200 bg-white shrink-0">
                    <div class="flex items-center justify-between px-5 py-2 cursor-pointer hover:bg-gray-100" onclick="document.getElementById('rag-ctx-body').classList.toggle('hidden')">
                        <span class="text-xs font-bold text-gray-700 flex items-center gap-2">
                            <i class="fa-solid fa-file-code text-indigo-400"></i>
                            构建的上下文
                        </span>
                        <div class="flex gap-2">
                            <button class="btn btn-xs bg-gray-100 text-dim" onclick="event.stopPropagation();Utils.copy(document.getElementById('rag-ctx-content')?.innerText)"><i class="fa-solid fa-copy"></i></button>
                            <button class="btn btn-xs bg-green-600/20 text-green-400" onclick="event.stopPropagation();Modules.rag_context.exportCtx()"><i class="fa-solid fa-book"></i></button>
                            <i class="fa-solid fa-chevron-up text-gray-400 text-xs"></i>
                        </div>
                    </div>
                    <div id="rag-ctx-body" class="hidden px-5 pb-4">
                        <div id="rag-ctx-content" class="bg-gray-100 border border-gray-200 rounded-lg p-4 text-xs text-gray-400 font-mono max-h-60 overflow-y-auto whitespace-pre-wrap">暂无上下文</div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    async init() {
        for (let i = 0; i < 10; i++) {
            if (App.isDbReady && App.isDbReady()) break;
            console.warn(`DB 未就绪，等待初始化... (${i + 1}/10)`);
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        if (!App.isDbReady || !App.isDbReady()) {
            console.error('DB 初始化超时，请刷新页面重试');
            UI.toast('数据库初始化失败，请刷新页面重试', 'error');
            return;
        }
        await this.loadStats();
    },

    toggleFilter(key, checked) {
        if (checked && !this._filters.includes(key)) this._filters.push(key);
        if (!checked) this._filters = this._filters.filter(f => f !== key);
    },

    _refreshMode() {
        const view = document.getElementById('module-view-rag_context');
        if (view) view.innerHTML = this.render();
        this.init();
    },

    async loadStats() {
        const stats = await RAGSystem.getSourceStats();
        const map = {
            chapter: stats.chapters, outline: stats.outlines, entity: stats.entities,
            fusion_book: stats.fusionChapters, pipeline: stats.pipeline,
            document: stats.documents, memory: stats.persistent,
            library: stats.library, vector: stats.vectors
        };
        for (const [k, v] of Object.entries(map)) {
            const el = document.getElementById('rag-stat-' + k);
            if (el) el.textContent = v || 0;
        }
    },

    async doSearch() {
        const input = document.getElementById('rag-search-input');
        const query = input?.value?.trim();
        if (!query) return UI.toast('请输入检索词');

        const resultsEl = document.getElementById('rag-results');
        if (resultsEl) resultsEl.innerHTML = '<div class="text-center text-cyan-400 animate-pulse py-10"><i class="fa-solid fa-spinner fa-spin text-2xl"></i><div class="mt-2 text-xs">检索中...</div></div>';

        const results = await RAGSystem.search(query, 20, this._filters);
        this._results = results;

        if (resultsEl) {
            if (results.length === 0) {
                resultsEl.innerHTML = '<div class="text-center text-dim text-sm py-10">未找到相关结果</div>';
                return;
            }
            const sources = RAGSystem._SOURCES;
            resultsEl.innerHTML = results.map((r, i) => {
                const src = sources[r.source] || { label: r.source, icon: 'fa-file', color: 'gray' };
                const scorePercent = Math.min(100, Math.round(r.score * 50));
                return `
                <div class="bg-white border border-gray-200 rounded-xl p-4 hover:border-cyan-500/30 transition-colors group">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="px-2 py-1 rounded-lg text-xs font-bold bg-${src.color}-50 text-${src.color}-600 border-2 border-${src.color}-200">
                            <i class="fa-solid ${src.icon} mr-1"></i>${src.label}
                        </span>
                        <span class="text-xs font-bold text-gray-800 truncate flex-1">${this._esc(r.title || '')}</span>
                        <span class="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">${r.score.toFixed(2)}</span>
                    </div>
                    <!-- 评分条 -->
                    <div class="h-1 bg-gray-100 rounded-full mb-2 overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style="width:${scorePercent}%"></div>
                    </div>
                    <div class="text-xs text-gray-400 leading-relaxed mb-2 line-clamp-3">${this._esc(r.content || '')}</div>
                    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="btn btn-xs bg-gray-100 text-dim hover:text-gray-800" onclick="Utils.copy(\`${this._esc(r.content || '').replace(/`/g, '\\`')}\`)"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                        <button class="btn btn-xs bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-gray-800" onclick="Modules.rag_context.pinToMemory(${i})"><i class="fa-solid fa-thumbtack mr-1"></i>存记忆</button>
                    </div>
                </div>`;
            }).join('');
        }
    },

    async pinToMemory(idx) {
        const r = this._results[idx];
        if (!r) return;
        MemorySystem.addWorking(`[RAG/${r.source}] ${r.content.slice(0, 300)}`, 'rag_pin', 4, { source: 'rag_pin' });
        UI.toast('已存入工作记忆');
    },

    async buildCtx() {
        const input = document.getElementById('rag-search-input');
        const query = input?.value?.trim();
        if (!query) return UI.toast('请先输入检索词');
        UI.toast('正在构建上下文...');
        const ctx = await RAGSystem.buildContext(query, 4000, this._contextMode);
        const el = document.getElementById('rag-ctx-content');
        if (el) el.textContent = ctx || '无结果';
        document.getElementById('rag-ctx-body')?.classList.remove('hidden');
        UI.toast('上下文构建完成');
    },

    async aiSummarize() {
        const input = document.getElementById('rag-search-input');
        const query = input?.value?.trim();
        if (!query) return UI.toast('请先输入检索词');
        UI.toast('AI 正在摘要...');
        const summary = await RAGSystem.aiSummarize(query);
        const el = document.getElementById('rag-ctx-content');
        if (el) el.textContent = summary || '无结果';
        document.getElementById('rag-ctx-body')?.classList.remove('hidden');
        UI.toast('AI 摘要完成');
    },

    exportCtx() {
        const content = document.getElementById('rag-ctx-content')?.textContent;
        if (!content || content === '暂无上下文') return UI.toast('暂无内容');
        ContextHelper.exportToLibrary('RAG上下文_' + new Date().toLocaleTimeString(), content);
    },

    async clearAll() {
        if (!confirm('确定清除全部RAG数据？包括向量、检索历史、所有索引数据。此操作不可撤销！')) return;
        // 清除向量数据库
        try {
            const vecs = await DB.getAll('vectors') || [];
            for (const v of vecs) { try { await DB.del('vectors', v.id); } catch(e) {} }
        } catch(e) {}
        // 清除RAG文档
        try {
            const docs = await DB.getAll('rag_documents') || [];
            for (const d of docs) { try { await DB.del('rag_documents', d.id); } catch(e) {} }
        } catch(e) {}
        // 清除检索历史
        if (typeof RAGSystem !== 'undefined') {
            RAGSystem._searchHistory = [];
            RAGSystem._documents = [];
        }
        // 刷新UI
        const resultsEl = document.getElementById('rag-results');
        if (resultsEl) resultsEl.innerHTML = '<div class="text-center text-dim text-sm py-20"><i class="fa-solid fa-magnifying-glass text-3xl mb-3 block opacity-20"></i>输入关键词开始检索</div>';
        const ctxEl = document.getElementById('rag-ctx-content');
        if (ctxEl) ctxEl.textContent = '暂无上下文';
        await this.loadStats();
        // 刷新左侧面板
        const view = document.getElementById('module-view-rag_context');
        if (view) { view.innerHTML = this.render(); this.init(); }
        UI.toast('RAG数据已全部清除');
    }
};


