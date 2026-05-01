/**
 * =================================================================================================
 * DungeonSpire - Neow (NPC)
 * =================================================================================================
 */
import { NPC } from './NPC.js';

export class NeowNPC extends NPC {
    constructor() {
        super({
            id: 'neow',
            name: 'Neow',
            dialogue: [
                "Hello... again...",
                "Risk... reward...",
                "The Spire... sleeps..."
            ]
        });
    }
}