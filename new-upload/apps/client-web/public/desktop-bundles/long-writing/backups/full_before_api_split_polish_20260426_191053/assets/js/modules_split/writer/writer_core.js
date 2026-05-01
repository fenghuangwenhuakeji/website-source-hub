// ========== 长篇执笔 (旗舰版 · 深度绑定融合拆书) ==========
// 核心: 融合技法注入续写 ← 流水线数据驱动 ← 世界引擎RAG
Modules.writer = {
    currentChapterId: null,
    currentVolumeId: null,
    activeTab: 'info',
    _generating: false,
    // AI续写高级控制
    aiOpts: { length:'medium', styleKeep:true, ragInject:true, fusionInject:true, direction:'', flowMode: localStorage.getItem('writer_flow_mode') || 'hybrid' },
    _postProcessTimers: {},

    // ===== 获取融合拆书上下文 =====
    _getFusionContext() {
        const FB = Modules.fusion_book;
        if (!FB) return '';
        const allPr = FB._allPipelineResults || {};
        const pr = FB._pipelineResults || {};
        let ctx = '';
        // ★ 技法来源定位（不是内容模板）
        const primaryBook = FB._primaryBook || 'left';
        const primarySettings = FB._primarySettings;
        const primaryName = primarySettings?.bookName || (primaryBook === 'left' ? '左书' : '右书');
        const secondaryName = primaryBook === 'left' ? '右书' : '左书';
        ctx += `[技法来源] ${primaryName} + ${secondaryName} 的拆书融合技法精华。\n`;
        ctx += `[核心原则] 以下全是"去内容化"的通用写作技法模板，可套用到任何新故事。严禁复用原书的角色、情节、场景。\n\n`;
        const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
        const compare = (allPr.compare && allPr.compare.trim()) ? allPr.compare : (pr.compare || '');
        if (fusion) ctx += '[融合技法精华（通用模板）]\n' + fusion.slice(0, 3000) + '\n\n';
        if (compare) ctx += '[技法对比（去内容化）]\n' + compare.slice(0, 1500) + '\n\n';
        return ctx;
    },

    // ★ 获取循环级上下文（按当前章节所属循环精准注入）
    async _getCycleContext() {
        const ch = this.currentChapterId ? await DB.get('chapters', this.currentChapterId) : null;
        if(!ch || !ch.order) return '';
        const chapterNum = ch.order;
        // 优先从世界引擎拉取
        if(typeof Modules !== 'undefined' && Modules.world_engine) {
            const cycleCtx = await Modules.world_engine.getCycleContext(chapterNum, { maxLen: 3500 });
            if(cycleCtx) return cycleCtx;
        }
        // fallback：从融合拆书直接拉取
        const FB = Modules.fusion_book;
        if(FB && FB.getCycleFusionForChapter) {
            const cycleData = await FB.getCycleFusionForChapter(chapterNum - 1);
            if(cycleData && cycleData.fusion) {
                return `[循环级技法精华 | 第${cycleData.start}-${cycleData.end}章]\n${cycleData.fusion.slice(0, 2500)}\n\n`;
            }
        }
        return '';
    },

    // ★ 获取NEXUS四状态机上下文
    async _getNexusContext() {
        const ch = this.currentChapterId ? await DB.get('chapters', this.currentChapterId) : null;
        if(!ch || !ch.order) return { chr:'', wld:'', foe:'', emo:'' };
        if(typeof Modules !== 'undefined' && Modules.world_engine && Modules.world_engine.buildNexusSnapshot) {
            return await Modules.world_engine.buildNexusSnapshot(ch.order);
        }
        return { chr:'', wld:'', foe:'', emo:'' };
    },

    // ★ 构建NEXOS写作前缀（注入所有Prompt）
    async _buildNexusPrefix(compact = false) {
        const snapshot = await this._getNexusContext();
        const chap = this.currentChapterId ? await DB.get('chapters', this.currentChapterId) : null;
        const chapterNum = chap?.order || 0;

        if (compact) {
            // 精简模式：只保留最核心的铁律，大幅缩短 prompt
            let prefix = '[NEXUS OS v2.0 写作约束]\n';
            prefix += 'L1铁律:①第三人称有限 ②禁解释癖 ③禁烂俗比喻 ④禁虚词模糊 ⑤禁情绪标签(动作呈现) ⑥长句≤25字但长短交替(3-5短句后接1长句描写) ⑦章末钩子 ⑧对话用标准双引号""严禁「」 ⑨对话功能化 ⑩开篇必动作/对话 ⑪结局禁梦 ⑫时间线向前 ⑬禁OOC ⑭禁逻辑连词 ⑮段落≤5行 ⑯跨模块一致\n';
            prefix += 'P协议:物理替代·拒绝升华·沟通失效·细节碎片化·认知反差·逻辑自毁·感官钝化·权力不对等·时间扭曲·自我意识抹除\n';
            prefix += 'L2建议:每章≥2种感官·≥1日常小动作·短句≥30%·每2-3章1偶然事件\n';
            prefix += '输出禁令:正文不得出现内心OS、作者注、技法标签、读者期待、读者恐惧、反应涟漪、本章分析、括号里的写作意图。\n';
            if(snapshot.chr || snapshot.wld || snapshot.foe || snapshot.emo) {
                prefix += '四状态机:';
                if(snapshot.chr) prefix += `[CHR]${snapshot.chr.slice(0,80)} `;
                if(snapshot.wld) prefix += `[WLD]${snapshot.wld.slice(0,80)} `;
                if(snapshot.foe) prefix += `[FOE]${snapshot.foe.slice(0,80)} `;
                if(snapshot.emo) prefix += `[EMO]${snapshot.emo.slice(0,80)}`;
                prefix += '\n';
            }
            prefix += `第${chapterNum}章·字数2500-3500·章末必留钩子\n\n`;
            return prefix;
        }

        let prefix = '【超无穹·真值引擎·NEXUS OS v2.0 执行域】\n\n';

        // ★ 技法来源定位（不是内容模板）
        const FB = Modules.fusion_book;
        if (FB) {
            const primaryBook = FB._primaryBook || 'left';
            const primarySettings = FB._primarySettings;
            const primaryName = primarySettings?.bookName || (primaryBook === 'left' ? '左书' : '右书');
            const secondaryName = primaryBook === 'left' ? '右书' : '左书';
            prefix += `[技法来源] ${primaryName} + ${secondaryName} 的拆书融合技法精华。\n`;
            prefix += `[核心原则] 参考的是"写作技法"，不是"原书内容"。严禁复用任何原书的角色、情节、场景。目标是"同样的技法，完全不同的故事"。\n\n`;
        }

        // === M03 配置表 ===
        prefix += '=== M03 篇幅·受众·情绪配置 ===\n';
        prefix += '篇幅:长篇 | 黄金螺旋:拉5%→扯75%→放15%→收5% | 分卷18-28章/卷\n';
        prefix += '章字数:2500-3500 | 爽点间隔≤3章 | 反转密度:长篇≥3次/卷\n\n';

        // === M06 Segment 状态 ===
        prefix += `=== M06 正文管理状态 (第${chapterNum}章) ===\n`;
        prefix += '每个Segment必须携带: emotion_score(1-10) | hook_type(悬念/爽点/转折/情感/信息差) | tension_level(1-10)\n';
        prefix += 'characters_in_segment:出场角色 | world_rules_referenced:引用规则ID | foreshadowing_created/recycled:伏笔ID\n\n';

        // === L1 铁律 16条 ===
        prefix += '=== L1 行文铁律（16条·违反即重写）===\n';
        prefix += '1.视角锁死:第三人称有限 | 2.禁解释癖:"这不是…而是…"等 | 3.禁烂俗比喻:≤2/千字\n';
        prefix += '4.禁虚词模糊:"似乎/仿佛/好像" | 5.禁情绪标签:动作/环境/对话呈现 | 6.长句≤25字但长短交替:3-5短句后接1长句描写,禁止通篇电报体 | 6a.对话必须用标准双引号"",严禁「」\n';
        prefix += '7.章末必有钩子:未完成动作+意外信息 | 8.对话格式:标准双引号""独立成段，严禁「」 | 9.对话功能化:推剧情/塑性格/埋伏笔/造情绪\n';
        prefix += '10.开篇100字:必动作/对话 | 11.结局禁梦 | 12.时间线向前 | 13.行为一致:禁无理由OOC\n';
        prefix += '14.禁逻辑连词:"首先/其次/然后/最后" | 15.段落限制:≤5行(约60字) | 16.跨模块铁律\n\n';

        // === P1-P10 拟人化协议 ===
        prefix += '=== P1-P10 拟人化协议 ===\n';
        prefix += 'P1物理替代 P2拒绝升华 P3沟通失效 P4细节碎片化 P5认知反差 P6逻辑自毁\n';
        prefix += 'P7感官钝化 P8权力不对等 P9时间尺度扭曲 P10自我意识抹除\n\n';

        // === L2 建议 ===
        prefix += '=== L2 建议 ===\n';
        prefix += '每章≥2种感官 | 每章≥1个日常小动作 | ≤10字短句占30%+ | 长短句交替 | 每2-3章1个偶然事件\n\n';

        prefix += '=== 输出禁令 ===\n';
        prefix += '正文不得出现内心OS、作者注、技法标签、读者期待、读者恐惧、反应涟漪、本章分析、括号里的写作意图。拆书术语、读者协议、M06条款只能做隐性约束，不能露在正文里。\n\n';

        // === 四状态机快照 ===
        if(snapshot.chr || snapshot.wld || snapshot.foe || snapshot.emo) {
            prefix += '=== M02 四状态机当前快照 ===\n';
            if(snapshot.chr) prefix += `[CHR] ${snapshot.chr}\n`;
            if(snapshot.wld) prefix += `[WLD] ${snapshot.wld}\n`;
            if(snapshot.foe) prefix += `[FOE] ${snapshot.foe}\n`;
            if(snapshot.emo) prefix += `[EMO] ${snapshot.emo}\n`;
            prefix += '\n';
        }

        // === 8+2 维度提醒 ===
        prefix += '=== M04A 8+2 维度 ===\n';
        prefix += '钩子·爽点·人设·反转·情绪·冲突·信息差·金手指 + 开篇结构·商业化设计\n\n';

        // === M09 自检提醒 ===
        prefix += '=== M09 自检提醒 ===\n';
        prefix += '每章写完后自检:①铁律16条 ②四表一致 ③句长≤25字 ④短句≥30% ⑤每段≤5行 ⑥章末钩子\n\n';

        return prefix;
    },

    render: () => `
        <div class="flex h-full bg-[#08080a] overflow-hidden">
            <!-- Left: Chapter Nav (强化版) -->
            <div class="w-64 shrink-0 flex flex-col bg-[#111113] border-r border-white/5">
                <!-- 标题区 -->
                <div class="p-3 border-b border-white/5 bg-[#0d0d0f]">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-feather-pointed text-accent"></i>
                            <span class="font-bold text-white text-sm">长篇执笔</span>
                        </div>
                        <span class="text-[9px] text-dim bg-white/5 px-1.5 py-0.5 rounded">旗舰</span>
                    </div>
                    <!-- 卷级仪表盘 -->
                    <div class="grid grid-cols-3 gap-1.5 mb-2">
                        <div class="bg-white/5 rounded-lg p-1.5 text-center">
                            <div class="text-xs font-bold text-accent" id="w-vol-count">0</div>
                            <div class="text-[8px] text-dim">卷</div>
                        </div>
                        <div class="bg-white/5 rounded-lg p-1.5 text-center">
                            <div class="text-xs font-bold text-blue-400" id="w-chap-count">0</div>
                            <div class="text-[8px] text-dim">章</div>
                        </div>
                        <div class="bg-white/5 rounded-lg p-1.5 text-center">
                            <div class="text-xs font-bold text-green-400" id="w-total-words">0</div>
                            <div class="text-[8px] text-dim">万字</div>
                        </div>
                    </div>
                    <div class="h-1 bg-white/5 rounded-full overflow-hidden mb-2">
                        <div class="h-full bg-gradient-to-r from-accent to-blue-400 transition-all" id="w-global-progress" style="width:0%"></div>
                    </div>
                    <!-- 新建按钮 -->
                    <div class="flex gap-1">
                        <button class="btn btn-xs bg-accent/20 text-accent border-accent/30 flex-1" onclick="Modules.writer.newVol()"><i class="fa-solid fa-folder-plus mr-1"></i>卷</button>
                        <button class="btn btn-xs bg-blue-500/20 text-blue-400 border-blue-500/30 flex-1" onclick="Modules.writer.newChap()"><i class="fa-solid fa-file-plus mr-1"></i>章</button>
                        <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.writer.toggleBatchMode()" title="批量操作" id="w-batch-toggle"><i class="fa-solid fa-list-check"></i></button>
                    </div>
                </div>
                <!-- 筛选栏 -->
                <div class="px-3 py-2 border-b border-white/5 bg-[#0a0a0c] space-y-1.5">
                    <div class="relative">
                        <i class="fa-solid fa-search absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-dim"></i>
                        <input type="text" id="w-tree-search" placeholder="搜索卷/章..." class="w-full pl-6 pr-2 py-1 rounded bg-black/30 border border-white/10 text-[10px] text-white placeholder-dim focus:outline-none focus:border-accent/50" oninput="Modules.writer.loadTree()">
                    </div>
                    <div class="flex gap-1 flex-wrap" id="w-status-filters">
                        <button class="px-1.5 py-0.5 rounded text-[9px] border transition-all bg-accent/20 text-accent border-accent/30" onclick="Modules.writer.setFilter('all')" data-filter="all">全部</button>
                        <button class="px-1.5 py-0.5 rounded text-[9px] border transition-all bg-white/5 text-dim border-white/10" onclick="Modules.writer.setFilter('outline')" data-filter="outline" title="有细纲待写">🟡</button>
                        <button class="px-1.5 py-0.5 rounded text-[9px] border transition-all bg-white/5 text-dim border-white/10" onclick="Modules.writer.setFilter('draft')" data-filter="draft" title="草稿">🟠</button>
                        <button class="px-1.5 py-0.5 rounded text-[9px] border transition-all bg-white/5 text-dim border-white/10" onclick="Modules.writer.setFilter('done')" data-filter="done" title="已完成">🟢</button>
                        <button class="px-1.5 py-0.5 rounded text-[9px] border transition-all bg-white/5 text-dim border-white/10" onclick="Modules.writer.setFilter('polished')" data-filter="polished" title="已润色">🔵</button>
                    </div>
                    <!-- 批量操作栏（默认隐藏） -->
                    <div id="w-batch-bar" class="hidden flex items-center gap-1 pt-1 border-t border-white/5">
                        <span class="text-[9px] text-dim" id="w-batch-count">已选 0</span>
                        <div class="flex-1"></div>
                        <button class="btn btn-xs bg-white/5 text-dim text-[9px]" onclick="Modules.writer.batchMove()">移动</button>
                        <button class="btn btn-xs bg-white/5 text-dim text-[9px]" onclick="Modules.writer.batchSetStatus()">状态</button>
                        <button class="btn btn-xs bg-red-500/10 text-red-400 text-[9px]" onclick="Modules.writer.batchDelete()">删除</button>
                    </div>
                </div>
                <!-- 树形列表 -->
                <div class="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin" id="w-chap-list"></div>
                <!-- 底部批量写作 -->
                <div class="p-2 border-t border-white/5 bg-[#0d0d0f] space-y-1">
                    <button class="btn btn-xs bg-gradient-to-r from-red-600/20 to-amber-600/20 text-amber-300 border border-amber-500/20 w-full font-bold" onclick="Modules.writer.autoWriteCurrent()"><i class="fa-solid fa-pen-nib mr-1"></i>生成本章正文</button>
                    <button class="btn btn-xs bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-pink-300 border border-pink-500/20 w-full font-bold" onclick="Modules.writer.autoWriteAllEnhanced()"><i class="fa-solid fa-rocket mr-1"></i>一键写完指定卷章正文</button>
                </div>
            </div>

            <!-- Center: Editor -->
            <div class="flex-1 flex flex-col min-w-0 relative">
                <!-- 项目上下文条 -->
                <div id="w-project-context-bar" style="display:none"></div>
                <div class="h-12 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0 z-10">
                    <input id="w-title" class="bg-transparent border-none font-bold text-lg text-white w-1/3 focus:text-accent transition-colors placeholder-white/20" placeholder="章节标题...">
                    <div class="flex gap-2 items-center">
                        <!-- 章节状态 -->
                        <select id="w-chap-status" class="bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-accent/50" onchange="Modules.writer.saveStatus()" title="章节状态">
                            <option value="outline">🟡 有细纲待写</option>
                            <option value="draft">🟠 草稿</option>
                            <option value="done">🟢 已完成</option>
                            <option value="polished">🔵 已润色</option>
                        </select>
                        <!-- 字数进度 -->
                        <div class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/5">
                            <span id="w-stats" class="font-mono text-accent text-xs font-bold">0</span>
                            <span class="text-[9px] text-dim">/</span>
                            <input type="number" id="w-target-words" class="bg-transparent border-none text-[9px] text-dim font-mono w-8 text-center focus:text-white focus:outline-none" placeholder="目标" value="2500" onchange="Modules.writer._updateWordProgress()">
                            <span class="text-[9px] text-dim">字</span>
                        </div>
                        <div class="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-accent to-green-400 transition-all" id="w-word-progress" style="width:0%"></div>
                        </div>
                        <button class="btn btn-xs btn-primary" onclick="Modules.writer.save()"><i class="fa-solid fa-floppy-disk mr-1"></i>保存</button>
                        <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30" onclick="Modules.writer._syncToWorldEngine()" title="同步当前章节实体到世界引擎"><i class="fa-solid fa-atom mr-1"></i>同步世界</button>
                        <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.writer.exportToLibrary()"><i class="fa-solid fa-book-open mr-1"></i>存阅读</button>
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.world_engine?.exportAll?.()" title="导出世界引擎、细纲和正文"><i class="fa-solid fa-download mr-1"></i>导出工程</button>
                        <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30" onclick="Modules.writer._toggleReviewPanel()" title="AI智能审稿"><i class="fa-solid fa-glasses mr-1"></i>审稿</button>
                        <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.short.openPromptModal('writer_ai')"><i class="fa-solid fa-gear"></i></button>
                    </div>
                </div>
                <div class="flex-1 flex flex-col min-h-0 relative">
                    <!-- AI Action Bar -->
                    <div class="flex items-center gap-2 px-5 py-2 bg-[#0a0a0c] border-b border-white/5 shrink-0 flex-wrap">
                        <button class="btn btn-xs bg-accent/20 text-accent border-accent/30 hover:bg-accent hover:text-black" onclick="Modules.writer.aiWrite()" id="w-ai-btn"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>AI续写</button>
                        <button class="btn btn-xs bg-purple-500/20 text-purple-400 border-purple-500/30" onclick="Modules.writer.polish()"><i class="fa-solid fa-gem mr-1"></i>润色</button>
                        <button class="btn btn-xs bg-cyan-500/20 text-cyan-400 border-cyan-500/30" onclick="Modules.writer._loadContextTab()"><i class="fa-solid fa-rotate mr-1"></i>刷新上下文</button>
                        <select id="w-flow-mode" class="h-7 rounded-lg bg-black/30 border border-white/10 px-2 text-[10px] text-white outline-none" onchange="Modules.writer.setFlowMode(this.value)" title="写作和融合拆书的切换方式">
                            <option value="hybrid">写作+拆书</option>
                            <option value="write_then_split">写到一半拆书</option>
                            <option value="outline_first">先拆书再写</option>
                            <option value="continue_existing">导入续写</option>
                            <option value="fusion">用拆书技法写</option>
                            <option value="manual">自由手写</option>
                        </select>
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.writer.goFusionBook()" title="保存当前章节，去融合拆书找技法"><i class="fa-solid fa-book-open-reader mr-1"></i>去拆书</button>
                        <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.writer.fusionWrite()" title="用融合拆书技法续写当前章节"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>用拆书写</button>
                        <button class="btn btn-xs bg-emerald-600/20 text-emerald-400 border-emerald-600/30" onclick="Modules.writer.save({forcePostProcess:true})" title="保存当前正文，并同步章内细纲、实体和世界图谱"><i class="fa-solid fa-diagram-project mr-1"></i>保存同步</button>
                        <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30 hidden" id="w-stop-btn" onclick="Modules.writer._setGenerating(false)"><i class="fa-solid fa-stop mr-1"></i>停止</button>
                        <div class="flex-1"></div>
                        <!-- 续写控制 -->
                        <div class="flex items-center gap-1 bg-black/30 rounded-lg border border-white/5 p-0.5">
                            ${['short','medium','long'].map(l => {
                                const labels = {short:'短',medium:'中',long:'长'};
                                return `<button class="px-2 py-0.5 rounded text-[9px] font-bold transition-all w-ai-len-btn" data-len="${l}" onclick="Modules.writer.setAiLen('${l}')">${labels[l]}</button>`;
                            }).join('')}
                        </div>
                        <button class="px-2 py-0.5 rounded text-[9px] font-bold border transition-all w-ai-style-btn" onclick="Modules.writer.toggleStyleKeep()">风格锁</button>
                        <button class="px-2 py-0.5 rounded text-[9px] font-bold border transition-all w-ai-rag-btn" onclick="Modules.writer.toggleRagInject()">RAG</button>
                        <button class="px-2 py-0.5 rounded text-[9px] font-bold border transition-all w-ai-fusion-btn" onclick="Modules.writer.toggleFusionInject()">融合</button>
                        <span class="text-[9px] text-dim font-mono" id="w-save-status">就绪</span>
                    </div>
                    <!-- 续写方向 -->
                    <div class="px-5 py-1.5 bg-[#090909] border-b border-white/5 shrink-0">
                        <input id="w-ai-direction" class="w-full bg-transparent border-none text-[10px] text-dim focus:text-white focus:outline-none" placeholder="续写方向指引（可选）：如&quot;让主角发现真相&quot;、&quot;转入打斗场景&quot;...">
                    </div>
                    <textarea class="flex-1 w-full bg-transparent border-none p-8 text-base leading-loose text-gray-200 resize-none focus:outline-none font-serif placeholder-white/10" id="w-editor" placeholder="在此书写你的故事..." oninput="Modules.writer.onInput()"></textarea>
                    <!-- AI审稿面板 (绝对定位) -->
                    <div id="w-review-panel" class="hidden absolute right-0 top-0 w-80 h-full bg-[#0e0e10] border-l border-white/5 flex flex-col z-20 shadow-2xl">
                        <div class="shrink-0 p-3 border-b border-white/5 bg-gradient-to-r from-blue-900/20 to-transparent">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <i class="fa-solid fa-glasses text-blue-400"></i>
                                    <span class="font-bold text-white text-xs">AI 智能审稿</span>
                                </div>
                                <button class="text-dim hover:text-white text-xs" onclick="Modules.writer._toggleReviewPanel()"><i class="fa-solid fa-xmark"></i></button>
                            </div>
                        </div>
                        <div class="flex-1 overflow-y-auto p-3 space-y-3" id="w-review-content">
                            <div class="text-center py-8 text-dim text-xs">
                                <i class="fa-solid fa-glasses text-2xl mb-2 opacity-30"></i>
                                <div>点击"开始审稿"分析当前章节</div>
                            </div>
                        </div>
                        <div class="shrink-0 p-3 border-t border-white/5">
                            <button class="w-full btn bg-blue-600/20 text-blue-400 border-blue-600/30 hover:bg-blue-600/30 font-bold text-xs py-2 rounded-lg" onclick="Modules.writer._runReview()">
                                <i class="fa-solid fa-magnifying-glass-chart mr-1"></i>开始审稿
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Tabs Panel -->
            <div class="w-80 shrink-0 flex flex-col bg-[#111113] border-l border-white/5">
                <div class="flex border-b border-white/5 shrink-0 bg-[#0d0d0f]">
                    <button type="button" id="w-tab-btn-info" class="w-writer-tab-btn tab-btn flex-1 py-2 text-[9px] font-bold text-center cursor-pointer active flex flex-col items-center gap-0.5" onclick="Modules.writer.tab('info')"><i class="fa-solid fa-circle-info text-[11px]"></i>信息</button>
                    <button type="button" id="w-tab-btn-outline" class="w-writer-tab-btn tab-btn flex-1 py-2 text-[9px] font-bold text-center cursor-pointer flex flex-col items-center gap-0.5" onclick="Modules.writer.tab('outline')"><i class="fa-solid fa-list-check text-[11px]"></i>大纲</button>
                    <button type="button" id="w-tab-btn-context" class="w-writer-tab-btn tab-btn flex-1 py-2 text-[9px] font-bold text-center cursor-pointer flex flex-col items-center gap-0.5" onclick="Modules.writer.tab('context')"><i class="fa-solid fa-link text-[11px]"></i>上下文</button>
                    <button type="button" id="w-tab-btn-style" class="w-writer-tab-btn tab-btn flex-1 py-2 text-[9px] font-bold text-center cursor-pointer flex flex-col items-center gap-0.5" onclick="Modules.writer.tab('style')"><i class="fa-solid fa-palette text-[11px]"></i>文风</button>
                    <button type="button" id="w-tab-btn-assistant" class="w-writer-tab-btn tab-btn flex-1 py-2 text-[9px] font-bold text-center cursor-pointer flex flex-col items-center gap-0.5" onclick="Modules.writer.tab('assistant')"><i class="fa-solid fa-wand-magic-sparkles text-[11px]"></i>AI助手</button>
                    <button type="button" id="w-tab-btn-diagnose" class="w-writer-tab-btn tab-btn flex-1 py-2 text-[9px] font-bold text-center cursor-pointer flex flex-col items-center gap-0.5" onclick="Modules.writer.tab('diagnose')"><i class="fa-solid fa-stethoscope text-[11px]"></i>诊断</button>
                </div>
                <!-- Info Tab (增强版) -->
                <div id="w-tab-info" class="flex-1 flex flex-col p-3 gap-3 min-h-0 overflow-y-auto">
                    <div class="text-[10px] text-accent font-bold uppercase"><i class="fa-solid fa-circle-info mr-1"></i>章节信息</div>
                    <div class="bg-[#0a0a0c] rounded-xl border border-white/5 p-3 space-y-2">
                        <div class="flex items-center justify-between"><span class="text-[10px] text-dim">状态</span><span id="w-info-status" class="text-xs font-bold">-</span></div>
                        <div class="flex items-center justify-between"><span class="text-[10px] text-dim">字数</span><span id="w-info-words" class="text-xs font-mono">0 / 2500</span></div>
                        <div class="flex items-center justify-between">
                            <span class="text-[10px] text-dim">进度</span>
                            <div class="flex items-center gap-1.5 flex-1 ml-2">
                                <div class="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-accent to-green-400 transition-all" id="w-info-progress" style="width:0%"></div></div>
                                <span id="w-info-pct" class="text-[10px] font-mono text-dim">0%</span>
                            </div>
                        </div>
                        <div class="flex items-center justify-between"><span class="text-[10px] text-dim">创建时间</span><span id="w-info-created" class="text-[10px] text-dim font-mono">-</span></div>
                    </div>
                    <div class="bg-[#0a0a0c] rounded-xl border border-white/5 p-3 space-y-2">
                        <div class="text-[10px] text-dim font-bold">本卷统计</div>
                        <div class="grid grid-cols-3 gap-2 text-center">
                            <div><div class="text-sm font-bold text-white" id="w-info-vol-total">0</div><div class="text-[8px] text-dim">总章</div></div>
                            <div><div class="text-sm font-bold text-green-400" id="w-info-vol-done">0</div><div class="text-[8px] text-dim">完成</div></div>
                            <div><div class="text-sm font-bold text-accent" id="w-info-vol-words">0</div><div class="text-[8px] text-dim">总字</div></div>
                        </div>
                    </div>
                    <div class="bg-[#0a0a0c] rounded-xl border border-white/5 p-3 space-y-2">
                        <div class="flex items-center justify-between"><span class="text-[10px] text-dim font-bold">标签</span><button class="text-[9px] text-dim hover:text-white" onclick="Modules.writer._editTags()"><i class="fa-solid fa-pen"></i></button></div>
                        <div id="w-info-tags" class="flex flex-wrap gap-1"><span class="text-[9px] text-dim">暂无标签</span></div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.writer._quickStatus('outline')"><i class="fa-solid fa-circle mr-1" style="color:#fbbf24"></i>待写</button>
                        <button class="btn btn-xs bg-orange-600/20 text-orange-400 border-orange-600/30" onclick="Modules.writer._quickStatus('draft')"><i class="fa-solid fa-circle mr-1" style="color:#fb923c"></i>草稿</button>
                        <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.writer._quickStatus('done')"><i class="fa-solid fa-circle mr-1" style="color:#4ade80"></i>完成</button>
                        <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30" onclick="Modules.writer._quickStatus('polished')"><i class="fa-solid fa-circle mr-1" style="color:#60a5fa"></i>润色</button>
                    </div>
                    <div class="bg-[#0a0a0c] rounded-xl border border-white/5 p-3 space-y-2">
                        <div class="text-[10px] text-dim font-bold flex items-center gap-1"><i class="fa-solid fa-arrows-left-right"></i> 相邻章节</div>
                        <div id="w-info-neighbors" class="space-y-2"><div class="text-[9px] text-dim text-center py-2">请选择章节</div></div>
                    </div>
                </div>
                <!-- Outline Tab -->
                <div id="w-tab-outline" class="flex-1 hidden flex flex-col p-3 gap-2 min-h-0">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] text-accent font-bold uppercase">章节大纲</span>
                        <div class="flex gap-1">
                            <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.writer._aiRefineOutline()" title="AI细化当前大纲"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>细化大纲</button>
                            <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.writer.saveContent()">保存</button>
                        </div>
                    </div>
                    <textarea class="flex-1 bg-black/30 border border-white/5 rounded p-3 text-xs text-gray-300 resize-none font-mono leading-relaxed" id="w-outline" placeholder="本章大纲 / 剧情要点..."></textarea>
                    <!-- 大纲修改对比确认条 -->
                    <div id="w-outline-confirm" class="hidden shrink-0 bg-blue-900/10 border border-blue-500/20 rounded-lg p-2 space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-[10px] text-blue-400 font-bold"><i class="fa-solid fa-code-compare mr-1"></i>AI生成的新大纲</span>
                            <span class="text-[9px] text-dim" id="w-outline-diff">原0字 → 新0字</span>
                        </div>
                        <div class="max-h-[120px] overflow-y-auto bg-black/30 rounded p-2 text-[10px] text-gray-300 font-mono leading-relaxed" id="w-outline-preview"></div>
                        <div class="flex gap-2">
                            <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 flex-1 font-bold" onclick="Modules.writer._confirmOutlineReplace()"><i class="fa-solid fa-check mr-1"></i>采纳替换</button>
                            <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30 flex-1" onclick="Modules.writer._cancelOutlineReplace()"><i class="fa-solid fa-xmark mr-1"></i>放弃</button>
                        </div>
                    </div>
                    <div class="flex items-center gap-1">
                        <input id="w-outline-chat" class="input flex-1 h-7 text-xs bg-black/40 border-white/10" placeholder="对大纲提修改要求，如：增加一个反转 / 删掉陆明的戏份..." onkeydown="if(event.key==='Enter')Modules.writer._aiExpandOutline()">
                        <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.writer._aiExpandOutline()">修改</button>
                    </div>
                </div>
                <!-- Context Tab (融合+RAG合并) -->
                <div id="w-tab-context" class="flex-1 hidden flex flex-col p-0 min-h-0">
                    <div class="flex items-center justify-between px-3 py-2 bg-black/20 border-b border-white/5 shrink-0">
                        <span class="text-[10px] text-cyan-400 font-bold uppercase"><i class="fa-solid fa-link mr-1"></i>关联上下文</span>
                        <div class="flex gap-1">
                            <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.writer._clearContextTab()" title="清空"><i class="fa-solid fa-trash"></i></button>
                            <button class="btn btn-xs bg-cyan-500/20 text-cyan-400" onclick="Modules.writer._loadContextTab()"><i class="fa-solid fa-rotate mr-1"></i>刷新</button>
                        </div>
                    </div>
                    <div id="w-ctx-fusion-section" class="hidden shrink-0 border-b border-white/5">
                        <div class="px-3 py-1.5 bg-amber-900/10 border-b border-amber-500/10 shrink-0 flex items-center justify-between">
                            <span class="text-[10px] text-amber-400 font-bold"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>融合技法</span>
                            <span id="w-ctx-fusion-len" class="text-[9px] text-dim">0字</span>
                        </div>
                        <div class="max-h-24 overflow-y-auto p-2 text-[10px] text-amber-300/80 font-mono leading-relaxed" id="w-ctx-fusion-content"></div>
                    </div>
                    <div class="px-3 py-2 bg-[#0a0a0c] border-b border-white/5 shrink-0">
                        <div class="grid grid-cols-3 gap-2 text-center">
                            <div class="p-1.5 bg-black/20 rounded"><div class="text-sm font-bold text-cyan-400" id="w-ctx-entities">0</div><div class="text-[8px] text-dim">关联实体</div></div>
                            <div class="p-1.5 bg-black/20 rounded"><div class="text-sm font-bold text-amber-400" id="w-ctx-chapters">0</div><div class="text-[8px] text-dim">关联章节</div></div>
                            <div class="p-1.5 bg-black/20 rounded"><div class="text-sm font-bold text-green-400" id="w-ctx-world">0</div><div class="text-[8px] text-dim">世界观</div></div>
                        </div>
                    </div>
                    <div class="px-3 py-2 bg-[#0a0a0c] border-b border-white/5 shrink-0 space-y-2">
                        <div class="flex gap-1">
                            <input id="w-ctx-search" class="input flex-1 h-7 text-xs bg-black/40 border-white/10" placeholder="搜索关联内容..." onkeydown="if(event.key==='Enter')Modules.writer._searchContext()">
                            <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.writer._searchContext()"><i class="fa-solid fa-search"></i></button>
                        </div>
                        <div class="flex gap-1 flex-wrap">
                            <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30 flex-1" onclick="Modules.writer._ctxFilter('entities')">实体</button>
                            <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 flex-1" onclick="Modules.writer._ctxFilter('chapters')">章节</button>
                            <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 flex-1" onclick="Modules.writer._ctxFilter('world')">世界</button>
                            <button class="btn btn-xs bg-white/5 text-dim flex-1" onclick="Modules.writer._ctxFilter('all')">全部</button>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto p-2 space-y-2 min-h-0" id="w-ctx-results">
                        <div class="text-center text-dim text-xs py-4"><i class="fa-solid fa-link text-2xl mb-2 opacity-30"></i><div>点击刷新获取关联上下文</div><div class="text-[10px] mt-1">自动关联当前章节的实体、前后文、世界观</div></div>
                    </div>
                    <div class="p-2 border-t border-white/5 shrink-0 space-y-1">
                        <button class="btn btn-xs bg-gradient-to-r from-cyan-600/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30 w-full font-bold" onclick="Modules.writer._injectContextToPrompt()"><i class="fa-solid fa-syringe mr-1"></i>注入关联上下文到续写</button>
                        <div class="flex gap-1">
                            <button class="btn btn-xs bg-white/5 text-dim flex-1" onclick="App.nav('world_engine')"><i class="fa-solid fa-atom mr-1"></i>世界引擎</button>
                            <button class="btn btn-xs bg-white/5 text-dim flex-1" onclick="App.nav('fusion_book')"><i class="fa-solid fa-book-open-reader mr-1"></i>融合拆书</button>
                        </div>
                    </div>
                </div>
                <!-- Style Tab (只保留文风提取) -->
                <div id="w-tab-style" class="flex-1 hidden flex flex-col p-3 gap-2 min-h-0 overflow-y-auto scrollbar-thin">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] text-emerald-400 font-bold uppercase"><i class="fa-solid fa-palette mr-1"></i>文风提取</span>
                        <div class="flex gap-1">
                            <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.writer.openStylePromptModal()" title="配置提取提示词"><i class="fa-solid fa-gear"></i></button>
                            <button class="btn btn-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30" onclick="Modules.writer.extractStyle()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>提取</button>
                            <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.writer.clearStyleExtract()">清空</button>
                        </div>
                    </div>
                    <div class="text-[9px] text-dim leading-relaxed p-2 bg-emerald-500/5 rounded border border-emerald-500/10"><i class="fa-solid fa-info-circle text-emerald-400 mr-1"></i>粘贴一段目标风格的原文，AI将提取文风特征，<b class="text-emerald-400">全局应用于续写和润色</b>。</div>
                    <div class="space-y-2">
                        <div><div class="text-[9px] text-dim mb-1 flex items-center gap-1"><i class="fa-solid fa-file-lines"></i>原文样例</div><textarea class="w-full bg-black/30 border border-emerald-500/20 rounded p-2 text-xs text-gray-300 resize-none font-mono min-h-[120px]" id="w-style-source" placeholder="粘贴一段你想要模仿的原文样例..."></textarea></div>
                        <div><div class="text-[9px] text-dim mb-1 flex items-center gap-1"><i class="fa-solid fa-sparkles text-emerald-400"></i>提取的文风</div><textarea class="w-full bg-black/30 border border-emerald-500/30 rounded p-2 text-xs text-emerald-300 resize-none font-mono min-h-[140px]" id="w-style-extracted" placeholder="提取的文风特征将显示在这里..."></textarea></div>
                    </div>
                </div>
                <!-- Assistant Tab (AI助手) -->
                <div id="w-tab-assistant" class="flex-1 hidden flex flex-col p-0 min-h-0">
                    <div class="flex items-center justify-between px-3 py-2 bg-black/20 border-b border-white/5 shrink-0">
                        <span class="text-[10px] text-accent font-bold uppercase"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>AI 助手</span>
                        <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.writer._assistantClear()" title="清空"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    <div id="w-assist-selection-box" class="hidden px-3 py-2 bg-amber-500/10 border-b border-amber-500/20 shrink-0">
                        <div class="flex items-center justify-between mb-1"><span class="text-[9px] text-amber-400 font-bold"><i class="fa-solid fa-highlighter mr-1"></i>已选中</span><span class="text-[9px] text-dim" id="w-assist-sel-len">0字</span></div>
                        <div id="w-assist-selection" class="text-[10px] text-dim max-h-20 overflow-y-auto bg-black/20 rounded p-1.5 font-mono leading-relaxed"></div>
                    </div>
                    <div class="px-3 py-2 bg-[#0a0a0c] border-b border-white/5 shrink-0">
                        <div class="text-[9px] text-dim font-bold mb-1.5">选择助手</div>
                        <div class="grid grid-cols-3 gap-1.5">
                            <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.writer._runAssistant('polish')"><i class="fa-solid fa-gem mr-1"></i>润色</button>
                            <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.writer._runAssistant('expand')"><i class="fa-solid fa-expand mr-1"></i>拓展</button>
                            <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.writer._runAssistant('continue')"><i class="fa-solid fa-play mr-1"></i>续写</button>
                            <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.writer._runAssistant('trim')"><i class="fa-solid fa-scissors mr-1"></i>精简</button>
                            <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30" onclick="Modules.writer._runAssistant('rewrite')"><i class="fa-solid fa-pen-to-square mr-1"></i>改写</button>
                            <button class="btn btn-xs bg-white/5 text-dim border-white/10" onclick="Modules.writer._runAssistant('custom')"><i class="fa-solid fa-sliders mr-1"></i>自定义</button>
                        </div>
                    </div>
                    <div id="w-assist-log" class="flex-1 bg-black/20 p-2 overflow-y-auto text-xs space-y-2 min-h-0"></div>
                    <div class="flex gap-2 p-3 border-t border-white/5 shrink-0 bg-[#0a0a0c]">
                        <textarea id="w-assist-in" class="input flex-1 h-12 text-xs bg-black/40 border-white/10 resize-none" placeholder="自定义指令..." onkeydown="if(event.key==='Enter' && !event.shiftKey){event.preventDefault();Modules.writer._runAssistant('custom')}"></textarea>
                        <button class="btn btn-primary px-3" onclick="Modules.writer._runAssistant('custom')"><i class="fa-solid fa-paper-plane"></i></button>
                    </div>
                </div>
                <!-- Diagnose Tab (增强版) -->
                <div id="w-tab-diagnose" class="flex-1 hidden flex flex-col p-3 gap-2 min-h-0">
                    <div class="flex items-center justify-between"><span class="text-[10px] text-red-400 font-bold uppercase"><i class="fa-solid fa-stethoscope mr-1"></i>AI 诊断助手</span></div>
                    <button class="btn btn-sm bg-gradient-to-r from-red-600/20 to-rose-600/20 text-rose-400 border-red-500/30 font-bold h-9" onclick="Modules.writer._smartDiagnose()"><i class="fa-solid fa-stethoscope mr-1.5"></i>一键诊断当前章节</button>
                    <button class="btn btn-sm bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-400 border-purple-500/30 font-bold h-9" onclick="Modules.writer._checkConsistency()"><i class="fa-solid fa-link mr-1.5"></i>上下文一致性检测</button>
                    <div class="text-[10px] text-dim font-bold uppercase">快捷分析</div>
                    <div class="grid grid-cols-3 gap-1 shrink-0">
                        <button class="btn btn-xs bg-white/5 text-dim hover:bg-amber-600/20 hover:text-amber-400 border border-white/5" onclick="Modules.writer.analyzeContent()">深度分析</button>
                        <button class="btn btn-xs bg-white/5 text-dim hover:bg-cyan-600/20 hover:text-cyan-400 border border-white/5" onclick="Modules.writer.summarizeContent()">总结概述</button>
                        <button class="btn btn-xs bg-white/5 text-dim hover:bg-green-600/20 hover:text-green-400 border border-white/5" onclick="Modules.writer.diagnoseContent()">内容诊断</button>
                    </div>
                    <div class="text-[10px] text-dim font-bold uppercase mt-1">v3.0 新增工具</div>
                    <div class="grid grid-cols-2 gap-1 shrink-0">
                        <button class="btn btn-xs bg-white/5 text-dim hover:bg-purple-600/20 hover:text-purple-400 border border-white/5" onclick="Modules.writer._analyzeRhythm()"><i class="fa-solid fa-chart-line mr-1"></i>节奏可视化</button>
                        <button class="btn btn-xs bg-white/5 text-dim hover:bg-rose-600/20 hover:text-rose-400 border border-white/5" onclick="Modules.writer._checkCharacterConsistency()"><i class="fa-solid fa-user-shield mr-1"></i>人设深度检测</button>
                    </div>
                    <div class="text-[10px] text-dim font-bold uppercase mt-1">自定义需求</div>
                    <div class="flex gap-1.5 shrink-0">
                        <input id="w-diagnose-custom" class="input flex-1 h-8 text-xs bg-black/30 border-white/10" placeholder="例如：分析节奏、检查爽点..." onkeydown="if(event.key==='Enter')Modules.writer._customDiagnose()">
                        <button class="btn btn-xs btn-primary px-3" onclick="Modules.writer._customDiagnose()"><i class="fa-solid fa-paper-plane"></i></button>
                    </div>
                    <div class="flex-1 overflow-y-auto bg-black/30 border border-white/5 rounded p-3 text-xs text-gray-300 leading-relaxed" id="w-diagnose-result">
                        <div class="text-center text-dim py-8"><i class="fa-solid fa-stethoscope text-3xl mb-3 opacity-30"></i><div>点击「一键诊断」或「一致性检测」</div><div class="text-[10px] mt-1">AI 会自动分析正文质量与前后一致性</div></div>
                    </div>
                    <div class="flex gap-1 shrink-0">
                        <button class="btn btn-xs bg-white/5 text-dim flex-1" onclick="Modules.writer._copyDiagnoseResult()"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                        <button class="btn btn-xs bg-white/5 text-dim flex-1" onclick="Modules.writer._clearDiagnoseResult()"><i class="fa-solid fa-trash mr-1"></i>清空</button>
                    </div>
                </div>
            </div>
        </div>
    `
    ,

    // ===== Init & Tree =====
    async init() {
        await this.loadTree();
        this.loadRules();
        this._refreshAiControls();
        if (!this.currentChapterId) {
            const returnId = localStorage.getItem('writer_return_chapter');
            if (returnId) {
                const ret = await DB.get('chapters', returnId);
                if (ret) {
                    await this.load(returnId);
                    localStorage.removeItem('writer_return_chapter');
                }
            }
            const chaps = (await DB.getAll('chapters') || []).sort((a,b) => (a.order||0) - (b.order||0));
            if (!this.currentChapterId && chaps.length > 0) {
                const withContent = chaps.find(c => c.content && c.content.trim());
                this.load(withContent ? withContent.id : chaps[0].id);
            }
        }
        // ★ 项目感知：加载活跃项目上下文
        await this._loadProjectContext();
    },

    // ★ 自动加载活跃项目的写作上下文
    async _loadProjectContext() {
        try {
            const proj = await GenesisCore.getActiveProject();
            if (!proj) return;
            const modeLabels = { phoenix: '从零写一本', import: '导入续写', fusion: '拆书融合' };
            const modeColors = { phoenix: 'orange', import: 'amber', fusion: 'emerald' };
            const color = modeColors[proj.mode] || 'gray';

            // 在编辑器顶部显示项目信息条
            const bar = document.getElementById('w-project-context-bar');
            if (bar) {
                bar.style.display = 'block';
                bar.innerHTML = `
                    <div class="flex items-center justify-between px-3 py-1.5 bg-${color}-500/10 border-b border-${color}-500/20">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-bolt text-${color}-400 text-[10px]"></i>
                            <span class="text-[11px] font-bold text-white">${proj.name}</span>
                            <span class="text-[9px] px-1 py-0.5 rounded bg-${color}-500/20 text-${color}-400 border border-${color}-500/30">${modeLabels[proj.mode] || proj.mode}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <button class="text-[9px] text-dim hover:text-white" onclick="Modules.writer._injectProjectContext()" title="注入项目上下文到当前章节">
                                <i class="fa-solid fa-syringe mr-1"></i>注入上下文
                            </button>
                        </div>
                    </div>
                `;
            }
        } catch(e) {
            console.warn('[Writer] 加载项目上下文失败:', e);
        }
    },

    // ★ 手动注入项目上下文到当前大纲
    async _injectProjectContext() {
        try {
            const proj = await GenesisCore.getActiveProject();
            if (!proj) return UI.toast('没有活跃项目');
            const ctx = await GenesisCore.buildWriterContext(proj.id, { maxLen: 3000 });
            if (!ctx) return UI.toast('没有可用的项目上下文');
            const ol = document.getElementById('w-outline');
            if (ol) {
                const marker = '\n\n【项目上下文注入】\n';
                ol.value = (ol.value || '') + marker + ctx;
                UI.toast('项目上下文已注入大纲');
            }
        } catch(e) {
            UI.toast('注入失败: ' + e.message, 'error');
        }
    },
    _refreshAiControls() {
        const o = Modules.writer.aiOpts;
        document.querySelectorAll('.w-ai-len-btn').forEach(b => {
            if(b.dataset.len === o.length) b.className = 'px-2 py-0.5 rounded text-[9px] font-bold transition-all bg-accent/20 text-accent w-ai-len-btn';
            else b.className = 'px-2 py-0.5 rounded text-[9px] font-bold transition-all text-dim hover:text-white w-ai-len-btn';
            b.dataset.len = b.dataset.len;
        });
        document.querySelectorAll('.w-ai-style-btn').forEach(b => {
            b.className = `px-2 py-0.5 rounded text-[9px] font-bold border transition-all w-ai-style-btn ${o.styleKeep ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' : 'bg-black/30 text-dim border-white/5'}`;
        });
        document.querySelectorAll('.w-ai-rag-btn').forEach(b => {
            b.className = `px-2 py-0.5 rounded text-[9px] font-bold border transition-all w-ai-rag-btn ${o.ragInject ? 'bg-green-500/15 text-green-400 border-green-500/20' : 'bg-black/30 text-dim border-white/5'}`;
        });
        document.querySelectorAll('.w-ai-fusion-btn').forEach(b => {
            b.className = `px-2 py-0.5 rounded text-[9px] font-bold border transition-all w-ai-fusion-btn ${o.fusionInject ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' : 'bg-black/30 text-dim border-white/5'}`;
        });
        const flow = document.getElementById('w-flow-mode');
        if (flow) flow.value = o.flowMode || localStorage.getItem('writer_flow_mode') || 'hybrid';
    },
    setAiLen(l) { this.aiOpts.length = l; this._refreshAiControls(); },
    toggleStyleKeep() { this.aiOpts.styleKeep = !this.aiOpts.styleKeep; this._refreshAiControls(); },
    toggleRagInject() { this.aiOpts.ragInject = !this.aiOpts.ragInject; this._refreshAiControls(); },
    toggleFusionInject() { this.aiOpts.fusionInject = !this.aiOpts.fusionInject; this._refreshAiControls(); },
    setFlowMode(mode) {
        this.aiOpts.flowMode = mode || 'hybrid';
        localStorage.setItem('writer_flow_mode', this.aiOpts.flowMode);
        this._refreshAiControls();
        const labels = {
            hybrid: '写作+拆书',
            write_then_split: '写到一半拆书',
            outline_first: '先拆书再写',
            continue_existing: '导入续写',
            fusion: '用拆书技法写',
            manual: '自由手写'
        };
        UI.toast(`当前模式：${labels[this.aiOpts.flowMode] || '写作+拆书'}`);
    },
    async goFusionBook() {
        try {
            if (this.currentChapterId) await this.save({ silent: true, skipPostProcess: true });
        } catch(e) {
            console.warn('[Writer] 去拆书前保存失败:', e);
        }
        localStorage.setItem('writer_flow_mode', 'write_then_split');
        if (this.currentChapterId) localStorage.setItem('writer_return_chapter', this.currentChapterId);
        UI.toast('去融合拆书找技法；拆到一半也能回来继续写');
        App.nav('fusion_book');
    },
    _shouldAutoPostProcess(chap, opts = {}) {
        if (opts.forcePostProcess) return true;
        const mode = this.aiOpts.flowMode || localStorage.getItem('writer_flow_mode') || 'hybrid';
        if (mode === 'manual') return false;
        const content = chap?.content || '';
        return content.trim().length >= 300;
    },
    _schedulePostWriteProcessing(chapterId, opts = {}) {
        if (!chapterId) return;
        clearTimeout(this._postProcessTimers[chapterId]);
        this._postProcessTimers[chapterId] = setTimeout(() => {
            this._runPostWriteProcessing(chapterId, opts).catch(e => {
                console.warn('[Writer] 写作同步失败:', e);
                const st = document.getElementById('w-save-status');
                if (st) st.textContent = '已保存 · 后台同步失败';
                if (typeof UI !== 'undefined') UI.toast('已保存，但后台同步失败：' + (e.message || '未知错误'), 'error');
            });
        }, opts.delay || 300);
    },
    async _runPostWriteProcessing(chapterId, opts = {}) {
        const chap = await DB.get('chapters', chapterId);
        if (!chap || !(chap.content || '').trim()) return;
        const content = chap.content || '';
        if (content.length < 300 && !opts.forcePostProcess) return;
        const st = document.getElementById('w-save-status');
        const flowLabel = this._flowLabel(this.aiOpts.flowMode || localStorage.getItem('writer_flow_mode') || 'hybrid');
        if (st) st.textContent = `${flowLabel} · 正在从正文+细纲反推章内细纲...`;
        if (typeof UI !== 'undefined') UI.toast(`${flowLabel}：正在反推细纲`, 'info');
        const outline = this._autoExtractOutline ? await this._autoExtractOutline(content, chapterId) : null;
        if (st) st.textContent = `${flowLabel} · 正在从正文+细纲提取实体...`;
        if (typeof UI !== 'undefined') UI.toast(`${flowLabel}：正在提取实体`, 'info');
        if (this._autoExtractEntities) await this._autoExtractEntities(content, chapterId);
        if (typeof RAGSystem !== 'undefined') {
            try { await RAGSystem.addDocument(`第${chap.order||''}章: ${chap.title}`, content, 'chapter', { chapterId: chap.id }); } catch(e) {}
        }
        if (typeof GenesisCore !== 'undefined' && GenesisCore.refreshStats) {
            const proj = await GenesisCore.getActiveProject();
            if (proj) await GenesisCore.refreshStats(proj.id);
        }
        if (st) st.textContent = `${flowLabel} · 细纲&实体已同步`;
        if (typeof UI !== 'undefined') UI.toast(`${flowLabel}：细纲和实体已同步`, 'success');
        if (opts.forcePostProcess && outline && this.currentChapterId === chapterId) this.tab('outline');
    },
    _flowLabel(mode) {
        return ({
            hybrid: '写作+拆书',
            write_then_split: '写到一半拆书',
            outline_first: '先拆书再写',
            continue_existing: '导入续写',
            fusion: '用拆书技法写',
            manual: '自由手写'
        })[mode] || '写作+拆书';
    },
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
    // ===== Load & Save =====
    async load(id) {
        const chap = await DB.get('chapters', id);
        if (!chap) return;
        this.currentChapterId = id;
        this.currentVolumeId = chap.volumeId || this.currentVolumeId;
        const ed = document.getElementById('w-editor'); 
        if (ed) {
            ed.value = chap.content || '';
            // 绑定选中事件到AI助手
            ed.onmouseup = () => Modules.writer._updateAssistantSelection();
            ed.onkeyup = () => Modules.writer._updateAssistantSelection();
        }
        const ti = document.getElementById('w-title'); if (ti) ti.value = chap.title || '';
        const ol = document.getElementById('w-outline'); if (ol) ol.value = chap.outline || '';
        // 加载状态和目标字数
        const stEl = document.getElementById('w-chap-status');
        if (stEl) stEl.value = chap.status || 'outline';
        const twEl = document.getElementById('w-target-words');
        if (twEl) twEl.value = chap.targetWords || 2500;
        this._updateWordProgress();
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
    async save(opts = {}) {
        if (!this.currentChapterId) return UI.toast('请先选择或新建章节');
        const chap = await DB.get('chapters', this.currentChapterId);
        if (!chap) return;
        chap.content = (document.getElementById('w-editor') || {}).value || '';
        chap.title = (document.getElementById('w-title') || {}).value || chap.title;
        chap.outline = (document.getElementById('w-outline') || {}).value || '';
        chap.status = (document.getElementById('w-chap-status') || {}).value || chap.status || 'outline';
        chap.targetWords = parseInt((document.getElementById('w-target-words') || {}).value) || chap.targetWords || 2500;
        chap.updatedAt = Date.now();
        await DB.put('chapters', chap);
        const st = document.getElementById('w-save-status');
        if (st) st.textContent = '已保存 ' + new Date().toLocaleTimeString();
        if (!opts.silent) UI.toast('已保存', 'success');
        this._updateWordProgress();
        this.loadTree();
        if (!opts.skipPostProcess && this._shouldAutoPostProcess(chap, opts)) {
            if (st) st.textContent = '已保存 · 后台同步中';
            this._schedulePostWriteProcessing(chap.id, { forcePostProcess: !!opts.forcePostProcess });
        }
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
        this._updateWordProgress();
    },

    // ===== Tabs =====
    tab(t) {
        ['info','outline','context','style','assistant','diagnose'].forEach(x => {
            const el = document.getElementById('w-tab-' + x);
            const btn = document.getElementById('w-tab-btn-' + x);
            const active = x === t;
            if (el) {
                el.classList.toggle('hidden', !active);
                el.style.display = active ? '' : 'none';
            }
            if (btn) btn.classList.toggle('active', active);
        });
        this.activeTab = t;
        if (t === 'context') this._loadContextTab();
        if (t === 'info') this._refreshInfoTab();
        if (t === 'style') this._loadStyleTab();
    },
    updateIO(input, output) {
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
        el.value = ctx || '暂无融合拆书弹药。\n\n可以去「融合拆书」拆一轮拿弹药；拆完不用自动写书，回到执笔台继续写、续、改都行。';
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

    _treeFilter: 'all',
    _batchMode: false,
    _batchSelected: new Set(),

    // ═══════════════════════════════════════════════════════════════
    // ★ 正文生成后自动处理：提取细纲 + 提取实体到世界引擎
    // ═══════════════════════════════════════════════════════════════

    // 从正文自动提取细纲（反推大纲）
    async _autoExtractOutline(content, chapterId) {
        if (!content || content.length < 100) return;
        const chap = chapterId ? await DB.get('chapters', chapterId) : null;
        if (!chap) return;
        const existingOutline = (chap.outline || '').trim();
        
        const prompt = `请从以下小说正文中反推并优化「章内分部分执行级细纲」。

【章节标题】${chap.title}
【已有章节细纲】
${existingOutline ? existingOutline.slice(0, 3000) : '（无）'}

【正文】
${content.slice(0, 5000)}

【输出格式】
【章内分部分细纲】
#### 第1部分：部分标题
- 情节功能：承接/铺垫/转折/爆发/收束
- 核心动作：人物具体做了什么，不写抽象情绪
- 阻力与代价：本部分的外部阻力或选择代价
- 人物变化：角色状态发生了什么可见变化
- 世界规则：本部分涉及的规则、限制、禁忌或代价
- 伏笔/钩子：新增、强化或回收了什么
- 实体线索：人物、地点、物品、势力、规则

【要求】
1. 按真实剧情顺序拆成3-8个部分，不要按自然段机械拆
2. 细纲服务后续续写和世界引擎，不要写主题分析
3. 保留正文里已经发生的事实，不得改剧情
4. 每个部分必须能被执笔台直接继续写
5. 最后补一行：章末钩子：具体钩子内容
6. 只输出细纲，不要解释。`;

        try {
            let outline = '';
            await AI.generate(prompt, { apiType: 'parse', module: 'writer', max_tokens: 2048, temperature: 0.5 }, c => { outline += c; });
            if (outline && outline.length > 50) {
                // 保存到章节outline字段（覆盖原细纲）
                chap.outline = outline.trim();
                chap.outlineSource = 'writer_auto_optimized';
                chap.outlineLevel = 'chapter_parts';
                chap.updatedAt = Date.now();
                await DB.put('chapters', chap);
                if (Modules.world_engine?.rebuildLayeredGraphs) {
                    await Modules.world_engine.rebuildLayeredGraphs('writer_outline', { silent: true });
                }
                // 如果当前正在查看该章节，更新textarea
                if (this.currentChapterId === chapterId) {
                    const ol = document.getElementById('w-outline');
                    if (ol) ol.value = chap.outline;
                }
                console.log(`[Writer] 第${chap.order}章细纲自动提取完成 (${outline.length}字)`);
                return outline;
            }
        } catch(e) {
            console.error('[Writer] 自动提取细纲失败:', e);
        }
    },

    // 从正文自动提取实体并保存到世界引擎（按章节/循环关联）
    async _autoExtractEntities(content, chapterId) {
        if (!content || content.length < 100) return;
        const chap = chapterId ? await DB.get('chapters', chapterId) : null;
        if (!chap) return;
        
        // 获取已有实体名称，避免重复提取
        await Modules.world_engine._ensureCache();
        const existingNames = (Modules.world_engine._cachedEntities || [])
            .filter(e => !e.id.startsWith('world_'))
            .map(e => e.name);
        const existingHint = existingNames.length ? `\n【已有实体(请优先关联而非新建)】\n${existingNames.join('、')}` : '';
        
        const optimizedOutline = (chap.outline || '').trim();
        const volumeId = Modules.world_engine._getChapterVolumeId ? Modules.world_engine._getChapterVolumeId(chap) : (chap.volumeId || null);

        // 获取章节所属循环
        let cycleId = null;
        if (chap.order && Modules.world_engine.getCycleIdForChapter) {
            const cycleInfo = Modules.world_engine.getCycleIdForChapter(chap.order);
            if (cycleInfo) cycleId = cycleInfo.cycleId;
        }

        const prompt = `你是一个专业的小说知识图谱实体提取引擎。请同时读取「优化后的章内细纲」和「章节正文」，提取本章会影响后续长篇一致性的实体。

【章节标题】${chap.title}
【卷/循环归属】
卷图谱：${volumeId || '未分卷'}
循环图谱：${cycleId || '无'}

【优化后的章内细纲】
${optimizedOutline ? optimizedOutline.slice(0, 3000) : '（本章暂无细纲，只能从正文提取）'}

【章节正文】
${content.slice(0, 4000)}${existingHint}

【提取规则】
1. 实体类型仅限：人物、物品、地点、势力、魔法、规则、伏笔
2. 每个人物必须提取：姓名、身份、当前状态、本章中的关键行为
3. 每个物品必须提取：名称、功能、与剧情的关联
4. 每个地点必须提取：名称、环境特征、在剧情中的作用
5. 势力：组织/门派/阵营名称及立场
6. 魔法/规则：功法名称、世界规则、特殊能力
7. 伏笔：埋下的未解之谜或后续可能展开的信息
8. 如果实体已在「已有实体」列表中，只输出名称和本章新信息，不要重复描述
9. 必须结合细纲和正文：细纲用于识别结构、伏笔、规则，正文用于确认事实和动作
10. 不确定的内容必须在desc里标注“推断”，不能当成已发生事实
11. 输出严格JSON数组格式：
[
  {"name":"实体名","type":"人物/物品/地点/势力/魔法/规则/伏笔","desc":"详细描述（包含本章关键行为和状态）","relations":"关联的其他实体名，逗号分隔"}
]

只输出JSON数组，不要任何其他文字。`;

        try {
            let jsonStr = '';
            await AI.generate(prompt, { apiType: 'parse', module: 'writer', max_tokens: 3000, temperature: 0.25 }, c => { jsonStr += c; });
            
            // 健壮地清理JSON字符串
            let cleanRaw = jsonStr.trim().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
            const start = cleanRaw.indexOf('[');
            const end = cleanRaw.lastIndexOf(']');
            if (start === -1 || end <= start) return;
            
            const entities = JSON.parse(cleanRaw.slice(start, end + 1));
            if (!Array.isArray(entities) || entities.length === 0) return;

            let added = 0, updated = 0;
            for (const ent of entities) {
                if (!ent.name || !ent.type) continue;
                
                // 查找是否已存在同名实体
                const existing = (Modules.world_engine._cachedEntities || [])
                    .find(e => e.name === ent.name && !e.id.startsWith('world_'));
                
                let id, chapters = [], cycles = [], volumes = [], source = 'auto_extract';
                
                // 处理relations字段（可能是字符串或数组）
                let relations = [];
                if (ent.relations) {
                    if (Array.isArray(ent.relations)) relations = ent.relations.filter(Boolean);
                    else if (typeof ent.relations === 'string') relations = ent.relations.split(',').map(s => s.trim()).filter(Boolean);
                }
                
                if (existing) {
                    // 更新已有实体
                    id = existing.id;
                    chapters = existing.chapters || [];
                    cycles = existing.cycles || [];
                    volumes = existing.volumes || [];
                    source = existing.source || source;
                    if (!chapters.includes(chapterId)) chapters.push(chapterId);
                    if (cycleId && !cycles.includes(cycleId)) cycles.push(cycleId);
                    if (volumeId && !volumes.includes(volumeId)) volumes.push(volumeId);
                    
                    // 合并描述：追加本章新信息
                    const newDesc = existing.desc ? `${existing.desc}\n\n[第${chap.order}章更新]\n${ent.desc}` : ent.desc;
                    // 合并relations
                    const existingRels = existing.relations || [];
                    relations = [...new Set([...existingRels, ...relations])];
                    
                    await DB.put('entities', {
                        ...existing,
                        desc: newDesc,
                        relations,
                        chapters,
                        cycles,
                        volumes,
                        updatedAt: Date.now()
                    });
                    updated++;
                } else {
                    // 新建实体
                    id = Utils.uuid();
                    chapters = [chapterId];
                    cycles = cycleId ? [cycleId] : [];
                    volumes = volumeId ? [volumeId] : [];
                    
                    await DB.put('entities', {
                        id, name: ent.name, type: ent.type, desc: ent.desc || '',
                        relations, chapters, cycles, volumes, source, nexusState: null, updatedAt: Date.now()
                    });
                    added++;
                }
                
                // 同步到向量库
                try {
                    await DB.put('vectors', {
                        id, content: `[${ent.type}] ${ent.name}: ${ent.desc || ''}\n来源：第${chap.order || '?'}章 ${chap.title || ''}\n章内细纲：${optimizedOutline.slice(0, 500)}`,
                        vector: Array.from({length:1536}, ()=>Math.random()), timestamp: Date.now()
                    });
                } catch(e) {}
            }
            
            // 刷新缓存
            Modules.world_engine._cachedEntities = null;
            if (Modules.world_engine.rebuildLayeredGraphs) {
                await Modules.world_engine.rebuildLayeredGraphs('writer_entity_extract', { silent: true });
            }
            // 刷新图谱（如果世界引擎有图谱功能）
            if (Modules.world_engine._initGraph) {
                try { Modules.world_engine._initGraph(); } catch(e) {}
            }
            console.log(`[Writer] 第${chap.order}章实体提取完成: 新增${added}个, 更新${updated}个`);
            UI.toast(`实体提取: +${added} 更新${updated}`);
        } catch(e) {
            console.error('[Writer] 自动提取实体失败:', e);
        }
    },

};
