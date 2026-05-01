/**
 * =================================================================================================
 * DungeonSpire - Lethality (Offense Talent)
 * =================================================================================================
 */
import { Talent } from '../../Talent.js';

export class Lethality extends Talent {
    constructor() {
        super({
            id: 'lethality',
            name: 'Lethality',
            type: 'offense',
            tier: 2,
            maxRank: 3,
            description: "Increases Critical Strike Chance by 5% per rank.",
            icon: 'assets/talents/offense/lethality.png'
        });
    }

    apply(player) {
        player.critChance += 0.05 * this.currentRank;
    }
}