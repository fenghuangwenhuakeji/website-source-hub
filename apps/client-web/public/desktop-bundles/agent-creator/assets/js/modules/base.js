(() => {
  const homeModule = {
    render: () => {
      const coreItems = [
        { id: "novella_writer", icon: "fa-pen-nib", title: "\u4E2D\u7BC7\u521B\u4F5C", sub: "\u4E2D\u7BC7\u5C0F\u8BF4\u521B\u4F5C\u7CFB\u7EDF", color: "indigo-500" },
        { id: "rag_context", icon: "fa-magnifying-glass-chart", title: "RAG \u4E0A\u4E0B\u6587", sub: "\u6587\u6863\u7D22\u5F15\u4E0E\u8BED\u4E49\u68C0\u7D22", color: "teal-500" },
        { id: "memory_system", icon: "fa-brain", title: "\u4E09\u5C42\u8BB0\u5FC6", sub: "\u77ED\u671F\xB7\u957F\u671F\xB7\u6C38\u4E45\u8BB0\u5FC6", color: "rose-500" },
        { id: "reader_center", icon: "fa-book-open", title: "\u9605\u8BFB\u4E2D\u5FC3", sub: "\u6C89\u6D78\u9605\u8BFB\u4E0E\u667A\u80FD\u6392\u7248", color: "amber-500" },
        { id: "settings", icon: "fa-gear", title: "\u7CFB\u7EDF\u8BBE\u7F6E", sub: "API\u914D\u7F6E\u4E0E\u6570\u636E\u7BA1\u7406", color: "gray-500" }
      ];
      const getAgentsFromConfig = (categoryKey) => {
        if (typeof AgentConfigs === "undefined") return [];
        return AgentConfigs.getAgentsByCategory(categoryKey).map((agent) => ({
          id: agent.id,
          icon: agent.icon,
          title: agent.name,
          sub: agent.description,
          color: agent.color,
          agentName: agent.agentName
        }));
      };
      const narrativeAgents = getAgentsFromConfig("narrative");
      const characterAgents = getAgentsFromConfig("character");
      const worldAgents = getAgentsFromConfig("world");
      const creativeAgents = getAgentsFromConfig("creative");
      const scriptAgents = getAgentsFromConfig("script");
      const audioAgents = getAgentsFromConfig("audio");
      const visualAgents = getAgentsFromConfig("visual");
      const renderGrid = (items) => {
        return items.map((item) => `
                <div class="agent-card group" onclick="App.nav('${item.id}')">
                    <div class="agent-card-inner">
                        <div class="agent-icon-wrapper" style="--card-color: var(--${item.color})">
                            <i class="fa-solid ${item.icon}"></i>
                            <div class="agent-icon-glow"></div>
                        </div>
                        <div class="agent-content">
                            <h4 class="agent-title">${item.title}</h4>
                            <p class="agent-subtitle">${item.sub}</p>
                        </div>
                        <div class="agent-arrow">
                            <i class="fa-solid fa-chevron-right"></i>
                        </div>
                    </div>
                    <div class="agent-card-border"></div>
                </div>
            `).join("");
      };
      const renderSection = (title, items, icon) => {
        if (items.length === 0) return "";
        return `
                <div class="agent-section">
                    <div class="section-header">
                        <div class="section-icon">
                            <i class="fa-solid ${icon}"></i>
                        </div>
                        <h3 class="section-title">${title}</h3>
                        <div class="section-line"></div>
                        <span class="section-count">${items.length}</span>
                    </div>
                    <div class="agent-grid">${renderGrid(items)}</div>
                </div>
            `;
      };
      const getCategoryIcon = (categoryKey) => {
        const icons = {
          narrative: "fa-book",
          character: "fa-users",
          world: "fa-globe",
          creative: "fa-lightbulb",
          script: "fa-clapperboard",
          audio: "fa-music",
          visual: "fa-images"
        };
        return icons[categoryKey] || "fa-folder";
      };
      const renderAgentSections = () => {
        if (typeof AgentConfigs === "undefined") return "";
        const categoryOrder = ["narrative", "character", "world", "creative", "script", "audio", "visual"];
        const categoryNames = {
          narrative: "\u53D9\u4E8B\u7ED3\u6784",
          character: "\u89D2\u8272\u7CFB\u7EDF",
          world: "\u4E16\u754C\u89C2\u4E0E\u51B2\u7A81",
          creative: "\u521B\u610F\u5DE5\u5177",
          script: "\u5267\u672C\u521B\u4F5C",
          audio: "\u97F3\u9891\u521B\u4F5C",
          visual: "\u89C6\u89C9\u521B\u4F5C"
        };
        return categoryOrder.map((cat) => {
          const agents = getAgentsFromConfig(cat);
          return renderSection(categoryNames[cat], agents, getCategoryIcon(cat));
        }).join("");
      };
      return `
        <div class="home-container">
            <!-- \u52A8\u6001\u80CC\u666F -->
            <div class="home-bg">
                <div class="bg-gradient-orb orb-1"></div>
                <div class="bg-gradient-orb orb-2"></div>
                <div class="bg-gradient-orb orb-3"></div>
                <div class="bg-grid"></div>
            </div>
            
            <!-- \u5934\u90E8\u533A\u57DF -->
            <header class="home-header">
                <div class="header-content">
                    <div class="logo-section">
                        <div class="logo-wrapper">
                            <img src="assets/images/phoenix.png" class="logo-img" alt="\u521B\u4E16\u65D7\u8230\u7248">
                            <div class="logo-glow"></div>
                        </div>
                        <div class="title-section">
                            <h1 class="main-title">
                                <span class="title-gradient">\u521B\u4E16\u65D7\u8230\u7248</span>
                                <span class="version-badge">2.0</span>
                            </h1>
                            <p class="subtitle">
                                <span class="subtitle-highlight">Genesis Archon Ultimate</span>
                                <span class="subtitle-divider">\xB7</span>
                                <span>AI\u5199\u4F5CAgent\u96C6\u7FA4</span>
                            </p>
                        </div>
                    </div>
                    <div class="header-stats">
                        <div class="stat-item">
                            <span class="stat-number">${typeof AgentConfigs !== "undefined" ? AgentConfigs.getAllAgents().length : 39}</span>
                            <span class="stat-label">\u5199\u4F5CAgent</span>
                        </div>
                        <div class="stat-divider"></div>
                        <div class="stat-item">
                            <span class="stat-number">${typeof AgentConfigs !== "undefined" ? Object.keys(AgentConfigs.categories).length : 8}</span>
                            <span class="stat-label">\u529F\u80FD\u5206\u7C7B</span>
                        </div>
                    </div>
                </div>
            </header>
            
            <!-- \u4E3B\u5185\u5BB9\u533A\u57DF -->
            <main class="home-main">
                <div class="main-content">
                    ${renderSection("\u6838\u5FC3\u529F\u80FD", coreItems, "fa-star")}
                    ${renderAgentSections()}
                </div>
            </main>
            
            <!-- \u5E95\u90E8\u88C5\u9970 -->
            <footer class="home-footer">
                <div class="footer-line"></div>
                <p class="footer-text">Powered by AI Agent Ecosystem</p>
            </footer>
        </div>`;
    }
  };
  const Modules = {
    home: homeModule
  };
  window.Modules = Modules;
})();
