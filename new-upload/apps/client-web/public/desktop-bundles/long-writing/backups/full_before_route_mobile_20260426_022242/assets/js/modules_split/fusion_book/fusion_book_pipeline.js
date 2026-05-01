Object.assign(Modules.fusion_book, {
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
                <label class="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 cursor-pointer">
                    <input type="checkbox" class="plc-ch-${side} accent-green-500" data-idx="${i}" checked>
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

    _updateConfigSummary() {
        const leftCount = document.querySelectorAll('.plc-ch-left:checked').length;
        const rightCount = document.querySelectorAll('.plc-ch-right:checked').length;
        const total = Math.min(leftCount, rightCount);
        const el = document.getElementById('plc-summary');
        if (el) el.textContent = `左书 ${leftCount} 章 × 右书 ${rightCount} 章 = 共 ${total} 轮流水线`;
    },

    // ---- 从配置弹窗启动流水线 ----
    async startConfiguredPipeline() {
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
        this._plConfig.maxConcurrency = parseInt(document.getElementById('plc-concurrency')?.value ?? 1);
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

    async _runConfiguredPipeline(isResume = false) {
        if (this._generating && !isResume) return UI.toast('正在运行中');
        const apiCheck = await AI.getActiveConfig('text');
        if (!apiCheck) return UI.toast('⚠️ 未配置API流量池，请先在「系统设置」→「API流量池」中添加API密钥', 'error');
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
        this._plLog(`📌 技法来源: 《${primaryName}》+ 《${secondaryName}》→ 融合细纲（角色/情节全部原创）`, 'ok');

        const cfg = this._plConfig;
        const maxConcurrency = cfg.maxConcurrency || 1;
        const pairs = [];
        const maxLen = Math.min(cfg.leftChapters.length, cfg.rightChapters.length);
        for (let i = 0; i < maxLen; i++) {
            pairs.push({ leftIdx: cfg.leftChapters[i], rightIdx: cfg.rightChapters[i] });
        }
        if (pairs.length === 0) return UI.toast('没有可配对的章节');

        let completedPairs = [];
        let accOutlines = '';
        let accEntities = '';
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

        const scheduler = this._agentScheduler;
        scheduler.reset();
        this._updateAgentStats();
        this._setPhase(0);

        const infoEl = document.getElementById('pl-pipeline-info');
        if (infoEl) {
            const opts = [];
            if (cfg.doExtract) opts.push('知识图谱');
            if (cfg.doOutline) opts.push('细纲');
            if (cfg.doWrite) opts.push('正文');
            if (cfg.doRAG) opts.push('RAG');
            const doneCount = completedPairs.length;
            infoEl.innerHTML = `左书: 《${leftBook.name}》 | 右书: 《${rightBook.name}》<br>` +
                `已选章节: ${pairs.length} 对${doneCount > 0 ? ' (已完成' + doneCount + '对)' : ''}<br>` +
                `Agent并发: ${maxConcurrency} | 启用: ${opts.join(' | ')}`;
        }

        this._plLog(`🚀 流水线${isResume ? '恢复' : '启动'}: ${pairs.length} 对章节 | Agent并发:${maxConcurrency}`, 'ok');

        const pendingPairs = pairs.filter((p, i) => {
            const pairKey = `${p.leftIdx}_${p.rightIdx}`;
            return !completedPairs.includes(pairKey);
        });
        const startPIdx = pairs.length - pendingPairs.length;

        // ═══════════════════════════════════════════════════════════════
        // Phase 1: 并发分析 (Map)
        // ═══════════════════════════════════════════════════════════════
        this._plLog(`\n━━━ Phase ① 并发分析 (Map) ━━━`, 'info');
        this._setPhase(1);
        for (let i = 0; i < pendingPairs.length; i++) {
            const pIdx = startPIdx + i;
            const { leftIdx, rightIdx } = pendingPairs[i];
            const lCh = leftBook.chapters[leftIdx];
            const rCh = rightBook.chapters[rightIdx];

            scheduler.addTask(`analyze_left_${pIdx}`, async () => {
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

            scheduler.addTask(`analyze_right_${pIdx}`, async () => {
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
        }
        const statsInterval1 = setInterval(() => this._updateAgentStats(), 500);
        await scheduler.run(maxConcurrency);
        clearInterval(statsInterval1);
        this._updateAgentStats();

        if (this._pipelinePaused) {
            await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // Phase 2: 章节融合 (Reduce - 半并发)
        // ═══════════════════════════════════════════════════════════════
        this._plLog(`\n━━━ Phase ② 章节融合 (Reduce) ━━━`, 'info');
        this._setPhase(2);
        scheduler.reset();
        for (let i = 0; i < pendingPairs.length; i++) {
            const pIdx = startPIdx + i;
            const { leftIdx, rightIdx } = pendingPairs[i];
            const lCh = leftBook.chapters[leftIdx];
            const rCh = rightBook.chapters[rightIdx];

            scheduler.addTask(`fusion_${pIdx}`, async () => {
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
        this._updateAgentStats();

        if (this._pipelinePaused) {
            await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // Phase 3: 循环总结 (Sequential)
        // ═══════════════════════════════════════════════════════════════
        if (cfg.cycleMode && pendingPairs.length > 0) {
            this._plLog(`\n━━━ Phase ③ 循环总结 (Sequential) ━━━`, 'info');
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
                this._plLog(`🔄 循环总结: 第${startCh}-${endCh}章`, 'info');
                await this._cycleFusionSummary(cyclePairs, cyclePairs.length, leftBook, rightBook);
            }
        }

        if (this._pipelinePaused) {
            await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // Phase 4: 细纲 + 实体 + 正文 (Sequential)
        // ═══════════════════════════════════════════════════════════════
        this._plLog(`\n━━━ Phase ④ 细纲/实体/正文 (Sequential) ━━━`, 'info');
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
                const entities = allEntities.filter(e => !e.id.startsWith('world_'));
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
            if (cfg.doOutline) steps.push({ key: 'outline', label: '细纲生成', fn: () => this._pipelineSaveOutline() });
            if (cfg.doExtract) steps.push({ key: 'world', label: '实体提取', fn: () => this._pipelineExtractEntities() });
            if (cfg.doWrite) steps.push({ key: 'write', label: '正文创作', fn: () => this._pipelineWrite() });

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
            if (miniStatus) miniStatus.textContent = '一键自动拆书链';
            this._plLog(`\n🎉 流水线完成！共处理 ${pairs.length} 对章节`, 'ok');
            if (cfg.doOutline) this._plLog('📋 细纲已同步到: 凤凰创作流 + 长篇执笔(旗舰)', 'ok');
            if (cfg.doWrite) this._plLog('✍️ 正文已同步到: 长篇执笔(旗舰)', 'ok');
            if (cfg.doExtract) this._plLog('🌍 实体已同步到: 世界引擎 + 知识图谱', 'ok');
            if (cfg.doRAG) this._plLog('🔍 全部结果已存入RAG向量数据库', 'ok');
            if (this._plConfig._folderHandle || (LocalSync.isElectron() && LocalSync.electronPath)) this._plLog('💾 全部结果已保存到本地文件夹', 'ok');
            UI.toast(`流水线完成: ${pairs.length}对章节`);
        } else {
            await this._savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg);
        }
    },
});
