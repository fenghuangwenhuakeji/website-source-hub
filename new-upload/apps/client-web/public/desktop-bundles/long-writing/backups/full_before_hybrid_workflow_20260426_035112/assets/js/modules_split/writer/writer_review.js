// writer_review.js — 智能审稿系统 (Manuscript Review)
// 对标: 白梦写作 AI智能审稿 + 星月写作 剧情张力分析
// 7维度多维度评估，雷达图展示，逐条修改建议
Object.assign(Modules.writer, {
    _reviewResult: null,
    _reviewHistory: [],

    _renderReviewPanel() {
        return `
        <div id="w-review-panel" class="hidden absolute right-0 top-0 w-80 h-full bg-[#0e0e10] border-l border-white/5 flex flex-col z-20">
            <div class="shrink-0 p-3 border-b border-white/5 bg-gradient-to-r from-blue-900/20 to-transparent">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-glasses text-blue-400"></i>
                        <span class="font-bold text-white text-xs">AI 智能审稿</span>
                    </div>
                    <button class="text-dim hover:text-white text-xs" onclick="Modules.writer._toggleReviewPanel()"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto p-3 space-y-3" id="w-review-content">
                <div class="text-center py-8 text-dim text-xs">
                    <i class="fa-solid fa-glasses text-2xl mb-2 opacity-30"></i>
                    <div>点击"开始审稿"分析当前章节</div>
                </div>
            </div>
            <div class="shrink-0 p-3 border-t border-white/5">
                <button class="w-full btn bg-blue-600/20 text-blue-400 border-blue-600/30 hover:bg-blue-600/30 font-bold text-xs py-2 rounded-lg" onclick="Modules.writer._runReview()">
                    <i class="fa-solid fa-magnifying-glass-chart mr-1"></i>开始审稿
                </button>
            </div>
        </div>`;
    },

    _toggleReviewPanel() {
        const panel = document.getElementById('w-review-panel');
        if (panel) panel.classList.toggle('hidden');
    },

    async _runReview() {
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        if (!content.trim()) return UI.toast('请先写入内容再审稿');
        const contentEl = document.getElementById('w-review-content');
        if (contentEl) contentEl.innerHTML = '<div class="text-dim text-xs flex items-center gap-2 p-4"><i class="fa-solid fa-spinner fa-spin"></i>AI正在深度审稿...</div>';

        // 获取项目上下文
        let worldCtx = '', outlineCtx = '', charCtx = '';
        try {
            const activeProject = await GenesisCore.getActiveProject();
            if (activeProject?.modeData) {
                const md = activeProject.modeData;
                if (md.worldSetting) worldCtx = md.worldSetting.slice(0, 800);
                if (md.volumes && md.volumes.length) {
                    outlineCtx = md.volumes.map(v => v.title + ': ' + (v.summary || '')).join('\n').slice(0, 800);
                }
            }
            // 获取实体信息
            const entities = await DB.getAll('entities');
            if (entities && entities.length) {
                charCtx = entities.filter(e => e.type === 'character').map(e => e.name + ': ' + (e.description || '').slice(0, 100)).join('\n').slice(0, 800);
            }
        } catch(e) {}

        const prompt = `你是一位资深文学编辑，请对以下章节进行7维度专业审稿。

【项目背景】
世界观: ${worldCtx || '未提供'}
大纲: ${outlineCtx || '未提供'}
角色: ${charCtx || '未提供'}

【审稿维度】（每项满分10分）

1. 情节逻辑
   - 因果链条是否清晰？
   - 有无逻辑漏洞或前后矛盾？
   - 事件发展是否符合人物动机？

2. 人物塑造
   - 人物行为是否符合人设？
   - 对话是否有辨识度？
   - 是否有"纸片人"倾向？

3. 文笔风格
   - 句式是否有节奏感？
   - 描写是否具体生动？
   - 有无过度解释或抽象概括？

4. 节奏把控
   - 信息密度是否合理？
   - 有无拖沓或跳跃？
   - 高潮和低谷的分布？

5. 对话质量
   - 对话是否推动剧情？
   - 是否有潜台词？
   - 口语化程度？

6. 世界观一致性
   - 设定是否前后一致？
   - 新信息是否与已有设定冲突？
   - 环境描写是否符合世界观？

7. 商业潜力
   - 是否有足够的钩子？
   - 爽点/情绪点是否到位？
   - 付费点设计如何？

【输出格式要求】
请先输出JSON格式的评分（必须严格符合以下格式）：
{"plot_logic":X,"character":X,"style":X,"pacing":X,"dialogue":X,"world_consistency":X,"commercial":X,"total":X,"summary":"总体评价100字内"}

然后输出详细审稿报告：
- 每个维度的具体问题和修改建议（至少2条 actionable 建议）
- 标出具体问题段落（引用原文+修改建议）
- 给出修改优先级排序（必须改/建议改/可不改）

【待审稿件】
${content.slice(0, 5000)}`;

        let result = '';
        try {
            await AI.generate(prompt, {}, chunk => {
                result += chunk;
            });

            // 解析JSON评分
            let scores = null;
            try {
                const jsonMatch = result.match(/\{[^{}]*"plot_logic":[\d.]+[^}]*\}/);
                if (jsonMatch) scores = JSON.parse(jsonMatch[0]);
            } catch(e) {}

            this._reviewResult = { scores, report: result, chapterId: this.currentChapterId, time: new Date().toLocaleString() };
            this._reviewHistory.push(this._reviewResult);
            this._renderReviewResult(this._reviewResult);
            UI.toast('审稿完成 ✓', 'success');
        } catch(e) {
            UI.toast('审稿失败: ' + e.message, 'error');
        }
    },

    _renderReviewResult(result) {
        const contentEl = document.getElementById('w-review-content');
        if (!contentEl || !result) return;

        const scores = result.scores || {};
        const dims = [
            { key: 'plot_logic', label: '情节逻辑', color: '#ef4444' },
            { key: 'character', label: '人物塑造', color: '#f97316' },
            { key: 'style', label: '文笔风格', color: '#eab308' },
            { key: 'pacing', label: '节奏把控', color: '#22c55e' },
            { key: 'dialogue', label: '对话质量', color: '#06b6d4' },
            { key: 'world_consistency', label: '世界观一致', color: '#3b82f6' },
            { key: 'commercial', label: '商业潜力', color: '#a855f7' }
        ];

        const radarData = dims.map(d => ({ name: d.label, value: scores[d.key] || 5, color: d.color }));
        const total = scores.total || Math.round(radarData.reduce((a,b) => a + b.value, 0) / radarData.length * 10) / 10;

        // 生成简单的CSS雷达图（用条形图代替，更可靠）
        const bars = radarData.map(d => {
            const v = d.value;
            const pct = (v / 10) * 100;
            let grade = v >= 9 ? 'S' : v >= 8 ? 'A' : v >= 7 ? 'B' : v >= 6 ? 'C' : 'D';
            let gradeColor = v >= 9 ? 'text-yellow-400' : v >= 8 ? 'text-green-400' : v >= 7 ? 'text-blue-400' : v >= 6 ? 'text-orange-400' : 'text-red-400';
            return `
            <div class="flex items-center gap-2">
                <div class="w-16 text-[10px] text-dim text-right shrink-0">${d.name}</div>
                <div class="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div class="h-full rounded-full" style="width:${pct}%; background:${d.color}"></div>
                </div>
                <div class="w-8 text-[10px] font-bold ${gradeColor} text-right">${v.toFixed(1)}</div>
            </div>`;
        }).join('');

        // 解析报告文本（去除JSON部分）
        let reportText = result.report || '';
        reportText = reportText.replace(/\{[^{}]*"plot_logic":[\d.]+[^}]*\}/, '').trim();

        contentEl.innerHTML = `
        <div class="space-y-3">
            <!-- 总分 -->
            <div class="p-3 bg-white/5 rounded-lg text-center">
                <div class="text-[10px] text-dim mb-1">综合评分</div>
                <div class="text-3xl font-bold ${total >= 8 ? 'text-green-400' : total >= 6 ? 'text-amber-400' : 'text-red-400'}">${total.toFixed(1)}</div>
                <div class="text-[10px] text-dim mt-1">/ 10.0</div>
            </div>
            <!-- 雷达条形图 -->
            <div class="p-3 bg-white/5 rounded-lg space-y-1.5">
                ${bars}
            </div>
            <!-- 总体评价 -->
            ${scores.summary ? `<div class="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[11px] text-blue-300">${scores.summary}</div>` : ''}
            <!-- 详细报告 -->
            <div class="p-3 bg-[#0a0a0c] border border-white/10 rounded-lg">
                <div class="text-[10px] font-bold text-white mb-2">详细报告</div>
                <div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-[11px]">${typeof marked !== 'undefined' ? marked.parse(reportText) : reportText}</div>
            </div>
        </div>`;
    }
});
