/**
 * =================================================================================================
 * DungeonSpire - Incense Burner (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class IncenseBurner extends Relic {
    constructor() {
        super({
            id: 'incense_burner',
            name: 'Incense Burner',
            description: "Every 6 turns, gain 1 Intangible.",
            rarity: 'rare',
            assetPath: 'assets/relics/incense.png'
        });
        this.counter = 0;
    }

    onTurnStart(player) {
        this.counter++;
        if (this.counter === 6) {
            player.addPower('intangible', 1);
            this.counter = 0;
        }
    }
}