/**
 * =================================================================================================
 * DungeonSpire - Spheric Guardian (Act 2)
 * =================================================================================================
 */
import { Enemy } from '../Enemy.js';

export class SphericGuardian extends Enemy {
    constructor() {
        super({
            id: 'spheric_guardian',
            name: 'Spheric Guardian',
            maxHp: 20,
            assetPath: 'assets/enemies/spheric_guardian.png',
            moves: [
                { id: 'activate', name: 'Activate', type: 'block', value: 25 },
                { id: 'attack_debuff', name: 'Slam', type: 'attack', value: 10, effect: 'frail', effectValue: 5 },
                { id: 'attack', name: 'Harden', type: 'attack', value: 10, block: 15 }
            ]
        });
        this.addPower('artifact', 3);
        this.addPower('barricade', 1);
    }

    rollIntent() {
        // Simplified pattern
        this.nextMove = this.moves[Math.floor(Math.random() * this.moves.length)];
        super.rollIntent();
    }
}