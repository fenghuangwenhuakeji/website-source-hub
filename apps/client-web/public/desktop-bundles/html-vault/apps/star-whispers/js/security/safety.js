/**
 * Safety Module
 * 内容安全风控系统
 */

import { userManager } from '../modules/user.js';

const SENSITIVE_WORDS = ['暴力', '死亡', '色情', '杀', '死'];

class SafetyModule {
    /**
     * 检查文本是否安全
     * @param {string} text 
     * @returns {boolean}
     */
    checkContent(text) {
        const ageGroup = userManager.getAgeGroup();
        
        // 1. 基础敏感词过滤
        for (let word of SENSITIVE_WORDS) {
            if (text.includes(word)) {
                console.warn(`[Safety] Blocked sensitive word: ${word}`);
                return false;
            }
        }

        // 2. 针对儿童的额外保护
        if (ageGroup === 'child') {
            // 儿童模式下，禁止过长输入或特定复杂词汇（模拟）
            if (text.length > 50) return false;
        }

        return true;
    }

    getBlockMessage() {
        const ageGroup = userManager.getAgeGroup();
        if (ageGroup === 'child') return "小朋友，这个话题我们换一个好不好？";
        return "该内容不符合社区安全规范，无法发送。";
    }
}

export const safetyManager = new SafetyModule();