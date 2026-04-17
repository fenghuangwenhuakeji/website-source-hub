export class SecurityLayer {
    constructor() {
        this.sensitiveWords = ['暴力', '自杀', '赌博']; // 示例词库
    }

    checkContent(content, age) {
        // 基础敏感词过滤
        for (let word of this.sensitiveWords) {
            if (content.includes(word)) {
                console.warn(`Security Alert: Blocked word '${word}' for age ${age}`);
                return { safe: false, reason: '包含敏感内容' };
            }
        }
        return { safe: true };
    }
}