/**
 * =================================================================================================
 * DungeonSpire - Axe Mastery (Warrior Talent)
 * =================================================================================================
 */
import { Talent } from '../../Talent.js';

export class AxeMastery extends Talent {
    constructor() {
        super({
            id: 'axe_mastery',
            name: 'Axe Mastery',
            type: 'passive',
            tier: 1,
            maxRank: 5,
            description: "Increases critical damage with axes by 10% per rank.",
            icon: 'assets/talents/warrior/axe_mastery.png'
        });
    }
}