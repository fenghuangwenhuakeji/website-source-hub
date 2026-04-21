import { dbGetAll, dbPut, dbDelete } from '../core/db.js';
import { showNotification } from '../ui/notification.js';
import { copyText } from '../utils/helpers.js';

export class LibraryManager {
    constructor(uiManager) {
        this.ui = uiManager;
        this.books = [];
        this.prompts = [];
        this.selectedBooks = [];
        this.selectedPrompts = [];
        this.currentPickerType = 'book';
        this.currentPickerTarget = null;
        
        this.initEvents();
    }

    initEvents() {
        // Library View Buttons
        document.getElementById('btn-create-book')?.addEventListener('click', () => this.createBook());
        document.getElementById('btn-create-prompt')?.addEventListener('click', () => this.createPromptTemplate());
        
        // Modal Actions
        document.getElementById('btn-save-modal-prompt')?.addEventListener('click', () => this.saveModalPrompt());
        document.getElementById('btn-save-book')?.addEventListener('click', () => this.saveBookContent());
        document.getElementById('btn-copy-book')?.addEventListener('click', () => copyText(document.getElementById('book-content-input').value));
        document.getElementById('btn-copy-prompt')?.addEventListener('click', () => copyText(document.getElementById('view-prompt-content').value));
        
        // Picker Actions
        document.getElementById('picker-tab-book')?.addEventListener('click', () => this.switchPickerTab('book'));
        document.getElementById('picker-tab-prompt')?.addEventListener('click', () => this.switchPickerTab('prompt'));
        document.getElementById('btn-close-picker')?.addEventListener('click', () => this.closeLibraryPicker());
        document.getElementById('btn-clear-picker')?.addEventListener('click', () => this.clearAllSelection());
        document.getElementById('btn-confirm-picker')?.addEventListener('click', () => this.confirmLibrarySelection());
        
        // Search
        document.getElementById('library-search-input')?.addEventListener('input', () => this.filterLibraryBooks());
        document.getElementById('prompt-search-input')?.addEventListener('input', () => this.filterPrompts());
    }

    async loadLibrary() {
        this.books = await dbGetAll('books');
        this.prompts = await dbGetAll('prompts');
        this.renderBooks();
        this.renderPrompts();
        
        const countEl = document.getElementById('book-count');
        if (countEl) countEl.textContent = this.books.length + this.prompts.length;
    }

    renderBooks() {
        const container = document.getElementById('library-container');
        if (!container) return;
        
        if (this.books.length === 0) {
            container.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--text-secondary);">📚 暂无藏书</div>';
        } else {
            container.innerHTML = this.books.map(b => `
                <div class="book-card" data-id="${b.id}">
                    <div class="book-icon">📖</div>
                    <div class="book-title">${b.title}</div>
                    <div class="book-meta">${new Date(b.createdAt).toLocaleDateString()}</div>
                    <div class="book-meta">${b.content.length} 字</div>
                    <div class="book-actions">
                        <button class="book-btn delete-btn">删除</button>
                    </div>
                </div>
            `).join('');
            
            // Bind click events
            container.querySelectorAll('.book-card').forEach(card => {
                card.addEventListener('click', () => this.viewBook(parseInt(card.dataset.id)));
                card.querySelector('.delete-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteBook(parseInt(card.dataset.id));
                });
            });
        }
    }

    renderPrompts() {
        const container = document.getElementById('prompt-container');
        if (!container) return;
        
        if (this.prompts.length === 0) {
            container.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--text-secondary);">📝 暂无提示词</div>';
        } else {
            container.innerHTML = this.prompts.map(p => `
                <div class="book-card" data-key="${p.key}">
                    <div class="book-icon">📝</div>
                    <div class="book-title">${this.getPromptName(p.key)}</div>
                    <div class="book-meta">${p.value.substring(0, 50)}...</div>
                    <div class="book-actions">
                        <button class="book-btn edit-btn">编辑</button>
                        <button class="book-btn delete-btn">删除</button>
                    </div>
                </div>
            `).join('');
            
            // Bind events
            container.querySelectorAll('.book-card').forEach(card => {
                card.addEventListener('click', () => this.viewPrompt(card.dataset.key));
                card.querySelector('.edit-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.editPrompt(card.dataset.key);
                });
                card.querySelector('.delete-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deletePrompt(card.dataset.key);
                });
            });
        }
    }

    getPromptName(key) {
        const names = {
            deconstruct: '拆解模式',
            fusion: '融合模式',
            imitate: '仿写模式',
            template: '自定义模式',
            complete: '完整创作',
            inspiration: '灵感编写',
            structure: '结构优化',
            polish: '排版润色'
        };
        return names[key] || key;
    }

    // Book Operations
    async createBook() {
        const title = prompt('请输入书名:');
        if (!title) return;
        await dbPut('books', { title, content: '', createdAt: new Date().toISOString() });
        await this.loadLibrary();
        showNotification('藏书创建成功', 'success');
    }

    viewBook(id) {
        const book = this.books.find(b => b.id === id);
        if (book) {
            document.getElementById('book-title-input').value = book.title;
            document.getElementById('book-content-input').value = book.content;
            document.getElementById('book-modal').dataset.id = id;
            this.ui.showModal('book-modal');
        }
    }

    async saveBookContent() {
        const id = parseInt(document.getElementById('book-modal').dataset.id);
        const book = this.books.find(b => b.id === id);
        if (book) {
            book.title = document.getElementById('book-title-input').value;
            book.content = document.getElementById('book-content-input').value;
            await dbPut('books', book);
            await this.loadLibrary();
            this.ui.closeModal('book-modal');
            showNotification('书籍已更新', 'success');
        }
    }

    async deleteBook(id) {
        if (!confirm('确定删除此藏书?')) return;
        await dbDelete('books', id);
        await this.loadLibrary();
        showNotification('已删除', 'success');
    }

    async saveToLibrary(content) {
        if (!content || content === '结果将显示在这里...') {
            showNotification('暂无内容', 'error');
            return;
        }
        const title = prompt('请输入书名:');
        if (!title) return;
        await dbPut('books', { title, content, createdAt: new Date().toISOString() });
        await this.loadLibrary();
        showNotification('已保存到图书馆', 'success');
    }

    // Prompt Operations
    async createPromptTemplate() {
        document.getElementById('modal-title').textContent = '新建提示词';
        document.getElementById('modal-prompt-name').value = '';
        document.getElementById('modal-prompt-name').removeAttribute('readonly');
        document.getElementById('modal-prompt-content').value = '';
        document.getElementById('edit-modal').dataset.key = '';
        this.ui.showModal('edit-modal');
    }

    viewPrompt(key) {
        const prompt = this.prompts.find(p => p.key === key);
        if (prompt) {
            document.getElementById('view-prompt-name').value = this.getPromptName(key);
            document.getElementById('view-prompt-content').value = prompt.value;
            this.ui.showModal('view-prompt-modal');
        }
    }

    editPrompt(key) {
        const prompt = this.prompts.find(p => p.key === key);
        if (!prompt) return;
        
        document.getElementById('modal-title').textContent = '编辑提示词';
        document.getElementById('modal-prompt-name').value = this.getPromptName(key);
        document.getElementById('modal-prompt-content').value = prompt.value;
        document.getElementById('edit-modal').dataset.key = key;
        this.ui.showModal('edit-modal');
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
        
        await dbPut('prompts', { key, value: content });
        await this.loadLibrary();
        this.ui.closeModal('edit-modal');
        showNotification(isNew ? '提示词已创建' : '提示词已更新', 'success');
    }

    async deletePrompt(key) {
        if (!confirm('确定删除此提示词?')) return;
        await dbDelete('prompts', key);
        await this.loadLibrary();
        showNotification('已删除', 'success');
    }

    // Picker Logic
    toggleLibraryPicker(targetType, pickerType = 'book') {
        this.currentPickerTarget = targetType;
        this.currentPickerType = pickerType;
        this.selectedBooks = [];
        this.selectedPrompts = [];
        
        const header = document.getElementById('picker-modal-header');
        header.innerHTML = pickerType === 'book' ? '📚 多图书馆引用选择器' : '📝 多提示词引用选择器';
        
        this.switchPickerTab(pickerType);
        this.loadLibraryPicker();
        this.loadPromptPicker();
        this.updatePickerSelectedTags();
        this.ui.showModal('library-picker-modal');
    }

    closeLibraryPicker() {
        this.ui.closeModal('library-picker-modal');
        this.currentPickerTarget = null;
        this.selectedBooks = [];
        this.selectedPrompts = [];
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
        if (!container) return;
        container.innerHTML = '';
        
        if (this.books.length === 0) {
            container.innerHTML = '<div style="color:var(--text-secondary);padding:20px;text-align:center;">📚 暂无藏书，请先在图书馆添加</div>';
            return;
        }
        
        this.books.forEach(book => {
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
        
        if (this.prompts.length === 0) {
            container.innerHTML = '<div style="color:var(--text-secondary);padding:20px;text-align:center;">📝 暂无提示词，请先在图书馆添加</div>';
            return;
        }
        
        this.prompts.forEach(prompt => {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.dataset.promptKey = prompt.key;
            card.onclick = () => this.togglePromptSelection(prompt.key);
            card.innerHTML = `
                <div class="book-icon">📝</div>
                <div class="book-title">${this.getPromptName(prompt.key)}</div>
                <div class="book-meta">${prompt.value.substring(0, 50)}...</div>
                <div class="book-meta">${prompt.value.length} 字</div>
            `;
            card.style.setProperty('--card-active-color', '#4a9eff');
            container.appendChild(card);
        });
    }

    toggleBookSelection(bookId) {
        const index = this.selectedBooks.indexOf(bookId);
        if (index > -1) {
            this.selectedBooks.splice(index, 1);
        } else {
            this.selectedBooks.push(bookId);
        }
        
        const card = document.querySelector(`#library-picker-container .book-card[data-book-id="${bookId}"]`);
        if (card) card.classList.toggle('active', this.selectedBooks.includes(bookId));
        this.updatePickerSelectedTags();
    }

    togglePromptSelection(promptKey) {
        const index = this.selectedPrompts.indexOf(promptKey);
        if (index > -1) {
            this.selectedPrompts.splice(index, 1);
        } else {
            this.selectedPrompts.push(promptKey);
        }
        
        const card = document.querySelector(`#prompt-picker-container .book-card[data-prompt-key="${promptKey}"]`);
        if (card) {
            const isActive = this.selectedPrompts.includes(promptKey);
            card.classList.toggle('active', isActive);
            if (isActive) {
                card.style.borderColor = '#4a9eff';
                card.style.background = 'linear-gradient(135deg, rgba(74,158,255,0.1), var(--bg-dark))';
            } else {
                card.style.borderColor = '';
                card.style.background = '';
            }
        }
        this.updatePickerSelectedTags();
    }

    updatePickerSelectedTags() {
        const container = document.getElementById('picker-selected-tags');
        document.getElementById('picker-book-count').textContent = this.selectedBooks.length;
        document.getElementById('picker-prompt-count').textContent = this.selectedPrompts.length;
        
        let tags = [];
        this.selectedBooks.forEach(bookId => {
            const book = this.books.find(b => b.id === bookId);
            if (book) tags.push(`<span class="library-tag" data-type="book" data-id="${bookId}">📖 ${book.title} <span class="remove-tag">×</span></span>`);
        });
        this.selectedPrompts.forEach(promptKey => {
            tags.push(`<span class="prompt-tag" data-type="prompt" data-key="${promptKey}">📝 ${this.getPromptName(promptKey)} <span class="remove-tag">×</span></span>`);
        });
        
        container.innerHTML = tags.length ? tags.join('') : '<span style="color:var(--text-secondary);font-size:11px;">点击下方内容添加引用...</span>';
        
        // Bind remove events
        container.querySelectorAll('.library-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleBookSelection(parseInt(tag.dataset.id));
            });
        });
        container.querySelectorAll('.prompt-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePromptSelection(tag.dataset.key);
            });
        });
    }

    clearAllSelection() {
        this.selectedBooks = [];
        this.selectedPrompts = [];
        document.querySelectorAll('#library-picker-container .book-card').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('#prompt-picker-container .book-card').forEach(c => {
            c.classList.remove('active');
            c.style.borderColor = '';
            c.style.background = '';
        });
        this.updatePickerSelectedTags();
    }

    filterLibraryBooks() {
        const search = document.getElementById('library-search-input').value.toLowerCase();
        document.querySelectorAll('#library-picker-container .book-card').forEach(card => {
            const title = card.querySelector('.book-title').textContent.toLowerCase();
            card.style.display = title.includes(search) ? 'block' : 'none';
        });
    }

    filterPrompts() {
        const search = document.getElementById('prompt-search-input').value.toLowerCase();
        document.querySelectorAll('#prompt-picker-container .book-card').forEach(card => {
            const title = card.querySelector('.book-title').textContent.toLowerCase();
            card.style.display = title.includes(search) ? 'block' : 'none';
        });
    }

    confirmLibrarySelection() {
        const event = new CustomEvent('library-selected', {
            detail: {
                target: this.currentPickerTarget,
                books: this.selectedBooks,
                prompts: this.selectedPrompts
            }
        });
        document.dispatchEvent(event);
        this.closeLibraryPicker();
        showNotification(`已添加 ${this.selectedBooks.length} 本书籍和 ${this.selectedPrompts.length} 个提示词引用`, 'success');
    }
}