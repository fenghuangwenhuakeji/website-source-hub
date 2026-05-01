/**
 * =================================================================================================
 * DungeonSpire - Quest Giver (NPC)
 * =================================================================================================
 */
import { NPC } from './NPC.js';

export class QuestGiverNPC extends NPC {
    constructor() {
        super({
            id: 'quest_giver',
            name: 'Old Man',
            dialogue: [
                "I lost my locket in the sewers...",
                "Please, help an old man."
            ],
            quest: 'find_locket'
        });
    }
}