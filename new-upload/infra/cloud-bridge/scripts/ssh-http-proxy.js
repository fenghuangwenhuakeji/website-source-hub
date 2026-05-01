#!/usr/bin/env node

const net = require('net');

const [, , host, portArg] = process.argv;
const proxyHost = process.env.SSH_PROXY_HOST || '127.0.0.1';
const proxyPort = Number.parseInt(process.env.SSH_PROXY_PORT || '7890', 10);

if (!host || !portArg || Number.isNaN(proxyPort)) {
  console.error('Usage: node ssh-http-proxy.js <host> <port>');
  process.exit(1);
}

const target = `${host}:${portArg}`;
const socket = net.createConnection({
  host: proxyHost,
  port: proxyPort,
});

let connected = false;
let headerBuffer = Buffer.alloc(0);

function fail(message) {
  console.error(`[ssh-http-proxy] ${message}`);
  process.exit(1);
}

socket.setNoDelay(true);

socket.on('connect', () => {
  const request =
    `CONNECT ${target} HTTP/1.1\r\n` +
    `Host: ${target}\r\n` +
    'Proxy-Connection: Keep-Alive\r\n' +
    '\r\n';

  socket.write(request);
});

socket.on('data', (chunk) => {
  if (connected) {
    process.stdout.write(chunk);
    return;
  }

  headerBuffer = Buffer.concat([headerBuffer, chunk]);
  const headerEnd = headerBuffer.indexOf('\r\n\r\n');

  if (headerEnd === -1) {
    if (headerBuffer.length > 32 * 1024) {
      fail('Proxy response header too large');
    }
    return;
  }

  const headerText = headerBuffer.subarray(0, headerEnd).toString('latin1');
  const firstLine = headerText.split('\r\n')[0] || '';

  if (!/^HTTP\/1\.[01] 200\b/i.test(firstLine)) {
    fail(`CONNECT failed: ${firstLine}`);
  }

  connected = true;
  const remaining = headerBuffer.subarray(headerEnd + 4);

  if (remaining.length > 0) {
    process.stdout.write(remaining);
  }

  process.stdin.resume();
  process.stdin.pipe(socket);
});

socket.on('error', (error) => {
  fail(error.message);
});

socket.on('close', () => {
  process.exit(0);
});

process.stdin.pause();
process.stdin.on('error', () => {});
process.stdout.on('error', () => {});
