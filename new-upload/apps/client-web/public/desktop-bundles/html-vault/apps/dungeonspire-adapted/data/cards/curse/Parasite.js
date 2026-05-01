/**
 * =================================================================================================
 * DungeonSpire - Parasite
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Parasite extends Card {
    constructor() {
        super({
            id: 'parasite',
            name: 'Parasite',
            type: 'curse',
            rarity: 'curse',
            color: 'colorless',
            cost: -2,
            description: "Unplayable.\nIf transformed or removed from your deck, lose 3 Max HP.",
            assetPath: 'assets/cards/curse/parasite.png'
        });
    }

    // Hook into removal logic
}