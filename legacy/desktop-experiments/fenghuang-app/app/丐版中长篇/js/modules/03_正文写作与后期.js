// 文件路径: js/modules/03_正文写作与后期.js
// 描述: (V72.0 博士·所见即所得·最终版)
// 【博士终极修复】: 针对“已生成但正文不显示”的问题，进行了决定性的流程重构。
// 1. 【核心修复 - 实时显示】: 在 `batchGenerateChapterContents` 函数的循环内部，加入了关键的UI更新逻辑。现在，每当一章正文生成后，会立刻调用`updateCurrentChapter`并将内容填充到编辑器中，实现“所见即所得”。
// 2. 【核心修复 - 强制同步】: 在实时显示的基础上，增加了`saveCurrentChanges()`调用，确保数据状态和UI显示在每一步都强制同步，彻底杜绝了之前版本中可能存在的状态与视图不一致的问题。
// 3. 【体验优化】: 用户现在可以在批量生成过程中，实时看到当前正在生成的章节内容，提供了更佳的过程反馈。
// 4. 保留了V71版的“修改章节名”功能和所有视觉优化。

function renderWritingPanel() {
    const panel = document.getElementById('writing-panel');
    if (!panel) return;

    if (!creationState.inspirationConcept || !creationState.generalOutline) {
        panel.innerHTML = `<div class="construction-preloader"><h3><i class="fas fa-exclamation-triangle"></i> 请先在“灵感蓝图”面板生成故事蓝图与宏观大纲</h3><p>这是进入写作环节的前提。</p></div>`;
        return;
    }

    renderWritingCockpitUI(panel);
}

function renderWritingCockpitUI(panel) {
    panel.innerHTML = `
        <div class="writing-cockpit-container three-column-creator">
            <div id="cockpit-chapter-list" class="cockpit-panel card">
                <div class="card-header"><h3><i class="fas fa-stream"></i> 章节列表</h3></div>
                <div id="chapter-list-body" class="cockpit-scroll-area"></div>
                 <div class="card-footer" style="border-top: 1px solid var(--border-color); justify-content: flex-end;">
                     <button id="export-txt-btn" class="action-btn" style="background-color: var(--success-color);"><i class="fas fa-file-export"></i> 一键导出 TXT</button>
                </div>
            </div>

            <div id="cockpit-batch-outline-buffer" class="cockpit-panel card">
                <div class="card-header">
                    <h3><i class="fas fa-inbox"></i> 细纲缓冲区</h3>
                    <button id="generate-outline-chunk-btn" class="settings-btn" style="padding: 5px 10px;"><i class="fas fa-magic"></i> 生成本批细纲</button>
                </div>
                <div class="cockpit-scroll-area" style="padding: 15px; display: flex; flex-direction: column;">
                    <textarea id="batch-outline-buffer-editor" style="flex-grow: 1;" placeholder="点击“生成本批细纲”，AI生成的10章原始细纲将显示在此处。请在此手动整理后，复制到右侧对应的章节细纲框中。">${creationState.batchOutlineBuffer || ''}</textarea>
                    <button id="apply-buffer-btn" class="action-btn" style="margin-top: 10px;"><i class="fas fa-check-double"></i> 应用到章节 (手动分割)</button>
                </div>
            </div>

            <div id="cockpit-main-editor" class="cockpit-panel card">
                <div class="card-header" style="padding: 15px 20px; display:flex; justify-content: space-between; align-items: center;">
                    <h3 id="current-chapter-header">请从左侧选择章节</h3>
                    <button id="generate-content-chunk-btn" class="action-btn" style="padding: 5px 10px;"><i class="fas fa-layer-group"></i> 生成本批正文</button>
                </div>
                <div class="cockpit-scroll-area" style="padding: 20px; gap: 20px;">
                    <div id="detailed-outline-section">
                        <h4 style="margin:0 0 10px 0; color: var(--accent-color);"><i class="fas fa-map-signs"></i> 本章细纲 (可编辑)</h4>
                        <textarea id="detailed-outline-editor" placeholder="从左侧缓冲区复制单章细纲到此处..."></textarea>
                    </div>
                    <div id="chapter-content-section">
                         <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h4 style="margin:0; color: var(--primary-color);"><i class="fas fa-pen-nib"></i> 章节正文</h4>
                             <button id="generate-content-btn" class="settings-btn" style="padding: 5px 10px;"><i class="fas fa-feather-alt"></i> 重写本章</button>
                        </div>
                        <textarea id="writing-output" placeholder="根据上方细纲生成正文..."></textarea>
                    </div>
                </div>
                <div id="generation-progress" class="hidden">
                    <i class="fas fa-spinner fa-spin"></i> <span id="progress-text">处理中...</span>
                </div>
            </div>
        </div>
    `;

    if (!creationState.storyChapters || creationState.storyChapters.length !== creationState.totalChapters) {
        creationState.storyChapters = new Array(creationState.totalChapters).fill("");
    }
    
    renderChapterList();
    setupCockpitEventListeners();
    updateCurrentChapter(creationState.currentChapterIndex === undefined ? 0 : creationState.currentChapterIndex);
}


function setupCockpitEventListeners() {
    document.getElementById('generate-content-btn').addEventListener('click', generateSingleChapterContent);
    document.getElementById('generate-outline-chunk-btn').addEventListener('click', handleGenerateDetailedOutlineChunk);
    document.getElementById('apply-buffer-btn').addEventListener('click', handleApplyBufferToChapters);
    document.getElementById('generate-content-chunk-btn').addEventListener('click', handleGenerateContentChunk);
    
    document.getElementById('detailed-outline-editor').addEventListener('blur', saveCurrentChanges);
    document.getElementById('writing-output').addEventListener('blur', saveCurrentChanges);
    document.getElementById('batch-outline-buffer-editor').addEventListener('blur', (e) => {
        creationState.batchOutlineBuffer = e.target.value;
    });
    
    document.getElementById('export-txt-btn').addEventListener('click', handleExportTxt);
}

function renderChapterList() {
    const container = document.getElementById('chapter-list-body');
    if (!container) return;
    let listHtml = '';
    const chaptersPerVolume = Math.ceil(creationState.totalChapters / creationState.totalVolumes);
    for (let i = 0; i < creationState.totalVolumes; i++) {
        const volumeStart = i * chaptersPerVolume;
        const volumeEnd = Math.min((i + 1) * chaptersPerVolume, creationState.totalChapters);
        const volumeRegex = new RegExp(`第\\s*([一二三四五六七八九十百]+|[0-9]+)\\s*卷[：:\\s]*(.*)`);
        const allVolumeMatches = Array.from(creationState.generalOutline.matchAll(new RegExp(volumeRegex.source, 'g')));
        const currentVolumeMatch = allVolumeMatches[i];
        const volumeTitle = currentVolumeMatch ? currentVolumeMatch[2].trim() : `第 ${i + 1} 卷`;
        listHtml += `<details class="volume-group" open><summary>${volumeTitle}</summary>`;
        for (let j = volumeStart; j < volumeEnd; j++) {
            const hasContent = creationState.storyChapters[j] && creationState.storyChapters[j].length > 5;
            const hasOutline = creationState.detailedOutlines[j] && creationState.detailedOutlines[j].length > 5;
            let statusClass = 'pending';
            if (hasContent) statusClass = 'completed';
            else if (hasOutline) statusClass = 'outline-done';
            const chapterRegex = new RegExp(`第\\s*${j + 1}\\s*章[：:\\s]*(.*)`);
            const chapterMatch = creationState.generalOutline.match(chapterRegex);
            const chapterTitle = chapterMatch ? chapterMatch[1].trim() : `第 ${j + 1} 章`;
            listHtml += `
                <div class="chapter-item" data-index="${j}">
                    <span class="chapter-title" title="${chapterTitle}">${j + 1}. ${chapterTitle}</span>
                    <div class="chapter-controls">
                        <button class="edit-chapter-btn" data-index="${j}" title="修改章节名"><i class="fas fa-pen"></i></button>
                        <span class="chapter-status ${statusClass}"></span>
                    </div>
                </div>
            `;
        }
        listHtml += `</details>`;
    }
    container.innerHTML = listHtml;
    document.querySelectorAll('.chapter-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.edit-chapter-btn')) return;
            updateCurrentChapter(parseInt(item.dataset.index, 10));
        });
    });

    document.querySelectorAll('.edit-chapter-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); 
            handleEditChapterName(parseInt(button.dataset.index, 10));
        });
    });
}

function updateCurrentChapter(index) {
    if(index < 0) index = 0; 
    saveCurrentChanges();
    creationState.currentChapterIndex = index;
    document.querySelectorAll('.chapter-item').forEach(item => {
        item.classList.toggle('active', parseInt(item.dataset.index, 10) === index);
    });
    const header = document.getElementById('current-chapter-header');
    const outlineEditor = document.getElementById('detailed-outline-editor');
    const contentEditor = document.getElementById('writing-output');
    const generateContentBtn = document.getElementById('generate-content-btn');
    const chapterNum = index + 1;
    const chapterRegex = new RegExp(`第\\s*${chapterNum}\\s*章[：:\\s]*(.*)`);
    const chapterMatch = creationState.generalOutline.match(chapterRegex);
    const chapterTitle = chapterMatch ? `第 ${chapterNum} 章：${chapterMatch[1].trim()}` : `第 ${chapterNum} 章`;
    header.textContent = chapterTitle;
    outlineEditor.value = creationState.detailedOutlines[index] || "";
    contentEditor.value = creationState.storyChapters[index] || "";
    generateContentBtn.disabled = !outlineEditor.value.trim();
}

function saveCurrentChanges() {
    const currentIndex = creationState.currentChapterIndex;
    if (currentIndex === undefined || currentIndex === null || currentIndex < 0) return;
    const outlineEditor = document.getElementById('detailed-outline-editor');
    const contentEditor = document.getElementById('writing-output');
    if(outlineEditor) creationState.detailedOutlines[currentIndex] = outlineEditor.value;
    if(contentEditor) creationState.storyChapters[currentIndex] = contentEditor.value;
    const statusEl = document.querySelector(`.chapter-item[data-index="${currentIndex}"] .chapter-status`);
    if (statusEl) {
        const hasContent = contentEditor && contentEditor.value.length > 5;
        const hasOutline = outlineEditor && outlineEditor.value.length > 5;
        let statusClass = 'pending';
        if (hasContent) statusClass = 'completed';
        else if (hasOutline) statusClass = 'outline-done';
        statusEl.className = `chapter-status ${statusClass}`;
    }
}

function handleEditChapterName(index) {
    const chapterNum = index + 1;
    const chapterRegex = new RegExp(`(第\\s*${chapterNum}\\s*章[：:\\s]*)(.*)`);
    const match = creationState.generalOutline.match(chapterRegex);
    if (!match) {
        showNotification("无法在宏观大纲中定位此章节，请检查格式。", "error");
        return;
    }
    const oldTitle = match[2].trim();
    const newTitle = prompt(`修改第 ${chapterNum} 章的标题:`, oldTitle);

    if (newTitle !== null && newTitle.trim() !== oldTitle) {
        creationState.generalOutline = creationState.generalOutline.replace(chapterRegex, `$1${newTitle.trim()}`);
        showNotification("章节标题已更新！", "success");
        renderChapterList();
        updateCurrentChapter(index);
    }
}

async function handleGenerateDetailedOutlineChunk() {
    if (isGenerating) return;
    isGenerating = true;
    const bufferEditor = document.getElementById('batch-outline-buffer-editor');
    const progressDiv = document.getElementById('generation-progress');
    const progressText = document.getElementById('progress-text');
    progressDiv.classList.remove('hidden');
    progressText.textContent = `AI 正在生成10章原始细纲...`;
    bufferEditor.value = "请稍候...";
    
    try {
        const currentIndex = creationState.currentChapterIndex < 0 ? 0 : creationState.currentChapterIndex;
        const startChapter = Math.floor(currentIndex / 10) * 10;
        const endChapter = Math.min(startChapter + 9, creationState.totalChapters - 1);
        const prompt = Prompts.generateDetailedOutlinePrompt(creationState.inspirationConcept, creationState.generalOutline, startChapter + 1, endChapter + 1);
        const result = await callApi(prompt);
        
        creationState.batchOutlineBuffer = result.trim();
        bufferEditor.value = creationState.batchOutlineBuffer;
        
        showNotification(`10章原始细纲已生成到缓冲区！`, 'success');
    } catch (error) {
        showNotification(`生成细纲失败: ${error.message}`, "error");
        bufferEditor.value = `生成失败: ${error.message}`;
    } finally {
        isGenerating = false;
        progressDiv.classList.add('hidden');
    }
}

function handleApplyBufferToChapters() {
    const bufferText = document.getElementById('batch-outline-buffer-editor').value;
    if (!bufferText.trim()) {
        showNotification("缓冲区为空，无法应用。", "warning");
        return;
    }
    
    const chapterOutlines = bufferText.split(/(?=第\s*(\d+|[一二三四五六七八九十百]+)\s*章)/).filter(s => s.trim());
    let appliedCount = 0;
    chapterOutlines.forEach(chunk => {
        const match = chunk.match(/第\s*(\d+)\s*章/);
        if (match) {
            const chapterIndex = parseInt(match[1], 10) - 1;
            if (chapterIndex >= 0 && chapterIndex < creationState.totalChapters) {
                creationState.detailedOutlines[chapterIndex] = chunk.trim();
                appliedCount++;
            }
        }
    });
    
    showNotification(`已成功将 ${appliedCount} 个细纲应用到对应章节！`, 'success');
    renderChapterList();
    updateCurrentChapter(creationState.currentChapterIndex); 
}

async function generateSingleChapterContent() {
    const index = creationState.currentChapterIndex;
    if (index < 0) return;
    const outline = document.getElementById('detailed-outline-editor').value;
    if (!outline.trim()) {
        showNotification("本章细纲为空，无法生成正文！", "error");
        return;
    }
    await batchGenerateChapterContents(index, index);
}

async function handleGenerateContentChunk() {
    const currentIndex = creationState.currentChapterIndex < 0 ? 0 : creationState.currentChapterIndex;
    const startChapter = Math.floor(currentIndex / 10) * 10;
    const endChapter = Math.min(startChapter + 9, creationState.totalChapters - 1);
    await batchGenerateChapterContents(startChapter, endChapter);
}

async function batchGenerateChapterContents(start, end) {
     if (isGenerating) return;
    isGenerating = true;
    const progressDiv = document.getElementById('generation-progress');
    const progressText = document.getElementById('progress-text');
    progressDiv.classList.remove('hidden');

    try {
        for (let i = start; i <= end; i++) {
            progressText.textContent = `AI 正在创作正文：第 ${i + 1} 章...`;
            
            // 切换到当前要生成的章节，让用户看到进度
            updateCurrentChapter(i);
            // 短暂延时，确保UI有时间刷新
            await new Promise(resolve => setTimeout(resolve, 100));

            if (!creationState.detailedOutlines[i] || creationState.detailedOutlines[i].trim() === '') {
                showNotification(`第 ${i + 1} 章缺少细纲，已跳过。`, 'warning');
                continue;
            }
            
            let prevContent;
            if (i > 0) {
                 prevContent = creationState.storyChapters[i-1] || "故事从此开始新的一章。";
            } else {
                 const introRegex = /✍️ 正文开篇 · 楔子\/第一章引子\s*([\s\S]*)/;
                 const introMatch = creationState.inspirationConcept.match(introRegex);
                 prevContent = introMatch ? introMatch[1].trim() : "故事由此拉开序幕。";
            }
            
            const chapterMatch = creationState.generalOutline.match(new RegExp(`第\\s*${i + 1}\\s*章[：:\\s]*(.*)`));
            const chapterTitle = chapterMatch ? chapterMatch[0] : `第 ${i + 1} 章`;

            const prompt = Prompts.generateSingleChapterContent(chapterTitle, creationState.detailedOutlines[i], creationState, prevContent, i === creationState.totalChapters - 1);
            const chapterContent = await callApi(prompt);
            
            // 【核心修复】: 生成内容后，不仅存入状态，还立即更新到UI并保存
            creationState.storyChapters[i] = chapterContent;
            document.getElementById('writing-output').value = chapterContent;
            saveCurrentChanges(); // 强制同步状态和UI
        }
        
        showNotification(`第 ${start+1} 到 ${end+1} 章正文已生成！`, 'success');
        
    } catch (error) {
        showNotification(`批量生成正文失败: ${error.message}`, "error");
    } finally {
        isGenerating = false;
        progressDiv.classList.add('hidden');
        renderChapterList(); 
        updateCurrentChapter(end); // 最终定位到最后一章
    }
}

function handleExportTxt() {
    const formattedContent = formatTextForExport(creationState.storyChapters, creationState.inspirationConcept, creationState.novelTitle, creationState.generalOutline, creationState.detailedOutlines);
    downloadFile(formattedContent, creationState.novelTitle || '未命名作品', 'txt');
}

function formatTextForExport(chapters, blueprint = '', novelTitle = '未命名作品', generalOutline = '', detailedOutlines = []) {
    let fullContent = `《${novelTitle}》\n\n`;
    if (blueprint.trim()) fullContent += `【故事总蓝图】\n====================\n${blueprint.trim()}\n\n`;
    if (generalOutline.trim()) fullContent += `【宏观大纲】\n====================\n${generalOutline.trim()}\n\n`;
    fullContent += '【正文】\n====================\n\n';
    if (chapters && chapters.length > 0) {
        for (let i = 0; i < chapters.length; i++) {
            const chapterRegex = new RegExp(`(第\\s*${i + 1}\\s*章[：:\\s].*)`);
            const chapterMatch = generalOutline.match(chapterRegex);
            const chapterTitle = chapterMatch ? chapterMatch[1] : `第 ${i + 1} 章`;
            fullContent += `${chapterTitle}\n\n`;
            if(detailedOutlines[i]) {
                fullContent += `【本章细纲】\n${detailedOutlines[i].replace(new RegExp(`^第\\s*${i + 1}\\s*章[^\n]*\n?`), '').replace(/^细纲：/,'').trim()}\n\n`;
            }
            fullContent += `${chapters[i] || "(本章内容为空)"}\n\n\n`;
        }
    }
    return fullContent.trim();
}