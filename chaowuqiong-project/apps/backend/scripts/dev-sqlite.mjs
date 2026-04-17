import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const env = {
  ...process.env,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_ADAPTER: process.env.DB_ADAPTER || 'sqlite',
  DB_SQLITE_PATH: process.env.DB_SQLITE_PATH || './data/local-dev.sqlite',
};

const tsxPackageRoot = path.dirname(require.resolve('tsx/package.json'));
const tsxCli = path.join(tsxPackageRoot, 'dist', 'cli.mjs');
const child = spawn(process.execPath, [tsxCli, 'watch', 'src/app.ts'], {
  cwd: projectRoot,
  env,
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
