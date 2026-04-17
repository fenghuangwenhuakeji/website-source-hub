/**
 * =================================================================================================
 * DungeonSpire - Compendium Screen
 * Description: A gallery to view all unlocked cards and relics.
 * =================================================================================================
 */

import { CardFactory } from '../../data/cards/CardFactory.js';
import { RelicFactory } from '../../data/relics/RelicFactory.js';

export class CompendiumScreen {
    constructor() {
        this.el = document.createElement('div');
        this.el.id = 'compendium-screen';
        this.el.className = 'screen hidden';
        this.el.style.backgroundColor = 'rgba(0,0,0,0.95)';
        this.el.innerHTML = `
            <div style="padding: 40px; height: 100%; display: flex; flex-direction: column;">
                <h1 style="color: #ffd700; text-align: center; margin-bottom: 20px;">Compendium</h1>
                <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px;">
                    <button class="btn-secondary" id="btn-comp-cards">Cards</button>
                    <button class="btn-secondary" id="btn-comp-relics">Relics</button>
                    <button class="btn-secondary" id="btn-comp-close">Close</button>
                </div>
                <div class="compendium-grid" id="compendium-grid">
                    <!-- Items injected here -->
                </div>
            </div>
        `;
        document.body.appendChild(this.el);

        this.bindEvents();
    }

    bindEvents() {
        this.el.querySelector('#btn-comp-close').addEventListener('click', () => this.hide());
        this.el.querySelector('#btn-comp-cards').addEventListener('click', () => this.showCards());
        this.el.querySelector('#btn-comp-relics').addEventListener('click', () => this.showRelics());
    }

    show() {
        this.el.classList.remove('hidden');
        this.el.classList.add('active');
        this.showCards(); // Default view
    }

    hide() {
        this.el.classList.remove('active');
        this.el.classList.add('hidden');
    }

    showCards() {
        const grid = this.el.querySelector('#compendium-grid');
        grid.innerHTML = '';
        
        // Iterate all cards in factory
        Object.keys(CardFactory.registry).forEach(id => {
            const card = CardFactory.createCard(id);
            if (card) {
                // Create a visual representation (mini card)
                const div = document.createElement('div');
                div.className = 'compendium-item';
                div.style.border = `1px solid ${this.getColor(card.color)}`;
                div.style.padding = '10px';
                div.style.color = '#fff';
                div.style.textAlign = 'center';
                div.innerHTML = `
                    <div style="font-weight:bold; font-size:0.9rem">${card.name}</div>
                    <div style="font-size:0.7rem; color:#aaa">${card.type}</div>
                    <div style="margin-top:5px; font-size:0.6rem">${card.description}</div>
                `;
                grid.appendChild(div);
            }
        });
    }

    showRelics() {
        const grid = this.el.querySelector('#compendium-grid');
        grid.innerHTML = '';
        
        Object.keys(RelicFactory.registry).forEach(id => {
            const relic = RelicFactory.createRelic(id);
            if (relic) {
                const div = document.createElement('div');
                div.className = 'compendium-item';
                div.style.border = '1px solid #aaa';
                div.style.padding = '10px';
                div.style.color = '#fff';
                div.style.textAlign = 'center';
                div.innerHTML = `
                    <img src="${relic.assetPath}" style="width:32px; height:32px; margin-bottom:5px;">
                    <div style="font-weight:bold; font-size:0.9rem">${relic.name}</div>
                    <div style="font-size:0.6rem; color:#aaa">${relic.description}</div>
                `;
                grid.appendChild(div);
            }
        });
    }

    getColor(color) {
        switch(color) {
            case 'red': return '#ff4d4d';
            case 'green': return '#4dff4d';
            case 'blue': return '#4da6ff';
            case 'purple': return '#bf80ff';
            default: return '#aaa';
        }
    }
}