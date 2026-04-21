/**
 * 家长账户 (Parent Account)
 * 用于儿童/青少年用户的家长绑定
 */

export class ParentAccount {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.email = data.email || null;
        this.phone = data.phone || null;
        this.children = data.children || []; // 子账户ID列表
        this.verified = data.verified || false;
        this.createdAt = data.createdAt || new Date();
        this.settings = data.settings || this.getDefaultSettings();
    }

    /**
     * 生成ID
     */
    generateId() {
        return 'parent_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 获取默认设置
     */
    getDefaultSettings() {
        return {
            timeLimit: 120,           // 每日使用时间限制(分钟)
            contentFilter: 'strict',   // 内容过滤级别
            notifications: true,       // 活动通知
            weeklyReport: true,        // 周报
            allowedFeatures: [         // 允许的功能
                'horoscope',
                'test',
                'chat'
            ]
        };
    }

    /**
     * 添加子账户
     */
    addChild(childId) {
        if (!this.children.includes(childId)) {
            this.children.push(childId);
        }
    }

    /**
     * 移除子账户
     */
    removeChild(childId) {
        const index = this.children.indexOf(childId);
        if (index > -1) {
            this.children.splice(index, 1);
        }
    }

    /**
     * 检查功能是否允许
     */
    isFeatureAllowed(feature) {
        return this.settings.allowedFeatures.includes(feature);
    }

    /**
     * 设置每日时间限制
     */
    setTimeLimit(minutes) {
        this.settings.timeLimit = Math.max(0, Math.min(480, minutes)); // 0-8小时
    }

    /**
     * 验证账户
     */
    verify() {
        this.verified = true;
    }

    /**
     * 转换为JSON
     */
    toJSON() {
        return {
            id: this.id,
            email: this.email,
            phone: this.phone,
            children: this.children,
            verified: this.verified,
            createdAt: this.createdAt,
            settings: this.settings
        };
    }
}