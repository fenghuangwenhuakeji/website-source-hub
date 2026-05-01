// 文件路径: js/modules/01_灵感系统.js
// 描述: (V62.0 博士·梦想圆满·终极版)
// 1. 【博士重点批注】: 遵照您的指示，彻底移除了与“全程自动模式”相关的UI元素，包括“加入队列”按钮、任务队列显示区域、“清空队列”和“开始全自动处理”按钮。
// 2. 【博士重点批注】: 简化了UI逻辑，现在“生成故事蓝图”按钮将始终可见，因为手动模式是唯一的模式。
// 3. 【博士重点批注】: 删除了所有与队列和自动化流程相关的后台函数，如 addToQueue, clearQueue, updateUIMode, handleStartAutomation 等，使代码更精简。

function renderInspirationPanel() {
    const panel = document.getElementById('inspiration-panel');
    if (!panel) return;

    panel.innerHTML = `
        <div class="inspiration-panel-grid">
            <div class="inspiration-section">
                <h3><i class="fas fa-tasks"></i> 第一步：输入灵感并配置</h3>
                
                <div class="form-group">
                    <label for="inspiration-input-area">1. 在此输入您的核心灵感</label>
                    <textarea id="inspiration-input-area" rows="8" placeholder="例如：一个表面怂包内心腹黑的凡人，在末世靠种田和忽悠建立起一个乌托邦，最终却发现整个末世都是一场针对他的骗局。">${creationState.rawInspiration || ''}</textarea>
                    
                    <div id="manual-mode-actions">
                        <button id="start-manual-btn" class="action-btn" style="width: 100%; margin-top: 10px;"><i class="fas fa-play-circle"></i> 生成故事蓝图</button>
                    </div>
                </div>

                <div id="writing-config-section">
                    <h3><i class="fas fa-cogs"></i> 第二步：统一配置生成参数</h3>
                    <div class="scribe-controls" style="grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                         <div class="form-group"><label for="scribe-persona">AI作者风格</label><select id="scribe-persona"><optgroup label="核心模式"><option value="style_A12345_P0">通用模式 / 创世模式</option><option value="tomato">番茄长篇风格</option><option value="zhihu">知乎热帖风格</option></optgroup><optgroup label="自定义风格引擎"><option value="custom_style">【导入】使用下方自定义示例</option></optgroup><optgroup label="等级 0: 真空模式 (禁5/留0)"><option value="style_A0_P12345">极限模式 / 真空模式</option></optgroup><optgroup label="等级 1: 独奏模式 (禁4/留1)"><option value="style_A1_P2345">独白模式 (心理)</option><option value="style_A2_P1345">点睛模式 (修饰)</option><option value="style_A3_P1245">咏叹模式 (比喻)</option><option value="style_A4_P1235">舞台模式 (场景)</option><option value="style_A5_P1234">旁白模式 (叙事)</option></optgroup><optgroup label="等级 2: 二重奏 (禁3/留2)"><option value="style_A12_P345">内心描摹模式</option><option value="style_A13_P245">意识流模式</option><option value="style_A14_P235">环境心理模式</option><option value="style_A15_P234">第一人称叙事模式</option><option value="style_A23_P145">诗意模式</option><option value="style_A24_P135">电影镜头模式</option><option value="style_A25_P134">纪录片模式</option><option value="style_A34_P125">幻境模式</option><option value="style_A35_P124">寓言模式</option><option value="style_A45_P123">导演剪辑模式</option></optgroup><optgroup label="等级 3: 三重奏 (禁2/留3)"><option value="style_A123_P45">感性文学模式</option><option value="style_A124_P35">沉浸模式</option><option value="style_A125_P34">角色研究模式</option><option value="style_A134_P25">幻想现实模式</option><option value="style_A135_P24">回忆录模式</option><option value="style_A145_P23">全知视角模式</option><option value="style_A234_P15">华丽描述模式</option><option value="style_A235_P14">散文诗模式</option><option value="style_A245_P13">报告文学模式</option><option value="style_A345_P12">史诗模式</option></optgroup><optgroup label="等级 4: 四重奏 (禁1/留4)"><option value="style_A1234_P5">纯文学模式</option><option value="style_A1235_P4">心理分析模式</option><option value="style_A1245_P3">纪实小说模式</option><option value="style_A1345_P2">神话叙事模式</option><option value="style_A2345_P1">全景描绘模式</option></optgroup></select></div>
                        <div class="form-group"><label for="scribe-perspective">叙事视角</label><select id="scribe-perspective"><option value="第一人称">第一人称</option><option value="第三人称" selected>第三人称</option></select></div>
                        <div class="form-group"><label for="ending-type">结局基调</label><select id="ending-type"><option value="he">好结局 (HE)</option><option value="be">坏结局 (BE)</option><option value="oe">开放式结局</option></select></div>
                        
                        <div class="form-group"><label for="total-volumes">总卷数 (长篇)</label><input type="number" id="total-volumes" value="5" step="1" min="1"></div>
                        <div class="form-group"><label for="total-chapters">总章节数 (600-1000)</label><input type="number" id="total-chapters" value="600" step="1" min="1"></div>
                        <div class="form-group"><label for="scribe-words">每章字数(约 2000)</label><input type="number" id="scribe-words" value="2000" step="100" min="100"></div>
                    </div>
                    <div id="custom-style-section" class="hidden">
                         <h4><i class="fas fa-wand-magic-sparkles"></i> 自定义风格引擎</h4><p style="font-size:0.9em; color: var(--text-muted); margin-bottom:15px;">粘贴任何您想模仿的文风范例，AI将自动分析其语言特征，并生成一份可执行的“创作核心指南”来驱动后续写作。</p>
                        <textarea id="style-example-input" rows="6" placeholder="在此处粘贴您希望AI模仿的文风范例..."></textarea>
                         <div class="button-group" style="display:flex; gap:10px; margin-top: 10px; margin-bottom: 10px;">
                            <button id="analyze-zhuji-btn" class="settings-btn" style="flex:1;"><i class="fas fa-magic"></i> 使用【珠矶】引擎分析</button>
                            <button id="analyze-sare-btn" class="settings-btn" style="flex:1;"><i class="fas fa-cogs"></i> 使用【SARE】引擎分析</button>
                        </div>
                        <textarea id="custom-style-guide-display" placeholder="分析生成的风格指南将显示在这里... 您也可以直接粘贴或编辑已有的指南" rows="8"></textarea>
                    </div>
                </div>
            </div>

            <div class="inspiration-section">
                <h3><i class="fas fa-file-alt"></i> AI生成的故事蓝图 (此内容生成后可修改)</h3>
                <div id="inspiration-output-container" class="document-panel" style="min-height: 75vh; display: flex; flex-direction: column; padding: 0;">
                     <textarea id="blueprint-editor" class="cockpit-scroll-area" style="flex-grow: 1; width: 100%; background: transparent; border: none; resize: none; color: var(--text-color); padding: 25px; line-height: 1.8;" placeholder="请先输入灵感，然后点击左侧的“生成故事蓝图”按钮。">${creationState.inspirationConcept || ''}</textarea>
                </div>
                <button id="confirm-inspiration-btn" class="action-btn" style="width: 100%; margin-top: 20px; background-color: var(--success-color);" ${!creationState.inspirationConcept ? 'disabled' : ''}><i class="fas fa-check-double"></i> 确认蓝图，并生成宏观大纲！</button>
            </div>
        </div>
        <div style="margin-top: 25px;">
             <h3 class="panel-h3"><i class="fas fa-fire"></i> 热门灵感模板 (点击自动填充至输入框)</h3>
             <div class="template-container" id="template-container"></div>
        </div>
    `;
    
    populateHotTemplates();
    document.getElementById('start-manual-btn').addEventListener('click', handleStartManual);
    document.getElementById('confirm-inspiration-btn').addEventListener('click', confirmInspiration);
    
    const blueprintEditor = document.getElementById('blueprint-editor');
    blueprintEditor.addEventListener('input', () => {
        creationState.inspirationConcept = blueprintEditor.value;
    });

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
}

// 【博士重点批注】: 此函数用于分析您提供的文风范例，功能保持不变。
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

// 【博士重点批注】: 这是手动模式下点击“生成故事蓝图”按钮时触发的函数，功能保持不变。
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

// 【博士重点批注】: 此函数用于保存您在左侧配置的写作参数，功能保持不变。
function saveWritingConfig() {
    try {
        creationState.writingStyle = document.getElementById('scribe-persona').value;
        creationState.styleExample = document.getElementById('style-example-input').value.trim();
        creationState.narrativePerspective = document.getElementById('scribe-perspective').value;
        creationState.endingType = document.getElementById('ending-type').value;
        
        const totalChapters = parseInt(document.getElementById('total-chapters').value, 10);
        creationState.totalChapters = isNaN(totalChapters) || totalChapters < 1 ? 1 : totalChapters;
        
        const totalVolumes = parseInt(document.getElementById('total-volumes').value, 10);
        creationState.totalVolumes = isNaN(totalVolumes) || totalVolumes < 1 ? 1 : totalVolumes;

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


// 【博士重点批注】: 这是核心的灵感处理函数，功能保持不变。
async function processSingleInspiration(inspirationText) {
    isGenerating = true;
    const startBtnManual = document.getElementById('start-manual-btn');
    if (startBtnManual) {
        startBtnManual.disabled = true;
        startBtnManual.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 正在生成...`;
    }

    showNotification(`开始深度解析灵感：“${inspirationText.substring(0, 20)}...”`, "info");
    const blueprintEditor = document.getElementById('blueprint-editor');
    
    blueprintEditor.value = `AI 正在深度解析灵感，生成故事蓝图...\n请耐心等待，这可能需要一些时间...`;
    document.getElementById('confirm-inspiration-btn').disabled = true;
    
    const endingToneMap = { 'he': '好结局 (HE)', 'be': '坏结局 (BE)', 'oe': '开放式结局 (OE)' };
    const endingToneText = endingToneMap[creationState.endingType] || '好结局 (HE)';
    
    const analysisPrompt = `
# 身份：你是一位顶级的、深谙商业长篇网文创作逻辑的故事策划师与世界观架构师。
# 核心指令 (最高优先级)：你的一切思考和输出，都必须严格基于下方提供的【核心灵感】进行。绝对禁止脱离此灵感自由发挥或创作无关内容。你的任务是对该灵感进行专业化、结构化的扩写，而不是替换它。

# 【核心灵感】(创作的唯一依据):
---
${inspirationText}
---

# 【长篇小说设定】(关键参数):
- **总卷数:** ${creationState.totalVolumes} 卷
- **总章数:** ${creationState.totalChapters} 章
- **结局基调 (决定性指令):** 故事的最终结局必须是【${endingToneText}】。你设计的整个故事，特别是最终卷的情节，必须严格导向这个结局。

# 【输出要求】 (必须严格遵守，这是你的专业体现):
你的回答必须是一份结构清晰的Markdown格式报告，严格包含以下所有部分，内容要详实、有深度，能够支撑起一部长篇巨著。

## 📚 小说标题
(直接给出3个与【核心灵感】紧密相关的、充满吸引力的备选标题)

## 🌍 世界观核心设定
(基于【核心灵感】进行深度拓展，详细描述世界背景、力量体系、主要势力、地理格局、核心法则等，至少500字)

## 🎭 核心角色阵容 (至少5-7人)
(用表格形式，围绕【核心灵感】中的人物设定，详细列出【姓名/代号】、【角色定位】、【性格特征】、【核心动机】、【人物弧光/成长线】)

## 🗺️ 全书故事总纲 (按分卷构建)
(这是核心！将整个故事划分为 ${creationState.totalVolumes} 卷，清晰阐述每一卷的核心主题、主要情节脉络、关键转折点和最终要达成的阶段性目标。每一卷的描述都必须紧扣【核心灵感】，并形成有逻辑的递进关系，共同服务于最终结局。)
- **第一卷：[卷名] (新手启航)**
  - *简介:* - *主要情节:* - **第二卷：[卷名] (崭露头角)**
  - *简介:* - *主要情节:* - **... (以此类推，直到最后一卷)**
- **第 ${creationState.totalVolumes} 卷：[卷名] (最终决战与结局)**
  - *简介:* - *主要情节:* (必须在此处清晰地导向【${endingToneText}】结局)

## 💎 核心设定与伏笔
(根据【核心灵感】，设计至少5个贯穿全文的关键设定或伏笔，并简述它们将在何时揭示，起何作用)

## ✍️ 正文开篇 · 楔子/第一章引子
(根据【核心灵感】，写一段约300-400字、极具悬念和吸引力的正文开篇，用于奠定故事基调。)
`;

    try {
        const fullBlueprint = await callApi(analysisPrompt, false);
        
        await streamTextToTextarea(blueprintEditor, fullBlueprint, 5, true);
        
        creationState.inspirationConcept = fullBlueprint; 
        const titles = (fullBlueprint.match(/📚 小说标题\s*\n([\s\S]*?)(\n##|$)/) || ["", "1. 未命名作品"])[1];
        creationState.novelTitle = titles.split('\n')[0].replace(/^\d+\.\s*/, '').trim();
        
        showNotification("故事蓝图已生成！您现在可以在右侧编辑框中进行修改。", "success");
        document.getElementById('confirm-inspiration-btn').disabled = false;

    } catch (error) {
        blueprintEditor.value = `灵感解析失败: ${error.message}`;
        showNotification("灵感解析失败，流程中断。", "error");
    } finally {
        isGenerating = false;
        if(startBtnManual) {
            startBtnManual.disabled = false;
            startBtnManual.innerHTML = `<i class="fas fa-play-circle"></i> 生成故事蓝图`;
        }
    }
}

// 【博士重点批注】: 这是点击“确认蓝图，并生成宏观大纲”按钮后执行的函数，功能保持不变。
async function confirmInspiration() {
    creationState.inspirationConcept = document.getElementById('blueprint-editor').value;

    if (isGenerating || !creationState.inspirationConcept) {
        showNotification("当前没有可确认的蓝图或AI正在工作中。", "error");
        return;
    }
    
    if (!saveWritingConfig()) return;
    
    const confirmBtn = document.getElementById('confirm-inspiration-btn');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 已确认蓝图，正在生成宏观大纲...';
    isGenerating = true;

    try {
        showNotification("正在生成全书的宏观大纲（卷章目录）...", "info");
        const prompt = Prompts.generateGeneralOutlinePrompt(
            creationState.inspirationConcept,
            creationState.totalVolumes,
            creationState.totalChapters
        );
        const generalOutline = await callApi(prompt);
        creationState.generalOutline = generalOutline.trim();
        
        creationState.detailedOutlines = new Array(creationState.totalChapters).fill("");
        creationState.storyChapters = new Array(creationState.totalChapters).fill("");

        showNotification("宏观大纲已生成！准备跳转至写作界面...", "success");
        proceedToNextStep('inspiration');

    } catch (error) {
        showNotification(`生成宏观大纲失败: ${error.message}`, "error");
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-check-double"></i> 确认蓝图，并生成宏观大纲！';
    } finally {
        isGenerating = false;
    }
}

// 【博士重点批注】: 此函数用于填充“热门灵感模板”，功能保持不变。
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