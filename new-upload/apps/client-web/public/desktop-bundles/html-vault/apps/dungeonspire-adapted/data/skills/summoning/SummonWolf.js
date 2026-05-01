/**
 * =================================================================================================
 * DungeonSpire - Summon Wolf (Skill)
 * =================================================================================================
 */
import { Skill } from '../../Skill.js';

export class SummonWolfSkill extends Skill {
    constructor() {
        super({
            id: 'skill_summon_wolf',
            name: 'Summon Wolf',
            type: 'active',
            cooldown: 20,
            description: "Summons a wolf companion to fight by your side.",
            icon: 'assets/skills/summoning/summon_wolf.png'
        });
    }

    use(user, target) {
        // Logic
    }
}