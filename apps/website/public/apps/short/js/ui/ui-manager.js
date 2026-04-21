import { showNotification } from './notification.js';

export class UIManager {
    constructor() {
        this.bindGlobalEvents();
    }

    bindGlobalEvents() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                if (view) this.switchView(view);
            });
        });

        // Tabs
        document.querySelectorAll('.tab').forEach(item => {
            item.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                if (tab) this.switchTab(tab, e.currentTarget);
            });
        });

        // Modal Close Buttons
        document.querySelectorAll('.modal .btn').forEach(btn => {
            if (btn.id && (btn.id.includes('close') || btn.id.includes('cancel'))) {
                btn.addEventListener('click', (e) => {
                    e.target.closest('.modal').classList.remove('active');
                });
            }
        });
    }

    switchView(view) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        const viewEl = document.getElementById('view-' + view);
        const navEl = document.querySelector(`.nav-item[data-view="${view}"]`);
        
        if (viewEl) viewEl.classList.add('active');
        if (navEl) navEl.classList.add('active');
        
        const titles = { fusion: '智能融合', shortStory: '短篇写作', library: '图书馆', api: 'API设置' };
        const titleEl = document.getElementById('current-view-title');
        if (titleEl) titleEl.textContent = titles[view] || 'StoryForge';
    }

    switchTab(tab, tabElement) {
        const container = tabElement.closest('.card') || document;
        container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        tabElement.classList.add('active');
        const contentEl = document.getElementById('tab-' + tab);
        if (contentEl) contentEl.classList.add('active');
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }
    
    updateIOMonitor(monitorId, content, type = 'input') {
        const monitor = document.getElementById(monitorId);
        if (!monitor) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const itemClass = type === 'input' ? 'input-item' : 'output-item';
        const item = document.createElement('div');
        item.className = `io-item ${itemClass}`;
        
        let displayContent = content;
        if (content.length > 500) {
            displayContent = content.substring(0, 500) + '...';
        }
        
        item.innerHTML = `
            <div class="io-item-header">[${timestamp}] ${type === 'input' ? '用户输入' : 'AI输出'} (${content.length} 字符)</div>
            <div class="io-item-content">${displayContent}</div>
        `;
        
        if (monitor.textContent === '等待输入...' || monitor.textContent === '等待输出...') {
            monitor.innerHTML = '';
        }
        
        monitor.appendChild(item);
        monitor.scrollTop = monitor.scrollHeight;
    }
    
    clearIOMonitor(monitorId) {
        const monitor = document.getElementById(monitorId);
        if (!monitor) return;
        if (monitorId.includes('input-monitor')) {
            monitor.innerHTML = '等待输入...';
        } else {
            monitor.innerHTML = '等待输出...';
        }
    }
}