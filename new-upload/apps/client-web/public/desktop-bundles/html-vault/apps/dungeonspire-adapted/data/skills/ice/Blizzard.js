/**
 * =================================================================================================
 * DungeonSpire - Blizzard (Skill)
 * =================================================================================================
 */
import { Skill } from '../../Skill.js';

export class BlizzardSkill extends Skill {
    constructor() {
        super({
            id: 'skill_blizzard',
            name: 'Blizzard',
            type: 'active',
            cooldown: 6,
            description: "Deals 5 Ice damage to all enemies for 3 turns.",
            icon: 'assets/skills/ice/blizzard.png'
        });
    }

    use(user, target) {
        // Logic
    }
}