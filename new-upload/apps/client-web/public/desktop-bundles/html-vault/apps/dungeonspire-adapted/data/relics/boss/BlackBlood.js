/**
 * =================================================================================================
 * DungeonSpire - Black Blood (Boss Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class BlackBlood extends Relic {
    constructor() {
        super({
            id: 'black_blood',
            name: 'Black Blood',
            description: "Replaces Burning Blood. At the end of combat, heal 12 HP.",
            rarity: 'boss',
            assetPath: 'assets/relics/black_blood.png'
        });
    }

    onEquip(player) {
        // Remove Burning Blood
        // Add Black Blood logic
    }

    onCombatEnd(player) {
        player.heal(12);
    }
}