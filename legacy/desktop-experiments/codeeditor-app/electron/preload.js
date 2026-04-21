const { contextBridge, ipcRenderer } = require('electron');

// 工作区路径存储
let workspacePath = '';

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 应用信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // 性能监控
  getPerformanceMetrics: () => ipcRenderer.invoke('get-performance-metrics'),
  clearCache: () => ipcRenderer.invoke('clear-cache'),

  // 文件系统 API
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  readDirectory: (path) => ipcRenderer.invoke('read-directory', path),
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  writeFile: (path, content) => ipcRenderer.invoke('write-file', path, content),
  getDrives: () => ipcRenderer.invoke('get-drives'),
  createFile: (path, type) => ipcRenderer.invoke('create-file', path, type),
  deleteFile: (path) => ipcRenderer.invoke('delete-file', path),
  renameFile: (oldPath, newPath) => ipcRenderer.invoke('rename-file', oldPath, newPath),
  moveFile: (sourcePath, targetPath) => ipcRenderer.invoke('move-file', sourcePath, targetPath),
  getFileStats: (path) => ipcRenderer.invoke('get-file-stats', path),

  // 工作区管理
  setWorkspacePath: (path) => { workspacePath = path; },
  getWorkspacePath: () => workspacePath,
  
  // 将相对路径解析为绝对路径
  resolvePath: (inputPath) => {
    console.log('[resolvePath] 输入:', inputPath, '工作区:', workspacePath);
    
    if (!inputPath) return inputPath;
    
    // 规范化路径格式（统一反斜杠）
    let normalized = inputPath.replace(/\//g, '\\');
    
    // 修复常见的路径错误：如果路径包含多个盘符（如 D:\FD:\），只保留第一个
    // 例如: D:\FD:\888\index.html -> D:\888\index.html
    const doubleDriveMatch = normalized.match(/^([A-Za-z]:)[^\\]+\\([A-Za-z]:\\.*)/);
    if (doubleDriveMatch) {
      normalized = doubleDriveMatch[1] + '\\' + doubleDriveMatch[2];
      console.log('[resolvePath] 修复双盘符路径:', normalized);
    }
    
    // 如果路径以无效盘符开头（如 FD:\），尝试使用工作区的盘符
    const invalidDriveMatch = normalized.match(/^([A-Z]{2,}):\\/i);
    if (invalidDriveMatch && workspacePath) {
      const workDrive = workspacePath.match(/^([A-Za-z]:)/);
      if (workDrive) {
        normalized = normalized.replace(/^[A-Z]{2,}:/i, workDrive[1]);
        console.log('[resolvePath] 修复无效盘符:', normalized);
      }
    }
    
    // 如果已经是绝对路径（有效的盘符），直接返回
    if (normalized.match(/^[A-Z]:\\/i)) {
      console.log('[resolvePath] 识别为绝对路径:', normalized);
      return normalized; // 已经是绝对路径
    }
    
    // 如果没有设置工作区，返回原路径
    if (!workspacePath) {
      console.log('[resolvePath] 无工作区，返回:', normalized);
      return normalized;
    }
    
    // 相对路径，拼接工作区
    const path = require('path');
    const result = path.join(workspacePath, normalized);
    console.log('[resolvePath] 相对路径拼接:', result);
    return result;
  },

  // 环境检测
  isElectron: true,
});

// 监听主进程消息
ipcRenderer.on('main-process-message', (_event, message) => {
  console.log('收到主进程消息:', message);
});
