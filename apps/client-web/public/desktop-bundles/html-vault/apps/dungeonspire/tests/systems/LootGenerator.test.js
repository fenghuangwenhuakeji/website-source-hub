import { LootGenerator } from '../../src/systems/loot/LootGenerator.js';

test('LootGenerator creates item with affixes', () => {
    const generator = new LootGenerator();
    // Mock registry data...
    const item = generator.generate(5, 'Rare');
    expect(item).toBeDefined();
    expect(item.affixes.length).toBeGreaterThan(0);
    expect(item.stats.atk).toBeGreaterThan(0);
});