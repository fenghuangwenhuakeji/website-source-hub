/**
 * 卡牌系统
 * 卡牌收集、构建、使用的完整系统
 */

export default class CardSystem {
    constructor() {
        this.cardLibrary = new Map(); // 卡牌库
        this.playerDeck = []; // 玩家卡组
        this.hand = []; // 手牌
        this.discardPile = []; // 弃牌堆
        this.drawPile = []; // 抽牌堆
        this.maxHandSize = 7;
        this.initialHandSize = 4;
        this.energy = 3;
        this.maxEnergy = 3;
    }

    async initialize() {
        console.log('🃏 卡牌系统初始化...');
        await this.loadCardLibrary();
        await this.loadPlayerDeck();
    }

    /**
     * 加载卡牌库
     */
    async loadCardLibrary() {
        // 攻击卡牌
        this.addCard({
            id: 'strike',
            name: '打击',
            type: 'attack',
            cost: 1,
            rarity: 'common',
            description: '造成6点伤害',
            effect: 'damage',
            value: 6,
            icon: '⚔️',
            tags: ['basic', 'attack']
        });

        this.addCard({
            id: 'bash',
            name: '重击',
            type: 'attack',
            cost: 2,
            rarity: 'common',
            description: '造成8点伤害，给予2层虚弱',
            effect: 'damage_debuff',
            value: 8,
            debuff: { effect: 'weak', stacks: 2 },
            icon: '🔨',
            tags: ['attack', 'debuff']
        });

        this.addCard({
            id: 'cleave',
            name: '横扫',
            type: 'attack',
            cost: 1,
            rarity: 'common',
            description: '对所有敌人造成5点伤害',
            effect: 'aoe_damage',
            value: 5,
            icon: '🌀',
            tags: ['attack', 'aoe']
        });

        this.addCard({
            id: 'iron_wave',
            name: '铁波',
            type: 'attack',
            cost: 1,
            rarity: 'uncommon',
            description: '造成5点伤害，获得5点护甲',
            effect: 'damage_block',
            damage: 5,
            block: 5,
            icon: '🛡️',
            tags: ['attack', 'defense']
        });

        this.addCard({
            id: 'pommel_strike',
            name: '柄击',
            type: 'attack',
            cost: 1,
            rarity: 'uncommon',
            description: '造成9点伤害，抽1张牌',
            effect: 'damage_draw',
            damage: 9,
            draw: 1,
            icon: '🤺',
            tags: ['attack', 'draw']
        });

        this.addCard({
            id: 'sword_boomerang',
            name: '回旋镖',
            type: 'attack',
            cost: 1,
            rarity: 'uncommon',
            description: '造成3点伤害，随机重复3次',
            effect: 'multi_hit',
            hits: 3,
            damage: 3,
            icon: '➰',
            tags: ['attack', 'multi_hit']
        });

        // 防御卡牌
        this.addCard({
            id: 'defend',
            name: '防御',
            type: 'skill',
            cost: 1,
            rarity: 'common',
            description: '获得5点护甲',
            effect: 'block',
            value: 5,
            icon: '🛡️',
            tags: ['basic', 'defense']
        });

        this.addCard({
            id: 'armaments',
            name: '武装',
            type: 'skill',
            cost: 1,
            rarity: 'uncommon',
            description: '获得5点护甲，手中1张牌获得升级',
            effect: 'block_upgrade',
            block: 5,
            icon: '⚙️',
            tags: ['defense', 'upgrade']
        });

        this.addCard({
            id: 'shrug_it_off',
            name: '无视',
            type: 'skill',
            cost: 1,
            rarity: 'rare',
            description: '获得8点护甲，抽1张牌',
            effect: 'block_draw',
            block: 8,
            draw: 1,
            icon: '😏',
            tags: ['defense', 'draw']
        });

        // 能力卡牌
        this.addCard({
            id: 'inflame',
            name: '激怒',
            type: 'power',
            cost: 1,
            rarity: 'uncommon',
            description: '战斗结束时，获得2点力量',
            effect: 'buff_strength',
            value: 2,
            icon: '🔥',
            tags: ['power', 'buff']
        });

        this.addCard({
            id: 'metallicize',
            name: '金属化',
            type: 'power',
            cost: 1,
            rarity: 'uncommon',
            description: '战斗结束时，获得3点护甲',
            effect: 'buff_block',
            value: 3,
            icon: '🔩',
            tags: ['power', 'defense']
        });

        this.addCard({
            id: 'combust',
            name: '燃烧',
            type: 'power',
            cost: 1,
            rarity: 'rare',
            description: '战斗结束时，对所有敌人造成5点伤害，对自己造成1点伤害',
            effect: 'burn',
            enemyDamage: 5,
            selfDamage: 1,
            icon: '💥',
            tags: ['power', 'aoe']
        });

        // 抽牌卡
        this.addCard({
            id: 'draw',
            name: '洞察',
            type: 'skill',
            cost: 0,
            rarity: 'common',
            description: '抽2张牌',
            effect: 'draw',
            value: 2,
            icon: '👁️',
            tags: ['basic', 'draw']
        });

        this.addCard({
            id: 'battle_trance',
            name: '战斗冥想',
            type: 'skill',
            cost: 0,
            rarity: 'uncommon',
            description: '抽3张牌，这回合不能打出其他牌',
            effect: 'draw_no_play',
            draw: 3,
            icon: '🧘',
            tags: ['draw', 'restrict']
        });

        // 特殊卡牌
        this.addCard({
            id: 'panacea',
            name: '万能药',
            type: 'skill',
            cost: 1,
            rarity: 'rare',
            description: '选择任意张手牌放入弃牌堆',
            effect: 'discard_any',
            icon: '💊',
            tags: ['utility']
        });

        this.addCard({
            id: 'flash_of_steel',
            name: '闪电突刺',
            type: 'skill',
            cost: 0,
            rarity: 'rare',
            description: '本回合使用的下一张攻击卡牌不消耗能量',
            effect: 'free_attack',
            icon: '⚡',
            tags: ['utility', 'buff']
        });

        // 职业专属卡牌（战士）
        this.addCard({
            id: 'anger',
            name: '愤怒',
            type: 'attack',
            cost: 0,
            rarity: 'uncommon',
            description: '造成6点伤害，将此牌放入弃牌堆',
            effect: 'damage_discard',
            damage: 6,
            class: 'warrior',
            icon: '😤',
            tags: ['attack', 'class']
        });

        this.addCard({
            id: 'heavy_blade',
            name: '重刃',
            type: 'attack',
            cost: 2,
            rarity: 'uncommon',
            description: '造成14点伤害，每有1点力量额外造成3点伤害',
            effect: 'damage_per_str',
            baseDamage: 14,
            strBonus: 3,
            class: 'warrior',
            icon: '🗡️',
            tags: ['attack', 'class']
        });

        // 职业专属卡牌（法师）
        this.addCard({
            id: 'fireball',
            name: '火球术',
            type: 'attack',
            cost: 1,
            rarity: 'uncommon',
            description: '造成8点火焰伤害，附加燃烧',
            effect: 'fire_damage',
            damage: 8,
            burnDamage: 3,
            class: 'mage',
            icon: '🔥',
            tags: ['attack', 'class', 'magic']
        });

        this.addCard({
            id: 'ice_spike',
            name: '冰刺',
            type: 'attack',
            cost: 1,
            rarity: 'uncommon',
            description: '造成6点冰霜伤害，50%几率冻结',
            effect: 'ice_damage',
            damage: 6,
            freezeChance: 0.5,
            class: 'mage',
            icon: '❄️',
            tags: ['attack', 'class', 'magic']
        });

        // 职业专属卡牌（盗贼）
        this.addCard({
            id: 'backstab',
            name: '背刺',
            type: 'attack',
            cost: 1,
            rarity: 'common',
            description: '造成11点伤害',
            effect: 'backstab',
            damage: 11,
            class: 'rogue',
            icon: '🗡️',
            tags: ['attack', 'class']
        });

        this.addCard({
            id: 'poison',
            name: '毒刃',
            type: 'attack',
            cost: 1,
            rarity: 'uncommon',
            description: '造成4点伤害，给予4层中毒',
            effect: 'poison',
            damage: 4,
            poisonStacks: 4,
            class: 'rogue',
            icon: '☠️',
            tags: ['attack', 'class', 'debuff']
        });

        this.addCard({
            id: 'cloak_and_dagger',
            name: '隐匿与匕首',
            type: 'skill',
            cost: 1,
            rarity: 'rare',
            description: '获得2层闪避，造成4点伤害',
            effect: 'evade_damage',
            evade: 2,
            damage: 4,
            class: 'rogue',
            icon: '🥷',
            tags: ['skill', 'class']
        });

        // 稀有卡牌
        this.addCard({
            id: 'bludgeon',
            name: '猛击',
            type: 'attack',
            cost: 3,
            rarity: 'rare',
            description: '造成32点伤害',
            effect: 'heavy_damage',
            value: 32,
            icon: '💪',
            tags: ['attack', 'heavy']
        });

        this.addCard({
            id: 'limit_break',
            name: '极限突破',
            type: 'power',
            cost: 1,
            rarity: 'rare',
            description: '力量翻倍',
            effect: 'double_strength',
            icon: '⬆️',
            tags: ['power', 'buff']
        });

        this.addCard({
            id: 'offering',
            name: '献祭',
            type: 'skill',
            cost: 0,
            rarity: 'rare',
            description: '失去1点最大生命，抽3张牌，获得2点能量',
            effect: 'sacrifice',
            hpLoss: 1,
            draw: 3,
            energy: 2,
            icon: '🩸',
            tags: ['skill', 'costly']
        });
    }

    /**
     * 添加卡牌到卡库
     */
    addCard(card) {
        if (!card.upgraded) {
            card.upgraded = false;
        }
        if (!card.upgradeDescription) {
            card.upgradeDescription = this.generateUpgradeDescription(card);
        }
        this.cardLibrary.set(card.id, card);
    }

    /**
     * 生成升级描述
     */
    generateUpgradeDescription(card) {
        switch (card.effect) {
            case 'damage':
                return `造成${card.value + 3}点伤害`;
            case 'damage_debuff':
                return `造成${card.value + 2}点伤害，给予3层虚弱`;
            case 'aoe_damage':
                return `对所有敌人造成${card.value + 2}点伤害`;
            case 'block':
                return `获得${card.value + 3}点护甲`;
            case 'draw':
                return `抽${card.value + 1}张牌`;
            default:
                return card.description + '（已升级）';
        }
    }

    /**
     * 加载玩家卡组
     */
    async loadPlayerDeck() {
        try {
            const savedDeck = localStorage.getItem('rpg_card_deck');
            if (savedDeck) {
                this.playerDeck = JSON.parse(savedDeck);
            } else {
                // 默认初始卡组
                this.playerDeck = [
                    { id: 'strike', count: 4 },
                    { id: 'defend', count: 4 },
                    { id: 'bash', count: 1 },
                    { id: 'draw', count: 1 },
                    { id: 'strike', count: 1, upgraded: true }
                ];
            }
        } catch (e) {
            console.error('加载卡组失败:', e);
            this.playerDeck = [];
        }
    }

    /**
     * 保存玩家卡组
     */
    async savePlayerDeck() {
        try {
            localStorage.setItem('rpg_card_deck', JSON.stringify(this.playerDeck));
        } catch (e) {
            console.error('保存卡组失败:', e);
        }
    }

    /**
     * 构建抽牌堆
     */
    buildDrawPile() {
        this.drawPile = [];
        for (const cardEntry of this.playerDeck) {
            const cardTemplate = this.cardLibrary.get(cardEntry.id);
            if (cardTemplate) {
                for (let i = 0; i < cardEntry.count; i++) {
                    const card = { ...cardTemplate };
                    if (cardEntry.upgraded) {
                        card.upgraded = true;
                    }
                    this.drawPile.push(card);
                }
            }
        }
        this.shuffleDrawPile();
    }

    /**
     * 洗牌
     */
    shuffleDrawPile() {
        for (let i = this.drawPile.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.drawPile[i], this.drawPile[j]] = [this.drawPile[j], this.drawPile[i]];
        }
    }

    /**
     * 开始战斗
     */
    startBattle() {
        this.buildDrawPile();
        this.discardPile = [];
        this.hand = [];
        this.energy = this.maxEnergy;
        this.drawCards(this.initialHandSize);
    }

    /**
     * 抽牌
     */
    drawCards(count) {
        for (let i = 0; i < count; i++) {
            if (this.drawPile.length === 0) {
                if (this.discardPile.length === 0) {
                    break; // 没有牌可抽
                }
                // 弃牌堆重新洗牌
                this.drawPile = [...this.discardPile];
                this.discardPile = [];
                this.shuffleDrawPile();
            }

            const card = this.drawPile.pop();
            this.hand.push(card);
        }

        // 限制手牌数量
        if (this.hand.length > this.maxHandSize) {
            const excess = this.hand.length - this.maxHandSize;
            for (let i = 0; i < excess; i++) {
                const card = this.hand.shift();
                this.discardPile.push(card);
            }
        }
    }

    /**
     * 打出卡牌
     */
    playCard(cardIndex) {
        if (cardIndex < 0 || cardIndex >= this.hand.length) {
            return { success: false, error: '卡牌索引无效' };
        }

        const card = this.hand[cardIndex];

        if (this.energy < card.cost) {
            return { success: false, error: '能量不足' };
        }

        // 消耗能量
        this.energy -= card.cost;

        // 从手牌移除
        this.hand.splice(cardIndex, 1);

        // 放入弃牌堆
        this.discardPile.push(card);

        return {
            success: true,
            card,
            effect: this.getCardEffect(card)
        };
    }

    /**
     * 获取卡牌效果
     */
    getCardEffect(card) {
        const effect = {
            type: card.effect,
            card: card
        };

        switch (card.effect) {
            case 'damage':
                effect.damage = card.upgraded ? card.value + 3 : card.value;
                break;
            case 'aoe_damage':
                effect.damage = card.upgraded ? card.value + 2 : card.value;
                effect.aoe = true;
                break;
            case 'block':
                effect.block = card.upgraded ? card.value + 3 : card.value;
                break;
            case 'draw':
                effect.draw = card.upgraded ? card.value + 1 : card.value;
                break;
            case 'damage_debuff':
                effect.damage = card.upgraded ? card.value + 2 : card.value;
                effect.debuff = card.debuff;
                break;
            case 'heal':
                effect.heal = card.value;
                break;
            default:
                effect.custom = true;
        }

        return effect;
    }

    /**
     * 结束回合
     */
    endTurn() {
        // 手牌全部弃掉
        while (this.hand.length > 0) {
            this.discardPile.push(this.hand.pop());
        }

        // 重置能量
        this.energy = this.maxEnergy;

        // 抽取新牌
        this.drawCards(this.initialHandSize);
    }

    /**
     * 获取手牌
     */
    getHand() {
        return this.hand;
    }

    /**
     * 获取抽牌堆数量
     */
    getDrawPileSize() {
        return this.drawPile.length;
    }

    /**
     * 获取弃牌堆数量
     */
    getDiscardPileSize() {
        return this.discardPile.length;
    }

    /**
     * 获取剩余能量
     */
    getEnergy() {
        return this.energy;
    }

    /**
     * 获取卡牌信息
     */
    getCard(cardId) {
        return this.cardLibrary.get(cardId);
    }

    /**
     * 获取所有卡牌
     */
    getAllCards(filter = null) {
        let cards = Array.from(this.cardLibrary.values());

        if (filter) {
            cards = cards.filter(card => {
                if (filter.type && card.type !== filter.type) return false;
                if (filter.rarity && card.rarity !== filter.rarity) return false;
                if (filter.class && card.class !== filter.class) return false;
                if (filter.tags && !filter.tags.some(tag => card.tags.includes(tag))) return false;
                return true;
            });
        }

        return cards;
    }

    /**
     * 添加卡牌到卡组
     */
    addCardToDeck(cardId) {
        const existing = this.playerDeck.find(entry => entry.id === cardId);
        if (existing) {
            existing.count++;
        } else {
            this.playerDeck.push({ id: cardId, count: 1 });
        }
        this.savePlayerDeck();
        return { success: true };
    }

    /**
     * 从卡组移除卡牌
     */
    removeCardFromDeck(cardId) {
        const index = this.playerDeck.findIndex(entry => entry.id === cardId);
        if (index !== -1) {
            this.playerDeck[index].count--;
            if (this.playerDeck[index].count <= 0) {
                this.playerDeck.splice(index, 1);
            }
            this.savePlayerDeck();
            return { success: true };
        }
        return { success: false, error: '卡牌不在卡组中' };
    }

    /**
     * 升级卡牌
     */
    upgradeCard(cardId) {
        const entry = this.playerDeck.find(e => e.id === cardId);
        if (!entry) {
            return { success: false, error: '卡牌不在卡组中' };
        }

        if (entry.upgraded) {
            return { success: false, error: '卡牌已升级' };
        }

        entry.upgraded = true;
        this.savePlayerDeck();
        return { success: true };
    }

    /**
     * 移除卡牌（精简）
     */
    removeCard(cardId) {
        return this.removeCardFromDeck(cardId);
    }

    /**
     * 改变卡牌
     */
    transformCard(fromCardId, toCardId) {
        const entry = this.playerDeck.find(e => e.id === fromCardId);
        if (!entry) {
            return { success: false, error: '源卡牌不在卡组中' };
        }

        if (entry.count > 1) {
            entry.count--;
        } else {
            const index = this.playerDeck.findIndex(e => e.id === fromCardId);
            this.playerDeck.splice(index, 1);
        }

        this.addCardToDeck(toCardId);
        return { success: true };
    }

    /**
     * 获取卡组统计
     */
    getDeckStats() {
        let totalCards = 0;
        let byType = {};
        let byRarity = {};
        let byCost = {};

        for (const entry of this.playerDeck) {
            totalCards += entry.count;
            const card = this.cardLibrary.get(entry.id);

            if (card) {
                byType[card.type] = (byType[card.type] || 0) + entry.count;
                byRarity[card.rarity] = (byRarity[card.rarity] || 0) + entry.count;
                byCost[card.cost] = (byCost[card.cost] || 0) + entry.count;
            }
        }

        return {
            totalCards,
            byType,
            byRarity,
            byCost
        };
    }

    /**
     * 保存系统数据
     */
    async save() {
        await this.savePlayerDeck();
        return {
            deck: this.playerDeck
        };
    }

    /**
     * 加载系统数据
     */
    async load(data) {
        if (data && data.deck) {
            this.playerDeck = data.deck;
        }
    }
}
