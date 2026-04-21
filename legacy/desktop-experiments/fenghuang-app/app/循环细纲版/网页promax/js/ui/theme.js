// 文件路径: 网页promax/js/ui/theme.js
// 描述: 负责管理和切换应用的主题。

const ThemeManager = {
    themes: ['cyberpunk', 'fantasy', 'cute', 'professional'],
    currentTheme: 'cyberpunk',

    /**
     * 初始化主题管理器，加载用户偏好并绑定事件。
     */
    init() {
        this.currentTheme = localStorage.getItem('theme') || 'cyberpunk';
        this.applyTheme();
        const themeSwitcher = document.getElementById('theme-switcher');
        if(themeSwitcher) themeSwitcher.addEventListener('click', () => this.toggleTheme());
    },

    /**
     * 将当前主题应用到HTML根元素上。
     */
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateIcon();
    },

    /**
     * 切换到下一个可用主题。
     */
    toggleTheme() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        this.currentTheme = this.themes[nextIndex];
        localStorage.setItem('theme', this.currentTheme);
        this.applyTheme();
        const themeNames = {
            'cyberpunk': '赛博朋克风',
            'fantasy': '奇幻风',
            'cute': '可爱风',
            'professional': '严肃专业风'
        };
        showNotification(`已切换到 ${themeNames[this.currentTheme]} 主题`, 'info');
    },

    /**
     * 根据当前主题更新切换按钮的图标。
     */
    updateIcon() {
        const themeSwitcher = document.getElementById('theme-switcher');
        if(themeSwitcher) {
            const icon = themeSwitcher.querySelector('i');
            switch (this.currentTheme) {
                case 'cyberpunk': icon.className = 'fas fa-robot'; break;
                case 'fantasy': icon.className = 'fas fa-dragon'; break;
                case 'cute': icon.className = 'fas fa-cat'; break;
                case 'professional': icon.className = 'fas fa-user-tie'; break;
                default: icon.className = 'fas fa-palette';
            }
        }
    }
};