/**
 * =================================================================================================
 * DungeonSpire - Heal (Active Skill)
 * =================================================================================================
 */
import { Skill } from '../Skill.js';

export class Heal extends Skill {
    constructor() {
        super({
            id: 'heal',
            name: 'Heal',
            type: 'active',
            cooldown: 10,
            description: "Restores 15 HP to the user.",
            icon: 'assets/skills/active/heal.png'
        });
    }

    use(user, target) {
        if (this.currentCooldown <= 0) {
            user.heal(15);
            this.currentCooldown = this.cooldown;
            // Trigger VFX
        }
    }
}