// 文件路径: js/modules/03_长篇写作.js
// 描述: (V75.0 博士·模块重构) - 负责“长篇正文”面板的交互逻辑，已整合“长篇架构”的UI。

function initializeLongFormPanel() {
    const panel = document.getElementById('long-form-panel');
    if (!panel) return;

    // --- Element Selectors ---
    const mainEditor = panel.querySelector('#main-editor-long-form');
    const wordCountSpan = panel.querySelector('#word-count-long-form');
    const outputLogTextarea = panel.querySelector('#output-log-textarea-long');

    // Left panel buttons
    const genArchitectureBtn = panel.querySelector('#gen-architecture-long');
    const genVolumesBtn = panel.querySelector('#gen-volumes-long');
    const genOutlineBtn = panel.querySelector('#gen-outline-long');
    const parseOutlineBtn = document.createElement('button'); // 新增解析按钮
    parseOutlineBtn.id = 'parse-outline-long';
    parseOutlineBtn.textContent = '解析大纲';
    genOutlineBtn.parentElement.appendChild(parseOutlineBtn);
    
    const genDraftBtn = panel.querySelector('#gen-draft-long');
    const rewriteChapterBtn = panel.querySelector('#rewrite-chapter-long');
    const finalizeChapterBtn = panel.querySelector('#finalize-chapter-long');

    // Right panel tabs
    const tabButtons = panel.querySelectorAll('.right-panel .tab-button');
    const tabContents = panel.querySelectorAll('.right-panel .tab-content');

    // --- Event Listeners ---
    if (mainEditor) {
        mainEditor.addEventListener('input', () => {
            if(wordCountSpan) wordCountSpan.textContent = mainEditor.value.trim().length;
        });
    }

    // Button event listeners (placeholder functionality)
    const buttons = [
        genArchitectureBtn, genVolumesBtn, genOutlineBtn,
        genDraftBtn, rewriteChapterBtn, finalizeChapterBtn
    ];
    buttons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                const actionText = btn.textContent;
                if (btn.id === 'gen-draft-long') {
                    handleGenerateDraft();
                } else {
                    const actionText = btn.textContent;
                    logToLongFormOutput(`执行操作: ${actionText}`);
                    showNotification(`功能开发中: ${actionText}`, 'info');
                }
            });
        }
    });

    if(parseOutlineBtn) {
        parseOutlineBtn.addEventListener('click', handleParseLongFormOutline);
    }

    // Tab switching logic
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            const targetContent = panel.querySelector(`#${button.dataset.tab}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    function logToLongFormOutput(message) {
        if (outputLogTextarea) {
            const timestamp = new Date().toLocaleTimeString();
            outputLogTextarea.value += `[${timestamp}] ${message}\n`;
            outputLogTextarea.scrollTop = outputLogTextarea.scrollHeight;
        }
    }

    logToLongFormOutput('长篇正文模块已根据"长篇架构"UI进行初始化。');
    console.log('长篇正文模块已根据"长篇架构"UI进行初始化。');
}

function handleParseLongFormOutline() {
    const editor = document.getElementById('main-editor-long-form');
    const outputLogTextarea = document.getElementById('output-log-textarea-long');
    const htmlContent = editor.value;

    const log = (message) => {
        if (outputLogTextarea) {
            const timestamp = new Date().toLocaleTimeString();
            outputLogTextarea.value += `[${timestamp}] ${message}\n`;
            outputLogTextarea.scrollTop = outputLogTextarea.scrollHeight;
        }
    };

    if (!htmlContent.trim()) {
        showNotification('内容编辑框为空，无法解析。', 'warning');
        return;
    }

    log('开始解析大纲内容...');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    const architecturePanel = document.getElementById('novel-architecture-long');
    const outlinePanel = document.getElementById('novel-outline-long');
    const volumesPanel = document.getElementById('novel-volumes-long');

    const h3s = Array.from(tempDiv.querySelectorAll('h3'));
    const worldBibleHeader = h3s.find(h => h.textContent.includes('世界观与三弧光'));
    const outlineHeader = h3s.find(h => h.textContent.includes('章节大纲'));

    let worldBibleParsed = false;
    if (worldBibleHeader && architecturePanel) {
        let contentHtml = '';
        let currentNode = worldBibleHeader.nextElementSibling;
        while (currentNode && currentNode.tagName !== 'H3') {
            contentHtml += currentNode.outerHTML;
            currentNode = currentNode.nextElementSibling;
        }
        architecturePanel.innerHTML = `<h2>世界观与三弧光</h2>${contentHtml}`;
        log('成功解析【世界观与三弧光】。');
        worldBibleParsed = true;
    } else if (architecturePanel) {
        architecturePanel.innerHTML = '<p class="placeholder-text">解析失败：未在内容中找到“世界观与三弧光”部分。</p>';
        log('解析警告：未找到世界观信息。');
    }

    let outlineParsed = false;
    if (outlineHeader && outlinePanel) {
        let outlineHtml = '<div class="outline-container">';
        let collectedNodes = [];
        let currentNode = outlineHeader.nextElementSibling;
    
        while(currentNode) {
            // Chapter titles are expected to be H4 tags
            if (currentNode.tagName === 'H4' && collectedNodes.length > 0) {
                const title = collectedNodes[0].textContent;
                const content = collectedNodes.slice(1).map(n => n.outerHTML).join('');
                outlineHtml += `<details><summary>${title}</summary><div class="chapter-details">${content}</div></details>`;
                collectedNodes = [currentNode];
            } else {
                collectedNodes.push(currentNode);
            }
            currentNode = currentNode.nextElementSibling;
        }
    
        // Add the last collected chapter
        if (collectedNodes.length > 0 && collectedNodes[0].tagName === 'H4') {
            const title = collectedNodes[0].textContent;
            const content = collectedNodes.slice(1).map(n => n.outerHTML).join('');
            outlineHtml += `<details><summary>${title}</summary><div class="chapter-details">${content}</div></details>`;
        }
    
        outlineHtml += '</div>';
        outlinePanel.innerHTML = outlineHtml;
        log('成功解析【章节大纲】。');
        outlineParsed = true;

    } else if (outlinePanel) {
        outlinePanel.innerHTML = '<p class="placeholder-text">解析失败：未在内容中找到“章节大纲”部分。</p>';
        log('解析警告：未找到章节大纲信息。');
    }
    
    if (volumesPanel) {
        volumesPanel.innerHTML = '<p class="placeholder-text">提示：当前生成的大纲为扁平结构，不包含独立的分卷信息。</p>';
    }

    if (worldBibleParsed || outlineParsed) {
        showNotification('大纲解析完成！', 'success');
        log('大纲解析流程结束。');
        // Switch to the outline tab automatically
        const outlineTabBtn = document.querySelector('.right-panel .tab-button[data-tab="novel-outline-long"]');
        if (outlineTabBtn) outlineTabBtn.click();

    } else {
        showNotification('大纲解析失败，未找到任何有效部分。', 'error');
        log('大纲解析失败，未找到任何有效部分。');
    }
}
async function handleGenerateDraft() {
    const outputLogTextarea = document.getElementById('output-log-textarea-long');
    const mainEditor = document.getElementById('main-editor-long-form');

    const log = (message) => {
        if (outputLogTextarea) {
            const timestamp = new Date().toLocaleTimeString();
            outputLogTextarea.value += `[${timestamp}] ${message}\n`;
            outputLogTextarea.scrollTop = outputLogTextarea.scrollHeight;
        }
    };

    log('开始生成章节草稿...');

    const activeChapterSummary = document.querySelector('#novel-outline-long .outline-container details[open] summary');
    if (!activeChapterSummary) {
        showNotification('请先在右侧“小说目录”中点击以选中并展开一个章节。', 'warning');
        log('错误：未选中任何章节。');
        return;
    }
    
    const chapterTitle = activeChapterSummary.textContent;
    const chapterDetails = activeChapterSummary.parentElement.querySelector('.chapter-details');
    if (!chapterDetails || !chapterDetails.innerText.trim()) {
        showNotification('错误：选中的章节没有有效的大纲内容。', 'error');
        log(`错误：章节 "${chapterTitle}" 缺少有效的大纲内容。`);
        return;
    }
    const chapterOutline = chapterDetails.innerText;
    
    log(`已选中章节: ${chapterTitle}`);
    showNotification(`AI 正在为【${chapterTitle}】生成草稿...`, 'info');

    try {
        const novelTitle = creationState.novelTitle || '未命名作品';
        const narrativePerspective = creationState.narrativePerspective || '第三人称';
        const writingStyleKey = 'style_A12345_P0'; 
        const wordsPerChapter = 1500;
        const prevChapterContent = null; 

        const prompt = Prompts.generateChapter(chapterTitle, writingStyleKey, novelTitle, chapterOutline, wordsPerChapter, narrativePerspective, prevChapterContent);
        
        log('正在调用 AI API...');
        const response = await callApi(prompt);
        log('AI 已返回草稿内容，正在流式输出到编辑器...');

        if (mainEditor) {
            mainEditor.value = response;
            if(document.getElementById('word-count-long-form')) {
               document.getElementById('word-count-long-form').textContent = mainEditor.value.trim().length;
            }
        }
        
        showNotification(`章节【${chapterTitle}】草稿生成完毕！`, 'success');
        log('章节草稿生成成功。');

    } catch (error) {
        log(`错误: AI 生成草稿失败 - ${error.message}`);
        showNotification(`生成草稿失败: ${error.message}`, 'error');
        console.error("Error generating draft:", error);
    }
}