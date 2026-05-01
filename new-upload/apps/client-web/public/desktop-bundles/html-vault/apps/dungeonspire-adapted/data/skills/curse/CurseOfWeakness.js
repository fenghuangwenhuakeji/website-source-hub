/**
 * =================================================================================================
 * DungeonSpire - Curse of Weakness (Skill)
 * =================================================================================================
 */
import { Skill } from '../../Skill.js';

export class CurseOfWeaknessSkill extends Skill {
    constructor() {
        super({
            id: 'skill_curse_weakness',
            name: 'Curse of Weakness',
            type: 'active',
            cooldown: 5,
            description: "Reduces the target's damage by 25% for 3 turns.",
            icon: 'assets/skills/curse/curse_weakness.png'
        });
    }

    use(user, target) {
        // Logic
    }
}