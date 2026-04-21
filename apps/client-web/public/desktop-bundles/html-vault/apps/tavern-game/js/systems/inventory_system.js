import { dbManager } from '../core/db_manager.js';
import { eventBus } from '../core/event_bus.js';

export const inventorySystem = {
    items: [],

    async init() {
        this.items = await dbManager.getAll('inventory');
        this.emitUpdate();
    },

    async addItem(item) {
        if (this.items.length >= 50) return false;
        this.items.push(item);
        await this.save();
        return true;
    },

    async removeItem(index) {
        if (index >= 0 && index < this.items.length) {
            this.items.splice(index, 1);
            await this.save();
        }
    },

    async save() {
        // 全量覆盖保存
        // 注意：实际生产中应优化为增量更新或单项操作
        const tx = dbManager.db.transaction(['inventory'], 'readwrite');
        const store = tx.objectStore('inventory');
        await store.clear();
        for (const item of this.items) {
            await store.add(item);
        }
        this.emitUpdate();
    },

    emitUpdate() {
        eventBus.emit('inventory-updated', this.items);
    }
};