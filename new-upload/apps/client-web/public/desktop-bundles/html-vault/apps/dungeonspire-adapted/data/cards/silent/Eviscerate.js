/**
 * =================================================================================================
 * DungeonSpire - Eviscerate
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Eviscerate extends Card {
    constructor() {
        super({
            id: 'eviscerate',
            name: 'Eviscerate',
            type: 'attack',
            rarity: 'uncommon',
            color: 'green',
            cost: 3,
            damage: 7,
            description: "Costs 1 less for each card discarded this turn.\nDeal !D! damage 3 times.",
            assetPath: 'assets/cards/green/eviscerate.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 2;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        if (target) {
            target.takeDamage(this.damage);
            target.takeDamage(this.damage);
            target.takeDamage(this.damage);
        }
    }
}