Object.assign(RAGSystem, {
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

        // ★ 循环融合上下文 (最高优先级)
        const cycleCtx = await this.getCycleContextForChapter(chapterNum);
        if (cycleCtx) {
            context += `\n【循环技法注入】\n${cycleCtx.slice(0, 1000)}\n`;
            tokens += Math.ceil(cycleCtx.length / 2);
        }

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
            // ★ 循环融合上下文
            const cycleCtx = await this.getCycleContextForChapter(chapterNum);
            if (cycleCtx) {
                sections.push({ label: '循环技法', content: cycleCtx, priority: 0, tokens: Math.ceil(cycleCtx.length / 2) });
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

        // ★ 循环融合检索
        try {
            const cycleResults = await this.searchCycles(query, 3);
            if (cycleResults.length > 0) {
                results.contextual.push({
                    type: 'cycle_fusion',
                    content: cycleResults.map(c => c.content).join('\n\n'),
                    relevance: 0.95
                });
            }
        } catch(e) {}

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
});
