import { defaultScripts, defaultAchievements, defaultSkills } from '../../data/library.js';

export class GameEngine {
    constructor(db, api, ui) {
        this.db = db;
        this.api = api;
        this.ui = ui;
        this.state = {
            currentScript: null,
            history: [],
            playerStats: { hp: 100, maxHp: 100, mp: 100, maxMp: 100, exp: 0, maxExp: 100, level: 1, gold: 0, stamina: 100, maxStamina: 100, str: 10, agi: 10, int: 10, luk: 10 },
            inventory: [],
            gameStats: { totalGames: 0, totalActions: 0, totalTime: 0 }
        };
    }

    async init() {
        await this.db.init();
        await this.ensureData('scripts', defaultScripts);
        await this.ensureData('achievements', defaultAchievements);
        await this.ensureData('skills', defaultSkills);
        this.ui.bindEvents(this);
        this.ui.renderScripts(await this.db.getAll('scripts'));
        this.ui.updateBadges(await this.db.getAll('scripts'), await this.db.getAll('achievements'), await this.db.getAll('inventory'));
    }

    async ensureData(store, defaults) {
        const saved = await this.db.getAll(store);
        if (saved.length === 0) {
            for (const item of defaults) await this.db.put(store, item);
        }
    }

    async startNewGame(scriptId) {
        const scripts = await this.db.getAll('scripts');
        this.state.currentScript = scripts.find(s => s.id === scriptId);
        if (!this.state.currentScript) return;
        
        this.state.history = [];
        this.ui.switchView('game');
        this.ui.showGameInterface();
        this.ui.addStoryEntry('system', '🎮 游戏开始，正在初始化世界...');
        
        try {
            const response = await this.api.call(this.state.currentScript.prompt);
            this.handleAIResponse(response);
        } catch (e) {
            this.ui.addStoryEntry('system', '❌ 错误: ' + e.message);
        }
    }

    async sendAction(action) {
        if (!action) return;
        this.ui.addStoryEntry('user', action);
        this.state.history.push({ role: 'user', content: action });
        
        try {
            const context = this.state.history.slice(-10).map(h => `${h.role}: ${h.content}`).join('\n\n');
            const response = await this.api.call(context + '\n\n' + action);
            this.handleAIResponse(response);
        } catch (e) {
            this.ui.addStoryEntry('system', '❌ 错误: ' + e.message);
        }
    }

    handleAIResponse(response) {
        this.ui.addStoryEntry('ai', response);
        this.state.history.push({ role: 'assistant', content: response });
        this.ui.updateStatusPanel(response);
    }
}