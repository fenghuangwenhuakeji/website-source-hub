// ═══════════════════════════════════════════════════════════════
// DB 核心 + 本地文件夹实时同步
// 每次 put/del 自动写入本地文件夹，重开自动加载
// ═══════════════════════════════════════════════════════════════

const LocalSync = {
    dirHandle: null,
    electronPath: null,
    virtualWorkspace: null,  // 旧版虚拟工作空间名称，仅用于兼容已有数据
    _writeQueue: {},      // store -> debounce timer
    _DEBOUNCE_MS: 800,    // 防抖：同一个 store 800ms 内只写一次

    ALL_STORES: ['volumes','chapters','outlines','writings','entities','vectors','rag_documents','prompts',
        'tools_custom','assets','library_books','text_api_pool','parse_api_pool','fusion_api_pool','settings','chat_sessions','cycles','projects','project_snapshots'],

    // ★ 切换文件夹时不清空的 store (全局配置+项目元数据，不跟文件夹走)
    GLOBAL_STORES: ['text_api_pool','parse_api_pool','fusion_api_pool','image_api_pool','video_api_pool','audio_api_pool','projects','project_snapshots'],

    // ★ 跟文件夹走的业务数据 store
    get FOLDER_STORES() {
        return this.ALL_STORES.filter(s => !this.GLOBAL_STORES.includes(s));
    },

    isElectron: () => !!(window.electronAPI && window.electronAPI.fs),
    // ★ 检测是否在桌面壳子里 (Electron/WebView2 等)
    // 这些环境下 showDirectoryPicker 虽然存在但会被安全策略阻止
    _isDesktopShell: () => {
        // Electron 检测
        if (window.process && window.process.type) return true;
        if (navigator.userAgent && navigator.userAgent.includes('Electron')) return true;
        return false;
    },
    // ★ FSAPI: Electron 用原生API，浏览器(包括file://)用showDirectoryPicker
    hasFSAPI: () => !!window.showDirectoryPicker && !LocalSync._isDesktopShell(),
    supportsLocalFolder: () => LocalSync.isElectron() || LocalSync.hasFSAPI(),
    isVirtual: () => !!LocalSync.virtualWorkspace,
    isReady: () => !!(LocalSync.dirHandle || LocalSync.electronPath || LocalSync.virtualWorkspace),
    isLocalFolderReady: () => !!(LocalSync.dirHandle || LocalSync.electronPath),

    // ═══ 选择本地文件夹 ═══
    // 核心逻辑: 数据跟着文件夹走；不再降级到虚拟工作空间。
    pickFolder: async () => {
        try {
            if (LocalSync.isElectron()) {
                const r = await window.electronAPI.showOpenDialog({ properties: ['openDirectory'] });
                if (r && !r.canceled && r.filePaths && r.filePaths[0]) {
                    LocalSync.electronPath = r.filePaths[0];
                    localStorage.setItem('local_sync_path', r.filePaths[0]);
                    // ★ 从虚拟工作空间迁移到文件夹模式时，清除虚拟标记
                    LocalSync.virtualWorkspace = null;
                    localStorage.removeItem('virtual_workspace');
                    UI.toast('✓ 已绑定文件夹: ' + r.filePaths[0]);
                    await LocalSync._onFolderSwitch();
                    return true;
                }
            } else if (LocalSync.hasFSAPI()) {
                try {
                    LocalSync.dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
                    localStorage.setItem('local_sync_folder_name', LocalSync.dirHandle.name);
                    // ★ 从虚拟工作空间迁移到文件夹模式时，清除虚拟标记
                    LocalSync.virtualWorkspace = null;
                    localStorage.removeItem('virtual_workspace');
                    UI.toast('✓ 已绑定文件夹: ' + LocalSync.dirHandle.name);
                    await LocalSync._onFolderSwitch();
                    return true;
                } catch(fsErr) {
                    if (fsErr.name === 'AbortError') return false;
                    console.warn('本地文件夹选择不可用:', fsErr.message);
                    return LocalSync._showLocalFolderUnsupported();
                }
            } else {
                return LocalSync._showLocalFolderUnsupported();
            }
        } catch (e) {
            if (e.name !== 'AbortError') UI.toast('切换失败: ' + e.message);
            return false;
        }
    },

    _showLocalFolderUnsupported: () => {
        UI.toast('当前浏览器不能直接绑定本地文件夹。请用 Chrome/Edge 或桌面版打开，或者先导出完整备份。', 'warning', 6000);
        LocalSync._updateStatusBar();
        return false;
    },

    // ═══ 旧版虚拟工作空间管理 (仅兼容旧数据，新入口不再使用) ═══
    _pickVirtualWorkspace: async () => {
        // 获取已有的工作空间列表
        const list = LocalSync._getVirtualList();
        const current = LocalSync.virtualWorkspace || '';

        // 构建弹窗 HTML
        const listHtml = list.length > 0
            ? list.map(w => `<button class="w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${w === current ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/5'}" data-ws="${w}">
                <i class="fa-solid fa-folder mr-2 ${w === current ? 'text-blue-400' : 'text-amber-400/60'}"></i>${w}
                ${w === current ? '<span class="text-[9px] text-blue-400 ml-2">当前</span>' : ''}
                <span class="float-right text-[10px] text-red-400/60 hover:text-red-400 ws-del" data-del="${w}" title="删除"><i class="fa-solid fa-trash"></i></span>
              </button>`).join('')
            : '<div class="text-[10px] text-dim text-center py-3">暂无工作空间，请新建一个</div>';

        // 用模态框
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
                    <input type="text" class="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:border-amber-500/50 outline-none" placeholder="输入新工作空间名称..." id="ws-new-name">
                    <button class="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg text-sm font-bold hover:from-amber-500 hover:to-orange-500 transition-all ws-create">新建</button>
                </div>
                <div class="text-[9px] text-dim mt-3 leading-relaxed">
                    <i class="fa-solid fa-info-circle mr-1 text-blue-400/60"></i>
                    工作空间数据存储在浏览器 IndexedDB 中，切换工作空间 = 切换独立数据集。
                </div>
            </div>`;
        document.body.appendChild(overlay);

        return new Promise((resolve) => {
            // 关闭
            overlay.querySelector('.ws-close').onclick = () => { overlay.remove(); resolve(false); };
            overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } });

            // 选择已有工作空间
            overlay.querySelectorAll('[data-ws]').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (e.target.closest('.ws-del')) return; // 点的是删除按钮
                    const name = btn.dataset.ws;
                    if (name === current) { overlay.remove(); resolve(false); return; }
                    overlay.remove();
                    await LocalSync._switchVirtualWorkspace(name);
                    resolve(true);
                });
            });

            // 删除工作空间
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

            // 新建工作空间
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

            // 自动聚焦输入框
            setTimeout(() => overlay.querySelector('#ws-new-name')?.focus(), 100);
        });
    },

    // 切换到指定虚拟工作空间
    _switchVirtualWorkspace: async (name) => {
        const oldName = LocalSync.virtualWorkspace;
        // 1. 如果当前有工作空间，先保存当前数据
        if (oldName) {
            await LocalSync._saveVirtualData(oldName);
        }
        // 2. 切换
        LocalSync.virtualWorkspace = name;
        localStorage.setItem('virtual_workspace', name);
        // 更新工作空间列表
        LocalSync._addToVirtualList(name);
        // 3. 加载新工作空间数据 (走 _onFolderSwitch 逻辑)
        await LocalSync._onFolderSwitch();
    },

    // 保存当前IndexedDB数据到虚拟工作空间存储
    _saveVirtualData: async (name) => {
        const snapshot = {};
        for (const store of LocalSync.FOLDER_STORES) {
            try { snapshot[store] = await DB._rawGetAll(store) || []; } catch(e) { snapshot[store] = []; }
        }
        snapshot._meta = { syncTime: new Date().toISOString(), version: DB.version };

        const key = 'vws_data_' + name;
        const dataStr = JSON.stringify(snapshot);

        // 尝试完整保存
        try {
            localStorage.setItem(key, dataStr);
            return;
        } catch(e) {
            if(e.name !== 'QuotaExceededError') {
                console.error('虚拟工作空间保存失败:', e);
                return;
            }
        }

        // ★ 超限降级：排除大字段（writings/chapters/outlines 的 content）
        console.warn(`[LocalSync] 虚拟工作空间数据 ${(dataStr.length/1024/1024).toFixed(2)}MB 超出配额，尝试精简保存...`);
        const heavyStores = ['writings', 'chapters', 'outlines'];
        for(const store of heavyStores) {
            if(!snapshot[store]) continue;
            snapshot[store] = snapshot[store].map(item => {
                const clone = { ...item };
                if(clone.content && clone.content.length > 500) {
                    clone.content = '[内容过大已截断-' + clone.content.length + '字]' + clone.content.slice(0, 200);
                }
                if(clone.desc && clone.desc.length > 1000) {
                    clone.desc = clone.desc.slice(0, 500) + '...[截断]';
                }
                return clone;
            });
        }

        const trimmedStr = JSON.stringify(snapshot);
        try {
            localStorage.setItem(key, trimmedStr);
            console.log(`[LocalSync] 精简保存成功 ${(trimmedStr.length/1024/1024).toFixed(2)}MB`);
            return;
        } catch(e2) {
            if(e2.name !== 'QuotaExceededError') {
                console.error('虚拟工作空间精简保存失败:', e2);
                return;
            }
        }

        // ★ 仍超限：只保存关键 store（settings/entities/vectors），丢弃大内容
        console.warn('[LocalSync] 仍超出配额，仅保存关键数据...');
        const minimal = {
            _meta: snapshot._meta,
            settings: snapshot.settings || [],
            entities: (snapshot.entities || []).map(e => ({ id: e.id, name: e.name, type: e.type, desc: (e.desc || '').slice(0, 100) })),
            vectors: (snapshot.vectors || []).map(v => ({ id: v.id, content: (v.content || '').slice(0, 100) })),
        };
        try {
            localStorage.setItem(key, JSON.stringify(minimal));
            UI.toast('⚠️ 数据过大已精简保存（不含正文）。强烈建议在设置页绑定本地文件夹地址', 'warning', 5000);
        } catch(e3) {
            console.error('[LocalSync] 虚拟工作空间完全无法保存:', e3);
            UI.toast('❌ 本地存储已满！请到设置页绑定本地文件夹地址', 'error', 6000);
        }
    },

    // 从虚拟工作空间存储加载数据
    _loadVirtualData: async (name) => {
        const raw = localStorage.getItem('vws_data_' + name);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch { return null; }
    },

    // 虚拟工作空间列表管理
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

    // ★ 切换文件夹时的核心逻辑: 数据跟着文件夹走
    // 新文件夹有数据 → 加载到IndexedDB (先清空旧数据)
    // 新文件夹是空的 → 清空IndexedDB，全新开始
    _onFolderSwitch: async () => {
        LocalSync._updateStatusBar();
        try {
            // ★ 持久化保存文件夹句柄（刷新后自动恢复）
            if (LocalSync.dirHandle) await LocalSync._saveFSHandle();

            let hasData = false;

            if (LocalSync.isVirtual()) {
                // ★ 虚拟工作空间模式: 从 localStorage 读取
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
                    const folderName = LocalSync.getFolderName();
                    if (folderName) {
                        await DB._rawPut('settings', { id: 'pipeline_save_folder', name: folderName });
                    }
                    LocalSync._resetModuleStates();
                    await LocalSync._saveVirtualData(LocalSync.virtualWorkspace);
                    UI.toast('✓ 工作空间「' + LocalSync.virtualWorkspace + '」已就绪');
                }
            } else {
                // ★ 文件系统模式 (Electron / FSAPI)
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
                    // ★ 修复：新文件夹不清空IndexedDB，把现有数据导出到文件夹
                    const folderName = LocalSync.getFolderName();
                    if (folderName) {
                        await DB._rawPut('settings', { id: 'pipeline_save_folder', name: folderName });
                    }
                    LocalSync._resetModuleStates();
                    for (const store of LocalSync.FOLDER_STORES) {
                        try {
                            const data = await DB._rawGetAll(store);
                            await LocalSync._writeStoreFile(store, data || []);
                        } catch(e) {
                            await LocalSync._writeStoreFile(store, []);
                        }
                    }
                    const newMeta = { syncTime: new Date().toISOString(), version: DB.version };
                    await LocalSync._writeRawFile('_sync_meta.json', newMeta);
                    UI.toast('✓ 全新工作空间已就绪');
                }
            }

            localStorage.setItem('local_sync_last', new Date().toISOString());
        } catch(e) { console.warn('文件夹切换失败:', e); UI.toast('切换失败: ' + e.message); }
        LocalSync._updateStatusBar();
    },

    // 旧的首次连接逻辑 (保留给初始化用)
    _onConnected: async () => {
        LocalSync._updateStatusBar();
        try {
            // 检查文件夹是否有数据
            const meta = await LocalSync._readRawFile('_sync_meta.json');
            if (meta) {
                // 有数据: 从文件夹加载
                await LocalSync._clearAllStores();
                const count = await LocalSync.loadAll();
                LocalSync._resetModuleStates();
                if (count > 0) UI.toast(`✓ 从文件夹加载了 ${count} 条数据`);
            } else {
                // 没数据: 把当前IndexedDB业务数据写入文件夹 (不含API密钥)
                for (const store of LocalSync.FOLDER_STORES) {
                    try {
                        const data = await DB.getAll(store);
                        await LocalSync._writeStoreFile(store, data);
                    } catch(e) {}
                }
                const newMeta = { syncTime: new Date().toISOString(), version: DB.version };
                await LocalSync._writeRawFile('_sync_meta.json', newMeta);
                UI.toast('首次全量同步完成');
            }
            localStorage.setItem('local_sync_last', new Date().toISOString());
        } catch(e) { console.warn('首次同步失败:', e); }
        LocalSync._updateStatusBar();
    },

    // ★ 清空IndexedDB业务数据 (保留API配置等全局store)
    _clearAllStores: async () => {
        for (const store of LocalSync.FOLDER_STORES) {
            try {
                await DB.op(store, 'readwrite', st => st.clear());
            } catch(e) { console.warn('清空store失败 [' + store + ']:', e); }
        }
    },

    // ★ 重置所有模块的内存状态 (切换文件夹后必须调用)
    _resetModuleStates: () => {
        // 融合拆书模块
        if (typeof Modules !== 'undefined' && Modules.fusion_book) {
            const FB = Modules.fusion_book;
            FB.left = { bookId: null, chapterIdx: null, analysis: '' };
            FB.right = { bookId: null, chapterIdx: null, analysis: '' };
            FB._pipelineResults = {};
            FB._allPipelineResults = { left: '', right: '', compare: '', fusion: '', world: '', outline: '', write: '' };
            FB._pipelineStep = 0;
            FB._pipelineRunning = false;
            FB._pipelinePaused = false;
            FB._savedPipelineState = null;
            FB._chapterTimestamps = {};
            FB._books = null;
            FB._accContext = null;
            // 重置流水线配置 (同步当前文件夹handle)
            const currentHandle = LocalSync.dirHandle || FB._plConfig._folderHandle;
            const currentFolderName = LocalSync.getFolderName();
            FB._plConfig = {
                leftChapters: [], rightChapters: [],
                doExtract: true, doOutline: false, doWrite: false, doRAG: true,
                directionLock: '', modePreset: 'ammo',
                cycleMode: true, cycleSize: 5, maxConcurrency: 1,
                saveFolder: currentFolderName || '',
                _folderHandle: currentHandle || null,
                lastSync: null
            };
            // 重置流水线mini状态栏
            const miniBar = document.getElementById('pl-mini-bar');
            if (miniBar) miniBar.style.display = 'none';
        }
        // 世界引擎模块
        if (typeof Modules !== 'undefined' && Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
            Modules.world_engine.cur = null;
        }
        // 凤凰创作流
        if (typeof Modules !== 'undefined' && Modules.phoenix) {
            if (Modules.phoenix.data) Modules.phoenix.data = {};
        }
        // ★ 销毁所有 keep-alive 视图缓存，下次导航时重新 render + init
        const vp = document.getElementById('viewport');
        if (vp) {
            vp.innerHTML = '';
        }
        // 重新导航到当前模块（触发 render + init）
        try {
            if (typeof App !== 'undefined' && App._currentModule) {
                App.nav(App._currentModule);
            }
        } catch(e) { console.warn('刷新模块失败:', e); }
    },

    // ═══ 验证权限 ═══
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

    // ═══ 底层文件读写 ═══
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

    // ═══ 写入某个 store 的完整 JSON (带防抖) ═══
    _writeStoreFile: async (store, data) => {
        await LocalSync._writeRawFile(store + '.json', data || []);
    },

    // DB.put / DB.del 后调用：防抖写入整个 store
    _scheduleWrite: (store) => {
        if (!LocalSync.isReady()) return;
        // ★ 全局store (API密钥等) 不写入本地文件
        if (LocalSync.GLOBAL_STORES.includes(store)) return;
        clearTimeout(LocalSync._writeQueue[store]);
        LocalSync._writeQueue[store] = setTimeout(async () => {
            try {
                if (LocalSync.isVirtual()) {
                    // ★ 虚拟模式: 保存到 localStorage
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

    // ═══ 从本地文件夹加载全部数据到 IndexedDB ═══
    loadAll: async () => {
        if (!LocalSync.isReady()) return 0;
        if (!(await LocalSync._verifyPermission())) return 0;
        let total = 0;
        // ★ 只加载业务数据，不覆盖API配置等全局store
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

    // ═══ 全量同步到本地 ═══
    syncAll: async () => {
        if (!LocalSync.isReady()) { UI.toast('请先选择本地文件夹地址'); return; }
        if (LocalSync.isVirtual()) {
            UI.toast('旧虚拟空间不能实时写入本地。请先选择本地文件夹地址，或导出完整备份。', 'warning', 5000);
            return;
        }
        if (!(await LocalSync._verifyPermission())) { UI.toast('权限失效，请重新选择文件夹'); return; }
        UI.toast('正在全量同步...');
        // ★ 只同步业务数据，不把API密钥写入本地文件
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

    // ═══ 断开 ═══
    disconnect: () => {
        // 虚拟模式下先保存当前数据
        if (LocalSync.isVirtual()) {
            LocalSync._saveVirtualData(LocalSync.virtualWorkspace);
        }
        LocalSync.dirHandle = null;
        LocalSync.electronPath = null;
        LocalSync.virtualWorkspace = null;
        localStorage.removeItem('local_sync_path');
        localStorage.removeItem('local_sync_folder_name');
        localStorage.removeItem('local_sync_last');
        localStorage.removeItem('virtual_workspace');
        Object.values(LocalSync._writeQueue).forEach(t => clearTimeout(t));
        LocalSync._writeQueue = {};
        UI.toast('已断开本地文件夹');
        LocalSync._updateStatusBar();
    },

    getFolderName: () => {
        if (LocalSync.isElectron() && LocalSync.electronPath) return LocalSync.electronPath;
        if (LocalSync.dirHandle) return LocalSync.dirHandle.name;
        if (LocalSync.virtualWorkspace) return LocalSync.virtualWorkspace;
        return localStorage.getItem('local_sync_folder_name') || localStorage.getItem('virtual_workspace') || '';
    },

    // ═══ 顶部状态栏小图标 (侧边栏底部) ═══
    _updateStatusBar: () => {
        const isVirtual = LocalSync.isVirtual();
        const localReady = LocalSync.isLocalFolderReady();
        // 设置页面内的状态区
        const el = document.getElementById('local-sync-status');
        if (el) LocalSync._renderSettingsUI(el);
        // 侧边栏底部小指示器
        const ind = document.getElementById('local-sync-indicator');
        if (ind) {
            if (localReady) {
                const last = localStorage.getItem('local_sync_last');
                const timeStr = last ? new Date(last).toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'}) : '';
                ind.innerHTML = `<i class="fa-solid fa-hard-drive text-green-400 text-[10px]"></i><span class="text-[9px] text-green-400/70 ml-1">${timeStr}</span>`;
                ind.title = '本地文件夹已连接 - ' + LocalSync.getFolderName();
                ind.style.display = 'flex';
            } else if (isVirtual) {
                ind.innerHTML = `<i class="fa-solid fa-database text-amber-400 text-[10px]"></i><span class="text-[9px] text-amber-400/70 ml-1">浏览器内</span>`;
                ind.title = '旧虚拟空间数据仍在浏览器里，建议绑定本地文件夹';
                ind.style.display = 'flex';
            } else {
                ind.style.display = 'none';
            }
        }
        // 融合拆书顶部按钮
        const topBtn = document.getElementById('local-sync-topbtn');
        if (topBtn) {
            if (localReady) {
                const last = localStorage.getItem('local_sync_last');
                const timeStr = last ? new Date(last).toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'}) : '';
                topBtn.className = 'btn btn-sm bg-green-600/20 text-green-400 border-green-600/30 cursor-default';
                topBtn.innerHTML = `<i class="fa-solid fa-hard-drive mr-1"></i>本地同步中` + (timeStr ? ' · ' + timeStr : '');
                topBtn.onclick = null;
            } else {
                topBtn.className = 'btn btn-sm bg-amber-600/20 text-amber-400 border-amber-600/30 hover:bg-amber-600 hover:text-white';
                topBtn.innerHTML = '<i class="fa-solid fa-folder-open mr-1"></i>选择本地文件夹';
                topBtn.onclick = () => LocalSync.pickFolder();
            }
        }
    },

    // ═══ 设置页面内的完整 UI ═══
    _renderSettingsUI: (el) => {
        const localReady = LocalSync.isLocalFolderReady();
        const name = LocalSync.getFolderName();
        const last = localStorage.getItem('local_sync_last');
        const isVirtual = LocalSync.isVirtual();

        if (localReady) {
            el.innerHTML = `
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs text-green-400"><i class="fa-solid fa-circle-check mr-1"></i>已连接 · 实时同步中</span>
                    <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30" onclick="LocalSync.disconnect()"><i class="fa-solid fa-unlink mr-1"></i>断开</button>
                </div>
                <div class="text-[10px] text-dim space-y-1 mb-3">
                    <div><i class="fa-solid fa-folder mr-1 text-amber-400/60"></i>${name}</div>
                    <div><i class="fa-solid fa-clock mr-1 text-blue-400/60"></i>最后写入: ${last ? new Date(last).toLocaleString('zh-CN') : '从未'}</div>
                    <div><i class="fa-solid fa-bolt mr-1 text-green-400/60"></i>模式: <span class="text-green-400">每次保存自动写入本地 JSON</span></div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <button class="btn btn-sm bg-blue-600/20 text-blue-400 border-blue-600/30 hover:bg-blue-600 hover:text-white font-bold" onclick="LocalSync.syncAll()"><i class="fa-solid fa-arrows-rotate mr-1"></i>全量同步</button>
                    <button class="btn btn-sm bg-amber-600/20 text-amber-400 border-amber-600/30 hover:bg-amber-600 hover:text-white font-bold" onclick="LocalSync.pickFolder()"><i class="fa-solid fa-folder-open mr-1"></i>更换本地文件夹</button>
                </div>`;
        } else if (isVirtual) {
            el.innerHTML = `
                <div class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div class="text-xs font-bold text-amber-300"><i class="fa-solid fa-database mr-1"></i>检测到旧版浏览器内数据</div>
                    <div class="text-[10px] text-amber-100/70 mt-1 leading-relaxed">旧数据目前仍在浏览器里：${name || '未命名'}。建议先导出备份，再选择本地文件夹地址作为新的存储位置。</div>
                </div>
                <div class="grid grid-cols-2 gap-2 mt-3">
                    <button class="btn btn-sm bg-amber-600/20 text-amber-300 border-amber-600/30 hover:bg-amber-600 hover:text-white font-bold" onclick="LocalSync.pickFolder()"><i class="fa-solid fa-folder-open mr-1"></i>选择本地文件夹</button>
                    <button class="btn btn-sm bg-blue-600/20 text-blue-300 border-blue-600/30 hover:bg-blue-600 hover:text-white font-bold" onclick="Modules.settings?.exportData?.()"><i class="fa-solid fa-download mr-1"></i>导出备份</button>
                </div>`;
        } else {
            el.innerHTML = `
                ${LocalSync.supportsLocalFolder() ? `
                    <button class="btn btn-sm w-full bg-gradient-to-r from-amber-600/80 to-orange-600/80 text-white font-bold hover:from-amber-500 hover:to-orange-500" onclick="LocalSync.pickFolder()">
                        <i class="fa-solid fa-folder-open mr-2"></i>选择本地文件夹地址
                    </button>
                ` : `
                    <div class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div class="text-xs font-bold text-amber-300"><i class="fa-solid fa-circle-exclamation mr-1"></i>当前浏览器不能选择本地文件夹</div>
                        <div class="text-[10px] text-amber-100/70 mt-1 leading-relaxed">恢复备份能用，是因为它只读取你选中的一个文件；本地文件夹同步需要持续写入多个 JSON 文件，Safari 不开放这个权限。</div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 mt-3">
                        <button class="btn btn-sm bg-blue-600/20 text-blue-300 border-blue-600/30 hover:bg-blue-600 hover:text-white font-bold" onclick="Modules.settings?.exportData?.()"><i class="fa-solid fa-download mr-1"></i>导出备份</button>
                        <button class="btn btn-sm bg-green-600/20 text-green-300 border-green-600/30 hover:bg-green-600 hover:text-white font-bold" onclick="document.getElementById('import-file')?.click()"><i class="fa-solid fa-upload mr-1"></i>恢复备份</button>
                    </div>
                `}
                <div class="text-[10px] text-dim mt-2 leading-relaxed">
                    ${LocalSync.supportsLocalFolder()
                        ? '选择一个本地文件夹后，系统会把业务数据写成 JSON 文件。重新打开时可从该文件夹加载。'
                        : '如果要真正绑定本地文件夹地址，请用 Chrome/Edge 或桌面版打开本系统。Safari 下建议用备份文件方式。'}
                </div>`;
        }
    },

    // ═══ 初始化 ═══
    init: () => {
        if (LocalSync.isElectron()) {
            const saved = localStorage.getItem('local_sync_path');
            if (saved) LocalSync.electronPath = saved;
        }
        // ★ 恢复 File System API handle（通过 IndexedDB 持久化）
        LocalSync._restoreFSHandle();
        // ★ 恢复虚拟工作空间（降级用）
        const savedVws = localStorage.getItem('virtual_workspace');
        if (savedVws && !LocalSync.isReady()) {
            LocalSync.virtualWorkspace = savedVws;
        }
    },

    // 通过 IndexedDB 持久化保存/恢复 FileSystemDirectoryHandle
    _saveFSHandle: async () => {
        if (!LocalSync.dirHandle) return;
        try {
            await DB._rawPut('file_system_handles', { id: 'primary', handle: LocalSync.dirHandle });
            console.log('[LocalSync] 文件夹句柄已持久化保存');
        } catch(e) { console.warn('[LocalSync] 保存句柄失败:', e); }
    },
    _restoreFSHandle: async () => {
        if (LocalSync.dirHandle || LocalSync.isElectron()) return;
        try {
            const record = await DB._rawGet('file_system_handles', 'primary');
            if (record && record.handle) {
                // 验证权限是否仍然有效
                if (await record.handle.queryPermission({ mode: 'readwrite' }) === 'granted' ||
                    await record.handle.requestPermission({ mode: 'readwrite' }) === 'granted') {
                    LocalSync.dirHandle = record.handle;
                    localStorage.setItem('local_sync_folder_name', record.handle.name);
                    console.log('[LocalSync] 已自动恢复文件夹绑定:', record.handle.name);
                }
            }
        } catch(e) { /* 静默失败，让用户手动选择 */ }
    },
};


// ═══════════════════════════════════════════════════════════════
// IndexedDB 核心
// ═══════════════════════════════════════════════════════════════
const DB = {
    name: 'GenesisDB', version: 14, db: null,
    _initPromise: null,
    _missingStoreWarned: new Set(),

    async init() {
        if (this.db) return this.db;
        if (this._initPromise) return this._initPromise;

        this._initPromise = new Promise((resolve) => {
            try {
                const req = indexedDB.open(this.name, this.version);
                req.onerror = (e) => {
                    console.error("[DB] Open Error:", e.target.error);
                    this._initPromise = null; // 允许下次重试
                    resolve(null);
                };
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    const stores = [
                        'volumes','chapters','outlines','writings','entities','vectors','rag_documents',
                        'prompts','tools_custom','assets',
                        'library_books','trading_strategies','code_snippets',
                        'text_api_pool','parse_api_pool','fusion_api_pool','image_api_pool','video_api_pool','audio_api_pool',
                        'settings','chat_sessions','cycles','projects','project_snapshots'
                    ];
                    stores.forEach(s => { if(!db.objectStoreNames.contains(s)) db.createObjectStore(s, {keyPath:'id'}); });
                    // ★ 用于持久化保存 FileSystemDirectoryHandle
                    if(!db.objectStoreNames.contains('file_system_handles')) db.createObjectStore('file_system_handles', {keyPath:'id'});
                };
                req.onsuccess = (e) => {
                    this.db = e.target.result;
                    this.db.onversionchange = () => {
                        console.warn('[DB] Version changed by another tab, closing...');
                        this.db.close(); this.db = null; this._initPromise = null;
                    };
                    this.db.onclose = () => {
                        console.warn('[DB] Database closed unexpectedly');
                        this.db = null; this._initPromise = null;
                    };
                    console.log('[DB] GenesisDB v' + this.version + ' opened successfully');
                    resolve(this.db);
                };
                req.onblocked = () => {
                    console.warn("[DB] Open Blocked - another tab has the DB open with an older version");
                    this._initPromise = null;
                };
            } catch(e) {
                console.error("[DB] IndexedDB initialization error:", e);
                this._initPromise = null;
                resolve(null);
            }
        });

        const result = await this._initPromise;

        if (!result) {
            console.error('[DB] Failed to open IndexedDB. Possible causes: private browsing, disk full, permission denied, or file:// protocol restrictions.');
            if (typeof UI !== 'undefined') UI.toast('⚠️ 本地数据库初始化失败，部分功能可能受限', 'warning', 5000);
        }

        // 初始化 LocalSync（★ 自动恢复之前绑定的文件夹）
        if (result && typeof LocalSync !== 'undefined') {
            LocalSync.init();
            await LocalSync._restoreFSHandle(); // 异步恢复 FileSystemDirectoryHandle
        }

        // 自动从本地/虚拟工作空间加载 (★ 修复: 数据源为空时不清空IndexedDB，防止数据丢失)
        if (LocalSync.isReady()) {
            try {
                if (LocalSync.isVirtual()) {
                    // 虚拟模式: 从 localStorage 恢复
                    const snapshot = await LocalSync._loadVirtualData(LocalSync.virtualWorkspace);
                    // 安全检查: snapshot 必须有实际业务数据才清空导入
                    const hasData = snapshot && Object.keys(snapshot).some(k => k !== '_meta' && Array.isArray(snapshot[k]) && snapshot[k].length > 0);
                    if (hasData) {
                        await LocalSync._clearAllStores();
                        let count = 0;
                        for (const store of LocalSync.FOLDER_STORES) {
                            if (snapshot[store] && Array.isArray(snapshot[store])) {
                                for (const item of snapshot[store]) { await DB._rawPut(store, item); count++; }
                            }
                        }
                        if (count > 0) console.log('[VirtualWS] 从工作空间「' + LocalSync.virtualWorkspace + '」加载了 ' + count + ' 条记录');
                    } else if (snapshot && snapshot._meta) {
                        console.warn('[VirtualWS] 工作空间「' + LocalSync.virtualWorkspace + '」无业务数据，保留当前IndexedDB');
                    }
                } else {
                    // 文件系统模式: ★ 不再先清空。loadAll会覆盖写入，文件为空则保留现有数据
                    const count = await LocalSync.loadAll();
                    if (count > 0) {
                        console.log('[LocalSync] 从本地加载了 ' + count + ' 条记录');
                    } else {
                        console.warn('[LocalSync] 本地文件夹无数据，保留当前IndexedDB（首次使用或文件丢失）');
                    }
                }
            } catch(e) { console.warn('[LocalSync] 自动加载失败:', e); }
        }

        setTimeout(() => LocalSync._updateStatusBar(), 500);
        return result;
    },

    async op(store, mode, fn) {
        try {
            if(!this.db) await this.init();
            // 重试机制：如果初始化失败（比如 onversionchange 导致关闭），等待 400ms 再试一次
            if(!this.db) {
                await new Promise(r => setTimeout(r, 400));
                await this.init();
            }
            if(!this.db) {
                console.error(`[DB] Cannot perform ${mode} on '${store}': database not available`);
                return null;
            }
            // 检查 store 是否存在，不存在则跳过（只警告一次）
            if(!this.db.objectStoreNames.contains(store)) {
                if(!this._missingStoreWarned.has(store)) {
                    this._missingStoreWarned.add(store);
                    console.warn(`DB store '${store}' does not exist, skipping (will not warn again)`);
                }
                return null;
            }
            return new Promise((resolve, reject) => {
                try {
                    const tx = this.db.transaction(store, mode);
                    tx.onerror = (e) => { console.error(`[DB] Transaction error on '${store}':`, e.target.error); };
                    const req = fn(tx.objectStore(store));
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = (e) => { console.error(`[DB] Op Error [${store}]:`, e.target.error); reject(e.target.error); };
                } catch(e) { reject(e); }
            });
        } catch(e) { console.error("[DB] Transaction Error:", e); return null; }
    },

    // 原始操作 (不触发 LocalSync，防止循环)
    _rawPut: (s, v) => DB.op(s, 'readwrite', st => st.put(v)),
    _rawGetAll: (s) => DB.op(s, 'readonly', st => st.getAll()),

    // 带实时同步的操作
    put: async (s, v) => {
        const projectScopedStores = ['volumes','chapters','outlines','writings','entities','vectors','rag_documents','library_books','chat_sessions','cycles'];
        if (projectScopedStores.includes(s) && v && typeof v === 'object' && !Array.isArray(v)
            && typeof GenesisCore !== 'undefined' && GenesisCore._activeProjectId && !v.projectId) {
            v = { ...v, projectId: GenesisCore._activeProjectId };
        }
        const result = await DB.op(s, 'readwrite', st => st.put(v));
        LocalSync._scheduleWrite(s);
        return result;
    },
    get: (s, k) => DB.op(s, 'readonly', st => st.get(k)),
    getAll: (s) => DB.op(s, 'readonly', st => st.getAll()),
    keys: (s) => DB.op(s, 'readonly', st => st.getAllKeys()),
    del: async (s, k) => {
        const result = await DB.op(s, 'readwrite', st => st.delete(k));
        LocalSync._scheduleWrite(s);
        return result;
    }
};
