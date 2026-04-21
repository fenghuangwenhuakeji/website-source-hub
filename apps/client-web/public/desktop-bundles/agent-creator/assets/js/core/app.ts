declare const DB: {
    init: () => Promise<any>;
};

declare const UI: {
    toast: (message: string, type?: string) => void;
};

declare const Modules: Record<string, { render: () => string; init?: () => void }>;

declare const AgentConfigs: {
    getAllAgents: () => Array<{ id: string; name: string; description: string }>;
};

const App = {
    sidebarCollapsed: false,
    _ioCollapsed: false,
    _stopFlag: false,
    _dbReady: false,
    _currentModule: null as string | null,

    init: async () => {
        try {
            const db = await DB.init();
            if (db) {
                App._dbReady = true;
                console.log('✓ 数据库初始化完成');
            } else {
                console.error('数据库初始化返回 null');
                UI.toast('数据库初始化失败，请刷新页面重试', 'error');
                return;
            }
        } catch (e) {
            console.error('数据库初始化失败:', e);
            UI.toast('数据库初始化失败，请刷新页面重试', 'error');
            return;
        }
        App.nav('home');
    },

    isDbReady: () => App._dbReady,

    toggleSidebar: () => {
        App.sidebarCollapsed = !App.sidebarCollapsed;
        const sb = document.querySelector('.sidebar');
        const icon = document.getElementById('sidebar-toggle-icon');
        if (sb) sb.classList.toggle('collapsed', App.sidebarCollapsed);
        if (icon) icon.className = App.sidebarCollapsed ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left';
        setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
    },

    toggleMobileMenu: () => {
        document.querySelector('.sidebar')?.classList.toggle('open');
        document.getElementById('mobile-overlay')?.classList.toggle('active');
    },

    closeMobileMenu: () => {
        document.querySelector('.sidebar')?.classList.remove('open');
        document.getElementById('mobile-overlay')?.classList.remove('active');
    },

    toggleIO() {
        App._ioCollapsed = !App._ioCollapsed;
        const content = document.getElementById('io-content');
        const icon = document.getElementById('io-toggle-icon');
        if (content) content.style.display = App._ioCollapsed ? 'none' : 'block';
        if (icon) icon.className = App._ioCollapsed ? 'fa-solid fa-chevron-down text-dim text-xs' : 'fa-solid fa-chevron-up text-dim text-xs';
    },

    showProgress(label: string, current: number = 0, total: number = 0, showStop: boolean = true) {
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

    logIO(message: string, type: string = 'info') {
        const logEl = document.getElementById('io-log');
        if (!logEl) return;

        const colors: Record<string, string> = {
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
        line.innerHTML = `<span class="text-gray-800/30">[${time}]</span> ${message}`;

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
            (stopBtn as HTMLButtonElement).disabled = true;
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
            (stopBtn as HTMLButtonElement).disabled = false;
        }
    },

    getTitleMap: (): Record<string, string> => {
        const baseTitleMap: Record<string, string> = {
            home: '创世中心',
            reader_center: '阅读中心',
            settings: '系统设置',
            novella_writer: '中篇创作',
            rag_context: 'RAG 上下文',
            memory_system: '三层记忆'
        };

        if (typeof AgentConfigs !== 'undefined') {
            const agents = AgentConfigs.getAllAgents();
            agents.forEach(agent => {
                baseTitleMap[agent.id] = agent.name;
            });
        }

        return baseTitleMap;
    },

    nav: (mod: string) => {
        App._currentModule = mod;
        App.closeMobileMenu();
        document.querySelectorAll('.sidebar-item').forEach(e => e.classList.remove('active'));
        const el = document.querySelector(`.sidebar-item[onclick="App.nav('${mod}')"]`);
        if (el) el.classList.add('active');

        const titleMap = App.getTitleMap();
        const mt = document.getElementById('mobile-title');
        if (mt) mt.textContent = titleMap[mod] || mod;

        const vp = document.getElementById('viewport');

        Array.from(vp?.children || []).forEach(child => {
            (child as HTMLElement).style.display = 'none';
        });

        let view = document.getElementById(`module-view-${mod}`);

        if (!view) {
            view = document.createElement('div');
            view.id = `module-view-${mod}`;
            view.className = 'w-full h-full animate-fade-in';
            view.innerHTML = Modules[mod]
                ? Modules[mod].render()
                : `<div class="flex center h-full text-dim font-mono text-lg animate-pulse">Module [${mod}] Initializing...</div>`;
            vp?.appendChild(view);

            if (Modules[mod] && Modules[mod].init) {
                try {
                    Modules[mod].init!();
                } catch (e) {
                    console.error(`Error initializing module ${mod}:`, e);
                }
            }
        }

        (view as HTMLElement).style.display = 'block';

        setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    }
};

(window as any).App = App;
window.onload = App.init;
