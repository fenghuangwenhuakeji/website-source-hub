import { NPTI_QUESTIONS } from '../data/questions.js';

export class NPTIService {
    constructor(eventBus) {
        this.eventBus = eventBus;
    }

    getQuestions(age) {
        if (age < 12) return NPTI_QUESTIONS.child;
        if (age < 18) return NPTI_QUESTIONS.teen;
        return NPTI_QUESTIONS.adult;
    }

    calculateResult(answers) {
        // 简易算法：统计各个维度的频次 (E/I, S/N, T/F, J/P)
        // MVP版本只取主要特征
        const counts = {};
        answers.forEach(type => {
            counts[type] = (counts[type] || 0) + 1;
        });

        // 简单的类型推断
        let typeCode = '';
        typeCode += (counts['E'] > counts['I']) ? 'E' : 'I';
        // 默认补全中间维度 (MVP简化)
        typeCode += (counts['T'] > counts['F']) ? 'T' : 'F';
        typeCode += (counts['J'] > counts['P']) ? 'J' : 'P';

        return {
            code: typeCode,
            title: this.getPersonalityTitle(typeCode),
            description: this.getPersonalityDesc(typeCode)
        };
    }

    getPersonalityTitle(code) {
        const map = {
            'ETJ': '天生的领导者',
            'ETP': '机智的探险家',
            'EFJ': '热情的守护者',
            'EFP': '快乐的表演者',
            'ITJ': '冷静的战略家',
            'ITP': '独立的思考者',
            'IFJ': '温柔的守护者',
            'IFP': '浪漫的艺术家'
        };
        // 模糊匹配
        for (let key in map) {
            if (code.includes(key)) return map[key];
        }
        return '独特的探索者'; // Default
    }

    getPersonalityDesc(code) {
        return '你拥有独特的思维方式，既能理性分析，又能敏锐感知周围的情绪。你的守护星正在看着你成长哦！';
    }
}