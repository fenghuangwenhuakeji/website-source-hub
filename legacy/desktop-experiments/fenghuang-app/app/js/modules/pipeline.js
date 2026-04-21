// 文件路径: js/modules/pipeline.js
// 描述: (V77.0 凤凰版) - 全新重构的创作流水线模块。
// 融合了 "正式版2" 的分步骤工作流 和 "第四种融合思路" 的现代化UI与模块化思想。

// --- 模块配置 ---
const blueprintStepsConfig = [
    { id: "step1", title: "第一步：解析题目核心元素", description: "AI将分析您的标题和简介，提炼关键词、定位题材，并明确核心冲突。" },
    { id: "step2", title: "第二步：设定故事原型与世界观", description: "基于您的选择和AI的分析，构建故事的核心设定、主角原型和世界观。" },
    { id: "step3", title: "第三步：规划情绪节奏与开篇", description: "设计故事的整体情感节奏，并根据叙事理论选择合适的开篇模式。" },
    { id: "step4", title: "第四步：整合为完整创世蓝图", description: "将前面所有步骤的内容整合，形成一份完整的“创世蓝图”，指导后续创作。", isFinal: true }
];

// --- 主初始化函数 ---
function initializePipelineModule() {
    const panel = document.getElementById('pipeline-panel');
    if (!panel) return;

    panel.innerHTML = `
        <div class="card" id="pipeline-container">
            <div class="card-header">
                <h2><i class="fas fa-project-diagram"></i> 创作流水线 (凤凰版)</h2>
            </div>
            <div class="card-body">
                <div id="pipeline-start-screen">
                    <div class="form-group">
                        <label for="story-title-input">故事标题或核心灵感</label>
                        <input type="text" id="story-title-input" placeholder="例如：一个怂包在末世靠种田和忽悠建立乌托邦的故事...">
                    </div>
                    <div class="form-group">
                        <label for="story-brief-input">简要说明 (可选)</label>
                        <textarea id="story-brief-input" rows="3" placeholder="可以进一步描述您的故事，如主角性格、关键转折等..."></textarea>
                    </div>
                     <div class="form-group">
                        <label for="chapter-count-input">预估总章数 (用于生成层级大纲)</label>
                        <input type="number" id="chapter-count-input" value="120" min="10">
                    </div>
                    <button id="start-interactive-btn" class="action-btn" style="width: 100%;"><i class="fas fa-play-circle"></i> 开始构建故事蓝图</button>
                </div>
                <div id="pipeline-workflow-container" class="hidden"></div>
            </div>
        </div>
    `;

    document.getElementById('start-interactive-btn').addEventListener('click', startInteractiveBlueprintProcess);
    console.log("全新创作流水线模块已初始化。");
}

// --- 核心工作流函数 (移植并改编自 正式版2) ---

function startInteractiveBlueprintProcess() {
    const title = document.getElementById('story-title-input').value.trim();
    if (!title) {
        showNotification("请输入故事标题或核心灵感！", "error");
        return;
    }
    
    // 初始化或重置当前项目的状态
    creationState = {
        title: title,
        brief: document.getElementById('story-brief-input').value.trim(),
        totalChapters: parseInt(document.getElementById('chapter-count-input').value, 10) || 120,
        step_outputs: {},
        currentVolume: 0, // 新增：追踪当前卷数
        hierarchicalOutline: "" // 新增：存储完整大纲
    };

    // 禁用初始输入，而不是隐藏
    document.getElementById('story-title-input').readOnly = true;
    document.getElementById('story-brief-input').readOnly = true;
    document.getElementById('chapter-count-input').readOnly = true;
    document.getElementById('start-interactive-btn').disabled = true;
    document.getElementById('start-interactive-btn').textContent = "已开始构建...";

    const workflowContainer = document.getElementById('pipeline-workflow-container');
    workflowContainer.innerHTML = ''; // 清空
    workflowContainer.classList.remove('hidden');
    
    appendBlueprintStepUI(0);
}

function appendBlueprintStepUI(stepIndex) {
    const container = document.getElementById('pipeline-workflow-container');
    const stepConfig = blueprintStepsConfig[stepIndex];
    if (!stepConfig) return;

    const stepDiv = document.createElement('div');
    stepDiv.className = 'blueprint-step';
    stepDiv.id = stepConfig.id;
    stepDiv.dataset.stepIndex = stepIndex;
    stepDiv.innerHTML = `
        <h3><span class="step-status"><i class="fas fa-edit"></i></span> ${stepConfig.title}</h3>
        <p class="text-muted">${stepConfig.description}</p>
        <textarea placeholder="AI生成的内容将显示在这里...">${creationState.step_outputs[stepConfig.id] || ""}</textarea>
        <div class="step-controls">
            <button class="action-btn generate-btn"><i class="fas fa-magic"></i> 生成此步骤</button>
        </div>
    `;
    container.appendChild(stepDiv);
    stepDiv.querySelector('.generate-btn').addEventListener('click', handleGenerateBlueprintStep);
    stepDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function handleGenerateBlueprintStep(event) {
    const button = event.currentTarget;
    const stepDiv = button.closest('.blueprint-step');
    const stepIndex = parseInt(stepDiv.dataset.stepIndex, 10);
    const stepConfig = blueprintStepsConfig[stepIndex];
    const textarea = stepDiv.querySelector('textarea');
    const statusIcon = stepDiv.querySelector('.step-status');
    const controlsDiv = stepDiv.querySelector('.step-controls');

    // 保存之前步骤的输出
    document.querySelectorAll('.blueprint-step textarea').forEach((ta, index) => {
        if (index < stepIndex && ta.value) {
            creationState.step_outputs[blueprintStepsConfig[index].id] = ta.value;
        }
    });

    button.disabled = true;
    statusIcon.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    textarea.readOnly = true;

    try {
        let output;
        if (stepConfig.isFinal) {
            output = `# 创世蓝图：${creationState.title}\n\n${Object.values(creationState.step_outputs).join("\n\n").trim()}`;
        } else {
            const prompt = getNewBlueprintPrompt(stepConfig.id, creationState);
            output = await callApi(prompt);
        }
        
        textarea.value = output; // 使用快速填充
        creationState.step_outputs[stepConfig.id] = output;
        statusIcon.innerHTML = '<i class="fas fa-check-circle" style="color: var(--success-color);"></i>';
        textarea.readOnly = false;
        updateBlueprintControls(controlsDiv, stepIndex, "generated");
    } catch (error) {
        textarea.value = `生成错误: ${error.message}`;
        statusIcon.innerHTML = '<i class="fas fa-times-circle" style="color: var(--error-color);"></i>';
        updateBlueprintControls(controlsDiv, stepIndex, "error");
    }
}

function updateBlueprintControls(controlsDiv, stepIndex, status) {
    if (status === "error") {
        controlsDiv.innerHTML = '<button class="action-btn generate-btn"><i class="fas fa-redo"></i> 重试</button>';
        controlsDiv.querySelector('.generate-btn').addEventListener('click', handleGenerateBlueprintStep);
        return;
    }

    const isFinal = blueprintStepsConfig[stepIndex].isFinal;
    const backBtnHtml = stepIndex > 0 ? `<button class="settings-btn control-btn back-btn"><i class="fas fa-chevron-left"></i> 上一步</button>` : "";
    const regenBtnHtml = `<button class="settings-btn control-btn regenerate-btn"><i class="fas fa-sync-alt"></i> 重生成</button>`;
    const nextBtnHtml = isFinal 
        ? `<button class="action-btn control-btn" id="confirm-blueprint-btn"><i class="fas fa-bone"></i> 下一步：生成层级大纲</button>`
        : `<button class="action-btn control-btn next-btn"><i class="fas fa-check"></i> 下一步</button>`;

    controlsDiv.innerHTML = `${backBtnHtml}${regenBtnHtml}${nextBtnHtml}`;

    if (stepIndex > 0) {
        controlsDiv.querySelector('.back-btn').addEventListener('click', handleBlueprintGoBack);
    }
    controlsDiv.querySelector('.regenerate-btn').addEventListener('click', handleGenerateBlueprintStep);

    if (isFinal) {
        controlsDiv.querySelector('#confirm-blueprint-btn').addEventListener('click', () => {
            // 锁定之前的步骤
            document.querySelectorAll('.blueprint-step').forEach(step => {
                step.querySelector('textarea').readOnly = true;
                const controls = step.querySelector('.step-controls');
                if (controls.id !== 'skeleton-controls') {
                    controls.innerHTML = `<span style="color: var(--accent-color);">已确认 ✓</span>`;
                }
            });
            // 不再切换Tab，直接在下方开始生成
            startHierarchicalOutlineGeneration();
        });
    } else {
        controlsDiv.querySelector('.next-btn').addEventListener('click', handleBlueprintNextStep);
    }
}

function handleBlueprintNextStep(event) {
    const stepDiv = event.currentTarget.closest('.blueprint-step');
    const stepIndex = parseInt(stepDiv.dataset.stepIndex, 10);
    creationState.step_outputs[blueprintStepsConfig[stepIndex].id] = stepDiv.querySelector('textarea').value;
    stepDiv.querySelector('textarea').readOnly = true;
    stepDiv.querySelector('.step-controls').innerHTML = `<span style="color: var(--accent-primary);">已确认 ✓</span>`;
    // 移除折叠行为，直接追加下一步
    appendBlueprintStepUI(stepIndex + 1);
}

function handleBlueprintGoBack(event) {
    const stepDiv = event.currentTarget.closest('.blueprint-step');
    const stepIndex = parseInt(stepDiv.dataset.stepIndex, 10);

    document.querySelectorAll('.blueprint-step').forEach(div => {
        if (parseInt(div.dataset.stepIndex, 10) >= stepIndex) {
            div.remove();
        }
    });

    const prevStepDiv = document.getElementById(blueprintStepsConfig[stepIndex - 1].id);
    if (prevStepDiv) {
        prevStepDiv.querySelector('textarea').readOnly = false;
        updateBlueprintControls(prevStepDiv.querySelector('.step-controls'), stepIndex - 1, "generated");
    }
}

// --- 新版大纲生成 (已实现) ---
function startHierarchicalOutlineGeneration(isRestoring = false) {
    if (!isRestoring) {
        creationState.blueprint = creationState.step_outputs.step4;
    }
    
    // 从 character-manager.js 获取角色数据并存入状态
    if (typeof characterDeck !== 'undefined' && Array.isArray(characterDeck)) {
        creationState.characters = JSON.parse(JSON.stringify(characterDeck));
        showNotification(`已从向量库同步 ${characterDeck.length} 个核心角色。`, "info");
    }
    
    const workflowContainer = document.getElementById('pipeline-workflow-container');
    
    // 创建并追加第五步的UI，而不是覆盖
    const skeletonDiv = document.createElement('div');
    skeletonDiv.id = 'skeleton-container';
    skeletonDiv.innerHTML = `
        <div class="blueprint-step">
            <h3><span class="step-status"><i class="fas fa-edit"></i></span> 第五步：生成层级式大纲</h3>
            <p class="text-muted">AI将根据您的蓝图和预设章节数，生成包含“卷”和“章”的层级大纲。</p>
            <textarea id="skeleton-textarea" placeholder="AI生成的故事大纲将显示在这里..."></textarea>
            <div class="step-controls" id="skeleton-controls">
                <button class="action-btn" id="generate-skeleton-btn"><i class="fas fa-magic"></i> 生成第一卷</button>
            </div>
        </div>
    `;
    workflowContainer.appendChild(skeletonDiv);
    skeletonDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('generate-skeleton-btn').addEventListener('click', handleHierarchicalOutlineGeneration);
    
    showNotification("蓝图已确认！请点击按钮生成层级大纲。", "success");
}

async function handleHierarchicalOutlineGeneration() {
    const button = document.getElementById('generate-skeleton-btn');
    const controlsDiv = document.getElementById('skeleton-controls');
    const statusIcon = document.querySelector("#skeleton-container .step-status");
    const textarea = document.getElementById('skeleton-textarea');

    button.disabled = true;
    creationState.currentVolume++;
    statusIcon.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 正在生成第 ${creationState.currentVolume} 卷...`;
    button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 正在生成...`;

    try {
        const prompt = getVolumeOutlinePrompt(creationState);
        const newVolumeContent = await callApi(prompt);
        
        // 追加新卷内容
        const currentOutline = textarea.value;
        const finalContent = (currentOutline ? currentOutline + "\n\n" : "") + newVolumeContent;
        textarea.value = finalContent;
        creationState.hierarchicalOutline = finalContent;
        
        statusIcon.innerHTML = '<i class="fas fa-check-circle" style="color: var(--success-color);"></i>';
        
        // 更新UI和传送数据
        if (typeof renderOutlineDetailPanel === 'function') {
            renderOutlineDetailPanel(finalContent);
        }
        showNotification(`第 ${creationState.currentVolume} 卷已生成并发送至大纲细纲！`, "success");
        
        // 更新按钮
        button.disabled = false;
        button.innerHTML = `<i class="fas fa-magic"></i> 生成下一卷 (第 ${creationState.currentVolume + 1} 卷)`;
        
        // 如果需要，可以添加一个完成按钮
        if (!controlsDiv.querySelector('#finish-outline-btn')) {
            const finishBtn = document.createElement('button');
            finishBtn.id = 'finish-outline-btn';
            finishBtn.className = 'settings-btn control-btn';
            finishBtn.innerHTML = '<i class="fas fa-flag-checkered"></i> 完成大纲';
            finishBtn.addEventListener('click', () => {
                switchTab('outline-detail-panel');
                showNotification("大纲生成完毕，请前往“大纲细纲”面板进行最终审核。", "success");
                button.disabled = true;
                button.textContent = "已完成";
            });
            controlsDiv.appendChild(finishBtn);
        }

    } catch (error) {
        textarea.value += `\n\n生成第 ${creationState.currentVolume} 卷错误: ${error.message}`;
        statusIcon.innerHTML = '<i class="fas fa-times-circle" style="color: var(--error-color);"></i>';
        button.disabled = false;
        button.innerHTML = `<i class="fas fa-redo"></i> 重试生成第 ${creationState.currentVolume} 卷`;
        creationState.currentVolume--; // 失败后回滚卷数
    }
}

function renderPipeline(state) {
    // 恢复输入框内容和只读状态
    const titleInput = document.getElementById('story-title-input');
    const briefInput = document.getElementById('story-brief-input');
    const countInput = document.getElementById('chapter-count-input');
    const startBtn = document.getElementById('start-interactive-btn');

    titleInput.value = state.title || '';
    briefInput.value = state.brief || '';
    countInput.value = state.totalChapters || 120;

    const workflowContainer = document.getElementById('pipeline-workflow-container');
    workflowContainer.innerHTML = ''; // 清空旧内容

    if (state.blueprint) {
        titleInput.readOnly = true;
        briefInput.readOnly = true;
        countInput.readOnly = true;
        startBtn.disabled = true;
        startBtn.textContent = "已开始构建...";

        workflowContainer.classList.remove('hidden');
        
        // 重新渲染所有已完成的步骤
        for (let i = 0; i < blueprintStepsConfig.length; i++) {
            const stepConfig = blueprintStepsConfig[i];
            const stepOutput = state.step_outputs[stepConfig.id];
            
            if (stepOutput) {
                const stepDiv = document.createElement('div');
                stepDiv.className = 'blueprint-step';
                stepDiv.id = stepConfig.id;
                stepDiv.dataset.stepIndex = i;
                stepDiv.innerHTML = `
                    <h3><span class="step-status"><i class="fas fa-check-circle" style="color: var(--success-color);"></i></span> ${stepConfig.title}</h3>
                    <p class="text-muted">${stepConfig.description}</p>
                    <textarea readonly>${stepOutput}</textarea>
                    <div class="step-controls">
                         <span style="color: var(--accent-color);">已确认 ✓</span>
                    </div>
                `;
                workflowContainer.appendChild(stepDiv);
            }
        }
        
        // 如果大纲也已生成，渲染大纲部分
        if(state.hierarchicalOutline) {
            startHierarchicalOutlineGeneration(true); // 使用一个标记来表示是恢复状态
            const textarea = document.getElementById('skeleton-textarea');
            if(textarea) textarea.value = state.hierarchicalOutline;
        }

    } else {
        // 重置为初始状态
        titleInput.readOnly = false;
        briefInput.readOnly = false;
        countInput.readOnly = false;
        startBtn.disabled = false;
        startBtn.textContent = "开始构建故事蓝图";
        workflowContainer.classList.add('hidden');
    }
}
window.renderPipeline = renderPipeline; // 将函数暴露到全局


// --- 提示词工程 (简化版) ---
function getNewBlueprintPrompt(stepId, state) {
    const styleInstruction = `
# 风格指令 (最高优先级):
你的回答必须非常精炼、直接，只输出核心内容。
- **绝对禁止** 在回答中添加任何解释性文字、括号内的补充说明或自我评述。
- **绝对禁止** 使用任何Markdown格式（如 **加粗** 或 *斜体*）。所有内容都必须是纯文本。
---
    `;
    
    const previousSteps = `
# 上一步生成的内容:
---
${state.step_outputs.step2 ? `## 第二步：\n${state.step_outputs.step2}\n` : ""}
${state.step_outputs.step1 ? `## 第一步：\n${state.step_outputs.step1}\n` : ""}
---
    `;

    const prompts = {
        step1: `
${styleInstruction}
# 指令：生成【第一步：解析题目核心元素】
作为顶级网文策划编辑，基于以下信息进行深度解构和市场定位。
## 输入信息:
- 标题: ${state.title}
- 简介: ${state.brief || "无"}
## 输出要求 (严格按结构，内容精炼):
1.  核心关键词: (提炼3-5个核心词)
2.  核心冲突: (一句话概括核心矛盾)
3.  读者画像: (描述读者偏好)
4.  市场定位: (明确题材分类)
        `,
        step2: `
${styleInstruction}
# 指令：生成【第二步：设定故事原型与世界观】
作为金牌网文作者，基于第一步分析和用户要求，构建核心设定。
${previousSteps}
## 输出要求 (严格按结构):
1.  世界观核心: (直接描述世界背景和独特规则)
2.  主角核心人设:
    - 姓名/代号: (直接给出一个合适的名字)
    - 核心驱动力: (直接描述主角的根本动机)
    - 金手指/能力: (直接描述能力)
3.  主要配角/势力: (直接简述1-2个关键配角或对立势力及其关系)
        `,
        step3: `
# 指令：生成【第三步：规划情绪节奏与开篇】
作为剧情节奏大师，基于已有设定，规划情感起伏和开篇。
${previousSteps}
## 输出要求 (严格按结构):
1.  情绪节奏应用解析: (解释如何运用一种经典的情感模型，如“推拉式”、“过山车式”或“平稳递增式”来贯穿故事)
2.  开篇模式选择与阐述:
    - 选择: (三选一：热开篇-直接冲突, 冷开篇-悬念铺垫, 温开篇-日常切入)
    - 理由: (解释为何这样选对故事有利)
3.  开篇情景简述: (直接用2-3句话的纯文本生动描述开篇第一个场景，明确时间、地点、人物和事件)
        `
    };

    return (prompts[stepId] || "# 错误：未找到对应的提示词模板").trim();
}
function getVolumeOutlinePrompt(state) {
    const characterInfo = (state.characters || []).map(c => `- ${c.name}: ${c.core || '暂无描述'}`).join('\n');
    const worldviewInfo = (state.worldview || []).map(w => `- ${w.text}`).join('\n');
    const cluesInfo = (state.clue || []).map(c => `- ${c.text}`).join('\n');
    const mapInfo = (state.map || []).map(m => `- ${m.text}`).join('\n');

    const previousVolumes = state.hierarchicalOutline ? `
# 已生成的卷纲内容 (用于衔接):
\`\`\`
${state.hierarchicalOutline}
\`\`\`
` : "这是故事的第一卷，请创作开篇内容。";

    return `
# 身份：世界级网文大神作家兼总编
你正在为小说《${state.title}》创作“生生不息大纲细纲”。现在，你需要专注于创作 **第 ${state.currentVolume} 卷** 的内容。

# 核心叙事理论 (你必须严格遵循，这是最高指令):

## 1. 节奏总纲：起承转合
- **起：** 以强冲突开场，迅速抓住读者。
- **承：** 积累情绪张力，通过阻碍和代价压抑情绪，为爆发做准备。
- **转：** 基于前文伏笔，设计情理之中、意料之外的反转。
- **合：** 给予情绪落点，留有余味，而非简单收尾。

## 2. 高潮章节构建法：三番四震
- **三番 (递进式反转):** 设计三层递进的反转，分别打破小、中、大三个层级的预期。
- **四震 (情绪扩散):** 将反转的震惊效果按圈层扩散：身边人 -> 小圈子 -> 大圈层 -> 世界观影响。

## 3. 中期剧情构建法：三番四抖
- **三番 (三重维度压力):** 施加来自“同级”、“关联者”、“权威”三个不同维度的压力。
- **四抖 (一次集中破局):** 用一个巧妙的动作或事件，一次性解决所有三重压力，强调“巧”而非“强”。

# 任务：创作第 ${state.currentVolume} 卷大纲

## 第一步：生成本卷前情提要
在开始撰写大纲前，你必须先生成一个【前情提要】部分，总结进入本卷时各项核心数据的状态。格式如下：
\`\`\`
### 前情提要 (第 ${state.currentVolume} 卷)
- **核心人物状态:**
  - [人物A]: [状态描述，例如：身受重伤，但获得了新的线索]
  - [人物B]: [状态描述]
- **世界观状态:** [描述世界观的关键变化，例如：帝国与联邦关系紧张，战争一触即发]
- **伏笔与线索:** [列出本卷即将回收或新的关键伏笔]
- **地图关键场景:** [标注本卷将要发生的几个核心场景地点]
\`\`\`

## 第二步：撰写本卷详细大纲
根据【前情提要】和下方输入材料，并严格运用【核心叙事理论】，撰写第 ${state.currentVolume} 卷的详细大纲。

# 输入材料：
- **小说标题:** 《${state.title}》
- **当前卷数:** 第 ${state.currentVolume} 卷
- **核心数据 (来自向量化核心记忆):**
  - **人物列表:**
    ${characterInfo || "- 暂无"}
  - **世界观设定:**
    ${worldviewInfo || "- 暂无"}
  - **伏笔线索:**
    ${cluesInfo || "- 暂无"}
  - **地图信息:**
    ${mapInfo || "- 暂无"}
- **创世蓝图 (故事总纲):**
  \`\`\`
  ${state.blueprint}
  \`\`\`
${previousVolumes}

# 输出要求 (必须严格遵守，这是铁律):
1.  **结构完整:** 你的回答必须先包含【前情提要】，然后再是详细的卷纲内容。
2.  **理论应用:** 在“情节点”的设计中，必须能明确体现“起承转合”、“三番四震”或“三番四抖”的运用。
3.  **层级格式严格：** 卷纲部分必须严格按照以下标题层级开始：
    -   中循环 (卷): \`## 第${state.currentVolume}卷：[卷标题]\`
    -   小循环 (章): \`### [章号]：[章标题]\`
    -   场景点: \`#### 场景：[场景描述]\`
    -   情节点: 使用数字列表 (e.g., \`1. ...\`, \`2. ...\`)
4.  **直接输出：** 你的回答必须直接以 Markdown 格式开始，禁止任何前言或解释。

现在，请开始创作 **第 ${state.currentVolume} 卷** 的【前情提要】和详细大纲。
    `.trim();
}