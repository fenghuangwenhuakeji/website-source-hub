export class ContentRegistry {
    constructor() {
        this.cards = new Map();
        this.enemies = new Map();
        this.relics = new Map();
        this.items = new Map();
    }

    register(type, id, data) {
        if (this[type]) {
            this[type].set(id, data);
        }
    }

    get(type, id) {
        return this[type]?.get(id);
    }

    getAll(type) {
        return Array.from(this[type]?.values() || []);
    }

    // 用于随机生成的辅助方法
    getRandom(type, filterFunc) {
        const items = this.getAll(type).filter(filterFunc || (() => true));
        return items[Math.floor(Math.random() * items.length)];
    }
}