/**
 * 测试评分引擎 - Test Engine
 * 计算各类测试的分数
 */

export class TestEngine {
    constructor() {
        this.scoringMethods = {
            'mbti': this.calculateMBTI.bind(this),
            'bigfive': this.calculateBigFive.bind(this),
            'enneagram': this.calculateEnneagram.bind(this),
            'disc': this.calculateDISC.bind(this),
            'npti': this.calculateNPTI.bind(this),
            'love-language': this.calculateLoveLanguage.bind(this),
            'attachment': this.calculateAttachment.bind(this),
            'eq': this.calculateEQ.bind(this),
            'holland': this.calculateHolland.bind(this),
            'anxiety': this.calculateAnxiety.bind(this),
            'depression': this.calculateDepression.bind(this),
            'stress': this.calculateStress.bind(this),
            'default': this.calculateDefault.bind(this)
        };
    }

    /**
     * 计算分数
     */
    calculateScore(test, answers) {
        const method = this.scoringMethods[test.scoringMethod] || this.scoringMethods['default'];
        return method(test, answers);
    }

    /**
     * MBTI 计算
     */
    calculateMBTI(test, answers) {
        const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

        answers.forEach((answer, index) => {
            if (answer && answer.answer) {
                scores[answer.answer]++;
            }
        });

        const type = 
            (scores.E >= scores.I ? 'E' : 'I') +
            (scores.S >= scores.N ? 'S' : 'N') +
            (scores.T >= scores.F ? 'T' : 'F') +
            (scores.J >= scores.P ? 'J' : 'P');

        return {
            type,
            scores,
            percentages: {
                E_I: this.getPercentage(scores.E, scores.I),
                S_N: this.getPercentage(scores.S, scores.N),
                T_F: this.getPercentage(scores.T, scores.F),
                J_P: this.getPercentage(scores.J, scores.P)
            },
            description: this.getMBTIDescription(type)
        };
    }

    /**
     * 大五人格计算
     */
    calculateBigFive(test, answers) {
        const dimensions = { O: 0, C: 0, E: 0, A: 0, N: 0 };
        const counts = { O: 0, C: 0, E: 0, A: 0, N: 0 };

        answers.forEach((answer, index) => {
            const question = test.questions[index];
            if (question && answer) {
                const dim = question.dimension;
                let value = answer.answer;
                if (question.reverse) {
                    value = 6 - value;
                }
                dimensions[dim] += value;
                counts[dim]++;
            }
        });

        const result = {};
        Object.keys(dimensions).forEach(key => {
            result[key] = counts[key] > 0 ? 
                Math.round((dimensions[key] / counts[key] / 5) * 100) : 50;
        });

        return {
            scores: result,
            labels: {
                O: '开放性',
                C: '尽责性',
                E: '外向性',
                A: '宜人性',
                N: '神经质'
            },
            description: this.getBigFiveDescription(result)
        };
    }

    /**
     * 九型人格计算
     */
    calculateEnneagram(test, answers) {
        const scores = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };

        answers.forEach((answer, index) => {
            if (answer && answer.answer) {
                const type = Math.floor(index / 5) + 1;
                scores[type] += answer.answer;
                counts[type]++;
            }
        });

        // 找出最高分类型
        let maxScore = 0;
        let dominantType = 1;
        Object.keys(scores).forEach(type => {
            if (scores[type] > maxScore) {
                maxScore = scores[type];
                dominantType = parseInt(type);
            }
        });

        return {
            dominantType,
            scores,
            wing: this.calculateWing(dominantType, scores),
            description: this.getEnneagramDescription(dominantType)
        };
    }

    /**
     * 计算翼型
     */
    calculateWing(type, scores) {
        const wings = {
            1: [9, 2], 2: [1, 3], 3: [2, 4], 4: [3, 5],
            5: [4, 6], 6: [5, 7], 7: [6, 8], 8: [7, 9], 9: [8, 1]
        };
        const [left, right] = wings[type];
        return scores[left] >= scores[right] ? left : right;
    }

    /**
     * DISC 计算
     */
    calculateDISC(test, answers) {
        const scores = { D: 0, I: 0, S: 0, C: 0 };

        answers.forEach((answer, index) => {
            if (answer && answer.answer) {
                scores[answer.answer]++;
            }
        });

        const total = Object.values(scores).reduce((a, b) => a + b, 0);
        const dominant = Object.entries(scores)
            .sort((a, b) => b[1] - a[1])[0][0];

        return {
            scores,
            percentages: {
                D: Math.round(scores.D / total * 100),
                I: Math.round(scores.I / total * 100),
                S: Math.round(scores.S / total * 100),
                C: Math.round(scores.C / total * 100)
            },
            dominant,
            description: this.getDISCDescription(dominant)
        };
    }

    /**
     * NPTI 计算
     */
    calculateNPTI(test, answers) {
        const mbtiResult = this.calculateMBTI(test, answers);
        return {
            ...mbtiResult,
            nptiType: mbtiResult.type,
            constellation: this.getConstellationType(mbtiResult.type),
            description: this.getNPTIDescription(mbtiResult.type)
        };
    }

    /**
     * 爱的语言计算
     */
    calculateLoveLanguage(test, answers) {
        const scores = {
            'quality-time': 0,
            'words': 0,
            'gifts': 0,
            'service': 0,
            'touch': 0
        };

        answers.forEach((answer, index) => {
            if (answer && answer.answer) {
                scores[answer.answer]++;
            }
        });

        const sorted = Object.entries(scores)
            .sort((a, b) => b[1] - a[1]);
        const primary = sorted[0][0];
        const secondary = sorted[1][0];

        return {
            scores,
            primary,
            secondary,
            description: this.getLoveLanguageDescription(primary)
        };
    }

    /**
     * 依恋类型计算
     */
    calculateAttachment(test, answers) {
        const scores = { secure: 0, anxious: 0, avoidant: 0, fearful: 0 };
        
        answers.forEach((answer, index) => {
            if (answer && answer.answer) {
                // 简化计算
                if (index % 4 === 0) scores.secure += answer.answer;
                else if (index % 4 === 1) scores.anxious += answer.answer;
                else if (index % 4 === 2) scores.avoidant += answer.answer;
                else scores.fearful += answer.answer;
            }
        });

        const dominant = Object.entries(scores)
            .sort((a, b) => b[1] - a[1])[0][0];

        return {
            scores,
            dominant,
            description: this.getAttachmentDescription(dominant)
        };
    }

    /**
     * 情商计算
     */
    calculateEQ(test, answers) {
        let total = 0;
        let count = 0;

        answers.forEach((answer, index) => {
            if (answer && answer.answer) {
                total += answer.answer;
                count++;
            }
        });

        const avg = count > 0 ? total / count : 0;
        const score = Math.round((avg / 5) * 100);

        return {
            score,
            level: this.getEQLevel(score),
            description: this.getEQDescription(score)
        };
    }

    /**
     * 霍兰德计算
     */
    calculateHolland(test, answers) {
        const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
        const counts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

        answers.forEach((answer, index) => {
            const question = test.questions[index];
            if (question && answer) {
                const type = question.options[0]?.type || 'R';
                scores[type] += answer.answer;
                counts[type]++;
            }
        });

        const sorted = Object.entries(scores)
            .sort((a, b) => b[1] - a[1]);
        const code = sorted.slice(0, 3).map(s => s[0]).join('');

        return {
            scores,
            code,
            description: this.getHollandDescription(code)
        };
    }

    /**
     * 焦虑计算
     */
    calculateAnxiety(test, answers) {
        let total = 0;
        answers.forEach((answer, index) => {
            if (answer && answer.answer) {
                total += answer.answer;
            }
        });

        const score = Math.round(total * 1.25);
        const level = this.getAnxietyLevel(score);

        return {
            rawScore: total,
            standardScore: score,
            level,
            description: this.getAnxietyDescription(level)
        };
    }

    /**
     * 抑郁计算
     */
    calculateDepression(test, answers) {
        let total = 0;
        answers.forEach((answer, index) => {
            if (answer && answer.answer) {
                total += answer.answer;
            }
        });

        const score = Math.round(total * 1.25);
        const level = this.getDepressionLevel(score);

        return {
            rawScore: total,
            standardScore: score,
            level,
            description: this.getDepressionDescription(level)
        };
    }

    /**
     * 压力计算
     */
    calculateStress(test, answers) {
        let total = 0;
        let count = 0;

        answers.forEach((answer, index) => {
            if (answer && answer.answer) {
                total += answer.answer;
                count++;
            }
        });

        const avg = count > 0 ? total / count : 0;
        const level = this.getStressLevel(avg);

        return {
            averageScore: avg.toFixed(1),
            level,
            description: this.getStressDescription(level)
        };
    }

    /**
     * 默认计算方法
     */
    calculateDefault(test, answers) {
        let total = 0;
        let count = 0;

        answers.forEach((answer, index) => {
            if (answer && typeof answer.answer === 'number') {
                total += answer.answer;
                count++;
            }
        });

        const avg = count > 0 ? total / count : 0;
        const score = Math.round((avg / 5) * 100);

        return {
            score,
            totalAnswers: count,
            description: `测试完成，得分 ${score} 分`
        };
    }

    // ==================== 辅助方法 ====================

    getPercentage(a, b) {
        const total = a + b;
        return total > 0 ? Math.round((a / total) * 100) : 50;
    }

    getMBTIDescription(type) {
        const descriptions = {
            'INTJ': '建筑师人格 - 富有想象力的战略家，有计划性',
            'INTP': '逻辑学家 - 善于分析的发明家',
            'ENTJ': '指挥官 - 大胆的领导者',
            'ENTP': '辩论家 - 聪明的创新者',
            'INFJ': '提倡者 - 安静的理想主义者',
            'INFP': '调停者 - 富有想象力的治愈者',
            'ENFJ': '主人公 - 富有魅力的领导者',
            'ENFP': '竞选者 - 热情的创意者',
            'ISTJ': '检查员 - 务实的组织者',
            'ISFJ': '守卫者 - 忠诚的守护者',
            'ESTJ': '执行者 - 高效的管理者',
            'ESFJ': '执政官 - 热心的助人者',
            'ISTP': '鉴赏家 - 灵活的工匠',
            'ISFP': '探险家 - 灵活的艺术家',
            'ESTP': '企业家 - 精明的冒险者',
            'ESFP': '表演者 - 自发的娱乐者'
        };
        return descriptions[type] || `${type} 类型人格`;
    }

    getBigFiveDescription(scores) {
        const traits = [];
        if (scores.O > 70) traits.push('开放性高');
        if (scores.C > 70) traits.push('尽责性强');
        if (scores.E > 70) traits.push('外向');
        if (scores.A > 70) traits.push('宜人性高');
        if (scores.N > 70) traits.push('情绪敏感');
        return traits.length > 0 ? `你的人格特点：${traits.join('、')}` : '你的人格特点较为均衡';
    }

    getEnneagramDescription(type) {
        const descriptions = {
            1: '完美主义者 - 追求完美，有原则',
            2: '助人者 - 关爱他人，乐于付出',
            3: '成就者 - 追求成功，高效务实',
            4: '个人主义者 - 独特敏感，富有创意',
            5: '观察者 - 理性分析，追求知识',
            6: '忠诚者 - 忠诚可靠，注重安全',
            7: '享乐者 - 乐观积极，追求自由',
            8: '挑战者 - 自信果断，追求掌控',
            9: '和平者 - 和谐平静，包容性强'
        };
        return descriptions[type] || `第${type}型人格`;
    }

    getDISCDescription(type) {
        const descriptions = {
            'D': '支配型 - 直接、果断、追求结果',
            'I': '影响型 - 热情、乐观、善于社交',
            'S': '稳健型 - 稳定、耐心、善于倾听',
            'C': '服从型 - 精确、分析、注重细节'
        };
        return descriptions[type] || type;
    }

    getNPTIDescription(type) {
        return `NPTI ${type}型 - 融合心理学与星座特质的独特人格`;
    }

    getConstellationType(mbtiType) {
        const map = {
            'INTJ': '天蝎座', 'INTP': '水瓶座', 'ENTJ': '狮子座', 'ENTP': '双子座',
            'INFJ': '双鱼座', 'INFP': '巨蟹座', 'ENFJ': '天秤座', 'ENFP': '射手座',
            'ISTJ': '处女座', 'ISFJ': '金牛座', 'ESTJ': '摩羯座', 'ESFJ': '巨蟹座',
            'ISTP': '摩羯座', 'ISFP': '天秤座', 'ESTP': '白羊座', 'ESFP': '狮子座'
        };
        return map[mbtiType] || '白羊座';
    }

    getLoveLanguageDescription(type) {
        const descriptions = {
            'quality-time': '精心时刻 - 你最看重与伴侣共度的优质时光',
            'words': '肯定的言辞 - 言语的肯定对你最重要',
            'gifts': '接受礼物 - 礼物是你感受爱的方式',
            'service': '服务的行动 - 对方为你做事让你感动',
            'touch': '身体接触 - 拥抱和亲密接触是爱的表达'
        };
        return descriptions[type] || type;
    }

    getAttachmentDescription(type) {
        const descriptions = {
            'secure': '安全型 - 你在关系中感到安全，能够信任他人',
            'anxious': '焦虑型 - 你担心被抛弃，需要更多确认',
            'avoidant': '回避型 - 你倾向于保持距离，避免亲密',
            'fearful': '恐惧型 - 你渴望亲密但又害怕受伤'
        };
        return descriptions[type] || type;
    }

    getEQLevel(score) {
        if (score >= 80) return '优秀';
        if (score >= 60) return '良好';
        if (score >= 40) return '一般';
        return '需提升';
    }

    getEQDescription(score) {
        const level = this.getEQLevel(score);
        return `情商水平：${level}（${score}分）`;
    }

    getHollandDescription(code) {
        const typeNames = {
            'R': '现实型', 'I': '研究型', 'A': '艺术型',
            'S': '社会型', 'E': '企业型', 'C': '常规型'
        };
        return `你的霍兰德代码是 ${code}，适合${typeNames[code[0]]}相关的职业`;
    }

    getAnxietyLevel(score) {
        if (score < 50) return '正常';
        if (score < 60) return '轻度焦虑';
        if (score < 70) return '中度焦虑';
        return '重度焦虑';
    }

    getAnxietyDescription(level) {
        const descriptions = {
            '正常': '你的焦虑水平在正常范围内',
            '轻度焦虑': '你有轻微的焦虑倾向，建议注意调节',
            '中度焦虑': '你有一定程度的焦虑，建议寻求专业帮助',
            '重度焦虑': '你的焦虑水平较高，强烈建议咨询专业人士'
        };
        return descriptions[level];
    }

    getDepressionLevel(score) {
        if (score < 50) return '正常';
        if (score < 60) return '轻度抑郁';
        if (score < 70) return '中度抑郁';
        return '重度抑郁';
    }

    getDepressionDescription(level) {
        const descriptions = {
            '正常': '你的抑郁水平在正常范围内',
            '轻度抑郁': '你有轻微的抑郁情绪，建议关注心理健康',
            '中度抑郁': '你有一定程度的抑郁，建议寻求专业帮助',
            '重度抑郁': '你的抑郁水平较高，强烈建议咨询专业人士'
        };
        return descriptions[level];
    }

    getStressLevel(avg) {
        if (avg < 2) return '低';
        if (avg < 3) return '中等';
        if (avg < 4) return '较高';
        return '高';
    }

    getStressDescription(level) {
        const descriptions = {
            '低': '你的心理压力较低，状态良好',
            '中等': '你的心理压力适中，属于正常范围',
            '较高': '你的心理压力偏高，建议适当放松',
            '高': '你的心理压力较大，强烈建议休息调整'
        };
        return descriptions[level];
    }
}