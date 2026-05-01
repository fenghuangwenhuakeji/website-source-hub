/**
 * =================================================================================================
 * DungeonSpire - Akabeko (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class Akabeko extends Relic {
    constructor() {
        super({
            id: 'akabeko',
            name: 'Akabeko',
            description: "Your first Attack each combat deals 8 additional damage.",
            rarity: 'common',
            assetPath: 'assets/relics/akabeko.png'
        });
    }

    onCombatStart(player) {
        player.addPower('vigor', 8);
    }
}