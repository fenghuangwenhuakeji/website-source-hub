/**
 * =================================================================================================
 * DungeonSpire - Metamorphosis
 * =================================================================================================
 */
import { Card } from '../Card.js';
import { CardFactory } from '../CardFactory.js';

export class Metamorphosis extends Card {
    constructor() {
        super({
            id: 'metamorphosis',
            name: 'Metamorphosis',
            type: 'skill',
            rarity: 'rare',
            color: 'colorless',
            cost: 2,
            description: "Add 3 random Attacks into your draw pile.\nThey cost 0 this combat.\nExhaust.",
            assetPath: 'assets/cards/colorless/metamorphosis.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.description = "Add 5 random Attacks into your draw pile.\nThey cost 0 this combat.\nExhaust.";
    }

    use(player, target) {
        const count = this.upgraded ? 5 : 3;
        for (let i = 0; i < count; i++) {
            const cardId = CardFactory.getRandomCardId('attack', 'colorless');
            if (cardId) {
                const card = CardFactory.createCard(cardId);
                card.cost = 0;
                card.costForTurn = 0;
                player.drawPile.push(card);
            }
        }
        player.shuffleDeck();
    }
}