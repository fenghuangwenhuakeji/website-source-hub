// 文件路径: js/modules/07_圣典执笔者.js
// 描述: (V40.9.5 终极风格矩阵驱动版) 引擎已接入全新的风格操作手册`prompts.js`。
// 博士二次重构：完全植入35种精细化写作风格矩阵。

let currentChapterIndex = 0;
let totalChapters = 0;
let isGenerating = false;

function renderScribePanel() {
    const panel = document.getElementById('scribe-panel');
    if (!panel) return;
    
    panel.innerHTML = `
        <div class="scribe-section" id="scribe-top-console">
            <h3><i class="fas fa-satellite-dish"></i> 创作控制台</h3>
            <div id="scribe-controls-wrapper">
                <div class="scribe-controls">
                    <div class="form-group">
                        <label for="scribe-persona">AI作者风格</label>
                        <select id="scribe-persona">
                            <optgroup label="核心模式">
                                <option value="style_A12345_P0">通用模式 / 创世模式</option>
                                <option value="tomato">番茄长篇风格</option>
                                <option value="zhihu">知乎热帖风格</option>
                            </optgroup>
                           <optgroup label="——————————————">
                               <option value="custom_style_engine" disabled>自定义风格引擎</option>
                               <option value="custom_style_zhuji">自定义风格 (珠玑)</option>
                               <option value="custom_style_sare">自定义风格 (SARE)</option>
                           </optgroup>
                            <optgroup label="等级 0: 真空模式 (禁5/留0)">
                                <option value="style_A0_P12345">极限模式 / 真空模式</option>
                            </optgroup>
                            <optgroup label="等级 1: 独奏模式 (禁4/留1)">
                                <option value="style_A1_P2345">独白模式 (心理)</option>
                                <option value="style_A2_P1345">点睛模式 (修饰)</option>
                                <option value="style_A3_P1245">咏叹模式 (比喻)</option>
                                <option value="style_A4_P1235">舞台模式 (场景)</option>
                                <option value="style_A5_P1234">旁白模式 (叙事)</option>
                            </optgroup>
                            <optgroup label="等级 2: 二重奏 (禁3/留2)">
                                <option value="style_A12_P345">内心描摹模式</option>
                                <option value="style_A13_P245">意识流模式</option>
                                <option value="style_A14_P235">环境心理模式</option>
                                <option value="style_A15_P234">第一人称叙事模式</option>
                                <option value="style_A23_P145">诗意模式</option>
                                <option value="style_A24_P135">电影镜头模式</option>
                                <option value="style_A25_P134">纪录片模式</option>
                                <option value="style_A34_P125">幻境模式</option>
                                <option value="style_A35_P124">寓言模式</option>
                                <option value="style_A45_P123">导演剪辑模式</option>
                            </optgroup>
                            <optgroup label="等级 3: 三重奏 (禁2/留3)">
                                <option value="style_A123_P45">感性文学模式</option>
                                <option value="style_A124_P35">沉浸模式</option>
                                <option value="style_A125_P34">角色研究模式</option>
                                <option value="style_A134_P25">幻想现实模式</option>
                                <option value="style_A135_P24">回忆录模式</option>
                                <option value="style_A145_P23">全知视角模式</option>
                                <option value="style_A234_P15">华丽描述模式</option>
                                <option value="style_A235_P14">散文诗模式</option>
                                <option value="style_A245_P13">报告文学模式</option>
                                <option value="style_A345_P12">史诗模式</option>
                            </optgroup>
                            <optgroup label="等级 4: 四重奏 (禁1/留4)">
                                <option value="style_A1234_P5">纯文学模式</option>
                                <option value="style_A1235_P4">心理分析模式</option>
                                <option value="style_A1245_P3">纪实小说模式</option>
                                <option value="style_A1345_P2">神话叙事模式</option>
                                <option value="style_A2345_P1">全景描绘模式</option>
                            </optgroup>
                        </select>
                    </div>
                    <div class="form-group"><label for="scribe-perspective">叙事视角</label><select id="scribe-perspective"><option value="第一人称" selected>第一人称</option><option value="第三人称">第三人称</option></select></div>
                    <div class="form-group"><label for="scribe-words">每章字数(约)</label><input type="number" id="scribe-words" value="2000" step="500"></div>
                </div>
            </div>
           <div id="custom-style-engine-section" class="hidden" style="margin-top: 20px; padding: 20px; border: 1px solid var(--border-color); border-radius: 12px; background-color: var(--bg-color);">
               <h4><input type="checkbox" id="toggle-custom-style" checked style="margin-right: 8px;">自定义风格引擎</h4>
               <p class="text-muted" style="margin-bottom: 15px;">粘贴任何您想模仿的文风范例，AI将自动分析其语言特征，并生成一份可执行的“创作核心指南”来驱动后续写作。</p>
               <div class="form-group">
                   <textarea id="style-sample-input" class="editable-ai-content" rows="8" placeholder="在此处粘贴您希望AI模仿的文风范例..."></textarea>
               </div>
               <div class="button-group" style="gap: 15px; margin-bottom: 15px;">
                   <button id="analyze-zhuji-btn" class="settings-btn" style="flex: 1;"><i class="fas fa-edit"></i> 使用【珠玑】引擎分析</button>
                   <button id="analyze-sare-btn" class="settings-btn" style="flex: 1;"><i class="fas fa-cog"></i> 使用【SARE】引擎分析</button>
               </div>
               <div class="form-group">
                   <textarea id="style-guide-output" class="editable-ai-content" rows="8" placeholder="分析生成的风格指南将显示在这里... 您也可以直接粘贴或编辑已有的指南"></textarea>
               </div>
           </div>
        </div>

        <div class="scribe-section scribe-references-accordion">
            <h3><i class="fas fa-book-reader"></i> 创作参考资料 (点击展开)</h3>
            <details>
                <summary><h4>参考：叙事融合策略</h4></summary>
                <div id="scribe-weaving-plan-display" class="document-panel reference-panel"><p>请先在“蓝图骨架”中生成融合策略，或直接在下方导入大纲开始创作。</p></div>
            </details>
            <details open>
                <summary><h4>参考：故事大纲</h4></summary>
                <div id="scribe-full-outline-display" class="document-panel reference-panel" style="margin-bottom: 15px;"><p>请先在“蓝图骨架”中锁定大纲，或在下方文本框中粘贴并导入您的外部大纲。</p></div>
                <div class="form-group">
                    <label for="scribe-external-outline-input"><strong>导入外部大纲:</strong></label>
                    <textarea id="scribe-external-outline-input" class="editable-ai-content" rows="8" placeholder="在此处粘贴您的外部大纲..."></textarea>
                </div>
                <button id="import-external-outline-btn" class="settings-btn" style="width:100%;"><i class="fas fa-file-import"></i> 导入并使用此外部大纲</button>
            </details>
            <details>
                <summary><h4>参考：开篇风格范例</h4></summary>
                 <div id="scribe-style-examples" class="reference-panel"></div>
            </details>
        </div>

        <div class="scribe-section" id="scribe-main-workspace">
            <h3><i class="fas fa-feather-alt"></i> 圣典执笔区</h3>
            <button id="start-scribe-process-btn" class="action-btn" style="width:100%;" disabled><i class="fas fa-play-circle"></i> 开始撰写第一章</button>
            <div id="interactive-scribe-area" class="hidden">
                <h4 id="current-chapter-header"><i class="fas fa-map-signs"></i> 当前章节梗概 (来自大纲)</h4>
                <p id="scribe-chapter-prompt"></p>
                <div class="form-group">
                    <label for="scribe-draft-output">章节正文 (AI生成的内容将显示于此)</label>
                    <textarea id="scribe-draft-output" class="editable-ai-content" rows="20"></textarea>
                </div>
                <div id="scribe-navigation">
                     <button id="regenerate-chapter-btn" class="settings-btn"><i class="fas fa-sync-alt"></i> 重写本章</button>
                    <span id="chapter-indicator">章节: 0 / 0</span>
                     <button id="prev-chapter-btn" class="settings-btn"><i class="fas fa-arrow-left"></i> 上一章</button>
                    <button id="next-chapter-btn" class="action-btn">下一章 <i class="fas fa-arrow-right"></i></button>
                </div>
                <button id="finish-writing-btn" class="action-btn hidden" style="background-color: var(--success-color); width:100%; margin-top: 15px;"><i class="fas fa-flag-checkered"></i> 全部章节已完成，送去润色</button>
            </div>
             <p id="scribe-placeholder" style="text-align:center; color: var(--text-muted); padding: 50px 0;">请先锁定或导入大纲，然后点击上方“开始撰写”按钮。</p>
           <div id="final-export-section" class="final-export-section" style="margin-top: 30px;">
               <h4><i class="fas fa-file-export"></i> 最终整合导出</h4>
               <p>将工作区内的最终稿件，连同本项目的所有创作资料（大纲、设定等）整合并导出。</p>
               <div id="final-export-buttons" class="button-group" style="margin-top: 15px; gap: 10px;">
                   <button class="settings-btn" data-format="txt"><i class="fas fa-file-alt"></i> 导出整合稿.txt</button>
                   <button class="settings-btn" data-format="md"><i class="fab fa-markdown"></i> 导出整合稿.md</button>
                   <button class="settings-btn" data-format="doc"><i class="fas fa-file-word"></i> 导出整合稿.doc</button>
               </div>
           </div>
        </div>
    `;
    
    document.getElementById('start-scribe-process-btn').addEventListener('click', () => handleChapterGenerationCycle(0));
    document.getElementById('prev-chapter-btn').addEventListener('click', handlePrevChapter);
    document.getElementById('next-chapter-btn').addEventListener('click', handleNextChapter);
    document.getElementById('regenerate-chapter-btn').addEventListener('click', () => handleChapterGenerationCycle(currentChapterIndex, true));
    document.getElementById('finish-writing-btn').addEventListener('click', handleProceedToPostProduction);
    document.getElementById('import-external-outline-btn').addEventListener('click', handleImportExternalOutline);
   document.getElementById('scribe-persona').addEventListener('change', handleStyleEngineChange);
   document.getElementById('analyze-zhuji-btn').addEventListener('click', () => handleAnalyzeStyle('zhuji'));
   document.getElementById('analyze-sare-btn').addEventListener('click', () => handleAnalyzeStyle('sare'));

     const guideOutputEl = document.getElementById('style-guide-output');
     if (guideOutputEl) {
         guideOutputEl.addEventListener('input', (e) => {
             creationState.customStyleGuide = e.target.value;
         });
         guideOutputEl.addEventListener('blur', (e) => {
             const guideText = e.target.value;
             if (guideText.trim()) {
                 showNotification(`已接收自定义风格指南 (${guideText.length} 字)，将在创作时以“绝对核心”优先级生效。`, "info");
             }
         });
     }
 
     const exportButtons = document.querySelectorAll('#final-export-buttons .settings-btn');
    exportButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const format = e.currentTarget.dataset.format;
            handleFinalExport(format);
        });
    });
}

function handleImportExternalOutline() {
    const externalOutlineText = document.getElementById('scribe-external-outline-input').value;
    if (!externalOutlineText || externalOutlineText.trim() === '') {
        showNotification("请先在文本框中粘贴您的外部大纲。", "warning");
        return;
    }
    creationState.finalOutline = externalOutlineText;
    showNotification("外部大纲导入成功！", "success");
    updateScribeReferences();
}


function updateScribeReferences() {
    const weavingDisplay = document.getElementById('scribe-weaving-plan-display');
    const outlineDisplay = document.getElementById('scribe-full-outline-display');
    const styleDisplay = document.getElementById('scribe-style-examples');
    const startBtn = document.getElementById('start-scribe-process-btn');

    if (!weavingDisplay || !outlineDisplay || !styleDisplay || !startBtn) return;
    
    const hasOutline = creationState.finalOutline && creationState.finalOutline.trim() !== '';

    if (creationState.weavingPlan) {
        weavingDisplay.innerHTML = creationState.weavingPlan;
    }

    if (hasOutline) {
        outlineDisplay.innerHTML = `<pre>${creationState.finalOutline}</pre>`;
        startBtn.disabled = false;
        totalChapters = getChaptersFromOutline().length;
        if (totalChapters === 0) {
             showNotification("大纲格式无法识别出章节，请确保每章以“第X章”开头。", "warning");
             startBtn.disabled = true;
        } else {
             showNotification(`大纲已就绪，共识别出 ${totalChapters} 个章节。`, "info");
        }
    } else {
        const placeholderText = `<p>请先在“蓝图骨架”中生成并【锁定大纲】，或在上方导入外部大纲。</p>`;
        outlineDisplay.innerHTML = placeholderText;
        startBtn.disabled = true;
    }

    styleDisplay.innerHTML = '';
    if (OPENING_BLUEPRINTS) {
        for (const category in OPENING_BLUEPRINTS) {
            OPENING_BLUEPRINTS[category].forEach(bp => {
                const card = document.createElement('div');
                card.className = 'style-example-card';
                card.innerHTML = `<h4>${bp.title}</h4><p>${bp.summary.substring(0, 5000)}</p>`;
                styleDisplay.appendChild(card);
            });
        }
    }
    
    if (creationState.storyChapters && creationState.storyChapters.length > 0 && creationState.storyChapters.some(c => c && c.trim() !== '')) {
         loadChapter(currentChapterIndex);
    }
}

async function handleChapterGenerationCycle(chapterIndex, isRegen = false) {
    if (isGenerating) {
        showNotification("AI正在写作中，请稍候...", "info");
        return;
    }
    const chapters = getChaptersFromOutline();
    if (chapters.length === 0) {
        showNotification("无法开始写作，请先锁定或导入有效的大纲。", "error");
        return;
    }
    isGenerating = true;

    document.getElementById('start-scribe-process-btn').classList.add('hidden');
    document.getElementById('scribe-placeholder').classList.add('hidden');
    document.getElementById('interactive-scribe-area').classList.remove('hidden');
    
    const draftTextarea = document.getElementById('scribe-draft-output');
    const header = document.getElementById('current-chapter-header');
    const promptDisplay = document.getElementById('scribe-chapter-prompt');

    if (isRegen) {
        creationState.storyChapters[chapterIndex] = "";
    }
    currentChapterIndex = chapterIndex;
    updateChapterUI();

    try {
        promptDisplay.textContent = chapters[chapterIndex];
        header.innerHTML = `<i class="fas fa-spinner fa-spin"></i> AI作者正在构思并撰写第 ${chapterIndex + 1} 章...`;
        showNotification(`开始生成第 ${chapterIndex + 1} 章...`, "info");
        
        // ✨ 博士，现在我们调用全新的函数来生成指令！
        const chapterText = await generateChapterTextV2(chapterIndex);
        
        header.textContent = `第 ${chapterIndex + 1} 章 正文`;
        await streamTextToTextarea(draftTextarea, chapterText, 5, true);
        creationState.storyChapters[chapterIndex] = chapterText;
        saveCurrentChapterContent(); 
        showNotification(`第 ${chapterIndex + 1} 章已完成！`, "success");

        if ((automationMode === 'full-auto' || creationState.autoFlowState.isRunning) && currentChapterIndex < totalChapters - 1) {
            showNotification(`2秒后将自动开始撰写下一章...`, "info");
            setTimeout(() => {
                if (!isGenerating) {
                    handleChapterGenerationCycle(currentChapterIndex + 1);
                }
            }, 2000);
        } else if ((automationMode === 'full-auto' || creationState.autoFlowState.isRunning) && currentChapterIndex >= totalChapters - 1) {
            handleProceedToPostProduction();
        }

    } catch (error) {
        header.textContent = `第 ${chapterIndex + 1} 章生成失败`;
        draftTextarea.value = `错误: ${error.message}`;
        showNotification(`生成失败: ${error.message}`, "error");
    } finally {
        isGenerating = false;
        updateChapterUI();
    }
}

// 【!!! 核心升级点 !!!】
// generateChapterTextV2现在将调用 prompts.js 中的 Prompts.generateChapter 函数来构建具有精确风格控制的指令。
async function generateChapterTextV2(chapterIndex) {
    const chapters = getChaptersFromOutline();
    if (chapterIndex >= chapters.length) return "错误：章节索引超出范围。";

    // 收集所有需要的参数
    const chapterOutline = chapters[chapterIndex];
    const chapterTitle = `第 ${chapterIndex + 1} 章`; // 构造章节标题
    const writingStyleKey = document.getElementById('scribe-persona').value;
    const novelTitle = creationState.inspirationConcept?.title || "未命名小说";
    const wordsPerChapter = document.getElementById('scribe-words').value;
    const narrativePerspective = document.getElementById('scribe-perspective').value;
    const prevChapterContent = chapterIndex > 0 ? (creationState.storyChapters[chapterIndex - 1] || "").slice(-500) : null;

    // ✨ 使用 prompts.js 中的“操作手册”来生成最终的指令！
   let customStyleGuide = '';
   let customStyleEngine = '';
   const customStyleToggle = document.getElementById('toggle-custom-style');

   if ((writingStyleKey === 'custom_style_zhuji' || writingStyleKey === 'custom_style_sare') && customStyleToggle && customStyleToggle.checked) {
       const guideOutput = document.getElementById('style-guide-output');
       if (guideOutput && guideOutput.value.trim()) {
           customStyleGuide = guideOutput.value;
           customStyleEngine = writingStyleKey === 'custom_style_zhuji' ? '珠玑' : 'SARE';
       }
   }

    const prompt = Prompts.generateChapter(
        chapterTitle,
        writingStyleKey,
        novelTitle,
        chapterOutline,
        wordsPerChapter,
        narrativePerspective,
        prevChapterContent,
        customStyleGuide,
        customStyleEngine
    );

    // 将生成的指令发送给API
    return await callApi(prompt, false);
}


function loadChapter(index) {
    if (index < 0 || index >= totalChapters) return;
    currentChapterIndex = index;
    
    document.getElementById('start-scribe-process-btn').classList.add('hidden');
    document.getElementById('scribe-placeholder').classList.add('hidden');
    document.getElementById('interactive-scribe-area').classList.remove('hidden');
    
    const draftTextarea = document.getElementById('scribe-draft-output');
    draftTextarea.value = creationState.storyChapters[index] || `(本章尚未生成，点击“下一章”或“重写本章”开始创作)`;
    
    const chapters = getChaptersFromOutline();
    document.getElementById('scribe-chapter-prompt').textContent = chapters[index] || `(已加载第 ${index + 1} 章历史内容)`;
    updateChapterUI();
}

function handlePrevChapter() {
    if(currentChapterIndex > 0) {
        saveCurrentChapterContent();
        loadChapter(currentChapterIndex - 1);
    }
}

function handleNextChapter() {
    if (isGenerating) return;
    if(currentChapterIndex < totalChapters - 1) {
        saveCurrentChapterContent();
        const nextChapterIndex = currentChapterIndex + 1;
        if (!creationState.storyChapters[nextChapterIndex] || creationState.storyChapters[nextChapterIndex].trim() === '') {
            handleChapterGenerationCycle(nextChapterIndex);
        } else {
            loadChapter(nextChapterIndex);
        }
    }
}

function saveCurrentChapterContent() {
    const draftTextarea = document.getElementById('scribe-draft-output');
    if (draftTextarea && creationState.storyChapters && currentChapterIndex >= 0) {
        creationState.storyChapters[currentChapterIndex] = draftTextarea.value;
    }
}

function updateChapterUI() {
    totalChapters = getChaptersFromOutline().length;
    document.getElementById('chapter-indicator').textContent = `章节: ${currentChapterIndex + 1} / ${totalChapters}`;
    
    document.getElementById('prev-chapter-btn').disabled = isGenerating || currentChapterIndex === 0;
    document.getElementById('next-chapter-btn').disabled = isGenerating;
    document.getElementById('regenerate-chapter-btn').disabled = isGenerating;

    const nextBtn = document.getElementById('next-chapter-btn');
    const finishBtn = document.getElementById('finish-writing-btn');
    
    if (currentChapterIndex >= totalChapters - 1) {
        nextBtn.classList.add('hidden');
        finishBtn.classList.remove('hidden');
    } else {
        nextBtn.classList.remove('hidden');
        finishBtn.classList.add('hidden');
    }
}

function getChaptersFromOutline() {
    if (!creationState.finalOutline) return [];
    let text = creationState.finalOutline;
    const chapterRegex = /(?=^\s*\*?第\s*[一二三四五六七八九十百千万\d]+\s*章)/im;
    const parts = text.split(chapterRegex);
    return parts.filter(part => part && part.trim() !== '' && /^\s*\*?第/.test(part.trim()));
}

function handleStyleEngineChange() {
    const selectedStyle = document.getElementById('scribe-persona').value;
    const customControls = document.getElementById('custom-style-engine-section');
    if (selectedStyle === 'custom_style_zhuji' || selectedStyle === 'custom_style_sare') {
        customControls.classList.remove('hidden');
    } else {
        customControls.classList.add('hidden');
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('style-sample-input').value = e.target.result;
        };
        reader.readAsText(file);
    }
}

async function handleAnalyzeStyle(engine) {
    const sampleText = document.getElementById('style-sample-input').value;
    const guideOutput = document.getElementById('style-guide-output');

    if (!sampleText.trim()) {
        showNotification("请输入或上传风格范例文本。", "warning");
        return;
    }

    let prompt = '';
    let engineName = '';
    let buttonId = '';

    if (engine === 'zhuji') {
        prompt = Prompts.getZhujiAnalysisPrompt(sampleText);
        engineName = '珠玑';
        buttonId = 'analyze-zhuji-btn';
    } else if (engine === 'sare') {
        prompt = Prompts.getSAREAnalysisPrompt(sampleText);
        engineName = 'SARE';
        buttonId = 'analyze-sare-btn';
    } else {
        return;
    }

    const analyzeBtn = document.getElementById(buttonId);
    const otherBtnId = engine === 'zhuji' ? 'analyze-sare-btn' : 'analyze-zhuji-btn';
    const otherBtn = document.getElementById(otherBtnId);

    analyzeBtn.disabled = true;
    otherBtn.disabled = true;
    analyzeBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 正在分析...`;

    try {
        const styleGuide = await callApi(prompt, false);
        creationState.customStyleGuide = styleGuide;
        creationState.customStyleEngine = engineName;
        guideOutput.value = styleGuide;
        showNotification(`已接收自定义风格指南 (${styleGuide.length} 字)，将在创作时以“绝对核心”优先级生效。`, "success");
    } catch (error) {
        showNotification(`风格分析失败: ${error.message}`, "error");
        guideOutput.value = `分析失败: ${error.message}`;
    } finally {
        analyzeBtn.disabled = false;
        otherBtn.disabled = false;
        analyzeBtn.innerHTML = engine === 'zhuji' ? `<i class="fas fa-edit"></i> 使用【珠玑】引擎分析` : `<i class="fas fa-cog"></i> 使用【SARE】引擎分析`;
    }
}


function handleFinalExport(format) {
   saveCurrentChapterContent(); // Save current chapter before exporting
   const prose = (creationState.storyChapters || []).join("\n\n\n");

   if (!prose.trim()) {
       showNotification("没有内容可以导出。", "warning");
       return;
   }

   const title = creationState.inspirationConcept?.title || "未命名小说";
   
   // 汇总所有创作资料
   let fullContent = `# 小说《${title}》完整创作资料\n\n`;
   fullContent += `## 一、故事灵感\n\n${creationState.inspirationConcept?.concept || '未提供'}\n\n`;
   fullContent += `## 二、世界观设定\n\n${creationState.worldview || '未提供'}\n\n`;
   fullContent += `## 三、人物设定\n\n`;
   (creationState.blueprintCharacters || []).forEach(char => {
       fullContent += `### ${char.name}\n- **身份:** ${char.identity}\n- **性格:** ${char.personality}\n- **目标:** ${char.goal}\n\n`;
   });
   fullContent += `## 四、故事大纲\n\n${creationState.finalOutline || '未提供'}\n\n`;
   fullContent += `## 五、小说正文\n\n${prose}`;

   let blob;
   let filename = `${title}_整合稿`;

   switch (format) {
       case 'txt':
           blob = new Blob([fullContent.replace(/<\/?[^>]+(>|$)/g, "")], { type: 'text/plain;charset=utf-8' });
           filename += '.txt';
           break;
       case 'md':
           // 简单处理，将HTML标签转为Markdown
           let markdownContent = fullContent.replace(/<h3>/g, '### ').replace(/<\/h3>/g, '\n');
           markdownContent = markdownContent.replace(/<h4>/g, '#### ').replace(/<\/h4>/g, '\n');
           markdownContent = markdownContent.replace(/<p>/g, '').replace(/<\/p>/g, '\n');
           markdownContent = markdownContent.replace(/<strong>/g, '**').replace(/<\/strong>/g, '**');
           blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
           filename += '.md';
           break;
       case 'doc':
            const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
               "xmlns:w='urn:schemas-microsoft-com:office:word' "+
               "xmlns='http://www.w3.org/TR/REC-html40'>"+
               "<head><meta charset='utf-8'><title>Export HTML to Word Document</title></head><body>";
           const footer = "</body></html>";
           const sourceHTML = header + fullContent + footer;
           blob = new Blob([sourceHTML], { type: 'application/msword' });
           filename += '.doc';
           break;
   }

   const link = document.createElement("a");
   link.href = URL.createObjectURL(blob);
   link.download = filename;
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);

   showNotification(`已成功导出 ${filename}`, "success");
}

function handleProceedToPostProduction() {
    saveCurrentChapterContent();
    creationState.finalProse = creationState.storyChapters.join("\n\n\n");
    if (!creationState.finalProse || !creationState.finalProse.trim()) {
        showNotification("没有有效的正文内容可以进入下一步。", "error");
        return;
    }
    updateDictionaryPanelState();
    if (automationMode === 'full-auto' || creationState.autoFlowState.isRunning) {
        proceedToNextStep('scribe');
    } else {
        switchTab('dictionary-panel');
        showNotification("所有章节已汇总，送至“后期与导出”模块！", "success");
    }
}