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

    room: {
        topic: '',
        rounds: 2,
        participants: ['openai', 'claude', 'gemini', 'deepseek'],
        messages: []
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
            caps: ['text', 'vision', 'long', 'reasoning', 'json', 'tools'],
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
            caps: ['text', 'vision', 'long', 'reasoning'],
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
            caps: ['text', 'vision', 'long', 'json'],
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
            caps: ['text', 'vision', 'long', 'reasoning'],
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
            caps: ['text', 'long', 'json'],
            system: '你擅长资料型问答和结论整理。无法确认的内容要明确标注。'
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
            caps: ['text', 'vision', 'long', 'reasoning', 'json', 'tools'],
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
        return `
        <div class="flex h-full bg-[#0b0b0d] text-white overflow-hidden">
            <aside class="w-80 shrink-0 border-r border-white/10 bg-[#111113] flex flex-col">
                <div class="p-4 border-b border-white/10">
                    <div class="flex items-center justify-between gap-3">
                        <div class="min-w-0">
                            <h2 class="text-base font-bold">网页对话</h2>
                            <p class="text-[11px] text-dim mt-1 truncate">每个模型接自己的 API</p>
                        </div>
                        <button class="h-9 w-9 rounded-lg bg-white text-black hover:bg-zinc-200 flex center" title="新对话" onclick="Modules.web_chat.newSession()">
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
                        ${WC.models.map(m => WC._renderModelButton(m)).join('')}
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
                            <div class="text-[10px] text-dim truncate">${WC.mode === 'room' ? '多个已配置模型轮流发言，最后可总结' : `${model.provider} / ${configured ? (config.modelName || '已配置') : '需要配置 API'}`}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        ${WC.mode === 'chat' ? `
                            <button class="h-8 px-3 rounded-lg ${configured ? 'bg-green-500/10 text-green-300 border border-green-500/20' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'} hover:bg-white/10 text-[11px]" onclick="Modules.web_chat.openConfig('${model.id}')">
                                <i class="fa-solid fa-key mr-1"></i>${configured ? 'API 已配' : '配置 API'}
                            </button>
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

                ${WC.mode === 'room' ? WC._renderRoomMain() : WC._renderChatMain()}
            </main>
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
                    <div class="rounded-2xl border border-white/10 bg-black/30 focus-within:border-white/25 transition">
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
                    <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div class="flex items-center justify-between gap-3 mb-3">
                            <div>
                                <div class="text-sm font-bold">参会模型</div>
                                <div class="text-[10px] text-dim mt-1">只会调用已配置 API 的模型；未配置的模型不会发言。</div>
                            </div>
                            <div class="flex items-center gap-2">
                                <label class="text-[10px] text-dim">轮次</label>
                                <input id="webchat-room-rounds" type="number" min="1" max="5" value="${this.room.rounds || 2}" class="w-16 h-8 rounded-lg bg-black/30 border border-white/10 px-2 text-xs text-white" onchange="Modules.web_chat.setRoomRounds(this.value)">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                            ${this.models.map(m => this._renderRoomParticipant(m)).join('')}
                        </div>
                    </div>
                    ${this._renderMeetingMessages()}
                </div>
            </section>
            <footer class="shrink-0 border-t border-white/10 bg-[#111113] px-5 py-4">
                <div class="max-w-5xl mx-auto">
                    <div class="rounded-2xl border border-white/10 bg-black/30 focus-within:border-white/25 transition">
                        <textarea id="webchat-room-topic" class="w-full min-h-[72px] max-h-40 bg-transparent resize-none outline-none p-4 text-sm text-white placeholder-white/30" placeholder="输入会议主题，比如：让这些模型讨论我的小说下一步怎么推进" oninput="Modules.web_chat.room.topic=this.value;Modules.web_chat.autoGrow(this)">${this._escape(this.room.topic || '')}</textarea>
                        <div class="flex items-center justify-between px-3 pb-3 gap-3">
                            <div class="text-[10px] text-dim truncate">建议 2-4 个模型，越多越慢、越耗额度。</div>
                            <button class="h-9 px-4 rounded-xl ${this._roomRunning ? 'bg-white/20 text-white/50' : 'bg-white text-black hover:bg-zinc-200'} text-xs font-bold shrink-0" onclick="Modules.web_chat.startMeeting()" ${this._roomRunning ? 'disabled' : ''}>
                                <i class="fa-solid ${this._roomRunning ? 'fa-spinner fa-spin' : 'fa-play'} mr-1"></i>${this._roomRunning ? '讨论中' : '开始讨论'}
                            </button>
                        </div>
                    </div>
                </div>
            </footer>`;
    },

    _renderModelButton(m) {
        const active = this.currentModel === m.id;
        const configured = this._isConfigured(m.id);
        return `
            <button class="group rounded-lg border ${active ? 'border-white/30 bg-white/15 text-white' : 'border-white/5 bg-white/[0.03] text-gray-400 hover:bg-white/[0.07]'} p-2 text-left transition min-w-0" onclick="Modules.web_chat.switchModel('${m.id}')">
                <div class="flex items-center justify-between gap-2">
                    <div class="text-xs font-bold truncate"><i class="fa-solid ${m.icon} mr-1"></i>${m.name}</div>
                    <span class="h-2 w-2 rounded-full shrink-0 ${configured ? 'bg-green-400' : 'bg-amber-400/70'}" title="${configured ? '已配置' : '需要 API'}"></span>
                </div>
                <div class="text-[9px] opacity-70 mt-1 truncate">${m.desc}</div>
                <div class="flex items-center justify-between gap-2 mt-2">
                    <span class="text-[9px] ${configured ? 'text-green-300' : 'text-amber-300'}">${configured ? '可用' : '需配置'}</span>
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
                    会议记录 ${this.room.messages.length} 条。
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
            const mm = this._messageModel(m);
            return `
                <div class="flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}">
                    ${isUser ? '' : `<div class="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex center shrink-0"><i class="fa-solid ${mm.icon} text-xs"></i></div>`}
                    <div class="${isUser ? 'max-w-[78%]' : 'max-w-[86%] flex-1'}">
                        ${!isUser ? `<div class="text-[10px] text-dim mb-1">${mm.name}</div>` : ''}
                        <div class="rounded-2xl ${isUser ? 'bg-white text-black' : 'bg-white/[0.06] border border-white/10 text-gray-100'} px-4 py-3 text-sm leading-relaxed markdown-body">
                            ${this._renderMarkdown(m.content || (m.streaming ? '请求中...' : ''))}
                            ${this._renderMessageAttachments(m)}
                        </div>
                        <div class="flex gap-3 mt-1 px-1 ${isUser ? 'justify-end' : ''}">
                            <button class="text-[10px] text-dim hover:text-white" onclick="Modules.web_chat.copyMessage(${i})"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                        </div>
                    </div>
                </div>`;
        }).join('');
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
                        <div class="text-xs text-dim mt-2 max-w-md leading-relaxed">各模型按轮次发言，互相看见前面的讨论。适合方案对比、小说路线、产品判断、复杂决策。</div>
                    </div>
                </div>`;
        }
        return this.room.messages.map(m => {
            const model = m.modelId ? this._modelById(m.modelId) : null;
            const isUser = m.role === 'user';
            const title = isUser ? '会议主题' : (m.role === 'host' ? '主持人总结' : `${model?.name || '模型'} · 第 ${m.round || 1} 轮`);
            return `
                <div class="rounded-2xl border ${isUser ? 'border-white/20 bg-white text-black' : 'border-white/10 bg-white/[0.05] text-gray-100'} p-4">
                    <div class="flex items-center justify-between gap-3 mb-2">
                        <div class="text-xs font-bold ${isUser ? 'text-black' : 'text-white'}">
                            <i class="fa-solid ${isUser ? 'fa-bullseye' : (m.role === 'host' ? 'fa-file-lines' : (model?.icon || 'fa-robot'))} mr-1"></i>${this._escape(title)}
                        </div>
                        ${m.streaming ? '<span class="text-[10px] text-amber-300"><i class="fa-solid fa-spinner fa-spin mr-1"></i>发言中</span>' : ''}
                    </div>
                    <div class="text-sm leading-relaxed markdown-body">${this._renderMarkdown(m.content || '')}</div>
                </div>`;
        }).join('');
    },

    _renderRoomParticipant(m) {
        const selected = this.room.participants.includes(m.id);
        const configured = this._isConfigured(m.id);
        return `
            <button class="rounded-xl border p-3 text-left transition ${selected ? 'border-white/30 bg-white/10' : 'border-white/10 bg-black/20 hover:bg-white/[0.06]'}" onclick="Modules.web_chat.toggleRoomParticipant('${m.id}')">
                <div class="flex items-center justify-between gap-2">
                    <div class="text-xs font-bold truncate"><i class="fa-solid ${m.icon} mr-1"></i>${m.name}</div>
                    <span class="text-[9px] ${configured ? 'text-green-300' : 'text-amber-300'}">${configured ? '可用' : '需 API'}</span>
                </div>
                <div class="text-[10px] text-dim mt-1 truncate">${m.provider}</div>
            </button>`;
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
            tools: '原生工具'
        };
        return ['text', 'vision', 'long', 'reasoning', 'json', 'tools'].filter(cap => this._capEnabled(id, cap)).map(cap => `
            <span class="text-[10px] rounded-full bg-white/5 border border-white/10 text-gray-300 px-2 py-1">${labels[cap] || cap}</span>
        `).join('');
    },

    async init() {
        await this._loadConfigs();
        await this._loadRoom();
        this._normalizeCurrentModel();
        await this._loadSessions();
        if (!this.sessions.length) await this.newSession(false);
        if (!this.currentSessionId && this.sessions[0]) this.currentSessionId = this.sessions[0].id;
        await this._loadMessages(this.currentSessionId);
        this.refresh();
        this._scrollBottom();
    },

    refresh() {
        const input = document.getElementById('webchat-input');
        if (input) this._draftBeforeRefresh = input.value;
        const topic = document.getElementById('webchat-room-topic');
        if (topic) this.room.topic = topic.value;
        const view = document.getElementById('module-view-web_chat');
        if (view) view.innerHTML = this.render();
        setTimeout(() => {
            const nextInput = document.getElementById(this.mode === 'room' ? 'webchat-room-topic' : 'webchat-input');
            if (nextInput && !this._generating && !this._roomRunning) {
                this.autoGrow(nextInput);
                nextInput.focus();
                nextInput.selectionStart = nextInput.selectionEnd = nextInput.value.length;
            }
        }, 20);
    },

    _renderMessagesOnly() {
        const el = document.getElementById('webchat-messages');
        if (el) el.innerHTML = this.mode === 'room' ? this._renderRoomMainMessagesOnly() : this._renderMessages();
        this._scrollBottom();
    },

    _renderRoomMainMessagesOnly() {
        return `
            <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div class="flex items-center justify-between gap-3 mb-3">
                    <div>
                        <div class="text-sm font-bold">参会模型</div>
                        <div class="text-[10px] text-dim mt-1">只会调用已配置 API 的模型；未配置的模型不会发言。</div>
                    </div>
                    <div class="flex items-center gap-2">
                        <label class="text-[10px] text-dim">轮次</label>
                        <input id="webchat-room-rounds" type="number" min="1" max="5" value="${this.room.rounds || 2}" class="w-16 h-8 rounded-lg bg-black/30 border border-white/10 px-2 text-xs text-white" onchange="Modules.web_chat.setRoomRounds(this.value)">
                    </div>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                    ${this.models.map(m => this._renderRoomParticipant(m)).join('')}
                </div>
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

    async _loadRoom() {
        try {
            const saved = await DB.get('settings', 'web_chat_meeting_room_v1');
            if (saved?.room) this.room = { ...this.room, ...saved.room };
        } catch (e) {}
    },

    async _saveRoom() {
        await DB.put('settings', { id: 'web_chat_meeting_room_v1', room: this.room });
    },

    async newSession(doRefresh = true) {
        const now = Date.now();
        const session = { id: Utils.uuid(), title: '新对话', preview: '', createdAt: now, updatedAt: now };
        this.sessions.unshift(session);
        this.currentSessionId = session.id;
        this.messages = [];
        this._draftBeforeRefresh = '';
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
        if (!this.currentSessionId || !this.messages.length) return;
        if (!confirm('清空当前会话？')) return;
        this.messages = [];
        const session = this._session();
        if (session) {
            session.preview = '';
            session.title = '新对话';
            session.updatedAt = Date.now();
        }
        await this._saveMessages();
        await this._saveSessions();
        this.refresh();
    },

    setMode(mode, doRefresh = true) {
        this.mode = mode === 'room' ? 'room' : 'chat';
        localStorage.setItem('web_chat_mode', this.mode);
        if (doRefresh) this.refresh();
    },

    switchModel(id) {
        this.currentModel = id;
        localStorage.setItem('web_chat_model', id);
        this.setMode('chat', false);
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
        const input = document.getElementById('webchat-input');
        const content = (input?.value || '').trim();
        if (!content && !this._pendingFiles.length) return;
        if (!this._isConfigured(this.currentModel)) {
            UI.toast('先配置这个模型的 API');
            this.openConfig(this.currentModel);
            return;
        }
        if (!this.currentSessionId) await this.newSession(false);

        this._generating = true;
        this._draftBeforeRefresh = '';
        const apiAttachments = this._pendingFiles.slice();
        const visibleAttachments = apiAttachments.map(f => ({ type: f.type, name: f.name, mime: f.mime, size: f.size }));
        this._pendingFiles = [];
        if (input) input.value = '';

        const userMsg = { role: 'user', content, attachments: visibleAttachments, ts: Date.now() };
        const assistantMsg = { role: 'assistant', modelId: this.currentModel, content: '', ts: Date.now(), streaming: true };
        this.messages.push(userMsg, assistantMsg);
        this._touchSession(content || visibleAttachments.map(f => f.name).join(', '), '');
        this.refresh();
        this._scrollBottom();

        let answer = '';
        const apiMessages = this._buildChatMessages(userMsg, apiAttachments);
        try {
            const generated = await this._callModel(this.currentModel, apiMessages, {}, chunk => {
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
            answer = '生成失败：' + (e.message || e);
            assistantMsg.content = answer;
            this._renderMessagesOnly();
        }

        delete assistantMsg.streaming;
        this._generating = false;
        this._touchSession(content || '附件消息', answer);
        await this._saveMessages();
        await this._saveSessions();
        this.refresh();
        this._scrollBottom();
    },

    _buildChatMessages(latestUserMsg, latestAttachments) {
        const model = this._model();
        const config = this._config(model.id);
        const historyLimit = Number(config.historyLimit || 0) || (this._capEnabled(model.id, 'long') ? 40 : 16);
        const clean = this.messages
            .filter(m => !m.streaming)
            .slice(-historyLimit)
            .map(m => ({
                role: m.role,
                content: m.content || '',
                _attachments: m === latestUserMsg ? latestAttachments : []
            }));
        return [
            { role: 'system', content: config.systemPrompt || model.system || '' },
            ...clean
        ];
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
        this._draftBeforeRefresh = lastUser;
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

    toggleRoomParticipant(id) {
        const set = new Set(this.room.participants || []);
        if (set.has(id)) set.delete(id);
        else set.add(id);
        this.room.participants = Array.from(set);
        this._saveRoom();
        this.refresh();
    },

    setRoomRounds(value) {
        const n = Math.max(1, Math.min(5, Number(value) || 2));
        this.room.rounds = n;
        this._saveRoom();
    },

    async startMeeting() {
        if (this._roomRunning) return;
        const topicEl = document.getElementById('webchat-room-topic');
        const topic = (topicEl?.value || this.room.topic || '').trim();
        if (!topic) return UI.toast('先写会议主题');
        const participants = (this.room.participants || []).filter(id => this._isConfigured(id));
        if (participants.length < 2) return UI.toast('至少配置两个模型 API，会议室才有意义');

        this.room.topic = topic;
        this.room.messages = [{ role: 'user', content: topic, ts: Date.now() }];
        this._roomRunning = true;
        await this._saveRoom();
        this.refresh();

        const rounds = Math.max(1, Math.min(5, Number(this.room.rounds) || 2));
        for (let round = 1; round <= rounds; round++) {
            for (const id of participants) {
                if (!this._roomRunning) break;
                const msg = { role: 'model', modelId: id, round, content: '', streaming: true, ts: Date.now() };
                this.room.messages.push(msg);
                this._renderMessagesOnly();
                try {
                    let answer = '';
                    const generated = await this._callModel(id, this._buildMeetingMessages(id, topic, round), {}, chunk => {
                        answer += chunk;
                        msg.content = answer;
                        this._renderMessagesOnly();
                    });
                    if (!answer.trim() && generated) msg.content = generated;
                } catch (e) {
                    msg.content = '发言失败：' + (e.message || e);
                }
                delete msg.streaming;
                await this._saveRoom();
                this._renderMessagesOnly();
            }
        }
        this._roomRunning = false;
        await this._saveRoom();
        this.refresh();
    },

    _buildMeetingMessages(id, topic, round) {
        const model = this._modelById(id);
        const config = this._config(id);
        const transcript = this.room.messages
            .filter(m => !m.streaming)
            .map(m => {
                if (m.role === 'user') return `【会议主题】${m.content}`;
                if (m.role === 'host') return `【主持人总结】${m.content}`;
                const name = this._modelById(m.modelId)?.name || '模型';
                return `【${name} 第${m.round || 1}轮】${m.content}`;
            })
            .join('\n\n');
        return [
            {
                role: 'system',
                content: `${config.systemPrompt || model.system || ''}\n你正在参加一个多模型会议。你的任务是贡献不同视角，不要重复前面模型的话。输出只写你的发言，不要客套。`
            },
            {
                role: 'user',
                content: `会议主题：${topic}\n当前轮次：第 ${round} 轮\n\n已有讨论：\n${transcript || '暂无'}\n\n请给出你的判断、理由和下一步建议。`
            }
        ];
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
        this.refresh();
        try {
            let answer = '';
            const transcript = this.room.messages
                .filter(m => !m.streaming)
                .map(m => `${m.role === 'user' ? '主题' : (this._modelById(m.modelId)?.name || '模型')}：${m.content}`)
                .join('\n\n');
            const generated = await this._callModel(id, [
                { role: 'system', content: '你是会议主持人。只做收束，不展开新讨论。' },
                { role: 'user', content: `请总结下面多模型会议，输出：共识、分歧、最好方案、马上执行的三步。\n\n${transcript}` }
            ], {}, chunk => {
                answer += chunk;
                msg.content = answer;
                this._renderMessagesOnly();
            });
            if (!answer.trim() && generated) msg.content = generated;
        } catch (e) {
            msg.content = '总结失败：' + (e.message || e);
        }
        delete msg.streaming;
        this._roomRunning = false;
        await this._saveRoom();
        this.refresh();
    },

    async clearMeeting() {
        if (this._roomRunning) return UI.toast('会议还在进行');
        if (!this.room.messages.length) return;
        if (!confirm('清空会议记录？')) return;
        this.room.messages = [];
        await this._saveRoom();
        this.refresh();
    },

    exportMeeting() {
        if (!this.room.messages.length) return UI.toast('会议室为空');
        const md = `# 多模型会议室\n\n主题：${this.room.topic || ''}\n\n` + this.room.messages.map(m => {
            const name = m.role === 'user' ? '会议主题' : (m.role === 'host' ? '主持人总结' : (this._modelById(m.modelId)?.name || '模型'));
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
                    <button class="h-9 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300" onclick="Modules.web_chat.importActiveApi('${id}')">
                        <i class="fa-solid fa-right-left mr-1"></i>套用系统激活 API
                    </button>
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
        this.configs[id] = {
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
        let req;
        if (style === 'anthropic') req = this._buildAnthropicRequest(id, messages, config, options);
        else if (style === 'gemini') req = this._buildGeminiRequest(id, messages, config, options);
        else req = this._buildOpenAIRequest(id, messages, config, options);

        const res = await fetch(req.url, {
            method: 'POST',
            headers: req.headers,
            body: JSON.stringify(req.body)
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`API ${res.status}: ${text.slice(0, 220)}`);
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
            stream: false
        };
        this._mergeExtraBody(body, config);
        return {
            url: `${base}/chat/completions`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
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
        this._mergeExtraBody(body, config);
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
        this._mergeExtraBody(body, config);
        return {
            url: `${base}/models/${encodeURIComponent(config.modelName)}:generateContent?key=${encodeURIComponent(config.apiKey)}`,
            headers: { 'Content-Type': 'application/json' },
            body
        };
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
        Utils.copy(msg.content || '');
    },

    copyLastAnswer() {
        const msg = [...this.messages].reverse().find(m => m.role === 'assistant' && m.content);
        if (!msg) return UI.toast('没有可复制的回复');
        Utils.copy(msg.content);
    },

    exportCurrentSession() {
        if (!this.messages.length) return UI.toast('当前会话为空');
        const session = this._session();
        const md = `# ${session?.title || '网页对话'}\n\n` + this.messages.map(m => {
            const name = m.role === 'user' ? '我' : (this._modelById(m.modelId)?.name || this._model().name);
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

    _session() {
        return this.sessions.find(s => s.id === this.currentSessionId);
    },

    _model() {
        return this._modelById(this.currentModel);
    },

    _modelById(id) {
        return this.models.find(m => m.id === id) || this.models[0];
    },

    _messageModel(msg) {
        return this._modelById(msg.modelId || this.currentModel);
    },

    _config(id) {
        const model = this._modelById(id);
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
        return !!(config.apiKey && config.modelName && (config.baseUrl || config.apiStyle === 'gemini'));
    },

    _configuredCount() {
        return this.models.filter(m => this._isConfigured(m.id)).length;
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
        if (!this.models.some(m => m.id === this.currentModel)) this.currentModel = 'openai';
        localStorage.setItem('web_chat_model', this.currentModel);
    },

    _readAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    _renderMarkdown(content) {
        const safe = this._escape(content || '');
        if (typeof marked === 'undefined') return safe.replace(/\n/g, '<br>');
        try {
            return marked.parse(content || '');
        } catch (e) {
            return safe.replace(/\n/g, '<br>');
        }
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
