import { nptiQuestions } from '../data/npti_questions.js';

export class NPTIService {
    constructor() {
        this.scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    }

    getQuestions(ageGroup) {
        return nptiQuestions[ageGroup] || [];
    }

    submitAnswer(scoreDelta) {
        for (const [key, value] of Object.entries(scoreDelta)) {
            if (this.scores.hasOwnProperty(key)) {
                this.scores[key] += value;
            }
        }
    }

    calculateResult() {
        const type = [
            this.scores.E >= this.scores.I ? 'E' : 'I',
            this.scores.S >= this.scores.N ? 'S' : 'N',
            this.scores.T >= this.scores.F ? 'T' : 'F',
            this.scores.J >= this.scores.P ? 'J' : 'P'
        ].join('');
        
        return {
            type: type,
            details: this.scores
        };
    }

    reset() {
        this.scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    }
}
