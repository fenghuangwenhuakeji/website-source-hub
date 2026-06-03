#!/usr/bin/env node
import { mkdir, rm, cp, writeFile, chmod } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultSource = path.resolve(repoRoot, '..', '长篇');
const sourceDir = path.resolve(process.env.LONGBOOK_SOURCE_DIR || defaultSource);
const buildDir = path.resolve(process.env.LONGBOOK_BUILD_DIR || path.join(repoRoot, '.tmp', 'longbook-download'));
const packageDirName = process.env.LONGBOOK_PACKAGE_DIR || 'fenghuang-longbook';
const stagingRoot = path.join(buildDir, 'staging');
const stagingDir = path.join(stagingRoot, packageDirName);
const outputZip = path.resolve(process.env.LONGBOOK_OUTPUT || path.join(buildDir, 'longbook-current.zip'));
const excludedNames = new Set([
  '.DS_Store',
  '.git',
  '.tmp',
  'backups',
  '(1)',
  '(2)',
  'node_modules',
  'target',
]);
const excludedFiles = new Set([
  'fenghuang_license_v3.zip',
]);

const readmeText = `长篇创作项目包启动说明

推荐方式：
1. 解压整个 ZIP 包。
2. 进入 fenghuang-longbook 文件夹。
3. macOS 用户双击：点我启动-mac.command
4. Windows 用户双击：点我启动-windows.bat

快速方式：
- 双击 点我打开.html 或 index.html 也可以直接打开。
- 如果浏览器限制本地存储、导入文件、官网登录或部分功能异常，请改用上面的本地服务启动脚本。

本地服务启动脚本：
- macOS：双击 start-mac.command
- Windows：双击 start-windows.bat

启动脚本只会在当前文件夹开一个本地网页服务，然后用浏览器打开：
http://127.0.0.1:8766/

重要说明：
- 这是长篇项目本体，不是凤煌桌面客户端。
- 项目会优先把创作数据保存在浏览器本地存储或你选择的本地目录中。
- API Key、章节、设定和草稿请自行妥善保存。
- 官网账号、充值和授权需要联网访问 fhwhkj.top。
`;

const launcherHtml = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0; url=index.html">
  <title>打开凤煌长篇创作</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f6f1e8; color: #171412; }
    main { width: min(560px, calc(100vw - 32px)); border: 1px solid #ded3c4; border-radius: 18px; background: #fffaf2; padding: 28px; box-shadow: 0 20px 60px rgba(48, 35, 20, 0.14); }
    h1 { margin: 0 0 12px; font-size: 26px; }
    p { margin: 8px 0; line-height: 1.8; color: #5a5146; }
    a { display: inline-flex; margin-top: 16px; padding: 11px 18px; border-radius: 999px; background: #171412; color: #fff; text-decoration: none; font-weight: 700; }
  </style>
</head>
<body>
  <main>
    <h1>正在打开凤煌长篇创作</h1>
    <p>如果没有自动跳转，请点击下面的按钮。</p>
    <p>若官网登录、文件导入或本地保存异常，请关闭本页，双击 start-mac.command 或 start-windows.bat 启动。</p>
    <a href="index.html">打开长篇创作</a>
  </main>
  <script>location.replace('index.html');</script>
</body>
</html>
`;

const macStarter = `#!/bin/sh
cd "$(dirname "$0")" || exit 1
PORT="\${PORT:-8766}"

echo "长篇创作已启动： http://127.0.0.1:\${PORT}/"
echo "关闭这个窗口即可停止本地服务。"
open "http://127.0.0.1:\${PORT}/" >/dev/null 2>&1 &

if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server "\$PORT" --bind 127.0.0.1
elif command -v python >/dev/null 2>&1; then
  python -m http.server "\$PORT" --bind 127.0.0.1
elif command -v ruby >/dev/null 2>&1; then
  ruby -run -e httpd . -p "\$PORT" -b 127.0.0.1
elif command -v php >/dev/null 2>&1; then
  php -S "127.0.0.1:\${PORT}"
else
  echo "未找到可用的本地服务运行环境。现在改为直接打开 index.html。"
  open "index.html" >/dev/null 2>&1
  echo "按回车关闭窗口。"
  read -r _
fi
`;

const windowsStarter = `@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PORT=8766

where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://127.0.0.1:%PORT%/"
  echo 长篇创作已启动：http://127.0.0.1:%PORT%/
  echo 关闭这个窗口即可停止本地服务。
  py -3 -m http.server %PORT% --bind 127.0.0.1
  goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
  start "" "http://127.0.0.1:%PORT%/"
  echo 长篇创作已启动：http://127.0.0.1:%PORT%/
  echo 关闭这个窗口即可停止本地服务。
  python -m http.server %PORT% --bind 127.0.0.1
  goto :eof
)

where powershell >nul 2>nul
if %errorlevel%==0 (
  start "" "http://127.0.0.1:%PORT%/"
  echo 长篇创作已启动：http://127.0.0.1:%PORT%/
  echo 关闭这个窗口即可停止本地服务。
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-windows.ps1" -Port %PORT%
  goto :eof
)

echo 未找到 Python 或 PowerShell。现在改为直接打开 index.html。
start "" "%~dp0index.html"
pause
`;

const windowsPowershellStarter = `param(
  [int]$Port = 8766
)

$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$listener = [System.Net.HttpListener]::new()
$prefix = "http://127.0.0.1:$Port/"
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "长篇创作已启动：$prefix"
Write-Host "关闭这个窗口即可停止本地服务。"

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".htm" = "text/html; charset=utf-8"
  ".js" = "application/javascript; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png" = "image/png"
  ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".gif" = "image/gif"
  ".svg" = "image/svg+xml"
  ".woff" = "font/woff"
  ".woff2" = "font/woff2"
  ".ttf" = "font/ttf"
  ".txt" = "text/plain; charset=utf-8"
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $requestPath = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/'))
    if ([string]::IsNullOrWhiteSpace($requestPath)) { $requestPath = 'index.html' }
    $requestPath = $requestPath -replace '/', [System.IO.Path]::DirectorySeparatorChar
    $fullPath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($root, $requestPath))
    if (-not $fullPath.StartsWith($root)) {
      $context.Response.StatusCode = 403
      $context.Response.Close()
      continue
    }
    if ([System.IO.Directory]::Exists($fullPath)) {
      $fullPath = [System.IO.Path]::Combine($fullPath, 'index.html')
    }
    if (-not [System.IO.File]::Exists($fullPath)) {
      $context.Response.StatusCode = 404
      $context.Response.Close()
      continue
    }
    $bytes = [System.IO.File]::ReadAllBytes($fullPath)
    $ext = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
    $context.Response.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
    $context.Response.ContentLength64 = $bytes.Length
    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $context.Response.Close()
  }
} finally {
  $listener.Stop()
}
`;

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with ${code}`));
      }
    });
  });
}

async function sha256(filePath) {
  const hash = createHash('sha256');
  await new Promise((resolve, reject) => {
    createReadStream(filePath)
      .on('data', (chunk) => hash.update(chunk))
      .on('error', reject)
      .on('end', resolve);
  });
  return hash.digest('hex');
}

await rm(buildDir, { recursive: true, force: true });
await mkdir(stagingDir, { recursive: true });
await cp(sourceDir, stagingDir, {
  recursive: true,
  filter(src) {
    const rel = path.relative(sourceDir, src);
    if (!rel) return true;
    const parts = rel.split(path.sep);
    if (parts.some((part) => excludedNames.has(part))) return false;
    if (excludedFiles.has(rel)) return false;
    return true;
  },
});

await writeFile(path.join(stagingDir, '点我打开.html'), launcherHtml);
await writeFile(path.join(stagingDir, 'README-START.txt'), readmeText);
await writeFile(path.join(stagingDir, 'start-mac.command'), macStarter);
await writeFile(path.join(stagingDir, 'start-windows.bat'), windowsStarter);
await writeFile(path.join(stagingDir, 'start-windows.ps1'), windowsPowershellStarter);
await cp(path.join(stagingDir, 'start-mac.command'), path.join(stagingDir, '点我启动-mac.command'));
await cp(path.join(stagingDir, 'start-windows.bat'), path.join(stagingDir, '点我启动-windows.bat'));
await chmod(path.join(stagingDir, 'start-mac.command'), 0o755);
await chmod(path.join(stagingDir, '点我启动-mac.command'), 0o755);

await run('zip', ['-qr', outputZip, packageDirName], { cwd: stagingRoot });

const digest = await sha256(outputZip);
console.log(`longbook_zip=${outputZip}`);
console.log(`sha256=${digest}`);
