import { ContentRegistry } from '../../src/systems/ContentRegistry.js';

export class CardFactory {
    static createCard(id) {
        // 模拟从注册表中查找卡牌数据并实例化
        // 在实际运行中，需要遍历所有卡牌目录并注册
        const cardData = ContentRegistry.get('cards', id);
        if (!cardData) return null;
        return { ...cardData, instanceId: Math.random().toString(36).substr(2, 9) };
    }

    static createRandomCard(rarity) {
        // 随机生成逻辑
    }
}