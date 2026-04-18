/**
 * RAG 上下文检索引擎 V79.1
 * 多维评分 · 数据源过滤 · 文档索引 · 分块检索
 * 全局对象: RAGSystem
 */
const RAGSystem = {
    _searchHistory: [],
    _documents: [],
    _docChunks: [],
    _entityCache: null,
    _relationIndex: {},
    _chapterEntityIndex: {},
    _lastIndexTime: 0,
    _contextCache: {},
    _lastCacheTime: 0,
    _cacheTTL: 60000,

    _SOURCES: {
        chapter:     { label: '章节', icon: 'fa-file-lines', color: 'amber', weight: 1.0 },
        outline:     { label: '大纲', icon: 'fa-list-ol', color: 'yellow', weight: 0.95 },
        entity:      { label: '实体', icon: 'fa-cube', color: 'blue', weight: 0.9 },
        fusion_book: { label: '拆书', icon: 'fa-book-open-reader', color: 'green', weight: 0.85 },
        pipeline:    { label: '流水线', icon: 'fa-industry', color: 'indigo', weight: 0.9 },
        memory:      { label: '记忆', icon: 'fa-brain', color: 'purple', weight: 0.8 },
        library:     { label: '图书馆', icon: 'fa-book', color: 'orange', weight: 0.7 },
        vector:      { label: '向量', icon: 'fa-database', color: 'cyan', weight: 0.75 },
        document:    { label: '文档', icon: 'fa-file-alt', color: 'teal', weight: 0.8 },
        knowledge:   { label: '知识图谱', icon: 'fa-project-diagram', color: 'pink', weight: 0.95 },
        pattern:     { label: '写作模式', icon: 'fa-wand-magic-sparkles', color: 'rose', weight: 0.85 },
        world:       { label: '世界观', icon: 'fa-globe', color: 'emerald', weight: 0.9 }
    },

    async addDocument(title, content, source = 'document', meta = {}) {
        if (!content || !content.trim()) return null;
        const id = 'doc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        const doc = { id, title, content, source, ts: Date.now(), size: content.length, ...meta };
        this._documents.push(doc);
        if (this._documents.length > 200) this._documents = this._documents.slice(-150);
        const chunks = this._chunkText(content, 800, 100);
        for (let i = 0; i < chunks.length; i++) {
            this._docChunks.push({ docId: id, title: title + (chunks.length > 1 ? `[${i+1}/${chunks.length}]` : ''), content: chunks[i], source, ts: Date.now() });
        }
        if (this._docChunks.length > 1000) this._docChunks = this._docChunks.slice(-800);
        try {
            await DB.put('rag_documents', doc);
        } catch(e) {
            try { await DB.put('vectors', { id, content: content.slice(0, 8000), tags: [source, title], ts: Date.now() }); } catch(e2) {}
        }
        return doc;
    },

    _chunkText(text, chunkSize = 800, overlap = 100) {
        if (!text || text.length <= chunkSize) return [text];
        const chunks = [];
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
            const hardChunks = [];
            for (let i = 0; i < text.length; i += chunkSize - overlap) {
                hardChunks.push(text.slice(i, i + chunkSize));
            }
            return hardChunks;
        }
        return chunks;
    },

    async _loadDocuments() {
        try {
            const docs = await DB.getAll('rag_documents') || [];
            this._documents = docs;
            this._docChunks = [];
            for (const doc of docs) {
                const chunks = this._chunkText(doc.content || '', 800, 100);
                for (let i = 0; i < chunks.length; i++) {
                    this._docChunks.push({ docId: doc.id, title: doc.title + (chunks.length > 1 ? `[${i+1}]` : ''), content: chunks[i], source: doc.source, ts: doc.ts });
                }
            }
        } catch(e) {}
    },

    async search(query, limit = 15, filters = null) {
        const results = [];
        const q = query.toLowerCase();
        const qWords = q.split(/\s+/).filter(w => w.length > 1);
        const enabledSources = filters || Object.keys(this._SOURCES);

        if (enabledSources.includes('chapter')) {
            try {
                const chapters = await DB.getAll('chapters') || [];
                for (const ch of chapters) {
                    const title = ch.title || '未命名';
                    const content = ch.content || '';
                    const outline = ch.outline || '';
                    const text = (title + ' ' + content + ' ' + outline).toLowerCase();
                    const score = this._calcScore(q, qWords, text, 1.0);
                    if (score > 0) {
                        const snippet = this._extractSnippet(content || outline, q, qWords);
                        results.push({ content: snippet, title, source: 'chapter', score, id: ch.id, fullLength: content.length });
                    }
                }
            } catch (e) {}
        }

        if (enabledSources.includes('outline')) {
            try {
                const outlines = await DB.getAll('outlines') || [];
                for (const ol of outlines) {
                    const text = ((ol.title || '') + ' ' + (ol.content || '')).toLowerCase();
                    const score = this._calcScore(q, qWords, text, 0.9);
                    if (score > 0) {
                        results.push({ content: this._extractSnippet(ol.content || '', q, qWords), title: ol.title || '大纲', source: 'outline', score, id: ol.id });
                    }
                }
            } catch (e) {}
        }

        if (enabledSources.includes('entity')) {
            try {
                const entities = await DB.getAll('entities') || [];
                for (const ent of entities) {
                    const relations = ent.relations || [];
                    const relationText = relations.join(' ');
                    const text = ((ent.name || '') + ' ' + (ent.description || '') + ' ' + (ent.type || '') + ' ' + (ent.tags || []).join(' ') + ' ' + relationText).toLowerCase();
                    const score = this._calcScore(q, qWords, text, 0.85);
                    if (score > 0) {
                        let content = `[${ent.type || '实体'}] ${ent.name}: ${(ent.description || '').slice(0, 300)}`;
                        if (relations.length > 0) content += `\n关联: ${relations.slice(0, 5).join(' | ')}`;
                        if (ent.chapterRef && ent.chapterRef.length > 0) content += `\n出现章节: ${ent.chapterRef.slice(0, 10).join(',')}章`;
                        results.push({ content, title: ent.name, source: 'entity', score, id: ent.id, relations, type: ent.type });
                    }
                }
            } catch (e) {}
        }

        if (enabledSources.includes('memory') && typeof MemorySystem !== 'undefined') {
            try {
                const memories = await MemorySystem.searchPersistent(query, 8);
                for (const m of memories) {
                    results.push({ content: m.content.slice(0, 400), title: `记忆/${m.category}`, source: 'memory', score: 0.6 + (m.importance || 0.5) * 0.3, id: m.id });
                }
            } catch (e) {}
        }

        if (enabledSources.includes('library')) {
            try {
                const libBooks = await DB.getAll('library_books') || [];
                for (const b of libBooks) {
                    const text = ((b.name || '') + ' ' + (b.content || '').slice(0, 8000)).toLowerCase();
                    const score = this._calcScore(q, qWords, text, 0.65);
                    if (score > 0) {
                        results.push({ content: this._extractSnippet(b.content || '', q, qWords), title: b.name, source: 'library', score, id: b.id });
                    }
                }
            } catch (e) {}
        }

        if (enabledSources.includes('vector')) {
            try {
                const vectors = await DB.getAll('vectors') || [];
                for (const v of vectors) {
                    const text = ((v.content || '') + ' ' + (v.tags || []).join(' ')).toLowerCase();
                    const score = this._calcScore(q, qWords, text, (this._SOURCES.vector || {}).weight || 0.7);
                    if (score > 0) {
                        results.push({ content: (v.content || '').slice(0, 300), title: v.tags ? v.tags[0] : '向量', source: 'vector', score, id: v.id });
                    }
                }
            } catch (e) {}
        }

        if (enabledSources.includes('document') || enabledSources.includes('pipeline')) {
            for (const chunk of this._docChunks) {
                if (enabledSources.includes(chunk.source) || enabledSources.includes('document')) {
                    const text = ((chunk.title || '') + ' ' + (chunk.content || '')).toLowerCase();
                    const w = (this._SOURCES[chunk.source] || this._SOURCES.document || {}).weight || 0.8;
                    const score = this._calcScore(q, qWords, text, w);
                    if (score > 0) {
                        results.push({ content: this._extractSnippet(chunk.content || '', q, qWords), title: chunk.title, source: chunk.source || 'document', score, id: chunk.docId });
                    }
                }
            }
        }

        results.sort((a, b) => b.score - a.score);
        const final = results.slice(0, limit);

        this._searchHistory.unshift({ query, resultCount: final.length, ts: Date.now() });
        if (this._searchHistory.length > 50) this._searchHistory = this._searchHistory.slice(0, 50);

        if (final.length > 0 && typeof MemorySystem !== 'undefined') {
            MemorySystem.addWorking(`[RAG检索 "${query}" → ${final.length}条结果]`, 'search', 2);
        }

        return final;
    },

    _calcScore(q, qWords, text, baseWeight) {
        let score = 0;
        if (text.includes(q)) score += baseWeight;
        const matched = qWords.filter(w => text.includes(w)).length;
        score += (matched / Math.max(qWords.length, 1)) * baseWeight * 0.6;
        for (const w of qWords) {
            try {
                const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const count = (text.match(new RegExp(escaped, 'g')) || []).length;
                score += Math.log(1 + Math.min(count, 10)) * 0.03;
            } catch(e) {}
        }
        for (const w of qWords) {
            const pos = text.indexOf(w);
            if (pos >= 0 && pos < 200) score += 0.05;
        }
        if (text.length < 50) score *= 0.5;
        return score;
    },

    _extractSnippet(text, q, qWords, maxLen = 400) {
        if (!text || text.length <= maxLen) return text || '';
        const lowerText = text.toLowerCase();
        let bestPos = -1;
        for (const w of [q, ...qWords]) {
            const pos = lowerText.indexOf(w);
            if (pos >= 0) { bestPos = pos; break; }
        }
        if (bestPos < 0) return text.slice(0, maxLen) + '...';
        const start = Math.max(0, bestPos - 80);
        const end = Math.min(text.length, start + maxLen);
        return (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
    },

    async buildContext(query, maxTokens = 4000, template = 'default', prioritySources = null) {
        const results = await this.search(query, 25);
        let context = '', tokens = 0;
        const srcBudget = prioritySources || {};
        const sorted = prioritySources ? results.sort((a, b) => {
            const pa = srcBudget[a.source] || 0;
            const pb = srcBudget[b.source] || 0;
            return pb - pa || b.score - a.score;
        }) : results;

        if (template === 'structured') {
            const groups = {};
            for (const r of sorted) {
                if (!groups[r.source]) groups[r.source] = [];
                groups[r.source].push(r);
            }
            const sortedGroups = Object.entries(groups).sort((a, b) => {
                const wa = (this._SOURCES[a[0]] || {}).weight || 0.5;
                const wb = (this._SOURCES[b[0]] || {}).weight || 0.5;
                return wb - wa;
            });
            for (const [src, items] of sortedGroups) {
                const label = (this._SOURCES[src] || {}).label || src;
                const groupBudget = srcBudget[src] ? Math.floor(maxTokens * srcBudget[src]) : maxTokens;
                let groupTokens = 0;
                context += `\n【${label}】\n`;
                for (const r of items) {
                    const est = Math.ceil(r.content.length / 2);
                    if (tokens + est > maxTokens || groupTokens + est > groupBudget) break;
                    context += `- ${r.title}: ${r.content}\n`;
                    tokens += est;
                    groupTokens += est;
                }
            }
        } else {
            for (const r of sorted) {
                const est = Math.ceil(r.content.length / 2);
                if (tokens + est > maxTokens) break;
                const label = (this._SOURCES[r.source] || {}).label || r.source;
                context += `[${label}/${r.title}] ${r.content}\n---\n`;
                tokens += est;
            }
        }
        return context;
    },

    async searchForWriter(query, limit = 12) {
        const results = await this.search(query, limit * 2, ['chapter', 'memory', 'outline', 'entity', 'document']);
        for (const r of results) {
            if (r.source === 'chapter') r.score *= 1.3;
            if (r.source === 'memory') r.score *= 1.2;
        }
        return results.sort((a, b) => b.score - a.score).slice(0, limit);
    },

    async searchForPhoenix(query, limit = 12) {
        const results = await this.search(query, limit * 2, ['outline', 'entity', 'memory', 'chapter']);
        for (const r of results) {
            if (r.source === 'outline') r.score *= 1.3;
        }
        return results.sort((a, b) => b.score - a.score).slice(0, limit);
    },

    async buildWriterContext(query, chapterNum = null, maxTokens = 5000) {
        let context = '';
        let tokens = 0;

        if (chapterNum) {
            try {
                const chapters = await DB.getAll('chapters') || [];
                const currentChapter = chapters.find(ch => ch.chapterNum === chapterNum || ch.index === chapterNum - 1);
                if (currentChapter && currentChapter.outline) {
                    context += `\n【本章大纲】\n${currentChapter.outline.slice(0, 500)}\n`;
                }
                const prevChapter = chapters.find(c => c.chapterNum === chapterNum - 1 || c.index === chapterNum - 2);
                if (prevChapter && prevChapter.content) {
                    context += `\n【前章结尾】\n${prevChapter.content.slice(-500)}\n`;
                }
            } catch(e) {}
        }

        const multiResults = await this.searchForWriter(query, 15);
        if (multiResults.length > 0) {
            context += '\n【相关检索结果】\n';
            for (const r of multiResults) {
                if (tokens > maxTokens) break;
                const label = (this._SOURCES[r.source] || {}).label || r.source;
                context += `[${label}] ${r.title}: ${r.content.slice(0, 200)}\n---\n`;
                tokens += 150;
            }
        }

        return context;
    },

    async getSourceStats() {
        const stats = {};
        const safeGetAll = async (store) => {
            try { return await DB.getAll(store) || []; } catch(e) { return []; }
        };
        stats.chapters = (await safeGetAll('chapters')).length;
        stats.outlines = (await safeGetAll('outlines')).length;
        stats.entities = (await safeGetAll('entities')).length;
        stats.vectors = (await safeGetAll('vectors')).length;
        stats.library = (await safeGetAll('library_books')).length;
        stats.documents = this._documents.length;
        stats.docChunks = this._docChunks.length;
        return stats;
    },

    clearCache() {
        this._contextCache = {};
        this._lastCacheTime = 0;
    },

    async init() {
        await this._loadDocuments();
        console.log('RAG上下文系统已初始化');
    }
};

window.RAGSystem = RAGSystem;
