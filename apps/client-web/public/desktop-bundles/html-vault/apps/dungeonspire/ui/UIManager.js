/**
 * =================================================================================================
 * DungeonSpire - UI Manager
 * Version: 1.0.0
 * Author: HyperInfinity
 * =================================================================================================
 * Description:
 * Manages the HTML DOM updates in response to game events.
 * Handles:
 * - Card rendering
 * - HP/Energy updates
 * - Scene switching
 * - Drag and Drop (Cards)
 * =================================================================================================
 */

import { globalBus } from '../core/EventBus.js';

export class UIManager {
    constructor() {
        // DOM Cache
        this.els = {
            hpCurrent: document.getElementById('hp-current'),
            hpMax: document.getElementById('hp-max'),
            energyCurrent: document.getElementById('energy-current'),
            energyMax: document.getElementById('energy-max'),
            handContainer: document.getElementById('hand-container'),
            drawPile: document.getElementById('draw-pile'),
            discardPile: document.getElementById('discard-pile'),
            enemiesContainer: document.getElementById('enemies-container'),
            btnEndTurn: document.getElementById('btn-end-turn')
        };

        this.bindEvents();
    }

    bindEvents() {
        // Game Events
        globalBus.on('player_hand_updated', (data) => this.renderHand(data));
        globalBus.on('player_gold_changed', (data) => this.updateGold(data));
        globalBus.on('combat_start', (data) => this.setupCombatUI(data));
        globalBus.on('entity_damaged', (data) => this.showDamageNumber(data));
        globalBus.on('turn_start', (data) => this.onTurnStart(data));

        // DOM Events
        if (this.els.btnEndTurn) {
            this.els.btnEndTurn.addEventListener('click', () => {
                globalBus.emit('end_turn_clicked');
            });
        }
    }

    /**
     * Render the player's hand.
     */
    renderHand(data) {
        if (!this.els.handContainer) return;
        
        // Clear existing
        this.els.handContainer.innerHTML = '';

        // Update counters
        if (this.els.energyCurrent) this.els.energyCurrent.textContent = data.energy;
        if (this.els.drawPile) this.els.drawPile.querySelector('.count').textContent = data.drawCount;
        if (this.els.discardPile) this.els.discardPile.querySelector('.count').textContent = data.discardCount;

        // Render Cards
        data.hand.forEach((card, index) => {
            const cardEl = this.createCardElement(card, index);
            this.els.handContainer.appendChild(cardEl);
        });
    }

    /**
     * Create a DOM element for a card.
     */
    createCardElement(card, index) {
        const el = document.createElement('div');
        el.className = `card ${card.type.toLowerCase()} card-enter`;
        el.dataset.index = index;
        el.style.animationDelay = `${index * 0.1}s`;

        el.innerHTML = `
            <div class="card-header">
                <div class="card-cost">${card.cost}</div>
                <div class="card-type">${card.type}</div>
            </div>
            <div class="card-image">⚔️</div>
            <div class="card-title">${card.id.toUpperCase()}</div>
            <div class="card-description">
                Deal ${card.value} damage.${card.effect ? ' Apply ' + card.effect : ''}
            </div>
        `;

        // Click to play (simplified interaction)
        el.addEventListener('click', () => {
            // In a real app, we'd select a target first if needed.
            // Here we assume single target or auto-target first enemy for simplicity.
            // Or we trigger a 'card_selected' state.
            const enemies = document.querySelectorAll('.entity');
            let targetId = null;
            if (enemies.length > 0) {
                targetId = enemies[0].dataset.id; // Auto-target first
            }
            
            // For this demo, just try to play it on the first enemy
            // Ideally, we'd use Drag & Drop here.
            // globalBus.emit('try_play_card', { index, targetId });
            // But logic is in Player class usually triggered by input controller.
            
            // Mocking the input controller logic here:
            // window.app.engine.player.playCard(index, window.app.engine.combatManager.enemies[0]);
            console.log("Card clicked: " + card.id);
        });

        return el;
    }

    /**
     * Setup the combat screen with enemies.
     */
    setupCombatUI(data) {
        if (!this.els.enemiesContainer) return;
        this.els.enemiesContainer.innerHTML = '';

        data.enemies.forEach(enemy => {
            const el = document.createElement('div');
            el.className = 'entity';
            el.dataset.id = enemy.id;
            el.innerHTML = `
                <div class="entity-intent" id="intent-${enemy.id}">
                    <!-- Icon injected later -->
                </div>
                <div class="entity-sprite" style="background-image: url('${enemy.assetPath}')"></div>
                <div class="entity-hp-bar">
                    <div class="entity-hp-fill" style="width: 100%"></div>
                </div>
            `;
            this.els.enemiesContainer.appendChild(el);
        });

        // Update Player HP
        this.updateHP(data.player.currentHp, data.player.maxHp);
    }

    /**
     * Update HP Displays.
     */
    updateHP(current, max) {
        if (this.els.hpCurrent) this.els.hpCurrent.textContent = current;
        if (this.els.hpMax) this.els.hpMax.textContent = max;
    }

    /**
     * Show floating damage number.
     */
    showDamageNumber(data) {
        // Find target element
        const targetEl = document.querySelector(`.entity[data-id="${data.targetId}"]`);
        // OR player
        // ...

        if (targetEl) {
            const num = document.createElement('div');
            num.className = 'damage-number';
            num.textContent = data.amount;
            num.style.left = '50%';
            num.style.top = '20%';
            targetEl.appendChild(num);

            setTimeout(() => num.remove(), 1000);
            
            // Update HP bar visual width
            // (Requires accessing the entity object to get max HP, simplified here)
            const hpBar = targetEl.querySelector('.entity-hp-fill');
            if (hpBar) {
                // hpBar.style.width = ... 
            }
        }
    }

    onTurnStart(data) {
        if (data.who === 'player') {
            this.els.btnEndTurn.disabled = false;
            this.els.btnEndTurn.textContent = "End Turn";
        } else {
            this.els.btnEndTurn.disabled = true;
            this.els.btnEndTurn.textContent = "Enemy Turn";
        }
    }
}