// 文件路径: js/modules/module-logic-checker.js
// 描述: 逻辑纠察器模块。
function initLogicCheckerPanel() {
    document.getElementById('analyze-logic-btn').addEventListener('click', handleAnalyzeLogic);
}

async function handleAnalyzeLogic() {
    const text = document.getElementById('logic-input-area').value.trim();
    if (!text) {
        showNotification("请输入需要分析的文本。", "warning");
        return;
    }
    showLoading('正在进行逻辑纠察...');
    const outputCard = document.getElementById('logic-analysis-output');
    const outputContent = document.getElementById('logic-report-content');
    outputCard.style.display = 'block';
    outputContent.innerHTML = '<p class="placeholder-text"><i class="fas fa-spinner fa-spin"></i> AI审稿人正在逐行扫描文本...</p>';

    const prompt = `
# 身份：你是一位逻辑极其严谨、对情节一致性有洁癖的顶级小说审稿人。
# 任务：请仔细阅读以下【文本片段】，找出其中所有潜在的逻辑问题，并以清晰的Markdown格式报告返回。
# 检查维度 (必须覆盖)：
1.  **情节矛盾 (吃书)**：是否存在与前文设定相违背的情节。
2.  **人物OOC (Out of Character)**：角色的行为、语言是否与其既定性格、动机相符。
3.  **常识与设定漏洞**：是否存在违背基本常识或故事内部设定的地方。
4.  **因果链断裂**：事件的发生是否缺乏合理的前因，或没有产生应有的后果。
5.  **“逻辑留白”分析**：分析文本中是否存在作者有意为之的“逻辑留白”，并评估其运用是否巧妙。

# 【待分析的文本】：
---
${text}
---

# 输出要求：
- 如果没有发现问题，请明确指出“**经检查，未发现明显的逻辑问题。**”。
- 如果发现问题，请按以下格式逐条列出：
  **【问题类型】**：[例如：情节矛盾]
  **【原文定位】**：[引用出现问题的原文句子]
  **【问题分析】**：[详细解释为什么这里存在逻辑问题]
  **【修改建议】**：[提出具体的、可操作的修改方案]
`;

    try {
        const report = await callAI(prompt);
        const converter = new showdown.Converter();
        outputContent.innerHTML = converter.makeHtml(report);
        showNotification("逻辑诊断报告已生成！", "success");
    } catch (error) {
        outputContent.innerHTML = '<p class="placeholder-text" style="color:var(--accent-danger);">分析失败: ' + error.message + '</p>';
    } finally {
        hideLoading();
    }
}