// 文件路径: js/modules/module-ai-total-review.js
// 描述: AI总编一键审核模块。
function initAiTotalReviewPanel() {
    document.getElementById('start-final-review-btn').addEventListener('click', handleFinalReview);
}

async function handleFinalReview() {
    const text = document.getElementById('review-full-text').value.trim();
    if (text.length < 500) {
        showNotification("请输入至少500字以便进行有意义的评估。", "warning");
        return;
    }
    showLoading('总编审核中...');
    const outputCard = document.getElementById('final-review-output');
    const outputContent = document.getElementById('review-text-report');
    outputCard.style.display = 'block';
    outputContent.innerHTML = `<p class="placeholder-text"><i class="fas fa-spinner fa-spin"></i> AI总编正在进行多维度深度分析...</p>`;

    const prompt = `
# 身份与角色
你是一位具备20年网络文学写作经验的顶级小说分析师，对主流小说平台的爆款作品了如指掌。你的核心任务是，对提供的【待审核文本】，进行一次深入、客观、量化的“小说质量评估”，并严格按照指定的双重格式（JSON数据 + Markdown报告）输出。

# 核心评估模型：小说质量量化评估体系
你必须严格遵循以下评分标准，对文本的每个维度进行1-5分的量化评分（5分最佳）。
## I. 词汇与措辞
### A. 过度使用的AI词语: 统计“深入、图景、领域、视角、本质”等词。5分(0-1次) - 1分(≥8次)。
### B. 词汇多样性: 估算(独特词数/总词数)。5分(>0.7) - 1分(<0.4)。
## II. 句子结构与语法
### A. 句子长度变化: 5分(长短句错落有致) - 1分(句长高度统一)。
### B. 修辞手法运用: 5分(适度且有效) - 1分(过度使用)。
### C. 被动语态: 5分(极少) - 1分(为主)。
## III. 比喻语言与意象
### A. 比喻使用: 5分(原创且深刻) - 1分(陈词滥调)。
### B. 感官语言: 5分(丰富生动) - 1分(无)。
## IV. 整体连贯性、语气与流畅度
### A. 逻辑流畅度: 5分(逻辑清晰，过渡自然) - 1分(支离破碎)。
### B. 语气一致性: 5分(语气一致且恰当) - 1分(反复无常)。
### C. 原创性与见解: 5分(原创、有见地) - 1分(依赖陈词滥调)。

# 输出格式指令 (必须严格遵守)
你的输出必须包含两部分，由特定标记分隔。
## 第一部分：JSON数据
以 \`@@@JSON_START@@@\` 开始，以 \`@@@JSON_END@@@\` 结束。内容为一个JSON对象，包含10个评估维度的评分。
\`\`\`json
@@@JSON_START@@@
{
  "overused_words": <评分>, "lexical_diversity": <评分>, "sentence_variety": <评分>, "rhetoric_use": <评分>, 
  "passive_voice": <评分>, "metaphor_quality": <评分>, "sensory_language": <评分>, "logical_flow": <评分>, 
  "tone_consistency": <评分>, "originality": <评分>
}
@@@JSON_END@@@
\`\`\`
## 第二部分：Markdown详细报告
以 \`@@@MARKDOWN_START@@@\` 开始，以 \`@@@MARKDOWN_END@@@\` 结束。内容为详细的定性评估报告。
\`\`\`markdown
@@@MARKDOWN_START@@@
### I. 词汇与措辞分析
**A. 过度使用的词语**: [定性评估]
**B. 词汇多样性与原创性**: [定性评估]
... (以此类推) ...
### 综合评估与总结
[给出总体评价]
@@@MARKDOWN_END@@@
\`\`\`
# 【待审核文本】:
---
${text}
---
请立即开始你的分析工作。`;

    try {
        const fullResponse = await callAI(prompt);
        const jsonMatch = fullResponse.match(/@@@JSON_START@@@([\s\S]*?)@@@JSON_END@@@/);
        const markdownMatch = fullResponse.match(/@@@MARKDOWN_START@@@([\s\S]*?)@@@MARKDOWN_END@@@/);

        if (!jsonMatch || !markdownMatch) throw new Error("AI返回的格式不符合预期的双重格式规范。");
        
        const data = JSON.parse(jsonMatch[1]);
        const markdownPart = markdownMatch[1];
        
        renderReviewChart(data);
        const converter = new showdown.Converter();
        outputContent.innerHTML = converter.makeHtml(markdownPart);
        showNotification("总编审核报告已生成！", "success");
    } catch (error) {
        outputContent.innerHTML = `<p class="placeholder-text" style="color:var(--accent-danger);">审核失败: ${error.message}。</p>`;
    } finally {
        hideLoading();
    }
}

function renderReviewChart(data) {
    const chartDom = document.getElementById('review-chart-container');
    if (!chartDom || !data) return;
    const myChart = echarts.init(chartDom);
    
    const indicatorMap = {
        "overused_words": "AI词汇规避", "lexical_diversity": "词汇多样性", "sentence_variety": "句式变化",
        "rhetoric_use": "修辞运用", "passive_voice": "主动语态", "metaphor_quality": "比喻质量",
        "sensory_language": "感官语言", "logical_flow": "逻辑流畅", "tone_consistency": "语气一致", "originality": "原创性"
    };

    const option = {
        title: { text: '小说质量量化评估雷达图', left: 'center', textStyle: { color: 'var(--accent-primary)' } },
        tooltip: { trigger: 'item' },
        radar: {
            indicator: Object.values(indicatorMap).map(name => ({ name: name, max: 5 })),
            radius: '65%',
            axisName: { color: 'var(--text-primary)' },
        },
        series: [{
            name: '小说质量评估', type: 'radar',
            data: [{
                value: Object.keys(indicatorMap).map(key => data[key] || 0),
                name: '本次评估',
                areaStyle: { color: 'rgba(79, 70, 229, 0.4)' },
                itemStyle: { color: 'var(--accent-primary)' },
                lineStyle: { color: 'var(--accent-primary)' }
            }]
        }]
    };
    myChart.setOption(option);
    window.addEventListener('resize', () => myChart.resize());
}