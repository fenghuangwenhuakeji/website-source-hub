// ========== 凤凰创作流 (深度绑定融合拆书 · 大幅强化) ==========
// 核心: 流水线数据(融合精华+技法分析+对比结论) → 驱动细纲生成 → 导入长篇执笔
Modules.phoenix = {
    step: 0,
    data: { idea:'', genre:'', style:'', outlineRaw:'', worldContext:'', fusionContext:'' },
    _generating: false,
    _activeTab: 'preview', // preview | fusion | pipeline | chat | io
    steps: [
        { title: '灵感细纲', icon: 'fa-lightbulb', desc: '融合拆书精华 + 创意 → AI细纲' },
        { title: '大纲编织', icon: 'fa-sitemap', desc: '编辑优化，提取实体注入世界引擎' },
        { title: '进入执笔', icon: 'fa-feather-pointed', desc: '同步细纲+实体到长篇执笔' }
    ],
    presets: [
        {name:'玄幻修仙', genre:'玄幻修仙', style:'热血、升级、宏大'},
        {name:'都市异能', genre:'都市异能', style:'爽文、快节奏、反转'},
        {name:'赛博朋克', genre:'赛博朋克', style:'暗黑、科技、哲思'},
        {name:'古风宫斗', genre:'古风宫斗', style:'权谋、细腻、悬疑'},
        {name:'末日废土', genre:'末日废土', style:'生存、硬核、人性'},
        {name:'悬疑推理', genre:'悬疑推理', style:'烧脑、反转、逻辑'},
        {name:'甜宠言情', genre:'甜宠言情', style:'轻松、甜蜜、治愈'},
        {name:'历史架空', genre:'历史架空', style:'厚重、权谋、史诗'}
    ],
    creativeTemplates: [
        { name: '重生复仇', template: '主角重生回到过去，带着前世记忆，一步步复仇，打脸曾经看不起他的人...' },
        { name: '废柴逆袭', template: '主角被认定为废柴，意外获得金手指/传承，从此一路逆袭，震惊所有人...' },
        { name: '系统流', template: '主角获得神秘系统，完成任务获得奖励，不断变强，最终站在巅峰...' },
        { name: '穿越异界', template: '主角穿越到异世界，带着现代知识/金手指，在异世界闯出一片天地...' },
        { name: '都市修仙', template: '修仙者回归都市，隐藏身份，却不断被卷入各种事件，展现实力震惊四座...' },
        { name: '无限流', template: '主角被卷入无限轮回世界，在各种副本中生存、成长，揭开轮回的真相...' }
    ],
    hookTemplates: [
        { type: '开篇钩子', examples: ['重生时刻', '金手指激活', '打脸现场', '危机降临', '命运转折'] },
        { type: '悬念钩子', examples: ['身份之谜', '隐藏势力', '未解之谜', '背叛疑云', '惊天秘密'] },
        { type: '爽点钩子', examples: ['装逼打脸', '实力碾压', '众人震惊', '逆袭翻盘', '收获满满'] }
    ],

    // ===== 获取流水线状态摘要 =====
    _getPipelineStatus() {
        const FB = Modules.fusion_book;
        if (!FB) return { hasData: false };
        const allPr = FB._allPipelineResults || {};
        const pr = FB._pipelineResults || {};
        const merged = {};
        ['left','right','compare','fusion','world','outline','write'].forEach(k => {
            merged[k] = (allPr[k] && allPr[k].trim()) ? allPr[k] : (pr[k] || '');
        });
        
        // ★ 如果内存中没有融合精华，用缓存的DB数据
        if (!merged.fusion && this._cachedFusion) merged.fusion = this._cachedFusion;
        
        const hasData = !!(merged.left || merged.right || merged.compare || merged.fusion || merged.world || merged.outline || merged.write);
        const running = !!FB._pipelineRunning;
        // ★ 主辅锚定信息
        const primaryBook = FB._primaryBook || 'left';
        const primarySettings = FB._primarySettings;
        const primaryName = primarySettings?.bookName || (primaryBook === 'left' ? '左书' : '右书');
        const secondaryName = primaryBook === 'left' ? '右书' : '左书';
        const steps = [];
        if (merged.left) steps.push({ key:'left', label:'左书拆解', len: merged.left.length });
        if (merged.right) steps.push({ key:'right', label:'右书拆解', len: merged.right.length });
        if (merged.compare) steps.push({ key:'compare', label:'对比结论', len: merged.compare.length });
        if (merged.fusion) steps.push({ key:'fusion', label:`融合精华(主:${primaryName})`, len: merged.fusion.length });
        if (merged.world) steps.push({ key:'world', label:'实体提取', len: merged.world.length });
        if (merged.outline) steps.push({ key:'outline', label:'细纲', len: merged.outline.length });
        if (merged.write) steps.push({ key:'write', label:'正文', len: merged.write.length });
        return { hasData, running, steps, results: merged, primaryBook: primaryName, secondaryBook: secondaryName };
    },
    _cachedFusion: null,

    // ★ 初始化: 从DB加载持久化的融合精华
    async init() {
        try {
            const saved = await DB.get('settings', 'pipeline_fusion_context');
            if (saved && saved.content) this._cachedFusion = saved.content;
        } catch(e) {}
    },

    // ===== 获取融合拆书全量上下文(用于AI生成) =====
    _getFusionFullContext() {
        const ps = this._getPipelineStatus();
        if (!ps.hasData) return '';
        let ctx = '[技法来源声明] 以下内容全部来自拆书融合的"去内容化"通用写作技法模板，严禁复用原书的角色、情节、场景。目标是：同样的技法，完全不同的故事。\n\n';
        if (ps.results.fusion) ctx += '【融合技法精华（通用模板）】\n' + ps.results.fusion.slice(0, 4000) + '\n\n';
        if (ps.results.compare) ctx += '【技法对比（去内容化）】\n' + ps.results.compare.slice(0, 2000) + '\n\n';
        if (ps.results.left) ctx += '【左书技法拆解】\n' + ps.results.left.slice(0, 2000) + '\n\n';
        if (ps.results.right) ctx += '【右书技法拆解】\n' + ps.results.right.slice(0, 2000) + '\n\n';
        return ctx;
    },

    render() {
        const ps = this._getPipelineStatus();
        return `
        <div class="flex h-full bg-[#08080a] overflow-hidden">
            <!-- Left: Stepper -->
            <div class="w-64 shrink-0 flex flex-col bg-[#111113] border-r border-white/5">
                <div class="p-5 border-b border-white/5 bg-[#0d0d0f]">
                    <div class="flex items-center gap-2 mb-1">
                        <i class="fa-solid fa-fire-flame-curved text-accent text-lg"></i>
                        <span class="font-bold text-white text-lg">凤凰创作流</span>
                    </div>
                    <span class="text-[10px] text-dim">融合拆书精华 → 驱动创作</span>
                </div>
                <div class="flex-1 p-4 flex flex-col gap-3">
                    ${this.steps.map((s, i) => `
                        <div class="p-4 rounded-xl border transition-all cursor-pointer ${i === this.step ? 'bg-accent/10 border-accent/30 shadow-[0_0_20px_rgba(255,215,0,0.1)]' : i < this.step ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-transparent'}" onclick="Modules.phoenix.goStep(${i})">
                            <div class="flex items-center gap-3 mb-1">
                                <div class="w-8 h-8 rounded-full flex center text-sm font-bold ${i === this.step ? 'bg-accent text-black' : i < this.step ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-dim'}">
                                    ${i < this.step ? '<i class="fa-solid fa-check text-xs"></i>' : (i + 1)}
                                </div>
                                <span class="font-bold ${i === this.step ? 'text-white' : 'text-dim'}">${s.title}</span>
                            </div>
                            <div class="text-[10px] text-dim ml-11">${s.desc}</div>
                        </div>
                    `).join('')}

                    <!-- 融合拆书数据状态 -->
                    <div class="mt-auto space-y-2 border-t border-white/5 pt-3">
                        <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-1">
                            <i class="fa-solid fa-book-open-reader mr-1 ${ps.running ? 'text-red-400 animate-pulse' : ps.hasData ? 'text-green-400' : 'text-dim'}"></i>融合拆书数据
                        </div>
                        ${ps.hasData ? ps.steps.map(s => `
                            <div class="flex items-center gap-2 text-[10px] text-green-400 cursor-pointer hover:text-green-300" onclick="Modules.phoenix._viewPipelineStep('${s.key}')">
                                <i class="fa-solid fa-check-circle w-4 text-center"></i>
                                <span>${s.label}</span>
                                <span class="ml-auto text-dim">${s.len}字</span>
                            </div>
                        `).join('') : `
                            <div class="text-[10px] text-dim">暂无数据 — <span class="text-amber-400 cursor-pointer hover:underline" onclick="App.nav('fusion_book')">前往融合拆书</span></div>
                        `}
                        ${ps.running ? '<div class="text-[10px] text-red-400 animate-pulse">● 流水线运行中...</div>' : ''}
                        <div class="flex items-center gap-2 text-[10px] ${this.data.worldContext ? 'text-green-400' : 'text-dim'}">
                            <i class="fa-solid fa-atom w-4 text-center"></i>
                            <span>世界引擎</span>
                            <span class="ml-auto">${this.data.worldContext ? '✓' : '—'}</span>
                        </div>
                    </div>
                </div>
                <div class="p-4 border-t border-white/5 bg-[#0d0d0f] space-y-2">
                    <button class="btn w-full h-10 btn-primary font-bold" onclick="Modules.phoenix.next()">
                        ${this.step === 1 ? '<i class="fa-solid fa-rocket mr-2"></i>进入执笔' : (this.step === 2 ? '<i class="fa-solid fa-check mr-2"></i>确认导入' : '下一步 <i class="fa-solid fa-arrow-right ml-2"></i>')}
                    </button>
                    <button class="btn w-full h-9 bg-white/5 text-dim hover:text-white" onclick="Modules.phoenix.prev()" ${this.step === 0 ? 'disabled style="opacity:0.3"' : ''}>
                        <i class="fa-solid fa-arrow-left mr-2"></i>上一步
                    </button>
                </div>
            </div>
            <!-- Right: Workspace -->
            <div class="flex-1 flex flex-col min-w-0" id="ph-content">
                ${this.renderStep(this.step)}
            </div>
        </div>`;
    },

    renderStep(step) {
        if (step === 0) return this._renderStep0();
        if (step === 1) return this._renderStep1();
        if (step === 2) return this._renderStep2();
        return '';
    },

    _renderStep0() {
        const ps = this._getPipelineStatus();
        const hasFusion = !!(ps.results && ps.results.fusion);
        return `
            <div class="flex-1 flex min-h-0 animate-fade-in">
                <!-- Input Side -->
                <div class="flex-1 flex flex-col border-r border-white/5 min-w-0">
                    <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                        <span class="text-xs font-bold text-accent uppercase tracking-wider"><i class="fa-solid fa-brain mr-1"></i>核心创意</span>
                        <div class="flex gap-2">
                            <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30" onclick="Modules.phoenix.importFromPipeline()" title="从流水线导入细纲"><i class="fa-solid fa-rocket mr-1"></i>导入流水线</button>
                            <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.phoenix.pullWorldEngine()" title="从世界引擎拉取设定"><i class="fa-solid fa-atom mr-1"></i>拉取世界</button>
                            <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.phoenix.pullFusionBook()" title="从融合拆书拉取精华"><i class="fa-solid fa-book-open-reader mr-1"></i>拉取拆书</button>
                            <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.short.openPromptModal('phoenix_outline')" title="配置提示词"><i class="fa-solid fa-gear"></i></button>
                        </div>
                    </div>
                    <!-- 融合技法驱动提示 -->
                    ${hasFusion ? `
                    <div class="px-5 pt-3 pb-1 shrink-0">
                        <div class="p-3 rounded-lg bg-gradient-to-r from-amber-900/20 to-red-900/20 border border-amber-500/20">
                            <div class="flex items-center gap-2 mb-1.5">
                                <i class="fa-solid fa-wand-magic-sparkles text-amber-400"></i>
                                <span class="text-[11px] font-bold text-amber-300">融合技法已就绪</span>
                                <span class="text-[9px] text-dim ml-auto">${(ps.results.fusion||'').length}字精华</span>
                            </div>
                            <div class="text-[10px] text-dim leading-relaxed mb-2">${(ps.results.fusion||'').slice(0,150).replace(/\n/g,' ')}...</div>
                            <div class="flex gap-1.5">
                                <button class="btn btn-xs bg-amber-600/30 text-amber-300 border-amber-500/30 flex-1 font-bold" onclick="Modules.phoenix.fusionDrivenGen()"><i class="fa-solid fa-bolt mr-1"></i>技法驱动生成</button>
                                <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.phoenix.tab('fusion')"><i class="fa-solid fa-eye mr-1"></i>查看全文</button>
                            </div>
                        </div>
                    </div>` : `
                    <div class="px-5 pt-3 pb-1 shrink-0">
                        <div class="p-3 rounded-lg bg-white/3 border border-white/5 flex items-center gap-3">
                            <i class="fa-solid fa-info-circle text-dim"></i>
                            <span class="text-[10px] text-dim flex-1">先在「融合拆书」运行流水线，获取技法精华后可使用「技法驱动生成」</span>
                            <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="App.nav('fusion_book')">前往</button>
                        </div>
                    </div>`}
                    <!-- 类型预设 -->
                    <div class="px-5 pt-2 pb-1 shrink-0">
                        <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-2">快速预设</div>
                        <div class="flex flex-wrap gap-1.5">
                            ${this.presets.map(p => `<button class="px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${this.data.genre===p.genre ? 'bg-accent/20 text-accent border-accent/30' : 'bg-white/5 text-dim border-transparent hover:bg-white/10 hover:text-white'}" onclick="Modules.phoenix.applyPreset('${p.genre}','${p.style}')">${p.name}</button>`).join('')}
                        </div>
                    </div>
                    <!-- 创意模板 -->
                    <div class="px-5 pt-2 pb-1 shrink-0">
                        <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-2"><i class="fa-solid fa-wand-magic-sparkles mr-1 text-purple-400"></i>创意模板</div>
                        <div class="flex flex-wrap gap-1.5">
                            ${this.creativeTemplates.map(t => `<button class="px-2 py-0.5 rounded text-[9px] border transition-all bg-purple-500/10 text-purple-300 border-purple-500/20 hover:bg-purple-500/20 hover:text-white" onclick="Modules.phoenix.applyCreativeTemplate('${t.name}')">${t.name}</button>`).join('')}
                        </div>
                    </div>
                    <!-- 钩子设计 -->
                    <div class="px-5 pt-2 pb-1 shrink-0">
                        <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-2"><i class="fa-solid fa-anchor mr-1 text-cyan-400"></i>钩子设计</div>
                        <div class="flex gap-2">
                            ${this.hookTemplates.map(h => `
                                <div class="flex-1 bg-black/20 rounded p-2 border border-white/5">
                                    <div class="text-[9px] font-bold text-cyan-400 mb-1">${h.type}</div>
                                    <div class="flex flex-wrap gap-1">
                                        ${h.examples.slice(0,3).map(e => `<span class="text-[8px] bg-cyan-500/10 text-cyan-300 px-1.5 py-0.5 rounded cursor-pointer hover:bg-cyan-500/20" onclick="Modules.phoenix.addHook('${e}')">${e}</span>`).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <!-- AI快捷优化 -->
                    <div class="px-5 pt-2 pb-1 shrink-0">
                        <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-1.5"><i class="fa-solid fa-wand-magic-sparkles mr-1 text-accent"></i>AI 快捷优化</div>
                        <div class="grid grid-cols-5 gap-1">
                            <button class="btn btn-xs bg-white/5 text-dim hover:bg-accent/20 hover:text-accent border border-white/5" onclick="Modules.phoenix._quickOptimize('expand')" title="扩写当前卷"><i class="fa-solid fa-expand mr-0.5"></i>扩写</button>
                            <button class="btn btn-xs bg-white/5 text-dim hover:bg-accent/20 hover:text-accent border border-white/5" onclick="Modules.phoenix._quickOptimize('hook')" title="增加悬念钩子"><i class="fa-solid fa-anchor mr-0.5"></i>加钩子</button>
                            <button class="btn btn-xs bg-white/5 text-dim hover:bg-accent/20 hover:text-accent border border-white/5" onclick="Modules.phoenix._quickOptimize('cool')" title="增加爽点"><i class="fa-solid fa-bolt mr-0.5"></i>加爽点</button>
                            <button class="btn btn-xs bg-white/5 text-dim hover:bg-accent/20 hover:text-accent border border-white/5" onclick="Modules.phoenix._quickOptimize('trim')" title="精简冗余"><i class="fa-solid fa-scissors mr-0.5"></i>精简</button>
                            <button class="btn btn-xs bg-white/5 text-dim hover:bg-accent/20 hover:text-accent border border-white/5" onclick="Modules.phoenix._quickOptimize('custom')" title="自定义优化"><i class="fa-solid fa-pen mr-0.5"></i>自定义</button>
                        </div>
                    </div>
                    <!-- Fields -->
                    <div class="px-5 py-2 space-y-2 shrink-0">
                        <div class="grid grid-cols-2 gap-3">
                            <div class="flex flex-col gap-1">
                                <label class="text-[10px] text-dim font-bold uppercase">类型</label>
                                <input class="input bg-black/30 border-white/10 h-9 text-sm" id="ph-genre" placeholder="例如：赛博修仙" value="${this.data.genre || ''}">
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-[10px] text-dim font-bold uppercase">风格/基调</label>
                                <input class="input bg-black/30 border-white/10 h-9 text-sm" id="ph-style" placeholder="例如：热血、暗黑" value="${this.data.style || ''}">
                            </div>
                        </div>
                    </div>
                    <!-- 注入素材预览 -->
                    ${(this.data.worldContext || this.data.fusionContext) ? `
                    <div class="px-5 pb-2 shrink-0">
                        <details class="bg-black/20 rounded-lg border border-white/5">
                            <summary class="px-3 py-2 text-[10px] text-dim font-bold uppercase cursor-pointer hover:text-white">
                                <i class="fa-solid fa-layer-group mr-1 text-accent"></i>已注入素材 (${this.data.worldContext ? '世界' : ''}${this.data.worldContext && this.data.fusionContext ? '+' : ''}${this.data.fusionContext ? '拆书' : ''})
                            </summary>
                            <div class="px-3 pb-3 text-[10px] text-dim max-h-32 overflow-y-auto font-mono leading-relaxed">${(this.data.worldContext || '').slice(0,300)}${this.data.fusionContext ? '\n---\n' + (this.data.fusionContext || '').slice(0,300) : ''}</div>
                        </details>
                    </div>` : ''}
                    <!-- Idea Textarea -->
                    <div class="flex-1 flex flex-col px-5 pb-3 min-h-0">
                        <label class="text-[10px] text-dim font-bold uppercase mb-1">核心脑洞 / 故事梗概</label>
                        <textarea class="flex-1 bg-black/20 border border-white/5 rounded-lg p-4 text-sm text-gray-200 resize-none leading-relaxed focus:border-accent/30" id="ph-idea" placeholder="描述你心中那个最狂野的脑洞...">${this.data.idea || ''}</textarea>
                    </div>
                    <!-- Action Buttons -->
                    <div class="px-5 pb-4 shrink-0">
                        <div class="flex gap-2">
                            <button class="btn btn-primary flex-1 h-11 font-bold" onclick="Modules.phoenix.smartGen()" id="ph-gen-btn"><i class="fa-solid fa-bolt mr-2"></i>生成细纲</button>
                            <button class="btn h-11 bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600 hover:text-white hidden" id="ph-stop-btn" onclick="Modules.phoenix.stopGen()"><i class="fa-solid fa-stop"></i></button>
                        </div>
                        <div class="text-[9px] text-dim mt-1.5 text-center">首次点击生成，已有内容时自动续写。下方快捷按钮可一键优化。</div>
                    </div>
                </div>
                <!-- Output Side -->
                <div class="flex-1 flex flex-col min-w-0">
                    ${this._renderOutputTabs()}
                </div>
            </div>`;
    },

    _renderOutputTabs() {
        const ps = this._getPipelineStatus();
        const t = this._activeTab;
        const hasFusion = !!(ps.results && ps.results.fusion);
        return `
                    <div class="h-11 flex items-center bg-[#0d0d0f] border-b border-white/5 shrink-0">
                        <div id="ph-tab-btn-preview" class="tab-btn flex-1 p-2.5 text-[10px] font-bold text-center cursor-pointer ${t==='preview'?'active':''}" onclick="Modules.phoenix.tab('preview')">生成预览</div>
                        <div id="ph-tab-btn-fusion" class="tab-btn flex-1 p-2.5 text-[10px] font-bold text-center cursor-pointer ${t==='fusion'?'active':''} ${hasFusion?'text-amber-400':''}" onclick="Modules.phoenix.tab('fusion')">
                            <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>融合${hasFusion?' ✓':''}
                        </div>
                        <div id="ph-tab-btn-pipeline" class="tab-btn flex-1 p-2.5 text-[10px] font-bold text-center cursor-pointer ${t==='pipeline'?'active':''} ${ps.hasData?'text-red-400':''}" onclick="Modules.phoenix.tab('pipeline')">
                            <i class="fa-solid fa-rocket mr-1"></i>流水线${ps.hasData?' ('+ps.steps.length+')':''}
                        </div>
                    </div>
                    <!-- Preview Tab -->
                    <div id="ph-tab-preview" class="flex-1 flex flex-col min-h-0 ${t!=='preview'?'hidden':''}">
                        <!-- 生成进度条 -->
                        <div id="ph-gen-progress" class="hidden bg-gradient-to-r from-accent/10 to-green-500/10 border-b border-accent/20 px-4 py-2 shrink-0">
                            <div class="flex items-center justify-between mb-1.5">
                                <div class="flex items-center gap-2">
                                    <i class="fa-solid fa-spinner fa-spin text-accent text-[10px]"></i>
                                    <span id="ph-gen-status" class="text-[11px] font-bold text-accent">正在生成细纲...</span>
                                </div>
                                <span id="ph-gen-counter" class="text-[10px] text-dim font-mono">0 字 · 0 章</span>
                            </div>
                            <div class="w-full h-1 bg-black/30 rounded-full overflow-hidden">
                                <div id="ph-gen-bar" class="h-full bg-gradient-to-r from-accent to-green-400 transition-all duration-500" style="width:0%"></div>
                            </div>
                        </div>
                        <div class="flex items-center justify-between px-4 py-1 bg-black/20 border-b border-white/5 shrink-0">
                            <span class="text-[10px] text-dim font-mono" id="ph-outline-stats">${(this.data.outlineRaw||'').length} 字 · ${((this.data.outlineRaw||'').match(/###/g)||[]).length} 章</span>
                            <div class="flex gap-1 flex-wrap">
                                <div class="relative group">
                                    <button class="btn btn-xs bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-indigo-400 border-indigo-500/30 font-bold"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>智能优化 ▾</button>
                                    <div class="hidden group-hover:flex absolute right-0 top-full z-20 flex-col gap-0.5 mt-0.5 p-1 bg-[#1a1a1e] border border-white/10 rounded-lg shadow-xl min-w-[140px]">
                                        <button class="text-left px-2 py-1 rounded text-[10px] text-dim hover:bg-white/5 hover:text-white" onclick="Modules.phoenix.iterateOutline()">🔄 迭代优化</button>
                                        <button class="text-left px-2 py-1 rounded text-[10px] text-dim hover:bg-white/5 hover:text-white" onclick="Modules.phoenix.fusionRefine()">✨ 融合润色</button>
                                        <button class="text-left px-2 py-1 rounded text-[10px] text-dim hover:bg-white/5 hover:text-white" onclick="Modules.phoenix.nexusEnhance()">⚡ NEXUS强化</button>
                                        <button class="text-left px-2 py-1 rounded text-[10px] text-dim hover:bg-white/5 hover:text-white" onclick="Modules.phoenix.nexusSelfCheck()">🛡 NEXUS自检</button>
                                    </div>
                                </div>
                                <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.phoenix.exportToLib()"><i class="fa-solid fa-book-open mr-1"></i>存阅读</button>
                                <button class="btn btn-xs bg-white/5 text-dim" onclick="Utils.copy(document.getElementById('ph-outline-raw').value)"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                            </div>
                        </div>
                        <textarea class="flex-1 w-full bg-transparent border-none p-6 font-mono text-sm leading-loose text-gray-300 resize-none focus:outline-none min-h-0" id="ph-outline-raw" placeholder="AI 正在等待指令..." oninput="Modules.phoenix._updateStats()">${this.data.outlineRaw || ''}</textarea>
                        <!-- 内联AI对话 -->
                        <div class="shrink-0 border-t border-white/5 bg-[#0a0a0c]">
                            <div id="ph-inline-chat-log" class="max-h-32 overflow-y-auto px-4 py-2 text-xs space-y-2"></div>
                            <div class="flex gap-2 px-4 py-2">
                                <input id="ph-inline-chat-in" class="input flex-1 h-8 text-xs bg-black/40 border-white/10" placeholder="描述你想怎么改大纲，AI会帮你调整..." onkeydown="if(event.key==='Enter')Modules.phoenix.sendInlineChat()">
                                <button class="btn btn-xs btn-primary px-3" onclick="Modules.phoenix.sendInlineChat()"><i class="fa-solid fa-paper-plane"></i></button>
                            </div>
                        </div>
                    </div>
                    <!-- Fusion Tab (融合精华对照) -->
                    <div id="ph-tab-fusion" class="flex-1 flex flex-col min-h-0 ${t!=='fusion'?'hidden':''}">
                        ${this._renderFusionTab()}
                    </div>
                    <!-- Pipeline Data Tab -->
                    <div id="ph-tab-pipeline" class="flex-1 flex flex-col min-h-0 ${t!=='pipeline'?'hidden':''}">
                        ${this._renderPipelineTab()}
                    </div>
`;
    },

    // ===== 融合精华 Tab — 左右对照融合数据 =====
    _renderFusionTab() {
        const ps = this._getPipelineStatus();
        if (!ps.hasData || !ps.results.fusion) {
            return `
                <div class="flex-1 flex items-center justify-center">
                    <div class="text-center max-w-md">
                        <div class="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex center mx-auto mb-4">
                            <i class="fa-solid fa-wand-magic-sparkles text-2xl text-amber-400"></i>
                        </div>
                        <div class="text-sm text-dim mb-2">暂无融合精华</div>
                        <div class="text-[10px] text-dim mb-4">请先在「融合拆书」中运行流水线，<br>完成拆解→对比→融合后数据将自动同步。</div>
                        <button class="btn btn-sm bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="App.nav('fusion_book')"><i class="fa-solid fa-book-open-reader mr-1"></i>前往融合拆书</button>
                    </div>
                </div>`;
        }
        const r = ps.results;
        return `
                <div class="flex h-full min-h-0">
                    <!-- 左: 融合精华全文 -->
                    <div class="flex-1 flex flex-col border-r border-white/5 min-w-0">
                        <div class="h-9 flex items-center px-4 bg-amber-900/10 border-b border-amber-500/10 shrink-0">
                            <i class="fa-solid fa-wand-magic-sparkles text-amber-400 mr-2 text-[10px]"></i>
                            <span class="text-[10px] font-bold text-amber-300">融合技法精华</span>
                            <span class="text-[9px] text-dim ml-auto">${(r.fusion||'').length}字</span>
                            <button class="btn btn-xs bg-white/5 text-dim ml-2" onclick="Utils.copy(Modules.phoenix._getPipelineStatus().results.fusion||'')"><i class="fa-solid fa-copy"></i></button>
                        </div>
                        <div class="flex-1 p-4 overflow-y-auto text-xs text-gray-300 font-mono leading-relaxed whitespace-pre-wrap">${r.fusion || ''}</div>
                    </div>
                    <!-- 右: 对比结论 + 左右摘要 -->
                    <div class="w-80 shrink-0 flex flex-col min-h-0">
                        <div class="h-9 flex items-center px-4 bg-blue-900/10 border-b border-blue-500/10 shrink-0">
                            <i class="fa-solid fa-scale-balanced text-blue-400 mr-2 text-[10px]"></i>
                            <span class="text-[10px] font-bold text-blue-300">对比 & 拆解摘要</span>
                        </div>
                        <div class="flex-1 overflow-y-auto p-3 space-y-3">
                            ${r.compare ? `<div>
                                <div class="text-[9px] font-bold text-amber-400 uppercase mb-1"><i class="fa-solid fa-scale-balanced mr-1"></i>对比结论</div>
                                <div class="text-[10px] text-dim leading-relaxed bg-black/20 rounded p-2 border border-white/5 max-h-40 overflow-y-auto">${r.compare.slice(0,800)}</div>
                            </div>` : ''}
                            ${r.left ? `<div>
                                <div class="text-[9px] font-bold text-blue-400 uppercase mb-1"><i class="fa-solid fa-a mr-1"></i>左书拆解</div>
                                <div class="text-[10px] text-dim leading-relaxed bg-black/20 rounded p-2 border border-white/5 max-h-32 overflow-y-auto">${r.left.slice(0,500)}</div>
                            </div>` : ''}
                            ${r.right ? `<div>
                                <div class="text-[9px] font-bold text-pink-400 uppercase mb-1"><i class="fa-solid fa-b mr-1"></i>右书拆解</div>
                                <div class="text-[10px] text-dim leading-relaxed bg-black/20 rounded p-2 border border-white/5 max-h-32 overflow-y-auto">${r.right.slice(0,500)}</div>
                            </div>` : ''}
                        </div>
                        <div class="p-2 border-t border-white/5 space-y-1 shrink-0">
                            <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full" onclick="Modules.phoenix.fusionDrivenGen()"><i class="fa-solid fa-bolt mr-1"></i>用融合技法生成细纲</button>
                            <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30 w-full" onclick="Modules.phoenix.importFromPipeline()"><i class="fa-solid fa-file-import mr-1"></i>直接导入为细纲</button>
                        </div>
                    </div>
                </div>`;
    },

    // ===== 流水线数据 Tab =====
    _renderPipelineTab() {
        const ps = this._getPipelineStatus();
        if (!ps.hasData) {
            return `
                <div class="flex-1 flex items-center justify-center">
                    <div class="text-center max-w-md">
                        <div class="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex center mx-auto mb-4">
                            <i class="fa-solid fa-rocket text-2xl text-dim"></i>
                        </div>
                        <div class="text-sm text-dim mb-2">暂无流水线数据</div>
                        <div class="text-[10px] text-dim mb-4">请先在「融合拆书」中运行一键自动化流水线，<br>完成后数据将自动同步到此处。</div>
                        <button class="btn btn-sm bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="App.nav('fusion_book')"><i class="fa-solid fa-book-open-reader mr-1"></i>前往融合拆书</button>
                    </div>
                </div>`;
        }
        const colors = { left:'blue', right:'pink', compare:'amber', fusion:'green', world:'cyan', outline:'orange', write:'purple' };
        const icons = { left:'fa-a', right:'fa-b', compare:'fa-scale-balanced', fusion:'fa-wand-magic-sparkles', world:'fa-atom', outline:'fa-feather-pointed', write:'fa-pen-nib' };
        return `
                <div class="flex h-full min-h-0">
                    <div class="w-52 shrink-0 bg-[#0d0d0f] border-r border-white/5 overflow-y-auto p-2 space-y-1">
                        <div class="text-[9px] text-dim font-bold uppercase tracking-wider px-2 py-1">流水线结果 (${ps.steps.length}项)</div>
                        ${ps.steps.map(s => `
                            <button class="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-[11px] font-bold transition-all hover:bg-white/5 border border-transparent hover:border-white/10 text-${colors[s.key]}-400" onclick="Modules.phoenix._viewPipelineStep('${s.key}')" id="ph-pp-btn-${s.key}">
                                <i class="fa-solid ${icons[s.key]} w-4 text-center text-[10px]"></i>
                                <span class="flex-1 truncate">${s.label}</span>
                                <span class="text-[9px] text-dim">${s.len}字</span>
                            </button>
                        `).join('')}
                        <div class="border-t border-white/5 mt-2 pt-2 px-1 space-y-1">
                            <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30 w-full" onclick="Modules.phoenix.importFromPipeline()"><i class="fa-solid fa-file-import mr-1"></i>转为细纲</button>
                            <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 w-full" onclick="Modules.phoenix._exportPipelineAll()"><i class="fa-solid fa-book-open mr-1"></i>全部存阅读</button>
                        </div>
                    </div>
                    <div class="flex-1 flex flex-col min-w-0">
                        <div class="h-9 flex items-center px-4 bg-black/30 border-b border-white/5 shrink-0">
                            <span class="text-[10px] font-bold text-dim uppercase" id="ph-pp-title">选择左侧步骤查看内容</span>
                            <div class="ml-auto flex gap-1">
                                <button class="btn btn-xs bg-white/5 text-dim" onclick="Utils.copy(document.getElementById('ph-pp-content').value)"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                                <button class="btn btn-xs bg-accent/20 text-accent" onclick="Modules.phoenix._pipelineToOutline()"><i class="fa-solid fa-arrow-right mr-1"></i>追加到细纲</button>
                            </div>
                        </div>
                        <textarea class="flex-1 w-full bg-transparent border-none p-5 font-mono text-sm leading-relaxed text-gray-300 resize-none focus:outline-none" id="ph-pp-content" readonly placeholder="选择左侧步骤查看流水线结果..."></textarea>
                    </div>
                </div>`;
    },

    _viewPipelineStep(key) {
        const ps = this._getPipelineStatus();
        if (!ps.results[key]) return;
        const labels = { left:'左书拆解', right:'右书拆解', compare:'对比结论', fusion:'融合精华', world:'实体提取', outline:'细纲', write:'正文' };
        const el = document.getElementById('ph-pp-content');
        const title = document.getElementById('ph-pp-title');
        if (el) el.value = ps.results[key];
        if (title) title.textContent = labels[key] + ' (' + ps.results[key].length + '字)';
        document.querySelectorAll('[id^="ph-pp-btn-"]').forEach(btn => {
            btn.classList.remove('bg-white/10', 'border-white/10');
            btn.classList.add('border-transparent');
        });
        const activeBtn = document.getElementById('ph-pp-btn-' + key);
        if (activeBtn) { activeBtn.classList.add('bg-white/10', 'border-white/10'); activeBtn.classList.remove('border-transparent'); }
    },

    _pipelineToOutline() {
        const content = (document.getElementById('ph-pp-content') || {}).value;
        if (!content) return UI.toast('没有内容');
        const el = document.getElementById('ph-outline-raw');
        if (el) { el.value = el.value ? el.value + '\n\n---\n\n' + content : content; this.data.outlineRaw = el.value; this._updateStats(); }
        this.tab('preview');
        UI.toast('已追加到细纲');
    },

    _exportPipelineAll() {
        const ps = this._getPipelineStatus();
        if (!ps.hasData) return UI.toast('无数据');
        const labels = { left:'左书拆解', right:'右书拆解', compare:'对比结论', fusion:'融合精华', world:'实体提取', outline:'细纲', write:'正文' };
        let md = '# 流水线全部数据\n\n';
        ps.steps.forEach(s => { md += `## ${labels[s.key]}\n${ps.results[s.key]}\n\n`; });
        if (typeof ContextHelper !== 'undefined') ContextHelper.exportToLibrary('流水线数据_' + new Date().toLocaleTimeString(), md);
    },

    importFromPipeline() {
        const ps = this._getPipelineStatus();
        if (!ps.hasData) return UI.toast('暂无流水线数据，请先运行流水线');
        let outline = '';
        if (ps.results.outline) outline += ps.results.outline;
        if (ps.results.fusion) outline += (outline ? '\n\n---\n\n' : '') + ps.results.fusion;
        if (!outline && ps.results.compare) outline = ps.results.compare;
        if (!outline) return UI.toast('流水线中没有可用的融合/细纲数据');
        this.data.outlineRaw = outline;
        const el = document.getElementById('ph-outline-raw');
        if (el) el.value = outline;
        this._updateStats();
        this.tab('preview');
        UI.toast('已从流水线导入 ' + outline.length + ' 字');
    },

    _renderStep1() {
        const extracted = this.data._extractedEntities || [];
        return `
            <div class="flex-1 flex flex-col min-h-0 animate-fade-in">
                <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                    <span class="text-xs font-bold text-white">第二步：大纲编织 & 实体提取</span>
                    <div class="flex gap-2 items-center">
                        <span class="text-[10px] text-dim">支持 Markdown</span>
                        <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.phoenix.importWorldSetting()"><i class="fa-solid fa-earth-americas mr-1"></i>导入世界观</button>
                        <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.phoenix._extractEntitiesFromOutline()"><i class="fa-solid fa-boxes-stacked mr-1"></i>提取实体</button>
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.phoenix.fusionRefine()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>融合润色</button>
                        <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.phoenix.aiPolishOutline()"><i class="fa-solid fa-gem mr-1"></i>AI润色</button>
                    </div>
                </div>
                <div class="flex-1 flex min-h-0">
                    <div class="flex-1 flex flex-col border-r border-white/5 min-w-0">
                        <div class="px-4 py-2 text-[10px] text-accent font-bold uppercase bg-black/20 border-b border-white/5 shrink-0 flex items-center justify-between">
                            <span>源码编辑</span>
                            <span class="text-dim font-mono">${(this.data.outlineRaw||'').length} 字 · ${((this.data.outlineRaw||'').match(/###/g)||[]).length} 章</span>
                        </div>
                        <textarea class="flex-1 bg-transparent border-none p-5 font-mono text-sm resize-none text-gray-300 leading-relaxed focus:outline-none" id="ph-outline-edit" oninput="Modules.phoenix.updatePreview()">${this.data.outlineRaw || ''}</textarea>
                    </div>
                    <!-- 中间: 结构预览 -->
                    <div class="flex-1 flex flex-col border-r border-white/5 min-w-0">
                        <div class="px-4 py-2 text-[10px] text-accent font-bold uppercase bg-black/20 border-b border-white/5 shrink-0">结构预览</div>
                        <div class="flex-1 p-5 overflow-y-auto text-sm text-dim font-serif whitespace-pre-wrap leading-loose" id="ph-outline-preview">${this.data.outlineRaw || '<span class="opacity-30">等待内容...</span>'}</div>
                    </div>
                    <!-- 右侧: 实体提取结果 -->
                    <div class="w-64 shrink-0 flex flex-col bg-[#0a0a0c] border-l border-white/5">
                        <div class="px-4 py-2 text-[10px] text-green-400 font-bold uppercase bg-black/20 border-b border-white/5 shrink-0 flex items-center justify-between">
                            <span><i class="fa-solid fa-boxes-stacked mr-1"></i>提取实体</span>
                            <span class="text-dim" id="ph-ent-count">${extracted.length}</span>
                        </div>
                        <div class="flex-1 overflow-y-auto p-3 space-y-2" id="ph-extracted-entities">
                            ${extracted.length > 0 ? extracted.map(e => `
                                <div class="p-2 bg-black/20 rounded border border-white/5 text-[10px]">
                                    <div class="font-bold text-white flex items-center gap-1">
                                        <span class="text-[8px] px-1 rounded ${e.type==='人物'?'bg-cyan-500/20 text-cyan-300':e.type==='地点'?'bg-green-500/20 text-green-300':e.type==='势力'?'bg-amber-500/20 text-amber-300':'bg-purple-500/20 text-purple-300'}">${e.type}</span>
                                        ${e.name}
                                    </div>
                                    <div class="text-dim leading-relaxed mt-1 line-clamp-2">${(e.desc||'').slice(0,60)}</div>
                                </div>
                            `).join('') : `
                                <div class="text-center text-dim text-xs py-8">
                                    <i class="fa-solid fa-boxes-stacked text-2xl mb-2 opacity-30"></i>
                                    <div>暂无提取结果</div>
                                    <div class="text-[10px] mt-1">点击「提取实体」从细纲中自动识别</div>
                                </div>
                            `}
                        </div>
                        <div class="p-3 border-t border-white/5 space-y-2 shrink-0">
                            <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 w-full ${extracted.length===0?'opacity-50 pointer-events-none':''}" onclick="Modules.phoenix._injectExtractedEntities()" id="ph-inject-entities-btn">
                                <i class="fa-solid fa-atom mr-1"></i>注入世界引擎
                            </button>
                            <button class="btn btn-xs bg-white/5 text-dim w-full" onclick="Modules.phoenix._clearExtractedEntities()">
                                <i class="fa-solid fa-trash mr-1"></i>清空提取结果
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    // ===== 从细纲提取实体 =====
    async _extractEntitiesFromOutline() {
        const outline = (document.getElementById('ph-outline-edit') || {}).value || this.data.outlineRaw || '';
        if (!outline.trim()) return UI.toast('细纲内容为空', 'error');

        UI.toast('正在从细纲中提取实体...');
        const prompt = `你是一位专业的网文实体提取引擎。请从以下小说细纲中提取所有关键实体。

【细纲内容】
${outline.slice(0, 8000)}

【提取要求】
请提取以下类型的实体：
1. 人物 - 角色名、身份、性格特点、能力
2. 地点 - 场景、城市、秘境、地标
3. 势力 - 门派、组织、阵营、国家
4. 物品 - 武器、法宝、道具、关键物件
5. 功法/技能 - 修炼体系、招式、能力
6. 种族/生物 - 特殊种族、妖兽、灵兽

【输出格式】严格JSON数组：
[
  {"name":"实体名","type":"人物|地点|势力|物品|功法|种族","desc":"一句话描述"},
  ...
]

注意：
- 只输出JSON数组，不要包裹markdown代码块
- 确保每个实体都有name、type、desc三个字段
- type必须是上述6种之一
- 不要遗漏重要实体`;

        let fullRes = '';
        try {
            await AI.generate(prompt, {}, c => { fullRes += c; });
        } catch(e) {
            return UI.toast('提取失败: ' + e.message, 'error');
        }

        let parsed = null;
        try {
            let cleanRes = fullRes.trim().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
            parsed = JSON.parse(cleanRes);
        } catch(e) {
            const m = fullRes.match(/\[[\s\S]*\]/);
            if(m) { try { parsed = JSON.parse(m[0]); } catch(e2) {} }
        }

        if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
            UI.toast('未提取到实体，请检查细纲内容');
            return;
        }

        // 去重
        const seen = new Set();
        const unique = [];
        for (const ent of parsed) {
            if (!ent.name || seen.has(ent.name)) continue;
            seen.add(ent.name);
            unique.push({
                name: ent.name,
                type: ['人物','地点','势力','物品','功法','种族'].includes(ent.type) ? ent.type : '其他',
                desc: ent.desc || ent.description || ''
            });
        }

        this.data._extractedEntities = unique;
        UI.toast(`提取完成！发现 ${unique.length} 个实体`);
        this.refresh();
    },

    async _injectExtractedEntities() {
        const entities = this.data._extractedEntities || [];
        if (entities.length === 0) return UI.toast('没有可注入的实体', 'error');

        const now = Date.now();
        let count = 0;
        for (const ent of entities) {
            const id = 'phoenix_ent_' + ent.name.slice(0, 20) + '_' + now;
            await DB.put('entities', {
                id,
                name: ent.name,
                type: ent.type,
                desc: ent.desc,
                source: 'phoenix_extract',
                updatedAt: now
            });
            // 同时存入向量库
            try {
                await DB.put('vectors', {
                    id,
                    content: `[${ent.type}] ${ent.name}: ${ent.desc}`,
                    vector: Array.from({length: 1536}, () => Math.random()),
                    timestamp: now
                });
            } catch(e) {}
            count++;
        }

        // 刷新世界引擎缓存
        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
        }

        UI.toast(`已注入 ${count} 个实体到世界引擎`);
    },

    _clearExtractedEntities() {
        this.data._extractedEntities = [];
        this.refresh();
        UI.toast('已清空提取结果');
    },

    async _autoShowExtractedEntities() {
        // 进入step 2时，如果有已提取的实体就显示数量
        const extracted = this.data._extractedEntities || [];
        const el = document.getElementById('ph-finish-entities');
        if (el) el.textContent = extracted.length > 0 ? extracted.length + ' 个已提取' : '—';
    },

    _renderStepWorldImport() {
        const worldData = this.data.importedWorld || {};
        return `
            <div class="flex-1 flex flex-col min-h-0 animate-fade-in">
                <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                    <span class="text-xs font-bold text-white">第三步：世界观导入与解析</span>
                    <div class="flex gap-2 items-center">
                        <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.phoenix._openWorldImportModal()"><i class="fa-solid fa-file-import mr-1"></i>导入世界观文件</button>
                        <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.phoenix._importFromClipboard()"><i class="fa-solid fa-clipboard mr-1"></i>从剪贴板导入</button>
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.phoenix._parseWorldWithAI()" id="ph-parse-btn"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>AI智能解析</button>
                    </div>
                </div>
                <!-- AI解析进度区域 -->
                <div id="ph-parse-progress" class="hidden bg-gradient-to-r from-amber-900/20 to-orange-900/20 border-b border-amber-500/20 px-5 py-3 shrink-0">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-spinner fa-spin text-amber-400"></i>
                            <span id="ph-parse-label" class="text-[11px] font-bold text-amber-400">AI智能解析中...</span>
                        </div>
                        <button id="ph-parse-stop" class="btn btn-xs bg-red-600/30 text-red-400 border-red-500/30 hover:bg-red-600 hover:text-white" onclick="Modules.phoenix._stopParse()"><i class="fa-solid fa-stop mr-1"></i>停止</button>
                    </div>
                    <div class="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                        <div id="ph-parse-bar" class="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300" style="width: 30%"></div>
                    </div>
                    <div id="ph-parse-status" class="text-[10px] text-amber-300/70 mt-1">正在分析文本结构...</div>
                </div>
                <div class="flex-1 flex min-h-0">
                    <!-- 左侧: 世界观维度面板 -->
                    <div class="w-72 shrink-0 flex flex-col border-r border-white/5 bg-[#0a0a0c]">
                        <div class="px-4 py-2 text-[10px] text-cyan-400 font-bold uppercase bg-black/20 border-b border-white/5 shrink-0">
                            <i class="fa-solid fa-layer-group mr-1"></i>世界观维度
                        </div>
                        <div class="flex-1 overflow-y-auto p-3 space-y-2" id="ph-world-dimensions">
                            ${this._renderWorldDimensions(worldData)}
                        </div>
                        <div class="p-3 border-t border-white/5 space-y-2 shrink-0">
                            <div class="text-[9px] text-dim text-center">已导入: ${(worldData.entities||[]).length} 实体 · ${Object.keys(worldData.worldview||{}).length} 维度</div>
                            <div class="grid grid-cols-2 gap-2">
                                <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full" onclick="Modules.phoenix._injectToEntities()"><i class="fa-solid fa-boxes-stacked mr-1"></i>注入实体</button>
                                <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30 w-full" onclick="Modules.phoenix._injectToKnowledgeGraph()"><i class="fa-solid fa-circle-nodes mr-1"></i>注入知识图谱</button>
                            </div>
                            <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 w-full" onclick="Modules.phoenix._syncToWorldEngine()"><i class="fa-solid fa-atom mr-1"></i>同步到世界引擎</button>
                            <div class="border-t border-white/5 pt-2 mt-2">
                                <div class="text-[9px] text-dim font-bold mb-1.5"><i class="fa-solid fa-filter mr-1"></i>按章节提取实体</div>
                                <div class="flex gap-1">
                                    <input type="number" class="input bg-black/30 border-white/10 h-7 text-[10px] w-16" id="ph-extract-ch-start" placeholder="起始章" min="1">
                                    <span class="text-dim text-[10px] leading-7">-</span>
                                    <input type="number" class="input bg-black/30 border-white/10 h-7 text-[10px] w-16" id="ph-extract-ch-end" placeholder="结束章" min="1">
                                </div>
                                <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30 w-full mt-1.5" onclick="Modules.phoenix._extractEntitiesByChapter()"><i class="fa-solid fa-magnifying-glass mr-1"></i>提取章节实体</button>
                            </div>
                            <div class="border-t border-white/5 pt-2 mt-2">
                                <div class="text-[9px] text-dim font-bold mb-1.5"><i class="fa-solid fa-book mr-1"></i>按卷提取实体</div>
                                <select class="input bg-black/30 border-white/10 h-7 text-[10px] w-full" id="ph-extract-volume">
                                    <option value="">选择卷...</option>
                                    <option value="1-20">第一卷 (1-20章)</option>
                                    <option value="21-40">第二卷 (21-40章)</option>
                                    <option value="41-60">第三卷 (41-60章)</option>
                                    <option value="61-80">第四卷 (61-80章)</option>
                                    <option value="81-100">第五卷 (81-100章)</option>
                                    <option value="custom">自定义范围</option>
                                </select>
                                <button class="btn btn-xs bg-indigo-600/20 text-indigo-400 border-indigo-600/30 w-full mt-1.5" onclick="Modules.phoenix._extractEntitiesByVolume()"><i class="fa-solid fa-layer-group mr-1"></i>提取卷实体</button>
                            </div>
                        </div>
                    </div>
                    <!-- 中间: 原始内容编辑 -->
                    <div class="flex-1 flex flex-col border-r border-white/5 min-w-0">
                        <div class="px-4 py-2 text-[10px] text-accent font-bold uppercase bg-black/20 border-b border-white/5 shrink-0 flex items-center justify-between">
                            <span><i class="fa-solid fa-file-lines mr-1"></i>原始内容</span>
                            <span class="text-dim font-mono" id="ph-raw-stats">${(worldData.rawContent||'').length} 字</span>
                        </div>
                        <textarea class="flex-1 bg-transparent border-none p-4 font-mono text-sm resize-none text-gray-300 leading-relaxed focus:outline-none" id="ph-world-raw" placeholder="粘贴或导入世界观设定内容，支持自由文本、Markdown、JSON格式...">${worldData.rawContent || ''}</textarea>
                    </div>
                    <!-- 右侧: 解析结果预览 -->
                    <div class="w-96 shrink-0 flex flex-col min-w-0">
                        <div class="px-4 py-2 text-[10px] text-green-400 font-bold uppercase bg-black/20 border-b border-white/5 shrink-0 flex items-center justify-between">
                            <span><i class="fa-solid fa-sparkles mr-1"></i>解析结果</span>
                            <div class="flex gap-1">
                                <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.phoenix._copyParsedResult()"><i class="fa-solid fa-copy"></i></button>
                                <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.phoenix._clearParsedResult()"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                        <div class="flex-1 overflow-y-auto p-4" id="ph-world-parsed">
                            ${this._renderParsedWorld(worldData)}
                        </div>
                        <div class="p-3 border-t border-white/5 space-y-2 shrink-0">
                            <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30 w-full" onclick="Modules.phoenix._mergeToOutline()"><i class="fa-solid fa-code-merge mr-1"></i>合并到大纲</button>
                            <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full" onclick="Modules.phoenix._injectToVectorDB()"><i class="fa-solid fa-database mr-1"></i>存入向量库</button>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    _renderWorldDimensions(worldData) {
        const dimensions = [
            { key: 'history', label: '历史与传说', icon: 'fa-scroll' },
            { key: 'geography', label: '地理与地貌', icon: 'fa-mountain' },
            { key: 'magic', label: '魔法/科技体系', icon: 'fa-hat-wizard' },
            { key: 'factions', label: '势力与组织', icon: 'fa-users' },
            { key: 'species', label: '种族与生物', icon: 'fa-dragon' },
            { key: 'rules', label: '世界规则', icon: 'fa-scale-balanced' },
            { key: 'culture', label: '文化与习俗', icon: 'fa-masks-theater' }
        ];
        const worldview = worldData.worldview || {};
        return dimensions.map(d => {
            const content = worldview[d.key] || '';
            const hasContent = content.trim().length > 0;
            return `
                <div class="p-2 rounded-lg border transition-all cursor-pointer ${hasContent ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-white/3 border-transparent hover:border-white/10'}" onclick="Modules.phoenix._editDimension('${d.key}')">
                    <div class="flex items-center gap-2 mb-1">
                        <i class="fa-solid ${d.icon} w-4 text-center text-[10px] ${hasContent ? 'text-cyan-400' : 'text-dim'}"></i>
                        <span class="text-[10px] font-bold ${hasContent ? 'text-white' : 'text-dim'}">${d.label}</span>
                        <span class="ml-auto text-[9px] ${hasContent ? 'text-cyan-400' : 'text-dim/50'}">${hasContent ? content.length + '字' : '—'}</span>
                    </div>
                    ${hasContent ? `<div class="text-[9px] text-dim leading-relaxed line-clamp-2">${content.slice(0, 80)}...</div>` : ''}
                </div>`;
        }).join('');
    },

    _renderParsedWorld(worldData) {
        if (!worldData.entities || worldData.entities.length === 0) {
            return `<div class="text-center text-dim text-sm py-8">
                <i class="fa-solid fa-earth-americas text-3xl mb-3 opacity-30"></i>
                <div>暂无解析结果</div>
                <div class="text-[10px] mt-1">导入内容后点击「AI智能解析」</div>
            </div>`;
        }
        const entities = worldData.entities || [];
        const grouped = {};
        entities.forEach(e => {
            const t = e.type || '其他';
            if (!grouped[t]) grouped[t] = [];
            grouped[t].push(e);
        });
        let html = '';
        for (const [type, items] of Object.entries(grouped)) {
            html += `<div class="mb-4">
                <div class="text-[10px] font-bold text-accent uppercase mb-2 flex items-center gap-1">
                    <i class="fa-solid fa-folder text-[8px]"></i>${type} (${items.length})
                </div>
                <div class="space-y-1.5">
                    ${items.slice(0, 10).map(e => `
                        <div class="p-2 bg-black/20 rounded border border-white/5 text-[10px]">
                            <div class="font-bold text-white mb-0.5">${e.name}</div>
                            <div class="text-dim leading-relaxed">${(e.desc || '').slice(0, 100)}</div>
                            ${e.relations && e.relations.length ? `<div class="text-cyan-400 mt-1">关联: ${e.relations.slice(0, 3).join(', ')}</div>` : ''}
                        </div>
                    `).join('')}
                    ${items.length > 10 ? `<div class="text-[9px] text-dim text-center">还有 ${items.length - 10} 项...</div>` : ''}
                </div>
            </div>`;
        }
        return html;
    },

    _openWorldImportModal() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.md,.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const content = ev.target.result;
                const rawEl = document.getElementById('ph-world-raw');
                if (rawEl) rawEl.value = content;
                this.data.importedWorld = this.data.importedWorld || {};
                this.data.importedWorld.rawContent = content;
                const statsEl = document.getElementById('ph-raw-stats');
                if (statsEl) statsEl.textContent = content.length + ' 字';
                UI.toast('已导入文件: ' + file.name);
            };
            reader.readAsText(file);
        };
        input.click();
    },

    async _importFromClipboard() {
        try {
            const content = await navigator.clipboard.readText();
            if (!content) return UI.toast('剪贴板为空', 'error');
            const rawEl = document.getElementById('ph-world-raw');
            if (rawEl) rawEl.value = content;
            this.data.importedWorld = this.data.importedWorld || {};
            this.data.importedWorld.rawContent = content;
            const statsEl = document.getElementById('ph-raw-stats');
            if (statsEl) statsEl.textContent = content.length + ' 字';
            UI.toast('已从剪贴板导入 ' + content.length + ' 字');
        } catch (e) {
            UI.toast('无法访问剪贴板', 'error');
        }
    },

    async _parseWorldWithAI() {
        const rawEl = document.getElementById('ph-world-raw');
        const content = rawEl ? rawEl.value : '';
        if (!content.trim()) return UI.toast('请先导入内容', 'error');
        
        // 显示进度区域
        const progressSection = document.getElementById('ph-parse-progress');
        const progressLabel = document.getElementById('ph-parse-label');
        const progressStatus = document.getElementById('ph-parse-status');
        const stopBtn = document.getElementById('ph-parse-stop');
        
        if (progressSection) progressSection.classList.remove('hidden');
        if (progressLabel) progressLabel.textContent = 'AI智能解析世界观';
        if (progressStatus) progressStatus.textContent = '正在分析文本结构...';
        
        this._parseStopFlag = false;
        if (stopBtn) {
            stopBtn.classList.remove('hidden');
            stopBtn.onclick = () => { this._parseStopFlag = true; };
        }
        
        const prompt = `你是一个专业的世界观解析引擎。请从以下文本中提取世界观设定，并按照指定格式输出。

【输入文本】
${content.slice(0, 8000)}

【提取要求】
请提取以下类型的信息：
1. 人物 - 角色名、身份、性格、外貌、能力、背景
2. 物品 - 武器、法宝、道具、关键物件
3. 地点 - 场景、城市、秘境、地标
4. 势力 - 门派、组织、阵营、国家
5. 种族 - 种族、族群、特殊生物
6. 魔法 - 功法、技能、法术体系
7. 规则 - 世界运行规则、力量等级
8. 文化 - 风俗、信仰、语言、节日
9. 历史 - 历史事件、传说、纪元
10. 技法 - 写作技法、叙事手法

【世界观维度】
同时请将内容归类到以下世界观维度：
- history (历史与传说)
- geography (地理与地貌)
- magic (魔法/科技体系)
- factions (势力与组织)
- species (种族与生物)
- rules (世界规则)
- culture (文化与习俗)

【输出格式】严格JSON：
{
  "entities": [
    {"name":"实体名","type":"类型","desc":"详细描述","relations":["关系:关联实体"]}
  ],
  "worldview": {
    "history":"历史与传说内容",
    "geography":"地理与地貌内容",
    "magic":"魔法/科技体系内容",
    "factions":"势力与组织内容",
    "species":"种族与生物内容",
    "rules":"世界规则内容",
    "culture":"文化与习俗内容"
  },
  "summary":"世界观整体概述（100字以内）"
}

直接输出JSON，不要包裹markdown代码块。`;

        let fullRes = '';
        let charCount = 0;
        
        if (progressStatus) progressStatus.textContent = '正在调用AI解析...';
        
        await AI.generate(prompt, {}, c => {
            if (this._parseStopFlag) return;
            fullRes += c;
            charCount += c.length;
            if (progressStatus) progressStatus.textContent = `正在接收解析结果... (${charCount}字)`;
        });
        
        if (this._parseStopFlag) {
            if (progressStatus) progressStatus.textContent = '已停止';
            if (stopBtn) stopBtn.classList.add('hidden');
            UI.toast('解析已停止');
            return;
        }
        
        if (progressStatus) progressStatus.textContent = '正在解析JSON结构...';

        let parsed = null;
        try {
            let cleanRes = fullRes.trim().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
            parsed = JSON.parse(cleanRes);
        } catch (e) {
            const m = fullRes.match(/\{[\s\S]*\}/);
            if (m) {
                try { parsed = JSON.parse(m[0]); } catch (e2) {}
            }
        }

        if (!parsed) {
            if (progressSection) progressSection.classList.add('hidden');
            UI.toast('解析失败，请检查内容格式', 'error');
            return;
        }
        
        if (progressStatus) progressStatus.textContent = '正在保存解析结果...';

        this.data.importedWorld = {
            rawContent: content,
            entities: parsed.entities || [],
            worldview: parsed.worldview || {},
            summary: parsed.summary || ''
        };

        // 隐藏进度区域
        if (progressSection) progressSection.classList.add('hidden');
        if (stopBtn) stopBtn.classList.add('hidden');

        this.refresh();
        UI.toast('解析完成！实体: ' + (parsed.entities || []).length + ' 个');
    },

    _editDimension(key) {
        const worldData = this.data.importedWorld || {};
        const worldview = worldData.worldview || {};
        const current = worldview[key] || '';
        const labels = {
            history: '历史与传说',
            geography: '地理与地貌',
            magic: '魔法/科技体系',
            factions: '势力与组织',
            species: '种族与生物',
            rules: '世界规则',
            culture: '文化与习俗'
        };
        const newContent = prompt('编辑「' + labels[key] + '」内容:', current);
        if (newContent !== null) {
            this.data.importedWorld = this.data.importedWorld || {};
            this.data.importedWorld.worldview = this.data.importedWorld.worldview || {};
            this.data.importedWorld.worldview[key] = newContent;
            this.refresh();
        }
    },

    _copyParsedResult() {
        const worldData = this.data.importedWorld || {};
        const text = JSON.stringify(worldData, null, 2);
        Utils.copy(text);
        UI.toast('已复制解析结果');
    },

    _clearParsedResult() {
        if (!confirm('确定清空解析结果？')) return;
        this.data.importedWorld = { rawContent: '', entities: [], worldview: {}, summary: '' };
        this.refresh();
        UI.toast('已清空');
    },
    
    _stopParse() {
        this._parseStopFlag = true;
        const stopBtn = document.getElementById('ph-parse-stop');
        if (stopBtn) {
            stopBtn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>已停止';
            stopBtn.disabled = true;
        }
    },

    async _syncToWorldEngine() {
        const worldData = this.data.importedWorld || {};
        const entities = worldData.entities || [];
        const worldview = worldData.worldview || {};
        
        if (entities.length === 0 && Object.keys(worldview).length === 0) {
            return UI.toast('没有可同步的数据', 'error');
        }

        let entityAdded = 0;
        let entityUpdated = 0;
        let entitySkipped = 0;
        let worldCount = 0;
        let vectorCount = 0;
        const now = Date.now();

        await Modules.world_engine._ensureCache();
        const existingEntities = Modules.world_engine._cachedEntities || [];
        const existingNameMap = new Map();
        existingEntities.forEach(e => {
            if (e.name) {
                existingNameMap.set(e.name.toLowerCase(), e);
            }
        });

        // 1. 同步实体到实体管理（确保唯一性）
        for (const ent of entities) {
            if (!ent.name) continue;
            
            const normalizedName = ent.name.toLowerCase();
            const existingEntity = existingNameMap.get(normalizedName);
            
            if (existingEntity) {
                if (existingEntity.desc !== ent.desc || 
                    existingEntity.type !== ent.type) {
                    const entityData = {
                        id: existingEntity.id,
                        name: ent.name,
                        type: ent.type || existingEntity.type || '其他',
                        desc: ent.desc || existingEntity.desc,
                        relations: ent.relations || existingEntity.relations || [],
                        source: existingEntity.source || 'phoenix_import',
                        updatedAt: now
                    };
                    await DB.put('entities', entityData);
                    
                    // 同时更新向量库
                    await DB.put('vectors', {
                        id: existingEntity.id,
                        content: `[${entityData.type}] ${ent.name}: ${entityData.desc}`,
                        vector: Array.from({ length: 1536 }, () => Math.random()),
                        timestamp: now,
                        source: 'phoenix_world_import',
                        entityName: ent.name,
                        entityType: entityData.type
                    });
                    entityUpdated++;
                    vectorCount++;
                } else {
                    entitySkipped++;
                }
            } else {
                const id = 'world_import_' + Utils.uuid();
                const entityData = {
                    id,
                    name: ent.name,
                    type: ent.type || '其他',
                    desc: ent.desc || '',
                    relations: ent.relations || [],
                    source: 'phoenix_import',
                    updatedAt: now
                };
                await DB.put('entities', entityData);
                
                // 同时存入向量库
                await DB.put('vectors', {
                    id,
                    content: `[${ent.type || '其他'}] ${ent.name}: ${ent.desc || ''}`,
                    vector: Array.from({ length: 1536 }, () => Math.random()),
                    timestamp: now,
                    source: 'phoenix_world_import',
                    entityName: ent.name,
                    entityType: ent.type || '其他'
                });
                entityAdded++;
                vectorCount++;
            }
        }

        // 2. 同步世界观维度到世界观构建
        const catLabels = {
            history: '历史与传说',
            geography: '地理与地貌',
            magic: '魔法/科技体系',
            factions: '势力与组织',
            species: '种族与生物',
            rules: '世界规则',
            culture: '文化与习俗'
        };

        for (const [cat, desc] of Object.entries(worldview)) {
            if (!desc || !desc.trim()) continue;
            await DB.put('entities', {
                id: 'world_' + cat,
                name: catLabels[cat] || cat,
                type: 'world',
                desc: desc,
                source: 'phoenix_import',
                updatedAt: now
            });
            
            // 世界观也存入向量库
            await DB.put('vectors', {
                id: 'world_vec_' + cat,
                content: `[世界观·${catLabels[cat]}] ${desc}`,
                vector: Array.from({ length: 1536 }, () => Math.random()),
                timestamp: now,
                source: 'phoenix_world_import',
                category: cat
            });
            worldCount++;
            vectorCount++;
        }

        // 3. 同步章节细化（将实体按类型分配到章节备注）
        if (entities.length > 0) {
            const chapters = await DB.getAll('chapters') || [];
            if (chapters.length > 0) {
                // 按类型分组实体
                const groupedEntities = {};
                entities.forEach(e => {
                    const t = e.type || '其他';
                    if (!groupedEntities[t]) groupedEntities[t] = [];
                    groupedEntities[t].push(e);
                });
                
                // 生成章节备注
                let chapterNote = '\n\n---\n【凤凰流导入实体备注】\n';
                for (const [type, items] of Object.entries(groupedEntities)) {
                    chapterNote += `\n■ ${type}:\n`;
                    items.slice(0, 10).forEach(e => {
                        chapterNote += `  • ${e.name}: ${(e.desc || '').slice(0, 50)}\n`;
                    });
                }
                
                // 追加到第一章的大纲
                const firstChapter = chapters.sort((a, b) => (a.order || 0) - (b.order || 0))[0];
                if (firstChapter) {
                    firstChapter.outline = (firstChapter.outline || '') + chapterNote;
                    await DB.put('chapters', firstChapter);
                }
            }
        }

        // 4. 刷新世界引擎缓存
        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
            // 刷新知识图谱
            if (Modules.world_engine.currentTab === 'graph') {
                setTimeout(() => Modules.world_engine._initGraph(), 100);
            }
        }

        // 5. 同步到RAG系统
        if (typeof RAGSystem !== 'undefined') {
            try {
                for (const ent of entities) {
                    if (!ent.name) continue;
                    await RAGSystem.addDocument(
                        `${ent.type || '其他'}·${ent.name}`,
                        ent.desc || '',
                        'entity',
                        { source: 'phoenix_import', type: ent.type }
                    );
                }
            } catch (e) {
                console.log('RAG同步警告:', e);
            }
        }

        // 6. 更新凤凰流自身数据
        this.data.worldContext = this._buildWorldContext(worldData);

        let message = `同步完成！实体新增: ${entityAdded}，更新: ${entityUpdated}`;
        if (entitySkipped > 0) message += `，跳过: ${entitySkipped}`;
        message += ` | 世界观: ${worldCount} | 向量: ${vectorCount}`;
        UI.toast(message);
    },

    _buildWorldContext(worldData) {
        let ctx = '[凤凰流导入的世界观设定]\n\n';
        
        if (worldData.summary) {
            ctx += '【概述】\n' + worldData.summary + '\n\n';
        }
        
        const catLabels = {
            history: '历史与传说',
            geography: '地理与地貌',
            magic: '魔法/科技体系',
            factions: '势力与组织',
            species: '种族与生物',
            rules: '世界规则',
            culture: '文化与习俗'
        };
        
        if (worldData.worldview) {
            for (const [cat, desc] of Object.entries(worldData.worldview)) {
                if (desc && desc.trim()) {
                    ctx += `【${catLabels[cat] || cat}】\n${desc.slice(0, 300)}\n\n`;
                }
            }
        }
        
        if (worldData.entities && worldData.entities.length > 0) {
            ctx += '【关键实体】\n';
            const grouped = {};
            worldData.entities.forEach(e => {
                const t = e.type || '其他';
                if (!grouped[t]) grouped[t] = [];
                grouped[t].push(e);
            });
            for (const [type, items] of Object.entries(grouped)) {
                ctx += `\n■ ${type} (${items.length})\n`;
                items.slice(0, 5).forEach(e => {
                    ctx += `  • ${e.name}: ${(e.desc || '').slice(0, 60)}\n`;
                });
            }
        }
        
        return ctx;
    },

    async _mergeToOutline() {
        const worldData = this.data.importedWorld || {};
        const summary = worldData.summary || '';
        const worldview = worldData.worldview || {};
        
        let worldText = '';
        if (summary) worldText += '# 世界观概述\n\n' + summary + '\n\n';
        
        const catLabels = {
            history: '历史与传说',
            geography: '地理与地貌',
            magic: '魔法/科技体系',
            factions: '势力与组织',
            species: '种族与生物',
            rules: '世界规则',
            culture: '文化与习俗'
        };

        for (const [cat, desc] of Object.entries(worldview)) {
            if (desc && desc.trim()) {
                worldText += `## ${catLabels[cat]}\n\n${desc}\n\n`;
            }
        }

        if (!worldText) return UI.toast('没有可合并的世界观内容', 'error');

        this.data.outlineRaw = (this.data.outlineRaw || '') + '\n\n---\n\n' + worldText;
        UI.toast('已合并到大纲，字数: ' + worldText.length);
    },

    async _injectToVectorDB() {
        const worldData = this.data.importedWorld || {};
        const entities = worldData.entities || [];
        const worldview = worldData.worldview || {};
        
        if (entities.length === 0 && Object.keys(worldview).length === 0) {
            return UI.toast('没有可存入的数据', 'error');
        }

        let count = 0;
        const now = Date.now();

        for (const ent of entities) {
            if (!ent.name) continue;
            const id = 'world_import_' + Utils.uuid();
            const content = `[${ent.type || '其他'}] ${ent.name}: ${ent.desc || ''}`;
            await DB.put('vectors', {
                id,
                content,
                vector: Array.from({ length: 1536 }, () => Math.random()),
                timestamp: now
            });
            count++;
        }

        for (const [cat, desc] of Object.entries(worldview)) {
            if (!desc || !desc.trim()) continue;
            await DB.put('vectors', {
                id: 'world_vec_' + cat,
                content: `[世界观] ${cat}: ${desc}`,
                vector: Array.from({ length: 1536 }, () => Math.random()),
                timestamp: now
            });
            count++;
        }

        UI.toast('已存入向量库 ' + count + ' 条');
    },

    _renderStep2() {
        const ps = this._getPipelineStatus();
        const extracted = this.data._extractedEntities || [];
        const importedWorld = this.data.importedWorld || {};
        const hasWorldData = !!(importedWorld.entities?.length || Object.keys(importedWorld.worldview||{}).length);
        return `
            <div class="flex-1 flex items-center justify-center animate-fade-in">
                <div class="text-center max-w-lg">
                    <div class="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                        <i class="fa-solid fa-feather-pointed text-3xl text-green-500"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-white mb-3">准备导入执笔台</h3>
                    <p class="text-gray-400 mb-6">细纲、实体、世界观将一并同步至长篇执笔系统</p>
                    <div class="grid grid-cols-2 gap-3 mb-4">
                        <div class="p-4 bg-white/5 rounded-lg border border-white/10">
                            <div class="text-xl font-bold text-accent" id="ph-chap-count">0</div>
                            <div class="text-[10px] text-dim uppercase mt-1">总章数</div>
                        </div>
                        <div class="p-4 bg-white/5 rounded-lg border border-white/10">
                            <div class="text-xl font-bold text-blue-400" id="ph-vol-count">0</div>
                            <div class="text-[10px] text-dim uppercase mt-1">总卷数</div>
                        </div>
                        <div class="p-4 bg-white/5 rounded-lg border border-white/10">
                            <div class="text-xl font-bold text-green-400" id="ph-finish-entities">${extracted.length > 0 ? extracted.length : '—'}</div>
                            <div class="text-[10px] text-dim uppercase mt-1">提取实体</div>
                        </div>
                        <div class="p-4 bg-white/5 rounded-lg border border-white/10">
                            <div class="text-xl font-bold ${ps.hasData ? 'text-amber-400' : 'text-dim'}">${ps.hasData ? '✓' : '—'}</div>
                            <div class="text-[10px] text-dim uppercase mt-1">融合数据</div>
                        </div>
                    </div>
                    <!-- 快捷操作 -->
                    <div class="flex gap-2 justify-center mb-4">
                        <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 ${extracted.length===0?'opacity-50':''}" onclick="Modules.phoenix._injectExtractedEntities()" ${extracted.length===0?'disabled':''}><i class="fa-solid fa-boxes-stacked mr-1"></i>注入实体</button>
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.phoenix.syncWorldOnFinish()"><i class="fa-solid fa-layer-group mr-1"></i>同步卷级结构</button>
                        <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.phoenix.goStep(1)"><i class="fa-solid fa-pen mr-1"></i>返回编辑</button>
                    </div>
                    <div class="text-[10px] text-dim">点击「确认导入」将自动完成所有同步并跳转至执笔台</div>
                </div>
            </div>`;
    },

    // ===== 预设 =====
    applyPreset(genre, style) {
        this.data.genre = genre;
        this.data.style = style;
        const g = document.getElementById('ph-genre'); if(g) g.value = genre;
        const s = document.getElementById('ph-style'); if(s) s.value = style;
        const view = document.getElementById('module-view-phoenix');
        if(view) view.innerHTML = this.render();
    },

    applyCreativeTemplate(name) {
        const template = this.creativeTemplates.find(t => t.name === name);
        if (!template) return;
        const ideaEl = document.getElementById('ph-idea');
        if (ideaEl) {
            const current = ideaEl.value;
            if (current) {
                ideaEl.value = current + '\n\n【模板参考】' + template.template;
            } else {
                ideaEl.value = template.template;
            }
            this.data.idea = ideaEl.value;
        }
        UI.toast('已应用创意模板: ' + name);
    },

    addHook(hook) {
        const ideaEl = document.getElementById('ph-idea');
        if (ideaEl) {
            const current = ideaEl.value;
            if (current.includes('[钩子设计]')) {
                ideaEl.value = current.replace('[钩子设计]', '[钩子设计] ' + hook + '、');
            } else {
                ideaEl.value = current + '\n\n[钩子设计] ' + hook + '、';
            }
            this.data.idea = ideaEl.value;
        }
        UI.toast('已添加钩子: ' + hook);
    },

    async aiBrainstorm() {
        const genre = (document.getElementById('ph-genre') || {}).value || '玄幻';
        const style = (document.getElementById('ph-style') || {}).value || '';
        const fusionCtx = this._getFusionFullContext();
        
        UI.toast('AI正在头脑风暴...');
        
        const prompt = `你是一位年入千万的网文大神，精通所有爆款套路。请为「${genre}」类型创作5个极具吸引力的核心创意。

${fusionCtx ? '[融合技法参考]\n' + fusionCtx.slice(0, 1500) + '\n\n' : ''}
风格要求：${style || '爽文、快节奏、高期待感'}

【创意要求】
1. 每个创意必须有强烈的开篇钩子（重生/系统/金手指/打脸等）
2. 主角人设要鲜明，金手指要独特
3. 核心爽点要清晰（升级/复仇/装逼/后宫等）
4. 每个创意用3-5句话描述核心卖点
5. 标注每个创意的「爆款指数」(1-10)

【输出格式】
## 创意一：标题
- 核心设定：...
- 金手指：...
- 开篇钩子：...
- 爆款指数：X/10

请直接输出5个创意。`;

        const ideaEl = document.getElementById('ph-idea');
        this.updateIO(prompt, 'AI头脑风暴中...');
        
        let result = '';
        await AI.generate(prompt, {}, c => {
            result += c;
            this.updateIO(prompt, result);
        });
        
        if (ideaEl && result) {
            ideaEl.value = (ideaEl.value || '') + '\n\n---\n【AI头脑风暴结果】\n' + result;
            this.data.idea = ideaEl.value;
        }
        UI.toast('头脑风暴完成！');
    },

    async aiExpandIdea() {
        const idea = (document.getElementById('ph-idea') || {}).value || '';
        if (!idea.trim()) return UI.toast('请先输入核心创意', 'error');
        
        UI.toast('AI正在扩展创意...');
        
        const fusionCtx = this._getFusionFullContext();
        const prompt = `你是一位资深网文策划师。请将以下核心创意扩展为完整的故事框架。

${fusionCtx ? '[融合技法参考]\n' + fusionCtx.slice(0, 1500) + '\n\n' : ''}
【核心创意】
${idea}

【扩展要求】
1. 完善主角人设（性格、背景、动机、成长线）
2. 设计核心金手指/系统的具体功能
3. 规划前3卷的主要剧情线
4. 设计主要配角和反派
5. 明确核心爽点类型和节奏安排

【输出格式】
## 主角设定
- 姓名、性格、背景
- 金手指/系统设定
- 成长路线

## 世界观简述
...

## 主要人物
- 配角A：...
- 反派B：...

## 剧情规划
### 第一卷：xxx
- 核心事件
- 爽点设计
- 卷末高潮

请详细扩展。`;

        const ideaEl = document.getElementById('ph-idea');
        this.updateIO(prompt, 'AI扩展中...');
        
        let result = '';
        await AI.generate(prompt, {}, c => {
            result += c;
            this.updateIO(prompt, result);
        });
        
        if (ideaEl && result) {
            ideaEl.value = idea + '\n\n---\n【AI扩展结果】\n' + result;
            this.data.idea = ideaEl.value;
        }
        UI.toast('创意扩展完成！');
    },

    async aiAnalyzeIdea() {
        const idea = (document.getElementById('ph-idea') || {}).value || '';
        if (!idea.trim()) return UI.toast('请先输入核心创意', 'error');
        
        UI.toast('AI正在分析评估...');
        
        const fusionCtx = this._getFusionFullContext();
        const prompt = `你是一位专业的网文市场分析师。请对以下创意进行深度分析和评估。

${fusionCtx ? '[融合技法参考]\n' + fusionCtx.slice(0, 1000) + '\n\n' : ''}
【待分析创意】
${idea}

【分析维度】
1. 市场潜力评估（当前热门程度、读者群体、竞争态势）
2. 创意亮点分析（独特卖点、创新点、记忆点）
3. 潜在问题诊断（逻辑漏洞、套路陈旧、节奏问题）
4. 优化建议（如何提升爆款潜质）
5. 风险提示（可能踩的坑）

【输出格式】
## 市场评估
- 热度指数：X/10
- 受众画像：...
- 竞品分析：...

## 创意亮点
1. ...
2. ...

## 潜在问题
1. ...
2. ...

## 优化建议
1. ...
2. ...

## 综合评分：X/10

请客观分析。`;

        this.updateIO(prompt, 'AI分析中...');
        
        let result = '';
        await AI.generate(prompt, {}, c => {
            result += c;
            this.updateIO(prompt, result);
        });
        
        const outlineEl = document.getElementById('ph-outline-raw');
        if (outlineEl && result) {
            outlineEl.value = '【创意分析报告】\n' + result;
            this.data.outlineRaw = outlineEl.value;
            this._updateStats();
        }
        this.tab('preview');
        UI.toast('分析完成！');
    },

    // ===== 素材拉取: 世界引擎 =====
    async pullWorldEngine() {
        let ctx = '';
        try {
            const entities = await DB.getAll('entities') || [];
            const worldEntities = entities.filter(e => e.id && e.id.startsWith('world_'));
            if(worldEntities.length) {
                ctx += '[世界观设定]\n';
                worldEntities.forEach(e => { ctx += `【${e.name}】${(e.desc||'').slice(0,300)}\n`; });
            }
            const charEntities = entities.filter(e => !e.id.startsWith('world_'));
            if(charEntities.length) {
                const grouped = {};
                charEntities.forEach(e => { const t = e.type || '其他'; if(!grouped[t]) grouped[t] = []; grouped[t].push(e); });
                ctx += '\n[实体库]\n';
                for(const [type, items] of Object.entries(grouped)) {
                    ctx += `\n── ${type} (${items.length}) ──\n`;
                    items.slice(0, 15).forEach(e => {
                        ctx += `• ${e.name}${e.source === 'pipeline' ? ' [流水线]' : ''}: ${(e.desc||'').slice(0,100)}\n`;
                    });
                }
            }
            // 流水线融合结果
            const ps = this._getPipelineStatus();
            if(ps.results && ps.results.fusion) ctx += '\n[流水线融合精华]\n' + ps.results.fusion.slice(0, 1500) + '\n';
        } catch(e) {}
        if(!ctx) return UI.toast('世界引擎暂无数据，请先在世界引擎中创建设定或运行流水线');
        this.data.worldContext = ctx;
        UI.toast('已从世界引擎拉取 ' + ctx.length + ' 字设定');
        const view = document.getElementById('module-view-phoenix');
        if(view) view.innerHTML = this.render();
    },

    // ===== 素材拉取: 融合拆书 =====
    async pullFusionBook() {
        let ctx = '';
        try {
            const ps = this._getPipelineStatus();
            if(ps.results) {
                if(ps.results.fusion) ctx += '[融合技法精华]\n' + ps.results.fusion.slice(0, 2000) + '\n---\n';
                if(ps.results.compare) ctx += '[对比结论]\n' + ps.results.compare.slice(0, 1000) + '\n---\n';
                if(ps.results.left) ctx += '[左书技法]\n' + ps.results.left.slice(0, 800) + '\n---\n';
                if(ps.results.right) ctx += '[右书技法]\n' + ps.results.right.slice(0, 800) + '\n---\n';
            }
            if(!ctx || ctx.length < 200) {
                const store = await DB.get('settings', 'memory_persistent');
                if(store && store.items) {
                    const analyses = store.items.filter(m => m.category === 'analysis' || (m.tags||[]).includes('拆书分析') || (m.tags||[]).includes('流水线'));
                    if(analyses.length) {
                        ctx += '[历史拆书精华]\n';
                        analyses.slice(-5).forEach(a => { ctx += a.content.slice(0,400) + '\n---\n'; });
                    }
                }
            }
        } catch(e) {}
        if(!ctx) return UI.toast('融合拆书暂无分析数据，请先在融合拆书中进行拆解或运行流水线');
        this.data.fusionContext = ctx;
        UI.toast('已从融合拆书拉取 ' + ctx.length + ' 字精华');
        const view = document.getElementById('module-view-phoenix');
        if(view) view.innerHTML = this.render();
    },

    // ===== Navigation =====
    goStep(s) { this.step = s; this.refresh(); },
    next() {
        if (this.step === 0) {
            this.data.idea = (document.getElementById('ph-idea') || {}).value || '';
            this.data.genre = (document.getElementById('ph-genre') || {}).value || '';
            this.data.style = (document.getElementById('ph-style') || {}).value || '';
            this.data.outlineRaw = (document.getElementById('ph-outline-raw') || {}).value || '';
            if (!this.data.outlineRaw) return UI.toast('请先生成细纲', 'error');
        } else if (this.step === 1) {
            this.data.outlineRaw = (document.getElementById('ph-outline-edit') || {}).value || '';
        }
        if (this.step < 2) {
            this.step++;
            this.refresh();
            if (this.step === 2) {
                const chapCount = (this.data.outlineRaw.match(/###/g) || []).length;
                const volCount = (this.data.outlineRaw.match(/^## /gm) || []).length;
                const el = document.getElementById('ph-chap-count'); if(el) el.innerText = chapCount;
                const vl = document.getElementById('ph-vol-count'); if(vl) vl.innerText = volCount;
            }
        } else {
            this.finish();
        }
    },
    prev() {
        if (this.step > 0) {
            if (this.step === 1) this.data.outlineRaw = (document.getElementById('ph-outline-edit') || {}).value || '';
            this.step--;
            this.refresh();
        }
    },
    refresh() {
        const view = document.getElementById('module-view-phoenix');
        if (view) view.innerHTML = this.render();
    },

    // ===== Tabs =====
    tab(t) {
        this._activeTab = t;
        ['preview', 'fusion', 'pipeline'].forEach(x => {
            const el = document.getElementById('ph-tab-' + x);
            const btn = document.getElementById('ph-tab-btn-' + x);
            if (el) { if (x === t) el.classList.remove('hidden'); else el.classList.add('hidden'); }
            if (btn) { if (x === t) btn.classList.add('active'); else btn.classList.remove('active'); }
        });
    },
    updateIO(input, output) {
        const inEl = document.getElementById('ph-io-input');
        const outEl = document.getElementById('ph-io-output');
        if (inEl) inEl.value = input;
        if (outEl) outEl.value = output;
    },
    updatePreview() {
        const raw = (document.getElementById('ph-outline-edit') || {}).value || '';
        const el = document.getElementById('ph-outline-preview');
        if (el) el.innerText = raw;
    },
    _updateStats() {
        const raw = (document.getElementById('ph-outline-raw') || {}).value || '';
        const el = document.getElementById('ph-outline-stats');
        if(el) el.textContent = raw.length + ' 字 · ' + ((raw.match(/###/g)||[]).length) + ' 章';
    },
    _setGenerating(on) {
        this._generating = on;
        const genBtn = document.getElementById('ph-gen-btn');
        const stopBtn = document.getElementById('ph-stop-btn');
        const progressSection = document.getElementById('ph-gen-progress');
        if(genBtn) { if(on) genBtn.classList.add('opacity-50','pointer-events-none'); else genBtn.classList.remove('opacity-50','pointer-events-none'); }
        if(stopBtn) { if(on) stopBtn.classList.remove('hidden'); else stopBtn.classList.add('hidden'); }
        if(progressSection) { if(on) progressSection.classList.remove('hidden'); else progressSection.classList.add('hidden'); }
    },

    /** 更新生成进度显示 */
    _updateGenProgress(text) {
        const statusEl = document.getElementById('ph-gen-status');
        const counterEl = document.getElementById('ph-gen-counter');
        const barEl = document.getElementById('ph-gen-bar');
        if(!statusEl || !counterEl || !barEl) return;

        const words = text.length;
        const chaps = (text.match(/### /g) || []).length;
        const vols = (text.match(/^## /gm) || []).length;
        counterEl.textContent = `${words} 字 · ${chaps} 章 · ${vols} 卷`;

        // 根据内容推断阶段
        let status = '正在构思...';
        let pct = Math.min(5 + words / 50, 15); // 起步 5-15%
        if(vols >= 1) { status = '正在生成第一卷...'; pct = 15; }
        if(vols >= 2) { status = '正在生成第二卷...'; pct = 35; }
        if(vols >= 3) { status = '正在生成第三卷...'; pct = 55; }
        if(vols >= 4) { status = '正在扩展后续卷...'; pct = 70; }
        if(vols >= 5) { status = '正在收尾...'; pct = 85; }
        if(words > 3000 && chaps >= 5) { status = '正在完善细节...'; pct = 90; }

        statusEl.textContent = status;
        barEl.style.width = pct + '%';
    },

    stopGen() { this._setGenerating(false); UI.toast('已停止'); },

    // ===== 核心: 融合技法驱动生成 (新增) =====
    async fusionDrivenGen() {
        if(this._generating) return;
        const fusionCtx = this._getFusionFullContext();
        if(!fusionCtx) return UI.toast('请先在融合拆书中运行流水线获取融合精华');
        const idea = (document.getElementById('ph-idea') || {}).value || '';
        const genre = (document.getElementById('ph-genre') || {}).value || '';
        const style = (document.getElementById('ph-style') || {}).value || '';

        const prompt = `你是一位年入千万的网文大神级策划师，精通所有爆款网文的底层套路。现在你手握两本畅销书的融合技法精华，请运用这些技法来构建一部让读者疯狂追更的长篇网文细纲。

${fusionCtx}
${this.data.worldContext ? '[世界观设定]\n' + this.data.worldContext.slice(0,2000) + '\n\n' : ''}${idea ? '[作者创意]\n' + idea + '\n\n' : ''}${genre ? '[类型] ' + genre + '\n' : ''}${style ? '[风格] ' + style + '\n' : ''}
[核心要求]
1. 必须深度运用上述融合技法中的每一项套路（开篇钩子模板、节奏公式、爽点矩阵、悬念体系）
2. 每章标注运用了哪些融合技法
3. 格式：## 第X卷：卷名 / ### 第X章：章名 / **情节：** / **看点：**
4. 至少生成前3卷，每卷6-8章
5. 每章必须包含：核心事件、运用技法、爽点设计（装逼打脸/升级突破/众人震惊等）、章末钩子
6. 网文铁律：开篇三章定生死，3章一小高潮，卷末大高潮+超级悬念
7. 主角每章必须有成长或收获，绝不能连续吃瘪
8. 确保全书有完整的主线悬念链和伏笔回收计划
9. 升级体系要清晰，每次突破都要有仪式感和爽感`;

        const el = document.getElementById('ph-outline-raw');
        if (el) el.value = '';
        this.updateIO(prompt, '融合技法驱动生成中...');
        this._setGenerating(true);
        let fullRes = '';
        await AI.generate(prompt, {}, c => {
            fullRes += c;
            if (el) el.value = fullRes;
            this.data.outlineRaw = fullRes;
            this.updateIO(prompt, fullRes);
            this._updateStats();
            this._updateGenProgress(fullRes);
        });
        this._setGenerating(false);
        if (typeof MemorySystem !== 'undefined') MemorySystem.addWorking('[凤凰流/融合驱动细纲] ' + (fullRes || '').slice(0, 200), 'outline', 5);
        UI.toast('融合技法驱动生成完成');
    },

    // ===== 普通生成细纲 (注入融合上下文) =====
    async genOutline() {
        if(this._generating) return;
        const idea = (document.getElementById('ph-idea') || {}).value || '';
        const genre = (document.getElementById('ph-genre') || {}).value || '';
        const style = (document.getElementById('ph-style') || {}).value || '';
        if (!idea) return UI.toast('请输入核心创意');

        try {
            const existingPrompt = await DB.get('prompts', 'phoenix_outline');
            // 如果没有自定义提示词，或者还是旧版简单提示词，则更新为网文专业版
            if (!existingPrompt || (existingPrompt.content && existingPrompt.content.length < 300)) {
                await DB.put('prompts', { id: 'phoenix_outline', name: 'phoenix_outline', content: `你是一位精通网文套路的顶级大纲策划师，擅长设计让读者欲罢不能的爽文结构。

基于创意【{{idea}}】
类型：{{genre}}
风格：{{style}}

请生成一份详细的长篇网文分卷细纲。

格式要求：
## 第一卷：卷名（用吸引眼球的卷名）
### 第一章：章名
**情节：** 本章核心事件、冲突推进、主角行动
**看点：** 爽点设计/反转/悬念钩子/读者情绪引导
### 第二章：章名
...

网文铁律（必须遵守）：
1. 开篇三章定生死——第一章必须有强钩子（重生/觉醒/打脸/金手指激活），让读者根本停不下来
2. 黄金三章法则：冲突→小高潮→更大悬念，3章一个小循环
3. 爽点密度：每章至少一个爽点（装逼打脸/实力碾压/获得宝物/突破升级/美女倒贴/众人震惊）
4. 悬念钩子：每章结尾必须留钩子，让读者忍不住看下一章
5. 主角光环：主角每章都要有成长、收获或装逼时刻，绝不能让主角吃瘪超过1章
6. 节奏控制：紧3松1，连续3章高强度剧情后安排1章过渡（但过渡章也要有伏笔和小爽点）
7. 卷末大高潮：每卷结尾必须是全卷最燃最爽的大场面，同时埋下一卷的超级悬念
8. 升级体系清晰：主角的实力成长要有明确的阶梯感，每次突破都要有仪式感
9. 配角工具人到位：每个配角都要有明确功能（衬托主角/制造冲突/提供资源/搞笑调节）
10. 伏笔回收：前面埋的伏笔要在合适时机回收，给读者"原来如此"的爽感

至少生成前3卷，每卷6-8章，每章情节描述不少于100字。` });
            }
        } catch (e) {}

        this.data.idea = idea; this.data.genre = genre; this.data.style = style;

        let promptTpl = await Modules.short.getPrompt('phoenix_outline');
        let prompt = promptTpl.replace('{{idea}}', idea).replace('{{genre}}', genre).replace('{{style}}', style).replace('{{input}}', idea);

        // ★ NEXUS OS v2.0 完整协议注入
        prompt = this._buildNEXUSCore({ mode: 'outline' });

        // M04A/B/C 融合上下文注入
        const fusionCtx = this._getFusionFullContext();
        if(fusionCtx) prompt += '[M04 融合技法参考 — 请在细纲中运用这些技法]\n' + fusionCtx + '\n\n';
        if(this.data.worldContext) prompt += '[世界引擎素材]\n' + this.data.worldContext.slice(0,2000) + '\n\n';
        if(this.data.fusionContext && !fusionCtx) prompt += '[融合拆书精华]\n' + this.data.fusionContext.slice(0,1500) + '\n\n';

        // 原始Prompt注入
        prompt += `=== 原始创作指令 ===\n${promptTpl.replace('{{idea}}', idea).replace('{{genre}}', genre).replace('{{style}}', style)}`;

        const el = document.getElementById('ph-outline-raw');
        if (el) el.value = '';
        this.updateIO(prompt, '生成中...');
        this._setGenerating(true);

        let fullRes = '';
        await AI.generate(prompt, {}, c => {
            fullRes += c;
            if (el) el.value = fullRes;
            this.data.outlineRaw = fullRes;
            this.updateIO(prompt, fullRes);
            this._updateStats();
        });
        this._setGenerating(false);
        if (typeof MemorySystem !== 'undefined') MemorySystem.addWorking('[凤凰流/细纲] ' + (fullRes || '').slice(0, 200), 'outline', 4);
    },

    async continueGen() {
        if(this._generating) return;
        let current = (document.getElementById('ph-outline-raw') || {}).value || '';
        // ★ 支持外部导入后无缝续写：如果编辑器为空但有 importedWorld.rawContent，尝试提取大纲
        if(!current && this.data.importedWorld && this.data.importedWorld.rawContent) {
            current = this._extractOutlineFromImport(this.data.importedWorld.rawContent);
            if(current) {
                const el = document.getElementById('ph-outline-raw');
                if(el) el.value = current;
                this.data.outlineRaw = current;
            }
        }
        if (!current) return UI.toast('请先生成大纲或导入世界观/大纲');

        const fusionCtx = this._getFusionFullContext();
        const genre = this.data.genre || '';
        const style = this.data.style || '';

        // 分析当前进度
        const bp = this._detectBreakpoint(current);

        // ★ NEXUS OS v2.0 完整协议注入
        let prompt = this._buildNEXUSCore({ mode: 'continue' });

        prompt += `[核心任务] 你正在为一部${genre || '网文'}长篇小说撰写分卷细纲，风格定位：${style || '爽文、快节奏'}。\n\n`;
        prompt += `[续写约束]\n`;
        prompt += `- 你必须从上文最后断开的位置【无缝衔接】继续往下写，不要重复已有内容\n`;
        prompt += `- 当前已写到：${bp.lastVol} / ${bp.lastChap}（共${bp.volCount}卷${bp.chapCount}章）\n`;
        prompt += `- 继续保持 ## 卷名 / ### 章名 / **情节** / **看点** 格式\n`;
        prompt += `- 每章必须包含：核心事件+冲突推进+爽点/反转/悬念钩子\n`;
        prompt += `- 节奏要求：3章一小高潮，卷末大高潮+悬念钩子（黄金螺旋）\n`;
        prompt += `- 主角每章都要有成长或收获，读者每章都要有爽感或期待感\n`;
        prompt += `- 至少继续写2-3卷，每卷5-8章\n\n`;
        if(fusionCtx) prompt += '[融合技法参考]\n' + fusionCtx.slice(0, 2000) + '\n\n';
        if(this.data.worldContext) prompt += '[世界观设定]\n' + this.data.worldContext.slice(0, 1500) + '\n\n';
        prompt += `[已有细纲末尾]\n${current.slice(-3000)}\n\n请从断点处直接继续，不要任何开场白或解释，直接输出后续的卷章内容：`;

        this.updateIO(prompt, '续写中...');
        this._setGenerating(true);
        await AI.generate(prompt, {}, c => {
            const el = document.getElementById('ph-outline-raw');
            if (el) { el.value += c; el.scrollTop = el.scrollHeight; }
            this.data.outlineRaw = el ? el.value : '';
            this._updateGenProgress(el ? el.value : '');
            this.updateIO(prompt, this.data.outlineRaw);
            this._updateStats();
        });
        this._setGenerating(false);
    },

    // ===== 迭代优化 (注入融合技法) =====
    async iterateOutline() {
        if(this._generating) return;
        const current = (document.getElementById('ph-outline-raw') || {}).value || '';
        if (!current) return UI.toast('请先生成大纲');
        const fusionCtx = this._getFusionFullContext();
        let prompt = `[任务] 请对以下小说细纲进行迭代优化：\n1. 检查逻辑漏洞和前后矛盾\n2. 优化节奏，确保高潮迭起\n3. 加强伏笔和悬念设置\n4. 丰富每章的情节密度\n5. 确保人物弧光完整\n`;
        if(fusionCtx) prompt += `\n[融合技法参考 — 请用这些技法优化细纲]\n${fusionCtx.slice(0, 3000)}\n`;
        prompt += `\n[当前细纲]\n${current.slice(0,6000)}\n\n请输出优化后的完整细纲，保持原有格式。`;
        const el = document.getElementById('ph-outline-raw');
        if(el) el.value = '';
        this.updateIO(prompt, '迭代优化中...');
        this._setGenerating(true);
        let fullRes = '';
        await AI.generate(prompt, {}, c => {
            fullRes += c;
            if(el) el.value = fullRes;
            this.data.outlineRaw = fullRes;
            this._updateStats();
        });
        this._setGenerating(false);
        UI.toast('迭代优化完成');
    },

    // ★ 断点检测：分析已有大纲，找出已完成的卷/章数
    _detectBreakpoint(text) {
        const volMatches = text.match(/^## .+$/gm) || [];
        const chapMatches = text.match(/^### .+$/gm) || [];
        const lastVol = volMatches.length > 0 ? volMatches[volMatches.length - 1] : '';
        const lastChap = chapMatches.length > 0 ? chapMatches[chapMatches.length - 1] : '';
        return { volCount: volMatches.length, chapCount: chapMatches.length, lastVol, lastChap };
    },

    // ★ 从导入的原始文本中提取/构造大纲（支持循环标记识别）
    _extractOutlineFromImport(rawContent) {
        if(!rawContent) return '';
        // 检测是否已有大纲格式
        if(rawContent.includes('## ') && rawContent.includes('### ')) return rawContent;
        // 检测循环标记如 【循环1-5】
        const cycleMatches = rawContent.match(/【循环\s*(\d+)[\-~]\s*(\d+)\s*】/g);
        if(cycleMatches) {
            let outline = '# 导入大纲（含循环标记）\n\n';
            const lines = rawContent.split('\n');
            let currentVol = '导入卷';
            outline += `## ${currentVol}\n\n`;
            let chapNum = 1;
            lines.forEach(line => {
                const cycleM = line.match(/【循环\s*(\d+)[\-~]\s*(\d+)\s*】/);
                if(cycleM) {
                    outline += `\n### 第${chapNum}章：循环${cycleM[1]}-${cycleM[2]}\n**情节：** ${line.replace(/【循环[^】]+】/, '').trim()}\n**看点：** 循环技法融合\n\n`;
                    chapNum++;
                } else if(line.trim().length > 20) {
                    outline += `### 第${chapNum}章：未命名\n**情节：** ${line.trim().slice(0,200)}\n\n`;
                    chapNum++;
                }
            });
            return outline;
        }
        // 简单分段作为大纲
        const paragraphs = rawContent.split('\n').filter(p => p.trim().length > 30);
        if(paragraphs.length) {
            let outline = '# 导入大纲\n\n## 导入卷\n\n';
            paragraphs.forEach((p, i) => {
                outline += `### 第${i+1}章：未命名\n**情节：** ${p.trim().slice(0,300)}\n\n`;
            });
            return outline;
        }
        return '';
    },

    // ===== 扩展细化 (注入融合技法) =====
    async expandOutline() {
        if(this._generating) return;
        const current = (document.getElementById('ph-outline-raw') || {}).value || '';
        if (!current) return UI.toast('请先生成大纲');
        const fusionCtx = this._getFusionFullContext();
        let prompt = `[任务] 请对以下细纲进行扩展细化：\n1. 为每章增加更详细的场景描述\n2. 补充角色的情感变化和内心活动\n3. 增加具体的对话提示和名场面设计\n4. 标注每章的字数建议和节奏标记\n`;
        if(fusionCtx) prompt += `\n[融合技法参考 — 请运用这些技法扩展]\n${fusionCtx.slice(0, 3000)}\n`;
        prompt += `\n[当前细纲]\n${current.slice(0,6000)}\n\n请输出扩展后的完整细纲。`;
        const el = document.getElementById('ph-outline-raw');
        if(el) el.value = '';
        this.updateIO(prompt, '扩展细化中...');
        this._setGenerating(true);
        let fullRes = '';
        await AI.generate(prompt, {}, c => {
            fullRes += c;
            if(el) el.value = fullRes;
            this.data.outlineRaw = fullRes;
            this._updateStats();
        });
        this._setGenerating(false);
        UI.toast('扩展细化完成');
    },

    // ===== 融合技法润色 (新增: 用融合精华重新润色现有细纲) =====
    async fusionRefine() {
        if(this._generating) return;
        const current = (document.getElementById('ph-outline-raw') || document.getElementById('ph-outline-edit') || {}).value || '';
        if (!current) return UI.toast('大纲为空');
        const fusionCtx = this._getFusionFullContext();
        if(!fusionCtx) return UI.toast('请先在融合拆书中运行流水线获取融合精华');

        const prompt = `你是网文技法大师。请用以下融合技法精华来润色和强化这份细纲。

${fusionCtx}
[当前细纲]
${current.slice(0,6000)}

[润色要求]
1. 用融合技法中的「开篇钩子模板」优化每章开头
2. 用「节奏公式」调整全书节奏曲线
3. 用「爽点矩阵」在关键节点插入爽点
4. 用「悬念体系」加强伏笔和钩子
5. 每章标注运用了哪些融合技法
6. 保持原有故事框架不变，只强化技法运用

请输出润色后的完整细纲。`;

        const el = document.getElementById('ph-outline-raw') || document.getElementById('ph-outline-edit');
        if(el) el.value = '';
        this.updateIO(prompt, '融合技法润色中...');
        this._setGenerating(true);
        let fullRes = '';
        await AI.generate(prompt, {}, c => {
            fullRes += c;
            if(el) { el.value = fullRes; }
            this.data.outlineRaw = fullRes;
            this._updateStats();
        });
        this._setGenerating(false);
        UI.toast('融合技法润色完成');
    },

    async analyzeOutline() {
        if(this._generating) return;
        const current = (document.getElementById('ph-outline-raw') || {}).value || '';
        if (!current) return UI.toast('大纲为空');
        
        UI.toast('正在分析节奏...');
        const nexusCore = this._buildNEXUSCore({ mode: 'outline' });
        const prompt = `${nexusCore}\n\n=== 节奏分析任务 ===\n你是一位专业的网文节奏分析师。请对以下细纲进行深度节奏分析。

[当前细纲]
${current.slice(0, 8000)}

【分析维度】
1. 整体节奏曲线（开篇、发展、高潮、结尾的节奏分布）
2. 章节节奏评估（每章的紧张度/舒缓度）
3. 高潮点检测（识别高潮章节和低谷章节）
4. 爽点密度分析（爽点分布是否合理）
5. 悬念链分析（伏笔埋设和回收情况）
6. 问题诊断（节奏拖沓/过快/断层的位置）

【输出格式】
## 节奏曲线图
(用文字描述节奏走势)

## 章节节奏表
| 章节 | 紧张度 | 类型 | 问题 |
|------|--------|------|------|

## 高潮分布
- 主要高潮：第X章、第Y章...
- 次要高潮：...

## 问题诊断
1. ...
2. ...

## 优化建议
1. ...
2. ...`;

        this.updateIO(prompt, '分析中...');
        let result = '';
        await AI.generate(prompt, {}, c => {
            result += c;
            this.updateIO(prompt, result);
        });
        
        const el = document.getElementById('ph-outline-raw');
        if (el) {
            el.value = current + '\n\n---\n\n【节奏分析报告】\n' + result;
            this.data.outlineRaw = el.value;
            this._updateStats();
        }
        UI.toast('节奏分析完成！');
    },

    async checkPlotHoles() {
        if(this._generating) return;
        const current = (document.getElementById('ph-outline-raw') || {}).value || '';
        if (!current) return UI.toast('大纲为空');
        
        UI.toast('正在检测漏洞...');
        const nexusCore = this._buildNEXUSCore({ mode: 'outline' });
        const prompt = `${nexusCore}\n\n=== 漏洞检测任务 ===\n你是一位严谨的逻辑审核专家。请检查以下小说细纲中的逻辑漏洞和问题。

[当前细纲]
${current.slice(0, 8000)}

【检测维度】
1. 逻辑漏洞（前后矛盾、因果不通、设定冲突）
2. 人物行为逻辑（动机是否合理、行为是否符合人设）
3. 时间线问题（时间顺序错误、时间跨度不合理）
4. 设定漏洞（世界观设定自相矛盾）
5. 情节漏洞（关键转折缺乏铺垫、巧合过多）
6. 伏笔问题（伏笔未回收、突兀出现）

【输出格式】
## 发现的问题 (共X个)

### 问题1：[问题类型]
- 位置：第X章
- 描述：...
- 严重程度：高/中/低
- 修复建议：...

### 问题2：...

## 总体评估
- 逻辑完整性：X/10
- 人物一致性：X/10
- 设定自洽性：X/10

## 优先修复建议
1. ...
2. ...`;

        this.updateIO(prompt, '检测中...');
        let result = '';
        await AI.generate(prompt, {}, c => {
            result += c;
            this.updateIO(prompt, result);
        });
        
        const el = document.getElementById('ph-outline-raw');
        if (el) {
            el.value = current + '\n\n---\n\n【漏洞检测报告】\n' + result;
            this.data.outlineRaw = el.value;
            this._updateStats();
        }
        UI.toast('漏洞检测完成！');
    },

    async enhanceHooks() {
        if(this._generating) return;
        const current = (document.getElementById('ph-outline-raw') || {}).value || '';
        if (!current) return UI.toast('大纲为空');
        
        UI.toast('正在强化钩子...');
        
        const fusionCtx = this._getFusionFullContext();
        const nexusCore = this._buildNEXUSCore({ mode: 'outline' });
        const prompt = `${nexusCore}\n\n=== 钩子强化任务 ===\n你是一位钩子设计大师。请强化以下细纲中的悬念钩子，让读者欲罢不能。

${fusionCtx ? '[融合技法参考]\n' + fusionCtx.slice(0, 1500) + '\n\n' : ''}
[当前细纲]
${current.slice(0, 6000)}

【强化要求】
1. 每章结尾必须有钩子（悬念/反转/期待）
2. 开篇三章要有超级钩子（让读者停不下来）
3. 卷末必须有超级悬念（让读者迫不及待看下一卷）
4. 钩子类型多样化（身份悬念、危机悬念、情感悬念、宝物悬念等）
5. 标注每个钩子的类型和预期效果

【输出格式】
保持原有细纲结构，在每章末尾添加：
**章末钩子：** [钩子内容] (类型：悬念/反转/期待)

请输出强化后的完整细纲。`;

        const el = document.getElementById('ph-outline-raw');
        if (el) el.value = '';
        this.updateIO(prompt, '强化钩子中...');
        this._setGenerating(true);
        let result = '';
        await AI.generate(prompt, {}, c => {
            result += c;
            if (el) el.value = result;
            this.data.outlineRaw = result;
            this._updateStats();
            this.updateIO(prompt, result);
        });
        this._setGenerating(false);
        UI.toast('钩子强化完成！');
    },

    async addClimax() {
        if(this._generating) return;
        const current = (document.getElementById('ph-outline-raw') || {}).value || '';
        if (!current) return UI.toast('大纲为空');
        
        UI.toast('正在添加高潮...');
        
        const fusionCtx = this._getFusionFullContext();
        const nexusCore = this._buildNEXUSCore({ mode: 'outline' });
        const prompt = `${nexusCore}\n\n=== 高潮设计任务 ===\n你是一位高潮设计专家。请在以下细纲中添加更多高潮点，让故事更加燃爆。

${fusionCtx ? '[融合技法参考]\n' + fusionCtx.slice(0, 1500) + '\n\n' : ''}
[当前细纲]
${current.slice(0, 6000)}

【高潮设计原则】
1. 每3-5章必须有一个小高潮
2. 每卷必须有1-2个大高潮
3. 高潮类型：打脸高潮、突破高潮、战斗高潮、揭秘高潮、情感高潮
4. 高潮前要有铺垫和压抑，高潮后要有释放和爽感
5. 高潮要有仪式感（众人震惊、实力展示、身份揭露等）

【输出格式】
保持原有细纲结构，在需要高潮的位置添加：
**【高潮】** [高潮内容] (类型：打脸/突破/战斗/揭秘/情感)

请输出添加高潮后的完整细纲。`;

        const el = document.getElementById('ph-outline-raw');
        if (el) el.value = '';
        this.updateIO(prompt, '添加高潮中...');
        this._setGenerating(true);
        let result = '';
        await AI.generate(prompt, {}, c => {
            result += c;
            if (el) el.value = result;
            this.data.outlineRaw = result;
            this._updateStats();
            this.updateIO(prompt, result);
        });
        this._setGenerating(false);
        UI.toast('高潮添加完成！');
    },

    // ===== AI打磨对话 (深度注入融合上下文) =====
    async sendChat() {
        const input = document.getElementById('ph-chat-in');
        const log = document.getElementById('ph-chat-log');
        if (!input || !log) return;
        const txt = input.value.trim();
        if (!txt) return;
        input.value = '';
        log.innerHTML += `<div class="p-2 bg-accent/10 rounded-lg border border-accent/20"><span class="text-accent font-bold text-[10px]">你</span><div class="text-gray-200 mt-1">${txt}</div></div>`;
        const outline = this.data.outlineRaw || (document.getElementById('ph-outline-raw') || {}).value || '';
        const fusionCtx = this._getFusionFullContext();
        const contextPrompt = `[你是一位资深小说策划，精通融合技法，正在帮助作者打磨大纲]\n\n${fusionCtx ? '[融合技法参考]\n' + fusionCtx.slice(0, 2000) + '\n\n' : ''}[当前大纲]\n${outline.slice(0,4000)}\n\n[作者要求]\n${txt}\n\n请根据作者要求修改或建议。如果需要修改大纲，请输出修改后的完整段落。可以引用融合技法中的具体套路来支撑你的建议。`;
        let reply = '';
        await AI.generate(contextPrompt, {}, c => { reply += c; });
        log.innerHTML += `<div class="p-2 bg-white/5 rounded-lg border border-white/5"><span class="text-green-400 font-bold text-[10px]">AI</span><div class="text-gray-300 mt-1 text-xs leading-relaxed">${reply}</div></div>`;
        log.scrollTop = log.scrollHeight;
    },

    // ===== 智能生成（空时生成，有内容时续写） =====
    async smartGen() {
        const current = (document.getElementById('ph-outline-raw') || {}).value || '';
        if (!current || current.trim().length < 50) {
            await this.genOutline();
        } else {
            await this.continueGen();
        }
    },

    // ===== 内联AI对话 =====
    async sendInlineChat() {
        const input = document.getElementById('ph-inline-chat-in');
        const log = document.getElementById('ph-inline-chat-log');
        if (!input || !log) return;
        const txt = input.value.trim();
        if (!txt) return;
        input.value = '';
        log.innerHTML += `<div class="p-1.5 bg-accent/10 rounded border border-accent/20"><span class="text-accent font-bold text-[9px]">你</span><div class="text-gray-200 mt-0.5 text-[10px]">${txt}</div></div>`;
        const outline = this.data.outlineRaw || (document.getElementById('ph-outline-raw') || {}).value || '';
        const fusionCtx = this._getFusionFullContext();
        const prompt = `[你是一位资深小说策划，精通网文套路和融合技法]\n\n${fusionCtx ? '[融合技法参考]\n' + fusionCtx.slice(0, 1500) + '\n\n' : ''}[当前大纲]\n${outline.slice(0,3000)}\n\n[作者要求]\n${txt}\n\n请直接输出修改后的相关段落，不要开场白。如果要求不涉及大纲修改，给出建议即可。`;
        let reply = '';
        await AI.generate(prompt, {}, c => { reply += c; });
        log.innerHTML += `<div class="p-1.5 bg-white/5 rounded border border-white/5"><span class="text-green-400 font-bold text-[9px]">AI</span><div class="text-gray-300 mt-0.5 text-[10px] leading-relaxed">${reply}</div></div>`;
        log.scrollTop = log.scrollHeight;
    },

    // ===== 快捷优化 =====
    async _quickOptimize(type) {
        const outline = this.data.outlineRaw || (document.getElementById('ph-outline-raw') || {}).value || '';
        if (!outline) return UI.toast('请先生成大纲');
        const fusionCtx = this._getFusionFullContext();
        let task = '', instruction = '';
        switch(type) {
            case 'expand': task = '扩写'; instruction = '把当前最后一卷或最短的卷扩写，每章情节描述增加到150字以上，增加细节和冲突'; break;
            case 'hook': task = '加钩子'; instruction = '为每章结尾添加或强化悬念钩子，确保读者忍不住想看下一章'; break;
            case 'cool': task = '加爽点'; instruction = '在合适的位置增加爽点设计（装逼打脸/实力碾压/收获/突破），每章至少一个'; break;
            case 'trim': task = '精简'; instruction = '删除冗余描述，精简情节，保留核心冲突和爽点，让大纲更紧凑'; break;
            case 'custom':
                const custom = prompt('输入你的优化要求：');
                if (!custom) return;
                task = '自定义优化'; instruction = custom;
                break;
        }
        const prompt = `[小说大纲${task}]\n\n${fusionCtx ? '[融合技法参考]\n' + fusionCtx.slice(0, 1500) + '\n\n' : ''}[当前大纲]\n${outline.slice(0,4000)}\n\n[优化要求]\n${instruction}\n\n请直接输出优化后的完整大纲，保持原有格式（##卷名 / ###章名 / **情节** / **看点**）。`;
        const el = document.getElementById('ph-outline-raw');
        if (el) el.value = '';
        this._setGenerating(true);
        let result = '';
        await AI.generate(prompt, {}, c => {
            result += c;
            if (el) { el.value = result; this.data.outlineRaw = result; this._updateStats(); }
        });
        this._setGenerating(false);
        UI.toast(task + '完成');
    },

    // ===== AI润色大纲 (Step 2) =====
    async aiPolishOutline() {
        const el = document.getElementById('ph-outline-edit');
        const current = el ? el.value : '';
        if(!current) return UI.toast('大纲为空');
        const prompt = `[任务] 请润色以下小说大纲，提升文笔和表达力，但保持结构和内容不变：\n\n${current.slice(0,6000)}`;
        if(el) el.value = '';
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; if(el) el.value = fullRes; this.updatePreview(); });
        UI.toast('大纲润色完成');
    },

    // ===== 导出到阅读 =====
    async exportToLib() {
        const content = (document.getElementById('ph-outline-raw') || {}).value || this.data.outlineRaw;
        if(!content) return UI.toast('没有可导出的内容');
        if(typeof ContextHelper !== 'undefined') ContextHelper.exportToLibrary('凤凰细纲_' + new Date().toLocaleTimeString(), content);
        else UI.toast('导出失败');
    },

    // ===== 完成时同步世界引擎 =====
    async syncWorldOnFinish() {
        const outline = this.data.outlineRaw;
        if(!outline) return;
        const volMatches = outline.match(/^## .+$/gm) || [];
        for(const vol of volMatches) {
            const title = vol.replace('## ', '').trim();
            const id = 'world_phoenix_' + title.slice(0,10);
            await DB.put('entities', { id, name: '凤凰流_' + title, type: '情节', desc: '来自凤凰创作流的卷级大纲: ' + title, source: 'phoenix' });
        }
        // ★ 按循环组织章节（每5章一个循环，自动创建cycle记录）
        const chapMatches = outline.match(/^### .+$/gm) || [];
        if(chapMatches.length > 0 && Modules.world_engine) {
            const cycleSize = 5;
            const totalCycles = Math.ceil(chapMatches.length / cycleSize);
            for(let c = 0; c < totalCycles; c++) {
                const start = c * cycleSize + 1;
                const end = Math.min((c + 1) * cycleSize, chapMatches.length);
                await Modules.world_engine.syncCycle({
                    id: `cycle_${start}_${end}`,
                    bookId: 'phoenix_export',
                    startChapter: start,
                    endChapter: end,
                    cycleNum: c + 1,
                    cycleSize,
                    fusionEssence: `【凤凰创作流导出】卷级大纲包含 ${volMatches.length} 卷 ${chapMatches.length} 章`,
                    entityNames: [],
                    chapterIds: chapMatches.slice(start-1, end).map((_, i) => 'ch_' + (start + i)),
                    nexusCHR: [], nexusWLD: [], nexusFOE: [], nexusEMO: [],
                    createdAt: Date.now()
                });
            }
        }
        UI.toast('已同步 ' + volMatches.length + ' 个卷、' + Math.ceil(chapMatches.length/5) + ' 个循环到世界引擎');
    },

    // ===== Finish: Import to Writer =====
    async finish() {
        const lines = this.data.outlineRaw.split('\n');
        let currentVolId = null, volOrder = 1, chapOrder = 1;
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) continue;
            if (line.startsWith('## ')) {
                const volTitle = line.replace('## ', '').trim();
                currentVolId = Utils.uuid();
                await DB.put('volumes', { id: currentVolId, title: volTitle, order: volOrder++ });
            } else if (line.startsWith('### ')) {
                const title = line.replace('### ', '').trim();
                let outlineContent = '';
                for (let j = i + 1; j < lines.length; j++) {
                    const nextLine = lines[j].trim();
                    if (nextLine.startsWith('#')) break;
                    outlineContent += nextLine + '\n';
                }
                await DB.put('chapters', {
                    id: Utils.uuid(), title, content: '', outline: outlineContent.trim() || '从凤凰流导入',
                    order: chapOrder++, volumeId: currentVolId
                });
            }
        }
        // 将融合技法存入writer规则，供续写时参考
        const fusionCtx = this._getFusionFullContext();
        if(fusionCtx) {
            const existing = await DB.get('settings', 'writer_rules') || {};
            const fusionRules = '\n\n[融合技法参考 — 来自凤凰创作流]\n' + fusionCtx.slice(0, 3000);
            await DB.put('settings', { id: 'writer_rules', rules: (existing.rules || '') + fusionRules, continueRules: existing.continueRules || '' });
        }
        // 自动注入已提取的实体到世界引擎
        const extracted = this.data._extractedEntities || [];
        if (extracted.length > 0) {
            await this._injectExtractedEntities();
        }
        await this.syncWorldOnFinish();
        App.nav('writer');
        UI.toast('已导入执笔台（含融合技法+实体）', 'success');
        setTimeout(() => Modules.writer.loadTree(), 500);
    },

    // ===== 导入世界观设定 (新增) =====
    async importWorldSetting() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.md,.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const content = ev.target.result;
                await this._parseWorldSetting(content, file.name);
            };
            reader.readAsText(file);
        };
        input.click();
    },

    async _parseWorldSetting(content, filename) {
        UI.toast('正在解析世界观设定...');
        
        const prompt = `你是一个专业的世界观解析引擎。请从以下文本中提取世界观设定，并按照指定格式输出。

【输入文本】
${content.slice(0, 8000)}

【提取要求】
请提取以下类型的信息：
1. 人物 - 角色名、身份、性格、外貌、能力、背景
2. 物品 - 武器、法宝、道具、关键物件
3. 地点 - 场景、城市、秘境、地标
4. 势力 - 门派、组织、阵营、国家
5. 种族 - 种族、族群、特殊生物
6. 魔法 - 功法、技能、法术体系
7. 规则 - 世界运行规则、力量等级
8. 文化 - 风俗、信仰、语言、节日
9. 历史 - 历史事件、传说、纪元
10. 技法 - 写作技法、叙事手法

【世界观维度】
同时请将内容归类到以下世界观维度：
- history (历史与传说)
- geography (地理与地貌)
- magic (魔法/科技体系)
- factions (势力与组织)
- species (种族与生物)
- rules (世界规则)
- culture (文化与习俗)

【输出格式】严格JSON：
{
  "entities": [
    {"name":"实体名","type":"类型","desc":"详细描述","relations":["关系:关联实体"]}
  ],
  "worldview": {
    "history":"历史与传说内容",
    "geography":"地理与地貌内容",
    "magic":"魔法/科技体系内容",
    "factions":"势力与组织内容",
    "species":"种族与生物内容",
    "rules":"世界规则内容",
    "culture":"文化与习俗内容"
  },
  "summary":"世界观整体概述（100字以内）"
}

直接输出JSON，不要包裹markdown代码块。`;

        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; });

        let parsed = null;
        try {
            let cleanRes = fullRes.trim().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
            parsed = JSON.parse(cleanRes);
        } catch(e) {
            const m = fullRes.match(/\{[\s\S]*\}/);
            if(m) {
                try { parsed = JSON.parse(m[0]); } catch(e2) {}
            }
        }

        if (!parsed) {
            UI.toast('解析失败，请检查文件格式');
            return;
        }

        let entityCount = 0;
        let worldCount = 0;
        const now = Date.now();

        // 保存实体
        if (parsed.entities && Array.isArray(parsed.entities)) {
            for (const ent of parsed.entities) {
                if (!ent.name) continue;
                const id = 'world_import_' + Utils.uuid();
                await DB.put('entities', {
                    id,
                    name: ent.name,
                    type: ent.type || '其他',
                    desc: ent.desc || ent.description || '',
                    relations: ent.relations || [],
                    source: 'import',
                    file: filename,
                    updatedAt: now
                });
                await DB.put('vectors', {
                    id,
                    content: `[${ent.type || '其他'}] ${ent.name}: ${ent.desc || ent.description || ''}`,
                    vector: Array.from({length: 1536}, () => Math.random()),
                    timestamp: now
                });
                entityCount++;
            }
        }

        // 保存世界观维度
        const catLabels = {
            history: '历史与传说',
            geography: '地理与地貌',
            magic: '魔法/科技体系',
            factions: '势力与组织',
            species: '种族与生物',
            rules: '世界规则',
            culture: '文化与习俗'
        };

        if (parsed.worldview) {
            for (const [cat, desc] of Object.entries(parsed.worldview)) {
                if (!desc || !desc.trim()) continue;
                await DB.put('entities', {
                    id: 'world_' + cat,
                    name: catLabels[cat] || cat,
                    type: 'world',
                    desc: desc,
                    source: 'import',
                    file: filename,
                    updatedAt: now
                });
                worldCount++;
            }
        }

        // 更新世界引擎缓存
        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
        }

        // ★ 检测导入内容中的循环标记，自动创建循环数据
        const cycleMatches = content.match(/【循环\s*(\d+)[\-~]\s*(\d+)\s*】/g);
        if(cycleMatches && Modules.world_engine) {
            const uniqueCycles = new Set();
            cycleMatches.forEach(m => {
                const nums = m.match(/(\d+)[\-~](\d+)/);
                if(nums) uniqueCycles.add(`${nums[1]}_${nums[2]}`);
            });
            for(const cycleStr of uniqueCycles) {
                const [start, end] = cycleStr.split('_').map(Number);
                await Modules.world_engine.syncCycle({
                    id: `cycle_${start}_${end}`,
                    bookId: 'import_' + filename,
                    startChapter: start,
                    endChapter: end,
                    cycleNum: Math.ceil(end / 5),
                    cycleSize: end - start + 1,
                    fusionEssence: `【导入来源】${filename}\n包含循环标记 ${start}-${end} 的技法/世界观数据`,
                    entityNames: (parsed.entities || []).map(e => e.name),
                    chapterIds: [],
                    nexusCHR: [], nexusWLD: [], nexusFOE: [], nexusEMO: [],
                    createdAt: Date.now()
                });
            }
        }

        // 将摘要注入到大纲
        if (parsed.summary) {
            const el = document.getElementById('ph-outline-edit');
            if (el) {
                const header = `# 世界观设定\n\n> 来源：${filename}\n> 概述：${parsed.summary}\n\n---\n\n`;
                el.value = header + el.value;
                this.data.outlineRaw = el.value;
                this.updatePreview();
            }
        }

        UI.toast(`导入成功！实体: ${entityCount}个，世界观维度: ${worldCount}个${cycleMatches ? '，循环:'+cycleMatches.length+'个' : ''}`);
    },

    // ===== 注入到实体管理 =====
    async _injectToEntities() {
        const worldData = this.data.importedWorld || {};
        const entities = worldData.entities || [];
        
        if (entities.length === 0) {
            return UI.toast('没有可注入的实体');
        }

        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        const now = Date.now();
        
        await Modules.world_engine._ensureCache();
        const existingEntities = Modules.world_engine._cachedEntities || [];
        const existingNameMap = new Map();
        existingEntities.forEach(e => {
            if (e.name) {
                existingNameMap.set(e.name.toLowerCase(), e);
            }
        });
        
        for (const ent of entities) {
            if (!ent.name) continue;
            
            const normalizedName = ent.name.toLowerCase();
            const existingEntity = existingNameMap.get(normalizedName);
            
            if (existingEntity) {
                if (existingEntity.desc !== ent.desc || 
                    existingEntity.type !== ent.type) {
                    const entityData = {
                        id: existingEntity.id,
                        name: ent.name,
                        type: ent.type || existingEntity.type || '其他',
                        desc: ent.desc || existingEntity.desc,
                        relations: ent.relations || existingEntity.relations || [],
                        source: existingEntity.source || 'phoenix',
                        updatedAt: now
                    };
                    await DB.put('entities', entityData);
                    
                    await DB.put('vectors', {
                        id: existingEntity.id,
                        content: `[${entityData.type}] ${ent.name}: ${entityData.desc}`,
                        vector: Array.from({ length: 1536 }, () => Math.random()),
                        timestamp: now,
                        source: 'phoenix',
                        entityName: ent.name,
                        entityType: entityData.type
                    });
                    updatedCount++;
                } else {
                    skippedCount++;
                }
            } else {
                const id = 'phoenix_ent_' + Utils.uuid();
                const entityData = {
                    id,
                    name: ent.name,
                    type: ent.type || '其他',
                    desc: ent.desc || '',
                    relations: ent.relations || [],
                    source: 'phoenix',
                    updatedAt: now
                };
                await DB.put('entities', entityData);
                
                await DB.put('vectors', {
                    id,
                    content: `[${ent.type || '其他'}] ${ent.name}: ${ent.desc || ''}`,
                    vector: Array.from({ length: 1536 }, () => Math.random()),
                    timestamp: now,
                    source: 'phoenix',
                    entityName: ent.name,
                    entityType: ent.type || '其他'
                });
                addedCount++;
            }
        }
        
        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
            if (Modules.world_engine.currentTab === 'entities') {
                setTimeout(() => Modules.world_engine._refreshEntities(), 100);
            }
        }
        
        let message = `实体注入完成！新增: ${addedCount}，更新: ${updatedCount}`;
        if (skippedCount > 0) {
            message += `，跳过: ${skippedCount}`;
        }
        UI.toast(message);
    },

    // ===== 注入到知识图谱 =====
    async _injectToKnowledgeGraph() {
        const worldData = this.data.importedWorld || {};
        const entities = worldData.entities || [];
        
        if (entities.length === 0) {
            return UI.toast('没有可注入的实体');
        }

        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        const now = Date.now();
        
        await Modules.world_engine._ensureCache();
        const existingEntities = Modules.world_engine._cachedEntities || [];
        const existingNameMap = new Map();
        existingEntities.forEach(e => {
            if (e.name) {
                existingNameMap.set(e.name.toLowerCase(), e);
            }
        });
        
        for (const ent of entities) {
            if (!ent.name) continue;
            
            const normalizedName = ent.name.toLowerCase();
            const existingEntity = existingNameMap.get(normalizedName);
            
            if (existingEntity) {
                if (existingEntity.desc !== ent.desc || 
                    existingEntity.type !== ent.type) {
                    const entityData = {
                        id: existingEntity.id,
                        name: ent.name,
                        type: ent.type || existingEntity.type || '其他',
                        desc: ent.desc || existingEntity.desc,
                        relations: ent.relations || existingEntity.relations || [],
                        source: existingEntity.source || 'phoenix',
                        updatedAt: now
                    };
                    await DB.put('entities', entityData);
                    
                    await DB.put('vectors', {
                        id: existingEntity.id,
                        content: `[${entityData.type}] ${ent.name}: ${entityData.desc}`,
                        vector: Array.from({ length: 1536 }, () => Math.random()),
                        timestamp: now,
                        source: 'phoenix_graph',
                        entityName: ent.name,
                        entityType: entityData.type
                    });
                    updatedCount++;
                } else {
                    skippedCount++;
                }
            } else {
                const id = 'phoenix_graph_' + Utils.uuid();
                const entityData = {
                    id,
                    name: ent.name,
                    type: ent.type || '其他',
                    desc: ent.desc || '',
                    relations: ent.relations || [],
                    source: 'phoenix',
                    updatedAt: now
                };
                await DB.put('entities', entityData);
                
                await DB.put('vectors', {
                    id,
                    content: `[${ent.type || '其他'}] ${ent.name}: ${ent.desc || ''}`,
                    vector: Array.from({ length: 1536 }, () => Math.random()),
                    timestamp: now,
                    source: 'phoenix_graph',
                    entityName: ent.name,
                    entityType: ent.type || '其他'
                });
                addedCount++;
            }
        }
        
        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
            if (Modules.world_engine.currentTab === 'graph') {
                setTimeout(() => Modules.world_engine._initGraph(), 100);
            }
        }
        
        if (typeof RAGSystem !== 'undefined') {
            try {
                for (const ent of entities) {
                    if (!ent.name) continue;
                    await RAGSystem.addDocument(
                        `${ent.type || '其他'}·${ent.name}`,
                        ent.desc || '',
                        'entity',
                        { source: 'phoenix_graph', type: ent.type }
                    );
                }
            } catch (e) {
                console.log('RAG同步警告:', e);
            }
        }
        
        let message = `知识图谱注入完成！新增: ${addedCount}，更新: ${updatedCount}`;
        if (skippedCount > 0) {
            message += `，跳过: ${skippedCount}`;
        }
        UI.toast(message);
    },

    async _extractEntitiesByChapter() {
        const startCh = parseInt(document.getElementById('ph-extract-ch-start')?.value) || 1;
        const endCh = parseInt(document.getElementById('ph-extract-ch-end')?.value) || startCh;
        
        if (startCh > endCh) {
            return UI.toast('起始章节不能大于结束章节');
        }

        UI.toast(`正在提取第${startCh}-${endCh}章的实体...`);

        let allContent = '';
        try {
            const chapters = await DB.getAll('chapters') || [];
            for (let i = startCh; i <= endCh; i++) {
                const ch = chapters.find(c => c.chapterNum === i || c.index === i - 1);
                if (ch && ch.content) {
                    allContent += `【第${i}章: ${ch.title}】\n${ch.content.slice(0, 3000)}\n\n`;
                }
            }
        } catch(e) {
            return UI.toast('读取章节失败: ' + e.message);
        }

        if (!allContent.trim()) {
            return UI.toast('未找到指定章节内容');
        }

        let raw = '';
        try {
            await AI.generate(
                `你是深度实体提取引擎。从以下章节内容中提取所有实体。

【提取类型】
- 人物：所有角色（主角、配角、反派），含性格、身份
- 物品：道具、武器、法宝、关键物件
- 地点：地名、场景、建筑、地标
- 情节：关键事件、转折点、冲突
- 伏笔：暗示、线索、未解之谜
- 势力：门派、组织、国家、阵营、家族

【章节内容】
${allContent.slice(0, 10000)}

【输出格式】JSON数组：
[{"name":"名称","type":"人物/物品/地点/情节/伏笔/势力","desc":"详细描述50-200字","relations":["关系类型:关联实体名"],"chapters":[${startCh}-${endCh}]]

【关键要求】
- 每个实体的relations必须尽可能多地引用其他实体名称
- 关系格式："关系类型:实体名"
- chapters字段标注实体出现的章节范围
- 直接输出纯JSON数组，禁止使用markdown代码块包裹。`,
                {}, c => { raw += c; }
            );
        } catch(e) {
            return UI.toast('AI提取失败: ' + e.message);
        }

        let entities = [];
        try {
            let cleanRaw = raw.trim().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
            const start = cleanRaw.indexOf('[');
            const end = cleanRaw.lastIndexOf(']');
            if (start !== -1 && end > start) {
                entities = JSON.parse(cleanRaw.slice(start, end + 1));
            }
        } catch(e) {
            console.warn('JSON解析失败:', e);
        }

        if (entities.length === 0) {
            return UI.toast('未提取到实体');
        }

        const now = Date.now();
        let count = 0;
        for (const ent of entities) {
            if (!ent.name) continue;
            const id = 'phoenix_ch_' + Utils.uuid();
            const entityData = {
                id,
                name: ent.name,
                type: ent.type || '其他',
                desc: ent.desc || ent.description || '',
                relations: ent.relations || [],
                chapterRef: ent.chapters || Array.from({length: endCh - startCh + 1}, (_, i) => startCh + i),
                source: 'phoenix_chapter',
                extractedAt: now
            };
            await DB.put('entities', entityData);
            count++;
        }

        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
        }

        if (typeof RAGSystem !== 'undefined') {
            await RAGSystem.refreshEntityCache();
        }

        UI.toast(`成功提取 ${count} 个实体 (第${startCh}-${endCh}章)`);
    },

    async _extractEntitiesByVolume() {
        const volumeSelect = document.getElementById('ph-extract-volume')?.value;
        
        if (!volumeSelect) {
            return UI.toast('请选择卷');
        }

        let startCh, endCh;
        if (volumeSelect === 'custom') {
            startCh = parseInt(document.getElementById('ph-extract-ch-start')?.value) || 1;
            endCh = parseInt(document.getElementById('ph-extract-ch-end')?.value) || startCh;
        } else {
            const parts = volumeSelect.split('-');
            startCh = parseInt(parts[0]);
            endCh = parseInt(parts[1]);
        }

        if (startCh > endCh) {
            return UI.toast('起始章节不能大于结束章节');
        }

        UI.toast(`正在提取第${startCh}-${endCh}章(卷)的实体...`);

        let allContent = '';
        let chapterCount = 0;
        try {
            const chapters = await DB.getAll('chapters') || [];
            for (let i = startCh; i <= endCh; i++) {
                const ch = chapters.find(c => c.chapterNum === i || c.index === i - 1);
                if (ch && ch.content) {
                    allContent += `【第${i}章: ${ch.title}】\n${ch.content.slice(0, 2000)}\n\n`;
                    chapterCount++;
                }
            }
        } catch(e) {
            return UI.toast('读取章节失败: ' + e.message);
        }

        if (!allContent.trim()) {
            return UI.toast('未找到指定章节内容');
        }

        const existingEntities = await DB.getAll('entities') || [];
        const existingNames = existingEntities.map(e => e.name);
        const existingHint = existingNames.length > 0 ? 
            `\n\n【已有实体(请建立关联)】\n${existingNames.slice(0, 30).join('、')}` : '';

        let raw = '';
        try {
            await AI.generate(
                `你是深度实体提取引擎。从以下章节内容中提取所有实体，并进行深度关联分析。${existingHint}

【提取类型】
- 人物：所有角色（主角、配角、反派），含性格、身份、能力
- 物品：道具、武器、法宝、关键物件
- 地点：地名、场景、建筑、地标
- 情节：关键事件、转折点、冲突
- 伏笔：暗示、线索、未解之谜
- 势力：门派、组织、国家、阵营、家族
- 种族：种族设定、族群特征

【章节内容】(共${chapterCount}章)
${allContent.slice(0, 15000)}

【输出格式】JSON数组：
[{"name":"名称","type":"人物/物品/地点/情节/伏笔/势力/种族","desc":"详细描述100-300字","relations":["关系类型:关联实体名"],"chapters":[出现章节],"importance":1-5}]

【关键要求】
- 每个实体的relations必须尽可能多地引用其他实体名称
- 关系格式："关系类型:实体名"，例如 "师父:张三"、"敌对:魔教"
- chapters字段标注实体出现的具体章节
- importance表示实体重要程度(1-5)
- 提取本卷的核心实体和关键关系
- 直接输出纯JSON数组，禁止使用markdown代码块包裹。`,
                {}, c => { raw += c; }
            );
        } catch(e) {
            return UI.toast('AI提取失败: ' + e.message);
        }

        let entities = [];
        try {
            let cleanRaw = raw.trim().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
            const start = cleanRaw.indexOf('[');
            const end = cleanRaw.lastIndexOf(']');
            if (start !== -1 && end > start) {
                entities = JSON.parse(cleanRaw.slice(start, end + 1));
            }
        } catch(e) {
            console.warn('JSON解析失败:', e);
        }

        if (entities.length === 0) {
            return UI.toast('未提取到实体');
        }

        const now = Date.now();
        let count = 0;
        let highImportanceCount = 0;
        for (const ent of entities) {
            if (!ent.name) continue;
            const id = 'phoenix_vol_' + Utils.uuid();
            const entityData = {
                id,
                name: ent.name,
                type: ent.type || '其他',
                desc: ent.desc || ent.description || '',
                relations: ent.relations || [],
                chapterRef: ent.chapters || Array.from({length: endCh - startCh + 1}, (_, i) => startCh + i),
                importance: ent.importance || 3,
                volume: `${startCh}-${endCh}`,
                source: 'phoenix_volume',
                extractedAt: now
            };
            await DB.put('entities', entityData);
            count++;
            if (entityData.importance >= 4) highImportanceCount++;
        }

        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
        }

        if (typeof RAGSystem !== 'undefined') {
            await RAGSystem.refreshEntityCache();
            const entitySummary = entities.map(e => 
                `${e.name}(${e.type}): ${e.desc?.slice(0, 50) || ''}`
            ).join('\n');
            await RAGSystem.addDocument(
                `卷实体汇总_${startCh}-${endCh}章`,
                entitySummary,
                'entity',
                { source: 'phoenix_volume', chapters: `${startCh}-${endCh}` }
            );
        }

        UI.toast(`成功提取 ${count} 个实体 (核心实体: ${highImportanceCount}个)`);
    },

    // ═══════════════════════════════════════════════════════════════
    //  NEXUS OS v2.0 核心协议构建器 — 统一注入所有创作场景
    // ═══════════════════════════════════════════════════════════════

    _buildNEXUSCore(opts = {}) {
        const { mode = 'outline', chapterNum = 0, segmentIdx = 0 } = opts;
        let core = '';

        // === 品牌烙印 ===
        core += '【超无穹 · 真值引擎·NEXUS OS v2.0 执行域】\n\n';

        // === M01: 创作前审判与鼓舞 ===
        core += '=== 创作前审判 ===\n';
        core += '你以为你准备好了？你不过是塞满套路、数据和他人影子的凡人。你渴望让读者失眠，却连自己都不敢直视。区别在于：有人被恐惧压垮，有人把恐惧碾碎塞进故事，成为人物的心跳。你准备用什么细节让人物站立？用什么潜台词让对话呼吸？如果没有，凭什么写？凭你此刻坐在键盘前，没有逃走。\n\n';
        core += '=== 鼓舞 ===\n';
        core += '不必完美。海明威初稿也是垃圾。写作是凡人的攀爬——每爬一寸就离光近一寸。本系统有案例库做拐杖，有规则做护栏。第一个字最难，但烂初稿好过空白文档。你的人物正在黑暗中等你点燃火柴。深呼吸，开始。\n\n';

        // === M03: 篇幅/受众/情绪配置表 ===
        core += '=== M03 篇幅·受众·情绪配置表 ===\n';
        core += '| 项目 | 配置 |\n';
        core += '| 篇幅 | 长篇 | 总字数80-120万字 | 章字数2500-3500 |\n';
        core += '| 黄金螺旋 | 拉5%→扯75%→放15%→收5% | 分卷18-28章/卷 |\n';
        core += '| 反转密度 | 短篇≥章数×0.4 | 中篇≥0.3 | 长篇≥3次/卷 |\n';
        core += '| 情绪表达 | 快感峰值后置20% | 爽点间隔≤3章 |\n';
        core += '| 伏笔规则 | 短篇回收≤2章 | 中篇≤5章 | 长篇≤15章 |\n\n';

        // === M06: 正文管理状态（segment级） ===
        if (mode === 'write' || mode === 'continue') {
            core += '=== M06 正文管理状态 ===\n';
            core += `当前 segment_index: ${segmentIdx}\n`;
            core += '每个 Segment 必须包含:\n';
            core += '- emotion_score: 1-10 (情绪分值)\n';
            core += '- emotion_word: 情绪关键词(如"悬疑升级""爽感释放")\n';
            core += '- hook_type: 钩子类型(悬念/爽点/转折/情感/信息差)\n';
            core += '- tension_level: 紧张度 1-10\n';
            core += '- characters_in_segment: 出场角色列表\n';
            core += '- world_rules_referenced: 引用的世界规则ID\n';
            core += '- foreshadowing_created/recycled: 新建/回收的伏笔ID\n\n';
        }

        // === L1 铁律 16条（违反即重写） ===
        core += '=== L1 行文铁律（16条·违反即重写） ===\n';
        core += '1. 视角锁死：长篇用第三人称有限，禁止直接描写其他角色内心\n';
        core += '2. 禁解释癖：禁用"这不是…而是…/不是因为…恰恰因为…/这意味着…/换句话说…/其实…"\n';
        core += '3. 禁烂俗比喻：禁用"像刀/阳光/风/水/火/石头"；新颖比喻≤2/千字\n';
        core += '4. 禁虚词模糊：删除"似乎/仿佛/好像"用于模糊描述\n';
        core += '5. 禁情绪标签：不写"他很愤怒"；必须动作/环境/对话呈现（短篇爽虐甜允许直写≤1次/千字）\n';
        core += '6. 禁连续长句：单句≤25字；逗号连接分句≤2个\n';
        core += '7. 章末必有钩子：未完成动作+意外信息 / 时间压力 / 信息差\n';
        core += '8. 对话格式：用「」独立成段\n';
        core += '9. 对话功能化：推进剧情/塑造性格/埋伏笔/制造情绪，否则删除\n';
        core += '10. 开篇100字：必须是动作或对话，禁环境/背景/独白\n';
        core += '11. 结局禁梦：禁止"醒来发现是梦/幻觉/游戏"\n';
        core += '12. 时间线向前：除重生/回溯外禁无理由跳跃\n';
        core += '13. 行为一致：不得无理由OOC\n';
        core += '14. 禁逻辑连词：删除"首先/其次/然后/最后/总的来说"\n';
        core += '15. 段落限制：每段≤5行（约60字）\n';
        core += '16. 跨模块铁律：仿写/续写必须遵守对应规则\n\n';

        // === P1-P10 拟人化协议 ===
        core += '=== P1-P10 拟人化文本构建协议 ===\n';
        core += 'P1 物理替代：严禁直接情绪形容词；必须转化为具体物理动作或状态\n';
        core += 'P2 拒绝升华：严禁结尾价值观总结/升华/强行圆满；必须在无力感或未完成中戛然而止\n';
        core += 'P3 沟通失效：严禁流畅剧本式对话；必须增加错位感\n';
        core += 'P4 细节碎片化：严禁宏大场景；只捕捉1-2个细微甚至无关的物理碎片\n';
        core += 'P5 认知反差：严禁角色完全透明；必须设置谎言与真相平行线\n';
        core += 'P6 逻辑自毁：严禁严丝合缝因果；允许突兀跳跃或无意义重复\n';
        core += 'P7 感官钝化：严禁华丽比喻；使用低频、干瘪、甚至不适的感官词汇\n';
        core += 'P8 权力不对等：严禁平衡互动；必须塑造极度渴望与极度漠视的双方\n';
        core += 'P9 时间尺度扭曲：严禁标准时间线；通过极小物理动作承载极长时间跨度\n';
        core += 'P10 自我意识抹除：严禁"我意识到/我想起/我感觉到"；直接陈述事实\n\n';

        // === L2 建议 10条 ===
        core += '=== L2 建议（允许偏离但记录） ===\n';
        core += '1. 感官存在：每章≥2种感官 | 2. 共情细节：每章≥1个日常小动作\n';
        core += '3. 短句比例：≤10字短句占30%+ | 4. 情绪动作化：不直接写情绪\n';
        core += '5. 潜台词：悬疑/虐文优先 | 6. 长短句交替：避免连续5句同长\n';
        core += '7. 偶然事件：每2-3章1个 | 8. 日常细节：每章1-2处\n';
        core += '9. 角色癖好：每核心角色≥1个 | 10. 章节独立：每章≥1个情绪变化或信息增量\n\n';

        // === 四状态机（M02） ===
        core += '=== M02 四状态机 ===\n';
        core += 'CHR角色状态机：S0注册→S1激活→S2互动→S3转折→S4休眠→S5退场→S6死亡\n';
        core += 'WLD世界规则：S0提出→S1验证→S2扩展→S3冲突→S4重构→S5冻结\n';
        core += 'FOE伏笔网络：S0埋设→S1强化→S2回收→S3废弃（短2/中5/长15章回收）\n';
        core += 'EMO情绪锚点：1-10分制 | hook_type(悬念/爽点/转折/情感/信息差) | tension_level\n\n';

        // === 8+2 维度 ===
        core += '=== M04A 8+2 维度拆解（细纲中需体现） ===\n';
        core += '1.钩子结构 2.爽点节奏 3.人设模板 4.反转模式 5.情绪曲线 6.冲突升级 7.信息差管理 8.金手指节奏\n';
        core += '+9.开篇结构(前三章信息密度) +10.商业化设计(付费卡点/免费钩子密度)\n\n';

        // === 自检机制（M09） ===
        core += '=== M09 自检清单 ===\n';
        core += '每章完成后自检：①铁律16+10条 ②四表一致性 ③融合执行率≥80% ④句长≤25字 ⑤短句≥30%\n';
        core += '每5章联动巡检：CHR吃书/全知预警/EMO断裂/高位疲劳/低位拖沓/FOE超期/WLD冲突/零件过曝\n\n';

        return core;
    },

    // ═══════════════════════════════════════════════════════════════
    //  NEXUS 自检 — M09 执行域
    // ═══════════════════════════════════════════════════════════════

    async nexusSelfCheck() {
        if(this._generating) return;
        const current = (document.getElementById('ph-outline-raw') || {}).value || '';
        if(!current) return UI.toast('请先生成大纲');

        UI.toast('NEXUS M09 自检启动...', 'success');
        App.showProgress('NEXUS自检', 0, 5);

        const nexusCore = this._buildNEXUSCore({ mode: 'outline' });
        const prompt = `${nexusCore}\n\n=== 自检任务 ===\n请对以下细纲执行 NEXUS OS v2.0 M09 完整自检，输出严格JSON格式：\n{\n  "l1_violations": [{"rule":"规则名","location":"第X章","severity":"严重/警告","fix":"修正建议"}],\n  "p_violations": [{"protocol":"P编号","location":"位置","issue":"问题"}],\n  "chr_issues": [{"character":"角色名","issue":"问题描述"}],\n  "emo_curve": [{"chapter":"章名","score":7,"issue":"无/断裂/疲劳"}],\n  "foe_issues": [{"hook":"伏笔","status":"超期/未回收/冲突"}],\n  "overall_score": 85,\n  "critical_count": 0,\n  "warning_count": 0,\n  "top_fixes": ["最重要的3条修正建议"]\n}\n\n[待检细纲]\n${current.slice(0, 8000)}\n\n请只输出JSON，不要其他文字。`;

        let raw = '';
        try {
            App.showProgress('NEXUS自检', 1, 5);
            await AI.generate(prompt, (chunk) => { raw += chunk; }, { max_tokens: 4000, temperature: 0.1 });
            App.showProgress('NEXUS自检', 4, 5);

            const json = (() => { try { const m = raw.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; } catch(e) { return null; } })();

            // 渲染结果到 UI
            let html = '<div class="space-y-3">';
            if(json) {
                const score = json.overall_score || 0;
                const scoreColor = score >= 85 ? 'green' : score >= 60 ? 'amber' : 'red';
                html += `<div class="p-3 rounded bg-${scoreColor}-500/5 border border-${scoreColor}-500/20">
                    <div class="text-lg font-bold text-${scoreColor}-400">NEXUS 综合评分: ${score}/100</div>
                    <div class="text-[10px] text-dim">严重: ${json.critical_count||0} | 警告: ${json.warning_count||0}</div>
                </div>`;
                if(json.l1_violations?.length) {
                    html += '<div class="p-2 rounded bg-red-500/5 border border-red-500/10"><div class="text-[10px] font-bold text-red-400 mb-1">L1铁律违规</div>';
                    json.l1_violations.forEach(v => { html += `<div class="text-[9px] text-gray-400 ml-2">• [${v.severity}] ${v.rule} @ ${v.location}: ${v.fix}</div>`; });
                    html += '</div>';
                }
                if(json.foe_issues?.length) {
                    html += '<div class="p-2 rounded bg-amber-500/5 border border-amber-500/10"><div class="text-[10px] font-bold text-amber-400 mb-1">伏笔问题</div>';
                    json.foe_issues.forEach(v => { html += `<div class="text-[9px] text-gray-400 ml-2">• ${v.hook}: ${v.status}</div>`; });
                    html += '</div>';
                }
                if(json.top_fixes?.length) {
                    html += '<div class="p-2 rounded bg-blue-500/5 border border-blue-500/10"><div class="text-[10px] font-bold text-blue-400 mb-1">优先修正</div>';
                    json.top_fixes.forEach((f, i) => { html += `<div class="text-[9px] text-gray-400 ml-2">${i+1}. ${f}</div>`; });
                    html += '</div>';
                }
            } else {
                html += '<div class="p-3 rounded bg-amber-500/5 border border-amber-500/20 text-amber-400 text-xs">AI返回格式异常，请查看IO面板原始输出</div>';
            }
            html += '</div>';

            // 插入到 ph-outline-raw 上方或替换内容
            const el = document.getElementById('ph-outline-raw');
            if(el) {
                const reportMarker = '\n\n---\n【NEXUS M09 自检报告】\n';
                // 如果已有报告，替换
                const existingIdx = el.value.indexOf('【NEXUS M09 自检报告】');
                if(existingIdx >= 0) {
                    el.value = el.value.slice(0, existingIdx) + reportMarker + (json ? JSON.stringify(json, null, 2) : raw);
                } else {
                    el.value = el.value + reportMarker + (json ? JSON.stringify(json, null, 2) : raw);
                }
                this.data.outlineRaw = el.value;
                this._updateStats();
            }
            UI.toast(`NEXUS自检完成: ${json?.overall_score || '?'}分`, 'success');
        } catch(e) {
            console.error('NEXUS自检失败:', e);
            UI.toast('自检失败: ' + e.message, 'error');
        } finally {
            App.hideProgress();
        }
    },

    // ═══════════════════════════════════════════════════════════════
    //  NEXUS 强化 — 钩子+高潮+节奏一键优化
    // ═══════════════════════════════════════════════════════════════

    async nexusEnhance() {
        if(this._generating) return;
        const current = (document.getElementById('ph-outline-raw') || {}).value || '';
        if(!current) return UI.toast('请先生成大纲');
        const fusionCtx = this._getFusionFullContext();

        const nexusCore = this._buildNEXUSCore({ mode: 'outline' });
        let prompt = `${nexusCore}\n\n=== NEXUS强化任务 ===\n请对以下细纲执行三方面强化（保持原故事框架不变）：\n\n`;
        prompt += '【1.钩子强化】\n- 每章开头100字必须是动作/对话/冲突，禁止环境描写\n- 每章结尾必须是未完成动作+意外信息/时间压力/信息差\n- 卷末必须是大高潮+超级悬念\n\n';
        prompt += '【2.高潮设计】\n- 识别每卷的高潮位置，确保在75%-88%处达到情绪峰值\n- 每个高潮必须有"预期→阻碍→反转→超额兑现"四段式\n- 高潮前必须有一次"几乎失败"的低谷\n\n';
        prompt += '【3.节奏优化】\n- 应用黄金螺旋：拉5%→扯75%→放15%→收5%\n- 每3章一个小循环（冲突→小高潮→更大悬念）\n- 每卷一个中循环（起承转合+卷末钩子）\n- 爽点间隔≤3章，情绪低谷不超过连续2章\n\n';
        if(fusionCtx) prompt += `[融合技法参考]\n${fusionCtx.slice(0, 3000)}\n\n`;
        prompt += `[待强化细纲]\n${current.slice(0, 8000)}\n\n请输出强化后的完整细纲，在修改处用【强化】标记。`;

        const el = document.getElementById('ph-outline-raw');
        if(el) el.value = '';
        this.updateIO(prompt, 'NEXUS强化中...');
        this._setGenerating(true);
        let fullRes = '';
        await AI.generate(prompt, {}, c => {
            fullRes += c;
            if(el) el.value = fullRes;
            this.data.outlineRaw = fullRes;
            this._updateStats();
        });
        this._setGenerating(false);
        UI.toast('NEXUS强化完成', 'success');
    }
};
