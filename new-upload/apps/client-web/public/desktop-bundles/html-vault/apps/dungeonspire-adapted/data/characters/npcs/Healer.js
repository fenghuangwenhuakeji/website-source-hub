/**
 * =================================================================================================
 * DungeonSpire - Healer (NPC)
 * =================================================================================================
 */
import { NPC } from './NPC.js';

export class HealerNPC extends NPC {
    constructor() {
        super({
            id: 'healer',
            name: 'The Healer',
            dialogue: [
                "Let me tend to your wounds.",
                "The light will restore you."
            ]
        });
    }

    healPlayer(player) {
        player.heal(player.maxHp);
    }
}