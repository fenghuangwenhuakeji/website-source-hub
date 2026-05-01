/**
 * =================================================================================================
 * DungeonSpire - Frozen Egg (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class FrozenEgg extends Relic {
    constructor() {
        super({
            id: 'frozen_egg',
            name: 'Frozen Egg',
            description: "Whenever you add a Power card to your deck, it is Upgraded.",
            rarity: 'uncommon',
            assetPath: 'assets/relics/frozen_egg.png'
        });
    }

    onObtainCard(card, player) {
        if (card.type === 'power') {
            card.upgrade();
        }
    }
}