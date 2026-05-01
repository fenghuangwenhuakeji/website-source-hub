/**
 * =================================================================================================
 * DungeonSpire - Tiny Chest (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class TinyChest extends Relic {
    constructor() {
        super({
            id: 'tiny_chest',
            name: 'Tiny Chest',
            description: "Every 4th ? room is a Treasure room.",
            rarity: 'common',
            assetPath: 'assets/relics/chest.png'
        });
        this.counter = 0;
    }

    // Hook into map generation or navigation
}