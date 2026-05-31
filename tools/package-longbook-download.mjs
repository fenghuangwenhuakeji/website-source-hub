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
const stagingDir = path.join(buildDir, 'longbook');
const outputZip = path.resolve(process.env.LONGBOOK_OUTPUT || path.join(buildDir, 'longbook-current.zip'));

const readmeText = `长篇创作项目包启动说明

推荐方式：
1. 解压整个 ZIP 包。
2. 双击 index.html 打开长篇创作。
3. 首次使用时按页面提示登录官网账号，或先进入免费体验。

如果浏览器限制本地存储、导入文件或部分功能异常，请使用本地服务启动：
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

const macStarter = `#!/bin/sh
cd "$(dirname "$0")" || exit 1
PORT="\${PORT:-8766}"

if command -v python3 >/dev/null 2>&1; then
  PYTHON=python3
elif command -v python >/dev/null 2>&1; then
  PYTHON=python
else
  echo "未找到 Python。请直接双击 index.html 打开，或先安装 Python 3。"
  read -r _
  exit 1
fi

open "http://127.0.0.1:\${PORT}/" >/dev/null 2>&1 &
echo "长篇创作已启动： http://127.0.0.1:\${PORT}/"
echo "关闭这个窗口即可停止本地服务。"
"\$PYTHON" -m http.server "\$PORT" --bind 127.0.0.1
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

echo 未找到 Python。请直接双击 index.html 打开，或先安装 Python 3。
pause
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
    return parts[0] !== 'backups' && rel !== 'fenghuang_license_v3.zip';
  },
});

await writeFile(path.join(stagingDir, 'README-START.txt'), readmeText);
await writeFile(path.join(stagingDir, 'start-mac.command'), macStarter);
await writeFile(path.join(stagingDir, 'start-windows.bat'), windowsStarter);
await chmod(path.join(stagingDir, 'start-mac.command'), 0o755);

await run('zip', ['-qr', outputZip, '.'], { cwd: stagingDir });

const digest = await sha256(outputZip);
console.log(`longbook_zip=${outputZip}`);
console.log(`sha256=${digest}`);
