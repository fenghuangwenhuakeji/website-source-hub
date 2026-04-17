import { eventBus } from '../core/EventBus.js';
import { nptiQuestions } from '../data/npti_questions.js';

export class NPTIModule {
    constructor() {
        this.container = document.getElementById('npti-container');
        this.currentQuestions = [];
        this.answers = {};
    }

    init() {
        eventBus.on('npti:start', (ageGroup) => {
            this.startAssessment(ageGroup);
        });
    }

    startAssessment(ageGroup) {
        this.currentQuestions = nptiQuestions[ageGroup] || nptiQuestions['adult'];
        this.renderQuestions();
    }

    renderQuestions() {
        if (!this.container) return;
        
        let html = '<div class="npti-list">';
        this.currentQuestions.forEach((q, index) => {
            html += `
                <div class="npti-item">
                    <p>${index + 1}. ${q.text}</p>
                    <div class="npti-options">
                        ${q.options.map((opt, i) => `
                            <button class="option-btn" onclick="alert('测评逻辑演示：选择了 ${opt.label}')">${opt.label}</button>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        html += '</div>';
        this.container.innerHTML = html;
    }
}