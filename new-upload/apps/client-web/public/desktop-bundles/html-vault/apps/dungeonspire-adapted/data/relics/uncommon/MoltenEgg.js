/**
 * =================================================================================================
 * DungeonSpire - Molten Egg (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class MoltenEgg extends Relic {
    constructor() {
        super({
            id: 'molten_egg',
            name: 'Molten Egg',
            description: "Whenever you add an Attack card to your deck, it is Upgraded.",
            rarity: 'uncommon',
            assetPath: 'assets/relics/molten_egg.png'
        });
    }

    onObtainCard(card, player) {
        if (card.type === 'attack') {
            card.upgrade();
        }
    }
}