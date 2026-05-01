/**
 * =================================================================================================
 * DungeonSpire - Oddly Smooth Stone (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class OddlySmoothStone extends Relic {
    constructor() {
        super({
            id: 'oddly_smooth_stone',
            name: 'Oddly Smooth Stone',
            description: "At the start of each combat, gain 1 Dexterity.",
            rarity: 'common',
            assetPath: 'assets/relics/stone.png'
        });
    }

    onCombatStart(player) {
        player.addPower('dexterity', 1);
    }
}