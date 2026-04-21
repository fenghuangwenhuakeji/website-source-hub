interface SourceConfig {
    label: string;
    icon: string;
    color: string;
    weight: number;
}

interface Document {
    id: string;
    title: string;
    content: string;
    source: string;
    ts: number;
    size: number;
    [key: string]: any;
}

interface DocChunk {
    docId: string;
    title: string;
    content: string;
    source: string;
    ts: number;
}

interface SearchResult {
    id: string;
    title: string;
    content: string;
    source: string;
    score: number;
    highlights?: string[];
}

declare const DB: {
    put: (store: string, data: any) => Promise<any>;
    get: <T = any>(store: string, key: string) => Promise<T | null>;
    getAll: <T = any>(store: string) => Promise<T[]>;
};

const RAGSystem = {
    _searchHistory: [] as string[],
    _documents: [] as Document[],
    _docChunks: [] as DocChunk[],
    _entityCache: null as any[] | null,
    _relationIndex: {} as Record<string, string[]>,
    _chapterEntityIndex: {} as Record<string, string[]>,
    _lastIndexTime: 0 as number,

    _SOURCES: {
        chapter: { label: '章节', icon: 'fa-file-lines', color: 'amber', weight: 1.0 },
        outline: { label: '大纲', icon: 'fa-list-ol', color: 'yellow', weight: 0.95 },
        entity: { label: '实体', icon: 'fa-cube', color: 'blue', weight: 0.9 },
        fusion_book: { label: '拆书', icon: 'fa-book-open-reader', color: 'green', weight: 0.85 },
        pipeline: { label: '流水线', icon: 'fa-industry', color: 'indigo', weight: 0.9 },
        memory: { label: '记忆', icon: 'fa-brain', color: 'purple', weight: 0.8 },
        library: { label: '图书馆', icon: 'fa-book', color: 'orange', weight: 0.7 },
        vector: { label: '向量', icon: 'fa-database', color: 'cyan', weight: 0.75 },
        document: { label: '文档', icon: 'fa-file-alt', color: 'teal', weight: 0.8 },
        knowledge: { label: '知识图谱', icon: 'fa-project-diagram', color: 'pink', weight: 0.95 },
        pattern: { label: '写作模式', icon: 'fa-wand-magic-sparkles', color: 'rose', weight: 0.85 },
        world: { label: '世界观', icon: 'fa-globe', color: 'emerald', weight: 0.9 }
    } as Record<string, SourceConfig>,

    async addDocument(title: string, content: string, source: string = 'document', meta: Record<string, any> = {}): Promise<Document | null> {
        if (!content || !content.trim()) return null;
        const id = 'doc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        const doc: Document = { id, title, content, source, ts: Date.now(), size: content.length, ...meta };

        this._documents.push(doc);
        if (this._documents.length > 200) this._documents = this._documents.slice(-150);

        const chunks = this._chunkText(content, 800, 100);
        for (let i = 0; i < chunks.length; i++) {
            this._docChunks.push({
                docId: id,
                title: title + (chunks.length > 1 ? `[${i + 1}/${chunks.length}]` : ''),
                content: chunks[i],
                source,
                ts: Date.now()
            });
        }
        if (this._docChunks.length > 1000) this._docChunks = this._docChunks.slice(-800);

        try {
            await DB.put('rag_documents', doc);
        } catch (e) {
            try {
                await DB.put('vectors', { id, content: content.slice(0, 8000), tags: [source, title], ts: Date.now() });
            } catch (e2) { }
        }
        return doc;
    },

    _chunkText(text: string, chunkSize: number = 800, overlap: number = 100): string[] {
        if (!text || text.length <= chunkSize) return [text];
        const chunks: string[] = [];
        const paragraphs = text.split(/\n{2,}/);
        let current = '';

        for (const p of paragraphs) {
            if ((current + '\n\n' + p).length > chunkSize && current.length > 0) {
                chunks.push(current.trim());
                current = current.slice(-overlap) + '\n\n' + p;
            } else {
                current = current ? current + '\n\n' + p : p;
            }
        }
        if (current.trim()) chunks.push(current.trim());

        if (chunks.length <= 1 && text.length > chunkSize) {
            const hardChunks: string[] = [];
            for (let i = 0; i < text.length; i += chunkSize - overlap) {
                hardChunks.push(text.slice(i, i + chunkSize));
            }
            return hardChunks;
        }
        return chunks;
    },

    async search(query: string, options: { maxResults?: number; sources?: string[]; minScore?: number } = {}): Promise<SearchResult[]> {
        const { maxResults = 10, sources, minScore = 0.1 } = options;
        const results: SearchResult[] = [];
        const queryLower = query.toLowerCase();
        const queryTerms = queryLower.split(/\s+/);

        const searchIn = (items: (Document | DocChunk)[]) => {
            for (const item of items) {
                if (sources && !sources.includes(item.source)) continue;

                const contentLower = item.content.toLowerCase();
                const titleLower = item.title.toLowerCase();
                let score = 0;

                if (contentLower.includes(queryLower)) score += 0.5;
                if (titleLower.includes(queryLower)) score += 0.3;

                for (const term of queryTerms) {
                    const termCount = (contentLower.match(new RegExp(term, 'g')) || []).length;
                    score += termCount * 0.05;
                }

                const sourceWeight = this._SOURCES[item.source]?.weight || 0.8;
                score *= sourceWeight;

                if (score >= minScore) {
                    results.push({
                        id: 'id' in item ? item.id : (item as DocChunk).docId,
                        title: item.title,
                        content: item.content.slice(0, 500),
                        source: item.source,
                        score
                    });
                }
            }
        };

        searchIn(this._documents);
        searchIn(this._docChunks);

        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults);
    },

    getContext(query: string, maxLen: number = 4000): string {
        const results = this.search(query, { maxResults: 20 });
        let context = '';
        for (const r of results) {
            const addition = `[${r.source}] ${r.title}\n${r.content}\n\n`;
            if (context.length + addition.length > maxLen) break;
            context += addition;
        }
        return context;
    },

    clearIndex(): void {
        this._documents = [];
        this._docChunks = [];
        this._entityCache = null;
        this._relationIndex = {};
        this._chapterEntityIndex = {};
    }
};

(window as any).RAGSystem = RAGSystem;
