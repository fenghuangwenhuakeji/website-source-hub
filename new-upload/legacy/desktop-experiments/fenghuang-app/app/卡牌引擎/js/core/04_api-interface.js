/*
 * 文件路径: /js/core/04_api-interface.js
 * 版本: V41.0 (源自“可变写作风格Gemini25pro优化版1.0”的稳定核心)
 * 描述: 【博士梦想实现版 - 移植核心】此代码为您的梦想专属定制。
 * 它直接采用了《可变写作风格优化版》中稳定运行的API接口逻辑，
 * 核心修正：确保了对Google Gemini API的调用使用了正确的 v1beta 版本，
 * 这将彻底解决您遇到的 "model not found for API version v1" 的致命错误。
 * 同时，它也完整保留了对Claude、OpenAI及其他多种模型的兼容性。
 */

const APIInterface = (() => {

    // --- 系统人格设定 (集中管理) ---
    const SYSTEM_PROMPTS = {
        logical: '你是一位严谨的逻辑分析师和剧本医生。你的回答必须结构清晰、注重事实和因果关系。',
        creative: '你是一位充满激情和想象力的艺术家和诗人。你的回答应该天马行空，富有创意和感染力。',
        critical: '你是一位经验丰富的批判性思维者和编辑。你的回答应该尖锐、深刻，能一针见血地指出问题所在。',
        balanced: '你是一位可靠、全面、乐于助人的AI助手。你的回答应该既有逻辑又不失启发性。'
    };

    async function sendMessage(prompt, personality, isJsonMode = false) {
        const settings = APISettings.getSettings();
        const provider = settings.provider || 'gemini';
        const apiKey = settings.apiKey || '';
        let baseUrl = settings.baseUrl || '';
        const customModelName = settings.model || settings.modelName || '';
        
        let endpoint = '';
        let headers = { 'Content-Type': 'application/json' };
        let body = {};
        const systemPrompt = SYSTEM_PROMPTS[personality] || SYSTEM_PROMPTS['balanced'];

        console.log(`正在使用 [${provider}] 服务进行AI交互... (JSON模式: ${isJsonMode})`);

        try {
            switch (provider) {
                case 'gemini':
                    const geminiModel = settings.geminiModel || 'gemini-1.5-flash';
                    if (!apiKey) throw new Error("请在设置中配置您的 Google Gemini API Key。");
                    
                    // --- 博士核心修正：API版本使用 v1beta，与原始优化版完全一致，解决模型找不到的问题 ---
                    endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
                    
                    body = { 
                        contents: [{ parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }] 
                    };
                    if (isJsonMode) {
                        body.generationConfig = { responseMimeType: "application/json" };
                    }
                    break;
                
                case 'claude':
                    if (!apiKey) throw new Error("请配置 Claude API Key。");
                    const claudeModel = settings.claudeModel || 'claude-3-opus-20240229';
                    baseUrl = baseUrl || 'https://api.anthropic.com';
                    endpoint = `${baseUrl.replace(/\/+$/, '')}/v1/messages`;
                    headers['x-api-key'] = apiKey;
                    headers['anthropic-version'] = '2023-06-01';
                    body = {
                        model: claudeModel,
                        system: systemPrompt,
                        max_tokens: 4096,
                        messages: [{ role: "user", content: prompt }]
                    };
                     if (isJsonMode) {
                        let finalPrompt = prompt + "\n\n请严格以JSON格式返回，不要包含任何额外的解释或文本。";
                        body.messages = [{ role: "user", content: finalPrompt }];
                    }
                    break;

                case 'openai':
                case 'openai_compat':
                case 'deepseek':
                case 'siliconflow':
                case 'ollama':
                case 'custom':
                    let finalEndpoint;
                    let finalModel;

                    if (provider === 'openai') {
                        if (!apiKey) throw new Error("请配置 OpenAI API Key。");
                        finalEndpoint = 'https://api.openai.com/v1/chat/completions';
                        finalModel = 'gpt-4-turbo'; 
                        headers['Authorization'] = `Bearer ${apiKey}`;
                    } else if (provider === 'openai_compat') {
                        if (!baseUrl || !customModelName) throw new Error("请配置 OpenAI 兼容 API 的 Base URL 和模型名称。");
                        finalEndpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
                        finalModel = customModelName;
                        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
                    } else if (provider === 'deepseek') {
                        if (!apiKey) throw new Error("请配置 DeepSeek API Key。");
                        finalEndpoint = 'https://api.deepseek.com/chat/completions';
                        finalModel = settings.deepseekModel || 'deepseek-chat';
                        headers['Authorization'] = `Bearer ${apiKey}`;
                    } else if (provider === 'siliconflow') {
                        if (!apiKey) throw new Error("请配置 Silicon Flow API Key。");
                        if (!customModelName) throw new Error("请为 Silicon Flow 配置模型名称。");
                        finalEndpoint = 'https://api.siliconflow.cn/v1/chat/completions';
                        finalModel = customModelName;
                        headers['Authorization'] = `Bearer ${apiKey}`;
                    } else { // ollama & custom
                        if (!baseUrl || !customModelName) throw new Error("请配置自定义API Base URL和模型名称。");
                        finalEndpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
                        finalModel = customModelName;
                        if (provider === 'custom' && apiKey) {
                            headers['Authorization'] = `Bearer ${apiKey}`;
                        }
                    }
                    
                    endpoint = finalEndpoint;
                    body = { 
                        model: finalModel, 
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: prompt }
                        ] 
                    };
                    if (isJsonMode) {
                        body.response_format = { type: "json_object" };
                    }
                    break;

                default:
                    throw new Error(`未知的API服务商: ${provider}`);
            }

            const response = await fetch(endpoint, { method: 'POST', headers: headers, body: JSON.stringify(body) });

            if (!response.ok) {
                return await _handleError(response);
            }

            const data = await response.json();
            let content;

            if (provider === 'gemini') {
                content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            } else if (provider === 'claude') {
                content = data.content?.[0]?.text;
            } else {
                content = data.choices?.[0]?.message?.content;
            }

            if (content === undefined || content === null) {
                console.error("完整API响应:", data);
                throw new Error('未能从API响应中提取有效内容。');
            }
            
            return content.trim();

        } catch (error) {
            console.error('API 调用失败:', error);
            return { error: `AI交互失败: ${error.message}` };
        }
    }
    
    // --- 通用错误处理 ---
    async function _handleError(response) {
        try {
            const errorData = await response.json();
            const errorMessage = errorData.error?.message || errorData.detail || `HTTP ${response.status}: ${response.statusText}`;
            console.error("API 错误:", errorData);
            return { error: `API请求失败: ${errorMessage}` };
        } catch (e) {
            console.error("无法解析API错误响应:", response.statusText);
            return { error: `API请求失败: HTTP ${response.status} ${response.statusText}` };
        }
    }

    // --- 暴露sendMessage方法 ---
    return { sendMessage };
})();