// 文件路径: 网页promax/js/ui/chat-history.js
// 描述: 负责管理聊天历史记录的DOM操作，包括添加、创建和更新消息。

/**
 * 向聊天记录中添加一条新消息。
 * @param {string} sender - 发送者 ('user', 'gemini', 'error').
 * @param {string} text - 消息内容 (可以是Markdown或HTML).
 * @param {string|null} thinkingText - AI的思考过程文本 (Markdown).
 * @param {boolean} isRawHtml - 如果为true，则直接将text作为HTML插入，否则作为Markdown解析。
 * @returns {HTMLElement} 返回创建的消息内容元素。
 */
function addMessageToHistory(sender, text, thinkingText = null, isRawHtml = false) {
    const chatHistory = document.getElementById('chat-history');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);

    let avatarHtml = (sender === 'user')
        ? `<div class="avatar"><i class="fas fa-user"></i></div>`
        : `<div class="avatar"><i class="fas fa-bolt"></i></div>`;

    let mainContentHtml;
    if (sender === 'user' && text.length > 200 && !isRawHtml) {
        const summary = text.substring(0, 80) + '...';
        const escapedText = text.replace(/</g, "<").replace(/>/g, ">");
        mainContentHtml = `
            <details>
                <summary>用户指令: ${summary}</summary>
                <p>${escapedText}</p>
            </details>
        `;
        isRawHtml = true;
    } else {
        mainContentHtml = isRawHtml ? DOMPurify.sanitize(text, {ADD_TAGS: ['details', 'summary']}) : DOMPurify.sanitize(marked.parse(text));
    }
    
    let copyButtonHtml = (sender === 'gemini' || sender === 'error') 
        ? `<button class="copy-message-btn" title="复制内容"><i class="fas fa-copy"></i></button>` 
        : '';
    
    let thinkingHtml = '';
    let thinkingToggleHtml = '';
    if (thinkingText) {
        const sanitizedThinking = DOMPurify.sanitize(marked.parse(thinkingText));
        thinkingHtml = `<div class="thinking-process" style="display: none;">${sanitizedThinking}</div>`;
        thinkingToggleHtml = `<button class="thinking-toggle-btn" title="显示/隐藏思考过程"><i class="fas fa-brain"></i></button>`;
    }

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'content-wrapper';
    contentWrapper.innerHTML = `
        <div class="message-controls">
            ${thinkingToggleHtml}
            ${copyButtonHtml}
        </div>
        <div class="content">${mainContentHtml}</div>
        ${thinkingHtml}
    `;
    contentWrapper.querySelector('.content').dataset.rawText = text;

    messageElement.innerHTML = avatarHtml;
    messageElement.appendChild(contentWrapper);
    
    chatHistory.appendChild(messageElement);
    
    const codeBlocks = messageElement.querySelectorAll('pre');
    codeBlocks.forEach(addCopyButtonToCodeBlock);

    const copyBtn = messageElement.querySelector('.copy-message-btn');
    if(copyBtn) {
        copyBtn.addEventListener('click', () => {
            const contentToCopy = messageElement.querySelector('.content').dataset.rawText || messageElement.querySelector('.content').innerText;
            navigator.clipboard.writeText(contentToCopy).then(() => {
                showNotification('原始文本已复制到剪贴板！', 'success');
            }).catch(() => {
                showNotification('复制失败！', 'error');
            });
        });
    }

    const toggleBtn = messageElement.querySelector('.thinking-toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const thinkingDiv = messageElement.querySelector('.thinking-process');
            if (thinkingDiv) {
                const isHidden = thinkingDiv.style.display === 'none';
                thinkingDiv.style.display = isHidden ? 'block' : 'none';
                toggleBtn.classList.toggle('active', isHidden);
            }
        });
    }

    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    return messageElement.querySelector('.content');
}

/**
 * 为流式响应创建一个新的消息元素框架。
 * @returns {{messageContentElement: HTMLElement, cursorElement: HTMLElement, footerElement: HTMLElement}}
 */
function createStreamingMessage() {
    const chatHistory = document.getElementById('chat-history');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'gemini');
    
    const cursorElement = document.createElement('span');
    cursorElement.className = 'blinking-cursor';

    messageElement.innerHTML = `
        <div class="avatar"><i class="fas fa-bolt"></i></div>
        <div class="content-wrapper">
            <div class="message-controls"></div>
            <div class="thinking-process" style="display: none;"></div>
            <div class="content"></div>
            <div class="message-footer generating">正在生成中...</div>
        </div>`;
    
    const messageContentElement = messageElement.querySelector('.content');
    const footerElement = messageElement.querySelector('.message-footer');
    messageContentElement.appendChild(cursorElement);

    chatHistory.appendChild(messageElement);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    return { messageContentElement, cursorElement, footerElement };
}

/**
 * 为代码块元素添加一个复制按钮。
 * @param {HTMLElement} preElement - <pre> 元素。
 */
function addCopyButtonToCodeBlock(preElement) {
    const codeText = preElement.querySelector('code')?.innerText;
    if (!codeText) return;

    // 避免重复添加按钮
    if (preElement.querySelector('.copy-btn')) return;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = '<i class="fas fa-copy"></i> 复制';
    
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(codeText).then(() => {
            copyBtn.innerHTML = '<i class="fas fa-check"></i> 已复制!';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i> 复制';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            copyBtn.innerText = '复制失败';
        });
    });
    
    preElement.appendChild(copyBtn);
}