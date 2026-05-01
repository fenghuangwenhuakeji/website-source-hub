/**
 * =================================================================================================
 * DungeonSpire - Lagavulin (Elite)
 * =================================================================================================
 */
import { Enemy } from '../Enemy.js';

export class Lagavulin extends Enemy {
    constructor() {
        super({
            id: 'lagavulin',
            name: 'Lagavulin',
            maxHp: 110,
            assetPath: 'assets/enemies/lagavulin.png',
            moves: [
                { id: 'sleep', name: 'Sleeping', type: 'unknown', value: 0 },
                { id: 'attack', name: 'Attack', type: 'attack', value: 18 },
                { id: 'siphon', name: 'Siphon Soul', type: 'debuff', effect: 'dex_str_down', value: 1 }
            ]
        });
        this.state = 'asleep';
        this.wakeTimer = 3;
        this.addBlock(8); // Metallicize visual
    }

    rollIntent() {
        if (this.state === 'asleep') {
            this.nextMove = this.moves[0];
            this.wakeTimer--;
            if (this.wakeTimer <= 0) this.state = 'awake';
        } else {
            // Awake logic
            this.nextMove = this.moves[1];
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
        // Wake up on damage
        if (this.state === 'asleep' && amount > 0) {
            this.state = 'awake';
            console.log("Lagavulin woke up!");
        }
    }
}