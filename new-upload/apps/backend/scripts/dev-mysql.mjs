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
  DB_ADAPTER: 'mysql',
  DB_HOST: process.env.DB_HOST || '127.0.0.1',
  DB_PORT: process.env.DB_PORT || '3306',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'chaowuqiong_db',
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
