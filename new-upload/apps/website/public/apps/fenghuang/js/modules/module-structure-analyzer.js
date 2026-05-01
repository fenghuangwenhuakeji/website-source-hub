// 文件路径: js/modules/module-structure-analyzer.js
// 描述: 章节结构分析器模块。
function initStructureAnalyzerPanel() {
    document.getElementById('analyze-structure-btn').addEventListener('click', handleAnalyzeStructure);
}

async function handleAnalyzeStructure() {
    const text = document.getElementById('structure-input-area').value.trim();
    if (text.length < 100) {
        showNotification("请输入至少100字的章节内容以便分析。", "warning");
        return;
    }
    showLoading('正在分析章节结构...');
    const outputCard = document.getElementById('structure-analysis-output');
    const outputContent = document.getElementById('structure-report-content');
    outputCard.style.display = 'block';
    outputContent.innerHTML = `<p class="placeholder-text"><i class="fas fa-spinner fa-spin"></i> AI编辑正在分析章节的起承转合...</p>`;
    
    const prompt = `
# 身份：你是一位资深的网文结构分析师，精通爽文的节奏控制，并且是“循环四章深化模式”理论的专家。
# 理论框架：
一个健康的爽文章节通常遵循“循环四章深化模式”的微观结构：
1.  **任务建立**：引入新的目标、悬念或挑战。
2.  **困难升级**：主角在执行任务中遇到具体的、不断升级的困难和阻碍。
3.  **突破爆发**：主角通过智慧或实力，找到关键方法，在高潮中解决问题。
4.  **收获升级**：主角完成任务，获得实质性的奖励（能力、地位、财富），并为下一个循环埋下伏笔。

# 任务：
请分析以下【章节文本】，判断其在多大程度上符合上述的四步结构，并以Markdown格式输出一份清晰的诊断报告。

# 【章节文本】：
---
${text}
---

# 输出报告要求 (必须覆盖)：
- **结构符合度评分**：给出一个1-5星的评分 (⭐)。
- **阶段分析**：逐一分析文本中是否体现了“任务建立”、“困难升级”、“突破爆发”、“收获升级”这四个阶段。如果某个阶段缺失或薄弱，请明确指出。
- **节奏诊断**：评价本章的阅读节奏是“过快”、“过慢”还是“张弛有度”。
- **优化建议**：提出1-2条具体的、可操作的修改建议来加强本章的结构感和爽点。
`;

    try {
        const report = await callAI(prompt);
        const converter = new showdown.Converter();
        outputContent.innerHTML = converter.makeHtml(report);
        showNotification("章节结构诊断报告已生成！", "success");
    } catch (error) {
        outputContent.innerHTML = `<p class="placeholder-text" style="color:var(--accent-danger);">分析失败: ${error.message}</p>`;
    } finally {
        hideLoading();
    }
}