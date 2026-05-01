/**
 * =================================================================================================
 * DungeonSpire - Snecko (Act 2)
 * =================================================================================================
 */
import { Enemy } from '../Enemy.js';

export class Snecko extends Enemy {
    constructor() {
        super({
            id: 'snecko',
            name: 'Snecko',
            maxHp: 114,
            assetPath: 'assets/enemies/snecko.png',
            moves: [
                { id: 'confuse', name: 'Perplexing Glare', type: 'debuff', effect: 'confused', effectValue: 1 },
                { id: 'bite', name: 'Bite', type: 'attack', value: 15 },
                { id: 'tail', name: 'Tail Whip', type: 'attack', value: 8, effect: 'vulnerable', effectValue: 2 }
            ]
        });
    }

    rollIntent() {
        // First turn always confuse
        // Then random
        this.nextMove = this.moves[Math.floor(Math.random() * this.moves.length)];
        super.rollIntent();
    }
}