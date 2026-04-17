// 文件路径: js/core/03_API接口.js
// V79.1 统一配置版 - 使用主窗口API配置

window.App = window.App || {};
App.api = App.api || {};

let _cachedApiConfig = null;

function getApiConfig() {
    if (_cachedApiConfig) return _cachedApiConfig;
    const stored = localStorage.getItem('genesis_api_config');
    if (stored) {
        try {
            _cachedApiConfig = JSON.parse(stored);
            return _cachedApiConfig;
        } catch (e) {}
    }
    return {};
}

window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'api-config-update') {
        _cachedApiConfig = event.data.config;
        localStorage.setItem('genesis_api_config', JSON.stringify(event.data.config));
        console.log('API 配置已从主窗口同步');
    }
});

window.parent?.postMessage({ type: 'get-api-config' }, '*');

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
    console.log('5.50完全体: 使用主窗口统一API配置');
}

App.api.callApi = callApi;
App.api.getApiConfig = getApiConfig;
window.callApi = callApi;
window.getApiConfig = getApiConfig;
