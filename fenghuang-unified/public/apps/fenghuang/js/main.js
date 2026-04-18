// 创建全局应用命名空间
window.App = window.App || {};
window.App.db = window.App.db || {};
window.App.user = null;
window.App.apiConfig = null;

const pageTitleMap = {
    'pipeline-panel': '创作流水线',
    'outline-detail-panel': '大纲细纲',
    'writing-desk-panel': '执笔写作台',
    'rag-panel': 'RAG上下文',
    'memory-panel': '三层记忆',
    'library-panel': '图书馆',
    'vector-panel': '向量库',
    'canon-panel': '叙事圣典',
    'character-panel': '角色系统',
    'archetype-panel': '角色原型',
    'plot-panel': '情节系统',
    'emotion-panel': '情绪系统',
    'promax-panel': '智能创作',
    'short-panel': '短篇写作',
    'card-engine-panel': '卡牌引擎',
    'v5-50-panel': '5.50完全体',
    'fourth-idea-panel': '第四种融合',
    'gaiban-zhongchangpian-panel': '丐版中长篇',
    'xunhuan-xigang-panel': '循环细纲版'
};

const loadedIframes = new Set();

document.addEventListener('DOMContentLoaded', async () => {
    console.log("创世纪引擎 V79.1 - 凤凰涅槃 初始化...");
    const startTime = performance.now();

    try {
        await Promise.all([appDB.initDB(), vectorDB.initDB()]);
        console.log("所有数据库已成功初始化。");

        // 初始化新模块
        if (typeof RAGSystem !== 'undefined') await RAGSystem.init();
        if (typeof MemorySystem !== 'undefined') await MemorySystem.init();
        if (typeof LibrarySystem !== 'undefined') await LibrarySystem.init();

        initializeSidebar();
        initializeUnifiedAuth();
        initializeUnifiedApiSettings();
        initializeProjectManager();
        initializeDatabaseToggle();
        initializeKnowledgeBasePanels();
        initializeLibraryPanel();
        initializeRAGPanel();
        initializeMemoryPanel();

        if (typeof initializeCharacterModal === 'function') {
            initializeCharacterModal();
        }
        
        initializePipelineModule();
        initializeOutlinePanel();
        initializeWritingDesk();

        await checkUnifiedLoginStatus();
        await loadInitialProjects();

        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(() => initializeVectorPanel());
        } else {
            setTimeout(() => initializeVectorPanel(), 100);
        }

        const loadTime = (performance.now() - startTime).toFixed(2);
        console.log(`创世纪引擎 V79.1 - 凤凰涅槃 已准备就绪 (${loadTime}ms)`);

    } catch (error) {
        console.error("引擎初始化失败:", error);
        document.body.innerHTML = `<div style="color: red; padding: 20px;"><h1>引擎初始化失败</h1><p>${error}</p></div>`;
    }
});

function initializeSidebar() {
    const sidebarTabs = document.querySelectorAll('.sidebar-tab');
    const sidebarNav = document.getElementById('sidebar-nav');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const currentPageTitle = document.getElementById('current-page-title');

    sidebarTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            sidebarTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const targetId = tab.dataset.target;
            switchTab(targetId);
            
            if (pageTitleMap[targetId] && currentPageTitle) {
                currentPageTitle.textContent = pageTitleMap[targetId];
            }
            
            if (window.innerWidth <= 1024 && sidebarNav) {
                sidebarNav.classList.remove('mobile-open');
            }
            
            const iframePanel = document.getElementById(targetId);
            if (iframePanel && iframePanel.classList.contains('iframe-panel')) {
                loadIframeLazy(targetId);
            }
        });
    });

    if (toggleBtn && sidebarNav) {
        const isCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
        if (isCollapsed) {
            sidebarNav.classList.add('collapsed');
        }
        
        toggleBtn.addEventListener('click', () => {
            if (sidebarNav) {
                sidebarNav.classList.toggle('collapsed');
                localStorage.setItem('sidebar_collapsed', sidebarNav.classList.contains('collapsed'));
            }
        });
    }

    if (mobileMenuBtn && sidebarNav) {
        mobileMenuBtn.addEventListener('click', () => {
            if (sidebarNav) {
                sidebarNav.classList.toggle('mobile-open');
            }
        });
        
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024 && 
                sidebarNav && 
                sidebarNav.classList.contains('mobile-open') &&
                !sidebarNav.contains(e.target) && 
                !mobileMenuBtn.contains(e.target)) {
                sidebarNav.classList.remove('mobile-open');
            }
        });
    }
}

function loadIframeLazy(panelId) {
    if (loadedIframes.has(panelId)) return;
    
    const panel = document.getElementById(panelId);
    if (!panel || !panel.classList.contains('iframe-panel')) return;
    
    const src = panel.dataset.src;
    if (!src) return;
    
    loadedIframes.add(panelId);
    
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.style.cssText = 'width:100%; height:100%; border:none;';
    iframe.setAttribute('loading', 'lazy');
    
    panel.innerHTML = '';
    panel.appendChild(iframe);
}

function switchTab(targetId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const targetPanel = document.getElementById(targetId);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
}

// ═══════════════════════════════════════════════════════════════
// 统一登录系统
// ═══════════════════════════════════════════════════════════════

function initializeUnifiedAuth() {
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (loginBtn) loginBtn.addEventListener('click', handleUnifiedLogin);
    if (registerBtn) registerBtn.addEventListener('click', handleUnifiedRegister);
    if (logoutBtn) logoutBtn.addEventListener('click', handleUnifiedLogout);
}

async function checkUnifiedLoginStatus() {
    const userData = localStorage.getItem('genesis_user');
    if (userData) {
        App.user = JSON.parse(userData);
        updateAuthUI(true);
    } else {
        updateAuthUI(false);
    }
}

function handleUnifiedLogin() {
    const username = prompt('请输入用户名:');
    if (!username || !username.trim()) return;
    
    const password = prompt('请输入密码:');
    if (!password) return;
    
    const users = JSON.parse(localStorage.getItem('genesis_users') || '{}');
    const user = users[username.trim()];
    
    if (user && user.password === password) {
        App.user = { username: username.trim(), loginTime: Date.now() };
        localStorage.setItem('genesis_user', JSON.stringify(App.user));
        updateAuthUI(true);
        showNotification(`欢迎回来，${App.user.username}！`, 'success');
        broadcastAuthChange();
    } else {
        showNotification('用户名或密码错误', 'error');
    }
}

function handleUnifiedRegister() {
    const username = prompt('请设置用户名:');
    if (!username || !username.trim()) return;
    
    const password = prompt('请设置密码:');
    if (!password) return;
    
    const users = JSON.parse(localStorage.getItem('genesis_users') || '{}');
    
    if (users[username.trim()]) {
        showNotification('用户名已存在', 'error');
        return;
    }
    
    users[username.trim()] = { password: password };
    localStorage.setItem('genesis_users', JSON.stringify(users));
    
    App.user = { username: username.trim(), loginTime: Date.now() };
    localStorage.setItem('genesis_user', JSON.stringify(App.user));
    updateAuthUI(true);
    showNotification('注册成功！', 'success');
    broadcastAuthChange();
}

function handleUnifiedLogout() {
    App.user = null;
    localStorage.removeItem('genesis_user');
    updateAuthUI(false);
    showNotification('已登出', 'info');
    broadcastAuthChange();
}

function updateAuthUI(isLoggedIn) {
    const welcomeEl = document.getElementById('welcome-message');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (isLoggedIn && App.user) {
        if (welcomeEl) welcomeEl.textContent = `欢迎, ${App.user.username}`;
        if (loginBtn) loginBtn.classList.add('hidden');
        if (registerBtn) registerBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
    } else {
        if (welcomeEl) welcomeEl.textContent = '请先登录';
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (registerBtn) registerBtn.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
    }
}

function broadcastAuthChange() {
    window.dispatchEvent(new CustomEvent('auth-change', { 
        detail: { user: App.user } 
    }));
    
    document.querySelectorAll('iframe').forEach(iframe => {
        try {
            iframe.contentWindow.postMessage({
                type: 'auth-change',
                user: App.user
            }, '*');
        } catch(e) {}
    });
}

// ═══════════════════════════════════════════════════════════════
// 统一 API 设置
// ═══════════════════════════════════════════════════════════════

const API_PRESETS = {
    'zhipu': 'https://open.bigmodel.cn/api/paas/v4',
    'volcark': 'https://ark.cn-beijing.volces.com/api/v3',
    'volcano_coding': 'https://ark.cn-beijing.volces.com/api/coding/v3',
    'kimi': 'https://api.moonshot.cn/v1',
    'minimax': 'https://api.minimax.chat/v1',
    'deepseek': 'https://api.deepseek.com/v1',
    'baichuan': 'https://api.baichuan-ai.com/v1',
    'stepfun': 'https://api.stepfun.com/v1',
    'openai': 'https://api.openai.com/v1',
    'azure': 'https://your-resource.openai.azure.com/openai',
    'openai_compat': ''
};

const PRESET_MODELS = {
    'zhipu': ['glm-4', 'glm-4-plus', 'glm-4-flash', 'glm-4-air', 'glm-4-airx', 'glm-4-long', 'glm-4-alltools', 'glm-4v', 'glm-4v-plus', 'glm-3-turbo'],
    'volcark': ['doubao-pro-32k', 'doubao-pro-128k', 'doubao-lite-32k', 'doubao-lite-128k', 'doubao-vision-pro-32k', 'doubao-vision-lite-32k'],
    'volcano_coding': ['ark-code-latest', 'doubao-seed-2.0-code', 'doubao-seed-2.0-pro', 'doubao-seed-2.0-lite'],
    'kimi': ['kimi-latest', 'kimi-k1-5', 'kimi-k1', 'moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    'minimax': ['abab6.5s', 'abab6.5t', 'abab6.5g', 'abab5.5', 'abab5.5s'],
    'deepseek': ['deepseek-chat', 'deepseek-reasoner', 'deepseek-coder', 'deepseek-v3', 'deepseek-r1'],
    'baichuan': ['Baichuan4', 'Baichuan3-Turbo', 'Baichuan3-Turbo-128k', 'Baichuan2-Turbo'],
    'stepfun': ['step-1-8k', 'step-1-32k', 'step-1-128k', 'step-1-256k', 'step-1-flash', 'step-2-16k'],
    'openai': ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini'],
    'azure': ['gpt-4', 'gpt-4-32k', 'gpt-4-turbo', 'gpt-35-turbo']
};

function initializeUnifiedApiSettings() {
    const openBtn = document.getElementById('api-settings-btn');
    const modal = document.getElementById('api-modal');
    
    console.log('Initializing API settings...', { openBtn: !!openBtn, modal: !!modal });
    
    if (openBtn) {
        openBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('API settings button clicked');
            if (modal) {
                modal.classList.remove('hidden');
                loadApiConfig();
            } else {
                console.error('API modal not found!');
            }
        });
    } else {
        console.error('API settings button not found!');
    }
    
    const closeBtn = modal ? modal.querySelector('.close-btn') : null;
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }
    
    loadApiConfig();
}

function onApiProviderChange() {
    const provider = document.getElementById('api-provider').value;
    const urlField = document.getElementById('api-url');
    const urlGroup = document.getElementById('api-url-group');

    if (API_PRESETS[provider] !== undefined && urlField) {
        urlField.value = API_PRESETS[provider];
    }

    if (urlGroup) {
        urlGroup.style.display = (provider === 'openai_compat') ? '' : 'none';
    }

    const modelSelect = document.getElementById('api-model-select');
    const hiddenModel = document.getElementById('api-model');
    const customModel = document.getElementById('api-model-custom');
    
    if (modelSelect) modelSelect.innerHTML = '<option value="">- 请先获取模型列表 -</option>';
    if (hiddenModel) hiddenModel.value = '';
    if (customModel) customModel.value = '';
}

function onCustomModelInput() {
    const customInput = document.getElementById('api-model-custom');
    const val = customInput ? customInput.value.trim() : '';
    const hiddenModel = document.getElementById('api-model');
    const modelSelect = document.getElementById('api-model-select');
    
    if (val) {
        if (hiddenModel) hiddenModel.value = val;
        if (modelSelect) modelSelect.value = '';
    }
}

async function fetchApiModels() {
    const provider = document.getElementById('api-provider').value;
    const urlField = document.getElementById('api-url');
    const baseUrl = urlField ? urlField.value.trim() : '';
    const keyField = document.getElementById('api-key');
    const apiKey = keyField ? keyField.value.trim() : '';
    const selectEl = document.getElementById('api-model-select');

    if (!baseUrl || !apiKey) {
        showNotification('请先填写 API 地址和 API Key', 'error');
        return;
    }

    if (selectEl) selectEl.innerHTML = '<option value="">⏳ 正在加载模型列表...</option>';

    try {
        let url = baseUrl.endsWith('/models') ? baseUrl : `${baseUrl.replace(/\/$/, '')}/models`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        let models = [];

        if (data.data && Array.isArray(data.data)) {
            models = data.data.map(m => m.id).filter(id => id);
        } else if (Array.isArray(data)) {
            models = data.map(m => m.id || m.name).filter(id => id);
        }

        if (models.length === 0) {
            if (selectEl) selectEl.innerHTML = '<option value="">❌ 未找到可用模型</option>';
            showNotification('未找到可用模型', 'error');
            return;
        }

        if (selectEl) {
            selectEl.innerHTML = '<option value="">✅ 请选择模型</option>' +
                models.map(m => `<option value="${m}">${m}</option>`).join('');
                
            selectEl.onchange = function() {
                const hiddenModel = document.getElementById('api-model');
                const customModel = document.getElementById('api-model-custom');
                if (hiddenModel) hiddenModel.value = this.value;
                if (this.value && customModel) customModel.value = '';
            };
        }

        showNotification(`✨ 成功获取 ${models.length} 个模型`, 'success');

    } catch (error) {
        console.error('获取模型列表失败:', error);

        if (PRESET_MODELS[provider] && selectEl) {
            const presetModels = PRESET_MODELS[provider];
            selectEl.innerHTML = '<option value="">⚠️ 使用预设模型列表</option>' +
                presetModels.map(m => `<option value="${m}">${m}</option>`).join('');
                
            selectEl.onchange = function() {
                const hiddenModel = document.getElementById('api-model');
                const customModel = document.getElementById('api-model-custom');
                if (hiddenModel) hiddenModel.value = this.value;
                if (this.value && customModel) customModel.value = '';
            };
            showNotification(`已加载 ${provider} 的预设模型列表`, 'warning');
        } else {
            if (selectEl) selectEl.innerHTML = `<option value="">❌ 获取失败</option>`;
            showNotification('获取模型列表失败: ' + error.message, 'error');
        }
    }
}

function loadApiConfig() {
    const config = JSON.parse(localStorage.getItem('genesis_api_config') || '{}');
    
    const safeSet = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value || '';
    };

    safeSet('api-name', config.name || '');
    safeSet('api-provider', config.provider || 'zhipu');
    safeSet('api-url', config.baseUrl || API_PRESETS[config.provider] || '');
    safeSet('api-key', config.apiKey || '');
    safeSet('api-model', config.model || '');
    safeSet('api-model-custom', config.model || '');

    const urlGroup = document.getElementById('api-url-group');
    if (urlGroup) {
        urlGroup.style.display = (config.provider === 'openai_compat') ? '' : 'none';
    }

    const modelSelect = document.getElementById('api-model-select');
    if (modelSelect) modelSelect.innerHTML = '<option value="">- 请先获取模型列表 -</option>';
    
    App.apiConfig = config;
}

function saveApiConfig() {
    const nameEl = document.getElementById('api-name');
    const providerEl = document.getElementById('api-provider');
    const urlEl = document.getElementById('api-url');
    const keyEl = document.getElementById('api-key');
    const customModelEl = document.getElementById('api-model-custom');
    const hiddenModelEl = document.getElementById('api-model');
    
    const config = {
        name: nameEl ? nameEl.value : '',
        provider: providerEl ? providerEl.value : 'zhipu',
        baseUrl: urlEl ? urlEl.value : '',
        apiKey: keyEl ? keyEl.value : '',
        model: (customModelEl ? customModelEl.value : '') || (hiddenModelEl ? hiddenModelEl.value : '')
    };

    localStorage.setItem('genesis_api_config', JSON.stringify(config));
    App.apiConfig = config;

    const modal = document.getElementById('api-modal');
    if (modal) modal.classList.add('hidden');

    showNotification('API 配置已保存', 'success');
    broadcastApiChange(config);
}

function broadcastApiChange(config) {
    const apiConfig = config || App.apiConfig;
    document.querySelectorAll('iframe[data-src]').forEach(iframe => {
        if (iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                type: 'api-config-update',
                config: apiConfig
            }, '*');
        }
    });
    console.log('API 配置已广播到所有子窗口');
}

function getUnifiedApiConfig() {
    return App.apiConfig || JSON.parse(localStorage.getItem('genesis_api_config') || '{}');
}

// ═══════════════════════════════════════════════════════════════
// 图书馆模块
// ═══════════════════════════════════════════════════════════════

function initializeLibraryPanel() {
    const panel = document.getElementById('library-panel');
    if (!panel) return;
    
    panel.innerHTML = `
        <div class="document-panel">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="color: var(--primary-color);"><i class="fas fa-book-bookmark"></i> 图书馆与阅读中心</h3>
                <div style="display: flex; gap: 10px;">
                    <button id="add-book-btn" class="action-btn"><i class="fas fa-plus"></i> 添加书籍</button>
                    <label class="settings-btn" style="cursor: pointer; margin: 0;">
                        <i class="fas fa-file-import"></i> 导入
                        <input type="file" id="import-book-file" accept=".txt,.md,.json" style="display: none;">
                    </label>
                </div>
            </div>
            
            <div id="library-stats" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px;">
                <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05)); padding: 15px; border-radius: 12px; text-align: center; border: 1px solid rgba(59, 130, 246, 0.2);">
                    <div style="font-size: 28px; color: #3b82f6;" id="lib-stat-books">0</div>
                    <div style="font-size: 12px; color: var(--text-muted);">总书籍</div>
                </div>
                <div style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(168, 85, 247, 0.05)); padding: 15px; border-radius: 12px; text-align: center; border: 1px solid rgba(168, 85, 247, 0.2);">
                    <div style="font-size: 28px; color: #a855f7;" id="lib-stat-words">0</div>
                    <div style="font-size: 12px; color: var(--text-muted);">总字数</div>
                </div>
                <div style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05)); padding: 15px; border-radius: 12px; text-align: center; border: 1px solid rgba(34, 197, 94, 0.2);">
                    <div style="font-size: 28px; color: #22c55e;" id="lib-stat-notes">0</div>
                    <div style="font-size: 12px; color: var(--text-muted);">笔记</div>
                </div>
                <div style="background: linear-gradient(135deg, rgba(234, 179, 8, 0.1), rgba(234, 179, 8, 0.05)); padding: 15px; border-radius: 12px; text-align: center; border: 1px solid rgba(234, 179, 8, 0.2);">
                    <div style="font-size: 28px; color: #eab308;" id="lib-stat-recent">0</div>
                    <div style="font-size: 12px; color: var(--text-muted);">本周阅读</div>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <input type="text" id="library-search" placeholder="搜索书籍或内容..." style="flex: 1; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color);">
                <select id="library-sort" style="padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color);">
                    <option value="lastRead">最近阅读</option>
                    <option value="name">名称排序</option>
                    <option value="ts">添加时间</option>
                    <option value="wordCount">字数排序</option>
                </select>
            </div>
            
            <div id="library-book-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; max-height: 500px; overflow-y: auto;"></div>
            
            <div id="library-reader-modal" class="modal-overlay hidden" style="z-index: 2500;">
                <div class="modal-content" style="width: 90%; max-width: 900px; max-height: 90vh; display: flex; flex-direction: column;">
                    <div class="modal-header" style="flex-shrink: 0;">
                        <h3 id="reader-title">阅读器</h3>
                        <button class="close-btn" onclick="closeLibraryReader()">&times;</button>
                    </div>
                    <div id="reader-toolbar" style="display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--border-color); flex-shrink: 0;">
                        <button class="settings-btn" onclick="libraryReaderNavigate(-1)"><i class="fas fa-chevron-left"></i> 上一页</button>
                        <span id="reader-progress" style="flex: 1; text-align: center; line-height: 36px; color: var(--text-muted);">0%</span>
                        <button class="settings-btn" onclick="libraryReaderNavigate(1)">下一页 <i class="fas fa-chevron-right"></i></button>
                        <button class="settings-btn" onclick="addLibraryBookmark()"><i class="fas fa-bookmark"></i></button>
                        <button class="settings-btn" onclick="addLibraryNote()"><i class="fas fa-sticky-note"></i></button>
                    </div>
                    <div id="reader-content" style="flex: 1; overflow-y: auto; padding: 20px 0; line-height: 1.8; font-size: 16px; white-space: pre-wrap;"></div>
                </div>
            </div>
        </div>
    `;
    
    const addBtn = document.getElementById('add-book-btn');
    const importFile = document.getElementById('import-book-file');
    const searchInput = document.getElementById('library-search');
    const sortSelect = document.getElementById('library-sort');
    
    if (addBtn) addBtn.addEventListener('click', addNewLibraryBook);
    if (importFile) importFile.addEventListener('change', handleLibraryImport);
    if (searchInput) searchInput.addEventListener('input', renderLibraryBooks);
    if (sortSelect) sortSelect.addEventListener('change', renderLibraryBooks);
    
    renderLibraryBooks();
}

async function addNewLibraryBook() {
    const title = prompt('请输入书籍名称:');
    if (!title || !title.trim()) return;
    
    const content = prompt('请输入书籍内容 (或留空稍后编辑):') || '';
    
    if (typeof LibrarySystem !== 'undefined') {
        await LibrarySystem.addBook(title.trim(), content, 'txt', { author: App.user?.username || '未知' });
        renderLibraryBooks();
        showNotification('书籍已添加', 'success');
    }
}

async function handleLibraryImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (typeof LibrarySystem !== 'undefined') {
        try {
            await LibrarySystem.importFile(file);
            renderLibraryBooks();
        } catch (err) {
            showNotification('导入失败: ' + err.message, 'error');
        }
    }
    e.target.value = '';
}

function renderLibraryBooks() {
    const listDiv = document.getElementById('library-book-list');
    const searchInput = document.getElementById('library-search');
    const sortSelect = document.getElementById('library-sort');
    
    if (!listDiv || typeof LibrarySystem === 'undefined') {
        if (listDiv) listDiv.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-muted);">图书馆系统未初始化</p>';
        return;
    }
    
    const query = searchInput?.value?.trim() || '';
    const sortBy = sortSelect?.value || 'lastRead';
    
    let books = query ? LibrarySystem.searchBooks(query) : LibrarySystem.getAllBooks(sortBy);
    
    if (books.length === 0) {
        listDiv.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
                <i class="fas fa-book-open" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                <p>图书馆暂无书籍</p>
                <p style="font-size: 12px; margin-top: 10px;">点击"添加书籍"或"导入"开始阅读之旅</p>
            </div>
        `;
    } else {
        listDiv.innerHTML = books.map(book => `
            <div class="book-card" data-id="${book.id}" style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.3s ease; position: relative;">
                <div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 5px;">
                    <button class="book-action-btn" onclick="event.stopPropagation(); deleteLibraryBook('${book.id}')" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 5px;"><i class="fas fa-trash"></i></button>
                </div>
                <h4 style="margin: 0 0 10px 0; color: var(--text-color); font-size: 16px; padding-right: 60px;">${book.name}</h4>
                <div style="display: flex; gap: 15px; font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">
                    <span><i class="fas fa-file-word"></i> ${(book.wordCount || 0).toLocaleString()} 字</span>
                    <span><i class="fas fa-list"></i> ${book.chapterCount || 0} 章</span>
                </div>
                <div style="background: var(--border-color); height: 4px; border-radius: 2px; overflow: hidden; margin-bottom: 10px;">
                    <div style="background: var(--primary-color); height: 100%; width: ${book.readProgress || 0}%; transition: width 0.3s;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted);">
                    <span>阅读进度: ${book.readProgress || 0}%</span>
                    <span>${book.lastRead ? new Date(book.lastRead).toLocaleDateString() : '未阅读'}</span>
                </div>
            </div>
        `).join('');
        
        listDiv.querySelectorAll('.book-card').forEach(card => {
            card.addEventListener('click', () => openLibraryReader(card.dataset.id));
            card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-3px)');
            card.addEventListener('mouseleave', () => card.style.transform = '');
        });
    }
    
    updateLibraryStats();
}

async function openLibraryReader(bookId) {
    if (typeof LibrarySystem === 'undefined') return;
    
    const book = await LibrarySystem.openBook(bookId);
    if (!book) {
        showNotification('无法打开书籍', 'error');
        return;
    }
    
    const modal = document.getElementById('library-reader-modal');
    const titleEl = document.getElementById('reader-title');
    const contentEl = document.getElementById('reader-content');
    const progressEl = document.getElementById('reader-progress');
    
    if (modal && titleEl && contentEl) {
        titleEl.textContent = book.name;
        contentEl.textContent = LibrarySystem.getContentChunk(3000);
        progressEl.textContent = LibrarySystem.getProgress() + '%';
        modal.classList.remove('hidden');
    }
}

function closeLibraryReader() {
    const modal = document.getElementById('library-reader-modal');
    if (modal) modal.classList.add('hidden');
    if (typeof LibrarySystem !== 'undefined') LibrarySystem.closeBook();
}

function libraryReaderNavigate(delta) {
    if (typeof LibrarySystem === 'undefined') return;
    
    const contentEl = document.getElementById('reader-content');
    const progressEl = document.getElementById('reader-progress');
    
    if (contentEl && progressEl) {
        contentEl.textContent = LibrarySystem.navigate(delta, 3000);
        progressEl.textContent = LibrarySystem.getProgress() + '%';
    }
}

function addLibraryBookmark() {
    if (typeof LibrarySystem === 'undefined') return;
    
    const bookmark = LibrarySystem.addBookmark();
    if (bookmark) {
        showNotification('书签已添加', 'success');
    }
}

function addLibraryNote() {
    if (typeof LibrarySystem === 'undefined') return;
    
    const content = prompt('请输入笔记内容:');
    if (content && content.trim()) {
        LibrarySystem.addNote(null, LibrarySystem._currentPosition, content.trim());
        showNotification('笔记已添加', 'success');
    }
}

async function deleteLibraryBook(bookId) {
    if (!confirm('确定要删除这本书吗？')) return;
    
    if (typeof LibrarySystem !== 'undefined') {
        await LibrarySystem.deleteBook(bookId);
        renderLibraryBooks();
        showNotification('书籍已删除', 'info');
    }
}

function updateLibraryStats() {
    if (typeof LibrarySystem === 'undefined') return;
    
    const stats = LibrarySystem.getStats();
    
    const updateStat = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = typeof value === 'number' ? value.toLocaleString() : value;
    };
    
    updateStat('lib-stat-books', stats.totalBooks || 0);
    updateStat('lib-stat-words', stats.totalWords || 0);
    updateStat('lib-stat-notes', stats.totalNotes || 0);
    updateStat('lib-stat-recent', stats.recentlyRead || 0);
}

// ═══════════════════════════════════════════════════════════════

function initializeKnowledgeBasePanels() {
    const panels = {
        'canon-panel': 'renderCanonPanel',
        'character-panel': 'renderCharacterSystemPanel',
        'archetype-panel': 'renderArchetypePanel',
        'plot-panel': 'renderPlotPanel',
        'emotion-panel': 'renderEmotionPanel'
    };

    for (const panelId in panels) {
        const renderFunc = window[panels[panelId]];
        const panel = document.getElementById(panelId);
        if (panel && typeof renderFunc === 'function') {
            panel.innerHTML = `<div id="${panelId}-content"></div>`;
            renderFunc();
        }
    }
    console.log('知识库面板已动态构建并初始化。');
}

function initializeDatabaseToggle() {
    const toggleBtn = document.getElementById('toggle-database-btn');
    const sidebarNav = document.getElementById('sidebar-nav');

    if (toggleBtn && sidebarNav) {
        toggleBtn.addEventListener('click', () => {
            const isHidden = sidebarNav.classList.toggle('database-panels-hidden');
            toggleBtn.classList.toggle('active', !isHidden);
            localStorage.setItem('database_panels_hidden', isHidden);
            toggleBtn.title = isHidden ? '显示资料库' : '隐藏资料库';
        });

        const isHidden = localStorage.getItem('database_panels_hidden') === 'true';
        sidebarNav.classList.toggle('database-panels-hidden', isHidden);
        toggleBtn.classList.toggle('active', !isHidden);
        toggleBtn.title = isHidden ? '显示资料库' : '隐藏资料库';
    }
}

function initializeVectorPanel() {
    if (typeof initializeCharacterDeckSystem === 'function') {
        const panel = document.getElementById('vector-panel');
        if(panel) {
            panel.innerHTML = `
                <div class="document-panel">
                    <h3><i class="fas fa-atom"></i> 向量化核心记忆</h3>
                    <p>这里管理着故事的核心动态信息，为AI提供长期记忆。</p>
                    
                    <details open class="collapsible-section">
                        <summary><h4><i class="fas fa-users"></i> 核心人物状态池</h4></summary>
                        <div class="collapsible-content">
                            <div class="character-status-header">
                                 <p>管理故事中的核心人物，他们的状态会随着情节发展而动态变化。</p>
                                <button id="manage-character-cards-btn" class="action-btn"><i class="fas fa-plus"></i> 新建/管理人物卡</button>
                            </div>
                            <div id="character-deck-grid"></div>
                        </div>
                    </details>

                    <details class="collapsible-section">
                        <summary><h4><i class="fas fa-globe-asia"></i> 世界观设定状态变化</h4></summary>
                        <div class="collapsible-content">
                            <p>记录世界观中的动态元素，如组织派系力量消长、经济系统波动、核心规则的演变等。</p>
                            <div id="worldview-list" class="dynamic-item-list"></div>
                            <button class="settings-btn add-item-btn" data-type="worldview"><i class="fas fa-plus"></i> 添加设定</button>
                        </div>
                    </details>
                    
                    <details class="collapsible-section">
                        <summary><h4><i class="fas fa-puzzle-piece"></i> 铺垫与伏笔变化</h4></summary>
                        <div class="collapsible-content">
                            <p>追踪已埋下的伏笔及其状态（已揭示、未揭示、已转化），确保故事线索的连贯性。</p>
                            <div id="clues-list" class="dynamic-item-list"></div>
                            <button class="settings-btn add-item-btn" data-type="clue"><i class="fas fa-plus"></i> 添加伏笔</button>
                        </div>
                    </details>

                    <details class="collapsible-section">
                        <summary><h4><i class="fas fa-map-marked-alt"></i> 地图系统</h4></summary>
                        <div class="collapsible-content">
                             <p>管理故事发生的地理空间，包括地图图片、区域势力划分和关键地点标注。</p>
                             <div id="map-list" class="dynamic-item-list"></div>
                             <button class="settings-btn add-item-btn" data-type="map"><i class="fas fa-plus"></i> 添加地点</button>
                        </div>
                    </details>
                </div>
            `;
            initializeCharacterDeckSystem();
            const manageBtn = document.getElementById('manage-character-cards-btn');
            if (manageBtn) {
                manageBtn.addEventListener('click', () => {
                    if(typeof openCharacterModal === 'function') {
                        openCharacterModal();
                    }
                });
            }

            setupDynamicLists();

            console.log('向量库面板已动态构建并初始化。');
        }
    }
}

function setupDynamicLists() {
    const lists = [
        { type: 'worldview', containerId: 'worldview-list', placeholder: '新的世界观设定...' },
        { type: 'clue', containerId: 'clues-list', placeholder: '新的伏笔...' },
        { type: 'map', containerId: 'map-list', placeholder: '新的地点...' }
    ];

    lists.forEach(list => {
        if (!creationState[list.type]) {
            creationState[list.type] = [];
        }
        renderDynamicList(list.type, list.containerId);
    });

    document.querySelectorAll('.add-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.target.dataset.type;
            const listInfo = lists.find(l => l.type === type);
            const newItemText = prompt(`请输入新的内容:`, listInfo.placeholder);
            if (newItemText && newItemText.trim() !== '') {
                const newItem = { id: `item_${Date.now()}`, text: newItemText.trim() };
                creationState[type].push(newItem);
                renderDynamicList(type, listInfo.containerId);
            }
        });
    });
}

function renderDynamicList(type, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    const items = creationState[type] || [];
    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'dynamic-item';
        itemDiv.innerHTML = `
            <p>${item.text}</p>
            <div class="dynamic-item-actions">
                <button class="settings-btn edit-item-btn" data-id="${item.id}" data-type="${type}"><i class="fas fa-edit"></i></button>
                <button class="settings-btn delete-item-btn" data-id="${item.id}" data-type="${type}"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        container.appendChild(itemDiv);
    });

    container.querySelectorAll('.edit-item-btn').forEach(btn => {
        btn.addEventListener('click', handleEditItem);
    });
    container.querySelectorAll('.delete-item-btn').forEach(btn => {
        btn.addEventListener('click', handleDeleteItem);
    });
}

function handleEditItem(e) {
    const btn = e.currentTarget;
    const type = btn.dataset.type;
    const id = btn.dataset.id;
    const itemIndex = creationState[type].findIndex(i => i.id === id);
    if (itemIndex === -1) return;

    const currentText = creationState[type][itemIndex].text;
    const newText = prompt('编辑内容:', currentText);
    if (newText && newText.trim() !== '') {
        creationState[type][itemIndex].text = newText.trim();
        renderDynamicList(type, document.getElementById(`${type}-list`).id);
    }
}

function handleDeleteItem(e) {
    const btn = e.currentTarget;
    const type = btn.dataset.type;
    const id = btn.dataset.id;
    if (confirm('确定要删除此项吗？')) {
        creationState[type] = creationState[type].filter(i => i.id !== id);
        renderDynamicList(type, document.getElementById(`${type}-list`).id);
    }
}

// ═══════════════════════════════════════════════════════════════
// RAG 上下文面板
// ═══════════════════════════════════════════════════════════════

function initializeRAGPanel() {
    const panel = document.getElementById('rag-panel');
    if (!panel) return;
    
    panel.innerHTML = `
        <div class="document-panel">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="color: var(--primary-color);"><i class="fas fa-magnifying-glass-chart"></i> RAG 上下文检索</h3>
                <button id="rag-refresh-btn" class="action-btn"><i class="fas fa-sync-alt"></i> 刷新索引</button>
            </div>
            
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <input type="text" id="rag-search-input" placeholder="输入检索关键词..." style="flex: 1; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color); font-size: 14px;">
                <button id="rag-search-btn" class="action-btn" style="padding: 12px 20px;"><i class="fas fa-search"></i> 检索</button>
            </div>
            
            <div id="rag-source-filters" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
                <label style="display: flex; align-items: center; gap: 4px; padding: 6px 12px; background: var(--bg-color); border-radius: 20px; font-size: 12px; cursor: pointer;">
                    <input type="checkbox" value="chapter" checked> 章节
                </label>
                <label style="display: flex; align-items: center; gap: 4px; padding: 6px 12px; background: var(--bg-color); border-radius: 20px; font-size: 12px; cursor: pointer;">
                    <input type="checkbox" value="outline" checked> 大纲
                </label>
                <label style="display: flex; align-items: center; gap: 4px; padding: 6px 12px; background: var(--bg-color); border-radius: 20px; font-size: 12px; cursor: pointer;">
                    <input type="checkbox" value="entity" checked> 实体
                </label>
                <label style="display: flex; align-items: center; gap: 4px; padding: 6px 12px; background: var(--bg-color); border-radius: 20px; font-size: 12px; cursor: pointer;">
                    <input type="checkbox" value="memory" checked> 记忆
                </label>
                <label style="display: flex; align-items: center; gap: 4px; padding: 6px 12px; background: var(--bg-color); border-radius: 20px; font-size: 12px; cursor: pointer;">
                    <input type="checkbox" value="library"> 图书馆
                </label>
                <label style="display: flex; align-items: center; gap: 4px; padding: 6px 12px; background: var(--bg-color); border-radius: 20px; font-size: 12px; cursor: pointer;">
                    <input type="checkbox" value="vector"> 向量库
                </label>
            </div>
            
            <div id="rag-stats" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px;">
                <div style="background: var(--bg-color); padding: 12px; border-radius: 8px; text-align: center; border: 1px solid var(--border-color);">
                    <div style="font-size: 20px; color: var(--primary-color);" id="rag-stat-chapters">0</div>
                    <div style="font-size: 11px; color: var(--text-muted);">章节</div>
                </div>
                <div style="background: var(--bg-color); padding: 12px; border-radius: 8px; text-align: center; border: 1px solid var(--border-color);">
                    <div style="font-size: 20px; color: var(--secondary-color);" id="rag-stat-outlines">0</div>
                    <div style="font-size: 11px; color: var(--text-muted);">大纲</div>
                </div>
                <div style="background: var(--bg-color); padding: 12px; border-radius: 8px; text-align: center; border: 1px solid var(--border-color);">
                    <div style="font-size: 20px; color: var(--accent-color);" id="rag-stat-entities">0</div>
                    <div style="font-size: 11px; color: var(--text-muted);">实体</div>
                </div>
                <div style="background: var(--bg-color); padding: 12px; border-radius: 8px; text-align: center; border: 1px solid var(--border-color);">
                    <div style="font-size: 20px; color: var(--success-color);" id="rag-stat-vectors">0</div>
                    <div style="font-size: 11px; color: var(--text-muted);">向量</div>
                </div>
                <div style="background: var(--bg-color); padding: 12px; border-radius: 8px; text-align: center; border: 1px solid var(--border-color);">
                    <div style="font-size: 20px; color: var(--warning-color);" id="rag-stat-docs">0</div>
                    <div style="font-size: 11px; color: var(--text-muted);">文档</div>
                </div>
            </div>
            
            <div id="rag-results" style="max-height: 500px; overflow-y: auto;"></div>
        </div>
    `;
    
    const searchBtn = document.getElementById('rag-search-btn');
    const searchInput = document.getElementById('rag-search-input');
    const refreshBtn = document.getElementById('rag-refresh-btn');
    
    if (searchBtn) searchBtn.addEventListener('click', performRAGSearch);
    if (searchInput) searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performRAGSearch();
    });
    if (refreshBtn) refreshBtn.addEventListener('click', refreshRAGIndex);
    
    updateRAGStats();
}

async function performRAGSearch() {
    const input = document.getElementById('rag-search-input');
    const resultsDiv = document.getElementById('rag-results');
    const query = input?.value?.trim();
    
    if (!query || !resultsDiv) return;
    if (typeof RAGSystem === 'undefined') {
        resultsDiv.innerHTML = '<p style="color: var(--error-color);">RAG系统未初始化</p>';
        return;
    }
    
    const filters = [];
    document.querySelectorAll('#rag-source-filters input:checked').forEach(cb => {
        filters.push(cb.value);
    });
    
    resultsDiv.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> 检索中...</p>';
    
    try {
        const results = await RAGSystem.search(query, 20, filters);
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--text-muted);">未找到相关内容</p>';
            return;
        }
        
        const sourceColors = {
            chapter: 'var(--primary-color)',
            outline: 'var(--secondary-color)',
            entity: 'var(--accent-color)',
            memory: 'var(--warning-color)',
            library: 'var(--success-color)',
            vector: 'var(--info-color)',
            document: 'var(--text-muted)'
        };
        
        resultsDiv.innerHTML = results.map((r, i) => `
            <div style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="background: ${sourceColors[r.source] || 'var(--text-muted)'}20; color: ${sourceColors[r.source] || 'var(--text-muted)'}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">${r.source}</span>
                    <span style="font-size: 11px; color: var(--text-muted);">相关度: ${(r.score * 100).toFixed(0)}%</span>
                </div>
                <h4 style="margin: 0 0 8px 0; color: var(--text-color); font-size: 14px;">${r.title}</h4>
                <p style="margin: 0; color: var(--text-muted); font-size: 13px; line-height: 1.6;">${r.content}</p>
            </div>
        `).join('');
        
    } catch (e) {
        resultsDiv.innerHTML = `<p style="color: var(--error-color);">检索失败: ${e.message}</p>`;
    }
}

async function refreshRAGIndex() {
    if (typeof RAGSystem === 'undefined') return;
    showNotification('正在刷新索引...', 'info');
    await RAGSystem._loadDocuments();
    updateRAGStats();
    showNotification('索引已刷新', 'success');
}

async function updateRAGStats() {
    if (typeof RAGSystem === 'undefined') return;
    const stats = await RAGSystem.getSourceStats();
    
    const updateStat = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    
    updateStat('rag-stat-chapters', stats.chapters || 0);
    updateStat('rag-stat-outlines', stats.outlines || 0);
    updateStat('rag-stat-entities', stats.entities || 0);
    updateStat('rag-stat-vectors', stats.vectors || 0);
    updateStat('rag-stat-docs', stats.documents || 0);
}

// ═══════════════════════════════════════════════════════════════
// 三层记忆面板
// ═══════════════════════════════════════════════════════════════

function initializeMemoryPanel() {
    const panel = document.getElementById('memory-panel');
    if (!panel) return;
    
    panel.innerHTML = `
        <div class="document-panel">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="color: var(--primary-color);"><i class="fas fa-brain"></i> 三层记忆系统</h3>
                <div style="display: flex; gap: 10px;">
                    <button id="memory-add-btn" class="action-btn"><i class="fas fa-plus"></i> 添加记忆</button>
                    <button id="memory-clear-btn" class="settings-btn"><i class="fas fa-trash"></i> 清空工作记忆</button>
                </div>
            </div>
            
            <div id="memory-stats" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px;">
                <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05)); padding: 15px; border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.2);">
                    <div style="font-size: 28px; color: #3b82f6;" id="memory-stat-working">0</div>
                    <div style="font-size: 12px; color: var(--text-muted);">工作记忆</div>
                    <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">临时存储，自动清理</div>
                </div>
                <div style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(168, 85, 247, 0.05)); padding: 15px; border-radius: 12px; border: 1px solid rgba(168, 85, 247, 0.2);">
                    <div style="font-size: 28px; color: #a855f7;" id="memory-stat-session">0</div>
                    <div style="font-size: 12px; color: var(--text-muted);">会话记忆</div>
                    <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">本次会话有效</div>
                </div>
                <div style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05)); padding: 15px; border-radius: 12px; border: 1px solid rgba(34, 197, 94, 0.2);">
                    <div style="font-size: 28px; color: #22c55e;" id="memory-stat-persistent">0</div>
                    <div style="font-size: 12px; color: var(--text-muted);">持久记忆</div>
                    <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">永久保存</div>
                </div>
                <div style="background: linear-gradient(135deg, rgba(234, 179, 8, 0.1), rgba(234, 179, 8, 0.05)); padding: 15px; border-radius: 12px; border: 1px solid rgba(234, 179, 8, 0.2);">
                    <div style="font-size: 28px; color: #eab308;" id="memory-stat-total">0</div>
                    <div style="font-size: 12px; color: var(--text-muted);">总计</div>
                    <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">所有记忆条目</div>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <input type="text" id="memory-search-input" placeholder="搜索记忆..." style="flex: 1; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color);">
                <select id="memory-category-filter" style="padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color);">
                    <option value="all">全部分类</option>
                    <option value="plot">剧情</option>
                    <option value="character">角色</option>
                    <option value="world">世界观</option>
                    <option value="style">风格</option>
                    <option value="foreshadow">伏笔</option>
                    <option value="timeline">时间线</option>
                </select>
            </div>
            
            <div id="memory-list" style="max-height: 500px; overflow-y: auto;"></div>
        </div>
    `;
    
    const addBtn = document.getElementById('memory-add-btn');
    const clearBtn = document.getElementById('memory-clear-btn');
    const searchInput = document.getElementById('memory-search-input');
    const categoryFilter = document.getElementById('memory-category-filter');
    
    if (addBtn) addBtn.addEventListener('click', addNewMemory);
    if (clearBtn) clearBtn.addEventListener('click', clearWorkingMemory);
    if (searchInput) searchInput.addEventListener('input', renderMemoryList);
    if (categoryFilter) categoryFilter.addEventListener('change', renderMemoryList);
    
    renderMemoryList();
}

function addNewMemory() {
    const content = prompt('请输入记忆内容:');
    if (!content || !content.trim()) return;
    
    const category = prompt('请输入分类 (plot/character/world/style/foreshadow/timeline/note):', 'note') || 'note';
    const importance = parseInt(prompt('重要程度 1-5:', '3') || '3');
    
    if (typeof MemorySystem !== 'undefined') {
        MemorySystem.addSession(content.trim(), category, importance);
        renderMemoryList();
        showNotification('记忆已添加', 'success');
    }
}

function clearWorkingMemory() {
    if (typeof MemorySystem === 'undefined') return;
    if (confirm('确定要清空工作记忆吗？')) {
        MemorySystem.clearWorking();
        renderMemoryList();
        showNotification('工作记忆已清空', 'info');
    }
}

function renderMemoryList() {
    const listDiv = document.getElementById('memory-list');
    const searchInput = document.getElementById('memory-search-input');
    const categoryFilter = document.getElementById('memory-category-filter');
    
    if (!listDiv || typeof MemorySystem === 'undefined') return;
    
    const query = searchInput?.value?.trim() || '';
    const category = categoryFilter?.value || 'all';
    
    let memories = MemorySystem.getAll(50);
    
    if (query) {
        memories = memories.filter(m => m.content.toLowerCase().includes(query.toLowerCase()));
    }
    if (category !== 'all') {
        memories = memories.filter(m => m.category === category);
    }
    
    const layerColors = {
        working: '#3b82f6',
        session: '#a855f7',
        persistent: '#22c55e'
    };
    
    const categoryIcons = {
        plot: 'fa-sitemap',
        character: 'fa-user',
        world: 'fa-globe',
        style: 'fa-palette',
        foreshadow: 'fa-lightbulb',
        timeline: 'fa-clock',
        note: 'fa-sticky-note',
        other: 'fa-folder'
    };
    
    if (memories.length === 0) {
        listDiv.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-muted);">暂无记忆</p>';
    } else {
        listDiv.innerHTML = memories.map(m => `
            <div style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; margin-bottom: 8px; border-left: 3px solid ${layerColors[m.layer] || 'var(--text-muted)'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas ${categoryIcons[m.category] || 'fa-folder'}" style="color: var(--text-muted); font-size: 12px;"></i>
                        <span style="font-size: 11px; color: var(--text-muted);">${m.category}</span>
                        <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: ${layerColors[m.layer]}20; color: ${layerColors[m.layer]};">${m.layer}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 10px; color: var(--text-muted);">重要度: ${m.importance}</span>
                        <button class="memory-promote-btn" data-id="${m.id}" style="background: none; border: none; color: var(--primary-color); cursor: pointer; font-size: 12px;" title="提升"><i class="fas fa-arrow-up"></i></button>
                        <button class="memory-delete-btn" data-id="${m.id}" style="background: none; border: none; color: var(--error-color); cursor: pointer; font-size: 12px;" title="删除"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <p style="margin: 0; color: var(--text-color); font-size: 13px; line-height: 1.5;">${m.content}</p>
            </div>
        `).join('');
        
        listDiv.querySelectorAll('.memory-promote-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (MemorySystem.promoteToSession(id) || MemorySystem.promoteToPersistent(id)) {
                    renderMemoryList();
                    showNotification('记忆已提升', 'success');
                }
            });
        });
        
        listDiv.querySelectorAll('.memory-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('确定要删除这条记忆吗？')) {
                    MemorySystem.deleteMemory(btn.dataset.id);
                    renderMemoryList();
                    showNotification('记忆已删除', 'info');
                }
            });
        });
    }
    
    updateMemoryStats();
}

function updateMemoryStats() {
    if (typeof MemorySystem === 'undefined') return;
    const stats = MemorySystem.getStats();
    
    const updateStat = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    
    updateStat('memory-stat-working', stats.working || 0);
    updateStat('memory-stat-session', stats.session || 0);
    updateStat('memory-stat-persistent', stats.persistent || 0);
    updateStat('memory-stat-total', (stats.working || 0) + (stats.session || 0) + (stats.persistent || 0));
}

// 监听来自 iframe 的消息
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'get-auth') {
        event.source.postMessage({
            type: 'auth-response',
            user: App.user
        }, '*');
    }
    if (event.data && event.data.type === 'get-api-config') {
        event.source.postMessage({
            type: 'api-config-response',
            config: App.apiConfig
        }, '*');
    }
});

// 暴露全局 API
App.getApiConfig = getUnifiedApiConfig;
App.callApi = async function(prompt, isJsonMode = false) {
    const config = getUnifiedApiConfig();
    
    if (!config.apiKey) {
        throw new Error('请先在设置中配置 API Key');
    }

    const baseUrl = config.baseUrl || API_PRESETS[config.provider];
    const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

    const body = {
        model: config.model,
        messages: [{ role: 'user', content: prompt }]
    };

    if (isJsonMode) {
        body.response_format = { type: 'json_object' };
    }

    console.log(`正在使用 [${config.provider}] 服务进行AI交互...`);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API请求失败 (${response.status}): ${errorText.substring(0, 100)}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('未能从API响应中提取有效内容');
        }

        return content.trim();

    } catch (error) {
        console.error('API 调用失败:', error);
        showNotification(`AI交互失败: ${error.message}`, 'error');
        throw error;
    }
};