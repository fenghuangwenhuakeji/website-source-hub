interface MemoryItem {
    id: string;
    content: string;
    type: string;
    priority: number;
    ts: number;
    accessCount: number;
    tags: string[];
    source: string;
    linkedTo: string | null;
    module: string;
    chapterId: string | null;
    lastAccess?: number;
}

interface SessionMemory {
    id: string;
    type: string;
    content: string;
    tags: string[];
    ts: number;
    importance: number;
}

interface LongTermMemory {
    id: string;
    content: string;
    category: string;
    tags: string[];
    ts: number;
    accessCount: number;
    importance: number;
}

declare const DB: {
    put: (store: string, data: any) => Promise<any>;
    get: <T = any>(store: string, key: string) => Promise<T | null>;
    getAll: <T = any>(store: string) => Promise<T[]>;
    del: (store: string, key: string) => Promise<void>;
};

const MemorySystem = {
    working: [] as MemoryItem[],
    maxWorking: 80,
    _decayInterval: null as ReturnType<typeof setInterval> | null,
    _moduleChannels: {} as Record<string, MemoryItem[]>,

    addWorking(content: string, type: string = 'conversation', priority: number = 3, meta: Record<string, any> = {}): MemoryItem {
        const item: MemoryItem = {
            id: 'wm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            content,
            type,
            priority,
            ts: Date.now(),
            accessCount: 0,
            tags: meta.tags || [],
            source: meta.source || '',
            linkedTo: meta.linkedTo || null,
            module: meta.module || '',
            chapterId: meta.chapterId || null
        };

        this.working.push(item);
        if (this.working.length > this.maxWorking) this._compressWorking();

        if (item.module) {
            if (!this._moduleChannels[item.module]) this._moduleChannels[item.module] = [];
            this._moduleChannels[item.module].push(item);
            if (this._moduleChannels[item.module].length > 30) {
                this._moduleChannels[item.module] = this._moduleChannels[item.module].slice(-20);
            }
        }
        return item;
    },

    getWorkingContext(maxItems: number = 20): string {
        return this.working
            .sort((a, b) => (b.priority + b.accessCount * 0.2) - (a.priority + a.accessCount * 0.2))
            .slice(0, maxItems)
            .map(m => m.content)
            .join('\n---\n');
    },

    getModuleContext(moduleName: string, maxItems: number = 10): string {
        const channel = this._moduleChannels[moduleName] || [];
        if (channel.length > 0) {
            return channel.slice(-maxItems).map(m => m.content).join('\n---\n');
        }
        return this.working
            .filter(m => m.module === moduleName || m.type === moduleName)
            .slice(-maxItems)
            .map(m => m.content)
            .join('\n---\n');
    },

    getWorkingByType(type: string): MemoryItem[] {
        return this.working.filter(m => m.type === type);
    },

    touchWorking(id: string): void {
        const m = this.working.find(x => x.id === id);
        if (m) {
            m.accessCount++;
            m.lastAccess = Date.now();
        }
    },

    removeWorking(id: string): void {
        this.working = this.working.filter(m => m.id !== id);
    },

    clearWorking(): void {
        this.working = [];
        this._moduleChannels = {};
    },

    _compressWorking(): void {
        this.working.sort((a, b) => (b.priority + b.accessCount * 0.1) - (a.priority + a.accessCount * 0.1));
        const keep = Math.floor(this.maxWorking * 0.6);
        const removed = this.working.splice(keep);
        if (removed.length > 0) {
            const summary = removed.map(m => m.content.slice(0, 80)).join('; ');
            this.addSession('auto_compress', '[自动压缩] ' + summary, ['auto', 'compress']);
        }
    },

    async addSession(type: string, content: string, tags: string[] = []): Promise<SessionMemory | null> {
        const item: SessionMemory = {
            id: 'sm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            type,
            content,
            tags,
            ts: Date.now(),
            importance: 3
        };
        try {
            await DB.put('memory_sessions', item);
            return item;
        } catch (e) {
            console.error('Failed to save session memory:', e);
            return null;
        }
    },

    async getSessionContext(maxItems: number = 30): Promise<string> {
        try {
            const sessions = await DB.getAll<SessionMemory>('memory_sessions') || [];
            return sessions
                .sort((a, b) => b.ts - a.ts)
                .slice(0, maxItems)
                .map(s => `[${s.type}] ${s.content}`)
                .join('\n---\n');
        } catch {
            return '';
        }
    },

    async addLongTerm(content: string, category: string = 'general', tags: string[] = [], importance: number = 3): Promise<LongTermMemory | null> {
        const item: LongTermMemory = {
            id: 'lm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            content,
            category,
            tags,
            ts: Date.now(),
            accessCount: 0,
            importance
        };
        try {
            await DB.put('memory_longterm', item);
            return item;
        } catch (e) {
            console.error('Failed to save long-term memory:', e);
            return null;
        }
    },

    async getLongTermContext(category?: string, maxItems: number = 20): Promise<string> {
        try {
            let memories = await DB.getAll<LongTermMemory>('memory_longterm') || [];
            if (category) {
                memories = memories.filter(m => m.category === category);
            }
            return memories
                .sort((a, b) => (b.importance + b.accessCount * 0.1) - (a.importance + a.accessCount * 0.1))
                .slice(0, maxItems)
                .map(m => `[${m.category}] ${m.content}`)
                .join('\n---\n');
        } catch {
            return '';
        }
    },

    async getFullContext(maxWorking: number = 15, maxSession: number = 10, maxLongTerm: number = 5): Promise<string> {
        const workingCtx = this.getWorkingContext(maxWorking);
        const sessionCtx = await this.getSessionContext(maxSession);
        const longTermCtx = await this.getLongTermContext(undefined, maxLongTerm);

        let full = '';
        if (workingCtx) full += '【工作记忆】\n' + workingCtx + '\n\n';
        if (sessionCtx) full += '【会话记忆】\n' + sessionCtx + '\n\n';
        if (longTermCtx) full += '【长期记忆】\n' + longTermCtx;

        return full;
    }
};

(window as any).MemorySystem = MemorySystem;
