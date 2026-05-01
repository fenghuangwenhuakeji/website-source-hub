/**
 * =================================================================================================
 * DungeonSpire - Deadly Poison
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class DeadlyPoison extends Card {
    constructor() {
        super({
            id: 'deadly_poison',
            name: 'Deadly Poison',
            type: 'skill',
            rarity: 'common',
            color: 'green',
            cost: 1,
            magicNumber: 5,
            description: "Apply !M! Poison.",
            assetPath: 'assets/cards/green/deadly_poison.png'
        });
    }

    applyUpgrade() {
        this.baseMagicNumber += 2;
        this.magicNumber = this.baseMagicNumber;
    }

    use(player, target) {
        if (target) {
            target.addPower('poison', this.magicNumber);
        }
    }
}