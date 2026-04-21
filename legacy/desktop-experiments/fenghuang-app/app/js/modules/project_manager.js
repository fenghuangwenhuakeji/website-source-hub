// 文件路径: js/modules/project_manager.js
// 描述: (V70.0 博士·凤凰涅槃·重构版) - 完全重写，采用IndexedDB和自定义模态框，根除所有旧问题。

// --- 全局状态与接口 ---
window.App = window.App || {};
window.App.projectManager = {
    saveCurrentProject: handleSaveCurrentProject,
    loadProject: handleLoadProject,
    silentSaveProject: silentSaveProject, // 暴露新的静默保存函数
};

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
        if (!button) { // 如果点击的不是按钮，则加载项目
             const projectItem = e.target.closest('.project-item');
             if(projectItem) {
                 const projectId = projectItem.dataset.id;
                 await handleLoadProject(projectId);
             }
             return;
        }
        
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
        el.dataset.id = project.id;
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
    // 修复：检查更广泛的内容，而不是仅仅依赖创世蓝图。
    // 一个项目是可保存的，如果它有蓝图，或者有任何章节。
    const hasBlueprint = !!creationState.blueprint;
    const hasChapters = creationState.chapters && creationState.chapters.length > 0;

    if (!hasBlueprint && !hasChapters) {
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

        // 使用 Object.assign 深度合并，确保新旧状态兼容
        const defaultState = getInitialCreationState();
        // 深度合并，确保新旧状态键的兼容性
        const loadedState = { ...defaultState, ...project };
        
        creationState = loadedState;
        currentProjectId = loadedState.id;

        // 显式恢复各个模块的状态
        writingDeskState.chapters = loadedState.chapters || [];
        writingDeskState.currentChapterIndex = loadedState.currentChapterIndex > -1 ? loadedState.currentChapterIndex : -1;

        // 重新渲染UI以反映加载的数据
        if (typeof renderAllPanelsFromState === 'function') {
            renderAllPanelsFromState(); // 优先使用全局渲染函数
        } else {
            // Fallback: 如果全局函数不可用，则手动调用各个面板的渲染
            if (typeof renderOutlineDetailPanel === 'function' && creationState.hierarchicalOutline) {
                renderOutlineDetailPanel(creationState.hierarchicalOutline);
            }
            if (typeof renderChapterListFromData === 'function' && writingDeskState.chapters.length > 0) {
                renderChapterListFromData();
            }
        }
        
        // 根据加载的内容决定切换到哪个标签页
        if (writingDeskState.chapters && writingDeskState.chapters.length > 0) {
            switchTab('writing-desk-panel');
        } else if (creationState.hierarchicalOutline) {
             switchTab('outline-detail-panel');
        } else {
            switchTab('pipeline-panel');
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

    // 职责分离：不再调用saveCurrentDeskChapter，依赖于外部在调用前已同步好状态
    // if (typeof saveCurrentDeskChapter === 'function') {
    //     saveCurrentDeskChapter(false);
    // }

    const newProject = {
        ...JSON.parse(JSON.stringify(creationState)),
        chapters: JSON.parse(JSON.stringify(writingDeskState.chapters)), // 显式保存章节
        currentChapterIndex: writingDeskState.currentChapterIndex, // 保存当前章节索引
        id: `proj_${Date.now()}`,
        title: title,
        lastModified: Date.now(),
    };
    
    currentProjectId = newProject.id;
    creationState.title = title; // 更新当前状态的标题
    
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

async function silentSaveProject(showNotif = true) {
    if (!currentProjectId) {
        // 如果项目从未被保存过，应该由调用方（如saveCurrentDeskChapter）来决定如何处理，
        // 而不是在这里触发UI点击。这里我们仅提示并返回。
        showNotification("请先为您的项目命名并保存。", "info");
        document.getElementById('save-as-new-project-btn').click(); // 保持原有逻辑，引导用户保存
        return;
    }

    // 职责分离：silentSaveProject只负责保存creationState，不再关心如何同步。
    // if (typeof syncDeskToState === 'function') {
    //     syncDeskToState();
    // }

    const projectToSave = {
        ...JSON.parse(JSON.stringify(creationState)),
        id: currentProjectId,
        lastModified: Date.now()
    };

    try {
        await appDB.saveProject(projectToSave);
        if (showNotif) {
            showNotification(`项目 "${projectToSave.title}" 已静默保存。`, "success");
        }
    } catch (error) {
        if (showNotif) {
            showNotification("静默保存失败。", "error");
        }
        console.error("静默保存时出错:", error);
    }
}


async function confirmOverwriteProject() {
    // 职责分离：不再调用saveCurrentDeskChapter，依赖于外部在调用前已同步好状态
    // if (typeof saveCurrentDeskChapter === 'function') {
    //     saveCurrentDeskChapter(false);
    // }

    const projectToSave = {
        ...JSON.parse(JSON.stringify(creationState)),
        chapters: JSON.parse(JSON.stringify(writingDeskState.chapters)),
        currentChapterIndex: writingDeskState.currentChapterIndex,
        id: projectToActOn.id,
        title: creationState.title || projectToActOn.title,
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

    // 从数据库读取最新的项目数据进行修改
    const projectToUpdate = await appDB.getProject(projectToActOn.id);
    if (!projectToUpdate) {
        showNotification("重命名失败：找不到项目。", "error");
        return;
    }

    projectToUpdate.title = newTitle;
    projectToUpdate.lastModified = Date.now();
    
    if (projectToUpdate.id === currentProjectId) {
        creationState.title = newTitle;
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
            resetCreationState(true); // 重置并切换到开始界面
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
    try {
        projectLibrary = await appDB.getAllProjects();
        console.log("项目已从 IndexedDB 初始加载。");
    } catch (error) {
        console.error("从 IndexedDB 初始加载项目失败:", error);
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
        
        let content = `项目标题: ${project.title}\n`;
        content += `最后修改: ${new Date(project.lastModified).toLocaleString()}\n\n`;
        content += `==============================\n创世蓝图\n==============================\n\n`;
        content += project.blueprint || "无蓝图信息";
        content += `\n\n==============================\n层级大纲\n==============================\n\n`;
        content += project.hierarchicalOutline || "无大纲信息";
        content += `\n\n==============================\n正文内容\n==============================\n\n`;
        
        if (project.chapters && project.chapters.length > 0) {
             project.chapters.forEach(chap => {
                content += `### ${chap.title}\n\n`;
                content += `${chap.body || '无正文内容'}\n\n`;
             });
        } else {
            content += "无正文内容。";
        }
        
        downloadFile(content, `${project.title}.txt`, 'text/plain');
    } catch (error) {
        showNotification("导出失败。", "error");
        console.error("导出项目时出错:", error);
    }
}

// 确保在主JS文件或其他地方定义
// document.addEventListener('DOMContentLoaded', initializeProjectManager);