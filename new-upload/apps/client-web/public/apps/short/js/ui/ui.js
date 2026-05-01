import { eventBus } from '../core/eventBus.js';

export class UIManager {
    constructor() {
        this.initEventListeners();
    }

    initEventListeners() {
        // 视图切换
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const viewId = e.currentTarget.getAttribute('data-view');
                if (viewId) this.switchView(viewId);
            });
        });

        // Tab切换
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.currentTarget.getAttribute('data-tab');
                if (tabId) this.switchTab(e.currentTarget, tabId);
            });
        });

        // 模态框关闭
        window.closeModal = (id) => document.getElementById(id).classList.remove('active');
    }

    switchView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        const view = document.getElementById('view-' + viewId);
        const nav = document.querySelector(`.nav-item[data-view="${viewId}"]`);
        
        if (view) view.classList.add('active');
        if (nav) nav.classList.add('active');
        
        const titles = { fusion: '智能融合', shortStory: '短篇写作', library: '图书馆', api: 'API设置' };
        const titleEl = document.getElementById('current-view');
        if (titleEl) titleEl.textContent = titles[viewId] || 'StoryForge';
    }

    switchTab(tabElement, tabContentId) {
        const container = tabElement.closest('.card') || document.body;
        container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        tabElement.classList.add('active');
        const content = document.getElementById(tabContentId);
        if (content) content.classList.add('active');
    }

    showNotification(msg, type = 'info') {
        const n = document.createElement('div');
        n.className = `notification ${type}`;
        n.textContent = msg;
        document.body.appendChild(n);
        setTimeout(() => n.remove(), 3000);
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('active');
    }

    updateIOMonitor(monitorId, content, type = 'input') {
        const monitor = document.getElementById(monitorId);
        if (!monitor) return;

        const timestamp = new Date().toLocaleTimeString();
        const itemClass = type === 'input' ? 'input-item' : 'output-item';
        const item = document.createElement('div');
        item.className = `io-item ${itemClass}`;
        
        let displayContent = content.length > 500 ? content.substring(0, 500) + '...' : content;
        
        item.innerHTML = `
            <div class="io-item-header">[${timestamp}] ${type === 'input' ? '用户输入' : 'AI输出'} (${content.length} 字符)</div>
            <div class="io-item-content">${displayContent.replace(/</g, '&lt;')}</div>
        `;
        
        if (monitor.textContent.trim() === '等待输入...' || monitor.textContent.trim() === '等待输出...') {
            monitor.innerHTML = '';
        }
        
        monitor.appendChild(item);
        monitor.scrollTop = monitor.scrollHeight;
    }

    clearIOMonitor(monitorId) {
        const monitor = document.getElementById(monitorId);
        if (!monitor) return;
        monitor.innerHTML = monitorId.includes('input') ? '等待输入...' : '等待输出...';
    }
}