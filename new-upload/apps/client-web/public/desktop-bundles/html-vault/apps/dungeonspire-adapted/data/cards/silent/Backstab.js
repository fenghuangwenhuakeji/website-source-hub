/**
 * =================================================================================================
 * DungeonSpire - Backstab
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Backstab extends Card {
    constructor() {
        super({
            id: 'backstab',
            name: 'Backstab',
            type: 'attack',
            rarity: 'uncommon',
            color: 'green',
            cost: 0,
            damage: 11,
            description: "Innate.\nDeal !D! damage.\nExhaust.",
            assetPath: 'assets/cards/green/backstab.png',
            innate: true,
            exhaust: true
        });
    }

    applyUpgrade() {
        this.baseDamage += 4;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        if (target) target.takeDamage(this.damage);
    }
}