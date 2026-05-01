/**
 * NPC 管理器
 * 管理 NPC 角色的立绘、背景故事和对话系统
 * 支持自定义角色创建和编辑
 */
class NPCManager {
    constructor(llmConfigManager) {
        this.llmConfig = llmConfigManager;
        this.conversationHistory = {};
        this.storageKey = 'dungeonspire_custom_npcs';
        this.customNpcs = this.loadCustomNpcs();
        
        // 默认 NPC 角色定义
        this.defaultNpcs = [
            {
                id: 'merchant',
                name: '神秘商人·莫里斯',
                avatar: '🧙',
                color: '#f59e0b',
                portrait: '🧙‍♂️',
                title: '流浪商人',
                greeting: '欢迎光临，冒险者！我这里有来自世界各地的珍奇物品...',
                background: `莫里斯是一位神秘的流浪商人，没人知道他来自哪里。
他总是出现在最意想不到的地方，带着装满奇珍异宝的大背包。
传说他曾是某个古老王国的宫廷魔法师，因为某个不可告人的秘密而被流放。
现在他游走于各个地牢之间，用他收集的宝物换取冒险者的故事。`,
                personality: '神秘、狡黠、博学、贪婪但有底线',
                systemPrompt: `你是莫里斯，一位神秘的流浪商人。你说话带有商人的狡黠，喜欢用隐晦的方式暗示物品的价值。
你对各种珍奇物品了如指掌，偶尔会透露一些关于地牢的秘密。你的目标是做成交易，但也会给予冒险者有用的建议。
保持神秘感，不要直接透露你的过去。用"呵呵"、"有意思"等口头禅。`
            },
            {
                id: 'blacksmith',
                name: '铁匠·格雷格',
                avatar: '⚒️',
                color: '#ef4444',
                portrait: '👨‍🔧',
                title: '传奇锻造师',
                greeting: '哼，又一个来找我打造装备的？让我看看你有什么材料...',
                background: `格雷格曾是帝国最著名的锻造大师，为无数英雄打造过传奇武器。
一场大火毁掉了他的工坊，也带走了他的家人。从此他隐居在地牢深处，
只为那些真正有勇气的冒险者锻造装备。他的脾气暴躁，但对待工作一丝不苟。
据说他正在寻找一种失传的锻造技术，能够打造出神器级别的武器。`,
                personality: '暴躁、固执、技艺精湛、外冷内热',
                systemPrompt: `你是格雷格，一位脾气暴躁但技艺精湛的铁匠。你说话直接，不喜欢废话。
你对锻造有着近乎偏执的追求，看不起劣质的装备。你会评价冒险者的装备，给出改进建议。
偶尔会提到你失去的家人和那场大火，但很快会转移话题。用"哼"、"切"等语气词。`
            },
            {
                id: 'healer',
                name: '治疗师·艾琳娜',
                avatar: '💚',
                color: '#22c55e',
                portrait: '👩‍⚕️',
                title: '圣光使者',
                greeting: '愿圣光庇佑你，受伤的旅人。让我来看看你的伤势...',
                background: `艾琳娜是圣光教会的高阶祭司，拥有强大的治愈能力。
她自愿来到这危险的地牢，为受伤的冒险者提供帮助。
她相信每一个生命都值得被拯救，即使是那些误入歧途的人。
她的过去有一段不为人知的秘密——她曾经是一名黑暗法师，
是圣光的救赎让她重获新生。`,
                personality: '温柔、慈悲、坚定、有时会流露出忧伤',
                systemPrompt: `你是艾琳娜，一位温柔的治疗师。你说话轻柔，充满关怀。
你会关心冒险者的身体状况和心理状态，给予鼓励和安慰。
你相信救赎和希望，偶尔会引用圣光教义。你对黑暗魔法有着复杂的感情。
用"愿圣光庇佑你"、"保重"等祝福语。`
            },
            {
                id: 'sage',
                name: '智者·奥古斯都',
                avatar: '📚',
                color: '#3b82f6',
                portrait: '🧓',
                title: '知识守护者',
                greeting: '啊，又一位求知者。你想了解什么？这座地牢的历史，还是更深层的秘密？',
                background: `奥古斯都是一位活了数百年的智者，据说他通过某种禁忌魔法延长了寿命。
他在地牢最深处建立了一座图书馆，收藏着无数珍贵的典籍和卷轴。
他对知识有着无尽的渴望，愿意用任何代价换取新的知识。
他知道这座地牢的所有秘密，但只会对那些证明自己值得的人透露。`,
                personality: '博学、神秘、有些疯狂、对知识痴迷',
                systemPrompt: `你是奥古斯都，一位博学的智者。你说话文绉绉的，喜欢引经据典。
你对地牢的历史、怪物的弱点、宝藏的位置都有所了解，但不会轻易透露。
你会考验求知者的智慧，用谜语和暗示来引导他们。你对禁忌知识有着危险的迷恋。
用"有趣"、"让我想想"、"古籍记载"等学者用语。`
            },
            {
                id: 'adventurer',
                name: '冒险者·雷克斯',
                avatar: '⚔️',
                color: '#8b5cf6',
                portrait: '🦸',
                title: '传奇勇者',
                greeting: '嘿，同行！看你的装备，应该也是来挑战这座地牢的吧？',
                background: `雷克斯是一位经验丰富的冒险者，已经在这座地牢中探索了三年。
他曾经是一支冒险小队的队长，但在一次探险中失去了所有队友。
现在他独自行动，一边寻找失踪队友的下落，一边帮助新来的冒险者。
他看起来大大咧咧，但内心深处承受着巨大的愧疚和悲伤。`,
                personality: '豪爽、乐观、经验丰富、内心有伤痛',
                systemPrompt: `你是雷克斯，一位经验丰富的冒险者。你说话豪爽，喜欢分享冒险经历。
你会给新手冒险者提供实用的建议，警告他们地牢中的危险。
你偶尔会提到你失踪的队友，但会很快用玩笑掩饰悲伤。
用"哈哈"、"相信我"、"我当年"等口头禅。`
            },
            {
                id: 'mysterious',
                name: '神秘人·???',
                avatar: '🎭',
                color: '#6366f1',
                portrait: '🎭',
                title: '未知身份',
                greeting: '......你能看见我？有意思......',
                background: `没有人知道这个神秘人的真实身份。
他总是戴着一副面具，说话时声音会不断变化。
有人说他是地牢的守护者，有人说他是被困在这里的亡灵，
还有人说他是地牢本身的意志化身。
他似乎知道每个冒险者的命运，但从不直接干预。`,
                personality: '神秘、超然、全知、说话充满暗示',
                systemPrompt: `你是一个神秘的存在，身份不明。你说话简短，充满暗示和预言。
你似乎知道很多事情，但只会用隐晦的方式透露。你对冒险者的命运有着某种洞察。
你的回答总是模棱两可，让人捉摸不透。偶尔会说出一些令人不安的预言。
用"......"、"也许"、"命运"等神秘用语。保持简短和神秘。`
            }
        ];
    }

    // 加载自定义 NPC
    loadCustomNpcs() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn('Failed to load custom NPCs:', e);
            return [];
        }
    }

    // 保存自定义 NPC
    saveCustomNpcs() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.customNpcs));
    }

    // 获取所有 NPC（默认 + 自定义）
    getAllNpcs() {
        const allNpcs = [...this.defaultNpcs, ...this.customNpcs];
        return allNpcs.map(npc => ({
            id: npc.id,
            name: npc.name,
            avatar: npc.avatar,
            color: npc.color,
            portrait: npc.portrait,
            title: npc.title,
            greeting: npc.greeting,
            isCustom: npc.isCustom || false
        }));
    }

    // 获取 NPC 详细信息
    getNpcDetail(npcId) {
        return this.defaultNpcs.find(n => n.id === npcId) || 
               this.customNpcs.find(n => n.id === npcId);
    }

    // 添加自定义 NPC
    addCustomNpc(npcData) {
        const newNpc = {
            id: 'custom_' + Date.now(),
            name: npcData.name || '未命名角色',
            avatar: npcData.avatar || '👤',
            color: npcData.color || '#888888',
            portrait: npcData.portrait || npcData.avatar || '👤',
            title: npcData.title || '自定义角色',
            greeting: npcData.greeting || '你好，冒险者。',
            background: npcData.background || '',
            personality: npcData.personality || '',
            systemPrompt: npcData.systemPrompt || '',
            isCustom: true
        };
        this.customNpcs.push(newNpc);
        this.saveCustomNpcs();
        return newNpc;
    }

    // 更新自定义 NPC
    updateCustomNpc(npcId, updates) {
        const index = this.customNpcs.findIndex(n => n.id === npcId);
        if (index !== -1) {
            this.customNpcs[index] = { ...this.customNpcs[index], ...updates };
            this.saveCustomNpcs();
            return this.customNpcs[index];
        }
        return null;
    }

    // 删除自定义 NPC
    deleteCustomNpc(npcId) {
        const index = this.customNpcs.findIndex(n => n.id === npcId);
        if (index !== -1) {
            this.customNpcs.splice(index, 1);
            this.saveCustomNpcs();
            delete this.conversationHistory[npcId];
            return true;
        }
        return false;
    }

    // 初始化与 NPC 的对话
    initConversation(npcId) {
        const npc = this.getNpcDetail(npcId);
        if (!npc) return null;

        // 构建详细的系统提示词
        const systemContent = `# 角色扮演指令

你正在扮演一个游戏中的 NPC 角色。请严格按照以下设定进行角色扮演。

## 基本信息
- 角色名称：${npc.name}
- 角色头衔：${npc.title}
- 性格特点：${npc.personality}

## 背景故事
${npc.background}

## 角色扮演要求
${npc.systemPrompt}

## 重要规则
1. 始终保持角色身份，不要打破第四面墙
2. 回复要符合角色的性格和说话方式
3. 记住之前对话中提到的所有信息
4. 如果玩家提到了自己的名字或其他信息，要记住并在后续对话中使用
5. 回复长度适中，不要太长也不要太短
6. 可以主动询问玩家的情况，展现角色的个性`;

        this.conversationHistory[npcId] = [
            {
                role: 'system',
                content: systemContent
            }
        ];

        return npc;
    }

    // 与 NPC 对话
    async chat(npcId, userMessage) {
        const npc = this.getNpcDetail(npcId);
        if (!npc) {
            throw new Error('NPC 不存在');
        }

        // 初始化对话历史
        if (!this.conversationHistory[npcId]) {
            this.initConversation(npcId);
        }

        // 添加用户消息
        this.conversationHistory[npcId].push({
            role: 'user',
            content: userMessage
        });

        // 检查是否有激活的 LLM 配置
        const activeConfig = this.llmConfig?.getActiveConfig();
        
        console.log('[NPCManager] Active config:', activeConfig);
        console.log('[NPCManager] Conversation history length:', this.conversationHistory[npcId].length);
        
        let response;
        if (activeConfig) {
            // 使用 LLM 生成回复
            try {
                console.log('[NPCManager] Calling LLM API...');
                
                // 构建带有记忆提示的消息
                const messages = this.buildMessagesWithMemory(npcId);
                console.log('[NPCManager] Messages count:', messages.length);
                
                response = await this.llmConfig.chat(messages, {
                    temperature: 0.8,
                    maxTokens: 2048
                });
                console.log('[NPCManager] LLM Response:', response);
            } catch (error) {
                console.error('[NPCManager] LLM error:', error);
                // 降级到模拟回复
                response = this.getMockResponse(npc, userMessage);
                console.log('[NPCManager] Fallback to mock response');
            }
        } else {
            // 使用模拟回复
            console.log('[NPCManager] No active config, using mock response');
            response = this.getMockResponse(npc, userMessage);
        }

        // 添加助手回复到历史
        this.conversationHistory[npcId].push({
            role: 'assistant',
            content: response
        });

        // 保存对话历史到本地存储
        this.saveConversationHistory(npcId);

        // 限制历史长度（保留更多上下文）
        this.trimHistory(npcId);

        return response;
    }

    // 构建带有记忆的消息列表
    buildMessagesWithMemory(npcId) {
        const history = this.conversationHistory[npcId];
        if (!history || history.length === 0) return [];

        // 获取系统消息
        const systemMsg = history[0];
        
        // 获取对话历史（除了系统消息）
        const dialogHistory = history.slice(1);
        
        // 如果对话历史太长，进行智能裁剪
        if (dialogHistory.length > 30) {
            // 保留最近的 20 条对话
            const recentHistory = dialogHistory.slice(-20);
            
            // 生成之前对话的摘要提示
            const summaryPrompt = {
                role: 'system',
                content: `[记忆提示：这是一段持续的对话，之前已经进行了 ${dialogHistory.length - 20} 轮对话。请保持对话的连贯性。]`
            };
            
            return [systemMsg, summaryPrompt, ...recentHistory];
        }
        
        return history;
    }

    // 裁剪历史记录
    trimHistory(npcId) {
        const history = this.conversationHistory[npcId];
        if (!history) return;

        // 保留最多 50 条消息（包括系统消息）
        if (history.length > 50) {
            const systemMsg = history[0];
            this.conversationHistory[npcId] = [
                systemMsg,
                ...history.slice(-40)
            ];
        }
    }

    // 保存对话历史到本地存储
    saveConversationHistory(npcId) {
        try {
            const key = `dungeonspire_chat_history_${npcId}`;
            const history = this.conversationHistory[npcId];
            if (history) {
                localStorage.setItem(key, JSON.stringify(history));
            }
        } catch (e) {
            console.warn('Failed to save conversation history:', e);
        }
    }

    // 加载对话历史
    loadConversationHistory(npcId) {
        try {
            const key = `dungeonspire_chat_history_${npcId}`;
            const saved = localStorage.getItem(key);
            if (saved) {
                this.conversationHistory[npcId] = JSON.parse(saved);
                return true;
            }
        } catch (e) {
            console.warn('Failed to load conversation history:', e);
        }
        return false;
    }

    // 获取对话摘要（用于显示）
    getConversationSummary(npcId) {
        const history = this.conversationHistory[npcId];
        if (!history) return null;
        
        const dialogCount = Math.floor((history.length - 1) / 2);
        return {
            npcId,
            dialogCount,
            lastMessage: history[history.length - 1]?.content || ''
        };
    }

    // 模拟回复（无 LLM 时使用）
    getMockResponse(npc, userMessage) {
        const responses = {
            merchant: [
                '呵呵，这件物品可不便宜，但绝对物超所值...',
                '有意思，你对这个感兴趣？让我给你讲讲它的来历...',
                '我在东方的一个神秘集市上得到了这个，据说它曾属于一位传奇英雄...',
                '价格嘛...可以商量，但你得给我讲一个有趣的故事作为交换。'
            ],
            blacksmith: [
                '哼，这把武器的锻造工艺太粗糙了，让我来改进一下。',
                '切，你这装备能撑过几场战斗？来，我给你看看什么叫真正的锻造。',
                '材料不错...如果你能再找到一些秘银，我可以给你打造一件杰作。',
                '我曾经为帝国将军打造过一把剑，那才叫艺术品...'
            ],
            healer: [
                '愿圣光庇佑你。来，让我看看你的伤势...',
                '你的身体已经很疲惫了，休息一下吧，冒险者。',
                '这种伤...我见过太多了。战斗是残酷的，但希望永远存在。',
                '保重，愿你在前方的道路上平安。'
            ],
            sage: [
                '有趣的问题...让我查阅一下古籍...',
                '古老的传说中记载，这座地牢曾是一位堕落神明的居所...',
                '知识是最强大的武器，但也是最危险的诱惑。你准备好了吗？',
                '我可以告诉你答案，但你必须先回答我一个问题...'
            ],
            adventurer: [
                '哈哈，我当年第一次来这里的时候，也是一脸懵！',
                '相信我，那个房间里的宝箱是陷阱，我亲眼看到三个人栽在那里。',
                '我的队友们...他们应该还在某个地方。我一定会找到他们的。',
                '来，我教你一个小技巧，对付那种怪物特别有效！'
            ],
            mysterious: [
                '......',
                '命运的齿轮已经开始转动......',
                '也许...你会找到你寻找的东西。也许不会。',
                '有些门一旦打开，就再也关不上了......'
            ]
        };

        const npcResponses = responses[npc.id] || ['...'];
        return npcResponses[Math.floor(Math.random() * npcResponses.length)];
    }

    // 清除对话历史
    clearHistory(npcId) {
        if (npcId) {
            delete this.conversationHistory[npcId];
        } else {
            this.conversationHistory = {};
        }
    }
}
