/**
 * =================================================================================================
 * DungeonSpire - Turnip (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class Turnip extends Relic {
    constructor() {
        super({
            id: 'turnip',
            name: 'Turnip',
            description: "You can no longer become Frail.",
            rarity: 'rare',
            assetPath: 'assets/relics/turnip.png'
        });
    }

    // Hook into addPower logic
}