/**
 * =================================================================================================
 * DungeonSpire - Drain Life (Skill)
 * =================================================================================================
 */
import { Skill } from '../../Skill.js';

export class DrainLifeSkill extends Skill {
    constructor() {
        super({
            id: 'skill_drain_life',
            name: 'Drain Life',
            type: 'active',
            cooldown: 6,
            description: "Deals 10 Dark damage and heals for the damage dealt.",
            icon: 'assets/skills/dark/drain_life.png'
        });
    }

    use(user, target) {
        // Logic
    }
}