/**
 * 星座配对实体 (Compatibility)
 * 计算和分析星座之间的匹配度
 */

export class Compatibility {
    // 配对分数矩阵 (基础分数，实际会结合更多因素)
    static COMPATIBILITY_MATRIX = {
        '白羊座': { '白羊座': 70, '金牛座': 55, '双子座': 85, '巨蟹座': 45, '狮子座': 95, '处女座': 50, '天秤座': 75, '天蝎座': 60, '射手座': 90, '摩羯座': 40, '水瓶座': 80, '双鱼座': 55 },
        '金牛座': { '白羊座': 55, '金牛座': 80, '双子座': 45, '巨蟹座': 90, '狮子座': 60, '处女座': 95, '天秤座': 65, '天蝎座': 85, '射手座': 50, '摩羯座': 95, '水瓶座': 45, '双鱼座': 85 },
        '双子座': { '白羊座': 85, '金牛座': 45, '双子座': 75, '巨蟹座': 55, '狮子座': 80, '处女座': 65, '天秤座': 95, '天蝎座': 50, '射手座': 70, '摩羯座': 45, '水瓶座': 90, '双鱼座': 55 },
        '巨蟹座': { '白羊座': 45, '金牛座': 90, '双子座': 55, '巨蟹座': 80, '狮子座': 65, '处女座': 85, '天秤座': 55, '天蝎座': 95, '射手座': 45, '摩羯座': 70, '水瓶座': 45, '双鱼座': 95 },
        '狮子座': { '白羊座': 95, '金牛座': 60, '双子座': 80, '巨蟹座': 65, '狮子座': 75, '处女座': 55, '天秤座': 85, '天蝎座': 70, '射手座': 95, '摩羯座': 50, '水瓶座': 65, '双鱼座': 55 },
        '处女座': { '白羊座': 50, '金牛座': 95, '双子座': 65, '巨蟹座': 85, '狮子座': 55, '处女座': 80, '天秤座': 70, '天蝎座': 90, '射手座': 50, '摩羯座': 95, '水瓶座': 55, '双鱼座': 70 },
        '天秤座': { '白羊座': 75, '金牛座': 65, '双子座': 95, '巨蟹座': 55, '狮子座': 85, '处女座': 70, '天秤座': 75, '天蝎座': 65, '射手座': 80, '摩羯座': 55, '水瓶座': 95, '双鱼座': 60 },
        '天蝎座': { '白羊座': 60, '金牛座': 85, '双子座': 50, '巨蟹座': 95, '狮子座': 70, '处女座': 90, '天秤座': 65, '天蝎座': 80, '射手座': 55, '摩羯座': 85, '水瓶座': 50, '双鱼座': 95 },
        '射手座': { '白羊座': 90, '金牛座': 50, '双子座': 70, '巨蟹座': 45, '狮子座': 95, '处女座': 50, '天秤座': 80, '天蝎座': 55, '射手座': 75, '摩羯座': 55, '水瓶座': 85, '双鱼座': 50 },
        '摩羯座': { '白羊座': 40, '金牛座': 95, '双子座': 45, '巨蟹座': 70, '狮子座': 50, '处女座': 95, '天秤座': 55, '天蝎座': 85, '射手座': 55, '摩羯座': 85, '水瓶座': 50, '双鱼座': 75 },
        '水瓶座': { '白羊座': 80, '金牛座': 45, '双子座': 90, '巨蟹座': 45, '狮子座': 65, '处女座': 55, '天秤座': 95, '天蝎座': 50, '射手座': 85, '摩羯座': 50, '水瓶座': 80, '双鱼座': 55 },
        '双鱼座': { '白羊座': 55, '金牛座': 85, '双子座': 55, '巨蟹座': 95, '狮子座': 55, '处女座': 70, '天秤座': 60, '天蝎座': 95, '射手座': 50, '摩羯座': 75, '水瓶座': 55, '双鱼座': 85 }
    };

    static TYPES = {
        LOVE: 'love',         // 爱情配对
        FRIENDSHIP: 'friendship', // 友情配对
        WORK: 'work'          // 工作配对
    };

    constructor(sign1, sign2, type = 'love') {
        this.sign1 = sign1;
        this.sign2 = sign2;
        this.type = type;
        this.baseScore = this.calculateBaseScore();
        this.adjustedScore = this.baseScore;
        this.analysis = null;
    }

    /**
     * 计算基础配对分数
     */
    calculateBaseScore() {
        if (Compatibility.COMPATIBILITY_MATRIX[this.sign1] && 
            Compatibility.COMPATIBILITY_MATRIX[this.sign1][this.sign2]) {
            return Compatibility.COMPATIBILITY_MATRIX[this.sign1][this.sign2];
        }
        return 50; // 默认中等匹配度
    }

    /**
     * 根据配对类型调整分数
     */
    adjustForType() {
        const typeModifiers = {
            love: 0,        // 使用基础分数
            friendship: 5,  // 友情通常更容易
            work: -5        // 工作需要更多磨合
        };
        
        const modifier = typeModifiers[this.type] || 0;
        this.adjustedScore = Math.max(0, Math.min(100, this.baseScore + modifier));
        return this.adjustedScore;
    }

    /**
     * 获取配对等级
     */
    getLevel() {
        const score = this.adjustedScore;
        if (score >= 90) return { level: 'S', label: '天作之合', color: '#FFD700' };
        if (score >= 80) return { level: 'A', label: '非常般配', color: '#FF6B6B' };
        if (score >= 70) return { level: 'B', label: '良好匹配', color: '#4ECDC4' };
        if (score >= 60) return { level: 'C', label: '需要磨合', color: '#45B7D1' };
        if (score >= 50) return { level: 'D', label: '需要努力', color: '#96CEB4' };
        return { level: 'E', label: '挑战较大', color: '#A8A8A8' };
    }

    /**
     * 获取配对分析
     */
    getAnalysis() {
        return {
            score: this.adjustedScore,
            level: this.getLevel(),
            type: this.type,
            strengths: this.getStrengths(),
            challenges: this.getChallenges(),
            advice: this.getAdvice()
        };
    }

    /**
     * 获取优势
     */
    getStrengths() {
        // 基于配对分数返回优势描述
        const strengths = [];
        if (this.baseScore >= 80) {
            strengths.push('彼此有天然的吸引力');
            strengths.push('价值观高度契合');
        }
        if (this.baseScore >= 60) {
            strengths.push('能够互相学习成长');
            strengths.push('有良好的沟通基础');
        }
        return strengths;
    }

    /**
     * 获取挑战
     */
    getChallenges() {
        const challenges = [];
        if (this.baseScore < 70) {
            challenges.push('需要更多耐心理解对方');
        }
        if (this.baseScore < 50) {
            challenges.push('性格差异较大');
            challenges.push('需要更多包容和妥协');
        }
        return challenges;
    }

    /**
     * 获取建议
     */
    getAdvice() {
        if (this.baseScore >= 80) {
            return '你们是天作之合，珍惜彼此，保持沟通即可！';
        } else if (this.baseScore >= 60) {
            return '多花时间了解对方的需求，你们的感情会越来越好。';
        } else {
            return '虽然有些挑战，但只要彼此真心，差异也能成为互补的优势。';
        }
    }

    /**
     * 转换为JSON
     */
    toJSON() {
        return {
            sign1: this.sign1,
            sign2: this.sign2,
            type: this.type,
            score: this.adjustedScore,
            level: this.getLevel(),
            analysis: this.getAnalysis()
        };
    }
}