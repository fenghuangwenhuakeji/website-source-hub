import { SafetyFilter } from '../security/SafetyFilter.js';

/**
 * 对话系统模块
 * 处理消息收发、UI渲染和AI模拟响应
 */
export class ChatModule {
    constructor(app) {
        this.app = app;
        this.safetyFilter = new SafetyFilter();
        this.container = null;
        this.messages = [];
    }

    init(containerId) {
        this.container = document.getElementById(containerId);
        this.renderLayout();
    }

    renderLayout() {
        this.container.innerHTML = `
            <div class="chat-window">
                <div class="chat-history" id="chat-history"></div>
                <div class="chat-input-area">
                    <input type="text" id="chat-input" placeholder="在这里输入心事..." />
                    <button id="send-btn">发送</button>
                </div>
            </div>
        `;

        // 绑定事件
        document.getElementById('send-btn').addEventListener('click', () => this.handleSend());
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSend();
        });

        // 欢迎语
        this.addMessage('system', '你好呀！我是你的AI心理伙伴。今天心情怎么样？');
    }

    async handleSend() {
        const inputEl = document.getElementById('chat-input');
        const text = inputEl.value.trim();
        if (!text) return;

        // 1. 用户消息上屏
        this.addMessage('user', text);
        inputEl.value = '';

        // 2. 安全检查
        const userProfile = this.app.userModule.getProfile();
        const safetyCheck = this.safetyFilter.check(text, userProfile.ageGroup);

        if (!safetyCheck.safe) {
            setTimeout(() => this.addMessage('system', `⚠️ ${safetyCheck.reason}`), 500);
            return;
        }

        // 3. 模拟AI回复 (根据年龄段)
        this.showTyping();
        setTimeout(() => {
            this.removeTyping();
            const reply = this.generateMockReply(text, userProfile);
            this.addMessage('ai', reply);
        }, 1000);
    }

    addMessage(role, text) {
        const history = document.getElementById('chat-history');
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}`;
        msgDiv.innerHTML = `<div class="bubble">${text}</div>`;
        history.appendChild(msgDiv);
        history.scrollTop = history.scrollHeight;
    }

    showTyping() {
        const history = document.getElementById('chat-history');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'message ai';
        typingDiv.innerHTML = '<div class="bubble">正在思考...</div>';
        history.appendChild(typingDiv);
        history.scrollTop = history.scrollHeight;
    }

    removeTyping() {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
    }

    generateMockReply(text, profile) {
        // 简单的规则引擎模拟
        if (profile.ageGroup === 'child') {
            return `哇！你说的是“${text}”吗？这听起来好有趣！我们要不要一起画画？🎨`;
        } else if (profile.ageGroup === 'teen') {
            return `我明白这种感觉。关于“${text}”，是不是让你觉得有点压力？我们可以聊聊星座运势放松一下。🔮`;
        } else {
            return `我听到了你的心声。关于“${text}”，这确实是一个值得深思的话题。从心理学角度来看，这反映了你当下的关注点。我们可以深入探讨一下吗？`;
        }
    }
}