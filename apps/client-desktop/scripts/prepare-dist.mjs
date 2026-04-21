import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');
const sourceDist = path.resolve(packageRoot, '..', 'client-web', 'dist');
const targetDist = path.resolve(packageRoot, 'dist');
const sourceIndex = path.join(sourceDist, 'index.html');

if (!existsSync(sourceIndex)) {
  throw new Error(
    `Missing client-web build output at ${sourceIndex}. Run "npm run build:client-web" from the repository root first.`,
  );
}

rmSync(targetDist, { recursive: true, force: true });
mkdirSync(targetDist, { recursive: true });
cpSync(sourceDist, targetDist, { recursive: true });

console.log(`Prepared desktop bundle from ${sourceDist}`);
