/**
 * =================================================================================================
 * DungeonSpire - White Beast Statue (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class WhiteBeastStatue extends Relic {
    constructor() {
        super({
            id: 'white_beast_statue',
            name: 'White Beast Statue',
            description: "Potions always drop after combat.",
            rarity: 'uncommon',
            assetPath: 'assets/relics/white_beast.png'
        });
    }

    // Hook into reward generation
}