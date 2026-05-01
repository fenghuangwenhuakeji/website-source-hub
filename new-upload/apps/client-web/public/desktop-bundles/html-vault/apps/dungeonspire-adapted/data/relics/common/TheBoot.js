/**
 * =================================================================================================
 * DungeonSpire - The Boot (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class TheBoot extends Relic {
    constructor() {
        super({
            id: 'the_boot',
            name: 'The Boot',
            description: "Whenever you would deal 4 or less unblocked Attack damage, increase it to 5.",
            rarity: 'common',
            assetPath: 'assets/relics/boot.png'
        });
    }

    // Hook into damage calculation
    onCalculateDamage(dmg) {
        if (dmg > 0 && dmg < 5) return 5;
        return dmg;
    }
}