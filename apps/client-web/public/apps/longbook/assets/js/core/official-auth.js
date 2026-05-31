/**
 * OfficialAuth - 官网账号与授权中心适配层
 * 支付、订单、权益都以 fhwhkj.top 官网系统为准。
 */
const OfficialAuth = {
    SITE_BASE_URL: (window.OFFICIAL_SITE_BASE_URL || 'https://fhwhkj.top').replace(/\/$/, ''),
    API_BASE_URL: (window.OFFICIAL_API_BASE_URL || 'https://fhwhkj.top/api').replace(/\/$/, ''),
    PRODUCT_ID: window.OFFICIAL_PRODUCT_ID || 'fenghuang',
    TOKEN_KEYS: ['fhwh_token', 'token'],
    REFRESH_TOKEN_KEYS: ['fhwh_refresh_token', 'refreshToken'],
    USER_KEYS: ['fhwh_user', 'user'],
    STATUS_KEY: '__genesis_official_license_status_v1__',
    LICENSE_KEY: '__genesis_official_license_cache_v1__',
    SESSION_ID_KEY: '__genesis_official_session_id_v1__',

    _storage() {
        return typeof SafeStorage !== 'undefined' ? SafeStorage : localStorage;
    },

    _readFirst(keys) {
        for (const key of keys) {
            const value = this._storage().getItem(key);
            if (value) return value;
        }
        return null;
    },

    _writeAll(keys, value) {
        keys.forEach((key) => {
            if (value == null) this._storage().removeItem(key);
            else this._storage().setItem(key, value);
        });
    },

    readToken() {
        return this._readFirst(this.TOKEN_KEYS);
    },

    readRefreshToken() {
        return this._readFirst(this.REFRESH_TOKEN_KEYS);
    },

    readUser() {
        const raw = this._readFirst(this.USER_KEYS);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch { return null; }
    },

    writeAuth(payload = {}) {
        if (Object.prototype.hasOwnProperty.call(payload, 'token')) this._writeAll(this.TOKEN_KEYS, payload.token || null);
        if (Object.prototype.hasOwnProperty.call(payload, 'refreshToken')) this._writeAll(this.REFRESH_TOKEN_KEYS, payload.refreshToken || null);
        if (Object.prototype.hasOwnProperty.call(payload, 'user')) {
            this._writeAll(this.USER_KEYS, payload.user ? JSON.stringify(payload.user) : null);
        }
    },

    clearAuth() {
        this.writeAuth({ token: null, refreshToken: null, user: null });
        this.clearLicenseCache();
    },

    isAuthenticated() {
        return !!(this.readToken() || this.readRefreshToken());
    },

    getDisplayName() {
        const user = this.readUser();
        return user?.nickname || user?.username || user?.phone || user?.email || null;
    },

    _currentReturnPath() {
        if (typeof window === 'undefined') return '/recharge';
        const path = `${window.location.pathname || '/'}${window.location.search || ''}${window.location.hash || ''}`;
        return path.startsWith('/') && !path.startsWith('//') ? path : '/recharge';
    },

    buildSiteUrl(path, params = {}) {
        const url = new URL(path, this.SITE_BASE_URL);
        Object.entries(params).forEach(([key, value]) => {
            if (value) url.searchParams.set(key, String(value));
        });
        return url.toString();
    },

    openLogin() {
        const url = this.buildSiteUrl('/login', { from: this._currentReturnPath() });
        window.open(url, '_blank', 'noopener');
    },

    openRegister() {
        const url = this.buildSiteUrl('/register', { from: this._currentReturnPath() });
        window.open(url, '_blank', 'noopener');
    },

    openRecharge() {
        const url = this.buildSiteUrl('/recharge', { from: this._currentReturnPath() });
        window.open(url, '_blank', 'noopener');
    },

    _sessionId() {
        let id = this._storage().getItem(this.SESSION_ID_KEY);
        if (!id) {
            const random = (typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
            id = `long-${random}`;
            this._storage().setItem(this.SESSION_ID_KEY, id);
        }
        return id;
    },

    _deviceId() {
        return typeof MachineId !== 'undefined' ? MachineId.get() : 'unknown-device';
    },

    _deviceName() {
        const platform = navigator.platform || 'web';
        return `long-writing-${platform}`;
    },

    async refreshAccessToken() {
        const refreshToken = this.readRefreshToken();
        if (!refreshToken) return null;
        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Client-Type': 'web' },
                body: JSON.stringify({ refreshToken })
            });
            const payload = await response.json().catch(() => null);
            const data = payload?.data || payload;
            if (!response.ok || !data?.token) {
                if (response.status === 401 || response.status === 403) this.clearAuth();
                return null;
            }
            this.writeAuth({
                token: data.token,
                refreshToken: data.refreshToken || refreshToken,
                user: data.user || this.readUser()
            });
            return data.token;
        } catch (error) {
            console.warn('[OfficialAuth] refresh failed:', error);
            return null;
        }
    },

    async request(path, options = {}, retry = true) {
        let token = this.readToken() || await this.refreshAccessToken();
        const headers = {
            'Content-Type': 'application/json',
            'X-Client-Type': 'web',
            ...(options.headers || {})
        };
        if (token) headers.Authorization = `Bearer ${token}`;

        try {
            const response = await fetch(`${this.API_BASE_URL}${path}`, { ...options, headers });
            const text = await response.text();
            let payload = null;
            if (text) {
                try { payload = JSON.parse(text); }
                catch { payload = { success: response.ok, message: text }; }
            }
            if ((response.status === 401 || response.status === 403) && retry) {
                const refreshed = await this.refreshAccessToken();
                if (refreshed && refreshed !== token) return this.request(path, options, false);
            }
            if (!response.ok) {
                return {
                    success: false,
                    status: response.status,
                    message: payload?.message || payload?.error || `请求失败: ${response.status}`,
                    data: payload?.data
                };
            }
            return {
                success: payload?.success ?? true,
                status: response.status,
                message: payload?.message,
                data: payload?.data ?? payload
            };
        } catch (error) {
            return { success: false, status: 0, message: '网络异常: ' + error.message };
        }
    },

    _saveStatus(status) {
        this._storage().setItem(this.STATUS_KEY, JSON.stringify({ status, savedAt: new Date().toISOString() }));
    },

    getCachedStatus() {
        const raw = this._storage().getItem(this.STATUS_KEY);
        if (!raw) return null;
        try { return JSON.parse(raw).status || null; } catch { return null; }
    },

    _saveLicense(license) {
        if (license) this._storage().setItem(this.LICENSE_KEY, JSON.stringify(license));
        else this._storage().removeItem(this.LICENSE_KEY);
    },

    clearLicenseCache() {
        this._storage().removeItem(this.STATUS_KEY);
        this._storage().removeItem(this.LICENSE_KEY);
    },

    async checkAccess() {
        if (!this.isAuthenticated()) {
            return { success: false, needsLogin: true, message: '请先登录官网账号' };
        }
        const statusRes = await this.request(`/license/products/${encodeURIComponent(this.PRODUCT_ID)}/status`);
        if (!statusRes.success) {
            return {
                success: false,
                needsLogin: statusRes.status === 401 || statusRes.status === 403,
                message: statusRes.message || '官网授权验证失败'
            };
        }
        const status = statusRes.data || {};
        this._saveStatus(status);
        if (!status.canEnter) {
            this._saveLicense(null);
            return { success: true, active: false, status, message: '当前账号未开通或权益已过期' };
        }

        const heartbeat = await this.request(`/license/products/${encodeURIComponent(this.PRODUCT_ID)}/heartbeat`, {
            method: 'POST',
            body: JSON.stringify({
                deviceId: this._deviceId(),
                deviceName: this._deviceName(),
                sessionId: this._sessionId()
            })
        });
        if (heartbeat.success && heartbeat.data?.license) this._saveLicense(heartbeat.data.license);
        return { success: true, active: true, status: heartbeat.data?.status || status, license: heartbeat.data?.license || null };
    },

    async redeemCode(code) {
        if (!this.isAuthenticated()) {
            return { success: false, message: '请先登录官网账号后再兑换卡密' };
        }
        const result = await this.request(`/license/products/${encodeURIComponent(this.PRODUCT_ID)}/redeem-code`, {
            method: 'POST',
            body: JSON.stringify({ code })
        });
        if (!result.success) return { success: false, message: result.message || '卡密兑换失败' };
        if (result.data?.status) this._saveStatus(result.data.status);
        return { success: true, message: result.message || '兑换成功', status: result.data?.status || null };
    }
};

window.OfficialAuth = OfficialAuth;
