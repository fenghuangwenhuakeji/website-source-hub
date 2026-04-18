function showNotification(msg, type = 'info') {
    const n = document.createElement('div');
    n.className = `notification ${type}`;
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('已复制', 'success');
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showNotification('已复制', 'success');
    });
}

function estimateTokens(text) {
    if (!text) return 0;
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars * 1.5 + otherChars * 0.25);
}

function updateIOMonitor(monitorId, content, type) {
    const monitor = document.getElementById(monitorId);
    if (!monitor) return;
    const timestamp = new Date().toLocaleTimeString();
    const itemClass = type === 'input' ? 'input-item' : 'output-item';
    const item = document.createElement('div');
    item.className = `io-item ${itemClass}`;
    let displayContent = content.length > 500 ? content.substring(0, 500) + '...' : content;
    item.innerHTML = `<div class="io-item-header">[${timestamp}] ${type === 'input' ? '用户输入' : 'AI输出'} (${content.length} 字符)</div><div class="io-item-content">${displayContent}</div>`;
    if (monitor.textContent === '等待输入...' || monitor.textContent === '等待输出...') monitor.innerHTML = '';
    monitor.appendChild(item);
    monitor.scrollTop = monitor.scrollHeight;
}

function clearIOMonitor(monitorId) {
    const monitor = document.getElementById(monitorId);
    if (!monitor) return;
    monitor.innerHTML = monitorId.includes('input') ? '等待输入...' : '等待输出...';
}

function _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


/**
 * 应用内输入弹窗，替代浏览器原生 prompt()
 * @param {string} label - 提示文字
 * @param {string} defaultVal - 默认值
 * @returns {Promise<string|null>} 用户输入或 null(取消)
 */
function appPrompt(label, defaultVal) {
    return new Promise(function(resolve) {
        // 移除已有的
        var old = document.getElementById('app-prompt-modal');
        if (old) old.remove();

        var modal = document.createElement('div');
        modal.id = 'app-prompt-modal';
        modal.className = 'modal active';
        modal.innerHTML =
            '<div class="modal-content" style="max-width:420px;">' +
                '<div class="modal-header">' + _escapeHtml(label) + '</div>' +
                '<div class="form-group">' +
                    '<input type="text" class="form-input" id="app-prompt-input" value="' + _escapeHtml(defaultVal || '') + '" autocomplete="off">' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button class="btn" id="app-prompt-cancel">取消</button>' +
                    '<button class="btn btn-primary" id="app-prompt-ok">确定</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(modal);

        var input = document.getElementById('app-prompt-input');
        var done = false;

        function finish(val) {
            if (done) return;
            done = true;
            modal.remove();
            resolve(val);
        }

        input.focus();
        input.select();

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') { e.preventDefault(); finish(input.value.trim() || null); }
            if (e.key === 'Escape') finish(null);
        });
        document.getElementById('app-prompt-ok').addEventListener('click', function() {
            finish(input.value.trim() || null);
        });
        document.getElementById('app-prompt-cancel').addEventListener('click', function() {
            finish(null);
        });
        modal.addEventListener('click', function(e) {
            if (e.target === modal) finish(null);
        });
    });
}

/**
 * 本地文件系统管理器
 * 用户选择一个本地文件夹，所有保存操作都写JSON到该文件夹
 * file:// 协议下 showDirectoryPicker 不可用时 fallback 到 <a download>
 */
var localFS = {
    _dirHandle: null,
    _supported: typeof window.showDirectoryPicker === 'function',

    // 选择文件夹
    pickFolder: async function() {
        if (!this._supported) {
            showNotification('当前环境不支持文件夹选择（需要http/https），将使用下载方式保存', 'info');
            return false;
        }
        try {
            this._dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
            showNotification('已选择文件夹: ' + this._dirHandle.name, 'success');
            var el = document.getElementById('local-folder-name');
            if (el) el.textContent = '📁 ' + this._dirHandle.name;
            return true;
        } catch(e) {
            if (e.name !== 'AbortError') showNotification('选择文件夹失败: ' + e.message, 'error');
            return false;
        }
    },

    // 确保有文件夹句柄（没有就弹选择）
    ensureFolder: async function() {
        if (this._dirHandle) {
            // 验证权限
            try {
                var perm = await this._dirHandle.queryPermission({ mode: 'readwrite' });
                if (perm === 'granted') return true;
                perm = await this._dirHandle.requestPermission({ mode: 'readwrite' });
                if (perm === 'granted') return true;
            } catch(e) {}
        }
        return await this.pickFolder();
    },

    // 保存JSON文件到选定文件夹
    saveJSON: async function(filename, data) {
        var json = JSON.stringify(data, null, 2);

        // 尝试用 File System Access API
        if (this._supported && this._dirHandle) {
            try {
                var ok = await this.ensureFolder();
                if (ok) {
                    var fileHandle = await this._dirHandle.getFileHandle(filename, { create: true });
                    var writable = await fileHandle.createWritable();
                    await writable.write(json);
                    await writable.close();
                    return true;
                }
            } catch(e) {
                console.warn('File System Access write failed, fallback to download:', e);
            }
        }

        // Fallback: 下载
        var blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        return true;
    },

    // 读取文件夹中的所有JSON文件
    readAllJSON: async function() {
        if (!this._dirHandle) return [];
        var results = [];
        try {
            for await (var entry of this._dirHandle.values()) {
                if (entry.kind === 'file' && entry.name.endsWith('.json')) {
                    try {
                        var file = await entry.getFile();
                        var text = await file.text();
                        var data = JSON.parse(text);
                        data._filename = entry.name;
                        results.push(data);
                    } catch(e) { console.warn('Read JSON failed:', entry.name, e); }
                }
            }
        } catch(e) { console.warn('readAllJSON failed:', e); }
        return results;
    },

    // 删除文件
    deleteFile: async function(filename) {
        if (!this._dirHandle) return false;
        try {
            await this._dirHandle.removeEntry(filename);
            return true;
        } catch(e) { console.warn('Delete failed:', filename, e); return false; }
    },

    // 获取当前文件夹名
    getFolderName: function() {
        return this._dirHandle ? this._dirHandle.name : '未选择';
    },

    hasFolder: function() {
        return !!this._dirHandle;
    }
};
