// ============================================
// 万能工坊 (workshop) - 旗舰版 v3
// 深度绑定: 凤凰创作流 · 长篇执笔 · 世界引擎 · 融合拆书 · 创意工坊
// 工具: 全能拆解 · 无限融合 · 无限仿写 · 逻辑纠错 · 自媒体文案 · 短篇辅助 · 跨模块联动 · 批量流水线
// ============================================
Modules.workshop = {
    currentTool: 'split',
    currentSubMode: 'plot',
    fusionInputs: 2,
    history: [],
    favorites: [],
    compareSlots: { a: '', b: '' },
    chainMode: false,

    tools: {
        split:    { name: '全能拆解', icon: 'fa-scissors',        color: 'amber' },
        fusion:   { name: '无限融合', icon: 'fa-blender',         color: 'purple' },
        imitate:  { name: '无限仿写', icon: 'fa-copy',            color: 'pink' },
        logic:    { name: '逻辑纠错', icon: 'fa-check-double',    color: 'cyan' },
        media:    { name: '自媒体文案', icon: 'fa-hashtag',        color: 'red' },
        shortaid: { name: '短篇辅助', icon: 'fa-feather-pointed', color: 'green' },
        crossmod: { name: '跨模块联动', icon: 'fa-link',          color: 'blue' },
        pipeline: { name: '批量流水线', icon: 'fa-industry',       color: 'indigo' }
    },

    splitModes: {
        structure: { name: '循环结构分析', icon: 'fa-rotate' },
        plot:      { name: '情节脉络提取', icon: 'fa-timeline' },
        char:      { name: '人物弧光拆解', icon: 'fa-user-group' },
        emotion:   { name: '情绪价值评估', icon: 'fa-face-smile' },
        tech:      { name: '写作手法鉴赏', icon: 'fa-pen-fancy' },
        rhythm:    { name: '叙事节奏分析', icon: 'fa-wave-square' },
        dialogue:  { name: '对话技巧拆解', icon: 'fa-comments' },
        worldbuild:{ name: '世界观架构', icon: 'fa-globe' },
        hook:      { name: '钩子悬念分析', icon: 'fa-anchor' },
        climax:    { name: '高潮设计拆解', icon: 'fa-bolt' },
        conflict:  { name: '冲突层次分析', icon: 'fa-bolt-lightning' },
        pov:       { name: '视角叙事分析', icon: 'fa-eye' },
        symbol:    { name: '意象符号解读', icon: 'fa-yin-yang' },
        compare:   { name: '对比拆解模式', icon: 'fa-code-compare' },
        deep:      { name: '深度全维分析', icon: 'fa-microscope' }
    },
    imitateModes: {
        style:     { name: '风格迁移', icon: 'fa-paintbrush' },
        structure: { name: '句式重构', icon: 'fa-paragraph' },
        deep:      { name: '深度仿写', icon: 'fa-brain' },
        reverse:   { name: '反向仿写', icon: 'fa-rotate' },
        blend:     { name: '风格融合', icon: 'fa-blender' },
        upgrade:   { name: '文笔升级', icon: 'fa-arrow-up' },
        tone:      { name: '语气转换', icon: 'fa-comment' },
        era:       { name: '时代风格', icon: 'fa-clock-rotate-left' },
        genre:     { name: '类型转换', icon: 'fa-masks-theater' },
        emotion:   { name: '情感重写', icon: 'fa-heart' },
        simplify:  { name: '简化精炼', icon: 'fa-minimize' },
        expand:    { name: '扩写丰富', icon: 'fa-maximize' }
    },
    mediaModes: {
        xhs:    { name: '小红书爆款', icon: 'fa-book-open' },
        tiktok: { name: '抖音脚本', icon: 'fa-video' },
        wx:     { name: '公众号深度', icon: 'fa-newspaper' },
        weibo:  { name: '微博热搜', icon: 'fa-fire' },
        blurb:  { name: '书评/推文', icon: 'fa-quote-left' },
        zhihu:  { name: '知乎回答', icon: 'fa-z' },
        bilibili:{ name: 'B站文案', icon: 'fa-play' },
        xiaohongshu:{ name: '小红书种草', icon: 'fa-leaf' },
        toutiao:{ name: '头条爆款', icon: 'fa-heading' },
        video:  { name: '短视频脚本', icon: 'fa-film' }
    },
    shortaidModes: {
        expand:    { name: '段落扩写', icon: 'fa-expand' },
        compress:  { name: '精简压缩', icon: 'fa-compress' },
        rewrite:   { name: '换风格重写', icon: 'fa-arrows-rotate' },
        hook:      { name: '开头钩子', icon: 'fa-fish-fins' },
        ending:    { name: '结尾设计', icon: 'fa-flag-checkered' },
        title_gen: { name: '标题生成', icon: 'fa-heading' },
        dialogue:  { name: '对话优化', icon: 'fa-comments' },
        scene:     { name: '场景描写', icon: 'fa-image' },
        character: { name: '人物刻画', icon: 'fa-user-pen' },
        transition:{ name: '过渡衔接', icon: 'fa-right-left' },
        sensory:   { name: '感官描写', icon: 'fa-eye' },
        subtext:   { name: '潜台词设计', icon: 'fa-mask' }
    },
    // 跨模块联动模式
    crossModModes: {
        phoenix_outline:  { name: '凤凰大纲→拆解', icon: 'fa-fire-flame-curved', desc: '拉取凤凰创作流大纲进行深度拆解分析' },
        writer_chapter:   { name: '执笔章节→润色', icon: 'fa-feather-pointed', desc: '拉取长篇执笔章节进行润色/扩写/纠错' },
        world_entity:     { name: '世界实体→扩展', icon: 'fa-atom', desc: '拉取世界引擎实体进行深度扩展和关联分析' },
        fusion_result:    { name: '融合精华→再创', icon: 'fa-book-open-reader', desc: '拉取融合拆书结果进行二次创作' },
        creative_draft:   { name: '创意草稿→完善', icon: 'fa-wand-magic-sparkles', desc: '拉取创意工坊草稿进行完善和升级' },
        world_to_phoenix: { name: '世界观→大纲生成', icon: 'fa-globe', desc: '基于世界引擎数据自动生成凤凰创作流大纲' },
        chapter_to_entity:{ name: '章节→实体提取', icon: 'fa-magnifying-glass', desc: '从章节正文中自动提取实体存入世界引擎' },
        full_context:     { name: '全局上下文汇总', icon: 'fa-layer-group', desc: '汇总所有模块数据生成完整创作上下文' }
    },
    // 流水线预设
    pipelinePresets: [
        { name: '大纲→拆解→融合→正文', steps: ['phoenix_outline','split','fusion','writer_chapter'], desc: '从凤凰大纲出发，拆解分析后融合优化，最终生成正文' },
        { name: '章节→纠错→润色→存档', steps: ['writer_chapter','logic','imitate_upgrade','save'], desc: '章节质量提升全流程' },
        { name: '世界观→实体扩展→大纲', steps: ['world_entity','crossmod_expand','phoenix_gen'], desc: '从世界观出发构建完整大纲' },
        { name: '融合精华→仿写→自媒体', steps: ['fusion_result','imitate','media'], desc: '融合拆书结果转化为自媒体内容' }
    ],
    _customPipelines: [],
    _editingPipeline: null,  // { name, desc, steps: [{type, prompt}] }

    templates: {
        split: [
            { name: '网文爽文拆解', text: '请从爽点设计、节奏控制、读者情绪曲线三个维度拆解这段网文：' },
            { name: '纯文学鉴赏', text: '请从意象运用、叙事技巧、语言美学、主题深度四个维度鉴赏这段文学作品：' },
            { name: '悬疑推理拆解', text: '请分析这段悬疑文本的伏笔设置、线索编排、误导技巧和揭秘节奏：' }
        ],
        fusion: [
            { name: '设定融合', text: '将以下不同世界观的设定元素有机融合，创造一个全新的、自洽的世界观：' },
            { name: '角色融合', text: '将以下角色的性格特质、背景故事进行融合，创造一个全新的复合型角色：' },
            { name: '情节嫁接', text: '将以下不同故事的情节结构进行嫁接融合，生成一个全新的故事大纲：' }
        ],
        imitate: [
            { name: '鲁迅风格', text: '请用鲁迅式的冷峻讽刺笔法改写以下内容，注意运用反语和隐喻：' },
            { name: '金庸武侠', text: '请用金庸式的武侠笔法改写以下内容，注意招式描写和江湖气息：' },
            { name: '村上春树', text: '请用村上春树式的都市文学风格改写，注意孤独感和超现实元素：' }
        ],
        logic: [
            { name: '时间线检查', text: '请严格检查以下文本中的时间线是否自洽，标注所有时间矛盾：' },
            { name: '人设一致性', text: '请检查以下文本中角色的言行是否与其人设一致，标注所有人设崩塌之处：' },
            { name: '设定矛盾检测', text: '请检查以下文本中的世界观设定是否前后一致，标注所有设定矛盾：' }
        ]
    },

    defaultPrompts: {
        ts_structure: "分析以下文本的循环结构和叙事节奏：",
        ts_plot: "拆解以下文本的核心情节脉络（起承转合）：",
        ts_char: "拆解以下文本的人物性格、弧光和关系：",
        ts_emotion: "分析以下文本的情绪流动和调动技巧：",
        ts_tech: "分析以下文本的修辞、视角和写作手法：",
        ts_rhythm: "分析以下文本的叙事节奏——快慢交替、张弛有度的节奏设计：",
        ts_dialogue: "拆解以下文本中对话的技巧——潜台词、性格化语言、信息传递效率：",
        ts_worldbuild: "分析以下文本的世界观架构——规则体系、层次设计、沉浸感营造：",
        ts_hook: "分析以下文本的钩子和悬念设计——开篇钩子、章末钩子、伏笔埋设：",
        ts_climax: "拆解以下文本的高潮设计——铺垫、爆发、释放三阶段分析：",
        ts_conflict: "分析以下文本的冲突层次——表面冲突、深层冲突、内心冲突：",
        ts_pov: "分析以下文本的视角叙事——视角选择、视角切换、信息控制：",
        ts_symbol: "解读以下文本的意象符号——核心意象、象征意义、反复出现：",
        ts_compare: "对比分析以下文本的写作特点，标注优缺点：",
        ts_deep: "对以下文本进行全方位深度分析——结构、情节、人物、文笔、节奏、情感、技巧：",
        logic: "请深度分析以下文本中的逻辑漏洞、时间线冲突和设定矛盾：\n\n{{input}}",
        fusion: "请将以下多个素材进行创意融合，生成全新的设定/情节：\n\n{{input}}",
        imitate_style: "请分析参考范文的文风、句式、修辞和节奏，然后用相同的风格改写/扩写用户提供的内容。\n\n[参考范文]\n{{ref}}\n\n[待写内容]\n{{input}}",
        imitate_structure: "请保留待写内容的含义，但完全采用参考范文的句式结构进行重写。\n\n[参考范文]\n{{ref}}\n\n[待写内容]\n{{input}}",
        imitate_deep: "请深度解析参考范文的内在逻辑和情感流动，以此为内核重构待写内容。\n\n[参考范文]\n{{ref}}\n\n[待写内容]\n{{input}}",
        imitate_reverse: "请分析参考范文的风格，然后用完全相反的风格改写以下内容。\n\n[参考范文]\n{{ref}}\n\n[待写内容]\n{{input}}",
        imitate_blend: "请分析参考范文A和B的风格特点，将两种风格有机融合后改写待写内容。\n\n[范文A]\n{{ref}}\n\n[范文B]\n{{ref2}}\n\n[待写内容]\n{{input}}",
        imitate_upgrade: "请在保持原文核心含义的基础上，大幅提升文笔质量、修辞水平和表现力。\n\n[原文]\n{{input}}",
        imitate_tone: "请将以下文本的语气转换为指定语气（幽默/严肃/轻松/煽情/讽刺）：\n\n{{input}}",
        imitate_era: "请将以下文本改写为指定时代的风格（古风/民国/现代/未来）：\n\n{{input}}",
        imitate_genre: "请将以下文本转换为指定类型的风格（玄幻/都市/科幻/悬疑/言情）：\n\n{{input}}",
        imitate_emotion: "请为以下文本注入指定情感（热血/治愈/悲伤/恐惧/甜蜜）：\n\n{{input}}",
        imitate_simplify: "请将以下文本精简提炼，保留核心信息，去除冗余：\n\n{{input}}",
        imitate_expand: "请将以下文本扩写丰富，增加细节描写和感官体验：\n\n{{input}}"
    },

    render: () => {
        const W = Modules.workshop;
        const t = W.currentTool;
        const info = W.tools[t];
        return `
        <div class="flex h-full bg-white overflow-hidden">
            <div class="w-72 shrink-0 flex flex-col bg-white border-r border-gray-200 overflow-hidden" id="ws-sidebar">
                <div class="p-4 border-b border-gray-200 flex items-center gap-2 bg-gradient-to-r from-amber-900/20 to-transparent">
                    <div class="w-8 h-8 rounded-lg bg-amber-600/20 flex center text-amber-500 border border-amber-600/40"><i class="fa-solid fa-hammer"></i></div>
                    <div>
                        <span class="font-bold text-base text-gray-800">万能工坊</span>
                        <div class="text-xs text-gray-600 font-bold">拆解 · 融合 · 仿写 · 联动 · 流水线</div>
                    </div>
                </div>
                <div class="p-2 grid grid-cols-2 gap-1.5">
                    ${Object.entries(W.tools).map(([k,v]) => `
                        <button class="btn h-10 rounded-lg justify-start px-3 gap-1.5 transition-all ${t===k ? 'bg-gradient-to-r from-'+v.color+'-500 to-'+v.color+'-600 text-white border-2 border-'+v.color+'-400 shadow-lg shadow-'+v.color+'-500/30' : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200'}" onclick="Modules.workshop.switchTool('${k}')">
                            <i class="fa-solid ${v.icon} text-sm"></i>
                            <span class="text-xs font-bold">${v.name}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="border-t border-gray-200"></div>
                <div class="flex-1 overflow-y-auto p-2 space-y-1" id="ws-submodes">${W._renderSubModes()}</div>
                <div class="border-t border-gray-200 p-2">
                    <div class="text-xs font-bold text-gray-700 flex items-center gap-2 px-2 mb-2">
                            <i class="fa-solid fa-bookmark text-amber-400"></i>
                            快捷模板
                        </div>
                    <div class="space-y-1 max-h-24 overflow-y-auto" id="ws-templates">
                        ${(W.templates[t] || []).map((tpl, i) => `
                            <button class="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100 truncate border border-gray-200 hover:border-amber-300 transition-all" onclick="Modules.workshop.applyTemplate(${i})" title="${tpl.text}">
                                <i class="fa-solid fa-bookmark text-${info.color}-400 mr-1.5"></i>
                                <span class="font-bold">${tpl.name}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div class="border-t border-gray-200 p-2 space-y-1">
                    <div class="flex gap-1">
                        <button class="btn py-2 flex-1 ${W.chainMode ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-2 border-amber-400 shadow-lg shadow-amber-500/30' : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-amber-300'} transition-all rounded-lg" onclick="Modules.workshop.toggleChain()">
                            <i class="fa-solid fa-link mr-1.5"></i>
                            <span class="text-xs font-bold">链式</span>
                        </button>
                        <button class="btn py-2 flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-400 hover:to-gray-500 text-white border-none shadow-lg shadow-gray-500/30 hover:shadow-gray-500/50 transition-all rounded-lg" onclick="Modules.workshop.showHistory()">
                            <i class="fa-solid fa-clock-rotate-left mr-1.5"></i>
                            <span class="text-xs font-bold">历史</span>
                        </button>
                        <button class="btn py-2 flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white border-none shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all rounded-lg" onclick="Modules.workshop.showCompare()">
                            <i class="fa-solid fa-code-compare mr-1.5"></i>
                            <span class="text-xs font-bold">对比</span>
                        </button>
                    </div>
                </div>
            </div>
            <div class="flex-1 flex flex-col overflow-hidden min-w-0">
                <div id="ws-workspace" class="flex-1 flex flex-col overflow-hidden">${W._renderWorkspace()}</div>
            </div>
        </div>`;
    },

    _renderSubModes: () => {
        const W = Modules.workshop;
        const t = W.currentTool;
        const modeMap = { split: W.splitModes, imitate: W.imitateModes, media: W.mediaModes, shortaid: W.shortaidModes };
        const colorMap = { split:'amber', imitate:'pink', media:'red', shortaid:'green' };
        const promptPrefixMap = { split:'ts_', imitate:'imitate_' };

        if (modeMap[t]) {
            const c = colorMap[t];
            return Object.entries(modeMap[t]).map(([k,v]) => `
                <div class="flex items-center gap-1">
                    <button class="btn flex-1 justify-start text-left px-3 h-10 rounded-lg text-xs transition-all ${W.currentSubMode===k ? 'bg-gradient-to-r from-'+c+'-500 to-'+c+'-600 text-white border-2 border-'+c+'-400 shadow-lg shadow-'+c+'-500/30' : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200'}" onclick="Modules.workshop.setSubMode('${k}')">
                        <i class="fa-solid ${v.icon} mr-2"></i>
                        <span class="text-xs font-bold">${v.name}</span>
                    </button>
                    ${promptPrefixMap[t] ? `<button class="btn btn-icon w-8 h-8 rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-400 hover:to-gray-500 text-white shadow-lg" onclick="Modules.short.openPromptModal('${promptPrefixMap[t]}${k}')"><i class="fa-solid fa-gear text-xs"></i></button>` : ''}
                </div>
            `).join('');
        }
        if (t === 'fusion') {
            return `<button class="btn w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white border-none shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.workshop.addFusionInput()">
                        <i class="fa-solid fa-plus mr-2"></i>
                        <span class="text-sm font-bold">增加素材槽</span>
                    </button>
                <button class="btn w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white border-none shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.short.openPromptModal('fusion')">
                        <i class="fa-solid fa-gear mr-2"></i>
                        <span class="text-sm font-bold">配置融合逻辑</span>
                    </button>
                <div class="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                        <div class="flex items-start gap-2">
                            <i class="fa-solid fa-lightbulb text-purple-400 text-base mt-0.5"></i>
                            <span class="text-xs text-gray-700 font-bold leading-relaxed">支持从各模块导入素材到融合槽</span>
                        </div>
                    </div>`;
        }
        if (t === 'logic') {
            return `<button class="btn w-full py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-400 hover:to-gray-500 text-white border-none shadow-lg shadow-gray-500/30 hover:shadow-gray-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.short.openPromptModal('logic')">
                        <i class="fa-solid fa-gear mr-2"></i>
                        <span class="text-sm font-bold">配置检测提示词</span>
                    </button>
                <div class="p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border-2 border-cyan-200">
                        <div class="flex items-start gap-2">
                            <i class="fa-solid fa-magnifying-glass text-cyan-400 text-base mt-0.5"></i>
                            <span class="text-xs text-gray-700 font-bold leading-relaxed">支持从长篇执笔直接拉取章节检测</span>
                        </div>
                    </div>`;
        }
        if (t === 'crossmod') {
            return Object.entries(W.crossModModes).map(([k,v]) => `
                <button class="btn w-full justify-start text-left px-3 h-11 rounded-lg text-xs transition-all ${W.currentSubMode===k ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-2 border-blue-400 shadow-lg shadow-blue-500/30' : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200'}" onclick="Modules.workshop.setSubMode('${k}')" title="${v.desc}">
                    <i class="fa-solid ${v.icon} mr-2"></i>
                    <span class="text-xs font-bold">${v.name}</span>
                </button>
            `).join('') + `<div class="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200">
                        <div class="flex items-start gap-2">
                            <i class="fa-solid fa-link text-blue-400 text-base mt-0.5"></i>
                            <span class="text-xs text-gray-700 font-bold leading-relaxed">深度联动各创作模块，数据自由流转</span>
                        </div>
                    </div>`;
        }
        if (t === 'pipeline') {
            return `<div class="text-xs font-bold text-gray-700 flex items-center gap-2 px-2 mb-2">
                            <i class="fa-solid fa-industry text-indigo-400"></i>
                            预设流水线
                        </div>` +
                W.pipelinePresets.map((p, i) => `
                    <button class="btn w-full justify-start text-left px-4 py-3 rounded-lg text-xs bg-white text-gray-700 hover:bg-indigo-50 border-2 border-gray-200 hover:border-indigo-300 transition-all" onclick="Modules.workshop.loadPipelinePreset(${i})">
                        <div class="flex items-center gap-2 mb-1">
                            <i class="fa-solid fa-industry text-indigo-400"></i>
                            <span class="font-bold">${p.name}</span>
                        </div>
                        <div class="text-xs text-gray-600">${p.desc}</div>
                    </button>
                `).join('') +
                `<div class="border-t border-gray-200 my-2"></div>
                <div class="text-xs font-bold text-gray-700 flex items-center gap-2 px-2 mb-2">
                            <i class="fa-solid fa-sliders text-emerald-400"></i>
                            自定义流水线
                        </div>` +
                (W._customPipelines.length ? W._customPipelines.map((p, i) => `
                    <div class="flex items-center gap-1 group">
                        <button class="btn flex-1 justify-start text-left px-3 py-2 rounded-lg text-[10px] bg-gray-100 text-dim hover:bg-emerald-500/10 hover:text-emerald-400 border border-transparent hover:border-emerald-500/20 transition-all" onclick="Modules.workshop._loadCustomPipeline(${i})">
                            <div><i class="fa-solid fa-wand-magic-sparkles mr-1 text-emerald-400/60"></i>${p.name}</div>
                            <div class="text-[8px] text-dim/60 mt-0.5">${p.desc || p.steps.length + '步'}</div>
                        </button>
                        <button class="btn btn-icon w-8 h-8 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white shadow-lg opacity-0 group-hover:opacity-100 shrink-0 transition-all" onclick="Modules.workshop._deleteCustomPipeline(${i})"><i class="fa-solid fa-trash text-xs"></i></button>
                    </div>
                `).join('') : '<div class="text-xs text-gray-500 font-bold text-center py-3 bg-gray-50 rounded-lg border-2 border-gray-200">暂无自定义流水线</div>') +
                `<button class="btn w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg h-8 text-[10px] font-bold mt-1" onclick="Modules.workshop._newCustomPipeline()"><i class="fa-solid fa-plus mr-1"></i>新建自定义流水线</button>
                <div class="text-[9px] text-dim bg-indigo-500/5 p-2 rounded-lg border border-indigo-500/10 mt-1"><strong class="text-indigo-400">⚡</strong> 多步骤自动执行，结果逐级传递</div>`;
        }
        return '';
    },

    // ===== 导入按钮条 =====
    _renderImportBar: () => {
        return `<div class="flex gap-1 flex-wrap">
            <span class="text-[8px] text-dim uppercase tracking-wider self-center mr-1">从模块导入:</span>
            <button class="btn btn-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20" onclick="Modules.workshop._importFrom('phoenix')"><i class="fa-solid fa-fire-flame-curved mr-1"></i>凤凰大纲</button>
            <button class="btn btn-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20" onclick="Modules.workshop._importFrom('writer')"><i class="fa-solid fa-feather-pointed mr-1"></i>当前章节</button>
            <button class="btn btn-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20" onclick="Modules.workshop._importFrom('world')"><i class="fa-solid fa-atom mr-1"></i>世界实体</button>
            <button class="btn btn-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20" onclick="Modules.workshop._importFrom('fusion')"><i class="fa-solid fa-book-open-reader mr-1"></i>融合结果</button>
            <button class="btn btn-xs bg-pink-500/10 text-pink-400 border border-pink-500/20 hover:bg-pink-500/20" onclick="Modules.workshop._importFrom('creative')"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>创意草稿</button>
        </div>`;
    },

    // ===== 结果推送按钮条 =====
    _renderPushBar: () => {
        return `<div class="flex gap-1 flex-wrap mt-1">
            <span class="text-[8px] text-dim uppercase tracking-wider self-center mr-1">推送到:</span>
            <button class="btn btn-xs bg-orange-500/10 text-orange-300 border border-orange-500/20" onclick="Modules.workshop._pushTo('phoenix')"><i class="fa-solid fa-fire-flame-curved mr-1"></i>凤凰流</button>
            <button class="btn btn-xs bg-yellow-500/10 text-yellow-300 border border-yellow-500/20" onclick="Modules.workshop._pushTo('writer')"><i class="fa-solid fa-feather-pointed mr-1"></i>执笔台</button>
            <button class="btn btn-xs bg-blue-500/10 text-blue-300 border border-blue-500/20" onclick="Modules.workshop._pushTo('world')"><i class="fa-solid fa-atom mr-1"></i>世界引擎</button>
            <button class="btn btn-xs bg-green-500/10 text-green-300 border border-green-500/20" onclick="Modules.workshop._pushTo('library')"><i class="fa-solid fa-book mr-1"></i>阅读中心</button>
            <button class="btn btn-xs bg-teal-500/10 text-teal-300 border border-teal-500/20" onclick="Modules.workshop._pushTo('rag')"><i class="fa-solid fa-magnifying-glass mr-1"></i>RAG</button>
            <button class="btn btn-xs bg-rose-500/10 text-rose-300 border border-rose-500/20" onclick="Modules.workshop._pushTo('memory')"><i class="fa-solid fa-brain mr-1"></i>记忆</button>
        </div>`;
    },

    _renderOutputArea: () => {
        const W = Modules.workshop;
        const c = W.tools[W.currentTool].color;
        return `
            <div class="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col min-h-[200px] relative overflow-hidden">
                <div class="flex justify-between items-center px-4 py-2 border-b border-gray-200 bg-gray-100 shrink-0">
                    <span class="font-bold text-xs text-${c}-400 flex items-center gap-2"><i class="fa-solid fa-file-waveform"></i>生成结果</span>
                    <div class="flex gap-1">
                        <button class="btn btn-xs bg-gray-100 hover:bg-gray-200 text-dim rounded" onclick="Modules.workshop.continueRun()" title="继续"><i class="fa-solid fa-play mr-1"></i>继续</button>
                        <button class="btn btn-xs bg-gray-100 hover:bg-gray-200 text-dim rounded" onclick="Modules.workshop.saveToCompare('a')"><i class="fa-solid fa-a"></i></button>
                        <button class="btn btn-xs bg-gray-100 hover:bg-gray-200 text-dim rounded" onclick="Modules.workshop.saveToCompare('b')"><i class="fa-solid fa-b"></i></button>
                        <button class="btn btn-xs bg-gray-100 hover:bg-gray-200 text-dim rounded" onclick="Modules.workshop.addToFavorites()"><i class="fa-solid fa-star"></i></button>
                        <button class="btn btn-xs bg-gray-100 hover:bg-gray-200 text-dim rounded" onclick="document.getElementById('ws-io').classList.toggle('hidden')"><i class="fa-solid fa-terminal"></i></button>
                        <button class="btn btn-xs bg-gray-100 hover:bg-gray-200 text-dim rounded" onclick="Utils.copy(document.getElementById('ws-out').innerText||document.getElementById('ws-out').value)"><i class="fa-solid fa-copy"></i></button>
                    </div>
                </div>
                ${W._renderPushBar()}
                <div id="ws-out" class="flex-1 text-gray-700 leading-loose text-sm overflow-y-auto p-5 markdown-body"></div>
                <div id="ws-io" class="hidden absolute top-10 left-0 right-0 bottom-0 bg-[#F1F3F5] border-t border-gray-200 p-3 z-20 flex flex-col">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-xs font-bold text-dim">IO 调试</span>
                        <button class="btn btn-icon w-6 h-6 hover:bg-gray-200 rounded text-dim" onclick="document.getElementById('ws-io').classList.add('hidden')"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="flex-1 grid grid-cols-2 gap-2 min-h-0">
                        <textarea id="ws-io-in" class="bg-gray-100 border border-gray-200 rounded p-2 text-[10px] text-gray-400 font-mono resize-none" readonly></textarea>
                        <textarea id="ws-io-out" class="bg-gray-100 border border-gray-200 rounded p-2 text-[10px] text-green-400 font-mono resize-none" readonly></textarea>
                    </div>
                </div>
            </div>`;
    },

    _renderWorkspace: () => {
        const W = Modules.workshop;
        const t = W.currentTool;
        const c = W.tools[t].color;
        const outputArea = W._renderOutputArea();
        const importBar = W._renderImportBar();

        if (t === 'split' || t === 'logic') {
            return `<div class="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                <div class="bg-white rounded-xl border border-gray-200 focus-within:border-${c}-500/50">
                    <div class="px-3 pt-2">${importBar}</div>
                    <textarea id="ws-in" class="w-full bg-transparent border-none p-4 text-sm text-gray-700 focus:outline-none resize-none h-32 placeholder-white/20 leading-relaxed" placeholder="${t==='split'?'在此粘贴需要拆解的原文片段...':'在此粘贴需要检测逻辑的文本...'}"></textarea>
                    <div class="px-3 pb-2 flex justify-between items-center">
                        <div class="flex gap-1">
                            <button class="btn btn-xs bg-gray-100 hover:bg-gray-200 text-dim rounded" onclick="document.getElementById('ws-in').value=''"><i class="fa-solid fa-eraser mr-1"></i>清空</button>
                            <button class="btn btn-xs bg-gray-100 hover:bg-gray-200 text-dim rounded" onclick="Modules.workshop.pasteFromClipboard()"><i class="fa-solid fa-paste mr-1"></i>粘贴</button>
                        </div>
                        <button class="btn btn-sm bg-${c}-600 hover:bg-${c}-500 text-gray-800 rounded-lg px-5 font-bold shadow-lg shadow-${c}-500/20" onclick="Modules.workshop.run()">${t==='split'?'开始拆解':'开始诊断'} <i class="fa-solid fa-bolt ml-1"></i></button>
                    </div>
                </div>
                ${outputArea}
            </div>`;
        }
        if (t === 'imitate') {
            const isBlend = W.currentSubMode === 'blend';
            const isUpgrade = W.currentSubMode === 'upgrade';
            return `<div class="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                ${isUpgrade ? `<div class="bg-white rounded-xl border border-gray-200 focus-within:border-pink-500/50">
                    <div class="px-3 pt-2 flex items-center gap-2"><span class="text-[10px] font-bold text-pink-400">待升级文本</span>${importBar}</div>
                    <textarea id="ws-in" class="w-full bg-transparent border-none p-4 text-sm text-gray-600 resize-none h-36 focus:outline-none" placeholder="粘贴需要升级文笔的文本..."></textarea>
                </div>` : `<div class="grid ${isBlend ? 'grid-cols-3' : 'grid-cols-2'} gap-3 min-h-[180px]">
                    <div class="bg-white rounded-xl border border-gray-200 flex flex-col focus-within:border-pink-500/50">
                        <div class="px-3 pt-2 border-b border-gray-200 bg-gray-100 rounded-t-xl"><span class="text-[10px] font-bold text-pink-400">参考范文${isBlend?' A':''}</span></div>
                        <textarea id="ws-ref" class="flex-1 bg-transparent border-none p-3 text-sm text-gray-600 resize-none focus:outline-none" placeholder="粘贴想要模仿的风格范文..."></textarea>
                    </div>
                    ${isBlend ? `<div class="bg-white rounded-xl border border-gray-200 flex flex-col focus-within:border-pink-500/50"><div class="px-3 pt-2 border-b border-gray-200 bg-gray-100 rounded-t-xl"><span class="text-[10px] font-bold text-purple-400">参考范文 B</span></div><textarea id="ws-ref2" class="flex-1 bg-transparent border-none p-3 text-sm text-gray-600 resize-none focus:outline-none" placeholder="粘贴第二个风格范文..."></textarea></div>` : ''}
                    <div class="bg-white rounded-xl border border-gray-200 flex flex-col focus-within:border-pink-500/50">
                        <div class="px-3 pt-2 border-b border-gray-200 bg-gray-100 rounded-t-xl flex items-center gap-2"><span class="text-[10px] font-bold text-dim">待写内容</span></div>
                        <textarea id="ws-in" class="flex-1 bg-transparent border-none p-3 text-sm text-gray-600 resize-none focus:outline-none" placeholder="输入你的故事梗概或原始文本..."></textarea>
                    </div>
                </div>
                <div class="flex justify-center">${importBar}</div>`}
                <div class="flex justify-center"><button class="btn h-10 px-8 rounded-lg bg-pink-600 hover:bg-pink-500 text-gray-800 font-bold shadow-lg shadow-pink-500/20" onclick="Modules.workshop.run()"><i class="fa-solid fa-wand-magic-sparkles mr-2"></i>开始仿写</button></div>
                ${outputArea}
            </div>`;
        }
        if (t === 'fusion') {
            return `<div class="flex-1 flex flex-col p-5 gap-3 overflow-hidden">
                <div class="shrink-0">${importBar}</div>
                <div class="flex gap-2 overflow-x-auto pb-2 min-h-[160px] shrink-0" id="ws-fusion-inputs"></div>
                <div class="flex justify-center shrink-0"><button class="btn h-10 px-8 rounded-lg bg-purple-600 hover:bg-purple-500 text-gray-800 font-bold shadow-lg shadow-purple-500/20" onclick="Modules.workshop.run()"><i class="fa-solid fa-wand-magic-sparkles mr-2"></i>立即融合</button></div>
                ${outputArea}
            </div>`;
        }
        if (t === 'media') {
            return `<div class="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                <div class="bg-white rounded-xl border border-gray-200 focus-within:border-red-500/50">
                    <div class="px-3 pt-2 flex items-center gap-2">
                        <span class="text-[10px] font-bold text-red-400">内容素材</span>
                        <select id="ws-media-tone" class="bg-gray-100 border border-gray-300 rounded px-2 py-0.5 text-[10px] text-gray-800"><option value="活泼">活泼俏皮</option><option value="专业">专业深度</option><option value="煽情">煽情走心</option><option value="搞笑">搞笑吐槽</option><option value="悬念">悬念钩子</option></select>
                        <div class="flex-1"></div>
                    </div>
                    <div class="px-3 py-1">${importBar}</div>
                    <textarea id="ws-in" class="w-full bg-transparent border-none p-4 text-sm text-gray-700 focus:outline-none resize-none h-32 placeholder-white/20" placeholder="粘贴小说片段、角色介绍、故事梗概等素材..."></textarea>
                    <div class="px-3 pb-2 flex justify-end"><button class="btn btn-sm bg-red-600 hover:bg-red-500 text-gray-800 rounded-lg px-5 font-bold" onclick="Modules.workshop.run()">生成文案 <i class="fa-solid fa-bolt ml-1"></i></button></div>
                </div>
                ${outputArea}
            </div>`;
        }
        if (t === 'shortaid') {
            return `<div class="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                <div class="bg-white rounded-xl border border-gray-200 focus-within:border-green-500/50">
                    <div class="px-3 pt-2">${importBar}</div>
                    <textarea id="ws-in" class="w-full bg-transparent border-none p-4 text-sm text-gray-700 focus:outline-none resize-none h-36 placeholder-white/20" placeholder="粘贴需要处理的短篇文本、段落或梗概..."></textarea>
                    <div class="px-3 pb-2 flex justify-end"><button class="btn btn-sm bg-green-600 hover:bg-green-500 text-gray-800 rounded-lg px-5 font-bold" onclick="Modules.workshop.run()">执行 <i class="fa-solid fa-bolt ml-1"></i></button></div>
                </div>
                ${outputArea}
            </div>`;
        }
        if (t === 'crossmod') return W._renderCrossModWorkspace();
        if (t === 'pipeline') return W._renderPipelineWorkspace();
        return '';
    },

    // ===== 跨模块联动工作区 =====
    _renderCrossModWorkspace: () => {
        const W = Modules.workshop;
        const mode = W.currentSubMode;
        const info = W.crossModModes[mode] || {};
        return `<div class="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
            <div class="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
                <div class="flex items-center gap-2 mb-2">
                    <i class="fa-solid ${info.icon || 'fa-link'} text-blue-400"></i>
                    <span class="text-sm font-bold text-blue-400">${info.name || '跨模块联动'}</span>
                </div>
                <p class="text-xs text-dim mb-3">${info.desc || ''}</p>
                <div class="flex gap-2">
                    <button class="btn h-9 px-5 bg-blue-600 hover:bg-blue-500 text-gray-800 rounded-lg font-bold text-xs" onclick="Modules.workshop.runCrossMod()"><i class="fa-solid fa-bolt mr-1"></i>执行联动</button>
                    <button class="btn h-9 px-4 bg-gray-100 hover:bg-gray-200 text-dim rounded-lg text-xs" onclick="Modules.workshop._previewCrossModData()"><i class="fa-solid fa-eye mr-1"></i>预览数据</button>
                </div>
            </div>
            <div class="bg-white rounded-xl border border-gray-200 focus-within:border-blue-500/50">
                <div class="px-3 pt-2"><span class="text-[10px] font-bold text-dim">附加输入 (可选)</span></div>
                <textarea id="ws-in" class="w-full bg-transparent border-none p-4 text-sm text-gray-700 focus:outline-none resize-none h-24 placeholder-white/20" placeholder="可以在此添加额外的指令或上下文..."></textarea>
            </div>
            ${W._renderOutputArea()}
        </div>`;
    },

    // ===== 批量流水线工作区 =====
    _pipelineStepTypes: {
        phoenix_outline: '凤凰大纲(拉取)',
        writer_chapter: '执笔章节(拉取)',
        world_entity: '世界实体(拉取)',
        fusion_result: '融合结果(拉取)',
        split: '拆解分析',
        logic: '逻辑纠错',
        fusion: '融合优化',
        imitate: '风格仿写',
        imitate_upgrade: '文笔升级',
        media: '自媒体文案',
        crossmod_expand: '深度扩展',
        phoenix_gen: '生成大纲',
        save: '保存到阅读中心',
        custom: '⚡ 自定义提示词'
    },
    _renderPipelineWorkspace: () => {
        const W = Modules.workshop;
        const editing = W._editingPipeline;
        return `<div class="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
            <div class="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4">
                <div class="flex items-center gap-2 mb-2">
                    <i class="fa-solid fa-industry text-indigo-400"></i>
                    <span class="text-sm font-bold text-indigo-400">批量流水线</span>
                    <span class="text-[9px] text-dim bg-gray-100 px-2 py-0.5 rounded">多步骤自动执行</span>
                </div>
                <p class="text-xs text-dim mb-3">从左侧选择预设或自定义流水线。每一步的结果会自动传递给下一步。</p>
                <div class="flex gap-2">
                    <button class="btn h-9 px-5 bg-indigo-600 hover:bg-indigo-500 text-gray-800 rounded-lg font-bold text-xs" onclick="Modules.workshop.runPipeline()"><i class="fa-solid fa-play mr-1"></i>运行流水线</button>
                </div>
            </div>
            ${editing ? W._renderPipelineEditor() : ''}
            <div class="bg-white rounded-xl border border-gray-200 p-3">
                <div class="text-[10px] font-bold text-dim mb-2">流水线步骤</div>
                <div id="ws-pipeline-steps" class="space-y-1.5">
                    <div class="text-[10px] text-dim/40 text-center py-4">从左侧选择预设流水线或新建自定义流水线</div>
                </div>
            </div>
            <div class="bg-white rounded-xl border border-gray-200 focus-within:border-indigo-500/50">
                <div class="px-3 pt-2"><span class="text-[10px] font-bold text-dim">初始输入</span></div>
                <textarea id="ws-in" class="w-full bg-transparent border-none p-4 text-sm text-gray-700 focus:outline-none resize-none h-24 placeholder-white/20" placeholder="流水线的初始输入内容（可选，部分流水线会自动从模块拉取数据）..."></textarea>
            </div>
            ${Modules.workshop._renderOutputArea()}
        </div>`;
    },

    _renderPipelineEditor: () => {
        const W = Modules.workshop;
        const e = W._editingPipeline;
        if (!e) return '';
        const types = W._pipelineStepTypes;
        return `<div class="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-emerald-400"><i class="fa-solid fa-pen-to-square mr-1"></i>编辑自定义流水线</span>
                <div class="flex gap-1">
                    <button class="btn btn-xs bg-emerald-600/20 text-emerald-400 border-emerald-600/30" onclick="Modules.workshop._saveCustomPipeline()"><i class="fa-solid fa-save mr-1"></i>保存</button>
                    <button class="btn btn-xs bg-gray-100 text-dim" onclick="Modules.workshop._editingPipeline=null;Modules.workshop._refreshPipelineWorkspace()"><i class="fa-solid fa-xmark mr-1"></i>取消</button>
                </div>
            </div>
            <div class="flex gap-2">
                <input id="ws-cp-name" class="input bg-gray-100 border-gray-300 text-gray-800 text-xs flex-1" placeholder="流水线名称" value="${e.name||''}">
                <input id="ws-cp-desc" class="input bg-gray-100 border-gray-300 text-gray-800 text-xs flex-1" placeholder="描述（可选）" value="${e.desc||''}">
            </div>
            <div class="space-y-2" id="ws-cp-steps">
                ${e.steps.map((s, i) => `
                <div class="flex items-start gap-2 bg-gray-100 rounded-lg p-2 border border-gray-200">
                    <span class="w-5 h-5 rounded-full bg-emerald-500/20 flex center text-[9px] text-emerald-400 font-bold shrink-0 mt-1">${i+1}</span>
                    <div class="flex-1 space-y-1">
                        <select class="input bg-gray-100 border-gray-300 text-gray-800 text-[10px] w-full ws-cp-type" onchange="Modules.workshop._onStepTypeChange(${i},this.value)">
                            ${Object.entries(types).map(([k,v]) => '<option value="'+k+'" '+(s.type===k?'selected':'')+'>'+v+'</option>').join('')}
                        </select>
                        ${s.type === 'custom' ? '<textarea class="textarea bg-gray-100 border-gray-300 text-gray-600 text-[10px] w-full h-16 resize-none ws-cp-prompt" placeholder="自定义提示词，用 {{input}} 代表上一步的输出" oninput="Modules.workshop._editingPipeline.steps['+i+'].prompt=this.value">'+(s.prompt||'')+'</textarea>' : ''}
                    </div>
                    <div class="flex flex-col gap-0.5 shrink-0">
                        <button class="btn btn-icon w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 text-dim text-[8px]" onclick="Modules.workshop._moveStep(${i},-1)" ${i===0?'disabled':''}><i class="fa-solid fa-chevron-up"></i></button>
                        <button class="btn btn-icon w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 text-dim text-[8px]" onclick="Modules.workshop._moveStep(${i},1)" ${i===e.steps.length-1?'disabled':''}><i class="fa-solid fa-chevron-down"></i></button>
                        <button class="btn btn-icon w-5 h-5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[8px]" onclick="Modules.workshop._removeStep(${i})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                `).join('')}
            </div>
            <button class="btn btn-xs bg-gray-100 text-dim hover:bg-emerald-500/10 hover:text-emerald-400 w-full" onclick="Modules.workshop._addStep()"><i class="fa-solid fa-plus mr-1"></i>添加步骤</button>
        </div>`;
    },

    // ===== 交互方法 =====
    switchTool: (t) => {
        const W = Modules.workshop;
        W.currentTool = t;
        const defaultModes = { split:'plot', imitate:'style', media:'xhs', shortaid:'expand', crossmod:'phoenix_outline', pipeline:'pipeline' };
        if (defaultModes[t]) W.currentSubMode = defaultModes[t];
        const view = document.getElementById('module-view-workshop');
        if (view) view.innerHTML = W.render();
        if (t === 'fusion') W._initFusion();
    },
    setSubMode: (m) => {
        Modules.workshop.currentSubMode = m;
        const sub = document.getElementById('ws-submodes');
        if (sub) sub.innerHTML = Modules.workshop._renderSubModes();
        if (['imitate','media','shortaid','crossmod'].includes(Modules.workshop.currentTool)) {
            const ws = document.getElementById('ws-workspace');
            if (ws) ws.innerHTML = Modules.workshop._renderWorkspace();
        }
    },
    init: async () => {
        if (Modules.workshop.currentTool === 'fusion') Modules.workshop._initFusion();
        // 加载自定义流水线
        const saved = await DB.get('settings', 'custom_pipelines');
        if (saved && saved.items) Modules.workshop._customPipelines = saved.items;
    },
    _initFusion: () => { Modules.workshop.fusionInputs = 0; Modules.workshop.addFusionInput(); Modules.workshop.addFusionInput(); },
    addFusionInput: () => {
        Modules.workshop.fusionInputs++;
        const container = document.getElementById('ws-fusion-inputs');
        if (!container) return;
        const div = document.createElement('div');
        div.className = "bg-white min-w-[260px] flex-1 flex flex-col border border-gray-200 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all";
        div.innerHTML = `<div class="px-2 py-1.5 border-b border-gray-200 bg-gray-100 flex justify-between items-center"><span class="text-[10px] font-bold text-dim px-1">素材 ${String.fromCharCode(64 + Modules.workshop.fusionInputs)}</span><i class="fa-solid fa-xmark text-dim cursor-pointer hover:text-gray-800 px-1" onclick="this.closest('div[class*=min-w]').remove()"></i></div><textarea class="flex-1 bg-transparent border-none p-3 resize-none text-sm focus:outline-none ws-fusion-in text-gray-600 placeholder-white/20" placeholder="在此输入素材..."></textarea>`;
        container.appendChild(div);
    },
    toggleChain: () => { Modules.workshop.chainMode = !Modules.workshop.chainMode; UI.toast(Modules.workshop.chainMode ? '链式模式已开启' : '链式模式已关闭'); const view = document.getElementById('module-view-workshop'); if (view) view.innerHTML = Modules.workshop.render(); if (Modules.workshop.currentTool === 'fusion') Modules.workshop._initFusion(); },
    applyTemplate: (idx) => { const tpls = Modules.workshop.templates[Modules.workshop.currentTool]; if (!tpls || !tpls[idx]) return; const inEl = document.getElementById('ws-in'); if (inEl) { inEl.value = tpls[idx].text + '\n\n' + inEl.value; inEl.focus(); } UI.toast('已应用模板: ' + tpls[idx].name); },
    pasteFromClipboard: async () => { try { const text = await navigator.clipboard.readText(); const inEl = document.getElementById('ws-in'); if (inEl) inEl.value = text; UI.toast('已粘贴'); } catch(e) { UI.toast('粘贴失败'); } },
    updateIO: (input, output) => { const i = document.getElementById('ws-io-in'); const o = document.getElementById('ws-io-out'); if (i) i.value = input; if (o) o.value = output; },
    loadPipelinePreset: (idx) => {
        const p = Modules.workshop.pipelinePresets[idx];
        if (!p) return;
        const el = document.getElementById('ws-pipeline-steps');
        if (!el) return;
        el.innerHTML = p.steps.map((s, i) => `<div class="flex items-center gap-2 px-3 py-2 bg-indigo-500/5 border border-indigo-500/10 rounded-lg">
            <span class="w-5 h-5 rounded-full bg-indigo-500/20 flex center text-[9px] text-indigo-400 font-bold shrink-0">${i+1}</span>
            <span class="text-[10px] text-indigo-300 font-bold">${s}</span>
            ${i < p.steps.length - 1 ? '<i class="fa-solid fa-arrow-right text-[8px] text-dim ml-auto"></i>' : '<i class="fa-solid fa-flag-checkered text-[8px] text-green-400 ml-auto"></i>'}
        </div>`).join('');
        Modules.workshop._currentPipeline = p;
        UI.toast('已加载流水线: ' + p.name);
    },

    // ===== 自定义流水线管理 =====
    _newCustomPipeline: () => {
        Modules.workshop._editingPipeline = { name: '', desc: '', steps: [{ type: 'split', prompt: '' }] };
        Modules.workshop._refreshPipelineWorkspace();
    },
    _refreshPipelineWorkspace: () => {
        const ws = document.getElementById('ws-workspace');
        if (ws) ws.innerHTML = Modules.workshop._renderPipelineWorkspace();
    },
    _onStepTypeChange: (idx, val) => {
        const e = Modules.workshop._editingPipeline;
        if (!e) return;
        e.steps[idx].type = val;
        if (val !== 'custom') e.steps[idx].prompt = '';
        Modules.workshop._refreshPipelineWorkspace();
    },
    _addStep: () => {
        const e = Modules.workshop._editingPipeline;
        if (!e) return;
        e.steps.push({ type: 'custom', prompt: '' });
        Modules.workshop._refreshPipelineWorkspace();
    },
    _removeStep: (idx) => {
        const e = Modules.workshop._editingPipeline;
        if (!e || e.steps.length <= 1) return;
        e.steps.splice(idx, 1);
        Modules.workshop._refreshPipelineWorkspace();
    },
    _moveStep: (idx, dir) => {
        const e = Modules.workshop._editingPipeline;
        if (!e) return;
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= e.steps.length) return;
        [e.steps[idx], e.steps[newIdx]] = [e.steps[newIdx], e.steps[idx]];
        Modules.workshop._refreshPipelineWorkspace();
    },
    _saveCustomPipeline: async () => {
        const W = Modules.workshop;
        const e = W._editingPipeline;
        if (!e) return;
        const name = (document.getElementById('ws-cp-name') || {}).value || '';
        const desc = (document.getElementById('ws-cp-desc') || {}).value || '';
        if (!name) return UI.toast('请输入流水线名称');
        if (e.steps.length === 0) return UI.toast('请至少添加一个步骤');
        // 收集自定义提示词
        const prompts = document.querySelectorAll('.ws-cp-prompt');
        let pi = 0;
        e.steps.forEach(s => { if (s.type === 'custom' && prompts[pi]) { s.prompt = prompts[pi].value; pi++; } });
        const pipeline = { name, desc, steps: e.steps, id: e.id || Utils.uuid() };
        // 更新或新增
        const existIdx = W._customPipelines.findIndex(p => p.id === pipeline.id);
        if (existIdx >= 0) W._customPipelines[existIdx] = pipeline;
        else W._customPipelines.push(pipeline);
        await DB.put('settings', { id: 'custom_pipelines', items: W._customPipelines });
        W._editingPipeline = null;
        // 刷新侧栏和工作区
        const sub = document.getElementById('ws-submodes');
        if (sub) sub.innerHTML = W._renderSubModes();
        W._refreshPipelineWorkspace();
        UI.toast('自定义流水线已保存: ' + name);
    },
    _loadCustomPipeline: (idx) => {
        const W = Modules.workshop;
        const p = W._customPipelines[idx];
        if (!p) return;
        // 转换为 _currentPipeline 格式并显示步骤
        const types = W._pipelineStepTypes;
        W._currentPipeline = { name: p.name, steps: p.steps.map(s => s.type), _customSteps: p.steps };
        const el = document.getElementById('ws-pipeline-steps');
        if (!el) return;
        el.innerHTML = p.steps.map((s, i) => `<div class="flex items-center gap-2 px-3 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
            <span class="w-5 h-5 rounded-full bg-emerald-500/20 flex center text-[9px] text-emerald-400 font-bold shrink-0">${i+1}</span>
            <span class="text-[10px] text-emerald-300 font-bold">${types[s.type] || s.type}</span>
            ${s.type === 'custom' && s.prompt ? '<span class="text-[8px] text-dim truncate flex-1 ml-2">' + s.prompt.slice(0, 50) + '...</span>' : ''}
            ${i < p.steps.length - 1 ? '<i class="fa-solid fa-arrow-right text-[8px] text-dim ml-auto"></i>' : '<i class="fa-solid fa-flag-checkered text-[8px] text-green-400 ml-auto"></i>'}
        </div>`).join('');
        UI.toast('已加载自定义流水线: ' + p.name);
    },
    _deleteCustomPipeline: async (idx) => {
        const W = Modules.workshop;
        if (!confirm('确定删除此自定义流水线？')) return;
        W._customPipelines.splice(idx, 1);
        await DB.put('settings', { id: 'custom_pipelines', items: W._customPipelines });
        const sub = document.getElementById('ws-submodes');
        if (sub) sub.innerHTML = W._renderSubModes();
        UI.toast('已删除');
    },
    _editCustomPipeline: (idx) => {
        const W = Modules.workshop;
        const p = W._customPipelines[idx];
        if (!p) return;
        W._editingPipeline = JSON.parse(JSON.stringify(p));
        W._refreshPipelineWorkspace();
    },

    // ===== 跨模块数据导入 =====
    _importFrom: async (source) => {
        const inEl = document.getElementById('ws-in');
        if (!inEl) return;
        let data = '';
        try {
            if (source === 'phoenix') {
                const P = Modules.phoenix;
                if (P && P.data) {
                    data = '【凤凰创作流数据】\n';
                    if (P.data.idea) data += '创意: ' + P.data.idea + '\n';
                    if (P.data.genre) data += '类型: ' + P.data.genre + '\n';
                    if (P.data.style) data += '风格: ' + P.data.style + '\n';
                    if (P.data.outlineRaw) data += '大纲:\n' + P.data.outlineRaw + '\n';
                    if (P.data.fusionContext) data += '融合上下文:\n' + P.data.fusionContext + '\n';
                }
                if (!data || data.length < 30) data = '凤凰创作流暂无数据，请先在凤凰创作流中创建大纲';
            }
            if (source === 'writer') {
                const W = Modules.writer;
                if (W && W.currentChapterId) {
                    const chap = await DB.get('chapters', W.currentChapterId);
                    if (chap) {
                        data = '【长篇执笔 - ' + (chap.title || '未命名') + '】\n';
                        if (chap.outline) data += '大纲:\n' + chap.outline + '\n\n';
                        if (chap.content) data += '正文:\n' + chap.content.slice(0, 5000);
                    }
                }
                if (!data) data = '请先在长篇执笔中选择一个章节';
            }
            if (source === 'world') {
                const entities = await DB.getAll('entities') || [];
                if (entities.length > 0) {
                    data = '【世界引擎实体 (' + entities.length + '个)】\n';
                    entities.slice(0, 30).forEach(e => {
                        data += `[${e.type}] ${e.name}: ${(e.desc || '').slice(0, 200)}\n`;
                    });
                } else {
                    data = '世界引擎暂无实体数据';
                }
            }
            if (source === 'fusion') {
                const output = document.getElementById('fb-output');
                if (output && output.innerText) {
                    data = '【融合拆书结果】\n' + output.innerText.slice(0, 5000);
                } else {
                    // 尝试从记忆中获取
                    if (typeof MemorySystem !== 'undefined') {
                        const items = MemorySystem.getLongTerm ? MemorySystem.getLongTerm() : [];
                        const fusionItems = items.filter(m => m.category === 'analysis').slice(-3);
                        if (fusionItems.length > 0) {
                            data = '【融合拆书记忆】\n' + fusionItems.map(m => m.content).join('\n---\n');
                        }
                    }
                    if (!data) data = '融合拆书暂无结果，请先在融合拆书中进行分析';
                }
            }
            if (source === 'creative') {
                const CS = Modules.creative_studio;
                if (CS && CS.shortDraft) {
                    data = '【创意工坊草稿】\n';
                    if (CS.shortDraft.title) data += '标题: ' + CS.shortDraft.title + '\n';
                    if (CS.shortDraft.genre) data += '类型: ' + CS.shortDraft.genre + '\n';
                    if (CS.shortDraft.outline) data += '大纲:\n' + CS.shortDraft.outline + '\n\n';
                    if (CS.shortDraft.content) data += '内容:\n' + CS.shortDraft.content.slice(0, 5000);
                }
                if (!data || data.length < 30) data = '创意工坊暂无草稿数据';
            }
        } catch(e) { data = '导入失败: ' + e.message; }
        inEl.value = data;
        UI.toast('已从' + {phoenix:'凤凰创作流',writer:'长篇执笔',world:'世界引擎',fusion:'融合拆书',creative:'创意工坊'}[source] + '导入');
    },

    // ===== 结果推送到各模块 =====
    _pushTo: async (target) => {
        const out = document.getElementById('ws-out');
        const content = out?.innerText || out?.value;
        if (!content) return UI.toast('暂无内容可推送');
        const title = Modules.workshop.tools[Modules.workshop.currentTool].name + '_' + new Date().toLocaleString();
        try {
            if (target === 'phoenix') {
                const P = Modules.phoenix;
                if (P) { P.data.fusionContext = (P.data.fusionContext || '') + '\n\n[万能工坊推送]\n' + content.slice(0, 3000); }
                UI.toast('已推送到凤凰创作流的融合上下文');
            }
            if (target === 'writer') {
                const W = Modules.writer;
                if (W && W.currentChapterId) {
                    const chap = await DB.get('chapters', W.currentChapterId);
                    if (chap) { chap.content = (chap.content || '') + '\n\n' + content; await DB.put('chapters', chap); UI.toast('已追加到当前章节正文'); }
                } else { UI.toast('请先在长篇执笔中选择章节'); }
            }
            if (target === 'world') {
                // 尝试提取实体
                const prompt = `从以下文本中提取所有实体信息，返回JSON数组格式：[{"name":"名称","type":"类型(人物/物品/地点/势力/规则等)","desc":"描述"}]\n\n${content.slice(0, 3000)}`;
                UI.toast('正在提取实体...');
                const res = await AI.generate(prompt);
                let entities = [];
                try { entities = JSON.parse(res.replace(/```json?\n?/g,'').replace(/```/g,'').trim()); } catch(e) {
                    const m = res.match(/\[[\s\S]*\]/); if (m) try { entities = JSON.parse(m[0]); } catch(e2) {}
                }
                for (const ent of entities) {
                    if (!ent.name) continue;
                    const id = 'ws_' + Utils.uuid();
                    await DB.put('entities', { id, name: ent.name, type: ent.type || '其他', desc: ent.desc || '', relations: [], source: 'workshop' });
                }
                UI.toast('已提取 ' + entities.length + ' 个实体到世界引擎');
            }
            if (target === 'library') {
                if (typeof ContextHelper !== 'undefined') ContextHelper.exportToLibrary(title, content);
                else await DB.put('library_books', { id: Utils.uuid(), name: title, content, size: content.length, date: new Date().toLocaleDateString() });
                UI.toast('已导入阅读中心');
            }
            if (target === 'rag') {
                if (typeof RAGSystem !== 'undefined') { RAGSystem.addDocument(title, content, 'workshop'); UI.toast('已存入RAG'); }
                else UI.toast('RAG系统不可用');
            }
            if (target === 'memory') {
                if (typeof MemorySystem !== 'undefined') { MemorySystem.addLongTerm(content.slice(0, 2000), 'analysis', 5); UI.toast('已存入长期记忆'); }
                else UI.toast('记忆系统不可用');
            }
        } catch(e) { UI.toast('推送失败: ' + e.message); }
    },

    // ===== 跨模块联动执行 =====
    runCrossMod: async () => {
        const W = Modules.workshop;
        const mode = W.currentSubMode;
        const outEl = document.getElementById('ws-out');
        const extra = document.getElementById('ws-in')?.value || '';
        if (!outEl) return;
        outEl.innerHTML = '<div class="flex items-center gap-2 text-blue-400 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin"></i> 正在执行跨模块联动...</div>';
        let prompt = '';
        try {
            if (mode === 'phoenix_outline') {
                const P = Modules.phoenix;
                const data = P ? P.data : {};
                prompt = `请对以下凤凰创作流大纲进行深度拆解分析，包括结构优化建议、情节张力分析、人物弧光评估：\n\n创意: ${data.idea||'无'}\n类型: ${data.genre||'无'}\n风格: ${data.style||'无'}\n大纲:\n${data.outlineRaw||'无大纲数据'}\n${extra ? '\n附加要求: ' + extra : ''}`;
            }
            if (mode === 'writer_chapter') {
                const chap = Modules.writer?.currentChapterId ? await DB.get('chapters', Modules.writer.currentChapterId) : null;
                if (!chap) return outEl.innerHTML = '<div class="text-red-400 text-sm">请先在长篇执笔中选择一个章节</div>';
                prompt = `请对以下章节进行全面润色和优化，提升文笔质量、情感表达和叙事节奏：\n\n章节: ${chap.title}\n大纲: ${chap.outline||'无'}\n正文:\n${(chap.content||'').slice(0,6000)}\n${extra ? '\n附加要求: ' + extra : ''}`;
            }
            if (mode === 'world_entity') {
                const entities = await DB.getAll('entities') || [];
                const entText = entities.slice(0, 20).map(e => `[${e.type}] ${e.name}: ${(e.desc||'').slice(0,150)}`).join('\n');
                prompt = `请基于以下世界引擎实体数据，进行深度扩展分析，补充缺失的关联关系、潜在冲突和故事可能性：\n\n${entText}\n${extra ? '\n附加要求: ' + extra : ''}`;
            }
            if (mode === 'fusion_result') {
                let fusionData = '';
                if (typeof MemorySystem !== 'undefined') {
                    const items = MemorySystem.getLongTerm ? MemorySystem.getLongTerm() : [];
                    fusionData = items.filter(m => m.category === 'analysis').slice(-5).map(m => m.content).join('\n---\n');
                }
                if (!fusionData) fusionData = document.getElementById('fb-output')?.innerText || '无融合数据';
                prompt = `请基于以下融合拆书的分析结果，进行二次创作，生成可直接使用的创作素材（包括人物设定、情节框架、世界观要素）：\n\n${fusionData.slice(0,5000)}\n${extra ? '\n附加要求: ' + extra : ''}`;
            }
            if (mode === 'creative_draft') {
                const CS = Modules.creative_studio;
                const draft = CS ? CS.shortDraft : {};
                prompt = `请完善和升级以下创意草稿，提升其完成度和质量：\n\n标题: ${draft.title||'无'}\n类型: ${draft.genre||'无'}\n大纲: ${draft.outline||'无'}\n内容:\n${(draft.content||'').slice(0,5000)}\n${extra ? '\n附加要求: ' + extra : ''}`;
            }
            if (mode === 'world_to_phoenix') {
                const entities = await DB.getAll('entities') || [];
                const worldData = entities.filter(e => e.id.startsWith('world_')).map(e => e.desc).join('\n');
                const entData = entities.filter(e => !e.id.startsWith('world_')).slice(0,15).map(e => `[${e.type}] ${e.name}: ${(e.desc||'').slice(0,100)}`).join('\n');
                prompt = `请基于以下世界观和实体数据，生成一份完整的小说大纲（包含核心冲突、主要角色、章节规划）：\n\n[世界观]\n${worldData||'无'}\n\n[实体]\n${entData||'无'}\n${extra ? '\n附加要求: ' + extra : ''}`;
            }
            if (mode === 'chapter_to_entity') {
                const chap = Modules.writer?.currentChapterId ? await DB.get('chapters', Modules.writer.currentChapterId) : null;
                if (!chap || !chap.content) return outEl.innerHTML = '<div class="text-red-400 text-sm">请先在长篇执笔中选择有正文的章节</div>';
                prompt = `请从以下章节正文中提取所有实体信息，返回JSON数组：[{"name":"名称","type":"类型(人物/物品/地点/势力/规则等)","desc":"描述","relations":["关联实体"]}]\n\n${chap.content.slice(0,6000)}`;
            }
            if (mode === 'full_context') {
                let ctx = '【全局创作上下文汇总】\n\n';
                const P = Modules.phoenix; if (P && P.data.outlineRaw) ctx += '[凤凰大纲]\n' + P.data.outlineRaw.slice(0,1000) + '\n\n';
                const entities = await DB.getAll('entities') || [];
                if (entities.length > 0) ctx += '[世界实体 ' + entities.length + '个]\n' + entities.slice(0,10).map(e => `${e.name}(${e.type})`).join(', ') + '\n\n';
                if (Modules.writer?.currentChapterId) { const c = await DB.get('chapters', Modules.writer.currentChapterId); if (c) ctx += '[当前章节] ' + c.title + '\n' + (c.outline||'').slice(0,500) + '\n\n'; }
                prompt = `请基于以下全局创作上下文，生成一份综合分析报告，包括：当前创作进度评估、各模块数据一致性检查、下一步创作建议：\n\n${ctx}\n${extra ? '\n附加要求: ' + extra : ''}`;
            }
            if (!prompt) return outEl.innerHTML = '<div class="text-dim text-sm">请选择联动模式</div>';
            W.updateIO(prompt, '生成中...');
            let fullRes = '';
            await AI.generate(prompt, {}, c => { if (!fullRes) outEl.innerHTML = ''; fullRes += c; outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(fullRes) : fullRes; W.updateIO(prompt, fullRes); });
            // 章节→实体提取模式：自动存入世界引擎
            if (mode === 'chapter_to_entity' && fullRes) {
                try {
                    let entities = []; try { entities = JSON.parse(fullRes.replace(/```json?\n?/g,'').replace(/```/g,'').trim()); } catch(e) { const m = fullRes.match(/\[[\s\S]*\]/); if (m) entities = JSON.parse(m[0]); }
                    let count = 0;
                    for (const ent of entities) { if (!ent.name) continue; await DB.put('entities', { id: 'ws_' + Utils.uuid(), name: ent.name, type: ent.type || '其他', desc: ent.desc || '', relations: ent.relations || [], source: 'workshop_extract' }); count++; }
                    if (count > 0) UI.toast('已自动提取 ' + count + ' 个实体到世界引擎');
                } catch(e) {}
            }
            W.history.push({ tool: '跨模块联动', mode, result: fullRes, ts: Date.now() });
        } catch(e) { outEl.innerHTML = '<div class="text-red-400 text-sm">执行失败: ' + e.message + '</div>'; }
    },

    _previewCrossModData: async () => {
        const mode = Modules.workshop.currentSubMode;
        const outEl = document.getElementById('ws-out');
        if (!outEl) return;
        let preview = '';
        try {
            if (mode === 'phoenix_outline') { const P = Modules.phoenix; preview = P ? JSON.stringify(P.data, null, 2) : '无数据'; }
            if (mode === 'writer_chapter') { const c = Modules.writer?.currentChapterId ? await DB.get('chapters', Modules.writer.currentChapterId) : null; preview = c ? `标题: ${c.title}\n大纲: ${c.outline||'无'}\n正文(${(c.content||'').length}字): ${(c.content||'').slice(0,500)}...` : '未选择章节'; }
            if (mode === 'world_entity') { const e = await DB.getAll('entities') || []; preview = e.length + ' 个实体:\n' + e.slice(0,20).map(x => `[${x.type}] ${x.name}`).join('\n'); }
            if (mode === 'fusion_result') { preview = document.getElementById('fb-output')?.innerText || '无融合结果'; }
            if (mode === 'creative_draft') { const CS = Modules.creative_studio; preview = CS ? JSON.stringify(CS.shortDraft, null, 2) : '无数据'; }
        } catch(e) { preview = '预览失败: ' + e.message; }
        outEl.innerHTML = '<pre class="text-xs text-gray-400 whitespace-pre-wrap">' + preview + '</pre>';
    },

    // ===== 核心执行方法 =====
    run: async () => {
        const W = Modules.workshop;
        const t = W.currentTool;
        const outEl = document.getElementById('ws-out');
        const inEl = document.getElementById('ws-in');
        if (!outEl) return;

        let input = '', prompt = '';

        // 融合模式：收集所有素材槽
        if (t === 'fusion') {
            const slots = document.querySelectorAll('.ws-fusion-in');
            const texts = [];
            slots.forEach((s, i) => { if (s.value.trim()) texts.push(`[素材${String.fromCharCode(65+i)}]\n${s.value.trim()}`); });
            if (texts.length < 2) return UI.toast('请至少填写2个素材槽');
            input = texts.join('\n\n');
            const customPrompt = await Modules.short?.getPrompt?.('fusion');
            prompt = ((typeof customPrompt === 'string' && customPrompt) ? customPrompt : W.defaultPrompts.fusion).replace('{{input}}', input);
        }
        // 仿写模式
        else if (t === 'imitate') {
            const ref = document.getElementById('ws-ref')?.value || '';
            const ref2 = document.getElementById('ws-ref2')?.value || '';
            input = inEl?.value || '';
            if (W.currentSubMode === 'upgrade') {
                if (!input) return UI.toast('请输入待升级文本');
                const customPrompt = await Modules.short?.getPrompt?.('imitate_upgrade');
                prompt = ((typeof customPrompt === 'string' && customPrompt) ? customPrompt : W.defaultPrompts.imitate_upgrade).replace('{{input}}', input);
            } else {
                if (!ref) return UI.toast('请输入参考范文');
                if (!input) return UI.toast('请输入待写内容');
                const key = 'imitate_' + W.currentSubMode;
                const customPrompt = await Modules.short?.getPrompt?.(key);
                prompt = ((typeof customPrompt === 'string' && customPrompt) ? customPrompt : (W.defaultPrompts[key] || W.defaultPrompts.imitate_style))
                    .replace('{{ref}}', ref).replace('{{ref2}}', ref2).replace('{{input}}', input);
            }
        }
        // 自媒体文案
        else if (t === 'media') {
            input = inEl?.value || '';
            if (!input) return UI.toast('请输入素材内容');
            const tone = document.getElementById('ws-media-tone')?.value || '活泼';
            const modeNames = { xhs:'小红书爆款笔记', tiktok:'抖音短视频脚本', wx:'微信公众号深度长文', weibo:'微博热搜话题文案', blurb:'书评/推文' };
            prompt = `请将以下素材改写为${modeNames[W.currentSubMode]||'自媒体文案'}，语气风格：${tone}。\n\n要求：\n- 符合${W.currentSubMode==='xhs'?'小红书':W.currentSubMode==='tiktok'?'抖音':W.currentSubMode==='wx'?'公众号':W.currentSubMode==='weibo'?'微博':'推文'}平台调性\n- 有吸引力的标题/开头\n- 适当使用emoji和排版\n\n素材：\n${input}`;
        }
        // 短篇辅助
        else if (t === 'shortaid') {
            input = inEl?.value || '';
            if (!input) return UI.toast('请输入文本');
            const modePrompts = {
                expand: '请对以下段落进行扩写，丰富细节描写、感官体验和情感层次，保持原意不变：\n\n',
                compress: '请将以下文本精简压缩，保留核心信息和关键情节，去除冗余描写：\n\n',
                rewrite: '请用完全不同的文风重写以下内容，保持核心情节不变但改变叙事风格和语言特色：\n\n',
                hook: '请为以下故事内容设计一个极具吸引力的开头（钩子），让读者欲罢不能：\n\n',
                ending: '请为以下故事内容设计一个令人印象深刻的结尾，可以是开放式、反转式或余韵式：\n\n',
                title_gen: '请为以下内容生成10个有创意的标题，涵盖不同风格（悬念型、诗意型、直白型、隐喻型等）：\n\n'
            };
            prompt = (modePrompts[W.currentSubMode] || '请处理以下文本：\n\n') + input;
        }
        // 拆解 / 逻辑纠错
        else {
            input = inEl?.value || '';
            if (!input) return UI.toast('请输入文本');
            if (t === 'split') {
                const key = 'ts_' + W.currentSubMode;
                const customPrompt = await Modules.short?.getPrompt?.(key);
                prompt = ((typeof customPrompt === 'string' && customPrompt) ? customPrompt : (W.defaultPrompts[key] || '请分析以下文本：')) + '\n\n' + input;
            } else if (t === 'logic') {
                const customPrompt = await Modules.short?.getPrompt?.('logic');
                prompt = ((typeof customPrompt === 'string' && customPrompt) ? customPrompt : W.defaultPrompts.logic).replace('{{input}}', input);
            }
        }

        if (!prompt) return UI.toast('无法构建提示词');

        outEl.innerHTML = '<div class="flex items-center gap-2 text-amber-400 animate-pulse p-4"><i class="fa-solid fa-circle-notch fa-spin"></i> 正在生成...</div>';
        W.updateIO(prompt, '生成中...');

        try {
            let fullRes = '';
            await AI.generate(prompt, {}, chunk => {
                if (!fullRes) outEl.innerHTML = '';
                fullRes += chunk;
                outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(fullRes) : fullRes;
                W.updateIO(prompt, fullRes);
            });

            // 链式模式：结果自动填入输入框
            if (W.chainMode && inEl) {
                inEl.value = fullRes;
                UI.toast('链式模式：结果已回填输入框');
            }

            // 记录历史
            W.history.push({ tool: W.tools[t].name, mode: W.currentSubMode, input: input.slice(0, 500), result: fullRes.slice(0, 2000), ts: Date.now() });
            if (W.history.length > 50) W.history.shift();
        } catch(e) {
            outEl.innerHTML = '<div class="text-red-400 text-sm p-4">生成失败: ' + e.message + '</div>';
        }
    },

    // ===== 继续生成 =====
    continueRun: async () => {
        const outEl = document.getElementById('ws-out');
        if (!outEl) return;
        const prev = outEl.innerText || '';
        if (!prev) return UI.toast('暂无内容可继续');
        const prompt = '请继续上文的内容，保持风格和逻辑一致，从上次结束的地方接着写：\n\n' + prev.slice(-2000);
        outEl.innerHTML += '<div class="text-amber-400 animate-pulse mt-2"><i class="fa-solid fa-circle-notch fa-spin"></i> 继续生成中...</div>';
        try {
            let fullRes = prev;
            await AI.generate(prompt, {}, chunk => {
                fullRes += chunk;
                outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(fullRes) : fullRes;
            });
            Modules.workshop.updateIO('继续生成', fullRes);
        } catch(e) { UI.toast('继续生成失败: ' + e.message); }
    },

    // ===== 流水线执行 =====
    runPipeline: async () => {
        const W = Modules.workshop;
        const pipeline = W._currentPipeline;
        if (!pipeline) return UI.toast('请先选择一个流水线预设');
        const outEl = document.getElementById('ws-out');
        const inEl = document.getElementById('ws-in');
        if (!outEl) return;

        let currentData = inEl?.value || '';
        outEl.innerHTML = '';

        const stepHandlers = {
            phoenix_outline: async () => {
                const P = Modules.phoenix;
                return P?.data?.outlineRaw || '无凤凰大纲数据';
            },
            writer_chapter: async () => {
                if (Modules.writer?.currentChapterId) {
                    const c = await DB.get('chapters', Modules.writer.currentChapterId);
                    return c ? (c.content || c.outline || '') : '';
                }
                return '';
            },
            world_entity: async () => {
                const e = await DB.getAll('entities') || [];
                return e.slice(0, 20).map(x => `[${x.type}] ${x.name}: ${(x.desc||'').slice(0,150)}`).join('\n');
            },
            fusion_result: async () => {
                if (typeof MemorySystem !== 'undefined') {
                    const items = MemorySystem.getLongTerm ? MemorySystem.getLongTerm() : [];
                    return items.filter(m => m.category === 'analysis').slice(-3).map(m => m.content).join('\n---\n');
                }
                return '';
            },
            split: async (input) => {
                const prompt = '请对以下内容进行深度拆解分析（结构、情节、人物、手法）：\n\n' + input;
                let res = ''; await AI.generate(prompt, {}, c => { res += c; }); return res;
            },
            logic: async (input) => {
                const prompt = '请检查以下内容的逻辑漏洞、时间线冲突和设定矛盾：\n\n' + input;
                let res = ''; await AI.generate(prompt, {}, c => { res += c; }); return res;
            },
            fusion: async (input) => {
                const prompt = '请将以下分析结果进行融合优化，提炼核心要素并生成改进方案：\n\n' + input;
                let res = ''; await AI.generate(prompt, {}, c => { res += c; }); return res;
            },
            imitate: async (input) => {
                const prompt = '请对以下内容进行文笔升级和风格优化：\n\n' + input;
                let res = ''; await AI.generate(prompt, {}, c => { res += c; }); return res;
            },
            imitate_upgrade: async (input) => {
                const prompt = '请大幅提升以下内容的文笔质量、修辞水平和表现力：\n\n' + input;
                let res = ''; await AI.generate(prompt, {}, c => { res += c; }); return res;
            },
            media: async (input) => {
                const prompt = '请将以下内容改写为适合自媒体传播的文案：\n\n' + input;
                let res = ''; await AI.generate(prompt, {}, c => { res += c; }); return res;
            },
            crossmod_expand: async (input) => {
                const prompt = '请基于以下数据进行深度扩展，补充关联关系和故事可能性：\n\n' + input;
                let res = ''; await AI.generate(prompt, {}, c => { res += c; }); return res;
            },
            phoenix_gen: async (input) => {
                const prompt = '请基于以下分析结果，生成一份完整的小说大纲（含核心冲突、主要角色、章节规划）：\n\n' + input;
                let res = ''; await AI.generate(prompt, {}, c => { res += c; }); return res;
            },
            save: async (input) => {
                if (typeof ContextHelper !== 'undefined') ContextHelper.exportToLibrary('流水线结果_' + new Date().toLocaleString(), input);
                else await DB.put('library_books', { id: Utils.uuid(), name: '流水线结果', content: input, size: input.length, date: new Date().toLocaleDateString() });
                return input;
            }
        };

        // 支持自定义步骤的提示词
        const customSteps = pipeline._customSteps || null;

        try {
            for (let i = 0; i < pipeline.steps.length; i++) {
                const step = pipeline.steps[i];
                let handler = stepHandlers[step];

                // 自定义提示词步骤
                if (customSteps && customSteps[i] && customSteps[i].type === 'custom' && customSteps[i].prompt) {
                    const customPrompt = customSteps[i].prompt;
                    handler = async (input) => {
                        const p = customPrompt.includes('{{input}}') ? customPrompt.replace('{{input}}', input) : customPrompt + '\n\n' + input;
                        let res = ''; await AI.generate(p, {}, c => { res += c; W.updateIO(p, res); }); return res;
                    };
                }
                const stepLabel = W._pipelineStepTypes[step] || step;
                outEl.innerHTML += `<div class="border-b border-gray-200 pb-3 mb-3"><div class="flex items-center gap-2 mb-2"><span class="w-5 h-5 rounded-full bg-indigo-500/30 flex center text-[9px] text-indigo-400 font-bold">${i+1}</span><span class="text-xs font-bold text-indigo-400">步骤 ${i+1}: ${stepLabel}</span><i class="fa-solid fa-circle-notch fa-spin text-indigo-400/50 text-[10px]"></i></div></div>`;

                if (handler) {
                    currentData = await handler(currentData) || currentData;
                } else {
                    currentData = currentData; // 未知步骤，保持数据不变
                }

                // 更新显示
                const stepDivs = outEl.querySelectorAll('.border-b');
                const lastDiv = stepDivs[stepDivs.length - 1];
                if (lastDiv) {
                    lastDiv.innerHTML = `<div class="flex items-center gap-2 mb-2"><span class="w-5 h-5 rounded-full bg-green-500/30 flex center text-[9px] text-green-400 font-bold">${i+1}</span><span class="text-xs font-bold text-green-400">步骤 ${i+1}: ${stepLabel} ✓</span></div><div class="text-xs text-gray-400 max-h-32 overflow-y-auto pl-7">${(typeof marked !== 'undefined' ? marked.parse(currentData.slice(0, 1000)) : currentData.slice(0, 1000))}</div>`;
                }
            }
            outEl.innerHTML += `<div class="mt-4 p-4 bg-green-500/5 border border-green-500/10 rounded-lg"><div class="text-sm font-bold text-green-400 mb-2"><i class="fa-solid fa-check-circle mr-1"></i>流水线执行完成</div><div class="text-sm text-gray-600 leading-relaxed">${typeof marked !== 'undefined' ? marked.parse(currentData) : currentData}</div></div>`;
            W.updateIO('流水线: ' + pipeline.name, currentData);
            W.history.push({ tool: '流水线', mode: pipeline.name, result: currentData.slice(0, 2000), ts: Date.now() });
        } catch(e) {
            outEl.innerHTML += `<div class="text-red-400 text-sm mt-2">流水线执行失败: ${e.message}</div>`;
        }
    },

    // ===== 导出到阅读中心 =====
    exportToLibrary: async () => {
        const out = document.getElementById('ws-out');
        const content = out?.innerText || '';
        if (!content) return UI.toast('暂无内容可导出');
        const title = Modules.workshop.tools[Modules.workshop.currentTool].name + '_' + new Date().toLocaleString();
        if (typeof ContextHelper !== 'undefined') {
            ContextHelper.exportToLibrary(title, content);
        } else {
            await DB.put('library_books', { id: Utils.uuid(), name: title, content, size: content.length, date: new Date().toLocaleDateString() });
        }
        UI.toast('已导出到阅读中心');
    },

    // ===== 历史记录 =====
    showHistory: () => {
        const W = Modules.workshop;
        if (W.history.length === 0) return UI.toast('暂无历史记录');
        const html = `<div class="p-4 max-h-[70vh] overflow-y-auto space-y-2">
            <div class="text-sm font-bold text-gray-800 mb-3"><i class="fa-solid fa-clock-rotate-left mr-1 text-amber-400"></i>历史记录 (${W.history.length})</div>
            ${W.history.slice().reverse().map((h, i) => `
                <div class="bg-gray-100 rounded-lg p-3 hover:bg-gray-200 cursor-pointer border border-gray-200" onclick="Modules.workshop._loadHistory(${W.history.length - 1 - i})">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-xs font-bold text-amber-400">${h.tool} ${h.mode ? '· ' + h.mode : ''}</span>
                        <span class="text-[9px] text-dim">${new Date(h.ts).toLocaleString()}</span>
                    </div>
                    <div class="text-[10px] text-dim line-clamp-2">${(h.result || '').slice(0, 150)}...</div>
                </div>
            `).join('')}
        </div>`;
        UI.modal('历史记录', html);
    },

    _loadHistory: (idx) => {
        const W = Modules.workshop;
        const h = W.history[idx];
        if (!h) return;
        const outEl = document.getElementById('ws-out');
        if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(h.result) : h.result;
        const inEl = document.getElementById('ws-in');
        if (inEl && h.input) inEl.value = h.input;
        UI.toast('已加载历史记录');
        // 关闭弹窗
        document.querySelector('.modal-overlay')?.remove();
    },

    // ===== 收藏 =====
    addToFavorites: () => {
        const out = document.getElementById('ws-out');
        const content = out?.innerText || '';
        if (!content) return UI.toast('暂无内容可收藏');
        const W = Modules.workshop;
        W.favorites.push({
            tool: W.tools[W.currentTool].name,
            mode: W.currentSubMode,
            content: content.slice(0, 3000),
            ts: Date.now()
        });
        UI.toast('已收藏 ⭐ (共' + W.favorites.length + '条)');
    },

    // ===== 对比功能 =====
    saveToCompare: (slot) => {
        const out = document.getElementById('ws-out');
        const content = out?.innerText || '';
        if (!content) return UI.toast('暂无内容');
        Modules.workshop.compareSlots[slot] = content;
        UI.toast('已保存到对比槽 ' + slot.toUpperCase());
    },

    showCompare: () => {
        const W = Modules.workshop;
        const a = W.compareSlots.a;
        const b = W.compareSlots.b;
        if (!a && !b) return UI.toast('请先用 A/B 按钮保存对比内容');
        const html = `<div class="p-4 max-h-[70vh] overflow-hidden flex flex-col">
            <div class="text-sm font-bold text-gray-800 mb-3"><i class="fa-solid fa-code-compare mr-1 text-cyan-400"></i>A/B 对比</div>
            <div class="flex-1 grid grid-cols-2 gap-3 min-h-0 overflow-hidden">
                <div class="bg-gray-100 rounded-lg p-3 overflow-y-auto border border-blue-500/20">
                    <div class="text-[10px] font-bold text-blue-400 mb-2">版本 A</div>
                    <div class="text-xs text-gray-600 leading-relaxed">${a ? (typeof marked !== 'undefined' ? marked.parse(a) : a) : '<span class="text-dim">空</span>'}</div>
                </div>
                <div class="bg-gray-100 rounded-lg p-3 overflow-y-auto border border-purple-500/20">
                    <div class="text-[10px] font-bold text-purple-400 mb-2">版本 B</div>
                    <div class="text-xs text-gray-600 leading-relaxed">${b ? (typeof marked !== 'undefined' ? marked.parse(b) : b) : '<span class="text-dim">空</span>'}</div>
                </div>
            </div>
            ${a && b ? `<div class="mt-3 flex justify-center"><button class="btn h-8 px-4 bg-cyan-600 hover:bg-cyan-500 text-gray-800 rounded-lg text-xs font-bold" onclick="Modules.workshop.aiCompare()"><i class="fa-solid fa-robot mr-1"></i>AI 智能对比分析</button></div>` : ''}
        </div>`;
        UI.modal('A/B 对比', html, { width: '800px' });
    },

    aiCompare: async () => {
        const W = Modules.workshop;
        const a = W.compareSlots.a;
        const b = W.compareSlots.b;
        if (!a || !b) return UI.toast('需要A和B两个版本');
        const prompt = `请对比分析以下两个版本的文本，从文笔质量、情感表达、叙事技巧、信息密度等维度进行详细对比，并给出优劣评价和改进建议：\n\n[版本A]\n${a.slice(0, 3000)}\n\n[版本B]\n${b.slice(0, 3000)}`;
        const outEl = document.getElementById('ws-out');
        if (outEl) {
            outEl.innerHTML = '<div class="flex items-center gap-2 text-cyan-400 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin"></i> AI对比分析中...</div>';
            try {
                let res = '';
                await AI.generate(prompt, {}, c => { res += c; outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(res) : res; });
            } catch(e) { outEl.innerHTML = '<div class="text-red-400">对比分析失败: ' + e.message + '</div>'; }
        }
        // 关闭弹窗
        document.querySelector('.modal-overlay')?.remove();
    }
};
