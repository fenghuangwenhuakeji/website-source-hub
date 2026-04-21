/**
 * 塔罗牌阵实体 (TarotSpread)
 * 定义各种牌阵
 */

export class TarotSpread {
    static TYPES = {
        SINGLE: 'single',           // 单张牌阵
        THREE: 'three',             // 三张牌阵
        CELTIC: 'celtic',           // 凯尔特十字
        RELATIONSHIP: 'relationship', // 关系牌阵
        DECISION: 'decision',       // 决策牌阵
        LOVE: 'love',              // 爱情牌阵
        CAREER: 'career',          // 事业牌阵
        HOROSCOPE: 'horoscope'     // 黄道十二宫牌阵
    };

    // 预定义牌阵
    static SPREADS = {
        single: {
            name: '单张指引',
            cardCount: 1,
            positions: [{ name: '现状', description: '当前的指引和建议' }],
            difficulty: 'easy',
            description: '简单直接的指引，适合日常问题'
        },
        three: {
            name: '时间之流',
            cardCount: 3,
            positions: [
                { name: '过去', description: '影响当前情况的因素' },
                { name: '现在', description: '当前的状况和挑战' },
                { name: '未来', description: '可能的发展方向' }
            ],
            difficulty: 'easy',
            description: '经典三牌阵，解读过去、现在、未来'
        },
        relationship: {
            name: '关系牌阵',
            cardCount: 7,
            positions: [
                { name: '你的现状', description: '你在关系中的状态' },
                { name: '对方现状', description: '对方在关系中的状态' },
                { name: '你的需求', description: '你在关系中需要什么' },
                { name: '对方需求', description: '对方在关系中需要什么' },
                { name: '关系优势', description: '这段关系的优势' },
                { name: '关系挑战', description: '这段关系面临的挑战' },
                { name: '未来走向', description: '关系可能的未来发展' }
            ],
            difficulty: 'medium',
            description: '深入了解两人之间的关系动态'
        },
        celtic: {
            name: '凯尔特十字',
            cardCount: 10,
            positions: [
                { name: '现状', description: '你当前的处境' },
                { name: '挑战', description: '你面临的主要挑战' },
                { name: '潜意识', description: '你的深层动机' },
                { name: '过去', description: '已经过去的影响' },
                { name: '意识', description: '你的目标和想法' },
                { name: '近期未来', description: '即将发生的事' },
                { name: '你的态度', description: '你对问题的态度' },
                { name: '外部影响', description: '环境和他人的影响' },
                { name: '希望与恐惧', description: '你的期待和担忧' },
                { name: '最终结果', description: '最可能的结局' }
            ],
            difficulty: 'hard',
            description: '最经典的塔罗牌阵，全方位解读'
        },
        decision: {
            name: '决策牌阵',
            cardCount: 5,
            positions: [
                { name: '当前情况', description: '你的现状' },
                { name: '选择A', description: '第一个选择的影响' },
                { name: '选择B', description: '第二个选择的影响' },
                { name: '建议', description: '塔罗给出的建议' },
                { name: '可能结果', description: '最终可能的结果' }
            ],
            difficulty: 'medium',
            description: '帮助你在两个选择之间做出决定'
        },
        love: {
            name: '爱情牌阵',
            cardCount: 6,
            positions: [
                { name: '你的爱情观', description: '你对爱情的看法' },
                { name: '当前状态', description: '感情生活的现状' },
                { name: '阻碍', description: '阻碍你找到爱情的因素' },
                { name: '助力', description: '帮助你的因素' },
                { name: '近期发展', description: '近期可能发生的事' },
                { name: '建议', description: '塔罗的建议' }
            ],
            difficulty: 'medium',
            description: '专门针对感情问题的牌阵'
        }
    };

    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.type = data.type || TarotSpread.TYPES.SINGLE;
        this.name = data.name || '未命名牌阵';
        this.cardCount = data.cardCount || 1;
        this.positions = data.positions || [];
        this.difficulty = data.difficulty || 'easy';
        this.description = data.description || '';
        this.isFree = data.isFree !== undefined ? data.isFree : true;
    }

    /**
     * 生成ID
     */
    generateId() {
        return 'spread_' + Date.now();
    }

    /**
     * 根据类型获取牌阵
     */
    static getSpreadByType(type) {
        const spreadData = TarotSpread.SPREADS[type];
        if (!spreadData) return null;
        
        return new TarotSpread({
            type: type,
            name: spreadData.name,
            cardCount: spreadData.cardCount,
            positions: spreadData.positions,
            difficulty: spreadData.difficulty,
            description: spreadData.description
        });
    }

    /**
     * 获取所有牌阵
     */
    static getAllSpreads() {
        return Object.keys(TarotSpread.SPREADS).map(type => 
            TarotSpread.getSpreadByType(type)
        );
    }

    /**
     * 获取位置含义
     */
    getPositionMeaning(positionIndex) {
        return this.positions[positionIndex] || null;
    }

    /**
     * 转换为JSON
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            cardCount: this.cardCount,
            positions: this.positions,
            difficulty: this.difficulty,
            description: this.description,
            isFree: this.isFree
        };
    }
}