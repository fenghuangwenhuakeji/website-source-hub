/**
 * =================================================================================================
 * DungeonSpire - Spire Growth (Act 3)
 * =================================================================================================
 */
import { Enemy } from '../Enemy.js';

export class SpireGrowth extends Enemy {
    constructor() {
        super({
            id: 'spire_growth',
            name: 'Spire Growth',
            maxHp: 170,
            assetPath: 'assets/enemies/spire_growth.png',
            moves: [
                { id: 'quick_tackle', name: 'Quick Tackle', type: 'attack', value: 16 },
                { id: 'smash', name: 'Smash', type: 'attack', value: 22 },
                { id: 'constrict', name: 'Constrict', type: 'debuff', effect: 'constricted', effectValue: 10 }
            ]
        });
    }

    rollIntent() {
        this.nextMove = this.moves[Math.floor(Math.random() * this.moves.length)];
        super.rollIntent();
    }
}