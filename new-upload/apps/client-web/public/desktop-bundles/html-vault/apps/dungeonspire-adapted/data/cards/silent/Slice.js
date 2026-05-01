/**
 * =================================================================================================
 * DungeonSpire - Slice
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Slice extends Card {
    constructor() {
        super({
            id: 'slice',
            name: 'Slice',
            type: 'attack',
            rarity: 'common',
            color: 'green',
            cost: 0,
            damage: 6,
            description: "Deal !D! damage.",
            assetPath: 'assets/cards/green/slice.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 3;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        if (target) target.takeDamage(this.damage);
    }
}