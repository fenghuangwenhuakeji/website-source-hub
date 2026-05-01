/**
 * =================================================================================================
 * DungeonSpire - Old Coin (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class OldCoin extends Relic {
    constructor() {
        super({
            id: 'old_coin',
            name: 'Old Coin',
            description: "Gain 300 Gold.",
            rarity: 'rare',
            assetPath: 'assets/relics/old_coin.png'
        });
    }

    onEquip(player) {
        player.gainGold(300);
    }
}