// 文件路径: 网页promax/js/components/export-manager.js
// 描述: 负责处理聊天记录的导出功能。

/**
 * 初始化导出功能的模态框和事件监听。
 */
function initializeExport() {
    const modal = document.getElementById('export-modal');
    if (!modal) return;

    const openBtn = document.getElementById('export-btn');
    const closeBtn = document.getElementById('close-export-btn');
    const confirmBtn = document.getElementById('confirm-export-btn');

    openBtn.addEventListener('click', () => modal.classList.add('visible'));
    closeBtn.addEventListener('click', () => modal.classList.remove('visible'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('visible'); });
    confirmBtn.addEventListener('click', () => {
        exportChat();
        modal.classList.remove('visible');
    });
}

/**
 * 执行导出聊天记录的操作。
 */
function exportChat() {
    const chatHistory = document.getElementById('chat-history');
    const format = document.getElementById('export-format').value;
    let filename = document.getElementById('export-filename').value.trim() || `chat-export-${Date.now()}`;
    const includeTimestamp = document.getElementById('include-timestamp').checked;
    const includeThinking = document.getElementById('include-thinking').checked;

    if (includeTimestamp) {
        filename += `_${new Date().toISOString().replace(/[:.]/g, '-')}`;
    }

    const messages = Array.from(chatHistory.querySelectorAll('.message')).map(msgEl => {
        const sender = msgEl.classList.contains('user') ? 'User' : 'AI';
        const contentEl = msgEl.querySelector('.content');
        const thinkingEl = msgEl.querySelector('.thinking-process');
        
        const content = contentEl.dataset.rawText || contentEl.innerText;
        
        let thinking = null;
        if (includeThinking && thinkingEl) {
            thinking = thinkingEl.innerText;
        }
        return { sender, content, thinking };
    });

    let fileContent = '';
    let mimeType = 'text/plain';
    let extension = 'txt';

    switch (format) {
        case 'markdown':
            extension = 'md';
            mimeType = 'text/markdown';
            fileContent = messages.map(m => {
                let text = `**${m.sender}:**\n\n${m.content}\n\n`;
                if (m.thinking) {
                    text += `> **Thinking Process:**\n> ${m.thinking.replace(/\n/g, '\n> ')}\n\n`;
                }
                return text;
            }).join('---\n\n');
            break;
        case 'html':
            extension = 'html';
            mimeType = 'text/html';
            const body = messages.map(m => {
                let thinkingHtml = '';
                if (m.thinking) {
                    thinkingHtml = `<div class="thinking-process"><h4>Thinking Process:</h4><pre>${m.thinking}</pre></div>`;
                }
                return `<div class="message ${m.sender.toLowerCase()}">
                    <div class="sender">${m.sender}</div>
                    <div class="content">${m.content.replace(/\n/g, '<br>')}</div>
                    ${thinkingHtml}
                </div>`;
            }).join('');
            fileContent = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>Chat Export</title><style>body{font-family:sans-serif;line-height:1.6;padding:20px;}.message{margin-bottom:1em;padding:1em;border-radius:5px;}.user{background:#e1f5fe;}.ai{background:#f1f8e9;}.sender{font-weight:bold;}.thinking-process{font-style:italic;color:#555;background:#eee;padding:0.5em;margin-top:0.5em;border-left:3px solid #ccc;}</style></head><body>${body}</body></html>`;
            break;
        case 'json':
            extension = 'json';
            mimeType = 'application/json';
            fileContent = JSON.stringify(messages, null, 2);
            break;
        case 'txt':
        default:
            fileContent = messages.map(m => {
                let text = `${m.sender}:\n${m.content}\n`;
                if (m.thinking) {
                    text += `\n--- Thinking Process ---\n${m.thinking}\n--- End Thinking ---\n`;
                }
                return text;
            }).join('\n================================\n');
            break;
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    showNotification(`聊天记录已导出为 ${filename}.${extension}`, 'success');
}

/**
 * 直接将当前聊天记录导出为 TXT 文件。
 */
function exportChatAsTxt() {
    const chatHistory = document.getElementById('chat-history');
    const projectName = document.getElementById('project-name-display')?.textContent || '当前对话';
    let filename = `${projectName}-export-${Date.now()}`;
    const includeTimestamp = true; // 默认包含时间戳

    if (includeTimestamp) {
        filename += `_${new Date().toISOString().replace(/[:.]/g, '-')}`;
    }

    const messages = Array.from(chatHistory.querySelectorAll('.message')).map(msgEl => {
        const sender = msgEl.classList.contains('user') ? 'User' : 'AI';
        const contentEl = msgEl.querySelector('.content');
        const content = contentEl.dataset.rawText || contentEl.innerText;
        return { sender, content };
    });

    let fileContent = messages.map(m => {
        return `${m.sender}:\n${m.content}\n`;
    }).join('\n================================\n');

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    showNotification(`聊天记录已导出为 ${filename}.txt`, 'success');
}