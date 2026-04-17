const TavernDB = {
    name: 'AITavernTOP1DB',
    version: 3,
    db: null,

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.name, this.version);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => { this.db = request.result; resolve(this.db); };
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                const stores = ['api_pool', 'scripts', 'saves', 'achievements', 'stats', 'inventory', 'skills', 'quests'];
                stores.forEach(store => {
                    if (!db.objectStoreNames.contains(store)) {
                        db.createObjectStore(store, { keyPath: 'id', autoIncrement: store !== 'scripts' && store !== 'skills' });
                    }
                });
            };
        });
    },

    async getAll(store) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([store], 'readonly');
            const req = tx.objectStore(store).getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    async put(store, data) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([store], 'readwrite');
            const req = tx.objectStore(store).put(data);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    async delete(store, key) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([store], 'readwrite');
            const req = tx.objectStore(store).delete(key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }
};
