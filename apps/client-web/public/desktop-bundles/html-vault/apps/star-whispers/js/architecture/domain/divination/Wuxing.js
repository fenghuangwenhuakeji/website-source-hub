/**
 * 五行实体 (Wuxing)
 * 金木水火土五行系统
 */

export class Wuxing {
    static ELEMENTS = {
        METAL: 'metal',   // 金
        WOOD: 'wood',     // 木
        WATER: 'water',   // 水
        FIRE: 'fire',     // 火
        EARTH: 'earth'    // 土
    };

    static CHINESE_NAMES = {
        metal: '金',
        wood: '木',
        water: '水',
        fire: '火',
        earth: '土'
    };

    // 五行相生
    static GENERATING = {
        metal: 'water',   // 金生水
        water: 'wood',    // 水生木
        wood: 'fire',     // 木生火
        fire: 'earth',    // 火生土
        earth: 'metal'    // 土生金
    };

    // 五行相克
    static OVERCOMING = {
        metal: 'wood',    // 金克木
        wood: 'earth',    // 木克土
        earth: 'water',   // 土克水
        water: 'fire',    // 水克火
        fire: 'metal'     // 火克金
    };

    // 天干对应五行
    static TIANGAN_WUXING = {
        '甲': 'wood', '乙': 'wood',
        '丙': 'fire', '丁': 'fire',
        '戊': 'earth', '己': 'earth',
        '庚': 'metal', '辛': 'metal',
        '壬': 'water', '癸': 'water'
    };

    // 地支对应五行
    static DIZHI_WUXING = {
        '子': 'water', '丑': 'earth',
        '寅': 'wood', '卯': 'wood',
        '辰': 'earth', '巳': 'fire',
        '午': 'fire', '未': 'earth',
        '申': 'metal', '酉': 'metal',
        '戌': 'earth', '亥': 'water'
    };

    constructor(element) {
        this.element = element;
        this.chineseName = Wuxing.CHINESE_NAMES[element];
    }

    /**
     * 获取生我的元素(被生)
     */
    getGeneratedBy() {
        for (const [k, v] of Object.entries(Wuxing.GENERATING)) {
            if (v === this.element) return k;
        }
        return null;
    }

    /**
     * 获取我生的元素
     */
    getGenerates() {
        return Wuxing.GENERATING[this.element];
    }

    /**
     * 获取克我的元素(被克)
     */
    getOvercomeBy() {
        for (const [k, v] of Object.entries(Wuxing.OVERCOMING)) {
            if (v === this.element) return k;
        }
        return null;
    }

    /**
     * 获取我克的元素
     */
    getOvercomes() {
        return Wuxing.OVERCOMING[this.element];
    }

    /**
     * 根据天干获取五行
     */
    static getFromTiangan(tiangan) {
        return Wuxing.TIANGAN_WUXING[tiangan] || null;
    }

    /**
     * 根据地支获取五行
     */
    static getFromDizhi(dizhi) {
        return Wuxing.DIZHI_WUXING[dizhi] || null;
    }

    /**
     * 计算八字五行数量
     */
    static countElements(bazi) {
        const count = { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 };
        
        // 遍历四柱
        ['year', 'month', 'day', 'hour'].forEach(pillar => {
            const { tiangan, dizhi } = bazi.pillars[pillar];
            if (tiangan) {
                const element = Wuxing.getFromTiangan(tiangan);
                if (element) count[element]++;
            }
            if (dizhi) {
                const element = Wuxing.getFromDizhi(dizhi);
                if (element) count[element]++;
            }
        });
        
        return count;
    }

    /**
     * 转换为JSON
     */
    toJSON() {
        return {
            element: this.element,
            chineseName: this.chineseName,
            generates: this.getGenerates(),
            generatedBy: this.getGeneratedBy(),
            overcomes: this.getOvercomes(),
            overcomeBy: this.getOvercomeBy()
        };
    }
}