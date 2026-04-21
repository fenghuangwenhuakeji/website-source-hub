import { UIRenderer } from '../ui/uiRenderer.js';

export class ChatSystem {
    constructor(eventBus, securityLayer) {
        this.bus = eventBus;
        this.security = securityLayer;
        this.ui = new UIRenderer();
        this.setupUI();
    }

    setupUI() {
        const sendBtn = document.getElementById('send-btn');
        const input = document.getElementById('user-input');
        
        // 绑定发送事件
        const handler = () => this.handleUserAction(input.value);
        
        if (sendBtn) sendBtn.addEventListener('click', handler);
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handler();
            });
        }
    }

    handleUserAction(text) {
        if (!text || !text.trim()) return;

        // 1. 前置安全检查
        // TODO: 从 UserManager 获取真实年龄，当前硬编码为 25
        const check = this.security.checkContent(text, 25); 
        if (!check.safe) {
            this.ui.showSystemAlert(`内容拦截: ${check.reason}`);
            this.ui.clearInput();
            return;
        }

        // 2. 显示用户消息
        this.ui.appendMessage('User', text);
        this.ui.clearInput();

        // 3. 模拟 AI 响应 (延迟 1s)
        setTimeout(() => {
            this.generateAIResponse(text);
        }, 1000);
    }

    generateAIResponse(userText) {
        // 简单的关键词匹配模拟
        let response = "我正在倾听...";
        if (userText.includes('你好')) response = "你好呀！今天心情怎么样？";
        else if (userText.includes('难过')) response = "抱抱你，愿意跟我说说发生了什么吗？";
        else if (userText.includes('星座')) response = "你是什星座的呢？我可以帮你看看运势哦。";
        
        this.ui.appendMessage('AI', response);
    }
}