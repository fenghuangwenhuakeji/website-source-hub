import { CONFIG } from '../core/config.js';

/**
 * 多模型智能路由服务
 * 负责根据用户特征选择最合适的 AI 模型进行响应
 */
export class LLMService {
    constructor() {
        this.models = {
            child: { name: 'Q-Kid', style: 'playful', safetyLevel: 'high' },
            teen: { name: 'Q-Teen', style: 'empathetic', safetyLevel: 'medium' },
            adult: { name: 'Q-Pro', style: 'analytical', safetyLevel: 'standard' }
        };
    }

    /**
     * 发送消息并获取回复
     * @param {string} message 用户消息
     * @param {Object} userContext 用户上下文 { ageGroup, constellation, name }
     * @returns {Promise<string>}
     */
    async chat(message, userContext) {
        const modelConfig = this._routeModel(userContext.ageGroup);
        console.log(`[LLM Router] Routing to model: ${modelConfig.name} for group: ${userContext.ageGroup}`);

        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1000));

        return this._generateMockResponse(message, userContext, modelConfig);
    }

    _routeModel(ageGroup) {
        if (ageGroup === 'CHILD') return this.models.child;
        if (ageGroup === 'TEEN') return this.models.teen;
        return this.models.adult;
    }

    _generateMockResponse(input, user, config) {
        const responses = {
            CHILD: [
                `哇！${input} 听起来好有趣！就像${user.constellation}的星星一样闪亮！✨`,
                `我们要不要一起把这个画下来？🎨`,
                `我也觉得呢！你真是个聪明的孩子！`
            ],
            TEEN: [
                `我懂这种感觉，${input}... 有时候我也觉得挺迷茫的。`,
                `根据${user.constellation}的运势，这周确实容易情绪波动，别太担心。`,
                `这听起来挺酷的，但也要注意安全哦。`
            ],
            ADULT: [
                `关于“${input}”，这反映了你近期可能不仅面临外部压力，还有内在的探索需求。`,
                `从心理学角度看，这种感受是完全正常的。我们可以试着拆解一下这个问题。`,
                `作为${user.constellation}，你可能倾向于独自承担，但适度倾诉是有益的。`
            ]
        };

        const pool = responses[user.ageGroup] || responses.ADULT;
        return pool[Math.floor(Math.random() * pool.length)];
    }
}