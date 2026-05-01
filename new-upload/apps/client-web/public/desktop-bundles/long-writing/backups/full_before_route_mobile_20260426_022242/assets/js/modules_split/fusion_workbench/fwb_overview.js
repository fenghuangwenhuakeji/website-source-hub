Object.assign(Modules.fusion_workbench, {
    // ── 总览 ──
    _renderOverview() {
        const d = this._data || {};
        const stats = [
            { label: '技法拆解', count: (d.analysis || []).length, icon: 'fa-magnifying-glass', color: 'blue' },
            { label: '对比分析', count: d.fusionContext?.content ? 1 : 0, icon: 'fa-code-compare', color: 'amber' },
            { label: '融合精华', count: (d.cycles || []).length + (d.fusionContext?.content ? 1 : 0), icon: 'fa-wand-magic-sparkles', color: 'green' },
            { label: '融合细纲', count: (d.outlines || []).length, icon: 'fa-list-check', color: 'cyan' },
            { label: '实体数量', count: (d.entities || []).length, icon: 'fa-cubes', color: 'pink' },
            { label: '正文创作', count: (d.writings || []).length, icon: 'fa-feather-pointed', color: 'orange' },
            { label: '循环总结', count: (d.worldCycles || []).length, icon: 'fa-arrows-spin', color: 'indigo' }
        ];
        const totalChars = [
            d.fusionContext?.content?.length || 0,
            ...(d.cycles || []).map(x => x.content?.length || 0),
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
            <!-- 统计卡片 -->
            <div class="grid grid-cols-4 gap-3">
                ${stats.map(s => `
                <div class="bg-[#0e0e10] rounded-xl border border-white/5 p-4 hover:border-${s.color}-500/30 transition-all cursor-pointer" onclick="Modules.fusion_workbench.switchTab('${s.label === '技法拆解' ? 'analysis' : s.label === '对比分析' ? 'compare' : s.label === '融合精华' ? 'fusion' : s.label === '融合细纲' ? 'outline' : s.label === '实体数量' ? 'entity' : s.label === '正文创作' ? 'write' : 'cycle'}')">
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
        (d.cycles || []).forEach(c => items.push({ title: `循环总结: ${c.id.replace('cycle_fusion_', '')}`, time: fmt(c.createdAt), _ts: c.createdAt, icon: 'fa-arrows-spin', color: 'indigo' }));
        (d.outlines || []).forEach(o => items.push({ title: o.title || '融合细纲', time: fmt(o.createdAt), _ts: o.createdAt, icon: 'fa-list-check', color: 'cyan' }));
        (d.writings || []).forEach(w => items.push({ title: w.title || '融合正文', time: fmt(w.createdAt), _ts: w.createdAt, icon: 'fa-feather-pointed', color: 'orange' }));
        (d.analysis || []).forEach(a => items.push({ title: `技法拆解: ${a.id.replace('cycle_', '')}`, time: fmt(a.createdAt), _ts: a.createdAt, icon: 'fa-magnifying-glass', color: 'blue' }));
        return items.sort((a, b) => (a._ts || 0) - (b._ts || 0));
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

});