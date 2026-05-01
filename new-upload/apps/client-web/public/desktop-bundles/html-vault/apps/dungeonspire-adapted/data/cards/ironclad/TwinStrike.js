/**
 * =================================================================================================
 * DungeonSpire - Twin Strike
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class TwinStrike extends Card {
    constructor() {
        super({
            id: 'twin_strike',
            name: 'Twin Strike',
            type: 'attack',
            rarity: 'common',
            color: 'red',
            cost: 1,
            damage: 5,
            description: "Deal !D! damage twice.",
            assetPath: 'assets/cards/red/twin_strike.png'
        });
        this.tags = ['strike'];
    }

    applyUpgrade() {
        this.baseDamage += 2;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        if (target) {
            target.takeDamage(this.damage);
            target.takeDamage(this.damage);
        }
    }
}