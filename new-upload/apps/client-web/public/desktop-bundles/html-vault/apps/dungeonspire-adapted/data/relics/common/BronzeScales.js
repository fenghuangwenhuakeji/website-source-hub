/**
 * =================================================================================================
 * DungeonSpire - Bronze Scales (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class BronzeScales extends Relic {
    constructor() {
        super({
            id: 'bronze_scales',
            name: 'Bronze Scales',
            description: "Start each combat with 3 Thorns.",
            rarity: 'common',
            assetPath: 'assets/relics/bronze_scales.png'
        });
    }

    onCombatStart(player) {
        player.addPower('thorns', 3);
    }
}