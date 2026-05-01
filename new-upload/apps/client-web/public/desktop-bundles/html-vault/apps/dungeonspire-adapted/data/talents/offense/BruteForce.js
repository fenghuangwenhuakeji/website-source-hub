/**
 * =================================================================================================
 * DungeonSpire - Brute Force (Offense Talent)
 * =================================================================================================
 */
import { Talent } from '../../Talent.js';

export class BruteForce extends Talent {
    constructor() {
        super({
            id: 'brute_force',
            name: 'Brute Force',
            type: 'offense',
            tier: 1,
            maxRank: 5,
            description: "Increases Strength by 1 per rank.",
            icon: 'assets/talents/offense/brute_force.png'
        });
    }

    apply(player) {
        player.addPower('strength', this.currentRank);
    }
}