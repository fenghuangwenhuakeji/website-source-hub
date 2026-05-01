const AI = {
    getApiTypeLabel(type = 'text') {
        return ({
            text: '文本写作 API',
            parse: '解析 API',
            fusion: '拆书 API',
            image: '图像 API',
            video: '视频 API',
            audio: '音频 API'
        })[type] || 'API';
    },
    async getActiveConfig(type = 'text') {
        try {
            const configs = await DB.getAll(`${type}_api_pool`);
            if (!configs || !Array.isArray(configs)) return null;
            if (type === 'text') {
                return configs.find(c => c.is_master === 1) || configs.find(c => c.is_active === 1) || configs[0] || null;
            }
            const active = configs.find(c => c.is_active === 1) || configs[0] || null;
            if (active) return active;
            if (type === 'parse' || type === 'fusion') {
                const textConfigs = await DB.getAll('text_api_pool').catch(() => []);
                const fallback = (textConfigs || []).find(c => c.is_master === 1) || (textConfigs || []).find(c => c.is_active === 1) || (textConfigs || [])[0] || null;
                return fallback ? { ...fallback, _fallbackType: 'text', _requestedType: type } : null;
            }
            return null;
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

        const apiType = config.apiType || config.poolType || config.requestType || 'text';
        let apiConfig = config.useModel ? config.useModel : await AI.getActiveConfig(apiType);
        // 合并用户传入的配置（如 max_tokens, temperature）
        if (apiConfig && Object.keys(config).length > 0) {
            apiConfig = { ...apiConfig, ...config };
        }
        
        if (!apiConfig) {
            const errMsg = `⚠️ 未配置${AI.getApiTypeLabel(apiType)}，请先在「系统设置」→「模型/API」中添加`;
            if (typeof UI !== 'undefined') UI.toast(errMsg, 'error');
            throw new Error(`未配置${AI.getApiTypeLabel(apiType)}，请先在设置中添加API密钥`);
        }

        // AbortController: 支持外部中断
        const abortCtrl = new AbortController();
        AI._abortControllers.add(abortCtrl);

        const maxRetries = 5;
        if (typeof UI !== 'undefined') UI.toast('正在连接API...', 'info');
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            if (abortCtrl.signal.aborted) throw new Error('已中止');
            try {
                const requestPrompt = AI.augmentCreativePrompt(prompt, { ...config, apiType });
                const { url, headers, body } = AI.buildRequest(apiConfig, requestPrompt, true);
                console.log(`[AI] Request(${apiType}${apiConfig._fallbackType ? '→' + apiConfig._fallbackType : ''}) → ${apiConfig.provider} | model:${body.model||body.model_name||'-'} | max_tokens:${body.max_tokens||body.maxOutputTokens||'-'} | stream:${body.stream||body.streamGenerateContent||false} | prompt:${requestPrompt.length}字`);
                
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
                        const { url: url2, headers: headers2, body: body2 } = AI.buildRequest(apiConfig, requestPrompt, false);
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
    augmentCreativePrompt(prompt, config = {}) {
        if (!prompt || config.noReaderProtocol || prompt.includes('【内部读者引擎】')) return prompt;
        if (typeof GenesisCore === 'undefined' || !GenesisCore.buildReaderContext) return prompt;
        const mod = (typeof App !== 'undefined' && App._currentModule) ? App._currentModule : (config.module || '');
        const moduleMode = {
            phoenix: 'phoenix',
            world_engine: 'import',
            writer: null,
            fusion_book: 'fusion',
            fusion_workbench: 'fusion'
        };
        if (!Object.prototype.hasOwnProperty.call(moduleMode, mod) && !config.module) return prompt;
        let mode = moduleMode[mod];
        if (!mode) {
            const activeMode = localStorage.getItem('genesis_active_project_mode');
            mode = activeMode || 'phoenix';
        }
        const flowMode = config.flowMode || localStorage.getItem('writer_flow_mode') || 'hybrid';
        const apiType = config.apiType || 'text';
        const ctx = GenesisCore.buildReaderContext(mode);
        const workflowCtx = GenesisCore.buildWorkflowContext ? GenesisCore.buildWorkflowContext(mode, flowMode) : '';
        const readerHardRules = `【读者付款协议】\n- 读者不是看故事，是用故事完成自己的心理动作：逃离、代入、泄压、猜测、复购。\n- 每章必须回答：读者此刻想要主角做什么、最怕什么、身体会有什么反应、为什么点下一章。\n- 回收一个缺口时，必须同步埋下新的缺口；不要给安全停止点。\n- 细纲里可以写读者期待和恐惧，正文里必须把它们藏进动作、阻力、代价和钩子。`;
        const writerHardRules = `【M06正文硬规则】\n- 正文只写可见动作、物件变化、对话错位、环境反馈和未完成动作。\n- 禁止输出“内心OS/作者注/技法标签/读者期待/读者恐惧/反应涟漪/AI痕迹/本章分析”等任何元说明。\n- 禁止用括号讲写作意图，禁止把拆书术语写进正文，禁止出现“【某某法】”一类技法名。\n- 禁止直接写“他很愤怒/她很伤心/他意识到/她感觉到/我知道/我注意到”。改成动作、触觉、声音、物件反应。\n- 单句尽量不超过25字，逗号分句不超过2段，段落不超过5行。\n- 每章至少有2种感官、1个日常细节、1个未完成动作或信息差钩子。\n- 章末必须让读者处于不安全状态：答案给一半，新问题至少留下一个。`;
        const parseRules = apiType === 'parse' ? `\n【解析API任务边界】\n- 只做结构化解析、细纲反推、实体提取、状态同步。\n- 输入正文和细纲都必须读取；正文是事实，细纲是结构线索。\n- 不改写正文，不扩写剧情，不生成新人物关系。\n- 输出必须稳定、可入库、可恢复进度。` : '';
        const fusionRules = apiType === 'fusion' ? `\n【拆书API任务边界】\n- 拆书只拿技法弹药：钩子、节奏、信息差、读者反应、场景结构、反转模式、语言控制。\n- 不复用原书角色、设定、专有情节和连续原句。\n- 每轮拆解必须产出：读者期待/恐惧、章节功能、钩子类型、可迁移技法、M06风险、可送执笔台的弹药。\n- 拆到一轮就能停，弹药能立即回写执笔台。` : '';
        return `${prompt}\n\n【内部读者引擎】\n以下内容只作为写作/融合拆书/续写的隐性约束，不要在用户可见结果中解释、复述或单独列出。\n${ctx}\n\n${workflowCtx}\n\n${readerHardRules}\n\n${writerHardRules}${parseRules}${fusionRules}\n\n【隐性执行要求】\n- 细纲里把读者期待、恐惧、信息缺口、回收点藏进章节动作和伏笔钩子。\n- 正文里只呈现身体动作、环境反馈、对话错位和未完成动作，不解释读者机制。\n- “拆书”只指融合拆书：从参考书提炼技法、节奏、钩子、爽点、信息差，不搬原文内容。\n- 用户可以写到一半去拆参考书，也可以拆书拆一半停下来回执笔台写；不要假设必须一次性拆完。\n- 导入续写时，已写正文是源事实；融合拆书内容只作为技法弹药注入，不能覆盖旧正文。\n- 正文保存后的章内细纲/实体/图谱处理属于后台同步，不要在输出里说成“拆书”。`;
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
