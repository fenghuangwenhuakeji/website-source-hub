/**
 * =================================================================================================
 * DungeonSpire - Gremlin Nob (Elite)
 * =================================================================================================
 */
import { Enemy } from '../Enemy.js';

export class GremlinNob extends Enemy {
    constructor() {
        super({
            id: 'gremlin_nob',
            name: 'Gremlin Nob',
            maxHp: 85,
            assetPath: 'assets/enemies/gremlin_nob.png',
            moves: [
                { id: 'bellow', name: 'Bellow', type: 'buff', effect: 'enrage', value: 2 },
                { id: 'rush', name: 'Bull Rush', type: 'attack', value: 14, effect: 'vulnerable', effectValue: 2 },
                { id: 'skull', name: 'Skull Bash', type: 'attack', value: 6, effect: 'vulnerable', effectValue: 2 }
            ]
        });
        this.turn = 1;
    }

    rollIntent() {
        if (this.turn === 1) {
            this.nextMove = this.moves[0]; // Bellow
        } else if (this.turn === 2) {
            this.nextMove = this.moves[2]; // Skull Bash
        } else {
            // Rotation or random usually, simplified here
            this.nextMove = this.moves[1]; // Bull Rush
        }
        
        this.currentIntent = {
            type: this.nextMove.type,
            value: this.nextMove.value,
            icon: this.getIntentIcon(this.nextMove.type)
        };
        
        this.turn++;
        super.rollIntent();
    }

    // Nob has a passive: Gain strength when player plays a skill
    // This requires listening to the event bus
    onCombatStart() {
        // In a real implementation, we'd subscribe here
        // globalBus.on('card_played', this.handleCardPlayed.bind(this));
    }
}