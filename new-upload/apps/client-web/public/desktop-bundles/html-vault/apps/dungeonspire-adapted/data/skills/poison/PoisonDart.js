/**
 * =================================================================================================
 * DungeonSpire - Poison Dart (Skill)
 * =================================================================================================
 */
import { Skill } from '../../Skill.js';

export class PoisonDartSkill extends Skill {
    constructor() {
        super({
            id: 'skill_poison_dart',
            name: 'Poison Dart',
            type: 'active',
            cooldown: 2,
            description: "Deals 5 damage and applies Poison.",
            icon: 'assets/skills/poison/poison_dart.png'
        });
    }

    use(user, target) {
        // Logic
    }
}