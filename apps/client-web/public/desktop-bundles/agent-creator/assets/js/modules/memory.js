(() => {
  const MemorySystem = {
    working: [],
    maxWorking: 80,
    _decayInterval: null,
    _moduleChannels: {},
    addWorking(content, type = "conversation", priority = 3, meta = {}) {
      const item = {
        id: "wm_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        content,
        type,
        priority,
        ts: Date.now(),
        accessCount: 0,
        tags: meta.tags || [],
        source: meta.source || "",
        linkedTo: meta.linkedTo || null,
        module: meta.module || "",
        chapterId: meta.chapterId || null
      };
      this.working.push(item);
      if (this.working.length > this.maxWorking) this._compressWorking();
      if (item.module) {
        if (!this._moduleChannels[item.module]) this._moduleChannels[item.module] = [];
        this._moduleChannels[item.module].push(item);
        if (this._moduleChannels[item.module].length > 30) {
          this._moduleChannels[item.module] = this._moduleChannels[item.module].slice(-20);
        }
      }
      return item;
    },
    getWorkingContext(maxItems = 20) {
      return this.working.sort((a, b) => b.priority + b.accessCount * 0.2 - (a.priority + a.accessCount * 0.2)).slice(0, maxItems).map((m) => m.content).join("\n---\n");
    },
    getModuleContext(moduleName, maxItems = 10) {
      const channel = this._moduleChannels[moduleName] || [];
      if (channel.length > 0) {
        return channel.slice(-maxItems).map((m) => m.content).join("\n---\n");
      }
      return this.working.filter((m) => m.module === moduleName || m.type === moduleName).slice(-maxItems).map((m) => m.content).join("\n---\n");
    },
    getWorkingByType(type) {
      return this.working.filter((m) => m.type === type);
    },
    touchWorking(id) {
      const m = this.working.find((x) => x.id === id);
      if (m) {
        m.accessCount++;
        m.lastAccess = Date.now();
      }
    },
    removeWorking(id) {
      this.working = this.working.filter((m) => m.id !== id);
    },
    clearWorking() {
      this.working = [];
      this._moduleChannels = {};
    },
    _compressWorking() {
      this.working.sort((a, b) => b.priority + b.accessCount * 0.1 - (a.priority + a.accessCount * 0.1));
      const keep = Math.floor(this.maxWorking * 0.6);
      const removed = this.working.splice(keep);
      if (removed.length > 0) {
        const summary = removed.map((m) => m.content.slice(0, 80)).join("; ");
        this.addSession("auto_compress", "[\u81EA\u52A8\u538B\u7F29] " + summary, ["auto", "compress"]);
      }
    },
    async addSession(type, content, tags = []) {
      const item = {
        id: "sm_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        type,
        content,
        tags,
        ts: Date.now(),
        importance: 3
      };
      try {
        await DB.put("memory_sessions", item);
        return item;
      } catch (e) {
        console.error("Failed to save session memory:", e);
        return null;
      }
    },
    async getSessionContext(maxItems = 30) {
      try {
        const sessions = await DB.getAll("memory_sessions") || [];
        return sessions.sort((a, b) => b.ts - a.ts).slice(0, maxItems).map((s) => `[${s.type}] ${s.content}`).join("\n---\n");
      } catch {
        return "";
      }
    },
    async addLongTerm(content, category = "general", tags = [], importance = 3) {
      const item = {
        id: "lm_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        content,
        category,
        tags,
        ts: Date.now(),
        accessCount: 0,
        importance
      };
      try {
        await DB.put("memory_longterm", item);
        return item;
      } catch (e) {
        console.error("Failed to save long-term memory:", e);
        return null;
      }
    },
    async getLongTermContext(category, maxItems = 20) {
      try {
        let memories = await DB.getAll("memory_longterm") || [];
        if (category) {
          memories = memories.filter((m) => m.category === category);
        }
        return memories.sort((a, b) => b.importance + b.accessCount * 0.1 - (a.importance + a.accessCount * 0.1)).slice(0, maxItems).map((m) => `[${m.category}] ${m.content}`).join("\n---\n");
      } catch {
        return "";
      }
    },
    async getFullContext(maxWorking = 15, maxSession = 10, maxLongTerm = 5) {
      const workingCtx = this.getWorkingContext(maxWorking);
      const sessionCtx = await this.getSessionContext(maxSession);
      const longTermCtx = await this.getLongTermContext(void 0, maxLongTerm);
      let full = "";
      if (workingCtx) full += "\u3010\u5DE5\u4F5C\u8BB0\u5FC6\u3011\n" + workingCtx + "\n\n";
      if (sessionCtx) full += "\u3010\u4F1A\u8BDD\u8BB0\u5FC6\u3011\n" + sessionCtx + "\n\n";
      if (longTermCtx) full += "\u3010\u957F\u671F\u8BB0\u5FC6\u3011\n" + longTermCtx;
      return full;
    }
  };
  window.MemorySystem = MemorySystem;
})();
