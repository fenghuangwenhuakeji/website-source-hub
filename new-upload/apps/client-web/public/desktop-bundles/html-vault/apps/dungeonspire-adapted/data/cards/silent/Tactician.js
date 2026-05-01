/**
 * =================================================================================================
 * DungeonSpire - Tactician
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Tactician extends Card {
    constructor() {
        super({
            id: 'tactician',
            name: 'Tactician',
            type: 'skill',
            rarity: 'uncommon',
            color: 'green',
            cost: -2,
            description: "Unplayable.\nIf this card is discarded from your hand, gain 1 Energy.",
            assetPath: 'assets/cards/green/tactician.png'
        });
    }

    applyUpgrade() {
        this.description = "Unplayable.\nIf this card is discarded from your hand, gain 2 Energy.";
    }

    // Hook into discard logic
}