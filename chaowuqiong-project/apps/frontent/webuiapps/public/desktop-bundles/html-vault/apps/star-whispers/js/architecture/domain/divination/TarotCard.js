/**
 * 塔罗牌实体 (TarotCard)
 * 78张塔罗牌的定义
 */

export class TarotCard {
    static ARCANA = {
        MAJOR: 'major',  // 大阿尔卡纳 (22张)
        MINOR: 'minor'   // 小阿尔卡纳 (56张)
    };

    static SUITS = {
        WANDS: 'wands',       // 权杖 (火元素)
        CUPS: 'cups',         // 圣杯 (水元素)
        SWORDS: 'swords',     // 宝剑 (风元素)
        PENTACLES: 'pentacles' // 金币/星币 (土元素)
    };

    // 大阿尔卡纳 22张
    static MAJOR_ARCANA = [
        { number: 0, name: '愚者', english: 'The Fool', keywords: ['新开始', '冒险', '纯真', '自由'] },
        { number: 1, name: '魔术师', english: 'The Magician', keywords: ['创造力', '意志力', '技能', '自信'] },
        { number: 2, name: '女祭司', english: 'The High Priestess', keywords: ['直觉', '神秘', '潜意识', '智慧'] },
        { number: 3, name: '女皇', english: 'The Empress', keywords: ['丰饶', '母性', '创造', '自然'] },
        { number: 4, name: '皇帝', english: 'The Emperor', keywords: ['权威', '结构', '控制', '父亲'] },
        { number: 5, name: '教皇', english: 'The Hierophant', keywords: ['传统', '教导', '信仰', '仪式'] },
        { number: 6, name: '恋人', english: 'The Lovers', keywords: ['爱情', '选择', '和谐', '价值观'] },
        { number: 7, name: '战车', english: 'The Chariot', keywords: ['胜利', '决心', '控制', '意志力'] },
        { number: 8, name: '力量', english: 'Strength', keywords: ['勇气', '耐心', '内在力量', '慈悲'] },
        { number: 9, name: '隐士', english: 'The Hermit', keywords: ['内省', '寻求', '指导', '独处'] },
        { number: 10, name: '命运之轮', english: 'Wheel of Fortune', keywords: ['命运', '转变', '循环', '机遇'] },
        { number: 11, name: '正义', english: 'Justice', keywords: ['公正', '真理', '因果', '平衡'] },
        { number: 12, name: '倒吊人', english: 'The Hanged Man', keywords: ['牺牲', '等待', '新视角', '放下'] },
        { number: 13, name: '死神', english: 'Death', keywords: ['结束', '转变', '重生', '放下过去'] },
        { number: 14, name: '节制', english: 'Temperance', keywords: ['平衡', '耐心', '调和', '适度'] },
        { number: 15, name: '恶魔', english: 'The Devil', keywords: ['束缚', '欲望', '物质', '诱惑'] },
        { number: 16, name: '塔', english: 'The Tower', keywords: ['突变', '毁灭', '觉醒', '解放'] },
        { number: 17, name: '星星', english: 'The Star', keywords: ['希望', '灵感', '宁静', '信念'] },
        { number: 18, name: '月亮', english: 'The Moon', keywords: ['幻觉', '恐惧', '潜意识', '直觉'] },
        { number: 19, name: '太阳', english: 'The Sun', keywords: ['成功', '快乐', '活力', '光明'] },
        { number: 20, name: '审判', english: 'Judgement', keywords: ['觉醒', '重生', '召唤', '反思'] },
        { number: 21, name: '世界', english: 'The World', keywords: ['完成', '整合', '成就', '圆满'] }
    ];

    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.arcana = data.arcana || TarotCard.ARCANA.MAJOR;
        this.number = data.number || 0;
        this.name = data.name || '';
        this.english = data.english || '';
        this.suit = data.suit || null;
        this.keywords = data.keywords || [];
        this.uprightMeaning = data.uprightMeaning || '';
        this.reversedMeaning = data.reversedMeaning || '';
        this.description = data.description || '';
        this.element = data.element || this.getElementBySuit(data.suit);
        this.imageUrl = data.imageUrl || null;
    }

    /**
     * 生成ID
     */
    generateId() {
        return 'tarot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }

    /**
     * 根据花色获取元素
     */
    getElementBySuit(suit) {
        const elements = {
            wands: 'fire',
            cups: 'water',
            swords: 'air',
            pentacles: 'earth'
        };
        return elements[suit] || null;
    }

    /**
     * 获取正位含义
     */
    getUprightMeaning() {
        return {
            keywords: this.keywords,
            description: this.uprightMeaning
        };
    }

    /**
     * 获取逆位含义
     */
    getReversedMeaning() {
        return {
            keywords: this.keywords.map(k => k + '(受阻)'),
            description: this.reversedMeaning
        };
    }

    /**
     * 获取完整信息
     */
    getFullInfo() {
        return {
            id: this.id,
            arcana: this.arcana,
            number: this.number,
            name: this.name,
            english: this.english,
            suit: this.suit,
            element: this.element,
            keywords: this.keywords,
            upright: this.getUprightMeaning(),
            reversed: this.getReversedMeaning(),
            description: this.description,
            imageUrl: this.imageUrl
        };
    }

    /**
     * 转换为JSON
     */
    toJSON() {
        return {
            id: this.id,
            arcana: this.arcana,
            number: this.number,
            name: this.name,
            english: this.english,
            suit: this.suit,
            keywords: this.keywords,
            uprightMeaning: this.uprightMeaning,
            reversedMeaning: this.reversedMeaning
        };
    }
}