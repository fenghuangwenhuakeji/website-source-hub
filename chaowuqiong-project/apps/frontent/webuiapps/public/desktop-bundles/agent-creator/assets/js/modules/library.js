(() => {
  const readerCenterModule = {
    currentTab: "library",
    currentBook: null,
    currentTheme: "dark",
    currentSize: 18,
    sidebarOpen: true,
    customTools: [],
    bookmarks: [],
    annotations: [],
    readingProgress: {},
    shelfFilter: "all",
    shelfSort: "date",
    typesetSettings: {
      font: "'Songti SC', serif",
      size: 16,
      lineHeight: 1.8,
      indent: "2em",
      margin: 25,
      columns: 1,
      align: "justify",
      theme: "light"
    },
    typesetZoom: 0.85,
    chapters: [],
    currentChapter: 0,
    bookEntities: [],
    readingStats: { totalWords: 0, totalChapters: 0, avgChapterLen: 0, readingTime: 0, entities: 0, relations: 0 },
    aiContext: { enabled: true, autoExtract: true, linkToWorld: true, smartSuggest: true },
    _extractedEntities: [],
    _chapterCache: {},
    switchTab(tab) {
      this.currentTab = tab;
      const el = document.getElementById("module-view-reader_center");
      if (el) el.innerHTML = this.render();
    },
    async handleUpload(input) {
      const file = input.files?.[0];
      if (!file) return;
      const content = await file.text();
      const book = {
        id: "book_" + Date.now(),
        title: file.name.replace(/\.[^.]+$/, ""),
        chapters: this._parseChapters(content),
        wordCount: content.length,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await DB.put("library_books", book);
      this.currentBook = book;
      this.render();
    },
    _parseChapters(content) {
      const chapters = [];
      const lines = content.split("\n");
      let currentChapter = null;
      let chapterContent = [];
      let chapterNumber = 0;
      for (const line of lines) {
        if (/^第[一二三四五六七八九十百千万\d]+[章节回]/.test(line.trim())) {
          if (currentChapter) {
            currentChapter.content = chapterContent.join("\n");
            chapters.push(currentChapter);
          }
          chapterNumber++;
          currentChapter = {
            id: "ch_" + Date.now() + "_" + chapterNumber,
            title: line.trim(),
            content: "",
            number: chapterNumber
          };
          chapterContent = [];
        } else if (currentChapter) {
          chapterContent.push(line);
        }
      }
      if (currentChapter) {
        currentChapter.content = chapterContent.join("\n");
        chapters.push(currentChapter);
      }
      return chapters.length > 0 ? chapters : [{
        id: "ch_1",
        title: "\u5168\u6587",
        content,
        number: 1
      }];
    },
    _renderSidebarContent() {
      return `<div class="p-3 space-y-2">
            <button class="btn w-full h-11 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm" onclick="document.getElementById('rc-upload').click()">
                <i class="fa-solid fa-plus mr-2"></i>\u5BFC\u5165\u65B0\u4E66
            </button>
            <input type="file" id="rc-upload" class="hidden" accept=".txt,.md,.html" onchange="Modules.reader_center.handleUpload(this)">
        </div>`;
    },
    _renderMainContent() {
      if (!this.currentBook) {
        return `<div class="flex center h-full text-dim">\u9009\u62E9\u4E00\u672C\u4E66\u5F00\u59CB\u9605\u8BFB</div>`;
      }
      const chapter = this.chapters[this.currentChapter] || this.currentBook.chapters[0];
      return `<div class="flex-1 overflow-y-auto p-8">
            <h2 class="text-2xl font-bold mb-6">${chapter?.title || ""}</h2>
            <div class="prose max-w-none">${chapter?.content || ""}</div>
        </div>`;
    },
    _renderAIPanel() {
      return `<div class="w-64 shrink-0 bg-gray-50 border-l border-gray-200 p-4">
            <h3 class="font-bold text-sm mb-4">AI \u52A9\u624B</h3>
            <div class="text-xs text-dim">\u9009\u62E9\u6587\u672C\u540E\u53EF\u8FDB\u884CAI\u5206\u6790</div>
        </div>`;
    },
    render() {
      return `<div class="flex h-full bg-white overflow-hidden">
            <div class="w-72 shrink-0 bg-white border-r border-gray-200 flex flex-col">
                <div class="p-4 border-b border-gray-200">
                    <h2 class="text-base font-bold text-gray-800">\u9605\u8BFB\u4E2D\u5FC3</h2>
                </div>
                <div class="flex-1 overflow-y-auto">${this._renderSidebarContent()}</div>
            </div>
            <div class="flex-1 flex flex-col">${this._renderMainContent()}</div>
            ${this.currentTab === "library" ? this._renderAIPanel() : ""}
        </div>`;
    },
    async init() {
      const books = await DB.getAll("library_books");
      if (books && books.length > 0) {
        this.currentBook = books[0];
      }
    }
  };
  window.Modules = window.Modules || {};
  window.Modules.reader_center = readerCenterModule;
})();
