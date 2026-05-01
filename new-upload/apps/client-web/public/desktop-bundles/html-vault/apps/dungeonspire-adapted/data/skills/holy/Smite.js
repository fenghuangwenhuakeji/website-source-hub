/**
 * =================================================================================================
 * DungeonSpire - Smite (Skill)
 * =================================================================================================
 */
import { Skill } from '../../Skill.js';

export class SmiteSkill extends Skill {
    constructor() {
        super({
            id: 'skill_smite',
            name: 'Smite',
            type: 'active',
            cooldown: 4,
            description: "Deals 20 Holy damage. Bonus damage against Undead.",
            icon: 'assets/skills/holy/smite.png'
        });
    }

    use(user, target) {
        // Logic
    }
}