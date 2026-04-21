// 文件路径: js/modules/02_正文写作.js
// 描述: (V71.0 博士·凤凰涅槃·终极版) - 完全重写，以小循环为数据核心，实现非线性创作流程。

// --- 渲染与UI ---

function renderWritingPanel() {
    const panel = document.getElementById('writing-panel');
    if (!panel) return;

    const outlineHtml = parseBlueprintToOutline(creationState.inspirationConcept);
    const activeContent = getActiveCycleContent();

    panel.innerHTML = `
        <div class="writing-cockpit-container three-column-creator">
            <div id="cockpit-chapter-list" class="cockpit-panel">
                <div class="card-header"><h3><i class="fas fa-sitemap"></i> 故事结构</h3></div>
                <div class="cockpit-scroll-area" id="chapter-list-body">${outlineHtml}</div>
            </div>

            <div id="cockpit-batch-outline-buffer" class="cockpit-panel">
                <div class="card-header"><h3><i class="fas fa-clipboard-list"></i> 章节细纲 (可编辑)</h3></div>
                <div id="outline-buffer-container" class="cockpit-scroll-area document-content" contenteditable="true">
                    ${activeContent.outline ? activeContent.outline.replace(/\n/g, '<br>') : '<p>请从左侧选择一个小循环生成或查看细纲...</p>'}
                </div>
            </div>

            <div id="cockpit-main-editor" class="cockpit-panel" style="display: flex; flex-direction: column; height: 100%;">
                <div class="card-header">
                    <h3><i class="fas fa-pen-alt"></i> 正文写作 (可编辑)</h3>
                </div>
                <div id="prose-editor-container" class="cockpit-scroll-area document-content" contenteditable="true" style="flex-grow: 1; height: 70%;">
                    ${activeContent.prose || '<p>请在“章节细纲”生成后，点击“生成正文”...</p>'}
                </div>
                <div class="prose-controls-container" style="padding: 15px; border-top: 1px solid var(--border-color); height: 30%; overflow-y: auto;">
                    <div class="modal-footer" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; align-items: center; padding: 0;">
                        <div class="form-group" style="margin: 0;"><label for="scribe-persona" style="margin-bottom: 5px;">AI作者风格</label><select id="scribe-persona"><optgroup label="核心模式"><option value="style_A12345_P0">通用模式 / 创世模式</option><option value="tomato">番茄长篇风格</option><option value="zhihu">知乎热帖风格</option></optgroup><optgroup label="自定义风格引擎"><option value="custom_style">【导入】使用下方自定义示例</option></optgroup></select></div>
                        <div class="form-group" style="margin: 0;"><label for="scribe-words" style="margin-bottom: 5px;">每章字数</label><input type="number" id="scribe-words" value="2000" step="100" min="100"></div>
                        <button id="generate-prose-btn" class="action-btn" style="align-self: end;">生成正文</button>
                        <button id="complete-cycle-btn" class="settings-btn" style="align-self: end;">本中循环完结</button>
                    </div>
                    <div id="custom-style-section" class="hidden" style="margin-top: 15px; border-top: 1px solid var(--border-color); padding-top: 15px;">
                        <label>自定义风格引擎 (可选)</label>
                        <div class="form-group"><textarea id="style-example-input" rows="6" placeholder="在此粘贴您想模仿的文风范例...">${creationState.styleExample || ''}</textarea></div>
                        <div class="button-group">
                            <button id="analyze-zhuji-btn" class="settings-btn"><i class="fas fa-magic"></i> 使用【珠玑】引擎分析</button>
                            <button id="analyze-sare-btn" class="settings-btn"><i class="fas fa-atom"></i> 使用【SARE】引擎分析</button>
                        </div>
                        <div class="form-group" style="margin-top: 10px;"><label>AI生成的风格指南</label><textarea id="custom-style-guide-display" rows="8" placeholder="分析结果将显示在此处...">${creationState.customStyleGuide || ''}</textarea></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    addWritingPanelEventListeners();
    updateActiveCycleInUI();
}

function parseBlueprintToOutline(blueprintHtml) {
    if (!blueprintHtml) return '<p style="padding: 20px;">尚未生成故事蓝图。</p>';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = blueprintHtml;
    let outlineAccordion = '';
    tempDiv.querySelectorAll('article[id^="volume-"]').forEach((volume, volIndex) => {
        const volumeTitle = volume.querySelector('h4')?.textContent.trim();
        outlineAccordion += `<details class="volume-group" open><summary>${volumeTitle}</summary>`;
        volume.querySelectorAll('.medium-cycle').forEach((mc, mcIndex) => {
            const mediumCycleTitle = mc.querySelector('h5')?.textContent.trim();
            outlineAccordion += `<div class="medium-cycle-group"><h5>${mediumCycleTitle}</h5>`;
            mc.querySelectorAll('.small-cycle').forEach((sc, scIndex) => {
                const scenesData = Array.from(sc.querySelectorAll('.scene')).map(scene => ({
                    title: scene.querySelector('.scene-title')?.textContent.trim(),
                    plotPoints: Array.from(scene.querySelectorAll('.plot-points li')).map(li => li.textContent.trim()).join('\n')
                }));
                const smallCycleTitle = sc.querySelector('.small-cycle-header')?.textContent.trim();
                const cycleId = `v${volIndex}-m${mcIndex}-s${scIndex}`;

                outlineAccordion += `
                    <div class="small-cycle-item" id="${cycleId}" data-title="${smallCycleTitle}" data-scenes='${JSON.stringify(scenesData)}'>
                        <span>${smallCycleTitle}</span>
                        <div class="cycle-buttons">
                            <button class="view-cycle-btn settings-btn" data-cycle-id="${cycleId}">查看</button>
                            <button class="generate-small-cycle-outline-btn settings-btn" data-cycle-id="${cycleId}">生成细纲</button>
                        </div>
                    </div>
                `;
            });
            outlineAccordion += `</div>`;
        });
        outlineAccordion += `</details>`;
    });
    return outlineAccordion;
}

// --- 事件监听 ---

function addWritingPanelEventListeners() {
    // 故事结构面板的按钮 (事件委托)
    document.getElementById('chapter-list-body').addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const cycleId = button.dataset.cycleId;
        if (button.classList.contains('generate-small-cycle-outline-btn')) {
            const parent = document.getElementById(cycleId);
            const scenesData = JSON.parse(parent.dataset.scenes);
            const cycleTitle = parent.dataset.title;
            generateChapterOutlineToBuffer(scenesData, cycleTitle, cycleId);
        } else if (button.classList.contains('view-cycle-btn')) {
            creationState.activeCycleId = cycleId;
            renderActiveCycleContent();
            updateActiveCycleInUI();
        }
    });

    // 正文生成控制区
    document.getElementById('generate-prose-btn').addEventListener('click', generateProseFromBuffer);
    document.getElementById('complete-cycle-btn').addEventListener('click', summarizeAndContinue);

    // 编辑器实时保存
    const outlineEditor = document.getElementById('outline-buffer-container');
    const proseEditor = document.getElementById('prose-editor-container');
    outlineEditor.addEventListener('input', () => {
        if (creationState.activeCycleId && creationState.cycleContent[creationState.activeCycleId]) {
            creationState.cycleContent[creationState.activeCycleId].outline = outlineEditor.innerText;
        }
    });
    proseEditor.addEventListener('input', () => {
        if (creationState.activeCycleId && creationState.cycleContent[creationState.activeCycleId]) {
            creationState.cycleContent[creationState.activeCycleId].prose = proseEditor.innerHTML;
        }
    });
    
    // 自定义风格模块
    document.getElementById('scribe-persona').addEventListener('change', () => {
        const customSection = document.getElementById('custom-style-section');
        customSection.classList.toggle('hidden', document.getElementById('scribe-persona').value !== 'custom_style');
    });
    document.getElementById('analyze-zhuji-btn').addEventListener('click', () => handleStyleAnalysis('珠玑'));
    document.getElementById('analyze-sare-btn').addEventListener('click', () => handleStyleAnalysis('SARE'));
    const customGuideEl = document.getElementById('custom-style-guide-display');
    customGuideEl.addEventListener('input', (e) => {
        creationState.customStyleGuide = e.target.value;
        creationState.customStyleEngine = '手动输入';
    });
    customGuideEl.addEventListener('paste', () => {
        setTimeout(() => {
            const text = customGuideEl.value.trim();
            if (text) {
                creationState.customStyleGuide = text;
                creationState.customStyleEngine = '手动输入';
                showNotification(`已接收自定义风格指南（${text.length} 字）。`, 'success');
            }
        }, 0);
    });
}


// --- 核心逻辑 ---

// 【终极重构】此函数不再调用AI，而是作为纯粹的情节点提取器
function generateChapterOutlineToBuffer(scenesData, cycleTitle, cycleId) {
    creationState.activeCycleId = cycleId;
    updateActiveCycleInUI();

    const bufferContainer = document.getElementById('outline-buffer-container');
    
    let plainTextOutline = `--- ${cycleTitle} ---\n\n`;
    scenesData.forEach(scene => {
        plainTextOutline += `【${scene.title}】\n`;
        plainTextOutline += scene.plotPoints.split('\n').map(p => `- ${p}`).join('\n');
        plainTextOutline += '\n\n';
    });
    
    bufferContainer.innerText = plainTextOutline;

    if (!creationState.cycleContent[cycleId]) {
        creationState.cycleContent[cycleId] = { outline: '', prose: '' };
    }
    creationState.cycleContent[cycleId].outline = plainTextOutline;
    
    showNotification(`【${cycleTitle}】的纯粹情节点已提取至细纲面板！`, "success");
}

// 【终极重构】此函数改造为对情节点的润色和扩写
async function generateProseFromBuffer() {
    if (isGenerating || !creationState.activeCycleId) {
        showNotification("请先使用“查看”或“生成细纲”按钮选择一个小循环。", "warning");
        return;
    }

    const cycleId = creationState.activeCycleId;
    const cycleData = creationState.cycleContent[cycleId];
    const eventStream = cycleData.outline;
    
    if (!eventStream) {
        showNotification("当前小循环没有情节点，无法生成正文。", "error");
        return;
    }

    isGenerating = true;
    const proseEditor = document.getElementById('prose-editor-container');
    proseEditor.innerHTML = `<p><i>AI 正在润色和扩写情节点...</i></p>`;
    
    creationState.writingStyle = document.getElementById('scribe-persona').value;
    creationState.wordsPerChapter = parseInt(document.getElementById('scribe-words').value, 10);
    const styleGuide = creationState.customStyleGuide || '无特定指南。';
    
    const prompt = `
# 身份: 你是一位专业的网络小说作家，擅长将干瘪的情节点扩写为生动的正文。

# 核心任务
你的任务是将下方提供的【纯粹情节点】扩写成一篇流畅、生动、详实的小说正文。你不是在创作，而是在“翻译”和“渲染”。

# 核心指令 (最高优先级)
1.  **严格遵循风格**: 你的写作风格必须严格符合【写作风格】部分定义的规则。
2.  **严格控制字数**: 你的输出总字数必须严格遵循【字数要求】。
3.  **严格遵循情节点**: 你必须将【纯粹情节点】中的每一个事件、对话和心理活动都完整、清晰地表达出来，可以增加必要的衔接、描写和润色，但绝不能偏离、增删或改变情节点的核心内容和顺序。

# 写作风格
- **核心风格**: ${creationState.writingStyle}
- **自定义风格指南**: ${styleGuide}

# 字数要求
- **目标总字数**: **${creationState.wordsPerChapter}** 字左右。

# 叙事要求
- **视角**: ${creationState.narrativePerspective}

# 【纯粹情节点】 (你的唯一加工原料)
---
${eventStream}
---

现在，请开始你的“翻译”和“渲染”工作。`;

    try {
        const prose = await callApi(prompt);
        proseEditor.innerHTML = prose.replace(/\n/g, '<br>');
        cycleData.prose = proseEditor.innerHTML;
        showNotification("正文已生成！", "success");
    } catch (error) {
        proseEditor.innerHTML = `<p style="color: red;">正文生成失败: ${error.message}</p>`;
    } finally {
        isGenerating = false;
    }
}

async function summarizeAndContinue() {
    if (isGenerating) return;

    const allOutlines = Object.values(creationState.cycleContent)
        .map(content => content.outline)
        .filter(Boolean)
        .join('\n\n---\n\n');

    if (!allOutlines) {
        showNotification("还没有任何已生成的细纲可供总结。", "warning");
        return;
    }

    isGenerating = true;
    showNotification("正在总结所有细纲...", "info");
    const summaryModal = document.getElementById('summary-modal');
    const proseSummaryEl = document.getElementById('summary-prose');
    const charStatusEl = document.getElementById('summary-char-status');
    const newCluesEl = document.getElementById('summary-new-clues');
    summaryModal.classList.remove('hidden');
    proseSummaryEl.value = "AI正在总结...";
    charStatusEl.value = "AI正在更新...";
    newCluesEl.value = "AI正在构思...";

    const prompt = `
# 身份: 你是一位顶级的网文责编和故事分析师。
# 任务: 你正在完成一个多章节的“中循环”。请阅读并总结下方提供的【中循环细纲合集】，然后基于全部内容进行角色状态更新和对下一个中循环的伏笔设计。
# 【中循环细纲合集】
---
${allOutlines}
---
# 输出要求: 严格按照JSON格式输出。
\`\`\`json
{
  "prose_summary": "对整个中循环情节的高度浓缩总结。",
  "character_status_update": "主角在中循环结束后的状态变化。",
  "new_clues_and_foreshadowing": "为下一个中循环埋下的新线索或伏笔。"
}
\`\`\``;
    
    try {
        const summaryJsonString = await callApi(prompt);
        const summaryData = parseAiJson(summaryJsonString);
        proseSummaryEl.value = summaryData.prose_summary;
        charStatusEl.value = summaryData.character_status_update;
        newCluesEl.value = summaryData.new_clues_and_foreshadowing;

        document.getElementById('confirm-summary-btn').onclick = async () => {
            const finalSummary = {
                prose_summary: proseSummaryEl.value,
                character_status_update: charStatusEl.value,
                new_clues_and_foreshadowing: newCluesEl.value
            };
            creationState.latestSummary = finalSummary;
            summaryModal.classList.add('hidden');
            
            await generateNextMediumCycleInBlueprint(finalSummary);
            switchTab('inspiration-panel');
        };
    } catch (error) {
        proseSummaryEl.value = `总结失败: ${error.message}`;
    } finally {
        isGenerating = false;
    }
}


// --- 辅助函数 ---

function renderActiveCycleContent() {
    const activeContent = getActiveCycleContent();
    const outlineEditor = document.getElementById('outline-buffer-container');
    const proseEditor = document.getElementById('prose-editor-container');
    
    outlineEditor.innerHTML = activeContent.outline ? activeContent.outline.replace(/\n/g, '<br>') : '';
    proseEditor.innerHTML = activeContent.prose || '';

    if (!outlineEditor.innerHTML) {
        outlineEditor.innerHTML = '<p>这个小循环还没有细纲。</p>';
    }
    if (!proseEditor.innerHTML) {
        proseEditor.innerHTML = '<p>这个小循环还没有正文。</p>';
    }
}

function getActiveCycleContent() {
    if (creationState.activeCycleId && creationState.cycleContent[creationState.activeCycleId]) {
        return creationState.cycleContent[creationState.activeCycleId];
    }
    return { outline: '', prose: '' };
}

function updateActiveCycleInUI() {
    document.querySelectorAll('.small-cycle-item').forEach(item => {
        item.classList.toggle('active', item.id === creationState.activeCycleId);
    });
}

async function handleStyleAnalysis(engine) {
    const sampleTextArea = document.getElementById("style-example-input");
    const guideDisplayArea = document.getElementById("custom-style-guide-display");
    const sampleText = sampleTextArea.value.trim();

    if (!sampleText) {
        showNotification("请先粘贴需要模仿的范文！", "error");
        return;
    }
    
    isGenerating = true;
    guideDisplayArea.value = `正在调用【${engine}】引擎分析文风...`;
    showNotification(`正在调用【${engine}】引擎...`, "info");

    try {
        const prompt = engine === 'SARE' ? Prompts.getSAREAnalysisPrompt(sampleText) : Prompts.getZhujiAnalysisPrompt(sampleText);
        const styleGuide = await callApi(prompt);
        
        creationState.customStyleGuide = styleGuide;
        creationState.customStyleEngine = engine;
        
        guideDisplayArea.value = `--- 由【${engine}】引擎于 ${new Date().toLocaleString()} 生成 ---\n\n${styleGuide}`;
        showNotification(`【${engine}】引擎已成功生成风格指南！`, "success");
    } catch (error) {
        guideDisplayArea.value = `风格分析失败: ${error.message}`;
    } finally {
        isGenerating = false;
    }
}