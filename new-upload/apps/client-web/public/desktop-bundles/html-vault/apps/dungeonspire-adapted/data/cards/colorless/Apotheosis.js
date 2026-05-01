/**
 * =================================================================================================
 * DungeonSpire - Apotheosis
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Apotheosis extends Card {
    constructor() {
        super({
            id: 'apotheosis',
            name: 'Apotheosis',
            type: 'skill',
            rarity: 'rare',
            color: 'colorless',
            cost: 2,
            description: "Upgrade ALL of your cards for the rest of combat.\nExhaust.",
            assetPath: 'assets/cards/colorless/apotheosis.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.cost = 1;
        this.baseCost = 1;
    }

    use(player, target) {
        // Upgrade hand, draw pile, discard pile
        const allCards = [...player.hand, ...player.drawPile, ...player.discardPile];
        allCards.forEach(c => c.upgrade());
    }
}