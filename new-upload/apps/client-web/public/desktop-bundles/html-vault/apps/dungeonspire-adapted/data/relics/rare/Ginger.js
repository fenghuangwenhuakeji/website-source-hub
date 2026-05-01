/**
 * =================================================================================================
 * DungeonSpire - Ginger (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class Ginger extends Relic {
    constructor() {
        super({
            id: 'ginger',
            name: 'Ginger',
            description: "You can no longer become Weakened.",
            rarity: 'rare',
            assetPath: 'assets/relics/ginger.png'
        });
    }

    // Hook into addPower logic to block 'weak'
}