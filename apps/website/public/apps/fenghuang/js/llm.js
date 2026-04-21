/**
 * 调用大语言模型 (LLM) API 的核心函数
 * @param {Array<object>} messages - 发送给模型的聊天消息数组 (例如, [{ role: 'user', content: '你好' }])
 * @param {object} [options={}] - 可选参数，如 temperature, max_tokens 等
 * @returns {Promise<string>} - 返回模型的文本响应
 */
async function callLLM(messages, options = {}) {
    try {
        const globalSettings = await getSettings();
        if (!globalSettings.activeConfigId) {
            throw new Error('没有激活的模型配置。请在“大模型设置”页面选择一个配置并“设为默认”。');
        }

        const activeConfig = await getModelConfig(globalSettings.activeConfigId);
        if (!activeConfig || !activeConfig.llm || !activeConfig.llm.apiKey || !activeConfig.llm.baseUrl) {
            throw new Error('激活的模型配置不完整。请检查其API Key和Base URL。');
        }

        const { apiKey, baseUrl, modelName } = activeConfig.llm;
        const temperature = options.temperature || 0.7; // 允许覆盖默认值
        const maxTokens = options.maxTokens || 8192; // 允许覆盖默认值

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        };

        const body = JSON.stringify({
            model: modelName,
            messages: messages,
            temperature: parseFloat(options.temperature || temperature),
            max_tokens: parseInt(options.maxTokens || maxTokens),
            stream: false // 流式传输将在后续实现
        });

        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: headers,
            body: body
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('LLM API 错误:', errorData);
            throw new Error(`API 请求失败，状态码: ${response.status}. ${errorData.error?.message || ''}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error('调用LLM失败:', error);
        // 将错误信息传递给UI层进行显示
        throw error;
    }
}