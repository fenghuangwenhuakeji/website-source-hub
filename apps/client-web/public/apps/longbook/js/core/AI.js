import { DB } from './db.js';
import { UI } from '../modules/ui.js';

export const AI = {
    async getActiveConfig(type = 'text') {
        const configs = await DB.getAll(`${type}_api_pool`);
        // 假设数据结构中 is_active 是数字 1 或布尔值
        return configs.find(c => c.is_active == 1) || configs[0] || null;
    },

    async generate(prompt, config = {}, onChunk) {
        const apiConfig = config.useModel ? config.useModel : await AI.getActiveConfig('text');
        
        if (!apiConfig) {
            let mock = "【模拟输出】请先在设置中配置API流量池。\n" + prompt.slice(0, 50) + "...";
            let i = 0;
            const t = setInterval(() => {
                if (i >= mock.length) {
                    clearInterval(t);
                    return;
                }
                onChunk(mock[i] || '');
                i++;
            }, 10);
            return;
        }

        try {
            const { url, headers, body } = AI.buildRequest(apiConfig, prompt, true);
            const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
            
            if (!res.ok) throw new Error(`API Error: ${res.status}`);

            const reader = res.body.getReader();
            const dec = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = dec.decode(value, { stream: true });
                // 这里需要更复杂的 SSE 解析逻辑，暂时简化
                onChunk(chunk);
            }
        } catch (e) {
            console.error("AI Generation Error", e);
            UI.toast('AI 生成失败: ' + e.message, 'error');
        }
    },

    buildRequest(config, prompt, stream) {
        // 通用适配 OpenAI 格式
        let url = config.endpoint || 'https://api.openai.com/v1/chat/completions';
        let headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.api_key}`
        };
        let body = {
            model: config.model_name || 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            stream: stream
        };
        return { url, headers, body };
    }
};