/**
 * =================================================================================================
 * DungeonSpire - Toxic Cloud (Skill)
 * =================================================================================================
 */
import { Skill } from '../../Skill.js';

export class ToxicCloudSkill extends Skill {
    constructor() {
        super({
            id: 'skill_toxic_cloud',
            name: 'Toxic Cloud',
            type: 'active',
            cooldown: 5,
            description: "Applies Poison to all enemies.",
            icon: 'assets/skills/poison/toxic_cloud.png'
        });
    }

    use(user, target) {
        // Logic
    }
}