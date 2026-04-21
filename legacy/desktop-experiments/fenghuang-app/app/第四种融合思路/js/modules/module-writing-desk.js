// 文件路径: js/modules/module-writing-desk.js
// 描述: (V73.0 梦想最终实现版) - 博士为您重构。
// ✨✨✨ (博士重构 - 布局优化 V3) ✨✨✨
// 1. 【核心优化】重写了 `renderChapterList` 函数中的渲染逻辑。现在，左侧章节列表将只显示简洁的“第 X 章”，而将完整的章节标题放在悬停提示（tooltip）中，使界面更整洁。

let isDeskGenerating = false; // 写作台模块专属的状态锁

function initializeWritingDesk() {
    const container = document.getElementById('writing-desk-panel');
    if (container && UITemplates.writingDeskPanel) {
        container.innerHTML = UITemplates.writingDeskPanel;
    } else {
        console.error("未能找到写作台面板容器或其UI模板。");
        return;
    }
    setupWritingDeskListeners();
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.attributeName === 'class' && mutation.target.classList.contains('active')) {
                renderChapterList();
            }
        }
    });
    if (container) {
        observer.observe(container, { attributes: true });
    }
    if (container && container.classList.contains('active')) {
        renderChapterList();
    }
}

function setupWritingDeskListeners() {
    const panel = document.getElementById('writing-desk-panel');
    if (!panel) return;

    panel.addEventListener('click', (e) => {
        const target = e.target;
        const chapterItem = target.closest('.chapter-item');
        
        if (chapterItem) {
            const index = parseInt(chapterItem.dataset.index, 10);
            loadChapterForEditing(index);
        } else if (target.closest('#generate-chapter-btn')) {
            handleGenerateCurrentChapter(false);
        } else if (target.closest('#regenerate-chapter-btn')) {
            if (confirm("您确定要重新生成本章内容吗？当前内容将会被覆盖。")) {
                handleGenerateCurrentChapter(true);
            }
        } else if (target.closest('#generate-all-chapters-btn')) {
             if (!confirm(`即将开始全自动流程：\n\n1. AI生成全部章节原文。\n2. 自动导出原文稿件。\n\n此过程不可逆，且可能需要较长时间。确定要开始吗？`)) {
                return;
            }
            handleGenerateAllChapters();
        } else if (target.closest('#export-full-text-btn')) {
            handleCopyFullTextFromDesk();
        }
    });

    const editorArea = document.getElementById('chapter-editor-area');
    if (editorArea) {
        editorArea.addEventListener('blur', () => {
            const currentIndex = editorArea.dataset.currentIndex;
            if (currentIndex !== undefined && currentIndex !== null) {
                const state = getState();
                if (state.pipeline.chapters && state.pipeline.chapters[currentIndex]) {
                    const currentContent = state.pipeline.chapters[currentIndex].content;
                    const newContent = editorArea.value;
                    if(currentContent !== newContent) {
                        state.pipeline.chapters[currentIndex].content = newContent;
                        if(state.pipeline.chapters[currentIndex].status !== 'completed') {
                             state.pipeline.chapters[currentIndex].status = 'completed';
                        }
                        updateState({ pipeline: state.pipeline });
                        renderChapterList();
                    }
                }
            }
        });
    }
}


function renderChapterList() {
    const container = document.getElementById('chapter-list-container');
    const progressIndicator = document.getElementById('writing-progress-indicator');
    if (!container || !progressIndicator) return;

    const chapters = getState().pipeline.chapters || [];
    let completedCount = 0;

    if (chapters.length === 0) {
        container.innerHTML = `<p class="placeholder-text">请先在“创作流水线”中生成大纲并导入...</p>`;
        progressIndicator.textContent = `0/0`;
        return;
    }

    container.innerHTML = chapters.map((chap, index) => {
        if (chap.status === 'completed') completedCount++;
        
        // ✨ 核心修正：简化列表项显示
        const chapterPrefixMatch = chap.title.match(/第\s*[\d一二三四五六七八九十百千万]+\s*章/);
        const simpleTitle = chapterPrefixMatch ? chapterPrefixMatch[0] : `第 ${index + 1} 章`;

        return `<div class="chapter-item" data-index="${index}" title="${Utils.escapeHTML(chap.title)}">
                    <span>${Utils.escapeHTML(simpleTitle)}</span>
                    <span class="chapter-status ${chap.status || 'pending'}"></span>
                </div>`;
    }).join('');
    
    progressIndicator.textContent = `${completedCount}/${chapters.length}`;

    const editorArea = document.getElementById('chapter-editor-area');
    const currentIndex = editorArea ? editorArea.dataset.currentIndex : null;
    if (currentIndex !== null && currentIndex !== undefined) {
        const activeItem = container.querySelector(`.chapter-item[data-index="${currentIndex}"]`);
        if (activeItem) activeItem.classList.add('active');
    }
}

function loadChapterForEditing(index) {
    const editorArea = document.getElementById('chapter-editor-area');
    const editorTitle = document.getElementById('chapter-editor-title');
    const generateBtn = document.getElementById('generate-chapter-btn');
    const regenerateBtn = document.getElementById('regenerate-chapter-btn');
    const chapterListItems = document.querySelectorAll('.chapter-item');
    const outlineDisplay = document.getElementById('current-chapter-outline');

    if (!editorArea || !editorTitle || !generateBtn || !regenerateBtn || !outlineDisplay) return;

    const chapterData = getState().pipeline.chapters[index];
    if (!chapterData) return;

    editorArea.value = chapterData.content || '';
    editorTitle.textContent = chapterData.title;
    editorArea.dataset.currentIndex = index;

    regenerateBtn.disabled = false;
    generateBtn.disabled = !!(chapterData.content && chapterData.content.trim().length > 10);

    chapterListItems.forEach(item => item.classList.remove('active'));
    if(chapterListItems[index]) chapterListItems[index].classList.add('active');

    const chapterOutlineText = chapterData.outline;
    if (chapterOutlineText) {
        if (typeof showdown === 'undefined') {
            const errorMsg = "格式化库(showdown)加载失败，无法渲染细纲。";
            console.error(errorMsg);
            outlineDisplay.innerHTML = `<p class="placeholder-text" style="color:var(--error-color)">${errorMsg}</p>`;
            return; // Exit if showdown is not available
        }
        const converter = new showdown.Converter();
        outlineDisplay.innerHTML = converter.makeHtml(chapterOutlineText);
    } else {
        outlineDisplay.innerHTML = `<p class="placeholder-text">未能从大纲中找到本章内容。</p>`;
    }
}

async function _generateChapterContent(index) {
    const state = getState();
    const chapter = state.pipeline.chapters[index];
    
    state.pipeline.chapters[index].status = 'generating';
    updateState({ pipeline: state.pipeline });
    renderChapterList(); 

    if (!chapter || !chapter.outline) {
        throw new Error("未找到本章的细纲，无法进行AI生成。");
    }

    const wordsPerChapter = document.getElementById('final-words-per-chapter').value;
    const narrativePerspective = document.getElementById('final-narrative-perspective').value;
    const writingStyleKey = document.getElementById('final-writing-style').value;
    
    const novelTitle = state.pipeline.novelTitle;
    const prevContent = index > 0 && state.pipeline.chapters[index-1].content ? state.pipeline.chapters[index-1].content.slice(-500) : null;
    
    const prompt = Prompts.generateChapter(chapter.title, writingStyleKey, novelTitle, chapter.outline, wordsPerChapter, narrativePerspective, prevContent);

    try {
        const fullText = await callAI(prompt);
        const currentState = getState();
        currentState.pipeline.chapters[index].content = fullText;
        currentState.pipeline.chapters[index].status = 'completed';
        updateState({ pipeline: currentState.pipeline });
        renderChapterList();
        return fullText;
    } catch (error) {
        const currentState = getState();
        currentState.pipeline.chapters[index].status = 'failed';
        updateState({ pipeline: currentState.pipeline });
        renderChapterList();
        throw error;
    }
}

async function handleGenerateCurrentChapter(isForced = false) {
    if (isDeskGenerating) {
        showNotification("AI正在生成中，请稍候...", "warning");
        return;
    }
    const editorArea = document.getElementById('chapter-editor-area');
    const currentIndex = parseInt(editorArea.dataset.currentIndex, 10);
    if (isNaN(currentIndex)) {
        showNotification("请先从左侧选择一个章节。", "warning");
        return;
    }

    const chapter = getState().pipeline.chapters[currentIndex];
    if (!chapter) return;
    if (!isForced && chapter.content && chapter.content.trim().length > 10) {
        showNotification(`章节“${chapter.title}”已有内容，如需重写请使用“强制重新生成”。`, "info");
        return;
    }

    isDeskGenerating = true;
    const genBtn = document.getElementById('generate-chapter-btn');
    const regenBtn = document.getElementById('regenerate-chapter-btn');
    genBtn.disabled = true;
    regenBtn.disabled = true;
    regenBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 正在生成...`;
    showLoading(`AI作家正在撰写: ${chapter.title}`);
    editorArea.value = '';

    try {
        const generatedText = await _generateChapterContent(currentIndex);
        editorArea.value = generatedText;
        showNotification(`章节“${chapter.title}”已生成！`, "success");
    } catch (error) {
        editorArea.value = `生成失败: ${error.message}`;
        showNotification(`生成失败: ${error.message}`, 'error');
    } finally {
        isDeskGenerating = false;
        hideLoading();
        loadChapterForEditing(currentIndex); 
        regenBtn.innerHTML = `<i class="fas fa-redo"></i> 强制重新生成`;
    }
}

function handleGenerateAllChapters() {
    return new Promise(async (resolve, reject) => {
        if (isDeskGenerating) {
            const msg = "自动化流程正在进行中，请勿重复点击。";
            showNotification(msg, "warning");
            return reject(new Error(msg));
        }

        const chapters = getState().pipeline.chapters || [];
        if (chapters.length === 0) {
            const msg = "写作台中没有章节，请先导入。";
            showNotification(msg, "warning");
            return reject(new Error(msg));
        }

        isDeskGenerating = true;
        const generateAllBtn = document.getElementById('generate-all-chapters-btn');
        if (generateAllBtn) {
            generateAllBtn.disabled = true;
            generateAllBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 自动化执行中...`;
        }
        
        let lastGeneratedChapterTitle = '';
        
        const state = getState();
        const novelTitle = state.pipeline.novelTitle || "未命名作品";
        let fullRawText = `# ${novelTitle}\n\n`;

        try {
            for (let i = 0; i < chapters.length; i++) {
                const chapter = chapters[i];
                lastGeneratedChapterTitle = chapter.title;
                loadChapterForEditing(i); 
                showLoading(`正在生成全文 (${i + 1}/${chapters.length}): ${chapter.title}`);
                
                const chapterContent = await _generateChapterContent(i);
                fullRawText += `${i + 1}\n\n${chapterContent}\n\n`;

                await new Promise(resolve => setTimeout(resolve, 1500));
            }
            showNotification("所有章节原文已生成！即将自动导出...", "success");

            await new Promise(resolve => setTimeout(resolve, 1000));
            Utils.exportTextAsFile(fullRawText, `${novelTitle}_原文稿件.txt`);
            
            resolve();
        } catch (error) {
            console.error("自动化流程中出错:", error);
            showNotification(`在处理章节 “${lastGeneratedChapterTitle}” 时发生错误，流程已中断：${error.message}`, 'error');
            reject(error);
        } finally {
            isDeskGenerating = false;
            hideLoading();
            if (generateAllBtn) {
                generateAllBtn.disabled = false;
                generateAllBtn.innerHTML = `<i class="fas fa-robot"></i> 一键生成全文并导出`;
            }
        }
    });
}

function handleCopyFullTextFromDesk() {
    const state = getState();
    const chapters = state.pipeline.chapters || [];
    if (chapters.length === 0 || chapters.every(c => !c.content || !c.content.trim())) {
        showNotification("没有可复制的原文内容。", "warning");
        return;
    }

    let fullText = '';
    chapters.forEach((chap, index) => {
        fullText += `${index + 1}\n\n`;
        fullText += (chap.content || "[本章内容为空]\n\n") + "\n\n";
    });

    navigator.clipboard.writeText(fullText.trim()).then(() => {
        showNotification("原文已复制到剪贴板！", "success");
    }).catch(err => {
        showNotification("复制失败: " + err, "error");
    });
}