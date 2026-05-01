/**
 * =================================================================================================
 * DungeonSpire - Relic Base Class
 * =================================================================================================
 */

export class Relic {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.rarity = data.rarity || 'common'; // common, uncommon, rare, boss, shop, event
        this.assetPath = data.assetPath || 'assets/relics/placeholder.png';
        this.counter = -1;
    }

    onEquip(player) {}
    onUnequip(player) {}
    onCombatStart(player) {}
    onTurnStart(player) {}
    onPlayerAttack(card, enemy) {}
    onPlayerLoseHp(amount) {}
}