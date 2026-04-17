/**
 * GameEngine - 游戏引擎
 * 统一酒馆游戏的核心引擎，管理游戏生命周期和所有子系统
 */

export class GameEngine {
    constructor() {
        this.version = '2.0.0';
        this.initialized = false;
        this.running = false;
        this.paused = false;
        this.gameTime = 0;
        this.lastTime = 0;

        // 子系统
        this.systems = new Map();

        // 事件系统
        this.events = new EventTarget();

        // 游戏状态
        this.state = {
            player: null,
            currentLocation: 'tavern',
            gameStarted: false,
            paused: false
        };

        // V2.0 新增：资源管理器
        this.assetManager = null;

        // V2.0 新增：渲染器
        this.renderer = null;

        // V2.0 新增：粒子系统
        this.particleSystem = null;

        // V2.0 新增：动画系统
        this.animationSystem = null;

        // V2.0 新增：特效系统
        this.effectSystem = null;

        // V2.0 新增：UI组件系统
        this.uiComponents = [];
    }

    /**
     * 初始化游戏引擎
     */
    async initialize() {
        if (this.initialized) {
            console.warn('游戏引擎已经初始化');
            return;
        }

        try {
            console.log('🚀 正在初始化游戏引擎...');

            // 初始化核心系统
            await this.initializeCoreSystems();

            // 初始化游戏系统
            await this.initializeGameSystems();

            // 加载游戏数据
            await this.loadGameData();

            this.initialized = true;
            this.running = true;
            this.lastTime = performance.now();

            // 触发初始化完成事件
            this.dispatchEvent(new CustomEvent('initialized'));

            console.log('✅ 游戏引擎初始化完成');
            return { success: true };
        } catch (error) {
            console.error('❌ 游戏引擎初始化失败:', error);
            throw error;
        }
    }

    /**
     * 初始化核心系统
     */
    async initializeCoreSystems() {
        console.log('📦 初始化核心系统...');

        // V2.0 新增：资源管理器（优先初始化）
        const AssetManager = await import('./AssetManager.js');
        this.assetManager = new AssetManager.AssetManager(this);
        await this.assetManager.initialize();
        this.registerSystem('assetManager', this.assetManager);

        // V2.0 新增：渲染器
        const Renderer = await import('./Renderer.js');
        this.renderer = new Renderer.Renderer(this);
        await this.renderer.initialize();
        this.registerSystem('renderer', this.renderer);

        // V2.0 新增：粒子系统
        const ParticleSystem = await import('./ParticleSystem.js');
        this.particleSystem = new ParticleSystem.ParticleSystem(this);
        await this.particleSystem.initialize();
        this.registerSystem('particleSystem', this.particleSystem);

        // V2.0 新增：动画系统
        const AnimationSystem = await import('./AnimationSystem.js');
        this.animationSystem = new AnimationSystem.AnimationSystem(this);
        await this.animationSystem.initialize();
        this.registerSystem('animationSystem', this.animationSystem);

        // V2.0 新增：特效系统
        const EffectSystem = await import('./EffectSystem.js');
        this.effectSystem = new EffectSystem.EffectSystem(this);
        await this.effectSystem.initialize();
        this.registerSystem('effectSystem', this.effectSystem);

        // 状态管理器
        const StateManager = await import('./StateManager.js');
        this.stateManager = new StateManager.StateManager(this);
        this.registerSystem('stateManager', this.stateManager);

        // 事件系统
        const EventSystem = await import('./EventSystem.js');
        this.eventSystem = new EventSystem.EventSystem(this);
        this.registerSystem('eventSystem', this.eventSystem);
    }

    /**
     * 初始化游戏系统
     */
    async initializeGameSystems() {
        console.log('🎮 初始化游戏系统...');

        // ========== 核心游戏系统 ==========
        
        // 角色系统
        const CharacterSystem = await import('../systems/CharacterSystem.js');
        this.characterSystem = new CharacterSystem.CharacterSystem(this);
        this.registerSystem('characterSystem', this.characterSystem);

        // 战斗系统
        const CombatSystem = await import('../systems/CombatSystem.js');
        this.battleSystem = new CombatSystem.CombatSystem(this);
        this.registerSystem('battleSystem', this.battleSystem);

        // 地图系统
        const MapSystem = await import('../systems/MapSystem.js');
        this.mapSystem = new MapSystem.MapSystem(this);
        this.registerSystem('mapSystem', this.mapSystem);

        // 酒馆系统
        const TavernSystem = await import('../systems/TavernSystem.js');
        this.tavernSystem = new TavernSystem.TavernSystem(this);
        this.registerSystem('tavernSystem', this.tavernSystem);

        // 任务系统
        const QuestSystem = await import('../systems/QuestSystem.js');
        this.questSystem = new QuestSystem.QuestSystem(this);
        this.registerSystem('questSystem', this.questSystem);

        // 剧情系统
        const StorySystem = await import('../systems/StorySystem.js');
        this.storySystem = new StorySystem.StorySystem(this);
        this.registerSystem('storySystem', this.storySystem);

        // 卡牌系统
        const CardSystem = await import('../systems/CardSystem.js');
        this.cardSystem = new CardSystem.CardSystem(this);
        this.registerSystem('cardSystem', this.cardSystem);

        // 职业系统
        const ClassSystem = await import('../systems/ClassSystem.js');
        this.classSystem = new ClassSystem.ClassSystem(this);
        this.registerSystem('classSystem', this.classSystem);

        // 升级系统
        const UpgradeSystem = await import('../systems/UpgradeSystem.js');
        this.upgradeSystem = new UpgradeSystem.UpgradeSystem(this);
        this.registerSystem('upgradeSystem', this.upgradeSystem);

        // 存档系统
        const SaveSystem = await import('../systems/SaveSystem.js');
        this.saveSystem = new SaveSystem.SaveSystem(this);
        this.registerSystem('saveSystem', this.saveSystem);

        // 音频系统
        const AudioSystem = await import('../systems/AudioSystem.js');
        this.audioSystem = new AudioSystem.AudioSystem(this);
        this.registerSystem('audioSystem', this.audioSystem);

        // ========== 新增：AI系统 ==========
        
        try {
            const AISystem = await import('../systems/AISystem.js');
            this.aiSystem = new AISystem.AISystem(this);
            await this.aiSystem.init();
            this.registerSystem('aiSystem', this.aiSystem);
        } catch (e) {
            console.warn('AI系统加载失败:', e.message);
        }

        // ========== 新增：交互系统 ==========
        
        try {
            const InteractionSystem = await import('../systems/InteractionSystem.js');
            this.interactionSystem = new InteractionSystem.InteractionSystem(this);
            await this.interactionSystem.init();
            this.registerSystem('interactionSystem', this.interactionSystem);
        } catch (e) {
            console.warn('交互系统加载失败:', e.message);
        }

        // ========== 新增：视觉效果系统 ==========
        
        // 时间系统
        try {
            const TimeSystem = await import('../systems/TimeSystem.js');
            this.timeSystem = new TimeSystem.default();
            this.timeSystem.init();
            this.registerSystem('timeSystem', this.timeSystem);
        } catch (e) {
            console.warn('时间系统加载失败:', e.message);
        }

        // 天气系统
        try {
            const WeatherSystem = await import('../systems/WeatherSystem.js');
            this.weatherSystem = new WeatherSystem.default();
            this.weatherSystem.init();
            this.registerSystem('weatherSystem', this.weatherSystem);
        } catch (e) {
            console.warn('天气系统加载失败:', e.message);
        }

        // 动态背景系统
        try {
            const DynamicBackground = await import('../systems/DynamicBackground.js');
            this.dynamicBackground = new DynamicBackground.default();
            this.dynamicBackground.init();
            this.registerSystem('dynamicBackground', this.dynamicBackground);
        } catch (e) {
            console.warn('动态背景系统加载失败:', e.message);
        }

        // ========== 新增：游戏深度系统 ==========
        
        // 成就系统
        try {
            const AchievementSystem = await import('../systems/achievement-system.js');
            this.achievementSystem = new AchievementSystem.default();
            this.achievementSystem.init();
            this.registerSystem('achievementSystem', this.achievementSystem);
        } catch (e) {
            console.warn('成就系统加载失败:', e.message);
        }

        // 合成系统
        try {
            const CraftingSystem = await import('../systems/crafting-system.js');
            this.craftingSystem = new CraftingSystem.default();
            this.craftingSystem.init();
            this.registerSystem('craftingSystem', this.craftingSystem);
        } catch (e) {
            console.warn('合成系统加载失败:', e.message);
        }

        // 公会系统
        try {
            const GuildSystem = await import('../systems/guild-system.js');
            this.guildSystem = new GuildSystem.default();
            this.guildSystem.init();
            this.registerSystem('guildSystem', this.guildSystem);
        } catch (e) {
            console.warn('公会系统加载失败:', e.message);
        }

        // 宠物系统
        try {
            const PetSystem = await import('../systems/pet-system.js');
            this.petSystem = new PetSystem.default();
            this.petSystem.init();
            this.registerSystem('petSystem', this.petSystem);
        } catch (e) {
            console.warn('宠物系统加载失败:', e.message);
        }

        // 背包系统
        try {
            const InventorySystem = await import('../systems/inventory_system.js');
            this.inventorySystem = InventorySystem.inventorySystem || new InventorySystem.default();
            this.registerSystem('inventorySystem', this.inventorySystem);
        } catch (e) {
            console.warn('背包系统加载失败:', e.message);
        }

        console.log('✅ 所有游戏系统初始化完成');
    }

    /**
     * 加载游戏数据
     */
    async loadGameData() {
        console.log('📊 加载游戏数据...');

        const GameData = await import('../data/GameData.js');
        this.gameData = GameData.default || GameData;

        console.log('✅ 游戏数据加载完成');
    }

    /**
     * 注册系统
     */
    registerSystem(name, system) {
        if (this.systems.has(name)) {
            console.warn(`系统 ${name} 已经注册`);
            return;
        }

        this.systems.set(name, system);
        console.log(`✅ 系统已注册: ${name}`);
    }

    /**
     * 获取系统
     */
    getSystem(name) {
        return this.systems.get(name);
    }

    /**
     * 开始新游戏
     */
    async startNewGame(characterData) {
        try {
            console.log('🎮 开始新游戏...');

            // 创建角色
            const player = await this.characterSystem.createCharacter(characterData);
            this.state.player = player;
            this.state.gameStarted = true;

            // 初始化其他系统
            await this.initializeGameForNewGame();

            // 触发游戏开始事件
            this.dispatchEvent(new CustomEvent('game-started', {
                detail: { player }
            }));

            console.log('✅ 新游戏开始成功');
            return { success: true, player };
        } catch (error) {
            console.error('❌ 开始新游戏失败:', error);
            throw error;
        }
    }

    /**
     * 为新游戏初始化系统
     */
    async initializeGameForNewGame() {
        // 初始化地图
        await this.mapSystem.initialize();

        // 初始化任务系统
        await this.questSystem.initialize(this.state.player);

        // 初始化剧情系统
        await this.storySystem.initialize(this.state.player);

        // 初始化卡牌系统
        await this.cardSystem.initialize(this.state.player);

        // 开始自动保存
        this.saveSystem.startAutoSave();
    }

    /**
     * 加载游戏
     */
    async loadGame() {
        try {
            console.log('📂 加载游戏...');

            const saveData = await this.saveSystem.load();
            if (!saveData) {
                throw new Error('没有找到存档');
            }

            // 恢复游戏状态
            this.state = saveData.state;

            // 恢复玩家数据
            this.state.player = await this.characterSystem.loadCharacter(saveData.player);

            // 恢复其他系统状态
            await this.restoreSystemsState(saveData);

            // 触发游戏加载事件
            this.dispatchEvent(new CustomEvent('game-loaded', {
                detail: { player: this.state.player }
            }));

            console.log('✅ 游戏加载成功');
            return { success: true, player: this.state.player };
        } catch (error) {
            console.error('❌ 加载游戏失败:', error);
            throw error;
        }
    }

    /**
     * 恢复系统状态
     */
    async restoreSystemsState(saveData) {
        // 恢复任务系统
        if (saveData.quests) {
            await this.questSystem.restore(saveData.quests);
        }

        // 恢复剧情系统
        if (saveData.story) {
            await this.storySystem.restore(saveData.story);
        }

        // 恢复卡牌系统
        if (saveData.cards) {
            await this.cardSystem.restore(saveData.cards);
        }
    }

    /**
     * 保存游戏
     */
    async saveGame() {
        try {
            console.log('💾 保存游戏...');

            const saveData = {
                version: this.version,
                timestamp: Date.now(),
                state: this.state,
                player: this.state.player,
                quests: await this.questSystem.save(),
                story: await this.storySystem.save(),
                cards: await this.cardSystem.save()
            };

            await this.saveSystem.save(saveData);

            console.log('✅ 游戏保存成功');
            return { success: true };
        } catch (error) {
            console.error('❌ 保存游戏失败:', error);
            throw error;
        }
    }

    /**
     * 主游戏循环
     */
    gameLoop(currentTime) {
        if (!this.running) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (!this.paused) {
            this.gameTime += deltaTime;
            this.update(deltaTime);
        }

        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    /**
     * 更新游戏状态
     */
    update(deltaTime) {
        // V2.0: 更新粒子系统（优先更新）
        if (this.particleSystem) {
            this.particleSystem.update();
        }

        // 更新所有系统
        this.systems.forEach((system, name) => {
            if (system.update && typeof system.update === 'function') {
                try {
                    system.update(deltaTime);
                } catch (error) {
                    console.error(`系统 ${name} 更新失败:`, error);
                }
            }
        });
    }

    /**
     * 渲染游戏画面
     */
    render() {
        // V2.0: 使用渲染器进行渲染
        if (this.renderer && this.renderer.initialized) {
            this.renderer.render();
        }

        // 各系统可以添加自定义渲染逻辑
    }

    /**
     * 暂停游戏
     */
    pause() {
        this.paused = true;
        this.state.paused = true;
        this.dispatchEvent(new CustomEvent('game-paused'));
        console.log('⏸️ 游戏已暂停');
    }

    /**
     * 恢复游戏
     */
    resume() {
        this.paused = false;
        this.state.paused = false;
        this.lastTime = performance.now();
        this.dispatchEvent(new CustomEvent('game-resumed'));
        console.log('▶️ 游戏已恢复');
    }

    /**
     * 检查游戏是否暂停
     */
    isPaused() {
        return this.paused;
    }

    /**
     * 执行玩家动作
     */
    async executePlayerAction(action) {
        try {
            console.log('⚡ 执行玩家动作:', action);

            let result;

            // 根据动作类型路由到相应系统
            switch (action.type) {
                case 'move':
                    result = await this.mapSystem.movePlayer(action.x, action.y);
                    break;
                case 'attack':
                    result = await this.battleSystem.playerAttack(action.target);
                    break;
                case 'useSkill':
                    result = await this.battleSystem.useSkill(action.skillId, action.target);
                    break;
                case 'useCard':
                    result = await this.cardSystem.useCard(action.cardId, action.target);
                    break;
                case 'interact':
                    result = await this.tavernSystem.interact(action.npcId);
                    break;
                case 'talk':
                    result = await this.tavernSystem.talkToNPC(action.npcId, action.topic);
                    break;
                case 'buy':
                    result = await this.tavernSystem.buyItem(action.itemId);
                    break;
                case 'sell':
                    result = await this.tavernSystem.sellItem(action.itemId);
                    break;
                case 'rest':
                    result = await this.tavernSystem.rest();
                    break;
                case 'acceptQuest':
                    result = await this.questSystem.acceptQuest(action.questId);
                    break;
                case 'completeQuest':
                    result = await this.questSystem.completeQuest(action.questId);
                    break;
                case 'useItem':
                    result = await this.characterSystem.useItem(action.itemId);
                    break;
                case 'equip':
                    result = await this.characterSystem.equip(action.itemId);
                    break;
                case 'unequip':
                    result = await this.characterSystem.unequip(action.slot);
                    break;
                case 'learnSkill':
                    result = await this.upgradeSystem.learnSkill(action.skillId);
                    break;
                case 'upgradeStat':
                    result = await this.upgradeSystem.upgradeStat(action.stat);
                    break;
                case 'changeClass':
                    result = await this.classSystem.changeClass(action.classId);
                    break;
                
                // ========== 新增：AI系统动作 ==========
                case 'aiGenerate':
                    if (this.aiSystem) {
                        result = await this.aiSystem.generate(action.promptType, action.prompt);
                    } else {
                        result = { success: false, message: 'AI系统未初始化' };
                    }
                    break;
                
                // ========== 新增：交互系统动作 ==========
                case 'startDialogue':
                    if (this.interactionSystem) {
                        result = await this.interactionSystem.startDialogue(action.npcId);
                    } else {
                        result = { success: false, message: '交互系统未初始化' };
                    }
                    break;
                case 'selectDialogueOption':
                    if (this.interactionSystem) {
                        result = await this.interactionSystem.selectOption(action.optionIndex);
                    } else {
                        result = { success: false, message: '交互系统未初始化' };
                    }
                    break;
                
                // ========== 新增：时间系统动作 ==========
                case 'setTimeScale':
                    if (this.timeSystem) {
                        this.timeSystem.timeScale = action.scale;
                        result = { success: true, timeScale: action.scale };
                    } else {
                        result = { success: false, message: '时间系统未初始化' };
                    }
                    break;
                
                // ========== 新增：天气系统动作 ==========
                case 'setWeather':
                    if (this.weatherSystem) {
                        this.weatherSystem.setWeather(action.weather);
                        result = { success: true, weather: action.weather };
                    } else {
                        result = { success: false, message: '天气系统未初始化' };
                    }
                    break;
                
                // ========== 新增：成就系统动作 ==========
                case 'checkAchievements':
                    if (this.achievementSystem) {
                        result = await this.achievementSystem.checkAchievements(this.state.player, action.stats);
                    } else {
                        result = { success: false, message: '成就系统未初始化' };
                    }
                    break;
                
                // ========== 新增：合成系统动作 ==========
                case 'craft':
                    if (this.craftingSystem) {
                        result = await this.craftingSystem.craft(action.recipeId, action.materials);
                    } else {
                        result = { success: false, message: '合成系统未初始化' };
                    }
                    break;
                
                // ========== 新增：公会系统动作 ==========
                case 'joinGuild':
                    if (this.guildSystem) {
                        result = await this.guildSystem.joinGuild(action.guildId);
                    } else {
                        result = { success: false, message: '公会系统未初始化' };
                    }
                    break;
                case 'leaveGuild':
                    if (this.guildSystem) {
                        result = await this.guildSystem.leaveGuild();
                    } else {
                        result = { success: false, message: '公会系统未初始化' };
                    }
                    break;
                
                // ========== 新增：宠物系统动作 ==========
                case 'summonPet':
                    if (this.petSystem) {
                        result = await this.petSystem.summonPet(action.petId);
                    } else {
                        result = { success: false, message: '宠物系统未初始化' };
                    }
                    break;
                case 'dismissPet':
                    if (this.petSystem) {
                        result = await this.petSystem.dismissPet();
                    } else {
                        result = { success: false, message: '宠物系统未初始化' };
                    }
                    break;
                case 'feedPet':
                    if (this.petSystem) {
                        result = await this.petSystem.feedPet(action.itemId);
                    } else {
                        result = { success: false, message: '宠物系统未初始化' };
                    }
                    break;
                
                default:
                    console.warn('未知的动作类型:', action.type);
                    result = { success: false, message: '未知的动作' };
            }

            return result;
        } catch (error) {
            console.error('❌ 执行动作失败:', error);
            throw error;
        }
    }

    /**
     * 生成AI内容
     */
    async generateAIContent(prompt, type = 'text') {
        try {
            console.log('🤖 生成AI内容:', type, prompt);

            // 这里可以集成实际的AI API
            // 目前返回模拟数据
            const mockResult = {
                type: type,
                prompt: prompt,
                content: `[AI生成的内容 - ${type}] ${prompt}`,
                timestamp: Date.now()
            };

            return mockResult;
        } catch (error) {
            console.error('❌ AI生成失败:', error);
            throw error;
        }
    }

    /**
     * 添加事件监听
     */
    on(event, callback) {
        this.events.addEventListener(event, callback);
    }

    /**
     * 移除事件监听
     */
    off(event, callback) {
        this.events.removeEventListener(event, callback);
    }

    /**
     * 分发事件
     */
    dispatchEvent(event) {
        this.events.dispatchEvent(event);
    }

    /**
     * 关闭游戏引擎
     */
    shutdown() {
        console.log('🛑 关闭游戏引擎...');

        this.running = false;
        this.paused = true;

        // 关闭所有系统
        this.systems.forEach((system, name) => {
            if (system.shutdown && typeof system.shutdown === 'function') {
                try {
                    system.shutdown();
                    console.log(`✅ 系统 ${name} 已关闭`);
                } catch (error) {
                    console.error(`系统 ${name} 关闭失败:`, error);
                }
            }
        });

        this.systems.clear();
        this.initialized = false;

        console.log('✅ 游戏引擎已关闭');
    }
}

// 默认导出
export default GameEngine;
