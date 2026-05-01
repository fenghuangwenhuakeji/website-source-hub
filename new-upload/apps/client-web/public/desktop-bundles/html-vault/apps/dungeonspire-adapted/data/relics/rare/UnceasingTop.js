/**
 * =================================================================================================
 * DungeonSpire - Unceasing Top (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class UnceasingTop extends Relic {
    constructor() {
        super({
            id: 'unceasing_top',
            name: 'Unceasing Top',
            description: "Whenever you have no cards in hand during your turn, draw a card.",
            rarity: 'rare',
            assetPath: 'assets/relics/top.png'
        });
    }

    onCardPlayed(card, player) {
        // Check after a short delay or immediately
        if (player.hand.length === 0) {
            player.drawCards(1);
        }
    }
}