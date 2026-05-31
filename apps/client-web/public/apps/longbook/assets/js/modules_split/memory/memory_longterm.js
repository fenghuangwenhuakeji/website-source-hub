/**
 * MemorySystem - 长期记忆与跨层操作模块
 */
Object.assign(MemorySystem, {
    // —— 长期记忆 (IndexedDB，永久) ——
    async addPersistent(content, category = 'fact', importance = 0.7, tags = [], meta = {}) {
        const item = {
            id: 'pm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            content, category, importance, tags, ts: Date.now(), accessCount: 0,
            source: meta.source || 'manual', linkedTo: meta.linkedTo || [],
            lastAccess: Date.now(), module: meta.module || ''
        };
        let store = await DB.get('settings', 'memory_persistent') || { id: 'memory_persistent', items: [] };
        store.items.push(item);
        await DB.put('settings', store);
        return item;
    },

    async updatePersistent(id, updates) {
        let store = await DB.get('settings', 'memory_persistent');
        if (!store) return;
        const idx = store.items.findIndex(m => m.id === id);
        if (idx >= 0) { Object.assign(store.items[idx], updates); await DB.put('settings', store); }
    },

    async searchPersistent(query, limit = 10) {
        const store = await DB.get('settings', 'memory_persistent');
        if (!store || !store.items) return [];
        const q = query.toLowerCase();
        const qWords = q.split(/\s+/).filter(w => w.length > 0);
        return store.items.map(m => {
            const text = (m.content + ' ' + (m.tags || []).join(' ') + ' ' + (m.category || '') + ' ' + (m.module || '')).toLowerCase();
            let score = 0;
            if (text.includes(q)) score += 1.0;
            const matched = qWords.filter(w => text.includes(w)).length;
            score += matched / Math.max(qWords.length, 1) * 0.6;
            score += m.importance * 0.3;
            score += Math.min(m.accessCount || 0, 10) * 0.02;
            // 最近访问加分
            const daysSince = (Date.now() - (m.lastAccess || m.ts)) / 86400000;
            if (daysSince < 1) score += 0.15;
            else if (daysSince < 7) score += 0.05;
            return { ...m, _score: score };
        }).filter(m => m._score > 0).sort((a, b) => b._score - a._score).slice(0, limit);
    },

    async getAllPersistent() {
        const store = await DB.get('settings', 'memory_persistent');
        return (store && store.items) ? store.items : [];
    },

    async deletePersistent(id) {
        let store = await DB.get('settings', 'memory_persistent');
        if (!store) return;
        store.items = store.items.filter(m => m.id !== id);
        await DB.put('settings', store);
    },

    async clearAllPersistent() {
        await DB.put('settings', { id: 'memory_persistent', items: [] });
    },
    // —— 跨层操作 ——
    async promoteToLongTerm(workingId) {
        const item = this.working.find(m => m.id === workingId);
        if (!item) return;
        await this.addPersistent(item.content, 'promoted', Math.min(item.priority / 5, 1), item.tags, { source: 'working_promote', module: item.module });
        this.removeWorking(workingId);
    },

    async sessionToLongTerm(sessionId, itemId) {
        const items = await this.getSessionItems(sessionId, 999);
        const item = items.find(m => m.id === itemId);
        if (!item) return;
        await this.addPersistent(item.content, 'promoted', item.importance || 0.7, item.tags || [], { source: 'session_promote' });
    },

    // 批量提升：将模块通道的高优先级记忆提升为长期
    async promoteModuleChannel(moduleName, minPriority = 4) {
        const channel = this._moduleChannels[moduleName] || [];
        const toPromote = channel.filter(m => m.priority >= minPriority);
        let count = 0;
        for (const m of toPromote) {
            await this.addPersistent(m.content, moduleName, Math.min(m.priority / 5, 1), m.tags, { source: moduleName + '_auto', module: moduleName });
            count++;
        }
        return count;
    },

    // —— 重要度衰减 (长期记忆中长期未访问的条目降低重要度) ——
    async decayImportance() {
        let store = await DB.get('settings', 'memory_persistent');
        if (!store || !store.items) return;
        const now = Date.now();
        const DAY = 86400000;
        let changed = false;
        for (const m of store.items) {
            const daysSinceAccess = (now - (m.lastAccess || m.ts)) / DAY;
            if (daysSinceAccess > 7 && m.importance > 0.1) {
                m.importance = Math.max(0.1, m.importance - 0.02);
                changed = true;
            }
        }
        if (changed) await DB.put('settings', store);
    }
});
