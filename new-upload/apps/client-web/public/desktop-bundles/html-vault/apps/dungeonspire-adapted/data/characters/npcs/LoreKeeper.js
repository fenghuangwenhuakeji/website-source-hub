/**
 * =================================================================================================
 * DungeonSpire - Lore Keeper (NPC)
 * =================================================================================================
 */
import { NPC } from './NPC.js';

export class LoreKeeperNPC extends NPC {
    constructor() {
        super({
            id: 'lore_keeper',
            name: 'The Archivist',
            dialogue: [
                "The Spire was built eons ago...",
                "The heart beats with the rhythm of the world."
            ]
        });
    }
}