/**
 * =================================================================================================
 * DungeonSpire - Calipers (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class Calipers extends Relic {
    constructor() {
        super({
            id: 'calipers',
            name: 'Calipers',
            description: "At the start of your turn, lose 15 Block rather than all of it.",
            rarity: 'rare',
            assetPath: 'assets/relics/calipers.png'
        });
    }

    // Hook into turn start block reset logic
}