// ═══════════════════════════════════════════════════════════════
// QuantAlpha Pro - 应用入口
// ═══════════════════════════════════════════════════════════════

const App = {
    sidebarCollapsed: false,
    _currentModule: 'home',
    
    // ═══ 初始化 ═══
    init: async () => {
        try {
            // 初始化数据库
            await DB.init();
            
            // 初始化AI配置
            await AI.init();
            
            // 导航到首页
            App.nav('home');
            
            console.log('QuantAlpha Pro 初始化完成');
        } catch (e) {
            console.error('初始化失败:', e);
        }
    },
    
    // ═══ 导航 ═══
    nav: (mod) => {
        App._currentModule = mod;
        App.closeMobileMenu();
        
        // 更新侧边栏激活状态
        document.querySelectorAll('.sidebar-item').forEach(e => e.classList.remove('active'));
        const el = document.querySelector(`.sidebar-item[onclick="App.nav('${mod}')"]`);
        if (el) el.classList.add('active');
        
        // 更新移动端标题
        const titleMap = {
            home: '量化中心',
            strategy: '策略工作台',
            backtest: '回测引擎',
            data_analysis: '数据分析',
            factors: '因子研究',
            portfolio: '组合管理',
            risk: '风控系统',
            ai_assistant: 'AI量化助手',
            code_lab: '代码实验室',
            report: '研报中心',
            market_monitor: '行情监控',
            news: '资讯中心',
            settings: '系统设置'
        };
        
        const mt = document.getElementById('mobile-title');
        if (mt) mt.textContent = titleMap[mod] || mod;
        
        const vp = document.getElementById('viewport');
        
        // Keep-Alive 逻辑：隐藏所有现有视图
        Array.from(vp.children).forEach(child => {
            child.style.display = 'none';
        });
        
        let view = document.getElementById(`module-view-${mod}`);
        
        if (!view) {
            // 创建新视图
            view = document.createElement('div');
            view.id = `module-view-${mod}`;
            view.className = 'w-full h-full animate-fade-in';
            view.innerHTML = Modules[mod] 
                ? Modules[mod].render() 
                : `<div class="flex center h-full text-dim font-mono text-lg animate-pulse">Module [${mod}] Loading...</div>`;
            vp.appendChild(view);
            
            // 初始化模块
            if (Modules[mod] && Modules[mod].init) {
                try {
                    Modules[mod].init();
                } catch (e) {
                    console.error(`Error initializing module ${mod}:`, e);
                }
            }
        }
        
        // 显示视图
        view.style.display = 'block';
        
        // 触发resize修复布局
        setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    },
    
    // ═══ 侧边栏 ═══
    toggleSidebar: () => {
        App.sidebarCollapsed = !App.sidebarCollapsed;
        const sb = document.querySelector('.sidebar');
        const icon = document.getElementById('sidebar-toggle-icon');
        
        if (sb) sb.classList.toggle('collapsed', App.sidebarCollapsed);
        if (icon) {
            icon.className = App.sidebarCollapsed 
                ? 'fa-solid fa-angles-right' 
                : 'fa-solid fa-angles-left';
        }
        
        setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
    },
    
    // ═══ 移动端菜单 ═══
    toggleMobileMenu: () => {
        document.querySelector('.sidebar')?.classList.toggle('open');
        document.getElementById('mobile-overlay')?.classList.toggle('active');
    },
    
    closeMobileMenu: () => {
        document.querySelector('.sidebar')?.classList.remove('open');
        document.getElementById('mobile-overlay')?.classList.remove('active');
    }
};

// 启动应用
window.onload = App.init;