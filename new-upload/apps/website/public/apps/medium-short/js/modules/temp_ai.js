const AI = {
    async getActiveConfig(type = 'text') {
        const configs = await DB.getAll(`${type}_api_pool`);
        return configs.find(c => c.is_active === 1) || configs[0] || null;
    },
    async generate(prompt, config = {}, onChunk) {
        const apiConfig = config.useModel ? config.useModel : await AI.getActiveConfig('text');
        
        if (!apiConfig) {
            let mock = "【模拟输出】请先在设置中配置API流量池。\n" + prompt.slice(0, 50) + "...";
            let i=0; const t = setInterval(() => { onChunk(mock[i]||''); i++; if(i>=mock.length) clearInterval(t); }, 10);
            return;
        }

        try {
            const { url, headers, body } = AI.buildRequest(apiConfig, prompt, true);
            const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
            
            if (!res.ok) throw new Error(`API Error: ${res.status}`);

            const reader = res.body.getReader();
            const dec = new TextDecoder();
            while(true) {
                const {done, value} = await reader.read();
                if(done) break;
                const chunk = dec.decode(value);
                const lines = chunk.split('\n');
                for(const line of lines) {
                    if(line.startsWith('data: ') && line!=='data: [DONE]') {
                        try {
                            const json = JSON.parse(line.slice(6));
                            const txt = AI.parseStreamChunk(apiConfig.provider, json);
                            if(txt) onChunk(txt);
                        } catch(e){}
                    }
                }
            }
        } catch(e) {
            onChunk(`[Error: ${e.message}]`);
        }
    },
    buildRequest(config, prompt, stream) {
        const { provider, api_key, base_url, model_name } = config;
        let url, headers = { 'Content-Type': 'application/json' }, body;
        
        if (provider === 'gemini') {
            url = `https://generativelanguage.googleapis.com/v1beta/models/${model_name || 'gemini-1.5-flash'}:${stream ? 'streamGenerateContent' : 'generateContent'}?key=${api_key}`;
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
        if (provider === 'claude') return data.delta?.text || '';
        return data.choices?.[0]?.delta?.content || '';
    }
};
