/**
 * =================================================================================================
 * DungeonSpire - Calling Bell (Boss Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class CallingBell extends Relic {
    constructor() {
        super({
            id: 'calling_bell',
            name: 'Calling Bell',
            description: "Upon pickup, obtain a unique Curse and 3 relics.",
            rarity: 'boss',
            assetPath: 'assets/relics/bell.png'
        });
    }

    onEquip(player) {
        // Add Curse of the Bell
        // Add 3 random relics
    }
}