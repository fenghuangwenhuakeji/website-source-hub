/**
 * =================================================================================================
 * DungeonSpire - Injury
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Injury extends Card {
    constructor() {
        super({
            id: 'injury',
            name: 'Injury',
            type: 'curse',
            rarity: 'curse',
            color: 'colorless',
            cost: -2,
            description: "Unplayable.",
            assetPath: 'assets/cards/curse/injury.png'
        });
    }
}