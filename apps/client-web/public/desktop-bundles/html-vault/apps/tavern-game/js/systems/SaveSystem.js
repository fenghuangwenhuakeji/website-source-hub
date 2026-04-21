/**
 * 保存系统
 * 管理游戏存档和读取
 */

export class SaveSystem {
    constructor(engine) {
        this.engine = engine;
        this.isInitialized = false;
        this.saveKey = 'unified_tavern_rpg_save';
        this.autoSaveInterval = null;
    }

    async init() {
        if (this.isInitialized) return;

        console.log('[SaveSystem] 初始化保存系统...');

        // 启动自动保存
        this.startAutoSave();

        this.isInitialized = true;
        console.log('[SaveSystem] 保存系统初始化完成');
    }

    // 保存游戏
    saveGame(slot = 'default') {
        if (!window.game || !game.player) {
            console.warn('[SaveSystem] 无法保存：没有游戏进行中');
            return false;
        }

        try {
            const saveData = {
                version: '2.0.0',
                timestamp: new Date().toISOString(),
                player: game.player,
                gameState: {
                    currentView: game.currentView,
                    playTime: game.playTime,
                    state: game.state
                },
                mapState: window.mapSystem ? {
                    currentLocation: mapSystem.currentLocation,
                    playerPosition: mapSystem.playerPosition
                } : null,
                cardState: window.cardSystem ? {
                    deck: cardSystem.deck,
                    hand: cardSystem.hand
                } : null,
                questState: window.questSystem ? {
                    activeQuests: questSystem.activeQuests,
                    completedQuests: questSystem.completedQuests
                } : null,
                upgradeState: window.upgradeSystem ? {
                    skillPoints: upgradeSystem.skillPoints
                } : null
            };

            const saveKey = slot === 'auto' ? this.saveKey + '_auto' : this.saveKey;
            localStorage.setItem(saveKey, JSON.stringify(saveData));

            console.log(`[SaveSystem] 游戏已保存到 ${saveKey}`);
            return true;
        } catch (error) {
            console.error('[SaveSystem] 保存失败:', error);
            return false;
        }
    }

    // 读取游戏
    loadGame(slot = 'default') {
        try {
            const saveKey = slot === 'auto' ? this.saveKey + '_auto' : this.saveKey;
            const saveData = JSON.parse(localStorage.getItem(saveKey));

            if (!saveData) {
                console.warn('[SaveSystem] 没有找到存档');
                if (window.game) {
                    game.showNotification('没有找到存档', 'warning');
                }
                return false;
            }

            // 验证存档版本
            if (saveData.version !== '2.0.0') {
                console.warn('[SaveSystem] 存档版本不匹配');
                if (window.game) {
                    game.showNotification('存档版本不兼容', 'error');
                }
                return false;
            }

            // 恢复玩家数据
            if (window.game) {
                game.player = saveData.player;
                game.playTime = saveData.gameState.playTime;
                game.currentView = saveData.gameState.currentView;
                game.state = saveData.gameState.state;

                // 恢复地图状态
                if (saveData.mapState && window.mapSystem) {
                    mapSystem.currentLocation = saveData.mapState.currentLocation;
                    mapSystem.playerPosition = saveData.mapState.playerPosition;
                }

                // 恢复卡牌状态
                if (saveData.cardState && window.cardSystem) {
                    cardSystem.deck = saveData.cardState.deck;
                    cardSystem.hand = saveData.cardState.hand;
                }

                // 恢复任务状态
                if (saveData.questState && window.questSystem) {
                    questSystem.activeQuests = saveData.questState.activeQuests;
                    questSystem.completedQuests = saveData.questState.completedQuests;
                    questSystem.updateQuestUI();
                }

                // 恢复升级状态
                if (saveData.upgradeState && window.upgradeSystem) {
                    upgradeSystem.skillPoints = saveData.upgradeState.skillPoints;
                }

                // 更新UI
                game.updateUI();

                // 隐藏主菜单，显示游戏界面
                const mainMenu = document.getElementById('main-menu');
                const gameInterface = document.getElementById('game-interface');

                if (mainMenu) mainMenu.style.display = 'none';
                if (gameInterface) gameInterface.style.display = 'flex';

                // 切换到之前的视图
                game.switchView(game.currentView);

                console.log(`[SaveSystem] 游戏已从 ${saveKey} 读取`);
                game.showNotification('游戏已读取！', 'success');
            }

            return true;
        } catch (error) {
            console.error('[SaveSystem] 读取失败:', error);
            if (window.game) {
                game.showNotification('读取存档失败', 'error');
            }
            return false;
        }
    }

    // 删除存档
    deleteSave(slot = 'default') {
        try {
            const saveKey = slot === 'auto' ? this.saveKey + '_auto' : this.saveKey;
            localStorage.removeItem(saveKey);

            console.log(`[SaveSystem] 存档 ${saveKey} 已删除`);
            return true;
        } catch (error) {
            console.error('[SaveSystem] 删除存档失败:', error);
            return false;
        }
    }

    // 获取存档列表
    getSaveList() {
        const saves = [];

        // 主存档
        const mainSave = localStorage.getItem(this.saveKey);
        if (mainSave) {
            const data = JSON.parse(mainSave);
            saves.push({
                slot: 'default',
                player: data.player.name,
                level: data.player.level,
                timestamp: data.timestamp,
                playTime: data.gameState.playTime
            });
        }

        // 自动存档
        const autoSave = localStorage.getItem(this.saveKey + '_auto');
        if (autoSave) {
            const data = JSON.parse(autoSave);
            saves.push({
                slot: 'auto',
                player: data.player.name,
                level: data.player.level,
                timestamp: data.timestamp,
                playTime: data.gameState.playTime
            });
        }

        return saves;
    }

    // 导出存档
    exportSave() {
        const saveData = localStorage.getItem(this.saveKey);
        if (!saveData) {
            console.warn('[SaveSystem] 没有存档可导出');
            return null;
        }

        // 创建下载链接
        const blob = new Blob([saveData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tavern_rpg_save_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('[SaveSystem] 存档已导出');
        return true;
    }

    // 导入存档
    importSave(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const saveData = JSON.parse(e.target.result);

                    // 验证存档
                    if (!saveData.version || !saveData.player) {
                        throw new Error('无效的存档文件');
                    }

                    // 保存到localStorage
                    localStorage.setItem(this.saveKey, JSON.stringify(saveData));

                    console.log('[SaveSystem] 存档已导入');
                    if (window.game) {
                        game.showNotification('存档已导入', 'success');
                    }

                    resolve(true);
                } catch (error) {
                    console.error('[SaveSystem] 导入存档失败:', error);
                    if (window.game) {
                        game.showNotification('导入存档失败', 'error');
                    }
                    reject(error);
                }
            };

            reader.onerror = () => {
                console.error('[SaveSystem] 读取文件失败');
                if (window.game) {
                    game.showNotification('读取文件失败', 'error');
                }
                reject(new Error('读取文件失败'));
            };

            reader.readAsText(file);
        });
    }

    // 启动自动保存
    startAutoSave() {
        // 每5分钟自动保存一次
        this.autoSaveInterval = setInterval(() => {
            if (window.game && game.player) {
                this.saveGame('auto');
                console.log('[SaveSystem] 自动保存完成');
            }
        }, 5 * 60 * 1000); // 5分钟
    }

    // 停止自动保存
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }
}
