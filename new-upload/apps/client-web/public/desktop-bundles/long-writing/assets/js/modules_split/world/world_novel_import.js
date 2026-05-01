Object.assign(Modules.world_engine, {
    _novelImportModalOpen: false,
	    _novelImportText: '',
	    _novelImportParsed: null,
	    _novelImportJobKey: 'world_novel_import_job',
	    _novelImportJobVersion: 'newbook_import_light_v4',
	    _novelImportJob: null,
	    _novelImportPauseRequested: false,

    _openNovelImportModal() {
        const we = Modules.world_engine;
        we._novelImportModalOpen = true;
        we._restoreNovelImportJob();
        if (!we._novelImportJob?.running && !we._novelImportJob?.paused) {
            we._novelImportText = '';
            we._novelImportParsed = null;
        } else if (we._novelImportJob?.sourceText) {
            we._novelImportText = we._novelImportJob.sourceText;
        }
        we._renderNovelImportModal();
    },

	    _restoreNovelImportJob() {
	        try {
	            const raw = localStorage.getItem(this._novelImportJobKey);
	            const job = raw ? JSON.parse(raw) : null;
	            if (job && job.version !== this._novelImportJobVersion) {
	                localStorage.removeItem(this._novelImportJobKey);
	                this._novelImportJob = null;
	                return;
	            }
	            this._novelImportJob = job;
	        } catch(e) {
	            this._novelImportJob = null;
	        }
    },

    _setNovelImportJob(patch = {}) {
        const prev = this._novelImportJob || {};
        let logs = patch.logs || prev.logs || [];
        if (patch.log) {
            logs = [...logs.slice(-20), { time: new Date().toLocaleTimeString(), text: patch.log }];
        }
	        this._novelImportJob = { ...prev, ...patch, logs, updatedAt: Date.now(), version: this._novelImportJobVersion };
	        try { localStorage.setItem(this._novelImportJobKey, JSON.stringify(this._novelImportJob)); } catch(e) {}
	        this._renderNovelImportJobStatusIntoDom();
	    },

    _finishNovelImportJob(status = '完成') {
        this._novelImportPauseRequested = false;
        const total = Math.max(1, this._novelImportJob?.total || 3);
        this._setNovelImportJob({ running: false, paused: false, phase: 'done', current: total, total, status, log: status });
    },

    _pauseNovelImport() {
        const sourceEl = document.getElementById('we-novel-import-source');
        const prevOptions = this._novelImportJob?.options || {};
        const readOpt = (id, key) => {
            const el = document.getElementById(id);
            return el ? el.checked : (prevOptions[key] !== false);
        };
        this._novelImportPauseRequested = true;
        try { AI?.abort?.(); } catch(e) {}
        this._setNovelImportJob({
            running: false,
            paused: true,
            sourceText: sourceEl?.value?.trim() || this._novelImportJob?.sourceText || '',
            options: {
                merge: readOpt('we-novel-import-merge', 'merge'),
                aiOutline: readOpt('we-novel-import-ai-outline', 'aiOutline'),
                extractEntities: readOpt('we-novel-import-extract-entities', 'extractEntities'),
                buildCycles: readOpt('we-novel-import-build-cycles', 'buildCycles')
            },
	            status: '已暂停，进度已保存',
	            log: '用户暂停，可点击继续恢复同步'
	        });
	        UI.toast('导入同步已暂停，进度已保存');
    },

    _resumeNovelImport() {
        const job = this._novelImportJob || {};
        this._novelImportPauseRequested = false;
        const sourceEl = document.getElementById('we-novel-import-source');
        if (sourceEl && !sourceEl.value.trim() && job.sourceText) sourceEl.value = job.sourceText;
        if (!sourceEl?.value?.trim() && !job.sourceText) return UI.toast('没有可恢复的原文，请重新粘贴');
        this._setNovelImportJob({
            running: false,
            paused: false,
	            status: '继续同步中',
            log: '从暂停状态继续'
        });
	        this._startNovelImport({ resume: true, autoApply: true });
	    },

    _checkNovelImportPaused() {
	        if (this._novelImportPauseRequested || this._novelImportJob?.paused) throw new Error('导入同步已暂停');
    },

	    _renderNovelImportJobStatus() {
	        const job = this._novelImportJob;
	        if (!job) return '';
	        if (!job.running && !job.paused && job.phase !== 'error') return '';
	        const total = Math.max(1, job.total || 3);
        const current = Math.max(0, Math.min(total, job.current || 0));
        const pct = Math.round(current / total * 100);
        const logs = (job.logs || []).slice(-5).map(l => `
            <div class="flex gap-2 text-[9px] text-dim">
                <span class="font-mono text-amber-300">${l.time}</span>
                <span>${l.text}</span>
            </div>`).join('');
        const isPaused = !!job.paused && !job.running;
        const color = job.running ? 'text-amber-300' : (isPaused ? 'text-amber-300' : 'text-green-400');
        const icon = job.running ? 'fa-spinner fa-spin' : (isPaused ? 'fa-pause' : 'fa-check');
        const controls = job.running ? `
            <button class="btn btn-xs bg-amber-600/20 text-amber-300 border-amber-600/30" onclick="Modules.world_engine._pauseNovelImport()">
                <i class="fa-solid fa-pause mr-1"></i>暂停
            </button>` : (isPaused ? `
            <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.world_engine._resumeNovelImport()">
                <i class="fa-solid fa-play mr-1"></i>继续
            </button>` : '');
	        return `
	        <div id="we-novel-import-job-status-card" class="px-6 py-3 border-b border-white/5 bg-black/20">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2 min-w-0">
                    <div class="text-[10px] font-bold ${color} truncate">
	                        <i class="fa-solid ${icon} mr-1"></i>${job.status || '同步准备中'}
                    </div>
                    ${controls}
                </div>
                <div class="text-[9px] text-dim font-mono">${pct}% · ${current}/${total}</div>
            </div>
            <div class="h-1.5 rounded bg-white/5 overflow-hidden mb-2">
                <div class="h-full rounded bg-gradient-to-r from-amber-500 to-green-500" style="width:${pct}%"></div>
            </div>
	            <div class="space-y-0.5">${logs || '<div class="text-[9px] text-dim">等待同步</div>'}</div>
	        </div>`;
	    },

	    _renderNovelImportJobStatusIntoDom() {
	        const slot = document.getElementById('we-novel-import-job-status-slot');
	        if (slot) slot.innerHTML = this._renderNovelImportJobStatus();
	        else {
	            const old = document.getElementById('we-novel-import-job-status-card');
	            if (old) old.outerHTML = this._renderNovelImportJobStatus();
	        }
	    },

	    _closeNovelImportModal() {
	        const we = Modules.world_engine;
	        we._novelImportModalOpen = false;
	        const modal = document.getElementById('we-novel-import-modal');
	        if(modal) modal.remove();
	    },

	    _clearNovelImportDraft() {
	        const we = Modules.world_engine;
	        try { AI?.abort?.(); } catch(e) {}
	        try { localStorage.removeItem(we._novelImportJobKey); } catch(e) {}
	        we._novelImportText = '';
	        we._novelImportParsed = null;
	        we._novelImportJob = null;
	        we._novelImportPauseRequested = false;
	        const sourceEl = document.getElementById('we-novel-import-source');
	        if(sourceEl) sourceEl.value = '';
	        const preview = document.getElementById('we-novel-import-preview');
	        if(preview) preview.innerHTML = we._renderNovelImportEmptyState();
	        const stats = document.getElementById('we-novel-import-stats');
	        if(stats) stats.textContent = '待导入';
	        const statusSlot = document.getElementById('we-novel-import-job-status-slot');
	        if(statusSlot) statusSlot.innerHTML = '';
	        UI.toast('已清空本次导入输入和缓存');
	    },

	    async _clearNovelImportedProjectData() {
	        const we = Modules.world_engine;
	        const project = typeof GenesisCore !== 'undefined'
	            ? await GenesisCore.requireActiveProject?.('请先创建或选择项目，再清除导入结果')
	            : null;
	        if(!project?.id) return;
	        const ok = confirm('确定清除本项目通过“导入新书/续写”生成的卷、章、细纲、实体和循环吗？手动创建/非导入内容不会删除。');
	        if(!ok) return;
	        const isProjectRows = rows => (typeof GenesisCore !== 'undefined' && GenesisCore.filterProjectItems)
	            ? GenesisCore.filterProjectItems(rows || [], project.id)
	            : (rows || []).filter(row => row.projectId === project.id);
	        const imported = row => {
	            const id = String(row?.id || '');
	            const source = String(row?.source || '');
	            const sourceType = String(row?.sourceType || '');
	            const workbenchOutlineId = String(row?.workbenchOutlineId || row?.sourceOutlineId || '');
	            return source.startsWith('novel_import') ||
	                sourceType.includes('novel_import') ||
	                id.startsWith(`novel_import_${project.id}`) ||
	                id.startsWith(`novel_import_outline_${project.id}`) ||
	                workbenchOutlineId.startsWith(`novel_import_outline_${project.id}`) ||
	                !!row?.importedChapterId ||
	                !!row?.importedVolumeId ||
	                !!row?.sourceImportId;
	        };
	        try {
	            App.showProgress('清除导入结果', 0, 6);
	            const stores = ['chapters', 'volumes', 'outlines', 'entities', 'cycles'];
	            const vectorIds = new Set();
	            let removed = 0;
	            for(let i = 0; i < stores.length; i++) {
	                const store = stores[i];
	                const rows = isProjectRows(await DB.getAll(store).catch(() => []) || []);
	                const targets = rows.filter(imported);
	                for(const row of targets) {
	                    await DB.del(store, row.id);
	                    removed++;
	                    if(store === 'entities') vectorIds.add(row.id);
	                }
	                App.showProgress('清除导入结果', i + 1, 6);
	            }
	            for(const id of vectorIds) {
	                try { await DB.del('vectors', id); } catch(e) {}
	            }
	            try { await GenesisCore.updateModeData({
	                parsedStructure: null,
	                importedOutlineRaw: '',
	                phoenixOutline: '',
	                importSummary: '',
	                originalText: '',
	                originalStats: null,
	                continuationPoint: null
	            }); } catch(e) {}
	            try {
	                if (typeof LocalSync !== 'undefined') ['volumes', 'chapters', 'outlines', 'entities', 'vectors', 'cycles', 'projects'].forEach(s => LocalSync._scheduleWrite?.(s));
	            } catch(e) {}
	            we._cachedEntities = null;
	            we._cachedCycles = null;
	            we._cachedLayeredGraphs = null;
	            try { await Modules.writer?.loadTree?.(); } catch(e) {}
	            try { await Modules.fusion_workbench?.refresh?.(); } catch(e) {}
	            App.hideProgress();
	            UI.toast(`已清除导入生成内容：${removed}项`, 'success');
	        } catch(e) {
	            App.hideProgress();
	            console.error('[WorldImport] 清除导入结果失败:', e);
	            UI.toast('清除导入结果失败: ' + (e.message || e), 'error');
	        }
	    },

	    _renderNovelImportEmptyState() {
	        return `
	        <div class="space-y-3 text-xs">
	            <div class="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
	                <div class="text-amber-300 font-bold text-[11px] mb-1"><i class="fa-solid fa-list-check mr-1"></i>细纲原样入执笔台</div>
	                <div class="text-[10px] text-dim leading-relaxed">只识别必要的分区、卷、章边界；不在导入阶段做 AI 精读或工作台暂存。</div>
	            </div>
	            <div class="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
	                <div class="text-cyan-300 font-bold text-[11px] mb-1"><i class="fa-solid fa-pen-nib mr-1"></i>正文原样入执笔台</div>
	                <div class="text-[10px] text-dim leading-relaxed">同名章节合并：有正文就写正文，没正文就只保留细纲待写。</div>
	            </div>
	            <div class="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
	                <div class="text-purple-300 font-bold text-[11px] mb-1"><i class="fa-solid fa-fire-flame-curved mr-1"></i>解析交给凤凰流</div>
	                <div class="text-[10px] text-dim leading-relaxed">人物、规则、伏笔、关系不在这里慢慢抽；后续由凤凰流/世界引擎按需要精读。</div>
	            </div>
	            <div class="p-3 rounded-lg bg-black/20 border border-white/5 text-[10px] text-gray-400 leading-relaxed">
	                例如：80章细纲 + 20章正文，会生成80章章节；前20章带正文，后60章只有细纲，后面直接从第21章续写。
	            </div>
	        </div>`;
	    },

	    _renderNovelImportModal() {
        const we = Modules.world_engine;
        let modal = document.getElementById('we-novel-import-modal');
        if(!modal) {
            modal = document.createElement('div');
            modal.id = 'we-novel-import-modal';
            document.body.appendChild(modal);
        }
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm';
        modal.onclick = (e) => { if(e.target === modal) we._closeNovelImportModal(); };

        const hasParsed = we._novelImportParsed && (we._novelImportParsed.volumes?.length || we._novelImportParsed.entities?.length);
        const savedOptions = we._novelImportJob?.options || {};
        const optChecked = (key, fallback = true) => (savedOptions[key] === undefined ? fallback : !!savedOptions[key]) ? 'checked' : '';

        modal.innerHTML = `
	            <div class="bg-[#1a1a2e] rounded-2xl border border-white/10 w-[1040px] max-w-[96vw] max-h-[90vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex center text-white">
                            <i class="fa-solid fa-book text-lg"></i>
                        </div>
                        <div>
	                            <div class="font-bold text-white text-base">导入新书 / 续写补章</div>
	                            <div class="text-[10px] text-dim">只做轻量导入：细纲和正文直接进执笔台；精读解析交给凤凰流/世界引擎。</div>
                        </div>
                    </div>
                    <button class="btn btn-sm bg-white/5 text-dim hover:text-white" onclick="Modules.world_engine._closeNovelImportModal()">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="px-6 py-3 border-b border-white/5 grid grid-cols-3 gap-2 shrink-0">
                    ${[
                        ['1','一句话开书','题材、主角欲望、阻力、代价'],
	                        ['2','细纲入执笔台','原样生成章节细纲'],
	                        ['3','进入执笔','正文 + 章节树 + 待解析上下文']
                    ].map(([n,t,s]) => `
                        <div class="rounded-lg bg-black/20 border border-white/5 px-3 py-2">
                            <div class="text-[9px] text-amber-300 font-mono font-bold">${n}</div>
                            <div class="text-[11px] text-white font-bold mt-0.5">${t}</div>
                            <div class="text-[9px] text-dim mt-0.5 leading-relaxed">${s}</div>
                        </div>
                    `).join('')}
                </div>
	                <div id="we-novel-import-job-status-slot">${we._renderNovelImportJobStatus()}</div>
                <div class="flex-1 flex min-h-0 overflow-hidden">
                    <!-- 左侧面板：输入源 -->
	                    <div class="w-[48%] flex flex-col border-r border-white/5">
                        <div class="px-4 py-3 border-b border-white/5 shrink-0">
	                            <div class="text-[10px] text-amber-400 font-bold uppercase mb-2">放入一句话开书 / 细纲 / 已有正文</div>
                            <div class="flex gap-2">
                                <label class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 flex-1 cursor-pointer text-center">
                                    <i class="fa-solid fa-upload mr-1"></i>选择文件
                                    <input type="file" accept=".txt,.md" class="hidden" onchange="Modules.world_engine._handleNovelImportFile(this)">
                                </label>
	                                <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 flex-1" onclick="Modules.world_engine._pasteNovelFromClipboard()">
	                                    <i class="fa-solid fa-paste mr-1"></i>粘贴内容
	                                </button>
	                                <button class="btn btn-xs bg-red-600/15 text-red-300 border-red-500/25 flex-1" onclick="Modules.world_engine._clearNovelImportDraft()" title="只清除本次输入和导入缓存，不删除执笔台内容">
	                                    <i class="fa-solid fa-broom mr-1"></i>清空输入
	                                </button>
	                                <button class="btn btn-xs bg-rose-600/15 text-rose-300 border-rose-500/25 flex-1" onclick="Modules.world_engine._clearNovelImportedProjectData()" title="清除本项目由导入流程生成的卷章/细纲/实体">
	                                    <i class="fa-solid fa-trash-can mr-1"></i>清除已导入
	                                </button>
	                            </div>
	                        </div>
	                        <div class="flex-1 p-4 min-h-0">
	                            <textarea id="we-novel-import-source" class="w-full h-full bg-black/30 border border-white/5 rounded-lg p-3 text-xs text-gray-300 resize-none font-mono leading-relaxed" placeholder="在此粘贴或导入新书材料...&#10;&#10;推荐结构：&#10;【一句话开书】题材、主角欲望、阻力、代价&#10;&#10;【细纲】&#10;第一卷 标题&#10;第一章 标题&#10;本章目标 / 情节动作 / 伏笔钩子...&#10;&#10;【正文】&#10;第一章 标题&#10;已有正文...&#10;&#10;轻量导入规则：&#10;1. 不做AI解析，不提实体，不建循环&#10;2. 细纲原样进入执笔台章节细纲&#10;3. 正文原样进入执笔台同名章节&#10;4. 后续交给凤凰流/世界引擎精读解析"></textarea>
                        </div>
                        <div class="px-4 py-3 border-t border-white/5 shrink-0 space-y-2">
                            <div class="flex gap-2">
	                                <label class="flex items-center gap-2 text-[10px] text-dim cursor-pointer">
	                                    <input type="checkbox" id="we-novel-import-merge" ${optChecked('merge')} class="accent-amber-500">
	                                    <span>保留已有执笔台内容，只补充/合并本次导入</span>
	                                </label>
	                            </div>
	                            <div class="rounded-md bg-black/20 border border-white/5 px-2 py-1.5 text-[10px] text-gray-400 leading-relaxed">
	                                快速导入不会调用AI：实体、规则、伏笔、关系留给凤凰流后续解析。
	                            </div>
	                            <button class="btn btn-sm bg-gradient-to-r from-amber-600/20 to-orange-600/20 text-amber-300 border border-amber-500/30 w-full font-bold" onclick="Modules.world_engine._startNovelImport({autoApply:true, lightImport:true})">
	                                <i class="fa-solid fa-right-left mr-1"></i>快速导入到对应位置
	                            </button>
	                        </div>
	                    </div>
	                    <!-- 右侧面板：同步规则/最近结果 -->
	                    <div class="w-[52%] flex flex-col">
	                        <div class="px-4 py-3 border-b border-white/5 shrink-0">
	                            <div class="flex items-center justify-between">
	                                <div class="text-[10px] text-green-400 font-bold uppercase">${hasParsed ? '最近同步结果' : '同步规则'}</div>
	                                <div id="we-novel-import-stats" class="text-[9px] text-dim">${hasParsed ? we._novelImportParsed.volumes.length + ' 卷 / ' + we._novelImportParsed.chapters.length + ' 章' : '待导入'}</div>
	                            </div>
	                        </div>
	                        <div class="flex-1 overflow-y-auto p-4" id="we-novel-import-preview">
	                            ${hasParsed ? we._renderNovelImportPreview() : we._renderNovelImportEmptyState()}
	                        </div>
	                    </div>
                </div>
            </div>`;
        const sourceEl = modal.querySelector('#we-novel-import-source');
        if (sourceEl && (we._novelImportText || we._novelImportJob?.sourceText)) {
            sourceEl.value = we._novelImportText || we._novelImportJob.sourceText || '';
        }
    },

    _renderNovelImportPreview() {
        const we = Modules.world_engine;
        const p = we._novelImportParsed;
        if(!p) return '';
        let html = '<div class="space-y-3 text-xs">';
        // 卷/章概览
        if(p.volumes?.length) {
            const outlineReady = (p.chapters || []).filter(c => (c.outline || '').trim()).length;
            const aiCount = (p.chapters || []).filter(c => c.outlineSource === 'ai').length;
            const originalCount = (p.chapters || []).filter(c => c.outlineSource === 'original').length;
            html += `<div class="p-2 rounded bg-amber-500/5 border border-amber-500/10">
                <div class="text-[10px] font-bold text-amber-400 mb-1">执笔台卷章预览 (${p.volumes.length}卷 / ${p.chapters?.length||0}章 / ${outlineReady}份细纲)</div>
                <div class="text-[9px] text-dim mb-1">原文细纲 ${originalCount} 章 · 规则补位 ${Math.max(0, outlineReady - originalCount)} 章${aiCount ? ' · AI生成 ' + aiCount + ' 章' : ''} · 有正文 ${(p.chapters || []).filter(c => we._normalizeImportedBodyContent(c.content || '')).length} 章</div>`;
            p.volumes.forEach(v => {
                const vchaps = p.chapters?.filter(c => c.volumeId === v.id) || [];
                html += `<div class="ml-2 mb-1"><span class="text-white font-bold">${v.title}</span> <span class="text-dim">(${vchaps.length}章)</span></div>`;
                vchaps.slice(0, 3).forEach(c => {
                    html += `<div class="ml-4 text-[10px] text-gray-400 truncate">• ${c.title} <span class="text-dim">(${(c.sections||[]).length || '?'}部分 · ${c.outlineSource || '规则'}细纲)</span></div>`;
                });
                if(vchaps.length > 3) html += `<div class="ml-4 text-[10px] text-dim">...还有${vchaps.length - 3}章</div>`;
            });
            html += '</div>';
        }
        // 世界观
        if(p.worldview && Object.keys(p.worldview).some(k => p.worldview[k])) {
            html += `<div class="p-2 rounded bg-blue-500/5 border border-blue-500/10">
                <div class="text-[10px] font-bold text-blue-400 mb-1">世界规则护栏</div>`;
            const wvLabels = {history:'历史', geography:'地理', magic:'魔法', factions:'势力', species:'种族', rules:'规则', culture:'文化'};
            Object.entries(p.worldview).forEach(([k, v]) => {
                if(v) html += `<div class="ml-2 text-[10px] text-gray-400"><span class="text-blue-300">${wvLabels[k]||k}:</span> ${String(v).slice(0,80)}${String(v).length>80?'...':''}</div>`;
            });
            html += '</div>';
        }
        // 实体
        if(p.entities?.length) {
            const grouped = {};
            p.entities.forEach(e => { grouped[e.type] = (grouped[e.type]||[]).concat(e); });
            html += `<div class="p-2 rounded bg-purple-500/5 border border-purple-500/10">
                <div class="text-[10px] font-bold text-purple-400 mb-1">细纲图谱实体 (${p.entities.length}个)</div>
                <div class="flex flex-wrap gap-1">`;
            Object.entries(grouped).forEach(([type, items]) => {
                html += `<span class="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-gray-300">${type}:${items.length}</span>`;
            });
            html += '</div></div>';
        }
	        if(p.continuationPoint) {
	            const next = p.continuationPoint.nextChapterIndex;
	            html += `<div class="p-2 rounded bg-green-500/5 border border-green-500/10">
	                <div class="text-[10px] font-bold text-green-400 mb-1">续写点</div>
	                <div class="text-[10px] text-gray-400">${next ? `下一章从第 ${next} 章开始写；` : `第 ${p.continuationPoint.chapterIndex} 章之后继续；`}缺正文章节已保留细纲，可在执笔台继续写。</div>
	            </div>`;
	        }
        html += '</div>';
        return html;
    },

    async _handleNovelImportFile(input) {
        const file = input.files[0];
        if(!file) return;
        const text = await file.text();
        const sourceEl = document.getElementById('we-novel-import-source');
        if(sourceEl) sourceEl.value = text;
        UI.toast(`已加载文件: ${file.name} (${text.length.toLocaleString()}字)`);
    },

    async _pasteNovelFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            const sourceEl = document.getElementById('we-novel-import-source');
            if(sourceEl) sourceEl.value = text;
            UI.toast(`已粘贴剪贴板内容 (${text.length.toLocaleString()}字)`);
        } catch(e) { UI.toast('无法访问剪贴板'); }
    },

    async _startNovelImport(opts = {}) {
        const we = Modules.world_engine;
        const sourceEl = document.getElementById('we-novel-import-source');
        const savedJob = we._novelImportJob || {};
        const savedOptions = opts.resume ? (savedJob.options || {}) : {};
        if(sourceEl && !sourceEl.value.trim() && opts.resume && savedJob.sourceText) {
            sourceEl.value = savedJob.sourceText;
        }
        if(!sourceEl || !sourceEl.value.trim()) { UI.toast('请先输入或导入小说内容'); return; }

        const text = sourceEl.value.trim();
	        const readOption = (id, key) => {
	            const el = document.getElementById(id);
	            if (el) return el.checked;
	            return savedOptions[key] !== false;
	        };
	        const lightImport = opts.lightImport !== false;
	        const merge = readOption('we-novel-import-merge', 'merge');
	        const aiOutline = lightImport ? false : readOption('we-novel-import-ai-outline', 'aiOutline');
	        const extractEntities = lightImport ? false : readOption('we-novel-import-extract-entities', 'extractEntities');
	        const buildCycles = lightImport ? false : readOption('we-novel-import-build-cycles', 'buildCycles');
	        const buildRuleOutline = !lightImport;
	        const splitSections = !lightImport;
	        const options = { merge, aiOutline, extractEntities, buildCycles, lightImport, buildRuleOutline, splitSections };
        we._novelImportPauseRequested = false;
        we._novelImportText = text;
        if (!opts.resume) we._novelImportParsed = null;

        // 超长文本分块保护
        const MAX_CHARS_PER_CHUNK = 8000;
        let chunks = [];
        if(text.length <= MAX_CHARS_PER_CHUNK * 1.5) {
            chunks = [text];
        } else {
            // 按段落分块，尽量保持章节完整
            const paras = text.split(/\n{2,}/);
            let cur = '';
            for(const p of paras) {
                if(cur.length + p.length > MAX_CHARS_PER_CHUNK && cur.length > 1000) {
                    chunks.push(cur);
                    cur = p;
                } else {
                    cur += '\n\n' + p;
                }
            }
            if(cur) chunks.push(cur);
        }

	        we._setNovelImportJob({
	            running: true,
	            paused: false,
	            phase: 'parse',
		            status: lightImport ? '正在快速导入准备' : `正在同步准备 · ${chunks.length} 个文本块`,
	            current: 0,
	            total: 3,
	            sourceText: text,
	            options,
	            logs: [],
	            log: `${opts.resume ? '继续同步' : '开始同步'}：${text.length.toLocaleString()}字`
	        });
	        UI.toast(`开始同步开书材料，共 ${chunks.length} 个文本块...`);
	        App.showProgress('识别卷章与细纲', 0, chunks.length);

        try {
            // Step 1: 解析结构（用第一个chunk估计整体结构，如果有多个chunk则综合）
            we._checkNovelImportPaused();
	            we._setNovelImportJob({ phase: 'structure', status: '正在识别卷章结构', current: 1, total: 3, log: '识别卷/章/细纲/正文边界' });
	            const structure = await we._parseNovelStructure(text, chunks, { allowAI: !lightImport });
	            structure.chapters = we._mergeImportedDuplicateChapters(structure.chapters || []);
	            we._checkNovelImportPaused();
            App.showProgress(lightImport ? '整理导入位置' : '生成章内细纲', 1, Math.max(3, (structure.chapters || []).length + 2));
		            we._setNovelImportJob({
		                phase: 'outline',
		                status: lightImport ? `正在整理导入位置 · ${structure.chapters?.length || 0}章` : `正在整理章内细纲 · ${structure.chapters?.length || 0}章`,
		                current: 2,
		                total: 3,
		                log: lightImport ? '不调用AI，只把细纲/正文放到对应位置' : '细纲入世界准备，正文保留给执笔台'
		            });
	            const outlinedChapters = await we._prepareImportedChapterOutlines(structure.chapters || [], { aiOutline, buildRuleOutline, splitSections, preserveOutline: lightImport });
            we._checkNovelImportPaused();
	            let parsedChapters = outlinedChapters.map(c => ({
	                ...c,
		                outline: c.outline || (buildRuleOutline ? we._buildImportedChapterOutline(c) : ''),
		                sections: c.sections || (splitSections ? we._splitChapterIntoSections(c.content || '', c.title || '') : []),
	                outlineSource: c.outlineSource || 'rules',
	                outlineLevel: 'chapter_parts',
                status: c.content && c.content.trim() ? 'done' : 'outline',
	                source: 'import',
	                importedAt: Date.now()
	            }));
	            parsedChapters = we._mergeImportedDuplicateChapters(parsedChapters);
	            structure.chapters = parsedChapters;
            if (structure.chapters.length && (!structure.volumes || !structure.volumes.length)) {
                const volId = Utils.uuid();
                structure.volumes = [{ id: volId, title: '导入作品', order: 1 }];
                structure.chapters.forEach(c => { c.volumeId = c.volumeId || volId; });
            }
	            App.showProgress('识别卷章与细纲', 2, 3);

            // Step 2: 提取世界观与实体
            let entities = [], worldview = {};
            if(extractEntities) {
                we._checkNovelImportPaused();
		                we._setNovelImportJob({ phase: 'entities', status: '正在从细纲提取实体', current: 2, total: 3, log: '优先按章内细纲提取人物、规则、伏笔、关系' });
	                const extracted = await we._parseNovelEntities(text, structure.chapters, structure.bookBrief || '');
                we._checkNovelImportPaused();
                entities = extracted.entities || [];
                worldview = extracted.worldview || {};
                App.showProgress('实体入图谱准备', 2, 3);
            }

	            // Step 3: 组装结果
	            we._checkNovelImportPaused();
	            const continuationPoint = we._getNovelImportContinuationPoint(structure.chapters || []);
	            we._novelImportParsed = {
	                volumes: structure.volumes || [],
	                chapters: structure.chapters || [],
	                entities,
	                worldview,
	                bookBrief: structure.bookBrief || '',
	                continuationPoint,
	                sourceText: text.slice(0, 500) + '...',
	                importedAt: Date.now()
	            };

	            if (opts.autoApply) {
	                we._setNovelImportJob({
	                    phase: 'parsed',
		                    status: `整理完成，正在写入 · ${structure.volumes?.length || 0}卷 / ${structure.chapters?.length || 0}章`,
	                    current: 3,
	                    total: 3,
		                    log: lightImport ? '导入位置已整理，开始直接写入执笔台' : '细纲、正文、实体已整理，开始同步到执笔台/世界引擎'
	                });
		                await we._applyNovelImportToWriterAndWorld(we._novelImportParsed, { buildCycles, merge, buildRuleOutline, lightImport });
	                return;
	            }

	            we._renderNovelImportModal();
	            we._finishNovelImportJob(`同步预览完成：${structure.volumes?.length || 0}卷 / ${structure.chapters?.length || 0}章 / ${entities.length}实体`);
	            UI.toast(`同步预览完成: ${structure.volumes?.length||0}卷 / ${structure.chapters?.length||0}章 / ${entities.length}图谱实体`, 'success');
        } catch(e) {
            if (we._novelImportPauseRequested || /暂停|中止|abort|aborted/i.test(String(e?.message || e))) {
                we._setNovelImportJob({
                    running: false,
                    paused: true,
                    phase: we._novelImportJob?.phase || 'paused',
                    status: '已暂停，进度已保存',
                    sourceText: text,
                    options,
	                    log: '同步流水线已暂停，关闭窗口后可继续'
                });
	                UI.toast('导入同步已暂停，进度已保存');
                return;
            }
            console.error('小说导入解析失败:', e);
            we._setNovelImportJob({ running: false, phase: 'error', status: '解析失败', log: e.message || '未知错误' });
            UI.toast('解析失败: ' + e.message, 'error');
        } finally {
            App.hideProgress();
        }
    },

	    _buildImportedChapterOutline(chapter) {
        const content = this._normalizeImportedBodyContent(chapter?.content || '').replace(/\s+/g, ' ').trim();
        const title = chapter?.title || `第${chapter?.order || '?'}章`;
        const sections = chapter?.sections?.length ? chapter.sections : this._splitChapterIntoSections(chapter?.content || '', title);
        if (!content) return [
            `【已导入章节】${title}`,
            `**本章目标：** 待从原文补齐`,
            `**阻力与代价：** 待从原文补齐`,
	            `**情节动作：** 本章暂无正文，细纲已进入执笔台待补写`,
            `**人物变化：** 待提取`,
            `**世界规则：** 待提取`,
            `**伏笔钩子：** 待提取`,
            `**实体线索：** 待提取人物、地点、势力、物品、能力、规则、关系`,
            `**上下文记忆：** 后续续写前必须回看本章`,
            `**一致性风险：** 不要跳过原文事实，不要重写已有正文`
        ].join('\n');
        const head = content.slice(0, 180);
        const tail = content.length > 260 ? content.slice(-120) : '';
        const outline = [
            `【已导入章节】${title}`,
	            `**本章目标：** 从已导入正文拆解，原文正文已进入执笔台`,
            `**阻力与代价：** 依据原文冲突补齐，续写时不得临时加无代价能力`,
            `**情节动作：** ${head}${content.length > 180 ? '...' : ''}`,
            `**人物变化：** 从本章行动和选择中提取，不凭空改人设`,
            `**世界规则：** 从本章明确出现的规则、限制、禁忌、代价中提取`,
            `**伏笔钩子：** ${tail ? tail : '检查本章末尾是否有未完成动作、信息差或待回收伏笔'}`,
            `**实体线索：** 提取人物、地点、势力、物品、能力、规则、关系`,
            `**上下文记忆：** 本章事实、承诺、误会、伤口、限制必须进入续写上下文`,
            `**一致性风险：** 已有正文默认不重写；后续续写必须承接本章人物状态、世界规则和未回收伏笔`
        ].filter(Boolean).join('\n');
	        return outline + '\n\n' + this._formatSectionOutline(sections);
	    },

	    _getNovelImportContinuationPoint(chapters = []) {
	        const sorted = [...(chapters || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
	        const firstMissing = sorted.find(c => !this._normalizeImportedBodyContent(c.content || ''));
	        if (firstMissing) {
	            const prev = sorted.filter(c => (c.order || 0) < (firstMissing.order || 0) && this._normalizeImportedBodyContent(c.content || '')).pop();
	            return { chapterIndex: prev?.order || Math.max(0, (firstMissing.order || 1) - 1), position: 'end', nextChapterIndex: firstMissing.order || 1 };
	        }
	        const last = sorted[sorted.length - 1];
	        return { chapterIndex: last?.order || sorted.length || 0, position: 'end' };
	    },

	    async _prepareImportedChapterOutlines(chapters, opts = {}) {
	        const we = Modules.world_engine;
	        const out = [];
        const aiEnabled = opts.aiOutline !== false;
        const buildRuleOutline = opts.buildRuleOutline !== false;
        const splitSections = opts.splitSections !== false;
        const preserveOutline = opts.preserveOutline === true;
        const total = chapters.length || 1;
	        for (let i = 0; i < chapters.length; i++) {
	            we._checkNovelImportPaused();
	            const c = { ...chapters[i] };
	            c.content = we._normalizeImportedBodyContent(c.content || '');
	            if (!c.outline && we._looksLikeImportedOutlineText(c.content || '')) {
	                c.outline = we._normalizeOutlineText(c.content || '');
	                c.content = '';
	                c.outlineSource = 'original';
	            }
		            const embedded = we._extractEmbeddedChapterOutline(c.content || '');
	            if (embedded?.outline) {
	                c.outline = embedded.outline;
	                if (typeof embedded.body === 'string') c.content = we._normalizeImportedBodyContent(embedded.body);
	                c.sections = embedded.sections?.length ? embedded.sections : we._outlineToSections(embedded.outline, c.content || '');
	                c.outlineSource = 'original';
            } else {
                c.sections = splitSections ? we._splitChapterIntoSections(c.content || '', c.title || `第${i + 1}章`) : (c.sections || []);
		                if (c.outline && c.outline.trim()) {
		                    c.outlineSource = c.outlineSource || 'parsed';
		                    c.sections = c.sections.length ? c.sections : (splitSections ? we._outlineToSections(c.outline, c.content || '') : []);
		                    c.outline = preserveOutline ? we._normalizeOutlineText(c.outline) : we._normalizeImportedOutline(c, c.outline);
	                } else if (aiEnabled && (c.content || '').trim().length > 300 && typeof AI !== 'undefined' && AI.generate) {
                    try {
                        const ai = await we._aiGenerateImportedChapterOutline(c);
                        we._checkNovelImportPaused();
                        if (ai?.outline) {
                            c.outline = ai.outline;
                            c.sections = ai.sections?.length ? ai.sections : c.sections;
                            c.outlineSource = 'ai';
                        }
                    } catch(e) {
                        if (we._novelImportPauseRequested || /暂停|中止|abort|aborted/i.test(String(e?.message || e))) throw e;
                        console.warn('[WorldImport] AI章内细纲失败，使用规则兜底:', c.title, e);
                    }
                }
                if (!c.outline && buildRuleOutline) {
	                    c.outlineSource = c.outlineSource || 'rules';
	                    c.outline = we._buildImportedChapterOutline(c);
	                }
            }
	            c.sections = (c.sections || []).map((s, idx) => ({
                id: s.id || `${c.id || 'chapter'}_part_${idx + 1}`,
                order: s.order || idx + 1,
                title: s.title || `第${idx + 1}部分`,
                summary: s.summary || '',
                function: s.function || s.role || '',
                entities: s.entities || [],
                hook: s.hook || '',
                source: c.outlineSource || 'rules'
            }));
            out.push(c);
            App.showProgress('生成章内细纲', Math.min(i + 2, total + 1), total + 2);
            we._checkNovelImportPaused();
	        }
	        return out;
	    },

		    _mergeImportedDuplicateChapters(chapters = []) {
		        const normalize = title => this._cleanNovelImportHeading(title)
		            .replace(/[《》「」『』"'“”‘’\s]/g, '')
		            .replace(/[：:，、；;。.!！?？\-]/g, '')
		            .toLowerCase();
		        const hasBody = c => this._normalizeImportedBodyContent(c?.content || '').length > 0;
		        const hasOutline = c => String(c?.outline || '').trim().length > 0;
		        const bodyLooksOutline = c => this._looksLikeImportedOutlineText(c?.content || '');
		        const merged = [];
		        const byTitle = new Map();
		        const byOrder = new Map();
		        const byLooseOrder = new Map();
		        const rememberOrder = (chapter, scopedKey, looseKey) => {
		            if (scopedKey && !byOrder.has(scopedKey)) byOrder.set(scopedKey, chapter);
		            if (looseKey) {
		                const rows = byLooseOrder.get(looseKey) || [];
		                if (!rows.includes(chapter)) rows.push(chapter);
		                byLooseOrder.set(looseKey, rows);
		            }
		        };
		        for (const chapter of chapters || []) {
		            chapter.content = this._normalizeImportedBodyContent(chapter.content || '');
		            if (!hasOutline(chapter) && bodyLooksOutline(chapter)) {
		                chapter.outline = this._normalizeOutlineText(chapter.content || '');
		                chapter.content = '';
		                chapter.outlineSource = chapter.outlineSource || 'original';
		            }
		            const key = normalize(chapter.title || '');
		            const scopedOrderKey = chapter.order ? `order:${chapter.volumeId || ''}:${chapter.order}` : '';
		            const looseOrderKey = chapter.order ? `order:${chapter.order}` : '';
		            if (!key) {
		                merged.push(chapter);
		                rememberOrder(chapter, scopedOrderKey, looseOrderKey);
		                continue;
		            }
		            const looseMatches = looseOrderKey ? (byLooseOrder.get(looseOrderKey) || []) : [];
		            const existing = byTitle.get(key)
		                || (scopedOrderKey ? byOrder.get(scopedOrderKey) : null)
		                || (!chapter.volumeId && looseMatches.length === 1 ? looseMatches[0] : null);
		            if (!existing) {
		                byTitle.set(key, chapter);
		                rememberOrder(chapter, scopedOrderKey, looseOrderKey);
		                merged.push(chapter);
		                continue;
		            }
		            if (!hasBody(existing) && hasBody(chapter)) existing.content = chapter.content;
		            else if (bodyLooksOutline(existing) && hasBody(chapter) && !bodyLooksOutline(chapter)) existing.content = chapter.content;
		            if (!hasOutline(existing) && hasOutline(chapter)) {
		                existing.outline = chapter.outline;
		                existing.outlineSource = chapter.outlineSource || existing.outlineSource;
		            }
		            if ((!existing.sections || !existing.sections.length) && chapter.sections?.length) existing.sections = chapter.sections;
		            if (!existing.volumeId && chapter.volumeId) existing.volumeId = chapter.volumeId;
		            if (key && !byTitle.has(key)) byTitle.set(key, existing);
		            existing.mergedImportIds = [...new Set([...(existing.mergedImportIds || []), existing.id, chapter.id].filter(Boolean))];
	            existing.status = existing.content ? 'done' : 'outline';
	        }
	        return merged.map((chapter, idx) => ({ ...chapter, order: idx + 1 }));
	    },

	    _extractEmbeddedChapterOutline(content) {
	        const text = String(content || '');
	        if (!text.trim()) return null;
	        const markerRe = /(?:【(?:本章)?细纲】|【大纲】|##+\s*(?:本章)?细纲|(?:本章)?细纲[:：])([\s\S]*?)(?:【正文】|##+\s*正文|正文[:：]|$)/i;
	        const bodyMarkerRe = /(?:【正文】|##+\s*正文|正文[:：])([\s\S]*)$/i;
	        const marked = text.match(markerRe);
	        let outline = marked ? marked[1].trim() : '';
	        let body = '';
	        const bodyMarked = text.match(bodyMarkerRe);
	        if (bodyMarked) body = bodyMarked[1].trim();
	        if (!outline) {
	            const first = text.slice(0, 2600);
	            const hasOutlineFields = /本章目标|阻力与代价|情节动作|人物变化|世界规则|伏笔钩子|实体线索|上下文记忆|一致性风险|核心事件|叙事功能|情节流|卷目标|卷规则|卷伏笔|前情提要|场次|分段|第[一二三四五六七八九十\d]+部分/.test(first);
	            if (hasOutlineFields) {
	                const stop = first.search(/\n\s*(?:【正文】|正文[:：]|第一段正文|原文[:：])/);
	                outline = (stop > 0 ? first.slice(0, stop) : first).trim();
	                if (stop > 0) body = text.slice(stop).replace(/^\s*(?:【正文】|正文[:：]|第一段正文|原文[:：])\s*/i, '').trim();
	            }
	        }
	        if (!outline || outline.length < 40) return null;
	        return { outline: this._normalizeOutlineText(outline), sections: this._outlineToSections(outline, body || ''), body };
	    },

    _normalizeOutlineText(outline) {
        return String(outline || '').trim()
            .replace(/^```(?:markdown|md)?\s*/i, '')
            .replace(/```$/i, '')
            .trim();
    },

    _normalizeImportedOutline(chapter, outline) {
        const base = this._normalizeOutlineText(outline);
        const hasFixedFields = /本章目标|阻力与代价|情节动作|实体线索|上下文记忆/.test(base);
        if (hasFixedFields) return base;
        const sections = chapter.sections?.length ? chapter.sections : this._splitChapterIntoSections(chapter.content || '', chapter.title || '');
        return [
            `【已导入章节】${chapter.title || ''}`,
            `**本章目标：** ${base.slice(0, 160)}`,
            `**阻力与代价：** 依据原细纲和正文冲突补齐`,
            `**情节动作：** 参考原文正文推进，不重写已导入正文`,
            `**人物变化：** 从原细纲和正文行为中提取`,
            `**世界规则：** 从原细纲和正文明确设定中提取`,
            `**伏笔钩子：** 从原细纲和章末内容提取`,
            `**实体线索：** 人物、地点、势力、物品、能力、规则、关系`,
            `**上下文记忆：** 原文事实、承诺、误会、限制必须保留`,
            `**一致性风险：** 不要覆盖原文正文，不要跳过原文事实`,
            '',
            `【原文细纲】`,
            base,
            '',
            this._formatSectionOutline(sections)
        ].join('\n');
    },

    _splitChapterIntoSections(content, title = '') {
        const raw = String(content || '').trim();
        if (!raw) return [];
        let chunks = raw
            .split(/\n\s*(?:[-*_]{3,}|【(?:场景|分段|部分)\s*\d+[^】]*】|#{3,}\s+.+)\s*\n/g)
            .map(x => x.trim())
            .filter(x => x.length > 40);
        if (chunks.length <= 1) {
            const paras = raw.split(/\n{2,}/).map(x => x.trim()).filter(x => x.length > 30);
            const target = Math.min(6, Math.max(3, Math.ceil(raw.length / 1800)));
            if (paras.length >= target) {
                chunks = [];
                let cur = '';
                const groupSize = Math.ceil(paras.length / target);
                paras.forEach((p, idx) => {
                    cur += (cur ? '\n\n' : '') + p;
                    if ((idx + 1) % groupSize === 0 || idx === paras.length - 1) {
                        chunks.push(cur.trim());
                        cur = '';
                    }
                });
            } else {
                chunks = [];
                const targetByLen = Math.min(6, Math.max(2, Math.ceil(raw.length / 2200)));
                const size = Math.ceil(raw.length / targetByLen);
                for (let i = 0; i < raw.length; i += size) chunks.push(raw.slice(i, i + size).trim());
            }
        }
        return chunks.filter(Boolean).slice(0, 8).map((chunk, idx) => {
            const firstSentence = (chunk.match(/[^。！？!?；;]+[。！？!?；;]?/) || [chunk.slice(0, 120)])[0].trim();
            const tailSentence = (chunk.match(/[^。！？!?；;]+[。！？!?；;]?\s*$/) || [''])[0].trim();
            return {
                order: idx + 1,
                title: `${title ? title + ' · ' : ''}第${idx + 1}部分`,
                summary: firstSentence.slice(0, 160),
                function: idx === 0 ? '开场/承接' : idx === chunks.length - 1 ? '收束/钩子' : '推进/转折',
                hook: tailSentence.slice(0, 120),
                wordCount: chunk.length
            };
        });
    },

	    _formatSectionOutline(sections = []) {
	        if (!sections.length) return '【章内分部分细纲】\n- 暂无分段，等待补齐';
	        return ['【章内分部分细纲】'].concat(sections.map(s => [
            `#### 第${s.order}部分：${s.title || '未命名'}`,
            `- 情节功能：${s.function || '推进'}`,
            `- 核心动作：${s.summary || '待补'}`,
            `- 伏笔/钩子：${s.hook || '待补'}`,
            `- 实体线索：${(s.entities || []).join('、') || '从本部分正文提取'}`
	        ].join('\n'))).join('\n\n');
	    },

	    _cleanNovelImportHeading(line = '') {
	        return String(line || '')
	            .replace(/^\s{0,3}#{1,6}\s*/, '')
	            .replace(/\*\*/g, '')
	            .replace(/^\s*[-*+]\s*/, '')
	            .replace(/^\s*>\s*/, '')
	            .trim();
	    },

	    _detectNovelImportZone(line = '') {
	        const raw = this._cleanNovelImportHeading(line);
	        if (/^【\s*(?:一句话开书|开书一句话|故事种子|开书种子)\s*】/.test(raw)) return 'brief';
	        if (/^【\s*(?:细纲|大纲|层级大纲|创作大纲|章纲|章节细纲|分章细纲|本书细纲|故事细纲|卷章细纲)\s*】/.test(raw)) return 'outline';
	        if (/^【\s*(?:正文|原文|已有正文|正文内容|原稿正文|章节正文)\s*】/.test(raw)) return 'body';
	        const text = raw
	            .replace(/^【\s*/, '')
	            .replace(/\s*】/, '')
	            .replace(/^\[\s*/, '')
	            .replace(/\s*\]/, '')
	            .trim();
	        if (/^(?:一句话开书|开书一句话|故事种子|开书种子)(?:[：:\s]|$)/.test(text)) return 'brief';
	        if (/^(?:细纲|大纲|层级大纲|创作大纲|章纲|章节细纲|分章细纲|本书细纲|故事细纲|卷章细纲)(?:[：:\s]|$)/.test(text)) return 'outline';
	        if (/^(?:正文|原文|已有正文|正文内容|原稿正文|章节正文)(?:[：:\s]|$)/.test(text)) return 'body';
	        return null;
	    },

	    _extractNovelImportZonePayload(line = '', zone = '') {
	        const text = this._cleanNovelImportHeading(line)
	            .replace(/^【\s*/, '')
	            .replace(/\s*】/, '')
	            .replace(/^\[\s*/, '')
	            .replace(/\s*\]/, '')
	            .trim();
	        const patterns = {
	            brief: /^(?:一句话开书|开书一句话|故事种子|开书种子)\s*[：:\s]*/,
	            outline: /^(?:细纲|大纲|层级大纲|创作大纲|章纲|章节细纲|分章细纲|本书细纲|故事细纲|卷章细纲)\s*[：:\s]*/,
	            body: /^(?:正文|原文|已有正文|正文内容|原稿正文|章节正文)\s*[：:\s]*/
	        };
	        const re = patterns[zone];
	        return re ? text.replace(re, '').trim() : '';
	    },

	    _parseNovelImportOrdinal(raw, fallback = 1) {
	        const text = String(raw || '').trim();
	        if (/^\d+$/.test(text)) return parseInt(text, 10);
	        const digits = { 零:0, 〇:0, 一:1, 二:2, 两:2, 三:3, 四:4, 五:5, 六:6, 七:7, 八:8, 九:9 };
	        if (!/[十百千]/.test(text)) {
	            const direct = text.split('').reduce((n, ch) => n * 10 + (digits[ch] ?? 0), 0);
	            return direct || fallback;
	        }
	        let total = 0;
	        let section = 0;
	        let number = 0;
	        for (const ch of text) {
	            if (digits[ch] != null) {
	                number = digits[ch];
	            } else if (ch === '十') {
	                section += (number || 1) * 10;
	                number = 0;
	            } else if (ch === '百') {
	                section += (number || 1) * 100;
	                number = 0;
	            } else if (ch === '千') {
	                section += (number || 1) * 1000;
	                number = 0;
	            }
	        }
	        total = section + number;
	        return total || fallback;
	    },

	    _parseNovelImportChapterOrder(title = '', fallback = 1) {
	        const text = this._cleanNovelImportHeading(title);
	        const cn = text.match(/第\s*([一二三四五六七八九十百千零〇两\d]+)\s*[章回节]/);
	        if (cn) return this._parseNovelImportOrdinal(cn[1], fallback);
	        const en = text.match(/Chapter\s+(\d+)/i);
	        return en ? parseInt(en[1], 10) : fallback;
	    },

	    _parseNovelImportVolumeOrder(title = '', fallback = 1) {
	        const text = this._cleanNovelImportHeading(title);
	        const cn = text.match(/第\s*([一二三四五六七八九十百千零〇两\d]+)\s*[卷部篇]/);
	        if (cn) return this._parseNovelImportOrdinal(cn[1], fallback);
	        const en = text.match(/Volume\s+(\d+)/i);
	        return en ? parseInt(en[1], 10) : fallback;
	    },

	    _looksLikeImportedOutlineText(text = '') {
	        const sample = String(text || '').slice(0, 3000);
	        if (!sample.trim()) return false;
	        const hits = [
	            /本章目标/, /阻力与代价/, /情节动作/, /人物变化/, /世界规则/,
	            /伏笔钩子/, /实体线索/, /上下文记忆/, /一致性风险/,
	            /章内分部分细纲/, /核心事件/, /叙事功能/, /情节流/, /读者期待/,
	            /第[一二三四五六七八九十\d]+(?:部分|场|段)/
	        ].filter(re => re.test(sample)).length;
	        return hits >= 2 || /【(?:本章)?细纲】|【大纲】/.test(sample);
	    },

	    _normalizeImportedBodyContent(content = '') {
	        const text = String(content || '').trim();
	        if(!text) return '';
	        const compact = text
	            .replace(/\s+/g, '')
	            .replace(/[。.!！…．·]+$/g, '');
	        if(/^(?:无正文内容|暂无正文|正文暂无|暂无原文|待写|待补写|待续写|未生成正文|AI正在努力创作中请稍候|AI生成中请稍候)$/i.test(compact)) return '';
	        if(/^AI正在努力创作中/i.test(compact) && compact.length <= 40) return '';
	        return text;
	    },

	    _isNovelImportGenericChapterHeading(title = '') {
	        const text = this._cleanNovelImportHeading(title);
	        if(!text) return false;
	        if(this._isNovelImportVolumeHeading(text) || this._isNovelImportChapterHeading(text)) return false;
	        if(/^(?:前言|创作核心理念|项目标题|最后修改|创世蓝图|层级大纲|正文内容|前情提要)(?:[：:\s]|$)/i.test(text)) return false;
	        if(/^第\s*[一二三四五六七八九十百千零〇两\d]+\s*步(?:[：:\s]|$)/.test(text)) return false;
	        if(/^\d+\s*[.、．]\s*/.test(text)) return false;
	        if(/^【?第\s*[一二三四五六七八九十百千零〇两\d]+\s*卷\s*(?:完|完结|结束|END)\s*】?$/i.test(text)) return false;
	        if(/^(?:情绪节奏应用解析|开篇模式选择|开篇情景简述)(?:[：:\s]|$)/.test(text)) return false;
	        return true;
	    },

	    _isNovelImportVolumeHeading(line = '') {
	        const text = this._cleanNovelImportHeading(line);
	        if(/^【?第\s*[一二三四五六七八九十百千零〇两\d]+\s*卷\s*(?:完|完结|结束|END)\s*】?$/i.test(text)) return false;
	        if(/^[（(]\s*第\s*[一二三四五六七八九十百千零〇两\d]+\s*卷\s*(?:完|完结|结束|END)\s*[）)]$/i.test(text)) return false;
	        return /^(?:[（(]?\s*第\s*[一二三四五六七八九十百千零〇两\d]+\s*[卷部篇]\s*[）)]?|Volume\s+\d+)(?:[：:\s]|$)/i.test(text);
	    },

	    _isNovelImportChapterHeading(line = '') {
	        const text = this._cleanNovelImportHeading(line);
	        if (this._isNovelImportVolumeHeading(text)) return false;
	        return /^(?:第\s*[一二三四五六七八九十百千零〇两\d]+\s*[章回节]|Chapter\s+\d+)(?:[：:\s]|$)/i.test(text);
	    },

	    _outlineToSections(outline, content = '') {
        const text = String(outline || '');
        const blocks = text.split(/\n(?=(?:#{3,4}\s+第|第[一二三四五六七八九十\d]+(?:部分|场|段)|【(?:场次|分段|部分)))/).map(x => x.trim()).filter(x => x.length > 30);
        if (blocks.length > 1) {
            return blocks.slice(0, 8).map((b, idx) => ({
                order: idx + 1,
                title: (b.split('\n')[0] || `第${idx + 1}部分`).replace(/^#+\s*/, '').slice(0, 40),
                summary: b.slice(0, 180),
                function: /收束|钩子|章末/.test(b) ? '收束/钩子' : idx === 0 ? '开场/承接' : '推进/转折',
                hook: ((b.match(/(?:钩子|伏笔)[:：]?\s*([^\n]+)/) || [])[1] || '').slice(0, 120),
                source: 'outline'
            }));
        }
        return this._splitChapterIntoSections(content, '');
    },

    async _aiGenerateImportedChapterOutline(chapter) {
        const sections = this._splitChapterIntoSections(chapter.content || '', chapter.title || '');
        const sourceParts = sections.map(s => `【第${s.order}部分】${s.summary}\n${s.hook ? '末尾：' + s.hook : ''}`).join('\n\n');
        const prompt = `你是导入续写的章内细纲解析器。不要改写原文正文，只从原文反推每章可续写细纲。

【章节】第${chapter.order || ''}章 ${chapter.title || ''}
【正文分段摘要】
${sourceParts || (chapter.content || '').slice(0, 5000)}

输出严格JSON，不要markdown：
{
  "outline":"按固定格式写完整章纲：**本章目标：**...\\n**阻力与代价：**...\\n**情节动作：**...\\n**人物变化：**...\\n**世界规则：**...\\n**伏笔钩子：**...\\n**实体线索：**...\\n**上下文记忆：**...\\n**一致性风险：**...",
  "sections":[
    {"order":1,"title":"第1部分标题","function":"开场/推进/转折/收束","summary":"本部分发生了什么，必须具体","entities":["人物/地点/物品/规则"],"hook":"本部分留下的钩子或信息差"}
  ]
}

规则：
1. 只能基于原文，不能新增剧情。
2. 每个部分都要能指导后续续写，不要写主题口号。
3. 实体线索必须能同步到世界引擎知识图谱，并服务后续执笔台续写。
4. 一致性风险要指出续写时最容易写崩的地方。`;
        let raw = '';
        await AI.generate(prompt, { apiType: 'parse', module: 'world_import_outline', max_tokens: 2600, temperature: 0.2 }, c => { raw += c; });
        const clean = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
        let json = null;
        try {
            const m = clean.match(/\{[\s\S]*\}/);
            json = m ? JSON.parse(m[0]) : JSON.parse(clean);
        } catch(e) {
            return null;
        }
        const parsedSections = Array.isArray(json.sections) ? json.sections : sections;
        const outline = this._normalizeOutlineText(json.outline || '');
        if (!outline) return null;
        return {
            outline: outline + '\n\n' + this._formatSectionOutline(parsedSections),
            sections: parsedSections
        };
    },

	    async _parseNovelStructure(fullText, chunks, opts = {}) {
	        // 先尝试规则分章：显式区分【细纲】与【正文】，避免细纲文本被当作正文写进执笔台。
	        const lines = fullText.split('\n');
	        const volumes = [];
	        const chapters = [];
	        const briefLines = [];
	        let currentVol = null;
	        let currentChap = null;
	        let chapOrder = 1;
	        let volOrder = 1;
	        let currentZone = null;
	        let hasExplicitOutlineZone = false;

	        const markdownHeadingRegex = /^#{2,6}\s+(.+)$/;
	        const excludedMarkdownHeading = /^(?:创世蓝图|层级大纲|正文内容|前情提要|卷目标|卷规则|卷伏笔|实体线索|上下文记忆|一致性风险|一句话开书|细纲|大纲|章纲|正文|原文)(?:[（(:：\s]|$)/i;

	        const flushChapter = () => {
	            if(!currentChap) return;
	            const outline = (currentChap._outlineLines || []).join('\n').trim();
	            const content = this._normalizeImportedBodyContent((currentChap._contentLines || []).join('\n'));
	            const raw = (currentChap._rawLines || []).join('\n').trim();
	            if(outline) {
	                currentChap.outline = outline;
	                currentChap.outlineSource = currentChap.outlineSource || 'original';
	            }
	            if(content) {
	                currentChap.content = content;
	            } else if(!outline && raw) {
	                currentChap.content = this._normalizeImportedBodyContent(raw);
	            } else {
	                currentChap.content = '';
	            }
	            delete currentChap._outlineLines;
	            delete currentChap._contentLines;
	            delete currentChap._rawLines;
	            chapters.push(currentChap);
	            currentChap = null;
	        };

	        for(let i = 0; i < lines.length; i++) {
	            const line = lines[i].trim();
	            if(!line) continue;

	            const zone = this._detectNovelImportZone(line);
	            if(zone) {
	                const prevZone = currentZone;
	                const payload = this._extractNovelImportZonePayload(line, zone);
	                if((zone === 'outline' || zone === 'body') && prevZone !== zone) {
	                    flushChapter();
	                    currentVol = null;
	                    chapOrder = 1;
	                }
	                currentZone = zone;
	                if(zone === 'outline') hasExplicitOutlineZone = true;
	                if(payload) {
	                    if(zone === 'brief') briefLines.push(payload);
	                    else if(currentChap && zone === 'outline') currentChap._outlineLines.push(payload);
	                    else if(currentChap && zone === 'body') currentChap._contentLines.push(payload);
	                }
	                continue;
	            }

	            const cleanTitle = this._cleanNovelImportHeading(line);
	            if((currentZone !== 'body' && /^(?:={3,}|[-*_]{3,})$/.test(line)) ||
	                /^[（(]?\s*第\s*[一二三四五六七八九十百千零〇两\d]+\s*卷\s*(?:完|完结|结束|END)\s*[）)]?$/i.test(cleanTitle)) continue;
	            const headingMatch = line.match(markdownHeadingRegex);
	            const isVolume = this._isNovelImportVolumeHeading(line);
	            const isChapter = !isVolume && (
	                this._isNovelImportChapterHeading(line) ||
	                (!!headingMatch && currentZone === 'body' && !excludedMarkdownHeading.test(cleanTitle) && this._isNovelImportGenericChapterHeading(cleanTitle))
	            );

	            if(isVolume) {
	                flushChapter();
	                const volTitle = cleanTitle || line;
	                const parsedOrder = this._parseNovelImportVolumeOrder(volTitle, volOrder);
	                let existingVol = volumes.find(v => this._cleanNovelImportHeading(v.title) === this._cleanNovelImportHeading(volTitle));
	                if(!existingVol) {
	                    existingVol = { id: Utils.uuid(), title: volTitle, order: parsedOrder };
	                    volumes.push(existingVol);
	                }
	                currentVol = existingVol;
	                volOrder = Math.max(volOrder + 1, parsedOrder + 1);
	            } else if(isChapter) {
	                flushChapter();
	                const chapTitle = cleanTitle || line;
	                const parsedOrder = this._parseNovelImportChapterOrder(chapTitle, chapOrder);
	                currentChap = {
	                    id: Utils.uuid(),
	                    title: chapTitle,
	                    order: parsedOrder,
	                    volumeId: currentVol ? currentVol.id : null,
	                    content: '',
	                    outline: '',
	                    sourceZone: currentZone || 'body',
	                    _outlineLines: [],
	                    _contentLines: [],
	                    _rawLines: []
	                };
	                chapOrder = Math.max(chapOrder + 1, parsedOrder + 1);
	            } else if(currentChap) {
	                if(currentZone === 'outline') currentChap._outlineLines.push(line);
	                else if(currentZone === 'brief') currentChap._rawLines.push(line);
	                else if(currentZone === 'body') currentChap._contentLines.push(line);
	                else currentChap._rawLines.push(line);
	            } else if(currentZone === 'brief' || (!currentZone && briefLines.length < 20)) {
	                briefLines.push(line);
	            }
	        }
	        flushChapter();

        // 如果没有规则分章成功，尝试AI解析
	        if(chapters.length === 0 && opts.allowAI !== false) {
            const sample = fullText.slice(0, Math.min(fullText.length, 12000));
	            const prompt = `你是导入续写的小说结构解析引擎。请分析以下小说文本，识别卷/章结构，并为每章拆出可续写细纲。\n\n要求输出严格JSON（不要markdown代码块，不要额外文字）：\n{\n  "volumes": [{"title":"卷名","order":1}],\n  "chapters": [{"title":"章名","order":1,"volumeOrder":1,"outline":"**本章目标：** ...\\n**阻力与代价：** ...\\n**情节动作：** ...\\n**人物变化：** ...\\n**世界规则：** ...\\n**伏笔钩子：** ...\\n**实体线索：** ...\\n**上下文记忆：** ...\\n**一致性风险：** ..."}]\n}\n\n规则：\n1. 如果没有明显的卷，则 volumes 留空数组，所有章的 volumeOrder 为 1\n2. 章按自然顺序编号\n3. 原文正文会直接进入执笔台，不要改写原文\n4. outline 必须按固定细纲格式写，方便下一步从细纲提取实体并同步世界引擎\n5. 实体线索要写人物、地点、势力、物品、能力、规则、关系；不要写成抽象主题\n\n文本开头（前12000字）：\n${sample}`;

            let raw = '';
            try {
                await AI.generate(prompt, { apiType: 'parse', module: 'world_import_structure', max_tokens: 2000, temperature: 0.1 }, chunk => { raw += chunk; });
                const json = (() => { try { const m = raw.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; } catch(e) { return null; } })();
                if(json) {
                    if(json.volumes?.length) {
                        json.volumes.forEach((v, i) => { v.id = Utils.uuid(); v.order = i + 1; });
                        volumes.push(...json.volumes);
                    }
                    if(json.chapters?.length) {
                        json.chapters.forEach((c, i) => {
                            const vol = volumes.find(v => v.order === (c.volumeOrder || 1));
                            chapters.push({
                                id: Utils.uuid(), title: c.title, order: i + 1,
                                volumeId: vol ? vol.id : null, content: '',
                                outline: c.outline || ''
                            });
                        });
                    }
                }
            } catch(e) { console.warn('AI结构解析失败，尝试段落分章:', e); }
        }

        // 仍然没有章节？按段落 fallback
        if(chapters.length === 0) {
            const paras = fullText.split(/\n{2,}/).filter(p => p.trim().length > 50);
            const volId = Utils.uuid();
            volumes.push({ id: volId, title: '导入作品', order: 1 });
            paras.forEach((p, i) => {
                chapters.push({
                    id: Utils.uuid(), title: `第${i+1}章`, order: i+1,
                    volumeId: volId, content: p.trim()
                });
            });
        }

        // 为每章填充内容（按规则分章时已有，AI分章时需要从原文提取）
	        if(chapters.every(c => !c.content) && !hasExplicitOutlineZone) {
	            // 简单按字数均分原文
	            const avgLen = Math.floor(fullText.length / chapters.length);
	            chapters.forEach((c, i) => {
                const start = i * avgLen;
                const end = (i === chapters.length - 1) ? fullText.length : (i + 1) * avgLen;
                c.content = this._normalizeImportedBodyContent(fullText.slice(start, end));
            });
        }

	        return { volumes, chapters, bookBrief: briefLines.join('\n').trim() };
	    },

	    async _parseNovelEntities(fullText, chapters, bookBrief = '') {
        // 抽取代表性样本（前3章+中1章+后1章）用于实体提取
        const sampleChaps = [];
        if(chapters.length > 0) sampleChaps.push(chapters[0]);
        if(chapters.length > 2) sampleChaps.push(chapters[Math.floor(chapters.length/2)]);
        if(chapters.length > 1) sampleChaps.push(chapters[chapters.length-1]);

		        const sampleText = [
		            bookBrief ? `【一句话开书】\n${bookBrief.slice(0, 1200)}` : '',
		            sampleChaps.map(c => `【${c.title}】\n【章内细纲】\n${(c.outline||'').slice(0, 2400)}\n\n【正文校验样本】\n${(c.content||'').slice(0, 1200)}`).join('\n\n---\n\n')
		        ].filter(Boolean).join('\n\n---\n\n');

        let prompt = `你是导入续写的知识图谱提取引擎。请分析以下小说片段，提取世界规则、关键实体、伏笔和续写护栏。\n\n要求输出严格JSON（不要markdown代码块，不要额外文字）：\n{\n  "worldview": {\n    "history":"历史与传说（100-300字）",\n    "geography":"地理与地貌（100-300字）",\n    "magic":"魔法/科技体系（100-300字）",\n    "factions":"势力与组织（100-300字）",\n    "species":"种族与生物（100-300字）",\n    "rules":"世界规则、代价、禁忌与边界（100-300字）",\n    "culture":"文化与习俗（100-300字）"\n  },\n  "entities": [\n    {"name":"名称", "type":"人物|物品|地点|势力|魔法|规则|种族|文化|历史|情节|伏笔|情绪锚点", "desc":"描述（50-200字，写清当前状态/已知事实/续写禁忌）", "relations":["关系类型:关联名称"]}\n  ]\n}\n\n规则：\n1. worldview 的每个维度如果没有相关内容则留空字符串""\n2. entities 最多提取30个最关键实体，优先主角、重要配角、世界规则、未回收伏笔、关键地点\n3. type 必须从给定类型中选\n4. relations 用于世界引擎知识图谱关联\n5. 优先从章内细纲提取；正文样本只用于校验和补充，不要让正文覆盖细纲设定\n6. 只能提取原文明确内容；推断内容必须在desc中标注“推断”\n\n小说片段：\n${sampleText.slice(0, 12000)}`;

        let raw = '';
        try {
            await AI.generate(prompt, { apiType: 'parse', module: 'world_import_entities', max_tokens: 4000, temperature: 0.2 }, chunk => { raw += chunk; });
            const json = (() => { try { const m = raw.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; } catch(e) { return null; } })();
            if(json) {
                // 标准化实体
                const entities = (json.entities || []).map(e => ({
                    id: 'import_' + Utils.uuid(),
                    name: e.name || '未命名',
                    type: e.type || '人物',
                    desc: e.desc || '',
                    relations: e.relations || [],
                    chapters: [],
                    cycles: [],
                    source: 'import',
                    updatedAt: Date.now()
                }));
                return { entities, worldview: json.worldview || {} };
            }
        } catch(e) { console.warn('AI实体提取失败:', e); }
        return { entities: [], worldview: {} };
    },

	    async _applyNovelImportToWriterAndWorld(data, opts = {}) {
	        const we = Modules.world_engine;
		        const buildCycles = opts.buildCycles !== false;
		        const merge = opts.merge !== false;
		        const buildRuleOutline = opts.buildRuleOutline !== false;
		        const lightImport = opts.lightImport === true;
		        const now = Date.now();
	        const project = typeof GenesisCore !== 'undefined'
	            ? await GenesisCore.requireActiveProject?.('请先创建或选择项目，再导入到执笔台')
	            : null;
	        if(!project?.id) return;

		        const worldEntries = lightImport ? {} : (data.worldview || {});
		        const entityEntries = lightImport ? [] : (data.entities || []);
		        const worldCount = Object.values(worldEntries).filter(v => String(v || '').trim()).length;
			        const workbenchOutlineCount = lightImport ? 0 : (data.chapters || []).filter(c => String(c.outline || '').trim()).length;
			        const cycleCount = (!lightImport && buildCycles && (data.chapters || []).length >= 3) ? Math.ceil((data.chapters || []).length / 5) : 0;
		        const importVolumes = (data.volumes && data.volumes.length) ? data.volumes : [{ id: 'import_default_volume', title: '正文卷', order: 1 }];
			        const total = importVolumes.length + (data.chapters?.length || 0) + workbenchOutlineCount + worldCount + entityEntries.length + cycleCount + 3;
	        let progress = 0;

	        const clean = value => String(value || '')
	            .replace(/^\s{0,3}#{1,6}\s*/, '')
	            .replace(/\*\*/g, '')
	            .trim();
	        const norm = value => clean(value)
	            .replace(/[《》「」『』"'“”‘’\s]/g, '')
	            .replace(/[：:，、；;。.!！?？\-]/g, '')
	            .toLowerCase();
	        const sameTitle = (a, b) => !!norm(a) && norm(a) === norm(b);
	        const stamp = payload => (typeof GenesisCore !== 'undefined' && GenesisCore.stampProjectRecord)
	            ? GenesisCore.stampProjectRecord(payload, project.id)
	            : { ...payload, projectId: project.id };
	        const asRelArray = value => Array.isArray(value)
	            ? value.filter(Boolean)
	            : (typeof value === 'string' ? value.split(/[,，]/).map(s => s.trim()).filter(Boolean) : []);

	        App.showProgress('导入执笔台/世界引擎', 0, total);
	        we._setNovelImportJob({
	            running: true,
	            paused: false,
	            phase: 'apply',
		            status: lightImport ? '正在快速导入到对应位置' : '正在导入执笔台/世界引擎',
	            current: 0,
	            total,
	            options: { ...(we._novelImportJob?.options || {}), buildCycles, merge },
			            log: lightImport ? '开始写入：细纲和正文直接到执笔台' : '开始写入：细纲到执笔台/世界引擎，正文到执笔台'
	        });

	        try {
	            const existingVolumes = GenesisCore.filterProjectItems(await DB.getAll('volumes').catch(() => []) || [], project.id);
		            const existingChapters = GenesisCore.filterProjectItems(await DB.getAll('chapters').catch(() => []) || [], project.id);
		            const existingEntities = GenesisCore.filterProjectItems(await DB.getAll('entities').catch(() => []) || [], project.id);
		            const existingCycles = GenesisCore.filterProjectItems(await DB.getAll('cycles').catch(() => []) || [], project.id);
		            const existingOutlines = GenesisCore.filterProjectItems(await DB.getAll('outlines').catch(() => []) || [], project.id);
	            const volumeByImportedId = new Map();
	            const volumeByOrder = new Map();
	            const savedChapters = [];
	            const chapterByImportedId = new Map();

	            for(const v of importVolumes) {
	                we._checkNovelImportPaused();
	                const title = clean(v.title || v.name) || `第${v.order || importVolumes.indexOf(v) + 1}卷`;
	                const order = Number(v.order || importVolumes.indexOf(v) + 1);
	                let existing = null;
	                if(merge) {
	                    existing = existingVolumes.find(row => row.importedVolumeId === v.id || row.sourceImportId === v.id);
	                    if(!existing) existing = existingVolumes.find(row => sameTitle(row.title || row.name, title));
	                    if(!existing) existing = existingVolumes.find(row => (row.order || 0) === order && (row.source || '').startsWith('novel_import'));
	                }
	                const payload = stamp({
	                    ...(existing || {}),
	                    id: existing?.id || Utils.uuid(),
	                    title,
	                    order,
	                    outline: existing?.outline || v.outline || '',
	                    source: existing?.source || 'novel_import_direct',
	                    sourceType: 'outline_to_writer_world',
	                    importedVolumeId: v.id || '',
	                    sourceImportId: v.id || existing?.sourceImportId || '',
	                    createdAt: existing?.createdAt || now,
	                    updatedAt: now
	                });
	                await DB.put('volumes', payload);
	                if(!existing) existingVolumes.push(payload);
	                volumeByImportedId.set(v.id, payload);
	                volumeByOrder.set(order, payload);
	                App.showProgress('导入执笔台/世界引擎', ++progress, total);
	                we._setNovelImportJob({ current: progress, log: `卷结构入执笔台：${title}` });
	            }

	            for(const c of data.chapters || []) {
	                we._checkNovelImportPaused();
	                const order = Number(c.order || savedChapters.length + 1);
	                const title = clean(c.title || `第${order}章`) || `第${order}章`;
	                const importedVolume = c.volumeId ? volumeByImportedId.get(c.volumeId) : null;
	                const volume = importedVolume || volumeByOrder.get(Number(c.volumeOrder || 1)) || Array.from(volumeByOrder.values())[0] || null;
	                let existing = null;
	                if(merge) {
	                    existing = existingChapters.find(row => row.importedChapterId === c.id || row.sourceImportId === c.id);
	                    if(!existing) existing = existingChapters.find(row => sameTitle(row.title, title) && (row.volumeId || '') === (volume?.id || ''));
	                    if(!existing) existing = existingChapters.find(row => (row.order || row.number || 0) === order && (row.volumeId || '') === (volume?.id || ''));
	                }
		                const incomingContent = we._normalizeImportedBodyContent(c.content || '');
		                const existingContent = we._normalizeImportedBodyContent(existing?.content || '');
		                const content = merge && existingContent ? existingContent : incomingContent;
		                const outline = c.outline || existing?.outline || (buildRuleOutline ? we._buildImportedChapterOutline({ ...c, content }) : '');
		                const chapterId = existing?.id || Utils.uuid();
			                const workbenchOutlineId = existing?.workbenchOutlineId || existing?.sourceOutlineId || (!lightImport ? `novel_import_outline_${project.id}_${chapterId}` : '');
		                const payload = stamp({
		                    ...(existing || {}),
		                    id: chapterId,
		                    title,
		                    content,
		                    outline,
	                    sections: c.sections || existing?.sections || [],
	                    order,
	                    number: order,
	                    volumeId: volume?.id || existing?.volumeId || null,
	                    volumeTitle: volume?.title || c.volumeTitle || existing?.volumeTitle || '',
		                    status: content ? (existing?.status && existing.status !== 'outline' ? existing.status : 'done') : 'outline',
	                    targetWords: existing?.targetWords || c.targetWords || 2500,
	                    source: existing?.source || 'novel_import_direct',
	                    sourceType: 'body_to_writer_outline_to_world',
		                    importedChapterId: c.id || '',
		                    sourceImportId: c.id || existing?.sourceImportId || '',
		                    workbenchOutlineId,
		                    sourceOutlineId: workbenchOutlineId,
		                    outlineSource: c.outlineSource || existing?.outlineSource || 'import',
	                    outlineLevel: c.outlineLevel || existing?.outlineLevel || 'chapter_parts',
	                    importedAt: c.importedAt || now,
	                    createdAt: existing?.createdAt || now,
	                    updatedAt: now
	                });
	                await DB.put('chapters', payload);
	                if(!existing) existingChapters.push(payload);
		                savedChapters.push(payload);
		                if(c.id) chapterByImportedId.set(c.id, payload);
		                App.showProgress('导入执笔台/世界引擎', ++progress, total);
		                we._setNovelImportJob({ current: progress, log: content ? `正文入执笔台：${title}` : `细纲占位入执笔台：${title}` });
			                if(!lightImport && String(outline || '').trim()) {
		                    const existingOutline = merge
		                        ? existingOutlines.find(row =>
		                            row.id === workbenchOutlineId ||
		                            row.chapterId === payload.id ||
		                            (sameTitle(row.chapterTitle || row.title, title) && row.source === 'fusion_workbench' && row.sourceType === 'novel_import_outline'))
		                        : null;
		                    const outlinePayload = stamp({
		                        ...(existingOutline || {}),
		                        id: existingOutline?.id || workbenchOutlineId,
		                        title: `${title}（导入细纲）`,
		                        content: outline,
		                        source: 'fusion_workbench',
		                        sourceType: 'novel_import_outline',
		                        chapterIndex: order,
		                        chapterTitle: title,
		                        chapterId: payload.id,
		                        volumeId: payload.volumeId,
		                        volumeTitle: payload.volumeTitle,
		                        importedChapterId: c.id || '',
		                        status: content ? 'synced_body' : 'waiting_write',
		                        createdAt: existingOutline?.createdAt || now,
		                        updatedAt: now
		                    });
		                    await DB.put('outlines', outlinePayload);
		                    if(!existingOutline) existingOutlines.push(outlinePayload);
		                    App.showProgress('导入执笔台/世界引擎', ++progress, total);
			                    we._setNovelImportJob({ current: progress, log: `细纲镜像入拆书弹药库：${title}` });
		                }
		            }

	            const wvLabels = {history:'历史与传说', geography:'地理与地貌', magic:'魔法/科技体系', factions:'势力与组织', species:'种族与生物', rules:'世界规则', culture:'文化与习俗'};
	            let importedEntityCount = 0;
		            for(const [key, descRaw] of Object.entries(worldEntries)) {
	                we._checkNovelImportPaused();
	                const desc = String(descRaw || '').trim();
	                if(!desc) continue;
	                const name = wvLabels[key] || key;
	                let existing = merge ? existingEntities.find(e => (e.category === key || sameTitle(e.name, name)) && ['world','世界观','世界规则'].includes(e.type || '')) : null;
	                const payload = stamp({
	                    ...(existing || {}),
	                    id: existing?.id || `world_${project.id}_${key}`,
	                    name,
	                    type: '世界观',
	                    desc: merge && existing?.desc && !existing.desc.includes(desc.slice(0, 80)) ? `${existing.desc}\n\n${desc}` : (desc || existing?.desc || ''),
	                    category: key,
	                    relations: existing?.relations || [],
	                    chapters: existing?.chapters || [],
	                    source: existing?.source || 'novel_import_outline',
	                    sourceType: 'outline_worldview',
	                    updatedAt: now,
	                    createdAt: existing?.createdAt || now
	                });
	                await DB.put('entities', payload);
	                await DB.put('vectors', { id: payload.id, content: `[${payload.type}] ${payload.name}: ${payload.desc}`, vector: Array.from({ length: 1536 }, () => Math.random()), timestamp: now, projectId: project.id });
	                if(!existing) existingEntities.push(payload);
	                importedEntityCount++;
	                App.showProgress('导入执笔台/世界引擎', ++progress, total);
	                we._setNovelImportJob({ current: progress, log: `世界规则入图谱：${name}` });
	            }

		            for(const e of entityEntries) {
	                we._checkNovelImportPaused();
	                if(!e?.name) continue;
	                const name = clean(e.name);
	                const type = e.type || '其他';
	                const desc = String(e.desc || e.description || '').trim();
	                let existing = merge ? existingEntities.find(row => sameTitle(row.name, name) && (row.type || '其他') === type) : null;
	                const refs = savedChapters.filter(ch => `${ch.title || ''}\n${ch.outline || ''}\n${ch.content || ''}`.includes(name));
	                const relationSet = new Set([...(asRelArray(existing?.relations)), ...(asRelArray(e.relations))]);
	                const chapterSet = new Set([...(existing?.chapters || []), ...refs.map(ch => ch.id), ...(e.chapters || []).map(id => chapterByImportedId.get(id)?.id || id)].filter(Boolean));
	                const volumeSet = new Set([...(existing?.volumes || []), ...refs.map(ch => ch.volumeId).filter(Boolean), ...(e.volumes || [])].filter(Boolean));
	                const mergedDesc = merge && existing?.desc && desc && !existing.desc.includes(desc.slice(0, 80))
	                    ? `${existing.desc}\n\n${desc}`
	                    : (desc || existing?.desc || '');
	                const payload = stamp({
	                    ...(existing || {}),
	                    id: existing?.id || `novel_import_${project.id}_${Utils.uuid()}`,
	                    name,
	                    type,
	                    desc: mergedDesc,
	                    relations: Array.from(relationSet),
	                    chapters: Array.from(chapterSet),
	                    volumes: Array.from(volumeSet),
	                    cycles: existing?.cycles || e.cycles || [],
	                    source: existing?.source || 'novel_import_outline',
	                    sourceType: 'outline_entity',
	                    updatedAt: now,
	                    createdAt: existing?.createdAt || now
	                });
	                await DB.put('entities', payload);
	                await DB.put('vectors', { id: payload.id, content: `[${payload.type}] ${payload.name}: ${payload.desc}`, vector: Array.from({ length: 1536 }, () => Math.random()), timestamp: now, projectId: project.id });
	                if(!existing) existingEntities.push(payload);
	                importedEntityCount++;
	                App.showProgress('导入执笔台/世界引擎', ++progress, total);
	                we._setNovelImportJob({ current: progress, log: `细纲实体入图谱：${name}` });
	            }

		            if(!lightImport && buildCycles && savedChapters.length >= 3) {
	                const cycleSize = 5;
	                const numCycles = Math.ceil(savedChapters.length / cycleSize);
	                for(let i = 0; i < numCycles; i++) {
	                    we._checkNovelImportPaused();
	                    const start = i * cycleSize + 1;
	                    const end = Math.min((i + 1) * cycleSize, savedChapters.length);
	                    const cycleChaps = savedChapters.filter(c => (c.order || c.number || 0) >= start && (c.order || c.number || 0) <= end);
	                    const id = `novel_import_${project.id}_cycle_${start}_${end}`;
	                    const existing = merge ? existingCycles.find(c => c.id === id || ((c.startChapter || 0) === start && (c.endChapter || 0) === end && (c.source || '').startsWith('novel_import'))) : null;
	                    const payload = stamp({
	                        ...(existing || {}),
	                        id: existing?.id || id,
		                    title: `导入续写循环${i + 1} · 第${start}-${end}章`,
		                    content: `导入续写循环${i + 1}：第${start}-${end}章`,
		                    fusionEssence: `导入续写循环${i + 1}：第${start}-${end}章细纲与正文承接`,
	                        startChapter: start,
	                        endChapter: end,
	                        cycleNum: i + 1,
	                        cycleSize,
	                        chapterIds: cycleChaps.map(c => c.id),
		                        entityNames: entityEntries.slice(0, 12).map(e => e.name).filter(Boolean),
	                        nexusCHR: existing?.nexusCHR || [],
	                        nexusWLD: existing?.nexusWLD || [],
	                        nexusFOE: existing?.nexusFOE || [],
	                        nexusEMO: existing?.nexusEMO || [],
	                        patterns: existing?.patterns || [],
	                        source: existing?.source || 'novel_import_direct',
	                        sourceType: 'outline_cycle',
	                        createdAt: existing?.createdAt || now,
	                        updatedAt: now
	                    });
	                    await DB.put('cycles', payload);
	                    App.showProgress('导入执笔台/世界引擎', ++progress, total);
	                    we._setNovelImportJob({ current: progress, log: `续写循环入世界：第${start}-${end}章` });
	                }
	            }

	            we._checkNovelImportPaused();
		            try { await this._saveImportModeData(data, { skipAi: lightImport }); } catch(e) {}
	            try { await GenesisCore.refreshStats?.(project.id); } catch(e) {}
	            try {
		                if (typeof LocalSync !== 'undefined') ['volumes', 'chapters', 'outlines', 'entities', 'vectors', 'cycles', 'projects'].forEach(s => LocalSync._scheduleWrite?.(s));
		            } catch(e) {}
	            we._cachedEntities = null;
	            we._cachedCycles = null;
	            we._cachedLayeredGraphs = null;
	            try { await we.rebuildLayeredGraphs?.('novel_import_direct', { silent: true }); } catch(e) {}
	            try { await we._refreshEntities?.(); } catch(e) {}
		            try { await Modules.writer?.loadTree?.(); } catch(e) {}
		            try { await Modules.fusion_workbench?.refresh?.(); } catch(e) {}

	            App.hideProgress();
	            we._finishNovelImportJob(`已导入：${savedChapters.length}章入执笔台 / ${importedEntityCount}实体入世界`);
	            we._closeNovelImportModal();
	            App.nav('writer');
	            UI.toast(`导入完成：${importVolumes.length}卷 / ${savedChapters.length}章入执笔台，${importedEntityCount}实体入世界`, 'success');
	        } catch(e) {
	            App.hideProgress();
	            if (we._novelImportPauseRequested || /暂停|中止|abort|aborted/i.test(String(e?.message || e))) {
	                we._setNovelImportJob({
	                    running: false,
	                    paused: true,
	                    phase: 'apply',
	                    status: '已暂停，进度已保存',
	                    log: '导入写入已暂停，可点击继续重新合并'
	                });
	                UI.toast('导入写入已暂停，进度已保存');
	                return;
	            }
	            console.error('导入写入失败:', e);
	            we._setNovelImportJob({ running: false, phase: 'error', status: '导入失败', log: e.message || '未知错误' });
	            UI.toast('导入失败: ' + e.message, 'error');
	        }
	    },

    async _confirmNovelImport() {
        const we = Modules.world_engine;
        const data = we._novelImportParsed;
        if(!data || !data.chapters?.length) { UI.toast('没有可导入的数据'); return; }

	        const savedOptions = we._novelImportJob?.options || {};
	        const buildCycles = document.getElementById('we-novel-import-build-cycles')?.checked ?? (savedOptions.buildCycles !== false);
	        const merge = document.getElementById('we-novel-import-merge')?.checked ?? (savedOptions.merge !== false);
	        await we._applyNovelImportToWriterAndWorld(data, { buildCycles, merge });
	    },


    // ═══════════════════════════════════════════════════════════════
    // ★ 导入模式专属 — 文风指纹 / 续写起点 / 导入统计
    // ═══════════════════════════════════════════════════════════════

	    _buildPhoenixOutlineFromImport(data = {}) {
	        const volumes = (data.volumes && data.volumes.length) ? data.volumes : [{ id: 'import_default_volume', title: '正文卷', order: 1 }];
	        const chapters = [...(data.chapters || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
	        const lines = ['【导入新书细纲】'];
	        if(String(data.bookBrief || '').trim()) {
	            lines.push('【一句话开书】');
	            lines.push(String(data.bookBrief || '').trim());
	        }
	        for(const v of [...volumes].sort((a, b) => (a.order || 0) - (b.order || 0))) {
	            const title = this._cleanNovelImportHeading(v.title || v.name || `第${v.order || ''}卷`);
	            if(title) lines.push(`## ${title}`);
	            const vChapters = chapters.filter(c => c.volumeId === v.id || (!c.volumeId && (v.id === 'import_default_volume' || (v.order || 1) === (c.volumeOrder || 1))));
	            for(const c of vChapters) {
	                const chapterTitle = this._cleanNovelImportHeading(c.title || `第${c.order || ''}章`);
	                const outline = this._normalizeOutlineText(c.outline || '');
	                lines.push(`### ${chapterTitle}`);
	                lines.push(outline || '- 待补细纲');
	            }
	        }
	        return lines.join('\n\n').replace(/\n{4,}/g, '\n\n\n').trim();
	    },

	    async _syncImportedOutlineToPhoenix(data = {}, outlineText = '') {
	        const text = String(outlineText || '').trim();
	        if(!text) return;
	        try {
	            if(typeof Modules !== 'undefined' && Modules.phoenix) {
	                Modules.phoenix.data = Modules.phoenix.data || {};
	                Modules.phoenix.data.outlineRaw = text;
	                Modules.phoenix.data.globalOutline = text;
	                const rawEl = document.getElementById('ph-outline-raw') || document.getElementById('ph-outline-edit');
	                if(rawEl) rawEl.value = text;
	                try { Modules.phoenix._updateStats?.(); } catch(e) {}
	                try { Modules.phoenix.updatePreview?.(); } catch(e) {}
	            }
	        } catch(e) {
	            console.warn('[WorldImport] 同步凤凰细纲内存失败:', e);
	        }
	    },

	    async _saveImportModeData(data, opts = {}) {
	        const phoenixOutline = this._buildPhoenixOutlineFromImport(data);
	        const originalText = data.chapters.map(c => this._normalizeImportedBodyContent(c.content || '')).filter(Boolean).join('\n\n');
	        const wordCount = originalText.length;
	        const chapterCount = data.chapters.length;
	        const genre = data.worldview?.genre || '未知';
	        const isCharacter = e => ['人物', '角色', 'character', 'Character'].includes(e?.type);
		        const quickSummary = `快速导入完成：共${chapterCount}章，${(data.chapters || []).filter(c => (c.outline || '').trim()).length}章带细纲，${(data.chapters || []).filter(c => this._normalizeImportedBodyContent(c.content || '')).length}章带正文；细纲和正文已直接进入执笔台。`;

	        // 1. 文风指纹提取（异步，不阻塞UI）
		        if (!opts.skipAi && originalText.trim()) {
		            this._extractStyleFingerprint(originalText).then(fp => {
		                GenesisCore.updateModeData({ styleFingerprint: fp });
		            }).catch(() => {});
		        }

	        // 2. 生成导入摘要（异步）
	        if (!opts.skipAi) {
	            this._generateImportSummary(data).then(summary => {
	                GenesisCore.updateModeData({ importSummary: summary });
	            }).catch(() => {});
	        }

        // 3. 保存基础统计
		        await GenesisCore.updateModeData({
			            bookBrief: data.bookBrief || '',
			            globalOutline: phoenixOutline,
			            outlineRaw: phoenixOutline,
			            phoenixOutline,
			            importedOutlineRaw: phoenixOutline,
			            ...(opts.skipAi ? { importSummary: quickSummary } : {}),
			            originalText: originalText.slice(0, 5000),
	            parsedStructure: {
                chapters: data.chapters.map(c => ({
                    title: c.title,
                    order: c.order,
                    outline: c.outline || '',
                    sections: c.sections || [],
                    outlineSource: c.outlineSource || 'rules',
                    outlineLevel: c.outlineLevel || 'chapter_parts'
                })),
                characters: (data.entities || []).filter(isCharacter).map(e => e.name),
                arcs: data.volumes?.map(v => v.title || v.name).filter(Boolean) || []
            },
            extractedEntities: data.entities || [],
            originalStats: { wordCount, chapterCount, genre, characterCount: (data.entities || []).length },
	            continuationPoint: data.continuationPoint || this._getNovelImportContinuationPoint(data.chapters || []),
            continuationPolicy: {
                keepImportedText: true,
                useChapterOutlines: true,
                useChapterPartOutlines: true,
                useKnowledgeGraph: true,
                writeOnlyMissingOrNext: true
            }
        });
	        await this._syncImportedOutlineToPhoenix(data, phoenixOutline);
    },

    async _extractStyleFingerprint(text) {
        const sample = text.slice(0, 3000);
        let result = '';
        try {
            await AI.generate(
                `分析以下小说片段的文风特征，输出JSON格式：
{
  "sentencePattern": "句式特征（长短句比例、修辞偏好）",
  "vocabulary": "词汇偏好（文言/白话、华丽/朴实）",
  "rhythm": "节奏模式（快节奏/慢节奏、段落长度）",
  "descriptionStyle": "描写风格（细腻/粗犷、感官侧重）",
  "dialogueStyle": "对话风格（简洁/冗长、标点特征）",
  "overall": "整体文风标签"
}

片段：${sample.slice(0, 2000)}`,
                { apiType: 'parse', module: 'world_import_style' }, c => { result += c; }
            );
        } catch(e) {}
        return result || '{}';
    },

    async _generateImportSummary(data) {
        const characterNames = (data.entities || []).filter(e => ['人物','角色','character','Character'].includes(e.type)).map(e => e.name).slice(0, 10).join('、');
        const outline = data.chapters.map(c => `第${c.order}章 ${c.title}: ${c.outline?.slice(0, 50) || ''}`).join('\n');
	        const prompt = `请对以下小说生成精炼的导入摘要（不超过300字），包含：主要人物、核心冲突、世界观概要、已完结构。
	
一句话开书：
${(data.bookBrief || '').slice(0, 800)}

人物：${characterNames}
章节概要：
${outline.slice(0, 1500)}`;
        let summary = '';
        try {
            await AI.generate(prompt, { apiType: 'parse', module: 'world_import_summary' }, c => { summary += c; });
        } catch(e) {}
        return summary || `导入作品：共${data.chapters.length}章，主要人物${characterNames}`;
    },

    // 设置续写起点
    async _setContinuationPoint(chapterIndex, position) {
        await GenesisCore.updateModeData({
            continuationPoint: { chapterIndex, position, setAt: Date.now() }
        });
        UI.toast(`续写起点已设置：第${chapterIndex}章 ${position === 'end' ? '结尾' : '开头'}`);
    },

    // ═══════════════════════════════════════════════════════════════
    //  双向同步桥：接收 writer 推送，更新世界引擎
    // ═══════════════════════════════════════════════════════════════

    async syncFromWriter(chapterData) {
        const we = Modules.world_engine;
        // chapterData: { chapterId, title, order, content, outline, extractedEntities? }
        if(!chapterData || !chapterData.chapterId) return;

        try {
            // 1. 刷新缓存
            await we._ensureCache();

            // 2. 更新实体关联
            if(chapterData.extractedEntities?.length) {
                for(const ent of chapterData.extractedEntities) {
                    const existing = (we._cachedEntities || []).find(e => e.name === ent.name && e.type === ent.type);
                    if(existing) {
                        // 更新关联章节
                        if(!existing.chapters) existing.chapters = [];
                        if(!existing.chapters.includes(chapterData.chapterId)) {
                            existing.chapters.push(chapterData.chapterId);
                        }
                        // 更新关联循环
                        const cycleInfo = we.getCycleIdForChapter(chapterData.order, 5);
                        if(cycleInfo && !existing.cycles?.includes(cycleInfo.id)) {
                            if(!existing.cycles) existing.cycles = [];
                            existing.cycles.push(cycleInfo.id);
                        }
                        existing.updatedAt = Date.now();
                        await DB.put('entities', existing);
                    } else {
                        // 新建实体
                        const newEnt = {
                            id: 'writer_sync_' + Utils.uuid(),
                            name: ent.name,
                            type: ent.type || '人物',
                            desc: ent.desc || '',
                            relations: ent.relations || [],
                            chapters: [chapterData.chapterId],
                            cycles: [],
                            source: 'writer_sync',
                            updatedAt: Date.now()
                        };
                        const cycleInfo = we.getCycleIdForChapter(chapterData.order, 5);
                        if(cycleInfo) newEnt.cycles = [cycleInfo.id];
                        await DB.put('entities', newEnt);
                    }
                }
            }

            // 3. 更新循环实体列表（如果这个章节属于某个循环）
            const cycleInfo = we.getCycleIdForChapter(chapterData.order, 5);
            if(cycleInfo) {
                await we._ensureCycleCache();
                const cycle = (we._cachedCycles || []).find(c => c.id === cycleInfo.id);
                if(cycle && chapterData.extractedEntities?.length) {
                    const newNames = chapterData.extractedEntities.map(e => e.name);
                    cycle.entityNames = [...new Set([...(cycle.entityNames||[]), ...newNames])];
                    cycle.updatedAt = Date.now();
                    await DB.put('cycles', cycle);
                }
            }

            // 4. 刷新缓存
            we._cachedEntities = null;
            we._cachedCycles = null;

            console.log('[WorldEngine] syncFromWriter OK:', chapterData.title);
        } catch(e) {
            console.error('[WorldEngine] syncFromWriter failed:', e);
        }
    },

    // ═══════════════════════════════════════════════════════════════
    //  项目级同步：接收 GenesisCore 推送，批量更新世界引擎
    // ═══════════════════════════════════════════════════════════════
    async syncFromProject(projectId, data) {
        const we = Modules.world_engine;
        if(!projectId) return;
        try {
            await we._ensureCache();
            // 批量注入实体
            if(data.entities && Array.isArray(data.entities)) {
                for(const ent of data.entities) {
                    const id = 'proj_' + projectId + '_' + (ent.id || Utils.uuid());
                    await DB.put('entities', {
                        id, name: ent.name, type: ent.type || '其他',
                        desc: ent.desc || '', relations: ent.relations || [],
                        source: 'project', projectId, updatedAt: Date.now()
                    });
                }
            }
            // 批量注入世界观维度
            if(data.worldview) {
                for(const [cat, desc] of Object.entries(data.worldview)) {
                    if(!desc) continue;
                    await DB.put('entities', {
                        id: 'proj_wv_' + projectId + '_' + cat,
                        name: cat, type: 'world', desc,
                        source: 'project', projectId, updatedAt: Date.now()
                    });
                }
            }
            we._cachedEntities = null;
            console.log('[WorldEngine] syncFromProject OK:', projectId);
        } catch(e) {
            console.error('[WorldEngine] syncFromProject failed:', e);
        }
    },
});
