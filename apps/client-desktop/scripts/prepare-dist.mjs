import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');
const sourceDist = path.resolve(packageRoot, '..', 'client-web', 'dist');
const targetDist = path.resolve(packageRoot, 'dist');
const sourceIndex = path.join(sourceDist, 'index.html');
const acceptanceModeEnabled = process.env.LOCAL_ACCEPTANCE_MODE === '1';

const REQUIRED_DIST_FILES = [
  ['apps/fenghuang/index.html', '凤煌创作入口'],
  ['desktop-bundles/agent-creator/index.html', 'Agent Creator'],
  ['desktop-bundles/code-editor/index.html', '代码编辑器桌面工作台'],
  ['desktop-bundles/short-book-lab/index.html', '短篇拆书版'],
  ['desktop-bundles/html-vault/index.html', 'HTML Vault'],
  ['desktop-bundles/html-vault/app.js', 'HTML Vault 项目清单'],
  ['desktop-bundles/html-vault/apps/tavern-game/index.html', 'HTML Vault / tavern-game'],
];

const REQUIRED_FENGHUANG_DIRS = [
  '5.50完全体',
  '丐版短篇',
  '丐版中长篇',
  '卡牌引擎',
  '循环细纲版',
  '第四种融合思路',
  '网页promax',
];

function assertRequiredEntry(relativePath, label) {
  const fullPath = path.join(sourceDist, relativePath);
  if (!existsSync(fullPath)) {
    throw new Error(`Missing required desktop source asset "${label}" at ${fullPath}`);
  }
}

if (!existsSync(sourceIndex)) {
  throw new Error(
    `Missing client-web build output at ${sourceIndex}. Run "npm run build:client-web" from the repository root first.`,
  );
}

for (const [relativePath, label] of REQUIRED_DIST_FILES) {
  assertRequiredEntry(relativePath, label);
}

for (const dirName of REQUIRED_FENGHUANG_DIRS) {
  assertRequiredEntry(path.join('apps', 'fenghuang', dirName), `凤煌创作套件 / ${dirName}`);
}

rmSync(targetDist, { recursive: true, force: true });
mkdirSync(targetDist, { recursive: true });
cpSync(sourceDist, targetDist, { recursive: true });

if (acceptanceModeEnabled) {
  writeFileSync(
    path.join(targetDist, '.acceptance-mode.json'),
    JSON.stringify(
      {
        enabled: true,
        source: 'LOCAL_ACCEPTANCE_MODE',
        desktopSurface: {
          requiredBundles: REQUIRED_DIST_FILES.map(([relativePath]) => relativePath),
          requiredFenghuangDirs: REQUIRED_FENGHUANG_DIRS,
        },
      },
      null,
      2,
    ),
    'utf8',
  );
}

console.log(
  `Prepared desktop bundle from ${sourceDist}${acceptanceModeEnabled ? ' (LOCAL_ACCEPTANCE_MODE=1)' : ''}`,
);
