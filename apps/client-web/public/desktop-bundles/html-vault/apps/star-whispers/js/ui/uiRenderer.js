export class UIRenderer {
    constructor() {
        this.chatContainer = document.getElementById('chat-container');
    }

    appendMessage(sender, text, type = 'text') {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message message-${sender.toLowerCase()}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = text;
        
        const metaDiv = document.createElement('div');
        metaDiv.className = 'message-meta';
        metaDiv.textContent = sender;

        msgDiv.appendChild(metaDiv);
        msgDiv.appendChild(contentDiv);
        
        this.chatContainer.appendChild(msgDiv);
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    clearInput() {
        document.getElementById('user-input').value = '';
    }

    showSystemAlert(text) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'system-alert';
        alertDiv.textContent = `[系统通知] ${text}`;
        alertDiv.style.color = 'red';
        alertDiv.style.fontSize = '0.8em';
        alertDiv.style.textAlign = 'center';
        alertDiv.style.margin = '10px 0';
        this.chatContainer.appendChild(alertDiv);
        this.scrollToBottom();
    }
}