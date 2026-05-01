/**
 * =================================================================================================
 * DungeonSpire - Orb Walker (Act 3)
 * =================================================================================================
 */
import { Enemy } from '../Enemy.js';

export class OrbWalker extends Enemy {
    constructor() {
        super({
            id: 'orb_walker',
            name: 'Orb Walker',
            maxHp: 90,
            assetPath: 'assets/enemies/orb_walker.png',
            moves: [
                { id: 'laser', name: 'Laser', type: 'attack', value: 10, effect: 'burn', effectValue: 1 }, // Adds Burn to discard
                { id: 'claw', name: 'Claw', type: 'attack', value: 15, effect: 'strength', effectValue: 2 }
            ]
        });
        this.addPower('artifact', 3);
    }

    rollIntent() {
        this.nextMove = this.moves[Math.floor(Math.random() * this.moves.length)];
        super.rollIntent();
    }
}