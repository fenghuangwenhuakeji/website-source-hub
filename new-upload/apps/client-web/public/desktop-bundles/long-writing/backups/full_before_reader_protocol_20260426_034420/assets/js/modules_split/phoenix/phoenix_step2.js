Object.assign(Modules.phoenix, {
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
                    <h3 class="text-2xl font-bold text-white mb-3">准备进入执笔台</h3>
                    <p class="text-gray-400 mb-6">执行级细纲、知识图谱、世界引擎和记忆上下文会一起带过去。</p>
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
                            <div class="text-[10px] text-dim uppercase mt-1">图谱实体</div>
                        </div>
                        <div class="p-4 bg-white/5 rounded-lg border border-white/10">
                            <div class="text-xl font-bold ${ps.hasData ? 'text-amber-400' : 'text-dim'}">${ps.hasData ? '✓' : '—'}</div>
                            <div class="text-[10px] text-dim uppercase mt-1">融合数据</div>
                        </div>
                    </div>
                    <!-- 快捷操作 -->
                    <div class="flex gap-2 justify-center mb-4">
                        <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 ${extracted.length===0?'opacity-50':''}" onclick="Modules.phoenix._injectExtractedEntities()" ${extracted.length===0?'disabled':''}><i class="fa-solid fa-diagram-project mr-1"></i>注入知识图谱</button>
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.phoenix.syncWorldOnFinish()"><i class="fa-solid fa-layer-group mr-1"></i>同步卷级结构</button>
                        <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.phoenix.goStep(1)"><i class="fa-solid fa-pen mr-1"></i>返回编辑</button>
                    </div>
                    <div class="text-[10px] text-dim">点击「确认导入」后，正文生成会读取这些图谱实体和上下文。</div>
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

    _seedZeroStart() {
        const ideaEl = document.getElementById('ph-idea');
        if (!ideaEl) return;
        const seed = `【一句话】
主角是谁： 
他想要什么： 
阻力是什么： 
代价是什么： 

【人物状态 CHR】
起点： 
欲望： 
伤口/弱点： 
第一次选择： 
不可逆变化： 

【世界规则 WLD】
核心规则： 
规则代价： 
禁忌/边界： 
会崩坏的点： 

【伏笔 FOE】
第一章要埋的钩子： 
3-5章内要回收的钩子： 

【情绪 EMO】
开篇情绪： 
第一卷情绪目标： 
读者追更理由： `;
        if (!ideaEl.value.trim()) ideaEl.value = seed;
        else ideaEl.value += '\n\n---\n' + seed;
        this.data.idea = ideaEl.value;
        UI.toast('已填入从零开书模板');
    },

    async aiBrainstorm() {
        const genre = (document.getElementById('ph-genre') || {}).value || '玄幻';
        const style = (document.getElementById('ph-style') || {}).value || '';
        const fusionCtx = this._getFusionFullContext();
        
        UI.toast('AI正在头脑风暴...');
        
        const prompt = `你是一位长篇小说开书策划。请为「${genre}」类型创作5个能支撑长篇连载的故事种子。

${fusionCtx ? '[参考技法]\n' + fusionCtx.slice(0, 1500) + '\n\n' : ''}${this.data.worldContext ? '[世界引擎]\n' + this.data.worldContext.slice(0, 1000) + '\n\n' : ''}${this.data.memoryContext ? '[记忆上下文]\n' + this.data.memoryContext.slice(0, 1000) + '\n\n' : ''}
风格要求：${style || '清晰、克制、可持续'}

【创意要求】
1. 每个创意必须写清：人物欲望、阻力、代价、变化
2. 每个创意必须给出 CHR/WLD/FOE/EMO 四条追踪线雏形
3. 世界规则必须有代价、边界和可能崩坏点
4. M06：用动作、物件、对话错位和物理细节呈现，不写抽象情绪
5. 标注每个创意的「可写指数」(1-10) 和最大风险

【输出格式】
## 创意一：标题
- 一句话：...
- CHR：...
- WLD：...
- FOE/EMO：...
- 可写指数：X/10
- 最大风险：...

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
        const prompt = `你是一位长篇小说总架构师。请将以下核心创意扩展为完整的故事框架，重点保证细纲可写、人物一致、世界观不崩。

${fusionCtx ? '[参考技法]\n' + fusionCtx.slice(0, 1500) + '\n\n' : ''}${this.data.worldContext ? '[世界引擎]\n' + this.data.worldContext.slice(0, 1000) + '\n\n' : ''}${this.data.memoryContext ? '[记忆上下文]\n' + this.data.memoryContext.slice(0, 1000) + '\n\n' : ''}
【核心创意】
${idea}

【扩展要求】
1. 完善主角欲望、伤口、阻力、代价和变化路径
2. 建立 WLD 世界规则：能力/制度/禁忌/代价/边界
3. 规划前3卷主要剧情线，每卷有中循环，每3-5章有小循环
4. 设计主要配角、反派、势力和伏笔回收表
5. 每个关键节点标注具体动作/物件/对话错位、人物一致性风险、世界观风险

【输出格式】
## 主角设定
- 欲望、伤口、能力、代价、成长路线

## 世界引擎
...

## 主要人物
- 配角A：...
- 反派B：...

## 剧情规划
### 第一卷：xxx
- 核心事件
- 具体动作/物件/对话错位
- 人物变化/规则变化
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
        const prompt = `你是一位长篇小说可写性分析师。请对以下创意进行深度分析和评估。

${fusionCtx ? '[参考技法]\n' + fusionCtx.slice(0, 1000) + '\n\n' : ''}${this.data.worldContext ? '[世界引擎]\n' + this.data.worldContext.slice(0, 800) + '\n\n' : ''}${this.data.memoryContext ? '[记忆上下文]\n' + this.data.memoryContext.slice(0, 800) + '\n\n' : ''}
【待分析创意】
${idea}

【分析维度】
1. 细纲可写性：是否能撑起80万字以上
2. 人物一致性：主角欲望、伤口、选择是否能连续推进
3. 世界稳定性：规则、代价、边界是否清楚
4. 伏笔与情绪：FOE/EMO 是否有埋设和回收空间
5. M06风险：是否容易写成空话、解释设定、抽象情绪

【输出格式】
## 可写性评估
- 可写指数：X/10
- 主要优势：...
- 最大风险：...

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

    async pullMemoryContext() {
        if (typeof MemorySystem === 'undefined') return UI.toast('三层记忆未启用');
        let ctx = '';
        try {
            if (MemorySystem.buildBrainContext) {
                ctx = await MemorySystem.buildBrainContext('从零写一本 长篇 角色一致 世界观 细纲 M06', {
                    moduleName: 'phoenix',
                    maxTokens: 2600,
                    includeWorking: true,
                    includePersistent: true,
                    includeSession: true,
                    includeRAG: true,
                    includeEntities: true,
                    includeWorldView: true,
                    includeNexus: true,
                    includeFusion: false
                });
            }
            if (!ctx && MemorySystem.working?.length) {
                ctx = MemorySystem.working.slice(-12).map(m => `[${m.type || '记忆'}] ${m.content}`).join('\n');
            }
        } catch(e) {
            console.warn('[Phoenix] pullMemoryContext failed:', e);
        }
        if (!ctx) return UI.toast('暂时没有可用记忆');
        this.data.memoryContext = ctx;
        UI.toast('已拉取记忆上下文 ' + ctx.length + ' 字');
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
        // Step 2 工具按钮 loading 状态
        const toolBtns = [
            { id: 'ph-btn-import-world', icon: 'fa-earth-americas', text: '导入世界观', loading: '正在解析...' },
            { id: 'ph-btn-extract-ent', icon: 'fa-diagram-project', text: '提取实体', loading: '正在提取...' },
            { id: 'ph-btn-fusion', icon: 'fa-shield-halved', text: '一致性自检', loading: '正在自检...' },
            { id: 'ph-btn-ai-polish', icon: 'fa-pen-nib', text: '细纲校准', loading: '正在校准...' },
        ];
        for (const btnCfg of toolBtns) {
            const btn = document.getElementById(btnCfg.id);
            if (!btn) continue;
            if (on) {
                btn.classList.add('opacity-50', 'pointer-events-none');
                btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-1"></i>${btnCfg.loading}`;
            } else {
                btn.classList.remove('opacity-50', 'pointer-events-none');
                btn.innerHTML = `<i class="fa-solid ${btnCfg.icon} mr-1"></i>${btnCfg.text}`;
            }
        }
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
});
