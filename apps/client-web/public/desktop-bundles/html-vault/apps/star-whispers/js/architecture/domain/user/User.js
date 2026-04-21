/**
 * 用户实体 (User Entity)
 * 核心用户领域对象
 */

import { AgeGroup } from './AgeGroup.js';
import { UserProfile } from './UserProfile.js';

export class User {
    constructor(id, data = {}) {
        this.id = id;
        this.profile = new UserProfile(data.profile || {});
        this.ageGroup = new AgeGroup(data.birthDate);
        this.zodiacSign = this.calculateZodiacSign(data.birthDate);
        this.membership = data.membership || 'free'; // free, vip, svip
        this.createdAt = data.createdAt || new Date();
        this.lastActiveAt = data.lastActiveAt || new Date();
        this.settings = data.settings || this.getDefaultSettings();
        this.stats = data.stats || this.getDefaultStats();
    }

    /**
     * 计算星座
     */
    calculateZodiacSign(birthDate) {
        if (!birthDate) return null;
        const date = new Date(birthDate);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        const zodiacSigns = [
            { name: '摩羯座', start: [1, 1], end: [1, 19] },
            { name: '水瓶座', start: [1, 20], end: [2, 18] },
            { name: '双鱼座', start: [2, 19], end: [3, 20] },
            { name: '白羊座', start: [3, 21], end: [4, 19] },
            { name: '金牛座', start: [4, 20], end: [5, 20] },
            { name: '双子座', start: [5, 21], end: [6, 21] },
            { name: '巨蟹座', start: [6, 22], end: [7, 22] },
            { name: '狮子座', start: [7, 23], end: [8, 22] },
            { name: '处女座', start: [8, 23], end: [9, 22] },
            { name: '天秤座', start: [9, 23], end: [10, 23] },
            { name: '天蝎座', start: [10, 24], end: [11, 22] },
            { name: '射手座', start: [11, 23], end: [12, 21] },
            { name: '摩羯座', start: [12, 22], end: [12, 31] }
        ];

        for (const sign of zodiacSigns) {
            const [startMonth, startDay] = sign.start;
            const [endMonth, endDay] = sign.end;
            
            if ((month === startMonth && day >= startDay) ||
                (month === endMonth && day <= endDay)) {
                return sign.name;
            }
        }
        return '摩羯座'; // 默认
    }

    /**
     * 获取默认设置
     */
    getDefaultSettings() {
        return {
            theme: 'auto', // light, dark, auto
            notifications: true,
            dailyHoroscope: true,
            language: 'zh-CN',
            privacy: {
                showProfile: true,
                showZodiac: true,
                showTestResults: false
            }
        };
    }

    /**
     * 获取默认统计
     */
    getDefaultStats() {
        return {
            testsCompleted: 0,
            tarotReadings: 0,
            baziAnalysis: 0,
            chatMessages: 0,
            daysActive: 0
        };
    }

    /**
     * 判断是否为VIP用户
     */
    isVIP() {
        return this.membership === 'vip' || this.membership === 'svip';
    }

    /**
     * 判断是否为未成年人
     */
    isMinor() {
        return this.ageGroup.getAgeGroup() !== 'adult';
    }

    /**
     * 更新活跃时间
     */
    updateActiveTime() {
        this.lastActiveAt = new Date();
    }

    /**
     * 增加统计计数
     */
    incrementStat(statKey) {
        if (this.stats.hasOwnProperty(statKey)) {
            this.stats[statKey]++;
        }
    }

    /**
     * 转换为JSON
     */
    toJSON() {
        return {
            id: this.id,
            profile: this.profile.toJSON(),
            ageGroup: this.ageGroup.getAgeGroup(),
            zodiacSign: this.zodiacSign,
            membership: this.membership,
            createdAt: this.createdAt,
            lastActiveAt: this.lastActiveAt,
            settings: this.settings,
            stats: this.stats
        };
    }
}