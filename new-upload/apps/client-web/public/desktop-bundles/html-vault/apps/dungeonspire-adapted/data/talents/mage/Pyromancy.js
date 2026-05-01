/**
 * =================================================================================================
 * DungeonSpire - Pyromancy (Mage Talent)
 * =================================================================================================
 */
import { Talent } from '../../Talent.js';

export class Pyromancy extends Talent {
    constructor() {
        super({
            id: 'pyromancy',
            name: 'Pyromancy',
            type: 'passive',
            tier: 1,
            maxRank: 5,
            description: "Increases Fire damage by 5% per rank.",
            icon: 'assets/talents/mage/pyromancy.png'
        });
    }
}