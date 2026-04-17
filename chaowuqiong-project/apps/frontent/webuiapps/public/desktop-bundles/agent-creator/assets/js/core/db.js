(() => {
  const LocalSync = {
    dirHandle: null,
    electronPath: null,
    virtualWorkspace: null,
    _writeQueue: {},
    _DEBOUNCE_MS: 800,
    ALL_STORES: [
      "volumes",
      "chapters",
      "outlines",
      "writings",
      "entities",
      "vectors",
      "prompts",
      "tools_custom",
      "assets",
      "library_books",
      "text_api_pool",
      "settings",
      "chat_sessions",
      "novella_sessions",
      "novella_messages",
      "novella_outlines",
      "novella_settings",
      "novella_prompts"
    ],
    GLOBAL_STORES: ["text_api_pool", "image_api_pool", "video_api_pool", "audio_api_pool"],
    get FOLDER_STORES() {
      return this.ALL_STORES.filter((s) => !this.GLOBAL_STORES.includes(s));
    },
    isElectron: () => !!(window.electronAPI && window.electronAPI.fs),
    _isDesktopShell: () => {
      if (window.process && window.process.type) return true;
      if (navigator.userAgent && navigator.userAgent.includes("Electron")) return true;
      if (location.protocol === "file:") return true;
      if (!location.origin || location.origin === "null") return true;
      return false;
    },
    hasFSAPI: () => !!window.showDirectoryPicker && !LocalSync._isDesktopShell(),
    isVirtual: () => !!LocalSync.virtualWorkspace,
    isReady: () => !!(LocalSync.dirHandle || LocalSync.electronPath || LocalSync.virtualWorkspace),
    pickFolder: async () => {
      try {
        if (LocalSync.isElectron()) {
          const r = await window.electronAPI.showOpenDialog({ properties: ["openDirectory"] });
          if (r && !r.canceled && r.filePaths && r.filePaths[0]) {
            LocalSync.electronPath = r.filePaths[0];
            localStorage.setItem("local_sync_path", r.filePaths[0]);
            UI.toast("\u2713 \u5DF2\u7ED1\u5B9A\u6587\u4EF6\u5939: " + r.filePaths[0]);
            await LocalSync._onFolderSwitch();
            return true;
          }
        } else if (LocalSync.hasFSAPI()) {
          try {
            LocalSync.dirHandle = await window.showDirectoryPicker({ mode: "readwrite" });
            localStorage.setItem("local_sync_folder_name", LocalSync.dirHandle.name);
            UI.toast("\u2713 \u5DF2\u7ED1\u5B9A\u6587\u4EF6\u5939: " + LocalSync.dirHandle.name);
            await LocalSync._onFolderSwitch();
            return true;
          } catch (fsErr) {
            if (fsErr.name === "AbortError") return false;
            console.warn("FSAPI \u4E0D\u53EF\u7528\uFF0C\u5207\u6362\u5230\u865A\u62DF\u5DE5\u4F5C\u7A7A\u95F4:", fsErr.message);
            return await LocalSync._pickVirtualWorkspace();
          }
        } else {
          return await LocalSync._pickVirtualWorkspace();
        }
      } catch (e) {
        if (e.name !== "AbortError") UI.toast("\u5207\u6362\u5931\u8D25: " + e.message, "error");
        return false;
      }
      return false;
    },
    _pickVirtualWorkspace: async () => {
      const list = LocalSync._getVirtualList();
      const current = LocalSync.virtualWorkspace || "";
      const listHtml = list.length > 0 ? list.map((w) => `<button class="w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${w === current ? "bg-blue-600/30 text-blue-300 border border-blue-500/40" : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/5"}" data-ws="${w}">
                <i class="fa-solid fa-folder mr-2 ${w === current ? "text-blue-400" : "text-amber-400/60"}"></i>${w}
                ${w === current ? '<span class="text-[9px] text-blue-400 ml-2">\u5F53\u524D</span>' : ""}
                <span class="float-right text-[10px] text-red-400/60 hover:text-red-400 ws-del" data-del="${w}" title="\u5220\u9664"><i class="fa-solid fa-trash"></i></span>
              </button>`).join("") : '<div class="text-[10px] text-dim text-center py-3">\u6682\u65E0\u5DE5\u4F5C\u7A7A\u95F4\uFF0C\u8BF7\u65B0\u5EFA\u4E00\u4E2A</div>';
      const overlay = document.createElement("div");
      overlay.className = "fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center";
      overlay.innerHTML = `
            <div class="bg-[#1a1a2e] rounded-2xl border border-white/10 p-6 w-[380px] max-h-[80vh] shadow-2xl">
                <div class="flex items-center justify-between mb-4">
                    <span class="text-base font-bold text-white"><i class="fa-solid fa-layer-group mr-2 text-amber-400"></i>\u5DE5\u4F5C\u7A7A\u95F4</span>
                    <button class="text-white/40 hover:text-white text-lg ws-close"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="space-y-2 mb-4 max-h-[40vh] overflow-y-auto pr-1">${listHtml}</div>
                <div class="flex gap-2">
                    <input type="text" class="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:border-amber-500/50 outline-none" placeholder="\u8F93\u5165\u65B0\u5DE5\u4F5C\u7A7A\u95F4\u540D\u79F0..." id="ws-new-name">
                    <button class="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg text-sm font-bold hover:from-amber-500 hover:to-orange-500 transition-all ws-create">\u65B0\u5EFA</button>
                </div>
                <div class="text-[9px] text-dim mt-3 leading-relaxed">
                    <i class="fa-solid fa-info-circle mr-1 text-blue-400/60"></i>
                    \u5DE5\u4F5C\u7A7A\u95F4\u6570\u636E\u5B58\u50A8\u5728\u6D4F\u89C8\u5668 IndexedDB \u4E2D\uFF0C\u5207\u6362\u5DE5\u4F5C\u7A7A\u95F4 = \u5207\u6362\u72EC\u7ACB\u6570\u636E\u96C6\u3002
                </div>
            </div>`;
      document.body.appendChild(overlay);
      return new Promise((resolve) => {
        overlay.querySelector(".ws-close").addEventListener("click", () => {
          overlay.remove();
          resolve(false);
        });
        overlay.addEventListener("click", (e) => {
          if (e.target === overlay) {
            overlay.remove();
            resolve(false);
          }
        });
        overlay.querySelectorAll("[data-ws]").forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            if (e.target.closest(".ws-del")) return;
            const name = btn.dataset.ws;
            if (name === current) {
              overlay.remove();
              resolve(false);
              return;
            }
            overlay.remove();
            await LocalSync._switchVirtualWorkspace(name);
            resolve(true);
          });
        });
        overlay.querySelectorAll(".ws-del").forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const name = btn.dataset.del;
            if (name === current) {
              UI.toast("\u4E0D\u80FD\u5220\u9664\u5F53\u524D\u5DE5\u4F5C\u7A7A\u95F4", "warning");
              return;
            }
            if (!confirm(`\u786E\u5B9A\u5220\u9664\u5DE5\u4F5C\u7A7A\u95F4\u300C${name}\u300D\uFF1F\u6570\u636E\u5C06\u65E0\u6CD5\u6062\u590D\u3002`)) return;
            LocalSync._deleteVirtualWorkspace(name);
            UI.toast("\u5DF2\u5220\u9664: " + name, "success");
            overlay.remove();
            LocalSync._pickVirtualWorkspace().then(resolve);
          });
        });
        const createFn = async () => {
          const input = overlay.querySelector("#ws-new-name");
          const name = (input.value || "").trim();
          if (!name) {
            input.focus();
            return;
          }
          if (list.includes(name)) {
            UI.toast("\u5DE5\u4F5C\u7A7A\u95F4\u5DF2\u5B58\u5728\uFF0C\u8BF7\u76F4\u63A5\u70B9\u51FB\u5207\u6362", "warning");
            return;
          }
          overlay.remove();
          await LocalSync._switchVirtualWorkspace(name);
          resolve(true);
        };
        overlay.querySelector(".ws-create").addEventListener("click", createFn);
        overlay.querySelector("#ws-new-name").addEventListener("keydown", (e) => {
          if (e.key === "Enter") createFn();
        });
        setTimeout(() => overlay.querySelector("#ws-new-name")?.focus(), 100);
      });
    },
    _switchVirtualWorkspace: async (name) => {
      const oldName = LocalSync.virtualWorkspace;
      if (oldName) {
        await LocalSync._saveVirtualData(oldName);
      }
      LocalSync.virtualWorkspace = name;
      localStorage.setItem("virtual_workspace", name);
      LocalSync._addToVirtualList(name);
      await LocalSync._onFolderSwitch();
    },
    _saveVirtualData: async (name) => {
      const snapshot = {};
      for (const store of LocalSync.FOLDER_STORES) {
        try {
          snapshot[store] = await DB._rawGetAll(store) || [];
        } catch (e) {
          snapshot[store] = [];
        }
      }
      snapshot._meta = { syncTime: (/* @__PURE__ */ new Date()).toISOString(), version: DB.version };
      localStorage.setItem("vws_data_" + name, JSON.stringify(snapshot));
    },
    _loadVirtualData: async (name) => {
      const raw = localStorage.getItem("vws_data_" + name);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
    _getVirtualList: () => {
      try {
        return JSON.parse(localStorage.getItem("virtual_workspace_list") || "[]");
      } catch {
        return [];
      }
    },
    _addToVirtualList: (name) => {
      const list = LocalSync._getVirtualList();
      if (!list.includes(name)) {
        list.push(name);
        localStorage.setItem("virtual_workspace_list", JSON.stringify(list));
      }
    },
    _deleteVirtualWorkspace: (name) => {
      const list = LocalSync._getVirtualList().filter((n) => n !== name);
      localStorage.setItem("virtual_workspace_list", JSON.stringify(list));
      localStorage.removeItem("vws_data_" + name);
    },
    _onFolderSwitch: async () => {
      LocalSync._updateStatusBar();
      try {
        let hasData = false;
        if (LocalSync.isVirtual()) {
          const snapshot = await LocalSync._loadVirtualData(LocalSync.virtualWorkspace);
          hasData = !!(snapshot && snapshot._meta);
          if (hasData) {
            UI.toast("\u6B63\u5728\u52A0\u8F7D\u5DE5\u4F5C\u7A7A\u95F4...");
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
            UI.toast(`\u2713 \u5DF2\u52A0\u8F7D\u5DE5\u4F5C\u7A7A\u95F4\u300C${LocalSync.virtualWorkspace}\u300D(${count}\u6761)`, "success");
          } else {
            UI.toast("\u65B0\u5DE5\u4F5C\u7A7A\u95F4\uFF0C\u5168\u65B0\u5F00\u59CB...");
            await LocalSync._clearAllStores();
            const folderName = LocalSync.getFolderName();
            if (folderName) {
              await DB._rawPut("settings", { id: "pipeline_save_folder", name: folderName });
            }
            LocalSync._resetModuleStates();
            await LocalSync._saveVirtualData(LocalSync.virtualWorkspace);
            UI.toast("\u2713 \u5DE5\u4F5C\u7A7A\u95F4\u300C" + LocalSync.virtualWorkspace + "\u300D\u5DF2\u5C31\u7EEA", "success");
          }
        } else {
          const meta = await LocalSync._readRawFile("_sync_meta.json");
          hasData = !!meta;
          if (hasData) {
            UI.toast("\u6B63\u5728\u4ECE\u6587\u4EF6\u5939\u52A0\u8F7D\u6570\u636E...");
            await LocalSync._clearAllStores();
            const count = await LocalSync.loadAll();
            LocalSync._resetModuleStates();
            UI.toast(`\u2713 \u5DF2\u4ECE\u6587\u4EF6\u5939\u52A0\u8F7D ${count} \u6761\u6570\u636E`, "success");
          } else {
            UI.toast("\u65B0\u6587\u4EF6\u5939\uFF0C\u5168\u65B0\u5DE5\u4F5C\u7A7A\u95F4...");
            await LocalSync._clearAllStores();
            const folderName = LocalSync.getFolderName();
            if (folderName) {
              await DB._rawPut("settings", { id: "pipeline_save_folder", name: folderName });
            }
            LocalSync._resetModuleStates();
            for (const store of LocalSync.FOLDER_STORES) {
              try {
                const data = await DB._rawGetAll(store);
                await LocalSync._writeStoreFile(store, data || []);
              } catch (e) {
                await LocalSync._writeStoreFile(store, []);
              }
            }
            const newMeta = { syncTime: (/* @__PURE__ */ new Date()).toISOString(), version: DB.version };
            await LocalSync._writeRawFile("_sync_meta.json", newMeta);
            UI.toast("\u2713 \u5168\u65B0\u5DE5\u4F5C\u7A7A\u95F4\u5DF2\u5C31\u7EEA", "success");
          }
        }
        localStorage.setItem("local_sync_last", (/* @__PURE__ */ new Date()).toISOString());
      } catch (e) {
        console.warn("\u6587\u4EF6\u5939\u5207\u6362\u5931\u8D25:", e);
        UI.toast("\u5207\u6362\u5931\u8D25: " + e.message, "error");
      }
      LocalSync._updateStatusBar();
    },
    _clearAllStores: async () => {
      for (const store of LocalSync.FOLDER_STORES) {
        try {
          await DB.op(store, "readwrite", (st) => st.clear());
        } catch (e) {
          console.warn("\u6E05\u7A7Astore\u5931\u8D25 [" + store + "]:", e);
        }
      }
    },
    _resetModuleStates: () => {
      if (typeof Modules !== "undefined" && Modules.fusion_book) {
        const FB = Modules.fusion_book;
        FB.left = { bookId: null, chapterIdx: null, analysis: "" };
        FB.right = { bookId: null, chapterIdx: null, analysis: "" };
        FB._pipelineResults = {};
        FB._allPipelineResults = { left: "", right: "", compare: "", fusion: "", world: "", outline: "", write: "" };
        FB._pipelineStep = 0;
        FB._pipelineRunning = false;
        FB._pipelinePaused = false;
        FB._savedPipelineState = null;
        FB._chapterTimestamps = {};
        FB._books = null;
        FB._accContext = null;
        const currentHandle = LocalSync.dirHandle || FB._plConfig?._folderHandle;
        const currentFolderName = LocalSync.getFolderName();
        FB._plConfig = {
          leftChapters: [],
          rightChapters: [],
          doExtract: true,
          doOutline: true,
          doWrite: true,
          doRAG: true,
          saveFolder: currentFolderName || "",
          _folderHandle: currentHandle || null,
          lastSync: null
        };
        const miniBar = document.getElementById("pl-mini-bar");
        if (miniBar) miniBar.style.display = "none";
      }
      if (typeof Modules !== "undefined" && Modules.world_engine) {
        Modules.world_engine._cachedEntities = null;
        Modules.world_engine.cur = null;
      }
      if (typeof Modules !== "undefined" && Modules.phoenix) {
        if (Modules.phoenix.data) Modules.phoenix.data = {};
      }
      const vp = document.getElementById("viewport");
      if (vp) {
        vp.innerHTML = "";
      }
      try {
        if (typeof App !== "undefined" && App._currentModule) {
          App.nav(App._currentModule);
        }
      } catch (e) {
        console.warn("\u5237\u65B0\u6A21\u5757\u5931\u8D25:", e);
      }
    },
    _verifyPermission: async () => {
      if (LocalSync.isElectron()) return !!LocalSync.electronPath;
      if (!LocalSync.dirHandle) return false;
      try {
        let p = await LocalSync.dirHandle.queryPermission({ mode: "readwrite" });
        if (p === "granted") return true;
        p = await LocalSync.dirHandle.requestPermission({ mode: "readwrite" });
        return p === "granted";
      } catch {
        return false;
      }
    },
    _writeRawFile: async (filename, data) => {
      const json = JSON.stringify(data, null, 2);
      if (LocalSync.isElectron()) {
        await window.electronAPI.fs.writeFile(LocalSync.electronPath + "\\" + filename, json);
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
          const text = await window.electronAPI.fs.readFile(LocalSync.electronPath + "\\" + filename);
          return JSON.parse(text);
        } else if (LocalSync.dirHandle) {
          const fh = await LocalSync.dirHandle.getFileHandle(filename);
          const file = await fh.getFile();
          return JSON.parse(await file.text());
        }
      } catch {
        return null;
      }
    },
    _writeStoreFile: async (store, data) => {
      await LocalSync._writeRawFile(store + ".json", data || []);
    },
    _scheduleWrite: (store) => {
      if (!LocalSync.isReady()) return;
      if (LocalSync.GLOBAL_STORES.includes(store)) return;
      clearTimeout(LocalSync._writeQueue[store]);
      LocalSync._writeQueue[store] = setTimeout(async () => {
        try {
          if (LocalSync.isVirtual()) {
            await LocalSync._saveVirtualData(LocalSync.virtualWorkspace);
            localStorage.setItem("local_sync_last", (/* @__PURE__ */ new Date()).toISOString());
            LocalSync._updateStatusBar();
          } else {
            if (!await LocalSync._verifyPermission()) return;
            const data = await DB._rawGetAll(store);
            await LocalSync._writeStoreFile(store, data);
            localStorage.setItem("local_sync_last", (/* @__PURE__ */ new Date()).toISOString());
            LocalSync._updateStatusBar();
          }
        } catch (e) {
          console.warn("\u5B9E\u65F6\u540C\u6B65\u5931\u8D25 [" + store + "]:", e);
        }
      }, LocalSync._DEBOUNCE_MS);
    },
    loadAll: async () => {
      if (!LocalSync.isReady()) return 0;
      if (!await LocalSync._verifyPermission()) return 0;
      let total = 0;
      for (const store of LocalSync.FOLDER_STORES) {
        const data = await LocalSync._readRawFile(store + ".json");
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
      if (!LocalSync.isReady()) {
        UI.toast("\u8BF7\u5148\u9009\u62E9\u5DE5\u4F5C\u7A7A\u95F4", "warning");
        return;
      }
      if (LocalSync.isVirtual()) {
        UI.toast("\u6B63\u5728\u4FDD\u5B58...");
        await LocalSync._saveVirtualData(LocalSync.virtualWorkspace);
        localStorage.setItem("local_sync_last", (/* @__PURE__ */ new Date()).toISOString());
        UI.toast("\u2713 \u5DE5\u4F5C\u7A7A\u95F4\u6570\u636E\u5DF2\u4FDD\u5B58", "success");
        LocalSync._updateStatusBar();
        return;
      }
      if (!await LocalSync._verifyPermission()) {
        UI.toast("\u6743\u9650\u5931\u6548\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u6587\u4EF6\u5939", "error");
        return;
      }
      UI.toast("\u6B63\u5728\u5168\u91CF\u540C\u6B65...");
      for (const store of LocalSync.FOLDER_STORES) {
        try {
          const data = await DB.getAll(store);
          await LocalSync._writeStoreFile(store, data);
        } catch (e) {
        }
      }
      localStorage.setItem("local_sync_last", (/* @__PURE__ */ new Date()).toISOString());
      UI.toast("\u2713 \u5168\u91CF\u540C\u6B65\u5B8C\u6210", "success");
      LocalSync._updateStatusBar();
    },
    disconnect: () => {
      if (LocalSync.isVirtual()) {
        LocalSync._saveVirtualData(LocalSync.virtualWorkspace);
      }
      LocalSync.dirHandle = null;
      LocalSync.electronPath = null;
      LocalSync.virtualWorkspace = null;
      localStorage.removeItem("local_sync_path");
      localStorage.removeItem("local_sync_folder_name");
      localStorage.removeItem("local_sync_last");
      localStorage.removeItem("virtual_workspace");
      Object.values(LocalSync._writeQueue).forEach((t) => clearTimeout(t));
      LocalSync._writeQueue = {};
      UI.toast("\u5DF2\u65AD\u5F00\u5DE5\u4F5C\u7A7A\u95F4", "info");
      LocalSync._updateStatusBar();
    },
    getFolderName: () => {
      if (LocalSync.isElectron() && LocalSync.electronPath) return LocalSync.electronPath;
      if (LocalSync.dirHandle) return LocalSync.dirHandle.name;
      if (LocalSync.virtualWorkspace) return LocalSync.virtualWorkspace;
      return localStorage.getItem("local_sync_folder_name") || localStorage.getItem("virtual_workspace") || "";
    },
    _updateStatusBar: () => {
      const isVirtual = LocalSync.isVirtual();
      const el = document.getElementById("local-sync-status");
      if (el) LocalSync._renderSettingsUI(el);
      const ind = document.getElementById("local-sync-indicator");
      if (ind) {
        if (LocalSync.isReady()) {
          const last = localStorage.getItem("local_sync_last");
          const timeStr = last ? new Date(last).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) : "";
          const icon = isVirtual ? "fa-layer-group" : "fa-hard-drive";
          ind.innerHTML = `<i class="fa-solid ${icon} text-green-400 text-[10px]"></i><span class="text-[9px] text-green-400/70 ml-1">${timeStr}</span>`;
          ind.title = (isVirtual ? "\u5DE5\u4F5C\u7A7A\u95F4: " : "\u672C\u5730\u540C\u6B65\u5DF2\u8FDE\u63A5 - ") + LocalSync.getFolderName();
          ind.style.display = "flex";
        } else {
          ind.style.display = "none";
        }
      }
      const topBtn = document.getElementById("local-sync-topbtn");
      if (topBtn) {
        if (LocalSync.isReady()) {
          const last = localStorage.getItem("local_sync_last");
          const timeStr = last ? new Date(last).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) : "";
          const icon = isVirtual ? "fa-layer-group" : "fa-hard-drive";
          topBtn.className = "btn btn-sm bg-green-600/20 text-green-400 border-green-600/30 cursor-default";
          topBtn.innerHTML = `<i class="fa-solid ${icon} mr-1"></i>${isVirtual ? LocalSync.virtualWorkspace : "\u5B9E\u65F6\u540C\u6B65\u4E2D"}` + (timeStr ? " \xB7 " + timeStr : "");
          topBtn.onclick = null;
        } else {
          topBtn.className = "btn btn-sm bg-amber-600/20 text-amber-400 border-amber-600/30 hover:bg-amber-600 hover:text-white";
          topBtn.innerHTML = '<i class="fa-solid fa-layer-group mr-1"></i>\u9009\u62E9\u5DE5\u4F5C\u7A7A\u95F4';
          topBtn.onclick = () => LocalSync.pickFolder();
        }
      }
    },
    _renderSettingsUI: (el) => {
      const ready = LocalSync.isReady();
      const name = LocalSync.getFolderName();
      const last = localStorage.getItem("local_sync_last");
      const isVirtual = LocalSync.isVirtual();
      if (ready) {
        el.innerHTML = `
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs text-green-400"><i class="fa-solid fa-circle-check mr-1"></i>${isVirtual ? "\u5DE5\u4F5C\u7A7A\u95F4\u6A21\u5F0F" : "\u5DF2\u8FDE\u63A5 \xB7 \u5B9E\u65F6\u540C\u6B65\u4E2D"}</span>
                    <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30" onclick="LocalSync.disconnect()"><i class="fa-solid fa-unlink mr-1"></i>\u65AD\u5F00</button>
                </div>
                <div class="text-[10px] text-dim space-y-1 mb-3">
                    <div><i class="fa-solid fa-${isVirtual ? "layer-group" : "folder"} mr-1 text-amber-400/60"></i>${name}</div>
                    <div><i class="fa-solid fa-clock mr-1 text-blue-400/60"></i>\u6700\u540E\u5199\u5165: ${last ? new Date(last).toLocaleString("zh-CN") : "\u4ECE\u672A"}</div>
                    <div><i class="fa-solid fa-bolt mr-1 text-green-400/60"></i>\u6A21\u5F0F: <span class="text-green-400">${isVirtual ? "\u865A\u62DF\u5DE5\u4F5C\u7A7A\u95F4 (IndexedDB)" : "\u6BCF\u6B21\u4FDD\u5B58\u81EA\u52A8\u5199\u5165"}</span></div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <button class="btn btn-sm bg-blue-600/20 text-blue-400 border-blue-600/30 hover:bg-blue-600 hover:text-white font-bold" onclick="LocalSync.syncAll()"><i class="fa-solid fa-arrows-rotate mr-1"></i>${isVirtual ? "\u4FDD\u5B58\u6570\u636E" : "\u5168\u91CF\u540C\u6B65"}</button>
                    <button class="btn btn-sm bg-amber-600/20 text-amber-400 border-amber-600/30 hover:bg-amber-600 hover:text-white font-bold" onclick="LocalSync.pickFolder()"><i class="fa-solid fa-${isVirtual ? "layer-group" : "folder-open"} mr-1"></i>${isVirtual ? "\u5207\u6362\u7A7A\u95F4" : "\u66F4\u6362\u6587\u4EF6\u5939"}</button>
                </div>`;
      } else {
        el.innerHTML = `
                <button class="btn btn-sm w-full bg-gradient-to-r from-amber-600/80 to-orange-600/80 text-white font-bold hover:from-amber-500 hover:to-orange-500" onclick="LocalSync.pickFolder()">
                    <i class="fa-solid fa-folder-open mr-2"></i>\u9009\u62E9\u5DE5\u4F5C\u7A7A\u95F4
                </button>
                <div class="text-[10px] text-dim mt-2 leading-relaxed">
                    ${LocalSync.hasFSAPI() || LocalSync.isElectron() ? "\u7ED1\u5B9A\u540E\u6BCF\u6B21\u5199\u5165\u6570\u636E\u81EA\u52A8\u540C\u6B65\u5230\u672C\u5730 JSON \u6587\u4EF6\u3002<br>\u91CD\u65B0\u6253\u5F00\u65F6\u81EA\u52A8\u4ECE\u672C\u5730\u52A0\u8F7D\uFF0C\u6570\u636E\u6C38\u4E0D\u4E22\u5931\u3002" : "\u4F7F\u7528\u865A\u62DF\u5DE5\u4F5C\u7A7A\u95F4\u7BA1\u7406\u591A\u4E2A\u72EC\u7ACB\u9879\u76EE\u3002<br>\u6570\u636E\u5B58\u50A8\u5728\u6D4F\u89C8\u5668\u4E2D\uFF0C\u5207\u6362\u7A7A\u95F4 = \u5207\u6362\u6570\u636E\u96C6\u3002"}
                </div>`;
      }
    },
    init: () => {
      if (LocalSync.isElectron()) {
        const saved = localStorage.getItem("local_sync_path");
        if (saved) LocalSync.electronPath = saved;
      }
      const savedVws = localStorage.getItem("virtual_workspace");
      if (savedVws && !LocalSync.isElectron() && !LocalSync.hasFSAPI()) {
        LocalSync.virtualWorkspace = savedVws;
      }
    }
  };
  const DB = {
    name: "GenesisDB",
    version: 12,
    db: null,
    _initPromise: null,
    async init() {
      if (this.db) return this.db;
      if (this._initPromise) return this._initPromise;
      this._initPromise = new Promise((resolve) => {
        try {
          const req = indexedDB.open(this.name, this.version);
          req.onerror = (e) => {
            console.error("DB Open Error", e);
            resolve(null);
          };
          req.onupgradeneeded = (e) => {
            const db = e.target.result;
            const stores = [
              "volumes",
              "chapters",
              "outlines",
              "writings",
              "entities",
              "vectors",
              "prompts",
              "tools_custom",
              "assets",
              "library_books",
              "trading_strategies",
              "code_snippets",
              "text_api_pool",
              "image_api_pool",
              "video_api_pool",
              "audio_api_pool",
              "settings",
              "chat_sessions",
              "novella_sessions",
              "novella_messages",
              "novella_outlines",
              "novella_settings",
              "novella_prompts"
            ];
            stores.forEach((s) => {
              if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: "id" });
            });
          };
          req.onsuccess = (e) => {
            this.db = e.target.result;
            this.db.onversionchange = () => {
              this.db.close();
              this.db = null;
            };
            resolve(this.db);
          };
          req.onblocked = () => {
            console.warn("DB Open Blocked");
          };
        } catch (e) {
          console.error("IndexedDB error", e);
          resolve(null);
        }
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
                  for (const item of snapshot[store]) {
                    await DB._rawPut(store, item);
                    count++;
                  }
                }
              }
              if (count > 0) console.log("[VirtualWS] \u4ECE\u5DE5\u4F5C\u7A7A\u95F4\u300C" + LocalSync.virtualWorkspace + "\u300D\u52A0\u8F7D\u4E86 " + count + " \u6761\u8BB0\u5F55");
            }
          } else {
            await LocalSync._clearAllStores();
            const count = await LocalSync.loadAll();
            if (count > 0) console.log("[LocalSync] \u4ECE\u672C\u5730\u52A0\u8F7D\u4E86 " + count + " \u6761\u8BB0\u5F55");
          }
        } catch (e) {
          console.warn("[LocalSync] \u81EA\u52A8\u52A0\u8F7D\u5931\u8D25:", e);
        }
      }
      setTimeout(() => LocalSync._updateStatusBar(), 500);
      return result;
    },
    async op(store, mode, fn) {
      try {
        if (!this.db) await this.init();
        if (!this.db) throw new Error("Database not initialized");
        return new Promise((resolve, reject) => {
          try {
            const tx = this.db.transaction(store, mode);
            const req = fn(tx.objectStore(store));
            req.onsuccess = () => resolve(req.result);
            req.onerror = (e) => {
              console.error(`DB Op Error [${store}]:`, e.target.error);
              reject(e.target.error);
            };
          } catch (e) {
            reject(e);
          }
        });
      } catch (e) {
        console.error("DB Transaction Error:", e);
        return null;
      }
    },
    _rawPut: (s, v) => DB.op(s, "readwrite", (st) => st.put(v)),
    _rawGetAll: (s) => DB.op(s, "readonly", (st) => st.getAll()),
    async put(store, data) {
      const result = await DB.op(store, "readwrite", (st) => st.put(data));
      LocalSync._scheduleWrite(store);
      return result;
    },
    get: (store, key) => DB.op(store, "readonly", (st) => st.get(key)),
    getAll: (store) => DB.op(store, "readonly", (st) => st.getAll()),
    async del(store, key) {
      await DB.op(store, "readwrite", (st) => st.delete(key));
      LocalSync._scheduleWrite(store);
    },
    async clear(store) {
      await DB.op(store, "readwrite", (st) => st.clear());
      LocalSync._scheduleWrite(store);
    },
    async query(store, index, value) {
      return DB.op(store, "readonly", (st) => st.index(index).getAll(value));
    }
  };
  window.DB = DB;
  window.LocalSync = LocalSync;
})();
