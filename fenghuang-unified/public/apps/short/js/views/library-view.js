import { db } from '../core/database.js';
import { showNotification, copyToClipboard } from '../utils/helpers.js';
import { libraryManager } from '../managers/library-manager.js';
import { uiManager } from '../managers/ui-manager.js';
import { PROMPT_NAMES } from '../utils/constants.js';
import { chatSession } from '../managers/chat-session.js';

export class LibraryView {
    constructor() {
        this.selectedLibraryBooks = [];
        this.selectedLibraryPrompts = [];
        this.currentLibraryTarget = null;
        this.currentPickerType = 'book';
    }

    // Books
    async createBook() {
        const title = prompt('请输入书名:');
        if (!title) return;
        await db.put('books', { title, content: '', createdAt: new Date().toISOString() });
        await libraryManager.loadBooks();
        await libraryManager.updateCounts();
        showNotification('藏书创建成功', 'success');
    }

    async deleteBook(id) {
        if (!confirm('确定删除此藏书?')) return;
        await db.delete('books', id);
        await libraryManager.loadBooks();
        await libraryManager.updateCounts();
        showNotification('已删除', 'success');
    }

    viewBook(id) {
        const book = libraryManager.getBook(id);
        if (book) {
            document.getElementById('book-modal-title').textContent = '查看/编辑书籍';
            document.getElementById('book-title-input').value = book.title;
            document.getElementById('book-content-input').value = book.content;
            uiManager.openModal('book-modal');
            document.getElementById('book-modal').dataset.id = id;
        }
    }

    async saveBookContent() {
        const id = parseInt(document.getElementById('book-modal').dataset.id);
        const book = libraryManager.getBook(id);
        if (book) {
            book.title = document.getElementById('book-title-input').value;
            book.content = document.getElementById('book-content-input').value;
            await db.put('books', book);
            await libraryManager.loadBooks();
            uiManager.closeModal('book-modal');
            showNotification('书籍已更新', 'success');
        }
    }

    async saveToLibrary(outputId) {
        const content = document.getElementById(outputId).textContent;
        if (!content || content === '结果将显示在这里...') {
            showNotification('暂无内容', 'error');
            return;
        }
        const title = prompt('请输入书名:');
        if (!title) return;
        await db.put('books', { title, content, createdAt: new Date().toISOString() });
        await libraryManager.loadBooks();
        await libraryManager.updateCounts();
        showNotification('已保存到图书馆', 'success');
    }

    // Prompts
    createPromptTemplate() {
        document.getElementById('modal-title').textContent = '新建提示词';
        document.getElementById('modal-prompt-name').value = '';
        document.getElementById('modal-prompt-name').removeAttribute('readonly');
        document.getElementById('modal-prompt-content').value = '';
        uiManager.openModal('edit-modal');
        document.getElementById('edit-modal').dataset.key = '';
    }

    async editPrompt(key) {
        const prompt = libraryManager.getPrompt(key);
        if (!prompt) return;
        
        document.getElementById('modal-title').textContent = '编辑提示词';
        document.getElementById('modal-prompt-name').value = PROMPT_NAMES[key] || key;
        document.getElementById('modal-prompt-content').value = prompt.value;
        uiManager.openModal('edit-modal');
        document.getElementById('edit-modal').dataset.key = key;
    }

    async saveModalPrompt() {
        const isNew = !document.getElementById('edit-modal').dataset.key;
        let key = document.getElementById('edit-modal').dataset.key;
        const content = document.getElementById('modal-prompt-content').value;
        
        if (!key) {
            key = document.getElementById('modal-prompt-name').value.trim();
            if (!key) {
                showNotification('请输入提示词名称', 'error');
                return;
            }
        }
        
        await db.put('prompts', { key, value: content });
        await libraryManager.loadPrompts();
        await libraryManager.updateCounts();
        uiManager.closeModal('edit-modal');
        showNotification(isNew ? '提示词已创建' : '提示词已更新', 'success');
    }

    async deletePrompt(key) {
        if (!confirm('确定删除此提示词?')) return;
        await db.delete('prompts', key);
        await libraryManager.loadPrompts();
        await libraryManager.updateCounts();
        showNotification('已删除', 'success');
    }

    viewPrompt(key) {
        const prompt = libraryManager.getPrompt(key);
        if (prompt) {
            document.getElementById('view-prompt-title').textContent = '查看提示词';
            document.getElementById('view-prompt-name').value = PROMPT_NAMES[key] || key;
            document.getElementById('view-prompt-content').value = prompt.value;
            uiManager.openModal('view-prompt-modal');
        }
    }

    // Picker
    toggleLibraryPicker(type, pickerType = 'book') {
        this.currentLibraryTarget = type;
        this.currentPickerType = pickerType;
        this.selectedLibraryBooks = [];
        this.selectedLibraryPrompts = [];
        
        const header = document.getElementById('picker-modal-header');
        header.innerHTML = pickerType === 'book' ? '📚 多图书馆引用选择器' : '📝 多提示词引用选择器';
        
        this.switchPickerTab(pickerType);
        uiManager.openModal('library-picker-modal');
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

    loadLibraryPicker() {
        const container = document.getElementById('library-picker-container');
        container.innerHTML = '';
        if (libraryManager.books.length === 0) {
            container.innerHTML = '<div style="color:var(--text-secondary);padding:20px;text-align:center;">📚 暂无藏书，请先在图书馆添加</div>';
            return;
        }
        libraryManager.books.forEach(book => {
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
        container.innerHTML = '';
        if (libraryManager.prompts.length === 0) {
            container.innerHTML = '<div style="color:var(--text-secondary);padding:20px;text-align:center;">📝 暂无提示词，请先在图书馆添加</div>';
            return;
        }
        libraryManager.prompts.forEach(prompt => {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.dataset.promptKey = prompt.key;
            card.onclick = () => this.togglePromptSelection(prompt.key);
            card.innerHTML = `
                <div class="book-icon">📝</div>
                <div class="book-title">${PROMPT_NAMES[prompt.key] || prompt.key}</div>
                <div class="book-meta">${prompt.value.substring(0, 50)}...</div>
                <div class="book-meta">${prompt.value.length} 字</div>
            `;
            card.style.setProperty('--card-active-color', '#4a9eff');
            container.appendChild(card);
        });
    }

    toggleBookSelection(bookId) {
        const index = this.selectedLibraryBooks.indexOf(bookId);
        if (index > -1) this.selectedLibraryBooks.splice(index, 1);
        else this.selectedLibraryBooks.push(bookId);
        
        const cards = document.querySelectorAll('#library-picker-container .book-card');
        cards.forEach(card => {
            const id = parseInt(card.dataset.bookId);
            card.classList.toggle('active', this.selectedLibraryBooks.includes(id));
        });
        this.updatePickerSelectedTags();
    }

    togglePromptSelection(promptKey) {
        const index = this.selectedLibraryPrompts.indexOf(promptKey);
        if (index > -1) this.selectedLibraryPrompts.splice(index, 1);
        else this.selectedLibraryPrompts.push(promptKey);
        
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
        document.getElementById('picker-book-count').textContent = this.selectedLibraryBooks.length;
        document.getElementById('picker-prompt-count').textContent = this.selectedLibraryPrompts.length;
        
        let tags = [];
        this.selectedLibraryBooks.forEach(bookId => {
            const book = libraryManager.getBook(bookId);
            if (book) tags.push(`<span class="library-tag" onclick="event.stopPropagation(); window.app.toggleBookSelection(${bookId})">📖 ${book.title} <span class="remove-tag">×</span></span>`);
        });
        this.selectedLibraryPrompts.forEach(promptKey => {
            tags.push(`<span class="prompt-tag" onclick="event.stopPropagation(); window.app.togglePromptSelection('${promptKey}')">📝 ${PROMPT_NAMES[promptKey] || promptKey} <span class="remove-tag">×</span></span>`);
        });
        
        container.innerHTML = tags.length ? tags.join('') : '<span style="color:var(--text-secondary);font-size:11px;">点击下方内容添加引用...</span>';
    }

    confirmLibrarySelection() {
        const session = chatSession.getSession(this.currentLibraryTarget);
        const input = document.getElementById(this.currentLibraryTarget + '-chat-input');
        let mentions = [];
        
        this.selectedLibraryBooks.forEach(id => {
            const book = libraryManager.getBook(id);
            if (book) {
                mentions.push(`@${book.title}`);
                if (!session.selectedBooks.includes(id)) session.selectedBooks.push(id);
            }
        });
        
        this.selectedLibraryPrompts.forEach(key => {
            mentions.push(`#${PROMPT_NAMES[key] || key}`);
            if (!session.selectedPrompts.includes(key)) session.selectedPrompts.push(key);
        });
        
        if (mentions.length > 0) {
            const currentValue = input.value.trim();
            input.value = mentions.join(' ') + (currentValue ? ' ' + currentValue : '');
        }
        
        this.updateLibraryTags(this.currentLibraryTarget);
        this.updatePromptTags(this.currentLibraryTarget);
        uiManager.closeModal('library-picker-modal');
        showNotification(`已添加 ${this.selectedLibraryBooks.length} 本书籍和 ${this.selectedLibraryPrompts.length} 个提示词引用`, 'success');
    }

    clearAllSelection() {
        this.selectedLibraryBooks = [];
        this.selectedLibraryPrompts = [];
        document.querySelectorAll('#library-picker-container .book-card, #prompt-picker-container .book-card').forEach(c => {
            c.classList.remove('active');
            c.style.borderColor = '';
            c.style.background = '';
        });
        this.updatePickerSelectedTags();
    }

    updateLibraryTags(type) {
        const container = document.getElementById(type + '-library-tags');
        const session = chatSession.getSession(type);
        
        if (session.selectedBooks.length === 0) {
            container.innerHTML = '<span style="color:var(--text-secondary);font-size:11px;">点击下方@图书馆添加引用...</span>';
        } else {
            container.innerHTML = session.selectedBooks.map(bookId => {
                const book = libraryManager.getBook(bookId);
                if (!book) return '';
                return `<span class="library-tag" onclick="window.app.removeLibraryTag('${type}', ${bookId})">
                    📖 ${book.title}
                    <span class="remove-tag">×</span>
                </span>`;
            }).join('');
        }
        chatSession.updateContextStats(type);
    }

    removeLibraryTag(type, bookId) {
        const session = chatSession.getSession(type);
        const index = session.selectedBooks.indexOf(bookId);
        if (index > -1) {
            session.selectedBooks.splice(index, 1);
            this.updateLibraryTags(type);
        }
    }

    updatePromptTags(type) {
        const container = document.getElementById(type + '-prompt-tags');
        const session = chatSession.getSession(type);
        
        if (!session.selectedPrompts || session.selectedPrompts.length === 0) {
            container.innerHTML = '<span style="color:var(--text-secondary);font-size:11px;">点击下方@提示词添加引用...</span>';
        } else {
            container.innerHTML = session.selectedPrompts.map(promptKey => {
                return `<span class="prompt-tag" onclick="window.app.removePromptTag('${type}', '${promptKey}')">
                    📝 ${PROMPT_NAMES[promptKey] || promptKey}
                    <span class="remove-tag">×</span>
                </span>`;
            }).join('');
        }
    }

    removePromptTag(type, promptKey) {
        const session = chatSession.getSession(type);
        const index = session.selectedPrompts.indexOf(promptKey);
        if (index > -1) {
            session.selectedPrompts.splice(index, 1);
            this.updatePromptTags(type);
        }
    }
}