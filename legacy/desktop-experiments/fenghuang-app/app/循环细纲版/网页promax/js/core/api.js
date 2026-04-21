// 文件路径: 网页promax/js/core/api.js
// 描述: 负责处理所有与后端AI服务的API通信。

/**
 * 初始化API设置模态框的事件监听和功能。
 */
function initializeApiSettingsModal() {
    const modal = document.getElementById('api-settings-modal');
    if (!modal) return;
    const openBtn = document.getElementById('settings-btn');
    const closeBtn = modal.querySelector('.close-btn');
    
    openBtn.addEventListener('click', () => modal.classList.add('visible'));
    closeBtn.addEventListener('click', () => modal.classList.remove('visible'));
    modal.addEventListener('click', (e) => { if (e.target === modal) { modal.classList.remove('visible'); } });
    
    document.getElementById('save-settings-btn').addEventListener('click', saveAndCloseSettings);
    document.getElementById('api-provider').addEventListener('change', updateApiSettingsVisibility);
    loadSettings();
}

/**
 * 根据选择的API服务商，更新设置界面中需要显示的输入框。
 */
function updateApiSettingsVisibility() {
    const provider = document.getElementById("api-provider").value;
    const needsApiKey = ['gemini', 'openai', 'deepseek', 'siliconflow', 'claude', 'custom'].includes(provider);
    document.getElementById("api-key-group").classList.toggle("hidden", !needsApiKey);
    
    const needsBaseUrl = ['ollama', 'custom', 'claude'].includes(provider);
    document.getElementById("api-base-url-group").classList.toggle("hidden", !needsBaseUrl);
    
    const needsModelName = ['ollama', 'custom', 'siliconflow'].includes(provider);
    document.getElementById("api-model-name-group").classList.toggle("hidden", !needsModelName);

    document.getElementById("api-gemini-model-group").classList.toggle("hidden", provider !== 'gemini');
    document.getElementById("api-deepseek-model-group").classList.toggle("hidden", provider !== 'deepseek');
    document.getElementById("api-claude-model-group").classList.toggle("hidden", provider !== 'claude');
}

/**
 * 从localStorage加载已保存的API设置到模态框中。
 */
async function loadSettings() {
    const settingsMap = {
        'api_provider': 'gemini',
        'api_key': '',
        'api_base_url': '',
        'api_model_name': '',
        'gemini_model': 'gemini-1.5-flash',
        'deepseek_model': 'deepseek-chat',
        'claude_model': 'claude-3-opus-20240229',
        'context_length': '10'
    };
    for (const [key, defaultValue] of Object.entries(settingsMap)) {
        const value = await window.appDB.getSetting(key);
        const elementId = key.replace(/_/g, '-');
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value !== undefined ? value : defaultValue;
        }
    }
    updateApiSettingsVisibility();
}

/**
 * 保存API设置到localStorage并关闭模态框。
 */
async function saveAndCloseSettings() {
    try {
        const settingsToSave = [
            'api_provider', 'api_key', 'api_base_url', 'api_model_name',
            'gemini_model', 'deepseek_model', 'claude_model', 'context_length'
        ];
        for (const key of settingsToSave) {
            const elementId = key.replace(/_/g, '-');
            const element = document.getElementById(elementId);
            if (element) {
                const value = element.value;
                await window.appDB.saveSetting(key, value);
            } else {
                console.warn(`[saveAndCloseSettings] 警告: 未找到ID为 "${elementId}" 的元素，跳过保存。`);
            }
        }
        
        const modal = document.getElementById("api-settings-modal");
        if (modal) {
            modal.classList.remove('visible');
        }
        showNotification("API设置已成功保存到数据库！", "success");
    } catch (error) {
        console.error("保存API设置失败:", error);
        showNotification(`保存API设置失败: ${error.message}`, "error");
    }
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
                        const claudeModel = await window.appDB.getSetting('claude_model') || 'claude-3-haiku-20240307';
                        baseUrl = baseUrl || 'https://api.anthropic.com';
                        endpoint = `${baseUrl.replace(/\/+$/, '')}/v1/messages`;
                        headers['x-api-key'] = apiKey;
                        headers['anthropic-version'] = '2023-06-01';
                        body.model = claudeModel;
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
                        body.model = await window.appDB.getSetting('deepseek_model') || 'deepseek-chat';
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
                            } else { // OpenAI, DeepSeek, etc.
                                text = data.choices?.[0]?.delta?.content || '';
                            }
                            if (text) onChunk(text);
                        } catch (e) {
                            // 忽略不完整的JSON解析错误
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
            onComplete(true); // 传递一个标志，表示是用户中止的
        }
    }
}