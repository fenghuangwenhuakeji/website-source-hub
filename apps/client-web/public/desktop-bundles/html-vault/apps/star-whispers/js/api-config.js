/**
 * API配置管理模块
 * 支持OpenAI和Gemini等大模型API
 */

const API_CONFIG_KEY = 'xingyuxinban_api_config';

// 默认API配置
const defaultConfig = {
    provider: 'openai', // openai, gemini, custom
    name: '',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    isActive: false
};

// API管理器
const ApiManager = {
    // 获取所有API配置
    getConfigs() {
        try {
            const configs = localStorage.getItem(API_CONFIG_KEY);
            return configs ? JSON.parse(configs) : [];
        } catch (e) {
            console.error('获取API配置失败:', e);
            return [];
        }
    },

    // 保存API配置
    saveConfigs(configs) {
        try {
            localStorage.setItem(API_CONFIG_KEY, JSON.stringify(configs));
            return true;
        } catch (e) {
            console.error('保存API配置失败:', e);
            return false;
        }
    },

    // 添加新配置
    addConfig(config) {
        const configs = this.getConfigs();
        const newConfig = {
            ...defaultConfig,
            ...config,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
        };
        configs.push(newConfig);
        this.saveConfigs(configs);
        return newConfig;
    },

    // 更新配置
    updateConfig(id, updates) {
        const configs = this.getConfigs();
        const index = configs.findIndex(c => c.id === id);
        if (index !== -1) {
            configs[index] = { ...configs[index], ...updates };
            this.saveConfigs(configs);
            return configs[index];
        }
        return null;
    },

    // 删除配置
    deleteConfig(id) {
        const configs = this.getConfigs();
        const filtered = configs.filter(c => c.id !== id);
        this.saveConfigs(filtered);
        return true;
    },

    // 激活配置
    activateConfig(id) {
        const configs = this.getConfigs();
        configs.forEach(c => {
            c.isActive = c.id === id;
        });
        this.saveConfigs(configs);
        return configs.find(c => c.id === id);
    },

    // 获取当前激活的配置
    getActiveConfig() {
        const configs = this.getConfigs();
        return configs.find(c => c.isActive) || null;
    },

    // 构建API请求
    buildRequest(config, messages, stream = true) {
        const baseUrl = config.baseUrl.replace(/\/$/, '');
        let url, headers, body;

        if (config.provider === 'openai' || config.provider === 'custom') {
            url = `${baseUrl}/chat/completions`;
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            };
            body = {
                model: config.model,
                messages: messages,
                stream: stream
            };
        } else if (config.provider === 'gemini') {
            url = `${baseUrl}/${config.model}:streamGenerateContent?key=${config.apiKey}&alt=sse`;
            headers = { 'Content-Type': 'application/json' };
            // Gemini格式转换
            const contents = messages.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));
            body = { contents };
        }

        return { url, headers, body };
    },

    // 处理流式响应块 - 简化版本，参考WriterCenterArchon实现
    processStreamChunk(chunk, config, buffer) {
        let content = '';
        // 将新数据追加到缓冲区
        buffer.data += chunk;
        
        // 按换行符分割
        const lines = buffer.data.split('\n');
        // 保留最后一个可能不完整的行
        buffer.data = lines.pop() || '';
        
        for (const line of lines) {
            // 跳过空行
            if (!line.trim()) continue;
            
            // 处理 SSE 格式: data: {...}
            if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6).trim();
                if (jsonStr === '[DONE]' || jsonStr === '') continue;
                
                try {
                    const json = JSON.parse(jsonStr);
                    const txt = this.parseStreamContent(config.provider, json);
                    if (txt) {
                        content += txt;
                        // 调试：打印每个解析出的内容片段
                        console.log('[Stream] Parsed chunk:', txt);
                    }
                } catch (e) {
                    // JSON解析失败，可能是数据不完整
                    console.warn('[Stream] Parse failed:', e.message, '| Data:', jsonStr?.slice(0, 100));
                }
            } else if (line.startsWith('data:')) {
                // 处理没有空格的情况
                const jsonStr = line.slice(5).trim();
                if (jsonStr === '[DONE]' || jsonStr === '') continue;
                
                try {
                    const json = JSON.parse(jsonStr);
                    const txt = this.parseStreamContent(config.provider, json);
                    if (txt) {
                        content += txt;
                        console.log('[Stream] Parsed chunk:', txt);
                    }
                } catch (e) {
                    console.warn('[Stream] Parse failed:', e.message);
                }
            }
        }
        
        return content;
    },
    
    // 解析流式内容 - 统一处理函数
    parseStreamContent(provider, json) {
        if (provider === 'gemini') {
            return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
        if (provider === 'claude') {
            return json.delta?.text || '';
        }
        // OpenAI 兼容格式 (包括 custom)
        return json.choices?.[0]?.delta?.content || '';
    },

    // 调用LLM API - 完全参考WriterCenterArchon的简洁实现
    async callLLM(messages, onStream, options = {}) {
        const config = this.getActiveConfig();
        
        if (!config) {
            throw new Error('请先在设置中配置并激活API');
        }

        if (!config.apiKey) {
            throw new Error('API Key未配置');
        }

        const { url, headers, body } = this.buildRequest(config, messages, !!onStream);
        
        // 非流式调用
        if (!onStream) {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                // 检查是否是HTML错误页面或纯文本错误
                if (errorText.startsWith('<') || errorText.startsWith('Internal')) {
                    throw new Error(`API错误: ${response.status} - 服务器内部错误，请检查API配置`);
                }
                throw new Error(`API错误: ${response.status} - ${errorText.slice(0, 200)}`);
            }
            
            // 先获取文本，再尝试解析JSON
            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('[API] JSON解析失败，响应内容:', responseText.slice(0, 200));
                throw new Error('API返回格式错误，请检查API是否正确配置');
            }
            
            if (config.provider === 'openai' || config.provider === 'custom') {
                return data.choices?.[0]?.message?.content || '';
            } else if (config.provider === 'gemini') {
                return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            }
            return '';
        }

        // 流式响应 - 完全参考WriterCenterArchon的实现
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            // 检查是否是HTML错误页面或纯文本错误
            if (errorText.startsWith('<') || errorText.startsWith('Internal')) {
                throw new Error(`API错误: ${response.status} - 服务器内部错误，请检查API配置`);
            }
            throw new Error(`API错误: ${response.status} - ${errorText.slice(0, 200)}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                        const json = JSON.parse(line.slice(6));
                        const txt = this.parseStreamContent(config.provider, json);
                        if (txt) {
                            fullContent += txt;
                            // 调用回调更新UI
                            onStream(txt, fullContent);
                        }
                    } catch (e) {
                        // 解析失败，忽略
                    }
                }
            }
        }

        return fullContent;
    },

    // 验证API配置
    async testConfig(config) {
        const testMessages = [{ role: 'user', content: '你好，请回复"测试成功"' }];
        const { url, headers, body } = this.buildRequest(config, testMessages, false);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                return { success: false, error: `API错误: ${response.status}` };
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// 导出到全局
window.ApiManager = ApiManager;
