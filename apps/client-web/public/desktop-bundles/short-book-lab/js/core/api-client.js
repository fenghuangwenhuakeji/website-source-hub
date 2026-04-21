const apiClient = {
    async getActiveConfig() {
        const configs = await db.getAll('api_pool');
        return configs.find(c => c.is_active === 1) || configs[0] || null;
    },

    buildRequest(config, prompt, stream) {
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
        if (provider === 'gemini') {
            return (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) || '';
        }
        if (provider === 'claude') {
            // Claude uses content_block_delta events
            if (data.type === 'content_block_delta') return (data.delta && data.delta.text) || '';
            if (data.delta && data.delta.text) return data.delta.text;
            return '';
        }
        return (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) || '';
    },

    parseResponse(provider, data) {
        if (provider === 'gemini') return data.candidates[0].content.parts[0].text;
        if (provider === 'claude') return data.content[0].text;
        return data.choices[0].message.content;
    },

    async call(prompt, config) {
        const apiConfig = config || await this.getActiveConfig();
        if (!apiConfig) throw new Error('未找到API配置');
        const { url, headers, body } = this.buildRequest(apiConfig, prompt, false);
        const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        if (!response.ok) throw new Error(`API错误: ${response.status}`);
        const data = await response.json();
        return this.parseResponse(apiConfig.provider, data);
    },

    // 流式调用方法
    async callStream(prompt, config, onChunk) {
        const apiConfig = config || await this.getActiveConfig();
        if (!apiConfig) throw new Error('未找到API配置');
        const { url, headers, body } = this.buildRequest(apiConfig, prompt, true);
        const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        if (!response.ok) throw new Error(`API错误: ${response.status}`);
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';
        
        while (true) {
            const chunk = await reader.read();
            if (chunk.done) break;
            buffer += decoder.decode(chunk.value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (let j = 0; j < lines.length; j++) {
                const line = lines[j].trim();
                if (!line || line === 'data: [DONE]') continue;
                if (line.indexOf('data: ') === 0) {
                    try {
                        const d = JSON.parse(line.slice(6));
                        const t = this.parseStreamChunk(apiConfig.provider, d);
                        if (t) {
                            fullText += t;
                            if (onChunk) onChunk(t);
                        }
                    } catch(x) {}
                }
            }
        }
        return fullText;
    }
};
