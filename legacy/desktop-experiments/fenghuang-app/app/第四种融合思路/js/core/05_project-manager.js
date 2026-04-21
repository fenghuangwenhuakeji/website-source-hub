/*
 * 创世纪引擎 V75.5 - 梦想修正版
 * 模块: 项目管理 (Project Manager)
 * ✨✨✨ (博士重构 - 梦想修正) ✨✨✨
 * 1. 【致命BUG修复】创建了独立的 setupProjectManagerEventListeners 函数，并确保在 rebindModuleEvents 中调用它，彻底解决了加载项目后“保存”、“新建”等按钮失效的问题。
 * 2. 【致命BUG修复】将 `window.saveCardLibrary` 的定义从一个永远不会被调用的函数内部，移到了模块初始化函数 `initializeProjectManager` 中，确保卡牌库的保存功能从一开始就处于激活状态。
 */

let userId = ''; 

function initializeProjectManager() {
    userId = localStorage.getItem('genesisEngineUserId');
    if (!userId) {
        userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem('genesisEngineUserId', userId);
    }
    console.log("当前用户ID:", userId);

    window.saveCardLibrary = () => saveCardLibraryToStorage(getState().cardLibrary);
    
    setupProjectManagerEventListeners();
    loadUserProjects();
}

function getProjectLibrary() {
    const key = `${userId}_projectLibrary`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

function saveProjectLibrary(library) {
    const key = `${userId}_projectLibrary`;
    localStorage.setItem(key, JSON.stringify(library));
}

function getCardLibrary() {
     const key = `${userId}_cardLibrary`;
     const data = localStorage.getItem(key);
     return data ? JSON.parse(data) : [];
}

function saveCardLibraryToStorage(library) {
    const key = `${userId}_cardLibrary`;
    localStorage.setItem(key, JSON.stringify(library));
    console.log(`卡牌库已保存到 ${key}`);
}

function setupProjectManagerEventListeners() {
    const container = document.getElementById('project-manager-panel');
    if (!container) return;

    const listContainer = document.getElementById('project-list-container');
    if (listContainer.eventListener) {
        listContainer.removeEventListener('click', listContainer.eventListener);
    }
    listContainer.eventListener = (e) => {
        const target = e.target;
        const projectItem = target.closest('.project-list-item');
        if (!projectItem) return;
        const projectId = projectItem.dataset.id;
        if (target.closest('.load-btn')) handleLoadProject(projectId);
        if (target.closest('.delete-btn')) handleDeleteProject(projectId);
    };
    listContainer.addEventListener('click', listContainer.eventListener);
    
    document.getElementById('new-project-btn')?.addEventListener('click', () => handleNewProject());
    document.getElementById('save-project-btn')?.addEventListener('click', () => handleSaveCurrentProject());
    document.getElementById('export-data-btn')?.addEventListener('click', handleExportAllData);
    document.getElementById('import-data-btn')?.addEventListener('click', () => document.getElementById('import-file-input')?.click());
    document.getElementById('import-file-input')?.addEventListener('change', handleImportData);
}

function loadUserProjects() {
    let projectLibrary = getProjectLibrary();
    const cardLibrary = getCardLibrary();
    
    updateState({
        cardLibrary: cardLibrary,
        currentProject: null 
    });

    if (projectLibrary.length > 0) {
        projectLibrary.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
        handleLoadProject(projectLibrary[0].id, true);
    } else {
        handleNewProject("我的第一个项目", true);
    }
}

function renderProjectList() {
    const container = document.getElementById('project-list-container');
    if (!container) return;
    
    const projectLibrary = getProjectLibrary();
    const currentProjectId = getState().currentProject?.id;

    if (projectLibrary.length === 0) {
        container.innerHTML = '<p class="placeholder-text">还没有项目，快点击“新建项目”开始吧！</p>';
        return;
    }
    
    projectLibrary.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    
    container.innerHTML = projectLibrary.map(proj => `
        <li class="project-list-item ${proj.id === currentProjectId ? 'active' : ''}" data-id="${proj.id}">
            <div class="project-info">
                <span class="project-title">${Utils.escapeHTML(proj.pipeline.novelTitle)}</span>
                <span class="project-date">最后修改: ${new Date(proj.lastModified).toLocaleString()}</span>
            </div>
            <div class="project-actions">
                <button class="settings-btn delete-btn" title="删除"><i class="fas fa-trash"></i></button>
                <button class="action-btn load-btn" ${proj.id === currentProjectId ? 'disabled' : ''}>
                    <i class="fas fa-folder-open"></i> ${proj.id === currentProjectId ? '当前项目' : '加载'}
                </button>
            </div>
        </li>
    `).join('');
}

function handleNewProject(defaultName = "未命名项目", isSilent = false) {
    const projectName = isSilent ? defaultName : prompt("请输入新项目的名称：", defaultName);
    if (!projectName || !projectName.trim()) {
        if (!isSilent) showNotification("项目名称不能为空！", "warning");
        return;
    }

    const newPipeline = JSON.parse(JSON.stringify(initialState.pipeline));
    newPipeline.novelTitle = projectName.trim();
    
    const newProject = {
        id: `proj_${Date.now()}`,
        lastModified: new Date().toISOString(),
        pipeline: newPipeline
    };

    let projectLibrary = getProjectLibrary();
    projectLibrary.push(newProject);
    saveProjectLibrary(projectLibrary);
    
    handleLoadProject(newProject.id, isSilent);

    if (!isSilent) {
        showNotification("新项目已创建！", "success");
    }
}

function handleSaveCurrentProject(isSilent = false) {
    const state = getState();
    const currentProject = state.currentProject;

    if (!currentProject || !currentProject.id) {
        if (!isSilent) showNotification("没有活动的有效项目可保存。", "warning");
        return;
    }

    let projectLibrary = getProjectLibrary();
    const projectIndex = projectLibrary.findIndex(p => p.id === currentProject.id);

    const projectDataToSave = {
        id: currentProject.id,
        lastModified: new Date().toISOString(),
        pipeline: state.pipeline
    };

    if (projectIndex > -1) {
        projectLibrary[projectIndex] = projectDataToSave;
    } else {
        projectLibrary.push(projectDataToSave);
    }
    
    saveProjectLibrary(projectLibrary);
    
    if (!isSilent) {
        showNotification(`项目“${state.pipeline.novelTitle}”已保存！`, "success");
    }
    renderProjectList();
}

function handleLoadProject(projectId, isSilent = false) {
    if(!isSilent) handleSaveCurrentProject(true);

    const projectLibrary = getProjectLibrary();
    const projectToLoad = projectLibrary.find(p => p.id === projectId);

    if (projectToLoad) {
        updateState({
            currentProject: { id: projectToLoad.id, lastModified: projectToLoad.lastModified },
            pipeline: projectToLoad.pipeline
        });
        
        renderAllPanels();
        rebindModuleEvents(); 
        
        renderProjectList();

        if (!isSilent) {
            showNotification(`项目 "${projectToLoad.pipeline.novelTitle}" 已加载。`, "info");
        }

    } else {
       if (!isSilent) showNotification("加载失败，未找到该项目。", "error");
    }
}

function handleDeleteProject(projectId) {
    let projectLibrary = getProjectLibrary();
    const projectToDelete = projectLibrary.find(p => p.id === projectId);
    if (!projectToDelete) return;

    if (confirm(`确定要永久删除项目 "${projectToDelete.pipeline.novelTitle}" 吗？此操作无法撤销。`)) {
        projectLibrary = projectLibrary.filter(p => p.id !== projectId);
        saveProjectLibrary(projectLibrary);
        
        if (getState().currentProject?.id === projectId) {
            if (projectLibrary.length > 0) {
                handleLoadProject(projectLibrary[0].id, true);
            } else {
                handleNewProject("新项目", true);
            }
        } else {
            renderProjectList();
        }
        showNotification("项目已删除。", "info");
    }
}

function handleExportAllData() {
    handleSaveCurrentProject(true);
    const dataToExport = { userId: userId, projects: getProjectLibrary(), cards: getCardLibrary() };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([`\uFEFF${dataStr}`], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `创世纪引擎备份_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification("全部数据已成功导出！", "success");
}

function handleImportData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (!importedData.projects) { throw new Error("导入文件格式无效，缺少 'projects' 数据。"); }
            if (confirm(`即将导入数据。这将覆盖当前的所有项目和卡牌库，确定吗？`)) {
                saveProjectLibrary(importedData.projects || []);
                saveCardLibraryToStorage(importedData.cards || []);
                if(typeof saveCardLibrary === 'function') {
                    saveCardLibrary();
                }
                showNotification("数据导入成功！正在刷新工作区...", "success");
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (error) {
            showNotification(`导入失败: ${error.message}`, "error");
        } finally {
            event.target.files = null; 
        }
    };
    reader.readAsText(file);
}