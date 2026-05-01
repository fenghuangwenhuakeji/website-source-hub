// ═══════════════════════════════════════════════════════════════
// Mobile Engine v1.0 — 全局移动端引擎
// 职责:
//   1. 设备检测 (mobile/tablet/touch/landscape)
//   2. 虚拟键盘适配 (visualViewport)
//   3. 手势支持 (swipe/edge-swipe)
//   4. 底部导航栏管理
//   5. 模块级移动端降级接口
//   6. 横屏/旋转适配
// ═══════════════════════════════════════════════════════════════
const MobileEngine = {
    VERSION: '1.0',
    _state: { isMobile: false, isTablet: false, isTouch: false, isLandscape: false, keyboardOpen: false, sidebarOpen: false },
    _listeners: [],
    _swipeStart: null,
    _bottomNavModules: [
        { id: 'home', icon: 'fa-dragon', label: '首页' },
        { id: 'project_manager', icon: 'fa-layer-group', label: '项目' },
        { id: 'writer', icon: 'fa-pen-nib', label: '写作' },
        { id: 'web_chat', icon: 'fa-comments', label: '对话' },
        { id: 'settings', icon: 'fa-gear', label: '设置' }
    ],

    init() {
        this._updateState();
        this._bindEvents();
        this._initVisualViewport();
        this._initSwipeGestures();
        this._renderBottomNav();
        console.log('[MobileEngine] initialized', this._state);
    },

    // ═══ 设备检测 ═══
    _updateState() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this._state.isMobile = w <= 768;
        this._state.isTablet = w > 768 && w <= 1024;
        this._state.isTouch = window.matchMedia('(pointer: coarse)').matches;
        this._state.isLandscape = w > h;
        document.body.setAttribute('data-mobile', this._state.isMobile);
        document.body.setAttribute('data-tablet', this._state.isTablet);
        document.body.setAttribute('data-touch', this._state.isTouch);
        document.body.setAttribute('data-landscape', this._state.isLandscape);
    },
    isMobile() { return this._state.isMobile; },
    isTablet() { return this._state.isTablet; },
    isTouch() { return this._state.isTouch; },
    isLandscape() { return this._state.isLandscape; },
    isKeyboardOpen() { return this._state.keyboardOpen; },
    getState() { return { ...this._state }; },

    // ═══ 事件绑定 ═══
    _bindEvents() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this._updateState();
                this._renderBottomNav();
                this._emit('resize', this._state);
            }, 150);
        });
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this._updateState();
                this._emit('orientationchange', this._state);
            }, 300);
        });
    },

    on(event, cb) { this._listeners.push({ event, cb }); },
    off(event, cb) { this._listeners = this._listeners.filter(l => !(l.event === event && l.cb === cb)); },
    _emit(event, data) { this._listeners.filter(l => l.event === event).forEach(l => l.cb(data)); },

    // ═══ VisualViewport 键盘适配 ═══
    _initVisualViewport() {
        const vv = window.visualViewport;
        if (!vv) return;
        let keyboardTimer;
        vv.addEventListener('resize', () => {
            clearTimeout(keyboardTimer);
            keyboardTimer = setTimeout(() => {
                const h = window.innerHeight;
                const vh = vv.height;
                const keyboardOpen = h - vh > 100;
                this._state.keyboardOpen = keyboardOpen;
                this._adjustForKeyboard(keyboardOpen, vv);
            }, 100);
        });
    },

    _adjustForKeyboard(open, vv) {
        const focused = document.activeElement;
        const isInput = focused && (focused.tagName === 'TEXTAREA' || focused.tagName === 'INPUT');
        if (open && isInput) {
            // 滚动输入框到可视区域
            focused.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // 收起底部导航栏
            const nav = document.getElementById('mobile-bottom-nav');
            if (nav) nav.style.transform = 'translateY(100%)';
        } else {
            const nav = document.getElementById('mobile-bottom-nav');
            if (nav) nav.style.transform = 'translateY(0)';
        }
        this._emit('keyboard', { open, viewport: vv });
    },

    // ═══ 手势支持 ═══
    _initSwipeGestures() {
        let startX, startY, startTime;
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
        }, { passive: true });
        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            const dx = e.changedTouches[0].clientX - startX;
            const dy = e.changedTouches[0].clientY - startY;
            const dt = Date.now() - startTime;
            if (dt > 500) return;
            const absDx = Math.abs(dx), absDy = Math.abs(dy);
            if (absDx < 50 || absDy > absDx * 1.5) return;
            if (dx > 80 && startX < 30) {
                // 从左侧边缘右滑 → 打开侧边栏
                this._openSidebar();
            } else if (dx < -80) {
                // 左滑 → 关闭侧边栏
                this._closeSidebar();
            }
            startX = startY = null;
        }, { passive: true });
    },

    _openSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) { sidebar.classList.add('mobile-open'); this._state.sidebarOpen = true; }
        const overlay = document.getElementById('mobile-overlay');
        if (overlay) overlay.style.display = 'block';
    },
    _closeSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) { sidebar.classList.remove('mobile-open'); this._state.sidebarOpen = false; }
        const overlay = document.getElementById('mobile-overlay');
        if (overlay) overlay.style.display = 'none';
    },

    // ═══ 底部导航栏 ═══
    _renderBottomNav() {
        let nav = document.getElementById('mobile-bottom-nav');
        const shouldShow = this._state.isMobile && !this._state.keyboardOpen;
        if (!shouldShow) {
            if (nav) nav.style.display = 'none';
            return;
        }
        const currentModule = window._currentModule || 'home';
        if (!nav) {
            nav = document.createElement('div');
            nav.id = 'mobile-bottom-nav';
            nav.className = 'mobile-bottom-nav';
            document.body.appendChild(nav);
        }
        nav.style.display = 'flex';
        nav.innerHTML = this._bottomNavModules.map(m => `
            <button class="mobile-nav-item ${currentModule === m.id ? 'active' : ''}" onclick="App.nav('${m.id}')">
                <i class="fa-solid ${m.icon}"></i>
                <span>${m.label}</span>
            </button>
        `).join('');
    },
    updateBottomNavActive(moduleId) {
        window._currentModule = moduleId;
        this._renderBottomNav();
    },

    // ═══ 模块降级接口 ═══
    getMobileConfig(moduleName) {
        const configs = {
            world_engine: { disable3D: true, maxGraphNodes: 50, chartDataZoom: true },
            writer: { collapsePanels: true, bottomToolbar: true, keyboardAware: true },
            web_chat: { keyboardAware: true, tapToDismiss: true },
            phoenix: { simplifyUI: true, singleColumn: true },
            fusion_book: { simplifyUI: true, singleColumn: true },
            project_manager: { cardGrid: '2cols' },
            settings: { accordion: true }
        };
        return configs[moduleName] || {};
    },

    // ═══ 触摸反馈 ═══
    addTouchFeedback(el) {
        if (!this._state.isTouch || !el) return;
        el.style.webkitTapHighlightColor = 'transparent';
        el.addEventListener('touchstart', () => el.style.opacity = '0.7', { passive: true });
        el.addEventListener('touchend', () => setTimeout(() => el.style.opacity = '', 100), { passive: true });
    },

    // ═══ Canvas DPR 限制 ═══
    limitDPR(canvas) {
        if (!this._state.isMobile) return;
        const dpr = Math.min(window.devicePixelRatio, 2);
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
    }
};

window.addEventListener('DOMContentLoaded', () => MobileEngine.init());
