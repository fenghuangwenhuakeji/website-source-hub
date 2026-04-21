// 文件路径: js/modules/module-dialogue-analyzer.js
// 描述: 对话分析器模块 (由 Gemini 博士为您实现)。
function initDialogueAnalyzerPanel() {
    document.getElementById('analyze-dialogue-btn').addEventListener('click', handleAnalyzeDialogue);
}

async function handleAnalyzeDialogue() {
    const text = document.getElementById('dialogue-input-area').value.trim();
    if (text.length < 100) {
        showNotification("请输入至少100字的文本以便进行有效分析。", "warning");
        return;
    }
    showLoading('正在分析对话...');
    const outputCard = document.getElementById('dialogue-analysis-output');
    const outputContent = document.getElementById('dialogue-report-content');
    outputCard.style.display = 'block';
    outputContent.innerHTML = '<p class="placeholder-text"><i class="fas fa-spinner fa-spin"></i> AI剧本医生正在分析对话的逻辑与功能性...</p>';

    const prompt = `
# 身份：你是一位顶级的剧本医生和小说编辑，精通对话分析，并且是“思维链”理论的专家。
# 理论框架：“思维链”对话评估
1.  **功能性 (Functionality)**：这段对话是否推动了情节发展？是否揭示了角色性格或背景信息？
2.  **角色区分度 (Character Voice)**：每个角色的语言风格是否与其身份、性格相符？能否只看对话就分辨出是谁在说话？
3.  **潜台词 (Subtext)**：对话的表面意思之下，是否隐藏着未言明的欲望、恐惧或意图？
4.  **节奏与效率 (Pacing & Efficiency)**：对话是否存在冗余信息？节奏是快是慢？是否与场景氛围匹配？
5.  **数据分析**：对话在文本中的占比是多少？主要角色的发言频率如何？

# 任务：
请分析以下【章节文本】，并严格按照上述理论框架，以Markdown格式输出一份清晰的对话诊断报告。

# 【章节文本】：
---
${text}
---

# 输出报告要求 (必须覆盖)：
- **【数据概览】**：估算对话部分占总文本的百分比，并列出主要角色的发言次数。
- **【功能性评估】**：分析对话的核心功能完成度。
- **【角色区分度评估】**：评价角色语言是否具有辨识度。
- **【潜台词分析】**：挖掘一两处有代表性的潜台词。
- **【节奏与效率诊断】**：评价对话的节奏，并指出可精简之处。
- **【综合优化建议】**：提出1-2条具体的、可操作的修改建议。
`;

    try {
        const report = await callAI(prompt);
        const converter = new showdown.Converter();
        outputContent.innerHTML = converter.makeHtml(report);
        showNotification("对话分析报告已生成！", "success");
    } catch (error) {
        outputContent.innerHTML = '<p class="placeholder-text" style="color:var(--accent-danger);">分析失败: ' + error.message + '</p>';
    } finally {
        hideLoading();
    }
}