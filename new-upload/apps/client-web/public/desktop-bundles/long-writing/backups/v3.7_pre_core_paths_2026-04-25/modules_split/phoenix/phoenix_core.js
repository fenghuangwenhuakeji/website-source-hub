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
                            <!-- 快捷操作栏 -->
                            <div class="flex gap-1.5 px-4 pt-1.5 pb-0 flex-wrap">
                                <button class="text-[9px] px-2 py-0.5 rounded bg-white/5 text-dim hover:bg-amber-500/20 hover:text-amber-400 border border-white/5 hover:border-amber-500/30 transition" onclick="Modules.phoenix._inlineQuickAction('expand')" title="扩写选中内容">📝 扩写</button>
                                <button class="text-[9px] px-2 py-0.5 rounded bg-white/5 text-dim hover:bg-blue-500/20 hover:text-blue-400 border border-white/5 hover:border-blue-500/30 transition" onclick="Modules.phoenix._inlineQuickAction('trim')" title="精简选中内容">✂️ 精简</button>
                                <button class="text-[9px] px-2 py-0.5 rounded bg-white/5 text-dim hover:bg-purple-500/20 hover:text-purple-400 border border-white/5 hover:border-purple-500/30 transition" onclick="Modules.phoenix._inlineQuickAction('hook')" title="给选中内容加钩子">🪝 加钩子</button>
                                <button class="text-[9px] px-2 py-0.5 rounded bg-white/5 text-dim hover:bg-green-500/20 hover:text-green-400 border border-white/5 hover:border-green-500/30 transition" onclick="Modules.phoenix._inlineQuickAction('cool')" title="给选中内容加爽点">💥 加爽点</button>
                                <button class="text-[9px] px-2 py-0.5 rounded bg-white/5 text-dim hover:bg-red-500/20 hover:text-red-400 border border-white/5 hover:border-red-500/30 transition" onclick="Modules.phoenix._inlineQuickAction('delete')" title="删除选中内容">🗑️ 删除</button>
                                <span class="text-[8px] text-dim self-center ml-1">先在大纲中选中文字再点</span>
                            </div>
                            <div class="flex gap-2 px-4 py-2">
                                <input id="ph-inline-chat-in" class="input flex-1 h-8 text-xs bg-black/40 border-white/10" placeholder="描述你想怎么改大纲，AI会帮你调整...（先选中大纲里的文字可只改选中部分）" onkeydown="if(event.key==='Enter')Modules.phoenix.sendInlineChat()">
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

};
