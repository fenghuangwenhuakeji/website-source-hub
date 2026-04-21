/**
 * LLM API 配置界面组件
 * 包含 API 配置和角色管理
 */
class LLMConfigUI {
    constructor(configManager, npcManager = null) {
        this.configManager = configManager;
        this.npcManager = npcManager;
        this.modal = null;
        this.editModal = null;
        this.npcEditModal = null;
        this.currentEditId = null;
        this.currentNpcEditId = null;
        this.currentTab = 'api'; // 'api' or 'npc'
    }

    // 设置 NPC 管理器
    setNpcManager(npcManager) {
        this.npcManager = npcManager;
    }

    // 创建配置管理弹窗
    createConfigModal() {
        // 移除已存在的弹窗
        const existing = document.getElementById('llm-config-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'llm-config-modal';
        modal.className = 'modal llm-config-modal';
        modal.innerHTML = `
            <div class="modal-content llm-config-content">
                <div class="modal-header">
                    <h3>🤖 API 配置管理</h3>
                    <button class="btn-close" id="llm-config-close">✕</button>
                </div>
                <div class="config-tabs">
                    <button class="config-tab active" data-tab="api">🔌 API 配置</button>
                    <button class="config-tab" data-tab="npc">👥 角色管理</button>
                </div>
                <div class="llm-config-body">
                    <div class="tab-content active" id="tab-api">
                        <div class="config-list" id="llm-config-list">
                            <!-- 配置列表将在这里渲染 -->
                        </div>
                        <button class="btn-add-config" id="btn-add-llm-config">
                            <span>➕</span> 添加新配置
                        </button>
                    </div>
                    <div class="tab-content" id="tab-npc">
                        <div class="npc-list" id="npc-config-list">
                            <!-- NPC 列表将在这里渲染 -->
                        </div>
                        <button class="btn-add-config" id="btn-add-npc">
                            <span>➕</span> 创建新角色
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;

        // 绑定事件
        document.getElementById('llm-config-close').onclick = () => this.closeConfigModal();
        document.getElementById('btn-add-llm-config').onclick = () => this.openEditModal();
        document.getElementById('btn-add-npc').onclick = () => this.openNpcEditModal();
        
        // Tab 切换
        modal.querySelectorAll('.config-tab').forEach(tab => {
            tab.onclick = () => this.switchTab(tab.dataset.tab);
        });
        
        modal.onclick = (e) => {
            if (e.target === modal) this.closeConfigModal();
        };

        this.renderConfigList();
        this.renderNpcList();
        return modal;
    }

    // 切换 Tab
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // 更新 tab 按钮状态
        this.modal.querySelectorAll('.config-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // 更新内容显示
        this.modal.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });
    }

    // 渲染 NPC 列表
    renderNpcList() {
        const container = document.getElementById('npc-config-list');
        if (!container || !this.npcManager) return;

        const allNpcs = this.npcManager.getAllNpcs();

        container.innerHTML = allNpcs.map(npc => {
            const isCustom = npc.isCustom;
            
            return `
                <div class="config-item npc-item" data-npc-id="${npc.id}">
                    <div class="npc-item-avatar" style="border-color: ${npc.color}">${npc.avatar}</div>
                    <div class="config-info">
                        <div class="config-name">${this.escapeHtml(npc.name)}</div>
                        <div class="config-detail">${npc.title} ${isCustom ? '(自定义)' : '(内置)'}</div>
                    </div>
                    <div class="config-actions">
                        <button class="config-btn edit-btn" data-action="edit-npc" title="编辑">✏️</button>
                        ${isCustom ? `<button class="config-btn delete-btn" data-action="delete-npc" title="删除">🗑️</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // 绑定事件
        container.querySelectorAll('.npc-item').forEach(item => {
            item.querySelectorAll('.config-btn').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    const npcId = item.dataset.npcId;
                    this.handleNpcAction(action, npcId);
                };
            });
        });
    }

    // 处理 NPC 操作
    handleNpcAction(action, npcId) {
        switch (action) {
            case 'edit-npc':
                this.openNpcEditModal(npcId);
                break;
            case 'delete-npc':
                this.deleteNpc(npcId);
                break;
        }
    }

    // 删除 NPC
    deleteNpc(npcId) {
        if (confirm('确定要删除这个角色吗？')) {
            this.npcManager.deleteCustomNpc(npcId);
            this.renderNpcList();
            this.showToast('🗑️ 角色已删除', 'info');
            // 通知 ChatPanel 更新
            window.dispatchEvent(new CustomEvent('npc-updated'));
        }
    }

    // 打开 NPC 编辑弹窗
    openNpcEditModal(npcId = null) {
        this.currentNpcEditId = npcId;
        const npc = npcId ? this.npcManager.getNpcDetail(npcId) : null;
        const isCustom = npc?.isCustom !== false;

        // 移除已存在的编辑弹窗
        const existing = document.getElementById('npc-edit-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'npc-edit-modal';
        modal.className = 'modal llm-edit-modal';
        modal.innerHTML = `
            <div class="modal-content llm-edit-content npc-edit-content">
                <div class="modal-header">
                    <h3>${npc ? '编辑' : '创建'} 角色</h3>
                    <button class="btn-close" id="npc-edit-close">✕</button>
                </div>
                <div class="llm-edit-body npc-edit-body">
                    <div class="form-row">
                        <div class="form-group half">
                            <label class="form-label">头像 (Emoji)</label>
                            <input type="text" class="form-input emoji-input" id="npc-avatar" 
                                   value="${npc?.avatar || '👤'}" 
                                   placeholder="👤">
                        </div>
                        <div class="form-group half">
                            <label class="form-label">颜色</label>
                            <input type="color" class="form-input color-input" id="npc-color" 
                                   value="${npc?.color || '#888888'}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">角色名称</label>
                        <input type="text" class="form-input" id="npc-name" 
                               value="${npc ? this.escapeHtml(npc.name) : ''}" 
                               placeholder="例如：神秘商人·莫里斯">
                    </div>
                    <div class="form-group">
                        <label class="form-label">角色头衔</label>
                        <input type="text" class="form-input" id="npc-title" 
                               value="${npc ? this.escapeHtml(npc.title) : ''}" 
                               placeholder="例如：流浪商人">
                    </div>
                    <div class="form-group">
                        <label class="form-label">开场白</label>
                        <textarea class="form-textarea" id="npc-greeting" rows="2"
                                  placeholder="角色第一次见面时说的话">${npc?.greeting || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">背景故事</label>
                        <textarea class="form-textarea" id="npc-background" rows="4"
                                  placeholder="角色的背景故事，会影响 AI 的回复风格">${npc?.background || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">性格特点</label>
                        <input type="text" class="form-input" id="npc-personality" 
                               value="${npc ? this.escapeHtml(npc.personality) : ''}" 
                               placeholder="例如：神秘、狡黠、博学">
                    </div>
                    <div class="form-group">
                        <label class="form-label">系统提示词 (System Prompt)</label>
                        <textarea class="form-textarea" id="npc-system-prompt" rows="6"
                                  placeholder="详细的角色扮演指令，告诉 AI 如何扮演这个角色">${npc?.systemPrompt || ''}</textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="npc-edit-cancel">取消</button>
                    <button class="btn-primary" id="npc-edit-save">${isCustom ? '保存' : '另存为新角色'}</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.npcEditModal = modal;

        // 绑定事件
        document.getElementById('npc-edit-close').onclick = () => this.closeNpcEditModal();
        document.getElementById('npc-edit-cancel').onclick = () => this.closeNpcEditModal();
        document.getElementById('npc-edit-save').onclick = () => this.saveNpc(isCustom);

        modal.onclick = (e) => {
            if (e.target === modal) this.closeNpcEditModal();
        };
    }

    // 保存 NPC
    saveNpc(isCustomEdit) {
        const avatar = document.getElementById('npc-avatar').value.trim() || '👤';
        const color = document.getElementById('npc-color').value;
        const name = document.getElementById('npc-name').value.trim();
        const title = document.getElementById('npc-title').value.trim();
        const greeting = document.getElementById('npc-greeting').value.trim();
        const background = document.getElementById('npc-background').value.trim();
        const personality = document.getElementById('npc-personality').value.trim();
        const systemPrompt = document.getElementById('npc-system-prompt').value.trim();

        if (!name) {
            this.showToast('请输入角色名称', 'error');
            return;
        }

        const npcData = {
            avatar,
            portrait: avatar,
            color,
            name,
            title: title || '自定义角色',
            greeting: greeting || '你好，冒险者。',
            background,
            personality,
            systemPrompt
        };

        if (this.currentNpcEditId && isCustomEdit) {
            // 更新现有自定义角色
            this.npcManager.updateCustomNpc(this.currentNpcEditId, npcData);
            this.showToast('✅ 角色已更新', 'success');
        } else {
            // 创建新角色
            this.npcManager.addCustomNpc(npcData);
            this.showToast('✅ 角色已创建', 'success');
        }

        this.closeNpcEditModal();
        this.renderNpcList();
        // 通知 ChatPanel 更新
        window.dispatchEvent(new CustomEvent('npc-updated'));
    }

    // 关闭 NPC 编辑弹窗
    closeNpcEditModal() {
        if (this.npcEditModal) {
            this.npcEditModal.remove();
            this.npcEditModal = null;
        }
        this.currentNpcEditId = null;
    }

    // 渲染配置列表
    renderConfigList() {
        const container = document.getElementById('llm-config-list');
        if (!container) return;

        const configs = this.configManager.getAllConfigs();
        const activeId = this.configManager.activeConfigId;

        if (configs.length === 0) {
            container.innerHTML = `
                <div class="config-empty">
                    <div class="empty-icon">🔌</div>
                    <div class="empty-text">还没有配置</div>
                    <div class="empty-hint">点击下方按钮添加 API 配置</div>
                </div>
            `;
            return;
        }

        container.innerHTML = configs.map(config => {
            const provider = this.configManager.getProvider(config.provider);
            const isActive = config.id === activeId;
            
            return `
                <div class="config-item ${isActive ? 'active' : ''}" data-config-id="${config.id}">
                    <div class="config-info">
                        <div class="config-name">${this.escapeHtml(config.name)}</div>
                        <div class="config-detail">
                            ${provider?.icon || '🔧'} ${provider?.name || config.provider} / ${this.escapeHtml(config.modelId)}
                        </div>
                    </div>
                    <div class="config-actions">
                        <button class="config-btn test-btn" data-action="test" title="测试连接">⚡</button>
                        <button class="config-btn activate-btn ${isActive ? 'activated' : ''}" data-action="activate">
                            ${isActive ? '● 已激活' : '激活'}
                        </button>
                        <button class="config-btn edit-btn" data-action="edit" title="编辑">✏️</button>
                        <button class="config-btn delete-btn" data-action="delete" title="删除">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');

        // 绑定配置项事件
        container.querySelectorAll('.config-item').forEach(item => {
            item.querySelectorAll('.config-btn').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    const configId = item.dataset.configId;
                    this.handleConfigAction(action, configId);
                };
            });
        });
    }

    // 处理配置操作
    async handleConfigAction(action, configId) {
        switch (action) {
            case 'test':
                await this.testConfig(configId);
                break;
            case 'activate':
                this.activateConfig(configId);
                break;
            case 'edit':
                this.openEditModal(configId);
                break;
            case 'delete':
                this.deleteConfig(configId);
                break;
        }
    }

    // 测试配置
    async testConfig(configId) {
        const config = this.configManager.configs.find(c => c.id === configId);
        if (!config) return;

        // 显示测试中状态
        const item = document.querySelector(`[data-config-id="${configId}"]`);
        const testBtn = item?.querySelector('.test-btn');
        if (testBtn) {
            testBtn.innerHTML = '⏳';
            testBtn.disabled = true;
        }

        try {
            const result = await this.configManager.testConnection(config);
            
            if (result.success) {
                this.showToast('✅ 连接成功！', 'success');
            } else {
                this.showToast(`❌ ${result.message}`, 'error');
            }
        } catch (error) {
            this.showToast(`❌ ${error.message}`, 'error');
        } finally {
            if (testBtn) {
                testBtn.innerHTML = '⚡';
                testBtn.disabled = false;
            }
        }
    }

    // 激活配置
    activateConfig(configId) {
        this.configManager.activateConfig(configId);
        this.renderConfigList();
        this.showToast('✅ 配置已激活', 'success');
    }

    // 删除配置
    deleteConfig(configId) {
        if (confirm('确定要删除这个配置吗？')) {
            this.configManager.deleteConfig(configId);
            this.renderConfigList();
            this.showToast('🗑️ 配置已删除', 'info');
        }
    }

    // 打开编辑弹窗
    openEditModal(configId = null) {
        this.currentEditId = configId;
        const config = configId ? this.configManager.configs.find(c => c.id === configId) : null;

        // 移除已存在的编辑弹窗
        const existing = document.getElementById('llm-edit-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'llm-edit-modal';
        modal.className = 'modal llm-edit-modal';
        modal.innerHTML = `
            <div class="modal-content llm-edit-content">
                <div class="modal-header">
                    <h3>${config ? '编辑' : '添加'} API 配置</h3>
                    <button class="btn-close" id="llm-edit-close">✕</button>
                </div>
                <div class="llm-edit-body">
                    <div class="form-group">
                        <label class="form-label">配置名称</label>
                        <input type="text" class="form-input" id="config-name" 
                               value="${config ? this.escapeHtml(config.name) : ''}" 
                               placeholder="例如：GPT-4o">
                    </div>
                    <div class="form-group">
                        <label class="form-label">服务商</label>
                        <select class="form-select" id="config-provider">
                            ${this.configManager.providers.map(p => `
                                <option value="${p.id}" ${config?.provider === p.id ? 'selected' : ''}>
                                    ${p.icon} ${p.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">BASE URL</label>
                        <input type="text" class="form-input" id="config-baseurl" 
                               value="${config ? this.escapeHtml(config.baseUrl) : ''}" 
                               placeholder="https://api.openai.com/v1">
                    </div>
                    <div class="form-group">
                        <label class="form-label">API KEY</label>
                        <div class="input-with-toggle">
                            <input type="password" class="form-input" id="config-apikey" 
                                   value="${config ? config.apiKey : ''}" 
                                   placeholder="sk-...">
                            <button class="toggle-visibility" id="toggle-apikey">👁️</button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">MODEL ID</label>
                        <input type="text" class="form-input" id="config-modelid" 
                               value="${config ? this.escapeHtml(config.modelId) : ''}" 
                               placeholder="gpt-4o">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="llm-edit-cancel">取消</button>
                    <button class="btn-primary" id="llm-edit-save">保存配置</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.editModal = modal;

        // 绑定事件
        document.getElementById('llm-edit-close').onclick = () => this.closeEditModal();
        document.getElementById('llm-edit-cancel').onclick = () => this.closeEditModal();
        document.getElementById('llm-edit-save').onclick = () => this.saveConfig();
        
        // 服务商切换时自动填充 URL
        document.getElementById('config-provider').onchange = (e) => {
            const provider = this.configManager.getProvider(e.target.value);
            const urlInput = document.getElementById('config-baseurl');
            if (provider && provider.defaultUrl && !urlInput.value) {
                urlInput.value = provider.defaultUrl;
            }
        };

        // 密码显示切换
        document.getElementById('toggle-apikey').onclick = () => {
            const input = document.getElementById('config-apikey');
            input.type = input.type === 'password' ? 'text' : 'password';
        };

        modal.onclick = (e) => {
            if (e.target === modal) this.closeEditModal();
        };

        // 如果是新建，自动填充默认 URL
        if (!config) {
            const provider = this.configManager.getProvider('custom');
            if (provider?.defaultUrl) {
                document.getElementById('config-baseurl').value = provider.defaultUrl;
            }
        }
    }

    // 保存配置
    saveConfig() {
        const name = document.getElementById('config-name').value.trim();
        const provider = document.getElementById('config-provider').value;
        const baseUrl = document.getElementById('config-baseurl').value.trim();
        const apiKey = document.getElementById('config-apikey').value.trim();
        const modelId = document.getElementById('config-modelid').value.trim();

        // 验证
        if (!name) {
            this.showToast('请输入配置名称', 'error');
            return;
        }
        if (!baseUrl) {
            this.showToast('请输入 BASE URL', 'error');
            return;
        }
        if (!apiKey) {
            this.showToast('请输入 API KEY', 'error');
            return;
        }
        if (!modelId) {
            this.showToast('请输入 MODEL ID', 'error');
            return;
        }

        const configData = { name, provider, baseUrl, apiKey, modelId };

        if (this.currentEditId) {
            this.configManager.updateConfig(this.currentEditId, configData);
            this.showToast('✅ 配置已更新', 'success');
        } else {
            this.configManager.addConfig(configData);
            this.showToast('✅ 配置已添加', 'success');
        }

        this.closeEditModal();
        this.renderConfigList();
    }

    // 关闭配置弹窗
    closeConfigModal() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }

    // 关闭编辑弹窗
    closeEditModal() {
        if (this.editModal) {
            this.editModal.remove();
            this.editModal = null;
        }
        this.currentEditId = null;
    }

    // 显示配置弹窗
    show() {
        this.createConfigModal();
    }

    // 显示提示
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `llm-toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // HTML 转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}
