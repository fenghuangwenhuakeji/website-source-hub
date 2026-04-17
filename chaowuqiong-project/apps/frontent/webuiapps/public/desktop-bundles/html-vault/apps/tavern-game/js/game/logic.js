import { state, resetGame } from '../core/state.js';
import { dbPut, dbGetAll, dbDelete } from '../core/db.js';
import { callAPI, getActiveApi } from '../core/api.js';
import { showNotification } from '../ui/utils.js';
import { addStoryEntry, updateStatusPanel, renderScriptGrid, updateBadges, renderSkills, renderInventory, renderAchievements, renderStats } from '../ui/render.js';

// 成就系统
export async function checkAchievement(id, progress) {
    const ach = state.achievements.find(a => a.id === id);
    if (!ach || ach.unlocked) return;
    
    ach.progress = progress;
    if (ach.progress >= ach.max) {
        ach.unlocked = true;
        await dbPut('achievements', ach);
        showNotification(`🏆 成就解锁: ${ach.name}\n奖励: ${ach.reward}`, 'success');
        updateBadges();
    }
}

// 游戏流程
export async function startGame() {
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

export async function newGame() {
    if (!state.currentScript) { showNotification('请先选择剧本', 'error'); return; }
    const apiConfig = await getActiveApi();
    if (!apiConfig) { showNotification('请先配置并激活API', 'error'); window.switchView('api'); return; }
    
    resetGame();
    
    document.getElementById('game-interface').style.display = 'block';
    document.querySelector('.card').style.display = 'none';
    
    await checkAchievement('first_game', 1);
    state.gameStats.totalGames++;
    await dbPut('stats', { id: 1, ...state.gameStats });
    await startGame();
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
    await checkAchievement('actions_100', state.gameStats.totalActions);
    await checkAchievement('actions_500', state.gameStats.totalActions);
    await checkAchievement('long_game_20', state.gameHistory.length);
    await checkAchievement('long_game_50', state.gameHistory.length);
    await checkAchievement('long_game_100', state.gameHistory.length);
    
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
    await dbPut('saves', save);
    await checkAchievement('save_5', (await dbGetAll('saves')).length);
    await checkAchievement('save_10', (await dbGetAll('saves')).length);
}

export async function loadSave(id) {
    const saves = await dbGetAll('saves');
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
    window.switchView('game');
}

export async function deleteSave(id) {
    if (!confirm('确定删除此存档?')) return;
    await dbDelete('saves', id);
    window.switchView('saves'); // Refresh view
    showNotification('存档已删除', 'success');
}

export async function selectScript(id) {
    const scripts = await dbGetAll('scripts');
    state.currentScript = scripts.find(s => s.id === id);
    renderScriptGrid();
}

export async function unlockSkill(id) {
    const skill = state.skills.find(s => s.id === id);
    if (!skill || skill.unlocked) return;
    
    // 这里可以添加技能点检查逻辑
    skill.unlocked = true;
    await dbPut('skills', skill);
    await renderSkills();
    showNotification(`⚡ 技能解锁: ${skill.name}`, 'success');
}

export function useItem(index) {
    const item = state.inventory[index];
    if (!item) return;
    showNotification(`使用了 ${item.name}`, 'success');
}

export function quickAction(action) {
    document.getElementById('user-input').value = action;
    sendAction();
}