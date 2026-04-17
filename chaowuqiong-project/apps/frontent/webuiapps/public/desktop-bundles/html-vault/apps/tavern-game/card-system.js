// ========== 卡牌系统 ==========

class CardSystem {
    constructor() {
        this.deck = [];
        this.hand = [];
        this.discardPile = [];
        this.maxHandSize = 5;
        this.isInitialized = false;
    }

    // 初始化卡牌系统
    init() {
        this.initializeDeck();
        this.isInitialized = true;
    }

    // 初始化卡组
    initializeDeck() {
        // 根据玩家职业添加基础卡牌
        const classCards = this.getClassCards(game.player.class);
        classCards.forEach(cardId => {
            this.deck.push({ id: cardId });
        });

        // 添加通用卡牌
        const commonCards = ['slash_card', 'defend', 'heal_card'];
        commonCards.forEach(cardId => {
            this.deck.push({ id: cardId });
        });

        // 洗牌
        this.shuffleDeck();
    }

    // 获取职业卡牌
    getClassCards(playerClass) {
        const classCards = {
            warrior: ['slash_card', 'defend', 'heavy_strike'],
            mage: ['fireball_card', 'ice_blast', 'magic'],
            rogue: ['double_strike', 'backstab'],
            priest: ['heal_card', 'bless'],
            archer: ['aimed_shot', 'rain_arrows']
        };

        return classCards[playerClass] || classCards.warrior;
    }

    // 洗牌
    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    // 抽卡
    drawCard() {
        if (this.deck.length === 0) {
            // 将弃牌堆洗入卡组
            this.deck = [...this.discardPile];
            this.discardPile = [];
            this.shuffleDeck();
        }

        if (this.deck.length === 0) {
            return null; // 没有卡牌可抽
        }

        if (this.hand.length >= this.maxHandSize) {
            return null; // 手牌已满
        }

        const card = this.deck.pop();
        this.hand.push(card);
        audioSystem.playSound('item');

        return card;
    }

    // 初始抽卡
    initialDraw() {
        for (let i = 0; i < 3; i++) {
            this.drawCard();
        }
    }

    // 打出卡牌
    playCard(cardIndex) {
        if (cardIndex < 0 || cardIndex >= this.hand.length) {
            return null;
        }

        const card = this.hand[cardIndex];
        this.hand.splice(cardIndex, 1);
        this.discardPile.push(card);

        return card;
    }

    // 移除卡牌
    removeCard(card) {
        const index = this.hand.findIndex(c => c.id === card.id);
        if (index !== -1) {
            this.hand.splice(index, 1);
            this.discardPile.push(card);
        }
    }

    // 获取手牌
    getHandCards() {
        return this.hand.map(card => ({
            ...card,
            data: GameData.cards[card.id]
        }));
    }

    // 添加卡牌到卡组
    addCardToDeck(cardId) {
        this.deck.push({ id: cardId });
    }

    // 移除卡牌从卡组
    removeCardFromDeck(cardId) {
        const index = this.deck.findIndex(c => c.id === cardId);
        if (index !== -1) {
            this.deck.splice(index, 1);
        }
    }

    // 获取所有卡牌
    getAllCards() {
        return Object.values(GameData.cards);
    }

    // 按类型获取卡牌
    getCardsByType(type) {
        return Object.values(GameData.cards).filter(card => card.type === type);
    }

    // 渲染卡牌收藏
    renderCardCollection(filterType = 'all') {
        const cardGrid = document.getElementById('card-grid');
        if (!cardGrid) return;

        cardGrid.innerHTML = '';

        const allCards = this.getAllCards();
        const filteredCards = filterType === 'all' 
            ? allCards 
            : allCards.filter(card => card.type === filterType);

        filteredCards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'collection-card';
            cardElement.innerHTML = `
                <div class="card-count">x${this.getCardCount(card.id)}</div>
                <div class="card-icon">${card.icon}</div>
                <div class="card-name">${card.name}</div>
                <div class="card-type">${card.type}</div>
            `;
            
            // 根据稀有度设置样式
            const rarityColors = {
                common: 'linear-gradient(135deg, #a8e6cf, #dcedc1)',
                rare: 'linear-gradient(135deg, #74b9ff, #0984e3)',
                epic: 'linear-gradient(135deg, #f093fb, #f5576c)',
                legendary: 'linear-gradient(135deg, #ffeaa7, #fdcb6e)'
            };
            cardElement.style.background = rarityColors[card.rarity] || rarityColors.common;

            cardGrid.appendChild(cardElement);
        });
    }

    // 获取卡牌数量
    getCardCount(cardId) {
        let count = 0;
        count += this.deck.filter(c => c.id === cardId).length;
        count += this.hand.filter(c => c.id === cardId).length;
        count += this.discardPile.filter(c => c.id === cardId).length;
        return count;
    }

    // 重置战斗手牌
    resetBattleHand() {
        // 将手牌和弃牌堆放回卡组
        this.deck = [...this.deck, ...this.hand, ...this.discardPile];
        this.hand = [];
        this.discardPile = [];
        this.shuffleDeck();
        this.initialDraw();
    }
}

// 创建全局卡牌系统实例
const cardSystem = new CardSystem();
