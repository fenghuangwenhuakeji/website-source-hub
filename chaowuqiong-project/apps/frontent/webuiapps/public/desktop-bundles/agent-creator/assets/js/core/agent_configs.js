(() => {
  const AgentConfigs = {
    categories: {
      narrative: {
        name: "叙事结构",
        icon: "fa-book",
        description: "叙事框架与结构设计"
      },
      character: {
        name: "角色系统",
        icon: "fa-users",
        description: "角色创建与发展管理"
      },
      world: {
        name: "世界观与冲突",
        icon: "fa-globe",
        description: "世界构建与冲突设计"
      },
      creative: {
        name: "创意工具",
        icon: "fa-lightbulb",
        description: "创意生成与文本润色"
      },
      script: {
        name: "剧本创作",
        icon: "fa-clapperboard",
        description: "影视剧本创作系统"
      },
      audio: {
        name: "音频创作",
        icon: "fa-music",
        description: "音频内容创作"
      },
      visual: {
        name: "视觉创作",
        icon: "fa-images",
        description: "视觉内容创作"
      }
    },

    agents: {
      narrative_engine: {
        id: "narrative_engine",
        name: "叙事引擎",
        agentName: "narrative-engine-agent",
        category: "narrative",
        icon: "fa-book",
        color: "violet-500",
        description: "无极太极叙事框架",
        features: ["三幕式结构", "情感链设计", "零度写作", "角色弧线"],
        systemPrompt: "你是无极太极叙事引擎专家，精通叙事结构设计、情感链构建、零度写作技巧。你能够帮助用户创作出结构完整、情感丰富的故事。",
        inputFields: [
          { id: "theme", label: "主题", type: "text", placeholder: "输入故事主题..." },
          { id: "genre", label: "类型", type: "select", options: ["玄幻", "都市", "科幻", "悬疑", "言情", "历史", "武侠", "仙侠"] },
          { id: "length", label: "篇幅", type: "select", options: ["短篇(1-3万字)", "中篇(3-10万字)", "长篇(10万字以上)"] }
        ]
      },

      outline_agent: {
        id: "outline_agent",
        name: "大纲生成",
        agentName: "outline-agent",
        category: "narrative",
        icon: "fa-list-ol",
        color: "blue-500",
        description: "三界角色法大纲",
        features: ["三界角色法", "20章框架", "情感链设计", "伏笔系统"],
        systemPrompt: "你是大纲生成专家，精通三界角色法、章节规划、情感链设计。你能够帮助用户生成详细的故事大纲，包含完整的章节结构和角色发展。",
        inputFields: [
          { id: "story_idea", label: "故事创意", type: "textarea", placeholder: "描述你的故事创意..." },
          { id: "chapters", label: "章节数", type: "number", default: 20 },
          { id: "style", label: "风格", type: "select", options: ["轻松", "严肃", "幽默", "黑暗", "热血"] }
        ]
      },

      three_act_agent: {
        id: "three_act_agent",
        name: "三幕式结构",
        agentName: "three-act-agent",
        category: "narrative",
        icon: "fa-theater-masks",
        color: "cyan-500",
        description: "经典三幕式规划",
        features: ["第一幕铺垫", "第二幕对抗", "第三幕解决", "情节点设计"],
        systemPrompt: "你是三幕式结构专家，精通经典叙事结构。你能够帮助用户设计完整的三幕式故事结构，包括铺垫、对抗、解决三个部分的详细规划。",
        inputFields: [
          { id: "protagonist", label: "主角", type: "text", placeholder: "主角名称和简介..." },
          { id: "goal", label: "目标", type: "text", placeholder: "主角的目标..." },
          { id: "obstacle", label: "障碍", type: "textarea", placeholder: "主角面临的障碍..." }
        ]
      },

      hero_journey_agent: {
        id: "hero_journey_agent",
        name: "英雄之旅",
        agentName: "hero-journey-agent",
        category: "narrative",
        icon: "fa-route",
        color: "orange-500",
        description: "坎贝尔叙事框架",
        features: ["召唤启程", "试炼之路", "归来转化", "12阶段模型"],
        systemPrompt: "你是坎贝尔英雄之旅叙事专家，精通英雄之旅的12个阶段。你能够帮助用户设计史诗级的故事结构，让主角经历完整的成长旅程。",
        inputFields: [
          { id: "hero", label: "英雄", type: "text", placeholder: "英雄的基本信息..." },
          { id: "world", label: "世界", type: "textarea", placeholder: "故事发生的世界..." },
          { id: "call_type", label: "召唤类型", type: "select", options: ["外在召唤", "内在召唤", "被迫召唤", "主动探索"] }
        ]
      },

      plot_twist_agent: {
        id: "plot_twist_agent",
        name: "情节反转",
        agentName: "plot-twist-agent",
        category: "narrative",
        icon: "fa-bolt",
        color: "yellow-500",
        description: "叙事惊喜设计",
        features: ["伏笔埋设", "反转设计", "悬念构建", "情感冲击"],
        systemPrompt: "你是情节反转专家，精通叙事惊喜设计。你能够帮助用户设计令人意想不到的情节反转，包括伏笔埋设、反转时机、情感冲击等。",
        inputFields: [
          { id: "current_plot", label: "当前情节", type: "textarea", placeholder: "描述当前的故事情节..." },
          { id: "twist_type", label: "反转类型", type: "select", options: ["身份反转", "动机反转", "关系反转", "命运反转", "真相反转"] },
          { id: "intensity", label: "强度", type: "range", min: 1, max: 10, default: 5 }
        ]
      },

      pacing_agent: {
        id: "pacing_agent",
        name: "节奏控制",
        agentName: "pacing-agent",
        category: "narrative",
        icon: "fa-gauge-high",
        color: "green-500",
        description: "叙事节奏管理",
        features: ["张力起伏", "情绪曲线", "节奏调节", "高潮设计"],
        systemPrompt: "你是叙事节奏控制专家，精通故事节奏管理。你能够帮助用户控制故事的张力起伏、情绪曲线，让读者始终保持投入。",
        inputFields: [
          { id: "content", label: "内容", type: "textarea", placeholder: "输入需要调整节奏的内容..." },
          { id: "target_pace", label: "目标节奏", type: "select", options: ["紧张刺激", "舒缓温和", "起伏有致", "层层递进"] },
          { id: "scene_type", label: "场景类型", type: "select", options: ["战斗", "对话", "描写", "心理", "转折"] }
        ]
      },

      character_design_agent: {
        id: "character_design_agent",
        name: "角色设计",
        agentName: "character-design-agent",
        category: "character",
        icon: "fa-user-pen",
        color: "pink-500",
        description: "角色创建与发展",
        features: ["性格塑造", "背景设定", "外貌描写", "能力体系"],
        systemPrompt: "你是角色设计专家，精通人物塑造。你能够帮助用户创建立体生动的角色，包括性格设计、背景故事、外貌描写、能力设定等。",
        inputFields: [
          { id: "role", label: "角色定位", type: "select", options: ["主角", "配角", "反派", "导师", "伙伴", "对手"] },
          { id: "traits", label: "性格特点", type: "text", placeholder: "描述角色的性格特点..." },
          { id: "background", label: "背景", type: "textarea", placeholder: "角色的背景故事..." }
        ]
      },

      character_arc_agent: {
        id: "character_arc_agent",
        name: "角色弧线",
        agentName: "character-arc-agent",
        category: "character",
        icon: "fa-chart-line",
        color: "purple-500",
        description: "成长轨迹设计",
        features: ["成长弧线", "转变过程", "内心变化", "关键节点"],
        systemPrompt: "你是角色弧线设计专家，精通角色成长轨迹设计。你能够帮助用户设计角色的成长弧线，让角色在故事中经历有意义的转变。",
        inputFields: [
          { id: "character", label: "角色", type: "text", placeholder: "角色名称..." },
          { id: "start_state", label: "初始状态", type: "textarea", placeholder: "角色开始时的状态..." },
          { id: "end_state", label: "目标状态", type: "textarea", placeholder: "角色最终的状态..." }
        ]
      },

      character_emotion_agent: {
        id: "character_emotion_agent",
        name: "角色情感",
        agentName: "character-emotion-agent",
        category: "character",
        icon: "fa-heart",
        color: "red-500",
        description: "情感系统管理",
        features: ["情感层次", "情绪变化", "情感表达", "心理描写"],
        systemPrompt: "你是角色情感专家，精通情感系统设计。你能够帮助用户设计角色的情感层次、情绪变化，让角色的情感表达更加真实动人。",
        inputFields: [
          { id: "character", label: "角色", type: "text", placeholder: "角色名称..." },
          { id: "situation", label: "情境", type: "textarea", placeholder: "角色所处的情境..." },
          { id: "emotion_type", label: "情感类型", type: "select", options: ["喜悦", "悲伤", "愤怒", "恐惧", "爱恋", "仇恨", "矛盾"] }
        ]
      },

      character_relation_agent: {
        id: "character_relation_agent",
        name: "角色关系",
        agentName: "character-relationship-agent",
        category: "character",
        icon: "fa-users",
        color: "indigo-400",
        description: "关系网络构建",
        features: ["关系图谱", "互动设计", "冲突构建", "联盟变化"],
        systemPrompt: "你是角色关系专家，精通关系网络构建。你能够帮助用户设计复杂的角色关系网络，包括人物之间的互动、冲突、联盟等。",
        inputFields: [
          { id: "characters", label: "角色列表", type: "textarea", placeholder: "列出相关角色..." },
          { id: "relation_type", label: "关系类型", type: "select", options: ["亲情", "友情", "爱情", "敌对", "师徒", "竞争"] },
          { id: "development", label: "发展方向", type: "text", placeholder: "关系的发展方向..." }
        ]
      },

      dialogue_writer_agent: {
        id: "dialogue_writer_agent",
        name: "对话写作",
        agentName: "dialogue-writer-agent",
        category: "character",
        icon: "fa-comments",
        color: "teal-400",
        description: "角色对话创作",
        features: ["角色声音", "对话节奏", "信息传递", "潜台词"],
        systemPrompt: "你是对话写作专家，精通角色对话创作。你能够帮助用户写出符合角色性格、推动情节发展的对话，让每个角色都有独特的声音。",
        inputFields: [
          { id: "characters", label: "对话角色", type: "text", placeholder: "参与对话的角色..." },
          { id: "context", label: "情境", type: "textarea", placeholder: "对话发生的情境..." },
          { id: "purpose", label: "目的", type: "text", placeholder: "对话要达到的目的..." }
        ]
      },

      dialogue_polish_agent: {
        id: "dialogue_polish_agent",
        name: "对话润色",
        agentName: "dialogue-polish-agent",
        category: "character",
        icon: "fa-wand-magic-sparkles",
        color: "emerald-400",
        description: "对话质量提升",
        features: ["去AI化", "自然化", "张力增强", "角色贴合"],
        systemPrompt: "你是对话润色专家，精通对话质量提升。你能够帮助用户润色对话，去除AI痕迹，让对话更加自然、有张力、符合角色性格。",
        inputFields: [
          { id: "dialogue", label: "原对话", type: "textarea", placeholder: "输入需要润色的对话..." },
          { id: "characters", label: "角色信息", type: "textarea", placeholder: "角色的性格特点..." },
          { id: "style", label: "风格", type: "select", options: ["自然口语", "文学化", "戏剧化", "幽默风趣"] }
        ]
      },

      worldbuilding_agent: {
        id: "worldbuilding_agent",
        name: "世界观构建",
        agentName: "worldbuilding-agent",
        category: "world",
        icon: "fa-globe",
        color: "sky-500",
        description: "世界设定创建",
        features: ["地理设定", "历史背景", "文化体系", "规则系统"],
        systemPrompt: "你是世界观构建专家，精通世界设定创建。你能够帮助用户构建完整、自洽的世界观，包括地理、历史、文化、规则等各个方面。",
        inputFields: [
          { id: "genre", label: "类型", type: "select", options: ["奇幻", "科幻", "历史", "现代", "架空"] },
          { id: "elements", label: "核心元素", type: "text", placeholder: "世界观的核心元素..." },
          { id: "scale", label: "规模", type: "select", options: ["单一城市", "国家", "大陆", "世界", "宇宙"] }
        ]
      },

      conflict_agent: {
        id: "conflict_agent",
        name: "冲突设计",
        agentName: "conflict-agent",
        category: "world",
        icon: "fa-fire",
        color: "red-500",
        description: "戏剧冲突构建",
        features: ["人物冲突", "环境冲突", "内心冲突", "冲突升级"],
        systemPrompt: "你是冲突设计专家，精通戏剧冲突构建。你能够帮助用户设计各种类型的冲突，推动故事发展，增强戏剧张力。",
        inputFields: [
          { id: "parties", label: "冲突双方", type: "text", placeholder: "冲突的双方..." },
          { id: "conflict_type", label: "冲突类型", type: "select", options: ["人物vs人物", "人物vs环境", "人物vs自我", "人物vs社会"] },
          { id: "stakes", label: "赌注", type: "textarea", placeholder: "冲突的赌注和后果..." }
        ]
      },

      subtext_agent: {
        id: "subtext_agent",
        name: "潜台词设计",
        agentName: "subtext-agent",
        category: "world",
        icon: "fa-masks-theater",
        color: "slate-500",
        description: "深层含义暗示",
        features: ["言外之意", "暗示技巧", "双重含义", "情感暗流"],
        systemPrompt: "你是潜台词设计专家，精通深层含义暗示。你能够帮助用户在对话和叙述中设计潜台词，增加作品的深度和层次感。",
        inputFields: [
          { id: "surface_text", label: "表面文本", type: "textarea", placeholder: "表面的对话或叙述..." },
          { id: "hidden_meaning", label: "隐藏含义", type: "textarea", placeholder: "想要表达的深层含义..." },
          { id: "technique", label: "技巧", type: "select", options: ["反讽", "隐喻", "省略", "双关", "暗示"] }
        ]
      },

      scene_transition_agent: {
        id: "scene_transition_agent",
        name: "场景转换",
        agentName: "scene-transition-agent",
        category: "world",
        icon: "fa-film",
        color: "zinc-500",
        description: "流畅场景过渡",
        features: ["转场技巧", "时空转换", "节奏衔接", "氛围转换"],
        systemPrompt: "你是场景转换专家，精通流畅的场景过渡。你能够帮助用户设计自然的场景转换，让故事在不同场景之间流畅过渡。",
        inputFields: [
          { id: "from_scene", label: "当前场景", type: "textarea", placeholder: "当前场景的内容..." },
          { id: "to_scene", label: "目标场景", type: "textarea", placeholder: "要转换到的场景..." },
          { id: "transition_type", label: "转换类型", type: "select", options: ["时间转换", "空间转换", "视角转换", "情绪转换"] }
        ]
      },

      genre_agent: {
        id: "genre_agent",
        name: "类型片专家",
        agentName: "genre-agent",
        category: "world",
        icon: "fa-tags",
        color: "amber-500",
        description: "类型套路设计",
        features: ["类型规则", "套路运用", "创新突破", "读者期待"],
        systemPrompt: "你是类型片专家，精通各种类型的写作规则和套路。你能够帮助用户在遵循类型规则的同时进行创新，满足读者期待。",
        inputFields: [
          { id: "genre", label: "类型", type: "select", options: ["玄幻", "都市", "科幻", "悬疑", "言情", "武侠", "仙侠", "历史"] },
          { id: "story", label: "故事概述", type: "textarea", placeholder: "故事的基本概述..." },
          { id: "innovation", label: "创新点", type: "text", placeholder: "想要创新的方面..." }
        ]
      },

      brainstorm_agent: {
        id: "brainstorm_agent",
        name: "灵感风暴",
        agentName: "brainstorm-agent",
        category: "creative",
        icon: "fa-lightbulb",
        color: "yellow-400",
        description: "创意标题生成",
        features: ["标题生成", "概念创意", "市场分析", "热点追踪"],
        systemPrompt: "你是灵感风暴专家，精通创意标题生成。你能够帮助用户生成大量创意标题和故事概念，结合市场趋势和读者喜好。",
        inputFields: [
          { id: "keywords", label: "关键词", type: "text", placeholder: "输入关键词..." },
          { id: "category", label: "分类", type: "select", options: ["玄幻", "都市", "科幻", "悬疑", "言情", "历史", "武侠", "仙侠"] },
          { id: "count", label: "数量", type: "number", default: 10 }
        ]
      },

      polish_agent: {
        id: "polish_agent",
        name: "文本润色",
        agentName: "polish-agent",
        category: "creative",
        icon: "fa-sparkles",
        color: "fuchsia-500",
        description: "去AI化润色",
        features: ["去AI痕迹", "文学化", "情感增强", "风格统一"],
        systemPrompt: "你是文本润色专家，精通去AI化润色。你能够帮助用户润色文本，去除AI痕迹，让文字更加自然、有温度、有文学性。",
        inputFields: [
          { id: "text", label: "原文", type: "textarea", placeholder: "输入需要润色的文本..." },
          { id: "style", label: "目标风格", type: "select", options: ["自然流畅", "文学化", "口语化", "戏剧化"] },
          { id: "focus", label: "重点", type: "text", placeholder: "润色的重点方向..." }
        ]
      },

      short_story_agent: {
        id: "short_story_agent",
        name: "短篇写作",
        agentName: "short-story-writer-agent",
        category: "creative",
        icon: "fa-feather",
        color: "rose-400",
        description: "短篇小说创作",
        features: ["短篇结构", "精炼表达", "主题聚焦", "结尾设计"],
        systemPrompt: "你是短篇小说写作专家，精通短篇创作。你能够帮助用户创作结构精巧、主题鲜明的短篇小说，在有限篇幅内完成完整的故事。",
        inputFields: [
          { id: "theme", label: "主题", type: "text", placeholder: "故事主题..." },
          { id: "length", label: "篇幅", type: "select", options: ["微型(1000字内)", "小短篇(1000-5000字)", "短篇(5000-10000字)"] },
          { id: "style", label: "风格", type: "select", options: ["温馨治愈", "悬疑惊悚", "幽默讽刺", "深沉思考"] }
        ]
      },

      branching_narrative_agent: {
        id: "branching_narrative_agent",
        name: "分支叙事",
        agentName: "branching-narrative-agent",
        category: "creative",
        icon: "fa-code-branch",
        color: "lime-500",
        description: "互动故事设计",
        features: ["选择设计", "分支结构", "后果系统", "多结局"],
        systemPrompt: "你是分支叙事专家，精通互动故事设计。你能够帮助用户设计分支叙事结构，包括选择设计、分支发展、后果系统等。",
        inputFields: [
          { id: "main_plot", label: "主线情节", type: "textarea", placeholder: "故事的主线情节..." },
          { id: "branch_count", label: "分支数量", type: "number", default: 3 },
          { id: "interaction_type", label: "互动类型", type: "select", options: ["选择分支", "收集触发", "时间限制", "条件解锁"] }
        ]
      },

      script_creator_agent: {
        id: "script_creator_agent",
        name: "剧本创作",
        agentName: "script-creator-agent",
        category: "script",
        icon: "fa-clapperboard",
        color: "amber-600",
        description: "影视剧本生成",
        features: ["剧本格式", "场景设计", "对白创作", "动作描写"],
        systemPrompt: "你是剧本创作专家，精通影视剧本写作。你能够帮助用户创作符合行业标准的剧本，包括场景设计、对白创作、动作描写等。",
        inputFields: [
          { id: "story", label: "故事概述", type: "textarea", placeholder: "故事的基本概述..." },
          { id: "format", label: "格式", type: "select", options: ["电影剧本", "电视剧本", "短片剧本", "微电影"] },
          { id: "genre", label: "类型", type: "select", options: ["动作", "喜剧", "爱情", "悬疑", "科幻", "恐怖"] }
        ]
      },

      storyboard_agent: {
        id: "storyboard_agent",
        name: "分镜设计",
        agentName: "storyboard-agent",
        category: "script",
        icon: "fa-images",
        color: "blue-400",
        description: "镜头画面规划",
        features: ["镜头设计", "画面构图", "转场设计", "视觉叙事"],
        systemPrompt: "你是分镜设计专家，精通镜头画面规划。你能够帮助用户设计专业的分镜脚本，包括镜头设计、画面构图、转场效果等。",
        inputFields: [
          { id: "scene", label: "场景描述", type: "textarea", placeholder: "场景的基本描述..." },
          { id: "shot_count", label: "镜头数", type: "number", default: 8 },
          { id: "style", label: "风格", type: "select", options: ["电影感", "纪录片", "动画", "广告"] }
        ]
      },

      short_film_agent: {
        id: "short_film_agent",
        name: "短片剧本",
        agentName: "short-film-agent",
        category: "script",
        icon: "fa-video",
        color: "purple-400",
        description: "紧凑结构设计",
        features: ["精炼叙事", "单一主题", "快速切入", "有力结尾"],
        systemPrompt: "你是短片剧本专家，精通紧凑结构设计。你能够帮助用户创作结构紧凑、主题鲜明的短片剧本，在有限时间内完成完整叙事。",
        inputFields: [
          { id: "concept", label: "核心概念", type: "textarea", placeholder: "短片的核心概念..." },
          { id: "duration", label: "时长", type: "select", options: ["1-3分钟", "3-5分钟", "5-10分钟", "10-20分钟"] },
          { id: "style", label: "风格", type: "select", options: ["叙事型", "实验型", "纪录片式", "MV风格"] }
        ]
      },

      tv_series_agent: {
        id: "tv_series_agent",
        name: "电视剧本",
        agentName: "tv-series-agent",
        category: "script",
        icon: "fa-tv",
        color: "cyan-400",
        description: "分集结构设计",
        features: ["季弧设计", "分集规划", "人物弧线", "悬念设置"],
        systemPrompt: "你是电视剧本专家，精通分集结构设计。你能够帮助用户创作电视剧本，包括季弧设计、分集规划、人物发展等。",
        inputFields: [
          { id: "concept", label: "核心概念", type: "textarea", placeholder: "剧集的核心概念..." },
          { id: "episodes", label: "集数", type: "number", default: 12 },
          { id: "format", label: "格式", type: "select", options: ["单元剧", "连续剧", "迷你剧", "情景喜剧"] }
        ]
      },

      web_series_agent: {
        id: "web_series_agent",
        name: "网络剧剧本",
        agentName: "web-series-agent",
        category: "script",
        icon: "fa-wifi",
        color: "teal-400",
        description: "碎片化叙事",
        features: ["短剧集", "碎片化", "互动元素", "年轻化"],
        systemPrompt: "你是网络剧剧本专家，精通碎片化叙事。你能够帮助用户创作适合网络平台的剧本，包括短剧集、互动元素、年轻化表达等。",
        inputFields: [
          { id: "concept", label: "核心概念", type: "textarea", placeholder: "网络剧的核心概念..." },
          { id: "episode_length", label: "单集时长", type: "select", options: ["3-5分钟", "5-10分钟", "10-15分钟", "15-20分钟"] },
          { id: "platform", label: "平台", type: "select", options: ["短视频平台", "长视频平台", "社交媒体", "自有平台"] }
        ]
      },

      documentary_agent: {
        id: "documentary_agent",
        name: "纪录片脚本",
        agentName: "documentary-agent",
        category: "script",
        icon: "fa-video-camera",
        color: "green-400",
        description: "真实事件编排",
        features: ["采访设计", "旁白撰写", "素材组织", "叙事结构"],
        systemPrompt: "你是纪录片脚本专家，精通真实事件编排。你能够帮助用户创作纪录片脚本，包括采访设计、旁白撰写、素材组织等。",
        inputFields: [
          { id: "subject", label: "主题", type: "textarea", placeholder: "纪录片的主题..." },
          { id: "style", label: "风格", type: "select", options: ["观察式", "参与式", "反思式", "诗意式"] },
          { id: "duration", label: "时长", type: "select", options: ["短片(30分钟内)", "中片(30-60分钟)", "长片(60分钟以上)"] }
        ]
      },

      radio_drama_agent: {
        id: "radio_drama_agent",
        name: "广播剧剧本",
        agentName: "radio-drama-agent",
        category: "audio",
        icon: "fa-podcast",
        color: "indigo-300",
        description: "声音叙事设计",
        features: ["声音设计", "音效指示", "旁白运用", "听觉想象"],
        systemPrompt: "你是广播剧剧本专家，精通声音叙事设计。你能够帮助用户创作广播剧剧本，包括声音设计、音效指示、旁白运用等。",
        inputFields: [
          { id: "story", label: "故事", type: "textarea", placeholder: "广播剧的故事..." },
          { id: "duration", label: "时长", type: "select", options: ["5-10分钟", "10-20分钟", "20-30分钟", "30分钟以上"] },
          { id: "style", label: "风格", type: "select", options: ["悬疑", "情感", "喜剧", "历史"] }
        ]
      },

      stage_play_agent: {
        id: "stage_play_agent",
        name: "舞台剧剧本",
        agentName: "stage-play-agent",
        category: "audio",
        icon: "fa-theater-masks",
        color: "violet-400",
        description: "舞台指示设计",
        features: ["舞台限制", "对白为主", "舞台指示", "观众互动"],
        systemPrompt: "你是舞台剧剧本专家，精通舞台指示设计。你能够帮助用户创作舞台剧剧本，考虑舞台限制，以对白为主，设计合理的舞台指示。",
        inputFields: [
          { id: "story", label: "故事", type: "textarea", placeholder: "舞台剧的故事..." },
          { id: "acts", label: "幕数", type: "select", options: ["独幕剧", "两幕剧", "三幕剧", "多幕剧"] },
          { id: "stage_type", label: "舞台类型", type: "select", options: ["镜框式", "圆形", "黑盒", "露天"] }
        ]
      },

      commercial_agent: {
        id: "commercial_agent",
        name: "广告脚本",
        agentName: "commercial-agent",
        category: "audio",
        icon: "fa-bullhorn",
        color: "orange-400",
        description: "产品卖点设计",
        features: ["创意概念", "卖点提炼", "情感共鸣", "行动号召"],
        systemPrompt: "你是广告脚本专家，精通产品卖点设计。你能够帮助用户创作广告脚本，包括创意概念、卖点提炼、情感共鸣、行动号召等。",
        inputFields: [
          { id: "product", label: "产品", type: "text", placeholder: "产品名称和特点..." },
          { id: "target", label: "目标受众", type: "textarea", placeholder: "目标受众画像..." },
          { id: "duration", label: "时长", type: "select", options: ["15秒", "30秒", "60秒", "90秒以上"] }
        ]
      },

      suno_music_agent: {
        id: "suno_music_agent",
        name: "AI音乐",
        agentName: "suno-music-agent",
        category: "audio",
        icon: "fa-music",
        color: "pink-400",
        description: "Suno音乐生成",
        features: ["歌词创作", "风格设计", "情感表达", "编曲建议"],
        systemPrompt: "你是Suno AI音乐专家，精通AI音乐生成。你能够帮助用户创作歌词、设计音乐风格、生成Suno提示词等。",
        inputFields: [
          { id: "theme", label: "主题", type: "text", placeholder: "音乐的主题..." },
          { id: "genre", label: "风格", type: "select", options: ["流行", "摇滚", "民谣", "电子", "古典", "说唱", "爵士"] },
          { id: "mood", label: "情绪", type: "select", options: ["欢快", "悲伤", "激昂", "温柔", "神秘", "浪漫"] }
        ]
      },

      comic_creator_agent: {
        id: "comic_creator_agent",
        name: "漫画创作",
        agentName: "comic-creator-agent",
        category: "visual",
        icon: "fa-image",
        color: "red-400",
        description: "多格漫画生成",
        features: ["分镜设计", "角色设计", "对白气泡", "画面构图"],
        systemPrompt: "你是漫画创作专家，精通多格漫画生成。你能够帮助用户创作漫画，包括分镜设计、角色设计、对白气泡、画面构图等。",
        inputFields: [
          { id: "story", label: "故事", type: "textarea", placeholder: "漫画的故事内容..." },
          { id: "panels", label: "格数", type: "number", default: 4 },
          { id: "style", label: "风格", type: "select", options: ["日漫", "美漫", "国漫", "条漫", "四格漫画"] }
        ]
      },

      animation_creator_agent: {
        id: "animation_creator_agent",
        name: "动画创作",
        agentName: "animation-creator-agent",
        category: "visual",
        icon: "fa-wand-sparkles",
        color: "purple-300",
        description: "动画脚本生成",
        features: ["分镜脚本", "关键帧", "动作设计", "时间轴"],
        systemPrompt: "你是动画创作专家，精通动画脚本生成。你能够帮助用户创作动画脚本，包括分镜脚本、关键帧设计、动作设计、时间轴规划等。",
        inputFields: [
          { id: "concept", label: "概念", type: "textarea", placeholder: "动画的核心概念..." },
          { id: "type", label: "类型", type: "select", options: ["2D动画", "3D动画", "定格动画", "MG动画"] },
          { id: "duration", label: "时长", type: "select", options: ["短视频(1分钟内)", "中视频(1-5分钟)", "长视频(5分钟以上)"] }
        ]
      },

      nanobanana_grid_agent: {
        id: "nanobanana_grid_agent",
        name: "AI绘图网格",
        agentName: "nanobanana-grid-agent",
        category: "visual",
        icon: "fa-th",
        color: "cyan-300",
        description: "多面板生成",
        features: ["网格布局", "角色一致", "场景连续", "AI提示词"],
        systemPrompt: "你是AI绘图网格专家，精通多面板生成。你能够帮助用户生成AI绘图提示词，创建网格布局的角色图、场景图等。",
        inputFields: [
          { id: "subject", label: "主体", type: "text", placeholder: "绘图的主体..." },
          { id: "grid", label: "网格", type: "select", options: ["2格", "4格", "6格", "8格", "9格", "12格", "16格"] },
          { id: "style", label: "风格", type: "select", options: ["写实", "动漫", "插画", "水彩", "油画", "赛博朋克"] }
        ]
      }
    },

    getAgentsByCategory(category) {
      return Object.values(this.agents).filter(agent => agent.category === category);
    },

    getAgent(id) {
      return this.agents[id];
    },

    getAllAgents() {
      return Object.values(this.agents);
    },

    getCategoryInfo(category) {
      return this.categories[category];
    },

    generateSidebar() {
      const container = document.getElementById('sidebar-agents-container');
      if (!container) return;

      // 精简版侧边栏 - 只保留核心入口
      const coreAgents = [
        { id: 'narrative_engine', name: '叙事引擎', icon: 'fa-book', desc: '智能写作助手' },
        { id: 'outline_agent', name: '大纲生成', icon: 'fa-list-ol', desc: '故事大纲规划' },
        { id: 'character_design_agent', name: '角色设计', icon: 'fa-user-pen', desc: '角色创建发展' },
        { id: 'worldbuilding_agent', name: '世界观', icon: 'fa-globe', desc: '世界设定构建' },
        { id: 'polish_agent', name: '文本润色', icon: 'fa-sparkles', desc: '去AI化润色' },
        { id: 'script_creator_agent', name: '剧本创作', icon: 'fa-clapperboard', desc: '影视剧本生成' },
        { id: 'storyboard_agent', name: '分镜设计', icon: 'fa-images', desc: '镜头画面规划' },
        { id: 'comic_creator_agent', name: '漫画创作', icon: 'fa-image', desc: '多格漫画生成' },
        { id: 'suno_music_agent', name: 'AI音乐', icon: 'fa-music', desc: 'Suno音乐生成' }
      ];

      let html = '<div class="sidebar-section-title">AI创作</div>';
      
      coreAgents.forEach(agent => {
        html += `
          <div class="sidebar-item" onclick="App.nav('${agent.id}')" title="${agent.desc}">
            <i class="fa-solid ${agent.icon}"></i>
            <span>${agent.name}</span>
          </div>
        `;
      });

      container.innerHTML = html;
    },

    toggleCategory(categoryKey) {
      const category = document.querySelector(`.sidebar-category[data-category="${categoryKey}"]`);
      if (category) {
        category.classList.toggle('collapsed');
      }
    }
  };

  window.AgentConfigs = AgentConfigs;

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (typeof AgentConfigs !== 'undefined') {
        AgentConfigs.generateSidebar();
      }
    }, 100);
  });
})();
