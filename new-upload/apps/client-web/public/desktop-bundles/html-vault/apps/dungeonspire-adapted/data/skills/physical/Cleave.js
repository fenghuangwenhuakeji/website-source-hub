/**
 * =================================================================================================
 * DungeonSpire - Cleave (Skill)
 * =================================================================================================
 */
import { Skill } from '../../Skill.js';

export class CleaveSkill extends Skill {
    constructor() {
        super({
            id: 'skill_cleave',
            name: 'Cleave',
            type: 'active',
            cooldown: 4,
            description: "Deals 10 Physical damage to all enemies.",
            icon: 'assets/skills/physical/cleave.png'
        });
    }

    use(user, target) {
        // Logic
    }
}