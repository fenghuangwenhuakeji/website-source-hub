/**
 * =================================================================================================
 * DungeonSpire - Magic Missile (Skill)
 * =================================================================================================
 */
import { Skill } from '../../Skill.js';

export class MagicMissileSkill extends Skill {
    constructor() {
        super({
            id: 'skill_magic_missile',
            name: 'Magic Missile',
            type: 'active',
            cooldown: 2,
            description: "Fires 3 missiles, each dealing 5 Arcane damage.",
            icon: 'assets/skills/arcane/magic_missile.png'
        });
    }

    use(user, target) {
        // Logic
    }
}