const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');
const { Client } = require('ssh2');

function parseServer(value) {
  const server = value || 'root@115.190.158.182';
  const at = server.indexOf('@');
  if (at === -1) {
    return { username: 'root', host: server };
  }
  return {
    username: server.slice(0, at),
    host: server.slice(at + 1),
  };
}

function readClashConfig() {
  const configPath = process.env.CLASH_CONFIG_PATH || path.join(process.env.USERPROFILE || '', '.config', 'clash', 'config.yaml');
  const result = {
    controller: process.env.CLASH_CONTROLLER || '',
    secret: process.env.CLASH_SECRET || '',
  };

  try {
    const text = fs.readFileSync(configPath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const controllerMatch = line.match(/^\s*external-controller:\s*(.+)\s*$/);
      if (controllerMatch && !result.controller) {
        result.controller = controllerMatch[1].trim();
      }
      const secretMatch = line.match(/^\s*secret:\s*(.+)\s*$/);
      if (secretMatch && !result.secret) {
        result.secret = secretMatch[1].trim();
      }
    }
  } catch (_) {
    return result;
  }

  return result;
}

function clashRequest(controller, secret, method, apiPath, body) {
  return new Promise((resolve, reject) => {
    if (!controller) {
      resolve(null);
      return;
    }

    const [host, portText] = controller.split(':');
    const port = Number.parseInt(portText || '80', 10);
    const payload = body ? Buffer.from(JSON.stringify(body), 'utf8') : null;

    const req = http.request(
      {
        host,
        port,
        path: apiPath,
        method,
        headers: {
          Authorization: secret ? `Bearer ${secret}` : '',
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': payload ? payload.length : 0,
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(text ? JSON.parse(text) : null);
            return;
          }
          reject(new Error(`Clash API ${res.statusCode}: ${text}`));
        });
      }
    );

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

function connectThroughHttpProxy(proxyHost, proxyPort, targetHost, targetPort) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({
      host: proxyHost,
      port: proxyPort,
    });

    let headerBuffer = Buffer.alloc(0);
    let connected = false;

    socket.setNoDelay(true);
    socket.on('error', reject);

    socket.on('connect', () => {
      const target = `${targetHost}:${targetPort}`;
      const request =
        `CONNECT ${target} HTTP/1.1\r\n` +
        `Host: ${target}\r\n` +
        'Proxy-Connection: Keep-Alive\r\n' +
        '\r\n';
      socket.write(request);
    });

    socket.on('data', (chunk) => {
      if (connected) {
        return;
      }

      headerBuffer = Buffer.concat([headerBuffer, chunk]);
      const headerEnd = headerBuffer.indexOf('\r\n\r\n');

      if (headerEnd === -1) {
        if (headerBuffer.length > 64 * 1024) {
          reject(new Error('Proxy response header too large'));
        }
        return;
      }

      const headerText = headerBuffer.subarray(0, headerEnd).toString('latin1');
      const firstLine = headerText.split('\r\n')[0] || '';

      if (!/^HTTP\/1\.[01] 200\b/i.test(firstLine)) {
        reject(new Error(`Proxy CONNECT failed: ${firstLine}`));
        socket.destroy();
        return;
      }

      connected = true;
      const remaining = headerBuffer.subarray(headerEnd + 4);
      if (remaining.length > 0) {
        socket.pause();
        socket.unshift(remaining);
        socket.resume();
      }
      resolve(socket);
    });
  });
}

function setupInteractiveShell(conn) {
  return new Promise((resolve, reject) => {
    conn.shell(
      {
        term: process.env.TERM || 'xterm-256color',
        cols: process.stdout.columns || 120,
        rows: process.stdout.rows || 40,
      },
      (error, stream) => {
        if (error) {
          reject(error);
          return;
        }

        const cleanup = () => {
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
          }
          process.stdin.pause();
        };

        if (process.stdin.isTTY) {
          process.stdin.setRawMode(true);
        }
        process.stdin.resume();

        process.stdin.on('data', (data) => {
          stream.write(data);
        });

        stream.on('data', (data) => {
          process.stdout.write(data);
        });

        stream.on('close', () => {
          cleanup();
          conn.end();
          resolve();
        });

        stream.on('error', (streamError) => {
          cleanup();
          reject(streamError);
        });

        process.stdout.on('resize', () => {
          try {
            stream.setWindow(process.stdout.rows || 40, process.stdout.columns || 120, 0, 0);
          } catch (_) {
          }
        });
      }
    );
  });
}

async function main() {
  const { username, host } = parseServer(process.env.SSH_SERVER);
  const password = process.env.SSH_SERVER_PASSWORD || '';
  const proxyHost = process.env.SSH_PROXY_HOST || '127.0.0.1';
  const proxyPort = Number.parseInt(process.env.SSH_PROXY_PORT || '7890', 10);
  const targetPort = Number.parseInt(process.env.SSH_SERVER_PORT || '22', 10);

  if (!password) {
    throw new Error('SSH_SERVER_PASSWORD is required');
  }

  const clash = readClashConfig();
  if (process.env.SSH_CLASH_FORCE_DIRECT !== '0') {
    try {
      await clashRequest(clash.controller, clash.secret, 'PUT', '/proxies/GLOBAL', { name: 'DIRECT' });
      process.stdout.write('[ssh-shell] Clash GLOBAL -> DIRECT\n');
    } catch (error) {
      process.stdout.write(`[ssh-shell] Clash switch skipped: ${error.message}\n`);
    }
  }

  process.stdout.write(`[ssh-shell] Connecting to ${username}@${host}:${targetPort} via ${proxyHost}:${proxyPort}\n`);
  const sock = await connectThroughHttpProxy(proxyHost, proxyPort, host, targetPort);

  const conn = new Client();
  conn.on('banner', (message) => {
    process.stdout.write(message.endsWith('\n') ? message : `${message}\n`);
  });

  conn.on('ready', async () => {
    process.stdout.write('[ssh-shell] Connected. Interactive shell opened.\n');
    try {
      await setupInteractiveShell(conn);
      process.exit(0);
    } catch (error) {
      process.stderr.write(`[ssh-shell] Shell error: ${error.message}\n`);
      process.exit(1);
    }
  });

  conn.on('error', (error) => {
    process.stderr.write(`[ssh-shell] SSH error: ${error.message}\n`);
    process.exit(1);
  });

  conn.on('close', () => {
    process.exit(0);
  });

  conn.connect({
    sock,
    username,
    password,
    tryKeyboard: false,
    readyTimeout: 15000,
    keepaliveInterval: 30000,
    keepaliveCountMax: 3,
  });
}

main().catch((error) => {
  process.stderr.write(`[ssh-shell] ${error.message}\n`);
  process.exit(1);
});
