/**
 * =================================================================================================
 * DungeonSpire - Expertise
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Expertise extends Card {
    constructor() {
        super({
            id: 'expertise',
            name: 'Expertise',
            type: 'skill',
            rarity: 'uncommon',
            color: 'green',
            cost: 1,
            description: "Draw cards until you have 6 in your hand.",
            assetPath: 'assets/cards/green/expertise.png'
        });
    }

    applyUpgrade() {
        this.description = "Draw cards until you have 7 in your hand.";
    }

    use(player, target) {
        const limit = this.upgraded ? 7 : 6;
        const current = player.hand.length;
        if (current < limit) {
            player.drawCards(limit - current);
        }
    }
}