const { spawn, spawnSync } = require('child_process');
const fs = require('fs');

const server = process.env.SSH_SERVER || 'root@115.190.158.182';
const proxyHost = process.env.SSH_PROXY_HOST || '127.0.0.1';
const proxyPort = process.env.SSH_PROXY_PORT || '7890';
const proxyScript = 'C:\\Users\\8\\.codex\\bin\\ssh-http-proxy.js';
const commandText = process.env.SSH_COMMANDS || 'hostname\nexit\n';

const preferredKeys = [
  'C:\\Users\\8\\.codex\\bin\\fenghuangwenhua.pem',
  'D:\\网站部署\\fenghuangwenhua.pem',
  'C:\\Users\\8\\.codex\\bin\\id_rsa_chaowuqiong',
  'D:\\网站部署\\id_rsa_chaowuqiong',
];

const keyPath = preferredKeys.find((candidate) => fs.existsSync(candidate));
if (!keyPath) {
  console.error('No SSH key found.');
  process.exit(1);
}

const args = [
  '-tt',
  '-o',
  `ProxyCommand=node "${proxyScript}" %h %p`,
  '-o',
  'StrictHostKeyChecking=no',
  '-o',
  'ServerAliveInterval=30',
  '-o',
  'ServerAliveCountMax=3',
  '-i',
  keyPath,
  server,
];

console.log(`Connecting to ${server} via HTTP proxy ${proxyHost}:${proxyPort} ...`);
console.log(`Using key: ${keyPath}`);

const child = spawn('ssh', args, {
  env: {
    ...process.env,
    SSH_PROXY_HOST: proxyHost,
    SSH_PROXY_PORT: proxyPort,
  },
  stdio: ['pipe', 'pipe', 'pipe'],
});

child.stdout.on('data', (chunk) => process.stdout.write(chunk));
child.stderr.on('data', (chunk) => process.stderr.write(chunk));
child.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});
child.on('close', (code) => process.exit(code ?? 0));

setTimeout(() => {
  child.stdin.write(commandText);
  child.stdin.end();
}, 800);
