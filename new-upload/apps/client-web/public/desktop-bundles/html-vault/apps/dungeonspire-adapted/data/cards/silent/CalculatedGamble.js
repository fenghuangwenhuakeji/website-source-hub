/**
 * =================================================================================================
 * DungeonSpire - Calculated Gamble
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class CalculatedGamble extends Card {
    constructor() {
        super({
            id: 'calculated_gamble',
            name: 'Calculated Gamble',
            type: 'skill',
            rarity: 'uncommon',
            color: 'green',
            cost: 0,
            description: "Discard your hand, then draw that many cards.\nExhaust.",
            assetPath: 'assets/cards/green/calculated_gamble.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.exhaust = false;
        this.description = "Discard your hand, then draw that many cards.";
    }

    use(player, target) {
        const count = player.hand.length;
        player.discardHand();
        player.drawCards(count);
    }
}