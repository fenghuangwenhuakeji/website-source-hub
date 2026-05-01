/**
 * =================================================================================================
 * DungeonSpire - Stealth (Rogue Talent)
 * =================================================================================================
 */
import { Talent } from '../../Talent.js';

export class Stealth extends Talent {
    constructor() {
        super({
            id: 'stealth',
            name: 'Stealth',
            type: 'passive',
            tier: 1,
            maxRank: 3,
            description: "Reduces chance of being targeted by enemies.",
            icon: 'assets/talents/rogue/stealth.png'
        });
    }

    // Hook into aggro calculation
}