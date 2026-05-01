Object.assign(Modules.fusion_workbench, {
    // ── 总览 ──
    _renderOverview() {
        const d = this._data || {};
        const stats = [
            { label: '章节弹药', count: (d.analysis || []).length, tab: 'analysis', icon: 'fa-magnifying-glass', color: 'blue' },
            { label: '对比弹药', count: (d.compares || []).length + (d.fusionContext?.content ? 1 : 0), tab: 'compare', icon: 'fa-code-compare', color: 'amber' },
            { label: '融合弹药', count: (d.fusionAmmos || []).length + (d.cycles || []).length + (d.fusionContext?.content ? 1 : 0), tab: 'fusion', icon: 'fa-wand-magic-sparkles', color: 'green' },
            { label: '创作细纲', count: (d.outlines || []).length, tab: 'outline', icon: 'fa-list-check', color: 'cyan' },
            { label: '实体数量', count: (d.entities || []).length, icon: 'fa-cubes', color: 'pink' },
            { label: '正文素材', count: (d.writings || []).length, tab: 'write', icon: 'fa-feather-pointed', color: 'orange' },
            { label: '循环数据', count: (d.worldCycles || []).length, tab: 'cycle', icon: 'fa-arrows-spin', color: 'indigo' }
        ];
        const totalChars = [
            d.fusionContext?.content?.length || 0,
            ...(d.cycles || []).map(x => x.content?.length || 0),
            ...(d.compares || []).map(x => x.content?.length || 0),
            ...(d.fusionAmmos || []).map(x => x.content?.length || 0),
            ...(d.outlines || []).map(x => x.content?.length || 0),
            ...(d.writings || []).map(x => x.content?.length || 0),
            ...(d.analysis || []).map(x => x.content?.length || 0)
        ].reduce((a, b) => a + b, 0);

        return `
        <div class="space-y-5">
            <!-- 流水线实时监控 -->
            <div id="fw-pipeline-monitor">
                ${this._renderPipelineMonitorInner()}
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-blue-500/[0.04] border border-blue-500/15 rounded-xl p-4">
                    <div class="flex items-center gap-2 mb-2 text-blue-300 text-xs font-bold"><i class="fa-solid fa-box-open"></i>弹药模式</div>
                    <div class="text-[11px] text-gray-400 leading-relaxed">逐章拆技法、节奏、钩子、实体线索，实时沉淀成弹药。供续写、新书、RAG和执笔台调用。</div>
                </div>
                <div class="bg-green-500/[0.04] border border-green-500/15 rounded-xl p-4">
                    <div class="flex items-center gap-2 mb-2 text-green-300 text-xs font-bold"><i class="fa-solid fa-wand-magic-sparkles"></i>创作融合模式</div>
                    <div class="text-[11px] text-gray-400 leading-relaxed">弹药模式沉淀技法、节奏、钩子和可复用素材；创作模式的细纲/正文不进入这里。</div>
                </div>
            </div>
            <!-- 统计卡片 -->
            <div class="grid grid-cols-4 gap-3">
                ${stats.map(s => `
                <div class="bg-[#0e0e10] rounded-xl border border-white/5 p-4 hover:border-${s.color}-500/30 transition-all cursor-pointer" onclick="Modules.fusion_workbench.switchTab('${s.tab || (s.label === '实体数量' ? 'entity' : 'overview')}')">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-7 h-7 rounded-lg bg-${s.color}-500/10 flex center">
                            <i class="fa-solid ${s.icon} text-${s.color}-400 text-xs"></i>
                        </div>
                        <span class="text-[10px] text-dim font-bold uppercase">${s.label}</span>
                    </div>
                    <div class="text-2xl font-bold text-white font-mono">${s.count}</div>
                </div>
                `).join('')}
            </div>
            <!-- 全局信息 -->
            <div class="bg-[#0e0e10] rounded-xl border border-white/5 p-5">
                <div class="flex items-center gap-2 mb-4">
                    <i class="fa-solid fa-database text-green-400"></i>
                    <span class="text-sm font-bold text-white">数据总览</span>
                </div>
                <div class="grid grid-cols-3 gap-4 text-xs">
                    <div class="space-y-1">
                        <div class="text-dim">总记录数</div>
                        <div class="text-lg font-bold text-white font-mono">${this._getTotalCount()}</div>
                    </div>
                    <div class="space-y-1">
                        <div class="text-dim">总字数</div>
                        <div class="text-lg font-bold text-white font-mono">${(totalChars / 10000).toFixed(1)}万</div>
                    </div>
                    <div class="space-y-1">
                        <div class="text-dim">实体类型分布</div>
                        <div class="text-lg font-bold text-white font-mono">${Object.keys(this._groupEntitiesByType()).length}类</div>
                    </div>
                </div>
            </div>
            <!-- 最近活动 -->
            <div class="bg-[#0e0e10] rounded-xl border border-white/5 p-5">
                <div class="flex items-center gap-2 mb-4">
                    <i class="fa-solid fa-clock-rotate-left text-blue-400"></i>
                    <span class="text-sm font-bold text-white">最近更新</span>
                </div>
                <div class="space-y-2">
                    ${this._getRecentActivity().slice(0, 8).map(a => `
                    <div class="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] border border-white/5">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid ${a.icon} text-${a.color}-400 text-[10px]"></i>
                            <span class="text-xs text-gray-300">${a.title}</span>
                        </div>
                        <span class="text-[10px] text-dim font-mono">${a.time}</span>
                    </div>
                    `).join('') || '<div class="text-xs text-dim py-4 text-center">暂无记录</div>'}
                </div>
            </div>
        </div>`;
    },

    _getRecentActivity() {
        const d = this._data || {};
        const items = [];
        const now = Date.now();
        const fmt = ts => {
            if (!ts) return '-';
            const diff = now - ts;
            if (diff < 60000) return '刚刚';
            if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
            if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
            return Math.floor(diff / 86400000) + '天前';
        };
        if (d.fusionContext?.updatedAt) items.push({ title: '融合精华上下文', time: fmt(d.fusionContext.updatedAt), _ts: d.fusionContext.updatedAt, icon: 'fa-wand-magic-sparkles', color: 'green' });
        (d.compares || []).forEach(c => items.push({ title: c.title || c.name || '章节对比弹药', time: fmt(c.updatedAt || c.createdAt), _ts: c.updatedAt || c.createdAt, icon: 'fa-code-compare', color: 'amber' }));
        (d.fusionAmmos || []).forEach(a => items.push({ title: a.title || a.name || '融合弹药', time: fmt(a.updatedAt || a.createdAt), _ts: a.updatedAt || a.createdAt, icon: 'fa-wand-magic-sparkles', color: 'green' }));
        (d.cycles || []).forEach(c => items.push({ title: `循环融合: ${c.id.replace('cycle_fusion_', '')}`, time: fmt(c.createdAt), _ts: c.createdAt, icon: 'fa-arrows-spin', color: 'indigo' }));
        (d.outlines || []).forEach(o => items.push({ title: o.title || '融合细纲', time: fmt(o.createdAt), _ts: o.createdAt, icon: 'fa-list-check', color: 'cyan' }));
        (d.writings || []).forEach(w => items.push({ title: w.title || '融合正文', time: fmt(w.createdAt), _ts: w.createdAt, icon: 'fa-feather-pointed', color: 'orange' }));
        (d.analysis || []).forEach(a => items.push({ title: a.title || a.name || `章节弹药: ${String(a.id || '').replace('cycle_', '')}`, time: fmt(a.updatedAt || a.createdAt), _ts: a.updatedAt || a.createdAt, icon: 'fa-magnifying-glass', color: 'blue' }));
        return items.sort((a, b) => (b._ts || 0) - (a._ts || 0));
    },

    // ── 章节弹药 ──
    _renderAnalysis() {
        const items = (this._data?.analysis || []).filter(x => this._matchesSearch((x.title || x.name || x.id || '') + (x.content || '')));
        if (!items.length) return this._emptyState('暂无章节弹药', 'fa-magnifying-glass', 'blue');
        return `
        <div class="space-y-3">
            <div class="text-xs text-dim mb-2">共 ${items.length} 条记录</div>
            ${items.map((item, i) => `
            <div class="bg-[#0e0e10] rounded-xl border border-white/5 overflow-hidden">
                <div class="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/5 cursor-pointer" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">#${i + 1}</span>
                        <span class="text-xs font-bold text-white">${item.title || item.name || this._fmtCycleId(item.id)}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] text-dim font-mono">${(item.content || '').length}字</span>
                        <i class="fa-solid fa-chevron-down text-dim text-[10px]"></i>
                    </div>
                </div>
                <div class="hidden p-4 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto" id="fw-analysis-${i}">
                    ${typeof marked !== 'undefined' ? marked.parse(item.content || '') : (item.content || '')}
                </div>
            </div>
            `).join('')}
        </div>`;
    },

    // ── 对比弹药 ──
    _renderCompare() {
        const compares = (this._data?.compares || []).filter(x => this._matchesSearch((x.title || x.name || '') + (x.content || '')));
        const ctx = this._data?.fusionContext;
        if (!ctx?.content && !compares.length) return this._emptyState('暂无对比弹药', 'fa-code-compare', 'amber');
        let cards = compares.map((item, i) => {
            const content = item.content || '';
            return `
            <div class="bg-[#0e0e10] rounded-xl border border-amber-500/10 overflow-hidden">
                <div class="flex items-center justify-between px-4 py-2.5 bg-amber-500/[0.03] border-b border-white/5 cursor-pointer" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">#${i + 1}</span>
                        <span class="text-xs font-bold text-white">${item.title || item.name || '对比弹药'}</span>
                    </div>
                    <span class="text-[10px] text-dim font-mono">${content.length}字</span>
                </div>
                <div class="hidden p-4 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[480px] overflow-y-auto">
                    ${typeof marked !== 'undefined' ? marked.parse(content) : content}
                </div>
            </div>`;
        }).join('');
        if (ctx?.content) {
            const content = ctx.content || '';
            const compareMatch = content.match(/(?:对比分析|技法差异|对比结果)[\s\S]*?(?=(?:融合精华|循环融合|循环总结|细纲|$))/i);
            const displayContent = compareMatch ? compareMatch[0] : content.slice(0, 8000);
            cards += `
            <div class="bg-[#0e0e10] rounded-xl border border-white/5 overflow-hidden">
                <div class="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-white/5">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-code-compare text-amber-400"></i>
                        <span class="text-sm font-bold text-white">全局对比缓存</span>
                    </div>
                    <div class="flex gap-1">
                        <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.fusion_workbench._copyText('${this._escapeAttr(displayContent)}')">复制</button>
                        <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.fusion_workbench._download('对比弹药.txt', '${this._escapeAttr(displayContent)}')">下载</button>
                    </div>
                </div>
                <div class="p-5 text-sm text-gray-300 leading-loose whitespace-pre-wrap max-h-[480px] overflow-y-auto">
                    ${typeof marked !== 'undefined' ? marked.parse(displayContent) : displayContent}
                </div>
            </div>`;
        }
        return `<div class="space-y-3">${cards}</div>`;
    },

    // ── 融合精华 ──
    _renderFusion() {
        const d = this._data || {};
        const cycles = (d.cycles || []).filter(x => this._matchesSearch(x.id + (x.content || '')));
        const ammo = (d.fusionAmmos || []).filter(x => this._matchesSearch((x.name || '') + (x.content || '')));
        const hasGlobal = d.fusionContext?.content;
        if (!hasGlobal && !cycles.length && !ammo.length) return this._emptyState('暂无融合精华', 'fa-wand-magic-sparkles', 'green');
        let html = '<div class="space-y-4">';
        html += ammo.map((a, i) => `
            <div class="bg-[#0e0e10] rounded-xl border border-green-500/10 overflow-hidden">
                <div class="flex items-center justify-between px-4 py-2.5 bg-green-500/[0.03] border-b border-white/5 cursor-pointer" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-mono">弹药${i + 1}</span>
                        <span class="text-xs font-bold text-white">${a.name || '融合弹药'}</span>
                    </div>
                    <span class="text-[10px] text-dim font-mono">${(a.content || '').length}字</span>
                </div>
                <div class="hidden p-4 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                    ${typeof marked !== 'undefined' ? marked.parse(a.content || '') : (a.content || '')}
                </div>
            </div>
        `).join('');
        if (hasGlobal) {
            const ctx = d.fusionContext;
            html += `
            <div class="bg-[#0e0e10] rounded-xl border border-white/5 overflow-hidden">
                <div class="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-white/5">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-star text-green-400"></i>
                        <span class="text-sm font-bold text-white">全局融合精华</span>
                    </div>
                    <span class="text-[10px] text-dim font-mono">${(ctx.content || '').length}字</span>
                </div>
                <div class="p-5 text-sm text-gray-300 leading-loose whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                    ${typeof marked !== 'undefined' ? marked.parse(ctx.content.slice(0, 5000)) : ctx.content.slice(0, 5000)}
                </div>
            </div>`;
        }
        html += cycles.map((c, i) => `
            <div class="bg-[#0e0e10] rounded-xl border border-white/5 overflow-hidden">
                <div class="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/5 cursor-pointer" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-mono">循环${i + 1}</span>
                        <span class="text-xs font-bold text-white">${c.id.replace('cycle_fusion_', '第').replace('_', '-')}章</span>
                    </div>
                    <span class="text-[10px] text-dim font-mono">${(c.content || '').length}字</span>
                </div>
                <div class="hidden p-4 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                    ${typeof marked !== 'undefined' ? marked.parse(c.content || '') : (c.content || '')}
                </div>
            </div>
        `).join('');
        html += '</div>';
        return html;
    },

    // ── 融合细纲 ──
    _renderOutline() {
        const items = (this._data?.outlines || []).filter(x => this._matchesSearch(x.title + (x.content || '')));
        if (!items.length) return this._emptyState('暂无融合细纲', 'fa-list-check', 'cyan');
        return `
        <div class="space-y-3">
            ${items.map((item, i) => `
            <div class="bg-[#0e0e10] rounded-xl border border-white/5 overflow-hidden">
                <div class="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/5 cursor-pointer" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">#${i + 1}</span>
                        <span class="text-xs font-bold text-white">${item.title || '未命名细纲'}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30" onclick="event.stopPropagation();Modules.fusion_workbench.publishOutlineToWriter('${item.id}')"><i class="fa-solid fa-feather-pointed mr-1"></i>送执笔台</button>
                        <span class="text-[10px] text-dim font-mono">${(item.content || '').length}字</span>
                        <i class="fa-solid fa-chevron-down text-dim text-[10px]"></i>
                    </div>
                </div>
                <div class="hidden p-4 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                    ${typeof marked !== 'undefined' ? marked.parse(item.content || '') : (item.content || '')}
                </div>
            </div>
            `).join('')}
        </div>`;
    },

    // ── 实体库 ──
    _renderEntity() {
        const entities = (this._data?.entities || []).filter(e => this._matchesSearch(e.name + (e.desc || '') + (e.type || '')));
        if (!entities.length) return this._emptyState('暂无实体', 'fa-cubes', 'pink');
        const grouped = this._groupEntitiesByType();
        const types = Object.keys(grouped).sort();
        return `
        <div class="space-y-5">
            <!-- 类型筛选标签 -->
            <div class="flex flex-wrap gap-1.5">
                ${types.map(t => `
                <span class="px-2 py-1 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 text-[10px] font-bold">${t} (${grouped[t].length})</span>
                `).join('')}
            </div>
            <!-- 实体卡片网格 -->
            <div class="grid grid-cols-2 gap-3">
                ${entities.map((e, i) => `
                <div class="bg-[#0e0e10] rounded-xl border border-white/5 p-4 hover:border-pink-500/30 transition-all">
                    <div class="flex items-start justify-between mb-2">
                        <div>
                            <div class="text-sm font-bold text-white">${e.name}</div>
                            <div class="text-[10px] text-pink-400 mt-0.5">${e.type || '其他'}</div>
                        </div>
                        <div class="flex flex-col items-end gap-1">
                            ${e.chapterRef ? `<span class="text-[9px] text-dim bg-white/5 px-1.5 py-0.5 rounded">第${e.chapterRef.join(',')}章</span>` : ''}
                            ${e._staged ? `<button class="btn btn-xs bg-pink-600/20 text-pink-300 border-pink-600/30 text-[9px]" onclick="Modules.fusion_workbench.publishEntityToWorld('${e.id}')"><i class="fa-solid fa-atom mr-1"></i>入世界</button>` : `<span class="text-[9px] text-green-400/70">已入库</span>`}
                        </div>
                    </div>
                    <div class="text-xs text-gray-400 leading-relaxed mb-2" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${e.desc || e.description || '暂无描述'}</div>
                    ${e.relations?.length ? `
                    <div class="flex flex-wrap gap-1">
                        ${e.relations.slice(0, 5).map(r => `<span class="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-dim">${r}</span>`).join('')}
                        ${e.relations.length > 5 ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-dim">+${e.relations.length - 5}</span>` : ''}
                    </div>` : ''}
                </div>
                `).join('')}
            </div>
        </div>`;
    },

    _groupEntitiesByType() {
        const grouped = {};
        (this._data?.entities || []).forEach(e => {
            const t = e.type || '其他';
            if (!grouped[t]) grouped[t] = [];
            grouped[t].push(e);
        });
        return grouped;
    },

    // ── 正文创作 ──
    _renderWrite() {
        const items = (this._data?.writings || []).filter(x => this._matchesSearch(x.title + (x.content || '')));
        if (!items.length) return this._emptyState('暂无正文创作', 'fa-feather-pointed', 'orange');
        return `
        <div class="space-y-3">
            ${items.map((item, i) => `
            <div class="bg-[#0e0e10] rounded-xl border border-white/5 overflow-hidden">
                <div class="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/5 cursor-pointer" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 font-mono">#${i + 1}</span>
                        <span class="text-xs font-bold text-white">${item.title || '未命名正文'}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30" onclick="event.stopPropagation();Modules.fusion_workbench.publishWritingToWriter('${item.id}')"><i class="fa-solid fa-feather-pointed mr-1"></i>送执笔台</button>
                        <span class="text-[10px] text-dim font-mono">${(item.content || '').length}字</span>
                        <i class="fa-solid fa-chevron-down text-dim text-[10px]"></i>
                    </div>
                </div>
                <div class="hidden p-4 text-sm text-gray-300 leading-loose whitespace-pre-wrap max-h-[500px] overflow-y-auto font-serif">
                    ${typeof marked !== 'undefined' ? marked.parse(item.content || '') : (item.content || '')}
                </div>
            </div>
            `).join('')}
        </div>`;
    },

    // ── 循环融合 ──
    _renderCycle() {
        const items = (this._data?.worldCycles || []).filter(x => this._matchesSearch(x.id + (x.content || '')));
        if (!items.length) return this._emptyState('暂无循环融合', 'fa-arrows-spin', 'indigo');
        return `
        <div class="space-y-3">
            ${items.map((item, i) => `
            <div class="bg-[#0e0e10] rounded-xl border border-white/5 overflow-hidden">
                <div class="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/5 cursor-pointer" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">循环${item.cycleNum || i + 1}</span>
                        <span class="text-xs font-bold text-white">第${item.startChapter || '?'}-${item.endChapter || '?'}章</span>
                    </div>
                    <div class="flex items-center gap-2">
                        ${item.id?.startsWith('fwb_cycle_') ? (item.publishedCycleId ? `<span class="text-[10px] text-green-400"><i class="fa-solid fa-check mr-1"></i>已入世界</span>` : `<button class="btn btn-xs bg-indigo-600/20 text-indigo-300 border-indigo-600/30" onclick="event.stopPropagation();Modules.fusion_workbench.publishCycleToWorld('${item.id}')"><i class="fa-solid fa-atom mr-1"></i>入世界</button>`) : ''}
                        <span class="text-[10px] text-dim font-mono">${(item.fusionEssence || item.content || '').length}字</span>
                        <i class="fa-solid fa-chevron-down text-dim text-[10px]"></i>
                    </div>
                </div>
                <div class="hidden p-4 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                    ${typeof marked !== 'undefined' ? marked.parse(item.fusionEssence || item.content || '') : (item.fusionEssence || item.content || '')}
                </div>
            </div>
            `).join('')}
        </div>`;
    }
});
