/**
 * =================================================================================================
 * DungeonSpire - Champ (Boss Act 2)
 * =================================================================================================
 */
import { Enemy } from '../Enemy.js';

export class Champ extends Enemy {
    constructor() {
        super({
            id: 'champ',
            name: 'The Champ',
            maxHp: 420,
            assetPath: 'assets/enemies/champ.png',
            moves: [
                { id: 'heavy', name: 'Heavy Slash', type: 'attack', value: 18 },
                { id: 'defend', name: 'Defensive Stance', type: 'block', value: 20, effect: 'metallicize', effectValue: 5 },
                { id: 'execute', name: 'Execute', type: 'attack', value: 10, hits: 2 },
                { id: 'gloat', name: 'Gloat', type: 'buff', effect: 'strength', effectValue: 2 }
            ]
        });
        this.phase2 = false;
    }

    rollIntent() {
        if (!this.phase2 && this.currentHp < this.maxHp / 2) {
            this.phase2 = true;
            this.nextMove = { id: 'anger', name: 'Anger', type: 'buff', value: 0 }; // Clears debuffs
        } else if (this.phase2) {
            this.nextMove = this.moves[2]; // Execute spam
        } else {
            this.nextMove = this.moves[0];
        }
        super.rollIntent();
    }
}