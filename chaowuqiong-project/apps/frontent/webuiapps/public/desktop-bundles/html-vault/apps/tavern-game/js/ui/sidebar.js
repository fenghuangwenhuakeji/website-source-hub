import { store } from '../core/state.js';

export class SidebarUI {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.initListeners();
    }

    initListeners() {
        // 绑定导航点击事件
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // 移除 active 类
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                // 添加 active 类
                e.currentTarget.classList.add('active');
                
                // 获取 view 名称
                const viewName = e.currentTarget.dataset.view;
                if (viewName) {
                    this.switchView(viewName);
                }
            });
        });
    }

    switchView(viewName) {
        console.log(`Switching to view: ${viewName}`);
        
        // 隐藏所有视图
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        
        // 映射视图 ID
        // 导航项的 viewName 可能与实际 DOM ID 不完全一致，做个映射
        // 比如点击“游戏大厅(game)”显示的是列表页(view-game)
        // 点击列表项进入游戏后，显示的是游戏页(view-play)
        let targetId = `view-${viewName}`;
        
        // 特殊处理：如果点击的是 nav 里的 game，我们通常想回到大厅
        if (viewName === 'game') targetId = 'view-game';
        
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
            targetEl.classList.add('active');
            
            // 更新顶部标题
            const titleMap = {
                'game': { icon: '🎮', text: '游戏大厅' },
                'play': { icon: '🎮', text: '正在游戏' },
                'character': { icon: '👤', text: '角色面板' },
                'inventory': { icon: '🎒', text: '背包系统' },
                'skills': { icon: '⚡', text: '技能树' },
                'achievements': { icon: '🏆', text: '成就系统' },
                'quests': { icon: '📋', text: '任务系统' },
                'settings': { icon: '⚙️', text: '系统设置' }
            };
            
            if (titleMap[viewName]) {
                const iconEl = document.getElementById('page-icon');
                const titleEl = document.getElementById('page-title');
                if(iconEl) iconEl.textContent = titleMap[viewName].icon;
                if(titleEl) titleEl.textContent = titleMap[viewName].text;
            }
        } else {
             console.warn(`View ${targetId} not found`);
        }
    }
}
