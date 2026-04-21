const { app, BrowserWindow, shell, ipcMain, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// 日志函数
function logToFile(message) {
  const logPath = 'D:\\main-debug.log';
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
}

// 启用硬件加速
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,CanvasOopRasterization');
app.commandLine.appendSwitch('disable-features', 'site-per-process');

let mainWindow;
let serverProcess = null;
const SERVER_PORT = 3003;

// 启动后端服务器
function startServer() {
  const isDev = !app.isPackaged;
  
  // 确定服务器路径
  let serverPath;
  let serverCwd;
  
  if (isDev) {
    // 开发模式：使用原始 TypeScript 文件
    serverPath = path.join(__dirname, '..', '..', '待打包', 'CodeEditor', 'server', 'index.ts');
    serverCwd = path.join(__dirname, '..', '..', '待打包', 'CodeEditor');
  } else {
    // 生产模式：使用打包后的资源
    serverPath = path.join(process.resourcesPath, 'server', 'index.ts');
    serverCwd = process.resourcesPath;
  }
  
  console.log('Server path:', serverPath);
  console.log('Server cwd:', serverCwd);
  
  // 检查服务器文件是否存在
  if (!fs.existsSync(serverPath)) {
    console.error('Server file not found:', serverPath);
    return false;
  }
  
  try {
    // 使用 tsx 启动 TypeScript 服务器
    const tsxPath = path.join(serverCwd, 'node_modules', '.bin', 'tsx.cmd');
    console.log('tsx path:', tsxPath);
    console.log('tsx exists:', fs.existsSync(tsxPath));
    
    // 检查 tsx 是否存在，如果不存在尝试使用 npx
    let command, args;
    if (fs.existsSync(tsxPath)) {
      command = tsxPath;
      args = [serverPath];
    } else {
      console.log('tsx not found, using npx tsx');
      command = 'npx';
      args = ['tsx', serverPath];
    }
    
    console.log('Command:', command);
    console.log('Args:', args);
    
    serverProcess = spawn(command, args, {
      cwd: serverCwd,
      env: { ...process.env, PORT: SERVER_PORT.toString() },
      stdio: 'pipe',
      shell: true,
      windowsHide: true,
    });
    
    serverProcess.stdout.on('data', (data) => {
      console.log(`[Server] ${data.toString().trim()}`);
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error(`[Server Error] ${data.toString().trim()}`);
    });
    
    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
      serverProcess = null;
    });
    
    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
      serverProcess = null;
    });
    
    console.log('Server process spawned, PID:', serverProcess.pid);
    return true;
  } catch (error) {
    console.error('Error starting server:', error);
    return false;
  }
}

// 停止后端服务器
function stopServer() {
  if (serverProcess) {
    console.log('Stopping server...');
    serverProcess.kill();
    serverProcess = null;
  }
}

// 窗口状态管理
const windowState = {
  width: 1600,
  height: 1000,
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
    title: '超无穹代码编辑器',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false,
      enableWebSQL: false,
      v8CacheOptions: 'code',
      sandbox: false, // 禁用沙箱以允许 localStorage 访问
    },
    frame: true,
    backgroundColor: '#1a1a2e',
    show: false,
  });

  // 恢复最大化状态
  if (windowState.maximized) {
    mainWindow.maximize();
  }

  // 根据环境确定加载路径
  const isDev = !app.isPackaged;
  const appPath = isDev 
    ? path.join(__dirname, '..', 'app', 'index.html')
    : path.join(process.resourcesPath, 'app', 'index.html');
  
  console.log('Loading from:', appPath);
  console.log('__dirname:', __dirname);
  console.log('process.resourcesPath:', process.resourcesPath);
  console.log('app.isPackaged:', app.isPackaged);
  
  // 检查文件是否存在
  if (!fs.existsSync(appPath)) {
    console.error('App path does not exist:', appPath);
    // 尝试备用路径
    const fallbackPath = path.join(__dirname, '..', 'app', 'index.html');
    console.log('Trying fallback path:', fallbackPath);
    if (fs.existsSync(fallbackPath)) {
      mainWindow.loadFile(fallbackPath);
    } else {
      mainWindow.loadFile(path.join(__dirname, 'error.html'));
    }
  } else {
    mainWindow.loadFile(appPath);
  }

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
}

app.whenReady().then(() => {
  // 尝试启动后端服务器（如果端口被占用则跳过）
  try {
    startServer();
  } catch (error) {
    console.log('服务器启动失败，可能端口已被占用:', error);
  }
  
  protocol.registerFileProtocol('app', (request, callback) => {
    const url = request.url.substr(6);
    callback({ path: path.normalize(`${__dirname}/${url}`) });
  });

  // 立即创建窗口（不等待服务器）
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // 停止后端服务器
  stopServer();
  
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

ipcMain.handle('get-performance-metrics', () => {
  if (!mainWindow) return null;
  return {
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  };
});

ipcMain.handle('clear-cache', async () => {
  if (!mainWindow) return false;
  await mainWindow.webContents.session.clearCache();
  return true;
});

// 文件系统 IPC 处理程序
const { dialog } = require('electron');

// 选择文件夹
ipcMain.handle('select-folder', async () => {
  if (!mainWindow) return { canceled: true };
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: '选择工作区文件夹'
  });
  return result;
});

// 读取目录（异步）
ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    // 限制目录深度和大小，防止卡死
    const MAX_ENTRIES = 500; // 最多读取500个条目
    
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const items = [];
    
    // 限制条目数量
    const limitedEntries = entries.slice(0, MAX_ENTRIES);
    
    // 使用 Promise.all 并行处理，但限制并发数
    const batchSize = 50; // 每批处理50个
    for (let i = 0; i < limitedEntries.length; i += batchSize) {
      const batch = limitedEntries.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (entry) => {
          // 跳过系统目录和隐藏文件
          if (entry.name.startsWith('.') || 
              entry.name === 'System Volume Information' ||
              entry.name === '$RECYCLE.BIN' ||
              entry.name === 'Config.Msi' ||
              entry.name === 'pagefile.sys' ||
              entry.name === 'hiberfil.sys' ||
              entry.name === 'swapfile.sys' ||
              entry.name === 'node_modules' ||
              entry.name === '.git') {
            return null;
          }
          
          try {
            const fullPath = path.join(dirPath, entry.name);
            const stats = await fs.promises.stat(fullPath);
            return {
              name: entry.name,
              path: fullPath,
              type: entry.isDirectory() ? 'directory' : 'file',
              size: stats.size,
              modified: stats.mtime.toISOString(),
              extension: entry.isFile() ? path.extname(entry.name).slice(1) : undefined
            };
          } catch (statError) {
            console.warn('跳过无法访问的文件:', entry.name);
            return null;
          }
        })
      );
      
      items.push(...batchResults.filter(item => item !== null));
    }
    
    return { success: true, data: items };
  } catch (error) {
    console.error('读取目录失败:', error);
    return { success: false, error: error.message };
  }
});

// 读取文件
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return { success: true, data: content };
  } catch (error) {
    console.error('读取文件失败:', error);
    return { success: false, error: error.message };
  }
});

// 写入文件（使用异步写入避免阻塞）
ipcMain.handle('write-file', async (event, filePath, content) => {
  logToFile(`[write-file] 接收到的路径: ${filePath}, 内容长度: ${content?.length || 0}`);
  console.log('[main.js write-file] 接收到的路径:', filePath, '内容长度:', content?.length || 0);
  try {
    // 确保父目录存在
    const parentDir = path.dirname(filePath);
    logToFile(`[write-file] 确保父目录存在: ${parentDir}`);
    console.log('[main.js write-file] 确保父目录存在:', parentDir);
    
    // 检查父目录是否是驱动器根目录（如 D:、C:）
    // Windows 驱动器根目录不需要创建
    const isDriveRoot = /^[a-zA-Z]:[\\/]?$/.test(parentDir);
    if (!isDriveRoot) {
      await fs.promises.mkdir(parentDir, { recursive: true });
    } else {
      logToFile(`[write-file] 跳过创建驱动器根目录: ${parentDir}`);
      console.log('[main.js write-file] 跳过创建驱动器根目录:', parentDir);
    }
    
    // 异步写入文件
    await fs.promises.writeFile(filePath, content, 'utf-8');
    logToFile(`[write-file] 文件写入成功: ${filePath}`);
    console.log('[main.js write-file] 文件写入成功:', filePath);
    return { success: true };
  } catch (error) {
    logToFile(`[write-file] 写入文件失败: ${error.message}`);
    console.error('[main.js write-file] 写入文件失败:', error);
    return { success: false, error: error.message };
  }
});

// 获取驱动器列表（Windows）
ipcMain.handle('get-drives', async () => {
  try {
    // 直接返回默认驱动器列表，避免使用可能出错的系统调用
    return {
      success: true,
      data: [
        { name: 'C: 驱动器', path: 'C:\\', sizeGB: 0, freeGB: 0, usedGB: 0 },
        { name: 'D: 驱动器', path: 'D:\\', sizeGB: 0, freeGB: 0, usedGB: 0 }
      ]
    };
  } catch (error) {
    console.error('获取驱动器失败:', error);
    // 返回默认驱动器
    return {
      success: true,
      data: [
        { name: 'C: 驱动器', path: 'C:\\', sizeGB: 0, freeGB: 0, usedGB: 0 },
        { name: 'D: 驱动器', path: 'D:\\', sizeGB: 0, freeGB: 0, usedGB: 0 }
      ]
    };
  }
});

// 创建文件或目录（异步）
ipcMain.handle('create-file', async (event, filePath, type) => {
  logToFile(`[create-file] 接收到的路径: ${filePath}, 类型: ${type}`);
  console.log('[main.js create-file] 接收到的路径:', filePath, '类型:', type);
  try {
    if (type === 'directory') {
      logToFile(`[create-file] 创建目录: ${filePath}`);
      console.log('[main.js create-file] 创建目录:', filePath);
      await fs.promises.mkdir(filePath, { recursive: true });
      logToFile(`[create-file] 目录创建成功: ${filePath}`);
      console.log('[main.js create-file] 目录创建成功:', filePath);
    } else {
      // 确保父目录存在
      const parentDir = path.dirname(filePath);
      logToFile(`[create-file] 创建文件，确保父目录存在: ${parentDir}`);
      console.log('[main.js create-file] 创建文件，确保父目录存在:', parentDir);
      await fs.promises.mkdir(parentDir, { recursive: true });
      await fs.promises.writeFile(filePath, '', 'utf-8');
      logToFile(`[create-file] 文件创建成功: ${filePath}`);
      console.log('[main.js create-file] 文件创建成功:', filePath);
    }
    return { success: true };
  } catch (error) {
    logToFile(`[create-file] 创建失败: ${error.message}`);
    console.error('[main.js create-file] 创建失败:', error);
    return { success: false, error: error.message };
  }
});

// 删除文件或目录（异步）
ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    const stats = await fs.promises.stat(filePath);
    if (stats.isDirectory()) {
      await fs.promises.rm(filePath, { recursive: true, force: true });
    } else {
      await fs.promises.unlink(filePath);
    }
    return { success: true };
  } catch (error) {
    console.error('删除文件失败:', error);
    return { success: false, error: error.message };
  }
});

// 重命名文件或目录（异步）
ipcMain.handle('rename-file', async (event, oldPath, newPath) => {
  try {
    await fs.promises.rename(oldPath, newPath);
    return { success: true };
  } catch (error) {
    console.error('重命名文件失败:', error);
    return { success: false, error: error.message };
  }
});

// 移动文件或目录（异步）
ipcMain.handle('move-file', async (event, sourcePath, targetPath) => {
  try {
    await fs.promises.rename(sourcePath, targetPath);
    return { success: true };
  } catch (error) {
    console.error('移动文件失败:', error);
    return { success: false, error: error.message };
  }
});

// 获取文件状态
ipcMain.handle('get-file-stats', async (event, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      success: true,
      data: {
        size: stats.size,
        modified: stats.mtime.toISOString(),
        created: stats.birthtime.toISOString(),
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile()
      }
    };
  } catch (error) {
    console.error('获取文件状态失败:', error);
    return { success: false, error: error.message };
  }
});
