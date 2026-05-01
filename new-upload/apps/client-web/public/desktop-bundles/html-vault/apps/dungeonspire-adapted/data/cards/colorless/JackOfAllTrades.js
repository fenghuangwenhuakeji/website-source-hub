/**
 * =================================================================================================
 * DungeonSpire - Jack of All Trades
 * =================================================================================================
 */
import { Card } from '../Card.js';
import { CardFactory } from '../CardFactory.js';

export class JackOfAllTrades extends Card {
    constructor() {
        super({
            id: 'jack_of_all_trades',
            name: 'Jack of All Trades',
            type: 'skill',
            rarity: 'uncommon',
            color: 'colorless',
            cost: 0,
            description: "Add 1 random Colorless card to your hand.\nExhaust.",
            assetPath: 'assets/cards/colorless/jack.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.description = "Add 2 random Colorless cards to your hand.\nExhaust.";
    }

    use(player, target) {
        const count = this.upgraded ? 2 : 1;
        for (let i = 0; i < count; i++) {
            const cardId = CardFactory.getRandomCardId(null, 'colorless');
            if (cardId) {
                const card = CardFactory.createCard(cardId);
                player.hand.push(card);
            }
        }
    }
}