// 文件路径: 网页promax/js/components/sharing.js
// 描述: 负责处理对话内容的分享功能。

/**
 * 初始化分享功能，为分享按钮和返回按钮绑定事件。
 */
function initializeSharing() {
    const shareBtn = document.getElementById('share-btn');
    const backToAppBtn = document.getElementById('back-to-app');

    if (shareBtn) {
        shareBtn.addEventListener('click', generateShareLink);
    }

    if (backToAppBtn) {
        backToAppBtn.addEventListener('click', (e) => {
            e.preventDefault();
            exitSharingView();
        });
    }

    // 检查页面加载时URL是否包含分享ID
    checkForShareLink();
}

/**
 * 生成一个分享链接，并将当前对话内容保存到localStorage。
 */
function generateShareLink() {
    const chatHistory = document.getElementById('chat-history');
    if (chatHistory.children.length < 2) {
        showNotification('对话内容过少，无法分享。', 'info');
        return;
    }

    const shareId = `share_${Date.now()}`;
    
    const messages = Array.from(chatHistory.querySelectorAll('.message')).map(msgEl => {
        return {
            sender: msgEl.classList.contains('user') ? 'user' : 'gemini',
            content: msgEl.querySelector('.content').innerHTML,
            thinking: msgEl.querySelector('.thinking-process')?.innerHTML || null
        };
    });

    const shareData = {
        messages: messages,
        createdAt: new Date().toISOString()
    };

    try {
        localStorage.setItem(shareId, JSON.stringify(shareData));

        const url = new URL(window.location.href);
        url.searchParams.set('share', shareId);
        
        navigator.clipboard.writeText(url.href).then(() => {
            showNotification('分享链接已复制到剪贴板！', 'success');
        }).catch(() => {
            showNotification('复制分享链接失败。', 'error');
        });

    } catch (e) {
        showNotification('创建分享链接失败，可能是浏览器存储空间已满。', 'error');
        console.error("保存分享数据失败:", e);
    }
}

/**
 * 根据分享ID从localStorage获取数据并显示分享视图。
 * @param {string} shareId - 分享ID。
 */
function displaySharedContent(shareId) {
    const shareDataString = localStorage.getItem(shareId);
    const sharedChatHistory = document.getElementById('shared-chat-history');

    if (!shareDataString || !sharedChatHistory) {
        document.body.innerHTML = `<div style="text-align: center; padding: 50px 20px;"><h1>分享的内容不存在或已过期</h1><p><a href="${window.location.pathname}">返回主应用</a></p></div>`;
        return;
    }

    const shareData = JSON.parse(shareDataString);
    sharedChatHistory.innerHTML = '';

    shareData.messages.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', msg.sender);
        
        const avatarHtml = (msg.sender === 'user')
            ? `<div class="avatar"><i class="fas fa-user"></i></div>`
            : `<div class="avatar"><i class="fas fa-bolt"></i></div>`;

        const thinkingHtml = (msg.thinking && msg.thinking.trim())
            ? `<div class="thinking-process" style="display: block;">${msg.thinking}</div>`
            : '';

        messageElement.innerHTML = `
            ${avatarHtml}
            <div class="content-wrapper">
                ${thinkingHtml}
                <div class="content">${msg.content}</div>
            </div>
        `;
        sharedChatHistory.appendChild(messageElement);
    });

    document.body.classList.add('sharing');
    
    const url = new URL(window.location.href);
    if (url.searchParams.get('share') !== shareId) {
        url.searchParams.set('share', shareId);
        history.pushState({}, '', url.href);
    }
}

/**
 * 检查URL中是否存在分享参数，如果存在则显示分享视图。
 */
function checkForShareLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('share');
    if (shareId) {
        displaySharedContent(shareId);
    }
}

/**
 * 退出分享视图，返回主应用界面。
 */
function exitSharingView() {
    document.body.classList.remove('sharing');
    const url = new URL(window.location.href);
    url.searchParams.delete('share');
    window.history.replaceState({}, '', url.href);
    window.location.reload();
}