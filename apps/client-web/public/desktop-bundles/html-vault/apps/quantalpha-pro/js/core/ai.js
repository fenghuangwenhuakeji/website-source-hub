// ═══════════════════════════════════════════════════════════════
// QuantAlpha Pro - AI 服务核心
// ═══════════════════════════════════════════════════════════════

const AI = {
    // ═══ 配置 ═══
    config: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        maxTokens: 4096,
        temperature: 0.7
    },

    // ═══ 初始化 ═══
    init: async () => {
        const saved = await DB.get('api_configs', 'ai');
        if (saved) {
            AI.config = { ...AI.config, ...saved };
        }
    },

    // ═══ 保存配置 ═══
    saveConfig: async (cfg) => {
        AI.config = { ...AI.config, ...cfg };
        await DB.put('api_configs', { id: 'ai', ...AI.config });
        UI.toast('AI配置已保存');
    },

    // ═══ 核心调用方法 ═══
    chat: async (messages, options = {}) => {
        const { model = AI.config.model, temperature = AI.config.temperature, maxTokens = AI.config.maxTokens, stream = false, onChunk = null } = options;
        
        if (!AI.config.apiKey) {
            UI.toast('请先配置 API Key', 'error');
            return null;
        }

        try {
            const provider = AI.config.provider;
            let url, headers, body;

            if (provider === 'openai' || provider === 'deepseek' || provider === 'custom') {
                url = `${AI.config.baseUrl}/chat/completions`;
                headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI.config.apiKey}` };
                body = JSON.stringify({ model, messages, temperature, max_tokens: maxTokens, stream });
            } else if (provider === 'anthropic') {
                url = `${AI.config.baseUrl}/messages`;
                headers = { 'Content-Type': 'application/json', 'x-api-key': AI.config.apiKey, 'anthropic-version': '2023-06-01' };
                body = JSON.stringify({ model, messages: messages.map(m => ({ role: m.role, content: m.content })), temperature, max_tokens: maxTokens, stream });
            } else if (provider === 'google') {
                url = `${AI.config.baseUrl}/models/${model}:${stream ? 'streamGenerateContent' : 'generateContent'}?key=${AI.config.apiKey}`;
                headers = { 'Content-Type': 'application/json' };
                const contents = messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));
                body = JSON.stringify({ contents, generationConfig: { temperature, maxOutputTokens: maxTokens } });
            }

            if (stream && onChunk && provider === 'openai') {
                return await AI._streamChat(url, headers, body, onChunk);
            }

            const res = await fetch(url, { method: 'POST', headers, body });
            
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error?.message || `HTTP ${res.status}`);
            }

            const data = await res.json();
            
            if (provider === 'openai' || provider === 'deepseek' || provider === 'custom') {
                return data.choices?.[0]?.message?.content || '';
            } else if (provider === 'anthropic') {
                return data.content?.[0]?.text || '';
            } else if (provider === 'google') {
                return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            }
            
            return data;
        } catch (e) {
            console.error('AI chat error:', e);
            UI.toast('AI调用失败: ' + e.message, 'error');
            return null;
        }
    },

    // ═══ 流式调用 ═══
    _streamChat: async (url, headers, body, onChunk) => {
        const res = await fetch(url, { method: 'POST', headers, body });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(l => l.trim().startsWith('data:'));
            
            for (const line of lines) {
                const data = line.replace('data:', '').trim();
                if (data === '[DONE]') continue;
                try {
                    const json = JSON.parse(data);
                    const content = json.choices?.[0]?.delta?.content || '';
                    if (content) {
                        fullContent += content;
                        onChunk(content, fullContent);
                    }
                } catch {}
            }
        }
        
        return fullContent;
    },

    // ═══ 量化专用提示词模板 ═══
    prompts: {
        strategyAnalysis: (code, language = 'python') => `
你是一位专业的量化交易策略分析师。请分析以下${language}策略代码，从以下维度进行评估：

1. **策略逻辑**：核心交易逻辑是什么？使用了哪些因子/信号？
2. **风险特征**：可能的风险点有哪些？最大回撤风险？
3. **优化建议**：可以如何改进？有哪些潜在问题？
4. **适用场景**：适合什么市场环境？什么品种？

\`\`\`${language}
${code}
\`\`\`

请用中文回答，提供专业的量化分析视角。
`,

        generateStrategy: (description, style = 'trend') => `
你是一位专业量化策略开发工程师。请根据以下需求生成一个完整的Python量化策略：

**策略描述**：${description}
**策略风格**：${style === 'trend' ? '趋势跟踪' : style === 'meanrev' ? '均值回归' : style === 'arbitrage' ? '套利' : '多因子'}

请生成包含以下内容的完整策略代码：
1. 策略参数定义
2. 信号生成逻辑
3. 仓位管理
4. 风控逻辑
5. 回测框架示例

使用Python格式，并添加详细注释。
`,

        factorAnalysis: (factorData, returns) => `
你是一位量化因子分析师。请分析以下因子的有效性：

因子数据：${JSON.stringify(factorData.slice(0, 10))}...
收益率数据：${JSON.stringify(returns.slice(0, 10))}...

请分析：
1. 因子的IC值及其统计显著性
2. 因子的单调性
3. 因子的换手率特征
4. 与常见风格因子的相关性
5. 因子改进建议
`,

        explainCode: (code) => `
请解释以下量化代码的作用和逻辑，使用中文：

\`\`\`
${code}
\`\`\`

解释要包含：
1. 代码的主要功能
2. 核心算法/公式
3. 输入输出说明
4. 潜在的注意事项
`,

        riskReport: (metrics) => `
作为风险管理专家，请分析以下投资组合的风险指标并提供报告：

${JSON.stringify(metrics, null, 2)}

请提供：
1. 风险等级评估（低/中/高）
2. 各指标解读
3. 风险预警（如有）
4. 风险管理建议
`,

        marketCommentary: (data) => `
作为市场分析师，请根据以下市场数据撰写市场评论：

${JSON.stringify(data, null, 2)}

请包含：
1. 整体市场走势分析
2. 关键技术位分析
3. 资金流向解读
4. 后市展望
`
    },

    // ═══ 便捷方法 ═══
    analyzeStrategy: async (code, language = 'python') => {
        return await AI.chat([
            { role: 'system', content: '你是一位专业的量化交易策略分析师，擅长分析各类量化策略。' },
            { role: 'user', content: AI.prompts.strategyAnalysis(code, language) }
        ]);
    },

    generateStrategy: async (description, style = 'trend') => {
        return await AI.chat([
            { role: 'system', content: '你是一位专业量化策略开发工程师，精通Python量化开发。' },
            { role: 'user', content: AI.prompts.generateStrategy(description, style) }
        ]);
    },

    explainCode: async (code) => {
        return await AI.chat([
            { role: 'system', content: '你是一位量化代码专家，擅长解释各类量化代码。' },
            { role: 'user', content: AI.prompts.explainCode(code) }
        ]);
    }
};