/**
 * 存储服务 (StorageService)
 */
export class StorageService {
    constructor(prefix = 'starwhispers_') {
        this.prefix = prefix;
    }

    set(key, value) {
        localStorage.setItem(this.prefix + key, JSON.stringify(value));
    }

    get(key, defaultValue = null) {
        const value = localStorage.getItem(this.prefix + key);
        return value ? JSON.parse(value) : defaultValue;
    }

    remove(key) {
        localStorage.removeItem(this.prefix + key);
    }

    clear() {
        Object.keys(localStorage)
            .filter(k => k.startsWith(this.prefix))
            .forEach(k => localStorage.removeItem(k));
    }
}