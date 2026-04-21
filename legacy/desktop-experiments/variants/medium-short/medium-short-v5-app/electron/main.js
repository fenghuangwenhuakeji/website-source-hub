const { app, BrowserWindow, shell, ipcMain, protocol } = require('electron');
const path = require('path');
const fs = require('fs');

// 启用硬件加速
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,CanvasOopRasterization');
app.commandLine.appendSwitch('disable-features', 'site-per-process');

let mainWindow;

// 窗口状态管理
const windowState = {
  width: 1400,
  height: 900,
  x: undefined,
  y: undefined,
  maximized: false,
};

// 加载窗口状态
function loadWindowState() {
  try {
    const statePath = path.join(app.getPath('userData'), 'window-state.json');
    if (fs.existsSync(statePath)) {
      const savedState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      Object.assign(windowState, savedState);
    }
  } catch (error) {
    console.error('加载窗口状态失败:', error);
  }
}

// 保存窗口状态
function saveWindowState() {
  if (!mainWindow) return;
  
  try {
    const bounds = mainWindow.getBounds();
    const state = {
      ...windowState,
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      maximized: mainWindow.isMaximized(),
    };
    const statePath = path.join(app.getPath('userData'), 'window-state.json');
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('保存窗口状态失败:', error);
  }
}

function createWindow() {
  loadWindowState();
  
  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 1200,
    minHeight: 800,
    title: '中短篇创作V5',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js'),
      // 启用性能优化
      backgroundThrottling: false,
      enableWebSQL: false,
      v8CacheOptions: 'code',
    },
    frame: true,
    backgroundColor: '#1e3a5f',
    show: false,
    // 启用硬件加速
    webPreferences: {
      offscreen: false,
    },
  });

  // 恢复最大化状态
  if (windowState.maximized) {
    mainWindow.maximize();
  }

  const appPath = path.join(process.resourcesPath, 'app', 'index.html');
  mainWindow.loadFile(appPath);

  // 打开开发者工具以便调试
  // mainWindow.webContents.openDevTools();

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // 启用流畅的窗口动画
    mainWindow.setOpacity(0);
    let opacity = 0;
    const fadeIn = setInterval(() => {
      opacity += 0.1;
      if (opacity >= 1) {
        mainWindow.setOpacity(1);
        clearInterval(fadeIn);
      } else {
        mainWindow.setOpacity(opacity);
      }
    }, 30);
  });

  // 窗口关闭时保存状态
  mainWindow.on('close', () => {
    saveWindowState();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('加载失败:', errorCode, errorDescription);
    mainWindow.loadFile(path.join(__dirname, 'error.html'));
  });

  // 启用缓存
  mainWindow.webContents.session.clearCache().then(() => {
    console.log('缓存已清理');
  });
}

// 应用启动优化
app.whenReady().then(() => {
  // 注册自定义协议
  protocol.registerFileProtocol('app', (request, callback) => {
    const url = request.url.substr(6);
    callback({ path: path.normalize(`${__dirname}/${url}`) });
  });

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

// IPC 通信
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

// 性能监控
ipcMain.handle('get-performance-metrics', () => {
  if (!mainWindow) return null;
  return {
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  };
});

// 清理缓存
ipcMain.handle('clear-cache', async () => {
  if (!mainWindow) return false;
  await mainWindow.webContents.session.clearCache();
  return true;
});
