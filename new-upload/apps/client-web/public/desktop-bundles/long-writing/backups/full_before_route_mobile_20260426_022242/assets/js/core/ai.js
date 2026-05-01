const AI = {
    async getActiveConfig(type = 'text') {
        try {
            const configs = await DB.getAll(`${type}_api_pool`);
            if (!configs || !Array.isArray(configs)) return null;
            if (type === 'text') {
                return configs.find(c => c.is_master === 1) || configs.find(c => c.is_active === 1) || configs[0] || null;
            }
            return configs.find(c => c.is_active === 1) || configs[0] || null;
        } catch(e) {
            console.error('[AI] Failed to get active config:', e);
            return null;
        }
    },
    // 当前活跃的AbortController集合，支持并发中止
    _abortControllers: new Set(),
    abort() {
        AI._abortControllers.forEach(ctrl => {
            try { ctrl.abort(); } catch(e) {}
        });
        AI._abortControllers.clear();
    },
    async generate(prompt, config = {}, onChunk) {
        // 兼容旧模块的调用顺序: AI.generate(prompt, onChunk, config)
        if (typeof config === 'function') {
            const legacyOnChunk = config;
            config = (onChunk && typeof onChunk === 'object') ? onChunk : {};
            onChunk = legacyOnChunk;
        }
        config = config || {};
        // 兼容无回调调用: const result = await AI.generate(prompt)
        if (!onChunk) {
            let fullText = '';
            await AI.generate(prompt, config, c => { fullText += c; });
            return fullText;
        }

        let apiConfig = config.useModel ? config.useModel : await AI.getActiveConfig('text');
        // 合并用户传入的配置（如 max_tokens, temperature）
        if (apiConfig && Object.keys(config).length > 0) {
            apiConfig = { ...apiConfig, ...config };
        }
        
        if (!apiConfig) {
            const errMsg = '⚠️ 未配置API流量池，请先在「系统设置」→「API流量池」中添加API密钥';
            if (typeof UI !== 'undefined') UI.toast(errMsg, 'error');
            throw new Error('未配置API，请先在设置中添加API密钥');
        }

        // AbortController: 支持外部中断
        const abortCtrl = new AbortController();
        AI._abortControllers.add(abortCtrl);

        const maxRetries = 5;
        if (typeof UI !== 'undefined') UI.toast('正在连接API...', 'info');
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            if (abortCtrl.signal.aborted) throw new Error('已中止');
            try {
                const { url, headers, body } = AI.buildRequest(apiConfig, prompt, true);
                console.log(`[AI] Request → ${apiConfig.provider} | model:${body.model||body.model_name||'-'} | max_tokens:${body.max_tokens||body.maxOutputTokens||'-'} | stream:${body.stream||body.streamGenerateContent||false} | prompt:${prompt.length}字`);
                
                const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: abortCtrl.signal });
                
                if (!res.ok) {
                    const errText = await res.text().catch(()=>'');
                    console.error(`[AI] API Error ${res.status}:`, errText.slice(0,500));
                    throw new Error(`API Error: ${res.status} ${errText.slice(0,200)}`);
                }

                if (attempt > 1 && typeof UI !== 'undefined') UI.toast('API连接成功 ✓', 'success');

                const contentType = res.headers.get('content-type') || '';
                const isSSE = contentType.includes('text/event-stream');
                let receivedAny = false;

                // ═══ 流式解析 (SSE) ═══
                if (isSSE || true) { // 大多数provider返回application/json但内容是SSE
                    const reader = res.body.getReader();
                    const dec = new TextDecoder();
                    let buffer = '';
                    let rawLines = []; // 调试用：收集原始行
                    while(true) {
                        if (abortCtrl.signal.aborted) { reader.cancel(); throw new Error('已中止'); }
                        const {done, value} = await reader.read();
                        if(done) break;
                        buffer += dec.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || ''; // 保留未完整的一行
                        for(const line of lines) {
                            if(line.startsWith('data: ') && line!=='data: [DONE]') {
                                rawLines.push(line.slice(6));
                                try {
                                    const json = JSON.parse(line.slice(6));
                                    const txt = AI.parseStreamChunk(apiConfig.provider, json);
                                    if(txt) { onChunk(txt); receivedAny = true; }
                                } catch(parseErr){ 
                                    // 某些行可能不是JSON，忽略
                                }
                            }
                        }
                    }
                    // 处理buffer中剩余的内容
                    if (buffer.startsWith('data: ') && buffer !== 'data: [DONE]') {
                        rawLines.push(buffer.slice(6));
                        try {
                            const json = JSON.parse(buffer.slice(6));
                            const txt = AI.parseStreamChunk(apiConfig.provider, json);
                            if(txt) { onChunk(txt); receivedAny = true; }
                        } catch(e){}
                    }
                    if (!receivedAny && rawLines.length > 0) {
                        console.warn('[AI] 流式解析失败。原始返回样例（前3行）:', rawLines.slice(0,3));
                    }
                }

                // ═══ 回退：如果流式解析没有收到任何内容，尝试非流式解析 ═══
                if (!receivedAny) {
                    console.warn('[AI] 流式解析未收到内容，尝试非流式回退...');
                    try {
                        // 重新发送非流式请求
                        const { url: url2, headers: headers2, body: body2 } = AI.buildRequest(apiConfig, prompt, false);
                        const res2 = await fetch(url2, { method: 'POST', headers: headers2, body: JSON.stringify(body2), signal: abortCtrl.signal });
                        if (res2.ok) {
                            const data = await res2.json();
                            console.log('[AI] 非流式返回结构:', JSON.stringify(data).slice(0,500));
                            const txt = AI.parseNonStreamChunk(apiConfig.provider, data);
                            if (txt) { onChunk(txt); receivedAny = true; console.log('[AI] 非流式回退成功'); }
                        } else {
                            const errText = await res2.text().catch(()=>'');
                            console.error('[AI] 非流式回退API错误:', res2.status, errText.slice(0,300));
                        }
                    } catch(fallbackErr) {
                        console.error('[AI] 非流式回退也失败:', fallbackErr);
                    }
                }

                AI._abortControllers.delete(abortCtrl);
                if (!receivedAny) console.error('[AI] 警告：本次请求未收到任何有效内容，请检查API配置和provider设置');
                return; // 成功，直接返回
            } catch(e) {
                if (abortCtrl.signal.aborted) { AI._abortControllers.delete(abortCtrl); throw new Error('已中止'); }
                if (attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // 1s, 2s, 4s, 8s, 10s
                    const retryMsg = `API重试中 (${attempt}/${maxRetries})... ${(delay/1000).toFixed(0)}秒后重试`;
                    if (typeof UI !== 'undefined') UI.toast(retryMsg, 'warning');
                    onChunk(`\n[连接失败，${(delay/1000).toFixed(0)}秒后第${attempt+1}次重试 (最多${maxRetries}次)...]\n`);
                    await new Promise(r => setTimeout(r, delay));
                } else {
                    AI._abortControllers.delete(abortCtrl);
                    if (typeof UI !== 'undefined') UI.toast(`API失败: ${e.message}`, 'error');
                    onChunk(`\n[Error: 重试${maxRetries}次后仍失败 - ${e.message}]`);
                }
            }
        }
    },
    buildRequest(config, prompt, stream) {
        const { provider, api_key, base_url, model_name } = config;
        const maxTokens = config.max_tokens || 4096;
        const temperature = config.temperature ?? 0.85;
        let url, headers = { 'Content-Type': 'application/json' }, body;
        
        if (provider === 'gemini') {
            url = `https://generativelanguage.googleapis.com/v1beta/models/${model_name || 'gemini-1.5-flash'}:${stream ? 'streamGenerateContent' : 'generateContent'}?key=${api_key}`;
            body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: maxTokens, temperature } };
        } else if (provider === 'claude') {
            url = `${base_url || 'https://api.anthropic.com'}/v1/messages`;
            headers['x-api-key'] = api_key;
            headers['anthropic-version'] = '2023-06-01';
            body = { model: model_name, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }], stream, temperature };
        } else {
            url = `${base_url}/chat/completions`;
            if (api_key) headers['Authorization'] = `Bearer ${api_key}`;
            body = { model: model_name, messages: [{ role: 'user', content: prompt }], stream, max_tokens: maxTokens, temperature };
            // 智谱GLM等模型：尝试关闭深度思考模式（避免reasoning_content占用token）
            if (provider === 'custom' || provider === 'zhipu') {
                body.enable_thinking = false;
                body.skip_reasoning = true;
            }
        }
        return { url, headers, body };
    },
    // 通用流式chunk解析（兼容 OpenAI/智谱/Claude/Gemini/自定义格式）
    parseStreamChunk(provider, data) {
        // Gemini
        if (provider === 'gemini') return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        // Claude
        if (provider === 'claude') return data.delta?.text || '';
        // OpenAI 兼容格式
        let delta = data.choices?.[0]?.delta;
        if (delta) {
            // ⚠️ 智谱GLM深度思考模式：reasoning_content是思考过程，content是正文
            // 只提取正文content，彻底丢弃reasoning_content（避免思考过程占用token导致正文截断）
            if (delta.content) return delta.content;
            // reasoning_content 返回空字符串（丢弃）
            if (delta.reasoning_content) return '';
        }
        // 更多回退
        let txt = data.choices?.[0]?.message?.content;
        if (txt) return txt;
        txt = data.choices?.[0]?.text;
        if (txt) return txt;
        txt = data.delta?.content;
        if (txt) return txt;
        txt = data.text;
        if (txt) return txt;
        txt = data.response;
        if (txt) return txt;
        txt = data.content;
        if (txt) return txt;
        return '';
    },
    // 非流式响应解析（回退用）
    parseNonStreamChunk(provider, data) {
        // Gemini
        if (provider === 'gemini') return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        // Claude
        if (provider === 'claude') return data.content?.[0]?.text || data.completion || '';
        // OpenAI 兼容格式
        let msg = data.choices?.[0]?.message;
        if (msg) {
            if (msg.content) return msg.content;
            // 同样丢弃 reasoning_content
            if (msg.reasoning_content) return '';
        }
        let txt = data.choices?.[0]?.text;
        if (txt) return txt;
        txt = data.choices?.[0]?.delta?.content;
        if (txt) return txt;
        txt = data.text;
        if (txt) return txt;
        txt = data.response;
        if (txt) return txt;
        txt = data.content;
        if (txt) return txt;
        txt = data.output;
        if (txt) return txt;
        txt = data.result;
        if (txt) return txt;
        return '';
    }
};
