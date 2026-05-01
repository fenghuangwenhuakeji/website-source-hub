/**
 * =================================================================================================
 * DungeonSpire - Pear (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class Pear extends Relic {
    constructor() {
        super({
            id: 'pear',
            name: 'Pear',
            description: "Raise your Max HP by 10.",
            rarity: 'uncommon',
            assetPath: 'assets/relics/pear.png'
        });
    }

    onEquip(player) {
        player.maxHp += 10;
        player.heal(10);
    }
}