// ========== 长篇执笔 (旗舰版 · 深度绑定融合拆书) ==========
// 核心: 融合技法注入续写 ← 流水线数据驱动 ← 世界引擎RAG
Modules.writer = {
    currentChapterId: null,
    currentVolumeId: null,
    activeTab: 'outline',
    _generating: false,
    // AI续写高级控制
    aiOpts: { length:'medium', styleKeep:true, ragInject:true, fusionInject:true, direction:'' },

    // ===== 获取融合拆书上下文 =====
    _getFusionContext() {
        const FB = Modules.fusion_book;
        if (!FB) return '';
        const allPr = FB._allPipelineResults || {};
        const pr = FB._pipelineResults || {};
        let ctx = '';
        const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
        const compare = (allPr.compare && allPr.compare.trim()) ? allPr.compare : (pr.compare || '');
        if (fusion) ctx += '[融合技法精华]\n' + fusion.slice(0, 3000) + '\n\n';
        if (compare) ctx += '[对比结论]\n' + compare.slice(0, 1500) + '\n\n';
        return ctx;
    },

    render: () => `
        <div class="flex h-full bg-[#F8F9FA] overflow-hidden">
            <!-- Left: Chapter Nav -->
            <div class="w-60 shrink-0 flex flex-col bg-white border-r border-gray-200">
                <div class="p-4 border-b border-gray-200 bg-gradient-to-br from-white to-gray-50">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-2.5">
                            <i class="fa-solid fa-feather-pointed text-2xl text-indigo-500"></i>
                            <span class="font-bold text-gray-800 text-base">长篇执笔</span>
                        </div>
                        <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-200">旗舰版</span>
                    </div>
                    <div class="grid grid-cols-3 gap-2 mb-3">
                        <button class="btn py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white border-none shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.writer.newVol()">
                            <i class="fa-solid fa-folder-plus text-lg"></i>
                            <span class="text-sm font-bold ml-1">卷</span>
                        </button>
                        <button class="btn py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white border-none shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.writer.newChap()">
                            <i class="fa-solid fa-file-plus text-lg"></i>
                            <span class="text-sm font-bold ml-1">章</span>
                        </button>
                        <button class="btn py-2.5 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white border-none shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.writer.clearAll()">
                            <i class="fa-solid fa-trash-can text-lg"></i>
                        </button>
                    </div>
                    <button class="btn py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white border-none shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all hover:scale-105 rounded-lg w-full mb-2" onclick="Modules.writer.autoWriteAll()">
                        <i class="fa-solid fa-rocket mr-2"></i>
                        <span class="text-sm font-bold">批量自动写正文</span>
                    </button>
                    <button class="btn py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white border-none shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105 rounded-lg w-full" onclick="Modules.writer.autoWriteAllEnhanced()">
                        <i class="fa-solid fa-wand-magic-sparkles mr-2"></i>
                        <span class="text-sm font-bold">强化批量写作</span>
                    </button>
                </div>
                <div class="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin" id="w-chap-list"></div>
                <div class="p-3 border-t border-gray-200 bg-[#F1F3F5]">
                    <div class="grid grid-cols-2 gap-2 text-center">
                        <div class="bg-gray-100 rounded p-1.5"><div class="text-sm font-bold text-accent" id="w-vol-count">0</div><div class="text-[8px] text-dim">卷</div></div>
                        <div class="bg-gray-100 rounded p-1.5"><div class="text-sm font-bold text-blue-400" id="w-chap-count">0</div><div class="text-[8px] text-dim">章</div></div>
                    </div>
                    <div class="mt-2 text-center">
                        <span class="text-[9px] font-mono text-dim" id="w-total-words">总字数: 0</span>
                    </div>
                </div>
            </div>

            <!-- Center: Editor -->
            <div class="flex-1 flex flex-col min-w-0 relative">
                <div class="h-12 flex items-center justify-between px-5 bg-[#F1F3F5] border-b border-gray-200 shrink-0 z-10">
                    <input id="w-title" class="bg-transparent border-none font-bold text-lg text-gray-800 w-1/3 focus:text-accent transition-colors placeholder-white/20" placeholder="章节标题...">
                    <div class="flex gap-2 items-center">
                        <div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border border-gray-200">
                            <span id="w-stats" class="font-mono text-accent text-xs font-bold">0</span>
                            <span class="text-[9px] text-dim">字</span>
                        </div>
                        <button class="btn btn-xs btn-primary" onclick="Modules.writer.save()"><i class="fa-solid fa-floppy-disk mr-1"></i>保存</button>
                        <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.writer.exportToLibrary()"><i class="fa-solid fa-book-open mr-1"></i>存阅读</button>
                        <button class="btn btn-xs bg-gray-100 text-dim" onclick="Modules.short.openPromptModal('writer_ai')"><i class="fa-solid fa-gear"></i></button>
                    </div>
                </div>
                <div class="flex-1 flex flex-col min-h-0 relative">
                    <!-- AI Action Bar -->
                    <div class="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-200 shrink-0">
                        <button class="btn px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white border-none shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.writer.aiWrite()" id="w-ai-btn">
                            <i class="fa-solid fa-wand-magic-sparkles mr-2"></i>
                            <span class="text-sm font-bold">AI 续写</span>
                        </button>
                        <button class="btn px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white border-none shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.writer.polish()">
                            <i class="fa-solid fa-gem mr-2"></i>
                            <span class="text-sm font-bold">润色</span>
                        </button>
                        <button class="btn px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white border-none shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.writer.refreshRAG()">
                            <i class="fa-solid fa-rotate mr-2"></i>
                            <span class="text-sm font-bold">刷新 RAG</span>
                        </button>
                        <button class="btn px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white border-none shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all hover:scale-105 rounded-lg hidden" id="w-stop-btn" onclick="Modules.writer._setGenerating(false)">
                            <i class="fa-solid fa-stop mr-2"></i>
                            <span class="text-sm font-bold">停止</span>
                        </button>
                        <div class="flex-1"></div>
                        <!-- 续写控制 -->
                        <div class="flex items-center gap-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg border-2 border-gray-300 p-1 shadow-sm">
                            ${['short','medium','long'].map(l => {
                                const labels = {short:'短',medium:'中',long:'长'};
                                return `<button class="px-3 py-1.5 rounded-md text-sm font-bold transition-all w-ai-len-btn hover:bg-white hover:shadow-sm" data-len="${l}" onclick="Modules.writer.setAiLen('${l}')">${labels[l]}</button>`;
                            }).join('')}
                        </div>
                        <button class="px-3 py-1.5 rounded-lg text-sm font-bold border-2 border-purple-300 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 transition-all shadow-sm w-ai-style-btn" onclick="Modules.writer.toggleStyleKeep()">风格锁</button>
                        <button class="px-3 py-1.5 rounded-lg text-sm font-bold border-2 border-cyan-300 bg-cyan-50 hover:bg-cyan-100 hover:border-cyan-400 transition-all shadow-sm w-ai-rag-btn" onclick="Modules.writer.toggleRagInject()">RAG</button>
                        <button class="px-3 py-1.5 rounded-lg text-sm font-bold border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 transition-all shadow-sm w-ai-fusion-btn" onclick="Modules.writer.toggleFusionInject()">融合</button>
                        <span class="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md border border-gray-300" id="w-save-status">就绪</span>
                    </div>
                    <!-- 续写方向 -->
                    <div class="px-5 py-2 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 shrink-0">
                        <div class="flex items-center gap-2 mb-1">
                            <i class="fa-solid fa-compass text-indigo-400 text-xs"></i>
                            <span class="text-xs font-bold text-gray-600">续写方向指引</span>
                        </div>
                        <input id="w-ai-direction" class="w-full bg-white border-2 border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all" placeholder="例如：让主角发现真相、转入打斗场景...">
                    </div>
                    <textarea class="flex-1 w-full bg-transparent border-none p-8 text-base leading-loose text-gray-700 resize-none focus:outline-none font-serif placeholder-white/10" id="w-editor" placeholder="在此书写你的故事..." oninput="Modules.writer.onInput()"></textarea>
                </div>
            </div>

            <!-- Right: Tabs Panel -->
            <div class="w-80 shrink-0 flex flex-col bg-white border-l border-gray-200">
                <div class="flex gap-1 px-2 pt-2 border-b border-gray-200 shrink-0 bg-gradient-to-r from-gray-50 to-white">
                    <div id="w-tab-btn-outline" class="tab-btn flex-1 p-3 text-xs font-bold text-center cursor-pointer active rounded-t-lg" onclick="Modules.writer.tab('outline')">
                            <i class="fa-solid fa-book-open mr-1"></i>
                            <span>大纲</span>
                        </div>
                        <div id="w-tab-btn-fusion" class="tab-btn flex-1 p-3 text-xs font-bold text-center cursor-pointer rounded-t-lg" onclick="Modules.writer.tab('fusion')">
                            <i class="fa-solid fa-layer-group mr-1"></i>
                            <span>融合</span>
                        </div>
                        <div id="w-tab-btn-rules" class="tab-btn flex-1 p-3 text-xs font-bold text-center cursor-pointer rounded-t-lg" onclick="Modules.writer.tab('rules')">
                            <i class="fa-solid fa-ruler-combined mr-1"></i>
                            <span>规则</span>
                        </div>
                        <div id="w-tab-btn-rag" class="tab-btn flex-1 p-3 text-xs font-bold text-center cursor-pointer rounded-t-lg" onclick="Modules.writer.tab('rag')">
                            <i class="fa-solid fa-database mr-1"></i>
                            <span>RAG</span>
                        </div>
                        <div id="w-tab-btn-chat" class="tab-btn flex-1 p-3 text-xs font-bold text-center cursor-pointer rounded-t-lg" onclick="Modules.writer.tab('chat')">
                            <i class="fa-solid fa-comments mr-1"></i>
                            <span>对话</span>
                        </div>
                        <div id="w-tab-btn-io" class="tab-btn flex-1 p-3 text-xs font-bold text-center cursor-pointer rounded-t-lg" onclick="Modules.writer.tab('io')">
                            <i class="fa-solid fa-download mr-1"></i>
                            <span>IO</span>
                        </div>
                        <div id="w-tab-btn-diagnose" class="tab-btn flex-1 p-3 text-xs font-bold text-center cursor-pointer rounded-t-lg" onclick="Modules.writer.tab('diagnose')">
                            <i class="fa-solid fa-stethoscope mr-1"></i>
                            <span>诊断</span>
                        </div>
                </div>
                <!-- Outline Tab -->
                <div id="w-tab-outline" class="flex-1 flex flex-col p-4 gap-3 min-h-0">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-indigo-600 flex items-center gap-2">
                            <i class="fa-solid fa-book-open text-indigo-400"></i>
                            章节大纲
                        </span>
                        <button class="btn px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white border-none shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.writer.saveContent()">
                            <i class="fa-solid fa-save mr-1.5"></i>
                            <span class="text-sm font-bold">保存大纲</span>
                        </button>
                    </div>
                    <textarea class="flex-1 bg-white border-2 border-gray-300 rounded-lg p-4 text-sm text-gray-700 resize-none font-mono leading-relaxed focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all" id="w-outline" placeholder="本章大纲 / 剧情要点..."></textarea>
                    <div class="grid grid-cols-2 gap-2">
                        <button class="btn py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white border-none shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.writer.pullWorldForChapter()">
                            <i class="fa-solid fa-atom mr-1.5"></i>
                            <span class="text-sm font-bold">拉取世界</span>
                        </button>
                        <button class="btn py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white border-none shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.writer.pullFusionForChapter()">
                            <i class="fa-solid fa-book-open-reader mr-1.5"></i>
                            <span class="text-sm font-bold">拉取拆书</span>
                        </button>
                    </div>
                </div>
                <!-- Fusion Tab (新增: 融合技法面板) -->
                <div id="w-tab-fusion" class="flex-1 hidden flex flex-col p-3 gap-2 min-h-0">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] text-amber-400 font-bold uppercase"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>融合技法</span>
                        <button class="btn btn-xs bg-amber-500/20 text-amber-400" onclick="Modules.writer._loadFusionData()"><i class="fa-solid fa-rotate mr-1"></i>刷新</button>
                    </div>
                    <textarea class="flex-1 bg-gray-100 border border-amber-500/10 rounded p-3 text-xs text-gray-400 resize-none font-mono leading-relaxed" id="w-fusion-data" readonly placeholder="点击刷新加载融合拆书技法精华..."></textarea>
                    <div class="text-[9px] text-dim leading-relaxed p-2 bg-gray-100 rounded border border-gray-200">
                        <i class="fa-solid fa-info-circle text-amber-400 mr-1"></i>开启工具栏「融合」按钮后，AI续写时将自动注入融合技法作为写作指导
                    </div>
                    <div class="flex gap-1">
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 flex-1" onclick="Modules.writer.fusionWrite()"><i class="fa-solid fa-bolt mr-1"></i>融合技法写作</button>
                        <button class="btn btn-xs bg-gray-100 text-dim flex-1" onclick="App.nav('fusion_book')"><i class="fa-solid fa-book-open-reader mr-1"></i>前往融合拆书</button>
                    </div>
                </div>
                <!-- Rules Tab -->
                <div id="w-tab-rules" class="flex-1 hidden flex flex-col p-3 gap-2 min-h-0 overflow-y-auto scrollbar-thin">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-indigo-600 flex items-center gap-2">
                            <i class="fa-solid fa-ruler-combined text-indigo-400"></i>
                            全局规则
                        </span>
                        <div class="flex gap-1">
                            <button class="btn btn-xs bg-gray-100 text-dim" onclick="Modules.writer.loadRules()">加载</button>
                            <button class="btn btn-xs btn-primary" onclick="Modules.writer.saveRules()">保存</button>
                        </div>
                    </div>
                    <textarea class="flex-1 bg-gray-100 border border-gray-200 rounded p-3 text-xs text-gray-600 resize-none font-mono min-h-[80px]" id="w-rules" placeholder="全局写作规则 (角色设定、文风要求等)..."></textarea>
                    <span class="text-xs font-bold text-indigo-600 flex items-center gap-2 mt-2">
                            <i class="fa-solid fa-pen-fancy text-indigo-400"></i>
                            续写规则
                        </span>
                    <textarea class="flex-1 bg-gray-100 border border-gray-200 rounded p-3 text-xs text-gray-600 resize-none font-mono min-h-[60px]" id="w-continue-rules" placeholder="续写时的特殊规则..."></textarea>
                    <span class="text-xs font-bold text-purple-600 flex items-center gap-2 mt-2">
                            <i class="fa-solid fa-gem text-purple-400"></i>
                            润色规则
                        </span>
                    <textarea class="flex-1 bg-gray-100 border border-purple-500/10 rounded p-3 text-xs text-gray-600 resize-none font-mono min-h-[60px]" id="w-polish-rules" placeholder="润色时的规则 (文风要求、修辞手法、节奏控制等)..."></textarea>
                    
                    <!-- 文风库模块 -->
                    <div class="mt-3 pt-3 border-t border-gray-300">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-bold text-emerald-600 flex items-center gap-2">
                                <i class="fa-solid fa-book text-emerald-400"></i>
                                文风库
                                <span class="text-[9px] text-emerald-400/70">(点击勾选使用)</span>
                            </span>
                            <div class="flex gap-1">
                                <button class="btn btn-xs bg-gray-100 text-dim" onclick="Modules.writer.openStylePromptModal()" title="配置提取提示词"><i class="fa-solid fa-gear"></i></button>
                                <button class="btn btn-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30" onclick="Modules.writer.openStyleExtractModal()"><i class="fa-solid fa-plus mr-1"></i>新增文风</button>
                            </div>
                        </div>
                        
                        <!-- 文风库列表 -->
                        <div id="w-style-library" class="space-y-1 max-h-[200px] overflow-y-auto">
                            <div class="text-[9px] text-dim text-center py-2">暂无保存的文风，点击"新增文风"提取</div>
                        </div>
                        
                        <!-- 当前选中的文风预览 -->
                        <div id="w-active-style-preview" class="mt-2 hidden">
                            <div class="text-[9px] text-emerald-400 mb-1 flex items-center gap-1">
                                <i class="fa-solid fa-check-circle"></i>当前使用的文风
                            </div>
                            <div class="p-2 bg-emerald-500/10 rounded border border-emerald-500/20 text-xs text-gray-700 max-h-[80px] overflow-y-auto" id="w-active-style-content"></div>
                        </div>
                        
                        <div class="mt-2 p-2 bg-emerald-500/5 rounded border border-emerald-500/10">
                            <div class="text-[9px] text-dim leading-relaxed">
                                <i class="fa-solid fa-info-circle text-emerald-400 mr-1"></i>
                                <b class="text-emerald-400">优先级：</b>勾选文风 > 人称/基调/字数 > 各功能规则 > 默认写法
                            </div>
                        </div>
                    </div>
                    
                    <!-- 人称/基调/字数设置 -->
                    <div class="mt-3 pt-3 border-t border-gray-300">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-bold text-amber-600 flex items-center gap-2">
                                <i class="fa-solid fa-sliders text-amber-400"></i>
                                写作设置
                            </span>
                        </div>
                        
                        <!-- 人称选择 -->
                        <div class="mb-2">
                            <div class="text-[9px] text-dim mb-1 flex items-center gap-1">
                                <i class="fa-solid fa-user text-amber-400"></i>叙事人称
                            </div>
                            <select id="w-narrative-pov" class="w-full bg-white border-2 border-gray-300 rounded-lg p-2 text-xs text-gray-700 font-bold focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200" onchange="Modules.writer._saveWritingSettings()">
                                <option value="">- 请选择人称 -</option>
                                <option value="first">第一人称 (我/我们)</option>
                                <option value="third-limited">第三人称有限视角 (他/她，限主角视角)</option>
                                <option value="third-omniscient">第三人称全知视角 (上帝视角)</option>
                                <option value="second">第二人称 (你，实验性)</option>
                                <option value="custom">自定义 (在下方输入)</option>
                            </select>
                            <input id="w-narrative-pov-custom" class="w-full bg-white border-2 border-gray-300 rounded-lg p-2 text-xs text-gray-700 mt-1 hidden" placeholder="输入自定义人称描述..." onchange="Modules.writer._saveWritingSettings()">
                        </div>
                        
                        <!-- 基调选择 -->
                        <div class="mb-2">
                            <div class="text-[9px] text-dim mb-1 flex items-center gap-1">
                                <i class="fa-solid fa-music text-amber-400"></i>情感基调
                            </div>
                            <select id="w-tone" class="w-full bg-white border-2 border-gray-300 rounded-lg p-2 text-xs text-gray-700 font-bold focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200" onchange="Modules.writer._saveWritingSettings()">
                                <option value="">- 请选择基调 -</option>
                                <option value="dark-gritty">黑暗压抑 (悬疑/末世)</option>
                                <option value="light-hopeful">轻松明快 (甜宠/日常)</option>
                                <option value="epic-heroic">史诗热血 (玄幻/仙侠)</option>
                                <option value="melancholic">忧郁抒情 (文艺/治愈)</option>
                                <option value="humorous">幽默诙谐 (搞笑/轻松)</option>
                                <option value="mysterious">神秘悬疑 (推理/悬疑)</option>
                                <option value="romantic">浪漫唯美 (言情/纯爱)</option>
                                <option value="grim-realistic">冷峻写实 (现实/历史)</option>
                                <option value="custom">自定义 (在下方输入)</option>
                            </select>
                            <input id="w-tone-custom" class="w-full bg-white border-2 border-gray-300 rounded-lg p-2 text-xs text-gray-700 mt-1 hidden" placeholder="输入自定义基调描述..." onchange="Modules.writer._saveWritingSettings()">
                        </div>
                        
                        <!-- 每章字数 -->
                        <div class="mb-2">
                            <div class="text-[9px] text-dim mb-1 flex items-center gap-1">
                                <i class="fa-solid fa-text-size text-amber-400"></i>每章字数
                            </div>
                            <div class="flex items-center gap-2">
                                <input type="range" id="w-chapter-words-slider" min="1000" max="10000" step="500" value="3000" class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" oninput="document.getElementById('w-chapter-words').value=this.value;Modules.writer._saveWritingSettings()">
                                <input type="number" id="w-chapter-words" min="1000" max="10000" step="500" value="3000" class="w-20 bg-white border-2 border-gray-300 rounded-lg p-2 text-xs text-gray-700 font-bold text-center" onchange="document.getElementById('w-chapter-words-slider').value=this.value;Modules.writer._saveWritingSettings()">
                            </div>
                            <div class="flex justify-between text-[8px] text-dim mt-1">
                                <span>1000字</span>
                                <span>5000字</span>
                                <span>10000字</span>
                            </div>
                        </div>
                        
                        <div class="mt-2 p-2 bg-amber-500/5 rounded border border-amber-500/10">
                            <div class="text-[9px] text-dim leading-relaxed">
                                <i class="fa-solid fa-lightbulb text-amber-400 mr-1"></i>
                                <b class="text-amber-400">提示：</b>这些设置将自动注入到续写和润色提示词中，优先级仅次于文风提取
                            </div>
                        </div>
                    </div>
                </div>
                <!-- RAG Tab (强化版：核心上下文引擎) -->
                <div id="w-tab-rag" class="flex-1 hidden flex flex-col p-0 min-h-0">
                    <div class="flex items-center justify-between px-3 py-2 bg-gray-100 border-b border-gray-200 shrink-0">
                        <span class="text-xs font-bold text-cyan-600 flex items-center gap-2">
                            <i class="fa-solid fa-database text-cyan-400"></i>
                            RAG 上下文引擎
                        </span>
                        <div class="flex gap-1">
                            <button class="btn btn-xs bg-gray-100 text-dim" onclick="Modules.writer._clearRAG()" title="清空"><i class="fa-solid fa-trash"></i></button>
                            <button class="btn btn-xs bg-cyan-500/20 text-cyan-400" onclick="Modules.writer.refreshRAG()"><i class="fa-solid fa-rotate mr-1"></i>刷新</button>
                        </div>
                    </div>
                    <!-- RAG状态指标 -->
                    <div class="px-3 py-2 bg-white border-b border-gray-200 shrink-0">
                        <div class="grid grid-cols-4 gap-2 text-center">
                            <div class="p-2 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg border-2 border-cyan-200">
                                <div class="text-lg font-bold text-cyan-600" id="w-rag-entities">0</div>
                                <div class="text-xs text-gray-600 font-bold">实体</div>
                            </div>
                            <div class="p-2 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border-2 border-amber-200">
                                <div class="text-lg font-bold text-amber-600" id="w-rag-world">0</div>
                                <div class="text-xs text-gray-600 font-bold">世界观</div>
                            </div>
                            <div class="p-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                                <div class="text-lg font-bold text-purple-600" id="w-rag-fusion">0</div>
                                <div class="text-xs text-gray-600 font-bold">融合技法</div>
                            </div>
                            <div class="p-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                                <div class="text-lg font-bold text-green-600" id="w-rag-chapters">0</div>
                                <div class="text-xs text-gray-600 font-bold">章节</div>
                            </div>
                        </div>
                    </div>
                    <!-- RAG检索控制 -->
                    <div class="px-3 py-2 bg-white border-b border-gray-200 shrink-0 space-y-2">
                        <div class="flex gap-1">
                            <input id="w-rag-search" class="input flex-1 h-7 text-xs bg-gray-100 border-gray-300" placeholder="搜索关键词..." onkeydown="if(event.key==='Enter')Modules.writer._searchRAG()">
                            <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.writer._searchRAG()"><i class="fa-solid fa-search"></i></button>
                        </div>
                        <div class="flex gap-1 flex-wrap">
                            <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30 flex-1" onclick="Modules.writer._ragSource('entities')"><i class="fa-solid fa-user mr-1"></i>实体</button>
                            <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 flex-1" onclick="Modules.writer._ragSource('world')"><i class="fa-solid fa-earth-americas mr-1"></i>世界</button>
                            <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30 flex-1" onclick="Modules.writer._ragSource('fusion')"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>融合</button>
                            <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 flex-1" onclick="Modules.writer._ragSource('chapters')"><i class="fa-solid fa-file-lines mr-1"></i>章节</button>
                            <button class="btn btn-xs bg-gray-100 text-dim flex-1" onclick="Modules.writer._ragSource('all')"><i class="fa-solid fa-layer-group mr-1"></i>全部</button>
                        </div>
                    </div>
                    <!-- RAG结果展示 -->
                    <div class="flex-1 overflow-y-auto p-2 space-y-2 min-h-0" id="w-rag-results">
                        <div class="text-center text-dim text-xs py-4">
                            <i class="fa-solid fa-database text-2xl mb-2 opacity-30"></i>
                            <div>点击刷新获取相关上下文</div>
                        </div>
                    </div>
                    <!-- RAG快捷操作 -->
                    <div class="p-2 border-t border-gray-200 shrink-0 space-y-1">
                        <div class="flex gap-1">
                            <button class="btn btn-xs bg-gradient-to-r from-cyan-600/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30 flex-1 font-bold" onclick="Modules.writer._injectRAGToPrompt()">
                                <i class="fa-solid fa-syringe mr-1"></i>注入到续写
                            </button>
                            <button class="btn btn-xs bg-gradient-to-r from-purple-100 to-pink-50 text-purple-400 border border-purple-500/30 flex-1 font-bold" onclick="Modules.writer._buildFullContext()">
                                <i class="fa-solid fa-layer-group mr-1"></i>构建完整上下文
                            </button>
                        </div>
                        <div class="flex gap-1">
                            <button class="btn btn-xs bg-gray-100 text-dim flex-1" onclick="App.nav('world_engine')"><i class="fa-solid fa-atom mr-1"></i>世界引擎</button>
                            <button class="btn btn-xs bg-gray-100 text-dim flex-1" onclick="Modules.writer._exportRAG()"><i class="fa-solid fa-download mr-1"></i>导出</button>
                        </div>
                    </div>
                </div>
                <!-- Chat Tab (强化版：支持正文引用、实体关联、直接修改) -->
                <div id="w-tab-chat" class="flex-1 hidden flex flex-col p-0 min-h-0">
                    <div class="flex items-center justify-between px-3 py-2 bg-gray-100 border-b border-gray-200 shrink-0">
                        <span class="text-xs font-bold text-indigo-600 flex items-center gap-2">
                            <i class="fa-solid fa-comments text-indigo-400"></i>
                            AI 写作助手
                        </span>
                        <div class="flex gap-1">
                            <button class="btn btn-xs bg-gray-100 text-dim" onclick="Modules.writer._chatClear()" title="清空对话"><i class="fa-solid fa-trash"></i></button>
                            <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.writer._chatRefreshContext()" title="刷新上下文"><i class="fa-solid fa-rotate"></i></button>
                        </div>
                    </div>
                    <!-- 上下文状态栏 -->
                    <div class="px-3 py-1.5 bg-white border-b border-gray-200 shrink-0">
                        <div class="flex items-center gap-2 text-[9px]">
                            <span class="text-dim">上下文:</span>
                            <span id="w-chat-ctx-content" class="text-green-400 cursor-pointer hover:underline" onclick="Modules.writer._toggleChatContext('content')">正文 ✓</span>
                            <span id="w-chat-ctx-outline" class="text-blue-400 cursor-pointer hover:underline" onclick="Modules.writer._toggleChatContext('outline')">大纲 ✓</span>
                            <span id="w-chat-ctx-world" class="text-amber-400 cursor-pointer hover:underline" onclick="Modules.writer._toggleChatContext('world')">世界 ✓</span>
                            <span id="w-chat-ctx-fusion" class="text-purple-400 cursor-pointer hover:underline" onclick="Modules.writer._toggleChatContext('fusion')">融合 ✓</span>
                            <span id="w-chat-ctx-rag" class="text-cyan-400 cursor-pointer hover:underline" onclick="Modules.writer._toggleChatContext('rag')">RAG ✓</span>
                        </div>
                    </div>
                    <!-- 快捷操作按钮 -->
                    <div class="flex gap-1 px-3 py-1.5 bg-white border-b border-gray-200 shrink-0 flex-wrap">
                        <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30" onclick="Modules.writer._chatQuickAction('diagnose')"><i class="fa-solid fa-stethoscope mr-1"></i>诊断</button>
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.writer._chatQuickAction('polish')"><i class="fa-solid fa-gem mr-1"></i>润色</button>
                        <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.writer._chatQuickAction('expand')"><i class="fa-solid fa-expand mr-1"></i>扩写</button>
                        <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.writer._chatQuickAction('rewrite')"><i class="fa-solid fa-pen-to-square mr-1"></i>改写</button>
                        <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.writer._chatQuickAction('continue')"><i class="fa-solid fa-play mr-1"></i>续写</button>
                    </div>
                    <!-- 对话记录 -->
                    <div id="w-chat-log" class="flex-1 bg-gray-100 p-2 overflow-y-auto text-xs space-y-2 min-h-0"></div>
                    <!-- 选中文本预览 -->
                    <div id="w-chat-selection" class="hidden px-3 py-2 bg-amber-500/10 border-t border-amber-500/20 shrink-0">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-[9px] text-amber-400 font-bold"><i class="fa-solid fa-highlighter mr-1"></i>选中正文段落</span>
                            <button class="text-dim hover:text-gray-800 text-[9px]" onclick="Modules.writer._clearChatSelection()"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <div id="w-chat-selection-text" class="text-[10px] text-dim max-h-16 overflow-y-auto bg-gray-100 rounded p-1.5 font-mono"></div>
                    </div>
                    <!-- 输入区域 -->
                    <div class="flex gap-2 p-3 border-t border-gray-200 shrink-0 bg-white">
                        <div class="flex-1 flex flex-col gap-1">
                            <textarea id="w-chat-in" class="input flex-1 h-16 text-xs bg-gray-100 border-gray-300 resize-none" placeholder="描述你的需求...&#10;例如：把第二段改得更紧张一些&#10;例如：检查主角性格是否一致&#10;例如：用融合技法的钩子模板重写开头" onkeydown="if(event.key==='Enter' && !event.shiftKey){event.preventDefault();Modules.writer.sendChat()}"></textarea>
                            <div class="flex gap-1">
                                <button class="btn btn-xs bg-gray-100 text-dim flex-1" onclick="Modules.writer._selectTextRange()"><i class="fa-solid fa-highlighter mr-1"></i>选择正文范围</button>
                                <button class="btn btn-xs bg-gray-100 text-dim flex-1" onclick="Modules.writer._insertEntityRef()"><i class="fa-solid fa-at mr-1"></i>引用实体</button>
                            </div>
                        </div>
                        <button class="btn btn-primary h-full px-4" onclick="Modules.writer.sendChat()"><i class="fa-solid fa-paper-plane"></i></button>
                    </div>
                </div>
                <!-- IO Tab -->
                <div id="w-tab-io" class="flex-1 hidden flex flex-col p-0 font-mono min-h-0">
                    <div class="flex-1 border-b border-gray-200 flex flex-col">
                        <div class="px-3 py-1 text-[10px] text-accent bg-gray-100 shrink-0">Input Prompt</div>
                        <textarea id="w-io-input" class="flex-1 bg-transparent border-none text-[10px] p-2 text-dim resize-none" readonly></textarea>
                    </div>
                    <div class="flex-1 flex flex-col">
                        <div class="px-3 py-1 text-[10px] text-green-400 bg-gray-100 shrink-0">Raw Output</div>
                        <textarea id="w-io-output" class="flex-1 bg-transparent border-none text-[10px] p-2 text-dim resize-none" readonly></textarea>
                    </div>
                </div>
                <!-- Diagnose Tab -->
                <div id="w-tab-diagnose" class="flex-1 hidden flex flex-col p-3 gap-2 min-h-0">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-red-600 flex items-center gap-2">
                            <i class="fa-solid fa-stethoscope text-red-400"></i>
                            诊断与分析
                        </span>
                    </div>
                    <div class="flex gap-1 shrink-0">
                        <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30 flex-1" onclick="Modules.writer.diagnoseContent()"><i class="fa-solid fa-stethoscope mr-1"></i>内容诊断</button>
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 flex-1" onclick="Modules.writer.analyzeContent()"><i class="fa-solid fa-chart-line mr-1"></i>深度分析</button>
                    </div>
                    <div class="flex gap-1 shrink-0">
                        <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30 flex-1" onclick="Modules.writer.summarizeContent()"><i class="fa-solid fa-compress mr-1"></i>总结概述</button>
                        <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30 flex-1" onclick="Modules.writer.openSoloPromptModal()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>SOLO提示词</button>
                    </div>
                    <div class="flex-1 overflow-y-auto bg-gray-100 border border-gray-200 rounded p-3 text-xs text-gray-600 leading-relaxed" id="w-diagnose-result">
                        <div class="text-center text-dim py-8">
                            <i class="fa-solid fa-stethoscope text-3xl mb-3 opacity-30"></i>
                            <div>点击上方按钮进行诊断或分析</div>
                            <div class="text-[10px] mt-1">支持内容诊断、深度分析、总结概述、自定义SOLO提示词</div>
                        </div>
                    </div>
                    <div class="flex gap-1 shrink-0">
                        <button class="btn btn-xs bg-gray-100 text-dim flex-1" onclick="Modules.writer._copyDiagnoseResult()"><i class="fa-solid fa-copy mr-1"></i>复制结果</button>
                        <button class="btn btn-xs bg-gray-100 text-dim flex-1" onclick="Modules.writer._clearDiagnoseResult()"><i class="fa-solid fa-trash mr-1"></i>清空</button>
                    </div>
                </div>
            </div>
        </div>
    `,

    // ===== Init & Tree =====
    async init() {
        await this.loadTree();
        this.loadRules();
        this._refreshAiControls();
        this._loadWritingSettings(); // 加载写作设置（人称/基调/字数）
        this._loadStyleLibrary(); // 加载文风库
        if (!this.currentChapterId) {
            const chaps = (await DB.getAll('chapters') || []).sort((a,b) => (a.order||0) - (b.order||0));
            if (chaps.length > 0) {
                const withContent = chaps.find(c => c.content && c.content.trim());
                this.load(withContent ? withContent.id : chaps[0].id);
            }
        }
    },
    _refreshAiControls() {
        const o = Modules.writer.aiOpts;
        document.querySelectorAll('.w-ai-len-btn').forEach(b => {
            if(b.dataset.len === o.length) b.className = 'px-2 py-0.5 rounded text-[9px] font-bold transition-all bg-accent/20 text-accent w-ai-len-btn';
            else b.className = 'px-2 py-0.5 rounded text-[9px] font-bold transition-all text-dim hover:text-gray-800 w-ai-len-btn';
            b.dataset.len = b.dataset.len;
        });
        document.querySelectorAll('.w-ai-style-btn').forEach(b => {
            b.className = `px-2 py-0.5 rounded text-[9px] font-bold border transition-all w-ai-style-btn ${o.styleKeep ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' : 'bg-gray-100 text-dim border-gray-200'}`;
        });
        document.querySelectorAll('.w-ai-rag-btn').forEach(b => {
            b.className = `px-2 py-0.5 rounded text-[9px] font-bold border transition-all w-ai-rag-btn ${o.ragInject ? 'bg-green-500/15 text-green-400 border-green-500/20' : 'bg-gray-100 text-dim border-gray-200'}`;
        });
        document.querySelectorAll('.w-ai-fusion-btn').forEach(b => {
            b.className = `px-2 py-0.5 rounded text-[9px] font-bold border transition-all w-ai-fusion-btn ${o.fusionInject ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' : 'bg-gray-100 text-dim border-gray-200'}`;
        });
    },
    setAiLen(l) { this.aiOpts.length = l; this._refreshAiControls(); },
    toggleStyleKeep() { this.aiOpts.styleKeep = !this.aiOpts.styleKeep; this._refreshAiControls(); },
    toggleRagInject() { this.aiOpts.ragInject = !this.aiOpts.ragInject; this._refreshAiControls(); },
    toggleFusionInject() { this.aiOpts.fusionInject = !this.aiOpts.fusionInject; this._refreshAiControls(); },
    _setGenerating(on) {
        this._generating = on;
        const btn = document.getElementById('w-ai-btn');
        const stop = document.getElementById('w-stop-btn');
        if(btn) { if(on) btn.classList.add('opacity-50','pointer-events-none'); else btn.classList.remove('opacity-50','pointer-events-none'); }
        if(stop) { if(on) stop.classList.remove('hidden'); else stop.classList.add('hidden'); }
        // 编辑器内部底部状态条
        let overlay = document.getElementById('w-gen-overlay');
        if (on) {
            if (!overlay) {
                const editor = document.getElementById('w-editor');
                if (editor && editor.parentElement) {
                    const div = document.createElement('div');
                    div.id = 'w-gen-overlay';
                    div.style.cssText = 'position:absolute;bottom:12px;left:50%;transform:translateX(-50%);z-index:20;display:flex;align-items:center;gap:8px;padding:8px 20px;border-radius:12px;background:rgba(30,64,175,0.25);border:1px solid rgba(59,130,246,0.3);backdrop-filter:blur(8px);pointer-events:none;';
                    div.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin text-blue-400"></i><span style="font-size:12px;font-weight:700;color:#93c5fd;">AI 正在生成中...</span><span id="w-gen-chars" style="font-size:10px;color:#6b7280;font-family:monospace;margin-left:8px;">0字</span>';
                    editor.parentElement.style.position = 'relative';
                    editor.parentElement.appendChild(div);
                }
            }
        } else {
            if (overlay) overlay.remove();
        }
    },
    _getLenHint() {
        const m = {short:'约200字',medium:'约500字',long:'约1000字'};
        return m[this.aiOpts.length] || '约500字';
    },

    async loadTree() {
        const vols = (await DB.getAll('volumes') || []).sort((a,b) => (a.order||0) - (b.order||0));
        const chaps = (await DB.getAll('chapters') || []).sort((a,b) => (a.order||0) - (b.order||0));
        const list = document.getElementById('w-chap-list');
        if (!list) return;
        let html = '';
        const volCount = vols.length;
        let chapCount = 0;
        let totalWords = 0;
        for (const v of vols) {
            const isVolActive = v.id === this.currentVolumeId;
            html += `<div class="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between group cursor-pointer rounded transition-colors ${isVolActive ? 'bg-amber-500/20 text-amber-400' : 'text-accent hover:bg-gray-100'}" onclick="Modules.writer.selectVol('${v.id}')">
                <span class="truncate"><i class="fa-solid fa-folder ${isVolActive ? 'text-amber-400' : 'text-accent/50'} mr-1"></i>${this._esc(v.title)}</span>
                <div class="hidden group-hover:flex gap-1">
                    <button class="text-dim hover:text-gray-800 text-[9px]" onclick="event.stopPropagation();Modules.writer.rename('vol','${v.id}','${this._esc(v.title)}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="text-dim hover:text-red-400 text-[9px]" onclick="event.stopPropagation();Modules.writer.del('vol','${v.id}')"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>`;
            const volChaps = chaps.filter(c => c.volumeId === v.id);
            chapCount += volChaps.length;
            for (const c of volChaps) {
                const isActive = c.id === this.currentChapterId;
                const wordCount = (c.content||'').length;
                totalWords += wordCount;
                html += `<div class="px-3 py-1.5 text-xs cursor-pointer rounded flex items-center justify-between group transition-colors ${isActive ? 'bg-accent/10 text-accent font-bold' : 'text-dim hover:bg-gray-100 hover:text-gray-800'}" onclick="Modules.writer.load('${c.id}')">
                    <span class="truncate"><i class="fa-solid fa-file-lines text-gray-800/20 mr-1.5"></i>${this._esc(c.title)}</span>
                    <div class="flex items-center gap-1">
                        <span class="text-[8px] text-dim/50 font-mono">${wordCount > 0 ? wordCount : ''}</span>
                        <div class="hidden group-hover:flex gap-1">
                            <button class="text-dim hover:text-gray-800 text-[9px]" onclick="event.stopPropagation();Modules.writer.rename('chap','${c.id}','${this._esc(c.title)}')"><i class="fa-solid fa-pen"></i></button>
                            <button class="text-dim hover:text-red-400 text-[9px]" onclick="event.stopPropagation();Modules.writer.del('chap','${c.id}')"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                </div>`;
            }
        }
        const orphans = chaps.filter(c => !c.volumeId || !vols.find(v => v.id === c.volumeId));
        if (orphans.length > 0) {
            html += `<div class="px-2 py-1.5 text-[10px] font-bold text-dim uppercase tracking-wider mt-2"><i class="fa-solid fa-folder-open mr-1"></i>未分卷</div>`;
            chapCount += orphans.length;
            for (const c of orphans) {
                const isActive = c.id === this.currentChapterId;
                const wordCount = (c.content||'').length;
                totalWords += wordCount;
                html += `<div class="px-3 py-1.5 text-xs cursor-pointer rounded flex items-center justify-between group transition-colors ${isActive ? 'bg-accent/10 text-accent font-bold' : 'text-dim hover:bg-gray-100 hover:text-gray-800'}" onclick="Modules.writer.load('${c.id}')">
                    <span class="truncate"><i class="fa-solid fa-file-lines text-gray-800/20 mr-1.5"></i>${this._esc(c.title)}</span>
                    <div class="hidden group-hover:flex gap-1">
                        <button class="text-dim hover:text-gray-800 text-[9px]" onclick="event.stopPropagation();Modules.writer.rename('chap','${c.id}','${this._esc(c.title)}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="text-dim hover:text-red-400 text-[9px]" onclick="event.stopPropagation();Modules.writer.del('chap','${c.id}')"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>`;
            }
        }
        list.innerHTML = html;
        const vc = document.getElementById('w-vol-count'); if(vc) vc.textContent = volCount;
        const cc = document.getElementById('w-chap-count'); if(cc) cc.textContent = chapCount;
        const tw = document.getElementById('w-total-words'); if(tw) tw.textContent = '总字数: ' + totalWords.toLocaleString();
    },
    _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; },
    selectVol(id) {
        this.currentVolumeId = id;
        this.currentChapterId = null;
        this.loadTree();
        UI.toast('已选中卷，新建章节将归属此卷');
    },

    // ===== CRUD =====
    newVol() {
        const list = document.getElementById('w-chap-list');
        if (!list || list.querySelector('.w-inline-input')) return;
        const row = document.createElement('div');
        row.className = 'w-inline-input flex items-center gap-1 px-2 py-1';
        row.innerHTML = `<i class="fa-solid fa-folder-plus text-accent text-xs"></i>
            <input class="flex-1 bg-gray-100 border border-accent/40 rounded px-2 py-1 text-xs text-gray-800 focus:outline-none" placeholder="输入卷名..." autofocus
                onkeydown="if(event.key==='Enter')Modules.writer._confirmNewVol(this.value);if(event.key==='Escape')Modules.writer.loadTree();">
            <button class="text-accent text-xs hover:text-gray-800" onclick="Modules.writer._confirmNewVol(this.previousElementSibling.value)"><i class="fa-solid fa-check"></i></button>
            <button class="text-dim text-xs hover:text-red-400" onclick="Modules.writer.loadTree()"><i class="fa-solid fa-xmark"></i></button>`;
        // 找到当前卷的最后一个元素，在其后插入
        let inserted = false;
        if (this.currentVolumeId) {
            const allItems = list.children;
            let foundVol = false;
            let lastInVol = null;
            for (let i = 0; i < allItems.length; i++) {
                const item = allItems[i];
                const onclick = item.getAttribute('onclick') || '';
                // 找到当前卷的卷头
                if (onclick.includes("currentVolumeId='" + this.currentVolumeId + "'")) {
                    foundVol = true;
                    lastInVol = item;
                    continue;
                }
                if (foundVol) {
                    // 遇到下一个卷头或未分卷区域就停止
                    if (item.querySelector('.fa-folder') && !onclick.includes("Modules.writer.load")) {
                        break;
                    }
                    lastInVol = item;
                }
            }
            if (lastInVol) {
                lastInVol.after(row);
                inserted = true;
            }
        }
        if (!inserted) list.appendChild(row);
        row.querySelector('input').focus();
    },
    async _confirmNewVol(title) {
        if (!title || !title.trim()) return UI.toast('卷名不能为空', 'error');
        const vols = (await DB.getAll('volumes') || []).sort((a,b) => (a.order||0) - (b.order||0));
        const id = Utils.uuid();
        // 找到当前卷的order，新卷插入其后
        let insertOrder = vols.length + 1;
        if (this.currentVolumeId) {
            const curVol = vols.find(v => v.id === this.currentVolumeId);
            if (curVol) {
                insertOrder = (curVol.order || 0) + 1;
                // 后面的卷order全部+1
                for (const v of vols) {
                    if ((v.order || 0) >= insertOrder) {
                        v.order = (v.order || 0) + 1;
                        await DB.put('volumes', v);
                    }
                }
            }
        }
        await DB.put('volumes', { id, title: title.trim(), order: insertOrder });
        this.currentVolumeId = id;
        this.loadTree();
        UI.toast('已新建卷：' + title.trim());
    },
    newChap() {
        const list = document.getElementById('w-chap-list');
        if (!list || list.querySelector('.w-inline-input')) return;
        const row = document.createElement('div');
        row.className = 'w-inline-input flex items-center gap-1 px-2 py-1';
        row.innerHTML = `<i class="fa-solid fa-file-circle-plus text-blue-400 text-xs"></i>
            <input class="flex-1 bg-gray-100 border border-blue-400/40 rounded px-2 py-1 text-xs text-gray-800 focus:outline-none" placeholder="输入章节名..." autofocus
                onkeydown="if(event.key==='Enter')Modules.writer._confirmNewChap(this.value);if(event.key==='Escape')Modules.writer.loadTree();">
            <button class="text-blue-400 text-xs hover:text-gray-800" onclick="Modules.writer._confirmNewChap(this.previousElementSibling.value)"><i class="fa-solid fa-check"></i></button>
            <button class="text-dim text-xs hover:text-red-400" onclick="Modules.writer.loadTree()"><i class="fa-solid fa-xmark"></i></button>`;
        // 插入到当前选中章节的后面
        let inserted = false;
        if (this.currentChapterId) {
            const allItems = list.children;
            for (let i = 0; i < allItems.length; i++) {
                const onclick = allItems[i].getAttribute('onclick') || '';
                if (onclick.includes("Modules.writer.load('" + this.currentChapterId + "')")) {
                    allItems[i].after(row);
                    inserted = true;
                    break;
                }
            }
        }
        if (!inserted) list.appendChild(row);
        row.querySelector('input').focus();
    },
    async _confirmNewChap(title) {
        if (!title || !title.trim()) return UI.toast('章节名不能为空', 'error');
        const chaps = (await DB.getAll('chapters') || []).sort((a,b) => (a.order||0) - (b.order||0));
        const id = Utils.uuid();
        let insertOrder = chaps.length + 1;
        let volId = this.currentVolumeId || null;
        
        if (this.currentChapterId) {
            const curChap = chaps.find(c => c.id === this.currentChapterId);
            if (curChap) {
                insertOrder = (curChap.order || 0) + 1;
                volId = curChap.volumeId || volId;
                for (const c of chaps) {
                    if (c.volumeId === volId && (c.order || 0) >= insertOrder) {
                        c.order = (c.order || 0) + 1;
                        await DB.put('chapters', c);
                    }
                }
            }
        } else if (volId) {
            const volChaps = chaps.filter(c => c.volumeId === volId).sort((a,b) => (a.order||0) - (b.order||0));
            if (volChaps.length > 0) {
                const lastChap = volChaps[volChaps.length - 1];
                insertOrder = (lastChap.order || 0) + 1;
            } else {
                insertOrder = 1;
            }
            for (const c of chaps) {
                if (c.volumeId === volId && (c.order || 0) >= insertOrder) {
                    c.order = (c.order || 0) + 1;
                    await DB.put('chapters', c);
                }
            }
        }
        
        await DB.put('chapters', { id, title: title.trim(), content: '', outline: '', order: insertOrder, volumeId: volId });
        this.loadTree();
        this.load(id);
        UI.toast('已新建章节：' + title.trim());
    },
    rename(type, id, oldTitle) {
        const el = event.target.closest('[onclick]').parentElement.parentElement;
        if (!el) return;
        const span = el.querySelector('span');
        if (!span) return;
        span.innerHTML = `<input class="bg-gray-100 border border-accent/40 rounded px-1 py-0.5 text-xs text-gray-800 w-full focus:outline-none" value="${oldTitle}"
            onkeydown="if(event.key==='Enter')Modules.writer._confirmRename('${type}','${id}',this.value);if(event.key==='Escape')Modules.writer.loadTree();"
            onblur="Modules.writer.loadTree()">`;
        const inp = span.querySelector('input');
        if (inp) { inp.focus(); inp.select(); }
    },
    async _confirmRename(type, id, title) {
        if (!title || !title.trim()) return this.loadTree();
        const store = type === 'vol' ? 'volumes' : 'chapters';
        const item = await DB.get(store, id);
        if (item) { item.title = title.trim(); await DB.put(store, item); }
        this.loadTree();
    },
    async del(type, id) {
        if (!confirm('确定删除？')) return;
        const store = type === 'vol' ? 'volumes' : 'chapters';
        await DB.del(store, id);
        if (type === 'chap' && id === this.currentChapterId) {
            this.currentChapterId = null;
            const ed = document.getElementById('w-editor'); if (ed) ed.value = '';
            const ti = document.getElementById('w-title'); if (ti) ti.value = '';
            const ol = document.getElementById('w-outline'); if (ol) ol.value = '';
        }
        this.loadTree();
    },
    async clearAll() {
        if (!confirm('确定清空所有卷和章节？此操作不可撤销！')) return;
        const vols = await DB.getAll('volumes') || [];
        const chaps = await DB.getAll('chapters') || [];
        for (const v of vols) await DB.del('volumes', v.id);
        for (const c of chaps) await DB.del('chapters', c.id);
        this.currentChapterId = null;
        const ed = document.getElementById('w-editor'); if (ed) ed.value = '';
        const ti = document.getElementById('w-title'); if (ti) ti.value = '';
        const ol = document.getElementById('w-outline'); if (ol) ol.value = '';
        this.loadTree();
        UI.toast('已清空');
    },

    // ===== Load & Save =====
    async load(id) {
        const chap = await DB.get('chapters', id);
        if (!chap) return;
        this.currentChapterId = id;
        this.currentVolumeId = chap.volumeId || this.currentVolumeId;
        const ed = document.getElementById('w-editor'); if (ed) ed.value = chap.content || '';
        const ti = document.getElementById('w-title'); if (ti) ti.value = chap.title || '';
        const ol = document.getElementById('w-outline'); if (ol) ol.value = chap.outline || '';
        this.onInput();
        this.loadTree();
    },
    async saveContent() {
        if (!this.currentChapterId) return UI.toast('请先选择章节');
        const chap = await DB.get('chapters', this.currentChapterId);
        if (!chap) return;
        chap.outline = (document.getElementById('w-outline') || {}).value || '';
        await DB.put('chapters', chap);
        UI.toast('大纲已保存');
    },
    async save() {
        if (!this.currentChapterId) return UI.toast('请先选择或新建章节');
        const chap = await DB.get('chapters', this.currentChapterId);
        if (!chap) return;
        chap.content = (document.getElementById('w-editor') || {}).value || '';
        chap.title = (document.getElementById('w-title') || {}).value || chap.title;
        chap.outline = (document.getElementById('w-outline') || {}).value || '';
        await DB.put('chapters', chap);
        const st = document.getElementById('w-save-status');
        if (st) st.textContent = '已保存 ' + new Date().toLocaleTimeString();
        UI.toast('已保存', 'success');
        this.loadTree();
    },
    async saveRules() {
        const rules = (document.getElementById('w-rules') || {}).value || '';
        const contRules = (document.getElementById('w-continue-rules') || {}).value || '';
        const polishRules = (document.getElementById('w-polish-rules') || {}).value || '';
        const styleSource = (document.getElementById('w-style-source') || {}).value || '';
        const styleExtracted = (document.getElementById('w-style-extracted') || {}).value || '';
        await DB.put('settings', { id: 'writer_rules', rules, continueRules: contRules, polishRules, styleSource, styleExtracted });
        UI.toast('规则已保存');
    },
    async loadRules() {
        const data = await DB.get('settings', 'writer_rules');
        if (data) {
            const r = document.getElementById('w-rules'); if (r) r.value = data.rules || '';
            const cr = document.getElementById('w-continue-rules'); if (cr) cr.value = data.continueRules || '';
            const pr = document.getElementById('w-polish-rules'); if (pr) pr.value = data.polishRules || '';
            const ss = document.getElementById('w-style-source'); if (ss) ss.value = data.styleSource || '';
            const se = document.getElementById('w-style-extracted'); if (se) se.value = data.styleExtracted || '';
        }
    },
    onInput() {
        const ed = document.getElementById('w-editor');
        const st = document.getElementById('w-stats');
        if (ed && st) st.textContent = ed.value.length;
    },

    // ===== Tabs =====
    tab(t) {
        ['outline','fusion','rules','rag','chat','io','diagnose'].forEach(x => {
            const el = document.getElementById('w-tab-' + x);
            const btn = document.getElementById('w-tab-btn-' + x);
            if (el) { if (x === t) el.classList.remove('hidden'); else el.classList.add('hidden'); }
            if (btn) { if (x === t) btn.classList.add('active'); else btn.classList.remove('active'); }
        });
        this.activeTab = t;
        if (t === 'fusion') this._loadFusionData();
    },
    updateIO(input, output) {
        // 自动切换到IO tab（如果正在生成）
        if (this._generating && this.activeTab !== 'io') this.tab('io');
        const inEl = document.getElementById('w-io-input');
        const outEl = document.getElementById('w-io-output');
        if (inEl) inEl.value = input || '';
        if (outEl) outEl.value = output || '';
        // 更新浮层字数
        const chars = document.getElementById('w-gen-chars');
        if (chars && output) chars.textContent = output.length + '字';
    },

    // ===== 融合数据加载 =====
    _loadFusionData() {
        const el = document.getElementById('w-fusion-data');
        if (!el) return;
        const ctx = this._getFusionContext();
        el.value = ctx || '暂无融合拆书数据。\n\n请先在「融合拆书」中运行流水线，完成拆解→对比→融合后数据将自动可用。';
    },

    // ===== 从世界引擎拉取到大纲 =====
    async pullWorldForChapter() {
        const ol = document.getElementById('w-outline');
        if(!ol) return;
        let ctx = '';
        try {
            const entities = await DB.getAll('entities') || [];
            entities.filter(e => !e.id.startsWith('world_')).forEach(e => { ctx += `[${e.type}] ${e.name}: ${(e.desc||'').slice(0,100)}\n`; });
            entities.filter(e => e.id.startsWith('world_')).forEach(e => { ctx += `[世界观] ${(e.desc||'').slice(0,200)}\n`; });
        } catch(e) {}
        if(!ctx) return UI.toast('世界引擎暂无数据');
        ol.value = (ol.value ? ol.value + '\n\n' : '') + '[世界引擎参考]\n' + ctx;
        UI.toast('已拉取世界引擎设定到大纲');
    },

    // ===== 从融合拆书拉取到大纲 =====
    async pullFusionForChapter() {
        const ol = document.getElementById('w-outline');
        if(!ol) return;
        let ctx = this._getFusionContext();
        if(!ctx) {
            try {
                const store = await DB.get('settings', 'memory_persistent');
                if(store && store.items) {
                    store.items.filter(m => m.category === 'analysis').slice(-3).forEach(a => { ctx += a.content.slice(0,300) + '\n---\n'; });
                }
            } catch(e) {}
        }
        if(!ctx) return UI.toast('融合拆书暂无数据');
        ol.value = (ol.value ? ol.value + '\n\n' : '') + '[融合拆书技法参考]\n' + ctx;
        UI.toast('已拉取融合技法到大纲');
    },

    // ===== RAG (旗舰强化版：多维度实体关联 + 章节卷维度检索 + 知识图谱集成) =====
    _ragData: { entities: [], world: [], fusion: [], chapters: [], knowledgeGraph: [], writingPatterns: [] },
    _ragCurrentSource: 'all',
    _ragFilters: { volumeId: null, chapterRange: null, entityTypes: [] },

    async refreshRAG() {
        const resultsEl = document.getElementById('w-rag-results');
        if (!resultsEl) return;
        
        resultsEl.innerHTML = '<div class="text-center text-dim py-4"><i class="fa-solid fa-spinner fa-spin text-xl mb-2"></i><div>正在检索上下文...</div></div>';
        
        try {
            const editorText = (document.getElementById('w-editor') || {}).value || '';
            const outlineText = (document.getElementById('w-outline') || {}).value || '';
            const title = (document.getElementById('w-title') || {}).value || '';
            const query = (title + ' ' + outlineText + ' ' + editorText).slice(-800);
            
            const entities = await DB.getAll('entities') || [];
            const normalEntities = entities.filter(e => !e.id.startsWith('world_'));
            const worldEntities = entities.filter(e => e.id.startsWith('world_'));
            
            const fusionCtx = this._getFusionContext();
            
            const chapters = await DB.getAll('chapters') || [];
            const volumes = await DB.getAll('volumes') || [];
            const currentChapter = chapters.find(c => c.id === this.currentChapterId);
            const currentVolume = volumes.find(v => v.id === this.currentVolumeId);
            
            const knowledgeGraph = await this._buildKnowledgeGraph(normalEntities);
            const writingPatterns = await this._loadWritingPatterns();
            
            const entitiesEl = document.getElementById('w-rag-entities');
            const worldEl = document.getElementById('w-rag-world');
            const fusionEl = document.getElementById('w-rag-fusion');
            const chaptersEl = document.getElementById('w-rag-chapters');
            
            if (entitiesEl) entitiesEl.textContent = normalEntities.length;
            if (worldEl) worldEl.textContent = worldEntities.length;
            if (fusionEl) fusionEl.textContent = fusionCtx ? '1' : '0';
            if (chaptersEl) chaptersEl.textContent = chapters.length;
            
            this._ragData = {
                entities: normalEntities,
                world: worldEntities,
                fusion: fusionCtx ? [{ id: 'fusion', name: '融合技法精华', content: fusionCtx }] : [],
                chapters: chapters,
                volumes: volumes,
                knowledgeGraph: knowledgeGraph,
                writingPatterns: writingPatterns,
                currentChapter: currentChapter,
                currentVolume: currentVolume
            };
            
            const relevantEntities = await this._findRelevantEntitiesEnhanced(query, normalEntities, 10);
            const relevantWorld = this._findRelevantWorld(query, worldEntities, 5);
            const relevantChapters = await this._findRelevantChapters(query, chapters, 3);
            const relatedEntities = this._findRelatedEntitiesFromGraph(query, knowledgeGraph, 5);
            
            this._renderRAGResultsEnhanced(relevantEntities, relevantWorld, fusionCtx, currentChapter, relevantChapters, relatedEntities, writingPatterns);
            
        } catch (e) {
            resultsEl.innerHTML = `<div class="text-center text-red-400 py-4"><i class="fa-solid fa-exclamation-triangle text-xl mb-2"></i><div>检索失败: ${e.message}</div></div>`;
        }
    },

    async _buildKnowledgeGraph(entities) {
        const graph = { nodes: [], edges: [] };
        const nodeMap = new Map();
        
        entities.forEach(e => {
            nodeMap.set(e.name, {
                id: e.id,
                name: e.name,
                type: e.type || '其他',
                desc: e.desc || '',
                relations: e.relations || [],
                chapterRef: e.chapterRef || []
            });
            graph.nodes.push({
                id: e.id,
                label: e.name,
                type: e.type || '其他',
                size: (e.relations?.length || 0) + 1
            });
        });
        
        entities.forEach(e => {
            if (e.relations && e.relations.length > 0) {
                e.relations.forEach(rel => {
                    const match = rel.match(/(.+?)[：:]\s*(.+)/);
                    if (match) {
                        const relationType = match[1];
                        const targetName = match[2];
                        if (nodeMap.has(targetName)) {
                            graph.edges.push({
                                source: e.id,
                                target: nodeMap.get(targetName).id,
                                relation: relationType,
                                label: relationType
                            });
                        }
                    }
                });
            }
        });
        
        return graph;
    },

    async _loadWritingPatterns() {
        const patterns = [];
        try {
            const saved = await DB.get('settings', 'writer_patterns');
            if (saved && saved.patterns) {
                patterns.push(...saved.patterns);
            }
            const fusionCtx = this._getFusionContext();
            if (fusionCtx) {
                patterns.push({
                    id: 'fusion_hooks',
                    name: '融合技法-钩子模板',
                    source: 'fusion',
                    content: fusionCtx.slice(0, 1500)
                });
            }
        } catch(e) {}
        return patterns;
    },

    async _findRelevantEntitiesEnhanced(query, entities, limit) {
        if (!query || !entities.length) return entities.slice(0, limit);
        
        const queryLower = query.toLowerCase();
        const keywords = queryLower.split(/[\s,，。！？、]+/).filter(k => k.length > 1);
        
        const currentChapterNum = this.currentChapterId ? 
            parseInt((await DB.get('chapters', this.currentChapterId))?.order || 0) : 0;
        
        const scored = entities.map(e => {
            let score = 0;
            const nameLower = (e.name || '').toLowerCase();
            const descLower = (e.desc || '').toLowerCase();
            
            if (queryLower.includes(nameLower)) score += 15;
            keywords.forEach(k => {
                if (nameLower.includes(k)) score += 8;
                if (descLower.includes(k)) score += 3;
            });
            if (queryLower.includes((e.type || '').toLowerCase())) score += 5;
            
            if (e.chapterRef && e.chapterRef.length > 0) {
                const nearestChapter = e.chapterRef.reduce((prev, curr) => 
                    Math.abs(curr - currentChapterNum) < Math.abs(prev - currentChapterNum) ? curr : prev
                );
                const distance = Math.abs(nearestChapter - currentChapterNum);
                if (distance <= 3) score += 10;
                else if (distance <= 10) score += 5;
            }
            
            if (e.relations && e.relations.length > 0) {
                score += Math.min(e.relations.length * 2, 10);
            }
            
            return { ...e, score };
        });
        
        return scored.sort((a, b) => b.score - a.score).slice(0, limit);
    },

    async _findRelevantChapters(query, chapters, limit) {
        if (!query || !chapters.length) return [];
        
        const queryLower = query.toLowerCase();
        const keywords = queryLower.split(/[\s,，。！？、]+/).filter(k => k.length > 1);
        
        const scored = chapters.map(c => {
            let score = 0;
            const titleLower = (c.title || '').toLowerCase();
            const outlineLower = (c.outline || '').toLowerCase();
            const contentLower = (c.content || '').toLowerCase().slice(0, 500);
            
            keywords.forEach(k => {
                if (titleLower.includes(k)) score += 10;
                if (outlineLower.includes(k)) score += 5;
                if (contentLower.includes(k)) score += 3;
            });
            
            return { ...c, score };
        });
        
        return scored.filter(c => c.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
    },

    _findRelatedEntitiesFromGraph(query, graph, limit) {
        if (!graph || !graph.nodes.length) return [];
        
        const queryLower = query.toLowerCase();
        const relatedNodes = [];
        
        graph.nodes.forEach(node => {
            if (queryLower.includes(node.label.toLowerCase())) {
                const connectedEdges = graph.edges.filter(e => 
                    e.source === node.id || e.target === node.id
                );
                connectedEdges.forEach(edge => {
                    const targetId = edge.source === node.id ? edge.target : edge.source;
                    const targetNode = graph.nodes.find(n => n.id === targetId);
                    if (targetNode && !relatedNodes.find(r => r.id === targetNode.id)) {
                        relatedNodes.push({
                            ...targetNode,
                            relationFrom: node.label,
                            relationType: edge.relation
                        });
                    }
                });
            }
        });
        
        return relatedNodes.slice(0, limit);
    },

    _renderRAGResultsEnhanced(entities, world, fusion, currentChapter, relevantChapters, relatedEntities, writingPatterns) {
        const resultsEl = document.getElementById('w-rag-results');
        if (!resultsEl) return;
        
        let html = '';
        
        if (entities.length > 0) {
            html += `<div class="mb-3">
                <div class="text-[9px] text-cyan-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-user"></i>相关实体 (${entities.length})
                    <button class="ml-auto text-dim hover:text-gray-800" onclick="Modules.writer._showAllEntities()"><i class="fa-solid fa-expand"></i></button>
                </div>
                <div class="space-y-1">
                    ${entities.map(e => `
                        <div class="p-2 bg-cyan-500/5 rounded border border-cyan-500/10 cursor-pointer hover:bg-cyan-500/10 transition-all" onclick="Modules.writer._showEntityDetail('${e.id}')">
                            <div class="flex items-center gap-2 mb-0.5">
                                <span class="text-[8px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300">${e.type || '其他'}</span>
                                <span class="text-xs text-gray-800 font-bold">${this._esc(e.name)}</span>
                                ${e.score ? `<span class="text-[8px] text-amber-400 ml-auto">★${e.score}</span>` : ''}
                            </div>
                            <div class="text-[10px] text-dim line-clamp-2">${this._esc((e.desc || '').slice(0, 100))}</div>
                            ${e.relations && e.relations.length ? `<div class="text-[8px] text-cyan-400 mt-1"><i class="fa-solid fa-link mr-1"></i>${e.relations.slice(0, 3).join(' · ')}</div>` : ''}
                            ${e.chapterRef && e.chapterRef.length ? `<div class="text-[8px] text-green-400 mt-0.5"><i class="fa-solid fa-bookmark mr-1"></i>章节: ${e.chapterRef.slice(0, 5).join(', ')}${e.chapterRef.length > 5 ? '...' : ''}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }
        
        if (relatedEntities && relatedEntities.length > 0) {
            html += `<div class="mb-3">
                <div class="text-[9px] text-pink-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-project-diagram"></i>关联实体网络 (${relatedEntities.length})
                </div>
                <div class="space-y-1">
                    ${relatedEntities.map(e => `
                        <div class="p-2 bg-pink-500/5 rounded border border-pink-500/10 cursor-pointer hover:bg-pink-500/10 transition-all">
                            <div class="flex items-center gap-2">
                                <span class="text-[8px] px-1 py-0.5 rounded bg-pink-500/20 text-pink-300">${e.type || '其他'}</span>
                                <span class="text-xs text-gray-800">${this._esc(e.label || e.name)}</span>
                            </div>
                            <div class="text-[9px] text-pink-300 mt-1">
                                <i class="fa-solid fa-arrow-right-arrow-left mr-1"></i>
                                ${e.relationFrom} — ${e.relationType} — ${e.label}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }
        
        if (world.length > 0) {
            const catLabels = {
                history: '历史与传说', geography: '地理与地貌', magic: '魔法/科技体系',
                factions: '势力与组织', species: '种族与生物', rules: '世界规则', culture: '文化与习俗'
            };
            html += `<div class="mb-3">
                <div class="text-[9px] text-amber-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-earth-americas"></i>世界观设定 (${world.length})
                </div>
                <div class="space-y-1">
                    ${world.map(w => {
                        const cat = (w.id || '').replace('world_', '');
                        return `
                        <div class="p-2 bg-amber-500/5 rounded border border-amber-500/10 cursor-pointer hover:bg-amber-500/10 transition-all" onclick="Modules.writer._showWorldDetail('${w.id}')">
                            <div class="flex items-center gap-2 mb-0.5">
                                <span class="text-xs text-amber-300 font-bold">${catLabels[cat] || w.name}</span>
                            </div>
                            <div class="text-[10px] text-dim line-clamp-3">${this._esc((w.desc || '').slice(0, 150))}</div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
        }
        
        if (relevantChapters && relevantChapters.length > 0) {
            html += `<div class="mb-3">
                <div class="text-[9px] text-green-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-file-lines"></i>相关章节 (${relevantChapters.length})
                </div>
                <div class="space-y-1">
                    ${relevantChapters.map(c => `
                        <div class="p-2 bg-green-500/5 rounded border border-green-500/10 cursor-pointer hover:bg-green-500/10 transition-all" onclick="Modules.writer.load('${c.id}')">
                            <div class="text-xs text-green-300 font-bold">${this._esc(c.title)}</div>
                            <div class="text-[9px] text-dim line-clamp-2 mt-1">${this._esc((c.outline || '').slice(0, 100))}</div>
                            ${c.score ? `<div class="text-[8px] text-amber-400 mt-1">相关度: ${c.score}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }
        
        if (fusion) {
            html += `<div class="mb-3">
                <div class="text-[9px] text-purple-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>融合技法精华
                </div>
                <div class="p-2 bg-purple-500/5 rounded border border-purple-500/10">
                    <div class="text-[10px] text-dim leading-relaxed max-h-32 overflow-y-auto">${this._esc(fusion.slice(0, 500))}...</div>
                </div>
            </div>`;
        }
        
        if (writingPatterns && writingPatterns.length > 0) {
            html += `<div class="mb-3">
                <div class="text-[9px] text-indigo-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-lightbulb"></i>写作模式参考 (${writingPatterns.length})
                </div>
                <div class="space-y-1">
                    ${writingPatterns.slice(0, 3).map(p => `
                        <div class="p-2 bg-indigo-500/5 rounded border border-indigo-500/10">
                            <div class="text-[10px] text-indigo-300 font-bold">${p.name}</div>
                            <div class="text-[9px] text-dim line-clamp-2 mt-1">${this._esc((p.content || '').slice(0, 100))}</div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }
        
        if (currentChapter && currentChapter.outline) {
            html += `<div class="mb-3">
                <div class="text-[9px] text-blue-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-map"></i>当前章节大纲
                </div>
                <div class="p-2 bg-blue-500/5 rounded border border-blue-500/10">
                    <div class="text-[10px] text-dim leading-relaxed">${this._esc(currentChapter.outline.slice(0, 300))}</div>
                </div>
            </div>`;
        }
        
        if (!html) {
            html = `<div class="text-center text-dim py-4">
                <i class="fa-solid fa-database text-2xl mb-2 opacity-30"></i>
                <div>暂无相关上下文</div>
                <div class="text-[10px] mt-1">请先在世界引擎中创建实体或导入世界观</div>
            </div>`;
        }
        
        resultsEl.innerHTML = html;
    },

    async _showAllEntities() {
        const entities = await DB.getAll('entities') || [];
        const normalEntities = entities.filter(e => !e.id.startsWith('world_'));
        
        const modal = document.createElement('div');
        modal.id = 'w-all-entities-modal';
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-gray-300 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl border border-gray-300 w-[800px] max-h-[85vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                    <span class="font-bold text-gray-800"><i class="fa-solid fa-users mr-2 text-cyan-400"></i>全部实体 (${normalEntities.length})</span>
                    <button class="text-dim hover:text-gray-800" onclick="this.closest('#w-all-entities-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="p-3 border-b border-gray-200">
                    <input type="text" id="w-entity-filter" class="w-full bg-gray-100 border border-gray-300 rounded-lg p-2 text-sm text-gray-800" placeholder="搜索实体..." oninput="Modules.writer._filterAllEntities(this.value)">
                </div>
                <div id="w-all-entities-list" class="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2">
                    ${normalEntities.map(e => `
                        <div class="p-2 bg-gray-100 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-all" onclick="Modules.writer._showEntityDetail('${e.id}')">
                            <div class="flex items-center gap-2">
                                <span class="text-[8px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300">${e.type || '其他'}</span>
                                <span class="text-xs text-gray-800 font-bold">${this._esc(e.name)}</span>
                            </div>
                            <div class="text-[9px] text-dim mt-1 line-clamp-2">${this._esc((e.desc || '').slice(0, 80))}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this._allEntitiesList = normalEntities;
    },

    _filterAllEntities(keyword) {
        const list = document.getElementById('w-all-entities-list');
        if (!list || !this._allEntitiesList) return;
        
        const filtered = keyword ? 
            this._allEntitiesList.filter(e => 
                e.name.includes(keyword) || 
                (e.desc || '').includes(keyword) ||
                (e.type || '').includes(keyword)
            ) : this._allEntitiesList;
        
        list.innerHTML = filtered.map(e => `
            <div class="p-2 bg-gray-100 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-all" onclick="Modules.writer._showEntityDetail('${e.id}')">
                <div class="flex items-center gap-2">
                    <span class="text-[8px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300">${e.type || '其他'}</span>
                    <span class="text-xs text-gray-800 font-bold">${this._esc(e.name)}</span>
                </div>
                <div class="text-[9px] text-dim mt-1 line-clamp-2">${this._esc((e.desc || '').slice(0, 80))}</div>
            </div>
        `).join('');
    },

    _findRelevantEntities(query, entities, limit) {
        if (!query || !entities.length) return entities.slice(0, limit);
        
        const queryLower = query.toLowerCase();
        const keywords = queryLower.split(/[\s,，。！？、]+/).filter(k => k.length > 1);
        
        const scored = entities.map(e => {
            let score = 0;
            const nameLower = (e.name || '').toLowerCase();
            const descLower = (e.desc || '').toLowerCase();
            
            // 名称完全匹配
            if (queryLower.includes(nameLower)) score += 10;
            // 名称部分匹配
            keywords.forEach(k => {
                if (nameLower.includes(k)) score += 5;
                if (descLower.includes(k)) score += 2;
            });
            // 类型匹配
            if (queryLower.includes((e.type || '').toLowerCase())) score += 3;
            
            return { ...e, score };
        });
        
        return scored.sort((a, b) => b.score - a.score).slice(0, limit);
    },

    _findRelevantWorld(query, worldEntities, limit) {
        if (!query || !worldEntities.length) return worldEntities.slice(0, limit);
        
        const queryLower = query.toLowerCase();
        const catKeywords = {
            history: ['历史', '传说', '故事', '过去', '古代', '纪元'],
            geography: ['地理', '地点', '城市', '山', '河', '位置', '地图'],
            magic: ['魔法', '功法', '技能', '力量', '修炼', '等级'],
            factions: ['势力', '门派', '组织', '阵营', '国家', '家族'],
            species: ['种族', '生物', '妖', '兽', '精灵', '龙'],
            rules: ['规则', '法则', '定律', '禁忌', '限制'],
            culture: ['文化', '习俗', '节日', '信仰', '传统']
        };
        
        const scored = worldEntities.map(e => {
            let score = 0;
            const cat = (e.id || '').replace('world_', '');
            const descLower = (e.desc || '').toLowerCase();
            
            // 分类关键词匹配
            if (catKeywords[cat]) {
                catKeywords[cat].forEach(k => {
                    if (queryLower.includes(k)) score += 5;
                });
            }
            // 内容匹配
            if (queryLower.includes(cat)) score += 3;
            if (descLower.includes(queryLower.slice(0, 20))) score += 2;
            
            return { ...e, score };
        });
        
        return scored.sort((a, b) => b.score - a.score).slice(0, limit);
    },

    _renderRAGResults(entities, world, fusion, currentChapter) {
        const resultsEl = document.getElementById('w-rag-results');
        if (!resultsEl) return;
        
        let html = '';
        
        // 实体部分
        if (entities.length > 0) {
            html += `<div class="mb-3">
                <div class="text-[9px] text-cyan-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-user"></i>相关实体 (${entities.length})
                </div>
                <div class="space-y-1">
                    ${entities.map(e => `
                        <div class="p-2 bg-cyan-500/5 rounded border border-cyan-500/10 cursor-pointer hover:bg-cyan-500/10 transition-all" onclick="Modules.writer._showEntityDetail('${e.id}')">
                            <div class="flex items-center gap-2 mb-0.5">
                                <span class="text-[8px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300">${e.type || '其他'}</span>
                                <span class="text-xs text-gray-800 font-bold">${this._esc(e.name)}</span>
                                ${e.score ? `<span class="text-[8px] text-dim ml-auto">相关度:${e.score}</span>` : ''}
                            </div>
                            <div class="text-[10px] text-dim line-clamp-2">${this._esc((e.desc || '').slice(0, 100))}</div>
                            ${e.relations && e.relations.length ? `<div class="text-[8px] text-cyan-400 mt-1">关联: ${e.relations.slice(0, 3).join(', ')}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }
        
        // 世界观部分
        if (world.length > 0) {
            const catLabels = {
                history: '历史与传说', geography: '地理与地貌', magic: '魔法/科技体系',
                factions: '势力与组织', species: '种族与生物', rules: '世界规则', culture: '文化与习俗'
            };
            html += `<div class="mb-3">
                <div class="text-[9px] text-amber-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-earth-americas"></i>世界观设定 (${world.length})
                </div>
                <div class="space-y-1">
                    ${world.map(w => {
                        const cat = (w.id || '').replace('world_', '');
                        return `
                        <div class="p-2 bg-amber-500/5 rounded border border-amber-500/10 cursor-pointer hover:bg-amber-500/10 transition-all" onclick="Modules.writer._showWorldDetail('${w.id}')">
                            <div class="flex items-center gap-2 mb-0.5">
                                <span class="text-xs text-amber-300 font-bold">${catLabels[cat] || w.name}</span>
                            </div>
                            <div class="text-[10px] text-dim line-clamp-3">${this._esc((w.desc || '').slice(0, 150))}</div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
        }
        
        // 融合技法部分
        if (fusion) {
            html += `<div class="mb-3">
                <div class="text-[9px] text-purple-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>融合技法精华
                </div>
                <div class="p-2 bg-purple-500/5 rounded border border-purple-500/10">
                    <div class="text-[10px] text-dim leading-relaxed max-h-32 overflow-y-auto">${this._esc(fusion.slice(0, 500))}...</div>
                </div>
            </div>`;
        }
        
        // 当前章节大纲
        if (currentChapter && currentChapter.outline) {
            html += `<div class="mb-3">
                <div class="text-[9px] text-green-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-file-lines"></i>当前章节大纲
                </div>
                <div class="p-2 bg-green-500/5 rounded border border-green-500/10">
                    <div class="text-[10px] text-dim leading-relaxed">${this._esc(currentChapter.outline.slice(0, 300))}</div>
                </div>
            </div>`;
        }
        
        if (!html) {
            html = `<div class="text-center text-dim py-4">
                <i class="fa-solid fa-database text-2xl mb-2 opacity-30"></i>
                <div>暂无相关上下文</div>
                <div class="text-[10px] mt-1">请先在世界引擎中创建实体或导入世界观</div>
            </div>`;
        }
        
        resultsEl.innerHTML = html;
    },

    async _showEntityDetail(id) {
        const entity = await DB.get('entities', id);
        if (!entity) return UI.toast('实体不存在', 'error');
        
        const modal = document.createElement('div');
        modal.id = 'w-entity-detail-modal';
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-gray-300 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl border border-gray-300 w-[500px] max-h-[70vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400">${entity.type || '其他'}</span>
                        <span class="font-bold text-gray-800">${this._esc(entity.name)}</span>
                    </div>
                    <button class="text-dim hover:text-gray-800" onclick="this.closest('#w-entity-detail-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto p-4 space-y-3">
                    <div>
                        <div class="text-[10px] text-dim font-bold uppercase mb-1">描述</div>
                        <div class="text-xs text-gray-600 leading-relaxed">${this._esc(entity.desc || '暂无描述')}</div>
                    </div>
                    ${entity.relations && entity.relations.length ? `
                    <div>
                        <div class="text-[10px] text-dim font-bold uppercase mb-1">关联关系</div>
                        <div class="flex flex-wrap gap-1">
                            ${entity.relations.map(r => `<span class="text-[9px] px-2 py-0.5 rounded bg-gray-100 text-dim">${this._esc(r)}</span>`).join('')}
                        </div>
                    </div>` : ''}
                    <div class="text-[9px] text-dim">
                        来源: ${entity.source || '手动创建'} | 
                        更新: ${entity.updatedAt ? new Date(entity.updatedAt).toLocaleString() : '未知'}
                    </div>
                </div>
                <div class="flex gap-2 p-3 border-t border-gray-200">
                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30 flex-1" onclick="Modules.writer._injectEntityToPrompt('${id}')">
                        <i class="fa-solid fa-syringe mr-1"></i>注入到续写
                    </button>
                    <button class="btn btn-xs bg-gray-100 text-dim flex-1" onclick="navigator.clipboard.writeText('${entity.name}: ${entity.desc || ''}');UI.toast('已复制')">
                        <i class="fa-solid fa-copy mr-1"></i>复制
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async _showWorldDetail(id) {
        const world = await DB.get('entities', id);
        if (!world) return UI.toast('世界观不存在', 'error');
        
        const catLabels = {
            history: '历史与传说', geography: '地理与地貌', magic: '魔法/科技体系',
            factions: '势力与组织', species: '种族与生物', rules: '世界规则', culture: '文化与习俗'
        };
        const cat = (id || '').replace('world_', '');
        
        const modal = document.createElement('div');
        modal.id = 'w-world-detail-modal';
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-gray-300 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl border border-gray-300 w-[600px] max-h-[80vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-earth-americas text-amber-400"></i>
                        <span class="font-bold text-gray-800">${catLabels[cat] || world.name}</span>
                    </div>
                    <button class="text-dim hover:text-gray-800" onclick="this.closest('#w-world-detail-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto p-4">
                    <div class="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">${this._esc(world.desc || '暂无内容')}</div>
                </div>
                <div class="flex gap-2 p-3 border-t border-gray-200">
                    <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 flex-1" onclick="Modules.writer._injectWorldToPrompt('${id}')">
                        <i class="fa-solid fa-syringe mr-1"></i>注入到续写
                    </button>
                    <button class="btn btn-xs bg-gray-100 text-dim flex-1" onclick="navigator.clipboard.writeText(\`${world.desc || ''}\`);UI.toast('已复制')">
                        <i class="fa-solid fa-copy mr-1"></i>复制
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async _injectEntityToPrompt(id) {
        const entity = await DB.get('entities', id);
        if (!entity) return;
        
        const input = document.getElementById('w-chat-in');
        if (input) {
            input.value += `\n【引用实体: ${entity.name}】\n类型: ${entity.type || '其他'}\n描述: ${entity.desc || ''}\n`;
        }
        
        const modal = document.getElementById('w-entity-detail-modal');
        if (modal) modal.remove();
        
        this.tab('chat');
        UI.toast('已注入实体: ' + entity.name);
    },

    async _injectWorldToPrompt(id) {
        const world = await DB.get('entities', id);
        if (!world) return;
        
        const input = document.getElementById('w-chat-in');
        if (input) {
            input.value += `\n【引用世界观】\n${world.desc || ''}\n`;
        }
        
        const modal = document.getElementById('w-world-detail-modal');
        if (modal) modal.remove();
        
        this.tab('chat');
        UI.toast('已注入世界观设定');
    },

    async _searchRAG() {
        const searchEl = document.getElementById('w-rag-search');
        const keyword = searchEl?.value?.trim();
        if (!keyword) return this.refreshRAG();
        
        const resultsEl = document.getElementById('w-rag-results');
        if (!resultsEl) return;
        
        resultsEl.innerHTML = '<div class="text-center text-dim py-4"><i class="fa-solid fa-spinner fa-spin"></i></div>';
        
        // 搜索实体
        const entities = await DB.getAll('entities') || [];
        const matched = entities.filter(e => {
            const nameLower = (e.name || '').toLowerCase();
            const descLower = (e.desc || '').toLowerCase();
            const keywordLower = keyword.toLowerCase();
            return nameLower.includes(keywordLower) || descLower.includes(keywordLower);
        });
        
        const normalEntities = matched.filter(e => !e.id.startsWith('world_'));
        const worldEntities = matched.filter(e => e.id.startsWith('world_'));
        
        this._renderRAGResults(normalEntities, worldEntities, null, null);
        
        if (matched.length === 0) {
            resultsEl.innerHTML = `<div class="text-center text-dim py-4">
                <i class="fa-solid fa-search text-2xl mb-2 opacity-30"></i>
                <div>未找到匹配 "${keyword}" 的内容</div>
            </div>`;
        }
    },

    _ragSource(source) {
        this._ragCurrentSource = source;
        const resultsEl = document.getElementById('w-rag-results');
        if (!resultsEl || !this._ragData) return;
        
        const { entities, world, fusion, chapters } = this._ragData;
        
        if (source === 'entities') {
            this._renderRAGResults(entities.slice(0, 15), [], null, null);
        } else if (source === 'world') {
            this._renderRAGResults([], world, null, null);
        } else if (source === 'fusion') {
            this._renderRAGResults([], [], fusion[0]?.content || null, null);
        } else if (source === 'chapters') {
            this._renderRAGResults([], [], null, chapters[0]);
        } else {
            this.refreshRAG();
        }
    },

    _clearRAG() {
        const resultsEl = document.getElementById('w-rag-results');
        if (resultsEl) {
            resultsEl.innerHTML = `<div class="text-center text-dim py-4">
                <i class="fa-solid fa-database text-2xl mb-2 opacity-30"></i>
                <div>点击刷新获取相关上下文</div>
            </div>`;
        }
        this._ragData = { entities: [], world: [], fusion: [], chapters: [] };
        UI.toast('已清空');
    },

    async _injectRAGToPrompt() {
        const { entities, world, fusion } = this._ragData;
        
        let context = '';
        
        if (entities.length > 0) {
            context += '[相关实体]\n';
            entities.slice(0, 5).forEach(e => {
                context += `• ${e.name}(${e.type || '其他'}): ${(e.desc || '').slice(0, 80)}\n`;
            });
            context += '\n';
        }
        
        if (world.length > 0) {
            context += '[世界观设定]\n';
            world.slice(0, 3).forEach(w => {
                context += `${w.name}: ${(w.desc || '').slice(0, 100)}\n`;
            });
            context += '\n';
        }
        
        if (fusion.length > 0 && fusion[0]?.content) {
            context += '[融合技法]\n' + fusion[0].content.slice(0, 500) + '\n';
        }
        
        if (!context) return UI.toast('暂无可注入的上下文', 'error');
        
        const input = document.getElementById('w-chat-in');
        if (input) {
            input.value = context + '\n' + (input.value || '');
        }
        
        this.tab('chat');
        UI.toast('已注入上下文到对话');
    },

    async _buildFullContext() {
        const resultsEl = document.getElementById('w-rag-results');
        if (!resultsEl) return;
        
        resultsEl.innerHTML = '<div class="text-center text-dim py-4"><i class="fa-solid fa-spinner fa-spin"></i><div>正在构建完整上下文...</div></div>';
        
        try {
            // 获取所有数据
            const entities = await DB.getAll('entities') || [];
            const normalEntities = entities.filter(e => !e.id.startsWith('world_'));
            const worldEntities = entities.filter(e => e.id.startsWith('world_'));
            const fusionCtx = this._getFusionContext();
            const chapters = await DB.getAll('chapters') || [];
            const volumes = await DB.getAll('volumes') || [];
            
            // 构建完整上下文
            let fullContext = '# 完整创作上下文\n\n';
            
            // 1. 世界观
            if (worldEntities.length > 0) {
                const catLabels = {
                    history: '历史与传说', geography: '地理与地貌', magic: '魔法/科技体系',
                    factions: '势力与组织', species: '种族与生物', rules: '世界规则', culture: '文化与习俗'
                };
                fullContext += '## 世界观设定\n\n';
                worldEntities.forEach(w => {
                    const cat = (w.id || '').replace('world_', '');
                    fullContext += `### ${catLabels[cat] || w.name}\n${w.desc || ''}\n\n`;
                });
            }
            
            // 2. 实体库
            if (normalEntities.length > 0) {
                const grouped = {};
                normalEntities.forEach(e => {
                    const t = e.type || '其他';
                    if (!grouped[t]) grouped[t] = [];
                    grouped[t].push(e);
                });
                fullContext += '## 实体库\n\n';
                for (const [type, items] of Object.entries(grouped)) {
                    fullContext += `### ${type} (${items.length})\n`;
                    items.forEach(e => {
                        fullContext += `- **${e.name}**: ${(e.desc || '').slice(0, 100)}\n`;
                    });
                    fullContext += '\n';
                }
            }
            
            // 3. 融合技法
            if (fusionCtx) {
                fullContext += '## 融合技法精华\n\n' + fusionCtx.slice(0, 2000) + '\n\n';
            }
            
            // 4. 章节大纲
            if (chapters.length > 0) {
                fullContext += '## 章节大纲\n\n';
                const sortedChapters = chapters.sort((a, b) => (a.order || 0) - (b.order || 0));
                sortedChapters.slice(0, 20).forEach((c, i) => {
                    fullContext += `### 第${i + 1}章: ${c.title}\n${(c.outline || '暂无大纲').slice(0, 200)}\n\n`;
                });
            }
            
            // 5. 统计信息
            fullContext += `---\n\n**统计**: ${volumes.length}卷 · ${chapters.length}章 · ${normalEntities.length}实体 · ${worldEntities.length}世界观维度`;
            
            // 显示结果
            resultsEl.innerHTML = `
                <div class="p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded border border-purple-500/20 mb-2">
                    <div class="text-[10px] text-purple-400 font-bold mb-1">
                        <i class="fa-solid fa-layer-group mr-1"></i>完整上下文已构建
                    </div>
                    <div class="text-[9px] text-dim">${fullContext.length} 字符</div>
                </div>
                <div class="flex gap-1 mb-2">
                    <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30 flex-1" onclick="navigator.clipboard.writeText(\`${fullContext.replace(/`/g, '\\`')}\`);UI.toast('已复制')">
                        <i class="fa-solid fa-copy mr-1"></i>复制全部
                    </button>
                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30 flex-1" onclick="Modules.writer._saveFullContext()">
                        <i class="fa-solid fa-floppy-disk mr-1"></i>保存
                    </button>
                </div>
                <div class="text-[10px] text-gray-600 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto bg-gray-100 rounded p-2">${this._esc(fullContext)}</div>
            `;
            
            this._fullContext = fullContext;
            
        } catch (e) {
            resultsEl.innerHTML = `<div class="text-center text-red-400 py-4"><i class="fa-solid fa-exclamation-triangle"></i><div>构建失败: ${e.message}</div></div>`;
        }
    },

    async _saveFullContext() {
        if (!this._fullContext) return UI.toast('暂无上下文', 'error');
        
        await DB.put('settings', {
            id: 'writer_full_context',
            content: this._fullContext,
            updatedAt: Date.now()
        });
        
        UI.toast('完整上下文已保存');
    },

    async _exportRAG() {
        const { entities, world, fusion } = this._ragData;
        
        let exportText = '# RAG上下文导出\n\n';
        exportText += `导出时间: ${new Date().toLocaleString()}\n\n`;
        
        if (entities.length > 0) {
            exportText += '## 实体\n\n';
            entities.forEach(e => {
                exportText += `### ${e.name} (${e.type || '其他'})\n${e.desc || ''}\n\n`;
            });
        }
        
        if (world.length > 0) {
            exportText += '## 世界观\n\n';
            world.forEach(w => {
                exportText += `### ${w.name}\n${w.desc || ''}\n\n`;
            });
        }
        
        if (fusion.length > 0 && fusion[0]?.content) {
            exportText += '## 融合技法\n\n' + fusion[0].content + '\n';
        }
        
        Utils.download('RAG上下文_' + new Date().toLocaleDateString() + '.md', exportText);
        UI.toast('已导出');
    },

    // ===== 获取前章摘要(用于续写上下文) =====
    async _getPrevChapterSummary() {
        if (!this.currentChapterId) return '';
        const chaps = (await DB.getAll('chapters') || []).sort((a,b) => (a.order||0) - (b.order||0));
        const idx = chaps.findIndex(c => c.id === this.currentChapterId);
        if (idx <= 0) return '';
        const prev = chaps[idx - 1];
        if (!prev || !prev.content) return '';
        return '[前一章: ' + (prev.title || '') + ']\n' + prev.content.slice(-1500);
    },

    // ===== 获取提取的文风(用于续写) =====
    // 获取当前选中的文风（从文风库）
    async _getExtractedStyle() {
        try {
            const activeStyle = await DB.get('settings', 'writer_active_style');
            return activeStyle?.style || '';
        } catch(e) {
            return '';
        }
    },

    // ===== 文风提取功能 =====
    async extractStyle() {
        if (this._generating) return;
        const sourceEl = document.getElementById('w-style-source');
        const resultEl = document.getElementById('w-style-extracted');
        if (!sourceEl || !resultEl) return;
        
        const sourceText = sourceEl.value.trim();
        if (!sourceText) return UI.toast('请先粘贴原文样例', 'error');
        if (sourceText.length < 100) return UI.toast('原文样例太短，至少需要100字', 'error');

        const prompt = `你是一位专业的文学分析师，擅长分析文本的写作风格。请仔细分析以下原文的文风特征，并提取出可以用于指导AI写作的风格描述。

[原文]
${sourceText.slice(0, 3000)}

[分析要求]
请从以下维度分析并提取文风特征：
1. **叙事视角**：第一人称/第三人称，全知/有限视角
2. **语言风格**：华丽/朴实，文言/白话，书面/口语化
3. **句式特点**：长句为主/短句为主，排比/对仗，断句节奏
4. **修辞手法**：比喻、拟人、夸张等常用手法
5. **情感基调**：严肃/轻松，压抑/明快，冷峻/热情
6. **描写偏好**：心理描写/动作描写/环境描写的比例和深度
7. **对话风格**：对话的密度、长度、语气特点
8. **节奏控制**：情节推进速度，场景切换方式
9. **特色表达**：作者的标志性用词、句式或表达习惯

[输出格式]
请以简洁的列表形式输出，每个维度1-2句话，总字数控制在300-500字。输出内容应该能直接作为AI写作的风格指南。`;

        this._setGenerating(true);
        UI.toast('正在分析文风...');
        
        let result = '';
        try {
            await AI.generate(prompt, {}, c => { result += c; });
            if (result.trim()) {
                resultEl.value = result.trim();
                UI.toast('文风提取完成！');
            } else {
                UI.toast('提取结果为空', 'error');
            }
        } catch (e) {
            UI.toast('提取失败: ' + e.message, 'error');
        }
        
        this._setGenerating(false);
    },

    // ===== 清空文风提取 =====
    clearStyleExtract() {
        const sourceEl = document.getElementById('w-style-source');
        const resultEl = document.getElementById('w-style-extracted');
        if (sourceEl) sourceEl.value = '';
        if (resultEl) resultEl.value = '';
        UI.toast('已清空文风提取');
    },

    // ===== 打开文风提取提示词配置弹窗 =====
    openStylePromptModal() {
        // 移除已存在的弹窗
        const existing = document.getElementById('w-style-prompt-modal');
        if (existing) existing.remove();

        // 获取保存的自定义提示词
        this._stylePromptCustom = this._stylePromptCustom || '';

        const modal = document.createElement('div');
        modal.id = 'w-style-prompt-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:1000;display:flex;align-items:center;justify-content:center;';
        modal.innerHTML = `
            <div style="width:90%;max-width:700px;max-height:85vh;background:white;border:1px solid rgba(255,255,255,0.1);border-radius:12px;display:flex;flex-direction:column;overflow:hidden;">
                <div style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:space-between;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <i class="fa-solid fa-palette text-emerald-400"></i>
                        <span style="font-size:14px;font-weight:700;color:#fff;">文风提取提示词配置</span>
                    </div>
                    <button onclick="this.closest('#w-style-prompt-modal').remove()" style="width:28px;height:28px;border-radius:6px;background:rgba(255,255,255,0.05);border:none;color:#888;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;">×</button>
                </div>
                <div style="padding:20px;overflow-y:auto;flex:1;">
                    <div style="margin-bottom:12px;">
                        <div style="font-size:11px;color:#888;margin-bottom:6px;">自定义提取提示词（留空使用默认）</div>
                        <textarea id="w-style-prompt-input" style="width:100%;height:280px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:12px;color:#ccc;font-size:12px;font-family:monospace;resize:none;line-height:1.6;" placeholder="输入自定义的文风提取提示词...

可使用变量：
{{source}} - 原文样例

默认提示词会从以下维度分析：
1. 叙事视角
2. 语言风格
3. 句式特点
4. 修辞手法
5. 情感基调
6. 描写偏好
7. 对话风格
8. 节奏控制
9. 特色表达">${this._stylePromptCustom || ''}</textarea>
                    </div>
                    <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:8px;padding:12px;">
                        <div style="font-size:11px;color:#10b981;font-weight:600;margin-bottom:6px;"><i class="fa-solid fa-lightbulb mr-1"></i>提示</div>
                        <div style="font-size:10px;color:#888;line-height:1.6;">
                            提示词用于指导AI如何分析原文并提取文风特征。好的提示词应该明确指出需要分析的维度和输出格式。
                        </div>
                    </div>
                </div>
                <div style="padding:16px 20px;border-top:1px solid rgba(255,255,255,0.1);display:flex;gap:10px;justify-content:flex-end;">
                    <button onclick="Modules.writer._resetStylePrompt()" style="padding:8px 16px;border-radius:6px;background:rgba(255,255,255,0.05);border:none;color:#888;font-size:12px;cursor:pointer;">恢复默认</button>
                    <button onclick="Modules.writer._saveStylePrompt()" style="padding:8px 20px;border-radius:6px;background:rgba(16,185,129,0.2);border:1px solid rgba(16,185,129,0.3);color:#10b981;font-size:12px;font-weight:600;cursor:pointer;"><i class="fa-solid fa-check mr-1"></i>保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 加载保存的提示词
        this._loadStylePrompt();
    },

    // ===== 加载文风提取提示词 =====
    async _loadStylePrompt() {
        try {
            const data = await DB.get('settings', 'writer_style_prompt');
            if (data && data.prompt) {
                this._stylePromptCustom = data.prompt;
                const input = document.getElementById('w-style-prompt-input');
                if (input) input.value = data.prompt;
            }
        } catch(e) {}
    },

    // ===== 保存文风提取提示词 =====
    async _saveStylePrompt() {
        const input = document.getElementById('w-style-prompt-input');
        if (!input) return;
        this._stylePromptCustom = input.value;
        await DB.put('settings', { id: 'writer_style_prompt', prompt: input.value });
        UI.toast('提示词已保存');
        const modal = document.getElementById('w-style-prompt-modal');
        if (modal) modal.remove();
    },

    // ===== 重置文风提取提示词 =====
    _resetStylePrompt() {
        const input = document.getElementById('w-style-prompt-input');
        if (input) input.value = '';
        this._stylePromptCustom = '';
        UI.toast('已恢复默认提示词');
    },

    // ===== 文风库功能 =====
    
    // 打开文风提取弹窗
    openStyleExtractModal() {
        // 移除已存在的弹窗
        const existingModal = document.getElementById('w-style-extract-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'w-style-extract-modal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);';
        modal.innerHTML = `
            <div style="width:600px;max-height:85vh;background:#1a1a1a;border:1px solid rgba(255,255,255,0.1);border-radius:12px;box-shadow:0 25px 50px rgba(0,0,0,0.5);display:flex;flex-direction:column;overflow:hidden;" onclick="event.stopPropagation()">
                <div style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-size:14px;font-weight:600;color:#fff;"><i class="fa-solid fa-wand-magic-sparkles mr-2" style="color:#10b981;"></i>新增文风</span>
                    <button onclick="document.getElementById('w-style-extract-modal').remove()" style="background:none;border:none;color:#666;font-size:18px;cursor:pointer;padding:4px;"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div style="flex:1;overflow-y:auto;padding:20px;space-y-4;">
                    <div style="margin-bottom:16px;">
                        <div style="font-size:11px;color:#888;margin-bottom:6px;font-weight:600;">文风名称</div>
                        <input id="w-new-style-name" style="width:100%;padding:10px 12px;border-radius:6px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#fff;font-size:13px;" placeholder="例如：金庸武侠风、东野圭吾悬疑风...">
                    </div>
                    <div style="margin-bottom:16px;">
                        <div style="font-size:11px;color:#888;margin-bottom:6px;font-weight:600;">原文样例</div>
                        <textarea id="w-new-style-source" style="width:100%;height:150px;padding:10px 12px;border-radius:6px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#fff;font-size:12px;resize:none;font-family:monospace;line-height:1.6;" placeholder="粘贴一段目标风格的文本（建议1000-3000字），AI将分析并提取其文风特征..."></textarea>
                    </div>
                    <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:8px;padding:12px;">
                        <div style="font-size:11px;color:#10b981;font-weight:600;margin-bottom:6px;"><i class="fa-solid fa-lightbulb mr-1"></i>提示</div>
                        <div style="font-size:10px;color:#888;line-height:1.6;">
                            原文样例越丰富，提取的文风越准确。建议包含对话、描写、叙述等多种文本类型。
                        </div>
                    </div>
                </div>
                <div style="padding:16px 20px;border-top:1px solid rgba(255,255,255,0.1);display:flex;gap:10px;justify-content:flex-end;">
                    <button onclick="document.getElementById('w-style-extract-modal').remove()" style="padding:8px 16px;border-radius:6px;background:rgba(255,255,255,0.05);border:none;color:#888;font-size:12px;cursor:pointer;">取消</button>
                    <button onclick="Modules.writer.extractAndSaveStyle()" style="padding:8px 20px;border-radius:6px;background:rgba(16,185,129,0.2);border:1px solid rgba(16,185,129,0.3);color:#10b981;font-size:12px;font-weight:600;cursor:pointer;"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>提取并保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    // 提取并保存文风
    async extractAndSaveStyle() {
        const nameInput = document.getElementById('w-new-style-name');
        const sourceInput = document.getElementById('w-new-style-source');
        
        const name = nameInput?.value?.trim();
        const sourceText = sourceInput?.value?.trim();
        
        if (!name) return UI.toast('请输入文风名称');
        if (!sourceText || sourceText.length < 100) return UI.toast('原文样例至少需要100字');
        
        // 显示加载状态
        const btn = document.querySelector('#w-style-extract-modal button[onclick="Modules.writer.extractAndSaveStyle()"]');
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-1"></i>提取中...';
            btn.disabled = true;
        }
        
        try {
            const prompt = this._getStyleExtractPrompt(sourceText);
            const result = await AI.generate(prompt, { type: 'text' });
            
            if (result && result.trim()) {
                // 保存到文风库
                const styleData = {
                    id: 'style_' + Date.now(),
                    name: name,
                    style: result.trim(),
                    sourcePreview: sourceText.slice(0, 200) + '...',
                    createdAt: new Date().toISOString()
                };
                
                // 获取现有文风库
                let library = await DB.get('settings', 'writer_style_library');
                if (!library || !library.styles) {
                    library = { id: 'writer_style_library', styles: [] };
                }
                library.styles.push(styleData);
                await DB.put('settings', library);
                
                // 关闭弹窗并刷新列表
                document.getElementById('w-style-extract-modal').remove();
                await this._loadStyleLibrary();
                UI.toast(`文风「${name}」已保存到文风库`);
            } else {
                UI.toast('提取失败，请重试');
            }
        } catch (error) {
            console.error('提取文风失败:', error);
            UI.toast('提取失败：' + error.message);
        } finally {
            if (btn) {
                btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles mr-1"></i>提取并保存';
                btn.disabled = false;
            }
        }
    },

    // 加载文风库列表
    async _loadStyleLibrary() {
        const container = document.getElementById('w-style-library');
        if (!container) return;
        
        try {
            const library = await DB.get('settings', 'writer_style_library');
            const styles = library?.styles || [];
            
            if (styles.length === 0) {
                container.innerHTML = '<div class="text-[9px] text-dim text-center py-2">暂无保存的文风，点击"新增文风"提取</div>';
                return;
            }
            
            // 获取当前激活的文风ID
            const activeStyle = await DB.get('settings', 'writer_active_style');
            const activeId = activeStyle?.id;
            
            container.innerHTML = styles.map((style, index) => `
                <div class="flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${activeId === style.id ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-gray-100 border-gray-200 hover:border-emerald-500/30'}" onclick="Modules.writer._selectStyle('${style.id}')">
                    <input type="radio" name="w-style-radio" ${activeId === style.id ? 'checked' : ''} class="accent-emerald-500" onclick="event.stopPropagation();Modules.writer._selectStyle('${style.id}')">
                    <div class="flex-1 min-w-0">
                        <div class="text-xs font-bold text-gray-800 truncate">${style.name}</div>
                        <div class="text-[8px] text-dim truncate">${style.sourcePreview || '无预览'}</div>
                    </div>
                    <button class="text-red-400 hover:text-red-300 text-xs px-1" onclick="event.stopPropagation();Modules.writer._deleteStyle('${style.id}')" title="删除">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `).join('');
            
            // 更新预览
            this._updateActiveStylePreview();
            
        } catch(e) {
            console.error('加载文风库失败:', e);
        }
    },

    // 选择文风
    async _selectStyle(styleId) {
        try {
            const library = await DB.get('settings', 'writer_style_library');
            const style = library?.styles?.find(s => s.id === styleId);
            
            if (style) {
                await DB.put('settings', { id: 'writer_active_style', id: styleId, style: style.style });
                await this._loadStyleLibrary();
                UI.toast(`已选择文风：${style.name}`);
            }
        } catch(e) {
            console.error('选择文风失败:', e);
        }
    },

    // 删除文风
    async _deleteStyle(styleId) {
        if (!confirm('确定要删除这个文风吗？')) return;
        
        try {
            const library = await DB.get('settings', 'writer_style_library');
            if (library && library.styles) {
                library.styles = library.styles.filter(s => s.id !== styleId);
                await DB.put('settings', library);
                
                // 如果删除的是当前激活的文风，清除激活状态
                const activeStyle = await DB.get('settings', 'writer_active_style');
                if (activeStyle?.id === styleId) {
                    await DB.del('settings', 'writer_active_style');
                }
                
                await this._loadStyleLibrary();
                UI.toast('文风已删除');
            }
        } catch(e) {
            console.error('删除文风失败:', e);
        }
    },

    // 更新当前激活文风的预览
    async _updateActiveStylePreview() {
        const previewContainer = document.getElementById('w-active-style-preview');
        const contentEl = document.getElementById('w-active-style-content');
        
        if (!previewContainer || !contentEl) return;
        
        try {
            const activeStyle = await DB.get('settings', 'writer_active_style');
            
            if (activeStyle && activeStyle.style) {
                previewContainer.classList.remove('hidden');
                contentEl.textContent = activeStyle.style.slice(0, 500) + (activeStyle.style.length > 500 ? '...' : '');
            } else {
                previewContainer.classList.add('hidden');
            }
        } catch(e) {
            previewContainer.classList.add('hidden');
        }
    },

    // 清空文风选择
    async clearStyleExtract() {
        if (!confirm('确定要取消当前选择的文风吗？')) return;
        
        try {
            await DB.del('settings', 'writer_active_style');
            await this._loadStyleLibrary();
            UI.toast('已取消文风选择');
        } catch(e) {
            console.error('清空文风失败:', e);
        }
    },

    // ===== 保存写作设置（人称/基调/字数） =====
    async _saveWritingSettings() {
        const pov = document.getElementById('w-narrative-pov')?.value || '';
        const povCustom = document.getElementById('w-narrative-pov-custom')?.value || '';
        const tone = document.getElementById('w-tone')?.value || '';
        const toneCustom = document.getElementById('w-tone-custom')?.value || '';
        const words = document.getElementById('w-chapter-words')?.value || '3000';
        
        // 显示/隐藏自定义输入框
        const povCustomEl = document.getElementById('w-narrative-pov-custom');
        if (povCustomEl) {
            povCustomEl.classList.toggle('hidden', pov !== 'custom');
        }
        const toneCustomEl = document.getElementById('w-tone-custom');
        if (toneCustomEl) {
            toneCustomEl.classList.toggle('hidden', tone !== 'custom');
        }
        
        // 保存到数据库
        await DB.put('settings', {
            id: 'writer_writing_settings',
            pov,
            povCustom,
            tone,
            toneCustom,
            words: parseInt(words)
        });
    },

    // ===== 加载写作设置 =====
    async _loadWritingSettings() {
        try {
            const data = await DB.get('settings', 'writer_writing_settings');
            if (data) {
                const povEl = document.getElementById('w-narrative-pov');
                const povCustomEl = document.getElementById('w-narrative-pov-custom');
                const toneEl = document.getElementById('w-tone');
                const toneCustomEl = document.getElementById('w-tone-custom');
                const wordsEl = document.getElementById('w-chapter-words');
                const wordsSliderEl = document.getElementById('w-chapter-words-slider');
                
                if (povEl && data.pov) povEl.value = data.pov;
                if (povCustomEl) {
                    povCustomEl.value = data.povCustom || '';
                    povCustomEl.classList.toggle('hidden', data.pov !== 'custom');
                }
                if (toneEl && data.tone) toneEl.value = data.tone;
                if (toneCustomEl) {
                    toneCustomEl.value = data.toneCustom || '';
                    toneCustomEl.classList.toggle('hidden', data.tone !== 'custom');
                }
                if (wordsEl && data.words) {
                    wordsEl.value = data.words;
                    if (wordsSliderEl) wordsSliderEl.value = data.words;
                }
            }
        } catch(e) {}
    },

    // ===== 获取写作设置提示词 =====
    _getWritingSettingsPrompt() {
        const pov = document.getElementById('w-narrative-pov')?.value || '';
        const povCustom = document.getElementById('w-narrative-pov-custom')?.value || '';
        const tone = document.getElementById('w-tone')?.value || '';
        const toneCustom = document.getElementById('w-tone-custom')?.value || '';
        const words = document.getElementById('w-chapter-words')?.value || '3000';
        
        let settings = [];
        
        // 人称
        if (pov) {
            const povMap = {
                'first': '第一人称（我/我们）',
                'third-limited': '第三人称有限视角（限主角视角）',
                'third-omniscient': '第三人称全知视角（上帝视角）',
                'second': '第二人称（你）',
                'custom': povCustom
            };
            if (povMap[pov]) settings.push(`叙事人称：${povMap[pov]}`);
        }
        
        // 基调
        if (tone) {
            const toneMap = {
                'dark-gritty': '黑暗压抑',
                'light-hopeful': '轻松明快',
                'epic-heroic': '史诗热血',
                'melancholic': '忧郁抒情',
                'humorous': '幽默诙谐',
                'mysterious': '神秘悬疑',
                'romantic': '浪漫唯美',
                'grim-realistic': '冷峻写实',
                'custom': toneCustom
            };
            if (toneMap[tone]) settings.push(`情感基调：${toneMap[tone]}`);
        }
        
        // 字数
        if (words) settings.push(`每章字数：约${words}字`);
        
        return settings.length > 0 ? '\n【写作设置】\n' + settings.join('\n') : '';
    },

    // ===== 获取文风提取提示词 =====
    _getStyleExtractPrompt(sourceText) {
        const customPrompt = this._stylePromptCustom || '';
        if (customPrompt.trim()) {
            return customPrompt.replace(/\{\{source\}\}/gi, sourceText.slice(0, 3000));
        }
        // 默认提示词 - 内置的详细文风分析器
        return `# 文章风格分析器 v1.0
请输入您想要分析的文本段落。我将对其进行深度风格解析，并以结构化格式输出分析结果。

## 分析维度
我将从以下维度分析文本风格特征：
1. 语言特征（句式、用词、修辞）
2. 结构特征（段落、过渡、层次）
3. 叙事特征（视角、距离、时序）
4. 情感特征（浓淡、方式、基调）
5. 思维特征（逻辑、深度、节奏）
6. 个性标记（独特表达、意象系统）
7. 文化底蕴（典故、知识领域）
8. 韵律节奏（音节、停顿、节奏）

## 输出格式
我将以下列结构化格式以代码块输出分析结果：
\`\`\`json
{
    "style_summary": "风格一句话概括",
    "language": {
        "sentence_pattern": ["主要句式特征", "次要句式特征"],
        "word_choice": {
            "formality_level": "正式度 1-5",
            "preferred_words": ["高频特征词 1", "特征词 2"],
            "avoided_words": ["规避词类 1", "规避词类 2"]
        },
        "rhetoric": ["主要修辞手法 1", "修辞手法 2"]
    },
    "structure": {
        "paragraph_length": "段落平均字数",
        "transition_style": "过渡特征",
        "hierarchy_pattern": "层次展开方式"
    },
    "narrative": {
        "perspective": "叙事视角",
        "time_sequence": "时间处理方式",
        "narrator_attitude": "叙事态度"
    },
    "emotion": {
        "intensity": "情感强度 1-5",
        "expression_style": "表达方式",
        "tone": "情感基调"
    },
    "thinking": {
        "logic_pattern": "思维推进方式",
        "depth": "思维深度 1-5",
        "rhythm": "思维节奏特征"
    },
    "uniqueness": {
        "signature_phrases": ["标志性表达 1", "表达 2"],
        "imagery_system": ["核心意象 1", "意象 2"]
    },
    "cultural": {
        "allusions": ["典故类型", "使用频率"],
        "knowledge_domains": ["涉及领域 1", "领域 2"]
    },
    "rhythm": {
        "syllable_pattern": "音节特征",
        "pause_pattern": "停顿规律",
        "tempo": "节奏特征"
    }
}
\`\`\`

## 注意：
1. 文中提及的特殊要素不要提取，例如书名、作者姓名、特定地理位置等。
2. 风格提取的目的在于基于该风格生成其他指定主题的文章，提取要素应当基于这一任务。

[待分析原文]
${sourceText.slice(0, 3000)}`;
    },

    // ===== AI Write (深度绑定融合拆书 + 文风提取) =====
    async aiWrite() {
        if(this._generating) return;
        if (!this.currentChapterId) return UI.toast('请先选择章节');
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        const outline = (document.getElementById('w-outline') || {}).value || '';
        const rules = (document.getElementById('w-rules') || {}).value || '';
        const contRules = (document.getElementById('w-continue-rules') || {}).value || '';
        const direction = (document.getElementById('w-ai-direction') || {}).value || '';
        const opts = this.aiOpts;
        const lenHint = this._getLenHint();

        // 获取提取的文风（优先级最高）
        const extractedStyle = await this._getExtractedStyle();
        // 确定最终使用的文风规则
        let finalRules = rules;
        let styleSource = '默认写法';
        
        if (extractedStyle) {
            // 文风提取优先级最高
            finalRules = extractedStyle;
            styleSource = '文风提取';
        } else if (rules) {
            // 其次使用全局规则
            finalRules = rules;
            styleSource = '全局规则';
        }

        let promptTpl = await Modules.short.getPrompt('writer_ai');
        let prompt = promptTpl
            .replace('{{rules}}', finalRules)
            .replace('{{continue_rules}}', contRules + (opts.styleKeep ? '\n[风格锁定] 严格保持与前文一致的文风、人称、时态' : ''))
            .replace('{{outline}}', outline)
            .replace('{{input}}', content.slice(-3000));

        prompt += '\n\n[长度要求] ' + lenHint;
        if(direction) prompt += '\n[续写方向] ' + direction;
        prompt += '\n[当前风格来源: ' + styleSource + ']';

        // 融合技法注入
        if (opts.fusionInject) {
            const fusionCtx = this._getFusionContext();
            if(fusionCtx) prompt = '[融合拆书技法 — 请运用这些技法写作]\n' + fusionCtx.slice(0, 3000) + '\n\n' + prompt;
        }

        // 前章摘要注入
        const prevSummary = await this._getPrevChapterSummary();
        if(prevSummary) prompt = prevSummary + '\n\n' + prompt;

        // RAG context injection
        let ragCtx = '';
        if (opts.ragInject && typeof ContextHelper !== 'undefined') {
            ragCtx = await ContextHelper.getEnhancedContext(content.slice(-500), 1500);
        }
        prompt = prompt.replace('{{context}}', ragCtx);

        this.updateIO(prompt, '生成中...');
        const st = document.getElementById('w-save-status');
        if (st) st.textContent = 'AI 生成中... (' + lenHint + ', ' + styleSource + ')';
        this._setGenerating(true);

        const startLen = content.length;
        await AI.generate(prompt, {}, c => {
            if (editor) { editor.value += c; this.onInput(); }
            this.updateIO(prompt, editor ? editor.value.slice(-2000) : c);
        });
        this._setGenerating(false);
        const added = (editor ? editor.value.length : 0) - startLen;
        if (st) st.textContent = '生成完成 (+' + added + '字)';
        if (typeof MemorySystem !== 'undefined') MemorySystem.addWorking('[执笔/AI续写] ' + (editor ? editor.value.slice(-200) : ''), 'generation', 3);
    },

    // ===== 融合技法写作 (新增: 专门用融合精华驱动写作) =====
    async fusionWrite() {
        if(this._generating) return;
        if (!this.currentChapterId) return UI.toast('请先选择章节');
        const fusionCtx = this._getFusionContext();
        if(!fusionCtx) return UI.toast('请先在融合拆书中运行流水线获取融合精华');

        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        const outline = (document.getElementById('w-outline') || {}).value || '';
        const rules = (document.getElementById('w-rules') || {}).value || '';
        const direction = (document.getElementById('w-ai-direction') || {}).value || '';
        const prevSummary = await this._getPrevChapterSummary();
        
        // 获取写作设置（人称/基调/字数）
        const writingSettings = this._getWritingSettingsPrompt();
        
        // 获取提取的文风（优先级最高）
        const extractedStyle = await this._getExtractedStyle();
        let styleSource = '融合技法';
        let styleRules = '';
        
        if (extractedStyle) {
            styleRules = extractedStyle + writingSettings;
            styleSource = '文风提取+融合技法';
        } else if (writingSettings) {
            styleRules = writingSettings;
            styleSource = '写作设置+融合技法';
        }

        const prompt = `你是一位顶级网文写手，精通融合技法。请严格运用以下融合技法精华来创作/续写正文。

${fusionCtx}
${styleRules ? '[文风要求]\n' + styleRules + '\n\n' : ''}${rules ? '[写作规则]\n' + rules.slice(0, 1000) + '\n\n' : ''}${outline ? '[本章大纲]\n' + outline.slice(0, 2000) + '\n\n' : ''}${prevSummary ? prevSummary + '\n\n' : ''}${content ? '[当前正文(末尾)]\n' + content.slice(-2000) + '\n\n' : ''}${direction ? '[续写方向] ' + direction + '\n\n' : ''}[核心要求]
1. ${extractedStyle ? '【最高优先级】必须严格遵循上方[文风要求]中的文风特征进行写作' : '遵循融合技法中的写作风格'}
2. 必须运用融合技法中的「开篇钩子模板」（如果是章节开头）
3. 严格按照「节奏公式」控制行文节奏
4. 在关键节点运用「爽点矩阵」制造情绪高潮
5. 运用「悬念体系」在段落末尾设置钩子
6. 对话要有潜台词，场景要有画面感
7. ${this._getLenHint()}
8. 直接输出正文，不要解释

[当前风格来源: ${styleSource}]`;

        this.updateIO(prompt, '融合技法写作中...');
        const st = document.getElementById('w-save-status');
        if (st) st.textContent = '融合技法写作中...';
        this._setGenerating(true);

        const startLen = content.length;
        await AI.generate(prompt, {}, c => {
            if (editor) { editor.value += c; this.onInput(); }
            this.updateIO(prompt, editor ? editor.value.slice(-2000) : c);
        });
        this._setGenerating(false);
        const added = (editor ? editor.value.length : 0) - startLen;
        if (st) st.textContent = '融合写作完成 (+' + added + '字)';
        UI.toast('融合技法写作完成 (+' + added + '字)');
    },

    // ===== Polish (润色 — 红色预览 + 替换确认 + 文风提取优先) =====
    async polish() {
        if(this._generating) return;
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        if (!content.trim()) return UI.toast('编辑器为空');
        let promptTpl = await Modules.short.getPrompt('writer_polish');
        const rules = (document.getElementById('w-rules') || {}).value || '';
        const polishRules = (document.getElementById('w-polish-rules') || {}).value || '';
        
        // 获取提取的文风（优先级最高）
        const extractedStyle = await this._getExtractedStyle();
        // 确定最终使用的文风规则
        let finalRules = '';
        let styleSource = '默认写法';
        
        // 获取写作设置（人称/基调/字数）
        const writingSettings = this._getWritingSettingsPrompt();
        
        if (extractedStyle) {
            // 文风提取优先级最高
            finalRules = extractedStyle + writingSettings;
            styleSource = '文风提取';
        } else if (polishRules) {
            // 其次使用润色规则
            finalRules = polishRules + writingSettings;
            styleSource = '润色规则';
        } else if (rules) {
            // 再次使用全局规则
            finalRules = rules + writingSettings;
            styleSource = '全局规则';
        } else if (writingSettings) {
            // 只有写作设置
            finalRules = writingSettings;
            styleSource = '写作设置';
        }
        
        let prompt = promptTpl.replace('{{rules}}', finalRules).replace('{{input}}', content.slice(-4000));

        // 注入风格来源标识
        prompt = '[当前风格来源: ' + styleSource + ']\n\n' + prompt;

        // 融合技法注入润色
        if(this.aiOpts.fusionInject) {
            const fusionCtx = this._getFusionContext();
            if(fusionCtx) prompt = '[融合技法参考 — 请用这些技法润色]\n' + fusionCtx.slice(0, 2000) + '\n\n' + prompt;
        }

        this.updateIO(prompt, '润色中...');
        this._setGenerating(true);
        UI.toast('正在润色... (风格: ' + styleSource + ')');

        // 保存原文
        this._polishOriginal = content;

        let result = '';
        await AI.generate(prompt, {}, c => { result += c; this.updateIO(prompt, result); });
        this._setGenerating(false);

        if (!result || !result.trim()) return UI.toast('润色结果为空');

        // 红色预览模式 — 编辑器显示润色结果，加替换确认浮层
        if (editor) {
            editor.value = result;
            editor.style.color = '#f87171';
            this.onInput();
        }
        // 显示替换确认浮层
        let bar = document.getElementById('w-polish-confirm');
        if (bar) bar.remove();
        const editorWrap = editor?.parentElement;
        if (editorWrap) {
            const div = document.createElement('div');
            div.id = 'w-polish-confirm';
            div.style.cssText = 'position:absolute;bottom:16px;left:50%;transform:translateX(-50%);z-index:30;display:flex;align-items:center;gap:10px;padding:10px 24px;border-radius:14px;background:rgba(20,20,25,0.95);border:1px solid rgba(248,113,113,0.4);backdrop-filter:blur(12px);box-shadow:0 8px 32px rgba(0,0,0,0.5);';
            div.innerHTML = `
                <i class="fa-solid fa-gem text-purple-400"></i>
                <span style="font-size:12px;font-weight:700;color:#f87171;">润色预览</span>
                <span style="font-size:10px;color:#6b7280;">${result.length}字</span>
                <button onclick="Modules.writer._acceptPolish()" style="padding:4px 16px;border-radius:8px;font-size:11px;font-weight:700;background:rgba(34,197,94,0.2);color:#4ade80;border:1px solid rgba(34,197,94,0.3);cursor:pointer;">✓ 替换</button>
                <button onclick="Modules.writer._rejectPolish()" style="padding:4px 16px;border-radius:8px;font-size:11px;font-weight:700;background:rgba(239,68,68,0.2);color:#f87171;border:1px solid rgba(239,68,68,0.3);cursor:pointer;">✗ 还原</button>
            `;
            editorWrap.style.position = 'relative';
            editorWrap.appendChild(div);
        }
    },
    _acceptPolish() {
        const editor = document.getElementById('w-editor');
        if (editor) editor.style.color = '';
        const bar = document.getElementById('w-polish-confirm');
        if (bar) bar.remove();
        this._polishOriginal = null;
        this.onInput();
        UI.toast('已替换为润色版本');
    },
    _rejectPolish() {
        const editor = document.getElementById('w-editor');
        if (editor && this._polishOriginal != null) {
            editor.value = this._polishOriginal;
            editor.style.color = '';
        }
        const bar = document.getElementById('w-polish-confirm');
        if (bar) bar.remove();
        this._polishOriginal = null;
        this.onInput();
        UI.toast('已还原原文');
    },

    // ===== Chat (强化版：深度上下文注入 + 正文引用 + 实体关联 + 直接修改) =====
    _chatContextState: { content: true, outline: true, world: true, fusion: true, rag: true },
    _chatSelection: null,
    _chatHistory: [],

    _toggleChatContext(type) {
        this._chatContextState[type] = !this._chatContextState[type];
        const el = document.getElementById('w-chat-ctx-' + type);
        if (el) {
            el.textContent = type === 'content' ? '正文' : type === 'outline' ? '大纲' : type === 'world' ? '世界' : type === 'fusion' ? '融合' : 'RAG';
            el.textContent += this._chatContextState[type] ? ' ✓' : ' ✗';
            el.className = this._chatContextState[type] ? 
                (type === 'content' ? 'text-green-400' : type === 'outline' ? 'text-blue-400' : type === 'world' ? 'text-amber-400' : type === 'fusion' ? 'text-purple-400' : 'text-cyan-400') + ' cursor-pointer hover:underline' :
                'text-dim cursor-pointer hover:underline';
        }
    },

    _chatClear() {
        if (!confirm('清空所有对话记录？')) return;
        const log = document.getElementById('w-chat-log');
        if (log) log.innerHTML = '';
        this._chatHistory = [];
        UI.toast('对话已清空');
    },

    async _chatRefreshContext() {
        UI.toast('正在刷新上下文...');
        await this.refreshRAG();
        UI.toast('上下文已刷新');
    },

    _clearChatSelection() {
        this._chatSelection = null;
        const selDiv = document.getElementById('w-chat-selection');
        if (selDiv) selDiv.classList.add('hidden');
    },

    _selectTextRange() {
        const editor = document.getElementById('w-editor');
        if (!editor) return;
        
        const start = prompt('起始位置 (字符索引，从0开始):', '0');
        if (start === null) return;
        const end = prompt('结束位置:', String(editor.value.length));
        if (end === null) return;
        
        const startIdx = parseInt(start) || 0;
        const endIdx = parseInt(end) || editor.value.length;
        
        if (startIdx >= endIdx || startIdx < 0) {
            UI.toast('无效的范围', 'error');
            return;
        }
        
        this._chatSelection = {
            text: editor.value.slice(startIdx, endIdx),
            start: startIdx,
            end: endIdx
        };
        
        const selDiv = document.getElementById('w-chat-selection');
        const selText = document.getElementById('w-chat-selection-text');
        if (selDiv && selText) {
            selDiv.classList.remove('hidden');
            selText.textContent = `[${startIdx}-${endIdx}] ${this._chatSelection.text.slice(0, 200)}${this._chatSelection.text.length > 200 ? '...' : ''}`;
        }
        UI.toast(`已选中 ${this._chatSelection.text.length} 字`);
    },

    async _insertEntityRef() {
        try {
            const entities = await DB.getAll('entities') || [];
            if (entities.length === 0) {
                UI.toast('世界引擎暂无实体', 'error');
                return;
            }
            
            const modal = document.createElement('div');
            modal.id = 'w-entity-ref-modal';
            modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-gray-300 backdrop-blur-sm';
            modal.innerHTML = `
                <div class="bg-white rounded-2xl border border-gray-300 w-[500px] max-h-[70vh] flex flex-col shadow-2xl">
                    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                        <span class="font-bold text-gray-800 text-sm"><i class="fa-solid fa-at mr-2 text-amber-400"></i>选择要引用的实体</span>
                        <button class="text-dim hover:text-gray-800" onclick="this.closest('#w-entity-ref-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="p-3 border-b border-gray-200">
                        <input type="text" id="w-entity-search" class="w-full bg-gray-100 border border-gray-300 rounded-lg p-2 text-sm text-gray-800" placeholder="搜索实体..." oninput="Modules.writer._filterEntityList(this.value)">
                    </div>
                    <div id="w-entity-list" class="flex-1 overflow-y-auto p-2 space-y-1">
                        ${entities.slice(0, 50).map(e => `
                            <div class="p-2 bg-gray-100 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-all" onclick="Modules.writer._selectEntity('${e.id}', '${this._esc(e.name)}')">
                                <div class="flex items-center gap-2">
                                    <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-dim">${e.type || '其他'}</span>
                                    <span class="text-xs text-gray-800 font-bold">${this._esc(e.name)}</span>
                                </div>
                                <div class="text-[10px] text-dim mt-1 line-clamp-2">${this._esc((e.desc || '').slice(0, 100))}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            this._entityList = entities;
        } catch (e) {
            UI.toast('加载实体失败', 'error');
        }
    },

    _filterEntityList(keyword) {
        const list = document.getElementById('w-entity-list');
        if (!list || !this._entityList) return;
        
        const filtered = keyword ? 
            this._entityList.filter(e => e.name.includes(keyword) || (e.desc || '').includes(keyword)) :
            this._entityList;
        
        list.innerHTML = filtered.slice(0, 50).map(e => `
            <div class="p-2 bg-gray-100 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-all" onclick="Modules.writer._selectEntity('${e.id}', '${this._esc(e.name)}')">
                <div class="flex items-center gap-2">
                    <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-dim">${e.type || '其他'}</span>
                    <span class="text-xs text-gray-800 font-bold">${this._esc(e.name)}</span>
                </div>
                <div class="text-[10px] text-dim mt-1 line-clamp-2">${this._esc((e.desc || '').slice(0, 100))}</div>
            </div>
        `).join('');
    },

    _selectEntity(id, name) {
        const modal = document.getElementById('w-entity-ref-modal');
        if (modal) modal.remove();
        
        const input = document.getElementById('w-chat-in');
        if (input) {
            input.value += `【引用实体: ${name}】`;
            input.focus();
        }
        UI.toast('已引用实体: ' + name);
    },

    async _chatQuickAction(action) {
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        const selection = this._chatSelection;
        
        const actions = {
            diagnose: {
                prompt: '请对以下内容进行诊断分析，指出问题并给出修改建议：',
                target: selection ? selection.text : content.slice(-2000)
            },
            polish: {
                prompt: '请润色以下内容，提升文笔和表现力：',
                target: selection ? selection.text : content.slice(-1500)
            },
            expand: {
                prompt: '请扩写以下内容，增加细节描写和情感深度：',
                target: selection ? selection.text : content.slice(-1000)
            },
            rewrite: {
                prompt: '请改写以下内容，保持核心意思但换一种表达方式：',
                target: selection ? selection.text : content.slice(-1000)
            },
            continue: {
                prompt: '请续写以下内容，保持风格和情节连贯：',
                target: content.slice(-1500)
            }
        };
        
        const act = actions[action];
        if (!act) return;
        
        const input = document.getElementById('w-chat-in');
        if (input) {
            input.value = act.prompt + '\n\n【目标内容】\n' + act.target;
        }
        
        if (action !== 'continue') {
            this.sendChat();
        }
    },

    async _getWorldEngineContext() {
        let ctx = '';
        try {
            const entities = await DB.getAll('entities') || [];
            const worldEntities = entities.filter(e => e.id && e.id.startsWith('world_'));
            if (worldEntities.length) {
                ctx += '[世界观设定]\n';
                worldEntities.forEach(e => { ctx += `【${e.name}】${(e.desc||'').slice(0,200)}\n`; });
            }
            const charEntities = entities.filter(e => !e.id.startsWith('world_')).slice(0, 20);
            if (charEntities.length) {
                ctx += '\n[相关实体]\n';
                charEntities.forEach(e => { ctx += `• ${e.name}(${e.type||'其他'}): ${(e.desc||'').slice(0,80)}\n`; });
            }
        } catch (e) {}
        return ctx;
    },

    async sendChat() {
        const input = document.getElementById('w-chat-in');
        const log = document.getElementById('w-chat-log');
        if (!input || !log) return;
        
        const txt = input.value.trim();
        if (!txt) return;
        input.value = '';
        
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        const outline = (document.getElementById('w-outline') || {}).value || '';
        const title = (document.getElementById('w-title') || {}).value || '';
        const selection = this._chatSelection;
        
        let userMsgHtml = `<div class="p-2 bg-accent/10 rounded-lg border border-accent/20">
            <div class="flex items-center gap-2 mb-1">
                <span class="text-accent font-bold text-[10px]">你</span>
                <span class="text-[9px] text-dim">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="text-gray-700 text-xs leading-relaxed">${this._esc(txt)}</div>`;
        
        if (selection) {
            userMsgHtml += `<div class="mt-2 p-2 bg-amber-500/10 rounded border border-amber-500/20">
                <div class="text-[9px] text-amber-400 font-bold mb-1"><i class="fa-solid fa-highlighter mr-1"></i>选中段落 [${selection.start}-${selection.end}]</div>
                <div class="text-[10px] text-dim font-mono">${this._esc(selection.text.slice(0, 150))}${selection.text.length > 150 ? '...' : ''}</div>
            </div>`;
        }
        userMsgHtml += '</div>';
        log.innerHTML += userMsgHtml;
        
        let contextPrompt = `[你是专业的小说写作助手，精通各种写作技法。你可以直接建议修改正文，格式为：
【修改建议】
原文：xxx
改为：xxx
理由：xxx

也可以直接输出修改后的完整段落，用【修改后】标记。

重要规则：
1. 修改必须保持与上下文的连贯性
2. 人物性格、世界观设定必须一致
3. 注意伏笔和细节的呼应
4. 如果涉及实体(人物/地点/物品等)，请标注【关联实体: xxx】
5. 如果需要新增实体，请标注【新增实体: 名称|类型|描述】
6. 如果发现逻辑问题，请标注【逻辑问题: xxx】
]
`;
        
        if (this._chatContextState.content && content) {
            contextPrompt += `[当前章节: ${title}]\n[完整正文]\n${content}\n\n`;
        }
        
        if (this._chatContextState.outline && outline) {
            contextPrompt += `[本章大纲]\n${outline}\n\n`;
        }
        
        if (this._chatContextState.world) {
            const worldCtx = await this._getWorldEngineContext();
            if (worldCtx) contextPrompt += worldCtx + '\n';
        }
        
        if (this._chatContextState.fusion) {
            const fusionCtx = this._getFusionContext();
            if (fusionCtx) contextPrompt += fusionCtx.slice(0, 2000) + '\n';
        }
        
        if (this._chatContextState.rag) {
            try {
                const ragResults = this._ragData?.entities?.slice(0, 10) || [];
                if (ragResults.length > 0) {
                    contextPrompt += `[RAG相关实体]\n`;
                    ragResults.forEach(e => {
                        contextPrompt += `${e.type}·${e.name}: ${(e.desc || '').slice(0, 100)}`;
                        if (e.relations && e.relations.length > 0) {
                            contextPrompt += ` | 关联: ${e.relations.slice(0, 3).join(', ')}`;
                        }
                        contextPrompt += '\n';
                    });
                    contextPrompt += '\n';
                }
                
                const relatedFromGraph = this._findRelatedEntitiesFromGraph(txt, this._ragData?.knowledgeGraph || { nodes: [], edges: [] }, 5);
                if (relatedFromGraph.length > 0) {
                    contextPrompt += `[知识图谱关联]\n`;
                    relatedFromGraph.forEach(e => {
                        contextPrompt += `${e.relationFrom} —[${e.relationType}]— ${e.label}\n`;
                    });
                    contextPrompt += '\n';
                }
            } catch(e) {}
        }
        
        if (selection) {
            contextPrompt += `[用户选中的正文段落 - 请针对此段落进行修改]\n位置: 第${selection.start}到第${selection.end}字符\n内容:\n${selection.text}\n\n`;
        }
        
        const relatedEntities = await this._findRelatedEntities(txt, content);
        if (relatedEntities.length > 0) {
            contextPrompt += `[相关实体参考]\n`;
            relatedEntities.slice(0, 5).forEach(e => {
                contextPrompt += `${e.type}·${e.name}: ${(e.desc || '').slice(0, 100)}`;
                if (e.relations && e.relations.length > 0) {
                    contextPrompt += ` | 关联: ${e.relations.slice(0, 3).join(', ')}`;
                }
                contextPrompt += '\n';
            });
            contextPrompt += '\n';
        }
        
        const prevChapters = await this._getRecentChaptersContext(3);
        if (prevChapters) {
            contextPrompt += `[前几章摘要]\n${prevChapters}\n\n`;
        }
        
        contextPrompt += `[用户需求]\n${txt}\n\n请给出专业的建议或直接修改。如果需要修改正文，请明确标注原文和修改后的内容。如果涉及实体关联，请标注【关联实体: xxx】。如果需要新增实体，请标注【新增实体: 名称|类型|描述】。`;
        
        const aiMsgId = 'w-chat-ai-' + Date.now();
        log.innerHTML += `<div id="${aiMsgId}" class="p-2 bg-gray-100 rounded-lg border border-gray-200">
            <div class="flex items-center gap-2 mb-1">
                <span class="text-green-400 font-bold text-[10px]">AI</span>
                <span class="text-[9px] text-dim">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="text-gray-600 text-xs leading-relaxed"><i class="fa-solid fa-spinner fa-spin mr-1"></i>思考中...</div>
        </div>`;
        log.scrollTop = log.scrollHeight;
        
        let reply = '';
        await AI.generate(contextPrompt, {}, c => {
            reply += c;
            const msgEl = document.getElementById(aiMsgId);
            if (msgEl) {
                const contentDiv = msgEl.querySelector('div:last-child');
                if (contentDiv) {
                    contentDiv.innerHTML = this._formatChatReply(reply);
                }
            }
            log.scrollTop = log.scrollHeight;
        });
        
        const msgEl = document.getElementById(aiMsgId);
        if (msgEl && (reply.includes('【修改后】') || reply.includes('【修改建议】') || reply.includes('改为：') || reply.includes('【关联实体') || reply.includes('【新增实体') || reply.includes('【逻辑问题'))) {
            const actionDiv = document.createElement('div');
            actionDiv.className = 'mt-2 flex gap-1 flex-wrap';
            actionDiv.innerHTML = `
                <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 flex-1" onclick="Modules.writer._applyChatModification('${aiMsgId}', ${selection ? selection.start : 'null'}, ${selection ? selection.end : 'null'})">
                    <i class="fa-solid fa-check mr-1"></i>应用修改
                </button>
                <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.writer._extractEntitiesFromChat('${aiMsgId}')">
                    <i class="fa-solid fa-cube mr-1"></i>提取实体
                </button>
                <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.writer._extractLogicIssues('${aiMsgId}')">
                    <i class="fa-solid fa-bug mr-1"></i>逻辑问题
                </button>
                <button class="btn btn-xs bg-gray-100 text-dim" onclick="Modules.writer._copyChatReply('${aiMsgId}')">
                    <i class="fa-solid fa-copy"></i>
                </button>
                <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.writer._saveChatToRAG('${aiMsgId}')">
                    <i class="fa-solid fa-database mr-1"></i>存RAG
                </button>
            `;
            msgEl.appendChild(actionDiv);
        }
        
        this._chatHistory.push({ role: 'user', content: txt, selection: selection ? selection.text : null });
        this._chatHistory.push({ role: 'assistant', content: reply });
        
        if (typeof MemorySystem !== 'undefined') {
            MemorySystem.addWorking('[执笔/对话] ' + txt.slice(0, 50), 'chat', 2);
        }
    },

    async _getRecentChaptersContext(count) {
        if (!this.currentChapterId) return '';
        
        const chaps = (await DB.getAll('chapters') || []).sort((a, b) => (a.order || 0) - (b.order || 0));
        const currentIdx = chaps.findIndex(c => c.id === this.currentChapterId);
        if (currentIdx <= 0) return '';
        
        const recentChaps = chaps.slice(Math.max(0, currentIdx - count), currentIdx);
        if (recentChaps.length === 0) return '';
        
        return recentChaps.map(c => 
            `【${c.title}】\n${(c.content || '').slice(-500)}`
        ).join('\n---\n');
    },

    async _extractLogicIssues(msgId) {
        const msgEl = document.getElementById(msgId);
        if (!msgEl) return;
        
        const contentDiv = msgEl.querySelector('div:last-child');
        if (!contentDiv) return;
        
        const replyText = contentDiv.innerText || contentDiv.textContent;
        
        const logicMatch = replyText.match(/【逻辑问题[：:]\s*([^\]]+)\]/g);
        if (!logicMatch || logicMatch.length === 0) {
            UI.toast('未发现逻辑问题标注');
            return;
        }
        
        const issues = logicMatch.map(m => m.replace(/【逻辑问题[：:]\s*/, '').replace('】', '').trim());
        
        const resultEl = document.getElementById('w-diagnose-result');
        if (resultEl) {
            resultEl.innerHTML = `<div class="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <div class="text-sm font-bold text-red-400 mb-2"><i class="fa-solid fa-bug mr-1"></i>发现的逻辑问题</div>
                <ul class="text-xs text-gray-600 space-y-2">
                    ${issues.map(i => `<li class="flex items-start gap-2"><span class="text-red-400">•</span>${i}</li>`).join('')}
                </ul>
                <div class="mt-3 flex gap-2">
                    <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30" onclick="Modules.writer._saveLogicIssues()">保存到诊断</button>
                </div>
            </div>`;
        }
        
        this.tab('diagnose');
        UI.toast(`发现 ${issues.length} 个逻辑问题`);
    },

    _saveLogicIssues: async function() {
        const resultEl = document.getElementById('w-diagnose-result');
        if (!resultEl) return;
        
        await DB.put('settings', {
            id: 'writer_logic_issues_' + Date.now(),
            content: resultEl.innerHTML,
            createdAt: Date.now()
        });
        
        UI.toast('逻辑问题已保存');
    },

    async _saveChatToRAG(msgId) {
        const msgEl = document.getElementById(msgId);
        if (!msgEl) return;
        
        const contentDiv = msgEl.querySelector('div:last-child');
        if (!contentDiv) return;
        
        const replyText = contentDiv.innerText || contentDiv.textContent;
        const title = (document.getElementById('w-title') || {}).value || '对话记录';
        
        if (typeof RAGSystem !== 'undefined') {
            try {
                await RAGSystem.addDocument(
                    `对话建议_${title}_${Date.now()}`,
                    replyText,
                    'chat',
                    { chapterId: this.currentChapterId }
                );
                UI.toast('已保存到RAG');
            } catch(e) {
                UI.toast('保存失败: ' + e.message, 'error');
            }
        } else {
            UI.toast('RAG系统不可用', 'error');
        }
    },

    async _findRelatedEntities(query, content) {
        const results = [];
        try {
            const entities = await DB.getAll('entities') || [];
            const queryLower = query.toLowerCase();
            const contentLower = content.toLowerCase();
            
            for (const ent of entities) {
                if (!ent.name) continue;
                const nameLower = ent.name.toLowerCase();
                if (queryLower.includes(nameLower) || contentLower.includes(nameLower)) {
                    results.push(ent);
                }
            }
        } catch(e) {}
        return results.slice(0, 10);
    },

    async _extractEntitiesFromChat(msgId) {
        const msgEl = document.getElementById(msgId);
        if (!msgEl) return;
        
        const contentDiv = msgEl.querySelector('div:last-child');
        if (!contentDiv) return;
        
        const replyText = contentDiv.innerText || contentDiv.textContent;
        
        const entityMatch = replyText.match(/【关联实体[：:]\s*([^\]]+)\]/g);
        if (!entityMatch || entityMatch.length === 0) {
            UI.toast('未发现关联实体标注');
            return;
        }
        
        const entityNames = entityMatch.map(m => m.replace(/【关联实体[：:]\s*/, '').replace('】', '').trim());
        let count = 0;
        
        for (const name of entityNames) {
            const existing = await DB.getAll('entities') || [];
            const found = existing.find(e => e.name === name);
            
            if (!found) {
                await DB.put('entities', {
                    id: 'chat_entity_' + Utils.uuid(),
                    name: name,
                    type: '其他',
                    desc: `从对话中提取: ${replyText.slice(0, 200)}`,
                    source: 'chat',
                    extractedAt: Date.now()
                });
                count++;
            }
        }
        
        if (count > 0) {
            UI.toast(`已提取 ${count} 个新实体到世界引擎`);
            if (typeof RAGSystem !== 'undefined') {
                await RAGSystem.refreshEntityCache();
            }
        } else {
            UI.toast('所有实体已存在');
        }
    },

    _formatChatReply(text) {
        let formatted = text
            .replace(/【修改后】/g, '<span class="text-green-400 font-bold">【修改后】</span>')
            .replace(/【修改建议】/g, '<span class="text-amber-400 font-bold">【修改建议】</span>')
            .replace(/【原文】/g, '<span class="text-red-400 font-bold">【原文】</span>')
            .replace(/【改为】/g, '<span class="text-green-400 font-bold">【改为】</span>')
            .replace(/【理由】/g, '<span class="text-cyan-400 font-bold">【理由】</span>')
            .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-800">$1</strong>')
            .replace(/\n/g, '<br>');
        return formatted;
    },

    _applyChatModification(msgId, selStart, selEnd) {
        const msgEl = document.getElementById(msgId);
        if (!msgEl) return;
        
        const contentDiv = msgEl.querySelector('div:last-child');
        if (!contentDiv) return;
        
        const replyText = contentDiv.innerText || contentDiv.textContent;
        
        // 尝试提取修改后的内容
        let modified = '';
        
        // 格式1: 【修改后】xxx
        const modMatch = replyText.match(/【修改后】\s*([\s\S]*?)(?=【|$)/);
        if (modMatch) {
            modified = modMatch[1].trim();
        }
        
        // 格式2: 改为：xxx
        if (!modified) {
            const changeMatch = replyText.match(/改为[：:]\s*([\s\S]*?)(?=理由|$)/);
            if (changeMatch) {
                modified = changeMatch[1].trim();
            }
        }
        
        // 格式3: 整个回复作为修改内容（如果没有明确标记）
        if (!modified && replyText.length > 50) {
            // 尝试提取看起来像正文的内容
            const lines = replyText.split('\n').filter(l => !l.startsWith('【') && !l.startsWith('理由') && l.trim().length > 20);
            if (lines.length > 0) {
                modified = lines.join('\n').trim();
            }
        }
        
        if (!modified) {
            UI.toast('未能识别修改内容', 'error');
            return;
        }
        
        const editor = document.getElementById('w-editor');
        if (!editor) return;
        
        if (selStart !== null && selEnd !== null && selStart !== 'null') {
            // 替换选中部分
            const before = editor.value.slice(0, selStart);
            const after = editor.value.slice(selEnd);
            editor.value = before + modified + after;
            this._clearChatSelection();
        } else {
            // 追加到末尾或替换最后一段
            if (confirm('应用到哪里？\n确定 = 追加到末尾\n取消 = 替换最后500字')) {
                editor.value += '\n\n' + modified;
            } else {
                editor.value = editor.value.slice(0, -500) + modified;
            }
        }
        
        this.onInput();
        this.save();
        UI.toast('已应用修改');
    },

    _copyChatReply(msgId) {
        const msgEl = document.getElementById(msgId);
        if (!msgEl) return;
        const contentDiv = msgEl.querySelector('div:last-child');
        if (!contentDiv) return;
        const text = contentDiv.innerText || contentDiv.textContent;
        Utils.copy(text);
        UI.toast('已复制');
    },

    // ===== Export =====
    async exportToLibrary() {
        const content = (document.getElementById('w-editor') || {}).value || '';
        const title = (document.getElementById('w-title') || {}).value || '未命名章节';
        if (!content.trim()) return UI.toast('内容为空');
        if (typeof ContextHelper !== 'undefined') {
            await ContextHelper.exportToLibrary(title, content);
        } else {
            await DB.put('library_books', { id: Utils.uuid(), name: title, type: 'txt', content, size: content.length, date: new Date().toLocaleDateString() });
            UI.toast('已导入沉浸阅读');
        }
    },

    // ===== 批量自动写正文 (深度绑定融合技法 + RAG上下文) =====
    async autoWriteAll() {
        const chaps = (await DB.getAll('chapters') || []).sort((a,b) => (a.order||0) - (b.order||0));
        const targets = chaps.filter(c => c.outline && c.outline.trim().length > 20 && (!c.content || c.content.trim().length < 50));
        if (targets.length === 0) return UI.toast('没有需要写正文的章节（需要有细纲且正文为空）');

        // 显示进度面板
        this._showBatchProgress('批量自动写作', 0, targets.length);
        this._batchStopFlag = false;

        const startFrom = parseInt(prompt(`共 ${targets.length} 章待写\n从第几章开始？(1-${targets.length})`, '1') || '1') - 1;
        if (isNaN(startFrom) || startFrom < 0) return this._hideBatchProgress();

        const endAt = parseInt(prompt(`写到第几章结束？(${startFrom+1}-${targets.length})`, String(targets.length)) || String(targets.length));
        if (isNaN(endAt) || endAt < startFrom + 1) return this._hideBatchProgress();
        const endIdx = Math.min(endAt, targets.length);

        const delaySeconds = parseInt(prompt('章间延迟(秒)，防止API限流 (建议3-5)', '3') || '3');

        let rules = '';
        const rulesData = await DB.get('settings', 'writer_rules');
        if (rulesData) rules = rulesData.rules || '';

        const fusionCtx = this._getFusionContext();

        this._setGenerating(true);
        const st = document.getElementById('w-save-status');

        for (let i = startFrom; i < endIdx; i++) {
            // 检查停止标志
            if (this._batchStopFlag) {
                this._updateBatchProgress('已停止', i - startFrom, endIdx - startFrom);
                if (st) st.textContent = '批量写作已停止';
                break;
            }

            const chap = targets[i];
            const totalToDo = endIdx - startFrom;
            const currentNum = i - startFrom + 1;
            
            // 更新进度
            this._updateBatchProgress(`正在写作: ${chap.title}`, currentNum, totalToDo);
            if (st) st.textContent = `自动写作 [${currentNum}/${totalToDo}] ${chap.title}`;

            // 自动切换到当前章节，让用户看到正在写
            this.currentChapterId = chap.id;
            this.currentVolumeId = chap.volumeId || this.currentVolumeId;
            const titleEl = document.getElementById('w-title');
            const editorEl = document.getElementById('w-editor');
            const outlineEl = document.getElementById('w-outline');
            if (titleEl) titleEl.value = chap.title || '';
            if (editorEl) editorEl.value = '';
            if (outlineEl) outlineEl.value = chap.outline || '';
            this.onInput();
            this.loadTree();

            let prevContent = '';
            const prevIdx = chaps.findIndex(c => c.id === chap.id) - 1;
            if (prevIdx >= 0 && chaps[prevIdx].content) {
                prevContent = chaps[prevIdx].content.slice(-1500);
            }

            // === RAG上下文检索 ===
            let ragContext = '';
            if (typeof RAGSystem !== 'undefined') {
                try {
                    const ragQuery = (chap.title || '') + ' ' + (chap.outline || '').slice(0, 300);
                    const ragResults = await RAGSystem.search(ragQuery, 5);
                    if (ragResults && ragResults.length > 0) {
                        ragContext = '[RAG参考上下文]\n' + ragResults.map(r => `[${r.source||''}] ${r.title}: ${r.content.slice(0, 400)}`).join('\n---\n') + '\n\n';
                    }
                } catch(e) {}
            }

            let writePrompt = `你是一位专业小说家。请根据以下信息编写本章正文。\n\n`;
            // 注入RAG上下文
            if(ragContext) writePrompt += ragContext;
            // 注入融合技法
            if(fusionCtx) writePrompt += fusionCtx + '\n';
            if(rules) writePrompt += '[写作规则]\n' + rules.slice(0, 1000) + '\n\n';
            writePrompt += `[本章标题] ${chap.title}\n\n[本章细纲]\n${chap.outline.slice(0, 3000)}\n\n`;
            if(prevContent) writePrompt += '[前文末尾]\n' + prevContent + '\n\n';
            writePrompt += `要求：\n1. 严格按照细纲展开\n2. ${fusionCtx ? '运用融合技法中的套路（钩子、节奏、爽点）' : '文风统一，情节连贯'}\n3. ${ragContext ? '参考RAG上下文保持世界观/人设/伏笔一致性' : '保持前后文一致'}\n4. 字数约1500-2500字\n5. 直接输出正文`;

            try {
                let content = '';
                await AI.generate(writePrompt, {}, c => {
                    content += c;
                    // 实时显示到编辑器
                    if (editorEl) editorEl.value = content;
                    this.onInput();
                });
                chap.content = content;
                await DB.put('chapters', chap);
                if (typeof MemorySystem !== 'undefined') {
                    MemorySystem.addWorking(`[自动写作] ${chap.title} (${content.length}字)`, 'generation', 3);
                }
                if (st) st.textContent = `✓ ${chap.title} (${content.length}字) [${currentNum}/${totalToDo}]`;
            } catch(e) {
                if (st) st.textContent = `第${i+1}章写作失败: ${e.message}`;
            }

            // 章间延迟，防止API 429限流
            if (i < endIdx - 1 && delaySeconds > 0) {
                if (st) st.textContent += ` | 等待${delaySeconds}秒...`;
                await new Promise(r => setTimeout(r, delaySeconds * 1000));
            }
        }

        const wrote = endIdx - startFrom;
        this._setGenerating(false);
        this._hideBatchProgress();
        if (st) st.textContent = `自动写作完成 (${wrote}章)`;
        UI.toast(`自动写作完成！共写 ${wrote} 章`);
        this.loadTree();
    },
    
    _showBatchProgress(label, current, total) {
        let panel = document.getElementById('w-batch-progress');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'w-batch-progress';
            panel.className = 'fixed top-16 right-4 z-[9998] bg-white border border-gray-300 rounded-xl shadow-2xl w-72 overflow-hidden';
            panel.innerHTML = `
                <div class="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-b border-amber-500/20">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-spinner fa-spin text-amber-400"></i>
                        <span id="w-batch-label" class="text-[11px] font-bold text-amber-400">批量写作中...</span>
                    </div>
                    <button id="w-batch-stop" class="btn btn-xs bg-red-600/30 text-red-400 border-red-500/30 hover:bg-red-600 hover:text-gray-800" onclick="Modules.writer._stopBatch()"><i class="fa-solid fa-stop mr-1"></i>停止</button>
                </div>
                <div class="p-3">
                    <div class="flex items-center justify-between mb-1">
                        <span id="w-batch-status" class="text-[10px] text-dim">准备中...</span>
                        <span id="w-batch-percent" class="text-[10px] font-mono text-amber-400">0%</span>
                    </div>
                    <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div id="w-batch-bar" class="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300" style="width: 0%"></div>
                    </div>
                    <div id="w-batch-detail" class="text-[9px] text-dim mt-1"></div>
                </div>
            `;
            document.body.appendChild(panel);
        }
        panel.classList.remove('hidden');
        const labelEl = document.getElementById('w-batch-label');
        if (labelEl) labelEl.textContent = label;
        this._updateBatchProgress('准备中...', current, total);
    },
    
    _updateBatchProgress(status, current, total) {
        const statusEl = document.getElementById('w-batch-status');
        const percentEl = document.getElementById('w-batch-percent');
        const barEl = document.getElementById('w-batch-bar');
        const detailEl = document.getElementById('w-batch-detail');
        
        const percent = total > 0 ? Math.round((current / total) * 100) : 0;
        if (statusEl) statusEl.textContent = status;
        if (percentEl) percentEl.textContent = percent + '%';
        if (barEl) barEl.style.width = percent + '%';
        if (detailEl) detailEl.textContent = `${current} / ${total} 章`;
    },
    
    _hideBatchProgress() {
        const panel = document.getElementById('w-batch-progress');
        if (panel) panel.classList.add('hidden');
    },
    
    _stopBatch() {
        this._batchStopFlag = true;
        const stopBtn = document.getElementById('w-batch-stop');
        if (stopBtn) {
            stopBtn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>已停止';
            stopBtn.disabled = true;
        }
    },
    
    async continueBatchWrite() {
        const chaps = (await DB.getAll('chapters') || []).sort((a,b) => (a.order||0) - (b.order||0));
        const emptyChaps = chaps.filter(c => c.outline && c.outline.trim().length > 20 && (!c.content || c.content.trim().length < 50));
        
        if (emptyChaps.length === 0) {
            UI.toast('所有章节都已有正文！');
            return;
        }
        
        const firstEmptyIdx = chaps.findIndex(c => c.id === emptyChaps[0].id);
        UI.toast(`从第 ${firstEmptyIdx + 1} 章「${emptyChaps[0].title}」继续写作`);
        
        this.autoWriteAll();
    },

    // ===== 强化批量自动写正文 (深度绑定世界引擎 + 融合技法 + 逻辑纠正) =====
    async autoWriteAllEnhanced() {
        const W = Modules.writer;
        const chaps = (await DB.getAll('chapters') || []).sort((a,b) => (a.order||0) - (b.order||0));
        const targets = chaps.filter(c => c.outline && c.outline.trim().length > 20 && (!c.content || c.content.trim().length < 50));
        
        if (targets.length === 0) {
            UI.toast('没有需要写正文的章节（需要有细纲且正文为空）');
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'w-auto-write-modal';
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-gray-300 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl border border-gray-300 w-[600px] max-h-[85vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                    <span class="font-bold text-gray-800"><i class="fa-solid fa-rocket mr-2 text-amber-400"></i>批量自动写作配置</span>
                    <button class="text-dim hover:text-gray-800" onclick="this.closest('#w-auto-write-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto p-5 space-y-4">
                    <div class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div class="text-sm font-bold text-amber-300 mb-1">待写章节: ${targets.length} 章</div>
                        <div class="text-[10px] text-dim">仅显示有细纲且正文为空的章节</div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <div class="text-[10px] text-dim font-bold uppercase mb-1">起始章节</div>
                            <select id="w-auto-start" class="w-full bg-gray-100 border border-gray-300 rounded-lg p-2 text-sm text-gray-800">
                                ${targets.map((c, i) => `<option value="${i}" ${i===0?'selected':''}>${i+1}. ${c.title}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <div class="text-[10px] text-dim font-bold uppercase mb-1">结束章节</div>
                            <select id="w-auto-end" class="w-full bg-gray-100 border border-gray-300 rounded-lg p-2 text-sm text-gray-800">
                                ${targets.map((c, i) => `<option value="${i}" ${i===targets.length-1?'selected':''}>${i+1}. ${c.title}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <div class="text-[10px] text-dim font-bold uppercase mb-1">章间延迟(秒)</div>
                            <input type="number" id="w-auto-delay" value="3" min="0" max="60" class="w-full bg-gray-100 border border-gray-300 rounded-lg p-2 text-sm text-gray-800">
                        </div>
                        <div>
                            <div class="text-[10px] text-dim font-bold uppercase mb-1">目标字数/章</div>
                            <select id="w-auto-words" class="w-full bg-gray-100 border border-gray-300 rounded-lg p-2 text-sm text-gray-800">
                                <option value="1500">1500字 (短)</option>
                                <option value="2000" selected>2000字 (中)</option>
                                <option value="3000">3000字 (长)</option>
                                <option value="4000">4000字 (超长)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="space-y-2">
                        <div class="text-[10px] text-dim font-bold uppercase">上下文注入</div>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="w-auto-fusion" checked class="accent-amber-500">
                            <span class="text-xs text-gray-600">融合技法精华 (来自融合拆书)</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="w-auto-world" checked class="accent-blue-500">
                            <span class="text-xs text-gray-600">世界引擎实体 (人物/地点/势力等)</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="w-auto-rag" checked class="accent-cyan-500">
                            <span class="text-xs text-gray-600">RAG向量检索 (相关上下文)</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="w-auto-logic" checked class="accent-purple-500">
                            <span class="text-xs text-gray-600">逻辑纠正 (自动检查前后一致性)</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="w-auto-save-rag" checked class="accent-green-500">
                            <span class="text-xs text-gray-600">写完后存入RAG (供后续章节检索)</span>
                        </label>
                    </div>
                    
                    <div class="border-t border-gray-200 pt-3 space-y-2">
                        <div class="text-[10px] text-amber-400 font-bold uppercase"><i class="fa-solid fa-star mr-1"></i>高级功能</div>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="w-auto-extract-entity" checked class="accent-pink-500">
                            <span class="text-xs text-gray-600">自动提取实体到世界引擎</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="w-auto-polish" class="accent-emerald-500">
                            <span class="text-xs text-gray-600">写完后自动润色</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="w-auto-cycle" class="accent-indigo-500">
                            <span class="text-xs text-gray-600">循环模式 (每N章总结优化)</span>
                        </label>
                        <div class="flex items-center gap-2 ml-5">
                            <span class="text-[10px] text-dim">循环周期:</span>
                            <select id="w-auto-cycle-size" class="bg-gray-100 border border-gray-300 rounded px-2 py-1 text-[10px] text-gray-800">
                                <option value="3">3章</option>
                                <option value="5" selected>5章</option>
                                <option value="8">8章</option>
                                <option value="10">10章</option>
                            </select>
                        </div>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="w-auto-checkpoint" checked class="accent-orange-500">
                            <span class="text-xs text-gray-600">断点续写 (保存进度，意外中断可继续)</span>
                        </label>
                    </div>
                    
                    <div class="border-t border-gray-200 pt-3">
                        <div class="text-[10px] text-dim font-bold uppercase mb-2">写作风格提示</div>
                        <textarea id="w-auto-style" class="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 text-xs text-gray-600 resize-none h-20" placeholder="可选：输入额外的风格要求，如'热血爽文'、'细腻言情'等..."></textarea>
                    </div>
                </div>
                <div class="px-5 py-3 border-t border-gray-200 flex gap-2">
                    <button class="btn btn-sm bg-gray-100 text-dim flex-1" onclick="this.closest('#w-auto-write-modal').remove()">取消</button>
                    <button class="btn btn-sm bg-gradient-to-r from-amber-600 to-red-600 text-gray-800 font-bold flex-1" onclick="Modules.writer._startEnhancedAutoWrite()">
                        <i class="fa-solid fa-rocket mr-1"></i>开始批量写作
                    </button>
                </div>
            </div>`;
        
        document.body.appendChild(modal);
    },

    async _startEnhancedAutoWrite() {
        const W = Modules.writer;
        
        const startSelect = document.getElementById('w-auto-start');
        const endSelect = document.getElementById('w-auto-end');
        const delayInput = document.getElementById('w-auto-delay');
        const wordsSelect = document.getElementById('w-auto-words');
        const fusionCheck = document.getElementById('w-auto-fusion');
        const worldCheck = document.getElementById('w-auto-world');
        const ragCheck = document.getElementById('w-auto-rag');
        const logicCheck = document.getElementById('w-auto-logic');
        const saveRagCheck = document.getElementById('w-auto-save-rag');
        const styleInput = document.getElementById('w-auto-style');
        const extractEntityCheck = document.getElementById('w-auto-extract-entity');
        const polishCheck = document.getElementById('w-auto-polish');
        const cycleCheck = document.getElementById('w-auto-cycle');
        const cycleSizeSelect = document.getElementById('w-auto-cycle-size');
        const checkpointCheck = document.getElementById('w-auto-checkpoint');
        
        const startIdx = parseInt(startSelect?.value || 0);
        const endIdx = parseInt(endSelect?.value || 0) + 1;
        const delaySeconds = parseInt(delayInput?.value || 3);
        const targetWords = parseInt(wordsSelect?.value || 2000);
        const useFusion = fusionCheck?.checked !== false;
        const useWorld = worldCheck?.checked !== false;
        const useRAG = ragCheck?.checked !== false;
        const useLogic = logicCheck?.checked !== false;
        const saveToRAG = saveRagCheck?.checked !== false;
        const styleHint = styleInput?.value?.trim() || '';
        const extractEntity = extractEntityCheck?.checked !== false;
        const autoPolish = polishCheck?.checked === true;
        const useCycle = cycleCheck?.checked === true;
        const cycleSize = parseInt(cycleSizeSelect?.value || 5);
        const useCheckpoint = checkpointCheck?.checked !== false;
        
        const modal = document.getElementById('w-auto-write-modal');
        if(modal) modal.remove();
        
        const chaps = (await DB.getAll('chapters') || []).sort((a,b) => (a.order||0) - (b.order||0));
        const targets = chaps.filter(c => c.outline && c.outline.trim().length > 20 && (!c.content || c.content.trim().length < 50));
        const toWrite = targets.slice(startIdx, endIdx);
        
        if(toWrite.length === 0) {
            UI.toast('没有选中任何章节');
            return;
        }

        let checkpointData = null;
        if (useCheckpoint) {
            checkpointData = await DB.get('settings', 'auto_write_checkpoint');
            if (checkpointData && checkpointData.pending && checkpointData.pending.length > 0) {
                const resume = confirm(`检测到上次未完成的批量写作 (${checkpointData.completed?.length || 0}章已完成)\n是否继续上次进度？`);
                if (resume) {
                    const completedIds = checkpointData.completed || [];
                    const remaining = toWrite.filter(c => !completedIds.includes(c.id));
                    if (remaining.length > 0) {
                        UI.toast(`继续上次进度，剩余 ${remaining.length} 章`);
                    }
                } else {
                    checkpointData = { pending: toWrite.map(c => c.id), completed: [], startedAt: Date.now() };
                }
            } else {
                checkpointData = { pending: toWrite.map(c => c.id), completed: [], startedAt: Date.now() };
            }
        }
        
        let rules = '';
        const rulesData = await DB.get('settings', 'writer_rules');
        if (rulesData) rules = rulesData.rules || '';
        
        const fusionCtx = useFusion ? W._getFusionContext() : '';
        
        let worldCtx = '';
        if(useWorld && Modules.world_engine) {
            await Modules.world_engine._ensureCache();
            const entities = Modules.world_engine._cachedEntities || [];
            const worldEntities = entities.filter(e => !e.id.startsWith('world_'));
            const worldViews = entities.filter(e => e.id.startsWith('world_') && e.desc);
            
            if(worldEntities.length > 0) {
                worldCtx += '[世界引擎实体]\n';
                worldEntities.slice(0, 15).forEach(e => {
                    worldCtx += `${e.type}·${e.name}: ${(e.desc || '').slice(0, 100)}`;
                    if(e.relations && e.relations.length) {
                        worldCtx += ` | 关联: ${e.relations.slice(0, 3).join(', ')}`;
                    }
                    worldCtx += '\n';
                });
            }
            if(worldViews.length > 0) {
                const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
                worldCtx += '\n[世界观设定]\n';
                worldViews.slice(0, 3).forEach(w => {
                    const cat = w.id.replace('world_', '');
                    worldCtx += `${catLabels[cat] || cat}: ${(w.desc || '').slice(0, 200)}\n`;
                });
            }
        }
        
        W._setGenerating(true);
        const st = document.getElementById('w-save-status');
        
        // 初始化全局进度面板
        App.showProgress('批量自动写作', 0, toWrite.length, true);
        App.logIO(`开始批量写作，共 ${toWrite.length} 章`, 'info');
        App.resetStop();
        
        for (let i = 0; i < toWrite.length; i++) {
            // 检查是否被停止
            if (App.isStopped()) {
                App.logIO('用户停止了批量写作', 'warning');
                if (st) st.textContent = '已停止';
                break;
            }
            
            const chap = toWrite[i];
            const currentNum = i + 1;
            
            // 更新全局进度
            App.showProgress(`正在写作: ${chap.title}`, currentNum, toWrite.length, true);
            App.logIO(`[${currentNum}/${toWrite.length}] 开始写作: ${chap.title}`, 'input');
            
            if (st) st.textContent = `自动写作 [${currentNum}/${toWrite.length}] ${chap.title}`;
            
            W.currentChapterId = chap.id;
            W.currentVolumeId = chap.volumeId || W.currentVolumeId;
            const titleEl = document.getElementById('w-title');
            const editorEl = document.getElementById('w-editor');
            const outlineEl = document.getElementById('w-outline');
            if (titleEl) titleEl.value = chap.title || '';
            if (editorEl) editorEl.value = '';
            if (outlineEl) outlineEl.value = chap.outline || '';
            W.onInput();
            W.loadTree();
            
            let prevContent = '';
            const prevIdx = chaps.findIndex(c => c.id === chap.id) - 1;
            if (prevIdx >= 0 && chaps[prevIdx].content) {
                prevContent = chaps[prevIdx].content.slice(-2000);
            }
            
            let ragContext = '';
            if (useRAG && typeof RAGSystem !== 'undefined') {
                try {
                    const ragQuery = (chap.title || '') + ' ' + (chap.outline || '').slice(0, 300);
                    const ragResults = await RAGSystem.search(ragQuery, 5);
                    if (ragResults && ragResults.length > 0) {
                        ragContext = '[RAG参考上下文]\n' + ragResults.map(r => `[${r.source||''}] ${r.title}: ${r.content.slice(0, 400)}`).join('\n---\n') + '\n\n';
                    }
                } catch(e) {}
            }
            
            let writePrompt = `你是一位专业小说家。请根据以下信息编写本章正文。\n\n`;
            if(fusionCtx) writePrompt += fusionCtx + '\n';
            if(worldCtx) writePrompt += worldCtx + '\n';
            if(ragContext) writePrompt += ragContext;
            if(rules) writePrompt += '[写作规则]\n' + rules.slice(0, 1000) + '\n\n';
            if(styleHint) writePrompt += `[风格要求] ${styleHint}\n\n`;
            
            writePrompt += `[本章标题] ${chap.title}\n\n[本章细纲]\n${chap.outline.slice(0, 3000)}\n\n`;
            
            if(prevContent) {
                writePrompt += '[前文末尾(保持连贯性)]\n' + prevContent + '\n\n';
            }
            
            writePrompt += `要求：
1. 严格按照细纲展开情节
2. ${fusionCtx ? '运用融合技法中的套路（钩子、节奏、爽点）' : '文风统一，情节连贯'}
3. ${worldCtx || ragContext ? '参考上下文保持世界观/人设/伏笔一致性' : '保持前后文一致'}
4. 字数约${targetWords}字
5. 直接输出正文，不要标题`;
            
            if(useLogic && prevContent) {
                writePrompt += `\n6. 注意与前文的逻辑连贯，避免人物性格突变、时间线混乱等问题`;
            }
            
            try {
                let content = '';
                await AI.generate(writePrompt, {}, c => {
                    content += c;
                    if (editorEl) editorEl.value = content;
                    W.onInput();
                });
                
                if(useLogic && content.length > 500) {
                    const logicPrompt = `请检查以下小说正文的逻辑问题：

【章节标题】${chap.title}
【正文内容】
${content.slice(0, 3000)}

【前文末尾】
${prevContent.slice(0, 1000)}

请检查：
1. 人物行为是否前后一致
2. 时间线是否合理
3. 场景转换是否自然
4. 是否有明显的逻辑漏洞

如果发现问题，请用JSON格式输出修复建议：
{"issues":["问题1","问题2"],"suggestions":["建议1","建议2"]}

如果没有明显问题，输出：{"issues":[],"suggestions":[]}`;
                    
                    try {
                        let logicResult = '';
                        await AI.generate(logicPrompt, { maxTokens: 500 }, c => { logicResult += c; });
                        
                        const jsonMatch = logicResult.match(/\{[\s\S]*\}/);
                        if(jsonMatch) {
                            const logic = JSON.parse(jsonMatch[0]);
                            if(logic.issues && logic.issues.length > 0) {
                                console.log(`章节"${chap.title}"逻辑检查发现问题:`, logic.issues);
                            }
                        }
                    } catch(e) {}
                }
                
                chap.content = content;
                await DB.put('chapters', chap);
                
                if(saveToRAG && typeof RAGSystem !== 'undefined') {
                    try {
                        await RAGSystem.addDocument(`第${chap.order||''}章: ${chap.title}`, content, 'chapter', { chapterId: chap.id });
                    } catch(e) {}
                }
                
                if (extractEntity && content.length > 500) {
                    try {
                        await W._extractEntitiesFromContent(content, chap.title, chap.order || (i + 1));
                    } catch(e) { console.warn('实体提取失败:', e); }
                }
                
                if (autoPolish && content.length > 500) {
                    try {
                        if (st) st.textContent = `润色中: ${chap.title}`;
                        let polished = '';
                        await AI.generate(
                            `请润色以下小说正文，保持原意和风格，优化语言表达和节奏：

${content.slice(0, 3000)}

要求：
1. 保持原有情节和人物性格
2. 优化句子节奏，使其更加流畅
3. 增强描写生动性
4. 删除冗余表达
5. 直接输出润色后的正文`,
                            {}, c => { polished += c; }
                        );
                        if (polished.length > content.length * 0.5) {
                            chap.content = polished;
                            await DB.put('chapters', chap);
                            content = polished;
                        }
                    } catch(e) { console.warn('润色失败:', e); }
                }
                
                if (useCycle && (i + 1) % cycleSize === 0 && i > 0) {
                    try {
                        if (st) st.textContent = `循环总结: 第${i - cycleSize + 2}-${i + 1}章`;
                        const cycleChapters = toWrite.slice(i - cycleSize + 1, i + 1);
                        await W._cycleSummary(cycleChapters, cycleSize);
                    } catch(e) { console.warn('循环总结失败:', e); }
                }
                
                if (useCheckpoint && checkpointData) {
                    checkpointData.completed.push(chap.id);
                    checkpointData.pending = checkpointData.pending.filter(id => id !== chap.id);
                    await DB.put('settings', { id: 'auto_write_checkpoint', ...checkpointData, updatedAt: Date.now() });
                }
                
                if (typeof MemorySystem !== 'undefined') {
                    MemorySystem.addWorking(`[自动写作] ${chap.title} (${content.length}字)`, 'generation', 3);
                }
                
                if (st) st.textContent = `✓ ${chap.title} (${content.length}字) [${currentNum}/${toWrite.length}]`;
                App.logIO(`✓ ${chap.title} 完成 (${content.length}字)`, 'success');
            } catch(e) {
                if (st) st.textContent = `第${i+1}章写作失败: ${e.message}`;
                App.logIO(`✗ ${chap.title} 失败: ${e.message}`, 'error');
            }
            
            if (i < toWrite.length - 1 && delaySeconds > 0) {
                if (st) st.textContent += ` | 等待${delaySeconds}秒...`;
                await new Promise(r => setTimeout(r, delaySeconds * 1000));
            }
        }
        
        W._setGenerating(false);
        if (st) st.textContent = `自动写作完成 (${toWrite.length}章)`;
        UI.toast(`自动写作完成！共写 ${toWrite.length} 章`);
        W.loadTree();
        
        if (useCheckpoint) {
            await DB.del('settings', 'auto_write_checkpoint');
        }
    },

    async _extractEntitiesFromContent(content, title, chapterNum) {
        let raw = '';
        try {
            await AI.generate(
                `从以下章节内容中提取关键实体：

【章节】${title}
【内容】
${content.slice(0, 4000)}

提取类型：人物、物品、地点、势力、情节、伏笔
输出JSON数组：[{"name":"名称","type":"类型","desc":"描述","relations":["关系:实体"]}]

只输出JSON。`,
                {}, c => { raw += c; }
            );
            
            let cleanRaw = raw.trim().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
            const start = cleanRaw.indexOf('[');
            const end = cleanRaw.lastIndexOf(']');
            if (start !== -1 && end > start) {
                const entities = JSON.parse(cleanRaw.slice(start, end + 1));
                const now = Date.now();
                for (const ent of entities) {
                    if (!ent.name) continue;
                    await DB.put('entities', {
                        id: 'writer_ent_' + Utils.uuid(),
                        name: ent.name,
                        type: ent.type || '其他',
                        desc: ent.desc || '',
                        relations: ent.relations || [],
                        chapterRef: [chapterNum],
                        source: 'writer_auto',
                        extractedAt: now
                    });
                }
                if (typeof RAGSystem !== 'undefined') {
                    await RAGSystem.refreshEntityCache();
                }
            }
        } catch(e) { console.warn('实体提取解析失败:', e); }
    },

    async _cycleSummary(chapters, cycleSize) {
        const contents = chapters.map((c, i) => 
            `【第${c.order || i + 1}章: ${c.title}】\n${(c.content || '').slice(0, 1000)}`
        ).join('\n\n---\n\n');

        let summary = '';
        try {
            await AI.generate(
                `请对以下${cycleSize}章内容进行写作总结：

${contents.slice(0, 6000)}

输出：
1. 【核心情节】简要概括
2. 【人物发展】主要人物变化
3. 【伏笔追踪】已埋设的伏笔
4. 【下阶段建议】后续写作建议

简洁输出，不超过500字。`,
                {}, c => { summary += c; }
            );
            
            await DB.put('settings', {
                id: `cycle_summary_${chapters[0].order || 1}_${chapters[chapters.length - 1].order || cycleSize}`,
                content: summary,
                createdAt: Date.now()
            });
            
            if (typeof RAGSystem !== 'undefined') {
                await RAGSystem.addDocument(
                    `循环总结_${chapters[0].order || 1}-${chapters[chapters.length - 1].order || cycleSize}章`,
                    summary,
                    'pipeline'
                );
            }
        } catch(e) { console.warn('循环总结失败:', e); }
    },

    // ===== 诊断与分析功能 =====
    async diagnoseContent() {
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        if (!content.trim()) return UI.toast('编辑器内容为空', 'error');
        
        const resultEl = document.getElementById('w-diagnose-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-center text-dim py-4"><i class="fa-solid fa-spinner fa-spin text-xl mb-2"></i><div>正在诊断...</div></div>';
        
        const prompt = `你是一位专业的小说编辑和文学评论家。请对以下小说内容进行全面诊断：

【小说内容】
${content.slice(0, 6000)}

【诊断要求】
请从以下维度进行分析：

1. **情节逻辑**
   - 是否有逻辑漏洞或前后矛盾
   - 因果关系是否合理
   - 冲突设置是否有效

2. **人物塑造**
   - 人物性格是否一致
   - 对话是否符合人物身份
   - 人物动机是否清晰

3. **文笔风格**
   - 叙事节奏是否恰当
   - 描写是否生动具体
   - 是否有冗余或重复

4. **读者体验**
   - 开头是否吸引人
   - 情绪曲线是否合理
   - 悬念和钩子设置

5. **改进建议**
   - 具体的修改建议
   - 优先级排序

请用清晰的Markdown格式输出诊断报告。`;

        let result = '';
        await AI.generate(prompt, {}, c => { result += c; });
        
        if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
        UI.toast('诊断完成');
    },

    async analyzeContent() {
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        if (!content.trim()) return UI.toast('编辑器内容为空', 'error');
        
        const resultEl = document.getElementById('w-diagnose-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-center text-dim py-4"><i class="fa-solid fa-spinner fa-spin text-xl mb-2"></i><div>正在深度分析...</div></div>';
        
        const outline = (document.getElementById('w-outline') || {}).value || '';
        const fusionCtx = this._getFusionContext();
        
        const prompt = `你是一位资深的网文分析师，精通各种写作技法和套路。请对以下内容进行深度分析：

【章节大纲】
${outline.slice(0, 1000) || '无'}

【正文内容】
${content.slice(0, 6000)}

${fusionCtx ? `【融合技法参考】\n${fusionCtx.slice(0, 2000)}\n` : ''}

【分析要求】
请进行以下深度分析：

1. **技法运用分析**
   - 使用了哪些写作技法
   - 技法运用是否到位
   - 与融合技法的对照

2. **节奏曲线分析**
   - 标注情绪高低点
   - 分析节奏控制效果
   - 提出优化建议

3. **爽点/看点分析**
   - 识别文中的爽点
   - 分析爽点设置效果
   - 建议增加的爽点

4. **悬念体系分析**
   - 伏笔设置情况
   - 钩子效果评估
   - 悬念链完整性

5. **读者心理分析**
   - 预期读者情绪变化
   - 可能的弃读点
   - 优化建议

请用Markdown格式输出详细分析报告。`;

        let result = '';
        await AI.generate(prompt, {}, c => { result += c; });
        
        if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
        UI.toast('深度分析完成');
    },

    async summarizeContent() {
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        if (!content.trim()) return UI.toast('编辑器内容为空', 'error');
        
        const resultEl = document.getElementById('w-diagnose-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-center text-dim py-4"><i class="fa-solid fa-spinner fa-spin text-xl mb-2"></i><div>正在总结...</div></div>';
        
        const prompt = `请对以下小说内容进行总结概述：

【内容】
${content.slice(0, 8000)}

【输出要求】
1. **一句话概括**（20字以内）
2. **核心情节**（100字以内）
3. **关键人物**（列出出场人物及其行动）
4. **重要场景**（列出主要场景）
5. **伏笔/悬念**（如有）
6. **情绪走向**（从...到...）

请简洁清晰地输出。`;

        let result = '';
        await AI.generate(prompt, {}, c => { result += c; });
        
        if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
        UI.toast('总结完成');
    },

    openSoloPromptModal() {
        const modal = document.createElement('div');
        modal.id = 'w-solo-prompt-modal';
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-gray-300 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl border border-gray-300 w-[700px] max-h-[85vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                    <span class="font-bold text-gray-800"><i class="fa-solid fa-wand-magic-sparkles mr-2 text-purple-400"></i>SOLO 自定义提示词</span>
                    <button class="text-dim hover:text-gray-800" onclick="this.closest('#w-solo-prompt-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto p-5 space-y-4">
                    <div class="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <div class="text-sm font-bold text-purple-300 mb-1">自定义提示词模板</div>
                        <div class="text-[10px] text-dim">保存常用提示词，一键执行分析任务。支持变量：{{content}} = 当前正文，{{outline}} = 章节大纲</div>
                    </div>
                    
                    <div>
                        <div class="text-[10px] text-dim font-bold uppercase mb-1">提示词名称</div>
                        <input type="text" id="w-solo-name" class="w-full bg-gray-100 border border-gray-300 rounded-lg p-2 text-sm text-gray-800" placeholder="例如：人物关系分析、场景描写优化...">
                    </div>
                    
                    <div>
                        <div class="text-[10px] text-dim font-bold uppercase mb-1">提示词内容</div>
                        <textarea id="w-solo-prompt" class="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 text-sm text-gray-800 min-h-[200px] font-mono" placeholder="输入你的自定义提示词...&#10;&#10;可用变量：&#10;{{content}} - 当前编辑器正文&#10;{{outline}} - 当前章节大纲&#10;{{title}} - 当前章节标题"></textarea>
                    </div>
                    
                    <div class="text-[10px] text-dim font-bold uppercase">已保存的提示词</div>
                    <div id="w-solo-saved-list" class="space-y-2 max-h-40 overflow-y-auto">
                        <div class="text-dim text-xs text-center py-2">加载中...</div>
                    </div>
                </div>
                <div class="flex gap-2 p-4 border-t border-gray-200">
                    <button class="btn btn-primary flex-1" onclick="Modules.writer._saveSoloPrompt()"><i class="fa-solid fa-floppy-disk mr-1"></i>保存提示词</button>
                    <button class="btn bg-purple-600/20 text-purple-400 border-purple-600/30 flex-1" onclick="Modules.writer._runSoloPrompt()"><i class="fa-solid fa-play mr-1"></i>立即执行</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this._loadSoloPrompts();
    },

    async _loadSoloPrompts() {
        const listEl = document.getElementById('w-solo-saved-list');
        if (!listEl) return;
        
        try {
            const saved = await DB.get('settings', 'writer_solo_prompts') || { prompts: [] };
            const prompts = saved.prompts || [];
            
            if (prompts.length === 0) {
                listEl.innerHTML = '<div class="text-dim text-xs text-center py-2">暂无保存的提示词</div>';
                return;
            }
            
            listEl.innerHTML = prompts.map((p, i) => `
                <div class="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border border-gray-200">
                    <span class="flex-1 text-xs text-gray-800 truncate">${p.name}</span>
                    <button class="text-purple-400 hover:text-purple-300 text-xs" onclick="Modules.writer._useSoloPrompt(${i})"><i class="fa-solid fa-play"></i></button>
                    <button class="text-dim hover:text-gray-800 text-xs" onclick="Modules.writer._editSoloPrompt(${i})"><i class="fa-solid fa-pen"></i></button>
                    <button class="text-red-400 hover:text-red-300 text-xs" onclick="Modules.writer._delSoloPrompt(${i})"><i class="fa-solid fa-trash"></i></button>
                </div>
            `).join('');
        } catch (e) {
            listEl.innerHTML = '<div class="text-dim text-xs text-center py-2">加载失败</div>';
        }
    },

    async _saveSoloPrompt() {
        const nameEl = document.getElementById('w-solo-name');
        const promptEl = document.getElementById('w-solo-prompt');
        const name = nameEl?.value?.trim();
        const prompt = promptEl?.value?.trim();
        
        if (!name || !prompt) return UI.toast('请填写名称和提示词', 'error');
        
        try {
            const saved = await DB.get('settings', 'writer_solo_prompts') || { prompts: [] };
            saved.prompts = saved.prompts || [];
            saved.prompts.push({ name, prompt, createdAt: Date.now() });
            await DB.put('settings', saved);
            UI.toast('提示词已保存');
            this._loadSoloPrompts();
            nameEl.value = '';
            promptEl.value = '';
        } catch (e) {
            UI.toast('保存失败', 'error');
        }
    },

    async _useSoloPrompt(index) {
        try {
            const saved = await DB.get('settings', 'writer_solo_prompts') || { prompts: [] };
            const prompt = saved.prompts?.[index];
            if (!prompt) return UI.toast('提示词不存在', 'error');
            
            const nameEl = document.getElementById('w-solo-name');
            const promptEl = document.getElementById('w-solo-prompt');
            if (nameEl) nameEl.value = prompt.name;
            if (promptEl) promptEl.value = prompt.prompt;
            
            UI.toast('已加载提示词: ' + prompt.name);
        } catch (e) {
            UI.toast('加载失败', 'error');
        }
    },

    async _editSoloPrompt(index) {
        await this._useSoloPrompt(index);
        await this._delSoloPrompt(index);
    },

    async _delSoloPrompt(index) {
        if (!confirm('确定删除此提示词？')) return;
        
        try {
            const saved = await DB.get('settings', 'writer_solo_prompts') || { prompts: [] };
            saved.prompts?.splice(index, 1);
            await DB.put('settings', saved);
            UI.toast('已删除');
            this._loadSoloPrompts();
        } catch (e) {
            UI.toast('删除失败', 'error');
        }
    },

    async _runSoloPrompt() {
        const promptEl = document.getElementById('w-solo-prompt');
        let promptText = promptEl?.value?.trim();
        
        if (!promptText) return UI.toast('请输入提示词', 'error');
        
        const editor = document.getElementById('w-editor');
        const content = editor?.value || '';
        const outline = (document.getElementById('w-outline') || {}).value || '';
        const title = (document.getElementById('w-title') || {}).value || '';
        
        promptText = promptText
            .replace(/\{\{content\}\}/g, content.slice(0, 6000))
            .replace(/\{\{outline\}\}/g, outline.slice(0, 2000))
            .replace(/\{\{title\}\}/g, title);
        
        const modal = document.getElementById('w-solo-prompt-modal');
        if (modal) modal.remove();
        
        const resultEl = document.getElementById('w-diagnose-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-center text-dim py-4"><i class="fa-solid fa-spinner fa-spin text-xl mb-2"></i><div>正在执行...</div></div>';
        
        this.tab('diagnose');
        
        let result = '';
        await AI.generate(promptText, {}, c => { result += c; });
        
        if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
        UI.toast('执行完成');
    },

    _formatMarkdown(text) {
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-800">$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/^### (.+)$/gm, '<h4 class="text-accent font-bold mt-4 mb-2">$1</h4>')
            .replace(/^## (.+)$/gm, '<h3 class="text-gray-800 font-bold mt-4 mb-2">$1</h3>')
            .replace(/^# (.+)$/gm, '<h2 class="text-accent font-bold text-lg mt-4 mb-2">$1</h2>')
            .replace(/^- (.+)$/gm, '<li class="ml-4 text-dim">$1</li>')
            .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 text-dim"><span class="text-accent">$1.</span> $2</li>')
            .replace(/\n/g, '<br>');
    },

    _copyDiagnoseResult() {
        const resultEl = document.getElementById('w-diagnose-result');
        if (!resultEl) return;
        const text = resultEl.innerText || resultEl.textContent;
        Utils.copy(text);
        UI.toast('已复制结果');
    },

    _clearDiagnoseResult() {
        const resultEl = document.getElementById('w-diagnose-result');
        if (resultEl) {
            resultEl.innerHTML = `<div class="text-center text-dim py-8">
                <i class="fa-solid fa-stethoscope text-3xl mb-3 opacity-30"></i>
                <div>点击上方按钮进行诊断或分析</div>
                <div class="text-[10px] mt-1">支持内容诊断、深度分析、总结概述、自定义SOLO提示词</div>
            </div>`;
        }
        UI.toast('已清空');
    }
};
