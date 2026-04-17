/**
 * 首页入口脚本 - Home Page Entry
 * 处理首页初始化和用户设置
 */

class HomePage {
    constructor() {
        this.init();
    }

    init() {
        // 加载用户设置
        this.loadUserSettings();
        // 添加卡片动画
        this.initCardAnimations();
    }

    loadUserSettings() {
        // 从本地存储加载用户偏好
        const savedAge = localStorage.getItem('user_age');
        if (savedAge) {
            console.log('用户年龄段:', savedAge);
        }
    }

    initCardAnimations() {
        // 卡片入场动画
        const cards = document.querySelectorAll('.feature-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 + index * 100);
        });
    }
}

// 初始化首页
window.addEventListener('DOMContentLoaded', () => {
    new HomePage();
});