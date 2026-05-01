/**
 * =================================================================================================
 * DungeonSpire - Shadow Bolt (Skill)
 * =================================================================================================
 */
import { Skill } from '../../Skill.js';

export class ShadowBoltSkill extends Skill {
    constructor() {
        super({
            id: 'skill_shadow_bolt',
            name: 'Shadow Bolt',
            type: 'active',
            cooldown: 3,
            description: "Deals 12 Dark damage.",
            icon: 'assets/skills/dark/shadow_bolt.png'
        });
    }

    use(user, target) {
        // Logic
    }
}