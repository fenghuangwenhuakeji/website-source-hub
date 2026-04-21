/**
 * =================================================================================================
 * DungeonSpire - String Utilities
 * =================================================================================================
 */

export class StringUtils {
    static capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static formatGold(amount) {
        return `${amount} G`;
    }

    static getRarityColor(rarity) {
        switch (rarity) {
            case 'common': return '#aaa';
            case 'uncommon': return '#4da6ff';
            case 'rare': return '#ffd700';
            default: return '#fff';
        }
    }
}