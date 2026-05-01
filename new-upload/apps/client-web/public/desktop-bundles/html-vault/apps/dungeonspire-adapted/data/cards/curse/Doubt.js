/**
 * =================================================================================================
 * DungeonSpire - Doubt
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Doubt extends Card {
    constructor() {
        super({
            id: 'doubt',
            name: 'Doubt',
            type: 'curse',
            rarity: 'curse',
            color: 'colorless',
            cost: -2,
            description: "Unplayable.\nAt the end of your turn, gain 1 Weak.",
            assetPath: 'assets/cards/curse/doubt.png'
        });
    }

    onTurnEnd(player) {
        // If in hand
        // player.addPower('weak', 1);
    }
}