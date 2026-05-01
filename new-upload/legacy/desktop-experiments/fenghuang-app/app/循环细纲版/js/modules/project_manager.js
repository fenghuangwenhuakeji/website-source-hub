// 文件路径: js/modules/project_manager.js
// 描述: (V70.0 博士·凤凰涅槃·重构版) - 完全重写，采用IndexedDB和自定义模态框，根除所有旧问题。

// --- 全局状态 ---
let projectToActOn = null; // 用于暂存需要操作的项目ID

// --- 初始化 ---
function initializeProjectManager() {
    setupProjectEventListeners();
}

// --- 事件监听器 ---
function setupProjectEventListeners() {
    const pmModal = document.getElementById('project-manager-modal');
    const saveAsModal = document.getElementById('save-as-new-project-modal');
    const renameModal = document.getElementById('rename-project-modal');
    const deleteModal = document.getElementById('delete-project-modal');
    const overwriteModal = document.getElementById('overwrite-project-modal');

    // 打开主面板
    document.getElementById('project-manager-btn').addEventListener('click', async () => {
        await renderProjectList();
        pmModal.classList.remove('hidden');
    });
    pmModal.querySelector('.close-btn').addEventListener('click', () => pmModal.classList.add('hidden'));

    // "保存当前工作" 按钮
    document.getElementById('save-current-project-btn').addEventListener('click', handleSaveCurrentProject);

    // "另存为新项目" 按钮 -> 打开另存为模态框
    document.getElementById('save-as-new-project-btn').addEventListener('click', () => {
        document.getElementById('new-project-name-input').value = creationState.novelTitle || `新项目 ${new Date().toLocaleDateString()}`;
        saveAsModal.classList.remove('hidden');
    });

    // 主面板中的列表项按钮 (事件委托)
    document.getElementById('project-list-container').addEventListener('click', async (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        
        const projectId = button.dataset.id;
        
        // 对于导出，我们不需要在 projectLibrary 中查找，直接从数据库获取最新数据
        if (button.classList.contains('export-btn')) {
            await handleExportProject(projectId);
            return;
        }

        projectToActOn = projectLibrary.find(p => p.id === projectId);
        if (!projectToActOn) return;

        if (button.classList.contains('load-btn')) await handleLoadProject(projectId);
        if (button.classList.contains('rename-btn')) openRenameModal(projectToActOn);
        if (button.classList.contains('delete-btn')) openDeleteModal(projectToActOn);
    });

    // --- 所有模态框的关闭和确认按钮 ---
    [saveAsModal, renameModal, deleteModal, overwriteModal].forEach(modal => {
        modal.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => modal.classList.add('hidden'));
        });
    });

    document.getElementById('confirm-save-as-new-btn').addEventListener('click', confirmSaveAsNewProject);
    document.getElementById('confirm-rename-btn').addEventListener('click', confirmRenameProject);
    document.getElementById('confirm-delete-btn').addEventListener('click', confirmDeleteProject);
    document.getElementById('confirm-overwrite-btn').addEventListener('click', confirmOverwriteProject);
}


// --- 核心功能函数 ---

async function renderProjectList() {
    try {
        projectLibrary = await appDB.getAllProjects();
    } catch (error) {
        console.error("从数据库加载项目列表失败:", error);
        showNotification("加载项目列表失败。", "error");
        projectLibrary = [];
    }

    const container = document.getElementById('project-list-container');
    container.innerHTML = '';

    if (projectLibrary.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">还没有任何项目。</p>';
        return;
    }

    projectLibrary.sort((a, b) => b.lastModified - a.lastModified);

    projectLibrary.forEach(project => {
        const el = document.createElement('div');
        el.className = 'project-item';
        if (project.id === currentProjectId) el.classList.add('active');
        el.innerHTML = `
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
        `;
        container.appendChild(el);
    });
}

async function handleSaveCurrentProject() {
    if (!creationState.inspirationConcept) {
        showNotification("当前没有可保存的内容。", "error");
        return;
    }
    
    // 如果当前工作区已经是一个已保存的项目
    if (currentProjectId) {
        const existingProject = projectLibrary.find(p => p.id === currentProjectId);
        if (existingProject) {
            projectToActOn = existingProject;
            document.getElementById('overwrite-project-name-display').textContent = existingProject.title;
            document.getElementById('overwrite-project-modal').classList.remove('hidden');
            return;
        }
    }
    
    // 如果是新工作区，则直接触发“另存为”
    document.getElementById('save-as-new-project-btn').click();
}

async function handleLoadProject(projectId) {
    try {
        const project = await appDB.getProject(projectId);
        if (!project) {
            showNotification("加载失败，找不到该项目。", "error");
            return;
        }

        creationState = project; // 直接赋值
        currentProjectId = project.id; 

        if (!creationState.writingPanelState) {
            creationState.writingPanelState = { outlineContent: '', proseContent: '' };
        }
        // 【最终修复】确保 cycleContent 对象始终存在，以实现向后兼容
        if (!creationState.cycleContent) {
            creationState.cycleContent = {};
        }
        // 【最终修复】确保 cycleContent 对象始终存在，以实现向后兼容
        if (!creationState.cycleContent) {
            creationState.cycleContent = {};
        }

        renderAllPanels();
        
        if (creationState.writingPanelState.outlineContent || creationState.writingPanelState.proseContent) {
            switchTab('writing-panel');
        } else {
            switchTab('inspiration-panel');
        }

        document.getElementById('project-manager-modal').classList.add('hidden');
        showNotification(`项目 "${project.title}" 已加载。`, "success");
    } catch (error) {
        showNotification("加载项目失败。", "error");
        console.error("加载项目时出错:", error);
    }
}


// --- 模态框逻辑 ---

function openRenameModal(project) {
    document.getElementById('rename-project-name-input').value = project.title;
    document.getElementById('rename-project-modal').classList.remove('hidden');
}

function openDeleteModal(project) {
    document.getElementById('delete-project-name-display').textContent = project.title;
    document.getElementById('delete-project-modal').classList.remove('hidden');
}

async function confirmSaveAsNewProject() {
    const titleInput = document.getElementById('new-project-name-input');
    const title = titleInput.value.trim();
    if (!title) {
        showNotification("项目名称不能为空。", "error");
        return;
    }

    const newProject = {
        ...JSON.parse(JSON.stringify(creationState)),
        id: `proj_${Date.now()}`,
        title: title,
        lastModified: Date.now(),
    };
    
    currentProjectId = newProject.id;
    creationState.projectId = newProject.id;
    
    try {
        await appDB.saveProject(newProject);
        await renderProjectList();
        showNotification(`新项目 "${title}" 已创建并保存。`, "success");
        document.getElementById('save-as-new-project-modal').classList.add('hidden');
    } catch (error) {
        showNotification("保存新项目失败。", "error");
        console.error("保存新项目时出错:", error);
    }
}

async function confirmOverwriteProject() {
    const projectToSave = {
        ...JSON.parse(JSON.stringify(creationState)),
        id: projectToActOn.id,
        title: creationState.novelTitle || projectToActOn.title,
        lastModified: Date.now()
    };
    
    try {
        await appDB.saveProject(projectToSave);
        await renderProjectList();
        showNotification(`项目 "${projectToSave.title}" 已覆盖保存。`, "success");
        document.getElementById('overwrite-project-modal').classList.add('hidden');
    } catch (error) {
        showNotification("覆盖保存失败。", "error");
        console.error("覆盖保存时出错:", error);
    }
}

async function confirmRenameProject() {
    const newTitle = document.getElementById('rename-project-name-input').value.trim();
    if (!newTitle) {
        showNotification("项目名称不能为空。", "error");
        return;
    }

    const projectToUpdate = {
        ...projectToActOn,
        title: newTitle,
        lastModified: Date.now()
    };
    
    if (projectToUpdate.id === currentProjectId) {
        creationState.novelTitle = newTitle;
    }

    try {
        await appDB.saveProject(projectToUpdate);
        await renderProjectList();
        showNotification("项目已重命名。", "success");
        document.getElementById('rename-project-modal').classList.add('hidden');
    } catch (error) {
        showNotification("重命名失败。", "error");
        console.error("重命名时出错:", error);
    }
}

async function confirmDeleteProject() {
    try {
        await appDB.deleteProject(projectToActOn.id);
        
        if (currentProjectId === projectToActOn.id) {
            currentProjectId = null;
            resetCreationState(false);
            renderAllPanels();
        }

        await renderProjectList();
        showNotification(`项目 "${projectToActOn.title}" 已删除。`, "success");
        document.getElementById('delete-project-modal').classList.add('hidden');
    } catch (error) {
        showNotification("删除失败。", "error");
        console.error("删除项目时出错:", error);
    }
}

async function loadInitialProjects() {
    if (currentUser) {
        try {
            projectLibrary = await appDB.getAllProjects();
            console.log("项目已从 IndexedDB 初始加载。");
        } catch (error) {
            console.error("从 IndexedDB 初始加载项目失败:", error);
            projectLibrary = [];
        }
    } else {
        projectLibrary = [];
    }
}

async function handleExportProject(projectId) {
    try {
        const project = await appDB.getProject(projectId);
        if (!project) {
            showNotification("导出失败，找不到该项目。", "error");
            return;
        }
        
        const content = formatTextForExport(
            project.writingPanelState?.proseContent || '',
            [], // 旧的 chapters 字段不再使用
            project.inspirationConcept || '',
            project.title || '未命名作品'
        );
        
        downloadFile(content, project.title, 'txt');
    } catch (error) {
        showNotification("导出失败。", "error");
        console.error("导出项目时出错:", error);
    }
}