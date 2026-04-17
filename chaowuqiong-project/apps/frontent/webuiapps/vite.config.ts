import { UserConfigExport, ConfigEnv, loadEnv } from 'vite';
import type { PluginOption, Plugin } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react-swc';
import { spawn } from 'child_process';
import { basename, dirname, extname, join, resolve, sep } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import autoprefixer from 'autoprefixer';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import * as fs from 'fs';
import * as os from 'os';
import { generateLogFileName, createLogMiddleware } from './src/lib/logPlugin';

const LLM_CONFIG_FILE = resolve(os.homedir(), '.openroom', 'config.json');
const SESSIONS_DIR = resolve(os.homedir(), '.openroom', 'sessions');
const CHARACTERS_FILE = resolve(os.homedir(), '.openroom', 'characters.json');
const MODS_FILE = resolve(os.homedir(), '.openroom', 'mods.json');
const NATIVE_LAUNCH_EXTENSIONS = ['.exe', '.com', '.bat', '.cmd', '.lnk'];
const BACKEND_LLM_PROXY_URL = 'http://127.0.0.1:3000/api/llm-proxy';

interface NativeAppRequestBody {
  executablePath?: string;
  workingDirectory?: string;
  launcherPath?: string;
  launchArgs?: string[];
}

interface NativeAppResolution {
  resolvedPath: string;
  workingDirectory: string;
  wasDirectoryInput: boolean;
}

function stripWrappedQuotes(value: string): string {
  return value.trim().replace(/^"(.*)"$/, '$1');
}

function isSupportedNativeLaunchFile(filePath: string): boolean {
  return NATIVE_LAUNCH_EXTENSIONS.includes(extname(filePath).toLowerCase());
}

function resolveExecutableFromDirectory(directoryPath: string): string {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  const launchableFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(directoryPath, entry.name))
    .filter(isSupportedNativeLaunchFile)
    .sort((left, right) => left.localeCompare(right));

  if (launchableFiles.length === 0) {
    throw new Error(`目录内没有找到可启动文件：${directoryPath}`);
  }

  const directoryBaseName = basename(directoryPath).toLowerCase();
  const sameNameMatch = launchableFiles.find((filePath) => (
    basename(filePath, extname(filePath)).toLowerCase() === directoryBaseName
  ));

  if (sameNameMatch) {
    return sameNameMatch;
  }

  const executableFiles = launchableFiles.filter((filePath) => ['.exe', '.com'].includes(extname(filePath).toLowerCase()));
  if (executableFiles.length === 1) {
    return executableFiles[0];
  }

  if (launchableFiles.length === 1) {
    return launchableFiles[0];
  }

  throw new Error(
    `目录内找到多个可启动文件，请改填具体程序路径：${launchableFiles.map((filePath) => basename(filePath)).join('、')}`,
  );
}

function resolveNativeLaunchTarget(inputPath: string): NativeAppResolution {
  const cleanedInput = stripWrappedQuotes(inputPath);
  if (!cleanedInput) {
    throw new Error('请先填写本地程序路径。');
  }

  const normalizedInput = cleanedInput.replace(/\//g, '\\');
  const trailingSlashTrimmed = normalizedInput.replace(/[\\/]+$/, '');
  const directCandidates = Array.from(new Set([
    normalizedInput,
    trailingSlashTrimmed,
    ...(extname(trailingSlashTrimmed)
      ? []
      : NATIVE_LAUNCH_EXTENSIONS.map((extension) => `${trailingSlashTrimmed}${extension}`)),
  ])).filter(Boolean);

  for (const candidate of directCandidates) {
    if (!fs.existsSync(candidate)) {
      continue;
    }

    const stat = fs.statSync(candidate);
    if (stat.isDirectory()) {
      const resolvedPath = resolveExecutableFromDirectory(candidate);
      return {
        resolvedPath,
        workingDirectory: dirname(resolvedPath),
        wasDirectoryInput: true,
      };
    }

    if (stat.isFile() && isSupportedNativeLaunchFile(candidate)) {
      return {
        resolvedPath: candidate,
        workingDirectory: dirname(candidate),
        wasDirectoryInput: false,
      };
    }
  }

  throw new Error(`未找到可启动程序：${cleanedInput}`);
}

function resolveWorkingDirectory(
  workingDirectory: string | undefined,
  fallbackDirectory: string,
): string {
  const cleanedDirectory = stripWrappedQuotes(workingDirectory || '');
  if (!cleanedDirectory) {
    return fallbackDirectory;
  }

  const normalizedDirectory = cleanedDirectory.replace(/\//g, '\\').replace(/[\\/]+$/, '');
  if (fs.existsSync(normalizedDirectory) && fs.statSync(normalizedDirectory).isDirectory()) {
    return normalizedDirectory;
  }

  return fallbackDirectory;
}

function parseNativeAppRequestBody(rawBody: string): NativeAppRequestBody {
  if (!rawBody.trim()) {
    return {};
  }

  try {
    return JSON.parse(rawBody) as NativeAppRequestBody;
  } catch {
    throw new Error('请求体不是合法的 JSON。');
  }
}

function resolveNativeAppPayload(payload: NativeAppRequestBody): NativeAppResolution {
  const launchSource = stripWrappedQuotes(payload.launcherPath || payload.executablePath || '');
  const resolved = resolveNativeLaunchTarget(launchSource);
  return {
    ...resolved,
    workingDirectory: resolveWorkingDirectory(payload.workingDirectory, resolved.workingDirectory),
  };
}

function launchNativeAppProcess(
  resolvedPath: string,
  workingDirectory: string,
  launchArgs: string[],
): number | undefined {
  const extension = extname(resolvedPath).toLowerCase();

  if (extension === '.exe' || extension === '.com') {
    const child = spawn(resolvedPath, launchArgs, {
      cwd: workingDirectory,
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
      shell: false,
    });
    child.unref();
    return child.pid;
  }

  const child = spawn('cmd.exe', ['/c', 'start', '', resolvedPath, ...launchArgs], {
    cwd: workingDirectory,
    detached: true,
    stdio: 'ignore',
    windowsHide: false,
    shell: false,
  });
  child.unref();
  return child.pid;
}

function attachNativeAppsMiddleware(middlewares: any): void {
  middlewares.use('/api/native-apps/resolve', (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
      res.writeHead(405);
      res.end(JSON.stringify({ success: false, message: 'Method not allowed' }));
      return;
    }

    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const payload = parseNativeAppRequestBody(Buffer.concat(chunks).toString());
        const resolved = resolveNativeAppPayload(payload);
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          data: resolved,
        }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          message: error instanceof Error ? error.message : String(error),
        }));
      }
    });
  });

  middlewares.use('/api/native-apps/launch', (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
      res.writeHead(405);
      res.end(JSON.stringify({ success: false, message: 'Method not allowed' }));
      return;
    }

    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try {
        if (process.platform !== 'win32') {
          throw new Error('当前启动桥仅支持 Windows 本地环境。');
        }

        const payload = parseNativeAppRequestBody(Buffer.concat(chunks).toString());
        const resolved = resolveNativeAppPayload(payload);
        const pid = launchNativeAppProcess(
          resolved.resolvedPath,
          resolved.workingDirectory,
          Array.isArray(payload.launchArgs) ? payload.launchArgs.filter(Boolean) : [],
        );

        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          message: '本地程序已启动。',
          data: {
            ...resolved,
            pid,
          },
        }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          message: error instanceof Error ? error.message : String(error),
        }));
      }
    });
  });
}

function nativeAppsPlugin(): Plugin {
  return {
    name: 'native-apps',
    configureServer(server) {
      attachNativeAppsMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachNativeAppsMiddleware(server.middlewares);
    },
  };
}

/** LLM config persistence plugin — reads/writes config to ~/.openroom/config.json */
function attachLlmConfigMiddleware(middlewares: any): void {
  middlewares.use('/api/llm-config', (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET') {
      try {
        if (fs.existsSync(LLM_CONFIG_FILE)) {
          const content = fs.readFileSync(LLM_CONFIG_FILE, 'utf-8');
          res.writeHead(200);
          res.end(content);
        } else {
          res.writeHead(200);
          res.end('{}');
        }
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: String(err) }));
      }
      return;
    }

    if (req.method === 'POST') {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        try {
          const body = Buffer.concat(chunks).toString();
          JSON.parse(body);
          fs.mkdirSync(resolve(os.homedir(), '.openroom'), { recursive: true });
          fs.writeFileSync(LLM_CONFIG_FILE, body, 'utf-8');
          res.writeHead(200);
          res.end(JSON.stringify({ ok: true }));
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
      return;
    }

    res.writeHead(405);
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  });
}

function llmConfigPlugin(): Plugin {
  return {
    name: 'llm-config',
    configureServer(server) {
      attachLlmConfigMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachLlmConfigMiddleware(server.middlewares);
    },
  };
}

/**
 * Session data plugin — reads/writes files under ~/.openroom/sessions/
 * API: /api/session-data?path={charId}/{modId}/chat/history.json
 * Supports GET, POST, DELETE.
 */
function attachSessionDataMiddleware(middlewares: any): void {
  middlewares.use('/api/session-data', (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    const url = new URL(req.url || '', 'http://localhost');
    const relPath = url.searchParams.get('path') || '';
    const action = url.searchParams.get('action') || '';

    if (!relPath) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Missing path parameter' }));
      return;
    }

    const safePath = relPath.replace(/[^a-zA-Z0-9_\-./]/g, '_').replace(/\.\./g, '');
    const filePath = join(SESSIONS_DIR, safePath);

    if (action === 'list' && req.method === 'GET') {
      try {
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isDirectory()) {
          res.writeHead(200);
          res.end(JSON.stringify({ files: [], not_exists: !fs.existsSync(filePath) }));
          return;
        }
        const entries = fs.readdirSync(filePath, { withFileTypes: true });
        const files = entries.map((e) => ({
          path: safePath === '' || safePath === '/' ? e.name : `${safePath}/${e.name}`,
          type: e.isDirectory() ? 1 : 0,
          size: e.isDirectory() ? 0 : fs.statSync(join(filePath, e.name)).size,
        }));
        res.writeHead(200);
        res.end(JSON.stringify({ files, not_exists: false }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: String(err) }));
      }
      return;
    }

    if (req.method === 'GET') {
      try {
        if (fs.existsSync(filePath)) {
          const ext = filePath.split('.').pop()?.toLowerCase() || '';
          const binaryMimes: Record<string, string> = {
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            gif: 'image/gif',
            webp: 'image/webp',
            svg: 'image/svg+xml',
            mp4: 'video/mp4',
            webm: 'video/webm',
          };
          const mime = binaryMimes[ext];
          if (mime) {
            res.setHeader('Content-Type', mime);
            res.writeHead(200);
            res.end(fs.readFileSync(filePath));
          } else {
            res.writeHead(200);
            res.end(fs.readFileSync(filePath, 'utf-8'));
          }
        } else {
          res.writeHead(200);
          res.end('{}');
        }
      } catch (err) {
        res.writeHead(200);
        res.end('{}');
      }
      return;
    }

    if (req.method === 'POST') {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        try {
          const buf = Buffer.concat(chunks);
          const dir = dirname(filePath);
          fs.mkdirSync(dir, { recursive: true });
          const ct = (req.headers['content-type'] || '').toLowerCase();
          if (
            ct.startsWith('image/') ||
            ct.startsWith('video/') ||
            ct === 'application/octet-stream'
          ) {
            fs.writeFileSync(filePath, buf);
          } else {
            fs.writeFileSync(filePath, buf.toString(), 'utf-8');
          }
          res.writeHead(200);
          res.end(JSON.stringify({ ok: true }));
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
      return;
    }

    if (req.method === 'DELETE') {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: String(err) }));
      }
      return;
    }

    res.writeHead(405);
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  });

  middlewares.use('/api/session-reset', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.method !== 'DELETE') {
      res.writeHead(405);
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    const url = new URL(req.url || '', 'http://localhost');
    const relPath = url.searchParams.get('path') || '';
    if (!relPath) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Missing path parameter' }));
      return;
    }

    const safePath = relPath.replace(/[^a-zA-Z0-9_\-./]/g, '_').replace(/\.\./g, '');
    const targetDir = join(SESSIONS_DIR, safePath);

    try {
      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
      }
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: String(err) }));
    }
  });
}

function sessionDataPlugin(): Plugin {
  return {
    name: 'session-data',
    configureServer(server) {
      attachSessionDataMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachSessionDataMiddleware(server.middlewares);
    },
  };
}

/** Debug log plugin — writes browser logs to logs/debug-*.log */
function logServerPlugin(): Plugin {
  return {
    name: 'log-server',
    configureServer(server) {
      const logDir = join(__dirname, 'logs');
      const logFile = join(logDir, generateLogFileName());
      const middleware = createLogMiddleware(logFile, fs);

      server.middlewares.use('/api/log', middleware);

      server.httpServer?.once('listening', () => {
        console.log(`\n  [DebugLog] Writing to: ${logFile}\n`);
      });
    },
  };
}

/** LLM API proxy plugin — resolves browser CORS restrictions */
function readRequestBuffer(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function collectForwardHeaders(req: any, targetUrl: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const skipKeys = new Set(['host', 'connection', 'content-length', 'x-llm-target-url']);

  for (const [key, val] of Object.entries(req.headers)) {
    if (typeof val !== 'string') continue;
    if (skipKeys.has(key)) continue;
    if (key.startsWith('x-custom-')) {
      headers[key.replace('x-custom-', '')] = val;
    } else {
      headers[key] = val;
    }
  }

  if (!headers.accept) {
    headers.accept = '*/*';
  }

  headers.origin = new URL(targetUrl).origin;
  return headers;
}

async function writeFetchResponse(fetchRes: Response, res: any): Promise<void> {
  const outgoingHeaders: Record<string, string> = {};
  const headerWhitelist = [
    'content-type',
    'content-length',
    'cache-control',
    'content-disposition',
    'etag',
    'last-modified',
    'location',
  ];

  for (const headerName of headerWhitelist) {
    const value = fetchRes.headers.get(headerName);
    if (value) {
      outgoingHeaders[headerName.replace(/\b\w/g, (char) => char.toUpperCase())] = value;
    }
  }

  res.writeHead(fetchRes.status, outgoingHeaders);
  const buffer = Buffer.from(await fetchRes.arrayBuffer());
  res.end(buffer);
}

async function forwardProxyRequest(req: any, res: any, targetUrl: string, rawBody: Buffer): Promise<void> {
  const fetchRes = await fetch(targetUrl, {
    method: req.method || 'POST',
    headers: collectForwardHeaders(req, targetUrl),
    body: rawBody.length > 0 ? rawBody : undefined,
  });

  await writeFetchResponse(fetchRes, res);
}

function attachLlmProxyMiddleware(middlewares: any): void {
  middlewares.use('/api/llm-proxy', async (req, res) => {
    if (!['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    try {
      const rawBody = await readRequestBuffer(req);
      const targetUrlHeader = req.headers['x-llm-target-url'] as string | undefined;

      if (targetUrlHeader) {
        await forwardProxyRequest(req, res, targetUrlHeader, rawBody);
        return;
      }

      const backendRes = await fetch(BACKEND_LLM_PROXY_URL, {
        method: req.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: rawBody.length > 0 ? rawBody : undefined,
      });

      await writeFetchResponse(backendRes, res);
    } catch (err: unknown) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
    }
  });
}

function llmProxyPlugin(): Plugin {
  return {
    name: 'llm-proxy',
    configureServer(server) {
      attachLlmProxyMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachLlmProxyMiddleware(server.middlewares);
    },
  };
}

/** Generic JSON file persistence plugin factory */
function attachJsonFileMiddleware(middlewares: any, apiPath: string, filePath: string): void {
  middlewares.use(apiPath, (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET') {
      try {
        if (fs.existsSync(filePath)) {
          res.writeHead(200);
          res.end(fs.readFileSync(filePath, 'utf-8'));
        } else {
          res.writeHead(200);
          res.end('{}');
        }
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: String(err) }));
      }
      return;
    }

    if (req.method === 'POST') {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        try {
          const body = Buffer.concat(chunks).toString();
          JSON.parse(body);
          fs.mkdirSync(resolve(os.homedir(), '.openroom'), { recursive: true });
          fs.writeFileSync(filePath, body, 'utf-8');
          res.writeHead(200);
          res.end(JSON.stringify({ ok: true }));
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
      return;
    }

    res.writeHead(405);
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  });
}

function jsonFilePlugin(name: string, apiPath: string, filePath: string): Plugin {
  return {
    name,
    configureServer(server) {
      attachJsonFileMiddleware(server.middlewares, apiPath, filePath);
    },
    configurePreviewServer(server) {
      attachJsonFileMiddleware(server.middlewares, apiPath, filePath);
    },
  };
}

/** Serve external static files (长篇/短篇/小说漫剧) from disk */
function staticExternalPlugin(): PluginOption {
  const projectRoot = resolve(__dirname, '../../');
  const longBookPath = resolve(projectRoot, '../超无穹/备份3/长篇');
  const shortBookPath = resolve(projectRoot, '../超无穹/备份3/短篇');
  const novelComicsPath = resolve(projectRoot, '../超无穹/备份3/小说漫剧');

  return {
    name: 'static-external',
    configureServer(server) {
      server.middlewares.use('/static/long', (req, res) => {
        const url = new URL(req.url || '/', 'http://localhost');
        const filePath = join(longBookPath, url.pathname);
        serveStaticFile(filePath, res);
      });
      server.middlewares.use('/static/short', (req, res) => {
        const url = new URL(req.url || '/', 'http://localhost');
        const filePath = join(shortBookPath, url.pathname);
        serveStaticFile(filePath, res);
      });
      server.middlewares.use('/static/novel', (req, res) => {
        const url = new URL(req.url || '/', 'http://localhost');
        const filePath = join(novelComicsPath, url.pathname);
        serveStaticFile(filePath, res);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use('/static/long', (req, res) => {
        const url = new URL(req.url || '/', 'http://localhost');
        const filePath = join(longBookPath, url.pathname);
        serveStaticFile(filePath, res);
      });
      server.middlewares.use('/static/short', (req, res) => {
        const url = new URL(req.url || '/', 'http://localhost');
        const filePath = join(shortBookPath, url.pathname);
        serveStaticFile(filePath, res);
      });
      server.middlewares.use('/static/novel', (req, res) => {
        const url = new URL(req.url || '/', 'http://localhost');
        const filePath = join(novelComicsPath, url.pathname);
        serveStaticFile(filePath, res);
      });
    },
  } as PluginOption;
}

function resolveSafeStaticPath(rootDir: string, pathname: string): string | null {
  try {
    const decodedPath = decodeURIComponent(pathname || '/');
    const relativePath = decodedPath.replace(/^\/+/, '');
    const candidatePath = resolve(rootDir, relativePath || 'index.html');
    const normalizedRoot = rootDir.endsWith(sep) ? rootDir : `${rootDir}${sep}`;

    if (candidatePath === rootDir || candidatePath.startsWith(normalizedRoot)) {
      return candidatePath;
    }

    return null;
  } catch {
    return null;
  }
}

function attachDesktopBundleCompatMiddleware(middlewares: any, bundlesRoot: string): void {
  middlewares.use('/access/desktop-bundles', (req, res) => {
    const url = new URL(req.url || '/', 'http://localhost');
    const candidatePath = resolveSafeStaticPath(bundlesRoot, url.pathname);

    if (!candidatePath) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    let filePath = candidatePath;
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = join(filePath, 'index.html');
    }

    serveStaticFile(filePath, res);
  });
}

function serveStaticFile(filePath: string, res: any) {
  try {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      html: 'text/html; charset=utf-8',
      css: 'text/css; charset=utf-8',
      js: 'application/javascript; charset=utf-8',
      json: 'application/json; charset=utf-8',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml; charset=utf-8',
      ico: 'image/x-icon',
      ttf: 'font/ttf',
      woff: 'font/woff',
      woff2: 'font/woff2',
    };
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.writeHead(200);
    res.end(fs.readFileSync(filePath));
  } catch (err) {
    res.writeHead(500);
    res.end('Server Error');
  }
}

const config = ({ mode }: ConfigEnv): UserConfigExport => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = env.NODE_ENV === 'production';
  const isTest = env.NODE_ENV === 'test';
  const isAnalyze = env.ANALYZE === 'analyze';
  const sentryAuthToken = env.SENTRY_AUTH_TOKEN;
  const bizProjectName = env.BIZ_PROJECT_NAME || '';

  const normalizeBase = (value: string | undefined) => {
    if (!value) {
      return '';
    }

    return value.endsWith('/') ? value : `${value}/`;
  };

  const getBase = () => {
    const explicitBase = normalizeBase(env.VITE_APP_BASE || env.BASE_URL);
    if (explicitBase) {
      return explicitBase;
    }
    if (isTest && bizProjectName) {
      return '/' + bizProjectName + '/';
    }
    return '/';
  };

  const skipLegacy = env.VITE_SKIP_LEGACY === 'true';

  const plugins: PluginOption[] = [
    llmConfigPlugin(),
    sessionDataPlugin(),
    logServerPlugin(),
    llmProxyPlugin(),
    nativeAppsPlugin(),
    jsonFilePlugin('characters', '/api/characters', CHARACTERS_FILE),
    jsonFilePlugin('mods', '/api/mods', MODS_FILE),
    staticExternalPlugin(),
    {
      name: 'desktop-bundle-access-compat',
      configureServer(server) {
        attachDesktopBundleCompatMiddleware(
          server.middlewares,
          resolve(__dirname, 'public', 'desktop-bundles'),
        );
      },
      configurePreviewServer(server) {
        attachDesktopBundleCompatMiddleware(
          server.middlewares,
          resolve(__dirname, 'dist', 'desktop-bundles'),
        );
      },
    },
    react(),
    ...(skipLegacy
      ? []
      : [
          legacy({
            targets: ['defaults', 'not ie <= 11', 'chrome 80'],
            additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
            renderLegacyChunks: true,
            modernPolyfills: true,
          }),
        ]),
  ];

  /** Only import when running in analyze mode */
  if (isAnalyze) {
    plugins.push(
      visualizer({
        gzipSize: true,
        open: true,
        filename: `${env.APP_NAME}-chunk.html`,
      }) as unknown as PluginOption,
    );
  }

  if (isProd && sentryAuthToken) {
    plugins.push(
      sentryVitePlugin({
        authToken: sentryAuthToken,
        org: env.SENTRY_ORG || '',
        project: env.SENTRY_PROJECT || '',
        url: env.SENTRY_URL || undefined,
        sourcemaps: {
          filesToDeleteAfterUpload: ['dist/**/*.js.map'],
        },
      }) as unknown as PluginOption,
    );
  }

  return {
    plugins,
    css: {
      postcss: {
        plugins: [autoprefixer({})],
      },
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: '[name]__[local]___[hash:base64:5]',
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@gui/vibe-container': resolve(__dirname, './src/lib/vibeContainerMock.ts'),
      },
    },
    base: getBase(),
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api/auth': { target: 'http://127.0.0.1:3000', changeOrigin: true },
        '/api/user': { target: 'http://127.0.0.1:3000', changeOrigin: true },
        '/api/recharge': { target: 'http://127.0.0.1:3000', changeOrigin: true },
        '/api/payment': { target: 'http://127.0.0.1:3000', changeOrigin: true },
        '/api/orders': { target: 'http://127.0.0.1:3000', changeOrigin: true },
        '/api/points': { target: 'http://127.0.0.1:3000', changeOrigin: true },
        '/api/referral': { target: 'http://127.0.0.1:3000', changeOrigin: true },
        '/api/duration': { target: 'http://127.0.0.1:3000', changeOrigin: true },
        '/api/sms': { target: 'http://127.0.0.1:3000', changeOrigin: true },
        '/api/wechat': { target: 'http://127.0.0.1:3000', changeOrigin: true },
        '/api/vip': { target: 'http://127.0.0.1:3000', changeOrigin: true },
        '/api/election': { target: 'http://127.0.0.1:3000', changeOrigin: true },
        '/api/novels': { target: 'http://127.0.0.1:3000', changeOrigin: true },
      },
    },
    define: {
      __APP__: JSON.stringify(env.APP_ENVIRONMENT),
      __ROUTER_BASE__: JSON.stringify(bizProjectName ? '/' + bizProjectName : ''),
      __ENV__: JSON.stringify(env.NODE_ENV),
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash]-v' + Date.now() + '.js',
          chunkFileNames: 'assets/[name]-[hash]-v' + Date.now() + '.js',
          manualChunks: (id) => {
            const normalizedId = id.replace(/\\/g, '/');
            const hasPackage = (pkg: string) => normalizedId.includes(`/node_modules/${pkg}/`);

            if (normalizedId.includes('/node_modules/')) {
              if (hasPackage('lucide-react')) {
                return 'vendor-lucide';
              }
              if (
                hasPackage('i18next') ||
                hasPackage('react-i18next') ||
                hasPackage('i18next-browser-languagedetector') ||
                hasPackage('intl-pluralrules')
              ) {
                return 'vendor-i18n';
              }
              if (hasPackage('framer-motion')) {
                return 'vendor-framer';
              }
              if (
                hasPackage('three') ||
                hasPackage('@react-three/fiber') ||
                hasPackage('@react-three/drei') ||
                hasPackage('@react-spring/three')
              ) {
                return 'vendor-three';
              }
              if (hasPackage('monaco-editor') || hasPackage('@monaco-editor/react')) {
                return 'vendor-monaco';
              }
              if (
                normalizedId.includes('/node_modules/@rc-component/color-picker/') ||
                hasPackage('antd') ||
                normalizedId.includes('/node_modules/@ant-design/')
              ) {
                return 'vendor-antd';
              }
              if (hasPackage('zustand') || hasPackage('pinia')) {
                return 'vendor-state';
              }
              if (
                hasPackage('openai') ||
                normalizedId.includes('/node_modules/@anthropic-ai/sdk/') ||
                normalizedId.includes('/node_modules/@dqbd/tiktoken/')
              ) {
                return 'vendor-llm';
              }
              if (
                hasPackage('yjs') ||
                hasPackage('y-websocket') ||
                hasPackage('y-indexeddb') ||
                hasPackage('lib0')
              ) {
                return 'vendor-crdt';
              }
              if (
                hasPackage('lodash-es') ||
                hasPackage('date-fns') ||
                hasPackage('uuid') ||
                hasPackage('nanoid') ||
                hasPackage('idb') ||
                hasPackage('clsx')
              ) {
                return 'vendor-utils';
              }
              if (normalizedId.includes('/node_modules/@tiptap/') || hasPackage('tiptap-markdown')) {
                return 'vendor-editor';
              }
              if (
                hasPackage('react-router') ||
                hasPackage('react-router-dom') ||
                normalizedId.includes('/node_modules/@remix-run/router/')
              ) {
                return 'vendor-router';
              }
              if (
                hasPackage('react') ||
                hasPackage('react-dom') ||
                hasPackage('scheduler') ||
                hasPackage('use-sync-external-store')
              ) {
                return 'vendor-react';
              }

              const packageMatch = normalizedId.match(/\/node_modules\/((?:@[^/]+\/)?[^/]+)/);
              if (packageMatch?.[1]) {
                const packageName = packageMatch[1]
                  .replace(/^@/, '')
                  .replace(/[\/@]/g, '-')
                  .replace(/[^a-zA-Z0-9-]/g, '')
                  .slice(0, 48);
                return `vendor-${packageName}`;
              }

              return undefined;
            }
            if (id.includes('/src/lib/clawCode/')) {
              return 'claw-code';
            }
            if (id.includes('/src/lib/aiPanelCore')) {
              return 'ai-panel';
            }
            if (id.includes('/src/lib/tools')) {
              return 'tools';
            }
            if (id.includes('/src/components/')) {
              const match = id.match(/\/src\/components\/([^/]+)/);
              if (match) {
                return `component-${match[1].toLowerCase()}`;
              }
            }
          },
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) {
              return 'assets/styles/[name]-[hash]-v' + Date.now() + '[extname]';
            }
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name || '')) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (/\.(woff2?|ttf|eot)$/i.test(assetInfo.name || '')) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            if (/\.(mp4|webm|mp3|wav)$/i.test(assetInfo.name || '')) {
              return 'assets/media/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
      minify: 'esbuild',
      esbuild: {
        drop: isProd ? ['console', 'debugger'] : [],
        pure: isProd ? ['console.log', 'console.info', 'console.debug'] : [],
      },
      chunkSizeWarningLimit: 1000,
      cssTarget: 'chrome61',
      sourcemap: !isProd,
      manifest: true,
      target: 'esnext',
      reportCompressedSize: true,
      cssCodeSplit: true,
      modulePreload: {
        polyfill: true,
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'zustand',
        'lucide-react',
        'antd',
      ],
      exclude: [
        '@dqbd/tiktoken',
      ],
      esbuildOptions: {
        target: 'esnext',
        define: {
          'process.env.NODE_ENV': JSON.stringify(mode),
        },
      },
    },
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: 'react',
      treeShaking: true,
    },
  };
};

export default config;
