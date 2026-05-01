/**
 * =================================================================================================
 * DungeonSpire - Impatience
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Impatience extends Card {
    constructor() {
        super({
            id: 'impatience',
            name: 'Impatience',
            type: 'skill',
            rarity: 'uncommon',
            color: 'colorless',
            cost: 0,
            description: "If you have no Attacks in your hand, draw 2 cards.",
            assetPath: 'assets/cards/colorless/impatience.png'
        });
    }

    applyUpgrade() {
        this.description = "If you have no Attacks in your hand, draw 3 cards.";
    }

    use(player, target) {
        const hasAttack = player.hand.some(c => c.type === 'attack');
        if (!hasAttack) {
            player.drawCards(this.upgraded ? 3 : 2);
        }
    }
}