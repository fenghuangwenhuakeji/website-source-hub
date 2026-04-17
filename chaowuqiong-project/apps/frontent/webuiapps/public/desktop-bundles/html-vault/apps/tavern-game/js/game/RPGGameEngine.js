/**
 * RPG游戏引擎 - 核心整合系统
 * 整合所有游戏系统：AI生成、地图、交互、战斗、卡牌、剧情、角色升级、职业
 */

import AIGenerationSystem from '../systems/AIGenerationSystem.js';
import MapSystem from '../systems/MapSystem.js';
import InteractionSystem from '../systems/InteractionSystem.js';
import CombatSystem from '../systems/CombatSystem.js';
import CardSystem from '../systems/CardSystem.js';
import StorySystem from '../systems/StorySystem.js';
import CharacterUpgradeSystem from '../systems/CharacterUpgradeSystem.js';
import ClassSystem from '../systems/ClassSystem.js';

export default class RPGGameEngine {
    constructor() {
        this.initialized = false;
        this.running = false;
        this.gameTime = 0;
        this.gameTimeSpeed = 1;

        // 核心系统
        this.aiSystem = new AIGenerationSystem();
        this.mapSystem = new MapSystem();
        this.interactionSystem = new InteractionSystem();
        this.combatSystem = new CombatSystem();
        this.cardSystem = new CardSystem();
        this.storySystem = new StorySystem();
        this.characterSystem = new CharacterUpgradeSystem();
        this.classSystem = new ClassSystem();

        // 游戏状态
        this.state = {
            paused: false,
            inCombat: false,
            inDialogue: false,
            currentScene: 'tavern',
            player: null,
            party: [],
            inventory: [],
            gold: 100
        };

        // 事件系统
        this.events = {};
        this.gameLoop = null;
    }

    /**
     * 初始化游戏引擎
     */
    async initialize() {
        console.log('🎮 RPG游戏引擎初始化中...');

        try {
            // 初始化所有系统
            await this.aiSystem.initialize();
            await this.mapSystem.initialize();
            await this.interactionSystem.initialize();
            await this.combatSystem.initialize();
            await this.cardSystem.initialize();
            await this.storySystem.initialize();
            await this.characterSystem.initialize();
            await this.classSystem.initialize();

            this.initialized = true;
            console.log('✅ RPG游戏引擎初始化完成！');

            this.emit('initialized', {
                systems: [
                    'AI生成系统',
                    '地图系统',
                    '交互系统',
                    '战斗系统',
                    '卡牌系统',
                    '剧情系统',
                    '角色升级系统',
                    '职业系统'
                ]
            });

            return { success: true };
        } catch (error) {
            console.error('❌ RPG游戏引擎初始化失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 开始新游戏
     */
    async startNewGame(characterData) {
        console.log('🎮 开始新游戏...');

        try {
            // 创建角色
            const createResult = this.characterSystem.createCharacter(characterData);
            if (!createResult.success) {
                return createResult;
            }

            // 选择职业
            if (characterData.class) {
                this.classSystem.selectClass(characterData.class);
            }

            // 设置初始状态
            this.state.player = this.characterSystem.player;
            this.state.gold = 100;

            // 初始化卡组
            this.cardSystem.startBattle();

            // 开始序章剧情
            await this.storySystem.startChapter('prologue');

            // 启动游戏循环
            this.startGameLoop();

            this.running = true;
            this.emit('game-started', { player: this.state.player });

            return { success: true, player: this.state.player };
        } catch (error) {
            console.error('开始新游戏失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 启动游戏循环
     */
    startGameLoop() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }

        this.gameLoop = setInterval(() => {
            if (!this.state.paused && this.running) {
                this.update();
            }
        }, 1000 / 60); // 60 FPS
    }

    /**
     * 游戏更新
     */
    update() {
        this.gameTime += this.gameTimeSpeed;

        // 更新各系统
        if (this.state.inCombat) {
            // 战斗更新
        } else if (this.state.inDialogue) {
            // 对话更新
        } else {
            // 正常更新
            this.updateExploration();
        }
    }

    /**
     * 探索更新
     */
    updateExploration() {
        // 检查附近的NPC
        const nearbyNPCs = this.interactionSystem.getNearbyInteractions(
            this.mapSystem.playerPosition
        );

        if (nearbyNPCs.length > 0) {
            this.emit('nearby-npcs', nearbyNPCs);
        }

        // 检查随机事件
        if (Math.random() < 0.001) {
            this.triggerRandomEvent();
        }
    }

    /**
     * 触发随机事件
     */
    async triggerRandomEvent() {
        const events = [
            { type: 'encounter', message: '你遇到了野生怪物！' },
            { type: 'treasure', message: '你发现了一个宝箱！' },
            { type: 'merchant', message: '一个旅行商人路过...' }
        ];

        const event = events[Math.floor(Math.random() * events.length)];
        this.emit('random-event', event);

        if (event.type === 'encounter') {
            await this.startRandomCombat();
        }
    }

    /**
     * 开始随机战斗
     */
    async startRandomCombat() {
        const enemies = ['wolf', 'goblin', 'slime'];
        const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];

        const player = this.getPlayerCombatStats();
        const combatResult = this.combatSystem.startCombat(player, [randomEnemy]);

        if (combatResult.success) {
            this.state.inCombat = true;
            this.cardSystem.startBattle();
            this.emit('combat-started', combatResult);
        }
    }

    /**
     * 获取玩家战斗属性
     */
    getPlayerCombatStats() {
        const derived = this.characterSystem.derivedStats;
        const classInfo = this.classSystem.getClassInfo();

        return {
            name: this.state.player.name,
            hp: derived.hp,
            mp: derived.mp,
            attack: derived.attack,
            defense: derived.defense,
            agility: derived.speed,
            intelligence: derived.magicAttack,
            class: classInfo?.mainClass?.id || 'warrior',
            skills: classInfo?.skills || []
        };
    }

    /**
     * 执行玩家行动
     */
    async executePlayerAction(action) {
        if (this.state.inCombat) {
            return await this.combatSystem.executeTurn(action);
        } else if (this.state.inDialogue) {
            return await this.interactionSystem.continueDialogue(action);
        } else {
            return await this.executeExplorationAction(action);
        }
    }

    /**
     * 执行探索行动
     */
    async executeExplorationAction(action) {
        switch (action.type) {
            case 'move':
                return this.mapSystem.moveTo(action.x, action.y);
            case 'interact':
                return await this.interactionSystem.startInteraction(action.targetId);
            case 'use_item':
                return this.useItem(action.itemId);
            case 'rest':
                return this.rest();
            case 'generate_content':
                return await this.generateAIContent(action.prompt, action.type);
            default:
                return { success: false, error: '未知行动类型' };
        }
    }

    /**
     * 使用物品
     */
    useItem(itemId) {
        const item = this.state.inventory.find(i => i.id === itemId);
        if (!item) {
            return { success: false, error: '物品不存在' };
        }

        // 物品效果
        const effects = {
            'potion_hp': () => {
                this.characterSystem.derivedStats.hp = Math.min(
                    this.characterSystem.derivedStats.maxHp,
                    this.characterSystem.derivedStats.hp + 50
                );
            },
            'potion_mp': () => {
                this.characterSystem.derivedStats.mp = Math.min(
                    this.characterSystem.derivedStats.maxMp,
                    this.characterSystem.derivedStats.mp + 50
                );
            }
        };

        if (effects[itemId]) {
            effects[itemId]();
            // 移除物品
            item.quantity--;
            if (item.quantity <= 0) {
                this.state.inventory = this.state.inventory.filter(i => i.id !== itemId);
            }
            return { success: true, message: `使用了${item.name}` };
        }

        return { success: false, error: '物品无法使用' };
    }

    /**
     * 休息
     */
    rest() {
        const derived = this.characterSystem.derivedStats;
        derived.hp = derived.maxHp;
        derived.mp = derived.maxMp;
        this.emit('rested', { hp: derived.hp, mp: derived.mp });
        return { success: true, message: '休息恢复完毕' };
    }

    /**
     * 生成AI内容
     */
    async generateAIContent(prompt, type = 'text') {
        switch (type) {
            case 'text':
                return await this.aiSystem.generateText(prompt);
            case 'image':
                return await this.aiSystem.generateImage(prompt);
            case 'character_avatar':
                return await this.aiSystem.generateCharacterAvatar(prompt);
            case 'scene_image':
                return await this.aiSystem.generateSceneImage(prompt);
            case 'speech':
                return await this.aiSystem.generateSpeech(prompt);
            case 'story_fragment':
                return await this.aiSystem.generateStoryFragment(prompt);
            default:
                return await this.aiSystem.generateText(prompt);
        }
    }

    /**
     * 获取游戏状态
     */
    getGameState() {
        return {
            running: this.running,
            paused: this.state.paused,
            inCombat: this.state.inCombat,
            inDialogue: this.state.inDialogue,
            gameTime: this.gameTime,
            player: this.state.player,
            party: this.state.party,
            inventory: this.state.inventory,
            gold: this.state.gold
        };
    }

    /**
     * 获取所有系统状态
     */
    getSystemStates() {
        return {
            map: this.mapSystem.getRenderData(),
            character: this.characterSystem.getPlayerInfo(),
            class: this.classSystem.getClassInfo(),
            cards: this.cardSystem.getHand(),
            combat: this.combatSystem.getCombatState(),
            story: this.storySystem.getCurrentScene(),
            interactions: this.interactionSystem.getActiveDialogues()
        };
    }

    /**
     * 暂停游戏
     */
    pause() {
        this.state.paused = true;
        this.emit('paused');
    }

    /**
     * 继续游戏
     */
    resume() {
        this.state.paused = false;
        this.emit('resumed');
    }

    /**
     * 保存游戏
     */
    async saveGame(slot = 'auto') {
        const saveData = {
            state: this.state,
            gameTime: this.gameTime,
            systems: {
                map: await this.mapSystem.save(),
                character: await this.characterSystem.save(),
                class: await this.classSystem.save(),
                cards: await this.cardSystem.save(),
                combat: await this.combatSystem.save(),
                story: await this.storySystem.save(),
                interactions: await this.interactionSystem.save()
            },
            timestamp: Date.now()
        };

        localStorage.setItem(`rpg_save_${slot}`, JSON.stringify(saveData));
        this.emit('saved', { slot });
        return { success: true, slot };
    }

    /**
     * 加载游戏
     */
    async loadGame(slot = 'auto') {
        const saveData = localStorage.getItem(`rpg_save_${slot}`);
        if (!saveData) {
            return { success: false, error: '存档不存在' };
        }

        try {
            const data = JSON.parse(saveData);
            this.state = data.state;
            this.gameTime = data.gameTime;

            // 加载各系统数据
            await this.mapSystem.load(data.systems.map);
            await this.characterSystem.load(data.systems.character);
            await this.classSystem.load(data.systems.class);
            await this.cardSystem.load(data.systems.cards);
            await this.combatSystem.load(data.systems.combat);
            await this.storySystem.load(data.systems.story);
            await this.interactionSystem.load(data.systems.interactions);

            this.running = true;
            this.emit('loaded', { slot });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * 事件监听
     */
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    /**
     * 取消事件监听
     */
    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    /**
     * 触发事件
     */
    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }

    /**
     * 关闭游戏
     */
    shutdown() {
        this.running = false;
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
        this.emit('shutdown');
    }
}

// 导出全局实例
export const gameEngine = new RPGGameEngine();
