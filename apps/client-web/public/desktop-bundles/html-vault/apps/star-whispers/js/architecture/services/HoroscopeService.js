/**
 * 星座运势服务 (HoroscopeService)
 * 提供运势计算、配对分析等功能
 */

import { Sign } from '../domain/constellation/Sign.js';
import { Horoscope } from '../domain/constellation/Horoscope.js';
import { Compatibility } from '../domain/constellation/Compatibility.js';
import { LuckyElements } from '../domain/constellation/LuckyElements.js';

export class HoroscopeService {
    constructor() {
        this.cache = new Map();
    }

    /**
     * 获取所有星座
     */
    getAllSigns() {
        return Sign.getAllSigns();
    }

    /**
     * 根据日期获取星座
     */
    getSignByDate(month, day) {
        return Sign.getSignByDate(month, day);
    }

    /**
     * 获取运势
     */
    getHoroscope(signName, period = 'today') {
        const cacheKey = `${signName}_${period}_${this.getDateKey(period)}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const horoscope = new Horoscope({
            sign: signName,
            period: period,
            scores: this.generateScores(signName),
            lucky: LuckyElements.getLuckyBySign(signName)
        });

        this.cache.set(cacheKey, horoscope);
        return horoscope;
    }

    /**
     * 生成运势分数
     */
    generateScores(signName) {
        // 使用日期作为种子生成伪随机数
        const seed = this.getSeed(signName);
        return {
            comprehensive: this.seededRandom(seed, 60, 100),
            love: this.seededRandom(seed + 1, 60, 100),
            career: this.seededRandom(seed + 2, 60, 100),
            wealth: this.seededRandom(seed + 3, 60, 100),
            health: this.seededRandom(seed + 4, 60, 100),
            study: this.seededRandom(seed + 5, 60, 100)
        };
    }

    /**
     * 获取种子
     */
    getSeed(signName) {
        const signs = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座',
                      '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
        const signIndex = signs.indexOf(signName);
        const today = new Date();
        return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate() + signIndex * 1000;
    }

    /**
     * 带种子的随机数
     */
    seededRandom(seed, min, max) {
        const x = Math.sin(seed) * 10000;
        const random = x - Math.floor(x);
        return Math.floor(random * (max - min + 1)) + min;
    }

    /**
     * 获取日期键
     */
    getDateKey(period) {
        const today = new Date();
        switch (period) {
            case 'today':
                return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                return `${weekStart.getFullYear()}-${weekStart.getMonth() + 1}-${weekStart.getDate()}`;
            case 'month':
                return `${today.getFullYear()}-${today.getMonth() + 1}`;
            default:
                return `${today.getFullYear()}`;
        }
    }

    /**
     * 获取配对分析
     */
    getCompatibility(sign1, sign2, type = 'love') {
        const compatibility = new Compatibility(sign1, sign2, type);
        compatibility.adjustForType();
        return compatibility;
    }

    /**
     * 获取幸运元素
     */
    getLuckyElements(signName) {
        return LuckyElements.getLuckyBySign(signName);
    }
}