/**
 * =================================================================================================
 * DungeonSpire - Campfire Screen
 * Version: 1.0.0
 * Author: HyperInfinity
 * =================================================================================================
 * Description:
 * Rest site logic (Rest or Smith).
 * =================================================================================================
 */

import { globalBus } from '../../core/EventBus.js';

export class CampfireScreen {
    constructor() {
        this.el = document.createElement('div');
        this.el.id = 'campfire-screen';
        this.el.className = 'screen hidden';
        this.el.style.backgroundImage = "url('assets/bg_campfire.jpg')";
        this.el.innerHTML = `
            <div class="campfire-options">
                <div class="option" id="opt-rest">
                    <div class="icon">💤</div>
                    <div class="label">Rest</div>
                    <div class="desc">Heal for 30% of your Max HP.</div>
                </div>
                <div class="option" id="opt-smith">
                    <div class="icon">🔨</div>
                    <div class="label">Smith</div>
                    <div class="desc">Upgrade a card in your deck.</div>
                </div>
            </div>
        `;
        document.getElementById('app').appendChild(this.el);

        this.bindEvents();
    }

    bindEvents() {
        this.el.querySelector('#opt-rest').addEventListener('click', () => {
            globalBus.emit('campfire_action', 'rest');
            this.hide();
        });

        this.el.querySelector('#opt-smith').addEventListener('click', () => {
            globalBus.emit('campfire_action', 'smith');
            // Should open card grid for selection
            this.hide();
        });
    }

    show() {
        this.el.classList.remove('hidden');
        this.el.classList.add('active');
    }

    hide() {
        this.el.classList.remove('active');
        this.el.classList.add('hidden');
    }
}