// writer_rhythm.js — 剧情节奏可视化 (Plot Rhythm Visualizer)
// 对标: 星月写作 剧情张力分析（可视化折线图）
// 使用ECharts生成冲突强度/情感起伏/信息密度/对话比例的折线图
Object.assign(Modules.writer, {
    _rhythmData: null,

    async _analyzeRhythm() {
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        if (!content.trim()) return UI.toast('请先写入内容');

        const prompt = `你是一位数据分析专家。请对以下小说章节进行节奏分析，按每500字为一个分析单元，输出结构化数据。

【待分析文本】
${content.slice(0, 8000)}

请按以下JSON格式输出（仅输出JSON，不要其他文字）：
{
  "segments": [
    {"range": "0-500字", "conflict": 7, "emotion": 5, "info_density": 6, "dialogue_ratio": 30, "label": "开篇悬念"},
    ...
  ],
  "highlights": [
    {"pos": "1000字", "type": "高潮", "desc": "主角发现真相"},
    ...
  ],
  "warnings": [
    {"pos": "2500字", "type": "平淡", "desc": "连续800字无冲突，建议插入转折"},
    ...
  ],
  "summary": "本章整体节奏评价"
}

评分标准（1-10分）：
- conflict: 冲突强度（1=平静，10=激烈对抗）
- emotion: 情感起伏（1=平淡，10=强烈情绪）
- info_density: 信息密度（1=水分大，10=信息饱和）
- dialogue_ratio: 对话占比（百分比）`;

        let result = '';
        try {
            await AI.generate(prompt, {}, chunk => { result += chunk; });

            // 解析JSON
            let data = null;
            try {
                const jsonMatch = result.match(/\{[\s\S]*\}/);
                if (jsonMatch) data = JSON.parse(jsonMatch[0]);
            } catch(e) {}

            if (data) {
                this._rhythmData = data;
                this._renderRhythmChart(data);
            } else {
                const resultEl = document.getElementById('w-diagnose-result');
                if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>`;
            }
        } catch(e) {
            UI.toast('节奏分析失败: ' + e.message, 'error');
        }
    },

    _renderRhythmChart(data) {
        const resultEl = document.getElementById('w-diagnose-result');
        if (!resultEl || !data || !data.segments) return;

        const segments = data.segments;
        const ranges = segments.map(s => s.range);
        const conflicts = segments.map(s => s.conflict);
        const emotions = segments.map(s => s.emotion);
        const infos = segments.map(s => s.info_density);
        const dialogues = segments.map(s => s.dialogue_ratio);

        // 生成HTML + ECharts配置
        const chartId = 'rhythm-chart-' + Date.now();
        resultEl.innerHTML = `
        <div class="space-y-3">
            <div class="text-[10px] font-bold text-white"><i class="fa-solid fa-chart-line mr-1"></i>剧情节奏分析</div>
            <div id="${chartId}" style="width:100%;height:280px;"></div>
            ${data.highlights && data.highlights.length ? `
            <div class="p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div class="text-[9px] font-bold text-green-400 mb-1"><i class="fa-solid fa-star mr-1"></i>亮点标注</div>
                ${data.highlights.map(h => `<div class="text-[10px] text-dim">• ${h.pos}: <span class="text-green-300">${h.type}</span> — ${h.desc}</div>`).join('')}
            </div>` : ''}
            ${data.warnings && data.warnings.length ? `
            <div class="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div class="text-[9px] font-bold text-amber-400 mb-1"><i class="fa-solid fa-triangle-exclamation mr-1"></i>节奏警示</div>
                ${data.warnings.map(w => `<div class="text-[10px] text-dim">• ${w.pos}: <span class="text-amber-300">${w.type}</span> — ${w.desc}</div>`).join('')}
            </div>` : ''}
            ${data.summary ? `<div class="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] text-blue-300">${data.summary}</div>` : ''}
        </div>`;

        // 初始化ECharts
        setTimeout(() => {
            const chartEl = document.getElementById(chartId);
            if (!chartEl || typeof echarts === 'undefined') return;
            const chart = echarts.init(chartEl);
            chart.setOption({
                backgroundColor: 'transparent',
                grid: { left: 40, right: 20, top: 30, bottom: 40 },
                legend: { data: ['冲突强度', '情感起伏', '信息密度', '对话占比'], textStyle: { color: '#888', fontSize: 9 }, top: 0 },
                tooltip: { trigger: 'axis', backgroundColor: 'rgba(14,14,16,0.95)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#ccc', fontSize: 10 } },
                xAxis: { type: 'category', data: ranges, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, axisLabel: { color: '#666', fontSize: 8, rotate: 30 } },
                yAxis: { type: 'value', max: 10, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, axisLabel: { color: '#666', fontSize: 8 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
                series: [
                    { name: '冲突强度', type: 'line', data: conflicts, smooth: true, lineStyle: { color: '#ef4444', width: 2 }, itemStyle: { color: '#ef4444' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(239,68,68,0.3)' }, { offset: 1, color: 'rgba(239,68,68,0)' }] } } },
                    { name: '情感起伏', type: 'line', data: emotions, smooth: true, lineStyle: { color: '#a855f7', width: 2 }, itemStyle: { color: '#a855f7' } },
                    { name: '信息密度', type: 'line', data: infos, smooth: true, lineStyle: { color: '#3b82f6', width: 2 }, itemStyle: { color: '#3b82f6' } },
                    { name: '对话占比', type: 'line', data: dialogues.map(v => v / 10), smooth: true, lineStyle: { color: '#22c55e', width: 2 }, itemStyle: { color: '#22c55e' } }
                ]
            });
        }, 100);
    }
});
