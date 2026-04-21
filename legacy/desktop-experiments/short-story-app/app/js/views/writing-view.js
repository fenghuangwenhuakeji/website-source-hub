var writingView = {
    currentMode: 'complete',
    _selectedGenre: 'fantasy',
    _references: [],
    _writingHistory: [],
    _lastOutput: '',
    _customModePrompts: {},
    _promptSettingsOpen: false,
    
    // 停止控制
    _running: false,
    _aborted: false,
    _currentReader: null,
    
    // 小说设定数据
    _novelSettings: {
        title: '',
        mainCategory: '',
        plot: [],
        character: [],
        mood: [],
        background: [],
        summary: ''
    },
    _settingsModalOpen: false,
    
    // 聊天消息历史
    _chatMessages: [],
    
    // 小说设定标签数据
    SETTINGS_TAGS: {
        mainCategory: ['婚姻家庭', '男生生活', '虐心婚恋', '男生情感', '社会伦理', '悬疑惊悚', '玄幻仙侠', '男频衍生', '年代', '女生生活', '现言甜宠', '青春虐恋', '脑洞', '女性成长', '古代言情', '宫斗宅斗', '女频衍生', '纯爱'],
        plot: ['追妻火葬场', '追夫火葬场', '真假千金', '先婚后爱', '打脸逆袭', '破镜重圆', '系统', '大女主', '穿越', '暗恋', '权谋', '养崽文', '无限流', '金手指', '女性互助', '重生', '婚恋', '架空', '团宠', '末日求生'],
        character: ['霸总', '病娇', '白月光', '替身', '青梅竹马', '欢喜冤家', '高冷禁欲', '温柔治愈', '疯批', '美强惨', '小作精', '绿茶', '奶狗', '狼狗', '年上', '年下', '双强', '师徒', '宿敌'],
        mood: ['虐文', '爽文', '甜宠', '搞笑', '悬疑', '治愈', '压抑', '热血', '温馨', '暗黑', '轻松', '沉重'],
        background: ['校园', '娱乐圈', '豪门', '职场', '古代', '星际', '末世', '修仙', '民国', '现代', '玄幻', '西幻', '都市', '乡村']
    },

    MODES: {
        complete:     { name: '完整创作', hint: '完整创作模式', btn: '开始创作' },
        continuation: { name: '续写扩展', hint: '续写扩展模式', btn: '续写扩展' },
        inspiration:  { name: '灵感编写', hint: '灵感编写模式', btn: '扩展灵感' },
        structure:    { name: '结构优化', hint: '结构优化模式', btn: '优化结构' },
        polish:       { name: '润色排版', hint: '润色排版模式', btn: '开始润色' },
        rewrite:      { name: '风格改写', hint: '风格改写模式', btn: '开始改写' }
    },

    MODE_PROMPTS: {
        complete: '请基于以下核心梗创作完整短篇小说。\n\n',
        continuation: '请接续以下内容继续创作。\n\n',
        inspiration: '请将以下灵感片段扩展成完整段落:\n\n',
        structure: '请优化以下文本的叙事结构:\n\n',
        polish: '请对以下文本进行深度润色:\n\n',
        rewrite: '请将以下文本进行风格改写:\n\n'
    },

    GENRE_HINTS: {
        fantasy: '题材:玄幻奇幻。',
        romance: '题材:言情情感。',
        scifi: '题材:科幻。',
        suspense: '题材:悬疑推理。',
        urban: '题材:都市现实。',
        history: '题材:历史。',
        horror: '题材:恐怖惊悚。',
        literary: '题材:纯文学。',
        custom: ''
    },

    STYLE_HINTS: {
        auto: '',
        light: '文风:轻松幽默。',
        serious: '文风:严肃深沉。',
        poetic: '文风:诗意唯美。',
        sharp: '文风:犀利辛辣。',
        warm: '文风:温暖治愈。',
        cold: '文风:冷峻克制。',
        suspenseful: '文风:悬疑紧张。'
    },

    init: function() {
        try {
            var self = this;
            // 渲染标签
            this._renderSettingsTags();
            // 加载提示词
            db.getAll('prompts').then(function(saved) {
                var p = saved.find(function(p) { return p.key === 'writing_' + self.currentMode; });
                var el = document.getElementById('writing-prompt');
                if (el) el.value = p ? p.value : (self.MODE_PROMPTS[self.currentMode] || '');
            }).catch(function(e) {
                console.warn('writingView init error:', e);
            });
            // 监听输入框
            var inputEl = document.getElementById('writing-chat-input');
            if (inputEl) inputEl.addEventListener('input', function() { writingView._updateCharCount(); });
            // 更新按钮状态
            this._updateActionButtons();
        } catch(e) {
            console.warn('writingView init error:', e);
        }
    },
    
    // 渲染设定标签
    _renderSettingsTags: function() {
        var self = this;
        var renderTagGroup = function(containerId, tags, selected, groupName, isSingle) {
            var container = document.getElementById(containerId);
            if (!container) return;
            container.innerHTML = tags.map(function(tag) {
                var isSelected = Array.isArray(selected) ? selected.includes(tag) : selected === tag;
                var cls = isSelected ? 'active' : '';
                var onclick = isSingle ? 
                    'onclick="writingView.toggleSettingTag(this, \'' + groupName + '\', \'' + tag + '\', true)"' :
                    'onclick="writingView.toggleSettingTag(this, \'' + groupName + '\', \'' + tag + '\', false)"';
                return '<span class="settings-tag ' + cls + '" ' + onclick + '>' + tag + '</span>';
            }).join('');
        };
        
        var s = this._novelSettings;
        renderTagGroup('w-mainCategory-tags', this.SETTINGS_TAGS.mainCategory, s.mainCategory, 'mainCategory', true);
        renderTagGroup('w-plot-tags', this.SETTINGS_TAGS.plot, s.plot, 'plot', false);
        renderTagGroup('w-character-tags', this.SETTINGS_TAGS.character, s.character, 'character', false);
        renderTagGroup('w-mood-tags', this.SETTINGS_TAGS.mood, s.mood, 'mood', false);
        renderTagGroup('w-background-tags', this.SETTINGS_TAGS.background, s.background, 'background', false);
    },
    
    // 标签切换
    toggleSettingTag: function(el, group, tag, isSingle) {
        if (isSingle) {
            this._novelSettings[group] = tag;
        } else {
            var arr = this._novelSettings[group];
            var idx = arr.indexOf(tag);
            if (idx > -1) arr.splice(idx, 1);
            else arr.push(tag);
        }
        this._renderSettingsTags();
    },

    selectMode: function(mode) {
        // 保存当前模式的自定义提示词
        if (this._promptSettingsOpen) {
            var ta = document.getElementById('writing-ps-textarea');
            if (ta && ta.value.trim()) this._customModePrompts[this.currentMode] = ta.value;
        }
        this.currentMode = mode;
        document.querySelectorAll('.writing-mode-card').forEach(function(c) { c.classList.remove('active'); });
        var card = document.querySelector('.writing-mode-card[data-wmode="' + mode + '"]');
        if (card) card.classList.add('active');
        var el = document.getElementById('writing-prompt');
        if (el) el.value = this._customModePrompts[mode] || this.MODE_PROMPTS[mode] || '';
        var modeInfo = this.MODES[mode];
        var btn = document.getElementById('writing-start-btn');
        if (btn && modeInfo) {
            var textEl = btn.querySelector('.writing-start-text');
            if (textEl) textEl.textContent = modeInfo.btn;
        }
        var hint = document.getElementById('writing-mode-hint');
        if (hint && modeInfo) hint.textContent = modeInfo.hint;
        var input = document.getElementById('writing-input');
        if (input) {
            var ph = {
                complete: '输入故事核心梗、人物设定、世界观...',
                continuation: '粘贴已有内容，AI将接续创作...',
                inspiration: '输入灵感片段、意象、场景碎片...',
                structure: '粘贴需要优化结构的文本...',
                polish: '粘贴需要润色的文本...',
                rewrite: '粘贴需要改写的文本...'
            };
            input.placeholder = ph[mode] || '输入内容...';
        }
        // 同步提示词设置面板
        if (this._promptSettingsOpen) {
            var psTA = document.getElementById('writing-ps-textarea');
            if (psTA) psTA.value = this._customModePrompts[mode] || this.MODE_PROMPTS[mode] || '';
            var label = document.getElementById('writing-ps-mode-label');
            if (label && modeInfo) label.textContent = modeInfo.name;
        }
    },

    selectGenre: function(el) {
        document.querySelectorAll('.genre-chip').forEach(function(c) { c.classList.remove('active'); });
        el.classList.add('active');
        this._selectedGenre = el.dataset.genre;
    },

    onParamChange: function() {},

    onWordcountChange: function(slider) {
        var label = document.getElementById('writing-wordcount-label');
        var val = parseInt(slider.value);
        if (label) label.textContent = val >= 10000 ? (val / 10000).toFixed(1) + '万字' : val + '字';
    },

    addReference: function() {
        pickerManager.open('writing-ref', 'book');
    },

    addReferenceFromBook: function(bookId) {
        var book = libraryManager.getBook(bookId);
        if (!book) return;
        if (this._references.find(function(r) { return r.id === book.id; })) {
            showNotification('该书籍已在参考列表中', 'info');
            return;
        }
        this._references.push({ id: book.id, title: book.title, content: book.content });
        this._renderReferences();
    },

    removeReference: function(index) {
        this._references.splice(index, 1);
        this._renderReferences();
    },

    _renderReferences: function() {
        var container = document.getElementById('writing-refs');
        if (!container) return;
        if (this._references.length === 0) {
            container.innerHTML = '<div class="writing-refs-empty">点击上方按钮添加参考素材</div>';
            return;
        }
        container.innerHTML = this._references.map(function(r, i) {
            return '<div class="writing-ref-item"><span class="writing-ref-title">' + _escapeHtml(r.title) + '</span><span class="writing-ref-meta">' + r.content.length + '字</span><button class="book-btn" onclick="writingView.removeReference(' + i + ')">x</button></div>';
        }).join('');
    },

    _updateCharCount: function() {
        var input = document.getElementById('writing-input');
        var counter = document.getElementById('writing-char-count');
        if (input && counter) counter.textContent = input.value.length + ' 字';
    },

    resetPrompt: function() {
        var el = document.getElementById('writing-prompt');
        if (el) el.value = this.MODE_PROMPTS[this.currentMode] || '';
        showNotification('提示词已重置', 'success');
    },

    togglePromptSettings: function() {
        this._promptSettingsOpen = !this._promptSettingsOpen;
        var panel = document.getElementById('writing-prompt-settings-panel');
        var btn = document.getElementById('writing-prompt-settings-btn');
        if (panel) {
            panel.style.display = this._promptSettingsOpen ? 'block' : 'none';
            if (this._promptSettingsOpen) {
                // 从上方提示词框同步内容
                var mainTA = document.getElementById('writing-prompt');
                var currentVal = (mainTA && mainTA.value.trim()) ? mainTA.value : (this._customModePrompts[this.currentMode] || this.MODE_PROMPTS[this.currentMode] || '');
                var ta = document.getElementById('writing-ps-textarea');
                if (ta) ta.value = currentVal;
                var label = document.getElementById('writing-ps-mode-label');
                var modeInfo = this.MODES[this.currentMode];
                if (label && modeInfo) label.textContent = modeInfo.name;
            } else {
                // 关闭时保存并同步回上方
                var ta2 = document.getElementById('writing-ps-textarea');
                if (ta2 && ta2.value.trim()) {
                    this._customModePrompts[this.currentMode] = ta2.value;
                    var mainTA2 = document.getElementById('writing-prompt');
                    if (mainTA2) mainTA2.value = ta2.value;
                }
            }
        }
        if (btn) btn.classList.toggle('active', this._promptSettingsOpen);
    },

    resetModePrompt: function() {
        delete this._customModePrompts[this.currentMode];
        var ta = document.getElementById('writing-ps-textarea');
        if (ta) ta.value = this.MODE_PROMPTS[this.currentMode] || '';
        showNotification('已重置为默认提示词', 'success');
    },

    _getActivePrompt: function() {
        // 优先使用提示词设置面板的内容（如果打开且有编辑）
        if (this._promptSettingsOpen) {
            var ta = document.getElementById('writing-ps-textarea');
            if (ta && ta.value.trim()) {
                this._customModePrompts[this.currentMode] = ta.value;
                // 同步到上方的提示词框
                var mainTA = document.getElementById('writing-prompt');
                if (mainTA) mainTA.value = ta.value;
            }
        }
        // 读取上方提示词框的实际内容
        var mainEl = document.getElementById('writing-prompt');
        if (mainEl && mainEl.value.trim()) return mainEl.value;
        return this._customModePrompts[this.currentMode] || this.MODE_PROMPTS[this.currentMode] || '';
    },

    saveDraft: function() {
        var input = document.getElementById('writing-input');
        var prompt = document.getElementById('writing-prompt');
        if (!input || !input.value.trim()) { showNotification('没有内容可保存', 'error'); return; }
        var draft = {
            mode: this.currentMode,
            genre: this._selectedGenre,
            style: (document.getElementById('writing-style') || {}).value || 'auto',
            wordcount: (document.getElementById('writing-wordcount') || {}).value || 3000,
            prompt: prompt ? prompt.value : '',
            input: input.value,
            refs: this._references.map(function(r) { return r.id; }),
            time: Date.now()
        };
        localStorage.setItem('storyforge_draft', JSON.stringify(draft));
        showNotification('草稿已保存', 'success');
    },

    loadDraft: function() {
        var raw = localStorage.getItem('storyforge_draft');
        if (!raw) { showNotification('没有保存的草稿', 'info'); return; }
        try {
            var draft = JSON.parse(raw);
            this.selectMode(draft.mode || 'complete');
            if (draft.genre) {
                var chip = document.querySelector('.genre-chip[data-genre="' + draft.genre + '"]');
                if (chip) this.selectGenre(chip);
            }
            var styleEl = document.getElementById('writing-style');
            if (styleEl && draft.style) styleEl.value = draft.style;
            var wcEl = document.getElementById('writing-wordcount');
            if (wcEl && draft.wordcount) { wcEl.value = draft.wordcount; this.onWordcountChange(wcEl); }
            var promptEl = document.getElementById('writing-prompt');
            if (promptEl && draft.prompt) promptEl.value = draft.prompt;
            var inputEl = document.getElementById('writing-input');
            if (inputEl && draft.input) { inputEl.value = draft.input; this._updateCharCount(); }
            if (draft.refs && draft.refs.length > 0) {
                this._references = [];
                var self = this;
                draft.refs.forEach(function(id) {
                    var book = libraryManager.getBook(id);
                    if (book) self._references.push({ id: book.id, title: book.title, content: book.content });
                });
                this._renderReferences();
            }
            showNotification('已加载草稿', 'success');
        } catch (e) {
            showNotification('草稿加载失败', 'error');
        }
    },

    continueWriting: function() {
        var output = document.getElementById('writing-output');
        if (!output || !output.textContent || output.textContent === '结果将显示在这里...') {
            showNotification('没有可续写的内容', 'error');
            return;
        }
        this.selectMode('continuation');
        var inputEl = document.getElementById('writing-input');
        if (inputEl) {
            inputEl.value = output.textContent;
            this._updateCharCount();
        }
        showNotification('已加载到续写模式', 'success');
    },

    startWriting: function() {
        var input = document.getElementById('writing-input').value.trim();
        var prompt = document.getElementById('writing-prompt').value.trim();
        if (!input) { showNotification('请输入内容', 'error'); return; }

        var mode = this.currentMode;
        var genre = this._selectedGenre;
        var style = (document.getElementById('writing-style') || {}).value || 'auto';
        var wordcount = (document.getElementById('writing-wordcount') || {}).value || 3000;
        var self = this;

        // 重置停止状态
        this._aborted = false;
        this._running = true;
        this._updateActionButtons();

        chatManager.clearSession('writing');
        clearIOMonitor('writing-input-monitor');
        clearIOMonitor('writing-output-monitor');

        var btn = document.getElementById('writing-start-btn');
        if (btn) { btn.classList.add('loading'); }

        if (typeof memoryEngine !== 'undefined') {
            memoryEngine.working.add(input.substring(0, 2000), 'high', 'writing', ['input', mode]);
        }
        if (typeof knowledgeGraph !== 'undefined') {
            knowledgeGraph.extractFromText(input, '写作输入');
        }

        var enhancedContext = '';
        if (typeof memoryEngine !== 'undefined') {
            var ctx = memoryEngine.buildContext(input, 6000);
            if (ctx.context) enhancedContext = ctx.context + '\n\n---\n\n';
        }

        var paramHints = '';
        if (self.GENRE_HINTS[genre]) paramHints += self.GENRE_HINTS[genre] + '\n';
        if (self.STYLE_HINTS[style]) paramHints += self.STYLE_HINTS[style] + '\n';
        paramHints += '目标字数:约' + wordcount + '字。\n';

        var refContext = '';
        if (self._references.length > 0) {
            refContext = '\n=== 参考素材 ===\n';
            self._references.forEach(function(r, i) {
                refContext += '--- 参考' + (i + 1) + ': ' + r.title + ' ---\n' + r.content.substring(0, 3000) + '\n\n';
                if (typeof knowledgeGraph !== 'undefined') {
                    knowledgeGraph.extractFromText(r.content.substring(0, 5000), r.title);
                }
            });
        }

        var finalInput = input;
        var mentions = input.match(/@([^\s@]+)/g) || [];
        if (mentions.length > 0) {
            var bookContents = mentions.map(function(m) {
                var title = m.substring(1);
                var book = libraryManager.books.find(function(b) { return b.title === title || b.title.includes(title); });
                if (book) {
                    if (typeof knowledgeGraph !== 'undefined') {
                        knowledgeGraph.extractFromText(book.content.substring(0, 5000), book.title);
                    }
                    return '[图书馆引用: ' + book.title + ']\n' + book.content;
                }
                return '';
            }).filter(Boolean);
            if (bookContents.length > 0) finalInput = bookContents.join('\n\n') + '\n\n' + input;
        }

        var fullPrompt = enhancedContext + paramHints + '\n' + self._getActivePrompt() + refContext + '\n\n' + finalInput;
        updateIOMonitor('writing-input-monitor', fullPrompt, 'input');

        // 直接在对话区进行流式输出
        self._doStreamWriteToChat(fullPrompt, mode, genre, style, input).then(function(fullText) {
            updateIOMonitor('writing-output-monitor', fullText, 'output');
            var statusEl = document.getElementById('writing-status');
            if (statusEl) statusEl.className = 'status-light success';
            self._updateResultStats();
            if (fullText) {
                self._lastOutput = fullText;
                self._writingHistory.push({
                    mode: mode, genre: genre, style: style,
                    inputPreview: input.substring(0, 100),
                    outputLength: fullText.length,
                    time: Date.now()
                });
                self._renderHistoryBar();
            }
        }).catch(function(e) {
            showNotification('写作失败: ' + e.message, 'error');
            var statusEl = document.getElementById('writing-status');
            if (statusEl) statusEl.className = 'status-light error';
        }).finally(function() {
            if (btn) { btn.classList.remove('loading'); }
            self._running = false;
            self._updateActionButtons();
        });
    },

    // 流式输出到对话区
    _doStreamWriteToChat: async function(prompt, mode, genre, style, originalInput) {
        var config = await apiClient.getActiveConfig();
        if (!config) throw new Error('请先在API设置中添加并激活API配置');

        var statusEl = document.getElementById('writing-status');
        if (statusEl) statusEl.className = 'status-light active';

        // 在对话区添加流式消息
        var msgId = 'writing-stream-' + Date.now();
        var modeName = this.MODES[mode]?.name || '创作';
        this._addStreamingMessageToChat(msgId, '✍️ ' + modeName);

        var req = apiClient.buildRequest(config, prompt, true);
        var resp = await fetch(req.url, { method: 'POST', headers: req.headers, body: JSON.stringify(req.body) });
        if (!resp.ok) {
            this._updateStreamingMessageInChat(msgId, '❌ 生成失败', true);
            var errText = '';
            try { errText = await resp.text(); } catch(x) {}
            throw new Error('API错误 ' + resp.status + ': ' + errText.substring(0, 200));
        }

        var reader = resp.body.getReader();
        this._currentReader = reader; // 保存reader以便停止
        var decoder = new TextDecoder();
        var buffer = '';
        var fullText = '';
        while (true) {
            if (this._aborted) {
                reader.cancel();
                this._updateStreamingMessageInChat(msgId, fullText + '\n\n[已停止]', true);
                return fullText;
            }
            var chunk = await reader.read();
            if (chunk.done) break;
            buffer += decoder.decode(chunk.value, { stream: true });
            var lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (var j = 0; j < lines.length; j++) {
                var line = lines[j].trim();
                if (!line || line === 'data: [DONE]') continue;
                if (line.indexOf('data: ') === 0) {
                    try {
                        var d = JSON.parse(line.slice(6));
                        var t = apiClient.parseStreamChunk(config.provider, d);
                        if (t) {
                            fullText += t;
                            // 实时更新到对话区
                            this._updateStreamingMessageInChat(msgId, fullText, false);
                        }
                    } catch(x) {}
                }
            }
        }
        // 标记完成
        this._updateStreamingMessageInChat(msgId, fullText, true);
        this._currentReader = null;
        return fullText;
    },

    // 在对话区添加流式消息
    _addStreamingMessageToChat: function(id, stepName) {
        var container = document.getElementById('writing-chat-messages');
        if (!container) return;
        
        // 移除欢迎语
        var welcome = container.querySelector('.chat-welcome');
        if (welcome) welcome.remove();
        
        var msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message assistant streaming';
        msgDiv.id = id;
        var time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        msgDiv.innerHTML = '<div class="chat-message-header ai-header">🤖 ' + stepName + '<span class="chat-message-time">' + time + '</span></div><div class="chat-message-content"><span class="streaming-cursor">▋</span></div>';
        container.appendChild(msgDiv);
        // 不自动滚动，让用户自由控制
    },
    
    // 更新对话区流式消息内容
    _updateStreamingMessageInChat: function(id, content, isDone) {
        var msgDiv = document.getElementById(id);
        if (!msgDiv) return;
        var contentDiv = msgDiv.querySelector('.chat-message-content');
        if (contentDiv) {
            if (isDone) {
                // 完成后使用格式化渲染（支持markdown）
                var formatted = (typeof app !== 'undefined' && app._formatAIResponse) ? app._formatAIResponse(content) : _escapeHtml(content);
                contentDiv.innerHTML = formatted;
                msgDiv.classList.remove('streaming');
            } else {
                // 流式过程中使用纯文本，保留换行
                contentDiv.innerHTML = _escapeHtml(content) + '<span class="streaming-cursor">▋</span>';
            }
        }
        // 不强制滚动，让用户可以自由滚动查看历史
    },

    // 保留旧的 _doStreamWrite 方法用于兼容
    _doStreamWrite: async function(prompt) {
        return this._doStreamWriteToChat(prompt, this.currentMode, this._selectedGenre, 'auto', '');
    },

    _updateResultStats: function() {
        var output = document.getElementById('writing-output');
        var stats = document.getElementById('writing-result-stats');
        if (!output || !stats) return;
        var text = output.textContent || '';
        if (!text || text === '结果将显示在这里...') { stats.innerHTML = ''; return; }
        var chars = text.length;
        var paragraphs = text.split(/\n\s*\n/).filter(Boolean).length;
        var sentences = text.split(/[。！？.!?]+/).filter(Boolean).length;
        stats.innerHTML = '<span>' + chars + '字</span><span>' + paragraphs + '段</span><span>' + sentences + '句</span>';
    },

    _renderHistoryBar: function() {
        var bar = document.getElementById('writing-history-bar');
        if (!bar || this._writingHistory.length === 0) return;
        var recent = this._writingHistory.slice(-5).reverse();
        var self = this;
        bar.innerHTML = '<div class="writing-history-title">最近创作</div>' +
            recent.map(function(h) {
                var time = new Date(h.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                var modeInfo = self.MODES[h.mode] || {};
                return '<div class="writing-history-item"><span class="wh-info">' + (modeInfo.name || h.mode) + ' - ' + h.outputLength + '字</span><span class="wh-time">' + time + '</span></div>';
            }).join('');
    },

    _pushResultToChat: function(text) {
        // 将创作结果自动注入到智能对话区，方便用户继续对话修正
        try {
            if (!text || !text.trim()) return;
            // 打开智能对话 section
            var sections = document.querySelectorAll('#view-writing .section-card');
            // 智能对话是第4个section-card
            for (var i = 0; i < sections.length; i++) {
                var title = sections[i].querySelector('.card-title');
                if (title && title.textContent.indexOf('智能对话') >= 0) {
                    var body = sections[i].querySelector('.section-body');
                    if (body && body.style.display === 'none') {
                        sections[i].setAttribute('data-section', 'open');
                        body.style.display = '';
                        var arrow = sections[i].querySelector('.section-arrow');
                        if (arrow) arrow.textContent = '▼';
                    }
                    break;
                }
            }
            // 清除欢迎页
            var container = document.getElementById('writing-chat-container');
            if (!container) return;
            var welcome = container.querySelector('.chat-welcome');
            if (welcome) welcome.remove();

            // 存入chatManager会话
            if (typeof chatManager !== 'undefined' && chatManager.addMessage) {
                chatManager.addMessage('writing', 'assistant', text);
            }

            // 渲染AI消息到对话区
            var time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            var formatted = (typeof app !== 'undefined' && app._formatAIResponse) ? app._formatAIResponse(text) : _escapeHtml(text);
            var aiMsg = document.createElement('div');
            aiMsg.className = 'chat-message assistant';
            aiMsg.innerHTML = '<div class="chat-message-header"><span>🤖 AI 创作结果</span><span class="chat-message-time">' + time + '</span></div><div class="chat-message-content">' + formatted + '</div><div class="chat-msg-actions"><button class="chat-msg-btn" onclick="copyToClipboard(this.closest(\'.chat-message\').querySelector(\'.chat-message-content\').textContent)">📋 复制</button></div>';
            container.appendChild(aiMsg);
            container.scrollTop = container.scrollHeight;
        } catch(e) {
            console.warn('pushResultToChat:', e);
        }
    },

    switchTab: function(tab) { this.selectMode(tab); },
    
    // ========== 提示词预设 ==========
    PROMPT_PRESETS: {
        default: '你是一位技艺精湛的网文短篇小说家，擅长写让人停不下来的爽文。\n\n【写作铁律】\n1. 100%原创，只借鉴技法不借用已有角色/情节/设定\n2. 开篇3句话内必须有钩子\n3. 每500字至少一个小爽点或悬念推进\n4. 注重场景感画面感，善用感官细节\n5. 对话要有网感和个性化语言\n6. 节奏张弛有度，压抑后必有爆发\n7. 合适位置埋伏笔\n8. 章节结尾必须有钩子\n9. 语言现代化，适当用网络梗增加代入感\n10. 直接输出正文，不要标题/解释/分析\n\n',
        emotion: '你是一位擅长情感文学的短篇小说家，精通催泪和情感操控。\n\n【写作铁律】\n1. 100%原创内容\n2. 开篇用情感钩子切入（失去/重逢/暗恋/遗憾）\n3. 前1/3建立情感连接，让读者爱上角色\n4. 中段用甜蜜铺垫，为后续虐心蓄力\n5. 高潮段落精准触发泪点（细节催泪/回忆杀/未说出口的话）\n6. 情感表达层次：行为>对话>内心>沉默\n7. 善用意象系统（反复出现的情感符号）\n8. 氛围营造用感官叠加和环境映射\n9. 结尾留余韵，让读者回味\n10. 直接输出正文，不要标题/解释\n\n',
        suspense: '你是一位悬疑短篇大师，精通反转和信息差操控。\n\n【写作铁律】\n1. 100%原创内容\n2. 开篇用谜题/异常场景钩住读者\n3. 信息释放精确控制：每段给一点线索但不揭底\n4. 真线索藏在日常细节中，假线索要够迷惑\n5. 反转必须既意外又合理（前文有铺垫）\n6. 维持紧张感：时间压力/信息不对称/两难选择\n7. 对话中暗藏线索和潜台词\n8. 视角控制：利用叙述者的信息盲区\n9. 结尾反转要有冲击力\n10. 直接输出正文，不要标题/解释\n\n',
        humor: '你是一位网文搞笑短篇高手，精通吐槽和玩梗。\n\n【写作铁律】\n1. 100%原创内容\n2. 开篇用反差/荒诞/吐槽制造笑点\n3. 每300字至少一个笑点或吐槽\n4. 善用：反差萌/一本正经胡说八道/吐槽系统/打破第四面墙\n5. 对话要有弹幕感，角色互怼要精彩\n6. 可以用网络梗但不要过时的\n7. 搞笑中带温情，笑着笑着被感动\n8. 节奏要快，不要拖沓\n9. 结尾可以来个反转笑点或温馨收尾\n10. 直接输出正文，不要标题/解释\n\n',
        custom: ''
    },
    _currentPromptPreset: 'default',
    
    selectPromptPreset: function(btn, preset) {
        this._currentPromptPreset = preset;
        // 更新按钮状态
        document.querySelectorAll('.prompt-preset-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        // 更新提示词
        var promptText = this.PROMPT_PRESETS[preset] || '';
        var el = document.getElementById('writing-prompt');
        if (el) el.value = promptText;
    },
    
    // ========== 一键启动创作 ==========
    quickStart: async function() {
        // 获取小说设定
        var settingsText = this._buildSettingsText();
        if (!settingsText || settingsText.trim() === '') {
            showNotification('请先填写小说设定（书名、分类、情节等）', 'error');
            return;
        }
        
        // 获取提示词
        var promptText = document.getElementById('writing-prompt')?.value || '';
        
        // 构建一键启动的完整指令
        var autoInstruction = '请基于以上小说设定，直接开始创作完整的故事内容。';
        
        // 根据模式调整指令
        var modeInstructions = {
            complete: '请创作一个完整的短篇故事，包含开篇、发展、高潮和结局。',
            continuation: '请基于已有内容，继续创作后续情节。',
            inspiration: '请将灵感扩展成完整的场景或段落。',
            structure: '请优化故事结构，使其更加紧凑和吸引人。',
            polish: '请润色文字，提升文学性和可读性。',
            rewrite: '请改写故事，保持核心情节但改变表达方式。'
        };
        
        var modeInstruction = modeInstructions[this.currentMode] || modeInstructions.complete;

        // 重置停止状态
        this._aborted = false;
        this._running = true;
        this._updateActionButtons();

        // 构建完整提示词
        var fullPrompt = promptText + '\n\n【小说设定】\n' + settingsText + '\n\n【创作要求】\n' + modeInstruction + '\n' + autoInstruction;

        // 清空之前的对话，开始新的创作会话
        this._chatMessages = [];
        this._clearChatMessages();

        // 添加系统提示消息
        this._addChatMessage('system', '🚀 一键启动创作模式已激活\n\n📖 书名：《' + (this._novelSettings.title || '未命名') + '》\n🎯 模式：' + (this.MODES[this.currentMode]?.name || '完整创作') + '\n\n正在基于您的小说设定生成内容，请稍候...');

        // 获取API配置
        var config = await apiClient.getActiveConfig();
        if (!config) {
            this._addChatMessage('assistant', '⚠️ 请先配置API');
            this._running = false;
            this._updateActionButtons();
            return;
        }

        // 创建AI消息占位
        var aiMsgId = 'ai-' + Date.now();
        var modeName = this.MODES[this.currentMode]?.name || '创作';
        this._addStreamingMessageToChat(aiMsgId, '✍️ ' + modeName);

        // 滚动到对话框
        this._scrollToChat();
        
        try {
            var fullResponse = '';
            await apiClient.callStream(fullPrompt, config, function(chunk) {
                fullResponse += chunk;
                writingView._updateStreamingMessageInChat(aiMsgId, fullResponse, false);
            });

            // 标记完成
            this._updateStreamingMessageInChat(aiMsgId, fullResponse, true);

            // 保存到历史
            this._chatMessages.push({ role: 'user', content: '[一键启动] ' + modeInstruction });
            this._chatMessages.push({ role: 'assistant', content: fullResponse });

            // 添加追问提示
            this._addChatMessage('system', '✅ 创作完成！您可以在下方输入框中继续追问，例如：\n• "请继续写下一章"\n• "把主角改成反派"\n• "增加感情线"\n• "改写成第一人称视角"');

            showNotification('创作完成！可以继续追问修改', 'success');
        } catch(e) {
            this._updateStreamingMessageInChat(aiMsgId, '❌ 生成失败: ' + e.message, true);
            showNotification('创作失败: ' + e.message, 'error');
        } finally {
            this._running = false;
            this._updateActionButtons();
        }
    },

    // ========== 流式对话功能 ==========
    sendMessage: async function() {
        var input = document.getElementById('writing-chat-input');
        if (!input || !input.value.trim()) return;

        var content = input.value.trim();
        input.value = '';
        this._updateCharCount();

        // 重置停止状态
        this._aborted = false;
        this._running = true;
        this._updateActionButtons();

        // 添加上下文信息到追问
        var contextInfo = '';
        if (this._chatMessages.length > 0) {
            contextInfo = '\n\n【上下文关联】\n基于之前的创作内容，';
        }

        // 添加用户消息
        this._addChatMessage('user', content);

        // 构建完整提示词（包含强上下文）
        var promptText = document.getElementById('writing-prompt')?.value || '';
        var settingsText = this._buildSettingsText();

        // 构建上下文历史
        var contextHistory = '';
        if (this._chatMessages.length > 0) {
            contextHistory = '\n\n【创作历史】\n';
            this._chatMessages.slice(-6).forEach(function(msg) {
                if (msg.role !== 'system') {
                    contextHistory += (msg.role === 'user' ? '用户' : 'AI') + '：' + msg.content.substring(0, 500) + '\n\n';
                }
            });
        }

        var fullPrompt = promptText +
            (settingsText ? '\n\n【小说设定】\n' + settingsText : '') +
            contextHistory +
            '\n\n【用户追问】\n' + contextInfo + content;

        // 获取API配置
        var config = await apiClient.getActiveConfig();
        if (!config) {
            this._addChatMessage('assistant', '⚠️ 请先配置API');
            this._running = false;
            this._updateActionButtons();
            return;
        }

        // 创建AI消息占位
        var aiMsgId = 'ai-' + Date.now();
        this._addStreamingMessageToChat(aiMsgId, '🤖 AI回复');

        try {
            var fullResponse = '';
            await apiClient.callStream(fullPrompt, config, function(chunk) {
                fullResponse += chunk;
                writingView._updateStreamingMessageInChat(aiMsgId, fullResponse, false);
            });
            // 标记完成
            this._updateStreamingMessageInChat(aiMsgId, fullResponse, true);
            // 保存到历史
            this._chatMessages.push({ role: 'user', content: content });
            this._chatMessages.push({ role: 'assistant', content: fullResponse });
        } catch(e) {
            this._updateStreamingMessageInChat(aiMsgId, '❌ 生成失败: ' + e.message, true);
        } finally {
            this._running = false;
            this._updateActionButtons();
        }
    },
    
    _addChatMessage: function(role, content) {
        var container = document.getElementById('writing-chat-messages');
        if (!container) return;
        
        // 移除欢迎语
        var welcome = container.querySelector('.chat-welcome');
        if (welcome) welcome.remove();
        
        var msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message ' + role;
        var time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        
        var header, headerClass;
        if (role === 'user') {
            header = '👤 用户';
            headerClass = 'user-header';
        } else if (role === 'system') {
            header = '💡 系统';
            headerClass = 'system-header';
        } else {
            header = '🤖 AI';
            headerClass = 'ai-header';
        }
        
        // 系统消息使用不同的样式
        var contentClass = role === 'system' ? 'chat-message-content system-content' : 'chat-message-content';
        
        msgDiv.innerHTML = '<div class="chat-message-header ' + headerClass + '">' + header + '<span class="chat-message-time">' + time + '</span></div><div class="' + contentClass + '">' + _escapeHtml(content) + '</div>';
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
    },
    
    _clearChatMessages: function() {
        var container = document.getElementById('writing-chat-messages');
        if (!container) return;
        container.innerHTML = '';
    },
    
    _scrollToChat: function() {
        var container = document.getElementById('writing-chat-messages');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
        // 滚动到创作对话区域
        var chatSection = document.querySelector('#view-shortStory .section-card:nth-child(4)');
        if (chatSection) {
            chatSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    },
    
    _buildSettingsText: function() {
        var s = this._novelSettings;
        var text = '';
        if (s.title) text += '书名：' + s.title + '\n';
        if (s.mainCategory) text += '类型：' + s.mainCategory + '\n';
        if (s.plot.length > 0) text += '情节：' + s.plot.join('、') + '\n';
        if (s.character.length > 0) text += '角色：' + s.character.join('、') + '\n';
        if (s.mood.length > 0) text += '情绪：' + s.mood.join('、') + '\n';
        if (s.background.length > 0) text += '背景：' + s.background.join('、') + '\n';
        if (s.summary) text += '梗概：' + s.summary;
        return text;
    },

    // 停止生成
    abort: function() {
        this._aborted = true;
        this._running = false;
        if (this._currentReader) {
            try {
                this._currentReader.cancel();
            } catch(e) {}
            this._currentReader = null;
        }
        showNotification('已停止生成', 'info');
        this._updateActionButtons();
    },

    // 更新按钮状态
    _updateActionButtons: function() {
        var startBtn = document.getElementById('writing-start-btn');
        var quickStartBtn = document.getElementById('writing-quickstart-btn');
        if (this._running) {
            if (startBtn) {
                startBtn.innerHTML = '⏹ 停止创作';
                startBtn.onclick = function() { writingView.abort(); };
                startBtn.classList.add('btn-danger');
                startBtn.classList.remove('btn-primary');
            }
            if (quickStartBtn) {
                quickStartBtn.innerHTML = '⏹ 停止';
                quickStartBtn.onclick = function() { writingView.abort(); };
                quickStartBtn.classList.add('btn-danger');
                quickStartBtn.classList.remove('btn-primary');
            }
        } else {
            if (startBtn) {
                var modeInfo = this.MODES[this.currentMode] || {};
                startBtn.innerHTML = '<span class="writing-start-text">' + (modeInfo.btn || '开始创作') + '</span>';
                startBtn.onclick = function() { writingView.startWriting(); };
                startBtn.classList.remove('btn-danger');
                startBtn.classList.add('btn-primary');
            }
            if (quickStartBtn) {
                quickStartBtn.innerHTML = '🚀 一键启动创作';
                quickStartBtn.onclick = function() { writingView.quickStart(); };
                quickStartBtn.classList.remove('btn-danger');
                quickStartBtn.classList.add('btn-primary');
            }
        }
    },
    
    fillSettingsToInput: function() {
        var input = document.getElementById('writing-chat-input');
        if (!input) return;
        var settingsText = this._buildSettingsText();
        if (settingsText) {
            input.value = settingsText;
            this._updateCharCount();
        }
    },
    
    clearChat: function() {
        this._chatMessages = [];
        var container = document.getElementById('writing-chat-messages');
        if (container) {
            container.innerHTML = '<div class="chat-welcome"><div class="chat-welcome-icon">✍️</div><div class="chat-welcome-title">短篇写作</div><div class="chat-welcome-desc">编辑小说设定，输入创作指令，开始对话式创作</div></div>';
        }
    },
    
    // ========== 字数统计 ==========
    onWordcountChange: function(el) {
        var val = parseInt(el.value);
        var label = document.getElementById('w-wordcount-label');
        if (label) label.textContent = val >= 10000 ? (val/10000).toFixed(1) + '万字' : val + '字';
    },
    
    _updateCharCount: function() {
        var input = document.getElementById('writing-chat-input');
        var countEl = document.getElementById('writing-char-count');
        if (input && countEl) {
            countEl.textContent = input.value.length + ' 字';
        }
    },
    
    // ========== 小说设定功能 ==========
    openSettingsModal: function() {
        this._settingsModalOpen = true;
        this._renderSettingsModal();
    },
    
    closeSettingsModal: function() {
        this._settingsModalOpen = false;
        var modal = document.getElementById('writing-settings-modal');
        if (modal) modal.remove();
    },
    
    _renderSettingsModal: function() {
        var self = this;
        var s = this._novelSettings;
        
        // 构建标签HTML
        var buildTags = function(tags, selected, groupName) {
            return tags.map(function(tag) {
                var isSelected = Array.isArray(selected) ? selected.includes(tag) : selected === tag;
                var cls = isSelected ? 'active' : '';
                var onclick = Array.isArray(selected) ? 
                    'onclick="writingView.toggleArrayTag(this, \'' + groupName + '\', \'' + tag + '\')"' :
                    'onclick="writingView.toggleSingleTag(this, \'' + groupName + '\', \'' + tag + '\')"';
                return '<span class="settings-tag ' + cls + '" ' + onclick + '>' + tag + '</span>';
            }).join('');
        };
        
        var html = '<div id="writing-settings-modal" class="settings-modal" onclick="if(event.target===this)writingView.closeSettingsModal()">' +
            '<div class="settings-modal-content" onclick="event.stopPropagation()">' +
            '<div class="settings-modal-header"><span>📖 小说设定</span><button onclick="writingView.closeSettingsModal()">×</button></div>' +
            '<div class="settings-modal-body">' +
            '<div class="form-group"><label>书名</label><input type="text" id="w-setting-title" value="' + _escapeHtml(s.title) + '" placeholder="输入书名"></div>' +
            '<div class="form-group"><label>主分类（单选）</label><div class="tags-container">' + buildTags(this.SETTINGS_TAGS.mainCategory, s.mainCategory, 'mainCategory') + '</div></div>' +
            '<div class="form-group"><label>情节（可多选）</label><div class="tags-container">' + buildTags(this.SETTINGS_TAGS.plot, s.plot, 'plot') + '</div></div>' +
            '<div class="form-group"><label>角色（可多选）</label><div class="tags-container">' + buildTags(this.SETTINGS_TAGS.character, s.character, 'character') + '</div></div>' +
            '<div class="form-group"><label>情绪（可多选）</label><div class="tags-container">' + buildTags(this.SETTINGS_TAGS.mood, s.mood, 'mood') + '</div></div>' +
            '<div class="form-group"><label>背景（可多选）</label><div class="tags-container">' + buildTags(this.SETTINGS_TAGS.background, s.background, 'background') + '</div></div>' +
            '<div class="form-group"><label>故事梗概</label><textarea id="w-setting-summary" rows="4" placeholder="输入故事梗概...">' + _escapeHtml(s.summary) + '</textarea></div>' +
            '</div>' +
            '<div class="settings-modal-footer"><button class="btn" onclick="writingView.closeSettingsModal()">取消</button><button class="btn btn-primary" onclick="writingView.saveSettings()">保存设定</button></div>' +
            '</div></div>';
        
        // 添加样式（如果还没有）
        if (!document.getElementById('writing-settings-style')) {
            var style = document.createElement('style');
            style.id = 'writing-settings-style';
            style.textContent = '.settings-modal{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5)}' +
                '.settings-modal-content{width:600px;max-height:85vh;background:#fff;border-radius:12px;overflow:hidden;display:flex;flex-direction:column}' +
                '.settings-modal-header{padding:16px 20px;background:#4f46e5;color:#fff;display:flex;justify-content:space-between;align-items:center;font-weight:bold}' +
                '.settings-modal-header button{background:none;border:none;color:#fff;font-size:20px;cursor:pointer}' +
                '.settings-modal-body{padding:20px;overflow-y:auto;flex:1}' +
                '.settings-modal-body .form-group{margin-bottom:16px}' +
                '.settings-modal-body label{display:block;margin-bottom:8px;font-size:13px;color:#666;font-weight:500}' +
                '.settings-modal-body input,.settings-modal-body textarea{width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px}' +
                '.tags-container{display:flex;flex-wrap:wrap;gap:8px}' +
                '.settings-tag{padding:6px 12px;border:1px solid #ddd;border-radius:20px;font-size:12px;cursor:pointer;transition:all 0.2s;background:#fff}' +
                '.settings-tag:hover{border-color:#4f46e5;color:#4f46e5}' +
                '.settings-tag.active{background:#4f46e5;color:#fff;border-color:#4f46e5}' +
                '.settings-modal-footer{padding:16px 20px;border-top:1px solid #eee;display:flex;justify-content:flex-end;gap:10px}';
            document.head.appendChild(style);
        }
        
        document.body.insertAdjacentHTML('beforeend', html);
    },
    
    toggleArrayTag: function(el, group, tag) {
        var arr = this._novelSettings[group];
        var idx = arr.indexOf(tag);
        if (idx > -1) arr.splice(idx, 1);
        else arr.push(tag);
        el.classList.toggle('active');
    },
    
    toggleSingleTag: function(el, group, tag) {
        this._novelSettings[group] = tag;
        var container = el.parentElement;
        container.querySelectorAll('.settings-tag').forEach(function(t) { t.classList.remove('active'); });
        el.classList.add('active');
    },
    
    saveSettings: function() {
        var titleInput = document.getElementById('w-setting-title');
        var summaryInput = document.getElementById('w-setting-summary');
        if (titleInput) this._novelSettings.title = titleInput.value.trim();
        if (summaryInput) this._novelSettings.summary = summaryInput.value.trim();
        this.closeSettingsModal();
        this._renderSettingsCard();
        showNotification('小说设定已保存', 'success');
    },
    
    _renderSettingsCard: function() {
        // 更新设定卡片显示
        var card = document.getElementById('writing-settings-card');
        if (card) {
            var s = this._novelSettings;
            var displayTitle = s.title || '未设置';
            var displayType = s.mainCategory || '未设置';
            var displayStyle = s.mood.length > 0 ? s.mood.join('/') : '未设置';
            
            card.querySelector('.novel-setting-value[data-field="title"]').textContent = displayTitle;
            card.querySelector('.novel-setting-value[data-field="type"]').textContent = displayType;
            card.querySelector('.novel-setting-value[data-field="style"]').textContent = displayStyle;
        }
    },
    
    fillInputWithSettings: function() {
        // 将设定填充到输入框
        var s = this._novelSettings;
        var settingsText = '';
        if (s.title) settingsText += '书名：' + s.title + '\n';
        if (s.mainCategory) settingsText += '类型：' + s.mainCategory + '\n';
        if (s.plot.length > 0) settingsText += '情节：' + s.plot.join('、') + '\n';
        if (s.character.length > 0) settingsText += '角色：' + s.character.join('、') + '\n';
        if (s.mood.length > 0) settingsText += '情绪：' + s.mood.join('、') + '\n';
        if (s.background.length > 0) settingsText += '背景：' + s.background.join('、') + '\n';
        if (s.summary) settingsText += '\n故事梗概：\n' + s.summary;
        
        var input = document.getElementById('writing-input');
        if (input) {
            input.value = settingsText;
            this._updateCharCount();
            showNotification('设定已填充到输入框', 'success');
        }
    }
};
