/**
 * 内容安全过滤器
 * 根据用户年龄段提供不同层级的过滤策略
 */

const SENSITIVE_WORDS = {
    high: ['暴力', '死亡', '杀', '血', '恐怖', '性', '脏话'], // 儿童级严格过滤
    medium: ['色情', '自杀', '毒品', '脏话'], // 青少年级
    low: ['违法', '极端'] // 成人级
};

export class ContentFilter {
    constructor(ageGroup = 'child') {
        this.setPolicy(ageGroup);
    }

    setPolicy(ageGroup) {
        this.ageGroup = ageGroup;
        switch (ageGroup) {
            case 'child':
                this.keywords = [...SENSITIVE_WORDS.high, ...SENSITIVE_WORDS.medium, ...SENSITIVE_WORDS.low];
                break;
            case 'teen':
                this.keywords = [...SENSITIVE_WORDS.medium, ...SENSITIVE_WORDS.low];
                break;
            case 'adult':
                this.keywords = SENSITIVE_WORDS.low;
                break;
            default:
                this.keywords = SENSITIVE_WORDS.high;
        }
    }

    /**
     * 检查文本是否包含敏感内容
     * @param {string} text 
     * @returns {boolean}
     */
    check(text) {
        if (!text) return true;
        return !this.keywords.some(word => text.includes(word));
    }

    /**
     * 敏感词脱敏处理
     * @param {string} text 
     * @returns {string}
     */
    sanitize(text) {
        let cleanText = text;
        this.keywords.forEach(word => {
            const regex = new RegExp(word, 'g');
            cleanText = cleanText.replace(regex, '*'.repeat(word.length));
        });
        return cleanText;
    }
}
