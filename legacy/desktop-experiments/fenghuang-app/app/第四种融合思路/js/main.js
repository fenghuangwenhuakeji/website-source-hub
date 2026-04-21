/*
 * 创世纪引擎 V76.3 - 全局修正版
 * 描述: 主程序入口。
 * ✨✨✨ (博士重构 - 梦想实现 V2) ✨✨✨
 * 1. 【核心修复】修正了 `switchView` 函数中的函数调用错误。现在它会正确调用新模块 (`module-card-library.js` 和 `module-deconstruction.js`) 中已经更名的新函数 (`filterAndRenderCards` 等)，解决了所有 `ReferenceError` 崩溃问题。
 * 2. 【梦想实现】根据您的指令，已移除导航栏的视图切换锁。现在，即使创作流水线正在后台运行，您也可以自由切换到任何其他功能面板，引擎将在后台继续为您工作。
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("创世纪引擎 V76.3 (全局修正版) 开始初始化...");
    try {
        initializeState();
        initializeApiSettingsModal();
        renderAllPanels();
        initializeAllModules();
        setupGlobalEventListeners();
        console.log("引擎初始化成功，您的梦想已准备就绪。");
        showNotification("欢迎使用创世纪引擎 V76.3！", "success");
    } catch (error) {
        console.error("初始化过程中发生严重错误:", error);
        const errorMsg = `引擎启动失败: ${error.message}`;
        showNotification(errorMsg, 'error');
        alert(errorMsg);
    }
});

function renderAllPanels() {
    document.getElementById('pipeline-panel').innerHTML = UITemplates.pipelinePanel;
    document.getElementById('writing-desk-panel').innerHTML = UITemplates.writingDeskPanel;
    document.getElementById('deconstruction-panel').innerHTML = UITemplates.deconstructionRoomPanel;
    document.getElementById('writing-area-panel').innerHTML = UITemplates.writingAreaPanel;
    document.getElementById('card-library-panel').innerHTML = UITemplates.cardLibraryPanel;
    document.getElementById('toolbox-panel').innerHTML = UITemplates.toolboxPanel;
    document.getElementById('project-manager-panel').innerHTML = UITemplates.projectManagerPanel;
}

function rebindModuleEvents() {
    console.log("Rebinding module events...");
    initializePipeline();
    initializeWritingDesk();
    initializeDeconstructionRoom();
    initializeWritingArea();
    initializeCardLibrary(); 
    initializeToolbox();
    initializeResizableLayouts();
}

function initializeAllModules() {
    initializeProjectManager();
    rebindModuleEvents();
}

function setupGlobalEventListeners() {
    const allNavLinks = document.querySelectorAll('.nav-link');
    allNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.dataset.target;
            if (!targetId) return;

            // ✨✨✨ 梦想实现：移除视图切换锁 ✨✨✨
            // if (getState().pipeline.isRunning && targetId !== 'pipeline-panel') {
            //     showNotification("创作流水线正在运行，请先中止任务再切换。", "warning");
            //     return;
            // }

            switchView(targetId);
            allNavLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    const settingsBtn = document.getElementById('system-settings-btn');
    settingsBtn?.addEventListener('click', () => {
        const modal = document.getElementById('api-settings-modal');
        if (modal) modal.style.display = 'block';
    });
    
    const themeButtons = document.querySelectorAll('.theme-btn');
    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const theme = button.dataset.theme;
            document.body.className = `theme-${theme}`;
            themeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });
}

function switchView(targetId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });
    const targetTab = document.getElementById(targetId);
    if (targetTab) {
        targetTab.style.display = 'block';
        targetTab.classList.add('active');
        
        // ✨✨✨ 核心修复 ✨✨✨
        // 使用新模块中定义的正确函数名
        if (targetId === 'deconstruction-panel') {
            // 这两个函数现在定义在各自的模块中，但因为JS加载顺序，它们在全局可用
            if (typeof renderDeconstructionCardGrid === 'function') {
                // 刷新拆解室时，需要重新渲染卡牌网格
                const state = getState();
                // 注意：这里可能需要一个更好的方式来获取上次拆解的结果
                // 为简单起见，我们暂时只渲染卡牌库的最新卡牌
                renderDeconstructionCardGrid(state.cardLibrary.slice(0, 50)); 
            }
        }
        if (targetId === 'card-library-panel') {
            if (typeof filterAndRenderCards === 'function') {
                filterAndRenderCards();
            }
        }
    }
}