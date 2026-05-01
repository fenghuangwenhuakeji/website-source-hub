/**
 * =================================================================================================
 * DungeonSpire - Shame
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Shame extends Card {
    constructor() {
        super({
            id: 'shame',
            name: 'Shame',
            type: 'curse',
            rarity: 'curse',
            color: 'colorless',
            cost: -2,
            description: "Unplayable.\nAt the end of your turn, gain 1 Frail.",
            assetPath: 'assets/cards/curse/shame.png'
        });
    }

    onTurnEnd(player) {
        // player.addPower('frail', 1);
    }
}