export class UIManager {
    constructor() {}
    
    bindEvents(engine) {
        window.switchView = (v) => this.switchView(v);
        window.selectScript = (id) => engine.startNewGame(id);
        window.sendAction = () => engine.sendAction(document.getElementById('user-input').value);
        // 更多绑定...
    }

    switchView(view) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const el = document.getElementById(`view-${view}`);
        if(el) el.classList.add('active');
        // 更新面包屑等...
    }

    addStoryEntry(type, text) {
        const content = document.getElementById('story-content');
        const entry = document.createElement('div');
        entry.className = `story-entry ${type}`;
        entry.innerHTML = `<div class="story-label">${type.toUpperCase()}</div><div class="story-text">${text}</div>`;
        content.appendChild(entry);
        content.scrollTop = content.scrollHeight;
    }

    renderScripts(scripts) {
        const grid = document.getElementById('script-grid');
        if(!grid) return;
        grid.innerHTML = scripts.map(s => `
            <div class="script-card" onclick="selectScript('${s.id}')">
                <div class="script-icon">${s.icon}</div>
                <div class="script-title">${s.name}</div>
                <div class="script-desc">${s.desc}</div>
            </div>
        `).join('');
    }

    showGameInterface() {
        document.getElementById('game-interface').style.display = 'block';
        document.querySelector('.card').style.display = 'none';
    }
    
    updateStatusPanel(text) {
        // 简单正则提取状态更新UI
        const panel = document.getElementById('dynamic-status');
        if(panel) panel.innerText = '状态已更新';
    }

    updateBadges(scripts, achievements, inventory) {
        const sc = document.getElementById('script-count');
        if(sc) sc.textContent = scripts.length;
    }
}