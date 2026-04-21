// 文件路径: js/modules/module-scene-planner.js
// 描述: “运镜”场景规划器模块 (由 Gemini 博士为您实现)。

// 临时存储镜头的数组
let shots = [];

function initScenePlannerPanel() {
    shots = []; // 每次初始化时重置
    document.getElementById('add-shot-btn')?.addEventListener('click', addShot);
    document.getElementById('shots-container')?.addEventListener('click', handleShotActions);
    document.getElementById('generate-scene-script-btn')?.addEventListener('click', handleGenerateSceneScript);
    renderShots();
}

function addShot() {
    const typeInput = document.getElementById('shot-type-select');
    const contentInput = document.getElementById('shot-content-input');
    const shotType = typeInput.value;
    const shotContent = contentInput.value.trim();

    if (!shotContent) {
        showNotification("镜头内容描述不能为空。", "warning");
        return;
    }

    shots.push({ type: shotType, content: shotContent });
    contentInput.value = '';
    renderShots();
}

function handleShotActions(e) {
    if (e.target.classList.contains('delete-shot-btn')) {
        const index = parseInt(e.target.dataset.index, 10);
        shots.splice(index, 1);
        renderShots();
    }
}

function renderShots() {
    const container = document.getElementById('shots-container');
    if (!container) return;

    if (shots.length === 0) {
        container.innerHTML = '<p class="placeholder-text">暂无镜头，请添加。</p>';
        return;
    }

    container.innerHTML = shots.map((shot, index) => `
        <div class="shot-item">
            <span class="shot-type-badge">${Utils.escapeHTML(shot.type)}</span>
            <span class="shot-content">${Utils.escapeHTML(shot.content)}</span>
            <button class="delete-shot-btn settings-btn" data-index="${index}" title="删除">&times;</button>
        </div>
    `).join('');
}

async function handleGenerateSceneScript() {
    const sceneDescription = document.getElementById('scene-description-input').value.trim();
    if (!sceneDescription) {
        showNotification("请先输入场景核心事件描述。", "warning");
        return;
    }
    if (shots.length === 0) {
        showNotification("请至少添加一个镜头。", "warning");
        return;
    }

    showLoading('AI导演正在生成场景...');
    const outputCard = document.getElementById('scene-script-output');
    const outputContent = document.getElementById('scene-script-content');
    outputCard.style.display = 'block';
    outputContent.innerHTML = `<p class="placeholder-text"><i class="fas fa-spinner fa-spin"></i> 正在将镜头列表转化为生动的文字...</p>`;
    
    const shotsString = shots.map((s, i) => `${i + 1}. **[${s.type}]**: ${s.content}`).join('\n');

    const prompt = `
# 身份：你是一位顶级电影导演和小说家，擅长将分镜脚本转化为极富画面感的文字。
# 任务：根据给定的【场景核心事件】和【镜头列表】，撰写一段300-500字的场景描写。

# 【场景核心事件】：
${sceneDescription}

# 【镜头列表】：
${shotsString}

# 写作要求：
1.  **严格运镜**：你的描写必须严格按照【镜头列表】的顺序和运镜方式（远景、特写等）进行。
2.  **感官轰炸**：大量运用视觉、听觉、嗅觉、触觉等细节，让读者身临其境。
3.  **虚实结合 (Show, Don't Tell)**：通过角色的动作、表情和环境互动来展示情绪，避免直接的心理描述。
4.  **纯粹输出**：直接输出小说正文，不要包含任何解释或标题。
`;

    try {
        const result = await callAI(prompt);
        const converter = new showdown.Converter();
        outputContent.innerHTML = converter.makeHtml(result);
        showNotification("场景片段已生成！", "success");
    } catch (error) {
        outputContent.innerHTML = `<p class="placeholder-text" style="color:var(--accent-danger);">生成失败: ${error.message}</p>`;
    } finally {
        hideLoading();
    }
}