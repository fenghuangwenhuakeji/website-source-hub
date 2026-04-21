import EventBus from '../core/eventBus.js';

export default class ChatUI {
    constructor(container) {
        this.container = container;
    }

    render() {
        this.container.innerHTML = `
            <div class="chat-container">
                <div class="chat-messages" id="chat-messages">
                    <div class="message system">欢迎来到星语心伴，我是你的专属AI伙伴。</div>
                </div>
                <div class="chat-input-area">
                    <input type="text" id="chat-input" placeholder="输入你想说的话...">
                    <button id="btn-send">发送</button>
                </div>
            </div>
        `;
        this.bindEvents();
    }

    bindEvents() {
        const input = document.getElementById('chat-input');
        const btn = document.getElementById('btn-send');

        const sendMessage = () => {
            const text = input.value.trim();
            if (text) {
                this.addMessage(text, 'user');
                input.value = '';
                EventBus.emit('chat:send', text);
            }
        };

        btn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        // 监听 AI 回复
        EventBus.on('chat:receive', (text) => {
            this.addMessage(text, 'ai');
        });
    }

    addMessage(text, type) {
        const messagesDiv = document.getElementById('chat-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${type}`;
        msgDiv.textContent = text;
        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}