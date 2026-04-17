/**
 * 内容服务 (ContentService)
 */
export class ContentService {
    constructor() {
        this.quotes = [];
        this.articles = [];
    }

    getDailyQuote(signName = null) {
        const quotes = [
            { content: '今天的星星为你闪耀，保持积极心态', author: '星语' },
            { content: '每一个新的开始都是一次蜕变', author: '心伴' },
            { content: '相信自己，你比想象中更强大', author: '星语' }
        ];
        return { ...quotes[Math.floor(Math.random() * quotes.length)], date: new Date(), zodiacSign: signName };
    }

    getArticles(category = null, page = 1, limit = 10) {
        return this.articles.slice((page - 1) * limit, page * limit);
    }
}