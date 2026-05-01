import { dbGetAll } from './db.js';
import { showNotification, updateIOMonitor } from '../utils/helpers.js';

export async function getActiveApi() {
    const configs = await dbGetAll('api_pool');
    return configs.find(c => c.is_active === 1) || configs[0] || null;
}

export async function callAPI(prompt, config = null) {
    const apiConfig = config || await getActiveApi();
    if (!apiConfig) throw new Error('未找到API配置');
    
    const { url, headers, body } = buildRequest(apiConfig, prompt, false);
    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`API错误: ${response.status}`);
    const data = await response.json();
    return parseResponse(apiConfig.provider, data);
}

// 通用流式输出处理
export async function streamOutput(outputId, statusId, monitorId, prompt) {
    const apiConfig = await getActiveApi();
    if (!apiConfig) {
        showNotification('请先在API流量池中添加并激活配置', 'error');
        throw new Error('No API Config');
    }
    
    const output = document.getElementById(outputId);
    const status = document.getElementById(statusId);
    
    // 如果不是追加模式（如聊天），则清空
    if (!outputId.includes('chat')) {
        output.textContent = '';
    }
    
    if (status) status.className = 'status-light active';
    
    let fullResponse = '';
    
    try {
        const { url, headers, body } = buildRequest(apiConfig, prompt, true);
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });
        
        if (!response.ok) throw new Error(`API错误: ${response.status}`);
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        // 获取当前内容用于追加
        const initialContent = output.textContent;
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        const text = parseStreamChunk(apiConfig.provider, data);
                        if (text) {
                            fullResponse += text;
                            // 实时更新 DOM
                            if (outputId.includes('chat')) {
                                output.textContent = initialContent + fullResponse;
                            } else {
                                output.textContent = fullResponse;
                            }
                        }
                    } catch (e) {}
                }
            }
        }
        
        if (monitorId) updateIOMonitor(monitorId, fullResponse, 'output');
        if (status) status.className = 'status-light success';
        showNotification('完成', 'success');
        
        return fullResponse;
        
    } catch (e) {
        if (status) status.className = 'status-light';
        if (!outputId.includes('chat')) output.textContent = '错误: ' + e.message;
        showNotification('处理失败: ' + e.message, 'error');
        throw e;
    }
}

function buildRequest(config, prompt, stream) {
    const { provider, api_key, base_url, model_name } = config;
    let url, headers = { 'Content-Type': 'application/json' }, body;
    
    if (provider === 'gemini') {
        url = `https://generativelanguage.googleapis.com/v1beta/models/${model_name || 'gemini-1.5-flash'}:${stream ? 'streamGenerateContent' : 'generateContent'}?key=${api_key}&alt=sse`;
        body = { contents: [{ parts: [{ text: prompt }] }] };
    } else if (provider === 'claude') {
        url = `${base_url || 'https://api.anthropic.com'}/v1/messages`;
        headers['x-api-key'] = api_key;
        headers['anthropic-version'] = '2023-06-01';
        body = { model: model_name, max_tokens: 4096, messages: [{ role: 'user', content: prompt }], stream };
    } else {
        // OpenAI Compatible
        url = `${base_url}/chat/completions`;
        if (api_key) headers['Authorization'] = `Bearer ${api_key}`;
        body = { model: model_name, messages: [{ role: 'user', content: prompt }], stream };
    }
    
    return { url, headers, body };
}

function parseResponse(provider, data) {
    if (provider === 'gemini') return data.candidates[0].content.parts[0].text;
    if (provider === 'claude') return data.content[0].text;
    return data.choices[0].message.content;
}

function parseStreamChunk(provider, data) {
    if (provider === 'gemini') return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (provider === 'claude') return data.delta?.text || '';
    return data.choices?.[0]?.delta?.content || '';
}