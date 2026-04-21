// 文件路径: js/modules/03_正文写作与后期.js
// 描述: (V47.1 博士梦想实现版 - 导出功能升级)
// 1. 【博士梦想实现版】重大升级！formatTextForExportSimple 函数现在会自动在导出的文本最前方加入完整的故事蓝图。
// 2. 保持了批量生成的核心逻辑不变。
// 3. 所有相关函数均已适配，确保流程顺畅。

function renderWritingPanel() {
    const panel = document.getElementById('writing-panel');
    if (!panel) return;

    if (!creationState.inspirationConcept) {
        panel.innerHTML = `<div class="construction-preloader"><h3><i class="fas fa-exclamation-triangle"></i> 请先生成故事蓝图</h3><p>“故事蓝图”是写作的唯一前提，请先在第一步完成生成。</p></div>`;
        return;
    }

    panel.innerHTML = `
        <div class="writing-cockpit-container">
            <div id="cockpit-chapter-list" class="cockpit-panel card">
                <div class="card-header"><h3><i class="fas fa-stream"></i> 章节列表</h3><span class="text-muted">${creationState.totalChapters} 章</span></div>
                <div id="chapter-list-body" class="cockpit-scroll-area"></div>
            </div>

            <div id="cockpit-main-editor" class="cockpit-panel card">
                <div class="card-header" style="padding: 0; flex-direction: column; align-items: stretch;">
                    <div class="writing-mode-selector cockpit-mode-selector">
                        <button class="workspace-tab active" data-mode="single"><i class="fas fa-pen-ruler"></i> 逐章精修</button>
                        <button class="workspace-tab" data-mode="batch"><i class="fas fa-rocket"></i> 分批冲刺</button>
                    </div>
                </div>
                <textarea id="writing-output" placeholder="AI生成的正文将在这里展示..."></textarea>
                <div class="card-footer" id="editor-controls">
                </div>
                <div class="card-footer" id="export-controls" style="border-top: 1px solid var(--border-color); justify-content: flex-end;">
                    <button id="export-txt-btn" class="action-btn" style="background-color: var(--success-color);"><i class="fas fa-file-export"></i> 一键导出 TXT</button>
                </div>
                <div id="generation-progress" class="hidden" style="text-align:center; padding: 10px; border-top: 1px solid var(--border-color); background-color: var(--bg-color);">
                    <i class="fas fa-spinner fa-spin"></i> <span id="progress-text">处理中...</span>
                </div>
            </div>

            <div id="cockpit-auxiliary" class="cockpit-panel card">
                <div class="card-header"><h3><i class="fas fa-book-open"></i> 故事蓝图 (核心参考)</h3></div>
                <textarea id="full-blueprint-display" class="cockpit-scroll-area" readonly>${creationState.inspirationConcept}</textarea>
            </div>
        </div>
    `;

    if (!creationState.storyChapters || creationState.storyChapters.length !== creationState.totalChapters) {
        creationState.storyChapters = new Array(creationState.totalChapters).fill("");
    }
    
    renderChapterList();
    setupCockpitEventListeners();
    switchWritingMode('single'); 
}

function switchWritingMode(mode) {
    saveCurrentChanges();
    document.querySelectorAll('.workspace-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.mode === mode);
    });
    renderEditorControls(mode);
    updateEditorContent(mode);
}

function renderEditorControls(mode) {
    const controlsContainer = document.getElementById('editor-controls');
    if (!controlsContainer) return;

    if (mode === 'single') {
        controlsContainer.innerHTML = `<button id="generate-single-btn" class="action-btn"><i class="fas fa-magic"></i> 生成/重写本章</button><p class="text-muted" style="margin-left: auto; font-size: 0.9em;">修改后自动保存</p>`;
        document.getElementById('generate-single-btn').addEventListener('click', () => {
            const index = creationState.currentChapterIndex;
            generateChapterBatch(index, index); // 单章生成现在也调用批量接口，范围为1
        });
    } else if (mode === 'batch') {
        const totalChapters = creationState.totalChapters;
        controlsContainer.innerHTML = `
            <div class="batch-controls-v2">
                <div class="form-group"><label>从</label><input type="number" id="batch-start-chapter" value="1" min="1" max="${totalChapters}"></div>
                <div class="form-group"><label>到</label><input type="number" id="batch-end-chapter" value="${totalChapters}" min="1" max="${totalChapters}"></div>
                <button class="action-btn" id="generate-batch-btn"><i class="fas fa-play"></i> 一次性生成指定章节</button>
            </div>
        `;
        document.getElementById('generate-batch-btn').addEventListener('click', () => {
            const start = parseInt(document.getElementById('batch-start-chapter').value, 10) - 1;
            const end = parseInt(document.getElementById('batch-end-chapter').value, 10) - 1;
            if (isNaN(start) || isNaN(end) || start < 0 || end >= totalChapters || start > end) {
                showNotification("请输入有效的章节范围！", "error");
                return;
            }
            generateChapterBatch(start, end);
        });
    }
}

function updateEditorContent(mode) {
    const outputArea = document.getElementById('writing-output');
    if (!outputArea) return;

    if (mode === 'single') {
        outputArea.value = creationState.storyChapters[creationState.currentChapterIndex || 0] || "";
        outputArea.readOnly = false;
    } else if (mode === 'batch') {
        outputArea.value = creationState.storyChapters.join('\n\n\n').trim();
        outputArea.readOnly = true; 
    }
}

function renderChapterList() {
    const container = document.getElementById('chapter-list-body');
    if (!container) return;
    let listHtml = '';
    for (let i = 0; i < creationState.totalChapters; i++) {
        const hasContent = creationState.storyChapters[i] && creationState.storyChapters[i].length > 5;
        const statusClass = hasContent ? 'completed' : 'pending';
        listHtml += `
            <div class="chapter-item" data-index="${i}">
                <span class="chapter-title">第 ${i + 1} 章</span>
                <span class="chapter-status ${statusClass}"></span>
            </div>
        `;
    }
    container.innerHTML = listHtml;
    document.querySelectorAll('.chapter-item').forEach(item => {
        item.addEventListener('click', () => updateCurrentChapter(parseInt(item.dataset.index, 10)));
    });
    if (creationState.totalChapters > 0) {
        updateCurrentChapter(0);
    }
}

function setupCockpitEventListeners() {
    document.querySelectorAll('.workspace-tab').forEach(tab => {
        tab.addEventListener('click', (e) => switchWritingMode(e.currentTarget.dataset.mode));
    });
    document.getElementById('writing-output').addEventListener('blur', saveCurrentChanges);
    document.getElementById('export-txt-btn').addEventListener('click', handleExportTxt);
}

function handleExportTxt() {
    if (isGenerating) {
        showNotification("AI正在工作中，请稍后再导出。", "warning");
        return;
    }
    
    saveCurrentChanges();

    const hasContent = creationState.storyChapters.some(ch => ch && ch.trim().length > 0);
    if (!hasContent) {
        showNotification("没有可导出的内容。", "error");
        return;
    }

    const exportBtn = document.getElementById('export-txt-btn');
    exportBtn.disabled = true;
    exportBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 正在导出...`;

    try {
        const formattedContent = formatTextForExportSimple(creationState.storyChapters, creationState.inspirationConcept);
        downloadFile(formattedContent, creationState.novelTitle || '未命名作品', 'txt');
        showNotification("TXT文件已成功导出！", "success");
    } catch (error) {
        showNotification(`导出失败: ${error.message}`, "error");
    } finally {
        exportBtn.disabled = false;
        exportBtn.innerHTML = `<i class="fas fa-file-export"></i> 一键导出 TXT`;
    }
}

function updateCurrentChapter(index, forceUpdate = false) {
    const currentMode = document.querySelector('.workspace-tab.active')?.dataset.mode || 'single';
    if (currentMode === 'batch' && !forceUpdate) return;
    
    saveCurrentChanges();
    creationState.currentChapterIndex = index;

    document.querySelectorAll('.chapter-item').forEach(item => {
        item.classList.toggle('active', parseInt(item.dataset.index, 10) === index);
    });
    
    const goalDisplay = document.getElementById('cockpit-auxiliary');
    if(goalDisplay) {
         goalDisplay.querySelector('textarea').scrollTop = 0;
    }
    
    updateEditorContent(currentMode);
}

function saveCurrentChanges() {
    const outputArea = document.getElementById('writing-output');
    const currentMode = document.querySelector('.workspace-tab.active')?.dataset.mode || 'single';
    if (!outputArea || currentMode !== 'single') return;

    const currentIndex = creationState.currentChapterIndex || 0;
    if (creationState.storyChapters[currentIndex] !== outputArea.value) {
        creationState.storyChapters[currentIndex] = outputArea.value;
        const chapterItem = document.querySelector(`.chapter-item[data-index="${currentIndex}"] .chapter-status`);
        if(chapterItem) {
            chapterItem.className = 'chapter-status ' + (outputArea.value.length > 5 ? 'completed' : 'pending');
        }
    }
}

/**
 * 博士梦想实现函数：一次性生成指定范围的所有章节。
 * @param {number} start - 起始章节索引 (从 0 开始)
 * @param {number} end - 结束章节索引
 */
async function generateChapterBatch(start, end) {
    if (isGenerating) return;

    isGenerating = true;
    const progressDiv = document.getElementById('generation-progress');
    const progressText = document.getElementById('progress-text');
    const outputArea = document.getElementById('writing-output');
    document.querySelectorAll('#editor-controls button, .cockpit-mode-selector button, #export-txt-btn').forEach(btn => btn.disabled = true);
    progressDiv.classList.remove('hidden');

    try {
        const chapterCount = end - start + 1;
        const chapterRangeText = chapterCount === 1 ? `第 ${start + 1} 章` : `第 ${start + 1} 至 ${end + 1} 章`;
        progressText.textContent = `AI 正在全力一次性生成 ${chapterRangeText}，请耐心等待...`;
        outputArea.value = `请稍候，AI正在为您批量创作 ${chapterRangeText} 的内容...`;

        // 更新列表中所有待生成章节的状态
        for (let i = start; i <= end; i++) {
            const chapterItemStatus = document.querySelector(`.chapter-item[data-index="${i}"] .chapter-status`);
            if (chapterItemStatus) chapterItemStatus.className = 'chapter-status generating';
        }

        const prevChapterContent = start > 0 ? (creationState.storyChapters[start - 1] || "这是故事的开篇。") : "这是故事的开篇。";
        
        // 【博士核心修改】调用新的、为批量生成设计的Prompt模板
        const prompt = Prompts.generateChapterBatch(
            start, // 实际起始章节索引
            end,   // 实际结束章节索引
            creationState.totalChapters,
            creationState.writingStyle,
            creationState.novelTitle,
            creationState.wordsPerChapter,
            creationState.narrativePerspective,
            prevChapterContent,
            creationState.inspirationConcept,
            creationState.customStyleGuide,
            creationState.customStyleEngine,
            creationState.endingType
        );

        // 一次性调用API获取所有章节的连续文本
        const combinedContent = await callApi(prompt, false);

        // 【博士核心修改】智能解析返回的文本并填充到状态数组中
        // 我们使用正则表达式来分割由 "### 第 X 章" 标记的章节
        const chapterRegex = /###\s*第\s*(\d+)\s*章\s*\n/g;
        const splitContents = combinedContent.split(chapterRegex);

        let parsedChapters = {};
        for (let i = 1; i < splitContents.length; i += 2) {
            const chapterNum = parseInt(splitContents[i], 10);
            const chapterContent = splitContents[i + 1].trim();
            parsedChapters[chapterNum] = chapterContent;
        }
        
        // 博士新增：处理可能存在的导语 (在第一章之前且没有章节标记的部分)
        if (start === 0 && splitContents.length > 1 && splitContents[0].trim().length > 10) {
            // 如果第一章有内容，且在它之前还有一段不属于任何章节的文本，我们视其为导语
            if(parsedChapters[1]){
                parsedChapters[1] = splitContents[0].trim() + '\n\n' + parsedChapters[1];
            }
        }


        // 将解析出的章节内容填充到对应的位置
        let contentGenerated = false;
        for (let i = start; i <= end; i++) {
            const chapterNum = i + 1;
            if (parsedChapters[chapterNum]) {
                creationState.storyChapters[i] = parsedChapters[chapterNum];
                const chapterItemStatus = document.querySelector(`.chapter-item[data-index="${i}"] .chapter-status`);
                if (chapterItemStatus) chapterItemStatus.className = 'chapter-status completed';
                contentGenerated = true;
            } else {
                 creationState.storyChapters[i] = `// AI未能生成第 ${chapterNum} 章的内容，请尝试重新生成。`;
                 const chapterItemStatus = document.querySelector(`.chapter-item[data-index="${i}"] .chapter-status`);
                 if (chapterItemStatus) chapterItemStatus.className = 'chapter-status failed';
            }
        }
        
        if (!contentGenerated && chapterCount === 1) {
             // 如果是单章生成且没有匹配到格式，则将全部返回内容视为单章内容
             creationState.storyChapters[start] = combinedContent.trim();
        }


        showNotification(`${chapterRangeText} 已生成完毕！`, "success");
        updateEditorContent(document.querySelector('.workspace-tab.active').dataset.mode);
        updateCurrentChapter(end, true); // 跳转到最后一章方便审阅

    } catch (error) {
        showNotification(`生成 ${chapterRangeText} 失败: ${error.message}`, "error");
        for (let i = start; i <= end; i++) {
            const chapterItemStatus = document.querySelector(`.chapter-item[data-index="${i}"] .chapter-status`);
            if (chapterItemStatus) chapterItemStatus.className = 'chapter-status failed';
        }
    } finally {
        isGenerating = false;
        document.querySelectorAll('#editor-controls button, .cockpit-mode-selector button, #export-txt-btn').forEach(btn => btn.disabled = false);
        progressDiv.classList.add('hidden');
        
        // 自动模式下的流程控制
        if (automationMode === 'full-auto' && start === 0 && end === creationState.totalChapters - 1) {
            creationState.finalProse = creationState.storyChapters.join('\n\n\n');
            proceedToNextStep('writing');
        }
    }
}

// 博士修改核心：导出函数现在会接收并添加故事蓝图
function formatTextForExportSimple(chapters, blueprint = '') {
    if (!chapters || chapters.length === 0) {
        return "";
    }
    
    // 添加故事蓝图
    let blueprintSection = '';
    if (blueprint && blueprint.trim().length > 0) {
        blueprintSection = `【故事蓝图】\n========================================\n${blueprint.trim()}\n========================================\n\n`;
    }

    let rawText = '';
    for (let i = 0; i < chapters.length; i++) {
        const title = `第 ${i + 1} 章\n\n`;
        const content = chapters[i] || "(本章内容为空)";
        rawText += title + content + '\n\n\n';
    }
    
    showNotification("正在准备导出文件...", "info");
    return (blueprintSection + rawText).trim();
}