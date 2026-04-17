/**
 * 卡牌系统
 * 处理战斗卡牌和卡组管理
 */

class CardSystem {
    constructor() {
        this.initialized = false;
        this.deck = [];
        this.hand = [];
        this.discardPile = [];
        this.energy = 3;
        this.maxEnergy = 3;
        this.cardDatabase = null;
    }

    /**
     * 初始化卡牌系统
     */
    async initialize() {
        try {
            console.log('🃏 卡牌系统初始化中...');

            // 加载卡牌数据库
            await this.loadCardDatabase();

            this.initialized = true;
            console.log('✅ 卡牌系统初始化成功');

            return { success: true };
        } catch (error) {
            console.error('❌ 卡牌系统初始化失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 加载卡牌数据库
     */
    async loadCardDatabase() {
        // 默认卡牌数据库
        this.cardDatabase = {
            attack: {
                name: '攻击',
                type: 'attack',
                cost: 1,
                damage: 6,
                description: '造成6点伤害',
                rarity: 'common'
            },
            defend: {
                name: '防御',
                type: 'skill',
                cost: 1,
                block: 5,
                description: '获得5点护甲',
                rarity: 'common'
            },
            bash: {
                name: '猛击',
                type: 'attack',
                cost: 2,
                damage: 8,
                vulnerable: 2,
                description: '造成8点伤害，施加2层易伤',
                rarity: 'common'
            },
            strike: {
                name: '打击',
                type: 'attack',
                cost: 1,
                damage: 6,
                description: '造成6点伤害',
                rarity: 'common'
            },
            cleave: {
                name: '横扫',
                type: 'attack',
                cost: 1,
                damage: 8,
                target: 'all',
                description: '对所有敌人造成8点伤害',
                rarity: 'uncommon'
            },
            ironWave: {
                name: '铁波',
                type: 'attack',
                cost: 1,
                damage: 5,
                block: 5,
                description: '造成5点伤害，获得5点护甲',
                rarity: 'common'
            },
            pommelStrike: {
                name: '柄击',
                type: 'attack',
                cost: 1,
                damage: 9,
                draw: 1,
                description: '造成9点伤害，抽1张牌',
                rarity: 'uncommon'
            },
            shrugItOff: {
                name: '耸肩',
                type: 'skill',
                cost: 1,
                block: 8,
                draw: 1,
                description: '获得8点护甲，抽1张牌',
                rarity: 'common'
            },
            armaments: {
                name: '武装',
                type: 'skill',
                cost: 1,
                upgradeHand: true,
                description: '手牌中所有攻击牌本回合伤害+2',
                rarity: 'uncommon'
            },
            clothesline: {
                name: '绊摔',
                type: 'attack',
                cost: 2,
                damage: 12,
                weak: 2,
                description: '造成12点伤害，施加2层虚弱',
                rarity: 'common'
            },
            flex: {
                name: '屈膝',
                type: 'skill',
                cost: 0,
                strength: 2,
                description: '获得2点力量，回合结束时失去2点力量',
                rarity: 'common'
            },
            heavyBlow: {
                name: '重击',
                type: 'attack',
                cost: 2,
                damage: 14,
                description: '造成14点伤害',
                rarity: 'uncommon'
            }
        };
    }

    /**
     * 初始化卡组（战斗开始时调用）
     */
    initializeDeck() {
        try {
            // 检查cardDatabase是否存在
            if (!this.cardDatabase) {
                console.warn('⚠️ 卡牌数据库未初始化，使用默认数据库');
                this.loadCardDatabase();
            }

            // 创建基础卡组
            this.deck = [];

            // 添加基础攻击牌（5张）
            for (let i = 0; i < 5; i++) {
                const card = { ...this.cardDatabase.attack, id: `attack_${i}` };
                this.deck.push(card);
            }

            // 添加基础防御牌（4张）
            for (let i = 0; i < 4; i++) {
                const card = { ...this.cardDatabase.defend, id: `defend_${i}` };
                this.deck.push(card);
            }

            // 添加猛击（1张）
            const bashCard = { ...this.cardDatabase.bash, id: 'bash_0' };
            this.deck.push(bashCard);

            // 洗牌
            this.shuffleDeck();

            // 清空手牌和弃牌堆
            this.hand = [];
            this.discardPile = [];

            // 初始抽牌
            this.drawCards(5);

            // 重置能量
            this.energy = this.maxEnergy;

            console.log(`✅ 卡组初始化完成 - ${this.deck.length}张牌`);
            return { success: true };
        } catch (error) {
            console.error('初始化卡组失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 洗牌
     */
    shuffleDeck() {
        // Fisher-Yates 洗牌算法
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    /**
     * 抽牌
     * @param {number} count - 抽牌数量
     */
    drawCards(count) {
        try {
            for (let i = 0; i < count; i++) {
                // 如果牌堆空了，从弃牌堆重新洗牌
                if (this.deck.length === 0) {
                    if (this.discardPile.length === 0) {
                        console.warn('⚠️ 没有牌可抽了');
                        break;
                    }
                    this.deck = [...this.discardPile];
                    this.discardPile = [];
                    this.shuffleDeck();
                    console.log('🔄 重新洗牌');
                }

                // 从牌堆顶抽牌
                const card = this.deck.shift();
                if (card) {
                    this.hand.push(card);
                }
            }

            return { success: true, hand: this.hand };
        } catch (error) {
            console.error('抽牌失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 出牌
     * @param {number} cardIndex - 手牌索引
     */
    playCard(cardIndex) {
        try {
            if (cardIndex < 0 || cardIndex >= this.hand.length) {
                return { success: false, error: '卡牌索引无效' };
            }

            const card = this.hand[cardIndex];

            // 检查能量是否足够
            if (this.energy < card.cost) {
                return { success: false, error: '能量不足' };
            }

            // 消耗能量
            this.energy -= card.cost;

            // 移除手牌到弃牌堆
            this.hand.splice(cardIndex, 1);
            this.discardPile.push(card);

            console.log(`✅ 出牌: ${card.name}`);
            return { success: true, card: card, energy: this.energy };
        } catch (error) {
            console.error('出牌失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 结束回合
     */
    endTurn() {
        try {
            // 将所有手牌放入弃牌堆
            this.discardPile.push(...this.hand);
            this.hand = [];

            // 重置能量
            this.energy = this.maxEnergy;

            console.log('⏸️ 回合结束');
            return { success: true };
        } catch (error) {
            console.error('结束回合失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 开始新回合
     */
    startTurn() {
        try {
            // 抽5张牌
            this.drawCards(5);

            // 重置能量
            this.energy = this.maxEnergy;

            console.log('▶️ 新回合开始');
            return { success: true, energy: this.energy, hand: this.hand };
        } catch (error) {
            console.error('开始新回合失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取手牌信息
     */
    getHand() {
        return [...this.hand];
    }

    /**
     * 获取卡牌信息
     * @param {string} cardId - 卡牌ID
     */
    getCard(cardId) {
        return this.cardDatabase?.[cardId] || null;
    }

    /**
     * 添加卡牌到牌堆
     * @param {string} cardId - 卡牌ID
     */
    addCardToDeck(cardId) {
        try {
            const cardTemplate = this.cardDatabase?.[cardId];
            if (!cardTemplate) {
                return { success: false, error: '卡牌不存在' };
            }

            const card = { ...cardTemplate, id: `${cardId}_${Date.now()}` };
            this.deck.push(card);

            return { success: true, card: card };
        } catch (error) {
            console.error('添加卡牌失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 升级卡牌
     * @param {string} cardId - 卡牌ID
     */
    upgradeCard(cardId) {
        try {
            const cardTemplate = this.cardDatabase?.[cardId];
            if (!cardTemplate) {
                return { success: false, error: '卡牌不存在' };
            }

            // 升级逻辑（简单示例：伤害+3，护甲+3）
            if (cardTemplate.damage) cardTemplate.damage += 3;
            if (cardTemplate.block) cardTemplate.block += 3;

            return { success: true, card: cardTemplate };
        } catch (error) {
            console.error('升级卡牌失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取系统状态
     */
    getState() {
        return {
            deck: this.deck.length,
            hand: this.hand.length,
            discardPile: this.discardPile.length,
            energy: this.energy,
            maxEnergy: this.maxEnergy
        };
    }

    /**
     * 重置系统
     */
    reset() {
        this.deck = [];
        this.hand = [];
        this.discardPile = [];
        this.energy = 3;
        this.maxEnergy = 3;
    }
}

// 创建全局实例
const cardSystem = new CardSystem();

// 导出（用于模块化系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = cardSystem;
} else {
    window.CardSystem = cardSystem;
    window.cardSystem = cardSystem;
}

console.log('✅ 卡牌系统加载完成');
