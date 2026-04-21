// 文件路径: 网页promax/js/components/project-manager.js
// 描述: 负责项目的增删改查功能。

/**
 * 初始化项目管理器，为侧边栏的按钮绑定事件监听。
 */
function initializeProjectManager() {
    const projectList = document.getElementById('projectList');
    if (projectList) {
        projectList.addEventListener('click', e => {
           const projectItem = e.target.closest('.project-item');
           if (!projectItem) return;

           const button = e.target.closest('button');
           if (button) {
               const projectId = button.dataset.id;
               if (button.classList.contains('load-project-action')) {
                   loadProject(projectId);
               } else if (button.classList.contains('delete-project-action')) {
                   deleteProject(projectId);
               }
           } else {
               // Click on the item itself to select/deselect
               projectItem.classList.toggle('selected');
           }
        });
    }

    const saveProjectBtn = document.createElement('button');
    saveProjectBtn.textContent = '保存当前对话为项目';
    saveProjectBtn.className = 'tool-btn';
    saveProjectBtn.style.width = '100%';
    saveProjectBtn.style.marginTop = '15px';
    saveProjectBtn.addEventListener('click', () => {
        const name = prompt("请输入项目名称：", `对话 ${new Date().toLocaleString()}`);
        if (name) {
            const tags = prompt("请输入项目标签（用逗号分隔）：", "");
            saveCurrentProject(name, "", tags);
        }
    });
    
    const projectPanel = document.querySelector('.project-panel');
    if(projectPanel) {
        projectPanel.appendChild(saveProjectBtn);
    }

    const searchInput = document.getElementById('projectSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', renderProjectList);
    }
    
    renderProjectList();

    const clearAllBtn = document.getElementById('clear-all-projects-btn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (confirm('您确定要永久删除所有项目吗？此操作不可撤销！')) {
                clearAllProjects();
            }
        });
    }
}

/**
 * 保存当前聊天记录为一个新项目。
 * @param {string} name - 项目名称。
 * @param {string} description - 项目描述。
 * @param {string} tags - 项目标签 (逗号分隔)。
 * @param {Array|null} messagesToSave - 如果提供，则保存此消息数组，否则从UI获取。
 */
async function saveCurrentProject(name, description, tags, messagesToSave = null) {
    const chatHistory = document.getElementById('chat-history');
    const messages = messagesToSave || Array.from(chatHistory.querySelectorAll('.message')).map(msgEl => {
        const sender = msgEl.classList.contains('user') ? 'user' : 'gemini';
        const content = msgEl.querySelector('.content').innerHTML;
        const thinking = msgEl.querySelector('.thinking-process')?.innerHTML || null;
        return { sender, content, thinking };
    });

    const project = {
        id: `project_${Date.now()}`,
        name,
        description,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
        messages,
        createdAt: new Date().toISOString()
    };

    try {
        await appDB.saveProject(project);
        showNotification(`项目 "${name}" 已保存！`, 'success');
        await renderProjectList();
    } catch (error) {
        console.error('保存项目失败:', error);
        showNotification('保存项目失败。', 'error');
    }
}

/**
 * 从数据库加载一个项目到聊天窗口。
 * @param {string} projectId - 要加载的项目的ID。
 */
async function loadProject(projectId) {
    try {
        const project = await appDB.getProject(projectId);

        if (project) {
            const chatHistory = document.getElementById('chat-history');
            chatHistory.innerHTML = '';
            project.messages.forEach(msg => {
                addMessageToHistory(msg.sender, msg.content, msg.thinking, true);
            });
            chatHistory.scrollTop = chatHistory.scrollHeight;
            showNotification(`已加载项目 "${project.name}"`, 'info');
        } else {
            showNotification('找不到指定的项目！', 'error');
        }
    } catch (error) {
        console.error('加载项目失败:', error);
        showNotification('加载项目失败。', 'error');
    }
}

/**
 * 从数据库删除一个项目。
 * @param {string} projectId - 要删除的项目的ID。
 */
async function deleteProject(projectId) {
    if (confirm('确定要删除这个项目吗？此操作不可撤销。')) {
        try {
            await appDB.deleteProject(projectId);
            await renderProjectList();
            showNotification('项目已删除。', 'info');
        } catch (error) {
            console.error('删除项目失败:', error);
            showNotification('删除项目失败。', 'error');
        }
    }
}

/**
 * 从数据库获取所有项目并渲染到侧边栏的项目列表中。
 */
async function renderProjectList() {
    const container = document.getElementById('projectList');
    if (!container) return;
    
    const searchInput = document.getElementById('projectSearchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    try {
        let projects = await appDB.getAllProjects();
        projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (searchTerm) {
            projects = projects.filter(p =>
                p.name.toLowerCase().includes(searchTerm) ||
                (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
            );
        }
        
        if (projects.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: var(--secondary-text-color);">${searchTerm ? '未找到匹配的项目。' : '还没有保存任何项目。'}</p>`;
            return;
        }

        container.innerHTML = projects.map(p => {
            const tagsHtml = p.tags && p.tags.length > 0
                ? `<div class="project-tags">${p.tags.map(tag => `<span>${tag}</span>`).join('')}</div>`
                : '';
            return `
            <div class="project-item" data-id="${p.id}">
                <div class="project-info">
                    <strong>${p.name}</strong>
                    ${tagsHtml}
                    <small>${new Date(p.createdAt).toLocaleDateString()}</small>
                </div>
                <div class="project-actions">
                    <button class="action-btn load-project-action" data-id="${p.id}" title="加载项目"><i class="fas fa-upload"></i></button>
                    <button class="action-btn delete-project-action" data-id="${p.id}" title="删除项目" style="background: var(--error-color);"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `}).join('');
    } catch (error) {
        console.error('渲染项目列表失败:', error);
        container.innerHTML = '<p style="text-align: center; color: var(--error-color);">加载项目列表失败。</p>';
    }
}

/**
 * 清空所有项目。
 */
async function clearAllProjects() {
    try {
        await appDB.clearProjects();
        
        await renderProjectList();
        
        const chatHistory = document.getElementById('chat-history');
        chatHistory.innerHTML = '';
        addMessageToHistory('gemini', '所有项目已清空。准备好开始新的创作了吗？');

        showNotification('所有项目已成功清空！', 'success');
    } catch (error) {
        console.error('清空项目失败:', error);
        showNotification(`清空项目失败: ${error.message}`, 'error');
    }
}