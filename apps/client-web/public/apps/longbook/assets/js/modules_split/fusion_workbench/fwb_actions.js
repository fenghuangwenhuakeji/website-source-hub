Object.assign(Modules.fusion_workbench, {

    async _countAmmoRecords() {
        let count = 0;
        try {
            const assets = await DB.getAll('assets') || [];
            count += assets.filter(a =>
                a.flowMode !== 'creative' &&
                a.sourceBook !== '融合细纲/正文原创' &&
                (a.type === 'fusion_ammo' || a.type === 'fusion_entity' || a.id?.startsWith('fusion_entity_'))
            ).length;
        } catch(e) {}
        try {
            const ctx = await DB.get('settings', 'pipeline_fusion_context');
            if (ctx?.content) count += 1;
            const settings = await DB.getAll('settings') || [];
            count += settings.filter(s => s.id && s.id.startsWith('cycle_fusion_') && s.content).length;
        } catch(e) {}
        return count;
    },

    goDeconstruct() {
        App.nav('fusion_book');
        setTimeout(() => Modules.fusion_book?.showPipelineConfig?.(), 250);
    },

    async useAmmoToWrite() {
        const count = await this._countAmmoRecords();
        if (!count) {
            UI.toast('拆书弹药库还是空的，先去「融合拆书」拆一轮', 'info');
            this.goDeconstruct();
            return;
        }
        localStorage.setItem('writer_flow_mode', 'fusion');
        UI.toast(`已切到执笔台，可调用 ${count} 条拆书弹药`);
        App.nav('writer');
    },

    _stampProjectPayload(payload, project) {
        if (project?.id) payload.projectId = project.id;
        return payload;
    },

    _parseCnOrdinal(raw, fallback = Date.now()) {
        const text = String(raw || '').trim();
        if (!text) return fallback;
        if (/^\d+$/.test(text)) return parseInt(text, 10);
        const cn = '零一二三四五六七八九十';
        const normalized = text.replace(/〇/g, '零').replace(/两/g, '二');
        if (normalized === '十') return 10;
        const ten = normalized.indexOf('十');
        if (ten >= 0) {
            const a = ten === 0 ? 1 : Math.max(1, cn.indexOf(normalized[0]));
            const b = ten === normalized.length - 1 ? 0 : Math.max(0, cn.indexOf(normalized[ten + 1]));
            return a * 10 + b;
        }
        const idx = cn.indexOf(normalized[0]);
        return idx >= 0 ? idx : fallback;
    },

    _cleanWorkbenchHeading(value) {
        return String(value || '')
            .split('\n')[0]
            .replace(/^\s{0,3}#{1,6}\s*/, '')
            .replace(/\*\*/g, '')
            .replace(/（(?:从零|融合|导入)(?:细纲|正文|卷结构)）$/g, '')
            .trim();
    },

    _isWorkbenchVolumeTitle(value) {
        return /^第\s*([0-9]+|[一二三四五六七八九十百千万零〇两]+)\s*卷(?:[：:\s]|$)/.test(this._cleanWorkbenchHeading(value));
    },

    _parseWorkbenchVolumeIndex(item) {
        const direct = item?.volumeIndex ?? item?.volumeOrder;
        if (Number.isFinite(Number(direct))) return Number(direct);
        const text = `${item?.volumeTitle || ''}\n${item?.title || ''}\n${item?.content || ''}`;
        const m = text.match(/第\s*([0-9]+|[一二三四五六七八九十百千万零〇两]+)\s*卷/);
        return m ? this._parseCnOrdinal(m[1], 1) : 1;
    },

    _getWorkbenchVolumeTitle(item) {
        const direct = this._cleanWorkbenchHeading(item?.volumeTitle || item?.targetVolumeTitle || '');
        if (direct) return direct;
        const title = this._cleanWorkbenchHeading(item?.title || item?.chapterTitle || '');
        if (this._isWorkbenchVolumeTitle(title)) return title;
        const firstHeading = String(item?.content || '').split('\n').map(line => this._cleanWorkbenchHeading(line)).find(Boolean);
        return this._isWorkbenchVolumeTitle(firstHeading) ? firstHeading : '';
    },

    _sameWorkbenchTitle(a, b) {
        const norm = s => String(s || '')
            .replace(/\*\*/g, '')
            .replace(/[《》「」『』"'“”‘’\s]/g, '')
            .replace(/[：:，、；;。.!！?？-]/g, '')
            .trim()
            .toLowerCase();
        return norm(a) && norm(a) === norm(b);
    },

    async _ensureWriterVolumeFromWorkbench(item, project = null) {
        const title = this._getWorkbenchVolumeTitle(item);
        if (!title) return null;
        const projectId = project?.id || item?.projectId || '';
        const allVolumes = await DB.getAll('volumes').catch(() => []) || [];
        const scoped = allVolumes.filter(v => !projectId || !v.projectId || v.projectId === projectId);
        const order = this._parseWorkbenchVolumeIndex(item);
        let existing = scoped.find(v => this._sameWorkbenchTitle(v.title || v.name, title));
        if (!existing) existing = scoped.find(v => (v.order || 0) === order && this._sameWorkbenchTitle(v.title || v.name, title));
        const payload = this._stampProjectPayload({
            ...(existing || {}),
            id: existing?.id || Utils.uuid(),
            title,
            order: existing?.order || order,
            source: existing?.source || 'fusion_workbench_publish',
            outline: existing?.outline || (this._isWorkbenchVolumeTitle(item?.title) ? (item?.content || '') : ''),
            createdAt: existing?.createdAt || Date.now(),
            updatedAt: Date.now()
        }, project || { id: projectId });
        await DB.put('volumes', payload);
        return payload;
    },

    _parseWorkbenchChapterIndex(item) {
        const direct = item?.chapterIndex ?? item?.chapterOrder ?? item?.order;
        if (Number.isFinite(Number(direct))) return Number(direct);
        const text = `${item?.title || ''}\n${item?.content || ''}`;
        const m = text.match(/第\s*([0-9]+|[一二三四五六七八九十百千万零〇两]+)\s*章/);
        if (!m) return Date.now();
        return this._parseCnOrdinal(m[1], Date.now());
    },

    _publishedTitle(item, fallback) {
        return String(item?.targetChapterTitle || item?.chapterTitle || item?.title || fallback || '工作台导入章节')
            .replace(/^融合弹药(细纲|正文)\s*\([^)]+\)\s*/, '')
            .replace(/（(?:从零|融合|导入)(?:细纲|正文)）$/g, '')
            .trim();
    },

    async publishOutlineToWriter(id) {
        const item = await DB.get('outlines', id);
        if (!item) return UI.toast('找不到这条细纲');
        const project = await GenesisCore.getActiveProject?.();
        if (this._isWorkbenchVolumeTitle(item.title || item.chapterTitle || '') || this._isWorkbenchVolumeTitle(String(item.content || '').split('\n').find(Boolean) || '')) {
            const volume = await this._ensureWriterVolumeFromWorkbench(item, project);
            item.publishedVolumeId = volume?.id || '';
            item.publishedAt = Date.now();
            await DB.put('outlines', item);
            try { Modules.writer?.loadTree?.(); } catch(e) {}
            return UI.toast('已从拆书弹药库建立执笔台卷结构');
        }
        const order = this._parseWorkbenchChapterIndex(item);
        const volume = await this._ensureWriterVolumeFromWorkbench(item, project);
        const allChapters = await DB.getAll('chapters').catch(() => []) || [];
        const existing = allChapters.find(c => c.workbenchOutlineId === id || c.sourceOutlineId === id);
        const payload = this._stampProjectPayload({
            ...(existing || {}),
            id: existing?.id || Utils.uuid(),
            title: this._publishedTitle(item, `第${order}章（工作台细纲）`),
            outline: item.content || '',
            content: existing?.content || '',
            order,
            number: order,
            volumeId: volume?.id || existing?.volumeId || item.volumeId || null,
            volumeTitle: volume?.title || item.volumeTitle || existing?.volumeTitle || '',
            status: existing?.content ? (existing.status || 'draft') : 'outline',
            source: 'fusion_workbench_publish',
            sourceOutlineId: id,
            workbenchOutlineId: id,
            targetWords: existing?.targetWords || 2500,
            createdAt: existing?.createdAt || Date.now(),
            updatedAt: Date.now()
        }, project);
        await DB.put('chapters', payload);
        item.publishedChapterId = payload.id;
        item.publishedAt = Date.now();
        await DB.put('outlines', item);
        try { Modules.writer?.loadTree?.(); } catch(e) {}
        UI.toast('已从拆书弹药库送入执笔台细纲');
    },

    async publishWritingToWriter(id) {
        const item = await DB.get('writings', id);
        if (!item) return UI.toast('找不到这条正文');
        const project = await GenesisCore.getActiveProject?.();
        const order = this._parseWorkbenchChapterIndex(item);
        const volume = await this._ensureWriterVolumeFromWorkbench(item, project);
        const allChapters = await DB.getAll('chapters').catch(() => []) || [];
        let existing = allChapters.find(c => c.workbenchWritingId === id || c.sourceWritingId === id);
        if (!existing && item.outlineId) existing = allChapters.find(c => c.workbenchOutlineId === item.outlineId || c.sourceOutlineId === item.outlineId);
        const payload = this._stampProjectPayload({
            ...(existing || {}),
            id: existing?.id || Utils.uuid(),
            title: this._publishedTitle(item, `第${order}章（工作台正文）`),
            outline: existing?.outline || item.outline || '',
            content: item.content || '',
            order,
            number: order,
            volumeId: volume?.id || existing?.volumeId || item.volumeId || null,
            volumeTitle: volume?.title || item.volumeTitle || existing?.volumeTitle || '',
            status: 'draft',
            source: 'fusion_workbench_publish',
            sourceWritingId: id,
            workbenchWritingId: id,
            targetWords: existing?.targetWords || 2500,
            createdAt: existing?.createdAt || Date.now(),
            updatedAt: Date.now()
        }, project);
        await DB.put('chapters', payload);
        item.publishedChapterId = payload.id;
        item.publishedAt = Date.now();
        await DB.put('writings', item);
        try { Modules.writer?.loadTree?.(); } catch(e) {}
        UI.toast('已从拆书弹药库送入执笔台正文');
    },

    async publishEntityToWorld(id) {
        const asset = await DB.get('assets', id);
        if (!asset) return UI.toast('找不到这条暂存实体');
        const ent = asset.entity || {};
        const entityId = asset.publishedEntityId || Utils.uuid();
        const payload = {
            id: entityId,
            name: asset.name || ent.name,
            type: asset.entityType || ent.type || '其他',
            desc: asset.desc || ent.desc || ent.description || asset.content || '',
            relations: Array.isArray(asset.relations || ent.relations) ? (asset.relations || ent.relations) : [],
            tags: asset.tags || ['融合', '工作台', '暂存发布'],
            source: 'fusion_workbench',
            sourceAssetId: id,
            updatedAt: Date.now()
        };
        await DB.put('entities', payload);
        await DB.put('vectors', {
            id: entityId,
            content: `[${payload.type}] ${payload.name}: ${payload.desc}`,
            vector: Array.from({ length: 1536 }, () => Math.random()),
            timestamp: Date.now()
        });
        asset.publishedEntityId = entityId;
        asset.publishedAt = Date.now();
        await DB.put('assets', asset);
        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
            Modules.world_engine._cachedLayeredGraphs = null;
            try { Modules.world_engine._refreshEntities?.(); } catch(e) {}
            try { await Modules.world_engine.rebuildLayeredGraphs?.('fusion_workbench_publish', { silent: true }); } catch(e) {}
        }
        await this.refresh();
        UI.toast('已从拆书弹药库送入世界引擎');
    },

    async publishCycleToWorld(id) {
        const item = await DB.get('settings', id);
        if (!item) return UI.toast('找不到这条循环融合');
        if (!Modules.world_engine?.syncCycle) return UI.toast('世界引擎未就绪');
        const cycleData = {
            id: id.replace(/^fwb_/, ''),
            bookId: item.bookId || 'fusion_workbench',
            startChapter: item.startChapter,
            endChapter: item.endChapter,
            cycleNum: item.cycleNum,
            cycleSize: item.cycleSize,
            fusionEssence: item.fusionEssence || item.content || '',
            compareResult: item.compareResult || '',
            entityNames: item.entityNames || [],
            chapterIds: item.chapterIds || [],
            nexusCHR: item.nexusCHR || [],
            nexusWLD: item.nexusWLD || [],
            nexusFOE: item.nexusFOE || [],
            nexusEMO: item.nexusEMO || [],
            createdAt: item.createdAt || Date.now()
        };
        await Modules.world_engine.syncCycle(cycleData);
        item.publishedCycleId = cycleData.id;
        item.publishedAt = Date.now();
        await DB.put('settings', item);
        await this.refresh();
        UI.toast('已从拆书弹药库同步循环数据到世界引擎');
    },

    _emptyState(text, icon, color) {
        return `
        <div class="flex flex-col items-center justify-center h-full text-dim">
            <div class="w-16 h-16 rounded-full bg-${color}-500/5 flex center mb-3">
                <i class="fa-solid ${icon} text-${color}-400/30 text-2xl"></i>
            </div>
            <div class="text-sm font-bold text-white/30">${text}</div>
            <div class="text-[10px] text-dim mt-1">先去「融合拆书」跑一轮，弹药会自动进入这里</div>
            <button class="btn btn-xs bg-white/5 text-dim mt-4" onclick="Modules.fusion_workbench.goDeconstruct()">
                <i class="fa-solid fa-rocket mr-1"></i>去拆书
            </button>
        </div>`;
    },

    _matchesSearch(text) {
        if (!this._search) return true;
        return (text || '').toLowerCase().includes(this._search.toLowerCase());
    },

    // ───────────────────────────────────────────
    // 流水线实时监控
    // ───────────────────────────────────────────
    _renderPipelineMonitorInner() {
        const FB = Modules.fusion_book;
        if (!FB) return '';

        const isRunning = FB._pipelineRunning;
        const isPaused = FB._pipelinePaused;
        const hasSaved = FB._savedPipelineState;
        const stats = FB._linearStats || FB._agentScheduler?._stats || { pending: 0, running: 0, done: 0, failed: 0, total: 0, startTime: 0 };
        const phase = FB._linearPhase || FB._agentScheduler?._phase || 0;
        const results = FB._pipelineResults || {};

        // 计算进度
        const totalPairs = stats.total || FB._plConfig?.leftChapters?.length || 0;
        const doneCount = stats.done;
        const progressPct = totalPairs > 0 ? Math.round((doneCount / totalPairs) * 100) : 0;
        const elapsedMin = stats.startTime ? ((Date.now() - stats.startTime) / 60000).toFixed(1) : '0.0';
        const speed = elapsedMin > 0 ? (doneCount / parseFloat(elapsedMin)).toFixed(1) : '0.0';

        // ── 未启动 ──
        if (!isRunning && !isPaused && !hasSaved) {
            return `
            <div class="bg-[#0e0e10] rounded-xl border border-white/5 p-5">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-rocket text-dim"></i>
                        <span class="text-sm font-bold text-white">流水线监控</span>
                        <span class="text-[10px] text-dim">未启动</span>
                    </div>
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.fusion_book.showPipelineConfig()">
                        <i class="fa-solid fa-play mr-1"></i>启动流水线
                    </button>
                </div>
            </div>`;
        }

        // ── 有保存进度但未运行 ──
        if (!isRunning && !isPaused && hasSaved) {
            const completed = hasSaved.completedPairs?.length || 0;
            const total = hasSaved.pairs?.length || 0;
            return `
            <div class="bg-[#0e0e10] rounded-xl border border-white/5 p-5">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-clock-rotate-left text-amber-400"></i>
                        <span class="text-sm font-bold text-white">流水线监控</span>
                        <span class="text-[10px] text-amber-400">上次进度: ${completed}/${total} 对章节</span>
                    </div>
                    <div class="flex gap-1.5">
                        <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.fusion_book._resumeFromSaved()">
                            <i class="fa-solid fa-play mr-1"></i>继续
                        </button>
                        <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.fusion_book.showPipelineConfig()">
                            <i class="fa-solid fa-gear mr-1"></i>重新配置
                        </button>
                    </div>
                </div>
            </div>`;
        }

        // ── 运行中 / 已暂停 ──
        const statusColor = isPaused ? 'amber' : 'green';
        const statusText = isPaused ? '⏸ 已暂停' : '🚀 运行中';
        const statusDot = isPaused ? '' : '<span class="animate-pulse text-green-400 mr-1">●</span>';

        // 阶段指示器
        const phases = [
            { num: 1, name: '分析', color: 'blue' },
            { num: 2, name: '融合', color: 'purple' },
            { num: 3, name: '循环', color: 'cyan' },
            { num: 4, name: FB._plConfig?.flowMode === 'creative' ? '创作' : '入库', color: 'orange' }
        ];

        // 实时写入状态
        const stepCards = [
            { key: 'left', label: '左书分析', color: 'blue', result: results.left },
            { key: 'right', label: '右书分析', color: 'pink', result: results.right },
            { key: 'compare', label: '对比', color: 'amber', result: results.compare },
            { key: 'fusion', label: '融合', color: 'green', result: results.fusion },
            { key: 'outline', label: '📋细纲', color: 'cyan', result: results.outline },
            { key: 'world', label: '实体提取', color: 'cyan', result: results.world },
            { key: 'write', label: '正文', color: 'purple', result: results.write }
        ];

        const stepHtml = stepCards.map(s => {
            const len = (s.result || '').length;
            const hasData = len > 0;
            const isActive = isRunning && !isPaused && !hasData;
            const bgClass = isActive ? `bg-${s.color}-500/10 border-${s.color}-500/30` : (hasData ? `bg-${s.color}-500/5 border-${s.color}-500/20` : 'bg-white/[0.02] border-white/5');
            const dotClass = isActive ? `bg-${s.color}-400 animate-pulse` : (hasData ? `bg-${s.color}-400` : 'bg-white/10');
            const textClass = isActive ? `text-${s.color}-400` : (hasData ? `text-${s.color}-400` : 'text-dim');
            const statusIcon = isActive ? '<i class="fa-solid fa-spinner fa-spin text-[8px]"></i>' : (hasData ? '<i class="fa-solid fa-check text-[8px]"></i>' : '<i class="fa-solid fa-minus text-[8px]"></i>');
            return `
            <div class="rounded-lg border p-2 ${bgClass} flex flex-col gap-1">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full ${dotClass}"></span>
                        <span class="text-[10px] font-bold ${textClass}">${s.label}</span>
                    </div>
                    ${statusIcon}
                </div>
                ${hasData ? `<span class="text-[9px] text-dim font-mono text-right">${len}字</span>` : ''}
            </div>`;
        }).join('');

        return `
        <div class="bg-[#0e0e10] rounded-xl border border-white/5 overflow-hidden">
            <!-- 头部状态栏 -->
            <div class="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/5">
                <div class="flex items-center gap-2">
                    ${statusDot}
                    <span class="text-sm font-bold text-white">流水线实时监控</span>
                    <span class="text-[10px] px-1.5 py-0.5 rounded bg-${statusColor}-500/10 text-${statusColor}-400 border border-${statusColor}-500/20">${statusText}</span>
                </div>
                <div class="flex gap-1.5">
                    ${isPaused ? `
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.fusion_book.plResume()">
                        <i class="fa-solid fa-play mr-1"></i>继续
                    </button>` : `
                    <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.fusion_book.plPause()">
                        <i class="fa-solid fa-pause mr-1"></i>暂停
                    </button>`}
                    <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30" onclick="Modules.fusion_book.plStop()">
                        <i class="fa-solid fa-stop mr-1"></i>停止
                    </button>
                    <button class="btn btn-xs bg-white/5 text-dim" onclick="App.nav('fusion_book'); setTimeout(() => Modules.fusion_book.plRestore(), 100);">
                        <i class="fa-solid fa-expand mr-1"></i>打开浮层
                    </button>
                </div>
            </div>
            <div class="p-4 space-y-3">
                <!-- 阶段 + 进度 -->
                <div class="flex items-center gap-3">
                    <div class="flex items-center gap-1 text-[10px]">
                        ${phases.map(p => `
                            <span class="px-1.5 py-0.5 rounded ${phase === p.num ? 'bg-' + p.color + '-500/20 text-' + p.color + '-400 font-bold' : 'text-dim'}">${p.num}${p.name}</span>
                            ${p.num < 4 ? '<span class="text-dim">→</span>' : ''}
                        `).join('')}
                    </div>
                    <div class="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300" style="width:${progressPct}%"></div>
                    </div>
                    <span class="text-[10px] text-dim font-mono">${doneCount}/${totalPairs || '?'} (${progressPct}%)</span>
                </div>
                <!-- 进度统计 -->
                <div class="flex items-center gap-3 text-[10px]">
                    <span class="text-dim">进度:</span>
                    <span class="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">${stats.pending}待处理</span>
                    <span class="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">${stats.running}处理中</span>
                    <span class="px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">${stats.done}完成</span>
                    ${stats.failed > 0 ? `<span class="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">${stats.failed}失败</span>` : ''}
                    <span class="text-dim ml-auto">${speed}章/分 · ${elapsedMin}分钟</span>
                </div>
                <!-- 实时写入状态 -->
                <div>
                    <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-2">实时写入状态</div>
                    <div class="grid grid-cols-4 gap-1.5">
                        ${stepHtml}
                    </div>
                </div>
                <!-- 当前输出预览 -->
                ${(results.fusion || results.outline || results.write) ? `
                <div class="bg-black/20 rounded-lg p-2.5 border border-white/5 max-h-[120px] overflow-y-auto">
                    <div class="text-[10px] text-dim mb-1">最新输出预览</div>
                    <div class="text-[10px] text-gray-400 leading-relaxed whitespace-pre-wrap">${(results.write || results.outline || results.fusion || '').slice(-300)}</div>
                </div>` : ''}
            </div>
        </div>`;
    },

    _fmtCycleId(id) {
        if (!id) return '未知';
        return id.replace('cycle_', '').replace(/_/g, ' - ');
    },

    _escapeAttr(text) {
        return (text || '').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '');
    },

    _copyText(text) {
        navigator.clipboard.writeText(text).then(() => UI.toast('已复制到剪贴板')).catch(() => UI.toast('复制失败'));
    },

    _download(filename, text) {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },

    // ───────────────────────────────────────────
    // 导出 & 清空
    // ───────────────────────────────────────────
    async exportAll() {
        const d = this._data || {};
        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            fusionContext: d.fusionContext,
            analyses: d.analysis,
            cycles: d.cycles,
            outlines: d.outlines,
            writings: d.writings,
            entities: d.entities,
            worldCycles: d.worldCycles
        };
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fusion_workbench_export_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        UI.toast('导出成功');
    },

    async clearAll() {
        if (!confirm('确定清空所有融合拆书结果？此操作不可恢复。')) return;
        try {
            // 删除 settings 中的融合相关数据
            const allSettings = await DB.getAll('settings') || [];
            for (const s of allSettings) {
                if (s.id && (s.id.startsWith('cycle_fusion_') || s.id.startsWith('fwb_cycle_') || s.id === 'pipeline_fusion_context')) {
                    await DB.del('settings', s.id);
                }
            }
            // 删除 outlines / writings 中的 pipeline 来源数据
            const allOutlines = await DB.getAll('outlines') || [];
            for (const o of allOutlines) {
                if (['pipeline', 'batch_pipeline', 'fusion_workbench'].includes(o.source) || o.id?.startsWith('fusion_outline_')) {
                    await DB.del('outlines', o.id);
                }
            }
            const allWritings = await DB.getAll('writings') || [];
            for (const w of allWritings) {
                if (['pipeline', 'batch_pipeline', 'fusion_workbench'].includes(w.source) || w.id?.startsWith('fusion_write_')) {
                    await DB.del('writings', w.id);
                }
            }
            const allAssets = await DB.getAll('assets') || [];
            for (const a of allAssets) {
                if (a.type === 'fusion_entity' || a.type === 'fusion_ammo' || a.id?.startsWith('fusion_entity_')) {
                    await DB.del('assets', a.id);
                }
            }
            // 不删除 entities，因为可能是世界引擎共用的
            this._data = {};
            this._renderWorkspace();
            UI.toast('已清空融合拆书结果');
        } catch(e) {
            UI.toast('清空失败: ' + e.message);
        }
    }
});
