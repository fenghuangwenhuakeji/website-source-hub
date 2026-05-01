/**
 * =================================================================================================
 * DungeonSpire - Shell Parasite (Act 2)
 * =================================================================================================
 */
import { Enemy } from '../Enemy.js';

export class ShellParasite extends Enemy {
    constructor() {
        super({
            id: 'shell_parasite',
            name: 'Shell Parasite',
            maxHp: 68,
            assetPath: 'assets/enemies/shell_parasite.png',
            moves: [
                { id: 'bite', name: 'Double Bite', type: 'attack', value: 7, hits: 2 },
                { id: 'suck', name: 'Life Suck', type: 'attack', value: 10, effect: 'heal_self', effectValue: 10 }, // Heals self
                { id: 'buff', name: 'Fell', type: 'debuff', effect: 'frail', effectValue: 2 }
            ]
        });
        this.addPower('plated_armor', 14);
    }

    rollIntent() {
        this.nextMove = this.moves[Math.floor(Math.random() * this.moves.length)];
        super.rollIntent();
    }
}