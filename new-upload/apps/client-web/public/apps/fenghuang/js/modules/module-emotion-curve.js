// 文件路径: js/modules/module-emotion-curve.js
// 描述: 斐波那契心跳规划器模块。
function initEmotionCurvePanel() {
    document.getElementById('add-emotion-point-btn')?.addEventListener('click', addEmotionPoint);
    document.getElementById('analyze-outline-emotion-btn')?.addEventListener('click', handleAnalyzeOutlineForEmotion);
    renderEmotionCurve();
}

function addEmotionPoint() {
    const chapterInput = document.getElementById('emotion-chapter-input');
    const valueInput = document.getElementById('emotion-value-input');
    const eventInput = document.getElementById('emotion-event-input');
    
    const chapter = chapterInput.value.trim();
    const value = parseInt(valueInput.value, 10);
    const event = eventInput.value.trim();

    if (!chapter || isNaN(value) || !event) {
        showNotification("请填写完整的节点、情绪值和事件描述。", "warning");
        return;
    }
    
    let state = getState();
    if (!state.pipeline.emotionCurve) state.pipeline.emotionCurve = [];
    
    state.pipeline.emotionCurve.push({ name: chapter, value: value, event: event });
    
    // Sort logic here if needed
    
    updateState({ pipeline: state.pipeline });
    chapterInput.value = '';
    eventInput.value = '';
    renderEmotionCurve();
}

function renderEmotionCurve() {
    const chartDom = document.getElementById('emotion-curve-chart');
    if (!chartDom || typeof echarts === 'undefined') return;
    
    const myChart = echarts.init(chartDom);
    const emotionData = getState().pipeline.emotionCurve || [];
    
    const option = {
        title: { text: '故事情绪曲线', textStyle: { color: 'var(--text-primary)' } },
        tooltip: { trigger: 'axis', formatter: params => `${params[0].name}<br/>情绪值: ${params[0].value}<br/>事件: ${emotionData[params[0].dataIndex].event}` },
        xAxis: { type: 'category', data: emotionData.map(p => p.name), axisLine: { lineStyle: { color: 'var(--text-secondary)' } } },
        yAxis: { type: 'value', min: -10, max: 10, axisLine: { lineStyle: { color: 'var(--text-secondary)' } } },
        series: [{ data: emotionData.map(p => p.value), type: 'line', smooth: true, areaStyle: {}, itemStyle: { color: 'var(--accent-primary)' } }]
    };
    myChart.setOption(option);
    window.addEventListener('resize', () => myChart.resize());
}

async function handleAnalyzeOutlineForEmotion() {
    const outline = getState().pipeline.outline;
    if (!outline) {
        showNotification("请先在流水线中生成故事大纲。", "warning");
        return;
    }
    showLoading('正在智能分析情绪曲线...');

    const prompt = `
# 身份：你是一位精通“斐波那契脉冲心跳情绪节奏系统”的叙事分析师。
# 任务：请阅读以下【故事大纲】，分析其中每一章的核心情节，并为每一章评估一个情绪值（-10到+10之间）。
# 【故事大纲】：
---
${outline}
---
# 输出要求 (必须严格遵守)：
- 你的回答必须是一个JSON格式的数组，不包含任何其他解释。
- 数组中的每个元素都是一个包含三个值的子数组：["章节标题", 情绪值, "关键事件总结"]。
- 示例格式:
[
  ["第一章：风起云涌", -5, "主角被家族背叛，跌入谷底"],
  ["第二章：偶遇奇缘", 8, "主角获得神秘传承，实力大增"]
]`;

    try {
        const result = await callAI(prompt, true);
        const emotionData = result.map(item => ({name: item[0], value: item[1], event: item[2]}));
        updateState({ pipeline: { ...getState().pipeline, emotionCurve: emotionData } });
        renderEmotionCurve();
        showNotification("已智能分析大纲并生成情绪曲线！", "success");
    } catch (error) {
        showNotification(`分析失败: ${error.message}`, "error");
    } finally {
        hideLoading();
    }
}