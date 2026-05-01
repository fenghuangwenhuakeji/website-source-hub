/**
 * =================================================================================================
 * DungeonSpire - Purity
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Purity extends Card {
    constructor() {
        super({
            id: 'purity',
            name: 'Purity',
            type: 'skill',
            rarity: 'uncommon',
            color: 'colorless',
            cost: 0,
            description: "Choose up to 3 cards in your hand and Exhaust them.\nExhaust.",
            assetPath: 'assets/cards/colorless/purity.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.description = "Choose up to 5 cards in your hand and Exhaust them.\nExhaust.";
    }

    use(player, target) {
        // UI for selection
    }
}