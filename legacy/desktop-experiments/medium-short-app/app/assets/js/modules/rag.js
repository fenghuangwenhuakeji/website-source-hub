/**
 * RAG 上下文检索引擎  多维评分  数据源过滤  文档索引  分块检索
 * 全局对象: RAGSystem
 */
// ═══════════════════════════════════════════════════════════════
// RAG 上下文检索引擎 (旗舰版)
// 新增: 多维评分 · 数据源过滤 · 高亮片段 · AI重排序
//       上下文模板 · 检索历史 · 智能摘要 · 向量数据源
//       文档索引 · 分块检索 · TF-IDF · 流水线数据源
//       上下文预算管理 · 模块专用检索 · AI重排序
// ═══════════════════════════════════════════════════════════════
const RAGSystem = {
    _searchHistory: [],
    _documents: [],   // 内存文档索引
    _docChunks: [],   // 分块索引
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

    _entityCache: null,
    _relationIndex: {},
    _chapterEntityIndex: {},
    _lastIndexTime: 0,

    // —— 文档索引 (addDocument — 被流水线/世界引擎等调用) ——
    async addDocument(title, content, source = 'document', meta = {}) {
        if (!content || !content.trim()) return null;
        const id = 'doc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        const doc = { id, title, content, source, ts: Date.now(), size: content.length, ...meta };
        // 存入内存索引
        this._documents.push(doc);
        if (this._documents.length > 200) this._documents = this._documents.slice(-150);
        // 分块索引（大文档拆分为多个chunk提高检索精度）
        const chunks = this._chunkText(content, 800, 100);
        for (let i = 0; i < chunks.length; i++) {
            this._docChunks.push({ docId: id, title: title + (chunks.length > 1 ? `[${i+1}/${chunks.length}]` : ''), content: chunks[i], source, ts: Date.now() });
        }
        if (this._docChunks.length > 1000) this._docChunks = this._docChunks.slice(-800);
        // 持久化到 IndexedDB
        try {
            await DB.put('rag_documents', doc);
        } catch(e) {
            // rag_documents store 可能不存在，降级存到 vectors
            try { await DB.put('vectors', { id, content: content.slice(0, 8000), tags: [source, title], ts: Date.now() }); } catch(e2) {}
        }
        return doc;
    },

    // 分块算法：按段落分块，保留重叠上下文
    _chunkText(text, chunkSize = 800, overlap = 100) {
        if (!text || text.length <= chunkSize) return [text];
        const chunks = [];
        // 优先按段落分割
        const paragraphs = text.split(/\n{2,}/);
        let current = '';
        for (const p of paragraphs) {
            if ((current + '\n\n' + p).length > chunkSize && current.length > 0) {
                chunks.push(current.trim());
                // 保留重叠
                current = current.slice(-overlap) + '\n\n' + p;
            } else {
                current = current ? current + '\n\n' + p : p;
            }
        }
        if (current.trim()) chunks.push(current.trim());
        // 如果段落分割失败（全文一段），按字数硬切
        if (chunks.length <= 1 && text.length > chunkSize) {
            const hardChunks = [];
            for (let i = 0; i < text.length; i += chunkSize - overlap) {
                hardChunks.push(text.slice(i, i + chunkSize));
            }
            return hardChunks;
        }
        return chunks;
    },

    // 加载持久化文档到内存
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
        } catch(e) { /* rag_documents store 可能不存在 */ }
    },

    // —— 核心搜索 (多维评分) ——
    async search(query, limit = 15, filters = null) {
        const results = [];
        const q = query.toLowerCase();
        const qWords = q.split(/\s+/).filter(w => w.length > 1);
        const enabledSources = filters || Object.keys(this._SOURCES);

        // 章节内容
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

        // 大纲
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

        // 实体 (强化版：包含关联检索)
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
                        if (relations.length > 0) {
                            content += `\n关联: ${relations.slice(0, 5).join(' | ')}`;
                        }
                        if (ent.chapterRef && ent.chapterRef.length > 0) {
                            content += `\n出现章节: ${ent.chapterRef.slice(0, 10).join(',')}章`;
                        }
                        results.push({ content, title: ent.name, source: 'entity', score, id: ent.id, relations, type: ent.type });
                    }
                }
            } catch (e) {}
        }

        // 知识图谱 (实体关系网络)
        if (enabledSources.includes('knowledge')) {
            try {
                const entities = await DB.getAll('entities') || [];
                const relationResults = this._searchRelationNetwork(q, qWords, entities);
                for (const r of relationResults) {
                    results.push({ ...r, source: 'knowledge', score: r.score * 0.95 });
                }
            } catch (e) {}
        }

        // 世界观设定
        if (enabledSources.includes('world')) {
            try {
                const entities = await DB.getAll('entities') || [];
                const worldEntities = entities.filter(e => e.id.startsWith('world_') || e.type === '世界观');
                for (const w of worldEntities) {
                    const text = ((w.name || '') + ' ' + (w.description || w.desc || '') + ' ' + (w.content || '')).toLowerCase();
                    const score = this._calcScore(q, qWords, text, 0.9);
                    if (score > 0) {
                        results.push({ 
                            content: `[世界观] ${w.name}: ${(w.description || w.desc || '').slice(0, 400)}`, 
                            title: w.name, 
                            source: 'world', 
                            score, 
                            id: w.id 
                        });
                    }
                }
            } catch (e) {}
        }

        // 写作模式 (从流水线提取的模式)
        if (enabledSources.includes('pattern')) {
            try {
                const patternKeys = await DB.keys('settings') || [];
                const patternKeys_filtered = patternKeys.filter(k => k.startsWith('cycle_patterns_'));
                for (const key of patternKeys_filtered.slice(0, 20)) {
                    const stored = await DB.get('settings', key);
                    if (stored && stored.patterns) {
                        const patternText = JSON.stringify(stored.patterns).toLowerCase();
                        const score = this._calcScore(q, qWords, patternText, 0.8);
                        if (score > 0) {
                            const content = Object.entries(stored.patterns).map(([k, v]) => 
                                `[${k}]\n${(v || []).join('\n')}`
                            ).join('\n\n');
                            results.push({ 
                                content: content.slice(0, 500), 
                                title: `写作模式_${key.split('_').pop()}`, 
                                source: 'pattern', 
                                score, 
                                id: key 
                            });
                        }
                    }
                }
            } catch (e) {}
        }

        // 拆书
        if (enabledSources.includes('fusion_book')) {
            try {
                const books = await DB.get('settings', 'fusion_books');
                if (books && books.items) {
                    for (const book of books.items) {
                        for (const ch of (book.chapters || [])) {
                            const text = ((ch.title || '') + ' ' + (ch.content || '')).toLowerCase();
                            const score = this._calcScore(q, qWords, text, 0.75);
                            if (score > 0) {
                                results.push({ content: this._extractSnippet(ch.content || '', q, qWords), title: `${book.name}/${ch.title}`, source: 'fusion_book', score, id: book.id + '_' + ch.index });
                            }
                        }
                    }
                }
            } catch (e) {}
        }

        // 长期记忆
        if (enabledSources.includes('memory')) {
            try {
                const memories = await MemorySystem.searchPersistent(query, 8);
                for (const m of memories) {
                    results.push({ content: m.content.slice(0, 400), title: `记忆/${m.category}`, source: 'memory', score: 0.6 + (m.importance || 0.5) * 0.3, id: m.id });
                }
            } catch (e) {}
        }

        // 图书馆
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

        // 向量数据库
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

        // 文档索引 (addDocument 存入的内容 + 分块)
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

        // 流水线结果 (凤凰流/拆书融合的实时数据)
        if (enabledSources.includes('pipeline')) {
            try {
                const FB = (typeof Modules !== 'undefined') ? Modules.fusion_book : null;
                if (FB) {
                    const allPr = FB._allPipelineResults || {};
                    const pr = FB._pipelineResults || {};
                    const pipeData = { ...allPr, ...pr };
                    const labels = { left: '左书拆解', right: '右书拆解', compare: '对比分析', fusion: '融合技法', world: '世界观', outline: '细纲', write: '正文' };
                    for (const [key, val] of Object.entries(pipeData)) {
                        if (!val || typeof val !== 'string' || val.length < 20) continue;
                        const text = ((labels[key] || key) + ' ' + val).toLowerCase();
                        const score = this._calcScore(q, qWords, text, 0.9);
                        if (score > 0) {
                            results.push({ content: this._extractSnippet(val, q, qWords, 500), title: '流水线/' + (labels[key] || key), source: 'pipeline', score, id: 'pl_' + key });
                        }
                    }
                }
            } catch(e) {}
        }

        results.sort((a, b) => b.score - a.score);
        const final = results.slice(0, limit);

        // 记录搜索历史
        this._searchHistory.unshift({ query, resultCount: final.length, ts: Date.now() });
        if (this._searchHistory.length > 50) this._searchHistory = this._searchHistory.slice(0, 50);

        // 记入工作记忆
        if (final.length > 0) {
            MemorySystem.addWorking(`[RAG检索 "${query}" → ${final.length}条结果 (来源: ${[...new Set(final.map(r => r.source))].join(',')})]`, 'search', 2);
        }

        return final;
    },

    // —— 多维评分 (TF-IDF + 位置权重 + 频率) ——
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

    // —— 智能片段提取 (高亮关键词周围的上下文) ——
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

    // —— 构建上下文 (带预算管理 + 优先级分配) ——
    async buildContext(query, maxTokens = 4000, template = 'default', prioritySources = null) {
        const results = await this.search(query, 25);
        let context = '', tokens = 0;

        // 优先级源权重分配（模块专用检索时可指定）
        const srcBudget = prioritySources || {};
        // 如果有优先级源，先按优先级排序
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
            // 按源权重排序组
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

    // —— AI 重排序 (对检索结果进行AI质量评估) ——
    async aiRerank(query, results, topK = 10) {
        if (!results || results.length <= topK) return results || [];
        const candidates = results.slice(0, Math.min(results.length, 30));
        const list = candidates.map((r, i) => `[${i}] (${r.source}) ${r.title}: ${r.content.slice(0, 150)}`).join('\n');
        let raw = '';
        try {
            await AI.generate(
                `你是上下文相关性评估引擎。给定查询和候选结果，返回最相关的${topK}个结果编号（按相关性从高到低排列）。

查询: ${query}

候选结果:
${list}

只输出编号数组，如 [0,3,7,1,5]。不要解释。`,
                {}, c => { raw += c; }
            );
            // 解析编号
            const m = raw.match(/\[[\d,\s]+\]/);
            if (m) {
                const indices = JSON.parse(m[0]);
                return indices.filter(i => i >= 0 && i < candidates.length).map(i => candidates[i]).slice(0, topK);
            }
        } catch(e) { console.warn('AI重排序失败:', e); }
        return candidates.slice(0, topK);
    },

    // —— 模块专用检索: 凤凰流 (侧重大纲/融合/流水线) ——
    async searchForPhoenix(query, limit = 12) {
        const results = await this.search(query, limit * 2, ['outline', 'pipeline', 'fusion_book', 'entity', 'memory', 'chapter']);
        // 提升大纲和流水线结果的权重
        for (const r of results) {
            if (r.source === 'outline' || r.source === 'pipeline') r.score *= 1.3;
            if (r.source === 'fusion_book') r.score *= 1.2;
        }
        return results.sort((a, b) => b.score - a.score).slice(0, limit);
    },

    // —— 模块专用检索: 执笔台 (侧重章节/正文/记忆) ——
    async searchForWriter(query, limit = 12) {
        const results = await this.search(query, limit * 2, ['chapter', 'memory', 'outline', 'pipeline', 'entity', 'document']);
        for (const r of results) {
            if (r.source === 'chapter') r.score *= 1.3;
            if (r.source === 'memory') r.score *= 1.2;
        }
        return results.sort((a, b) => b.score - a.score).slice(0, limit);
    },

    // —— 模块专用检索: 世界引擎 (侧重实体/设定/世界观) ——
    async searchForWorld(query, limit = 12) {
        const results = await this.search(query, limit * 2, ['entity', 'fusion_book', 'pipeline', 'document', 'vector', 'library']);
        for (const r of results) {
            if (r.source === 'entity') r.score *= 1.4;
            if (r.source === 'pipeline') r.score *= 1.1;
        }
        return results.sort((a, b) => b.score - a.score).slice(0, limit);
    },

    // —— AI 智能摘要 (将检索结果压缩为精炼上下文) ——
    async aiSummarize(query, maxTokens = 4000) {
        const context = await this.buildContext(query, maxTokens);
        if (!context.trim()) return '';
        let summary = '';
        await AI.generate(
            `你是上下文压缩引擎。将以下检索结果压缩为一段精炼的创作参考上下文，保留所有关键信息（人物、事件、设定、关系），去除冗余。不超过800字。\n\n检索词: ${query}\n\n${context}`,
            {}, c => { summary += c; }
        );
        return summary;
    },

    // —— 获取数据源统计 ——
    async getSourceStats() {
        const stats = {};
        const safeGetAll = async (store) => {
            try {
                if (!App.isDbReady || !App.isDbReady()) return [];
                return await DB.getAll(store) || [];
            } catch(e) { return []; }
        };
        const safeGet = async (store, key) => {
            try {
                if (!App.isDbReady || !App.isDbReady()) return null;
                return await DB.get(store, key);
            } catch(e) { return null; }
        };
        
        stats.chapters = (await safeGetAll('chapters')).length;
        stats.outlines = (await safeGetAll('outlines')).length;
        stats.entities = (await safeGetAll('entities')).length;
        stats.vectors = (await safeGetAll('vectors')).length;
        
        try {
            const books = await safeGet('settings', 'fusion_books');
            stats.fusionBooks = books && books.items ? books.items.length : 0;
            stats.fusionChapters = books && books.items ? books.items.reduce((s, b) => s + (b.chapters || []).length, 0) : 0;
        } catch(e) { stats.fusionBooks = 0; stats.fusionChapters = 0; }
        
        stats.library = (await safeGetAll('library_books')).length;
        
        try { 
            stats.persistent = (await MemorySystem.getAllPersistent()).length; 
        } catch(e) { stats.persistent = 0; }
        
        stats.documents = this._documents.length;
        stats.docChunks = this._docChunks.length;
        stats.pipeline = 0;
        try {
            const FB = (typeof Modules !== 'undefined') ? Modules.fusion_book : null;
            if (FB) {
                const pr = { ...(FB._allPipelineResults || {}), ...(FB._pipelineResults || {}) };
                stats.pipeline = Object.values(pr).filter(v => v && typeof v === 'string' && v.length > 20).length;
            }
        } catch(e) {}
        return stats;
    },

    // —— 关系网络检索 (查找与实体相关的其他实体) ——
    _searchRelationNetwork(q, qWords, entities) {
        const results = [];
        const entityMap = {};
        entities.forEach(e => { if (e.name) entityMap[e.name] = e; });

        for (const ent of entities) {
            if (!ent.relations || ent.relations.length === 0) continue;
            
            const entName = (ent.name || '').toLowerCase();
            const entDesc = (ent.description || '').toLowerCase();
            
            let matched = false;
            let relatedEntities = [];
            
            if (entName.includes(q) || entDesc.includes(q)) {
                matched = true;
            }
            
            for (const rel of ent.relations) {
                const relLower = rel.toLowerCase();
                if (relLower.includes(q)) {
                    matched = true;
                }
                for (const w of qWords) {
                    if (relLower.includes(w)) {
                        matched = true;
                        break;
                    }
                }
                
                const parts = rel.split(':');
                if (parts.length >= 2) {
                    const relatedName = parts[1].trim();
                    if (entityMap[relatedName]) {
                        relatedEntities.push({ name: relatedName, relation: parts[0], entity: entityMap[relatedName] });
                    }
                }
            }
            
            if (matched) {
                let content = `[${ent.type || '实体'}] ${ent.name}: ${(ent.description || '').slice(0, 200)}`;
                if (relatedEntities.length > 0) {
                    content += `\n关联实体: ${relatedEntities.slice(0, 5).map(r => `${r.relation}:${r.name}`).join(' | ')}`;
                }
                results.push({
                    content,
                    title: `关系网络/${ent.name}`,
                    score: 0.8 + (relatedEntities.length * 0.05),
                    id: 'rel_' + ent.id,
                    relatedEntities
                });
            }
        }
        
        return results.slice(0, 10);
    },

    // —— 按章节检索实体 ——
    async searchEntitiesByChapter(chapterNum, limit = 20) {
        const results = [];
        try {
            const entities = await DB.getAll('entities') || [];
            for (const ent of entities) {
                if (ent.chapterRef && ent.chapterRef.includes(chapterNum)) {
                    results.push({
                        content: `[${ent.type || '实体'}] ${ent.name}: ${(ent.description || '').slice(0, 300)}`,
                        title: ent.name,
                        source: 'entity',
                        score: 1.0,
                        id: ent.id,
                        type: ent.type,
                        relations: ent.relations || []
                    });
                }
            }
        } catch(e) {}
        return results.slice(0, limit);
    },

    // —— 按卷检索实体 ——
    async searchEntitiesByVolume(startChapter, endChapter, limit = 50) {
        const results = [];
        try {
            const entities = await DB.getAll('entities') || [];
            for (const ent of entities) {
                if (ent.chapterRef) {
                    const inRange = ent.chapterRef.some(ch => ch >= startChapter && ch <= endChapter);
                    if (inRange) {
                        results.push({
                            content: `[${ent.type || '实体'}] ${ent.name}: ${(ent.description || '').slice(0, 300)}`,
                            title: ent.name,
                            source: 'entity',
                            score: 1.0,
                            id: ent.id,
                            type: ent.type,
                            relations: ent.relations || [],
                            chapters: ent.chapterRef.filter(ch => ch >= startChapter && ch <= endChapter)
                        });
                    }
                }
            }
        } catch(e) {}
        return results.slice(0, limit);
    },

    // —— 构建章节上下文 (用于执笔台) ——
    async buildChapterContext(chapterNum, maxTokens = 3000) {
        let context = '';
        let tokens = 0;

        const chapterEntities = await this.searchEntitiesByChapter(chapterNum, 15);
        if (chapterEntities.length > 0) {
            context += `\n【第${chapterNum}章相关实体】\n`;
            for (const ent of chapterEntities) {
                if (tokens > maxTokens) break;
                context += `- ${ent.content}\n`;
                tokens += Math.ceil(ent.content.length / 2);
            }
        }

        const prevChapter = chapterNum > 1 ? chapterNum - 1 : null;
        if (prevChapter) {
            const prevEntities = await this.searchEntitiesByChapter(prevChapter, 10);
            if (prevEntities.length > 0) {
                context += `\n【前章实体参考】\n`;
                for (const ent of prevEntities) {
                    if (tokens > maxTokens) break;
                    context += `- ${ent.title}: ${(ent.content || '').slice(0, 100)}\n`;
                    tokens += 50;
                }
            }
        }

        try {
            const chapters = await DB.getAll('chapters') || [];
            const currentChapter = chapters.find(ch => ch.chapterNum === chapterNum || ch.index === chapterNum - 1);
            if (currentChapter && currentChapter.outline) {
                context += `\n【本章大纲】\n${currentChapter.outline.slice(0, 500)}\n`;
            }
        } catch(e) {}

        const fusionCtx = await DB.get('settings', 'pipeline_fusion_context');
        if (fusionCtx && fusionCtx.content) {
            context += `\n【融合技法参考】\n${fusionCtx.content.slice(0, 800)}\n`;
        }

        return context;
    },

    // —— 多维度综合检索 (用于执笔台生成) ——
    async searchMultiDimension(query, options = {}) {
        const {
            chapterNum = null,
            volumeRange = null,
            entityTypes = null,
            includeRelations = true,
            maxResults = 20
        } = options;

        let allResults = [];

        if (chapterNum) {
            const chapterEntities = await this.searchEntitiesByChapter(chapterNum, 10);
            allResults = allResults.concat(chapterEntities);
        }

        if (volumeRange && volumeRange.length === 2) {
            const volumeEntities = await this.searchEntitiesByVolume(volumeRange[0], volumeRange[1], 15);
            allResults = allResults.concat(volumeEntities);
        }

        const generalResults = await this.search(query, maxResults, ['entity', 'knowledge', 'world', 'outline', 'pipeline', 'pattern']);
        allResults = allResults.concat(generalResults);

        if (entityTypes && entityTypes.length > 0) {
            allResults = allResults.filter(r => 
                r.type && entityTypes.includes(r.type)
            );
        }

        const seen = new Set();
        const deduped = allResults.filter(r => {
            if (seen.has(r.id)) return false;
            seen.add(r.id);
            return true;
        });

        deduped.sort((a, b) => b.score - a.score);
        return deduped.slice(0, maxResults);
    },

    // —— 构建执笔上下文 (综合版) ——
    async buildWriterContext(query, chapterNum = null, maxTokens = 5000) {
        let context = '';
        let tokens = 0;

        if (chapterNum) {
            const chapterCtx = await this.buildChapterContext(chapterNum, 1500);
            context += chapterCtx;
            tokens += chapterCtx.length / 2;
        }

        const multiResults = await this.searchMultiDimension(query, {
            chapterNum,
            maxResults: 15
        });

        if (multiResults.length > 0) {
            context += '\n【相关检索结果】\n';
            for (const r of multiResults) {
                if (tokens > maxTokens) break;
                const label = (this._SOURCES[r.source] || {}).label || r.source;
                context += `[${label}] ${r.title}: ${r.content.slice(0, 200)}\n---\n`;
                tokens += 150;
            }
        }

        try {
            const outlines = await DB.getAll('outlines') || [];
            if (outlines.length > 0) {
                const latestOutline = outlines.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
                if (latestOutline && latestOutline.content) {
                    context += `\n【当前大纲】\n${latestOutline.content.slice(0, 1000)}\n`;
                }
            }
        } catch(e) {}

        return context;
    },

    // —— 刷新实体缓存 ——
    async refreshEntityCache() {
        try {
            this._entityCache = await DB.getAll('entities') || [];
            this._relationIndex = {};
            this._chapterEntityIndex = {};
            
            for (const ent of this._entityCache) {
                if (ent.relations) {
                    for (const rel of ent.relations) {
                        const parts = rel.split(':');
                        if (parts.length >= 2) {
                            const relatedName = parts[1].trim();
                            if (!this._relationIndex[relatedName]) {
                                this._relationIndex[relatedName] = [];
                            }
                            this._relationIndex[relatedName].push({
                                entity: ent,
                                relation: parts[0]
                            });
                        }
                    }
                }
                
                if (ent.chapterRef) {
                    for (const ch of ent.chapterRef) {
                        if (!this._chapterEntityIndex[ch]) {
                            this._chapterEntityIndex[ch] = [];
                        }
                        this._chapterEntityIndex[ch].push(ent);
                    }
                }
            }
            
            this._lastIndexTime = Date.now();
            return this._entityCache.length;
        } catch(e) {
            console.warn('刷新实体缓存失败:', e);
            return 0;
        }
    },

    // —— 获取实体关系图 ——
    async getEntityRelationGraph(entityName, depth = 2) {
        const graph = { nodes: [], edges: [] };
        const visited = new Set();
        
        const traverse = async (name, currentDepth) => {
            if (currentDepth > depth || visited.has(name)) return;
            visited.add(name);
            
            const entities = await DB.getAll('entities') || [];
            const entity = entities.find(e => e.name === name);
            
            if (!entity) return;
            
            graph.nodes.push({
                id: entity.id,
                name: entity.name,
                type: entity.type || '其他',
                desc: (entity.description || '').slice(0, 100)
            });
            
            if (entity.relations) {
                for (const rel of entity.relations) {
                    const parts = rel.split(':');
                    if (parts.length >= 2) {
                        const relationType = parts[0].trim();
                        const relatedName = parts[1].trim();
                        
                        graph.edges.push({
                            source: name,
                            target: relatedName,
                            relation: relationType
                        });
                        
                        await traverse(relatedName, currentDepth + 1);
                    }
                }
            }
        };
        
        await traverse(entityName, 0);
        return graph;
    },

    // ═══════════════════════════════════════════════════════════════
    // 核心大脑RAG增强 - 智能上下文构建与多维度检索
    // ═══════════════════════════════════════════════════════════════

    _contextCache: {},
    _lastCacheTime: 0,
    _cacheTTL: 60000,

    async buildEnhancedContext(query, options = {}) {
        const {
            moduleName = 'global',
            chapterNum = null,
            volumeRange = null,
            entityTypes = null,
            maxTokens = 6000,
            useCache = true,
            includeMemory = true,
            includeKnowledge = true,
            includePatterns = true,
            priorityBoost = {}
        } = options;

        const cacheKey = `${query}_${moduleName}_${chapterNum}_${maxTokens}`;
        const now = Date.now();

        if (useCache && this._contextCache[cacheKey] && (now - this._lastCacheTime) < this._cacheTTL) {
            return this._contextCache[cacheKey];
        }

        let context = '';
        let tokens = 0;
        const sections = [];

        if (chapterNum) {
            const chapterCtx = await this.buildChapterContext(chapterNum, Math.floor(maxTokens * 0.3));
            if (chapterCtx) {
                sections.push({ label: '章节上下文', content: chapterCtx, priority: 1, tokens: Math.ceil(chapterCtx.length / 2) });
            }
        }

        const multiResults = await this.searchMultiDimension(query, {
            chapterNum,
            volumeRange,
            entityTypes,
            maxResults: 20
        });

        if (multiResults.length > 0) {
            const grouped = {};
            for (const r of multiResults) {
                const src = r.source || 'other';
                if (!grouped[src]) grouped[src] = [];
                grouped[src].push(r);
            }

            for (const [src, items] of Object.entries(grouped)) {
                const boost = priorityBoost[src] || 1.0;
                const label = (this._SOURCES[src] || {}).label || src;
                const content = items.slice(0, 5).map(r => 
                    `• ${r.title}: ${r.content.slice(0, 200)}`
                ).join('\n');
                sections.push({
                    label: `${label}检索`,
                    content,
                    priority: 3 - (boost * 2),
                    tokens: Math.ceil(content.length / 2)
                });
            }
        }

        if (includeMemory && typeof MemorySystem !== 'undefined') {
            const memoryCtx = await MemorySystem.buildBrainContext(query, {
                moduleName,
                chapterId: chapterNum ? `ch_${chapterNum}` : null,
                maxTokens: Math.floor(maxTokens * 0.25),
                includeWorking: true,
                includePersistent: true,
                includeRAG: false,
                includeEntities: false
            });
            if (memoryCtx) {
                sections.push({ label: '三层记忆', content: memoryCtx, priority: 2, tokens: Math.ceil(memoryCtx.length / 2) });
            }
        }

        if (includeKnowledge) {
            try {
                const entities = await DB.getAll('entities') || [];
                const knowledgeGraph = await this._buildKnowledgeContext(query, entities, 10);
                if (knowledgeGraph) {
                    sections.push({ label: '知识图谱', content: knowledgeGraph, priority: 2, tokens: Math.ceil(knowledgeGraph.length / 2) });
                }
            } catch(e) {}
        }

        if (includePatterns) {
            try {
                const patterns = await this._loadWritingPatternsEnhanced();
                if (patterns.length > 0) {
                    const patternCtx = patterns.slice(0, 3).map(p => 
                        `[${p.name}]\n${p.content.slice(0, 300)}`
                    ).join('\n\n');
                    sections.push({ label: '写作模式', content: patternCtx, priority: 4, tokens: Math.ceil(patternCtx.length / 2) });
                }
            } catch(e) {}
        }

        sections.sort((a, b) => a.priority - b.priority);

        for (const section of sections) {
            if (tokens + section.tokens < maxTokens) {
                context += `\n【${section.label}】\n${section.content}\n`;
                tokens += section.tokens;
            }
        }

        this._contextCache[cacheKey] = context;
        this._lastCacheTime = now;

        if (typeof MemorySystem !== 'undefined') {
            MemorySystem.addWorking(`[RAG增强上下文] 查询:"${query?.slice(0, 30)}" 模块:${moduleName} Token:${tokens}`, 'rag', 3, { module: moduleName });
        }

        return context;
    },

    async _buildKnowledgeContext(query, entities, limit) {
        if (!query || !entities.length) return null;

        const queryLower = query.toLowerCase();
        const keywords = queryLower.split(/[\s,，。！？、]+/).filter(k => k.length > 1);

        const relevantEntities = entities.filter(e => !e.id?.startsWith('world_')).map(e => {
            let score = 0;
            const nameLower = (e.name || '').toLowerCase();
            const descLower = (e.desc || e.description || '').toLowerCase();

            if (queryLower.includes(nameLower)) score += 10;
            keywords.forEach(k => {
                if (nameLower.includes(k)) score += 5;
                if (descLower.includes(k)) score += 2;
            });

            if (e.relations?.length) {
                for (const rel of e.relations) {
                    if (rel.toLowerCase().includes(queryLower)) score += 3;
                }
            }

            return { ...e, score };
        }).filter(e => e.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);

        if (relevantEntities.length === 0) return null;

        let context = '';
        for (const entity of relevantEntities) {
            context += `[${entity.type || '实体'}] ${entity.name}: ${(entity.desc || entity.description || '').slice(0, 150)}`;
            if (entity.relations?.length) {
                context += `\n  关联: ${entity.relations.slice(0, 5).join(' | ')}`;
            }
            context += '\n';
        }

        return context;
    },

    async _loadWritingPatternsEnhanced() {
        const patterns = [];

        try {
            const saved = await DB.get('settings', 'writer_patterns');
            if (saved?.patterns) patterns.push(...saved.patterns);
        } catch(e) {}

        try {
            const FB = Modules.fusion_book;
            if (FB) {
                const allPr = FB._allPipelineResults || {};
                const pr = FB._pipelineResults || {};
                const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
                if (fusion) {
                    patterns.push({
                        id: 'fusion_techniques',
                        name: '融合技法精华',
                        source: 'fusion',
                        content: fusion.slice(0, 2000)
                    });
                }
                const compare = (allPr.compare && allPr.compare.trim()) ? allPr.compare : (pr.compare || '');
                if (compare) {
                    patterns.push({
                        id: 'compare_analysis',
                        name: '对比分析结论',
                        source: 'fusion',
                        content: compare.slice(0, 1500)
                    });
                }
            }
        } catch(e) {}

        try {
            const cyclePatterns = await DB.keys('settings') || [];
            const patternKeys = cyclePatterns.filter(k => k.startsWith('cycle_patterns_'));
            for (const key of patternKeys.slice(0, 5)) {
                const stored = await DB.get('settings', key);
                if (stored?.patterns) {
                    patterns.push({
                        id: key,
                        name: `循环模式_${key.split('_').pop()}`,
                        source: 'cycle',
                        content: JSON.stringify(stored.patterns).slice(0, 1000)
                    });
                }
            }
        } catch(e) {}

        return patterns;
    },

    async searchByChapterRange(startChapter, endChapter, query = '', limit = 30) {
        const results = [];

        try {
            const chapters = await DB.getAll('chapters') || [];
            const entities = await DB.getAll('entities') || [];

            for (let ch = startChapter; ch <= endChapter; ch++) {
                const chapter = chapters.find(c => c.chapterNum === ch || c.index === ch - 1);
                if (chapter) {
                    if (chapter.content) {
                        results.push({
                            type: 'chapter_content',
                            chapterNum: ch,
                            title: chapter.title || `第${ch}章`,
                            content: chapter.content.slice(0, 500),
                            source: 'chapter'
                        });
                    }
                    if (chapter.outline) {
                        results.push({
                            type: 'chapter_outline',
                            chapterNum: ch,
                            title: chapter.title || `第${ch}章`,
                            content: chapter.outline.slice(0, 300),
                            source: 'outline'
                        });
                    }
                }

                const chapterEntities = entities.filter(e => 
                    e.chapterRef?.includes(ch) || e.chapters?.includes(`ch_${ch}`)
                );
                for (const entity of chapterEntities) {
                    results.push({
                        type: 'entity',
                        chapterNum: ch,
                        title: entity.name,
                        content: `[${entity.type}] ${entity.name}: ${(entity.desc || '').slice(0, 150)}`,
                        source: 'entity',
                        relations: entity.relations || []
                    });
                }
            }

            if (query) {
                const queryLower = query.toLowerCase();
                return results.filter(r => 
                    r.content.toLowerCase().includes(queryLower) ||
                    r.title.toLowerCase().includes(queryLower)
                ).slice(0, limit);
            }

            return results.slice(0, limit);
        } catch(e) {
            console.warn('章节范围检索失败:', e);
            return [];
        }
    },

    async buildVolumeContext(volumeNum, maxTokens = 4000) {
        const volumeRanges = {
            1: [1, 20],
            2: [21, 40],
            3: [41, 60],
            4: [61, 80],
            5: [81, 100]
        };

        const range = volumeRanges[volumeNum] || [1, 20];
        const results = await this.searchByChapterRange(range[0], range[1], '', 50);

        let context = `\n【第${volumeNum}卷 (第${range[0]}-${range[1]}章) 上下文】\n`;
        let tokens = 0;

        const chapters = results.filter(r => r.type === 'chapter_content' || r.type === 'chapter_outline');
        const entities = results.filter(r => r.type === 'entity');

        if (chapters.length > 0) {
            context += '\n章节概览:\n';
            for (const ch of chapters.slice(0, 10)) {
                const line = `第${ch.chapterNum}章 ${ch.title}: ${ch.content.slice(0, 100)}\n`;
                if (tokens + line.length / 2 < maxTokens * 0.5) {
                    context += line;
                    tokens += line.length / 2;
                }
            }
        }

        if (entities.length > 0) {
            context += '\n卷内实体:\n';
            const entityGroups = {};
            for (const e of entities) {
                const type = e.content.match(/\[([^\]]+)\]/)?.[1] || '其他';
                if (!entityGroups[type]) entityGroups[type] = [];
                entityGroups[type].push(e);
            }
            for (const [type, items] of Object.entries(entityGroups)) {
                if (tokens < maxTokens * 0.8) {
                    context += `${type}: ${items.slice(0, 5).map(e => e.title).join(', ')}\n`;
                    tokens += 20;
                }
            }
        }

        return context;
    },

    async intelligentRetrieval(query, context = {}) {
        const {
            currentChapter = null,
            currentVolume = null,
            recentEntities = [],
            userIntent = 'write'
        } = context;

        const results = {
            primary: [],
            secondary: [],
            contextual: [],
            suggested: []
        };

        const primarySearch = await this.search(query, 10, ['entity', 'knowledge', 'world', 'outline']);
        results.primary = primarySearch.slice(0, 5);

        if (currentChapter) {
            const chapterCtx = await this.buildChapterContext(currentChapter, 1500);
            if (chapterCtx) {
                results.contextual.push({
                    type: 'chapter_context',
                    content: chapterCtx,
                    relevance: 0.9
                });
            }
        }

        if (currentVolume) {
            const volumeCtx = await this.buildVolumeContext(currentVolume, 2000);
            if (volumeCtx) {
                results.contextual.push({
                    type: 'volume_context',
                    content: volumeCtx,
                    relevance: 0.7
                });
            }
        }

        if (recentEntities.length > 0) {
            for (const entityName of recentEntities.slice(0, 5)) {
                const entityResults = await this.search(entityName, 3, ['entity', 'knowledge']);
                results.secondary.push(...entityResults);
            }
        }

        if (userIntent === 'write') {
            const patterns = await this._loadWritingPatternsEnhanced();
            if (patterns.length > 0) {
                results.suggested.push({
                    type: 'writing_patterns',
                    content: patterns.slice(0, 2).map(p => `[${p.name}]\n${p.content.slice(0, 200)}`).join('\n\n'),
                    relevance: 0.8
                });
            }
        }

        return results;
    },

    clearCache() {
        this._contextCache = {};
        this._lastCacheTime = 0;
    },

    async getSystemStats() {
        const stats = await this.getSourceStats();
        const memoryStats = typeof MemorySystem !== 'undefined' ? await MemorySystem.getMemoryStats() : null;

        return {
            rag: stats,
            memory: memoryStats,
            cache: {
                size: Object.keys(this._contextCache).length,
                lastUpdate: this._lastCacheTime
            },
            documents: {
                indexed: this._documents.length,
                chunks: this._docChunks.length
            }
        };
    }
};


