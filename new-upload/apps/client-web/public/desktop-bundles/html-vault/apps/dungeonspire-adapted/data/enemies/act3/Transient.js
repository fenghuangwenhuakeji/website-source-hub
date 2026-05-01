/**
 * =================================================================================================
 * DungeonSpire - Transient (Act 3)
 * =================================================================================================
 */
import { Enemy } from '../Enemy.js';

export class Transient extends Enemy {
    constructor() {
        super({
            id: 'transient',
            name: 'Transient',
            maxHp: 999,
            assetPath: 'assets/enemies/transient.png',
            moves: [
                { id: 'attack', name: 'Attack', type: 'attack', value: 30 }
            ]
        });
        this.addPower('fading', 5);
        this.damage = 30;
    }

    rollIntent() {
        this.currentIntent = {
            type: 'attack',
            value: this.damage,
            icon: this.getIntentIcon('attack')
        };
        this.nextMove = { type: 'attack', value: this.damage };
        super.rollIntent();
    }

    takeDamage(amount) {
        super.takeDamage(amount);
        this.addPower('strength', -amount); // Transient loses STR equal to dmg taken
        this.damage = Math.max(0, this.damage - amount);
        // Update intent
        this.rollIntent();
    }
}