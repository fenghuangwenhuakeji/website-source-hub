// 文件路径: js/main.js
// V79.1 统一配置版 - 无需登录

function switchTab(targetId) {
    document.querySelectorAll('.main-tab').forEach(t => t.classList.remove('active'));
    const targetTab = document.querySelector(`.main-tab[data-target="${targetId}"]`);
    if (targetTab) targetTab.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const targetContent = document.getElementById(targetId);
    if (targetContent) targetContent.classList.add('active');
}

async function proceedToNextStep(currentStep) {
    if (automationMode === 'full-auto' && !creationState.autoFlowState.isRunning) return;

    creationState.autoFlowState.currentStep = currentStep;
    
    try {
        switch (currentStep) {
            case 'inspiration':
                showNotification(`蓝图与大纲已确认，正在为您直接跳转至"正文写作"...`, 'info');
                switchTab('writing-panel');
                renderWritingPanel();
                
                if (automationMode === 'full-auto') {
                    switchWritingMode('batch');
                    const totalChapters = creationState.totalChapters;
                    await generateChapterBatch(0, totalChapters - 1); 
                } else {
                    switchWritingMode('batch');
                }
                break;

            case 'writing':
                 if (automationMode === 'full-auto') {
                    showNotification(`《${creationState.novelTitle}》已完本，正在直接导出...`, "info");
                    try {
                        const formattedContent = formatTextForExport(creationState.storyChapters);
                        downloadFile(formattedContent, creationState.novelTitle || '未命名作品', 'txt');
                        showNotification(`《${creationState.novelTitle}》已成功导出！`, "success");
                    } catch (exportError) {
                        showNotification(`自动导出失败: ${exportError.message}`, "error");
                    }

                     if (creationState.inspirationQueue.length > 0) {
                        showNotification(`3秒后开始处理下一个灵感...`, "success");
                        setTimeout(startNextInspirationInQueue, 3000);
                    } else {
                        showNotification("【全程自动化】所有任务已成功完成！", "success");
                        creationState.autoFlowState.isRunning = false;
                        const startBtn = document.getElementById('start-automation-btn');
                        if(startBtn){
                            startBtn.innerHTML = `<i class="fas fa-rocket"></i> 开始全自动处理！`;
                            startBtn.disabled = false;
                        }
                    }
                 }
                break;
        }
    } catch (error) {
        showNotification(`流程在 [${currentStep}] 环节中断: ${error.message}`, 'error');
        creationState.autoFlowState.isRunning = false;
        const startBtn = document.getElementById('start-automation-btn');
        if(startBtn){
            startBtn.innerHTML = `<i class="fas fa-rocket"></i> 开始全自动处理！`;
            startBtn.disabled = creationState.inspirationQueue.length === 0;
        }
    }
}


async function startNextInspirationInQueue() {
    if (creationState.inspirationQueue.length > 0 && creationState.autoFlowState.isRunning) {
        switchTab('inspiration-panel');
        await new Promise(resolve => setTimeout(resolve, 500)); 
        await processNextInspirationFromQueue(); 
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    async function initialize() {
        console.log("创世纪引擎 V42.3 正在初始化...");
        try {
            renderAllPanels();
            setupCoreEventListeners();
            initializeProjectManager();
            toggleDatabasePanels(true);

            await window.shortStoryDB.initDB();
            showNotification("短篇数据库连接成功。", "success");

            initializeApiSettingsModal();
            await initializeAuth();
            await checkLoginStatus();
            
            console.log("初始化完成。");

        } catch (error) {
            console.error("初始化失败:", error);
            showNotification(`初始化失败: ${error.message}`, "error");
        }
    }

    function renderAllPanels() {
        renderInspirationPanel();
        renderWritingPanel();
        renderCanonPanel();
        renderCharacterSystemPanel();
        renderArchetypePanel();
        renderPlotPanel();
        renderEmotionPanel();
    }

    function setupCoreEventListeners() {
        document.querySelectorAll('.main-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                if (isGenerating) return;
                switchTab(e.currentTarget.dataset.target);
            });
        });
        const toggleBtn = document.getElementById('toggle-database-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => toggleDatabasePanels(false));
        }
        const themeSwitcher = document.querySelector('.theme-switcher');
        if (themeSwitcher) {
            themeSwitcher.addEventListener('click', (e) => {
                const button = e.target.closest('.theme-btn');
                if(button) {
                    const theme = button.dataset.theme;
                    document.body.className = `theme-${theme}`;
                    document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                }
            });
        }
        const modeSelect = document.getElementById('automation-mode-select');
        if (modeSelect) {
            modeSelect.addEventListener('change', (e) => {
                if (isGenerating) {
                    showNotification("AI正在工作中，请勿切换模式。", "warning");
                    e.target.value = automationMode; 
                    return;
                }
                automationMode = e.target.value;
                showNotification(`模式已切换为: ${e.target.options[e.target.selectedIndex].text}`, 'info');
                updateUIMode();
            });
        }
    }
    
    function toggleDatabasePanels(isInitial = false) {
        const nav = document.querySelector('.main-nav-tabs');
        const btn = document.getElementById('toggle-database-btn');
        if (!nav || !btn) return;
        if (!isInitial) {
            nav.classList.toggle('database-panels-hidden');
            btn.classList.toggle('active');
        } else {
            nav.classList.add('database-panels-hidden');
            btn.classList.remove('active');
        }
    }

    initialize();
});
