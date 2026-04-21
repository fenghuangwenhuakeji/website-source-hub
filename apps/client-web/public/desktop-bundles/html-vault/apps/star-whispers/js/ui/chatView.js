export class ChatView {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.messagesContainer = document.getElementById('chat-messages');
        this.inputMessage = document.getElementById('input-message');
        this.btnSend = document.getElementById('btn-send');

        this.bindEvents();
    }

    bindEvents() {
        // 监听消息发送
        if (this.btnSend) {
            this.btnSend.addEventListener('click', () => this.handleSend());
        }

        if (this.inputMessage) {
            this.inputMessage.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleSend();
            });
        }

        // 监听事件总线
        this.eventBus.on('chat:message_sent', (msg) => this.appendMessage(msg));
        this.eventBus.on('chat:message_received', (msg) => this.appendMessage(msg));
    }

    handleSend() {
        const text = this.inputMessage.value.trim();
        if (text) {
            this.eventBus.emit('ui:send_message', text);
            this.inputMessage.value = '';
        }
    }

    appendMessage(msg) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${msg.sender}`;
        
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.textContent = msg.content;
        
        msgDiv.appendChild(bubble);
        this.messagesContainer.appendChild(msgDiv);
        
        // 自动滚动到底部
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}