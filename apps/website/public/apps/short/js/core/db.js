class DB {
    constructor() {
        this.dbName = 'StoryDB';
        this.version = 3;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = () => {
                this.db = request.result;
                // 检查必要的 ObjectStores 是否存在，如果不存在则重建
                if (!this.db.objectStoreNames.contains('books') || 
                    !this.db.objectStoreNames.contains('prompts') ||
                    !this.db.objectStoreNames.contains('api_pool')) {
                    this.db.close();
                    indexedDB.deleteDatabase(this.dbName);
                    this.init().then(resolve).catch(reject);
                    return;
                }
                resolve(this.db);
            };
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('books')) {
                    db.createObjectStore('books', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('prompts')) {
                    db.createObjectStore('prompts', { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains('api_pool')) {
                    db.createObjectStore('api_pool', { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([storeName], 'readonly');
            const req = tx.objectStore(storeName).getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([storeName], 'readwrite');
            const req = tx.objectStore(storeName).put(data);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([storeName], 'readwrite');
            const req = tx.objectStore(storeName).delete(key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }
}

export const db = new DB();