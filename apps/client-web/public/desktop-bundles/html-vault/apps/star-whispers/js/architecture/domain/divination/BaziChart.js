/**
 * 八字命盘实体 (BaziChart)
 * 四柱八字数据结构
 */

export class BaziChart {
    static PILLARS = {
        YEAR: 'year',     // 年柱
        MONTH: 'month',   // 月柱
        DAY: 'day',       // 日柱
        HOUR: 'hour'      // 时柱
    };

    static TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    static DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.userId = data.userId || null;
        this.birthDate = data.birthDate ? new Date(data.birthDate) : null;
        this.birthTime = data.birthTime || null;
        this.birthLocation = data.birthLocation || null;
        this.gender = data.gender || null;
        
        // 四柱八字
        this.pillars = data.pillars || {
            year: { tiangan: null, dizhi: null },
            month: { tiangan: null, dizhi: null },
            day: { tiangan: null, dizhi: null },
            hour: { tiangan: null, dizhi: null }
        };
        
        // 五行分析
        this.wuxing = data.wuxing || {
            metal: 0,
            wood: 0,
            water: 0,
            fire: 0,
            earth: 0
        };
        
        // 十神
        this.shishen = data.shishen || {};
        
        // 大运
        this.dayun = data.dayun || [];
        
        // 分析结果
        this.analysis = data.analysis || null;
        
        this.createdAt = data.createdAt || new Date();
    }

    /**
     * 生成ID
     */
    generateId() {
        return 'bazi_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 设置柱
     */
    setPillar(pillarType, tiangan, dizhi) {
        if (this.pillars.hasOwnProperty(pillarType)) {
            this.pillars[pillarType] = { tiangan, dizhi };
        }
    }

    /**
     * 获取八字字符串
     */
    getBaziString() {
        const pillars = ['year', 'month', 'day', 'hour'];
        return pillars.map(p => {
            const pillar = this.pillars[p];
            return pillar.tiangan + pillar.dizhi;
        }).join(' ');
    }

    /**
     * 获取日主(日干)
     */
    getDayMaster() {
        return this.pillars.day.tiangan;
    }

    /**
     * 获取五行缺失
     */
    getMissingElements() {
        const missing = [];
        const elements = ['metal', 'wood', 'water', 'fire', 'earth'];
        elements.forEach(e => {
            if (this.wuxing[e] === 0) {
                missing.push(e);
            }
        });
        return missing;
    }

    /**
     * 获取五行旺衰
     */
    getElementStrength() {
        const sorted = Object.entries(this.wuxing)
            .sort((a, b) => b[1] - a[1]);
        return sorted.map(([element, count]) => ({
            element,
            count,
            level: this.getStrengthLevel(count)
        }));
    }

    /**
     * 获取强度等级
     */
    getStrengthLevel(count) {
        if (count >= 3) return 'strong';
        if (count >= 2) return 'medium';
        if (count >= 1) return 'weak';
        return 'missing';
    }

    /**
     * 转换为JSON
     */
    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            birthDate: this.birthDate,
            birthTime: this.birthTime,
            gender: this.gender,
            bazi: this.getBaziString(),
            pillars: this.pillars,
            wuxing: this.wuxing,
            missingElements: this.getMissingElements(),
            elementStrength: this.getElementStrength(),
            dayun: this.dayun,
            analysis: this.analysis,
            createdAt: this.createdAt
        };
    }
}