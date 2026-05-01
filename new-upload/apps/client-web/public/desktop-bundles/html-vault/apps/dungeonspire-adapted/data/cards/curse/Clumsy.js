/**
 * =================================================================================================
 * DungeonSpire - Clumsy
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Clumsy extends Card {
    constructor() {
        super({
            id: 'clumsy',
            name: 'Clumsy',
            type: 'curse',
            rarity: 'curse',
            color: 'colorless',
            cost: -2,
            description: "Unplayable.\nEthereal.",
            assetPath: 'assets/cards/curse/clumsy.png',
            ethereal: true
        });
    }
}