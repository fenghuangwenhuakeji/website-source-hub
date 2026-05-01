/**
 * =================================================================================================
 * DungeonSpire - Shield Mastery (Defense Talent)
 * =================================================================================================
 */
import { Talent } from '../../Talent.js';

export class ShieldMastery extends Talent {
    constructor() {
        super({
            id: 'shield_mastery',
            name: 'Shield Mastery',
            type: 'defense',
            tier: 2,
            maxRank: 3,
            description: "Increases Block gained from cards by 10% per rank.",
            icon: 'assets/talents/defense/shield_mastery.png'
        });
    }

    // Hook into block calculation
}