(() => {
  const AgentFactory = {
    _sessions: {},
    _messages: {},
    _generating: {},

    createAgentModule(agentConfig) {
      const self = this;
      const agentId = agentConfig.id;

      return {
        _config: agentConfig,
        _sessionId: null,
        _messages: [],
        _generating: false,

        async init() {
          if (!self._sessions[agentId]) {
            self._sessions[agentId] = [];
          }
          if (!self._messages[agentId]) {
            self._messages[agentId] = [];
          }
        },

        render() {
          const config = this._config;
          const category = AgentConfigs.getCategoryInfo(config.category);
          
          return `
            <div class="agent-module-container flex h-full bg-gradient-to-br from-slate-50 to-white overflow-hidden">
              ${this._renderSidebar()}
              ${this._renderMainContent()}
              ${this._renderRightPanel()}
            </div>
          `;
        },

        _renderSidebar() {
          const config = this._config;
          const sessions = self._sessions[agentId] || [];
          
          return `
            <div class="w-64 shrink-0 flex flex-col bg-white/80 backdrop-blur-sm border-r border-gray-200/50">
              <div class="p-4 border-b border-gray-100">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-${config.color} to-${config.color}/70 flex items-center justify-center">
                    <i class="fa-solid ${config.icon} text-white text-lg"></i>
                  </div>
                  <div>
                    <h3 class="font-bold text-gray-800">${config.name}</h3>
                    <p class="text-xs text-gray-500">${config.description}</p>
                  </div>
                </div>
                <button class="btn w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl py-2.5 font-medium shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all" onclick="Modules['${agentId}'].newSession()">
                  <i class="fa-solid fa-plus mr-2"></i>新建会话
                </button>
              </div>
              <div class="flex-1 overflow-y-auto p-3">
                <div class="text-xs text-gray-400 uppercase tracking-wider mb-2 px-2">历史会话</div>
                ${sessions.length > 0 ? sessions.map(s => `
                  <button class="w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1 transition-all ${this._sessionId === s.id ? 'bg-indigo-50 text-indigo-600 font-medium' : 'hover:bg-gray-50 text-gray-600'}" onclick="Modules['${agentId}'].selectSession('${s.id}')">
                    <i class="fa-regular fa-message mr-2 text-xs"></i>${s.title}
                  </button>
                `).join('') : '<div class="text-center text-gray-400 text-sm py-8">暂无会话</div>'}
              </div>
              <div class="p-3 border-t border-gray-100">
                <div class="text-xs text-gray-400 mb-2">Agent信息</div>
                <div class="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
                  <div class="mb-1"><span class="text-gray-400">名称:</span> ${config.agentName}</div>
                  <div><span class="text-gray-400">版本:</span> 1.0.0</div>
                </div>
              </div>
            </div>
          `;
        },

        _renderMainContent() {
          const config = this._config;
          
          return `
            <div class="flex-1 flex flex-col min-w-0">
              <div class="flex-1 overflow-y-auto p-6" id="agent-messages-${agentId}">
                ${this._messages.length > 0 ? this._messages.map(m => this._renderMessage(m)).join('') : `
                  <div class="flex flex-col items-center justify-center h-full text-gray-400">
                    <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-${config.color}/10 to-${config.color}/5 flex items-center justify-center mb-4">
                      <i class="fa-solid ${config.icon} text-3xl text-${config.color}/50"></i>
                    </div>
                    <p class="text-lg font-medium text-gray-500 mb-2">${config.name}</p>
                    <p class="text-sm text-gray-400 mb-6">${config.description}</p>
                    <div class="flex flex-wrap gap-2 justify-center max-w-md">
                      ${config.features.map(f => `<span class="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">${f}</span>`).join('')}
                    </div>
                  </div>
                `}
              </div>
              ${this._renderInputArea()}
            </div>
          `;
        },

        _renderMessage(message) {
          const isUser = message.role === 'user';
          return `
            <div class="mb-4 ${isUser ? 'flex justify-end' : ''}">
              <div class="max-w-[85%] ${isUser ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-white border border-gray-100 shadow-sm'} rounded-2xl p-4">
                ${!isUser ? `<div class="text-xs text-gray-400 mb-2 font-medium">${this._config.name}</div>` : ''}
                <div class="prose prose-sm ${isUser ? 'prose-invert' : ''} max-w-none">
                  ${typeof marked !== 'undefined' ? marked.parse(message.content) : message.content}
                </div>
              </div>
            </div>
          `;
        },

        _renderInputArea() {
          const config = this._config;
          
          return `
            <div class="border-t border-gray-100 bg-white/50 backdrop-blur-sm p-4">
              <div class="max-w-4xl mx-auto">
                <div class="bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 overflow-hidden">
                  <div class="p-4">
                    <textarea 
                      class="w-full resize-none border-0 outline-none text-gray-700 placeholder-gray-400 min-h-[80px]" 
                      placeholder="输入你的需求，${config.name}将为你服务..."
                      id="agent-input-${agentId}"
                      onkeydown="if(event.key==='Enter' && !event.shiftKey){event.preventDefault();Modules['${agentId}'].sendMessage();}"
                    ></textarea>
                  </div>
                  <div class="flex items-center justify-between px-4 py-3 bg-gray-50/50 border-t border-gray-100">
                    <div class="flex gap-2">
                      <button class="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors" title="清空对话" onclick="Modules['${agentId}'].clearMessages()">
                        <i class="fa-solid fa-trash-can text-sm"></i>
                      </button>
                      <button class="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors" title="导出" onclick="Modules['${agentId}'].exportChat()">
                        <i class="fa-solid fa-download text-sm"></i>
                      </button>
                    </div>
                    <button 
                      class="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      id="agent-send-btn-${agentId}"
                      onclick="Modules['${agentId}'].sendMessage()"
                    >
                      <i class="fa-solid fa-paper-plane mr-2"></i>发送
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `;
        },

        _renderRightPanel() {
          const config = this._config;
          
          return `
            <div class="w-72 shrink-0 bg-gray-50/50 border-l border-gray-200/50 flex flex-col">
              <div class="p-4 border-b border-gray-100">
                <h4 class="font-bold text-gray-700 flex items-center gap-2">
                  <i class="fa-solid fa-sliders text-indigo-500"></i>
                  参数设置
                </h4>
              </div>
              <div class="flex-1 overflow-y-auto p-4">
                ${config.inputFields.map(field => this._renderInputField(field)).join('')}
              </div>
              <div class="p-4 border-t border-gray-100">
                <button class="btn w-full bg-gray-800 text-white rounded-xl py-2.5 font-medium hover:bg-gray-700 transition-colors" onclick="Modules['${agentId}'].applySettings()">
                  <i class="fa-solid fa-check mr-2"></i>应用设置
                </button>
              </div>
            </div>
          `;
        },

        _renderInputField(field) {
          const fieldId = `field-${agentId}-${field.id}`;
          
          switch(field.type) {
            case 'text':
              return `
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-600 mb-1.5">${field.label}</label>
                  <input type="text" id="${fieldId}" placeholder="${field.placeholder || ''}" value="${field.default || ''}" class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                </div>
              `;
            case 'textarea':
              return `
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-600 mb-1.5">${field.label}</label>
                  <textarea id="${fieldId}" placeholder="${field.placeholder || ''}" rows="3" class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none">${field.default || ''}</textarea>
                </div>
              `;
            case 'select':
              return `
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-600 mb-1.5">${field.label}</label>
                  <select id="${fieldId}" class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                    ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                  </select>
                </div>
              `;
            case 'number':
              return `
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-600 mb-1.5">${field.label}</label>
                  <input type="number" id="${fieldId}" value="${field.default || 0}" min="${field.min || 0}" max="${field.max || 100}" class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                </div>
              `;
            case 'range':
              return `
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-600 mb-1.5">${field.label}</label>
                  <div class="flex items-center gap-3">
                    <input type="range" id="${fieldId}" value="${field.default || 5}" min="${field.min || 1}" max="${field.max || 10}" class="flex-1 accent-indigo-500" oninput="document.getElementById('${fieldId}-val').textContent=this.value">
                    <span id="${fieldId}-val" class="text-sm font-medium text-gray-600 w-6">${field.default || 5}</span>
                  </div>
                </div>
              `;
            default:
              return '';
          }
        },

        newSession() {
          const session = {
            id: `session_${Date.now()}`,
            title: '新会话',
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          
          if (!self._sessions[agentId]) {
            self._sessions[agentId] = [];
          }
          self._sessions[agentId].unshift(session);
          this._sessionId = session.id;
          this._messages = [];
          self._messages[agentId] = [];
          
          this.refresh();
        },

        selectSession(sessionId) {
          this._sessionId = sessionId;
          const sessionData = self._sessions[agentId]?.find(s => s.id === sessionId);
          if (sessionData && sessionData.messages) {
            this._messages = sessionData.messages;
          } else {
            this._messages = [];
          }
          self._messages[agentId] = this._messages;
          this.refresh();
        },

        async sendMessage() {
          const input = document.getElementById(`agent-input-${agentId}`);
          const content = input.value.trim();
          if (!content || this._generating) return;
          
          if (!this._sessionId) {
            this.newSession();
          }
          
          const userMessage = {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: content,
            timestamp: Date.now()
          };
          
          this._messages.push(userMessage);
          input.value = '';
          this.refresh();
          
          await this._generateResponse(content);
        },

        async _generateResponse(userInput) {
          this._generating = true;
          this._updateSendButton(true);
          
          const config = this._config;
          const settings = this._getSettings();
          
          let prompt = config.systemPrompt + '\n\n';
          
          if (Object.keys(settings).length > 0) {
            prompt += '用户设置:\n';
            for (const [key, value] of Object.entries(settings)) {
              const field = config.inputFields.find(f => f.id === key);
              if (field && value) {
                prompt += `- ${field.label}: ${value}\n`;
              }
            }
            prompt += '\n';
          }
          
          prompt += `用户请求: ${userInput}`;
          
          try {
            const response = await AI.chat(prompt, this._messages.slice(-10));
            
            const assistantMessage = {
              id: `msg_${Date.now()}`,
              role: 'assistant',
              content: response,
              timestamp: Date.now()
            };
            
            this._messages.push(assistantMessage);
            
            const session = self._sessions[agentId]?.find(s => s.id === this._sessionId);
            if (session) {
              session.messages = this._messages;
              if (this._messages.length <= 2) {
                session.title = userInput.slice(0, 20) + (userInput.length > 20 ? '...' : '');
              }
            }
            
          } catch (error) {
            console.error('Agent response error:', error);
            UI.toast('生成响应失败，请检查API配置', 'error');
          } finally {
            this._generating = false;
            this._updateSendButton(false);
            this.refresh();
          }
        },

        _getSettings() {
          const settings = {};
          const config = this._config;
          
          config.inputFields.forEach(field => {
            const el = document.getElementById(`field-${agentId}-${field.id}`);
            if (el) {
              settings[field.id] = el.value;
            }
          });
          
          return settings;
        },

        applySettings() {
          UI.toast('设置已应用', 'success');
        },

        _updateSendButton(loading) {
          const btn = document.getElementById(`agent-send-btn-${agentId}`);
          if (btn) {
            btn.disabled = loading;
            btn.innerHTML = loading 
              ? '<i class="fa-solid fa-spinner fa-spin mr-2"></i>生成中...'
              : '<i class="fa-solid fa-paper-plane mr-2"></i>发送';
          }
        },

        clearMessages() {
          if (!confirm('确定要清空当前会话的所有消息吗？')) return;
          this._messages = [];
          self._messages[agentId] = [];
          const session = self._sessions[agentId]?.find(s => s.id === this._sessionId);
          if (session) {
            session.messages = [];
          }
          this.refresh();
        },

        exportChat() {
          const content = this._messages.map(m => 
            `${m.role === 'user' ? '用户' : this._config.name}: ${m.content}`
          ).join('\n\n---\n\n');
          
          const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${this._config.name}_${new Date().toISOString().slice(0,10)}.txt`;
          a.click();
          URL.revokeObjectURL(url);
        },

        refresh() {
          const container = document.querySelector(`#module-view-${agentId}`);
          if (container) {
            container.innerHTML = this.render();
          }
        }
      };
    },

    initAllModules() {
      const agents = AgentConfigs.getAllAgents();
      const modules = {};
      
      agents.forEach(agent => {
        modules[agent.id] = this.createAgentModule(agent);
      });
      
      window.Modules = window.Modules || {};
      Object.assign(window.Modules, modules);
    }
  };

  window.AgentFactory = AgentFactory;
})();
