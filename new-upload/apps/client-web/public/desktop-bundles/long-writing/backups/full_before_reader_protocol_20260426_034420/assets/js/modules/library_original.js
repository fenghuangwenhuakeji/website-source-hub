// ============================================
// 阅读中心 (reader_center) - 终极强化版
// 融合: 沉浸阅读 + 智能排版 + MD渲染器
// 核心增强: 三层记忆集成 + RAG深度检索 + 世界引擎联动 + 凤凰创作流
// 新增: 智能章节识别 + 实体自动提取 + 知识图谱关联 + 阅读洞察 + 素材一键创作
// ============================================
Modules.reader_center = {
    currentTab: 'library',
    currentBook: null,
    currentTheme: 'dark',
    currentSize: 18,
    sidebarOpen: true,
    customTools: [],
    bookmarks: [],
    annotations: [],
    readingProgress: {},
    shelfFilter: 'all',
    shelfSort: 'date',
    typesetSettings: { font: "'Songti SC', serif", size: 16, lineHeight: 1.8, indent: '2em', margin: 25, columns: 1, align: 'justify', theme: 'light' },
    typesetZoom: 0.85,
    chapters: [],
    currentChapter: 0,
    bookEntities: [],
    readingStats: { totalWords: 0, totalChapters: 0, avgChapterLen: 0, readingTime: 0, entities: 0, relations: 0 },
    aiContext: { enabled: true, autoExtract: true, linkToWorld: true, smartSuggest: true },
    _extractedEntities: [],
    _chapterCache: {},
    _nexusPanelOpen: true,
    _currentCycleId: null,
    _selectionPopupTimer: null,

    render: () => {
        const RC = Modules.reader_center;
        return `
        <div class="flex h-full bg-[#09090b] text-[#e4e4e7] overflow-hidden">
            <!-- 左侧导航 -->
            <div class="w-72 shrink-0 bg-[#111113] border-r border-white/5 flex flex-col z-20" id="rc-sidebar">
                <div class="p-4 border-b border-white/5 flex items-center gap-3 bg-gradient-to-r from-amber-900/20 to-transparent">
                    <div class="w-8 h-8 rounded-lg bg-amber-600/20 flex center border border-amber-600/40 text-amber-500"><i class="fa-solid fa-book-open"></i></div>
                    <div>
                        <h2 class="text-sm font-bold text-white">阅读中心</h2>
                        <p class="text-[9px] text-dim">书架 · 排版 · Markdown</p>
                    </div>
                </div>
                <div class="flex border-b border-white/5">
                    ${[['library','书架','fa-book'],['typeset','排版','fa-text-height'],['markdown','MD','fa-brands fa-markdown']].map(([k,v,i]) => `
                        <button class="flex-1 py-2.5 text-[10px] font-bold transition-all ${RC.currentTab===k ? 'text-amber-500 border-b-2 border-amber-500' : 'text-dim hover:text-white'}" onclick="Modules.reader_center.switchTab('${k}')">
                            <i class="${i} mr-1"></i>${v}
                        </button>
                    `).join('')}
                </div>
                <div class="flex-1 overflow-y-auto" id="rc-tab-sidebar">
                    ${RC._renderSidebarContent()}
                </div>
            </div>
            <!-- 中间主区域 -->
            <div class="flex-1 relative flex flex-col h-full overflow-hidden bg-[#09090b]" id="rc-main">
                ${RC._renderMainContent()}
            </div>
            <!-- 右侧AI面板 (仅书架模式) -->
            ${RC.currentTab === 'library' ? RC._renderAIPanel() : ''}
        </div>`;
    },

    _renderSidebarContent: () => {
        const RC = Modules.reader_center;
        if (RC.currentTab === 'library') {
            return `
                <div class="p-3 space-y-2">
                    <button class="btn w-full h-9 rounded bg-amber-600/20 text-amber-500 border border-amber-600/50 hover:bg-amber-600 hover:text-white font-bold text-xs flex center gap-2" onclick="document.getElementById('rc-upload').click()">
                        <i class="fa-solid fa-plus"></i> 导入新书
                    </button>
                    <input type="file" id="rc-upload" class="hidden" accept=".txt,.md,.html" onchange="Modules.reader_center.handleUpload(this)">
                    <button class="btn w-full h-9 rounded bg-white/5 text-dim hover:text-white text-xs flex center gap-2" onclick="Modules.reader_center.importFromClipboard()">
                        <i class="fa-solid fa-paste"></i> 从剪贴板导入
                    </button>
                </div>
                <div class="px-3 py-1 space-y-0.5">
                    <div class="px-2 py-1 text-[9px] font-bold text-dim uppercase tracking-wider">分类筛选</div>
                    ${[['all','全部','fa-layer-group'],['recent','最近阅读','fa-clock-rotate-left'],['favorite','收藏','fa-star'],['generated','AI生成','fa-wand-magic-sparkles']].map(([k,v,i]) => `
                        <button class="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[10px] transition-all ${RC.shelfFilter===k ? 'bg-amber-500/10 text-amber-400 font-bold' : 'text-dim hover:bg-white/5 hover:text-white'}" onclick="Modules.reader_center.setFilter('${k}')">
                            <i class="fa-solid ${i} w-4 text-center opacity-60"></i><span>${v}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="px-3 py-1">
                    <div class="px-2 py-1 text-[9px] font-bold text-dim uppercase tracking-wider">排序</div>
                    <div class="flex gap-1 px-2">
                        ${[['date','时间'],['name','名称'],['size','大小']].map(([k,v]) => `
                            <button class="px-2 py-1 rounded text-[9px] ${RC.shelfSort===k ? 'bg-white/10 text-white font-bold' : 'text-dim hover:text-white'}" onclick="Modules.reader_center.setSort('${k}')">${v}</button>
                        `).join('')}
                    </div>
                </div>
                <div class="p-3 border-t border-white/5 mt-auto">
                    <div class="grid grid-cols-3 gap-2">
                        <div class="bg-white/5 rounded p-2 text-center border border-white/5">
                            <div class="text-sm font-bold text-white" id="rc-stat-count">0</div>
                            <div class="text-[8px] text-dim">藏书</div>
                        </div>
                        <div class="bg-white/5 rounded p-2 text-center border border-white/5">
                            <div class="text-sm font-bold text-amber-400" id="rc-stat-bookmarks">0</div>
                            <div class="text-[8px] text-dim">书签</div>
                        </div>
                        <div class="bg-white/5 rounded p-2 text-center border border-white/5">
                            <div class="text-sm font-bold text-green-400" id="rc-stat-notes">0</div>
                            <div class="text-[8px] text-dim">批注</div>
                        </div>
                    </div>
                </div>`;
        }
        if (RC.currentTab === 'typeset') {
            const s = RC.typesetSettings;
            return `
                <div class="p-3 flex flex-col gap-3 flex-1">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-white">智能排版</span>
                        <button class="btn btn-xs bg-yellow-600/20 text-yellow-500 border border-yellow-600/50 hover:bg-yellow-600 hover:text-black font-bold" onclick="Modules.reader_center.aiFormat()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>美化</button>
                    </div>
                    <div class="flex flex-col gap-2">
                        <span class="text-[9px] font-bold text-dim">字体</span>
                        <select class="epic-input h-8 rounded text-[10px] text-white px-2" onchange="Modules.reader_center.updateTypeset('font',this.value)">
                            <option value="'Songti SC', serif" ${s.font.includes('Songti')?'selected':''}>宋体</option>
                            <option value="'Kaiti SC', serif" ${s.font.includes('Kaiti')?'selected':''}>楷体</option>
                            <option value="'Heiti SC', sans-serif" ${s.font.includes('Heiti')?'selected':''}>黑体</option>
                            <option value="'Times New Roman', serif" ${s.font.includes('Times')?'selected':''}>Times</option>
                        </select>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div class="flex flex-col gap-1">
                            <span class="text-[9px] font-bold text-dim">字号</span>
                            <div class="flex items-center bg-black/50 rounded border border-white/10">
                                <button class="w-6 h-6 flex center hover:text-white text-dim" onclick="Modules.reader_center.adjustTypeset('size',-1)"><i class="fa-solid fa-minus text-[8px]"></i></button>
                                <input type="number" class="w-full bg-transparent border-none text-center text-[10px] text-white h-6" value="${s.size}" id="rc-ty-size" onchange="Modules.reader_center.updateTypeset('size',this.value)">
                                <button class="w-6 h-6 flex center hover:text-white text-dim" onclick="Modules.reader_center.adjustTypeset('size',1)"><i class="fa-solid fa-plus text-[8px]"></i></button>
                            </div>
                        </div>
                        <div class="flex flex-col gap-1">
                            <span class="text-[9px] font-bold text-dim">行距</span>
                            <div class="flex items-center bg-black/50 rounded border border-white/10">
                                <button class="w-6 h-6 flex center hover:text-white text-dim" onclick="Modules.reader_center.adjustTypeset('lineHeight',-0.1)"><i class="fa-solid fa-minus text-[8px]"></i></button>
                                <input type="number" class="w-full bg-transparent border-none text-center text-[10px] text-white h-6" value="${s.lineHeight}" step="0.1" id="rc-ty-lh" onchange="Modules.reader_center.updateTypeset('lineHeight',this.value)">
                                <button class="w-6 h-6 flex center hover:text-white text-dim" onclick="Modules.reader_center.adjustTypeset('lineHeight',0.1)"><i class="fa-solid fa-plus text-[8px]"></i></button>
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-[9px] font-bold text-dim">对齐</span>
                        <div class="flex bg-black/50 rounded border border-white/10 p-0.5">
                            ${['left','center','right','justify'].map(a => `<button class="flex-1 btn-xs hover:bg-white/10 text-dim hover:text-white" onclick="Modules.reader_center.updateTypeset('align','${a}')"><i class="fa-solid fa-align-${a}"></i></button>`).join('')}
                        </div>
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-[9px] font-bold text-dim">分栏</span>
                        <div class="flex bg-black/50 rounded border border-white/10 p-0.5">
                            ${[1,2,3].map(n => `<button class="flex-1 btn-xs hover:bg-white/10 text-dim hover:text-white" onclick="Modules.reader_center.updateTypeset('columns',${n})">${n}</button>`).join('')}
                        </div>
                    </div>
                    <div class="flex-1 flex flex-col gap-1 min-h-[100px]">
                        <span class="text-[9px] font-bold text-dim">文本内容</span>
                        <textarea id="rc-ty-in" class="flex-1 bg-black/40 border-white/10 rounded p-2 text-[10px] text-gray-300 resize-none focus:border-yellow-500 leading-relaxed" placeholder="粘贴需要排版的文本..." oninput="Modules.reader_center.renderTypesetPage()"></textarea>
                    </div>
                    <div class="flex gap-2">
                        <button class="btn flex-1 h-7 text-[10px] bg-white/5 hover:bg-white/10" onclick="window.print()"><i class="fa-solid fa-print mr-1"></i>打印</button>
                        <button class="btn flex-1 h-7 text-[10px] bg-yellow-600/20 text-yellow-400 border-yellow-600/50 hover:bg-yellow-600 hover:text-white" onclick="Modules.reader_center.exportToLibrary('typeset')"><i class="fa-solid fa-book mr-1"></i>存书架</button>
                    </div>
                </div>`;
        }
        if (RC.currentTab === 'markdown') {
            return `
                <div class="p-3 flex flex-col gap-2 h-full">
                    <span class="text-xs font-bold text-dim">Markdown 编辑器</span>
                    <div class="text-[10px] text-dim bg-white/5 p-2 rounded border border-white/5">支持标准 Markdown 语法，实时预览。</div>
                    <button class="btn w-full h-7 text-[10px] bg-white/5 hover:bg-white/10" onclick="Modules.reader_center.exportToLibrary('markdown')"><i class="fa-solid fa-book mr-1"></i>存书架</button>
                </div>`;
        }
        return '';
    },

    _renderMainContent: () => {
        const RC = Modules.reader_center;
        if (RC.currentTab === 'library') {
            return `
                <!-- 书架视图 -->
                <div id="rc-shelf-view" class="absolute inset-0 z-10 flex flex-col bg-[#0d0d0f]">
                    <div class="p-5 flex-1 flex flex-col">
                        <div class="flex justify-between items-center mb-5">
                            <div class="flex gap-3 text-xs font-bold">
                                <span class="text-white border-b-2 border-amber-500 pb-1">全部</span>
                            </div>
                            <div class="relative">
                                <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-dim text-xs"></i>
                                <input class="bg-black/40 border border-white/10 rounded-full pl-8 pr-4 h-8 text-xs w-48 focus:border-amber-500 text-white outline-none" placeholder="搜索书名..." oninput="Modules.reader_center.searchBooks(this.value)">
                            </div>
                        </div>
                        <div class="grid grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 overflow-y-auto pb-6 scrollbar-hide flex-1" id="rc-shelf"></div>
                    </div>
                </div>
                <!-- 阅读视图 -->
                <div id="rc-reader-view" class="absolute inset-0 z-20 flex flex-col bg-[#121212] hidden">
                    <!-- NEXUS 状态面板 -->
                    <div id="rc-nexus-panel" class="absolute right-0 top-11 bottom-1 w-64 bg-[#0e0e10] border-l border-white/10 z-40 transform transition-transform duration-300 translate-x-0 flex flex-col">
                        <div class="h-9 flex items-center justify-between px-3 border-b border-white/10 bg-[#111113]">
                            <div class="flex items-center gap-1.5 text-[10px] font-bold text-amber-500">
                                <i class="fa-solid fa-diamond text-[9px]"></i>NEXUS 状态机
                            </div>
                            <button class="text-dim hover:text-white text-[9px]" onclick="Modules.reader_center._toggleNexusPanel()" title="收起/展开">
                                <i class="fa-solid fa-chevron-right" id="rc-nexus-toggle-icon"></i>
                            </button>
                        </div>
                        <div class="flex-1 overflow-y-auto p-2 space-y-2" id="rc-nexus-content">
                            <div class="text-[10px] text-dim text-center py-4">未检测到循环标记</div>
                        </div>
                    </div>
                    <!-- 选中文本浮动按钮 -->
                    <div id="rc-selection-popup" class="hidden absolute z-50 bg-[#1a1a1c] border border-white/10 rounded-lg shadow-xl p-1.5 flex gap-1" style="pointer-events:auto;">
                        <button class="px-2 py-1 rounded text-[9px] bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 whitespace-nowrap" onclick="Modules.reader_center.analyzeSelection('technique')">拆解技法</button>
                        <button class="px-2 py-1 rounded text-[9px] bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 whitespace-nowrap" onclick="Modules.reader_center.analyzeSelection('entity')">提取实体</button>
                        <button class="px-2 py-1 rounded text-[9px] bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 whitespace-nowrap" onclick="Modules.reader_center.analyzeSelection('nexus')">标注NEXUS</button>
                        <button class="px-2 py-1 rounded text-[9px] bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 whitespace-nowrap" onclick="Modules.reader_center.sendToFusion()">发送到融合拆书</button>
                    </div>
                    <!-- 分析结果弹窗 -->
                    <div id="rc-analysis-modal" class="hidden absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
                        <div class="bg-[#111113] border border-white/10 rounded-xl w-full max-w-lg max-h-[80%] flex flex-col shadow-2xl">
                            <div class="h-10 flex items-center justify-between px-4 border-b border-white/10">
                                <span class="text-xs font-bold text-amber-500" id="rc-analysis-title">分析结果</span>
                                <button class="text-dim hover:text-white" onclick="document.getElementById('rc-analysis-modal').classList.add('hidden')"><i class="fa-solid fa-xmark"></i></button>
                            </div>
                            <div class="flex-1 overflow-y-auto p-4 text-[11px] text-gray-300 leading-relaxed whitespace-pre-wrap" id="rc-analysis-body"></div>
                            <div class="p-3 border-t border-white/10 flex gap-2">
                                <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim" onclick="Utils.copy(document.getElementById('rc-analysis-body').innerText);UI.toast('已复制')"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                                <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim" onclick="ContextHelper.exportToLibrary('分析_'+new Date().toLocaleString(),document.getElementById('rc-analysis-body').innerText);UI.toast('已存书架')"><i class="fa-solid fa-book mr-1"></i>存书架</button>
                            </div>
                        </div>
                    </div>
                    <div class="h-11 flex justify-between items-center px-4 bg-[#1a1a1a]/95 backdrop-blur border-b border-white/5 z-30 shrink-0">
                        <div class="flex items-center gap-3">
                            <button class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex center text-dim" onclick="Modules.reader_center.closeReader()"><i class="fa-solid fa-arrow-left"></i></button>
                            <span id="rc-reader-title" class="font-serif font-bold text-sm text-gray-300 truncate max-w-md"></span>
                            <span class="text-[9px] text-dim bg-white/5 px-2 py-0.5 rounded-full" id="rc-progress-badge">0%</span>
                        </div>
                        <div class="flex gap-1 items-center">
                            <button class="w-7 h-7 rounded-full hover:bg-white/10 flex center text-dim" onclick="Modules.reader_center.addBookmark()" title="添加书签"><i class="fa-solid fa-bookmark text-[10px]"></i></button>
                            <button class="w-7 h-7 rounded-full hover:bg-white/10 flex center text-dim" onclick="Modules.reader_center.addAnnotation()" title="添加批注"><i class="fa-solid fa-pen text-[10px]"></i></button>
                            <div class="w-px h-4 bg-white/10 mx-1"></div>
                            <div class="flex items-center bg-black/30 rounded-full border border-white/5 p-0.5 gap-0.5">
                                <button class="w-6 h-6 rounded-full hover:bg-white/10 flex center text-dim" onclick="Modules.reader_center.toggleSize(-2)"><i class="fa-solid fa-minus text-[9px]"></i></button>
                                <span class="text-[9px] font-mono w-5 text-center text-dim" id="rc-font-disp">${RC.currentSize}</span>
                                <button class="w-6 h-6 rounded-full hover:bg-white/10 flex center text-dim" onclick="Modules.reader_center.toggleSize(2)"><i class="fa-solid fa-plus text-[9px]"></i></button>
                            </div>
                            <div class="flex items-center bg-black/30 rounded-full border border-white/5 p-0.5 gap-0.5">
                                <button class="w-6 h-6 rounded-full hover:bg-white/10 flex center text-dim" onclick="Modules.reader_center.setReaderTheme('light')"><i class="fa-solid fa-sun text-[9px]"></i></button>
                                <button class="w-6 h-6 rounded-full hover:bg-white/10 flex center text-white" onclick="Modules.reader_center.setReaderTheme('dark')"><i class="fa-solid fa-moon text-[9px]"></i></button>
                                <button class="w-6 h-6 rounded-full hover:bg-white/10 flex center text-dim" onclick="Modules.reader_center.setReaderTheme('sepia')"><i class="fa-solid fa-mug-hot text-[9px]"></i></button>
                            </div>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto scroll-smooth" id="rc-reader-container" onscroll="Modules.reader_center.onScroll()">
                        <div class="w-full max-w-3xl mx-auto py-10 px-10 font-serif leading-loose selection:bg-amber-500/30 text-[#d4d4d4] min-h-full" id="rc-reader-content"></div>
                    </div>
                    <!-- 底部进度条 -->
                    <div class="h-1 bg-black/50 shrink-0"><div class="h-full bg-amber-500 transition-all" id="rc-progress-bar" style="width:0%"></div></div>
                </div>`;
        }
        if (RC.currentTab === 'typeset') {
            return `
                <div class="bg-[#2a2a2a] p-6 flex justify-center overflow-auto flex-1 relative" style="background-image:radial-gradient(#333 1px,transparent 1px);background-size:20px 20px;">
                    <div id="rc-ty-container" class="relative transition-transform origin-top my-8" style="transform:scale(${RC.typesetZoom})">
                        <div id="rc-ty-paper" class="bg-white shadow-[0_10px_60px_rgba(0,0,0,0.5)] w-[210mm] min-h-[297mm] h-auto p-[25mm] text-black relative box-border"></div>
                    </div>
                    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-black/80 p-1.5 rounded-full backdrop-blur border border-white/10 shadow-xl z-20">
                        <button class="w-7 h-7 rounded-full flex center text-white hover:bg-white/20" onclick="Modules.reader_center.typesetZoomFn(-0.1)"><i class="fa-solid fa-minus text-xs"></i></button>
                        <span class="flex center text-[10px] font-mono w-10 text-dim" id="rc-ty-zoom">${Math.round(RC.typesetZoom * 100)}%</span>
                        <button class="w-7 h-7 rounded-full flex center text-white hover:bg-white/20" onclick="Modules.reader_center.typesetZoomFn(0.1)"><i class="fa-solid fa-plus text-xs"></i></button>
                        <div class="w-px h-4 bg-white/20 my-auto"></div>
                        ${[['light','#fff'],['sepia','#f4ecd8'],['dark','#1a1a1a']].map(([t,c]) => `
                            <button class="w-7 h-7 rounded-full flex center text-white hover:bg-white/20" onclick="Modules.reader_center.setTypesetTheme('${t}')"><div class="w-3 h-3 rounded-full border border-gray-400" style="background:${c}"></div></button>
                        `).join('')}
                    </div>
                </div>`;
        }
        if (RC.currentTab === 'markdown') {
            return `
                <div class="flex h-full">
                    <div class="flex-1 flex flex-col border-r border-white/10">
                        <textarea id="rc-md-input" class="w-full h-full bg-[#1e1e1e] text-gray-300 p-5 font-mono text-sm resize-none focus:outline-none" oninput="Modules.reader_center.parseMD()" placeholder="# Markdown 编辑器\n\n在此输入 Markdown..."></textarea>
                    </div>
                    <div class="flex-1 bg-white text-black p-6 overflow-y-auto" id="rc-md-preview"></div>
                </div>`;
        }
        return '';
    },

    _renderAIPanel: () => {
        return `
            <div class="w-[340px] bg-[#111113] border-l border-white/5 flex flex-col z-20 shrink-0" id="rc-ai-sidebar">
                <div class="flex border-b border-white/5 bg-[#151517]">
                    <button class="flex-1 py-2 text-[10px] font-bold text-amber-500 border-b-2 border-amber-500" onclick="Modules.reader_center.switchAITab('assistant')" id="rc-ai-tab-assistant">AI 助手</button>
                    <button class="flex-1 py-2 text-[10px] font-bold text-dim hover:text-white" onclick="Modules.reader_center.switchAITab('chat')" id="rc-ai-tab-chat">对话</button>
                    <button class="flex-1 py-2 text-[10px] font-bold text-dim hover:text-white" onclick="Modules.reader_center.switchAITab('notes')" id="rc-ai-tab-notes">笔记</button>
                </div>
                <!-- AI 助手 -->
                <div id="rc-ai-assistant" class="flex-1 flex flex-col overflow-hidden">
                    <div id="rc-ai-io" class="hidden absolute top-0 left-0 right-0 h-36 bg-[#111113] z-20 flex flex-col p-2 border-b border-white/5">
                        <div class="flex justify-between items-center mb-1 pb-1 border-b border-white/5">
                            <span class="text-[10px] font-bold text-amber-500">IO 调试</span>
                            <i class="fa-solid fa-xmark text-dim hover:text-white cursor-pointer" onclick="document.getElementById('rc-ai-io').classList.add('hidden')"></i>
                        </div>
                        <div class="flex-1 flex gap-2 overflow-hidden">
                            <textarea id="rc-io-in" class="flex-1 bg-black/30 border border-white/5 rounded p-1 text-[9px] text-gray-400 resize-none font-mono" readonly></textarea>
                            <textarea id="rc-io-out" class="flex-1 bg-black/30 border border-white/5 rounded p-1 text-[9px] text-green-400 resize-none font-mono" readonly></textarea>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto p-3 space-y-2" id="rc-ai-log">
                        <div class="p-2 bg-gradient-to-br from-amber-900/20 to-black border border-amber-500/20 rounded-lg text-xs text-gray-300">
                            <div class="flex items-center gap-2 mb-1 text-amber-500 font-bold text-[10px]"><i class="fa-solid fa-sparkles"></i> 智能阅读伴侣</div>
                            <p class="leading-relaxed opacity-80 text-[10px]">选择下方工具或直接提问，我可以帮您深度解读文本。</p>
                        </div>
                    </div>
                    <div class="p-2 border-t border-white/5 bg-[#0d0d0f] flex flex-col gap-1.5 relative">
                        <button class="absolute top-[-16px] right-3 bg-[#0d0d0f] border border-white/5 rounded-t px-2 text-[8px] text-dim hover:text-white" onclick="document.getElementById('rc-ai-io').classList.toggle('hidden')">IO</button>
                        <div class="grid grid-cols-3 gap-1">
                            ${[['summary','摘要','fa-file-lines','blue'],['char','人物','fa-users','green'],['plot','情节','fa-timeline','purple'],['deep','解读','fa-brain','red'],['imitate','仿写','fa-feather-pointed','pink'],['logic','纠错','fa-check-double','cyan'],['extract','素材提取','fa-gem','amber'],['inspire','灵感联想','fa-lightbulb','yellow'],['hotspot','热点关联','fa-fire','rose']].map(([k,v,i,c]) => `
                                <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 justify-start text-[9px] relative group" onclick="Modules.reader_center.analyze('${k}')">
                                    <i class="fa-solid ${i} text-${c}-400 mr-1"></i>${v}
                                    <i class="fa-solid fa-gear absolute right-1 opacity-0 group-hover:opacity-100 text-dim hover:text-white text-[8px]" onclick="event.stopPropagation();Modules.short.openPromptModal('read_${k}')"></i>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <!-- 对话 -->
                <div id="rc-ai-chat" class="hidden flex-1 flex flex-col overflow-hidden bg-[#0d0d0f]">
                    <div class="flex-1 overflow-y-auto p-3 space-y-2" id="rc-chat-log">
                        <div class="flex center h-full text-dim flex-col gap-3 opacity-30">
                            <i class="fa-solid fa-comments text-3xl"></i>
                            <span class="text-xs">与当前书籍自由对话</span>
                        </div>
                    </div>
                    <div class="p-2 bg-[#111113] border-t border-white/5">
                        <div class="relative">
                            <textarea id="rc-chat-in" class="w-full bg-black/30 border border-white/10 rounded-lg p-2 pr-9 text-xs resize-none h-16 focus:border-amber-500/50 placeholder-white/20 leading-relaxed" placeholder="输入问题..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();Modules.reader_center.sendChat();}"></textarea>
                            <button class="absolute bottom-2 right-2 btn-icon w-6 h-6 bg-amber-600 hover:bg-amber-500 text-black rounded flex center shadow-lg" onclick="Modules.reader_center.sendChat()"><i class="fa-solid fa-paper-plane text-[10px]"></i></button>
                        </div>
                    </div>
                </div>
                <!-- 笔记 -->
                <div id="rc-ai-notes" class="hidden flex-1 flex flex-col overflow-hidden bg-[#0d0d0f]">
                    <div class="flex-1 overflow-y-auto p-3 space-y-2" id="rc-notes-list">
                        <div class="text-dim text-xs text-center p-4">暂无书签和批注</div>
                    </div>
                    <div class="p-2 border-t border-white/5 flex gap-1">
                        <button class="btn btn-xs flex-1 bg-amber-500/10 text-amber-400" onclick="Modules.reader_center.exportNotes()"><i class="fa-solid fa-download mr-1"></i>导出笔记</button>
                        <button class="btn btn-xs flex-1 bg-white/5 text-dim" onclick="Modules.reader_center.clearNotes()"><i class="fa-solid fa-trash mr-1"></i>清空</button>
                    </div>
                </div>
            </div>`;
    },

    // ========== 交互方法 ==========
    switchTab: (tab) => { Modules.reader_center.currentTab = tab; const view = document.getElementById('module-view-reader_center'); if (view) view.innerHTML = Modules.reader_center.render(); Modules.reader_center.init(); },
    switchAITab: (tab) => {
        ['assistant', 'chat', 'notes'].forEach(t => {
            const el = document.getElementById('rc-ai-' + t);
            const btn = document.getElementById('rc-ai-tab-' + t);
            if (el) el.classList.toggle('hidden', t !== tab);
            if (btn) btn.className = t === tab ? 'flex-1 py-2 text-[10px] font-bold text-amber-500 border-b-2 border-amber-500' : 'flex-1 py-2 text-[10px] font-bold text-dim hover:text-white';
        });
        if (tab === 'notes') Modules.reader_center.renderNotes();
    },
    setFilter: (f) => { Modules.reader_center.shelfFilter = f; Modules.reader_center.init(); },
    setSort: (s) => { Modules.reader_center.shelfSort = s; Modules.reader_center.init(); },
    searchBooks: (query) => {
        const q = query.toLowerCase();
        document.querySelectorAll('#rc-shelf > div').forEach(el => {
            const name = el.dataset.name || '';
            el.style.display = name.toLowerCase().includes(q) ? '' : 'none';
        });
    },

    init: async () => {
        const RC = Modules.reader_center;
        if (RC.currentTab === 'library') {
            let books = await DB.getAll('library_books');
            // 加载书签和批注
            const bmStore = await DB.get('settings', 'reader_bookmarks');
            RC.bookmarks = (bmStore && bmStore.items) ? bmStore.items : [];
            const anStore = await DB.get('settings', 'reader_annotations');
            RC.annotations = (anStore && anStore.items) ? anStore.items : [];
            const progStore = await DB.get('settings', 'reader_progress');
            RC.readingProgress = (progStore && progStore.data) ? progStore.data : {};

            // 筛选
            if (RC.shelfFilter === 'favorite') books = books.filter(b => RC.bookmarks.some(bm => bm.bookId === b.id && bm.type === 'favorite'));
            if (RC.shelfFilter === 'generated') books = books.filter(b => (b.name || '').includes('_') || (b.date || '').includes('/'));
            if (RC.shelfFilter === 'recent') {
                const recentIds = Object.entries(RC.readingProgress).sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0)).slice(0, 20).map(e => e[0]);
                books = books.filter(b => recentIds.includes(b.id));
            }
            // 排序
            if (RC.shelfSort === 'name') books.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            else if (RC.shelfSort === 'size') books.sort((a, b) => (b.size || 0) - (a.size || 0));
            else books.sort((a, b) => (b.id || '').localeCompare(a.id || ''));

            const stat = document.getElementById('rc-stat-count');
            if (stat) stat.innerText = books.length;
            const bmStat = document.getElementById('rc-stat-bookmarks');
            if (bmStat) bmStat.innerText = RC.bookmarks.length;
            const anStat = document.getElementById('rc-stat-notes');
            if (anStat) anStat.innerText = RC.annotations.length;

            try { RC.customTools = await DB.getAll('tools_custom'); } catch (e) {}
            const shelf = document.getElementById('rc-shelf');
            if (!shelf) return;
            const colors = ['from-amber-700 to-orange-900', 'from-blue-700 to-indigo-900', 'from-emerald-700 to-green-900', 'from-purple-700 to-pink-900', 'from-red-700 to-rose-900', 'from-cyan-700 to-teal-900'];
            shelf.innerHTML = books.length === 0
                ? `<div class="col-span-full flex flex-col items-center justify-center text-dim h-48 border-2 border-dashed border-white/5 rounded-xl">
                    <i class="fa-solid fa-book text-3xl mb-3 opacity-20"></i><p class="text-sm">书架空空如也</p>
                    <button class="btn mt-3 bg-white/5 hover:bg-white/10 text-xs" onclick="document.getElementById('rc-upload').click()">导入第一本书</button>
                   </div>`
                : books.map((b, i) => {
                    const progress = RC.readingProgress[b.id]?.percent || 0;
                    return `
                    <div class="group cursor-pointer relative" onclick="Modules.reader_center.read('${b.id}')" data-name="${(b.name||'').replace(/"/g,'&quot;')}">
                        <div class="aspect-[2/3] rounded-r-lg rounded-l-sm bg-gradient-to-br ${colors[i % colors.length]} shadow-xl group-hover:-translate-y-2 group-hover:shadow-[0_12px_25px_rgba(0,0,0,0.5)] transition-all duration-300 flex flex-col relative overflow-hidden border-l-2 border-white/10">
                            <div class="absolute left-0 top-0 bottom-0 w-0.5 bg-white/20 z-20"></div>
                            <div class="flex-1 flex flex-col p-2.5 relative z-10">
                                <i class="fa-solid fa-book-open text-lg text-white/20 mb-1"></i>
                                <div class="text-[9px] font-bold text-white/90 leading-tight line-clamp-2 mb-1">${b.name}</div>
                                <div class="text-[8px] text-white/50 font-serif line-clamp-2">${(b.content || '').slice(0, 25)}...</div>
                            </div>
                            <div class="p-1.5 bg-black/40 flex justify-between items-center mt-auto">
                                <span class="text-[7px] text-white/60">${((b.size || 0) / 1024).toFixed(1)}KB</span>
                                ${progress > 0 ? `<span class="text-[7px] text-amber-400">${progress}%</span>` : ''}
                            </div>
                            ${progress > 0 ? `<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-black/50"><div class="h-full bg-amber-500" style="width:${progress}%"></div></div>` : ''}
                            <button class="absolute top-1 right-1 w-5 h-5 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 flex center text-[9px] z-30 hover:bg-red-500" onclick="Modules.reader_center.delBook('${b.id}',event)"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>`;
                }).join('');
        }
        if (RC.currentTab === 'typeset') RC.renderTypesetPage();
    },

    // ========== 阅读器方法 ==========
    read: async (id) => {
        const RC = Modules.reader_center;
        const book = await DB.get('library_books', id);
        if (!book) return UI.toast('找不到该书');
        RC.currentBook = book;
        document.getElementById('rc-reader-title').innerText = book.name || '未命名';
        const themes = { dark: { bg: '#121212', text: '#d4d4d4' }, light: { bg: '#fafaf9', text: '#1c1917' }, sepia: { bg: '#f4ecd8', text: '#3d2b1f' } };
        const th = themes[RC.currentTheme] || themes.dark;
        const container = document.getElementById('rc-reader-container');
        container.style.background = th.bg;
        const content = document.getElementById('rc-reader-content');
        content.style.color = th.text;
        content.style.fontSize = RC.currentSize + 'px';
        // 智能分段渲染
        const raw = book.content || '';
        const paragraphs = raw.split(/\n{2,}|\r\n\r\n/).filter(p => p.trim());
        content.innerHTML = paragraphs.map((p, i) => {
            const trimmed = p.trim();
            if (/^#{1,3}\s/.test(trimmed)) {
                const level = trimmed.match(/^(#{1,3})/)[1].length;
                const text = trimmed.replace(/^#{1,3}\s*/, '');
                const sizes = { 1: 'text-2xl', 2: 'text-xl', 3: 'text-lg' };
                return `<h${level} class="${sizes[level]} font-bold mt-8 mb-4 text-amber-400/80" id="rc-p-${i}">${text}</h${level}>`;
            }
            if (/^[第][一二三四五六七八九十百千\d]+[章节回]/.test(trimmed)) {
                return `<h2 class="text-xl font-bold mt-10 mb-4 text-amber-400/80 border-b border-amber-500/20 pb-2" id="rc-p-${i}">${trimmed}</h2>`;
            }
            return `<p class="indent-8 mb-4 leading-loose" id="rc-p-${i}">${trimmed}</p>`;
        }).join('');
        // 恢复阅读进度
        const saved = RC.readingProgress[id];
        if (saved && saved.scrollTop) {
            setTimeout(() => { container.scrollTop = saved.scrollTop; }, 100);
        }
        document.getElementById('rc-shelf-view').classList.add('hidden');
        document.getElementById('rc-reader-view').classList.remove('hidden');
        // 渲染 NEXUS 面板
        RC._renderNexusPanel(null);
        // 绑定选中文本监听
        RC._bindSelectionListener();
        // 更新进度时间戳
        RC.readingProgress[id] = { ...(RC.readingProgress[id] || {}), ts: Date.now() };
        await DB.put('settings', { id: 'reader_progress', data: RC.readingProgress });
    },

    closeReader: async () => {
        const RC = Modules.reader_center;
        // 保存进度
        if (RC.currentBook) {
            const container = document.getElementById('rc-reader-container');
            const scrollTop = container ? container.scrollTop : 0;
            const scrollHeight = container ? container.scrollHeight - container.clientHeight : 1;
            const percent = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
            RC.readingProgress[RC.currentBook.id] = { scrollTop, percent, ts: Date.now() };
            await DB.put('settings', { id: 'reader_progress', data: RC.readingProgress });
        }
        RC.currentBook = null;
        RC._currentCycleId = null;
        document.getElementById('rc-reader-view').classList.add('hidden');
        document.getElementById('rc-shelf-view').classList.remove('hidden');
        const popup = document.getElementById('rc-selection-popup');
        if (popup) popup.classList.add('hidden');
        RC.init();
    },

    handleUpload: async (input) => {
        const file = input.files[0];
        if (!file) return;
        const text = await file.text();
        const id = Utils.uuid();
        await DB.put('library_books', { id, name: file.name.replace(/\.\w+$/, ''), content: text, size: text.length, date: new Date().toLocaleString() });
        UI.toast('导入成功');
        input.value = '';
        Modules.reader_center.init();
    },

    importFromClipboard: async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (!text || text.length < 10) return UI.toast('剪贴板内容太少');
            const id = Utils.uuid();
            const name = text.slice(0, 20).replace(/\n/g, ' ') + '...';
            await DB.put('library_books', { id, name, content: text, size: text.length, date: new Date().toLocaleString() });
            UI.toast('从剪贴板导入成功');
            Modules.reader_center.init();
        } catch (e) { UI.toast('无法读取剪贴板'); }
    },

    delBook: async (id, e) => {
        if (e) e.stopPropagation();
        if (!confirm('确定删除？')) return;
        await DB.del('library_books', id);
        UI.toast('已删除');
        Modules.reader_center.init();
    },

    setReaderTheme: (theme) => {
        const RC = Modules.reader_center;
        RC.currentTheme = theme;
        const themes = { dark: { bg: '#121212', text: '#d4d4d4' }, light: { bg: '#fafaf9', text: '#1c1917' }, sepia: { bg: '#f4ecd8', text: '#3d2b1f' } };
        const th = themes[theme] || themes.dark;
        const container = document.getElementById('rc-reader-container');
        if (container) container.style.background = th.bg;
        const content = document.getElementById('rc-reader-content');
        if (content) content.style.color = th.text;
    },

    toggleSize: (delta) => {
        const RC = Modules.reader_center;
        RC.currentSize = Math.max(12, Math.min(32, RC.currentSize + delta));
        const content = document.getElementById('rc-reader-content');
        if (content) content.style.fontSize = RC.currentSize + 'px';
        const disp = document.getElementById('rc-font-disp');
        if (disp) disp.innerText = RC.currentSize;
    },

    onScroll: () => {
        const RC = Modules.reader_center;
        const container = document.getElementById('rc-reader-container');
        if (!container || !RC.currentBook) return;
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight - container.clientHeight;
        const percent = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
        const bar = document.getElementById('rc-progress-bar');
        if (bar) bar.style.width = percent + '%';
        const badge = document.getElementById('rc-progress-badge');
        if (badge) badge.innerText = percent + '%';
        // 循环标记检测
        RC._detectCycleOnScroll(scrollTop);
        // 自动保存进度（节流）
        if (!RC._scrollTimer) {
            RC._scrollTimer = setTimeout(async () => {
                RC.readingProgress[RC.currentBook.id] = { scrollTop, percent, ts: Date.now() };
                await DB.put('settings', { id: 'reader_progress', data: RC.readingProgress });
                RC._scrollTimer = null;
            }, 1000);
        }
    },

    // ========== 书签 & 批注 ==========
    addBookmark: async () => {
        const RC = Modules.reader_center;
        if (!RC.currentBook) return;
        const container = document.getElementById('rc-reader-container');
        const scrollTop = container ? container.scrollTop : 0;
        const percent = container ? Math.round((scrollTop / (container.scrollHeight - container.clientHeight)) * 100) : 0;
        RC.bookmarks.push({ id: Utils.uuid(), bookId: RC.currentBook.id, bookName: RC.currentBook.name, position: scrollTop, percent, ts: Date.now(), label: `第${percent}%处` });
        await DB.put('settings', { id: 'reader_bookmarks', items: RC.bookmarks });
        UI.toast('书签已添加');
    },

    addAnnotation: async () => {
        const RC = Modules.reader_center;
        if (!RC.currentBook) return;
        const sel = window.getSelection();
        const selectedText = sel ? sel.toString().trim() : '';
        const note = prompt('输入批注内容：', '');
        if (!note) return;
        const container = document.getElementById('rc-reader-container');
        RC.annotations.push({
            id: Utils.uuid(), bookId: RC.currentBook.id, bookName: RC.currentBook.name,
            selectedText: selectedText || '(无选中文本)',
            note, position: container ? container.scrollTop : 0, ts: Date.now()
        });
        await DB.put('settings', { id: 'reader_annotations', items: RC.annotations });
        UI.toast('批注已添加');
    },

    renderNotes: () => {
        const RC = Modules.reader_center;
        const list = document.getElementById('rc-notes-list');
        if (!list) return;
        const bookId = RC.currentBook ? RC.currentBook.id : null;
        const bms = bookId ? RC.bookmarks.filter(b => b.bookId === bookId) : RC.bookmarks;
        const ans = bookId ? RC.annotations.filter(a => a.bookId === bookId) : RC.annotations;
        if (bms.length === 0 && ans.length === 0) {
            list.innerHTML = '<div class="text-dim text-xs text-center p-4">暂无书签和批注</div>';
            return;
        }
        let html = '';
        if (bms.length > 0) {
            html += `<div class="text-[9px] font-bold text-amber-500 mb-1"><i class="fa-solid fa-bookmark mr-1"></i>书签 (${bms.length})</div>`;
            html += bms.map(b => `
                <div class="p-2 bg-white/5 rounded border border-white/5 text-[10px] flex justify-between items-center group cursor-pointer hover:bg-white/10" onclick="Modules.reader_center._jumpTo('${b.bookId}',${b.position})">
                    <div><span class="text-amber-400">${b.label}</span> <span class="text-dim ml-1">${b.bookName || ''}</span></div>
                    <button class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300" onclick="event.stopPropagation();Modules.reader_center._delNote('bookmark','${b.id}')"><i class="fa-solid fa-xmark"></i></button>
                </div>
            `).join('');
        }
        if (ans.length > 0) {
            html += `<div class="text-[9px] font-bold text-green-500 mt-2 mb-1"><i class="fa-solid fa-pen mr-1"></i>批注 (${ans.length})</div>`;
            html += ans.map(a => `
                <div class="p-2 bg-white/5 rounded border border-white/5 text-[10px] group hover:bg-white/10">
                    <div class="text-dim italic mb-1 line-clamp-1">"${a.selectedText}"</div>
                    <div class="text-green-300">${a.note}</div>
                    <div class="flex justify-between mt-1">
                        <span class="text-[8px] text-dim">${a.bookName || ''}</span>
                        <button class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300" onclick="Modules.reader_center._delNote('annotation','${a.id}')"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
            `).join('');
        }
        list.innerHTML = html;
    },

    _jumpTo: async (bookId, position) => {
        const RC = Modules.reader_center;
        if (!RC.currentBook || RC.currentBook.id !== bookId) {
            await RC.read(bookId);
        }
        setTimeout(() => {
            const container = document.getElementById('rc-reader-container');
            if (container) container.scrollTop = position;
        }, 200);
    },

    _delNote: async (type, id) => {
        const RC = Modules.reader_center;
        if (type === 'bookmark') {
            RC.bookmarks = RC.bookmarks.filter(b => b.id !== id);
            await DB.put('settings', { id: 'reader_bookmarks', items: RC.bookmarks });
        } else {
            RC.annotations = RC.annotations.filter(a => a.id !== id);
            await DB.put('settings', { id: 'reader_annotations', items: RC.annotations });
        }
        RC.renderNotes();
    },

    exportNotes: () => {
        const RC = Modules.reader_center;
        const bookId = RC.currentBook ? RC.currentBook.id : null;
        const bms = bookId ? RC.bookmarks.filter(b => b.bookId === bookId) : RC.bookmarks;
        const ans = bookId ? RC.annotations.filter(a => a.bookId === bookId) : RC.annotations;
        let text = '# 阅读笔记\n\n';
        if (bms.length) {
            text += '## 书签\n';
            bms.forEach(b => { text += `- [${b.bookName}] ${b.label}\n`; });
            text += '\n';
        }
        if (ans.length) {
            text += '## 批注\n';
            ans.forEach(a => { text += `- [${a.bookName}] "${a.selectedText}" → ${a.note}\n`; });
        }
        Utils.copy(text);
        UI.toast('笔记已复制到剪贴板');
    },

    clearNotes: async () => {
        const RC = Modules.reader_center;
        if (!confirm('确定清空所有书签和批注？')) return;
        RC.bookmarks = [];
        RC.annotations = [];
        await DB.put('settings', { id: 'reader_bookmarks', items: [] });
        await DB.put('settings', { id: 'reader_annotations', items: [] });
        RC.renderNotes();
        UI.toast('已清空');
    },

    // ========== AI 分析 & 对话 ==========
    analyze: async (type) => {
        const RC = Modules.reader_center;
        if (!RC.currentBook) return UI.toast('请先打开一本书');
        const content = RC.currentBook.content || '';
        const slice = content.slice(0, 6000);
        const prompts = {
            summary: `请为以下文本生成详细摘要，包含核心主题、主要情节、关键人物：\n\n${slice}`,
            char: `请分析以下文本中的所有人物，列出每个人物的性格特征、动机、关系网络：\n\n${slice}`,
            plot: `请提取以下文本的情节脉络，按时间线梳理主要事件和转折点：\n\n${slice}`,
            deep: `请对以下文本进行深度文学解读，分析主题思想、象征意义、叙事技巧：\n\n${slice}`,
            imitate: `请仿写以下文本的风格，写一段300字左右的新内容，保持相同的语言风格和叙事节奏：\n\n${slice}`,
            logic: `请检查以下文本中的逻辑漏洞、前后矛盾、不合理之处，并给出修改建议：\n\n${slice}`,
            extract: `请从以下文本中提取可复用的写作素材：\n\n${slice}\n\n要求提取：\n1. 精彩的比喻/修辞句(至少5个)\n2. 有特色的场景描写片段\n3. 出彩的对话金句\n4. 可借鉴的情节结构\n5. 独特的人物塑造手法\n6. 氛围营造技巧\n\n每项都标注出处段落和可复用场景。`,
            inspire: `请基于以下文本进行灵感联想，生成创作灵感：\n\n${slice}\n\n要求：\n1. 从文本中提炼3个核心创意种子\n2. 每个种子延伸出2-3个全新的故事方向\n3. 提供可直接使用的开头片段(每个100字)\n4. 标注适合的小说类型和目标读者\n5. 给出与当前热门题材的融合建议`,
            hotspot: `请分析以下文本与当前网文市场热点的关联：\n\n${slice}\n\n要求：\n1. 识别文本中的热门元素和标签\n2. 分析这些元素的市场热度\n3. 给出强化热点元素的建议\n4. 推荐可融合的其他热门标签\n5. 提供针对不同平台(起点/晋江/番茄)的优化建议`
        };
        // 检查自定义提示词
        const customKey = 'read_' + type;
        const customPrompt = Modules.short?.getPrompt?.(customKey);
        const finalPrompt = customPrompt || prompts[type] || prompts.summary;

        const log = document.getElementById('rc-ai-log');
        const typeNames = { summary: '摘要', char: '人物分析', plot: '情节梳理', deep: '深度解读', imitate: '仿写', logic: '逻辑纠错', extract: '素材提取', inspire: '灵感联想', hotspot: '热点关联' };
        log.innerHTML += `<div class="p-2 bg-white/5 rounded text-[10px] text-dim"><i class="fa-solid fa-spinner fa-spin mr-1 text-amber-500"></i>正在${typeNames[type] || '分析'}...</div>`;
        log.scrollTop = log.scrollHeight;

        // IO 调试
        const ioIn = document.getElementById('rc-io-in');
        if (ioIn) ioIn.value = finalPrompt;

        try {
            const result = await AI.generate(finalPrompt);
            const ioOut = document.getElementById('rc-io-out');
            if (ioOut) ioOut.value = result;
            log.innerHTML += `
                <div class="p-2 bg-gradient-to-br from-amber-900/10 to-transparent border border-amber-500/10 rounded-lg text-[10px] text-gray-300 leading-relaxed">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-amber-500 font-bold text-[9px]"><i class="fa-solid fa-sparkles mr-1"></i>${typeNames[type] || '分析结果'}</span>
                        <div class="flex gap-1">
                            <button class="text-dim hover:text-white" onclick="Utils.copy(this.closest('.p-2').querySelector('.ai-result-text').innerText);UI.toast('已复制')"><i class="fa-solid fa-copy"></i></button>
                            <button class="text-dim hover:text-amber-400" onclick="ContextHelper.exportToLibrary('${typeNames[type]}_${RC.currentBook?.name||''}',this.closest('.p-2').querySelector('.ai-result-text').innerText);UI.toast('已存入书架')"><i class="fa-solid fa-book"></i></button>
                        </div>
                    </div>
                    <div class="ai-result-text whitespace-pre-wrap">${(typeof marked !== 'undefined' ? marked.parse(result) : result)}</div>
                </div>`;
            log.scrollTop = log.scrollHeight;
            ContextHelper.recordGeneration?.('reader_center', result);
        } catch (e) {
            log.innerHTML += `<div class="p-2 bg-red-900/20 border border-red-500/20 rounded text-[10px] text-red-400">${e.message || '生成失败'}</div>`;
        }
    },

    _runAITool: async (toolId) => {
        const RC = Modules.reader_center;
        const tool = RC.customTools.find(t => t.id === toolId);
        if (!tool || !RC.currentBook) return;
        const content = RC.currentBook.content.slice(0, 6000);
        const prompt = (tool.prompt || '').replace('{{input}}', content);
        const log = document.getElementById('rc-ai-log');
        log.innerHTML += `<div class="p-2 bg-white/5 rounded text-[10px] text-dim"><i class="fa-solid fa-spinner fa-spin mr-1"></i>${tool.name}...</div>`;
        try {
            const result = await AI.generate(prompt);
            log.innerHTML += `<div class="p-2 bg-white/5 rounded text-[10px] text-gray-300"><div class="text-amber-500 font-bold text-[9px] mb-1">${tool.name}</div><div class="whitespace-pre-wrap">${result}</div></div>`;
        } catch (e) {
            log.innerHTML += `<div class="p-2 bg-red-900/20 rounded text-[10px] text-red-400">失败: ${e.message}</div>`;
        }
    },

    sendChat: async () => {
        const RC = Modules.reader_center;
        const input = document.getElementById('rc-chat-in');
        const msg = input?.value?.trim();
        if (!msg) return;
        input.value = '';
        const log = document.getElementById('rc-chat-log');
        // 清除占位
        if (log.querySelector('.opacity-30')) log.innerHTML = '';
        log.innerHTML += `<div class="flex justify-end"><div class="bg-amber-600/20 border border-amber-500/20 rounded-lg px-3 py-1.5 text-xs text-white max-w-[80%]">${msg}</div></div>`;
        log.innerHTML += `<div class="flex" id="rc-chat-typing"><div class="bg-white/5 rounded-lg px-3 py-1.5 text-xs text-dim"><i class="fa-solid fa-spinner fa-spin mr-1"></i>思考中...</div></div>`;
        log.scrollTop = log.scrollHeight;

        const bookContext = RC.currentBook ? RC.currentBook.content.slice(0, 4000) : '';
        const prompt = bookContext
            ? `你是一个智能阅读助手。以下是用户正在阅读的文本：\n\n${bookContext}\n\n用户问题：${msg}\n\n请基于文本内容回答。`
            : msg;
        try {
            const result = await AI.generate(prompt);
            const typing = document.getElementById('rc-chat-typing');
            if (typing) typing.remove();
            log.innerHTML += `<div class="flex"><div class="bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-gray-300 max-w-[85%] leading-relaxed whitespace-pre-wrap">${(typeof marked !== 'undefined' ? marked.parse(result) : result)}</div></div>`;
            log.scrollTop = log.scrollHeight;
        } catch (e) {
            const typing = document.getElementById('rc-chat-typing');
            if (typing) typing.remove();
            log.innerHTML += `<div class="flex"><div class="bg-red-900/20 rounded-lg px-3 py-1.5 text-xs text-red-400">${e.message || '回复失败'}</div></div>`;
        }
    },

    // ========== 排版方法 ==========
    updateTypeset: (key, val) => {
        const RC = Modules.reader_center;
        if (key === 'size' || key === 'columns') val = parseInt(val);
        if (key === 'lineHeight' || key === 'margin') val = parseFloat(val);
        RC.typesetSettings[key] = val;
        RC.renderTypesetPage();
    },

    adjustTypeset: (key, delta) => {
        const RC = Modules.reader_center;
        RC.typesetSettings[key] = parseFloat(RC.typesetSettings[key]) + delta;
        const el = document.getElementById(key === 'size' ? 'rc-ty-size' : 'rc-ty-lh');
        if (el) el.value = RC.typesetSettings[key];
        RC.renderTypesetPage();
    },

    typesetZoomFn: (delta) => {
        const RC = Modules.reader_center;
        RC.typesetZoom = Math.max(0.3, Math.min(2, RC.typesetZoom + delta));
        const container = document.getElementById('rc-ty-container');
        if (container) container.style.transform = `scale(${RC.typesetZoom})`;
        const disp = document.getElementById('rc-ty-zoom');
        if (disp) disp.innerText = Math.round(RC.typesetZoom * 100) + '%';
    },

    setTypesetTheme: (theme) => {
        const paper = document.getElementById('rc-ty-paper');
        if (!paper) return;
        const themes = { light: { bg: '#fff', text: '#000' }, sepia: { bg: '#f4ecd8', text: '#3d2b1f' }, dark: { bg: '#1a1a1a', text: '#d4d4d4' } };
        const t = themes[theme] || themes.light;
        paper.style.background = t.bg;
        paper.style.color = t.text;
    },

    aiFormat: async () => {
        const input = document.getElementById('rc-ty-in');
        if (!input || !input.value.trim()) return UI.toast('请先输入文本');
        const raw = input.value;
        UI.toast('AI 排版优化中...');
        try {
            const result = await AI.generate(`请对以下文本进行排版优化，包括：合理分段、添加标点、修正格式、统一引号。只返回优化后的文本，不要解释：\n\n${raw}`);
            input.value = result;
            Modules.reader_center.renderTypesetPage();
            UI.toast('排版优化完成');
        } catch (e) { UI.toast('AI 排版失败'); }
    },

    renderTypesetPage: () => {
        const RC = Modules.reader_center;
        const paper = document.getElementById('rc-ty-paper');
        const input = document.getElementById('rc-ty-in');
        if (!paper) return;
        const text = input ? input.value : '';
        const s = RC.typesetSettings;
        if (!text.trim()) {
            paper.innerHTML = `<div style="color:#999;font-size:14px;text-align:center;padding-top:100px;">在左侧输入文本，实时预览排版效果</div>`;
            return;
        }
        const paragraphs = text.split(/\n+/).filter(p => p.trim());
        paper.style.fontFamily = s.font;
        paper.style.fontSize = s.size + 'px';
        paper.style.lineHeight = s.lineHeight;
        paper.style.textAlign = s.align;
        paper.style.columnCount = s.columns;
        paper.style.columnGap = '30px';
        paper.innerHTML = paragraphs.map(p => {
            const trimmed = p.trim();
            if (/^#{1,3}\s/.test(trimmed)) {
                const level = trimmed.match(/^(#{1,3})/)[1].length;
                const txt = trimmed.replace(/^#{1,3}\s*/, '');
                const sizes = { 1: '1.8em', 2: '1.4em', 3: '1.2em' };
                return `<h${level} style="font-size:${sizes[level]};font-weight:bold;margin:1em 0 0.5em;text-align:center;">${txt}</h${level}>`;
            }
            return `<p style="text-indent:${s.indent};margin-bottom:0.8em;">${trimmed}</p>`;
        }).join('');
    },

    // ========== Markdown ==========
    parseMD: () => {
        const input = document.getElementById('rc-md-input');
        const preview = document.getElementById('rc-md-preview');
        if (!input || !preview) return;
        if (typeof marked !== 'undefined') {
            preview.innerHTML = marked.parse(input.value || '');
        } else {
            preview.innerHTML = `<pre>${input.value}</pre>`;
        }
    },

    // ========== 导出到书架 ==========
    exportToLibrary: async (source) => {
        let content = '', name = '';
        if (source === 'typeset') {
            const paper = document.getElementById('rc-ty-paper');
            content = paper ? paper.innerText : '';
            name = '排版_' + new Date().toLocaleString();
        } else if (source === 'markdown') {
            const input = document.getElementById('rc-md-input');
            content = input ? input.value : '';
            name = 'MD_' + new Date().toLocaleString();
        }
        if (!content.trim()) return UI.toast('内容为空');
        const id = Utils.uuid();
        await DB.put('library_books', { id, name, content, size: content.length, date: new Date().toLocaleString() });
        UI.toast('已存入书架');
    },

    // ═══════════════════════════════════════════════════════════
    // 智能章节识别与导航
    // ═══════════════════════════════════════════════════════════
    smartChapterDetect: (content) => {
        const RC = Modules.reader_center;
        const patterns = [
            /^[第][一二三四五六七八九十百千\d]+[章节回集部卷][\s\S]{0,30}$/gm,
            /^[第][\d]+[章节回][\s\S]{0,30}$/gm,
            /^Chapter\s*\d+[\s\S]{0,30}$/gim,
            /^[【\[]第?[一二三四五六七八九十百千\d]+[章节回][】\]][\s\S]{0,30}$/gm,
            /^\d+[\.\、\s][\s\S]{0,50}$/gm
        ];
        const chapters = [];
        let chapterMatches = [];
        for (const pattern of patterns) {
            let match;
            const regex = new RegExp(pattern.source, pattern.flags);
            while ((match = regex.exec(content)) !== null) {
                chapterMatches.push({
                    title: match[0].trim().slice(0, 50),
                    index: match.index,
                    length: match[0].length
                });
            }
            if (chapterMatches.length > 3) break;
        }
        chapterMatches.sort((a, b) => a.index - b.index);
        chapterMatches = chapterMatches.filter((m, i, arr) => {
            if (i === 0) return true;
            return m.index - arr[i-1].index > 500;
        });
        for (let i = 0; i < chapterMatches.length; i++) {
            const start = chapterMatches[i].index;
            const end = (i < chapterMatches.length - 1) ? chapterMatches[i + 1].index : content.length;
            chapters.push({
                id: 'ch_' + i,
                number: i + 1,
                title: chapterMatches[i].title,
                start,
                end,
                content: content.slice(start, Math.min(end, start + 5000)),
                wordCount: content.slice(start, end).length
            });
        }
        if (chapters.length === 0 && content.length > 10000) {
            const chunkSize = 5000;
            const chunkCount = Math.ceil(content.length / chunkSize);
            for (let i = 0; i < chunkCount; i++) {
                const start = i * chunkSize;
                const end = Math.min((i + 1) * chunkSize, content.length);
                chapters.push({
                    id: 'ch_' + i,
                    number: i + 1,
                    title: '第' + (i + 1) + '部分',
                    start,
                    end,
                    content: content.slice(start, end),
                    wordCount: end - start
                });
            }
        }
        RC.chapters = chapters;
        RC.readingStats.totalChapters = chapters.length;
        return chapters;
    },

    renderChapterNav: () => {
        const RC = Modules.reader_center;
        if (RC.chapters.length === 0) return '';
        return `
            <div class="absolute left-0 top-0 bottom-0 w-48 bg-[#0a0a0c] border-r border-white/5 overflow-y-auto z-10" id="rc-chapter-nav">
                <div class="p-2 border-b border-white/5 sticky top-0 bg-[#0a0a0c]">
                    <div class="text-[9px] font-bold text-amber-400"><i class="fa-solid fa-list mr-1"></i>章节导航 (${RC.chapters.length})</div>
                </div>
                <div class="p-1 space-y-0.5">
                    ${RC.chapters.map((ch, i) => `
                        <button class="w-full text-left px-2 py-1.5 rounded text-[9px] transition-all ${RC.currentChapter === i ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-dim hover:bg-white/5 hover:text-white'}" onclick="Modules.reader_center.jumpToChapter(${i})">
                            <span class="text-[8px] text-dim mr-1">${ch.number}.</span>
                            <span class="truncate">${ch.title}</span>
                            <span class="text-[7px] text-dim ml-1">${ch.wordCount}字</span>
                        </button>
                    `).join('')}
                </div>
            </div>`;
    },

    jumpToChapter: (index) => {
        const RC = Modules.reader_center;
        if (!RC.chapters[index]) return;
        RC.currentChapter = index;
        const container = document.getElementById('rc-reader-container');
        if (container) {
            const targetEl = document.querySelector(`[data-chapter="${index}"]`);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth' });
            } else {
                const ch = RC.chapters[index];
                const percent = ch.start / (RC.currentBook?.content?.length || 1);
                container.scrollTop = container.scrollHeight * percent;
            }
        }
        RC._updateChapterHighlight();
    },

    _updateChapterHighlight: () => {
        const RC = Modules.reader_center;
        document.querySelectorAll('#rc-chapter-nav button').forEach((btn, i) => {
            if (i === RC.currentChapter) {
                btn.classList.add('bg-amber-500/20', 'text-amber-400', 'font-bold');
                btn.classList.remove('text-dim');
            } else {
                btn.classList.remove('bg-amber-500/20', 'text-amber-400', 'font-bold');
                btn.classList.add('text-dim');
            }
        });
    },

    // ═══════════════════════════════════════════════════════════
    // 实体自动提取与关联
    // ═══════════════════════════════════════════════════════════
    extractEntitiesFromBook: async (bookId) => {
        const RC = Modules.reader_center;
        const book = await DB.get('library_books', bookId);
        if (!book) return [];
        const content = book.content || '';
        const slice = content.slice(0, 8000);
        const prompt = `请从以下文本中提取所有重要实体，按类型分类输出JSON格式：

文本：
${slice}

要求提取的实体类型：
- 人物：主要角色、重要配角
- 物品：关键道具、法宝、神器
- 地点：重要场景、城市、秘境
- 势力：门派、组织、家族
- 魔法：功法、技能、特殊能力
- 情节：关键事件、转折点

输出格式（严格JSON）：
{
  "人物": [{"name":"名称", "desc":"简短描述"}],
  "物品": [...],
  "地点": [...],
  "势力": [...],
  "魔法": [...],
  "情节": [...]
}

只输出JSON，不要其他内容。`;

        try {
            const result = await AI.generate(prompt);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const entities = JSON.parse(jsonMatch[0]);
                const flatEntities = [];
                for (const [type, items] of Object.entries(entities)) {
                    if (Array.isArray(items)) {
                        items.forEach(item => {
                            if (item.name) {
                                flatEntities.push({
                                    name: item.name,
                                    type,
                                    desc: item.desc || '',
                                    source: 'reader_extract',
                                    bookId,
                                    bookName: book.name
                                });
                            }
                        });
                    }
                }
                RC._extractedEntities = flatEntities;
                return flatEntities;
            }
        } catch (e) {
            console.error('实体提取失败:', e);
        }
        return [];
    },

    injectEntitiesToWorld: async () => {
        const RC = Modules.reader_center;
        const entities = RC._extractedEntities;
        if (!entities || entities.length === 0) {
            return UI.toast('没有可注入的实体，请先提取');
        }
        if (!Modules.world_engine) {
            return UI.toast('世界引擎未加载');
        }
        await Modules.world_engine._ensureCache();
        const existingEntities = Modules.world_engine._cachedEntities || [];
        const existingNameMap = new Map();
        existingEntities.forEach(e => {
            if (e.name) {
                existingNameMap.set(e.name.toLowerCase().trim(), e);
            }
        });
        // 检测当前书籍中的循环标记，为实体附加 cycleIds
        let bookCycleIds = [];
        if (RC.currentBook && RC.currentBook.content) {
            const cycleMatches = RC.currentBook.content.match(/【循环[\d]+-[\d]+】/g);
            if (cycleMatches) {
                bookCycleIds = [...new Set(cycleMatches.map(m => m.replace(/[【】]/g, '')))];
            }
        }
        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        const now = Date.now();
        for (const ent of entities) {
            if (!ent.name) continue;
            const normalizedName = ent.name.toLowerCase().trim();
            const existingEntity = existingNameMap.get(normalizedName);
            const cycleIds = bookCycleIds.length > 0 ? bookCycleIds : (ent.cycleIds || []);
            if (existingEntity) {
                if (existingEntity.desc !== ent.desc || existingEntity.type !== ent.type) {
                    const entityData = {
                        id: existingEntity.id,
                        name: ent.name,
                        type: ent.type || existingEntity.type || '其他',
                        desc: ent.desc || existingEntity.desc,
                        relations: existingEntity.relations || [],
                        source: existingEntity.source || 'reader_extract',
                        cycleIds: cycleIds.length > 0 ? cycleIds : (existingEntity.cycleIds || []),
                        updatedAt: now
                    };
                    await DB.put('entities', entityData);
                    updatedCount++;
                } else {
                    skippedCount++;
                }
            } else {
                const id = 'reader_' + Utils.uuid();
                const entityData = {
                    id,
                    name: ent.name,
                    type: ent.type || '其他',
                    desc: ent.desc || '',
                    relations: [],
                    source: 'reader_extract',
                    cycleIds: cycleIds,
                    updatedAt: now
                };
                await DB.put('entities', entityData);
                addedCount++;
            }
        }
        Modules.world_engine._cachedEntities = null;
        let message = `实体注入完成！新增: ${addedCount}，更新: ${updatedCount}`;
        if (skippedCount > 0) message += `，跳过: ${skippedCount}`;
        UI.toast(message);
        RC._extractedEntities = [];
    },

    // ═══════════════════════════════════════════════════════════
    // NEXUS 阅读面板 & 选中文本分析
    // ═══════════════════════════════════════════════════════════
    _toggleNexusPanel: () => {
        const RC = Modules.reader_center;
        RC._nexusPanelOpen = !RC._nexusPanelOpen;
        const panel = document.getElementById('rc-nexus-panel');
        const icon = document.getElementById('rc-nexus-toggle-icon');
        if (panel) {
            if (RC._nexusPanelOpen) {
                panel.classList.remove('translate-x-full');
                panel.classList.add('translate-x-0');
            } else {
                panel.classList.add('translate-x-full');
                panel.classList.remove('translate-x-0');
            }
        }
        if (icon) icon.className = RC._nexusPanelOpen ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left';
    },

    _renderNexusPanel: async (cycleData) => {
        const RC = Modules.reader_center;
        const container = document.getElementById('rc-nexus-content');
        if (!container) return;
        if (!cycleData) {
            container.innerHTML = `<div class="text-[10px] text-dim text-center py-4">未检测到循环标记<br><span class="text-[9px] opacity-50">滚动到含【循环X-Y】的段落以激活</span></div>`;
            return;
        }
        const { cycleId, chr, wld, foe, emo } = cycleData;
        const chrItems = (chr || []).map(c => `<div class="text-[9px] text-gray-300 truncate"><span class="text-amber-500/80">●</span> ${c}</div>`).join('') || '<div class="text-[9px] text-dim italic">无数据</div>';
        const wldItems = (wld || []).map(w => `<div class="text-[9px] text-gray-300 truncate"><span class="text-blue-500/80">●</span> ${w}</div>`).join('') || '<div class="text-[9px] text-dim italic">无数据</div>';
        const foeItems = (foe || []).map(f => `<div class="text-[9px] text-gray-300 truncate"><span class="text-purple-500/80">●</span> ${f}</div>`).join('') || '<div class="text-[9px] text-dim italic">无数据</div>';
        const emoItems = (emo || []).map(e => `<div class="text-[9px] text-gray-300 truncate"><span class="text-rose-500/80">●</span> ${e}</div>`).join('') || '<div class="text-[9px] text-dim italic">无数据</div>';
        container.innerHTML = `
            <div class="space-y-2">
                <div class="p-2 bg-[#08080a] rounded border border-white/5">
                    <div class="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 mb-1">
                        <i class="fa-solid fa-rotate text-[9px]"></i>当前循环
                    </div>
                    <div class="text-[11px] text-white font-mono">${cycleId}</div>
                </div>
                <div class="p-2 bg-[#08080a] rounded border border-white/5">
                    <div class="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 mb-1">
                        <i class="fa-solid fa-user text-[9px]"></i>CHR 角色状态
                    </div>
                    <div class="space-y-0.5">${chrItems}</div>
                </div>
                <div class="p-2 bg-[#08080a] rounded border border-white/5">
                    <div class="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 mb-1">
                        <i class="fa-solid fa-globe text-[9px]"></i>WLD 世界规则
                    </div>
                    <div class="space-y-0.5">${wldItems}</div>
                </div>
                <div class="p-2 bg-[#08080a] rounded border border-white/5">
                    <div class="flex items-center gap-1.5 text-[10px] font-bold text-purple-500 mb-1">
                        <i class="fa-solid fa-network-wired text-[9px]"></i>FOE 伏笔网络
                    </div>
                    <div class="space-y-0.5">${foeItems}</div>
                </div>
                <div class="p-2 bg-[#08080a] rounded border border-white/5">
                    <div class="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 mb-1">
                        <i class="fa-solid fa-heart-pulse text-[9px]"></i>EMO 情绪锚点
                    </div>
                    <div class="space-y-0.5">${emoItems}</div>
                </div>
            </div>`;
    },

    _detectCycleOnScroll: async (scrollTop) => {
        const RC = Modules.reader_center;
        const container = document.getElementById('rc-reader-container');
        if (!container || !RC.currentBook) return;
        const contentEl = document.getElementById('rc-reader-content');
        if (!contentEl) return;
        // 找到当前视口中心的段落
        const centerY = scrollTop + container.clientHeight / 2;
        const paragraphs = Array.from(contentEl.querySelectorAll('p, h1, h2, h3'));
        let target = null;
        for (const p of paragraphs) {
            const top = p.offsetTop;
            const bottom = top + p.offsetHeight;
            if (centerY >= top && centerY <= bottom) {
                target = p;
                break;
            }
        }
        if (!target) return;
        const text = target.innerText || '';
        const match = text.match(/【循环([\d]+-[\d]+)】/);
        if (match) {
            const cycleId = match[1];
            if (RC._currentCycleId !== cycleId) {
                RC._currentCycleId = cycleId;
                try {
                    const cycleData = await DB.get('cycles', cycleId);
                    if (cycleData) {
                        await RC._renderNexusPanel(cycleData);
                    } else {
                        await RC._renderNexusPanel({
                            cycleId,
                            chr: ['未入库，请在循环编辑器中补全'],
                            wld: ['未入库，请在循环编辑器中补全'],
                            foe: ['未入库，请在循环编辑器中补全'],
                            emo: ['未入库，请在循环编辑器中补全']
                        });
                    }
                } catch (e) {
                    await RC._renderNexusPanel({
                        cycleId,
                        chr: [], wld: [], foe: [], emo: []
                    });
                }
            }
        } else {
            if (RC._currentCycleId !== null) {
                RC._currentCycleId = null;
                RC._renderNexusPanel(null);
            }
        }
    },

    _bindSelectionListener: () => {
        const RC = Modules.reader_center;
        const container = document.getElementById('rc-reader-container');
        if (!container) return;
        container.onmouseup = (e) => {
            if (RC._selectionPopupTimer) clearTimeout(RC._selectionPopupTimer);
            RC._selectionPopupTimer = setTimeout(() => {
                const sel = window.getSelection();
                const text = sel ? sel.toString().trim() : '';
                const popup = document.getElementById('rc-selection-popup');
                if (!popup) return;
                if (text.length > 0 && text.length < 2000) {
                    const rect = sel.getRangeAt(0).getBoundingClientRect();
                    const readerRect = document.getElementById('rc-reader-view').getBoundingClientRect();
                    popup.style.left = (rect.left - readerRect.left + rect.width / 2 - popup.offsetWidth / 2) + 'px';
                    popup.style.top = (rect.top - readerRect.top - popup.offsetHeight - 8) + 'px';
                    popup.classList.remove('hidden');
                    popup.dataset.selectedText = text;
                } else {
                    popup.classList.add('hidden');
                }
            }, 200);
        };
        container.onmousedown = () => {
            const popup = document.getElementById('rc-selection-popup');
            if (popup) popup.classList.add('hidden');
        };
    },

    analyzeSelection: async (mode) => {
        const RC = Modules.reader_center;
        const popup = document.getElementById('rc-selection-popup');
        const text = popup ? popup.dataset.selectedText : '';
        if (!text) return UI.toast('未检测到选中文本');
        const modal = document.getElementById('rc-analysis-modal');
        const title = document.getElementById('rc-analysis-title');
        const body = document.getElementById('rc-analysis-body');
        if (!modal || !body) return;
        const modeNames = { technique: '技法拆解', entity: '实体提取', nexus: 'NEXUS 标注' };
        if (title) title.innerText = modeNames[mode] || '分析结果';
        body.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-amber-500 mr-1"></i>分析中...';
        modal.classList.remove('hidden');
        const prompts = {
            technique: `请对以下文本进行技法拆解分析，要求：\n1. 识别修辞手法（比喻、拟人、排比等）\n2. 分析叙事视角和节奏\n3. 指出人物塑造技巧\n4. 提取可学习的写作技法\n\n文本：\n${text}`,
            entity: `请从以下文本中提取所有重要实体（人物、地点、物品、势力等），并给出简要描述和相互关系：\n\n${text}`,
            nexus: `请将以下文本按照 NEXUS OS 协议进行标注分析：\n- CHR：涉及的角色及其状态变化\n- WLD：体现的世界规则或设定\n- FOE：埋下的伏笔或悬念\n- EMO：情绪锚点和氛围营造\n\n文本：\n${text}`
        };
        const prompt = prompts[mode] || prompts.technique;
        try {
            const result = await AI.generate(prompt);
            body.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
        } catch (e) {
            body.innerHTML = `<div class="text-red-400">分析失败: ${e.message || '未知错误'}</div>`;
        }
    },

    sendToFusion: async () => {
        const RC = Modules.reader_center;
        const popup = document.getElementById('rc-selection-popup');
        const text = popup ? popup.dataset.selectedText : '';
        if (!text) return UI.toast('未检测到选中文本');
        if (!Modules.fusion_book) {
            // 尝试导航到融合拆书模块
            if (typeof App !== 'undefined' && App.nav) {
                App.nav('fusion_book');
                setTimeout(() => {
                    if (Modules.fusion_book && Modules.fusion_book.receiveText) {
                        Modules.fusion_book.receiveText(text, RC.currentBook?.name || '未知书籍');
                        UI.toast('已发送到融合拆书');
                    } else {
                        UI.toast('融合拆书模块未就绪');
                    }
                }, 600);
                return;
            }
            return UI.toast('融合拆书模块未加载');
        }
        if (Modules.fusion_book.receiveText) {
            Modules.fusion_book.receiveText(text, RC.currentBook?.name || '未知书籍');
            UI.toast('已发送到融合拆书');
        } else {
            UI.toast('融合拆书接口不可用');
        }
    },

    // ═══════════════════════════════════════════════════════════
    // 与世界引擎联动
    // ═══════════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════════
    // 三层记忆集成
    // ═══════════════════════════════════════════════════════════
    buildReadingContext: async (query, options = {}) => {
        const RC = Modules.reader_center;
        const {
            maxTokens = 4000,
            includeMemory = true,
            includeRAG = true,
            includeEntities = true
        } = options;
        let context = '';
        if (includeMemory && Modules.memory) {
            try {
                const memCtx = await Modules.memory.buildBrainContext(query, {
                    moduleName: 'reader_center',
                    maxTokens: 1500,
                    includeWorking: true,
                    includePersistent: true,
                    includeRAG: false
                });
                if (memCtx) context += '【记忆上下文】\n' + memCtx + '\n\n';
            } catch (e) {}
        }
        if (includeRAG && typeof RAGSystem !== 'undefined') {
            try {
                const ragCtx = await RAGSystem.buildEnhancedContext(query, {
                    moduleName: 'reader_center',
                    maxTokens: 1500
                });
                if (ragCtx) context += '【RAG检索】\n' + ragCtx + '\n\n';
            } catch (e) {}
        }
        if (includeEntities && RC.bookEntities.length > 0) {
            const entityCtx = RC.bookEntities.slice(0, 20).map(e => 
                `[${e.type}] ${e.name}: ${e.desc || ''}`
            ).join('\n');
            context += '【相关实体】\n' + entityCtx + '\n\n';
        }
        if (RC.currentBook) {
            const bookCtx = RC.currentBook.content.slice(0, 2000);
            context += '【当前书籍片段】\n' + bookCtx + '\n\n';
        }
        return context.slice(0, maxTokens);
    },

    recordToMemory: async (type, content, metadata = {}) => {
        const RC = Modules.reader_center;
        if (!Modules.memory) return;
        try {
            if (type === 'chapter') {
                await Modules.memory.addChapterMemory(
                    metadata.chapterId || 'unknown',
                    content,
                    {
                        bookId: RC.currentBook?.id,
                        bookName: RC.currentBook?.name,
                        ...metadata
                    }
                );
            } else if (type === 'entity') {
                await Modules.memory.addEntityMemory(
                    metadata.entityName || 'unknown',
                    content,
                    metadata.entityType || '其他'
                );
            } else {
                await Modules.memory.add('reader_center', content, {
                    type,
                    bookId: RC.currentBook?.id,
                    bookName: RC.currentBook?.name,
                    ...metadata
                });
            }
        } catch (e) {
            console.log('记忆记录失败:', e);
        }
    },

    // ═══════════════════════════════════════════════════════════
    // 阅读统计与洞察
    // ═══════════════════════════════════════════════════════════
    analyzeReadingStats: async () => {
        const RC = Modules.reader_center;
        if (!RC.currentBook) return null;
        const content = RC.currentBook.content || '';
        const stats = {
            totalWords: content.length,
            totalChapters: RC.chapters.length,
            avgChapterLen: RC.chapters.length > 0 ? Math.round(content.length / RC.chapters.length) : content.length,
            readingTime: Math.round(content.length / 500),
            paragraphs: (content.match(/\n{2,}|\r\n\r\n/g) || []).length + 1,
            sentences: (content.match(/[。！？\.\!\?]/g) || []).length,
            dialogues: (content.match(/["「」『』""]/g) || []).length / 2,
            entities: RC._extractedEntities.length,
            relations: 0
        };
        RC.readingStats = stats;
        return stats;
    },

    renderStatsPanel: () => {
        const RC = Modules.reader_center;
        const s = RC.readingStats;
        return `
            <div class="p-3 bg-black/20 rounded-lg border border-white/5">
                <div class="text-[10px] font-bold text-amber-400 mb-2"><i class="fa-solid fa-chart-bar mr-1"></i>阅读统计</div>
                <div class="grid grid-cols-2 gap-2 text-[9px]">
                    <div class="flex justify-between"><span class="text-dim">总字数</span><span class="text-white font-mono">${s.totalWords?.toLocaleString() || 0}</span></div>
                    <div class="flex justify-between"><span class="text-dim">章节数</span><span class="text-white font-mono">${s.totalChapters || 0}</span></div>
                    <div class="flex justify-between"><span class="text-dim">平均章节</span><span class="text-white font-mono">${s.avgChapterLen?.toLocaleString() || 0}字</span></div>
                    <div class="flex justify-between"><span class="text-dim">预计阅读</span><span class="text-white font-mono">${s.readingTime || 0}分钟</span></div>
                    <div class="flex justify-between"><span class="text-dim">段落数</span><span class="text-white font-mono">${s.paragraphs || 0}</span></div>
                    <div class="flex justify-between"><span class="text-dim">对话数</span><span class="text-white font-mono">${Math.round(s.dialogues || 0)}</span></div>
                    <div class="flex justify-between"><span class="text-dim">提取实体</span><span class="text-amber-400 font-mono">${s.entities || 0}</span></div>
                    <div class="flex justify-between"><span class="text-dim">句数</span><span class="text-white font-mono">${s.sentences || 0}</span></div>
                </div>
            </div>`;
    },

    // ═══════════════════════════════════════════════════════════
    // 智能推荐与创作联动
    // ═══════════════════════════════════════════════════════════
    smartSuggest: async () => {
        const RC = Modules.reader_center;
        if (!RC.currentBook) return;
        const content = RC.currentBook.content.slice(0, 5000);
        const prompt = `分析以下文本，给出创作建议：

${content}

请从以下角度分析：
1. 写作风格特点（叙事节奏、语言风格、视角运用）
2. 可借鉴的技法（开头钩子、悬念设置、人物塑造）
3. 潜在改进点（节奏调整、细节补充、逻辑优化）
4. 创作灵感延伸（相似题材、变体方向、融合建议）

简洁输出，每项2-3条。`;

        const log = document.getElementById('rc-ai-log');
        if (log) {
            log.innerHTML += `<div class="p-2 bg-white/5 rounded text-[10px] text-dim"><i class="fa-solid fa-spinner fa-spin mr-1 text-amber-500"></i>智能分析中...</div>`;
        }
        try {
            const result = await AI.generate(prompt);
            if (log) {
                log.innerHTML += `
                    <div class="p-2 bg-gradient-to-br from-purple-900/20 to-transparent border border-purple-500/20 rounded-lg text-[10px] text-gray-300 leading-relaxed">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-purple-400 font-bold text-[9px]"><i class="fa-solid fa-lightbulb mr-1"></i>创作建议</span>
                            <button class="text-dim hover:text-white" onclick="Utils.copy(this.closest('.p-2').querySelector('.ai-suggest-text').innerText);UI.toast('已复制')"><i class="fa-solid fa-copy"></i></button>
                        </div>
                        <div class="ai-suggest-text whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>
                    </div>`;
                log.scrollTop = log.scrollHeight;
            }
        } catch (e) {
            if (log) {
                log.innerHTML += `<div class="p-2 bg-red-900/20 border border-red-500/20 rounded text-[10px] text-red-400">分析失败: ${e.message}</div>`;
            }
        }
    },

    extractToCreation: async (type) => {
        const RC = Modules.reader_center;
        if (!RC.currentBook) return UI.toast('请先打开一本书');
        const content = RC.currentBook.content.slice(0, 6000);
        const prompts = {
            outline: `从以下文本中提取故事大纲结构，输出为可用的创作框架：\n\n${content}\n\n要求：\n1. 提取核心故事线\n2. 列出关键转折点\n3. 标注高潮和结局\n4. 输出为Markdown格式的大纲`,
            characters: `从以下文本中提取人物设定模板：\n\n${content}\n\n要求：\n1. 提取主要人物的性格特征\n2. 分析人物关系网络\n3. 总结人物塑造手法\n4. 输出可直接使用的人物卡模板`,
            worldbuilding: `从以下文本中提取世界观设定：\n\n${content}\n\n要求：\n1. 提取核心设定规则\n2. 列出势力/组织体系\n3. 总结魔法/科技体系\n4. 输出为世界观设定文档`,
            techniques: `分析以下文本的写作技法：\n\n${content}\n\n要求：\n1. 分析叙事技巧\n2. 总结对话写法\n3. 提取场景描写手法\n4. 输出技法总结和示例`
        };
        const prompt = prompts[type] || prompts.outline;
        const log = document.getElementById('rc-ai-log');
        if (log) {
            log.innerHTML += `<div class="p-2 bg-white/5 rounded text-[10px] text-dim"><i class="fa-solid fa-spinner fa-spin mr-1 text-amber-500"></i>提取中...</div>`;
        }
        try {
            const result = await AI.generate(prompt);
            if (Modules.phoenix) {
                Modules.phoenix.data.outlineRaw = result;
                UI.toast('已提取到凤凰创作流');
            }
            if (log) {
                log.innerHTML += `
                    <div class="p-2 bg-gradient-to-br from-green-900/20 to-transparent border border-green-500/20 rounded-lg text-[10px] text-gray-300 leading-relaxed">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-green-400 font-bold text-[9px]"><i class="fa-solid fa-file-export mr-1"></i>提取结果</span>
                            <div class="flex gap-1">
                                <button class="text-dim hover:text-white" onclick="Utils.copy(this.closest('.p-2').querySelector('.ai-extract-text').innerText);UI.toast('已复制')"><i class="fa-solid fa-copy"></i></button>
                                <button class="text-dim hover:text-amber-400" onclick="App.nav('phoenix')">前往凤凰流</button>
                            </div>
                        </div>
                        <div class="ai-extract-text whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>
                    </div>`;
                log.scrollTop = log.scrollHeight;
            }
        } catch (e) {
            if (log) {
                log.innerHTML += `<div class="p-2 bg-red-900/20 border border-red-500/20 rounded text-[10px] text-red-400">提取失败: ${e.message}</div>`;
            }
        }
    },

    // ═══════════════════════════════════════════════════════════
    // RAG深度集成
    // ═══════════════════════════════════════════════════════════
    indexBookToRAG: async (bookId) => {
        const RC = Modules.reader_center;
        const book = await DB.get('library_books', bookId);
        if (!book) return UI.toast('找不到书籍');
        if (typeof RAGSystem === 'undefined') return UI.toast('RAG系统未加载');
        const content = book.content || '';
        const chunks = RC.chapters.length > 0 ? RC.chapters : RC.smartChapterDetect(content);
        let indexed = 0;
        for (const chunk of chunks) {
            try {
                await RAGSystem.addDocument(
                    `${book.name} - ${chunk.title}`,
                    chunk.content || content.slice(chunk.start, chunk.end),
                    'library',
                    {
                        bookId,
                        bookName: book.name,
                        chapter: chunk.number,
                        chapterTitle: chunk.title
                    }
                );
                indexed++;
            } catch (e) {
                console.log('RAG索引失败:', e);
            }
        }
        UI.toast(`已索引 ${indexed} 个片段到RAG`);
    },

    searchInRAG: async (query) => {
        if (typeof RAGSystem === 'undefined') return [];
        try {
            const results = await RAGSystem.search(query, 10);
            return results;
        } catch (e) {
            console.log('RAG搜索失败:', e);
            return [];
        }
    },

    // ═══════════════════════════════════════════════════════════
    // 阅读增强工具
    // ═══════════════════════════════════════════════════════════
    quickTranslate: async () => {
        const RC = Modules.reader_center;
        const sel = window.getSelection();
        const text = sel ? sel.toString().trim() : '';
        if (!text) return UI.toast('请先选择文本');
        try {
            const result = await AI.generate(`翻译以下中文为英文，保持文学性：\n\n${text}`);
            UI.toast(result, 3000);
        } catch (e) {
            UI.toast('翻译失败');
        }
    },

    quickExplain: async () => {
        const RC = Modules.reader_center;
        const sel = window.getSelection();
        const text = sel ? sel.toString().trim() : '';
        if (!text) return UI.toast('请先选择文本');
        const context = await RC.buildReadingContext(text, { maxTokens: 2000 });
        const prompt = `${context}\n\n请解释以下选中文本的含义、背景和写作手法：\n\n"${text}"`;
        const log = document.getElementById('rc-ai-log');
        if (log) {
            log.innerHTML += `<div class="p-2 bg-white/5 rounded text-[10px] text-dim"><i class="fa-solid fa-spinner fa-spin mr-1 text-amber-500"></i>解释中...</div>`;
        }
        try {
            const result = await AI.generate(prompt);
            if (log) {
                log.innerHTML += `
                    <div class="p-2 bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-300 leading-relaxed">
                        <div class="text-amber-400 font-bold text-[9px] mb-1"><i class="fa-solid fa-quote-left mr-1"></i>文本解释</div>
                        <div class="text-dim italic mb-2 line-clamp-2">"${text}"</div>
                        <div class="whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>
                    </div>`;
                log.scrollTop = log.scrollHeight;
            }
        } catch (e) {
            if (log) {
                log.innerHTML += `<div class="p-2 bg-red-900/20 rounded text-[10px] text-red-400">解释失败</div>`;
            }
        }
    },

    quickContinue: async () => {
        const RC = Modules.reader_center;
        if (!RC.currentBook) return UI.toast('请先打开一本书');
        const content = RC.currentBook.content || '';
        const lastPart = content.slice(-3000);
        const context = await RC.buildReadingContext(lastPart, { maxTokens: 2000 });
        const prompt = `${context}\n\n请根据上文续写500字左右，保持相同的风格和叙事节奏：`;
        const log = document.getElementById('rc-ai-log');
        if (log) {
            log.innerHTML += `<div class="p-2 bg-white/5 rounded text-[10px] text-dim"><i class="fa-solid fa-spinner fa-spin mr-1 text-amber-500"></i>续写中...</div>`;
        }
        try {
            const result = await AI.generate(prompt);
            if (log) {
                log.innerHTML += `
                    <div class="p-2 bg-gradient-to-br from-cyan-900/20 to-transparent border border-cyan-500/20 rounded-lg text-[10px] text-gray-300 leading-relaxed">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-cyan-400 font-bold text-[9px]"><i class="fa-solid fa-pen-fancy mr-1"></i>续写结果</span>
                            <div class="flex gap-1">
                                <button class="text-dim hover:text-white" onclick="Utils.copy(this.closest('.p-2').querySelector('.ai-continue-text').innerText);UI.toast('已复制')"><i class="fa-solid fa-copy"></i></button>
                                <button class="text-dim hover:text-amber-400" onclick="ContextHelper.exportToLibrary('续写_${RC.currentBook?.name||''}',this.closest('.p-2').querySelector('.ai-continue-text').innerText);UI.toast('已存书架')"><i class="fa-solid fa-book"></i></button>
                            </div>
                        </div>
                        <div class="ai-continue-text whitespace-pre-wrap">${result}</div>
                    </div>`;
                log.scrollTop = log.scrollHeight;
            }
            RC.recordToMemory('generation', result, { type: 'continuation' });
        } catch (e) {
            if (log) {
                log.innerHTML += `<div class="p-2 bg-red-900/20 rounded text-[10px] text-red-400">续写失败</div>`;
            }
        }
    },

    // ═══════════════════════════════════════════════════════════
    // 与世界引擎联动
    // ═══════════════════════════════════════════════════════════
    linkToWorldEngine: async () => {
        const RC = Modules.reader_center;
        if (!RC.currentBook) return UI.toast('请先打开一本书');
        if (!Modules.world_engine) return UI.toast('世界引擎未加载');
        await RC.extractEntitiesFromBook(RC.currentBook.id);
        if (RC._extractedEntities.length > 0) {
            const confirmed = confirm(`发现 ${RC._extractedEntities.length} 个实体，是否注入世界引擎？`);
            if (confirmed) {
                await RC.injectEntitiesToWorld();
            }
        } else {
            UI.toast('未发现可提取的实体');
        }
    },

    pullFromWorldEngine: async () => {
        const RC = Modules.reader_center;
        if (!Modules.world_engine) return;
        await Modules.world_engine._ensureCache();
        const entities = Modules.world_engine._cachedEntities || [];
        RC.bookEntities = entities.filter(e => !e.id.startsWith('world_')).slice(0, 50);
        UI.toast(`已加载 ${RC.bookEntities.length} 个实体`);
    }
};


// ============================================
// 网页对话 (web_chat) - 大幅升级版
// 5种AI人格 + 会话管理 + RAG上下文 + 打字动画 + IO调试
// 新增: 多轮记忆 + 对话导出 + 快捷指令 + 角色自定义 + 对话分支
// ============================================
Modules.web_chat = {
    sessions: [],
    currentSession: null,
    personas: {
        assistant: { name: '智能助手', icon: 'fa-robot', color: 'blue', desc: '通用AI助手，擅长回答各类问题', system: '你是一个智能助手，请用中文回答用户的问题。' },
        writer:    { name: '写作导师', icon: 'fa-feather-pointed', color: 'amber', desc: '专业写作指导，提供创作建议', system: '你是一位资深写作导师，擅长小说创作指导、文笔提升、情节设计。请用专业但亲切的语气回答。' },
        critic:    { name: '文学评论家', icon: 'fa-glasses', color: 'purple', desc: '犀利的文学批评与深度分析', system: '你是一位严谨的文学评论家，擅长深度文本分析、主题解读、写作技巧评价。请给出专业、有深度的评论。' },
        editor:    { name: '责任编辑', icon: 'fa-pen-ruler', color: 'green', desc: '出版级别的编辑建议', system: '你是一位经验丰富的责任编辑，擅长发现文稿问题、提出修改建议、优化文本结构。请给出具体可操作的编辑意见。' },
        custom:    { name: '自定义角色', icon: 'fa-masks-theater', color: 'pink', desc: '自定义AI人格', system: '' }
    },
    currentPersona: 'assistant',
    ragEnabled: false,
    typing: false,
    shortcuts: [
        { cmd: '/续写', prompt: '请根据上文继续续写300字：' },
        { cmd: '/润色', prompt: '请润色以下文本，提升文笔质量：' },
        { cmd: '/扩写', prompt: '请将以下内容扩写为更详细的段落：' },
        { cmd: '/缩写', prompt: '请将以下内容精简为简洁的摘要：' },
        { cmd: '/翻译', prompt: '请将以下内容翻译为英文：' },
        { cmd: '/大纲', prompt: '请为以下主题生成一个详细的写作大纲：' },
        { cmd: '/workflow', prompt: '调用工作流 (用法: /workflow 工作流名称 输入内容)' },
        { cmd: '/agent', prompt: '调用智能体 (用法: /agent 智能体名称 消息)' },
        { cmd: '/rag', prompt: '调用RAG检索 (用法: /rag 关键词)' }
    ],

    render: () => {
        const WC = Modules.web_chat;
        const p = WC.personas[WC.currentPersona];
        return `
        <div class="flex h-full bg-[#09090b] text-[#e4e4e7] overflow-hidden" id="wc-root">
            <!-- 左侧会话列表 -->
            <div class="w-64 shrink-0 bg-[#111113] border-r border-white/5 flex flex-col">
                <div class="p-3 border-b border-white/5 bg-gradient-to-r from-blue-900/20 to-transparent">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-7 h-7 rounded-lg bg-blue-600/20 flex center border border-blue-600/40 text-blue-500"><i class="fa-solid fa-comments"></i></div>
                        <div>
                            <h2 class="text-sm font-bold text-white">网页对话</h2>
                            <p class="text-[8px] text-dim">多角色 · 多会话 · RAG增强</p>
                        </div>
                    </div>
                    <div class="flex gap-1">
                        <button class="btn flex-1 h-8 rounded bg-blue-600/20 text-blue-400 border border-blue-600/40 hover:bg-blue-600 hover:text-white font-bold text-[10px] flex center gap-1" onclick="Modules.web_chat.newSession()">
                            <i class="fa-solid fa-plus"></i> 新对话
                        </button>
                        <button class="btn h-8 w-8 rounded bg-red-600/20 text-red-400 border border-red-600/40 hover:bg-red-600 hover:text-white text-xs" onclick="Modules.web_chat.delCurrentSession()" title="删除当前对话 (Ctrl+D)">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                        <button class="btn h-8 w-8 rounded bg-yellow-600/20 text-yellow-400 border border-yellow-600/40 hover:bg-yellow-600 hover:text-white text-xs" onclick="Modules.web_chat.clearSession()" title="清空当前对话内容 (Ctrl+L)">
                            <i class="fa-solid fa-broom"></i>
                        </button>
                    </div>
                </div>
                <!-- 角色选择 -->
                <div class="p-2 border-b border-white/5">
                    <div class="text-[8px] font-bold text-dim uppercase tracking-wider px-1 mb-1">AI 角色</div>
                    <div class="flex flex-wrap gap-1">
                        ${Object.entries(WC.personas).map(([k, v]) => `
                            <button class="px-2 py-1 rounded text-[9px] flex items-center gap-1 transition-all ${WC.currentPersona === k ? `bg-${v.color}-500/20 text-${v.color}-400 border border-${v.color}-500/40 font-bold` : 'bg-white/5 text-dim hover:text-white border border-transparent'}" onclick="Modules.web_chat.setPersona('${k}')" title="${v.desc}">
                                <i class="fa-solid ${v.icon} text-[8px]"></i>${v.name}
                            </button>
                        `).join('')}
                    </div>
                </div>
                <!-- 会话列表 -->
                <div class="flex-1 overflow-y-auto p-2 space-y-1" id="wc-session-list"></div>
                <!-- 底部控制 -->
                <div class="p-2 border-t border-white/5 space-y-1">
                    <div class="flex items-center justify-between px-1">
                        <label class="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" class="accent-blue-500 w-3 h-3" ${WC.ragEnabled ? 'checked' : ''} onchange="Modules.web_chat.ragEnabled=this.checked">
                            <span class="text-[9px] text-dim">RAG 上下文增强</span>
                        </label>
                    </div>
                    <button class="btn w-full h-7 text-[9px] bg-white/5 hover:bg-white/10 text-dim" onclick="Modules.web_chat.exportAll()"><i class="fa-solid fa-download mr-1"></i>导出全部对话</button>
                </div>
            </div>
            <!-- 右侧对话区 -->
            <div class="flex-1 flex flex-col relative">
                <!-- 顶栏 -->
                <div class="h-10 flex items-center justify-between px-4 bg-[#111113]/80 backdrop-blur border-b border-white/5 shrink-0">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid ${p.icon} text-${p.color}-400"></i>
                        <span class="text-xs font-bold text-white" id="wc-session-title">${WC.currentSession?.title || '新对话'}</span>
                        <span class="text-[8px] text-dim bg-white/5 px-1.5 py-0.5 rounded">${p.name}</span>
                    </div>
                    <div class="flex gap-1">
                        <button class="w-7 h-7 rounded hover:bg-white/10 flex center text-dim text-xs" onclick="Modules.web_chat.toggleIO()" title="IO调试"><i class="fa-solid fa-terminal"></i></button>
                        <button class="w-7 h-7 rounded hover:bg-white/10 flex center text-dim text-xs" onclick="Modules.web_chat.exportSession()" title="导出"><i class="fa-solid fa-file-export"></i></button>
                        <button class="w-7 h-7 rounded hover:bg-white/10 flex center text-dim text-xs" onclick="Modules.web_chat.clearSession()" title="清空"><i class="fa-solid fa-broom"></i></button>
                    </div>
                </div>
                <!-- IO 调试面板 -->
                <div id="wc-io-panel" class="hidden bg-[#0a0a0c] border-b border-white/5 h-32 flex gap-2 p-2 shrink-0">
                    <div class="flex-1 flex flex-col">
                        <span class="text-[8px] font-bold text-blue-400 mb-0.5">发送 (Prompt)</span>
                        <textarea id="wc-io-in" class="flex-1 bg-black/50 border border-white/5 rounded p-1.5 text-[9px] text-gray-400 font-mono resize-none" readonly></textarea>
                    </div>
                    <div class="flex-1 flex flex-col">
                        <span class="text-[8px] font-bold text-green-400 mb-0.5">接收 (Response)</span>
                        <textarea id="wc-io-out" class="flex-1 bg-black/50 border border-white/5 rounded p-1.5 text-[9px] text-green-400 font-mono resize-none" readonly></textarea>
                    </div>
                </div>
                <!-- 消息区 -->
                <div class="flex-1 overflow-y-auto p-4 space-y-3" id="wc-messages">
                    <div class="flex flex-col items-center justify-center h-full text-dim opacity-30">
                        <i class="fa-solid ${p.icon} text-4xl mb-3"></i>
                        <p class="text-sm font-bold">${p.name}</p>
                        <p class="text-xs mt-1">${p.desc}</p>
                    </div>
                </div>
                <!-- 快捷指令 -->
                <div id="wc-shortcuts" class="hidden absolute bottom-[88px] left-4 right-4 bg-[#1a1a1c] border border-white/10 rounded-lg shadow-xl p-2 z-30">
                    ${WC.shortcuts.map((s, i) => `
                        <button class="w-full text-left px-3 py-1.5 rounded text-xs hover:bg-white/10 text-gray-300" onclick="Modules.web_chat.useShortcut(${i})">${s.cmd} <span class="text-dim ml-2">${s.prompt.slice(0, 20)}...</span></button>
                    `).join('')}
                </div>
                <!-- 输入区 -->
                <div class="p-3 bg-[#111113] border-t border-white/5 shrink-0">
                    <div class="space-y-1.5 mb-2" id="wc-quick-guide">
                        <div class="flex gap-1">
                            <button class="flex-1 px-2 py-1.5 rounded text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all text-left" onclick="document.getElementById('wc-input').value='/workflow ';document.getElementById('wc-input').focus()" title="调用已保存的工作流"><i class="fa-solid fa-diagram-project mr-1"></i>/workflow 工作流</button>
                            <button class="flex-1 px-2 py-1.5 rounded text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all text-left" onclick="document.getElementById('wc-input').value='/agent ';document.getElementById('wc-input').focus()" title="调用已部署的智能体"><i class="fa-solid fa-robot mr-1"></i>/agent 智能体</button>
                            <button class="flex-1 px-2 py-1.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-left" onclick="document.getElementById('wc-input').value='/rag ';document.getElementById('wc-input').focus()" title="RAG上下文检索"><i class="fa-solid fa-magnifying-glass mr-1"></i>/rag 检索</button>
                        </div>
                        <div class="flex gap-1">
                            <button class="flex-1 px-2 py-1 rounded text-[9px] bg-white/5 text-dim hover:text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all" onclick="document.getElementById('wc-input').value='/续写 ';document.getElementById('wc-input').focus()"><i class="fa-solid fa-pen mr-1"></i>续写</button>
                            <button class="flex-1 px-2 py-1 rounded text-[9px] bg-white/5 text-dim hover:text-pink-400 hover:bg-pink-500/10 border border-transparent hover:border-pink-500/20 transition-all" onclick="document.getElementById('wc-input').value='/润色 ';document.getElementById('wc-input').focus()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>润色</button>
                            <button class="flex-1 px-2 py-1 rounded text-[9px] bg-white/5 text-dim hover:text-purple-400 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-all" onclick="document.getElementById('wc-input').value='/扩写 ';document.getElementById('wc-input').focus()"><i class="fa-solid fa-expand mr-1"></i>扩写</button>
                            <button class="flex-1 px-2 py-1 rounded text-[9px] bg-white/5 text-dim hover:text-cyan-400 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 transition-all" onclick="document.getElementById('wc-input').value='/翻译 ';document.getElementById('wc-input').focus()"><i class="fa-solid fa-language mr-1"></i>翻译</button>
                        </div>
                        <div id="wc-custom-workflows" class="flex gap-1 overflow-x-auto"></div>
                    </div>
                    <div class="relative">
                        <textarea id="wc-input" class="w-full bg-black/40 border border-white/10 rounded-xl p-3 pr-12 text-sm resize-none h-20 focus:border-blue-500/50 placeholder-white/20 leading-relaxed text-white" placeholder="输入消息... (输入 / 查看快捷指令)" oninput="Modules.web_chat.onInput(this)" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();Modules.web_chat.send();}"></textarea>
                        <button class="absolute bottom-3 right-3 w-8 h-8 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex center shadow-lg transition-all" id="wc-send-btn" onclick="Modules.web_chat.send()"><i class="fa-solid fa-paper-plane text-xs"></i></button>
                        <div id="wc-gen-status" class="hidden absolute bottom-3 left-3 flex items-center gap-2 bg-blue-600/15 border border-blue-500/25 rounded-lg px-3 py-1.5">
                            <i class="fa-solid fa-circle-notch fa-spin text-blue-400 text-[10px]"></i>
                            <span class="text-[10px] text-blue-300 font-bold" id="wc-gen-label">思考中...</span>
                            <span class="text-[9px] text-dim font-mono" id="wc-gen-chars">0字</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    init: async () => {
        const WC = Modules.web_chat;
        try {
            WC.sessions = await DB.getAll('chat_sessions');
        } catch (e) { WC.sessions = []; }
        WC.sessions.sort((a, b) => (b.ts || 0) - (a.ts || 0));
        
        if (!WC._keyboardListener) {
            WC._keyboardListener = (e) => {
                if (e.ctrlKey && e.key === 'd') {
                    e.preventDefault();
                    Modules.web_chat.delCurrentSession();
                }
                if (e.ctrlKey && e.key === 'l') {
                    e.preventDefault();
                    Modules.web_chat.clearSession();
                }
            };
            document.addEventListener('keydown', WC._keyboardListener);
        }
        
        // 渲染会话列表
        const list = document.getElementById('wc-session-list');
        if (!list) return;
        if (WC.sessions.length === 0) {
            list.innerHTML = '<div class="text-dim text-[10px] text-center p-3 opacity-50">暂无对话记录</div>';
        } else {
            list.innerHTML = WC.sessions.map(s => `
                <div class="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group transition-all ${WC.currentSession?.id === s.id ? 'bg-blue-500/10 border border-blue-500/20' : 'hover:bg-white/5 border border-transparent'}" onclick="Modules.web_chat.loadSession('${s.id}')">
                    <i class="fa-solid fa-message text-[9px] ${WC.currentSession?.id === s.id ? 'text-blue-400' : 'text-dim'}"></i>
                    <span class="flex-1 text-[10px] truncate ${WC.currentSession?.id === s.id ? 'text-white font-bold' : 'text-dim'}">${s.title || '未命名'}</span>
                    <span class="text-[8px] text-dim">${(s.messages || []).length}</span>
                    <button class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-[9px]" onclick="event.stopPropagation();Modules.web_chat.delSession('${s.id}')"><i class="fa-solid fa-xmark"></i></button>
                </div>
            `).join('');
        }
        // 恢复当前会话消息
        if (WC.currentSession) WC._renderMessages();
        // 加载已部署的工作流和智能体到快捷按钮
        const cwEl = document.getElementById('wc-custom-workflows');
        if (cwEl) {
            let btns = '';
            try {
                const TC = Modules.tools_center;
                if (TC) {
                    const wfs = await TC._getSavedWorkflows();
                    const agents = await TC._getAgents();
                    if (wfs.length > 0) {
                        btns += wfs.map(w => `<button class="shrink-0 px-2 py-1 rounded text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all whitespace-nowrap" onclick="document.getElementById('wc-input').value='/workflow ${w.name} ';document.getElementById('wc-input').focus()" title="工作流: ${w.name}"><i class="fa-solid fa-diagram-project mr-1 text-indigo-400/60"></i>${w.name}</button>`).join('');
                    }
                    if (agents.length > 0) {
                        btns += agents.map(a => `<button class="shrink-0 px-2 py-1 rounded text-[9px] bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition-all whitespace-nowrap" onclick="document.getElementById('wc-input').value='/agent ${a.name} ';document.getElementById('wc-input').focus()" title="智能体: ${a.name}"><i class="fa-solid fa-robot mr-1 text-blue-400/60"></i>${a.name}</button>`).join('');
                    }
                }
            } catch(e) {}
            cwEl.innerHTML = btns || '<span class="text-[8px] text-dim/40">在工具中心部署工作流/智能体后，这里会显示快捷按钮</span>';
        }
    },

    newSession: () => {
        const WC = Modules.web_chat;
        const session = { id: Utils.uuid(), title: '新对话', persona: WC.currentPersona, messages: [], ts: Date.now() };
        WC.sessions.unshift(session);
        WC.currentSession = session;
        DB.put('chat_sessions', session);
        WC.init();
        WC._renderMessages();
    },

    loadSession: (id) => {
        const WC = Modules.web_chat;
        const session = WC.sessions.find(s => s.id === id);
        if (!session) return;
        WC.currentSession = session;
        if (session.persona) WC.currentPersona = session.persona;
        WC.init();
        WC._renderMessages();
    },

    delSession: async (id) => {
        const WC = Modules.web_chat;
        await DB.del('chat_sessions', id);
        WC.sessions = WC.sessions.filter(s => s.id !== id);
        if (WC.currentSession?.id === id) WC.currentSession = null;
        WC.init();
        const msgs = document.getElementById('wc-messages');
        if (msgs && !WC.currentSession) {
            const p = WC.personas[WC.currentPersona];
            msgs.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-dim opacity-30"><i class="fa-solid ${p.icon} text-4xl mb-3"></i><p class="text-sm font-bold">${p.name}</p></div>`;
        }
    },

    clearSession: () => {
        const WC = Modules.web_chat;
        if (!WC.currentSession) return;
        if (!confirm('确定清空当前对话？')) return;
        WC.currentSession.messages = [];
        DB.put('chat_sessions', WC.currentSession);
        WC._renderMessages();
    },

    delCurrentSession: async () => {
        const WC = Modules.web_chat;
        if (!WC.currentSession) return UI.toast('没有当前会话');
        if (!confirm('确定删除当前对话？')) return;
        await WC.delSession(WC.currentSession.id);
    },

    setPersona: (key) => {
        const WC = Modules.web_chat;
        WC.currentPersona = key;
        if (key === 'custom') {
            const name = prompt('角色名称：', '自定义角色');
            const system = prompt('系统提示词（角色设定）：', '');
            if (name) WC.personas.custom.name = name;
            if (system) WC.personas.custom.system = system;
        }
        if (WC.currentSession) {
            WC.currentSession.persona = key;
            DB.put('chat_sessions', WC.currentSession);
        }
        // 刷新视图
        const view = document.getElementById('module-view-web_chat');
        if (view) view.innerHTML = WC.render();
        WC.init();
    },

    send: async () => {
        const WC = Modules.web_chat;
        const input = document.getElementById('wc-input');
        const msg = input?.value?.trim();
        if (!msg || WC.typing) return;
        input.value = '';
        document.getElementById('wc-shortcuts')?.classList.add('hidden');

        // 自动创建会话
        if (!WC.currentSession) WC.newSession();
        const session = WC.currentSession;

        // ===== 命令拦截: /workflow /agent /rag =====
        if (msg.startsWith('/workflow ') || msg.startsWith('/agent ') || msg.startsWith('/rag ')) {
            session.messages.push({ role: 'user', content: msg, ts: Date.now() });
            if (session.title === '新对话') session.title = msg.slice(0, 25);
            WC._renderMessages();
            const msgsEl = document.getElementById('wc-messages');
            const persona = WC.personas[WC.currentPersona];

            try {
                let result = '';
                if (msg.startsWith('/workflow ')) {
                    const rest = msg.slice(10).trim();
                    const spaceIdx = rest.indexOf(' ');
                    const wfName = spaceIdx > 0 ? rest.slice(0, spaceIdx) : rest;
                    const wfInput = spaceIdx > 0 ? rest.slice(spaceIdx + 1) : '';
                    const TC = Modules.tools_center;
                    const wfs = await TC._getSavedWorkflows();
                    const wf = wfs.find(w => w.name.includes(wfName) || w.id === wfName);
                    if (!wf) {
                        result = '未找到工作流: ' + wfName + '\n\n可用工作流: ' + (wfs.length > 0 ? wfs.map(w => w.name).join(', ') : '暂无');
                    } else {
                        // IO面板显示
                        const ioIn = document.getElementById('wc-io-in');
                        if (ioIn) ioIn.value = '[工作流: ' + wf.name + ']\n输入: ' + (wfInput || '(无)');
                        // 状态指示
                        WC.typing = true;
                        WC._setGenStatus(true, '工作流 ' + wf.name + ' 执行中...');
                        // 流式占位
                        const streamId = 'wc-wf-stream-' + Date.now();
                        msgsEl.innerHTML += `<div class="flex gap-3" id="${streamId}"><div class="w-7 h-7 rounded-full bg-${persona.color}-500/20 flex center shrink-0 border border-${persona.color}-500/30"><i class="fa-solid ${persona.icon} text-${persona.color}-400 text-[10px]"></i></div><div class="flex-1 max-w-[85%]"><div class="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-300 leading-relaxed" id="${streamId}-body"><i class="fa-solid fa-spinner fa-spin"></i> 工作流执行中: ${wf.name}...</div></div></div>`;
                        msgsEl.scrollTop = msgsEl.scrollHeight;
                        const backup = { nodes: [...TC.nodes], connections: [...TC.connections] };
                        TC.nodes = JSON.parse(JSON.stringify(wf.nodes));
                        TC.connections = JSON.parse(JSON.stringify(wf.connections));
                        try {
                            result = await TC.runWorkflow(wfInput || undefined);
                            const bodyEl = document.getElementById(streamId + '-body');
                            if (bodyEl) bodyEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result || '(无结果)') : (result || '(无结果)');
                        } catch(e) { result = '工作流执行失败: ' + e.message; }
                        TC.nodes = backup.nodes;
                        TC.connections = backup.connections;
                        // IO输出
                        const ioOut = document.getElementById('wc-io-out');
                        if (ioOut) ioOut.value = result || '';
                        // 移除流式占位
                        const streamEl = document.getElementById(streamId);
                        if (streamEl) streamEl.remove();
                        WC.typing = false;
                        WC._setGenStatus(false);
                    }
                } else if (msg.startsWith('/agent ')) {
                    const rest = msg.slice(7).trim();
                    const spaceIdx = rest.indexOf(' ');
                    const agentName = spaceIdx > 0 ? rest.slice(0, spaceIdx) : rest;
                    const agentMsg = spaceIdx > 0 ? rest.slice(spaceIdx + 1) : '';
                    const TC = Modules.tools_center;
                    const agents = await TC._getAgents();
                    const agent = agents.find(a => a.name.includes(agentName) || a.id === agentName);
                    if (!agent) {
                        result = '未找到智能体: ' + agentName + '\n\n可用智能体: ' + (agents.length > 0 ? agents.map(a => a.name).join(', ') : '暂无');
                    } else {
                        const agentPrompt = agent.prompt + (agentMsg ? '\n\n用户输入：\n' + agentMsg : '\n\n请自我介绍并说明你能做什么。');
                        // IO面板显示
                        const ioIn = document.getElementById('wc-io-in');
                        if (ioIn) ioIn.value = '[智能体: ' + agent.name + ']\n' + agentPrompt;
                        // 状态指示
                        WC.typing = true;
                        WC._setGenStatus(true, '智能体 ' + agent.name + ' 生成中...');
                        // 流式输出 — 先插入占位消息
                        const streamId = 'wc-agent-stream-' + Date.now();
                        msgsEl.innerHTML += `<div class="flex gap-3" id="${streamId}"><div class="w-7 h-7 rounded-full bg-${persona.color}-500/20 flex center shrink-0 border border-${persona.color}-500/30"><i class="fa-solid ${persona.icon} text-${persona.color}-400 text-[10px]"></i></div><div class="flex-1 max-w-[85%]"><div class="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-300 leading-relaxed" id="${streamId}-body"><i class="fa-solid fa-circle-notch fa-spin text-blue-400"></i> <span class="text-blue-300">智能体思考中...</span></div></div></div>`;
                        msgsEl.scrollTop = msgsEl.scrollHeight;
                        result = '';
                        await AI.generate(agentPrompt, {}, c => {
                            result += c;
                            const bodyEl = document.getElementById(streamId + '-body');
                            if (bodyEl) bodyEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                            msgsEl.scrollTop = msgsEl.scrollHeight;
                            const ioOut = document.getElementById('wc-io-out');
                            if (ioOut) ioOut.value = result;
                            WC._updateGenChars(result.length);
                        });
                        WC.typing = false;
                        WC._setGenStatus(false);
                        // 如果智能体绑定了工作流，追加执行
                        if (agent.workflowId && result) {
                            const wfs = await TC._getSavedWorkflows();
                            const wf = wfs.find(w => w.id === agent.workflowId);
                            if (wf) {
                                const backup = { nodes: [...TC.nodes], connections: [...TC.connections] };
                                TC.nodes = JSON.parse(JSON.stringify(wf.nodes));
                                TC.connections = JSON.parse(JSON.stringify(wf.connections));
                                try {
                                    const wfResult = await TC.runWorkflow(result);
                                    if (wfResult) result += '\n\n---\n📋 工作流(' + wf.name + ')结果：\n' + wfResult;
                                } catch(e) {}
                                TC.nodes = backup.nodes;
                                TC.connections = backup.connections;
                            }
                        }
                        // 移除流式占位，由后面统一push消息
                        const streamEl = document.getElementById(streamId);
                        if (streamEl) streamEl.remove();
                    }
                } else if (msg.startsWith('/rag ')) {
                    const query = msg.slice(5).trim();
                    if (typeof RAGSystem !== 'undefined') {
                        const results = await RAGSystem.search(query, 10);
                        if (results.length === 0) {
                            result = '未找到与 "' + query + '" 相关的内容';
                        } else {
                            result = '🔍 RAG检索结果 (' + results.length + '条)：\n\n' + results.map((r, i) => `**${i+1}. [${r.source}] ${r.title}** (${(r.score*100).toFixed(0)}分)\n${r.content.slice(0,200)}`).join('\n\n');
                        }
                    } else {
                        result = 'RAG系统不可用';
                    }
                }

                session.messages.push({ role: 'assistant', content: result || '(无结果)', ts: Date.now() });
                session.ts = Date.now();
                await DB.put('chat_sessions', session);
                WC._renderMessages();
                ContextHelper.recordGeneration?.('web_chat_cmd', result?.slice(0, 150));
            } catch(e) {
                session.messages.push({ role: 'assistant', content: '命令执行失败: ' + e.message, ts: Date.now() });
                WC._renderMessages();
            }
            WC.init();
            return;
        }
        // ===== 命令拦截结束 =====

        // 添加用户消息
        session.messages.push({ role: 'user', content: msg, ts: Date.now() });
        // 自动命名
        if (session.title === '新对话' && msg.length > 2) {
            session.title = msg.slice(0, 25) + (msg.length > 25 ? '...' : '');
        }

        WC._renderMessages();
        const msgsEl = document.getElementById('wc-messages');

        // 构建 prompt
        const persona = WC.personas[WC.currentPersona];
        let systemPrompt = persona.system || '';

        // RAG 增强
        if (WC.ragEnabled && typeof RAGSystem !== 'undefined') {
            try {
                const context = await RAGSystem.query(msg);
                if (context) systemPrompt += `\n\n[参考上下文]:\n${context}`;
            } catch (e) {}
        }

        // 多轮记忆 - 取最近10轮
        const history = session.messages.slice(-20).map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`).join('\n');
        const fullPrompt = `${systemPrompt}\n\n对话历史:\n${history}\n\n请回复用户最新的消息。`;

        // IO 调试
        const ioIn = document.getElementById('wc-io-in');
        if (ioIn) ioIn.value = fullPrompt;

        // 显示打字动画
        WC.typing = true;
        WC._setGenStatus(true, '生成中...');
        const typingId = 'wc-typing-' + Date.now();
        msgsEl.innerHTML += `<div class="flex gap-3" id="${typingId}"><div class="w-7 h-7 rounded-full bg-${persona.color}-500/20 flex center shrink-0 border border-${persona.color}-500/30"><i class="fa-solid ${persona.icon} text-${persona.color}-400 text-[10px]"></i></div><div class="bg-white/5 rounded-xl px-3 py-2 text-xs text-dim"><i class="fa-solid fa-ellipsis fa-beat-fade"></i> 思考中...</div></div>`;
        msgsEl.scrollTop = msgsEl.scrollHeight;

        try {
            let result = '';
            const bodyEl = document.getElementById(typingId);
            const streamBodyId = typingId + '-body';
            // 替换打字动画为流式容器
            if (bodyEl) bodyEl.innerHTML = `<div class="w-7 h-7 rounded-full bg-${persona.color}-500/20 flex center shrink-0 border border-${persona.color}-500/30"><i class="fa-solid ${persona.icon} text-${persona.color}-400 text-[10px]"></i></div><div class="flex-1 max-w-[85%]"><div class="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-300 leading-relaxed" id="${streamBodyId}"><i class="fa-solid fa-ellipsis fa-beat-fade"></i> 思考中...</div></div>`;

            await AI.generate(fullPrompt, {}, c => {
                result += c;
                const sEl = document.getElementById(streamBodyId);
                if (sEl) sEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                msgsEl.scrollTop = msgsEl.scrollHeight;
                WC._updateGenChars(result.length);
            });

            const ioOut = document.getElementById('wc-io-out');
            if (ioOut) ioOut.value = result;

            session.messages.push({ role: 'assistant', content: result, ts: Date.now() });
            session.ts = Date.now();
            await DB.put('chat_sessions', session);

            // 移除流式容器，渲染完整消息
            const typingEl = document.getElementById(typingId);
            if (typingEl) typingEl.remove();
            WC._renderMessages();

            // 记录到工作记忆
            ContextHelper.recordGeneration?.('web_chat', result);
        } catch (e) {
            const typingEl = document.getElementById(typingId);
            if (typingEl) typingEl.innerHTML = `<div class="bg-red-900/20 rounded-xl px-3 py-2 text-xs text-red-400">${e.message || '生成失败'}</div>`;
        }
        WC.typing = false;
        WC._setGenStatus(false);
    },

    // 生成状态指示器
    _setGenStatus: (active, label) => {
        const el = document.getElementById('wc-gen-status');
        const labelEl = document.getElementById('wc-gen-label');
        const btn = document.getElementById('wc-send-btn');
        if (el) {
            if (active) {
                el.classList.remove('hidden');
                if (labelEl) labelEl.textContent = label || '思考中...';
            } else {
                el.classList.add('hidden');
            }
        }
        if (btn) {
            if (active) {
                btn.classList.add('opacity-50', 'pointer-events-none');
            } else {
                btn.classList.remove('opacity-50', 'pointer-events-none');
            }
        }
    },
    _updateGenChars: (count) => {
        const el = document.getElementById('wc-gen-chars');
        if (el) el.textContent = count + '字';
    },

    _renderMessages: () => {
        const WC = Modules.web_chat;
        const msgsEl = document.getElementById('wc-messages');
        if (!msgsEl || !WC.currentSession) return;
        const msgs = WC.currentSession.messages || [];
        const persona = WC.personas[WC.currentPersona];
        if (msgs.length === 0) {
            msgsEl.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-dim opacity-30"><i class="fa-solid ${persona.icon} text-4xl mb-3"></i><p class="text-sm font-bold">${persona.name}</p><p class="text-xs mt-1">${persona.desc}</p></div>`;
            return;
        }
        msgsEl.innerHTML = msgs.map((m, i) => {
            if (m.role === 'user') {
                return `<div class="flex gap-3 justify-end"><div class="bg-blue-600/20 border border-blue-500/20 rounded-xl px-3 py-2 text-xs text-white max-w-[75%] leading-relaxed whitespace-pre-wrap">${m.content}</div><div class="w-7 h-7 rounded-full bg-blue-600/30 flex center shrink-0"><i class="fa-solid fa-user text-blue-400 text-[10px]"></i></div></div>`;
            }
            const rendered = typeof marked !== 'undefined' ? marked.parse(m.content) : m.content;
            return `
                <div class="flex gap-3">
                    <div class="w-7 h-7 rounded-full bg-${persona.color}-500/20 flex center shrink-0 border border-${persona.color}-500/30"><i class="fa-solid ${persona.icon} text-${persona.color}-400 text-[10px]"></i></div>
                    <div class="flex-1 max-w-[85%]">
                        <div class="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-300 leading-relaxed">${rendered}</div>
                        <div class="flex gap-2 mt-1 ml-1">
                            <button class="text-[8px] text-dim hover:text-white" onclick="Utils.copy(Modules.web_chat.currentSession.messages[${i}].content);UI.toast('已复制')"><i class="fa-solid fa-copy mr-0.5"></i>复制</button>
                            <button class="text-[8px] text-dim hover:text-amber-400" onclick="ContextHelper.exportToLibrary('对话_'+new Date().toLocaleString(),Modules.web_chat.currentSession.messages[${i}].content);UI.toast('已存入书架')"><i class="fa-solid fa-book mr-0.5"></i>存书架</button>
                        </div>
                    </div>
                </div>`;
        }).join('');
        msgsEl.scrollTop = msgsEl.scrollHeight;
        // 更新标题
        const titleEl = document.getElementById('wc-session-title');
        if (titleEl) titleEl.innerText = WC.currentSession.title || '新对话';
    },

    onInput: (el) => {
        const val = el.value;
        const shortcuts = document.getElementById('wc-shortcuts');
        if (!shortcuts) return;
        if (val.startsWith('/')) {
            shortcuts.classList.remove('hidden');
        } else {
            shortcuts.classList.add('hidden');
        }
    },

    useShortcut: (index) => {
        const WC = Modules.web_chat;
        const sc = WC.shortcuts[index];
        if (!sc) return;
        const input = document.getElementById('wc-input');
        if (input) input.value = sc.prompt;
        document.getElementById('wc-shortcuts')?.classList.add('hidden');
        input?.focus();
    },

    toggleIO: () => {
        document.getElementById('wc-io-panel')?.classList.toggle('hidden');
    },

    exportSession: () => {
        const WC = Modules.web_chat;
        if (!WC.currentSession) return UI.toast('无当前会话');
        const msgs = WC.currentSession.messages || [];
        const text = msgs.map(m => `[${m.role === 'user' ? '用户' : 'AI'}] ${m.content}`).join('\n\n---\n\n');
        Utils.copy(text);
        UI.toast('对话已复制到剪贴板');
    },

    exportAll: () => {
        const WC = Modules.web_chat;
        let text = '# 全部对话导出\n\n';
        WC.sessions.forEach(s => {
            text += `## ${s.title || '未命名'}\n\n`;
            (s.messages || []).forEach(m => {
                text += `**${m.role === 'user' ? '用户' : 'AI'}**: ${m.content}\n\n`;
            });
            text += '---\n\n';
        });
        Utils.copy(text);
        UI.toast('全部对话已复制');
    }
};
