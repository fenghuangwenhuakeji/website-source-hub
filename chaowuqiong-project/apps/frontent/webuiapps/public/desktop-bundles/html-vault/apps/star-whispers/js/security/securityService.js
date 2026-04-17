export class SecurityService {
    constructor() {
        // 简单敏感词库 (示例)
        this.blocklist = ['暴力', '自杀', '死亡', '色情', '赌博', 'kill', 'die'];
    }

    checkContent(text) {
        const lowerText = text.toLowerCase();
        for (const word of this.blocklist) {
            if (lowerText.includes(word)) {
                return {
                    safe: false,
                    reason: 'content_policy',
                    matched: word
                };
            }
        }
        return { safe: true };
    }

    getSafeReply(ageGroup) {
        if (ageGroup === 'child') {
            return '哎呀，这个话题我们换一个好不好？我们来聊聊开心的事吧！';
        } else {
            return '我注意到你的话里包含了一些敏感内容。作为你的AI伙伴，我希望我们能保持积极健康的交流。如果你遇到了困难，建议寻求专业帮助。';
        }
    }
}