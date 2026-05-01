/**
 * =================================================================================================
 * DungeonSpire - Necronomicurse
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Necronomicurse extends Card {
    constructor() {
        super({
            id: 'necronomicurse',
            name: 'Necronomicurse',
            type: 'curse',
            rarity: 'curse',
            color: 'colorless',
            cost: -2,
            description: "Unplayable.\nThere is no escape from this Curse.",
            assetPath: 'assets/cards/curse/necronomicurse.png'
        });
    }

    // Logic to return to hand when exhausted/removed
}