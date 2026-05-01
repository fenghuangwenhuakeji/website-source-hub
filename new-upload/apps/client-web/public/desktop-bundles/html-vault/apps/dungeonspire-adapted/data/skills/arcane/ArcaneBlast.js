/**
 * =================================================================================================
 * DungeonSpire - Arcane Blast (Skill)
 * =================================================================================================
 */
import { Skill } from '../../Skill.js';

export class ArcaneBlastSkill extends Skill {
    constructor() {
        super({
            id: 'skill_arcane_blast',
            name: 'Arcane Blast',
            type: 'active',
            cooldown: 4,
            description: "Deals 25 Arcane damage and knocks back the target.",
            icon: 'assets/skills/arcane/arcane_blast.png'
        });
    }

    use(user, target) {
        // Logic
    }
}