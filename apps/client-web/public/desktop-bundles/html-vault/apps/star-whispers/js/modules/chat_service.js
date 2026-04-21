import { ContentFilter } from '../security/content_filter.js';

export class ChatService {
    constructor(ageGroup = 'adult') {
        this.filter = new ContentFilter(ageGroup);
        this.history = [];
    }

    setAgeGroup(ageGroup) {
        this.filter.setPolicy(ageGroup);
    }

    async sendMessage(userMessage) {
        // 1. 安全检查
        if (!this.filter.check(userMessage)) {
            return {
                success: false,
                text: "抱歉，包含不适合当前年龄段的内容。",
                sender: 'system'
            };
        }

        // 2. 记录历史
        this.history.push({ text: userMessage, sender: 'user' });

        // 3. 模拟 AI 回复 (实际应调用 LLM 接口)
        const reply = await this.mockAIResponse(userMessage);
        
        this.history.push({ text: reply, sender: 'ai' });
        
        return {
            success: true,
            text: reply,
            sender: 'ai'
        };
    }

    async mockAIResponse(message) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(`我听到了你的心声：“${message}”。作为你的星语伙伴，我会一直陪伴你。`);
            }, 1000);
        });
    }
}
