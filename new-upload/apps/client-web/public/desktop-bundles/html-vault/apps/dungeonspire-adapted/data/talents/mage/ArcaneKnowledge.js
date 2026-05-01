/**
 * =================================================================================================
 * DungeonSpire - Arcane Knowledge (Mage Talent)
 * =================================================================================================
 */
import { Talent } from '../../Talent.js';

export class ArcaneKnowledge extends Talent {
    constructor() {
        super({
            id: 'arcane_knowledge',
            name: 'Arcane Knowledge',
            type: 'passive',
            tier: 1,
            maxRank: 5,
            description: "Increases Intelligence by 2 per rank.",
            icon: 'assets/talents/mage/arcane_knowledge.png'
        });
    }

    apply(player) {
        player.addPower('intelligence', 2 * this.currentRank);
    }
}