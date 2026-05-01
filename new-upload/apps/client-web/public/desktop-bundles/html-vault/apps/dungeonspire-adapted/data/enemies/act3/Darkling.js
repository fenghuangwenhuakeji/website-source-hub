/**
 * =================================================================================================
 * DungeonSpire - Darkling (Act 3)
 * =================================================================================================
 */
import { Enemy } from '../Enemy.js';

export class Darkling extends Enemy {
    constructor() {
        super({
            id: 'darkling',
            name: 'Darkling',
            maxHp: 48,
            assetPath: 'assets/enemies/darkling.png',
            moves: [
                { id: 'nip', name: 'Nip', type: 'attack', value: 7 },
                { id: 'chatter', name: 'Chatter', type: 'attack', value: 7, hits: 2 },
                { id: 'harden', name: 'Harden', type: 'block', value: 12, effect: 'strength', effectValue: 2 },
                { id: 'regrow', name: 'Regrow', type: 'buff', value: 0 } // Revive mechanic
            ]
        });
    }

    rollIntent() {
        this.nextMove = this.moves[Math.floor(Math.random() * this.moves.length)];
        super.rollIntent();
    }
}