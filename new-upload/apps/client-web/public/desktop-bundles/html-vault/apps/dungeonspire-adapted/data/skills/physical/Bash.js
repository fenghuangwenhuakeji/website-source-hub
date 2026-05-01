/**
 * =================================================================================================
 * DungeonSpire - Bash (Skill)
 * =================================================================================================
 */
import { Skill } from '../../Skill.js';

export class BashSkill extends Skill {
    constructor() {
        super({
            id: 'skill_bash',
            name: 'Bash',
            type: 'active',
            cooldown: 3,
            description: "Deals 15 Physical damage and stuns the target.",
            icon: 'assets/skills/physical/bash.png'
        });
    }

    use(user, target) {
        // Logic
    }
}