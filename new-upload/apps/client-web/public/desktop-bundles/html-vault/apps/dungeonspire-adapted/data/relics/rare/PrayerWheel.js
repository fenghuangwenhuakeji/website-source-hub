/**
 * =================================================================================================
 * DungeonSpire - Prayer Wheel (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class PrayerWheel extends Relic {
    constructor() {
        super({
            id: 'prayer_wheel',
            name: 'Prayer Wheel',
            description: "Normal enemies drop an additional card reward.",
            rarity: 'rare',
            assetPath: 'assets/relics/prayer_wheel.png'
        });
    }

    // Hook into reward generation
}