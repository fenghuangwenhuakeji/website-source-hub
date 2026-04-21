/**
 * =================================================================================================
 * DungeonSpire - Reward Screen
 * Version: 1.0.0
 * Author: HyperInfinity
 * =================================================================================================
 * Description:
 * Displays rewards after combat (Gold, Cards, Relics, Potions).
 * =================================================================================================
 */

import { globalBus } from '../../core/EventBus.js';

export class RewardScreen {
    constructor() {
        this.el = document.createElement('div');
        this.el.id = 'reward-screen';
        this.el.className = 'screen hidden';
        this.el.innerHTML = `
            <div class="reward-container">
                <h2 class="header-text">Victory!</h2>
                <div class="reward-list" id="reward-list">
                    <!-- Rewards injected here -->
                </div>
                <button class="btn-primary" id="btn-proceed">Proceed</button>
            </div>
        `;
        document.getElementById('app').appendChild(this.el);

        this.bindEvents();
    }

    bindEvents() {
        this.el.querySelector('#btn-proceed').addEventListener('click', () => {
            this.hide();
            globalBus.emit('rewards_claimed');
        });
    }

    show(rewards) {
        const list = this.el.querySelector('#reward-list');
        list.innerHTML = '';

        // Gold
        if (rewards.gold) {
            const item = document.createElement('div');
            item.className = 'reward-item';
            item.innerHTML = `<span class="icon">💰</span> <span>${rewards.gold} Gold</span>`;
            item.onclick = () => {
                globalBus.emit('gain_gold', rewards.gold);
                item.classList.add('claimed');
            };
            list.appendChild(item);
        }

        // Card Reward
        if (rewards.card) {
            const item = document.createElement('div');
            item.className = 'reward-item';
            item.innerHTML = `<span class="icon">🎴</span> <span>Add a card to your deck</span>`;
            item.onclick = () => {
                // Trigger card selection screen
                globalBus.emit('show_card_reward');
                item.classList.add('claimed');
            };
            list.appendChild(item);
        }

        this.el.classList.remove('hidden');
        this.el.classList.add('active');
    }

    hide() {
        this.el.classList.remove('active');
        this.el.classList.add('hidden');
    }
}