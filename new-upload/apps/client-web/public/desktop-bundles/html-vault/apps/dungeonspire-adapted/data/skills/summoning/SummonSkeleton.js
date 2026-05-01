/**
 * =================================================================================================
 * DungeonSpire - Summon Skeleton (Skill)
 * =================================================================================================
 */
import { Skill } from '../../Skill.js';

export class SummonSkeletonSkill extends Skill {
    constructor() {
        super({
            id: 'skill_summon_skeleton',
            name: 'Summon Skeleton',
            type: 'active',
            cooldown: 15,
            description: "Raises a skeleton warrior from the dead.",
            icon: 'assets/skills/summoning/summon_skeleton.png'
        });
    }

    use(user, target) {
        // Logic
    }
}