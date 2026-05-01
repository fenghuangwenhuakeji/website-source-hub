/**
 * =================================================================================================
 * DungeonSpire - Writhe
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Writhe extends Card {
    constructor() {
        super({
            id: 'writhe',
            name: 'Writhe',
            type: 'curse',
            rarity: 'curse',
            color: 'colorless',
            cost: -2,
            description: "Unplayable.\nInnate.",
            assetPath: 'assets/cards/curse/writhe.png',
            innate: true
        });
    }
}