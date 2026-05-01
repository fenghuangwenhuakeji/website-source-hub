/**
 * =================================================================================================
 * DungeonSpire - Chain Lightning (Skill)
 * =================================================================================================
 */
import { Skill } from '../../Skill.js';

export class ChainLightningSkill extends Skill {
    constructor() {
        super({
            id: 'skill_chain_lightning',
            name: 'Chain Lightning',
            type: 'active',
            cooldown: 4,
            description: "Deals 15 Lightning damage, jumping to nearby enemies.",
            icon: 'assets/skills/lightning/chain_lightning.png'
        });
    }

    use(user, target) {
        // Logic
    }
}