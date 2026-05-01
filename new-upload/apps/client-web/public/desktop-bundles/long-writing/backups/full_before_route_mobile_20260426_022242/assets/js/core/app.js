const App = {
    sidebarCollapsed: false,
    _ioCollapsed: false,
    _stopFlag: false,
    init: async () => {
        try { await DB.init(); } catch(e) { console.error(e); }
        App.nav('home');
    },
    toggleSidebar: () => {
        App.sidebarCollapsed = !App.sidebarCollapsed;
        const sb = document.querySelector('.sidebar');
        const icon = document.getElementById('sidebar-toggle-icon');
        if (sb) sb.classList.toggle('collapsed', App.sidebarCollapsed);
        if (icon) icon.className = App.sidebarCollapsed ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left';
        setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
    },
    toggleMobileMenu: () => {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('mobile-overlay');
        if (!sidebar || !overlay) return;
        sidebar.classList.toggle('open');
        sidebar.classList.toggle('mobile-open', sidebar.classList.contains('open'));
        overlay.classList.toggle('active');
        overlay.style.display = overlay.classList.contains('active') ? 'block' : '';
    },
    closeMobileMenu: () => {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('mobile-overlay');
        if (sidebar) sidebar.classList.remove('open', 'mobile-open');
        if (overlay) {
            overlay.classList.remove('active');
            overlay.style.display = '';
        }
    },
    
    // ===== Global IO Panel Controls =====
    toggleIO() {
        App._ioCollapsed = !App._ioCollapsed;
        const content = document.getElementById('io-content');
        const icon = document.getElementById('io-toggle-icon');
        if (content) content.style.display = App._ioCollapsed ? 'none' : 'block';
        if (icon) icon.className = App._ioCollapsed ? 'fa-solid fa-chevron-down text-dim text-xs' : 'fa-solid fa-chevron-up text-dim text-xs';
    },
    
    showProgress(label, current = 0, total = 0, showStop = true) {
        const section = document.getElementById('io-progress-section');
        const labelEl = document.getElementById('io-progress-label');
        const percentEl = document.getElementById('io-progress-percent');
        const barEl = document.getElementById('io-progress-bar');
        const currentEl = document.getElementById('io-progress-current');
        const stopBtn = document.getElementById('io-stop-btn');
        const indicator = document.getElementById('io-status-indicator');
        
        if (section) section.classList.remove('hidden');
        if (labelEl) labelEl.textContent = label;
        
        const percent = total > 0 ? Math.round((current / total) * 100) : 0;
        if (percentEl) percentEl.textContent = percent + '%';
        if (barEl) barEl.style.width = percent + '%';
        if (currentEl) currentEl.textContent = total > 0 ? `${current} / ${total}` : '';
        if (stopBtn) stopBtn.classList.toggle('hidden', !showStop);
        if (indicator) {
            indicator.className = 'w-2 h-2 rounded-full bg-green-400 animate-pulse';
        }
        
        App._stopFlag = false;
    },
    
    hideProgress() {
        const section = document.getElementById('io-progress-section');
        const indicator = document.getElementById('io-status-indicator');
        if (section) section.classList.add('hidden');
        if (indicator) indicator.className = 'w-2 h-2 rounded-full bg-dim';
    },
    
    logIO(message, type = 'info') {
        const logEl = document.getElementById('io-log');
        if (!logEl) return;
        
        const colors = {
            info: 'text-gray-400',
            success: 'text-green-400',
            error: 'text-red-400',
            warning: 'text-amber-400',
            input: 'text-blue-400',
            output: 'text-cyan-400'
        };
        
        const time = new Date().toLocaleTimeString();
        const line = document.createElement('div');
        line.className = colors[type] || 'text-gray-400';
        line.innerHTML = `<span class="text-white/30">[${time}]</span> ${message}`;
        
        if (logEl.children.length === 1 && logEl.children[0].textContent === '等待操作...') {
            logEl.innerHTML = '';
        }
        
        logEl.appendChild(line);
        logEl.scrollTop = logEl.scrollHeight;
    },
    
    clearIOLog() {
        const logEl = document.getElementById('io-log');
        if (logEl) logEl.innerHTML = '<div class="text-dim">等待操作...</div>';
    },
    
    stopOperation() {
        App._stopFlag = true;
        App.logIO('用户请求停止操作...', 'warning');
        const stopBtn = document.getElementById('io-stop-btn');
        if (stopBtn) {
            stopBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>停止中...';
            stopBtn.disabled = true;
        }
    },
    
    isStopped() {
        return App._stopFlag;
    },
    
    resetStop() {
        App._stopFlag = false;
        const stopBtn = document.getElementById('io-stop-btn');
        if (stopBtn) {
            stopBtn.innerHTML = '<i class="fa-solid fa-stop mr-1"></i>停止';
            stopBtn.disabled = false;
        }
    },
    
    _currentModule: null,
    nav: (mod) => {
        App._currentModule = mod;
        App.closeMobileMenu();
        document.querySelectorAll('.sidebar-item').forEach(e => e.classList.remove('active'));
        const el = document.querySelector(`.sidebar-item[onclick="App.nav('${mod}')"]`);
        if(el) el.classList.add('active');

        // Update mobile title
        const titleMap = {
            home:'创世中心', project_manager:'项目管理', phoenix:'凤凰创作流', writer:'长篇执笔',
            world_engine:'世界引擎', creative_studio:'创意工坊',
            workshop:'万能工坊', tools_center:'工具中心',
            reader_center:'阅读中心', web_chat:'网页对话',
            settings:'系统设置',
            fusion_book:'融合拆书', fusion_workbench:'拆书工作台', rag_context:'RAG 上下文', memory_system:'三层记忆'
        };
        const mt = document.getElementById('mobile-title');
        if(mt) mt.textContent = titleMap[mod] || mod;
        
        const vp = document.getElementById('viewport');
        
        // Keep-Alive Logic: Hide all existing views instead of clearing innerHTML
        Array.from(vp.children).forEach(child => {
            child.style.display = 'none';
        });

        let view = document.getElementById(`module-view-${mod}`);
        
        if (!view) {
            // Create new view if it doesn't exist
            view = document.createElement('div');
            view.id = `module-view-${mod}`;
            view.className = 'module-view w-full h-full animate-fade-in';
            view.innerHTML = Modules[mod] ? Modules[mod].render() : `<div class="flex center h-full text-dim font-mono text-lg animate-pulse">Module [${mod}] Initializing...</div>`;
            vp.appendChild(view);
            
            // Initialize module only once
            if(Modules[mod] && Modules[mod].init) {
                try {
                    Modules[mod].init();
                } catch(e) {
                    console.error(`Error initializing module ${mod}:`, e);
                }
            }
        }
        
        // Show the requested view
        view.classList.add('module-view');
        view.style.display = 'block';
        if (typeof MobileEngine !== 'undefined' && MobileEngine.isMobile && MobileEngine.isMobile()) {
            view.scrollTop = 0;
            if (vp) vp.scrollTop = 0;
        }
        
        // Trigger resize to fix layout issues (charts, canvas)
        setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
        if (typeof MobileEngine !== 'undefined') {
            MobileEngine.updateBottomNavActive(mod);
            MobileEngine._closeSidebar();
        }
    }
};

window.onload = App.init;
