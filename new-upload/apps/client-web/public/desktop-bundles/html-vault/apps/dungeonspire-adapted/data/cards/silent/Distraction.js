/**
 * =================================================================================================
 * DungeonSpire - Distraction
 * =================================================================================================
 */
import { Card } from '../Card.js';
import { CardFactory } from '../CardFactory.js';

export class Distraction extends Card {
    constructor() {
        super({
            id: 'distraction',
            name: 'Distraction',
            type: 'skill',
            rarity: 'uncommon',
            color: 'green',
            cost: 1,
            description: "Add a random Skill to your hand.\nIt costs 0 this turn.\nExhaust.",
            assetPath: 'assets/cards/green/distraction.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.exhaust = false;
        this.description = "Add a random Skill to your hand.\nIt costs 0 this turn.";
    }

    use(player, target) {
        const cardId = CardFactory.getRandomCardId('skill', 'green');
        if (cardId) {
            const card = CardFactory.createCard(cardId);
            card.costForTurn = 0;
            player.hand.push(card);
        }
    }
}