/**
 * =================================================================================================
 * DungeonSpire - Mayhem
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Mayhem extends Card {
    constructor() {
        super({
            id: 'mayhem',
            name: 'Mayhem',
            type: 'power',
            rarity: 'rare',
            color: 'colorless',
            cost: 2,
            description: "At the start of your turn, play the top card of your draw pile.",
            assetPath: 'assets/cards/colorless/mayhem.png'
        });
    }

    applyUpgrade() {
        this.cost = 1;
        this.baseCost = 1;
    }

    use(player, target) {
        player.addPower('mayhem', 1);
    }
}