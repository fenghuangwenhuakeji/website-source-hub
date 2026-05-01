/**
 * =================================================================================================
 * DungeonSpire - Strike (Red)
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class StrikeRed extends Card {
    constructor() {
        super({
            id: 'strike_r',
            name: 'Strike',
            type: 'attack',
            rarity: 'basic',
            color: 'red',
            cost: 1,
            damage: 6,
            description: "Deal !D! damage.",
            assetPath: 'assets/cards/red/strike.png'
        });
        this.tags = ['strike', 'starter'];
    }

    applyUpgrade() {
        this.baseDamage += 3;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        if (target) {
            target.takeDamage(this.damage);
        }
    }
}