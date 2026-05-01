import { ContentRegistry } from '../ContentRegistry.js';

export class LootGenerator {
    constructor() {
        this.prefixes = ContentRegistry.getAll('prefixes');
        this.suffixes = ContentRegistry.getAll('suffixes');
        this.baseItems = ContentRegistry.getAll('baseItems');
    }

    generate(level, rarity = 'Common') {
        // 1. 选择底材
        const base = this.getRandomItem(this.baseItems);
        const item = JSON.parse(JSON.stringify(base)); // Deep copy
        item.uid = Math.random().toString(36);
        item.affixes = [];

        // 2. 根据稀有度决定词缀数量
        let prefixCount = 0;
        let suffixCount = 0;

        if (rarity === 'Uncommon') { prefixCount = 1; }
        else if (rarity === 'Rare') { prefixCount = 1; suffixCount = 1; }
        else if (rarity === 'Legendary') { prefixCount = 2; suffixCount = 1; }

        // 3. 应用前缀
        for (let i = 0; i < prefixCount; i++) {
            const prefix = this.getRandomItem(this.prefixes.filter(p => p.allowedSlots.includes(item.slot)));
            if (prefix) {
                prefix.apply(item);
                item.name = `${prefix.name} ${item.name}`;
                item.affixes.push(prefix.id);
            }
        }

        // 4. 应用后缀
        for (let i = 0; i < suffixCount; i++) {
            const suffix = this.getRandomItem(this.suffixes);
            if (suffix) {
                suffix.apply(item);
                item.name = `${item.name} ${suffix.name}`;
                item.affixes.push(suffix.id);
            }
        }

        // 5. 根据等级调整数值
        this.scaleStats(item, level);

        return item;
    }

    getRandomItem(list) {
        return list[Math.floor(Math.random() * list.length)];
    }

    scaleStats(item, level) {
        const multiplier = 1 + (level * 0.1);
        for (let key in item.stats) {
            item.stats[key] = Math.floor(item.stats[key] * multiplier);
        }
        item.value = Math.floor(item.value * multiplier);
    }
}