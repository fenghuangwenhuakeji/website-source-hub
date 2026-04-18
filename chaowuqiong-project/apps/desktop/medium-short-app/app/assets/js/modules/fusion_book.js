/**
 * 融合拆书 UI 模块 (三栏对比版)
 * Modules.fusion_book
 */
// ================================================================
// ========== 模块1: 融合拆书 (三栏对比版 — 还原截图布局) ==========
// ================================================================
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
        cycleSize: 5        // 循环大小（默认5章为一个循环）
    },

    _PROMPTS: {
        analyze: `你是顶级网文技法拆解大师。请深度拆解以下章节的写作技法，只提炼套路和技巧，不要附带原文的角色、情节、地点：\n\n书名：{{book}}\n章节：{{title}}\n\n{{content}}\n\n请从以下维度拆解：\n1. 【开篇钩子】如何在前3句抓住读者\n2. 【节奏控制】快慢交替、张弛有度的节奏设计\n3. 【爽点设计】情绪价值的制造和释放节奏\n4. 【悬念布局】伏笔、钩子、信息差的运用\n5. 【对话技巧】潜台词、性格化语言、信息传递效率\n6. 【场景转换】转场技巧、时空跳跃的处理\n7. 【情感操控】读者情绪曲线的设计\n8. 【可复用套路】提炼出可以直接套用的写作模板`,
        compare: `你是写作技法对比分析专家。请对比以下两份章节分析报告的写作技法差异，只关注套路和技巧层面，不要涉及具体角色和情节：\n\n【左书分析】\n{{left}}\n\n【右书分析】\n{{right}}\n\n请从以下维度对比：\n1. 开篇策略差异\n2. 节奏控制差异\n3. 爽点设计差异\n4. 悬念手法差异\n5. 各自独特的可复用套路\n6. 综合优劣评价`,
        compareAnalysis: `你是写作技法对比分析专家。请对比以下两份分析报告的写作技法差异：\n\n【分析A】\n{{left}}\n\n【分析B】\n{{right}}\n\n请深度对比两者在技法层面的异同，提炼各自的精华套路。`,
        fusion: `你是网文写作技法融合大师。请将以下两书的写作技法精华进行有机融合，创造一套全新的、更强大的写作方法论：\n\n【左书技法】\n{{left}}\n\n【右书技法】\n{{right}}\n\n【对比结论】\n{{compare}}\n\n请融合输出：\n1. 【融合后的开篇模板】结合两书优势的开篇套路\n2. 【融合后的节奏公式】最优节奏控制方案\n3. 【融合后的爽点矩阵】情绪价值最大化方案\n4. 【融合后的悬念体系】伏笔和钩子的最佳实践\n5. 【终极写作模板】可直接套用的章节写作模板\n注意：只输出方法论和套路，不要包含任何原书的角色、情节、地点。`,
        write: `你是顶级网文写手，擅长写小白文爽文。请根据以下融合后的写作技法精华，结合大纲素材，创作一段高质量的原创正文：\n\n【写作技法参考】\n{{fusion}}\n\n【大纲/素材】\n{{outline}}\n\n【世界观设定】\n{{world}}\n\n要求：\n1. 严格运用融合技法中的套路\n2. 开篇必须有强力钩子，3句话内抓住读者\n3. 节奏紧凑，爽点密集，不要水字数\n4. 对话鲜活有潜台词，口语化、接地气\n5. 场景描写有画面感但不啰嗦\n6. 完全原创，不得抄袭任何原书内容\n7. 语言风格：大白话、简洁有力、一句一个信息点，拒绝文绉绉\n8. 排版要求：每段不超过3-4行（手机屏幕友好），多用短句，对话单独成段\n9. 情节逻辑必须与前文连贯，人物性格前后一致\n10. 每个场景转换要有过渡，不能跳跃突兀`
    },

    render() {
        const FB = this;
        const pr = FB._pipelineResults || {};
        const leftCharCount = FB._getSelectedChapterCharCount('left');
        const rightCharCount = FB._getSelectedChapterCharCount('right');
        return `
        <div class="flex flex-col h-full bg-white overflow-hidden">
            <!-- 顶部标题栏 -->
            <div class="h-10 flex items-center justify-between px-4 bg-[#F1F3F5] border-b border-gray-200 shrink-0">
                <div class="flex items-center gap-2">
                    <span class="text-base font-bold text-green-600 flex items-center gap-2">
                    <i class="fa-solid fa-book-open-reader text-xl text-green-500"></i>
                    融合拆书
                </span>
                    <span class="px-2 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-2 border-green-300 shadow-sm">双书对比模式</span>
                    <span class="hidden text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg border-2 border-red-200 animate-pulse" id="fb-gen-indicator">
                    <i class="fa-solid fa-circle text-[8px] mr-1"></i>
                    生成中
                </span>
                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.fusion_book.selectSaveFolder()"><i class="fa-solid fa-folder-open mr-1"></i>${FB._plConfig.saveFolder ? '📁 ' + FB._plConfig.saveFolder.split('/').pop().split('\\\\').pop() : '选择文件夹'}</button>
                    ${FB._plConfig.lastSync ? `<span class="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border-2 border-green-200">
                    <i class="fa-solid fa-check-circle mr-1"></i>
                    已实时传输 ${new Date(FB._plConfig.lastSync).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</span>` : ''}
                </div>
                <div class="flex items-center gap-1">
                    <span class="text-xs font-bold text-gray-700 flex items-center gap-1.5 mr-2">
                    <i class="fa-solid fa-gear text-gray-400"></i>
                    步骤提示词:
                </span>
                    <button class="btn px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white border-none shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.short.openPromptModal('fusion_analyze')">
                    <i class="fa-solid fa-bolt mr-1.5"></i>
                    <span class="text-xs font-bold">拆解</span>
                </button>
                    <button class="btn px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white border-none shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.short.openPromptModal('fusion_compare_analysis')">
                    <i class="fa-solid fa-code-compare mr-1.5"></i>
                    <span class="text-xs font-bold">对比</span>
                </button>
                    <button class="btn px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white border-none shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.short.openPromptModal('fusion_merge')">
                    <i class="fa-solid fa-wand-magic-sparkles mr-1.5"></i>
                    <span class="text-xs font-bold">融合</span>
                </button>
                    <button class="btn px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white border-none shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.short.openPromptModal('fusion_outline')">
                    <i class="fa-solid fa-list-check mr-1.5"></i>
                    <span class="text-xs font-bold">细纲</span>
                </button>
                    <button class="btn px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white border-none shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.short.openPromptModal('fusion_write')">
                    <i class="fa-solid fa-file-lines mr-1.5"></i>
                    <span class="text-xs font-bold">正文</span>
                </button>
                    <span class="w-px h-4 bg-gray-200 mx-1"></span>
                    <label class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 cursor-pointer"><i class="fa-solid fa-upload mr-1"></i>导入书籍<input type="file" accept=".txt,.epub" class="hidden" onchange="Modules.fusion_book._handleImportFile(this)"></label>
                </div>
            </div>

            <!-- 三栏主体 -->
            <div class="flex-1 flex min-h-0 overflow-hidden">
                <!-- 左书栏 -->
                <div class="w-[280px] shrink-0 flex flex-col bg-[#F1F3F5] border-r border-gray-200 overflow-hidden">
                    <div class="p-2 border-b border-gray-200 bg-blue-500/5">
                        <div class="flex items-center gap-2 mb-1.5">
                            <span class="text-sm font-bold text-blue-600 flex items-center gap-2">
                            <i class="fa-solid fa-book-open text-blue-400"></i>
                            A 左书
                        </span>
                            <span class="text-xs font-bold px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white border-2 border-amber-400 shadow-lg shadow-amber-500/30 ${FB._primaryBook === 'left' ? '' : 'hidden'}" id="fb-primary-badge-left">
                            <i class="fa-solid fa-crown mr-1"></i>主书
                        </span>
                            <select id="fb-left-book" class="flex-1 bg-white border-2 border-gray-300 rounded-lg text-xs text-gray-700 font-bold p-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200" onchange="Modules.fusion_book.selectBook('left',this.value)"></select>
                            <button class="text-red-400/50 hover:text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition-all" onclick="Modules.fusion_book.deleteSelectedBook('left')">
                            <i class="fa-solid fa-trash text-sm"></i>
                        </button>
                        </div>
                        <div class="flex gap-1">
                            <button class="btn py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white border-none shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all hover:scale-105 rounded-lg flex-1 ${FB._primaryBook === 'left' ? 'ring-2 ring-amber-400' : ''}" onclick="Modules.fusion_book.setPrimaryBook('left')">
                            <i class="fa-solid fa-crown mr-1.5"></i>
                            <span class="text-xs font-bold">设为主书</span>
                        </button>
                            <button class="btn py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white border-none shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all hover:scale-105 rounded-lg flex-1" onclick="Modules.fusion_book.checkConsistency()">
                            <i class="fa-solid fa-check-double mr-1.5"></i>
                            <span class="text-xs font-bold">一致性检查</span>
                        </button>
                        </div>
                    </div>
                    <div class="flex-1 flex flex-col min-h-0">
                        <div id="fb-left-chapters" class="flex-[2] overflow-y-auto border-b border-gray-200"></div>
                        <div id="fb-left-preview" class="flex-[3] overflow-y-auto p-3 text-xs text-gray-400 leading-relaxed"></div>
                    </div>
                </div>

                <!-- 中间对比面板 -->
                <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
                    <!-- 对比操作栏 -->
                    <div class="p-2 border-b border-gray-200 bg-[#F1F3F5]">
                        <div class="flex items-center justify-center gap-2 mb-1.5">
                            <button class="btn px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white border-none shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.fusion_book.compareChapters()">
                            <i class="fa-solid fa-code-compare mr-2"></i>
                            <span class="text-sm font-bold">对比章节</span>
                        </button>
                            <button class="btn px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white border-none shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.fusion_book.compareAnalysis()">
                            <i class="fa-solid fa-microscope mr-2"></i>
                            <span class="text-sm font-bold">对比分析</span>
                        </button>
                        </div>
                        <div class="flex items-center justify-center gap-2 mb-1.5">
                            <button class="btn px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white border-none shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.fusion_book.fusionMerge()">
                            <i class="fa-solid fa-wand-magic-sparkles mr-2"></i>
                            <span class="text-sm font-bold">融合精华</span>
                        </button>
                            <button class="btn px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white border-none shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.fusion_book.saveToMemory()">
                            <i class="fa-solid fa-brain mr-2"></i>
                            <span class="text-sm font-bold">存记忆</span>
                        </button>
                            <button class="btn px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white border-none shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.fusion_book.exportResult()">
                            <i class="fa-solid fa-book mr-2"></i>
                            <span class="text-sm font-bold">存阅读</span>
                        </button>
                        </div>
                        <div class="flex items-center justify-center gap-4 text-center">
                            <div class="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200">
                            <div class="text-2xl font-bold text-blue-600">${leftCharCount > 0 ? (leftCharCount / 10000).toFixed(1) + '万' : '-'}</div>
                            <div class="text-xs font-bold text-gray-600">左书字数</div>
                        </div>
                            <div class="text-dim">⚡</div>
                            <div class="p-3 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg border-2 border-pink-200">
                            <div class="text-2xl font-bold text-pink-600">${rightCharCount > 0 ? (rightCharCount / 10000).toFixed(1) + '万' : '-'}</div>
                            <div class="text-xs font-bold text-gray-600">右书字数</div>
                        </div>
                        </div>
                    </div>
                    <!-- 对比/输出区 -->
                    <div class="flex-1 relative min-h-0">
                        <div id="fb-output" class="absolute inset-0 overflow-y-auto p-5 text-gray-700 text-sm leading-loose markdown-body"></div>
                    </div>
                </div>

                <!-- 右书栏 -->
                <div class="w-[280px] shrink-0 flex flex-col bg-[#F1F3F5] border-l border-gray-200 overflow-hidden">
                    <div class="p-2 border-b border-gray-200 bg-pink-500/5">
                        <div class="flex items-center gap-2 mb-1.5">
                            <span class="text-sm font-bold text-pink-600 flex items-center gap-2">
                            <i class="fa-solid fa-book-open text-pink-400"></i>
                            B 右书
                        </span>
                            <select id="fb-right-book" class="flex-1 bg-white border-2 border-gray-300 rounded-lg text-xs text-gray-700 font-bold p-2 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200" onchange="Modules.fusion_book.selectBook('right',this.value)"></select>
                            <button class="text-red-400/50 hover:text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition-all" onclick="Modules.fusion_book.deleteSelectedBook('right')">
                            <i class="fa-solid fa-trash text-sm"></i>
                        </button>
                        </div>
                    </div>
                    <div class="flex-1 flex flex-col min-h-0">
                        <div id="fb-right-chapters" class="flex-[2] overflow-y-auto border-b border-gray-200"></div>
                        <div id="fb-right-preview" class="flex-[3] overflow-y-auto p-3 text-xs text-gray-400 leading-relaxed"></div>
                    </div>
                </div>
            </div>

            <!-- 底部操作栏 -->
            <div class="h-9 flex items-center gap-1 px-3 bg-[#F1F3F5] border-t border-gray-200 shrink-0 overflow-x-auto">
                <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.fusion_book.analyzeSelected()"><i class="fa-solid fa-bolt mr-1"></i>AI拆解</button>
                <button class="btn btn-xs bg-gray-100 text-dim" onclick="Utils.copy(document.getElementById('fb-output')?.innerText)"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                <span class="w-px h-4 bg-gray-200 mx-0.5"></span>
                <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.fusion_book.batchAnalyze('left')"><i class="fa-solid fa-layer-group mr-1"></i>批量拆书</button>
                <button class="btn btn-xs bg-pink-600/20 text-pink-400 border-pink-600/30" onclick="Modules.fusion_book.batchAll()"><i class="fa-solid fa-rocket mr-1"></i>全部批量</button>
                <span class="w-px h-4 bg-gray-200 mx-0.5"></span>
                <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.fusion_book.sendToWorld('left')"><i class="fa-solid fa-globe mr-1"></i>左→世界</button>
                <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.fusion_book.sendToWorld('right')"><i class="fa-solid fa-globe mr-1"></i>右→世界</button>
                <span class="w-px h-4 bg-gray-200 mx-0.5"></span>
                <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.fusion_book.sendToPhoenix()"><i class="fa-solid fa-feather mr-1"></i>→凤凰流</button>
                <button class="btn btn-xs bg-indigo-600/20 text-indigo-400 border-indigo-600/30" onclick="Modules.fusion_book.sendToWriter()"><i class="fa-solid fa-pen-nib mr-1"></i>→执笔台</button>
                <span class="flex-1"></span>
                ${FB._pipelineRunning ? `<button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30" onclick="Modules.fusion_book.plPause()"><i class="fa-solid fa-pause mr-1"></i>暂停</button>` : (FB._pipelinePaused ? `<button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.fusion_book.plResume()"><i class="fa-solid fa-play mr-1"></i>继续</button>` : '')}
                <span class="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg border-2 border-gray-200" id="fb-status">就绪</span>
            </div>

            <!-- ===== 自动化流水线浮层 ===== -->
            <div id="fb-pipeline-overlay" class="absolute inset-0 z-50 flex flex-col bg-white border border-gray-200" style="display:none;">
                <div class="h-11 flex items-center justify-between px-4 bg-[#F1F3F5] border-b border-gray-200 shrink-0">
                    <div class="flex items-center gap-3">
                        <span class="text-base font-bold text-green-400"><i class="fa-solid fa-link mr-2"></i>自动化流水线 · 实时监控</span>
                        <span class="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-2 border-blue-300 shadow-sm" id="pl-step-label"></span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30" onclick="Modules.fusion_book.plMinimize()"><i class="fa-solid fa-compress mr-1"></i>最小化</button>
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" id="pl-pause-btn" style="display:none;" onclick="Modules.fusion_book.plPause()"><i class="fa-solid fa-pause mr-1"></i>暂停</button>
                        <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30" id="pl-stop-btn" style="display:none;" onclick="Modules.fusion_book.plStop()"><i class="fa-solid fa-stop mr-1"></i>停止</button>
                        <button class="btn btn-xs bg-gray-100 text-dim" onclick="Modules.fusion_book.plClose()"><i class="fa-solid fa-xmark mr-1"></i>关闭</button>
                    </div>
                </div>
                <div class="flex-1 flex min-h-0 overflow-hidden">
                    <!-- 左侧：实时输出 -->
                    <div class="flex-1 flex flex-col min-w-0 border-r border-gray-200">
                        <div class="flex items-center justify-between px-4 py-2 bg-[#F1F3F5] border-b border-gray-200 shrink-0">
                            <span class="text-xs font-bold text-gray-800" id="pl-current-title"><i class="fa-solid fa-file-lines mr-1 text-green-400"></i>等待启动</span>
                            <span class="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200" id="pl-current-chars"></span>
                        </div>
                        <div class="flex-1 overflow-y-auto p-5 text-sm text-gray-700 leading-loose whitespace-pre-wrap" id="pl-output">等待流水线启动...</div>
                    </div>
                    <!-- 右侧：状态面板 -->
                    <div class="w-[340px] shrink-0 flex flex-col overflow-y-auto bg-[#F1F3F5]">
                        <!-- 实时写入状态 - 2列网格卡片 -->
                        <div class="p-3 border-b border-gray-200">
                            <div class="text-xs font-bold text-gray-700 flex items-center gap-2 mb-2">
                            <i class="fa-solid fa-bolt text-amber-400"></i>
                            实时写入状态
                        </div>
                            <div class="grid grid-cols-2 gap-1.5" id="pl-status-grid">
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-gray-200 bg-white/[0.02] cursor-pointer hover:bg-gray-100 transition-all" id="pl-s-left" onclick="Modules.fusion_book.plPreview('left')"><span class="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" id="pl-d-left"></span><span class="text-[11px] text-blue-400 font-bold truncate">左书分析</span><span class="ml-auto text-[9px] text-dim" id="pl-i-left"></span></div>
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-gray-200 bg-white/[0.02] cursor-pointer hover:bg-gray-100 transition-all" id="pl-s-right" onclick="Modules.fusion_book.plPreview('right')"><span class="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" id="pl-d-right"></span><span class="text-[11px] text-pink-400 font-bold truncate">右书分析</span><span class="ml-auto text-[9px] text-dim" id="pl-i-right"></span></div>
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-gray-200 bg-white/[0.02] cursor-pointer hover:bg-gray-100 transition-all" id="pl-s-compare" onclick="Modules.fusion_book.plPreview('compare')"><span class="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" id="pl-d-compare"></span><span class="text-[11px] text-amber-400 font-bold truncate">对比</span><span class="ml-auto text-[9px] text-dim" id="pl-i-compare"></span></div>
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-gray-200 bg-white/[0.02] cursor-pointer hover:bg-gray-100 transition-all" id="pl-s-fusion" onclick="Modules.fusion_book.plPreview('fusion')"><span class="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" id="pl-d-fusion"></span><span class="text-[11px] text-green-400 font-bold truncate">融合</span><span class="ml-auto text-[9px] text-dim" id="pl-i-fusion"></span></div>
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-gray-200 bg-white/[0.02] cursor-pointer hover:bg-gray-100 transition-all col-span-2" id="pl-s-outline" onclick="Modules.fusion_book.plPreview('outline')"><span class="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" id="pl-d-outline"></span><span class="text-[11px] text-orange-400 font-bold">📋 细纲</span><span class="ml-auto text-[9px] text-dim" id="pl-i-outline"></span></div>
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-gray-200 bg-white/[0.02] cursor-pointer hover:bg-gray-100 transition-all" id="pl-s-world" onclick="Modules.fusion_book.plPreview('world')"><span class="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" id="pl-d-world"></span><span class="text-[11px] text-cyan-400 font-bold truncate">实体提取</span><span class="ml-auto text-[9px] text-dim" id="pl-i-world"></span></div>
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-gray-200 bg-white/[0.02] cursor-pointer hover:bg-gray-100 transition-all" id="pl-s-write" onclick="Modules.fusion_book.plPreview('write')"><span class="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" id="pl-d-write"></span><span class="text-[11px] text-purple-400 font-bold truncate">正文</span><span class="ml-auto text-[9px] text-dim" id="pl-i-write"></span></div>
                            </div>
                        </div>
                        <!-- 流水线信息 -->
                        <div class="p-3 border-b border-gray-200">
                            <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-2">流水线信息</div>
                            <div class="text-[11px] text-dim leading-relaxed" id="pl-pipeline-info">等待配置...</div>
                        </div>
                        <!-- 操作日志 -->
                        <div class="flex-1 p-3 min-h-0">
                            <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-2">操作日志</div>
                            <div class="overflow-y-auto text-[10px] font-mono leading-relaxed space-y-0.5" id="pl-log" style="max-height:calc(100vh - 340px);"></div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- 右下角全局悬浮胶囊 -->
            <div id="fb-pipeline-mini" class="absolute bottom-14 right-4 z-50 bg-gradient-to-r from-red-600 to-orange-500 rounded-full shadow-lg shadow-red-500/30 px-5 py-2.5 flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform" onclick="Modules.fusion_book._pipelineRunning ? Modules.fusion_book.plRestore() : (Modules.fusion_book._savedPipelineState ? Modules.fusion_book._resumeFromSaved() : Modules.fusion_book.showPipelineConfig())">
                <span class="text-gray-800 text-sm font-bold"><i class="fa-solid fa-rocket mr-1.5"></i><span id="pl-mini-status">${FB._savedPipelineState ? '继续上次流水线 (' + (FB._savedPipelineState.completedPairs||[]).length + '章已完成)' : '一键自动拆书链'}</span></span>
                ${FB._pipelineRunning ? '<span class="text-gray-800/70 text-xs animate-pulse">●</span>' : ''}
            </div>

            <!-- ===== 流水线配置弹窗 ===== -->
            <div id="fb-pipeline-config" class="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" style="display:none;" onclick="if(event.target===this)this.style.display='none'">
                <div class="w-[680px] max-h-[80vh] bg-white border border-gray-300 rounded-2xl shadow-2xl overflow-hidden flex flex-col" onclick="event.stopPropagation()">
                    <div class="px-5 py-3 bg-[#F1F3F5] border-b border-gray-200 flex items-center justify-between">
                        <span class="text-base font-bold text-green-400"><i class="fa-solid fa-rocket mr-2"></i>一键自动拆书链 · 配置</span>
                        <button class="text-dim hover:text-gray-800" onclick="document.getElementById('fb-pipeline-config').style.display='none'"><i class="fa-solid fa-xmark"></i></button>
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
                                <div id="plc-left-chapters" class="max-h-[200px] overflow-y-auto space-y-0.5 bg-gray-100 rounded-lg p-2 border border-gray-200"></div>
                            </div>
                            <div class="flex-1">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-xs font-bold text-pink-400">B 右书章节</span>
                                    <div class="flex gap-1">
                                        <button class="text-[10px] text-pink-400 hover:underline" onclick="Modules.fusion_book._plConfigSelectAll('right',true)">全选</button>
                                        <button class="text-[10px] text-dim hover:underline" onclick="Modules.fusion_book._plConfigSelectAll('right',false)">全不选</button>
                                    </div>
                                </div>
                                <div id="plc-right-chapters" class="max-h-[200px] overflow-y-auto space-y-0.5 bg-gray-100 rounded-lg p-2 border border-gray-200"></div>
                            </div>
                        </div>
                        <!-- 流水线选项 -->
                        <div class="bg-gray-100 rounded-lg p-4 border border-gray-200 space-y-3">
                            <div class="text-xs font-bold text-gray-800 mb-2">流水线选项</div>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="plc-do-extract" checked class="accent-green-500"><span class="text-xs text-gray-600">🌍 提取知识图谱 → 世界引擎 + 向量数据库(RAG)</span></label>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="plc-do-outline" checked class="accent-green-500"><span class="text-xs text-gray-600">📋 生成细纲 → 凤凰创作流 + 长篇执笔(旗舰)大纲</span></label>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="plc-do-write" checked class="accent-green-500"><span class="text-xs text-gray-600">✍️ 写正文 → 长篇执笔(旗舰)正文 + RAG存储</span></label>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="plc-do-rag" checked class="accent-green-500"><span class="text-xs text-gray-600">🔍 拆解结果存入RAG向量数据库</span></label>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="plc-do-local" ${FB._plConfig.saveFolder ? 'checked' : ''} class="accent-green-500"><span class="text-xs text-gray-600">💾 保存到本地文件夹</span>
                                ${FB._plConfig.saveFolder ? '<span class="text-[10px] text-green-400 ml-2">(' + FB._plConfig.saveFolder.split('/').pop().split('\\\\').pop() + ')</span>' : ''}
                            </label>
                        </div>
                        <!-- 循环拆解模式 -->
                        <div class="bg-cyan-900/10 rounded-lg p-4 border border-cyan-500/20 space-y-3">
                            <div class="text-xs font-bold text-cyan-400 mb-2"><i class="fa-solid fa-sync mr-1"></i>循环拆解模式</div>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="plc-cycle-mode" ${FB._plConfig.cycleMode ? 'checked' : ''} class="accent-cyan-500"><span class="text-xs text-gray-600">启用循环拆解 (以N章为一个小循环进行融合)</span></label>
                            <div class="flex items-center gap-2">
                                <span class="text-[10px] text-dim">每</span>
                                <select id="plc-cycle-size" class="bg-gray-100 border border-gray-300 rounded px-2 py-1 text-[10px] text-gray-800">
                                    <option value="3" ${FB._plConfig.cycleSize === 3 ? 'selected' : ''}>3</option>
                                    <option value="5" ${FB._plConfig.cycleSize === 5 ? 'selected' : ''}>5</option>
                                    <option value="8" ${FB._plConfig.cycleSize === 8 ? 'selected' : ''}>8</option>
                                    <option value="10" ${FB._plConfig.cycleSize === 10 ? 'selected' : ''}>10</option>
                                </select>
                                <span class="text-[10px] text-dim">章为一个循环，进行深度融合总结</span>
                            </div>
                        </div>
                    </div>
                    <div class="px-5 py-3 bg-[#F1F3F5] border-t border-gray-200 flex items-center justify-between">
                        <span class="text-[10px] text-dim" id="plc-summary">选择章节后开始</span>
                        <div class="flex gap-2">
                            <button class="btn btn-sm bg-gray-100 text-dim" onclick="document.getElementById('fb-pipeline-config').style.display='none'">取消</button>
                            <button class="btn btn-sm bg-gradient-to-r from-red-600 to-orange-500 text-gray-800 font-bold shadow-lg" onclick="Modules.fusion_book.startConfiguredPipeline()"><i class="fa-solid fa-rocket mr-1"></i>开始执行</button>
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
            <div class="flex items-center gap-2 px-3 py-1.5 text-[11px] cursor-pointer transition-all border-l-2 ${curIdx === i ? 'bg-' + color + '-500/10 text-gray-800 border-' + color + '-400 font-bold' : 'text-dim hover:bg-gray-100 border-transparent hover:text-gray-800'}" onclick="Modules.fusion_book.clickChapter('${side}',${i})">
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
        if (preview) preview.innerHTML = `<div class="text-xs text-gray-800 font-bold mb-2">${ch.title}</div><div class="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">${(ch.content || '').slice(0, 3000)}${(ch.content || '').length > 3000 ? '\n\n...(已截断)' : ''}</div>`;
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
        const defaultRegex = '第[一二三四五六七八九十百千\\d]+章[\\s\\S]*?(?=\\n)';
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
        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                if (plOut) plOut.textContent = result;
            });
        } catch(e) { UI.toast('分析出错: ' + e.message); }

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

        let prompt = await Modules.short.getPrompt('fusion_compare_analysis');
        if (!prompt) prompt = this._PROMPTS.compare;
        prompt = prompt.replace('{{left}}', this.left.analysis.slice(0, 4000)).replace('{{right}}', this.right.analysis.slice(0, 4000));

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
        } catch(e) { UI.toast('对比出错: ' + e.message); }

        this._pipelineResults.compare = result;
        this._allPipelineResults.compare = (this._allPipelineResults.compare || '') + '\n\n---\n\n' + result;
        this._setGenerating(false);
        if (status) status.textContent = '对比分析完成';
    },

    async fusionMerge() {
        if (!this._pipelineResults.compare && !this.left.analysis && !this.right.analysis) return UI.toast('请先完成分析或对比');
        if (this._generating) return;

        let prompt = await Modules.short.getPrompt('fusion_merge');
        if (!prompt) prompt = this._PROMPTS.fusion;
        prompt = prompt.replace('{{left}}', (this.left.analysis || '').slice(0, 3000))
            .replace('{{right}}', (this.right.analysis || '').slice(0, 3000))
            .replace('{{compare}}', (this._pipelineResults.compare || '').slice(0, 3000));

        // 流水线模式下注入前章上下文
        const acc = this._accContext || {};
        if (acc.outlines) prompt += `\n\n【前章细纲参考（保持连贯性）】\n${acc.outlines.slice(-2000)}`;
        if (acc.entities) prompt += `\n\n【已提取实体（保持一致性）】\n${acc.entities.slice(-1500)}`;

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
        } catch(e) { UI.toast('融合出错: ' + e.message); }

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

    plStop() {
        this._pipelinePaused = true;
        this._pipelineRunning = false;
        AI.abort(); // 中止正在进行的AI调用
        this._setGenerating(false);
        this._plLog('⏹ 用户停止', 'err');
        UI.toast('已停止，进度已保存');
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
                <label class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer">
                    <input type="checkbox" class="plc-ch-${side} accent-green-500" data-idx="${i}" checked>
                    <span class="text-[11px] text-gray-600">${i + 1}. ${ch.title}</span>
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
        // 检查是否已提取文风
        const extractedStyle = await this._checkExtractedStyle();
        if (!extractedStyle) {
            // 显示提醒弹窗
            const confirmResult = confirm('⚠️ 尚未选择文风\n\n建议先前往「长篇执笔(旗舰)」→「规则」→「文风库」提取并选择参考文章的文风。\n\n是否仍要继续执行拆书？（不选择文风可能导致写作风格不一致）');
            if (!confirmResult) {
                // 用户选择取消，跳转到文风提取
                App.nav('writer');
                setTimeout(() => {
                    Modules.writer.switchTab('rules');
                    UI.toast('请先从文风库中选择文风，然后再执行拆书');
                }, 500);
                return;
            }
        }

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

    // 检查是否已选择文风（从文风库）
    async _checkExtractedStyle() {
        try {
            // 从 writer 模块获取当前激活的文风
            const activeStyle = await DB.get('settings', 'writer_active_style');
            return activeStyle && activeStyle.style && activeStyle.style.trim().length > 50;
        } catch(e) {
            return false;
        }
    },

    async _runConfiguredPipeline(isResume = false) {
        if (this._generating && !isResume) return UI.toast('正在运行中');
        // ★ 预检查API是否可用
        const apiCheck = await AI.getActiveConfig('text');
        if (!apiCheck) return UI.toast('⚠️ 未配置API流量池，请先在「系统设置」→「API流量池」中添加API密钥', 'error');
        const leftBook = (this._books || []).find(b => b.id === this.left.bookId);
        const rightBook = (this._books || []).find(b => b.id === this.right.bookId);
        if (!leftBook || !rightBook) return UI.toast('请先选择左右两本书');

        const cfg = this._plConfig;
        const pairs = [];
        const maxLen = Math.min(cfg.leftChapters.length, cfg.rightChapters.length);
        for (let i = 0; i < maxLen; i++) {
            pairs.push({ leftIdx: cfg.leftChapters[i], rightIdx: cfg.rightChapters[i] });
        }
        if (pairs.length === 0) return UI.toast('没有可配对的章节');

        // 断点续跑：加载已完成的章节和累积上下文
        let completedPairs = [];
        let accOutlines = '';   // 累积细纲（传递给后续章节）
        let accEntities = '';   // 累积实体（传递给后续章节）
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

        const infoEl = document.getElementById('pl-pipeline-info');
        if (infoEl) {
            const opts = [];
            if (cfg.doExtract) opts.push('知识图谱');
            if (cfg.doOutline) opts.push('细纲→凤凰+执笔');
            if (cfg.doWrite) opts.push('正文→执笔');
            if (cfg.doRAG) opts.push('RAG');
            const doneCount = completedPairs.length;
            infoEl.innerHTML = `左书: 《${leftBook.name}》 | 右书: 《${rightBook.name}》<br>` +
                `已选章节: ${pairs.length} 对${doneCount > 0 ? ' (已完成' + doneCount + '对)' : ''}<br>` +
                `启用: ${opts.join(' | ')}`;
        }

        this._plLog(`🚀 流水线${isResume ? '恢复' : '启动'}: ${pairs.length} 对章节${completedPairs.length > 0 ? '，跳过已完成' + completedPairs.length + '对' : ''}`, 'ok');

        for (let pIdx = 0; pIdx < pairs.length; pIdx++) {
            if (this._pipelinePaused) {
                // 保存断点状态
                await DB.put('settings', {
                    id: 'pipeline_state',
                    completedPairs, accOutlines, accEntities, allOutlines, allWritings,
                    allPipelineResults: this._allPipelineResults,
                    config: { leftBookId: this.left.bookId, rightBookId: this.right.bookId, ...cfg },
                    pausedAt: Date.now()
                });
                this._savedPipelineState = await DB.get('settings', 'pipeline_state');
                this._plLog(`流水线已暂停 (${pIdx}/${pairs.length})，进度已保存`, 'info');
                break;
            }

            const { leftIdx, rightIdx } = pairs[pIdx];
            const pairKey = `${leftIdx}_${rightIdx}`;

            // 跳过已完成的章节对
            if (completedPairs.includes(pairKey)) {
                this._plLog(`[${pIdx + 1}/${pairs.length}] ⏭ 跳过已完成: 第${leftIdx+1}章`, 'info');
                continue;
            }

            const lCh = leftBook.chapters[leftIdx];
            const rCh = rightBook.chapters[rightIdx];
            if (!lCh || !rCh) continue;

            this._plLog(`[${pIdx + 1}/${pairs.length}] 🔵 左 '第${leftIdx+1}章 ${lCh.title}' vs 右 '第${rightIdx+1}章 ${rCh.title}'`, 'info');

            const titleEl = document.getElementById('pl-current-title');
            if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1 text-amber-400"></i>[${pIdx + 1}/${pairs.length}] ${lCh.title} vs ${rCh.title}`;
            const stepLabel = document.getElementById('pl-step-label');
            if (stepLabel) stepLabel.textContent = `${pIdx + 1}/${pairs.length} 处理中`;
            const miniStatus = document.getElementById('pl-mini-status');

            // 重置本轮结果
            this._pipelineResults = { left: '', right: '', compare: '', fusion: '', world: '', outline: '', write: '' };
            ['left','right','compare','fusion','outline','world','write'].forEach(k => this._plSetStep(k, 'pending', ''));
            this.left.chapterIdx = leftIdx;
            this.right.chapterIdx = rightIdx;

            // ★ 从IndexedDB读取完整的实体+世界观，构建知识图谱上下文
            let knowledgeCtx = '';
            try {
                const allEntities = await DB.getAll('entities') || [];
                const entities = allEntities.filter(e => !e.id.startsWith('world_'));
                const worlds = allEntities.filter(e => e.id.startsWith('world_') && e.desc);
                
                if (entities.length) {
                    // 按类型分组
                    const grouped = {};
                    entities.forEach(e => {
                        const t = e.type || '其他';
                        if (!grouped[t]) grouped[t] = [];
                        grouped[t].push(e);
                    });
                    knowledgeCtx += '【知识图谱 - 已有实体】\n';
                    for (const [type, ents] of Object.entries(grouped)) {
                        knowledgeCtx += `[${type}] `;
                        knowledgeCtx += ents.map(e => {
                            let s = e.name;
                            if (e.desc) s += ': ' + e.desc.slice(0, 80);
                            if (e.relations && e.relations.length) s += ' (' + e.relations.slice(0, 5).join(', ') + ')';
                            return s;
                        }).join(' | ') + '\n';
                    }
                }
                if (worlds.length) {
                    knowledgeCtx += '\n【知识图谱 - 世界观设定】\n';
                    worlds.forEach(w => {
                        knowledgeCtx += `[${w.name}] ${(w.desc || '').slice(0, 200)}\n`;
                    });
                }
            } catch(e) { console.warn('读取知识图谱失败:', e); }

            // 将累积上下文 + 知识图谱注入当前轮
            this._accContext = { 
                outlines: accOutlines, 
                entities: accEntities, 
                knowledgeGraph: knowledgeCtx,
                chapterNum: pIdx + 1 
            };

            // ★ 构建步骤 (实体提取在细纲之前，确保细纲能用到最新实体)
            const stepNums = ['①','②','③','④','⑤','⑥','⑦'];
            const steps = [
                { key: 'left', label: '拆解左书', fn: () => this._analyzeSide('left') },
                { key: 'right', label: '拆解右书', fn: () => this._analyzeSide('right') },
                { key: 'compare', label: '对比分析', fn: () => this.compareAnalysis() },
                { key: 'fusion', label: '融合精华', fn: () => this.fusionMerge() },
            ];
            if (cfg.doOutline) steps.push({ key: 'outline', label: '细纲生成', fn: () => this._pipelineSaveOutline() });
            if (cfg.doExtract) steps.push({ key: 'world', label: '实体提取', fn: () => this._pipelineExtractEntities() });
            if (cfg.doWrite) steps.push({ key: 'write', label: '正文创作', fn: () => this._pipelineWrite() });

            let chapterAborted = false;
            for (let i = 0; i < steps.length; i++) {
                if (this._pipelinePaused) { chapterAborted = true; break; }
                const step = steps[i];
                this._plSetStep(step.key, 'active', step.label + '...');
                if (miniStatus) miniStatus.textContent = `${stepNums[i]} ${step.label} · 第${leftIdx+1}章 ${lCh.title} vs ${rCh.title}  ${pIdx+1}/${pairs.length}`;

                try {
                    await step.fn();
                    if (this._pipelinePaused) { chapterAborted = true; break; }
                    const len = (this._pipelineResults[step.key] || '').length;
                    this._plSetStep(step.key, 'done', len > 0 ? len + '字' : '✓');
                    this._plLog(`[${pIdx+1}/${pairs.length}] 🟢 ${stepNums[i]} ${step.label}完成` + (len > 0 ? ` (${len}字)` : ''), 'ok');
                    
                    // ★ 实体提取完成后，刷新知识图谱上下文供后续细纲/正文使用
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
                    if (e.message === '已中止') { chapterAborted = true; break; }
                    this._plSetStep(step.key, 'error', '失败');
                    this._plLog(`[${pIdx+1}/${pairs.length}] 🔴 ${stepNums[i]} ${step.label}: ${e.message}`, 'err');
                }
            }

            if (chapterAborted) {
                // 保存断点
                await DB.put('settings', {
                    id: 'pipeline_state',
                    completedPairs, accOutlines, accEntities, allOutlines, allWritings,
                    allPipelineResults: this._allPipelineResults,
                    config: { leftBookId: this.left.bookId, rightBookId: this.right.bookId, ...cfg },
                    pausedAt: Date.now()
                });
                this._savedPipelineState = await DB.get('settings', 'pipeline_state');
                this._plLog(`流水线已暂停 (${pIdx}/${pairs.length})，进度已保存`, 'info');
                break;
            }

            // 本章完成 — 累积上下文传递给下一章
            if (this._pipelineResults.outline) {
                accOutlines += `\n\n### 第${leftIdx+1}章细纲\n${this._pipelineResults.outline.slice(0, 2000)}`;
            }
            if (this._pipelineResults.world) {
                accEntities += `\n\n### 第${leftIdx+1}章实体\n${this._pipelineResults.world.slice(0, 1500)}`;
            }

            // 记录章节时间戳
            const now = Date.now();
            if (!this._chapterTimestamps) this._chapterTimestamps = {};
            this._chapterTimestamps[`${leftBook.id}_left_${leftIdx}`] = now;
            this._chapterTimestamps[`${rightBook.id}_right_${rightIdx}`] = now;
            await DB.put('settings', { id: 'pipeline_chapter_timestamps', data: this._chapterTimestamps });
            // 刷新章节列表显示时间
            this._renderChapterList('left');
            this._renderChapterList('right');

            // 标记本对完成
            completedPairs.push(pairKey);

            // 循环拆解模式：每N章进行一次深度融合总结
            if (cfg.cycleMode && (pIdx + 1) % cfg.cycleSize === 0 && pIdx + 1 < pairs.length) {
                const cyclePairs = pairs.slice(pIdx - cfg.cycleSize + 1, pIdx + 1);
                this._plLog(`\n🔄 完成第${Math.floor((pIdx + 1) / cfg.cycleSize)}个循环，执行循环深度融合...`, 'info');
                await this._cycleFusionSummary(cyclePairs, cfg.cycleSize, leftBook, rightBook);
            }

            // 拆解结果汇总存RAG
            if (cfg.doRAG) {
                const analysisText = (this._pipelineResults.left || '') + '\n' + (this._pipelineResults.right || '') + '\n' + (this._pipelineResults.compare || '') + '\n' + (this._pipelineResults.fusion || '');
                if (analysisText.trim() && typeof RAGSystem !== 'undefined') {
                    await RAGSystem.addDocument(`拆解汇总_${lCh.title}_vs_${rCh.title}`, analysisText.slice(0, 8000), 'pipeline');
                    this._plLog(`[${pIdx+1}/${pairs.length}] 📦 拆解汇总已存入RAG`, 'entity');
                }
            }

            // 累积细纲/正文
            if (cfg.doOutline && this._pipelineResults.outline) {
                allOutlines += `## 第${leftIdx + 1}章\n\n${this._pipelineResults.outline}\n\n---\n\n`;
            }
            if (cfg.doWrite && this._pipelineResults.write) {
                allWritings += `## 第${leftIdx + 1}章\n\n${this._pipelineResults.write}\n\n---\n\n`;
            }

            // 保存到本地文件夹（带时间戳）
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

            // 每章完成后保存进度到DB（防止意外中断丢失）
            await DB.put('settings', {
                id: 'pipeline_state',
                completedPairs, accOutlines, accEntities, allOutlines, allWritings,
                allPipelineResults: this._allPipelineResults,
                config: { leftBookId: this.left.bookId, rightBookId: this.right.bookId, ...cfg },
                pausedAt: Date.now()
            });
        }

        // 流水线结束处理
        if (!this._pipelinePaused) {
            this._pipelineRunning = false;
            const pauseBtn = document.getElementById('pl-pause-btn');
            const stopBtn = document.getElementById('pl-stop-btn');
            if (pauseBtn) pauseBtn.style.display = 'none';
            if (stopBtn) stopBtn.style.display = 'none';

            // 清除保存的进度
            await DB.del('settings', 'pipeline_state');
            this._savedPipelineState = null;

            // 循环拆解模式：处理最后一个循环的总结
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

            // 将累积结果设为当前结果
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
                state === 'error' ? 'bg-red-400' : 'bg-gray-300'
            );
        }
        if (row) {
            row.className = 'flex items-center gap-1.5 px-2.5 py-2 rounded-lg border cursor-pointer transition-all ' + (
                row.classList.contains('col-span-2') ? 'col-span-2 ' : ''
            ) + (
                state === 'active' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                state === 'done' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                state === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/[0.02] border-gray-200 hover:bg-gray-100'
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
        log.innerHTML += `<div class="flex gap-2"><span class="text-gray-800/30 shrink-0">${time}</span><span class="${color}">${msg}</span></div>`;
        log.scrollTop = log.scrollHeight;
    },

    // ---- 流水线子步骤 ----
    async _pipelineExtractEntities() {
        const fusion = this._pipelineResults.fusion;
        const leftAnalysis = this.left.analysis || '';
        const rightAnalysis = this.right.analysis || '';
        if (!fusion && !leftAnalysis && !rightAnalysis) return;

        const sourceText = (fusion + '\n' + leftAnalysis + '\n' + rightAnalysis).slice(0, 6000);

        // 获取已有实体名称，让AI建立关联
        const existingEntities = await DB.getAll('entities') || [];
        const existingNames = existingEntities.filter(e => !e.id.startsWith('world_')).map(e => e.name);
        const existingHint = existingNames.length ? `\n\n【已有实体(请在relations中引用这些名称建立关联)】\n${existingNames.slice(0,50).join('、')}` : '';

        const outEl = document.getElementById('pl-output');
        if (outEl) outEl.textContent = '正在提取世界引擎实体...';
        this._setGenerating(true);

        let raw = '';
        try {
            await AI.generate(
                `你是深度实体提取引擎。从以下写作分析中提取所有实体和世界观元素。
${existingHint}

【提取类型】
- 人物：所有角色（主角、配角、反派），含性格、身份
- 物品：道具、武器、法宝、关键物件
- 地点：地名、场景、建筑、地标
- 情节：关键事件、转折点、冲突
- 伏笔：暗示、线索、未解之谜
- 势力：门派、组织、国家、阵营、家族
- 种族：种族设定、族群特征
- 魔法：功法、技能、法术、科技体系、修炼等级
- 规则：世界法则、力量体系、禁忌
- 文化：风俗、社会制度、信仰
- 历史：历史事件、传说、纪元
- 技法：可复用的写作套路、节奏模型、爽点公式

【输出格式】JSON数组：
[{"name":"名称","type":"人物/物品/地点/情节/伏笔/势力/种族/魔法/规则/文化/历史/技法","description":"详细描述50-200字","relations":["关系类型:关联实体名"]}]

【关键要求 - 关系网络】
- 每个实体的relations必须尽可能多地引用其他实体名称
- 关系格式："关系类型:实体名"，例如 "师父:张三","敌对:魔教","位于:青云山","拥有:轩辕剑"
- 人物之间要有师徒/敌友/从属关系
- 人物与地点要有"位于"/"出没"关系
- 人物与物品要有"拥有"/"使用"关系
- 人物与势力要有"所属"/"统治"关系
- 情节与人物要有"参与"关系
- 这些关系是构建知识网络图的关键，不要遗漏！
- 尽可能多提取，不要遗漏。
- 直接输出纯JSON数组，禁止使用markdown代码块(\`\`\`json)包裹，禁止输出任何非JSON文本。

${sourceText}`,
                {}, c => {
                    raw += c;
                    if (outEl) outEl.textContent = raw;
                }
            );
        } catch(e) {
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

        // 存入世界引擎 + 向量库
        let count = 0;
        const now = Date.now();
        for (const ent of entities) {
            if (!ent || !ent.name) continue;
            const typeMap = { technique:'技法', character_template:'人物', conflict_model:'情节', rhythm:'技法', hook:'技法' };
            const type = typeMap[ent.type] || ent.type || '技法';
            // ★ 确保relations是字符串数组
            let relations = ent.relations || [];
            if(!Array.isArray(relations)) relations = [];
            relations = relations.map(r => typeof r === 'string' ? r : String(r)).filter(Boolean);

            const id = Utils.uuid();
            await DB.put('entities', {
                id, name: ent.name, type: type,
                desc: ent.description || ent.desc || '',
                relations: relations,
                tags: ent.tags || ['融合', '流水线'],
                source: 'pipeline',
                updatedAt: now
            });
            const vectorContent = `[${type}] ${ent.name}: ${ent.description || ent.desc || ''}`;
            await DB.put('vectors', { id, content: vectorContent, vector: Array.from({length:1536}, ()=>Math.random()), timestamp: now });
            count++;
            this._plLog(`  → ${type}: ${ent.name}${relations.length ? ' (关联'+relations.length+'个)' : ''}`, 'entity');
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
            prompt = `你是一位资深网文编辑。基于以下融合技法分析，生成第${chNum}章的详细细纲。

【融合技法】
${fusion.slice(0, 4000)}

【对比分析】
${(this._pipelineResults.compare || '').slice(0, 2000)}
${knowledgeGraph ? `\n${knowledgeGraph.slice(0, 3000)}` : ''}
${prevOutlines ? `\n【前章细纲参考（保持连贯性）】\n${prevOutlines}` : ''}

【核心要求】
- 所有人物性格、身份、关系必须与知识图谱中的实体保持一致
- 伏笔和线索要与前章呼应，新伏笔要标注
- 世界观设定（魔法体系、势力关系、地理等）必须严格遵循已有设定
- 新出现的人物/物品/地点要标注，方便后续提取到知识图谱

请生成本章细纲，包含：
1. 章节标题
2. 核心事件（100字内）
3. 运用的融合技法（标注来源：${lName}/${rName}）
4. 情绪节奏（起/承/转/合）
5. 爽点/钩子设计
${prevOutlines ? '6. 与前章的衔接和递进关系' : ''}

格式清晰，可直接用于写作。`;
        } else {
            prompt = prompt.replace('{{fusion}}', fusion.slice(0, 4000))
                .replace('{{compare}}', (this._pipelineResults.compare || '').slice(0, 2000))
                .replace('{{left_name}}', lName).replace('{{right_name}}', rName);
            if (knowledgeGraph) prompt += `\n\n${knowledgeGraph.slice(0, 3000)}`;
            if (prevOutlines) prompt += `\n\n【前章细纲参考】\n${prevOutlines}`;
        }

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
        prompt = prompt.replace('{{fusion}}', fusion.slice(0, 4000))
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
        } catch(e) { UI.toast('写正文出错: ' + e.message); }

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
        // 存入凤凰创作的素材
        if (typeof Modules.phoenix !== 'undefined' && Modules.phoenix._fusionRef !== undefined) {
            Modules.phoenix._fusionRef = content;
        }
        MemorySystem.addWorking('[融合技法→风格流] ' + content.slice(0, 300), 'fusion_ref', 5);
        App.nav('phoenix');
        UI.toast('已跳转到凤凰创作，融合技法已注入');
    },

    sendToWriter() {
        const content = this._pipelineResults.fusion || this._pipelineResults.write || '';
        if (!content) return UI.toast('请先完成融合');
        MemorySystem.addWorking('[融合技法→执笔台] ' + content.slice(0, 300), 'fusion_ref', 5);
        App.nav('writer');
        UI.toast('已跳转到执笔台，融合技法已注入工作记忆');
    },

    async _cycleFusionSummary(cyclePairs, cycleSize, leftBook, rightBook) {
        const cycleNum = Math.ceil(cyclePairs.length / cycleSize);
        const startIdx = cyclePairs[0].leftIdx + 1;
        const endIdx = cyclePairs[cyclePairs.length - 1].leftIdx + 1;

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

        const cycleFusionPrompt = `你是顶级网文技法融合大师。请对以下${cycleSize}章的写作技法进行深度循环融合总结。

【左书${cycleSize}章分析】
${leftCycleAnalyses.slice(0, 6000)}

【右书${cycleSize}章分析】
${rightCycleAnalyses.slice(0, 6000)}

【本循环细纲参考】
${cycleOutlines.slice(0, 2000)}
${entityContext}
${prevCycleSummary}

请输出：
1. 【循环核心技法模板】提炼出可以直接套用的写作公式（含开篇钩子、节奏控制、爽点设计）
2. 【节奏曲线分析】这${cycleSize}章的节奏变化规律，标注高潮点和过渡点
3. 【爽点矩阵】爽点类型、密度、释放节奏，以及情绪价值曲线
4. 【悬念链条】伏笔和钩子的衔接设计，跨章节的信息差运用
5. 【实体关联网络】本循环涉及的关键实体及其关系变化
6. 【下一循环优化建议】针对下${cycleSize}章的技法提升建议和注意事项
7. 【可复用套路清单】3-5个可直接套用的写作模板

只输出技法总结，不要涉及具体角色和情节。保持与前循环的连贯性。`;

        this._plSetStep('fusion', 'active', '循环深度融合中...');
        let result = '';
        try {
            await AI.generate(cycleFusionPrompt, {}, c => {
                result += c;
                const outEl = document.getElementById('pl-output');
                if (outEl) outEl.textContent = result;
            });
        } catch (e) {
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
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-gray-300 backdrop-blur-sm';
        modal.onclick = (e) => { if(e.target === modal) modal.remove(); };
        
        modal.innerHTML = `
            <div class="bg-white rounded-2xl border border-gray-300 w-[700px] max-h-[80vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex center text-gray-800">
                            <i class="fa-solid fa-check-double text-lg"></i>
                        </div>
                        <div>
                            <div class="font-bold text-gray-800 text-base">一致性检查报告</div>
                            <div class="text-[10px] text-dim">主拆书: ${FB._primarySettings.bookName || primary.name}</div>
                        </div>
                    </div>
                    <button class="btn btn-sm bg-gray-100 text-dim hover:text-gray-800" onclick="this.closest('#fb-consistency-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto p-5" id="fb-consistency-content">
                    <div class="text-center text-dim py-8">
                        <i class="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
                        <p>正在分析一致性...</p>
                    </div>
                </div>
                <div class="px-6 py-3 border-t border-gray-200 shrink-0 flex gap-2">
                    <button class="btn btn-sm bg-cyan-600/20 text-cyan-400 border-cyan-600/30 flex-1" onclick="Modules.fusion_book._fixConsistencyIssues()">
                        <i class="fa-solid fa-wrench mr-1"></i>自动修复
                    </button>
                    <button class="btn btn-sm bg-gray-100 text-dim flex-1" onclick="this.closest('#fb-consistency-modal').remove()">关闭</button>
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
                    <div class="text-[11px] font-bold text-gray-800 mb-1">${issue.title}</div>
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
                    <div class="text-[11px] font-bold text-gray-800 mb-1">${sug.title}</div>
                    <div class="text-[10px] text-dim">${sug.desc}</div>
                </div>`;
            });
            html += '</div></div>';
        }
        
        html += `<div class="mt-4 p-3 rounded-lg border border-gray-200 bg-white/[0.02]">
            <div class="text-[10px] text-dim font-bold uppercase mb-2">主拆书基准信息</div>
            <div class="grid grid-cols-2 gap-2 text-[10px]">
                <div><span class="text-dim">书名:</span> <span class="text-gray-800">${primary.name}</span></div>
                <div><span class="text-dim">章节数:</span> <span class="text-gray-800">${primary.chapters?.length || 0}</span></div>
                <div><span class="text-dim">总字数:</span> <span class="text-gray-800">${(primaryChars/10000).toFixed(1)}万</span></div>
                <div><span class="text-dim">设定时间:</span> <span class="text-gray-800">${FB._primarySettings?.setAt ? new Date(FB._primarySettings.setAt).toLocaleString('zh-CN') : '-'}</span></div>
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
    }
};

