import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');

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

console.log('Building 凤煌 desktop in LOCAL_ACCEPTANCE_MODE=1');

const result = spawnSync(buildCommand.file, buildCommand.args, {
  cwd: packageRoot,
  env: {
    ...process.env,
    LOCAL_ACCEPTANCE_MODE: '1',
  },
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error);
}

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
