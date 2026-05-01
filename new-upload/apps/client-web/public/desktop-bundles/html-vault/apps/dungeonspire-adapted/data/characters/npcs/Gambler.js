/**
 * =================================================================================================
 * DungeonSpire - Gambler (NPC)
 * =================================================================================================
 */
import { NPC } from './NPC.js';

export class GamblerNPC extends NPC {
    constructor() {
        super({
            id: 'gambler',
            name: 'The Gambler',
            dialogue: [
                "Care for a game of chance?",
                "Double or nothing!"
            ]
        });
    }

    playGame(player, bet) {
        // Logic for gambling minigame
    }
}