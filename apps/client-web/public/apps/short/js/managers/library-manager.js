/**
 * 图书馆管理器 v3.0
 * 搜索/过滤、标签、统计仪表盘、视图切换、拖拽导入
 * 新增：市场分析报告管理
 */
const libraryManager = {
    books: [],
    prompts: [],
    marketReports: [],
    _searchQuery: '',
    _sortBy: 'date',
    _filterTag: '',
    _viewMode: 'grid',
    _currentTab: 'books',

    async loadAll() {
        try {
            this.books = await db.getAll('books');
            this.prompts = await db.getAll('prompts');
            this.marketReports = await db.getAll('marketReports') || [];
        } catch (e) {
            console.error('loadAll failed:', e);
            this.books = [];
            this.prompts = [];
            this.marketReports = [];
        }
        this.updateUI();
    },

    // ========== 标签页切换 ==========
    switchTab(tab) {
        this._currentTab = tab;
        document.querySelectorAll('.lib-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        document.getElementById('library-books-section').style.display = tab === 'books' ? 'block' : 'none';
        document.getElementById('library-prompts-section').style.display = tab === 'prompts' ? 'block' : 'none';
        document.getElementById('library-reports-section').style.display = tab === 'reports' ? 'block' : 'none';
        this.updateUI();
    },

    updateUI() {
        const countEl = document.getElementById('book-count');
        if (countEl) countEl.textContent = this.books.length;

        // 根据当前标签页渲染对应内容
        if (this._currentTab === 'books') {
            this.renderBooks();
        } else if (this._currentTab === 'prompts') {
            this.renderPrompts();
        } else if (this._currentTab === 'reports') {
            this.renderMarketReports();
        }

        this._updateDashboard();
        this._renderTagBar();
    },

    // ========== 仪表盘 ==========
    _updateDashboard() {
        const totalBooks = this.books.length;
        const totalReports = this.marketReports.length;
        const totalChars = this.books.reduce((s, b) => s + b.content.length, 0);
        const allTags = new Set();
        this.books.forEach(b => (b.tags || []).forEach(t => allTags.add(t)));
        let totalEntities = 0;
        if (typeof knowledgeGraph !== 'undefined') totalEntities = knowledgeGraph.entities.size;

        const _set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        _set('lib-total-books', totalBooks);
        _set('lib-total-reports', totalReports);
        _set('lib-total-chars', totalChars > 10000 ? (totalChars / 10000).toFixed(1) + '万' : totalChars);
        _set('lib-total-tags', allTags.size);
        _set('lib-total-entities', totalEntities);
    },

    // ========== 标签过滤栏 ==========
    _renderTagBar() {
        const bar = document.getElementById('library-tag-bar');
        if (!bar) return;
        const tagCounts = {};
        this.books.forEach(b => (b.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
        const tags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
        if (tags.length === 0) { bar.innerHTML = ''; return; }
        bar.innerHTML = tags.map(([tag, count]) =>
            `<span class="lib-tag-chip${this._filterTag === tag ? ' active' : ''}" onclick="libraryManager.filterByTag('${_escapeHtml(tag)}')">${tag} <span class="lib-tag-count">${count}</span></span>`
        ).join('');
    },

    // ========== 视图切换 ==========
    setViewMode(mode) {
        this._viewMode = mode;
        document.querySelectorAll('.lib-view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === mode));
        const container = document.getElementById('library-container');
        if (container) container.classList.toggle('list-view', mode === 'list');
        this.renderBooks();
    },

    // ========== 渲染书籍 ==========
    renderBooks() {
        const container = document.getElementById('library-container');
        if (!container) return;

        let filtered = [...this.books];

        // 搜索
        if (this._searchQuery) {
            const q = this._searchQuery.toLowerCase();
            filtered = filtered.filter(b =>
                b.title.toLowerCase().includes(q) ||
                (b.tags && b.tags.some(t => t.toLowerCase().includes(q))) ||
                b.content.toLowerCase().includes(q)
            );
        }

        // 标签过滤
        if (this._filterTag) {
            filtered = filtered.filter(b => b.tags && b.tags.includes(this._filterTag));
        }

        // 排序
        if (this._sortBy === 'name') {
            filtered.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
        } else if (this._sortBy === 'size') {
            filtered.sort((a, b) => b.content.length - a.content.length);
        } else {
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        if (filtered.length === 0) {
            const isSearch = this._searchQuery || this._filterTag;
            container.innerHTML = `<div class="library-empty">
                <div class="library-empty-icon">${isSearch ? '🔍' : '📚'}</div>
                <div class="library-empty-text">${isSearch ? '未找到匹配的书籍' : '暂无藏书'}</div>
                <div class="library-empty-hint">${isSearch ? '试试其他关键词或清除过滤' : '点击「新建」或拖拽文件导入'}</div>
            </div>`;
            return;
        }

        if (this._viewMode === 'list') {
            container.innerHTML = filtered.map(b => this._renderBookListItem(b)).join('');
        } else {
            container.innerHTML = filtered.map(b => this._renderBookGridCard(b)).join('');
        }
    },

    _renderBookGridCard(b) {
        const charCount = b.content.length;
        const sizeLabel = charCount > 10000 ? `${(charCount/10000).toFixed(1)}万字` : `${charCount}字`;
        const tags = (b.tags || []).slice(0, 3).map(t => `<span class="book-tag">${_escapeHtml(t)}</span>`).join('');
        const preview = b.content.substring(0, 80).replace(/\n/g, ' ');
        const dateStr = b.createdAt ? new Date(b.createdAt).toLocaleDateString('zh-CN') : '';
        const kgCount = this._getBookEntityCount(b);
        const kgBadge = kgCount > 0 ? `<span class="book-kg-badge">🕸️${kgCount}</span>` : '';
        return `<div class="book-card" onclick="app.viewBook(${b.id})">
            <div class="book-card-top">
                <div class="book-icon">📖</div>
                ${kgBadge}
            </div>
            <div class="book-title">${_escapeHtml(b.title)}</div>
            <div class="book-preview">${_escapeHtml(preview)}${charCount > 80 ? '...' : ''}</div>
            <div class="book-tags-row">${tags}</div>
            <div class="book-meta-row">
                <span>${dateStr}</span>
                <span class="book-size">${sizeLabel}</span>
            </div>
            <div class="book-actions">
                <button class="book-btn" onclick="event.stopPropagation();app.analyzeBook(${b.id})" title="AI拆解">🔬</button>
                <button class="book-btn" onclick="event.stopPropagation();app.editBookTags(${b.id})" title="标签">🏷️</button>
                <button class="book-btn" onclick="event.stopPropagation();app.deleteBook(${b.id})" title="删除">🗑️</button>
            </div>
        </div>`;
    },

    _renderBookListItem(b) {
        const charCount = b.content.length;
        const sizeLabel = charCount > 10000 ? `${(charCount/10000).toFixed(1)}万字` : `${charCount}字`;
        const tags = (b.tags || []).slice(0, 3).map(t => `<span class="book-tag">${_escapeHtml(t)}</span>`).join('');
        const preview = b.content.substring(0, 120).replace(/\n/g, ' ');
        const dateStr = b.createdAt ? new Date(b.createdAt).toLocaleDateString('zh-CN') : '';
        return `<div class="book-card" onclick="app.viewBook(${b.id})">
            <div class="book-card-top"><div class="book-icon">📖</div></div>
            <div class="book-list-body">
                <div class="book-title">${_escapeHtml(b.title)}</div>
                <div class="book-preview">${_escapeHtml(preview)}</div>
                <div class="book-tags-row">${tags}</div>
            </div>
            <div class="book-meta-row">
                <span>${dateStr}</span>
                <span class="book-size">${sizeLabel}</span>
            </div>
            <div class="book-actions">
                <button class="book-btn" onclick="event.stopPropagation();app.analyzeBook(${b.id})" title="AI拆解">🔬</button>
                <button class="book-btn" onclick="event.stopPropagation();app.editBookTags(${b.id})" title="标签">🏷️</button>
                <button class="book-btn" onclick="event.stopPropagation();app.deleteBook(${b.id})" title="删除">🗑️</button>
            </div>
        </div>`;
    },

    // ========== 渲染提示词 ==========
    renderPrompts() {
        const container = document.getElementById('prompt-container');
        if (!container) return;
        const userPrompts = this.prompts.filter(p => p.key !== 'knowledge_graph');
        if (userPrompts.length === 0) {
            container.innerHTML = '<div class="library-empty"><div class="library-empty-icon">📝</div><div class="library-empty-text">暂无自定义提示词</div></div>';
        } else {
            container.innerHTML = userPrompts.map(p => `
                <div class="book-card" onclick="app.viewPrompt('${p.key}')">
                    <div class="book-icon" style="font-size:28px;text-align:center;margin-bottom:8px;">📝</div>
                    <div class="book-title" style="text-align:center;">${PROMPT_NAMES[p.key] || p.key}</div>
                    <div class="book-preview">${_escapeHtml((p.value || '').substring(0, 60))}...</div>
                    <div class="book-actions">
                        <button class="book-btn" onclick="event.stopPropagation();app.editPrompt('${p.key}')">✏️ 编辑</button>
                        <button class="book-btn" onclick="event.stopPropagation();app.deletePrompt('${p.key}')">🗑️</button>
                    </div>
                </div>`).join('');
        }
    },

    // ========== 市场分析报告 ==========
    renderMarketReports() {
        const container = document.getElementById('market-reports-container');
        if (!container) return;

        if (this.marketReports.length === 0) {
            container.innerHTML = `
                <div class="library-empty">
                    <div class="library-empty-icon">📊</div>
                    <div class="library-empty-text">暂无市场分析报告</div>
                    <div class="library-empty-hint">前往「市场分析」模块生成报告</div>
                </div>`;
            return;
        }

        // 按时间倒序
        const sorted = [...this.marketReports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        container.innerHTML = sorted.map(r => this._renderReportCard(r)).join('');
    },

    _renderReportCard(r) {
        const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleString('zh-CN') : '';
        const modeLabels = {
            dashboard: '📊 市场仪表盘',
            genre: '📈 题材分析',
            competitor: '🎯 竞品分析',
            creative: '💡 创作辅助'
        };
        const modeLabel = modeLabels[r.mode] || '📊 市场分析';
        const platformLabel = r.platform ? `[${r.platform}]` : '';
        const genreLabel = r.genre ? r.genre : '';

        return `<div class="report-card" data-report-id="${r.id}">
            <div class="report-card-header">
                <span class="report-mode-badge">${modeLabel}</span>
                <span class="report-date">${dateStr}</span>
            </div>
            <div class="report-card-title">${_escapeHtml(r.title)}</div>
            <div class="report-card-meta">
                ${platformLabel} ${genreLabel}
            </div>
            <div class="report-card-preview">${_escapeHtml((r.summary || '').substring(0, 100))}...</div>
            <div class="report-card-actions">
                <button class="report-btn" onclick="event.stopPropagation();libraryManager.viewReport(${r.id})">👁️ 查看</button>
                <button class="report-btn" onclick="event.stopPropagation();libraryManager.loadReportToMarket(${r.id})">📥 加载到市场</button>
                <button class="report-btn" onclick="event.stopPropagation();libraryManager.exportReport(${r.id})">📋 导出</button>
                <button class="report-btn danger" onclick="event.stopPropagation();libraryManager.deleteReport(${r.id})">🗑️ 删除</button>
            </div>
        </div>`;
    },

    async saveMarketReport(title, mode, platform, genre, content, summary) {
        try {
            const reportData = {
                title,
                mode,
                platform: platform || '',
                genre: genre || '',
                content,
                summary: summary || content.substring(0, 200),
                createdAt: new Date().toISOString()
            };
            await db.put('marketReports', reportData);
            await this.loadAll();
            showNotification('市场分析报告已保存', 'success');
            return reportData.id;
        } catch (e) {
            console.error('saveMarketReport failed:', e);
            showNotification('保存报告失败: ' + e.message, 'error');
            return null;
        }
    },

    async deleteReport(id) {
        if (!confirm('确定删除此市场分析报告?')) return;
        await db.delete('marketReports', id);
        await this.loadAll();
        showNotification('报告已删除', 'success');
    },

    viewReport(id) {
        const report = this.marketReports.find(r => r.id === id);
        if (!report) return;

        // 填充到查看模态框
        document.getElementById('view-report-title').textContent = report.title;
        document.getElementById('view-report-meta').textContent = `${report.mode} | ${report.platform || ''} | ${new Date(report.createdAt).toLocaleString('zh-CN')}`;
        document.getElementById('view-report-content').value = report.content;
        uiManager.openModal('view-report-modal');
    },

    loadReportToMarket(id) {
        const report = this.marketReports.find(r => r.id === id);
        if (!report) return;

        // 切换到市场分析视图并加载报告
        app.switchView('market');
        if (window.marketView && window.marketView.loadReport) {
            window.marketView.loadReport(report);
        }
        showNotification('报告已加载到市场分析', 'success');
    },

    async exportReport(id) {
        const report = this.marketReports.find(r => r.id === id);
        if (!report) return;

        const blob = new Blob([report.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `市场分析报告_${report.title}_${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('报告已导出', 'success');
    },

    _getBookEntityCount(book) {
        if (typeof knowledgeGraph === 'undefined') return 0;
        let count = 0;
        for (const e of knowledgeGraph.entities.values()) {
            if (e.properties && e.properties.source === book.title) count++;
        }
        return count;
    },

    // ========== 搜索/排序/过滤 ==========
    searchBooks(query) {
        this._searchQuery = query;
        this.renderBooks();
    },

    sortBooks(by) {
        this._sortBy = by;
        this.renderBooks();
    },

    filterByTag(tag) {
        this._filterTag = this._filterTag === tag ? '' : tag;
        this._renderTagBar();
        this.renderBooks();
    },

    getAllTags() {
        const tags = new Set();
        this.books.forEach(b => (b.tags || []).forEach(t => tags.add(t)));
        return [...tags];
    },

    // ========== CRUD ==========
    async addBook(title, content, tags) {
        try {
            var bookData = {
                title,
                content,
                tags: tags || [],
                createdAt: new Date().toISOString()
            };
            await db.put('books', bookData);

            // 仅在用户已选择本地文件夹时才同步保存JSON
            if (localFS._dirHandle) {
                var safeName = title.replace(/[\\/:*?"<>|]/g, '_').substring(0, 50);
                var filename = safeName + '_' + Date.now() + '.json';
                await localFS.saveJSON(filename, bookData);
            }

            this._searchQuery = '';
            this._filterTag = '';
            const searchInput = document.getElementById('library-search-input');
            if (searchInput) searchInput.value = '';
            await this.loadAll();
            showNotification('已保存: ' + title, 'success');
        } catch (e) {
            console.error('addBook failed:', e);
            showNotification('保存失败: ' + e.message, 'error');
        }
    },

    async updateBook(id, updates) {
        const book = this.getBook(id);
        if (!book) return;
        Object.assign(book, updates);
        await db.put('books', book);
        await this.loadAll();
    },

    async deleteBook(id) {
        await db.delete('books', id);
        await this.loadAll();
        showNotification('已删除', 'success');
    },

    async savePrompt(key, value) {
        await db.put('prompts', { key, value });
        await this.loadAll();
    },

    async deletePrompt(key) {
        await db.delete('prompts', key);
        await this.loadAll();
        showNotification('已删除', 'success');
    },

    getBook(id) { return this.books.find(b => b.id === id); },
    getPrompt(key) { return this.prompts.find(p => p.key === key); },

    // ========== 批量导入 ==========
    async importFromText(text, title) {
        if (!text || !title) return;
        if (text.length > 50000) {
            const chapters = text.split(/(?=第[一二三四五六七八九十百千\d]+章)/);
            if (chapters.length > 1) {
                for (let i = 0; i < chapters.length; i++) {
                    if (chapters[i].trim().length > 50) {
                        await this.addBook(`${title} (${i + 1})`, chapters[i].trim(), ['导入', '分卷']);
                    }
                }
                showNotification(`已分卷导入 ${chapters.length} 本`, 'success');
                return;
            }
        }
        await this.addBook(title, text, ['导入']);
    },

    async importFiles(files) {
        let count = 0;
        for (const file of files) {
            if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
                try {
                    const text = await file.text();
                    const title = file.name.replace(/\.[^.]+$/, '');
                    var bookData = {
                        title,
                        content: text,
                        tags: ['文件导入'],
                        createdAt: new Date().toISOString()
                    };
                    await db.put('books', bookData);
                    // 仅在用户已选择本地文件夹时才同步保存
                    if (localFS._dirHandle) {
                        var safeName = title.replace(/[\\/:*?"<>|]/g, '_').substring(0, 50);
                        await localFS.saveJSON(safeName + '_' + Date.now() + '.json', bookData);
                    }
                    count++;
                } catch (e) {
                    console.error('importFiles put failed:', e);
                    showNotification('导入失败: ' + e.message, 'error');
                }
            }
        }
        const fileInput = document.getElementById('book-import-input');
        if (fileInput) fileInput.value = '';
        if (count > 0) {
            this._searchQuery = '';
            this._filterTag = '';
            const searchInput = document.getElementById('library-search-input');
            if (searchInput) searchInput.value = '';
            await this.loadAll();
            showNotification(`已导入 ${count} 个文件`, 'success');
        } else {
            showNotification('没有可导入的文本文件', 'error');
        }
    }
};
