/**
 * =================================================================================================
 * DungeonSpire - Wing Boots (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class WingBoots extends Relic {
    constructor() {
        super({
            id: 'wing_boots',
            name: 'Wing Boots',
            description: "You can ignore paths when choosing the next room to travel to 3 times.",
            rarity: 'rare',
            assetPath: 'assets/relics/wing_boots.png'
        });
        this.counter = 3;
    }

    // Hook into map navigation logic
}