(() => {
  const App = {
    sidebarCollapsed: false,
    _ioCollapsed: false,
    _stopFlag: false,
    _dbReady: false,
    _currentModule: null,
    init: async () => {
      try {
        const db = await DB.init();
        if (db) {
          App._dbReady = true;
          console.log("\u2713 \u6570\u636E\u5E93\u521D\u59CB\u5316\u5B8C\u6210");
        } else {
          console.error("\u6570\u636E\u5E93\u521D\u59CB\u5316\u8FD4\u56DE null");
          UI.toast("\u6570\u636E\u5E93\u521D\u59CB\u5316\u5931\u8D25\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u91CD\u8BD5", "error");
          return;
        }
      } catch (e) {
        console.error("\u6570\u636E\u5E93\u521D\u59CB\u5316\u5931\u8D25:", e);
        UI.toast("\u6570\u636E\u5E93\u521D\u59CB\u5316\u5931\u8D25\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u91CD\u8BD5", "error");
        return;
      }
      App.nav("home");
    },
    isDbReady: () => App._dbReady,
    toggleSidebar: () => {
      App.sidebarCollapsed = !App.sidebarCollapsed;
      const sb = document.querySelector(".sidebar");
      const icon = document.getElementById("sidebar-toggle-icon");
      if (sb) sb.classList.toggle("collapsed", App.sidebarCollapsed);
      if (icon) icon.className = App.sidebarCollapsed ? "fa-solid fa-angles-right" : "fa-solid fa-angles-left";
      setTimeout(() => window.dispatchEvent(new Event("resize")), 300);
    },
    toggleMobileMenu: () => {
      document.querySelector(".sidebar")?.classList.toggle("open");
      document.getElementById("mobile-overlay")?.classList.toggle("active");
    },
    closeMobileMenu: () => {
      document.querySelector(".sidebar")?.classList.remove("open");
      document.getElementById("mobile-overlay")?.classList.remove("active");
    },
    toggleIO() {
      App._ioCollapsed = !App._ioCollapsed;
      const content = document.getElementById("io-content");
      const icon = document.getElementById("io-toggle-icon");
      if (content) content.style.display = App._ioCollapsed ? "none" : "block";
      if (icon) icon.className = App._ioCollapsed ? "fa-solid fa-chevron-down text-dim text-xs" : "fa-solid fa-chevron-up text-dim text-xs";
    },
    showProgress(label, current = 0, total = 0, showStop = true) {
      const section = document.getElementById("io-progress-section");
      const labelEl = document.getElementById("io-progress-label");
      const percentEl = document.getElementById("io-progress-percent");
      const barEl = document.getElementById("io-progress-bar");
      const currentEl = document.getElementById("io-progress-current");
      const stopBtn = document.getElementById("io-stop-btn");
      const indicator = document.getElementById("io-status-indicator");
      if (section) section.classList.remove("hidden");
      if (labelEl) labelEl.textContent = label;
      const percent = total > 0 ? Math.round(current / total * 100) : 0;
      if (percentEl) percentEl.textContent = percent + "%";
      if (barEl) barEl.style.width = percent + "%";
      if (currentEl) currentEl.textContent = total > 0 ? `${current} / ${total}` : "";
      if (stopBtn) stopBtn.classList.toggle("hidden", !showStop);
      if (indicator) {
        indicator.className = "w-2 h-2 rounded-full bg-green-400 animate-pulse";
      }
      App._stopFlag = false;
    },
    hideProgress() {
      const section = document.getElementById("io-progress-section");
      const indicator = document.getElementById("io-status-indicator");
      if (section) section.classList.add("hidden");
      if (indicator) indicator.className = "w-2 h-2 rounded-full bg-dim";
    },
    logIO(message, type = "info") {
      const logEl = document.getElementById("io-log");
      if (!logEl) return;
      const colors = {
        info: "text-gray-400",
        success: "text-green-400",
        error: "text-red-400",
        warning: "text-amber-400",
        input: "text-blue-400",
        output: "text-cyan-400"
      };
      const time = (/* @__PURE__ */ new Date()).toLocaleTimeString();
      const line = document.createElement("div");
      line.className = colors[type] || "text-gray-400";
      line.innerHTML = `<span class="text-gray-800/30">[${time}]</span> ${message}`;
      if (logEl.children.length === 1 && logEl.children[0].textContent === "\u7B49\u5F85\u64CD\u4F5C...") {
        logEl.innerHTML = "";
      }
      logEl.appendChild(line);
      logEl.scrollTop = logEl.scrollHeight;
    },
    clearIOLog() {
      const logEl = document.getElementById("io-log");
      if (logEl) logEl.innerHTML = '<div class="text-dim">\u7B49\u5F85\u64CD\u4F5C...</div>';
    },
    stopOperation() {
      App._stopFlag = true;
      App.logIO("\u7528\u6237\u8BF7\u6C42\u505C\u6B62\u64CD\u4F5C...", "warning");
      const stopBtn = document.getElementById("io-stop-btn");
      if (stopBtn) {
        stopBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>\u505C\u6B62\u4E2D...';
        stopBtn.disabled = true;
      }
    },
    isStopped() {
      return App._stopFlag;
    },
    resetStop() {
      App._stopFlag = false;
      const stopBtn = document.getElementById("io-stop-btn");
      if (stopBtn) {
        stopBtn.innerHTML = '<i class="fa-solid fa-stop mr-1"></i>\u505C\u6B62';
        stopBtn.disabled = false;
      }
    },
    getTitleMap: () => {
      const baseTitleMap = {
        home: "\u521B\u4E16\u4E2D\u5FC3",
        reader_center: "\u9605\u8BFB\u4E2D\u5FC3",
        settings: "\u7CFB\u7EDF\u8BBE\u7F6E",
        novella_writer: "\u4E2D\u7BC7\u521B\u4F5C",
        rag_context: "RAG \u4E0A\u4E0B\u6587",
        memory_system: "\u4E09\u5C42\u8BB0\u5FC6"
      };
      if (typeof AgentConfigs !== "undefined") {
        const agents = AgentConfigs.getAllAgents();
        agents.forEach((agent) => {
          baseTitleMap[agent.id] = agent.name;
        });
      }
      return baseTitleMap;
    },
    nav: (mod) => {
      App._currentModule = mod;
      App.closeMobileMenu();
      document.querySelectorAll(".sidebar-item").forEach((e) => e.classList.remove("active"));
      const el = document.querySelector(`.sidebar-item[onclick="App.nav('${mod}')"]`);
      if (el) el.classList.add("active");
      const titleMap = App.getTitleMap();
      const mt = document.getElementById("mobile-title");
      if (mt) mt.textContent = titleMap[mod] || mod;
      const vp = document.getElementById("viewport");
      Array.from(vp?.children || []).forEach((child) => {
        child.style.display = "none";
      });
      let view = document.getElementById(`module-view-${mod}`);
      if (!view) {
        view = document.createElement("div");
        view.id = `module-view-${mod}`;
        view.className = "w-full h-full animate-fade-in";
        view.innerHTML = Modules[mod] ? Modules[mod].render() : `<div class="flex center h-full text-dim font-mono text-lg animate-pulse">Module [${mod}] Initializing...</div>`;
        vp?.appendChild(view);
        if (Modules[mod] && Modules[mod].init) {
          try {
            Modules[mod].init();
          } catch (e) {
            console.error(`Error initializing module ${mod}:`, e);
          }
        }
      }
      view.style.display = "block";
      setTimeout(() => window.dispatchEvent(new Event("resize")), 50);
    },

    /**
     * ═══════════════════════════════════════════════════════════════
     * 创作Agent智能调用接口
     * ═══════════════════════════════════════════════════════════════
     * 通过关键词自动匹配并调用对应的创作Agent
     */
    
    /**
     * 智能创作助手 - 分析用户需求并调用合适的Agent
     * @param {string} input - 用户的创作需求描述
     * @param {Object} options - 可选配置
     * @returns {Promise<Object>} - 调用结果
     * 
     * 使用示例：
     *   App.creativeAssist("帮我写小说大纲")
     *   App.creativeAssist("设计一个都市异能主角", { showUI: true })
     *   App.creativeAssist("润色这段对话", { agent: 'dialogue-polish-agent' })
     */
    creativeAssist: async (input, options = {}) => {
      if (!window.CreativeAgentRouter) {
        UI.toast('创作Agent路由系统未加载', 'error');
        return { success: false, error: 'CreativeAgentRouter not loaded' };
      }

      const { agent: preferredAgent, showUI = true, context = {} } = options;

      // 显示处理中状态
      if (showUI) {
        App.showProgress('正在分析创作需求...', 0, 100, false);
      }

      try {
        // 调用Agent路由系统
        const result = await CreativeAgentRouter.invoke(input, preferredAgent);

        if (showUI) {
          App.hideProgress();
        }

        if (result.success) {
          // 触发对应Agent的UI界面
          const agentId = result.agentName.replace(/-agent$/, '').replace(/-/g, '_');
          
          // 检查是否有对应的Agent配置
          if (typeof AgentConfigs !== 'undefined' && AgentConfigs.getAgent(agentId)) {
            // 导航到对应Agent界面
            App.nav(agentId);
            
            // 如果有上下文，填充到输入框
            if (context.prefill) {
              setTimeout(() => {
                const inputEl = document.querySelector(`#module-view-${agentId} textarea, #module-view-${agentId} input[type="text"]`);
                if (inputEl) {
                  inputEl.value = context.prefill;
                  inputEl.dispatchEvent(new Event('input'));
                }
              }, 300);
            }
          }

          if (showUI) {
            UI.toast(`🎨 已启动 ${result.description}`, 'success');
          }
        } else {
          if (showUI) {
            UI.toast(result.error || '无法识别创作需求', 'warning');
          }
        }

        return result;
      } catch (error) {
        if (showUI) {
          App.hideProgress();
          UI.toast('创作助手调用失败', 'error');
        }
        console.error('[creativeAssist] Error:', error);
        return { success: false, error: error.message };
      }
    },

    /**
     * 快速调用指定Agent
     * @param {string} agentName - Agent名称 (如: 'outline-agent')
     * @param {string} input - 用户输入
     * @param {Object} options - 可选配置
     */
    invokeAgent: async (agentName, input, options = {}) => {
      return App.creativeAssist(input, { ...options, agent: agentName });
    },

    /**
     * 获取创作建议
     * @param {string} input - 用户输入
     * @returns {Array} - 建议列表
     */
    getCreativeSuggestions: (input) => {
      if (!window.CreativeAgentRouter) return [];
      return CreativeAgentRouter.getSuggestions(input);
    },

    /**
     * 显示Agent选择器
     * 用于当系统无法确定最佳Agent时，让用户选择
     */
    showAgentSelector: (matches) => {
      if (!matches || matches.length === 0) return;

      const suggestions = matches.map(m => `
        <div class="agent-suggestion-item" onclick="App.selectAgent('${m.agent}')" style="
          padding: 12px;
          margin: 8px 0;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        " onmouseover="this.style.background='rgba(99, 102, 241, 0.2)'" onmouseout="this.style.background='rgba(99, 102, 241, 0.1)'">
          <div style="font-weight: 600; color: #6366F1;">${m.config.description}</div>
          <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">
            匹配: ${m.matchedKeywords.join(', ')}
          </div>
        </div>
      `).join('');

      // 使用toast或modal显示选择器
      UI.toast(`找到 ${matches.length} 个相关Agent，请查看控制台选择`, 'info');
      console.log('[AgentSelector] 可选Agent:', matches);
    },

    /**
     * 选择并调用指定Agent
     * @param {string} agentName - Agent名称
     */
    selectAgent: (agentName) => {
      const input = document.querySelector('.creative-input')?.value || '';
      App.invokeAgent(agentName, input);
    }
  };
  window.App = App;
  window.onload = App.init;
})();
