/**
 * 心理测试模块 - 合并版本（非ES模块）
 * 解决file://协议下的CORS问题
 */

class TestPage {
    constructor() {
        this.currentCategory = 'all';
        this.currentTest = null;
        this.currentQuestionIndex = 0;
        this.answers = [];
        
        this.initUI();
        this.bindEvents();
    }

    initUI() {
        this.loadTests();
    }

    loadTests() {
        const grid = document.querySelector('#test-grid');
        if (!grid) return;

        const tests = this.getMockTests();
        
        grid.innerHTML = tests.map(test => `
            <div class="test-card" data-test-id="${test.id}">
                <div class="test-card-header">
                    <div class="test-card-icon">${test.icon}</div>
                    <div class="test-card-title">${test.name}</div>
                </div>
                <div class="test-card-desc">${test.description}</div>
                <div class="test-card-meta">
                    <span>📝 ${test.questionCount}题</span>
                    <span>⏱️ 约${test.duration}分钟</span>
                </div>
            </div>
        `).join('');
    }

    getMockTests() {
        return [
            { id: 'npti', name: 'NPTI人格测试', description: '探索你的人格类型，了解内心真实的自己', icon: '🎭', category: 'personality', questionCount: 20, duration: 5 },
            { id: 'stress', name: '压力指数测试', description: '评估你当前的压力水平，找到缓解方法', icon: '😓', category: 'emotion', questionCount: 15, duration: 3 },
            { id: 'career', name: '职业倾向测试', description: '发现适合你的职业方向，规划未来发展', icon: '💼', category: 'career', questionCount: 25, duration: 8 },
            { id: 'relationship', name: '人际关系测试', description: '了解你在人际交往中的模式和特点', icon: '👥', category: 'relationship', questionCount: 18, duration: 4 },
            { id: 'anxiety', name: '焦虑程度测试', description: '测量你的焦虑水平，获取专业建议', icon: '😰', category: 'emotion', questionCount: 20, duration: 5 },
            { id: 'mbti', name: 'MBTI性格测试', description: '经典性格测试，了解你的性格类型', icon: '🧩', category: 'personality', questionCount: 60, duration: 15 }
        ];
    }

    bindEvents() {
        const categoryList = document.querySelector('#category-list');
        categoryList?.addEventListener('click', (e) => {
            const li = e.target.closest('li');
            if (li) {
                this.currentCategory = li.dataset.category;
                categoryList.querySelectorAll('li').forEach(el => el.classList.remove('active'));
                li.classList.add('active');
                this.filterTests();
            }
        });

        const grid = document.querySelector('#test-grid');
        grid?.addEventListener('click', (e) => {
            const card = e.target.closest('.test-card');
            if (card) this.startTest(card.dataset.testId);
        });

        document.querySelector('#prev-btn')?.addEventListener('click', () => this.prevQuestion());
        document.querySelector('#next-btn')?.addEventListener('click', () => this.nextQuestion());
        document.querySelector('#retake-btn')?.addEventListener('click', () => this.retakeTest());
        document.querySelector('#back-list-btn')?.addEventListener('click', () => this.backToList());
    }

    filterTests() {
        const cards = document.querySelectorAll('.test-card');
        const tests = this.getMockTests();
        cards.forEach(card => {
            const testId = card.dataset.testId;
            const test = tests.find(t => t.id === testId);
            if (test) {
                card.style.display = (this.currentCategory === 'all' || test.category === this.currentCategory) ? 'block' : 'none';
            }
        });
    }

    startTest(testId) {
        this.currentTest = this.getMockTests().find(t => t.id === testId);
        if (!this.currentTest) return;

        this.currentQuestionIndex = 0;
        this.answers = [];

        document.querySelector('#test-list-view').style.display = 'none';
        document.querySelector('#test-taking-view').style.display = 'block';
        document.querySelector('#test-result-view').style.display = 'none';

        this.loadQuestion();
    }

    loadQuestion() {
        const questions = this.getMockQuestions(this.currentTest.id);
        const question = questions[this.currentQuestionIndex];

        const progress = ((this.currentQuestionIndex + 1) / questions.length) * 100;
        document.querySelector('#progress-fill').style.width = `${progress}%`;
        document.querySelector('#progress-text').textContent = `${this.currentQuestionIndex + 1} / ${questions.length}`;
        document.querySelector('#question-text').textContent = question.text;

        const optionsList = document.querySelector('#options-list');
        optionsList.innerHTML = question.options.map((option, index) => `
            <div class="option-item ${this.answers[this.currentQuestionIndex] === index ? 'selected' : ''}" data-index="${index}">
                ${option}
            </div>
        `).join('');

        optionsList.querySelectorAll('.option-item').forEach(item => {
            item.addEventListener('click', () => this.selectOption(parseInt(item.dataset.index)));
        });

        document.querySelector('#prev-btn').disabled = this.currentQuestionIndex === 0;
        document.querySelector('#next-btn').textContent = this.currentQuestionIndex === questions.length - 1 ? '提交' : '下一题';
    }

    getMockQuestions(testId) {
        return [
            { text: '在社交场合中，你通常感觉如何？', options: ['非常自在', '比较自在', '有些紧张', '非常紧张'] },
            { text: '面对压力时，你倾向于？', options: ['主动解决', '寻求帮助', '独自思考', '逃避问题'] },
            { text: '你认为自己是？', options: ['理想主义者', '现实主义者', '介于两者之间', '不确定'] },
            { text: '在做决定时，你更依赖？', options: ['逻辑分析', '直觉感受', '他人建议', '随机决定'] },
            { text: '你更喜欢哪种工作方式？', options: ['独立工作', '团队协作', '两者皆可', '视情况而定'] }
        ];
    }

    selectOption(index) {
        this.answers[this.currentQuestionIndex] = index;
        document.querySelectorAll('.option-item').forEach((item, i) => {
            item.classList.toggle('selected', i === index);
        });
    }

    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.loadQuestion();
        }
    }

    nextQuestion() {
        const questions = this.getMockQuestions(this.currentTest.id);
        if (this.answers[this.currentQuestionIndex] === undefined) {
            alert('请选择一个选项');
            return;
        }

        if (this.currentQuestionIndex < questions.length - 1) {
            this.currentQuestionIndex++;
            this.loadQuestion();
        } else {
            this.submitTest();
        }
    }

    submitTest() {
        const result = this.calculateResult();
        document.querySelector('#test-taking-view').style.display = 'none';
        document.querySelector('#test-result-view').style.display = 'block';
        document.querySelector('#result-icon').textContent = result.icon;
        document.querySelector('#result-title').textContent = result.title;
        document.querySelector('#result-score').textContent = `${result.score}分`;
        document.querySelector('#result-description').textContent = result.description;
        document.querySelector('#result-details').innerHTML = result.details;
    }

    calculateResult() {
        const totalScore = this.answers.reduce((sum, ans) => sum + (ans || 0) * 25, 0);
        const normalizedScore = Math.min(100, Math.max(0, totalScore / this.answers.length));

        return {
            icon: '🎯',
            title: `${this.currentTest.name}结果`,
            score: Math.round(normalizedScore),
            description: this.getResultDescription(normalizedScore),
            details: `<h4>详细分析</h4><ul><li>你的回答显示你有较强的自我认知能力</li><li>在压力管理方面还有提升空间</li><li>建议多关注自己的情绪变化</li></ul>`
        };
    }

    getResultDescription(score) {
        if (score >= 80) return '表现优秀，各项指标均衡发展良好！';
        if (score >= 60) return '整体良好，仍有提升空间。';
        if (score >= 40) return '需要关注，建议进行更多自我探索。';
        return '建议寻求专业帮助，进行深入咨询。';
    }

    retakeTest() { this.startTest(this.currentTest.id); }

    backToList() {
        document.querySelector('#test-list-view').style.display = 'block';
        document.querySelector('#test-taking-view').style.display = 'none';
        document.querySelector('#test-result-view').style.display = 'none';
        this.currentTest = null;
        this.currentQuestionIndex = 0;
        this.answers = [];
    }
}

window.addEventListener('DOMContentLoaded', () => { new TestPage(); });