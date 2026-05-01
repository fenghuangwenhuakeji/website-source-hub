/**
 * =================================================================================================
 * DungeonSpire - Bottled Flame (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class BottledFlame extends Relic {
    constructor() {
        super({
            id: 'bottled_flame',
            name: 'Bottled Flame',
            description: "Upon pickup, choose an Attack. Start each combat with this card in your hand.",
            rarity: 'uncommon',
            assetPath: 'assets/relics/bottle_flame.png'
        });
    }

    onEquip(player) {
        // Trigger UI to select card
    }
}