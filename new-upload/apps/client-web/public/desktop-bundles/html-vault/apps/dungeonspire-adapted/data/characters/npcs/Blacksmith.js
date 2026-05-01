/**
 * =================================================================================================
 * DungeonSpire - Blacksmith (NPC)
 * =================================================================================================
 */
import { NPC } from './NPC.js';

export class BlacksmithNPC extends NPC {
    constructor() {
        super({
            id: 'blacksmith',
            name: 'The Blacksmith',
            dialogue: [
                "Need something sharpened?",
                "Fire and steel, that's all I know."
            ]
        });
    }

    upgradeItem(item) {
        // Logic to upgrade item
    }
}