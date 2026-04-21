/**
 * Content Security Filter
 * 根据年龄段过滤敏感内容
 */
export class ContentFilter {
    constructor(age) {
        this.age = age;
        this.blockLists = {
            child: ['暴力', '死亡', '恐怖', '杀', '血', '鬼'],
            teen: ['自杀', '毒品', '赌博'],
            adult: ['非法交易'] // 成人限制较少，主要防违法
        };
    }

    /**
     * 检查文本是否包含敏感词
     * @param {string} text 
     * @returns {boolean} true if safe, false if blocked
     */
    check(text) {
        let level = 'adult';
        if (this.age < 12) level = 'child';
        else if (this.age < 18) level = 'teen';

        const blockedWords = this.blockLists[level];
        
        for (let word of blockedWords) {
            if (text.includes(word)) {
                console.warn(`Security Alert: Blocked word "${word}" for age group ${level}`);
                return false;
            }
        }
        return true;
    }

    /**
     * 获取拦截后的提示语
     * @returns {string}
     */
    getWarningMessage() {
        if (this.age < 12) {
            return '小朋友，这个话题我们换一个好不好？我们来聊聊开心的事吧！';
        } else {
            return '该话题涉及敏感内容，为了您的身心健康，助手无法回应。';
        }
    }
}