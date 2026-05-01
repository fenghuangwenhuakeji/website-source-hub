/**
 * =================================================================================================
 * DungeonSpire - Void
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Void extends Card {
    constructor() {
        super({
            id: 'void',
            name: 'Void',
            type: 'status',
            rarity: 'common',
            color: 'colorless',
            cost: -2,
            description: "Unplayable.\nWhen drawn, lose 1 Energy.\nEthereal.",
            assetPath: 'assets/cards/status/void.png',
            ethereal: true
        });
    }

    onDraw(player) {
        // player.loseEnergy(1);
    }
}