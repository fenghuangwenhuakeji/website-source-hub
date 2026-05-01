/**
 * =================================================================================================
 * DungeonSpire - Discovery
 * =================================================================================================
 */
import { Card } from '../Card.js';
import { CardFactory } from '../CardFactory.js';

export class Discovery extends Card {
    constructor() {
        super({
            id: 'discovery',
            name: 'Discovery',
            type: 'skill',
            rarity: 'uncommon',
            color: 'colorless',
            cost: 1,
            description: "Choose 1 of 3 random cards to add to your hand. It costs 0 this turn.\nExhaust.",
            assetPath: 'assets/cards/colorless/discovery.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.exhaust = false;
        this.description = "Choose 1 of 3 random cards to add to your hand. It costs 0 this turn.";
    }

    use(player, target) {
        // Trigger Discovery UI
    }
}