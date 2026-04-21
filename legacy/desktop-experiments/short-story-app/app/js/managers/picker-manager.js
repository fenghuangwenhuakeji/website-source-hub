const pickerManager = {
    currentPickerType: 'book',
    currentTargetView: null,
    selectedBooks: [],
    selectedPrompts: [],

    open(targetView, pickerType) {
        this.currentTargetView = targetView;
        this.currentPickerType = pickerType || 'book';
        this.selectedBooks = [];
        this.selectedPrompts = [];
        const header = document.getElementById('picker-modal-header');
        if (header) header.innerHTML = pickerType === 'book' ? '📚 多图书馆引用选择器' : '📝 多提示词引用选择器';
        this.switchTab(this.currentPickerType);
        uiManager.showModal('library-picker-modal');
        this.loadBooks();
        this.loadPrompts();
        this.updateSelectedTags();
    },

    switchTab(type) {
        this.currentPickerType = type;
        document.getElementById('picker-tab-book').classList.toggle('active', type === 'book');
        document.getElementById('picker-tab-prompt').classList.toggle('active', type === 'prompt');
        document.getElementById('picker-content-book').classList.toggle('active', type === 'book');
        document.getElementById('picker-content-prompt').classList.toggle('active', type === 'prompt');
    },

    loadBooks() {
        const container = document.getElementById('library-picker-container');
        if (!container) return;
        container.innerHTML = '';
        if (libraryManager.books.length === 0) {
            container.innerHTML = '<div style="color:var(--text-secondary);padding:20px;text-align:center;">📚 暂无藏书</div>';
            return;
        }
        libraryManager.books.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.dataset.bookId = book.id;
            card.onclick = () => this.toggleBook(book.id);
            card.innerHTML = `<div class="book-icon">📖</div><div class="book-title">${book.title}</div><div class="book-meta">${book.content.length} 字</div>`;
            container.appendChild(card);
        });
    },

    loadPrompts() {
        const container = document.getElementById('prompt-picker-container');
        if (!container) return;
        container.innerHTML = '';
        if (libraryManager.prompts.length === 0) {
            container.innerHTML = '<div style="color:var(--text-secondary);padding:20px;text-align:center;">📝 暂无提示词</div>';
            return;
        }
        libraryManager.prompts.forEach(p => {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.dataset.promptKey = p.key;
            card.onclick = () => this.togglePrompt(p.key);
            const promptName = (typeof PROMPT_NAMES !== 'undefined' && PROMPT_NAMES[p.key]) ? PROMPT_NAMES[p.key] : p.key;
            const valueLength = p.value ? p.value.length : 0;
            card.innerHTML = `<div class="book-icon">📝</div><div class="book-title">${promptName}</div><div class="book-meta">${valueLength} 字</div>`;
            container.appendChild(card);
        });
    },

    toggleBook(id) {
        const i = this.selectedBooks.indexOf(id);
        if (i > -1) this.selectedBooks.splice(i, 1); else this.selectedBooks.push(id);
        this.updateCardStyles();
        this.updateSelectedTags();
    },

    togglePrompt(key) {
        const i = this.selectedPrompts.indexOf(key);
        if (i > -1) this.selectedPrompts.splice(i, 1); else this.selectedPrompts.push(key);
        this.updateCardStyles();
        this.updateSelectedTags();
    },

    updateCardStyles() {
        document.querySelectorAll('#library-picker-container .book-card').forEach(card => {
            card.classList.toggle('active', this.selectedBooks.includes(parseInt(card.dataset.bookId)));
        });
        document.querySelectorAll('#prompt-picker-container .book-card').forEach(card => {
            const isActive = this.selectedPrompts.includes(card.dataset.promptKey);
            card.classList.toggle('active', isActive);
            card.style.borderColor = isActive ? '#4a9eff' : '';
            card.style.background = isActive ? 'linear-gradient(135deg, rgba(74,158,255,0.1), var(--bg-dark))' : '';
        });
    },

    updateSelectedTags() {
        const container = document.getElementById('picker-selected-tags');
        document.getElementById('picker-book-count').textContent = this.selectedBooks.length;
        document.getElementById('picker-prompt-count').textContent = this.selectedPrompts.length;
        let tags = [];
        this.selectedBooks.forEach(id => {
            const book = libraryManager.getBook(id);
            if (book) tags.push(`<span class="library-tag" onclick="event.stopPropagation(); pickerManager.toggleBook(${id})">📖 ${book.title} <span class="remove-tag">×</span></span>`);
        });
        this.selectedPrompts.forEach(key => {
            tags.push(`<span class="prompt-tag" onclick="event.stopPropagation(); pickerManager.togglePrompt('${key}')">📝 ${PROMPT_NAMES[key] || key} <span class="remove-tag">×</span></span>`);
        });
        container.innerHTML = tags.length ? tags.join('') : '<span style="color:var(--text-secondary);font-size:11px;">点击下方内容添加引用...</span>';
    },

    confirm() {
        // 流水线模式: 添加书籍到流水线
        if (this.currentTargetView === 'pipeline' && this.selectedBooks.length > 0) {
            this.selectedBooks.forEach(id => pipelineView.addBookById(id));
            this.close();
            showNotification(`已添加 ${this.selectedBooks.length} 本书到流水线`, 'success');
            return;
        }

        // 融合模式: 添加为融合素材而非聊天引用
        if (this.currentTargetView === 'fusion' && fusionView.currentMode === 'fusion' && this.selectedBooks.length > 0) {
            this.selectedBooks.forEach(id => fusionView.addFusionSourceFromBook(id));
            this.close();
            showNotification(`已添加 ${this.selectedBooks.length} 本书到融合素材`, 'success');
            return;
        }

        // 写作参考素材
        if (this.currentTargetView === 'writing-ref' && this.selectedBooks.length > 0) {
            this.selectedBooks.forEach(id => writingView.addReferenceFromBook(id));
            this.close();
            showNotification(`已添加 ${this.selectedBooks.length} 本参考素材`, 'success');
            return;
        }

        const session = chatManager.getSession(this.currentTargetView);
        const input = document.getElementById(this.currentTargetView + '-chat-input');
        let mentions = [];
        this.selectedBooks.forEach(id => {
            const book = libraryManager.getBook(id);
            if (book) { mentions.push(`@${book.title}`); if (!session.selectedBooks.includes(id)) session.selectedBooks.push(id); }
        });
        this.selectedPrompts.forEach(key => {
            mentions.push(`#${PROMPT_NAMES[key] || key}`);
            if (!session.selectedPrompts.includes(key)) session.selectedPrompts.push(key);
        });
        if (mentions.length > 0) input.value = mentions.join(' ') + ' ' + input.value;
        this.close();
        showNotification(`已添加 ${mentions.length} 个引用`, 'success');
    },

    clear() { this.selectedBooks = []; this.selectedPrompts = []; this.updateCardStyles(); this.updateSelectedTags(); },
    close() { uiManager.closeModal('library-picker-modal'); this.currentTargetView = null; },
    filterBooks(text) {
        const s = text.toLowerCase();
        document.querySelectorAll('#library-picker-container .book-card').forEach(c => { c.style.display = c.querySelector('.book-title').textContent.toLowerCase().includes(s) ? 'block' : 'none'; });
    },
    filterPrompts(text) {
        const s = text.toLowerCase();
        document.querySelectorAll('#prompt-picker-container .book-card').forEach(c => { c.style.display = c.querySelector('.book-title').textContent.toLowerCase().includes(s) ? 'block' : 'none'; });
    }
};
