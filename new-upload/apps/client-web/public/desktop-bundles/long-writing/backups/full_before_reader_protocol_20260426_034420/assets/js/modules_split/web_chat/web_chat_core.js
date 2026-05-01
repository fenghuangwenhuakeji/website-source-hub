// ============================================
// 网页对话 - 多模型 API 控制台 + 会议室
// ============================================
Modules.web_chat = {
    sessions: [],
    currentSessionId: null,
    messages: [],
    currentModel: 'openai',
    mode: localStorage.getItem('web_chat_mode') || 'chat',
    configs: {},
    _generating: false,
    _roomRunning: false,
    _draftBeforeRefresh: '',
    _pendingFiles: [],
    _editingMessageIndex: null,
    _editingDraft: '',
    _roomEditingIndex: null,
    _roomEditingDraft: '',
    _showRecords: false,
    _roomPickerOpen: false,
    _roomTurnsCustom: false,
    _roomAbortController: null,
    _chatAbortController: null,
    runOptions: {
        deepThink: localStorage.getItem('web_chat_deep_think') === '1',
        webSearch: localStorage.getItem('web_chat_web_search') === '1'
    },
    _memoryRecords: [],
    poolModels: [],

    room: {
        id: 'room_' + Date.now(),
        topic: '',
        draft: '',
        maxTurns: 12,
        participants: ['openai', 'claude', 'gemini', 'deepseek'],
        messages: [],
        terminalRequests: []
    },

    models: [
        {
            id: 'openai',
            name: 'OpenAI GPT',
            provider: 'OpenAI',
            desc: '通用、多模态、工具生态',
            icon: 'fa-bolt',
            apiStyle: 'openai',
            baseUrl: 'https://api.openai.com/v1',
            modelHint: '填你控制台可用的模型名',
            caps: ['text', 'vision', 'long', 'reasoning', 'json', 'tools', 'web_search'],
            system: '你是一个直接、可靠、执行力强的通用助手。优先给可落地结果，少说套话。'
        },
        {
            id: 'claude',
            name: 'Claude',
            provider: 'Anthropic',
            desc: '长文、分析、写作审校',
            icon: 'fa-feather',
            apiStyle: 'anthropic',
            baseUrl: 'https://api.anthropic.com',
            modelHint: '填 Anthropic 控制台可用模型名',
            caps: ['text', 'vision', 'long', 'reasoning', 'web_search'],
            system: '你擅长长文理解、谨慎分析和清楚表达。回答要有判断，不编造。'
        },
        {
            id: 'gemini',
            name: 'Gemini',
            provider: 'Google',
            desc: '多模态、长上下文、资料整理',
            icon: 'fa-gem',
            apiStyle: 'gemini',
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
            modelHint: '填 Google AI Studio 可用模型名',
            caps: ['text', 'vision', 'long', 'json', 'web_search'],
            system: '你擅长快速整理信息、对比方案和处理多模态材料。先抓重点，再给路径。'
        },
        {
            id: 'deepseek',
            name: 'DeepSeek',
            provider: 'DeepSeek',
            desc: '推理、代码、复杂拆解',
            icon: 'fa-code',
            apiStyle: 'openai',
            baseUrl: 'https://api.deepseek.com',
            modelHint: '填 DeepSeek 控制台可用模型名',
            caps: ['text', 'long', 'reasoning', 'json'],
            system: '你擅长推理、代码和复杂问题拆解。先判断问题本质，再给最短可行解。'
        },
        {
            id: 'qwen',
            name: 'Qwen',
            provider: '阿里通义',
            desc: '中文、长上下文、多模态',
            icon: 'fa-dragon',
            apiStyle: 'openai',
            baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            modelHint: '填 DashScope 可用模型名',
            caps: ['text', 'vision', 'long', 'json', 'tools'],
            system: '你擅长中文任务、结构化输出和长上下文处理。直接给结论和步骤。'
        },
        {
            id: 'kimi',
            name: 'Kimi',
            provider: 'Moonshot',
            desc: '长文本、资料阅读、中文问答',
            icon: 'fa-moon',
            apiStyle: 'openai',
            baseUrl: 'https://api.moonshot.cn/v1',
            modelHint: '填 Moonshot 控制台可用模型名',
            caps: ['text', 'long', 'json'],
            system: '你擅长长文本阅读和资料提炼。回答要紧贴上下文，别跳设定。'
        },
        {
            id: 'zhipu',
            name: 'GLM',
            provider: '智谱',
            desc: '中文、工具、结构化',
            icon: 'fa-cube',
            apiStyle: 'openai',
            baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
            modelHint: '填 BigModel 控制台可用模型名',
            caps: ['text', 'vision', 'long', 'json', 'tools'],
            system: '你擅长中文理解、结构化分析和工具型任务。输出要清楚、短、能用。'
        },
        {
            id: 'doubao',
            name: 'Doubao',
            provider: '火山方舟',
            desc: '中文、应用型任务、多模态',
            icon: 'fa-seedling',
            apiStyle: 'openai',
            baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
            modelHint: '填火山方舟 endpoint/model',
            caps: ['text', 'vision', 'long', 'json'],
            system: '你擅长中文应用型任务。先给可执行答案，再补必要说明。'
        },
        {
            id: 'yi',
            name: 'Yi',
            provider: '零一万物',
            desc: '中文写作、理解、问答',
            icon: 'fa-leaf',
            apiStyle: 'openai',
            baseUrl: 'https://api.lingyiwanwu.com/v1',
            modelHint: '填零一万物控制台可用模型名',
            caps: ['text', 'long', 'json'],
            system: '你擅长中文表达、问答和内容改写。少铺垫，直接产出。'
        },
        {
            id: 'grok',
            name: 'Grok',
            provider: 'xAI',
            desc: '讨论、推理、快速判断',
            icon: 'fa-xmark',
            apiStyle: 'openai',
            baseUrl: 'https://api.x.ai/v1',
            modelHint: '填 xAI 控制台可用模型名',
            caps: ['text', 'vision', 'long', 'reasoning', 'web_search'],
            system: '你擅长快速判断和直给式讨论。观点明确，理由简洁。'
        },
        {
            id: 'mistral',
            name: 'Mistral',
            provider: 'Mistral',
            desc: '轻快、代码、结构化',
            icon: 'fa-wind',
            apiStyle: 'openai',
            baseUrl: 'https://api.mistral.ai/v1',
            modelHint: '填 Mistral 控制台可用模型名',
            caps: ['text', 'long', 'json', 'tools'],
            system: '你擅长代码、结构化任务和简洁推理。输出要紧凑可靠。'
        },
        {
            id: 'perplexity',
            name: 'Perplexity',
            provider: 'Perplexity',
            desc: '问答、资料型任务',
            icon: 'fa-magnifying-glass',
            apiStyle: 'openai',
            baseUrl: 'https://api.perplexity.ai',
            modelHint: '填 Perplexity 控制台可用模型名',
            caps: ['text', 'long', 'json', 'web_search'],
            system: '你擅长资料型问答和结论整理。无法确认的内容要明确标注。'
        },
        {
            id: 'minimax',
            name: 'MiniMax',
            provider: 'MiniMax',
            desc: '长文本、角色对话、中文创作',
            icon: 'fa-star-half-stroke',
            apiStyle: 'openai',
            baseUrl: 'https://api.minimax.io/v1',
            modelHint: '填 MiniMax 控制台可用模型名，如 minimax-m2.6 / minimax-m2.5',
            caps: ['text', 'long', 'reasoning', 'json'],
            system: '你擅长长文本处理、角色对话和中文创作。回答要贴合上下文，别泛泛套话。'
        },
        {
            id: 'openrouter',
            name: 'OpenRouter',
            provider: 'OpenRouter',
            desc: '统一接入多个模型',
            icon: 'fa-route',
            apiStyle: 'openai',
            baseUrl: 'https://openrouter.ai/api/v1',
            modelHint: '填 OpenRouter 模型路由名',
            caps: ['text', 'vision', 'long', 'reasoning', 'json', 'tools', 'web_search'],
            system: '你是通过模型路由接入的助手。按当前模型实际能力回答，别虚构能力。'
        },
        {
            id: 'custom',
            name: '自定义',
            provider: '兼容接口',
            desc: '任何 OpenAI 兼容 API',
            icon: 'fa-plug',
            apiStyle: 'openai',
            baseUrl: '',
            modelHint: '填你的自定义模型名',
            caps: ['text', 'json'],
            system: '你是一个通用助手。按用户要求直接产出结果。'
        }
    ],

    render() {
        const WC = Modules.web_chat;
        const model = WC._model();
        const config = WC._config(model.id);
        const configured = WC._isConfigured(model.id);
        const visibleModels = WC._visibleModels();
        return `
        <div class="flex h-full bg-[#0b0b0d] text-white overflow-hidden">
            <aside class="w-80 shrink-0 border-r border-white/10 bg-[#111113] flex flex-col">
                <div class="p-4 border-b border-white/10">
                    <div class="flex items-center justify-between gap-3">
                        <div class="min-w-0">
                            <h2 class="text-base font-bold">网页对话</h2>
                            <p class="text-[11px] text-dim mt-1 truncate">每个模型接自己的 API</p>
                        </div>
                        <button class="h-9 w-9 rounded-lg bg-white text-black hover:bg-zinc-200 flex center" title="${WC.mode === 'room' ? '新会议' : '新对话'}" onclick="Modules.web_chat.${WC.mode === 'room' ? 'newRoomRecord' : 'newSession'}()">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                    <div class="grid grid-cols-2 gap-1.5 mt-3">
                        <button class="h-8 rounded-lg text-[11px] font-bold ${WC.mode === 'chat' ? 'bg-white text-black' : 'bg-white/5 text-gray-300 hover:bg-white/10'}" onclick="Modules.web_chat.setMode('chat')">
                            <i class="fa-solid fa-message mr-1"></i>单聊
                        </button>
                        <button class="h-8 rounded-lg text-[11px] font-bold ${WC.mode === 'room' ? 'bg-white text-black' : 'bg-white/5 text-gray-300 hover:bg-white/10'}" onclick="Modules.web_chat.setMode('room')">
                            <i class="fa-solid fa-people-arrows mr-1"></i>会议室
                        </button>
                    </div>
                </div>

                <div class="p-3 border-b border-white/10">
                    <div class="flex items-center justify-between mb-2">
                        <div class="text-[10px] text-dim font-bold uppercase tracking-wider">模型路由</div>
                        <span class="text-[10px] text-green-300">${WC._configuredCount()} 已配置</span>
                    </div>
                    <div class="grid grid-cols-2 gap-2 max-h-[42vh] overflow-y-auto pr-1">
                        ${visibleModels.map(m => WC._renderModelButton(m)).join('')}
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto p-2">
                    ${WC.mode === 'room' ? WC._renderRoomMini() : WC._renderSessions()}
                </div>

                <div class="p-3 border-t border-white/10 flex gap-2">
                    <button class="h-8 flex-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-300" onclick="Modules.web_chat.${WC.mode === 'room' ? 'exportMeeting' : 'exportCurrentSession'}()">
                        <i class="fa-solid fa-download mr-1"></i>导出
                    </button>
                    <button class="h-8 flex-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-300" onclick="Modules.web_chat.${WC.mode === 'room' ? 'clearMeeting' : 'clearCurrentSession'}()">
                        <i class="fa-solid fa-broom mr-1"></i>清空
                    </button>
                </div>
            </aside>

            <main class="flex-1 min-w-0 flex flex-col bg-[#0f0f11]">
                <header class="h-14 shrink-0 border-b border-white/10 flex items-center justify-between px-5 bg-[#111113]">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="h-9 w-9 rounded-lg bg-white/10 border border-white/10 flex center shrink-0">
                            <i class="fa-solid ${WC.mode === 'room' ? 'fa-people-group' : model.icon}"></i>
                        </div>
                        <div class="min-w-0">
                            <div class="text-sm font-bold truncate">${WC.mode === 'room' ? '多模型会议室' : model.name}</div>
                            <div class="text-[10px] text-dim truncate">${WC.mode === 'room' ? '共享上下文，多模型自由讨论' : `${model.provider} / ${configured ? (config.modelName || '已配置') : '需要配置 API'}`}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        ${WC.mode === 'chat' ? `
                            <button class="h-8 px-3 rounded-lg ${configured ? 'bg-green-500/10 text-green-300 border border-green-500/20' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'} hover:bg-white/10 text-[11px]" onclick="Modules.web_chat.openConfig('${model.id}')">
                                <i class="fa-solid fa-key mr-1"></i>${configured ? 'API 已配' : '配置 API'}
                            </button>
                            ${configured && !WC._isMasterModel(model.id) ? `
                            <button class="h-8 px-3 rounded-lg bg-accent/10 hover:bg-accent/15 text-accent border border-accent/20 text-[11px]" onclick="Modules.web_chat.setAsMaster('${model.id}')">
                                <i class="fa-solid fa-crown mr-1"></i>设为主控
                            </button>` : ''}
                            <button class="h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-300" onclick="Modules.web_chat.testCurrentModel()">
                                <i class="fa-solid fa-signal mr-1"></i>测试
                            </button>
                            <button class="h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-300" onclick="Modules.web_chat.copyLastAnswer()">
                                <i class="fa-solid fa-copy mr-1"></i>复制
                            </button>
                            <button class="h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-300" onclick="Modules.web_chat.regenerate()">
                                <i class="fa-solid fa-rotate-right mr-1"></i>重答
                            </button>
                        ` : `
                            <button class="h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-300" onclick="Modules.web_chat.summarizeMeeting()">
                                <i class="fa-solid fa-file-lines mr-1"></i>总结
                            </button>
                            <button class="h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-300" onclick="Modules.web_chat.exportMeeting()">
                                <i class="fa-solid fa-download mr-1"></i>导出
                            </button>
                        `}
                    </div>
                </header>

                ${WC._renderMobileSwitcher(model, visibleModels, configured, config)}
                ${WC._showRecords ? WC._renderRecordsPanel() : ''}
                ${WC.mode === 'room' ? WC._renderRoomMain() : WC._renderChatMain()}
            </main>
        </div>`;
    },

    _renderMobileSwitcher(model, visibleModels, configured, config) {
        const selected = this.room.participants || [];
        const ready = selected.filter(id => this._isConfigured(id)).length;
        const selectedModels = selected.map(id => this._modelById(id)).filter(Boolean);
        const selectedLabel = selectedModels.length
            ? selectedModels.slice(0, 3).map(m => m.name).join('、') + (selectedModels.length > 3 ? ` 等 ${selectedModels.length} 个` : '')
            : '请选择参会模型';
        return `
            <div class="webchat-mobile-switcher">
                <div class="webchat-mobile-tabs">
                    <button class="${!this._showRecords && this.mode === 'chat' ? 'active' : ''}" onclick="Modules.web_chat.setMode('chat')">
                        <i class="fa-solid fa-message"></i><span>单聊</span>
                    </button>
                    <button class="${!this._showRecords && this.mode === 'room' ? 'active' : ''}" onclick="Modules.web_chat.setMode('room')">
                        <i class="fa-solid fa-people-arrows"></i><span>会议室</span>
                    </button>
                    <button class="${this._showRecords ? 'active' : ''}" onclick="Modules.web_chat.toggleRecords()">
                        <i class="fa-solid fa-clock-rotate-left"></i><span>记录</span>
                    </button>
                </div>
                ${this.mode === 'chat' ? `
                    <div class="webchat-mobile-route-head">
                        <span><i class="fa-solid fa-route"></i>模型路由</span>
                        <b>${this._escape(model.provider)} / ${this._escape(configured ? (config.modelName || '已配置') : '需配置 API')}</b>
                    </div>
                    <div class="webchat-mobile-modelbar">
                        <select onchange="Modules.web_chat.switchModel(this.value)" aria-label="选择模型">
                            ${visibleModels.map(m => `
                                <option value="${this._attr(m.id)}" ${m.id === model.id ? 'selected' : ''}>
                                    ${this._escape(m.name)}${this._isMasterModel(m.id) ? ' · 主控' : (this._isConfigured(m.id) ? ' · 可用' : '')}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="webchat-mobile-chat-actions">
                        <button onclick="Modules.web_chat.openConfig('${model.id}')">
                            <i class="fa-solid fa-key"></i><span>API设置</span>
                        </button>
                        <button onclick="Modules.web_chat.newSession()">
                            <i class="fa-solid fa-plus"></i><span>新建</span>
                        </button>
                        <button onclick="Modules.web_chat.clearCurrentSession()" ${this.messages.length ? '' : 'disabled'}>
                            <i class="fa-solid fa-broom"></i><span>清空</span>
                        </button>
                        <button onclick="Modules.web_chat.toggleRecords()">
                            <i class="fa-solid fa-clock-rotate-left"></i><span>记录</span>
                        </button>
                    </div>
                ` : `
                    <div class="webchat-mobile-route-head webchat-mobile-room-head">
                        <span><i class="fa-solid fa-users"></i>参会模型</span>
                        <b>已选 ${selected.length} · ${ready} 可发言</b>
                    </div>
                    <div class="webchat-mobile-roomselect">
                        <button class="webchat-mobile-roomselect-trigger ${this._roomPickerOpen ? 'active' : ''}" onclick="Modules.web_chat.toggleRoomPicker()" ${this._roomRunning ? 'disabled' : ''}>
                            <span>${this._escape(selectedLabel)}</span>
                            <i class="fa-solid fa-chevron-down"></i>
                        </button>
                        ${this._roomPickerOpen ? `
                            <div class="webchat-mobile-roompicker" role="group" aria-label="选择会议室参会模型">
                                ${visibleModels.map(m => this._renderRoomParticipant(m, 'mobile')).join('')}
                            </div>
                        ` : ''}
                    </div>
                    <div class="webchat-mobile-roombar">
                        <span><i class="fa-solid fa-users"></i>${ready}/${selected.length} 可发言 · 共享上下文</span>
                        <button class="${this._roomRunning ? 'is-stopping' : ''}" onclick="Modules.web_chat.${this._roomRunning ? 'stopMeeting' : 'startMeeting'}()">
                            <i class="fa-solid ${this._roomRunning ? 'fa-pause' : 'fa-comments'}"></i>${this._roomRunning ? '暂停' : '开吵'}
                        </button>
                    </div>
                    <div class="webchat-mobile-room-actions">
                        <button onclick="Modules.web_chat.newRoomRecord()" ${this._roomRunning ? 'disabled' : ''}>
                            <i class="fa-solid fa-plus"></i><span>新会议</span>
                        </button>
                        <button onclick="Modules.web_chat.clearMeeting()" ${(this.room.messages || []).length && !this._roomRunning ? '' : 'disabled'}>
                            <i class="fa-solid fa-broom"></i><span>清空</span>
                        </button>
                        <button onclick="Modules.web_chat.toggleRecords()" ${this._roomRunning ? 'disabled' : ''}>
                            <i class="fa-solid fa-clock-rotate-left"></i><span>记录</span>
                        </button>
                    </div>
                `}
            </div>`;
    },

    _renderRecordsPanel() {
        const roomRecords = (this._memoryRecords || []).filter(r => r.kind === 'room');
        return `
            <div class="webchat-records-panel border-b border-white/10 bg-[#0d0d10] px-4 py-3">
                <div class="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div class="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div class="flex items-center justify-between mb-2">
                            <div class="text-xs font-bold text-white"><i class="fa-solid fa-message mr-1 text-blue-300"></i>单聊记录</div>
                            <button class="text-[10px] text-dim hover:text-white" onclick="Modules.web_chat.newSession()">新对话</button>
                        </div>
                        <div class="space-y-1 max-h-56 overflow-y-auto">
                            ${this.sessions.length ? this.sessions.slice(0, 12).map(s => `
                                <button class="w-full text-left rounded-lg px-2 py-2 ${s.id === this.currentSessionId && this.mode === 'chat' ? 'bg-blue-500/15 border border-blue-500/20' : 'bg-black/20 hover:bg-white/[0.06] border border-transparent'}" onclick="Modules.web_chat.openChatRecord('${s.id}')">
                                    <div class="text-[11px] font-bold text-white truncate">${this._escape(s.title || '新对话')}</div>
                                    <div class="text-[10px] text-dim truncate mt-0.5">${this._escape(s.preview || '空会话')}</div>
                                </button>
                            `).join('') : '<div class="text-[11px] text-dim py-5 text-center">暂无单聊记录</div>'}
                        </div>
                    </div>
                    <div class="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div class="flex items-center justify-between mb-2">
                            <div class="text-xs font-bold text-white"><i class="fa-solid fa-people-group mr-1 text-purple-300"></i>会议室记录</div>
                            <button class="text-[10px] text-dim hover:text-white" onclick="Modules.web_chat.newRoomRecord()">新会议</button>
                        </div>
                        <div class="space-y-1 max-h-56 overflow-y-auto">
                            ${roomRecords.length ? roomRecords.slice(0, 12).map(r => `
                                <button class="w-full text-left rounded-lg px-2 py-2 ${r.id === this.room.id && this.mode === 'room' ? 'bg-purple-500/15 border border-purple-500/20' : 'bg-black/20 hover:bg-white/[0.06] border border-transparent'}" onclick="Modules.web_chat.selectRoomRecord('${r.id}')">
                                    <div class="text-[11px] font-bold text-white truncate">${this._escape(r.title || '会议记录')}</div>
                                    <div class="text-[10px] text-dim truncate mt-0.5">${this._escape(r.preview || '')}</div>
                                </button>
                            `).join('') : '<div class="text-[11px] text-dim py-5 text-center">暂无会议记录</div>'}
                        </div>
                    </div>
                </div>
            </div>`;
    },

    _renderChatMain() {
        return `
            <section class="flex-1 overflow-y-auto" id="webchat-scroll">
                <div class="max-w-3xl mx-auto px-5 py-8 space-y-6" id="webchat-messages">
                    ${this._renderMessages()}
                </div>
            </section>
            <footer class="shrink-0 border-t border-white/10 bg-[#111113] px-5 py-4">
                <div class="max-w-3xl mx-auto">
                    ${this._renderAttachmentBar()}
                    ${this._renderEditBar()}
                    <div class="rounded-2xl border border-white/10 bg-black/30 focus-within:border-white/25 transition">
                        ${this._renderRunControls('chat')}
                        <textarea id="webchat-input" class="w-full min-h-[76px] max-h-48 bg-transparent resize-none outline-none p-4 text-sm text-white placeholder-white/30" placeholder="问任何问题，Shift+Enter 换行" oninput="Modules.web_chat._draftBeforeRefresh=this.value;Modules.web_chat.autoGrow(this)" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();Modules.web_chat.sendMessage()}">${this._escape(this._draftBeforeRefresh)}</textarea>
                        <div class="flex items-center justify-between px-3 pb-3 gap-3">
                            <div class="flex gap-1.5 min-w-0">
                                <button class="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-gray-300 flex center" title="添加图片或文本附件" onclick="document.getElementById('webchat-files')?.click()">
                                    <i class="fa-solid fa-paperclip"></i>
                                </button>
                                ${['总结', '翻译', '润色', '写代码', 'JSON'].map(t => `
                                    <button class="h-7 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-gray-300" onclick="Modules.web_chat.fillPrompt('${t}')">${t}</button>
                                `).join('')}
                            </div>
                            <button id="webchat-send" class="h-9 w-9 rounded-xl ${this._generating ? 'bg-white/20 text-white/50' : 'bg-white text-black hover:bg-zinc-200'} flex center shrink-0" onclick="Modules.web_chat.sendMessage()" ${this._generating ? 'disabled' : ''}>
                                <i class="fa-solid ${this._generating ? 'fa-spinner fa-spin' : 'fa-arrow-up'}"></i>
                            </button>
                        </div>
                    </div>
                    <input id="webchat-files" type="file" multiple class="hidden" accept="image/*,.txt,.md,.json,.csv" onchange="Modules.web_chat.handleFiles(this)">
                    <div class="text-[10px] text-dim text-center mt-2">模型能力以你配置的 API 和模型名为准；重要内容自己复核。</div>
                </div>
            </footer>`;
    },

    _renderRoomMain() {
        return `
            <section class="flex-1 overflow-y-auto" id="webchat-scroll">
                <div class="max-w-5xl mx-auto px-5 py-6 space-y-5" id="webchat-messages">
                    <div class="webchat-room-controls rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div class="flex items-center justify-between gap-3 mb-3">
                            <div>
                                <div class="text-sm font-bold">共享上下文会议桌</div>
                                <div class="text-[10px] text-dim mt-1">每个模型都能看到完整记录；没新观点会沉默，讨论会自己收束。</div>
                            </div>
                            ${this._renderRoomTurnsControl()}
                        </div>
                        <div class="webchat-room-participants grid grid-cols-2 md:grid-cols-4 gap-2">
                            ${this._visibleModels().map(m => this._renderRoomParticipant(m)).join('')}
                        </div>
                        ${this._renderTerminalPanel()}
                    </div>
                    ${this._renderMeetingMessages()}
                </div>
            </section>
            <footer class="shrink-0 border-t border-white/10 bg-[#111113] px-5 py-4">
                <div class="max-w-5xl mx-auto">
                    <div class="rounded-2xl border border-white/10 bg-black/30 focus-within:border-white/25 transition">
                        ${this._renderRunControls('room')}
                        <textarea id="webchat-room-topic" class="w-full min-h-[72px] max-h-40 bg-transparent resize-none outline-none p-4 text-sm text-white placeholder-white/30" placeholder="丢一个议题；可点名 DeepSeek / Claude，没点名则参会模型各答一遍" oninput="Modules.web_chat.room.draft=this.value;Modules.web_chat.autoGrow(this)" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();Modules.web_chat.startMeeting()}">${this._escape(this.room.draft || '')}</textarea>
                        <div class="webchat-room-composer-actions flex items-center justify-between px-3 pb-3 gap-3">
                            <div class="text-[10px] text-dim truncate">${this.room.messages.length ? '点名则指定模型答；不点名则参会模型各答一遍。' : '建议 2-4 个模型，越多越慢、越耗额度。'}</div>
                            <div class="flex gap-2 shrink-0">
                                ${this._roomRunning ? `
                                <button class="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300" onclick="Modules.web_chat.stopMeeting()">
                                    <i class="fa-solid fa-pause mr-1"></i>暂停
                                </button>` : ''}
                                <button class="h-9 px-4 rounded-xl ${this._roomRunning ? 'bg-white/20 text-white/50' : 'bg-white text-black hover:bg-zinc-200'} text-xs font-bold" onclick="Modules.web_chat.startMeeting()" ${this._roomRunning ? 'disabled' : ''}>
                                    <i class="fa-solid ${this._roomRunning ? 'fa-spinner fa-spin' : 'fa-comments'} mr-1"></i>${this._roomRunning ? '讨论中' : (this.room.messages.length ? '继续讨论' : '丢进会议室')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>`;
    },

    _renderModelButton(m) {
        const active = this.currentModel === m.id;
        const configured = this._isConfigured(m.id);
        const isMaster = this._isMasterModel(m.id);
        return `
            <button class="group rounded-lg border ${active ? 'border-white/30 bg-white/15 text-white' : 'border-white/5 bg-white/[0.03] text-gray-400 hover:bg-white/[0.07]'} p-2 text-left transition min-w-0" onclick="Modules.web_chat.switchModel('${m.id}')">
                <div class="flex items-center justify-between gap-2">
                    <div class="text-xs font-bold truncate"><i class="fa-solid ${m.icon} mr-1"></i>${m.name}</div>
                    <span class="h-2 w-2 rounded-full shrink-0 ${configured ? 'bg-green-400' : 'bg-amber-400/70'}" title="${configured ? '已配置' : '需要 API'}"></span>
                </div>
                <div class="text-[9px] opacity-70 mt-1 truncate">${m.desc}</div>
                <div class="flex items-center justify-between gap-2 mt-2">
                    <span class="text-[9px] ${isMaster ? 'text-accent' : (configured ? 'text-green-300' : 'text-amber-300')}">${isMaster ? '主控' : (configured ? '可用' : '需配置')}</span>
                    <span class="text-[9px] text-dim hover:text-white" onclick="event.stopPropagation();Modules.web_chat.openConfig('${m.id}')">设置</span>
                </div>
            </button>`;
    },

    _renderSessions() {
        if (!this.sessions.length) {
            return `
                <div class="h-full flex flex-col items-center justify-center text-center text-dim px-5">
                    <i class="fa-solid fa-comments text-3xl opacity-30 mb-3"></i>
                    <div class="text-sm text-white/80">没有会话</div>
                    <div class="text-[11px] mt-2">点加号开始</div>
                </div>`;
        }
        return this.sessions.map(s => `
            <button class="group w-full text-left rounded-lg border ${s.id === this.currentSessionId ? 'border-white/20 bg-white/10' : 'border-transparent hover:bg-white/[0.06]'} p-3 mb-1 transition" onclick="Modules.web_chat.selectSession('${s.id}')">
                <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0 flex-1">
                        <div class="text-xs font-bold text-white truncate">${this._escape(s.title || '新对话')}</div>
                        <div class="text-[10px] text-dim truncate mt-1">${this._escape(s.preview || '空会话')}</div>
                    </div>
                    <span class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300" onclick="event.stopPropagation();Modules.web_chat.deleteSession('${s.id}')">
                        <i class="fa-solid fa-trash text-xs"></i>
                    </span>
                </div>
            </button>`).join('');
    },

    _renderRoomMini() {
        const configured = this.room.participants.filter(id => this._isConfigured(id)).length;
        return `
            <div class="p-3 rounded-xl border border-white/10 bg-white/[0.03]">
                <div class="text-xs font-bold text-white">会议室状态</div>
                <div class="text-[10px] text-dim mt-2 leading-relaxed">
                    已选 ${this.room.participants.length} 个模型，${configured} 个可发言。<br>
                    共享记录 ${this.room.messages.length} 条。
                </div>
                <button class="mt-3 h-8 w-full rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-300" onclick="Modules.web_chat.setMode('room')">
                    打开会议室
                </button>
            </div>`;
    },

    _renderMessages() {
        if (!this.messages.length) {
            const model = this._model();
            const configured = this._isConfigured(model.id);
            return `
                <div class="min-h-[55vh] flex items-center justify-center">
                    <div class="text-center max-w-xl">
                        <div class="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex center mx-auto mb-5">
                            <i class="fa-solid ${model.icon} text-2xl"></i>
                        </div>
                        <h3 class="text-2xl font-bold">${model.name}</h3>
                        <p class="text-sm text-dim mt-2">${model.desc}</p>
                        <div class="flex flex-wrap justify-center gap-1.5 mt-4">${this._renderCaps(model.id)}</div>
                        ${configured ? `
                            <div class="grid grid-cols-2 gap-2 mt-6">
                                ${[
                                    ['解释一下这个概念：', '解释概念'],
                                    ['帮我把这段话改得更清楚：', '润色文本'],
                                    ['给我三个方案：', '方案对比'],
                                    ['检查这段代码的问题：', '代码诊断']
                                ].map(([prompt, label]) => `
                                    <button class="rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] p-3 text-left text-sm" onclick="Modules.web_chat.setInput('${this._attr(prompt)}')">${label}</button>
                                `).join('')}
                            </div>
                        ` : `
                            <button class="mt-6 h-10 px-5 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-bold" onclick="Modules.web_chat.openConfig('${model.id}')">
                                <i class="fa-solid fa-key mr-2"></i>先配置 ${model.name} API
                            </button>
                            <div class="text-[11px] text-dim mt-3">填 key、base URL、模型名后再用。密钥只存在当前浏览器存储。</div>
                        `}
                    </div>
                </div>`;
        }

        return this.messages.map((m, i) => {
            const isUser = m.role === 'user';
            const isEditing = isUser && this._editingMessageIndex === i;
            const mm = this._messageModel(m);
            return `
                <div class="flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}">
                    ${isUser ? '' : `<div class="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex center shrink-0"><i class="fa-solid ${mm.icon} text-xs"></i></div>`}
                    <div class="${isUser ? 'webchat-user-message max-w-[78%]' : 'webchat-assistant-message max-w-[86%] flex-1'}">
                        ${isUser ? `<div class="text-[10px] text-dim mb-1 text-right">${this._escape(this._chatMessageLabel(m))}</div>` : `<div class="text-[10px] text-dim mb-1">${this._escape(this._chatMessageLabel(m))}</div>`}
                        ${isEditing ? this._renderInlineUserEditor(m, i) : `
                        <div class="rounded-2xl ${isUser ? 'webchat-user-bubble bg-white text-black' : 'bg-white/[0.06] border border-white/10 text-gray-100 markdown-body'} px-4 py-3 text-sm leading-relaxed">
                            ${isUser ? '' : this._renderRunTrace(m)}
                            ${isUser ? this._renderUserContent(m.content || '') : this._renderMarkdown(m.content || (m.streaming ? '请求中...' : ''))}
                            ${this._renderMessageAttachments(m)}
                        </div>
                        `}
                        ${isEditing ? '' : `
                        <div class="webchat-message-actions flex gap-3 mt-1 px-1 ${isUser ? 'justify-end' : ''}">
                            <button class="text-[10px] text-dim hover:text-white" onclick="Modules.web_chat.copyMessage(${i})"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                            ${isUser && !m.streaming ? `<button class="text-[10px] text-dim hover:text-white" onclick="Modules.web_chat.editMessage(${i})"><i class="fa-solid fa-pen mr-1"></i>编辑</button>` : ''}
                            ${!isUser && !m.streaming ? `<button class="text-[10px] text-dim hover:text-white" onclick="Modules.web_chat.retryMessage(${i})"><i class="fa-solid fa-rotate-right mr-1"></i>重试</button>` : ''}
                        </div>
                        `}
                    </div>
                </div>`;
        }).join('');
    },

    _renderInlineUserEditor(m, index) {
        const draft = this._editingMessageIndex === index ? this._editingDraft : (m.content || '');
        return `
            <div class="webchat-inline-edit rounded-2xl bg-white border border-amber-400/50 px-3 py-3 shadow-lg shadow-black/20">
                <textarea id="webchat-inline-edit-${index}" class="w-full min-h-[118px] max-h-80 resize-none rounded-xl border border-black/10 bg-black/[0.04] p-3 text-sm leading-relaxed text-black outline-none focus:border-amber-500/70" oninput="Modules.web_chat._editingDraft=this.value;Modules.web_chat.autoGrow(this)" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();Modules.web_chat.saveInlineEdit(${index})}">${this._escape(draft)}</textarea>
                ${this._renderMessageAttachments(m)}
                <div class="mt-2 flex items-center justify-between gap-2">
                    <div class="min-w-0 truncate text-[10px] text-black/55">
                        保存后会从第 ${this._turnNumberForIndex(index)} 轮重新生成，后面的回复会被替换。
                    </div>
                    <div class="flex shrink-0 gap-2">
                        <button class="h-8 px-3 rounded-lg bg-black/5 hover:bg-black/10 text-[11px] text-black" onclick="Modules.web_chat.cancelEdit()">取消</button>
                        <button class="h-8 px-3 rounded-lg bg-black text-white hover:bg-zinc-800 text-[11px] font-bold" onclick="Modules.web_chat.saveInlineEdit(${index})">
                            <i class="fa-solid fa-rotate-right mr-1"></i>重新生成
                        </button>
                    </div>
                </div>
            </div>`;
    },

    _renderMeetingMessages() {
        if (!this.room.messages.length) {
            return `
                <div class="min-h-[34vh] flex items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-center px-6">
                    <div>
                        <div class="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex center mx-auto mb-4">
                            <i class="fa-solid fa-people-group text-xl"></i>
                        </div>
                        <div class="text-lg font-bold">把问题丢进会议室</div>
                        <div class="text-xs text-dim mt-2 max-w-md leading-relaxed">可直接点名模型；没点名时，当前参会且已配置的模型会各回答一遍。</div>
                    </div>
                </div>`;
        }
        return this.room.messages.map((m, i) => {
            const model = m.modelId ? this._modelById(m.modelId) : null;
            const isUser = m.role === 'user';
            const isTerminal = m.role === 'terminal';
            const isEditing = isUser && this._roomEditingIndex === i;
            const title = isUser ? '我' : (isTerminal ? '沙盒终端' : (m.role === 'host' ? '主持人总结' : `${model?.name || '模型'} · 发言 ${m.turn || ''}`.trim()));
            const icon = isUser ? 'fa-bullseye' : (isTerminal ? 'fa-terminal' : (m.role === 'host' ? 'fa-file-lines' : (model?.icon || 'fa-robot')));
            return `
                <div class="rounded-2xl border ${isUser ? 'webchat-user-bubble border-white/20 bg-white text-black' : (isTerminal ? 'webchat-terminal-message border-green-400/20 bg-green-400/[0.06] text-gray-100' : 'border-white/10 bg-white/[0.05] text-gray-100')} p-4">
                    <div class="flex items-center justify-between gap-3 mb-2">
                        <div class="text-xs font-bold ${isUser ? 'text-black' : 'text-white'}">
                            <i class="fa-solid ${icon} mr-1"></i>${this._escape(title)}
                        </div>
                        ${m.streaming ? '<span class="text-[10px] text-amber-300"><i class="fa-solid fa-spinner fa-spin mr-1"></i>发言中</span>' : ''}
                    </div>
                    ${isEditing ? this._renderInlineRoomEditor(m, i) : `<div class="text-sm leading-relaxed ${isUser ? '' : 'markdown-body'}">${isUser ? this._renderUserContent(m.content || '') : `${this._renderRunTrace(m)}${this._renderMarkdown(m.content || '')}`}</div>`}
                    ${m.streaming || isEditing ? '' : `
                    <div class="webchat-message-actions flex gap-3 mt-2 ${isUser ? 'justify-end' : ''}">
                        <button class="text-[10px] ${isUser ? 'text-black/55 hover:text-black' : 'text-dim hover:text-white'}" onclick="Modules.web_chat.copyRoomMessage(${i})"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                        ${isUser ? `<button class="text-[10px] text-black/55 hover:text-black" onclick="Modules.web_chat.editRoomMessage(${i})"><i class="fa-solid fa-pen mr-1"></i>编辑</button>` : ''}
                        ${!isUser && !isTerminal ? `<button class="text-[10px] text-dim hover:text-white" onclick="Modules.web_chat.retryRoomMessage(${i})"><i class="fa-solid fa-rotate-right mr-1"></i>重试</button>` : ''}
                    </div>`}
                </div>`;
        }).join('');
    },

    _renderInlineRoomEditor(m, index) {
        const draft = this._roomEditingIndex === index ? this._roomEditingDraft : (m.content || '');
        return `
            <div class="webchat-inline-edit rounded-xl bg-white border border-amber-400/50 p-2">
                <textarea id="webchat-room-inline-edit-${index}" class="w-full min-h-[92px] max-h-72 resize-none rounded-lg border border-black/10 bg-black/[0.04] p-3 text-sm leading-relaxed text-black outline-none focus:border-amber-500/70" oninput="Modules.web_chat._roomEditingDraft=this.value;Modules.web_chat.autoGrow(this)" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();Modules.web_chat.saveRoomEdit(${index})}">${this._escape(draft)}</textarea>
                <div class="mt-2 flex items-center justify-end gap-2">
                    <button class="h-8 px-3 rounded-lg bg-black/5 hover:bg-black/10 text-[11px] text-black" onclick="Modules.web_chat.cancelRoomEdit()">取消</button>
                    <button class="h-8 px-3 rounded-lg bg-black text-white hover:bg-zinc-800 text-[11px] font-bold" onclick="Modules.web_chat.saveRoomEdit(${index})">
                        <i class="fa-solid fa-rotate-right mr-1"></i>保存并重跑
                    </button>
                </div>
            </div>`;
    },

    _renderRoomParticipant(m, variant = 'default') {
        const selected = this.room.participants.includes(m.id);
        const configured = this._isConfigured(m.id);
        const compact = variant === 'mobile';
        return `
            <label class="webchat-room-participant ${compact ? 'webchat-room-participant-mobile' : ''} ${selected ? 'is-selected border-white/30 bg-white/10' : 'border-white/10 bg-black/20 hover:bg-white/[0.06]'} ${this._roomRunning ? 'is-disabled' : ''} rounded-xl border p-3 text-left transition">
                <input type="checkbox" class="webchat-room-checkbox" value="${this._attr(m.id)}" aria-label="选择 ${this._attr(m.name)}" ${selected ? 'checked' : ''} ${this._roomRunning ? 'disabled' : ''} onchange="Modules.web_chat.toggleRoomParticipant('${m.id}')">
                <div class="flex items-center justify-between gap-2">
                    <div class="min-w-0 flex items-center gap-1.5">
                        <span class="webchat-room-check"><i class="fa-solid fa-check"></i></span>
                        <div class="text-xs font-bold truncate"><i class="fa-solid ${m.icon} mr-1"></i>${this._escape(m.name)}</div>
                    </div>
                    <span class="shrink-0 text-[9px] ${configured ? 'text-green-300' : 'text-amber-300'}">${configured ? '可用' : '需 API'}</span>
                </div>
                <div class="text-[10px] text-dim mt-1 truncate">${this._escape(compact ? m.desc : m.provider)}</div>
            </label>`;
    },

    _renderTerminalPanel() {
        const requests = this.room.terminalRequests || [];
        const latest = requests.slice(-3).reverse();
        return `
            <div class="webchat-terminal-panel mt-3 rounded-xl border border-white/10 bg-black/25">
                <div class="webchat-terminal-head">
                    <div class="min-w-0">
                        <div class="text-xs font-bold text-white"><i class="fa-solid fa-terminal mr-1 text-green-300"></i>沙盒终端</div>
                        <div class="text-[10px] text-dim mt-0.5">模型只能提交终端请求；运行前必须由你确认。</div>
                    </div>
                    <div class="flex gap-1 shrink-0">
                        <button class="webchat-terminal-mini" onclick="Modules.web_chat.addManualTerminalRequest()"><i class="fa-solid fa-plus mr-1"></i>命令</button>
                        <button class="webchat-terminal-mini" onclick="Modules.web_chat.clearTerminalRequests()" ${requests.length ? '' : 'disabled'}><i class="fa-solid fa-broom mr-1"></i>清空</button>
                    </div>
                </div>
                ${latest.length ? `
                    <div class="webchat-terminal-list">
                        ${latest.map(req => this._renderTerminalRequest(req)).join('')}
                    </div>
                ` : `
                    <div class="webchat-terminal-empty">
                        让模型按格式输出：<code>【终端请求】目的：... 命令：... 风险：...</code><br>
                        真实运行需要本地桥：<code>node tools/sandbox-terminal-server.mjs</code>
                    </div>
                `}
            </div>`;
    },

    _renderTerminalRequest(req) {
        const model = this._modelById(req.modelId || '');
        const statusMap = {
            pending: '待运行',
            running: '运行中',
            done: '已完成',
            failed: '失败'
        };
        return `
            <div class="webchat-terminal-item">
                <div class="flex items-center justify-between gap-2">
                    <div class="text-[10px] text-dim truncate">
                        <i class="fa-solid ${model?.icon || 'fa-robot'} mr-1"></i>${this._escape(model?.name || '手动命令')} · ${this._escape(statusMap[req.status] || '待运行')}
                    </div>
                    <div class="flex gap-1 shrink-0">
                        <button class="webchat-terminal-mini" onclick="Modules.web_chat.copyTerminalCommand('${this._attr(req.id)}')">复制</button>
                        <button class="webchat-terminal-mini run" onclick="Modules.web_chat.runTerminalRequest('${this._attr(req.id)}')" ${req.status === 'running' ? 'disabled' : ''}>运行</button>
                    </div>
                </div>
                <pre>${this._escape(req.command || '')}</pre>
                ${req.reason ? `<div class="webchat-terminal-note">目的：${this._escape(req.reason)}</div>` : ''}
                ${req.risk ? `<div class="webchat-terminal-note warn">风险：${this._escape(req.risk)}</div>` : ''}
                ${req.output ? `<details class="webchat-terminal-output" open><summary>输出</summary><pre>${this._escape(req.output)}</pre></details>` : ''}
            </div>`;
    },

    _renderRoomTurnsControl() {
        const presets = [8, 12, 16, 24];
        const current = Math.max(1, Math.min(120, Math.floor(Number(this.room.maxTurns) || 12)));
        const presetValue = this._roomTurnsCustom || !presets.includes(current) ? 'custom' : String(current);
        return `
            <div class="webchat-room-turns text-right shrink-0">
                <div class="text-[10px] text-dim">发言次数</div>
                <div class="webchat-room-turns-row">
                    <select class="h-8 rounded-lg bg-black/30 border border-white/10 px-2 text-xs text-white mt-1" onchange="Modules.web_chat.setRoomMaxTurnsPreset(this.value)">
                        ${presets.map(n => `<option value="${n}" ${presetValue === String(n) ? 'selected' : ''}>${n} 次发言</option>`).join('')}
                        <option value="custom" ${presetValue === 'custom' ? 'selected' : ''}>自定义</option>
                    </select>
                    <input id="webchat-room-custom-turns" class="h-8 rounded-lg bg-black/30 border border-white/10 px-2 text-xs text-white mt-1 ${presetValue === 'custom' ? '' : 'hidden'}" type="number" inputmode="numeric" min="1" max="120" value="${current}" onchange="Modules.web_chat.setRoomMaxTurns(this.value)" onkeydown="if(event.key==='Enter'){this.blur()}">
                </div>
                <div class="webchat-room-turns-hint text-[9px] text-dim mt-1">上限 1-120</div>
            </div>`;
    },

    _renderAttachmentBar() {
        if (!this._pendingFiles.length) return '';
        return `
            <div class="flex flex-wrap gap-2 mb-2">
                ${this._pendingFiles.map((f, i) => `
                    <div class="h-7 rounded-lg border border-white/10 bg-white/[0.05] px-2 flex items-center gap-2 text-[10px] text-gray-300">
                        <i class="fa-solid ${f.type === 'image' ? 'fa-image' : 'fa-file-lines'}"></i>
                        <span class="max-w-[160px] truncate">${this._escape(f.name)}</span>
                        <button class="text-dim hover:text-white" onclick="Modules.web_chat.removeAttachment(${i})"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                `).join('')}
            </div>`;
    },

    _renderRunControls(scope = 'chat') {
        const ids = scope === 'room'
            ? (this.room.participants || []).filter(id => this._isConfigured(id))
            : [this.currentModel];
        const hasReasoning = ids.some(id => this._capEnabled(id, 'reasoning'));
        const hasSearch = ids.some(id => this._capEnabled(id, 'web_search'));
        const thinkActive = !!this.runOptions.deepThink;
        const searchActive = !!this.runOptions.webSearch;
        const status = scope === 'room'
            ? '会议室会按每个模型能力尝试'
            : `${this._modelById(this.currentModel)?.name || '模型'}：${hasReasoning || hasSearch ? '按能力尝试' : '提示词增强'}`;
        return `
            <div class="webchat-run-controls">
                <button class="webchat-run-toggle ${thinkActive ? 'active' : ''} ${hasReasoning ? '' : 'soft'}" title="${hasReasoning ? '当前模型标注了推理能力' : '未标注原生推理，也会用提示词增强'}" onclick="Modules.web_chat.toggleRunOption('deepThink')">
                    <i class="fa-solid fa-brain"></i><span>深度思考</span>
                </button>
                <button class="webchat-run-toggle ${searchActive ? 'active' : ''} ${hasSearch ? '' : 'soft'}" title="${hasSearch ? '当前模型标注了联网/搜索能力' : '未标注原生联网，会要求模型说明检索状态'}" onclick="Modules.web_chat.toggleRunOption('webSearch')">
                    <i class="fa-solid fa-globe"></i><span>联网</span>
                </button>
                <span class="webchat-run-status">${this._escape(status)}</span>
            </div>`;
    },

    _renderEditBar() {
        return '';
    },

    _renderMessageAttachments(m) {
        if (!m.attachments || !m.attachments.length) return '';
        return `
            <div class="flex flex-wrap gap-1.5 mt-2">
                ${m.attachments.map(f => `
                    <span class="text-[10px] rounded-md ${m.role === 'user' ? 'bg-black/10 text-black/70' : 'bg-white/10 text-gray-300'} px-2 py-1">
                        <i class="fa-solid ${f.type === 'image' ? 'fa-image' : 'fa-file-lines'} mr-1"></i>${this._escape(f.name)}
                    </span>
                `).join('')}
            </div>`;
    },

    _renderCaps(id) {
        const labels = {
            text: '文本',
            vision: '图像输入',
            long: '长上下文',
            reasoning: '推理',
            json: 'JSON',
            tools: '原生工具',
            web_search: '联网'
        };
        return ['text', 'vision', 'long', 'reasoning', 'web_search', 'json', 'tools'].filter(cap => this._capEnabled(id, cap)).map(cap => `
            <span class="text-[10px] rounded-full bg-white/5 border border-white/10 text-gray-300 px-2 py-1">${labels[cap] || cap}</span>
        `).join('');
    },

    async init() {
        await this._loadConfigs();
        await this._loadPoolModels();
        await this._loadWebChatMemory();
        await this._loadRoom();
        this._normalizeCurrentModel();
        await this._loadSessions();
        if (!this.sessions.length) await this.newSession(false);
        if (!this.currentSessionId && this.sessions[0]) this.currentSessionId = this.sessions[0].id;
        await this._loadMessages(this.currentSessionId);
        this.refresh();
        this._scrollBottom();
    },

    refresh(options = {}) {
        const input = document.getElementById('webchat-input');
        if (input) this._draftBeforeRefresh = input.value;
        const topic = document.getElementById('webchat-room-topic');
        if (topic) this.room.draft = topic.value;
        const scroller = document.getElementById('webchat-scroll');
        const keepTop = scroller ? scroller.scrollTop : 0;
        const shouldFollow = options.forceScroll || this._shouldAutoScroll(scroller);
        const view = document.getElementById('module-view-web_chat');
        if (view) view.innerHTML = this.render();
        setTimeout(() => {
            const nextInput = document.getElementById(this.mode === 'room' ? 'webchat-room-topic' : 'webchat-input');
            if (nextInput && !this._generating && !this._roomRunning) {
                this.autoGrow(nextInput);
                nextInput.focus();
                nextInput.selectionStart = nextInput.selectionEnd = nextInput.value.length;
            }
            const nextScroller = document.getElementById('webchat-scroll');
            if (nextScroller && scroller) {
                if (shouldFollow) nextScroller.scrollTop = nextScroller.scrollHeight;
                else nextScroller.scrollTop = keepTop;
            }
        }, 20);
    },

    _renderMessagesOnly(forceScroll = false) {
        const scroller = document.getElementById('webchat-scroll');
        const keepTop = scroller ? scroller.scrollTop : 0;
        const shouldFollow = forceScroll || this._shouldAutoScroll(scroller);
        const el = document.getElementById('webchat-messages');
        if (el) el.innerHTML = this.mode === 'room' ? this._renderRoomMainMessagesOnly() : this._renderMessages();
        if (shouldFollow) this._scrollBottom();
        else if (scroller) scroller.scrollTop = keepTop;
    },

    _renderRoomMainMessagesOnly() {
        return `
            <div class="webchat-room-controls rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div class="flex items-center justify-between gap-3 mb-3">
                    <div>
                        <div class="text-sm font-bold">共享上下文会议桌</div>
                        <div class="text-[10px] text-dim mt-1">每个模型都能看到完整记录；没新观点会沉默，讨论会自己收束。</div>
                    </div>
                    ${this._renderRoomTurnsControl()}
                </div>
                <div class="webchat-room-participants grid grid-cols-2 md:grid-cols-4 gap-2">
                    ${this._visibleModels().map(m => this._renderRoomParticipant(m)).join('')}
                </div>
                ${this._renderTerminalPanel()}
            </div>
            ${this._renderMeetingMessages()}`;
    },

    async _loadSessions() {
        try {
            const saved = await DB.get('settings', 'web_chat_sessions_simple');
            this.sessions = saved?.sessions || [];
            this.currentSessionId = saved?.currentSessionId || this.sessions[0]?.id || null;
        } catch (e) {
            this.sessions = [];
        }
    },

    async _saveSessions() {
        await DB.put('settings', { id: 'web_chat_sessions_simple', sessions: this.sessions, currentSessionId: this.currentSessionId });
    },

    async _loadMessages(id) {
        if (!id) {
            this.messages = [];
            return;
        }
        try {
            const saved = await DB.get('settings', `web_chat_messages_simple_${id}`);
            this.messages = saved?.messages || [];
        } catch (e) {
            this.messages = [];
        }
    },

    async _saveMessages() {
        if (!this.currentSessionId) return;
        await DB.put('settings', { id: `web_chat_messages_simple_${this.currentSessionId}`, messages: this.messages });
        await this._syncCurrentChatMemory();
    },

    async _loadConfigs() {
        try {
            const saved = await DB.get('settings', 'web_chat_model_configs_v1');
            this.configs = saved?.configs || {};
        } catch (e) {
            this.configs = {};
        }
    },

    async _saveConfigs() {
        await DB.put('settings', { id: 'web_chat_model_configs_v1', configs: this.configs });
    },

    async _loadPoolModels() {
        try {
            const pool = await DB.getAll('text_api_pool');
            this.poolModels = (pool || []).map(api => this._poolApiToModel(api));
        } catch (e) {
            this.poolModels = [];
        }
    },

    _poolApiToModel(api) {
        const providerMap = {
            custom: ['OpenAI 兼容', 'fa-robot', ['text', 'json']],
            gemini: ['Google Gemini', 'fa-gem', ['text', 'vision', 'long', 'json', 'web_search']],
            claude: ['Anthropic', 'fa-feather', ['text', 'vision', 'long', 'reasoning', 'web_search']],
            azure: ['Azure OpenAI', 'fa-cloud', ['text', 'vision', 'long', 'json']],
            ollama: ['Ollama 本地', 'fa-server', ['text', 'json']],
            deepseek: ['DeepSeek', 'fa-code', ['text', 'long', 'reasoning', 'json']],
            minimax: ['MiniMax', 'fa-star-half-stroke', ['text', 'long', 'reasoning', 'json']],
            openrouter: ['OpenRouter', 'fa-route', ['text', 'vision', 'long', 'reasoning', 'json', 'web_search']]
        };
        const meta = providerMap[api.provider] || providerMap.custom;
        return {
            id: `pool_${api.id}`,
            poolId: api.id,
            name: api.config_name || api.model_name || '未命名模型',
            provider: meta[0],
            providerId: api.provider || 'custom',
            desc: api.is_master === 1 || api.is_active === 1 ? '全系统主控' : '来自系统设置 · 网页对话可用',
            icon: meta[1],
            apiStyle: this._providerToStyle(api.provider),
            baseUrl: api.base_url || '',
            modelHint: api.model_name || '模型名',
            caps: meta[2],
            system: '你是一个由用户配置的模型。按模型自身能力完成任务，不虚构权限或能力。',
            isMaster: api.is_master === 1 || api.is_active === 1,
            poolApi: api
        };
    },

    async _loadRoom() {
        try {
            const saved = await DB.get('settings', 'web_chat_meeting_room_v1');
            if (saved?.room) this.room = { ...this.room, ...saved.room };
            if (!this.room.id) this.room.id = 'room_' + Date.now();
            if (this.room.draft == null) this.room.draft = '';
            if (!Array.isArray(this.room.terminalRequests)) this.room.terminalRequests = [];
            if (!this.room.draft && this.room.topic && !(this.room.messages || []).length) this.room.draft = this.room.topic;
            this.room.maxTurns = Number(this.room.maxTurns || 0) || Math.max(8, Math.min(24, Number(this.room.rounds || 0) * Math.max(2, (this.room.participants || []).length) || 12));
        } catch (e) {}
    },

    async _saveRoom() {
        await DB.put('settings', { id: 'web_chat_meeting_room_v1', room: this.room });
        await this._syncCurrentRoomMemory();
    },

    async _loadWebChatMemory() {
        try {
            const saved = await DB.get('settings', 'web_chat_memory_index_v1');
            this._memoryRecords = saved?.records || [];
        } catch (e) {
            this._memoryRecords = [];
        }
    },

    async _saveWebChatMemory() {
        this._memoryRecords = (this._memoryRecords || [])
            .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
            .slice(0, 80);
        await DB.put('settings', { id: 'web_chat_memory_index_v1', records: this._memoryRecords });
    },

    async _removeWebChatMemoryRecord(id) {
        if (!id) return;
        this._memoryRecords = (this._memoryRecords || []).filter(r => r.id !== id);
        await this._saveWebChatMemory();
        try {
            const memoryId = `pm_webchat_${id}`;
            const store = await DB.get('settings', 'memory_persistent');
            if (store?.items) {
                store.items = store.items.filter(m => m.id !== memoryId);
                await DB.put('settings', store);
            }
        } catch (e) {}
    },

    async _upsertWebChatMemoryRecord(record) {
        if (!record?.id || !record.summary) return;
        const now = Date.now();
        const idx = this._memoryRecords.findIndex(r => r.id === record.id);
        const next = { ...record, updatedAt: now };
        if (idx >= 0) this._memoryRecords[idx] = { ...this._memoryRecords[idx], ...next };
        else this._memoryRecords.unshift({ ...next, createdAt: now });
        await this._saveWebChatMemory();
        await this._upsertPersistentWebChatMemory(next);
        if (typeof MemorySystem !== 'undefined') {
            MemorySystem.addWorking(`[网页对话记忆] ${next.title}: ${(next.preview || next.summary).slice(0, 180)}`, 'conversation', 4, {
                module: 'web_chat',
                source: 'web_chat',
                tags: ['网页对话', next.kind === 'room' ? '会议室' : '单聊']
            });
        }
    },

    async _upsertPersistentWebChatMemory(record) {
        const memoryId = `pm_webchat_${record.id}`;
        const tags = ['网页对话', 'AI记忆', record.kind === 'room' ? '会议室' : '单聊'];
        let store = await DB.get('settings', 'memory_persistent') || { id: 'memory_persistent', items: [] };
        const existing = store.items.find(m => m.id === memoryId);
        const item = {
            id: memoryId,
            content: record.summary.slice(0, 5000),
            category: 'conversation',
            importance: 0.82,
            tags,
            ts: existing?.ts || Date.now(),
            accessCount: existing?.accessCount || 0,
            source: 'web_chat',
            linkedTo: [record.id],
            lastAccess: Date.now(),
            module: 'web_chat',
            title: record.title,
            preview: record.preview,
            recordKind: record.kind,
            recordId: record.sourceId || record.id
        };
        const idx = store.items.findIndex(m => m.id === memoryId);
        if (idx >= 0) store.items[idx] = item;
        else store.items.push(item);
        await DB.put('settings', store);
    },

    async _syncCurrentChatMemory() {
        if (!this.currentSessionId || !this.messages.length) return;
        const session = this._session();
        const summary = this._buildChatMemorySummary(session, this.messages);
        await this._upsertWebChatMemoryRecord({
            id: `chat_${this.currentSessionId}`,
            kind: 'chat',
            sourceId: this.currentSessionId,
            title: session?.title || '网页对话',
            preview: session?.preview || (this.messages.at(-1)?.content || '').slice(0, 80),
            count: this.messages.length,
            summary
        });
    },

    async _syncCurrentRoomMemory() {
        if (!this.room?.messages?.length) return;
        if (!this.room.id) this.room.id = 'room_' + Date.now();
        const summary = this._buildRoomMemorySummary(this.room);
        await this._upsertWebChatMemoryRecord({
            id: this.room.id,
            kind: 'room',
            sourceId: this.room.id,
            title: this.room.topic || '会议室对话',
            preview: (this.room.messages.at(-1)?.content || this.room.topic || '').slice(0, 100),
            count: this.room.messages.length,
            summary,
            topic: this.room.topic || '',
            participants: [...(this.room.participants || [])],
            maxTurns: this.room.maxTurns || 12,
            messages: JSON.parse(JSON.stringify(this.room.messages || [])),
            terminalRequests: JSON.parse(JSON.stringify(this.room.terminalRequests || []))
        });
    },

    async syncAllToMemory() {
        await this._loadWebChatMemory();
        for (const session of this.sessions || []) {
            const saved = await DB.get('settings', `web_chat_messages_simple_${session.id}`).catch(() => null);
            const messages = saved?.messages || [];
            if (!messages.length) continue;
            await this._upsertWebChatMemoryRecord({
                id: `chat_${session.id}`,
                kind: 'chat',
                sourceId: session.id,
                title: session.title || '网页对话',
                preview: session.preview || (messages.at(-1)?.content || '').slice(0, 80),
                count: messages.length,
                summary: this._buildChatMemorySummary(session, messages)
            });
        }
        await this._syncCurrentRoomMemory();
        UI.toast('网页对话记忆已同步到三层记忆');
        return this._memoryRecords.length;
    },

    _buildChatMemorySummary(session, messages) {
        const recent = messages.slice(-16).map(m => this._formatChatMessageForContext(m)).join('\n\n');
        return `【网页对话记忆 / 单聊】\n标题：${session?.title || '网页对话'}\n更新时间：${new Date().toLocaleString()}\n消息数：${messages.length}\n\n【最近记录】\n${recent}`;
    },

    _buildRoomMemorySummary(room) {
        const recent = (room.messages || []).slice(-20).map(m => `【${this._roomMessageLabel(m)}】\n${this._displayText(m.content || '')}`).join('\n\n');
        const participants = (room.participants || []).map(id => this._modelById(id)?.name || id).join('、');
        return `【网页对话记忆 / 多模型会议室】\n主题：${room.topic || '未命名会议'}\n参会：${participants || '未指定'}\n更新时间：${new Date().toLocaleString()}\n消息数：${(room.messages || []).length}\n\n【共享会议记录】\n${recent}`;
    },

    _buildWebChatMemoryContext(limit = 6, excludeId = '', kinds = null) {
        const allowedKinds = Array.isArray(kinds) && kinds.length ? new Set(kinds) : null;
        const records = (this._memoryRecords || [])
            .filter(r => r.id !== excludeId && r.summary)
            .filter(r => !allowedKinds || allowedKinds.has(r.kind))
            .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
            .slice(0, limit);
        if (!records.length) return '';
        return records.map(r => `【${r.kind === 'room' ? '会议室' : '单聊'}：${r.title || r.id}】\n${(r.summary || '').slice(0, 1200)}`).join('\n\n---\n\n');
    },

    async newSession(doRefresh = true) {
        const now = Date.now();
        const session = { id: Utils.uuid(), title: '新对话', preview: '', createdAt: now, updatedAt: now };
        this.sessions.unshift(session);
        this.currentSessionId = session.id;
        this.messages = [];
        this._draftBeforeRefresh = '';
        this.mode = 'chat';
        this._showRecords = false;
        localStorage.setItem('web_chat_mode', this.mode);
        await this._saveSessions();
        if (doRefresh) this.refresh();
    },

    async selectSession(id) {
        if (this._generating) return UI.toast('等当前回复结束再切换');
        this.currentSessionId = id;
        this._draftBeforeRefresh = '';
        await this._loadMessages(id);
        await this._saveSessions();
        this.setMode('chat', false);
        this.refresh();
    },

    async deleteSession(id) {
        if (!confirm('删除这个会话？')) return;
        await DB.del('settings', `web_chat_messages_simple_${id}`);
        await this._removeWebChatMemoryRecord(`chat_${id}`);
        this.sessions = this.sessions.filter(s => s.id !== id);
        if (this.currentSessionId === id) {
            this.currentSessionId = this.sessions[0]?.id || null;
            await this._loadMessages(this.currentSessionId);
        }
        if (!this.sessions.length) await this.newSession(false);
        await this._saveSessions();
        this.refresh();
    },

    async clearCurrentSession() {
        if (!this.currentSessionId || !this.messages.length) return UI.toast('当前会话已经是空的');
        if (!confirm('清空当前会话？')) return;
        const memoryId = `chat_${this.currentSessionId}`;
        this.messages = [];
        const session = this._session();
        if (session) {
            session.preview = '';
            session.title = '新对话';
            session.updatedAt = Date.now();
        }
        await this._saveMessages();
        await this._removeWebChatMemoryRecord(memoryId);
        await this._saveSessions();
        this.refresh();
    },

    setMode(mode, doRefresh = true) {
        this.mode = mode === 'room' ? 'room' : 'chat';
        this._showRecords = false;
        localStorage.setItem('web_chat_mode', this.mode);
        if (doRefresh) this.refresh();
    },

    toggleRecords() {
        this._showRecords = !this._showRecords;
        this.refresh();
    },

    async openChatRecord(id) {
        this._showRecords = false;
        await this.selectSession(id);
    },

    async selectRoomRecord(id) {
        if (this._roomRunning) return UI.toast('会议还在进行');
        const record = (this._memoryRecords || []).find(r => r.id === id && r.kind === 'room');
        if (!record) return UI.toast('找不到会议记录');
        this.room = {
            ...this.room,
            id: record.id,
            topic: record.topic || record.title || '',
            draft: '',
            maxTurns: record.maxTurns || this.room.maxTurns || 12,
            participants: record.participants || this.room.participants || [],
            messages: JSON.parse(JSON.stringify(record.messages || [])),
            terminalRequests: JSON.parse(JSON.stringify(record.terminalRequests || []))
        };
        this._roomEditingIndex = null;
        this._roomEditingDraft = '';
        this._showRecords = false;
        this.setMode('room', false);
        await this._saveRoom();
        this.refresh();
    },

    async newRoomRecord() {
        if (this._roomRunning) return UI.toast('会议还在进行');
        const participants = this.room.participants || ['openai', 'claude', 'gemini', 'deepseek'];
        const maxTurns = this.room.maxTurns || 12;
        this.room = {
            id: 'room_' + Date.now(),
            topic: '',
            draft: '',
            maxTurns,
            participants,
            messages: [],
            terminalRequests: []
        };
        this._roomEditingIndex = null;
        this._roomEditingDraft = '';
        this._showRecords = false;
        this.setMode('room', false);
        await this._saveRoom();
        this.refresh();
    },

    switchModel(id) {
        this.currentModel = id;
        localStorage.setItem('web_chat_model', id);
        this.setMode('chat', false);
        this.refresh();
    },

    toggleRunOption(key) {
        if (!['deepThink', 'webSearch'].includes(key)) return;
        this.runOptions[key] = !this.runOptions[key];
        localStorage.setItem(key === 'deepThink' ? 'web_chat_deep_think' : 'web_chat_web_search', this.runOptions[key] ? '1' : '0');
        this.refresh();
    },

    setInput(text) {
        this.setMode('chat', false);
        const input = document.getElementById('webchat-input');
        if (!input) {
            this._draftBeforeRefresh = text || '';
            this.refresh();
            return;
        }
        input.value = text || '';
        this._draftBeforeRefresh = input.value;
        input.focus();
        this.autoGrow(input);
    },

    fillPrompt(type) {
        const prompts = {
            '总结': '请总结下面内容，输出核心要点：\n\n',
            '翻译': '请翻译下面内容，保持准确自然：\n\n',
            '润色': '请润色下面内容，保留原意，只输出润色稿：\n\n',
            '写代码': '请帮我写代码。需求如下：\n\n',
            'JSON': '请按严格 JSON 输出，不要 Markdown。需求如下：\n\n'
        };
        const input = document.getElementById('webchat-input');
        if (!input) return;
        input.value = (prompts[type] || '') + input.value;
        this._draftBeforeRefresh = input.value;
        input.focus();
        this.autoGrow(input);
    },

    async sendMessage() {
        if (this._generating) return;
        if (this._editingMessageIndex != null) {
            UI.toast('先保存或取消正在编辑的消息');
            return;
        }
        const input = document.getElementById('webchat-input');
        const content = (input?.value || '').trim();
        if (!content && !this._pendingFiles.length) return;
        if (!this._isConfigured(this.currentModel)) {
            UI.toast('先配置这个模型的 API');
            this.openConfig(this.currentModel);
            return;
        }
        const apiAttachments = this._pendingFiles.slice();
        const visibleAttachments = apiAttachments.map(f => ({ type: f.type, name: f.name, mime: f.mime, size: f.size }));
        this._draftBeforeRefresh = '';
        this._pendingFiles = [];
        if (input) input.value = '';

        await this._sendPreparedMessage(content, apiAttachments, visibleAttachments);
    },

    async _sendPreparedMessage(content, apiAttachments = [], visibleAttachments = []) {
        if (!content && !visibleAttachments.length) return;
        if (!this._isConfigured(this.currentModel)) {
            UI.toast('先配置这个模型的 API');
            this.openConfig(this.currentModel);
            return;
        }
        if (!this.currentSessionId) await this.newSession(false);

        this._generating = true;
        this._chatAbortController = new AbortController();

        const userMsg = { role: 'user', content, targetModelId: this.currentModel, attachments: visibleAttachments, ts: Date.now() };
        const reqOptions = this._requestOptionsFor(this.currentModel, 'chat');
        reqOptions.signal = this._chatAbortController.signal;
        const assistantMsg = { role: 'assistant', modelId: this.currentModel, content: '', ts: Date.now(), streaming: true, meta: this._makeRunMeta(this.currentModel, reqOptions) };
        this.messages.push(userMsg, assistantMsg);
        this._touchSession(content || visibleAttachments.map(f => f.name).join(', '), '');
        this.refresh();
        this._scrollBottom();

        let answer = '';
        const apiMessages = this._buildChatMessages(userMsg, apiAttachments);
        try {
            const generated = await this._callModel(this.currentModel, apiMessages, reqOptions, chunk => {
                answer += chunk;
                assistantMsg.content = answer;
                this._renderMessagesOnly();
            });
            if (!answer.trim() && generated) {
                answer = generated;
                assistantMsg.content = answer;
                this._renderMessagesOnly();
            }
        } catch (e) {
            answer = e?.name === 'AbortError' ? ((answer || assistantMsg.content || '').trim() || '已暂停') : '生成失败：' + (e.message || e);
            assistantMsg.content = answer;
            this._renderMessagesOnly();
        }

        delete assistantMsg.streaming;
        this._finalizeRunMeta(assistantMsg.meta, assistantMsg.content);
        this._generating = false;
        this._chatAbortController = null;
        this._touchSession(content || '附件消息', answer);
        await this._saveMessages();
        await this._saveSessions();
        this.refresh();
        this._scrollBottom();
    },

    _buildChatMessages(latestUserMsg, latestAttachments) {
        const model = this._model();
        const config = this._config(model.id);
        const sharedMemory = this._buildWebChatMemoryContext(6, `chat_${this.currentSessionId}`, ['room']);
        const historyLimit = Number(config.historyLimit || 0) || (this._capEnabled(model.id, 'long') ? 40 : 16);
        const runDirective = this._runDirective(model.id, 'chat');
        const clean = this.messages
            .filter(m => !m.streaming)
            .slice(-historyLimit)
            .map(m => ({
                role: m.role,
                content: this._formatChatMessageForContext(m),
                _attachments: m === latestUserMsg ? latestAttachments : []
            }));
        return [
            {
                role: 'system',
                content: `${config.systemPrompt || model.system || ''}\n\n你会看到带有【我 → 模型名】或【模型名】标签的历史记录。回答时必须理解这些标签：用户说的话属于“我”，模型名代表之前是哪一个大模型发言。切换模型后也要承认前文发言归属，不要把别的模型的话当成用户说的。${sharedMemory ? `\n\n【会议室沉淀记忆｜只来自会议室，单聊私聊不会互通】\n${sharedMemory}` : ''}${runDirective}`
            },
            ...clean
        ];
    },

    _requestOptionsFor(id, scope = 'chat') {
        const deepThink = !!this.runOptions.deepThink;
        const webSearch = !!this.runOptions.webSearch;
        return {
            deepThink,
            webSearch,
            useReasoning: deepThink && this._capEnabled(id, 'reasoning'),
            useWebSearch: webSearch && this._capEnabled(id, 'web_search'),
            nativeReasoning: deepThink && this._capEnabled(id, 'reasoning') && this._modelById(id).provider === 'OpenAI',
            nativeWebSearch: webSearch && this._nativeSearchSupported(id),
            scope
        };
    },

    _nativeSearchSupported(id) {
        const style = this._config(id).apiStyle || this._modelById(id).apiStyle || 'openai';
        const model = this._modelById(id);
        return this._capEnabled(id, 'web_search') && (style === 'anthropic' || style === 'gemini' || model.id === 'perplexity' || model.provider === 'Perplexity');
    },

    _makeRunMeta(id, options = {}) {
        return {
            modelId: id,
            deepThink: !!options.deepThink,
            webSearch: !!options.webSearch,
            useReasoning: !!options.useReasoning,
            useWebSearch: !!options.useWebSearch,
            nativeReasoning: !!options.nativeReasoning,
            nativeWebSearch: !!options.nativeWebSearch,
            startedAt: Date.now(),
            elapsedMs: 0
        };
    },

    _finalizeRunMeta(meta, content = '') {
        if (!meta) return;
        meta.elapsedMs = Math.max(0, Date.now() - (meta.startedAt || Date.now()));
        const trace = this._extractOutputTrace(content);
        meta.thinkingTrace = trace.thinking || '';
        meta.searchTrace = trace.search || '';
        meta.searchUrls = trace.urls || [];
    },

    _runDirective(id, scope = 'chat') {
        const options = this._requestOptionsFor(id, scope);
        const parts = [];
        if (options.deepThink) {
            parts.push(`【深度思考模式】\n- 先在内部认真拆解问题，再回答。\n- 不要输出详细思维链，不要展示逐步推理草稿。\n- 如果需要说明思路，只在正文前输出一个很短的【思考摘要】，最多 3 条，每条只写结论级判断。`);
        }
        if (options.webSearch) {
            parts.push(`【联网模式】\n- 如果当前 API/模型提供原生联网、搜索、引用或资料检索能力，请尝试使用。\n- 回答正文前必须输出【联网记录】：列出实际查询词、打开/参考的网页标题或 URL、以及哪些内容来自检索。\n- 如果当前 API 无法联网，必须在【联网记录】里写明“当前 API 未返回联网结果”，并给出建议检索词；不要假装已经搜索。\n- 对最新信息、价格、时间、版本、新闻、政策等内容，必须标注是否来自联网记录。`);
        }
        if (scope === 'room') {
            parts.push(`【沙盒终端协议】\n- 你不能直接执行本地命令，也不能声称已经执行。\n- 如果需要查看文件、跑测试、检查目录或验证代码，先输出一个【终端请求】块。\n- 终端请求格式：\n【终端请求】\n目的：一句话说明为什么要运行\n命令：单条可复制 shell 命令\n风险：只读/会修改哪些文件/需要用户注意什么\n- 命令优先只读、低风险、作用范围明确；不要请求删除、格式化、上传密钥、读取隐私内容。\n- 用户确认运行后，沙盒终端会把输出发回会议室；你再基于输出继续讨论。`);
        }
        if (!parts.length) return '';
        return `\n\n${parts.join('\n\n')}`;
    },

    _touchSession(userText, answerText) {
        const s = this._session();
        if (!s) return;
        if (!s.title || s.title === '新对话') s.title = (userText || '新对话').slice(0, 28).replace(/\s+/g, ' ');
        s.preview = (answerText || userText || '').slice(0, 80).replace(/\s+/g, ' ');
        s.updatedAt = Date.now();
    },

    async regenerate() {
        if (this._generating) return;
        const lastUserIndex = [...this.messages].map((m, i) => ({ m, i })).reverse().find(x => x.m.role === 'user')?.i;
        if (lastUserIndex == null) return UI.toast('没有可重答的问题');
        const lastUser = this.messages[lastUserIndex].content;
        this.messages = this.messages.slice(0, lastUserIndex);
        this._editingMessageIndex = null;
        this._editingDraft = '';
        this._draftBeforeRefresh = lastUser;
        this.refresh();
        await this.sendMessage();
    },

    editMessage(index) {
        if (this._generating) return UI.toast('等当前回复结束再编辑');
        const msg = this.messages[index];
        if (!msg || msg.role !== 'user') return;
        this._editingMessageIndex = index;
        this._editingDraft = msg.content || '';
        this._draftBeforeRefresh = '';
        this._pendingFiles = [];
        this.setMode('chat', false);
        this.refresh();
        setTimeout(() => {
            const editor = document.getElementById(`webchat-inline-edit-${index}`);
            if (!editor) return;
            editor.focus();
            editor.selectionStart = editor.value.length;
            editor.selectionEnd = editor.value.length;
            this.autoGrow(editor);
            editor.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 30);
        UI.toast('直接在原消息里改，点重新生成');
    },

    cancelEdit() {
        this._editingMessageIndex = null;
        this._editingDraft = '';
        this._draftBeforeRefresh = '';
        this.refresh();
    },

    async saveInlineEdit(index) {
        if (this._generating) return UI.toast('等当前回复结束再编辑');
        const msg = this.messages[index];
        if (!msg || msg.role !== 'user') return;

        const editor = document.getElementById(`webchat-inline-edit-${index}`);
        const content = (editor?.value ?? this._editingDraft ?? msg.content ?? '').trim();
        if (!content) return UI.toast('内容不能为空');

        const nextAssistant = this.messages.slice(index + 1).find(item => item.role === 'assistant' && item.modelId);
        const targetModel = nextAssistant?.modelId || this.currentModel;
        this.currentModel = targetModel;
        localStorage.setItem('web_chat_model', targetModel);
        if (!this._isConfigured(targetModel)) {
            UI.toast('先配置这个模型的 API');
            this.openConfig(targetModel);
            return;
        }

        this.messages = this.messages.slice(0, index);
        this._editingMessageIndex = null;
        this._editingDraft = '';
        this._draftBeforeRefresh = '';
        this._pendingFiles = [];
        await this._sendPreparedMessage(content, [], []);
    },

    async retryMessage(index) {
        if (this._generating) return UI.toast('等当前回复结束再重试');
        const msg = this.messages[index];
        if (!msg) return;
        if (msg.role === 'user') return this.editMessage(index);
        let userIndex = -1;
        for (let i = index - 1; i >= 0; i--) {
            if (this.messages[i]?.role === 'user') {
                userIndex = i;
                break;
            }
        }
        if (userIndex < 0) return UI.toast('找不到要重试的问题');
        const user = this.messages[userIndex];
        if (msg.modelId) {
            this.currentModel = msg.modelId;
            localStorage.setItem('web_chat_model', msg.modelId);
        }
        this.messages = this.messages.slice(0, userIndex);
        this._editingMessageIndex = null;
        this._editingDraft = '';
        this._pendingFiles = [];
        this._draftBeforeRefresh = user.content || '';
        this.refresh();
        await this.sendMessage();
    },

    async handleFiles(input) {
        const files = Array.from(input?.files || []);
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                if (file.size > 6 * 1024 * 1024) {
                    UI.toast(`${file.name} 太大，先压缩到 6MB 内`);
                    continue;
                }
                const dataUrl = await this._readAsDataURL(file);
                this._pendingFiles.push({ type: 'image', name: file.name, mime: file.type, size: file.size, dataUrl });
            } else {
                if (file.size > 800 * 1024) {
                    UI.toast(`${file.name} 太大，文本附件建议 800KB 内`);
                    continue;
                }
                const text = await file.text();
                this._pendingFiles.push({ type: 'text', name: file.name, mime: file.type || 'text/plain', size: file.size, text });
            }
        }
        if (input) input.value = '';
        this.refresh();
    },

    removeAttachment(index) {
        this._pendingFiles.splice(index, 1);
        this.refresh();
    },

    toggleRoomPicker(force) {
        if (this._roomRunning) return;
        this._roomPickerOpen = typeof force === 'boolean' ? force : !this._roomPickerOpen;
        this.refresh();
    },

    toggleRoomParticipant(id) {
        const set = new Set(this.room.participants || []);
        if (set.has(id)) set.delete(id);
        else set.add(id);
        this.room.participants = Array.from(set);
        this._saveRoom();
        this.refresh();
    },

    setRoomMaxTurnsPreset(value) {
        if (value === 'custom') {
            this._roomTurnsCustom = true;
            this.refresh();
            setTimeout(() => {
                const input = document.getElementById('webchat-room-custom-turns');
                if (!input) return;
                input.focus();
                input.select();
            }, 20);
            return;
        }
        this._roomTurnsCustom = false;
        this.setRoomMaxTurns(value, true);
    },

    setRoomMaxTurns(value, refresh = false) {
        const n = Math.max(1, Math.min(120, Math.floor(Number(value) || 12)));
        this.room.maxTurns = n;
        if (![8, 12, 16, 24].includes(n)) this._roomTurnsCustom = true;
        this._saveRoom();
        if (refresh) this.refresh();
    },

    setRoomRounds(value) {
        this.setRoomMaxTurns((Number(value) || 2) * Math.max(2, (this.room.participants || []).length));
    },

    async startMeeting() {
        if (this._roomRunning) return;
        const topicEl = document.getElementById('webchat-room-topic');
        const topic = (topicEl?.value || this.room.draft || '').trim();
        if (!topic && !this.room.messages.length) return UI.toast('先丢一个议题进会议室');
        const picked = topic ? this._pickRoomParticipantsFromText(topic) : { ids: [], mentioned: false, missing: [] };
        const participants = picked.mentioned
            ? picked.ids.filter(id => this._isConfigured(id))
            : (this.room.participants || []).filter(id => this._isConfigured(id));
        if (picked.mentioned && !participants.length) return UI.toast(`点名的模型还没配置 API：${picked.missing.join('、') || '请先配置'}`);
        if (!participants.length) return UI.toast('至少配置一个模型 API 才能发言');

        if (topic) {
            if (!this.room.topic) this.room.topic = topic;
            this.room.messages.push({ role: 'user', content: topic, ts: Date.now() });
            this.room.draft = '';
            if (topicEl) topicEl.value = '';
        }
        this._roomRunning = true;
        this._roomAbortController = new AbortController();
        await this._saveRoom();
        this.refresh();
        this._scrollBottom();

        await this._runSharedRoomDiscussion(participants, topic ? participants.length : null);
        this._roomRunning = false;
        this._roomAbortController = null;
        await this._saveRoom();
        this.refresh();
    },

    stopMeeting() {
        this._roomRunning = false;
        if (this._roomAbortController) this._roomAbortController.abort();
        UI.toast('已暂停当前生成');
        this.refresh();
    },

    _addTerminalRequest(input = {}) {
        const command = String(input.command || '').trim();
        if (!command) return null;
        if (!Array.isArray(this.room.terminalRequests)) this.room.terminalRequests = [];
        const sourceKey = input.sourceMessageTs ? `${input.modelId || 'manual'}:${input.sourceMessageTs}:${this._hashShort(command)}` : '';
        if (sourceKey) {
            const existing = this.room.terminalRequests.find(req => req.sourceKey === sourceKey);
            if (existing) return existing;
        }
        const req = {
            id: input.id || `term_${Date.now()}_${this._hashShort(command + Math.random())}`,
            modelId: input.modelId || '',
            command,
            reason: String(input.reason || '').trim(),
            risk: String(input.risk || '').trim(),
            source: input.source || 'model',
            sourceMessageTs: input.sourceMessageTs || 0,
            sourceKey,
            status: 'pending',
            output: '',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        this.room.terminalRequests.push(req);
        this.room.terminalRequests = this.room.terminalRequests.slice(-50);
        return req;
    },

    _captureTerminalRequests(msg) {
        if (!msg || msg.role !== 'model') return [];
        const requests = this._extractTerminalRequests(msg.content || '');
        if (!requests.length) return [];
        return requests.map(req => this._addTerminalRequest({
            ...req,
            modelId: msg.modelId || '',
            source: 'model',
            sourceMessageTs: msg.ts || Date.now()
        })).filter(Boolean);
    },

    _extractTerminalRequests(content) {
        const text = String(content || '');
        const blocks = [];
        const blockRe = /【终端请求】([\s\S]*?)(?=\n?【(?:终端请求|思考摘要|联网记录|正文)】|$)/gi;
        let match;
        while ((match = blockRe.exec(text))) blocks.push(match[1] || '');
        return blocks.map(block => {
            const fenced = block.match(/(?:命令|command)\s*[:：]?\s*```(?:bash|sh|shell|zsh)?\s*([\s\S]*?)```/i)
                || block.match(/```(?:bash|sh|shell|zsh)?\s*([\s\S]*?)```/i);
            const command = (fenced?.[1] || this._terminalField(block, ['命令', 'command'])).trim();
            if (!command) return null;
            return {
                command,
                reason: this._terminalField(block, ['目的', '目标', '原因', '理由']),
                risk: this._terminalField(block, ['风险', '影响', '注意'])
            };
        }).filter(Boolean);
    },

    _terminalField(block, labels) {
        const keys = '目的|目标|原因|理由|命令|command|风险|影响|注意|备注|输出|结果';
        const labelRe = labels.map(x => String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        const re = new RegExp(`(?:^|\\n)\\s*(?:${labelRe})\\s*[:：]\\s*([\\s\\S]*?)(?=\\n\\s*(?:${keys})\\s*[:：]|$)`, 'i');
        const match = String(block || '').match(re);
        return (match?.[1] || '').replace(/```[\s\S]*?```/g, '').trim();
    },

    _stripTerminalBlocks(content) {
        return String(content || '')
            .replace(/【终端请求】[\s\S]*?(?=\n?【(?:终端请求|思考摘要|联网记录|正文)】|$)/gi, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    },

    _hashShort(text) {
        let hash = 5381;
        const source = String(text || '');
        for (let i = 0; i < source.length; i++) hash = ((hash << 5) + hash) ^ source.charCodeAt(i);
        return (hash >>> 0).toString(36).slice(0, 8);
    },

    addManualTerminalRequest() {
        const command = prompt('输入要放进沙盒终端的命令：');
        if (!command?.trim()) return;
        this._addTerminalRequest({
            modelId: '',
            command: command.trim(),
            reason: '手动添加',
            risk: '请在运行前确认命令影响范围。',
            source: 'manual'
        });
        this._saveRoom();
        this.refresh();
    },

    copyTerminalCommand(id) {
        const req = (this.room.terminalRequests || []).find(x => x.id === id);
        if (!req) return UI.toast('找不到命令');
        Utils.copy(req.command || '');
        UI.toast('命令已复制');
    },

    async clearTerminalRequests() {
        if (!(this.room.terminalRequests || []).length) return;
        if (!confirm('清空当前会议的终端请求？')) return;
        this.room.terminalRequests = [];
        await this._saveRoom();
        this.refresh();
    },

    async runTerminalRequest(id) {
        const req = (this.room.terminalRequests || []).find(x => x.id === id);
        if (!req) return UI.toast('找不到命令');
        const ok = confirm(`准备通过本地沙盒终端运行：\n\n${req.command}\n\n这会把命令发送到 http://127.0.0.1:8787/exec。请确认命令可信、不会删除/上传/泄露文件。`);
        if (!ok) return;
        req.status = 'running';
        req.output = '';
        req.updatedAt = Date.now();
        this.refresh();
        try {
            const res = await fetch('http://127.0.0.1:8787/exec', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    command: req.command,
                    cwd: '/Users/fhapple/Desktop/长篇小说/长篇',
                    timeoutMs: 120000
                })
            });
            const text = await res.text();
            if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
            let data = {};
            try { data = JSON.parse(text); } catch (e) { data = { output: text }; }
            req.status = data.code === 0 || data.success ? 'done' : 'failed';
            req.output = [data.stdout || data.output || '', data.stderr ? `\n[stderr]\n${data.stderr}` : ''].join('').trim() || '(无输出)';
        } catch (e) {
            req.status = 'failed';
            req.output = `沙盒终端桥未连接或执行失败：${e.message || e}\n\n需要启动本地终端桥后才能运行；现在可以先复制命令手动执行。`;
        }
        req.updatedAt = Date.now();
        const statusText = req.status === 'done' ? '完成' : '失败';
        this.room.messages.push({
            role: 'terminal',
            terminalRequestId: req.id,
            content: `命令：\n\`\`\`bash\n${req.command}\n\`\`\`\n\n状态：${statusText}\n\n输出：\n\`\`\`\n${req.output || '(无输出)'}\n\`\`\``,
            ts: Date.now()
        });
        await this._saveRoom();
        this.refresh();
    },

    copyRoomMessage(index) {
        const msg = this.room.messages[index];
        if (!msg) return;
        Utils.copy(msg.role === 'user' ? (msg.content || '') : this._displayText(msg.content || ''));
        UI.toast('已复制');
    },

    editRoomMessage(index) {
        if (this._roomRunning) return UI.toast('会议还在进行');
        const msg = this.room.messages[index];
        if (!msg || msg.role !== 'user') return;
        this._roomEditingIndex = index;
        this._roomEditingDraft = msg.content || '';
        this.setMode('room', false);
        this.refresh();
        setTimeout(() => {
            const editor = document.getElementById(`webchat-room-inline-edit-${index}`);
            if (!editor) return;
            editor.focus();
            editor.selectionStart = editor.value.length;
            editor.selectionEnd = editor.value.length;
            this.autoGrow(editor);
            editor.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 30);
    },

    cancelRoomEdit() {
        this._roomEditingIndex = null;
        this._roomEditingDraft = '';
        this.refresh();
    },

    async saveRoomEdit(index) {
        if (this._roomRunning) return UI.toast('会议还在进行');
        const msg = this.room.messages[index];
        if (!msg || msg.role !== 'user') return;
        const editor = document.getElementById(`webchat-room-inline-edit-${index}`);
        const content = (editor?.value ?? this._roomEditingDraft ?? msg.content ?? '').trim();
        if (!content) return UI.toast('内容不能为空');
        msg.content = content;
        if (index === 0) this.room.topic = content.slice(0, 80);
        this.room.messages = this.room.messages.slice(0, index + 1);
        this._roomEditingIndex = null;
        this._roomEditingDraft = '';
        await this._continueRoomDiscussion();
    },

    async retryRoomMessage(index) {
        if (this._roomRunning) return UI.toast('会议还在进行');
        const msg = this.room.messages[index];
        if (!msg) return;
        if (msg.role === 'user') return this.editRoomMessage(index);
        if (msg.role === 'host') {
            this.room.messages = this.room.messages.slice(0, index);
            await this._saveRoom();
            this.refresh();
            return this.summarizeMeeting();
        }
        if (msg.role === 'terminal') return UI.toast('终端输出不能重试，可以重新运行对应命令');
        const currentParticipants = (this.room.participants || []).filter(id => this._isConfigured(id));
        const ordered = [msg.modelId, ...currentParticipants.filter(id => id !== msg.modelId)].filter(Boolean);
        this.room.messages = this.room.messages.slice(0, index);
        await this._continueRoomDiscussion(ordered);
    },

    async _continueRoomDiscussion(participantsOverride = null) {
        const participants = (participantsOverride || this.room.participants || []).filter(id => this._isConfigured(id));
        if (participants.length < 1) return UI.toast('至少配置一个模型 API 才能发言');
        this._roomRunning = true;
        this._roomAbortController = new AbortController();
        await this._saveRoom();
        this.refresh();
        this._scrollBottom();
        await this._runSharedRoomDiscussion(participants);
        this._roomRunning = false;
        this._roomAbortController = null;
        await this._saveRoom();
        this.refresh();
    },

    async _runSharedRoomDiscussion(participants, maxTurnsOverride = null) {
        const maxTurns = Math.max(1, Math.min(120, Number(maxTurnsOverride ?? this.room.maxTurns) || 12));
        let spokenTurns = 0;
        let silentPasses = 0;

        while (this._roomRunning && spokenTurns < maxTurns && silentPasses < 1) {
            let spokeInPass = false;
            for (const id of participants) {
                if (!this._roomRunning || spokenTurns >= maxTurns) break;
                const reqOptions = this._requestOptionsFor(id, 'room');
                reqOptions.signal = this._roomAbortController?.signal;
                const msg = { role: 'model', modelId: id, turn: spokenTurns + 1, content: '', streaming: true, ts: Date.now(), meta: this._makeRunMeta(id, reqOptions) };
                this.room.messages.push(msg);
                this._renderMessagesOnly();
                let answer = '';
                try {
                    const generated = await this._callModel(id, this._buildMeetingMessages(id, spokenTurns + 1), reqOptions, chunk => {
                        answer += chunk;
                        msg.content = answer;
                        this._renderMessagesOnly();
                    });
                    if (!answer.trim() && generated) msg.content = generated;
                    msg.content = this._cleanRoomAnswer(msg.content || '');
                    if (this._isSilentRoomAnswer(msg.content)) {
                        this.room.messages.pop();
                    } else {
                        spokeInPass = true;
                        spokenTurns++;
                    }
                } catch (e) {
                    if (e?.name === 'AbortError' || /aborted|abort/i.test(e?.message || '')) {
                        const partial = (answer || msg.content || '').trim();
                        msg.content = partial ? `${partial}\n\n（已暂停）` : '已暂停';
                    } else {
                        msg.content = '发言失败：' + (e.message || e);
                    }
                    spokeInPass = true;
                    spokenTurns++;
                }
                delete msg.streaming;
                this._finalizeRunMeta(msg.meta, msg.content);
                const terminalReqs = this._captureTerminalRequests(msg);
                if (terminalReqs.length && !this._displayText(msg.content || '').trim()) {
                    msg.content = `${msg.content || ''}\n\n【正文】已提交终端请求，等待沙盒终端输出。`;
                }
                await this._saveRoom();
                this._renderMessagesOnly();
            }
            silentPasses = spokeInPass ? 0 : silentPasses + 1;
        }
    },

    _pickRoomParticipantsFromText(text) {
        const source = String(text || '').toLowerCase();
        const ids = [];
        const missing = [];
        for (const model of this._visibleModels()) {
            const aliases = this._roomModelAliases(model).map(x => x.toLowerCase()).filter(Boolean);
            const hit = aliases.some(alias => source.includes(alias));
            if (!hit) continue;
            if (!ids.includes(model.id)) ids.push(model.id);
            if (!this._isConfigured(model.id)) missing.push(model.name);
        }
        return { ids, mentioned: ids.length > 0, missing };
    },

    _roomModelAliases(model) {
        const aliases = new Set([model.id, model.name, model.provider]);
        const map = {
            openai: ['gpt', 'chatgpt', 'openai gpt', 'oai'],
            claude: ['anthropic'],
            gemini: ['google'],
            deepseek: ['deep seek', '深度求索'],
            qwen: ['通义', '千问', '阿里'],
            kimi: ['moonshot', '月之暗面'],
            zhipu: ['glm', '智谱', 'bigmodel'],
            doubao: ['豆包', '火山', '方舟'],
            yi: ['零一', '01ai', 'lingyi'],
            grok: ['xai', 'x.ai'],
            mistral: ['mixtral'],
            perplexity: ['pplx'],
            minimax: ['mini max', '海螺', 'abab', 'minimax m2'],
            openrouter: ['open router'],
            custom: ['自定义模型']
        };
        (map[model.id] || []).forEach(x => aliases.add(x));
        return Array.from(aliases).filter(Boolean);
    },

    _buildMeetingMessages(id, turn) {
        const model = this._modelById(id);
        const config = this._config(id);
        const transcript = this._formatRoomTranscript();
        const runDirective = this._runDirective(id, 'room');
        return [
            {
                role: 'system',
                content: `${config.systemPrompt || model.system || ''}\n\n你正在参加一个多模型共享上下文聊天室/工作台。会议室只能看到本会议室里的完整记录，不读取任何单聊私聊内容。所有参会模型都能看到用户和其他模型在本会议室的发言。你的任务不是轮流汇报，而是参与真实讨论：可以赞同、反驳、补充、追问、拆台、修正方案。\n\n发言规则：\n- 先读完整会议记录，再回应最近一个最值得回应的人。\n- 明确指出你同意或不同意谁，理由要具体。\n- 不要重复自己或别人已经说过的内容。\n- 不要写模型名开头，界面会自动标记发言人。\n- 如果你没有新增价值，或者讨论已经自然收束，只回复：[沉默]\n- 不要为了发言而发言。${runDirective}`
            },
            {
                role: 'user',
                content: `【共享会议记录】\n${transcript || '暂无'}\n\n【当前】轮到 ${model.name} 发言，这是第 ${turn} 次模型发言。请基于上面所有人的话继续讨论。`
            }
        ];
    },

    _cleanRoomAnswer(text) {
        return String(text || '').replace(/^【[^】]+】\s*/g, '').trim();
    },

    _isSilentRoomAnswer(text) {
        const clean = String(text || '').replace(/\s+/g, '').replace(/[。.!！?？"'“”‘’`]/g, '');
        return !clean || clean === '[沉默]' || clean === '【沉默】' || clean === '沉默';
    },

    _roomMessageLabel(m) {
        if (m.role === 'user') return '我';
        if (m.role === 'terminal') return '沙盒终端';
        if (m.role === 'host') return '主持人总结';
        return this._modelById(m.modelId)?.name || '模型';
    },

    _formatRoomTranscript() {
        return (this.room.messages || [])
            .filter(m => !m.streaming)
            .map(m => `【${this._roomMessageLabel(m)}】\n${this._displayText(m.content || '')}`)
            .join('\n\n');
    },

    async summarizeMeeting() {
        if (this._roomRunning) return UI.toast('会议还在进行');
        if (!this.room.messages.length) return UI.toast('还没有会议记录');
        const id = this._isConfigured(this.currentModel)
            ? this.currentModel
            : (this.room.participants || []).find(mid => this._isConfigured(mid));
        if (!id) return UI.toast('先配置一个模型 API 用来总结');
        const msg = { role: 'host', modelId: id, content: '', streaming: true, ts: Date.now() };
        this.room.messages.push(msg);
        this._roomRunning = true;
        this._roomAbortController = new AbortController();
        this.refresh();
        let answer = '';
        try {
            const transcript = this._formatRoomTranscript();
            const generated = await this._callModel(id, [
                { role: 'system', content: '你是会议主持人。只做收束，不展开新讨论。' },
                { role: 'user', content: `请总结下面多模型会议，输出：共识、分歧、最好方案、马上执行的三步。\n\n${transcript}` }
            ], { signal: this._roomAbortController.signal }, chunk => {
                answer += chunk;
                msg.content = answer;
                this._renderMessagesOnly();
            });
            if (!answer.trim() && generated) msg.content = generated;
        } catch (e) {
            msg.content = e?.name === 'AbortError' ? ((answer || msg.content || '').trim() || '已暂停') : '总结失败：' + (e.message || e);
        }
        delete msg.streaming;
        this._roomRunning = false;
        this._roomAbortController = null;
        await this._saveRoom();
        this.refresh();
    },

    async clearMeeting() {
        if (this._roomRunning) return UI.toast('会议还在进行');
        if (!this.room.messages.length) return;
        if (!confirm('清空会议记录？')) return;
        this.room.messages = [];
        this.room.terminalRequests = [];
        this.room.topic = '';
        this.room.draft = '';
        await this._saveRoom();
        this.refresh();
    },

    exportMeeting() {
        if (!this.room.messages.length) return UI.toast('会议室为空');
        const md = `# 多模型会议室\n\n主题：${this.room.topic || ''}\n\n` + this.room.messages.map(m => {
            const name = this._roomMessageLabel(m);
            return `## ${name}\n\n${m.content || ''}`;
        }).join('\n\n');
        Utils.copy(md);
        UI.toast('已复制 Markdown');
    },

    openConfig(id = this.currentModel) {
        const model = this._modelById(id);
        const config = this._config(id);
        const capList = [
            ['text', '文本'],
            ['vision', '图像输入'],
            ['long', '长上下文'],
            ['reasoning', '推理'],
            ['web_search', '联网'],
            ['json', 'JSON'],
            ['tools', '原生工具']
        ];
        const html = `
            <div id="wc-config-modal-root" class="space-y-4 text-white">
                <div class="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div class="text-sm font-bold"><i class="fa-solid ${model.icon} mr-2"></i>${model.name}</div>
                    <div class="text-[11px] text-dim mt-1 leading-relaxed">预设地址只做快速填充；真正能力以你填的 API 服务商、模型名和控制台权限为准。</div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label class="text-[11px] text-dim">接口类型
                        <select id="wc-cfg-style" class="input bg-black/30 border-white/10 h-9 text-sm text-white mt-1">
                            <option value="openai" ${config.apiStyle === 'openai' ? 'selected' : ''}>OpenAI 兼容 / Chat Completions</option>
                            <option value="anthropic" ${config.apiStyle === 'anthropic' ? 'selected' : ''}>Anthropic Messages</option>
                            <option value="gemini" ${config.apiStyle === 'gemini' ? 'selected' : ''}>Gemini generateContent</option>
                        </select>
                    </label>
                    <label class="text-[11px] text-dim">模型名
                        <input id="wc-cfg-model" class="input bg-black/30 border-white/10 h-9 text-sm text-white font-mono mt-1" value="${this._attr(config.modelName || '')}" placeholder="${this._attr(model.modelHint || 'model')}">
                    </label>
                    <label class="text-[11px] text-dim md:col-span-2">Base URL
                        <input id="wc-cfg-url" class="input bg-black/30 border-white/10 h-9 text-sm text-white font-mono mt-1" value="${this._attr(config.baseUrl || '')}" placeholder="${this._attr(model.baseUrl || 'https://...')}">
                    </label>
                    <label class="text-[11px] text-dim md:col-span-2">API Key
                        <input id="wc-cfg-key" type="password" class="input bg-black/30 border-white/10 h-9 text-sm text-white font-mono mt-1" value="${this._attr(config.apiKey || '')}" placeholder="sk- / key- / 你的服务商密钥">
                    </label>
                    <label class="text-[11px] text-dim">Temperature
                        <input id="wc-cfg-temp" type="number" step="0.1" min="0" max="2" class="input bg-black/30 border-white/10 h-9 text-sm text-white mt-1" value="${this._attr(config.temperature ?? 0.7)}">
                    </label>
                    <label class="text-[11px] text-dim">Max tokens
                        <input id="wc-cfg-tokens" type="number" min="256" class="input bg-black/30 border-white/10 h-9 text-sm text-white mt-1" value="${this._attr(config.maxTokens || 4096)}">
                    </label>
                    <label class="text-[11px] text-dim">历史窗口
                        <input id="wc-cfg-history" type="number" min="4" max="80" class="input bg-black/30 border-white/10 h-9 text-sm text-white mt-1" value="${this._attr(config.historyLimit || (this._capEnabled(id, 'long') ? 40 : 16))}">
                    </label>
                    <div class="text-[11px] text-dim">
                        能力开关
                        <div class="grid grid-cols-2 gap-2 mt-1">
                            ${capList.map(([cap, label]) => `
                                <label class="h-9 rounded-lg bg-black/30 border border-white/10 px-2 flex items-center gap-2 text-xs text-gray-300">
                                    <input type="checkbox" class="wc-cap-toggle accent-white" value="${cap}" ${this._capEnabled(id, cap) ? 'checked' : ''}>
                                    ${label}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    <label class="text-[11px] text-dim md:col-span-2">系统提示词
                        <textarea id="wc-cfg-system" class="w-full min-h-[88px] bg-black/30 border border-white/10 rounded-lg p-3 text-xs text-white mt-1 outline-none">${this._escape(config.systemPrompt || model.system || '')}</textarea>
                    </label>
                    <label class="text-[11px] text-dim md:col-span-2">高级请求 JSON（可选，浅合并到请求 body）
                        <textarea id="wc-cfg-extra" class="w-full min-h-[72px] bg-black/30 border border-white/10 rounded-lg p-3 text-xs text-white font-mono mt-1 outline-none" placeholder='{"response_format":{"type":"json_object"}}'>${this._escape(config.extraJson || '')}</textarea>
                    </label>
                </div>
                <div class="flex flex-wrap justify-between gap-2 pt-2 border-t border-white/10">
                    <div class="flex flex-wrap gap-2">
                        <button class="h-9 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300" onclick="Modules.web_chat.importActiveApi('${id}')">
                            <i class="fa-solid fa-right-left mr-1"></i>套用当前主控
                        </button>
                        ${this._isConfigured(id) && !this._isMasterModel(id) ? `
                        <button class="h-9 px-3 rounded-lg bg-accent/10 hover:bg-accent/15 text-accent border border-accent/20 text-xs" onclick="Modules.web_chat.setAsMaster('${id}')">
                            <i class="fa-solid fa-crown mr-1"></i>设为全局主控
                        </button>` : ''}
                    </div>
                    <div class="flex gap-2">
                        <button class="h-9 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300" onclick="document.getElementById('wc-config-modal-root')?.closest('.modal-overlay')?.remove()">取消</button>
                        <button class="h-9 px-5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-bold" onclick="Modules.web_chat.saveConfigFromModal('${id}')">保存</button>
                    </div>
                </div>
            </div>`;
        UI.modal(`${model.name} API 配置`, html, { width: '760px' });
    },

    async saveConfigFromModal(id) {
        const read = key => document.getElementById(key)?.value?.trim() || '';
        const caps = {};
        document.querySelectorAll('.wc-cap-toggle').forEach(el => { caps[el.value] = !!el.checked; });
        const extraJson = read('wc-cfg-extra');
        if (extraJson) {
            try { JSON.parse(extraJson); }
            catch (e) { return UI.toast('高级 JSON 格式不对'); }
        }
        const model = this._modelById(id);
        const nextConfig = {
            apiStyle: read('wc-cfg-style') || model.apiStyle,
            baseUrl: read('wc-cfg-url'),
            apiKey: read('wc-cfg-key'),
            modelName: read('wc-cfg-model'),
            temperature: Number(read('wc-cfg-temp') || 0.7),
            maxTokens: Number(read('wc-cfg-tokens') || 4096),
            historyLimit: Number(read('wc-cfg-history') || 0),
            systemPrompt: read('wc-cfg-system') || model.system,
            capabilities: caps,
            extraJson
        };
        if (model.poolId) {
            const existing = await DB.get('text_api_pool', model.poolId).catch(() => null);
            if (existing) {
                existing.provider = this._styleToProvider(nextConfig.apiStyle, existing.provider);
                existing.base_url = nextConfig.baseUrl;
                existing.api_key = nextConfig.apiKey;
                existing.model_name = nextConfig.modelName;
                existing.config_name = model.name || existing.config_name;
                existing.temperature = nextConfig.temperature;
                existing.max_tokens = nextConfig.maxTokens;
                existing.updatedAt = Date.now();
                await DB.put('text_api_pool', existing);
                await this._loadPoolModels();
            }
        } else {
            this.configs[id] = nextConfig;
        }
        await this._saveConfigs();
        document.getElementById('wc-config-modal-root')?.closest('.modal-overlay')?.remove();
        UI.toast('模型 API 已保存');
        this.refresh();
    },

    async importActiveApi(id) {
        const active = await AI.getActiveConfig('text').catch(() => null);
        if (!active) return UI.toast('系统设置里还没有激活 API');
        const style = active.provider === 'claude' ? 'anthropic' : (active.provider === 'gemini' ? 'gemini' : 'openai');
        const set = (key, value) => {
            const el = document.getElementById(key);
            if (el) el.value = value || '';
        };
        set('wc-cfg-style', style);
        set('wc-cfg-url', active.base_url || '');
        set('wc-cfg-key', active.api_key || '');
        set('wc-cfg-model', active.model_name || '');
        UI.toast('已填入系统激活 API，点保存生效');
    },

    async setAsMaster(id = this.currentModel) {
        const model = this._modelById(id);
        if (!this._isConfigured(id)) {
            UI.toast('先配置这个模型的 API');
            this.openConfig(id);
            return;
        }
        const store = 'text_api_pool';
        const all = await DB.getAll(store).catch(() => []);
        for (const item of all) {
            item.is_master = 0;
            item.is_active = 0;
            item.scope = 'web_chat';
            await DB.put(store, item);
        }
        if (model.poolId) {
            const record = await DB.get(store, model.poolId);
            record.is_master = 1;
            record.is_active = 1;
            record.scope = 'master';
            record.updatedAt = Date.now();
            await DB.put(store, record);
        } else {
            const config = this._config(id);
            const record = {
                id: `webchat_master_${id}`,
                config_name: `${model.name} 主控`,
                provider: this._styleToProvider(config.apiStyle, model.providerId),
                base_url: config.baseUrl,
                api_key: config.apiKey,
                model_name: config.modelName,
                temperature: config.temperature,
                max_tokens: config.maxTokens,
                is_master: 1,
                is_active: 1,
                scope: 'master',
                source: 'web_chat',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            await DB.put(store, record);
        }
        await this._loadPoolModels();
        await Modules.settings?._renderApiPoolGrid?.();
        document.getElementById('wc-config-modal-root')?.closest('.modal-overlay')?.remove();
        UI.toast('全局主控已切换');
        this.refresh();
    },

    async testCurrentModel(id = this.currentModel) {
        if (!this._isConfigured(id)) {
            UI.toast('先配置这个模型的 API');
            this.openConfig(id);
            return;
        }
        try {
            UI.toast('正在测试连接...');
            const answer = await this._callModel(id, [
                { role: 'system', content: '你只做连接测试。' },
                { role: 'user', content: '请只回复：连接成功' }
            ]);
            UI.toast(`连接成功：${this._escape((answer || '').slice(0, 30))}`);
        } catch (e) {
            UI.toast('连接失败：' + (e.message || e));
        }
    },

    async _callModel(id, messages, options = {}, onChunk) {
        const model = this._modelById(id);
        const config = this._config(id);
        if (!this._isConfigured(id)) throw new Error(`${model.name} 未配置 API`);

        const style = config.apiStyle || model.apiStyle || 'openai';
        const useStream = !!onChunk && options.stream !== false;
        const buildReq = nextOptions => {
            if (style === 'anthropic') return this._buildAnthropicRequest(id, messages, config, nextOptions);
            if (style === 'gemini') return this._buildGeminiRequest(id, messages, config, nextOptions);
            return this._buildOpenAIRequest(id, messages, config, nextOptions);
        };
        let requestOptions = { ...options, stream: useStream };
        let req = buildReq(requestOptions);

        let res = await fetch(req.url, {
            method: 'POST',
            headers: req.headers,
            body: JSON.stringify(req.body),
            signal: requestOptions.signal
        });
        if (!res.ok && (requestOptions.nativeWebSearch || requestOptions.nativeReasoning)) {
            requestOptions = { ...requestOptions, nativeWebSearch: false, nativeReasoning: false };
            req = buildReq(requestOptions);
            res = await fetch(req.url, {
                method: 'POST',
                headers: req.headers,
                body: JSON.stringify(req.body),
                signal: requestOptions.signal
            });
        }
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`API ${res.status}: ${text.slice(0, 220)}`);
        }
        if (useStream && res.body) {
            const streamed = await this._readModelStream(style, res, onChunk);
            if (streamed) return streamed;
        }
        const data = await res.json();
        const text = this._parseModelResponse(style, data);
        if (onChunk && text) onChunk(text);
        return text;
    },

    _buildOpenAIRequest(id, messages, config, options) {
        const base = (config.baseUrl || '').replace(/\/+$/, '');
        const body = {
            model: config.modelName,
            messages: messages.map(m => this._toOpenAIMessage(id, m)),
            temperature: options.temperature ?? config.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? config.maxTokens ?? 4096,
            stream: !!options.stream
        };
        if (options.nativeReasoning) {
            body.reasoning_effort = 'high';
        }
        this._mergeExtraBody(body, config);
        if (options.stream) body.stream = true;
        const headers = { 'Content-Type': 'application/json' };
        if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
        return {
            url: `${base}/chat/completions`,
            headers,
            body
        };
    },

    _buildAnthropicRequest(id, messages, config, options) {
        const base = (config.baseUrl || 'https://api.anthropic.com').replace(/\/+$/, '');
        const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n');
        const body = {
            model: config.modelName,
            max_tokens: options.maxTokens ?? config.maxTokens ?? 4096,
            temperature: options.temperature ?? config.temperature ?? 0.7,
            system,
            messages: messages
                .filter(m => m.role !== 'system')
                .map(m => this._toAnthropicMessage(id, m))
        };
        if (options.nativeWebSearch) {
            body.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }];
        }
        this._mergeExtraBody(body, config);
        if (options.stream) body.stream = true;
        return {
            url: `${base}/v1/messages`,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body
        };
    },

    _buildGeminiRequest(id, messages, config, options) {
        const base = (config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '');
        const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n');
        const body = {
            contents: messages
                .filter(m => m.role !== 'system')
                .map(m => this._toGeminiContent(id, m)),
            generationConfig: {
                temperature: options.temperature ?? config.temperature ?? 0.7,
                maxOutputTokens: options.maxTokens ?? config.maxTokens ?? 4096
            }
        };
        if (system) body.systemInstruction = { parts: [{ text: system }] };
        if (options.nativeWebSearch) {
            body.tools = [{ google_search: {} }];
        }
        this._mergeExtraBody(body, config);
        const action = options.stream ? 'streamGenerateContent' : 'generateContent';
        const extraQuery = options.stream ? '&alt=sse' : '';
        return {
            url: `${base}/models/${encodeURIComponent(config.modelName)}:${action}?key=${encodeURIComponent(config.apiKey)}${extraQuery}`,
            headers: { 'Content-Type': 'application/json' },
            body
        };
    },

    async _readModelStream(style, res, onChunk) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parsed = this._drainStreamBuffer(style, buffer, false);
            buffer = parsed.buffer;
            if (parsed.text) {
                fullText += parsed.text;
                onChunk(parsed.text);
            }
            if (parsed.done) break;
        }

        buffer += decoder.decode();
        const tail = this._drainStreamBuffer(style, buffer, true);
        if (tail.text) {
            fullText += tail.text;
            onChunk(tail.text);
        }
        return fullText;
    },

    _drainStreamBuffer(style, buffer, flush = false) {
        const lines = buffer.split(/\r?\n/);
        const rest = flush ? '' : (lines.pop() || '');
        let text = '';
        let done = false;

        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line || line.startsWith(':') || line.startsWith('event:')) continue;
            let payload = line.startsWith('data:') ? line.slice(5).trim() : line;
            if (!payload) continue;
            if (payload === '[DONE]') {
                done = true;
                continue;
            }
            try {
                const data = JSON.parse(payload);
                text += this._parseStreamChunk(style, data);
            } catch (e) {
                // Some proxies split JSON across chunks; keep the last unfinished line for the next read.
                if (!flush) return { text, done, buffer: `${payload}\n${rest}` };
            }
        }
        return { text, done, buffer: rest };
    },

    _parseStreamChunk(style, data) {
        if (!data) return '';
        if (style === 'anthropic') {
            if (data.type === 'content_block_delta') {
                return data.delta?.text || data.delta?.partial_json || '';
            }
            if (data.type === 'content_block_start') {
                return data.content_block?.text || '';
            }
            if (data.content) return this._parseModelResponse(style, data);
            return '';
        }
        if (style === 'gemini') {
            return (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
        }
        const choices = data.choices || [];
        const streamed = choices.map(choice => {
            const delta = choice.delta || {};
            const content = delta.content ?? choice.text ?? '';
            if (Array.isArray(content)) return content.map(p => p.text || p.content || '').join('');
            return content || '';
        }).join('');
        return streamed || this._parseModelResponse(style, data);
    },

    _toOpenAIMessage(id, msg) {
        const role = msg.role === 'assistant' ? 'assistant' : (msg.role === 'system' ? 'system' : 'user');
        if (role === 'system') return { role, content: msg.content || '' };
        const attachments = msg._attachments || [];
        const text = this._composeText(msg.content || '', attachments);
        const images = attachments.filter(f => f.type === 'image');
        if (images.length) {
            this._assertVision(id);
            return {
                role,
                content: [
                    { type: 'text', text },
                    ...images.map(f => ({ type: 'image_url', image_url: { url: f.dataUrl } }))
                ]
            };
        }
        return { role, content: text };
    },

    _toAnthropicMessage(id, msg) {
        const role = msg.role === 'assistant' ? 'assistant' : 'user';
        const attachments = msg._attachments || [];
        const text = this._composeText(msg.content || '', attachments);
        const images = attachments.filter(f => f.type === 'image');
        if (images.length) {
            this._assertVision(id);
            return {
                role,
                content: [
                    { type: 'text', text },
                    ...images.map(f => ({
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: f.mime || 'image/png',
                            data: this._dataUrlPayload(f.dataUrl)
                        }
                    }))
                ]
            };
        }
        return { role, content: text };
    },

    _toGeminiContent(id, msg) {
        const attachments = msg._attachments || [];
        const text = this._composeText(msg.content || '', attachments);
        const images = attachments.filter(f => f.type === 'image');
        if (images.length) this._assertVision(id);
        return {
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [
                { text },
                ...images.map(f => ({
                    inlineData: {
                        mimeType: f.mime || 'image/png',
                        data: this._dataUrlPayload(f.dataUrl)
                    }
                }))
            ]
        };
    },

    _composeText(content, attachments) {
        const textParts = (attachments || [])
            .filter(f => f.type === 'text')
            .map(f => `\n\n【附件：${f.name}】\n${f.text || ''}`);
        return `${content || ''}${textParts.join('')}`.trim() || '请处理附件内容。';
    },

    _parseModelResponse(style, data) {
        if (style === 'anthropic') {
            const parts = data.content || [];
            return parts.map(p => p.text || '').join('').trim() || data.completion || '';
        }
        if (style === 'gemini') {
            return (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
        }
        const content = data.choices?.[0]?.message?.content;
        if (Array.isArray(content)) return content.map(p => p.text || p.content || '').join('').trim();
        return content || data.choices?.[0]?.text || data.output_text || data.response || data.content || '';
    },

    _mergeExtraBody(body, config) {
        if (!config.extraJson) return;
        try {
            Object.assign(body, JSON.parse(config.extraJson));
        } catch (e) {}
    },

    _assertVision(id) {
        if (!this._capEnabled(id, 'vision')) {
            throw new Error('当前模型未开启图像输入；换视觉模型或在配置里打开图像输入');
        }
    },

    _dataUrlPayload(dataUrl) {
        return String(dataUrl || '').split(',')[1] || '';
    },

    copyMessage(index) {
        const msg = this.messages[index];
        if (!msg) return;
        Utils.copy(msg.role === 'user' ? (msg.content || '') : this._displayText(msg.content || ''));
    },

    copyLastAnswer() {
        const msg = [...this.messages].reverse().find(m => m.role === 'assistant' && m.content);
        if (!msg) return UI.toast('没有可复制的回复');
        Utils.copy(this._displayText(msg.content));
    },

    exportCurrentSession() {
        if (!this.messages.length) return UI.toast('当前会话为空');
        const session = this._session();
        const md = `# ${session?.title || '网页对话'}\n\n` + this.messages.map(m => {
            const name = this._chatMessageLabel(m);
            return `## ${name}\n\n${m.content}`;
        }).join('\n\n');
        Utils.copy(md);
        UI.toast('已复制 Markdown');
    },

    autoGrow(textarea) {
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 192) + 'px';
    },

    _scrollBottom() {
        setTimeout(() => {
            const scroller = document.getElementById('webchat-scroll');
            if (scroller) scroller.scrollTop = scroller.scrollHeight;
        }, 20);
    },

    _shouldAutoScroll(scroller = document.getElementById('webchat-scroll')) {
        if (!scroller) return true;
        const distance = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
        return distance < 96;
    },

    _session() {
        return this.sessions.find(s => s.id === this.currentSessionId);
    },

    _model() {
        return this._modelById(this.currentModel);
    },

    _modelById(id) {
        return this._visibleModels().find(m => m.id === id) || this.models[0];
    },

    _messageModel(msg) {
        return this._modelById(msg.modelId || this.currentModel);
    },

    _chatMessageLabel(msg) {
        if (msg.role === 'user') {
            const target = msg.targetModelId ? this._modelById(msg.targetModelId)?.name : '';
            return target ? `我 → ${target}` : '我';
        }
        return this._modelById(msg.modelId || this.currentModel)?.name || '模型';
    },

    _formatChatMessageForContext(msg) {
        const label = this._chatMessageLabel(msg);
        return `【${label}】\n${this._displayText(msg.content || '')}`.trim();
    },

    _config(id) {
        const model = this._modelById(id);
        if (model.poolApi) {
            const api = model.poolApi;
            return {
                apiStyle: this._providerToStyle(api.provider),
                baseUrl: api.base_url || model.baseUrl || '',
                apiKey: api.api_key || '',
                modelName: api.model_name || '',
                temperature: api.temperature ?? 0.7,
                maxTokens: api.max_tokens || 4096,
                historyLimit: api.historyLimit || 0,
                systemPrompt: api.systemPrompt || model.system || '',
                capabilities: this.configs[id]?.capabilities || null,
                extraJson: api.extraJson || ''
            };
        }
        const saved = this.configs[id] || {};
        return {
            apiStyle: saved.apiStyle || model.apiStyle || 'openai',
            baseUrl: saved.baseUrl ?? model.baseUrl ?? '',
            apiKey: saved.apiKey || '',
            modelName: saved.modelName || '',
            temperature: saved.temperature ?? 0.7,
            maxTokens: saved.maxTokens || 4096,
            historyLimit: saved.historyLimit || 0,
            systemPrompt: saved.systemPrompt || model.system || '',
            capabilities: saved.capabilities || null,
            extraJson: saved.extraJson || ''
        };
    },

    _isConfigured(id) {
        const config = this._config(id);
        const model = this._modelById(id);
        const keyOk = !!config.apiKey || model.providerId === 'ollama';
        return !!(keyOk && config.modelName && (config.baseUrl || config.apiStyle === 'gemini'));
    },

    _configuredCount() {
        return this._visibleModels().filter(m => this._isConfigured(m.id)).length;
    },

    _capEnabled(id, cap) {
        const model = this._modelById(id);
        const saved = this.configs[id]?.capabilities;
        if (saved && Object.prototype.hasOwnProperty.call(saved, cap)) return !!saved[cap];
        return (model.caps || []).includes(cap);
    },

    _normalizeCurrentModel() {
        const legacy = { gpt: 'openai', claude: 'claude', gemini: 'gemini', deepseek: 'deepseek' };
        this.currentModel = legacy[this.currentModel] || this.currentModel;
        if (!this._visibleModels().some(m => m.id === this.currentModel)) this.currentModel = 'openai';
        localStorage.setItem('web_chat_model', this.currentModel);
    },

    _visibleModels() {
        if (typeof this._allModels === 'function') return this._allModels();
        return this.models || [];
    },

    _allModels() {
        const poolIds = new Set((this.poolModels || []).map(m => m.id));
        return [...(this.poolModels || []), ...this.models.filter(m => !poolIds.has(m.id))];
    },

    _isMasterModel(id) {
        const model = this._modelById(id);
        return !!(model.poolApi && (model.poolApi.is_master === 1 || model.poolApi.is_active === 1));
    },

    _providerToStyle(provider) {
        if (provider === 'claude') return 'anthropic';
        if (provider === 'gemini') return 'gemini';
        return 'openai';
    },

    _styleToProvider(style, fallback = 'custom') {
        if (style === 'anthropic') return 'claude';
        if (style === 'gemini') return 'gemini';
        return fallback || 'custom';
    },

    _readAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    _turnNumberForIndex(index) {
        let n = 0;
        for (let i = 0; i <= index; i++) {
            if (this.messages[i]?.role === 'user') n++;
        }
        return Math.max(1, n);
    },

    _displayText(content) {
        return this._splitModelOutput(this._stripTerminalBlocks(this._extractOutputTrace(content).answer)).answer;
    },

    _renderRunTrace(msg) {
        const meta = msg?.meta || {};
        const trace = this._extractOutputTrace(msg?.content || '');
        const split = this._splitModelOutput(this._stripTerminalBlocks(trace.answer));
        const panels = [];
        if (meta.deepThink || trace.thinking) {
            const seconds = meta.elapsedMs ? Math.max(1, Math.round(meta.elapsedMs / 1000)) : 0;
            const title = meta.elapsedMs ? `已思考(用时${seconds}秒)` : '正在思考';
            const lines = [
                meta.useReasoning ? '已请求模型推理能力。' : '当前模型未标注原生推理，已使用提示词增强。',
                trace.thinking || split.process || '未返回额外思考摘要，正文已按最终答案展示。'
            ];
            panels.push(this._renderTracePanel('brain', title, lines.join('\n')));
        }
        if (meta.webSearch || trace.search) {
            const title = meta.nativeWebSearch ? '联网检索(已尝试原生搜索)' : '联网检索(已请求)';
            const urlLines = (trace.urls || meta.searchUrls || []).slice(0, 8).map(url => `- ${url}`);
            const lines = [
                meta.useWebSearch ? '当前模型标注了联网能力，已要求返回检索记录。' : '当前模型未标注原生联网；如果没有检索记录，不应视为真实搜索。',
                trace.search || '模型没有返回明确的【联网记录】。',
                urlLines.length ? `\n识别到的链接：\n${urlLines.join('\n')}` : ''
            ].filter(Boolean);
            panels.push(this._renderTracePanel('globe', title, lines.join('\n')));
        }
        return panels.join('');
    },

    _renderTracePanel(icon, title, body) {
        return `
            <details class="webchat-run-panel">
                <summary><i class="fa-solid fa-${icon}"></i><span>${this._escape(title)}</span></summary>
                <div>${this._escape(body || '').replace(/\n/g, '<br>')}</div>
            </details>`;
    },

    _extractOutputTrace(content) {
        let text = String(content || '').trim();
        const result = { thinking: '', search: '', answer: text, urls: [] };
        if (!text) return result;

        const capture = label => {
            const re = new RegExp(`【${label}】([\\s\\S]*?)(?=\\n?【(?:思考摘要|联网记录|正文|终端请求)】|$)`, 'i');
            const match = text.match(re);
            if (!match) return '';
            text = text.replace(match[0], '').trim();
            return (match[1] || '').trim();
        };

        result.thinking = capture('思考摘要');
        result.search = capture('联网记录');
        const body = String(content || '').match(/【正文】([\s\S]*)/i);
        result.answer = (body ? body[1] : text.replace(/【正文】/g, '')).trim();
        const urlSource = `${result.search}\n${result.answer}`;
        result.urls = Array.from(new Set((urlSource.match(/https?:\/\/[^\s)）\]】>"']+/g) || []).map(x => x.replace(/[.,;，。；]+$/, ''))));
        return result;
    },

    _splitModelOutput(content) {
        let text = String(content || '').trim();
        if (!text) return { process: '', answer: '' };

        const thinkBlocks = [];
        text = text.replace(/<think>([\s\S]*?)<\/think>/gi, (_, inner) => {
            if (inner.trim()) thinkBlocks.push(inner.trim());
            return '';
        }).trim();

        const hasProcessSignal = /Here's a thinking process|Analyze the Context|Self-Correction|Output Generation|分析当前情况|让我分析一下会议记录|构思发言|检查规则|最终输出确认|确定我的立场/i.test(text);
        if (!hasProcessSignal) return { process: thinkBlocks.join('\n\n'), answer: text };

        const candidates = [];
        const pushLast = pattern => {
            const matches = Array.from(text.matchAll(pattern));
            const last = matches.at(-1);
            if (last) candidates.push({ index: last.index + (last[1] ? last[0].indexOf(last[1]) : 0), text: last[1] || last[0] });
        };

        pushLast(/\n(结论[:：][\s\S]*)/g);
        pushLast(/最终输出确认[。.\s]*(\S[\s\S]*)/g);
        pushLast(/(?:✅\s*)?Output Generation[^\n]*\n+(\S[\s\S]*)/gi);
        pushLast(/\n(同意[^\n]{2,90}[。！？：，,][\s\S]*)/g);

        const chosen = candidates
            .filter(c => c.text && c.text.trim().length >= 30)
            .sort((a, b) => b.index - a.index)[0];

        if (!chosen) return { process: thinkBlocks.join('\n\n'), answer: text };
        const process = [thinkBlocks.join('\n\n'), text.slice(0, chosen.index).trim()].filter(Boolean).join('\n\n');
        return { process, answer: chosen.text.trim() || text };
    },

    _renderMarkdown(content) {
        const trace = this._extractOutputTrace(content);
        const split = this._splitModelOutput(this._stripTerminalBlocks(trace.answer));
        const answer = split.answer || '';
        const safe = this._escape(answer);
        const processHtml = split.process ? `
            <details class="webchat-process">
                <summary><i class="fa-solid fa-eye-slash"></i><span>过程稿已折叠</span></summary>
                <div>${this._escape(split.process).replace(/\n/g, '<br>')}</div>
            </details>` : '';
        if (typeof marked === 'undefined') return processHtml + safe.replace(/\n/g, '<br>');
        try {
            return processHtml + marked.parse(answer);
        } catch (e) {
            return processHtml + safe.replace(/\n/g, '<br>');
        }
    },

    _renderUserContent(content) {
        return this._escape(content || '').replace(/\n/g, '<br>');
    },

    _escape(value) {
        return String(value ?? '').replace(/[&<>"']/g, ch => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[ch]));
    },

    _attr(value) {
        return this._escape(value).replace(/`/g, '&#96;');
    }
};

Modules.web_chat.currentModel = localStorage.getItem('web_chat_model') || 'openai';
