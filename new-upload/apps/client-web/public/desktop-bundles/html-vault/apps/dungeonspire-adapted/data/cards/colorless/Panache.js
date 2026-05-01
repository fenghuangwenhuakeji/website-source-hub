/**
 * =================================================================================================
 * DungeonSpire - Panache
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Panache extends Card {
    constructor() {
        super({
            id: 'panache',
            name: 'Panache',
            type: 'power',
            rarity: 'rare',
            color: 'colorless',
            cost: 0,
            damage: 10,
            description: "Every time you play 5 cards in a single turn, deal !D! damage to ALL enemies.",
            assetPath: 'assets/cards/colorless/panache.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 4;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        player.addPower('panache', this.damage);
    }
}