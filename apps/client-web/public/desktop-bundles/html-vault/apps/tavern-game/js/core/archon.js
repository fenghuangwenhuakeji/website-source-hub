import { dbManager } from './db_manager.js';
import { narrativeEngine } from '../systems/narrative_engine.js';
import { characterSystem } from '../systems/character_system.js';
import { inventorySystem } from '../systems/inventory_system.js';
import { metaSystem } from '../systems/meta_system.js';
import { renderer } from '../ui/renderer.js';
import { defaultScripts } from '../../data/scripts_library.js';

class Archon {
    async init() {
        await dbManager.init();
        await inventorySystem.init();
        await metaSystem.init();
        renderer.init();
        
        this.bindGlobalEvents();
        this.renderScriptGrid();
        
        console.log('WriterCenterArchon Initialized');
    }

    bindGlobalEvents() {
        // 将核心方法暴露给 window 以便 HTML onclick 调用 (为了兼容旧式写法)
        window.app = this;
        window.switchView = this.switchView.bind(this);
    }

    async renderScriptGrid() {
        let scripts = await dbManager.getAll('scripts');
        if (scripts.length === 0) {
            for (const s of defaultScripts) await dbManager.put('scripts', s);
            scripts = defaultScripts;
        }
        
        const grid = document.getElementById('script-grid');
        if (grid) {
            grid.innerHTML = scripts.map(s => `
                <div class="script-card" onclick="window.app.startNewGame('${s.id}')">
                    <div class="script-icon">${s.icon}</div>
                    <div class="script-title">${s.name}</div>
                    <div class="script-desc">${s.desc}</div>
                </div>
            `).join('');
        }
    }

    async startNewGame(scriptId) {
        const scripts = await dbManager.getAll('scripts');
        const script = scripts.find(s => s.id === scriptId);
        if (!script) return;

        narrativeEngine.init(script);
        characterSystem.reset();
        
        this.switchView('game');
        document.getElementById('game-interface').style.display = 'block';
        document.querySelector('#view-game .card').style.display = 'none'; // Hide script selection

        try {
            await narrativeEngine.start();
            metaSystem.incrementStat('totalGames');
        } catch (e) {
            console.error(e);
            renderer.showNotification({ message: '启动失败: ' + e.message, type: 'error' });
        }
    }

    async sendAction() {
        const input = document.getElementById('user-input');
        const action = input.value.trim();
        if (!action) return;

        input.value = '';
        try {
            await narrativeEngine.processAction(action);
            metaSystem.incrementStat('totalActions');
        } catch (e) {
            renderer.showNotification({ message: '行动失败: ' + e.message, type: 'error' });
        }
    }

    switchView(view) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        const viewEl = document.getElementById(`view-${view}`);
        if (viewEl) viewEl.classList.add('active');
        
        // Update title and breadcrumb logic here if needed
    }

    // ... 其他全局方法
}

const archon = new Archon();
window.addEventListener('DOMContentLoaded', () => archon.init());