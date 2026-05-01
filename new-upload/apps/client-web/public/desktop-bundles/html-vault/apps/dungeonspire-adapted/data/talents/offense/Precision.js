/**
 * =================================================================================================
 * DungeonSpire - Precision (Offense Talent)
 * =================================================================================================
 */
import { Talent } from '../../Talent.js';

export class Precision extends Talent {
    constructor() {
        super({
            id: 'precision',
            name: 'Precision',
            type: 'offense',
            tier: 1,
            maxRank: 5,
            description: "Increases Dexterity by 1 per rank.",
            icon: 'assets/talents/offense/precision.png'
        });
    }

    apply(player) {
        player.addPower('dexterity', this.currentRank);
    }
}