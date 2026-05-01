// 文件路径: js/modules/01_灵感系统.js
// 描述: (V62.0 博士·梦想圆满·终极版) - 【Kilo Code 紧急恢复版】

function initializeInspirationPanel() {
    const panel = document.getElementById('inspiration-panel');
    if (!panel) return;

    const startBtn = panel.querySelector('#start-pipeline-btn');
    const stopBtn = panel.querySelector('#stop-pipeline-btn');

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            const inspiration = document.getElementById('core-inspiration').value;
            const title = '新项目'; // Simplified for now
            const totalChapters = document.getElementById('total-chapters').value;
            
            // This is a simplified call. The new pipeline module will handle the state.
            if (typeof startSinglePipeline === 'function') {
                startSinglePipeline(inspiration, title);
            } else {
                showNotification('错误：流水线模块未正确加载。', 'error');
            }
        });
    }

    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            if (typeof stopPipeline === 'function') {
                stopPipeline();
            }
        });
    }
    
    console.log('灵感蓝图模块已与新流水线连接。');
}

function toggleBlueprintView() {
    const editor = document.getElementById('blueprint-editor');
    const btn = document.getElementById('toggle-blueprint-view-btn');
    const currentMode = btn.dataset.viewMode;

    if (currentMode === 'rendered') {
        // 切换到源码模式
        editor.innerText = editor.innerHTML;
        editor.contentEditable = 'false';
        btn.innerHTML = '<i class="fas fa-eye"></i> 查看渲染';
        btn.dataset.viewMode = 'source';
    } else {
        // 切换到渲染模式
        editor.innerHTML = editor.innerText;
        editor.contentEditable = 'true';
        btn.innerHTML = '<i class="fas fa-code"></i> 查看源码';
        btn.dataset.viewMode = 'rendered';
    }
}

async function handleStartManual() {
    if (isGenerating) return;
    const inputArea = document.getElementById('inspiration-input-area');
    const inspirationText = inputArea.value.trim().split('\n')[0];
    
    if (!inspirationText) {
        showNotification("请输入您的核心灵感！", "error");
        return;
    }
    if (!saveWritingConfig()) return;

    resetCreationState(true);
    creationState.rawInspiration = inspirationText;
    await processSingleInspiration(inspirationText);
}

function saveWritingConfig() {
    try {
        // creationState.writingStyle = document.getElementById('scribe-persona').value; // 已迁移
        creationState.styleExample = document.getElementById('style-example-input').value.trim();
        creationState.narrativePerspective = document.getElementById('scribe-perspective').value;
        creationState.endingType = document.getElementById('ending-type').value;
        
        const totalChapters = parseInt(document.getElementById('total-chapters').value, 10);
        creationState.totalChapters = isNaN(totalChapters) || totalChapters < 1 ? 1 : totalChapters;
        
        const totalVolumes = parseInt(document.getElementById('total-volumes').value, 10);
        creationState.totalVolumes = isNaN(totalVolumes) || totalVolumes < 1 ? 1 : totalVolumes;

        // const wordsPerChapter = parseInt(document.getElementById('scribe-words').value, 10); // 已迁移
        // creationState.wordsPerChapter = isNaN(wordsPerChapter) || wordsPerChapter < 100 ? 100 : wordsPerChapter;
        
        
        if (creationState.writingStyle === 'custom_style') {
            creationState.customStyleGuide = document.getElementById('custom-style-guide-display').value;
            if (!creationState.customStyleGuide) {
                 showNotification("请先粘贴范文并使用引擎分析，或直接在下方框中输入您的风格指南！", "warning");
                 return false;
            }
        }
        
        showNotification("写作参数已保存。", "info");
        return true;
    } catch (error) {
        console.error("保存写作配置时出错:", error);
        showNotification("保存参数失败，请检查输入。", "error");
        return false;
    }
}

async function processSingleInspiration(inspirationText) {
    isGenerating = true;
    const startBtnManual = document.getElementById('start-manual-btn');
    if (startBtnManual) {
        startBtnManual.disabled = true;
        startBtnManual.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 正在生成...`;
    }

    showNotification(`开始深度解析灵感：“${inspirationText.substring(0, 20)}...”`, "info");
    const blueprintEditor = document.getElementById('blueprint-editor');
    
    blueprintEditor.innerHTML = `<p><i>AI 正在深度解析灵感，生成故事蓝图...</i></p><p><i>请耐心等待，这可能需要一些时间...</i></p>`;
    document.getElementById('confirm-inspiration-btn').disabled = true;
    document.getElementById('continue-blueprint-btn').classList.add('hidden');
    
    const endingToneMap = { 'he': '好结局 (HE)', 'be': '坏结局 (BE)', 'oe': '开放式结局 (OE)' };
    const endingToneText = endingToneMap[creationState.endingType] || '好结局 (HE)';
    
    const analysisPrompt = `
# 身份：你是一位顶级的、深谙商业长篇网文创作逻辑的故事策划师与世界观架构师。
# 核心指令 (最高优先级)：你的一切思考和输出，都必须严格基于下方提供的【核心灵感】进行。你的任务是构建一个完整、结构化、可执行的【故事蓝图】，其结构必须严格模仿【输出格式范例】。

# 【核心灵感】(创作的唯一依据):
---
${inspirationText}
---

# 【长篇小说设定】(关键参数):
- **总卷数:** ${creationState.totalVolumes} 卷 (大循环数量)
- **总章数:** ${creationState.totalChapters} 章
- **结局基调 (决定性指令):** 故事的最终结局必须是【${endingToneText}】。

# 【输出格式范例】(你必须严格模仿此HTML结构和内容组织方式进行输出):
\`\`\`html
<section id="world-bible">
    <h2>世界法典 (World Bible)</h2>
    <blockquote>这是您世界的"底层代码"和"物理法则"...</blockquote>
    <article>
        <h3>一、 核心数据</h3>
        <dl>
            <dt>标题:</dt><dd>《作品名》</dd>
            <dt>标签:</dt><dd><span class="tag">#标签1</span> <span class="tag">#标签2</span></dd>
            <dt>简介:</dt><dd>一句话简介...</dd>
        </dl>
    </article>
    <article>
        <h3>二、 底层架构</h3>
        <dl>
            <dt>1. 世界观:</dt><dd><ul><li><strong>法则一:</strong> ...</li></ul></dd>
            <dt>2. 经济系统:</dt><dd><ul><li>...</li></ul></dd>
            <dt>3. 组织/势力:</dt><dd><ul><li>...</li></ul></dd>
        </dl>
    </article>
</section>

<section id="story-blueprint">
    <h2>${creationState.totalChapters}章完整施工蓝图</h2>
    <blockquote>这是您故事的"工程总图"...</blockquote>
    
    <article id="volume-1">
        <h4>第一篇章：《卷名》 (卷一：Ch. 1-30)</h4>
        <blockquote>本卷核心...</blockquote>
        <div class="foreshadowing-card">
            <div class="foreshadowing-header">本章伏笔与线索</div>
            <div class="foreshadowing-content">
                <div class="foreshadowing-item">
                    <div class="foreshadowing-title">伏笔1</div>
                    <p>描述...</p>
                </div>
            </div>
        </div>
        <div class="medium-cycle">
            <h5>中循环1: [中循环标题] (Ch. 1-6)</h5>
            <div class="small-cycle">
                <div class="small-cycle-header">小循环 1 (Ch. 1-2): [小循环标题]</div>
                <div class="small-cycle-content">
                    <div class="scene">
                        <div class="scene-title">场景1: [场景标题] (Ch. 1)</div>
                        <ul class="plot-points">
                            <li>情节点1: [具体事件]</li>
                            <li>情节点2: [对话]</li>
                            <li>情节点3: [心理活动]</li>
                            <li>... (此处必须扩充至10-18个情节点)</li>
                            <li>情节点18: [场景结束时的状态或转折]</li>
                        </ul>
                    </div>
                    <div class="scene">
                        <div class="scene-title">场景2: [场景标题] (Ch. 2)</div>
                        <ul class="plot-points">
                            <li>情节点1: [具体事件]</li>
                            <li>... (此处必须扩充至10-18个情节点)</li>
                            <li>情节点18: [场景结束时的状态或转折]</li>
                        </ul>
                    </div>
                </div>
            </div>
            <!-- ... 此处应包含此中循环的全部小循环 ... -->
        </div>
        <div class="status-card">
            <h5>角色状态更新: 主角名 (Ch. 30)</h5>
            <ul>
                <li><strong>核心驱动力:</strong> ...</li>
            </ul>
        </div>
    </article>
</section>
\`\`\`

# 你的任务
现在，请严格按照上面的HTML结构，将【核心灵感】和【长篇小说设定】填充进去，生成一份完整、详尽、逻辑严密的故事蓝图。
- **结构遵从 (最高优先级)**: 你的输出必须严格遵从范例的层级结构。
- **内容密度 (最高优先级)**: **每一个** \`<ul class="plot-points">\` 列表内，**必须**包含 **10 到 18 个** \`<li>\` 形式的情节点。这是硬性规定，决定了蓝图的可用性。
- **完整性**: 你必须一次性生成**所有篇章**、及其下属的**所有中循环**和**所有小循环**的完整规划。不要只写一部分。
- **内容原创**: 所有内容，从篇章名到每一个情节点，都必须是你基于【核心灵-感】原创的。
`;

    try {
        const fullBlueprintHtml = await callApi(analysisPrompt);
        const cleanedHtml = fullBlueprintHtml.replace(/>\s+</g, '><').trim();
        blueprintEditor.innerHTML = cleanedHtml;
        creationState.inspirationConcept = cleanedHtml;
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = creationState.inspirationConcept;
        const titleElement = tempDiv.querySelector('dd');
        creationState.novelTitle = titleElement ? titleElement.textContent.trim().replace(/《|》/g, '') : '未命名作品';

        showNotification("故事蓝图已生成！您现在可以编辑和确认。", "success");
        document.getElementById('confirm-inspiration-btn').disabled = false;
        checkBlueprintForContinuation();

    } catch (error) {
        blueprintEditor.innerHTML = `<p style="color: red;">灵感解析失败: ${error.message}</p>`;
        showNotification("灵感解析失败，流程中断。", "error");
    } finally {
        isGenerating = false;
        if(startBtnManual) {
            startBtnManual.disabled = false;
            startBtnManual.innerHTML = `<i class="fas fa-play-circle"></i> 生成故事蓝图`;
        }
    }
}

async function confirmInspiration() {
    creationState.inspirationConcept = document.getElementById('blueprint-editor').innerHTML;
    if (isGenerating || !creationState.inspirationConcept) {
        showNotification("当前没有可确认的蓝图或AI正在工作中。", "error");
        return;
    }
    if (creationState.inspirationConcept.includes('<!-- MORE_CONTENT_TO_GENERATE -->')) {
        if (!confirm("警告：当前蓝图可能不完整，您确定要继续吗？")) {
            return;
        }
    }
    if (!saveWritingConfig()) return;

    // 提取并存储 World Bible
    try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = creationState.inspirationConcept;
        const worldBibleEl = tempDiv.querySelector('#world-bible');
        if (worldBibleEl) {
            creationState.worldBible = worldBibleEl.innerHTML;
            showNotification("世界法典已提取并存入核心状态。", "info");
        } else {
            creationState.worldBible = "未在蓝图中找到世界法典。";
            showNotification("警告：未在蓝图中找到 #world-bible 节点。", "warning");
        }
    } catch (error) {
        console.error("提取世界法典失败:", error);
        showNotification("提取世界法典时出错，流程继续，但可能影响后续生成质量。", "error");
    }
    
    showNotification("蓝图已确认！正在准备写作面板...", "success");
    proceedToNextStep('inspiration');
}

function checkBlueprintForContinuation() {
    const blueprintEditor = document.getElementById('blueprint-editor');
    const continueBtn = document.getElementById('continue-blueprint-btn');
    if (blueprintEditor.innerHTML.includes('<!-- MORE_CONTENT_TO_GENERATE -->')) {
        continueBtn.classList.remove('hidden');
    } else {
        continueBtn.classList.add('hidden');
    }
}

async function continueBlueprintGeneration() {
    if (isGenerating) return;
    const blueprintEditor = document.getElementById('blueprint-editor');
    let currentContent = blueprintEditor.innerHTML;
    currentContent = currentContent.replace('<!-- MORE_CONTENT_TO_GENERATE -->', '').trim();

    const continueBtn = document.getElementById('continue-blueprint-btn');
    continueBtn.disabled = true;
    continueBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 正在继续...`;
    isGenerating = true;

    try {
        const prompt = `
# 身份：你是一位顶级的故事策划师。
# 任务：你正在创作一份详细的故事蓝图，但内容过长导致上一次输出中断了。现在，请你严格地、无缝地从中断处继续生成剩余的内容。
# 已有内容 (你的续写必须紧接着这部分内容):
---
${currentContent}
---
# 核心指令:
1.  **无缝衔接**: 你的输出必须是紧接着已有内容的下一部分，不要重复任何已有内容，也不要添加任何前言或总结。
2.  **保持格式**: 严格保持和之前内容一致的HTML结构。
3.  **续写标记**: 如果你的输出再次因为内容过长而中断，请务必在你的回答末尾添加 \`<!-- MORE_CONTENT_TO_GENERATE -->\` 标记。如果已全部写完，则不要添加此标记。
`;
        const continuedContent = await callApi(prompt);
        const finalHtml = (currentContent + '\n' + continuedContent).replace(/>\s+</g, '><').trim();
        blueprintEditor.innerHTML = finalHtml;
        creationState.inspirationConcept = finalHtml;
        checkBlueprintForContinuation();
        showNotification("蓝图已续写！", "success");

    } catch (error) {
        showNotification(`续写蓝图失败: ${error.message}`, "error");
    } finally {
        isGenerating = false;
        continueBtn.disabled = false;
        continueBtn.innerHTML = `<i class="fas fa-angle-double-down"></i> 继续生成蓝图`;
    }
}

function processImportedBlueprint() {
    const importTextArea = document.getElementById('blueprint-import-textarea');
    const blueprintHtml = importTextArea.value;

    if (!blueprintHtml || blueprintHtml.trim() === "") {
        showNotification("未输入任何内容。", "info");
        return;
    }

    // 基础验证
    if (!blueprintHtml.includes('id="story-blueprint"') || !blueprintHtml.includes('id="world-bible"')) {
        showNotification("导入失败：大纲缺少必要的世界法典 (world-bible) 或故事蓝图 (story-blueprint) ID。", "error");
        return;
    }

    const blueprintEditor = document.getElementById('blueprint-editor');
    const cleanedHtml = blueprintHtml.replace(/>\s+</g, '><').trim();
    
    blueprintEditor.innerHTML = cleanedHtml;
    creationState.inspirationConcept = cleanedHtml;
    
    // 尝试提取标题
    try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cleanedHtml;
        const titleElement = tempDiv.querySelector('dd');
        creationState.novelTitle = titleElement ? titleElement.textContent.trim().replace(/《|》/g, '') : '未命名作品';
    } catch (e) {
        creationState.novelTitle = '导入的作品';
    }
    
    async function generateNextMediumCycleInBlueprint(summary) {
        showNotification("AI正在基于您的总结，规划下一个中循环...", "info");
        isGenerating = true;
    
        const blueprintEditor = document.getElementById('blueprint-editor');
        // 确保我们在渲染模式下进行添加
        const viewBtn = document.getElementById('toggle-blueprint-view-btn');
        if (viewBtn.dataset.viewMode === 'source') {
            toggleBlueprintView(); //切换回渲染模式
        }
        
        // 显示加载状态
        const loadingEl = document.createElement('div');
        loadingEl.innerHTML = `<p><i>AI 正在构建下一阶段的蓝图...</i></p>`;
        blueprintEditor.appendChild(loadingEl);
    
        const worldBibleContext = creationState.worldBible || "无世界法典";
        const previousSummary = `
            - **上文撮要**: ${summary.prose_summary}
            - **角色状态变化**: ${summary.character_status_update}
            - **待解决的线索与伏笔**: ${summary.new_clues_and_foreshadowing}
        `;
    
        // 动态计算下一个中循环的章节范围
        // 这是一个简化逻辑，需要根据您的具体结构来完善
        const existingMediumCycles = blueprintEditor.querySelectorAll('.medium-cycle').length;
        const chaptersPerMediumCycle = 6; // 假设每个中循环6章
        const startChapter = (existingMediumCycles * chaptersPerMediumCycle) + 1;
        const endChapter = startChapter + chaptersPerMediumCycle - 1;
    
        const prompt = `
    # 身份: 你是一位顶级世界观架构师和故事策划师。
    # 核心指令 (最高优先级): 你的所有思考和输出，都必须严格遵循【世界法典】，并紧密衔接【前情提要】。你的任务是生成下一个“中循环”的完整HTML蓝图。
    
    # 【世界法典】 (故事的底层物理法则和核心设定，不可违背)
    ---
    ${worldBibleContext}
    ---
    
    # 【前情提要】 (上一个中循环的完整总结)
    ---
    ${previousSummary}
    ---
    
    # 任务:
    基于以上的世界观和前情提要，构思并生成故事的**下一个中循环**。
    - **章节范围**: Ch. ${startChapter}-${endChapter}
    - **内容要求**: 必须包含新的核心事件、冲突，并对【前情提要】中的线索和伏笔进行展开或回应。
    - **输出格式**: 你的输出必须是严格的HTML代码，且只包含一个 \`<div class="medium-cycle">\` 及其所有子元素，严格遵循下面的范例结构。不要包含任何额外的解释或代码块标记。
    
    # 【输出格式范例】
    \`\`\`html
    <div class="medium-cycle">
        <h5>中循环${existingMediumCycles + 1}: [新中循环标题] (Ch. ${startChapter}-${endChapter})</h5>
        <div class="small-cycle">
            <div class="small-cycle-header">小循环 1 (Ch. ${startChapter}-${startChapter+1}): [小循环标题]</div>
            <div class="small-cycle-content">
                <div class="scene"><div class="scene-title">场景1: [场景标题] (Ch. ${startChapter})</div><ul class="plot-points"><li>[情节点]</li></ul></div>
                <div class="scene"><div class="scene-title">场景2: [场景标题] (Ch. ${startChapter+1})</div><ul class="plot-points"><li>[情节点]</li></ul></div>
            </div>
        </div>
        <div class="small-cycle">
            <div class="small-cycle-header">小循环 2 (Ch. ${startChapter+2}-${startChapter+3}): [小循环标题]</div>
            <div class="small-cycle-content">
                ...
            </div>
        </div>
        <div class="small-cycle">
            <div class="small-cycle-header">小循环 3 (Ch. ${startChapter+4}-${endChapter}): [小循环标题]</div>
            <div class="small-cycle-content">
                ...
            </div>
        </div>
    </div>
    \`\`\`
    `;
    
        try {
            const newCycleHtml = await callApi(prompt);
            const cleanedHtml = newCycleHtml.replace(/```html\n?/, '').replace(/```\n?$/, '').trim();
            
            // 将新生成的中循环追加到最后一个篇章(article)的末尾
            const articles = blueprintEditor.querySelectorAll('article[id^="volume-"]');
            if (articles.length > 0) {
                articles[articles.length - 1].insertAdjacentHTML('beforeend', cleanedHtml);
            } else {
                 blueprintEditor.innerHTML += cleanedHtml; // 如果没有article，则直接添加
            }
    
            creationState.inspirationConcept = blueprintEditor.innerHTML; // 更新全局状态
            showNotification("下一个中循环的蓝图已生成！", "success");
    
        } catch (error) {
            showNotification(`生成下一中循环失败: ${error.message}`, "error");
        } finally {
            loadingEl.remove();
            isGenerating = false;
        }
    }

    showNotification("外部大纲已成功导入！", "success");
    document.getElementById('confirm-inspiration-btn').disabled = false;
    checkBlueprintForContinuation();
    
    // 关闭模态框并清空文本域
    document.getElementById('import-blueprint-modal').classList.add('hidden');
    importTextArea.value = '';
}

function populateHotTemplates() {
    const container = document.getElementById('template-container');
    const input = document.getElementById('inspiration-input-area');
    if (!container || !input) return;
    container.innerHTML = '';
    HOT_INSPIRATION_TEMPLATES.forEach(template => {
        const card = document.createElement('div');
        card.className = 'choice-card';
        card.innerHTML = `<h4>${template.title}</h4><p>${template.brief.substring(0, 80)}...</p>`;
        card.addEventListener('click', () => {
            input.value += (input.value ? '\n' : '') + template.brief;
            input.scrollTop = input.scrollHeight;
            showNotification("模板已填充。", "info");
        });
        container.appendChild(card);
    });
}