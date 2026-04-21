/**
 * =================================================================================================
 * DungeonSpire - Enemy Factory & AI
 * Version: 1.0.0
 * Author: HyperInfinity
 * =================================================================================================
 * Description:
 * Handles the creation of enemies and their AI behavior patterns.
 * Enemies announce their intent before acting, following the Slay the Spire mechanic.
 * =================================================================================================
 */

import { Entity } from './Entity.js';
import { globalBus } from '../core/EventBus.js';

export class Enemy extends Entity {
    constructor(data) {
        super(data.name, data.maxHp);
        this.id = data.id || this.id;
        this.moves = data.moves || [];
        this.currentIntent = null;
        this.nextMove = null;
        
        // Visuals
        this.assetPath = data.assetPath;
    }

    /**
     * Decide what to do next turn.
     * This should be called at the start of the player's turn (or end of enemy turn).
     */
    rollIntent() {
        if (this.isDead) return;

        // Simple random logic for now. Real game uses specific patterns/probabilities.
        const moveIndex = Math.floor(Math.random() * this.moves.length);
        this.nextMove = this.moves[moveIndex];
        
        this.currentIntent = {
            type: this.nextMove.type,
            value: this.nextMove.value,
            icon: this.getIntentIcon(this.nextMove.type)
        };

        console.log(`[Enemy] ${this.name} intends to ${this.nextMove.name}`);
        
        globalBus.emit('enemy_intent_updated', {
            enemyId: this.id,
            intent: this.currentIntent
        });
    }

    /**
     * Execute the planned move.
     * @param {Entity} target - Usually the player
     */
    takeTurn(target) {
        if (this.isDead || !this.nextMove) return;

        console.log(`[Enemy] ${this.name} uses ${this.nextMove.name}`);

        switch (this.nextMove.type) {
            case 'attack':
                target.takeDamage(this.nextMove.value);
                break;
            case 'defend':
                this.addBlock(this.nextMove.value);
                break;
            case 'buff':
                this.addPower(this.nextMove.effect, this.nextMove.value);
                break;
            case 'debuff':
                target.addPower(this.nextMove.effect, this.nextMove.value);
                break;
        }

        // Visual feedback delay
        // await new Promise(r => setTimeout(r, 500));
    }

    /**
     * Helper to map move types to icon paths.
     */
    getIntentIcon(type) {
        const icons = {
            'attack': 'assets/icons/intent_attack.png',
            'defend': 'assets/icons/intent_defend.png',
            'buff': 'assets/icons/intent_buff.png',
            'debuff': 'assets/icons/intent_debuff.png',
            'unknown': 'assets/icons/intent_unknown.png'
        };
        return icons[type] || icons['unknown'];
    }
}

/**
 * Factory to generate enemies based on ID or Level.
 */
export class EnemyFactory {
    static createEnemy(id) {
        const enemyData = EnemyDatabase[id];
        if (!enemyData) {
            console.error(`Enemy ID ${id} not found!`);
            return null;
        }
        
        // Deep copy moves to avoid mutation issues if we modify them runtime
        const dataCopy = JSON.parse(JSON.stringify(enemyData));
        return new Enemy(dataCopy);
    }

    static createEncounter(level, act) {
        // Logic to return a list of enemies for a floor
        // Simplified:
        if (level === 1) return [this.createEnemy('cultist')];
        if (level === 2) return [this.createEnemy('jaw_worm')];
        return [this.createEnemy('cultist')];
    }
}

// -------------------------------------------------------------------------------------------------
// Enemy Database (Simplified)
// -------------------------------------------------------------------------------------------------
const EnemyDatabase = {
    'cultist': {
        id: 'cultist',
        name: 'Cultist',
        maxHp: 50,
        assetPath: 'assets/enemies/cultist.png',
        moves: [
            { name: 'Dark Strike', type: 'attack', value: 6 },
            { name: 'Incantation', type: 'buff', effect: 'ritual', value: 3 }
        ]
    },
    'jaw_worm': {
        id: 'jaw_worm',
        name: 'Jaw Worm',
        maxHp: 42,
        assetPath: 'assets/enemies/jaw_worm.png',
        moves: [
            { name: 'Chomp', type: 'attack', value: 11 },
            { name: 'Thrash', type: 'attack', value: 7 }, // +5 block usually
            { name: 'Bellow', type: 'buff', effect: 'strength', value: 3 }
        ]
    }
};