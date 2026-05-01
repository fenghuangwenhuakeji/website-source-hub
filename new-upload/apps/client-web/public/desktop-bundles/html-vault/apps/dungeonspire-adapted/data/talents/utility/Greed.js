/**
 * =================================================================================================
 * DungeonSpire - Greed (Utility Talent)
 * =================================================================================================
 */
import { Talent } from '../../Talent.js';

export class Greed extends Talent {
    constructor() {
        super({
            id: 'greed',
            name: 'Greed',
            type: 'utility',
            tier: 2,
            maxRank: 3,
            description: "Gain 10% more Gold from combats per rank.",
            icon: 'assets/talents/utility/greed.png'
        });
    }

    // Hook into gold gain
}