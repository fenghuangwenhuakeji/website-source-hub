/**
 * =================================================================================================
 * DungeonSpire - Frostbolt (Skill)
 * =================================================================================================
 */
import { Skill } from '../../Skill.js';

export class FrostboltSkill extends Skill {
    constructor() {
        super({
            id: 'skill_frostbolt',
            name: 'Frostbolt',
            type: 'active',
            cooldown: 3,
            description: "Deals 10 Ice damage and slows the target.",
            icon: 'assets/skills/ice/frostbolt.png'
        });
    }

    use(user, target) {
        // Logic
    }
}