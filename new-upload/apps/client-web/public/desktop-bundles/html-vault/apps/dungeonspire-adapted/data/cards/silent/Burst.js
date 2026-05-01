/**
 * =================================================================================================
 * DungeonSpire - Burst
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Burst extends Card {
    constructor() {
        super({
            id: 'burst',
            name: 'Burst',
            type: 'skill',
            rarity: 'rare',
            color: 'green',
            cost: 1,
            description: "This turn, your next Skill is played twice.",
            assetPath: 'assets/cards/green/burst.png'
        });
    }

    applyUpgrade() {
        this.description = "This turn, your next 2 Skills are played twice.";
    }

    use(player, target) {
        player.addPower('burst', this.upgraded ? 2 : 1);
    }
}