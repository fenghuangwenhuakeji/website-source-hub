/**
 * =================================================================================================
 * DungeonSpire - Burn
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Burn extends Card {
    constructor() {
        super({
            id: 'burn',
            name: 'Burn',
            type: 'status',
            rarity: 'common',
            color: 'colorless',
            cost: -2,
            description: "Unplayable.\nAt the end of your turn, take 2 damage.",
            assetPath: 'assets/cards/status/burn.png'
        });
    }

    onTurnEnd(player) {
        // player.takeDamage(2);
    }
}