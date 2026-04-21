export class NPTISystem {
    constructor(eventBus) {
        this.bus = eventBus;
        this.questions = [
            { id: 1, text: "在聚会上，你通常会...", options: ["主动认识新朋友", "只跟熟人聊天"] },
            { id: 2, text: "遇到问题时，你更倾向于...", options: ["依靠直觉", "分析数据"] }
        ];
        // 监听启动测评事件
        this.bus.on('start-npti', () => this.startAssessment());
    }

    startAssessment() {
        console.log("Starting NPTI Assessment...");
        // 简单模拟：直接返回一个结果
        // 实际开发中应弹出模态框显示题目
        const mockResult = "ENFP (竞选者)";
        this.bus.emit('npti-completed', mockResult);
    }
}