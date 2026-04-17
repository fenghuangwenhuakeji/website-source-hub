(() => {
  const settingsModule = {
    currentTab: "api",
    currentType: null,
    currentId: null,
    tabs: [
      { id: "api", icon: "fa-plug", text: "API \u914D\u7F6E" },
      { id: "appear", icon: "fa-palette", text: "\u5916\u89C2\u4E3B\u9898" },
      { id: "writing", icon: "fa-feather-pointed", text: "\u5199\u4F5C\u504F\u597D" },
      { id: "memory", icon: "fa-brain", text: "\u8BB0\u5FC6\u4E0E\u4E0A\u4E0B\u6587" },
      { id: "shortcut", icon: "fa-keyboard", text: "\u5FEB\u6377\u952E" },
      { id: "data", icon: "fa-database", text: "\u6570\u636E\u7BA1\u7406" },
      { id: "about", icon: "fa-circle-info", text: "\u5173\u4E8E" }
    ],
    switchTab(tabId) {
      this.currentTab = tabId;
      this.render();
    },
    _renderContent() {
      switch (this.currentTab) {
        case "api":
          return `<div class="space-y-4">
                    <h3 class="font-bold text-lg">API \u914D\u7F6E</h3>
                    <div class="bg-gray-100 rounded-lg p-4">
                        <label class="block text-sm font-bold mb-2">API Key</label>
                        <input type="password" class="w-full bg-white border border-gray-300 rounded p-2" placeholder="\u8F93\u5165\u60A8\u7684API\u5BC6\u94A5">
                    </div>
                    <div class="bg-gray-100 rounded-lg p-4">
                        <label class="block text-sm font-bold mb-2">\u6A21\u578B\u9009\u62E9</label>
                        <select class="w-full bg-white border border-gray-300 rounded p-2">
                            <option>GPT-4</option>
                            <option>GPT-3.5</option>
                            <option>Claude</option>
                        </select>
                    </div>
                </div>`;
        case "appear":
          return `<div class="space-y-4">
                    <h3 class="font-bold text-lg">\u5916\u89C2\u4E3B\u9898</h3>
                    <div class="grid grid-cols-3 gap-4">
                        <button class="p-4 rounded-lg border-2 border-gray-300 hover:border-blue-500">
                            <i class="fa-solid fa-sun text-2xl text-yellow-400"></i>
                            <p class="mt-2 text-sm">\u6D45\u8272</p>
                        </button>
                        <button class="p-4 rounded-lg border-2 border-gray-300 hover:border-blue-500">
                            <i class="fa-solid fa-moon text-2xl text-gray-600"></i>
                            <p class="mt-2 text-sm">\u6DF1\u8272</p>
                        </button>
                        <button class="p-4 rounded-lg border-2 border-gray-300 hover:border-blue-500">
                            <i class="fa-solid fa-circle-half-stroke text-2xl text-gray-400"></i>
                            <p class="mt-2 text-sm">\u81EA\u52A8</p>
                        </button>
                    </div>
                </div>`;
        default:
          return `<div class="text-dim">\u9009\u62E9\u4E00\u4E2A\u8BBE\u7F6E\u9879</div>`;
      }
    },
    _renderApiModal() {
      return `<div id="settings-api-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex center">
            <div class="bg-white rounded-xl w-[400px] p-6">
                <h3 class="font-bold text-lg mb-4">API \u914D\u7F6E</h3>
                <div class="space-y-4">
                    <input class="w-full bg-gray-100 border border-gray-300 rounded p-3" placeholder="API Key">
                </div>
                <div class="flex justify-end gap-2 mt-6">
                    <button class="btn hover:bg-gray-200" onclick="document.getElementById('settings-api-modal').classList.add('hidden')">\u53D6\u6D88</button>
                    <button class="btn btn-primary">\u4FDD\u5B58</button>
                </div>
            </div>
        </div>`;
    },
    render() {
      return `<div class="flex h-full bg-[#F8F9FA] overflow-hidden">
            <div class="w-56 shrink-0 flex flex-col bg-[#F1F3F5] border-r border-gray-200">
                <div class="p-4 border-b border-gray-200">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800 flex center text-white">
                            <i class="fa-solid fa-gear"></i>
                        </div>
                        <div>
                            <div class="font-bold text-gray-800 text-sm">\u7CFB\u7EDF\u8BBE\u7F6E</div>
                            <div class="text-[10px] text-gray-600">v2.0 Genesis</div>
                        </div>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto p-2 space-y-0.5">
                    ${this.tabs.map((tb) => `
                        <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all ${this.currentTab === tb.id ? "bg-gray-200 text-gray-800" : "text-gray-600 hover:bg-gray-100"}" onclick="Modules.settings.switchTab('${tb.id}')">
                            <i class="fa-solid ${tb.icon} w-4 text-center"></i>
                            <span>${tb.text}</span>
                        </button>
                    `).join("")}
                </div>
            </div>
            <div class="flex-1 overflow-y-auto p-6">${this._renderContent()}</div>
        </div>${this._renderApiModal()}`;
    },
    init() {
      console.log("Settings module initialized");
    }
  };
  window.Modules = window.Modules || {};
  window.Modules.settings = settingsModule;
})();
