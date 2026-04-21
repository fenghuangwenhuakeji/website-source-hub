(() => {
  const memorySystemUIModule = {
    activeTab: "dashboard",
    _pmFilter: "all",
    _pmSearch: "",
    tabs: [
      { id: "dashboard", icon: "fa-chart-pie", text: "\u603B\u89C8", color: "text-purple-400" },
      { id: "working", icon: "fa-bolt", text: "\u5DE5\u4F5C\u8BB0\u5FC6", color: "text-yellow-400" },
      { id: "session", icon: "fa-comments", text: "\u4F1A\u8BDD\u8BB0\u5FC6", color: "text-blue-400" },
      { id: "persistent", icon: "fa-database", text: "\u957F\u671F\u8BB0\u5FC6", color: "text-green-400" }
    ],
    switchTab(tabId) {
      this.activeTab = tabId;
      this.render();
    },
    aiCompress() {
      console.log("AI compressing working memory...");
    },
    _renderSidebar() {
      return `<div class="w-64 shrink-0 flex flex-col bg-[#F1F3F5] border-r border-gray-200">
            <div class="p-4 border-b border-gray-200">
                <div class="flex items-center gap-2">
                    <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex center text-white">
                        <i class="fa-solid fa-brain"></i>
                    </div>
                    <div>
                        <div class="font-bold text-gray-800">\u4E09\u5C42\u8BB0\u5FC6</div>
                        <div class="text-xs text-gray-600">\u5DE5\u4F5C \xB7 \u4F1A\u8BDD \xB7 \u957F\u671F</div>
                    </div>
                </div>
            </div>
            <div class="p-2 space-y-1">
                ${this.tabs.map((t) => `
                    <button class="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-sm font-bold transition-all ${this.activeTab === t.id ? "bg-gray-200 text-gray-800" : "text-gray-600 hover:bg-gray-100"}" onclick="Modules.memory_system.switchTab('${t.id}')">
                        <i class="fa-solid ${t.icon} ${t.color} w-5 text-center"></i>
                        <span>${t.text}</span>
                    </button>
                `).join("")}
            </div>
            <div class="mt-auto p-3 border-t border-gray-200">
                <button class="btn w-full bg-gradient-to-r from-purple-500 to-violet-500 text-white" onclick="Modules.memory_system.aiCompress()">
                    <i class="fa-solid fa-compress mr-2"></i>AI \u538B\u7F29\u5DE5\u4F5C\u8BB0\u5FC6
                </button>
            </div>
        </div>`;
    },
    _renderDashboard() {
      const workingCount = MemorySystem.working?.length || 0;
      return `<div class="p-6">
            <h3 class="font-bold text-lg mb-6">\u8BB0\u5FC6\u603B\u89C8</h3>
            <div class="grid grid-cols-3 gap-4">
                <div class="bg-white border border-gray-200 rounded-lg p-4 text-center">
                    <i class="fa-solid fa-bolt text-3xl text-yellow-400 mb-2"></i>
                    <div class="text-2xl font-bold">${workingCount}</div>
                    <div class="text-sm text-gray-600">\u5DE5\u4F5C\u8BB0\u5FC6</div>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4 text-center">
                    <i class="fa-solid fa-comments text-3xl text-blue-400 mb-2"></i>
                    <div class="text-2xl font-bold">0</div>
                    <div class="text-sm text-gray-600">\u4F1A\u8BDD\u8BB0\u5FC6</div>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4 text-center">
                    <i class="fa-solid fa-database text-3xl text-green-400 mb-2"></i>
                    <div class="text-2xl font-bold">0</div>
                    <div class="text-sm text-gray-600">\u957F\u671F\u8BB0\u5FC6</div>
                </div>
            </div>
        </div>`;
    },
    _renderWorkingMemory() {
      const items = MemorySystem.working || [];
      return `<div class="p-6">
            <h3 class="font-bold text-lg mb-4">\u5DE5\u4F5C\u8BB0\u5FC6 (${items.length})</h3>
            <div class="space-y-2">
                ${items.slice(0, 20).map((item) => `
                    <div class="bg-white border border-gray-200 rounded-lg p-3">
                        <div class="text-sm">${item.content?.slice(0, 100) || ""}</div>
                        <div class="text-xs text-gray-500 mt-1">${item.type} | \u4F18\u5148\u7EA7: ${item.priority}</div>
                    </div>
                `).join("")}
            </div>
        </div>`;
    },
    _renderContent() {
      switch (this.activeTab) {
        case "dashboard":
          return this._renderDashboard();
        case "working":
          return this._renderWorkingMemory();
        default:
          return `<div class="p-6 text-center text-gray-500">\u529F\u80FD\u5F00\u53D1\u4E2D...</div>`;
      }
    },
    render() {
      return `<div class="flex h-full bg-[#F8F9FA] overflow-hidden">
            ${this._renderSidebar()}
            <div class="flex-1 overflow-y-auto">${this._renderContent()}</div>
        </div>`;
    },
    init() {
      console.log("Memory system UI initialized");
    }
  };
  window.Modules = window.Modules || {};
  window.Modules.memory_system = memorySystemUIModule;
})();
