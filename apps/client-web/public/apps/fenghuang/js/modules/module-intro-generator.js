// 文件路径: js/modules/module-intro-generator.js
// 描述: 多平台导语生成器模块
// ✨✨✨ (博士为您植入梦想) ✨✨✨
// 1. 【功能新增】根据您的要求，新增了“一键复制”生成结果的功能。
// 2. 【功能重构】已完全重写本模块，以适配全新的三栏式工作台UI。
// 3. 【流程优化】现在AI会根据您提供的完整原文生成导语，并将结果与原文拼接后输出。

function initIntroGeneratorPanel() {
    document.getElementById('generate-intro-btn')?.addEventListener('click', handleGenerateIntro);
    document.getElementById('copy-intro-output-btn')?.addEventListener('click', handleCopyIntroOutput);
}

async function handleGenerateIntro() {
    // 从新的“原文区域”获取内容
    const originalText = document.getElementById('intro-original-text').value.trim();
    const style = document.getElementById('intro-platform-style').value;
    const outputContent = document.getElementById('intro-output-content');
    const copyBtnContainer = document.getElementById('intro-copy-btn-container');

    if (!originalText) {
        showNotification("请在“原文区域”输入您的正文！", "warning");
        return;
    }

    showLoading('正在创作爆款导语...');
    if (copyBtnContainer) copyBtnContainer.classList.add('hidden');
    if(outputContent) {
        outputContent.innerHTML = `<p class="placeholder-text"><i class="fas fa-spinner fa-spin"></i> AI爆款作者正在构思导语...</p>`;
    }

    const prompt = `
# 角色：你是一位精通不同平台风格的爆款导语创作专家。
# 任务：根据用户提供的【故事原文】，为其提炼核心冲突和卖点，然后创作一段150-250字的、符合所选【平台风格】的、极具吸引力的导语。

# 风格理论库:
- **知乎风格**: 强调“虐爽”平衡，语言精炼，情绪张力强，开头即高能。
- **小程序风格**: 语言更直白，冲突更前置，句子更短，悬念感更强。
- **番茄风格**: 节奏极快，金手指或核心矛盾必须在第一段就抛出。

# 用户输入:
- **故事原文**: 
---
${originalText}
---
- **平台风格**: ${style}

# 输出要求:
- 严格模仿所选的平台风格，直接输出导语正文。
- 不要添加任何额外的解释或说明，例如“这是为您生成的导语：”。
`;

    try {
        const generatedIntro = await callAI(prompt);
        if (outputContent) {
            // 设置white-space以保留换行符
            outputContent.style.whiteSpace = 'pre-wrap';
            // 将生成的导语和原文拼接在一起显示
            outputContent.textContent = `${generatedIntro}\n\n---\n\n${originalText}`;
            if (copyBtnContainer) copyBtnContainer.classList.remove('hidden');
        }
        showNotification("爆款导语已生成！", "success");
    } catch (error) {
        if(outputContent) {
            outputContent.innerHTML = `<p class="placeholder-text" style="color:var(--accent-danger);">生成失败: ${error.message}</p>`;
        }
    } finally {
        hideLoading();
    }
}

function handleCopyIntroOutput() {
    const outputArea = document.getElementById('intro-output-content');
    if (outputArea && outputArea.textContent) {
        navigator.clipboard.writeText(outputArea.textContent)
            .then(() => showNotification("已复制到剪贴板！", "success"))
            .catch(err => showNotification("复制失败: " + err, "error"));
    }
}