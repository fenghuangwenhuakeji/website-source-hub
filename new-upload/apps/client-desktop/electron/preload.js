const { contextBridge, ipcRenderer, shell } = require('electron');

let workspacePath = '';

function inferPathSeparator(inputPath = '') {
    return /^[a-zA-Z]:[\\/]/.test(inputPath) || inputPath.includes('\\') ? '\\' : '/';
}

function normalizeWorkspacePath(inputPath) {
    if (typeof inputPath !== 'string') {
        return '';
    }

    const trimmedPath = inputPath.replace(/^["']|["']$/g, '').trim();
    if (!trimmedPath) {
        return '';
    }

    return inferPathSeparator(trimmedPath) === '\\'
        ? trimmedPath.replace(/\//g, '\\')
        : trimmedPath.replace(/\\/g, '/');
}

function isAbsolutePath(inputPath) {
    return /^([a-zA-Z]:[\\/]|\\\\|\/)/.test(inputPath);
}

function joinWorkspacePath(basePath, relativePath) {
    const separator = inferPathSeparator(basePath);
    const base = basePath.replace(/[\\/]+$/g, '');
    const child = relativePath.replace(/^[\\/]+/g, '');
    return `${base}${separator}${child}`;
}

function resolveWorkspacePath(inputPath) {
    const normalizedPath = normalizeWorkspacePath(inputPath);
    if (!normalizedPath) {
        return normalizedPath;
    }

    if (isAbsolutePath(normalizedPath)) {
        return normalizedPath;
    }

    if (!workspacePath) {
        return normalizedPath;
    }

    return joinWorkspacePath(workspacePath, normalizedPath);
}

async function unwrapDirectoryResult(targetPath) {
    const result = await ipcRenderer.invoke('read-directory', targetPath);
    if (!result?.success || !Array.isArray(result.data)) {
        return [];
    }

    return result.data;
}

async function unwrapFileResult(targetPath) {
    const result = await ipcRenderer.invoke('read-file', targetPath);
    if (!result?.success) {
        return {
            content: '',
            encoding: 'utf-8',
            size: 0,
            path: targetPath,
            error: result?.error ?? '读取文件失败',
        };
    }

    return {
        content: typeof result.content === 'string' ? result.content : result.data ?? '',
        encoding: result.encoding ?? 'utf-8',
        size: result.size ?? 0,
        path: result.path ?? targetPath,
        name: result.name,
    };
}

async function readFileText(targetPath) {
    const result = await ipcRenderer.invoke('read-file', targetPath);
    if (!result?.success) {
        throw new Error(result?.error ?? `读取文件失败: ${targetPath}`);
    }

    return typeof result.content === 'string' ? result.content : result.data ?? '';
}

async function writeFileText(targetPath, content) {
    const result = await ipcRenderer.invoke('write-file', targetPath, content);
    if (!result?.success) {
        throw new Error(result?.error ?? `写入文件失败: ${targetPath}`);
    }

    return result;
}

contextBridge.exposeInMainWorld('electronAPI', {
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getPlatform: () => ipcRenderer.invoke('get-platform'),
    getProxyPort: () => ipcRenderer.invoke('get-proxy-port'),
    getPerformanceMetrics: () => ipcRenderer.invoke('get-performance-metrics'),
    clearCache: () => ipcRenderer.invoke('clear-cache'),
    openExternal: (url) => shell.openExternal(url),
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    readDirectory: (targetPath) => ipcRenderer.invoke('read-directory', targetPath),
    readFile: (targetPath) => ipcRenderer.invoke('read-file', targetPath),
    writeFile: (targetPath, content) => ipcRenderer.invoke('write-file', targetPath, content),
    getDrives: () => ipcRenderer.invoke('get-drives'),
    createFile: (targetPath, type) => ipcRenderer.invoke('create-file', targetPath, type),
    deleteFile: (targetPath) => ipcRenderer.invoke('delete-file', targetPath),
    renameFile: (oldPath, newPath) => ipcRenderer.invoke('rename-file', oldPath, newPath),
    moveFile: (sourcePath, targetPath) => ipcRenderer.invoke('move-file', sourcePath, targetPath),
    getFileStats: (targetPath) => ipcRenderer.invoke('get-file-stats', targetPath),
    executeCommand: (payload) => ipcRenderer.invoke('execute-command', payload),
    setWorkspacePath: (nextWorkspacePath) => {
        workspacePath = normalizeWorkspacePath(nextWorkspacePath);
    },
    getWorkspacePath: () => workspacePath,
    resolvePath: (inputPath) => resolveWorkspacePath(inputPath),
    fs: {
        readFile: (targetPath) => readFileText(targetPath),
        writeFile: (targetPath, content) => writeFileText(targetPath, content),
    },
    fileSystem: {
        listDirectory: (targetPath) => unwrapDirectoryResult(targetPath),
        readFile: (targetPath) => unwrapFileResult(targetPath),
        writeFile: (targetPath, content) => writeFileText(targetPath, content),
    },
    api: {
        request: (url, options) => ipcRenderer.invoke('api-request', { url: url.replace(/^\/api/, ''), options })
    },
    isElectron: true,
});
