export class ChatSystem {
    constructor(eventBus, store) {
        this.eventBus = eventBus;
        this.store = store;
        
        this.eventBus.on('send-message', this.handleMessage.bind(this));
    }

    handleMessage(text) {
        const user = this.store.getState().user;
        
        // 1. 保存用户消息
        this.addMessage('user', text);
        
        // 2. 模拟AI思考延迟
        this.eventBus.emit('chat-typing', true);
        
        setTimeout(() => {
            // 3. 生成响应 (模拟)
            const response = this.generateResponse(text, user);
            this.addMessage('ai', response);
            this.eventBus.emit('chat-typing', false);
        }, 1000);
    }

    addMessage(sender, text) {
        const msg = {
            id: Date.now(),
            sender,
            text,
            timestamp: new Date()
        };
        
        const history = this.store.getState().chatHistory || [];
        this.store.setState('chatHistory', [...history, msg]);
        
        this.eventBus.emit('new-message', msg);
    }

    generateResponse(input, user) {
        // 简单的规则路由模拟
        if (user.ageGroup === 'kids') {
            return `小朋友，你说"${input}"真有意思！我是你的好朋友，我们可以一起玩游戏哦！`;
        } else if (user.ageGroup === 'teen') {
            return `我理解这种感觉。关于"${input}"，你是怎么想的呢？星座运势说你最近很有创造力呢。`;
        } else {
            return `关于"${input}"，这是一个值得深入探讨的话题。从心理学角度来看，这反映了当下的某种状态。`;
        }
    }
}