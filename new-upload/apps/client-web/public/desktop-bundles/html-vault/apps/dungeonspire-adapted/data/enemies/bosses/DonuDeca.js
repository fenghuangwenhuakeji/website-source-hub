/**
 * =================================================================================================
 * DungeonSpire - Donu & Deca (Boss Act 3)
 * =================================================================================================
 */
import { Enemy } from '../Enemy.js';

export class Donu extends Enemy {
    constructor() {
        super({
            id: 'donu',
            name: 'Donu',
            maxHp: 250,
            assetPath: 'assets/enemies/donu.png',
            moves: [
                { id: 'beam', name: 'Beam', type: 'attack', value: 10, hits: 2 },
                { id: 'circle', name: 'Circle of Power', type: 'buff', effect: 'strength_all', effectValue: 3 }
            ]
        });
        this.addPower('artifact', 2);
    }

    rollIntent() {
        // Alternates
        this.nextMove = this.moves[0]; // Simplified
        super.rollIntent();
    }
}

export class Deca extends Enemy {
    constructor() {
        super({
            id: 'deca',
            name: 'Deca',
            maxHp: 250,
            assetPath: 'assets/enemies/deca.png',
            moves: [
                { id: 'beam', name: 'Beam', type: 'attack', value: 10, hits: 2, effect: 'dazed', effectValue: 2 },
                { id: 'shield', name: 'Square of Protection', type: 'block', value: 16, effect: 'block_all', effectValue: 16 }
            ]
        });
        this.addPower('artifact', 2);
    }

    rollIntent() {
        // Alternates
        this.nextMove = this.moves[0];
        super.rollIntent();
    }
}