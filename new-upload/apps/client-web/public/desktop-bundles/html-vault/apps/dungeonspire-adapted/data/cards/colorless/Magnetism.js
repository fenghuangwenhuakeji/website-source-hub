/**
 * =================================================================================================
 * DungeonSpire - Magnetism
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Magnetism extends Card {
    constructor() {
        super({
            id: 'magnetism',
            name: 'Magnetism',
            type: 'power',
            rarity: 'rare',
            color: 'colorless',
            cost: 2,
            description: "At the start of your turn, add a random Colorless card to your hand.",
            assetPath: 'assets/cards/colorless/magnetism.png'
        });
    }

    applyUpgrade() {
        this.cost = 1;
        this.baseCost = 1;
    }

    use(player, target) {
        player.addPower('magnetism', 1);
    }
}