import { eventBus } from '../core/event_bus.js';

export const renderer = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        eventBus.on('story-updated', this.renderStoryEntry.bind(this));
        eventBus.on('character-updated', this.renderCharacterPanel.bind(this));
        eventBus.on('inventory-updated', this.renderInventory.bind(this));
        eventBus.on('achievements-updated', this.renderAchievements.bind(this));
        eventBus.on('notification', this.showNotification.bind(this));
    },

    renderStoryEntry({ role, content }) {
        const container = document.getElementById('story-content');
        if (!container) return;
        
        const entry = document.createElement('div');
        const type = role === 'user' ? 'user' : (role === 'system' ? 'system' : 'ai');
        entry.className = `story-entry ${type}`;
        
        const labels = { user: '🎮 玩家', ai: '🤖 AI', system: '⚙️ 系统' };
        const time = new Date().toLocaleTimeString();
        
        entry.innerHTML = `
            <div class="story-label">${labels[type]}</div>
            <div class="story-text">${content}</div>
            <div class="story-timestamp">${time}</div>
        `;
        
        container.appendChild(entry);
        container.scrollTop = container.scrollHeight;
    },

    renderCharacterPanel(stats) {
        // 简化版更新，实际可细化为局部更新
        const updateText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        const updateBar = (id, cur, max) => { 
            const el = document.getElementById(id); 
            if (el) el.style.width = `${(cur / max) * 100}%`; 
        };

        updateText('char-level', `等级 ${stats.level}`);
        updateText('hp-text', `${stats.hp}/${stats.maxHp}`);
        updateBar('hp-bar', stats.hp, stats.maxHp);
        updateText('mp-text', `${stats.mp}/${stats.maxMp}`);
        updateBar('mp-bar', stats.mp, stats.maxMp);
        // ... 其他属性
    },

    renderInventory(items) {
        const grid = document.getElementById('inventory-grid');
        if (!grid) return;
        
        const slots = Array(50).fill(null);
        items.forEach((item, i) => { if (i < 50) slots[i] = item; });
        
        grid.innerHTML = slots.map((item, i) => `
            <div class="inventory-slot ${item ? 'filled' : ''}" onclick="window.app.useItem(${i})">
                ${item ? `
                    <div class="item-rarity ${item.rarity || 'common'}"></div>
                    <div class="item-icon">${item.icon}</div>
                    <div class="item-count">${item.count || 1}</div>
                ` : ''}
            </div>
        `).join('');
    },

    renderAchievements(achievements) {
        const list = document.getElementById('achievement-list');
        if (!list) return;
        
        list.innerHTML = achievements.map(a => `
            <div class="achievement-item ${a.unlocked ? 'unlocked' : ''}">
                <div class="achievement-icon">${a.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-title">${a.name}</div>
                    <div class="achievement-desc">${a.desc}</div>
                    <div class="achievement-progress">${a.unlocked ? '✅ 已解锁' : `进度: ${a.progress}/${a.max}`}</div>
                </div>
                <div class="achievement-reward">${a.reward}</div>
            </div>
        `).join('');
    },

    showNotification({ message, type }) {
        const notif = document.createElement('div');
        notif.className = `notification ${type}`;
        const lines = message.split('\n');
        if (lines.length > 1) {
            notif.innerHTML = `<div class="notification-title">${lines[0]}</div><div class="notification-message">${lines.slice(1).join('<br>')}</div>`;
        } else {
            notif.innerHTML = `<div class="notification-title">${message}</div>`;
        }
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    }
};