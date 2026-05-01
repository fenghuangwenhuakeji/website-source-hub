/**
 * =================================================================================================
 * DungeonSpire - Bottled Lightning (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class BottledLightning extends Relic {
    constructor() {
        super({
            id: 'bottled_lightning',
            name: 'Bottled Lightning',
            description: "Upon pickup, choose a Skill. Start each combat with this card in your hand.",
            rarity: 'uncommon',
            assetPath: 'assets/relics/bottle_lightning.png'
        });
    }

    onEquip(player) {
        // Trigger UI to select card
    }
}