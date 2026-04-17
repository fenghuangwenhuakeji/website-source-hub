import { db } from './core/db.js';
import { store } from './core/state.js';
import { SidebarUI } from './ui/sidebar.js';
import { ChatUI } from './ui/chat.js';
import { DEFAULT_SCRIPTS } from './core/config.js';

class GameEngine {
    constructor() {
        this.sidebar = new SidebarUI(this);
        this.chat = new ChatUI(this);
        this.init();
    }

    async init() {
        await db.init();
        this.renderScriptList();
        // 默认显示游戏大厅
        this.sidebar.switchView('game');
    }

    renderScriptList() {
        const grid = document.getElementById('script-grid');
        if (!grid) return;
        
        grid.innerHTML = DEFAULT_SCRIPTS.map(script => `
            <div class="script-card" onclick="window.app.startGame('${script.id}')">
                <div class="script-icon">${script.icon}</div>
                <div class="script-info">
                    <div class="script-name">${script.name}</div>
                    <div class="script-desc">${script.desc}</div>
                    <div class="script-tags">
                        ${script.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }

    startGame(scriptId) {
        const script = DEFAULT_SCRIPTS.find(s => s.id === scriptId);
        if (!script) return;

        // 切换视图到游戏界面
        this.sidebar.switchView('play');
        
        // 更新 UI
        const nameEl = document.getElementById('current-script-name');
        const iconEl = document.getElementById('current-script-icon');
        if(nameEl) nameEl.textContent = script.name;
        if(iconEl) iconEl.textContent = script.icon;
        
        // 欢迎语
        this.chat.chatBox.innerHTML = ''; // 清空历史
        this.chat.addMessage('ai', `【系统】你已进入《${script.name}》。\n${script.prompt.substring(0, 50)}...`);
        
        // 更新状态
        store.set('currentScript', script);
    }

    async processInput(text) {
        // 模拟 AI 回复
        this.chat.showTyping();
        
        setTimeout(() => {
            this.chat.hideTyping();
            this.chat.addMessage('ai', `(AI 扮演中): ${text} 的结果...`);
            
            store.update('gameStats', (stats) => ({
                ...stats,
                totalActions: stats.totalActions + 1
            }));
        }, 800);
    }
}

// 启动应用
window.addEventListener('DOMContentLoaded', () => {
    window.app = new GameEngine();
});
