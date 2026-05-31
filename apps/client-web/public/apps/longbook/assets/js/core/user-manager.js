/**
 * UserManager - 用户账号管理系统
 * 官网账号与免费体验用户态管理
 */
const SafeStorage = window.SafeStorage || localStorage;

const UserManager = {
    SESSION_KEY: '__genesis_current_user__',

    // ===== 登出 =====
    logout() {
        if (typeof OfficialAuth !== 'undefined' && OfficialAuth.isAuthenticated()) {
            OfficialAuth.clearAuth();
        }
        SafeStorage.removeItem(this.SESSION_KEY);
        location.reload();
    },

    // ===== 获取当前用户 =====
    getCurrentUser() {
        if (typeof OfficialAuth !== 'undefined' && OfficialAuth.isAuthenticated()) {
            return OfficialAuth.getDisplayName() || '官网账号';
        }
        return null;
    },

    getOfficialUserId() {
        if (typeof OfficialAuth === 'undefined') return null;
        const user = OfficialAuth.readUser && OfficialAuth.readUser();
        return user?.id || user?.userId || user?.username || user?.phone || null;
    },

    // ===== 是否已登录 =====
    isLoggedIn() {
        if (typeof OfficialAuth !== 'undefined' && OfficialAuth.isAuthenticated()) return true;
        return false;
    },

    // ===== 列出所有用户 =====
    listUsers() {
        const list = [];
        if (typeof OfficialAuth !== 'undefined' && OfficialAuth.isAuthenticated()) {
            const name = OfficialAuth.getDisplayName() || '官网账号';
            list.unshift({ username: name, createdAt: 'official', isCurrent: true, official: true });
        }
        return list;
    },

    // ===== 切换用户 =====
    switchUser(username) {
        return { success: false, message: '本地账号已停用，请使用官网账号登录' };
    },

    // ===== 获取用户前缀（用于数据隔离） =====
    getPrefix() {
        const officialId = this.getOfficialUserId();
        if (officialId) return `official:${officialId}:`;
        const user = this.getCurrentUser();
        return user ? `user:${user}:` : '';
    },

    // ===== 带前缀的 key =====
    key(baseKey) {
        return this.getPrefix() + baseKey;
    }
};

window.UserManager = UserManager;
