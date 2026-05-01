/**
 * =================================================================================================
 * DungeonSpire - Regeneration (Passive Skill)
 * =================================================================================================
 */
import { Skill } from '../Skill.js';

export class Regeneration extends Skill {
    constructor() {
        super({
            id: 'regeneration',
            name: 'Regeneration',
            type: 'passive',
            description: "Restores 1 HP every turn.",
            icon: 'assets/skills/passive/regeneration.png'
        });
    }

    onTurnStart(user) {
        user.heal(1);
    }
}