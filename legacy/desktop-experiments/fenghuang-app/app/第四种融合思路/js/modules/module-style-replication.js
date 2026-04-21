// 文件路径: js/modules/module-style-replication.js
// 描述: 文风复刻器（仿写）模块。
function initStyleReplicationPanel() {
    document.getElementById('repli-start-btn')?.addEventListener('click', handleStyleReplication);
}

async function handleStyleReplication() {
    const styleInput = document.getElementById('repli-style-input').value.trim();
    const contentInput = document.getElementById('repli-content-input').value.trim();
    if (!styleInput || !contentInput) {
        showNotification("风格范文和新创作主题均不能为空！", "warning");
        return;
    }
    showLoading('正在进行文风复刻...');
    const outputArea = document.getElementById('repli-output');
    if(outputArea) outputArea.innerHTML = `<p class="placeholder-text"><i class="fas fa-spinner fa-spin"></i> AI正在临摹风格并创作新篇章...</p>`;

    const prompt = `
# 身份：你是一位顶级的风格模仿大师和小说家。
# 核心任务：严格遵循“两步走”原则，完成一次文风仿写。
## 第一步：风格学习
深度分析以下【风格范文】，精准提炼其语言节奏、句式结构、词汇偏好、叙事口吻和情感基调。
### 【风格范文】:
---
${styleInput}
---
## 第二步：主题创作
完全使用你从第一步学习到的风格，围绕以下【新创作主题】进行自由创作，写一段300-500字的故事片段。
### 【新创作主题】:
---
${contentInput}
---
# 输出要求：
- 你的输出必须是**纯粹的、仿写后的小说正文**。
- 绝不能包含任何解释、分析或标题。
`;

    try {
        const result = await callAI(prompt);
        if(outputArea) {
            const converter = new showdown.Converter();
            outputArea.innerHTML = converter.makeHtml(result);
        }
        showNotification("文风仿写完成！", "success");
    } catch (error) {
        if(outputArea) outputArea.innerHTML = `<p class="placeholder-text" style="color:var(--accent-danger);">仿写失败: ${error.message}</p>`;
    } finally {
        hideLoading();
    }
}