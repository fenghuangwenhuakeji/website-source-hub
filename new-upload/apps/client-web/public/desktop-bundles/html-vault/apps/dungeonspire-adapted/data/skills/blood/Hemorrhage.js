/**
 * =================================================================================================
 * DungeonSpire - Hemorrhage (Skill)
 * =================================================================================================
 */
import { Skill } from '../../Skill.js';

export class HemorrhageSkill extends Skill {
    constructor() {
        super({
            id: 'skill_hemorrhage',
            name: 'Hemorrhage',
            type: 'active',
            cooldown: 4,
            description: "Deals 10 damage and causes severe bleeding.",
            icon: 'assets/skills/blood/hemorrhage.png'
        });
    }

    use(user, target) {
        // Logic
    }
}