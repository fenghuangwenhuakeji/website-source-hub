/**
 * =================================================================================================
 * DungeonSpire - Decay
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Decay extends Card {
    constructor() {
        super({
            id: 'decay',
            name: 'Decay',
            type: 'curse',
            rarity: 'curse',
            color: 'colorless',
            cost: -2,
            description: "Unplayable.\nAt the end of your turn, take 2 damage.",
            assetPath: 'assets/cards/curse/decay.png'
        });
    }

    onTurnEnd(player) {
        // If in hand
        // player.takeDamage(2);
    }
}