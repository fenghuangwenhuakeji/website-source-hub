/**
 * 每日签语实体 (DailyQuote)
 */
export class DailyQuote {
    static TYPES = {
        DAILY: 'daily',
        GUIDANCE: 'guidance',
        ENCOURAGEMENT: 'encouragement',
        LOVE: 'love',
        CAREER: 'career'
    };

    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.type = data.type || DailyQuote.TYPES.DAILY;
        this.content = data.content || '';
        this.author = data.author || '';
        this.date = data.date || new Date();
        this.zodiacSign = data.zodiacSign || null;
        this.imageUrl = data.imageUrl || null;
    }

    generateId() {
        return 'quote_' + Date.now();
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            content: this.content,
            author: this.author,
            date: this.date,
            zodiacSign: this.zodiacSign,
            imageUrl: this.imageUrl
        };
    }
}