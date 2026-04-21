// ========== 保存系统 ==========

class SaveSystem {
    constructor() {
        this.saveSlot = 1;
        this.autoSaveInterval = null;
        this.isInitialized = false;
    }

    // 初始化保存系统
    init() {
        this.isInitialized = true;
        this.startAutoSave();
    }

    // 保存游戏
    saveGame(slot = this.saveSlot) {
        if (!game.player) {
            game.showNotification('没有可保存的数据', 'error');
            return false;
        }

        const saveData = {
            version: '1.0.0',
            timestamp: Date.now(),
            playTime: game.playTime || 0,
            player: this.serializePlayer(game.player),
            gameState: {
                currentLocation: mapSystem.currentLocation,
                currentView: game.currentView,
                unlockedLocations: game.player.unlockedLocations,
                storyProgress: storySystem.storyHistory
            },
            settings: this.getSettings()
        };

        try {
            localStorage.setItem(`rpg_tavern_save_${slot}`, JSON.stringify(saveData));
            game.showNotification(`游戏已保存到存档 ${slot}`, 'success');
            audioSystem.playSound('notification');
            return true;
        } catch (error) {
            console.error('保存失败:', error);
            game.showNotification('保存失败！', 'error');
            return false;
        }
    }

    // 读取游戏
    loadGame(slot = this.saveSlot) {
        try {
            const saveDataStr = localStorage.getItem(`rpg_tavern_save_${slot}`);
            if (!saveDataStr) {
                game.showNotification('没有找到存档', 'error');
                return false;
            }

            const saveData = JSON.parse(saveDataStr);

            // 恢复玩家数据
            game.player = this.deserializePlayer(saveData.player);

            // 恢复游戏状态
            mapSystem.currentLocation = saveData.gameState.currentLocation || 'tavern';
            game.currentView = saveData.gameState.currentView || 'map';
            game.player.unlockedLocations = saveData.gameState.unlockedLocations || ['tavern', 'village'];
            
            if (saveData.gameState.storyProgress) {
                storySystem.storyHistory = saveData.gameState.storyProgress;
            }

            // 恢复设置
            if (saveData.settings) {
                this.applySettings(saveData.settings);
            }

            // 初始化系统
            this.initializeSystems();

            // 更新UI
            game.updateUI();
            game.switchView('map');

            game.showNotification('游戏已加载', 'success');
            audioSystem.playSound('notification');
            return true;
        } catch (error) {
            console.error('读取失败:', error);
            game.showNotification('读取失败！存档可能已损坏', 'error');
            return false;
        }

    // 序列化玩家数据
    serializePlayer(player) {
        return {
            name: player.name,
            class: player.class,
            level: player.level,
            exp: player.exp,
            expToNext: player.expToNext,
            gold: player.gold,
            diamonds: player.diamonds,
            maxHp: player.maxHp,
            hp: player.hp,
            maxMp: player.maxMp,
            mp: player.mp,
            atk: player.atk,
            def: player.def,
            spd: player.spd,
            crit: player.crit,
            skills: player.skills,
            equipment: player.equipment,
            inventory: player.inventory,
            quests: player.quests,
            unlockedLocations: player.unlockedLocations,
            unlockedSkills: player.unlockedSkills,
            stats: player.stats
        };
    }

    // 反序列化玩家数据
    deserializePlayer(data) {
        return {
            ...data,
            // 确保战斗状态被重置
            defending: false,
            armor: 0,
            energy: 3,
            maxEnergy: 3
        };
    }

    // 初始化系统
    initializeSystems() {
        cardSystem.init();
        battleSystem.isInitialized = false;
    }

    // 删除存档
    deleteSave(slot = this.saveSlot) {
        if (confirm(`确定要删除存档 ${slot} 吗？此操作不可撤销！`)) {
            localStorage.removeItem(`rpg_tavern_save_${slot}`);
            game.showNotification(`存档 ${slot} 已删除`, 'success');
            audioSystem.playSound('item');
        }
    }

    // 获取存档信息
    getSaveInfo(slot = this.saveSlot) {
        try {
            const saveDataStr = localStorage.getItem(`rpg_tavern_save_${slot}`);
            if (!saveDataStr) return null;

            const saveData = JSON.parse(saveDataStr);
            const date = new Date(saveData.timestamp);

            return {
                slot: slot,
                playerName: saveData.player.name,
                playerClass: saveData.player.class,
                level: saveData.player.level,
                playTime: saveData.playTime,
                date: date.toLocaleString(),
                location: saveData.gameState.currentLocation
            };
        } catch (error) {
            console.error('读取存档信息失败:', error);
            return null;
        }
    }

    // 获取所有存档
    getAllSaves() {
        const saves = [];
        for (let i = 1; i <= 5; i++) {
            const saveInfo = this.getSaveInfo(i);
            if (saveInfo) {
                saves.push(saveInfo);
            } else {
                saves.push({
                    slot: i,
                    empty: true
                });
            }
        }
        return saves;
    }

    // 开始自动保存
    startAutoSave() {
        // 每5分钟自动保存一次
        this.autoSaveInterval = setInterval(() => {
            if (game && game.player) {
                this.saveGame('auto');
            }
        }, 5 * 60 * 1000);
    }

    // 停止自动保存
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    // 导出存档
    exportSave() {
        const saveData = localStorage.getItem(`rpg_tavern_save_${this.saveSlot}`);
        if (!saveData) {
            game.showNotification('没有存档可导出', 'error');
            return null;
        }

        // 创建下载链接
        const blob = new Blob([saveData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rpg_tavern_save_${this.saveSlot}_${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
        game.showNotification('存档已导出', 'success');
    }

    // 导入存档
    importSave(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const saveData = JSON.parse(e.target.result);
                
                // 验证存档格式
                if (!saveData.player || !saveData.gameState) {
                    throw new Error('无效的存档格式');
                }

                // 保存导入的存档
                localStorage.setItem(`rpg_tavern_save_import`, JSON.stringify(saveData));
                
                game.showNotification('存档导入成功！请选择导入的存档', 'success');
            } catch (error) {
                console.error('导入失败:', error);
                game.showNotification('导入失败！文件格式不正确', 'error');
            }
        };
        reader.readAsText(file);
    }

    // 获取设置
    getSettings() {
        return {
            sfxVolume: audioSystem.sfxVolume,
            musicVolume: audioSystem.musicVolume,
            graphics: document.getElementById('graphics-quality')?.value || 'medium',
            fullscreen: document.getElementById('fullscreen-mode')?.checked || false
        };
    }

    // 应用设置
    applySettings(settings) {
        if (settings.sfxVolume !== undefined) {
            audioSystem.setSfxVolume(settings.sfxVolume);
            document.getElementById('sfx-volume').value = settings.sfxVolume;
        }
        if (settings.musicVolume !== undefined) {
            audioSystem.setMusicVolume(settings.musicVolume);
            document.getElementById('music-volume').value = settings.musicVolume;
        }
        if (settings.graphics) {
            document.getElementById('graphics-quality').value = settings.graphics;
        }
        if (settings.fullscreen !== undefined) {
            document.getElementById('fullscreen-mode').checked = settings.fullscreen;
        }
    }

    // 清除所有数据
    clearAllData() {
        if (confirm('确定要清除所有游戏数据吗？此操作不可撤销！')) {
            // 清除所有存档
            for (let i = 1; i <= 5; i++) {
                localStorage.removeItem(`rpg_tavern_save_${i}`);
            }
            localStorage.removeItem('rpg_tavern_save_auto');
            localStorage.removeItem('rpg_tavern_save_import');

            game.showNotification('所有数据已清除', 'success');
            audioSystem.playSound('item');
        }
    }
}

// 创建全局保存系统实例
const saveSystem = new SaveSystem();
