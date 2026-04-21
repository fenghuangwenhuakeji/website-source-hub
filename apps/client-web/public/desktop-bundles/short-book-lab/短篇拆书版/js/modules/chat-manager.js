import { apiManager } from './api-manager.js';
import { api } from '../core/api.js';
import { ui } from '../ui/ui-manager.js';
import { showNotification } from '../ui/notification.js';
import { libraryManager } from './library-manager.js';
import { estimateTokens } from '../utils/helpers.js';
import { modalManager } from '../ui/modal.js';

export class ChatManager {
    constructor() {
        this.sessions = {
            fusion: { messages: [], contextCount: 0, mode: 'continue', selectedBooks: [], selectedPrompts: [], totalTokens: 0, compressedSummary: '' },
            writing: { messages: [], contextCount: 0, mode: 'continue', selectedBooks: [], selectedPrompts: [], totalTokens: 0, compressedSummary: '' }
        };
        this.currentLibraryTarget = null;
        this.currentPickerType = 'book';
        this.selectedLibraryBooks = [];
        this.selectedLibraryPrompts = [];
        
        this.init();
    }

    init() {
        // Global exposures for HTML events
        window.setChatMode = (type, mode) => this.setChatMode(type, mode);
        window.manualCompress = (type) => this.manualCompress(type);
        window.clearContext = (type) => this.clearContext(type);
        window.sendChatMessage = (type) => this.sendChatMessage(type);
        window.toggleLibraryPicker = (type, pickerType) => this.toggleLibraryPicker(type, pickerType);
        window.switchPickerTab = (tabType) => this.switchPickerTab(tabType);
        window.removePickerBook = (id) => this.removePickerBook(id);
        window.removePickerPrompt = (key) => this.removePickerPrompt(key);
        window.clearAllSelection = () => this.clearAllSelection();
        window.confirmLibrarySelection = () => this.confirmLibrarySelection();
        window.filterLibraryBooks = () => this.filterLibraryBooks();
        window.filterPrompts = () => this.filterPrompts();
        window.removeLibraryTag = (type, id) => this.removeLibraryTag(type, id);
        window.removePromptTag = (type, key) => this.removePromptTag(type, key);
        window.closeLibraryPicker = () => this.closeLibraryPicker();
    }

    setChatMode(type, mode) {
        this.sessions[type].mode = mode;
        const buttons = ['continue', 'modify', 'correct'];
        buttons.forEach(btn => {
            const el = document.getElementById(type + '-' + btn + '-btn');
            if (el) el.classList.toggle('active', btn === mode);
        });
    }

    updateContextStats(type) {
        const session = this.sessions[type];
        const turnCount = Math.floor(session.messages.length / 2);
        const totalText = session.messages.map(m => m.content).join('');
        const tokenCount = estimateTokens(totalText);
        const libraryCount = session.selectedBooks.length;
        
        const maxTokens = 8000;
        const memoryLevel = Math.max(0, Math.min(100, Math.round((1 - tokenCount / maxTokens) * 100)));
        
        const els = {
            turn: document.getElementById(type + '-turn-count'),
            token: document.getElementById(type + '-token-count'),
            lib: document.getElementById(type + '-library-count'),
            mem: document.getElementById(type + '-memory-level'),
            ind: document.getElementById(type + '-memory-indicator')
        };

        if (els.turn) els.turn.textContent = turnCount;
        if (els.token) els.token.textContent = tokenCount;
        if (els.lib) els.lib.textContent = libraryCount;
        if (els.mem) els.mem.textContent = memoryLevel + '%';
        
        if (els.ind) {
            if (memoryLevel >= 70) {
                els.ind.className = 'memory-indicator';
                els.ind.innerHTML = '🧠 记忆状态良好 - 上下文完整保留';
            } else if (memoryLevel >= 40) {
                els.ind.className = 'memory-indicator warning';
                els.ind.innerHTML = '⚠️ 记忆接近上限 - 建议智能压缩';
            } else {
                els.ind.className = 'memory-indicator danger';
                els.ind.innerHTML = '🔴 记忆即将溢出 - 请立即压缩或清空';
            }
        }
        
        session.totalTokens = tokenCount;
        
        if (tokenCount > 6000 && session.messages.length > 6) {
            showNotification('上下文较长，建议点击智能压缩', 'warning');
        }
    }

    addChatMessage(type, role, content) {
        const container = document.getElementById(type + '-chat-container');
        if (!container) return;

        const msg = document.createElement('div');
        msg.className = `chat-message ${role}`;
        
        const header = document.createElement('div');
        header.className = 'chat-message-header';
        header.textContent = role === 'user' ? '👤 用户' : '🤖 AI';
        
        const contentEl = document.createElement('div');
        contentEl.className = 'chat-message-content';
        contentEl.textContent = content;
        
        msg.appendChild(header);
        msg.appendChild(contentEl);
        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
        
        this.sessions[type].messages.push({ role, content, timestamp: new Date().toISOString() });
        this.updateContextStats(type);
    }

    async sendChatMessage(type) {
        const input = document.getElementById(type + '-chat-input');
        let content = input.value.trim();
        if (!content) return;
        
        let finalContent = content;
        const session = this.sessions[type];
        
        // Handle mentions in input
        const books = libraryManager.books;
        const libraryMentions = content.match(/@([^\s@]+)/g) || [];
        const mentionedBookIds = [];
        
        libraryMentions.forEach(mention => {
            const bookTitle = mention.substring(1);
            const book = books.find(b => b.title === bookTitle || b.title.includes(bookTitle));
            if (book && !mentionedBookIds.includes(book.id)) {
                mentionedBookIds.push(book.id);
                if (!session.selectedBooks.includes(book.id)) {
                    session.selectedBooks.push(book.id);
                }
            }
        });

        const allBookIds = [...new Set([...mentionedBookIds, ...this.selectedLibraryBooks, ...session.selectedBooks])];
        
        if (allBookIds.length > 0) {
            const bookContents = allBookIds.map(bookId => {
                const book = books.find(b => b.id === bookId);
                return book ? `[📚 图书馆引用: ${book.title}]\n${book.content}` : '';
            }).filter(c => c);
            
            if (bookContents.length > 0) {
                finalContent = '【引用的图书馆内容】\n' + bookContents.join('\n\n---\n\n') + '\n\n【用户指令】\n' + content;
            }
            
            session.selectedBooks = allBookIds;
            this.updateLibraryTags(type);
        }
        
        // Clear temp selection
        this.selectedLibraryBooks = [];
        
        const mode = session.mode;
        let modePrompt = '';
        switch(mode) {
            case 'continue': modePrompt = '请继续创作，保持上下文连贯，延续之前的风格和设定：\n\n'; break;
            case 'modify': modePrompt = '请根据以下要求改造内容，保持核心设定不变：\n\n'; break;
            case 'correct': modePrompt = '请根据以下要求修正内容，注意保持整体一致性：\n\n'; break;
        }
        
        this.addChatMessage(type, 'user', content);
        input.value = '';
        
        const outputId = type + '-output';
        const statusId = type + '-status';
        const monitorId = type + '-output-monitor';
        
        // Build context
        let contextParts = [];
        if (session.compressedSummary) {
            contextParts.push('【历史对话摘要】\n' + session.compressedSummary);
        }
        
        const maxContextMessages = session.totalTokens > 4000 ? 6 : 10;
        const recentMessages = session.messages.slice(-maxContextMessages);
        if (recentMessages.length > 0) {
            const contextHistory = recentMessages.map(m => `[${m.role === 'user' ? '用户' : 'AI'}]: ${m.content}`).join('\n\n');
            contextParts.push('【近期对话】\n' + contextHistory);
        }
        
        const fullContext = contextParts.join('\n\n---\n\n');
        const prompt = modePrompt + fullContext + '\n\n【当前输入】\n' + finalContent;
        
        ui.updateIOMonitor(type + '-input-monitor', finalContent, 'input');
        session.contextCount++;
        this.updateContextStats(type);
        
        if (session.totalTokens > 6000 && session.messages.length > 8) {
            showNotification('上下文较长，将自动进行智能压缩...', 'info');
            await this.smartCompress(type);
        }
        
        await this.streamChatOutput(type, outputId, statusId, monitorId, prompt);
    }

    async streamChatOutput(type, outputId, statusId, monitorId, prompt) {
        const apiConfig = await apiManager.getActiveApi();
        if (!apiConfig) {
            showNotification('请先在API流量池中添加并激活配置', 'error');
            return;
        }
        
        const output = document.getElementById(outputId);
        const status = document.getElementById(statusId);
        const currentOutput = output.textContent;
        output.textContent = currentOutput + '\n\n--- 新增 ---\n\n';
        status.className = 'status-light active';
        
        let fullResponse = '';
        
        try {
            await api.stream(prompt, apiConfig, (chunk, fullText) => {
                fullResponse = fullText;
                // We don't update main output in real-time for chat, usually just the chat bubble or specific area
                // But user requirement says "all functions interface same", original updated output area too
                output.textContent = currentOutput + '\n\n--- 新增 ---\n\n' + fullText;
            });
            
            ui.updateIOMonitor(monitorId, fullResponse, 'output');
            status.className = 'status-light success';
            this.addChatMessage(type, 'assistant', fullResponse);
            showNotification('完成', 'success');
        } catch (e) {
            output.textContent = currentOutput + '\n\n--- 错误 ---\n\n' + e.message;
            status.className = 'status-light';
            showNotification('处理失败', 'error');
        }
    }

    async smartCompress(type) {
        const session = this.sessions[type];
        if (session.messages.length < 4) return;
        
        showNotification('正在智能压缩上下文...', 'info');
        
        const allContent = session.messages.map(m => `[${m.role}]: ${m.content}`).join('\n\n');
        const compressPrompt = `请将以下对话历史压缩成一个简洁的摘要，保留：\n1. 核心创作主题和风格要求\n2. 重要的人物、情节设定\n3. 用户的关键修改意见\n4. 最新的创作方向\n\n对话历史：\n${allContent}\n\n请输出压缩摘要（控制在500字以内）：`;
        
        try {
            const apiConfig = await apiManager.getActiveApi();
            if (!apiConfig) {
                showNotification('请先配置API', 'error');
                return;
            }
            
            const summary = await api.call(compressPrompt, apiConfig);
            
            const recentMessages = session.messages.slice(-4);
            session.compressedSummary = summary;
            session.messages = recentMessages;
            session.contextCount = Math.floor(recentMessages.length / 2);
            
            const container = document.getElementById(type + '-chat-container');
            container.innerHTML = `<div class="chat-message assistant">
                <div class="chat-message-header">📝 上下文已压缩</div>
                <div class="chat-message-content">${summary}</div>
            </div>`;
            
            recentMessages.forEach(m => {
                const msg = document.createElement('div');
                msg.className = `chat-message ${m.role}`;
                msg.innerHTML = `
                    <div class="chat-message-header">${m.role === 'user' ? '👤 用户' : '🤖 AI'}</div>
                    <div class="chat-message-content">${m.content}</div>
                `;
                container.appendChild(msg);
            });
            
            this.updateContextStats(type);
            showNotification('上下文已智能压缩，保留核心记忆', 'success');
        } catch (e) {
            showNotification('压缩失败: ' + e.message, 'error');
        }
    }

    manualCompress(type) {
        if (this.sessions[type].messages.length < 4) {
            showNotification('对话轮次较少，无需压缩', 'info');
            return;
        }
        this.smartCompress(type);
    }

    clearContext(type) {
        if (!confirm('确定清空所有对话上下文？')) return;
        this.sessions[type].messages = [];
        this.sessions[type].contextCount = 0;
        this.sessions[type].compressedSummary = '';
        this.sessions[type].selectedBooks = [];
        
        document.getElementById(type + '-chat-container').innerHTML = '';
        this.updateLibraryTags(type);
        this.updateContextStats(type);
        showNotification('上下文已清空', 'success');
    }

    // Library Picker Logic
    toggleLibraryPicker(type, pickerType = 'book') {
        this.currentLibraryTarget = type;
        this.currentPickerType = pickerType;
        this.selectedLibraryBooks = [];
        this.selectedLibraryPrompts = [];
        
        const header = document.getElementById('picker-modal-header');
        if (header) header.innerHTML = pickerType === 'book' ? '📚 多图书馆引用选择器' : '📝 多提示词引用选择器';
        
        this.switchPickerTab(pickerType);
        modalManager.open('library-picker-modal');
        this.loadLibraryPicker();
        this.loadPromptPicker();
        this.updatePickerSelectedTags();
    }

    switchPickerTab(tabType) {
        this.currentPickerType = tabType;
        document.getElementById('picker-tab-book').classList.toggle('active', tabType === 'book');
        document.getElementById('picker-tab-prompt').classList.toggle('active', tabType === 'prompt');
        document.getElementById('picker-content-book').classList.toggle('active', tabType === 'book');
        document.getElementById('picker-content-prompt').classList.toggle('active', tabType === 'prompt');
    }

    closeLibraryPicker() {
        modalManager.close('library-picker-modal');
        this.currentLibraryTarget = null;
        this.selectedLibraryBooks = [];
        this.selectedLibraryPrompts = [];
    }

    loadLibraryPicker() {
        const container = document.getElementById('library-picker-container');
        if (!container) return;
        container.innerHTML = '';
        const books = libraryManager.books;
        
        if (books.length === 0) {
            container.innerHTML = '<div style="color:var(--text-secondary);padding:20px;text-align:center;">📚 暂无藏书，请先在图书馆添加</div>';
            return;
        }
        
        books.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.dataset.bookId = book.id;
            card.onclick = () => this.toggleBookSelection(book.id);
            card.innerHTML = `
                <div class="book-icon">📖</div>
                <div class="book-title">${book.title}</div>
                <div class="book-meta">${new Date(book.createdAt).toLocaleDateString()}</div>
                <div class="book-meta">${book.content.length} 字</div>
            `;
            container.appendChild(card);
        });
    }

    loadPromptPicker() {
        const container = document.getElementById('prompt-picker-container');
        if (!container) return;
        container.innerHTML = '';
        const prompts = libraryManager.prompts;
        
        if (prompts.length === 0) {
            container.innerHTML = '<div style="color:var(--text-secondary);padding:20px;text-align:center;">📝 暂无提示词，请先在图书馆添加</div>';
            return;
        }
        
        prompts.forEach(prompt => {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.dataset.promptKey = prompt.key;
            card.onclick = () => this.togglePromptSelection(prompt.key);
            card.innerHTML = `
                <div class="book-icon">📝</div>
                <div class="book-title">${libraryManager.getPromptName(prompt.key)}</div>
                <div class="book-meta">${prompt.value.substring(0, 50)}...</div>
            `;
            container.appendChild(card);
        });
    }

    toggleBookSelection(bookId) {
        const index = this.selectedLibraryBooks.indexOf(bookId);
        if (index > -1) {
            this.selectedLibraryBooks.splice(index, 1);
        } else {
            this.selectedLibraryBooks.push(bookId);
        }
        
        const cards = document.querySelectorAll('#library-picker-container .book-card');
        cards.forEach(card => {
            const id = parseInt(card.dataset.bookId);
            card.classList.toggle('active', this.selectedLibraryBooks.includes(id));
        });
        this.updatePickerSelectedTags();
    }

    togglePromptSelection(promptKey) {
        const index = this.selectedLibraryPrompts.indexOf(promptKey);
        if (index > -1) {
            this.selectedLibraryPrompts.splice(index, 1);
        } else {
            this.selectedLibraryPrompts.push(promptKey);
        }
        
        const cards = document.querySelectorAll('#prompt-picker-container .book-card');
        cards.forEach(card => {
            const key = card.dataset.promptKey;
            const isActive = this.selectedLibraryPrompts.includes(key);
            card.classList.toggle('active', isActive);
            if (isActive) {
                card.style.borderColor = '#4a9eff';
                card.style.background = 'linear-gradient(135deg, rgba(74,158,255,0.1), var(--bg-dark))';
            } else {
                card.style.borderColor = '';
                card.style.background = '';
            }
        });
        this.updatePickerSelectedTags();
    }

    updatePickerSelectedTags() {
        const container = document.getElementById('picker-selected-tags');
        const bookCountEl = document.getElementById('picker-book-count');
        const promptCountEl = document.getElementById('picker-prompt-count');
        
        bookCountEl.textContent = this.selectedLibraryBooks.length;
        promptCountEl.textContent = this.selectedLibraryPrompts.length;
        
        let tags = [];
        const books = libraryManager.books;
        
        this.selectedLibraryBooks.forEach(bookId => {
            const book = books.find(b => b.id === bookId);
            if (book) {
                tags.push(`<span class="library-tag" onclick="event.stopPropagation(); removePickerBook(${bookId})">📖 ${book.title} <span class="remove-tag">×</span></span>`);
            }
        });
        
        this.selectedLibraryPrompts.forEach(promptKey => {
            tags.push(`<span class="prompt-tag" onclick="event.stopPropagation(); removePickerPrompt('${promptKey}')">📝 ${libraryManager.getPromptName(promptKey)} <span class="remove-tag">×</span></span>`);
        });
        
        if (tags.length === 0) {
            container.innerHTML = '<span style="color:var(--text-secondary);font-size:11px;">点击下方内容添加引用...</span>';
        } else {
            container.innerHTML = tags.join('');
        }
    }

    removePickerBook(bookId) {
        const index = this.selectedLibraryBooks.indexOf(bookId);
        if (index > -1) {
            this.selectedLibraryBooks.splice(index, 1);
            const card = document.querySelector(`#library-picker-container .book-card[data-book-id="${bookId}"]`);
            if (card) card.classList.remove('active');
            this.updatePickerSelectedTags();
        }
    }

    removePickerPrompt(promptKey) {
        const index = this.selectedLibraryPrompts.indexOf(promptKey);
        if (index > -1) {
            this.selectedLibraryPrompts.splice(index, 1);
            const card = document.querySelector(`#prompt-picker-container .book-card[data-prompt-key="${promptKey}"]`);
            if (card) {
                card.classList.remove('active');
                card.style.borderColor = '';
                card.style.background = '';
            }
            this.updatePickerSelectedTags();
        }
    }

    clearAllSelection() {
        this.selectedLibraryBooks = [];
        this.selectedLibraryPrompts = [];
        document.querySelectorAll('#library-picker-container .book-card').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('#prompt-picker-container .book-card').forEach(c => {
            c.classList.remove('active');
            c.style.borderColor = '';
            c.style.background = '';
        });
        this.updatePickerSelectedTags();
    }

    confirmLibrarySelection() {
        const session = this.sessions[this.currentLibraryTarget];
        const input = document.getElementById(this.currentLibraryTarget + '-chat-input');
        let mentions = [];
        const books = libraryManager.books;
        
        this.selectedLibraryBooks.forEach(id => {
            const book = books.find(b => b.id === id);
            if (book) {
                mentions.push(`@${book.title}`);
                if (!session.selectedBooks.includes(id)) {
                    session.selectedBooks.push(id);
                }
            }
        });
        
        this.selectedLibraryPrompts.forEach(key => {
            mentions.push(`#${libraryManager.getPromptName(key)}`);
            if (!session.selectedPrompts.includes(key)) {
                session.selectedPrompts.push(key);
            }
        });
        
        if (mentions.length > 0) {
            const currentValue = input.value.trim();
            input.value = mentions.join(' ') + (currentValue ? ' ' + currentValue : '');
        }
        
        this.updateLibraryTags(this.currentLibraryTarget);
        this.updatePromptTags(this.currentLibraryTarget);
        this.closeLibraryPicker();
        showNotification(`已添加 ${this.selectedLibraryBooks.length} 本书籍和 ${this.selectedLibraryPrompts.length} 个提示词引用`, 'success');
    }

    updateLibraryTags(type) {
        const container = document.getElementById(type + '-library-tags');
        const session = this.sessions[type];
        const books = libraryManager.books;
        
        if (session.selectedBooks.length === 0) {
            container.innerHTML = '<span style="color:var(--text-secondary);font-size:11px;">点击下方@图书馆添加引用...</span>';
        } else {
            container.innerHTML = session.selectedBooks.map(bookId => {
                const book = books.find(b => b.id === bookId);
                if (!book) return '';
                return `<span class="library-tag" onclick="removeLibraryTag('${type}', ${bookId})">
                    📖 ${book.title}
                    <span class="remove-tag">×</span>
                </span>`;
            }).join('');
        }
        this.updateContextStats(type);
    }

    removeLibraryTag(type, bookId) {
        const session = this.sessions[type];
        const index = session.selectedBooks.indexOf(bookId);
        if (index > -1) {
            session.selectedBooks.splice(index, 1);
            this.updateLibraryTags(type);
        }
    }

    updatePromptTags(type) {
        const container = document.getElementById(type + '-prompt-tags');
        const session = this.sessions[type];
        
        if (!session.selectedPrompts || session.selectedPrompts.length === 0) {
            container.innerHTML = '<span style="color:var(--text-secondary);font-size:11px;">点击下方@提示词添加引用...</span>';
        } else {
            container.innerHTML = session.selectedPrompts.map(promptKey => {
                return `<span class="prompt-tag" onclick="removePromptTag('${type}', '${promptKey}')">
                    📝 ${libraryManager.getPromptName(promptKey)}
                    <span class="remove-tag">×</span>
                </span>`;
            }).join('');
        }
    }

    removePromptTag(type, promptKey) {
        const session = this.sessions[type];
        const index = session.selectedPrompts.indexOf(promptKey);
        if (index > -1) {
            session.selectedPrompts.splice(index, 1);
            this.updatePromptTags(type);
        }
    }

    filterLibraryBooks() {
        const search = document.getElementById('library-search-input').value.toLowerCase();
        const cards = document.querySelectorAll('#library-picker-container .book-card');
        cards.forEach(card => {
            const title = card.querySelector('.book-title').textContent.toLowerCase();
            card.style.display = title.includes(search) ? 'block' : 'none';
        });
    }

    filterPrompts() {
        const search = document.getElementById('prompt-search-input').value.toLowerCase();
        const cards = document.querySelectorAll('#prompt-picker-container .book-card');
        cards.forEach(card => {
            const title = card.querySelector('.book-title').textContent.toLowerCase();
            card.style.display = title.includes(search) ? 'block' : 'none';
        });
    }
}

export const chatManager = new ChatManager();