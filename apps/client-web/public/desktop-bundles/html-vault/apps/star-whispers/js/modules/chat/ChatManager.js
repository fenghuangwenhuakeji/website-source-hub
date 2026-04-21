export default class ChatManager {
    constructor(app) {
        this.app = app;
        this.historyContainer = document.getElementById('chat-history');
        this.input = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('btn-send');
        
        this.bindEvents();
    }

    bindEvents() {
        this.sendBtn.addEventListener('click', () => this.handleSend());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSend();
        });
    }

    handleSend() {
        const text = this.input.value.trim();
        if (!text) return;

        // 1. 安全检查
        const securityCheck = this.app.securityGuard.checkContent(text);
        if (!securityCheck.safe) {
            this.addMessage('system', `⚠️ 内容安全拦截: ${securityCheck.reason}`);
            return;
        }

        // 2. 显示用户消息
        this.addMessage('user', text);
        this.input.value = '';

        // 3. 模拟AI回复 (这里未来会接入LLM)
        this.simulateAIResponse(text);
    }

    addMessage(role, text) {
        const div = document.createElement('div');
        div.className = `message ${role}`;
        div.textContent = text;
        this.historyContainer.appendChild(div);
        this.historyContainer.scrollTop = this.historyContainer.scrollHeight;
    }

    simulateAIResponse(userText) {
        // 简单的模拟逻辑，根据年龄段返回不同风格
        const ageGroup = this.app.userContext.getAgeGroup();
        let response = '';

        setTimeout(() => {
            if (ageGroup === 'child') {
                response = `我是你的好朋友！你刚才说的是“${userText}”吗？我们可以一起玩游戏哦！🎈`;
            } else if (ageGroup === 'teen') {
                response = `我懂你的感觉。关于“${userText}”，你是怎么想的呢？我们可以聊聊星座运势。✨`;
            } else {
                response = `收到您的反馈：“${userText}”。从心理学角度来看，这是一个值得探讨的话题。我们可以深入分析一下。`;
            }
            this.addMessage('ai', response);
        }, 1000);
    }

    sendWelcomeMessage() {
        const ageGroup = this.app.userContext.getAgeGroup();
        let msg = '';
        if (ageGroup === 'child') msg = '你好呀！我是星星助手，我们可以一起玩耍！';
        else if (ageGroup === 'teen') msg = 'Hey！我是你的专属伙伴，有什么心事都可以告诉我。';
        else msg = '您好，我是您的AI心理顾问。今天有什么可以帮您？';
        
        this.addMessage('ai', msg);
    }
}