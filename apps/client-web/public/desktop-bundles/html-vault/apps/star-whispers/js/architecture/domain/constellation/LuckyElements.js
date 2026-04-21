/**
 * 幸运元素实体 (Lucky Elements)
 * 星座幸运元素数据
 */

export class LuckyElements {
    constructor(data = {}) {
        this.color = data.color || null;
        this.number = data.number || null;
        this.direction = data.direction || null;
        this.time = data.time || null;
        this.item = data.item || null;
        this.flower = data.flower || null;
        this.gem = data.gem || null;
        this.colorHex = data.colorHex || null;
    }

    /**
     * 根据星座获取幸运元素
     */
    static getLuckyBySign(signName) {
        const luckyData = {
            '白羊座': {
                color: '红色',
                colorHex: '#FF4444',
                number: 9,
                direction: '东方',
                time: '早晨',
                item: '钻石',
                flower: '玫瑰',
                gem: '红宝石'
            },
            '金牛座': {
                color: '绿色',
                colorHex: '#4CAF50',
                number: 6,
                direction: '东南',
                time: '下午',
                item: '翡翠',
                flower: '百合',
                gem: '祖母绿'
            },
            '双子座': {
                color: '黄色',
                colorHex: '#FFD700',
                number: 5,
                direction: '西北',
                time: '上午',
                item: '水晶',
                flower: '茉莉',
                gem: '玛瑙'
            },
            '巨蟹座': {
                color: '银白色',
                colorHex: '#C0C0C0',
                number: 2,
                direction: '北方',
                time: '晚间',
                item: '珍珠',
                flower: '睡莲',
                gem: '月光石'
            },
            '狮子座': {
                color: '金色',
                colorHex: '#FFD700',
                number: 1,
                direction: '南方',
                time: '中午',
                item: '黄金',
                flower: '向日葵',
                gem: '红宝石'
            },
            '处女座': {
                color: '米色',
                colorHex: '#F5DEB3',
                number: 5,
                direction: '西南',
                time: '傍晚',
                item: '琥珀',
                flower: '铃兰',
                gem: '蓝宝石'
            },
            '天秤座': {
                color: '粉色',
                colorHex: '#FF69B4',
                number: 6,
                direction: '东方',
                time: '下午',
                item: '玉石',
                flower: '兰花',
                gem: '蛋白石'
            },
            '天蝎座': {
                color: '深红色',
                colorHex: '#8B0000',
                number: 8,
                direction: '北方',
                time: '深夜',
                item: '黑曜石',
                flower: '仙人掌',
                gem: '黄玉'
            },
            '射手座': {
                color: '紫色',
                colorHex: '#9370DB',
                number: 3,
                direction: '西南',
                time: '上午',
                item: '绿松石',
                flower: '康乃馨',
                gem: '紫水晶'
            },
            '摩羯座': {
                color: '黑色',
                colorHex: '#2C2C2C',
                number: 4,
                direction: '南方',
                time: '下午',
                item: '石榴石',
                flower: '梅花',
                gem: '石榴石'
            },
            '水瓶座': {
                color: '蓝色',
                colorHex: '#4169E1',
                number: 7,
                direction: '西北',
                time: '傍晚',
                item: '海蓝宝',
                flower: '满天星',
                gem: '海蓝宝'
            },
            '双鱼座': {
                color: '海蓝色',
                colorHex: '#00CED1',
                number: 7,
                direction: '东南',
                time: '凌晨',
                item: '月光石',
                flower: '水仙',
                gem: '海蓝宝'
            }
        };

        const data = luckyData[signName];
        return data ? new LuckyElements(data) : new LuckyElements();
    }

    /**
     * 转换为JSON
     */
    toJSON() {
        return {
            color: this.color,
            colorHex: this.colorHex,
            number: this.number,
            direction: this.direction,
            time: this.time,
            item: this.item,
            flower: this.flower,
            gem: this.gem
        };
    }
}