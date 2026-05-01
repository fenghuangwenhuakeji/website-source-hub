/**
 * =================================================================================================
 * DungeonSpire - Catalyst
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Catalyst extends Card {
    constructor() {
        super({
            id: 'catalyst',
            name: 'Catalyst',
            type: 'skill',
            rarity: 'uncommon',
            color: 'green',
            cost: 1,
            description: "Double an enemy's Poison.",
            assetPath: 'assets/cards/green/catalyst.png'
        });
    }

    applyUpgrade() {
        this.description = "Triple an enemy's Poison.";
    }

    use(player, target) {
        if (target && target.hasPower('poison')) {
            const currentPoison = target.getPowerAmount('poison');
            if (this.upgraded) {
                target.addPower('poison', currentPoison * 2); // Adds 2x, resulting in 3x total
            } else {
                target.addPower('poison', currentPoison); // Adds 1x, resulting in 2x total
            }
        }
    }
}