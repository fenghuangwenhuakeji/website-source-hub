/**
 * 游戏引擎
 * 整合所有系统的主引擎
 */

// 检查并确保各系统已加载
function ensureSystemsLoaded() {
    const requiredSystems = [
        'characterSystem',
        'cardSystem',
        'audioSystem',
        'saveSystem'
    ];

    const missingSystems = [];
    requiredSystems.forEach(systemName => {
        if (!window[systemName]) {
            missingSystems.push(systemName);
        }
    });

    if (missingSystems.length > 0) {
        console.warn('⚠️ 以下系统未加载:', missingSystems.join(', '));
        return false;
    }

    return true;
}

class GameEngine {
    constructor() {
        this.initialized = false;
        this.running = false;
        this.paused = false;
        this.gameTime = 0;
        this.gameSpeed = 1;
        this.frameCount = 0;

        // 游戏状态
        this.state = {
            currentScene: 'tavern',
            player: null,
            party: [],
            inventory: [],
            gold: 100,
            inCombat: false,
            inDialogue: false
        };

        // 系统引用
        this.systems = {
            character: window.characterSystem || null,
            card: window.cardSystem || null,
            audio: window.audioSystem || null,
            save: window.saveSystem || null
        };

        // 事件系统
        this.events = {};
        this.gameLoop = null;
    }

    /**
     * 初始化游戏引擎
     */
    async initialize() {
        console.log('初始化游戏引擎...');

        try {
            // 等待DOM加载完成
            if (document.readyState !== 'complete') {
                await new Promise(resolve => window.addEventListener('load', resolve));
            }

            // 确保各系统已加载
            if (!ensureSystemsLoaded()) {
                throw new Error('部分系统未加载，请检查script标签顺序');
            }

            // 初始化各系统
            const systemsToInit = [
                { name: 'character', system: this.systems.character },
                { name: 'card', system: this.systems.card },
                { name: 'audio', system: this.systems.audio },
                { name: 'save', system: this.systems.save }
            ];

            for (const { name, system } of systemsToInit) {
                if (system && typeof system.initialize === 'function') {
                    const result = await system.initialize();
                    if (!result.success) {
                        console.warn(`⚠️ ${name}系统初始化失败:`, result.error);
                    } else {
                        console.log(`✅ ${name}系统初始化成功`);
                    }
                }
            }

            // 初始化UI
            this.initializeUI();

            // 设置自动保存
            if (this.systems.save) {
                this.systems.save.startAutoSave(this);
            }

            this.initialized = true;
            console.log('✅ 游戏引擎初始化完成！');

            // 触发初始化完成事件
            this.emit('initialized');

            return { success: true };
        } catch (error) {
            console.error('❌ 游戏引擎初始化失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 初始化UI
     */
    initializeUI() {
        // 设置错误处理
        window.onerror = (message, source, lineno, colno, error) => {
            console.error('发生错误:', message);
            console.error('来源:', source);
            console.error('行号:', lineno);
            console.error('列号:', colno);
            console.error('错误对象:', error);

            this.emit('error', {
                message, source, lineno, colno, error
            });

            return false; // 让默认错误处理器继续执行
        };

        // 注册键盘事件
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
    }

    /**
     * 处理键盘事件
     */
    handleKeyDown(event) {
        // ESC键暂停
        if (event.key === 'Escape') {
            this.togglePause();
        }

        // F5快捷保存
        if (event.key === 'F5') {
            event.preventDefault();
            this.quickSave();
        }

        // F9快捷加载
        if (event.key === 'F9') {
            event.preventDefault();
            this.quickLoad();
        }
    }

    /**
     * 开始游戏
     */
    async startGame(characterData = null) {
        console.log('🎮 开始游戏...');

        try {
            // 初始化角色
            if (this.systems.character && characterData) {
                if (typeof this.systems.character.init === 'function') {
                    this.systems.character.init(characterData);
                }
                this.state.player = characterData;
            } else if (!this.state.player) {
                // 创建默认角色
                this.state.player = {
                    name: '冒险者',
                    level: 1,
                    hp: 100,
                    maxHp: 100,
                    mp: 100,
                    maxMp: 100
                };
            }

            // 初始化卡组
            if (this.systems.card) {
                if (typeof this.systems.card.initializeDeck === 'function') {
                    this.systems.card.initializeDeck();
                }
            }

            // 播放开始音效
            if (this.systems.audio) {
                this.systems.audio.playSound('success');
            }

            // 启动游戏循环
            this.startGameLoop();

            this.running = true;
            this.paused = false;

            console.log('✅ 游戏已开始');
            this.emit('game-started', { player: this.state.player });

            return { success: true };
        } catch (error) {
            console.error('开始游戏失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 启动游戏循环
     */
    startGameLoop() {
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }

        const loop = (timestamp) => {
            if (!this.running) return;

            if (!this.paused) {
                this.update(timestamp);
            }

            this.render();
            this.gameLoop = requestAnimationFrame(loop);
        };

        this.gameLoop = requestAnimationFrame(loop);
    }

    /**
     * 更新游戏逻辑
     */
    update(timestamp) {
        this.frameCount++;
        this.gameTime += this.gameSpeed;

        // 更新各系统
        // 这里可以添加系统特定的更新逻辑
    }

    /**
     * 渲染游戏画面
     */
    render() {
        // 这里可以添加渲染逻辑
        // 例如更新UI元素、画布等
    }

    /**
     * 暂停/继续游戏
     */
    togglePause() {
        this.paused = !this.paused;
        console.log(this.paused ? '⏸️ 游戏已暂停' : '▶️ 游戏继续');
        this.emit('pause-toggled', { paused: this.paused });
    }

    /**
     * 快速保存
     */
    async quickSave() {
        if (!this.systems.save) {
            console.warn('⚠️ 存档系统未初始化');
            return { success: false, error: '存档系统未初始化' };
        }

        const saveData = {
            state: this.state,
            gameTime: this.gameTime,
            timestamp: Date.now()
        };

        const result = await this.systems.save.saveGame(saveData, 'auto');

        if (result.success && this.systems.audio) {
            this.systems.audio.playSound('success');
        }

        return result;
    }

    /**
     * 快速加载
     */
    async quickLoad() {
        if (!this.systems.save) {
            console.warn('⚠️ 存档系统未初始化');
            return { success: false, error: '存档系统未初始化' };
        }

        const result = await this.systems.save.loadGame('auto');

        if (result.success) {
            this.state = result.data.state;
            this.gameTime = result.data.gameTime;
            console.log('✅ 存档已加载');

            if (this.systems.audio) {
                this.systems.audio.playSound('success');
            }
        }

        return result;
    }

    /**
     * 停止游戏
     */
    stopGame() {
        this.running = false;

        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }

        // 停止自动保存
        if (this.systems.save) {
            this.systems.save.stopAutoSave();
        }

        console.log('⏹️ 游戏已停止');
        this.emit('game-stopped');
    }

    /**
     * 事件系统
     */
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    emit(event, data = {}) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }

    /**
     * 获取游戏状态
     */
    getState() {
        return {
            ...this.state,
            gameTime: this.gameTime,
            paused: this.paused,
            running: this.running
        };
    }
}

// 创建全局游戏引擎实例
let gameEngine = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('页面加载完成，初始化游戏...');

    // 创建游戏引擎实例
    gameEngine = new GameEngine();

    // 初始化
    await gameEngine.initialize();

    // 将引擎暴露到全局
    window.gameEngine = gameEngine;
    window.GameEngine = GameEngine;
});

// 导出（用于模块化系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameEngine, gameEngine };
} else {
    window.GameEngine = GameEngine;
    window.gameEngine = gameEngine;
}

console.log('✅ 游戏引擎加载完成');
