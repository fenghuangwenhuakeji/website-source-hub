/**
 * UI管理器
 * 管理游戏界面、动画和用户交互
 */

class UIManager {
    constructor() {
        this.isInitialized = false;
        this.animations = {};
        this.notifications = [];
    }

    async init() {
        if (this.isInitialized) return;

        console.log('[UIManager] 初始化UI管理器...');

        // 初始化UI事件监听
        this.setupEventListeners();

        // 初始化动画
        this.initializeAnimations();

        this.isInitialized = true;
        console.log('[UIManager] UI管理器初始化完成');
    }

    // 设置事件监听
    setupEventListeners() {
        // 监听游戏引擎事件
        if (window.game) {
            game.on('initialized', () => {
                this.showNotification('游戏已初始化', 'success');
            });

            game.on('game-started', (data) => {
                this.showNotification(`欢迎，${data.player.name}！`, 'success');
            });

            game.on('view-changed', (data) => {
                console.log(`[UIManager] 视图已切换到: ${data.view}`);
            });

            game.on('notification', (data) => {
                this.showNotification(data.message, data.type);
            });
        }
    }

    // 初始化动画
    initializeAnimations() {
        // CSS动画
        this.animations = {
            fadeIn: 'fadeIn 0.3s ease-in',
            fadeOut: 'fadeOut 0.3s ease-out',
            slideIn: 'slideIn 0.3s ease',
            slideOut: 'slideOut 0.3s ease',
            bounce: 'bounce 0.5s ease'
        };

        // 添加动画样式
        this.addAnimationStyles();
    }

    // 添加动画样式
    addAnimationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-10px); }
            }

            @keyframes slideIn {
                from { opacity: 0; transform: translateX(100px); }
                to { opacity: 1; transform: translateX(0); }
            }

            @keyframes slideOut {
                from { opacity: 1; transform: translateX(0); }
                to { opacity: 0; transform: translateX(100px); }
            }

            @keyframes bounce {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }

            @keyframes glow {
                0%, 100% { box-shadow: 0 0 5px rgba(233, 69, 96, 0.5); }
                50% { box-shadow: 0 0 20px rgba(233, 69, 96, 0.8); }
            }

            .animate-fadeIn { animation: fadeIn 0.3s ease-in; }
            .animate-fadeOut { animation: fadeOut 0.3s ease-out; }
            .animate-slideIn { animation: slideIn 0.3s ease; }
            .animate-slideOut { animation: slideOut 0.3s ease; }
            .animate-bounce { animation: bounce 0.5s ease; }
            .animate-pulse { animation: pulse 1s ease infinite; }
            .animate-shake { animation: shake 0.5s ease; }
            .animate-glow { animation: glow 1s ease infinite; }
        `;
        document.head.appendChild(style);
    }

    // 显示通知
    showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notification-container');
        if (!container) {
            console.warn('[UIManager] 通知容器不存在');
            return;
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type} animate-slideIn`;
        notification.textContent = message;

        // 添加图标
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        notification.innerHTML = `<span style="margin-right: 8px;">${icons[type] || ''}</span>${message}`;

        container.appendChild(notification);

        // 自动移除
        setTimeout(() => {
            notification.classList.remove('animate-slideIn');
            notification.classList.add('animate-slideOut');

            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);

        this.notifications.push({
            message,
            type,
            timestamp: new Date()
        });
    }

    // 切换视图
    switchView(viewName) {
        // 隐藏所有视图
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // 显示目标视图
        const targetView = document.getElementById(`view-${viewName}`);
        if (targetView) {
            targetView.classList.add('active');
            targetView.classList.add('animate-fadeIn');

            setTimeout(() => {
                targetView.classList.remove('animate-fadeIn');
            }, 300);
        }

        // 更新导航栏
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
    }

    // 显示模态框
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('animate-fadeIn');
        }
    }

    // 隐藏模态框
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('animate-fadeIn');
            modal.classList.add('animate-fadeOut');

            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('animate-fadeOut');
            }, 300);
        }
    }

    // 更新进度条
    updateProgressBar(elementId, value, max, animate = true) {
        const progressBar = document.getElementById(elementId);
        if (!progressBar) return;

        const percentage = Math.max(0, Math.min(100, (value / max) * 100));

        if (animate) {
            progressBar.style.transition = 'width 0.5s ease';
        } else {
            progressBar.style.transition = 'none';
        }

        progressBar.style.width = `${percentage}%`;
    }

    // 更新文本内容
    updateText(elementId, text, animate = true) {
        const element = document.getElementById(elementId);
        if (!element) return;

        if (animate) {
            element.classList.add('animate-fadeOut');

            setTimeout(() => {
                element.textContent = text;
                element.classList.remove('animate-fadeOut');
                element.classList.add('animate-fadeIn');

                setTimeout(() => {
                    element.classList.remove('animate-fadeIn');
                }, 300);
            }, 300);
        } else {
            element.textContent = text;
        }
    }

    // 添加类名
    addClass(elementId, className) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add(className);
        }
    }

    // 移除类名
    removeClass(elementId, className) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove(className);
        }
    }

    // 切换类名
    toggleClass(elementId, className) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.toggle(className);
        }
    }

    // 禁用元素
    disableElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.disabled = true;
            element.classList.add('disabled');
        }
    }

    // 启用元素
    enableElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.disabled = false;
            element.classList.remove('disabled');
        }
    }

    // 显示加载动画
    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                </div>
            `;
        }
    }

    // 隐藏加载动画
    hideLoading(elementId, content = '') {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = content;
        }
    }

    // 添加震动效果
    shake(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('animate-shake');

            setTimeout(() => {
                element.classList.remove('animate-shake');
            }, 500);
        }
    }

    // 添加发光效果
    glow(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('animate-glow');
        }
    }

    // 移除发光效果
    unglow(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('animate-glow');
        }
    }

    // 淡入元素
    fadeIn(elementId, duration = 300) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.transition = `opacity ${duration}ms ease`;
            element.style.opacity = '0';
            element.style.display = 'block';

            setTimeout(() => {
                element.style.opacity = '1';
            }, 10);
        }
    }

    // 淡出元素
    fadeOut(elementId, duration = 300, callback = null) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.transition = `opacity ${duration}ms ease`;
            element.style.opacity = '0';

            setTimeout(() => {
                element.style.display = 'none';
                if (callback) callback();
            }, duration);
        }
    }

    // 获取通知历史
    getNotificationHistory() {
        return this.notifications;
    }

    // 清除通知历史
    clearNotificationHistory() {
        this.notifications = [];
    }
}

// 创建全局UI管理器实例
const uiManager = new UIManager();

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    uiManager.init();
});
