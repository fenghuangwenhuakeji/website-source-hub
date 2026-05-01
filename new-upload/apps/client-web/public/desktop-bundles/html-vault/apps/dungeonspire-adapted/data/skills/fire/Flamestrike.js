/**
 * =================================================================================================
 * DungeonSpire - Flamestrike (Skill)
 * =================================================================================================
 */
import { Skill } from '../../Skill.js';

export class FlamestrikeSkill extends Skill {
    constructor() {
        super({
            id: 'skill_flamestrike',
            name: 'Flamestrike',
            type: 'active',
            cooldown: 5,
            description: "Deals 10 Fire damage to all enemies.",
            icon: 'assets/skills/fire/flamestrike.png'
        });
    }

    use(user, target) {
        // Logic
    }
}