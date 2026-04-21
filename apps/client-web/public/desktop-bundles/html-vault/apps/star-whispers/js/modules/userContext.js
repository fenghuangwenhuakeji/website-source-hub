import { eventBus } from '../core/eventBus.js';

export const AGE_GROUPS = {
    CHILD: 'child',   // 6-12岁
    TEEN: 'teen',     // 12-18岁
    ADULT: 'adult'    // 18岁+
};

class UserContext {
    constructor() {
        // 模拟默认用户数据
        this.user = {
            name: '访客',
            age: 25,
            ageGroup: AGE_GROUPS.ADULT,
            horoscope: 'aries' // 白羊座
        };
        this.init();
    }

    init() {
        // 监听设置更新事件
        eventBus.on('user:update_age', (age) => this.setAge(age));
    }

    setAge(age) {
        this.user.age = parseInt(age);
        this.user.ageGroup = this.calculateAgeGroup(this.user.age);
        console.log(`[UserContext] 用户年龄更新: ${this.user.age}岁, 分组: ${this.user.ageGroup}`);
        
        // 广播用户画像更新事件
        eventBus.emit('user:profile_updated', this.user);
        
        // 触发主题切换
        this.applyTheme();
    }

    calculateAgeGroup(age) {
        if (age < 12) return AGE_GROUPS.CHILD;
        if (age < 18) return AGE_GROUPS.TEEN;
        return AGE_GROUPS.ADULT;
    }

    applyTheme() {
        const themeMap = {
            [AGE_GROUPS.CHILD]: 'child',
            [AGE_GROUPS.TEEN]: 'teen',
            [AGE_GROUPS.ADULT]: 'default'
        };
        const themeName = themeMap[this.user.ageGroup];
        
        // 切换 CSS 文件
        const themeLink = document.getElementById('theme-style');
        if (themeLink) {
            themeLink.href = `css/themes/${themeName}.css`;
        }
        
        // 广播主题变更完成
        eventBus.emit('ui:theme_changed', themeName);
    }

    getCurrentUser() {
        return { ...this.user };
    }
}

export const userContext = new UserContext();