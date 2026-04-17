/**
 * 年龄分组 (Age Group)
 * 用于年龄自适应功能
 */

export class AgeGroup {
    static GROUPS = {
        CHILD: 'child',      // 6-12岁
        TEEN: 'teen',        // 13-17岁
        ADULT: 'adult'       // 18岁+
    };

    static LABELS = {
        child: '儿童版',
        teen: '青少年版',
        adult: '成人版'
    };

    constructor(birthDate) {
        this.birthDate = birthDate ? new Date(birthDate) : null;
    }

    /**
     * 获取年龄
     */
    getAge() {
        if (!this.birthDate) return null;
        const today = new Date();
        let age = today.getFullYear() - this.birthDate.getFullYear();
        const monthDiff = today.getMonth() - this.birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.birthDate.getDate())) {
            age--;
        }
        return age;
    }

    /**
     * 获取年龄组
     */
    getAgeGroup() {
        const age = this.getAge();
        if (age === null) return AgeGroup.GROUPS.ADULT; // 默认成人
        
        if (age < 13) return AgeGroup.GROUPS.CHILD;
        if (age < 18) return AgeGroup.GROUPS.TEEN;
        return AgeGroup.GROUPS.ADULT;
    }

    /**
     * 获取年龄组标签
     */
    getLabel() {
        return AgeGroup.LABELS[this.getAgeGroup()];
    }

    /**
     * 判断是否为儿童
     */
    isChild() {
        return this.getAgeGroup() === AgeGroup.GROUPS.CHILD;
    }

    /**
     * 判断是否为青少年
     */
    isTeen() {
        return this.getAgeGroup() === AgeGroup.GROUPS.TEEN;
    }

    /**
     * 判断是否为成人
     */
    isAdult() {
        return this.getAgeGroup() === AgeGroup.GROUPS.ADULT;
    }

    /**
     * 判断是否需要家长监护
     */
    needsParentalConsent() {
        return this.isChild() || this.isTeen();
    }

    /**
     * 获取内容过滤级别
     */
    getContentFilterLevel() {
        switch (this.getAgeGroup()) {
            case AgeGroup.GROUPS.CHILD:
                return 'strict';
            case AgeGroup.GROUPS.TEEN:
                return 'moderate';
            default:
                return 'standard';
        }
    }

    /**
     * 获取UI主题
     */
    getTheme() {
        switch (this.getAgeGroup()) {
            case AgeGroup.GROUPS.CHILD:
                return { 
                    primary: '#FF6B6B', 
                    secondary: '#4ECDC4', 
                    fontFamily: 'Comic Sans MS, cursive',
                    borderRadius: '20px'
                };
            case AgeGroup.GROUPS.TEEN:
                return { 
                    primary: '#6C5CE7', 
                    secondary: '#A29BFE', 
                    fontFamily: 'Segoe UI, sans-serif',
                    borderRadius: '12px'
                };
            default:
                return { 
                    primary: '#667eea', 
                    secondary: '#764ba2', 
                    fontFamily: 'system-ui, sans-serif',
                    borderRadius: '8px'
                };
        }
    }
}