/**
 * ═══════════════════════════════════════════════════════════════
 * 智能自动化核心系统 - Intelligent Automation Core
 * ═══════════════════════════════════════════════════════════════
 * 
 * 核心能力：
 * 1. 上下文感知 - 理解用户当前状态和意图
 * 2. 智能推荐 - 主动推荐下一步操作
 * 3. 自动化工作流 - 串联多个Agent自动执行
 * 4. 学习记忆 - 记住用户偏好和习惯
 */

(() => {
  const IntelligentCore = {
    // ═══════════════════════════════════════════════════════════════
    // 系统状态追踪
    // ═══════════════════════════════════════════════════════════════
    state: {
      currentModule: null,
      currentProject: null,
      recentActions: [],
      userPreferences: {},
      activeWorkflow: null,
      contextSnapshot: null
    },

    // ═══════════════════════════════════════════════════════════════
    // 智能工作流定义
    // ═══════════════════════════════════════════════════════════════
    workflows: {
      // 小说创作完整流程
      novel_creation: {
        name: '小说创作全流程',
        description: '从灵感到大纲到章节的完整创作流程',
        auto: true,
        steps: [
          { agent: 'brainstorm-agent', task: '生成创意和标题', input: 'genre,theme' },
          { agent: 'worldbuilding-agent', task: '构建世界观', input: 'world_concept', condition: 'need_world' },
          { agent: 'character-design-agent', task: '设计主要角色', input: 'main_characters' },
          { agent: 'outline-agent', task: '生成故事大纲', input: 'story_idea,chapters' },
          { agent: 'narrative-engine-agent', task: '创作章节内容', input: 'chapter_outline', loop: 'chapters' }
        ]
      },

      // 剧本创作流程
      screenplay_creation: {
        name: '剧本创作流程',
        description: '从故事到剧本到分镜的完整流程',
        auto: true,
        steps: [
          { agent: 'three-act-agent', task: '设计三幕式结构', input: 'story_concept' },
          { agent: 'script-creator-agent', task: '生成剧本', input: 'structure' },
          { agent: 'storyboard-agent', task: '设计分镜', input: 'script', condition: 'need_storyboard' }
        ]
      },

      // 角色深度开发
      character_development: {
        name: '角色深度开发',
        description: '从设计到弧线的完整角色开发',
        auto: false,
        steps: [
          { agent: 'character-design-agent', task: '基础设计', input: 'character_basic' },
          { agent: 'character-arc-agent', task: '成长弧线', input: 'character_design' },
          { agent: 'character-emotion-agent', task: '情感层次', input: 'character_arc' },
          { agent: 'dialogue-writer-agent', task: '对话样本', input: 'character_profile' }
        ]
      },

      // 内容优化流程
      content_optimization: {
        name: '内容智能优化',
        description: '自动分析并优化内容质量',
        auto: true,
        steps: [
          { agent: 'pacing-agent', task: '节奏分析', input: 'content' },
          { agent: 'dialogue-polish-agent', task: '对话润色', input: 'content', condition: 'has_dialogue' },
          { agent: 'polish-agent', task: '整体润色', input: 'content' },
          { agent: 'subtext-agent', task: '添加潜台词', input: 'polished_content', condition: 'need_depth' }
        ]
      }
    },

    // ═══════════════════════════════════════════════════════════════
    // 上下文感知系统
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * 捕获当前上下文
     */
    captureContext() {
      const context = {
        timestamp: Date.now(),
        module: this.state.currentModule,
        project: this.state.currentProject,
        recentContent: this.getRecentContent(),
        userIntent: this.analyzeIntent(),
        availableData: this.scanAvailableData()
      };
      this.state.contextSnapshot = context;
      return context;
    },

    /**
     * 分析用户意图
     */
    analyzeIntent() {
      const recent = this.state.recentActions.slice(-3);
      const patterns = {
        writing: ['write', 'create', '生成', '写作', '创作'],
        editing: ['edit', 'polish', '修改', '润色', '优化'],
        planning: ['plan', 'outline', '规划', '大纲', '设计'],
        reviewing: ['review', 'check', '检查', '审阅', '分析']
      };
      
      // 基于最近行为推断意图
      for (const action of recent) {
        for (const [intent, keywords] of Object.entries(patterns)) {
          if (keywords.some(k => action.toLowerCase().includes(k))) {
            return intent;
          }
        }
      }
      return 'general';
    },

    /**
     * 获取最近内容
     */
    getRecentContent() {
      // 从当前模块获取内容
      const module = this.state.currentModule;
      if (!module) return null;
      
      // 尝试从DOM获取编辑器内容
      const editor = document.querySelector('.editor-content, .writing-area, textarea');
      if (editor) {
        return editor.value || editor.textContent || '';
      }
      return null;
    },

    /**
     * 扫描可用数据
     */
    scanAvailableData() {
      const data = {
        hasOutline: false,
        hasCharacters: false,
        hasWorld: false,
        hasContent: false,
        wordCount: 0
      };

      const content = this.getRecentContent();
      if (content) {
        data.hasContent = true;
        data.wordCount = content.length;
      }

      return data;
    },

    // ═══════════════════════════════════════════════════════════════
    // 智能推荐系统
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * 生成智能推荐
     */
    generateRecommendations() {
      const context = this.captureContext();
      const recommendations = [];

      // 基于上下文的智能推荐
      if (!context.availableData.hasOutline && context.userIntent === 'writing') {
        recommendations.push({
          type: 'action',
          priority: 'high',
          title: '生成故事大纲',
          description: '检测到您开始创作，建议先规划大纲',
          agent: 'outline-agent',
          autoTrigger: false
        });
      }

      if (context.availableData.wordCount > 1000 && !this.state.recentActions.includes('polish')) {
        recommendations.push({
          type: 'action',
          priority: 'medium',
          title: '智能润色',
          description: `检测到${context.availableData.wordCount}字内容，建议进行质量优化`,
          agent: 'polish-agent',
          autoTrigger: false
        });
      }

      // 基于工作流的推荐
      const workflow = this.suggestWorkflow(context);
      if (workflow) {
        recommendations.push({
          type: 'workflow',
          priority: 'high',
          title: workflow.name,
          description: workflow.description,
          workflow: workflow.id,
          autoTrigger: false
        });
      }

      return recommendations;
    },

    /**
     * 推荐工作流
     */
    suggestWorkflow(context) {
      const intent = context.userIntent;
      const data = context.availableData;

      if (intent === 'writing' && !data.hasOutline) {
        return { id: 'novel_creation', ...this.workflows.novel_creation };
      }

      if (intent === 'editing' && data.hasContent) {
        return { id: 'content_optimization', ...this.workflows.content_optimization };
      }

      return null;
    },

    // ═══════════════════════════════════════════════════════════════
    // 自动化执行引擎
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * 执行工作流
     */
    async executeWorkflow(workflowId, input = {}) {
      const workflow = this.workflows[workflowId];
      if (!workflow) {
        return { success: false, error: '工作流不存在' };
      }

      this.state.activeWorkflow = {
        id: workflowId,
        step: 0,
        data: input,
        results: []
      };

      const results = [];
      
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        
        // 检查条件
        if (step.condition && !this.checkCondition(step.condition, input)) {
          continue;
        }

        // 执行步骤
        const result = await this.executeStep(step, input);
        results.push(result);

        // 更新工作流状态
        this.state.activeWorkflow.step = i + 1;
        this.state.activeWorkflow.results.push(result);

        // 如果是循环步骤，处理多个输入
        if (step.loop && Array.isArray(input[step.loop])) {
          for (const item of input[step.loop]) {
            const loopResult = await this.executeStep(step, { ...input, [step.loop]: item });
            results.push(loopResult);
          }
        }
      }

      this.state.activeWorkflow = null;
      return { success: true, results };
    },

    /**
     * 执行单个步骤
     */
    async executeStep(step, input) {
      // 触发Agent调用
      const event = new CustomEvent('intelligent-step-execute', {
        detail: { step, input }
      });
      document.dispatchEvent(event);

      return {
        agent: step.agent,
        task: step.task,
        status: 'completed',
        timestamp: Date.now()
      };
    },

    /**
     * 检查条件
     */
    checkCondition(condition, input) {
      const conditions = {
        need_world: () => input.genre === 'fantasy' || input.genre === 'scifi',
        has_dialogue: () => input.content && input.content.includes('"'),
        need_depth: () => input.wordCount > 2000
      };

      return conditions[condition] ? conditions[condition]() : true;
    },

    // ═══════════════════════════════════════════════════════════════
    // 智能助手接口
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * 智能助手主入口
     */
    async assist(userInput, options = {}) {
      const context = this.captureContext();
      
      // 1. 分析需求
      const intent = this.parseIntent(userInput);
      
      // 2. 匹配最佳方案
      const solution = await this.findSolution(intent, context);
      
      // 3. 执行或推荐
      if (solution.type === 'workflow' && solution.workflow.auto) {
        return await this.executeWorkflow(solution.workflow.id, solution.params);
      } else {
        return this.presentOptions(solution);
      }
    },

    /**
     * 解析用户意图
     */
    parseIntent(input) {
      const patterns = {
        create_novel: ['写小说', '创作小说', '写故事', 'novel', 'story'],
        create_screenplay: ['写剧本', ' screenplay', 'script', '剧本'],
        design_character: ['设计角色', '创建人物', 'character', '角色'],
        build_world: ['世界观', '设定', 'world', 'worldbuilding'],
        polish_content: ['润色', '优化', '修改', 'polish', 'edit'],
        generate_outline: ['大纲', '框架', 'outline', 'structure']
      };

      for (const [intent, keywords] of Object.entries(patterns)) {
        if (keywords.some(k => input.toLowerCase().includes(k.toLowerCase()))) {
          return intent;
        }
      }
      return 'general';
    },

    /**
     * 查找解决方案
     */
    async findSolution(intent, context) {
      // 直接匹配工作流
      const workflowMap = {
        create_novel: 'novel_creation',
        create_screenplay: 'screenplay_creation',
        design_character: 'character_development',
        polish_content: 'content_optimization'
      };

      if (workflowMap[intent]) {
        return {
          type: 'workflow',
          workflow: {
            id: workflowMap[intent],
            ...this.workflows[workflowMap[intent]]
          },
          params: context
        };
      }

      // 匹配单个Agent
      if (window.CreativeAgentRouter) {
        const match = CreativeAgentRouter.matchAgent(intent);
        if (match) {
          return {
            type: 'agent',
            agent: match
          };
        }
      }

      return { type: 'unknown' };
    },

    /**
     * 展示选项
     */
    presentOptions(solution) {
      // 触发UI事件
      const event = new CustomEvent('intelligent-options', {
        detail: solution
      });
      document.dispatchEvent(event);
      return solution;
    },

    // ═══════════════════════════════════════════════════════════════
    // 学习记忆系统
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * 记录用户行为
     */
    recordAction(action, metadata = {}) {
      this.state.recentActions.push(action);
      if (this.state.recentActions.length > 20) {
        this.state.recentActions.shift();
      }

      // 学习偏好
      if (metadata.preference) {
        this.state.userPreferences[metadata.preference] = metadata.value;
      }

      // 保存到本地存储
      this.saveState();
    },

    /**
     * 保存状态
     */
    saveState() {
      localStorage.setItem('intelligent_core_state', JSON.stringify({
        preferences: this.state.userPreferences,
        recentActions: this.state.recentActions
      }));
    },

    /**
     * 加载状态
     */
    loadState() {
      const saved = localStorage.getItem('intelligent_core_state');
      if (saved) {
        const data = JSON.parse(saved);
        this.state.userPreferences = data.preferences || {};
        this.state.recentActions = data.recentActions || [];
      }
    },

    /**
     * 更新当前模块
     */
    setCurrentModule(module) {
      this.state.currentModule = module;
      this.recordAction(`navigate:${module}`);
    }
  };

  // 初始化
  IntelligentCore.loadState();

  // 暴露到全局
  window.IntelligentCore = IntelligentCore;

  // 监听导航事件
  document.addEventListener('app-nav', (e) => {
    if (e.detail && e.detail.module) {
      IntelligentCore.setCurrentModule(e.detail.module);
    }
  });

  console.log('[IntelligentCore] 智能自动化核心系统已加载 ✓');
})();
