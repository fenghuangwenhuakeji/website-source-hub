/**
 * =================================================================================================
 * DungeonSpire - Pain
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Pain extends Card {
    constructor() {
        super({
            id: 'pain',
            name: 'Pain',
            type: 'curse',
            rarity: 'curse',
            color: 'colorless',
            cost: -2,
            description: "Unplayable.\nWhile in hand, lose 1 HP when other cards are played.",
            assetPath: 'assets/cards/curse/pain.png'
        });
    }

    // Hook into onCardPlayed
}