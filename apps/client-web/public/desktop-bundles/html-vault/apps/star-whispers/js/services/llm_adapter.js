/**
 * LLM Adapter Interface
 * 负责统一不同大模型的调用接口，并实现路由策略
 */
export class LLMAdapter {
    constructor() {
        this.models = {
            child: 'warm-companion-v1', // 模拟：适合儿童的模型
            teen: 'empathy-guide-v2',   // 模拟：适合青少年的模型
            adult: 'deep-analyst-v3'    // 模拟：适合成人的模型
        };
    }

    /**
     * 发送消息给 AI
     * @param {string} message 用户消息
     * @param {object} context 上下文（包含年龄、历史记录等）
     * @returns {Promise<string>} AI 回复
     */
    async sendMessage(message, context) {
        const model = this._routeModel(context.age);
        console.log(`Routing to model: ${model} for age ${context.age}`);
        
        // 模拟网络延迟
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(this._mockResponse(model));
            }, 1000);
        });
    }

    _routeModel(age) {
        if (age < 12) return this.models.child;
        if (age < 18) return this.models.teen;
        return this.models.adult;
    }

    _mockResponse(model) {
        const responses = {
            'warm-companion-v1': '哇！这听起来真棒！要不要画下来给我看？',
            'empathy-guide-v2': '我能理解你的感受，这种时候确实挺让人困惑的。',
            'deep-analyst-v3': '从心理学角度看，这反映了你对当前环境的某种焦虑映射。'
        };
        return responses[model] || '我在这里陪着你。';
    }
}