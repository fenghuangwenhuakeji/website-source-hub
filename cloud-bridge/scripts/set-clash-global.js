const fs = require('fs');
const http = require('http');
const path = require('path');

function readClashConfig() {
  const configPath = path.join(process.env.USERPROFILE || '', '.config', 'clash', 'config.yaml');
  const result = { controller: '', secret: '' };
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

  return result;
}

function request(controller, secret, method, apiPath, body) {
  return new Promise((resolve, reject) => {
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
            resolve(text ? JSON.parse(text) : {});
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

async function main() {
  const args = process.argv.slice(2);
  const containsIndex = args.indexOf('--contains');
  const exactIndex = args.indexOf('--exact');
  const indexIndex = args.indexOf('--index');

  const contains = containsIndex !== -1 ? args[containsIndex + 1] : '';
  const exact = exactIndex !== -1 ? args[exactIndex + 1] : '';
  const wantedIndex = indexIndex !== -1 ? Number.parseInt(args[indexIndex + 1], 10) : NaN;

  const { controller, secret } = readClashConfig();
  const global = await request(controller, secret, 'GET', '/proxies/GLOBAL');

  let target = '';
  if (!Number.isNaN(wantedIndex) && global.all[wantedIndex]) {
    target = global.all[wantedIndex];
  } else if (exact) {
    target = global.all.find((name) => name === exact) || '';
  } else if (contains) {
    target = global.all.find((name) => name.includes(contains)) || '';
  }

  if (!target) {
    throw new Error('Target proxy not found');
  }

  await request(controller, secret, 'PUT', '/proxies/GLOBAL', { name: target });
  const updated = await request(controller, secret, 'GET', '/proxies/GLOBAL');
  process.stdout.write(`${updated.now}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
