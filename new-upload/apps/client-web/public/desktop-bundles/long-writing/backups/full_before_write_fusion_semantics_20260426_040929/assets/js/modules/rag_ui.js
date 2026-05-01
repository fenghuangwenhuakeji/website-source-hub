/**
 * RAG 上下文中心
 * 目标：选范围 -> 搜关键词 -> 生成可直接给 AI 使用的上下文包。
 */
Modules.rag_context = {
    _filters: ['chapter', 'outline', 'entity', 'knowledge', 'world', 'cycle', 'pattern', 'memory', 'document'],
    _contextMode: 'structured',
    _results: [],
    _lastContext: '',
    _lastQuery: '',
    _stats: {},

    _esc(s) {
        const d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    },

    _js(s) {
        return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
    },

    _sourcePresets: {
        write: {
            label: '写作续写',
            hint: '章节、大纲、实体、世界观、记忆一起查',
            filters: ['chapter', 'outline', 'entity', 'knowledge', 'world', 'cycle', 'pattern', 'memory', 'document']
        },
        world: {
            label: '查设定',
            hint: '人物、地点、规则、关系网络优先',
            filters: ['entity', 'knowledge', 'world', 'cycle', 'outline', 'memory']
        },
        clean: {
            label: '轻量检索',
            hint: '只查章节、大纲、长期记忆',
            filters: ['chapter', 'outline', 'memory']
        },
        library: {
            label: '资料库',
            hint: '文档、图书馆、向量和记忆',
            filters: ['document', 'library', 'vector', 'memory', 'fusion_book']
        }
    },

    render() {
        const sources = RAGSystem._SOURCES || {};
        const history = (RAGSystem._searchHistory || []).slice(0, 12);
        return `
        <div class="flex h-full bg-[#08080a] overflow-hidden">
            <div class="w-72 shrink-0 flex flex-col bg-[#0e0e10] border-r border-white/5 overflow-hidden">
                <div class="p-4 border-b border-white/5 bg-gradient-to-r from-cyan-900/20 to-transparent">
                    <div class="flex items-center gap-2">
                        <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex center text-white text-sm shadow-lg shadow-cyan-500/20"><i class="fa-solid fa-magnifying-glass-chart"></i></div>
                        <div>
                            <div class="font-bold text-white text-sm">RAG 上下文</div>
                            <div class="text-[10px] text-dim">搜资料 · 组上下文 · 存记忆</div>
                        </div>
                    </div>
                </div>

                <div class="p-3 border-b border-white/5 space-y-2">
                    <div class="text-[10px] text-dim font-bold tracking-wider">常用范围</div>
                    <div class="grid grid-cols-2 gap-1.5">
                        ${Object.entries(this._sourcePresets).map(([id, p]) => `
                            <button class="rounded-lg border ${this._presetActive(id) ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-200' : 'border-white/5 bg-white/5 text-dim hover:bg-white/10'} p-2 text-left transition" onclick="Modules.rag_context.applyPreset('${id}')">
                                <div class="text-[10px] font-bold">${p.label}</div>
                                <div class="text-[8px] opacity-70 mt-0.5 leading-relaxed">${p.hint}</div>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="p-3 border-b border-white/5 space-y-2">
                    <div class="flex items-center justify-between">
                        <div class="text-[10px] text-dim font-bold tracking-wider">数据源</div>
                        <button class="text-[9px] text-cyan-300 hover:text-white" onclick="Modules.rag_context.selectAllSources()">全选</button>
                    </div>
                    <div class="space-y-1 max-h-72 overflow-y-auto pr-1">
                        ${Object.entries(sources).map(([k, v]) => `
                            <label class="flex items-center gap-2 text-[10px] cursor-pointer hover:bg-white/5 px-2 py-1 rounded">
                                <input type="checkbox" class="accent-cyan-500" ${this._filters.includes(k) ? 'checked' : ''} onchange="Modules.rag_context.toggleFilter('${k}', this.checked)">
                                <i class="fa-solid ${v.icon} text-${v.color}-400 w-4 text-center"></i>
                                <span class="text-dim">${v.label}</span>
                                <span class="ml-auto text-dim/50 font-mono" id="rag-stat-${k}">-</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto p-3 space-y-1">
                    <div class="text-[10px] text-dim font-bold tracking-wider mb-1">最近检索</div>
                    <div id="rag-history" class="space-y-1">
                        ${history.length ? history.map(h => `
                            <button class="w-full flex items-center gap-2 text-[10px] text-dim hover:text-white px-2 py-1 rounded hover:bg-white/5" onclick="Modules.rag_context.quickSearch('${this._js(h.query)}')">
                                <i class="fa-solid fa-clock-rotate-left text-[8px]"></i>
                                <span class="flex-1 truncate text-left">${this._esc(h.query)}</span>
                                <span class="text-dim/50">${h.resultCount}</span>
                            </button>
                        `).join('') : '<div class="text-[10px] text-dim px-2 py-4 text-center">暂无检索记录</div>'}
                    </div>
                </div>

                <div class="p-3 border-t border-white/5 space-y-1">
                    <button class="btn btn-xs w-full bg-cyan-600/20 text-cyan-300 border border-cyan-500/20" onclick="Modules.rag_context.rebuildIndex()"><i class="fa-solid fa-rotate mr-1"></i>刷新索引</button>
                    <button class="btn btn-xs w-full bg-red-600/15 text-red-300 border border-red-600/25" onclick="Modules.rag_context.clearAll()"><i class="fa-solid fa-trash-can mr-1"></i>清空RAG索引</button>
                </div>
            </div>

            <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div class="bg-[#0d0d0f] border-b border-white/5 px-5 py-4 shrink-0 space-y-3">
                    <div class="flex flex-col xl:flex-row xl:items-center gap-3">
                        <div class="min-w-[240px]">
                            <div class="text-[10px] text-cyan-300/80 font-bold tracking-wider">先搜，再组包</div>
                            <div class="text-sm font-black text-white">你要让 AI 记住什么？</div>
                            <div class="text-[10px] text-dim mt-1">输入角色、章节、设定或冲突点，系统从选中的数据源里找证据。</div>
                        </div>
                        <div class="flex-1 flex gap-2">
                            <input id="rag-search-input" class="input flex-1 bg-black/30 border-white/10 h-10 text-sm text-white" placeholder="例：女主和反派的关系、第12章伏笔、灵气规则..." onkeydown="if(event.key==='Enter')Modules.rag_context.doSearch()">
                            <button class="btn h-10 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold" onclick="Modules.rag_context.doSearch()"><i class="fa-solid fa-search mr-1"></i>检索</button>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <button class="btn btn-xs bg-indigo-600/25 text-indigo-300 border border-indigo-500/25 rounded-lg" onclick="Modules.rag_context.buildCtx()"><i class="fa-solid fa-layer-group mr-1"></i>生成上下文包</button>
                        <button class="btn btn-xs bg-purple-600/25 text-purple-300 border border-purple-500/25 rounded-lg" onclick="Modules.rag_context.aiSummarize()"><i class="fa-solid fa-compress mr-1"></i>AI压缩摘要</button>
                        <button class="btn btn-xs bg-amber-600/25 text-amber-300 border border-amber-500/25 rounded-lg" onclick="Modules.rag_context.aiRerank()"><i class="fa-solid fa-ranking-star mr-1"></i>重排结果</button>
                        <button class="btn btn-xs bg-green-600/20 text-green-300 border border-green-500/25 rounded-lg" onclick="Modules.rag_context.saveContextToMemory()"><i class="fa-solid fa-brain mr-1"></i>上下文存记忆</button>
                        <div class="ml-auto flex items-center gap-1">
                            ${[['structured','分组包','fa-sitemap'],['linear','纯文本','fa-bars']].map(([mode, label, icon]) => `
                                <button class="btn btn-xs ${this._contextMode === mode ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-white/5 text-dim border-white/5'} border rounded-lg" onclick="Modules.rag_context.setMode('${mode}')">
                                    <i class="fa-solid ${icon} mr-1"></i>${label}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-5 gap-2" id="rag-stat-summary">
                        ${this._renderStatCards()}
                    </div>
                </div>

                <div class="flex-1 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] min-h-0">
                    <div class="overflow-y-auto p-5 space-y-3" id="rag-results">
                        ${this._renderResults()}
                    </div>
                    <div class="border-l border-white/5 bg-[#0a0a0c] flex flex-col min-h-0">
                        <div class="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                            <i class="fa-solid fa-file-code text-cyan-400 text-xs"></i>
                            <div class="text-xs font-bold text-white flex-1">生成的上下文包</div>
                            <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.rag_context.copyContext()" title="复制"><i class="fa-solid fa-copy"></i></button>
                            <button class="btn btn-xs bg-green-600/20 text-green-300" onclick="Modules.rag_context.exportCtx()" title="存到资料库"><i class="fa-solid fa-book"></i></button>
                        </div>
                        <div id="rag-ctx-content" class="flex-1 overflow-y-auto p-4 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">${this._esc(this._lastContext || '暂无上下文。先检索，再点「生成上下文包」。')}</div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    _renderStatCards() {
        const s = this._stats || {};
        const cards = [
            ['章节', s.chapters || 0, 'fa-file-lines', 'amber'],
            ['实体/关系', `${s.entities || 0}/${s.knowledge || 0}`, 'fa-project-diagram', 'blue'],
            ['RAG文档', `${s.documents || 0}/${s.docChunks || 0}`, 'fa-file-alt', 'teal'],
            ['记忆', s.persistent || 0, 'fa-brain', 'purple'],
            ['循环', s.cycles || 0, 'fa-rotate', 'violet']
        ];
        return cards.map(([label, val, icon, color]) => `
            <div class="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                <div class="flex items-center gap-2 text-[9px] text-dim"><i class="fa-solid ${icon} text-${color}-300"></i>${label}</div>
                <div class="text-xs font-black text-white mt-1">${val}</div>
            </div>
        `).join('');
    },

    _renderResults() {
        if (!this._results.length) {
            return `<div class="text-center text-dim text-sm py-20">
                <i class="fa-solid fa-magnifying-glass text-3xl mb-3 block opacity-20"></i>
                输入关键词开始检索
            </div>`;
        }
        const sources = RAGSystem._SOURCES || {};
        return this._results.map((r, i) => {
            const src = sources[r.source] || { label: r.source || '未知', icon: 'fa-file', color: 'gray' };
            const scorePercent = Math.min(100, Math.max(4, Math.round((r.score || 0) * 50)));
            return `
            <div class="bg-[#111113] border border-white/5 rounded-lg p-4 hover:border-cyan-500/30 transition-colors">
                <div class="flex items-center gap-2 mb-2">
                    <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-${src.color}-500/15 text-${src.color}-400 border border-${src.color}-500/20"><i class="fa-solid ${src.icon} mr-1"></i>${src.label}</span>
                    <span class="text-xs font-bold text-white truncate flex-1">${this._esc(r.title || '')}</span>
                    <span class="text-[10px] text-dim font-mono">${(r.score || 0).toFixed(2)}</span>
                </div>
                <div class="h-1 bg-white/5 rounded-full mb-2 overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style="width:${scorePercent}%"></div>
                </div>
                <div class="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">${this._esc(r.content || '')}</div>
                <div class="flex gap-1 mt-3">
                    <button class="btn btn-xs bg-white/5 text-dim hover:text-white" onclick="Modules.rag_context.copyResult(${i})"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                    <button class="btn btn-xs bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white" onclick="Modules.rag_context.pinToMemory(${i})"><i class="fa-solid fa-thumbtack mr-1"></i>存记忆</button>
                </div>
            </div>`;
        }).join('');
    },

    async init() {
        await RAGSystem.init?.();
        await this.loadStats();
    },

    _presetActive(id) {
        const p = this._sourcePresets[id];
        if (!p) return false;
        return p.filters.length === this._filters.length && p.filters.every(f => this._filters.includes(f));
    },

    applyPreset(id) {
        const p = this._sourcePresets[id];
        if (!p) return;
        this._filters = [...p.filters];
        this._refresh();
        UI.toast(`已切换到「${p.label}」范围`);
    },

    selectAllSources() {
        this._filters = Object.keys(RAGSystem._SOURCES || {});
        this._refresh();
    },

    toggleFilter(key, checked) {
        if (checked && !this._filters.includes(key)) this._filters.push(key);
        if (!checked) this._filters = this._filters.filter(f => f !== key);
    },

    setMode(mode) {
        this._contextMode = mode;
        this._refresh();
    },

    _refresh() {
        const view = document.getElementById('module-view-rag_context');
        if (view) view.innerHTML = this.render();
        this.init();
    },

    async loadStats() {
        this._stats = await RAGSystem.getSourceStats();
        const map = {
            chapter: this._stats.chapters,
            outline: this._stats.outlines,
            entity: this._stats.entities,
            knowledge: this._stats.knowledge,
            world: this._stats.world,
            fusion_book: this._stats.fusionChapters,
            pipeline: this._stats.pipeline,
            document: this._stats.documents,
            memory: this._stats.persistent,
            library: this._stats.library,
            vector: this._stats.vectors,
            pattern: this._stats.patterns,
            cycle: this._stats.cycles
        };
        for (const [k, v] of Object.entries(map)) {
            const el = document.getElementById('rag-stat-' + k);
            if (el) el.textContent = v || 0;
        }
        const summary = document.getElementById('rag-stat-summary');
        if (summary) summary.innerHTML = this._renderStatCards();
    },

    quickSearch(query) {
        const input = document.getElementById('rag-search-input');
        if (input) input.value = query;
        this.doSearch();
    },

    async doSearch() {
        const input = document.getElementById('rag-search-input');
        const query = input?.value?.trim();
        if (!query) return UI.toast('先输入要查的关键词');
        this._lastQuery = query;
        const resultsEl = document.getElementById('rag-results');
        if (resultsEl) resultsEl.innerHTML = '<div class="text-center text-cyan-400 animate-pulse py-10"><i class="fa-solid fa-spinner fa-spin text-2xl"></i><div class="mt-2 text-xs">正在检索...</div></div>';
        this._results = await RAGSystem.search(query, 20, this._filters);
        if (resultsEl) resultsEl.innerHTML = this._renderResults();
        await this.loadStats();
    },

    async buildCtx() {
        const input = document.getElementById('rag-search-input');
        const query = input?.value?.trim();
        if (!query) return UI.toast('先输入关键词，再生成上下文包');
        UI.toast('正在生成上下文包...');
        const ctx = await RAGSystem.buildContext(query, 4000, this._contextMode, null, this._filters);
        this._lastQuery = query;
        this._lastContext = ctx || '';
        const el = document.getElementById('rag-ctx-content');
        if (el) el.textContent = ctx || '没有找到可用上下文';
        UI.toast('上下文包已生成');
    },

    async aiSummarize() {
        const input = document.getElementById('rag-search-input');
        const query = input?.value?.trim();
        if (!query) return UI.toast('先输入关键词');
        UI.toast('AI 正在压缩上下文...');
        const raw = await RAGSystem.buildContext(query, 5000, 'structured', null, this._filters);
        if (!raw.trim()) return UI.toast('没有可压缩的上下文');
        let summary = '';
        await AI.generate(
            `你是小说创作上下文压缩器。把下面资料压成可直接给AI续写使用的上下文包，保留人物状态、世界规则、伏笔、章节事实、禁写点。不要解释过程，不超过900字。\n\n检索词：${query}\n\n${raw}`,
            {}, c => { summary += c; }
        );
        this._lastQuery = query;
        this._lastContext = summary;
        const el = document.getElementById('rag-ctx-content');
        if (el) el.textContent = summary || '无结果';
        UI.toast('压缩摘要已生成');
    },

    async aiRerank() {
        const input = document.getElementById('rag-search-input');
        const query = input?.value?.trim() || this._lastQuery;
        if (!query) return UI.toast('先检索一次');
        if (!this._results.length) await this.doSearch();
        if (!this._results.length) return UI.toast('没有可重排的结果');
        UI.toast('AI 正在重排结果...');
        this._results = await RAGSystem.aiRerank(query, this._results, 10);
        const resultsEl = document.getElementById('rag-results');
        if (resultsEl) resultsEl.innerHTML = this._renderResults();
        UI.toast('结果已按相关性重排');
    },

    copyResult(idx) {
        const r = this._results[idx];
        if (!r) return;
        Utils.copy(r.content || '');
    },

    pinToMemory(idx) {
        const r = this._results[idx];
        if (!r) return;
        MemorySystem.addWorking(`[RAG/${r.source}] ${r.title}\n${(r.content || '').slice(0, 800)}`, 'rag_pin', 4, {
            source: 'rag_pin',
            tags: ['rag', r.source].filter(Boolean)
        });
        UI.toast('已存入工作记忆');
    },

    saveContextToMemory() {
        const content = this._lastContext || document.getElementById('rag-ctx-content')?.textContent || '';
        if (!content || content.includes('暂无上下文')) return UI.toast('先生成上下文包');
        MemorySystem.addWorking(`[RAG上下文包] ${this._lastQuery || '未命名'}\n${content.slice(0, 1200)}`, 'rag_context', 5, {
            source: 'rag_context',
            module: 'rag',
            tags: ['rag', 'context_pack']
        });
        UI.toast('上下文包已存入工作记忆');
    },

    copyContext() {
        const content = this._lastContext || document.getElementById('rag-ctx-content')?.textContent || '';
        if (!content || content.includes('暂无上下文')) return UI.toast('暂无上下文');
        Utils.copy(content);
    },

    exportCtx() {
        const content = this._lastContext || document.getElementById('rag-ctx-content')?.textContent || '';
        if (!content || content.includes('暂无上下文')) return UI.toast('暂无内容');
        if (typeof ContextHelper !== 'undefined' && ContextHelper.exportToLibrary) {
            ContextHelper.exportToLibrary('RAG上下文_' + (this._lastQuery || new Date().toLocaleTimeString()), content);
        } else {
            Utils.copy(content);
            UI.toast('已复制上下文');
        }
    },

    async rebuildIndex() {
        const info = await RAGSystem.rebuildIndex();
        await this.loadStats();
        UI.toast(`索引已刷新：${info.documents} 文档 / ${info.chunks} 分块`);
    },

    async clearAll() {
        if (!confirm('确定清空 RAG 索引？章节、实体、长期记忆不会删除，只删除 RAG 文档索引、向量和检索历史。')) return;
        try {
            const vecs = await DB.getAll('vectors') || [];
            for (const v of vecs) await DB.del('vectors', v.id);
        } catch(e) {}
        try {
            const docs = await DB.getAll('rag_documents') || [];
            for (const d of docs) await DB.del('rag_documents', d.id);
        } catch(e) {}
        RAGSystem._searchHistory = [];
        RAGSystem._documents = [];
        RAGSystem._docChunks = [];
        this._results = [];
        this._lastContext = '';
        this._refresh();
        UI.toast('RAG索引已清空');
    }
};
