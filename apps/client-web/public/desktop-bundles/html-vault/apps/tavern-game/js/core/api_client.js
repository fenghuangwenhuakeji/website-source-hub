export class APIClient {
    constructor(dbManager) { this.db = dbManager; }

    async getActiveConfig() {
        const configs = await this.db.getAll('api_pool');
        return configs.find(c => c.is_active === 1) || configs[0] || null;
    }

    async call(prompt) {
        const config = await this.getActiveConfig();
        if (!config) throw new Error('未配置API');
        const { url, headers, body } = this.buildRequest(config, prompt);
        const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        if (!response.ok) throw new Error(`API错误: ${response.status}`);
        const data = await response.json();
        return this.parseResponse(config.provider, data);
    }

    buildRequest(config, prompt) {
        const { provider, api_key, base_url, model_name } = config;
        let url, headers = { 'Content-Type': 'application/json' }, body;
        
        if (provider === 'gemini') {
            url = `https://generativelanguage.googleapis.com/v1beta/models/${model_name || 'gemini-1.5-flash'}:generateContent?key=${api_key}`;
            body = { contents: [{ parts: [{ text: prompt }] }] };
        } else if (provider === 'claude') {
            url = `${base_url || 'https://api.anthropic.com'}/v1/messages`;
            headers['x-api-key'] = api_key;
            headers['anthropic-version'] = '2023-06-01';
            body = { model: model_name, max_tokens: 4096, messages: [{ role: 'user', content: prompt }] };
        } else {
            url = `${base_url}/chat/completions`;
            if (api_key) headers['Authorization'] = `Bearer ${api_key}`;
            body = { model: model_name, messages: [{ role: 'user', content: prompt }] };
        }
        return { url, headers, body };
    }

    parseResponse(provider, data) {
        if (provider === 'gemini') return data.candidates[0].content.parts[0].text;
        if (provider === 'claude') return data.content[0].text;
        return data.choices[0].message.content;
    }
}