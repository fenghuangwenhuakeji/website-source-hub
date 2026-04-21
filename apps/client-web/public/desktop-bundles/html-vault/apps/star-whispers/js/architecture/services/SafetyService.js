/**
 * 安全服务 (SafetyService)
 */
export class SafetyService {
    constructor() {
        this.sensitiveWords = ['自杀', '死', '杀'];
        this.crisisKeywords = ['想死', '活不下去', '结束生命'];
    }

    checkContent(content) {
        const issues = [];
        this.sensitiveWords.forEach(word => {
            if (content.includes(word)) issues.push({ type: 'sensitive', word });
        });
        return { safe: issues.length === 0, issues };
    }

    filterContent(content) {
        let filtered = content;
        this.sensitiveWords.forEach(word => {
            filtered = filtered.replace(new RegExp(word, 'g'), '***');
        });
        return filtered;
    }

    detectCrisis(content) {
        const detected = this.crisisKeywords.some(k => content.includes(k));
        return { isCrisis: detected, level: detected ? 'high' : 'none' };
    }
}