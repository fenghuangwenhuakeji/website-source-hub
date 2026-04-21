import { apiClient } from '../core/api_client.js';
import { eventBus } from '../core/event_bus.js';

export const narrativeEngine = {
    history: [],
    currentScript: null,

    init(script) {
        this.currentScript = script;
        this.history = [];
    },

    async start() {
        if (!this.currentScript) throw new Error('No script loaded');
        const response = await apiClient.call(this.currentScript.prompt);
        this.addToHistory('assistant', response);
        return response;
    },

    async processAction(action) {
        this.addToHistory('user', action);
        
        // 构建上下文：System Prompt + History
        // 优化：仅保留最近的 N 轮对话以节省 Token，或者实现总结机制
        const context = this.history.slice(-10).map(h => `${h.role}: ${h.content}`).join('\n\n');
        const prompt = `${this.currentScript.prompt}\n\n${context}\n\n${action}`;

        const response = await apiClient.call(prompt);
        this.addToHistory('assistant', response);
        return response;
    },

    addToHistory(role, content) {
        this.history.push({ role, content });
        eventBus.emit('story-updated', { role, content });
    },

    getHistory() {
        return this.history;
    },

    loadHistory(history) {
        this.history = history;
    }
};