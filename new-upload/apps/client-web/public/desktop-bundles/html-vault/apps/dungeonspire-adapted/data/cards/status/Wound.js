/**
 * =================================================================================================
 * DungeonSpire - Wound
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Wound extends Card {
    constructor() {
        super({
            id: 'wound',
            name: 'Wound',
            type: 'status',
            rarity: 'common',
            color: 'colorless',
            cost: -2,
            description: "Unplayable.",
            assetPath: 'assets/cards/status/wound.png'
        });
    }
}