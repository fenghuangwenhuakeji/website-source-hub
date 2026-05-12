const { app, BrowserWindow, shell, ipcMain, dialog, Menu } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

const APP_NAME = '凤煌';
const APP_ID = 'com.fenghuang.desktop';
const APP_PROTOCOL = 'fenghuang';
const DEFAULT_CLOUD_ORIGIN = 'https://fhwhkj.top';
const DEFAULT_ENTRY_PATH = '/access/main';
const DESKTOP_AUTH_BRIDGE_PATH = '/__desktop-auth-bridge';
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const ACCEPTANCE_MODE_MARKER = path.join(DIST_DIR, '.acceptance-mode.json');

const MIME_TYPES = {
    '.css': 'text/css; charset=utf-8',
    '.gif': 'image/gif',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.wav': 'audio/wav',
    '.webm': 'video/webm',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
};

let mainWindow = null;
let localServer = null;
let localAppOrigin = '';
let pendingProtocolUrl = '';
let cloudAuthBridgeInProgress = false;
const DEFAULT_COMMAND_TIMEOUT_MS = 60_000;
const MAX_DIRECTORY_ENTRIES = 500;
const SKIPPED_DIRECTORY_NAMES = new Set([
    '$RECYCLE.BIN',
    '.git',
    'Config.Msi',
    'System Volume Information',
    'hiberfil.sys',
    'node_modules',
    'pagefile.sys',
    'swapfile.sys',
]);

function normalizeFsPath(inputPath) {
    if (typeof inputPath !== 'string') {
        return '';
    }

    const normalized = inputPath.replace(/\//g, path.sep).trim();
    return normalized ? path.normalize(normalized) : '';
}

function resolveCommandCwd(inputPath) {
    const normalizedPath = normalizeFsPath(inputPath);
    if (normalizedPath && fs.existsSync(normalizedPath)) {
        return normalizedPath;
    }

    return app.getPath('home');
}

function stringifyFileContent(content) {
    if (typeof content === 'string') {
        return content;
    }

    if (content == null) {
        return '';
    }

    if (Buffer.isBuffer(content)) {
        return content.toString('utf8');
    }

    return JSON.stringify(content, null, 2);
}

function trimCommandOutput(output, limit = 200_000) {
    if (output.length <= limit) {
        return output;
    }

    return output.slice(output.length - limit);
}

function getAvailableDrives() {
    if (process.platform !== 'win32') {
        return [{ name: '/', path: '/', sizeGB: 0, freeGB: 0, usedGB: 0 }];
    }

    return Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index))
        .map((letter) => `${letter}:\\`)
        .filter((drivePath) => fs.existsSync(drivePath))
        .map((drivePath) => ({
            name: `${drivePath.slice(0, 2)} 驱动器`,
            path: drivePath,
            sizeGB: 0,
            freeGB: 0,
            usedGB: 0,
        }));
}

async function listDirectoryEntries(dirPath) {
    const normalizedPath = normalizeFsPath(dirPath);
    const entries = await fs.promises.readdir(normalizedPath, { withFileTypes: true });
    const visibleEntries = entries
        .filter((entry) => !entry.name.startsWith('.') && !SKIPPED_DIRECTORY_NAMES.has(entry.name))
        .sort((left, right) => {
            if (left.isDirectory() !== right.isDirectory()) {
                return left.isDirectory() ? -1 : 1;
            }

            return left.name.localeCompare(right.name, 'zh-CN');
        })
        .slice(0, MAX_DIRECTORY_ENTRIES);

    return Promise.all(
        visibleEntries.map(async (entry) => {
            const fullPath = path.join(normalizedPath, entry.name);
            const stats = await fs.promises.stat(fullPath);

            return {
                name: entry.name,
                path: fullPath,
                type: entry.isDirectory() ? 'directory' : 'file',
                size: stats.size,
                modified: stats.mtime.toISOString(),
                modifiedAt: stats.mtime.toISOString(),
                extension: entry.isFile() ? path.extname(entry.name).slice(1) : undefined,
            };
        }),
    );
}

function executeSystemCommand(payload = {}) {
    const command = typeof payload.command === 'string' ? payload.command.trim() : '';
    const cwd = resolveCommandCwd(payload.cwd);
    const timeoutMs =
        typeof payload.timeout === 'number' && Number.isFinite(payload.timeout) && payload.timeout > 0
            ? Math.min(payload.timeout, DEFAULT_COMMAND_TIMEOUT_MS)
            : DEFAULT_COMMAND_TIMEOUT_MS;

    if (!command) {
        return Promise.resolve({ success: true, exitCode: 0, stdout: '', stderr: '' });
    }

    return new Promise((resolve) => {
        const isWindows = process.platform === 'win32';
        const commandFile = isWindows ? 'powershell.exe' : 'sh';
        const commandArgs = isWindows
            ? ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command]
            : ['-lc', command];
        const child = spawn(commandFile, commandArgs, {
            cwd,
            env: process.env,
            windowsHide: true,
        });

        let stdout = '';
        let stderr = '';
        let resolved = false;

        const finish = (result) => {
            if (resolved) {
                return;
            }

            resolved = true;
            clearTimeout(timeoutId);
            resolve(result);
        };

        const timeoutId = setTimeout(() => {
            stderr = trimCommandOutput(`${stderr}${stderr ? '\n' : ''}Command timed out after ${timeoutMs}ms`);
            child.kill();
        }, timeoutMs);

        child.stdout.on('data', (chunk) => {
            stdout = trimCommandOutput(`${stdout}${chunk.toString()}`);
        });

        child.stderr.on('data', (chunk) => {
            stderr = trimCommandOutput(`${stderr}${chunk.toString()}`);
        });

        child.on('error', (error) => {
            finish({
                success: false,
                exitCode: 1,
                stdout,
                stderr: trimCommandOutput(`${stderr}${stderr ? '\n' : ''}${error.message}`),
            });
        });

        child.on('close', (exitCode) => {
            finish({
                success: exitCode === 0,
                exitCode: typeof exitCode === 'number' ? exitCode : 1,
                stdout,
                stderr,
            });
        });
    });
}

function getLocalProxyPort() {
    if (!localAppOrigin) {
        return null;
    }

    try {
        const { port } = new URL(localAppOrigin);
        return port ? Number(port) : null;
    } catch {
        return null;
    }
}

function isLocalAcceptanceMode() {
    return process.env.LOCAL_ACCEPTANCE_MODE === '1' || fs.existsSync(ACCEPTANCE_MODE_MARKER);
}

function getEntryPath() {
    return isLocalAcceptanceMode() ? '/main?localAcceptance=1' : DEFAULT_ENTRY_PATH;
}

function getEntryUrl() {
    return `${localAppOrigin}${getEntryPath()}`;
}

function buildCloudUrl(pathname = '/login') {
    return new URL(pathname, CLOUD_ORIGIN).toString();
}

function focusMainWindow() {
    if (!mainWindow) {
        return;
    }

    if (mainWindow.isMinimized()) {
        mainWindow.restore();
    }

    mainWindow.show();
    mainWindow.focus();
}

function handleProtocolUrl(url) {
    if (typeof url !== 'string' || !url.startsWith(`${APP_PROTOCOL}://`)) {
        return;
    }

    pendingProtocolUrl = url;

    if (!localAppOrigin || !mainWindow) {
        return;
    }

    mainWindow.loadURL(getEntryUrl());
    focusMainWindow();
}

async function readAuthSnapshotFromCurrentPage() {
    if (!mainWindow) {
        return null;
    }

    try {
        return await mainWindow.webContents.executeJavaScript(`
            (() => {
                const read = (...keys) => {
                    for (const key of keys) {
                        const value = window.localStorage.getItem(key);
                        if (value) return value;
                    }
                    return null;
                };
                const token = read('fhwh_token', 'token');
                const refreshToken = read('fhwh_refresh_token', 'refreshToken');
                const user = read('fhwh_user', 'user');
                return token ? { token, refreshToken, user } : null;
            })()
        `, true);
    } catch {
        return null;
    }
}

function encodeAuthBridgePayload(authSnapshot) {
    return encodeURIComponent(JSON.stringify({
        token: authSnapshot?.token || null,
        refreshToken: authSnapshot?.refreshToken || null,
        user: authSnapshot?.user || null,
        nextPath: DEFAULT_ENTRY_PATH,
    }));
}

async function loadLocalAppWithAuthFromCloud() {
    if (cloudAuthBridgeInProgress) {
        return;
    }

    cloudAuthBridgeInProgress = true;
    const authSnapshot = await readAuthSnapshotFromCurrentPage();
    if (!authSnapshot?.token) {
        mainWindow.loadURL(buildCloudUrl(`/login?from=${encodeURIComponent(DEFAULT_ENTRY_PATH)}`));
        cloudAuthBridgeInProgress = false;
        return;
    }

    mainWindow.loadURL(`${localAppOrigin}${DESKTOP_AUTH_BRIDGE_PATH}#${encodeAuthBridgePayload(authSnapshot)}`);
    setTimeout(() => {
        cloudAuthBridgeInProgress = false;
    }, 1000);
}

function resolveCloudOrigin(...candidates) {
    for (const candidate of candidates) {
        if (!candidate) {
            continue;
        }

        try {
            return new URL(candidate).origin;
        } catch {
            // Ignore malformed overrides and fall back to the next candidate.
        }
    }

    return DEFAULT_CLOUD_ORIGIN;
}

const CLOUD_ORIGIN = resolveCloudOrigin(
    process.env.CLOUD_SERVER_ORIGIN,
    process.env.ELECTRON_START_URL,
);
const API_BASE = `${CLOUD_ORIGIN}/api`;

function getStaticDir() {
    const packagedStaticDir = path.join(process.resourcesPath, 'static');
    if (app.isPackaged && fs.existsSync(packagedStaticDir)) {
        return packagedStaticDir;
    }

    return path.join(DIST_DIR, 'static');
}

function ensureFrontendBuilt() {
    const indexFile = path.join(DIST_DIR, 'index.html');
    if (!fs.existsSync(indexFile)) {
        throw new Error(`未找到本地前端产物：${indexFile}`);
    }
}

function normalizeRequestPath(requestPath) {
    const decodedPath = decodeURIComponent(requestPath || '/');
    return decodedPath === '/' ? '/index.html' : decodedPath;
}

function writeDesktopAuthBridgeResponse(res) {
    res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
    });
    res.end(`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>正在同步登录状态</title>
  <style>
    html, body { margin: 0; min-height: 100%; background: #050814; color: #e5e7eb; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { display: grid; place-items: center; }
    main { text-align: center; }
  </style>
</head>
<body>
  <main>正在同步登录状态...</main>
  <script>
    (() => {
      const write = (keys, value) => {
        for (const key of keys) {
          if (value == null || value === '') {
            localStorage.removeItem(key);
          } else {
            localStorage.setItem(key, value);
          }
        }
      };
      try {
        const payload = JSON.parse(decodeURIComponent(location.hash.slice(1) || '{}'));
        write(['fhwh_token', 'token'], payload.token);
        write(['fhwh_refresh_token', 'refreshToken'], payload.refreshToken);
        write(['fhwh_user', 'user'], payload.user);
        location.replace(payload.nextPath || '${DEFAULT_ENTRY_PATH}');
      } catch (error) {
        location.replace('/login?forceLogin=1');
      }
    })();
  </script>
</body>
</html>`);
}

function resolveDesktopBundlePath(normalizedPath) {
    const accessPrefix = '/access/desktop-bundles/';
    const directPrefix = '/desktop-bundles/';
    let bundleRelativePath = '';

    if (normalizedPath.startsWith(accessPrefix)) {
        bundleRelativePath = normalizedPath.slice(accessPrefix.length);
    } else if (normalizedPath.startsWith(directPrefix)) {
        bundleRelativePath = normalizedPath.slice(directPrefix.length);
    } else {
        return null;
    }

    if (!bundleRelativePath) {
        return null;
    }

    const desktopBundlesDir = path.join(DIST_DIR, 'desktop-bundles');
    const candidatePath = safeJoin(desktopBundlesDir, bundleRelativePath);

    if (!candidatePath) {
        return null;
    }

    if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
        return candidatePath;
    }

    if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isDirectory()) {
        const indexPath = path.join(candidatePath, 'index.html');
        if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
            return indexPath;
        }
    }

    return null;
}

function resolveStaticAppPath(normalizedPath) {
    const accessPrefix = '/access/apps/';
    const directPrefix = '/apps/';
    let appRelativePath = '';

    if (normalizedPath.startsWith(accessPrefix)) {
        appRelativePath = normalizedPath.slice(accessPrefix.length);
    } else if (normalizedPath.startsWith(directPrefix)) {
        appRelativePath = normalizedPath.slice(directPrefix.length);
    } else {
        return null;
    }

    if (!appRelativePath) {
        return null;
    }

    const appsDir = path.join(DIST_DIR, 'apps');
    const candidatePath = safeJoin(appsDir, appRelativePath);

    if (!candidatePath) {
        return null;
    }

    if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
        return candidatePath;
    }

    if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isDirectory()) {
        const indexPath = path.join(candidatePath, 'index.html');
        if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
            return indexPath;
        }
    }

    return null;
}

function safeJoin(baseDir, requestPath) {
    const cleanedPath = requestPath.replace(/^\/+/, '');
    const resolvedPath = path.resolve(baseDir, cleanedPath);
    const normalizedBase = baseDir.endsWith(path.sep) ? baseDir : `${baseDir}${path.sep}`;

    if (resolvedPath === baseDir || resolvedPath.startsWith(normalizedBase)) {
        return resolvedPath;
    }

    return null;
}

function resolveStaticFile(requestPath) {
    const normalizedPath = normalizeRequestPath(requestPath);
    const desktopBundlePath = resolveDesktopBundlePath(normalizedPath);
    const staticAppPath = resolveStaticAppPath(normalizedPath);

    if (desktopBundlePath) {
        return desktopBundlePath;
    }

    if (staticAppPath) {
        return staticAppPath;
    }

    if (normalizedPath.startsWith('/static/')) {
        const staticDir = getStaticDir();
        const staticPath = safeJoin(staticDir, normalizedPath.slice('/static/'.length));
        if (staticPath && fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
            return staticPath;
        }
    }

    if (normalizedPath.startsWith('/access/')) {
        const accessDistPath = safeJoin(DIST_DIR, normalizedPath.slice('/access/'.length));
        if (accessDistPath && fs.existsSync(accessDistPath) && fs.statSync(accessDistPath).isFile()) {
            return accessDistPath;
        }
    }

    const distPath = safeJoin(DIST_DIR, normalizedPath);
    if (distPath && fs.existsSync(distPath) && fs.statSync(distPath).isFile()) {
        return distPath;
    }

    if (path.extname(normalizedPath)) {
        return null;
    }

    return path.join(DIST_DIR, 'index.html');
}

function writeFileResponse(res, filePath) {
    const extension = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extension] || 'application/octet-stream';

    res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=31536000',
    });
    res.end(fs.readFileSync(filePath));
}

function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];

        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

function buildProxyHeaders(req, targetUrl) {
    const headers = {};
    const skipHeaders = new Set([
        'connection',
        'content-length',
        'host',
        'origin',
        'referer',
    ]);

    for (const [key, value] of Object.entries(req.headers)) {
        if (skipHeaders.has(key) || typeof value !== 'string') {
            continue;
        }
        headers[key] = value;
    }

    headers.origin = new URL(targetUrl).origin;
    headers['user-agent'] = `FenghuangDesktop/${app.getVersion()} Electron/${process.versions.electron}`;
    headers['x-client-type'] = 'desktop';
    headers['x-app-version'] = app.getVersion();
    return headers;
}

async function proxyApiRequest(req, res, requestUrl) {
    const targetUrl = new URL(requestUrl.pathname + requestUrl.search, CLOUD_ORIGIN).toString();
    const rawBody = await readRequestBody(req);

    const response = await fetch(targetUrl, {
        method: req.method || 'GET',
        headers: buildProxyHeaders(req, targetUrl),
        body: rawBody.length > 0 ? rawBody : undefined,
    });

    const responseBuffer = Buffer.from(await response.arrayBuffer());
    const responseHeaders = {};

    ['cache-control', 'content-disposition', 'content-length', 'content-type', 'etag', 'last-modified']
        .forEach((headerName) => {
            const value = response.headers.get(headerName);
            if (value) {
                responseHeaders[headerName] = value;
            }
        });

    res.writeHead(response.status, responseHeaders);
    res.end(responseBuffer);
}

function startLocalServer() {
    ensureFrontendBuilt();

    return new Promise((resolve, reject) => {
        const server = http.createServer(async (req, res) => {
            try {
                const requestUrl = new URL(req.url || '/', 'http://127.0.0.1');

                if (requestUrl.pathname.startsWith('/api/')) {
                    await proxyApiRequest(req, res, requestUrl);
                    return;
                }

                if (requestUrl.pathname === DESKTOP_AUTH_BRIDGE_PATH) {
                    writeDesktopAuthBridgeResponse(res);
                    return;
                }

                const filePath = resolveStaticFile(requestUrl.pathname);
                if (!filePath) {
                    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end('Not Found');
                    return;
                }

                writeFileResponse(res, filePath);
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({
                    success: false,
                    message: error instanceof Error ? error.message : String(error),
                }));
            }
        });

        server.on('error', reject);
        server.listen(0, '127.0.0.1', () => {
            localServer = server;
            const address = server.address();
            const port = typeof address === 'object' && address ? address.port : 0;
            resolve(`http://127.0.0.1:${port}`);
        });
    });
}

function resolveNavigationUrl(url) {
    try {
        return new URL(url, getEntryUrl());
    } catch {
        return null;
    }
}

function isAppUrl(url) {
    const resolvedUrl = resolveNavigationUrl(url);
    if (!resolvedUrl) {
        return false;
    }

    if (resolvedUrl.origin === localAppOrigin) {
        return true;
    }

    return resolvedUrl.origin === CLOUD_ORIGIN;
}

function shouldBridgeCloudAccessUrl(url) {
    const resolvedUrl = resolveNavigationUrl(url);
    if (!resolvedUrl || resolvedUrl.origin !== CLOUD_ORIGIN) {
        return false;
    }

    if (resolvedUrl.pathname === DEFAULT_ENTRY_PATH || resolvedUrl.pathname.startsWith(`${DEFAULT_ENTRY_PATH}/`)) {
        return true;
    }

    // If the official site already has a web session, /login may resolve to the
    // website dashboard. Bridge that completed web login back into the local app.
    return resolvedUrl.pathname === '/dashboard';
}

function createFallbackWindow(error) {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 760,
        minWidth: 960,
        minHeight: 640,
        title: APP_NAME,
        icon: path.join(__dirname, 'assets', 'icon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        backgroundColor: '#050814',
        autoHideMenuBar: true,
        show: false,
    });

    mainWindow.loadFile(path.join(__dirname, 'error.html'), {
        query: {
            reason: error instanceof Error ? error.message : String(error),
        },
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        if (pendingProtocolUrl) {
            const protocolUrl = pendingProtocolUrl;
            pendingProtocolUrl = '';
            handleProtocolUrl(protocolUrl);
        }
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        title: APP_NAME,
        icon: path.join(__dirname, 'assets', 'icon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            preload: path.join(__dirname, 'preload.js'),
            partition: 'persist:fenghuang-main',
        },
        frame: true,
        backgroundColor: '#050814',
        autoHideMenuBar: true,
        show: false,
    });

    mainWindow.setMenu(null);
    mainWindow.setMenuBarVisibility(false);

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (shouldBridgeCloudAccessUrl(url)) {
            void loadLocalAppWithAuthFromCloud();
            return { action: 'deny' };
        }

        if (isAppUrl(url)) {
            mainWindow.loadURL(url);
        } else {
            shell.openExternal(url);
        }

        return { action: 'deny' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (shouldBridgeCloudAccessUrl(url)) {
            event.preventDefault();
            void loadLocalAppWithAuthFromCloud();
            return;
        }

        if (!isAppUrl(url)) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });

    mainWindow.webContents.on('did-navigate', (_event, url) => {
        if (shouldBridgeCloudAccessUrl(url)) {
            void loadLocalAppWithAuthFromCloud();
        }
    });

    mainWindow.webContents.on('did-navigate-in-page', (_event, url) => {
        if (shouldBridgeCloudAccessUrl(url)) {
            void loadLocalAppWithAuthFromCloud();
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

    mainWindow.loadURL(getEntryUrl());
    mainWindow.show();
}

function setupApiHandler() {
    ipcMain.handle('api-request', async (event, { url, options }) => {
        const { method = 'GET', body, headers = {} } = options;

        try {
            const fetchOptions = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': `FenghuangDesktop/${app.getVersion()} Electron/${process.versions.electron}`,
                    'X-Client-Type': 'desktop',
                    'X-App-Version': app.getVersion(),
                    ...headers,
                },
            };

            if (body) {
                fetchOptions.body = JSON.stringify(body);
            }

            const fullUrl = url.startsWith('/') ? `${API_BASE}${url}` : url;
            const response = await fetch(fullUrl, fetchOptions);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API 请求失败:', error);
            return { error: error.message };
        }
    });
}

function setupDesktopBridgeHandlers() {
    ipcMain.handle('get-performance-metrics', () => ({
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
    }));

    ipcMain.handle('clear-cache', async () => {
        if (!mainWindow) {
            return false;
        }

        await mainWindow.webContents.session.clearCache();
        return true;
    });

    ipcMain.handle('get-proxy-port', () => getLocalProxyPort());

    ipcMain.handle('show-open-dialog', async (_event, options = {}) => {
        if (!mainWindow) {
            return { canceled: true, filePaths: [] };
        }

        return dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory'],
            ...options,
        });
    });

    ipcMain.handle('select-folder', async () => {
        if (!mainWindow) {
            return { canceled: true, filePaths: [] };
        }

        return dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory'],
            title: '选择文件夹',
        });
    });

    ipcMain.handle('read-directory', async (_event, dirPath) => {
        try {
            const data = await listDirectoryEntries(dirPath);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    });

    ipcMain.handle('read-file', async (_event, filePath) => {
        try {
            const normalizedPath = normalizeFsPath(filePath);
            const content = await fs.promises.readFile(normalizedPath, 'utf8');
            return {
                success: true,
                data: content,
                content,
                encoding: 'utf-8',
                size: Buffer.byteLength(content),
                name: path.basename(normalizedPath),
                path: normalizedPath,
            };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    });

    ipcMain.handle('write-file', async (_event, filePath, content) => {
        try {
            const normalizedPath = normalizeFsPath(filePath);
            await fs.promises.mkdir(path.dirname(normalizedPath), { recursive: true });
            await fs.promises.writeFile(normalizedPath, stringifyFileContent(content), 'utf8');
            return { success: true, path: normalizedPath };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    });

    ipcMain.handle('get-drives', async () => ({ success: true, data: getAvailableDrives() }));

    ipcMain.handle('create-file', async (_event, filePath, type) => {
        try {
            const normalizedPath = normalizeFsPath(filePath);
            if (type === 'directory') {
                await fs.promises.mkdir(normalizedPath, { recursive: true });
            } else {
                await fs.promises.mkdir(path.dirname(normalizedPath), { recursive: true });
                await fs.promises.writeFile(normalizedPath, '', 'utf8');
            }

            return { success: true, path: normalizedPath };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    });

    ipcMain.handle('delete-file', async (_event, filePath) => {
        try {
            const normalizedPath = normalizeFsPath(filePath);
            const stats = await fs.promises.stat(normalizedPath);

            if (stats.isDirectory()) {
                await fs.promises.rm(normalizedPath, { recursive: true, force: true });
            } else {
                await fs.promises.unlink(normalizedPath);
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    });

    ipcMain.handle('rename-file', async (_event, oldPath, newPath) => {
        try {
            const normalizedOldPath = normalizeFsPath(oldPath);
            const normalizedNewPath = normalizeFsPath(newPath);
            await fs.promises.rename(normalizedOldPath, normalizedNewPath);
            return { success: true, path: normalizedNewPath };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    });

    ipcMain.handle('move-file', async (_event, sourcePath, targetPath) => {
        try {
            const normalizedSourcePath = normalizeFsPath(sourcePath);
            const normalizedTargetPath = normalizeFsPath(targetPath);
            await fs.promises.rename(normalizedSourcePath, normalizedTargetPath);
            return { success: true, path: normalizedTargetPath };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    });

    ipcMain.handle('get-file-stats', async (_event, filePath) => {
        try {
            const normalizedPath = normalizeFsPath(filePath);
            const stats = await fs.promises.stat(normalizedPath);
            return {
                success: true,
                data: {
                    size: stats.size,
                    modified: stats.mtime.toISOString(),
                    created: stats.birthtime.toISOString(),
                    isDirectory: stats.isDirectory(),
                    isFile: stats.isFile(),
                },
            };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    });

    ipcMain.handle('execute-command', async (_event, payload) => executeSystemCommand(payload));
}

const singleInstanceLock = app.requestSingleInstanceLock();

if (!singleInstanceLock) {
    app.quit();
} else {
    app.on('second-instance', (_event, argv) => {
        const protocolUrl = argv.find((item) => typeof item === 'string' && item.startsWith(`${APP_PROTOCOL}://`));
        if (protocolUrl) {
            handleProtocolUrl(protocolUrl);
        }
        focusMainWindow();
    });
}

app.on('open-url', (event, url) => {
    event.preventDefault();
    handleProtocolUrl(url);
});

app.whenReady().then(async () => {
    app.setName(APP_NAME);
    app.setAppUserModelId(APP_ID);
    app.setAsDefaultProtocolClient(APP_PROTOCOL);
    Menu.setApplicationMenu(null);

    setupApiHandler();
    setupDesktopBridgeHandlers();

    try {
        localAppOrigin = await startLocalServer();
        createWindow();
    } catch (error) {
        console.error('本地桌面壳启动失败:', error);
        createFallbackWindow(error);
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            if (localAppOrigin) {
                createWindow();
            } else {
                createFallbackWindow('本地桌面资源未成功启动');
            }
        }
    });
});

app.on('before-quit', () => {
    if (localServer) {
        localServer.close();
        localServer = null;
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-platform', () => process.platform);
