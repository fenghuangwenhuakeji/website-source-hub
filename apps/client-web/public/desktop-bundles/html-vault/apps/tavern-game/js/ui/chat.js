import { store } from '../core/state.js';
import { scrollToBottom, escapeHtml } from '../utils/helpers.js';

export class ChatUI {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.chatBox = document.getElementById('chat-box');
        this.input = document.getElementById('user-input');
        this.sendBtn = document.getElementById('send-btn');
        
        this.initListeners();
    }

    initListeners() {
        this.sendBtn.addEventListener('click', () => this.handleSend());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });
    }

    handleSend() {
        const text = this.input.value.trim();
        if (!text) return;
        
        this.addMessage('user', text);
        this.input.value = '';
        
        // 调用引擎处理消息
        if (this.gameEngine) {
            this.gameEngine.processInput(text);
        }
    }

    addMessage(role, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = role === 'user' ? '👤' : '🤖';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
        
        msgDiv.appendChild(avatar);
        msgDiv.appendChild(content);
        
        this.chatBox.appendChild(msgDiv);
        scrollToBottom(this.chatBox);
    }
    
    showTyping() {
        // 显示正在输入动画
    }
    
    hideTyping() {
        // 隐藏正在输入动画
    }
}
