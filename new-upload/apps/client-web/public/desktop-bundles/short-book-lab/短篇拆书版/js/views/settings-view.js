const settingsView = {
    async init() { await this.renderApiList(); },

    async renderApiList() {
        const configs = await db.getAll('api_pool');
        const container = document.getElementById('api-pool-container');
        if (!container) return;
        if (configs.length === 0) {
            container.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--text-secondary);">🔧 暂无API配置</div>';
        } else {
            container.innerHTML = configs.map(c => `
                <div class="book-card ${c.is_active ? 'active' : ''}" onclick="app.setActiveApi(${c.id})">
                    <div class="book-icon">🔌</div>
                    <div class="book-title">${c.config_name}</div>
                    <div class="book-meta">${c.provider} - ${c.model_name}</div>
                    <div class="book-meta">${c.is_active ? '✅ 激活中' : '待激活'}</div>
                    <div class="book-actions">
                        <button class="book-btn" onclick="event.stopPropagation(); app.editApiConfig(${c.id})">编辑</button>
                        <button class="book-btn" onclick="event.stopPropagation(); app.deleteApiConfig(${c.id})">删除</button>
                    </div>
                </div>`).join('');
        }
    },

    openAddModal() {
        document.getElementById('api-modal-title').textContent = '添加API配置';
        ['api-config-name','api-config-key','api-config-url','api-config-model'].forEach(id => document.getElementById(id).value = '');
        document.getElementById('api-provider').value = 'gemini';
        document.getElementById('api-modal').dataset.id = '';
        uiManager.showModal('api-modal');
    },

    async editConfig(id) {
        const configs = await db.getAll('api_pool');
        const c = configs.find(c => c.id === id);
        if (!c) return;
        document.getElementById('api-modal-title').textContent = '编辑API配置';
        document.getElementById('api-config-name').value = c.config_name;
        document.getElementById('api-provider').value = c.provider;
        document.getElementById('api-config-key').value = c.api_key;
        document.getElementById('api-config-url').value = c.base_url;
        document.getElementById('api-config-model').value = c.model_name;
        document.getElementById('api-modal').dataset.id = id;
        uiManager.showModal('api-modal');
    },

    async saveConfig() {
        const id = document.getElementById('api-modal').dataset.id;
        const config = {
            config_name: document.getElementById('api-config-name').value.trim(),
            provider: document.getElementById('api-provider').value,
            api_key: document.getElementById('api-config-key').value.trim(),
            base_url: document.getElementById('api-config-url').value.trim(),
            model_name: document.getElementById('api-config-model').value.trim(),
            is_active: 0
        };
        if (!config.config_name) return showNotification('请输入配置名称', 'error');
        if (id) {
            config.id = parseInt(id);
            const configs = await db.getAll('api_pool');
            const old = configs.find(c => c.id === config.id);
            config.is_active = old ? old.is_active : 0;
        }
        await db.put('api_pool', config);
        await this.renderApiList();
        uiManager.closeModal('api-modal');
        showNotification(id ? '配置已更新' : '配置已添加', 'success');
    },

    async setActive(id) {
        const configs = await db.getAll('api_pool');
        for (const c of configs) { c.is_active = c.id === id ? 1 : 0; await db.put('api_pool', c); }
        await this.renderApiList();
        showNotification('已激活', 'success');
    },

    async deleteConfig(id) {
        if (!confirm('确定删除?')) return;
        await db.delete('api_pool', id);
        await this.renderApiList();
        showNotification('已删除', 'success');
    },

    async testConnection() {
        const config = {
            provider: document.getElementById('api-provider').value,
            api_key: document.getElementById('api-config-key').value.trim(),
            base_url: document.getElementById('api-config-url').value.trim(),
            model_name: document.getElementById('api-config-model').value.trim()
        };
        if (!config.api_key) return showNotification('请输入API Key', 'error');
        showNotification('正在测试...', 'info');
        try {
            const response = await apiClient.call('你好', config);
            alert('✅ 连接成功！\n\n回复: ' + response.substring(0, 50) + '...');
            showNotification('连接成功', 'success');
        } catch (e) {
            alert('❌ 连接失败\n\n' + e.message);
            showNotification('连接失败', 'error');
        }
    }
};
