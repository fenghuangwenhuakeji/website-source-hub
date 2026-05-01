/**
 * =================================================================================================
 * DungeonSpire - Blood Pact (Skill)
 * =================================================================================================
 */
import { Skill } from '../../Skill.js';

export class BloodPactSkill extends Skill {
    constructor() {
        super({
            id: 'skill_blood_pact',
            name: 'Blood Pact',
            type: 'active',
            cooldown: 10,
            description: "Sacrifice 10 HP to gain 50% damage boost for 3 turns.",
            icon: 'assets/skills/blood/blood_pact.png'
        });
    }

    use(user, target) {
        // Logic
    }
}