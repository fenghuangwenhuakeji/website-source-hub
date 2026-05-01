/**
 * =================================================================================================
 * DungeonSpire - Lightning Bolt (Skill)
 * =================================================================================================
 */
import { Skill } from '../../Skill.js';

export class LightningBoltSkill extends Skill {
    constructor() {
        super({
            id: 'skill_lightning_bolt',
            name: 'Lightning Bolt',
            type: 'active',
            cooldown: 2,
            description: "Deals 20 Lightning damage.",
            icon: 'assets/skills/lightning/lightning_bolt.png'
        });
    }

    use(user, target) {
        // Logic
    }
}