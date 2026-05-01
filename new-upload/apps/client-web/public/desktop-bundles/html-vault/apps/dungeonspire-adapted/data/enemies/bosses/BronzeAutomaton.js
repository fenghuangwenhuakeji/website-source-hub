/**
 * =================================================================================================
 * DungeonSpire - Bronze Automaton (Boss Act 2)
 * =================================================================================================
 */
import { Enemy } from '../Enemy.js';

export class BronzeAutomaton extends Enemy {
    constructor() {
        super({
            id: 'bronze_automaton',
            name: 'Bronze Automaton',
            maxHp: 300,
            assetPath: 'assets/enemies/bronze_automaton.png',
            moves: [
                { id: 'beam', name: 'Hyper Beam', type: 'attack', value: 45 },
                { id: 'flail', name: 'Flail', type: 'attack', value: 7, hits: 2 },
                { id: 'boost', name: 'Boost', type: 'buff', effect: 'strength', effectValue: 3 },
                { id: 'spawn', name: 'Spawn Bronze Orb', type: 'unknown', value: 0 }
            ]
        });
        this.addPower('artifact', 3);
    }

    rollIntent() {
        // Simplified logic
        const r = Math.random();
        if (r < 0.2) this.nextMove = this.moves[0];
        else if (r < 0.5) this.nextMove = this.moves[1];
        else if (r < 0.8) this.nextMove = this.moves[2];
        else this.nextMove = this.moves[3];
        super.rollIntent();
    }
}