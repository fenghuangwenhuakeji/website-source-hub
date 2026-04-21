// 文件路径: js/core/03_API接口.js
// V79.1 统一 API 配置模块 - 所有功能已迁移到 main.js
// 此文件保留以兼容旧代码引用，实际功能由主窗口统一管理

window.App = window.App || {};
App.api = App.api || {};

// 获取 API 配置（从主窗口或 localStorage）
function getApiConfig() {
    // 优先从主窗口获取
    if (window.parent && window.parent.App && window.parent.App.apiConfig) {
        return window.parent.App.apiConfig;
    }
    // 否则从 localStorage 获取
    return JSON.parse(localStorage.getItem('genesis_api_config') || '{}');
}

// 调用 API（使用主窗口配置）
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

// 暴露到全局
App.api.callApi = callApi;
App.api.getApiConfig = getApiConfig;

// 向后兼容的旧函数名
window.getApiConfig = getApiConfig;
window.callApi = callApi;
