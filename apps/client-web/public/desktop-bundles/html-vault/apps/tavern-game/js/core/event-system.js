// ========== 事件系统 ==========
// 负责全局事件管理和消息传递

class EventSystem {
    constructor() {
        this.listeners = new Map();
        this.onceListeners = new Map();
        this.history = [];
        this.maxHistorySize = 100;
        this.eventCounter = 0;
    }

    // 订阅事件
    on(event, callback, priority = 0, context = null) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        
        const listener = {
            id: ++this.eventCounter,
            callback: callback,
            priority: priority,
            context: context,
            active: true
        };
        
        this.listeners.get(event).push(listener);
        
        // 按优先级排序
        this.listeners.get(event).sort((a, b) => b.priority - a.priority);
        
        // 返回取消订阅函数
        return () => this.off(event, listener.id);
    }

    // 一次性订阅
    once(event, callback, priority = 0, context = null) {
        const wrappedCallback = (...args) => {
            callback.apply(context, args);
            this.off(event, wrappedCallback);
        };
        
        return this.on(event, wrappedCallback, priority, context);
    }

    // 取消订阅
    off(event, idOrCallback) {
        if (!this.listeners.has(event)) return false;
        
        const listeners = this.listeners.get(event);
        
        if (typeof idOrCallback === 'function') {
            const index = listeners.findIndex(l => l.callback === idOrCallback);
            if (index !== -1) {
                listeners.splice(index, 1);
                return true;
            }
        } else {
            const index = listeners.findIndex(l => l.id === idOrCallback);
            if (index !== -1) {
                listeners.splice(index, 1);
                return true;
            }
        }
        
        return false;
    }

    // 发布事件
    emit(event, data = null) {
        const record = {
            id: ++this.eventCounter,
            event: event,
            data: data,
            timestamp: Date.now()
        };
        
        // 记录历史
        this.history.push(record);
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
        
        // 触发监听器
        if (this.listeners.has(event)) {
            const listeners = [...this.listeners.get(event)];
            
            for (const listener of listeners) {
                if (listener.active) {
                    try {
                        const result = listener.callback.call(
                            listener.context || null,
                            data,
                            event,
                            record.id
                        );
                        
                        // 如果返回false，停止传播
                        if (result === false) {
                            break;
                        }
                    } catch (error) {
                        console.error(`Event listener error for ${event}:`, error);
                    }
                }
            }
        }
        
        return record.id;
    }

    // 异步发布事件
    async emitAsync(event, data = null) {
        const listeners = this.listeners.get(event) || [];
        const results = [];
        
        for (const listener of listeners) {
            if (listener.active) {
                try {
                    const result = await listener.callback.call(
                        listener.context || null,
                        data,
                        event
                    );
                    results.push(result);
                } catch (error) {
                    console.error(`Async event listener error for ${event}:`, error);
                    results.push(null);
                }
            }
        }
        
        return results;
    }

    // 延迟发布事件
    emitDelayed(event, data = null, delay = 0) {
        return setTimeout(() => {
            this.emit(event, data);
        }, delay);
    }

    // 获取事件历史
    getHistory(event = null, limit = 10) {
        let history = this.history;
        
        if (event) {
            history = history.filter(record => record.event === event);
        }
        
        return history.slice(-limit);
    }

    // 清除事件历史
    clearHistory() {
        this.history = [];
    }

    // 清除指定事件的所有监听器
    clear(event = null) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }

    // 获取事件监听器数量
    getListenerCount(event = null) {
        if (event) {
            return this.listeners.has(event) ? this.listeners.get(event).length : 0;
        }
        
        let total = 0;
        for (const listeners of this.listeners.values()) {
            total += listeners.length;
        }
        return total;
    }

    // 获取所有事件名称
    getEventNames() {
        return Array.from(this.listeners.keys());
    }

    // 暂停监听器
    pause(event, id) {
        if (this.listeners.has(event)) {
            const listeners = this.listeners.get(event);
            const listener = listeners.find(l => l.id === id);
            if (listener) {
                listener.active = false;
            }
        }
    }

    // 恢复监听器
    resume(event, id) {
        if (this.listeners.has(event)) {
            const listeners = this.listeners.get(event);
            const listener = listeners.find(l => l.id === id);
            if (listener) {
                listener.active = true;
            }
        }
    }

    // 清理
    cleanup() {
        this.listeners.clear();
        this.history = [];
    }
}

// 创建全局事件系统实例
const eventSystem = new EventSystem();

// 游戏事件常量
const GameEvents = {
    // 游戏生命周期
    GAME_INIT: 'game:init',
    GAME_START: 'game:start',
    GAME_PAUSE: 'game:pause',
    GAME_RESUME: 'game:resume',
    GAME_OVER: 'game:over',
    
    // 角色事件
    CHARACTER_CREATED: 'character:created',
    CHARACTER_LEVEL_UP: 'character:levelUp',
    CHARACTER_DIED: 'character:died',
    CHARACTER_REVIVED: 'character:revived',
    
    // 战斗事件
    BATTLE_START: 'battle:start',
    BATTLE_END: 'battle:end',
    BATTLE_TURN_START: 'battle:turn:start',
    BATTLE_TURN_END: 'battle:turn:end',
    BATTLE_DAMAGE: 'battle:damage',
    BATTLE_HEAL: 'battle:heal',
    BATTLE_SKILL_USED: 'battle:skill:used',
    
    // 物品事件
    ITEM_ACQUIRED: 'item:acquired',
    ITEM_USED: 'item:used',
    ITEM_EQUIPPED: 'item:equipped',
    ITEM_UNEQUIPPED: 'item:unequipped',
    ITEM_CRAFTED: 'item:crafted',
    ITEM_SOLD: 'item:sold',
    ITEM_BOUGHT: 'item:bought',
    
    // 任务事件
    QUEST_ACCEPTED: 'quest:accepted',
    QUEST_COMPLETED: 'quest:completed',
    QUEST_FAILED: 'quest:failed',
    QUEST_PROGRESS: 'quest:progress',
    
    // 地图事件
    MAP_CHANGED: 'map:changed',
    LOCATION_DISCOVERED: 'location:discovered',
    LOCATION_ENTERED: 'location:entered',
    LOCATION_LEFT: 'location:left',
    
    // UI事件
    VIEW_CHANGED: 'view:changed',
    MENU_OPENED: 'menu:opened',
    MENU_CLOSED: 'menu:closed',
    NOTIFICATION: 'notification',
    
    // 存档事件
    SAVE_GAME: 'save:game',
    LOAD_GAME: 'load:game',
    AUTO_SAVE: 'save:auto',
    
    // 系统事件
    SETTINGS_CHANGED: 'settings:changed',
    ERROR_OCCURRED: 'error:occurred',
    WARNING_OCCURRED: 'warning:occurred'
};
