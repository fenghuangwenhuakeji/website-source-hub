/**
 * =================================================================================================
 * DungeonSpire - Cultist (Enemy)
 * =================================================================================================
 */
import { Enemy } from '../Enemy.js';

export class Cultist extends Enemy {
    constructor() {
        super({
            id: 'cultist',
            name: 'Cultist',
            maxHp: 50,
            assetPath: 'assets/enemies/cultist.png',
            moves: [
                { name: 'Incantation', type: 'buff', effect: 'ritual', value: 3 },
                { name: 'Dark Strike', type: 'attack', value: 6 }
            ]
        });
        this.turnCount = 0;
    }

    rollIntent() {
        if (this.turnCount === 0) {
            // First turn always Incantation
            this.nextMove = this.moves[0];
        } else {
            // Subsequent turns always Attack
            this.nextMove = this.moves[1];
        }
        
        this.currentIntent = {
            type: this.nextMove.type,
            value: this.nextMove.value,
            icon: this.getIntentIcon(this.nextMove.type)
        };
        
        this.turnCount++;
        // Emit event handled in base class usually, but logic here is simplified override
        // For now, assume base class handles the emit if we set nextMove
        super.rollIntent(); 
    }
}