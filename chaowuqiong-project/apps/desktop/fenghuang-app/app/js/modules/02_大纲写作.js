// 文件路径: js/modules/02_大纲写作.js
// 描述: (V79.5) - 大纲细纲模块，实现智能分卷与结构化发送功能。

function initializeOutlinePanel() {
    const panel = document.getElementById('outline-detail-panel');
    if (!panel) return;

    panel.innerHTML = `
        <div class="outline-container">
            <div id="outline-list-panel" class="outline-list-panel">
                <div class="card-header">
                    <h3><i class="fas fa-book"></i> 卷列表</h3>
                </div>
                <div id="volume-list" class="volume-list">
                    <p class="text-muted" style="padding: 15px;">在右侧编辑器中输入或粘贴包含“## 第X卷”和“### 第X章”格式的细纲。</p>
                </div>
            </div>
            <div id="outline-detail-view" class="outline-detail-view">
                <div class="card">
                     <div class="card-header">
                        <h2 id="volume-title-display">请选择一个卷</h2>
                    </div>
                    <div id="volume-detail-content" class="card-body">
                         <p class="text-muted">此处将显示选中卷的详细信息。</p>
                    </div>
                </div>
                 <div class="card outline-editor-card">
                    <div class="card-header">
                        <h2><i class="fas fa-edit"></i> 完整大纲/细纲 (在此处粘贴)</h2>
                    </div>
                    <textarea id="outline-editor-area" placeholder="请在此处粘贴您的完整细纲..."></textarea>
                </div>
            </div>
        </div>
        <style>
            .chapter-detail { border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 10px; }
            .chapter-detail[open] { border-color: var(--primary-color); }
            .chapter-detail summary { padding: 10px 15px; font-weight: 500; cursor: pointer; list-style: none; position: relative; }
            .chapter-detail summary:hover { background-color: rgba(var(--primary-color-rgb), 0.05); }
            .scene-tag { font-size: 0.8em; color: var(--text-muted); background-color: var(--bg-color); padding: 2px 6px; border-radius: 4px; margin-left: 10px; }
            .volume-actions { margin-bottom: 15px; }
            .volume-list-panel { background-color: var(--content-bg); border: 1px solid var(--border-color); border-radius: 12px; }
            .volume-item { padding: 15px; cursor: pointer; border-bottom: 1px solid var(--border-color); transition: background-color 0.2s ease; }
            .volume-item:last-child { border-bottom: none; }
            .volume-item.active { background-color: rgba(var(--primary-color-rgb), 0.1); border-left: 3px solid var(--primary-color); font-weight: bold; }
        </style>
    `;

    addOutlineEventListeners();
    console.log('大纲细纲模块已重构为智能分卷布局。');
}

function addOutlineEventListeners() {
    const editorArea = document.getElementById('outline-editor-area');
    if(editorArea) {
        editorArea.addEventListener('input', (e) => {
            const outlineText = e.target.value;
            creationState.hierarchicalOutline = outlineText; // Save raw text to state
            const parsedData = parseDetailedOutline(outlineText);
            window.creationState.structuredOutline = parsedData; // Keep parsed version for UI
            renderVolumeList(parsedData);
        });
    }
}

function renderVolumeList(parsedData) {
    const volumeListContainer = document.getElementById('volume-list');
    if (!volumeListContainer) return;

    const { volumes } = parsedData;
    
    if (!volumes || volumes.length === 0) {
        volumeListContainer.innerHTML = '<p class="text-muted" style="padding: 15px;">在右侧编辑器中输入或粘贴包含“## 第X卷”和“### 第X章”格式的细纲。</p>';
        return;
    }

    volumeListContainer.innerHTML = volumes.map((vol, index) => 
        `<div class="volume-item" data-index="${index}">${vol.title}</div>`
    ).join('');

    const volumeItems = volumeListContainer.querySelectorAll('.volume-item');
    volumeItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index, 10);
            displayVolumeDetail(parsedData, index);
            volumeItems.forEach(i => i.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    if (volumes.length > 0) {
        displayVolumeDetail(parsedData, 0);
        if(volumeItems.length > 0) volumeItems[0].classList.add('active');
    }
}

function displayVolumeDetail(parsedData, index) {
    const volume = parsedData.volumes[index];
    const detailContainer = document.getElementById('volume-detail-content');
    const titleDisplay = document.getElementById('volume-title-display');

    if (!volume || !detailContainer || !titleDisplay) return;

    titleDisplay.textContent = volume.title;
    
    const volumePreambleHtml = volume.preamble ? `
        <details class="chapter-detail" open>
            <summary>本卷前情提要</summary>
            <div class="reference-content" data-volume-preamble="true">${volume.preamble.replace(/\n/g, '<br>')}</div>
        </details>
    ` : '';

    let chaptersHtml = volume.chapters.map(chap => `
        <details open class="chapter-detail">
            <summary>${chap.title} <span class="scene-tag">场景: ${chap.scene}</span></summary>
            <div class="reference-content">${chap.content.replace(/\n/g, '<br>')}</div>
        </details>
    `).join('');

    if(volume.chapters.length === 0) {
        chaptersHtml = '<p class="text-muted">此卷中未解析到任何章节。</p>';
    }
    
    detailContainer.innerHTML = `
        <div class="volume-actions" style="display: flex; gap: 10px;">
            <button id="send-volume-${index}-btn" class="action-btn" data-index="${index}"><i class="fas fa-paper-plane"></i> 发送此卷至写作台</button>
            <button id="view-generated-${index}-btn" class="settings-btn" data-index="${index}" data-title="${volume.title}"><i class="fas fa-eye"></i> 查看已生成内容</button>
        </div>
        <hr>
        ${volumePreambleHtml}
        ${chaptersHtml}
    `;

    const sendBtn = document.getElementById(`send-volume-${index}-btn`);
    if(sendBtn) {
        sendBtn.addEventListener('click', (e) => {
            const volumeIndex = e.target.closest('button').dataset.index;
            sendVolumeToWritingDesk(parsedData.volumes[volumeIndex]);
        });
    }
    
    const viewBtn = document.getElementById(`view-generated-${index}-btn`);
    if(viewBtn) {
        viewBtn.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            const volumeIndex = parseInt(button.dataset.index, 10);
            const volumeInOutline = parsedData.volumes[volumeIndex];

            if (!volumeInOutline || !volumeInOutline.chapters || volumeInOutline.chapters.length === 0) {
                showNotification("此卷没有章节可供查看。", "warning");
                return;
            }

            // 目标：找到这一卷的第一个章节在写作台的什么位置
            const firstChapterOfVolume = volumeInOutline.chapters[0];
            const chapterIndexInDesk = window.writingDeskState.chapters.findIndex(c => c.title === firstChapterOfVolume.title);

            if (chapterIndexInDesk > -1) {
                if (typeof switchTab === 'function' && typeof loadChapterToDesk === 'function') {
                    // 如果找到了，就切换并加载
                    switchTab('writing-desk-panel');
                    setTimeout(() => {
                        loadChapterToDesk(chapterIndexInDesk);
                    }, 100); // 延迟确保UI切换完成
                } else {
                    showNotification("UI切换或加载功能异常。", "error");
                }
            } else {
                showNotification("此卷内容尚未发送至写作台。", "info");
            }
        });
    }
}

function sendVolumeToWritingDesk(volumeData) {
    if (!volumeData || !volumeData.chapters || volumeData.chapters.length === 0) {
        showNotification("此卷没有可发送的章节内容！", "error");
        return;
    }
    
    // 直接传递结构化数据，而不是拼接字符串
    const chaptersData = volumeData.chapters.map(chap => ({
        title: chap.title,
        outline: `#### 场景: ${chap.scene}\n${chap.content}`, // 将场景和内容合并为细纲
        body: ''
    }));

    // 架构重构：直接修改并覆盖全局状态，确保数据源唯一
    window.creationState.chapters = chaptersData;
    window.creationState.chaptersForDesk = chaptersData; // 保持兼容
    window.creationState.currentChapterIndex = 0; // 发送新卷时，默认定位到第一章

    if (typeof renderChapterListFromData === 'function') {
        renderChapterListFromData();
        showNotification(`《${volumeData.title}》已成功发送至写作台！`, "success");
        if (typeof switchTab === 'function') switchTab('writing-desk-panel');
    } else {
        showNotification("错误：找不到写作台的数据渲染函数(renderChapterListFromData)。", "error");
    }
}

function parseDetailedOutline(text) {
    if (!text || !text.trim()) {
        return { volumes: [] };
    }

    const volumes = [];
    // 1. 以“前情提要”作为主要分隔符，将文档切分为多个“卷块”
    const volumeBlocks = text.split(/(?=###\s*前情提要\s*\(第 \d+ 卷\))/);

    for (const block of volumeBlocks) {
        if (!block.trim()) continue;

        // 2. 在每个“卷块”中，分离出前情提要和正文
        const preambleMatch = block.match(/###\s*前情提要\s*\(第 \d+ 卷\)([\s\S]*?)(?=##\s*第)/);
        const volumeMatch = block.match(/##\s*第[一二三四五六七八九十百零〇\d]+\s*卷.*/);
        
        if (!volumeMatch) continue; // 如果没有卷标题，则这不是一个有效的块

        const preamble = preambleMatch ? preambleMatch[1].trim() : '';
        const volumeContent = block.substring(volumeMatch.index);

        // 3. 从正文中提取卷标题和章节
        const volumeTitleMatch = volumeContent.match(/##\s*(.*?)\n/);
        const volumeTitle = volumeTitleMatch ? volumeTitleMatch[1].trim() : '未知卷';
        
        const chapters = [];
        const chapterParts = volumeContent.split(/(?=###\s*第[一二三四五六七八九十百零〇\d]+\s*章)/g);
        
        // 移除卷标题部分
        if (chapterParts.length > 0 && !chapterParts[0].startsWith('###')) {
            chapterParts.shift();
        }

        for (const chapterText of chapterParts) {
            if (!chapterText.trim() || chapterText.startsWith("### 前情提要")) continue;

            const chapterTitleMatch = chapterText.match(/###\s*(.*?)\n/);
            const sceneMatch = chapterText.match(/####\s*场景：(.*?)\n/);
            const title = chapterTitleMatch ? chapterTitleMatch[1].trim() : '未知章节';
            const scene = sceneMatch ? sceneMatch[1].trim() : '未指定';
            
            let content = chapterText;
            if (chapterTitleMatch) {
                content = content.substring(content.indexOf(chapterTitleMatch[0]) + chapterTitleMatch[0].length);
            }
            if (sceneMatch) {
                 content = content.substring(content.indexOf(sceneMatch[0]) + sceneMatch[0].length);
            }
            
            chapters.push({ title, scene, content: content.trim() });
        }
        
        volumes.push({ title: volumeTitle, preamble: preamble, chapters });
    }

    return { volumes };
}

function renderOutlineDetailPanel(outlineText) {
    const editor = document.getElementById('outline-editor-area');
    if (editor) {
        editor.value = outlineText;
        const parsedData = parseDetailedOutline(outlineText);
        window.creationState = window.creationState || {}; // 防御式编程，确保对象存在
        window.creationState.structuredOutline = parsedData;
        renderVolumeList(parsedData);
    }
}

document.addEventListener('DOMContentLoaded', initializeOutlinePanel);