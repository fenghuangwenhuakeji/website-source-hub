(() => {
  const RAGSystem = {
    _searchHistory: [],
    _documents: [],
    _docChunks: [],
    _entityCache: null,
    _relationIndex: {},
    _chapterEntityIndex: {},
    _lastIndexTime: 0,
    _SOURCES: {
      chapter: { label: "\u7AE0\u8282", icon: "fa-file-lines", color: "amber", weight: 1 },
      outline: { label: "\u5927\u7EB2", icon: "fa-list-ol", color: "yellow", weight: 0.95 },
      entity: { label: "\u5B9E\u4F53", icon: "fa-cube", color: "blue", weight: 0.9 },
      fusion_book: { label: "\u62C6\u4E66", icon: "fa-book-open-reader", color: "green", weight: 0.85 },
      pipeline: { label: "\u6D41\u6C34\u7EBF", icon: "fa-industry", color: "indigo", weight: 0.9 },
      memory: { label: "\u8BB0\u5FC6", icon: "fa-brain", color: "purple", weight: 0.8 },
      library: { label: "\u56FE\u4E66\u9986", icon: "fa-book", color: "orange", weight: 0.7 },
      vector: { label: "\u5411\u91CF", icon: "fa-database", color: "cyan", weight: 0.75 },
      document: { label: "\u6587\u6863", icon: "fa-file-alt", color: "teal", weight: 0.8 },
      knowledge: { label: "\u77E5\u8BC6\u56FE\u8C31", icon: "fa-project-diagram", color: "pink", weight: 0.95 },
      pattern: { label: "\u5199\u4F5C\u6A21\u5F0F", icon: "fa-wand-magic-sparkles", color: "rose", weight: 0.85 },
      world: { label: "\u4E16\u754C\u89C2", icon: "fa-globe", color: "emerald", weight: 0.9 }
    },
    async addDocument(title, content, source = "document", meta = {}) {
      if (!content || !content.trim()) return null;
      const id = "doc_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
      const doc = { id, title, content, source, ts: Date.now(), size: content.length, ...meta };
      this._documents.push(doc);
      if (this._documents.length > 200) this._documents = this._documents.slice(-150);
      const chunks = this._chunkText(content, 800, 100);
      for (let i = 0; i < chunks.length; i++) {
        this._docChunks.push({
          docId: id,
          title: title + (chunks.length > 1 ? `[${i + 1}/${chunks.length}]` : ""),
          content: chunks[i],
          source,
          ts: Date.now()
        });
      }
      if (this._docChunks.length > 1e3) this._docChunks = this._docChunks.slice(-800);
      try {
        await DB.put("rag_documents", doc);
      } catch (e) {
        try {
          await DB.put("vectors", { id, content: content.slice(0, 8e3), tags: [source, title], ts: Date.now() });
        } catch (e2) {
        }
      }
      return doc;
    },
    _chunkText(text, chunkSize = 800, overlap = 100) {
      if (!text || text.length <= chunkSize) return [text];
      const chunks = [];
      const paragraphs = text.split(/\n{2,}/);
      let current = "";
      for (const p of paragraphs) {
        if ((current + "\n\n" + p).length > chunkSize && current.length > 0) {
          chunks.push(current.trim());
          current = current.slice(-overlap) + "\n\n" + p;
        } else {
          current = current ? current + "\n\n" + p : p;
        }
      }
      if (current.trim()) chunks.push(current.trim());
      if (chunks.length <= 1 && text.length > chunkSize) {
        const hardChunks = [];
        for (let i = 0; i < text.length; i += chunkSize - overlap) {
          hardChunks.push(text.slice(i, i + chunkSize));
        }
        return hardChunks;
      }
      return chunks;
    },
    async search(query, options = {}) {
      const { maxResults = 10, sources, minScore = 0.1 } = options;
      const results = [];
      const queryLower = query.toLowerCase();
      const queryTerms = queryLower.split(/\s+/);
      const searchIn = (items) => {
        for (const item of items) {
          if (sources && !sources.includes(item.source)) continue;
          const contentLower = item.content.toLowerCase();
          const titleLower = item.title.toLowerCase();
          let score = 0;
          if (contentLower.includes(queryLower)) score += 0.5;
          if (titleLower.includes(queryLower)) score += 0.3;
          for (const term of queryTerms) {
            const termCount = (contentLower.match(new RegExp(term, "g")) || []).length;
            score += termCount * 0.05;
          }
          const sourceWeight = this._SOURCES[item.source]?.weight || 0.8;
          score *= sourceWeight;
          if (score >= minScore) {
            results.push({
              id: "id" in item ? item.id : item.docId,
              title: item.title,
              content: item.content.slice(0, 500),
              source: item.source,
              score
            });
          }
        }
      };
      searchIn(this._documents);
      searchIn(this._docChunks);
      return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
    },
    getContext(query, maxLen = 4e3) {
      const results = this.search(query, { maxResults: 20 });
      let context = "";
      for (const r of results) {
        const addition = `[${r.source}] ${r.title}
${r.content}

`;
        if (context.length + addition.length > maxLen) break;
        context += addition;
      }
      return context;
    },
    clearIndex() {
      this._documents = [];
      this._docChunks = [];
      this._entityCache = null;
      this._relationIndex = {};
      this._chapterEntityIndex = {};
    }
  };
  window.RAGSystem = RAGSystem;
})();
