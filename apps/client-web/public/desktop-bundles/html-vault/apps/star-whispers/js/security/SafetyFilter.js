/**
 * 安全过滤模块
 * 负责内容风控和敏感词检测
 */
export class SafetyFilter {
    constructor() {
        this.blockLists = {
            common: ['暴力', '色情', '赌博', '自杀', '死亡'],
            child: ['笨蛋', '去死', '讨厌', '恐怖', '血腥'],
            teen: ['作弊', '逃课', '网恋']
        };
    }

    /**
     * 检查内容是否安全
     * @param {string} text - 待检查文本
     * @param {string} ageGroup - 'child' | 'teen' | 'adult'
     * @returns {object} { safe: boolean, reason: string }
     */
    check(text, ageGroup) {
        // 1. 基础过滤 (全年龄)
        for (const word of this.blockLists.common) {
            if (text.includes(word)) {
                return { safe: false, reason: '包含违规内容，请文明用语。' };
            }
        }

        // 2. 儿童特定过滤
        if (ageGroup === 'child') {
            for (const word of this.blockLists.child) {
                if (text.includes(word)) {
                    return { safe: false, reason: '小朋友不能说这个哦~' };
                }
            }
        }

        // 3. 青少年特定过滤
        if (ageGroup === 'teen') {
            for (const word of this.blockLists.teen) {
                if (text.includes(word)) {
                    return { safe: false, reason: '这个话题不太适合我们讨论。' };
                }
            }
        }

        return { safe: true };
    }
}