const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getPlatform: () => ipcRenderer.invoke('get-platform'),
    openExternal: (url) => require('electron').shell.openExternal(url),
    api: {
        request: (url, options) => ipcRenderer.invoke('api-request', { url: url.replace(/^\/api/, ''), options })
    }
});
