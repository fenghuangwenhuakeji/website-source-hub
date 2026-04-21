/**
 * 三层记忆系统 V79.1
 * 工作记忆 · 会话记忆 · 持久记忆
 * 全局对象: MemorySystem
 */
const MemorySystem = {
    _working: [],
    _session: [],
    _persistent: [],
    _maxWorking: 30,
    _maxSession: 100,
    _maxPersistent: 500,
    _initialized: false,

    _CATEGORIES: {
        plot: { label: '剧情', icon: 'fa-sitemap', color: 'amber' },
        character: { label: '角色', icon: 'fa-user', color: 'blue' },
        world: { label: '世界观', icon: 'fa-globe', color: 'green' },
        style: { label: '风格', icon: 'fa-palette', color: 'purple' },
        timeline: { label: '时间线', icon: 'fa-clock', color: 'cyan' },
        foreshadow: { label: '伏笔', icon: 'fa-lightbulb', color: 'yellow' },
        conflict: { label: '冲突', icon: 'fa-bolt', color: 'red' },
        emotion: { label: '情绪', icon: 'fa-heart', color: 'pink' },
        theme: { label: '主题', icon: 'fa-star', color: 'indigo' },
        setting: { label: '设定', icon: 'fa-cog', color: 'gray' },
        dialogue: { label: '对话', icon: 'fa-comments', color: 'teal' },
        scene: { label: '场景', icon: 'fa-map', color: 'emerald' },
        search: { label: '检索', icon: 'fa-search', color: 'slate' },
        note: { label: '笔记', icon: 'fa-sticky-note', color: 'orange' },
        other: { label: '其他', icon: 'fa-folder', color: 'zinc' }
    },

    addWorking(content, category = 'other', importance = 1) {
        const item = {
            id: 'w_' + Date.now(),
            content: content.slice(0, 1000),
            category,
            importance: Math.min(3, Math.max(1, importance)),
            ts: Date.now(),
            accessCount: 0
        };
        this._working.unshift(item);
        if (this._working.length > this._maxWorking) {
            this._working = this._working.slice(0, this._maxWorking);
        }
        return item.id;
    },

    addSession(content, category = 'other', importance = 1, metadata = {}) {
        const item = {
            id: 's_' + Date.now(),
            content: content.slice(0, 2000),
            category,
            importance: Math.min(5, Math.max(1, importance)),
            ts: Date.now(),
            accessCount: 0,
            chapterRef: metadata.chapterRef || null,
            relatedEntities: metadata.relatedEntities || [],
            tags: metadata.tags || []
        };
        this._session.unshift(item);
        if (this._session.length > this._maxSession) {
            const toPersist = this._session.filter(i => i.importance >= 3 || i.accessCount >= 2);
            for (const p of toPersist.slice(0, 5)) {
                this.addPersistent(p.content, p.category, p.importance, { chapterRef: p.chapterRef, tags: p.tags });
            }
            this._session = this._session.slice(0, this._maxSession);
        }
        this._saveSessionDebounced();
        return item.id;
    },

    async addPersistent(content, category = 'other', importance = 1, metadata = {}) {
        const item = {
            id: 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            content: content.slice(0, 3000),
            category,
            importance: Math.min(5, Math.max(1, importance)),
            ts: Date.now(),
            accessCount: 0,
            chapterRef: metadata.chapterRef || null,
            relatedEntities: metadata.relatedEntities || [],
            tags: metadata.tags || [],
            source: metadata.source || 'user'
        };
        this._persistent.unshift(item);
        if (this._persistent.length > this._maxPersistent) {
            this._persistent.sort((a, b) => (b.importance + b.accessCount * 0.5) - (a.importance + a.accessCount * 0.5));
            this._persistent = this._persistent.slice(0, this._maxPersistent);
        }
        try {
            await DB.put('persistent_memory', item);
        } catch(e) {
            try {
                await DB.put('vectors', { id: item.id, content: item.content, tags: ['memory', category, ...(item.tags || [])], ts: item.ts });
            } catch(e2) {}
        }
        return item.id;
    },

    getWorking(limit = 10, category = null) {
        let items = this._working;
        if (category) items = items.filter(i => i.category === category);
        return items.slice(0, limit);
    },

    getSession(limit = 20, category = null) {
        let items = this._session;
        if (category) items = items.filter(i => i.category === category);
        return items.slice(0, limit);
    },

    getPersistent(limit = 30, category = null) {
        let items = this._persistent;
        if (category) items = items.filter(i => i.category === category);
        return items.slice(0, limit);
    },

    getAll(limit = 50) {
        const all = [
            ...this._working.map(i => ({ ...i, layer: 'working' })),
            ...this._session.slice(0, 20).map(i => ({ ...i, layer: 'session' })),
            ...this._persistent.slice(0, 20).map(i => ({ ...i, layer: 'persistent' }))
        ];
        all.sort((a, b) => b.ts - a.ts);
        return all.slice(0, limit);
    },

    searchWorking(query) {
        const q = query.toLowerCase();
        return this._working.filter(i => i.content.toLowerCase().includes(q) || i.category.includes(q));
    },

    searchSession(query) {
        const q = query.toLowerCase();
        return this._session.filter(i => 
            i.content.toLowerCase().includes(q) || 
            i.category.includes(q) ||
            (i.tags && i.tags.some(t => t.toLowerCase().includes(q)))
        );
    },

    async searchPersistent(query, limit = 15) {
        const q = query.toLowerCase();
        const results = this._persistent.filter(i => 
            i.content.toLowerCase().includes(q) || 
            i.category.includes(q) ||
            (i.tags && i.tags.some(t => t.toLowerCase().includes(q)))
        ).map(i => ({ ...i, relevance: 1 }));
        
        try {
            const vectors = await DB.getAll('vectors') || [];
            for (const v of vectors) {
                if ((v.tags || []).includes('memory') && v.content && v.content.toLowerCase().includes(q)) {
                    if (!results.find(r => r.id === v.id)) {
                        results.push({ id: v.id, content: v.content.slice(0, 500), category: v.tags[1] || 'other', relevance: 0.8, layer: 'persistent' });
                    }
                }
            }
        } catch(e) {}

        results.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
        return results.slice(0, limit);
    },

    async searchAll(query, limit = 20) {
        const working = this.searchWorking(query).slice(0, 5).map(i => ({ ...i, layer: 'working', relevance: 1.5 }));
        const session = this.searchSession(query).slice(0, 8).map(i => ({ ...i, layer: 'session', relevance: 1.2 }));
        const persistent = (await this.searchPersistent(query, limit)).map(i => ({ ...i, layer: 'persistent', relevance: i.relevance || 1 }));
        
        const all = [...working, ...session, ...persistent];
        all.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
        return all.slice(0, limit);
    },

    accessMemory(id) {
        for (const arr of [this._working, this._session, this._persistent]) {
            const item = arr.find(i => i.id === id);
            if (item) {
                item.accessCount = (item.accessCount || 0) + 1;
                return item;
            }
        }
        return null;
    },

    updateMemory(id, updates) {
        for (const arr of [this._working, this._session, this._persistent]) {
            const idx = arr.findIndex(i => i.id === id);
            if (idx >= 0) {
                arr[idx] = { ...arr[idx], ...updates, lastModified: Date.now() };
                return true;
            }
        }
        return false;
    },

    deleteMemory(id) {
        for (const arr of [this._working, this._session, this._persistent]) {
            const idx = arr.findIndex(i => i.id === id);
            if (idx >= 0) {
                arr.splice(idx, 1);
                return true;
            }
        }
        return false;
    },

    promoteToSession(id) {
        const item = this._working.find(i => i.id === id);
        if (item) {
            this.addSession(item.content, item.category, Math.min(5, item.importance + 1));
            this.deleteMemory(id);
            return true;
        }
        return false;
    },

    promoteToPersistent(id) {
        const item = this._session.find(i => i.id === id);
        if (item) {
            this.addPersistent(item.content, item.category, Math.min(5, item.importance + 1), { chapterRef: item.chapterRef, tags: item.tags });
            this.deleteMemory(id);
            return true;
        }
        return false;
    },

    buildContextForChapter(chapterNum, maxItems = 15) {
        const context = [];
        const working = this._working.slice(0, 5);
        for (const w of working) {
            context.push(`[工作记忆/${this._CATEGORIES[w.category]?.label || w.category}] ${w.content}`);
        }
        const sessionRelevant = this._session.filter(i => 
            i.chapterRef === chapterNum || 
            i.importance >= 3 ||
            i.accessCount >= 2
        ).slice(0, 8);
        for (const s of sessionRelevant) {
            context.push(`[会话记忆/${this._CATEGORIES[s.category]?.label || s.category}] ${s.content}`);
        }
        const persistentTop = this._persistent.filter(i => i.importance >= 4).slice(0, 5);
        for (const p of persistentTop) {
            context.push(`[持久记忆/${this._CATEGORIES[p.category]?.label || p.category}] ${p.content}`);
        }
        return context.slice(0, maxItems).join('\n');
    },

    buildWriterContext(query, chapterNum = null, maxTokens = 3000) {
        const parts = [];
        let tokens = 0;
        
        if (chapterNum) {
            const chapterMem = this.buildContextForChapter(chapterNum, 10);
            if (chapterMem) {
                parts.push('【章节相关记忆】\n' + chapterMem);
                tokens += 500;
            }
        }
        
        const working = this._working.slice(0, 5);
        if (working.length > 0) {
            parts.push('【当前工作记忆】\n' + working.map(w => `- ${w.content}`).join('\n'));
            tokens += 200;
        }
        
        if (query && tokens < maxTokens) {
            const relevant = this._session.filter(i => i.content.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
            if (relevant.length > 0) {
                parts.push('【相关会话记忆】\n' + relevant.map(s => `- ${s.content}`).join('\n'));
            }
        }
        
        const important = this._persistent.filter(i => i.importance >= 4).slice(0, 3);
        if (important.length > 0 && tokens < maxTokens) {
            parts.push('【重要持久记忆】\n' + important.map(p => `- ${p.content}`).join('\n'));
        }
        
        return parts.join('\n\n');
    },

    getStats() {
        return {
            working: this._working.length,
            session: this._session.length,
            persistent: this._persistent.length,
            categories: Object.keys(this._CATEGORIES).reduce((acc, cat) => {
                acc[cat] = this._persistent.filter(i => i.category === cat).length;
                return acc;
            }, {})
        };
    },

    clearWorking() {
        this._working = [];
    },

    clearSession() {
        this._session = [];
        this._saveSessionDebounced();
    },

    async clearPersistent() {
        this._persistent = [];
        try {
            const allMemory = await DB.getAll('persistent_memory') || [];
            for (const m of allMemory) {
                await DB.delete('persistent_memory', m.id);
            }
        } catch(e) {}
    },

    _saveTimeout: null,
    _saveSessionDebounced() {
        if (this._saveTimeout) clearTimeout(this._saveTimeout);
        this._saveTimeout = setTimeout(() => this._saveSession(), 1000);
    },

    async _saveSession() {
        try {
            localStorage.setItem('genesis_session_memory', JSON.stringify(this._session.slice(0, 50)));
        } catch(e) {}
    },

    async _loadSession() {
        try {
            const saved = localStorage.getItem('genesis_session_memory');
            if (saved) {
                this._session = JSON.parse(saved);
            }
        } catch(e) {}
    },

    async _loadPersistent() {
        try {
            const saved = await DB.getAll('persistent_memory') || [];
            this._persistent = saved.sort((a, b) => b.ts - a.ts);
        } catch(e) {
            try {
                const vectors = await DB.getAll('vectors') || [];
                this._persistent = vectors.filter(v => (v.tags || []).includes('memory')).map(v => ({
                    id: v.id,
                    content: v.content || '',
                    category: v.tags[1] || 'other',
                    importance: 3,
                    ts: v.ts || Date.now(),
                    accessCount: 0
                }));
            } catch(e2) {}
        }
    },

    async init() {
        await this._loadSession();
        await this._loadPersistent();
        this._initialized = true;
        console.log('三层记忆系统已初始化', this.getStats());
    }
};

window.MemorySystem = MemorySystem;
