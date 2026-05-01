// 文件路径: js/modules/module-style-migration.js
// 描述: 文风迁移器模块。
function initStyleMigrationPanel(){
    document.getElementById('migra-start-btn')?.addEventListener('click', handleStyleMigration);
}

async function handleStyleMigration() {
    const styleInput = document.getElementById('migra-style-input').value.trim();
    const contentInput = document.getElementById('migra-content-input').value.trim();
    if (!styleInput || !contentInput) {
        showNotification("风格源文本和内容源文本均不能为空！", "warning");
        return;
    }
    showLoading('正在进行文风迁移...');
    const outputArea = document.getElementById('migra-output');
    if(outputArea) outputArea.innerHTML = `<p class="placeholder-text"><i class="fas fa-spinner fa-spin"></i> AI正在学习风格并重写内容...</p>`;

    const prompt = `
# 身份：你是一位顶级的风格模仿大师和小说家。
# 核心任务：严格遵循“两步走”原则，完成一次文风迁移。
## 第一步：风格学习
深度分析以下【风格源文本】，精准提炼其语言节奏、句式结构、词汇偏好、叙事口吻和情感基调。
### 【风格源文本】:
---
${styleInput}
---
## 第二步：内容重写
完全使用你从第一步学习到的风格，去重新创作和演绎以下【内容源文本】的核心情节。
### 【内容源文本】:
---
${contentInput}
---
# 输出要求：
- 你的输出必须是**纯粹的、迁移后的小说正文**。
- 绝不能包含任何解释、分析或标题。
- 必须忠实于【内容源文本】的核心情节，但表现形式要完全是【风格源文本】的。
`;

    try {
        const result = await callAI(prompt);
        if(outputArea) {
            const converter = new showdown.Converter();
            outputArea.innerHTML = converter.makeHtml(result);
        }
        showNotification("文风迁移完成！", "success");
    } catch (error) {
        if(outputArea) outputArea.innerHTML = `<p class="placeholder-text" style="color:var(--accent-danger);">迁移失败: ${error.message}</p>`;
    } finally {
        hideLoading();
    }
}