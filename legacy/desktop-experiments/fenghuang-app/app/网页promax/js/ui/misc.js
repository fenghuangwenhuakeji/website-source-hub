// 文件路径: 网页promax/js/ui/misc.js
// 描述: 包含一些零散的UI交互功能。

/**
 * 初始化写作模式（专注模式）的切换功能。
 */
function initializeFocusMode() {
    const focusBtn = document.getElementById('focus-mode-btn');
    if (focusBtn) {
        focusBtn.addEventListener('click', () => {
            document.body.classList.toggle('focus-mode');
            const icon = focusBtn.querySelector('i');
            const isActive = document.body.classList.contains('focus-mode');
            icon.className = isActive ? 'fas fa-compress' : 'fas fa-expand';
            focusBtn.title = isActive ? '退出写作模式' : '写作模式';
            showNotification(isActive ? '已进入写作模式' : '已退出写作模式', 'info');
        });
    }
}

/**
 * 初始化“复制全文”按钮的功能。
 */
function initializeCopyAllButton() {
    const copyAllBtn = document.getElementById('copy-all-btn');
    if (copyAllBtn) {
        copyAllBtn.addEventListener('click', () => {
            const chatHistory = document.getElementById('chat-history');
            const aiMessages = chatHistory.querySelectorAll('.message.gemini .content');
            if (aiMessages.length === 0) {
                showNotification('没有AI生成的内容可复制。', 'info');
                return;
            }

            const fullText = Array.from(aiMessages)
                .map(el => el.dataset.rawText || el.innerText)
                .join('\n\n---\n\n');

            navigator.clipboard.writeText(fullText).then(() => {
                showNotification('已将所有AI生成内容（原始格式）复制到剪贴板！', 'success');
            }).catch(err => {
                showNotification('复制全文失败！', 'error');
                console.error('Failed to copy full text: ', err);
            });
        });
    }
}