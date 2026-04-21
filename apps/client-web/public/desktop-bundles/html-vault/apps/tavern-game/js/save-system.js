/**
 * 存档系统
 * 处理游戏存档和加载
 */

class SaveSystem {
    constructor() {
        this.initialized = false;
        this.saveSlots = {};
        this.autoSaveInterval = null;
        this.autoSaveDelay = 60000; // 1分钟自动保存
        this.currentSaveData = null;
        this.storageKey = 'ai-tavern-save';
    }

    /**
     * 初始化存档系统
     */
    async initialize() {
        try {
            console.log('💾 存档系统初始化中...');

            // 加载存档元数据
            await this.loadSaveSlots();

            this.initialized = true;
            console.log('✅ 存档系统初始化成功');

            return { success: true };
        } catch (error) {
            console.error('❌ 存档系统初始化失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 加载存档槽信息
     */
    async loadSaveSlots() {
        try {
            const saved = localStorage.getItem(`${this.storageKey}-slots`);
            if (saved) {
                this.saveSlots = JSON.parse(saved);
            } else {
                // 初始化3个存档槽
                this.saveSlots = {
                    slot1: null,
                    slot2: null,
                    slot3: null
                };
            }
            return this.saveSlots;
        } catch (error) {
            console.error('加载存档槽失败:', error);
            return {
                slot1: null,
                slot2: null,
                slot3: null
            };
        }
    }

    /**
     * 保存游戏数据
     * @param {Object} gameData - 游戏数据
     * @param {string} slot - 存档槽位
     */
    async saveGame(gameData, slot = 'auto') {
        try {
            if (!gameData) {
                console.error('保存失败: 游戏数据为空');
                return { success: false, error: '游戏数据为空' };
            }

            // 生成存档数据
            const saveData = {
                timestamp: Date.now(),
                version: '1.0.0',
                slot: slot,
                data: gameData
            };

            // 保存到指定槽位
            if (slot !== 'auto' && this.saveSlots.hasOwnProperty(slot)) {
                this.saveSlots[slot] = {
                    timestamp: saveData.timestamp,
                    player: gameData.character?.name || '未知',
                    level: gameData.character?.level || 1,
                    scene: gameData.currentScene || 'tavern'
                };
            }

            // 保存完整数据
            if (slot === 'auto') {
                localStorage.setItem(`${this.storageKey}-auto`, JSON.stringify(saveData));
            } else {
                localStorage.setItem(`${this.storageKey}-${slot}`, JSON.stringify(saveData));
            }

            // 更新槽位信息
            localStorage.setItem(`${this.storageKey}-slots`, JSON.stringify(this.saveSlots));

            console.log(`✅ 存档成功 - 槽位: ${slot}`);
            return { success: true, slot: slot, data: saveData };
        } catch (error) {
            console.error('保存失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 加载游戏数据
     * @param {string} slot - 存档槽位
     */
    async loadGame(slot = 'auto') {
        try {
            let saveKey = slot === 'auto' ? `${this.storageKey}-auto` : `${this.storageKey}-${slot}`;
            let saved = localStorage.getItem(saveKey);

            if (!saved) {
                return { success: false, error: '存档不存在' };
            }

            const saveData = JSON.parse(saved);

            // 版本检查
            if (saveData.version !== '1.0.0') {
                console.warn('⚠️ 存档版本不匹配，可能需要迁移');
            }

            this.currentSaveData = saveData.data;

            console.log(`✅ 加载成功 - 槽位: ${slot}`);
            return { success: true, data: saveData.data, timestamp: saveData.timestamp };
        } catch (error) {
            console.error('加载失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 删除存档
     * @param {string} slot - 存档槽位
     */
    async deleteSave(slot) {
        try {
            if (slot === 'auto') {
                localStorage.removeItem(`${this.storageKey}-auto`);
            } else if (this.saveSlots.hasOwnProperty(slot)) {
                localStorage.removeItem(`${this.storageKey}-${slot}`);
                this.saveSlots[slot] = null;
                localStorage.setItem(`${this.storageKey}-slots`, JSON.stringify(this.saveSlots));
            }

            console.log(`✅ 存档已删除 - 槽位: ${slot}`);
            return { success: true, slot: slot };
        } catch (error) {
            console.error('删除存档失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取所有存档信息
     */
    async getSaveSlots() {
        await this.loadSaveSlots();
        return this.saveSlots;
    }

    /**
     * 获取存档详情
     * @param {string} slot - 存档槽位
     */
    async getSaveDetails(slot) {
        try {
            let saveKey = slot === 'auto' ? `${this.storageKey}-auto` : `${this.storageKey}-${slot}`;
            let saved = localStorage.getItem(saveKey);

            if (!saved) {
                return null;
            }

            const saveData = JSON.parse(saved);

            return {
                timestamp: saveData.timestamp,
                date: new Date(saveData.timestamp).toLocaleString('zh-CN'),
                player: saveData.data.character?.name || '未知',
                level: saveData.data.character?.level || 1,
                scene: saveData.data.currentScene || 'tavern',
                version: saveData.version
            };
        } catch (error) {
            console.error('获取存档详情失败:', error);
            return null;
        }
    }

    /**
     * 启动自动保存
     */
    startAutoSave(gameEngine) {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        this.autoSaveInterval = setInterval(async () => {
            if (gameEngine && gameEngine.running) {
                await this.autoSaveGame(gameEngine);
            }
        }, this.autoSaveDelay);

        console.log('✅ 自动保存已启动');
    }

    /**
     * 停止自动保存
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            console.log('⏸️ 自动保存已停止');
        }
    }

    /**
     * 自动保存游戏
     * @param {Object} gameEngine - 游戏引擎实例
     */
    async autoSaveGame(gameEngine) {
        try {
            const saveData = await this.prepareSaveData(gameEngine);
            const result = await this.saveGame(saveData, 'auto');

            if (result.success) {
                console.log('💾 自动保存完成');
                // 可以在这里触发UI通知
                if (typeof window !== 'undefined' && window.TavernUI) {
                    // TavernUI.showNotification('已自动保存', 'success');
                }
            }
        } catch (error) {
            console.error('自动保存失败:', error);
        }
    }

    /**
     * 准备保存数据
     * @param {Object} gameEngine - 游戏引擎实例
     */
    async prepareSaveData(gameEngine) {
        const saveData = {
            // 游戏状态
            currentScene: gameEngine.state?.currentScene || 'tavern',
            gameTime: gameEngine.gameTime || 0,
            paused: gameEngine.state?.paused || false,

            // 角色数据
            character: gameEngine.characterSystem?.getPlayerInfo() || null,

            // 背包
            inventory: gameEngine.state?.inventory || [],
            gold: gameEngine.state?.gold || 0,

            // 地图数据
            playerPosition: gameEngine.mapSystem?.playerPosition || { x: 0, y: 0 },
            discoveredAreas: gameEngine.mapSystem?.discoveredAreas || [],

            // 剧情数据
            completedChapters: gameEngine.storySystem?.completedChapters || [],
            storyProgress: gameEngine.storySystem?.storyProgress || {},

            // 成就数据
            achievements: [], // 从成就系统获取

            // 系统数据
            systems: {}
        };

        // 保存各系统数据
        if (gameEngine.characterSystem) {
            try {
                saveData.systems.character = await gameEngine.characterSystem.save();
            } catch (e) {
                console.warn('保存角色系统数据失败:', e);
            }
        }

        return saveData;
    }

    /**
     * 导出存档文件
     * @param {string} slot - 存档槽位
     */
    async exportSave(slot) {
        try {
            const details = await this.getSaveDetails(slot);
            if (!details) {
                return { success: false, error: '存档不存在' };
            }

            let saveKey = slot === 'auto' ? `${this.storageKey}-auto` : `${this.storageKey}-${slot}`;
            let saved = localStorage.getItem(saveKey);
            const saveData = JSON.parse(saved);

            // 创建Blob
            const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // 下载文件
            const a = document.createElement('a');
            a.href = url;
            a.download = `ai-tavern-save-${slot}-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log(`✅ 存档已导出 - 槽位: ${slot}`);
            return { success: true };
        } catch (error) {
            console.error('导出存档失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 导入存档文件
     * @param {File} file - 存档文件
     * @param {string} slot - 目标槽位
     */
    async importSave(file, slot = 'slot1') {
        try {
            const text = await file.text();
            const saveData = JSON.parse(text);

            // 验证存档格式
            if (!saveData.timestamp || !saveData.data) {
                return { success: false, error: '无效的存档文件' };
            }

            // 保存到指定槽位
            const result = await this.saveGame(saveData.data, slot);

            if (result.success) {
                console.log(`✅ 存档已导入 - 槽位: ${slot}`);
            }

            return result;
        } catch (error) {
            console.error('导入存档失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 清空所有存档
     */
    async clearAllSaves() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.storageKey)) {
                    localStorage.removeItem(key);
                }
            });

            this.saveSlots = {
                slot1: null,
                slot2: null,
                slot3: null
            };

            console.log('✅ 所有存档已清空');
            return { success: true };
        } catch (error) {
            console.error('清空存档失败:', error);
            return { success: false, error: error.message };
        }
    }
}

// 创建全局实例
const saveSystem = new SaveSystem();

// 导出（用于模块化系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = saveSystem;
} else {
    window.SaveSystem = saveSystem;
    window.saveSystem = saveSystem;
}

console.log('✅ 存档系统加载完成');
