/**
 * =================================================================================================
 * DungeonSpire - Darkstone Periapt (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class DarkstonePeriapt extends Relic {
    constructor() {
        super({
            id: 'darkstone_periapt',
            name: 'Darkstone Periapt',
            description: "Whenever you obtain a Curse, increase your Max HP by 6.",
            rarity: 'uncommon',
            assetPath: 'assets/relics/darkstone.png'
        });
    }

    onObtainCard(card, player) {
        if (card.type === 'curse') {
            player.maxHp += 6;
            player.heal(6);
        }
    }
}