import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');
const releaseDir = path.join(packageRoot, 'release');

const buildCommand =
  process.platform === 'win32'
    ? {
        file: process.env.ComSpec || 'cmd.exe',
        args: ['/d', '/s', '/c', 'npm run build:win'],
      }
    : {
        file: 'npm',
        args: ['run', 'build:win'],
      };

const runBuild = () =>
  spawnSync(buildCommand.file, buildCommand.args, {
    cwd: packageRoot,
    env: {
      ...process.env,
      LOCAL_ACCEPTANCE_MODE: '1',
    },
    stdio: 'inherit',
  });

const cleanReleaseDir = () => {
  try {
    fs.rmSync(releaseDir, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Unable to fully clean ${releaseDir}:`, error);
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const attemptCount = process.platform === 'win32' ? 2 : 1;

console.log('Building 凤煌 desktop in LOCAL_ACCEPTANCE_MODE=1');

let result;

for (let attempt = 1; attempt <= attemptCount; attempt += 1) {
  cleanReleaseDir();

  if (attempt > 1) {
    console.warn(`Retrying desktop packaging (${attempt}/${attemptCount}) after cleaning release output...`);
  }

  result = runBuild();

  if (result.status === 0) {
    process.exit(0);
  }

  if (attempt < attemptCount) {
    await sleep(3000);
  }
}

if (result.error) {
  console.error(result.error);
}

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
