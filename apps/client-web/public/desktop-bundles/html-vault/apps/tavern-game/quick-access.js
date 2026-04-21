// ========== 快速访问系统 ==========

class QuickAccessSystem {
    constructor() {
        this.isInitialized = false;
        this.quickAccessButtons = [];
        this.shortcuts = new Map();
    }

    // 初始化快速访问系统
    init() {
        if (this.isInitialized) return;

        console.log('初始化快速访问系统...');
        this.setupQuickAccessPanel();
        this.registerDefaultShortcuts();
        this.setupKeyboardShortcuts();
        this.isInitialized = true;
        console.log('快速访问系统初始化完成');
    }

    // 设置快速访问面板
    setupQuickAccessPanel() {
        // 创建快速访问容器
        if (!document.getElementById('quick-access-panel')) {
            const quickAccessPanel = document.createElement('div');
            quickAccessPanel.id = 'quick-access-panel';
            quickAccessPanel.className = 'quick-access-panel';
            quickAccessPanel.innerHTML = `
                <div class="quick-access-title">
                    <span>⚡ 快速访问</span>
                    <button class="toggle-btn" onclick="quickAccessSystem.togglePanel()">−</button>
                </div>
                <div class="quick-access-grid" id="quick-access-grid"></div>
            `;
            document.body.appendChild(quickAccessPanel);
        }

        this.renderQuickAccessButtons();
    }

    // 渲染快速访问按钮
    renderQuickAccessButtons() {
        const grid = document.getElementById('quick-access-grid');
        if (!grid) return;

        const buttons = [
            { icon: '🗺️', label: '地图', action: () => game.switchView('map'), key: '1' },
            { icon: '🍺', label: '酒馆', action: () => game.switchView('tavern'), key: '2' },
            { icon: '👤', label: '角色', action: () => game.switchView('character'), key: '3' },
            { icon: '🃏', label: '卡牌', action: () => game.switchView('card-collection'), key: '4' },
            { icon: '⚔️', label: '职业', action: () => game.switchView('class'), key: '5' },
            { icon: '📜', label: '任务', action: () => game.switchView('quest'), key: '6' },
            { icon: '🏆', label: '成就', action: () => game.showAchievements(), key: '7' },
            { icon: '💾', label: '存档', action: () => game.saveGame(), key: '8' },
            { icon: '⚙️', label: '设置', action: () => game.showSettings(), key: '9' },
            { icon: '☀️', label: '天气', action: () => this.showWeatherInfo(), key: 'w' },
            { icon: '🕐', label: '时间', action: () => this.showTimeInfo(), key: 't' },
            { icon: '🔄', label: '跳过时间', action: () => timeSystem.skipTime(4), key: 's' }
        ];

        grid.innerHTML = buttons.map(btn => `
            <button class="quick-access-btn" onclick="quickAccessSystem.executeAction(${buttons.indexOf(btn)})" title="${btn.label} (${btn.key})">
                <span class="quick-access-icon">${btn.icon}</span>
                <span class="quick-access-label">${btn.label}</span>
                <span class="quick-access-key">${btn.key}</span>
            </button>
        `).join('');

        this.quickAccessButtons = buttons;
    }

    // 执行动作
    executeAction(index) {
        const btn = this.quickAccessButtons[index];
        if (btn && btn.action) {
            btn.action();
        }
    }

    // 显示天气信息
    showWeatherInfo() {
        if (typeof weatherSystem !== 'undefined') {
            const weather = weatherSystem.getCurrentWeather();
            const impact = weatherSystem.getWeatherImpact();

            const message = `
                当前天气: ${weather.info.name} ${weather.info.icon}
                ${weather.info.description}

                天气影响:
                • 战斗: ${(impact.combat * 100).toFixed(0)}%
                • 探索: ${(impact.exploration * 100).toFixed(0)}%
                • 心情: ${(impact.mood * 100).toFixed(0)}%
            `;

            alert(message);
        }
    }

    // 显示时间信息
    showTimeInfo() {
        if (typeof timeSystem !== 'undefined') {
            const time = timeSystem.getTimeInfo();

            const message = `
                游戏时间: ${time.formatted}
                第 ${time.dayCount} 天
                时段: ${timeSystem.getTimeOfDayDescription()}

                时间流速: ${time.timeScale}x
            `;

            alert(message);
        }
    }

    // 注册默认快捷键
    registerDefaultShortcuts() {
        this.registerShortcut('1', () => game.switchView('map'), '切换到地图');
        this.registerShortcut('2', () => game.switchView('tavern'), '切换到酒馆');
        this.registerShortcut('3', () => game.switchView('character'), '切换到角色面板');
        this.registerShortcut('4', () => game.switchView('card-collection'), '切换到卡牌收藏');
        this.registerShortcut('5', () => game.switchView('class'), '切换到职业系统');
        this.registerShortcut('6', () => game.switchView('quest'), '切换到任务系统');
        this.registerShortcut('7', () => game.showAchievements(), '打开成就系统');
        this.registerShortcut('8', () => game.saveGame(), '保存游戏');
        this.registerShortcut('9', () => game.showSettings(), '打开设置');
        this.registerShortcut('0', () => game.closeMenu(), '关闭菜单');

        this.registerShortcut('w', () => this.showWeatherInfo(), '显示天气信息');
        this.registerShortcut('t', () => this.showTimeInfo(), '显示时间信息');
        this.registerShortcut('s', () => timeSystem.skipTime(4), '跳过4小时');
        this.registerShortcut('+', () => timeSystem.setTimeScale(timeSystem.timeScale + 0.5), '加快时间');
        this.registerShortcut('-', () => timeSystem.setTimeScale(Math.max(0.5, timeSystem.timeScale - 0.5)), '减慢时间');

        this.registerShortcut('Escape', () => game.openMenu(), '打开菜单');
        this.registerShortcut('F11', () => this.toggleFullscreen(), '切换全屏');
    }

    // 注册快捷键
    registerShortcut(key, action, description) {
        this.shortcuts.set(key, {
            action,
            description
        });
    }

    // 设置键盘快捷键
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // 如果在输入框中，不触发快捷键
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            const key = e.key.toLowerCase();
            if (this.shortcuts.has(key)) {
                e.preventDefault();
                const shortcut = this.shortcuts.get(key);
                try {
                    shortcut.action();
                } catch (error) {
                    console.error(`快捷键 ${key} 执行失败:`, error);
                }
            }
        });
    }

    // 切换全屏
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    // 切换面板
    togglePanel() {
        const panel = document.getElementById('quick-access-panel');
        if (panel) {
            panel.classList.toggle('collapsed');

            const btn = panel.querySelector('.toggle-btn');
            if (btn) {
                btn.textContent = panel.classList.contains('collapsed') ? '+' : '−';
            }
        }
    }

    // 显示快捷键帮助
    showShortcutHelp() {
        const helpText = Array.from(this.shortcuts.entries())
            .map(([key, shortcut]) => `${key}: ${shortcut.description}`)
            .join('\n');

        alert(`快捷键帮助:\n\n${helpText}`);
    }

    // 获取快捷键列表
    getShortcutList() {
        return Array.from(this.shortcuts.entries()).map(([key, shortcut]) => ({
            key,
            description: shortcut.description
        }));
    }

    // 添加自定义快速访问按钮
    addQuickAccessButton(button) {
        this.quickAccessButtons.push(button);
        this.renderQuickAccessButtons();
    }

    // 移除快速访问按钮
    removeQuickAccessButton(index) {
        this.quickAccessButtons.splice(index, 1);
        this.renderQuickAccessButtons();
    }

    // 获取系统信息
    getSystemInfo() {
        return {
            isInitialized: this.isInitialized,
            buttonCount: this.quickAccessButtons.length,
            shortcutCount: this.shortcuts.size
        };
    }
}

// 创建全局快速访问系统实例
const quickAccessSystem = new QuickAccessSystem();

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    quickAccessSystem.init();
});
