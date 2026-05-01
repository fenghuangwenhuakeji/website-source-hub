/**
 * =================================================================================================
 * DungeonSpire - Concentrate
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Concentrate extends Card {
    constructor() {
        super({
            id: 'concentrate',
            name: 'Concentrate',
            type: 'skill',
            rarity: 'uncommon',
            color: 'green',
            cost: 0,
            description: "Discard 3 cards. Gain 2 Energy.",
            assetPath: 'assets/cards/green/concentrate.png'
        });
    }

    applyUpgrade() {
        this.description = "Discard 2 cards. Gain 2 Energy.";
    }

    use(player, target) {
        const discardCount = this.upgraded ? 2 : 3;
        // Simplified discard logic
        for (let i = 0; i < discardCount; i++) {
            if (player.hand.length > 0) {
                const idx = Math.floor(Math.random() * player.hand.length);
                player.discardCard(idx);
            }
        }
        player.gainEnergy(2);
    }
}