/**
 * 三层记忆系统 - AI酒馆增强版
 * 
 * 架构:
 * 1. WorkingMemory - 工作记忆 (当前对话窗口)
 * 2. SessionMemory - 会话记忆 (当前游戏会话)
 * 3. PersistentMemory - 持久记忆 (跨会话存储)
 * 
 * 特性:
 * - 智能上下文压缩
 * - 记忆重要性评估
 * - 语义相似度去重
 * - 自动摘要生成
 * - 记忆衰减机制
 */

const MemoryPriority = {
    CRITICAL: 5,
    HIGH: 4,
    MEDIUM: 3,
    LOW: 2,
    TRIVIAL: 1
};

const ContentType = {
    CODE: 'code',
    DIALOGUE: 'dialogue',
    ACTION: 'action',
    NARRATIVE: 'narrative',
    SYSTEM: 'system',
    ERROR: 'error',
    SUMMARY: 'summary',
    UNKNOWN: 'unknown'
};

class MemoryItem {
    constructor(options = {}) {
        this.id = options.id || this._generateId();
        this.content = options.content || '';
        this.role = options.role || 'user';
        this.priority = options.priority || MemoryPriority.MEDIUM;
        this.contentType = options.contentType || ContentType.UNKNOWN;
        this.timestamp = options.timestamp || Date.now();
        this.accessCount = options.accessCount || 0;
        this.importanceScore = options.importanceScore || 0.5;
        this.decayFactor = options.decayFactor || 1.0;
        this.compressed = options.compressed || false;
        this.summary = options.summary || '';
        this.metadata = options.metadata || {};
        this.tags = options.tags || [];
        this.embedding = options.embedding || null;
    }

    _generateId() {
        return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    calculateImportance() {
        const baseScore = this.priority / 5.0;
        const accessBonus = Math.min(0.2, this.accessCount * 0.02);
        
        const typeBonus = {
            [ContentType.SYSTEM]: 0.15,
            [ContentType.ACTION]: 0.1,
            [ContentType.NARRATIVE]: 0.08,
            [ContentType.DIALOGUE]: 0.05,
            [ContentType.ERROR]: 0.1
        }[this.contentType] || 0;

        const ageHours = (Date.now() - this.timestamp) / (1000 * 60 * 60);
        const timeDecay = Math.max(0.3, 1.0 - (ageHours / 168));
        
        const tagBonus = Math.min(0.1, this.tags.length * 0.02);
        
        this.importanceScore = Math.min(1.0, (baseScore + accessBonus + typeBonus + tagBonus) * timeDecay);
        return this.importanceScore;
    }

    toDict() {
        return {
            id: this.id,
            content: this.content,
            role: this.role,
            priority: this.priority,
            contentType: this.contentType,
            timestamp: this.timestamp,
            accessCount: this.accessCount,
            importanceScore: this.importanceScore,
            compressed: this.compressed,
            summary: this.summary,
            metadata: this.metadata,
            tags: this.tags
        };
    }

    static fromDict(data) {
        return new MemoryItem({
            id: data.id,
            content: data.content,
            role: data.role,
            priority: data.priority,
            contentType: data.contentType,
            timestamp: data.timestamp,
            accessCount: data.accessCount || 0,
            importanceScore: data.importanceScore || 0.5,
            compressed: data.compressed || false,
            summary: data.summary || '',
            metadata: data.metadata || {},
            tags: data.tags || []
        });
    }
}

class SmartCompressor {
    constructor(options = {}) {
        this.maxTokens = options.maxTokens || 4000;
        this.compressionRatio = options.compressionRatio || 0.3;
        this.keyPatterns = [
            /重要|关键|必须|核心|决定/g,
            /\d{4}年|\d{1,2}月|\d{1,2}日/g,
            /[A-Z][a-z]+/g,
            /「.+?」|".+?"|'.+?'/g
        ];
    }

    estimateTokens(text) {
        const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
        const numbers = (text.match(/\d+/g) || []).length;
        return Math.ceil(chineseChars * 1.5 + englishWords + numbers * 0.5);
    }

    extractKeySentences(text, maxSentences = 5) {
        const sentences = text.split(/[。！？\n]+/).filter(s => s.trim().length > 10);
        const scored = sentences.map(s => {
            let score = 0;
            this.keyPatterns.forEach(pattern => {
                const matches = s.match(pattern);
                if (matches) score += matches.length * 2;
            });
            if (s.includes('主角') || s.includes('玩家')) score += 3;
            if (/[！？]/.test(s)) score += 2;
            return { sentence: s, score };
        });
        
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, maxSentences).map(s => s.sentence);
    }

    compress(content, targetRatio = this.compressionRatio) {
        const originalTokens = this.estimateTokens(content);
        const targetTokens = Math.floor(originalTokens * targetRatio);
        
        if (originalTokens <= targetTokens) {
            return { compressed: content, ratio: 1.0, originalTokens };
        }

        const keySentences = this.extractKeySentences(content, Math.ceil(targetTokens / 50));
        const compressed = keySentences.join('。');
        
        return {
            compressed,
            ratio: this.estimateTokens(compressed) / originalTokens,
            originalTokens,
            compressedTokens: this.estimateTokens(compressed)
        };
    }
}

class WorkingMemory {
    constructor(options = {}) {
        this.maxSize = options.maxSize || 20;
        this.maxTokens = options.maxTokens || 4000;
        this.items = [];
        this.compressor = new SmartCompressor();
    }

    add(item) {
        if (!(item instanceof MemoryItem)) {
            item = new MemoryItem(item);
        }
        
        this.items.push(item);
        this._enforceLimits();
        return item.id;
    }

    _enforceLimits() {
        while (this.items.length > this.maxSize) {
            const leastImportant = this.items.reduce((min, item, idx) => 
                item.importanceScore < this.items[min].importanceScore ? idx : min, 0);
            this.items.splice(leastImportant, 1);
        }

        const totalTokens = this.getTotalTokens();
        if (totalTokens > this.maxTokens) {
            this._compressOldItems();
        }
    }

    _compressOldItems() {
        const oldItems = this.items.slice(0, Math.floor(this.items.length / 2));
        oldItems.forEach(item => {
            if (!item.compressed && item.content.length > 200) {
                const result = this.compressor.compress(item.content);
                item.summary = result.compressed;
                item.compressed = true;
            }
        });
    }

    getTotalTokens() {
        return this.items.reduce((sum, item) => {
            const content = item.compressed && item.summary ? item.summary : item.content;
            return sum + this.compressor.estimateTokens(content);
        }, 0);
    }

    getContext(maxTokens = this.maxTokens) {
        let tokens = 0;
        const context = [];
        
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            const content = item.compressed && item.summary ? item.summary : item.content;
            const itemTokens = this.compressor.estimateTokens(content);
            
            if (tokens + itemTokens <= maxTokens) {
                context.unshift({ role: item.role, content });
                tokens += itemTokens;
            } else {
                break;
            }
        }
        
        return context;
    }

    clear() {
        this.items = [];
    }

    getStats() {
        return {
            size: this.items.length,
            totalTokens: this.getTotalTokens(),
            compressedCount: this.items.filter(i => i.compressed).length
        };
    }
}

class SessionMemory {
    constructor(options = {}) {
        this.maxSize = options.maxSize || 100;
        this.items = [];
        this.summaries = [];
        this.sessionId = options.sessionId || this._generateSessionId();
        this.startTime = Date.now();
    }

    _generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    add(item) {
        if (!(item instanceof MemoryItem)) {
            item = new MemoryItem(item);
        }
        
        this.items.push(item);
        
        if (this.items.length > this.maxSize) {
            this._createSummary();
        }
        
        return item.id;
    }

    _createSummary() {
        const itemsToSummarize = this.items.splice(0, Math.floor(this.maxSize / 2));
        const summaryContent = itemsToSummarize.map(i => `[${i.role}]: ${i.content.slice(0, 100)}`).join('\n');
        
        this.summaries.push({
            timestamp: Date.now(),
            itemCount: itemsToSummarize.length,
            content: summaryContent
        });
    }

    getRecentContext(count = 20) {
        return this.items.slice(-count).map(item => ({
            role: item.role,
            content: item.content
        }));
    }

    getFullContext() {
        const summaryContext = this.summaries.map(s => `[摘要]: ${s.content}`).join('\n');
        const recentContext = this.items.map(i => `[${i.role}]: ${i.content}`).join('\n');
        return summaryContext + '\n\n' + recentContext;
    }

    getStats() {
        return {
            sessionId: this.sessionId,
            startTime: this.startTime,
            itemCount: this.items.length,
            summaryCount: this.summaries.length,
            duration: Date.now() - this.startTime
        };
    }
}

class PersistentMemory {
    constructor(dbManager) {
        this.dbManager = dbManager;
        this.storeName = 'persistent_memory';
        this.cache = new Map();
        this.maxCacheSize = 50;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbManager.db.name, this.dbManager.db.version + 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    store.createIndex('importance', 'importanceScore');
                    store.createIndex('timestamp', 'timestamp');
                    store.createIndex('tags', 'tags', { multiEntry: true });
                }
            };
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async store(item) {
        if (!(item instanceof MemoryItem)) {
            item = new MemoryItem(item);
        }
        
        item.calculateImportance();
        
        const data = item.toDict();
        
        await this._put(data);
        this._updateCache(item.id, item);
        
        return item.id;
    }

    async _put(data) {
        return new Promise((resolve, reject) => {
            const tx = this.dbManager.db.transaction([this.storeName], 'readwrite');
            const store = tx.objectStore(this.storeName);
            const req = store.put(data);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    _updateCache(id, item) {
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(id, item);
    }

    async retrieve(query, limit = 5) {
        const allItems = await this._getAll();
        
        const scored = allItems.map(item => {
            const score = this._calculateRelevance(item, query);
            return { item, score };
        });
        
        scored.sort((a, b) => b.score - a.score);
        
        return scored.slice(0, limit).map(s => s.item);
    }

    _calculateRelevance(item, query) {
        let score = item.importanceScore;
        
        const queryLower = query.toLowerCase();
        const contentLower = item.content.toLowerCase();
        
        if (contentLower.includes(queryLower)) {
            score += 0.3;
        }
        
        const queryWords = queryLower.split(/\s+/);
        queryWords.forEach(word => {
            if (word.length > 2 && contentLower.includes(word)) {
                score += 0.1;
            }
        });
        
        item.tags.forEach(tag => {
            if (queryLower.includes(tag.toLowerCase())) {
                score += 0.15;
            }
        });
        
        return score;
    }

    async _getAll() {
        return new Promise((resolve, reject) => {
            const tx = this.dbManager.db.transaction([this.storeName], 'readonly');
            const store = tx.objectStore(this.storeName);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result.map(d => MemoryItem.fromDict(d)));
            req.onerror = () => reject(req.error);
        });
    }

    async getByTag(tag, limit = 10) {
        const allItems = await this._getAll();
        return allItems
            .filter(item => item.tags.includes(tag))
            .sort((a, b) => b.importanceScore - a.importanceScore)
            .slice(0, limit);
    }

    async getStats() {
        const items = await this._getAll();
        return {
            totalItems: items.length,
            avgImportance: items.reduce((sum, i) => sum + i.importanceScore, 0) / items.length || 0,
            cacheSize: this.cache.size
        };
    }
}

class ThreeLayerMemorySystem {
    constructor(dbManager, options = {}) {
        this.dbManager = dbManager;
        this.working = new WorkingMemory(options.working);
        this.session = new SessionMemory(options.session);
        this.persistent = null;
        this.options = options;
    }

    async init() {
        this.persistent = new PersistentMemory(this.dbManager);
        try {
            await this.persistent.init();
        } catch (e) {
            console.warn('PersistentMemory init warning:', e);
        }
        console.log('ThreeLayerMemorySystem initialized');
    }

    addMessage(content, role = 'user', metadata = {}) {
        const item = new MemoryItem({
            content,
            role,
            contentType: this._detectContentType(content, role),
            priority: metadata.priority || MemoryPriority.MEDIUM,
            tags: metadata.tags || [],
            metadata
        });

        this.working.add(item);
        this.session.add(item);

        if (item.importanceScore >= 0.7 || metadata.persistent) {
            this.persistent.store(item);
        }

        return item.id;
    }

    _detectContentType(content, role) {
        if (role === 'system') return ContentType.SYSTEM;
        if (content.includes('错误') || content.includes('失败')) return ContentType.ERROR;
        if (content.startsWith('「') || content.includes('说道')) return ContentType.DIALOGUE;
        if (content.includes('你') && content.includes('了')) return ContentType.ACTION;
        if (content.length > 200) return ContentType.NARRATIVE;
        return ContentType.UNKNOWN;
    }

    getContext(maxTokens = 4000, includePersistent = true) {
        const context = [];

        if (includePersistent && this.persistent) {
            const recentQuery = this.working.items.slice(-3).map(i => i.content).join(' ');
            if (recentQuery) {
                this.persistent.retrieve(recentQuery, 3).then(items => {
                    items.forEach(item => {
                        context.push({ role: 'system', content: `[记忆] ${item.summary || item.content}` });
                    });
                });
            }
        }

        context.push(...this.working.getContext(maxTokens));

        return context;
    }

    async consolidateSession() {
        const sessionItems = this.session.items;
        
        if (sessionItems.length < 5) return null;

        const importantItems = sessionItems.filter(i => i.importanceScore >= 0.6);
        
        for (const item of importantItems) {
            await this.persistent.store(item);
        }

        console.log(`Consolidated ${importantItems.length} items to persistent memory`);
        return importantItems.length;
    }

    newSession() {
        this.consolidateSession();
        this.session = new SessionMemory(this.options.session);
        this.working.clear();
    }

    getStats() {
        return {
            working: this.working.getStats(),
            session: this.session.getStats(),
            persistent: this.persistent ? null : 'not initialized'
        };
    }

    async exportMemory() {
        return {
            working: this.working.items.map(i => i.toDict()),
            session: {
                id: this.session.sessionId,
                items: this.session.items.map(i => i.toDict()),
                summaries: this.session.summaries
            },
            exportedAt: new Date().toISOString()
        };
    }

    async importMemory(data) {
        if (data.working) {
            this.working.items = data.working.map(d => MemoryItem.fromDict(d));
        }
        if (data.session) {
            this.session.sessionId = data.session.id;
            this.session.items = data.session.items.map(d => MemoryItem.fromDict(d));
            this.session.summaries = data.session.summaries || [];
        }
    }
}

export {
    ThreeLayerMemorySystem,
    MemoryItem,
    MemoryPriority,
    ContentType,
    WorkingMemory,
    SessionMemory,
    PersistentMemory,
    SmartCompressor
};
