/**
 * =================================================================================================
 * DungeonSpire - Combat Manager
 * Version: 1.0.0
 * Author: HyperInfinity
 * =================================================================================================
 * Description:
 * Orchestrates the turn-based combat flow.
 * - Player Turn -> Card Play -> End Turn
 * - Enemy Turn -> AI Action -> End Turn
 * - Win/Loss Conditions
 * =================================================================================================
 */

import { globalBus } from '../core/EventBus.js';

export class CombatManager {
    constructor(gameEngine) {
        this.engine = gameEngine;
        this.turn = 0;
        this.phase = 'SETUP'; // SETUP, PLAYER_TURN, ENEMY_TURN, RESOLUTION
        this.enemies = [];
        this.player = null;
        
        // Bind events
        this.bindEvents();
    }

    bindEvents() {
        globalBus.on('end_turn_clicked', () => this.endPlayerTurn());
        globalBus.on('card_played', (data) => this.handleCardPlayed(data));
        globalBus.on('entity_died', (data) => this.handleEntityDeath(data));
    }

    /**
     * Initialize a combat encounter.
     * @param {Player} player 
     * @param {Array<Enemy>} enemies 
     */
    startCombat(player, enemies) {
        console.log("[Combat] Starting Encounter");
        this.player = player;
        this.enemies = enemies;
        this.turn = 0;

        // UI Setup
        globalBus.emit('combat_start', { player, enemies });

        // Initialize Decks
        this.player.preCombatInit();

        // Start first turn
        this.startPlayerTurn();
    }

    /**
     * Start the Player's turn.
     */
    startPlayerTurn() {
        this.turn++;
        this.phase = 'PLAYER_TURN';
        console.log(`[Combat] Turn ${this.turn}: Player Start`);

        // 1. Trigger Start of Turn Effects
        this.player.onTurnStart();
        this.enemies.forEach(e => e.onTurnStart());

        // 2. Enemy Intents (Plan next move)
        this.enemies.forEach(e => e.rollIntent());

        // 3. Draw Cards
        this.player.drawCards(5);

        globalBus.emit('turn_start', { turn: this.turn, who: 'player' });
    }

    /**
     * Handle card play logic validation is done in Player class, 
     * but here we might check global combat states.
     */
    handleCardPlayed(data) {
        // Check win condition immediately after damage
        this.checkWinCondition();
    }

    /**
     * End the Player's turn.
     */
    endPlayerTurn() {
        if (this.phase !== 'PLAYER_TURN') return;
        
        console.log("[Combat] Player End Turn");
        this.player.discardHand();
        this.player.onTurnEnd();

        // Proceed to Enemy Turn
        this.startEnemyTurn();
    }

    /**
     * Execute Enemy turns.
     */
    async startEnemyTurn() {
        this.phase = 'ENEMY_TURN';
        console.log("[Combat] Enemy Turn Start");
        globalBus.emit('turn_start', { turn: this.turn, who: 'enemy' });

        // Sequential enemy actions with delays for visual clarity
        for (const enemy of this.enemies) {
            if (enemy.isDead) continue;

            // Highlight enemy acting
            globalBus.emit('enemy_acting', { enemyId: enemy.id });
            
            await new Promise(r => setTimeout(r, 1000)); // Wait 1s
            
            enemy.takeTurn(this.player);
            
            // Check player death
            if (this.player.currentHp <= 0) {
                this.handleDefeat();
                return;
            }
        }

        // End Enemy Turn
        this.enemies.forEach(e => e.onTurnEnd());
        
        // Back to Player
        this.startPlayerTurn();
    }

    /**
     * Handle entity death events.
     */
    handleEntityDeath(data) {
        if (data.entity === this.player) {
            this.handleDefeat();
        } else {
            // Enemy died
            console.log("Enemy Defeated!");
            this.checkWinCondition();
        }
    }

    /**
     * Check if all enemies are dead.
     */
    checkWinCondition() {
        const allDead = this.enemies.every(e => e.isDead);
        if (allDead) {
            this.handleVictory();
        }
    }

    /**
     * Handle Victory.
     */
    handleVictory() {
        this.phase = 'RESOLUTION';
        console.log("[Combat] VICTORY!");
        globalBus.emit('combat_victory', { 
            rewards: {
                gold: 15 + Math.floor(Math.random() * 10),
                card: true
            }
        });
        // Engine transition handled by UI or Reward screen callback
    }

    /**
     * Handle Defeat.
     */
    handleDefeat() {
        this.phase = 'RESOLUTION';
        console.log("[Combat] DEFEAT!");
        globalBus.emit('combat_defeat');
        this.engine.transitionTo('GAMEOVER');
    }
}