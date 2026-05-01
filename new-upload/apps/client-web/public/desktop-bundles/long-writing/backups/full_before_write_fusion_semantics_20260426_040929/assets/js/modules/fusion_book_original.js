/**
 * 融合拆书 UI 模块 (三栏对比版)
 * Modules.fusion_book
 */
// ================================================================
// ========== 模块1: 融合拆书 (三栏对比版 — 还原截图布局) ==========
// ================================================================

/**
 * FusionBookSystem — 拆书数据层
 * 提供书籍导入、章节解析、持久化存储
 */
const FusionBookSystem = {
    _storeKey: 'fusion_books_data',

    async getBooks() {
        const data = await DB.get('settings', this._storeKey);
        return data?.books || [];
    },

    async addBook(name, text, regexStr) {
        const regex = new RegExp(regexStr, 'gm');
        const matches = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            matches.push({ index: match.index, title: (match[1] || match[0]).trim() });
        }

        const chapters = [];
        for (let i = 0; i < matches.length; i++) {
            const start = matches[i].index;
            const end = i < matches.length - 1 ? matches[i + 1].index : text.length;
            chapters.push({
                title: matches[i].title,
                content: text.slice(start, end).trim()
            });
        }

        if (chapters.length === 0) {
            chapters.push({ title: '全文', content: text });
        }

        const book = { id: Utils.uuid(), name, chapters };
        const data = await DB.get('settings', this._storeKey) || { books: [] };
        data.books.push(book);
        await DB.put('settings', { id: this._storeKey, books: data.books });
        return book;
    },

    async deleteBook(bookId) {
        const data = await DB.get('settings', this._storeKey);
        if (data && data.books) {
            data.books = data.books.filter(b => b.id !== bookId);
            await DB.put('settings', { id: this._storeKey, books: data.books });
        }
    }
};

Modules.fusion_book = {
    left: { bookId: null, chapterIdx: null, analysis: '' },
    right: { bookId: null, chapterIdx: null, analysis: '' },
    _generating: false,
    _pipelineRunning: false,
    _pipelineResults: {},
    _allPipelineResults: { left: '', right: '', compare: '', fusion: '', world: '', outline: '', write: '' },
    _pipelineStep: 0,
    _pipelinePaused: false,
    _primaryBook: 'left',
    _primarySettings: null,
    _plConfig: {
        leftChapters: [],   // 勾选的左书章节索引
        rightChapters: [],  // 勾选的右书章节索引
        doExtract: true,    // 是否提取知识图谱
        doOutline: true,    // 是否写细纲
        doWrite: true,      // 是否写正文
        doRAG: true,        // 是否存RAG
        saveFolder: '',     // 本地保存文件夹
        lastSync: null,     // 最后同步时间
        cycleMode: false,   // 循环拆解模式
        cycleSize: 5,       // 循环大小（默认5章为一个循环）
        maxConcurrency: 1   // Agent默认并发数（保守模式，大模型友好）
    },

    _PROMPTS: {
        analyze: `【超无穹·真值引擎·NEXUS OS v2.0】你是顶级网文技法拆解大师。\n【绝对禁令】你只拆解"写作技法"，严禁复述、保留、分析原书的任何具体内容。\n【去内容化原则】输出中不得出现原书的角色名、具体情节、场景描写、物品名称。只允许出现抽象的"技法模板"和"套路框架"。\n\n=== NEXUS OS v2.0 执行域 ===\n=== L1 行文铁律（16条·违反即重写）===\n1.视角锁死:第三人称有限 | 2.禁解释癖 | 3.禁烂俗比喻:≤2/千字 | 4.禁虚词模糊\n5.禁情绪标签:动作/环境/对话呈现 | 6.禁连续长句:≤25字,逗号≤2个 | 7.章末必有钩子\n8.对话功能化:推剧情/塑性格/埋伏笔/造情绪 | 9.开篇100字:必动作/对话 | 10.段落≤5行\n11.结局禁梦 | 12.时间线向前 | 13.行为一致 | 14.禁逻辑连词 | 15.段落限制 | 16.跨模块铁律\n\n=== P1-P10 拟人化协议 ===\nP1物理替代 P2拒绝升华 P3沟通失效 P4细节碎片化 P5认知反差 P6逻辑自毁\nP7感官钝化 P8权力不对等 P9时间尺度扭曲 P10自我意识抹除\n\n=== L2 建议 ===\n每章≥2种感官 | 每章≥1个日常小动作 | ≤10字短句占30%+ | 长短句交替 | 每2-3章1个偶然事件\n\n书名：{{book}}\n章节：{{title}}\n\n{{content}}\n\n请从NEXUS 8+2维度拆解（每个维度给出：①发现 ②可复用套路 ③零件库标签）：\n1. 【开篇钩子技法】前3句抓读者的"机制"是什么（不是"内容"是什么）。例如：不是"主角醒来发现穿越了"，而是"以动作/冲突/疑问开场，100字内制造信息差"\n2. 【爽点节奏技法】情绪价值的"制造模式"是什么。例如：不是"主角打赢了反派"，而是"压抑→释放→超额兑现的三段式节奏"\n3. 【人设塑造技法】角色标签如何组合、反差如何设计、成长弧如何铺设\n4. 【反转触发技法】小/中/大反转的"触发条件模板"是什么\n5. 【情绪曲线技法】每章情绪值的"控制公式"是什么，EMO锚点如何布置\n6. 【冲突升级技法】矛盾如何"层级递进"，对抗如何螺旋上升\n7. 【信息差管理技法】读者/主角/反派的"认知三角"如何操控\n8. 【金手指节奏技法】获取→解锁→升级→限制的"节点控制模板"\n+9. 【开篇结构技法】前三章信息密度的"黄金三章公式"\n+10. 【商业化设计技法】付费卡点、免费钩子密度的"追读粘性公式"\n\n【严格输出规范】\n- 所有分析必须用"填空式模板"呈现，例如："【钩子模板A】以[动作/冲突]开场，在[字数]内抛出[信息差类型]，让读者产生[期待感类型]"\n- 禁止出现任何原书角色名、地名、势力名\n- 禁止复述原书情节\n- 【可复用零件库】格式：零件名 | 适用场景 | 执行步骤（通用，不绑定任何原书内容） | 来源维度\n- 【L1合规评分】该章写作技法层面违反哪些铁律（如有）\n- 【P1-P10评分】哪些拟人化协议被有效运用`,
        compare: `【超无穹·真值引擎·NEXUS OS v2.0】你是写作技法对比分析专家。\n【核心原则】{{primaryBook}}和{{secondaryBook}}都是"技法来源"，不是内容模板。你的目标是对比两本书在"写作技法"层面的异同，提炼出可复用的通用技法框架。\n【绝对禁令】\n1. 禁止对比两本书的"内容"（角色、情节、场景）\n2. 禁止输出任何原书的具体角色名、情节、场景\n3. 最终输出必须是"去内容化"的通用技法对比\n\n【技法来源A】\n{{primary}}\n\n【技法来源B】\n{{secondary}}\n\n请从以下维度对比（只对比"技法"，不对比"内容"）：\n1. 【开篇策略对比】两本书开篇抓读者的"机制"有何不同？各有什么可借鉴的通用模板？\n2. 【节奏控制对比】两本书的节奏"公式"有何差异？组合后能否形成更优的通用节奏方案？\n3. 【爽点设计对比】两本书制造爽感的"模式"有何不同？各自的爽点模板如何互补？\n4. 【悬念手法对比】两本书操控读者期待的"技法"有何差异？\n5. 【来源A独特技法】A书独有的、值得提炼为通用模板的技法\n6. 【来源B独特技法】B书独有的、值得提炼为通用模板的技法\n7. 【技法冲突清单】两书技法在"通用性"上的冲突（不是世界观冲突，而是技法本身是否互斥）\n8. 【通用融合方案】将两书技法融合为一套"去内容化"的通用创作工具箱\n\n【输出要求】\n- 所有对比必须用"填空式模板"呈现\n- 禁止出现任何原书角色名、地名、势力名\n- 禁止复述原书情节\n- 最终产出是"通用技法工具箱"，可以套用到任何新故事`,
        compareAnalysis: `【超无穹·真值引擎·NEXUS OS v2.0】你是写作技法对比分析专家。\n【核心原则】以下两份分析来自两本不同的书，你要对比的是它们的"写作技法"异同，不是内容。\n\n【技法来源A分析】\n{{left}}\n\n【技法来源B分析】\n{{right}}\n\n请深度对比两者在技法层面的异同：\n1. 【A书独特技法】A书独有的、可提炼为通用模板的技法\n2. 【B书独特技法】B书独有的、可提炼为通用模板的技法\n3. 【共通技法】两书都使用的通用套路（底层原理共通）\n4. 【技法冲突】两书技法在通用性上的冲突点\n5. 【融合方案】将两者融合为一套去内容化的通用技法体系\n6. 【异化建议】如何在通用技法基础上进行变量切入/跨界嫁接，产生新技法`,
        fusion: `【超无穹·真值引擎·NEXUS OS v2.0】你是顶级网文技法融合创作大师。\n【核心任务】基于两书的技法拆解，融合创作一份全新的网文细纲。\n【关键原则】\n- 主书提供：叙事结构骨架、节奏模式、世界观运行逻辑\n- 辅书提供：钩子设计改进、爽点模式补充、对话技巧优化\n- 融合产出：一份全新的细纲。角色/世界观/情节全部原创——不是原书的任何内容\n\n【绝对禁令】\n1. 禁止出现原书角色名、地名、势力名、物品名\n2. 禁止复述原书的具体情节\n3. 禁止复用原书的具体场景\n4. 所有角色、世界观设定、情节必须原创\n5. 但技法的"运行逻辑"（如力量体系如何运作、社会规则如何运行）可以参考并创新\n\n【技法来源A】\n{{primary}}\n\n【技法来源B】\n{{secondary}}\n\n【对比结论】\n{{compare}}\n\n【输出要求——融合细纲】\n产出一份完整的网文细纲（至少1卷，每卷至少3-5章）：\n\n## 第一卷：【原创卷名】\n卷概要：100字内，说明本卷的整体节奏模式（运用主书骨架+辅书改进）\n\n### 第一章：【原创章名】\n**情节：** 原创情节（新角色、新事件），运用融合后的开篇钩子技法\n**看点/爽点：** 标注运用了哪种融合技法（如：压抑→释放三段式+辅书对话技巧）\n**情绪节奏：** 起→承→转→合，标注情绪分值变化\n**技法标注：** 本章核心技法来源说明\n\n...（继续产出更多章节）\n\n【NEXUS OS 技法融合规范】\n1. 每章必须携带：emotion_score(1-10)、hook_type、tension_level(1-10)\n2. 开篇必须有强力钩子（3句话内抓住读者）\n3. 节奏紧凑，爽点密度≥1次/千字\n4. 对话鲜活有潜台词\n5. 伏笔要有回收计划\n\n【自检清单】\n- 是否有原书角色名混入？\n- 是否有原书情节复述？\n- 是否做到了"熟悉节奏+全新内容"？`,
        write: `【超无穹·真值引擎·NEXUS OS v2.0】你是顶级网文写手。\n【核心任务】基于以下融合细纲，撰写正文章节。\n【关键原则】\n- 细纲中的角色/世界观/情节都是融合阶段原创的，不是原书内容\n- 你要把这些原创角色和情节用文字写活，同时运用融合技法来强化质量\n- 严禁复用任何原书的角色名、情节、场景\n\n【融合细纲】\n{{fusion}}\n\n【详细细纲】\n{{outline}}\n\n【世界观设定（融合细纲原创）】\n{{world}}\n\n=== NEXUS OS L1 铁律（强制） ===\n1. 视角锁死：第三人称有限，禁直接描写其他角色内心\n2. 禁解释癖：禁用"这不是…而是…/不是因为…恰恰因为…"\n3. 禁烂俗比喻：禁用"像刀/阳光/风/水/火/石头"；新颖比喻≤2/千字\n4. 禁虚词模糊：删除"似乎/仿佛/好像"用于模糊描述\n5. 禁情绪标签：不写"他很愤怒"，必须动作/环境/对话呈现\n6. 禁连续长句：单句≤25字；逗号连接分句≤2个\n7. 章末必有钩子：未完成动作+意外信息 / 时间压力 / 信息差\n8. 对话功能化：推进剧情/塑造性格/埋伏笔/制造情绪，否则删除\n9. 开篇100字：必须是动作或对话，禁环境/背景/独白\n10. 段落限制：每段≤5行（约60字）\n\n=== NEXUS L2 建议 ===\n- 每章≥2种感官 | 每章≥1个日常小动作 | ≤10字短句占30%+\n- 长短句交替 | 每2-3章1个偶然事件\n\n要求：\n1. 严格遵循融合细纲的情节走向和角色设定\n2. 运用融合技法中的通用模板（钩子设计、节奏控制、爽点布局等）\n3. 开篇必须有强力钩子，3句话内抓住读者\n4. 节奏紧凑，爽点密集，不要水字数\n5. 对话鲜活有潜台词，口语化、接地气\n6. 场景描写有画面感但不啰嗦\n7. 语言风格：大白话、简洁有力、一句一个信息点\n8. 排版要求：每段不超过3-4行，多用短句，对话单独成段\n9. 【一致性校验】人物称呼、能力设定、地名必须与融合细纲保持一致\n10. 【异化终审】写完后自检：是否有原书角色混入？是否有原书情节复刻？`
    },

    render() {
        const FB = this;
        const leftCharCount = FB._getSelectedChapterCharCount('left');
        const rightCharCount = FB._getSelectedChapterCharCount('right');
        return `
        <div class="flex flex-col h-full bg-[#0a0a0c] overflow-hidden relative">
            <!-- 顶部标题栏 -->
            <div class="h-10 flex items-center justify-between px-4 bg-[#0e0e10] border-b border-white/5 shrink-0">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-green-400"><i class="fa-solid fa-book-open-reader mr-1.5"></i>融合拆书</span>
                    <span class="px-1.5 py-0.5 rounded text-[9px] bg-green-500/15 text-green-400 border border-green-500/20">双书对比模式</span>
                    <span class="hidden text-[10px] text-red-400 animate-pulse font-bold" id="fb-gen-indicator">● 生成中</span>
                    <span class="text-[8px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 ${FB._primaryBook === 'left' ? '' : 'hidden'}" id="fb-primary-badge-top">主书:左</span>
                    <span class="text-[8px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 ${FB._primaryBook === 'right' ? '' : 'hidden'}" id="fb-primary-badge-top-right">主书:右</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <button class="btn btn-xs bg-white/5 text-dim hover:text-white" onclick="Modules.fusion_book._toggleAdvancedPanel()" title="高级设置"><i class="fa-solid fa-sliders"></i></button>
                    <label class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 cursor-pointer"><i class="fa-solid fa-upload mr-1"></i>导入书籍<input type="file" accept=".txt,.epub" class="hidden" onchange="Modules.fusion_book._handleImportFile(this)"></label>
                </div>
            </div>

            <!-- 高级设置面板 -->
            <div id="fb-advanced-panel" class="hidden absolute top-10 left-0 right-0 z-40 bg-[#111113] border-b border-white/10 p-3 shadow-xl">
                <div class="flex flex-wrap gap-2 items-center">
                    <span class="text-[10px] text-dim mr-1">步骤提示词:</span>
                    <button class="btn btn-xs bg-amber-600/15 text-amber-400 border-amber-600/20 text-[10px]" onclick="Modules.short.openPromptModal('fusion_analyze')"><i class="fa-solid fa-gear mr-0.5"></i>拆解</button>
                    <button class="btn btn-xs bg-purple-600/15 text-purple-400 border-purple-600/20 text-[10px]" onclick="Modules.short.openPromptModal('fusion_compare_analysis')"><i class="fa-solid fa-gear mr-0.5"></i>对比</button>
                    <button class="btn btn-xs bg-green-600/15 text-green-400 border-green-600/20 text-[10px]" onclick="Modules.short.openPromptModal('fusion_merge')"><i class="fa-solid fa-gear mr-0.5"></i>融合</button>
                    <button class="btn btn-xs bg-blue-600/15 text-blue-400 border-blue-600/20 text-[10px]" onclick="Modules.short.openPromptModal('fusion_outline')"><i class="fa-solid fa-gear mr-0.5"></i>细纲</button>
                    <button class="btn btn-xs bg-pink-600/15 text-pink-400 border-pink-600/20 text-[10px]" onclick="Modules.short.openPromptModal('fusion_write')"><i class="fa-solid fa-gear mr-0.5"></i>正文</button>
                    <span class="w-px h-4 bg-white/10 mx-1"></span>
                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.fusion_book.checkConsistency()"><i class="fa-solid fa-check-double mr-1"></i>一致性检查</button>
                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.fusion_book.selectSaveFolder()"><i class="fa-solid fa-folder-open mr-1"></i>${FB._plConfig.saveFolder ? '📁 ' + FB._plConfig.saveFolder.split('/').pop().split('\\\\').pop() : '选择文件夹'}</button>
                    ${FB._plConfig.lastSync ? `<span class="text-[9px] text-green-400"><i class="fa-solid fa-check-circle mr-0.5"></i>已实时传输 ${new Date(FB._plConfig.lastSync).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</span>` : ''}
                </div>
            </div>

            <!-- 三栏主体 -->
            <div class="flex-1 flex min-h-0 overflow-hidden">
                <!-- 左书栏 -->
                <div class="w-[260px] shrink-0 flex flex-col bg-[#0e0e10] border-r border-white/5 overflow-hidden">
                    <div class="p-2.5 border-b border-white/5 bg-blue-500/5 shrink-0">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-xs font-bold text-blue-400">A 左书</span>
                            <select id="fb-left-book" class="flex-1 bg-black/30 border border-white/5 rounded text-[10px] text-white p-1 min-w-0" onchange="Modules.fusion_book.selectBook('left',this.value)"></select>
                            <button class="text-red-400/50 hover:text-red-400 text-[10px]" onclick="Modules.fusion_book.deleteSelectedBook('left')"><i class="fa-solid fa-trash"></i></button>
                        </div>
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full text-[9px] ${FB._primaryBook === 'left' ? 'ring-1 ring-amber-400' : ''}" onclick="Modules.fusion_book.setPrimaryBook('left')"><i class="fa-solid fa-crown mr-0.5"></i>设为主书</button>
                    </div>
                    <div id="fb-left-chapters" class="flex-1 overflow-y-auto min-h-0"></div>
                    <div id="fb-left-preview" class="h-48 shrink-0 border-t border-white/5 bg-[#0a0a0c] p-2.5 overflow-y-auto text-[10px] text-gray-400 leading-relaxed">
                        <div class="text-dim text-center mt-8">点击章节查看正文</div>
                    </div>
                </div>

                <!-- 中间面板 -->
                <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0a0a0c]">
                    <div class="p-3 border-b border-white/5 bg-[#0e0e10]">
                        <div class="flex items-center justify-center mb-2">
                            <button class="btn btn-md bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold shadow-lg hover:scale-105 transition-transform px-6" onclick="Modules.fusion_book.showPipelineConfig()"><i class="fa-solid fa-rocket mr-2"></i>一键智能拆书链</button>
                        </div>
                        <div class="flex items-center justify-center gap-2 mb-2">
                            <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.fusion_book.sendToPhoenix()"><i class="fa-solid fa-feather mr-1"></i>→凤凰流</button>
                            <button class="btn btn-xs bg-indigo-600/20 text-indigo-400 border-indigo-600/30" onclick="Modules.fusion_book.sendToWriter()"><i class="fa-solid fa-pen-nib mr-1"></i>→执笔台</button>
                        </div>
                        <div class="flex items-center justify-center gap-6 text-center">
                            <div><div class="text-lg font-bold text-blue-400">${leftCharCount > 0 ? (leftCharCount / 10000).toFixed(1) + '万' : '-'}</div><div class="text-[9px] text-dim">左书字数</div></div>
                            <div class="text-dim text-xs">⚡</div>
                            <div><div class="text-lg font-bold text-pink-400">${rightCharCount > 0 ? (rightCharCount / 10000).toFixed(1) + '万' : '-'}</div><div class="text-[9px] text-dim">右书字数</div></div>
                        </div>
                    </div>
                    <div class="flex-1 relative min-h-0">
                        <div id="fb-output" class="absolute inset-0 overflow-y-auto p-5 text-gray-200 text-sm leading-loose markdown-body"></div>
                    </div>
                </div>

                <!-- 右书栏 -->
                <div class="w-[260px] shrink-0 flex flex-col bg-[#0e0e10] border-l border-white/5 overflow-hidden">
                    <div class="p-2.5 border-b border-white/5 bg-pink-500/5 shrink-0">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-xs font-bold text-pink-400">B 右书</span>
                            <select id="fb-right-book" class="flex-1 bg-black/30 border border-white/5 rounded text-[10px] text-white p-1 min-w-0" onchange="Modules.fusion_book.selectBook('right',this.value)"></select>
                            <button class="text-red-400/50 hover:text-red-400 text-[10px]" onclick="Modules.fusion_book.deleteSelectedBook('right')"><i class="fa-solid fa-trash"></i></button>
                        </div>
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full text-[9px] ${FB._primaryBook === 'right' ? 'ring-1 ring-amber-400' : ''}" onclick="Modules.fusion_book.setPrimaryBook('right')"><i class="fa-solid fa-crown mr-0.5"></i>设为主书</button>
                    </div>
                    <div id="fb-right-chapters" class="flex-1 overflow-y-auto min-h-0"></div>
                    <div id="fb-right-preview" class="h-48 shrink-0 border-t border-white/5 bg-[#0a0a0c] p-2.5 overflow-y-auto text-[10px] text-gray-400 leading-relaxed">
                        <div class="text-dim text-center mt-8">点击章节查看正文</div>
                    </div>
                </div>
            </div>

            <!-- 底部状态栏 -->
            <div class="h-8 flex items-center gap-2 px-3 bg-[#0e0e10] border-t border-white/5 shrink-0">
                <span class="text-[9px] text-dim" id="fb-status">就绪</span>
                <span class="flex-1"></span>
                <button class="btn btn-xs bg-white/5 text-dim text-[9px]" onclick="Utils.copy(document.getElementById('fb-output')?.innerText)"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                <button class="btn btn-xs bg-white/5 text-dim text-[9px]" onclick="Modules.fusion_book.clearAll()"><i class="fa-solid fa-rotate-right mr-1"></i>清空</button>
            </div>

            <!-- ===== 自动化流水线浮层 ===== -->
            <div id="fb-pipeline-overlay" class="absolute inset-0 z-50 flex flex-col bg-[#0a0a0c] border border-white/5" style="display:none;">
                <div class="h-11 flex items-center justify-between px-4 bg-[#0e0e10] border-b border-white/5 shrink-0">
                    <div class="flex items-center gap-3">
                        <span class="text-base font-bold text-green-400"><i class="fa-solid fa-link mr-2"></i>自动化流水线 · 实时监控</span>
                        <span class="px-2 py-0.5 rounded text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/20 font-bold" id="pl-step-label"></span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30" onclick="Modules.fusion_book.plMinimize()"><i class="fa-solid fa-compress mr-1"></i>最小化</button>
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" id="pl-pause-btn" style="display:none;" onclick="Modules.fusion_book.plPause()"><i class="fa-solid fa-pause mr-1"></i>暂停</button>
                        <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30" id="pl-stop-btn" style="display:none;" onclick="Modules.fusion_book.plStop()"><i class="fa-solid fa-stop mr-1"></i>停止</button>
                        <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.fusion_book.plClose()"><i class="fa-solid fa-xmark mr-1"></i>关闭</button>
                    </div>
                </div>
                <!-- Agent 并发统计条 -->
                <div class="px-4 py-1.5 bg-[#0e0e10] border-b border-white/5 shrink-0 flex items-center gap-3">
                    <div class="flex items-center gap-1.5 text-[10px]">
                        <span class="text-dim">Agent:</span>
                        <span class="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20" id="pl-agent-pending">0</span>
                        <span class="text-dim">排队</span>
                        <span class="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20" id="pl-agent-running">0</span>
                        <span class="text-dim">运行</span>
                        <span class="px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20" id="pl-agent-done">0</span>
                        <span class="text-dim">完成</span>
                    </div>
                    <div class="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div id="pl-progress-bar" class="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300" style="width:0%"></div>
                    </div>
                    <span class="text-[10px] text-dim font-mono" id="pl-agent-stats">0运行/0排队/0完成 | 0章/分</span>
                </div>
                <!-- 阶段指示器 -->
                <div class="px-4 py-1 bg-[#0e0e10] border-b border-white/5 shrink-0 flex items-center gap-2 text-[10px]">
                    <span class="text-dim">阶段:</span>
                    <span class="px-1.5 py-0.5 rounded bg-white/5 text-dim" id="pl-phase-1">①分析</span>
                    <span class="text-dim">→</span>
                    <span class="px-1.5 py-0.5 rounded bg-white/5 text-dim" id="pl-phase-2">②融合</span>
                    <span class="text-dim">→</span>
                    <span class="px-1.5 py-0.5 rounded bg-white/5 text-dim" id="pl-phase-3">③循环</span>
                    <span class="text-dim">→</span>
                    <span class="px-1.5 py-0.5 rounded bg-white/5 text-dim" id="pl-phase-4">④写作</span>
                </div>
                <div class="flex-1 flex min-h-0 overflow-hidden">
                    <!-- 左侧：实时输出 -->
                    <div class="flex-1 flex flex-col min-w-0 border-r border-white/5">
                        <div class="flex items-center justify-between px-4 py-2 bg-[#0e0e10] border-b border-white/5 shrink-0">
                            <span class="text-xs font-bold text-white" id="pl-current-title"><i class="fa-solid fa-file-lines mr-1 text-green-400"></i>等待启动</span>
                            <span class="text-[10px] text-dim font-mono" id="pl-current-chars"></span>
                        </div>
                        <div class="flex-1 overflow-y-auto p-5 text-sm text-gray-200 leading-loose whitespace-pre-wrap" id="pl-output">等待流水线启动...</div>
                    </div>
                    <!-- 右侧：状态面板 -->
                    <div class="w-[340px] shrink-0 flex flex-col overflow-y-auto bg-[#0e0e10]">
                        <!-- 实时写入状态 - 2列网格卡片 -->
                        <div class="p-3 border-b border-white/5">
                            <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-2">实时写入状态</div>
                            <div class="grid grid-cols-2 gap-1.5" id="pl-status-grid">
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-all" id="pl-s-left" onclick="Modules.fusion_book.plPreview('left')"><span class="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" id="pl-d-left"></span><span class="text-[11px] text-blue-400 font-bold truncate">左书分析</span><span class="ml-auto text-[9px] text-dim" id="pl-i-left"></span></div>
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-all" id="pl-s-right" onclick="Modules.fusion_book.plPreview('right')"><span class="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" id="pl-d-right"></span><span class="text-[11px] text-pink-400 font-bold truncate">右书分析</span><span class="ml-auto text-[9px] text-dim" id="pl-i-right"></span></div>
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-all" id="pl-s-compare" onclick="Modules.fusion_book.plPreview('compare')"><span class="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" id="pl-d-compare"></span><span class="text-[11px] text-amber-400 font-bold truncate">对比</span><span class="ml-auto text-[9px] text-dim" id="pl-i-compare"></span></div>
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-all" id="pl-s-fusion" onclick="Modules.fusion_book.plPreview('fusion')"><span class="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" id="pl-d-fusion"></span><span class="text-[11px] text-green-400 font-bold truncate">融合</span><span class="ml-auto text-[9px] text-dim" id="pl-i-fusion"></span></div>
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-all col-span-2" id="pl-s-outline" onclick="Modules.fusion_book.plPreview('outline')"><span class="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" id="pl-d-outline"></span><span class="text-[11px] text-orange-400 font-bold">📋 细纲</span><span class="ml-auto text-[9px] text-dim" id="pl-i-outline"></span></div>
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-all" id="pl-s-world" onclick="Modules.fusion_book.plPreview('world')"><span class="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" id="pl-d-world"></span><span class="text-[11px] text-cyan-400 font-bold truncate">实体提取</span><span class="ml-auto text-[9px] text-dim" id="pl-i-world"></span></div>
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-all" id="pl-s-write" onclick="Modules.fusion_book.plPreview('write')"><span class="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" id="pl-d-write"></span><span class="text-[11px] text-purple-400 font-bold truncate">正文</span><span class="ml-auto text-[9px] text-dim" id="pl-i-write"></span></div>
                            </div>
                        </div>
                        <!-- 流水线信息 -->
                        <div class="p-3 border-b border-white/5">
                            <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-2">流水线信息</div>
                            <div class="text-[11px] text-dim leading-relaxed" id="pl-pipeline-info">等待配置...</div>
                        </div>
                        <!-- 操作日志 -->
                        <div class="flex-1 p-3 min-h-0">
                            <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-2">操作日志</div>
                            <div class="overflow-y-auto text-[10px] font-mono leading-relaxed space-y-0.5" id="pl-log" style="max-height:calc(100vh - 380px);"></div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- 右下角全局悬浮胶囊 -->
            <div id="fb-pipeline-mini" class="absolute bottom-12 right-4 z-50 bg-gradient-to-r from-red-600 to-orange-500 rounded-full shadow-lg shadow-red-500/30 px-5 py-2.5 flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform" onclick="Modules.fusion_book._pipelineRunning ? Modules.fusion_book.plRestore() : (Modules.fusion_book._savedPipelineState ? Modules.fusion_book._resumeFromSaved() : Modules.fusion_book.showPipelineConfig())">
                <span class="text-white text-sm font-bold"><i class="fa-solid fa-rocket mr-1.5"></i><span id="pl-mini-status">${FB._savedPipelineState ? '继续上次流水线 (' + (FB._savedPipelineState.completedPairs||[]).length + '章已完成)' : '一键自动拆书链'}</span></span>
                ${FB._pipelineRunning ? '<span class="text-white/70 text-xs animate-pulse">●</span>' : ''}
            </div>

            <!-- ===== 流水线配置弹窗 ===== -->
            <div id="fb-pipeline-config" class="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" style="display:none;" onclick="if(event.target===this)this.style.display='none'">
                <div class="w-[720px] max-h-[85vh] bg-[#111113] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col" onclick="event.stopPropagation()">
                    <div class="px-5 py-3 bg-[#0e0e10] border-b border-white/5 flex items-center justify-between">
                        <span class="text-base font-bold text-green-400"><i class="fa-solid fa-rocket mr-2"></i>一键自动拆书链 · 配置</span>
                        <button class="text-dim hover:text-white" onclick="document.getElementById('fb-pipeline-config').style.display='none'"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="flex-1 overflow-y-auto p-5 space-y-4">
                        <!-- 章节选择 -->
                        <div class="flex gap-4">
                            <div class="flex-1">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-xs font-bold text-blue-400">A 左书章节</span>
                                    <div class="flex gap-1">
                                        <button class="text-[10px] text-blue-400 hover:underline" onclick="Modules.fusion_book._plConfigSelectAll('left',true)">全选</button>
                                        <button class="text-[10px] text-dim hover:underline" onclick="Modules.fusion_book._plConfigSelectAll('left',false)">全不选</button>
                                    </div>
                                </div>
                                <div id="plc-left-chapters" class="max-h-[180px] overflow-y-auto space-y-0.5 bg-black/20 rounded-lg p-2 border border-white/5"></div>
                            </div>
                            <div class="flex-1">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-xs font-bold text-pink-400">B 右书章节</span>
                                    <div class="flex gap-1">
                                        <button class="text-[10px] text-pink-400 hover:underline" onclick="Modules.fusion_book._plConfigSelectAll('right',true)">全选</button>
                                        <button class="text-[10px] text-dim hover:underline" onclick="Modules.fusion_book._plConfigSelectAll('right',false)">全不选</button>
                                    </div>
                                </div>
                                <div id="plc-right-chapters" class="max-h-[180px] overflow-y-auto space-y-0.5 bg-black/20 rounded-lg p-2 border border-white/5"></div>
                            </div>
                        </div>
                        <!-- 流水线选项 -->
                        <div class="bg-black/20 rounded-lg p-4 border border-white/5 space-y-3">
                            <div class="text-xs font-bold text-white mb-2">流水线选项</div>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="plc-do-extract" checked class="accent-green-500"><span class="text-xs text-gray-300">🌍 提取知识图谱 → 世界引擎 + 向量数据库(RAG)</span></label>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="plc-do-outline" checked class="accent-green-500"><span class="text-xs text-gray-300">📋 生成细纲 → 凤凰创作流 + 长篇执笔(旗舰)大纲</span></label>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="plc-do-write" checked class="accent-green-500"><span class="text-xs text-gray-300">✍️ 写正文 → 长篇执笔(旗舰)正文 + RAG存储</span></label>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="plc-do-rag" checked class="accent-green-500"><span class="text-xs text-gray-300">🔍 拆解结果存入RAG向量数据库</span></label>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="plc-do-local" ${FB._plConfig.saveFolder ? 'checked' : ''} class="accent-green-500"><span class="text-xs text-gray-300">💾 保存到本地文件夹</span>
                                ${FB._plConfig.saveFolder ? '<span class="text-[10px] text-green-400 ml-2">(' + FB._plConfig.saveFolder.split('/').pop().split('\\\\').pop() + ')</span>' : ''}
                            </label>
                        </div>
                        <!-- 循环拆解模式 -->
                        <div class="bg-cyan-900/10 rounded-lg p-4 border border-cyan-500/20 space-y-3">
                            <div class="text-xs font-bold text-cyan-400 mb-2"><i class="fa-solid fa-sync mr-1"></i>循环拆解模式</div>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="plc-cycle-mode" ${FB._plConfig.cycleMode ? 'checked' : ''} class="accent-cyan-500"><span class="text-xs text-gray-300">启用循环拆解 (以N章为一个小循环进行融合)</span></label>
                            <div class="flex items-center gap-3">
                                <div class="flex items-center gap-2">
                                    <span class="text-[10px] text-dim">每</span>
                                    <select id="plc-cycle-size" class="bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white">
                                        <option value="3" ${FB._plConfig.cycleSize === 3 ? 'selected' : ''}>3</option>
                                        <option value="5" ${FB._plConfig.cycleSize === 5 ? 'selected' : ''}>5</option>
                                        <option value="10" ${FB._plConfig.cycleSize === 10 ? 'selected' : ''}>10</option>
                                        <option value="20" ${FB._plConfig.cycleSize === 20 ? 'selected' : ''}>20</option>
                                    </select>
                                    <span class="text-[10px] text-dim">章为一个循环</span>
                                </div>
                            </div>
                        </div>
                        <!-- 并发设置 -->
                        <div class="bg-purple-900/10 rounded-lg p-4 border border-purple-500/20 space-y-3">
                            <div class="text-xs font-bold text-purple-400 mb-2"><i class="fa-solid fa-bolt mr-1"></i>Agent 并发设置</div>
                            <div class="flex items-center gap-3">
                                <span class="text-[10px] text-dim">最大并发数:</span>
                                <input type="range" id="plc-concurrency" min="1" max="10" value="${FB._plConfig.maxConcurrency || 1}" class="accent-purple-500 w-32" oninput="document.getElementById('plc-concurrency-val').textContent=this.value">
                                <span class="text-xs text-purple-400 font-bold font-mono" id="plc-concurrency-val">${FB._plConfig.maxConcurrency || 1}</span>
                                <span class="text-[10px] text-dim">个Agent同时运行</span>
                            </div>
                        </div>
                    </div>
                    <div class="px-5 py-3 bg-[#0e0e10] border-t border-white/5 flex items-center justify-between">
                        <span class="text-[10px] text-dim" id="plc-summary">选择章节后开始</span>
                        <div class="flex gap-2">
                            <button class="btn btn-sm bg-white/5 text-dim" onclick="document.getElementById('fb-pipeline-config').style.display='none'">取消</button>
                            <button class="btn btn-sm bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold shadow-lg" onclick="Modules.fusion_book.startConfiguredPipeline()"><i class="fa-solid fa-rocket mr-1"></i>开始执行</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    // ---- 初始化 ----
    async init() {
        await this.loadBookList();
        this._renderChapterList('left');
        this._renderChapterList('right');
        // 恢复保存的文件夹配置
        const folderCfg = await DB.get('settings', 'pipeline_save_folder');
        if (folderCfg && folderCfg.name) this._plConfig.saveFolder = folderCfg.name;
        // 恢复保存的流水线进度
        const savedState = await DB.get('settings', 'pipeline_state');
        if (savedState && savedState.completedPairs && savedState.completedPairs.length > 0) {
            this._savedPipelineState = savedState;
            this._plLog && this._plLog('检测到上次未完成的流水线进度', 'info');
        }
        // 加载章节时间戳
        const timestamps = await DB.get('settings', 'pipeline_chapter_timestamps');
        this._chapterTimestamps = (timestamps && timestamps.data) ? timestamps.data : {};
    },

    _getSelectedChapterCharCount(side) {
        // 同步方法，从缓存取
        if (!this['_cache_' + side]) return 0;
        return this['_cache_' + side].totalChars || 0;
    },

    async loadBookList() {
        const books = await FusionBookSystem.getBooks();
        this._books = books;
        for (const side of ['left', 'right']) {
            const sel = document.getElementById(`fb-${side}-book`);
            if (sel) {
                const cur = sel.value || (this[side].bookId || '');
                sel.innerHTML = '<option value="">选择书籍</option>' + books.map(b => `<option value="${b.id}">${b.name} (${b.chapters.length}章)</option>`).join('');
                if (cur) sel.value = cur;
            }
        }
    },

    selectBook(side, bookId) {
        this[side].bookId = bookId;
        this[side].chapterIdx = null;
        const books = this._books || [];
        const book = books.find(b => b.id === bookId);
        this['_cache_' + side] = book || null;
        this._renderChapterList(side);
        // 清空预览
        const preview = document.getElementById(`fb-${side}-preview`);
        if (preview) preview.innerHTML = '<div class="text-dim text-center py-4">点击章节查看内容</div>';
    },

    _renderChapterList(side) {
        const el = document.getElementById(`fb-${side}-chapters`);
        if (!el) return;
        const books = this._books || [];
        const book = books.find(b => b.id === this[side].bookId);
        if (!book || !book.chapters) {
            el.innerHTML = '<div class="text-[10px] text-dim p-3 text-center">请先选择书籍</div>';
            return;
        }
        const curIdx = this[side].chapterIdx;
        const color = side === 'left' ? 'blue' : 'pink';
        const ts = this._chapterTimestamps || {};
        el.innerHTML = book.chapters.map((ch, i) => {
            const tsKey = `${book.id}_${side}_${i}`;
            const timeStr = ts[tsKey] ? new Date(ts[tsKey]).toLocaleString('zh-CN', {month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : '';
            return `
            <div class="flex items-center gap-2 px-3 py-1.5 text-[11px] cursor-pointer transition-all border-l-2 ${curIdx === i ? 'bg-' + color + '-500/10 text-white border-' + color + '-400 font-bold' : 'text-dim hover:bg-white/5 border-transparent hover:text-white'}" onclick="Modules.fusion_book.clickChapter('${side}',${i})">
                <span class="text-dim/50 w-5 text-right shrink-0">${i + 1}.</span>
                <span class="flex-1 truncate">${ch.title}</span>
                ${timeStr ? `<span class="text-[8px] text-green-400/60 shrink-0">${timeStr}</span>` : ''}
                <span class="text-[9px] text-dim/30">${(ch.content || '').length}字</span>
            </div>`;
        }).join('');
    },

    clickChapter(side, idx) {
        this[side].chapterIdx = idx;
        this._renderChapterList(side);
        // 显示预览
        const books = this._books || [];
        const book = books.find(b => b.id === this[side].bookId);
        if (!book) return;
        const ch = book.chapters[idx];
        if (!ch) return;
        const preview = document.getElementById(`fb-${side}-preview`);
        if (preview) preview.innerHTML = `<div class="text-xs text-white font-bold mb-2">${ch.title}</div><div class="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">${(ch.content || '').slice(0, 3000)}${(ch.content || '').length > 3000 ? '\n\n...(已截断)' : ''}</div>`;
    },

    selectChapter(side, idx) {
        this[side].chapterIdx = idx !== '' ? parseInt(idx) : null;
    },

    async deleteSelectedBook(side) {
        const bookId = this[side].bookId;
        if (!bookId) return UI.toast('请先选择书籍');
        if (!confirm('确定删除此书？')) return;
        await FusionBookSystem.deleteBook(bookId);
        this[side].bookId = null;
        this[side].chapterIdx = null;
        this['_cache_' + side] = null;
        await this.loadBookList();
        this._renderChapterList(side);
        const preview = document.getElementById(`fb-${side}-preview`);
        if (preview) preview.innerHTML = '';
        UI.toast('已删除');
    },

    // ---- 导入书籍 ----
    // ★ 用 <label> + <input type="file"> 触发，不用 input.click()
    // Electron 会阻止 JS 程序化触发的 input.click()
    async _handleImportFile(input) {
        const file = input.files[0];
        input.value = ''; // 重置，允许重复选择同一文件
        if (!file) return;
        UI.toast('正在导入...');
        let text = '';
        if (file.name.endsWith('.epub') && typeof ePub !== 'undefined') {
            try {
                const book = ePub(await file.arrayBuffer());
                const spine = await book.loaded.spine;
                for (const item of spine.items) {
                    const doc = await item.load(book.load.bind(book));
                    text += doc.body?.innerText || '';
                    text += '\n\n';
                }
            } catch(err) { text = await file.text(); }
        } else {
            text = await file.text();
        }
        const name = file.name.replace(/\.(txt|epub)$/i, '');
        // ★ 不用 prompt() — Electron 里 prompt() 会被静默阻止返回 null
        const defaultRegex = '第[一二三四五六七八九十百千\\d]+章\\s*(.+?)(?=\\n|\\r|$)';
        try {
            const book = await FusionBookSystem.addBook(name, text, defaultRegex);
            await this.loadBookList();
            UI.toast(`《${name}》导入成功，共${book.chapters.length}章`);
        } catch(err) {
            console.error('导入失败:', err);
            UI.toast('导入失败: ' + err.message);
        }
    },

    async deleteBook(bookId) {
        if (!confirm('确定删除此书？')) return;
        await FusionBookSystem.deleteBook(bookId);
        await this.loadBookList();
        this._renderChapterList('left');
        this._renderChapterList('right');
        UI.toast('已删除');
    },

    // ---- 分析 ----
    async _getChapterContent(side) {
        const books = this._books || await FusionBookSystem.getBooks();
        const book = books.find(b => b.id === this[side].bookId);
        if (!book) { UI.toast('请先选择' + (side === 'left' ? '左' : '右') + '书'); return null; }
        const ch = book.chapters[this[side].chapterIdx];
        if (!ch) { UI.toast('请选择章节'); return null; }
        return { book, ch };
    },

    _setGenerating(on) {
        this._generating = on;
        const ind = document.getElementById('fb-gen-indicator');
        if (ind) { if (on) ind.classList.remove('hidden'); else ind.classList.add('hidden'); }
    },

    async analyzeLeft() { await this._analyzeSide('left'); },
    async analyzeRight() { await this._analyzeSide('right'); },
    async analyzeSelected() {
        if (this.left.chapterIdx !== null) await this._analyzeSide('left');
        if (this.right.chapterIdx !== null) await this._analyzeSide('right');
    },

    async _analyzeSide(side) {
        const data = await this._getChapterContent(side);
        if (!data) return;
        if (this._generating) return UI.toast('正在生成中');
        const { book, ch } = data;

        let prompt = await Modules.short.getPrompt('fusion_analyze');
        if (!prompt) prompt = this._PROMPTS.analyze;
        prompt = prompt.replace('{{book}}', book.name).replace('{{title}}', ch.title).replace('{{content}}', ch.content.slice(0, 6000));

        const status = document.getElementById('fb-status');
        if (status) status.textContent = `正在分析${side === 'left' ? '左' : '右'}书：${ch.title}`;
        this._setGenerating(true);

        const outEl = document.getElementById('fb-output');
        if (outEl) outEl.innerHTML = '<div class="text-amber-400 animate-pulse"><i class="fa-solid fa-spinner fa-spin mr-2"></i>正在分析...</div>';

        // 流水线模式下同步写入浮层输出
        const plOut = this._pipelineRunning ? document.getElementById('pl-output') : null;
        if (plOut) plOut.textContent = `分析${side === 'left' ? '左' : '右'}书: ${ch.title}...\n`;

        let result = '';
        let aborted = false;
        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                if (plOut) plOut.textContent = result;
            });
        } catch(e) {
            if (e.message === '已中止') { aborted = true; }
            else { UI.toast('分析出错: ' + e.message); }
        }

        // ★ 如果被中止或流水线已停止，不保存结果，抛出错误中断调用链
        if (aborted || !this._pipelineRunning) {
            this._setGenerating(false);
            if (status) status.textContent = `${side === 'left' ? '左' : '右'}书分析已中止`;
            throw new Error('已中止');
        }

        this[side].analysis = result;
        this._pipelineResults[side] = result;
        this._allPipelineResults[side] = (this._allPipelineResults[side] || '') + '\n\n---\n\n' + result;
        this._setGenerating(false);
        if (status) status.textContent = `${side === 'left' ? '左' : '右'}书分析完成 (${result.length}字)`;
        ContextHelper.recordGeneration('拆书分析-' + book.name, result.slice(0, 200));

        // 保存每章分析结果，供循环拆解模式使用
        if (this._plConfig.cycleMode) {
            const cycleKey = `cycle_${book.id}_${this[side].chapterIdx}`;
            await DB.put('settings', { id: cycleKey, content: result, createdAt: Date.now() });
        }

        // 拆解结果存RAG
        if (this._pipelineRunning && result && typeof RAGSystem !== 'undefined') {
            await RAGSystem.addDocument(`拆解_${side === 'left' ? '左' : '右'}书_${ch.title}`, result.slice(0, 8000), 'pipeline');
        }
    },

    // ---- 批量拆解 ----
    async batchAnalyze(side) {
        const books = this._books || await FusionBookSystem.getBooks();
        const book = books.find(b => b.id === this[side].bookId);
        if (!book) return UI.toast('请先选择' + (side === 'left' ? '左' : '右') + '书');
        if (this._generating) return UI.toast('正在生成中');

        const status = document.getElementById('fb-status');
        const outEl = document.getElementById('fb-output');
        let allResults = '';

        for (let i = 0; i < book.chapters.length; i++) {
            if (this._pipelinePaused) break;
            const ch = book.chapters[i];
            if (status) status.textContent = `批量拆解 [${i + 1}/${book.chapters.length}] ${ch.title}`;
            this._setGenerating(true);

            let prompt = await Modules.short.getPrompt('fusion_analyze');
            if (!prompt) prompt = this._PROMPTS.analyze;
            prompt = prompt.replace('{{book}}', book.name).replace('{{title}}', ch.title).replace('{{content}}', ch.content.slice(0, 6000));

            let result = '';
            try {
                await AI.generate(prompt, {}, c => {
                    result += c;
                    if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(`## ${ch.title}\n\n${result}`) : result;
                });
            } catch(e) { result = '(分析失败: ' + e.message + ')'; }

            allResults += `## ${ch.title}\n\n${result}\n\n---\n\n`;
        }

        this[side].analysis = allResults;
        this._pipelineResults[side] = allResults;
        this._setGenerating(false);
        if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(allResults) : allResults;
        if (status) status.textContent = `批量拆解完成 (${book.chapters.length}章)`;
        UI.toast('批量拆解完成');
    },

    async batchAll() {
        await this.batchAnalyze('left');
        await this.batchAnalyze('right');
    },

    // ---- 对比章节 (直接对比原文) ----
    async compareChapters() {
        const leftData = await this._getChapterContent('left');
        const rightData = await this._getChapterContent('right');
        if (!leftData || !rightData) return;
        if (this._generating) return;

        const prompt = `请对比以下两个章节的写作技法差异（只关注技巧层面，不涉及具体角色情节）：\n\n【左书 - ${leftData.ch.title}】\n${leftData.ch.content.slice(0, 4000)}\n\n【右书 - ${rightData.ch.title}】\n${rightData.ch.content.slice(0, 4000)}\n\n请从开篇、节奏、爽点、悬念、对话、场景六个维度对比。`;

        const status = document.getElementById('fb-status');
        if (status) status.textContent = '正在对比章节...';
        this._setGenerating(true);

        const outEl = document.getElementById('fb-output');
        if (outEl) outEl.innerHTML = '<div class="text-purple-400 animate-pulse"><i class="fa-solid fa-spinner fa-spin mr-2"></i>正在对比...</div>';

        let result = '';
        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
            });
        } catch(e) { UI.toast('对比出错: ' + e.message); }

        this._pipelineResults.compare = result;
        this._setGenerating(false);
        if (status) status.textContent = '章节对比完成';
    },

    async compareAnalysis() {
        if (!this.left.analysis || !this.right.analysis) return UI.toast('请先分析左右两书');
        if (this._generating) return;

        // 获取书名（用于日志）
        const leftBook = (this._books || []).find(b => b.id === this.left.bookId);
        const rightBook = (this._books || []).find(b => b.id === this.right.bookId);
        const lName = leftBook ? leftBook.name : '左书';
        const rName = rightBook ? rightBook.name : '右书';

        let prompt = await Modules.short.getPrompt('fusion_compare_analysis');
        if (!prompt) prompt = this._PROMPTS.compare;
        prompt = prompt
            .replace(/{{primaryBook}}/g, primaryName).replace(/{{secondaryBook}}/g, secondaryName)
            .replace('{{primary}}', this[primarySide].analysis.slice(0, 4000))
            .replace('{{secondary}}', this[secondarySide].analysis.slice(0, 4000))
            .replace('{{left}}', this.left.analysis.slice(0, 4000))
            .replace('{{right}}', this.right.analysis.slice(0, 4000));

        const status = document.getElementById('fb-status');
        if (status) status.textContent = '正在对比分析...';
        this._setGenerating(true);

        const outEl = document.getElementById('fb-output');
        if (outEl) outEl.innerHTML = '<div class="text-purple-400 animate-pulse"><i class="fa-solid fa-spinner fa-spin mr-2"></i>正在对比...</div>';

        const plOut = this._pipelineRunning ? document.getElementById('pl-output') : null;
        if (plOut) plOut.textContent = '对比分析中...\n';

        let result = '';
        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                if (plOut) plOut.textContent = result;
            });
        } catch(e) {
            if (e.message === '已中止') { this._setGenerating(false); throw e; }
            UI.toast('对比出错: ' + e.message);
        }
        if (!this._pipelineRunning) { this._setGenerating(false); throw new Error('已中止'); }

        this._pipelineResults.compare = result;
        this._allPipelineResults.compare = (this._allPipelineResults.compare || '') + '\n\n---\n\n' + result;
        this._setGenerating(false);
        if (status) status.textContent = '对比分析完成';
    },

    async fusionMerge() {
        if (!this._pipelineResults.compare && !this.left.analysis && !this.right.analysis) return UI.toast('请先完成分析或对比');
        if (this._generating) return;

        // 获取书名（用于prompt变量替换）
        const primarySide = this._primaryBook || 'left';
        const secondarySide = primarySide === 'left' ? 'right' : 'left';
        const primaryBook = (this._books || []).find(b => b.id === this[primarySide].bookId);
        const secondaryBook = (this._books || []).find(b => b.id === this[secondarySide].bookId);
        const primaryName = primaryBook ? primaryBook.name : (primarySide === 'left' ? '左书' : '右书');
        const secondaryName = secondaryBook ? secondaryBook.name : (primarySide === 'left' ? '右书' : '左书');

        let prompt = await Modules.short.getPrompt('fusion_merge');
        if (!prompt) prompt = this._PROMPTS.fusion;
        prompt = prompt
            .replace(/{{primaryBook}}/g, primaryName).replace(/{{secondaryBook}}/g, secondaryName)
            .replace('{{primary}}', (this[primarySide].analysis || '').slice(0, 3000))
            .replace('{{secondary}}', (this[secondarySide].analysis || '').slice(0, 3000))
            .replace('{{left}}', (this.left.analysis || '').slice(0, 3000))
            .replace('{{right}}', (this.right.analysis || '').slice(0, 3000))
            .replace('{{compare}}', (this._pipelineResults.compare || '').slice(0, 3000));

        // 流水线模式下注入前章上下文 + 世界引擎一致性约束
        const acc = this._accContext || {};
        if (acc.outlines) prompt += `\n\n【前章细纲参考（保持连贯性）】\n${acc.outlines.slice(-2000)}`;
        if (acc.entities) prompt += `\n\n【已提取实体（保持一致性）】\n${acc.entities.slice(-1500)}`;

        // ★ 注入世界引擎全局一致性上下文（跨章世界观/角色/伏笔/情绪约束）
        try {
            const consistencyCtx = await this._buildConsistencyContext();
            if (consistencyCtx) prompt += `\n\n${consistencyCtx}`;
        } catch(e) { console.warn('一致性上下文构建失败:', e); }

        const status = document.getElementById('fb-status');
        if (status) status.textContent = '正在融合精华...';
        this._setGenerating(true);

        const outEl = document.getElementById('fb-output');
        if (outEl) outEl.innerHTML = '<div class="text-amber-400 animate-pulse"><i class="fa-solid fa-spinner fa-spin mr-2"></i>正在融合...</div>';

        const plOut = this._pipelineRunning ? document.getElementById('pl-output') : null;
        if (plOut) plOut.textContent = '融合精华中...\n';

        let result = '';
        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                if (plOut) plOut.textContent = result;
            });
        } catch(e) {
            if (e.message === '已中止') { this._setGenerating(false); throw e; }
            UI.toast('融合出错: ' + e.message);
        }
        if (!this._pipelineRunning) { this._setGenerating(false); throw new Error('已中止'); }

        this._pipelineResults.fusion = result;
        this._allPipelineResults.fusion = (this._allPipelineResults.fusion || '') + '\n\n---\n\n' + result;
        this._setGenerating(false);
        if (status) status.textContent = '融合完成';

        // ★ 持久化融合精华到DB，供凤凰创作流和其他模块读取
        if (result) {
            await DB.put('settings', { id: 'pipeline_fusion_context', content: this._allPipelineResults.fusion, updatedAt: Date.now() });
        }
    },

    // ---- 一键流水线 (浮层版) ----
    async runPipeline() {
        if (this._generating || this._pipelineRunning) return UI.toast('正在运行中');
        // ★ 预检查API是否可用
        const apiCheck = await AI.getActiveConfig('text');
        if (!apiCheck) return UI.toast('⚠️ 未配置API流量池，请先在「系统设置」→「API流量池」中添加API密钥', 'error');
        const leftData = await this._getChapterContent('left');
        const rightData = await this._getChapterContent('right');
        if (!leftData || !rightData) return;

        this._pipelineRunning = true;
        this._pipelinePaused = false;
        this._allPipelineResults = { left: '', right: '', compare: '', fusion: '', world: '', outline: '', write: '' };
        this._plShowOverlay();

        const status = document.getElementById('fb-status');
        const leftBook = (this._books || []).find(b => b.id === this.left.bookId);
        const rightBook = (this._books || []).find(b => b.id === this.right.bookId);

        // 更新流水线信息
        const infoEl = document.getElementById('pl-pipeline-info');
        if (infoEl) {
            const lName = leftBook ? leftBook.name : '未选';
            const rName = rightBook ? rightBook.name : '未选';
            const lChapters = leftBook ? leftBook.chapters.length : 0;
            const rChapters = rightBook ? rightBook.chapters.length : 0;
            const lIdx = this.left.chapterIdx;
            const rIdx = this.right.chapterIdx;
            infoEl.innerHTML = `左书: 《${lName}(1-${lChapters}章)》 | 右书: 《${rName}(1-${rChapters}章)》<br>` +
                `已进章节: ${lIdx !== null ? lIdx + 1 : '-'}, ${rIdx !== null ? rIdx + 1 : '-'}<br>` +
                `细纲: ✓ | 实体提取: ✓ | 正文: ✓`;
        }

        const steps = [
            { key: 'left', label: '分析左书', fn: () => this._analyzeSide('left') },
            { key: 'right', label: '分析右书', fn: () => this._analyzeSide('right') },
            { key: 'compare', label: '对比分析', fn: () => this.compareAnalysis() },
            { key: 'fusion', label: '融合精华', fn: () => this.fusionMerge() },
            { key: 'outline', label: '细纲生成', fn: () => this._pipelineSaveOutline() },
            { key: 'world', label: '实体提取', fn: () => this._pipelineExtractEntities() },
            { key: 'write', label: '正文创作', fn: () => this._pipelineWrite() }
        ];

        for (let i = 0; i < steps.length; i++) {
            if (this._pipelinePaused) {
                await DB.put('settings', { id: 'pipeline_state', step: i, results: this._pipelineResults });
                this._plLog('流水线已暂停，可断点续跑', 'info');
                break;
            }
            this._pipelineStep = i;
            const step = steps[i];
            const stepNums = ['①','②','③','④','⑤','⑥','⑦'];
            if (status) status.textContent = `流水线 [${i+1}/${steps.length}] ${step.label}...`;
            this._plSetStep(step.key, 'active', step.label + '...');
            this._plLog(`${stepNums[i]} 开始: ${step.label}`, 'info');
            const stepLabel = document.getElementById('pl-step-label');
            if (stepLabel) stepLabel.textContent = `${i+1}/${steps.length} 处理中`;
            const titleEl = document.getElementById('pl-current-title');
            if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1 text-amber-400"></i>${step.label}`;
            const miniStatus = document.getElementById('pl-mini-status');
            if (miniStatus) {
                const stepNums2 = ['①','②','③','④','⑤','⑥','⑦'];
                const lCh = leftBook && leftBook.chapters[this.left.chapterIdx] ? leftBook.chapters[this.left.chapterIdx].title : '';
                const rCh = rightBook && rightBook.chapters[this.right.chapterIdx] ? rightBook.chapters[this.right.chapterIdx].title : '';
                miniStatus.textContent = `${stepNums2[i]} ${step.label} · ${lCh} vs ${rCh}  ${i+1}/${steps.length} 处理中...`;
            }

            if (!this._pipelineResults[step.key]) {
                try {
                    await step.fn();
                    const len = (this._pipelineResults[step.key] || '').length;
                    this._plSetStep(step.key, 'done', len > 0 ? len + '字' : '✓');
                    this._plLog(`🟢 ${stepNums[i]} ${step.label}完成` + (len > 0 ? ` (${len}字)` : ''), 'ok');
                } catch(e) {
                    this._plSetStep(step.key, 'error', '失败');
                    this._plLog(`🔴 ${stepNums[i]} ${step.label}失败 - ${e.message}`, 'err');
                }
            } else {
                const len = this._pipelineResults[step.key].length;
                this._plSetStep(step.key, 'done', len > 0 ? len + '字' : '✓');
                this._plLog(`⏭ ${stepNums[i]} 跳过(已有): ${step.label}`, 'info');
            }
        }

        this._pipelineRunning = false;
        const pauseBtn = document.getElementById('pl-pause-btn');
        const stopBtn = document.getElementById('pl-stop-btn');
        if (pauseBtn) pauseBtn.style.display = 'none';
        if (stopBtn) stopBtn.style.display = 'none';

        if (!this._pipelinePaused) {
            await DB.del('settings', 'pipeline_state');
            // 将累积结果设为当前结果
            this._pipelineResults = { ...this._allPipelineResults };
            if (status) status.textContent = '流水线全部完成';
            const stepLabel = document.getElementById('pl-step-label');
            if (stepLabel) stepLabel.textContent = '全部完成';
            const titleEl = document.getElementById('pl-current-title');
            if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-check-circle mr-1 text-green-400"></i>流水线全部完成';
            this._plLog('🎉 流水线全部完成！已同步到世界引擎、细纲、正文', 'ok');
            UI.toast('流水线执行完毕');
        }
    },

    // ---- 批量多章流水线 ----
    async runBatchPipeline() {
        if (this._generating || this._pipelineRunning) return UI.toast('正在运行中');
        // ★ 预检查API是否可用
        const apiCheck = await AI.getActiveConfig('text');
        if (!apiCheck) return UI.toast('⚠️ 未配置API流量池，请先在「系统设置」→「API流量池」中添加API密钥', 'error');
        const leftBook = (this._books || []).find(b => b.id === this.left.bookId);
        const rightBook = (this._books || []).find(b => b.id === this.right.bookId);
        if (!leftBook || !rightBook) return UI.toast('请先选择左右两本书');

        const totalChapters = Math.min(leftBook.chapters.length, rightBook.chapters.length);
        if (totalChapters === 0) return UI.toast('书籍没有章节');

        this._pipelineRunning = true;
        this._pipelinePaused = false;
        this._allPipelineResults = { left: '', right: '', compare: '', fusion: '', world: '', outline: '', write: '' };
        this._plShowOverlay();

        const infoEl = document.getElementById('pl-pipeline-info');
        if (infoEl) {
            infoEl.innerHTML = `左书: 《${leftBook.name}》(${leftBook.chapters.length}章) | 右书: 《${rightBook.name}》(${rightBook.chapters.length}章)<br>` +
                `批量模式: 共 ${totalChapters} 章<br>细纲: ✓ | 实体提取: ✓ | 正文: ✓`;
        }

        this._plLog(`🚀 批量流水线启动: ${totalChapters} 章`, 'ok');
        let allOutlines = '';
        let allWritings = '';

        for (let chIdx = 0; chIdx < totalChapters; chIdx++) {
            if (this._pipelinePaused) {
                this._plLog(`批量流水线已暂停 (${chIdx}/${totalChapters})`, 'info');
                break;
            }

            const lCh = leftBook.chapters[chIdx];
            const rCh = rightBook.chapters[chIdx];
            this._plLog(`[${chIdx + 1}/${totalChapters}] 🔵 左 '${lCh.title}' vs 右 '${rCh.title}'`, 'info');

            const titleEl = document.getElementById('pl-current-title');
            if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1 text-amber-400"></i>[${chIdx + 1}/${totalChapters}] 第${chIdx + 1}章`;
            const stepLabel = document.getElementById('pl-step-label');
            if (stepLabel) stepLabel.textContent = `${chIdx + 1}/${totalChapters} 处理中`;
            const miniStatus = document.getElementById('pl-mini-status');
            if (miniStatus) miniStatus.textContent = `[${chIdx + 1}/${totalChapters}] 第${chIdx + 1}章 ${lCh.title}`;

            // 重置本轮结果
            this._pipelineResults = { left: '', right: '', compare: '', fusion: '', world: '', outline: '', write: '' };
            ['left','right','compare','fusion','outline','world','write'].forEach(k => this._plSetStep(k, 'pending', ''));

            // 设置当前章节索引
            this.left.chapterIdx = chIdx;
            this.right.chapterIdx = chIdx;

            const stepNums = ['①','②','③','④','⑤','⑥','⑦'];
            const steps = [
                { key: 'left', label: '分析左书', fn: () => this._analyzeSide('left') },
                { key: 'right', label: '分析右书', fn: () => this._analyzeSide('right') },
                { key: 'compare', label: '对比分析', fn: () => this.compareAnalysis() },
                { key: 'fusion', label: '融合精华', fn: () => this.fusionMerge() },
                { key: 'outline', label: '细纲生成', fn: () => this._pipelineSaveOutline() },
                { key: 'world', label: '实体提取', fn: () => this._pipelineExtractEntities() },
                { key: 'write', label: '正文创作', fn: () => this._pipelineWrite() }
            ];

            for (let i = 0; i < steps.length; i++) {
                if (this._pipelinePaused) break;
                const step = steps[i];
                this._plSetStep(step.key, 'active', step.label + '...');

                if (miniStatus) miniStatus.textContent = `${stepNums[i]} ${step.label} · 第${chIdx+1}章 ${lCh.title} vs ${rCh.title}  ${chIdx+1}/${totalChapters} 处理中...`;

                try {
                    await step.fn();
                    const len = (this._pipelineResults[step.key] || '').length;
                    this._plSetStep(step.key, 'done', len > 0 ? len + '字' : '✓');
                    this._plLog(`[${chIdx+1}/${totalChapters}] 🟢 ${stepNums[i]} ${step.label}完成` + (len > 0 ? ` (${len}字)` : ''), 'ok');
                } catch(e) {
                    this._plSetStep(step.key, 'error', '失败');
                    this._plLog(`[${chIdx+1}/${totalChapters}] 🔴 ${stepNums[i]} ${step.label}: ${e.message}`, 'err');
                }
            }

            if (this._pipelineResults.outline) allOutlines += `## 第${chIdx + 1}章\n\n${this._pipelineResults.outline}\n\n---\n\n`;
            if (this._pipelineResults.write) allWritings += `## 第${chIdx + 1}章\n\n${this._pipelineResults.write}\n\n---\n\n`;
        }

        this._pipelineRunning = false;
        const pauseBtn = document.getElementById('pl-pause-btn');
        const stopBtn = document.getElementById('pl-stop-btn');
        if (pauseBtn) pauseBtn.style.display = 'none';
        if (stopBtn) stopBtn.style.display = 'none';

        if (!this._pipelinePaused) {
            // 将累积结果设为当前结果，供凤凰创作流/世界引擎读取
            this._pipelineResults = { ...this._allPipelineResults };

            // 保存汇总
            if (allOutlines) {
                await DB.put('outlines', {
                    id: 'batch_outline_' + Date.now(),
                    title: `批量细纲 (${leftBook.name} × ${rightBook.name})`,
                    content: allOutlines,
                    source: 'batch_pipeline',
                    createdAt: Date.now()
                });
            }
            if (allWritings) {
                await DB.put('writings', {
                    id: 'batch_write_' + Date.now(),
                    title: `批量正文 (${leftBook.name} × ${rightBook.name})`,
                    content: allWritings,
                    source: 'batch_pipeline',
                    createdAt: Date.now()
                });
            }

            const titleEl = document.getElementById('pl-current-title');
            if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-check-circle mr-1 text-green-400"></i>批量流水线全部完成';
            const stepLabel = document.getElementById('pl-step-label');
            if (stepLabel) stepLabel.textContent = '全部完成';
            this._plLog(`\n🎉 批量流水线完成！共处理 ${totalChapters} 章`, 'ok');
            UI.toast(`批量流水线完成: ${totalChapters}章`);
        }
    },

    // ---- 浮层控制 ----
    _plShowOverlay() {
        const overlay = document.getElementById('fb-pipeline-overlay');
        const mini = document.getElementById('fb-pipeline-mini');
        if (overlay) overlay.style.display = 'flex';
        if (mini) mini.style.display = 'none';
        // 重置
        ['left','right','compare','fusion','outline','world','write'].forEach(k => this._plSetStep(k, 'pending', ''));
        const logEl = document.getElementById('pl-log');
        if (logEl) logEl.innerHTML = '';
        const outEl = document.getElementById('pl-output');
        if (outEl) outEl.textContent = '流水线启动中...';
        const pauseBtn = document.getElementById('pl-pause-btn');
        const stopBtn = document.getElementById('pl-stop-btn');
        if (pauseBtn) pauseBtn.style.display = '';
        if (stopBtn) stopBtn.style.display = '';
    },

    plMinimize() {
        const overlay = document.getElementById('fb-pipeline-overlay');
        const mini = document.getElementById('fb-pipeline-mini');
        if (overlay) overlay.style.display = 'none';
        if (mini) mini.style.display = 'flex';
    },

    plRestore() {
        const overlay = document.getElementById('fb-pipeline-overlay');
        const mini = document.getElementById('fb-pipeline-mini');
        if (overlay) overlay.style.display = 'flex';
        if (mini) mini.style.display = 'none';
    },

    plPause() {
        this._pipelinePaused = true;
        // 不设 _pipelineRunning=false，保持浮层打开
        AI.abort(); // 中止正在进行的AI调用
        this._setGenerating(false);
        this._plLog('⏸ 用户暂停 — 点击"继续"可断点续跑', 'info');
        UI.toast('已暂停，进度已保存');
        // 显示继续按钮
        const pauseBtn = document.getElementById('pl-pause-btn');
        if (pauseBtn) pauseBtn.outerHTML = `<button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" id="pl-resume-btn" onclick="Modules.fusion_book.plResume()"><i class="fa-solid fa-play mr-1"></i>继续</button>`;
    },

    async plResume() {
        if (!this._pipelinePaused) return;
        this._pipelinePaused = false;
        this._pipelineRunning = true;
        this._plLog('▶ 继续执行流水线', 'ok');
        UI.toast('继续执行');
        // 恢复暂停/停止按钮
        const resumeBtn = document.getElementById('pl-resume-btn');
        if (resumeBtn) resumeBtn.outerHTML = `<button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" id="pl-pause-btn" onclick="Modules.fusion_book.plPause()"><i class="fa-solid fa-pause mr-1"></i>暂停</button>`;
        // 从保存的状态恢复执行
        await this._runConfiguredPipeline(true);
    },

    async plStop() {
        this._pipelinePaused = true;
        this._pipelineRunning = false;
        AI.abort(); // 中止正在进行的AI调用
        this._setGenerating(false);
        this._plLog('⏹ 用户停止', 'err');
        // ★ 清除保存的进度，停止后不再自动恢复
        this._savedPipelineState = null;
        try { await DB.del('settings', 'pipeline_state'); } catch(e) {}
        UI.toast('已停止，进度已清除（刷新后不再自动恢复）');
        // 不关闭浮层，用户可以查看结果
    },

    plClose() {
        const overlay = document.getElementById('fb-pipeline-overlay');
        if (overlay) overlay.style.display = 'none';
        const miniStatus = document.getElementById('pl-mini-status');
        if (miniStatus && !this._pipelineRunning) {
            if (this._savedPipelineState) {
                miniStatus.textContent = '继续上次流水线 (' + (this._savedPipelineState.completedPairs||[]).length + '章已完成)';
            } else {
                miniStatus.textContent = '一键自动拆书链';
            }
        }
    },

    // ---- 从保存的进度恢复 ----
    async _resumeFromSaved() {
        const saved = this._savedPipelineState || await DB.get('settings', 'pipeline_state');
        if (!saved) return this.showPipelineConfig();

        // 恢复配置
        const cfg = saved.config || {};
        if (cfg.leftBookId) this.left.bookId = cfg.leftBookId;
        if (cfg.rightBookId) this.right.bookId = cfg.rightBookId;
        if (cfg.leftChapters) this._plConfig.leftChapters = cfg.leftChapters;
        if (cfg.rightChapters) this._plConfig.rightChapters = cfg.rightChapters;
        if (cfg.doExtract !== undefined) this._plConfig.doExtract = cfg.doExtract;
        if (cfg.doOutline !== undefined) this._plConfig.doOutline = cfg.doOutline;
        if (cfg.doWrite !== undefined) this._plConfig.doWrite = cfg.doWrite;
        if (cfg.doRAG !== undefined) this._plConfig.doRAG = cfg.doRAG;

        await this.loadBookList();
        this._renderChapterList('left');
        this._renderChapterList('right');

        const doneCount = (saved.completedPairs || []).length;
        const totalCount = Math.min((cfg.leftChapters||[]).length, (cfg.rightChapters||[]).length);
        UI.toast(`恢复流水线: 已完成${doneCount}/${totalCount}章，继续执行`);

        this._plShowOverlay();
        this._plLog(`📂 从保存的进度恢复: 已完成${doneCount}/${totalCount}章`, 'ok');
        await this._runConfiguredPipeline(true);
    },

    // ---- 选择本地保存文件夹 ----
    async selectSaveFolder() {
        try {
            if (LocalSync.isElectron()) {
                // ★ Electron 模式: 用原生对话框选择文件夹
                const r = await window.electronAPI.showOpenDialog({ properties: ['openDirectory'] });
                if (r && !r.canceled && r.filePaths && r.filePaths[0]) {
                    const folderPath = r.filePaths[0];
                    const folderName = folderPath.split('\\').pop().split('/').pop();
                    const oldPath = LocalSync.electronPath;
                    const isNewFolder = !oldPath || oldPath !== folderPath;

                    this._plConfig.saveFolder = folderName;
                    this._plConfig._folderHandle = null; // Electron 不用 handle

                    if (isNewFolder) {
                        LocalSync.electronPath = folderPath;
                        localStorage.setItem('local_sync_path', folderPath);
                        await LocalSync._onFolderSwitch();
                    } else {
                        await DB.put('settings', { id: 'pipeline_save_folder', name: folderName });
                        UI.toast('已选择文件夹: ' + folderName);
                        this.refresh();
                    }
                }
            } else if (LocalSync.hasFSAPI()) {
                try {
                    const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
                    const oldFolder = LocalSync.dirHandle ? LocalSync.dirHandle.name : null;
                    const isNewFolder = !oldFolder || oldFolder !== handle.name;
                    this._plConfig.saveFolder = handle.name;
                    this._plConfig._folderHandle = handle;
                    if (isNewFolder) {
                        LocalSync.dirHandle = handle;
                        localStorage.setItem('local_sync_folder_name', handle.name);
                        await LocalSync._onFolderSwitch();
                    } else {
                        await DB.put('settings', { id: 'pipeline_save_folder', name: handle.name });
                        UI.toast('已选择文件夹: ' + handle.name);
                        this.refresh();
                    }
                } catch(fsErr) {
                    if (fsErr.name === 'AbortError') return;
                    // FSAPI 被阻止 → fallback
                    await LocalSync.pickFolder();
                    if (LocalSync.isReady()) {
                        this._plConfig.saveFolder = LocalSync.getFolderName();
                        this.refresh();
                    }
                }
            } else {
                // ★ Fallback: 走虚拟工作空间选择器
                await LocalSync.pickFolder();
                if (LocalSync.isReady()) {
                    this._plConfig.saveFolder = LocalSync.getFolderName();
                    this.refresh();
                }
            }
        } catch(e) { if (e.name !== 'AbortError') UI.toast('选择文件夹失败: ' + e.message); }
    },

    refresh() {
        const view = document.getElementById('module-view-fusion_book');
        if (view) view.innerHTML = this.render();
        this.init();
    },

    // ---- 保存文件到本地文件夹 ----
    async _saveToLocal(filename, content) {
        try {
            if (LocalSync.isElectron() && LocalSync.electronPath) {
                // ★ Electron 模式: 直接用 Node.js fs 写文件
                await window.electronAPI.fs.writeFile(
                    LocalSync.electronPath + '\\' + filename, content, 'utf-8'
                );
                this._plConfig.lastSync = Date.now();
            } else if (this._plConfig._folderHandle) {
                // 浏览器 File System Access API
                const fileHandle = await this._plConfig._folderHandle.getFileHandle(filename, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(content);
                await writable.close();
                this._plConfig.lastSync = Date.now();
            }
        } catch(e) { console.warn('本地保存失败:', e); }
    },

    // ---- 配置弹窗 ----
    showPipelineConfig() {
        const modal = document.getElementById('fb-pipeline-config');
        if (!modal) return;
        modal.style.display = 'flex';
        this._renderConfigChapters();
    },

    _renderConfigChapters() {
        const books = this._books || [];
        const leftBook = books.find(b => b.id === this.left.bookId);
        const rightBook = books.find(b => b.id === this.right.bookId);

        const renderSide = (side, book, containerId) => {
            const el = document.getElementById(containerId);
            if (!el) return;
            if (!book) { el.innerHTML = '<div class="text-[10px] text-dim p-2">请先选择书籍</div>'; return; }
            el.innerHTML = book.chapters.map((ch, i) => `
                <label class="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 cursor-pointer">
                    <input type="checkbox" class="plc-ch-${side} accent-green-500" data-idx="${i}" checked>
                    <span class="text-[11px] text-gray-300">${i + 1}. ${ch.title}</span>
                    <span class="text-[9px] text-dim ml-auto">${ch.content ? (ch.content.length / 10000).toFixed(1) + '万' : '-'}</span>
                </label>
            `).join('');
            this._updateConfigSummary();
        };

        renderSide('left', leftBook, 'plc-left-chapters');
        renderSide('right', rightBook, 'plc-right-chapters');
    },

    _plConfigSelectAll(side, checked) {
        document.querySelectorAll(`.plc-ch-${side}`).forEach(cb => cb.checked = checked);
        this._updateConfigSummary();
    },

    _updateConfigSummary() {
        const leftCount = document.querySelectorAll('.plc-ch-left:checked').length;
        const rightCount = document.querySelectorAll('.plc-ch-right:checked').length;
        const total = Math.min(leftCount, rightCount);
        const el = document.getElementById('plc-summary');
        if (el) el.textContent = `左书 ${leftCount} 章 × 右书 ${rightCount} 章 = 共 ${total} 轮流水线`;
    },

    // ---- 从配置弹窗启动流水线 ----
    async startConfiguredPipeline() {
        // 收集勾选的章节
        const leftIdxs = [];
        document.querySelectorAll('.plc-ch-left:checked').forEach(cb => leftIdxs.push(parseInt(cb.dataset.idx)));
        const rightIdxs = [];
        document.querySelectorAll('.plc-ch-right:checked').forEach(cb => rightIdxs.push(parseInt(cb.dataset.idx)));

        if (leftIdxs.length === 0 || rightIdxs.length === 0) return UI.toast('请至少勾选左右各一章');

        // 收集选项
        this._plConfig.doExtract = document.getElementById('plc-do-extract')?.checked ?? true;
        this._plConfig.doOutline = document.getElementById('plc-do-outline')?.checked ?? true;
        this._plConfig.doWrite = document.getElementById('plc-do-write')?.checked ?? true;
        this._plConfig.doRAG = document.getElementById('plc-do-rag')?.checked ?? true;
        this._plConfig.cycleMode = document.getElementById('plc-cycle-mode')?.checked ?? false;
        this._plConfig.cycleSize = parseInt(document.getElementById('plc-cycle-size')?.value ?? 5);
        this._plConfig.maxConcurrency = parseInt(document.getElementById('plc-concurrency')?.value ?? 1);
        this._plConfig.leftChapters = leftIdxs;
        this._plConfig.rightChapters = rightIdxs;

        // 关闭配置弹窗
        const modal = document.getElementById('fb-pipeline-config');
        if (modal) modal.style.display = 'none';

        // 启动流水线（清除旧进度）
        this._savedPipelineState = null;
        await DB.del('settings', 'pipeline_state');
        await this._runConfiguredPipeline(false);
    },

    async _runConfiguredPipeline(isResume = false) {
        if (this._generating && !isResume) return UI.toast('正在运行中');
        const apiCheck = await AI.getActiveConfig('text');
        if (!apiCheck) return UI.toast('⚠️ 未配置API流量池，请先在「系统设置」→「API流量池」中添加API密钥', 'error');
        const leftBook = (this._books || []).find(b => b.id === this.left.bookId);
        const rightBook = (this._books || []).find(b => b.id === this.right.bookId);
        if (!leftBook || !rightBook) return UI.toast('请先选择左右两本书');

        if (!this._primaryBook || !this._primarySettings) {
            this._primaryBook = 'left';
            await this._savePrimarySettings();
            this._plLog(`⚠️ 未设置主书，已自动将《${leftBook.name}》设为主书`, 'info');
        }
        const primaryName = this._primarySettings?.bookName || leftBook.name;
        const secondaryName = this._primaryBook === 'left' ? rightBook.name : leftBook.name;
        this._plLog(`📌 技法来源: 《${primaryName}》+ 《${secondaryName}》→ 融合细纲（角色/情节全部原创）`, 'ok');

        const cfg = this._plConfig;
        const maxConcurrency = cfg.maxConcurrency || 1;
        const pairs = [];
        const maxLen = Math.min(cfg.leftChapters.length, cfg.rightChapters.length);
        for (let i = 0; i < maxLen; i++) {
            pairs.push({ leftIdx: cfg.leftChapters[i], rightIdx: cfg.rightChapters[i] });
        }
        if (pairs.length === 0) return UI.toast('没有可配对的章节');

        let completedPairs = [];
        let accOutlines = '';
        let accEntities = '';
        let allOutlines = '';
        let allWritings = '';

        if (isResume) {
            const saved = this._savedPipelineState || await DB.get('settings', 'pipeline_state');
            if (saved) {
                completedPairs = saved.completedPairs || [];
                accOutlines = saved.accOutlines || '';
                accEntities = saved.accEntities || '';
                allOutlines = saved.allOutlines || '';
                allWritings = saved.allWritings || '';
                if (saved.allPipelineResults) this._allPipelineResults = saved.allPipelineResults;
            }
        }

        if (!isResume) {
            this._pipelineRunning = true;
            this._pipelinePaused = false;
            this._allPipelineResults = { left: '', right: '', compare: '', fusion: '', world: '', outline: '', write: '' };
            this._plShowOverlay();
        } else {
            this._pipelineRunning = true;
            this._pipelinePaused = false;
        }

        const scheduler = this._agentScheduler;
        scheduler.reset();
        this._updateAgentStats();
        this._setPhase(0);

        const infoEl = document.getElementById('pl-pipeline-info');
        if (infoEl) {
            const opts = [];
            if (cfg.doExtract) opts.push('知识图谱');
            if (cfg.doOutline) opts.push('细纲');
            if (cfg.doWrite) opts.push('正文');
            if (cfg.doRAG) opts.push('RAG');
            const doneCount = completedPairs.length;
            infoEl.innerHTML = `左书: 《${leftBook.name}》 | 右书: 《${rightBook.name}》<br>` +
                `已选章节: ${pairs.length} 对${doneCount > 0 ? ' (已完成' + doneCount + '对)' : ''}<br>` +
                `Agent并发: ${maxConcurrency} | 启用: ${opts.join(' | ')}`;
        }

        this._plLog(`🚀 流水线${isResume ? '恢复' : '启动'}: ${pairs.length} 对章节 | Agent并发:${maxConcurrency}`, 'ok');

        const pendingPairs = pairs.filter((p, i) => {
            const pairKey = `${p.leftIdx}_${p.rightIdx}`;
            return !completedPairs.includes(pairKey);
        });
        const startPIdx = pairs.length - pendingPairs.length;

        // ═══════════════════════════════════════════════════════════════
        // Phase 1: 并发分析 (Map)
        // ═══════════════════════════════════════════════════════════════
        this._plLog(`\n━━━ Phase ① 并发分析 (Map) ━━━`, 'info');
        this._setPhase(1);
        for (let i = 0; i < pendingPairs.length; i++) {
            const pIdx = startPIdx + i;
            const { leftIdx, rightIdx } = pendingPairs[i];
            const lCh = leftBook.chapters[leftIdx];
            const rCh = rightBook.chapters[rightIdx];

            scheduler.addTask(`analyze_left_${pIdx}`, async () => {
                const savedIdx = this.left.chapterIdx;
                const savedAnalysis = this.left.analysis;
                this.left.chapterIdx = leftIdx;
                await this._analyzeSide('left');
                const result = this.left.analysis;
                this.left.chapterIdx = savedIdx;
                this.left.analysis = savedAnalysis;
                this._plLog(`[${pIdx+1}/${pairs.length}] 左书分析完成: ${lCh.title} (${result.length}字)`, 'ok');
                this._updateAgentStats();
                return { result, chapterIdx: leftIdx, title: lCh.title };
            }, 5, 1);

            scheduler.addTask(`analyze_right_${pIdx}`, async () => {
                const savedIdx = this.right.chapterIdx;
                const savedAnalysis = this.right.analysis;
                this.right.chapterIdx = rightIdx;
                await this._analyzeSide('right');
                const result = this.right.analysis;
                this.right.chapterIdx = savedIdx;
                this.right.analysis = savedAnalysis;
                this._plLog(`[${pIdx+1}/${pairs.length}] 右书分析完成: ${rCh.title} (${result.length}字)`, 'ok');
                this._updateAgentStats();
                return { result, chapterIdx: rightIdx, title: rCh.title };
            }, 5, 1);
        }
        const statsInterval1 = setInterval(() => this._updateAgentStats(), 500);
        await scheduler.run(maxConcurrency);
        clearInterval(statsInterval1);
        this._updateAgentStats();

        if (this._pipelinePaused) {
            await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // Phase 2: 章节融合 (Reduce - 半并发)
        // ═══════════════════════════════════════════════════════════════
        this._plLog(`\n━━━ Phase ② 章节融合 (Reduce) ━━━`, 'info');
        this._setPhase(2);
        scheduler.reset();
        for (let i = 0; i < pendingPairs.length; i++) {
            const pIdx = startPIdx + i;
            const { leftIdx, rightIdx } = pendingPairs[i];
            const lCh = leftBook.chapters[leftIdx];
            const rCh = rightBook.chapters[rightIdx];

            scheduler.addTask(`fusion_${pIdx}`, async () => {
                const leftRes = scheduler._results[`analyze_left_${pIdx}`];
                const rightRes = scheduler._results[`analyze_right_${pIdx}`];

                const savedLeftIdx = this.left.chapterIdx;
                const savedRightIdx = this.right.chapterIdx;
                const savedLeftAnalysis = this.left.analysis;
                const savedRightAnalysis = this.right.analysis;
                const savedPipelineResults = { ...this._pipelineResults };

                this.left.chapterIdx = leftIdx;
                this.right.chapterIdx = rightIdx;
                this.left.analysis = leftRes?.result || '';
                this.right.analysis = rightRes?.result || '';
                this._pipelineResults = { left: this.left.analysis, right: this.right.analysis, compare: '', fusion: '', world: '', outline: '', write: '' };

                this._plSetStep('left', 'done', (leftRes?.result?.length || 0) + '字');
                this._plSetStep('right', 'done', (rightRes?.result?.length || 0) + '字');
                this._plSetStep('compare', 'active', '对比中...');

                try { await this.compareAnalysis(); }
                catch(e) {
                    if (e.message === '已中止') throw e;
                    this._plLog(`[${pIdx+1}/${pairs.length}] 对比失败: ${e.message}`, 'err');
                }
                const compareRes = this._pipelineResults.compare;
                this._plSetStep('compare', 'done', (compareRes?.length || 0) + '字');
                this._plSetStep('fusion', 'active', '融合中...');

                try { await this.fusionMerge(); }
                catch(e) {
                    if (e.message === '已中止') throw e;
                    this._plLog(`[${pIdx+1}/${pairs.length}] 融合失败: ${e.message}`, 'err');
                }
                const fusionRes = this._pipelineResults.fusion;
                this._plSetStep('fusion', 'done', (fusionRes?.length || 0) + '字');
                this._plLog(`[${pIdx+1}/${pairs.length}] 融合完成: ${lCh.title} (${fusionRes?.length || 0}字)`, 'ok');

                this.left.chapterIdx = savedLeftIdx;
                this.right.chapterIdx = savedRightIdx;
                this.left.analysis = savedLeftAnalysis;
                this.right.analysis = savedRightAnalysis;
                this._pipelineResults = savedPipelineResults;
                this._updateAgentStats();

                return { chapterIdx: pIdx, leftIdx, rightIdx, compare: compareRes, fusion: fusionRes };
            }, 5, 2);
        }
        const statsInterval2 = setInterval(() => this._updateAgentStats(), 500);
        await scheduler.run(maxConcurrency);
        clearInterval(statsInterval2);
        this._updateAgentStats();

        if (this._pipelinePaused) {
            await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // Phase 3: 循环总结 (Sequential)
        // ═══════════════════════════════════════════════════════════════
        if (cfg.cycleMode && pendingPairs.length > 0) {
            this._plLog(`\n━━━ Phase ③ 循环总结 (Sequential) ━━━`, 'info');
            this._setPhase(3);
            for (let i = 0; i < pendingPairs.length; i++) {
                const pIdx = startPIdx + i;
                const { leftIdx, rightIdx } = pendingPairs[i];
                const leftRes = scheduler._results[`analyze_left_${pIdx}`];
                const rightRes = scheduler._results[`analyze_right_${pIdx}`];
                if (leftRes?.result) {
                    await DB.put('settings', { id: `cycle_${leftBook.id}_${leftIdx}`, content: leftRes.result, createdAt: Date.now() });
                }
                if (rightRes?.result) {
                    await DB.put('settings', { id: `cycle_${rightBook.id}_${rightIdx}`, content: rightRes.result, createdAt: Date.now() });
                }
            }

            for (let i = 0; i < pendingPairs.length; i += cfg.cycleSize) {
                if (this._pipelinePaused || !this._pipelineRunning) break;
                const cyclePairs = pendingPairs.slice(i, i + cfg.cycleSize);
                const startCh = cyclePairs[0].leftIdx + 1;
                const endCh = cyclePairs[cyclePairs.length - 1].leftIdx + 1;
                this._plLog(`🔄 循环总结: 第${startCh}-${endCh}章`, 'info');
                await this._cycleFusionSummary(cyclePairs, cyclePairs.length, leftBook, rightBook);
            }
        }

        if (this._pipelinePaused) {
            await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // Phase 4: 细纲 + 实体 + 正文 (Sequential)
        // ═══════════════════════════════════════════════════════════════
        this._plLog(`\n━━━ Phase ④ 细纲/实体/正文 (Sequential) ━━━`, 'info');
        this._setPhase(4);

        for (let i = 0; i < pendingPairs.length; i++) {
            if (this._pipelinePaused || !this._pipelineRunning) break;
            const pIdx = startPIdx + i;
            const { leftIdx, rightIdx } = pendingPairs[i];
            const pairKey = `${leftIdx}_${rightIdx}`;
            if (completedPairs.includes(pairKey)) continue;

            const lCh = leftBook.chapters[leftIdx];
            const rCh = rightBook.chapters[rightIdx];
            const fusionRes = scheduler._results[`fusion_${pIdx}`];
            const leftRes = scheduler._results[`analyze_left_${pIdx}`];
            const rightRes = scheduler._results[`analyze_right_${pIdx}`];

            this.left.chapterIdx = leftIdx;
            this.right.chapterIdx = rightIdx;
            this.left.analysis = leftRes?.result || '';
            this.right.analysis = rightRes?.result || '';
            this._pipelineResults = {
                left: this.left.analysis,
                right: this.right.analysis,
                compare: fusionRes?.compare || '',
                fusion: fusionRes?.fusion || '',
                world: '', outline: '', write: ''
            };

            this._plLog(`[${pIdx+1}/${pairs.length}] 🔵 左 '${lCh.title}' vs 右 '${rCh.title}'`, 'info');
            const titleEl = document.getElementById('pl-current-title');
            if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1 text-amber-400"></i>[${pIdx + 1}/${pairs.length}] ${lCh.title} vs ${rCh.title}`;
            const stepLabel = document.getElementById('pl-step-label');
            if (stepLabel) stepLabel.textContent = `${pIdx + 1}/${pairs.length} 处理中`;

            let knowledgeCtx = '';
            try {
                const allEntities = await DB.getAll('entities') || [];
                const entities = allEntities.filter(e => !e.id.startsWith('world_'));
                const worlds = allEntities.filter(e => e.id.startsWith('world_') && e.desc);
                if (entities.length) {
                    const grouped = {};
                    entities.forEach(e => { const t = e.type || '其他'; if (!grouped[t]) grouped[t] = []; grouped[t].push(e); });
                    knowledgeCtx += '【知识图谱 - 已有实体】\n';
                    for (const [type, ents] of Object.entries(grouped)) {
                        knowledgeCtx += `[${type}] ` + ents.map(e => {
                            let s = e.name;
                            if (e.desc) s += ': ' + e.desc.slice(0, 80);
                            if (e.relations && e.relations.length) s += ' (' + e.relations.slice(0, 5).join(', ') + ')';
                            return s;
                        }).join(' | ') + '\n';
                    }
                }
                if (worlds.length) {
                    knowledgeCtx += '\n【知识图谱 - 世界观设定】\n';
                    worlds.forEach(w => { knowledgeCtx += `[${w.name}] ${(w.desc || '').slice(0, 200)}\n`; });
                }
            } catch(e) {}

            this._accContext = {
                outlines: accOutlines,
                entities: accEntities,
                knowledgeGraph: knowledgeCtx,
                chapterNum: pIdx + 1
            };

            const stepNums = ['①','②','③'];
            const steps = [];
            if (cfg.doOutline) steps.push({ key: 'outline', label: '细纲生成', fn: () => this._pipelineSaveOutline() });
            if (cfg.doExtract) steps.push({ key: 'world', label: '实体提取', fn: () => this._pipelineExtractEntities() });
            if (cfg.doWrite) steps.push({ key: 'write', label: '正文创作', fn: () => this._pipelineWrite() });

            for (let s = 0; s < steps.length; s++) {
                if (this._pipelinePaused || !this._pipelineRunning) break;
                const step = steps[s];
                this._plSetStep(step.key, 'active', step.label + '...');
                try {
                    await step.fn();
                    if (this._pipelinePaused || !this._pipelineRunning) break;
                    const len = (this._pipelineResults[step.key] || '').length;
                    this._plSetStep(step.key, 'done', len > 0 ? len + '字' : '✓');
                    this._plLog(`[${pIdx+1}/${pairs.length}] 🟢 ${stepNums[s]} ${step.label}完成` + (len > 0 ? ` (${len}字)` : ''), 'ok');

                    if (step.key === 'world') {
                        try {
                            const freshEntities = await DB.getAll('entities') || [];
                            let freshCtx = '';
                            const ents = freshEntities.filter(e => !e.id.startsWith('world_'));
                            const wlds = freshEntities.filter(e => e.id.startsWith('world_') && e.desc);
                            if (ents.length) {
                                const grouped = {};
                                ents.forEach(e => { const t = e.type||'其他'; if(!grouped[t]) grouped[t]=[]; grouped[t].push(e); });
                                freshCtx += '【知识图谱 - 已有实体】\n';
                                for (const [type, es] of Object.entries(grouped)) {
                                    freshCtx += `[${type}] ` + es.map(e => {
                                        let s = e.name;
                                        if(e.desc) s += ': ' + e.desc.slice(0,80);
                                        if(e.relations && e.relations.length) s += ' (' + e.relations.slice(0,5).join(', ') + ')';
                                        return s;
                                    }).join(' | ') + '\n';
                                }
                            }
                            if (wlds.length) {
                                freshCtx += '\n【知识图谱 - 世界观设定】\n';
                                wlds.forEach(w => { freshCtx += `[${w.name}] ${(w.desc||'').slice(0,200)}\n`; });
                            }
                            this._accContext.knowledgeGraph = freshCtx;
                        } catch(e) {}
                    }
                } catch(e) {
                    if (e.message === '已中止') break;
                    this._plSetStep(step.key, 'error', '失败');
                    this._plLog(`[${pIdx+1}/${pairs.length}] 🔴 ${stepNums[s]} ${step.label}: ${e.message}`, 'err');
                }
            }

            if (this._pipelinePaused) break;

            if (this._pipelineResults.outline) {
                accOutlines += `\n\n### 第${leftIdx+1}章细纲\n${this._pipelineResults.outline.slice(0, 2000)}`;
            }
            if (this._pipelineResults.world) {
                accEntities += `\n\n### 第${leftIdx+1}章实体\n${this._pipelineResults.world.slice(0, 1500)}`;
            }

            const now = Date.now();
            if (!this._chapterTimestamps) this._chapterTimestamps = {};
            this._chapterTimestamps[`${leftBook.id}_left_${leftIdx}`] = now;
            this._chapterTimestamps[`${rightBook.id}_right_${rightIdx}`] = now;
            await DB.put('settings', { id: 'pipeline_chapter_timestamps', data: this._chapterTimestamps });
            this._renderChapterList('left');
            this._renderChapterList('right');

            completedPairs.push(pairKey);

            if (cfg.doRAG) {
                const analysisText = (this._pipelineResults.left || '') + '\n' + (this._pipelineResults.right || '') + '\n' + (this._pipelineResults.compare || '') + '\n' + (this._pipelineResults.fusion || '');
                if (analysisText.trim() && typeof RAGSystem !== 'undefined') {
                    await RAGSystem.addDocument(`拆解汇总_${lCh.title}_vs_${rCh.title}`, analysisText.slice(0, 8000), 'pipeline');
                    this._plLog(`[${pIdx+1}/${pairs.length}] 📦 拆解汇总已存入RAG`, 'entity');
                }
            }

            if (cfg.doOutline && this._pipelineResults.outline) {
                allOutlines += `## 第${leftIdx + 1}章\n\n${this._pipelineResults.outline}\n\n---\n\n`;
            }
            if (cfg.doWrite && this._pipelineResults.write) {
                allWritings += `## 第${leftIdx + 1}章\n\n${this._pipelineResults.write}\n\n---\n\n`;
            }

            if (this._plConfig._folderHandle || (LocalSync.isElectron() && LocalSync.electronPath)) {
                const timeStr = new Date().toLocaleString('zh-CN', {month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).replace(/\//g,'-');
                if (this._pipelineResults.left) await this._saveToLocal(`第${leftIdx+1}章_左书拆解_${timeStr}.md`, this._pipelineResults.left);
                if (this._pipelineResults.right) await this._saveToLocal(`第${rightIdx+1}章_右书拆解_${timeStr}.md`, this._pipelineResults.right);
                if (this._pipelineResults.compare) await this._saveToLocal(`第${leftIdx+1}章_对比分析_${timeStr}.md`, this._pipelineResults.compare);
                if (this._pipelineResults.fusion) await this._saveToLocal(`第${leftIdx+1}章_融合精华_${timeStr}.md`, this._pipelineResults.fusion);
                if (this._pipelineResults.outline) await this._saveToLocal(`第${leftIdx+1}章_细纲_${timeStr}.md`, this._pipelineResults.outline);
                if (this._pipelineResults.write) await this._saveToLocal(`第${leftIdx+1}章_正文_${timeStr}.md`, this._pipelineResults.write);
                this._plLog(`[${pIdx+1}/${pairs.length}] 💾 已保存到本地 (${timeStr})`, 'entity');
            }

            await DB.put('settings', {
                id: 'pipeline_state',
                completedPairs, accOutlines, accEntities, allOutlines, allWritings,
                allPipelineResults: this._allPipelineResults,
                config: { leftBookId: this.left.bookId, rightBookId: this.right.bookId, ...cfg },
                pausedAt: Date.now()
            });
        }

        if (!this._pipelinePaused) {
            this._pipelineRunning = false;
            const pauseBtn = document.getElementById('pl-pause-btn');
            const stopBtn = document.getElementById('pl-stop-btn');
            if (pauseBtn) pauseBtn.style.display = 'none';
            if (stopBtn) stopBtn.style.display = 'none';

            await DB.del('settings', 'pipeline_state');
            this._savedPipelineState = null;

            if (cfg.cycleMode && pairs.length > 0) {
                const remaining = pairs.length % cfg.cycleSize;
                if (remaining > 0) {
                    this._plLog(`\n🔄 完成最后${remaining}章的循环深度融合...`, 'info');
                    await this._cycleFusionSummary(pairs.slice(-remaining), remaining, leftBook, rightBook);
                } else if (pairs.length >= cfg.cycleSize) {
                    this._plLog(`\n🔄 完成最后${cfg.cycleSize}章的循环深度融合...`, 'info');
                    await this._cycleFusionSummary(pairs.slice(-cfg.cycleSize), cfg.cycleSize, leftBook, rightBook);
                }
            }

            this._pipelineResults = { ...this._allPipelineResults };
            this._plConfig.lastSync = Date.now();
            const titleEl = document.getElementById('pl-current-title');
            if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-check-circle mr-1 text-green-400"></i>流水线全部完成';
            const stepLabel = document.getElementById('pl-step-label');
            if (stepLabel) stepLabel.textContent = '全部完成';
            const miniStatus = document.getElementById('pl-mini-status');
            if (miniStatus) miniStatus.textContent = '一键自动拆书链';
            this._plLog(`\n🎉 流水线完成！共处理 ${pairs.length} 对章节`, 'ok');
            if (cfg.doOutline) this._plLog('📋 细纲已同步到: 凤凰创作流 + 长篇执笔(旗舰)', 'ok');
            if (cfg.doWrite) this._plLog('✍️ 正文已同步到: 长篇执笔(旗舰)', 'ok');
            if (cfg.doExtract) this._plLog('🌍 实体已同步到: 世界引擎 + 知识图谱', 'ok');
            if (cfg.doRAG) this._plLog('🔍 全部结果已存入RAG向量数据库', 'ok');
            if (this._plConfig._folderHandle || (LocalSync.isElectron() && LocalSync.electronPath)) this._plLog('💾 全部结果已保存到本地文件夹', 'ok');
            UI.toast(`流水线完成: ${pairs.length}对章节`);
        } else {
            await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
        }
    },

    plPreview(key) {
        const labels = { left: '左书分析', right: '右书分析', compare: '对比分析', fusion: '融合精华', outline: '细纲', world: '实体提取', write: '正文' };
        const content = this._pipelineResults[key];
        if (!content) return UI.toast(labels[key] + '暂无数据');
        const outEl = document.getElementById('pl-output');
        if (outEl) outEl.textContent = content;
        const titleEl = document.getElementById('pl-current-title');
        if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-eye mr-1 text-cyan-400"></i>预览: ${labels[key]} (${content.length}字)`;
        const charsEl = document.getElementById('pl-current-chars');
        if (charsEl) charsEl.textContent = content.length + '字';
    },

    _plSetStep(key, state, info) {
        const dot = document.getElementById('pl-d-' + key);
        const row = document.getElementById('pl-s-' + key);
        const infoEl = document.getElementById('pl-i-' + key);
        if (dot) {
            dot.className = 'w-1.5 h-1.5 rounded-full shrink-0 ' + (
                state === 'active' ? 'bg-amber-400 animate-pulse' :
                state === 'done' ? 'bg-green-400' :
                state === 'error' ? 'bg-red-400' : 'bg-white/20'
            );
        }
        if (row) {
            row.className = 'flex items-center gap-1.5 px-2.5 py-2 rounded-lg border cursor-pointer transition-all ' + (
                row.classList.contains('col-span-2') ? 'col-span-2 ' : ''
            ) + (
                state === 'active' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                state === 'done' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                state === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/[0.02] border-white/5 hover:bg-white/5'
            );
        }
        if (infoEl) infoEl.textContent = info || '';
        // 同步字数到输出头
        if (state === 'done' || state === 'active') {
            const charsEl = document.getElementById('pl-current-chars');
            if (charsEl && info) charsEl.textContent = info;
        }
    },

    _plLog(msg, type) {
        const log = document.getElementById('pl-log');
        if (!log) return;
        const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const color = type === 'ok' ? 'text-green-400' : type === 'err' ? 'text-red-400' : type === 'entity' ? 'text-cyan-400' : 'text-blue-400';
        log.innerHTML += `<div class="flex gap-2"><span class="text-white/30 shrink-0">${time}</span><span class="${color}">${msg}</span></div>`;
        log.scrollTop = log.scrollHeight;
    },

    // ---- 世界引擎一致性桥 ----

    /**
     * 从世界引擎构建全局一致性上下文
     * 包含：世界观维度、已出场角色、地点、势力、力量体系、伏笔追踪、情绪弧线
     */
    async _buildConsistencyContext() {
        const allEntities = await DB.getAll('entities') || [];
        const pipelineEntities = allEntities.filter(e => e.source === 'pipeline' || e.source === 'world');

        // 分类整理实体
        const characters = pipelineEntities.filter(e => e.type === '人物').map(e => ({
            name: e.name, desc: (e.desc || '').slice(0, 150), relations: e.relations || []
        }));
        const locations = pipelineEntities.filter(e => e.type === '地点').map(e => ({
            name: e.name, desc: (e.desc || '').slice(0, 100)
        }));
        const factions = pipelineEntities.filter(e => e.type === '势力').map(e => ({
            name: e.name, desc: (e.desc || '').slice(0, 100)
        }));
        const magic = pipelineEntities.filter(e => ['魔法','规则','功法'].includes(e.type)).map(e => ({
            name: e.name, type: e.type, desc: (e.desc || '').slice(0, 100)
        }));
        const items = pipelineEntities.filter(e => e.type === '物品').map(e => ({
            name: e.name, desc: (e.desc || '').slice(0, 80)
        }));
        const plots = pipelineEntities.filter(e => e.type === '情节').map(e => ({
            name: e.name, desc: (e.desc || '').slice(0, 100)
        }));

        // 获取世界观维度
        const worldCats = {
            history: '历史与传说', geography: '地理与地貌', magic: '魔法/科技体系',
            factions: '势力与组织', species: '种族与生物', rules: '世界规则', culture: '文化与习俗'
        };
        let worldDimText = '';
        for (const [key, label] of Object.entries(worldCats)) {
            const ent = await DB.get('entities', 'world_' + key);
            if (ent && ent.desc) worldDimText += `[${label}] ${ent.desc.slice(0, 300)}\n`;
        }

        // 从所有已处理细纲中提取伏笔和情绪
        const allOutlines = this._allPipelineResults.outline || '';
        const foreshadowing = this._extractForeshadowing(allOutlines);
        const emotionCurve = this._extractEmotionCurve(allOutlines);

        let ctx = '';
        if (worldDimText) {
            ctx += `=== 【世界观维度——绝对不可更改】 ===\n${worldDimText}\n`;
        }
        if (characters.length) {
            ctx += `=== 【已出场角色——性格/能力/关系不可擅自改变】 ===\n`;
            characters.slice(0, 25).forEach(c => {
                ctx += `- ${c.name}: ${c.desc}${c.relations.length ? ' | 关系: ' + c.relations.slice(0, 3).join(', ') : ''}\n`;
            });
            ctx += '\n';
        }
        if (locations.length) {
            ctx += `=== 【已建立地点——地理关系不可矛盾】 ===\n`;
            locations.slice(0, 15).forEach(l => ctx += `- ${l.name}: ${l.desc}\n`);
            ctx += '\n';
        }
        if (factions.length) {
            ctx += `=== 【势力格局——关系不可擅自改变】 ===\n`;
            factions.slice(0, 10).forEach(f => ctx += `- ${f.name}: ${f.desc}\n`);
            ctx += '\n';
        }
        if (magic.length) {
            ctx += `=== 【力量体系/规则——设定不可矛盾】 ===\n`;
            magic.slice(0, 10).forEach(m => ctx += `- ${m.name}(${m.type}): ${m.desc}\n`);
            ctx += '\n';
        }
        if (items.length) {
            ctx += `=== 【关键物品——归属/功能不可矛盾】 ===\n`;
            items.slice(0, 10).forEach(i => ctx += `- ${i.name}: ${i.desc}\n`);
            ctx += '\n';
        }
        if (plots.length) {
            ctx += `=== 【已发生情节——时间线不可逆】 ===\n`;
            plots.slice(0, 10).forEach(p => ctx += `- ${p.name}: ${p.desc}\n`);
            ctx += '\n';
        }
        if (foreshadowing.pending.length) {
            ctx += `=== 【待回收伏笔——必须按计划回收】 ===\n`;
            foreshadowing.pending.slice(0, 15).forEach(f => ctx += `- [待回收] ${f}\n`);
            ctx += '\n';
        }
        if (foreshadowing.resolved.length) {
            ctx += `=== 【已回收伏笔——不可重复回收】 ===\n`;
            foreshadowing.resolved.slice(0, 10).forEach(f => ctx += `- [已回收] ${f}\n`);
            ctx += '\n';
        }
        if (emotionCurve.length) {
            ctx += `=== 【情绪弧线——不可突兀跳变】 ===\n`;
            const recent = emotionCurve.slice(-10);
            ctx += `最近${recent.length}章情绪走势: ${recent.map(e => `${e.chapter}(${e.score})`).join(' → ')}\n`;
            ctx += `当前情绪位置: ${recent[recent.length - 1]?.score || 'N/A'}/10\n\n`;
        }

        ctx += `=== 【一致性铁律——违反即重写】 ===\n`;
        ctx += `1. 世界观维度（历史/地理/魔法/势力/种族/规则/文化）绝对不可更改\n`;
        ctx += `2. 已出场角色的性格、能力、身份、关系网络不可擅自改变\n`;
        ctx += `3. 已建立地点的名称、地理关系、功能不可矛盾\n`;
        ctx += `4. 势力格局（阵营关系、权力结构）不可擅自改变\n`;
        ctx += `5. 力量体系/规则的运作逻辑不可矛盾\n`;
        ctx += `6. 待回收伏笔必须在合适章节回收，已回收伏笔不可重复\n`;
        ctx += `7. 情绪曲线必须符合整体走势，禁止突兀跳变（相邻章情绪差≤3分）\n`;
        ctx += `8. 新出场角色/地点/物品不可与已有实体重名（除非是同一人/地/物）\n`;
        ctx += `9. 关键物品的功能、归属权改变必须有合理铺垫\n`;
        ctx += `10. 已发生情节的时间线不可逆，后续剧情必须在此基础上发展\n`;

        return ctx.slice(0, 8000);
    },

    /**
     * 从所有已处理细纲中提取伏笔状态
     */
    _extractForeshadowing(allOutlines) {
        const pending = [];
        const resolved = [];
        if (!allOutlines) return { pending, resolved };

        const lines = allOutlines.split('\n');
        for (const line of lines) {
            // 提取待回收伏笔（多种表述）
            const p1 = line.match(/(?:待回收|未回收|未揭晓|待揭晓|新埋设|新伏笔|悬念待解|留待后续).*?[：:]\s*(.+)/i);
            const p2 = line.match(/(?:伏笔|悬念|线索|暗示).*?(?:待回收|未回收|待揭晓|后续揭晓).*?[：:]\s*(.+)/i);
            const p3 = line.match(/(?:埋设|铺设|埋下|留).*?(?:伏笔|悬念|钩子).*?[：:]\s*(.+)/i);
            const match = p1 || p2 || p3;
            if (match && match[1].trim().length > 3) {
                const text = match[1].trim().slice(0, 100);
                if (!pending.includes(text) && !resolved.includes(text)) pending.push(text);
            }

            // 提取已回收伏笔
            const r1 = line.match(/(?:已回收|已揭晓|已呼应|已揭晓|回收|揭晓|呼应).*?[：:]\s*(.+)/i);
            const r2 = line.match(/(?:伏笔|悬念|线索).*?(?:已回收|已揭晓|已呼应).*?[：:]\s*(.+)/i);
            const rMatch = r1 || r2;
            if (rMatch && rMatch[1].trim().length > 3) {
                const text = rMatch[1].trim().slice(0, 100);
                const idx = pending.indexOf(text);
                if (idx !== -1) pending.splice(idx, 1);
                if (!resolved.includes(text)) resolved.push(text);
            }
        }
        return { pending, resolved };
    },

    /**
     * 从所有已处理细纲中提取情绪曲线
     */
    _extractEmotionCurve(allOutlines) {
        const curve = [];
        if (!allOutlines) return curve;

        // 按章节分块（匹配 "### 第X章" 或 "## 第X章" 或数字章节）
        const blocks = allOutlines.split(/(?:###|##)\s*第[一二三四五六七八九十\d]+章|第[一二三四五六七八九十\d]+章[：:]/);
        let chapterNum = 0;

        for (const block of blocks) {
            chapterNum++;
            const scoreM = block.match(/emotion_score[：:]?\s*(\d+)/i) ||
                          block.match(/情绪分[值数]?[：:]?\s*(\d+)/i) ||
                          block.match(/情绪.*?[:：]\s*(\d+)\s*\/\s*10/i) ||
                          block.match(/EMO[：:]?\s*(\d+)/i);
            const score = scoreM ? Math.min(10, Math.max(1, parseInt(scoreM[1]))) : null;

            const hookM = block.match(/hook_type[：:]?\s*(.+)/i) ||
                         block.match(/钩子[类型]?[：:]?\s*(.+)/i) ||
                         block.match(/钩子.*?[:：]\s*(.+)/i);
            const hook = hookM ? hookM[1].trim().slice(0, 30) : '';

            const tensionM = block.match(/tension_level[：:]?\s*(\d+)/i) ||
                            block.match(/张力[等级]?[：:]?\s*(\d+)/i) ||
                            block.match(/张力.*?[:：]\s*(\d+)/i);
            const tension = tensionM ? Math.min(10, Math.max(1, parseInt(tensionM[1]))) : null;

            if (score !== null || tension !== null) {
                curve.push({ chapter: chapterNum, score: score || 5, hook, tension: tension || 5 });
            }
        }
        return curve;
    },

    // ---- 流水线子步骤 ----
    async _pipelineExtractEntities() {
        const fusion = this._pipelineResults.fusion || '';
        const outline = this._pipelineResults.outline || '';
        const sourceText = (fusion + '\n' + outline).slice(0, 8000);
        if (!sourceText.trim()) return;

        // 获取已有实体名称，让AI建立关联
        const existingEntities = await DB.getAll('entities') || [];
        const existingNames = existingEntities.filter(e => !e.id.startsWith('world_')).map(e => e.name);
        const existingHint = existingNames.length ? `\n\n【已有实体(请在relations中引用这些名称建立关联)】\n${existingNames.slice(0,50).join('、')}` : '';

        const outEl = document.getElementById('pl-output');
        if (outEl) outEl.textContent = '正在提取融合细纲中的实体...';
        this._setGenerating(true);

        let raw = '';
        try {
            await AI.generate(
                `你是深度实体提取引擎。\n【核心任务】从以下融合细纲中提取所有原创实体和世界观元素。\n\n【数据来源说明】\n以下内容是一份基于两书技法融合而成的全新网文细纲。\n细纲中的角色、物品、地点、势力等全部是原创的，不是原书中的任何内容。\n你的任务是从这份原创细纲中提取构建世界引擎所需的实体。\n\n${sourceText}\n${existingHint}

【提取铁律】\n1. 提取的是融合细纲中的原创实体，不是原书内容\n2. 尽可能完整地提取角色关系、势力结构、魔法体系等\n3. 如果某个实体在细纲中只是提及但无详细描述，根据上下文合理补全\n4. 不要遗漏任何实体，关系网络要尽可能完整\n\n【提取类型】\n- 人物：所有角色（主角、配角、反派），含性格、身份\n- 物品：道具、武器、法宝、关键物件\n- 地点：地名、场景、建筑、地标\n- 情节：关键事件、转折点、冲突\n- 伏笔：暗示、线索、未解之谜\n- 势力：门派、组织、国家、阵营、家族\n- 种族：种族设定、族群特征\n- 魔法：功法、技能、法术、科技体系、修炼等级\n- 规则：世界法则、力量体系、禁忌\n- 文化：风俗、社会制度、信仰\n- 历史：历史事件、传说、纪元\n- 技法：可复用的写作套路、节奏模型、爽点公式\n\n【输出格式】JSON数组：\n[{"name":"名称","type":"人物/物品/地点/情节/伏笔/势力/种族/魔法/规则/文化/历史/技法","description":"详细描述50-200字","relations":["关系类型:关联实体名"]}]\n\n【关键要求 - 关系网络】\n- 每个实体的relations必须尽可能多地引用其他实体名称\n- 关系格式："关系类型:实体名"，例如 "师父:张三","敌对:魔教","位于:青云山","拥有:轩辕剑"\n- 人物之间要有师徒/敌友/从属关系\n- 人物与地点要有"位于"/"出没"关系\n- 人物与物品要有"拥有"/"使用"关系\n- 人物与势力要有"所属"/"统治"关系\n- 情节与人物要有"参与"关系\n- 这些关系是构建知识网络图的关键，不要遗漏！\n- 尽可能多提取，不要遗漏。\n- 直接输出纯JSON数组，禁止使用markdown代码块(\`\`\`json)包裹，禁止输出任何非JSON文本。`,
                {}, c => {
                    raw += c;
                    if (outEl) outEl.textContent = raw;
                }
            );
        } catch(e) {
            if (e.message === '已中止') { this._setGenerating(false); throw e; }
            this._plLog('实体提取AI调用失败: ' + e.message, 'err');
            this._setGenerating(false);
            return;
        }
        this._setGenerating(false);

        // ═══ 解析JSON（6层容错，健壮解析） ═══
        let entities = [];
        // 预处理: 先去掉markdown代码块包裹
        let cleanRaw = raw.trim();
        cleanRaw = cleanRaw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();

        // 尝试1: 直接解析
        try { entities = JSON.parse(cleanRaw); } catch(e1) {
            // 尝试2: 提取最外层 [...] 
            try {
                const start = cleanRaw.indexOf('[');
                const end = cleanRaw.lastIndexOf(']');
                if (start !== -1 && end > start) {
                    entities = JSON.parse(cleanRaw.slice(start, end + 1));
                }
            } catch(e2) {
                // 尝试3: 修复常见JSON问题（尾部逗号、单引号、中文引号、零宽字符）
                // 注意: 不做 \n→\\n 替换，那会破坏字符串内已有的合法换行
                try {
                    let fixed = cleanRaw;
                    const s = fixed.indexOf('[');
                    const e = fixed.lastIndexOf(']');
                    if (s !== -1 && e > s) fixed = fixed.slice(s, e + 1);
                    fixed = fixed.replace(/,\s*([}\]])/g, '$1');  // 尾部逗号
                    fixed = fixed.replace(/'/g, '"');              // 单引号→双引号
                    fixed = fixed.replace(/[""]/g, '"');           // 中文引号→英文引号
                    fixed = fixed.replace(/[\u200B-\u200D\uFEFF]/g, ''); // 零宽字符
                    // 安全处理换行: 只替换JSON字符串值内部的裸换行
                    fixed = fixed.replace(/"([^"]*)\n([^"]*)"/g, (m) => m.replace(/\n/g, '\\n'));
                    entities = JSON.parse(fixed);
                } catch(e3) {
                    // 尝试4: 逐行拼接修复 — 逐个JSON对象提取（支持含数组的对象）
                    try {
                        // 匹配 { ... } 对象，允许内部有 [...] 数组
                        const objMatches = cleanRaw.match(/\{(?:[^{}]|\{[^{}]*\})*"name"\s*:\s*"[^"]+?"(?:[^{}]|\[[^\]]*\]|\{[^{}]*\})*\}/g);
                        if (objMatches && objMatches.length) {
                            entities = [];
                            for (const objStr of objMatches) {
                                try {
                                    let fixedObj = objStr
                                        .replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']')
                                        .replace(/'/g, '"').replace(/[""]/g, '"');
                                    // 安全处理字符串内换行
                                    fixedObj = fixedObj.replace(/"([^"]*)\n([^"]*)"/g, (m) => m.replace(/\n/g, '\\n'));
                                    entities.push(JSON.parse(fixedObj));
                                } catch(e) {
                                    // 正则提取核心字段
                                    const nameM = objStr.match(/"name"\s*:\s*"([^"]+?)"/);
                                    const typeM = objStr.match(/"type"\s*:\s*"([^"]+?)"/);
                                    const descM = objStr.match(/"desc(?:ription)?"\s*:\s*"([\s\S]*?)"/);
                                    // 提取relations数组
                                    const relM = objStr.match(/"relations"\s*:\s*\[([\s\S]*?)\]/);
                                    let relations = [];
                                    if (relM) {
                                        relations = relM[1].match(/"([^"]+?)"/g);
                                        if (relations) relations = relations.map(r => r.replace(/"/g, ''));
                                        else relations = [];
                                    }
                                    if (nameM) {
                                        entities.push({
                                            name: nameM[1],
                                            type: typeM ? typeM[1] : '其他',
                                            description: descM ? descM[1] : '',
                                            relations: relations
                                        });
                                    }
                                }
                            }
                            if (entities.length) this._plLog(`JSON修复: 正则提取到 ${entities.length} 个实体`, 'info');
                        }
                    } catch(e4) {}
                    
                    // 尝试5: 最后手段 — 逐行扫描name/type/desc
                    if (!entities.length) {
                        try {
                            const lines = cleanRaw.split('\n');
                            let current = null;
                            for (const line of lines) {
                                const nm = line.match(/"name"\s*:\s*"([^"]+)"/);
                                if (nm) {
                                    if (current && current.name) entities.push(current);
                                    current = { name: nm[1], type: '其他', description: '', relations: [] };
                                }
                                if (current) {
                                    const tm = line.match(/"type"\s*:\s*"([^"]+)"/);
                                    if (tm) current.type = tm[1];
                                    const dm = line.match(/"desc(?:ription)?"\s*:\s*"([^"]+)"/);
                                    if (dm) current.description = dm[1];
                                }
                            }
                            if (current && current.name) entities.push(current);
                            if (entities.length) this._plLog(`JSON修复: 逐行扫描提取到 ${entities.length} 个实体`, 'info');
                        } catch(e5) {}
                    }

                    if (!entities.length) {
                        this._plLog('实体JSON解析失败，原始文本已保存', 'err');
                    }
                }
            }
        }

        if (!Array.isArray(entities)) entities = [entities];

        const now = Date.now();

        // ★ 实体去重合并：与已有实体对比，避免重复创建
        const allExisting = await DB.getAll('entities') || [];
        const mergedEntities = [];
        let mergeCount = 0;
        for (const ent of entities) {
            if (!ent || !ent.name) continue;
            const entType = ent.type || '其他';
            // 查找同名同类型的已有实体（排除世界观维度实体）
            const existing = allExisting.find(e =>
                e.name === ent.name && e.type === entType && !e.id.startsWith('world_')
            );
            if (existing) {
                // 合并描述：取更详细的一个，或拼接
                const newDesc = ent.description || ent.desc || '';
                const oldDesc = existing.desc || '';
                if (newDesc && newDesc.length > oldDesc.length * 0.3) {
                    existing.desc = newDesc.length > oldDesc.length ? newDesc : (oldDesc + '\n【补充】' + newDesc);
                    // 合并关系
                    const newRels = (ent.relations || []).filter(r => typeof r === 'string' && !existing.relations.includes(r));
                    if (newRels.length) {
                        existing.relations = [...existing.relations, ...newRels];
                    }
                    existing.updatedAt = now;
                    await DB.put('entities', existing);
                    // 同步更新向量
                    const vectorContent = `[${existing.type}] ${existing.name}: ${existing.desc}`;
                    await DB.put('vectors', { id: existing.id, content: vectorContent, vector: Array.from({length:1536}, ()=>Math.random()), timestamp: now });
                    mergeCount++;
                    this._plLog(`  🔄 实体合并更新: ${ent.name} (${newRels.length ? '+' + newRels.length + '关系' : '描述更新'})`, 'entity');
                }
            } else {
                mergedEntities.push(ent);
            }
        }
        entities = mergedEntities;
        if (mergeCount > 0) {
            this._plLog(`实体去重: ${mergeCount} 个已有实体已合并更新`, 'info');
        }

        // 存入世界引擎 + 向量库
        let count = 0;
        // ★ 计算当前循环ID（如果启用循环模式）
        let currentCycleId = null;
        const chNum = (this._accContext || {}).chapterNum;
        if(this._plConfig.cycleMode && chNum && typeof Modules !== 'undefined' && Modules.world_engine) {
            const cycleInfo = Modules.world_engine.getCycleIdForChapter(chNum, this._plConfig.cycleSize);
            if(cycleInfo) currentCycleId = cycleInfo.cycleId;
        }
        for (const ent of entities) {
            if (!ent || !ent.name) continue;
            const typeMap = { technique:'技法', character_template:'人物', conflict_model:'情节', rhythm:'技法', hook:'技法' };
            const type = typeMap[ent.type] || ent.type || '技法';
            // ★ 确保relations是字符串数组
            let relations = ent.relations || [];
            if(!Array.isArray(relations)) relations = [];
            relations = relations.map(r => typeof r === 'string' ? r : String(r)).filter(Boolean);

            const id = Utils.uuid();
            const entityPayload = {
                id, name: ent.name, type: type,
                desc: ent.description || ent.desc || '',
                relations: relations,
                tags: ent.tags || ['融合', '流水线', '原创实体'],
                source: 'pipeline',
                sourceBook: '融合细纲原创',
                updatedAt: now
            };
            if(currentCycleId) entityPayload.cycles = [currentCycleId];
            await DB.put('entities', entityPayload);
            const vectorContent = `[${type}] ${ent.name}: ${ent.description || ent.desc || ''}`;
            await DB.put('vectors', { id, content: vectorContent, vector: Array.from({length:1536}, ()=>Math.random()), timestamp: now });
            count++;
            this._plLog(`  → ${type}: ${ent.name}${relations.length ? ' (关联'+relations.length+'个)' : ''}${currentCycleId ? ' [循环]' : ''}`, 'entity');
        }

        this._pipelineResults.world = raw.slice(0, 4000);
        this._allPipelineResults.world = (this._allPipelineResults.world || '') + `\n[第${(this._accContext||{}).chapterNum||'?'}章] ${count}个实体已提取\n`;
        this._plLog(`世界引擎: 共提取 ${count} 个实体`, 'ok');

        // ★ 刷新世界引擎缓存，确保图谱能看到新数据
        if(Modules.world_engine) Modules.world_engine._cachedEntities = null;

        // ★ 自动提取世界观维度 (从实体中归纳到世界观构建的各个维度)
        if (count > 0) {
            try {
                await this._pipelineExtractWorldView(entities, sourceText);
            } catch(e) { this._plLog('世界观自动提取失败: ' + e.message, 'err'); }
        }

        if (fusion) {
            await DB.put('assets', {
                id: 'fusion_tech_' + Date.now(),
                name: '融合写作技法', type: 'technique',
                content: fusion, tags: ['融合', '技法', '自动生成'], createdAt: now
            });
        }
    },

    // ★ 自动从提取的实体中归纳世界观维度
    async _pipelineExtractWorldView(entities, sourceText) {
        const catMap = {
            history: '历史与传说', geography: '地理与地貌', magic: '魔法/科技体系',
            factions: '势力与组织', species: '种族与生物', rules: '世界规则', culture: '文化与习俗'
        };

        // 从已提取的实体中按类型归纳世界观
        const worldData = {};
        for (const ent of entities) {
            if (!ent || !ent.name) continue;
            const type = (ent.type || '').toLowerCase();
            const desc = ent.description || ent.desc || '';
            if (!desc) continue;

            // 映射实体类型到世界观维度
            if (type === '历史' || type === 'history') {
                worldData.history = (worldData.history || '') + `\n- ${ent.name}: ${desc}`;
            } else if (type === '地点' || type === 'geography' || type === 'location') {
                worldData.geography = (worldData.geography || '') + `\n- ${ent.name}: ${desc}`;
            } else if (type === '魔法' || type === 'magic' || type === '功法') {
                worldData.magic = (worldData.magic || '') + `\n- ${ent.name}: ${desc}`;
            } else if (type === '势力' || type === 'factions' || type === '组织') {
                worldData.factions = (worldData.factions || '') + `\n- ${ent.name}: ${desc}`;
            } else if (type === '种族' || type === 'species') {
                worldData.species = (worldData.species || '') + `\n- ${ent.name}: ${desc}`;
            } else if (type === '规则' || type === 'rules') {
                worldData.rules = (worldData.rules || '') + `\n- ${ent.name}: ${desc}`;
            } else if (type === '文化' || type === 'culture') {
                worldData.culture = (worldData.culture || '') + `\n- ${ent.name}: ${desc}`;
            }
        }

        // 写入世界观维度 (追加模式，不覆盖已有内容)
        let worldCount = 0;
        for (const [cat, label] of Object.entries(catMap)) {
            if (!worldData[cat]) continue;
            const id = 'world_' + cat;
            const existing = await DB.get('entities', id);
            const oldDesc = (existing && existing.desc) ? existing.desc : '';
            const newContent = worldData[cat].trim();
            // 追加新内容（去重）
            const merged = oldDesc ? oldDesc + '\n' + newContent : newContent;
            await DB.put('entities', {
                id, name: label, type: 'world',
                desc: merged.slice(0, 5000),
                source: 'pipeline', updatedAt: Date.now()
            });
            worldCount++;
            this._plLog(`  🌍 世界观: ${label} 已更新`, 'entity');
        }

        if (worldCount > 0) {
            if (Modules.world_engine) Modules.world_engine._cachedEntities = null;
            this._plLog(`世界观: ${worldCount} 个维度已自动更新`, 'ok');
        }
    },

    async _pipelineSaveOutline() {
        const fusion = this._pipelineResults.fusion;
        if (!fusion) return;

        // 获取书名（用于日志和自定义prompt变量替换）
        const leftBook = (this._books || []).find(b => b.id === this.left.bookId);
        const rightBook = (this._books || []).find(b => b.id === this.right.bookId);
        const lName = leftBook ? leftBook.name : '左书';
        const rName = rightBook ? rightBook.name : '右书';

        // 获取累积上下文（前章细纲+实体+知识图谱）
        const acc = this._accContext || {};
        const prevOutlines = acc.outlines ? acc.outlines.slice(-3000) : '';
        const prevEntities = acc.entities ? acc.entities.slice(-2000) : '';
        const knowledgeGraph = acc.knowledgeGraph || '';
        const chNum = acc.chapterNum || 1;

        let prompt = await Modules.short.getPrompt('fusion_outline');
        if (!prompt) {
            prompt = `你是一位资深网文编辑。基于以下融合细纲，生成第${chNum}章的详细展开细纲。\n【核心原则】融合细纲中的角色/世界观/情节全部是原创的，不是原书内容。你要做的是把融合细纲中的本章内容展开为更详细的写作指导。\n\n【融合细纲】\n${fusion.slice(0, 4000)}\n\n【对比分析】\n${(this._pipelineResults.compare || '').slice(0, 2000)}
${knowledgeGraph ? `\n${knowledgeGraph.slice(0, 3000)}` : ''}
${prevOutlines ? `\n【前章细纲参考（保持连贯性）】\n${prevOutlines}` : ''}

【核心要求】
- 所有人物性格、身份、关系必须与融合细纲中的设定保持一致
- 伏笔和线索要与前章呼应，新伏笔要标注回收计划
- 世界观设定（魔法体系、势力关系、地理等）遵循融合细纲的原创设定
- 新出现的人物/物品/地点要标注，方便后续提取到知识图谱
- 技法运用标注来源（主书骨架/辅书血肉/融合创新）

请生成本章详细细纲，包含：
1. 章节标题
2. 核心事件（100字内）
3. 场景分段（每段场景的目的和情绪）
4. 运用的融合技法（标注来源）
5. 情绪节奏（起/承/转/合，标注分值）
6. 爽点/钩子设计
7. 对话要点（潜台词、信息差）
8. 一致性校验：是否与融合细纲矛盾？
${prevOutlines ? '9. 与前章的衔接和递进关系' : ''}

格式清晰，可直接用于写作。`;
        } else {
            prompt = prompt
                .replace(/{{primaryBook}}/g, primaryName).replace(/{{secondaryBook}}/g, secondaryName)
                .replace('{{fusion}}', fusion.slice(0, 4000))
                .replace('{{compare}}', (this._pipelineResults.compare || '').slice(0, 2000))
                .replace('{{left_name}}', lName).replace('{{right_name}}', rName);
            if (knowledgeGraph) prompt += `\n\n${knowledgeGraph.slice(0, 3000)}`;
            if (prevOutlines) prompt += `\n\n【前章细纲参考】\n${prevOutlines}`;
        }

        // ★ 注入世界引擎全局一致性上下文
        try {
            const consistencyCtx = await this._buildConsistencyContext();
            if (consistencyCtx) prompt += `\n\n${consistencyCtx}`;
        } catch(e) { console.warn('一致性上下文构建失败:', e); }

        const outEl = document.getElementById('pl-output');
        if (outEl) outEl.textContent = '正在生成细纲...\n';
        this._setGenerating(true);

        let result = '';
        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (outEl) outEl.textContent = result;
                const fbOut = document.getElementById('fb-output');
                if (fbOut) fbOut.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
            });
        } catch(e) {
            if (e.message === '已中止') { this._setGenerating(false); throw e; }
            this._plLog('细纲生成失败: ' + e.message, 'err');
            this._setGenerating(false);
            return;
        }

        this._setGenerating(false);
        this._pipelineResults.outline = result;
        this._allPipelineResults.outline = (this._allPipelineResults.outline || '') + '\n\n---\n\n' + result;

        // 存入DB
        await DB.put('outlines', {
            id: 'fusion_outline_' + Date.now(),
            title: `融合细纲 (${lName} × ${rName})`,
            content: result,
            source: 'pipeline',
            createdAt: Date.now()
        });

        // 同步到凤凰创作流
        if (typeof Modules.phoenix !== 'undefined') {
            Modules.phoenix.data = Modules.phoenix.data || {};
            const chIdx = this.left.chapterIdx;
            Modules.phoenix.data.outlineRaw = (Modules.phoenix.data.outlineRaw || '') + '\n\n---\n\n## 第' + (chIdx + 1) + '章细纲\n\n' + result;
            this._plLog('📋 细纲→凤凰创作流', 'entity');
        }

        // 同步到长篇执笔大纲
        const chIdx = this.left.chapterIdx;
        const leftBook2 = (this._books || []).find(b => b.id === this.left.bookId);
        const lCh = leftBook2 && leftBook2.chapters[chIdx] ? leftBook2.chapters[chIdx] : null;
        const chapTitle = lCh ? lCh.title : '第' + (chIdx + 1) + '章';
        const chapId = Utils.uuid();
        await DB.put('chapters', { id: chapId, title: `第${chIdx + 1}章 ${chapTitle}(融合)`, content: '', outline: result, order: chIdx + 1, volumeId: null, source: 'pipeline' });
        this._plLog('📋 细纲→长篇执笔大纲', 'entity');

        this._plLog(`细纲生成完成 (${result.length}字)`, 'ok');
    },

    async _pipelineWrite() {
        const fusion = this._pipelineResults.fusion || '';
        const outline = this._pipelineResults.outline || '';
        if (!fusion && !outline) return;

        // ★ 获取累积上下文 + 知识图谱
        const acc = this._accContext || {};
        const prevOutlines = acc.outlines ? acc.outlines.slice(-2000) : '';
        const knowledgeGraph = acc.knowledgeGraph || '';

        let prompt = await Modules.short.getPrompt('fusion_write');
        if (!prompt) prompt = this._PROMPTS.write;
        prompt = prompt
            .replace('{{fusion}}', fusion.slice(0, 4000))
            .replace('{{outline}}', outline.slice(0, 3000))
            .replace('{{world}}', (this._pipelineResults.world || '').slice(0, 2000));

        // ★ 注入知识图谱上下文（实体+世界观+关系网络）
        if (knowledgeGraph) prompt += `\n\n${knowledgeGraph.slice(0, 3000)}`;
        if (prevOutlines) prompt += `\n\n【前章细纲（保持情节连贯）】\n${prevOutlines}`;
        prompt += `\n\n【一致性与排版要求】
- 人物性格、世界观设定、伏笔线索必须与知识图谱保持一致，不得矛盾
- 语言风格：大白话、简洁有力、一句一个信息点，拒绝文绉绉和水字数
- 排版：每段不超过3-4行（手机屏幕友好），多用短句，对话单独成段
- 前后章节的人物称呼、能力设定、地名必须完全一致
- 新出现的伏笔要自然埋入，已有伏笔要适时呼应`;

        // ★ 注入世界引擎全局一致性上下文
        try {
            const consistencyCtx = await this._buildConsistencyContext();
            if (consistencyCtx) prompt += `\n\n${consistencyCtx}`;
        } catch(e) { console.warn('一致性上下文构建失败:', e); }

        const status = document.getElementById('fb-status');
        if (status) status.textContent = '正在写正文...';
        this._setGenerating(true);

        const outEl = document.getElementById('fb-output');
        if (outEl) outEl.innerHTML = '<div class="text-green-400 animate-pulse"><i class="fa-solid fa-spinner fa-spin mr-2"></i>正在创作正文...</div>';

        const plOut = document.getElementById('pl-output');
        if (plOut) plOut.textContent = '正文创作中...\n';

        let result = '';
        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                if (plOut) plOut.textContent = result;
            });
        } catch(e) {
            if (e.message === '已中止') { throw e; }
            UI.toast('写正文出错: ' + e.message);
        }
        if (!this._pipelineRunning) { this._setGenerating(false); throw new Error('已中止'); }

        this._pipelineResults.write = result;
        this._allPipelineResults.write = (this._allPipelineResults.write || '') + '\n\n---\n\n' + result;
        this._setGenerating(false);
        if (status) status.textContent = '正文创作完成';
        this._plLog(`正文创作完成 (${result.length}字)`, 'ok');

        // 存入DB
        if (result) {
            await DB.put('writings', {
                id: 'fusion_write_' + Date.now(),
                title: '融合正文',
                content: result,
                source: 'pipeline',
                createdAt: Date.now()
            });

            // 同步到长篇执笔正文：找到刚才细纲创建的章节并更新正文
            const chIdx = this.left.chapterIdx;
            const allChaps = await DB.getAll('chapters') || [];
            const targetChap = allChaps.find(c => c.source === 'pipeline' && c.title && c.title.includes(`第${chIdx + 1}章`));
            if (targetChap) {
                targetChap.content = result;
                await DB.put('chapters', targetChap);
                this._plLog('✍️ 正文→长篇执笔', 'entity');
            }

            // 正文存RAG
            if (typeof RAGSystem !== 'undefined') {
                await RAGSystem.addDocument(`正文_第${chIdx + 1}章`, result.slice(0, 8000), 'pipeline_write');
                this._plLog('🔍 正文→RAG', 'entity');
            }
        }
    },

    // ---- 查看结果 ----
    viewResult(key) {
        const content = this._pipelineResults[key];
        if (!content) return;
        const outEl = document.getElementById('fb-output');
        if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(content) : content;
    },

    exportResult() {
        const outEl = document.getElementById('fb-output');
        const content = outEl?.innerText;
        if (!content) return UI.toast('暂无内容');
        ContextHelper.exportToLibrary('融合拆书_' + new Date().toLocaleTimeString(), content);
    },

    saveToMemory() {
        const outEl = document.getElementById('fb-output');
        const content = outEl?.innerText;
        if (!content) return UI.toast('暂无内容');
        MemorySystem.addWorking('[融合拆书] ' + content.slice(0, 500), 'fusion', 4, { source: 'fusion_book' });
        UI.toast('已存入工作记忆');
    },

    async sendToWorld(side) {
        const analysis = this[side]?.analysis;
        if (!analysis) return UI.toast('请先分析' + (side === 'left' ? '左' : '右') + '书');
        await DB.put('assets', {
            id: 'fusion_' + side + '_' + Date.now(),
            name: (side === 'left' ? '左书' : '右书') + '技法分析',
            type: 'technique',
            content: analysis,
            tags: ['融合', '技法', side],
            createdAt: Date.now()
        });
        UI.toast('已存入世界引擎');
    },

    sendToPhoenix() {
        const content = this._pipelineResults.fusion || this._pipelineResults.compare || '';
        if (!content) return UI.toast('请先完成融合或对比');
        // 融合技法为去内容化通用模板，可套用到任何新故事
        const ctx = '[融合拆书技法] 以下内容为两书技法融合产出的原创细纲/通用技法模板。角色/世界观/情节全部原创，严禁复用原书内容。';
        const fullContent = ctx + '\n\n' + content;
        // 存入凤凰创作的素材
        if (typeof Modules.phoenix !== 'undefined' && Modules.phoenix._fusionRef !== undefined) {
            Modules.phoenix._fusionRef = fullContent;
        }
        MemorySystem.addWorking('[融合技法→凤凰流] ' + ctx + '\n' + content.slice(0, 300), 'fusion_ref', 5, { nexusState: { chr: '原创', wld: '融合细纲' } });
        App.nav('phoenix');
        UI.toast('已跳转到凤凰创作，融合技法已注入');
    },

    sendToWriter() {
        const content = this._pipelineResults.fusion || this._pipelineResults.write || '';
        if (!content) return UI.toast('请先完成融合');
        // 融合技法为去内容化通用模板，可套用到任何新故事
        const ctx = '[融合拆书技法] 以下内容为两书技法融合产出的原创细纲/通用技法模板。角色/世界观/情节全部原创，严禁复用原书内容。';
        const fullContent = ctx + '\n\n' + content;
        MemorySystem.addWorking('[融合技法→执笔台] ' + ctx + '\n' + content.slice(0, 300), 'fusion_ref', 5, { nexusState: { chr: '原创', wld: '融合细纲' } });
        App.nav('writer');
        UI.toast('已跳转到执笔台，融合技法已注入工作记忆');
    },

    async _cycleFusionSummary(cyclePairs, cycleSize, leftBook, rightBook) {
        const cycleNum = Math.ceil(cyclePairs.length / cycleSize);
        const startIdx = cyclePairs[0].leftIdx + 1;
        const endIdx = cyclePairs[cyclePairs.length - 1].leftIdx + 1;

        // 获取书名（用于日志和prompt）
        const primarySide = this._primaryBook || 'left';
        const secondarySide = primarySide === 'left' ? 'right' : 'left';
        const primaryBookObj = primarySide === 'left' ? leftBook : rightBook;
        const secondaryBookObj = primarySide === 'left' ? rightBook : leftBook;
        const primaryName = primaryBookObj ? primaryBookObj.name : (primarySide === 'left' ? '左书' : '右书');
        const secondaryName = secondaryBookObj ? secondaryBookObj.name : (primarySide === 'left' ? '右书' : '左书');

        this._plLog(`🔄 执行第${cycleNum}个循环总结 (第${startIdx}-${endIdx}章)`, 'info');

        const titleEl = document.getElementById('pl-current-title');
        if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-sync mr-1 text-cyan-400"></i>循环融合总结: 第${startIdx}-${endIdx}章`; 

        let leftCycleAnalyses = '';
        let rightCycleAnalyses = '';
        let cycleOutlines = '';
        let cycleEntities = [];
        let cycleWritings = '';

        for (let i = 0; i < cyclePairs.length; i++) {
            const { leftIdx, rightIdx } = cyclePairs[i];
            const lCh = leftBook.chapters[leftIdx];
            const rCh = rightBook.chapters[rightIdx];

            const leftKey = `cycle_${leftBook.id}_${leftIdx}`;
            const rightKey = `cycle_${rightBook.id}_${rightIdx}`;
            const outlineKey = `cycle_outline_${leftIdx}`;
            const writeKey = `cycle_write_${leftIdx}`;

            try {
                const leftStored = await DB.get('settings', leftKey);
                const rightStored = await DB.get('settings', rightKey);
                const outlineStored = await DB.get('settings', outlineKey);
                const writeStored = await DB.get('settings', writeKey);

                if (leftStored?.content) {
                    leftCycleAnalyses += `## 第${leftIdx + 1}章: ${lCh.title}\n${leftStored.content}\n\n`;
                }
                if (rightStored?.content) {
                    rightCycleAnalyses += `## 第${rightIdx + 1}章: ${rCh.title}\n${rightStored.content}\n\n`;
                }
                if (outlineStored?.content) {
                    cycleOutlines += `### 第${leftIdx + 1}章细纲\n${outlineStored.content.slice(0, 1000)}\n\n`;
                }
                if (writeStored?.content) {
                    cycleWritings += `### 第${leftIdx + 1}章正文片段\n${writeStored.content.slice(0, 500)}\n\n`;
                }
            } catch (e) {
                console.warn('读取循环章节分析失败:', e);
            }
        }

        if (leftCycleAnalyses.length === 0 || rightCycleAnalyses.length === 0) {
            this._plLog('⚠️ 循环章节分析不足，跳过循环总结', 'info');
            return;
        }

        const allEntities = await DB.getAll('entities') || [];
        const cycleRelatedEntities = allEntities.filter(e => {
            if (!e.chapterRef) return false;
            for (let i = startIdx; i <= endIdx; i++) {
                if (e.chapterRef.includes(i)) return true;
            }
            return false;
        });

        let entityContext = '';
        if (cycleRelatedEntities.length > 0) {
            entityContext = `\n\n【本循环已提取实体 (${cycleRelatedEntities.length}个)】\n`;
            const grouped = {};
            cycleRelatedEntities.forEach(e => {
                const t = e.type || '其他';
                if (!grouped[t]) grouped[t] = [];
                grouped[t].push(e);
            });
            for (const [type, ents] of Object.entries(grouped)) {
                entityContext += `[${type}] ${ents.map(e => e.name + (e.relations?.length ? `(${e.relations.slice(0,3).join(',')})` : '')).join('、')}\n`;
            }
        }

        const prevCycleKey = `cycle_fusion_prev_${startIdx}`;
        let prevCycleSummary = '';
        try {
            const prevStored = await DB.get('settings', prevCycleKey);
            if (prevStored?.content) {
                prevCycleSummary = `\n\n【上一循环总结参考】\n${prevStored.content.slice(0, 1500)}`;
            }
        } catch(e) {}

        const cycleFusionPrompt = `你是顶级网文技法融合大师，同时是NEXUS OS v2.0叙事工程的技法拆解专家。\n【核心原则】以下分析来自两书的技法拆解，你要做的是融合这些技法，产出一份去内容化的技法总结和融合细纲片段。\n【绝对禁令】\n1. 禁止出现原书角色名、地名、势力名\n2. 禁止复述原书的具体情节\n3. 所有输出必须是"通用技法"或"原创细纲片段"\n\n【技法来源A（${leftBook.name || '左书'}）】\n${leftCycleAnalyses.slice(0, 5000)}\n\n【技法来源B（${rightBook.name || '右书'}）】\n${rightCycleAnalyses.slice(0, 5000)}\n\n【本循环细纲参考】\n${cycleOutlines.slice(0, 2000)}
${entityContext}
${prevCycleSummary}

=== NEXUS OS v2.0 循环融合输出规范 ===
1. 【技法融合总结】两书技法融合后的核心创作指南（去内容化，通用模板）
2. 【循环核心技法模板】提炼可直接套用的写作公式（开篇钩子、节奏控制、爽点设计）
3. 【节奏曲线分析】这${cycleSize}章的节奏变化规律，标注高潮点和过渡点
4. 【爽点矩阵】爽点类型、密度、释放节奏，情绪价值曲线
5. 【悬念链条】伏笔和钩子的衔接设计，跨章节信息差运用
6. 【实体关联网络】本循环关键实体及其关系变化（原创实体，非原书内容）
7. 【NEXUS四状态机快照】
   - CHR角色状态: 列出本循环中各核心角色的状态变迁(S0注册→S1激活→S2互动→S3转折→S4休眠→S5退场→S6死亡)
   - WLD世界规则: 本循环中提出/验证/扩展/冲突/重构/冻结的规则
   - FOE伏笔网络: 本循环埋设/强化/回收/废弃的伏笔清单，标注计划回收章节
   - EMO情绪锚点: 每章情绪分值(1-10)、情绪词、钩子类型、张力等级
8. 【融合细纲片段】基于融合技法，创作一段原创细纲（新角色、新情节，展示技法运用）
9. 【下一循环优化建议】针对下${cycleSize}章的技法提升建议
10. 【可复用套路清单(零件库)】3-5个可直接套用的写作模板，每个含:名称+适用场景+执行步骤

只输出技法总结和原创细纲片段，严禁涉及原书的具体角色和情节。`;

        this._plSetStep('fusion', 'active', '循环深度融合中...');
        let result = '';
        try {
            await AI.generate(cycleFusionPrompt, {}, c => {
                result += c;
                const outEl = document.getElementById('pl-output');
                if (outEl) outEl.textContent = result;
            });
        } catch (e) {
            if (e.message === '已中止') { throw e; }
            this._plLog(`🔴 循环融合失败: ${e.message}`, 'err');
            return;
        }

        const cycleKey = `cycle_fusion_${startIdx}_${endIdx}`;
        await DB.put('settings', { id: cycleKey, content: result, createdAt: Date.now() });

        const nextCycleKey = `cycle_fusion_prev_${endIdx + 1}`;
        await DB.put('settings', { id: nextCycleKey, content: result.slice(0, 2000), createdAt: Date.now() });

        this._allPipelineResults.fusion += `\n\n---\n\n## 循环融合总结: 第${startIdx}-${endIdx}章\n\n${result}`;
        await DB.put('settings', { id: 'pipeline_fusion_context', content: this._allPipelineResults.fusion, updatedAt: Date.now() });

        if (this._plConfig.doRAG && typeof RAGSystem !== 'undefined') {
            await RAGSystem.addDocument(`循环融合_第${startIdx}-${endIdx}章`, result.slice(0, 8000), 'pipeline');
            
            if (cycleRelatedEntities.length > 0) {
                const entitySummary = cycleRelatedEntities.map(e => 
                    `${e.name}(${e.type}): ${e.desc?.slice(0, 50) || ''}`
                ).join('\n');
                await RAGSystem.addDocument(`循环实体_第${startIdx}-${endIdx}章`, entitySummary, 'entity');
            }
        }

        if (cycleWritings) {
            const cycleWriteKey = `cycle_writings_${startIdx}_${endIdx}`;
            await DB.put('settings', { id: cycleWriteKey, content: cycleWritings, createdAt: Date.now() });
        }

        this._plSetStep('fusion', 'done', `${result.length}字`);
        this._plLog(`✅ 循环融合完成: 第${startIdx}-${endIdx}章 (${result.length}字)`, 'ok');
        this._plLog(`   📊 提取实体: ${cycleRelatedEntities.length}个 | 细纲: ${cycleOutlines.length}字`, 'entity');

        await this._cycleExtractPatterns(startIdx, endIdx, result);

        // ★ 同步到世界引擎循环层
        try {
            const cycleData = {
                id: `cycle_${startIdx}_${endIdx}`,
                bookId: leftBook.id + '_' + rightBook.id,
                startChapter: startIdx,
                endChapter: endIdx,
                cycleNum: Math.ceil(endIdx / cycleSize),
                cycleSize,
                fusionEssence: result,
                compareResult: this._pipelineResults.compare || '',
                entityNames: cycleRelatedEntities.map(e => e.name),
                chapterIds: cyclePairs.map(p => 'ch_' + (p.leftIdx + 1)),
                // 简单正则提取NEXUS数据（容错）
                nexusCHR: this._parseNexusBlock(result, 'CHR角色状态', 'CHR'),
                nexusWLD: this._parseNexusBlock(result, 'WLD世界规则', 'WLD'),
                nexusFOE: this._parseNexusBlock(result, 'FOE伏笔网络', 'FOE'),
                nexusEMO: this._parseNexusEMO(result),
                createdAt: Date.now()
            };
            if(typeof Modules !== 'undefined' && Modules.world_engine) {
                await Modules.world_engine.syncCycle(cycleData);
                this._plLog(`🌍 已同步循环数据到世界引擎`, 'ok');
            }
        } catch(syncErr) {
            this._plLog(`⚠️ 同步世界引擎失败: ${syncErr.message}`, 'warn');
        }
    },

    // 简易NEXUS数据解析器（从循环融合文本中提取）
    _parseNexusBlock(text, blockName, prefix) {
        const lines = text.split('\n');
        const results = [];
        let inBlock = false;
        for(const line of lines) {
            if(line.includes(blockName) || line.includes(prefix)) inBlock = true;
            if(inBlock && (line.trim().startsWith('•') || line.trim().startsWith('-'))) {
                const clean = line.replace(/^[•\-\s]+/, '').trim();
                if(clean && clean.length > 3) {
                    const parts = clean.split(/[:：]/);
                    results.push({
                        name: parts[0]?.trim() || clean.slice(0, 20),
                        desc: clean,
                        status: parts[1]?.trim() || '',
                        from: '', to: parts[1]?.trim() || ''
                    });
                }
            }
            if(inBlock && line.trim() === '') { inBlock = false; }
        }
        return results;
    },
    _parseNexusEMO(text) {
        const results = [];
        const lines = text.split('\n');
        let inBlock = false;
        for(const line of lines) {
            if(line.includes('EMO情绪锚点')) inBlock = true;
            if(inBlock && (line.trim().startsWith('•') || line.trim().startsWith('-') || /第\d+章/.test(line))) {
                const m = line.match(/第(\d+)章.*?([\d]+).*?([\u4e00-\u9fa5]+)/);
                if(m) results.push({ chapter: parseInt(m[1]), score: parseInt(m[2]) || 5, word: m[3] || '', type: '' });
            }
            if(inBlock && line.trim().startsWith('【')) { inBlock = false; }
        }
        return results;
    },

    async _cycleExtractPatterns(startIdx, endIdx, fusionResult) {
        if (!fusionResult || fusionResult.length < 500) return;

        this._plLog(`📝 提取循环可复用模式...`, 'info');

        let patterns = '';
        try {
            await AI.generate(
                `从以下循环融合总结中提取可复用的写作模式和模板，以JSON格式输出：

${fusionResult.slice(0, 3000)}

输出格式：
{
  "hooks": ["开篇钩子模板1", "开篇钩子模板2"],
  "rhythms": ["节奏控制模板1", "节奏控制模板2"],
  "coolPoints": ["爽点设计模板1", "爽点设计模板2"],
  "suspenses": ["悬念布局模板1", "悬念布局模板2"],
  "transitions": ["场景转换模板1", "场景转换模板2"]
}

只输出JSON，不要其他内容。`,
                {}, c => { patterns += c; }
            );

            let cleanPatterns = patterns.trim();
            cleanPatterns = cleanPatterns.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
            
            const parsed = JSON.parse(cleanPatterns);
            const patternKey = `cycle_patterns_${startIdx}_${endIdx}`;
            await DB.put('settings', { 
                id: patternKey, 
                patterns: parsed,
                createdAt: Date.now()
            });

            const totalCount = Object.values(parsed).flat().length;
            this._plLog(`✅ 提取可复用模式: ${totalCount}个模板`, 'ok');

            if (this._plConfig.doRAG && typeof RAGSystem !== 'undefined') {
                const patternText = Object.entries(parsed).map(([k, v]) => 
                    `[${k}]\n${v.join('\n')}`
                ).join('\n\n');
                await RAGSystem.addDocument(`写作模式_第${startIdx}-${endIdx}章`, patternText, 'pattern');
            }
        } catch(e) {
            console.warn('提取循环模式失败:', e);
        }
    },

    // ★ 公共API：获取指定章节所属循环的融合精华（供writer.js调用）
    async getCycleFusionForChapter(chapterIdx) {
        if(!this._plConfig.cycleMode) return null;
        const cycleSize = this._plConfig.cycleSize || 5;
        const cycleNum = Math.ceil((chapterIdx + 1) / cycleSize);
        const start = (cycleNum - 1) * cycleSize + 1;
        const end = cycleNum * cycleSize;
        const cycleKey = `cycle_fusion_${start}_${end}`;
        try {
            const stored = await DB.get('settings', cycleKey);
            if(stored && stored.content) return { cycleId: cycleKey, start, end, fusion: stored.content };
        } catch(e) {}
        return null;
    },

    clearAll() {
        this.left = { bookId: null, chapterIdx: null, analysis: '' };
        this.right = { bookId: null, chapterIdx: null, analysis: '' };
        this._pipelineResults = {};
        this._pipelineStep = 0;
        const outEl = document.getElementById('fb-output');
        if (outEl) outEl.innerHTML = '';
        const view = document.getElementById('module-view-fusion_book');
        if (view) view.innerHTML = this.render();
        this.init();
        UI.toast('已清空');
    },

    // ═══════════════════════════════════════════════════════════════
    // 主书设定系统 - 以主拆书为基准保证一致性
    // ═══════════════════════════════════════════════════════════════
    setPrimaryBook(side) {
        const FB = Modules.fusion_book;
        FB._primaryBook = side;
        
        const leftBadge = document.getElementById('fb-primary-badge-left');
        const rightBadge = document.getElementById('fb-primary-badge-right');
        
        if(leftBadge) leftBadge.classList.toggle('hidden', side !== 'left');
        if(rightBadge) rightBadge.classList.toggle('hidden', side !== 'right');
        
        UI.toast(`${side === 'left' ? '左书' : '右书'}已设为主拆书基准`);
        
        FB._savePrimarySettings();
    },

    async _savePrimarySettings() {
        const FB = Modules.fusion_book;
        const primaryBook = FB._primaryBook === 'left' ? FB.left : FB.right;
        const books = FB._books || [];
        const book = books.find(b => b.id === primaryBook.bookId);
        
        if(!book) return;
        
        const settings = {
            id: 'primary_book_settings',
            side: FB._primaryBook,
            bookId: primaryBook.bookId,
            bookName: book.name,
            chapterCount: book.chapters?.length || 0,
            totalChars: book.chapters?.reduce((sum, ch) => sum + (ch.content?.length || 0), 0) || 0,
            setAt: Date.now()
        };
        
        await DB.put('settings', settings);
        FB._primarySettings = settings;
    },

    async _loadPrimarySettings() {
        const FB = Modules.fusion_book;
        try {
            const saved = await DB.get('settings', 'primary_book_settings');
            if(saved && saved.bookId) {
                FB._primaryBook = saved.side || 'left';
                FB._primarySettings = saved;
            }
        } catch(e) {}
    },

    // ═══ 一致性检查 - 确保所有内容以主拆书为基准 ═══
    async checkConsistency() {
        const FB = Modules.fusion_book;
        
        if(!FB._primarySettings) {
            await FB._loadPrimarySettings();
        }
        
        if(!FB._primarySettings || !FB._primarySettings.bookId) {
            UI.toast('请先设置主拆书');
            return;
        }
        
        const primaryBook = FB._primaryBook === 'left' ? FB.left : FB.right;
        const secondaryBook = FB._primaryBook === 'left' ? FB.right : FB.left;
        
        if(!primaryBook.bookId) {
            UI.toast('主书未选择书籍');
            return;
        }
        
        const books = FB._books || [];
        const primary = books.find(b => b.id === primaryBook.bookId);
        const secondary = secondaryBook.bookId ? books.find(b => b.id === secondaryBook.bookId) : null;
        
        if(!primary) {
            UI.toast('找不到主书数据');
            return;
        }
        
        const modal = document.createElement('div');
        modal.id = 'fb-consistency-modal';
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm';
        modal.onclick = (e) => { if(e.target === modal) modal.remove(); };
        
        modal.innerHTML = `
            <div class="bg-[#1a1a2e] rounded-2xl border border-white/10 w-[700px] max-h-[80vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex center text-white">
                            <i class="fa-solid fa-check-double text-lg"></i>
                        </div>
                        <div>
                            <div class="font-bold text-white text-base">一致性检查报告</div>
                            <div class="text-[10px] text-dim">主拆书: ${FB._primarySettings.bookName || primary.name}</div>
                        </div>
                    </div>
                    <button class="btn btn-sm bg-white/5 text-dim hover:text-white" onclick="this.closest('#fb-consistency-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto p-5" id="fb-consistency-content">
                    <div class="text-center text-dim py-8">
                        <i class="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
                        <p>正在分析一致性...</p>
                    </div>
                </div>
                <div class="px-6 py-3 border-t border-white/5 shrink-0 flex gap-2">
                    <button class="btn btn-sm bg-cyan-600/20 text-cyan-400 border-cyan-600/30 flex-1" onclick="Modules.fusion_book._fixConsistencyIssues()">
                        <i class="fa-solid fa-wrench mr-1"></i>自动修复
                    </button>
                    <button class="btn btn-sm bg-white/5 text-dim flex-1" onclick="this.closest('#fb-consistency-modal').remove()">关闭</button>
                </div>
            </div>`;
        
        document.body.appendChild(modal);
        
        const contentEl = document.getElementById('fb-consistency-content');
        
        const report = await FB._generateConsistencyReport(primary, secondary);
        
        if(contentEl) {
            contentEl.innerHTML = report.html;
        }
        
        FB._lastConsistencyReport = report;
    },

    async _generateConsistencyReport(primary, secondary) {
        const FB = Modules.fusion_book;
        const issues = [];
        const suggestions = [];
        
        const primaryChars = primary.chapters?.reduce((sum, ch) => sum + (ch.content?.length || 0), 0) || 0;
        const secondaryChars = secondary ? secondary.chapters?.reduce((sum, ch) => sum + (ch.content?.length || 0), 0) || 0 : 0;
        
        if(secondary && secondaryChars > primaryChars * 1.5) {
            issues.push({
                type: 'warning',
                title: '字数比例失衡',
                desc: `副书字数(${(secondaryChars/10000).toFixed(1)}万)远超主书(${(primaryChars/10000).toFixed(1)}万)，可能影响融合质量`,
                fix: '建议增加主书章节数量或减少副书章节'
            });
        }
        
        if(secondary && primary.chapters && secondary.chapters) {
            const primaryChapters = primary.chapters.length;
            const secondaryChapters = secondary.chapters.length;
            
            if(Math.abs(primaryChapters - secondaryChapters) > Math.max(primaryChapters, secondaryChapters) * 0.3) {
                issues.push({
                    type: 'info',
                    title: '章节数量差异',
                    desc: `主书${primaryChapters}章 vs 副书${secondaryChapters}章`,
                    fix: '流水线会自动配对，但建议选择相近章节数'
                });
            }
        }
        
        const worldEngine = Modules.world_engine;
        if(worldEngine) {
            await worldEngine._ensureCache();
            const entities = worldEngine._cachedEntities || [];
            const worldEntities = entities.filter(e => !e.id.startsWith('world_'));
            
            if(worldEntities.length > 0) {
                const primaryContent = primary.chapters?.map(ch => ch.content || '').join('\n') || '';
                let matchedCount = 0;
                
                worldEntities.forEach(ent => {
                    if(primaryContent.includes(ent.name)) {
                        matchedCount++;
                    }
                });
                
                const matchRate = (matchedCount / worldEntities.length * 100).toFixed(1);
                
                if(matchRate < 30) {
                    issues.push({
                        type: 'warning',
                        title: '实体匹配率低',
                        desc: `世界引擎中${worldEntities.length}个实体，仅${matchedCount}个在主书中出现(${matchRate}%)`,
                        fix: '建议从主书提取实体到世界引擎'
                    });
                } else {
                    suggestions.push({
                        type: 'success',
                        title: '实体匹配良好',
                        desc: `${worldEntities.length}个实体中${matchedCount}个在主书中出现(${matchRate}%)`
                    });
                }
            }
        }
        
        const fusion = FB._allPipelineResults?.fusion || FB._pipelineResults?.fusion || '';
        if(fusion) {
            const primaryNames = primary.chapters?.slice(0, 5).map(ch => ch.title).join(', ') || '';
            suggestions.push({
                type: 'success',
                title: '融合技法已生成',
                desc: `已生成${fusion.length}字融合技法精华`
            });
        } else {
            issues.push({
                type: 'info',
                title: '尚未生成融合技法',
                desc: '建议运行流水线生成融合技法精华',
                fix: '点击"一键自动拆书链"开始'
            });
        }
        
        let html = '<div class="space-y-4">';
        
        if(issues.length > 0) {
            html += `<div>
                <div class="text-[11px] text-amber-400 font-bold uppercase mb-2"><i class="fa-solid fa-exclamation-triangle mr-1"></i>发现的问题 (${issues.length})</div>
                <div class="space-y-2">`;
            issues.forEach(issue => {
                const colors = {
                    warning: 'border-amber-500/30 bg-amber-500/5',
                    error: 'border-red-500/30 bg-red-500/5',
                    info: 'border-blue-500/30 bg-blue-500/5'
                };
                html += `<div class="p-3 rounded-lg border ${colors[issue.type] || colors.info}">
                    <div class="text-[11px] font-bold text-white mb-1">${issue.title}</div>
                    <div class="text-[10px] text-dim mb-1">${issue.desc}</div>
                    ${issue.fix ? `<div class="text-[10px] text-cyan-400"><i class="fa-solid fa-lightbulb mr-1"></i>${issue.fix}</div>` : ''}
                </div>`;
            });
            html += '</div></div>';
        }
        
        if(suggestions.length > 0) {
            html += `<div>
                <div class="text-[11px] text-green-400 font-bold uppercase mb-2"><i class="fa-solid fa-check-circle mr-1"></i>状态良好 (${suggestions.length})</div>
                <div class="space-y-2">`;
            suggestions.forEach(sug => {
                html += `<div class="p-3 rounded-lg border border-green-500/20 bg-green-500/5">
                    <div class="text-[11px] font-bold text-white mb-1">${sug.title}</div>
                    <div class="text-[10px] text-dim">${sug.desc}</div>
                </div>`;
            });
            html += '</div></div>';
        }
        
        html += `<div class="mt-4 p-3 rounded-lg border border-white/5 bg-white/[0.02]">
            <div class="text-[10px] text-dim font-bold uppercase mb-2">主拆书基准信息</div>
            <div class="grid grid-cols-2 gap-2 text-[10px]">
                <div><span class="text-dim">书名:</span> <span class="text-white">${primary.name}</span></div>
                <div><span class="text-dim">章节数:</span> <span class="text-white">${primary.chapters?.length || 0}</span></div>
                <div><span class="text-dim">总字数:</span> <span class="text-white">${(primaryChars/10000).toFixed(1)}万</span></div>
                <div><span class="text-dim">设定时间:</span> <span class="text-white">${FB._primarySettings?.setAt ? new Date(FB._primarySettings.setAt).toLocaleString('zh-CN') : '-'}</span></div>
            </div>
        </div></div>`;
        
        return { html, issues, suggestions };
    },

    async _fixConsistencyIssues() {
        const FB = Modules.fusion_book;
        
        if(!FB._lastConsistencyReport) {
            UI.toast('请先运行一致性检查');
            return;
        }
        
        const issues = FB._lastConsistencyReport.issues || [];
        let fixedCount = 0;
        
        for(const issue of issues) {
            if(issue.title === '实体匹配率低') {
                if(Modules.world_engine) {
                    await Modules.world_engine.extractFromFusion();
                    fixedCount++;
                }
            }
        }
        
        if(fixedCount > 0) {
            UI.toast(`已修复 ${fixedCount} 个问题`);
            const modal = document.getElementById('fb-consistency-modal');
            if(modal) modal.remove();
            await FB.checkConsistency();
        } else {
            UI.toast('没有可自动修复的问题');
        }
    },

    _toggleAdvancedPanel() {
        const panel = document.getElementById('fb-advanced-panel');
        if (panel) panel.classList.toggle('hidden');
    },

    _updateAgentStats() {
        const s = this._agentScheduler._stats;
        const el = document.getElementById('pl-agent-stats');
        if (el) {
            const elapsed = (Date.now() - s.startTime) / 60000;
            const rate = elapsed > 0 ? (s.done / elapsed).toFixed(1) : 0;
            el.textContent = `${s.running}运行/${s.pending}排队/${s.done}完成 | ${rate}章/分`;
        }
        const pending = document.getElementById('pl-agent-pending');
        const running = document.getElementById('pl-agent-running');
        const done = document.getElementById('pl-agent-done');
        if (pending) pending.textContent = s.pending;
        if (running) running.textContent = s.running;
        if (done) done.textContent = s.done;
        const bar = document.getElementById('pl-progress-bar');
        if (bar) {
            const total = s.pending + s.running + s.done + s.failed;
            const pct = total > 0 ? ((s.done + s.failed) / total * 100) : 0;
            bar.style.width = pct + '%';
        }
    },

    _setPhase(phase) {
        this._agentScheduler._phase = phase;
        for (let i = 1; i <= 4; i++) {
            const el = document.getElementById('pl-phase-' + i);
            if (el) {
                if (i === phase) {
                    el.className = 'px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 font-bold';
                } else if (i < phase) {
                    el.className = 'px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/20';
                } else {
                    el.className = 'px-1.5 py-0.5 rounded bg-white/5 text-dim';
                }
            }
        }
    },

    async _savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg) {
        await DB.put('settings', {
            id: 'pipeline_state',
            completedPairs, accOutlines, accEntities, allOutlines, allWritings,
            allPipelineResults: this._allPipelineResults,
            config: { leftBookId: this.left.bookId, rightBookId: this.right.bookId, ...cfg },
            pausedAt: Date.now()
        });
        this._savedPipelineState = await DB.get('settings', 'pipeline_state');
        this._plLog('流水线已暂停，进度已保存', 'info');
    },

    // ═══════════════════════════════════════════════════════════════
    // Agent 并发调度器系统
    // ═══════════════════════════════════════════════════════════════
    _agentScheduler: {
        _queue: [],
        _running: 0,
        _maxConcurrency: 1,
        _results: {},
        _stats: { pending: 0, running: 0, done: 0, failed: 0, startTime: 0 },
        _phase: 0,
        
        reset() {
            this._queue = [];
            this._running = 0;
            this._results = {};
            this._stats = { pending: 0, running: 0, done: 0, failed: 0, startTime: Date.now() };
            this._phase = 0;
        },
        
        addTask(id, fn, priority = 5, phase = 1) {
            this._queue.push({ id, fn, priority, phase, status: 'pending', retries: 0 });
            this._stats.pending++;
        },
        
        async run(maxConcurrency = 1) {
            this._maxConcurrency = maxConcurrency;
            this._stats.startTime = Date.now();
            const processQueue = async () => {
                while (this._queue.some(t => t.status === 'pending') || this._running > 0) {
                    // ★ 检查流水线是否被暂停或停止
                    const FB = Modules.fusion_book;
                    if(FB && FB._pipelinePaused) {
                        // 暂停状态：不再派发新任务，等待已有任务完成或中断
                        if(this._running === 0) break; // 所有任务都停了，退出循环
                        await new Promise(r => setTimeout(r, 500));
                        continue;
                    }
                    if(FB && !FB._pipelineRunning) {
                        // 停止状态：标记所有 pending 任务为取消，等待 running 任务结束
                        this._queue.filter(t => t.status === 'pending').forEach(t => { t.status = 'cancelled'; });
                        if(this._running === 0) break;
                        await new Promise(r => setTimeout(r, 500));
                        continue;
                    }
                    const available = this._queue.filter(t => t.status === 'pending');
                    const slots = this._maxConcurrency - this._running;
                    if (available.length > 0 && slots > 0) {
                        const toRun = available.slice(0, slots);
                        for (const task of toRun) {
                            task.status = 'running';
                            this._stats.pending--;
                            this._stats.running++;
                            this._running++;
                            this._executeTask(task);
                        }
                    }
                    await new Promise(r => setTimeout(r, 100));
                }
            };
            await processQueue();
        },

        async _executeTask(task) {
            const execute = async () => {
                // ★ 检查是否已停止
                const FB = Modules.fusion_book;
                if(FB && !FB._pipelineRunning && !FB._pipelinePaused) {
                    task.status = 'cancelled';
                    this._results[task.id] = { error: '用户停止' };
                    return;
                }
                try {
                    const result = await task.fn();
                    task.status = 'done';
                    this._results[task.id] = result;
                    this._stats.done++;
                } catch(e) {
                    // ★ 重试前检查暂停/停止状态
                    const fb = Modules.fusion_book;
                    if(fb && fb._pipelinePaused) {
                        task.status = 'pending'; // 放回队列，等继续时再跑
                        return;
                    }
                    if(fb && !fb._pipelineRunning) {
                        task.status = 'cancelled';
                        this._results[task.id] = { error: '用户停止' };
                        return;
                    }
                    if (task.retries < 5) {
                        task.retries++;
                        const delay = Math.pow(2, task.retries) * 1000;
                        await new Promise(r => setTimeout(r, delay));
                        // 递归重试
                        await execute();
                    } else {
                        task.status = 'failed';
                        this._results[task.id] = { error: e.message };
                        this._stats.failed++;
                    }
                }
            };
            await execute();
            this._stats.running--;
            this._running--;
        }
    }

};

