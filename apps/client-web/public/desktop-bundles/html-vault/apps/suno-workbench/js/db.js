class DB {
    constructor() {
        this.dbName = 'SunoWorkbenchDB';
        this.version = 1;
        this.db = null;
        this.initialized = false;
        this.stores = ['api_pool', 'projects', 'favorites'];
    }

    async init() {
        if (this.initialized && this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(new Error('数据库连接失败'));
            
            request.onsuccess = () => {
                this.db = request.result;
                this.initialized = true;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const database = event.target.result;
                this.createStores(database);
            };
        });
    }

    createStores(database) {
        if (!database.objectStoreNames.contains('api_pool')) {
            const apiStore = database.createObjectStore('api_pool', { keyPath: 'id', autoIncrement: true });
            apiStore.createIndex('is_active', 'is_active', { unique: false });
            apiStore.createIndex('provider', 'provider', { unique: false });
        }
        if (!database.objectStoreNames.contains('projects')) {
            const projectStore = database.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
            projectStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        if (!database.objectStoreNames.contains('favorites')) {
            const favStore = database.createObjectStore('favorites', { keyPath: 'id', autoIncrement: true });
            favStore.createIndex('genre', 'genre', { unique: false });
        }
    }

    async ensureInit() {
        if (!this.initialized || !this.db) await this.init();
    }

    async getAll(storeName) {
        await this.ensureInit();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(new Error('获取数据失败'));
        });
    }

    async put(storeName, data) {
        await this.ensureInit();
        if (!data.id) data.createdAt = new Date().toISOString();
        data.updatedAt = new Date().toISOString();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('保存数据失败'));
        });
    }

    async delete(storeName, key) {
        await this.ensureInit();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('删除数据失败'));
        });
    }

    async get(storeName, key) {
        await this.ensureInit();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('获取数据失败'));
        });
    }

    async clear(storeName) {
        await this.ensureInit();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('清空数据失败'));
        });
    }
}

export const db = new DB();
