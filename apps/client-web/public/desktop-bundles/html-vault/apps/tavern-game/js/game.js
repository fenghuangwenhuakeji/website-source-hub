import { state, resetGameState } from './core/state.js';
import { DB } from './core/db.js';
import { getActiveApi, callAPI } from './core/api.js';
import { showNotification } from './utils.js';
import { addStoryEntry, updateStatusPanel, renderScriptGrid, updateBadges, renderApiPool, renderSaves, renderSkills } from './ui/render.js';
import { switchView } from './ui/view.js';

export async function selectScript(id) {
    const scripts = await DB.getAll('scripts');
    state.currentScript = scripts.find(s => s.id === id);
    renderScriptGrid();
}

export async function newGame() {
    if (!state.currentScript) { showNotification('请先选择剧本', 'error'); return; }
    const apiConfig = await getActiveApi();
    if (!apiConfig) { showNotification('请先配置并激活API', 'error'); switchView('api'); return; }
    
    resetGameState();
    
    document.getElementById('game-interface').style.display = 'block';
    document.querySelector('.card').style.display = 'none';
    
    await checkAchievement('first_game', 1);
    state.gameStats.totalGames++;
    await DB.put('stats', { id: 1, ...state.gameStats });
    await startGame();
}

async function startGame() {
    const storyContent = document.getElementById('story-content');
    storyContent.innerHTML = '';
    addStoryEntry('system', '🎮 游戏开始，正在初始化世界...');
    
    try {
        const response = await callAPI(state.currentScript.prompt);
        addStoryEntry('ai', response);
        updateStatusPanel(response);
    } catch (e) {
        addStoryEntry('system', '❌ 错误: ' + e.message);
    }
}

export async function sendAction() {
    const input = document.getElementById('user-input');
    const action = input.value.trim();
    if (!action) return;
    
    addStoryEntry('user', action);
    input.value = '';
    state.gameHistory.push({ role: 'user', content: action });
    
    state.gameStats.totalActions++;
    await checkAchievement('actions_10', state.gameStats.totalActions);
    await checkAchievement('actions_50', state.gameStats.totalActions);
    
    try {
        const context = state.gameHistory.slice(-10).map(h => `${h.role}: ${h.content}`).join('\n\n');
        const response = await callAPI(context + '\n\n' + action);
        addStoryEntry('ai', response);
        state.gameHistory.push({ role: 'assistant', content: response });
        updateStatusPanel(response);
        await autoSave();
    } catch (e) {
        addStoryEntry('system', '❌ 错误: ' + e.message);
    }
}

export function quickAction(action) {
    document.getElementById('user-input').value = action;
    sendAction();
}

export async function autoSave() {
    if (!state.currentScript || state.gameHistory.length === 0) return;
    const save = {
        script_name: state.currentScript.name,
        script: state.currentScript,
        history: state.gameHistory,
        playerStats: state.playerStats,
        inventory: state.inventory,
        turns: state.gameHistory.length,
        timestamp: Date.now()
    };
    await DB.put('saves', save);
    await checkAchievement('save_5', (await DB.getAll('saves')).length);
}

export async function checkAchievement(id, progress) {
    const ach = state.achievements.find(a => a.id === id);
    if (!ach || ach.unlocked) return;
    
    ach.progress = progress;
    if (ach.progress >= ach.max) {
        ach.unlocked = true;
        await DB.put('achievements', ach);
        showNotification(`🏆 成就解锁: ${ach.name}\n奖励: ${ach.reward}`, 'success');
        updateBadges();
    }
}

// API Logic
export async function saveApiConfig() {
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
        const configs = await DB.getAll('api_pool');
        const old = configs.find(c => c.id === config.id);
        config.is_active = old ? old.is_active : 0;
    }
    
    await DB.put('api_pool', config);
    await renderApiPool();
    document.getElementById('api-modal').classList.remove('active');
    showNotification(id ? 'API配置已更新' : 'API配置已添加', 'success');
}

export async function deleteApiConfig(id) {
    if (!confirm('确定删除此API配置?')) return;
    await DB.delete('api_pool', id);
    await renderApiPool();
    showNotification('已删除', 'success');
}

export async function setActiveApi(id) {
    const configs = await DB.getAll('api_pool');
    for (const c of configs) {
        c.is_active = c.id === id ? 1 : 0;
        await DB.put('api_pool', c);
    }
    await renderApiPool();
    showNotification('已激活', 'success');
}

export async function editApiConfig(id) {
    const configs = await DB.getAll('api_pool');
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
}

export async function testApiConfig() {
    const config = {
        provider: document.getElementById('api-provider').value,
        api_key: document.getElementById('api-key').value.trim(),
        base_url: document.getElementById('api-url').value.trim(),
        model_name: document.getElementById('api-model').value.trim()
    };
    
    if (!config.api_key) { showNotification('请输入API Key', 'error'); return; }
    showNotification('正在测试连接...', 'success');
    
    try {
        // 临时构造一个请求，这里简单复用 api.js 逻辑不太容易，因为 callAPI 依赖 DB。
        // 简单起见，这里直接 fetch，逻辑类似 api.js
        let url, headers = { 'Content-Type': 'application/json' }, body;
        const prompt = '你好';
        
        if (config.provider === 'gemini') {
            url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model_name || 'gemini-1.5-flash'}:generateContent?key=${config.api_key}`;
            body = { contents: [{ parts: [{ text: prompt }] }] };
        } else if (config.provider === 'claude') {
            url = `${config.base_url || 'https://api.anthropic.com'}/v1/messages`;
            headers['x-api-key'] = config.api_key;
            headers['anthropic-version'] = '2023-06-01';
            body = { model: config.model_name, max_tokens: 100, messages: [{ role: 'user', content: prompt }] };
        } else {
            url = `${config.base_url}/chat/completions`;
            if (config.api_key) headers['Authorization'] = `Bearer ${config.api_key}`;
            body = { model: config.model_name, messages: [{ role: 'user', content: prompt }] };
        }

        const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        if (!response.ok) throw new Error(`API错误 ${response.status}`);
        const data = await response.json();
        
        let result = '';
        if (config.provider === 'gemini') result = data.candidates[0].content.parts[0].text;
        else if (config.provider === 'claude') result = data.content[0].text;
        else result = data.choices[0].message.content;

        alert(`✅ 连接成功！\n\n模型回复:\n${result.substring(0, 100)}...`);
        showNotification('连接成功', 'success');
    } catch (e) {
        alert(`❌ 连接失败\n\n错误信息:\n${e.message}`);
        showNotification('连接失败', 'error');
    }
}

// Script Management
export async function saveScript() {
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
    
    await DB.put('scripts', script);
    await renderScriptGrid();
    document.getElementById('script-modal').classList.remove('active');
    showNotification('剧本已创建', 'success');
    updateBadges();
}

// Save Management
export async function loadSave(id) {
    const saves = await DB.getAll('saves');
    const save = saves.find(s => s.id === id);
    if (!save) return;
    
    state.currentScript = save.script;
    state.gameHistory = save.history;
    state.playerStats = save.playerStats;
    state.inventory = save.inventory;
    
    document.getElementById('game-interface').style.display = 'block';
    document.querySelector('.card').style.display = 'none';
    
    const storyContent = document.getElementById('story-content');
    storyContent.innerHTML = '';
    state.gameHistory.forEach(h => addStoryEntry(h.role === 'user' ? 'user' : 'ai', h.content));
    
    showNotification('存档已加载', 'success');
    switchView('game');
}

export async function deleteSave(id) {
    if (!confirm('确定删除此存档?')) return;
    await DB.delete('saves', id);
    await renderSaves();
    showNotification('存档已删除', 'success');
}

// Export
export function exportStory() {
    const text = state.gameHistory.map(h => `${h.role === 'user' ? '玩家' : 'AI'}: ${h.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `故事_${Date.now()}.txt`;
    a.click();
    showNotification('故事已导出', 'success');
}

export function exportData() {
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
}

// Others
export function useItem(index) {
    const item = state.inventory[index];
    if (!item) return;
    showNotification(`使用了 ${item.name}`, 'success');
}

export async function unlockSkill(id) {
    const skill = state.skills.find(s => s.id === id);
    if (!skill || skill.unlocked) return;
    // 这里可以添加技能点检查逻辑
    skill.unlocked = true;
    await DB.put('skills', skill);
    await renderSkills();
    showNotification(`⚡ 技能解锁: ${skill.name}`, 'success');
}

export function filterScripts(type) {
    showNotification(`筛选: ${type}`, 'success');
}

export function createScript() {
    document.getElementById('script-name').value = '';
    document.getElementById('script-icon').value = '';
    document.getElementById('script-desc').value = '';
    document.getElementById('script-tags').value = '';
    document.getElementById('script-prompt').value = '';
    document.getElementById('script-modal').classList.add('active');
}

export function showHelp() {
    alert(`🍺 AI酒馆 - 行业TOP1旗舰版 使用指南\n\n快捷键：\n- 发送: Enter\n- 换行: Shift+Enter`);
}

export function showProfile() {
    alert('👤 用户中心\n\n功能开发中，敬请期待！');
}

export function toggleVoice() {
    showNotification('🔊 语音功能开发中', 'warning');
}

export function toggleAutoPlay() {
    showNotification('▶️ 自动播放功能开发中', 'warning');
}