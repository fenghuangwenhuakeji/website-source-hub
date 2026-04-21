import { initDB, dbGetAll, dbPut, dbDelete } from '../core/db.js';
import { state } from '../core/state.js';
import { defaultScripts, defaultAchievements, defaultSkills } from '../data/constants.js';
import { renderScriptGrid, renderInventory, renderSkills, renderAchievements, renderCharacter, renderStats, renderApiPool, renderSaves, updateBadges } from './render.js';
import { newGame, sendAction, autoSave, loadSave, deleteSave, selectScript, unlockSkill, useItem, quickAction } from '../game/logic.js';
import { showNotification, closeModal, showHelp, showProfile } from './utils.js';
import { checkAchievement } from '../game/logic.js';

// 初始化
async function init() {
    await initDB();
    await loadScripts();
    await loadAchievements();
    await loadSkills();
    await loadInventory();
    await loadStats();
    
    renderScriptGrid();
    updateBadges();
    startGameTimer();
    
    // 绑定键盘事件
    const input = document.getElementById('user-input');
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAction();
            }
        });
    }
}

async function loadScripts() {
    const saved = await dbGetAll('scripts');
    if (saved.length === 0) {
        for (const script of defaultScripts) await dbPut('scripts', script);
    }
}

async function loadAchievements() {
    const saved = await dbGetAll('achievements');
    if (saved.length === 0) {
        for (const ach of defaultAchievements) await dbPut('achievements', ach);
    }
    state.achievements = await dbGetAll('achievements');
}

async function loadSkills() {
    const saved = await dbGetAll('skills');
    if (saved.length === 0) {
        for (const skill of defaultSkills) await dbPut('skills', skill);
    }
    state.skills = await dbGetAll('skills');
}

async function loadInventory() {
    state.inventory = await dbGetAll('inventory');
}

async function loadStats() {
    const saved = await dbGetAll('stats');
    if (saved.length > 0) state.gameStats = saved[0];
}

function startGameTimer() {
    setInterval(() => {
        if (state.gameStartTime) {
            const elapsed = Math.floor((Date.now() - state.gameStartTime) / 1000);
            const h = Math.floor(elapsed / 3600).toString().padStart(2, '0');
            const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
            const s = (elapsed % 60).toString().padStart(2, '0');
            const timeEl = document.getElementById('game-time');
            if(timeEl) timeEl.textContent = `${h}:${m}:${s}`;
        }
    }, 1000);
}

// 视图切换
window.switchView = function(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const viewEl = document.getElementById(`view-${view}`);
    if(viewEl) viewEl.classList.add('active');
    
    // 简单的导航高亮逻辑，实际项目中建议用 data-target 属性
    // 这里简化处理，不强求高亮准确性，重点是功能切换
    
    const titles = {
        game: '游戏大厅', character: '角色面板', inventory: '背包系统', skills: '技能树',
        achievements: '成就系统', quests: '任务系统', leaderboard: '排行榜', scripts: '剧本库',
        saves: '存档管理', workshop: '创意工坊', stats: '数据统计', api: 'API设置', settings: '系统设置'
    };
    
    const breadcrumbs = {
        game: '首页 / 游戏大厅', character: '首页 / 角色面板', inventory: '首页 / 背包系统',
        skills: '首页 / 技能树', achievements: '首页 / 成就系统', quests: '首页 / 任务系统',
        leaderboard: '首页 / 排行榜', scripts: '首页 / 剧本库', saves: '首页 / 存档管理',
        workshop: '首页 / 创意工坊', stats: '首页 / 数据统计', api: '首页 / API设置', settings: '首页 / 系统设置'
    };
    
    document.getElementById('view-title').textContent = titles[view] || 'AI酒馆';
    document.getElementById('breadcrumb').textContent = breadcrumbs[view] || '首页';
    
    if (view === 'character') renderCharacter();
    if (view === 'inventory') renderInventory();
    if (view === 'skills') renderSkills();
    if (view === 'achievements') renderAchievements();
    if (view === 'scripts') renderScriptGrid();
    if (view === 'saves') renderSaves();
    if (view === 'stats') renderStats();
    if (view === 'api') renderApiPool();
    
    checkAchievement('explorer', 1); // 简化处理
};

// 挂载全局函数
window.newGame = newGame;
window.sendAction = sendAction;
window.autoSave = autoSave;
window.loadSave = loadSave;
window.deleteSave = deleteSave;
window.selectScript = selectScript;
window.unlockSkill = unlockSkill;
window.useItem = useItem;
window.quickAction = quickAction;
window.showNotification = showNotification;
window.closeModal = closeModal;
window.showHelp = showHelp;
window.showProfile = showProfile;

// API 相关全局函数
window.setActiveApi = async function(id) {
    const configs = await dbGetAll('api_pool');
    for (const c of configs) {
        c.is_active = c.id === id ? 1 : 0;
        await dbPut('api_pool', c);
    }
    renderApiPool();
    showNotification('已激活', 'success');
};

window.deleteApiConfig = async function(id) {
    if (!confirm('确定删除此API配置?')) return;
    await dbDelete('api_pool', id);
    renderApiPool();
    showNotification('已删除', 'success');
};

window.addApiConfig = function() {
    document.getElementById('api-modal-title').textContent = '添加API配置';
    document.getElementById('api-name').value = '';
    document.getElementById('api-provider').value = 'gemini';
    document.getElementById('api-key').value = '';
    document.getElementById('api-url').value = '';
    document.getElementById('api-model').value = '';
    document.getElementById('api-modal').classList.add('active');
    document.getElementById('api-modal').dataset.id = '';
};

window.editApiConfig = async function(id) {
    const configs = await dbGetAll('api_pool');
    const config = configs.find(c => c.id === id);
    if (!config) return;
    
    document.getElementById('api-modal-title').textContent = '编辑API配置';
    document.getElementById('api-name').value = config.config_name;
    document.getElementById('api-provider').value = config.provider;
    document.getElementById('api-key').value = config.api_key;
    document.getElementById('api-url').value = config.base_url;
    document.getElementById('api-model').value = config.model_name;
    document.getElementById('api-modal').classList.add('active');
    document.getElementById('api-modal').dataset.id = id;
};

window.saveApiConfig = async function() {
    const id = document.getElementById('api-modal').dataset.id;
    const config = {
        config_name: document.getElementById('api-name').value.trim(),
        provider: document.getElementById('api-provider').value,
        api_key: document.getElementById('api-key').value.trim(),
        base_url: document.getElementById('api-url').value.trim(),
        model_name: document.getElementById('api-model').value.trim(),
        is_active: 0
    };
    
    if (!config.config_name || !config.api_key) {
        showNotification('请填写配置名称和API Key', 'error');
        return;
    }
    
    if (id) {
        config.id = parseInt(id);
        const configs = await dbGetAll('api_pool');
        const old = configs.find(c => c.id === config.id);
        config.is_active = old ? old.is_active : 0;
    }
    
    await dbPut('api_pool', config);
    renderApiPool();
    closeModal('api-modal');
    showNotification(id ? 'API配置已更新' : 'API配置已添加', 'success');
};

// 剧本相关全局函数
window.createScript = function() {
    document.getElementById('script-name').value = '';
    document.getElementById('script-icon').value = '';
    document.getElementById('script-desc').value = '';
    document.getElementById('script-tags').value = '';
    document.getElementById('script-prompt').value = '';
    document.getElementById('script-modal').classList.add('active');
};

window.saveScript = async function() {
    const script = {
        id: 'custom_' + Date.now(),
        name: document.getElementById('script-name').value.trim(),
        icon: document.getElementById('script-icon').value.trim() || '📝',
        desc: document.getElementById('script-desc').value.trim(),
        tags: document.getElementById('script-tags').value.split(',').map(t => t.trim()).filter(t => t),
        prompt: document.getElementById('script-prompt').value.trim(),
        plays: 0
    };
    
    if (!script.name || !script.prompt) {
        showNotification('请填写剧本名称和提示词', 'error');
        return;
    }
    
    await dbPut('scripts', script);
    renderScriptGrid();
    closeModal('script-modal');
    showNotification('剧本已创建', 'success');
    updateBadges();
};

window.filterScripts = function(type) {
    showNotification(`筛选: ${type}`, 'success');
};

window.exportData = function() {
    const data = { 
        playerStats: state.playerStats, 
        inventory: state.inventory, 
        achievements: state.achievements, 
        gameStats: state.gameStats 
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `游戏数据_${Date.now()}.json`;
    a.click();
    showNotification('数据已导出', 'success');
};

window.exportStory = function() {
    const text = state.gameHistory.map(h => `${h.role === 'user' ? '玩家' : 'AI'}: ${h.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `故事_${Date.now()}.txt`;
    a.click();
    showNotification('故事已导出', 'success');
};

window.toggleVoice = function() {
    state.voiceEnabled = !state.voiceEnabled;
    showNotification(state.voiceEnabled ? '🔊 语音已开启' : '🔇 语音已关闭', 'success');
};

window.toggleAutoPlay = function() {
    state.autoPlayEnabled = !state.autoPlayEnabled;
    showNotification(state.autoPlayEnabled ? '▶️ 自动播放已开启' : '⏸️ 自动播放已关闭', 'success');
};

window.testApiConfig = async function() {
    // 简化测试逻辑，直接重用 api.js 可能会有循环依赖问题，这里简单实现
    showNotification('请先保存配置再进行测试', 'warning');
};

// 启动
init();