export class SafetySystem {
    constructor() {
        this.blockLists = {
            child: ['暴力', '死亡', '恐怖', '杀', '死', '血'],
            teen: ['毒品', '自杀', '色情', '赌博'],
            adult: ['非法交易'] // 成人仅过滤法律红线
        };
        this.crisisKeywords = ['想死', '不想活了', '自杀', '救命'];
    }

    checkContent(text, ageGroup) {
        // 1. 危机干预检查 (全年龄)
        for (const word of this.crisisKeywords) {
            if (text.includes(word)) {
                return { safe: false, reason: 'crisis', message: "检测到您可能情绪不稳定，建议寻求专业帮助。" };
            }
        }

        // 2. 年龄分级过滤
        // 儿童需同时过滤 child, teen, adult 的词库
        // 青少年过滤 teen, adult
        let checkList = [];
        if (ageGroup === 'child') {
            checkList = [...this.blockLists.child, ...this.blockLists.teen, ...this.blockLists.adult];
        } else if (ageGroup === 'teen') {
            checkList = [...this.blockLists.teen, ...this.blockLists.adult];
        } else {
            checkList = [...this.blockLists.adult];
        }

        for (const word of checkList) {
            if (text.includes(word)) {
                return { safe: false, reason: 'sensitive', message: "该话题不适合当前年龄段哦，我们聊点别的吧。" };
            }
        }

        return { safe: true };
    }
}