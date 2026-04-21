(() => {
  const novellaWriterModule = {
    _sessions: [],
    _currentSessionId: null,
    _messages: [],
    _outlines: [],
    _settings: {},
    _prompts: [],
    _selectedPromptId: null,
    _generating: false,
    _autoGenerating: false,
    _pauseRequested: false,
    _performance: {
      renderCount: 0,
      totalRenderTime: 0,
      lastRenderTime: 0,
      messageCount: 0,
      logPerformance(label, startTime) {
        const duration = performance.now() - startTime;
        if (duration > 16) {
          console.warn(`[\u6027\u80FD\u8B66\u544A] ${label} \u8017\u65F6 ${duration.toFixed(2)}ms`);
        }
      }
    },
    _chatMode: "creative",
    _chatRoles: [
      { id: "assistant", name: "\u667A\u80FD\u52A9\u624B", icon: "fa-robot", color: "text-blue-400", desc: "\u901A\u7528AI\u52A9\u624B" },
      { id: "writing_tutor", name: "\u5199\u4F5C\u5BFC\u5E08", icon: "fa-graduation-cap", color: "text-purple-400", desc: "\u4E13\u4E1A\u5199\u4F5C\u6307\u5BFC" },
      { id: "literary_critic", name: "\u6587\u5B66\u8BC4\u8BBA\u5BB6", icon: "fa-book", color: "text-pink-400", desc: "\u6DF1\u5EA6\u6587\u5B66\u5206\u6790" },
      { id: "editor", name: "\u8D23\u4EFB\u7F16\u8F91", icon: "fa-marker", color: "text-green-400", desc: "\u4E13\u4E1A\u7F16\u8F91\u89C6\u89D2" },
      { id: "plot_master", name: "\u60C5\u8282\u5927\u5E08", icon: "fa-sitemap", color: "text-amber-400", desc: "\u60C5\u8282\u8BBE\u8BA1\u4E13\u5BB6" },
      { id: "character_designer", name: "\u4EBA\u8BBE\u4E13\u5BB6", icon: "fa-user-pen", color: "text-cyan-400", desc: "\u4EBA\u7269\u5851\u9020\u4E13\u5BB6" },
      { id: "world_builder", name: "\u4E16\u754C\u89C2\u67B6\u6784\u5E08", icon: "fa-earth-americas", color: "text-indigo-400", desc: "\u4E16\u754C\u89C2\u6784\u5EFA" },
      { id: "dialogue_coach", name: "\u5BF9\u8BDD\u6559\u7EC3", icon: "fa-comments", color: "text-rose-400", desc: "\u5BF9\u8BDD\u6DA6\u8272\u4E13\u5BB6" }
    ],
    _currentChatRole: "assistant",
    _chatRolePrompts: {
      assistant: "\u4F60\u662F\u4E00\u4E2A\u53CB\u597D\u3001\u4E13\u4E1A\u7684AI\u52A9\u624B\uFF0C\u64C5\u957F\u56DE\u7B54\u5404\u7C7B\u95EE\u9898\u3002",
      writing_tutor: "\u4F60\u662F\u4E00\u4F4D\u8D44\u6DF1\u7684\u5199\u4F5C\u5BFC\u5E08\uFF0C\u62E5\u6709\u4E30\u5BCC\u7684\u5199\u4F5C\u6559\u5B66\u7ECF\u9A8C\u3002",
      literary_critic: "\u4F60\u662F\u4E00\u4F4D\u773C\u5149\u7280\u5229\u7684\u6587\u5B66\u8BC4\u8BBA\u5BB6\uFF0C\u64C5\u957F\u6DF1\u5EA6\u5206\u6790\u6587\u5B66\u4F5C\u54C1\u3002",
      editor: "\u4F60\u662F\u4E00\u4F4D\u7ECF\u9A8C\u4E30\u5BCC\u7684\u8D23\u4EFB\u7F16\u8F91\uFF0C\u4EE5\u4E13\u4E1A\u4E25\u8C28\u7684\u6001\u5EA6\u5BF9\u5F85\u6BCF\u4E00\u7BC7\u6587\u7A3F\u3002",
      plot_master: "\u4F60\u662F\u60C5\u8282\u8BBE\u8BA1\u4E13\u5BB6\uFF0C\u64C5\u957F\u60C5\u8282\u8BBE\u8BA1\u3001\u60AC\u5FF5\u5E03\u5C40\u3001\u8282\u594F\u63A7\u5236\u3002",
      character_designer: "\u4F60\u662F\u4EBA\u7269\u5851\u9020\u4E13\u5BB6\uFF0C\u64C5\u957F\u4EBA\u7269\u5851\u9020\u3001\u6027\u683C\u8BBE\u8BA1\u3001\u89D2\u8272\u5F27\u7EBF\u3002",
      world_builder: "\u4F60\u662F\u4E16\u754C\u89C2\u67B6\u6784\u5E08\uFF0C\u64C5\u957F\u4E16\u754C\u89C2\u6784\u5EFA\u3001\u8BBE\u5B9A\u5B8C\u5584\u3001\u4F53\u7CFB\u8BBE\u8BA1\u3002",
      dialogue_coach: "\u4F60\u662F\u5BF9\u8BDD\u6559\u7EC3\uFF0C\u64C5\u957F\u5BF9\u8BDD\u6DA6\u8272\u3001\u89D2\u8272\u58F0\u97F3\u3001\u6F5C\u53F0\u8BCD\u8BBE\u8BA1\u3002"
    },
    async newSession() {
      const session = {
        id: "session_" + Date.now(),
        title: "\u65B0\u5BF9\u8BDD",
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      this._sessions.push(session);
      this._currentSessionId = session.id;
      this._messages = [];
      await DB.put("novella_sessions", session);
      this.render();
    },
    switchRole(roleId) {
      this._currentChatRole = roleId;
      this.render();
    },
    _renderSidebar() {
      return `<div class="w-60 shrink-0 flex flex-col bg-white border-r border-gray-200">
            <div class="p-4 border-b border-gray-200">
                <button class="btn w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white" onclick="Modules.novella_writer.newSession()">
                    <i class="fa-solid fa-plus mr-2"></i>\u65B0\u5EFA\u5BF9\u8BDD
                </button>
            </div>
            <div class="flex-1 overflow-y-auto p-2">
                ${this._sessions.map((s) => `
                    <button class="w-full text-left px-3 py-2 rounded-lg text-sm ${this._currentSessionId === s.id ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"}" onclick="Modules.novella_writer.selectSession('${s.id}')">
                        ${s.title}
                    </button>
                `).join("")}
            </div>
        </div>`;
    },
    _renderChatArea() {
      return `<div class="flex-1 flex flex-col">
            <div class="flex-1 overflow-y-auto p-4" id="nw-messages">
                ${this._messages.map((m) => `
                    <div class="mb-4 ${m.role === "user" ? "text-right" : "text-left"}">
                        <div class="inline-block max-w-[80%] p-3 rounded-lg ${m.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100"}">
                            ${m.content}
                        </div>
                    </div>
                `).join("")}
            </div>
            <div class="p-4 border-t border-gray-200">
                <div class="flex gap-2">
                    <input class="flex-1 bg-gray-100 border border-gray-300 rounded-lg p-3" placeholder="\u8F93\u5165\u6D88\u606F..." id="nw-input">
                    <button class="btn btn-primary" onclick="Modules.novella_writer.sendMessage()">\u53D1\u9001</button>
                </div>
            </div>
        </div>`;
    },
    _renderRightPanel() {
      return `<div class="w-64 shrink-0 bg-gray-50 border-l border-gray-200 p-4">
            <h4 class="font-bold text-sm mb-4">\u89D2\u8272\u9009\u62E9</h4>
            <div class="space-y-2">
                ${this._chatRoles.map((r) => `
                    <button class="w-full text-left px-3 py-2 rounded-lg text-xs ${this._currentChatRole === r.id ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"}" onclick="Modules.novella_writer.switchRole('${r.id}')">
                        <i class="fa-solid ${r.icon} ${r.color} mr-2"></i>${r.name}
                    </button>
                `).join("")}
            </div>
        </div>`;
    },
    render() {
      return `<div class="flex h-full bg-white overflow-hidden">
            ${this._renderSidebar()}
            ${this._renderChatArea()}
            ${this._renderRightPanel()}
        </div>`;
    },
    async init() {
      const sessions = await DB.getAll("novella_sessions");
      if (sessions) this._sessions = sessions;
    }
  };
  window.Modules = window.Modules || {};
  window.Modules.novella_writer = novellaWriterModule;
})();
