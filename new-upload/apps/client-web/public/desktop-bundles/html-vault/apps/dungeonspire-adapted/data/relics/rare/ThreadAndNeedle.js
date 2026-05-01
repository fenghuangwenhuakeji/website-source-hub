/**
 * =================================================================================================
 * DungeonSpire - Thread and Needle (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class ThreadAndNeedle extends Relic {
    constructor() {
        super({
            id: 'thread_and_needle',
            name: 'Thread and Needle',
            description: "At the start of each combat, gain 4 Plated Armor.",
            rarity: 'rare',
            assetPath: 'assets/relics/thread.png'
        });
    }

    onCombatStart(player) {
        player.addPower('plated_armor', 4);
    }
}