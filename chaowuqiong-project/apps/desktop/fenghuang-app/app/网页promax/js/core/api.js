// 文件路径: 网页promax/js/core/api.js
// V79.1 统一配置版 - 使用主窗口API配置

window.App = window.App || {};
App.api = App.api || {};

function getApiConfig() {
    if (window.parent && window.parent.App && window.parent.App.apiConfig) {
        return window.parent.App.apiConfig;
    }
    return JSON.parse(localStorage.getItem('genesis_api_config') || '{}');
}

async function callApi(prompt, isJsonMode = false) {
    const config = getApiConfig();
    
    if (!config.apiKey) {
        throw new Error('请先在主窗口设置中配置 API Key');
    }

    const API_PRESETS = {
        'zhipu': 'https://open.bigmodel.cn/api/paas/v4',
        'volcark': 'https://ark.cn-beijing.volces.com/api/v3',
        'kimi': 'https://api.moonshot.cn/v1',
        'minimax': 'https://api.minimax.chat/v1',
        'deepseek': 'https://api.deepseek.com/v1',
        'baichuan': 'https://api.baichuan-ai.com/v1',
        'stepfun': 'https://api.stepfun.com/v1',
        'openai': 'https://api.openai.com/v1',
        'openai_compat': config.baseUrl || ''
    };

    const baseUrl = config.baseUrl || API_PRESETS[config.provider] || 'https://open.bigmodel.cn/api/paas/v4';
    const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

    const body = {
        model: config.model,
        messages: [{ role: 'user', content: prompt }]
    };

    if (isJsonMode) {
        body.response_format = { type: 'json_object' };
    }

    console.log(`正在使用 [${config.provider}] 服务进行AI交互...`);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API请求失败 (${response.status}): ${errorText.substring(0, 100)}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('未能从API响应中提取有效内容');
        }

        return content.trim();

    } catch (error) {
        console.error('API 调用失败:', error);
        if (typeof showNotification === 'function') {
            showNotification(`AI交互失败: ${error.message}`, 'error');
        }
        throw error;
    }
}

function initializeApiSettingsModal() {
    console.log('网页promax: 使用主窗口统一API配置');
}

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

async function callApiStream(prompt, signal, onChunk, onComplete, onError) {
    const config = getUnifiedApiConfig();
    const provider = config.provider || 'gemini';
    const apiKey = config.apiKey || '';
    let baseUrl = config.baseUrl || '';
    const modelName = config.model || '';
    let endpoint = '';
    let headers = { 'Content-Type': 'application/json' };
    let body = {};

    console.log(`正在通过 [${provider}] 核心进行流式通讯...`);

    try {
        switch (provider) {
            case 'gemini':
                if (!apiKey) throw new Error("请在设置中配置您的 Google Gemini API Key。");
                endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${apiKey}&alt=sse`;
                body = { contents: [{ parts: [{ text: prompt }] }] };
                break;
            
            case 'claude':
            case 'openai':
            case 'openai_compat':
            case 'deepseek':
            case 'siliconflow':
            case 'ollama':
            case 'custom':
                body = { messages: [{ role: "user", content: prompt }], stream: true };
                switch (provider) {
                    case 'claude':
                        if (!apiKey) throw new Error("请配置 Claude API Key。");
                        baseUrl = baseUrl || 'https://api.anthropic.com';
                        endpoint = `${baseUrl.replace(/\/+$/, '')}/v1/messages`;
                        headers['x-api-key'] = apiKey;
                        headers['anthropic-version'] = '2023-06-01';
                        body.model = 'claude-3-haiku-20240307';
                        body.max_tokens = 4096;
                        break;
                    case 'openai':
                        if (!apiKey) throw new Error("请配置 OpenAI API Key。");
                        endpoint = 'https://api.openai.com/v1/chat/completions';
                        body.model = 'gpt-4-turbo';
                        headers['Authorization'] = `Bearer ${apiKey}`;
                        break;
                    case 'openai_compat':
                        if (!baseUrl || !modelName) throw new Error("请配置 OpenAI 兼容 API 的 Base URL 和模型名称。");
                        const compatBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
                        endpoint = `${compatBaseUrl}/chat/completions`;
                        body.model = modelName;
                        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
                        break;
                    case 'deepseek':
                        if (!apiKey) throw new Error("请配置 DeepSeek API Key。");
                        endpoint = 'https://api.deepseek.com/chat/completions';
                        body.model = 'deepseek-chat';
                        headers['Authorization'] = `Bearer ${apiKey}`;
                        break;
                    case 'siliconflow':
                        if (!apiKey) throw new Error("请配置 Silicon Flow API Key。");
                        if (!modelName) throw new Error("请为 Silicon Flow 配置模型名称。");
                        endpoint = 'https://api.siliconflow.cn/v1/chat/completions';
                        body.model = modelName;
                        headers['Authorization'] = `Bearer ${apiKey}`;
                        break;
                    case 'ollama':
                    case 'custom':
                        if (!baseUrl || !modelName) throw new Error("请配置自定义API Base URL和模型名称。");
                        const finalBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
                        endpoint = `${finalBaseUrl}/chat/completions`;
                        body.model = modelName;
                        if (provider === 'custom' && apiKey) {
                            headers['Authorization'] = `Bearer ${apiKey}`;
                        }
                        break;
                }
                break;
            default:
                throw new Error(`未知的API服务商: ${provider}`);
        }

        const response = await fetch(endpoint, { method: 'POST', headers: headers, body: JSON.stringify(body), signal });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API请求失败 (${response.status}): ${errorText}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            
            let boundary = buffer.indexOf('\n\n');
            while(boundary !== -1) {
                const chunk = buffer.substring(0, boundary);
                buffer = buffer.substring(boundary + 2);
                
                if (chunk.includes('[DONE]')) {
                    onComplete();
                    return;
                }

                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const dataString = line.substring(6);
                            if (dataString.trim() === '[DONE]') {
                                onComplete();
                                return;
                            }
                            const data = JSON.parse(dataString);
                            let text = '';
                            if (provider === 'gemini') {
                                text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                            } else if (provider === 'claude' && data.type === 'content_block_delta') {
                                text = data.delta?.text;
                            } else {
                                text = data.choices?.[0]?.delta?.content || '';
                            }
                            if (text) onChunk(text);
                        } catch (e) {
                        }
                    }
                }
                boundary = buffer.indexOf('\n\n');
            }
        }
        onComplete();

    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('API Stream 调用失败:', error);
            onError(error);
        } else {
            console.log('Stream aborted by user.');
            onComplete(true);
        }
    }
}

window.callApi = callApi;
window.callApiStream = callApiStream;
window.getApiConfig = getApiConfig;
