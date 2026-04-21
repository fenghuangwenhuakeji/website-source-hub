// 文件路径: js/modules/module-writing-desk.js
// 描述: (V79.4) - 执笔写作台，采用三栏式布局。

window.writingDeskState = {
    chapters: [], // { title: string, outline: string, body: string }[]
    currentChapterIndex: -1,
};

function initializeWritingDesk() {
    const panel = document.getElementById('writing-desk-panel');
    if (!panel) return;

    panel.innerHTML = `
        <div class="three-column-layout">
            <!-- 左栏: 故事架构 -->
            <div class="layout-left-panel">
                <div class="card-header"><h3><i class="fas fa-sitemap"></i> 故事架构</h3></div>
                <div id="writing-chapter-list" class="cockpit-scroll-area">
                    <p class="text-muted" style="padding:15px;">请先从“大纲细纲”面板发送大纲。</p>
                </div>
            </div>

            <!-- 右侧区域 -->
            <div class="layout-right-panel">
                <!-- 右上: 细纲 -->
                <div id="writing-outline-viewer" class="layout-top-right-panel">
                    <div class="card-header"><h3 id="writing-outline-title">章节细纲</h3></div>
                    <div id="writing-outline-content" class="cockpit-scroll-area" style="padding:15px;">
                        <p class="text-muted">请从左侧选择章节以查看细纲。</p>
                    </div>
                </div>

                <!-- 右下: 正文与风格 -->
                <div id="writing-prose-editor" class="layout-bottom-right-panel">
                    <div class="card-header"><h3 id="writing-prose-title">正文创作</h3></div>
                    <textarea id="main-prose-editor" class="cockpit-scroll-area" placeholder="在此处撰写正文..."></textarea>
                    <div id="writing-style-controls-container" class="prose-controls-container">
                        <!-- 写作风格控件将在这里注入 -->
                    </div>
                </div>
            </div>
        </div>
    `;
    
    injectStyleControls();
    addWritingDeskEventListeners();
    console.log('执笔写作台已重构为三栏式布局并初始化。');
}

function injectStyleControls() {
    const container = document.getElementById('writing-style-controls-container');
    if(!container) return;
    container.innerHTML = `
        <div class="form-group" style="margin: 0;">
            <label for="scribe-persona">写作风格</label>
            <select id="scribe-persona">
                <optgroup label="核心模式">
                    <option value="style_A12345_P0">通用模式 / 创世模式</option>
                    <option value="tomato">番茄长篇风格</option>
                    <option value="zhihu">知乎热帖风格</option>
                </optgroup>
                <optgroup label="自定义风格引擎">
                    <option value="custom_style">【导入】使用自定义示例</option>
                </optgroup>
            </select>
        </div>
        <div class="form-group" style="margin: 0;">
             <label for="narrative-perspective">叙事人称</label>
             <select id="narrative-perspective">
                <option value="third_person" selected>第三人称</option>
                <option value="first_person">第一人称</option>
             </select>
        </div>
         <div class="form-group" style="margin: 0;">
            <label for="words-per-chapter">每章字数</label>
            <input type="number" id="words-per-chapter" value="2000" step="100" style="width: 100px;">
        </div>
        <button id="ai-write-chapter-btn" class="action-btn" style="align-self: flex-end;">生成本章</button>
        <button id="save-chapter-btn" class="settings-btn" style="align-self: flex-end;">保存进度</button>

        <div id="custom-style-section" class="hidden" style="grid-column: 1 / -1; margin-top: 15px; border-top: 1px solid var(--border-color); padding-top: 15px;">
            <label>自定义风格引擎 (可选)</label>
            <div class="form-group"><textarea id="style-example-input" rows="6" placeholder="在此粘贴您想模仿的文风范例..."></textarea></div>
            <div class="button-group" style="display: flex; gap: 10px;">
                <button id="analyze-zhuji-btn" class="settings-btn"><i class="fas fa-magic"></i> 使用【珠玑】引擎分析</button>
            </div>
            <div class="form-group" style="margin-top: 10px;"><label>AI生成的风格指南 (可编辑)</label><textarea id="custom-style-guide-display" rows="8" placeholder="分析结果将显示在此处..."></textarea></div>
            <div class="modal-footer"><button id="lock-style-btn" class="action-btn"><i class="fas fa-lock"></i> 锁定当前风格</button></div>
        </div>
    `;
}

function addWritingDeskEventListeners() {
    document.getElementById('writing-chapter-list').addEventListener('click', e => {
        if (e.target && e.target.matches('.chapter-item')) {
            const index = parseInt(e.target.dataset.index, 10);
            loadChapterToDesk(index);
        }
    });

    document.getElementById('save-chapter-btn').addEventListener('click', saveCurrentDeskChapter);

    document.getElementById('scribe-persona').addEventListener('change', (e) => {
        const customSection = document.getElementById('custom-style-section');
        const layoutContainer = document.querySelector('.three-column-layout');
        const showCustom = e.target.value === 'custom_style';
        
        customSection.classList.toggle('hidden', !showCustom);
        if (layoutContainer) {
            layoutContainer.classList.toggle('custom-style-mode-active', showCustom);
        }
    });

    document.getElementById('analyze-zhuji-btn').addEventListener('click', () => handleStyleAnalysis('珠玑'));

    document.getElementById('custom-style-guide-display').addEventListener('input', (e) => {
        creationState.customStyleGuide = e.target.value;
    });

    document.getElementById('lock-style-btn').addEventListener('click', () => {
        const persona = document.getElementById('scribe-persona').value;
        const guide = document.getElementById('custom-style-guide-display').value;
        if (persona === 'custom_style' && !guide.trim()) {
            showNotification("无法锁定：自定义风格指南不能为空！", "error");
            return;
        }
        creationState.writingStyle = persona === 'custom_style' ? guide : persona;
        showNotification("写作风格已锁定！", "success");
        // 这里可以添加禁用UI的逻辑
    });

    document.getElementById('ai-write-chapter-btn').addEventListener('click', generateChapterContent);
}

// 废弃旧的 parseAndRenderChapterList，使用新的数据驱动函数
// function parseAndRenderChapterList() { ... }

function renderChapterListFromData() {
    const chaptersData = window.creationState.chaptersForDesk;
    if (!chaptersData || !Array.isArray(chaptersData)) {
        // This is not an error, can happen on initial load.
        return;
    }

    // 架构重构：此函数现在只负责渲染，不再管理数据状态本身。
    // 数据源现在直接来自全局的 creationState.chapters。
    writingDeskState.chapters = window.creationState.chapters || [];
    writingDeskState.currentChapterIndex = window.creationState.currentChapterIndex || -1;

    const chapterListContainer = document.getElementById('writing-chapter-list');
    if (chapterListContainer) {
        if (writingDeskState.chapters.length > 0) {
            chapterListContainer.innerHTML = writingDeskState.chapters.map((chap, index) =>
                `<div class="chapter-item" data-index="${index}">${chap.title}</div>`
            ).join('');
            
            // FIX: Load the correct chapter.
            // If currentChapterIndex is valid (from a project load), use it.
            // Otherwise (when sending new outline from another panel), default to 0.
            const indexToLoad = (writingDeskState.currentChapterIndex >= 0 && writingDeskState.currentChapterIndex < writingDeskState.chapters.length)
                ? writingDeskState.currentChapterIndex
                : 0;
            loadChapterToDesk(indexToLoad);
        } else {
            chapterListContainer.innerHTML = `<p class="text-muted" style="padding:15px;">没有找到任何章节。</p>`;
        }
    }
}
// 将新函数挂载到全局，以便大纲模块可以调用
window.renderChapterListFromData = renderChapterListFromData;

function loadChapterToDesk(index) {
    if (index < 0 || index >= writingDeskState.chapters.length) return;

    // 职责重构：在加载新章节前，确保旧章节的任何修改都已同步到状态中
    if (writingDeskState.currentChapterIndex !== -1) {
        syncDeskToState();
    }

    writingDeskState.currentChapterIndex = index;
    const chapter = writingDeskState.chapters[index];

    // 更新UI
    document.getElementById('writing-outline-title').textContent = `${chapter.title} - 细纲`;
    document.getElementById('writing-outline-content').innerHTML = chapter.outline.replace(/\n/g, '<br>');
    document.getElementById('writing-prose-title').textContent = `${chapter.title} - 正文`;
    document.getElementById('main-prose-editor').value = chapter.body || '';

    // 更新列表中的激活状态
    document.querySelectorAll('#writing-chapter-list .chapter-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
}

function syncDeskToState() {
    const index = writingDeskState.currentChapterIndex;
    if (index === -1) return; // 如果没有有效章节，则不执行任何操作

    const editorContent = document.getElementById('main-prose-editor').value;
    
    // 只在内容发生变化时才更新状态，避免不必要的操作
    if (writingDeskState.chapters[index].body !== editorContent) {
        writingDeskState.chapters[index].body = editorContent;
    }

    // 确保全局状态也得到更新
    if (window.creationState) {
        window.creationState.chapters = writingDeskState.chapters;
        window.creationState.currentChapterIndex = index;
    }
}

function saveCurrentDeskChapter(showNotif = true) {
    // 步骤1：永远先从UI同步最新状态
    syncDeskToState();

    // 步骤2：调用纯粹的保存引擎
    if (window.App && window.App.projectManager && typeof window.App.projectManager.silentSaveProject === 'function') {
        window.App.projectManager.silentSaveProject(showNotif);
    } else {
        if (showNotif) {
            showNotification('保存失败：保存引擎未就绪。', 'error');
        }
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

    const analyzeBtn = engine === 'SARE' ? document.getElementById('analyze-sare-btn') : document.getElementById('analyze-zhuji-btn');
    const originalBtnContent = analyzeBtn.innerHTML;
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 正在分析...`;
    
    guideDisplayArea.value = `正在调用【${engine}】引擎分析文风...`;

    try {
        if (typeof Prompts === 'undefined' || typeof Prompts.getSAREAnalysisPrompt !== 'function' || typeof Prompts.getZhujiAnalysisPrompt !== 'function') {
            // 尝试从全局状态或另一个模块获取
            const sarePromptFn = window.Prompts?.getSAREAnalysisPrompt;
            const zhujiPromptFn = window.Prompts?.getZhujiAnalysisPrompt;
            if(!sarePromptFn || !zhujiPromptFn) {
                 throw new Error("Prompts.js 或其所需函数 (getSAREAnalysisPrompt, getZhujiAnalysisPrompt) 未加载。");
            }
             const prompt = engine === 'SARE' ? sarePromptFn(sampleText) : zhujiPromptFn(sampleText);
             const styleGuide = await callApi(prompt);
             guideDisplayArea.value = styleGuide;
             creationState.customStyleGuide = styleGuide;
             showNotification(`【${engine}】引擎已成功生成风格指南！`, "success");
        } else {
            const prompt = engine === 'SARE' ? Prompts.getSAREAnalysisPrompt(sampleText) : Prompts.getZhujiAnalysisPrompt(sampleText);
            const styleGuide = await callApi(prompt);
            guideDisplayArea.value = styleGuide;
            creationState.customStyleGuide = styleGuide;
            showNotification(`【${engine}】引擎已成功生成风格指南！`, "success");
        }
    } catch (error) {
        guideDisplayArea.value = `风格分析失败: ${error.message}`;
        showNotification(`风格分析失败: ${error.message}`, "error");
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = originalBtnContent;
    }
}

document.addEventListener('DOMContentLoaded', initializeWritingDesk);

async function generateChapterContent() {
    const index = writingDeskState.currentChapterIndex;
    if (index === -1) {
        showNotification("请先从左侧选择一个要生成的章节！", "error");
        return;
    }

    const chapter = writingDeskState.chapters[index];
    const proseEditor = document.getElementById('main-prose-editor');
    const generateBtn = document.getElementById('ai-write-chapter-btn');
    
    const personaSelect = document.getElementById('scribe-persona');
    let writingStyle = personaSelect.value;

    if (writingStyle === 'custom_style') {
        const customGuide = document.getElementById('custom-style-guide-display').value.trim();
        if (!customGuide) {
            showNotification("请先分析或手动输入自定义风格指南！", "error");
            return;
        }
        writingStyle = `这是一个自定义的写作风格指南，请严格遵守：\n${customGuide}`;
    }

    const novelTitle = window.creationState?.novelTitle || "未命名小说";
    const wordsPerChapter = document.getElementById('words-per-chapter').value || 2000;
    const narrativePerspectiveSelect = document.getElementById('narrative-perspective');
    const narrativePerspective = narrativePerspectiveSelect.options[narrativePerspectiveSelect.selectedIndex].text; // 获取选中的文本，如“第三人称”

    const prevChapterContent = index > 0 ? writingDeskState.chapters[index - 1].body.slice(-500) : null;

    try {
        const prompt = Prompts.generateChapter(
            chapter.title,
            writingStyle,
            novelTitle,
            chapter.outline,
            wordsPerChapter,
            narrativePerspective,
            prevChapterContent
        );

        generateBtn.disabled = true;
        generateBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 正在生成...`;
        proseEditor.value = "AI正在努力创作中，请稍候...";

        const generatedBody = await App.api.callApi(prompt);
        
        proseEditor.value = generatedBody;
        chapter.body = generatedBody; // 更新状态
        showNotification(`章节 "${chapter.title}" 已生成！`, 'success');

    } catch (error) {
        proseEditor.value = `生成失败: ${error.message}`;
        showNotification(`生成失败: ${error.message}`, 'error');
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = `生成本章`;
    }
}
