/**
 * =================================================================================================
 * DungeonSpire - Time Eater (Boss Act 3)
 * =================================================================================================
 */
import { Enemy } from '../Enemy.js';

export class TimeEater extends Enemy {
    constructor() {
        super({
            id: 'time_eater',
            name: 'Time Eater',
            maxHp: 456,
            assetPath: 'assets/enemies/time_eater.png',
            moves: [
                { id: 'reverb', name: 'Reverberate', type: 'attack', value: 7, hits: 3 },
                { id: 'head', name: 'Head Slam', type: 'attack', value: 26, effect: 'draw_reduction', effectValue: 1 },
                { id: 'ripple', name: 'Ripple', type: 'block', value: 20, effect: 'weak', effectValue: 1 }
            ]
        });
        this.addPower('time_warp', 0); // Ends turn after 12 cards
    }

    rollIntent() {
        this.nextMove = this.moves[Math.floor(Math.random() * this.moves.length)];
        super.rollIntent();
    }
}