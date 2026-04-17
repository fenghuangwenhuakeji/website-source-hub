export default class NPTIManager {
    constructor(app) {
        this.app = app;
        this.isAssessing = false;
        this.currentQuestionIndex = 0;
        this.answers = [];
        
        // 简易版测评题库
        this.questions = [
            "【Q1】 周末到了，你更倾向于：\nA. 在家看书/打游戏\nB. 和朋友出去聚会",
            "【Q2】 遇到困难时，你通常：\nA. 独自思考解决方案\nB. 寻求他人的建议",
            "【Q3】 做决定时，你更看重：\nA. 逻辑和事实\nB. 感受和价值观"
        ];

        this.bindEvents();
    }

    bindEvents() {
        const btn = document.getElementById('btn-start-npti');
        if (btn) {
            btn.addEventListener('click', () => this.startAssessment());
        }
    }

    startAssessment() {
        this.isAssessing = true;
        this.currentQuestionIndex = 0;
        this.answers = [];
        this.app.chatManager.addMessage('ai', "🧩 欢迎开始 NPTI 人格测评！请回答下列问题（输入 A 或 B）：");
        setTimeout(() => {
            this.askNextQuestion();
        }, 500);
    }

    askNextQuestion() {
        if (this.currentQuestionIndex < this.questions.length) {
            this.app.chatManager.addMessage('ai', this.questions[this.currentQuestionIndex]);
        } else {
            this.finishAssessment();
        }
    }

    handleUserAnswer(text) {
        // 简单的输入校验
        const answer = text.toUpperCase().trim();
        // 记录答案
        this.answers.push(answer);
        
        this.currentQuestionIndex++;
        setTimeout(() => {
            this.askNextQuestion();
        }, 500);
    }

    finishAssessment() {
        this.isAssessing = false;
        // 简单的结果计算逻辑
        const score = this.answers.filter(a => a.includes('A')).length;
        let resultType = score > 1 ? "理性独立型 (INTJ)" : "情感社交型 (ESFP)";
        
        this.app.chatManager.addMessage('ai', `🎉 测评完成！\n你的 NPTI 人格类型可能是：【${resultType}】\n我们将根据此结果为你调整陪伴风格。`);
        
        // 保存结果到用户上下文
        this.app.userContext.personality = resultType;
    }
}