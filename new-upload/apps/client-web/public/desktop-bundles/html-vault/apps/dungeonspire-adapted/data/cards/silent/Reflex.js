/**
 * =================================================================================================
 * DungeonSpire - Reflex
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Reflex extends Card {
    constructor() {
        super({
            id: 'reflex',
            name: 'Reflex',
            type: 'skill',
            rarity: 'uncommon',
            color: 'green',
            cost: -2,
            description: "Unplayable.\nIf this card is discarded from your hand, draw 2 cards.",
            assetPath: 'assets/cards/green/reflex.png'
        });
    }

    applyUpgrade() {
        this.description = "Unplayable.\nIf this card is discarded from your hand, draw 3 cards.";
    }

    // Hook into discard logic
}