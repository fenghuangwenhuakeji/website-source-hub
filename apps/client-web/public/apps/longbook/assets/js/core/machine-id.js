/**
 * MachineId - 机器码生成模块
 * 支持：Electron 硬件 ID / 浏览器指纹
 * 目的：让激活数据绑定到物理机器，不因换路径/浏览器而丢失
 */
const MachineId = {
    _id: null,

    get() {
        if (this._id) return this._id;

        // Electron 环境：预加载脚本注入的真实硬件 ID
        if (typeof window !== 'undefined' && window.__MACHINE_ID__) {
            this._id = String(window.__MACHINE_ID__);
            return this._id;
        }

        // 浏览器环境：生成硬件指纹
        this._id = this._browserFingerprint();
        return this._id;
    },

    _browserFingerprint() {
        const parts = [];

        // 屏幕信息
        try {
            parts.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
        } catch (e) { parts.push('noscreen'); }

        // 时区
        try {
            parts.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
        } catch (e) { parts.push('notz'); }

        // Canvas 指纹
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 200;
            canvas.height = 50;
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#f60';
            ctx.fillRect(0, 0, 200, 50);
            ctx.fillStyle = '#069';
            ctx.fillText('MachineId v2.0 ' + (navigator.userAgent || '').slice(0, 20), 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('Fingerprint', 4, 25);
            parts.push(canvas.toDataURL().slice(-32));
        } catch (e) { parts.push('nocanvas'); }

        // WebGL 信息
        try {
            const gl = document.createElement('canvas').getContext('webgl');
            if (gl) {
                const dbg = gl.getExtension('WEBGL_debug_renderer_info');
                if (dbg) {
                    parts.push(gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) || '');
                    parts.push(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '');
                }
            }
        } catch (e) { parts.push('nowebgl'); }

        // 硬件信息
        parts.push(navigator.hardwareConcurrency || '');
        parts.push(navigator.deviceMemory || '');
        parts.push(navigator.platform || '');

        // 语言
        parts.push(navigator.language || '');
        parts.push((navigator.languages || []).join(','));

        const text = parts.join('::');
        return this._hash(text);
    },

    _hash(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            const c = str.charCodeAt(i);
            h = ((h << 5) - h) + c;
            h |= 0;
        }
        const hex = Math.abs(h).toString(16).padStart(8, '0');
        return 'b' + hex + hex; // 16位
    }
};

window.MachineId = MachineId;
