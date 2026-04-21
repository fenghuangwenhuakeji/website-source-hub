/**
 * 聊天模块 - 合并版本（非ES模块）
 * 解决file://协议下的CORS问题
 */

class ChatPage {
    constructor() {
        this.ageGroup = 'adult';
        this.initUI();
        this.bindEvents();
    }

    initUI() {
        this.chatWindow = document.querySelector('.chat-window');
        this.inputField = document.querySelector('#user-input');
        this.sendBtn = document.querySelector('#send-btn');
        this.themeSelect = document.querySelector('#age-selector');
        
        this.updateTheme('adult');
        this.appendMessage('AI', '你好！我是星语心伴，你的专属心理伙伴。有什么想聊的吗？', 'ai');
    }

    bindEvents() {
        this.themeSelect?.addEventListener('change', (e) => {
            const age = parseInt(e.target.value);
            if (age >= 22) this.ageGroup = 'adult';
            else if (age >= 12) this.ageGroup = 'teen';
            else this.ageGroup = 'child';
            this.updateTheme(this.ageGroup);
            this.appendMessage('System', `已切换至 ${this.ageGroup.toUpperCase()} 模式`, 'system');
        });

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

        this.appendMessage('User', text, 'user');
        this.inputField.value = '';

        this.showTyping();
        setTimeout(() => {
            this.generateResponse(text);
        }, 1000);
    }

    generateResponse(input) {
        let response = "";

        if (input.includes("难过") || input.includes("伤心")) {
            if (this.ageGroup === 'child') response = "抱抱你！不哭哦，我们一起吃糖果好不好？🍬";
            else if (this.ageGroup === 'teen') response = "我懂那种感觉。考试还是朋友的问题？随时可以跟我说说。";
            else response = "生活总有起伏。如果你愿意，我们可以深入探讨一下情绪的来源。";
        } else if (input.includes("人格")) {
            response = "根据分析，你可以尝试NPTI人格测评来了解自己的人格类型。";
        } else if (input.includes("你好") || input.includes("嗨")) {
            response = "你好呀！今天心情怎么样？";
        } else if (input.includes("谢谢")) {
            response = "不客气！能帮到你我很开心~";
        } else {
            response = `[${this.ageGroup} Mode] 我收到了你的消息。让我们聊聊更多关于你的心情吧。`;
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

window.addEventListener('DOMContentLoaded', () => { new ChatPage(); });