/**
 * UserManager - 用户账号管理系统
 * 支持：注册、登录、登出、切换账号、多用户数据隔离
 */
const SafeStorage = window.SafeStorage || localStorage;

const UserManager = {
    STORAGE_KEY: '__genesis_users_v1__',
    SESSION_KEY: '__genesis_current_user__',

    _getStore() {
        const raw = SafeStorage.getItem(this.STORAGE_KEY);
        if (!raw) return {};
        try { return JSON.parse(raw); } catch { return {}; }
    },

    _saveStore(data) {
        SafeStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    },

    async _hash(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    // ===== 注册 =====
    async register(username, password) {
        const users = this._getStore();
        username = (username || '').trim().toLowerCase();
        if (!username || !password) {
            return { success: false, message: '用户名和密码不能为空' };
        }
        if (username.length < 3 || username.length > 20) {
            return { success: false, message: '用户名长度 3-20 位' };
        }
        if (password.length < 4) {
            return { success: false, message: '密码至少 4 位' };
        }
        if (users[username]) {
            return { success: false, message: '用户名已存在' };
        }
        users[username] = {
            username,
            passwordHash: await this._hash(password),
            createdAt: new Date().toISOString()
        };
        this._saveStore(users);
        // 自动登录
        this.login(username, password);
        return { success: true, message: '注册成功，已自动登录' };
    },

    // ===== 登录 =====
    async login(username, password) {
        const users = this._getStore();
        username = (username || '').trim().toLowerCase();
        const user = users[username];
        if (!user) {
            return { success: false, message: '用户名不存在' };
        }
        const hash = await this._hash(password);
        if (hash !== user.passwordHash) {
            return { success: false, message: '密码错误' };
        }
        SafeStorage.setItem(this.SESSION_KEY, username);
        return { success: true, message: '登录成功' };
    },

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
        return SafeStorage.getItem(this.SESSION_KEY);
    },

    getOfficialUserId() {
        if (typeof OfficialAuth === 'undefined') return null;
        const user = OfficialAuth.readUser && OfficialAuth.readUser();
        return user?.id || user?.userId || user?.username || user?.phone || null;
    },

    // ===== 是否已登录 =====
    isLoggedIn() {
        if (typeof OfficialAuth !== 'undefined' && OfficialAuth.isAuthenticated()) return true;
        return !!this.getCurrentUser();
    },

    // ===== 列出所有用户 =====
    listUsers() {
        const users = this._getStore();
        const list = Object.keys(users).map(u => ({
            username: u,
            createdAt: users[u].createdAt,
            isCurrent: u === this.getCurrentUser()
        }));
        if (typeof OfficialAuth !== 'undefined' && OfficialAuth.isAuthenticated()) {
            const name = OfficialAuth.getDisplayName() || '官网账号';
            list.unshift({ username: name, createdAt: 'official', isCurrent: true, official: true });
        }
        return list;
    },

    // ===== 切换用户 =====
    switchUser(username) {
        const users = this._getStore();
        username = (username || '').trim().toLowerCase();
        if (!users[username]) {
            return { success: false, message: '用户不存在' };
        }
        SafeStorage.setItem(this.SESSION_KEY, username);
        location.reload();
        return { success: true };
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
