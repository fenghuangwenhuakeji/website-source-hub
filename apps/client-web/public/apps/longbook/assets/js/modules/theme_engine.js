// ═══════════════════════════════════════════════════════════════
// Theme Engine v1.0 — 全局主题/样式/字体引擎
// 职责:
//   1. 管理多套预设主题 (暗金/暗蓝/暗紫/暗红/暗绿/亮色/sepia/高对比)
//   2. CSS变量动态注入与切换
//   3. 字体/排版管理
//   4. 个性化设置持久化
// ═══════════════════════════════════════════════════════════════
const ThemeEngine = {
    VERSION: '1.0',
    _currentTheme: 'dark_gold',
    _currentFont: 'system',
    _currentEditorFont: 'mono',
    _editorSize: 16,
    _editorLineHeight: 1.7,
    _sidebarWidth: 240,
    _borderRadius: 'medium',
    _glassEffect: true,
    _animSpeed: 'normal',

    // ★ 主题定义 — 每套主题覆盖完整的CSS变量集
    THEMES: {
        dark_gold: {
            label: '暗金', icon: 'fa-crown', color: '#ffd700',
            vars: {
                '--bg-app': '#050505', '--bg-base': '#08080a', '--bg-elevated': '#0a0a0c',
                '--bg-overlay': '#0e0e10', '--bg-modal': '#111113', '--bg-card': '#0e0e12',
                '--bg-input': 'rgba(0,0,0,0.3)', '--bg-hover': 'rgba(255,255,255,0.05)',
                '--text-primary': '#f2f2f2', '--text-secondary': '#cccccc', '--text-muted': '#888888',
                '--text-disabled': '#555555', '--border-subtle': 'rgba(255,255,255,0.05)',
                '--border-default': 'rgba(255,255,255,0.08)', '--border-strong': 'rgba(255,255,255,0.15)',
                '--accent': '#ffd700', '--accent-rgb': '255,215,0', '--accent-soft': 'rgba(255,215,0,0.15)',
                '--accent-hover': '#ffea44', '--shadow': 'rgba(0,0,0,0.5)', '--glass': 'rgba(15,15,20,0.7)',
                '--scrollbar': 'rgba(255,255,255,0.1)', '--scrollbar-hover': 'rgba(255,255,255,0.2)',
                '--success': '#22c55e', '--warning': '#f59e0b', '--error': '#ef4444', '--info': '#3b82f6'
            }
        },
        dark_blue: {
            label: '暗蓝', icon: 'fa-water', color: '#3b82f6',
            vars: {
                '--bg-app': '#05070a', '--bg-base': '#080a10', '--bg-elevated': '#0a0d14',
                '--bg-overlay': '#0e121c', '--bg-modal': '#111524', '--bg-card': '#0e1218',
                '--bg-input': 'rgba(0,0,0,0.3)', '--bg-hover': 'rgba(255,255,255,0.05)',
                '--text-primary': '#f0f4ff', '--text-secondary': '#c8d4f0', '--text-muted': '#7a8ab0',
                '--text-disabled': '#4a5570', '--border-subtle': 'rgba(255,255,255,0.05)',
                '--border-default': 'rgba(255,255,255,0.08)', '--border-strong': 'rgba(255,255,255,0.15)',
                '--accent': '#3b82f6', '--accent-rgb': '59,130,246', '--accent-soft': 'rgba(59,130,246,0.15)',
                '--accent-hover': '#60a5fa', '--shadow': 'rgba(0,0,0,0.5)', '--glass': 'rgba(10,13,25,0.7)',
                '--scrollbar': 'rgba(255,255,255,0.1)', '--scrollbar-hover': 'rgba(255,255,255,0.2)',
                '--success': '#22c55e', '--warning': '#f59e0b', '--error': '#ef4444', '--info': '#60a5fa'
            }
        },
        dark_purple: {
            label: '暗紫', icon: 'fa-wand-magic-sparkles', color: '#a855f7',
            vars: {
                '--bg-app': '#080510', '--bg-base': '#0b0815', '--bg-elevated': '#0e0a1a',
                '--bg-overlay': '#120e1e', '--bg-modal': '#161224', '--bg-card': '#120e1a',
                '--bg-input': 'rgba(0,0,0,0.3)', '--bg-hover': 'rgba(255,255,255,0.05)',
                '--text-primary': '#f5f0ff', '--text-secondary': '#d4c8f0', '--text-muted': '#9a85b5',
                '--text-disabled': '#5a4a70', '--border-subtle': 'rgba(255,255,255,0.05)',
                '--border-default': 'rgba(255,255,255,0.08)', '--border-strong': 'rgba(255,255,255,0.15)',
                '--accent': '#a855f7', '--accent-rgb': '168,85,247', '--accent-soft': 'rgba(168,85,247,0.15)',
                '--accent-hover': '#c084fc', '--shadow': 'rgba(0,0,0,0.5)', '--glass': 'rgba(15,10,25,0.7)',
                '--scrollbar': 'rgba(255,255,255,0.1)', '--scrollbar-hover': 'rgba(255,255,255,0.2)',
                '--success': '#22c55e', '--warning': '#f59e0b', '--error': '#ef4444', '--info': '#c084fc'
            }
        },
        dark_red: {
            label: '暗红', icon: 'fa-fire', color: '#ef4444',
            vars: {
                '--bg-app': '#0a0505', '--bg-base': '#100808', '--bg-elevated': '#140a0a',
                '--bg-overlay': '#1a0e0e', '--bg-modal': '#1e1212', '--bg-card': '#1a0e10',
                '--bg-input': 'rgba(0,0,0,0.3)', '--bg-hover': 'rgba(255,255,255,0.05)',
                '--text-primary': '#fff0f0', '--text-secondary': '#f0c8c8', '--text-muted': '#b58585',
                '--text-disabled': '#705050', '--border-subtle': 'rgba(255,255,255,0.05)',
                '--border-default': 'rgba(255,255,255,0.08)', '--border-strong': 'rgba(255,255,255,0.15)',
                '--accent': '#ef4444', '--accent-rgb': '239,68,68', '--accent-soft': 'rgba(239,68,68,0.15)',
                '--accent-hover': '#f87171', '--shadow': 'rgba(0,0,0,0.5)', '--glass': 'rgba(25,10,10,0.7)',
                '--scrollbar': 'rgba(255,255,255,0.1)', '--scrollbar-hover': 'rgba(255,255,255,0.2)',
                '--success': '#22c55e', '--warning': '#f59e0b', '--error': '#ef4444', '--info': '#f87171'
            }
        },
        dark_green: {
            label: '暗绿', icon: 'fa-leaf', color: '#22c55e',
            vars: {
                '--bg-app': '#050a05', '--bg-base': '#081008', '--bg-elevated': '#0a140a',
                '--bg-overlay': '#0e1a0e', '--bg-modal': '#121e12', '--bg-card': '#0e1a10',
                '--bg-input': 'rgba(0,0,0,0.3)', '--bg-hover': 'rgba(255,255,255,0.05)',
                '--text-primary': '#f0fff0', '--text-secondary': '#c8f0c8', '--text-muted': '#85b585',
                '--text-disabled': '#507050', '--border-subtle': 'rgba(255,255,255,0.05)',
                '--border-default': 'rgba(255,255,255,0.08)', '--border-strong': 'rgba(255,255,255,0.15)',
                '--accent': '#22c55e', '--accent-rgb': '34,197,94', '--accent-soft': 'rgba(34,197,94,0.15)',
                '--accent-hover': '#4ade80', '--shadow': 'rgba(0,0,0,0.5)', '--glass': 'rgba(10,25,10,0.7)',
                '--scrollbar': 'rgba(255,255,255,0.1)', '--scrollbar-hover': 'rgba(255,255,255,0.2)',
                '--success': '#22c55e', '--warning': '#f59e0b', '--error': '#ef4444', '--info': '#4ade80'
            }
        },
        light: {
            label: '浅色', icon: 'fa-sun', color: '#2563eb',
            vars: {
                '--bg-app': '#f5f5f7', '--bg-base': '#ffffff', '--bg-elevated': '#f8f8fa',
                '--bg-overlay': '#f0f0f2', '--bg-modal': '#ffffff', '--bg-card': '#fafafc',
                '--bg-input': 'rgba(0,0,0,0.03)', '--bg-hover': 'rgba(0,0,0,0.04)',
                '--text-primary': '#1a1a2e', '--text-secondary': '#4a4a5e', '--text-muted': '#8a8a9e',
                '--text-disabled': '#b0b0be', '--border-subtle': 'rgba(0,0,0,0.06)',
                '--border-default': 'rgba(0,0,0,0.1)', '--border-strong': 'rgba(0,0,0,0.18)',
                '--accent': '#2563eb', '--accent-rgb': '37,99,235', '--accent-soft': 'rgba(37,99,235,0.1)',
                '--accent-hover': '#3b82f6', '--shadow': 'rgba(0,0,0,0.08)', '--glass': 'rgba(255,255,255,0.7)',
                '--scrollbar': 'rgba(0,0,0,0.15)', '--scrollbar-hover': 'rgba(0,0,0,0.25)',
                '--success': '#16a34a', '--warning': '#d97706', '--error': '#dc2626', '--info': '#2563eb'
            }
        },
        sepia: {
            label: '暖棕', icon: 'fa-book-open', color: '#a16207',
            vars: {
                '--bg-app': '#f5f0e8', '--bg-base': '#faf5ed', '--bg-elevated': '#f0ebe0',
                '--bg-overlay': '#eae5d8', '--bg-modal': '#faf5ed', '--bg-card': '#f5f0e5',
                '--bg-input': 'rgba(160,120,60,0.05)', '--bg-hover': 'rgba(160,120,60,0.08)',
                '--text-primary': '#2d2418', '--text-secondary': '#5a4a38', '--text-muted': '#8a7a60',
                '--text-disabled': '#b0a080', '--border-subtle': 'rgba(160,120,60,0.1)',
                '--border-default': 'rgba(160,120,60,0.18)', '--border-strong': 'rgba(160,120,60,0.28)',
                '--accent': '#a16207', '--accent-rgb': '161,98,7', '--accent-soft': 'rgba(161,98,7,0.12)',
                '--accent-hover': '#ca8a04', '--shadow': 'rgba(60,40,10,0.1)', '--glass': 'rgba(250,245,237,0.8)',
                '--scrollbar': 'rgba(160,120,60,0.2)', '--scrollbar-hover': 'rgba(160,120,60,0.35)',
                '--success': '#15803d', '--warning': '#b45309', '--error': '#b91c1c', '--info': '#a16207'
            }
        },
        high_contrast: {
            label: '高对比', icon: 'fa-circle-half-stroke', color: '#ffffff',
            vars: {
                '--bg-app': '#000000', '--bg-base': '#000000', '--bg-elevated': '#111111',
                '--bg-overlay': '#000000', '--bg-modal': '#000000', '--bg-card': '#111111',
                '--bg-input': '#000000', '--bg-hover': '#222222',
                '--text-primary': '#ffffff', '--text-secondary': '#eeeeee', '--text-muted': '#aaaaaa',
                '--text-disabled': '#666666', '--border-subtle': '#333333',
                '--border-default': '#555555', '--border-strong': '#888888',
                '--accent': '#ffffff', '--accent-rgb': '255,255,255', '--accent-soft': '#333333',
                '--accent-hover': '#cccccc', '--shadow': 'rgba(255,255,255,0.1)', '--glass': 'rgba(0,0,0,0.9)',
                '--scrollbar': '#444444', '--scrollbar-hover': '#666666',
                '--success': '#00ff00', '--warning': '#ffff00', '--error': '#ff0000', '--info': '#00ffff'
            }
        }
    },

    // ★ 字体预设
    FONTS: {
        system:      { label: '系统默认', family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" },
        serif:       { label: '宋体/衬线', family: "'Noto Serif SC', 'Source Han Serif SC', 'SimSun', 'STSong', serif" },
        sans:        { label: '黑体/无衬线', family: "'Noto Sans SC', 'Source Han Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif" },
        mono:        { label: '等宽字体', family: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace" },
        elegant:     { label: '优雅楷体', family: "'LXGW WenKai', 'KaiTi', 'STKaiti', serif" },
        handwriting: { label: '手写体', family: "'Ma Shan Zheng', 'ZCOOL KuaiLe', cursive" }
    },

    EDITOR_FONTS: {
        mono:    { label: 'JetBrains Mono', family: "'JetBrains Mono', 'Fira Code', monospace" },
        serif:   { label: 'Source Han Serif', family: "'Noto Serif SC', 'SimSun', serif" },
        sans:    { label: 'Source Han Sans', family: "'Noto Sans SC', 'PingFang SC', sans-serif" },
        kai:     { label: '楷体', family: "'KaiTi', 'STKaiti', serif" },
        classic: { label: '仿宋', family: "'FangSong', 'STFangsong', serif" }
    },

    init() {
        this._loadSettings();
        this.applyTheme(this._currentTheme, false);
        this.applyFont(this._currentFont, false);
        this.applyEditorSettings(false);
        console.log('[ThemeEngine] initialized:', this._currentTheme);
    },

    // ═══ 主题切换 ═══
    applyTheme(themeId, persist = true) {
        const theme = this.THEMES[themeId];
        if (!theme) return;
        this._currentTheme = themeId;
        const root = document.documentElement;
        for (const [key, val] of Object.entries(theme.vars)) {
            root.style.setProperty(key, val);
        }
        root.setAttribute('data-theme', themeId);
        // 更新 meta theme-color
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.content = theme.vars['--bg-app'];
        // 更新 Tailwind accent
        if (typeof tailwind !== 'undefined' && tailwind.config) {
            tailwind.config.theme.extend.colors.accent = theme.color;
        }
        if (persist) this._saveSettings();
        // 触发全局刷新
        document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: themeId } }));
    },

    // ═══ 字体切换 ═══
    applyFont(fontId, persist = true) {
        const font = this.FONTS[fontId];
        if (!font) return;
        this._currentFont = fontId;
        document.documentElement.style.setProperty('--font-ui', font.family);
        document.body.style.fontFamily = font.family;
        if (persist) this._saveSettings();
    },

    applyEditorFont(fontId, persist = true) {
        const font = this.EDITOR_FONTS[fontId];
        if (!font) return;
        this._currentEditorFont = fontId;
        document.documentElement.style.setProperty('--font-editor', font.family);
        if (persist) this._saveSettings();
    },

    applyEditorSettings(persist = true) {
        document.documentElement.style.setProperty('--editor-size', this._editorSize + 'px');
        document.documentElement.style.setProperty('--editor-lh', this._editorLineHeight);
        if (persist) this._saveSettings();
    },

    setEditorSize(size) { this._editorSize = Math.max(12, Math.min(32, size)); this.applyEditorSettings(); },
    setEditorLineHeight(lh) { this._editorLineHeight = Math.max(1.2, Math.min(2.5, lh)); this.applyEditorSettings(); },

    // ═══ 其他个性化 ═══
    setSidebarWidth(w) { this._sidebarWidth = Math.max(180, Math.min(400, w)); document.documentElement.style.setProperty('--sidebar-width', w + 'px'); this._saveSettings(); },
    setBorderRadius(r) {
        this._borderRadius = r;
        const map = { none: '0px', small: '6px', medium: '12px', large: '20px', round: '9999px' };
        document.documentElement.style.setProperty('--radius-sm', map[r] || '12px');
        this._saveSettings();
    },
    setGlassEffect(enabled) { this._glassEffect = enabled; document.documentElement.style.setProperty('--glass-opacity', enabled ? '0.7' : '0.95'); this._saveSettings(); },
    setAnimSpeed(speed) {
        this._animSpeed = speed;
        const map = { none: '0s', fast: '0.15s', normal: '0.3s', slow: '0.6s' };
        document.documentElement.style.setProperty('--transition-speed', map[speed] || '0.3s');
        this._saveSettings();
    },

    // ═══ 持久化 ═══
    _saveSettings() {
        const data = {
            theme: this._currentTheme,
            font: this._currentFont,
            editorFont: this._currentEditorFont,
            editorSize: this._editorSize,
            editorLineHeight: this._editorLineHeight,
            sidebarWidth: this._sidebarWidth,
            borderRadius: this._borderRadius,
            glassEffect: this._glassEffect,
            animSpeed: this._animSpeed
        };
        localStorage.setItem('theme_engine_settings', JSON.stringify(data));
    },
    _loadSettings() {
        try {
            const raw = localStorage.getItem('theme_engine_settings');
            if (raw) {
                const data = JSON.parse(raw);
                if (data.theme) this._currentTheme = data.theme;
                if (data.font) this._currentFont = data.font;
                if (data.editorFont) this._currentEditorFont = data.editorFont;
                if (data.editorSize) this._editorSize = data.editorSize;
                if (data.editorLineHeight) this._editorLineHeight = data.editorLineHeight;
                if (data.sidebarWidth) this._sidebarWidth = data.sidebarWidth;
                if (data.borderRadius) this._borderRadius = data.borderRadius;
                if (data.glassEffect !== undefined) this._glassEffect = data.glassEffect;
                if (data.animSpeed) this._animSpeed = data.animSpeed;
            }
        } catch(e) {}
    },

    // ═══ 工具方法 ═══
    getThemeList() { return Object.entries(this.THEMES).map(([id, t]) => ({ id, ...t })); },
    getFontList() { return Object.entries(this.FONTS).map(([id, f]) => ({ id, ...f })); },
    getEditorFontList() { return Object.entries(this.EDITOR_FONTS).map(([id, f]) => ({ id, ...f })); },
    getCurrentSettings() {
        return {
            theme: this._currentTheme,
            font: this._currentFont,
            editorFont: this._currentEditorFont,
            editorSize: this._editorSize,
            editorLineHeight: this._editorLineHeight,
            sidebarWidth: this._sidebarWidth,
            borderRadius: this._borderRadius,
            glassEffect: this._glassEffect,
            animSpeed: this._animSpeed
        };
    }
};

// 页面加载后自动初始化
window.addEventListener('DOMContentLoaded', () => ThemeEngine.init());
