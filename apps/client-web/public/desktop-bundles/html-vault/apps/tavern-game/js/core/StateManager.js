/**
 * StateManager - 状态管理器
 * 管理游戏的全局状态，提供状态查询、更新、订阅等功能
 */

export class StateManager {
    constructor(engine) {
        this.engine = engine;
        this.state = {};
        this.listeners = new Map();
        this.history = [];
        this.maxHistorySize = 100;
    }

    /**
     * 获取状态
     */
    get(path) {
        if (!path) {
            return this.state;
        }

        const keys = path.split('.');
        let value = this.state;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }

        return value;
    }

    /**
     * 设置状态
     */
    set(path, value) {
        if (!path) {
            this.state = value;
            this.notifyAll();
            return;
        }

        const keys = path.split('.');
        const lastKey = keys.pop();
        let obj = this.state;

        // 创建嵌套对象
        for (const key of keys) {
            if (!obj[key] || typeof obj[key] !== 'object') {
                obj[key] = {};
            }
            obj = obj[key];
        }

        const oldValue = obj[lastKey];
        obj[lastKey] = value;

        // 记录历史
        this.recordHistory(path, oldValue, value);

        // 通知监听器
        this.notify(path, value, oldValue);
    }

    /**
     * 更新状态（合并）
     */
    update(path, updates) {
        const current = this.get(path) || {};
        const updated = { ...current, ...updates };
        this.set(path, updated);
    }

    /**
     * 删除状态
     */
    delete(path) {
        if (!path) {
            this.state = {};
            this.notifyAll();
            return;
        }

        const keys = path.split('.');
        const lastKey = keys.pop();
        let obj = this.state;

        for (const key of keys) {
            if (!obj[key] || typeof obj[key] !== 'object') {
                return;
            }
            obj = obj[key];
        }

        if (obj && typeof obj === 'object' && lastKey in obj) {
            const oldValue = obj[lastKey];
            delete obj[lastKey];
            this.notify(path, undefined, oldValue);
        }
    }

    /**
     * 订阅状态变更
     */
    subscribe(path, callback) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, new Set());
        }

        this.listeners.get(path).add(callback);

        // 返回取消订阅函数
        return () => {
            this.unsubscribe(path, callback);
        };
    }

    /**
     * 取消订阅
     */
    unsubscribe(path, callback) {
        if (this.listeners.has(path)) {
            this.listeners.get(path).delete(callback);

            if (this.listeners.get(path).size === 0) {
                this.listeners.delete(path);
            }
        }
    }

    /**
     * 通知所有监听器
     */
    notifyAll() {
        this.listeners.forEach((callbacks, path) => {
            const value = this.get(path);
            callbacks.forEach(callback => {
                try {
                    callback(value);
                } catch (error) {
                    console.error(`状态监听器错误 [${path}]:`, error);
                }
            });
        });
    }

    /**
     * 通知特定路径的监听器
     */
    notify(path, newValue, oldValue) {
        // 通知精确匹配的监听器
        if (this.listeners.has(path)) {
            const callbacks = this.listeners.get(path);
            callbacks.forEach(callback => {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    console.error(`状态监听器错误 [${path}]:`, error);
                }
            });
        }

        // 通知父路径的监听器
        const keys = path.split('.');
        for (let i = keys.length - 1; i >= 1; i--) {
            const parentPath = keys.slice(0, i).join('.');
            if (this.listeners.has(parentPath)) {
                const callbacks = this.listeners.get(parentPath);
                callbacks.forEach(callback => {
                    try {
                        callback(this.get(parentPath));
                    } catch (error) {
                        console.error(`状态监听器错误 [${parentPath}]:`, error);
                    }
                });
            }
        }
    }

    /**
     * 记录历史
     */
    recordHistory(path, oldValue, newValue) {
        this.history.push({
            path,
            oldValue,
            newValue,
            timestamp: Date.now()
        });

        // 限制历史记录大小
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    /**
     * 获取历史记录
     */
    getHistory(path) {
        if (!path) {
            return this.history;
        }

        return this.history.filter(record => record.path === path);
    }

    /**
     * 清空历史
     */
    clearHistory() {
        this.history = [];
    }

    /**
     * 保存快照
     */
    saveSnapshot() {
        return {
            state: JSON.parse(JSON.stringify(this.state)),
            timestamp: Date.now()
        };
    }

    /**
     * 恢复快照
     */
    restoreSnapshot(snapshot) {
        if (!snapshot || !snapshot.state) {
            return false;
        }

        this.state = JSON.parse(JSON.stringify(snapshot.state));
        this.notifyAll();
        return true;
    }

    /**
     * 导出状态
     */
    export() {
        return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * 导入状态
     */
    import(stateData) {
        if (!stateData || typeof stateData !== 'object') {
            return false;
        }

        this.state = JSON.parse(JSON.stringify(stateData));
        this.notifyAll();
        return true;
    }

    /**
     * 清空状态
     */
    clear() {
        this.state = {};
        this.history = [];
        this.notifyAll();
    }

    /**
     * 获取状态大小（估算）
     */
    getSize() {
        return JSON.stringify(this.state).length;
    }
}

export default StateManager;
