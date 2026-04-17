import { UserContext } from './core/UserContext.js';
import { SecurityLayer } from './core/SecurityLayer.js';
import { NPTIAnalyzer } from './modules/NPTIAnalyzer.js';
import { HoroscopeEmotion } from './modules/HoroscopeEmotion.js';

class StarWhispersApp {
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
        this.appendMessage('AI', '你好！我是星语心伴，你的专属心理伙伴。请先告诉我你的年龄，我会为你调整最适合的模式。', 'ai');
    }

    bindEvents() {
        // 年龄切换
        this.themeSelect.addEventListener('change', (e) => {
            const age = parseInt(e.target.value);
            this.user.setAge(age);
        });

        // 监听用户状态变化以更新UI
        this.user.subscribe('ageChanged', (group) => {
            this.updateTheme(group);
            this.appendMessage('System', `已切换至 ${group.toUpperCase()} 模式`, 'system');
            
            // 刷新侧边栏信息
            const forecast = this.horoscope.getInterpretation(this.user.getProfile().horoscope, group);
            document.querySelector('#horoscope-text').textContent = forecast;
        });

        // 发送消息
        this.sendBtn.addEventListener('click', () => this.handleSend());
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSend();
        });
    }

    updateTheme(group) {
        document.documentElement.setAttribute('data-theme', group);
    }

    handleSend() {
        const text = this.inputField.value.trim();
        if (!text) return;

        // 1. 安全检查
        if (!this.security.checkInput(text)) {
            this.appendMessage('System', this.security.getWarningMessage(), 'system');
            this.inputField.value = '';
            return;
        }

        // 2. 显示用户消息
        this.appendMessage('User', text, 'user');
        this.inputField.value = '';

        // 3. 模拟 AI 响应 (延迟)
        this.showTyping();
        setTimeout(() => {
            this.generateResponse(text);
        }, 1000);
    }

    generateResponse(input) {
        const profile = this.user.getProfile();
        let response = "";

        // 简单的关键词匹配模拟 AI
        if (input.includes("难过") || input.includes("伤心")) {
            if (profile.ageGroup === 'child') response = "抱抱你！不哭哦，我们一起吃糖果好不好？🍬";
            else if (profile.ageGroup === 'teen') response = "我懂那种感觉。考试还是朋友的问题？随时可以跟我说说。";
            else response = "生活总有起伏。如果你愿意，我们可以深入探讨一下情绪的来源。";
        } else if (input.includes("人格")) {
            const result = this.npti.analyze();
            response = `根据分析，你的 NPTI 人格倾向可能是 ${result.type}。${result.description}`;
        } else {
            response = `[${profile.ageGroup} Mode] 我收到了你的消息：${input}。让我们聊聊更多关于你的星座或心情吧。`;
        }

        this.hideTyping();
        this.appendMessage('AI', response, 'ai');
    }

    appendMessage(sender, text, type) {
        const div = document.createElement('div');
        div.className = `message ${type}`;
        div.textContent = text;
        this.chatWindow.appendChild(div);
        this.chatWindow.scrollTop = this.chatWindow.scrollHeight;
    }

    showTyping() {
        // 简单模拟
        const div = document.createElement('div');
        div.id = 'typing-indicator';
        div.className = 'message ai';
        div.textContent = '...';
        this.chatWindow.appendChild(div);
    }

    hideTyping() {
        const el = document.querySelector('#typing-indicator');
        if (el) el.remove();
    }
}

// 启动应用
window.addEventListener('DOMContentLoaded', () => {
    new StarWhispersApp();
});