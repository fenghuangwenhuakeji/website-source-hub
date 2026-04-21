export class RandomStatGenerator {
    static generateItemStats(baseItem, level) {
        const variance = 0.2;
        const multiplier = 1 + (level * 0.1);
        
        const newStats = {};
        for (const [key, val] of Object.entries(baseItem.stats)) {
            const rand = 1 - variance + Math.random() * (variance * 2);
            newStats[key] = Math.floor(val * multiplier * rand);
        }
        
        return {
            ...baseItem,
            stats: newStats,
            generatedAt: Date.now()
        };
    }
}