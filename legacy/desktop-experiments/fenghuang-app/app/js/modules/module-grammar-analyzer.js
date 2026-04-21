// 文件路径: js/modules/module-grammar-analyzer.js
// 描述: 语法分析与优化器模块。
function initGrammarAnalyzerPanel() {
    document.getElementById('analyze-grammar-btn').addEventListener('click', handleAnalyzeGrammar);
}

async function handleAnalyzeGrammar() {
    const text = document.getElementById('grammar-input-area').value.trim();
    if (text.length < 50) {
        showNotification("请输入至少50字的文本以便进行有效分析。", "warning");
        return;
    }
    showLoading('正在分析语法...');
    const outputCard = document.getElementById('grammar-analysis-output');
    const outputContent = document.getElementById('grammar-report-content');
    outputCard.style.display = 'block';
    outputContent.innerHTML = '<p class="placeholder-text"><i class="fas fa-spinner fa-spin"></i> AI语言学家正在分析文本...</p>';
    
    const prompt = `
# 身份：你是一位顶级的中文语言润色专家，对汉语的韵律和表达习惯有深刻的理解，尤其擅长识别并修正“翻译腔”和不自然的语法结构。
# 任务：
请仔细阅读以下【待分析文本】，并从以下三个核心维度，生成一份清晰、具体、可操作的优化报告：
1.  **【翻译腔诊断】**：检查是否存在典型的翻译腔句式（如：过多的“的”字定语、被动语态滥用等），并给出优化建议。
2.  **【“的、地、得”用法评估】**：分析“的”、“地”、“得”的使用是否过于频繁或单调，并给出优化建议。
3.  **【综合优化建议】**：从整体上评价文本的语言风格，并提出1-2条宏观的改进建议。
# 【待分析文本】：
---
${text}
---
# 输出要求：
- 使用清晰的Markdown格式进行报告。
- 如果某个维度没有发现问题，请明确指出“此项表现良好”。
`;

    try {
        const report = await callAI(prompt);
        const converter = new showdown.Converter();
        outputContent.innerHTML = converter.makeHtml(report);
        showNotification("语法诊断报告已生成！", "success");
    } catch (error) {
        outputContent.innerHTML = '<p class="placeholder-text" style="color:var(--accent-danger);">分析失败: ' + error.message + '</p>';
    } finally {
        hideLoading();
    }
}