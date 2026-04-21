export default class SecurityGuard {
    constructor() {
        this.policy = null;
        this.bannedWords = {
            'child': ['死亡', '杀', '暴力', '色情'],
            'teen': ['毒品', '赌博'],
            'adult': []
        };
    }

    loadPolicy(ageGroup) {
        this.currentAgeGroup = ageGroup;
        console.log(`[SecurityGuard] Loaded policy for: ${ageGroup}`);
    }

    checkContent(text) {
        const banned = this.bannedWords[this.currentAgeGroup] || [];
        for (const word of banned) {
            if (text.includes(word)) {
                return {
                    safe: false,
                    reason: `包含敏感词: ${word}`
                };
            }
        }
        return { safe: true };
    }
}