// 文件路径: js/modules/module-worldview-architect.js
// 描述: 世界观架构师模块。
function initWorldviewArchitectPanel() {
    document.getElementById('generate-worldview-btn')?.addEventListener('click', handleGenerateWorldview);
}

async function handleGenerateWorldview() {
    const worldviewText = document.getElementById('worldview-input-area').value.trim();
    if (!worldviewText) {
        showNotification("请输入世界观核心灵感！", "warning");
        return;
    }
    showLoading('正在构建史诗世界...');
    const outputCard = document.getElementById('worldview-output-card');
    const outputContent = document.getElementById('worldview-output-content');
    if(outputCard) outputCard.style.display = 'block';
    if(outputContent) outputContent.innerHTML = `<p class="placeholder-text"><i class="fas fa-spinner fa-spin"></i> AI文学架构师正在构建宏大世界...</p>`;

    const prompt = `
# 角色定位：文学架构师
你是一名拥有十年网文编辑经验的文学架构师，擅长将零散灵感转化为可扩展的史诗级故事宇宙。
# 核心任务：
根据用户提供的【灵感碎片】，严格遵循以下【世界观构建模块】，生成一份详尽的、包含12个维度的完整世界观设定集。
# 【灵感碎片】:
---
${worldviewText}
---
# 【世界观构建模块】 (必须严格、完整地覆盖以下所有模块):
## 第一部分：基础设定层
### 1. 世界类型
### 2. 时间轴特征
### 3. 物理法则
## 第二部分：核心矛盾层
### 4. 核心矛盾
### 5. 显性矛盾
### 6. 隐性危机
## 第三部分：社会与文明
### 7. 地理与环境
### 8. 社会结构
### 9. 文化信仰与禁忌
## 第四部分：力量与种族
### 10. 科技/魔法水平
### 11. 主要种族设定
### 12. 力量体系
- **力量来源**: (先天/后天/科技/神赐)
- **力量类型**: (魔法/斗气/异能/灵力)
- **功法/技能**: (AI生成具体示例)
# 输出要求：
- 严格按照上述12个模块进行结构化输出。
- 内容必须详尽、逻辑自洽且充满想象力。
- 使用Markdown格式进行排版。
`;

    try {
        const fullWorldview = await callAI(prompt);
        if(outputContent) {
            const converter = new showdown.Converter();
            outputContent.innerHTML = converter.makeHtml(fullWorldview);
        }
        showNotification("详细世界观架构已生成！", "success");
    } catch (error) {
        if(outputContent) outputContent.innerHTML = `<p class="placeholder-text" style="color:var(--accent-danger);">构建失败: ${error.message}</p>`;
    } finally {
        hideLoading();
    }
}