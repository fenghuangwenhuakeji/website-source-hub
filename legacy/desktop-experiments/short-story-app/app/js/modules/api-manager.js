import { dbGetAll, dbPut, dbDelete } from '../core/db.js';
import { showNotification, openModal, closeModal } from '../ui/ui-manager.js';
import { callAPI } from '../core/api.js';

export async function loadApiPool() {
    const configs = await dbGetAll('api_pool');
    const container = document.getElementById('api-pool-container');
    if (configs.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--text-secondary);">🔧 暂无API配置</div>';
    } else {
        container.innerHTML = configs.map(c => `
            <div class="book-card ${c.is_active ? 'active' : ''}" onclick="window.app.setActiveApi(${c.id})">
                <div class="book-icon">🔌</div>
                <div class="book-title">${c.config_name}</div>
                <div class="book-meta">${c.provider} - ${c.model_name}</div>
                <div class="book-meta">${c.is_active ? '✅ 激活中' : '待激活'}</div>
                <div class="book-actions">
                    <button class="book-btn" onclick="event.stopPropagation(); window.app.editApiConfig(${c.id})">编辑</button>
                    <button class="book-btn" onclick="event.stopPropagation(); window.app.deleteApiConfig(${c.id})">删除</button>
                </div>
            </div>
        `).join('');
    }
}

export function addApiConfig() {
    document.getElementById('api-modal-title').textContent = '添加API配置';
    document.getElementById('api-config-name').value = '';
    document.getElementById('api-provider').value = 'gemini';
    document.getElementById('api-config-key').value = '';
    document.getElementById('api-config-url').value = '';
    document.getElementById('api-config-model').value = '';
    openModal('api-modal');
    document.getElementById('api-modal').dataset.id = '';
}

export async function editApiConfig(id) {
    const configs = await dbGetAll('api_pool');
    const config = configs.find(c => c.id === id);
    if (!config) return;
    
    document.getElementById('api-modal-title').textContent = '编辑API配置';
    document.getElementById('api-config-name').value = config.config_name;
    document.getElementById('api-provider').value = config.provider;
    document.getElementById('api-config-key').value = config.api_key;
    document.getElementById('api-config-url').value = config.base_url;
    document.getElementById('api-config-model').value = config.model_name;
    openModal('api-modal');
    document.getElementById('api-modal').dataset.id = id;
}

export async function saveApiConfig() {
    const id = document.getElementById('api-modal').dataset.id;
    const config = {
        config_name: document.getElementById('api-config-name').value.trim(),
        provider: document.getElementById('api-provider').value,
        api_key: document.getElementById('api-config-key').value.trim(),
        base_url: document.getElementById('api-config-url').value.trim(),
        model_name: document.getElementById('api-config-model').value.trim(),
        is_active: 0
    };
    
    if (!config.config_name) {
        showNotification('请输入配置名称', 'error');
        return;
    }
    
    if (id) {
        config.id = parseInt(id);
        const configs = await dbGetAll('api_pool');
        const old = configs.find(c => c.id === config.id);
        config.is_active = old ? old.is_active : 0;
    }
    
    await dbPut('api_pool', config);
    await loadApiPool();
    closeModal('api-modal');
    showNotification(id ? 'API配置已更新' : 'API配置已添加', 'success');
}

export async function deleteApiConfig(id) {
    if (!confirm('确定删除此API配置?')) return;
    await dbDelete('api_pool', id);
    await loadApiPool();
    showNotification('已删除', 'success');
}

export async function setActiveApi(id) {
    const configs = await dbGetAll('api_pool');
    for (const c of configs) {
        c.is_active = c.id === id ? 1 : 0;
        await dbPut('api_pool', c);
    }
    await loadApiPool();
    showNotification('已激活', 'success');
}

export async function testApiConfig() {
    const config = {
        provider: document.getElementById('api-provider').value,
        api_key: document.getElementById('api-config-key').value.trim(),
        base_url: document.getElementById('api-config-url').value.trim(),
        model_name: document.getElementById('api-config-model').value.trim()
    };
    
    if (!config.api_key && config.provider !== 'ollama') {
        showNotification('请输入API Key', 'error');
        return;
    }
    
    showNotification('正在测试连接...', 'info');
    
    try {
        const response = await callAPI('你好', config);
        const preview = response.substring(0, 100) + (response.length > 100 ? '...' : '');
        alert(`✅ 连接成功！\n\n模型回复:\n${preview}`);
        showNotification('连接成功', 'success');
    } catch (e) {
        alert(`❌ 连接失败\n\n错误信息:\n${e.message}`);
        showNotification('连接失败', 'error');
    }
}

export function closeApiModal() {
    closeModal('api-modal');
}equest(config, '你好', false);
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            
            ui.showNotification('连接成功', 'success');
            alert('✅ 连接成功！');
        } catch (e) {
            ui.showNotification('连接失败', 'error');
            alert(`❌ 连接失败: ${e.message}`);
        }
    }
}

export const apiManager = new ApiManager();