/**
 * =================================================================================================
 * DungeonSpire - Hexaghost (Boss)
 * =================================================================================================
 */
import { Enemy } from '../Enemy.js';

export class Hexaghost extends Enemy {
    constructor() {
        super({
            id: 'hexaghost',
            name: 'Hexaghost',
            maxHp: 250,
            assetPath: 'assets/enemies/hexaghost.png',
            moves: [
                { id: 'divider', name: 'Divider', type: 'attack', value: 0 }, // Dmg based on player HP
                { id: 'burn', name: 'Sear', type: 'attack', value: 6 },
                { id: 'inferno', name: 'Inferno', type: 'attack', value: 2, hits: 6 }
            ]
        });
        this.turn = 0;
    }

    rollIntent() {
        if (this.turn === 0) {
            // Divider: damage = current HP / 12 + 1
            // Simulated calculation
            this.nextMove = { ...this.moves[0], value: 10 }; 
        } else {
             this.nextMove = this.moves[1];
        }
        
        this.currentIntent = {
            type: this.nextMove.type,
            value: this.nextMove.value,
            icon: this.getIntentIcon(this.nextMove.type)
        };
        
        this.turn++;
        super.rollIntent();
    }
}