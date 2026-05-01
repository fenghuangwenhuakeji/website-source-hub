/**
 * =================================================================================================
 * DungeonSpire - Swift Strike
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class SwiftStrike extends Card {
    constructor() {
        super({
            id: 'swift_strike',
            name: 'Swift Strike',
            type: 'attack',
            rarity: 'uncommon',
            color: 'colorless',
            cost: 0,
            damage: 7,
            description: "Deal !D! damage.",
            assetPath: 'assets/cards/colorless/swift_strike.png'
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