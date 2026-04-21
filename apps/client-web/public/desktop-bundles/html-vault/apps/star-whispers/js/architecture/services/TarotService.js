/**
 * 塔罗占卜服务 (TarotService)
 */

import { TarotCard } from '../domain/divination/TarotCard.js';
import { TarotSpread } from '../domain/divination/TarotSpread.js';

export class TarotService {
    constructor() {
        this.deck = this.createDeck();
    }

    /**
     * 创建78张塔罗牌
     */
    createDeck() {
        const deck = [];
        
        // 大阿尔卡纳
        TarotCard.MAJOR_ARCANA.forEach((card, index) => {
            deck.push(new TarotCard({
                arcana: 'major',
                number: card.number,
                name: card.name,
                english: card.english,
                keywords: card.keywords,
                uprightMeaning: `${card.name}正位含义`,
                reversedMeaning: `${card.name}逆位含义`
            }));
        });

        return deck;
    }

    /**
     * 洗牌
     */
    shuffle() {
        const shuffled = [...this.deck];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * 抽牌
     */
    drawCards(count) {
        const shuffled = this.shuffle();
        return shuffled.slice(0, count).map(card => ({
            ...card,
            isReversed: Math.random() > 0.5
        }));
    }

    /**
     * 获取所有牌阵
     */
    getAllSpreads() {
        return TarotSpread.getAllSpreads();
    }

    /**
     * 执行占卜
     */
    performReading(spreadType, question) {
        const spread = TarotSpread.getSpreadByType(spreadType);
        if (!spread) return null;

        const cards = this.drawCards(spread.cardCount);
        const reading = {
            spread: spread.toJSON(),
            question,
            cards: cards.map((card, index) => ({
                position: spread.positions[index],
                card: card.toJSON(),
                isReversed: card.isReversed,
                meaning: card.isReversed ? card.reversedMeaning : card.uprightMeaning
            })),
            timestamp: new Date()
        };

        return reading;
    }
}