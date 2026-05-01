/**
 * =================================================================================================
 * DungeonSpire - Madness
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Madness extends Card {
    constructor() {
        super({
            id: 'madness',
            name: 'Madness',
            type: 'skill',
            rarity: 'uncommon',
            color: 'colorless',
            cost: 1,
            description: "A random card in your hand costs 0 for the rest of combat.\nExhaust.",
            assetPath: 'assets/cards/colorless/madness.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.cost = 0;
        this.baseCost = 0;
    }

    use(player, target) {
        if (player.hand.length > 0) {
            const card = player.hand[Math.floor(Math.random() * player.hand.length)];
            card.cost = 0;
            card.costForTurn = 0;
        }
    }
}