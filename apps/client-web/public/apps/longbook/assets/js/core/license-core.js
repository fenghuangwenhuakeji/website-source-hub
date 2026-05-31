/**
 * License Client v3.0 - 服务端验证客户端
 * 所有卡密验证走服务端，不再本地验证
 */
const LicenseClient = {
    BASE_URL: (window.LICENSE_API_BASE_URL || 'https://fhwhkj.top/license').replace(/\/$/, ''),

    /**
     * 激活卡密
     * @param {string} key 卡密密钥
     * @param {string} machineId 机器ID
     * @param {string} userId 用户ID（可选）
     * @returns {Promise<Object>} 激活结果，包含 deviceToken
     */
    async activate(key, machineId, userId) {
        try {
            const response = await fetch(`${this.BASE_URL}/api/activate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, machineId, userId })
            });

            if (!response.ok) {
                const text = await response.text();
                return { success: false, message: `服务器错误: ${response.status} ${text}` };
            }

            const result = await response.json();

            // 服务端返回格式: { data: { success, deviceToken, ... }, signature }
            if (result.data) {
                return result.data;
            }

            // 兼容旧格式
            return result;
        } catch (error) {
            console.error('[LicenseClient] activate error:', error);
            return { success: false, message: '网络连接失败: ' + error.message };
        }
    },

    /**
     * 查询授权状态
     * @param {string} machineId 机器ID
     * @param {string} deviceToken 设备令牌
     * @returns {Promise<Object>} 授权状态
     */
    async check(machineId, deviceToken) {
        try {
            const response = await fetch(`${this.BASE_URL}/api/check`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Device-Token': deviceToken
                },
                body: JSON.stringify({ machineId })
            });

            if (!response.ok) {
                if (response.status === 403) {
                    return { success: false, active: false, message: '设备令牌无效' };
                }
                return { success: false, active: false, message: `服务器错误: ${response.status}` };
            }

            const result = await response.json();

            // 服务端返回格式: { data: { active, ... }, signature }
            if (result.data) {
                return { success: true, ...result.data };
            }

            return { success: true, ...result };
        } catch (error) {
            console.error('[LicenseClient] check error:', error);
            return { success: false, active: false, message: '网络连接失败: ' + error.message };
        }
    },

    /**
     * 消费配额
     * @param {string} machineId 机器ID
     * @param {string} deviceToken 设备令牌
     * @param {number} tokens 消费数量
     * @returns {Promise<Object>} 消费结果
     */
    async consume(machineId, deviceToken, tokens) {
        try {
            const response = await fetch(`${this.BASE_URL}/api/consume`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Device-Token': deviceToken
                },
                body: JSON.stringify({ machineId, tokens })
            });

            if (!response.ok) {
                if (response.status === 403) {
                    return { allowed: false, message: '设备令牌无效' };
                }
                return { allowed: false, message: `服务器错误: ${response.status}` };
            }

            const result = await response.json();

            if (result.data) {
                return result.data;
            }

            return result;
        } catch (error) {
            console.error('[LicenseClient] consume error:', error);
            return { allowed: false, message: '网络连接失败: ' + error.message };
        }
    },

    /**
     * 检查配额
     * @param {string} machineId 机器ID
     * @param {string} deviceToken 设备令牌
     * @param {number} tokens 需要的数量
     * @returns {Promise<Object>} 检查结果
     */
    async checkQuota(machineId, deviceToken, tokens) {
        try {
            const response = await fetch(`${this.BASE_URL}/api/check-quota`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Device-Token': deviceToken
                },
                body: JSON.stringify({ machineId, tokens })
            });

            if (!response.ok) {
                if (response.status === 403) {
                    return { allowed: false, message: '设备令牌无效' };
                }
                return { allowed: false, message: `服务器错误: ${response.status}` };
            }

            const result = await response.json();

            if (result.data) {
                return result.data;
            }

            return result;
        } catch (error) {
            console.error('[LicenseClient] checkQuota error:', error);
            return { allowed: false, message: '网络连接失败: ' + error.message };
        }
    }
};

// 兼容旧的 LicenseCore 引用
const LicenseCore = LicenseClient;
