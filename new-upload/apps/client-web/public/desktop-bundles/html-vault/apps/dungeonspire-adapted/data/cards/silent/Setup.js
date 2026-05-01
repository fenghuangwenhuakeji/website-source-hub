/**
 * =================================================================================================
 * DungeonSpire - Setup
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Setup extends Card {
    constructor() {
        super({
            id: 'setup',
            name: 'Setup',
            type: 'skill',
            rarity: 'uncommon',
            color: 'green',
            cost: 1,
            description: "Put a card from your hand on top of your draw pile.\nIt costs 0 until it is played.",
            assetPath: 'assets/cards/green/setup.png'
        });
    }

    applyUpgrade() {
        this.cost = 0;
        this.baseCost = 0;
    }

    use(player, target) {
        // UI to select card
    }
}