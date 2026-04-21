/**
 * 交互系统
 * 管理NPC对话和玩家交互
 */

export class InteractionSystem {
    constructor(engine) {
        this.engine = engine;
        this.isInitialized = false;
        this.npcs = [];
        this.currentDialogue = null;
    }

    async init() {
        if (this.isInitialized) return;

        console.log('[InteractionSystem] 初始化交互系统...');

        // 初始化NPC数据
        this.initializeNPCs();

        this.isInitialized = true;
        console.log('[InteractionSystem] 交互系统初始化完成');
    }

    // 初始化NPC
    initializeNPCs() {
        this.npcs = [
            {
                id: 'innkeeper',
                name: '酒馆老板',
                icon: '👨‍🍳',
                location: 'tavern',
                dialogue: {
                    initial: {
                        text: '欢迎来到冒险者酒馆！你想喝点什么，还是有其他需要？',
                        options: [
                            { text: '有什么喝的？', next: 'drinks' },
                            { text: '我需要任务', next: 'quests' },
                            { text: '只是路过', next: 'farewell' }
                        ]
                    },
                    drinks: {
                        text: '我们有麦芽酒（20金币）、红酒（30金币）和炖肉（40金币）。你想来点什么？',
                        options: [
                            { text: '来杯麦芽酒', action: 'buy_beer' },
                            { text: '来杯红酒', action: 'buy_wine' },
                            { text: '来份炖肉', action: 'buy_stew' },
                            { text: '算了', next: 'initial' }
                        ]
                    },
                    quests: {
                        text: '任务板上有一些村民们发布的委托。你可以去看看有没有感兴趣的。',
                        options: [
                            { text: '我去看看', action: 'go_quests' },
                            { text: '以后再说', next: 'initial' }
                        ]
                    },
                    farewell: {
                        text: '好的，祝你好运！记住，累了就回来休息。',
                        options: [
                            { text: '谢谢，再见', action: 'end' }
                        ]
                    }
                }
            },
            {
                id: 'merchant',
                name: '商人',
                icon: '👨‍💼',
                location: 'tavern',
                dialogue: {
                    initial: {
                        text: '看看我的商品吧！我有最好的装备和药水。',
                        options: [
                            { text: '看看装备', next: 'equipment' },
                            { text: '看看药水', next: 'potions' },
                            { text: '再看看', action: 'end' }
                        ]
                    },
                    equipment: {
                        text: '这把铁剑200金币，这面圆盾150金币，这双皮靴100金币。还有这枚力量戒指300金币。',
                        options: [
                            { text: '买铁剑', action: 'buy_sword' },
                            { text: '买圆盾', action: 'buy_shield' },
                            { text: '买皮靴', action: 'buy_boots' },
                            { text: '买力量戒指', action: 'buy_ring' },
                            { text: '返回', next: 'initial' }
                        ]
                    },
                    potions: {
                        text: '生命药水50金币，魔法药水50金币。都是上等的品质。',
                        options: [
                            { text: '买生命药水', action: 'buy_health_potion' },
                            { text: '买魔法药水', action: 'buy_mana_potion' },
                            { text: '返回', next: 'initial' }
                        ]
                    }
                }
            },
            {
                id: 'elder',
                name: '村庄长者',
                icon: '👴',
                location: 'village',
                dialogue: {
                    initial: {
                        text: '年轻的冒险者，欢迎来到我们的村庄。你看起来是个有经验的人。',
                        options: [
                            { text: '我有什么可以帮你的吗？', next: 'help' },
                            { text: '我在找冒险', next: 'adventure' },
                            { text: '只是路过', next: 'farewell' }
                        ]
                    },
                    help: {
                        text: '最近村里的收成不错，但森林里的怪物似乎增多了。如果你能帮忙清理一些，我们会很感激。',
                        options: [
                            { text: '我接受这个挑战', action: 'accept_quest' },
                            { text: '让我先准备一下', next: 'farewell' }
                        ]
                    },
                    adventure: {
                        text: '附近有很多冒险机会。森林深处有古代遗迹，山上也有危险的洞穴。',
                        options: [
                            { text: '告诉我更多关于遗迹的事', next: 'ruins' },
                            { text: '洞穴呢？', next: 'caves' },
                            { text: '谢谢你的建议', next: 'farewell' }
                        ]
                    },
                    ruins: {
                        text: '遗迹据说很久以前是一个繁荣王国的中心。现在那里可能还有宝藏，但也充满了危险。',
                        options: [
                            { text: '听起来很刺激', action: 'go_ruins' },
                            { text: '太危险了', next: 'farewell' }
                        ]
                    },
                    caves: {
                        text: '洞穴里据说住着各种怪物。有些冒险者说在那里看到了龙的踪迹。',
                        options: [
                            { text: '我要去看看', action: 'go_caves' },
                            { text: '还是算了吧', next: 'farewell' }
                        ]
                    },
                    farewell: {
                        text: '一路顺风，年轻的冒险者。愿诸神保佑你！',
                        options: [
                            { text: '谢谢，再见', action: 'end' }
                        ]
                    }
                }
            }
        ];
    }

    // 开始对话
    startDialogue(npcId) {
        const npc = this.npcs.find(n => n.id === npcId);
        if (!npc) {
            console.warn(`[InteractionSystem] NPC "${npcId}" 不存在`);
            return;
        }

        this.currentDialogue = {
            npc: npc,
            stage: 'initial'
        };

        this.renderDialogue();
    }

    // 渲染对话
    renderDialogue() {
        if (!this.currentDialogue) return;

        const dialogueDisplayEl = document.getElementById('dialogue-display');
        const dialogueOptionsEl = document.getElementById('dialogue-options');

        if (!dialogueDisplayEl || !dialogueOptionsEl) {
            console.warn('[InteractionSystem] 对话UI元素不存在');
            return;
        }

        const npc = this.currentDialogue.npc;
        const dialogue = npc.dialogue[this.currentDialogue.stage];

        if (!dialogue) {
            console.warn(`[InteractionSystem] 对话阶段 "${this.currentDialogue.stage}" 不存在`);
            return;
        }

        dialogueDisplayEl.innerHTML = `
            <div class="dialogue-speaker">${npc.icon} ${npc.name}</div>
            <div class="dialogue-text">${dialogue.text}</div>
        `;

        dialogueOptionsEl.innerHTML = dialogue.options.map((option, index) => `
            <div class="story-choice" onclick="interactionSystem.selectOption(${index})">
                ${option.text}
            </div>
        `).join('');
    }

    // 选择选项
    selectOption(optionIndex) {
        if (!this.currentDialogue) return;

        const npc = this.currentDialogue.npc;
        const dialogue = npc.dialogue[this.currentDialogue.stage];

        if (!dialogue || optionIndex < 0 || optionIndex >= dialogue.options.length) {
            return;
        }

        const option = dialogue.options[optionIndex];

        // 处理动作
        if (option.action) {
            this.handleAction(option.action, npc);
        }

        // 进入下一阶段或结束对话
        if (option.next) {
            this.currentDialogue.stage = option.next;
            this.renderDialogue();
        } else if (option.action === 'end') {
            this.endDialogue();
        }
    }

    // 处理动作
    handleAction(action, npc) {
        if (!window.game || !game.player) {
            return;
        }

        switch (action) {
            case 'buy_beer':
            case 'buy_wine':
            case 'buy_stew':
                if (window.tavernSystem) {
                    tavernSystem.drink(action.replace('buy_', ''));
                }
                break;
            case 'buy_sword':
            case 'buy_shield':
            case 'buy_boots':
            case 'buy_ring':
            case 'buy_health_potion':
            case 'buy_mana_potion':
                if (window.tavernSystem) {
                    tavernSystem.buyItem(action.replace('buy_', ''));
                }
                break;
            case 'go_quests':
                if (window.game) {
                    game.switchView('quest');
                }
                break;
            case 'accept_quest':
                if (window.questSystem) {
                    questSystem.acceptQuest('slime_hunt');
                }
                break;
            case 'go_ruins':
                if (window.mapSystem) {
                    mapSystem.moveTo('ruins');
                }
                break;
            case 'go_caves':
                if (window.mapSystem) {
                    mapSystem.moveTo('cave');
                }
                break;
            case 'end':
                this.endDialogue();
                break;
        }

        this.endDialogue();
    }

    // 结束对话
    endDialogue() {
        this.currentDialogue = null;

        const dialogueDisplayEl = document.getElementById('dialogue-display');
        const dialogueOptionsEl = document.getElementById('dialogue-options');

        if (dialogueDisplayEl) {
            dialogueDisplayEl.innerHTML = '<div class="story-text">没有对话</div>';
        }
        if (dialogueOptionsEl) {
            dialogueOptionsEl.innerHTML = '';
        }
    }

    // 获取当前位置的NPC列表
    getNPCsAtLocation(locationId) {
        return this.npcs.filter(npc => npc.location === locationId);
    }
}
