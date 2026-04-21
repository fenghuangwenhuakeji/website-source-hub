/**
 * 星座实体 (Sign)
 * 12星座基础数据和行为
 */

export class Sign {
    static SIGNS = {
        ARIES: { name: '白羊座', symbol: '♈', element: 'fire', dates: [3, 21, 4, 19], ruler: '火星' },
        TAURUS: { name: '金牛座', symbol: '♉', element: 'earth', dates: [4, 20, 5, 20], ruler: '金星' },
        GEMINI: { name: '双子座', symbol: '♊', element: 'air', dates: [5, 21, 6, 21], ruler: '水星' },
        CANCER: { name: '巨蟹座', symbol: '♋', element: 'water', dates: [6, 22, 7, 22], ruler: '月亮' },
        LEO: { name: '狮子座', symbol: '♌', element: 'fire', dates: [7, 23, 8, 22], ruler: '太阳' },
        VIRGO: { name: '处女座', symbol: '♍', element: 'earth', dates: [8, 23, 9, 22], ruler: '水星' },
        LIBRA: { name: '天秤座', symbol: '♎', element: 'air', dates: [9, 23, 10, 23], ruler: '金星' },
        SCORPIO: { name: '天蝎座', symbol: '♏', element: 'water', dates: [10, 24, 11, 22], ruler: '冥王星' },
        SAGITTARIUS: { name: '射手座', symbol: '♐', element: 'fire', dates: [11, 23, 12, 21], ruler: '木星' },
        CAPRICORN: { name: '摩羯座', symbol: '♑', element: 'earth', dates: [12, 22, 1, 19], ruler: '土星' },
        AQUARIUS: { name: '水瓶座', symbol: '♒', element: 'air', dates: [1, 20, 2, 18], ruler: '天王星' },
        PISCES: { name: '双鱼座', symbol: '♓', element: 'water', dates: [2, 19, 3, 20], ruler: '海王星' }
    };

    static ELEMENTS = {
        fire: { name: '火象', traits: ['热情', '活力', '冲动'] },
        earth: { name: '土象', traits: ['务实', '稳重', '踏实'] },
        air: { name: '风象', traits: ['聪明', '社交', '多变'] },
        water: { name: '水象', traits: ['敏感', '直觉', '情感'] }
    };

    constructor(signName) {
        const signData = this.getSignData(signName);
        if (!signData) {
            throw new Error(`Unknown sign: ${signName}`);
        }
        
        this.name = signData.name;
        this.symbol = signData.symbol;
        this.element = signData.element;
        this.dates = signData.dates;
        this.ruler = signData.ruler;
    }

    /**
     * 获取星座数据
     */
    getSignData(signName) {
        for (const key in Sign.SIGNS) {
            if (Sign.SIGNS[key].name === signName) {
                return Sign.SIGNS[key];
            }
        }
        return null;
    }

    /**
     * 获取元素属性
     */
    getElementInfo() {
        return Sign.ELEMENTS[this.element];
    }

    /**
     * 获取星座关键词
     */
    getKeywords() {
        const keywords = {
            '白羊座': ['勇敢', '直接', '竞争力', '冲动', '领导力'],
            '金牛座': ['稳定', '耐心', '物质', '固执', '享乐'],
            '双子座': ['好奇', '沟通', '多变', '机智', '学习'],
            '巨蟹座': ['家庭', '情感', '保护', '敏感', '记忆'],
            '狮子座': ['自信', '创造', '戏剧性', '慷慨', '骄傲'],
            '处女座': ['分析', '完美', '服务', '批评', '细节'],
            '天秤座': ['平衡', '关系', '美学', '犹豫', '外交'],
            '天蝎座': ['深刻', '神秘', '转化', '嫉妒', '力量'],
            '射手座': ['自由', '哲学', '乐观', '鲁莽', '探索'],
            '摩羯座': ['责任', '成就', '纪律', '悲观', '传统'],
            '水瓶座': ['独立', '创新', '人道', '叛逆', '疏离'],
            '双鱼座': ['直觉', '想象', '同情', '逃避', '灵性']
        };
        return keywords[this.name] || [];
    }

    /**
     * 根据日期获取星座
     */
    static getSignByDate(month, day) {
        for (const key in Sign.SIGNS) {
            const sign = Sign.SIGNS[key];
            const [startMonth, startDay, endMonth, endDay] = sign.dates;
            
            if (startMonth > endMonth) {
                // 处理跨年的星座(摩羯座)
                if ((month === startMonth && day >= startDay) ||
                    (month === endMonth && day <= endDay)) {
                    return new Sign(sign.name);
                }
            } else {
                if ((month === startMonth && day >= startDay) ||
                    (month === endMonth && day <= endDay)) {
                    return new Sign(sign.name);
                }
            }
        }
        return null;
    }

    /**
     * 获取所有星座
     */
    static getAllSigns() {
        return Object.values(Sign.SIGNS).map(s => new Sign(s.name));
    }

    /**
     * 转换为JSON
     */
    toJSON() {
        return {
            name: this.name,
            symbol: this.symbol,
            element: this.element,
            elementInfo: this.getElementInfo(),
            dates: this.dates,
            ruler: this.ruler,
            keywords: this.getKeywords()
        };
    }
}