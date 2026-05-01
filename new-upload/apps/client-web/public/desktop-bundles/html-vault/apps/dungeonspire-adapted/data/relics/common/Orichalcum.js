/**
 * =================================================================================================
 * DungeonSpire - Orichalcum (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class Orichalcum extends Relic {
    constructor() {
        super({
            id: 'orichalcum',
            name: 'Orichalcum',
            description: "If you end your turn without Block, gain 6 Block.",
            rarity: 'common',
            assetPath: 'assets/relics/orichalcum.png'
        });
    }

    onTurnEnd(player) {
        if (player.block === 0) {
            player.addBlock(6);
        }
    }
}