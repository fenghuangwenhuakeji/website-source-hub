interface RAGResult {
    id: string;
    title: string;
    content: string;
    source: string;
    score: number;
}

interface SourceInfo {
    label: string;
    icon: string;
    color: string;
}

declare const RAGSystem: {
    _SOURCES: Record<string, SourceInfo>;
    search: (query: string, options?: { maxResults?: number; sources?: string[] }) => RAGResult[];
};

const ragContextModule = {
    _esc(s: string): string {
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    },
    _filters: ['chapter', 'outline', 'entity', 'fusion_book', 'pipeline', 'document', 'memory', 'library', 'vector'],
    _contextMode: 'linear',
    _results: [] as RAGResult[],
    _pinnedToMemory: [] as RAGResult[],

    toggleFilter(source: string, checked: boolean): void {
        if (checked) {
            if (!this._filters.includes(source)) this._filters.push(source);
        } else {
            this._filters = this._filters.filter(f => f !== source);
        }
    },

    async search(query: string): Promise<void> {
        this._results = RAGSystem.search(query, { maxResults: 20, sources: this._filters });
        this.render();
    },

    pinToMemory(result: RAGResult): void {
        if (!this._pinnedToMemory.find(r => r.id === result.id)) {
            this._pinnedToMemory.push(result);
        }
    },

    _renderSidebar(): string {
        const sources = RAGSystem._SOURCES;
        return `<div class="w-72 shrink-0 flex flex-col bg-[#F1F3F5] border-r border-gray-200 overflow-hidden">
            <div class="p-4 border-b border-gray-200">
                <div class="flex items-center gap-2">
                    <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex center text-white">
                        <i class="fa-solid fa-magnifying-glass-chart"></i>
                    </div>
                    <div>
                        <div class="font-bold text-gray-800">RAG 上下文</div>
                        <div class="text-xs text-gray-600">智能检索 · 多源融合</div>
                    </div>
                </div>
            </div>
            <div class="p-3 border-b border-gray-200 space-y-2">
                <div class="text-xs font-bold text-gray-700">数据源</div>
                <div class="space-y-1">
                    ${Object.entries(sources).map(([k, v]) => `
                        <label class="flex items-center gap-3 text-xs cursor-pointer hover:bg-gray-100 px-3 py-2 rounded-lg">
                            <input type="checkbox" class="accent-cyan-500 w-4 h-4" ${this._filters.includes(k) ? 'checked' : ''} onchange="Modules.rag_context.toggleFilter('${k}', this.checked)">
                            <i class="fa-solid ${v.icon} text-${v.color}-400 w-5 text-center"></i>
                            <span class="font-bold text-gray-700">${v.label}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        </div>`;
    },

    _renderMainContent(): string {
        return `<div class="flex-1 flex flex-col">
            <div class="p-4 border-b border-gray-200">
                <div class="flex gap-2">
                    <input class="flex-1 bg-gray-100 border border-gray-300 rounded-lg p-3" placeholder="搜索上下文..." id="rag-search-input">
                    <button class="btn btn-primary" onclick="Modules.rag_context.search(document.getElementById('rag-search-input').value)">
                        <i class="fa-solid fa-search mr-2"></i>搜索
                    </button>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto p-4">
                ${this._results.length === 0 ? '<div class="text-center text-gray-500">输入关键词开始搜索</div>' : 
                    this._results.map(r => `
                        <div class="bg-white border border-gray-200 rounded-lg p-4 mb-3">
                            <div class="flex items-center justify-between mb-2">
                                <span class="font-bold text-sm">${this._esc(r.title)}</span>
                                <span class="text-xs text-gray-500">${r.source}</span>
                            </div>
                            <p class="text-sm text-gray-600">${this._esc(r.content.slice(0, 200))}...</p>
                            <div class="mt-2 flex gap-2">
                                <button class="btn btn-xs" onclick="Modules.rag_context.pinToMemory(${JSON.stringify(r).replace(/"/g, '&quot;')})">
                                    <i class="fa-solid fa-thumbtack mr-1"></i>固定
                                </button>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
        </div>`;
    },

    render(): string {
        return `<div class="flex h-full bg-[#F8F9FA] overflow-hidden">
            ${this._renderSidebar()}
            ${this._renderMainContent()}
        </div>`;
    },

    init(): void {
        console.log('RAG context module initialized');
    }
};

(window as any).Modules = (window as any).Modules || {};
(window as any).Modules.rag_context = ragContextModule;
