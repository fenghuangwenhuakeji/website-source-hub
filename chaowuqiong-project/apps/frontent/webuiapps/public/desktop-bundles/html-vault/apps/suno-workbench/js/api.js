import { db } from './db.js';

const providerDefaults = {
    openai: { base_url: 'https://api.openai.com/v1', model_name: 'gpt-4o' },
    claude: { base_url: 'https://api.anthropic.com', model_name: 'claude-3-5-sonnet-20241022' },
    gemini: { base_url: '', model_name: 'gemini-1.5-flash' },
    deepseek: { base_url: 'https://api.deepseek.com/v1', model_name: 'deepseek-chat' },
    moonshot: { base_url: 'https://api.moonshot.cn/v1', model_name: 'moonshot-v1-8k' },
    zhipu: { base_url: 'https://open.bigmodel.cn/api/paas/v4', model_name: 'glm-4' },
    qwen: { base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model_name: 'qwen-turbo' },
    custom: { base_url: '', model_name: '' }
};

const providerModels = {
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    claude: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    gemini: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'],
    deepseek: ['deepseek-chat', 'deepseek-coder'],
    moonshot: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    zhipu: ['glm-4', 'glm-4-flash', 'glm-3-turbo'],
    qwen: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-max-longcontext'],
    custom: []
};

export const apiClient = {
    async getActiveConfig() {
        const configs = await db.getAll('api_pool');
        return configs.find(c => c.is_active === 1) || configs[0] || null;
    },

    buildRequest(config, prompt, stream = true) {
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
            url = `${base_url}/chat/completions`;
            if (api_key) headers['Authorization'] = `Bearer ${api_key}`;
            body = { model: model_name, messages: [{ role: 'user', content: prompt }], stream };
        }
        return { url, headers, body };
    },

    parseStreamChunk(provider, data) {
        if (provider === 'gemini') return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (provider === 'claude') {
            if (data.type === 'content_block_delta') return data.delta?.text || '';
            if (data.delta?.text) return data.delta.text;
            return '';
        }
        return data.choices?.[0]?.delta?.content || '';
    },

    parseResponse(provider, data) {
        if (provider === 'gemini') return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (provider === 'claude') return data.content?.[0]?.text || '';
        return data.choices?.[0]?.message?.content || '';
    },

    async call(prompt, config = null) {
        const apiConfig = config || await this.getActiveConfig();
        if (!apiConfig) throw new Error('未找到API配置，请先在设置中添加API');
        
        const { url, headers, body } = this.buildRequest(apiConfig, prompt, false);
        const response = await fetch(url, { 
            method: 'POST', 
            headers, 
            body: JSON.stringify(body) 
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) throw new Error('API认证失败，请检查API Key');
            if (response.status === 429) throw new Error('API请求频率超限，请稍后重试');
            throw new Error(`API错误: ${response.status}`);
        }
        
        const data = await response.json();
        return this.parseResponse(apiConfig.provider, data);
    },

    async streamCall(prompt, onChunk, config = null) {
        const apiConfig = config || await this.getActiveConfig();
        if (!apiConfig) throw new Error('未找到API配置，请先在设置中添加API');
        
        const { url, headers, body } = this.buildRequest(apiConfig, prompt, true);
        const response = await fetch(url, { 
            method: 'POST', 
            headers, 
            body: JSON.stringify(body) 
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) throw new Error('API认证失败');
            if (response.status === 429) throw new Error('请求频率超限');
            throw new Error(`API错误: ${response.status}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        const text = this.parseStreamChunk(apiConfig.provider, data);
                        if (text) {
                            fullResponse += text;
                            if (onChunk) onChunk(text, fullResponse);
                        }
                    } catch (e) {
                        // 忽略解析错误
                    }
                }
            }
        }
        
        return fullResponse;
    },

    async testConnection(config) {
        try {
            const result = await this.call('Hello, respond with "OK"', config);
            return { success: true, message: `连接成功！响应: ${result.substring(0, 50)}...` };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    getDefaults(provider) {
        return providerDefaults[provider] || providerDefaults.custom;
    },

    getModels(provider) {
        return providerModels[provider] || [];
    }
};

export const sunoPrompts = {
    generateLyrics: (theme, style, mood) => `你是一位专业的歌词创作大师。请根据以下要求创作一首完整的歌词：

主题：${theme}
风格：${style}
情绪：${mood}

要求：
1. 包含完整的歌曲结构：[Intro]、[Verse]、[Pre-Chorus]、[Chorus]、[Bridge]、[Outro]
2. 歌词要有韵律感和押韵
3. 情感真挚，画面感强
4. 副歌部分要有记忆点

请直接输出歌词内容：`,

    improveLyrics: (lyrics, suggestions) => `你是一位歌词润色专家。请根据以下建议改进歌词：

原歌词：
${lyrics}

改进建议：${suggestions}

请输出改进后的完整歌词：`,

    generatePrompt: (settings) => `你是一位Suno AI音乐生成专家。请根据以下设置生成一个专业的Suno提示词：

风格：${settings.genre || '未指定'}
情绪：${settings.mood || '未指定'}
人声：${settings.vocals || '未指定'}
速度：${settings.bpm || 100} BPM
乐器：${settings.instruments?.join(', ') || '未指定'}
参考艺术家：${settings.referenceArtist || '无'}
额外描述：${settings.customDescription || '无'}

请生成一个简洁、专业的Suno提示词（不超过200字符），直接输出提示词内容：`,

    analyzeLyrics: (lyrics) => `你是一位音乐分析专家。请分析以下歌词的结构和情感：

${lyrics}

请从以下方面分析：
1. 歌曲结构分析
2. 情感曲线
3. 押韵模式
4. 改进建议

请输出分析结果：`
};
