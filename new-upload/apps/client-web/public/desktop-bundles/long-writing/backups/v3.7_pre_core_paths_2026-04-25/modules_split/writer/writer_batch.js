Object.assign(Modules.writer, {
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
            writePrompt += `要求：\n1. 严格按照细纲展开\n2. ${fusionCtx || cycleCtx ? '运用融合技法中的套路（钩子、节奏、爽点）' : '文风统一，情节连贯'}\n3. ${ragContext ? '参考RAG上下文保持世界观/人设/伏笔一致性' : '保持前后文一致'}\n4. 遵守NEXUS OS L1铁律（长短句交替：动作短句≤25字制造节奏，环境/心理用长句铺陈，禁通篇电报体；禁情绪标签；章末钩子）\n5. 字数约1500-2500字\n6. 直接输出正文`;

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

    // ===== 生成本章正文（只写当前选中的章节） =====
    async autoWriteCurrent() {
        const W = Modules.writer;
        if (!W.currentChapterId) return UI.toast('请先选择章节');
        const chap = await DB.get('chapters', W.currentChapterId);
        if (!chap) return UI.toast('章节不存在');
        if (!chap.outline || chap.outline.trim().length < 20) return UI.toast('当前章节没有细纲，无法生成正文');
        if (chap.content && chap.content.trim().length > 100) {
            const overwrite = confirm('当前章节已有正文，是否覆盖重写？');
            if (!overwrite) return;
        }

        W._setGenerating(true);
        const st = document.getElementById('w-save-status');
        const editorEl = document.getElementById('w-editor');
        if (st) st.textContent = '① 构建写作上下文...';

        const chaps = (await DB.getAll('chapters') || []).sort((a,b) => (a.order||0) - (b.order||0));
        const targetWords = parseInt((document.getElementById('w-target-words') || {}).value) || 2500;

        // ── 获取上下文（带长度控制） ──
        const fusionCtx = W._getFusionContext ? W._getFusionContext() : '';
        let worldCtx = '';
        if (Modules.world_engine) {
            await Modules.world_engine._ensureCache();
            const entities = Modules.world_engine._cachedEntities || [];
            const worldEntities = entities.filter(e => !e.id.startsWith('world_'));
            const worldViews = entities.filter(e => e.id.startsWith('world_') && e.desc);
            if (worldEntities.length > 0) {
                worldCtx += '[世界引擎实体]\n';
                worldEntities.slice(0, 8).forEach(e => { // 从15减到8
                    worldCtx += `${e.type}·${e.name}: ${(e.desc || '').slice(0, 60)}\n`; // 从100减到60
                });
            }
            if (worldViews.length > 0) {
                const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
                worldCtx += '\n[世界观设定]\n';
                worldViews.slice(0, 3).forEach(w => {
                    const cat = w.id.replace('world_', '');
                    worldCtx += `${catLabels[cat] || cat}: ${(w.desc || '').slice(0, 120)}\n`; // 从200减到120
                });
            }
        }

        let ragContext = '';
        if (typeof RAGSystem !== 'undefined') {
            try {
                const ragQuery = (chap.title || '') + ' ' + (chap.outline || '').slice(0, 300);
                const ragResults = await RAGSystem.search(ragQuery, 3); // 从5减到3
                if (ragResults && ragResults.length > 0) {
                    ragContext = '[RAG参考上下文]\n' + ragResults.map(r => `[${r.source||''}] ${r.title}: ${r.content.slice(0, 250)}`).join('\n---\n') + '\n\n'; // 从400减到250
                }
            } catch(e) {}
        }

        let rules = '';
        const rulesData = await DB.get('settings', 'writer_rules');
        if (rulesData) rules = rulesData.rules || '';

        // 使用精简版 NEXUS 前缀，大幅缩短 prompt
        const nexusPrefix = await W._buildNexusPrefix(true);
        const cycleCtx = await W._getCycleContext();

        let prevContent = '';
        const prevIdx = chaps.findIndex(c => c.id === chap.id) - 1;
        if (prevIdx >= 0 && chaps[prevIdx].content) {
            prevContent = chaps[prevIdx].content.slice(-1200); // 从2000减到1200
        }

        // ── 构建 Prompt ──
        let writePrompt = nexusPrefix;
        if (fusionCtx) writePrompt += '[融合技法]\n' + fusionCtx.slice(0, 1500) + '\n\n'; // 限制长度
        if (worldCtx) writePrompt += worldCtx + '\n';
        if (cycleCtx) writePrompt += '[循环技法]\n' + cycleCtx.slice(0, 1200) + '\n\n'; // 从2000减到1200
        if (ragContext) writePrompt += ragContext;
        if (rules) writePrompt += '[写作规则]\n' + rules.slice(0, 600) + '\n\n'; // 从1000减到600

        // 判断是否是黄金开篇（第1-3章）
        const isGoldenOpening = chap.order && chap.order <= 3;
        
        // 清理细纲中的元标记（如[情绪8|悬念|铺垫]），只保留纯情节描述
        let cleanOutline = (chap.outline || '').replace(/\[.*?\]/g, '').replace(/\n{3,}/g, '\n\n').trim();
        
        writePrompt += `[本章标题] ${chap.title}\n\n[细纲]\n${cleanOutline.slice(0, 1500)}\n\n`; // 再缩短
        if (prevContent) {
            writePrompt += '[前文末尾]\n' + prevContent.slice(-400) + '\n\n'; // 前文再缩短
        }
        
        // ═══ 极简写作规则（只给命令，不给解释）═══
        const goldenExtra = isGoldenOpening ? '开篇300字必动作/冲突。人物出场带记忆点。反派台词带刺带毒。反杀≤300字干净利落。章末钩子必是新威胁。' : '';
        
        writePrompt += `规则：第三人称有限。对话用""禁「」。动作短句≤25字，3-5短后接1长句。段落≤4行。禁情绪标签、禁解释癖、禁虚词、禁逻辑连词。章末钩子。${goldenExtra}约${targetWords}字。

⚠️ 只输出小说正文。禁止：分析、规划、字数统计、元评论、心理解释、标题、总结、任何非正文。
⚠️ 不要输出思考过程，不要解释你的写作决策，直接写正文第一句。

正文：`;

        // ── Prompt 长度诊断 ──
        const promptLen = writePrompt.length;
        const ctxSummary = [];
        if (fusionCtx) ctxSummary.push(`融合技法(${fusionCtx.slice(0,1500).length}字)`);
        if (worldCtx) ctxSummary.push(`世界引擎(${worldCtx.length}字)`);
        if (cycleCtx) ctxSummary.push(`循环技法(${cycleCtx.slice(0,1200).length}字)`);
        if (ragContext) ctxSummary.push(`RAG(${ragContext.length}字)`);
        if (rules) ctxSummary.push(`写作规则(${rules.slice(0,600).length}字)`);
        
        // 在控制台输出详细的Prompt诊断，方便用户查看"参考了什么"
        console.group(`[Writer] 第${chap.order}章《${chap.title}》生成诊断`);
        console.log(`Prompt总长度: ${promptLen}字`);
        console.log(`参考内容摘要: ${ctxSummary.join(' | ') || '无'}`);
        console.log(`细纲: ${chap.outline.slice(0,2000).length}字 | 前文: ${prevContent.length}字 | 目标: ${targetWords}字`);
        console.log(`NEXUS前缀: ${nexusPrefix.length}字 (精简模式)`);
        console.log(`max_tokens: 8192`);
        if (fusionCtx) console.log('【融合技法】\n' + fusionCtx.slice(0,500) + '...');
        if (worldCtx) console.log('【世界引擎】\n' + worldCtx.slice(0,500) + '...');
        if (cycleCtx) console.log('【循环技法】\n' + cycleCtx.slice(0,500) + '...');
        console.groupEnd();
        
        if (st) st.textContent = `② Prompt ${promptLen}字 · 参考:${ctxSummary.length}项 · 等待API首字响应...`;
        
        // 如果prompt过长，给出警告提示
        if (promptLen > 8000) {
            console.warn(`[Writer] Prompt过长(${promptLen}字)，可能导致API响应极慢。建议减少世界引擎实体或关闭RAG。`);
        }

        // ── 生成正文（带实时字数显示 + 流式输出） ──
        let content = '';
        let lastUpdate = 0;
        let firstChunkReceived = false;
        try {
            // max_tokens：8192（glm-5.1支持32K上下文，留足余量写2500字正文）
            const maxTokens = 8192;
            await AI.generate(writePrompt, { max_tokens: maxTokens, temperature: 0.95 }, c => {
                content += c;
                const now = Date.now();
                // 首字响应后立刻更新状态
                if (!firstChunkReceived && content.length > 0) {
                    firstChunkReceived = true;
                    if (st) st.textContent = `流式接收中... ${content.length}字`;
                    console.log('[Writer] API首字响应，开始流式输出');
                }
                // 每 100ms 或每收到 20 字更新一次 UI，确保跟手感
                if (editorEl && (now - lastUpdate > 100 || content.length - (editorEl.value?.length || 0) > 20)) {
                    editorEl.value = content;
                    W.onInput();
                    if (st) st.textContent = `流式接收中... ${content.length}字`;
                    lastUpdate = now;
                }
            });

            // 最终更新
            if (editorEl) { editorEl.value = content; W.onInput(); }

            // ── 检查生成结果 ──
            if (!content || content.trim().length === 0) {
                console.error('[Writer] 正文生成结果为空，可能原因：\n1. API未返回内容\n2. 流式解析失败\n3. provider设置不匹配\n请按F12查看Console日志');
                UI.toast('生成失败：API未返回正文。请按F12查看Console排查', 'error');
                if (st) st.textContent = '生成失败：未收到正文 · 请检查Console';
                W._setGenerating(false);
                return;
            }

            chap.content = content;
            await DB.put('chapters', chap);

            if (typeof RAGSystem !== 'undefined') {
                try {
                    await RAGSystem.addDocument(`第${chap.order||''}章: ${chap.title}`, content, 'chapter', { chapterId: chap.id });
                } catch(e) {}
            }

            if (st) st.textContent = `生成完成 ${content.length}字 · 已保存`;
            UI.toast(`本章正文生成完成 (${content.length}字)`);
            W.loadTree();
            
            // ── 后处理：提取细纲 + 实体（非阻塞异步，不卡主线程）──
            setTimeout(async () => {
                try {
                    if (W._autoExtractOutline) {
                        if (st) st.textContent = `生成完成 ${content.length}字 · 正在提取细纲...`;
                        await W._autoExtractOutline(content, chap.id);
                    }
                    if (W._autoExtractEntities) {
                        if (st) st.textContent = `生成完成 ${content.length}字 · 正在提取实体...`;
                        await W._autoExtractEntities(content, chap.id);
                    }
                    if (st) st.textContent = `生成完成 ${content.length}字 · 细纲&实体已提取 · 已保存`;
                } catch(postErr) {
                    console.warn('[Writer] 后处理失败:', postErr);
                    if (st) st.textContent = `生成完成 ${content.length}字 · 已保存(后处理失败)`;
                }
            }, 100);
            
        } catch(e) {
            console.error('[Writer] autoWriteCurrent error:', e);
            if (editorEl && content) { editorEl.value = content; W.onInput(); } // 保留已生成的内容
            UI.toast('生成失败: ' + (e.message || '未知错误'), 'error');
        } finally {
            W._setGenerating(false);
        }
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
4. 遵守NEXUS OS L1铁律（长短句交替：动作短句≤25字制造节奏，环境/心理用长句铺陈，禁通篇电报体；禁情绪标签；章末钩子）
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
});
