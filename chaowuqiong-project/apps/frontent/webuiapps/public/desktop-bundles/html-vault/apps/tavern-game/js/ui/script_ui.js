import { dbGetAll, dbPut } from '../core/db.js';
import { renderScriptGrid } from './render.js';
import { checkAchievement, updateBadges } from '../game/game.js';
import { showNotification, closeModal, openModal } from '../utils.js';

export function createScript() {
    document.getElementById('script-name').value = '';
    document.getElementById('script-icon').value = '';
    document.getElementById('script-desc').value = '';
    document.getElementById('script-tags').value = '';
    document.getElementById('script-prompt').value = '';
    openModal('script-modal');
}

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
    
    await dbPut('scripts', script);
    await renderScriptGrid();
    await checkAchievement('script_1', (await dbGetAll('scripts')).filter(s => s.id.startsWith('custom_')).length);
    await checkAchievement('script_5', (await dbGetAll('scripts')).filter(s => s.id.startsWith('custom_')).length);
    closeModal('script-modal');
    showNotification('剧本已创建', 'success');
    updateBadges();
}

export function filterScripts(type) {
    showNotification(`筛选: ${type}`, 'success');
    // 这里可以实现真正的筛选逻辑
}