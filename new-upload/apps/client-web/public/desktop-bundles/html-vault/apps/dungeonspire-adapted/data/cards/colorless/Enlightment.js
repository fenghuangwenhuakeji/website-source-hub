/**
 * =================================================================================================
 * DungeonSpire - Enlightment
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Enlightment extends Card {
    constructor() {
        super({
            id: 'enlightment',
            name: 'Enlightment',
            type: 'skill',
            rarity: 'uncommon',
            color: 'colorless',
            cost: 0,
            description: "Reduce the cost of cards in your hand to 1 this turn.",
            assetPath: 'assets/cards/colorless/enlightment.png'
        });
    }

    applyUpgrade() {
        this.description = "Reduce the cost of cards in your hand to 1 for the rest of combat.";
    }

    use(player, target) {
        player.hand.forEach(c => {
            if (c.costForTurn > 1) {
                c.costForTurn = 1;
                if (this.upgraded) c.cost = 1;
            }
        });
    }
}