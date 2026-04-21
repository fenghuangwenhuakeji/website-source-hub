/**
 * AI系统
 * 管理AI生成内容和智能交互
 */

export class AISystem {
    constructor(engine) {
        this.engine = engine;
        this.isInitialized = false;
        this.apiEndpoint = null;
        this.apiKey = null;
        this.isOnline = false;
    }

    async init() {
        if (this.isInitialized) return;

        console.log('[AISystem] 初始化AI系统...');

        // 检查是否配置了AI API
        this.apiEndpoint = localStorage.getItem('ai_api_endpoint') || null;
        this.apiKey = localStorage.getItem('ai_api_key') || null;

        if (this.apiEndpoint && this.apiKey) {
            this.isOnline = true;
            console.log('[AISystem] AI API已配置');
        } else {
            console.log('[AISystem] AI API未配置，使用离线模式');
        }

        this.isInitialized = true;
        console.log('[AISystem] AI系统初始化完成');
    }

    // 生成内容
    async generate(type, prompt) {
        if (!this.isOnline) {
            return this.generateOffline(type, prompt);
        }

        try {
            // 在线生成
            const response = await this.callAI(type, prompt);
            return { success: true, data: response, source: 'online' };
        } catch (error) {
            console.error('[AISystem] 在线生成失败，使用离线模式:', error);
            return this.generateOffline(type, prompt);
        }
    }

    // 调用AI API
    async callAI(type, prompt) {
        // 这里需要根据实际的AI API进行调整
        // 示例使用OpenAI API格式

        const systemPrompts = {
            text: '你是一个RPG游戏的AI助手，根据用户的输入生成游戏内容。',
            image: '生成一个RPG游戏场景的描述。',
            character: '创建一个RPG角色的描述。'
        };

        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: systemPrompts[type] || systemPrompts.text },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error('AI API调用失败');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    // 离线生成
    generateOffline(type, prompt) {
        console.log(`[AISystem] 离线生成: ${type}, ${prompt}`);

        // 简单的离线内容生成
        const offlineContent = {
            text: this.generateTextOffline(prompt),
            image: this.generateImageOffline(prompt),
            character: this.generateCharacterOffline(prompt)
        };

        return {
            success: true,
            data: offlineContent[type] || '生成内容',
            source: 'offline'
        };
    }

    // 离线文本生成
    generateTextOffline(prompt) {
        const templates = [
            `在${prompt}的指引下，你发现了新的冒险机遇。`,
            `${prompt}似乎隐藏着某种秘密，值得深入探索。`,
            `根据${prompt}，你决定继续前进，前方的道路充满了未知。`,
            `你仔细思考着${prompt}，这可能会影响你的后续冒险。`,
            `这个关于${prompt}的想法让你产生了一些新的灵感。`
        ];

        return templates[Math.floor(Math.random() * templates.length)];
    }

    // 离线图像生成（返回描述）
    generateImageOffline(prompt) {
        const descriptions = [
            `一个充满魔力的${prompt}场景，光芒闪烁，神秘莫测。`,
            `在${prompt}的背景下，展现了史诗般的冒险画面。`,
            `一幅描绘${prompt}的壮丽画卷，细节丰富，色彩绚丽。`
        ];

        return {
            description: descriptions[Math.floor(Math.random() * descriptions.length)],
            icon: '🎨'
        };
    }

    // 离线角色生成
    generateCharacterOffline(prompt) {
        const races = ['人类', '精灵', '矮人', '兽人', '龙族'];
        const classes = ['战士', '法师', '盗贼', '牧师', '游侠'];
        const personalities = ['勇敢', '智慧', '神秘', '热情', '冷静'];

        const character = {
            name: this.generateName(),
            race: races[Math.floor(Math.random() * races.length)],
            class: classes[Math.floor(Math.random() * classes.length)],
            personality: personalities[Math.floor(Math.random() * personalities.length)],
            description: `${prompt}激发了这个角色的诞生。`,
            icon: '👤'
        };

        return character;
    }

    // 生成名字
    generateName() {
        const prefixes = ['A', 'Be', 'Ca', 'Da', 'E', 'Fa', 'G', 'Ha', 'I', 'Ja', 'Ka', 'La', 'Ma', 'Na', 'O', 'Pa', 'Qu', 'Ra', 'Sa', 'Ta', 'U', 'Va', 'Wi', 'X', 'Ya', 'Za'];
        const suffixes = ['ron', 'dar', 'lia', 'th', 'na', 'or', 'el', 'in', 'us', 'a', 'i', 'on', 'ar', 'is', 'os', 'ra', 'ta', 'ia', 'ne', 'ra'];

        return prefixes[Math.floor(Math.random() * prefixes.length)] +
               suffixes[Math.floor(Math.random() * suffixes.length)];
    }

    // 处理玩家动作
    async processAction(action) {
        // 分析玩家输入并生成响应
        const lowerAction = action.toLowerCase();

        // 简单的关键词匹配
        if (lowerAction.includes('买') || lowerAction.includes('购买')) {
            return { success: true, message: '你可以前往酒馆商店购买物品。', action: 'go_shop' };
        }
        if (lowerAction.includes('战斗') || lowerAction.includes('打') || lowerAction.includes('攻击')) {
            return { success: true, message: '你可以探索地图寻找敌人进行战斗。', action: 'go_explore' };
        }
        if (lowerAction.includes('休息') || lowerAction.includes('睡觉')) {
            return { success: true, message: '你可以在酒馆的住宿处休息恢复体力。', action: 'rest' };
        }
        if (lowerAction.includes('任务') || lowerAction.includes('委托')) {
            return { success: true, message: '你可以查看任务板接受新的冒险任务。', action: 'go_quest' };
        }

        // 使用AI生成响应
        const response = await this.generate('text', `玩家说: "${action}"，生成一个RPG游戏的响应。`);
        return { success: true, message: response.data };
    }

    // 配置AI API
    configureAI(endpoint, apiKey) {
        this.apiEndpoint = endpoint;
        this.apiKey = apiKey;
        this.isOnline = !!(endpoint && apiKey);

        localStorage.setItem('ai_api_endpoint', endpoint || '');
        localStorage.setItem('ai_api_key', apiKey || '');

        console.log('[AISystem] AI配置已更新', { online: this.isOnline });

        if (window.game) {
            game.showNotification(
                this.isOnline ? 'AI已配置为在线模式' : 'AI已切换为离线模式',
                'success'
            );
        }

        return this.isOnline;
    }

    // 检查是否在线
    isAIOnline() {
        return this.isOnline;
    }
}
