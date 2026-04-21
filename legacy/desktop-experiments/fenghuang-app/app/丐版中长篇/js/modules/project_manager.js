// 文件路径: js/modules/project_manager.js
// 描述: (V55.0 博士·圆梦·最终勘定版)
// 1. 重构 handleLoadProject 函数，确保加载项目后能完美恢复写作状态。
// 2. 移除所有自动保存行为，让用户完全手动控制。

function initializeProjectManager() {
    const modal = document.getElementById('project-manager-modal');
    const openBtn = document.getElementById('project-manager-btn');
    const closeBtn = modal.querySelector('.close-btn');

    openBtn.addEventListener('click', () => { 
        renderProjectList(); 
        modal.classList.remove('hidden'); 
    });
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

    document.getElementById('save-current-project-btn').addEventListener('click', handleSaveCurrentProject);
    document.getElementById('save-as-new-project-btn').addEventListener('click', () => handleSaveNewProject());
}

function renderProjectList() {
    const container = document.getElementById('project-list-container');
    if (!container) return;
    container.innerHTML = '';

    if (projectLibrary.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">还没有任何项目，快开始创作吧！</p>';
        return;
    }

    projectLibrary.sort((a, b) => b.lastModified - a.lastModified);

    projectLibrary.forEach(project => {
        const el = document.createElement('div');
        el.className = 'project-item';
        
        if (project.isMilestone) {
            el.classList.add('milestone-backup');
        }
        if (project.id === currentProjectId && !project.isMilestone) {
            el.classList.add('active');
        }

        const titleDisplay = project.isMilestone 
            ? `<i class="fas fa-archive"></i> [备份] ${project.title}`
            : project.title;

        el.innerHTML = `
            <div class="project-info">
                <h4>${titleDisplay}</h4>
                <small>${project.milestoneDescription || `最后修改: ${new Date(project.lastModified).toLocaleString()}`}</small>
            </div>
            <div class="project-actions">
                <button class="action-btn load-btn" data-id="${project.id}" title="加载项目"><i class="fas fa-folder-open"></i></button>
                <button class="settings-btn export-btn" data-id="${project.id}" title="导出"><i class="fas fa-download"></i></button>
                <button class="settings-btn rename-btn" data-id="${project.id}" title="重命名"><i class="fas fa-edit"></i></button>
                <button class="settings-btn delete-btn" data-id="${project.id}" title="删除"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        container.appendChild(el);
    });

    container.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        
        const id = button.dataset.id;
        if (button.classList.contains('load-btn')) handleLoadProject(id);
        if (button.classList.contains('export-btn')) handleExportProject(id);
        if (button.classList.contains('rename-btn')) handleRenameProject(id);
        if (button.classList.contains('delete-btn')) handleDeleteProject(id);
    });
}

function handleSaveCurrentProject() {
    if (typeof saveCurrentChanges === 'function') {
        saveCurrentChanges();
    }

    if (!creationState.inspirationConcept) {
        showNotification("当前没有可保存的内容。", "error");
        return;
    }
    
    if (currentProjectId) {
        const existingProject = projectLibrary.find(p => p.id === currentProjectId && !p.isMilestone);
        if (existingProject) {
            if (confirm(`项目 "${existingProject.title}" 已存在。\n\n- 点击“确定”覆盖保存。\n- 点击“取消”将另存为新项目。`)) {
                Object.assign(existingProject, JSON.parse(JSON.stringify(creationState)));
                existingProject.title = creationState.novelTitle || existingProject.title;
                existingProject.lastModified = Date.now();
                delete existingProject.isMilestone;
                delete existingProject.milestoneDescription;
                saveProjectsToStorage();
                renderProjectList();
                showNotification(`项目 "${existingProject.title}" 已成功覆盖保存。`, "success");
            } else {
                handleSaveNewProject();
            }
            return;
        }
    }
    
    handleSaveNewProject(creationState.novelTitle);
}

function handleSaveNewProject(titleToSave) {
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
    
    projectLibrary.push(newProject);
    currentProjectId = newProject.id;
    creationState.projectId = newProject.id; 
    
    showNotification(`新项目 "${title}" 已创建并保存。`, "success");
    
    saveProjectsToStorage();
    renderProjectList();
}

function handleLoadProject(projectId) {
    const project = projectLibrary.find(p => p.id === projectId);
    if (!project) {
        showNotification("加载失败，找不到该项目。", "error");
        return;
    }
    
    if(!confirm(`确定要加载项目“${project.title}”吗？\n当前未保存的进度将会丢失。`)) return;

    creationState = JSON.parse(JSON.stringify(project));
    currentProjectId = project.id; 

    renderAllPanels();
    
    if (creationState.generalOutline) {
        switchTab('writing-panel');
        updateCurrentChapter(creationState.currentChapterIndex === undefined ? 0 : creationState.currentChapterIndex);
    } else {
        switchTab('inspiration-panel');
    }

    document.getElementById('project-manager-modal').classList.add('hidden');
    showNotification(`项目 "${project.title}" 已加载。`, "success");
}


function handleDeleteProject(projectId) {
    const projectIndex = projectLibrary.findIndex(p => p.id === projectId);
    if (projectIndex === -1) return;
    const projectTitle = projectLibrary[projectIndex].title;
    if (confirm(`确定要永久删除项目 "${projectTitle}" 吗？此操作无法撤销。`)) {
        projectLibrary.splice(projectIndex, 1);
        if (currentProjectId === projectId) {
            currentProjectId = null;
            resetCreationState(false);
            renderAllPanels();
        }
        saveProjectsToStorage();
        renderProjectList();
        showNotification(`项目 "${projectTitle}" 已删除。`, "success");
    }
}

function handleRenameProject(projectId) {
    const project = projectLibrary.find(p => p.id === projectId);
    if (!project) return;
    const newTitle = prompt("请输入新的项目名称：", project.title);
    if (!newTitle || newTitle.trim() === '' || newTitle.trim() === project.title) return;
    
    project.title = newTitle.trim();
    if (project.id === currentProjectId) {
        creationState.novelTitle = project.title;
        creationState.title = project.title;
    }
    project.lastModified = Date.now();
    saveProjectsToStorage();
    renderProjectList();
    showNotification("项目已重命名。", "success");
}

function handleExportProject(projectId) {
    const project = projectLibrary.find(p => p.id === projectId);
    if (!project) return;
    
    // 复用写作面板的导出函数，确保格式统一
    const content = formatTextForExport(
        project.storyChapters || [],
        project.inspirationConcept || '',
        project.title || '未命名作品',
        project.generalOutline || '',
        project.detailedOutlines || []
    );
    
    downloadFile(content, project.title, 'txt');
}

function saveProjectsToStorage() {
    if (currentUser) {
        try {
            const validProjects = projectLibrary.filter(p => p && p.id && p.title);
            localStorage.setItem(`${currentUser}_projectLibrary_v1`, JSON.stringify(validProjects));
        } catch (e) {
            console.error("保存项目库失败:", e);
            showNotification("保存失败，本地存储可能已满。", "error");
        }
    }
}

function loadProjectsFromStorage() {
    if (currentUser) {
        const savedData = localStorage.getItem(`${currentUser}_projectLibrary_v1`);
        projectLibrary = savedData ? JSON.parse(savedData) : [];
    } else {
        projectLibrary = [];
    }
}