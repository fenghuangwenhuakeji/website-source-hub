/**
 * =================================================================================================
 * DungeonSpire - Lizard Tail (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class LizardTail extends Relic {
    constructor() {
        super({
            id: 'lizard_tail',
            name: 'Lizard Tail',
            description: "When you would die, heal to 50% of your Max HP instead (Works once).",
            rarity: 'rare',
            assetPath: 'assets/relics/tail.png'
        });
        this.used = false;
    }

    onDeath(player) {
        if (!this.used) {
            player.currentHp = Math.floor(player.maxHp * 0.5);
            player.isDead = false;
            this.used = true;
            this.description += " (Used)";
            // Prevent game over
            return true;
        }
        return false;
    }
}