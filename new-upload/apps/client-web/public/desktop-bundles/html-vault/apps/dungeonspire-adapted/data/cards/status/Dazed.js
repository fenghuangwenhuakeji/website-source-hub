/**
 * =================================================================================================
 * DungeonSpire - Dazed
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Dazed extends Card {
    constructor() {
        super({
            id: 'dazed',
            name: 'Dazed',
            type: 'status',
            rarity: 'common',
            color: 'colorless',
            cost: -2,
            description: "Unplayable.\nEthereal.",
            assetPath: 'assets/cards/status/dazed.png',
            ethereal: true
        });
    }
}