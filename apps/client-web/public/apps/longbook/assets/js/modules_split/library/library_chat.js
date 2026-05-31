

// ============================================
// 网页对话 (web_chat) - 大幅升级版
// 5种AI人格 + 会话管理 + RAG上下文 + 打字动画 + IO调试
// 新增: 多轮记忆 + 对话导出 + 快捷指令 + 角色自定义 + 对话分支
// ============================================
Modules.web_chat = {
    sessions: [],
    currentSession: null,
    personas: {
        assistant: { name: '智能助手', icon: 'fa-robot', color: 'blue', desc: '通用AI助手，擅长回答各类问题', system: '你是一个智能助手，请用中文回答用户的问题。' },
        writer:    { name: '写作导师', icon: 'fa-feather-pointed', color: 'amber', desc: '专业写作指导，提供创作建议', system: '你是一位资深写作导师，擅长小说创作指导、文笔提升、情节设计。请用专业但亲切的语气回答。' },
        critic:    { name: '文学评论家', icon: 'fa-glasses', color: 'purple', desc: '犀利的文学批评与深度分析', system: '你是一位严谨的文学评论家，擅长深度文本分析、主题解读、写作技巧评价。请给出专业、有深度的评论。' },
        editor:    { name: '责任编辑', icon: 'fa-pen-ruler', color: 'green', desc: '出版级别的编辑建议', system: '你是一位经验丰富的责任编辑，擅长发现文稿问题、提出修改建议、优化文本结构。请给出具体可操作的编辑意见。' },
        custom:    { name: '自定义角色', icon: 'fa-masks-theater', color: 'pink', desc: '自定义AI人格', system: '' }
    },
    currentPersona: 'assistant',
    ragEnabled: false,
    typing: false,
    shortcuts: [
        { cmd: '/续写', prompt: '请根据上文继续续写300字：' },
        { cmd: '/润色', prompt: '请润色以下文本，提升文笔质量：' },
        { cmd: '/扩写', prompt: '请将以下内容扩写为更详细的段落：' },
        { cmd: '/缩写', prompt: '请将以下内容精简为简洁的摘要：' },
        { cmd: '/翻译', prompt: '请将以下内容翻译为英文：' },
        { cmd: '/大纲', prompt: '请为以下主题生成一个详细的写作大纲：' },
        { cmd: '/workflow', prompt: '调用工作流 (用法: /workflow 工作流名称 输入内容)' },
        { cmd: '/agent', prompt: '调用智能体 (用法: /agent 智能体名称 消息)' },
        { cmd: '/rag', prompt: '调用RAG检索 (用法: /rag 关键词)' }
    ],

    render: () => {
        const WC = Modules.web_chat;
        const p = WC.personas[WC.currentPersona];
        return `
        <div class="flex h-full bg-[#09090b] text-[#e4e4e7] overflow-hidden" id="wc-root">
            <!-- 左侧会话列表 -->
            <div class="w-64 shrink-0 bg-[#111113] border-r border-white/5 flex flex-col">
                <div class="p-3 border-b border-white/5 bg-gradient-to-r from-blue-900/20 to-transparent">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-7 h-7 rounded-lg bg-blue-600/20 flex center border border-blue-600/40 text-blue-500"><i class="fa-solid fa-comments"></i></div>
                        <div>
                            <h2 class="text-sm font-bold text-white">网页对话</h2>
                            <p class="text-[8px] text-dim">多角色 · 多会话 · RAG增强</p>
                        </div>
                    </div>
                    <div class="flex gap-1">
                        <button class="btn flex-1 h-8 rounded bg-blue-600/20 text-blue-400 border border-blue-600/40 hover:bg-blue-600 hover:text-white font-bold text-[10px] flex center gap-1" onclick="Modules.web_chat.newSession()">
                            <i class="fa-solid fa-plus"></i> 新对话
                        </button>
                        <button class="btn h-8 w-8 rounded bg-red-600/20 text-red-400 border border-red-600/40 hover:bg-red-600 hover:text-white text-xs" onclick="Modules.web_chat.delCurrentSession()" title="删除当前对话 (Ctrl+D)">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                        <button class="btn h-8 w-8 rounded bg-yellow-600/20 text-yellow-400 border border-yellow-600/40 hover:bg-yellow-600 hover:text-white text-xs" onclick="Modules.web_chat.clearSession()" title="清空当前对话内容 (Ctrl+L)">
                            <i class="fa-solid fa-broom"></i>
                        </button>
                    </div>
                </div>
                <!-- 角色选择 -->
                <div class="p-2 border-b border-white/5">
                    <div class="text-[8px] font-bold text-dim uppercase tracking-wider px-1 mb-1">AI 角色</div>
                    <div class="flex flex-wrap gap-1">
                        ${Object.entries(WC.personas).map(([k, v]) => `
                            <button class="px-2 py-1 rounded text-[9px] flex items-center gap-1 transition-all ${WC.currentPersona === k ? `bg-${v.color}-500/20 text-${v.color}-400 border border-${v.color}-500/40 font-bold` : 'bg-white/5 text-dim hover:text-white border border-transparent'}" onclick="Modules.web_chat.setPersona('${k}')" title="${v.desc}">
                                <i class="fa-solid ${v.icon} text-[8px]"></i>${v.name}
                            </button>
                        `).join('')}
                    </div>
                </div>
                <!-- 会话列表 -->
                <div class="flex-1 overflow-y-auto p-2 space-y-1" id="wc-session-list"></div>
                <!-- 底部控制 -->
                <div class="p-2 border-t border-white/5 space-y-1">
                    <div class="flex items-center justify-between px-1">
                        <label class="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" class="accent-blue-500 w-3 h-3" ${WC.ragEnabled ? 'checked' : ''} onchange="Modules.web_chat.ragEnabled=this.checked">
                            <span class="text-[9px] text-dim">RAG 上下文增强</span>
                        </label>
                    </div>
                    <button class="btn w-full h-7 text-[9px] bg-white/5 hover:bg-white/10 text-dim" onclick="Modules.web_chat.exportAll()"><i class="fa-solid fa-download mr-1"></i>导出全部对话</button>
                </div>
            </div>
            <!-- 右侧对话区 -->
            <div class="flex-1 flex flex-col relative">
                <!-- 顶栏 -->
                <div class="h-10 flex items-center justify-between px-4 bg-[#111113]/80 backdrop-blur border-b border-white/5 shrink-0">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid ${p.icon} text-${p.color}-400"></i>
                        <span class="text-xs font-bold text-white" id="wc-session-title">${WC.currentSession?.title || '新对话'}</span>
                        <span class="text-[8px] text-dim bg-white/5 px-1.5 py-0.5 rounded">${p.name}</span>
                    </div>
                    <div class="flex gap-1">
                        <button class="w-7 h-7 rounded hover:bg-white/10 flex center text-dim text-xs" onclick="Modules.web_chat.toggleIO()" title="IO调试"><i class="fa-solid fa-terminal"></i></button>
                        <button class="w-7 h-7 rounded hover:bg-white/10 flex center text-dim text-xs" onclick="Modules.web_chat.exportSession()" title="导出"><i class="fa-solid fa-file-export"></i></button>
                        <button class="w-7 h-7 rounded hover:bg-white/10 flex center text-dim text-xs" onclick="Modules.web_chat.clearSession()" title="清空"><i class="fa-solid fa-broom"></i></button>
                    </div>
                </div>
                <!-- IO 调试面板 -->
                <div id="wc-io-panel" class="hidden bg-[#0a0a0c] border-b border-white/5 h-32 flex gap-2 p-2 shrink-0">
                    <div class="flex-1 flex flex-col">
                        <span class="text-[8px] font-bold text-blue-400 mb-0.5">发送 (Prompt)</span>
                        <textarea id="wc-io-in" class="flex-1 bg-black/50 border border-white/5 rounded p-1.5 text-[9px] text-gray-400 font-mono resize-none" readonly></textarea>
                    </div>
                    <div class="flex-1 flex flex-col">
                        <span class="text-[8px] font-bold text-green-400 mb-0.5">接收 (Response)</span>
                        <textarea id="wc-io-out" class="flex-1 bg-black/50 border border-white/5 rounded p-1.5 text-[9px] text-green-400 font-mono resize-none" readonly></textarea>
                    </div>
                </div>
                <!-- 消息区 -->
                <div class="flex-1 overflow-y-auto p-4 space-y-3" id="wc-messages">
                    <div class="flex flex-col items-center justify-center h-full text-dim opacity-30">
                        <i class="fa-solid ${p.icon} text-4xl mb-3"></i>
                        <p class="text-sm font-bold">${p.name}</p>
                        <p class="text-xs mt-1">${p.desc}</p>
                    </div>
                </div>
                <!-- 快捷指令 -->
                <div id="wc-shortcuts" class="hidden absolute bottom-[88px] left-4 right-4 bg-[#1a1a1c] border border-white/10 rounded-lg shadow-xl p-2 z-30">
                    ${WC.shortcuts.map((s, i) => `
                        <button class="w-full text-left px-3 py-1.5 rounded text-xs hover:bg-white/10 text-gray-300" onclick="Modules.web_chat.useShortcut(${i})">${s.cmd} <span class="text-dim ml-2">${s.prompt.slice(0, 20)}...</span></button>
                    `).join('')}
                </div>
                <!-- 输入区 -->
                <div class="p-3 bg-[#111113] border-t border-white/5 shrink-0">
                    <div class="space-y-1.5 mb-2" id="wc-quick-guide">
                        <div class="flex gap-1">
                            <button class="flex-1 px-2 py-1.5 rounded text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all text-left" onclick="document.getElementById('wc-input').value='/workflow ';document.getElementById('wc-input').focus()" title="调用已保存的工作流"><i class="fa-solid fa-diagram-project mr-1"></i>/workflow 工作流</button>
                            <button class="flex-1 px-2 py-1.5 rounded text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all text-left" onclick="document.getElementById('wc-input').value='/agent ';document.getElementById('wc-input').focus()" title="调用已部署的智能体"><i class="fa-solid fa-robot mr-1"></i>/agent 智能体</button>
                            <button class="flex-1 px-2 py-1.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-left" onclick="document.getElementById('wc-input').value='/rag ';document.getElementById('wc-input').focus()" title="RAG上下文检索"><i class="fa-solid fa-magnifying-glass mr-1"></i>/rag 检索</button>
                        </div>
                        <div class="flex gap-1">
                            <button class="flex-1 px-2 py-1 rounded text-[9px] bg-white/5 text-dim hover:text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all" onclick="document.getElementById('wc-input').value='/续写 ';document.getElementById('wc-input').focus()"><i class="fa-solid fa-pen mr-1"></i>续写</button>
                            <button class="flex-1 px-2 py-1 rounded text-[9px] bg-white/5 text-dim hover:text-pink-400 hover:bg-pink-500/10 border border-transparent hover:border-pink-500/20 transition-all" onclick="document.getElementById('wc-input').value='/润色 ';document.getElementById('wc-input').focus()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>润色</button>
                            <button class="flex-1 px-2 py-1 rounded text-[9px] bg-white/5 text-dim hover:text-purple-400 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-all" onclick="document.getElementById('wc-input').value='/扩写 ';document.getElementById('wc-input').focus()"><i class="fa-solid fa-expand mr-1"></i>扩写</button>
                            <button class="flex-1 px-2 py-1 rounded text-[9px] bg-white/5 text-dim hover:text-cyan-400 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 transition-all" onclick="document.getElementById('wc-input').value='/翻译 ';document.getElementById('wc-input').focus()"><i class="fa-solid fa-language mr-1"></i>翻译</button>
                        </div>
                        <div id="wc-custom-workflows" class="flex gap-1 overflow-x-auto"></div>
                    </div>
                    <div class="relative">
                        <textarea id="wc-input" class="w-full bg-black/40 border border-white/10 rounded-xl p-3 pr-12 text-sm resize-none h-20 focus:border-blue-500/50 placeholder-white/20 leading-relaxed text-white" placeholder="输入消息... (输入 / 查看快捷指令)" oninput="Modules.web_chat.onInput(this)" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();Modules.web_chat.send();}"></textarea>
                        <button class="absolute bottom-3 right-3 w-8 h-8 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex center shadow-lg transition-all" id="wc-send-btn" onclick="Modules.web_chat.send()"><i class="fa-solid fa-paper-plane text-xs"></i></button>
                        <div id="wc-gen-status" class="hidden absolute bottom-3 left-3 flex items-center gap-2 bg-blue-600/15 border border-blue-500/25 rounded-lg px-3 py-1.5">
                            <i class="fa-solid fa-circle-notch fa-spin text-blue-400 text-[10px]"></i>
                            <span class="text-[10px] text-blue-300 font-bold" id="wc-gen-label">思考中...</span>
                            <span class="text-[9px] text-dim font-mono" id="wc-gen-chars">0字</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    init: async () => {
        const WC = Modules.web_chat;
        try {
            WC.sessions = await DB.getAll('chat_sessions');
        } catch (e) { WC.sessions = []; }
        WC.sessions.sort((a, b) => (b.ts || 0) - (a.ts || 0));
        
        if (!WC._keyboardListener) {
            WC._keyboardListener = (e) => {
                if (e.ctrlKey && e.key === 'd') {
                    e.preventDefault();
                    Modules.web_chat.delCurrentSession();
                }
                if (e.ctrlKey && e.key === 'l') {
                    e.preventDefault();
                    Modules.web_chat.clearSession();
                }
            };
            document.addEventListener('keydown', WC._keyboardListener);
        }
        
        // 渲染会话列表
        const list = document.getElementById('wc-session-list');
        if (!list) return;
        if (WC.sessions.length === 0) {
            list.innerHTML = '<div class="text-dim text-[10px] text-center p-3 opacity-50">暂无对话记录</div>';
        } else {
            list.innerHTML = WC.sessions.map(s => `
                <div class="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group transition-all ${WC.currentSession?.id === s.id ? 'bg-blue-500/10 border border-blue-500/20' : 'hover:bg-white/5 border border-transparent'}" onclick="Modules.web_chat.loadSession('${s.id}')">
                    <i class="fa-solid fa-message text-[9px] ${WC.currentSession?.id === s.id ? 'text-blue-400' : 'text-dim'}"></i>
                    <span class="flex-1 text-[10px] truncate ${WC.currentSession?.id === s.id ? 'text-white font-bold' : 'text-dim'}">${s.title || '未命名'}</span>
                    <span class="text-[8px] text-dim">${(s.messages || []).length}</span>
                    <button class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-[9px]" onclick="event.stopPropagation();Modules.web_chat.delSession('${s.id}')"><i class="fa-solid fa-xmark"></i></button>
                </div>
            `).join('');
        }
        // 恢复当前会话消息
        if (WC.currentSession) WC._renderMessages();
        // 加载已部署的工作流和智能体到快捷按钮
        const cwEl = document.getElementById('wc-custom-workflows');
        if (cwEl) {
            let btns = '';
            try {
                const TC = Modules.tools_center;
                if (TC) {
                    const wfs = await TC._getSavedWorkflows();
                    const agents = await TC._getAgents();
                    if (wfs.length > 0) {
                        btns += wfs.map(w => `<button class="shrink-0 px-2 py-1 rounded text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all whitespace-nowrap" onclick="document.getElementById('wc-input').value='/workflow ${w.name} ';document.getElementById('wc-input').focus()" title="工作流: ${w.name}"><i class="fa-solid fa-diagram-project mr-1 text-indigo-400/60"></i>${w.name}</button>`).join('');
                    }
                    if (agents.length > 0) {
                        btns += agents.map(a => `<button class="shrink-0 px-2 py-1 rounded text-[9px] bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition-all whitespace-nowrap" onclick="document.getElementById('wc-input').value='/agent ${a.name} ';document.getElementById('wc-input').focus()" title="智能体: ${a.name}"><i class="fa-solid fa-robot mr-1 text-blue-400/60"></i>${a.name}</button>`).join('');
                    }
                }
            } catch(e) {}
            cwEl.innerHTML = btns || '<span class="text-[8px] text-dim/40">在工具中心部署工作流/智能体后，这里会显示快捷按钮</span>';
        }
    },

    newSession: () => {
        const WC = Modules.web_chat;
        const session = { id: Utils.uuid(), title: '新对话', persona: WC.currentPersona, messages: [], ts: Date.now() };
        WC.sessions.unshift(session);
        WC.currentSession = session;
        DB.put('chat_sessions', session);
        WC.init();
        WC._renderMessages();
    },

    loadSession: (id) => {
        const WC = Modules.web_chat;
        const session = WC.sessions.find(s => s.id === id);
        if (!session) return;
        WC.currentSession = session;
        if (session.persona) WC.currentPersona = session.persona;
        WC.init();
        WC._renderMessages();
    },

    delSession: async (id) => {
        const WC = Modules.web_chat;
        await DB.del('chat_sessions', id);
        WC.sessions = WC.sessions.filter(s => s.id !== id);
        if (WC.currentSession?.id === id) WC.currentSession = null;
        WC.init();
        const msgs = document.getElementById('wc-messages');
        if (msgs && !WC.currentSession) {
            const p = WC.personas[WC.currentPersona];
            msgs.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-dim opacity-30"><i class="fa-solid ${p.icon} text-4xl mb-3"></i><p class="text-sm font-bold">${p.name}</p></div>`;
        }
    },

    clearSession: () => {
        const WC = Modules.web_chat;
        if (!WC.currentSession) return;
        if (!confirm('确定清空当前对话？')) return;
        WC.currentSession.messages = [];
        DB.put('chat_sessions', WC.currentSession);
        WC._renderMessages();
    },

    delCurrentSession: async () => {
        const WC = Modules.web_chat;
        if (!WC.currentSession) return UI.toast('没有当前会话');
        if (!confirm('确定删除当前对话？')) return;
        await WC.delSession(WC.currentSession.id);
    },

    setPersona: (key) => {
        const WC = Modules.web_chat;
        WC.currentPersona = key;
        if (key === 'custom') {
            const name = prompt('角色名称：', '自定义角色');
            const system = prompt('系统提示词（角色设定）：', '');
            if (name) WC.personas.custom.name = name;
            if (system) WC.personas.custom.system = system;
        }
        if (WC.currentSession) {
            WC.currentSession.persona = key;
            DB.put('chat_sessions', WC.currentSession);
        }
        // 刷新视图
        const view = document.getElementById('module-view-web_chat');
        if (view) view.innerHTML = WC.render();
        WC.init();
    },

    send: async () => {
        const WC = Modules.web_chat;
        const input = document.getElementById('wc-input');
        const msg = input?.value?.trim();
        if (!msg || WC.typing) return;
        input.value = '';
        document.getElementById('wc-shortcuts')?.classList.add('hidden');

        // 自动创建会话
        if (!WC.currentSession) WC.newSession();
        const session = WC.currentSession;

        // ===== 命令拦截: /workflow /agent /rag =====
        if (msg.startsWith('/workflow ') || msg.startsWith('/agent ') || msg.startsWith('/rag ')) {
            session.messages.push({ role: 'user', content: msg, ts: Date.now() });
            if (session.title === '新对话') session.title = msg.slice(0, 25);
            WC._renderMessages();
            const msgsEl = document.getElementById('wc-messages');
            const persona = WC.personas[WC.currentPersona];

            try {
                let result = '';
                if (msg.startsWith('/workflow ')) {
                    const rest = msg.slice(10).trim();
                    const spaceIdx = rest.indexOf(' ');
                    const wfName = spaceIdx > 0 ? rest.slice(0, spaceIdx) : rest;
                    const wfInput = spaceIdx > 0 ? rest.slice(spaceIdx + 1) : '';
                    const TC = Modules.tools_center;
                    const wfs = await TC._getSavedWorkflows();
                    const wf = wfs.find(w => w.name.includes(wfName) || w.id === wfName);
                    if (!wf) {
                        result = '未找到工作流: ' + wfName + '\n\n可用工作流: ' + (wfs.length > 0 ? wfs.map(w => w.name).join(', ') : '暂无');
                    } else {
                        // IO面板显示
                        const ioIn = document.getElementById('wc-io-in');
                        if (ioIn) ioIn.value = '[工作流: ' + wf.name + ']\n输入: ' + (wfInput || '(无)');
                        // 状态指示
                        WC.typing = true;
                        WC._setGenStatus(true, '工作流 ' + wf.name + ' 执行中...');
                        // 流式占位
                        const streamId = 'wc-wf-stream-' + Date.now();
                        msgsEl.innerHTML += `<div class="flex gap-3" id="${streamId}"><div class="w-7 h-7 rounded-full bg-${persona.color}-500/20 flex center shrink-0 border border-${persona.color}-500/30"><i class="fa-solid ${persona.icon} text-${persona.color}-400 text-[10px]"></i></div><div class="flex-1 max-w-[85%]"><div class="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-300 leading-relaxed" id="${streamId}-body"><i class="fa-solid fa-spinner fa-spin"></i> 工作流执行中: ${wf.name}...</div></div></div>`;
                        msgsEl.scrollTop = msgsEl.scrollHeight;
                        const backup = { nodes: [...TC.nodes], connections: [...TC.connections] };
                        TC.nodes = JSON.parse(JSON.stringify(wf.nodes));
                        TC.connections = JSON.parse(JSON.stringify(wf.connections));
                        try {
                            result = await TC.runWorkflow(wfInput || undefined);
                            const bodyEl = document.getElementById(streamId + '-body');
                            if (bodyEl) bodyEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result || '(无结果)') : (result || '(无结果)');
                        } catch(e) { result = '工作流执行失败: ' + e.message; }
                        TC.nodes = backup.nodes;
                        TC.connections = backup.connections;
                        // IO输出
                        const ioOut = document.getElementById('wc-io-out');
                        if (ioOut) ioOut.value = result || '';
                        // 移除流式占位
                        const streamEl = document.getElementById(streamId);
                        if (streamEl) streamEl.remove();
                        WC.typing = false;
                        WC._setGenStatus(false);
                    }
                } else if (msg.startsWith('/agent ')) {
                    const rest = msg.slice(7).trim();
                    const spaceIdx = rest.indexOf(' ');
                    const agentName = spaceIdx > 0 ? rest.slice(0, spaceIdx) : rest;
                    const agentMsg = spaceIdx > 0 ? rest.slice(spaceIdx + 1) : '';
                    const TC = Modules.tools_center;
                    const agents = await TC._getAgents();
                    const agent = agents.find(a => a.name.includes(agentName) || a.id === agentName);
                    if (!agent) {
                        result = '未找到智能体: ' + agentName + '\n\n可用智能体: ' + (agents.length > 0 ? agents.map(a => a.name).join(', ') : '暂无');
                    } else {
                        const agentPrompt = agent.prompt + (agentMsg ? '\n\n用户输入：\n' + agentMsg : '\n\n请自我介绍并说明你能做什么。');
                        // IO面板显示
                        const ioIn = document.getElementById('wc-io-in');
                        if (ioIn) ioIn.value = '[智能体: ' + agent.name + ']\n' + agentPrompt;
                        // 状态指示
                        WC.typing = true;
                        WC._setGenStatus(true, '智能体 ' + agent.name + ' 生成中...');
                        // 流式输出 — 先插入占位消息
                        const streamId = 'wc-agent-stream-' + Date.now();
                        msgsEl.innerHTML += `<div class="flex gap-3" id="${streamId}"><div class="w-7 h-7 rounded-full bg-${persona.color}-500/20 flex center shrink-0 border border-${persona.color}-500/30"><i class="fa-solid ${persona.icon} text-${persona.color}-400 text-[10px]"></i></div><div class="flex-1 max-w-[85%]"><div class="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-300 leading-relaxed" id="${streamId}-body"><i class="fa-solid fa-circle-notch fa-spin text-blue-400"></i> <span class="text-blue-300">智能体思考中...</span></div></div></div>`;
                        msgsEl.scrollTop = msgsEl.scrollHeight;
                        result = '';
                        await AI.generate(agentPrompt, {}, c => {
                            result += c;
                            const bodyEl = document.getElementById(streamId + '-body');
                            if (bodyEl) bodyEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                            msgsEl.scrollTop = msgsEl.scrollHeight;
                            const ioOut = document.getElementById('wc-io-out');
                            if (ioOut) ioOut.value = result;
                            WC._updateGenChars(result.length);
                        });
                        WC.typing = false;
                        WC._setGenStatus(false);
                        // 如果智能体绑定了工作流，追加执行
                        if (agent.workflowId && result) {
                            const wfs = await TC._getSavedWorkflows();
                            const wf = wfs.find(w => w.id === agent.workflowId);
                            if (wf) {
                                const backup = { nodes: [...TC.nodes], connections: [...TC.connections] };
                                TC.nodes = JSON.parse(JSON.stringify(wf.nodes));
                                TC.connections = JSON.parse(JSON.stringify(wf.connections));
                                try {
                                    const wfResult = await TC.runWorkflow(result);
                                    if (wfResult) result += '\n\n---\n📋 工作流(' + wf.name + ')结果：\n' + wfResult;
                                } catch(e) {}
                                TC.nodes = backup.nodes;
                                TC.connections = backup.connections;
                            }
                        }
                        // 移除流式占位，由后面统一push消息
                        const streamEl = document.getElementById(streamId);
                        if (streamEl) streamEl.remove();
                    }
                } else if (msg.startsWith('/rag ')) {
                    const query = msg.slice(5).trim();
                    if (typeof RAGSystem !== 'undefined') {
                        const results = await RAGSystem.search(query, 10);
                        if (results.length === 0) {
                            result = '未找到与 "' + query + '" 相关的内容';
                        } else {
                            result = '🔍 RAG检索结果 (' + results.length + '条)：\n\n' + results.map((r, i) => `**${i+1}. [${r.source}] ${r.title}** (${(r.score*100).toFixed(0)}分)\n${r.content.slice(0,200)}`).join('\n\n');
                        }
                    } else {
                        result = 'RAG系统不可用';
                    }
                }

                session.messages.push({ role: 'assistant', content: result || '(无结果)', ts: Date.now() });
                session.ts = Date.now();
                await DB.put('chat_sessions', session);
                WC._renderMessages();
                ContextHelper.recordGeneration?.('web_chat_cmd', result?.slice(0, 150));
            } catch(e) {
                session.messages.push({ role: 'assistant', content: '命令执行失败: ' + e.message, ts: Date.now() });
                WC._renderMessages();
            }
            WC.init();
            return;
        }
        // ===== 命令拦截结束 =====

        // 添加用户消息
        session.messages.push({ role: 'user', content: msg, ts: Date.now() });
        // 自动命名
        if (session.title === '新对话' && msg.length > 2) {
            session.title = msg.slice(0, 25) + (msg.length > 25 ? '...' : '');
        }

        WC._renderMessages();
        const msgsEl = document.getElementById('wc-messages');

        // 构建 prompt
        const persona = WC.personas[WC.currentPersona];
        let systemPrompt = persona.system || '';

        // RAG 增强
        if (WC.ragEnabled && typeof RAGSystem !== 'undefined') {
            try {
                const context = await RAGSystem.query(msg);
                if (context) systemPrompt += `\n\n[参考上下文]:\n${context}`;
            } catch (e) {}
        }

        // 多轮记忆 - 取最近10轮
        const history = session.messages.slice(-20).map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`).join('\n');
        const fullPrompt = `${systemPrompt}\n\n对话历史:\n${history}\n\n请回复用户最新的消息。`;

        // IO 调试
        const ioIn = document.getElementById('wc-io-in');
        if (ioIn) ioIn.value = fullPrompt;

        // 显示打字动画
        WC.typing = true;
        WC._setGenStatus(true, '生成中...');
        const typingId = 'wc-typing-' + Date.now();
        msgsEl.innerHTML += `<div class="flex gap-3" id="${typingId}"><div class="w-7 h-7 rounded-full bg-${persona.color}-500/20 flex center shrink-0 border border-${persona.color}-500/30"><i class="fa-solid ${persona.icon} text-${persona.color}-400 text-[10px]"></i></div><div class="bg-white/5 rounded-xl px-3 py-2 text-xs text-dim"><i class="fa-solid fa-ellipsis fa-beat-fade"></i> 思考中...</div></div>`;
        msgsEl.scrollTop = msgsEl.scrollHeight;

        try {
            let result = '';
            const bodyEl = document.getElementById(typingId);
            const streamBodyId = typingId + '-body';
            // 替换打字动画为流式容器
            if (bodyEl) bodyEl.innerHTML = `<div class="w-7 h-7 rounded-full bg-${persona.color}-500/20 flex center shrink-0 border border-${persona.color}-500/30"><i class="fa-solid ${persona.icon} text-${persona.color}-400 text-[10px]"></i></div><div class="flex-1 max-w-[85%]"><div class="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-300 leading-relaxed" id="${streamBodyId}"><i class="fa-solid fa-ellipsis fa-beat-fade"></i> 思考中...</div></div>`;

            await AI.generate(fullPrompt, {}, c => {
                result += c;
                const sEl = document.getElementById(streamBodyId);
                if (sEl) sEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                msgsEl.scrollTop = msgsEl.scrollHeight;
                WC._updateGenChars(result.length);
            });

            const ioOut = document.getElementById('wc-io-out');
            if (ioOut) ioOut.value = result;

            session.messages.push({ role: 'assistant', content: result, ts: Date.now() });
            session.ts = Date.now();
            await DB.put('chat_sessions', session);

            // 移除流式容器，渲染完整消息
            const typingEl = document.getElementById(typingId);
            if (typingEl) typingEl.remove();
            WC._renderMessages();

            // 记录到工作记忆
            ContextHelper.recordGeneration?.('web_chat', result);
        } catch (e) {
            const typingEl = document.getElementById(typingId);
            if (typingEl) typingEl.innerHTML = `<div class="bg-red-900/20 rounded-xl px-3 py-2 text-xs text-red-400">${e.message || '生成失败'}</div>`;
        }
        WC.typing = false;
        WC._setGenStatus(false);
    },

    // 生成状态指示器
    _setGenStatus: (active, label) => {
        const el = document.getElementById('wc-gen-status');
        const labelEl = document.getElementById('wc-gen-label');
        const btn = document.getElementById('wc-send-btn');
        if (el) {
            if (active) {
                el.classList.remove('hidden');
                if (labelEl) labelEl.textContent = label || '思考中...';
            } else {
                el.classList.add('hidden');
            }
        }
        if (btn) {
            if (active) {
                btn.classList.add('opacity-50', 'pointer-events-none');
            } else {
                btn.classList.remove('opacity-50', 'pointer-events-none');
            }
        }
    },
    _updateGenChars: (count) => {
        const el = document.getElementById('wc-gen-chars');
        if (el) el.textContent = count + '字';
    },

    _renderMessages: () => {
        const WC = Modules.web_chat;
        const msgsEl = document.getElementById('wc-messages');
        if (!msgsEl || !WC.currentSession) return;
        const msgs = WC.currentSession.messages || [];
        const persona = WC.personas[WC.currentPersona];
        if (msgs.length === 0) {
            msgsEl.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-dim opacity-30"><i class="fa-solid ${persona.icon} text-4xl mb-3"></i><p class="text-sm font-bold">${persona.name}</p><p class="text-xs mt-1">${persona.desc}</p></div>`;
            return;
        }
        msgsEl.innerHTML = msgs.map((m, i) => {
            if (m.role === 'user') {
                return `<div class="flex gap-3 justify-end"><div class="bg-blue-600/20 border border-blue-500/20 rounded-xl px-3 py-2 text-xs text-white max-w-[75%] leading-relaxed whitespace-pre-wrap">${m.content}</div><div class="w-7 h-7 rounded-full bg-blue-600/30 flex center shrink-0"><i class="fa-solid fa-user text-blue-400 text-[10px]"></i></div></div>`;
            }
            const rendered = typeof marked !== 'undefined' ? marked.parse(m.content) : m.content;
            return `
                <div class="flex gap-3">
                    <div class="w-7 h-7 rounded-full bg-${persona.color}-500/20 flex center shrink-0 border border-${persona.color}-500/30"><i class="fa-solid ${persona.icon} text-${persona.color}-400 text-[10px]"></i></div>
                    <div class="flex-1 max-w-[85%]">
                        <div class="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-300 leading-relaxed">${rendered}</div>
                        <div class="flex gap-2 mt-1 ml-1">
                            <button class="text-[8px] text-dim hover:text-white" onclick="Utils.copy(Modules.web_chat.currentSession.messages[${i}].content);UI.toast('已复制')"><i class="fa-solid fa-copy mr-0.5"></i>复制</button>
                            <button class="text-[8px] text-dim hover:text-amber-400" onclick="ContextHelper.exportToLibrary('对话_'+new Date().toLocaleString(),Modules.web_chat.currentSession.messages[${i}].content);UI.toast('已存入书架')"><i class="fa-solid fa-book mr-0.5"></i>存书架</button>
                        </div>
                    </div>
                </div>`;
        }).join('');
        msgsEl.scrollTop = msgsEl.scrollHeight;
        // 更新标题
        const titleEl = document.getElementById('wc-session-title');
        if (titleEl) titleEl.innerText = WC.currentSession.title || '新对话';
    },

    onInput: (el) => {
        const val = el.value;
        const shortcuts = document.getElementById('wc-shortcuts');
        if (!shortcuts) return;
        if (val.startsWith('/')) {
            shortcuts.classList.remove('hidden');
        } else {
            shortcuts.classList.add('hidden');
        }
    },

    useShortcut: (index) => {
        const WC = Modules.web_chat;
        const sc = WC.shortcuts[index];
        if (!sc) return;
        const input = document.getElementById('wc-input');
        if (input) input.value = sc.prompt;
        document.getElementById('wc-shortcuts')?.classList.add('hidden');
        input?.focus();
    },

    toggleIO: () => {
        document.getElementById('wc-io-panel')?.classList.toggle('hidden');
    },

    exportSession: () => {
        const WC = Modules.web_chat;
        if (!WC.currentSession) return UI.toast('无当前会话');
        const msgs = WC.currentSession.messages || [];
        const text = msgs.map(m => `[${m.role === 'user' ? '用户' : 'AI'}] ${m.content}`).join('\n\n---\n\n');
        Utils.copy(text);
        UI.toast('对话已复制到剪贴板');
    },

    exportAll: () => {
        const WC = Modules.web_chat;
        let text = '# 全部对话导出\n\n';
        WC.sessions.forEach(s => {
            text += `## ${s.title || '未命名'}\n\n`;
            (s.messages || []).forEach(m => {
                text += `**${m.role === 'user' ? '用户' : 'AI'}**: ${m.content}\n\n`;
            });
            text += '---\n\n';
        });
        Utils.copy(text);
        UI.toast('全部对话已复制');
    }
};
