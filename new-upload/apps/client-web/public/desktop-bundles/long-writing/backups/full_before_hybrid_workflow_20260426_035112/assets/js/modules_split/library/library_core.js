// ============================================
// 阅读中心 - 纯阅读器版
// 目标: 导入、选书、阅读、进度、主题、字号
// ============================================
Modules.reader_center = {
    books: [],
    currentBook: null,
    searchQuery: '',
    readingProgress: {},
    currentTheme: 'dark',
    currentSize: 18,
    _scrollTimer: null,

    themes: {
        dark: { name: '暗色', bg: '#101012', page: '#141416', text: '#e4e4e7', dim: '#a1a1aa' },
        paper: { name: '纸张', bg: '#ece3d2', page: '#f8f1e3', text: '#2f241b', dim: '#766653' },
        light: { name: '亮色', bg: '#f4f4f5', page: '#ffffff', text: '#18181b', dim: '#71717a' }
    },

    render() {
        const RC = Modules.reader_center;
        const theme = RC.themes[RC.currentTheme] || RC.themes.dark;
        return `
        <div class="flex h-full overflow-hidden bg-[#0b0b0d] text-white">
            <aside class="w-80 shrink-0 border-r border-white/10 bg-[#111113] flex flex-col">
                <div class="p-4 border-b border-white/10">
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <h2 class="text-base font-bold text-white">阅读中心</h2>
                            <p class="text-[11px] text-dim mt-1">纯阅读器</p>
                        </div>
                        <button class="h-9 w-9 rounded-lg bg-amber-500 text-black hover:bg-amber-400 flex center" title="导入书籍" onclick="document.getElementById('reader-upload').click()">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                        <input id="reader-upload" class="hidden" type="file" accept=".txt,.md,.html,.htm" multiple onchange="Modules.reader_center.importFiles(this)">
                    </div>
                    <div class="relative mt-4">
                        <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-dim text-xs"></i>
                        <input class="w-full h-10 rounded-lg bg-black/30 border border-white/10 pl-9 pr-3 text-sm text-white outline-none focus:border-amber-400/60" value="${RC._escape(RC.searchQuery)}" placeholder="搜索书名" oninput="Modules.reader_center.search(this.value)">
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto p-3" id="reader-book-list">
                    ${RC._renderBookList()}
                </div>

                <div class="p-3 border-t border-white/10 text-[10px] text-dim flex items-center justify-between">
                    <span>${RC.books.length} 本书</span>
                    <button class="hover:text-white" onclick="Modules.reader_center.importClipboard()"><i class="fa-solid fa-paste mr-1"></i>剪贴板导入</button>
                </div>
            </aside>

            <main class="flex-1 min-w-0 flex flex-col" style="background:${theme.bg}">
                ${RC.currentBook ? RC._renderReader(theme) : RC._renderEmpty(theme)}
            </main>
        </div>`;
    },

    _renderBookList() {
        const RC = Modules.reader_center;
        const q = RC.searchQuery.trim().toLowerCase();
        const books = q
            ? RC.books.filter(b => (b.name || '').toLowerCase().includes(q))
            : RC.books;

        if (!books.length) {
            return `
                <div class="h-full flex flex-col items-center justify-center text-center text-dim px-6">
                    <i class="fa-solid fa-book-open text-3xl opacity-30 mb-3"></i>
                    <div class="text-sm text-white/80">${q ? '没有找到书' : '还没有书'}</div>
                    <div class="text-[11px] mt-2 leading-relaxed">${q ? '换个关键词试试' : '点右上角加号导入 txt / md / html'}</div>
                </div>`;
        }

        return books.map(book => {
            const progress = RC.readingProgress[book.id]?.percent || 0;
            const active = RC.currentBook?.id === book.id;
            const size = book.size || (book.content || '').length || 0;
            return `
                <button class="group w-full text-left rounded-lg border ${active ? 'border-amber-400/50 bg-amber-500/10' : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.07]'} p-3 mb-2 transition" onclick="Modules.reader_center.openBook('${book.id}')">
                    <div class="flex items-start gap-3">
                        <div class="w-9 h-12 rounded bg-gradient-to-br from-amber-600 to-stone-800 shrink-0 shadow-sm flex center">
                            <i class="fa-solid fa-book text-white/70 text-sm"></i>
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="text-sm font-bold ${active ? 'text-amber-200' : 'text-white'} truncate">${RC._escape(book.name || '未命名')}</div>
                            <div class="text-[10px] text-dim mt-1">${RC._formatSize(size)} · ${progress}%</div>
                            <div class="h-1 bg-black/30 rounded-full mt-2 overflow-hidden">
                                <div class="h-full bg-amber-400" style="width:${progress}%"></div>
                            </div>
                        </div>
                        <span class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1" onclick="event.stopPropagation();Modules.reader_center.deleteBook('${book.id}')">
                            <i class="fa-solid fa-trash text-xs"></i>
                        </span>
                    </div>
                </button>`;
        }).join('');
    },

    _renderEmpty(theme) {
        return `
            <div class="flex-1 flex items-center justify-center px-8">
                <div class="text-center max-w-sm">
                    <div class="w-16 h-16 rounded-2xl mx-auto mb-5 flex center border border-black/10" style="background:${theme.page};color:${theme.text}">
                        <i class="fa-solid fa-book-open text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-bold" style="color:${theme.text}">选一本书开始读</h3>
                    <p class="text-sm mt-2 leading-relaxed" style="color:${theme.dim}">这里只负责把文字安静地放到你眼前。</p>
                    <button class="mt-5 h-10 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm" onclick="document.getElementById('reader-upload').click()">
                        <i class="fa-solid fa-plus mr-2"></i>导入一本书
                    </button>
                </div>
            </div>`;
    },

    _renderReader(theme) {
        const RC = Modules.reader_center;
        const book = RC.currentBook;
        const progress = RC.readingProgress[book.id]?.percent || 0;
        return `
            <div class="h-14 shrink-0 border-b border-black/10 flex items-center justify-between px-5" style="background:${theme.page};color:${theme.text}">
                <div class="flex items-center gap-3 min-w-0">
                    <button class="h-9 w-9 rounded-lg hover:bg-black/10 flex center" title="回到书架" onclick="Modules.reader_center.closeBook()">
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                    <div class="min-w-0">
                        <div class="text-sm font-bold truncate">${RC._escape(book.name || '未命名')}</div>
                        <div class="text-[10px]" style="color:${theme.dim}">${progress}% · ${RC._formatSize(book.size || (book.content || '').length)}</div>
                    </div>
                </div>
                <div class="flex items-center gap-1">
                    <button class="h-8 w-8 rounded-lg hover:bg-black/10 flex center" title="减小字号" onclick="Modules.reader_center.changeSize(-1)"><i class="fa-solid fa-minus text-xs"></i></button>
                    <span class="w-8 text-center text-xs font-mono">${RC.currentSize}</span>
                    <button class="h-8 w-8 rounded-lg hover:bg-black/10 flex center" title="增大字号" onclick="Modules.reader_center.changeSize(1)"><i class="fa-solid fa-plus text-xs"></i></button>
                    <span class="w-px h-5 bg-black/10 mx-2"></span>
                    ${Object.entries(RC.themes).map(([id, t]) => `
                        <button class="h-8 px-2 rounded-lg text-xs ${RC.currentTheme === id ? 'bg-black/10 font-bold' : 'hover:bg-black/10'}" onclick="Modules.reader_center.setTheme('${id}')">${t.name}</button>
                    `).join('')}
                </div>
            </div>
            <div class="h-1 bg-black/10 shrink-0">
                <div id="reader-progress-bar" class="h-full bg-amber-500 transition-all" style="width:${progress}%"></div>
            </div>
            <div id="reader-scroll" class="flex-1 overflow-y-auto scroll-smooth" onscroll="Modules.reader_center.onScroll()">
                <article id="reader-content" class="mx-auto max-w-3xl px-8 py-12 leading-loose" style="background:${theme.page};color:${theme.text};font-size:${RC.currentSize}px;min-height:100%;">
                    ${RC._formatContent(book.content || '')}
                </article>
            </div>`;
    },

    async init() {
        await this._loadState();
        const savedId = localStorage.getItem('reader_current_book');
        if (savedId) this.currentBook = this.books.find(b => b.id === savedId) || null;
        this.refresh();
        this._restoreScroll();
    },

    async _loadState() {
        try {
            this.books = await DB.getAll('library_books') || [];
        } catch (e) {
            this.books = [];
        }
        try {
            const saved = await DB.get('settings', 'reader_progress');
            this.readingProgress = saved?.data || {};
        } catch (e) {
            this.readingProgress = {};
        }
        this.books.sort((a, b) => {
            const ap = this.readingProgress[a.id]?.ts || 0;
            const bp = this.readingProgress[b.id]?.ts || 0;
            if (bp !== ap) return bp - ap;
            return (b.id || '').localeCompare(a.id || '');
        });
    },

    refresh() {
        const view = document.getElementById('module-view-reader_center');
        if (view) view.innerHTML = this.render();
    },

    search(value) {
        this.searchQuery = value || '';
        this.refresh();
        this._restoreScroll();
    },

    async openBook(id) {
        const book = this.books.find(b => b.id === id) || await DB.get('library_books', id);
        if (!book) return UI.toast('找不到这本书');
        this.currentBook = book;
        localStorage.setItem('reader_current_book', id);
        this.readingProgress[id] = { ...(this.readingProgress[id] || {}), ts: Date.now(), percent: this.readingProgress[id]?.percent || 0 };
        await this._saveProgress();
        this.refresh();
        this._restoreScroll();
    },

    closeBook() {
        this.currentBook = null;
        localStorage.removeItem('reader_current_book');
        this.refresh();
    },

    async importFiles(input) {
        const files = Array.from(input.files || []);
        if (!files.length) return;
        let firstImportedId = null;
        for (const file of files) {
            const raw = await file.text();
            const content = /\.html?$/i.test(file.name) ? this._htmlToText(raw) : raw;
            const id = Utils.uuid();
            if (!firstImportedId) firstImportedId = id;
            await DB.put('library_books', {
                id,
                name: file.name.replace(/\.[^.]+$/, ''),
                content,
                size: content.length,
                date: new Date().toLocaleString(),
                source: 'reader_import'
            });
        }
        input.value = '';
        await this._loadState();
        this.currentBook = this.books.find(b => b.id === firstImportedId) || this.books[0] || null;
        if (this.currentBook) localStorage.setItem('reader_current_book', this.currentBook.id);
        this.refresh();
        this._restoreScroll();
        UI.toast(`已导入 ${files.length} 本`);
    },

    async importClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            if (!text || text.trim().length < 5) return UI.toast('剪贴板没有可导入的文字');
            const id = Utils.uuid();
            await DB.put('library_books', {
                id,
                name: text.trim().slice(0, 24).replace(/\s+/g, ' ') || '剪贴板文本',
                content: text,
                size: text.length,
                date: new Date().toLocaleString(),
                source: 'reader_clipboard'
            });
            await this._loadState();
            await this.openBook(id);
            UI.toast('已从剪贴板导入');
        } catch (e) {
            UI.toast('无法读取剪贴板');
        }
    },

    async deleteBook(id) {
        if (!confirm('删除这本书？')) return;
        await DB.del('library_books', id);
        delete this.readingProgress[id];
        await this._saveProgress();
        if (this.currentBook?.id === id) {
            this.currentBook = null;
            localStorage.removeItem('reader_current_book');
        }
        await this._loadState();
        this.refresh();
        UI.toast('已删除');
    },

    changeSize(delta) {
        this.currentSize = Math.max(13, Math.min(30, this.currentSize + delta));
        localStorage.setItem('reader_font_size', String(this.currentSize));
        this.refresh();
        this._restoreScroll();
    },

    setTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem('reader_theme', theme);
        this.refresh();
        this._restoreScroll();
    },

    onScroll() {
        if (!this.currentBook) return;
        const scroll = document.getElementById('reader-scroll');
        if (!scroll) return;
        const max = Math.max(1, scroll.scrollHeight - scroll.clientHeight);
        const percent = Math.max(0, Math.min(100, Math.round((scroll.scrollTop / max) * 100)));
        const bar = document.getElementById('reader-progress-bar');
        if (bar) bar.style.width = percent + '%';
        clearTimeout(this._scrollTimer);
        this._scrollTimer = setTimeout(async () => {
            this.readingProgress[this.currentBook.id] = { scrollTop: scroll.scrollTop, percent, ts: Date.now() };
            await this._saveProgress();
            const item = this.books.find(b => b.id === this.currentBook.id);
            if (item) item.lastReadAt = Date.now();
        }, 300);
    },

    async _saveProgress() {
        await DB.put('settings', { id: 'reader_progress', data: this.readingProgress });
    },

    _restoreScroll() {
        if (!this.currentBook) return;
        const saved = this.readingProgress[this.currentBook.id];
        if (!saved) return;
        setTimeout(() => {
            const scroll = document.getElementById('reader-scroll');
            if (scroll) scroll.scrollTop = saved.scrollTop || 0;
        }, 60);
    },

    _formatContent(content) {
        const text = String(content || '').replace(/\r\n/g, '\n');
        const blocks = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
        if (!blocks.length) return '<p class="text-center opacity-60">空文本</p>';
        return blocks.map((block, index) => {
            const safe = this._escape(block).replace(/\n/g, '<br>');
            if (/^#{1,3}\s/.test(block)) {
                const title = this._escape(block.replace(/^#{1,3}\s*/, ''));
                return `<h2 class="text-[1.35em] font-bold mt-10 mb-5 pb-2 border-b border-current/10">${title}</h2>`;
            }
            if (/^第[一二三四五六七八九十百千万\d]+[章节回卷部集]/.test(block) && block.length < 80) {
                return `<h2 class="text-[1.35em] font-bold mt-10 mb-5 pb-2 border-b border-current/10">${safe}</h2>`;
            }
            return `<p class="mb-5 indent-8" data-reader-p="${index}">${safe}</p>`;
        }).join('');
    },

    _htmlToText(html) {
        const div = document.createElement('div');
        div.innerHTML = html || '';
        div.querySelectorAll('script,style,noscript').forEach(el => el.remove());
        return (div.innerText || div.textContent || '').trim();
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

    _formatSize(size) {
        const n = Number(size || 0);
        if (n > 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + 'MB';
        if (n > 1024) return (n / 1024).toFixed(1) + 'KB';
        return n + '字';
    },

    smartChapterDetect(content) {
        const text = String(content || '');
        const matches = [...text.matchAll(/^第[一二三四五六七八九十百千万\d]+[章节回卷部集].*$/gm)];
        if (!matches.length) return [{ title: '全文', start: 0, end: text.length, content: text, number: 1, wordCount: text.length }];
        return matches.map((m, i) => {
            const start = m.index || 0;
            const end = matches[i + 1]?.index || text.length;
            const chunk = text.slice(start, end);
            return { title: m[0].slice(0, 50), start, end, content: chunk, number: i + 1, wordCount: chunk.length };
        });
    }
};

Modules.reader_center.currentTheme = localStorage.getItem('reader_theme') || 'dark';
Modules.reader_center.currentSize = parseInt(localStorage.getItem('reader_font_size') || '18', 10);
