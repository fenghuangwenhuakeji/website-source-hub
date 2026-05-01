/**
 * =================================================================================================
 * DungeonSpire - Shop Screen (Advanced)
 * Version: 2.0.0
 * Description: Enhanced shop with gambling, card removal, and dynamic stock.
 * =================================================================================================
 */

import { globalBus } from '../../core/EventBus.js';
import { CardFactory } from '../../data/cards/CardFactory.js';
import { RelicFactory } from '../../data/relics/RelicFactory.js';
import { PotionFactory } from '../../data/potions/PotionFactory.js';

export class ShopScreen {
    constructor() {
        this.el = document.createElement('div');
        this.el.id = 'shop-screen';
        this.el.className = 'screen hidden';
        this.el.style.backgroundImage = "url('assets/bg_shop_advanced.jpg')";
        this.el.innerHTML = `
            <div class="shop-container" style="display:grid; grid-template-columns: 3fr 1fr; gap:20px; padding:20px; height:100%;">
                <!-- Main Wares -->
                <div class="shop-wares">
                    <div class="merchant-dialogue-box" style="background:rgba(0,0,0,0.8); padding:15px; border-radius:10px; margin-bottom:20px; color:#ffd700; font-style:italic;">
                        "Ah, a customer! Or should I say... a victim of fate?"
                    </div>
                    
                    <h3 style="color:#fff; border-bottom:1px solid #555;">Cards</h3>
                    <div class="shop-grid" id="shop-cards-grid"></div>
                    
                    <h3 style="color:#fff; border-bottom:1px solid #555; margin-top:20px;">Relics & Potions</h3>
                    <div class="shop-grid" id="shop-items-grid"></div>
                </div>

                <!-- Services & Gambling -->
                <div class="shop-services" style="background:rgba(0,0,0,0.6); padding:10px; border-radius:10px;">
                    <h3 style="color:#ff4d4d; text-align:center;">Services</h3>
                    
                    <div class="service-btn" id="btn-remove-card" style="margin-bottom:20px; text-align:center; cursor:pointer; border:1px solid #777; padding:10px;">
                        <div>🔥 Purge Deck</div>
                        <div style="color:#ffd700">75 G</div>
                    </div>

                    <div class="service-btn" id="btn-shuffle-deck" style="margin-bottom:20px; text-align:center; cursor:pointer; border:1px solid #777; padding:10px;">
                        <div>🔄 Reshuffle Stock</div>
                        <div style="color:#ffd700">50 G</div>
                    </div>

                    <h3 style="color:#a020f0; text-align:center; margin-top:40px;">Gamble</h3>
                    <div class="gamble-slot" id="gamble-slot">
                        <div style="text-align:center;">
                            <div style="font-size:3rem;">❓</div>
                            <div>Mystery Card</div>
                            <div style="color:#ffd700">100 G</div>
                        </div>
                    </div>
                </div>
                
                <button class="btn-secondary" id="btn-leave-shop" style="position:absolute; bottom:20px; right:20px;">Leave</button>
            </div>
        `;
        document.getElementById('app').appendChild(this.el);

        this.bindEvents();
    }

    bindEvents() {
        this.el.querySelector('#btn-leave-shop').addEventListener('click', () => {
            this.hide();
            globalBus.emit('shop_left');
        });

        this.el.querySelector('#btn-remove-card').addEventListener('click', () => {
            globalBus.emit('request_card_removal', 75);
        });

        this.el.querySelector('#btn-shuffle-deck').addEventListener('click', () => {
            // Logic to refresh shop stock
            globalBus.emit('pay_gold', { amount: 50, callback: () => this.generateStock() });
        });

        this.el.querySelector('#gamble-slot').addEventListener('click', () => {
            this.handleGamble();
        });
    }

    handleGamble() {
        // Check gold logic would be here via event bus callback usually, simulating success for now
        globalBus.emit('pay_gold', { amount: 100, callback: () => {
            const roll = Math.random();
            let cardId;
            let type = 'normal';

            if (roll < 0.1) {
                // 10% Gold Card
                cardId = CardFactory.getRandomCardId('rare', 'red');
                type = 'gold';
                globalBus.emit('ui_message', { text: "JACKPOT! Golden Card!", type: "success" });
            } else if (roll < 0.3) {
                // 20% Misfortune
                cardId = 'pain'; // Or random curse
                type = 'misfortune';
                globalBus.emit('ui_message', { text: "Bad Luck...", type: "error" });
            } else {
                // Normal Rare
                cardId = CardFactory.getRandomCardId('rare', 'red');
            }

            if (cardId) {
                const card = CardFactory.createCard(cardId);
                if (type === 'gold') {
                    card.isGold = true;
                    card.upgrade(); // Gold cards come upgraded
                } else if (type === 'misfortune') {
                    card.isMisfortune = true;
                }
                
                // Add to deck
                window.app.engine.player.masterDeck.push(card);
                // Show visual feedback
            }
        }});
    }

    show() {
        this.generateStock();
        this.el.classList.remove('hidden');
        this.el.classList.add('active');
    }

    hide() {
        this.el.classList.remove('active');
        this.el.classList.add('hidden');
    }

    generateStock() {
        const cardGrid = this.el.querySelector('#shop-cards-grid');
        const itemGrid = this.el.querySelector('#shop-items-grid');
        cardGrid.innerHTML = '';
        itemGrid.innerHTML = '';
        
        // 5 Random Cards
        for (let i = 0; i < 5; i++) {
            const cardId = CardFactory.getRandomCardId('common', 'red');
            if (cardId) {
                const card = CardFactory.createCard(cardId);
                const price = 50 + Math.floor(Math.random() * 20);
                this.createShopItem(cardGrid, card, price, 'card');
            }
        }

        // 2 Relics
        for (let i = 0; i < 2; i++) {
            const relicId = RelicFactory.getRandomRelicId('common');
            if (relicId) {
                const relic = RelicFactory.createRelic(relicId);
                const price = 150 + Math.floor(Math.random() * 50);
                this.createShopItem(itemGrid, relic, price, 'relic');
            }
        }
        
        // 2 Potions
        for (let i = 0; i < 2; i++) {
            const potionId = PotionFactory.getRandomPotionId();
            if (potionId) {
                const potion = PotionFactory.createPotion(potionId);
                const price = 50;
                this.createShopItem(itemGrid, potion, price, 'potion');
            }
        }
    }

    createShopItem(container, item, price, type) {
        const el = document.createElement('div');
        el.className = 'shop-item';
        el.innerHTML = `
            <div class="shop-preview">${item.name}</div>
            <div class="shop-price">${price} G</div>
        `;
        el.onclick = () => {
            globalBus.emit('attempt_buy', { type, item, price });
            el.classList.add('sold');
            el.style.pointerEvents = 'none';
            el.style.opacity = '0.5';
        };
        container.appendChild(el);
    }
}