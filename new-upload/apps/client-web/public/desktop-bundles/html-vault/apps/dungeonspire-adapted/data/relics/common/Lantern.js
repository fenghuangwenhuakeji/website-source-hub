/**
 * =================================================================================================
 * DungeonSpire - Lantern (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class Lantern extends Relic {
    constructor() {
        super({
            id: 'lantern',
            name: 'Lantern',
            description: "Gain 1 Energy on the first turn of each combat.",
            rarity: 'common',
            assetPath: 'assets/relics/lantern.png'
        });
    }

    onCombatStart(player) {
        // Need to hook into turn 1 specific logic
        // Simplified: just give energy immediately, assuming combat start is turn 1
        player.gainEnergy(1);
    }
}