/**
 * =================================================================================================
 * DungeonSpire - Forethought
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Forethought extends Card {
    constructor() {
        super({
            id: 'forethought',
            name: 'Forethought',
            type: 'skill',
            rarity: 'uncommon',
            color: 'colorless',
            cost: 0,
            description: "Place a card from your hand to the bottom of your draw pile.\nIt costs 0 until played.",
            assetPath: 'assets/cards/colorless/forethought.png'
        });
    }

    applyUpgrade() {
        this.description = "Place any number of cards from your hand to the bottom of your draw pile.\nThey cost 0 until played.";
    }

    use(player, target) {
        // UI to select card(s)
    }
}