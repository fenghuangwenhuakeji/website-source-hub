/**
 * 聊天面板组件
 * 负责 NPC 对话界面的渲染和交互
 */
class ChatPanelComponent {
    constructor(options = {}) {
        this.container = document.getElementById('chat-panel');
        this.messagesContainer = document.getElementById('chat-messages');
        this.npcSelector = document.getElementById('npc-selector');
        this.inputField = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('chat-send-btn');
        this.toggleBtn = document.getElementById('chat-toggle-btn');
        this.closeBtn = document.getElementById('chat-close-btn');
        this.quickReplies = document.getElementById('quick-replies');
        
        this.currentNpcId = null;
        this.isCollapsed = true;
        this.isTyping = false;
        
        // LLM 配置管理器
        this.llmConfigManager = new LLMConfigManager();
        
        // NPC 管理器
        this.npcManager = new NPCManager(this.llmConfigManager);
        
        // LLM 配置 UI
        this.llmConfigUI = new LLMConfigUI(this.llmConfigManager);
        
        // NPC 配置
        this.npcs = this.npcManager.getAllNpcs();
        
        this.init();
    }

    // 默认 NPC 列表（已移至 NPCManager）
    getDefaultNpcs() {
        return this.npcManager.getAllNpcs();
    }

    init() {
        try {
            this.renderNpcSelector();
            this.bindEvents();
            this.loadSavedState();
            this.addSettingsButton();
            this.updateApiStatus();
            
            // 监听 NPC 更新事件
            window.addEventListener('npc-updated', () => {
                this.npcs = this.npcManager.getAllNpcs();
                this.renderNpcSelector();
            });
            
            // 将 npcManager 传递给 llmConfigUI
            this.llmConfigUI.setNpcManager(this.npcManager);
        } catch (error) {
            console.error('ChatPanelComponent init error:', error);
        }
    }

    // 添加设置按钮
    addSettingsButton() {
        const header = this.container?.querySelector('.chat-header');
        if (!header) return;

        // 检查是否已存在
        if (header.querySelector('.chat-settings-btn')) return;

        const settingsBtn = document.createElement('button');
        settingsBtn.className = 'chat-settings-btn';
        settingsBtn.innerHTML = '⚙️';
        settingsBtn.title = 'API 配置';
        settingsBtn.onclick = () => this.llmConfigUI.show();

        header.insertBefore(settingsBtn, header.querySelector('.close-btn'));
    }

    // 更新 API 状态显示
    updateApiStatus() {
        const activeConfig = this.llmConfigManager.getActiveConfig();
        
        // 更新 NPC 头像状态
        this.npcSelector?.querySelectorAll('.npc-avatar').forEach(el => {
            if (activeConfig) {
                el.classList.add('has-llm');
            } else {
                el.classList.remove('has-llm');
            }
        });
    }

    // 渲染 NPC 选择器
    renderNpcSelector() {
        if (!this.npcSelector) return;
        
        const hasLlm = !!this.llmConfigManager.getActiveConfig();
        
        this.npcSelector.innerHTML = this.npcs.map(npc => `
            <div class="npc-avatar ${npc.id === this.currentNpcId ? 'active' : ''} ${hasLlm ? 'has-llm' : ''}" 
                 data-npc-id="${npc.id}" 
                 style="border-color: ${npc.color}"
                 title="${npc.name}">
                ${npc.avatar}
                <span class="npc-name-tooltip">${npc.name}</span>
            </div>
        `).join('');
    }

    // 绑定事件
    bindEvents() {
        // 折叠/展开按钮
        if (this.toggleBtn) {
            this.toggleBtn.onclick = () => this.toggle();
        }
        
        // 关闭按钮
        if (this.closeBtn) {
            this.closeBtn.onclick = () => this.collapse();
        }
        
        // NPC 选择
        if (this.npcSelector) {
            this.npcSelector.onclick = (e) => {
                const avatar = e.target.closest('.npc-avatar');
                if (avatar) {
                    this.selectNpc(avatar.dataset.npcId);
                }
            };
        }
        
        // 发送按钮
        if (this.sendBtn) {
            this.sendBtn.onclick = () => this.sendMessage();
        }
        
        // 输入框回车发送
        if (this.inputField) {
            this.inputField.onkeydown = (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            };
            
            // 自动调整高度
            this.inputField.oninput = () => {
                this.inputField.style.height = 'auto';
                this.inputField.style.height = Math.min(this.inputField.scrollHeight, 100) + 'px';
            };
        }
        
        // 快捷回复
        if (this.quickReplies) {
            this.quickReplies.onclick = (e) => {
                const btn = e.target.closest('.quick-reply-btn');
                if (btn) {
                    const msg = btn.dataset.msg;
                    if (this.inputField) {
                        this.inputField.value = msg;
                        this.sendMessage();
                    }
                }
            };
        }
    }

    // 切换面板显示
    toggle() {
        if (this.isCollapsed) {
            this.expand();
        } else {
            this.collapse();
        }
    }

    // 展开面板
    expand() {
        this.isCollapsed = false;
        if (this.container) {
            this.container.classList.remove('collapsed');
            this.container.classList.add('open');
        }
        this.toggleBtn.title = '关闭聊天';
        this.saveState();
        
        // 聚焦输入框
        setTimeout(() => {
            if (this.inputField) this.inputField.focus();
        }, 300);
    }

    // 折叠面板
    collapse() {
        this.isCollapsed = true;
        if (this.container) {
            this.container.classList.add('collapsed');
            this.container.classList.remove('open');
        }
        this.toggleBtn.title = '打开聊天';
        this.saveState();
    }

    // 选择 NPC
    selectNpc(npcId) {
        if (this.currentNpcId === npcId) return;
        
        this.currentNpcId = npcId;
        const npc = this.npcs.find(n => n.id === npcId);
        const npcDetail = this.npcManager.getNpcDetail(npcId);
        
        // 更新选中状态
        this.npcSelector.querySelectorAll('.npc-avatar').forEach(el => {
            el.classList.toggle('active', el.dataset.npcId === npcId);
        });
        
        // 清空消息
        this.clearMessages();
        
        if (npc && npcDetail) {
            // 显示 NPC 信息卡片
            this.showNpcInfo(npcDetail);
            
            // 尝试加载保存的对话历史
            const hasHistory = this.npcManager.loadConversationHistory(npcId);
            
            if (hasHistory) {
                // 恢复之前的对话
                this.restoreConversation(npcId, npc);
            } else {
                // 初始化新对话
                this.npcManager.initConversation(npcId);
                
                // 显示 NPC 问候语
                setTimeout(() => {
                    this.appendMessage('npc', npcDetail.greeting, npc);
                }, 300);
            }
        }
        
        this.saveState();
    }

    // 恢复之前的对话
    restoreConversation(npcId, npc) {
        const history = this.npcManager.conversationHistory[npcId];
        if (!history || history.length <= 1) {
            // 只有系统消息，显示问候语
            const npcDetail = this.npcManager.getNpcDetail(npcId);
            setTimeout(() => {
                this.appendMessage('npc', npcDetail.greeting, npc);
            }, 300);
            return;
        }

        // 显示恢复提示
        this.showSystemMessage(`📜 已恢复与 ${npc.name} 的对话历史`);

        // 恢复对话消息（跳过系统消息）
        for (let i = 1; i < history.length; i++) {
            const msg = history[i];
            if (msg.role === 'user') {
                this.appendMessage('user', msg.content);
            } else if (msg.role === 'assistant') {
                this.appendMessage('npc', msg.content, npc);
            }
        }
    }

    // 显示 NPC 信息卡片
    showNpcInfo(npc) {
        // 移除已存在的信息卡片
        const existing = this.messagesContainer?.querySelector('.npc-info-card');
        if (existing) existing.remove();

        const infoCard = document.createElement('div');
        infoCard.className = 'npc-info-card';
        infoCard.innerHTML = `
            <div class="npc-info-header">
                <div class="npc-info-avatar" style="border-color: ${npc.color}">${npc.portrait || npc.avatar}</div>
                <div class="npc-info-text">
                    <div class="npc-info-name">${npc.name}</div>
                    <div class="npc-info-title">${npc.title}</div>
                </div>
                <button class="npc-clear-history" title="清除对话历史">🗑️</button>
            </div>
            <div class="npc-info-background">${npc.background.split('\n')[0]}...</div>
            <button class="npc-info-more" onclick="this.parentElement.classList.toggle('expanded')">
                查看完整背景
            </button>
            <div class="npc-info-full">${npc.background.replace(/\n/g, '<br>')}</div>
        `;

        // 绑定清除历史按钮
        const clearBtn = infoCard.querySelector('.npc-clear-history');
        if (clearBtn) {
            clearBtn.onclick = () => this.clearNpcHistory();
        }

        this.messagesContainer?.insertBefore(infoCard, this.messagesContainer.firstChild);
    }

    // 清除当前 NPC 的对话历史
    clearNpcHistory() {
        if (!this.currentNpcId) return;
        
        if (confirm('确定要清除与这个角色的对话历史吗？')) {
            const npc = this.npcs.find(n => n.id === this.currentNpcId);
            const npcDetail = this.npcManager.getNpcDetail(this.currentNpcId);
            
            // 清除历史
            this.npcManager.clearHistory(this.currentNpcId);
            
            // 清除本地存储
            localStorage.removeItem(`dungeonspire_chat_history_${this.currentNpcId}`);
            
            // 清空消息显示
            this.clearMessages();
            
            // 重新显示 NPC 信息和问候语
            if (npcDetail) {
                this.showNpcInfo(npcDetail);
                this.npcManager.initConversation(this.currentNpcId);
                setTimeout(() => {
                    this.appendMessage('npc', npcDetail.greeting, npc);
                }, 300);
            }
            
            this.showSystemMessage('🗑️ 对话历史已清除');
        }
    }

    // 发送消息
    async sendMessage() {
        if (!this.inputField || this.isTyping) return;
        
        const text = this.inputField.value.trim();
        if (!text) return;
        
        if (!this.currentNpcId) {
            this.showSystemMessage('请先选择一个 NPC');
            return;
        }
        
        // 清空输入框
        this.inputField.value = '';
        this.inputField.style.height = 'auto';
        
        // 显示用户消息
        this.appendMessage('user', text);
        
        // 显示打字指示器
        this.showTypingIndicator();
        
        try {
            // 使用 NPC 管理器进行对话
            const response = await this.npcManager.chat(this.currentNpcId, text);
            
            // 隐藏打字指示器
            this.hideTypingIndicator();
            
            // 显示 NPC 回复
            const npc = this.npcs.find(n => n.id === this.currentNpcId);
            this.appendMessage('npc', response, npc);
            
        } catch (error) {
            this.hideTypingIndicator();
            this.showSystemMessage('发送失败: ' + error.message);
            console.error('Chat error:', error);
        }
    }

    // 添加消息
    appendMessage(role, content, npc = null) {
        if (!this.messagesContainer) return;
        
        // 移除空状态
        const emptyState = this.messagesContainer.querySelector('.chat-empty-state');
        if (emptyState) emptyState.remove();
        
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${role}`;
        
        const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        
        if (role === 'user') {
            messageEl.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${this.escapeHtml(content)}</div>
                    <div class="message-time">${time}</div>
                </div>
                <div class="message-avatar">👤</div>
            `;
        } else if (role === 'npc') {
            const avatar = npc ? npc.avatar : '🤖';
            const name = npc ? npc.name : 'NPC';
            messageEl.innerHTML = `
                <div class="message-avatar">${avatar}</div>
                <div class="message-content">
                    <div class="message-sender">${name}</div>
                    <div class="message-text">${this.formatMessage(content)}</div>
                    <div class="message-time">${time}</div>
                </div>
            `;
        } else if (role === 'system') {
            messageEl.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${this.escapeHtml(content)}</div>
                </div>
            `;
        }
        
        this.messagesContainer.appendChild(messageEl);
        this.scrollToBottom();
    }

    // 显示系统消息
    showSystemMessage(text) {
        this.appendMessage('system', text);
    }

    // 显示打字指示器
    showTypingIndicator() {
        if (!this.messagesContainer || this.isTyping) return;
        
        this.isTyping = true;
        const npc = this.npcs.find(n => n.id === this.currentNpcId);
        
        const indicator = document.createElement('div');
        indicator.className = 'chat-message npc typing-message';
        indicator.innerHTML = `
            <div class="message-avatar">${npc ? npc.avatar : '🤖'}</div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        
        this.messagesContainer.appendChild(indicator);
        this.scrollToBottom();
    }

    // 隐藏打字指示器
    hideTypingIndicator() {
        this.isTyping = false;
        const indicator = this.messagesContainer?.querySelector('.typing-message');
        if (indicator) indicator.remove();
    }

    // 清空消息
    clearMessages() {
        if (!this.messagesContainer) return;
        this.messagesContainer.innerHTML = '';
    }

    // 滚动到底部
    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    // 格式化消息（处理动作标记等）
    formatMessage(text) {
        // 转义 HTML
        let formatted = this.escapeHtml(text);
        
        // 高亮动作标记 [ACTION: payload]
        formatted = formatted.replace(/\[([A-Z_]+):\s*([^\]]+)\]/g, 
            '<span class="action-marker">[$1: $2]</span>');
        
        // 换行处理
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }

    // HTML 转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 保存状态
    saveState() {
        const state = {
            isCollapsed: this.isCollapsed,
            currentNpcId: this.currentNpcId
        };
        localStorage.setItem('dungeonspire_chat_state', JSON.stringify(state));
    }

    // 加载保存的状态
    loadSavedState() {
        try {
            const saved = localStorage.getItem('dungeonspire_chat_state');
            if (saved) {
                const state = JSON.parse(saved);
                if (state.currentNpcId) {
                    this.selectNpc(state.currentNpcId);
                }
                // 默认保持折叠状态
            }
        } catch (e) {
            console.warn('Failed to load chat state:', e);
        }
    }

    // 设置聊天管理器
    setChatManager(manager) {
        this.chatManager = manager;
    }

    // 更新 NPC 列表
    updateNpcs(npcs) {
        this.npcs = npcs;
        this.renderNpcSelector();
    }

    // 获取当前 NPC
    getCurrentNpc() {
        return this.npcs.find(n => n.id === this.currentNpcId);
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatPanelComponent;
}
