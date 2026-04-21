import { questions } from '../data/questions.js';

export class PersonalitySystem {
    constructor() {
        this.scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    }

    getQuestions(ageGroup) {
        return questions[ageGroup] || questions['adult'];
    }

    submitAnswer(scoreDelta) {
        for (const [key, value] of Object.entries(scoreDelta)) {
            if (this.scores.hasOwnProperty(key)) {
                this.scores[key] += value;
            }
        }
    }

    calculateResult() {
        // 简单的二分判定
        const type = [
            this.scores.E >= this.scores.I ? 'E' : 'I',
            this.scores.S >= this.scores.N ? 'S' : 'N',
            this.scores.T >= this.scores.F ? 'T' : 'F',
            this.scores.J >= this.scores.P ? 'J' : 'P'
        ].join('');
        return type;
    }
}