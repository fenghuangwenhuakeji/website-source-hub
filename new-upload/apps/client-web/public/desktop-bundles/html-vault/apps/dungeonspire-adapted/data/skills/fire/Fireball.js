/**
 * =================================================================================================
 * DungeonSpire - Fireball (Skill)
 * =================================================================================================
 */
import { Skill } from '../../Skill.js';

export class FireballSkill extends Skill {
    constructor() {
        super({
            id: 'skill_fireball',
            name: 'Fireball',
            type: 'active',
            cooldown: 3,
            description: "Deals 15 Fire damage.",
            icon: 'assets/skills/fire/fireball.png'
        });
    }

    use(user, target) {
        // Logic
    }
}