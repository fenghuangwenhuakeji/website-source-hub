/**
 * =================================================================================================
 * DungeonSpire - Entity Base Class
 * Version: 1.0.0
 * Author: HyperInfinity
 * =================================================================================================
 * Description:
 * Base class for all game entities (Player, Enemy, NPC).
 * Handles common stats like HP, Block, Status Effects, and basic actions.
 * =================================================================================================
 */

import { globalBus } from '../core/EventBus.js';

export class Entity {
    constructor(name, maxHp) {
        this.name = name;
        this.id = Math.random().toString(36).substr(2, 9);
        
        // -----------------------------------------------------------------------------------------
        // Stats
        // -----------------------------------------------------------------------------------------
        this.maxHp = maxHp;
        this.currentHp = maxHp;
        this.block = 0;
        this.energy = 3;
        this.maxEnergy = 3;

        // -----------------------------------------------------------------------------------------
        // Status Effects (Buffs/Debuffs)
        // Format: { id: 'vulnerable', stacks: 2 }
        // -----------------------------------------------------------------------------------------
        this.powers = [];

        // -----------------------------------------------------------------------------------------
        // Visual State
        // -----------------------------------------------------------------------------------------
        this.isDead = false;
        this.animationState = 'idle'; // idle, attack, hit, dead
    }

    /**
     * Take damage from a source.
     * Handles block calculation and death logic.
     * @param {number} amount 
     */
    takeDamage(amount) {
        if (this.isDead) return;

        let actualDamage = amount;

        // Apply Block Logic
        if (this.block > 0) {
            if (this.block >= actualDamage) {
                this.block -= actualDamage;
                actualDamage = 0;
                console.log(`${this.name} blocked all damage.`);
            } else {
                actualDamage -= this.block;
                this.block = 0;
                console.log(`${this.name} block broken.`);
            }
        }

        // Apply HP Reduction
        if (actualDamage > 0) {
            this.currentHp -= actualDamage;
            this.animationState = 'hit';
            
            // Visual Feedback
            globalBus.emit('entity_damaged', { 
                targetId: this.id, 
                amount: actualDamage, 
                type: 'hp' 
            });

            console.log(`${this.name} took ${actualDamage} damage. HP: ${this.currentHp}/${this.maxHp}`);
        } else {
            globalBus.emit('entity_blocked', { 
                targetId: this.id 
            });
        }

        // Check Death
        if (this.currentHp <= 0) {
            this.die();
        }
    }

    /**
     * Gain Block/Armor.
     * @param {number} amount 
     */
    addBlock(amount) {
        if (this.isDead) return;
        this.block += amount;
        console.log(`${this.name} gained ${amount} block.`);
        
        globalBus.emit('entity_block_gained', { 
            targetId: this.id, 
            amount: amount 
        });
    }

    /**
     * Heal HP.
     * @param {number} amount 
     */
    heal(amount) {
        if (this.isDead) return;
        const oldHp = this.currentHp;
        this.currentHp = Math.min(this.currentHp + amount, this.maxHp);
        const healedAmount = this.currentHp - oldHp;

        if (healedAmount > 0) {
            globalBus.emit('entity_healed', { 
                targetId: this.id, 
                amount: healedAmount 
            });
            console.log(`${this.name} healed for ${healedAmount}.`);
        }
    }

    /**
     * Add a status effect (Power).
     * @param {string} powerId 
     * @param {number} amount 
     */
    addPower(powerId, amount) {
        const existingPower = this.powers.find(p => p.id === powerId);
        if (existingPower) {
            existingPower.stacks += amount;
        } else {
            this.powers.push({ id: powerId, stacks: amount });
        }
        console.log(`${this.name} gained power: ${powerId} (${amount})`);
        
        globalBus.emit('entity_power_gained', {
            targetId: this.id,
            powerId: powerId,
            amount: amount
        });
    }

    /**
     * Handle death.
     */
    die() {
        this.currentHp = 0;
        this.isDead = true;
        this.animationState = 'dead';
        console.log(`${this.name} has died.`);
        
        globalBus.emit('entity_died', {
            targetId: this.id,
            entity: this
        });
    }

    /**
     * Called at start of turn.
     */
    onTurnStart() {
        this.block = 0; // Block resets each turn (usually)
        this.energy = this.maxEnergy;
        // Trigger power effects (e.g., Poison)
    }

    /**
     * Called at end of turn.
     */
    onTurnEnd() {
        // Trigger end of turn effects
    }
}