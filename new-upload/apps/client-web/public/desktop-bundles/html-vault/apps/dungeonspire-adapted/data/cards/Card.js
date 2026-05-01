/**
 * =================================================================================================
 * DungeonSpire - Card Base Class
 * Version: 1.0.0
 * Author: HyperInfinity
 * =================================================================================================
 * Description:
 * The fundamental structure for all cards in the game.
 * Handles:
 * - Cost management
 * - Playability checks
 * - Upgrade logic
 * - Visual representation data
 * =================================================================================================
 */

import { globalBus } from '../../core/EventBus.js';

export class Card {
    /**
     * @param {Object} data - Configuration data for the card.
     */
    constructor(data) {
        this.id = data.id;
        this.name = data.name || "Unknown Card";
        this.type = data.type || "skill"; // attack, skill, power, status, curse
        this.rarity = data.rarity || "common"; // common, uncommon, rare, basic
        this.color = data.color || "red"; // red, green, blue, purple, colorless
        
        // Stats
        this.baseCost = data.cost !== undefined ? data.cost : 1;
        this.cost = this.baseCost;
        this.costForTurn = this.cost;
        
        this.baseDamage = data.damage || 0;
        this.damage = this.baseDamage;
        
        this.baseBlock = data.block || 0;
        this.block = this.baseBlock;
        
        this.baseMagicNumber = data.magicNumber || 0;
        this.magicNumber = this.baseMagicNumber;
        
        // Text
        this.rawDescription = data.description || "";
        this.description = this.rawDescription;
        
        // State
        this.upgraded = false;
        this.exhaust = data.exhaust || false;
        this.ethereal = data.ethereal || false;
        this.innate = data.innate || false;
        this.retain = data.retain || false;
        
        // Visuals
        this.assetPath = data.assetPath || 'assets/cards/placeholder.png';
        
        // Runtime ID (unique per instance in deck)
        this.uuid = Math.random().toString(36).substr(2, 9);
    }

    /**
     * Upgrade the card.
     */
    upgrade() {
        if (this.upgraded) return;
        this.upgraded = true;
        this.name += "+";
        // Subclasses should override this to apply specific buffs
        this.applyUpgrade();
    }

    applyUpgrade() {
        // Override me
    }

    /**
     * Check if the card can be played.
     * @param {Player} player 
     * @param {Array<Enemy>} enemies 
     */
    canPlay(player, enemies) {
        if (player.energy < this.costForTurn) return false;
        if (this.type === 'status' && !this.playable) return false;
        return true;
    }

    /**
     * Execute the card's effect.
     * @param {Player} player 
     * @param {Entity} target 
     */
    use(player, target) {
        console.log(`Using card: ${this.name}`);
        // Override me
    }

    /**
     * Called at the start of turn while in hand.
     */
    onTurnStart() {
        this.costForTurn = this.cost;
    }

    /**
     * Called when drawn.
     */
    onDraw() {
        // Trigger draw effects
    }

    /**
     * Reset attributes at end of combat.
     */
    reset() {
        this.cost = this.baseCost;
        this.damage = this.baseDamage;
        this.block = this.baseBlock;
        this.magicNumber = this.baseMagicNumber;
    }
    
    /**
     * Get dynamic description text.
     */
    getDescription() {
        let desc = this.rawDescription;
        desc = desc.replace(/!D!/g, `<span class="keyword-damage">${this.damage}</span>`);
        desc = desc.replace(/!B!/g, `<span class="keyword-block">${this.block}</span>`);
        desc = desc.replace(/!M!/g, `<span class="keyword-magic">${this.magicNumber}</span>`);
        return desc;
    }
    
    /**
     * Clone this card instance.
     */
    makeCopy() {
        // This is a shallow copy of data, but new instance
        // In a real app, we'd need a factory to recreate the specific subclass
        // For now, we simulate:
        const clone = new Card(this);
        if (this.upgraded) clone.upgrade();
        return clone;
    }
}