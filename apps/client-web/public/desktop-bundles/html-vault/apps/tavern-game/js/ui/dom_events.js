import { eventBus } from '../core/event_bus.js';
import { renderer } from './renderer.js';
import { showNotification } from './notifications.js';
import { dbManager } from '../core/db_manager.js';

export function initDomEvents() {
    // 视图切换
    window.switchView = (view) => {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        const targetView = document.getElementById(`view-${view}`);
        if (targetView) targetView.classList.add('active');
        
        // 简单的导航高亮逻辑，实际可能需要更精确的选择器
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
             if (item.getAttribute('onclick') && item.getAttribute('onclick').includes(`'${view}'`)) {
                 item.classList.add('active');
             }
        });

        // 更新标题
        const titleMap = {
            game: '游戏大厅', character: '角色面板', inventory: '背包系统',
            skills: '技能树', achievements: '成就系统', api: 'API设置'
        };
        if (titleMap[view]) document.getElementById('view-title').textContent = titleMap[view];
        
        // 触发视图加载事件
        eventBus.emit('view:changed', view);
    };

    // 剧本点击委托
    const scriptGrid = document.getElementById('script-grid');
    if (scriptGrid) {
        scriptGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.script-card');
            if (card) {
                const id = card.dataset.id;
                eventBus.emit('script:selected', id);
            }
        });
    }

    // 输入框回车
    const input = document.getElementById('user-input');
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const text = input.value.trim();
                if (text) {
                    eventBus.emit('input:submit', text);
                    input.value = '';
                }
            }
        });
    }

    // 发送按钮
    window.sendAction = () => {
        const input = document.getElementById('user-input');
        const text = input.value.trim();
        if (text) {
            eventBus.emit('input:submit', text);
            input.value = '';
        }
    };

    // 快捷按钮
    window.quickAction = (action) => {
        eventBus.emit('input:submit', action);
    };

    // 监听事件总线更新 UI
    eventBus.on('story:log', (entry) => renderer.renderStoryLog(entry));
    eventBus.on('character:update', (stats) => renderer.updateCharacterStats(stats));
    eventBus.on('inventory:update', (items) => renderer.renderInventory(items));
    eventBus.on('achievements:update', (list) => renderer.renderAchievements(list));
    eventBus.on('notification', (data) => showNotification(data.message, data.type));

    // API 设置相关
    window.saveApiConfig = async () => {
        const config = {
            config_name: document.getElementById('api-name').value.trim(),
            provider: document.getElementById('api-provider').value,
            api_key: document.getElementById('api-key').value.trim(),
            base_url: document.getElementById('api-url').value.trim(),
            model_name: document.getElementById('api-model').value.trim(),
            is_active: 1 // 默认激活
        };
        if (!config.api_key) return showNotification('请输入API Key', 'error');
        
        await dbManager.put('api_pool', config);
        showNotification('API配置已保存', 'success');
        // 刷新列表逻辑略
    };
    
    window.addApiConfig = () => {
        document.getElementById('api-modal').classList.add('active');
    }
    
    window.closeModal = (id) => {
        document.getElementById(id).classList.remove('active');
    }

    window.newGame = () => {
        eventBus.emit('game:new');
    }
}