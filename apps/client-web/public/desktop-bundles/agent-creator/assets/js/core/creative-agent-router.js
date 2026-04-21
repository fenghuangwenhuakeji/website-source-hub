/**
 * ═══════════════════════════════════════════════════════════════
 * 创作Agent智能路由系统 - Creative Agent Router
 * ═══════════════════════════════════════════════════════════════
 * 
 * 核心功能：通过关键词自动触发对应的创作Agent
 * 使用方式：在创作时描述需求，系统自动匹配并调用Agent
 * 
 * 示例：
 *   - "帮我写小说大纲" → 触发 outline-agent
 *   - "设计三幕式结构" → 触发 three-act-agent
 *   - "润色这段对话" → 触发 dialogue-polish-agent
 */

(() => {
  const CreativeAgentRouter = {
    // ═══════════════════════════════════════════════════════════════
    // 核心Agent配置（精简版 - 只保留关键触发词）
    // ═══════════════════════════════════════════════════════════════
    agentMap: {
      // ─── 叙事结构类 ───
      'outline-agent': {
        keywords: ['大纲', '章节', '框架', '结构规划', '三界角色', '20章', '故事框架'],
        description: '大纲生成',
        category: 'narrative'
      },
      'narrative-engine-agent': {
        keywords: ['叙事', '写作', '创作故事', '写小说', '写故事', '无极太极', '情感链'],
        description: '叙事引擎',
        category: 'narrative'
      },
      'three-act-agent': {
        keywords: ['三幕式', '三幕', '第一幕', '情节点', '铺垫', '高潮', '结局'],
        description: '三幕式结构',
        category: 'narrative'
      },
      'hero-journey-agent': {
        keywords: ['英雄之旅', '坎贝尔', '启程', '试炼', '归来', '12阶段'],
        description: '英雄之旅',
        category: 'narrative'
      },
      'pacing-agent': {
        keywords: ['节奏', '张力', '情绪曲线', '起伏', '快慢', '紧凑'],
        description: '节奏控制',
        category: 'narrative'
      },
      'plot-twist-agent': {
        keywords: ['反转', '悬念', '伏笔', '意外', '转折', '惊喜'],
        description: '情节反转',
        category: 'narrative'
      },

      // ─── 角色类 ───
      'character-design-agent': {
        keywords: ['角色设计', '人物设定', '角色创建', '性格', '外貌', '背景'],
        description: '角色设计',
        category: 'character'
      },
      'character-arc-agent': {
        keywords: ['角色弧线', '成长', '转变', '蜕变', '人物发展', '内心变化'],
        description: '角色弧线',
        category: 'character'
      },
      'character-emotion-agent': {
        keywords: ['情感', '情绪', '心理', '内心', '感受', '心情'],
        description: '角色情感',
        category: 'character'
      },
      'character-relationship-agent': {
        keywords: ['关系', '人物关系', '互动', '羁绊', '联盟', '敌对'],
        description: '角色关系',
        category: 'character'
      },
      'dialogue-writer-agent': {
        keywords: ['对话', '台词', '交谈', '说话', '对白'],
        description: '对话写作',
        category: 'character'
      },
      'dialogue-polish-agent': {
        keywords: ['润色对话', '改对话', '优化对话', '对话润色'],
        description: '对话润色',
        category: 'character'
      },

      // ─── 世界观类 ───
      'worldbuilding-agent': {
        keywords: ['世界观', '设定', '背景', '地理', '历史', '文化', '规则'],
        description: '世界观构建',
        category: 'world'
      },
      'conflict-agent': {
        keywords: ['冲突', '矛盾', '对抗', '斗争', '阻碍', '难题'],
        description: '冲突设计',
        category: 'world'
      },
      'subtext-agent': {
        keywords: ['潜台词', '暗示', '言外之意', '深层', '隐喻', '双关'],
        description: '潜台词设计',
        category: 'world'
      },
      'scene-transition-agent': {
        keywords: ['转场', '过渡', '场景转换', '切换', '跳转'],
        description: '场景转换',
        category: 'world'
      },
      'genre-agent': {
        keywords: ['类型', '套路', '玄幻', '科幻', '都市', '言情', '武侠', '仙侠'],
        description: '类型片专家',
        category: 'world'
      },

      // ─── 创意工具类 ───
      'brainstorm-agent': {
        keywords: ['灵感', '标题', '创意', '想法', '点子', '头脑风暴', '书名'],
        description: '灵感风暴',
        category: 'creative'
      },
      'polish-agent': {
        keywords: ['润色', '修改', '优化', '改写', '去AI', '提升', '改进'],
        description: '文本润色',
        category: 'creative'
      },
      'short-story-writer-agent': {
        keywords: ['短篇', '短故事', '小小说', '微型小说'],
        description: '短篇写作',
        category: 'creative'
      },
      'branching-narrative-agent': {
        keywords: ['分支', '选择', '互动', '多结局', '选项', 'galgame'],
        description: '分支叙事',
        category: 'creative'
      },

      // ─── 剧本类 ───
      'script-creator-agent': {
        keywords: ['剧本', '脚本', ' screenplay', '分镜', '镜头', '拍摄'],
        description: '剧本创作',
        category: 'script'
      },
      'storyboard-agent': {
        keywords: ['分镜', '分镜头', 'storyboard', '画面', '镜头设计'],
        description: '分镜设计',
        category: 'script'
      },
      'short-film-agent': {
        keywords: ['短片', '微电影', '短视频', '短片剧本'],
        description: '短片剧本',
        category: 'script'
      },
      'tv-series-agent': {
        keywords: ['电视剧', '网剧', '季', '集', '分集'],
        description: '电视剧本',
        category: 'script'
      },
      'web-series-agent': {
        keywords: ['网络剧', '网大', '网络大电影', '新媒体'],
        description: '网络剧剧本',
        category: 'script'
      },
      'documentary-agent': {
        keywords: ['纪录片', '纪实', '采访', '旁白', '真实'],
        description: '纪录片脚本',
        category: 'script'
      },

      // ─── 音频类 ───
      'radio-drama-agent': {
        keywords: ['广播剧', '声音', '听觉', '配音'],
        description: '广播剧剧本',
        category: 'audio'
      },
      'stage-play-agent': {
        keywords: ['舞台剧', '话剧', '戏剧', '舞台', '剧场'],
        description: '舞台剧剧本',
        category: 'audio'
      },
      'commercial-agent': {
        keywords: ['广告', '商业', '产品', '营销', '宣传片'],
        description: '广告脚本',
        category: 'audio'
      },
      'suno-music-agent': {
        keywords: ['音乐', '歌曲', '歌词', 'suno', '作曲', '编曲'],
        description: 'AI音乐',
        category: 'audio'
      },

      // ─── 视觉类 ───
      'comic-creator-agent': {
        keywords: ['漫画', '四格', '条漫', '日漫', '美漫'],
        description: '漫画创作',
        category: 'visual'
      },
      'animation-creator-agent': {
        keywords: ['动画', 'animation', '关键帧', 'anime'],
        description: '动画创作',
        category: 'visual'
      },
      'nanobanana-grid-agent': {
        keywords: ['网格', '角色表', '设定图', 'AI绘图', 'midjourney', 'stable diffusion'],
        description: 'AI绘图网格',
        category: 'visual'
      }
    },

    // ═══════════════════════════════════════════════════════════════
    // 智能匹配算法
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * 分析用户需求，匹配最合适的Agent
     * @param {string} input - 用户输入
     * @returns {Object|null} - 匹配的Agent信息
     */
    matchAgent(input) {
      if (!input || typeof input !== 'string') return null;
      
      const text = input.toLowerCase();
      const scores = [];

      // 计算每个Agent的匹配分数
      for (const [agentName, config] of Object.entries(this.agentMap)) {
        let score = 0;
        let matchedKeywords = [];

        for (const keyword of config.keywords) {
          const keywordLower = keyword.toLowerCase();
          if (text.includes(keywordLower)) {
            // 关键词匹配得分
            score += keywordLower.length >= 4 ? 3 : 2;
            matchedKeywords.push(keyword);
          }
        }

        if (score > 0) {
          scores.push({
            agentName,
            score,
            matchedKeywords,
            config
          });
        }
      }

      // 按分数排序，返回最高分的Agent
      if (scores.length === 0) return null;
      
      scores.sort((a, b) => b.score - a.score);
      return scores[0];
    },

    /**
     * 获取多个匹配的Agent（用于复杂任务）
     * @param {string} input - 用户输入
     * @param {number} limit - 返回数量限制
     * @returns {Array} - 匹配的Agent列表
     */
    matchMultipleAgents(input, limit = 3) {
      if (!input || typeof input !== 'string') return [];
      
      const text = input.toLowerCase();
      const scores = [];

      for (const [agentName, config] of Object.entries(this.agentMap)) {
        let score = 0;
        let matchedKeywords = [];

        for (const keyword of config.keywords) {
          const keywordLower = keyword.toLowerCase();
          if (text.includes(keywordLower)) {
            score += keywordLower.length >= 4 ? 3 : 2;
            matchedKeywords.push(keyword);
          }
        }

        if (score > 0) {
          scores.push({
            agentName,
            score,
            matchedKeywords,
            config
          });
        }
      }

      scores.sort((a, b) => b.score - a.score);
      return scores.slice(0, limit);
    },

    // ═══════════════════════════════════════════════════════════════
    // Agent调用接口
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * 调用Agent（自动匹配或指定）
     * @param {string} input - 用户输入
     * @param {string} preferredAgent - 优先使用的Agent（可选）
     * @returns {Promise<Object>} - 调用结果
     */
    async invoke(input, preferredAgent = null) {
      let agentToUse = preferredAgent;
      
      // 如果没有指定Agent，自动匹配
      if (!agentToUse) {
        const match = this.matchAgent(input);
        if (match) {
          agentToUse = match.agentName;
        }
      }

      if (!agentToUse) {
        return {
          success: false,
          error: '无法识别创作需求，请更具体地描述您需要什么帮助',
          suggestion: '例如："帮我写小说大纲"、"设计角色"、"润色对话"等'
        };
      }

      // 检查Agent是否存在
      const agentConfig = this.agentMap[agentToUse];
      if (!agentConfig) {
        return {
          success: false,
          error: `未知的Agent: ${agentToUse}`
        };
      }

      // 触发Agent调用事件
      const event = new CustomEvent('creative-agent-invoke', {
        detail: {
          agentName: agentToUse,
          description: agentConfig.description,
          category: agentConfig.category,
          input: input
        }
      });
      document.dispatchEvent(event);

      return {
        success: true,
        agentName: agentToUse,
        description: agentConfig.description,
        category: agentConfig.category,
        message: `已触发 ${agentConfig.description} (${agentToUse})`
      };
    },

    /**
     * 快速调用指定Agent
     * @param {string} agentName - Agent名称
     * @param {string} input - 用户输入
     * @returns {Promise<Object>} - 调用结果
     */
    async invokeAgent(agentName, input) {
      return this.invoke(input, agentName);
    },

    // ═══════════════════════════════════════════════════════════════
    // 辅助功能
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * 获取所有可用Agent列表
     * @returns {Array} - Agent列表
     */
    getAllAgents() {
      return Object.entries(this.agentMap).map(([name, config]) => ({
        name,
        ...config
      }));
    },

    /**
     * 按分类获取Agent
     * @param {string} category - 分类名称
     * @returns {Array} - Agent列表
     */
    getAgentsByCategory(category) {
      return this.getAllAgents().filter(agent => agent.category === category);
    },

    /**
     * 获取分类列表
     * @returns {Object} - 分类信息
     */
    getCategories() {
      return {
        narrative: { name: '叙事结构', icon: 'fa-book' },
        character: { name: '角色系统', icon: 'fa-users' },
        world: { name: '世界观', icon: 'fa-globe' },
        creative: { name: '创意工具', icon: 'fa-lightbulb' },
        script: { name: '剧本创作', icon: 'fa-clapperboard' },
        audio: { name: '音频创作', icon: 'fa-music' },
        visual: { name: '视觉创作', icon: 'fa-images' }
      };
    },

    /**
     * 智能提示 - 根据输入给出建议
     * @param {string} input - 用户输入
     * @returns {Array} - 建议列表
     */
    getSuggestions(input) {
      if (!input || input.length < 2) return [];
      
      const matches = this.matchMultipleAgents(input, 5);
      return matches.map(m => ({
        agent: m.agentName,
        description: m.config.description,
        keywords: m.matchedKeywords.slice(0, 3)
      }));
    }
  };

  // 暴露到全局
  window.CreativeAgentRouter = CreativeAgentRouter;

  // 监听Agent调用事件（供其他模块使用）
  document.addEventListener('creative-agent-invoke', (e) => {
    console.log('[CreativeAgentRouter] Agent invoked:', e.detail);
    
    // 可以在这里添加全局处理逻辑
    // 例如：显示通知、记录日志等
    if (window.UI && UI.toast) {
      UI.toast(`🎨 已调用 ${e.detail.description}`, 'info');
    }
  });

  console.log('[CreativeAgentRouter] 创作Agent路由系统已加载 ✓');
})();
