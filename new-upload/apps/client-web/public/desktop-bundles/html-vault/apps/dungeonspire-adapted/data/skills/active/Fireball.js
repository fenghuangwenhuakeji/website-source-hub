/**
 * =================================================================================================
 * DungeonSpire - Fireball (Active Skill)
 * =================================================================================================
 */
import { Skill } from '../Skill.js';

export class Fireball extends Skill {
    constructor() {
        super({
            id: 'fireball',
            name: 'Fireball',
            type: 'active',
            cooldown: 5,
            description: "Hurls a ball of fire at the enemy, dealing 20 damage.",
            icon: 'assets/skills/active/fireball.png'
        });
    }

    use(user, target) {
        if (this.currentCooldown <= 0) {
            target.takeDamage(20);
            this.currentCooldown = this.cooldown;
            // Trigger VFX
        }
    }
}