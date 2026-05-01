/**
 * =================================================================================================
 * DungeonSpire - Player Class
 * Version: 1.0.0
 * Author: HyperInfinity
 * =================================================================================================
 * Description:
 * Extends the base Entity class to include player-specific logic such as:
 * - Deck management (Draw pile, Hand, Discard pile, Exhaust pile)
 * - Gold
 * - Relics
 * - Potions
 * =================================================================================================
 */

import { Entity } from './Entity.js';
import { globalBus } from '../core/EventBus.js';

export class Player extends Entity {
    constructor(characterClass) {
        // Initialize base stats based on class
        let maxHp = 80;
        let startGold = 99;
        
        if (characterClass === 'SILENT') maxHp = 70;
        if (characterClass === 'DEFECT') maxHp = 75;
        if (characterClass === 'WATCHER') maxHp = 72;

        super(characterClass || 'IRONCLAD', maxHp);
        
        this.characterClass = characterClass || 'IRONCLAD';
        this.gold = startGold;

        // -----------------------------------------------------------------------------------------
        // Card System
        // -----------------------------------------------------------------------------------------
        this.masterDeck = []; // All cards the player owns
        this.drawPile = [];
        this.hand = [];
        this.discardPile = [];
        this.exhaustPile = [];

        // -----------------------------------------------------------------------------------------
        // Inventory
        // -----------------------------------------------------------------------------------------
        this.relics = [];
        this.potions = [];
        this.maxPotions = 3;

        console.log(`[Player] initialized as ${this.characterClass}`);
    }

    /**
     * Initialize the starter deck based on class.
     */
    initStarterDeck() {
        this.masterDeck = [];
        
        // Generic starter deck logic (placeholder card IDs)
        // 5 Strikes, 4 Defends, 1 Special
        for (let i = 0; i < 5; i++) this.masterDeck.push({ id: 'strike', type: 'attack', cost: 1, value: 6 });
        for (let i = 0; i < 4; i++) this.masterDeck.push({ id: 'defend', type: 'skill', cost: 1, value: 5 });
        
        if (this.characterClass === 'IRONCLAD') {
            this.masterDeck.push({ id: 'bash', type: 'attack', cost: 2, value: 8, effect: 'vulnerable' });
        } else if (this.characterClass === 'SILENT') {
            this.masterDeck.push({ id: 'neutralize', type: 'attack', cost: 0, value: 3, effect: 'weak' });
            // Silent has slightly different starter counts usually, simplifying for this demo
        }

        console.log(`[Player] Starter deck created with ${this.masterDeck.length} cards.`);
    }

    /**
     * Prepare for combat (shuffle master deck into draw pile).
     */
    preCombatInit() {
        this.drawPile = [...this.masterDeck];
        this.hand = [];
        this.discardPile = [];
        this.exhaustPile = [];
        this.shuffleDeck();
        
        // Reset temp stats
        this.currentHp = this.currentHp; // HP persists
        this.block = 0;
        this.energy = 3;
        
        console.log("[Player] Combat Ready.");
    }

    /**
     * Shuffle the draw pile.
     */
    shuffleDeck() {
        for (let i = this.drawPile.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.drawPile[i], this.drawPile[j]] = [this.drawPile[j], this.drawPile[i]];
        }
        globalBus.emit('deck_shuffled', { count: this.drawPile.length });
    }

    /**
     * Draw cards from draw pile to hand.
     * @param {number} amount 
     */
    drawCards(amount) {
        for (let i = 0; i < amount; i++) {
            if (this.hand.length >= 10) {
                console.log("Hand is full!");
                break;
            }

            if (this.drawPile.length === 0) {
                if (this.discardPile.length === 0) {
                    console.log("No cards left to draw.");
                    break;
                }
                // Reshuffle discard into draw
                this.drawPile = [...this.discardPile];
                this.discardPile = [];
                this.shuffleDeck();
            }

            const card = this.drawPile.pop();
            this.hand.push(card);
            
            globalBus.emit('card_drawn', { card: card });
        }
        
        this.updateHandUI();
    }

    /**
     * Play a card from hand.
     * @param {number} cardIndex 
     * @param {Entity} target 
     */
    playCard(cardIndex, target) {
        if (cardIndex < 0 || cardIndex >= this.hand.length) return;
        
        const card = this.hand[cardIndex];
        
        // Check Energy
        if (this.energy < card.cost) {
            console.log("Not enough energy!");
            globalBus.emit('ui_message', { text: "Not Enough Energy!", type: "warning" });
            return;
        }

        // Consume Energy
        this.energy -= card.cost;

        // Execute Card Effect
        console.log(`Playing card: ${card.id}`);
        this.resolveCardEffect(card, target);

        // Remove from hand
        this.hand.splice(cardIndex, 1);

        // Move to discard (or exhaust)
        this.discardPile.push(card);

        globalBus.emit('card_played', { card: card, target: target ? target.id : null });
        this.updateHandUI();
    }

    /**
     * Resolve the logic of a card.
     * @param {Object} card 
     * @param {Entity} target 
     */
    resolveCardEffect(card, target) {
        // Basic implementation
        if (card.type === 'attack' && target) {
            target.takeDamage(card.value);
            if (card.effect === 'vulnerable') target.addPower('vulnerable', 2);
            if (card.effect === 'weak') target.addPower('weak', 2);
        }
        else if (card.type === 'skill') {
            if (card.id === 'defend') {
                this.addBlock(card.value);
            }
        }
    }

    /**
     * Discard entire hand (end of turn).
     */
    discardHand() {
        while (this.hand.length > 0) {
            const card = this.hand.pop();
            this.discardPile.push(card);
        }
        globalBus.emit('hand_discarded');
        this.updateHandUI();
    }

    /**
     * Helper to emit UI update event for hand.
     */
    updateHandUI() {
        globalBus.emit('player_hand_updated', {
            hand: this.hand,
            drawCount: this.drawPile.length,
            discardCount: this.discardPile.length,
            energy: this.energy
        });
    }

    /**
     * Add gold.
     * @param {number} amount 
     */
    gainGold(amount) {
        this.gold += amount;
        globalBus.emit('player_gold_changed', { current: this.gold, delta: amount });
    }
}