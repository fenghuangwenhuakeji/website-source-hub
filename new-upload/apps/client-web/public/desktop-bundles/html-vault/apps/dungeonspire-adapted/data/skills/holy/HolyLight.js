/**
 * =================================================================================================
 * DungeonSpire - Holy Light (Skill)
 * =================================================================================================
 */
import { Skill } from '../../Skill.js';

export class HolyLightSkill extends Skill {
    constructor() {
        super({
            id: 'skill_holy_light',
            name: 'Holy Light',
            type: 'active',
            cooldown: 8,
            description: "Heals the user for 25 HP and cures debuffs.",
            icon: 'assets/skills/holy/holy_light.png'
        });
    }

    use(user, target) {
        // Logic
    }
}