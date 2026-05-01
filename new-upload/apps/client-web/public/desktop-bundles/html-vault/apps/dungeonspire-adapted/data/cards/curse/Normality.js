/**
 * =================================================================================================
 * DungeonSpire - Normality
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Normality extends Card {
    constructor() {
        super({
            id: 'normality',
            name: 'Normality',
            type: 'curse',
            rarity: 'curse',
            color: 'colorless',
            cost: -2,
            description: "Unplayable.\nYou cannot play more than 3 cards this turn.",
            assetPath: 'assets/cards/curse/normality.png'
        });
    }

    // Hook into playCard check
}