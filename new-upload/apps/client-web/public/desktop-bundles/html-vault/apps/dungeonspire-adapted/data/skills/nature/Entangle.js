/**
 * =================================================================================================
 * DungeonSpire - Entangle (Skill)
 * =================================================================================================
 */
import { Skill } from '../../Skill.js';

export class EntangleSkill extends Skill {
    constructor() {
        super({
            id: 'skill_entangle',
            name: 'Entangle',
            type: 'active',
            cooldown: 5,
            description: "Roots the target in place for 2 turns.",
            icon: 'assets/skills/nature/entangle.png'
        });
    }

    use(user, target) {
        // Logic
    }
}