/**
 * =================================================================================================
 * DungeonSpire - Chrysalis
 * =================================================================================================
 */
import { Card } from '../Card.js';
import { CardFactory } from '../CardFactory.js';

export class Chrysalis extends Card {
    constructor() {
        super({
            id: 'chrysalis',
            name: 'Chrysalis',
            type: 'skill',
            rarity: 'rare',
            color: 'colorless',
            cost: 2,
            description: "Add 3 random Skills into your draw pile.\nThey cost 0 this combat.\nExhaust.",
            assetPath: 'assets/cards/colorless/chrysalis.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.description = "Add 5 random Skills into your draw pile.\nThey cost 0 this combat.\nExhaust.";
    }

    use(player, target) {
        const count = this.upgraded ? 5 : 3;
        for (let i = 0; i < count; i++) {
            const cardId = CardFactory.getRandomCardId('skill', 'colorless'); // Should be random skill from ANY color usually
            // Simplified to colorless for now
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