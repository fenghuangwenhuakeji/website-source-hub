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
    async _buildNexusPrefix() {
        const snapshot = await this._getNexusContext();
        const chap = this.currentChapterId ? await DB.get('chapters', this.currentChapterId) : null;
        const chapterNum = chap?.order || 0;
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
        prefix += '4.禁虚词模糊:"似乎/仿佛/好像" | 5.禁情绪标签:动作/环境/对话呈现 | 6.禁连续长句:≤25字,逗号≤2个\n';
        prefix += '7.章末必有钩子:未完成动作+意外信息 | 8.对话格式:「」独立成段 | 9.对话功能化:推剧情/塑性格/埋伏笔/造情绪\n';
        prefix += '10.开篇100字:必动作/对话 | 11.结局禁梦 | 12.时间线向前 | 13.行为一致:禁无理由OOC\n';
        prefix += '14.禁逻辑连词:"首先/其次/然后/最后" | 15.段落限制:≤5行(约60字) | 16.跨模块铁律\n\n';

        // === P1-P10 拟人化协议 ===
        prefix += '=== P1-P10 拟人化协议 ===\n';
        prefix += 'P1物理替代 P2拒绝升华 P3沟通失效 P4细节碎片化 P5认知反差 P6逻辑自毁\n';
        prefix += 'P7感官钝化 P8权力不对等 P9时间尺度扭曲 P10自我意识抹除\n\n';

        // === L2 建议 ===
        prefix += '=== L2 建议 ===\n';
        prefix += '每章≥2种感官 | 每章≥1个日常小动作 | ≤10字短句占30%+ | 长短句交替 | 每2-3章1个偶然事件\n\n';

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
                    <button class="btn btn-xs bg-gradient-to-r from-red-600/20 to-amber-600/20 text-amber-300 border border-amber-500/20 w-full font-bold" onclick="Modules.writer.autoWriteAll()"><i class="fa-solid fa-rocket mr-1"></i>批量自动写正文</button>
                    <button class="btn btn-xs bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-pink-300 border border-pink-500/20 w-full font-bold" onclick="Modules.writer.autoWriteAllEnhanced()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>强化批量写作</button>
                </div>
            </div>

            <!-- Center: Editor -->
            <div class="flex-1 flex flex-col min-w-0 relative">
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
                        <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.short.openPromptModal('writer_ai')"><i class="fa-solid fa-gear"></i></button>
                    </div>
                </div>
                <div class="flex-1 flex flex-col min-h-0 relative">
                    <!-- AI Action Bar -->
                    <div class="flex items-center gap-2 px-5 py-2 bg-[#0a0a0c] border-b border-white/5 shrink-0 flex-wrap">
                        <button class="btn btn-xs bg-accent/20 text-accent border-accent/30 hover:bg-accent hover:text-black" onclick="Modules.writer.aiWrite()" id="w-ai-btn"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>AI续写</button>
                        <button class="btn btn-xs bg-purple-500/20 text-purple-400 border-purple-500/30" onclick="Modules.writer.polish()"><i class="fa-solid fa-gem mr-1"></i>润色</button>
                        <button class="btn btn-xs bg-cyan-500/20 text-cyan-400 border-cyan-500/30" onclick="Modules.writer._loadContextTab()"><i class="fa-solid fa-rotate mr-1"></i>刷新上下文</button>
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
                        <input id="w-ai-direction" class="w-full bg-transparent border-none text-[10px] text-dim focus:text-white focus:outline-none" placeholder="续写方向指引（可选）：如"让主角发现真相"、"转入打斗场景"...">
                    </div>
                    <textarea class="flex-1 w-full bg-transparent border-none p-8 text-base leading-loose text-gray-200 resize-none focus:outline-none font-serif placeholder-white/10" id="w-editor" placeholder="在此书写你的故事..." oninput="Modules.writer.onInput()"></textarea>
                </div>
            </div>

            <!-- Right: Tabs Panel -->
            <div class="w-80 shrink-0 flex flex-col bg-[#111113] border-l border-white/5">
                <div class="flex border-b border-white/5 shrink-0 bg-[#0d0d0f]">
                    <div id="w-tab-btn-info" class="tab-btn flex-1 py-2 text-[9px] font-bold text-center cursor-pointer active flex flex-col items-center gap-0.5" onclick="Modules.writer.tab('info')"><i class="fa-solid fa-circle-info text-[11px]"></i>信息</div>
                    <div id="w-tab-btn-outline" class="tab-btn flex-1 py-2 text-[9px] font-bold text-center cursor-pointer flex flex-col items-center gap-0.5" onclick="Modules.writer.tab('outline')"><i class="fa-solid fa-list-check text-[11px]"></i>大纲</div>
                    <div id="w-tab-btn-context" class="tab-btn flex-1 py-2 text-[9px] font-bold text-center cursor-pointer flex flex-col items-center gap-0.5" onclick="Modules.writer.tab('context')"><i class="fa-solid fa-link text-[11px]"></i>上下文</div>
                    <div id="w-tab-btn-style" class="tab-btn flex-1 py-2 text-[9px] font-bold text-center cursor-pointer flex flex-col items-center gap-0.5" onclick="Modules.writer.tab('style')"><i class="fa-solid fa-palette text-[11px]"></i>文风</div>
                    <div id="w-tab-btn-assistant" class="tab-btn flex-1 py-2 text-[9px] font-bold text-center cursor-pointer flex flex-col items-center gap-0.5" onclick="Modules.writer.tab('assistant')"><i class="fa-solid fa-wand-magic-sparkles text-[11px]"></i>AI助手</div>
                    <div id="w-tab-btn-diagnose" class="tab-btn flex-1 py-2 text-[9px] font-bold text-center cursor-pointer flex flex-col items-center gap-0.5" onclick="Modules.writer.tab('diagnose')"><i class="fa-solid fa-stethoscope text-[11px]"></i>诊断</div>
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
                <!-- Outline Tab (增强版) -->
                <div id="w-tab-outline" class="flex-1 hidden flex flex-col p-3 gap-2 min-h-0">
                    <div class="flex items-center justify-between"><span class="text-[10px] text-accent font-bold uppercase">章节大纲</span><button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.writer.saveContent()">保存</button></div>
                    <textarea class="flex-1 bg-black/30 border border-white/5 rounded p-3 text-xs text-gray-300 resize-none font-mono leading-relaxed" id="w-outline" placeholder="本章大纲 / 剧情要点..."></textarea>
                    <div class="shrink-0 border-t border-white/5 pt-2 space-y-2">
                        <div class="text-[10px] text-dim font-bold uppercase">AI 细化</div>
                        <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30 w-full" onclick="Modules.writer._aiRefineOutline()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>细化本章大纲</button>
                        <div class="flex gap-1.5">
                            <input id="w-outline-chat" class="input flex-1 h-7 text-xs bg-black/30 border-white/10" placeholder="补充细节要求..." onkeydown="if(event.key==='Enter')Modules.writer._aiExpandOutline()">
                            <button class="btn btn-xs btn-primary px-2" onclick="Modules.writer._aiExpandOutline()"><i class="fa-solid fa-paper-plane"></i></button>
                        </div>
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
    async save() {
        if (!this.currentChapterId) return UI.toast('请先选择或新建章节');
        const chap = await DB.get('chapters', this.currentChapterId);
        if (!chap) return;
        chap.content = (document.getElementById('w-editor') || {}).value || '';
        chap.title = (document.getElementById('w-title') || {}).value || chap.title;
        chap.outline = (document.getElementById('w-outline') || {}).value || '';
        chap.status = (document.getElementById('w-chap-status') || {}).value || chap.status || 'outline';
        chap.targetWords = parseInt((document.getElementById('w-target-words') || {}).value) || chap.targetWords || 2500;
        await DB.put('chapters', chap);
        const st = document.getElementById('w-save-status');
        if (st) st.textContent = '已保存 ' + new Date().toLocaleTimeString();
        UI.toast('已保存', 'success');
        this._updateWordProgress();
        this.loadTree();
        this._syncToWorldEngine();
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
            if (el) { if (x === t) el.classList.remove('hidden'); else el.classList.add('hidden'); }
            if (btn) { if (x === t) btn.classList.add('active'); else btn.classList.remove('active'); }
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

    _treeFilter: 'all',
    _batchMode: false,
    _batchSelected: new Set(),

    async loadTree() {
        const vols = (await DB.getAll('volumes') || []).sort((a,b) => (a.order||0) - (b.order||0));
        let chaps = (await DB.getAll('chapters') || []).sort((a,b) => (a.order||0) - (b.order||0));
        const list = document.getElementById('w-chap-list');
        if (!list) return;

        const search = (document.getElementById('w-tree-search')?.value || '').toLowerCase();
        if (search) {
            chaps = chaps.filter(c => (c.title || '').toLowerCase().includes(search));
        }
        const filter = this._treeFilter;
        if (filter !== 'all') {
            chaps = chaps.filter(c => (c.status || 'outline') === filter);
        }

        let html = '';
        const volCount = vols.length;
        let chapCount = 0;
        let totalWords = 0;
        let doneWords = 0;
        let doneChaps = 0;

        const statusEmoji = { outline: '🟡', draft: '🟠', done: '🟢', polished: '🔵' };
        const statusColor = { outline: 'text-yellow-400', draft: 'text-orange-400', done: 'text-green-400', polished: 'text-blue-400' };

        for (const v of vols) {
            const isVolActive = v.id === this.currentVolumeId;
            const volChaps = chaps.filter(c => c.volumeId === v.id);
            const volWords = volChaps.reduce((s, c) => s + (c.content || '').length, 0);
            const volDone = volChaps.filter(c => ['done','polished'].includes(c.status || '')).length;
            const volProgress = volChaps.length > 0 ? Math.round((volDone / volChaps.length) * 100) : 0;

            html += `<div class="px-2 py-1.5 rounded-lg mb-1 ${isVolActive ? 'bg-amber-500/10 border border-amber-500/20' : 'hover:bg-white/5'} cursor-pointer group" onclick="Modules.writer.selectVol('${v.id}')">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold uppercase tracking-wider truncate ${isVolActive ? 'text-amber-400' : 'text-accent'}">
                        <i class="fa-solid fa-folder mr-1 ${isVolActive ? 'text-amber-400' : 'text-accent/50'}"></i>${this._esc(v.title)}
                    </span>
                    <div class="flex items-center gap-1 ${this._batchMode ? '' : 'hidden group-hover:flex'}">
                        <span class="text-[9px] text-dim font-mono">${volChaps.length}章</span>
                        <button class="text-dim hover:text-white text-[9px]" onclick="event.stopPropagation();Modules.writer.rename('vol','${v.id}','${this._esc(v.title)}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="text-dim hover:text-red-400 text-[9px]" onclick="event.stopPropagation();Modules.writer.del('vol','${v.id}')"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
                ${volChaps.length > 0 ? `<div class="flex items-center gap-1.5 mt-1">
                    <div class="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-accent to-green-400 transition-all" style="width:${volProgress}%"></div>
                    </div>
                    <span class="text-[8px] text-dim font-mono">${volProgress}%</span>
                </div>` : ''}
            </div>`;

            chapCount += volChaps.length;
            for (const c of volChaps) {
                const isActive = c.id === this.currentChapterId;
                const wordCount = (c.content || '').length;
                const targetWords = c.targetWords || 2500;
                const st = c.status || 'outline';
                totalWords += wordCount;
                if (['done','polished'].includes(st)) { doneWords += wordCount; doneChaps++; }

                html += `<div class="px-2 py-1 text-xs cursor-pointer rounded flex items-center gap-1.5 group transition-colors ${isActive ? 'bg-accent/10 text-accent font-bold' : 'text-dim hover:bg-white/5 hover:text-white'}" onclick="Modules.writer.load('${c.id}')">
                    ${this._batchMode ? `<input type="checkbox" class="accent-accent w-3 h-3" ${this._batchSelected.has(c.id) ? 'checked' : ''} onclick="event.stopPropagation();Modules.writer.toggleBatchSelect('${c.id}')">` : ''}
                    <span class="text-[10px] ${statusColor[st] || 'text-dim'}">${statusEmoji[st] || '🟡'}</span>
                    <span class="truncate flex-1">${this._esc(c.title)}</span>
                    <div class="flex items-center gap-1">
                        ${wordCount > 0 ? `<span class="text-[8px] ${wordCount >= targetWords ? 'text-green-400' : 'text-dim/50'} font-mono">${wordCount}</span>` : ''}
                        <div class="${this._batchMode ? '' : 'hidden group-hover:flex'} gap-1">
                            <button class="text-dim hover:text-white text-[9px]" onclick="event.stopPropagation();Modules.writer.rename('chap','${c.id}','${this._esc(c.title)}')"><i class="fa-solid fa-pen"></i></button>
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
                const wordCount = (c.content || '').length;
                const st = c.status || 'outline';
                totalWords += wordCount;
                if (['done','polished'].includes(st)) { doneWords += wordCount; doneChaps++; }
                html += `<div class="px-2 py-1 text-xs cursor-pointer rounded flex items-center gap-1.5 group transition-colors ${isActive ? 'bg-accent/10 text-accent font-bold' : 'text-dim hover:bg-white/5 hover:text-white'}" onclick="Modules.writer.load('${c.id}')">
                    ${this._batchMode ? `<input type="checkbox" class="accent-accent w-3 h-3" ${this._batchSelected.has(c.id) ? 'checked' : ''} onclick="event.stopPropagation();Modules.writer.toggleBatchSelect('${c.id}')">` : ''}
                    <span class="text-[10px] ${statusColor[st] || 'text-dim'}">${statusEmoji[st] || '🟡'}</span>
                    <span class="truncate flex-1">${this._esc(c.title)}</span>
                    <div class="flex items-center gap-1">
                        ${wordCount > 0 ? `<span class="text-[8px] text-dim/50 font-mono">${wordCount}</span>` : ''}
                        <div class="${this._batchMode ? '' : 'hidden group-hover:flex'} gap-1">
                            <button class="text-dim hover:text-white text-[9px]" onclick="event.stopPropagation();Modules.writer.rename('chap','${c.id}','${this._esc(c.title)}')"><i class="fa-solid fa-pen"></i></button>
                            <button class="text-dim hover:text-red-400 text-[9px]" onclick="event.stopPropagation();Modules.writer.del('chap','${c.id}')"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                </div>`;
            }
        }
        list.innerHTML = html;
        const vc = document.getElementById('w-vol-count'); if(vc) vc.textContent = volCount;
        const cc = document.getElementById('w-chap-count'); if(cc) cc.textContent = chapCount;
        const tw = document.getElementById('w-total-words'); if(tw) tw.textContent = (totalWords / 10000).toFixed(1);
        const gp = document.getElementById('w-global-progress'); if(gp) gp.style.width = (chapCount > 0 ? Math.round((doneChaps / chapCount) * 100) : 0) + '%';
    },
    _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; },

    // ===== 筛选 & 批量操作 =====
    setFilter(filter) {
        this._treeFilter = filter;
        // 更新按钮样式
        document.querySelectorAll('#w-status-filters button').forEach(btn => {
            const isActive = btn.dataset.filter === filter;
            btn.className = isActive
                ? 'px-1.5 py-0.5 rounded text-[9px] border transition-all bg-accent/20 text-accent border-accent/30'
                : 'px-1.5 py-0.5 rounded text-[9px] border transition-all bg-white/5 text-dim border-white/10';
        });
        this.loadTree();
    },

    toggleBatchMode() {
        this._batchMode = !this._batchMode;
        this._batchSelected.clear();
        const bar = document.getElementById('w-batch-bar');
        const btn = document.getElementById('w-batch-toggle');
        if (bar) bar.classList.toggle('hidden', !this._batchMode);
        if (btn) btn.classList.toggle('bg-accent/20', this._batchMode);
        if (btn) btn.classList.toggle('text-accent', this._batchMode);
        this.loadTree();
    },

    toggleBatchSelect(id) {
        if (this._batchSelected.has(id)) this._batchSelected.delete(id);
        else this._batchSelected.add(id);
        const countEl = document.getElementById('w-batch-count');
        if (countEl) countEl.textContent = '已选 ' + this._batchSelected.size;
    },

    async saveStatus() {
        if (!this.currentChapterId) return;
        const chap = await DB.get('chapters', this.currentChapterId);
        if (!chap) return;
        const stEl = document.getElementById('w-chap-status');
        if (stEl) chap.status = stEl.value;
        await DB.put('chapters', chap);
        this.loadTree();
    },

    _updateWordProgress() {
        const stats = document.getElementById('w-stats');
        const target = document.getElementById('w-target-words');
        const bar = document.getElementById('w-word-progress');
        if (!stats || !target || !bar) return;
        const cur = parseInt(stats.textContent) || 0;
        const tgt = parseInt(target.value) || 2500;
        const pct = Math.min(100, Math.round((cur / tgt) * 100));
        bar.style.width = pct + '%';
    },

    async batchMove() {
        if (this._batchSelected.size === 0) return UI.toast('请先选择章节');
        const vols = (await DB.getAll('volumes') || []).sort((a,b) => (a.order||0) - (b.order||0));
        const volId = prompt('移动到哪个卷？输入卷ID或名称（' + vols.map(v => v.title).join(' / ') + '）');
        if (!volId) return;
        const targetVol = vols.find(v => v.id === volId || v.title === volId);
        if (!targetVol) return UI.toast('未找到该卷');
        for (const id of this._batchSelected) {
            const chap = await DB.get('chapters', id);
            if (chap) { chap.volumeId = targetVol.id; await DB.put('chapters', chap); }
        }
        this._batchSelected.clear();
        this.loadTree();
        UI.toast(`已移动 ${this._batchSelected.size} 章到 ${targetVol.title}`);
    },

    async batchSetStatus() {
        if (this._batchSelected.size === 0) return UI.toast('请先选择章节');
        const status = prompt('设置状态: outline(待写) / draft(草稿) / done(已完成) / polished(已润色)');
        if (!['outline','draft','done','polished'].includes(status)) return UI.toast('无效状态');
        for (const id of this._batchSelected) {
            const chap = await DB.get('chapters', id);
            if (chap) { chap.status = status; await DB.put('chapters', chap); }
        }
        this._batchSelected.clear();
        this.loadTree();
        UI.toast('状态已批量更新');
    },

    async batchDelete() {
        if (this._batchSelected.size === 0) return UI.toast('请先选择章节');
        if (!confirm(`确定删除选中的 ${this._batchSelected.size} 个章节？`)) return;
        for (const id of this._batchSelected) {
            await DB.del('chapters', id);
        }
        this._batchSelected.clear();
        this.currentChapterId = null;
        this.loadTree();
        UI.toast('已删除');
    },

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
            <input class="flex-1 bg-black/40 border border-accent/40 rounded px-2 py-1 text-xs text-white focus:outline-none" placeholder="输入卷名..." autofocus
                onkeydown="if(event.key==='Enter')Modules.writer._confirmNewVol(this.value);if(event.key==='Escape')Modules.writer.loadTree();">
            <button class="text-accent text-xs hover:text-white" onclick="Modules.writer._confirmNewVol(this.previousElementSibling.value)"><i class="fa-solid fa-check"></i></button>
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
            <input class="flex-1 bg-black/40 border border-blue-400/40 rounded px-2 py-1 text-xs text-white focus:outline-none" placeholder="输入章节名..." autofocus
                onkeydown="if(event.key==='Enter')Modules.writer._confirmNewChap(this.value);if(event.key==='Escape')Modules.writer.loadTree();">
            <button class="text-blue-400 text-xs hover:text-white" onclick="Modules.writer._confirmNewChap(this.previousElementSibling.value)"><i class="fa-solid fa-check"></i></button>
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
        
        await DB.put('chapters', { id, title: title.trim(), content: '', outline: '', order: insertOrder, volumeId: volId, status: 'outline', targetWords: 2500 });
        this.loadTree();
        this.load(id);
        UI.toast('已新建章节：' + title.trim());
    },
    rename(type, id, oldTitle) {
        const el = event.target.closest('[onclick]').parentElement.parentElement;
        if (!el) return;
        const span = el.querySelector('span');
        if (!span) return;
        span.innerHTML = `<input class="bg-black/40 border border-accent/40 rounded px-1 py-0.5 text-xs text-white w-full focus:outline-none" value="${oldTitle}"
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
                    <button class="ml-auto text-dim hover:text-white" onclick="Modules.writer._showAllEntities()"><i class="fa-solid fa-expand"></i></button>
                </div>
                <div class="space-y-1">
                    ${entities.map(e => `
                        <div class="p-2 bg-cyan-500/5 rounded border border-cyan-500/10 cursor-pointer hover:bg-cyan-500/10 transition-all" onclick="Modules.writer._showEntityDetail('${e.id}')">
                            <div class="flex items-center gap-2 mb-0.5">
                                <span class="text-[8px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300">${e.type || '其他'}</span>
                                <span class="text-xs text-white font-bold">${this._esc(e.name)}</span>
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
                                <span class="text-xs text-white">${this._esc(e.label || e.name)}</span>
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
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-[#1a1a2e] rounded-2xl border border-white/10 w-[800px] max-h-[85vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-5 py-3 border-b border-white/5">
                    <span class="font-bold text-white"><i class="fa-solid fa-users mr-2 text-cyan-400"></i>全部实体 (${normalEntities.length})</span>
                    <button class="text-dim hover:text-white" onclick="this.closest('#w-all-entities-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="p-3 border-b border-white/5">
                    <input type="text" id="w-entity-filter" class="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white" placeholder="搜索实体..." oninput="Modules.writer._filterAllEntities(this.value)">
                </div>
                <div id="w-all-entities-list" class="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2">
                    ${normalEntities.map(e => `
                        <div class="p-2 bg-black/20 rounded-lg border border-white/5 cursor-pointer hover:bg-white/5 transition-all" onclick="Modules.writer._showEntityDetail('${e.id}')">
                            <div class="flex items-center gap-2">
                                <span class="text-[8px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300">${e.type || '其他'}</span>
                                <span class="text-xs text-white font-bold">${this._esc(e.name)}</span>
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
            <div class="p-2 bg-black/20 rounded-lg border border-white/5 cursor-pointer hover:bg-white/5 transition-all" onclick="Modules.writer._showEntityDetail('${e.id}')">
                <div class="flex items-center gap-2">
                    <span class="text-[8px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300">${e.type || '其他'}</span>
                    <span class="text-xs text-white font-bold">${this._esc(e.name)}</span>
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
                                <span class="text-xs text-white font-bold">${this._esc(e.name)}</span>
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
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-[#1a1a2e] rounded-2xl border border-white/10 w-[500px] max-h-[70vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400">${entity.type || '其他'}</span>
                        <span class="font-bold text-white">${this._esc(entity.name)}</span>
                    </div>
                    <button class="text-dim hover:text-white" onclick="this.closest('#w-entity-detail-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto p-4 space-y-3">
                    <div>
                        <div class="text-[10px] text-dim font-bold uppercase mb-1">描述</div>
                        <div class="text-xs text-gray-300 leading-relaxed">${this._esc(entity.desc || '暂无描述')}</div>
                    </div>
                    ${entity.relations && entity.relations.length ? `
                    <div>
                        <div class="text-[10px] text-dim font-bold uppercase mb-1">关联关系</div>
                        <div class="flex flex-wrap gap-1">
                            ${entity.relations.map(r => `<span class="text-[9px] px-2 py-0.5 rounded bg-white/5 text-dim">${this._esc(r)}</span>`).join('')}
                        </div>
                    </div>` : ''}
                    <div class="text-[9px] text-dim">
                        来源: ${entity.source || '手动创建'} | 
                        更新: ${entity.updatedAt ? new Date(entity.updatedAt).toLocaleString() : '未知'}
                    </div>
                </div>
                <div class="flex gap-2 p-3 border-t border-white/5">
                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30 flex-1" onclick="Modules.writer._injectEntityToPrompt('${id}')">
                        <i class="fa-solid fa-syringe mr-1"></i>注入到续写
                    </button>
                    <button class="btn btn-xs bg-white/5 text-dim flex-1" onclick="navigator.clipboard.writeText('${entity.name}: ${entity.desc || ''}');UI.toast('已复制')">
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
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-[#1a1a2e] rounded-2xl border border-white/10 w-[600px] max-h-[80vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-earth-americas text-amber-400"></i>
                        <span class="font-bold text-white">${catLabels[cat] || world.name}</span>
                    </div>
                    <button class="text-dim hover:text-white" onclick="this.closest('#w-world-detail-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto p-4">
                    <div class="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">${this._esc(world.desc || '暂无内容')}</div>
                </div>
                <div class="flex gap-2 p-3 border-t border-white/5">
                    <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 flex-1" onclick="Modules.writer._injectWorldToPrompt('${id}')">
                        <i class="fa-solid fa-syringe mr-1"></i>注入到续写
                    </button>
                    <button class="btn btn-xs bg-white/5 text-dim flex-1" onclick="navigator.clipboard.writeText(\`${world.desc || ''}\`);UI.toast('已复制')">
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
                <div class="text-[10px] text-gray-300 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto bg-black/20 rounded p-2">${this._esc(fullContext)}</div>
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
    _getExtractedStyle() {
        const extracted = (document.getElementById('w-style-extracted') || {}).value || '';
        return extracted.trim();
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
        const extractedStyle = this._getExtractedStyle();
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

        // ★ NEXUS OS 前缀注入（强制铁律+四状态机）
        const nexusPrefix = await this._buildNexusPrefix();
        prompt = nexusPrefix + prompt;

        // 融合技法注入
        if (opts.fusionInject) {
            const fusionCtx = this._getFusionContext();
            if(fusionCtx) prompt = '[融合拆书技法 — 请运用这些技法写作]\n' + fusionCtx.slice(0, 3000) + '\n\n' + prompt;
        }

        // ★ 循环级上下文注入（精准到当前章节所属循环）
        const cycleCtx = await this._getCycleContext();
        if(cycleCtx) prompt = '[循环级技法约束 — 本章必须遵守的循环技法]\n' + cycleCtx.slice(0, 2500) + '\n\n' + prompt;

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

        // ★ NEXUS 前缀 + 循环上下文
        const nexusPrefix = await this._buildNexusPrefix();
        const cycleCtx = await this._getCycleContext();

        const prompt = `${nexusPrefix}你是一位顶级网文写手，精通融合技法。请严格运用以下融合技法精华来创作/续写正文。

${fusionCtx}
${cycleCtx ? '[循环级技法约束]\n' + cycleCtx.slice(0, 2000) + '\n\n' : ''}${rules ? '[写作规则]\n' + rules.slice(0, 1000) + '\n\n' : ''}${outline ? '[本章大纲]\n' + outline.slice(0, 2000) + '\n\n' : ''}${prevSummary ? prevSummary + '\n\n' : ''}${content ? '[当前正文(末尾)]\n' + content.slice(-2000) + '\n\n' : ''}${direction ? '[续写方向] ' + direction + '\n\n' : ''}[核心要求]
1. 必须运用融合技法中的「开篇钩子模板」（如果是章节开头）
2. 严格按照「节奏公式」控制行文节奏
3. 在关键节点运用「爽点矩阵」制造情绪高潮
4. 运用「悬念体系」在段落末尾设置钩子
5. 对话要有潜台词，场景要有画面感
6. ${this._getLenHint()}
7. 直接输出正文，不要解释`;

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
        const extractedStyle = this._getExtractedStyle();
        // 确定最终使用的文风规则
        let finalRules = '';
        let styleSource = '默认写法';
        
        if (extractedStyle) {
            // 文风提取优先级最高
            finalRules = extractedStyle;
            styleSource = '文风提取';
        } else if (polishRules) {
            // 其次使用润色规则
            finalRules = polishRules;
            styleSource = '润色规则';
        } else if (rules) {
            // 再次使用全局规则
            finalRules = rules;
            styleSource = '全局规则';
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
            modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm';
            modal.innerHTML = `
                <div class="bg-[#1a1a2e] rounded-2xl border border-white/10 w-[500px] max-h-[70vh] flex flex-col shadow-2xl">
                    <div class="flex items-center justify-between px-4 py-3 border-b border-white/5">
                        <span class="font-bold text-white text-sm"><i class="fa-solid fa-at mr-2 text-amber-400"></i>选择要引用的实体</span>
                        <button class="text-dim hover:text-white" onclick="this.closest('#w-entity-ref-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="p-3 border-b border-white/5">
                        <input type="text" id="w-entity-search" class="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white" placeholder="搜索实体..." oninput="Modules.writer._filterEntityList(this.value)">
                    </div>
                    <div id="w-entity-list" class="flex-1 overflow-y-auto p-2 space-y-1">
                        ${entities.slice(0, 50).map(e => `
                            <div class="p-2 bg-black/20 rounded-lg border border-white/5 cursor-pointer hover:bg-white/5 transition-all" onclick="Modules.writer._selectEntity('${e.id}', '${this._esc(e.name)}')">
                                <div class="flex items-center gap-2">
                                    <span class="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-dim">${e.type || '其他'}</span>
                                    <span class="text-xs text-white font-bold">${this._esc(e.name)}</span>
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
            <div class="p-2 bg-black/20 rounded-lg border border-white/5 cursor-pointer hover:bg-white/5 transition-all" onclick="Modules.writer._selectEntity('${e.id}', '${this._esc(e.name)}')">
                <div class="flex items-center gap-2">
                    <span class="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-dim">${e.type || '其他'}</span>
                    <span class="text-xs text-white font-bold">${this._esc(e.name)}</span>
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
            // ★ 优先获取当前章节/循环相关的实体
            let charEntities = entities.filter(e => !e.id.startsWith('world_'));
            const ch = this.currentChapterId ? await DB.get('chapters', this.currentChapterId) : null;
            if(ch && ch.order) {
                const cycleInfo = Modules.world_engine ? Modules.world_engine.getCycleIdForChapter(ch.order, 5) : null;
                const cycleId = cycleInfo ? cycleInfo.cycleId : null;
                // 优先：当前循环实体 > 当前章节实体 > 其他
                const cycleEntities = charEntities.filter(e => cycleId && e.cycles && e.cycles.includes(cycleId));
                const chapterEntities = charEntities.filter(e => e.chapters && e.chapters.includes(this.currentChapterId));
                const otherEntities = charEntities.filter(e => !cycleEntities.includes(e) && !chapterEntities.includes(e));
                charEntities = [...cycleEntities, ...chapterEntities, ...otherEntities].slice(0, 25);
                if(cycleEntities.length) ctx += `\n[循环关联实体 (${cycleEntities.length})]\n`;
            } else {
                charEntities = charEntities.slice(0, 20);
            }
            if (charEntities.length) {
                ctx += '\n[相关实体]\n';
                charEntities.forEach(e => {
                    let line = `• ${e.name}(${e.type||'其他'}): ${(e.desc||'').slice(0,80)}`;
                    if(e.nexusState && e.nexusState.chrStatus) line += ` [${e.nexusState.chrStatus}]`;
                    ctx += line + '\n';
                });
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
            <div class="text-gray-200 text-xs leading-relaxed">${this._esc(txt)}</div>`;
        
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
        log.innerHTML += `<div id="${aiMsgId}" class="p-2 bg-white/5 rounded-lg border border-white/5">
            <div class="flex items-center gap-2 mb-1">
                <span class="text-green-400 font-bold text-[10px]">AI</span>
                <span class="text-[9px] text-dim">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="text-gray-300 text-xs leading-relaxed"><i class="fa-solid fa-spinner fa-spin mr-1"></i>思考中...</div>
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
                <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.writer._copyChatReply('${aiMsgId}')">
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
                <ul class="text-xs text-gray-300 space-y-2">
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
            .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
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

            // ★ NEXUS 前缀 + 循环上下文（按章节动态获取）
            this.currentChapterId = chap.id;
            const nexusPrefix = await this._buildNexusPrefix();
            const cycleCtx = await this._getCycleContext();

            let writePrompt = nexusPrefix + `你是一位专业小说家。请根据以下信息编写本章正文。\n\n`;
            // 注入RAG上下文
            if(ragContext) writePrompt += ragContext;
            // 注入融合技法
            if(fusionCtx) writePrompt += fusionCtx + '\n';
            // ★ 注入循环级上下文
            if(cycleCtx) writePrompt += '[循环级技法约束]\n' + cycleCtx.slice(0, 2000) + '\n\n';
            if(rules) writePrompt += '[写作规则]\n' + rules.slice(0, 1000) + '\n\n';
            writePrompt += `[本章标题] ${chap.title}\n\n[本章细纲]\n${chap.outline.slice(0, 3000)}\n\n`;
            if(prevContent) writePrompt += '[前文末尾]\n' + prevContent + '\n\n';
            writePrompt += `要求：\n1. 严格按照细纲展开\n2. ${fusionCtx || cycleCtx ? '运用融合技法中的套路（钩子、节奏、爽点）' : '文风统一，情节连贯'}\n3. ${ragContext ? '参考RAG上下文保持世界观/人设/伏笔一致性' : '保持前后文一致'}\n4. 遵守NEXUS OS L1铁律（单句≤25字、禁情绪标签、章末钩子）\n5. 字数约1500-2500字\n6. 直接输出正文`;

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
            panel.className = 'fixed top-16 right-4 z-[9998] bg-[#111113] border border-white/10 rounded-xl shadow-2xl w-72 overflow-hidden';
            panel.innerHTML = `
                <div class="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-b border-amber-500/20">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-spinner fa-spin text-amber-400"></i>
                        <span id="w-batch-label" class="text-[11px] font-bold text-amber-400">批量写作中...</span>
                    </div>
                    <button id="w-batch-stop" class="btn btn-xs bg-red-600/30 text-red-400 border-red-500/30 hover:bg-red-600 hover:text-white" onclick="Modules.writer._stopBatch()"><i class="fa-solid fa-stop mr-1"></i>停止</button>
                </div>
                <div class="p-3">
                    <div class="flex items-center justify-between mb-1">
                        <span id="w-batch-status" class="text-[10px] text-dim">准备中...</span>
                        <span id="w-batch-percent" class="text-[10px] font-mono text-amber-400">0%</span>
                    </div>
                    <div class="w-full h-2 bg-white/5 rounded-full overflow-hidden">
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
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-[#1a1a2e] rounded-2xl border border-white/10 w-[600px] max-h-[85vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-5 py-3 border-b border-white/5">
                    <span class="font-bold text-white"><i class="fa-solid fa-rocket mr-2 text-amber-400"></i>批量自动写作配置</span>
                    <button class="text-dim hover:text-white" onclick="this.closest('#w-auto-write-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto p-5 space-y-4">
                    <div class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div class="text-sm font-bold text-amber-300 mb-1">待写章节: ${targets.length} 章</div>
                        <div class="text-[10px] text-dim">仅显示有细纲且正文为空的章节</div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <div class="text-[10px] text-dim font-bold uppercase mb-1">起始章节</div>
                            <select id="w-auto-start" class="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white">
                                ${targets.map((c, i) => `<option value="${i}" ${i===0?'selected':''}>${i+1}. ${c.title}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <div class="text-[10px] text-dim font-bold uppercase mb-1">结束章节</div>
                            <select id="w-auto-end" class="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white">
                                ${targets.map((c, i) => `<option value="${i}" ${i===targets.length-1?'selected':''}>${i+1}. ${c.title}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <div class="text-[10px] text-dim font-bold uppercase mb-1">章间延迟(秒)</div>
                            <input type="number" id="w-auto-delay" value="3" min="0" max="60" class="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white">
                        </div>
                        <div>
                            <div class="text-[10px] text-dim font-bold uppercase mb-1">目标字数/章</div>
                            <select id="w-auto-words" class="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white">
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
                            <span class="text-xs text-gray-300">融合技法精华 (来自融合拆书)</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="w-auto-world" checked class="accent-blue-500">
                            <span class="text-xs text-gray-300">世界引擎实体 (人物/地点/势力等)</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="w-auto-rag" checked class="accent-cyan-500">
                            <span class="text-xs text-gray-300">RAG向量检索 (相关上下文)</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="w-auto-logic" checked class="accent-purple-500">
                            <span class="text-xs text-gray-300">逻辑纠正 (自动检查前后一致性)</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="w-auto-save-rag" checked class="accent-green-500">
                            <span class="text-xs text-gray-300">写完后存入RAG (供后续章节检索)</span>
                        </label>
                    </div>
                    
                    <div class="border-t border-white/5 pt-3 space-y-2">
                        <div class="text-[10px] text-amber-400 font-bold uppercase"><i class="fa-solid fa-star mr-1"></i>高级功能</div>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="w-auto-extract-entity" checked class="accent-pink-500">
                            <span class="text-xs text-gray-300">自动提取实体到世界引擎</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="w-auto-polish" class="accent-emerald-500">
                            <span class="text-xs text-gray-300">写完后自动润色</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="w-auto-cycle" class="accent-indigo-500">
                            <span class="text-xs text-gray-300">循环模式 (每N章总结优化)</span>
                        </label>
                        <div class="flex items-center gap-2 ml-5">
                            <span class="text-[10px] text-dim">循环周期:</span>
                            <select id="w-auto-cycle-size" class="bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white">
                                <option value="3">3章</option>
                                <option value="5" selected>5章</option>
                                <option value="8">8章</option>
                                <option value="10">10章</option>
                            </select>
                        </div>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="w-auto-checkpoint" checked class="accent-orange-500">
                            <span class="text-xs text-gray-300">断点续写 (保存进度，意外中断可继续)</span>
                        </label>
                    </div>
                    
                    <div class="border-t border-white/5 pt-3">
                        <div class="text-[10px] text-dim font-bold uppercase mb-2">写作风格提示</div>
                        <textarea id="w-auto-style" class="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-xs text-gray-300 resize-none h-20" placeholder="可选：输入额外的风格要求，如'热血爽文'、'细腻言情'等..."></textarea>
                    </div>
                </div>
                <div class="px-5 py-3 border-t border-white/5 flex gap-2">
                    <button class="btn btn-sm bg-white/5 text-dim flex-1" onclick="this.closest('#w-auto-write-modal').remove()">取消</button>
                    <button class="btn btn-sm bg-gradient-to-r from-amber-600 to-red-600 text-white font-bold flex-1" onclick="Modules.writer._startEnhancedAutoWrite()">
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
            
            // ★ NEXUS 前缀 + 循环上下文（按章节动态获取）
            const nexusPrefix = await W._buildNexusPrefix();
            const cycleCtx = await W._getCycleContext();

            let writePrompt = nexusPrefix + `你是一位专业小说家。请根据以下信息编写本章正文。\n\n`;
            if(fusionCtx) writePrompt += fusionCtx + '\n';
            if(worldCtx) writePrompt += worldCtx + '\n';
            if(cycleCtx) writePrompt += '[循环级技法约束]\n' + cycleCtx.slice(0, 2000) + '\n\n';
            if(ragContext) writePrompt += ragContext;
            if(rules) writePrompt += '[写作规则]\n' + rules.slice(0, 1000) + '\n\n';
            if(styleHint) writePrompt += `[风格要求] ${styleHint}\n\n`;
            
            writePrompt += `[本章标题] ${chap.title}\n\n[本章细纲]\n${chap.outline.slice(0, 3000)}\n\n`;
            
            if(prevContent) {
                writePrompt += '[前文末尾(保持连贯性)]\n' + prevContent + '\n\n';
            }
            
            writePrompt += `要求：
1. 严格按照细纲展开情节
2. ${fusionCtx || cycleCtx ? '运用融合技法中的套路（钩子、节奏、爽点）' : '文风统一，情节连贯'}
3. ${worldCtx || ragContext ? '参考上下文保持世界观/人设/伏笔一致性' : '保持前后文一致'}
4. 遵守NEXUS OS L1铁律（单句≤25字、禁情绪标签、章末钩子）
5. 字数约${targetWords}字
6. 直接输出正文，不要标题`;
            
            if(useLogic && prevContent) {
                writePrompt += `\n7. 注意与前文的逻辑连贯，避免人物性格突变、时间线混乱等问题`;
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
    async _refreshInfoTab() {
        const statusLabels = { outline: '🟡 待写', draft: '🟠 草稿', done: '🟢 完成', polished: '🔵 已润色' };
        const statusColors = { outline: 'text-yellow-400', draft: 'text-orange-400', done: 'text-green-400', polished: 'text-blue-400' };
        const statusIconColors = { outline: '#fbbf24', draft: '#fb923c', done: '#4ade80', polished: '#60a5fa' };
        if (!this.currentChapterId) {
            const els = ['w-info-status','w-info-words','w-info-pct','w-info-created'];
            els.forEach(id => { const e = document.getElementById(id); if(e) e.textContent = '-'; });
            const p = document.getElementById('w-info-progress'); if(p) p.style.width = '0%';
            const t = document.getElementById('w-info-tags'); if(t) t.innerHTML = '<span class="text-[9px] text-dim">请选择章节</span>';
            const n = document.getElementById('w-info-neighbors'); if(n) n.innerHTML = '<div class="text-[9px] text-dim text-center py-2">请选择章节</div>';
            ['w-info-vol-total','w-info-vol-done','w-info-vol-words'].forEach(id => { const e = document.getElementById(id); if(e) e.textContent = '0'; });
            return;
        }
        const chap = await DB.get('chapters', this.currentChapterId);
        if (!chap) return;
        const st = chap.status || 'outline';
        const words = (chap.content || '').length;
        const target = chap.targetWords || 2500;
        const pct = Math.min(100, Math.round((words / target) * 100));
        const stEl = document.getElementById('w-info-status');
        if (stEl) { stEl.textContent = statusLabels[st] || st; stEl.className = 'text-xs font-bold ' + (statusColors[st] || 'text-dim'); }
        const wEl = document.getElementById('w-info-words'); if (wEl) wEl.textContent = words + ' / ' + target;
        const pEl = document.getElementById('w-info-progress'); if (pEl) pEl.style.width = pct + '%';
        const pctEl = document.getElementById('w-info-pct'); if (pctEl) pctEl.textContent = pct + '%';
        const cEl = document.getElementById('w-info-created'); if (cEl) cEl.textContent = chap.createdAt ? new Date(chap.createdAt).toLocaleDateString() : '-';
        const tagsEl = document.getElementById('w-info-tags');
        if (tagsEl) {
            const tags = chap.tags || [];
            tagsEl.innerHTML = tags.length ? tags.map(t => '<span class="px-1.5 py-0.5 rounded-full bg-accent/10 text-accent text-[9px] border border-accent/20">' + this._esc(t) + '</span>').join('') : '<span class="text-[9px] text-dim">暂无标签</span>';
        }
        // 卷级统计
        const allChaps = (await DB.getAll('chapters') || []).sort((a,b) => (a.order||0) - (b.order||0));
        const volChaps = chap.volumeId ? allChaps.filter(c => c.volumeId === chap.volumeId) : [];
        const volTotal = volChaps.length;
        const volDone = volChaps.filter(c => ['done','polished'].includes(c.status||'')).length;
        const volWords = volChaps.reduce((sum, c) => sum + (c.content||'').length, 0);
        const vtEl = document.getElementById('w-info-vol-total'); if(vtEl) vtEl.textContent = volTotal;
        const vdEl = document.getElementById('w-info-vol-done'); if(vdEl) vdEl.textContent = volDone;
        const vwEl = document.getElementById('w-info-vol-words'); if(vwEl) vwEl.textContent = volWords > 9999 ? (volWords/10000).toFixed(1)+'万' : volWords;
        // 相邻章节（增强版）
        const idx = allChaps.findIndex(c => c.id === this.currentChapterId);
        const neighbors = document.getElementById('w-info-neighbors');
        if (neighbors) {
            let nh = '';
            if (idx > 0) {
                const prev = allChaps[idx - 1];
                const pSt = prev.status || 'outline';
                nh += `<div class="p-2 bg-black/20 rounded border border-white/5 cursor-pointer hover:bg-white/5 transition-all" onclick="Modules.writer.load('${prev.id}')">
                    <div class="flex items-center gap-1.5 mb-1"><i class="fa-solid fa-chevron-up text-[8px] text-dim"></i><span class="text-[10px] font-bold text-white">${this._esc(prev.title)}</span><span class="text-[8px] px-1 rounded" style="background:${statusIconColors[pSt]}22;color:${statusIconColors[pSt]}">${statusLabels[pSt]}</span></div>
                    <div class="flex items-center gap-2 text-[9px] text-dim"><span class="font-mono">${(prev.content||'').length}字</span>${prev.targetWords ? '<span>/ ' + prev.targetWords + '目标</span>' : ''}</div>
                </div>`;
            }
            if (idx < allChaps.length - 1) {
                const next = allChaps[idx + 1];
                const nSt = next.status || 'outline';
                nh += `<div class="p-2 bg-black/20 rounded border border-white/5 cursor-pointer hover:bg-white/5 transition-all" onclick="Modules.writer.load('${next.id}')">
                    <div class="flex items-center gap-1.5 mb-1"><i class="fa-solid fa-chevron-down text-[8px] text-dim"></i><span class="text-[10px] font-bold text-white">${this._esc(next.title)}</span><span class="text-[8px] px-1 rounded" style="background:${statusIconColors[nSt]}22;color:${statusIconColors[nSt]}">${statusLabels[nSt]}</span></div>
                    <div class="flex items-center gap-2 text-[9px] text-dim"><span class="font-mono">${(next.content||'').length}字</span>${next.targetWords ? '<span>/ ' + next.targetWords + '目标</span>' : ''}</div>
                </div>`;
            }
            neighbors.innerHTML = nh || '<div class="text-[9px] text-dim text-center py-2">无相邻章节</div>';
        }
    },

    async _quickStatus(status) {
        if (!this.currentChapterId) return UI.toast('请先选择章节');
        const chap = await DB.get('chapters', this.currentChapterId);
        if (!chap) return;
        chap.status = status;
        await DB.put('chapters', chap);
        const stEl = document.getElementById('w-chap-status');
        if (stEl) stEl.value = status;
        this._refreshInfoTab();
        this.loadTree();
        UI.toast('状态已更新');
    },

    async _editTags() {
        if (!this.currentChapterId) return UI.toast('请先选择章节');
        const chap = await DB.get('chapters', this.currentChapterId);
        if (!chap) return;
        const current = (chap.tags || []).join(', ');
        const input = prompt('输入标签，用逗号分隔:', current);
        if (input === null) return;
        chap.tags = input.split(',').map(t => t.trim()).filter(t => t);
        await DB.put('chapters', chap);
        this._refreshInfoTab();
    },

    // ===== 大纲Tab增强：AI细化 =====
    async _aiRefineOutline() {
        const outlineEl = document.getElementById('w-outline');
        const outline = outlineEl ? outlineEl.value : '';
        if (!outline.trim()) return UI.toast('请先输入本章大纲', 'error');
        const chap = this.currentChapterId ? await DB.get('chapters', this.currentChapterId) : null;
        const title = chap ? chap.title : '';
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        
        UI.toast('AI 正在细化大纲...');
        const prompt = `你是一位资深网文策划师。请将以下章节大纲进一步细化，补充更多具体细节。

【章节标题】${title}
【当前大纲】
${outline}

【已有正文片段】
${content.slice(0, 1000)}

【细化要求】
1. 保留原有结构，补充具体细节（场景描写、对话要点、情绪转折）
2. 每个情节点标注情绪值(1-10)和钩子类型
3. 确保与已有正文片段衔接自然
4. 输出格式：情节 → 细节补充 → 情绪/钩子标记

请直接输出细化后的大纲。`;

        let result = '';
        await AI.generate(prompt, {}, c => { result += c; });
        if (outlineEl) outlineEl.value = result;
        UI.toast('大纲细化完成');
    },

    async _aiExpandOutline() {
        const input = document.getElementById('w-outline-chat');
        const demand = input ? input.value.trim() : '';
        if (!demand) return UI.toast('请输入补充要求', 'error');
        const outlineEl = document.getElementById('w-outline');
        const outline = outlineEl ? outlineEl.value : '';
        if (!outline.trim()) return UI.toast('请先输入本章大纲', 'error');
        
        UI.toast('AI 正在补充细节...');
        const prompt = `你是一位资深网文策划师。用户提出了以下补充要求：

【用户要求】${demand}

【当前大纲】
${outline}

请根据用户要求，在保留原有大纲结构的基础上补充细节。直接输出修改后的大纲。`;

        let result = '';
        await AI.generate(prompt, {}, c => { result += c; });
        if (outlineEl) outlineEl.value = result;
        if (input) input.value = '';
        UI.toast('细节补充完成');
    },

    // ===== 上下文Tab（融合+RAG合并） =====
    async _loadContextTab() {
        const resultsEl = document.getElementById('w-ctx-results');
        const fusionSection = document.getElementById('w-ctx-fusion-section');
        const fusionContent = document.getElementById('w-ctx-fusion-content');
        const fusionLen = document.getElementById('w-ctx-fusion-len');
        
        // 加载融合技法
        const fusionCtx = this._getFusionContext();
        if (fusionCtx && fusionSection && fusionContent) {
            fusionSection.classList.remove('hidden');
            fusionContent.textContent = fusionCtx;
            if (fusionLen) fusionLen.textContent = fusionCtx.length + '字';
        } else if (fusionSection) {
            fusionSection.classList.add('hidden');
        }
        
        if (!this.currentChapterId) {
            if (resultsEl) resultsEl.innerHTML = '<div class="text-center text-dim text-xs py-4">请选择章节</div>';
            return;
        }
        
        const chap = await DB.get('chapters', this.currentChapterId);
        if (!chap) return;
        
        // 获取关联数据
        const allChaps = (await DB.getAll('chapters') || []).sort((a,b) => (a.order||0) - (b.order||0));
        const idx = allChaps.findIndex(c => c.id === this.currentChapterId);
        const nearby = allChaps.slice(Math.max(0, idx - 2), Math.min(allChaps.length, idx + 3));
        const entities = await DB.getAll('entities') || [];
        const worldItems = entities.filter(e => e.id.startsWith('world_'));
        const charItems = entities.filter(e => !e.id.startsWith('world_'));
        
        // 更新统计
        const entEl = document.getElementById('w-ctx-entities');
        const chapEl = document.getElementById('w-ctx-chapters');
        const worldEl = document.getElementById('w-ctx-world');
        if (entEl) entEl.textContent = charItems.length;
        if (chapEl) chapEl.textContent = nearby.length;
        if (worldEl) worldEl.textContent = worldItems.length;
        
        // 渲染结果
        let html = '';
        // 前后章节
        nearby.forEach((c, i) => {
            const isCurrent = c.id === this.currentChapterId;
            html += `<div class="p-2 rounded border ${isCurrent ? 'bg-accent/10 border-accent/30' : 'bg-black/20 border-white/5'} text-[10px]">
                <div class="flex items-center gap-1.5 ${isCurrent ? 'text-accent font-bold' : 'text-white'}">
                    ${isCurrent ? '<i class="fa-solid fa-location-dot text-[8px]"></i>' : '<i class="fa-solid fa-file-lines text-[8px] text-dim"></i>'}
                    ${this._esc(c.title)} ${isCurrent ? '(当前)' : ''}
                </div>
                <div class="text-[9px] text-dim mt-0.5">${(c.content||'').length}字 · ${c.status || 'outline'}</div>
            </div>`;
        });
        // 实体
        if (charItems.length > 0) {
            html += `<div class="text-[9px] text-dim font-bold uppercase mt-2 mb-1">关联实体</div>`;
            charItems.slice(0, 8).forEach(e => {
                html += `<div class="p-1.5 bg-black/20 rounded border border-white/5 text-[10px] flex items-center gap-1.5">
                    <span class="text-[8px] px-1 rounded bg-cyan-500/20 text-cyan-300">${e.type || '其他'}</span>
                    <span class="text-white font-bold">${this._esc(e.name)}</span>
                </div>`;
            });
        }
        // 世界观
        if (worldItems.length > 0) {
            html += `<div class="text-[9px] text-dim font-bold uppercase mt-2 mb-1">世界观</div>`;
            worldItems.slice(0, 4).forEach(e => {
                html += `<div class="p-1.5 bg-black/20 rounded border border-white/5 text-[10px]">
                    <span class="text-green-400 font-bold">${this._esc(e.name)}</span>
                    <div class="text-dim line-clamp-1">${(e.desc||'').slice(0, 40)}</div>
                </div>`;
            });
        }
        if (resultsEl) resultsEl.innerHTML = html || '<div class="text-center text-dim text-xs py-4">暂无关联数据</div>';
    },

    _clearContextTab() {
        const resultsEl = document.getElementById('w-ctx-results');
        if (resultsEl) resultsEl.innerHTML = '<div class="text-center text-dim text-xs py-4"><i class="fa-solid fa-link text-2xl mb-2 opacity-30"></i><div>已清空</div></div>';
    },

    async _searchContext() {
        const input = document.getElementById('w-ctx-search');
        const query = input ? input.value.trim() : '';
        if (!query) return;
        const resultsEl = document.getElementById('w-ctx-results');
        if (resultsEl) resultsEl.innerHTML = '<div class="text-center text-dim text-xs py-4"><i class="fa-solid fa-spinner fa-spin mr-1"></i>搜索中...</div>';
        
        const entities = await DB.getAll('entities') || [];
        const chapters = await DB.getAll('chapters') || [];
        const matches = [];
        entities.filter(e => (e.name||'').includes(query) || (e.desc||'').includes(query)).forEach(e => matches.push({type:'实体', title:e.name, desc:(e.desc||'').slice(0,60)}));
        chapters.filter(c => (c.title||'').includes(query) || (c.content||'').includes(query) || (c.outline||'').includes(query)).forEach(c => matches.push({type:'章节', title:c.title, desc:(c.content||c.outline||'').slice(0,60)}));
        
        if (resultsEl) {
            resultsEl.innerHTML = matches.length ? matches.map(m => `<div class="p-2 bg-black/20 rounded border border-white/5 text-[10px]">
                <span class="text-[8px] px-1 rounded ${m.type==='实体'?'bg-cyan-500/20 text-cyan-300':'bg-amber-500/20 text-amber-300'}">${m.type}</span>
                <span class="text-white font-bold ml-1">${this._esc(m.title)}</span>
                <div class="text-dim mt-0.5">${this._esc(m.desc)}</div>
            </div>`).join('') : '<div class="text-center text-dim text-xs py-4">无搜索结果</div>';
        }
    },

    _ctxFilter(type) {
        this._ctxCurrentFilter = type;
        this._loadContextTab();
    },

    async _injectContextToPrompt() {
        const ctx = this._getFusionContext() || '';
        const chap = this.currentChapterId ? await DB.get('chapters', this.currentChapterId) : null;
        let inject = '[关联上下文]\n';
        if (ctx) inject += ctx.slice(0, 1500) + '\n';
        if (chap && chap.outline) inject += '[本章大纲]\n' + chap.outline.slice(0, 500) + '\n';
        
        // 存入临时设置供续写使用
        const existing = await DB.get('settings', 'writer_context_inject') || {};
        await DB.put('settings', { id: 'writer_context_inject', content: inject, updatedAt: Date.now() });
        UI.toast('关联上下文已注入续写提示');
    },

    // ===== 文风Tab =====
    _loadStyleTab() {
        // 文风Tab加载时不需要额外操作，数据已保存在DOM中
    },

    // ===== AI助手Tab =====
    _assistantSelection: '',

    _updateAssistantSelection() {
        const editor = document.getElementById('w-editor');
        const sel = editor ? editor.value.substring(editor.selectionStart, editor.selectionEnd) : '';
        this._assistantSelection = sel;
        const box = document.getElementById('w-assist-selection-box');
        const text = document.getElementById('w-assist-selection');
        const len = document.getElementById('w-assist-sel-len');
        if (sel && sel.trim()) {
            if (box) box.classList.remove('hidden');
            if (text) text.textContent = sel;
            if (len) len.textContent = sel.length + '字';
        } else {
            if (box) box.classList.add('hidden');
        }
    },

    async _runAssistant(type) {
        const editor = document.getElementById('w-editor');
        const selected = this._assistantSelection || '';
        const content = editor ? editor.value : '';
        const customInput = document.getElementById('w-assist-in');
        const custom = customInput ? customInput.value.trim() : '';
        
        if (!content.trim() && !selected.trim()) return UI.toast('编辑器内容为空', 'error');
        
        const log = document.getElementById('w-assist-log');
        if (log) log.innerHTML += `<div class="p-1.5 bg-accent/10 rounded border border-accent/20"><span class="text-accent font-bold text-[9px]">操作</span><div class="text-gray-200 mt-0.5 text-[10px]">${type === 'custom' ? custom : type}</div></div>`;
        
        let instruction = '';
        switch(type) {
            case 'polish': instruction = '润色以下段落：优化句式、增强画面感、提升文采，保持原意不变。'; break;
            case 'expand': instruction = '拓展以下段落：增加细节描写、丰富感官体验、深化情绪层次，字数增加到原来的1.5-2倍。'; break;
            case 'continue': instruction = '根据上下文风格，继续写下去（约300-500字），保持节奏和人物一致性。'; break;
            case 'trim': instruction = '精简以下段落：删除冗余描述，保留核心情节和冲突，让文字更紧凑有力。'; break;
            case 'rewrite': instruction = '改写以下段落：用不同的表达方式重新组织，保留核心情节但改变叙述角度或节奏。'; break;
            case 'custom': instruction = custom || '请按用户要求处理以下内容。'; break;
        }
        
        const targetText = selected.trim() ? selected : content.slice(-1500);
        const prompt = `你是一位专业网文编辑。${instruction}

【待处理内容】
${targetText}

【要求】
- 直接输出处理后的文本，不要任何开场白
- 保持原有风格和人物设定一致
- 如果是续写，确保无缝衔接上文`;

        let result = '';
        await AI.generate(prompt, {}, c => { result += c; });
        
        if (log) log.innerHTML += `<div class="p-1.5 bg-white/5 rounded border border-white/5"><span class="text-green-400 font-bold text-[9px]">AI</span><div class="text-gray-300 mt-0.5 text-[10px] leading-relaxed">${result.slice(0, 200)}${result.length > 200 ? '...' : ''}</div></div>`;
        
        // 如果选中了文本，提供替换/插入选项
        if (selected.trim() && editor) {
            if (confirm('是否用AI结果替换选中的文本？\n（取消则复制到剪贴板）')) {
                const start = editor.selectionStart;
                const end = editor.selectionEnd;
                editor.value = editor.value.substring(0, start) + result + editor.value.substring(end);
                this.onInput();
            } else {
                await navigator.clipboard.writeText(result);
                UI.toast('已复制到剪贴板');
            }
        } else if (editor) {
            // 未选中则在末尾追加
            editor.value = editor.value + '\n\n' + result;
            this.onInput();
            UI.toast('已追加到正文末尾');
        }
        
        if (customInput) customInput.value = '';
        if (log) log.scrollTop = log.scrollHeight;
    },

    _assistantClear() {
        const log = document.getElementById('w-assist-log');
        if (log) log.innerHTML = '';
        this._assistantSelection = '';
        const box = document.getElementById('w-assist-selection-box');
        if (box) box.classList.add('hidden');
    },

    // ===== 诊断Tab增强：一致性检测 =====
    async _checkConsistency() {
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        if (!content.trim()) return UI.toast('编辑器内容为空', 'error');
        
        const resultEl = document.getElementById('w-diagnose-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-center text-dim py-4"><i class="fa-solid fa-spinner fa-spin text-xl mb-2"></i><div>正在检测上下文一致性...</div></div>';
        
        const allChaps = (await DB.getAll('chapters') || []).sort((a,b) => (a.order||0) - (b.order||0));
        const idx = allChaps.findIndex(c => c.id === this.currentChapterId);
        const prevChaps = allChaps.slice(Math.max(0, idx - 3), idx);
        const prevContext = prevChaps.map(c => `【${c.title}】\n${(c.content||'').slice(-500)}`).join('\n\n');
        const entities = await DB.getAll('entities') || [];
        const entityList = entities.filter(e => !e.id.startsWith('world_')).map(e => `${e.name}(${e.type})`).join('、');
        
        const prompt = `你是一位资深网文编辑，专门负责检查小说前后一致性。请对以下内容进行深度一致性检测。

【前文回顾（最近3章末尾）】
${prevContext.slice(0, 3000)}

【当前章节正文】
${content.slice(0, 4000)}

【已登记实体】
${entityList}

【检测维度】
1. **人物一致性**：角色性格、能力、行为模式是否前后一致？是否出现OOC（out of character）？
2. **设定一致性**：世界观规则、力量体系、地理设定是否前后矛盾？
3. **时间线一致性**：事件顺序、时间跨度是否合理？
4. **伏笔回收**：前文埋下的伏笔是否被提及或回收？
5. **逻辑一致性**：剧情推进是否合理？因果关系是否成立？
6. **称谓一致性**：同一角色/地点的称呼是否统一？

【输出格式】
### 总体评分：X/10
### 问题列表（按严重程度排序）
- [严重/中等/轻微] 具体问题描述 → 修复建议
### 未发现问题的维度
### 一句话总结

请用Markdown格式输出。`;

        let result = '';
        try {
            await AI.generate(prompt, {}, c => { result += c; });
            if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
            UI.toast('一致性检测完成');
        } catch(e) {
            if (resultEl) resultEl.innerHTML = `<div class="text-red-400 text-center py-4">检测中断：${e.message}</div>`;
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
            <div style="width:90%;max-width:700px;max-height:85vh;background:#111113;border:1px solid rgba(255,255,255,0.1);border-radius:12px;display:flex;flex-direction:column;overflow:hidden;">
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

    // ===== 获取文风提取提示词 =====
    _getStyleExtractPrompt(sourceText) {
        const customPrompt = this._stylePromptCustom || '';
        if (customPrompt.trim()) {
            return customPrompt.replace(/\{\{source\}\}/gi, sourceText.slice(0, 3000));
        }
        // 默认提示词
        return `你是一位专业的文学分析师，擅长分析文本的写作风格。请仔细分析以下原文的文风特征，并提取出可以用于指导AI写作的风格描述。

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
    },

    /** 一键智能诊断：综合分析正文质量 + 技法 + 节奏 */
    async _smartDiagnose() {
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        if (!content.trim()) return UI.toast('编辑器内容为空', 'error');

        const resultEl = document.getElementById('w-diagnose-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-center text-dim py-4"><i class="fa-solid fa-spinner fa-spin text-xl mb-2"></i><div>AI 正在全面诊断...</div></div>';

        const outline = (document.getElementById('w-outline') || {}).value || '';
        const fusionCtx = this._getFusionContext();
        const wordCount = content.length;

        const prompt = `你是一位资深网文编辑+读者体验分析师。请对以下内容进行「一键全面诊断」，输出必须实用、具体、可操作。

【章节信息】
字数：${wordCount} 字
大纲：${outline.slice(0, 500) || '无'}

【正文内容】
${content.slice(0, 6000)}

${fusionCtx ? `【融合技法参考】\n${fusionCtx.slice(0, 1500)}\n` : ''}

【诊断框架 — 请按以下5个维度输出】

### 1️⃣ 开篇吸引力（0-10分）
- 前200字是否能抓住读者？
- 问题与改进建议

### 2️⃣ 节奏与情绪（0-10分）
- 标注情绪高低点（一句话概括每200字的情绪）
- 是否有拖沓或跳脱？
- 爽点/钩子密度是否足够？

### 3️⃣ 描写质量（0-10分）
- 五感运用（视/听/嗅/味/触）
- 画面感强弱
- 是否有" telling 过多 "的问题？

### 4️⃣ 剧情结构（0-10分）
- 起承转合是否清晰
- 伏笔/悬念设置
- 与大纲的契合度

### 5️⃣ 综合评分与改进优先级
- 总分：/50
- Top 3 最优先改进点（具体到段落位置）
- 一句话总结：本章最大的亮点 + 最大的短板

请用清晰的Markdown格式输出。避免空泛评价，每个扣分点都要给出"怎么改"。`;

        let result = '';
        try {
            await AI.generate(prompt, {}, c => { result += c; });
            if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
            UI.toast('诊断完成');
        } catch(e) {
            if (resultEl) resultEl.innerHTML = `<div class="text-red-400 text-center py-4">诊断中断：${e.message}</div>`;
        }
    },

    /** 自定义需求诊断：用户输入自然语言指令 */
    async _customDiagnose() {
        const input = document.getElementById('w-diagnose-custom');
        const demand = input ? input.value.trim() : '';
        if (!demand) return UI.toast('请输入分析需求', 'error');

        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        if (!content.trim()) return UI.toast('编辑器内容为空', 'error');

        const resultEl = document.getElementById('w-diagnose-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-center text-dim py-4"><i class="fa-solid fa-spinner fa-spin text-xl mb-2"></i><div>正在分析「' + demand + '」...</div></div>';

        const outline = (document.getElementById('w-outline') || {}).value || '';
        const fusionCtx = this._getFusionContext();

        const prompt = `你是一位资深网文分析师。用户提出了以下分析需求：

【用户指令】
${demand}

【章节大纲】
${outline.slice(0, 1000) || '无'}

【正文内容】
${content.slice(0, 6000)}

${fusionCtx ? `【融合技法参考】\n${fusionCtx.slice(0, 1500)}\n` : ''}

【要求】
请严格按照用户的需求进行分析。输出要实用、具体、可操作。如果用户的问题不明确，请给出你最专业的解读。用 Markdown 格式输出。`;

        let result = '';
        try {
            await AI.generate(prompt, {}, c => { result += c; });
            if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
            UI.toast('分析完成');
            if (input) input.value = '';
        } catch(e) {
            if (resultEl) resultEl.innerHTML = `<div class="text-red-400 text-center py-4">分析中断：${e.message}</div>`;
        }
    },

    openSoloPromptModal() {
        const modal = document.createElement('div');
        modal.id = 'w-solo-prompt-modal';
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-[#1a1a2e] rounded-2xl border border-white/10 w-[700px] max-h-[85vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-5 py-3 border-b border-white/5">
                    <span class="font-bold text-white"><i class="fa-solid fa-wand-magic-sparkles mr-2 text-purple-400"></i>SOLO 自定义提示词</span>
                    <button class="text-dim hover:text-white" onclick="this.closest('#w-solo-prompt-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto p-5 space-y-4">
                    <div class="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <div class="text-sm font-bold text-purple-300 mb-1">自定义提示词模板</div>
                        <div class="text-[10px] text-dim">保存常用提示词，一键执行分析任务。支持变量：{{content}} = 当前正文，{{outline}} = 章节大纲</div>
                    </div>
                    
                    <div>
                        <div class="text-[10px] text-dim font-bold uppercase mb-1">提示词名称</div>
                        <input type="text" id="w-solo-name" class="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white" placeholder="例如：人物关系分析、场景描写优化...">
                    </div>
                    
                    <div>
                        <div class="text-[10px] text-dim font-bold uppercase mb-1">提示词内容</div>
                        <textarea id="w-solo-prompt" class="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-white min-h-[200px] font-mono" placeholder="输入你的自定义提示词...&#10;&#10;可用变量：&#10;{{content}} - 当前编辑器正文&#10;{{outline}} - 当前章节大纲&#10;{{title}} - 当前章节标题"></textarea>
                    </div>
                    
                    <div class="text-[10px] text-dim font-bold uppercase">已保存的提示词</div>
                    <div id="w-solo-saved-list" class="space-y-2 max-h-40 overflow-y-auto">
                        <div class="text-dim text-xs text-center py-2">加载中...</div>
                    </div>
                </div>
                <div class="flex gap-2 p-4 border-t border-white/5">
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
                <div class="flex items-center gap-2 p-2 bg-black/20 rounded-lg border border-white/5">
                    <span class="flex-1 text-xs text-white truncate">${p.name}</span>
                    <button class="text-purple-400 hover:text-purple-300 text-xs" onclick="Modules.writer._useSoloPrompt(${i})"><i class="fa-solid fa-play"></i></button>
                    <button class="text-dim hover:text-white text-xs" onclick="Modules.writer._editSoloPrompt(${i})"><i class="fa-solid fa-pen"></i></button>
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
            .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/^### (.+)$/gm, '<h4 class="text-accent font-bold mt-4 mb-2">$1</h4>')
            .replace(/^## (.+)$/gm, '<h3 class="text-white font-bold mt-4 mb-2">$1</h3>')
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
    },

    async _syncToWorldEngine() {
        if(!this.currentChapterId) return;
        const chap = await DB.get('chapters', this.currentChapterId);
        if(!chap) return;

        const content = chap.content || '';
        if(content.length < 50) {
            UI.toast('内容过短，跳过世界引擎同步');
            return;
        }

        UI.toast('正在同步到世界引擎...');
        try {
            const extractedEntities = await this._extractEntitiesFromContent(content, chap.title);
            const chapterData = {
                chapterId: chap.id,
                title: chap.title,
                order: chap.order,
                content: content,
                outline: chap.outline || '',
                extractedEntities: extractedEntities || []
            };
            await Modules.world_engine.syncFromWriter(chapterData);
            UI.toast('已同步到世界引擎', 'success');
        } catch(e) {
            console.error('[Writer] syncToWorldEngine failed:', e);
            UI.toast('同步失败: ' + e.message, 'error');
        }
    },
};
