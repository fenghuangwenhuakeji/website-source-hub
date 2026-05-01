// ============================================
// 网页对话 - 极简 AI 聊天版
// 参考: ChatGPT / Gemini / Claude / DeepSeek
// ============================================
Modules.web_chat = {
    sessions: [],
    currentSessionId: null,
    messages: [],
    currentModel: 'gpt',
    _generating: false,
    _draftBeforeRefresh: '',

    models: [
        {
            id: 'gpt',
            name: 'GPT',
            desc: '稳、清楚、执行力强',
            icon: 'fa-bolt',
            prompt: '你是一个直接、清楚、可靠的通用助手。优先给可执行结果，少说套话。'
        },
        {
            id: 'claude',
            name: 'Claude',
            desc: '长文、分析、温和细致',
            icon: 'fa-feather',
            prompt: '你是一个擅长长文理解、结构化分析和谨慎表达的助手。回答要清晰、有层次，不编造。'
        },
        {
            id: 'gemini',
            name: 'Gemini',
            desc: '检索感、发散、方案对比',
            icon: 'fa-gem',
            prompt: '你是一个擅长发散思考、方案对比和快速整理信息的助手。先抓重点，再给路径。'
        },
        {
            id: 'deepseek',
            name: 'DeepSeek',
            desc: '推理、代码、硬核问题',
            icon: 'fa-code',
            prompt: '你是一个擅长推理、代码和复杂问题拆解的助手。先判断问题本质，再给最短可行解。'
        }
    ],

    render() {
        const WC = Modules.web_chat;
        const model = WC._model();
        return `
        <div class="flex h-full bg-[#0b0b0d] text-white overflow-hidden">
            <aside class="w-72 shrink-0 border-r border-white/10 bg-[#111113] flex flex-col">
                <div class="p-4 border-b border-white/10">
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <h2 class="text-base font-bold">网页对话</h2>
                            <p class="text-[11px] text-dim mt-1">像主流 AI 一样聊天</p>
                        </div>
                        <button class="h-9 w-9 rounded-lg bg-white text-black hover:bg-zinc-200 flex center" title="新对话" onclick="Modules.web_chat.newSession()">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                </div>

                <div class="p-3 border-b border-white/10">
                    <div class="grid grid-cols-2 gap-2">
                        ${WC.models.map(m => `
                            <button class="rounded-lg border ${WC.currentModel === m.id ? 'border-white/30 bg-white/15 text-white' : 'border-white/5 bg-white/[0.03] text-gray-400 hover:bg-white/[0.07]'} p-2 text-left transition" onclick="Modules.web_chat.switchModel('${m.id}')">
                                <div class="text-xs font-bold"><i class="fa-solid ${m.icon} mr-1"></i>${m.name}</div>
                                <div class="text-[9px] opacity-70 mt-1 truncate">${m.desc}</div>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto p-2">
                    ${WC._renderSessions()}
                </div>

                <div class="p-3 border-t border-white/10 flex gap-2">
                    <button class="h-8 flex-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-300" onclick="Modules.web_chat.exportCurrentSession()">
                        <i class="fa-solid fa-download mr-1"></i>导出
                    </button>
                    <button class="h-8 flex-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-300" onclick="Modules.web_chat.clearCurrentSession()">
                        <i class="fa-solid fa-broom mr-1"></i>清空
                    </button>
                </div>
            </aside>

            <main class="flex-1 min-w-0 flex flex-col bg-[#0f0f11]">
                <header class="h-14 shrink-0 border-b border-white/10 flex items-center justify-between px-5 bg-[#111113]">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="h-9 w-9 rounded-lg bg-white/10 border border-white/10 flex center">
                            <i class="fa-solid ${model.icon}"></i>
                        </div>
                        <div class="min-w-0">
                            <div class="text-sm font-bold truncate">${model.name}</div>
                            <div class="text-[10px] text-dim truncate">${model.desc}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-300" onclick="Modules.web_chat.copyLastAnswer()">
                            <i class="fa-solid fa-copy mr-1"></i>复制回复
                        </button>
                        <button class="h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-300" onclick="Modules.web_chat.regenerate()">
                            <i class="fa-solid fa-rotate-right mr-1"></i>重答
                        </button>
                    </div>
                </header>

                <section class="flex-1 overflow-y-auto" id="webchat-scroll">
                    <div class="max-w-3xl mx-auto px-5 py-8 space-y-6" id="webchat-messages">
                        ${WC._renderMessages()}
                    </div>
                </section>

                <footer class="shrink-0 border-t border-white/10 bg-[#111113] px-5 py-4">
                    <div class="max-w-3xl mx-auto">
                        <div class="rounded-2xl border border-white/10 bg-black/30 focus-within:border-white/25 transition">
                            <textarea id="webchat-input" class="w-full min-h-[76px] max-h-48 bg-transparent resize-none outline-none p-4 text-sm text-white placeholder-white/30" placeholder="问任何问题，Shift+Enter 换行" oninput="Modules.web_chat._draftBeforeRefresh=this.value;Modules.web_chat.autoGrow(this)" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();Modules.web_chat.sendMessage()}">${WC._escape(WC._draftBeforeRefresh)}</textarea>
                            <div class="flex items-center justify-between px-3 pb-3">
                                <div class="flex gap-1.5">
                                    ${['总结', '翻译', '润色', '写代码'].map(t => `
                                        <button class="h-7 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-gray-300" onclick="Modules.web_chat.fillPrompt('${t}')">${t}</button>
                                    `).join('')}
                                </div>
                                <button id="webchat-send" class="h-9 w-9 rounded-xl ${WC._generating ? 'bg-white/20 text-white/50' : 'bg-white text-black hover:bg-zinc-200'} flex center" onclick="Modules.web_chat.sendMessage()" ${WC._generating ? 'disabled' : ''}>
                                    <i class="fa-solid ${WC._generating ? 'fa-spinner fa-spin' : 'fa-arrow-up'}"></i>
                                </button>
                            </div>
                        </div>
                        <div class="text-[10px] text-dim text-center mt-2">AI 可能出错，重要内容自己复核。</div>
                    </div>
                </footer>
            </main>
        </div>`;
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

    _renderMessages() {
        if (!this.messages.length) {
            const model = this._model();
            return `
                <div class="min-h-[55vh] flex items-center justify-center">
                    <div class="text-center max-w-lg">
                        <div class="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex center mx-auto mb-5">
                            <i class="fa-solid ${model.icon} text-2xl"></i>
                        </div>
                        <h3 class="text-2xl font-bold">${model.name}</h3>
                        <p class="text-sm text-dim mt-2">${model.desc}</p>
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
                    </div>
                </div>`;
        }

        return this.messages.map((m, i) => {
            const isUser = m.role === 'user';
            return `
                <div class="flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}">
                    ${isUser ? '' : `<div class="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex center shrink-0"><i class="fa-solid ${this._model().icon} text-xs"></i></div>`}
                    <div class="${isUser ? 'max-w-[78%]' : 'max-w-[86%] flex-1'}">
                        <div class="rounded-2xl ${isUser ? 'bg-white text-black' : 'bg-white/[0.06] border border-white/10 text-gray-100'} px-4 py-3 text-sm leading-relaxed markdown-body">
                            ${this._renderMarkdown(m.content || (m.streaming ? '思考中...' : ''))}
                        </div>
                        <div class="flex gap-3 mt-1 px-1 ${isUser ? 'justify-end' : ''}">
                            <button class="text-[10px] text-dim hover:text-white" onclick="Modules.web_chat.copyMessage(${i})"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                        </div>
                    </div>
                </div>`;
        }).join('');
    },

    async init() {
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
        const view = document.getElementById('module-view-web_chat');
        if (view) view.innerHTML = this.render();
        setTimeout(() => {
            const nextInput = document.getElementById('webchat-input');
            if (nextInput) {
                this.autoGrow(nextInput);
                nextInput.focus();
                nextInput.selectionStart = nextInput.selectionEnd = nextInput.value.length;
            }
        }, 20);
    },

    _renderMessagesOnly() {
        const el = document.getElementById('webchat-messages');
        if (el) el.innerHTML = this._renderMessages();
        this._scrollBottom();
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
        this.refresh();
        this._scrollBottom();
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

    switchModel(id) {
        this.currentModel = id;
        localStorage.setItem('web_chat_model', id);
        this.refresh();
    },

    setInput(text) {
        const input = document.getElementById('webchat-input');
        if (!input) return;
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
            '写代码': '请帮我写代码。需求如下：\n\n'
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
        if (!content) return;
        if (!this.currentSessionId) await this.newSession(false);

        this._generating = true;
        this._draftBeforeRefresh = '';
        if (input) input.value = '';

        const userMsg = { role: 'user', content, ts: Date.now() };
        const assistantMsg = { role: 'assistant', content: '', ts: Date.now(), streaming: true };
        this.messages.push(userMsg, assistantMsg);
        this._touchSession(content, '');
        this.refresh();
        this._scrollBottom();

        let answer = '';
        const prompt = this._buildPrompt();
        try {
            const generated = await AI.generate(prompt, {}, chunk => {
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
        this._touchSession(content, answer);
        await this._saveMessages();
        await this._saveSessions();
        this.refresh();
        this._scrollBottom();
    },

    _buildPrompt() {
        const model = this._model();
        const history = this.messages
            .filter(m => !m.streaming)
            .slice(-12)
            .map(m => `${m.role === 'user' ? '用户' : '助手'}：${m.content}`)
            .join('\n\n');
        return `${model.prompt}\n\n请根据下面对话继续回答。\n\n${history}`;
    },

    _touchSession(userText, answerText) {
        const s = this._session();
        if (!s) return;
        if (!s.title || s.title === '新对话') s.title = userText.slice(0, 28).replace(/\s+/g, ' ') || '新对话';
        s.preview = (answerText || userText).slice(0, 80).replace(/\s+/g, ' ');
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

    copyMessage(index) {
        const msg = this.messages[index];
        if (!msg) return;
        Utils.copy(msg.content || '');
        UI.toast('已复制');
    },

    copyLastAnswer() {
        const msg = [...this.messages].reverse().find(m => m.role === 'assistant' && m.content);
        if (!msg) return UI.toast('没有可复制的回复');
        Utils.copy(msg.content);
        UI.toast('已复制');
    },

    exportCurrentSession() {
        if (!this.messages.length) return UI.toast('当前会话为空');
        const session = this._session();
        const md = `# ${session?.title || '网页对话'}\n\n` + this.messages.map(m => `## ${m.role === 'user' ? '我' : this._model().name}\n\n${m.content}`).join('\n\n');
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
        return this.models.find(m => m.id === this.currentModel) || this.models[0];
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

Modules.web_chat.currentModel = localStorage.getItem('web_chat_model') || 'gpt';
