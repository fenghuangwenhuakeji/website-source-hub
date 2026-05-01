/**
 * 三层记忆系统 (旗舰版 v2)
 * 全局对象: MemorySystem
 * 工作记忆 · 会话记忆 · 长期记忆 · 模块专用记忆通道
 */

// ═══════════════════════════════════════════════════════════════
// 三层记忆系统 (旗舰版 v2) — 工作记忆 · 会话记忆 · 长期记忆
// 新增: AI智能摘要压缩 · 重要度衰减 · 跨层提升/降级 · 标签体系
//       记忆链(关联记忆) · 统计面板 · 批量操作 · 导入导出
//       语义分类 · 自动标签 · 上下文窗口管理 · 模块深度绑定
//       凤凰流/执笔台/世界引擎/拆书融合 专用记忆通道
// ═══════════════════════════════════════════════════════════════
const MemorySystem = {
    working: [],
    maxWorking: 80,
    _decayInterval: null,
    _moduleChannels: {},  // 模块专用记忆通道
    _cycleChannels: {},   // 循环专用记忆通道 { cycleId: [items] }
    _permanent: [],       // ★ Phase 4: 永久记忆层（内存缓存）
    _projectId: null,     // 当前项目ID，用于记忆隔离

    // —— 会话记忆 (IndexedDB，按会话分组) ——
    async addSession(sessionId, content, tags = [], importance = 0.5) {
        const key = 'memory_session_' + sessionId;
        let record = await DB.get('settings', key) || { id: key, items: [], createdAt: Date.now() };
        record.items.push({
            id: 'sm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 4),
            content, tags, ts: Date.now(), importance
        });
        if (record.items.length > 200) record.items = record.items.slice(-150);
        record.updatedAt = Date.now();
        await DB.put('settings', record);
    },

    async getSessionItems(sessionId, limit = 30) {
        const key = 'memory_session_' + sessionId;
        const record = await DB.get('settings', key);
        return record ? record.items.slice(-limit) : [];
    },

    async getAllSessionIds() {
        const all = await DB.getAll('settings') || [];
        return all.filter(r => r.id && r.id.startsWith('memory_session_'))
            .map(r => ({ id: r.id.replace('memory_session_', ''), count: (r.items || []).length, updatedAt: r.updatedAt || 0 }))
            .sort((a, b) => b.updatedAt - a.updatedAt);
    },

    async deleteSession(sessionId) {
        await DB.del('settings', 'memory_session_' + sessionId);
    },

    async clearAllSessions() {
        const ids = await this.getAllSessionIds();
        for (const s of ids) await DB.del('settings', 'memory_session_' + s.id);
    },
    // —— 统计 ——
    async getStats() {
        const persistent = await this.getAllPersistent();
        const sessions = await this.getAllSessionIds();
        await this.loadPermanent?.();
        const cats = {}, modules = {};
        for (const m of persistent) {
            cats[m.category || 'fact'] = (cats[m.category || 'fact'] || 0) + 1;
            if (m.module) modules[m.module] = (modules[m.module] || 0) + 1;
        }
        return {
            workingCount: this.working.length,
            workingMax: this.maxWorking,
            sessionCount: sessions.length,
            sessionTotalItems: sessions.reduce((s, x) => s + x.count, 0),
            persistentCount: persistent.length,
            permanentCount: this._permanent?.length || 0,
            categories: cats,
            modules,
            channelCounts: Object.fromEntries(Object.entries(this._moduleChannels).map(([k, v]) => [k, v.length])),
            avgImportance: persistent.length > 0 ? (persistent.reduce((s, m) => s + m.importance, 0) / persistent.length).toFixed(2) : 0
        };
    },

    // —— 导入导出 ——
    async exportAll() {
        return {
            working: this.working,
            persistent: await this.getAllPersistent(),
            sessions: await this.getAllSessionIds(),
            moduleChannels: this._moduleChannels
        };
    },

    async importPersistent(items) {
        let store = await DB.get('settings', 'memory_persistent') || { id: 'memory_persistent', items: [] };
        let count = 0;
        for (const item of items) {
            if (!store.items.find(m => m.content === item.content)) {
                store.items.push({ ...item, id: item.id || ('pm_imp_' + Date.now() + '_' + (count++)), ts: item.ts || Date.now() });
            }
        }
        await DB.put('settings', store);
        return count;
    },

    // ═══════════════════════════════════════════════════════════════
    // 核心大脑功能 - 智能上下文构建与记忆管理
    // ═══════════════════════════════════════════════════════════════

    _entityMemoryIndex: {},
    _chapterMemoryIndex: {},
    _lastBrainUpdate: 0,

    async buildBrainContext(query, options = {}) {
        const {
            moduleName = 'global',
            chapterId = null,
            cycleId = null,
            chapterNum = null,
            maxTokens = 6000,
            includeWorking = true,
            includeSession = true,
            includePersistent = true,
            includeRAG = true,
            includeEntities = true,
            includeWorldView = true,
            includeFusion = true,
            includePatterns = true,
            includeNexus = true,
            includeCycle = true
        } = options;

        let context = '';
        let tokens = 0;
        const sections = [];

        if (includeWorking && tokens < maxTokens) {
            const workingCtx = this.getModuleContext(moduleName, 10);
            if (workingCtx) {
                sections.push({ label: '工作记忆', content: workingCtx, priority: 1 });
                tokens += Math.ceil(workingCtx.length / 2);
            }
        }

        if (includePersistent && query && tokens < maxTokens) {
            const persistent = await this.searchPersistent(query, 8);
            if (persistent.length > 0) {
                const pmCtx = persistent.map(m => 
                    `[${m.category}${m.module ? '/' + m.module : ''}] ${m.content}`
                ).join('\n');
                sections.push({ label: '长期记忆', content: pmCtx, priority: 2 });
                tokens += Math.ceil(pmCtx.length / 2);
            }
        }

        if (includeRAG && query && typeof RAGSystem !== 'undefined' && tokens < maxTokens) {
            const ragCtx = await RAGSystem.buildContext(query, Math.min(maxTokens - tokens, 2000), 'structured');
            if (ragCtx) {
                sections.push({ label: 'RAG检索', content: ragCtx, priority: 3 });
                tokens += Math.ceil(ragCtx.length / 2);
            }
        }

        if (includeEntities && tokens < maxTokens) {
            try {
                const entities = await DB.getAll('entities') || [];
                const relevantEntities = this._findRelevantEntities(query, entities, 15);
                if (relevantEntities.length > 0) {
                    const entityCtx = relevantEntities.map(e => 
                        `[${e.type}] ${e.name}: ${(e.desc || '').slice(0, 150)}${e.relations?.length ? ` | 关联: ${e.relations.slice(0, 3).join(', ')}` : ''}`
                    ).join('\n');
                    sections.push({ label: '相关实体', content: entityCtx, priority: 2 });
                    tokens += Math.ceil(entityCtx.length / 2);
                }
            } catch(e) {}
        }

        if (includeWorldView && tokens < maxTokens) {
            try {
                const entities = await DB.getAll('entities') || [];
                const worldEntities = entities.filter(e => e.id?.startsWith('world_') && e.desc);
                if (worldEntities.length > 0) {
                    const worldCtx = worldEntities.map(w => 
                        `[世界观] ${w.name}: ${(w.desc || '').slice(0, 200)}`
                    ).join('\n');
                    sections.push({ label: '世界观设定', content: worldCtx, priority: 4 });
                    tokens += Math.ceil(worldCtx.length / 2);
                }
            } catch(e) {}
        }

        if (includeFusion && tokens < maxTokens) {
            try {
                const FB = Modules.fusion_book;
                if (FB) {
                    const allPr = FB._allPipelineResults || {};
                    const pr = FB._pipelineResults || {};
                    const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
                    if (fusion) {
                        sections.push({ label: '融合技法', content: fusion.slice(0, 1500), priority: 3 });
                        tokens += 750;
                    }
                }
            } catch(e) {}
        }

        if (chapterId && tokens < maxTokens) {
            const chapterMemories = await this.getChapterMemories(chapterId);
            if (chapterMemories.length > 0) {
                const chCtx = chapterMemories.slice(0, 5).map(m => m.content).join('\n');
                sections.push({ label: '章节记忆', content: chCtx, priority: 1 });
                tokens += Math.ceil(chCtx.length / 2);
            }
        }

        // ★ NEXUS状态机记忆
        if (includeNexus && tokens < maxTokens) {
            const nexusCtx = this.buildNexusMemoryContext(cycleId, 5);
            if (nexusCtx) {
                sections.push({ label: 'NEXUS状态', content: nexusCtx, priority: 0 });
                tokens += Math.ceil(nexusCtx.length / 2);
            }
        }

        // ★ 循环记忆上下文
        if (includeCycle && (cycleId || chapterNum) && tokens < maxTokens) {
            let targetCycleId = cycleId;
            if (!targetCycleId && chapterNum && typeof Modules !== 'undefined' && Modules.fusion_book) {
                const cy = Modules.fusion_book.getCycleFusionForChapter?.(chapterNum);
                if (cy) targetCycleId = cy.id;
            }
            if (targetCycleId) {
                const cycleCtx = this.getCycleMemory(targetCycleId, 5);
                if (cycleCtx) {
                    sections.push({ label: '循环记忆', content: cycleCtx, priority: 0 });
                    tokens += Math.ceil(cycleCtx.length / 2);
                }
            }
        }

        sections.sort((a, b) => a.priority - b.priority);

        for (const section of sections) {
            if (context.length + section.content.length < maxTokens * 2) {
                context += `\n【${section.label}】\n${section.content}\n`;
            }
        }

        this.addWorking(`[大脑上下文构建] 查询:"${query?.slice(0, 30)}" 模块:${moduleName} 章节:${chapterId || '无'} Token:${Math.ceil(context.length / 2)}`, 'brain', 3, { module: moduleName, chapterId });

        return context;
    },
    _findRelevantEntities(query, entities, limit) {
        if (!query) return entities.slice(0, limit);
        const queryLower = query.toLowerCase();
        const keywords = queryLower.split(/[\s,，。！？、]+/).filter(k => k.length > 1);

        const scored = entities.filter(e => !e.id?.startsWith('world_')).map(e => {
            let score = 0;
            const nameLower = (e.name || '').toLowerCase();
            const descLower = (e.desc || '').toLowerCase();

            if (queryLower.includes(nameLower)) score += 10;
            keywords.forEach(k => {
                if (nameLower.includes(k)) score += 5;
                if (descLower.includes(k)) score += 2;
            });
            if (e.relations?.length) score += Math.min(e.relations.length, 5);

            return { ...e, score };
        });

        return scored.sort((a, b) => b.score - a.score).slice(0, limit);
    },
    async addChapterMemory(chapterId, content, type = 'note', importance = 0.6) {
        const key = 'memory_chapter_' + chapterId;
        let store = await DB.get('settings', key) || { id: key, items: [], createdAt: Date.now() };
        const item = {
            id: 'cm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 4),
            content, type, importance, ts: Date.now(),
            chapterId
        };
        store.items.push(item);
        if (store.items.length > 100) store.items = store.items.slice(-80);
        store.updatedAt = Date.now();
        await DB.put('settings', store);

        this._chapterMemoryIndex[chapterId] = store.items;
        return item;
    },

    async getChapterMemories(chapterId, limit = 20) {
        const key = 'memory_chapter_' + chapterId;
        const store = await DB.get('settings', key);
        return store ? store.items.slice(-limit) : [];
    },

    async addEntityMemory(entityId, content, relationType = 'related') {
        const key = 'memory_entity_' + entityId;
        let store = await DB.get('settings', key) || { id: key, items: [], createdAt: Date.now() };
        const item = {
            id: 'em_' + Date.now() + '_' + Math.random().toString(36).slice(2, 4),
            content, relationType, ts: Date.now(),
            entityId
        };
        store.items.push(item);
        if (store.items.length > 50) store.items = store.items.slice(-40);
        store.updatedAt = Date.now();
        await DB.put('settings', store);

        this._entityMemoryIndex[entityId] = store.items;
        return item;
    },

    async getEntityMemories(entityId, limit = 15) {
        const key = 'memory_entity_' + entityId;
        const store = await DB.get('settings', key);
        return store ? store.items.slice(-limit) : [];
    },
    async buildMemoryChain(startId, depth = 3) {
        const chain = [];
        const visited = new Set();
        const queue = [{ id: startId, level: 0, relation: 'start' }];

        while (queue.length > 0 && chain.length < 20) {
            const current = queue.shift();
            if (visited.has(current.id) || current.level > depth) continue;
            visited.add(current.id);

            const entity = await DB.get('entities', current.id);
            if (!entity) continue;

            chain.push({
                id: entity.id,
                name: entity.name,
                type: entity.type,
                level: current.level,
                relation: current.relation
            });

            if (entity.relations) {
                for (const rel of entity.relations) {
                    const match = rel.match(/(.+?)[：:]\s*(.+)/);
                    if (match) {
                        const relationType = match[1];
                        const targetName = match[2];
                        const targetEntity = (await DB.getAll('entities') || []).find(e => e.name === targetName);
                        if (targetEntity && !visited.has(targetEntity.id)) {
                            queue.push({
                                id: targetEntity.id,
                                level: current.level + 1,
                                relation: relationType
                            });
                        }
                    }
                }
            }
        }

        return chain;
    },
    async autoExtractAndStore(content, source = 'unknown') {
        const keywords = this._extractKeywords(content);
        const entities = [];
        const relations = [];

        const entityPatterns = [
            /【([^】]+)】/g,
            /「([^」]+)」/g,
            /"([^"]+)"/g,
            /「([^」]+)」/g
        ];

        for (const pattern of entityPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                if (match[1].length >= 2 && match[1].length <= 20) {
                    entities.push(match[1]);
                }
            }
        }

        const relationPatterns = [
            /(.+?)是(.+?)的(.+)/g,
            /(.+?)与(.+?)的关系/g,
            /(.+?)属于(.+)/g
        ];

        for (const pattern of relationPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                if (match[1] && match[2]) {
                    relations.push(`${match[1]} -> ${match[2]}`);
                }
            }
        }

        if (entities.length > 0 || relations.length > 0) {
            await this.addPersistent(
                `[自动提取] 实体: ${entities.slice(0, 10).join(', ')} | 关系: ${relations.slice(0, 5).join('; ')}`,
                'auto_extract',
                0.5,
                [...keywords, 'auto', source],
                { source, entities, relations }
            );
        }

        return { entities: [...new Set(entities)], relations: [...new Set(relations)], keywords };
    },
    _extractKeywords(text) {
        const stopWords = new Set(['的', '了', '是', '在', '有', '和', '与', '或', '这', '那', '他', '她', '它', '我', '你', '们', '着', '过', '会', '能', '可以', '但是', '因为', '所以', '如果', '虽然', '但是', '然而', '而且', '或者', '以及', '还是', '不是', '没有', '什么', '怎么', '为什么', '哪里', '谁', '多少', '几', '第', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']);

        const words = text.split(/[\s,，。！？、；：""''【】「」《》\n\r\t]+/).filter(w => 
            w.length >= 2 && w.length <= 10 && !stopWords.has(w)
        );

        const freq = {};
        words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });

        return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word]) => word);
    },
    async smartCompress() {
        const workingCount = this.working.length;
        const persistent = await this.getAllPersistent();

        if (workingCount < 10 && persistent.length < 50) {
            return { compressed: false, reason: '数据量不足' };
        }

        let summary = '';
        const allContent = [
            ...this.working.map(m => `[${m.type}/${m.module || 'general'}] ${m.content}`),
            ...persistent.slice(-20).map(m => `[${m.category}] ${m.content}`)
        ].join('\n');

        try {
            await AI.generate(
                `你是记忆压缩引擎。将以下记忆内容压缩为精炼摘要，保留关键信息、人物、情节、设定要点。按模块分类输出，不超过800字：\n\n${allContent.slice(0, 6000)}`,
                {}, c => { summary += c; }
            );

            if (summary.length > 50) {
                await this.addPersistent('[智能压缩摘要] ' + summary, 'compress', 0.8, ['ai_compress', 'auto']);

                const oldWorking = this.working.length;
                this.working = this.working.filter(m => m.priority >= 4);
                this._moduleChannels = {};

                return {
                    compressed: true,
                    summary,
                    workingBefore: oldWorking,
                    workingAfter: this.working.length
                };
            }
        } catch(e) {
            console.warn('智能压缩失败:', e);
        }

        return { compressed: false, reason: 'AI生成失败' };
    },
    async getMemoryStats() {
        const stats = await this.getStats();
        const persistent = await this.getAllPersistent();

        const typeDistribution = {};
        const moduleDistribution = {};
        const timeDistribution = { today: 0, week: 0, month: 0, older: 0 };

        const now = Date.now();
        const day = 86400000;

        for (const m of persistent) {
            typeDistribution[m.category] = (typeDistribution[m.category] || 0) + 1;
            if (m.module) moduleDistribution[m.module] = (moduleDistribution[m.module] || 0) + 1;

            const age = now - (m.ts || 0);
            if (age < day) timeDistribution.today++;
            else if (age < day * 7) timeDistribution.week++;
            else if (age < day * 30) timeDistribution.month++;
            else timeDistribution.older++;
        }

        return {
            ...stats,
            typeDistribution,
            moduleDistribution,
            timeDistribution,
            avgContentLength: persistent.length > 0 
                ? Math.round(persistent.reduce((s, m) => s + (m.content?.length || 0), 0) / persistent.length)
                : 0,
            topTags: this._getTopTags(persistent)
        };
    },
    _getTopTags(memories) {
        const tagFreq = {};
        for (const m of memories) {
            for (const tag of (m.tags || [])) {
                tagFreq[tag] = (tagFreq[tag] || 0) + 1;
            }
        }
        return Object.entries(tagFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .map(([tag, count]) => ({ tag, count }));
    },
    async syncWithWorldEngine() {
        try {
            const entities = await DB.getAll('entities') || [];
            let synced = 0;

            for (const entity of entities) {
                if (!entity.id?.startsWith('world_') && entity.name) {
                    const existingMemories = await this.getEntityMemories(entity.id);
                    if (existingMemories.length === 0) {
                        await this.addEntityMemory(entity.id, 
                            `[实体创建] ${entity.type || '未知'}: ${entity.name} - ${(entity.desc || '').slice(0, 100)}`,
                            'creation'
                        );
                        synced++;
                    }
                }
            }

            return { synced, total: entities.length };
        } catch(e) {
            console.warn('同步世界引擎失败:', e);
            return { synced: 0, error: e.message };
        }
    },
    async buildContextForGeneration(query, chapterNum = null, maxTokens = 5000) {
        let context = '';
        let tokens = 0;

        // 获取当前章节对应的cycleId
        let cycleId = null;
        if (chapterNum && typeof Modules !== 'undefined' && Modules.fusion_book) {
            const cy = Modules.fusion_book.getCycleFusionForChapter?.(chapterNum);
            if (cy) cycleId = cy.id;
        }

        const brainCtx = await this.buildBrainContext(query, {
            moduleName: 'writer',
            chapterId: chapterNum ? `ch_${chapterNum}` : null,
            chapterNum,
            cycleId,
            maxTokens: maxTokens * 0.6,
            includeWorking: true,
            includePersistent: true,
            includeRAG: true,
            includeEntities: true,
            includeWorldView: true,
            includeFusion: true,
            includeNexus: true,
            includeCycle: true
        });
        context += brainCtx;
        tokens += Math.ceil(brainCtx.length / 2);

        if (chapterNum && tokens < maxTokens) {
            try {
                const chapters = await DB.getAll('chapters') || [];
                const currentChapter = chapters.find(c => c.chapterNum === chapterNum || c.index === chapterNum - 1);
                if (currentChapter) {
                    if (currentChapter.outline) {
                        context += `\n【本章大纲】\n${currentChapter.outline.slice(0, 500)}\n`;
                    }
                    if (currentChapter.content) {
                        context += `\n【已写内容】\n${currentChapter.content.slice(-1000)}\n`;
                    }
                }

                const prevChapter = chapters.find(c => c.chapterNum === chapterNum - 1 || c.index === chapterNum - 2);
                if (prevChapter && prevChapter.content) {
                    context += `\n【前章结尾】\n${prevChapter.content.slice(-500)}\n`;
                }
            } catch(e) {}
        }

        return context;
    },

    // ═══════════════════════════════════════════════════════════════
    // ★ Phase 4: 永久记忆层 + 记忆可视化 + 自动转化
    // ═══════════════════════════════════════════════════════════════

    // —— 永久记忆（永不衰减，用户主动标记）——
    async addPermanent(content, category = 'fact', tags = [], meta = {}) {
        const item = {
            id: 'perm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            content, category, tags, ts: Date.now(),
            source: meta.source || 'manual', module: meta.module || '',
            projectId: meta.projectId || this._projectId || null
        };
        this._permanent.push(item);
        // 持久化
        try {
            await DB.put('settings', { id: 'memory_permanent', items: this._permanent });
        } catch(e) {}
        return item;
    },

    async loadPermanent() {
        try {
            const saved = await DB.get('settings', 'memory_permanent');
            if (saved && saved.items) this._permanent = saved.items;
        } catch(e) { this._permanent = []; }
    },

    async searchPermanent(query, limit = 10) {
        if (!this._permanent.length) await this.loadPermanent();
        const q = query.toLowerCase();
        return this._permanent
            .filter(m => m.content.toLowerCase().includes(q) || (m.tags || []).some(t => t.toLowerCase().includes(q)))
            .slice(0, limit);
    },

    // —— 记忆可视化图谱 ——
    async buildMemoryGraph(options = {}) {
        const { maxNodes = 50, includeWorking = true, includePersistent = true, includePermanent = true } = options;
        const nodes = [];
        const edges = [];
        const nodeMap = new Map();
        let id = 0;

        const addNode = (data, group) => {
            const key = data.id || data.content?.slice(0, 50);
            if (nodeMap.has(key)) return nodeMap.get(key);
            const n = { id: id++, label: data.content?.slice(0, 30) || data.name || '...', group, data };
            nodes.push(n);
            nodeMap.set(key, n.id);
            return n.id;
        };

        // 工作记忆节点
        if (includeWorking) {
            for (const m of this.working.slice(-maxNodes / 3)) {
                addNode(m, 'working');
            }
        }

        // 长期记忆节点
        if (includePersistent) {
            const persistent = await this.getAllPersistent();
            for (const m of persistent.slice(-maxNodes / 3)) {
                addNode(m, 'persistent');
            }
        }

        // 永久记忆节点
        if (includePermanent) {
            for (const m of this._permanent.slice(-maxNodes / 3)) {
                addNode(m, 'permanent');
            }
        }

        // 构建边：基于标签相似度
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i], b = nodes[j];
                const tagsA = new Set(a.data.tags || []);
                const tagsB = new Set(b.data.tags || []);
                const common = [...tagsA].filter(t => tagsB.has(t));
                if (common.length > 0) {
                    edges.push({
                        source: a.id, target: b.id,
                        label: common[0],
                        weight: common.length
                    });
                }
                // 模块关联
                if (a.data.module && a.data.module === b.data.module) {
                    edges.push({ source: a.id, target: b.id, label: a.data.module, weight: 0.5 });
                }
            }
        }

        return { nodes, edges, stats: { nodeCount: nodes.length, edgeCount: edges.length } };
    },

    // —— 记忆 → 实体 自动转化 ——
    async convertMemoryToEntity(memoryId, options = {}) {
        const { autoCreate = false, targetType = 'character' } = options;

        // 查找记忆
        let memory = this.working.find(m => m.id === memoryId);
        if (!memory) {
            const persistent = await this.getAllPersistent();
            memory = persistent.find(m => m.id === memoryId);
        }
        if (!memory) {
            memory = this._permanent.find(m => m.id === memoryId);
        }
        if (!memory) return { success: false, error: '记忆不存在' };

        const content = memory.content;

        // 使用 AI 提取实体信息
        let extractResult = '';
        try {
            await AI.generate(
                `从以下记忆中提取实体信息，以JSON格式返回：
{
  "name": "实体名称",
  "type": "${targetType}",
  "description": "详细描述（不超过200字）",
  "tags": ["标签1", "标签2"],
  "relations": ["关系类型:关联实体名"]
}

记忆内容：${content.slice(0, 1000)}`,
                {}, c => { extractResult += c; }
            );
        } catch(e) {
            return { success: false, error: 'AI提取失败: ' + e.message };
        }

        // 解析 JSON
        let entity = null;
        try {
            const jsonMatch = extractResult.match(/\{[\s\S]*\}/);
            if (jsonMatch) entity = JSON.parse(jsonMatch[0]);
        } catch(e) {}

        if (!entity || !entity.name) {
            return { success: false, error: '无法提取有效实体', raw: extractResult };
        }

        if (autoCreate && typeof Modules !== 'undefined' && Modules.world_engine) {
            // 自动创建到世界引擎
            const entId = 'ent_' + Date.now();
            const newEntity = {
                id: entId, name: entity.name, type: entity.type || targetType,
                description: entity.description || content.slice(0, 200),
                desc: entity.description || content.slice(0, 200),
                tags: entity.tags || [], relations: entity.relations || [],
                source: 'memory_convert', createdAt: Date.now()
            };
            await DB.put('entities', newEntity);
            return { success: true, entity: newEntity, message: `已创建实体: ${entity.name}` };
        }

        return { success: true, entity, message: '实体信息提取成功', autoCreate: false };
    },

    // —— 记忆 → RAG 自动索引 ——
    async indexMemoryToRAG(memoryId) {
        let memory = this.working.find(m => m.id === memoryId);
        if (!memory) {
            const persistent = await this.getAllPersistent();
            memory = persistent.find(m => m.id === memoryId);
        }
        if (!memory) {
            memory = this._permanent.find(m => m.id === memoryId);
        }
        if (!memory) return { success: false, error: '记忆不存在' };

        if (typeof RAGSystem !== 'undefined') {
            await RAGSystem.addDocument(
                `memory_${memory.id}`,
                memory.content,
                'memory',
                { tags: memory.tags, module: memory.module, source: 'memory_index' }
            );
            return { success: true, message: '已索引到RAG' };
        }
        return { success: false, error: 'RAG系统未加载' };
    },

    // —— 项目级记忆隔离 ——
    async setProjectContext(projectId) {
        this._projectId = projectId;
        // 加载该项目的永久记忆
        await this.loadPermanent();
        if (projectId) {
            this._permanent = this._permanent.filter(m => !m.projectId || m.projectId === projectId);
        }
    }
};
