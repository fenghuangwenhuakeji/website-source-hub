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
        let errorMsg = '';
        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                if (plOut) plOut.textContent = result;
            });
        } catch(e) {
            if (e.message === '已中止') { aborted = true; }
            else {
                errorMsg = e.message || '未知错误';
                UI.toast('分析出错: ' + errorMsg, 'error');
            }
        }

        // ★ 如果被中止或流水线已停止，不保存结果，抛出错误中断调用链
        if (aborted || !this._pipelineRunning) {
            this._setGenerating(false);
            if (status) status.textContent = `${side === 'left' ? '左' : '右'}书分析已中止`;
            throw new Error('已中止');
        }

        // 如果有错误且不是中止，清理状态并返回
        if (errorMsg) {
            this._setGenerating(false);
            if (status) status.textContent = `${side === 'left' ? '左' : '右'}书分析失败`;
            if (outEl) outEl.innerHTML = `<div class="text-red-400"><i class="fa-solid fa-circle-xmark mr-1"></i>分析失败: ${errorMsg}</div>`;
            return;
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
        // ★ 同步融合数据到项目
        await this._syncToProject();
    },

    // ═══════════════════════════════════════════════════════════════
    // ★ 拆书融合专属 — 数据同步到 GenesisCore
    // ═══════════════════════════════════════════════════════════════
    async _syncToProject() {
        const proj = await GenesisCore.getActiveProject();
        if (!proj || proj.mode !== 'fusion') return;
        const leftBook = this.left || {};
        const rightBook = this.right || {};
        const pr = this._pipelineResults || {};
        const allPr = this._allPipelineResults || {};

        // 提取融合技法列表
        const techniques = [];
        const fusionText = allPr.fusion || pr.fusion || '';
        if (fusionText) {
            const lines = fusionText.split('\n').filter(l => l.trim());
            lines.forEach(line => {
                const match = line.match(/^\d+\.\s*【?([^】:]+)】?[:：]\s*(.+)$/);
                if (match) techniques.push({ name: match[1].trim(), desc: match[2].trim() });
            });
        }

        // 提取写作模板
        const templates = [];
        const compareText = allPr.compare || pr.compare || '';
        if (compareText) {
            const sections = compareText.split(/#{2,3}\s+/).filter(s => s.trim());
            sections.forEach(sec => {
                const title = sec.split('\n')[0] || '';
                if (title.includes('模板') || title.includes('套路') || title.includes('技法')) {
                    templates.push({ name: title, content: sec.slice(0, 500) });
                }
            });
        }

        await GenesisCore.updateModeData({
            bookA: {
                name: leftBook.name || '左书',
                chapters: (leftBook.chapters || []).map(c => ({ title: c.title, index: c.index })),
                patterns: leftBook.analysis ? [leftBook.analysis.slice(0, 200)] : [],
                essence: (allPr.left || pr.left || '').slice(0, 500),
                stats: { chapterCount: (leftBook.chapters || []).length }
            },
            bookB: {
                name: rightBook.name || '右书',
                chapters: (rightBook.chapters || []).map(c => ({ title: c.title, index: c.index })),
                patterns: rightBook.analysis ? [rightBook.analysis.slice(0, 200)] : [],
                essence: (allPr.right || pr.right || '').slice(0, 500),
                stats: { chapterCount: (rightBook.chapters || []).length }
            },
            compareResult: {
                similarities: this._extractComparePoints(compareText, '相似'),
                differences: this._extractComparePoints(compareText, '差异'),
                insights: this._extractComparePoints(compareText, '洞察')
            },
            fusionTechniques: techniques.slice(0, 20),
            writingTemplates: templates.slice(0, 10),
            fusionRules: fusionText.slice(0, 2000),
            pipelineResults: {
                left: (allPr.left || '').slice(0, 1000),
                right: (allPr.right || '').slice(0, 1000),
                compare: (allPr.compare || '').slice(0, 1000),
                fusion: (allPr.fusion || '').slice(0, 2000)
            }
        });
    },

    _extractComparePoints(text, keyword) {
        if (!text) return [];
        const lines = text.split('\n').filter(l => l.toLowerCase().includes(keyword));
        return lines.slice(0, 5).map(l => l.trim());
    },

};
