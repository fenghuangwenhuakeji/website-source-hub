/**
 * =================================================================================================
 * DungeonSpire - Bard (NPC)
 * =================================================================================================
 */
import { NPC } from './NPC.js';

export class BardNPC extends NPC {
    constructor() {
        super({
            id: 'bard',
            name: 'The Bard',
            dialogue: [
                "Toss a coin to your witcher... wait, wrong game.",
                "Let me sing you the song of my people."
            ]
        });
    }

    singSong(player) {
        // Buff player
    }
}