/**
 * 安全风控层
 * 负责内容过滤、年龄分级检查
 */
export class SecurityLayer {
    constructor(userContext) {
        this.userContext = userContext;
        this.blackList = {
            child: ['暴力', '死亡', '恐怖', '性', '杀', '死'],
            teen: ['色情', '毒品', '自杀'],
            adult: ['非法交易']
        };
    }

    /**
     * 检查输入是否安全
     * @param {string} text 
     * @returns {boolean}
     */
    checkInput(text) {
        const group = this.userContext.getProfile().ageGroup;
        const forbiddenWords = this.blackList[group] || [];
        
        for (let word of forbiddenWords) {
            if (text.includes(word)) {
                console.warn(`Security Alert: Blocked word '${word}' for group '${group}'`);
                return false;
            }
        }
        return true;
    }

    /**
     * 获取拦截提示语
     */
    getWarningMessage() {
        const group = this.userContext.getProfile().ageGroup;
        if (group === 'child') return "小朋友，这个话题我们长大一点再聊哦~ 🌟";
        if (group === 'teen') return "检测到不适宜内容，请保持健康的交流环境。";
        return "内容涉及敏感词汇，已根据社区规范拦截。";
    }
}