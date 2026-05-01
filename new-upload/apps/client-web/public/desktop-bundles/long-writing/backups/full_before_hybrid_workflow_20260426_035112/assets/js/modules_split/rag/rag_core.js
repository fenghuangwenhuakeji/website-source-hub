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
        world:       { label: '世界观', icon: 'fa-globe', color: 'emerald', weight: 0.9 },
        cycle:       { label: '循环融合', icon: 'fa-rotate', color: 'violet', weight: 1.0 }
    },

    _entityCache: null,
    _relationIndex: {},
    _chapterEntityIndex: {},
    _lastIndexTime: 0,
    _cycleCache: null,
    _lastCycleIndexTime: 0,
    _inited: false,

    async init(force = false) {
        if (this._inited && !force) return { documents: this._documents.length, chunks: this._docChunks.length };
        await this._loadDocuments();
        this._inited = true;
        return { documents: this._documents.length, chunks: this._docChunks.length };
    },

    async rebuildIndex() {
        await this._loadDocuments();
        return { documents: this._documents.length, chunks: this._docChunks.length };
    },

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
        if (!this._inited) await this.init();
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

        // 循环融合 (Cycle-level 技法精华 + NEXUS四状态机)
        if (enabledSources.includes('cycle')) {
            try {
                const cycles = await DB.getAll('cycles') || [];
                for (const c of cycles) {
                    const text = ((c.fusionEssence || '') + ' ' + (c.nexusCHR || '') + ' ' + (c.nexusWLD || '') + ' ' + (c.nexusFOE || '') + ' ' + (c.nexusEMO || '')).toLowerCase();
                    const score = this._calcScore(q, qWords, text, 1.0);
                    if (score > 0) {
                        const cycleNum = c.cycleNum || Math.ceil((c.endChapter || 0) / 5);
                        const content = `[循环${cycleNum} · 第${c.startChapter}-${c.endChapter}章]\n${(c.fusionEssence || '').slice(0, 400)}\n[CHR] ${(c.nexusCHR || '').slice(0, 200)}\n[WLD] ${(c.nexusWLD || '').slice(0, 200)}`;
                        results.push({ content, title: `循环融合_${cycleNum}`, source: 'cycle', score, id: c.id, cycleId: c.id, startChapter: c.startChapter, endChapter: c.endChapter });
                    }
                }
            } catch (e) {}
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

    // —— 循环检索 (专门搜索cycles store) ——
    async searchCycles(query, limit = 10) {
        const results = [];
        const q = query.toLowerCase();
        const qWords = q.split(/\s+/).filter(w => w.length > 1);
        try {
            const cycles = await DB.getAll('cycles') || [];
            for (const c of cycles) {
                const text = ((c.fusionEssence || '') + ' ' + (c.nexusCHR || '') + ' ' + (c.nexusWLD || '') + ' ' + (c.nexusFOE || '') + ' ' + (c.nexusEMO || '') + ' ' + (c.entityNames || []).join(' ')).toLowerCase();
                const score = this._calcScore(q, qWords, text, 1.0);
                if (score > 0) {
                    const cycleNum = c.cycleNum || Math.ceil((c.endChapter || 0) / 5);
                    results.push({
                        content: `[循环${cycleNum} · 第${c.startChapter}-${c.endChapter}章]\n${(c.fusionEssence || '').slice(0, 600)}\n[CHR] ${(c.nexusCHR || '').slice(0, 200)}\n[WLD] ${(c.nexusWLD || '').slice(0, 200)}\n[FOE] ${(c.nexusFOE || '').slice(0, 200)}\n[EMO] ${(c.nexusEMO || '').slice(0, 200)}`,
                        title: `循环融合_${cycleNum}`,
                        source: 'cycle',
                        score,
                        id: c.id,
                        cycleId: c.id,
                        startChapter: c.startChapter,
                        endChapter: c.endChapter,
                        cycleNum
                    });
                }
            }
        } catch (e) { console.warn('循环检索失败:', e); }
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, limit);
    },

    // —— 按章节号获取覆盖该章节的循环上下文 ——
    async getCycleContextForChapter(chapterNum) {
        if (!chapterNum) return '';
        try {
            const cycles = await DB.getAll('cycles') || [];
            const covering = cycles.filter(c => chapterNum >= (c.startChapter || 1) && chapterNum <= (c.endChapter || 999));
            if (covering.length === 0) return '';
            covering.sort((a, b) => (b.endChapter - b.startChapter) - (a.endChapter - a.startChapter));
            const c = covering[0];
            const cycleNum = c.cycleNum || Math.ceil((c.endChapter || 0) / 5);
            return `[循环融合 · 第${c.startChapter}-${c.endChapter}章]\n${(c.fusionEssence || '').slice(0, 800)}\n[CHR] ${(c.nexusCHR || '').slice(0, 150)}\n[WLD] ${(c.nexusWLD || '').slice(0, 150)}\n[FOE] ${(c.nexusFOE || '').slice(0, 150)}\n[EMO] ${(c.nexusEMO || '').slice(0, 150)}`;
        } catch (e) { return ''; }
    },

    // —— NEXUS语义标注：从文本中提取四状态机标签 ——
    _annotateNEXUS(text) {
        if (!text) return { chr: [], wld: [], foe: [], emo: [], tech: [] };
        const tags = { chr: [], wld: [], foe: [], emo: [], tech: [] };
        const chrMatch = text.match(/【?CHR[角色状态]*[】:]\s*([^【\n]+)/gi);
        if (chrMatch) tags.chr = chrMatch.map(m => m.replace(/【?CHR[角色状态]*[】:]\s*/i, '').trim()).filter(Boolean);
        const wldMatch = text.match(/【?WLD[世界规则]*[】:]\s*([^【\n]+)/gi);
        if (wldMatch) tags.wld = wldMatch.map(m => m.replace(/【?WLD[世界规则]*[】:]\s*/i, '').trim()).filter(Boolean);
        const foeMatch = text.match(/【?FOE[伏笔网络]*[】:]\s*([^【\n]+)/gi);
        if (foeMatch) tags.foe = foeMatch.map(m => m.replace(/【?FOE[伏笔网络]*[】:]\s*/i, '').trim()).filter(Boolean);
        const emoMatch = text.match(/【?EMO[情绪锚点]*[】:]\s*([^【\n]+)/gi);
        if (emoMatch) tags.emo = emoMatch.map(m => m.replace(/【?EMO[情绪锚点]*[】:]\s*/i, '').trim()).filter(Boolean);
        const techPatterns = ['黄金螺旋', '三幕结构', '起承转合', '钩子', '伏笔', '反转', '爆点', '节奏', '张力', '代入感', '画面感', '情绪曲线'];
        for (const p of techPatterns) {
            if (text.includes(p)) tags.tech.push(p);
        }
        return tags;
    },

    // —— 混合评分 (BM25 + NEXUS标签匹配 + 循环关联) ——
    _hybridScore(q, qWords, text, baseWeight, nexusTags = null, cycleId = null) {
        let score = this._calcScore(q, qWords, text, baseWeight);
        // NEXUS标签匹配加分
        if (nexusTags) {
            const allTags = [...nexusTags.chr, ...nexusTags.wld, ...nexusTags.foe, ...nexusTags.emo, ...nexusTags.tech];
            for (const tag of allTags) {
                const tagLower = tag.toLowerCase();
                if (q.includes(tagLower) || qWords.some(w => tagLower.includes(w))) score += 0.15;
            }
        }
        // 循环关联加分
        if (cycleId && text.includes(cycleId)) score += 0.1;
        return score;
    },

    // —— 多级智能摘要 (Layered Summarization) ——
    async _compressContext(results, maxTokens = 3000) {
        if (!results || results.length === 0) return '';
        const totalLen = results.reduce((s, r) => s + (r.content?.length || 0), 0);
        if (totalLen <= maxTokens * 2) {
            return results.map(r => `[${(this._SOURCES[r.source] || {}).label || r.source}] ${r.title}\n${r.content}`).join('\n---\n');
        }
        // 分层压缩策略
        const sorted = [...results].sort((a, b) => b.score - a.score);
        const tier1 = sorted.slice(0, Math.min(3, Math.ceil(sorted.length * 0.2)));  // 最高优先级：完整保留
        const tier2 = sorted.slice(tier1.length, tier1.length + Math.min(5, Math.ceil(sorted.length * 0.3))); // 中优先级：截断保留
        const tier3 = sorted.slice(tier1.length + tier2.length); // 低优先级：AI摘要
        let ctx = tier1.map(r => `[${(this._SOURCES[r.source] || {}).label || r.source}] ${r.title}\n${r.content}`).join('\n---\n');
        if (tier2.length > 0) {
            ctx += '\n---\n' + tier2.map(r => `[${(this._SOURCES[r.source] || {}).label || r.source}] ${r.title}\n${r.content.slice(0, 300)}${r.content.length > 300 ? '...' : ''}`).join('\n---\n');
        }
        if (tier3.length > 0) {
            const compressText = tier3.map(r => `[${r.source}] ${r.title}: ${r.content.slice(0, 500)}`).join('\n');
            let summary = '';
            try {
                await AI.generate(
                    `你是上下文压缩引擎。将以下${tier3.length}条检索结果压缩为一段精炼的创作参考，保留关键信息（人物、设定、技法要点、伏笔、情绪节奏），不超过300字：\n\n${compressText.slice(0, 4000)}`,
                    {}, c => { summary += c; }
                );
            } catch (e) {}
            if (summary) ctx += '\n\n[AI压缩摘要]\n' + summary;
        }
        return ctx;
    },

    // ★ Phase 3: 自动注入上下文构建（供 writer/web_chat 调用）
    async buildAutoInjectContext(options = {}) {
        const {
            query = '',
            chapterNum = null,
            maxTokens = 4000,
            mode = 'write', // write / chat / world
            includeCycles = true,
            includeEntities = true,
            includeWorld = true,
            includeOutline = true,
            includePatterns = true
        } = options;

        const proj = await GenesisCore.getActiveProject();
        const projName = proj ? proj.name : '未命名项目';

        let context = `【项目: ${projName}】\n`;
        let tokens = 20;

        const filters = [];
        if (includeEntities) filters.push('entity', 'knowledge');
        if (includeWorld) filters.push('world');
        if (includeOutline) filters.push('outline');
        if (includePatterns) filters.push('pattern', 'pipeline');
        if (includeCycles) filters.push('cycle');
        filters.push('chapter', 'memory');

        // 1. 循环融合上下文（最高优先级）
        if (includeCycles && chapterNum) {
            const cycleCtx = await this.getCycleContextForChapter(chapterNum);
            if (cycleCtx) {
                context += `\n【循环技法注入】\n${cycleCtx.slice(0, 800)}\n`;
                tokens += 400;
            }
        }

        // 2. 智能检索
        const searchQuery = query || (chapterNum ? `第${chapterNum}章` : '当前创作');
        const results = await this.search(searchQuery, 15, [...new Set(filters)]);

        // 3. 按源分组，优先级排序
        const priority = { cycle: 0, entity: 1, knowledge: 1, world: 2, outline: 3, chapter: 4, pattern: 5, pipeline: 5, memory: 6 };
        const grouped = {};
        for (const r of results) {
            const src = r.source || 'other';
            if (!grouped[src]) grouped[src] = [];
            grouped[src].push(r);
        }
        const sortedGroups = Object.entries(grouped).sort((a, b) => (priority[a[0]] || 99) - (priority[b[0]] || 99));

        // 4. 按 token 预算填充
        for (const [src, items] of sortedGroups) {
            const label = (this._SOURCES[src] || {}).label || src;
            const budget = Math.min(maxTokens * 0.25, maxTokens - tokens);
            if (budget <= 0) break;
            let groupCtx = `\n【${label}】\n`;
            let groupTokens = 10;
            for (const r of items.slice(0, 5)) {
                const est = Math.ceil((r.content?.length || 0) / 2);
                if (groupTokens + est > budget) {
                    groupCtx += `  ... 还有 ${items.length - items.slice(0, 5).indexOf(r)} 条相关结果\n`;
                    break;
                }
                groupCtx += `• ${r.title}: ${(r.content || '').slice(0, 200)}${(r.content || '').length > 200 ? '...' : ''}\n`;
                groupTokens += est;
            }
            if (groupTokens > 10) {
                context += groupCtx;
                tokens += groupTokens;
            }
        }

        return context;
    },

    // —— BM25 混合评分 (BM25 + TF-IDF + 位置权重 + 频率 + 长度归一化) ——
    _calcScore(q, qWords, text, baseWeight) {
        const bm25 = this._bm25Score(q, qWords, text, baseWeight);
        let score = bm25;
        // 精确短语匹配加分
        if (text.includes(q)) score += baseWeight * 0.3;
        // 位置权重（关键词出现在开头）
        for (const w of qWords) {
            const pos = text.indexOf(w);
            if (pos >= 0 && pos < 200) score += 0.05;
            if (pos >= 0 && pos < 50) score += 0.1;
        }
        // 短文本降权（避免标题等过短内容占据前排）
        if (text.length < 50) score *= 0.5;
        return score;
    },

    _bm25Score(q, qWords, text, baseWeight, k1 = 1.5, b = 0.75) {
        if (!text || !qWords.length) return 0;
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const docLen = words.length;
        const avgLen = 200; // 平均文档长度估计
        let score = 0;
        for (const w of qWords) {
            const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const matches = (text.match(new RegExp(escaped, 'g')) || []).length;
            const tf = matches;
            const idf = Math.log(1 + (1000 - matches + 0.5) / (matches + 0.5));
            const denom = tf + k1 * (1 - b + b * (docLen / avgLen));
            score += idf * (tf * (k1 + 1)) / (denom || 1);
        }
        // 归一化到 0-baseWeight 范围
        const normalized = Math.min(score / (qWords.length * 3), 1) * baseWeight;
        return normalized;
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
    async buildContext(query, maxTokens = 4000, template = 'default', prioritySources = null, filters = null) {
        const results = await this.search(query, 25, filters);
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

    // —— 模块专用检索: 执笔台 (侧重章节/正文/记忆/循环) ——
    async searchForWriter(query, limit = 12) {
        const results = await this.search(query, limit * 2, ['chapter', 'memory', 'outline', 'pipeline', 'entity', 'document', 'cycle']);
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
        try { stats.chapters = (await DB.getAll('chapters') || []).length; } catch(e) { stats.chapters = 0; }
        try { stats.outlines = (await DB.getAll('outlines') || []).length; } catch(e) { stats.outlines = 0; }
        try { stats.entities = (await DB.getAll('entities') || []).length; } catch(e) { stats.entities = 0; }
        try { stats.vectors = (await DB.getAll('vectors') || []).length; } catch(e) { stats.vectors = 0; }
        try { stats.documents = (await DB.getAll('rag_documents') || []).length; } catch(e) { stats.documents = this._documents.length; }
        try {
            const books = await DB.get('settings', 'fusion_books');
            stats.fusionBooks = books && books.items ? books.items.length : 0;
            stats.fusionChapters = books && books.items ? books.items.reduce((s, b) => s + (b.chapters || []).length, 0) : 0;
        } catch(e) { stats.fusionBooks = 0; stats.fusionChapters = 0; }
        try { stats.library = (await DB.getAll('library_books') || []).length; } catch(e) { stats.library = 0; }
        try { stats.persistent = (await MemorySystem.getAllPersistent()).length; } catch(e) { stats.persistent = 0; }
        try {
            const cycles = await DB.getAll('cycles') || [];
            stats.cycles = cycles.length;
        } catch(e) { stats.cycles = 0; }
        try {
            const entities = await DB.getAll('entities') || [];
            stats.world = entities.filter(e => e.id?.startsWith('world_') || e.type === '世界观').length;
            stats.knowledge = entities.filter(e => (e.relations || []).length > 0).length;
        } catch(e) { stats.world = 0; stats.knowledge = 0; }
        try {
            const keys = await DB.keys('settings') || [];
            stats.patterns = keys.filter(k => k.startsWith('cycle_patterns_')).length;
        } catch(e) { stats.patterns = 0; }
        // 文档索引和流水线统计
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
};
