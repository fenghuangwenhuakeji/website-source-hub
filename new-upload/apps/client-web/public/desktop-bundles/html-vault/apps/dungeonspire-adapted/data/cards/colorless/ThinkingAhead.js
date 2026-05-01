/**
 * =================================================================================================
 * DungeonSpire - Thinking Ahead
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class ThinkingAhead extends Card {
    constructor() {
        super({
            id: 'thinking_ahead',
            name: 'Thinking Ahead',
            type: 'skill',
            rarity: 'rare',
            color: 'colorless',
            cost: 0,
            description: "Draw 2 cards.\nPlace a card from your hand on top of your draw pile.\nExhaust.",
            assetPath: 'assets/cards/colorless/thinking_ahead.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.exhaust = false;
        this.description = "Draw 2 cards.\nPlace a card from your hand on top of your draw pile.";
    }

    use(player, target) {
        player.drawCards(2);
        // UI to select card to put back
    }
}