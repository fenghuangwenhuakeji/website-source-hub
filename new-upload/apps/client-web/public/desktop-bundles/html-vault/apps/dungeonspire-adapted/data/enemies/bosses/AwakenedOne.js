/**
 * =================================================================================================
 * DungeonSpire - Awakened One (Boss Act 3)
 * =================================================================================================
 */
import { Enemy } from '../Enemy.js';

export class AwakenedOne extends Enemy {
    constructor() {
        super({
            id: 'awakened_one',
            name: 'Awakened One',
            maxHp: 300,
            assetPath: 'assets/enemies/awakened_one.png',
            moves: [
                { id: 'slash', name: 'Slash', type: 'attack', value: 20 },
                { id: 'soul', name: 'Soul Strike', type: 'attack', value: 6, hits: 4 }
            ]
        });
        this.addPower('curiosity', 1); // Gains STR on power play
        this.addPower('regen', 10);
        this.stage = 1;
    }

    rollIntent() {
        this.nextMove = this.moves[Math.floor(Math.random() * this.moves.length)];
        super.rollIntent();
    }

    // Revive logic for stage 2
}