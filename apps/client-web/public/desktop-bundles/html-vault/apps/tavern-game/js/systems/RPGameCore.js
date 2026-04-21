/**
 * RPGameCore - 完整角色扮演游戏核心系统
 * 包含所有主要游戏系统的协调和管理
 */

export class RPGameCore {
    constructor() {
        this.systems = {};
        this.initialized = false;
    }

    /**
     * 初始化所有游戏系统
     */
    async initialize() {
        if (this.initialized) return;

        console.log('🎮 正在初始化RPG核心系统...');

        // 按顺序初始化各系统
        await this.initAIGenerationSystem();
        await this.initMapSystem();
        await this.initInteractionSystem();
        await this.initCombatSystem();
        await this.initCardSystem();
        await this.initStorySystem();
        await this.initCharacterUpgradeSystem();
        await this.initClassSystem();

        this.initialized = true;
        console.log('✅ RPG核心系统初始化完成');
    }

    /**
     * AI生成内容系统 - 文本/图像/音频/视频
     */
    async initAIGenerationSystem() {
        const AIGenerationSystem = (await import('./AIGenerationSystem.js')).default;
        this.systems.aiGeneration = new AIGenerationSystem();
        await this.systems.aiGeneration.initialize();
    }

    /**
     * 地图系统 - 交互式世界地图
     */
    async initMapSystem() {
        const MapSystem = (await import('./MapSystem.js')).default;
        this.systems.map = new MapSystem();
        await this.systems.map.initialize();
    }

    /**
     * 交互系统 - 与NPC、环境交互
     */
    async initInteractionSystem() {
        const InteractionSystem = (await import('./InteractionSystem.js')).default;
        this.systems.interaction = new InteractionSystem();
        await this.systems.interaction.initialize();
    }

    /**
     * 战斗系统 - 回合制战斗
     */
    async initCombatSystem() {
        const CombatSystem = (await import('./CombatSystem.js')).default;
        this.systems.combat = new CombatSystem();
        await this.systems.combat.initialize();
    }

    /**
     * 卡牌系统 - 卡牌收集和使用
     */
    async initCardSystem() {
        const CardSystem = (await import('./CardSystem.js')).default;
        this.systems.cards = new CardSystem();
        await this.systems.cards.initialize();
    }

    /**
     * 剧情系统 - 分支剧情
     */
    async initStorySystem() {
        const StorySystem = (await import('./StorySystem.js')).default;
        this.systems.story = new StorySystem();
        await this.systems.story.initialize();
    }

    /**
     * 角色升级系统 - 属性升级
     */
    async initCharacterUpgradeSystem() {
        const CharacterUpgradeSystem = (await import('./CharacterUpgradeSystem.js')).default;
        this.systems.characterUpgrade = new CharacterUpgradeSystem();
        await this.systems.characterUpgrade.initialize();
    }

    /**
     * 职业系统 - 不同职业和转职
     */
    async initClassSystem() {
        const ClassSystem = (await import('./ClassSystem.js')).default;
        this.systems.class = new ClassSystem();
        await this.systems.class.initialize();
    }

    /**
     * 获取指定系统实例
     */
    getSystem(systemName) {
        return this.systems[systemName];
    }

    /**
     * 游戏主循环
     */
    gameLoop(deltaTime) {
        if (!this.initialized) return;

        // 更新各系统
        Object.values(this.systems).forEach(system => {
            if (system.update) {
                system.update(deltaTime);
            }
        });
    }

    /**
     * 游戏保存
     */
    async saveGame() {
        const saveData = {};

        // 收集各系统数据
        for (const [name, system] of Object.entries(this.systems)) {
            if (system.save) {
                saveData[name] = await system.save();
            }
        }

        return saveData;
    }

    /**
     * 游戏加载
     */
    async loadGame(saveData) {
        // 恢复各系统数据
        for (const [name, system] of Object.entries(this.systems)) {
            if (saveData[name] && system.load) {
                await system.load(saveData[name]);
            }
        }
    }
}

// 全局单例
export const RPGCore = new RPGameCore();
