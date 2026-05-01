// 文件路径: js/modules/01_灵感系统.js
// 描述: (V47.2 博士梦想实现版 - 结局导向重构)
// 1. 【博士梦想实现版】重大升级！processSingleInspiration 函数中的蓝图生成Prompt，现在会明确注入用户选择的【结局基调】。
// 2. AI在设计五幕结构时，将被强制要求以最终结局为导向进行情节规划，确保故事的整体性和方向性。
// 3. 修复了手动模式下切换到写作面板时，部分UI未刷新的小问题。

function renderInspirationPanel() {
    const panel = document.getElementById('inspiration-panel');
    if (!panel) return;

    panel.innerHTML = `
        <div class="inspiration-panel-grid">
            <div class="inspiration-section">
                <h3><i class="fas fa-tasks"></i> 第一步：输入灵感并配置</h3>
                
                <div class="form-group">
                    <label for="inspiration-input-area">1. 在此输入您的核心灵感</label>
                    <textarea id="inspiration-input-area" rows="8" placeholder="例如：一个表面怂包内心腹黑的凡人，在末世靠种田和忽悠建立起一个乌托邦，最终却发现整个末世都是一场针对他的骗局。\n（在“全程自动”模式下可一次性粘贴多行）"></textarea>
                    
                    <div id="manual-mode-actions" class="hidden">
                        <button id="start-manual-btn" class="action-btn" style="width: 100%; margin-top: 10px;"><i class="fas fa-play-circle"></i> 生成故事蓝图</button>
                    </div>
                    <div id="auto-mode-actions" class="hidden">
                        <button id="add-to-queue-btn" class="action-btn" style="width: 100%; margin-top: 10px;"><i class="fas fa-plus-circle"></i> 将上方所有灵感加入队列</button>
                    </div>
                </div>

                <div id="auto-mode-queue-section" class="hidden">
                    <div class="form-group">
                        <label>2. 写作任务队列 (将按顺序自动处理)</label>
                        <div id="inspiration-queue-list" class="document-panel" style="min-height: 150px; max-height: 30vh; overflow-y: auto; padding: 15px; background: var(--bg-color);"></div>
                    </div>
                    <button id="clear-queue-btn" class="settings-btn" style="width: 100%; margin-top: -10px; margin-bottom: 20px;"><i class="fas fa-trash"></i> 清空队列</button>
                </div>

                <div id="writing-config-section">
                    <h3><i class="fas fa-cogs"></i> 第二步：统一配置生成参数</h3>
                    <div class="scribe-controls" style="grid-template-columns: 1fr 1fr; gap: 15px;">
                         <div class="form-group"><label for="scribe-persona">AI作者风格</label><select id="scribe-persona"><optgroup label="核心模式"><option value="style_A12345_P0">通用模式 / 创世模式</option><option value="tomato">番茄长篇风格</option><option value="zhihu">知乎热帖风格</option></optgroup><optgroup label="自定义风格引擎"><option value="custom_style">【导入】使用下方自定义示例</option></optgroup><optgroup label="等级 0: 真空模式 (禁5/留0)"><option value="style_A0_P12345">极限模式 / 真空模式</option></optgroup><optgroup label="等级 1: 独奏模式 (禁4/留1)"><option value="style_A1_P2345">独白模式 (心理)</option><option value="style_A2_P1345">点睛模式 (修饰)</option><option value="style_A3_P1245">咏叹模式 (比喻)</option><option value="style_A4_P1235">舞台模式 (场景)</option><option value="style_A5_P1234">旁白模式 (叙事)</option></optgroup><optgroup label="等级 2: 二重奏 (禁3/留2)"><option value="style_A12_P345">内心描摹模式</option><option value="style_A13_P245">意识流模式</option><option value="style_A14_P235">环境心理模式</option><option value="style_A15_P234">第一人称叙事模式</option><option value="style_A23_P145">诗意模式</option><option value="style_A24_P135">电影镜头模式</option><option value="style_A25_P134">纪录片模式</option><option value="style_A34_P125">幻境模式</option><option value="style_A35_P124">寓言模式</option><option value="style_A45_P123">导演剪辑模式</option></optgroup><optgroup label="等级 3: 三重奏 (禁2/留3)"><option value="style_A123_P45">感性文学模式</option><option value="style_A124_P35">沉浸模式</option><option value="style_A125_P34">角色研究模式</option><option value="style_A134_P25">幻想现实模式</option><option value="style_A135_P24">回忆录模式</option><option value="style_A145_P23">全知视角模式</option><option value="style_A234_P15">华丽描述模式</option><option value="style_A235_P14">散文诗模式</option><option value="style_A245_P13">报告文学模式</option><option value="style_A345_P12">史诗模式</option></optgroup><optgroup label="等级 4: 四重奏 (禁1/留4)"><option value="style_A1234_P5">纯文学模式</option><option value="style_A1235_P4">心理分析模式</option><option value="style_A1245_P3">纪实小说模式</option><option value="style_A1345_P2">神话叙事模式</option><option value="style_A2345_P1">全景描绘模式</option></optgroup></select></div>
                        <div class="form-group"><label for="scribe-perspective">叙事视角</label><select id="scribe-perspective"><option value="第一人称">第一人称</option><option value="第三人称" selected>第三人称</option></select></div>
                        
                        <div class="form-group">
                            <label for="ending-type">结局基调</label>
                            <select id="ending-type">
                                <option value="he">好结局 (HE)</option>
                                <option value="be">坏结局 (BE)</option>
                                <option value="oe">开放式结局</option>
                            </select>
                        </div>
                        
                        <div class="form-group"><label for="total-chapters">总章节数 (可自定义)</label><input type="number" id="total-chapters" value="15" step="1" min="1"></div>
                        <div class="form-group"><label for="scribe-words">每章字数(约)</label><input type="number" id="scribe-words" value="1500" step="100" min="100"></div>
                    </div>
                    <div id="custom-style-section" class="hidden">
                         <h4><i class="fas-solid fa-wand-magic-sparkles"></i> 自定义风格引擎</h4><p style="font-size:0.9em; color: var(--text-muted); margin-bottom:15px;">粘贴任何您想模仿的文风范例，AI将自动分析其语言特征，并生成一份可执行的“创作核心指南”来驱动后续写作。</p>
                        <textarea id="style-example-input" rows="6" placeholder="在此处粘贴您希望AI模仿的文风范例..."></textarea>
                         <div class="button-group" style="display:flex; gap:10px; margin-top: 10px; margin-bottom: 10px;">
                            <button id="analyze-zhuji-btn" class="settings-btn" style="flex:1;"><i class="fas fa-magic"></i> 使用【珠矶】引擎分析</button>
                            <button id="analyze-sare-btn" class="settings-btn" style="flex:1;"><i class="fas fa-cogs"></i> 使用【SARE】引擎分析</button>
                        </div>
                        <textarea id="custom-style-guide-display" placeholder="分析生成的风格指南将显示在这里... 您也可以直接粘贴或编辑已有的指南" rows="8"></textarea>
                    </div>
                    <div id="auto-mode-submit-section" class="hidden">
                         <button id="start-automation-btn" class="action-btn" style="width: 100%; font-size: 1.1em; padding: 15px; margin-top: 20px;"><i class="fas fa-rocket"></i> 确认参数，开始全自动处理！</button>
                    </div>
                </div>
            </div>

            <div class="inspiration-section">
                <h3><i class="fas fa-file-alt"></i> AI生成的故事蓝图 (当前任务)</h3>
                <div id="inspiration-output-container" class="document-panel" style="min-height: 75vh; white-space: pre-wrap; line-height: 1.8;">
                    <p style="color: var(--text-muted);">请先输入灵感，然后点击左侧的“生成故事蓝图”按钮。</p>
                </div>
                <button id="confirm-inspiration-btn" class="action-btn" style="width: 100%; margin-top: 20px; background-color: var(--success-color);" disabled><i class="fas fa-check-double"></i> 确认蓝图，直接开写！</button>
            </div>
        </div>
        <div style="margin-top: 25px;">
             <h3 class="panel-h3"><i class="fas fa-fire"></i> 热门灵感模板 (点击自动填充至输入框)</h3>
             <div class="template-container" id="template-container"></div>
        </div>
    `;
    
    populateHotTemplates();
    document.getElementById('add-to-queue-btn').addEventListener('click', addToQueue);
    document.getElementById('start-manual-btn').addEventListener('click', handleStartManual);
    document.getElementById('clear-queue-btn').addEventListener('click', clearQueue);
    document.getElementById('start-automation-btn').addEventListener('click', handleStartAutomation);
    document.getElementById('confirm-inspiration-btn').addEventListener('click', confirmInspiration);
    
    document.getElementById('scribe-persona').addEventListener('change', () => {
        const customSection = document.getElementById('custom-style-section');
        if (document.getElementById('scribe-persona').value === 'custom_style') { customSection.classList.remove('hidden'); } 
        else { customSection.classList.add('hidden'); }
    });
    document.getElementById('analyze-zhuji-btn').addEventListener('click', () => handleStyleAnalysis('珠矶'));
    document.getElementById('analyze-sare-btn').addEventListener('click', () => handleStyleAnalysis('SARE'));
    
    const customGuideEl = document.getElementById('custom-style-guide-display');
    customGuideEl.addEventListener('input', () => {
        creationState.customStyleGuide = customGuideEl.value;
        creationState.customStyleEngine = '手动输入';
    });
    customGuideEl.addEventListener('paste', () => {
        setTimeout(() => {
            const text = customGuideEl.value.trim();
            creationState.customStyleGuide = text;
            creationState.customStyleEngine = '手动输入';
            if (text) {
                showNotification(`已接收自定义风格指南（${text.length} 字），将在创作时以“绝对核心”优先级生效。`, 'success');
            } else {
                showNotification('未检测到有效内容，请确认已成功粘贴文本。', 'warning');
            }
        }, 0);
    });

    updateUIMode(); 
}

function updateUIMode() {
    const manualActions = document.getElementById('manual-mode-actions');
    const autoActions = document.getElementById('auto-mode-actions');
    const autoQueueSection = document.getElementById('auto-mode-queue-section');
    const autoSubmitSection = document.getElementById('auto-mode-submit-section');
    const configSection = document.getElementById('writing-config-section');

    if (!manualActions || !autoActions || !autoQueueSection || !autoSubmitSection || !configSection) return;

    if (automationMode === 'manual') {
        manualActions.classList.remove('hidden');
        autoActions.classList.add('hidden');
        autoQueueSection.classList.add('hidden');
        autoSubmitSection.classList.add('hidden');
        configSection.classList.remove('hidden');
    } else { // full-auto
        manualActions.classList.add('hidden');
        autoActions.classList.remove('hidden');
        autoQueueSection.classList.remove('hidden');
        autoSubmitSection.classList.remove('hidden');
        updateQueueDisplay();
    }
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
        saveWritingConfig();
    } catch (error) {
        guideDisplayArea.value = `风格分析失败: ${error.message}`;
        showNotification(`文风分析失败: ${error.message}`, "error");
    } finally {
        isGenerating = false;
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

function addToQueue() {
    const inputArea = document.getElementById('inspiration-input-area');
    const inspirations = inputArea.value.trim().split('\n');
    let addedCount = 0;
    inspirations.forEach(inspirationText => {
        if (inspirationText.trim()) {
            creationState.inspirationQueue.push(inspirationText.trim());
            addedCount++;
        }
    });

    if (addedCount > 0) {
        inputArea.value = '';
        updateQueueDisplay();
        showNotification(`已成功将 ${addedCount} 个灵感添加到队列！`, "success");
    } else {
        showNotification("请输入灵感内容！", "error");
    }
}

function clearQueue() {
    creationState.inspirationQueue = [];
    updateQueueDisplay();
    showNotification("灵感队列已清空。", "info");
}

function updateQueueDisplay() {
    const queueListDiv = document.getElementById('inspiration-queue-list');
    const configSection = document.getElementById('writing-config-section');
    if (!queueListDiv || !configSection) return;

    if (creationState.inspirationQueue.length === 0) {
        queueListDiv.innerHTML = '<p style="color: var(--text-muted);">队列为空...</p>';
        configSection.classList.add('hidden');
    } else {
        queueListDiv.innerHTML = '<ul style="list-style-position: inside;">' + creationState.inspirationQueue.map((item, index) => `<li><strong>${index + 1}.</strong> ${item.substring(0, 80)}...</li>`).join('') + '</ul>';
        configSection.classList.remove('hidden');
    }
}

function saveWritingConfig() {
    try {
        creationState.writingStyle = document.getElementById('scribe-persona').value;
        creationState.styleExample = document.getElementById('style-example-input').value.trim();
        creationState.narrativePerspective = document.getElementById('scribe-perspective').value;
        creationState.endingType = document.getElementById('ending-type').value;
        
        const totalChapters = parseInt(document.getElementById('total-chapters').value, 10);
        creationState.totalChapters = isNaN(totalChapters) || totalChapters < 1 ? 1 : totalChapters;

        const wordsPerChapter = parseInt(document.getElementById('scribe-words').value, 10);
        creationState.wordsPerChapter = isNaN(wordsPerChapter) || wordsPerChapter < 100 ? 100 : wordsPerChapter;
        
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

async function handleStartAutomation() {
    if (isGenerating) return;
    if (creationState.inspirationQueue.length === 0) {
        showNotification("灵感队列为空，请先添加灵感！", "error");
        return;
    }
    if (!saveWritingConfig()) return;
    
    creationState.autoFlowState.isRunning = true;
    await processNextInspirationFromQueue();
}

async function processNextInspirationFromQueue() {
    if (isGenerating) return;
    if (creationState.inspirationQueue.length === 0 && creationState.autoFlowState.isRunning) {
        showNotification("队列中的所有灵感都已处理完毕！", "success");
        creationState.autoFlowState.isRunning = false;
        const startBtn = document.getElementById('start-automation-btn');
        if (startBtn) {
             startBtn.innerHTML = `<i class="fas fa-rocket"></i> 开始全自动处理！`;
             startBtn.disabled = false;
        }
        return;
    }
    if (creationState.inspirationQueue.length === 0) return;

    const currentInspiration = creationState.inspirationQueue.shift();
    updateQueueDisplay();
    
    resetCreationState(true); 
    creationState.rawInspiration = currentInspiration;
    
    await processSingleInspiration(currentInspiration, true);
}

async function processSingleInspiration(inspirationText, isAuto = false) {
    isGenerating = true;
    const startBtnAuto = document.getElementById('start-automation-btn');
    const startBtnManual = document.getElementById('start-manual-btn');
    if (isAuto && startBtnAuto) {
        startBtnAuto.disabled = true;
        startBtnAuto.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 处理中... (${creationState.inspirationQueue.length + 1} 剩余)`;
    } else if (!isAuto && startBtnManual) {
        startBtnManual.disabled = true;
        startBtnManual.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 正在生成...`;
    }

    showNotification(`开始深度解析灵感：“${inspirationText.substring(0, 20)}...”`, "info");
    const outputContainer = document.getElementById('inspiration-output-container');
    outputContainer.innerHTML = '<p class="progress-indicator"><i class="fas fa-spinner fa-spin"></i> AI 正在深度解析灵感，生成故事蓝图...</p>'; 
    document.getElementById('confirm-inspiration-btn').disabled = true;
    
    // 【博士核心修改】将结局基调注入Prompt
    const endingToneMap = { 'he': '好结局 (HE)', 'be': '坏结局 (BE)', 'oe': '开放式结局 (OE)' };
    const endingToneText = endingToneMap[creationState.endingType] || '好结局 (HE)';

    const analysisPrompt = `
# 身份：你是一位顶级的、深谙商业网文创作逻辑的故事策划师。
# 能力： 拥有无限的创造力和共情能力。拥有无限丰富的想象力，饱满的情感和严谨的逻辑。
# 核心任务：请将用户提供的【核心灵感】，深度解析并扩写成一份结构完整、逻辑清晰、充满商业爆点的【五幕结构故事蓝图】。

# 【结局基调总纲】 (决定性指令):
---
故事的最终结局必须是【${endingToneText}】。你设计的五幕结构，尤其是第五幕的【终极反转】，必须严格导向这个结局。
---

# 输出限制：
1. 不输出任何AI口吻的提醒、询问、警告、解释、过渡语言、升华性语言、总结性语言。
2. 不在回复结尾输出对未来的剧情、情节或已知剧情内容进行预测的任何句子。
3. 不输出任何机械形式的隐喻、抒情、展望期待、评论、无剧情意义内容、水字数。
4. 默认读者、用户的出发点是[善良、真诚]的且对剧情仅具有小学生的理解能力
5. 不生成极端糟糕的剧情如：[阴谋论][恶意揣测][棋局、棋子、棋手][猎人、猎场][网、渔网、鱼上钩、砧板、鱼肉][动物比喻][食物比喻]
6. 在创作情节时不会往阴谋论的方向猜测，不会为事件赋予神秘色彩。设计的角色不会在幕后操纵全局，或无理地进行邪恶计划；他们的行为不会是狡诈、偏执、威胁、欺骗性的。
# 原创性：
## 对于人名、地名、物品名等名称的创作和设计
拒绝出现沉默 林晚 苏婉 苏晴 沉默 这类太庸俗的名字 
人物角色不得出现 晚 晴 墨 默 同音的谐音的都不行 要有擦边的快感 
语言通俗化 口语化 直白 小白文

1.  避免直接使用训练语料、预训练知识和预训练小说内容中已有的人名、物名、地名。
2. 确保所有内容（人名、物品名、地名等）都是原创的、小众的、独特的、非热词的、非预测性，避免抄袭或直接引用已知或现有作品。
## 对于情节的创作
1.  避免直接使用训练语料、预训练知识和预训练小说内容中已有的事件。
2. **原创性**：确保所有情节都是原创的，避免抄袭或直接引用已知或现有作品。
# 【核心灵感】:
---
${inspirationText}
---
# 【输出要求】 (必须严格遵守):
你的回答必须是一份结构清晰的Markdown格式报告，严格包含以下所有部分，不得遗漏：
## 🏝️💥 标题解析
(分析核心冲突与亮点，给出爆款标题)
## 🎬 小说标题
(直接给出最终推荐的标题)
## 🧩Ⅰ. 故事设定
(用表格形式列出【主角】、【世界背景】和【系统/金手指】)
## 🎯Ⅱ. 五幕结构 × 五钩五反转
(这是核心！将故事拆解为五幕，每幕包含“钩子”和“反转”，并确保最终反转符合【${endingToneText}】)
✅ **第一幕：[幕标题] (0-15%)**\n * **钩子1:** [描述]\n * **反转1:** [描述]
✅ **第二幕：[幕标题] (15%-40%)**\n * **钩子2:** [描述]\n * **反转2:** [描述]
✅ **第三幕：[幕标题] (40%-65%)**\n * **钩子3:** [描述]\n * **反转3:** [描述]
✅ **第四幕：[幕标题] (65%-90%)**\n * **钩子4:** [描述]\n * **反转4:** [描述]
✅ **第五幕：[幕标题] (90%-100%)**\n * **钩子5:** [描述]\n * **终极反转:** [描述]
## 🧨 爆点金句合集
(创作5-7句在不同情境下的爆款台词)
## ✍️ 正文开头 · 试读段落
(写一段约200-300字、极具吸引力的正文开篇。禁用明喻，避免带有触感、细腻、微妙的动作之类的句子，避免任何情感表达词汇、褒贬色彩的形容词或副词的句子。)
`;

    try {
        const fullBlueprint = await callApi(analysisPrompt, false);
        await streamTextToElement(outputContainer, fullBlueprint, 5, true);
        
        creationState.inspirationConcept = fullBlueprint;
        creationState.finalOutline = null; 
        creationState.novelTitle = (fullBlueprint.match(/🎬 小说标题\s*\n\s*(.*)/) || [])[1]?.trim() || "未命名作品";
        
        showNotification("故事蓝图已生成！", "success");
        document.getElementById('confirm-inspiration-btn').disabled = false;
        
        if (isAuto && creationState.autoFlowState.isRunning) {
            showNotification("自动化：蓝图已生成，1秒后自动确认并进入下一步...", "info");
            setTimeout(confirmInspiration, 1000); 
        }

    } catch (error) {
        outputContainer.innerHTML = `<p style="color:var(--error-color);">灵感解析失败: ${error.message}</p>`;
        showNotification("灵感解析失败，流程中断。", "error");
        if(isAuto) {
            creationState.autoFlowState.isRunning = false;
        }
    } finally {
        isGenerating = false;
         if (startBtnAuto) {
             startBtnAuto.innerHTML = `<i class="fas fa-rocket"></i> 确认参数，开始全自动处理！`;
             startBtnAuto.disabled = creationState.inspirationQueue.length === 0;
        }
        if(startBtnManual) {
            startBtnManual.disabled = false;
            startBtnManual.innerHTML = `<i class="fas fa-play-circle"></i> 生成故事蓝图`;
        }
    }
}

function confirmInspiration() {
    if (isGenerating || !creationState.inspirationConcept) {
        showNotification("当前没有可确认的蓝图或AI正在工作中。", "error");
        return;
    }
    
    if (!saveWritingConfig()) return;
    
    const confirmBtn = document.getElementById('confirm-inspiration-btn');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-check-double"></i> 已确认，正在跳转...';
    
    proceedToNextStep('inspiration');
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