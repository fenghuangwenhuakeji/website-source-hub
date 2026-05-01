/**
 * =================================================================================================
 * DungeonSpire - Corrupt Heart (Boss Act 4)
 * =================================================================================================
 */
import { Enemy } from '../Enemy.js';

export class CorruptHeart extends Enemy {
    constructor() {
        super({
            id: 'corrupt_heart',
            name: 'Corrupt Heart',
            maxHp: 800,
            assetPath: 'assets/enemies/heart.png',
            moves: [
                { id: 'debuff', name: 'Debilitate', type: 'debuff', effect: 'vuln_weak_frail', effectValue: 2 },
                { id: 'multi', name: 'Blood Shots', type: 'attack', value: 2, hits: 15 },
                { id: 'big', name: 'Echo', type: 'attack', value: 45 },
                { id: 'buff', name: 'Buff', type: 'buff', effect: 'strength', effectValue: 2 }
            ]
        });
        this.addPower('invincible', 300); // Cap dmg per turn
        this.addPower('beat_of_death', 1); // 1 dmg per card played
    }

    rollIntent() {
        // Fixed pattern
        this.nextMove = this.moves[0];
        super.rollIntent();
    }
}