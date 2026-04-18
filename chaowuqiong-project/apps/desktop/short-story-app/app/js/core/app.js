import { db } from './db.js';
import { ui } from '../ui/ui-manager.js';
import { helpers } from '../utils/helpers.js';
import { api } from './api.js';
import { libraryManager } from '../modules/library-manager.js';
import { chatManager } from '../modules/chat-manager.js';
import { fusion } from '../modules/fusion.js';
import { writing } from '../modules/writing.js';
import { apiManager } from '../modules/api-manager.js';

class App {
    constructor() {
        // 定义工具函数
        this.utils = {
            copyResult: (id) => {
                const content = document.getElementById(id).textContent;
                if (!content || content === '结果将显示在这里...') {
                    ui.showNotification('暂无内容', 'error');
                    return;
                }
                helpers.copyToClipboard(content).then(() => ui.showNotification('已复制', 'success'));
            },
            copyBookContent: () => {
                const content = document.getElementById('book-content-input').value;
                helpers.copyToClipboard(content).then(() => ui.showNotification('已复制', 'success'));
            },
            copyPromptContent: () => {
                const content = document.getElementById('view-prompt-content').value;
                helpers.copyToClipboard(content).then(() => ui.showNotification('已复制', 'success'));
            }
        };
    }

    async init() {
        try {
            await db.init();
            await libraryManager.init();
            await apiManager.init();
            console.log('StoryForge v8.0 Initialized');
        } catch (e) {
            console.error('Initialization failed:', e);
            ui.showNotification('应用初始化失败: ' + e.message, 'error');
        }
    }

    // 代理 UI 方法
    switchView(view) { ui.switchView(view); }
}

const app = new App();

// 挂载全局对象，供 HTML 事件调用
window.app = app;
window.ui = ui;
window.utils = app.utils;
window.modules = {
    library: libraryManager,
    chat: chatManager,
    fusion: fusion,
    writing: writing,
    api: apiManager
};

// 启动应用
window.addEventListener('load', () => app.init());