const app = {
    toggleSection(titleEl) {
        const card = titleEl.closest('.section-card');
        if (!card) return;
        const body = card.querySelector('.section-body');
        const arrow = titleEl.querySelector('.section-arrow');
        if (!body) return;
        const isOpen = card.dataset.section === 'open';
        if (isOpen) {
            body.style.display = 'none';
            card.dataset.section = 'closed';
            if (arrow) arrow.textContent = '▶';
        } else {
            body.style.display = '';
            card.dataset.section = 'open';
            if (arrow) arrow.textContent = '▼';
        }
    },
    switchView: (id) => uiManager.switchView(id),
    startFusion: () => {},
    switchWritingTab: (tab) => writingView.selectMode(tab),
    startWriting: () => writingView.startWriting(),

    toggleLibraryPicker: (target, type) => pickerManager.open(target, type),
    switchPickerTab: (type) => pickerManager.switchTab(type),
    confirmLibrarySelection: () => pickerManager.confirm(),
    clearAllSelection: () => pickerManager.clear(),
    closeLibraryPicker: () => pickerManager.close(),
    filterLibraryBooks: (el) => pickerManager.filterBooks(el.value),
    filterPrompts: (el) => pickerManager.filterPrompts(el.value),

    addApiConfig: () => settingsView.openAddModal(),
    editApiConfig: (id) => settingsView.editConfig(id),
    saveApiConfig: () => settingsView.saveConfig(),
    deleteApiConfig: (id) => settingsView.deleteConfig(id),
    setActiveApi: (id) => settingsView.setActive(id),
    testApiConfig: () => settingsView.testConnection(),
    closeApiModal: () => uiManager.closeModal('api-modal'),

    createBook: async () => {
        const title = await appPrompt('请输入书名');
        if (!title) return;
        try {
            console.log('createBook: db._db =', !!db._db);
            await libraryManager.addBook(title, '', []);
        } catch (e) {
            console.error('createBook failed:', e);
            showNotification('新建失败: ' + e.message, 'error');
        }
    },
    deleteBook: (id) => { if (confirm('确定删除?')) libraryManager.deleteBook(id); },
    importBooks: () => { document.getElementById('book-import-input').click(); },
    analyzeBook: async (id) => {
        const book = libraryManager.getBook(id);
        if (!book) return;
        // 切换到短篇拆书视图，自动选中该书
        app.switchView('fusion');
        const sel = document.getElementById('fb-book-select');
        if (sel) { sel.value = id; fusionView.selectBook(id); }
        showNotification(`已加载《${book.title}》到短篇拆书`, 'success');
    },
    editBookTags: async (id) => {
        const book = libraryManager.getBook(id);
        if (!book) return;
        const currentTags = (book.tags || []).join(', ');
        const input = await appPrompt('编辑标签(逗号分隔)', currentTags);
        if (input !== null) {
            const tags = input.split(/[,，]/).map(t => t.trim()).filter(Boolean);
            await libraryManager.updateBook(id, { tags });
            showNotification('标签已更新', 'success');
        }
    },
    viewBook: (id) => {
        const book = libraryManager.getBook(id);
        if (book) {
            document.getElementById('book-modal-title').textContent = '查看/编辑书籍';
            document.getElementById('book-title-input').value = book.title;
            document.getElementById('book-content-input').value = book.content;
            document.getElementById('book-modal').dataset.id = id;
            uiManager.showModal('book-modal');
        }
    },
    saveBookContent: async () => {
        const id = parseInt(document.getElementById('book-modal').dataset.id);
        const book = libraryManager.getBook(id);
        if (book) {
            book.title = document.getElementById('book-title-input').value;
            book.content = document.getElementById('book-content-input').value;
            await db.put('books', book);
            await libraryManager.loadAll();
            uiManager.closeModal('book-modal');
            showNotification('书籍已更新', 'success');
        }
    },
    closeBookModal: () => uiManager.closeModal('book-modal'),
    copyBookContent: () => copyToClipboard(document.getElementById('book-content-input').value),
    saveToLibrary: async (id) => {
        const content = document.getElementById(id).textContent;
        if (!content) return;
        const title = await appPrompt('请输入书名');
        if (title) await libraryManager.addBook(title, content);
    },

    saveToLocal: async (id) => {
        const content = document.getElementById(id).textContent;
        if (!content) return;
        const title = await appPrompt('文件名', '融合结果_' + new Date().toLocaleDateString('zh-CN').replace(/\//g, '-'));
        if (!title) return;
        var filename = title.replace(/[\\/:*?"<>|]/g, '_') + '.json';
        await localFS.saveJSON(filename, { title: title, content: content, createdAt: new Date().toISOString(), source: 'fusion' });
        showNotification('已保存: ' + filename, 'success');
    },

    createPromptTemplate: () => {
        document.getElementById('modal-title').textContent = '新建提示词';
        document.getElementById('modal-prompt-name').value = '';
        document.getElementById('modal-prompt-name').removeAttribute('readonly');
        document.getElementById('modal-prompt-content').value = '';
        document.getElementById('edit-modal').dataset.key = '';
        uiManager.showModal('edit-modal');
    },
    editPrompt: (key) => {
        const p = libraryManager.getPrompt(key);
        if (p) {
            document.getElementById('modal-title').textContent = '编辑提示词';
            document.getElementById('modal-prompt-name').value = PROMPT_NAMES[key] || key;
            document.getElementById('modal-prompt-content').value = p.value;
            document.getElementById('edit-modal').dataset.key = key;
            uiManager.showModal('edit-modal');
        }
    },
    viewPrompt: (key) => {
        const p = libraryManager.getPrompt(key);
        if (p) {
            document.getElementById('view-prompt-title').textContent = '查看提示词';
            document.getElementById('view-prompt-name').value = PROMPT_NAMES[key] || key;
            document.getElementById('view-prompt-content').value = p.value;
            uiManager.showModal('view-prompt-modal');
        }
    },
    deletePrompt: (key) => { if (confirm('确定删除?')) libraryManager.deletePrompt(key); },
    saveModalPrompt: async () => {
        const key = document.getElementById('edit-modal').dataset.key || document.getElementById('modal-prompt-name').value.trim();
        if (!key) return showNotification('请输入名称', 'error');
        await libraryManager.savePrompt(key, document.getElementById('modal-prompt-content').value);
        uiManager.closeModal('edit-modal');
        showNotification('已保存', 'success');
    },
    closeModal: () => uiManager.closeModal('edit-modal'),
    closeViewPromptModal: () => uiManager.closeModal('view-prompt-modal'),
    copyPromptContent: () => copyToClipboard(document.getElementById('view-prompt-content').value),

    // 市场分析报告模态框
    closeViewReportModal: () => uiManager.closeModal('view-report-modal'),
    copyReportContent: () => copyToClipboard(document.getElementById('view-report-content').value),
    loadReportToMarket: () => {
        const content = document.getElementById('view-report-content').value;
        uiManager.closeModal('view-report-modal');
        app.switchView('market');
        // 将报告内容加载到市场分析
        if (window.marketView && content) {
            // 创建一个临时的报告对象
            const report = {
                title: document.getElementById('view-report-title').textContent,
                content: content,
                mode: 'loaded'
            };
            window.marketView.loadReport(report);
        }
    },
    copyResult: (id) => copyToClipboard(document.getElementById(id).textContent),

    sendChat: async (type) => {
        const input = document.getElementById(type + '-chat-input');
        const sendBtn = document.getElementById(type + '-send-btn');
        if (!input || !input.value.trim()) { showNotification('请输入内容', 'error'); return; }
        if (sendBtn.classList.contains('loading')) return;

        const content = input.value.trim();
        input.value = '';
        input.style.height = 'auto';
        sendBtn.classList.add('loading');
        sendBtn.querySelector('.send-icon').textContent = '⟳';

        // 清除欢迎页
        const container = document.getElementById(type + '-chat-container');
        const welcome = container.querySelector('.chat-welcome');
        if (welcome) welcome.remove();

        // 添加用户消息到会话
        chatManager.addMessage(type, 'user', content);
        const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        const userMsg = document.createElement('div');
        userMsg.className = 'chat-message user';
        userMsg.innerHTML = `<div class="chat-message-header"><span>👤 用户</span><span class="chat-message-time">${time}</span></div><div class="chat-message-content">${_escapeHtml(content)}</div><div class="chat-msg-actions"><button class="chat-msg-btn" onclick="copyToClipboard(this.closest('.chat-message').querySelector('.chat-message-content').textContent)">📋 复制</button></div>`;
        container.appendChild(userMsg);

        // 添加打字指示器
        const typing = document.createElement('div');
        typing.className = 'chat-typing';
        typing.id = type + '-typing';
        typing.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div><div class="chat-typing-label">AI 思考中...</div>`;
        container.appendChild(typing);
        container.scrollTop = container.scrollHeight;

        try {
            // 构建多轮对话消息列表
            const messages = app._buildChatMessages(type, content);

            // 获取API配置
            const config = await apiClient.getActiveConfig();
            if (!config) throw new Error('请先在API设置中添加并激活API配置');

            // 移除打字指示器，添加AI消息容器
            typing.remove();
            const aiMsg = document.createElement('div');
            aiMsg.className = 'chat-message assistant streaming';
            aiMsg.innerHTML = `<div class="chat-message-header"><span>🤖 AI</span><span class="chat-message-time">${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span></div><div class="chat-message-content"></div>`;
            container.appendChild(aiMsg);
            const aiContent = aiMsg.querySelector('.chat-message-content');

            // 流式请求
            let fullResponse = '';
            const { url, headers, body } = app._buildMultiTurnRequest(config, messages);
            const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
            if (!response.ok) {
                let errDetail = `HTTP ${response.status}`;
                try { const errBody = await response.text(); errDetail += ': ' + errBody.substring(0, 200); } catch(_){}
                throw new Error(errDetail);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === 'data: [DONE]') continue;
                    if (trimmed.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(trimmed.slice(6));
                            const text = apiClient.parseStreamChunk(config.provider, data);
                            if (text) {
                                fullResponse += text;
                                aiContent.textContent = fullResponse;
                                container.scrollTop = container.scrollHeight;
                            }
                        } catch (e) { /* skip non-JSON lines */ }
                    }
                }
            }
            // 处理buffer中剩余数据
            if (buffer.trim().startsWith('data: ') && buffer.trim() !== 'data: [DONE]') {
                try {
                    const data = JSON.parse(buffer.trim().slice(6));
                    const text = apiClient.parseStreamChunk(config.provider, data);
                    if (text) fullResponse += text;
                } catch(e) {}
            }

            // 完成 - 渲染最终消息(支持Markdown格式化)
            aiMsg.classList.remove('streaming');
            const formattedResponse = app._formatAIResponse(fullResponse);
            aiMsg.innerHTML = `<div class="chat-message-header"><span>🤖 AI</span><span class="chat-message-time">${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span></div><div class="chat-message-content">${formattedResponse}</div><div class="chat-msg-actions"><button class="chat-msg-btn" onclick="copyToClipboard(this.closest('.chat-message').querySelector('.chat-message-content').textContent)">📋 复制</button><button class="chat-msg-btn" onclick="app.saveChatMsg(this)">💾 保存</button></div>`;

            // 存入会话
            chatManager.addMessage(type, 'assistant', fullResponse);

            // 后处理: 记忆 + 知识图谱
            if (typeof memoryEngine !== 'undefined' && fullResponse.length > 50) {
                memoryEngine.rag.addDocument(fullResponse.substring(0, 2000), { type: 'chat', source: type });
            }
            if (typeof knowledgeGraph !== 'undefined' && fullResponse.length > 100) {
                knowledgeGraph.extractFromText(fullResponse.substring(0, 3000), 'chat-' + type);
            }
            fusionView._updateMemoryPanel();
            app._renderKGMiniView();

        } catch (e) {
            const existingTyping = document.getElementById(type + '-typing');
            if (existingTyping) existingTyping.remove();
            const errMsg = document.createElement('div');
            errMsg.className = 'chat-message system';
            errMsg.innerHTML = `<div class="chat-message-header">⚠️ 错误</div><div class="chat-message-content" style="color:var(--error);">${_escapeHtml(e.message)}</div>`;
            container.appendChild(errMsg);
            showNotification('对话失败: ' + e.message, 'error');
        }

        sendBtn.classList.remove('loading');
        sendBtn.querySelector('.send-icon').textContent = '▶';
        container.scrollTop = container.scrollHeight;
    },

    _buildChatMessages(type, currentContent) {
        const session = chatManager.getSession(type);
        const messages = [];

        // 系统提示 + 记忆上下文
        let systemPrompt = '你是StoryForge智能创作助手，擅长故事分析、创意融合、写作优化。请用中文回答。';
        if (typeof memoryEngine !== 'undefined') {
            try {
                const ctx = memoryEngine.buildContext(currentContent, 4000);
                if (ctx.context) systemPrompt += '\n\n以下是相关上下文:\n' + ctx.context;
            } catch (e) {}
        }

        // 压缩摘要
        if (session.compressedSummary) {
            systemPrompt += '\n\n之前的对话摘要:\n' + session.compressedSummary;
        }

        messages.push({ role: 'system', content: systemPrompt });

        // 历史消息(最近10轮)
        const history = session.messages.slice(-20);
        for (const m of history) {
            messages.push({ role: m.role, content: m.content });
        }

        // 当前消息已在history中(刚addMessage过)
        return messages;
    },

    _buildMultiTurnRequest(config, messages) {
        const { provider, api_key, base_url, model_name } = config;
        let url, headers = { 'Content-Type': 'application/json' }, body;

        if (provider === 'gemini') {
            url = `https://generativelanguage.googleapis.com/v1beta/models/${model_name || 'gemini-1.5-flash'}:streamGenerateContent?key=${api_key}&alt=sse`;
            const contents = [];
            // Gemini: system instruction 单独传，不放contents
            const systemMsg = messages.find(m => m.role === 'system');
            const chatMsgs = messages.filter(m => m.role !== 'system');
            // 确保contents不以model开头，且user/model交替
            for (const m of chatMsgs) {
                const role = m.role === 'assistant' ? 'model' : 'user';
                // 合并连续同角色消息
                if (contents.length > 0 && contents[contents.length - 1].role === role) {
                    contents[contents.length - 1].parts[0].text += '\n\n' + m.content;
                } else {
                    contents.push({ role, parts: [{ text: m.content }] });
                }
            }
            // 确保第一条是user
            if (contents.length > 0 && contents[0].role === 'model') {
                contents.unshift({ role: 'user', parts: [{ text: '请继续' }] });
            }
            body = { contents };
            if (systemMsg) {
                body.systemInstruction = { parts: [{ text: systemMsg.content }] };
            }
        } else if (provider === 'claude') {
            url = `${base_url || 'https://api.anthropic.com'}/v1/messages`;
            headers['x-api-key'] = api_key;
            headers['anthropic-version'] = '2023-06-01';
            const system = messages.find(m => m.role === 'system')?.content || '';
            const chatMsgs = messages.filter(m => m.role !== 'system');
            // Claude要求第一条必须是user
            const validMsgs = [];
            for (const m of chatMsgs) {
                // 合并连续同角色消息
                if (validMsgs.length > 0 && validMsgs[validMsgs.length - 1].role === m.role) {
                    validMsgs[validMsgs.length - 1].content += '\n\n' + m.content;
                } else {
                    validMsgs.push({ role: m.role, content: m.content });
                }
            }
            // 确保第一条是user
            if (validMsgs.length > 0 && validMsgs[0].role !== 'user') {
                validMsgs.unshift({ role: 'user', content: '请继续' });
            }
            body = { model: model_name, max_tokens: 4096, system, messages: validMsgs, stream: true };
        } else {
            // OpenAI / DeepSeek / 自定义兼容
            url = `${base_url}/chat/completions`;
            if (api_key) headers['Authorization'] = `Bearer ${api_key}`;
            body = { model: model_name, messages, stream: true };
        }
        return { url, headers, body };
    },

    quickChat: (type, text) => {
        const input = document.getElementById(type + '-chat-input');
        if (input) { input.value = text; app.sendChat(type); }
    },

    clearChat: (type) => {
        if (!confirm('确定清空对话记录？')) return;
        chatManager.clearSession(type);
        const container = document.getElementById(type + '-chat-container');
        const icon = type === 'fusion' ? '💬' : '✍️';
        const title = type === 'fusion' ? '智能对话助手' : '写作对话助手';
        container.innerHTML = `<div class="chat-welcome"><div class="chat-welcome-icon">${icon}</div><div class="chat-welcome-title">${title}</div><div class="chat-welcome-desc">对话已清空，开始新的对话</div></div>`;
        showNotification('对话已清空', 'success');
    },

    compressChat: async (type) => {
        try {
            showNotification('正在压缩对话历史...', 'info');
            const result = await chatManager.smartCompress(type);
            if (result) {
                fusionView.renderChat(type);
                showNotification('对话已压缩', 'success');
            } else {
                showNotification('对话太短，无需压缩', 'info');
            }
        } catch (e) {
            showNotification('压缩失败: ' + e.message, 'error');
        }
    },

    chatKeyDown: (e, type) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            app.sendChat(type);
        }
    },

    autoResizeInput: (el) => {
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    },

    saveChatMsg: async (btn) => {
        const content = btn.closest('.chat-message').querySelector('.chat-message-content').textContent;
        if (!content) return;
        const title = await appPrompt('请输入书名');
        if (title) await libraryManager.addBook(title, content);
    },

    // AI回复格式化(简易Markdown渲染)
    _formatAIResponse(text) {
        if (!text) return '';
        let html = _escapeHtml(text);
        // Markdown 表格
        html = html.replace(/^(\|.+\|)\n(\|[\s\-:|]+\|)\n((?:\|.+\|\n?)+)/gm, function(match, header, sep, body) {
            var ths = header.split('|').filter(function(c) { return c.trim(); }).map(function(c) { return '<th>' + c.trim() + '</th>'; }).join('');
            var rows = body.trim().split('\n').map(function(row) {
                var tds = row.split('|').filter(function(c) { return c.trim(); }).map(function(c) { return '<td>' + c.trim() + '</td>'; }).join('');
                return '<tr>' + tds + '</tr>';
            }).join('');
            return '<table class="ai-table"><thead><tr>' + ths + '</tr></thead><tbody>' + rows + '</tbody></table>';
        });
        // 代码块 ```
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="chat-code-block"><code>$2</code></pre>');
        // 行内代码
        html = html.replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>');
        // 加粗
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // 斜体
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        // 标题 (### ## #)
        html = html.replace(/^### (.+)$/gm, '<div class="chat-heading-3">$1</div>');
        html = html.replace(/^## (.+)$/gm, '<div class="chat-heading-2">$1</div>');
        html = html.replace(/^# (.+)$/gm, '<div class="chat-heading-1">$1</div>');
        // 列表
        html = html.replace(/^[-•] (.+)$/gm, '<div class="chat-list-item">• $1</div>');
        html = html.replace(/^\d+\. (.+)$/gm, '<div class="chat-list-item-num">$1</div>');
        // 分隔线
        html = html.replace(/^---+$/gm, '<hr class="chat-hr">');
        return html;
    },

    // 记忆系统操作
    refreshMemoryPanel: () => {
        fusionView._updateMemoryPanel();
        app._renderKGMiniView();
        showNotification('面板已刷新', 'success');
    },
    clearMemory: () => {
        if (!confirm('确定清空所有记忆数据？')) return;
        try {
            if (typeof memoryEngine !== 'undefined') {
                memoryEngine.working.clear();
                memoryEngine.session.create();
                memoryEngine.rag.clear();
            }
            if (typeof knowledgeGraph !== 'undefined') knowledgeGraph.clear();
            fusionView._updateMemoryPanel();
            app._renderKGMiniView();
            showNotification('记忆已清空', 'success');
        } catch (e) {
            console.error('清空记忆失败:', e);
            showNotification('清空失败', 'error');
        }
    },
    reindexRAG: () => {
        try {
            if (typeof memoryEngine !== 'undefined') {
                memoryEngine.rag.clear();
                fusionView._ragIndexed = false;
                fusionView._indexLibraryToRAG();
                fusionView._updateMemoryPanel();
                showNotification(`已索引 ${libraryManager.books.length} 本书到RAG`, 'success');
            }
        } catch (e) {
            console.error('RAG重建失败:', e);
            showNotification('重建失败', 'error');
        }
    },
    _renderKGMiniView: () => {
        const container = document.getElementById('kg-mini-view');
        if (!container || typeof knowledgeGraph === 'undefined') return;
        const entities = knowledgeGraph.getImportantEntities(30);
        if (entities.length === 0) {
            container.innerHTML = '<div style="color:var(--text-secondary);font-size:11px;">知识图谱实体将在分析后自动提取显示...</div>';
            return;
        }
        container.innerHTML = entities.map(e =>
            `<span class="kg-entity-tag ${e.type}" title="${e.type} | 提及${e.mentionCount}次 | 重要度${(e.importance*100).toFixed(0)}%">${e.name}</span>`
        ).join('');
    }
};

window.onload = async () => {
    try {
        await db.init();
        console.log('DB init success, mode:', db._mode, ', _db:', !!db._db);
    } catch (e) {
        console.error('数据库初始化失败:', e);
        showNotification('数据库初始化失败: ' + e.message, 'error');
        // 尝试删除旧数据库重建
        try {
            await new Promise(function(resolve, reject) {
                var req = indexedDB.deleteDatabase('StoryDB');
                req.onsuccess = function() { console.log('已删除旧数据库'); resolve(); };
                req.onerror = function() { reject(req.error); };
                req.onblocked = function() { console.warn('删除被阻塞'); resolve(); };
            });
            db._db = null;
            db._initPromise = null;
            await db.init();
        } catch (e2) {
            console.error('重建数据库也失败:', e2);
            showNotification('数据库重建也失败，请关闭其他标签页后刷新', 'error');
            return;
        }
    }
    try {
        await libraryManager.loadAll();
        await fusionView.init();
        // 默认智能融合视图
        const ws = document.querySelector('.workspace');
        if (ws) ws.classList.add('workspace-fullscreen');
        marketView.init();
        await writingView.init();
        await settingsView.init();
        app._renderKGMiniView();
        console.log('StoryForge v2.0 Initialized, mode:', db._mode, ', books:', libraryManager.books.length);
        if (db._mode === 'ls') {
            showNotification('当前使用 localStorage 存储（file://模式），大文件建议使用HTTP服务器', 'info');
        }
    } catch (e) {
        console.error('StoryForge 初始化失败:', e);
        showNotification('初始化失败: ' + e.message, 'error');
    }
};
