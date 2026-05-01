/**
 * =================================================================================================
 * DungeonSpire - Ascender's Bane
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class AscendersBane extends Card {
    constructor() {
        super({
            id: 'ascenders_bane',
            name: "Ascender's Bane",
            type: 'curse',
            rarity: 'special',
            color: 'colorless',
            cost: -2,
            description: "Unplayable.\nCannot be removed from your deck.\nEthereal.",
            assetPath: 'assets/cards/curse/ascenders_bane.png',
            ethereal: true
        });
    }

    // Cannot be removed logic handled in DeckManager
}