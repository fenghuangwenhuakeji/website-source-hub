/**
 * =================================================================================================
 * DungeonSpire - Regrowth (Skill)
 * =================================================================================================
 */
import { Skill } from '../../Skill.js';

export class RegrowthSkill extends Skill {
    constructor() {
        super({
            id: 'skill_regrowth',
            name: 'Regrowth',
            type: 'active',
            cooldown: 8,
            description: "Heals 10 HP instantly and 5 HP per turn for 3 turns.",
            icon: 'assets/skills/nature/regrowth.png'
        });
    }

    use(user, target) {
        // Logic
    }
}