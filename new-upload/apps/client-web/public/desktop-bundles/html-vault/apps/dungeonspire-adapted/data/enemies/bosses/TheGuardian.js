/**
 * =================================================================================================
 * DungeonSpire - The Guardian (Boss)
 * =================================================================================================
 */
import { Enemy } from '../Enemy.js';

export class TheGuardian extends Enemy {
    constructor() {
        super({
            id: 'the_guardian',
            name: 'The Guardian',
            maxHp: 240,
            assetPath: 'assets/enemies/guardian.png',
            moves: [
                { id: 'charge', name: 'Charging Up', type: 'block', value: 9 },
                { id: 'fierce', name: 'Fierce Bash', type: 'attack', value: 32 },
                { id: 'roll', name: 'Rolling Attack', type: 'attack', value: 9 },
                { id: 'defensive', name: 'Defensive Mode', type: 'buff', value: 0 }
            ]
        });
        this.mode = 'offensive'; // offensive, defensive
        this.dmgTakenThisTurn = 0;
        this.shiftThreshold = 30;
    }

    rollIntent() {
        if (this.mode === 'offensive') {
            // Logic for offensive cycle
            this.nextMove = this.moves[1];
        } else {
            // Logic for defensive cycle
            this.nextMove = this.moves[2];
        }
        
        this.currentIntent = {
            type: this.nextMove.type,
            value: this.nextMove.value,
            icon: this.getIntentIcon(this.nextMove.type)
        };
        super.rollIntent();
    }

    takeDamage(amount) {
        super.takeDamage(amount);
        this.dmgTakenThisTurn += amount;
        if (this.mode === 'offensive' && this.dmgTakenThisTurn >= this.shiftThreshold) {
            this.changeMode('defensive');
        }
    }

    changeMode(newMode) {
        console.log(`Guardian shifting to ${newMode} mode!`);
        this.mode = newMode;
        this.addBlock(20);
        // Reset threshold logic etc.
    }
}