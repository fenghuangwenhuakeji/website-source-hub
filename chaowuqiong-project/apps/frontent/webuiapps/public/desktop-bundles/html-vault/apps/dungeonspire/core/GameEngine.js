/**
 * =================================================================================================
 * DungeonSpire - Game Engine Core
 * Version: 1.0.0
 * Author: HyperInfinity
 * =================================================================================================
 * Description:
 * The central nervous system of the game. It manages the game loop, state transitions,
 * and coordinates between subsystems (Combat, Map, Event, UI).
 * 
 * Patterns:
 * - Singleton: Only one engine instance exists.
 * - State Machine: Manages high-level game states (MENU, MAP, COMBAT, REWARD).
 * - Observer: Dispatches global events.
 * =================================================================================================
 */

export class GameEngine {
    constructor() {
        // -----------------------------------------------------------------------------------------
        // Core State
        // -----------------------------------------------------------------------------------------
        this.state = 'INIT'; // INIT, MENU, MAP, COMBAT, EVENT, REWARD, GAMEOVER
        this.isRunning = false;
        this.tickRate = 60;
        this.lastTime = 0;

        // -----------------------------------------------------------------------------------------
        // Subsystems
        // -----------------------------------------------------------------------------------------
        this.player = null;
        this.dungeon = null;
        this.combatManager = null;
        this.eventManager = null;
        
        // -----------------------------------------------------------------------------------------
        // Global Data
        // -----------------------------------------------------------------------------------------
        this.runData = {
            seed: Date.now(),
            floor: 0,
            act: 1,
            playtime: 0,
            score: 0
        };

        console.log("[Engine] Core System Instantiated");
    }

    /**
     * Initialize the engine and bind dependencies.
     */
    async init() {
        console.log("[Engine] Initializing...");
        // Simulate heavy loading
        await new Promise(r => setTimeout(r, 100));
        
        this.bindEvents();
        this.state = 'MENU';
        console.log("[Engine] Ready. State: MENU");
    }

    /**
     * Bind global event listeners.
     */
    bindEvents() {
        // Example: Listen for browser resize or focus loss
        window.addEventListener('blur', () => this.pause());
        window.addEventListener('focus', () => this.resume());
    }

    /**
     * Start a new run.
     * Resets all run-specific data and generates a new dungeon.
     */
    startRun(characterClass = 'IRONCLAD') {
        console.log(`[Engine] Starting new run with class: ${characterClass}`);
        
        // 1. Reset Run Data
        this.runData = {
            seed: Math.floor(Math.random() * 9999999),
            floor: 1,
            act: 1,
            playtime: 0,
            score: 0
        };

        // 2. Initialize Player
        // this.player = new PlayerEntity(characterClass);
        
        // 3. Generate Dungeon Map
        // this.dungeon = new DungeonGenerator(this.runData.seed).generateAct(1);

        // 4. Transition State
        this.transitionTo('MAP');
        
        // 5. Start Loop
        this.isRunning = true;
        this.gameLoop(0);
    }

    /**
     * Main Game Loop
     * Uses requestAnimationFrame for smooth rendering updates.
     * @param {number} timestamp 
     */
    gameLoop(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    /**
     * Update logic for the current frame.
     * @param {number} dt - Delta time in milliseconds
     */
    update(dt) {
        // Update playtime
        this.runData.playtime += dt;

        // State-specific updates
        switch (this.state) {
            case 'COMBAT':
                // if (this.combatManager) this.combatManager.update(dt);
                break;
            case 'MAP':
                // Map animations or interactions
                break;
            case 'EVENT':
                // Event logic
                break;
        }
    }

    /**
     * Render visual updates.
     * Note: Most rendering is reactive via UI components, but canvas elements update here.
     */
    render() {
        // if (this.combatManager) this.combatManager.render();
    }

    /**
     * Transition to a new game state.
     * Handles exit logic of previous state and entry logic of new state.
     * @param {string} newState 
     */
    transitionTo(newState) {
        console.log(`[Engine] State Transition: ${this.state} -> ${newState}`);
        
        // Exit Logic
        switch (this.state) {
            case 'COMBAT':
                // Clean up combat resources
                break;
        }

        this.state = newState;

        // Entry Logic
        switch (newState) {
            case 'MAP':
                // Show map UI
                break;
            case 'COMBAT':
                // Initialize combat UI
                break;
            case 'GAMEOVER':
                this.handleGameOver();
                break;
        }

        // Notify UI Manager
        // UIManager.onStateChange(newState);
    }

    /**
     * Pause the game loop.
     */
    pause() {
        if (this.state === 'MENU' || this.state === 'GAMEOVER') return;
        this.isRunning = false;
        console.log("[Engine] Game Paused");
    }

    /**
     * Resume the game loop.
     */
    resume() {
        if (this.state === 'MENU' || this.state === 'GAMEOVER') return;
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.gameLoop(this.lastTime);
            console.log("[Engine] Game Resumed");
        }
    }

    /**
     * Handle Game Over state.
     */
    handleGameOver() {
        this.isRunning = false;
        console.log("[Engine] GAME OVER");
        // Show Game Over Screen
        // Submit Score
    }
}