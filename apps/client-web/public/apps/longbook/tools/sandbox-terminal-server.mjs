import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const HOST = '127.0.0.1';
const PORT = Number(process.env.SANDBOX_TERMINAL_PORT || 8787);
const OUTPUT_LIMIT = 24000;

const blockedPatterns = [
  /(^|\s)sudo(\s|$)/i,
  /\brm\s+-[^\n;|&]*[rf][^\n;|&]*\//i,
  /\b(diskutil|mkfs|fdisk|shutdown|reboot)\b/i,
  /\bdd\s+if=/i,
  /curl\b[\s\S]*\|\s*(sh|bash|zsh)\b/i,
  /wget\b[\s\S]*\|\s*(sh|bash|zsh)\b/i,
  /:\s*\(\s*\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/i
];

function json(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) reject(new Error('Request body too large'));
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function safeCwd(input) {
  const target = input ? path.resolve(String(input)) : PROJECT_ROOT;
  return target.startsWith(PROJECT_ROOT) ? target : PROJECT_ROOT;
}

function assertSafe(command) {
  const text = String(command || '').trim();
  if (!text) throw new Error('Empty command');
  const hit = blockedPatterns.find(re => re.test(text));
  if (hit) throw new Error('Command blocked by sandbox guard');
  return text;
}

function runCommand(command, cwd, timeoutMs) {
  return new Promise(resolve => {
    const child = spawn('/bin/zsh', ['-lc', command], {
      cwd,
      env: {
        PATH: process.env.PATH || '/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin',
        HOME: process.env.HOME || '',
        LANG: process.env.LANG || 'en_US.UTF-8',
        TERM: 'xterm-256color'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    const trim = value => value.length > OUTPUT_LIMIT ? value.slice(-OUTPUT_LIMIT) : value;
    child.stdout.on('data', chunk => { stdout = trim(stdout + chunk.toString()); });
    child.stderr.on('data', chunk => { stderr = trim(stderr + chunk.toString()); });

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      stderr = trim(`${stderr}\n[timeout] Command exceeded ${timeoutMs}ms`);
    }, timeoutMs);

    child.on('close', code => {
      clearTimeout(timer);
      resolve({ code, success: code === 0, stdout, stderr, cwd });
    });
  });
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, { ok: true, root: PROJECT_ROOT });
  }
  if (req.method !== 'POST' || req.url !== '/exec') {
    return json(res, 404, { error: 'Not found' });
  }

  try {
    const payload = JSON.parse(await readBody(req) || '{}');
    const command = assertSafe(payload.command);
    const cwd = safeCwd(payload.cwd);
    const timeoutMs = Math.max(1000, Math.min(120000, Number(payload.timeoutMs || 120000)));
    const result = await runCommand(command, cwd, timeoutMs);
    return json(res, 200, result);
  } catch (error) {
    return json(res, 400, { success: false, code: 1, stderr: error.message || String(error) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[sandbox-terminal] http://${HOST}:${PORT}/exec`);
  console.log(`[sandbox-terminal] root: ${PROJECT_ROOT}`);
});
