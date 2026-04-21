// 文件路径: js/modules/module-tag-generator.js
// 描述: 智能标签生成器模块。
function initTagGeneratorPanel() {
    document.getElementById('analyze-tags-btn')?.addEventListener('click', handleAnalyzeTags);
}

async function handleAnalyzeTags() {
    const text = document.getElementById('tag-input-area').value.trim();
    if (!text) {
        showNotification("请输入小说简介或卖点。", "warning");
        return;
    }
    showLoading('正在生成标签...');
    const outputCard = document.getElementById('tag-analysis-output');
    const outputContent = document.getElementById('tag-report-content');
    if(outputCard) outputCard.style.display = 'block';
    if(outputContent) outputContent.innerHTML = `<p class="placeholder-text"><i class="fas fa-spinner fa-spin"></i> AI正在分析市场热点...</p>`;

    const prompt = `
# 身份：你是一位深谙各大网络小说平台算法和用户偏好的顶级运营编辑。
# 任务：请仔细阅读以下【小说简介/卖点】，并生成一份最适合用于推广的标签列表。
# 【小说简介/卖点】：
---
${text}
---
# 输出要求 (必须严格遵守)：
- **分类生成**：你的回答必须分为三个类别：【核心标签】、【流量标签】和【内容标签】。
- **格式要求**：每个类别下，直接列出3-5个最相关的标签，标签之间用空格隔开。
- **风格洞察**：在生成标签时，要敏锐地判断简介内容更偏向哪种平台风格（如番茄、知乎等），并选择对应平台最热门的标签词汇。
- **直接输出**：不要添加任何额外的解释或说明，直接输出三个类别的标签列表。
`;

    try {
        const report = await callAI(prompt);
        if (outputContent) {
            const categories = report.split('【').slice(1);
            let html = '';
            categories.forEach(cat => {
                const parts = cat.split('】');
                const title = parts[0];
                const tags = parts[1].trim().split(/\s+/);
                html += `<h4>${Utils.escapeHTML(title)}</h4><div class="tags-container">`;
                html += tags.map(t => `<span class="tag-item">${Utils.escapeHTML(t)}</span>`).join('');
                html += '</div>';
            });
            outputContent.innerHTML = html;
        }
        showNotification("小说标签已生成！", "success");
    } catch (error) {
        if(outputContent) outputContent.innerHTML = '<p class="placeholder-text" style="color:var(--accent-danger);">分析失败: ' + error.message + '</p>';
    } finally {
        hideLoading();
    }
}