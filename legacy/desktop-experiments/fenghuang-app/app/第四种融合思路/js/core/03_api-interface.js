/*
 * 创世纪引擎 V75.5 - URL修正版
 * 核心JS模块 3: AI 接口 (API Interface)
 * 职责: 封装与不同大模型 API 的通信逻辑，为所有模块提供统一的 callAI 函数。
 * ✨✨✨ (博士重构 - 最终修正) ✨✨✨
 * 1. 【核心修复】修复了在"自定义"和"Ollama"服务商模式下，程序会错误地在用户提供的 Base URL 后重复添加 /v1 或 /api/generate 的问题。
 * 2. 现在程序会智能判断用户输入的地址，并进行正确拼接，确保API请求的URL永远正确。
 */

let _cachedApiConfig = null;

function getUnifiedApiConfig() {
    if (_cachedApiConfig) return _cachedApiConfig;
    const stored = localStorage.getItem('genesis_api_config');
    if (stored) {
        _cachedApiConfig = JSON.parse(stored);
        return _cachedApiConfig;
    }
    return {
        provider: localStorage.getItem('api_provider') || 'gemini',
        apiKey: localStorage.getItem('api_key') || '',
        baseUrl: localStorage.getItem('api_base_url') || '',
        model: localStorage.getItem('api_model_name') || ''
    };
}

window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'api-config-update') {
        _cachedApiConfig = event.data.config;
        localStorage.setItem('genesis_api_config', JSON.stringify(event.data.config));
        console.log('API 配置已从主窗口同步');
    }
});

window.parent?.postMessage({ type: 'get-api-config' }, '*');

async function callAI(prompt, expectJson = false) {
    const config = getUnifiedApiConfig();
    const provider = config.provider || 'gemini';
    const apiKey = config.apiKey;
    let baseUrl = config.baseUrl;
    const customModel = config.model;

    if (!['ollama'].includes(provider) && !apiKey) {
        showNotification("API Key 未设置！请点击左下角"系统设置"进行配置。", "error");
        throw new Error("API Key is not set.");
    }

    let endpoint = '';
    let requestBody = {};
    const headers = { 'Content-Type': 'application/json' };

    try {
        switch (provider) {
            case 'gemini':
                const geminiModel = localStorage.getItem('gemini_model') || 'gemini-1.5-flash-latest';
                endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
                requestBody = {
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { maxOutputTokens: 8192, temperature: 0.7 }
                };
                if (expectJson) requestBody.generationConfig.responseMimeType = "application/json";
                break;

            case 'claude':
                const claudeModel = localStorage.getItem('claude_model') || 'claude-3-sonnet-20240229';
                endpoint = 'https://api.anthropic.com/v1/messages';
                headers['x-api-key'] = apiKey;
                headers['anthropic-version'] = '2023-06-01';
                requestBody = {
                    model: claudeModel,
                    max_tokens: 4096,
                    messages: [{ role: 'user', content: expectJson ? `${prompt}\n\n请严格以JSON格式返回你的回答，不要包含任何解释性文字或Markdown标记。` : prompt }]
                };
                break;
            
            case 'custom':
            case 'openai':
            case 'deepseek':
            case 'siliconflow':
            case 'ollama':
                let model, isChat = true;

                if (provider === 'openai') {
                    baseUrl = baseUrl || 'https://api.openai.com/v1';
                    model = 'gpt-4-turbo';
                } else if (provider === 'deepseek') {
                    baseUrl = baseUrl || 'https://api.deepseek.com';
                    model = localStorage.getItem('deepseek_model') || 'deepseek-chat';
                } else if (provider === 'siliconflow') {
                    baseUrl = baseUrl || 'https://api.siliconflow.cn/v1';
                    model = customModel || "deepseek-ai/DeepSeek-V2-Chat";
                } else if (provider === 'ollama') {
                    if (!baseUrl) throw new Error("Ollama Base URL is not set.");
                    isChat = false; // Ollama uses a different endpoint for non-chat completion
                    model = customModel || 'llama3:latest';
                } else { // custom
                    if (!baseUrl) throw new Error("Custom Base URL is not set.");
                    model = customModel || 'default-model';
                }

                // ✨✨✨ 核心URL拼接修复 ✨✨✨
                const cleanedBaseUrl = baseUrl.replace(/\/+$/, '');
                if (isChat) {
                    endpoint = cleanedBaseUrl.endsWith('/v1') 
                        ? `${cleanedBaseUrl}/chat/completions`
                        : `${cleanedBaseUrl}/v1/chat/completions`;
                    requestBody = {
                        model: model,
                        messages: [{ role: 'user', content: prompt }]
                    };
                    if (expectJson) requestBody.response_format = { "type": "json_object" };
                } else { // Ollama's generate endpoint
                     endpoint = `${cleanedBaseUrl}/api/generate`;
                     requestBody = { model: model, prompt: prompt, stream: false };
                     if(expectJson) requestBody.format = "json";
                }
                
                if (provider !== 'ollama' && apiKey) {
                    headers['Authorization'] = `Bearer ${apiKey}`;
                }
                break;

            default:
                throw new Error(`Unsupported API provider: ${provider}`);
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        const responseText = await response.text();
        if (!response.ok) {
            console.error('API Error Response:', responseText);
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = JSON.parse(responseText);
        
        let content = '';
        switch (provider) {
            case 'gemini':
                content = data.candidates[0]?.content?.parts[0]?.text || '';
                break;
            case 'claude':
                content = data.content[0]?.text || '';
                break;
            case 'ollama':
                content = data.response || '';
                break;
            default: // Handles openai, deepseek, custom, siliconflow
                content = data.choices[0]?.message?.content || '';
                break;
        }

        if (expectJson) {
            try {
                const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
                const jsonString = jsonMatch ? jsonMatch[1] : content;
                return JSON.parse(jsonString);
            } catch (e) {
                console.error("Failed to parse AI response as JSON:", content);
                throw new Error("AI did not return a valid JSON format.");
            }
        }
        return content;

    } catch (error) {
        console.error(`Error in callAI for provider ${provider}:`, error);
        throw error;
    }
}