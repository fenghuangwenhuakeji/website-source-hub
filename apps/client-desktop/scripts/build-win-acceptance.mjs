import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

console.log('Building 凤煌 desktop in LOCAL_ACCEPTANCE_MODE=1');

const result = spawnSync(npmCommand, ['run', 'build:win'], {
  cwd: packageRoot,
  env: {
    ...process.env,
    LOCAL_ACCEPTANCE_MODE: '1',
  },
  stdio: 'inherit',
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
