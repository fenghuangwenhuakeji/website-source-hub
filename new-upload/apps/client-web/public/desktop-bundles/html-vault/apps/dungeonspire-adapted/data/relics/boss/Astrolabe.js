/**
 * =================================================================================================
 * DungeonSpire - Astrolabe (Boss Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class Astrolabe extends Relic {
    constructor() {
        super({
            id: 'astrolabe',
            name: 'Astrolabe',
            description: "Upon pickup, choose and Transform 3 cards, then Upgrade them.",
            rarity: 'boss',
            assetPath: 'assets/relics/astrolabe.png'
        });
    }

    onEquip(player) {
        // Trigger Transform UI
    }
}