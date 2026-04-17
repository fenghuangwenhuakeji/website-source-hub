import { NPTI_QUESTIONS } from '../data/npti_questions.js';
import { HOROSCOPE_DATA, getDailyHoroscope } from '../data/horoscope_data.js';

export class PersonalityContext {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.results = {
            npti: null,
            horoscope: null
        };
    }

    // 获取适合当前年龄段的题目
    getQuestions(ageGroup) {
        return NPTI_QUESTIONS[ageGroup] || NPTI_QUESTIONS['adult'];
    }

    // 计算 NPTI 结果 (简化版)
    calculateNPTI(answers) {
        // 简单统计 E/I, T/F 的数量
        let scores = { E: 0, I: 0, T: 0, F: 0 };
        answers.forEach(ans => {
            if (scores[ans.type] !== undefined) scores[ans.type]++;
        });
        
        const type = (scores.E >= scores.I ? 'E' : 'I') + (scores.T >= scores.F ? 'T' : 'F');
        this.results.npti = type;
        this.eventBus.emit('personality:nptiCalculated', type);
        return type;
    }

    // 设置星座并获取运势
    setHoroscope(signKey) {
        if (HOROSCOPE_DATA[signKey]) {
            this.results.horoscope = signKey;
            const daily = getDailyHoroscope(signKey);
            this.eventBus.emit('personality:horoscopeUpdated', daily);
            return daily;
        }
    }
}