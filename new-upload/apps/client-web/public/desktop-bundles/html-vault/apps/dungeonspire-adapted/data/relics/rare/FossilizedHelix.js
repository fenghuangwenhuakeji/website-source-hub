/**
 * =================================================================================================
 * DungeonSpire - Fossilized Helix (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class FossilizedHelix extends Relic {
    constructor() {
        super({
            id: 'fossilized_helix',
            name: 'Fossilized Helix',
            description: "Prevent the first time you would lose HP in combat.",
            rarity: 'rare',
            assetPath: 'assets/relics/helix.png'
        });
    }

    onCombatStart(player) {
        player.addPower('buffer', 1);
    }
}