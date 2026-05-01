Object.assign(Modules.fusion_book, {
    async runPipeline() {
        if (this._generating || this._pipelineRunning) return UI.toast('正在运行中');
        // ★ 预检查API是否可用
        const apiCheck = await AI.getActiveConfig('fusion');
        if (!apiCheck) return UI.toast('⚠️ 未配置拆书模型或主控模型，请先在「系统设置」→「模型/API」中添加模型', 'error');
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
            this._plLog(this._plConfig?.flowMode === 'creative'
                ? '🎉 流水线全部完成！创作产物已进入执笔台/世界引擎'
                : '🎉 流水线全部完成！弹药已进入拆书弹药库', 'ok');
            UI.toast('流水线执行完毕');
        }
    },

    // ---- 批量多章流水线 ----
    async runBatchPipeline() {
        if (this._generating || this._pipelineRunning) return UI.toast('正在运行中');
        // ★ 预检查API是否可用
        const apiCheck = await AI.getActiveConfig('fusion');
        if (!apiCheck) return UI.toast('⚠️ 未配置拆书模型或主控模型，请先在「系统设置」→「模型/API」中添加模型', 'error');
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
            // 将累积结果设为当前结果，供拆书弹药库预览和手动发布入口读取
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
        const titleEl = document.getElementById('pl-overlay-title');
        const isCreative = this._plConfig.flowMode === 'creative';
        if (titleEl) {
            titleEl.innerHTML = isCreative
                ? '<i class="fa-solid fa-wand-magic-sparkles mr-2"></i>创作融合 · 实时监控'
                : '<i class="fa-solid fa-box-open mr-2"></i>弹药模式 · 实时监控';
        }
        const phase4 = document.getElementById('pl-phase-4');
        if (phase4) phase4.textContent = isCreative ? '④执笔台/世界引擎' : '④弹药入库';
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

    async plStop() {
        this._pipelinePaused = true;
        this._pipelineRunning = false;
        AI.abort(); // 中止正在进行的AI调用
        this._setGenerating(false);
        this._plLog('⏹ 用户停止', 'err');
        // ★ 清除保存的进度，停止后不再自动恢复
        this._savedPipelineState = null;
        try { await DB.del('settings', 'pipeline_state'); } catch(e) {}
        UI.toast('已停止，进度已清除（刷新后不再自动恢复）');
        // 不关闭浮层，用户可以查看结果
    },

    plClose() {
        const overlay = document.getElementById('fb-pipeline-overlay');
        if (overlay) overlay.style.display = 'none';
        const miniStatus = document.getElementById('pl-mini-status');
        if (miniStatus && !this._pipelineRunning) {
            if (this._savedPipelineState) {
                miniStatus.textContent = '继续上次拆书 (' + (this._savedPipelineState.completedPairs||[]).length + '章已完成)';
            } else {
                miniStatus.textContent = '拆书模式';
            }
        }
    },

    _ammoIdPart(v) {
        return String(v || '')
            .replace(/[^\w\u4e00-\u9fa5-]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 80) || 'item';
    },

    _scheduleWorkbenchRefresh() {
        if (this._ammoRefreshTimer) clearTimeout(this._ammoRefreshTimer);
        this._ammoRefreshTimer = setTimeout(async () => {
            try { await Modules.fusion_workbench?.refresh?.(); } catch(e) {}
        }, 350);
    },

    _plSetLinearStats(pending = 0, running = 0, done = 0, total = 0, label = '章') {
        const p = Math.max(0, pending || 0);
        const r = Math.max(0, running || 0);
        const d = Math.max(0, done || 0);
        const t = Math.max(total || (p + r + d), 1);
        this._linearStats = {
            ...(this._linearStats || {}),
            pending: p,
            running: r,
            done: d,
            total: total || 0,
            label,
            failed: this._linearStats?.failed || 0,
            startTime: this._linearStats?.startTime || Date.now()
        };
        const pendingEl = document.getElementById('pl-agent-pending');
        const runningEl = document.getElementById('pl-agent-running');
        const doneEl = document.getElementById('pl-agent-done');
        if (pendingEl) pendingEl.textContent = p;
        if (runningEl) runningEl.textContent = r;
        if (doneEl) doneEl.textContent = d;
        const bar = document.getElementById('pl-progress-bar');
        if (bar) bar.style.width = Math.min(100, Math.round((d / t) * 100)) + '%';
        const stats = document.getElementById('pl-agent-stats');
        if (stats) stats.textContent = `串行循环 · ${d}/${total || 0}${label}`;
    },

    async _savePipelineAmmo(kind, data = {}) {
        if (!data.content) return;
        const now = Date.now();
        const flowMode = this._plConfig?.flowMode || 'tool';
        if (flowMode === 'creative') return;
        const kindNames = {
            analysis: '章节技法弹药',
            compare: '章节对比弹药',
            fusion: '融合精华弹药',
            cycle: '循环融合弹药',
            manual: '手动弹药'
        };
        const leftBookId = data.leftBookId || this.left?.bookId || '';
        const rightBookId = data.rightBookId || this.right?.bookId || '';
        const leftIdx = Number.isFinite(data.leftIndex) ? data.leftIndex : this.left?.chapterIdx;
        const rightIdx = Number.isFinite(data.rightIndex) ? data.rightIndex : this.right?.chapterIdx;
        const baseId = [
            'fusion_ammo',
            kind,
            flowMode,
            data.side || '',
            data.bookId || '',
            Number.isFinite(data.chapterIndex) ? data.chapterIndex : '',
            leftBookId,
            Number.isFinite(leftIdx) ? leftIdx + 1 : '',
            rightBookId,
            Number.isFinite(rightIdx) ? rightIdx + 1 : '',
            data.cycleStart || '',
            data.cycleEnd || ''
        ].filter(v => String(v || '').length).map(v => this._ammoIdPart(v)).join('_');
        const id = data.id || baseId || ('fusion_ammo_' + now);
        let old = null;
        try { old = await DB.get('assets', id); } catch(e) {}
        const title = data.title || data.name || `${kindNames[kind] || '拆书弹药'}${data.chapterTitle ? ' · ' + data.chapterTitle : ''}`;
        await DB.put('assets', {
            ...(old || {}),
            id,
            type: 'fusion_ammo',
            ammoKind: kind,
            flowMode,
            modePreset: this._plConfig?.modePreset || '',
            name: title,
            title,
            content: data.content,
            side: data.side || '',
            bookId: data.bookId || '',
            bookName: data.bookName || '',
            chapterIndex: Number.isFinite(data.chapterIndex) ? data.chapterIndex : (Number.isFinite(data.leftIndex) ? data.leftIndex + 1 : ''),
            chapterTitle: data.chapterTitle || '',
            leftBookId,
            rightBookId,
            leftIndex: Number.isFinite(leftIdx) ? leftIdx + 1 : '',
            rightIndex: Number.isFinite(rightIdx) ? rightIdx + 1 : '',
            leftTitle: data.leftTitle || '',
            rightTitle: data.rightTitle || '',
            pairIndex: data.pairIndex || '',
            cycleStart: data.cycleStart || '',
            cycleEnd: data.cycleEnd || '',
            source: 'fusion_workbench',
            tags: Array.from(new Set(['拆书弹药', kindNames[kind] || kind, flowMode === 'creative' ? '创作融合' : '弹药模式', ...(data.tags || [])])),
            createdAt: old?.createdAt || now,
            updatedAt: now
        });
        this._scheduleWorkbenchRefresh();
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
        if (cfg.cycleMode !== undefined) this._plConfig.cycleMode = cfg.cycleMode;
        if (cfg.cycleSize !== undefined) this._plConfig.cycleSize = cfg.cycleSize;
        if (cfg.maxConcurrency !== undefined) this._plConfig.maxConcurrency = cfg.maxConcurrency;
        if (cfg.directionLock !== undefined) this._plConfig.directionLock = cfg.directionLock;
        if (cfg.flowMode !== undefined) this._plConfig.flowMode = cfg.flowMode;
        if (cfg.modePreset !== undefined) this._plConfig.modePreset = cfg.modePreset;

        await this.loadBookList();
        this._renderChapterList('left');
        this._renderChapterList('right');

        const doneCount = (saved.completedPairs || []).length;
        const cachedAnalysis = Object.keys(saved.analysisResults || {}).length;
        const cachedFusion = Object.keys(saved.fusionResults || {}).length;
        const totalCount = Math.min((cfg.leftChapters||[]).length, (cfg.rightChapters||[]).length);
        UI.toast(`恢复流水线: 已完成${doneCount}/${totalCount}对，已缓存分析${cachedAnalysis}个、融合${cachedFusion}个`);

        this._plShowOverlay();
        this._plLog(`📂 从保存的进度恢复: 已完成${doneCount}/${totalCount}对，缓存分析${cachedAnalysis}个，融合${cachedFusion}个`, 'ok');
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
        this._syncPipelineModeUI();
    },

    _renderConfigChapters() {
        const books = this._books || [];
        const leftBook = books.find(b => b.id === this.left.bookId);
        const rightBook = books.find(b => b.id === this.right.bookId);

        const renderSide = (side, book, containerId) => {
            const el = document.getElementById(containerId);
            if (!el) return;
            if (!book) { el.innerHTML = '<div class="text-[10px] text-dim p-2">请先选择书籍</div>'; return; }
            const savedIdxs = this._plConfig[side + 'Chapters'] || [];
            const isCreative = this._plConfig.flowMode === 'creative';
            const currentIdx = Number.isInteger(this[side]?.chapterIdx) ? this[side].chapterIdx : 0;
            const cycleSize = Math.max(1, parseInt(this._plConfig.cycleSize || 5, 10));
            const reuseSaved = savedIdxs.length > 0 && savedIdxs.length <= 50 && (!isCreative || savedIdxs.length > cycleSize);
            const defaultStart = Math.floor(currentIdx / cycleSize) * cycleSize;
            const defaultEnd = Math.min(book.chapters.length, defaultStart + cycleSize);
            const shouldCheck = (idx) => {
                if (savedIdxs.length && reuseSaved) return savedIdxs.includes(idx);
                if (isCreative) return true;
                return idx >= defaultStart && idx < defaultEnd;
            };
            el.innerHTML = book.chapters.map((ch, i) => `
                <label class="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 cursor-pointer">
                    <input type="checkbox" class="plc-ch-${side} accent-green-500" data-idx="${i}" ${shouldCheck(i) ? 'checked' : ''} onchange="Modules.fusion_book._updateConfigSummary()">
                    <span class="text-[11px] text-gray-300">${i + 1}. ${ch.title}</span>
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

    _setPipelineFlowMode(mode) {
        this._plConfig.flowMode = mode === 'creative' ? 'creative' : 'tool';
        if (this._plConfig.flowMode === 'creative') {
            this._setPipelinePreset('full', true);
            document.querySelectorAll('.plc-ch-left,.plc-ch-right').forEach(cb => { cb.checked = true; });
        } else {
            this._setPipelinePreset('ammo', true);
        }
        this._syncPipelineModeUI();
        this._updateConfigSummary();
    },

    _setPipelinePreset(preset, keepFlow = false) {
        const cfg = {
            ammo: { extract: true, outline: false, write: false, rag: true },
            outline: { extract: true, outline: true, write: false, rag: true },
            full: { extract: true, outline: true, write: true, rag: true }
        }[preset] || { extract: true, outline: false, write: false, rag: true };
        const map = {
            'plc-do-extract': cfg.extract,
            'plc-do-outline': cfg.outline,
            'plc-do-write': cfg.write,
            'plc-do-rag': cfg.rag
        };
        Object.entries(map).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.checked = !!val;
        });
        this._plConfig.modePreset = preset;
        if (!keepFlow) this._plConfig.flowMode = preset === 'ammo' ? 'tool' : 'creative';
        this._syncPipelineModeUI();
        this._updateConfigSummary();
    },

    _syncPipelineModeUI() {
        const isCreative = this._plConfig.flowMode === 'creative';
        const creative = document.getElementById('plc-flow-creative');
        const tool = document.getElementById('plc-flow-tool');
        if (creative) {
            creative.className = 'text-left rounded-xl border p-3 transition-all ' + (isCreative
                ? 'border-orange-400 bg-orange-500/15 ring-1 ring-orange-400/50'
                : 'border-white/10 bg-black/20 hover:border-orange-400/50');
        }
        if (tool) {
            tool.className = 'text-left rounded-xl border p-3 transition-all ' + (!isCreative
                ? 'border-emerald-400 bg-emerald-500/15 ring-1 ring-emerald-400/50'
                : 'border-white/10 bg-black/20 hover:border-emerald-400/50');
        }
        const title = document.getElementById('plc-mode-title');
        const desc = document.getElementById('plc-mode-desc');
        const startBtn = document.getElementById('plc-start-btn');
        if (title) title.textContent = isCreative ? '创作融合开关' : '弹药模式开关';
        if (desc) desc.textContent = isCreative
            ? '按脑洞出新书：细纲/正文自动进入执笔台，实体自动进入世界引擎。'
            : '弹药模式：只沉淀技法、节奏、钩子、实体素材进弹药库/RAG，不写新书。';
        if (startBtn) {
            startBtn.innerHTML = isCreative
                ? '<i class="fa-solid fa-wand-magic-sparkles mr-1"></i>开始循环融合'
                : '<i class="fa-solid fa-box-open mr-1"></i>开始拿弹药';
        }
        if (isCreative) {
            ['plc-do-extract', 'plc-do-outline', 'plc-do-write', 'plc-do-rag', 'plc-cycle-mode'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.checked = true;
            });
        }
        ['plc-do-outline', 'plc-do-write'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.disabled = true;
            const label = el.closest('label');
            if (label) label.classList.toggle('opacity-40', !isCreative);
        });
        const cycle = document.getElementById('plc-cycle-mode');
        if (cycle) cycle.disabled = true;
    },

    _updateConfigSummary() {
        const leftCount = document.querySelectorAll('.plc-ch-left:checked').length;
        const rightCount = document.querySelectorAll('.plc-ch-right:checked').length;
        const total = Math.min(leftCount, rightCount);
        const cycleMode = document.getElementById('plc-cycle-mode')?.checked ?? this._plConfig.cycleMode;
        const cycleSize = parseInt(document.getElementById('plc-cycle-size')?.value || this._plConfig.cycleSize || 5, 10);
        const cycles = cycleMode ? Math.ceil(total / Math.max(1, cycleSize)) : total;
        const opts = [];
        const isCreative = this._plConfig.flowMode === 'creative';
        if (document.getElementById('plc-do-extract')?.checked) opts.push(isCreative ? '世界引擎实体' : '弹药实体');
        if (document.getElementById('plc-do-rag')?.checked) opts.push('存RAG');
        if (isCreative && document.getElementById('plc-do-outline')?.checked) opts.push('执笔台细纲');
        if (isCreative && document.getElementById('plc-do-write')?.checked) opts.push('执笔台正文');
        this._syncPipelineModeUI();
        const el = document.getElementById('plc-summary');
        if (el) el.textContent = (isCreative ? '创作融合模式：' : '弹药模式：') + (cycleMode
            ? `左书 ${leftCount} 章，右书 ${rightCount} 章；每 ${cycleSize} 章做一次循环融合，共 ${cycles} 个循环`
            : `左书 ${leftCount} 章 × 右书 ${rightCount} 章 = 共 ${total} 轮`) + `；${opts.length ? opts.join(' / ') : '只分析'}`;
    },

    // ---- 从配置弹窗启动流水线 ----
    async startConfiguredPipeline() {
        // 收集勾选的章节
        const leftIdxs = [];
        document.querySelectorAll('.plc-ch-left:checked').forEach(cb => leftIdxs.push(parseInt(cb.dataset.idx)));
        const rightIdxs = [];
        document.querySelectorAll('.plc-ch-right:checked').forEach(cb => rightIdxs.push(parseInt(cb.dataset.idx)));

        if (leftIdxs.length === 0 || rightIdxs.length === 0) return UI.toast('请至少勾选左右各一章');
        const plannedPairs = Math.min(leftIdxs.length, rightIdxs.length);
        if (plannedPairs > 50) {
            const ok = confirm(`你当前选择了 ${plannedPairs} 对章节。\n系统会按循环串行执行：先拆左书本循环，再拆右书本循环，再对比融合和产出。\n\n建议先选 5-20 章试跑。仍要继续吗？`);
            if (!ok) return;
        }

        // 收集选项
        const explicitFlowMode = this._plConfig.flowMode === 'creative' ? 'creative' : 'tool';
        this._plConfig.doExtract = document.getElementById('plc-do-extract')?.checked ?? true;
        this._plConfig.doOutline = document.getElementById('plc-do-outline')?.checked ?? false;
        this._plConfig.doWrite = document.getElementById('plc-do-write')?.checked ?? false;
        this._plConfig.doRAG = document.getElementById('plc-do-rag')?.checked ?? true;
        this._plConfig.cycleMode = document.getElementById('plc-cycle-mode')?.checked ?? true;
        this._plConfig.cycleSize = parseInt(document.getElementById('plc-cycle-size')?.value ?? 5);
        this._plConfig.maxConcurrency = Math.max(1, Math.min(3, parseInt(document.getElementById('plc-concurrency')?.value ?? 1, 10)));
        this._plConfig.flowMode = explicitFlowMode;
        this._plConfig.cycleMode = true;
        this._plConfig.maxConcurrency = 1;
        if (this._plConfig.flowMode === 'creative') {
            this._plConfig.doExtract = true;
            this._plConfig.doOutline = true;
            this._plConfig.doWrite = true;
            this._plConfig.doRAG = true;
            ['plc-do-extract', 'plc-do-outline', 'plc-do-write', 'plc-do-rag', 'plc-cycle-mode'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.checked = true;
            });
        } else {
            this._plConfig.doOutline = false;
            this._plConfig.doWrite = false;
            const outlineCb = document.getElementById('plc-do-outline');
            const writeCb = document.getElementById('plc-do-write');
            if (outlineCb) outlineCb.checked = false;
            if (writeCb) writeCb.checked = false;
        }
        this._plConfig.modePreset = this._plConfig.flowMode === 'creative'
            ? (this._plConfig.doWrite ? 'full' : (this._plConfig.doOutline ? 'outline' : 'ammo'))
            : 'ammo';
        this._plConfig.leftChapters = leftIdxs;
        this._plConfig.rightChapters = rightIdxs;
        this._plConfig.directionLock = this._getDirectionLockText ? this._getDirectionLockText() : (this._plConfig.directionLock || '');
        if (this._plConfig.flowMode === 'creative' && typeof GenesisCore !== 'undefined') {
            const project = await GenesisCore.requireActiveProject('创作融合会直接写入执笔台和世界引擎，请先创建或选择一个项目');
            if (!project) return;
        }
        await this.saveDirectionLock?.();

        // 关闭配置弹窗
        const modal = document.getElementById('fb-pipeline-config');
        if (modal) modal.style.display = 'none';

        // 启动流水线（清除旧进度）
        this._savedPipelineState = null;
        await DB.del('settings', 'pipeline_state');
        await this._runConfiguredPipeline(false);
    },

    async _runSequentialAnalysis(side, book, chapterIdx, pairOrdinal, totalPairs, analysisResults) {
        const taskId = `analyze_${side}_${pairOrdinal}`;
        const ch = book?.chapters?.[chapterIdx];
        if (!ch) return null;
        if (analysisResults[taskId]?.result) {
            this._plLog(`[${pairOrdinal + 1}/${totalPairs}] ⏭ ${side === 'left' ? '左书' : '右书'}已拆: ${ch.title}`, 'info');
            return analysisResults[taskId];
        }

        const savedIdx = this[side].chapterIdx;
        const savedAnalysis = this[side].analysis;
        const label = side === 'left' ? '拆左书' : '拆右书';
        this[side].chapterIdx = chapterIdx;
        this._plSetStep(side, 'active', `${label}...`);
        const titleEl = document.getElementById('pl-current-title');
        if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1 text-amber-400"></i>[${pairOrdinal + 1}/${totalPairs}] ${label}: ${ch.title}`;

        await this._analyzeSide(side);
        const result = this[side].analysis || this._pipelineResults?.[side] || '';
        analysisResults[taskId] = { result, chapterIdx, title: ch.title };
        await DB.put('settings', { id: `cycle_${book.id}_${chapterIdx}`, content: result, createdAt: Date.now() });
        this._plSetStep(side, 'done', result ? result.length + '字' : '✓');
        this._plLog(`[${pairOrdinal + 1}/${totalPairs}] 🟢 ${label}完成: ${ch.title} (${result.length}字)`, 'ok');

        this[side].chapterIdx = savedIdx;
        this[side].analysis = savedAnalysis;
        return analysisResults[taskId];
    },

    async _runSequentialFusion(leftBook, rightBook, pair, pairOrdinal, totalPairs, analysisResults, fusionResults) {
        const fusionTaskId = `fusion_${pairOrdinal}`;
        if (fusionResults[fusionTaskId]?.fusion) {
            this._plLog(`[${pairOrdinal + 1}/${totalPairs}] ⏭ 逐章融合已缓存`, 'info');
            return fusionResults[fusionTaskId];
        }

        const leftRes = analysisResults[`analyze_left_${pairOrdinal}`];
        const rightRes = analysisResults[`analyze_right_${pairOrdinal}`];
        const savedLeftIdx = this.left.chapterIdx;
        const savedRightIdx = this.right.chapterIdx;
        const savedLeftAnalysis = this.left.analysis;
        const savedRightAnalysis = this.right.analysis;
        const savedPipelineResults = { ...this._pipelineResults };

        this.left.chapterIdx = pair.leftIdx;
        this.right.chapterIdx = pair.rightIdx;
        this.left.analysis = leftRes?.result || '';
        this.right.analysis = rightRes?.result || '';
        this._pipelineResults = { left: this.left.analysis, right: this.right.analysis, compare: '', fusion: '', world: '', outline: '', write: '' };

        const lCh = leftBook.chapters[pair.leftIdx];
        const rCh = rightBook.chapters[pair.rightIdx];
        this._plSetStep('compare', 'active', '逐章对比中...');
        this._plLog(`[${pairOrdinal + 1}/${totalPairs}] 🔍 对比: ${lCh.title} × ${rCh.title}`, 'info');
        await this.compareAnalysis();
        const compareRes = this._pipelineResults.compare || '';
        this._plSetStep('compare', 'done', compareRes ? compareRes.length + '字' : '✓');

        this._plSetStep('fusion', 'active', '逐章融合中...');
        await this.fusionMerge();
        const fusionRes = this._pipelineResults.fusion || '';
        this._plSetStep('fusion', 'done', fusionRes ? fusionRes.length + '字' : '✓');
        this._plLog(`[${pairOrdinal + 1}/${totalPairs}] 🟢 逐章融合完成 (${fusionRes.length}字)`, 'ok');

        fusionResults[fusionTaskId] = { chapterIdx: pairOrdinal, leftIdx: pair.leftIdx, rightIdx: pair.rightIdx, compare: compareRes, fusion: fusionRes };

        this.left.chapterIdx = savedLeftIdx;
        this.right.chapterIdx = savedRightIdx;
        this.left.analysis = savedLeftAnalysis;
        this.right.analysis = savedRightAnalysis;
        this._pipelineResults = savedPipelineResults;
        return fusionResults[fusionTaskId];
    },

    _buildCycleChapterPack(book, indices = []) {
        return indices.map(idx => {
            const ch = book?.chapters?.[idx];
            if (!ch) return '';
            return `## 第${idx + 1}章：${ch.title || '未命名'}\n${String(ch.content || '').slice(0, 6500)}`;
        }).filter(Boolean).join('\n\n---\n\n').slice(0, 28000);
    },

    async _runCycleAnalysis(side, book, cyclePairs, cycleStart, totalPairs, analysisResults) {
        const startCh = cyclePairs[0].leftIdx + 1;
        const endCh = cyclePairs[cyclePairs.length - 1].leftIdx + 1;
        const idxs = cyclePairs.map(p => side === 'left' ? p.leftIdx : p.rightIdx);
        const key = `cycle_analyze_${side}_${startCh}_${endCh}`;
        if (analysisResults[key]?.result) return analysisResults[key];

        const sideLabel = side === 'left' ? '左书' : '右书';
        const contentPack = this._buildCycleChapterPack(book, idxs);
        if (!contentPack.trim()) return null;

        const outEl = document.getElementById('pl-output');
        const titleEl = document.getElementById('pl-current-title');
        const stepLabel = document.getElementById('pl-step-label');
        if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1 text-amber-400"></i>${sideLabel}第${startCh}-${endCh}章批量拆解`;
        if (stepLabel) stepLabel.textContent = `${sideLabel}批量拆解`;
        if (outEl) outEl.textContent = `${sideLabel}第${startCh}-${endCh}章批量拆解中...\n`;
        this._plSetStep(side, 'active', `${sideLabel}第${startCh}-${endCh}章...`);
        this._setGenerating(true);

        const directionGuard = this._withDirectionGuard ? this._withDirectionGuard('', '循环批量拆书') : '';
        const prompt = `${directionGuard}
你是NEXUS拆书技法引擎。现在一次性拆解《${book.name || sideLabel}》第${startCh}-${endCh}章。

【核心任务】
只提炼技法模板、套路框架、节奏公式、信息差设计、爽点结构、反转触发、人设塑造、冲突升级、金手指节奏、商业钩子。
原书内容只作为技法来源，禁止复述角色名、专有物品、具体情节、场景描写。

【输出方式】
1. 先给“第${startCh}-${endCh}章循环总弹药”：这一组章节共同的开篇/节奏/爽点/钩子规律。
2. 再按章节列出“第X章技法弹药”，每章保留可复用模板和零件库。
3. 每章都要有 L1/P 协议评分。
4. 必须覆盖第${startCh}-${endCh}章全部章节，不得只输出第一章，不得中途要求用户确认。
5. 输出必须是拆解内容，不要说“弹药已送达”“请核查”“准备下一轮”“返回执笔台”“等待指令”。

【本循环原文】
${contentPack}`;

        let result = '';
        try {
            await AI.generate(prompt, { apiType: 'fusion', module: 'fusion_cycle_analyze' }, c => {
                result += c;
                if (outEl) outEl.textContent = result;
                const fbOut = document.getElementById('fb-output');
                if (fbOut) fbOut.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
            });
        } catch(e) {
            this._setGenerating(false);
            if (e.message === '已中止') throw e;
            throw new Error(`${sideLabel}批量拆解失败: ${e.message || '未知错误'}`);
        }

        if (!this._pipelineRunning) {
            this._setGenerating(false);
            throw new Error('已中止');
        }
        this._setGenerating(false);
        analysisResults[key] = { result, side, startCh, endCh, indices: idxs };
        this._pipelineResults[side] = result;
        this._allPipelineResults[side] = (this._allPipelineResults[side] || '') + `\n\n---\n\n## ${sideLabel}第${startCh}-${endCh}章批量拆解\n\n${result}`;
        await DB.put('settings', { id: `cycle_batch_${book.id}_${startCh}_${endCh}`, content: result, createdAt: Date.now() });
        for (let local = 0; local < cyclePairs.length; local++) {
            const pIdx = cycleStart + local;
            const idx = idxs[local];
            const ch = book.chapters[idx];
            analysisResults[`analyze_${side}_${pIdx}`] = {
                result,
                chapterIdx: idx,
                title: ch?.title || '',
                cycleBatch: true,
                cycleStart: startCh,
                cycleEnd: endCh
            };
            await DB.put('settings', { id: `cycle_${book.id}_${idx}`, content: result, createdAt: Date.now(), cycleBatch: true, startChapter: startCh, endChapter: endCh });
        }
        if (this._plConfig.doRAG && typeof RAGSystem !== 'undefined') {
            try { await RAGSystem.addDocument(`批量拆解_${sideLabel}_第${startCh}-${endCh}章`, result.slice(0, 8000), 'pipeline'); } catch(e) {}
        }
        this._plSetStep(side, 'done', result ? `${result.length}字` : '✓');
        this._plLog(`🟢 ${sideLabel}第${startCh}-${endCh}章批量拆解完成 (${result.length}字)`, 'ok');
        return analysisResults[key];
    },

    async _runCycleCompareFusion(leftBook, rightBook, cyclePairs, cycleStart, totalPairs, analysisResults, fusionResults) {
        const startCh = cyclePairs[0].leftIdx + 1;
        const endCh = cyclePairs[cyclePairs.length - 1].leftIdx + 1;
        const key = `cycle_fusion_pair_${startCh}_${endCh}`;
        if (fusionResults[key]?.fusion) return fusionResults[key];

        const leftCycle = analysisResults[`cycle_analyze_left_${startCh}_${endCh}`]?.result ||
            cyclePairs.map((_, local) => analysisResults[`analyze_left_${cycleStart + local}`]?.result || '').filter(Boolean).join('\n\n');
        const rightCycle = analysisResults[`cycle_analyze_right_${startCh}_${endCh}`]?.result ||
            cyclePairs.map((_, local) => analysisResults[`analyze_right_${cycleStart + local}`]?.result || '').filter(Boolean).join('\n\n');
        if (!leftCycle.trim() || !rightCycle.trim()) throw new Error(`第${startCh}-${endCh}章缺少左右书批量拆解结果`);

        const savedLeftIdx = this.left.chapterIdx;
        const savedRightIdx = this.right.chapterIdx;
        const savedLeftAnalysis = this.left.analysis;
        const savedRightAnalysis = this.right.analysis;
        const savedPipelineResults = { ...this._pipelineResults };

        this.left.chapterIdx = cyclePairs[0].leftIdx;
        this.right.chapterIdx = cyclePairs[0].rightIdx;
        this.left.analysis = leftCycle;
        this.right.analysis = rightCycle;
        this._pipelineResults = { left: leftCycle, right: rightCycle, compare: '', fusion: '', world: '', outline: '', write: '' };

        this._plSetStep('compare', 'active', `第${startCh}-${endCh}章循环对比...`);
        this._plLog(`② 循环对比: 第${startCh}-${endCh}章`, 'info');
        await this.compareAnalysis();
        const compareRes = this._pipelineResults.compare || '';
        this._plSetStep('compare', 'done', compareRes ? `${compareRes.length}字` : '✓');

        this._plSetStep('fusion', 'active', `第${startCh}-${endCh}章循环融合...`);
        await this.fusionMerge();
        const fusionRes = this._pipelineResults.fusion || '';
        this._plSetStep('fusion', 'done', fusionRes ? `${fusionRes.length}字` : '✓');
        this._plLog(`🟢 第${startCh}-${endCh}章循环对比融合完成 (${fusionRes.length}字)`, 'ok');

        const payload = { compare: compareRes, fusion: fusionRes, startCh, endCh };
        fusionResults[key] = payload;
        for (let local = 0; local < cyclePairs.length; local++) {
            const pair = cyclePairs[local];
            const pIdx = cycleStart + local;
            fusionResults[`fusion_${pIdx}`] = {
                chapterIdx: pIdx,
                leftIdx: pair.leftIdx,
                rightIdx: pair.rightIdx,
                compare: compareRes,
                fusion: fusionRes,
                cycleBatch: true,
                cycleStart: startCh,
                cycleEnd: endCh
            };
        }

        this.left.chapterIdx = savedLeftIdx;
        this.right.chapterIdx = savedRightIdx;
        this.left.analysis = savedLeftAnalysis;
        this.right.analysis = savedRightAnalysis;
        this._pipelineResults = savedPipelineResults;
        return payload;
    },

    async _buildPipelineKnowledgeContext() {
        let knowledgeCtx = '';
        try {
            const allEntities = await DB.getAll('entities') || [];
            const stagedEntities = await this._getWorkbenchEntitySnapshots?.() || [];
            const entities = [
                ...allEntities.filter(e => !String(e.id || '').startsWith('world_')),
                ...stagedEntities
            ];
            const worlds = allEntities.filter(e => String(e.id || '').startsWith('world_') && e.desc);
            if (entities.length) {
                const grouped = {};
                entities.forEach(e => {
                    const t = e.type || '其他';
                    if (!grouped[t]) grouped[t] = [];
                    grouped[t].push(e);
                });
                knowledgeCtx += '【知识图谱 - 已有实体】\n';
                for (const [type, ents] of Object.entries(grouped)) {
                    knowledgeCtx += `[${type}] ` + ents.map(e => {
                        let s = e.name;
                        if (e.desc) s += ': ' + e.desc.slice(0, 80);
                        if (e.relations && e.relations.length) s += ' (' + e.relations.slice(0, 5).join(', ') + ')';
                        return s;
                    }).join(' | ') + '\n';
                }
            }
            if (worlds.length) {
                knowledgeCtx += '\n【知识图谱 - 世界观设定】\n';
                worlds.forEach(w => { knowledgeCtx += `[${w.name}] ${(w.desc || '').slice(0, 200)}\n`; });
            }
        } catch(e) {}
        return knowledgeCtx;
    },

    async _runCreativeCyclePipeline({ leftBook, rightBook, pairs, cfg, completedPairs, analysisResults, fusionResults, accOutlines, accEntities, allOutlines, allWritings }) {
        const cycleSize = Math.max(1, parseInt(cfg.cycleSize || 5, 10));
        cfg.cycleMode = true;
        cfg.maxConcurrency = 1;
        const totalPairs = pairs.length;

        const infoEl = document.getElementById('pl-pipeline-info');
        if (infoEl) {
            const opts = [];
            if (cfg.doExtract) opts.push('世界引擎实体');
            if (cfg.doOutline) opts.push('执笔台细纲');
            if (cfg.doWrite) opts.push('执笔台正文');
            if (cfg.doRAG) opts.push('RAG');
            infoEl.innerHTML = `左书: 《${leftBook.name}》 | 右书: 《${rightBook.name}》<br>` +
                `创作模式: 每 ${cycleSize} 章一循环，串行执行<br>` +
                `流程: 批量拆左N章 → 批量拆右N章 → 循环对比 → 按脑洞融合 → 本循环N章细纲/实体/正文 | 启用: ${opts.join(' | ') || '只融合'}`;
        }

        this._plLog(`🚀 创作融合启动: ${totalPairs} 对章节 | 每${cycleSize}章一循环 | 串行逐步执行`, 'ok');
        this._plSetLinearStats(totalPairs - completedPairs.length, 0, completedPairs.length, totalPairs, '章');

        for (let cycleStart = 0; cycleStart < pairs.length; cycleStart += cycleSize) {
            if (this._pipelinePaused || !this._pipelineRunning) break;
            const cyclePairs = pairs.slice(cycleStart, cycleStart + cycleSize);
            const startCh = cyclePairs[0].leftIdx + 1;
            const endCh = cyclePairs[cyclePairs.length - 1].leftIdx + 1;
            const cycleNum = Math.floor(cycleStart / cycleSize) + 1;
            const cycleDone = cyclePairs.every(p => completedPairs.includes(`${p.leftIdx}_${p.rightIdx}`));
            if (cycleDone) {
                this._plLog(`⏭ 循环${cycleNum}已完成: 第${startCh}-${endCh}章`, 'info');
                continue;
            }

            this._plLog(`\n━━━ 循环${cycleNum}: 第${startCh}-${endCh}章 ━━━`, 'info');
            this._setPhase(1);
            this._plSetLinearStats(totalPairs - completedPairs.length, 1, completedPairs.length, totalPairs, '章');
            this._plLog(`① 批量读取并拆左书第${startCh}-${endCh}章`, 'info');
            await this._runCycleAnalysis('left', leftBook, cyclePairs, cycleStart, totalPairs, analysisResults);
            this._pipelineResumeCache = { analysisResults, fusionResults };
            await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);

            if (this._pipelinePaused || !this._pipelineRunning) break;

            this._plLog(`① 批量读取并拆右书第${startCh}-${endCh}章`, 'info');
            await this._runCycleAnalysis('right', rightBook, cyclePairs, cycleStart, totalPairs, analysisResults);
            this._pipelineResumeCache = { analysisResults, fusionResults };
            await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);

            if (this._pipelinePaused || !this._pipelineRunning) break;

            this._setPhase(2);
            this._plLog(`② 循环级对比并融合第${startCh}-${endCh}章`, 'info');
            await this._runCycleCompareFusion(leftBook, rightBook, cyclePairs, cycleStart, totalPairs, analysisResults, fusionResults);
            this._pipelineResumeCache = { analysisResults, fusionResults };
            await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);

            if (this._pipelinePaused || !this._pipelineRunning) break;

            for (let local = 0; local < cyclePairs.length; local++) {
                const pair = cyclePairs[local];
                const pIdx = cycleStart + local;
                const leftRes = analysisResults[`analyze_left_${pIdx}`];
                const rightRes = analysisResults[`analyze_right_${pIdx}`];
                if (leftRes?.result) await DB.put('settings', { id: `cycle_${leftBook.id}_${pair.leftIdx}`, content: leftRes.result, createdAt: Date.now() });
                if (rightRes?.result) await DB.put('settings', { id: `cycle_${rightBook.id}_${pair.rightIdx}`, content: rightRes.result, createdAt: Date.now() });
            }

            this._setPhase(3);
            this._plLog(`🔄 按脑洞融合本循环: 第${startCh}-${endCh}章`, 'info');
            const cycleFusion = await this._cycleFusionSummary(cyclePairs, cyclePairs.length, leftBook, rightBook) || '';

            this._setPhase(4);
            const pendingCreative = cyclePairs
                .map((pair, local) => ({ pair, local, pIdx: cycleStart + local, pairKey: `${pair.leftIdx}_${pair.rightIdx}` }))
                .filter(item => !completedPairs.includes(item.pairKey));
            const cycleStates = new Map();
            const setupCreativeChapter = async (item, stageLabel) => {
                const { pair, pIdx } = item;
                const leftRes = analysisResults[`analyze_left_${pIdx}`];
                const rightRes = analysisResults[`analyze_right_${pIdx}`];
                const fusionRes = fusionResults[`fusion_${pIdx}`] || {};
                const state = cycleStates.get(item.pairKey) || {};
                if (!state.outline) {
                    const savedOutline = await DB.get('settings', `cycle_outline_${pair.leftIdx}`).catch(() => null);
                    if (savedOutline?.content) state.outline = savedOutline.content;
                }
                if (!state.write) {
                    const savedWrite = await DB.get('settings', `cycle_write_${pair.leftIdx}`).catch(() => null);
                    if (savedWrite?.content) state.write = savedWrite.content;
                }
                this.left.chapterIdx = pair.leftIdx;
                this.right.chapterIdx = pair.rightIdx;
                this.left.analysis = leftRes?.result || '';
                this.right.analysis = rightRes?.result || '';
                this._pipelineResults = {
                    left: this.left.analysis,
                    right: this.right.analysis,
                    compare: fusionRes.compare || '',
                    fusion: `${fusionRes.fusion || ''}\n\n【本循环原创融合方案】\n${cycleFusion}`.trim(),
                    world: state.world || '',
                    outline: state.outline || '',
                    write: state.write || ''
                };
                const titleEl = document.getElementById('pl-current-title');
                if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-pen-nib mr-1 text-orange-400"></i>[${pIdx + 1}/${totalPairs}] ${stageLabel}: 原创第${pair.leftIdx + 1}章`;
                const stepLabel = document.getElementById('pl-step-label');
                if (stepLabel) stepLabel.textContent = `${startCh}-${endCh}章 ${stageLabel}`;
                this._accContext = {
                    outlines: accOutlines,
                    entities: accEntities,
                    knowledgeGraph: await this._buildPipelineKnowledgeContext(),
                    chapterNum: pair.leftIdx + 1
                };
                cycleStates.set(item.pairKey, state);
                return state;
            };

            if (cfg.doOutline) {
                this._plLog(`④ 本循环先生成${pendingCreative.length}章细纲: 第${startCh}-${endCh}章`, 'info');
                for (const item of pendingCreative) {
                    if (this._pipelinePaused || !this._pipelineRunning) break;
                    const state = await setupCreativeChapter(item, '细纲');
                    this._plSetStep('outline', 'active', '本循环细纲生成中...');
                    await this._pipelineSaveOutline();
                    state.outline = this._pipelineResults.outline || state.outline || '';
                    const len = state.outline.length;
                    this._plSetStep('outline', 'done', len ? `${len}字` : '✓');
                    this._plLog(`[${item.pIdx + 1}/${totalPairs}] 🟢 执笔台细纲完成` + (len ? ` (${len}字)` : ''), 'ok');
                    if (state.outline) {
                        await DB.put('settings', { id: `cycle_outline_${item.pair.leftIdx}`, content: state.outline, createdAt: Date.now() });
                        accOutlines += `\n\n### 第${item.pair.leftIdx + 1}章细纲\n${state.outline.slice(0, 2000)}`;
                        allOutlines += `## 第${item.pair.leftIdx + 1}章\n\n${state.outline}\n\n---\n\n`;
                    }
                    this._pipelineResumeCache = { analysisResults, fusionResults };
                    await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
                }
            }

            if (this._pipelinePaused || !this._pipelineRunning) break;
            if (cfg.doExtract) {
                this._plLog(`④ 再提取本循环${pendingCreative.length}章实体: 第${startCh}-${endCh}章`, 'info');
                for (const item of pendingCreative) {
                    if (this._pipelinePaused || !this._pipelineRunning) break;
                    const state = await setupCreativeChapter(item, '实体');
                    this._plSetStep('world', 'active', '本循环实体入世界引擎...');
                    await this._pipelineExtractEntities();
                    state.world = this._pipelineResults.world || state.world || '';
                    const len = state.world.length;
                    this._plSetStep('world', 'done', len ? `${len}字` : '✓');
                    this._plLog(`[${item.pIdx + 1}/${totalPairs}] 🟢 实体入世界引擎完成` + (len ? ` (${len}字)` : ''), 'ok');
                    if (state.world) accEntities += `\n\n### 第${item.pair.leftIdx + 1}章实体\n${state.world.slice(0, 1500)}`;
                    this._pipelineResumeCache = { analysisResults, fusionResults };
                    await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
                }
            }

            if (this._pipelinePaused || !this._pipelineRunning) break;
            if (cfg.doWrite) {
                this._plLog(`④ 最后写本循环${pendingCreative.length}章正文: 第${startCh}-${endCh}章`, 'info');
                for (const item of pendingCreative) {
                    if (this._pipelinePaused || !this._pipelineRunning) break;
                    const state = await setupCreativeChapter(item, '正文');
                    this._plSetStep('write', 'active', '本循环正文写入执笔台...');
                    await this._pipelineWriteToWriter();
                    state.write = this._pipelineResults.write || state.write || '';
                    const len = state.write.length;
                    this._plSetStep('write', 'done', len ? `${len}字` : '✓');
                    this._plLog(`[${item.pIdx + 1}/${totalPairs}] 🟢 执笔台正文完成` + (len ? ` (${len}字)` : ''), 'ok');
                    if (state.write) {
                        await DB.put('settings', { id: `cycle_write_${item.pair.leftIdx}`, content: state.write, createdAt: Date.now() });
                        allWritings += `## 第${item.pair.leftIdx + 1}章\n\n${state.write}\n\n---\n\n`;
                    }
                    this._pipelineResumeCache = { analysisResults, fusionResults };
                    await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
                }
            }

            if (this._pipelinePaused || !this._pipelineRunning) break;
            for (const item of pendingCreative) {
                const { pair, pairKey, pIdx } = item;
                const lCh = leftBook.chapters[pair.leftIdx];
                const rCh = rightBook.chapters[pair.rightIdx];
                const state = cycleStates.get(pairKey) || {};
                this._pipelineResults = {
                    ...(this._pipelineResults || {}),
                    outline: state.outline || '',
                    world: state.world || '',
                    write: state.write || ''
                };
                if (cfg.doRAG && typeof RAGSystem !== 'undefined') {
                    const pack = `${this._pipelineResults.left || ''}\n${this._pipelineResults.right || ''}\n${this._pipelineResults.compare || ''}\n${this._pipelineResults.fusion || ''}`;
                    if (pack.trim()) await RAGSystem.addDocument(`创作循环_${lCh.title}_vs_${rCh.title}`, pack.slice(0, 8000), 'pipeline');
                }
                completedPairs.push(pairKey);
                this._plSetLinearStats(totalPairs - completedPairs.length, 0, completedPairs.length, totalPairs, '章');
                this._plLog(`[${pIdx + 1}/${totalPairs}] ✅ 第${pair.leftIdx + 1}章创作闭环完成`, 'ok');
            }
            this._pipelineResumeCache = { analysisResults, fusionResults };
            await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
        }

        if (this._pipelinePaused) {
            await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
            return;
        }

        this._pipelineRunning = false;
        const pauseBtn = document.getElementById('pl-pause-btn');
        const stopBtn = document.getElementById('pl-stop-btn');
        if (pauseBtn) pauseBtn.style.display = 'none';
        if (stopBtn) stopBtn.style.display = 'none';
        await DB.del('settings', 'pipeline_state');
        this._savedPipelineState = null;
        this._pipelineResults = { ...this._allPipelineResults };
        this._plConfig.lastSync = Date.now();
        this._plSetLinearStats(0, 0, totalPairs, totalPairs, '章');
        const titleEl = document.getElementById('pl-current-title');
        if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-check-circle mr-1 text-green-400"></i>创作融合全部完成';
        const stepLabel = document.getElementById('pl-step-label');
        if (stepLabel) stepLabel.textContent = '全部完成';
        const miniStatus = document.getElementById('pl-mini-status');
        if (miniStatus) miniStatus.textContent = '创作融合已完成';
        this._plLog(`\n🎉 创作融合完成：${totalPairs}章已写入执笔台，实体已同步世界引擎`, 'ok');
        UI.toast(`创作融合完成: ${totalPairs}章`);
    },

    async _runToolCyclePipeline({ leftBook, rightBook, pairs, cfg, completedPairs, analysisResults, fusionResults, accOutlines, accEntities, allOutlines, allWritings }) {
        const cycleSize = Math.max(1, parseInt(cfg.cycleSize || 5, 10));
        cfg.cycleMode = true;
        cfg.doOutline = false;
        cfg.doWrite = false;
        cfg.maxConcurrency = 1;
        const totalPairs = pairs.length;

        const infoEl = document.getElementById('pl-pipeline-info');
        if (infoEl) {
            const opts = [];
            if (cfg.doExtract) opts.push('弹药实体');
            if (cfg.doRAG) opts.push('RAG');
            infoEl.innerHTML = `左书: 《${leftBook.name}》 | 右书: 《${rightBook.name}》<br>` +
                `弹药模式: 每 ${cycleSize} 章一循环，串行拆解并实时进入拆书弹药库<br>` +
                `流程: 拆左N章 → 拆右N章 → 逐章对比 → 循环融合弹药 → 弹药库/RAG | 启用: ${opts.join(' | ') || '只拆技法'}`;
        }

        this._plLog(`🚀 弹药模式启动: ${totalPairs} 对章节 | 每${cycleSize}章一循环 | 只入拆书弹药库`, 'ok');
        this._plSetLinearStats(totalPairs - completedPairs.length, 0, completedPairs.length, totalPairs, '章');

        for (let cycleStart = 0; cycleStart < pairs.length; cycleStart += cycleSize) {
            if (this._pipelinePaused || !this._pipelineRunning) break;
            const cyclePairs = pairs.slice(cycleStart, cycleStart + cycleSize);
            const startCh = cyclePairs[0].leftIdx + 1;
            const endCh = cyclePairs[cyclePairs.length - 1].leftIdx + 1;
            const cycleNum = Math.floor(cycleStart / cycleSize) + 1;
            const cycleDone = cyclePairs.every(p => completedPairs.includes(`${p.leftIdx}_${p.rightIdx}`));
            if (cycleDone) {
                this._plLog(`⏭ 循环${cycleNum}已完成: 第${startCh}-${endCh}章`, 'info');
                continue;
            }

            this._plLog(`\n━━━ 弹药循环${cycleNum}: 第${startCh}-${endCh}章 ━━━`, 'info');
            this._setPhase(1);
            this._plLog(`① 拆左书第${startCh}-${endCh}章`, 'info');
            for (let local = 0; local < cyclePairs.length; local++) {
                if (this._pipelinePaused || !this._pipelineRunning) break;
                const pair = cyclePairs[local];
                const pIdx = cycleStart + local;
                const pairKey = `${pair.leftIdx}_${pair.rightIdx}`;
                if (completedPairs.includes(pairKey)) continue;
                const lCh = leftBook.chapters[pair.leftIdx];
                this._plSetLinearStats(totalPairs - completedPairs.length - 1, 1, completedPairs.length, totalPairs, '章');
                this._plLog(`[弹药循环${cycleNum} · 左${local + 1}/${cyclePairs.length}] ${lCh.title}`, 'info');
                await this._runSequentialAnalysis('left', leftBook, pair.leftIdx, pIdx, totalPairs, analysisResults);
                this._pipelineResumeCache = { analysisResults, fusionResults };
                await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
            }

            if (this._pipelinePaused || !this._pipelineRunning) break;

            this._plLog(`① 拆右书第${startCh}-${endCh}章`, 'info');
            for (let local = 0; local < cyclePairs.length; local++) {
                if (this._pipelinePaused || !this._pipelineRunning) break;
                const pair = cyclePairs[local];
                const pIdx = cycleStart + local;
                const pairKey = `${pair.leftIdx}_${pair.rightIdx}`;
                if (completedPairs.includes(pairKey)) continue;
                const rCh = rightBook.chapters[pair.rightIdx];
                this._plSetLinearStats(totalPairs - completedPairs.length - 1, 1, completedPairs.length, totalPairs, '章');
                this._plLog(`[弹药循环${cycleNum} · 右${local + 1}/${cyclePairs.length}] ${rCh.title}`, 'info');
                await this._runSequentialAnalysis('right', rightBook, pair.rightIdx, pIdx, totalPairs, analysisResults);
                this._pipelineResumeCache = { analysisResults, fusionResults };
                await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
            }

            if (this._pipelinePaused || !this._pipelineRunning) break;

            this._setPhase(2);
            this._plLog(`② 逐章对比并融合第${startCh}-${endCh}章`, 'info');
            for (let local = 0; local < cyclePairs.length; local++) {
                if (this._pipelinePaused || !this._pipelineRunning) break;
                const pair = cyclePairs[local];
                const pIdx = cycleStart + local;
                const pairKey = `${pair.leftIdx}_${pair.rightIdx}`;
                if (completedPairs.includes(pairKey)) continue;
                await this._runSequentialFusion(leftBook, rightBook, pair, pIdx, totalPairs, analysisResults, fusionResults);
                this._pipelineResumeCache = { analysisResults, fusionResults };
                await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
            }

            if (this._pipelinePaused || !this._pipelineRunning) break;

            this._setPhase(3);
            this._plLog(`③ 汇总循环弹药: 第${startCh}-${endCh}章`, 'info');
            await this._cycleFusionSummary(cyclePairs, cyclePairs.length, leftBook, rightBook);

            this._setPhase(4);
            this._plLog(`④ 弹药入库确认: 第${startCh}-${endCh}章`, 'info');
            for (let local = 0; local < cyclePairs.length; local++) {
                if (this._pipelinePaused || !this._pipelineRunning) break;
                const pair = cyclePairs[local];
                const pIdx = cycleStart + local;
                const pairKey = `${pair.leftIdx}_${pair.rightIdx}`;
                if (completedPairs.includes(pairKey)) continue;

                const lCh = leftBook.chapters[pair.leftIdx];
                const rCh = rightBook.chapters[pair.rightIdx];
                const leftRes = analysisResults[`analyze_left_${pIdx}`];
                const rightRes = analysisResults[`analyze_right_${pIdx}`];
                const fusionRes = fusionResults[`fusion_${pIdx}`] || {};

                this.left.chapterIdx = pair.leftIdx;
                this.right.chapterIdx = pair.rightIdx;
                this.left.analysis = leftRes?.result || '';
                this.right.analysis = rightRes?.result || '';
                this._pipelineResults = {
                    left: this.left.analysis,
                    right: this.right.analysis,
                    compare: fusionRes.compare || '',
                    fusion: fusionRes.fusion || '',
                    world: '',
                    outline: '',
                    write: ''
                };

                const titleEl = document.getElementById('pl-current-title');
                if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-box-open mr-1 text-green-400"></i>[${pIdx + 1}/${totalPairs}] 弹药入库: ${lCh.title} × ${rCh.title}`;
                const stepLabel = document.getElementById('pl-step-label');
                if (stepLabel) stepLabel.textContent = `${pIdx + 1}/${totalPairs} 入库`;

                if (cfg.doExtract) {
                    this._accContext = {
                        outlines: accOutlines,
                        entities: accEntities,
                        knowledgeGraph: await this._buildPipelineKnowledgeContext(),
                        chapterNum: pair.leftIdx + 1
                    };
                    this._plSetStep('world', 'active', '提取弹药实体...');
                    await this._pipelineExtractEntities();
                    const len = (this._pipelineResults.world || '').length;
                    this._plSetStep('world', 'done', len ? `${len}字` : '✓');
                    if (this._pipelineResults.world) accEntities += `\n\n### 第${pair.leftIdx + 1}章弹药实体\n${this._pipelineResults.world.slice(0, 1500)}`;
                }

                if (cfg.doRAG && typeof RAGSystem !== 'undefined') {
                    const pack = `${this._pipelineResults.left || ''}\n${this._pipelineResults.right || ''}\n${this._pipelineResults.compare || ''}\n${this._pipelineResults.fusion || ''}`;
                    if (pack.trim()) await RAGSystem.addDocument(`拆书弹药_${lCh.title}_vs_${rCh.title}`, pack.slice(0, 8000), 'pipeline');
                }

                const now = Date.now();
                if (!this._chapterTimestamps) this._chapterTimestamps = {};
                this._chapterTimestamps[`${leftBook.id}_left_${pair.leftIdx}`] = now;
                this._chapterTimestamps[`${rightBook.id}_right_${pair.rightIdx}`] = now;
                await DB.put('settings', { id: 'pipeline_chapter_timestamps', data: this._chapterTimestamps });
                this._renderChapterList('left');
                this._renderChapterList('right');

                completedPairs.push(pairKey);
                this._plSetLinearStats(totalPairs - completedPairs.length, 0, completedPairs.length, totalPairs, '章');
                this._pipelineResumeCache = { analysisResults, fusionResults };
                await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
            }
        }

        if (this._pipelinePaused) {
            await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
            return;
        }

        this._pipelineRunning = false;
        const pauseBtn = document.getElementById('pl-pause-btn');
        const stopBtn = document.getElementById('pl-stop-btn');
        if (pauseBtn) pauseBtn.style.display = 'none';
        if (stopBtn) stopBtn.style.display = 'none';
        await DB.del('settings', 'pipeline_state');
        this._savedPipelineState = null;
        this._pipelineResults = { ...this._allPipelineResults };
        this._plConfig.lastSync = Date.now();
        this._plSetLinearStats(0, 0, totalPairs, totalPairs, '章');
        const titleEl = document.getElementById('pl-current-title');
        if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-check-circle mr-1 text-green-400"></i>拆书弹药全部入库';
        const stepLabel = document.getElementById('pl-step-label');
        if (stepLabel) stepLabel.textContent = '全部完成';
        const miniStatus = document.getElementById('pl-mini-status');
        if (miniStatus) miniStatus.textContent = '拆书弹药已就绪';
        this._plLog(`\n🎉 弹药模式完成：${totalPairs}对章节已进入拆书弹药库`, 'ok');
        UI.toast(`拆书弹药完成: ${totalPairs}对章节`);
    },

    async _runAmmoCyclePipeline({ leftBook, rightBook, pairs, cfg, completedPairs, analysisResults, fusionResults, accOutlines, accEntities, allOutlines, allWritings }) {
        const cycleSize = Math.max(1, parseInt(cfg.cycleSize || 5, 10));
        cfg.cycleMode = true;
        cfg.doOutline = false;
        cfg.doWrite = false;
        cfg.maxConcurrency = 1;
        const totalPairs = pairs.length;

        const infoEl = document.getElementById('pl-pipeline-info');
        if (infoEl) {
            const opts = [];
            if (cfg.doExtract) opts.push('弹药实体');
            if (cfg.doRAG) opts.push('RAG');
            infoEl.innerHTML = `左书: 《${leftBook.name}》 | 右书: 《${rightBook.name}》<br>` +
                `弹药模式: 每 ${cycleSize} 章一循环，自动串行到底<br>` +
                `流程: 批量拆左N章 → 批量拆右N章 → 循环对比融合 → 弹药库/RAG | 启用: ${opts.join(' | ') || '只拆技法'}`;
        }

        this._plLog(`🚀 弹药模式启动: ${totalPairs} 对章节 | 每${cycleSize}章一循环 | 自动入拆书弹药库`, 'ok');
        this._plSetLinearStats(totalPairs - completedPairs.length, 0, completedPairs.length, totalPairs, '章');

        for (let cycleStart = 0; cycleStart < pairs.length; cycleStart += cycleSize) {
            if (this._pipelinePaused || !this._pipelineRunning) break;
            const cyclePairs = pairs.slice(cycleStart, cycleStart + cycleSize);
            const startCh = cyclePairs[0].leftIdx + 1;
            const endCh = cyclePairs[cyclePairs.length - 1].leftIdx + 1;
            const cycleNum = Math.floor(cycleStart / cycleSize) + 1;
            const cycleKeys = cyclePairs.map(p => `${p.leftIdx}_${p.rightIdx}`);
            if (cycleKeys.every(k => completedPairs.includes(k))) {
                this._plLog(`⏭ 弹药循环${cycleNum}已完成: 第${startCh}-${endCh}章`, 'info');
                continue;
            }

            this._plLog(`\n━━━ 弹药循环${cycleNum}: 第${startCh}-${endCh}章 ━━━`, 'info');
            this._plSetLinearStats(totalPairs - completedPairs.length, 1, completedPairs.length, totalPairs, '章');

            this._setPhase(1);
            this._plLog(`① 批量拆左书第${startCh}-${endCh}章`, 'info');
            const leftBatch = await this._runCycleAnalysis('left', leftBook, cyclePairs, cycleStart, totalPairs, analysisResults);
            if (leftBatch?.result) {
                await this._savePipelineAmmo?.('analysis', {
                    side: 'left',
                    bookId: leftBook.id,
                    bookName: leftBook.name,
                    cycleStart: startCh,
                    cycleEnd: endCh,
                    content: leftBatch.result,
                    title: `左书第${startCh}-${endCh}章技法弹药 · ${leftBook.name}`,
                    tags: ['批量拆解', '左书']
                });
            }
            this._pipelineResumeCache = { analysisResults, fusionResults };
            await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
            if (this._pipelinePaused || !this._pipelineRunning) break;

            this._plLog(`① 批量拆右书第${startCh}-${endCh}章`, 'info');
            const rightBatch = await this._runCycleAnalysis('right', rightBook, cyclePairs, cycleStart, totalPairs, analysisResults);
            if (rightBatch?.result) {
                await this._savePipelineAmmo?.('analysis', {
                    side: 'right',
                    bookId: rightBook.id,
                    bookName: rightBook.name,
                    cycleStart: startCh,
                    cycleEnd: endCh,
                    content: rightBatch.result,
                    title: `右书第${startCh}-${endCh}章技法弹药 · ${rightBook.name}`,
                    tags: ['批量拆解', '右书']
                });
            }
            this._pipelineResumeCache = { analysisResults, fusionResults };
            await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
            if (this._pipelinePaused || !this._pipelineRunning) break;

            this._setPhase(2);
            this._plLog(`② 循环对比融合第${startCh}-${endCh}章`, 'info');
            const cycleFusion = await this._runCycleCompareFusion(leftBook, rightBook, cyclePairs, cycleStart, totalPairs, analysisResults, fusionResults);
            if (cycleFusion?.compare) {
                await this._savePipelineAmmo?.('compare', {
                    leftBookId: leftBook.id,
                    rightBookId: rightBook.id,
                    cycleStart: startCh,
                    cycleEnd: endCh,
                    content: cycleFusion.compare,
                    title: `循环对比弹药 · 第${startCh}-${endCh}章`,
                    tags: ['循环对比']
                });
            }
            if (cycleFusion?.fusion) {
                await this._savePipelineAmmo?.('fusion', {
                    leftBookId: leftBook.id,
                    rightBookId: rightBook.id,
                    cycleStart: startCh,
                    cycleEnd: endCh,
                    content: cycleFusion.fusion,
                    title: `循环融合弹药 · 第${startCh}-${endCh}章`,
                    tags: ['循环融合']
                });
            }
            this._pipelineResumeCache = { analysisResults, fusionResults };
            await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
            if (this._pipelinePaused || !this._pipelineRunning) break;

            this._setPhase(3);
            this._plLog(`③ 汇总循环弹药: 第${startCh}-${endCh}章`, 'info');
            await this._cycleFusionSummary(cyclePairs, cyclePairs.length, leftBook, rightBook);
            if (this._pipelinePaused || !this._pipelineRunning) break;

            this._setPhase(4);
            this.left.chapterIdx = cyclePairs[0].leftIdx;
            this.right.chapterIdx = cyclePairs[0].rightIdx;
            this.left.analysis = leftBatch?.result || '';
            this.right.analysis = rightBatch?.result || '';
            this._pipelineResults = {
                left: leftBatch?.result || '',
                right: rightBatch?.result || '',
                compare: cycleFusion?.compare || '',
                fusion: cycleFusion?.fusion || '',
                world: '',
                outline: '',
                write: ''
            };
            const titleEl = document.getElementById('pl-current-title');
            if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-box-open mr-1 text-green-400"></i>第${startCh}-${endCh}章弹药入库`;
            const stepLabel = document.getElementById('pl-step-label');
            if (stepLabel) stepLabel.textContent = `第${startCh}-${endCh}章入库`;
            this._plLog(`④ 弹药入库: 第${startCh}-${endCh}章`, 'info');

            if (cfg.doExtract) {
                this._accContext = {
                    outlines: accOutlines,
                    entities: accEntities,
                    knowledgeGraph: await this._buildPipelineKnowledgeContext(),
                    chapterNum: startCh
                };
                this._plSetStep('world', 'active', '提取循环弹药实体...');
                await this._pipelineExtractEntities();
                const len = (this._pipelineResults.world || '').length;
                this._plSetStep('world', 'done', len ? `${len}字` : '✓');
                if (this._pipelineResults.world) accEntities += `\n\n### 第${startCh}-${endCh}章弹药实体\n${this._pipelineResults.world.slice(0, 2000)}`;
            }

            if (cfg.doRAG && typeof RAGSystem !== 'undefined') {
                const pack = `${this._pipelineResults.left}\n${this._pipelineResults.right}\n${this._pipelineResults.compare}\n${this._pipelineResults.fusion}`;
                if (pack.trim()) {
                    await RAGSystem.addDocument(`拆书弹药_第${startCh}-${endCh}章循环包`, pack.slice(0, 10000), 'pipeline');
                    this._plLog(`🔍 第${startCh}-${endCh}章循环弹药已存入RAG`, 'entity');
                }
            }

            const now = Date.now();
            if (!this._chapterTimestamps) this._chapterTimestamps = {};
            for (const pair of cyclePairs) {
                const pairKey = `${pair.leftIdx}_${pair.rightIdx}`;
                if (!completedPairs.includes(pairKey)) completedPairs.push(pairKey);
                this._chapterTimestamps[`${leftBook.id}_left_${pair.leftIdx}`] = now;
                this._chapterTimestamps[`${rightBook.id}_right_${pair.rightIdx}`] = now;
            }
            await DB.put('settings', { id: 'pipeline_chapter_timestamps', data: this._chapterTimestamps });
            this._renderChapterList('left');
            this._renderChapterList('right');
            this._plSetLinearStats(totalPairs - completedPairs.length, 0, completedPairs.length, totalPairs, '章');
            this._pipelineResumeCache = { analysisResults, fusionResults };
            await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
        }

        if (this._pipelinePaused) {
            await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
            return;
        }

        this._pipelineRunning = false;
        const pauseBtn = document.getElementById('pl-pause-btn');
        const stopBtn = document.getElementById('pl-stop-btn');
        if (pauseBtn) pauseBtn.style.display = 'none';
        if (stopBtn) stopBtn.style.display = 'none';
        await DB.del('settings', 'pipeline_state');
        this._savedPipelineState = null;
        this._pipelineResults = { ...this._allPipelineResults };
        this._plConfig.lastSync = Date.now();
        this._plSetLinearStats(0, 0, totalPairs, totalPairs, '章');
        const titleEl = document.getElementById('pl-current-title');
        if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-check-circle mr-1 text-green-400"></i>拆书弹药全部入库';
        const stepLabel = document.getElementById('pl-step-label');
        if (stepLabel) stepLabel.textContent = '全部完成';
        const miniStatus = document.getElementById('pl-mini-status');
        if (miniStatus) miniStatus.textContent = '拆书弹药已就绪';
        this._plLog(`\n🎉 弹药模式完成：${totalPairs}对章节已进入拆书弹药库`, 'ok');
        if (cfg.doExtract) this._plLog('🌍 实体/规则/伏笔弹药已进入: 拆书弹药库', 'ok');
        if (cfg.doRAG) this._plLog('🔍 拆书弹药已存入RAG向量数据库', 'ok');
        UI.toast(`拆书弹药完成: ${totalPairs}对章节`);
    },

    async _runConfiguredPipeline(isResume = false) {
        if (this._generating && !isResume) return UI.toast('正在运行中');
        const apiCheck = await AI.getActiveConfig('text');
        if (!apiCheck) return UI.toast('⚠️ 未配置拆书模型或主控模型，请先在「系统设置」→「模型/API」中添加模型', 'error');
        const leftBook = (this._books || []).find(b => b.id === this.left.bookId);
        const rightBook = (this._books || []).find(b => b.id === this.right.bookId);
        if (!leftBook || !rightBook) return UI.toast('请先选择左右两本书');

        if (!this._primaryBook || !this._primarySettings) {
            this._primaryBook = 'left';
            await this._savePrimarySettings();
            this._plLog(`⚠️ 未设置主书，已自动将《${leftBook.name}》设为主书`, 'info');
        }
        const primaryName = this._primarySettings?.bookName || leftBook.name;
        const secondaryName = this._primaryBook === 'left' ? rightBook.name : leftBook.name;
        const isCreative = this._plConfig.flowMode === 'creative';
        this._plLog(isCreative
            ? `📌 创作融合模式: 《${primaryName}》+《${secondaryName}》→ 细纲/正文进执笔台，实体进世界引擎`
            : `📌 弹药模式: 《${primaryName}》+《${secondaryName}》→ 只沉淀技法弹药到弹药库/RAG`, 'ok');

        const cfg = this._plConfig;
        const maxConcurrency = cfg.maxConcurrency || 1;
        const pairs = [];
        const maxLen = Math.min(cfg.leftChapters.length, cfg.rightChapters.length);
        for (let i = 0; i < maxLen; i++) {
            pairs.push({ leftIdx: cfg.leftChapters[i], rightIdx: cfg.rightChapters[i] });
        }
        if (pairs.length === 0) return UI.toast('没有可配对的章节');

        let completedPairs = [];
        let analysisResults = {};
        let fusionResults = {};
        let accOutlines = '';
        let accEntities = '';
        let allOutlines = '';
        let allWritings = '';

        if (isResume) {
            const saved = this._savedPipelineState || await DB.get('settings', 'pipeline_state');
            if (saved) {
                completedPairs = saved.completedPairs || [];
                analysisResults = saved.analysisResults || {};
                fusionResults = saved.fusionResults || {};
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

        this._pipelineResumeCache = { analysisResults, fusionResults };
        this._linearStats = { pending: pairs.length - completedPairs.length, running: 0, done: completedPairs.length, failed: 0, total: pairs.length, label: '章', startTime: Date.now() };
        this._setPhase(0);

        const serialPayload = { leftBook, rightBook, pairs, cfg, completedPairs, analysisResults, fusionResults, accOutlines, accEntities, allOutlines, allWritings };
        if (isCreative) return await this._runCreativeCyclePipeline(serialPayload);
        return await this._runAmmoCyclePipeline(serialPayload);

        const scheduler = this._agentScheduler;
        scheduler.reset();
        this._pipelineResumeCache = { analysisResults, fusionResults };
        this._updateAgentStats();
        this._setPhase(0);

        const pendingPairs = pairs.filter((p, i) => {
            const pairKey = `${p.leftIdx}_${p.rightIdx}`;
            return !completedPairs.includes(pairKey);
        });
        const startPIdx = pairs.length - pendingPairs.length;

        const infoEl = document.getElementById('pl-pipeline-info');
        if (infoEl) {
            const opts = [];
            if (cfg.doExtract) opts.push(isCreative ? '世界引擎实体' : '弹药实体');
            if (cfg.doOutline) opts.push(isCreative ? '执笔台细纲' : '循环细纲');
            if (cfg.doWrite) opts.push(isCreative ? '执笔台正文' : '正文素材');
            if (cfg.doRAG) opts.push('RAG');
            const doneCount = completedPairs.length;
            infoEl.innerHTML = `左书: 《${leftBook.name}》 | 右书: 《${rightBook.name}》<br>` +
                `已选章节: ${pairs.length} 对${doneCount > 0 ? ' (已完成' + doneCount + '对)' : ''}<br>` +
                `策略: ${cfg.flowMode === 'creative'
                    ? (cfg.cycleMode ? '创作融合：批量拆左N章 → 批量拆右N章 → 每' + (cfg.cycleSize || 5) + '章循环对比融合 → 执笔台细纲/正文' : '创作融合：循环对比后生成原创产物')
                    : (cfg.cycleMode ? '弹药模式：逐章拿弹药 → 每' + (cfg.cycleSize || 5) + '章循环总结 → 弹药库/RAG' : '弹药模式：逐章拿素材')} | 串行执行 | 启用: ${opts.join(' | ') || '只分析'}`;
        }

        this._plLog(`🚀 ${cfg.flowMode === 'creative' ? '创作融合' : '弹药模式'}${isResume ? '恢复' : '启动'}: ${pairs.length} 对章节 | ${cfg.cycleMode ? '逐循环处理' : '逐章处理'} | 待处理${pendingPairs.length}对 | 串行执行`, 'ok');

        // ═══════════════════════════════════════════════════════════════
        // 阶段1：拆书分析
        // ═══════════════════════════════════════════════════════════════
        this._plLog(`\n━━━ 阶段① 拆书分析 ━━━`, 'info');
        this._setPhase(1);
        for (let i = 0; i < pendingPairs.length; i++) {
            const pIdx = startPIdx + i;
            const { leftIdx, rightIdx } = pendingPairs[i];
            const lCh = leftBook.chapters[leftIdx];
            const rCh = rightBook.chapters[rightIdx];

            const leftTaskId = `analyze_left_${pIdx}`;
            const rightTaskId = `analyze_right_${pIdx}`;
            if (!analysisResults[leftTaskId]) scheduler.addTask(leftTaskId, async () => {
                const savedIdx = this.left.chapterIdx;
                const savedAnalysis = this.left.analysis;
                this.left.chapterIdx = leftIdx;
                await this._analyzeSide('left');
                const result = this.left.analysis;
                this.left.chapterIdx = savedIdx;
                this.left.analysis = savedAnalysis;
                this._plLog(`[${pIdx+1}/${pairs.length}] 左书分析完成: ${lCh.title} (${result.length}字)`, 'ok');
                this._updateAgentStats();
                return { result, chapterIdx: leftIdx, title: lCh.title };
            }, 5, 1);
            else this._plLog(`[${pIdx+1}/${pairs.length}] ⏭ 左书分析已缓存: ${lCh.title}`, 'info');

            if (!analysisResults[rightTaskId]) scheduler.addTask(rightTaskId, async () => {
                const savedIdx = this.right.chapterIdx;
                const savedAnalysis = this.right.analysis;
                this.right.chapterIdx = rightIdx;
                await this._analyzeSide('right');
                const result = this.right.analysis;
                this.right.chapterIdx = savedIdx;
                this.right.analysis = savedAnalysis;
                this._plLog(`[${pIdx+1}/${pairs.length}] 右书分析完成: ${rCh.title} (${result.length}字)`, 'ok');
                this._updateAgentStats();
                return { result, chapterIdx: rightIdx, title: rCh.title };
            }, 5, 1);
            else this._plLog(`[${pIdx+1}/${pairs.length}] ⏭ 右书分析已缓存: ${rCh.title}`, 'info');
        }
        scheduler._results = { ...analysisResults, ...scheduler._results };
        const statsInterval1 = setInterval(() => this._updateAgentStats(), 500);
        await scheduler.run(maxConcurrency);
        clearInterval(statsInterval1);
        analysisResults = { ...analysisResults, ...scheduler._results };
        this._pipelineResumeCache = { analysisResults, fusionResults };
        this._updateAgentStats();

        if (this._pipelinePaused) {
            await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // 阶段2：章节融合
        // ═══════════════════════════════════════════════════════════════
        this._plLog(`\n━━━ 阶段② 章节融合 ━━━`, 'info');
        this._setPhase(2);
        scheduler.reset();
        scheduler._results = { ...analysisResults, ...fusionResults };
        for (let i = 0; i < pendingPairs.length; i++) {
            const pIdx = startPIdx + i;
            const { leftIdx, rightIdx } = pendingPairs[i];
            const lCh = leftBook.chapters[leftIdx];
            const rCh = rightBook.chapters[rightIdx];
            const fusionTaskId = `fusion_${pIdx}`;
            if (fusionResults[fusionTaskId]) {
                this._plLog(`[${pIdx+1}/${pairs.length}] ⏭ 融合已缓存: ${lCh.title}`, 'info');
                continue;
            }

            scheduler.addTask(fusionTaskId, async () => {
                const leftRes = scheduler._results[`analyze_left_${pIdx}`];
                const rightRes = scheduler._results[`analyze_right_${pIdx}`];

                const savedLeftIdx = this.left.chapterIdx;
                const savedRightIdx = this.right.chapterIdx;
                const savedLeftAnalysis = this.left.analysis;
                const savedRightAnalysis = this.right.analysis;
                const savedPipelineResults = { ...this._pipelineResults };

                this.left.chapterIdx = leftIdx;
                this.right.chapterIdx = rightIdx;
                this.left.analysis = leftRes?.result || '';
                this.right.analysis = rightRes?.result || '';
                this._pipelineResults = { left: this.left.analysis, right: this.right.analysis, compare: '', fusion: '', world: '', outline: '', write: '' };

                this._plSetStep('left', 'done', (leftRes?.result?.length || 0) + '字');
                this._plSetStep('right', 'done', (rightRes?.result?.length || 0) + '字');
                this._plSetStep('compare', 'active', '对比中...');

                try { await this.compareAnalysis(); }
                catch(e) {
                    if (e.message === '已中止') throw e;
                    this._plLog(`[${pIdx+1}/${pairs.length}] 对比失败: ${e.message}`, 'err');
                }
                const compareRes = this._pipelineResults.compare;
                this._plSetStep('compare', 'done', (compareRes?.length || 0) + '字');
                this._plSetStep('fusion', 'active', '融合中...');

                try { await this.fusionMerge(); }
                catch(e) {
                    if (e.message === '已中止') throw e;
                    this._plLog(`[${pIdx+1}/${pairs.length}] 融合失败: ${e.message}`, 'err');
                }
                const fusionRes = this._pipelineResults.fusion;
                this._plSetStep('fusion', 'done', (fusionRes?.length || 0) + '字');
                this._plLog(`[${pIdx+1}/${pairs.length}] 融合完成: ${lCh.title} (${fusionRes?.length || 0}字)`, 'ok');

                this.left.chapterIdx = savedLeftIdx;
                this.right.chapterIdx = savedRightIdx;
                this.left.analysis = savedLeftAnalysis;
                this.right.analysis = savedRightAnalysis;
                this._pipelineResults = savedPipelineResults;
                this._updateAgentStats();

                return { chapterIdx: pIdx, leftIdx, rightIdx, compare: compareRes, fusion: fusionRes };
            }, 5, 2);
        }
        const statsInterval2 = setInterval(() => this._updateAgentStats(), 500);
        await scheduler.run(maxConcurrency);
        clearInterval(statsInterval2);
        Object.entries(scheduler._results || {}).forEach(([key, val]) => {
            if (key.startsWith('fusion_')) fusionResults[key] = val;
            if (key.startsWith('analyze_')) analysisResults[key] = val;
        });
        scheduler._results = { ...analysisResults, ...fusionResults };
        this._pipelineResumeCache = { analysisResults, fusionResults };
        this._updateAgentStats();

        if (this._pipelinePaused) {
            await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // 阶段3：循环对比融合
        // ═══════════════════════════════════════════════════════════════
        if (cfg.cycleMode && pendingPairs.length > 0) {
            this._plLog(`\n━━━ 阶段③ 循环对比融合 ━━━`, 'info');
            this._setPhase(3);
            for (let i = 0; i < pendingPairs.length; i++) {
                const pIdx = startPIdx + i;
                const { leftIdx, rightIdx } = pendingPairs[i];
                const leftRes = scheduler._results[`analyze_left_${pIdx}`];
                const rightRes = scheduler._results[`analyze_right_${pIdx}`];
                if (leftRes?.result) {
                    await DB.put('settings', { id: `cycle_${leftBook.id}_${leftIdx}`, content: leftRes.result, createdAt: Date.now() });
                }
                if (rightRes?.result) {
                    await DB.put('settings', { id: `cycle_${rightBook.id}_${rightIdx}`, content: rightRes.result, createdAt: Date.now() });
                }
            }

            for (let i = 0; i < pendingPairs.length; i += cfg.cycleSize) {
                if (this._pipelinePaused || !this._pipelineRunning) break;
                const cyclePairs = pendingPairs.slice(i, i + cfg.cycleSize);
                const startCh = cyclePairs[0].leftIdx + 1;
                const endCh = cyclePairs[cyclePairs.length - 1].leftIdx + 1;
                this._plLog(`🔄 循环融合: 第${startCh}-${endCh}章`, 'info');
                await this._cycleFusionSummary(cyclePairs, cyclePairs.length, leftBook, rightBook);
            }
        }

        if (this._pipelinePaused) {
            await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // 阶段4：弹药库 / 创作产物入库
        // ═══════════════════════════════════════════════════════════════
        this._plLog(`\n━━━ 阶段④ ${isCreative ? '创作产物入库' : '弹药沉淀'} ━━━`, 'info');
        this._setPhase(4);

        for (let i = 0; i < pendingPairs.length; i++) {
            if (this._pipelinePaused || !this._pipelineRunning) break;
            const pIdx = startPIdx + i;
            const { leftIdx, rightIdx } = pendingPairs[i];
            const pairKey = `${leftIdx}_${rightIdx}`;
            if (completedPairs.includes(pairKey)) continue;

            const lCh = leftBook.chapters[leftIdx];
            const rCh = rightBook.chapters[rightIdx];
            const fusionRes = scheduler._results[`fusion_${pIdx}`];
            const leftRes = scheduler._results[`analyze_left_${pIdx}`];
            const rightRes = scheduler._results[`analyze_right_${pIdx}`];

            this.left.chapterIdx = leftIdx;
            this.right.chapterIdx = rightIdx;
            this.left.analysis = leftRes?.result || '';
            this.right.analysis = rightRes?.result || '';
            this._pipelineResults = {
                left: this.left.analysis,
                right: this.right.analysis,
                compare: fusionRes?.compare || '',
                fusion: fusionRes?.fusion || '',
                world: '', outline: '', write: ''
            };

            this._plLog(`[${pIdx+1}/${pairs.length}] 🔵 左 '${lCh.title}' vs 右 '${rCh.title}'`, 'info');
            const titleEl = document.getElementById('pl-current-title');
            if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1 text-amber-400"></i>[${pIdx + 1}/${pairs.length}] ${lCh.title} vs ${rCh.title}`;
            const stepLabel = document.getElementById('pl-step-label');
            if (stepLabel) stepLabel.textContent = `${pIdx + 1}/${pairs.length} 处理中`;

            let knowledgeCtx = '';
            try {
                const allEntities = await DB.getAll('entities') || [];
                const stagedEntities = await this._getWorkbenchEntitySnapshots?.() || [];
                const entities = [
                    ...allEntities.filter(e => !String(e.id || '').startsWith('world_')),
                    ...stagedEntities
                ];
                const worlds = allEntities.filter(e => e.id.startsWith('world_') && e.desc);
                if (entities.length) {
                    const grouped = {};
                    entities.forEach(e => { const t = e.type || '其他'; if (!grouped[t]) grouped[t] = []; grouped[t].push(e); });
                    knowledgeCtx += '【知识图谱 - 已有实体】\n';
                    for (const [type, ents] of Object.entries(grouped)) {
                        knowledgeCtx += `[${type}] ` + ents.map(e => {
                            let s = e.name;
                            if (e.desc) s += ': ' + e.desc.slice(0, 80);
                            if (e.relations && e.relations.length) s += ' (' + e.relations.slice(0, 5).join(', ') + ')';
                            return s;
                        }).join(' | ') + '\n';
                    }
                }
                if (worlds.length) {
                    knowledgeCtx += '\n【知识图谱 - 世界观设定】\n';
                    worlds.forEach(w => { knowledgeCtx += `[${w.name}] ${(w.desc || '').slice(0, 200)}\n`; });
                }
            } catch(e) {}

            this._accContext = {
                outlines: accOutlines,
                entities: accEntities,
                knowledgeGraph: knowledgeCtx,
                chapterNum: pIdx + 1
            };

            const stepNums = ['①','②','③'];
            const steps = [];
            if (cfg.doOutline && isCreative) steps.push({ key: 'outline', label: '原创细纲生成', fn: () => this._pipelineSaveOutline() });
            if (cfg.doExtract) steps.push({ key: 'world', label: '实体提取', fn: () => this._pipelineExtractEntities() });
            if (cfg.doWrite && isCreative) steps.push({ key: 'write', label: '执笔台正文生成', fn: () => this._pipelineWriteToWriter() });

            for (let s = 0; s < steps.length; s++) {
                if (this._pipelinePaused || !this._pipelineRunning) break;
                const step = steps[s];
                this._plSetStep(step.key, 'active', step.label + '...');
                try {
                    await step.fn();
                    if (this._pipelinePaused || !this._pipelineRunning) break;
                    const len = (this._pipelineResults[step.key] || '').length;
                    this._plSetStep(step.key, 'done', len > 0 ? len + '字' : '✓');
                    this._plLog(`[${pIdx+1}/${pairs.length}] 🟢 ${stepNums[s]} ${step.label}完成` + (len > 0 ? ` (${len}字)` : ''), 'ok');

                    if (step.key === 'world') {
                        try {
                            const freshEntities = await DB.getAll('entities') || [];
                            const freshStaged = await this._getWorkbenchEntitySnapshots?.() || [];
                            let freshCtx = '';
                            const ents = [
                                ...freshEntities.filter(e => !String(e.id || '').startsWith('world_')),
                                ...freshStaged
                            ];
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
                    if (e.message === '已中止') break;
                    this._plSetStep(step.key, 'error', '失败');
                    this._plLog(`[${pIdx+1}/${pairs.length}] 🔴 ${stepNums[s]} ${step.label}: ${e.message}`, 'err');
                }
            }

            if (this._pipelinePaused) break;

            if (this._pipelineResults.outline) {
                accOutlines += `\n\n### 第${leftIdx+1}章细纲\n${this._pipelineResults.outline.slice(0, 2000)}`;
            }
            if (this._pipelineResults.world) {
                accEntities += `\n\n### 第${leftIdx+1}章实体\n${this._pipelineResults.world.slice(0, 1500)}`;
            }

            const now = Date.now();
            if (!this._chapterTimestamps) this._chapterTimestamps = {};
            this._chapterTimestamps[`${leftBook.id}_left_${leftIdx}`] = now;
            this._chapterTimestamps[`${rightBook.id}_right_${rightIdx}`] = now;
            await DB.put('settings', { id: 'pipeline_chapter_timestamps', data: this._chapterTimestamps });
            this._renderChapterList('left');
            this._renderChapterList('right');

            completedPairs.push(pairKey);

            if (cfg.doRAG) {
                const analysisText = (this._pipelineResults.left || '') + '\n' + (this._pipelineResults.right || '') + '\n' + (this._pipelineResults.compare || '') + '\n' + (this._pipelineResults.fusion || '');
                if (analysisText.trim() && typeof RAGSystem !== 'undefined') {
                    await RAGSystem.addDocument(`拆解汇总_${lCh.title}_vs_${rCh.title}`, analysisText.slice(0, 8000), 'pipeline');
                    this._plLog(`[${pIdx+1}/${pairs.length}] 📦 拆解汇总已存入RAG`, 'entity');
                }
            }

            if (cfg.doOutline && this._pipelineResults.outline) {
                allOutlines += `## 第${leftIdx + 1}章\n\n${this._pipelineResults.outline}\n\n---\n\n`;
            }
            if (cfg.doWrite && this._pipelineResults.write) {
                allWritings += `## 第${leftIdx + 1}章\n\n${this._pipelineResults.write}\n\n---\n\n`;
            }

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

            await DB.put('settings', {
                id: 'pipeline_state',
                completedPairs, accOutlines, accEntities, allOutlines, allWritings,
                analysisResults,
                fusionResults,
                allPipelineResults: this._allPipelineResults,
                config: { leftBookId: this.left.bookId, rightBookId: this.right.bookId, ...cfg },
                pausedAt: Date.now()
            });
        }

        if (!this._pipelinePaused) {
            this._pipelineRunning = false;
            const pauseBtn = document.getElementById('pl-pause-btn');
            const stopBtn = document.getElementById('pl-stop-btn');
            if (pauseBtn) pauseBtn.style.display = 'none';
            if (stopBtn) stopBtn.style.display = 'none';

            await DB.del('settings', 'pipeline_state');
            this._savedPipelineState = null;

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

            this._pipelineResults = { ...this._allPipelineResults };
            this._plConfig.lastSync = Date.now();
            const titleEl = document.getElementById('pl-current-title');
            if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-check-circle mr-1 text-green-400"></i>流水线全部完成';
            const stepLabel = document.getElementById('pl-step-label');
            if (stepLabel) stepLabel.textContent = '全部完成';
            const miniStatus = document.getElementById('pl-mini-status');
            if (miniStatus) miniStatus.textContent = isCreative ? '创作融合已完成' : '拆书弹药已就绪';
            this._plLog(`\n🎉 ${isCreative ? '创作融合' : '弹药模式'}完成！共处理 ${pairs.length} 对章节`, 'ok');
            if (cfg.doOutline && isCreative) this._plLog('📋 原创细纲已进入: 执笔台', 'ok');
            if (cfg.doWrite && isCreative) this._plLog('✍️ 正文已进入: 执笔台', 'ok');
            if (cfg.doExtract) this._plLog(isCreative ? '🌍 实体/规则/伏笔已进入: 世界引擎' : '🌍 实体/规则/伏笔弹药已进入: 拆书弹药库', 'ok');
            if (cfg.doRAG) this._plLog('🔍 拆书弹药已存入RAG向量数据库', 'ok');
            if (this._plConfig._folderHandle || (LocalSync.isElectron() && LocalSync.electronPath)) this._plLog('💾 全部结果已保存到本地文件夹', 'ok');
            UI.toast(`流水线完成: ${pairs.length}对章节`);
        } else {
            await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
        }
    },
});
