// 文件路径: js/modules/08_AI创作词典.js
// 描述: (V40.9.6 安全检查修正版) 增加了对DOM元素存在的检查，以适应动态变化的UI。

let lastPolishedProse = '';

function renderDictionaryPanel() {
    const panel = document.getElementById('dictionary-panel');
    if (!panel) return;
    
    // 内容保持不变，因为HTML结构是在 index.html 中定义的。
    // 我们只需要确保事件监听器的绑定是安全的。

    updateDictionaryPanelState(); // 初始化状态

    // ✨ 博士，这里的代码已升级！
    // 在绑定事件前，我们先检查按钮是否存在，防止因找不到按钮而报错。
    const prelimBtn = document.getElementById('start-preliminary-polish-btn');
    if (prelimBtn) {
        prelimBtn.addEventListener('click', () => handlePolishingStep('preliminary'));
    }

    const suggestBtn = document.getElementById('get-polish-suggestions-btn');
    if (suggestBtn) {
        suggestBtn.addEventListener('click', () => handlePolishingStep('suggestions'));
    }

    const refineBtn = document.getElementById('start-full-refinement-btn');
    if (refineBtn) {
        refineBtn.addEventListener('click', () => handlePolishingStep('refinement'));
    }
    
    const tomatoBtn = document.getElementById('start-tomato-format-btn');
    if (tomatoBtn) {
        tomatoBtn.addEventListener('click', () => handlePolishingStep('tomato'));
    }

    const proseTabBtn = document.querySelector('.workspace-tab[data-target="prose-view"]');
    if (proseTabBtn) {
        proseTabBtn.addEventListener('click', () => switchWorkspaceTab('prose-view'));
    }
    
    const suggestionsTabBtn = document.querySelector('.workspace-tab[data-target="suggestions-view"]');
    if (suggestionsTabBtn) {
        suggestionsTabBtn.addEventListener('click', () => switchWorkspaceTab('suggestions-view'));
    }

    const exportButtons = document.querySelectorAll('#final-export-buttons .settings-btn');
    exportButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const format = e.currentTarget.dataset.format;
            handleFinalExport(format);
        });
    });
}


function updateDictionaryPanelState() {
    const proseTextarea = document.getElementById('polished-prose-output');
    const hasContent = (creationState.finalProse && creationState.finalProse.trim() !== '') || (proseTextarea && proseTextarea.value.trim() !== '');

    if (proseTextarea && creationState.finalProse) {
        proseTextarea.value = creationState.finalProse;
    }

    // 安全地禁用或启用按钮
    const prelimBtn = document.getElementById('start-preliminary-polish-btn');
    if (prelimBtn) prelimBtn.disabled = !hasContent;

    const suggestBtn = document.getElementById('get-polish-suggestions-btn');
    if (suggestBtn) suggestBtn.disabled = !hasContent;
    
    const refineBtn = document.getElementById('start-full-refinement-btn');
    if (refineBtn) refineBtn.disabled = !hasContent;

    const tomatoBtn = document.getElementById('start-tomato-format-btn');
    if (tomatoBtn) tomatoBtn.disabled = !hasContent;
}

function switchWorkspaceTab(targetView) {
    document.querySelectorAll('.workspace-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`.workspace-tab[data-target="${targetView}"]`).classList.add('active');

    document.querySelectorAll('.workspace-content').forEach(content => content.classList.remove('active'));
    document.getElementById(targetView).classList.add('active');
}

async function handlePolishingStep(step) {
    const proseTextarea = document.getElementById('polished-prose-output');
    const suggestionsPanel = document.getElementById('suggestions-view');
    let currentProse = proseTextarea.value;

    if (!currentProse || currentProse.trim() === '') {
        showNotification("工作区没有需要处理的内容。", "warning");
        return;
    }

    showNotification(`正在执行: ${step}...`, 'info');

    try {
        let result = '';
        let prompt = '';
        switch (step) {
            case 'preliminary':
                prompt = `你是一名专业的网络小说编辑，请对以下文稿进行初步排版，主要目标是：1. 修正明显的标点符号错误。2. 将过长的段落打散，优化成更适合手机屏幕阅读的短段落。3. 消除段首的空格。请直接返回排版后的正文。\n\n---\n\n${currentProse}`;
                result = await callApi(prompt, true);
                proseTextarea.value = result;
                showNotification("初步排版完成！", "success");
                break;
            case 'suggestions':
                prompt = `作为一名资深的网络小说责编，请通读以下文稿，并从宏观角度提供一份专业的修改建议报告。报告应包括但不限于：情节节奏、人物弧光、爽点设置、冲突强度、对话质量等方面。请以结构化的、清晰的Markdown格式呈现你的建议。\n\n---\n\n${currentProse}`;
                result = await callApi(prompt, true);
                suggestionsPanel.innerHTML = markdownToHtml(result);
                switchWorkspaceTab('suggestions-view');
                showNotification("编辑建议已生成！", "success");
                break;
            case 'refinement':
                prompt = `你是一位顶级网络小说作家，擅长精修文稿。请结合以下【编辑建议】和内置的写作方法论，对【原始稿件】进行一次性深度润色。润色目标是：提升文笔质感、强化情感表达、优化叙事节奏，同时保持原有情节不变。请直接返回精修后的全文。\n\n【编辑建议】:\n${creationState.polishSuggestions || '无'}\n\n【原始稿件】:\n${currentProse}`;
                result = await callApi(prompt, true);
                proseTextarea.value = result;
                showNotification("全文精修完成！", "success");
                break;
            case 'tomato':
                prompt = `你是一个“番茄小说”爆款生成器。请根据以下【小说正文】，为其生成一套完整的“番茄化”包装，包括：\n1.  **3个吸引人的小说标题** (每个标题都要有爆款潜力)\n2.  **1段勾人的小说简介** (约100-150字)\n3.  **5个精准的标签** (例如：#重生 #复仇 #系统 #女强 #甜宠)\n\n请严格按照以下JSON格式返回，不要有任何多余的文字：\n{\n  "titles": ["标题1", "标题2", "标题3"],\n  "summary": "这是简介...",\n  "tags": ["标签1", "标签2", "标签3", "标签4", "标签5"]\n}\n\n【小说正文】:\n${currentProse.substring(0, 2000)}...`;
                const tomatoResultJson = await callApi(prompt, false);
                const tomatoData = JSON.parse(tomatoResultJson);
                const formattedTomato = `【推荐标题】\n1. ${tomatoData.titles[0]}\n2. ${tomatoData.titles[1]}\n3. ${tomatoData.titles[2]}\n\n【小说简介】\n${tomatoData.summary}\n\n【推荐标签】\n${tomatoData.tags.join(' ')}\n\n---\n\n${currentProse}`;
                proseTextarea.value = formattedTomato;
                showNotification("一键番茄化完成！", "success");
                break;
        }
    } catch (error) {
        showNotification(`操作失败: ${error.message}`, 'error');
    }
}

function handleFinalExport(format) {
    const prose = document.getElementById('polished-prose-output').value;
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

// 辅助函数，将Markdown转为HTML（需要一个简单的解析器，或者使用库）
function markdownToHtml(text) {
    // 这是一个非常简化的版本
    text = text.replace(/# (.*)/g, '<h1>$1</h1>');
    text = text.replace(/## (.*)/g, '<h2>$1</h2>');
    text = text.replace(/### (.*)/g, '<h3>$1</h3>');
    text = text.replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\n/g, '<br>');
    return text;
}