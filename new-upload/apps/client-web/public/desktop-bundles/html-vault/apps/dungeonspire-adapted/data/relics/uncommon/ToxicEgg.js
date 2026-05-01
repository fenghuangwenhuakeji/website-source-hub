/**
 * =================================================================================================
 * DungeonSpire - Toxic Egg (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class ToxicEgg extends Relic {
    constructor() {
        super({
            id: 'toxic_egg',
            name: 'Toxic Egg',
            description: "Whenever you add a Skill card to your deck, it is Upgraded.",
            rarity: 'uncommon',
            assetPath: 'assets/relics/toxic_egg.png'
        });
    }

    onObtainCard(card, player) {
        if (card.type === 'skill') {
            card.upgrade();
        }
    }
}