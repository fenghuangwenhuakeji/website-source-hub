/**
 * =================================================================================================
 * DungeonSpire - Transmutation
 * =================================================================================================
 */
import { Card } from '../Card.js';
import { CardFactory } from '../CardFactory.js';

export class Transmutation extends Card {
    constructor() {
        super({
            id: 'transmutation',
            name: 'Transmutation',
            type: 'skill',
            rarity: 'rare',
            color: 'colorless',
            cost: -1,
            description: "Add X random Colorless cards into your hand. They cost 0 this turn.\nExhaust.",
            assetPath: 'assets/cards/colorless/transmutation.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.description = "Add X random Upgraded Colorless cards into your hand. They cost 0 this turn.\nExhaust.";
    }

    use(player, target) {
        const energy = player.energy;
        for (let i = 0; i < energy; i++) {
            const cardId = CardFactory.getRandomCardId(null, 'colorless');
            if (cardId) {
                const card = CardFactory.createCard(cardId);
                card.costForTurn = 0;
                if (this.upgraded) card.upgrade();
                player.hand.push(card);
            }
        }
        player.energy = 0;
    }
}