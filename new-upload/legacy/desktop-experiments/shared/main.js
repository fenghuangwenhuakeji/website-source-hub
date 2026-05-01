const { app, BrowserWindow, shell, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');

const SERVER_URL = 'http://115.190.158.182';
const API_BASE = 'http://115.190.158.182/api';

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        title: '超无穹',
        icon: path.join(__dirname, 'assets', 'icon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            preload: path.join(__dirname, 'preload.js'),
            partition: 'persist:chaowuqiong'
        },
        frame: true,
        backgroundColor: '#1a1a2e',
        show: false
    });

    const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
    
    if (process.env.ELECTRON_START_URL) {
        mainWindow.loadURL(SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (url.startsWith('http://') || url.startsWith('https://') && !url.includes('115.190.158.182')) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('加载失败:', errorCode, errorDescription);
        mainWindow.loadFile(path.join(__dirname, 'error.html'));
    });

    setupApiHandler();
}

function setupApiHandler() {
    ipcMain.handle('api-request', async (event, { url, options }) => {
        const { method = 'GET', body, headers = {} } = options;
        
        try {
            const fetchOptions = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            };

            if (body) {
                fetchOptions.body = JSON.stringify(body);
            }

            const response = await fetch(`${API_BASE}${url}`, fetchOptions);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API请求失败:', error);
            return { error: error.message };
        }
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        shell.openExternal(navigationUrl);
    });
});

ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

ipcMain.handle('get-platform', () => {
    return process.platform;
});
