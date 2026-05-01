/**
 * =================================================================================================
 * DungeonSpire - Alchemy (Utility Talent)
 * =================================================================================================
 */
import { Talent } from '../../Talent.js';

export class Alchemy extends Talent {
    constructor() {
        super({
            id: 'alchemy',
            name: 'Alchemy',
            type: 'utility',
            tier: 1,
            maxRank: 3,
            description: "Potions are 10% more effective per rank.",
            icon: 'assets/talents/utility/alchemy.png'
        });
    }

    // Hook into potion use
}