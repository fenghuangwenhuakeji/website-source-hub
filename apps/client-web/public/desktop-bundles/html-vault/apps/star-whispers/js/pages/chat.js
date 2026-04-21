/**
 * 聊天页面脚本 - Chat Page Script
 */

import { UserContext } from '../core/UserContext.js';
import { SecurityLayer } from '../core/SecurityLayer.js';
import { NPTIAnalyzer } from '../modules/NPTIAnalyzer.js';
import { HoroscopeEmotion } from '../modules/HoroscopeEmotion.js';

class ChatPage {
    constructor() {
        this.user = new UserContext();
        this.security = new SecurityLayer(this.user);
        this.npti = new NPTIAnalyzer();
        this.horoscope = new HoroscopeEmotion();
        
        this.initUI();
        this.bindEvents();
    }

    initUI() {
        this.chatWindow = document.querySelector('.chat-window');
        this.inputField = document.querySelector('#user-input');
        this.sendBtn = document.querySelector('#send-btn');
        this.themeSelect = document.querySelector('#age-selector');
        
        // 初始化默认主题
        this.updateTheme('adult');
        this.appendMessage('AI', '你好！我是星语心伴，你的专属心理伙伴。有什么想聊的吗？', 'ai');
    }

    bindEvents() {
        // 年龄切换
        this.themeSelect?.addEventListener('change', (e) => {
            const age = parseInt(e.target.value);
            this.user.setAge(age);
        });

        // 监听用户状态变化
        this.user.subscribe?.('ageChanged', (group) => {
            this.updateTheme(group);
            this.appendMessage('System', `已切换至 ${group.toUpperCase()} 模式`, 'system');
            
            const forecast = this.horoscope.getInterpretation?.(this.user.getProfile()?.horoscope, group);
            const horoscopeText = document.querySelector('#horoscope-text');
            if (horoscopeText && forecast) {
                horoscopeText.textContent = forecast;
            }
        });

        // 发送消息
        this.sendBtn?.addEventListener('click', () => this.handleSend());
        this.inputField?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSend();
        });
    }

    updateTheme(group) {
        document.documentElement.setAttribute('data-theme', group);
    }

    handleSend() {
        const text = this.inputField.value.trim();
        if (!text) return;

        // 安全检查
        if (this.security.checkInput && !this.security.checkInput(text)) {
            this.appendMessage('System', this.security.getWarningMessage?.() || '输入内容不合规', 'system');
            this.inputField.value = '';
            return;
        }

        // 显示用户消息
        this.appendMessage('User', text, 'user');
        this.inputField.value = '';

        // 模拟 AI 响应
        this.showTyping();
        setTimeout(() => {
            this.generateResponse(text);
        }, 1000);
    }

    generateResponse(input) {
        const profile = this.user.getProfile?.() || { ageGroup: 'adult' };
        let response = "";

        if (input.includes("难过") || input.includes("伤心")) {
            if (profile.ageGroup === 'child') response = "抱抱你！不哭哦，我们一起吃糖果好不好？🍬";
            else if (profile.ageGroup === 'teen') response = "我懂那种感觉。考试还是朋友的问题？随时可以跟我说说。";
            else response = "生活总有起伏。如果你愿意，我们可以深入探讨一下情绪的来源。";
        } else if (input.includes("人格")) {
            const result = this.npti.analyze?.() || { type: '未知', description: '需要完成测评' };
            response = `根据分析，你的 NPTI 人格倾向可能是 ${result.type}。${result.description}`;
        } else {
            response = `[${profile.ageGroup || 'adult'} Mode] 我收到了你的消息：${input}。让我们聊聊更多关于你的心情吧。`;
        }

        this.hideTyping();
        this.appendMessage('AI', response, 'ai');
    }

    appendMessage(sender, text, type) {
        const div = document.createElement('div');
        div.className = `message ${type}`;
        div.textContent = text;
        this.chatWindow?.appendChild(div);
        if (this.chatWindow) {
            this.chatWindow.scrollTop = this.chatWindow.scrollHeight;
        }
    }

    showTyping() {
        const div = document.createElement('div');
        div.id = 'typing-indicator';
        div.className = 'message ai';
        div.textContent = '...';
        this.chatWindow?.appendChild(div);
    }

    hideTyping() {
        const el = document.querySelector('#typing-indicator');
        if (el) el.remove();
    }
}

// 初始化页面
window.addEventListener('DOMContentLoaded', () => {
    new ChatPage();
});