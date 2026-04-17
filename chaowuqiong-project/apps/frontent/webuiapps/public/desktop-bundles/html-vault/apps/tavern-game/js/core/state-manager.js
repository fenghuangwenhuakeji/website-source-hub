// ========== 状态管理器 ==========
// 负责全局状态管理和状态变更通知

class StateManager {
    constructor() {
        this.state = {
            // 玩家数据
            player: null,
            
            // 游戏状态
            currentView: 'main-menu',
            isPaused: false,
            
            // 战斗状态
            inBattle: false,
            
            // 地图状态
            currentMap: null,
            playerPosition: { x: 0, y: 0 },
            
            // 时间系统
            gameTime: {
                day: 1,
                hour: 8,
                minute: 0
            },
            
            // 游戏统计
            statistics: {
                playTime: 0,
                battlesWon: 0,
                battlesLost: 0,
                monstersKilled: 0,
                goldEarned: 0,
                goldSpent: 0,
                itemsCollected: 0,
                questsCompleted: 0
            },
            
            // 系统配置
            settings: {
                sfxVolume: 0.7,
                musicVolume: 0.5,
                autoSave: true,
                difficulty: 'normal',
                language: 'zh-CN'
            },
            
            // 已解锁内容
            unlocked: {
                locations: ['tavern', 'village'],
                features: ['map', 'tavern', 'battle', 'card']
            }
        };
        
        this.listeners = new Map();
        this.history = [];
        this.maxHistorySize = 50;
    }

    // 获取状态
    get(path) {
        if (!path) return this.state;
        
        const keys = path.split('.');
        let value = this.state;
        
        for (const key of keys) {
            if (value && typeof value === 'object') {
                value = value[key];
            } else {
                return undefined;
            }
        }
        
        return value;
    }

    // 设置状态
    set(path, value, notify = true) {
        const oldValue = this.get(path);
        
        // 记录历史
        this.recordHistory(path, oldValue, value);
        
        // 更新状态
        const keys = path.split('.');
        let obj = this.state;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) {
                obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
        }
        
        obj[keys[keys.length - 1]] = value;
        
        // 通知监听器
        if (notify) {
            this.notify(path, value, oldValue);
        }
        
        return true;
    }

    // 更新嵌套状态（支持部分更新）
    update(path, updates, notify = true) {
        const currentValue = this.get(path) || {};
        const newValue = { ...currentValue, ...updates };
        return this.set(path, newValue, notify);
    }

    // 订阅状态变更
    subscribe(path, callback) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, new Set());
        }
        this.listeners.get(path).add(callback);
        
        // 返回取消订阅函数
        return () => this.unsubscribe(path, callback);
    }

    // 取消订阅
    unsubscribe(path, callback) {
        if (this.listeners.has(path)) {
            this.listeners.get(path).delete(callback);
        }
    }

    // 通知状态变更
    notify(path, newValue, oldValue) {
        if (this.listeners.has(path)) {
            this.listeners.get(path).forEach(callback => {
                try {
                    callback(newValue, oldValue, path);
                } catch (error) {
                    console.error(`State callback error for path ${path}:`, error);
                }
            });
        }
        
        // 通配符通知
        for (const [listenerPath, callbacks] of this.listeners) {
            if (listenerPath !== path && listenerPath.endsWith('*')) {
                const basePath = listenerPath.slice(0, -1);
                if (path.startsWith(basePath)) {
                    callbacks.forEach(callback => {
                        try {
                            callback(newValue, oldValue, path);
                        } catch (error) {
                            console.error(`State callback error for path ${listenerPath}:`, error);
                        }
                    });
                }
            }
        }
    }

    // 记录历史
    recordHistory(path, oldValue, newValue) {
        this.history.push({
            timestamp: Date.now(),
            path: path,
            oldValue: JSON.parse(JSON.stringify(oldValue)),
            newValue: JSON.parse(JSON.stringify(newValue))
        });
        
        // 限制历史大小
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    // 获取历史记录
    getHistory(path = null, limit = 10) {
        let history = this.history;
        
        if (path) {
            history = history.filter(record => record.path.startsWith(path));
        }
        
        return history.slice(-limit);
    }

    // 撤销（简单实现，只支持单层路径）
    undo() {
        if (this.history.length === 0) return false;
        
        const lastRecord = this.history.pop();
        if (lastRecord) {
            this.set(lastRecord.path, lastRecord.oldValue, false);
            return true;
        }
        return false;
    }

    // 保存快照
    saveSnapshot() {
        return JSON.stringify(this.state);
    }

    // 恢复快照
    restoreSnapshot(snapshot) {
        try {
            this.state = JSON.parse(snapshot);
            this.notify('*', this.state, null);
            return true;
        } catch (error) {
            console.error('Failed to restore snapshot:', error);
            return false;
        }
    }

    // 导出状态
    export() {
        return {
            state: this.state,
            version: game ? game.version : '1.0.0',
            timestamp: Date.now()
        };
    }

    // 导入状态
    import(data) {
        if (!data || !data.state) {
            console.error('Invalid state data');
            return false;
        }
        
        try {
            this.state = data.state;
            this.notify('*', this.state, null);
            return true;
        } catch (error) {
            console.error('Failed to import state:', error);
            return false;
        }
    }

    // 重置状态
    reset() {
        const initialState = new StateManager().state;
        this.state = initialState;
        this.history = [];
        this.notify('*', this.state, null);
    }

    // 清理
    cleanup() {
        this.listeners.clear();
        this.history = [];
    }
}

// 创建全局状态管理器实例
const stateManager = new StateManager();
