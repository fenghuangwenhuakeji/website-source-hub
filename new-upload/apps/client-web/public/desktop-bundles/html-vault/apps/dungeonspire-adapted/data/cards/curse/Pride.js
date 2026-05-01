/**
 * =================================================================================================
 * DungeonSpire - Pride
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Pride extends Card {
    constructor() {
        super({
            id: 'pride',
            name: 'Pride',
            type: 'curse',
            rarity: 'curse',
            color: 'colorless',
            cost: 1,
            description: "Innate.\nAt the end of your turn, put a copy of this card on top of your draw pile.\nExhaust.",
            assetPath: 'assets/cards/curse/pride.png',
            innate: true,
            exhaust: true
        });
    }

    use(player, target) {
        // Just exhaust
    }

    onTurnEnd() {
        // If in hand, copy to draw pile
    }
}