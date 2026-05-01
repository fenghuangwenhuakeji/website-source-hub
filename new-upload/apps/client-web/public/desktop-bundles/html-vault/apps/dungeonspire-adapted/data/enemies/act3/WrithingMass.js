/**
 * =================================================================================================
 * DungeonSpire - Writhing Mass (Act 3)
 * =================================================================================================
 */
import { Enemy } from '../Enemy.js';

export class WrithingMass extends Enemy {
    constructor() {
        super({
            id: 'writhing_mass',
            name: 'Writhing Mass',
            maxHp: 160,
            assetPath: 'assets/enemies/writhing_mass.png',
            moves: [
                { id: 'implant', name: 'Implant', type: 'attack', value: 32, effect: 'parasite', effectValue: 1 },
                { id: 'flail', name: 'Flail', type: 'attack', value: 16, hits: 1 },
                { id: 'wither', name: 'Wither', type: 'debuff', effect: 'weak', effectValue: 2 },
                { id: 'shield', name: 'Multi-Shield', type: 'block', value: 40 }
            ]
        });
        this.addPower('reactive', 1); // Changes intent on hit
    }

    rollIntent() {
        this.nextMove = this.moves[Math.floor(Math.random() * this.moves.length)];
        super.rollIntent();
    }

    takeDamage(amount) {
        super.takeDamage(amount);
        // Reroll intent
        this.rollIntent();
    }
}