// 文件路径: 网页promax/js/main.js
// 描述: 应用主入口，负责初始化所有模块和设置全局事件监听器。

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await appDB.initDB();
        console.log("数据库初始化完成，开始加载应用模块...");

        // 初始化UI组件
        ThemeManager.init();
        initializeApiSettingsModal();
        initializeProjectManager();
        initializeExport();
        initializeToolbox();
        initializeModalHandlers();
        initializeSharing();
        initializeFocusMode();
        initializeCopyAllButton();
        initializeAttachmentButton();
        
        // 初始化提示词管理器
        initializePromptManager();

        // 设置核心聊天功能的事件监听器
        setupEventListeners();

        // 初始欢迎消息
        const chatHistory = document.getElementById('chat-history');
        if (chatHistory.children.length === 0) {
            addMessageToHistory('gemini', '你好，我是墨竹。一个专为创作者打造的AI副驾驶。准备好开始了吗？');
        }
        
        // 数据库准备好后，加载初始提示词
        await loadPrompts();
        
    } catch (error) {
        console.error("数据库初始化失败，应用无法正常启动:", error);
        showNotification("关键数据库加载失败，请刷新页面或联系技术支持。", "error");
    }
});

/**
 * 设置主聊天界面的核心事件监听器。
 */
function setupEventListeners() {
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const stopBtn = document.getElementById('stop-btn');
    const resetBtn = document.getElementById('reset-project-btn');

    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = (messageInput.scrollHeight) + 'px';
    });

    sendBtn.addEventListener('click', handleSendMessage);
    stopBtn.addEventListener('click', stopGeneration);

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

    resetBtn.addEventListener('click', () => {
        if(confirm("确定要开始一次全新的创作对话吗？当前的聊天记录将会被清空。")) {
            document.getElementById('chat-history').innerHTML = '';
            addMessageToHistory('gemini', '你好，我是博士。已经为你清空画布，准备好开始新的创作了吗？');
            showNotification("已开启新的对话。","info");
        }
    });
}

/**
 * 注册Service Worker以支持离线功能。
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        });
    }
}