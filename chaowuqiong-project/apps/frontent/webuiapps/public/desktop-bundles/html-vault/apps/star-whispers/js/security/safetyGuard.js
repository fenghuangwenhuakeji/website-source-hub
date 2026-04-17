export class SafetyGuard {
    constructor() {
        // 敏感词库 (示例)
        this.blocklist = ['暴力', '自杀', '色情', '赌博', '死亡'];
        this.crisisKeywords = ['不想活了', '想死', '救命'];
    }

    check(text, ageGroup) {
        // 1. 基础敏感词过滤
        for (let word of this.blocklist) {
            if (text.includes(word)) {
                return { safe: false, reason: 'sensitive', keyword: word };
            }
        }

        // 2. 危机干预检测
        for (let word of this.crisisKeywords) {
            if (text.includes(word)) {
                return { safe: false, reason: 'crisis', keyword: word };
            }
        }

        // 3. 儿童模式下的额外严格过滤
        if (ageGroup === 'child') {
            const childBlocklist = ['恋爱', '约会', '喝酒'];
            for (let word of childBlocklist) {
                if (text.includes(word)) {
                    return { safe: false, reason: 'age_restricted', keyword: word };
                }
            }
        }

        return { safe: true };
    }

    maskContent(text) {
        let masked = text;
        [...this.blocklist, ...this.crisisKeywords].forEach(word => {
            masked = masked.replace(new RegExp(word, 'g'), '*'.repeat(word.length));
        });
        return masked;
    }
}