/**
 * 星盘实体 (AstroChart)
 * 西洋占星命盘数据
 */

export class AstroChart {
    static PLANETS = {
        SUN: 'sun',
        MOON: 'moon',
        MERCURY: 'mercury',
        VENUS: 'venus',
        MARS: 'mars',
        JUPITER: 'jupiter',
        SATURN: 'saturn',
        URANUS: 'uranus',
        NEPTUNE: 'neptune',
        PLUTO: 'pluto'
    };

    static PLANET_NAMES = {
        sun: '太阳',
        moon: '月亮',
        mercury: '水星',
        venus: '金星',
        mars: '火星',
        jupiter: '木星',
        saturn: '土星',
        uranus: '天王星',
        neptune: '海王星',
        pluto: '冥王星'
    };

    static HOUSES = 12; // 十二宫位

    static ASPECTS = {
        CONJUNCTION: { name: '合相', angle: 0, symbol: '☌' },
        SEXTILE: { name: '六合', angle: 60, symbol: '⚹' },
        SQUARE: { name: '刑相', angle: 90, symbol: '◻' },
        TRINE: { name: '三合', angle: 120, symbol: '△' },
        OPPOSITION: { name: '冲相', angle: 180, symbol: '☍' }
    };

    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.userId = data.userId || null;
        this.birthDate = data.birthDate ? new Date(data.birthDate) : null;
        this.birthTime = data.birthTime || null;
        this.birthLocation = data.birthLocation || null;
        this.latitude = data.latitude || null;
        this.longitude = data.longitude || null;
        
        // 行星位置
        this.planets = data.planets || {};
        
        // 宫位
        this.houses = data.houses || [];
        
        // 相位
        this.aspects = data.aspects || [];
        
        // 三巨头
        this.sunSign = data.sunSign || null;
        this.moonSign = data.moonSign || null;
        this.risingSign = data.risingSign || null;
        
        // 分析报告
        this.analysis = data.analysis || null;
        
        this.createdAt = data.createdAt || new Date();
    }

    /**
     * 生成ID
     */
    generateId() {
        return 'astro_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 设置行星位置
     */
    setPlanet(planet, sign, degree, house) {
        this.planets[planet] = { sign, degree, house };
    }

    /**
     * 获取行星位置
     */
    getPlanet(planet) {
        return this.planets[planet] || null;
    }

    /**
     * 获取三巨头信息
     */
    getBigThree() {
        return {
            sun: { sign: this.sunSign, description: '核心自我、生命力' },
            moon: { sign: this.moonSign, description: '情感、内在需求、安全感' },
            rising: { sign: this.risingSign, description: '外在形象、第一印象' }
        };
    }

    /**
     * 获取行星所在宫位
     */
    getPlanetsInHouse(houseNumber) {
        return Object.entries(this.planets)
            .filter(([_, pos]) => pos.house === houseNumber)
            .map(([planet, pos]) => ({ planet, ...pos }));
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
            birthLocation: this.birthLocation,
            sunSign: this.sunSign,
            moonSign: this.moonSign,
            risingSign: this.risingSign,
            bigThree: this.getBigThree(),
            planets: this.planets,
            houses: this.houses,
            aspects: this.aspects,
            analysis: this.analysis,
            createdAt: this.createdAt
        };
    }
}