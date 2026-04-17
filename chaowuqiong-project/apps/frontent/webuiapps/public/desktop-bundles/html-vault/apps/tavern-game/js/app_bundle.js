/**
 * WriterCenterArchon - 核心控制层
 */
const Archon = {
    db: null,
    state: {
        currentScript: null,
        history: [],
        player: { hp: 100, maxHp: 100, gold: 0 },
        apiConfig: null
    },
    
    events: {
        listeners: {},
        on(e, f) { (this.listeners[e]=this.listeners[e]||[]).push(f); },
        emit(e, d) { (this.listeners[e]||[]).forEach(f => f(d)); }
    },

    async init() {
        await this.initDB();
        this.loadSettings();
        this.events.emit('ready');
    },

    async initDB() {
        return new Promise((r) => {
            const req = indexedDB.open('AITavernTOP1DB', 3);
            req.onsuccess = (e) => { this.db = e.target.result; r(); };
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                ['scripts', 'saves', 'settings'].forEach(s => {
                    if(!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' });
                });
            };
        });
    },

    async loadSettings() {
        // 模拟加载 API 配置，实际应从 DB 读取
        this.state.apiConfig = {
            provider: 'openai',
            apiKey: localStorage.getItem('api_key') || '',
            baseUrl: localStorage.getItem('base_url') || 'https://api.openai.com/v1',
            model: 'gpt-3.5-turbo'
        };
    }
};

/**
 * StoryForge - 叙事引擎
 */
const StoryForge = {
    async generateResponse(action) {
        const { currentScript, history, apiConfig } = Archon.state;
        if (!apiConfig.apiKey) throw new Error("未配置 API Key");

        // 1. 构建 Prompt
        const messages = this.buildContext(currentScript, history, action);
        
        // 2. 调用 API
        const responseText = await this.callLLM(apiConfig, messages);
        
        // 3. 解析状态 (简单正则匹配)
        this.parseStatusUpdates(responseText);

        return responseText;
    },

    buildContext(script, history, action) {
        const sysPrompt = `你是一个TRPG主持人。剧本: ${script.name}。\n${script.prompt}\n请在回复末尾用[STATUS]HP:xx,Gold:xx[/STATUS]格式更新状态。`;
        
        // 简单的上下文窗口滑动 (保留最近 6 轮)
        const recentHistory = history.slice(-12).map(h => ({
            role: h.role === 'user' ? 'user' : 'assistant',
            content: h.content
        }));

        return [
            { role: 'system', content: sysPrompt },
            ...recentHistory,
            { role: 'user', content: action }
        ];
    },

    async callLLM(config, messages) {
        try {
            const res = await fetch(`${config.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify({
                    model: config.model,
                    messages: messages,
                    temperature: 0.7
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error.message);
            return data.choices[0].message.content;
        } catch (e) {
            console.error("LLM Call Failed:", e);
            throw e;
        }
    },

    parseStatusUpdates(text) {
        const match = text.match(/\[STATUS\](.*?)\[\/STATUS\]/s);
        if (match) {
            const content = match[1];
            // 简单的解析逻辑
            if (content.includes('HP')) {
                // 实际逻辑应更复杂，处理数值增减
                console.log("Status update detected:", content);
            }
        }
    }
};

window.Archon = Archon;
window.StoryForge = StoryForge;