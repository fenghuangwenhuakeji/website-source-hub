/**
 * 工作空间管理系统 - AI酒馆增强版
 * 
 * 三级 fallback 架构:
 * 1. Electron 文件系统 (桌面应用)
 * 2. File System Access API (现代浏览器)
 * 3. 虚拟工作空间 (纯 IndexedDB)
 * 
 * 特性:
 * - 多工作空间管理
 * - 数据隔离
 * - 自动同步
 * - 导入导出
 */

class WorkspaceManager {
    constructor(dbManager) {
        this.dbManager = dbManager;
        this.dirHandle = null;
        this.electronPath = null;
        this.virtualWorkspace = null;
        
        this._writeQueue = {};
        this._DEBOUNCE_MS = 800;
        
        this.ALL_STORES = [
            'scripts', 'saves', 'achievements', 'stats', 'inventory', 
            'skills', 'quests', 'api_pool', 'persistent_memory',
            'workspace_config', 'game_history'
        ];
        
        this.GLOBAL_STORES = ['api_pool', 'workspace_config'];
    }

    get FOLDER_STORES() {
        return this.ALL_STORES.filter(s => !this.GLOBAL_STORES.includes(s));
    }

    isElectron() {
        return !!(window.electronAPI && window.electronAPI.fs);
    }

    _isDesktopShell() {
        if (window.process && window.process.type) return true;
        if (navigator.userAgent && navigator.userAgent.includes('Electron')) return true;
        if (location.protocol === 'file:') return true;
        if (!location.origin || location.origin === 'null') return true;
        return false;
    }

    hasFSAPI() {
        return !!window.showDirectoryPicker && !this._isDesktopShell();
    }

    isVirtual() {
        return !!this.virtualWorkspace;
    }

    isReady() {
        return !!(this.dirHandle || this.electronPath || this.virtualWorkspace);
    }

    async init() {
        const savedPath = localStorage.getItem('tavern_workspace_path');
        const savedVirtual = localStorage.getItem('tavern_virtual_workspace');
        
        if (savedVirtual) {
            this.virtualWorkspace = savedVirtual;
            console.log('Restored virtual workspace:', savedVirtual);
            return true;
        }
        
        if (savedPath && this.isElectron()) {
            this.electronPath = savedPath;
            console.log('Restored electron path:', savedPath);
            return true;
        }
        
        return this._pickVirtualWorkspace('默认工作空间');
    }

    async pickWorkspace() {
        try {
            if (this.isElectron()) {
                const r = await window.electronAPI.showOpenDialog({ 
                    properties: ['openDirectory'] 
                });
                if (r && !r.canceled && r.filePaths && r.filePaths[0]) {
                    this.electronPath = r.filePaths[0];
                    localStorage.setItem('tavern_workspace_path', r.filePaths[0]);
                    await this._onWorkspaceSwitch();
                    return true;
                }
            } else if (this.hasFSAPI()) {
                try {
                    this.dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
                    localStorage.setItem('tavern_workspace_folder', this.dirHandle.name);
                    await this._onWorkspaceSwitch();
                    return true;
                } catch (fsErr) {
                    if (fsErr.name === 'AbortError') return false;
                    console.warn('FSAPI unavailable, falling back to virtual workspace');
                    return await this._showWorkspaceDialog();
                }
            } else {
                return await this._showWorkspaceDialog();
            }
        } catch (e) {
            if (e.name !== 'AbortError') console.error('Workspace pick error:', e);
            return false;
        }
    }

    async _showWorkspaceDialog() {
        const list = this._getVirtualList();
        const current = this.virtualWorkspace || '';

        const overlay = document.createElement('div');
        overlay.className = 'workspace-dialog-overlay';
        overlay.innerHTML = `
            <div class="workspace-dialog">
                <div class="workspace-dialog-header">
                    <span>🗂️ 工作空间管理</span>
                    <button class="workspace-close-btn">&times;</button>
                </div>
                <div class="workspace-dialog-body">
                    <div class="workspace-list">
                        ${list.length > 0 
                            ? list.map(w => `
                                <div class="workspace-item ${w === current ? 'active' : ''}" data-ws="${w}">
                                    <span class="workspace-icon">📁</span>
                                    <span class="workspace-name">${w}</span>
                                    ${w === current ? '<span class="workspace-badge">当前</span>' : ''}
                                    <button class="workspace-delete-btn" data-del="${w}" title="删除">🗑️</button>
                                </div>
                            `).join('')
                            : '<div class="workspace-empty">暂无工作空间，请新建一个</div>'
                        }
                    </div>
                    <div class="workspace-create">
                        <input type="text" id="ws-new-name" placeholder="输入新工作空间名称...">
                        <button class="workspace-create-btn" id="ws-create-btn">新建</button>
                    </div>
                </div>
                <div class="workspace-dialog-footer">
                    <span class="workspace-hint">💡 工作空间数据存储在浏览器本地，切换工作空间 = 切换独立数据集</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        this._injectDialogStyles();

        return new Promise((resolve) => {
            const close = () => { overlay.remove(); resolve(false); };
            
            overlay.querySelector('.workspace-close-btn').onclick = close;
            overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

            overlay.querySelectorAll('[data-ws]').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (e.target.closest('.workspace-delete-btn')) return;
                    const name = btn.dataset.ws;
                    if (name === current) { close(); return; }
                    overlay.remove();
                    await this._switchVirtualWorkspace(name);
                    resolve(true);
                });
            });

            overlay.querySelectorAll('.workspace-delete-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const name = btn.dataset.del;
                    if (name === current) {
                        this._showToast('不能删除当前工作空间');
                        return;
                    }
                    if (!confirm(`确定删除工作空间「${name}」？数据将无法恢复。`)) return;
                    this._deleteVirtualWorkspace(name);
                    this._showToast('已删除: ' + name);
                    overlay.remove();
                    this._showWorkspaceDialog().then(resolve);
                });
            });

            const createBtn = overlay.querySelector('#ws-create-btn');
            const input = overlay.querySelector('#ws-new-name');
            
            const createFn = async () => {
                const name = (input.value || '').trim();
                if (!name) { input.focus(); return; }
                if (list.includes(name)) {
                    this._showToast('工作空间名称已存在');
                    return;
                }
                overlay.remove();
                await this._switchVirtualWorkspace(name);
                resolve(true);
            };
            
            createBtn.onclick = createFn;
            input.onkeypress = (e) => { if (e.key === 'Enter') createFn(); };
            input.focus();
        });
    }

    _injectDialogStyles() {
        if (document.getElementById('workspace-dialog-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'workspace-dialog-styles';
        style.textContent = `
            .workspace-dialog-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.7);
                backdrop-filter: blur(4px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .workspace-dialog {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 16px;
                width: 420px;
                max-height: 80vh;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            }
            .workspace-dialog-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                font-size: 16px;
                font-weight: 600;
                color: #fff;
            }
            .workspace-close-btn {
                background: none;
                border: none;
                color: #888;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }
            .workspace-close-btn:hover { color: #fff; }
            .workspace-dialog-body {
                padding: 16px;
                max-height: 50vh;
                overflow-y: auto;
            }
            .workspace-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
            .workspace-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 14px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .workspace-item:hover { background: rgba(255,255,255,0.1); }
            .workspace-item.active {
                background: rgba(0,188,212,0.15);
                border-color: rgba(0,188,212,0.4);
            }
            .workspace-icon { font-size: 18px; }
            .workspace-name { flex: 1; color: #fff; font-size: 14px; }
            .workspace-badge {
                font-size: 10px;
                padding: 2px 8px;
                background: rgba(0,188,212,0.3);
                color: #00bcd4;
                border-radius: 10px;
            }
            .workspace-delete-btn {
                background: none;
                border: none;
                font-size: 14px;
                cursor: pointer;
                opacity: 0.5;
                padding: 4px;
            }
            .workspace-delete-btn:hover { opacity: 1; }
            .workspace-empty {
                text-align: center;
                padding: 20px;
                color: #666;
                font-size: 13px;
            }
            .workspace-create {
                display: flex;
                gap: 10px;
            }
            .workspace-create input {
                flex: 1;
                background: rgba(0,0,0,0.3);
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 8px;
                padding: 10px 14px;
                color: #fff;
                font-size: 13px;
                outline: none;
            }
            .workspace-create input:focus { border-color: #00bcd4; }
            .workspace-create-btn {
                background: linear-gradient(135deg, #00bcd4, #00acc1);
                border: none;
                border-radius: 8px;
                padding: 10px 20px;
                color: #fff;
                font-weight: 600;
                cursor: pointer;
            }
            .workspace-create-btn:hover { filter: brightness(1.1); }
            .workspace-dialog-footer {
                padding: 12px 20px;
                border-top: 1px solid rgba(255,255,255,0.1);
            }
            .workspace-hint {
                font-size: 11px;
                color: #666;
            }
        `;
        document.head.appendChild(style);
    }

    _getVirtualList() {
        try {
            return JSON.parse(localStorage.getItem('tavern_virtual_workspaces') || '[]');
        } catch {
            return [];
        }
    }

    _saveVirtualList(list) {
        localStorage.setItem('tavern_virtual_workspaces', JSON.stringify(list));
    }

    async _pickVirtualWorkspace(name) {
        const list = this._getVirtualList();
        if (!list.includes(name)) {
            list.push(name);
            this._saveVirtualList(list);
        }
        await this._switchVirtualWorkspace(name);
        return true;
    }

    async _switchVirtualWorkspace(name) {
        const oldWorkspace = this.virtualWorkspace;
        this.virtualWorkspace = name;
        this.dirHandle = null;
        this.electronPath = null;
        
        localStorage.setItem('tavern_virtual_workspace', name);
        localStorage.removeItem('tavern_workspace_path');
        localStorage.removeItem('tavern_workspace_folder');
        
        await this._onWorkspaceSwitch(oldWorkspace);
        
        this._showToast(`✓ 已切换到工作空间: ${name}`);
        return true;
    }

    _deleteVirtualWorkspace(name) {
        const list = this._getVirtualList();
        const idx = list.indexOf(name);
        if (idx > -1) {
            list.splice(idx, 1);
            this._saveVirtualList(list);
        }
    }

    async _onWorkspaceSwitch(oldWorkspace = null) {
        if (oldWorkspace && this.dbManager && this.dbManager.db) {
            try {
                for (const store of this.FOLDER_STORES) {
                    if (this.dbManager.db.objectStoreNames.contains(store)) {
                        await this._clearStore(store);
                    }
                }
            } catch (e) {
                console.warn('Clear store error:', e);
            }
        }
        
        window.dispatchEvent(new CustomEvent('workspace-switched', {
            detail: { 
                workspace: this.virtualWorkspace || this.electronPath || this.dirHandle?.name,
                type: this.isVirtual() ? 'virtual' : (this.electronPath ? 'electron' : 'fsapi')
            }
        }));
    }

    async _clearStore(storeName) {
        return new Promise((resolve, reject) => {
            const tx = this.dbManager.db.transaction([storeName], 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    async exportWorkspace() {
        const data = {
            workspace: this.virtualWorkspace || 'export',
            exportedAt: new Date().toISOString(),
            stores: {}
        };
        
        for (const store of this.FOLDER_STORES) {
            try {
                data.stores[store] = await this.dbManager.getAll(store);
            } catch (e) {
                console.warn(`Export store ${store} error:`, e);
            }
        }
        
        return data;
    }

    async importWorkspace(data) {
        if (!data || !data.stores) {
            throw new Error('Invalid workspace data');
        }
        
        for (const [store, items] of Object.entries(data.stores)) {
            if (!Array.isArray(items)) continue;
            try {
                for (const item of items) {
                    await this.dbManager.put(store, item);
                }
            } catch (e) {
                console.warn(`Import store ${store} error:`, e);
            }
        }
        
        this._showToast(`✓ 已导入 ${Object.keys(data.stores).length} 个数据集`);
        
        window.dispatchEvent(new CustomEvent('workspace-imported', { detail: data }));
    }

    async downloadBackup() {
        const data = await this.exportWorkspace();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tavern_backup_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this._showToast('✓ 备份已下载');
    }

    async uploadBackup(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    await this.importWorkspace(data);
                    resolve(true);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    getCurrentWorkspace() {
        return {
            name: this.virtualWorkspace || this.electronPath || this.dirHandle?.name || '未设置',
            type: this.isVirtual() ? 'virtual' : (this.electronPath ? 'electron' : 'fsapi'),
            isReady: this.isReady()
        };
    }

    _showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'workspace-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            color: #fff;
            padding: 12px 20px;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.1);
            z-index: 10001;
            font-size: 13px;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

export { WorkspaceManager };
