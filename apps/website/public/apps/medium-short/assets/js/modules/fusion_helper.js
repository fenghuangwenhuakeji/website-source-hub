/**
 * 融合拆书系统 + 通用上下文助手
 * 全局对象: FusionBookSystem, ContextHelper
 */
// ========== 融合拆书系统 ==========
const FusionBookSystem = {
    async getBooks() {
        const store = await DB.get('settings', 'fusion_books');
        return (store && store.items) ? store.items : [];
    },
    async addBook(name, fullText, regex) {
        const chapters = this._splitChapters(fullText, regex);
        const book = { id: 'fb_' + Date.now(), name, chapters, totalChars: fullText.length, createdAt: Date.now() };
        let store = await DB.get('settings', 'fusion_books') || { id: 'fusion_books', items: [] };
        store.items.push(book);
        await DB.put('settings', store);
        return book;
    },
    _splitChapters(text, regexStr) {
        const chapters = [];
        try {
            const regex = new RegExp(regexStr, 'gm');
            const matches = [];
            let m;
            while ((m = regex.exec(text)) !== null) {
                matches.push({ index: m.index, title: (m[1] || m[0]).trim() });
            }
            if (matches.length === 0) { chapters.push({ index: 0, title: '全文', content: text }); return chapters; }

            // —— 智能目录区检测 ——
            const gaps = [];
            for (let i = 1; i < matches.length; i++) {
                gaps.push(matches[i].index - matches[i - 1].index);
            }

            let tocEndIdx = -1;
            if (gaps.length >= 3) {
                let shortStreak = 0;
                for (let i = 0; i < gaps.length; i++) {
                    if (gaps[i] < 500) {
                        shortStreak++;
                    } else {
                        if (shortStreak >= 3) {
                            tocEndIdx = i;
                            break;
                        }
                        shortStreak = 0;
                    }
                }
            }

            const startIdx = tocEndIdx > 0 ? tocEndIdx + 1 : 0;
            let filtered = matches.slice(startIdx);
            if (filtered.length === 0) filtered = matches.slice();

            // —— 按标题去重（保留内容最长的版本）——
            const titleMap = new Map();
            for (let i = 0; i < filtered.length; i++) {
                const key = filtered[i].title.replace(/\s+/g, '').replace(/[\u3000]/g, '');
                const nextIdx = (i + 1 < filtered.length) ? filtered[i + 1].index : text.length;
                const contentLen = nextIdx - filtered[i].index;
                if (!titleMap.has(key) || contentLen > titleMap.get(key).contentLen) {
                    titleMap.set(key, { idx: i, contentLen });
                }
            }

            const uniqueIndices = [...titleMap.values()].map(v => v.idx).sort((a, b) => a - b);

            for (let j = 0; j < uniqueIndices.length; j++) {
                const mi = uniqueIndices[j];
                const start = filtered[mi].index;
                const nextMi = j + 1 < uniqueIndices.length ? uniqueIndices[j + 1] : null;
                const end = nextMi !== null ? filtered[nextMi].index : text.length;
                const content = text.slice(start, end).trim();
                if (content.length < 50 && uniqueIndices.length > 1) continue;
                chapters.push({ index: chapters.length, title: filtered[mi].title, content });
            }

            if (chapters.length === 0) {
                chapters.push({ index: 0, title: '全文', content: text });
            }
        } catch (e) { chapters.push({ index: 0, title: '全文(正则错误)', content: text }); }
        return chapters;
    },
    async deleteBook(bookId) {
        let store = await DB.get('settings', 'fusion_books');
        if (!store) return;
        store.items = store.items.filter(b => b.id !== bookId);
        await DB.put('settings', store);
    },
    async saveToLibrary(bookId) {
        const books = await this.getBooks();
        const book = books.find(b => b.id === bookId);
        if (!book) return;
        const fullContent = book.chapters.map(ch => ch.content).join('\n\n');
        await DB.put('library_books', { id: Utils.uuid(), name: book.name, type: 'txt', content: fullContent, size: fullContent.length, date: new Date().toLocaleDateString() });
        UI.toast(`《${book.name}》已导入沉浸阅读`);
    }
};

// ========== 通用上下文助手 (旗舰版) ==========
const ContextHelper = {
    async exportToLibrary(title, content) {
        if (!content || !content.trim()) return UI.toast('内容为空', 'error');
        await DB.put('library_books', { id: Utils.uuid(), name: title || '未命名作品', type: 'txt', content: content, size: content.length, date: new Date().toLocaleDateString() });
        UI.toast(`《${title}》已导入沉浸阅读`, 'success');
    },
    recordGeneration(module, content) {
        if (typeof MemorySystem !== 'undefined' && content) MemorySystem.addWorking(`[${module}] ${content.slice(0, 200)}`, 'generation', 3);
    },
    // 增强版上下文获取 — 使用模块记忆窗口
    async getEnhancedContext(currentText, maxTokens = 2000, moduleName = '') {
        let ctx = '';
        try {
            const keywords = (currentText || '').slice(-300).replace(/[。，！？\n\r]/g, ' ').split(/\s+/).filter(w => w.length > 1).slice(-8).join(' ');
            if (keywords) {
                const results = await RAGSystem.search(keywords, 5);
                if (results.length > 0) ctx += results.map(r => `[${r.source}] ${r.content.slice(0, 200)}`).join('\n');
            }
        } catch (e) {}
        // 模块专用记忆
        if (moduleName && typeof MemorySystem !== 'undefined') {
            const moduleCtx = MemorySystem.getModuleContext(moduleName, 5);
            if (moduleCtx) ctx += '\n[模块记忆/' + moduleName + ']\n' + moduleCtx.slice(0, 400);
        }
        const wm = MemorySystem.getWorkingContext(5);
        if (wm) ctx += '\n[工作记忆]\n' + wm.slice(0, 500);
        return ctx.slice(0, maxTokens * 2);
    },
    // 凤凰流专用上下文
    async getPhoenixContext(query, maxTokens = 3000) {
        let ctx = '';
        if (typeof MemorySystem !== 'undefined') {
            ctx = await MemorySystem.buildModuleWindow('phoenix', query, maxTokens);
        }
        if (!ctx && query) {
            const results = await RAGSystem.searchForPhoenix(query, 8);
            ctx = results.map(r => `[${r.source}/${r.title}] ${r.content.slice(0, 300)}`).join('\n---\n');
        }
        return ctx;
    },
    // 执笔台专用上下文
    async getWriterContext(query, maxTokens = 3000) {
        let ctx = '';
        if (typeof MemorySystem !== 'undefined') {
            ctx = await MemorySystem.buildModuleWindow('writer', query, maxTokens);
        }
        if (!ctx && query) {
            const results = await RAGSystem.searchForWriter(query, 8);
            ctx = results.map(r => `[${r.source}/${r.title}] ${r.content.slice(0, 300)}`).join('\n---\n');
        }
        return ctx;
    },
    // 世界引擎专用上下文
    async getWorldContext(query, maxTokens = 3000) {
        let ctx = '';
        if (typeof MemorySystem !== 'undefined') {
            ctx = await MemorySystem.buildModuleWindow('world', query, maxTokens);
        }
        if (!ctx && query) {
            const results = await RAGSystem.searchForWorld(query, 8);
            ctx = results.map(r => `[${r.source}/${r.title}] ${r.content.slice(0, 300)}`).join('\n---\n');
        }
        return ctx;
    }
};


