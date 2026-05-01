/**
 * =================================================================================================
 * DungeonSpire - Bottled Tornado (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class BottledTornado extends Relic {
    constructor() {
        super({
            id: 'bottled_tornado',
            name: 'Bottled Tornado',
            description: "Upon pickup, choose a Power. Start each combat with this card in your hand.",
            rarity: 'uncommon',
            assetPath: 'assets/relics/bottle_tornado.png'
        });
    }

    onEquip(player) {
        // Trigger UI to select card
    }
}