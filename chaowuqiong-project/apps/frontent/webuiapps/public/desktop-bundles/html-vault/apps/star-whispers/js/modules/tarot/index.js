/**
 * 塔罗占卜模块 - Tarot Module
 * 对标测测App的塔罗功能
 */

import { TarotDeck } from './TarotDeck.js';
import { TarotSpreads } from './TarotSpreads.js';
import { TarotInterpreter } from './TarotInterpreter.js';

export class TarotModule {
    constructor() {
        this.deck = new TarotDeck();
        this.spreads = new TarotSpreads();
        this.interpreter = new TarotInterpreter();
        this.history = [];
    }

    /**
     * 获取可用的牌阵列表
     */
    getAvailableSpreads() {
        return this.spreads.getSpreadList();
    }

    /**
     * 进行塔罗占卜
     * @param {string} spreadType - 牌阵类型
     * @param {string} question - 用户的问题（可选）
     * @returns {Object} 占卜结果
     */
    async divine(spreadType, question = '') {
        // 1. 获取牌阵配置
        const spread = this.spreads.getSpread(spreadType);
        
        // 2. 洗牌并抽取
        const drawnCards = this.deck.draw(spread.cardCount);
        
        // 3. 生成解读
        const interpretation = await this.interpreter.interpret(
            drawnCards, 
            spread, 
            question
        );

        // 4. 构建结果对象
        const result = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            spreadType,
            spreadName: spread.name,
            question,
            cards: drawnCards.map((card, index) => ({
                ...card,
                position: spread.positions[index],
                isReversed: card.isReversed
            })),
            interpretation,
            summary: interpretation.summary
        };

        // 5. 保存历史记录
        this.saveToHistory(result);

        return result;
    }

    /**
     * 获取单张每日指引牌
     */
    getDailyGuidance() {
        const card = this.deck.draw(1)[0];
        return {
            card,
            interpretation: this.interpreter.getSingleCardMeaning(card),
            date: new Date().toLocaleDateString('zh-CN')
        };
    }

    /**
     * 保存到历史记录
     */
    saveToHistory(result) {
        this.history.unshift(result);
        // 只保留最近50条记录
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        // 持久化存储
        this.persistHistory();
    }

    /**
     * 获取历史记录
     */
    getHistory(limit = 10) {
        return this.history.slice(0, limit);
    }

    /**
     * 持久化历史记录
     */
    persistHistory() {
        try {
            localStorage.setItem('tarot_history', JSON.stringify(this.history));
        } catch (e) {
            console.warn('塔罗历史记录保存失败:', e);
        }
    }

    /**
     * 加载历史记录
     */
    loadHistory() {
        try {
            const saved = localStorage.getItem('tarot_history');
            if (saved) {
                this.history = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('塔罗历史记录加载失败:', e);
        }
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        return `tarot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// 导出单例
export const tarotModule = new TarotModule();