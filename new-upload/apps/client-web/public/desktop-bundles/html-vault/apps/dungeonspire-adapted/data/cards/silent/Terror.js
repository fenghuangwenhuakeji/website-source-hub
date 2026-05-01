/**
 * =================================================================================================
 * DungeonSpire - Terror
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Terror extends Card {
    constructor() {
        super({
            id: 'terror',
            name: 'Terror',
            type: 'skill',
            rarity: 'uncommon',
            color: 'green',
            cost: 1,
            description: "Apply 99 Vulnerable.\nExhaust.",
            assetPath: 'assets/cards/green/terror.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.cost = 0;
        this.baseCost = 0;
    }

    use(player, target) {
        if (target) target.addPower('vulnerable', 99);
    }
}