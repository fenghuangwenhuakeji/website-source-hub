Object.assign(Modules.fusion_workbench, {
    // ── 技法拆解 ──
    _renderAnalysis() {
        const items = (this._data?.analysis || []).filter(x => this._matchesSearch(x.id + (x.content || '')));
        if (!items.length) return this._emptyState('暂无技法拆解结果', 'fa-magnifying-glass', 'blue');
        return `
        <div class="space-y-3">
            <div class="text-xs text-dim mb-2">共 ${items.length} 条记录</div>
            ${items.map((item, i) => `
            <div class="bg-[#0e0e10] rounded-xl border border-white/5 overflow-hidden">
                <div class="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/5 cursor-pointer" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">#${i + 1}</span>
                        <span class="text-xs font-bold text-white">${this._fmtCycleId(item.id)}</span>
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

    // ── 对比分析 ──
    _renderCompare() {
        const ctx = this._data?.fusionContext;
        if (!ctx?.content) return this._emptyState('暂无对比分析结果', 'fa-code-compare', 'amber');
        // 提取对比部分（通常位于融合上下文的前部或标记为对比的部分）
        const content = ctx.content || '';
        const compareMatch = content.match(/(?:对比分析|技法差异|对比结果)[\s\S]*?(?=(?:融合精华|循环总结|细纲|$))/i);
        const displayContent = compareMatch ? compareMatch[0] : content.slice(0, 8000);
        return `
        <div class="bg-[#0e0e10] rounded-xl border border-white/5 overflow-hidden">
            <div class="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-white/5">
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-code-compare text-amber-400"></i>
                    <span class="text-sm font-bold text-white">对比分析</span>
                </div>
                <div class="flex gap-1">
                    <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.fusion_workbench._copyText('${this._escapeAttr(displayContent)}')">复制</button>
                    <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.fusion_workbench._download('对比分析.txt', '${this._escapeAttr(displayContent)}')">下载</button>
                </div>
            </div>
            <div class="p-5 text-sm text-gray-300 leading-loose whitespace-pre-wrap max-h-[calc(100vh-200px)] overflow-y-auto">
                ${typeof marked !== 'undefined' ? marked.parse(displayContent) : displayContent}
            </div>
        </div>`;
    },

    // ── 融合精华 ──
    _renderFusion() {
        const d = this._data || {};
        const cycles = (d.cycles || []).filter(x => this._matchesSearch(x.id + (x.content || '')));
        const hasGlobal = d.fusionContext?.content;
        if (!hasGlobal && !cycles.length) return this._emptyState('暂无融合精华', 'fa-wand-magic-sparkles', 'green');
        let html = '<div class="space-y-4">';
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
                        ${e.chapterRef ? `<span class="text-[9px] text-dim bg-white/5 px-1.5 py-0.5 rounded">第${e.chapterRef.join(',')}章</span>` : ''}
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

    // ── 循环总结 ──
    _renderCycle() {
        const items = (this._data?.worldCycles || []).filter(x => this._matchesSearch(x.id + (x.content || '')));
        if (!items.length) return this._emptyState('暂无循环总结', 'fa-arrows-spin', 'indigo');
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
    },

});