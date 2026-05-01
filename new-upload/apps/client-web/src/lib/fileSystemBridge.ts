export const FILE_SYSTEM_BRIDGE_MARKER = 'data-desktop-fs="bridge"';

export const createFileSystemBridgeScript = (): string => {
  const script = `
(() => {
  if (typeof window === 'undefined' || window.electronAPI) return;
  console.log('[FileSystemBridge] Initializing, showDirectoryPicker in window:', 'showDirectoryPicker' in window, 'in parent:', 'showDirectoryPicker' in window.parent);

  const DB_NAME = 'fenghuang-fs-bridge';
  const DB_STORE = 'handles';
  const DB_KEY = 'root';

  let rootHandle = null;

  const openDb = () => new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
  });

  const saveRootHandle = async (handle) => {
    const db = await openDb();
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put(handle, DB_KEY);
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  };

  const loadRootHandle = async () => {
    try {
      const db = await openDb();
      const tx = db.transaction(DB_STORE, 'readonly');
      const req = tx.objectStore(DB_STORE).get(DB_KEY);
      return await new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
      });
    } catch { return null; }
  };

  const getRootHandle = async () => {
    if (rootHandle) return rootHandle;
    rootHandle = await loadRootHandle();
    return rootHandle;
  };

  const resolvePath = async (path) => {
    const root = await getRootHandle();
    if (!root) return null;
    if (path === 'local://' || path === '') return { handle: root, isDirectory: true };

    const parts = path.replace(/^local:\/\//, '').split('/').filter(Boolean);
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      try {
        if (isLast) {
          try {
            const fileHandle = await current.getFileHandle(part);
            return { handle: fileHandle, isDirectory: false };
          } catch {
            const dirHandle = await current.getDirectoryHandle(part);
            return { handle: dirHandle, isDirectory: true };
          }
        } else {
          current = await current.getDirectoryHandle(part);
        }
      } catch { return null; }
    }
    return { handle: current, isDirectory: true };
  };

  const fsApi = {
    getDrives: async () => {
      const root = await getRootHandle();
      const name = root ? '\uD83D\uDCC1 ' + root.name : '\uD83D\uDCC1 本地文件夹(点击选择)';
      return { success: true, data: [{ name, path: 'local://', sizeGB: 0, freeGB: 0, usedGB: 0 }] };
    },

    selectFolder: async () => {
      try {
        const picker = window.showDirectoryPicker || window.parent.showDirectoryPicker;
        if (!picker) throw new Error('showDirectoryPicker not available');
        const handle = await picker.call(window);
        rootHandle = handle;
        await saveRootHandle(handle);
        return { canceled: false, filePaths: ['local://'] };
      } catch (e) {
        return { canceled: true, filePaths: [] };
      }
    },

    readDirectory: async (path) => {
      const resolved = await resolvePath(path);
      if (!resolved) {
        try {
          const picker = window.showDirectoryPicker || window.parent.showDirectoryPicker;
          if (!picker) throw new Error('showDirectoryPicker not available');
          const handle = await picker.call(window);
          rootHandle = handle;
          await saveRootHandle(handle);
          return await fsApi.readDirectory(path);
        } catch (e) {
          return { success: false, error: '未选择本地文件夹。请在Chrome/Edge 中点击本地文件夹驱动器以授权访问。' };
        }
      }
      if (!resolved.isDirectory) return { success: false, error: '路径不是目录' };

      const entries = [];
      for await (const [name, entry] of resolved.handle.entries()) {
        const entryPath = path === 'local://' ? 'local://' + name : path + '/' + name;
        let size = 0;
        let modifiedTime = '';
        if (entry.kind === 'file') {
          try {
            const file = await entry.getFile();
            size = file.size;
            modifiedTime = new Date(file.lastModified).toISOString();
          } catch {}
        }
        entries.push({
          name,
          path: entryPath,
          type: entry.kind,
          size,
          modifiedTime,
          isDirectory: entry.kind === 'directory',
          isFile: entry.kind === 'file',
        });
      }
      return { success: true, data: entries };
    },

    readFile: async (path) => {
      const resolved = await resolvePath(path);
      if (!resolved) return { success: false, error: '未选择本地文件夹' };
      if (resolved.isDirectory) return { success: false, error: '路径是目录' };

      const file = await resolved.handle.getFile();
      const content = await file.text();
      return { success: true, data: content, content, size: file.size, name: file.name, path };
    },

    writeFile: async (path, content) => {
      const parts = path.replace(/^local:\/\//, '').split('/').filter(Boolean);
      if (parts.length === 0) return { success: false, error: '无效路径' };

      const fileName = parts.pop();
      let dirPath = 'local://' + parts.join('/');
      if (parts.length === 0) dirPath = 'local://';

      const resolved = await resolvePath(dirPath);
      if (!resolved || !resolved.isDirectory) return { success: false, error: '父目录不存在' };

      try {
        const fileHandle = await resolved.handle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        return { success: true, path };
      } catch (e) {
        return { success: false, error: e.message || '写入失败' };
      }
    },

    createFile: async (path, type) => {
      const parts = path.replace(/^local:\/\//, '').split('/').filter(Boolean);
      if (parts.length === 0) return { success: false, error: '无效路径' };

      const name = parts.pop();
      let dirPath = 'local://' + parts.join('/');
      if (parts.length === 0) dirPath = 'local://';

      const resolved = await resolvePath(dirPath);
      if (!resolved || !resolved.isDirectory) return { success: false, error: '父目录不存在' };

      try {
        if (type === 'directory') {
          await resolved.handle.getDirectoryHandle(name, { create: true });
        } else {
          await resolved.handle.getFileHandle(name, { create: true });
        }
        return { success: true, path };
      } catch (e) {
        return { success: false, error: e.message || '创建失败' };
      }
    },

    deleteFile: async (path) => {
      const parts = path.replace(/^local:\/\//, '').split('/').filter(Boolean);
      if (parts.length === 0) return { success: false, error: '无效路径' };

      const name = parts.pop();
      let dirPath = 'local://' + parts.join('/');
      if (parts.length === 0) dirPath = 'local://';

      const resolved = await resolvePath(dirPath);
      if (!resolved || !resolved.isDirectory) return { success: false, error: '父目录不存在' };

      try {
        await resolved.handle.removeEntry(name, { recursive: true });
        return { success: true, path };
      } catch (e) {
        return { success: false, error: e.message || '删除失败' };
      }
    },

    renameFile: async () => {
      return { success: false, error: '重命名暂不支持（File System Access API 限制）' };
    },

    moveFile: async () => {
      return { success: false, error: '移动暂不支持（File System Access API 限制）' };
    },

    getFileStats: async (path) => {
      const resolved = await resolvePath(path);
      if (!resolved) return { success: false, error: '文件不存在' };
      if (resolved.isDirectory) {
        return { success: true, data: { isDirectory: true, size: 0, path } };
      }
      const file = await resolved.handle.getFile();
      return {
        success: true,
        data: {
          isDirectory: false,
          size: file.size,
          modifiedTime: new Date(file.lastModified).toISOString(),
          path,
        },
      };
    },

    executeCommand: async () => {
      return { success: false, error: '命令执行在浏览器中不可用' };
    },

    getPlatform: () => 'browser',
    getAppVersion: () => 'browser-fs-bridge',
    getProxyPort: () => null,
    getPerformanceMetrics: () => ({}),
    clearCache: () => Promise.resolve(),
    openExternal: (url) => { window.open(url, '_blank'); return Promise.resolve(); },
    showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }),
    setWorkspacePath: () => {},
    getWorkspacePath: () => 'local://',
    resolvePath: (p) => p,
    fs: {
      readFile: (p) => fsApi.readFile(p).then((r) => r.success ? r.content : Promise.reject(r.error)),
      writeFile: (p, c) => fsApi.writeFile(p, c).then((r) => r.success ? r : Promise.reject(r.error)),
    },
    fileSystem: {
      listDirectory: (p) => fsApi.readDirectory(p).then((r) => r.success ? r.data : Promise.reject(r.error)),
      readFile: (p) => fsApi.readFile(p).then((r) => r.success ? r : Promise.reject(r.error)),
      writeFile: (p, c) => fsApi.writeFile(p, c).then((r) => r.success ? r : Promise.reject(r.error)),
    },
    api: {
      request: (url, options) => fetch(url, options).then((r) => r.json()),
    },
    isElectron: false,
  };

  window.electronAPI = fsApi;
})();
`;
  const safeScript = script.replace(/<\/script>/gi, '<\\/script>');
  return `<script ${FILE_SYSTEM_BRIDGE_MARKER}>${safeScript}<\/script>`;
};

export const injectFileSystemBridge = (html: string, notes?: string[]): string => {
  if (html.includes(FILE_SYSTEM_BRIDGE_MARKER)) return html;

  const bridgeScript = createFileSystemBridgeScript();
  const headMatch = html.match(/<head[^>]*>/i);
  if (headMatch) {
    notes?.push('Injected file system bridge for browser local folder access.');
    return html.replace(headMatch[0], `${headMatch[0]}\n${bridgeScript}`);
  }

  const htmlMatch = html.match(/<html[^>]*>/i);
  if (htmlMatch) {
    notes?.push('Injected file system bridge for browser local folder access.');
    return html.replace(htmlMatch[0], `${htmlMatch[0]}\n<head>\n${bridgeScript}\n</head>`);
  }

  notes?.push('Injected file system bridge for browser local folder access.');
  return `${bridgeScript}\n${html}`;
};
