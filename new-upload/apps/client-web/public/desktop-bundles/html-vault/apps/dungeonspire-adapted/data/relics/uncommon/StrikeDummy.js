/**
 * =================================================================================================
 * DungeonSpire - Strike Dummy (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class StrikeDummy extends Relic {
    constructor() {
        super({
            id: 'strike_dummy',
            name: 'Strike Dummy',
            description: "Cards containing 'Strike' deal 3 additional damage.",
            rarity: 'uncommon',
            assetPath: 'assets/relics/strike_dummy.png'
        });
    }

    onCalculateDamage(card, dmg) {
        if (card.name.includes('Strike') || (card.tags && card.tags.includes('strike'))) {
            return dmg + 3;
        }
        return dmg;
    }
}