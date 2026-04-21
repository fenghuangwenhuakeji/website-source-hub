export class NPTIUI {
    constructor(container, nptiModule, onComplete) {
        this.container = container;
        this.npti = nptiModule;
        this.onComplete = onComplete;
        this.currentStep = 0;
        this.questions = this.npti.getQuestions();
    }

    render() {
        if (this.currentStep >= this.questions.length) {
            this.showResult();
            return;
        }

        const q = this.questions[this.currentStep];
        // 适配 questions.js 字段: question (题目), options[].text (选项文本)
        // 兼容处理：优先使用 question 字段，没有则回退到 text
        const questionText = q.question || q.text;
        
        this.container.innerHTML = `
            <div class="npti-card">
                <h3>测评进行中 (${this.currentStep + 1}/${this.questions.length})</h3>
                <p class="question-text">${questionText}</p>
                <div class="options-list">
                    ${q.options.map((opt, idx) => 
                        `<button class="option-btn" data-idx="${idx}">${opt.text || opt.label}</button>`
                    ).join('')}
                </div>
            </div>
        `;

        // 重新绑定事件
        this.container.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.idx);
                this.npti.submitAnswer(q.id, idx);
                this.currentStep++;
                this.render();
            });
        });
    }

    showResult() {
        const result = this.npti.calculateResult();
        this.container.innerHTML = `
            <div class="npti-result">
                <h3>测评完成！</h3>
                <p>你的人格类型是：</p>
                <h2 style="color: var(--primary-color); font-size: 2rem; margin: 1rem 0;">${result}</h2>
                <p>根据你的年龄段 (${this.npti.group})，我们为你推荐了专属的虚拟伙伴。</p>
                <div style="margin-top: 2rem;">
                    <button id="back-chat-btn" class="nav-btn">去聊天</button>
                </div>
            </div>
        `;
        
        const backBtn = this.container.querySelector('#back-chat-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (this.onComplete) this.onComplete(result);
            });
        }
    }
}