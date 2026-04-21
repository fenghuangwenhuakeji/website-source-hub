/**
 * 八字命理服务 (BaziService)
 */

import { BaziChart } from '../domain/divination/BaziChart.js';
import { Wuxing } from '../domain/divination/Wuxing.js';

export class BaziService {
    constructor() {
        this.charts = new Map();
    }

    /**
     * 计算八字
     */
    calculateBazi(birthDate, birthTime, gender) {
        const chart = new BaziChart({
            birthDate,
            birthTime,
            gender
        });

        // 简化的八字计算
        this.calculatePillars(chart);
        this.calculateWuxing(chart);

        return chart;
    }

    /**
     * 计算四柱
     */
    calculatePillars(chart) {
        const date = new Date(chart.birthDate);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        // 年柱 (简化算法)
        const yearGanIndex = (year - 4) % 10;
        const yearZhiIndex = (year - 4) % 12;
        chart.setPillar('year', BaziChart.TIANGAN[yearGanIndex], BaziChart.DIZHI[yearZhiIndex]);

        // 月柱 (简化)
        const monthZhiIndex = (month + 1) % 12;
        chart.setPillar('month', BaziChart.TIANGAN[(yearGanIndex * 2 + month) % 10], BaziChart.DIZHI[monthZhiIndex]);

        // 日柱 (简化)
        const dayOffset = Math.floor((date - new Date(1900, 0, 31)) / (1000 * 60 * 60 * 24));
        chart.setPillar('day', BaziChart.TIANGAN[dayOffset % 10], BaziChart.DIZHI[dayOffset % 12]);

        // 时柱 (简化)
        const hour = chart.birthTime ? parseInt(chart.birthTime.split(':')[0]) : 12;
        const hourZhiIndex = Math.floor((hour + 1) / 2) % 12;
        chart.setPillar('hour', BaziChart.TIANGAN[(dayOffset % 10) * 2 % 10], BaziChart.DIZHI[hourZhiIndex]);
    }

    /**
     * 计算五行
     */
    calculateWuxing(chart) {
        chart.wuxing = Wuxing.countElements(chart);
    }

    /**
     * 获取分析报告
     */
    getAnalysis(chart) {
        return {
            bazi: chart.getBaziString(),
            dayMaster: chart.getDayMaster(),
            wuxing: chart.wuxing,
            missingElements: chart.getMissingElements(),
            elementStrength: chart.getElementStrength(),
            personality: this.analyzePersonality(chart),
            career: this.analyzeCareer(chart),
            wealth: this.analyzeWealth(chart)
        };
    }

    /**
     * 分析性格
     */
    analyzePersonality(chart) {
        const dayMaster = chart.getDayMaster();
        const elements = chart.getElementStrength();
        return `${dayMaster}日主，五行${elements[0].element}旺，性格特点...`;
    }

    /**
     * 分析事业
     */
    analyzeCareer(chart) {
        return '事业分析...';
    }

    /**
     * 分析财运
     */
    analyzeWealth(chart) {
        return '财运分析...';
    }
}