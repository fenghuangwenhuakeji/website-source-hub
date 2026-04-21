/**
 * 卡牌系统
 * 管理卡牌收集、使用和战斗
 */

export class CardSystem {
    constructor(engine) {
        this.engine = engine;
        this.isInitialized = false;
        this.deck = [];
        this.hand = [];
        this.allCards = [];
    }

    async init() {
        if (this.isInitialized) return;

        console.log('[CardSystem] 初始化卡牌系统...');

        // 初始化所有卡牌
        this.initializeCards();

        this.isInitialized = true;
        console.log('[CardSystem] 卡牌系统初始化完成');
    }

    // 初始化卡牌
    initializeCards() {
        this.allCards = [
            // 攻击卡牌
            { id: 'slash', name: '斩击', type: 'attack', cost: 1, damage: 10, icon: '⚔️', rarity: 'common', description: '造成10点伤害' },
            { id: 'heavy_slash', name: '重斩', type: 'attack', cost: 2, damage: 20, icon: '⚔️', rarity: 'uncommon', description: '造成20点伤害' },
            { id: 'critical_strike', name: '暴击', type: 'attack', cost: 2, damage: 15, crit: true, icon: '🗡️', rarity: 'rare', description: '造成15点伤害，必定暴击' },
            { id: 'double_strike', name: '连斩', type: 'attack', cost: 3, damage: 12, hits: 2, icon: '⚔️', rarity: 'epic', description: '造成12点伤害x2' },

            // 防御卡牌
            { id: 'block', name: '格挡', type: 'defense', cost: 1, defense: 5, icon: '🛡️', rarity: 'common', description: '获得5点护甲' },
            { id: 'iron_wall', name: '铁壁', type: 'defense', cost: 2, defense: 12, icon: '🛡️', rarity: 'rare', description: '获得12点护甲' },
            { id: 'counter', name: '反击', type: 'defense', cost: 2, defense: 5, counterDamage: 8, icon: '🛡️', rarity: 'uncommon', description: '获得5点护甲，反击8点伤害' },

            // 魔法卡牌
            { id: 'fireball', name: '火球', type: 'magic', cost: 2, damage: 18, icon: '🔥', rarity: 'common', description: '造成18点魔法伤害' },
            { id: 'ice_blast', name: '冰爆', type: 'magic', cost: 3, damage: 15, slow: true, icon: '❄️', rarity: 'uncommon', description: '造成15点伤害并减速' },
            { id: 'lightning', name: '雷霆', type: 'magic', cost: 3, damage: 25, icon: '⚡', rarity: 'rare', description: '造成25点魔法伤害' },
            { id: 'meteor', name: '流星', type: 'magic', cost: 4, damage: 40, icon: '☄️', rarity: 'legendary', description: '造成40点巨大伤害' },

            // 辅助卡牌
            { id: 'heal', name: '治疗', type: 'support', cost: 2, heal: 15, icon: '💚', rarity: 'common', description: '恢复15点生命' },
            { id: 'power_up', name: '强化', type: 'support', cost: 1, buff: 'atk', value: 5, icon: '⚡', rarity: 'uncommon', description: '攻击力+5' },
            { id: 'speed_up', name: '加速', type: 'support', cost: 1, buff: 'spd', value: 5, icon: '💨', rarity: 'uncommon', description: '速度+5' },
            { id: 'draw', name: '抽牌', type: 'support', cost: 1, draw: 2, icon: '🃏', rarity: 'common', description: '抽2张牌' },
            { id: 'double_draw', name: '神抽', type: 'support', cost: 2, draw: 4, icon: '🃏', rarity: 'rare', description: '抽4张牌' }
        ];
    }

    // 初始抽牌
    initialDraw() {
        this.deck = this.allCards.slice(0, 10);
        this.drawCards(5);
    }

    // 抽牌
    drawCards(count) {
        for (let i = 0; i < count; i++) {
            if (this.deck.length > 0) {
                const card = this.deck[Math.floor(Math.random() * this.deck.length)];
                this.hand.push(card);
            }
        }
        this.renderHand();
    }

    // 使用卡牌
    useCard(cardIndex) {
        if (cardIndex < 0 || cardIndex >= this.hand.length) {
            return { success: false, message: '无效的卡牌' };
        }

        const card = this.hand[cardIndex];

        if (!window.game || !game.player) {
            return { success: false, message: '请先开始游戏' };
        }

        // 扣除费用（简化版本）
        // 实际游戏中应该有费用系统

        // 执行卡牌效果
        const result = this.executeCardEffect(card);

        // 移除使用的卡牌
        this.hand.splice(cardIndex, 1);

        // 重新渲染手牌
        this.renderHand();

        return result;
    }

    // 执行卡牌效果
    executeCardEffect(card) {
        const player = game.player;

        switch (card.type) {
            case 'attack':
                return { success: true, message: `使用了${card.name}，造成${card.damage}点伤害`, effect: { damage: card.damage } };

            case 'defense':
                player.def += (card.defense || 0);
                return { success: true, message: `使用了${card.name}，获得${card.defense}点防御`, effect: { defense: card.defense } };

            case 'magic':
                return { success: true, message: `使用了${card.name}，造成${card.damage}点魔法伤害`, effect: { magicDamage: card.damage } };

            case 'support':
                if (card.heal) {
                    player.hp = Math.min(player.hp + card.heal, player.maxHp);
                    return { success: true, message: `使用了${card.name}，恢复${card.heal}点生命`, effect: { heal: card.heal } };
                }
                if (card.buff) {
                    player[card.buff] += card.value;
                    return { success: true, message: `使用了${card.name}，${card.buff}+${card.value}`, effect: { buff: card.buff, value: card.value } };
                }
                if (card.draw) {
                    this.drawCards(card.draw);
                    return { success: true, message: `使用了${card.name}，抽${card.draw}张牌`, effect: { draw: card.draw } };
                }
                break;
        }

        return { success: true, message: `使用了${card.name}` };
    }

    // 渲染手牌
    renderHand() {
        const handEl = document.getElementById('card-hand');
        if (!handEl) return;

        handEl.innerHTML = this.hand.map((card, index) => `
            <div class="game-card" onclick="cardSystem.useCard(${index})" data-rarity="${card.rarity}">
                <div class="card-cost">${card.cost}</div>
                <div class="card-image">${card.icon}</div>
                <div class="card-title">${card.name}</div>
                <div class="card-description">${card.description}</div>
                <div class="card-rarity ${card.rarity}">${this.getRarityName(card.rarity)}</div>
            </div>
        `).join('');
    }

    // 渲染卡牌收藏
    renderCardCollection(filter = 'all') {
        const deckDisplayEl = document.getElementById('deck-display');
        if (!deckDisplayEl) return;

        const filteredCards = filter === 'all'
            ? this.allCards
            : this.allCards.filter(card => card.type === filter);

        deckDisplayEl.innerHTML = filteredCards.map(card => `
            <div class="game-card" data-rarity="${card.rarity}">
                <div class="card-cost">${card.cost}</div>
                <div class="card-image">${card.icon}</div>
                <div class="card-title">${card.name}</div>
                <div class="card-description">${card.description}</div>
                <div class="card-rarity ${card.rarity}">${this.getRarityName(card.rarity)}</div>
            </div>
        `).join('');

        // 更新卡组信息
        const deckInfoEl = document.getElementById('deck-info');
        if (deckInfoEl) {
            deckInfoEl.innerHTML = `
                <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                    <span>总卡牌: ${this.allCards.length}</span>
                    <span>当前手牌: ${this.hand.length}</span>
                    <span>卡组: ${this.deck.length}</span>
                </div>
            `;
        }
    }

    // 获取稀有度名称
    getRarityName(rarity) {
        const names = {
            common: '普通',
            uncommon: '优秀',
            rare: '稀有',
            epic: '史诗',
            legendary: '传说'
        };
        return names[rarity] || rarity;
    }
}
