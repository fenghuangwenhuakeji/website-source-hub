declare const App: { isDbReady: () => boolean };
declare const DB: { getAll: <T>(store: string) => Promise<T[]> };
declare const UI: { toast: (msg: string, type?: string) => void };

const AI: AIInterface = {
    _currentAbort: null,

    async getActiveConfig(type: string = 'text'): Promise<APIConfig | null> {
        if (!App.isDbReady()) {
            console.warn('DB 未就绪，无法获取 API 配置');
            return null;
        }
        const configs = await DB.getAll<APIConfig>(`${type}_api_pool`);
        return (configs && configs.find(c => c.is_active === 1)) || (configs && configs[0]) || null;
    },

    abort(): void {
        if (AI._currentAbort) { 
            AI._currentAbort.abort(); 
            AI._currentAbort = null; 
        }
    },

    async generate(prompt: string, config: AIGenerateConfig = {}, onChunk?: (chunk: string) => void): Promise<string | void> {
        if (!onChunk) {
            let fullText = '';
            await AI.generate(prompt, config, c => { fullText += c; });
            return fullText;
        }

        const apiConfig = config.useModel ? config.useModel : await AI.getActiveConfig('text');
        
        if (!apiConfig) {
            const errMsg = '⚠️ 未配置API流量池，请先在「系统设置」→「API流量池」中添加API密钥';
            if (typeof UI !== 'undefined') UI.toast(errMsg, 'error');
            throw new Error('未配置API，请先在设置中添加API密钥');
        }

        const abortCtrl = new AbortController();
        AI._currentAbort = abortCtrl;

        const maxRetries = 5;
        if (typeof UI !== 'undefined') UI.toast('正在连接API...', 'info');
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            if (abortCtrl.signal.aborted) throw new Error('已中止');
            try {
                const { url, headers, body } = AI.buildRequest(apiConfig, prompt, true);
                const res = await fetch(url, { 
                    method: 'POST', 
                    headers, 
                    body: JSON.stringify(body), 
                    signal: abortCtrl.signal 
                });
                
                if (!res.ok) {
                    let errorDetail = '';
                    try {
                        const errorData = await res.json();
                        errorDetail = errorData.error?.message || errorData.message || JSON.stringify(errorData);
                    } catch (parseErr) {
                        errorDetail = await res.text() || res.statusText;
                    }
                    throw new Error(`API Error ${res.status}: ${errorDetail}`);
                }

                if (attempt > 1 && typeof UI !== 'undefined') UI.toast('API连接成功 ✓', 'success');

                const reader = res.body!.getReader();
                const dec = new TextDecoder();
                
                while (true) {
                    if (abortCtrl.signal.aborted) { reader.cancel(); throw new Error('已中止'); }
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = dec.decode(value);
                    const lines = chunk.split('\n');
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                            try {
                                const json = JSON.parse(line.slice(6));
                                const txt = AI.parseStreamChunk(apiConfig.provider, json);
                                if (txt) onChunk(txt);
                            } catch (e) { /* ignore parse errors */ }
                        }
                    }
                }
                AI._currentAbort = null;
                return;
            } catch (e: any) {
                if (abortCtrl.signal.aborted) { AI._currentAbort = null; throw new Error('已中止'); }
                
                const errorMessage = e.message || '';
                if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('身份验证')) {
                    AI._currentAbort = null;
                    const authError = '⚠️ API密钥无效或已过期，请在「系统设置」→「API流量池」中检查配置';
                    if (typeof UI !== 'undefined') UI.toast(authError, 'error');
                    onChunk(`\n[Error: ${authError}]\n`);
                    return;
                }
                
                if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests') || errorMessage.includes('Rate limit')) {
                    const retryAfter = 30000;
                    if (attempt < maxRetries) {
                        const retryMsg = `API请求过于频繁，${retryAfter/1000}秒后重试 (${attempt}/${maxRetries})...`;
                        if (typeof UI !== 'undefined') UI.toast(retryMsg, 'warning');
                        onChunk(`\n[请求过多，${retryAfter/1000}秒后重试...]\n`);
                        await new Promise(r => setTimeout(r, retryAfter));
                        continue;
                    }
                }
                
                if (attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                    const retryMsg = `API重试中 (${attempt}/${maxRetries})... ${(delay/1000).toFixed(0)}秒后重试`;
                    if (typeof UI !== 'undefined') UI.toast(retryMsg, 'warning');
                    onChunk(`\n[连接失败，${(delay/1000).toFixed(0)}秒后第${attempt+1}次重试 (最多${maxRetries}次)...]\n`);
                    await new Promise(r => setTimeout(r, delay));
                } else {
                    AI._currentAbort = null;
                    if (typeof UI !== 'undefined') UI.toast(`API失败: ${e.message}`, 'error');
                    onChunk(`\n[Error: 重试${maxRetries}次后仍失败 - ${e.message}]`);
                }
            }
        }
    },

    buildRequest(config: APIConfig, prompt: string, stream: boolean): AIRequest {
        const { provider, api_key, base_url, model_name } = config;
        let url: string;
        let headers: Record<string, string> = { 'Content-Type': 'application/json' };
        let body: any;
        
        if (provider === 'gemini') {
            url = `https://generativelanguage.googleapis.com/v1beta/models/${model_name || 'gemini-1.5-flash'}:${stream ? 'streamGenerateContent' : 'generateContent'}?key=${api_key}`;
            body = { 
                contents: [{ parts: [{ text: prompt }] }], 
                generationConfig: { maxOutputTokens: 16384 } 
            };
        } else if (provider === 'claude') {
            url = `${base_url || 'https://api.anthropic.com'}/v1/messages`;
            headers['x-api-key'] = api_key;
            headers['anthropic-version'] = '2023-06-01';
            body = { model: model_name, max_tokens: 16384, messages: [{ role: 'user', content: prompt }], stream };
        } else {
            url = `${base_url}/chat/completions`;
            if (api_key) headers['Authorization'] = `Bearer ${api_key}`;
            body = { model: model_name, messages: [{ role: 'user', content: prompt }], stream, max_tokens: 16384 };
        }
        return { url, headers, body };
    },

    parseStreamChunk(provider: string, data: any): string {
        if (provider === 'gemini') return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (provider === 'claude') return data.delta?.text || '';
        return data.choices?.[0]?.delta?.content || '';
    }
};

(window as any).AI = AI;
