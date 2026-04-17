/**
 * ═══════════════════════════════════════════════════════════════
 * 智能助手UI组件 - Smart Assistant UI
 * ═══════════════════════════════════════════════════════════════
 * 
 * 为每个模块提供智能推荐、快捷操作、上下文感知
 */

(() => {
  const SmartAssistantUI = {
    // 当前显示的推荐
    currentRecommendations: [],
    
    /**
     * 渲染智能助手面板
     */
    render(containerId = 'smart-assistant-container') {
      const container = document.getElementById(containerId);
      if (!container) return '';

      const recommendations = this.generateSmartSuggestions();
      
      return `
        <div class="smart-assistant-panel">
          ${this.renderHeader()}
          ${recommendations.length > 0 ? this.renderRecommendations(recommendations) : ''}
          ${this.renderQuickActions()}
          ${this.renderContextAware()}
        </div>
      `;
    },

    /**
     * 渲染头部
     */
    renderHeader() {
      return `
        <div class="sa-header">
          <div class="sa-avatar">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            <div class="sa-avatar-pulse"></div>
          </div>
          <div class="sa-title">
            <span class="sa-title-main">智能助手</span>
            <span class="sa-title-sub">AI Assistant</span>
          </div>
          <button class="sa-settings-btn" onclick="SmartAssistantUI.toggleSettings()">
            <i class="fa-solid fa-sliders"></i>
          </button>
        </div>
      `;
    },

    /**
     * 渲染推荐
     */
    renderRecommendations(recommendations) {
      return `
        <div class="sa-section">
          <div class="sa-section-title">
            <i class="fa-solid fa-lightbulb"></i>
            <span>智能推荐</span>
          </div>
          <div class="sa-recommendations">
            ${recommendations.map(rec => this.renderRecommendationCard(rec)).join('')}
          </div>
        </div>
      `;
    },

    /**
     * 渲染推荐卡片
     */
    renderRecommendationCard(rec) {
      const priorityClass = rec.priority === 'high' ? 'sa-priority-high' : 'sa-priority-normal';
      
      return `
        <div class="sa-rec-card ${priorityClass}" onclick="SmartAssistantUI.executeRecommendation('${rec.id}')">
          <div class="sa-rec-icon">
            <i class="fa-solid ${rec.icon || 'fa-star'}"></i>
          </div>
          <div class="sa-rec-content">
            <div class="sa-rec-title">${rec.title}</div>
            <div class="sa-rec-desc">${rec.description}</div>
          </div>
          <div class="sa-rec-arrow">
            <i class="fa-solid fa-chevron-right"></i>
          </div>
        </div>
      `;
    },

    /**
     * 渲染快捷操作
     */
    renderQuickActions() {
      const actions = this.getContextualActions();
      
      return `
        <div class="sa-section">
          <div class="sa-section-title">
            <i class="fa-solid fa-bolt"></i>
            <span>快捷操作</span>
          </div>
          <div class="sa-quick-actions">
            ${actions.map(action => `
              <button class="sa-action-btn" onclick="SmartAssistantUI.executeAction('${action.id}')">
                <i class="fa-solid ${action.icon}"></i>
                <span>${action.label}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    },

    /**
     * 渲染上下文感知
     */
    renderContextAware() {
      const context = this.getCurrentContext();
      
      return `
        <div class="sa-section sa-context-section">
          <div class="sa-section-title">
            <i class="fa-solid fa-brain"></i>
            <span>当前状态</span>
          </div>
          <div class="sa-context-info">
            ${context.hasContent ? `
              <div class="sa-context-item">
                <i class="fa-solid fa-file-lines"></i>
                <span>已输入 ${context.wordCount} 字</span>
              </div>
            ` : ''}
            ${context.module ? `
              <div class="sa-context-item">
                <i class="fa-solid fa-location-dot"></i>
                <span>${this.getModuleName(context.module)}</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    },

    /**
     * 生成智能建议
     */
    generateSmartSuggestions() {
      const suggestions = [];
      const context = this.getCurrentContext();
      
      // 基于上下文的智能建议
      if (!context.hasContent && context.module === 'novella_writer') {
        suggestions.push({
          id: 'start_with_outline',
          title: '从大纲开始',
          description: '智能生成故事大纲，让创作更有条理',
          icon: 'fa-list-ol',
          priority: 'high',
          action: () => App.creativeAssist('生成故事大纲')
        });
      }

      if (context.wordCount > 500 && !context.hasOutline) {
        suggestions.push({
          id: 'generate_outline_from_content',
          title: '从内容生成大纲',
          description: '基于已写内容智能提取大纲结构',
          icon: 'fa-sitemap',
          priority: 'high',
          action: () => App.creativeAssist('根据已有内容生成大纲')
        });
      }

      if (context.wordCount > 1000) {
        suggestions.push({
          id: 'smart_polish',
          title: '智能润色',
          description: '优化表达，去除AI痕迹',
          icon: 'fa-sparkles',
          priority: 'normal',
          action: () => App.creativeAssist('润色当前内容')
        });
      }

      // 基于模块的建议
      const moduleSuggestions = this.getModuleSpecificSuggestions(context.module);
      suggestions.push(...moduleSuggestions);

      return suggestions.slice(0, 3);
    },

    /**
     * 获取模块特定建议
     */
    getModuleSpecificSuggestions(module) {
      const suggestions = {
        novella_writer: [
          {
            id: 'continue_writing',
            title: '续写内容',
            description: 'AI根据上下文智能续写',
            icon: 'fa-pen-fancy',
            priority: 'normal',
            action: () => App.creativeAssist('继续写下去')
          }
        ],
        outline_agent: [
          {
            id: 'expand_chapter',
            title: '扩写章节',
            description: '将大纲章节扩展为详细内容',
            icon: 'fa-expand',
            priority: 'normal',
            action: () => App.creativeAssist('扩写当前章节')
          }
        ],
        character_design_agent: [
          {
            id: 'design_arc',
            title: '设计角色弧线',
            description: '规划角色的成长轨迹',
            icon: 'fa-chart-line',
            priority: 'normal',
            action: () => App.creativeAssist('设计角色成长弧线')
          }
        ]
      };

      return suggestions[module] || [];
    },

    /**
     * 获取上下文操作
     */
    getContextualActions() {
      const context = this.getCurrentContext();
      const actions = [];

      // 通用操作
      actions.push(
        { id: 'brainstorm', label: '灵感', icon: 'fa-lightbulb' },
        { id: 'polish', label: '润色', icon: 'fa-wand-magic-sparkles' },
        { id: 'expand', label: '扩写', icon: 'fa-expand' },
        { id: 'summarize', label: '总结', icon: 'fa-compress' }
      );

      // 根据内容长度添加
      if (context.wordCount > 100) {
        actions.push({ id: 'analyze', label: '分析', icon: 'fa-magnifying-glass-chart' });
      }

      return actions;
    },

    /**
     * 获取当前上下文
     */
    getCurrentContext() {
      const content = this.getCurrentContent();
      return {
        module: window.App?._currentModule,
        hasContent: !!content && content.length > 0,
        wordCount: content ? content.length : 0,
        content: content
      };
    },

    /**
     * 获取当前内容
     */
    getCurrentContent() {
      const editor = document.querySelector('textarea, .editor, [contenteditable="true"]');
      if (editor) {
        return editor.value || editor.textContent || '';
      }
      return '';
    },

    /**
     * 获取模块名称
     */
    getModuleName(module) {
      const names = {
        novella_writer: '中篇创作',
        outline_agent: '大纲生成',
        narrative_engine: '叙事引擎',
        character_design_agent: '角色设计',
        worldbuilding_agent: '世界观',
        polish_agent: '文本润色',
        script_creator_agent: '剧本创作',
        storyboard_agent: '分镜设计',
        comic_creator_agent: '漫画创作',
        suno_music_agent: 'AI音乐'
      };
      return names[module] || module;
    },

    /**
     * 执行推荐
     */
    executeRecommendation(id) {
      const suggestions = this.generateSmartSuggestions();
      const suggestion = suggestions.find(s => s.id === id);
      if (suggestion && suggestion.action) {
        suggestion.action();
      }
    },

    /**
     * 执行快捷操作
     */
    executeAction(actionId) {
      const content = this.getCurrentContent();
      
      const actions = {
        brainstorm: () => App.creativeAssist('给我一些灵感'),
        polish: () => App.creativeAssist('润色这段内容: ' + content.substring(0, 200)),
        expand: () => App.creativeAssist('扩写这段内容: ' + content.substring(0, 200)),
        summarize: () => App.creativeAssist('总结这段内容'),
        analyze: () => App.creativeAssist('分析这段内容的优缺点')
      };

      if (actions[actionId]) {
        actions[actionId]();
      }
    },

    /**
     * 切换设置
     */
    toggleSettings() {
      // 可以扩展为显示设置面板
      console.log('[SmartAssistant] 打开设置');
    },

    /**
     * 初始化
     */
    init() {
      // 监听内容变化
      this.setupContentWatcher();
      
      // 定期更新推荐
      setInterval(() => {
        this.updateRecommendations();
      }, 5000);

      console.log('[SmartAssistantUI] 智能助手UI已初始化 ✓');
    },

    /**
     * 设置内容监听器
     */
    setupContentWatcher() {
      document.addEventListener('input', (e) => {
        if (e.target.matches('textarea, .editor, [contenteditable="true"]')) {
          this.debouncedUpdate();
        }
      });
    },

    /**
     * 防抖更新
     */
    debouncedUpdate: (() => {
      let timeout;
      return function() {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.updateRecommendations();
        }, 1000);
      };
    })(),

    /**
     * 更新推荐
     */
    updateRecommendations() {
      const container = document.querySelector('.sa-recommendations');
      if (container) {
        const recommendations = this.generateSmartSuggestions();
        container.innerHTML = recommendations.map(rec => this.renderRecommendationCard(rec)).join('');
      }
    }
  };

  // 暴露到全局
  window.SmartAssistantUI = SmartAssistantUI;

  // 自动初始化
  document.addEventListener('DOMContentLoaded', () => {
    SmartAssistantUI.init();
  });

  console.log('[SmartAssistantUI] 智能助手UI组件已加载 ✓');
})();
