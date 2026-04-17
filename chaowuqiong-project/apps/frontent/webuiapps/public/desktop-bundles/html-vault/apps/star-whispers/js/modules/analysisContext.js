import { eventBus } from '../core/eventBus.js';
import { userContext } from './userContext.js';

// 模拟不同年龄段的题目库
const QUESTIONS = {
    child: [
        { id: 1, text: "如果去冒险，你更想带谁去？", options: ["勇敢的小狗", "聪明的猫头鹰"] },
        { id: 2, text: "看到朋友哭了，你会？", options: ["给糖果", "静静陪着"] }
    ],
    teen: [
        { id: 1, text: "在团队作业中，你通常担任什么角色？", options: ["领导者", "执行者", "协调者"] },
        { id: 2, text: "面对考试失利，你的第一反应是？", options: ["愤怒", "沮丧", "分析原因"] }
    ],
    adult: [
        { id: 1, text: "在职场决策中，你更倾向于？", options: ["数据驱动", "直觉判断", "团队共识"] },
        { id: 2, text: "周末休息时，你更喜欢？", options: ["独处充电", "社交聚会", "户外运动"] }
    ]
};

class AnalysisContext {
    constructor() {
        this.init();
    }

    init() {
        // 监听进入测评模块的事件
        eventBus.on('module:switch', (name) => {
            if (name === 'analysis') this.renderQuiz();
        });
    }

    getQuestions() {
        const user = userContext.getCurrentUser();
        return QUESTIONS[user.ageGroup] || QUESTIONS.adult;
    }

    renderQuiz() {
        console.log('渲染 NPTI 测评界面...');
        // 这里仅做逻辑演示，实际应渲染 DOM 到 content-area
        const questions = this.getQuestions();
        console.log(`加载了 ${questions.length} 道适合 ${userContext.getCurrentUser().ageGroup} 的题目`);
    }
}

export const analysisContext = new AnalysisContext();