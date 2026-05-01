/**
 * =================================================================================================
 * DungeonSpire - Chosen (Act 2)
 * =================================================================================================
 */
import { Enemy } from '../Enemy.js';

export class Chosen extends Enemy {
    constructor() {
        super({
            id: 'chosen',
            name: 'Chosen',
            maxHp: 95,
            assetPath: 'assets/enemies/chosen.png',
            moves: [
                { id: 'poke', name: 'Poke', type: 'attack', value: 5, hits: 2 },
                { id: 'zap', name: 'Zap', type: 'attack', value: 18 },
                { id: 'debilitate', name: 'Debilitate', type: 'debuff', effect: 'vulnerable', effectValue: 2 },
                { id: 'hex', name: 'Hex', type: 'debuff', effect: 'hex', effectValue: 1 }
            ]
        });
    }

    rollIntent() {
        this.nextMove = this.moves[Math.floor(Math.random() * this.moves.length)];
        super.rollIntent();
    }
}