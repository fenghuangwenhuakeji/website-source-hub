export const DB = {
    name: 'GenesisDB', version: 8, db: null,
    async init() {
        if (this.db) return this.db;
        return new Promise((resolve, reject) => {
            try {
                const req = indexedDB.open(this.name, this.version);
                req.onerror = (e) => {
                    console.error("DB Open Error", e);
                    resolve(null);
                };
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    const stores = [
                        'volumes', 'chapters', 'outlines', 'entities', 'vectors',
                        'prompts', 'tools_custom', 'assets',
                        'library_books', 'trading_strategies', 'code_snippets',
                        'text_api_pool', 'image_api_pool', 'video_api_pool', 'audio_api_pool',
                        'settings', 'chat_sessions'
                    ];
                    stores.forEach(s => { if(!db.objectStoreNames.contains(s)) db.createObjectStore(s, {keyPath: 'id'}); });
                };
                req.onsuccess = (e) => {
                    this.db = e.target.result;
                    this.db.onversionchange = () => {
                        this.db.close();
                        this.db = null;
                    };
                    resolve(this.db);
                };
                req.onblocked = () => {
                    console.warn("DB Open Blocked");
                };
            } catch (e) {
                console.error("IndexedDB not supported or blocked", e);
                resolve(null);
            }
        });
    },
    async op(store, mode, fn) {
        try {
            if(!this.db) await this.init();
            if(!this.db) throw new Error("Database not initialized");
            
            return new Promise((resolve, reject) => {
                try {
                    const tx = this.db.transaction(store, mode);
                    const req = fn(tx.objectStore(store));
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = (e) => {
                        console.error(`DB Op Error [${store}]:`, e.target.error);
                        reject(e.target.error);
                    };
                } catch (e) {
                    reject(e);
                }
            });
        } catch (e) {
            console.error("DB Transaction Error:", e);
            return null; // Fail gracefully
        }
    },
    put: (s, v) => DB.op(s, 'readwrite', st => st.put(v)),
    get: (s, k) => DB.op(s, 'readonly', st => st.get(k)),
    getAll: (s) => DB.op(s, 'readonly', st => st.getAll()),
    del: (s, k) => DB.op(s, 'readwrite', st => st.delete(k))
};
