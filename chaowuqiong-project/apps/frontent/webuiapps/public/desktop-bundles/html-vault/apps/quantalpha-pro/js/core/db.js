// ═══════════════════════════════════════════════════════════════
// QuantAlpha Pro - 数据库核心 + 本地同步
// ═══════════════════════════════════════════════════════════════

const LocalSync = {
    dirHandle: null,
    electronPath: null,
    virtualWorkspace: null,
    _writeQueue: {},
    _DEBOUNCE_MS: 800,

    ALL_STORES: [
        'strategies', 'backtests', 'factors', 'portfolios', 'risk_configs',
        'trades', 'positions', 'signals', 'market_data', 'code_snippets',
        'reports', 'watchlists', 'alerts', 'settings', 'chat_sessions',
        'api_configs', 'data_sources'
    ],

    GLOBAL_STORES: ['api_configs', 'settings'],

    get FOLDER_STORES() {
        return this.ALL_STORES.filter(s => !this.GLOBAL_STORES.includes(s));
    },

    isElectron: () => !!(window.electronAPI && window.electronAPI.fs),
    _isDesktopShell: () => {
        if (window.process && window.process.type) return true;
        if (navigator.userAgent && navigator.userAgent.includes('Electron')) return true;
        if (location.protocol === 'file:') return true;
        if (!location.origin || location.origin === 'null') return true;
        return false;
    },
    hasFSAPI: () => !!window.showDirectoryPicker && !LocalSync._isDesktopShell(),
    isVirtual: () => !!LocalSync.virtualWorkspace,
    isReady: () => !!(LocalSync.dirHandle || LocalSync.electronPath || LocalSync.virtualWorkspace),

    pickFolder: async () => {
        try {
            if (LocalSync.isElectron()) {
                const r = await window.electronAPI.showOpenDialog({ properties: ['openDirectory'] });
                if (r && !r.canceled && r.filePaths && r.filePaths[0]) {
                    LocalSync.electronPath = r.filePaths[0];
                    localStorage.setItem('local_sync_path', r.filePaths[0]);
                    UI.toast('✓ 已绑定文件夹: ' + r.filePaths[0]);
                    await LocalSync._onFolderSwitch();
                    return true;
                }
            } else if (LocalSync.hasFSAPI()) {
                try {
                    LocalSync.dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
                    localStorage.setItem('local_sync_folder_name', LocalSync.dirHandle.name);
                    UI.toast('✓ 已绑定文件夹: ' + LocalSync.dirHandle.name);
                    await LocalSync._onFolderSwitch();
                    return true;
                } catch(fsErr) {
                    if (fsErr.name === 'AbortError') return false;
                    console.warn('FSAPI 不可用，切换到虚拟工作空间:', fsErr.message);
                    return await LocalSync._pickVirtualWorkspace();
                }
            } else {
                return await LocalSync._pickVirtualWorkspace();
            }
        } catch (e) {
            if (e.name !== 'AbortError') UI.toast('切换失败: ' + e.message);
            return false;
        }
    },

    _pickVirtualWorkspace: async () => {
        const list = LocalSync._getVirtualList();
        const current = LocalSync.virtualWorkspace || '';

        const listHtml = list.length > 0
            ? list.map(w => `<button class="w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${w === current ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/5'}" data-ws="${w}">
                <i class="fa-solid fa-folder mr-2 ${w === current ? 'text-blue-400' : 'text-amber-400/60'}"></i>${w}
                ${w === current ? '<span class="text-[9px] text-blue-400 ml-2">当前</span>' : ''}
                <span class="float-right text-[10px] text-red-400/60 hover:text-red-400 ws-del" data-del="${w}" title="删除"><i class="fa-solid fa-trash"></i></span>
              </button>`).join('')
            : '<div class="text-[10px] text-dim text-center py-3">暂无工作空间，请新建一个</div>';

        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center';
        overlay.innerHTML = `
            <div class="bg-[#1a1a2e] rounded-2xl border border-white/10 p-6 w-[380px] max-h-[80vh] shadow-2xl">
                <div class="flex items-center justify-between mb-4">
                    <span class="text-base font-bold text-white"><i class="fa-solid fa-layer-group mr-2 text-amber-400"></i>工作空间</span>
                    <button class="text-white/40 hover:text-white text-lg ws-close"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="space-y-2 mb-4 max-h-[40vh] overflow-y-auto pr-1">${listHtml}</div>
                <div class="flex gap-2">
                    <input type="text" class="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:border-accent/50 outline-none" placeholder="输入新工作空间名称..." id="ws-new-name">
                    <button class="px-4 py-2 bg-gradient-to-r from-accent to-emerald-600 text-black rounded-lg text-sm font-bold hover:from-accent hover:to-emerald-500 transition-all ws-create">新建</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        return new Promise((resolve) => {
            overlay.querySelector('.ws-close').onclick = () => { overlay.remove(); resolve(false); };
            overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } });

            overlay.querySelectorAll('[data-ws]').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (e.target.closest('.ws-del')) return;
                    const name = btn.dataset.ws;
                    if (name === current) { overlay.remove(); resolve(false); return; }
                    overlay.remove();
                    await LocalSync._switchVirtualWorkspace(name);
                    resolve(true);
                });
            });

            overlay.querySelectorAll('.ws-del').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const name = btn.dataset.del;
                    if (name === current) { UI.toast('不能删除当前工作空间'); return; }
                    if (!confirm(`确定删除工作空间「${name}」？数据将无法恢复。`)) return;
                    LocalSync._deleteVirtualWorkspace(name);
                    UI.toast('已删除: ' + name);
                    overlay.remove();
                    LocalSync._pickVirtualWorkspace().then(resolve);
                });
            });

            const createFn = async () => {
                const input = overlay.querySelector('#ws-new-name');
                const name = (input.value || '').trim();
                if (!name) { input.focus(); return; }
                if (list.includes(name)) { UI.toast('工作空间已存在，请直接点击切换'); return; }
                overlay.remove();
                await LocalSync._switchVirtualWorkspace(name);
                resolve(true);
            };
            overlay.querySelector('.ws-create').onclick = createFn;
            overlay.querySelector('#ws-new-name').addEventListener('keydown', (e) => {
                if (e.key === 'Enter') createFn();
            });

            setTimeout(() => overlay.querySelector('#ws-new-name')?.focus(), 100);
        });
    },

    _switchVirtualWorkspace: async (name) => {
        const oldName = LocalSync.virtualWorkspace;
        if (oldName) { await LocalSync._saveVirtualData(oldName); }
        LocalSync.virtualWorkspace = name;
        localStorage.setItem('virtual_workspace', name);
        LocalSync._addToVirtualList(name);
        await LocalSync._onFolderSwitch();
    },

    _saveVirtualData: async (name) => {
        const snapshot = {};
        for (const store of LocalSync.FOLDER_STORES) {
            try { snapshot[store] = await DB._rawGetAll(store) || []; } catch(e) { snapshot[store] = []; }
        }
        snapshot._meta = { syncTime: new Date().toISOString(), version: DB.version };
        localStorage.setItem('vws_data_' + name, JSON.stringify(snapshot));
    },

    _loadVirtualData: async (name) => {
        const raw = localStorage.getItem('vws_data_' + name);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch { return null; }
    },

    _getVirtualList: () => {
        try { return JSON.parse(localStorage.getItem('virtual_workspace_list') || '[]'); } catch { return []; }
    },
    _addToVirtualList: (name) => {
        const list = LocalSync._getVirtualList();
        if (!list.includes(name)) { list.push(name); localStorage.setItem('virtual_workspace_list', JSON.stringify(list)); }
    },
    _deleteVirtualWorkspace: (name) => {
        const list = LocalSync._getVirtualList().filter(n => n !== name);
        localStorage.setItem('virtual_workspace_list', JSON.stringify(list));
        localStorage.removeItem('vws_data_' + name);
    },

    _onFolderSwitch: async () => {
        LocalSync._updateStatusBar();
        try {
            let hasData = false;

            if (LocalSync.isVirtual()) {
                const snapshot = await LocalSync._loadVirtualData(LocalSync.virtualWorkspace);
                hasData = !!(snapshot && snapshot._meta);

                if (hasData) {
                    UI.toast('正在加载工作空间...');
                    await LocalSync._clearAllStores();
                    let count = 0;
                    for (const store of LocalSync.FOLDER_STORES) {
                        if (snapshot[store] && Array.isArray(snapshot[store])) {
                            for (const item of snapshot[store]) {
                                await DB._rawPut(store, item);
                                count++;
                            }
                        }
                    }
                    LocalSync._resetModuleStates();
                    UI.toast(`✓ 已加载工作空间「${LocalSync.virtualWorkspace}」(${count}条)`);
                } else {
                    UI.toast('新工作空间，全新开始...');
                    await LocalSync._clearAllStores();
                    LocalSync._resetModuleStates();
                    await LocalSync._saveVirtualData(LocalSync.virtualWorkspace);
                    UI.toast('✓ 工作空间「' + LocalSync.virtualWorkspace + '」已就绪');
                }
            } else {
                const meta = await LocalSync._readRawFile('_sync_meta.json');
                hasData = !!meta;

                if (hasData) {
                    UI.toast('正在从文件夹加载数据...');
                    await LocalSync._clearAllStores();
                    const count = await LocalSync.loadAll();
                    LocalSync._resetModuleStates();
                    UI.toast(`✓ 已从文件夹加载 ${count} 条数据`);
                } else {
                    UI.toast('新文件夹，全新工作空间...');
                    await LocalSync._clearAllStores();
                    LocalSync._resetModuleStates();
                    const newMeta = { syncTime: new Date().toISOString(), version: DB.version };
                    await LocalSync._writeRawFile('_sync_meta.json', newMeta);
                    UI.toast('✓ 全新工作空间已就绪');
                }
            }

            localStorage.setItem('local_sync_last', new Date().toISOString());
        } catch(e) { console.warn('文件夹切换失败:', e); UI.toast('切换失败: ' + e.message); }
        LocalSync._updateStatusBar();
    },

    _clearAllStores: async () => {
        for (const store of LocalSync.FOLDER_STORES) {
            try { await DB.op(store, 'readwrite', st => st.clear()); } catch(e) {}
        }
    },

    _resetModuleStates: () => {
        const vp = document.getElementById('viewport');
        if (vp) { vp.innerHTML = ''; }
        try {
            if (typeof App !== 'undefined' && App._currentModule) { App.nav(App._currentModule); }
        } catch(e) {}
    },

    _verifyPermission: async () => {
        if (LocalSync.isElectron()) return !!LocalSync.electronPath;
        if (!LocalSync.dirHandle) return false;
        try {
            let p = await LocalSync.dirHandle.queryPermission({ mode: 'readwrite' });
            if (p === 'granted') return true;
            p = await LocalSync.dirHandle.requestPermission({ mode: 'readwrite' });
            return p === 'granted';
        } catch { return false; }
    },

    _writeRawFile: async (filename, data) => {
        const json = JSON.stringify(data, null, 2);
        if (LocalSync.isElectron()) {
            await window.electronAPI.fs.writeFile(LocalSync.electronPath + '\\' + filename, json, 'utf-8');
        } else if (LocalSync.dirHandle) {
            const fh = await LocalSync.dirHandle.getFileHandle(filename, { create: true });
            const w = await fh.createWritable();
            await w.write(json);
            await w.close();
        }
    },

    _readRawFile: async (filename) => {
        try {
            if (LocalSync.isElectron()) {
                const text = await window.electronAPI.fs.readFile(LocalSync.electronPath + '\\' + filename, 'utf-8');
                return JSON.parse(text);
            } else if (LocalSync.dirHandle) {
                const fh = await LocalSync.dirHandle.getFileHandle(filename);
                const file = await fh.getFile();
                return JSON.parse(await file.text());
            }
        } catch { return null; }
    },

    _writeStoreFile: async (store, data) => {
        await LocalSync._writeRawFile(store + '.json', data || []);
    },

    _scheduleWrite: (store) => {
        if (!LocalSync.isReady()) return;
        if (LocalSync.GLOBAL_STORES.includes(store)) return;
        clearTimeout(LocalSync._writeQueue[store]);
        LocalSync._writeQueue[store] = setTimeout(async () => {
            try {
                if (LocalSync.isVirtual()) {
                    await LocalSync._saveVirtualData(LocalSync.virtualWorkspace);
                    localStorage.setItem('local_sync_last', new Date().toISOString());
                    LocalSync._updateStatusBar();
                } else {
                    if (!(await LocalSync._verifyPermission())) return;
                    const data = await DB._rawGetAll(store);
                    await LocalSync._writeStoreFile(store, data);
                    localStorage.setItem('local_sync_last', new Date().toISOString());
                    LocalSync._updateStatusBar();
                }
            } catch(e) { console.warn('实时同步失败 [' + store + ']:', e); }
        }, LocalSync._DEBOUNCE_MS);
    },

    loadAll: async () => {
        if (!LocalSync.isReady()) return 0;
        if (!(await LocalSync._verifyPermission())) return 0;
        let total = 0;
        for (const store of LocalSync.FOLDER_STORES) {
            const data = await LocalSync._readRawFile(store + '.json');
            if (data && Array.isArray(data) && data.length > 0) {
                for (const item of data) {
                    await DB._rawPut(store, item);
                    total++;
                }
            }
        }
        return total;
    },

    syncAll: async () => {
        if (!LocalSync.isReady()) { UI.toast('请先选择工作空间'); return; }
        if (LocalSync.isVirtual()) {
            UI.toast('正在保存...');
            await LocalSync._saveVirtualData(LocalSync.virtualWorkspace);
            localStorage.setItem('local_sync_last', new Date().toISOString());
            UI.toast('✓ 工作空间数据已保存');
            LocalSync._updateStatusBar();
            return;
        }
        if (!(await LocalSync._verifyPermission())) { UI.toast('权限失效，请重新选择文件夹'); return; }
        UI.toast('正在全量同步...');
        for (const store of LocalSync.FOLDER_STORES) {
            try {
                const data = await DB.getAll(store);
                await LocalSync._writeStoreFile(store, data);
            } catch(e) {}
        }
        localStorage.setItem('local_sync_last', new Date().toISOString());
        UI.toast('✓ 全量同步完成');
        LocalSync._updateStatusBar();
    },

    disconnect: () => {
        if (LocalSync.isVirtual()) { LocalSync._saveVirtualData(LocalSync.virtualWorkspace); }
        LocalSync.dirHandle = null;
        LocalSync.electronPath = null;
        LocalSync.virtualWorkspace = null;
        localStorage.removeItem('local_sync_path');
        localStorage.removeItem('local_sync_folder_name');
        localStorage.removeItem('local_sync_last');
        localStorage.removeItem('virtual_workspace');
        Object.values(LocalSync._writeQueue).forEach(t => clearTimeout(t));
        LocalSync._writeQueue = {};
        UI.toast('已断开工作空间');
        LocalSync._updateStatusBar();
    },

    getFolderName: () => {
        if (LocalSync.isElectron() && LocalSync.electronPath) return LocalSync.electronPath;
        if (LocalSync.dirHandle) return LocalSync.dirHandle.name;
        if (LocalSync.virtualWorkspace) return LocalSync.virtualWorkspace;
        return localStorage.getItem('local_sync_folder_name') || localStorage.getItem('virtual_workspace') || '';
    },

    _updateStatusBar: () => {
        const isVirtual = LocalSync.isVirtual();
        const el = document.getElementById('local-sync-status');
        if (el) LocalSync._renderSettingsUI(el);
        const ind = document.getElementById('local-sync-indicator');
        if (ind) {
            if (LocalSync.isReady()) {
                const last = localStorage.getItem('local_sync_last');
                const timeStr = last ? new Date(last).toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'}) : '';
                const icon = isVirtual ? 'fa-layer-group' : 'fa-hard-drive';
                ind.innerHTML = `<i class="fa-solid ${icon} text-profit text-[10px]"></i><span class="text-[9px] text-profit/70 ml-1">${timeStr}</span>`;
                ind.title = (isVirtual ? '工作空间: ' : '本地同步已连接 - ') + LocalSync.getFolderName();
                ind.style.display = 'flex';
            } else {
                ind.style.display = 'none';
            }
        }
    },

    _renderSettingsUI: (el) => {
        const ready = LocalSync.isReady();
        const name = LocalSync.getFolderName();
        const last = localStorage.getItem('local_sync_last');
        const isVirtual = LocalSync.isVirtual();

        if (ready) {
            el.innerHTML = `
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs text-profit"><i class="fa-solid fa-circle-check mr-1"></i>${isVirtual ? '工作空间模式' : '已连接 · 实时同步中'}</span>
                    <button class="btn btn-xs bg-loss/20 text-loss border-loss/30" onclick="LocalSync.disconnect()"><i class="fa-solid fa-unlink mr-1"></i>断开</button>
                </div>
                <div class="text-[10px] text-dim space-y-1 mb-3">
                    <div><i class="fa-solid fa-${isVirtual ? 'layer-group' : 'folder'} mr-1 text-amber-400/60"></i>${name}</div>
                    <div><i class="fa-solid fa-clock mr-1 text-blue-400/60"></i>最后写入: ${last ? new Date(last).toLocaleString('zh-CN') : '从未'}</div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <button class="btn btn-sm bg-blue-600/20 text-blue-400 border-blue-600/30 hover:bg-blue-600 hover:text-white font-bold" onclick="LocalSync.syncAll()"><i class="fa-solid fa-arrows-rotate mr-1"></i>${isVirtual ? '保存数据' : '全量同步'}</button>
                    <button class="btn btn-sm bg-amber-600/20 text-amber-400 border-amber-600/30 hover:bg-amber-600 hover:text-white font-bold" onclick="LocalSync.pickFolder()"><i class="fa-solid fa-${isVirtual ? 'layer-group' : 'folder-open'} mr-1"></i>切换空间</button>
                </div>`;
        } else {
            el.innerHTML = `
                <button class="btn btn-sm w-full bg-gradient-to-r from-accent/80 to-emerald-600/80 text-black font-bold hover:from-accent hover:to-emerald-500" onclick="LocalSync.pickFolder()">
                    <i class="fa-solid fa-folder-open mr-2"></i>选择工作空间
                </button>
                <div class="text-[10px] text-dim mt-2 leading-relaxed">
                    使用虚拟工作空间管理多个独立项目。<br>数据存储在浏览器中，切换空间 = 切换数据集。
                </div>`;
        }
    },

    init: () => {
        if (LocalSync.isElectron()) {
            const saved = localStorage.getItem('local_sync_path');
            if (saved) LocalSync.electronPath = saved;
        }
        const savedVws = localStorage.getItem('virtual_workspace');
        if (savedVws && !LocalSync.isElectron() && !LocalSync.hasFSAPI()) {
            LocalSync.virtualWorkspace = savedVws;
        }
    }
};

// ═══════════════════════════════════════════════════════════════
// IndexedDB 核心
// ═══════════════════════════════════════════════════════════════
const DB = {
    name: 'QuantAlphaDB', version: 1, db: null,
    _initPromise: null,

    async init() {
        if (this.db) return this.db;
        if (this._initPromise) return this._initPromise;

        this._initPromise = new Promise((resolve) => {
            try {
                const req = indexedDB.open(this.name, this.version);
                req.onerror = (e) => { console.error("DB Open Error", e); resolve(null); };
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    const stores = [
                        'strategies', 'backtests', 'factors', 'portfolios', 'risk_configs',
                        'trades', 'positions', 'signals', 'market_data', 'code_snippets',
                        'reports', 'watchlists', 'alerts', 'settings', 'chat_sessions',
                        'api_configs', 'data_sources'
                    ];
                    stores.forEach(s => { if(!db.objectStoreNames.contains(s)) db.createObjectStore(s, {keyPath:'id'}); });
                };
                req.onsuccess = (e) => {
                    this.db = e.target.result;
                    this.db.onversionchange = () => { this.db.close(); this.db = null; };
                    resolve(this.db);
                };
                req.onblocked = () => { console.warn("DB Open Blocked"); };
            } catch(e) { console.error("IndexedDB error", e); resolve(null); }
        });

        const result = await this._initPromise;
        LocalSync.init();

        if (LocalSync.isReady()) {
            try {
                if (LocalSync.isVirtual()) {
                    const snapshot = await LocalSync._loadVirtualData(LocalSync.virtualWorkspace);
                    if (snapshot && snapshot._meta) {
                        await LocalSync._clearAllStores();
                        let count = 0;
                        for (const store of LocalSync.FOLDER_STORES) {
                            if (snapshot[store] && Array.isArray(snapshot[store])) {
                                for (const item of snapshot[store]) { await DB._rawPut(store, item); count++; }
                            }
                        }
                        if (count > 0) console.log('[VirtualWS] 从工作空间加载了 ' + count + ' 条记录');
                    }
                } else {
                    await LocalSync._clearAllStores();
                    const count = await LocalSync.loadAll();
                    if (count > 0) console.log('[LocalSync] 从本地加载了 ' + count + ' 条记录');
                }
            } catch(e) { console.warn('[LocalSync] 自动加载失败:', e); }
        }

        setTimeout(() => LocalSync._updateStatusBar(), 500);
        return result;
    },

    async op(store, mode, fn) {
        try {
            if(!this.db) await this.init();
            if(!this.db) throw new Error("Database not initialized");
            return new Promise((resolve, reject) => {
                try {
                    const tx = this.db.transaction(store, mode);
                    const req = fn(tx.objectStore(store));
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = (e) => { console.error(`DB Op Error [${store}]:`, e.target.error); reject(e.target.error); };
                } catch(e) { reject(e); }
            });
        } catch(e) { console.error("DB Transaction Error:", e); return null; }
    },

    _rawPut: (s, v) => DB.op(s, 'readwrite', st => st.put(v)),
    _rawGetAll: (s) => DB.op(s, 'readonly', st => st.getAll()),

    put: async (s, v) => {
        const result = await DB.op(s, 'readwrite', st => st.put(v));
        LocalSync._scheduleWrite(s);
        return result;
    },
    get: (s, k) => DB.op(s, 'readonly', st => st.get(k)),
    getAll: (s) => DB.op(s, 'readonly', st => st.getAll()),
    del: async (s, k) => {
        const result = await DB.op(s, 'readwrite', st => st.delete(k));
        LocalSync._scheduleWrite(s);
        return result;
    }
};