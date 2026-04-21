/**
 * 图书馆与阅读中心 V79.1
 * 书籍管理 · 阅读器 · 笔记标注 · RAG索引
 * 全局对象: LibrarySystem
 */
const LibrarySystem = {
    _books: [],
    _currentBook: null,
    _currentPosition: 0,
    _notes: [],
    _bookmarks: [],
    _readingHistory: [],
    _initialized: false,

    _BOOK_TYPES: {
        txt: { label: 'TXT文本', icon: 'fa-file-lines', color: 'blue' },
        md: { label: 'Markdown', icon: 'fa-markdown', color: 'purple' },
        json: { label: 'JSON数据', icon: 'fa-code', color: 'green' },
        pdf: { label: 'PDF文档', icon: 'fa-file-pdf', color: 'red' },
        epub: { label: 'EPUB电子书', icon: 'fa-book', color: 'orange' },
        other: { label: '其他文件', icon: 'fa-file', color: 'gray' }
    },

    _READING_THEMES: {
        light: { label: '明亮', bg: '#ffffff', text: '#1a1a1a', secondary: '#6b7280' },
        dark: { label: '暗黑', bg: '#1a1a1a', text: '#e5e5e5', secondary: '#9ca3af' },
        sepia: { label: '羊皮纸', bg: '#f4ecd8', text: '#5c4b37', secondary: '#8b7355' },
        green: { label: '护眼绿', bg: '#cce8cc', text: '#2d4a2d', secondary: '#5a7a5a' }
    },

    async addBook(name, content, type = 'txt', metadata = {}) {
        const id = 'book_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        const book = {
            id,
            name,
            content,
            type,
            size: content.length,
            wordCount: this._countWords(content),
            chapterCount: this._countChapters(content),
            ts: Date.now(),
            lastRead: null,
            readProgress: 0,
            readTime: 0,
            tags: metadata.tags || [],
            author: metadata.author || '未知',
            category: metadata.category || '未分类',
            description: metadata.description || '',
            favorite: false
        };
        this._books.push(book);
        try {
            await DB.put('library_books', book);
            await RAGSystem.addDocument(name, content, 'library', { bookId: id });
        } catch(e) {
            try {
                await DB.put('vectors', { id, content: content.slice(0, 10000), tags: ['library', name, type], ts: Date.now() });
            } catch(e2) {}
        }
        return book;
    },

    async importFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const content = e.target.result;
                    const ext = file.name.split('.').pop().toLowerCase();
                    const type = this._BOOK_TYPES[ext] ? ext : 'other';
                    const book = await this.addBook(file.name, content, type);
                    showNotification(`已导入《${file.name}》，共${book.wordCount}字`, 'success');
                    resolve(book);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    },

    async deleteBook(id) {
        const idx = this._books.findIndex(b => b.id === id);
        if (idx >= 0) {
            const book = this._books[idx];
            this._books.splice(idx, 1);
            try {
                await DB.delete('library_books', id);
                this._notes = this._notes.filter(n => n.bookId !== id);
                this._bookmarks = this._bookmarks.filter(b => b.bookId !== id);
            } catch(e) {}
            return true;
        }
        return false;
    },

    getBook(id) {
        return this._books.find(b => b.id === id);
    },

    getAllBooks(sortBy = 'lastRead') {
        const sorted = [...this._books];
        switch(sortBy) {
            case 'name':
                return sorted.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
            case 'ts':
                return sorted.sort((a, b) => b.ts - a.ts);
            case 'lastRead':
                return sorted.sort((a, b) => (b.lastRead || 0) - (a.lastRead || 0));
            case 'readProgress':
                return sorted.sort((a, b) => b.readProgress - a.readProgress);
            case 'wordCount':
                return sorted.sort((a, b) => b.wordCount - a.wordCount);
            default:
                return sorted;
        }
    },

    searchBooks(query) {
        const q = query.toLowerCase();
        return this._books.filter(b => 
            b.name.toLowerCase().includes(q) ||
            (b.author && b.author.toLowerCase().includes(q)) ||
            (b.tags && b.tags.some(t => t.toLowerCase().includes(q))) ||
            (b.content && b.content.toLowerCase().includes(q))
        );
    },

    async openBook(id, position = 0) {
        const book = this.getBook(id);
        if (!book) return null;
        this._currentBook = book;
        this._currentPosition = position;
        book.lastRead = Date.now();
        try {
            await DB.put('library_books', book);
        } catch(e) {}
        this._readingHistory.unshift({ bookId: id, position, ts: Date.now() });
        if (this._readingHistory.length > 50) {
            this._readingHistory = this._readingHistory.slice(0, 50);
        }
        return book;
    },

    closeBook() {
        if (this._currentBook) {
            this._currentBook.readProgress = this._currentPosition;
            try { DB.put('library_books', this._currentBook); } catch(e) {}
        }
        this._currentBook = null;
        this._currentPosition = 0;
    },

    getCurrentBook() {
        return this._currentBook;
    },

    getContentChunk(size = 3000) {
        if (!this._currentBook || !this._currentBook.content) return '';
        const content = this._currentBook.content;
        const start = this._currentPosition;
        const end = Math.min(start + size, content.length);
        return content.slice(start, end);
    },

    navigate(delta, chunkSize = 3000) {
        if (!this._currentBook) return;
        const newPos = this._currentPosition + delta * chunkSize;
        const maxPos = this._currentBook.content.length;
        this._currentPosition = Math.max(0, Math.min(newPos, maxPos - 100));
        if (this._currentBook) {
            this._currentBook.readProgress = Math.floor((this._currentPosition / this._currentBook.content.length) * 100);
        }
        return this.getContentChunk(chunkSize);
    },

    goToPosition(position) {
        if (!this._currentBook) return;
        this._currentPosition = Math.max(0, Math.min(position, this._currentBook.content.length - 100));
        return this.getContentChunk();
    },

    goToProgress(percent) {
        if (!this._currentBook) return;
        const pos = Math.floor((percent / 100) * this._currentBook.content.length);
        return this.goToPosition(pos);
    },

    getProgress() {
        if (!this._currentBook || !this._currentBook.content) return 0;
        return Math.floor((this._currentPosition / this._currentBook.content.length) * 100);
    },

    addNote(bookId, position, content, color = 'yellow') {
        const note = {
            id: 'note_' + Date.now(),
            bookId: bookId || this._currentBook?.id,
            position,
            content,
            color,
            ts: Date.now()
        };
        this._notes.push(note);
        this._saveNotes();
        return note;
    },

    getNotes(bookId) {
        const id = bookId || this._currentBook?.id;
        return this._notes.filter(n => n.bookId === id).sort((a, b) => a.position - b.position);
    },

    deleteNote(noteId) {
        const idx = this._notes.findIndex(n => n.id === noteId);
        if (idx >= 0) {
            this._notes.splice(idx, 1);
            this._saveNotes();
            return true;
        }
        return false;
    },

    addBookmark(bookId, position, title = '') {
        const bookmark = {
            id: 'bm_' + Date.now(),
            bookId: bookId || this._currentBook?.id,
            position,
            title: title || `书签 ${this._bookmarks.filter(b => b.bookId === bookId).length + 1}`,
            ts: Date.now()
        };
        this._bookmarks.push(bookmark);
        this._saveBookmarks();
        return bookmark;
    },

    getBookmarks(bookId) {
        const id = bookId || this._currentBook?.id;
        return this._bookmarks.filter(b => b.bookId === id).sort((a, b) => a.position - b.position);
    },

    deleteBookmark(bookmarkId) {
        const idx = this._bookmarks.findIndex(b => b.id === bookmarkId);
        if (idx >= 0) {
            this._bookmarks.splice(idx, 1);
            this._saveBookmarks();
            return true;
        }
        return false;
    },

    async searchInBook(bookId, query) {
        const book = this.getBook(bookId);
        if (!book || !book.content) return [];
        const results = [];
        const q = query.toLowerCase();
        const content = book.content.toLowerCase();
        let pos = 0;
        while ((pos = content.indexOf(q, pos)) !== -1) {
            const start = Math.max(0, pos - 50);
            const end = Math.min(book.content.length, pos + q.length + 50);
            results.push({
                position: pos,
                snippet: book.content.slice(start, end),
                context: book.content.slice(Math.max(0, pos - 100), Math.min(book.content.length, pos + q.length + 100))
            });
            pos += q.length;
            if (results.length >= 50) break;
        }
        return results;
    },

    extractChapters(bookId) {
        const book = this.getBook(bookId);
        if (!book || !book.content) return [];
        const content = book.content;
        const chapterPatterns = [
            /^第[一二三四五六七八九十百千万零\d]+[章节回集篇]/gm,
            /^[一二三四五六七八九十]+[、.．]/gm,
            /^Chapter\s*\d+/gim,
            /^【第[一二三四五六七八九十百千万零\d]+[章节回集篇]】/gm
        ];
        let chapters = [];
        for (const pattern of chapterPatterns) {
            const matches = [...content.matchAll(pattern)];
            if (matches.length >= 3) {
                chapters = matches.map((m, i) => ({
                    index: i,
                    title: m[0].trim(),
                    position: m.index,
                    endPosition: matches[i + 1]?.index || content.length
                }));
                break;
            }
        }
        return chapters;
    },

    _countWords(text) {
        if (!text) return 0;
        const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        const english = (text.match(/[a-zA-Z]+/g) || []).length;
        return chinese + english;
    },

    _countChapters(text) {
        if (!text) return 0;
        const patterns = [
            /第[一二三四五六七八九十百千万零\d]+[章节回集篇]/g,
            /Chapter\s*\d+/gi
        ];
        let maxCount = 0;
        for (const p of patterns) {
            const count = (text.match(p) || []).length;
            if (count > maxCount) maxCount = count;
        }
        return maxCount;
    },

    getStats() {
        return {
            totalBooks: this._books.length,
            totalWords: this._books.reduce((sum, b) => sum + (b.wordCount || 0), 0),
            totalNotes: this._notes.length,
            totalBookmarks: this._bookmarks.length,
            recentlyRead: this._books.filter(b => b.lastRead && Date.now() - b.lastRead < 7 * 24 * 60 * 60 * 1000).length
        };
    },

    async _saveNotes() {
        try {
            localStorage.setItem('genesis_library_notes', JSON.stringify(this._notes));
        } catch(e) {}
    },

    async _saveBookmarks() {
        try {
            localStorage.setItem('genesis_library_bookmarks', JSON.stringify(this._bookmarks));
        } catch(e) {}
    },

    async _loadNotes() {
        try {
            const saved = localStorage.getItem('genesis_library_notes');
            if (saved) this._notes = JSON.parse(saved);
        } catch(e) {}
    },

    async _loadBookmarks() {
        try {
            const saved = localStorage.getItem('genesis_library_bookmarks');
            if (saved) this._bookmarks = JSON.parse(saved);
        } catch(e) {}
    },

    async _loadBooks() {
        try {
            const books = await DB.getAll('library_books') || [];
            this._books = books;
        } catch(e) {
            try {
                const vectors = await DB.getAll('vectors') || [];
                this._books = vectors.filter(v => (v.tags || []).includes('library')).map(v => ({
                    id: v.id,
                    name: v.tags[1] || '未知书籍',
                    content: v.content || '',
                    type: 'txt',
                    wordCount: this._countWords(v.content || ''),
                    ts: v.ts || Date.now()
                }));
            } catch(e2) {}
        }
    },

    async init() {
        await this._loadBooks();
        await this._loadNotes();
        await this._loadBookmarks();
        this._initialized = true;
        console.log('图书馆系统已初始化', this.getStats());
    }
};

window.LibrarySystem = LibrarySystem;
