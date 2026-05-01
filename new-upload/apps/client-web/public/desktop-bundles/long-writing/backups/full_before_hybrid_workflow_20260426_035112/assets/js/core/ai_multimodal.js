// ai_multimodal.js — 多模态API桥接 (Multimodal Bridge)
// 图像/视频/语音生成API调用封装
// 扩展 AI 对象，添加 generateImage / generateVideo / generateSpeech 方法
Object.assign(AI, {
    // ===== 图像生成 =====
    async generateImage(prompt, options = {}) {
        const config = await this.getActiveConfig('image');
        if (!config) {
            UI.toast('未配置图像API，请在设置→API卡池中添加', 'error');
            throw new Error('未配置图像API');
        }
        const { size = '1024x1024', style = '', n = 1 } = options;

        // 构建请求
        const { provider, api_key, base_url, model_name } = config;
        let url, headers = { 'Content-Type': 'application/json' }, body;

        if (provider === 'gemini') {
            url = `https://generativelanguage.googleapis.com/v1beta/models/${model_name || 'gemini-1.5-flash'}:generateContent?key=${api_key}`;
            body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: {} };
        } else if (provider === 'dalle' || base_url?.includes('openai')) {
            url = `${base_url || 'https://api.openai.com/v1'}/images/generations`;
            if (api_key) headers['Authorization'] = `Bearer ${api_key}`;
            body = { model: model_name || 'dall-e-3', prompt, n, size };
        } else {
            // 通用SD API兼容
            url = `${base_url}/images/generations`;
            if (api_key) headers['Authorization'] = `Bearer ${api_key}`;
            body = { model: model_name, prompt, n, size };
        }

        try {
            UI.toast('正在生成图像...', 'info');
            const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            const data = await res.json();
            // 解析图像URL
            let imageUrl = '';
            if (data.data && data.data[0]) {
                imageUrl = data.data[0].url || data.data[0].b64_json || '';
            } else if (data.candidates && data.candidates[0]) {
                imageUrl = data.candidates[0].content?.parts?.[0]?.inlineData?.data || '';
            }
            UI.toast('图像生成完成 ✓', 'success');
            return { url: imageUrl, data };
        } catch(e) {
            UI.toast('图像生成失败: ' + e.message, 'error');
            throw e;
        }
    },

    // ===== 视频生成 =====
    async generateVideo(imagePrompt, motionDesc, options = {}) {
        const config = await this.getActiveConfig('video');
        if (!config) {
            UI.toast('未配置视频API，请在设置→API卡池中添加', 'error');
            throw new Error('未配置视频API');
        }
        const { duration = 5 } = options;
        const { provider, api_key, base_url, model_name } = config;

        // 视频生成API通常需要先生成图像或接受图像+动作描述
        // 这里提供通用封装，实际URL根据API文档调整
        let url = `${base_url}/videos/generations`;
        const headers = { 'Content-Type': 'application/json' };
        if (api_key) headers['Authorization'] = `Bearer ${api_key}`;
        const body = { model: model_name, prompt: imagePrompt + ', ' + motionDesc, duration };

        try {
            UI.toast('正在生成视频...', 'info');
            const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            const data = await res.json();
            UI.toast('视频生成完成 ✓', 'success');
            return data;
        } catch(e) {
            UI.toast('视频生成失败: ' + e.message, 'error');
            throw e;
        }
    },

    // ===== 语音合成 =====
    async generateSpeech(text, options = {}) {
        const config = await this.getActiveConfig('audio');
        if (!config) {
            UI.toast('未配置音频API，请在设置→API卡池中添加', 'error');
            throw new Error('未配置音频API');
        }
        const { voice = 'alloy', speed = 1.0, emotion = 'neutral' } = options;
        const { provider, api_key, base_url, model_name } = config;

        let url, headers = { 'Content-Type': 'application/json' }, body;

        if (provider === 'azure' || base_url?.includes('azure')) {
            url = `${base_url}/cognitiveservices/v1`;
            headers['Ocp-Apim-Subscription-Key'] = api_key;
            headers['X-Microsoft-OutputFormat'] = 'audio-16khz-128kbitrate-mono-mp3';
            body = `<speak version='1.0' xml:lang='zh-CN'><voice xml:lang='zh-CN' name='${voice}'>${text}</voice></speak>`;
            headers['Content-Type'] = 'application/ssml+xml';
        } else {
            // OpenAI TTS / 兼容API
            url = `${base_url || 'https://api.openai.com/v1'}/audio/speech`;
            if (api_key) headers['Authorization'] = `Bearer ${api_key}`;
            body = { model: model_name || 'tts-1', input: text, voice, speed };
        }

        try {
            UI.toast('正在合成语音...', 'info');
            const res = await fetch(url, { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) });
            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            const blob = await res.blob();
            const audioUrl = URL.createObjectURL(blob);
            UI.toast('语音合成完成 ✓', 'success');
            return { url: audioUrl, blob };
        } catch(e) {
            UI.toast('语音合成失败: ' + e.message, 'error');
            throw e;
        }
    },

    // ===== 检查是否配置了某类API =====
    async hasConfig(type) {
        const config = await this.getActiveConfig(type);
        return !!config;
    }
});
