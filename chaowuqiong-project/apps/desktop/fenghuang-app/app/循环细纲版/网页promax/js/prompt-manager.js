// 文件路径: js/prompt-manager.js
// 描述: 最终修复版。完全采用 localStorage 和内存数组的逻辑，以确保在 file:/// 协议下的稳定性和简单性。

let customPrompts = [];
let promptMap = {}; // 用于性能优化

/**
 * 从 localStorage 加载用户自定义提示词。
 * 如果 localStorage 为空，则回退到 js/data/prompts.js 中定义的默认提示词。
 */
async function loadPrompts() {
    try {
        let savedPrompts = await appDB.getPrompts();
        if (savedPrompts && savedPrompts.length > 0) {
            customPrompts = savedPrompts;
        } else {
            // 关键：如果数据库没有，就使用文件中的默认提示词，并存入数据库。
            if (typeof filePrompts !== 'undefined') {
                console.log("从文件加载默认提示词并存入数据库...");
                customPrompts = [...filePrompts];
                await appDB.savePrompts(customPrompts); // 存入数据库
            } else {
                customPrompts = [];
                console.error("默认提示词 (filePrompts) 未加载。");
                showNotification("未能加载默认提示词！", "error");
            }
        }
        updatePromptMap();
        renderPromptList();
    } catch (error) {
        console.error("从数据库加载提示词失败:", error);
        showNotification("加载提示词库失败！请检查浏览器权限。", "error");
        // 即使失败，也尝试从默认文件加载
        if (typeof filePrompts !== 'undefined') {
            customPrompts = [...filePrompts];
        } else {
            customPrompts = [];
        }
        updatePromptMap();
    }
}

/**
 * 将当前的提示词列表（包含用户修改）保存到 localStorage。
 */
async function savePrompts() {
    try {
        await appDB.savePrompts(customPrompts);
    } catch (error) {
        console.error("保存提示词到数据库失败:", error);
        showNotification("保存提示词失败，数据库异常。", "error");
    }
}

/**
 * 更新 promptMap 以便快速查找。
 */
function updatePromptMap() {
    promptMap = customPrompts.reduce((map, p) => {
        map[p.title] = p.prompt;
        return map;
    }, {});
}

/**
 * 渲染提示词列表到弹窗。
 */
function renderPromptList() {
    const listContainer = document.getElementById('prompt-list-container');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    if (customPrompts.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: var(--secondary-text);">你的武器库还是空的，快添加一个吧！</p>';
    } else {
        customPrompts.forEach((p, index) => {
            const promptItem = document.createElement('div');
            promptItem.className = 'prompt-item';
            
            promptItem.innerHTML = `
                <div class="prompt-item-title">${p.title}</div>
                <div class="prompt-item-actions">
                    <button class="prompt-btn use-btn" data-index="${index}" title="使用此提示词"><i class="fas fa-check"></i></button>
                    <button class="prompt-btn edit-btn" data-index="${index}" title="编辑"><i class="fas fa-pen"></i></button>
                    <button class="prompt-btn delete-btn" data-index="${index}" title="删除"><i class="fas fa-trash"></i></button>
                </div>
            `;
            listContainer.appendChild(promptItem);
        });
    }
}

/**
 * 处理保存新增或编辑的提示词。
 */
async function handleSavePrompt() {
    const titleInput = document.getElementById('prompt-title-input');
    const contentInput = document.getElementById('prompt-content-input');
    const index = document.getElementById('prompt-edit-index').value;

    const title = titleInput.value.trim();
    const prompt = contentInput.value.trim();

    if (!title || !prompt) {
        showNotification('标题和内容都不能为空！', 'error');
        return;
    }

    if (index === '' || index === '-1') { // 新增
        if (customPrompts.some(p => p.title === title)) {
            showNotification('已存在同名提示词，请使用其他标题。', 'error');
            return;
        }
        customPrompts.unshift({ title, prompt });
    } else { // 编辑
        const originalTitle = customPrompts[parseInt(index)].title;
        // 检查新标题是否与除了自己以外的其他提示词冲突
        if (title !== originalTitle && customPrompts.some((p, i) => p.title === title && i !== parseInt(index))) {
            showNotification('已存在同名提示词，请使用其他标题。', 'error');
            return;
        }
        customPrompts[parseInt(index)] = { title, prompt };
    }

    await savePrompts();
    updatePromptMap(); // 保存后更新 map
    renderPromptList(); // 保存后立即重新渲染
    closePromptEditor();
    showNotification(`提示词 "${title}" 已保存！`, 'success');
}

/**
 * 打开提示词编辑器弹窗。
 */
function openPromptEditor(index = -1) {
    const titleInput = document.getElementById('prompt-title-input');
    const contentInput = document.getElementById('prompt-content-input');
    const editIndexInput = document.getElementById('prompt-edit-index');

    if (index > -1 && customPrompts[index]) { // 编辑模式
        const promptToEdit = customPrompts[index];
        document.getElementById('prompt-editor-title').textContent = '编辑提示词';
        titleInput.value = promptToEdit.title;
        contentInput.value = promptToEdit.prompt;
        editIndexInput.value = index;
    } else { // 新增模式
        document.getElementById('prompt-editor-title').textContent = '新增提示词';
        titleInput.value = '';
        contentInput.value = '';
        editIndexInput.value = '-1';
    }

    document.getElementById('prompt-editor-modal').classList.add('visible');
    titleInput.focus();
}

/**
 * 关闭提示词编辑器弹窗。
 */
function closePromptEditor() {
    document.getElementById('prompt-editor-modal').classList.remove('visible');
}

/**
 * 删除一个自定义提示词。
 */
async function handleDeletePrompt(index) {
    const promptToDelete = customPrompts[index];
    if (confirm(`确定要删除提示词“${promptToDelete.title}”吗？`)) {
        customPrompts.splice(index, 1);
        await savePrompts();
        updatePromptMap();
        renderPromptList(); // 删除后立即重新渲染
        showNotification('提示词已删除。', 'success');
    }
}

/**
 * 使用一个提示词。
 */
function usePrompt(index) {
    const messageInput = document.getElementById('message-input');
    if (!customPrompts[index]) return;
    let promptContent = customPrompts[index].prompt;
    
    messageInput.value = promptContent;
    messageInput.focus();
    messageInput.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('prompt-manager-modal').classList.remove('visible');
    showNotification(`已选用提示词：“${customPrompts[index].title}”`, 'info');
}

/**
 * 导出所有提示词到一个 JSON 文件。
 */
function exportPrompts() {
    if (customPrompts.length === 0) {
        showNotification('没有提示词可导出。', 'info');
        return;
    }
    const dataStr = JSON.stringify(customPrompts, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `墨竹提示词库备份_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('提示词已成功导出！', 'success');
}

/**
 * 从一个 JSON 文件导入提示词。
 */
function importPrompts() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (readerEvent) => {
            try {
                const content = readerEvent.target.result;
                const imported = JSON.parse(content);
                
                if (Array.isArray(imported) && imported.every(p => p.title && p.prompt)) {
                    if (confirm(`即将导入 ${imported.length} 个提示词。这将覆盖您当前的词库，确定吗？`)) {
                        customPrompts = imported;
                        await savePrompts();
                        updatePromptMap();
                        renderPromptList(); // 导入后立即重新渲染
                        showNotification('提示词库已成功导入！', 'success');
                    }
                } else {
                    showNotification('导入失败：文件格式不正确。', 'error');
                }
            } catch (error) {
                showNotification(`导入失败：${error.message}`, 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

/**
 * 初始化提示词管理器的所有事件监听器。
 */
function initializePromptManager() {
    const managerModal = document.getElementById('prompt-manager-modal');
    const editorModal = document.getElementById('prompt-editor-modal');

    if (!managerModal || !editorModal) return;

    document.getElementById('prompt-manager-btn').addEventListener('click', async () => {
        await loadPrompts(); // 异步调用
        managerModal.classList.add('visible');
    });
    document.getElementById('close-manager-btn').addEventListener('click', () => managerModal.classList.remove('visible'));
    managerModal.addEventListener('click', e => { if(e.target === managerModal) managerModal.classList.remove('visible'); });

    document.getElementById('prompt-list-container').addEventListener('click', e => {
        const target = e.target.closest('.prompt-btn');
        if (!target) return;
        const index = parseInt(target.dataset.index);
        if (target.classList.contains('use-btn')) usePrompt(index);
        if (target.classList.contains('edit-btn')) openPromptEditor(index);
        if (target.classList.contains('delete-btn')) handleDeletePrompt(index);
    });

    document.getElementById('add-new-prompt-btn').addEventListener('click', () => openPromptEditor(-1));
    document.getElementById('import-prompts-btn').addEventListener('click', importPrompts);
    document.getElementById('export-prompts-btn').addEventListener('click', exportPrompts);

    document.getElementById('close-editor-btn').addEventListener('click', closePromptEditor);
    editorModal.addEventListener('click', e => { if(e.target === editorModal) closePromptEditor(); });
    document.getElementById('save-prompt-btn').addEventListener('click', handleSavePrompt);
}