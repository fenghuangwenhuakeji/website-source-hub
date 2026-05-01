/**
 * =================================================================================================
 * DungeonSpire - Regret
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Regret extends Card {
    constructor() {
        super({
            id: 'regret',
            name: 'Regret',
            type: 'curse',
            rarity: 'curse',
            color: 'colorless',
            cost: -2,
            description: "Unplayable.\nAt the end of your turn, lose 1 HP for each card in your hand.",
            assetPath: 'assets/cards/curse/regret.png'
        });
    }

    onTurnEnd(player) {
        // player.takeDamage(player.hand.length);
    }
}