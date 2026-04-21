/**
 * 三层记忆系统 + RAG上下文引擎
 * 
 * 架构:
 * 1. WorkingMemory - 当前对话窗口(短期) - 智能压缩
 * 2. SessionMemory - 会话级记忆(中期) - 自动摘要
 * 3. PersistentMemory - 长期记忆(持久化) - IndexedDB
 * 4. RAGContext - 混合检索增强上下文
 */

const memoryEngine = {
    // ========== 工作记忆(短期) ==========
    working: {
        items: [],
        maxTokens: 200000,
        currentTokens: 0,

        add(content, priority, contentType, tags) {
            const item = {
                id: _memId(),
                content,
                priority: priority || 'medium',
                contentType: contentType || _detectType(content),
                tags: tags || [],
                importance: 0.5,
                compressed: false,
                summary: '',
                originalLen: content.length,
                createdAt: Date.now(),
                accessCount: 0
            };
            item.importance = _calcImportance(item);
            const tokens = estimateTokens(content);

            if ((this.currentTokens + tokens) / this.maxTokens > 0.92) {
                this._compress();
            }
            this.items.push(item);
            this.currentTokens += tokens;
            return item;
        },

        getRecent(count) {
            return this.items.slice(-(count || 10));
        },

        getImportant(count) {
            return [...this.items]
                .sort((a, b) => b.importance - a.importance)
                .slice(0, count || 10);
        },

        getByType(type) {
            return this.items.filter(i => i.contentType === type);
        },

        search(query) {
            const q = query.toLowerCase();
            return this.items.filter(i =>
                i.content.toLowerCase().includes(q) ||
                i.tags.some(t => t.toLowerCase().includes(q))
            ).sort((a, b) => b.importance - a.importance);
        },

        getContextWindow(maxTokens) {
            const max = maxTokens || 8000;
            const parts = [];
            let used = 0;
            const recent = this.items.slice(-10);
            const important = [...this.items.slice(0, -10)]
                .sort((a, b) => b.importance - a.importance).slice(0, 5);
            for (const item of [...recent, ...important]) {
                const text = item.compressed && item.summary ? item.summary : item.content;
                const t = estimateTokens(text);
                if (used + t > max) break;
                parts.push(text);
                used += t;
            }
            return parts.join('\n\n');
        },

        _compress() {
            if (!this.items.length) return;
            this.items.forEach(i => { i.importance = _calcImportance(i); });
            const critical = this.items.filter(i => i.priority === 'critical');
            const high = this.items.filter(i => i.priority === 'high');
            const other = this.items.filter(i =>
                i.priority !== 'critical' && i.priority !== 'high'
            ).sort((a, b) => b.importance - a.importance);

            const target = Math.floor(this.maxTokens * 0.7);
            const kept = [...critical];
            let keptTokens = kept.reduce((s, i) => s + estimateTokens(i.content), 0);

            for (const item of high) {
                const t = estimateTokens(item.content);
                if (keptTokens + t <= target) { kept.push(item); keptTokens += t; }
            }
            for (const item of other) {
                const t = estimateTokens(item.content);
                if (keptTokens + t <= target) {
                    kept.push(item); keptTokens += t;
                } else if (!item.compressed && item.content.length > 200) {
                    const compressed = _compressText(item.content, 0.4);
                    item.content = compressed.text;
                    item.summary = compressed.summary;
                    item.compressed = true;
                    const nt = estimateTokens(compressed.text);
                    if (keptTokens + nt <= target) { kept.push(item); keptTokens += nt; }
                }
            }
            this.items = kept;
            this.currentTokens = keptTokens;
        },

        clear() { this.items = []; this.currentTokens = 0; },

        getStats() {
            const types = {};
            this.items.forEach(i => { types[i.contentType] = (types[i.contentType] || 0) + 1; });
            return {
                count: this.items.length,
                tokens: this.currentTokens,
                maxTokens: this.maxTokens,
                usage: Math.round(this.currentTokens / this.maxTokens * 100),
                compressed: this.items.filter(i => i.compressed).length,
                types
            };
        }
    },

    // ========== 会话记忆(中期) ==========
    session: {
        sessions: {},
        currentId: null,

        create(id) {
            const sid = id || 'session_' + Date.now();
            this.sessions[sid] = {
                id: sid,
                items: [],
                summary: '',
                keyPoints: [],
                topics: [],
                createdAt: Date.now()
            };
            this.currentId = sid;
            return this.sessions[sid];
        },

        getCurrent() {
            if (!this.currentId || !this.sessions[this.currentId]) {
                this.create();
            }
            return this.sessions[this.currentId];
        },

        add(content, tags, contentType) {
            const session = this.getCurrent();
            const item = {
                id: _memId(),
                content,
                contentType: contentType || _detectType(content),
                tags: tags || _autoTags(content),
                importance: 0.5,
                compressed: false,
                createdAt: Date.now(),
                accessCount: 0
            };
            item.importance = _calcImportance(item);
            session.items.push(item);
            return item;
        },

        search(query, limit) {
            const session = this.getCurrent();
            const q = query.toLowerCase();
            const qWords = new Set(q.split(/\s+/));
            const scored = [];
            for (const item of session.items) {
                let score = 0;
                if (item.content.toLowerCase().includes(q)) score += 1;
                for (const tag of item.tags) {
                    if (q.includes(tag.toLowerCase())) score += 0.5;
                }
                const words = new Set(item.content.toLowerCase().split(/\s+/));
                const overlap = [...qWords].filter(w => words.has(w)).length;
                score += overlap * 0.3 / Math.max(qWords.size, 1);
                if (score > 0) scored.push({ item, score });
            }
            scored.sort((a, b) => b.score - a.score);
            return scored.slice(0, limit || 10).map(s => s.item);
        },

        generateSummary() {
            const session = this.getCurrent();
            if (!session.items.length) return '';
            const allContent = session.items.map(i => i.content.substring(0, 300)).join('\n');
            session.keyPoints = _extractKeyPoints(allContent);
            session.topics = _extractTopics(allContent);
            session.summary = `会话含${session.items.length}条记忆。`;
            if (session.topics.length) session.summary += ` 话题: ${session.topics.slice(0, 5).join(', ')}。`;
            if (session.keyPoints.length) session.summary += ` 关键: ${session.keyPoints.slice(0, 3).join('; ')}。`;
            return session.summary;
        },

        compressOld(ageMs) {
            const session = this.getCurrent();
            const cutoff = Date.now() - (ageMs || 7200000);
            let count = 0;
            for (const item of session.items) {
                if (item.createdAt < cutoff && !item.compressed && item.content.length > 200) {
                    const c = _compressText(item.content, 0.5);
                    item.content = c.text;
                    item.summary = c.summary;
                    item.compressed = true;
                    count++;
                }
            }
            return count;
        },

        getStats() {
            const session = this.getCurrent();
            const types = {};
            session.items.forEach(i => { types[i.contentType] = (types[i.contentType] || 0) + 1; });
            return {
                sessionId: session.id,
                count: session.items.length,
                hasSummary: !!session.summary,
                topics: session.topics.slice(0, 5),
                types
            };
        }
    },

    // ========== 长期记忆(持久化) ==========
    persistent: {
        _store: 'memory_persistent',

        async init() {
            if (!db._db) await db.init();
        },

        async store(content, category, importance, tags, metadata) {
            await this.init();
            const item = {
                id: _memId(),
                content,
                category: category || 'general',
                importance: importance || 0.5,
                tags: tags || [],
                metadata: metadata || {},
                accessCount: 0,
                createdAt: Date.now(),
                accessedAt: Date.now()
            };
            await db.put(this._store, item);
            return item;
        },

        async search(query, limit, category) {
            await this.init();
            try {
                const all = await db.getAll(this._store);
                const q = query.toLowerCase();
                const scored = [];
                for (const item of all) {
                    if (category && item.category !== category) continue;
                    let score = 0;
                    if (item.content.toLowerCase().includes(q)) score += 1;
                    if (item.tags.some(t => t.toLowerCase().includes(q))) score += 0.5;
                    score += item.importance * 0.3;
                    if (score > 0) scored.push({ ...item, score });
                }
                scored.sort((a, b) => b.score - a.score);
                return scored.slice(0, limit || 10);
            } catch (e) { return []; }
        },

        async getAll() {
            await this.init();
            try { return await db.getAll(this._store); } catch (e) { return []; }
        },

        async remove(id) {
            await this.init();
            try { await db.delete(this._store, id); } catch (e) { /* silent */ }
        },

        async getStats() {
            const all = await this.getAll();
            const cats = {};
            all.forEach(i => { cats[i.category] = (cats[i.category] || 0) + 1; });
            return { count: all.length, categories: cats };
        }
    },

    // ========== RAG上下文引擎 ==========
    rag: {
        documents: [],
        _keywordWeight: 0.3,
        _vectorWeight: 0.7,

        addDocument(content, metadata) {
            this.documents.push({
                id: _memId(),
                content,
                metadata: metadata || {},
                indexedAt: Date.now()
            });
        },

        search(query, topK) {
            const k = topK || 5;
            const results = [];
            const qTerms = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 1));

            for (const doc of this.documents) {
                const docTerms = new Set(doc.content.toLowerCase().split(/\s+/).filter(w => w.length > 1));
                const overlap = [...qTerms].filter(t => docTerms.has(t)).length;
                if (overlap === 0 && !doc.content.toLowerCase().includes(query.toLowerCase())) continue;

                // BM25简化
                const tf = overlap / Math.max(docTerms.size, 1);
                const idf = Math.log(this.documents.length / (overlap + 1) + 1);
                let score = tf * idf;

                // 精确匹配加分
                if (doc.content.toLowerCase().includes(query.toLowerCase())) score *= 1.5;

                // 长度惩罚
                if (doc.content.length > 5000) score *= 0.9;

                results.push({
                    content: doc.content,
                    score,
                    metadata: doc.metadata,
                    source: 'rag'
                });
            }

            results.sort((a, b) => b.score - a.score);
            return results.slice(0, k);
        },

        indexFromLibrary(books) {
            // 将图书馆书籍索引到RAG
            for (const book of books) {
                // 分块索引
                const chunks = this._chunkText(book.content, 1000, 200);
                for (let i = 0; i < chunks.length; i++) {
                    this.addDocument(chunks[i], {
                        bookId: book.id,
                        bookTitle: book.title,
                        chunkIndex: i,
                        totalChunks: chunks.length
                    });
                }
            }
        },

        _chunkText(text, chunkSize, overlap) {
            const chunks = [];
            const size = chunkSize || 1000;
            const lap = overlap || 200;
            for (let i = 0; i < text.length; i += size - lap) {
                chunks.push(text.substring(i, i + size));
                if (i + size >= text.length) break;
            }
            return chunks;
        },

        clear() { this.documents = []; },

        getStats() {
            return {
                documentCount: this.documents.length,
                totalChars: this.documents.reduce((s, d) => s + d.content.length, 0)
            };
        }
    },

    // ========== 统一上下文构建 ==========
    buildContext(query, maxTokens) {
        const max = maxTokens || 8000;
        const parts = [];
        let used = 0;

        const _addPart = (label, text, budget) => {
            if (!text || text.length < 5) return;
            const t = estimateTokens(text);
            const allowed = Math.min(t, budget);
            if (used + allowed > max) return;
            const trimmed = t > allowed ? text.substring(0, allowed * 4) + '...' : text;
            parts.push(`${label}\n${trimmed}`);
            used += estimateTokens(trimmed);
        };

        // 1. 知识图谱上下文 (15%)
        if (typeof knowledgeGraph !== 'undefined') {
            const kgCtx = knowledgeGraph.getContextForQuery(query, 8);
            _addPart('', kgCtx, Math.floor(max * 0.15));
        }

        // 2. RAG检索结果 (20%)
        const ragResults = this.rag.search(query, 3);
        if (ragResults.length) {
            const ragText = '【相关文档】\n' + ragResults.map(r => {
                const src = r.metadata.bookTitle ? `[${r.metadata.bookTitle}]` : '';
                return `${src}\n${r.content.substring(0, 500)}`;
            }).join('\n---\n');
            _addPart('', ragText, Math.floor(max * 0.20));
        }

        // 3. 工作记忆 (25%)
        const wmCtx = this.working.getContextWindow(Math.floor(max * 0.25));
        if (wmCtx) _addPart('【工作记忆】', wmCtx, Math.floor(max * 0.25));

        // 4. 会话记忆 (15%)
        const sessionResults = this.session.search(query, 5);
        if (sessionResults.length) {
            const sessionText = sessionResults.map(i =>
                (i.compressed && i.summary) ? i.summary : i.content.substring(0, 200)
            ).join('\n');
            _addPart('【会话记忆】', sessionText, Math.floor(max * 0.15));
        }

        // 5. 会话摘要 (5%)
        const summary = this.session.getCurrent().summary;
        if (summary) _addPart('【历史摘要】', summary, Math.floor(max * 0.05));

        return {
            context: parts.join('\n\n'),
            tokens: used,
            sources: {
                kg: typeof knowledgeGraph !== 'undefined' ? knowledgeGraph.getStats().entityCount : 0,
                rag: ragResults.length,
                working: this.working.items.length,
                session: sessionResults.length
            }
        };
    },

    // 融合拆书专用上下文
    buildFusionContext(query, sourceTexts, maxTokens) {
        const max = maxTokens || 12000;
        const parts = [];
        let used = 0;

        const _add = (text, budget) => {
            if (!text) return;
            const t = estimateTokens(text);
            if (used + t > max) {
                const trimmed = text.substring(0, (max - used) * 4);
                parts.push(trimmed);
                used = max;
            } else {
                parts.push(text);
                used += t;
            }
        };

        // 1. 知识图谱中的写作元素
        if (typeof knowledgeGraph !== 'undefined') {
            const chars = knowledgeGraph.getImportantEntities(5, ['character']);
            const plots = knowledgeGraph.getImportantEntities(5, ['plot_point']);
            const themes = knowledgeGraph.getImportantEntities(3, ['theme']);
            if (chars.length || plots.length || themes.length) {
                let kgText = '【故事元素图谱】\n';
                if (chars.length) kgText += '角色: ' + chars.map(c => {
                    const rels = knowledgeGraph.getEntityRelations(c.id).slice(0, 2);
                    const relStr = rels.map(r => `${r.type}→${r.direction === 'out' ? r.targetName : r.sourceName}`).join(',');
                    return `${c.name}(${relStr || '独立'})`;
                }).join(' | ') + '\n';
                if (plots.length) kgText += '情节: ' + plots.map(p => p.name).join(' → ') + '\n';
                if (themes.length) kgText += '主题: ' + themes.map(t => t.name).join(', ') + '\n';
                _add(kgText, Math.floor(max * 0.15));
            }
        }

        // 2. RAG检索相关片段
        const ragResults = this.rag.search(query, 3);
        if (ragResults.length) {
            _add('【相关参考】\n' + ragResults.map(r =>
                `[${r.metadata.bookTitle || '文档'}] ${r.content.substring(0, 400)}`
            ).join('\n---\n'), Math.floor(max * 0.20));
        }

        // 3. 之前的拆解结果(工作记忆)
        const deconItems = this.working.getByType('writing');
        if (deconItems.length) {
            _add('【拆解缓存】\n' + deconItems.slice(-5).map(i =>
                i.compressed ? i.summary : i.content.substring(0, 300)
            ).join('\n'), Math.floor(max * 0.20));
        }

        // 4. 融合历史(会话记忆)
        const fusionHistory = this.session.search('融合', 3);
        if (fusionHistory.length) {
            _add('【融合历史】\n' + fusionHistory.map(i =>
                i.content.substring(0, 200)
            ).join('\n'), Math.floor(max * 0.10));
        }

        return {
            context: parts.join('\n\n'),
            tokens: used,
            sources: { rag: ragResults.length, decon: deconItems.length, history: fusionHistory.length }
        };
    },

    // ========== 全局初始化 ==========
    async init() {
        await this.persistent.init();
        this.session.create();
        // 加载长期记忆中的重要项到工作记忆
        const important = await this.persistent.search('', 5);
        for (const item of important) {
            if (item.importance > 0.6) {
                this.working.add(item.content, 'medium', item.category, item.tags);
            }
        }
    },

    getFullStats() {
        return {
            working: this.working.getStats(),
            session: this.session.getStats(),
            rag: this.rag.getStats()
        };
    }
};

// ========== 内部工具函数 ==========

function _memId() {
    return Math.random().toString(36).substring(2, 14) + Date.now().toString(36);
}

function _detectType(content) {
    if (/```|def\s+\w+|function\s+\w+|class\s+\w+/.test(content)) return 'code';
    if (/error|exception|failed|错误|失败/i.test(content)) return 'error';
    if (/请|帮我|需要|want|please/i.test(content)) return 'instruction';
    if (/完成|done|success|结果/i.test(content)) return 'result';
    if (/["「『].*?["」』]|第.+章|角色|情节|人物/.test(content)) return 'writing';
    return 'conversation';
}

function _calcImportance(item) {
    const priorityMap = { critical: 1, high: 0.8, medium: 0.6, low: 0.4, trivial: 0.2 };
    const base = priorityMap[item.priority] || 0.6;
    const accessBonus = Math.min(0.2, (item.accessCount || 0) * 0.02);
    const typeBonus = { instruction: 0.15, error: 0.1, code: 0.1, writing: 0.1, result: 0.05 }[item.contentType] || 0;
    const ageHours = (Date.now() - item.createdAt) / 3600000;
    const decay = Math.max(0.5, 1 - ageHours / 168);
    const tagBonus = Math.min(0.1, (item.tags || []).length * 0.02);
    return Math.min(1, (base + accessBonus + typeBonus + tagBonus) * decay);
}

function _compressText(content, ratio) {
    const target = Math.floor(content.length * (ratio || 0.5));
    const sentences = content.split(/(?<=[。！？.!?])\s*/);
    const importantPatterns = [/错误|error|重要|关键|注意|结论|总结/i];
    const scored = sentences.filter(s => s.trim()).map((s, i) => {
        let score = 0.5;
        if (i < 3 || i >= sentences.length - 3) score += 0.2;
        for (const p of importantPatterns) { if (p.test(s)) score += 0.15; }
        if (s.length > 200) score -= 0.1;
        return { text: s, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const selected = [];
    let len = 0;
    for (const s of scored) {
        if (len + s.text.length <= target) { selected.push(s.text); len += s.text.length; }
    }
    // 恢复原始顺序
    selected.sort((a, b) => content.indexOf(a) - content.indexOf(b));
    const text = selected.join(' ');
    const words = content.toLowerCase().match(/[\u4e00-\u9fff]+|\b\w{3,}\b/g) || [];
    const freq = {};
    words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    const topWords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
    const summary = `关键词: ${topWords.join(', ')}. ${(selected[0] || '').substring(0, 100)}`;
    return { text, summary: summary.substring(0, 200) };
}

function _autoTags(content) {
    const tags = [];
    const techKw = ['python', 'javascript', 'vue', 'api', 'database', 'error', 'bug'];
    const cnKw = ['错误', '问题', '解决', '实现', '功能', '角色', '情节', '融合', '拆解'];
    const words = content.toLowerCase().split(/\s+/);
    for (const kw of techKw) { if (words.some(w => w.includes(kw))) tags.push(kw); }
    for (const kw of cnKw) { if (content.includes(kw)) tags.push(kw); }
    return tags.slice(0, 5);
}

function _extractKeyPoints(content) {
    const points = [];
    const patterns = [
        /[^。！？.!?]*(?:重要|关键|注意|记住|总结)[^。！？.!?]*[。！？.!?]/g,
        /[^。！？.!?]*(?:结论|结果|完成|成功)[^。！？.!?]*[。！？.!?]/g,
        /[^。！？.!?]*(?:错误|问题|失败)[^。！？.!?]*[。！？.!?]/g,
    ];
    for (const p of patterns) {
        const matches = content.match(p) || [];
        points.push(...matches.slice(0, 2));
    }
    return points.slice(0, 5);
}

function _extractTopics(content) {
    const words = content.toLowerCase().match(/[\u4e00-\u9fff]{2,}|\b\w{4,}\b/g) || [];
    const freq = {};
    const stops = new Set(['this', 'that', 'with', 'from', 'have', 'been', 'will', 'would', '的', '了', '是', '在', '和', '有']);
    for (const w of words) { if (!stops.has(w)) freq[w] = (freq[w] || 0) + 1; }
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => e[0]);
}
