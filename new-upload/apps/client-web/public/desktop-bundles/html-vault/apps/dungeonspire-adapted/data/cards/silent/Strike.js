/**
 * =================================================================================================
 * DungeonSpire - Strike (Green)
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class StrikeGreen extends Card {
    constructor() {
        super({
            id: 'strike_g',
            name: 'Strike',
            type: 'attack',
            rarity: 'basic',
            color: 'green',
            cost: 1,
            damage: 6,
            description: "Deal !D! damage.",
            assetPath: 'assets/cards/green/strike.png'
        });
        this.tags = ['strike', 'starter'];
    }

    applyUpgrade() {
        this.baseDamage += 3;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        if (target) target.takeDamage(this.damage);
    }
}