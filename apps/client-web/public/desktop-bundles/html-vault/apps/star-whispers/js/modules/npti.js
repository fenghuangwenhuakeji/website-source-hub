import { NPTI_QUESTIONS } from '../data/questions.js';

export class NPTI {
    constructor(userGroup) {
        this.group = userGroup || 'adult';
        this.questions = NPTI_QUESTIONS[this.group] || NPTI_QUESTIONS.adult;
        // 初始化8个维度的分数
        this.scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    }

    getQuestions() {
        return this.questions;
    }

    submitAnswer(questionId, selectedOptionIndex) {
        const question = this.questions.find(q => q.id === questionId);
        if (!question) return;

        const option = question.options[selectedOptionIndex];
        
        // 适配 questions.js 的数据结构: { text: "...", type: "E" }
        if (option.type) {
            const type = option.type;
            if (this.scores.hasOwnProperty(type)) {
                this.scores[type] += 1;
            }
        }
    }

    calculateResult() {
        // 计算四个维度的偏好
        // 如果分数相同，默认取前者 (E, S, T, J)
        const type = [
            this.scores.E >= this.scores.I ? 'E' : 'I',
            // 注意：当前简版题库可能缺少 S/N 维度，若分数为0则默认 S
            this.scores.S >= this.scores.N ? 'S' : 'N',
            this.scores.T >= this.scores.F ? 'T' : 'F',
            this.scores.J >= this.scores.P ? 'J' : 'P'
        ].join('');
        
        return type;
    }
}