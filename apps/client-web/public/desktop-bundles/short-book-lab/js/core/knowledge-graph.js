/**
 * 客户端知识图谱 - 实体关系抽取与图谱管理
 * 
 * 支持:
 * - 写作元素实体: 角色、地点、情节点、主题、冲突、世界观
 * - 关系类型: 认识、对立、导致、伏笔、平行、对比等
 * - 图谱检索: 按类型、关系、相似度
 * - IndexedDB 持久化
 */

const knowledgeGraph = {
    entities: new Map(),   // id -> entity
    relations: [],         // [{source, target, type, weight, evidence}]
    _dbReady: false,

    ENTITY_TYPES: {
        CHARACTER: 'character',
        LOCATION: 'location',
        PLOT_POINT: 'plot_point',
        THEME: 'theme',
        CONFLICT: 'conflict',
        WORLD_ELEMENT: 'world_element',
        EVENT: 'event',
        EMOTION: 'emotion',
        ARTIFACT: 'artifact',
        ORGANIZATION: 'organization',
        FORESHADOWING: 'foreshadowing',
        GOLDEN_LINE: 'golden_line',
        STRUCTURE: 'structure'
    },

    RELATION_TYPES: {
        KNOWS: 'knows',
        LOVES: 'loves',
        HATES: 'hates',
        ALLIES_WITH: 'allies_with',
        OPPOSES: 'opposes',
        LOCATED_IN: 'located_in',
        LEADS_TO: 'leads_to',
        FOLLOWS: 'follows',
        CONFLICTS_WITH: 'conflicts_with',
        FORESHADOWS: 'foreshadows',
        PARALLELS: 'parallels',
        CONTRASTS: 'contrasts',
        PART_OF: 'part_of',
        CAUSES: 'causes',
        RESOLVES: 'resolves',
        SYMBOLIZES: 'symbolizes',
        FUSES_WITH: 'fuses_with',
        DERIVED_FROM: 'derived_from'
    },

    async init() {
        await this._loadFromDB();
        this._dbReady = true;
    },

    // ==================== 实体操作 ====================

    addEntity(name, type, properties = {}, context = '') {
        const existing = this.findEntity(name, type);
        if (existing) {
            existing.mentionCount++;
            existing.updatedAt = Date.now();
            if (context && !existing.contexts.includes(context.substring(0, 300))) {
                existing.contexts.push(context.substring(0, 300));
                if (existing.contexts.length > 10) existing.contexts.shift();
            }
            Object.assign(existing.properties, properties);
            existing.importance = this._calcImportance(existing);
            this._saveToDB();
            return existing;
        }

        const entity = {
            id: this._genId(name + type),
            name,
            type,
            properties,
            contexts: context ? [context.substring(0, 300)] : [],
            mentionCount: 1,
            importance: 0.5,
            aliases: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        entity.importance = this._calcImportance(entity);
        this.entities.set(entity.id, entity);
        this._saveToDB();
        return entity;
    },

    findEntity(name, type = null) {
        for (const e of this.entities.values()) {
            if (e.name === name && (!type || e.type === type)) return e;
            if (e.aliases.includes(name)) return e;
        }
        return null;
    },

    searchEntities(query, type = null, limit = 20) {
        const q = query.toLowerCase();
        const results = [];
        for (const e of this.entities.values()) {
            if (type && e.type !== type) continue;
            let score = 0;
            if (e.name.toLowerCase().includes(q)) score += 2;
            if (e.aliases.some(a => a.toLowerCase().includes(q))) score += 1.5;
            if (e.contexts.some(c => c.toLowerCase().includes(q))) score += 0.5;
            for (const v of Object.values(e.properties)) {
                if (String(v).toLowerCase().includes(q)) { score += 0.3; break; }
            }
            if (score > 0) results.push({ ...e, score });
        }
        results.sort((a, b) => b.score - a.score || b.importance - a.importance);
        return results.slice(0, limit);
    },

    getImportantEntities(limit = 20, types = null) {
        let arr = [...this.entities.values()];
        if (types) arr = arr.filter(e => types.includes(e.type));
        arr.sort((a, b) => b.importance - a.importance);
        return arr.slice(0, limit);
    },

    // ==================== 关系操作 ====================

    addRelation(sourceName, targetName, relType, weight = 1.0, evidence = '') {
        const source = this.findEntity(sourceName);
        const target = this.findEntity(targetName);
        if (!source || !target) return null;

        const existing = this.relations.find(r =>
            r.sourceId === source.id && r.targetId === target.id && r.type === relType
        );
        if (existing) {
            existing.weight += 0.1;
            if (evidence) {
                existing.evidences.push(evidence.substring(0, 200));
                if (existing.evidences.length > 5) existing.evidences.shift();
            }
            this._saveToDB();
            return existing;
        }

        const rel = {
            id: this._genId(source.id + target.id + relType),
            sourceId: source.id,
            sourceName: source.name,
            targetId: target.id,
            targetName: target.name,
            type: relType,
            weight,
            evidences: evidence ? [evidence.substring(0, 200)] : [],
            createdAt: Date.now()
        };
        this.relations.push(rel);
        this._saveToDB();
        return rel;
    },

    getEntityRelations(entityId, direction = 'both') {
        const results = [];
        for (const r of this.relations) {
            if (direction !== 'in' && r.sourceId === entityId) results.push({ ...r, direction: 'out' });
            if (direction !== 'out' && r.targetId === entityId) results.push({ ...r, direction: 'in' });
        }
        results.sort((a, b) => b.weight - a.weight);
        return results;
    },

    // ==================== 写作元素提取 ====================

    extractFromText(text, sourceTitle = '') {
        const entities = [];
        const relations = [];

        // 角色提取 (中文名字模式)
        const charPatterns = [
            /(?:主角|男主|女主|主人公)[是为叫名]?[：:]?\s*([^\s,，。！？]{2,6})/g,
            /(?:角色|人物)[：:]?\s*([^\s,，。！？]{2,6})/g,
            /「([^\s」]{2,6})」(?:说|道|笑|怒|叹|问)/g,
            /"([^\s"]{2,6})"(?:说|道|笑|怒|叹|问)/g,
        ];
        for (const p of charPatterns) {
            let m;
            while ((m = p.exec(text)) !== null) {
                const name = m[1].trim();
                if (name.length >= 2 && name.length <= 6) {
                    const e = this.addEntity(name, this.ENTITY_TYPES.CHARACTER, { source: sourceTitle }, text.substring(Math.max(0, m.index - 50), m.index + 50));
                    entities.push(e);
                }
            }
        }

        // 地点提取
        const locPatterns = [
            /(?:在|到|去|来到|位于)\s*([^\s,，。！？]{2,10}(?:城|镇|村|山|河|湖|海|宫|殿|府|院|楼|阁|谷|洞|林|岛))/g,
        ];
        for (const p of locPatterns) {
            let m;
            while ((m = p.exec(text)) !== null) {
                const e = this.addEntity(m[1].trim(), this.ENTITY_TYPES.LOCATION, { source: sourceTitle }, text.substring(Math.max(0, m.index - 30), m.index + 30));
                entities.push(e);
            }
        }

        // 冲突提取
        const conflictPatterns = [
            /(?:冲突|矛盾|对抗|争斗|战争|对决)[：:]?\s*([^\n。！？]{5,50})/g,
        ];
        for (const p of conflictPatterns) {
            let m;
            while ((m = p.exec(text)) !== null) {
                const e = this.addEntity(m[1].trim().substring(0, 30), this.ENTITY_TYPES.CONFLICT, { source: sourceTitle }, m[0]);
                entities.push(e);
            }
        }

        // 主题提取
        const themePatterns = [
            /(?:主题|核心|中心思想)[：:]?\s*([^\n。！？]{3,30})/g,
        ];
        for (const p of themePatterns) {
            let m;
            while ((m = p.exec(text)) !== null) {
                const e = this.addEntity(m[1].trim(), this.ENTITY_TYPES.THEME, { source: sourceTitle }, m[0]);
                entities.push(e);
            }
        }

        // 金句提取
        const linePatterns = [
            /[「"]([\u4e00-\u9fff，、；：！？…—]{10,60})[」"]/g,
        ];
        for (const p of linePatterns) {
            let m;
            while ((m = p.exec(text)) !== null) {
                const e = this.addEntity(m[1].trim().substring(0, 40), this.ENTITY_TYPES.GOLDEN_LINE, { source: sourceTitle, full: m[1] }, m[0]);
                entities.push(e);
            }
        }

        return { entities, relations };
    },

    extractFromAnalysis(analysisText, sourceTitle = '') {
        // 从AI拆解结果中提取结构化元素
        const entities = [];

        // 情节点
        const plotPatterns = [
            /(?:情节|转折|高潮|开端|发展|结局)[：:]?\s*([^\n]{5,60})/g,
            /(?:\d+[.、])\s*([^\n]{5,60})/g,
        ];
        for (const p of plotPatterns) {
            let m;
            while ((m = p.exec(analysisText)) !== null) {
                const e = this.addEntity(m[1].trim().substring(0, 40), this.ENTITY_TYPES.PLOT_POINT, { source: sourceTitle }, m[0]);
                entities.push(e);
            }
        }

        // 伏笔
        const foreshadowPatterns = [
            /(?:伏笔|暗示|铺垫|呼应)[：:]?\s*([^\n]{5,60})/g,
        ];
        for (const p of foreshadowPatterns) {
            let m;
            while ((m = p.exec(analysisText)) !== null) {
                const e = this.addEntity(m[1].trim().substring(0, 40), this.ENTITY_TYPES.FORESHADOWING, { source: sourceTitle }, m[0]);
                entities.push(e);
            }
        }

        return entities;
    },

    // ==================== 图谱查询 ====================

    getSubgraph(entityId, depth = 2) {
        const visited = new Set();
        const subEntities = [];
        const subRelations = [];
        const queue = [{ id: entityId, d: 0 }];

        while (queue.length > 0) {
            const { id, d } = queue.shift();
            if (visited.has(id) || d > depth) continue;
            visited.add(id);
            const entity = this.entities.get(id);
            if (entity) subEntities.push(entity);

            const rels = this.getEntityRelations(id);
            for (const r of rels) {
                subRelations.push(r);
                const nextId = r.direction === 'out' ? r.targetId : r.sourceId;
                if (!visited.has(nextId)) queue.push({ id: nextId, d: d + 1 });
            }
        }
        return { entities: subEntities, relations: subRelations };
    },

    getContextForQuery(query, maxItems = 10) {
        const entities = this.searchEntities(query, null, maxItems);
        if (entities.length === 0) return '';

        const parts = ['【知识图谱上下文】'];
        for (const e of entities) {
            const rels = this.getEntityRelations(e.id);
            const relStr = rels.slice(0, 3).map(r =>
                `${r.type}→${r.direction === 'out' ? r.targetName : r.sourceName}`
            ).join(', ');
            parts.push(`• ${e.name}(${e.type}): ${relStr || '无关系'}`);
        }
        return parts.join('\n');
    },

    // ==================== 融合专用 ====================

    mergeSubgraphs(sourceIds) {
        // 合并多个源的子图，发现交叉关系
        const allEntities = new Map();
        const crossRelations = [];

        for (const sid of sourceIds) {
            for (const e of this.entities.values()) {
                if (e.properties.source === sid) {
                    allEntities.set(e.id, e);
                }
            }
        }

        // 发现同名/同类实体间的潜在关系
        const entityArr = [...allEntities.values()];
        for (let i = 0; i < entityArr.length; i++) {
            for (let j = i + 1; j < entityArr.length; j++) {
                const a = entityArr[i], b = entityArr[j];
                if (a.properties.source === b.properties.source) continue;
                if (a.type === b.type && a.name !== b.name) {
                    crossRelations.push({
                        source: a.name,
                        target: b.name,
                        type: this.RELATION_TYPES.PARALLELS,
                        reason: `同类型(${a.type})来自不同源`
                    });
                }
            }
        }
        return { entities: entityArr, crossRelations };
    },

    // ==================== 统计 ====================

    getStats() {
        const typeCounts = {};
        for (const e of this.entities.values()) {
            typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
        }
        return {
            entityCount: this.entities.size,
            relationCount: this.relations.length,
            typeCounts,
            topEntities: this.getImportantEntities(5).map(e => e.name)
        };
    },

    // ==================== 内部方法 ====================

    _calcImportance(entity) {
        const mentionScore = Math.min(1, Math.log(entity.mentionCount + 1) / 5);
        const propScore = Math.min(1, Object.keys(entity.properties).length / 10);
        const contextScore = Math.min(1, entity.contexts.length / 5);
        return mentionScore * 0.5 + propScore * 0.3 + contextScore * 0.2;
    },

    _genId(seed) {
        let hash = 0;
        const str = seed + Date.now() + Math.random();
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash).toString(36).substring(0, 12);
    },

    async _saveToDB() {
        if (!db._db) return;
        try {
            const data = {
                key: 'knowledge_graph',
                entities: Object.fromEntries(this.entities),
                relations: this.relations,
                savedAt: Date.now()
            };
            await db.put('prompts', data);
        } catch (e) { /* silent */ }
    },

    async _loadFromDB() {
        try {
            const all = await db.getAll('prompts');
            const saved = all.find(p => p.key === 'knowledge_graph');
            if (saved) {
                this.entities = new Map(Object.entries(saved.entities || {}));
                this.relations = saved.relations || [];
            }
        } catch (e) { /* silent */ }
    },

    clear() {
        this.entities.clear();
        this.relations = [];
        this._saveToDB();
    }
};
