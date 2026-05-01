/**
 * =================================================================================================
 * DungeonSpire - Slime Boss (Boss)
 * =================================================================================================
 */
import { Enemy } from '../Enemy.js';

export class SlimeBoss extends Enemy {
    constructor() {
        super({
            id: 'slime_boss',
            name: 'Slime Boss',
            maxHp: 140,
            assetPath: 'assets/enemies/slime_boss.png',
            moves: [
                { id: 'slam', name: 'Goop Spray', type: 'attack', value: 35 },
                { id: 'prepare', name: 'Preparing', type: 'unknown', value: 0 },
                { id: 'split', name: 'Split', type: 'unknown', value: 0 }
            ]
        });
    }

    rollIntent() {
        if (this.currentHp < this.maxHp / 2) {
            this.nextMove = this.moves[2]; // Split
        } else {
            this.nextMove = this.moves[0];
        }
        
        this.currentIntent = {
            type: this.nextMove.type,
            value: this.nextMove.value,
            icon: this.getIntentIcon(this.nextMove.type)
        };
        super.rollIntent();
    }
    
    // Split logic would spawn two new enemies (Acid Slime L, Spike Slime L)
}