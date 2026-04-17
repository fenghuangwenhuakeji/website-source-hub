export class NPTIView {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.container = document.getElementById('view-npti');
        this.questionText = document.getElementById('npti-question-text');
        this.optionsContainer = document.getElementById('npti-options');
        this.progressText = document.getElementById('npti-progress');
        
        this.currentQuestions = [];
        this.currentIndex = 0;
        this.answers = [];
    }

    startTest(questions) {
        this.currentQuestions = questions;
        this.currentIndex = 0;
        this.answers = [];
        this.renderQuestion();
    }

    renderQuestion() {
        if (this.currentIndex >= this.currentQuestions.length) {
            this.finishTest();
            return;
        }

        const q = this.currentQuestions[this.currentIndex];
        this.progressText.textContent = `题目 ${this.currentIndex + 1} / ${this.currentQuestions.length}`;
        this.questionText.textContent = q.question;
        
        this.optionsContainer.innerHTML = '';
        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt.text;
            btn.onclick = () => this.handleAnswer(opt.type);
            this.optionsContainer.appendChild(btn);
        });
    }

    handleAnswer(type) {
        this.answers.push(type);
        this.currentIndex++;
        this.renderQuestion();
    }

    finishTest() {
        this.container.innerHTML = '<h3>正在分析你的心灵宇宙...</h3>';
        setTimeout(() => {
            // 恢复初始状态以便下次使用
            // this.resetView(); // 简化处理，暂不重置
            this.eventBus.emit('npti:completed', this.answers);
        }, 1000);
    }
}