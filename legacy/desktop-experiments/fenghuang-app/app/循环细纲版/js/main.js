// 文件路径: js/main.js
// V79.1 统一配置版 - 无需登录

function renderAllPanels() {
    renderInspirationPanel();
    renderWritingPanel();
    renderCanonPanel();
    renderCharacterSystemPanel();
    renderArchetypePanel();
    renderPlotPanel();
    renderEmotionPanel();
}

function switchTab(targetId) {
    document.querySelectorAll('.main-tab').forEach(t => t.classList.remove('active'));
    const targetTab = document.querySelector(`.main-tab[data-target="${targetId}"]`);
    if (targetTab) targetTab.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const targetContent = document.getElementById(targetId);
    if (targetContent) targetContent.classList.add('active');
}

async function proceedToNextStep(currentStep) {
    try {
        if (currentStep === 'inspiration') {
            showNotification(`宏观大纲已生成，正在为您跳转至"大纲与正文写作"面板...`, 'info');
            switchTab('writing-panel');
            renderWritingPanel();
        }
    } catch (error) {
        showNotification(`流程在 [${currentStep}] 环节中断: ${error.message}`, 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        async function initialize() {
            console.log("创世纪引擎 V62.0 正在初始化...");
            try {
                if (typeof appDB !== 'undefined' && appDB.initDB) {
                    await appDB.initDB();
                    showNotification("数据库连接成功。", "success");
                }
            } catch (error) {
                console.error("数据库初始化失败:", error);
                showNotification("数据库初始化失败！项目将无法保存。", "error");
            }
            
            renderAllPanels();
            setupCoreEventListeners();
            initializeProjectManager();
            toggleDatabasePanels(true);
            
            console.log("初始化完成。");
        }

        function setupCoreEventListeners() {
            document.querySelectorAll('.main-tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
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
    }, 100);
});
