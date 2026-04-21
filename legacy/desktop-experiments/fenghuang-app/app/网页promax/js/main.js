// 文件路径: 网页promax/js/main.js
// V79.1 统一配置版

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await appDB.initDB();
        console.log("数据库初始化完成，开始加载应用模块...");

        ThemeManager.init();
        initializeProjectManager();
        initializeExport();
        initializeToolbox();
        initializeModalHandlers();
        initializeSharing();
        initializeFocusMode();
        initializeCopyAllButton();
        initializeAttachmentButton();
        initializePromptManager();
        setupEventListeners();

        const chatHistory = document.getElementById('chat-history');
        if (chatHistory && chatHistory.children.length === 0) {
            addMessageToHistory('gemini', '你好，我是墨竹。一个专为创作者打造的AI副驾驶。准备好开始了吗？');
        }

        await loadPrompts();
        
    } catch (error) {
        console.error("数据库初始化失败，应用无法正常启动:", error);
        showNotification("关键数据库加载失败，请刷新页面或联系技术支持。", "error");
    }
});

function setupEventListeners() {
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const stopBtn = document.getElementById('stop-btn');
    const resetBtn = document.getElementById('reset-project-btn');

    if (messageInput) {
        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = (messageInput.scrollHeight) + 'px';
        });
    }

    if (sendBtn) sendBtn.addEventListener('click', handleSendMessage);
    if (stopBtn) stopBtn.addEventListener('click', stopGeneration);

    if (messageInput) {
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (historyIndex < userInputHistory.length - 1) {
                    historyIndex++;
                    messageInput.value = userInputHistory[historyIndex];
                    messageInput.dispatchEvent(new Event('input'));
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndex > 0) {
                    historyIndex--;
                    messageInput.value = userInputHistory[historyIndex];
                    messageInput.dispatchEvent(new Event('input'));
                } else {
                    historyIndex = -1;
                    messageInput.value = '';
                    messageInput.dispatchEvent(new Event('input'));
                }
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if(confirm("确定要开始一次全新的创作对话吗？当前的聊天记录将会被清空。")) {
                const history = document.getElementById('chat-history');
                if (history) history.innerHTML = '';
                addMessageToHistory('gemini', '你好，我是博士。已经为你清空画布，准备好开始新的创作了吗？');
                showNotification("已开启新的对话。","info");
            }
        });
    }
}
