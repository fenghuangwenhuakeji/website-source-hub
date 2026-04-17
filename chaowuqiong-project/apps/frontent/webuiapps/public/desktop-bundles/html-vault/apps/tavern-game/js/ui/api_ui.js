import { dbGetAll, dbPut, dbDelete } from '../core/db.js';
import { renderApiPool } from './render.js';
import { checkAchievement } from '../game/game.js';
import { showNotification, closeModal, openModal } from '../utils.js';
import { buildRequest } from '../core/api.js';

export function addApiConfig() {
    document.getElementById('api-modal-title').textContent = '添加API配置';
    document.getElementById('api-name').value = '';
    document.getElementById('api-provider').value = 'gemini';
    document.getElementById('api-key').value = '';
    document.getElementById('api-url').value = '';
    document.getElementById('api-model').value = '';
    openModal('api-modal');
    document.getElementById('api-modal').dataset.id = '';
}

export async function editApiConfig(id) {
    const configs = await dbGetAll('api_pool');
    const config = configs.find(c => c.id === id);
    if (!config) return;
    
    document.getElementById('api-modal-title').textContent = '编辑API配置';
    document.getElementById('api-name').value = config.config_name;
    document.getElementById('api-provider').value = config.provider;
    document.getElementById('api-key').value = config.api_key;
    document.getElementById('api-url').value = config.base_url;
    document.getElementById('api-model').value = config.model_name;
    openModal('api-modal');
    document.getElementById('api-modal').dataset.id = id;
}

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
        const configs = await dbGetAll('api_pool');
        const old = configs.find(c => c.id === config.id);
        config.is_active = old ? old.is_active : 0;
    }
    
    await dbPut('api_pool', config);
    await renderApiPool();
    await checkAchievement('api_1', (await dbGetAll('api_pool')).length);
    await checkAchievement('api_5', (await dbGetAll('api_pool')).length);
    closeModal('api-modal');
    showNotification(id ? 'API配置已更新' : 'API配置已添加', 'success');
}

export async function deleteApiConfig(id) {
    if (!confirm('确定删除此API配置?')) return;
    await dbDelete('api_pool', id);
    await renderApiPool();
    showNotification('已删除', 'success');
}

export async function setActiveApi(id) {
    const configs = await dbGetAll('api_pool');
    for (const c of configs) {
        c.is_active = c.id === id ? 1 : 0;
        await dbPut('api_pool', c);
    }
    await renderApiPool();
    showNotification('已激活', 'success');
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
        const { url, headers, body } = buildRequest(config, '你好');
        const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        if (!response.ok) throw new Error(`API错误 ${response.status}`);
        const data = await response.json();
        // 简单解析，仅用于测试连接是否通畅
        alert('✅ 连接成功！API响应正常。');
        showNotification('连接成功', 'success');
    } catch (e) {
        alert(`❌ 连接失败\n\n错误信息:\n${e.message}`);
        showNotification('连接失败', 'error');
    }
}