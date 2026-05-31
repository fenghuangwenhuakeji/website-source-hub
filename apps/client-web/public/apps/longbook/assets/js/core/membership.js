/**
 * Membership - 会员配额管理系统 v3.0
 * 服务端验证版本，配合 LicenseClient 使用
 */
const Membership = {
    _baseStorageKey: '__genesis_member_data_v3__',
    _baseDailyKey: '__genesis_daily_usage_v3__',
    _deviceTokenKey: '__genesis_device_token_v3__',

    get _machinePrefix() {
        const mid = typeof MachineId !== 'undefined' ? MachineId.get() : '';
        return mid ? `m:${mid}:` : '';
    },
    get STORAGE_KEY() {
        return this._machinePrefix + (typeof UserManager !== 'undefined' ? UserManager.key(this._baseStorageKey) : this._baseStorageKey);
    },
    get DAILY_KEY() {
        return this._machinePrefix + (typeof UserManager !== 'undefined' ? UserManager.key(this._baseDailyKey) : this._baseDailyKey);
    },
    get DEVICE_TOKEN_KEY() {
        return this._machinePrefix + (typeof UserManager !== 'undefined' ? UserManager.key(this._deviceTokenKey) : this._deviceTokenKey);
    },

    FREE_TOKENS: 500000,       // 初始免费 50万
    FIRST_DAY_BONUS: 0,        // 首充赠送已关闭
    OFFICIAL_DAILY_TOKENS: Number(window.OFFICIAL_DAILY_TOKENS || 1000000),

    _xorKey: 0x7A,
    _encode(obj) {
        const str = JSON.stringify(obj);
        const bytes = new TextEncoder().encode(str);
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] ^= this._xorKey ^ (i % 7);
        }
        let bin = '';
        for (let i = 0; i < bytes.length; i++) {
            bin += String.fromCharCode(bytes[i]);
        }
        return btoa(bin);
    },
    _decode(b64) {
        try {
            const bin = atob(b64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) {
                bytes[i] = bin.charCodeAt(i) ^ this._xorKey ^ (i % 7);
            }
            return JSON.parse(new TextDecoder().decode(bytes));
        } catch (e) { return null; }
    },

    _storage() {
        return typeof SafeStorage !== 'undefined' ? SafeStorage : {
            getItem: (k) => localStorage.getItem(k),
            setItem: (k, v) => localStorage.setItem(k, v),
            removeItem: (k) => localStorage.removeItem(k)
        };
    },
    _save(data) {
        this._storage().setItem(this.STORAGE_KEY, this._encode(data));
    },
    _load() {
        const raw = this._storage().getItem(this.STORAGE_KEY);
        return raw ? this._decode(raw) : null;
    },
    _saveDaily(data) {
        this._storage().setItem(this.DAILY_KEY, this._encode(data));
    },
    _loadDaily() {
        const raw = this._storage().getItem(this.DAILY_KEY);
        return raw ? this._decode(raw) : null;
    },
    _saveDeviceToken(token) {
        this._storage().setItem(this.DEVICE_TOKEN_KEY, token);
    },
    _loadDeviceToken() {
        return this._storage().getItem(this.DEVICE_TOKEN_KEY);
    },
    _todayStr() {
        return new Date().toISOString().split('T')[0];
    },
    _isFirstDay(activatedAt) {
        if (!activatedAt) return false;
        return activatedAt.startsWith(this._todayStr());
    },
    _officialTypeName(status) {
        if (!status) return '官网权益';
        if (status.isPermanent || status.accessType === 'permanent') return '永久会员';
        if (status.accessType === 'admin') return '管理员授权';
        if (status.isTrial || status.accessType === 'trial') return '官网试用';
        if (status.accessType === 'paid') return '官网会员';
        return '官网权益';
    },
    _recordFromOfficialStatus(status) {
        const features = status?.features || {};
        const dailyQuota = Number(features.dailyQuota || features.dailyTokens || this.OFFICIAL_DAILY_TOKENS);
        return {
            keys: [],
            official: true,
            type: status?.accessType || 'official',
            typeName: this._officialTypeName(status),
            tier: status?.isPermanent ? 'permanent' : (status?.accessType || 'official'),
            tierName: status?.isPermanent ? '永久授权' : (status?.isTrial ? '试用权益' : '账号权益'),
            dailyQuota,
            freeTokens: this.FREE_TOKENS,
            activatedAt: new Date().toISOString(),
            expiryDate: status?.isPermanent ? null : (status?.expiresAt || null),
            officialStatus: status || null
        };
    },
    _saveOfficialStatus(status) {
        const record = this._recordFromOfficialStatus(status);
        this._save(record);
        const today = this._todayStr();
        const daily = this._loadDaily();
        if (!daily || daily.date !== today) {
            this._saveDaily({ date: today, used: 0, freeUsed: 0, firstDayUsed: 0 });
        }
        return record;
    },

    // ===== 获取当前状态 =====
    getStatus() {
        const record = this._load();
        const today = this._todayStr();

        if (!record) {
            // 从未激活：免费试用模式（仍需读取今日消耗）
            const daily = this._loadDaily();
            let freeUsed = 0;
            if (daily && daily.date === today) {
                freeUsed = daily.freeUsed || 0;
            }
            const remainingToday = Math.max(0, this.FREE_TOKENS - freeUsed);
            return {
                active: true,
                isFree: true,
                dailyQuota: 0,
                freeTokens: this.FREE_TOKENS,
                firstDayBonus: 0,
                usedToday: freeUsed,
                freeUsedToday: freeUsed,
                firstDayUsedToday: 0,
                remainingToday: remainingToday,
                quotaRemaining: 0,
                freeRemaining: remainingToday,
                firstDayRemaining: 0,
                daysLeft: -1,
                typeName: '免费体验',
                tierName: '新用户',
                expiryDate: null,
                hasDeviceToken: false
            };
        }

        // 数据迁移：旧版 freeTokens 小于新版时自动升级
        if ((record.freeTokens || 0) < this.FREE_TOKENS) {
            record.freeTokens = this.FREE_TOKENS;
            this._save(record);
        }

        // 数据迁移：将冗长的旧 tierName（基础款 + 基础款 + ...）转换为紧凑格式（基础款×N）
        if (record.tierName && record.tierName.includes(' + ')) {
            const tierCounts = {};
            record.tierName.split(' + ').forEach(t => {
                const match = t.match(/^(.+)×(\d+)$/);
                if (match) {
                    tierCounts[match[1]] = (tierCounts[match[1]] || 0) + parseInt(match[2]);
                } else {
                    tierCounts[t] = (tierCounts[t] || 0) + 1;
                }
            });
            const compactTierName = Object.entries(tierCounts).map(([name, count]) => {
                return count > 1 ? `${name}×${count}` : name;
            }).join(' + ');
            if (compactTierName !== record.tierName) {
                record.tierName = compactTierName;
                this._save(record);
            }
        }

        const daily = this._loadDaily();
        let usedToday = 0, freeUsed = 0, firstDayUsed = 0;
        if (daily && daily.date === today) {
            usedToday = daily.used || 0;
            freeUsed = daily.freeUsed || 0;
            firstDayUsed = daily.firstDayUsed || 0;
        } else {
            this._saveDaily({ date: today, used: 0, freeUsed: 0, firstDayUsed: 0 });
        }

        const isFirstDay = this._isFirstDay(record.activatedAt);
        const firstDayRemaining = isFirstDay ? Math.max(0, this.FIRST_DAY_BONUS - firstDayUsed) : 0;
        const freeRemaining = Math.max(0, (record.freeTokens || this.FREE_TOKENS) - freeUsed);
        const quotaRemaining = Math.max(0, record.dailyQuota - usedToday);
        const totalRemaining = quotaRemaining + freeRemaining + firstDayRemaining;

        let expired = false;
        let secondsLeft = -1;
        if (record.expiryDate) {
            const diff = new Date(record.expiryDate) - new Date();
            expired = diff <= 0;
            secondsLeft = Math.max(0, Math.floor(diff / 1000));
        }
        const daysLeft = record.expiryDate
            ? Math.max(0, Math.ceil((new Date(record.expiryDate) - new Date()) / 86400000))
            : -1;

        return {
            active: true,
            isFree: false,
            expired,
            secondsLeft,
            ...record,
            usedToday,
            freeUsedToday: freeUsed,
            firstDayUsedToday: firstDayUsed,
            remainingToday: totalRemaining,
            quotaRemaining,
            freeRemaining,
            firstDayRemaining,
            daysLeft,
            hasDeviceToken: !!this._loadDeviceToken()
        };
    },

    // ===== 激活/叠加卡密（服务端验证） =====
    async activate(key) {
        if (typeof OfficialAuth !== 'undefined' && OfficialAuth.isAuthenticated()) {
            const redeemed = await OfficialAuth.redeemCode(key);
            if (!redeemed.success) {
                return { success: false, message: redeemed.message || '官网卡密兑换失败' };
            }
            const checked = await OfficialAuth.checkAccess();
            const status = checked.status || redeemed.status;
            if (!checked.active && !status?.canEnter) {
                return { success: false, message: checked.message || '兑换成功，但当前权益尚不可用，请刷新后重试' };
            }
            const record = this._saveOfficialStatus(status);
            return { success: true, info: record, isNew: true, message: '官网权益兑换成功！' };
        }

        const machineId = typeof MachineId !== 'undefined' ? MachineId.get() : 'unknown';
        const userId = typeof UserManager !== 'undefined' ? (UserManager.getOfficialUserId?.() || UserManager.getCurrentUser?.()) : null;

        const result = await LicenseClient.activate(key, machineId, userId);

        if (!result.success) {
            return { success: false, message: result.message || result.reason || '卡密无效' };
        }

        const today = this._todayStr();

        // 保存 device token
        if (result.deviceToken) {
            this._saveDeviceToken(result.deviceToken);
        }

        // 构建本地记录
        const record = {
            keys: [key],
            type: result.type,
            typeName: result.typeName,
            tier: result.tier,
            tierName: result.tierName,
            dailyQuota: result.dailyQuota,
            freeTokens: this.FREE_TOKENS,
            activatedAt: new Date().toISOString(),
            expiryDate: result.expiresAt
        };

        // 检查是否是叠加
        const existingRecord = this._load();
        if (existingRecord && !existingRecord.expired) {
            // 叠加逻辑
            if (existingRecord.keys.includes(key)) {
                return { success: false, message: '该卡密已激活过，请勿重复激活' };
            }

            record.keys = [...existingRecord.keys, key];
            record.dailyQuota = existingRecord.dailyQuota + result.dailyQuota;
            record.activatedAt = existingRecord.activatedAt;

            // 合并 tierName
            const tierCounts = {};
            existingRecord.tierName.split(' + ').forEach(t => {
                const match = t.match(/^(.+)×(\d+)$/);
                if (match) {
                    tierCounts[match[1]] = (tierCounts[match[1]] || 0) + parseInt(match[2]);
                } else {
                    tierCounts[t] = (tierCounts[t] || 0) + 1;
                }
            });
            tierCounts[result.tierName] = (tierCounts[result.tierName] || 0) + 1;
            record.tierName = Object.entries(tierCounts).map(([name, count]) => {
                return count > 1 ? `${name}×${count}` : name;
            }).join(' + ');

            // 累计有效期
            const currentExpiry = new Date(existingRecord.expiryDate);
            const now = Date.now();
            const remainingTime = Math.max(0, currentExpiry - now);
            const addedTime = result.days * 86400000;
            record.expiryDate = new Date(now + remainingTime + addedTime).toISOString();

            this._save(record);
            return {
                success: true,
                info: record,
                isStacked: true,
                message: `叠加成功！每日配额 +${result.dailyQuota.toLocaleString()}，当前总配额 ${record.dailyQuota.toLocaleString()}/日`
            };
        }

        // 首次激活
        this._save(record);
        this._saveDaily({ date: today, used: 0, freeUsed: 0, firstDayUsed: 0 });
        return { success: true, info: record, isNew: true, message: '激活成功！' };
    },

    // ===== 检查是否激活（同步版本，从本地缓存） =====
    check() {
        const status = this.getStatus();
        if (!status.active) return { active: false, reason: '未激活' };
        if (!status.isFree && status.expired) {
            return { active: false, reason: '卡密已过期', record: status };
        }
        return { active: true, status };
    },

    // ===== 检查是否激活（异步版本，从服务端验证） =====
    async checkAsync() {
        if (typeof OfficialAuth !== 'undefined' && OfficialAuth.isAuthenticated()) {
            const result = await OfficialAuth.checkAccess();
            if (result.success && result.active) {
                const record = this._saveOfficialStatus(result.status);
                const status = this.getStatus();
                return { active: true, status: { ...status, officialStatus: result.status, officialLicense: result.license } };
            }
            if (result.needsLogin) {
                return { active: false, reason: result.message || '请先登录官网账号' };
            }
            return { active: false, reason: result.message || '当前官网账号未开通或权益已过期', record: result.status };
        }

        const machineId = typeof MachineId !== 'undefined' ? MachineId.get() : 'unknown';
        const deviceToken = this._loadDeviceToken();

        if (!deviceToken) {
            if (this._load()) {
                return { active: false, reason: '缺少设备令牌，请重新激活卡密' };
            }
            return this.check();
        }

        const result = await LicenseClient.check(machineId, deviceToken);

        if (!result.success || !result.active) {
            return { active: false, reason: result.message || result.reason || '服务端授权验证失败' };
        }

        // 更新本地缓存
        const record = this._load();
        if (record) {
            record.dailyQuota = result.dailyQuota || record.dailyQuota;
            record.expiryDate = result.expiresAt || record.expiryDate;
            this._save(record);
        }

        const status = this.getStatus();
        if (!status.active) return { active: false, reason: '未激活' };
        if (!status.isFree && status.expired) {
            return { active: false, reason: '卡密已过期', record: status };
        }
        return { active: true, status };
    },

    // ===== 重置为免费体验模式（卡密过期后回退） =====
    resetToFree() {
        try {
            this._storage().removeItem(this.STORAGE_KEY);
            this._storage().removeItem(this.DEVICE_TOKEN_KEY);
            return { success: true, message: '已切换到免费体验模式' };
        } catch (e) {
            return { success: false, message: '重置失败: ' + e.message };
        }
    },

    // ===== 获取倒计时（自然日格式） =====
    getCountdown() {
        const record = this._load();
        if (!record || !record.expiryDate) return null;
        const diff = new Date(record.expiryDate) - new Date();
        if (diff <= 0) return { expired: true, text: '已过期', seconds: 0 };
        const totalSeconds = Math.floor(diff / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        let text;
        if (days >= 1) {
            text = `${days}天`;
        } else if (hours >= 1) {
            text = `${hours}小时${minutes.toString().padStart(2, '0')}分`;
        } else if (minutes >= 1) {
            text = `${minutes}分${seconds.toString().padStart(2, '0')}秒`;
        } else {
            text = `${seconds}秒`;
        }
        return { expired: false, text, seconds: totalSeconds, days, hours, minutes, seconds };
    },

    // ===== 消费 Token（服务端验证） =====
    async consume(count) {
        const record = this._load();
        if (record && record.official) {
            return this._consumeLocal(count);
        }

        const machineId = typeof MachineId !== 'undefined' ? MachineId.get() : 'unknown';
        const deviceToken = this._loadDeviceToken();

        if (!deviceToken) {
            if (this._load()) {
                return { allowed: false, reason: '缺少设备令牌，请重新激活卡密' };
            }
            return this._consumeLocal(count);
        }

        const result = await LicenseClient.consume(machineId, deviceToken, count);

        if (!result.allowed) {
            return { allowed: false, reason: result.message || result.reason || '服务端扣量失败' };
        }

        // 更新本地缓存
        const today = this._todayStr();
        const daily = this._loadDaily();
        let usedToday = 0, freeUsed = 0, firstDayUsed = 0;
        if (daily && daily.date === today) {
            usedToday = daily.used || 0;
            freeUsed = daily.freeUsed || 0;
            firstDayUsed = daily.firstDayUsed || 0;
        }

        usedToday += result.consumed || 0;
        this._saveDaily({ date: today, used: usedToday, freeUsed, firstDayUsed });

        return {
            allowed: true,
            consumed: result.consumed,
            usedToday,
            remainingToday: result.remainingToday,
            quotaRemaining: result.remainingToday,
            freeRemaining: Math.max(0, this.FREE_TOKENS - freeUsed),
            firstDayRemaining: 0
        };
    },

    // ===== 本地消费（降级方案） =====
    _consumeLocal(count) {
        const status = this.getStatus();
        if (!status.active) return { allowed: false, reason: '未激活' };

        const record = this._load();
        const daily = this._loadDaily();
        const today = this._todayStr();

        let usedToday = 0, freeUsed = 0, firstDayUsed = 0;
        if (daily && daily.date === today) {
            usedToday = daily.used || 0;
            freeUsed = daily.freeUsed || 0;
            firstDayUsed = daily.firstDayUsed || 0;
        }

        const quotaRemaining = record ? Math.max(0, record.dailyQuota - usedToday) : 0;
        const freeRemaining = Math.max(0, (record ? record.freeTokens : this.FREE_TOKENS) - freeUsed);
        const isFirstDay = record && this._isFirstDay(record.activatedAt);
        const firstDayRemaining = isFirstDay ? Math.max(0, this.FIRST_DAY_BONUS - firstDayUsed) : 0;

        const totalRemaining = quotaRemaining + freeRemaining + firstDayRemaining;
        if (totalRemaining <= 0) {
            return { allowed: false, reason: '今日Token配额已用完，请明日再来或升级套餐' };
        }

        const actualConsume = Math.min(count, totalRemaining);
        let remaining = actualConsume;

        // 消费顺序：免费赠送 → 每日配额
        if (remaining > 0 && freeRemaining > 0) {
            const use = Math.min(remaining, freeRemaining);
            freeUsed += use;
            remaining -= use;
        }
        if (remaining > 0 && quotaRemaining > 0) {
            const use = Math.min(remaining, quotaRemaining);
            usedToday += use;
            remaining -= use;
        }

        this._saveDaily({ date: today, used: usedToday, freeUsed, firstDayUsed });

        return {
            allowed: true,
            consumed: actualConsume,
            usedToday,
            remainingToday: totalRemaining - actualConsume,
            quotaRemaining: Math.max(0, (record ? record.dailyQuota : 0) - usedToday),
            freeRemaining: Math.max(0, (record ? record.freeTokens : this.FREE_TOKENS) - freeUsed),
            firstDayRemaining: isFirstDay ? Math.max(0, this.FIRST_DAY_BONUS - firstDayUsed) : 0
        };
    },

    // ===== 预检查（服务端验证） =====
    async canConsume(count = 1) {
        const record = this._load();
        if (record && record.official) {
            return this._canConsumeLocal(count);
        }

        const machineId = typeof MachineId !== 'undefined' ? MachineId.get() : 'unknown';
        const deviceToken = this._loadDeviceToken();

        if (!deviceToken) {
            if (this._load()) {
                return { allowed: false, reason: '缺少设备令牌，请重新激活卡密' };
            }
            return this._canConsumeLocal(count);
        }

        const result = await LicenseClient.checkQuota(machineId, deviceToken, count);

        if (!result.allowed) {
            return { allowed: false, reason: result.message || result.reason || '服务端配额验证失败' };
        }

        return { allowed: true, remaining: result.remainingToday };
    },

    // ===== 本地预检（降级方案） =====
    _canConsumeLocal(count = 1) {
        const status = this.getStatus();
        if (!status.active) return { allowed: false, reason: '未激活' };
        if (status.remainingToday < count) {
            return { allowed: false, reason: '今日Token配额不足' };
        }
        return { allowed: true, remaining: status.remainingToday };
    },

    // ===== 登出/清除 =====
    clear() {
        // 只清除当前用户的数据
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.endsWith(this._baseStorageKey)) keys.push(k);
            if (k && k.endsWith(this._baseDailyKey)) keys.push(k);
            if (k && k.endsWith(this._deviceTokenKey)) keys.push(k);
        }
        keys.forEach(k => localStorage.removeItem(k));
    },

    // ===== 格式化显示 =====
    formatStatus() {
        const s = this.getStatus();
        if (s.isFree) return `免费体验 · 剩余 ${s.remainingToday.toLocaleString()} Token`;
        if (s.official) return `${s.typeName} · ${s.tierName} · 今日${s.remainingToday.toLocaleString()} Token`;
        const parts = [`${s.typeName} · ${s.tierName}`];
        if (s.daysLeft > 0) parts.push(`剩${s.daysLeft}天`);
        parts.push(`今日${s.remainingToday.toLocaleString()} Token`);
        return parts.join(' · ');
    }
};
