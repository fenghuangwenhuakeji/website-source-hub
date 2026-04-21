/**
 * 八字计算器 - Bazi Calculator
 * 计算四柱八字、十神、大运等
 */

export class BaziCalculator {
    constructor() {
        // 天干
        this.tianGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
        
        // 地支
        this.diZhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
        
        // 天干五行
        this.tianGanWuxing = {
            '甲': '木', '乙': '木',
            '丙': '火', '丁': '火',
            '戊': '土', '己': '土',
            '庚': '金', '辛': '金',
            '壬': '水', '癸': '水'
        };
        
        // 地支五行
        this.diZhiWuxing = {
            '子': '水', '丑': '土',
            '寅': '木', '卯': '木', '辰': '土',
            '巳': '火', '午': '火', '未': '土',
            '申': '金', '酉': '金', '戌': '土',
            '亥': '水'
        };
        
        // 地支藏干
        this.diZhiCangGan = {
            '子': ['癸'],
            '丑': ['己', '癸', '辛'],
            '寅': ['甲', '丙', '戊'],
            '卯': ['乙'],
            '辰': ['戊', '乙', '癸'],
            '巳': ['丙', '庚', '戊'],
            '午': ['丁', '己'],
            '未': ['己', '丁', '乙'],
            '申': ['庚', '壬', '戊'],
            '酉': ['辛'],
            '戌': ['戊', '辛', '丁'],
            '亥': ['壬', '甲']
        };
        
        // 十神
        this.tenGods = [
            '比肩', '劫财',  // 同类
            '食神', '伤官',  // 我生
            '正财', '偏财',  // 我克
            '正官', '七杀',  // 克我
            '正印', '偏印'   // 生我
        ];
        
        // 节气数据（简化版，实际应使用完整的天文计算）
        this.solarTerms = this.initSolarTerms();
    }

    /**
     * 初始化节气数据
     */
    initSolarTerms() {
        // 24节气名称
        return [
            '立春', '雨水', '惊蛰', '春分',
            '清明', '谷雨', '立夏', '小满',
            '芒种', '夏至', '小暑', '大暑',
            '立秋', '处暑', '白露', '秋分',
            '寒露', '霜降', '立冬', '小雪',
            '大雪', '冬至', '小寒', '大寒'
        ];
    }

    /**
     * 计算四柱
     */
    calculateFourPillars(birthInfo) {
        const { year, month, day, hour, minute = 0, isLunar = false } = birthInfo;
        
        // 如果是农历，先转换为公历（这里简化处理）
        let solarDate = isLunar ? this.lunarToSolar(year, month, day) : { year, month, day };
        
        // 计算年柱
        const yearPillar = this.calculateYearPillar(solarDate.year);
        
        // 计算月柱
        const monthPillar = this.calculateMonthPillar(solarDate.year, solarDate.month);
        
        // 计算日柱
        const dayPillar = this.calculateDayPillar(solarDate.year, solarDate.month, solarDate.day);
        
        // 计算时柱
        const hourPillar = this.calculateHourPillar(dayPillar.gan, hour);

        return {
            year: yearPillar,
            month: monthPillar,
            day: dayPillar,
            hour: hourPillar,
            summary: `${yearPillar.gan}${yearPillar.zhi}年 ${monthPillar.gan}${monthPillar.zhi}月 ${dayPillar.gan}${dayPillar.zhi}日 ${hourPillar.gan}${hourPillar.zhi}时`
        };
    }

    /**
     * 计算年柱
     */
    calculateYearPillar(year) {
        // 以立春为分界点
        const ganIndex = (year - 4) % 10;
        const zhiIndex = (year - 4) % 12;
        
        const gan = this.tianGan[ganIndex < 0 ? ganIndex + 10 : ganIndex];
        const zhi = this.diZhi[zhiIndex < 0 ? zhiIndex + 12 : zhiIndex];
        
        return {
            gan,
            zhi,
            ganZhi: gan + zhi,
            wuxing: {
                gan: this.tianGanWuxing[gan],
                zhi: this.diZhiWuxing[zhi]
            },
            cangGan: this.diZhiCangGan[zhi],
            naYin: this.getNaYin(gan + zhi)
        };
    }

    /**
     * 计算月柱
     */
    calculateMonthPillar(year, month) {
        // 年干决定月干的起点
        const yearGanIndex = (year - 4) % 10;
        // 月干公式：年干 * 2 + 月数
        const ganIndex = (yearGanIndex * 2 + month) % 10;
        // 月支：月份 + 2（寅月开始）
        const zhiIndex = (month + 1) % 12;
        
        const gan = this.tianGan[ganIndex];
        const zhi = this.diZhi[zhiIndex];
        
        return {
            gan,
            zhi,
            ganZhi: gan + zhi,
            wuxing: {
                gan: this.tianGanWuxing[gan],
                zhi: this.diZhiWuxing[zhi]
            },
            cangGan: this.diZhiCangGan[zhi],
            naYin: this.getNaYin(gan + zhi)
        };
    }

    /**
     * 计算日柱
     */
    calculateDayPillar(year, month, day) {
        // 使用公式计算日干支
        // 这里使用简化的蔡勒公式变体
        const baseDate = new Date(1900, 0, 31); // 1900年1月31日为癸卯日
        const targetDate = new Date(year, month - 1, day);
        const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));
        
        const ganIndex = (diffDays % 10 + 10) % 10;
        const zhiIndex = (diffDays % 12 + 12) % 12;
        
        const gan = this.tianGan[ganIndex];
        const zhi = this.diZhi[zhiIndex];
        
        return {
            gan,
            zhi,
            ganZhi: gan + zhi,
            wuxing: {
                gan: this.tianGanWuxing[gan],
                zhi: this.diZhiWuxing[zhi]
            },
            cangGan: this.diZhiCangGan[zhi],
            naYin: this.getNaYin(gan + zhi)
        };
    }

    /**
     * 获取日柱（用于今日运势）
     */
    getDayPillar(date) {
        return this.calculateDayPillar(
            date.getFullYear(),
            date.getMonth() + 1,
            date.getDate()
        );
    }

    /**
     * 计算时柱
     */
    calculateHourPillar(dayGan, hour) {
        // 时辰对应
        const hourToZhi = this.getHourToZhi(hour);
        
        // 日干决定时干起点
        const dayGanIndex = this.tianGan.indexOf(dayGan);
        const ganIndex = (dayGanIndex * 2 + hourToZhi.zhiIndex) % 10;
        
        const gan = this.tianGan[ganIndex];
        const zhi = hourToZhi.zhi;
        
        return {
            gan,
            zhi,
            ganZhi: gan + zhi,
            wuxing: {
                gan: this.tianGanWuxing[gan],
                zhi: this.diZhiWuxing[zhi]
            },
            cangGan: this.diZhiCangGan[zhi],
            naYin: this.getNaYin(gan + zhi),
            timeRange: hourToZhi.timeRange
        };
    }

    /**
     * 小时转时辰
     */
    getHourToZhi(hour) {
        const timeMap = [
            { zhi: '子', range: '23:00-01:00', start: 23, end: 1 },
            { zhi: '丑', range: '01:00-03:00', start: 1, end: 3 },
            { zhi: '寅', range: '03:00-05:00', start: 3, end: 5 },
            { zhi: '卯', range: '05:00-07:00', start: 5, end: 7 },
            { zhi: '辰', range: '07:00-09:00', start: 7, end: 9 },
            { zhi: '巳', range: '09:00-11:00', start: 9, end: 11 },
            { zhi: '午', range: '11:00-13:00', start: 11, end: 13 },
            { zhi: '未', range: '13:00-15:00', start: 13, end: 15 },
            { zhi: '申', range: '15:00-17:00', start: 15, end: 17 },
            { zhi: '酉', range: '17:00-19:00', start: 17, end: 19 },
            { zhi: '戌', range: '19:00-21:00', start: 19, end: 21 },
            { zhi: '亥', range: '21:00-23:00', start: 21, end: 23 }
        ];

        let zhiIndex;
        if (hour >= 23 || hour < 1) zhiIndex = 0;
        else if (hour >= 1 && hour < 3) zhiIndex = 1;
        else if (hour >= 3 && hour < 5) zhiIndex = 2;
        else if (hour >= 5 && hour < 7) zhiIndex = 3;
        else if (hour >= 7 && hour < 9) zhiIndex = 4;
        else if (hour >= 9 && hour < 11) zhiIndex = 5;
        else if (hour >= 11 && hour < 13) zhiIndex = 6;
        else if (hour >= 13 && hour < 15) zhiIndex = 7;
        else if (hour >= 15 && hour < 17) zhiIndex = 8;
        else if (hour >= 17 && hour < 19) zhiIndex = 9;
        else if (hour >= 19 && hour < 21) zhiIndex = 10;
        else zhiIndex = 11;

        return {
            zhi: this.diZhi[zhiIndex],
            zhiIndex,
            timeRange: timeMap[zhiIndex].range
        };
    }

    /**
     * 计算十神
     */
    calculateTenGods(fourPillars) {
        const dayGan = fourPillars.day.gan;
        const dayWuxing = this.tianGanWuxing[dayGan];
        
        const result = {
            year: this.getTenGod(dayWuxing, fourPillars.year.gan, fourPillars.year.zhi),
            month: this.getTenGod(dayWuxing, fourPillars.month.gan, fourPillars.month.zhi),
            day: {
                gan: '日主',
                zhi: this.getDiZhiTenGod(dayWuxing, fourPillars.day.zhi)
            },
            hour: this.getTenGod(dayWuxing, fourPillars.hour.gan, fourPillars.hour.zhi)
        };

        return result;
    }

    /**
     * 获取十神
     */
    getTenGod(dayWuxing, gan, zhi) {
        return {
            gan: this.getTianGanTenGod(dayWuxing, gan),
            zhi: this.getDiZhiTenGod(dayWuxing, zhi)
        };
    }

    /**
     * 天干十神
     */
    getTianGanTenGod(dayWuxing, targetGan) {
        const targetWuxing = this.tianGanWuxing[targetGan];
        const wuxingOrder = ['木', '火', '土', '金', '水'];
        
        const dayIndex = wuxingOrder.indexOf(dayWuxing);
        const targetIndex = wuxingOrder.indexOf(targetWuxing);
        const diff = (targetIndex - dayIndex + 5) % 5;
        
        // 判断阴阳
        const ganIndex = this.tianGan.indexOf(targetGan);
        const isYang = ganIndex % 2 === 0;
        
        const tenGodMap = {
            0: isYang ? '比肩' : '劫财',  // 同类
            1: isYang ? '食神' : '伤官',  // 我生
            2: isYang ? '正财' : '偏财',  // 我克
            3: isYang ? '正官' : '七杀',  // 克我
            4: isYang ? '正印' : '偏印'   // 生我
        };
        
        return tenGodMap[diff];
    }

    /**
     * 地支十神（藏干十神）
     */
    getDiZhiTenGod(dayWuxing, zhi) {
        const cangGan = this.diZhiCangGan[zhi];
        return cangGan.map(gan => ({
            gan,
            tenGod: this.getTianGanTenGod(dayWuxing, gan)
        }));
    }

    /**
     * 计算大运
     */
    calculateDayun(fourPillars, gender) {
        const monthGanZhi = fourPillars.month.ganZhi;
        const monthGanIndex = this.tianGan.indexOf(fourPillars.month.gan);
        const monthZhiIndex = this.diZhi.indexOf(fourPillars.month.zhi);
        
        // 判断阳男阴女顺行，阴男阳女逆行
        const isYang = monthGanIndex % 2 === 0;
        const forward = (isYang && gender === 1) || (!isYang && gender === 0);
        
        const dayunList = [];
        const startAge = 8; // 起运年龄（简化处理）
        
        for (let i = 0; i < 8; i++) {
            let ganIndex, zhiIndex;
            
            if (forward) {
                ganIndex = (monthGanIndex + i + 1) % 10;
                zhiIndex = (monthZhiIndex + i + 1) % 12;
            } else {
                ganIndex = (monthGanIndex - i - 1 + 10) % 10;
                zhiIndex = (monthZhiIndex - i - 1 + 12) % 12;
            }
            
            const gan = this.tianGan[ganIndex];
            const zhi = this.diZhi[zhiIndex];
            
            dayunList.push({
                index: i + 1,
                ganZhi: gan + zhi,
                gan,
                zhi,
                ageRange: `${startAge + i * 10}-${startAge + i * 10 + 9}`,
                startAge: startAge + i * 10,
                endAge: startAge + i * 10 + 9
            });
        }
        
        return {
            direction: forward ? '顺行' : '逆行',
            startAge,
            list: dayunList
        };
    }

    /**
     * 获取纳音
     */
    getNaYin(ganZhi) {
        const naYinTable = {
            '甲子': '海中金', '乙丑': '海中金', '丙寅': '炉中火', '丁卯': '炉中火',
            '戊辰': '大林木', '己巳': '大林木', '庚午': '路旁土', '辛未': '路旁土',
            '壬申': '剑锋金', '癸酉': '剑锋金', '甲戌': '山头火', '乙亥': '山头火',
            '丙子': '涧下水', '丁丑': '涧下水', '戊寅': '城头土', '己卯': '城头土',
            '庚辰': '白蜡金', '辛巳': '白蜡金', '壬午': '杨柳木', '癸未': '杨柳木',
            '甲申': '泉中水', '乙酉': '泉中水', '丙戌': '屋上土', '丁亥': '屋上土',
            '戊子': '霹雳火', '己丑': '霹雳火', '庚寅': '松柏木', '辛卯': '松柏木',
            '壬辰': '长流水', '癸巳': '长流水', '甲午': '沙中金', '乙未': '沙中金',
            '丙申': '山下火', '丁酉': '山下火', '戊戌': '平地木', '己亥': '平地木',
            '庚子': '壁上土', '辛丑': '壁上土', '壬寅': '金箔金', '癸卯': '金箔金',
            '甲辰': '覆灯火', '乙巳': '覆灯火', '丙午': '天河水', '丁未': '天河水',
            '戊申': '大驿土', '己酉': '大驿土', '庚戌': '钗钏金', '辛亥': '钗钏金',
            '壬子': '桑柘木', '癸丑': '桑柘木', '甲寅': '大溪水', '乙卯': '大溪水',
            '丙辰': '沙中土', '丁巳': '沙中土', '戊午': '天上火', '己未': '天上火',
            '庚申': '石榴木', '辛酉': '石榴木', '壬戌': '大海水', '癸亥': '大海水'
        };
        
        return naYinTable[ganZhi] || '';
    }

    /**
     * 农历转公历（简化版）
     */
    lunarToSolar(year, month, day) {
        // 这里应该使用完整的农历转换算法
        // 简化处理，直接返回
        return { year, month, day };
    }
}