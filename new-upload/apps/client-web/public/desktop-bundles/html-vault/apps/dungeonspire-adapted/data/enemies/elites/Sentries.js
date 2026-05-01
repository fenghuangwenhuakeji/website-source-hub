/**
 * =================================================================================================
 * DungeonSpire - Sentries (Elite)
 * Note: Usually spawns 3 instances.
 * =================================================================================================
 */
import { Enemy } from '../Enemy.js';

export class Sentry extends Enemy {
    constructor(variant = 'A') {
        super({
            id: `sentry_${variant}`,
            name: 'Sentry',
            maxHp: 40,
            assetPath: 'assets/enemies/sentry.png',
            moves: [
                { id: 'beam', name: 'Beam', type: 'attack', value: 9 },
                { id: 'bolt', name: 'Bolt', type: 'debuff', effect: 'dazed', value: 2 } // Adds 2 Dazed to discard
            ]
        });
        // Sentries alternate logic based on variant usually
        this.variant = variant;
        this.turn = 0;
    }

    rollIntent() {
        // Simplified alternating pattern
        if ((this.turn + (this.variant === 'B' ? 1 : 0)) % 2 === 0) {
            this.nextMove = this.moves[1]; // Bolt
        } else {
            this.nextMove = this.moves[0]; // Beam
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