/**
 * =================================================================================================
 * DungeonSpire - Bane
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Bane extends Card {
    constructor() {
        super({
            id: 'bane',
            name: 'Bane',
            type: 'attack',
            rarity: 'common',
            color: 'green',
            cost: 1,
            damage: 7,
            description: "Deal !D! damage.\nIf the enemy is Poisoned, deal !D! damage again.",
            assetPath: 'assets/cards/green/bane.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 3;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        if (target) {
            target.takeDamage(this.damage);
            if (target.hasPower('poison')) {
                target.takeDamage(this.damage);
            }
        }
    }
}