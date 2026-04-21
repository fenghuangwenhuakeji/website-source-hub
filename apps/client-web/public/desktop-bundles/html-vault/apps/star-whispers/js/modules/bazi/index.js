/**
 * 八字命理模块 - Bazi Module
 * 对标测测App的八字功能
 */

import { BaziCalculator } from './BaziCalculator.js';
import { WuxingAnalyzer } from './WuxingAnalyzer.js';
import { BaziInterpreter } from './BaziInterpreter.js';

export class BaziModule {
    constructor() {
        this.calculator = new BaziCalculator();
        this.wuxingAnalyzer = new WuxingAnalyzer();
        this.interpreter = new BaziInterpreter();
        this.history = [];
    }

    /**
     * 计算八字命盘
     * @param {Object} birthInfo - 出生信息
     * @param {number} birthInfo.year - 出生年
     * @param {number} birthInfo.month - 出生月
     * @param {number} birthInfo.day - 出生日
     * @param {number} birthInfo.hour - 出生时
     * @param {number} birthInfo.minute - 出生分
     * @param {boolean} birthInfo.isLunar - 是否农历
     * @param {number} birthInfo.gender - 性别 (1男, 0女)
     * @returns {Object} 八字命盘结果
     */
    calculate(birthInfo) {
        // 1. 计算四柱
        const fourPillars = this.calculator.calculateFourPillars(birthInfo);

        // 2. 五行分析
        const wuxingAnalysis = this.wuxingAnalyzer.analyze(fourPillars);

        // 3. 十神分析
        const tenGods = this.calculator.calculateTenGods(fourPillars);

        // 4. 大运计算
        const dayun = this.calculator.calculateDayun(fourPillars, birthInfo.gender);

        // 5. 生成解读
        const interpretation = this.interpreter.interpret({
            fourPillars,
            wuxingAnalysis,
            tenGods,
            dayun
        });

        const result = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            birthInfo,
            fourPillars,
            wuxingAnalysis,
            tenGods,
            dayun,
            interpretation,
            summary: interpretation.summary
        };

        // 保存历史
        this.saveToHistory(result);

        return result;
    }

    /**
     * 获取五行分析
     */
    getWuxingAnalysis(fourPillars) {
        return this.wuxingAnalyzer.analyze(fourPillars);
    }

    /**
     * 获取今日运势
     */
    getDailyFortune(baziId) {
        const bazi = this.history.find(h => h.id === baziId);
        if (!bazi) return null;

        const today = new Date();
        const dayPillar = this.calculator.getDayPillar(today);
        
        return this.interpreter.getDailyFortune(bazi, dayPillar);
    }

    /**
     * 获取配对分析
     */
    getCompatibilityAnalysis(baziId1, baziId2) {
        const bazi1 = this.history.find(h => h.id === baziId1);
        const bazi2 = this.history.find(h => h.id === baziId2);

        if (!bazi1 || !bazi2) return null;

        return this.interpreter.analyzeCompatibility(bazi1, bazi2);
    }

    /**
     * 保存历史
     */
    saveToHistory(result) {
        // 查找是否已有相同八字的记录
        const existingIndex = this.history.findIndex(h => 
            JSON.stringify(h.fourPillars) === JSON.stringify(result.fourPillars)
        );

        if (existingIndex >= 0) {
            this.history[existingIndex] = result;
        } else {
            this.history.unshift(result);
        }

        // 限制历史数量
        if (this.history.length > 20) {
            this.history = this.history.slice(0, 20);
        }

        this.persistHistory();
    }

    /**
     * 获取历史记录
     */
    getHistory() {
        return this.history;
    }

    /**
     * 持久化
     */
    persistHistory() {
        try {
            localStorage.setItem('bazi_history', JSON.stringify(this.history));
        } catch (e) {
            console.warn('八字历史保存失败:', e);
        }
    }

    /**
     * 加载历史
     */
    loadHistory() {
        try {
            const saved = localStorage.getItem('bazi_history');
            if (saved) {
                this.history = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('八字历史加载失败:', e);
        }
    }

    /**
     * 生成ID
     */
    generateId() {
        return `bazi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// 导出单例
export const baziModule = new BaziModule();