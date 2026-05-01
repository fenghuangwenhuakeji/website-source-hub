/**
 * =================================================================================================
 * DungeonSpire - Mango (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class Mango extends Relic {
    constructor() {
        super({
            id: 'mango',
            name: 'Mango',
            description: "Raise your Max HP by 14.",
            rarity: 'rare',
            assetPath: 'assets/relics/mango.png'
        });
    }

    onEquip(player) {
        player.maxHp += 14;
        player.heal(14);
    }
}