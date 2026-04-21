// 文件路径: js/components/prompt-manager.js
// 描述: 提示词武器库弹窗模块

import { showNotification } from '../ui/notifications.js';

// We will assume DEFAULT_PROMPTS is available globally from prompts.js
// A better approach in the future would be to also make prompts.js a module.
let customPrompts = [];

function loadPrompts() {
    const savedPrompts = localStorage.getItem('custom_prompts');
    if (savedPrompts) {
        customPrompts = JSON.parse(savedPrompts);
    } else {
        // Ensure DEFAULT_PROMPTS is loaded
        if (typeof DEFAULT_PROMPTS !== 'undefined') {
            customPrompts = [...DEFAULT_PROMPTS];
        }
    }
    renderPromptList();
}

function savePrompts() {
    localStorage.setItem('custom_prompts', JSON.stringify(customPrompts));
    renderPromptList();
}

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

function handleSavePrompt() {
    const titleInput = document.getElementById('prompt-title-input');
    const contentInput = document.getElementById('prompt-content-input');
    const index = document.getElementById('prompt-edit-index').value;

    const title = titleInput.value.trim();
    const prompt = contentInput.value.trim();

    if (!title || !prompt) {
        showNotification('标题和内容都不能为空！', 'error');
        return;
    }

    if (index === '-1') { // 新增
        customPrompts.unshift({ title, prompt });
    } else { // 编辑
        customPrompts[parseInt(index)] = { title, prompt };
    }

    savePrompts();
    closePromptEditor();
}

function openPromptEditor(index = -1) {
    const titleInput = document.getElementById('prompt-title-input');
    const contentInput = document.getElementById('prompt-content-input');
    document.getElementById('prompt-edit-index').value = index;

    if (index > -1) {
        document.getElementById('prompt-editor-title').textContent = '编辑提示词';
        titleInput.value = customPrompts[index].title;
        contentInput.value = customPrompts[index].prompt;
    } else {
        document.getElementById('prompt-editor-title').textContent = '新增提示词';
        titleInput.value = '';
        contentInput.value = '';
    }

    document.getElementById('prompt-editor-modal').classList.add('visible');
    titleInput.focus();
}

function closePromptEditor() {
    document.getElementById('prompt-editor-modal').classList.remove('visible');
}

function handleDeletePrompt(index) {
    if (confirm(`确定要删除提示词“${customPrompts[index].title}”吗？`)) {
        customPrompts.splice(index, 1);
        savePrompts();
    }
}

function usePrompt(index) {
    const messageInput = document.getElementById('message-input');
    messageInput.value = customPrompts[index].prompt;
    messageInput.focus();
    messageInput.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('prompt-manager-modal').classList.remove('visible');
    showNotification(`已选用提示词：“${customPrompts[index].title}”`, 'info');
}

export function initializePromptManager() {
    const managerModal = document.getElementById('prompt-manager-modal');
    const editorModal = document.getElementById('prompt-editor-modal');

    if (!managerModal || !editorModal) return;

    document.getElementById('prompt-manager-btn').addEventListener('click', () => {
        loadPrompts();
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

    document.getElementById('close-editor-btn').addEventListener('click', closePromptEditor);
    editorModal.addEventListener('click', e => { if(e.target === editorModal) closePromptEditor(); });
    document.getElementById('save-prompt-btn').addEventListener('click', handleSavePrompt);
    
    // Initial load
    loadPrompts();
}