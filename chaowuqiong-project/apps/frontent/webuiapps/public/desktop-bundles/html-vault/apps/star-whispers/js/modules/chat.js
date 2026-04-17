import { LLMAdapter } from '../services/llm_adapter.js';

/**
 * Chat Module
 * 负责对话界面的渲染与交互
 */
export class ChatModule {
    constructor(securityService, age) {
        this.container = document.getElementById('chat-view');
        this.security = securityService;
        this.userAge = age;
        this.llm = new LLMAdapter(); // 初始化 LLM 适配器
        this.messages = [];
    }

    init() {
        this.renderLayout();
        this.addMessage('ai', '你好呀！我是你的专属伙伴。告诉我今天发生了什么有趣的事情吧？');
    }

    renderLayout() {
        this.container.innerHTML = `
            <div class="chat-container" id="message-list">
                <!-- 消息列表 -->
            </div>
            <div class="chat-input-area">
                <input type="text" class="chat-input" placeholder="输入消息..." id="input-box">
                <div class="send-btn" id="send-btn">➤</div>
            </div>
        `;
        
        const sendBtn = this.container.querySelector('#send-btn');
        const inputBox = this.container.querySelector('#input-box');

        sendBtn.addEventListener('click', () => this.handleSend());
        inputBox.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSend();
        });
    }

    async handleSend() {
        const input = this.container.querySelector('#input-box');
        const text = input.value.trim();
        if (!text) return;

        // 1. 用户消息上屏
        this.addMessage('user', text);
        input.value = '';

        // 2. 安全检查
        if (this.security && !this.security.check(text)) {
            setTimeout(() => {
                this.addMessage('ai', this.security.getWarningMessage());
            }, 500);
            return;
        }

        // 3. 调用 LLM 服务 (模拟多模型路由)
        try {
            // 显示输入中状态...
            const loadingId = this.addLoadingIndicator();
            
            const response = await this.llm.sendMessage(text, { age: this.userAge });
            
            // 移除 Loading，显示回复
            this.removeMessage(loadingId);
            this.addMessage('ai', response);
        } catch (error) {
            console.error(error);
            this.addMessage('ai', '抱歉，我现在有点累，请稍后再试。');
        }
    }

    addMessage(role, text) {
        const list = this.container.querySelector('#message-list');
        const msgDiv = document.createElement('div');
        const id = Date.now();
        msgDiv.id = `msg-${id}`;
        msgDiv.className = `message-row ${role}`;
        
        const avatar = `<div class="avatar"></div>`;
        const bubble = `<div class="message-bubble">${text}</div>`;
        
        msgDiv.innerHTML = role === 'ai' ? avatar + bubble : bubble + avatar;
        list.appendChild(msgDiv);
        window.scrollTo(0, document.body.scrollHeight);
        return id;
    }

    addLoadingIndicator() {
        return this.addMessage('ai', '<span class="typing-dots">...</span>');
    }

    removeMessage(id) {
        const el = document.getElementById(`msg-${id}`);
        if (el) el.remove();
    }
}