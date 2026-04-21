/**
 * LLM API 配置管理器
 * 支持多种 AI 服务商的配置和管理
 */
class LLMConfigManager {
    constructor() {
        this.configs = [];
        this.activeConfigId = null;
        this.storageKey = 'dungeonspire_llm_configs';
        this.activeKey = 'dungeonspire_llm_active';
        
        // 支持的服务商
        this.providers = [
            { id: 'custom', name: '自定义 / OpenAI 兼容', icon: '🔧', defaultUrl: '' },
            { id: 'openai', name: 'OpenAI', icon: '🤖', defaultUrl: 'https://api.openai.com/v1' },
            { id: 'anthropic', name: 'Anthropic Claude', icon: '🧠', defaultUrl: 'https://api.anthropic.com/v1' },
            { id: 'google', name: 'Google Gemini', icon: '💎', defaultUrl: 'https://generativelanguage.googleapis.com/v1beta' },
            { id: 'deepseek', name: 'DeepSeek', icon: '🔍', defaultUrl: 'https://api.deepseek.com/v1' },
            { id: 'zhipu', name: '智谱 GLM', icon: '🧩', defaultUrl: 'https://open.bigmodel.cn/api/paas/v4' },
            { id: 'qwen', name: '通义千问', icon: '☁️', defaultUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
            { id: 'moonshot', name: 'Moonshot', icon: '🌙', defaultUrl: 'https://api.moonshot.cn/v1' },
            { id: 'ollama', name: 'Ollama 本地', icon: '🏠', defaultUrl: 'http://localhost:11434/v1' },
            { id: 'groq', name: 'Groq', icon: '⚡', defaultUrl: 'https://api.groq.com/openai/v1' },
            { id: 'together', name: 'Together AI', icon: '🤝', defaultUrl: 'https://api.together.xyz/v1' }
        ];
        
        this.loadConfigs();
    }

    // 加载配置
    loadConfigs() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                this.configs = JSON.parse(saved);
            }
            this.activeConfigId = localStorage.getItem(this.activeKey);
        } catch (e) {
            console.warn('Failed to load LLM configs:', e);
            this.configs = [];
        }
    }

    // 保存配置
    saveConfigs() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.configs));
        if (this.activeConfigId) {
            localStorage.setItem(this.activeKey, this.activeConfigId);
        } else {
            localStorage.removeItem(this.activeKey);
        }
    }

    // 添加配置
    addConfig(config) {
        const newConfig = {
            id: 'config_' + Date.now(),
            name: config.name || '未命名配置',
            provider: config.provider || 'custom',
            baseUrl: config.baseUrl || '',
            apiKey: config.apiKey || '',
            modelId: config.modelId || '',
            createdAt: new Date().toISOString()
        };
        this.configs.push(newConfig);
        this.saveConfigs();
        return newConfig;
    }

    // 更新配置
    updateConfig(id, updates) {
        const index = this.configs.findIndex(c => c.id === id);
        if (index !== -1) {
            this.configs[index] = { ...this.configs[index], ...updates };
            this.saveConfigs();
            return this.configs[index];
        }
        return null;
    }

    // 删除配置
    deleteConfig(id) {
        const index = this.configs.findIndex(c => c.id === id);
        if (index !== -1) {
            this.configs.splice(index, 1);
            if (this.activeConfigId === id) {
                this.activeConfigId = null;
            }
            this.saveConfigs();
            return true;
        }
        return false;
    }

    // 激活配置
    activateConfig(id) {
        const config = this.configs.find(c => c.id === id);
        if (config) {
            this.activeConfigId = id;
            this.saveConfigs();
            return config;
        }
        return null;
    }

    // 获取当前激活的配置
    getActiveConfig() {
        return this.configs.find(c => c.id === this.activeConfigId);
    }

    // 获取所有配置
    getAllConfigs() {
        return this.configs;
    }

    // 获取服务商信息
    getProvider(providerId) {
        return this.providers.find(p => p.id === providerId);
    }

    // 测试连接
    async testConnection(config) {
        try {
            const response = await this.sendRequest(config, [
                { role: 'user', content: 'Hello, this is a test message. Please respond with "OK".' }
            ], { maxTokens: 10 });
            
            return { success: true, message: '连接成功！', response };
        } catch (error) {
            return { success: false, message: error.message || '连接失败' };
        }
    }

    // 发送请求到 LLM
    async sendRequest(config, messages, options = {}) {
        const { baseUrl, apiKey, modelId, provider } = config;
        
        if (!baseUrl || !apiKey || !modelId) {
            throw new Error('配置不完整');
        }

        // 构建请求
        const requestBody = {
            model: modelId,
            messages: messages,
            max_tokens: options.maxTokens || 2048,
            temperature: options.temperature || 0.7
        };

        // 根据服务商调整请求格式
        let endpoint = `${baseUrl}/chat/completions`;
        let headers = {
            'Content-Type': 'application/json'
        };

        // 不同服务商的认证方式
        if (provider === 'anthropic') {
            headers['x-api-key'] = apiKey;
            headers['anthropic-version'] = '2023-06-01';
        } else {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        console.log('[LLM] Sending request to:', endpoint);
        console.log('[LLM] Request body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        console.log('[LLM] Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[LLM] Error response:', errorData);
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('[LLM] Full response data:', JSON.stringify(data, null, 2));
        
        // 尝试多种响应格式
        let content = '';
        
        // OpenAI 格式
        if (data.choices?.[0]?.message?.content) {
            content = data.choices[0].message.content;
        }
        // OpenAI 旧格式
        else if (data.choices?.[0]?.text) {
            content = data.choices[0].text;
        }
        // Anthropic 格式
        else if (data.content?.[0]?.text) {
            content = data.content[0].text;
        }
        // Google Gemini 原生格式
        else if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            content = data.candidates[0].content.parts[0].text;
        }
        // 简单响应格式
        else if (data.response) {
            content = data.response;
        }
        else if (data.output) {
            content = data.output;
        }
        else if (data.text) {
            content = data.text;
        }
        else if (data.message) {
            content = typeof data.message === 'string' ? data.message : data.message.content;
        }
        // 如果还是找不到，尝试遍历查找
        else if (typeof data === 'string') {
            content = data;
        }
        
        console.log('[LLM] Extracted content:', content);
        
        if (!content) {
            console.warn('[LLM] Could not extract content from response. Full data:', data);
        }
        
        return content;
    }

    // 使用当前激活配置发送消息
    async chat(messages, options = {}) {
        const config = this.getActiveConfig();
        if (!config) {
            throw new Error('没有激活的 API 配置');
        }
        return this.sendRequest(config, messages, options);
    }
}
