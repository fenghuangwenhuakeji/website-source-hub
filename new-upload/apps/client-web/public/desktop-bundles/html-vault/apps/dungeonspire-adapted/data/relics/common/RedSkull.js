/**
 * =================================================================================================
 * DungeonSpire - Red Skull (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class RedSkull extends Relic {
    constructor() {
        super({
            id: 'red_skull',
            name: 'Red Skull',
            description: "While your HP is at or below 50%, you have 3 additional Strength.",
            rarity: 'common',
            assetPath: 'assets/relics/red_skull.png'
        });
        this.active = false;
    }

    onTurnStart(player) {
        if (player.currentHp <= player.maxHp / 2) {
            if (!this.active) {
                player.addPower('strength', 3);
                this.active = true;
            }
        } else {
            if (this.active) {
                player.addPower('strength', -3);
                this.active = false;
            }
        }
    }
}