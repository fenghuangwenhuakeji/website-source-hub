// ============================================
// 万能工坊 (workshop) - 旗舰版 v3
// 深度绑定: 凤凰创作流 · 长篇执笔 · 世界引擎 · 融合拆书 · 创意工坊
// 工具: 全能拆解 · 无限融合 · 无限仿写 · 逻辑纠错 · 自媒体文案 · 跨模块联动
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
        crossmod: { name: '跨模块联动', icon: 'fa-link',          color: 'blue' }
    },

    splitModes: {
        structure: { name: '循环结构分析', icon: 'fa-rotate' },
        plot:      { name: '情节脉络提取', icon: 'fa-timeline' },
        char:      { name: '人物弧光拆解', icon: 'fa-user-group' },
        emotion:   { name: '情绪价值评估', icon: 'fa-face-smile' },
        tech:      { name: '写作手法鉴赏', icon: 'fa-pen-fancy' },
        rhythm:    { name: '叙事节奏分析', icon: 'fa-wave-square' },
        dialogue:  { name: '对话技巧拆解', icon: 'fa-comments' },
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

    // 跨模块联动模式
    crossModModes: {
        phoenix_outline:  { name: '大纲联动', icon: 'fa-fire-flame-curved', desc: '拉取凤凰创作流大纲进行深度拆解分析' },
        writer_chapter:   { name: '章节联动', icon: 'fa-feather-pointed', desc: '拉取长篇执笔章节进行润色/扩写/纠错' },
        world_entity:     { name: '实体联动', icon: 'fa-atom', desc: '拉取世界引擎实体进行深度扩展和关联分析' },
        full_context:     { name: '全上下文联动', icon: 'fa-layer-group', desc: '汇总所有模块数据生成完整创作上下文' }
    },

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
            { name: '设定矛盾检测', text: '请检查以下文本中的世界观设定是否前后一致，标注所有设定矛盾：' },
            { name: '章节体检报告', text: '请按问题严重度输出章节体检报告：硬伤、节奏拖点、人物动机断裂、信息重复、可立刻修改的句段：' }
        ],
        media: [
            { name: '章节宣发套装', text: '请把以下章节内容改写成一组发布物料：标题3个、短简介1段、爆点摘句5条、评论区引导语3条：' },
            { name: '小红书种草版', text: '请把以下故事卖点改成小红书风格，要求有钩子、有情绪、有具体读者利益，不要营销腔：' },
            { name: '短视频口播版', text: '请把以下内容改成60秒短视频口播脚本，包含前三秒钩子、转折、悬念收尾：' }
        ],
        crossmod: [
            { name: '项目全局体检', text: '请汇总当前项目中的大纲、世界观、角色、章节与灵感，输出：最强卖点、最大风险、下一步优先级：' },
            { name: '创作上下文包', text: '请把当前项目整理成可交给AI续写的上下文包，包含主线、角色状态、世界规则、未解决伏笔、禁止误写项：' }
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
        <div class="flex h-full bg-[#0a0a0c] overflow-hidden">
            <div class="w-72 shrink-0 flex flex-col bg-[#111113] border-r border-white/5 overflow-hidden" id="ws-sidebar">
                <div class="p-4 border-b border-white/5 flex items-center gap-2 bg-gradient-to-r from-amber-900/20 to-transparent">
                    <div class="w-8 h-8 rounded-lg bg-amber-600/20 flex center text-amber-500 border border-amber-600/40"><i class="fa-solid fa-hammer"></i></div>
                    <div>
                        <span class="font-bold text-sm text-white">万能工坊</span>
                        <div class="text-[9px] text-dim">拆解 · 融合 · 仿写 · 联动</div>
                    </div>
                </div>
                <div class="p-2 grid grid-cols-2 gap-1.5">
                    ${Object.entries(W.tools).map(([k,v]) => `
                        <button class="btn text-[10px] h-8 rounded-lg justify-start px-2 gap-1 transition-all ${t===k ? 'bg-'+v.color+'-600/20 text-'+v.color+'-400 border border-'+v.color+'-600/50 font-bold' : 'bg-white/5 text-dim hover:bg-white/10 border border-transparent'}" onclick="Modules.workshop.switchTool('${k}')">
                            <i class="fa-solid ${v.icon} text-[9px]"></i>${v.name}
                        </button>
                    `).join('')}
                </div>
                <div class="border-t border-white/5"></div>
                <div class="flex-1 overflow-y-auto p-2 space-y-1" id="ws-submodes">${W._renderSubModes()}</div>
                <div class="border-t border-white/5 p-2">
                    <div class="text-[9px] text-dim font-bold uppercase tracking-wider px-2 mb-1">快捷模板</div>
                    <div class="space-y-1 max-h-24 overflow-y-auto" id="ws-templates">
                        ${(W.templates[t] || []).map((tpl, i) => `
                            <button class="w-full text-left px-2 py-1 rounded text-[10px] text-dim hover:text-white hover:bg-white/5 truncate" onclick="Modules.workshop.applyTemplate(${i})" title="${tpl.text}">
                                <i class="fa-solid fa-bookmark text-${info.color}-400/50 mr-1"></i>${tpl.name}
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div class="border-t border-white/5 p-2 space-y-1">
                    <div class="flex gap-1">
                        <button class="btn btn-xs flex-1 ${W.chainMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-white/5 text-dim border-transparent'} border" onclick="Modules.workshop.toggleChain()"><i class="fa-solid fa-link mr-1"></i>链式</button>
                        <button class="btn btn-xs flex-1 bg-white/5 text-dim" onclick="Modules.workshop.showHistory()"><i class="fa-solid fa-clock-rotate-left mr-1"></i>历史</button>
                        <button class="btn btn-xs flex-1 bg-white/5 text-dim" onclick="Modules.workshop.showCompare()"><i class="fa-solid fa-code-compare mr-1"></i>对比</button>
                    </div>
                </div>
            </div>
            <div class="flex-1 flex flex-col overflow-hidden min-w-0">
                <div id="ws-command-strip" class="shrink-0">${W._renderCommandStrip()}</div>
                <div id="ws-workspace" class="flex-1 flex flex-col overflow-hidden">${W._renderWorkspace()}</div>
            </div>
        </div>`;
    },

    _getCurrentSubModeLabel: () => {
        const W = Modules.workshop;
        const maps = {
            split: W.splitModes,
            imitate: W.imitateModes,
            media: W.mediaModes,
            crossmod: W.crossModModes
        };
        return maps[W.currentTool]?.[W.currentSubMode]?.name || (W.currentTool === 'fusion' ? `${W.fusionInputs}槽融合` : '默认模式');
    },

    _renderCommandStrip: () => {
        const W = Modules.workshop;
        const info = W.tools[W.currentTool] || W.tools.split;
        const scenarios = [
            ['chapter_check', '查问题', '找逻辑、人设、节奏硬伤', 'fa-stethoscope', 'cyan'],
            ['style_upgrade', '改文风', '把原文改顺、改狠、改耐看', 'fa-arrow-up', 'pink'],
            ['deep_split', '拆结构', '拆情节、节奏、人物、爽点', 'fa-microscope', 'amber'],
            ['material_fusion', '融合素材', '多段设定合成一个方案', 'fa-blender', 'purple'],
            ['media_pack', '转发布文案', '标题、简介、摘句、口播', 'fa-hashtag', 'red'],
            ['full_context', '拉项目上下文', '整理当前项目给AI续写', 'fa-link', 'blue']
        ];
        return `
        <div class="bg-[#0d0d0f] border-b border-white/5 px-4 py-3">
            <div class="flex flex-col 2xl:flex-row 2xl:items-center gap-3">
                <div class="min-w-[245px]">
                    <div class="text-[10px] text-amber-300/70 font-bold tracking-wider">先说你想怎么处理</div>
                    <div class="text-sm font-black text-white">我手上有一段文字</div>
                    <div class="text-[10px] text-dim mt-1">点一个任务，粘贴内容，再点开始；不用先研究工具分类。</div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-2 flex-1">
                    ${scenarios.map(([id, label, desc, icon, color]) => `
                        <button class="rounded-lg border border-${color}-500/20 bg-${color}-500/10 px-3 py-2 text-left hover:bg-${color}-500/20 hover:border-${color}-500/40 transition min-h-[62px]" onclick="Modules.workshop._applyScenario('${id}')">
                            <div class="flex items-center gap-2">
                                <i class="fa-solid ${icon} text-${color}-300 text-xs"></i>
                                <span class="text-xs font-black text-${color}-100">${label}</span>
                            </div>
                            <div class="text-[10px] text-dim mt-1 leading-relaxed">${desc}</div>
                        </button>
                    `).join('')}
                </div>
                <div class="grid grid-cols-3 gap-2 2xl:w-[360px]">
                    <div class="rounded-lg border border-${info.color}-500/20 bg-${info.color}-500/10 px-3 py-2">
                        <div class="text-[9px] text-${info.color}-200/70">当前</div>
                        <div class="text-xs font-bold text-${info.color}-200 truncate">${info.name}</div>
                    </div>
                    <div class="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                        <div class="text-[9px] text-dim">模式</div>
                        <div class="text-xs font-bold text-white truncate">${W._getCurrentSubModeLabel()}</div>
                    </div>
                    <button class="rounded-lg border ${W.chainMode ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-white/5 bg-white/[0.03] text-dim'} px-3 py-2 text-left hover:bg-white/10 transition" onclick="Modules.workshop.toggleChain()">
                        <div class="text-[9px] opacity-70">连续处理</div>
                        <div class="text-xs font-bold">${W.chainMode ? '已开启' : '未开启'}</div>
                    </button>
                </div>
            </div>
        </div>`;
    },

    _refreshCommandStrip: () => {
        const el = document.getElementById('ws-command-strip');
        if (el) el.innerHTML = Modules.workshop._renderCommandStrip();
    },

    _applyScenario: (scenario) => {
        const W = Modules.workshop;
        const config = {
            chapter_check: { tool: 'logic', mode: 'plot', chain: true, label: '现在粘贴章节，然后点开始诊断。' },
            style_upgrade: { tool: 'imitate', mode: 'upgrade', chain: false, label: '现在粘贴原文，然后点开始改写。' },
            deep_split: { tool: 'split', mode: 'deep', chain: false, label: '现在粘贴样章，然后点开始拆解。' },
            material_fusion: { tool: 'fusion', mode: 'plot', chain: false, label: '现在粘贴多段素材，然后点融合。' },
            media_pack: { tool: 'media', mode: 'xhs', chain: false, label: '现在粘贴章节或卖点，然后点生成文案。' },
            full_context: { tool: 'crossmod', mode: 'full_context', chain: true, label: '已切到项目上下文整理，可直接开始。' }
        }[scenario];
        if (!config) return;
        W.currentTool = config.tool;
        W.currentSubMode = config.mode;
        W.chainMode = config.chain;
        const view = document.getElementById('module-view-workshop');
        if (view) view.innerHTML = W.render();
        if (W.currentTool === 'fusion') W._initFusion();
        UI.toast(config.label);
        setTimeout(() => {
            const input = document.getElementById('ws-in') || document.querySelector('#ws-workspace textarea');
            if (input && typeof input.focus === 'function') input.focus();
        }, 80);
    },

    _renderSubModes: () => {
        const W = Modules.workshop;
        const t = W.currentTool;
        const modeMap = { split: W.splitModes, imitate: W.imitateModes, media: W.mediaModes };
        const colorMap = { split:'amber', imitate:'pink', media:'red' };
        const promptPrefixMap = { split:'ts_', imitate:'imitate_' };

        if (modeMap[t]) {
            const c = colorMap[t];
            return Object.entries(modeMap[t]).map(([k,v]) => `
                <div class="flex items-center gap-1">
                    <button class="btn flex-1 justify-start text-left px-3 h-8 rounded-lg text-[10px] transition-all ${W.currentSubMode===k ? 'bg-'+c+'-600/20 text-'+c+'-400 border border-'+c+'-600/50 font-bold' : 'bg-white/5 text-dim hover:bg-white/10 border border-transparent'}" onclick="Modules.workshop.setSubMode('${k}')">
                        <i class="fa-solid ${v.icon} mr-1.5 opacity-70"></i>${v.name}
                    </button>
                    ${promptPrefixMap[t] ? `<button class="btn btn-icon w-6 h-6 rounded bg-white/5 hover:bg-white/10 text-dim" onclick="Modules.short.openPromptModal('${promptPrefixMap[t]}${k}')"><i class="fa-solid fa-gear text-[8px]"></i></button>` : ''}
                </div>
            `).join('');
        }
        if (t === 'fusion') {
            return `<button class="btn w-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-lg h-8 text-[10px] font-bold" onclick="Modules.workshop.addFusionInput()"><i class="fa-solid fa-plus mr-1"></i>增加素材槽</button>
                <button class="btn w-full bg-white/5 hover:bg-white/10 text-dim rounded-lg h-8 text-[10px]" onclick="Modules.short.openPromptModal('fusion')"><i class="fa-solid fa-gear mr-1"></i>配置融合逻辑</button>
                <div class="text-[9px] text-dim bg-white/5 p-2 rounded-lg border border-white/5 mt-1"><strong class="text-purple-400">💡</strong> 支持从各模块导入素材到融合槽</div>`;
        }
        if (t === 'logic') {
            return `<button class="btn w-full bg-white/5 hover:bg-white/10 text-dim rounded-lg h-8 text-[10px]" onclick="Modules.short.openPromptModal('logic')"><i class="fa-solid fa-gear mr-1"></i>配置检测提示词</button>
                <div class="text-[9px] text-dim bg-white/5 p-2 rounded-lg border border-white/5 mt-1"><strong class="text-cyan-400">🔍</strong> 支持从长篇执笔直接拉取章节检测</div>`;
        }
        if (t === 'crossmod') {
            return Object.entries(W.crossModModes).map(([k,v]) => `
                <button class="btn w-full justify-start text-left px-3 h-9 rounded-lg text-[10px] transition-all ${W.currentSubMode===k ? 'bg-blue-600/20 text-blue-400 border border-blue-600/50 font-bold' : 'bg-white/5 text-dim hover:bg-white/10 border border-transparent'}" onclick="Modules.workshop.setSubMode('${k}')" title="${v.desc}">
                    <i class="fa-solid ${v.icon} mr-1.5 opacity-70"></i>${v.name}
                </button>
            `).join('') + `<div class="text-[9px] text-dim bg-blue-500/5 p-2 rounded-lg border border-blue-500/10 mt-1"><strong class="text-blue-400">🔗</strong> 深度联动各创作模块，数据自由流转</div>`;
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
            <div class="flex-1 bg-[#111113] rounded-xl border border-white/5 flex flex-col min-h-[200px] overflow-hidden">
                <div class="flex justify-between items-center px-4 py-2 border-b border-white/5 bg-black/20 shrink-0">
                    <span class="font-bold text-xs text-${c}-400 flex items-center gap-2"><i class="fa-solid fa-file-waveform"></i>生成结果</span>
                    <div class="flex gap-1">
                        <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim rounded" onclick="Modules.workshop.continueRun()" title="继续"><i class="fa-solid fa-play mr-1"></i>继续</button>
                        <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim rounded" onclick="Modules.workshop.saveToCompare('a')"><i class="fa-solid fa-a"></i></button>
                        <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim rounded" onclick="Modules.workshop.saveToCompare('b')"><i class="fa-solid fa-b"></i></button>
                        <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim rounded" onclick="Modules.workshop.addToFavorites()"><i class="fa-solid fa-star"></i></button>
                        <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim rounded" onclick="Utils.copy(document.getElementById('ws-out').innerText||document.getElementById('ws-out').value)"><i class="fa-solid fa-copy"></i></button>
                    </div>
                </div>
                ${W._renderPushBar()}
                <div id="ws-out" class="flex-1 text-gray-200 leading-loose text-sm overflow-y-auto p-5 markdown-body"></div>
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
                <div class="bg-[#111113] rounded-xl border border-white/5 focus-within:border-${c}-500/50">
                    <div class="px-3 pt-2">${importBar}</div>
                    <textarea id="ws-in" class="w-full bg-transparent border-none p-4 text-sm text-gray-200 focus:outline-none resize-none h-32 placeholder-white/20 leading-relaxed" placeholder="${t==='split'?'在此粘贴需要拆解的原文片段...':'在此粘贴需要检测逻辑的文本...'}"></textarea>
                    <div class="px-3 pb-2 flex justify-between items-center">
                        <div class="flex gap-1">
                            <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim rounded" onclick="document.getElementById('ws-in').value=''"><i class="fa-solid fa-eraser mr-1"></i>清空</button>
                            <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim rounded" onclick="Modules.workshop.pasteFromClipboard()"><i class="fa-solid fa-paste mr-1"></i>粘贴</button>
                        </div>
                        <button class="btn btn-sm bg-${c}-600 hover:bg-${c}-500 text-white rounded-lg px-5 font-bold shadow-lg shadow-${c}-500/20" onclick="Modules.workshop.run()">${t==='split'?'开始拆解':'开始诊断'} <i class="fa-solid fa-bolt ml-1"></i></button>
                    </div>
                </div>
                ${outputArea}
            </div>`;
        }
        if (t === 'imitate') {
            const isBlend = W.currentSubMode === 'blend';
            const isUpgrade = W.currentSubMode === 'upgrade';
            return `<div class="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                ${isUpgrade ? `<div class="bg-[#111113] rounded-xl border border-white/5 focus-within:border-pink-500/50">
                    <div class="px-3 pt-2 flex items-center gap-2"><span class="text-[10px] font-bold text-pink-400">待升级文本</span>${importBar}</div>
                    <textarea id="ws-in" class="w-full bg-transparent border-none p-4 text-sm text-gray-300 resize-none h-36 focus:outline-none" placeholder="粘贴需要升级文笔的文本..."></textarea>
                </div>` : `<div class="grid ${isBlend ? 'grid-cols-3' : 'grid-cols-2'} gap-3 min-h-[180px]">
                    <div class="bg-[#111113] rounded-xl border border-white/5 flex flex-col focus-within:border-pink-500/50">
                        <div class="px-3 pt-2 border-b border-white/5 bg-white/5 rounded-t-xl"><span class="text-[10px] font-bold text-pink-400">参考范文${isBlend?' A':''}</span></div>
                        <textarea id="ws-ref" class="flex-1 bg-transparent border-none p-3 text-sm text-gray-300 resize-none focus:outline-none" placeholder="粘贴想要模仿的风格范文..."></textarea>
                    </div>
                    ${isBlend ? `<div class="bg-[#111113] rounded-xl border border-white/5 flex flex-col focus-within:border-pink-500/50"><div class="px-3 pt-2 border-b border-white/5 bg-white/5 rounded-t-xl"><span class="text-[10px] font-bold text-purple-400">参考范文 B</span></div><textarea id="ws-ref2" class="flex-1 bg-transparent border-none p-3 text-sm text-gray-300 resize-none focus:outline-none" placeholder="粘贴第二个风格范文..."></textarea></div>` : ''}
                    <div class="bg-[#111113] rounded-xl border border-white/5 flex flex-col focus-within:border-pink-500/50">
                        <div class="px-3 pt-2 border-b border-white/5 bg-white/5 rounded-t-xl flex items-center gap-2"><span class="text-[10px] font-bold text-dim">待写内容</span></div>
                        <textarea id="ws-in" class="flex-1 bg-transparent border-none p-3 text-sm text-gray-300 resize-none focus:outline-none" placeholder="输入你的故事梗概或原始文本..."></textarea>
                    </div>
                </div>
                <div class="flex justify-center">${importBar}</div>`}
                <div class="flex justify-center"><button class="btn h-10 px-8 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold shadow-lg shadow-pink-500/20" onclick="Modules.workshop.run()"><i class="fa-solid fa-wand-magic-sparkles mr-2"></i>开始仿写</button></div>
                ${outputArea}
            </div>`;
        }
        if (t === 'fusion') {
            return `<div class="flex-1 flex flex-col p-5 gap-3 overflow-hidden">
                <div class="shrink-0">${importBar}</div>
                <div class="flex gap-2 overflow-x-auto pb-2 min-h-[160px] shrink-0" id="ws-fusion-inputs"></div>
                <div class="flex justify-center shrink-0"><button class="btn h-10 px-8 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-500/20" onclick="Modules.workshop.run()"><i class="fa-solid fa-wand-magic-sparkles mr-2"></i>立即融合</button></div>
                ${outputArea}
            </div>`;
        }
        if (t === 'media') {
            return `<div class="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                <div class="bg-[#111113] rounded-xl border border-white/5 focus-within:border-red-500/50">
                    <div class="px-3 pt-2 flex items-center gap-2">
                        <span class="text-[10px] font-bold text-red-400">内容素材</span>
                        <select id="ws-media-tone" class="bg-black/30 border border-white/10 rounded px-2 py-0.5 text-[10px] text-white"><option value="活泼">活泼俏皮</option><option value="专业">专业深度</option><option value="煽情">煽情走心</option><option value="搞笑">搞笑吐槽</option><option value="悬念">悬念钩子</option></select>
                        <div class="flex-1"></div>
                    </div>
                    <div class="px-3 py-1">${importBar}</div>
                    <textarea id="ws-in" class="w-full bg-transparent border-none p-4 text-sm text-gray-200 focus:outline-none resize-none h-32 placeholder-white/20" placeholder="粘贴小说片段、角色介绍、故事梗概等素材..."></textarea>
                    <div class="px-3 pb-2 flex justify-end"><button class="btn btn-sm bg-red-600 hover:bg-red-500 text-white rounded-lg px-5 font-bold" onclick="Modules.workshop.run()">生成文案 <i class="fa-solid fa-bolt ml-1"></i></button></div>
                </div>
                ${outputArea}
            </div>`;
        }
        if (t === 'crossmod') return W._renderCrossModWorkspace();
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
                    <button class="btn h-9 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs" onclick="Modules.workshop.runCrossMod()"><i class="fa-solid fa-bolt mr-1"></i>执行联动</button>
                    <button class="btn h-9 px-4 bg-white/5 hover:bg-white/10 text-dim rounded-lg text-xs" onclick="Modules.workshop._previewCrossModData()"><i class="fa-solid fa-eye mr-1"></i>预览数据</button>
                </div>
            </div>
            <div class="bg-[#111113] rounded-xl border border-white/5 focus-within:border-blue-500/50">
                <div class="px-3 pt-2"><span class="text-[10px] font-bold text-dim">附加输入 (可选)</span></div>
                <textarea id="ws-in" class="w-full bg-transparent border-none p-4 text-sm text-gray-200 focus:outline-none resize-none h-24 placeholder-white/20" placeholder="可以在此添加额外的指令或上下文..."></textarea>
            </div>
            ${W._renderOutputArea()}
        </div>`;
    },

    // ===== 交互方法 =====
    switchTool: (t) => {
        const W = Modules.workshop;
        W.currentTool = t;
        const defaultModes = { split:'plot', imitate:'style', media:'xhs', crossmod:'phoenix_outline' };
        if (defaultModes[t]) W.currentSubMode = defaultModes[t];
        const view = document.getElementById('module-view-workshop');
        if (view) view.innerHTML = W.render();
        if (t === 'fusion') W._initFusion();
    },
    setSubMode: (m) => {
        Modules.workshop.currentSubMode = m;
        const sub = document.getElementById('ws-submodes');
        if (sub) sub.innerHTML = Modules.workshop._renderSubModes();
        if (['imitate','media','crossmod'].includes(Modules.workshop.currentTool)) {
            const ws = document.getElementById('ws-workspace');
            if (ws) ws.innerHTML = Modules.workshop._renderWorkspace();
        }
        Modules.workshop._refreshCommandStrip();
    },
    init: async () => {
        if (Modules.workshop.currentTool === 'fusion') Modules.workshop._initFusion();
    },

    // ===== 通用空方法（将在其他文件中扩展） =====
    updateIO: (input, output) => {}
};
