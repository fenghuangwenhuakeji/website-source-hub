const { app, BrowserWindow, shell, ipcMain } = require('electron');
const fs = require('fs');
const http = require('http');
const path = require('path');

const APP_NAME = '凤煌';
const APP_ID = 'com.fenghuang.desktop';
const DEFAULT_CLOUD_ORIGIN = 'https://fhwhkj.top';
const DEFAULT_ENTRY_PATH = '/login';
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

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

    if (desktopBundlePath) {
        return desktopBundlePath;
    }

    if (normalizedPath.startsWith('/static/')) {
        const staticDir = getStaticDir();
        const staticPath = safeJoin(staticDir, normalizedPath.slice('/static/'.length));
        if (staticPath && fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
            return staticPath;
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
        return new URL(url, `${localAppOrigin}${DEFAULT_ENTRY_PATH}`);
    } catch {
        return null;
    }
}

function isAppUrl(url) {
    const resolvedUrl = resolveNavigationUrl(url);
    return resolvedUrl != null && resolvedUrl.origin === localAppOrigin;
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
        show: false,
    });

    mainWindow.loadFile(path.join(__dirname, 'error.html'), {
        query: {
            reason: error instanceof Error ? error.message : String(error),
        },
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
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
        show: false,
    });

    mainWindow.loadURL(`${localAppOrigin}${DEFAULT_ENTRY_PATH}`);

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (!isAppUrl(url)) {
            shell.openExternal(url);
        }

        return { action: 'deny' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (!isAppUrl(url)) {
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
}

function setupApiHandler() {
    ipcMain.handle('api-request', async (event, { url, options }) => {
        const { method = 'GET', body, headers = {} } = options;

        try {
            const fetchOptions = {
                method,
                headers: {
                    'Content-Type': 'application/json',
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

app.whenReady().then(async () => {
    app.setName(APP_NAME);
    app.setAppUserModelId(APP_ID);

    setupApiHandler();

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
