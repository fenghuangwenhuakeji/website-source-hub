/**
 * 交互系统
 * 处理玩家与NPC、物体、环境的交互
 */

import { RPGCore } from './RPGameCore.js';

export default class InteractionSystem {
    constructor() {
        this.interactions = new Map(); // 存储所有交互
        this.activeDialogues = new Map(); // 当前对话
        this.relationships = new Map(); // NPC好感度
        this.interactionHistory = []; // 交互历史
        this.interactionDistance = 100; // 交互触发距离
    }

    async initialize() {
        console.log('💬 交互系统初始化...');
        await this.loadDefaultNPCs();
        await this.loadRelationships();
    }

    /**
     * 加载默认NPC
     */
    async loadDefaultNPCs() {
        const npcs = {
            'tavern_keeper': {
                id: 'tavern_keeper',
                name: '老约翰',
                title: '酒保',
                icon: '🧔',
                location: 'bar_counter',
                personality: 'friendly_talkative',
                initialAttitude: 50,
                dialogue: {
                    greeting: [
                        '欢迎光临冒险者酒馆！我是老约翰。',
                        '啊，又是新面孔！要来点什么？',
                        '天气不错啊，不是吗？'
                    ],
                    topics: [
                        { id: 'rumors', text: '有什么传闻吗？', responses: [] },
                        { id: 'quests', text: '有什么任务吗？', responses: [] },
                        { id: 'trade', text: '交易一下？', responses: [] },
                        { id: 'advice', text: '给我一些建议', responses: [] }
                    ],
                    actions: [
                        { id: 'buy_drink', text: '买杯酒', cost: 5 },
                        { id: 'buy_room', text: '租房间', cost: 20 },
                        { id: 'listen_story', text: '听听故事', cost: 0 }
                    ]
                },
                inventory: [
                    { id: 'ale', name: '麦酒', price: 5, quantity: 99 },
                    { id: 'wine', name: '葡萄酒', price: 15, quantity: 50 },
                    { id: 'room_key', name: '房间钥匙', price: 20, quantity: 5 }
                ]
            },
            'mysterious_stranger': {
                id: 'mysterious_stranger',
                name: '神秘旅人',
                title: '未知',
                icon: '🎭',
                location: 'corner_table',
                personality: 'mysterious',
                initialAttitude: 20,
                dialogue: {
                    greeting: [
                        '...',
                        '你有什么事吗，陌生人？',
                        '我不习惯和陌生人交谈...'
                    ],
                    topics: [
                        { id: 'identity', text: '你是谁？', requirements: { attitude: 40 } },
                        { id: 'secrets', text: '你知道什么秘密？', requirements: { attitude: 70 } }
                    ]
                },
                hidden: true,
                revealCondition: { quests: ['first_steps'] }
            },
            'blacksmith': {
                id: 'blacksmith',
                name: '铁匠艾瑞克',
                title: '铁匠',
                icon: '⚒️',
                location: 'town',
                personality: 'gruff_helpful',
                initialAttitude: 40,
                dialogue: {
                    greeting: [
                        '需要修理装备吗？',
                        '只有最好的材料才能做出最好的武器。',
                        '工作，工作，永远做不完的工作。'
                    ],
                    topics: [
                        { id: 'upgrade', text: '升级装备' },
                        { id: 'craft', text: '制作装备' },
                        { id: 'materials', text: '你收什么材料？' }
                    ],
                    actions: [
                        { id: 'repair', text: '修理装备', cost: 10 },
                        { id: 'sharpen', text: '磨刀', cost: 5 }
                    ]
                },
                services: ['repair', 'upgrade', 'craft']
            },
            'merchant': {
                id: 'merchant',
                name: '商人安娜',
                title: '旅行商人',
                icon: '👩',
                location: 'town',
                personality: 'greedy_friendly',
                initialAttitude: 50,
                dialogue: {
                    greeting: [
                        '欢迎光临！看看有什么你需要的？',
                        '好货不便宜，便宜没好货！',
                        '今天运气不错，刚进了一批新货。'
                    ],
                    topics: [
                        { id: 'special_offers', text: '有什么特别优惠吗？' },
                        { id: 'sell', text: '卖东西' },
                        { id: 'buy', text: '买东西' }
                    ]
                },
                services: ['buy', 'sell'],
                inventory: this.generateMerchantInventory()
            }
        };

        // 存储NPC数据
        for (const [id, npc] of Object.entries(npcs)) {
            this.interactions.set(id, npc);
        }
    }

    /**
     * 生成商人库存
     */
    generateMerchantInventory() {
        const items = [
            { id: 'potion_hp', name: '生命药水', price: 50, quantity: 10 },
            { id: 'potion_mp', name: '魔法药水', price: 60, quantity: 8 },
            { id: 'antidote', name: '解毒剂', price: 30, quantity: 15 },
            { id: 'torch', name: '火把', price: 5, quantity: 50 },
            { id: 'rope', name: '绳索', price: 10, quantity: 20 },
            { id: 'rations', name: '干粮', price: 15, quantity: 30 }
        ];
        return items;
    }

    /**
     * 加载NPC关系
     */
    async loadRelationships() {
        try {
            const saved = localStorage.getItem('rpg_relationships');
            if (saved) {
                this.relationships = new Map(JSON.parse(saved));
            }
        } catch (e) {
            console.error('加载关系数据失败:', e);
        }
    }

    /**
     * 保存关系数据
     */
    async saveRelationships() {
        try {
            localStorage.setItem('rpg_relationships', JSON.stringify(Array.from(this.relationships.entries())));
        } catch (e) {
            console.error('保存关系数据失败:', e);
        }
    }

    /**
     * 获取NPC
     */
    getNPC(npcId) {
        return this.interactions.get(npcId);
    }

    /**
     * 获取所有NPC
     */
    getAllNPCs() {
        return Array.from(this.interactions.values());
    }

    /**
     * 获取当前地点的NPC
     */
    getNPCsAtLocation(locationId) {
        return this.getAllNPCs().filter(npc => npc.location === locationId);
    }

    /**
     * 检查交互是否可用
     */
    canInteract(npcId) {
        const npc = this.getNPC(npcId);
        if (!npc) return { canInteract: false, reason: 'NPC不存在' };

        // 检查隐藏状态
        if (npc.hidden && npc.revealCondition) {
            // 这里应该检查条件，简化处理
            return { canInteract: false, reason: 'NPC未发现' };
        }

        return { canInteract: true, npc };
    }

    /**
     * 开始对话
     */
    startDialogue(npcId) {
        const npc = this.getNPC(npcId);
        if (!npc) return { success: false, error: 'NPC不存在' };

        const attitude = this.relationships.get(npcId) || npc.initialAttitude;

        // 根据好感度选择问候语
        let greeting;
        if (npc.dialogue.greeting) {
            const index = Math.floor(Math.random() * npc.dialogue.greeting.length);
            greeting = npc.dialogue.greeting[index];
        } else {
            greeting = `你好，我是${npc.name}。`;
        }

        const dialogue = {
            npcId,
            npcName: npc.name,
            npcIcon: npc.icon,
            attitude,
            greeting,
            topics: this.getAvailableTopics(npc, attitude),
            actions: npc.dialogue.actions || []
        };

        this.activeDialogues.set(npcId, dialogue);
        return { success: true, dialogue };
    }

    /**
     * 获取可用话题
     */
    getAvailableTopics(npc, attitude) {
        if (!npc.dialogue.topics) return [];

        return npc.dialogue.topics.filter(topic => {
            if (!topic.requirements) return true;
            if (topic.requirements.attitude && attitude < topic.requirements.attitude) {
                return false;
            }
            return true;
        });
    }

    /**
     * 选择话题
     */
    selectTopic(npcId, topicId) {
        const dialogue = this.activeDialogues.get(npcId);
        if (!dialogue) return { success: false, error: '对话不存在' };

        const npc = this.getNPC(npcId);
        const topic = npc.dialogue.topics.find(t => t.id === topicId);

        if (!topic) {
            return { success: false, error: '话题不存在' };
        }

        // 增加好感度
        this.changeAttitude(npcId, 2);

        // 返回话题响应（这里简化处理，实际应该调用AI生成）
        const response = {
            topic: topic.text,
            content: `关于${topic.text}... (这里应该由AI生成详细的对话内容)`,
            options: topic.responses || []
        };

        return { success: true, response };
    }

    /**
     * 执行动作
     */
    executeAction(npcId, actionId) {
        const dialogue = this.activeDialogues.get(npcId);
        if (!dialogue) return { success: false, error: '对话不存在' };

        const npc = this.getNPC(npcId);
        const action = npc.dialogue.actions.find(a => a.id === actionId);

        if (!action) {
            return { success: false, error: '动作不存在' };
        }

        // 检查金币
        if (action.cost && action.cost > 0) {
            // 这里应该检查玩家金币
            // const player = RPGCore.getSystem('character').getPlayer();
            // if (player.gold < action.cost) {
            //     return { success: false, error: '金币不足' };
            // }
        }

        // 执行动作
        const result = this.performAction(npc, action);

        return { success: true, result };
    }

    /**
     * 执行具体动作
     */
    performAction(npc, action) {
        switch (action.id) {
            case 'buy_drink':
                return {
                    message: '你买了一杯麦酒，感到暖和起来。',
                    effects: [{ type: 'stamina', value: 10 }],
                    item: { id: 'ale', name: '麦酒', quantity: 1 }
                };
            case 'buy_room':
                return {
                    message: '你租了一间房间，可以好好休息了。',
                    effects: [{ type: 'hp', value: 'full' }, { type: 'mp', value: 'full' }],
                    item: { id: 'room_key', name: '房间钥匙', quantity: 1 }
                };
            case 'listen_story':
                return {
                    message: '老约翰讲起了有趣的故事...',
                    effects: [{ type: 'exp', value: 5 }],
                    story: '从前，在一个遥远的王国里...'
                };
            default:
                return { message: '动作已执行。' };
        }
    }

    /**
     * 结束对话
     */
    endDialogue(npcId) {
        this.activeDialogues.delete(npcId);
        return { success: true };
    }

    /**
     * 改变好感度
     */
    changeAttitude(npcId, delta) {
        const current = this.relationships.get(npcId) || 0;
        const newAttitude = Math.max(0, Math.min(100, current + delta));
        this.relationships.set(npcId, newAttitude);
        this.saveRelationships();

        // 检查好感度等级变化
        const oldLevel = this.getAttitudeLevel(current);
        const newLevel = this.getAttitudeLevel(newAttitude);

        if (oldLevel !== newLevel) {
            return {
                changed: true,
                oldLevel,
                newLevel,
                message: `${npcId}对你的态度发生了变化！`
            };
        }

        return { changed: false };
    }

    /**
     * 获取好感度等级
     */
    getAttitudeLevel(attitude) {
        if (attitude >= 80) return 'loved'; // 挚友
        if (attitude >= 60) return 'friendly'; // 友好
        if (attitude >= 40) return 'neutral'; // 中立
        if (attitude >= 20) return 'dislike'; // 不喜欢
        return 'hostile'; // 敌对
    }

    /**
     * 物体交互
     */
    interactWithObject(objectId) {
        const objects = {
            'quest_board': {
                name: '任务板',
                icon: '📋',
                interactions: [
                    { id: 'view_quests', text: '查看任务' },
                    { id: 'post_quest', text: '发布任务' }
                ]
            },
            'treasure_chest': {
                name: '宝箱',
                icon: '📦',
                interactions: [
                    { id: 'open', text: '打开宝箱' }
                ]
            },
            'fireplace': {
                name: '壁炉',
                icon: '🔥',
                interactions: [
                    { id: 'warm_up', text: '取暖' },
                    { id: 'cook', text: '烹饪' }
                ]
            }
        };

        const object = objects[objectId];
        if (!object) {
            return { success: false, error: '物体不存在' };
        }

        return {
            success: true,
            object,
            interactions: object.interactions
        };
    }

    /**
     * 记录交互历史
     */
    recordInteraction(type, targetId, details) {
        this.interactionHistory.push({
            timestamp: Date.now(),
            type,
            targetId,
            details
        });

        // 限制历史记录长度
        if (this.interactionHistory.length > 1000) {
            this.interactionHistory = this.interactionHistory.slice(-500);
        }

        localStorage.setItem('rpg_interaction_history', JSON.stringify(this.interactionHistory));
    }

    /**
     * 获取交互历史
     */
    getInteractionHistory(limit = 50) {
        return this.interactionHistory.slice(-limit);
    }

    /**
     * 检查事件触发
     */
    checkTriggers() {
        const triggers = [];

        for (const [npcId, attitude] of this.relationships.entries()) {
            const npc = this.getNPC(npcId);
            if (npc) {
                // 检查特殊事件
                if (attitude >= 80 && !npc.specialEventTriggered) {
                    triggers.push({
                        type: 'special_event',
                        npcId,
                        message: `${npc.name}似乎有重要的事情要告诉你...`
                    });
                }
            }
        }

        return triggers;
    }

    /**
     * 添加自定义NPC
     */
    addNPC(npc) {
        this.interactions.set(npc.id, npc);
        return { success: true, npc };
    }

    /**
     * 保存系统数据
     */
    async save() {
        await this.saveRelationships();
        return {
            relationships: Array.from(this.relationships.entries()),
            interactionHistory: this.interactionHistory
        };
    }

    /**
     * 加载系统数据
     */
    async load(data) {
        if (data) {
            if (data.relationships) {
                this.relationships = new Map(data.relationships);
            }
            if (data.interactionHistory) {
                this.interactionHistory = data.interactionHistory;
            }
        }
    }
}
