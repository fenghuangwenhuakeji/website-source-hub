#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clientDesktopDir = path.join(repoRoot, 'apps', 'client-desktop');
const baseConfigPath = path.join(clientDesktopDir, 'electron-builder.json');
const longbookConfigPath = path.join(clientDesktopDir, '.electron-builder.longbook.json');
const target = (process.env.LONGBOOK_DESKTOP_TARGET || process.argv[2] || 'current').toLowerCase();
const targetKey = target === 'windows' || target === 'exe' ? 'win' : target === 'darwin' || target === 'dmg' ? 'mac' : target;
const releaseDirName = `release-longbook-${targetKey}`;
const releaseDir = path.join(clientDesktopDir, releaseDirName);
const version = process.env.LONGBOOK_DESKTOP_VERSION || '1.0.5';

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options,
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
  });
}

function buildArgs() {
  if (target === 'win' || target === 'windows' || target === 'exe') {
    return ['--win'];
  }
  if (target === 'mac' || target === 'darwin' || target === 'dmg') {
    return ['--mac', '--universal'];
  }
  if (target === 'all') {
    return ['--mac', '--universal', '--win'];
  }
  return process.platform === 'darwin' ? ['--mac', '--universal'] : ['--win'];
}

if (process.env.LONGBOOK_DESKTOP_SKIP_WEB_BUILD !== '1') {
  await run('npm', ['--prefix', 'apps/client-web', 'run', 'build']);
}
await run('npm', ['--prefix', 'apps/client-desktop', 'run', 'prepare:dist']);
await rm(releaseDir, { recursive: true, force: true });
await mkdir(releaseDir, { recursive: true });

const config = JSON.parse(await readFile(baseConfigPath, 'utf8'));
config.productName = '凤煌长篇创作';
config.appId = 'com.fenghuang.longbook';
config.directories = {
  ...(config.directories || {}),
  output: releaseDirName,
};
config.protocols = [
  {
    name: 'Fenghuang Longbook',
    schemes: ['fenghuang-longbook'],
  },
];
config.extraMetadata = {
  version,
  fenghuangDesktop: {
    appName: '凤煌长篇创作',
    appId: 'com.fenghuang.longbook',
    protocol: 'fenghuang-longbook',
    defaultEntryPath: '/apps/longbook/index.html',
  },
};
config.mac = {
  ...(config.mac || {}),
  artifactName: '${productName}-${version}-${arch}.${ext}',
};
config.nsis = {
  ...(config.nsis || {}),
  shortcutName: '凤煌长篇创作',
  uninstallDisplayName: '卸载凤煌长篇创作',
};
config.portable = {
  ...(config.portable || {}),
  artifactName: '${productName}-${version}-Portable.exe',
};

await writeFile(longbookConfigPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

try {
  await run(
    'npx',
    ['electron-builder', '--config', longbookConfigPath, ...buildArgs()],
    { cwd: clientDesktopDir },
  );
} finally {
  await rm(longbookConfigPath, { force: true });
}

console.log(`longbook_desktop_release=${releaseDir}`);
