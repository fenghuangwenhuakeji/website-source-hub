import { LootGenerator } from '../src/systems/loot/LootGenerator.js';
// Mock ContentRegistry for demo purposes
global.ContentRegistry = {
    getAll: (type) => {
        if (type === 'prefixes') return [
            { id: 'pre_fire', name: 'Fiery', allowedSlots: ['Weapon'], apply: (i) => i.stats.atk += 5 },
            { id: 'pre_ice', name: 'Frozen', allowedSlots: ['Weapon'], apply: (i) => i.stats.atk += 3 }
        ];
        if (type === 'suffixes') return [
            { id: 'suf_str', name: 'of Strength', apply: (i) => i.stats.str += 2 },
            { id: 'suf_dex', name: 'of Agility', apply: (i) => i.stats.dex += 2 }
        ];
        if (type === 'baseItems') return [
            { id: 'base_sword', name: 'Iron Sword', slot: 'Weapon', stats: { atk: 10 }, value: 50 }
        ];
        return [];
    }
};

const generator = new LootGenerator();
console.log('--- Generating 5 Random Legendary Weapons ---');
for (let i = 0; i < 5; i++) {
    const item = generator.generate(10, 'Legendary');
    console.log(`[${item.name}] (Value: ${item.value})`);
    console.log(`Stats:`, item.stats);
    console.log('---');
}