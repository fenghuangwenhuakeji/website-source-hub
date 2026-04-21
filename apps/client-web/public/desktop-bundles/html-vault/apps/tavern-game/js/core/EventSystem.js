/**
 * EventSystem - 事件系统
 * 提供发布/订阅模式，用于系统间通信
 */

export class EventSystem {
    constructor(engine) {
        this.engine = engine;
        this.listeners = new Map();
        this.onceListeners = new Map();
        this.history = [];
        this.maxHistorySize = 1000;
        this.enabled = true;
    }

    /**
     * 订阅事件
     * @param {string} event - 事件名称
     * @param {function} callback - 回调函数
     * @param {number} priority - 优先级（数字越大优先级越高）
     * @returns {function} 取消订阅的函数
     */
    on(event, callback, priority = 0) {
        if (typeof callback !== 'function') {
            throw new Error('回调必须是函数');
        }

        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }

        const listener = {
            callback,
            priority,
            id: this.generateId()
        };

        const listeners = this.listeners.get(event);
        listeners.push(listener);

        // 按优先级排序
        listeners.sort((a, b) => b.priority - a.priority);

        // 返回取消订阅函数
        return () => {
            this.off(event, callback);
        };
    }

    /**
     * 一次性订阅
     * @param {string} event - 事件名称
     * @param {function} callback - 回调函数
     * @param {number} priority - 优先级
     */
    once(event, callback, priority = 0) {
        if (typeof callback !== 'function') {
            throw new Error('回调必须是函数');
        }

        if (!this.onceListeners.has(event)) {
            this.onceListeners.set(event, []);
        }

        const listener = {
            callback,
            priority,
            id: this.generateId()
        };

        const listeners = this.onceListeners.get(event);
        listeners.push(listener);

        // 按优先级排序
        listeners.sort((a, b) => b.priority - a.priority);
    }

    /**
     * 发布事件
     * @param {string} event - 事件名称
     * @param {*} data - 事件数据
     * @returns {Promise<void>}
     */
    async emit(event, data) {
        if (!this.enabled) {
            return;
        }

        // 记录事件历史
        this.recordHistory(event, data);

        // 执行一次性监听器
        await this.executeOnceListeners(event, data);

        // 执行普通监听器
        await this.executeListeners(event, data);
    }

    /**
     * 执行普通监听器
     */
    async executeListeners(event, data) {
        if (!this.listeners.has(event)) {
            return;
        }

        const listeners = this.listeners.get(event);
        const errors = [];

        for (const listener of listeners) {
            try {
                const result = listener.callback(data);
                if (result instanceof Promise) {
                    await result;
                }
            } catch (error) {
                console.error(`事件监听器错误 [${event}]:`, error);
                errors.push({
                    listener: listener.id,
                    error: error.message
                });
            }
        }

        if (errors.length > 0) {
            this.emit('error', {
                event,
                errors
            });
        }
    }

    /**
     * 执行一次性监听器
     */
    async executeOnceListeners(event, data) {
        if (!this.onceListeners.has(event)) {
            return;
        }

        const listeners = this.onceListeners.get(event);
        this.onceListeners.delete(event);

        const errors = [];

        for (const listener of listeners) {
            try {
                const result = listener.callback(data);
                if (result instanceof Promise) {
                    await result;
                }
            } catch (error) {
                console.error(`一次性事件监听器错误 [${event}]:`, error);
                errors.push({
                    listener: listener.id,
                    error: error.message
                });
            }
        }

        if (errors.length > 0) {
            this.emit('error', {
                event,
                errors
            });
        }
    }

    /**
     * 取消订阅
     * @param {string} event - 事件名称
     * @param {function} callback - 回调函数
     */
    off(event, callback) {
        if (!this.listeners.has(event)) {
            return;
        }

        const listeners = this.listeners.get(event);
        const index = listeners.findIndex(l => l.callback === callback);

        if (index !== -1) {
            listeners.splice(index, 1);
        }

        if (listeners.length === 0) {
            this.listeners.delete(event);
        }
    }

    /**
     * 移除所有事件的所有监听器
     */
    offAll() {
        this.listeners.clear();
        this.onceListeners.clear();
    }

    /**
     * 移除指定事件的所有监听器
     * @param {string} event - 事件名称
     */
    offAllByEvent(event) {
        this.listeners.delete(event);
        this.onceListeners.delete(event);
    }

    /**
     * 获取事件的监听器数量
     * @param {string} event - 事件名称
     * @returns {number}
     */
    listenerCount(event) {
        const normalCount = this.listeners.has(event) ? this.listeners.get(event).length : 0;
        const onceCount = this.onceListeners.has(event) ? this.onceListeners.get(event).length : 0;
        return normalCount + onceCount;
    }

    /**
     * 获取所有事件名称
     * @returns {string[]}
     */
    eventNames() {
        const events = new Set([
            ...this.listeners.keys(),
            ...this.onceListeners.keys()
        ]);
        return Array.from(events);
    }

    /**
     * 启用事件系统
     */
    enable() {
        this.enabled = true;
    }

    /**
     * 禁用事件系统
     */
    disable() {
        this.enabled = false;
    }

    /**
     * 记录事件历史
     */
    recordHistory(event, data) {
        this.history.push({
            event,
            data,
            timestamp: Date.now()
        });

        // 限制历史记录大小
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    /**
     * 获取事件历史
     * @param {string} event - 事件名称（可选）
     * @param {number} limit - 返回数量限制
     * @returns {Array}
     */
    getHistory(event, limit) {
        let history = this.history;

        if (event) {
            history = history.filter(record => record.event === event);
        }

        if (limit) {
            history = history.slice(-limit);
        }

        return history;
    }

    /**
     * 清空事件历史
     */
    clearHistory() {
        this.history = [];
    }

    /**
     * 等待事件
     * @param {string} event - 事件名称
     * @param {number} timeout - 超时时间（毫秒）
     * @returns {Promise<*>}
     */
    waitFor(event, timeout = 5000) {
        return new Promise((resolve, reject) => {
            let timer = null;

            const handler = (data) => {
                if (timer) {
                    clearTimeout(timer);
                }
                resolve(data);
            };

            this.once(event, handler);

            if (timeout > 0) {
                timer = setTimeout(() => {
                    this.off(event, handler);
                    reject(new Error(`等待事件超时: ${event}`));
                }, timeout);
            }
        });
    }

    /**
     * 批量订阅
     * @param {Object} events - 事件映射 {eventName: callback}
     * @returns {function} 取消所有订阅的函数
     */
    onMany(events) {
        const unsubscribers = [];

        for (const [event, callback] of Object.entries(events)) {
            unsubscribers.push(this.on(event, callback));
        }

        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        };
    }

    /**
     * 创建事件命名空间
     * @param {string} namespace - 命名空间前缀
     * @returns {Object} 命名空间对象
     */
    createNamespace(namespace) {
        const self = this;

        return {
            on(event, callback, priority) {
                return self.on(`${namespace}:${event}`, callback, priority);
            },
            once(event, callback, priority) {
                return self.once(`${namespace}:${event}`, callback, priority);
            },
            emit(event, data) {
                return self.emit(`${namespace}:${event}`, data);
            },
            off(event, callback) {
                return self.off(`${namespace}:${event}`, callback);
            },
            waitFor(event, timeout) {
                return self.waitFor(`${namespace}:${event}`, timeout);
            }
        };
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            totalEvents: this.eventNames().length,
            totalListeners: Array.from(this.listeners.values())
                .reduce((sum, listeners) => sum + listeners.length, 0),
            totalOnceListeners: Array.from(this.onceListeners.values())
                .reduce((sum, listeners) => sum + listeners.length, 0),
            historySize: this.history.length,
            enabled: this.enabled
        };
    }
}

export default EventSystem;
