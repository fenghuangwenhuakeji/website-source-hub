// 文件路径: js/modules/project_manager.js
// 描述: (V62.0 DB版) 重构为使用IndexedDB，实现项目管理的持久化存储。

function initializeProjectManager() {
    const modal = document.getElementById('project-manager-modal');
    const openBtn = document.getElementById('project-manager-btn');
    const closeBtn = modal.querySelector('.close-btn');

    openBtn.addEventListener('click', async () => { 
        await renderProjectList(); 
        modal.classList.remove('hidden'); 
    });
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

    document.getElementById('save-current-project-btn').addEventListener('click', handleSaveCurrentProject);
    document.getElementById('save-as-new-project-btn').addEventListener('click', () => handleSaveNewProject());
    
    // Attach event listeners to the project list container once
    const container = document.getElementById('project-list-container');
    if (container && !container.dataset.listenerAttached) {
        container.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;
            
            const id = button.dataset.id;
            if (button.classList.contains('load-btn')) handleLoadProject(id);
            if (button.classList.contains('export-btn')) handleExportProject(id);
            if (button.classList.contains('rename-btn')) handleRenameProject(id);
            if (button.classList.contains('delete-btn')) handleDeleteProject(id);
        });
        container.dataset.listenerAttached = 'true';
    }
}

async function renderProjectList() {
    const container = document.getElementById('project-list-container');
    if (!container) return;
    
    try {
        const projects = await window.shortStoryDB.getAllProjects();
        projectLibrary = projects || []; // Update global state

        if (projectLibrary.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">还没有任何项目，快开始创作吧！</p>';
            return;
        }

        projectLibrary.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

        container.innerHTML = projectLibrary.map(project => `
            <div class="project-item ${project.id === currentProjectId ? 'active' : ''}">
                <div class="project-info">
                    <h4>${project.title}</h4>
                    <small>最后修改: ${new Date(project.lastModified).toLocaleString()}</small>
                </div>
                <div class="project-actions">
                    <button class="action-btn load-btn" data-id="${project.id}" title="加载项目"><i class="fas fa-folder-open"></i></button>
                    <button class="settings-btn export-btn" data-id="${project.id}" title="导出"><i class="fas fa-download"></i></button>
                    <button class="settings-btn rename-btn" data-id="${project.id}" title="重命名"><i class="fas fa-edit"></i></button>
                    <button class="settings-btn delete-btn" data-id="${project.id}" title="删除"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error("渲染项目列表失败:", error);
        container.innerHTML = '<p style="text-align: center; color: var(--error-color);">加载项目列表失败。</p>';
    }
}

async function handleSaveCurrentProject() {
    if (!creationState.inspirationConcept) {
        showNotification("当前没有可保存的内容。", "error");
        return;
    }
    if (currentProjectId) {
        const project = projectLibrary.find(p => p.id === currentProjectId);
        if (project) {
            Object.assign(project, JSON.parse(JSON.stringify(creationState)));
            project.title = creationState.novelTitle || project.title;
            project.lastModified = Date.now();
            await window.shortStoryDB.saveProject(project);
            await renderProjectList();
            showNotification(`项目 "${project.title}" 已更新。`, "success");
        }
    } else {
        await handleSaveNewProject(creationState.novelTitle);
    }
}

async function handleSaveNewProject(titleToSave) {
    if (!creationState.inspirationConcept) {
        showNotification("没有可保存的灵感内容。", "error");
        return;
    }
    const title = titleToSave || prompt("请输入新项目的名称:", creationState.novelTitle || "未命名项目");
    if (!title || !title.trim()) return;

    const newProject = {
        id: `proj_${Date.now()}`,
        title: title.trim(),
        lastModified: Date.now(),
        ...JSON.parse(JSON.stringify(creationState))
    };
    
    await window.shortStoryDB.saveProject(newProject);
    projectLibrary.push(newProject); // Update local cache
    currentProjectId = newProject.id;
    
    showNotification(`新项目 "${title}" 已创建。`, "success");
    await renderProjectList();
}

async function handleLoadProject(projectId) {
    const project = await window.shortStoryDB.getProject(projectId);
    if (!project) {
        showNotification("加载失败，找不到该项目。", "error");
        return;
    }
    currentProjectId = projectId;
    
    // Deep copy to avoid mutation issues
    creationState = JSON.parse(JSON.stringify(project));
    
    renderAllPanels(); 
    switchTab('inspiration-panel'); 
    
    document.getElementById('inspiration-text').value = creationState.rawInspiration || '';
    document.getElementById('inspiration-output-container').textContent = creationState.inspirationConcept || '';
    document.getElementById('confirm-inspiration-btn').disabled = !creationState.inspirationConcept;

    document.getElementById('project-manager-modal').classList.add('hidden');
    showNotification(`项目 "${project.title}" 已加载。`, "success");
    await renderProjectList(); // Re-render to update active state
}

async function handleDeleteProject(projectId) {
    const project = projectLibrary.find(p => p.id === projectId);
    if (!project) return;

    if (confirm(`确定要永久删除项目 "${project.title}" 吗？此操作无法撤销。`)) {
        await window.shortStoryDB.deleteProject(projectId);
        if (currentProjectId === projectId) {
            currentProjectId = null;
            resetCreationState(false); 
        }
        await loadProjectsFromStorage(); // Reload from DB
        showNotification(`项目 "${project.title}" 已删除。`, "success");
    }
}

async function handleRenameProject(projectId) {
    const project = await window.shortStoryDB.getProject(projectId);
    if (!project) return;
    const newTitle = prompt("请输入新的项目名称：", project.title);
    if (!newTitle || !newTitle.trim() || newTitle.trim() === project.title) return;
    
    project.title = newTitle.trim();
    project.lastModified = Date.now();
    await window.shortStoryDB.saveProject(project);
    await renderProjectList();
    showNotification("项目已重命名。", "success");
}

async function handleExportProject(projectId) {
    const project = await window.shortStoryDB.getProject(projectId);
    if (!project) return;
    
    let content = `项目标题: ${project.title}\n`;
    content += `========================================\n\n`;
    if (project.inspirationConcept) {
        content += "## 故事蓝图\n\n" + project.inspirationConcept + "\n\n";
    }
    if (project.finalProse) {
        content += "\n========================================\n## 最终稿件\n\n" + project.finalProse;
    }
    
    downloadFile(content, project.title, 'txt');
}

async function loadProjectsFromStorage() {
    if (currentUser) {
        projectLibrary = await window.shortStoryDB.getAllProjects() || [];
        await renderProjectList();
    } else {
        projectLibrary = [];
        await renderProjectList();
    }
}