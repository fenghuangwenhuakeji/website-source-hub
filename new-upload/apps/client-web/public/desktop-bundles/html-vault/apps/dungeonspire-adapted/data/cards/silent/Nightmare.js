/**
 * =================================================================================================
 * DungeonSpire - Nightmare
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Nightmare extends Card {
    constructor() {
        super({
            id: 'nightmare',
            name: 'Nightmare',
            type: 'skill',
            rarity: 'rare',
            color: 'green',
            cost: 3,
            description: "Choose a card.\nNext turn, add 3 copies of that card into your hand.\nExhaust.",
            assetPath: 'assets/cards/green/nightmare.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.cost = 2;
        this.baseCost = 2;
    }

    use(player, target) {
        // UI to select card from hand
        // Then add power 'nightmare' with target card ID
    }
}