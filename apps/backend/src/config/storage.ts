import fs from 'node:fs';
import path from 'node:path';
import { config } from './index.js';

function resolveAppPath(input: string): string {
  if (input === ':memory:') {
    return input;
  }

  return path.isAbsolute(input) ? input : path.resolve(process.cwd(), input);
}

function ensureDirectory(input: string): string {
  if (input !== ':memory:') {
    fs.mkdirSync(input, { recursive: true });
  }
  return input;
}

function getDefaultDataRoot(): string {
  if (config.database.sqlitePath === ':memory:') {
    return resolveAppPath('./data');
  }

  return path.dirname(resolveAppPath(config.database.sqlitePath));
}

const dataRoot = ensureDirectory(resolveAppPath(process.env.DATA_ROOT || getDefaultDataRoot()));
const storageRoot = ensureDirectory(
  resolveAppPath(process.env.STORAGE_ROOT || path.join(dataRoot, 'storage'))
);
const cacheRoot = ensureDirectory(
  resolveAppPath(process.env.CACHE_ROOT || path.join(dataRoot, 'cache'))
);

export const storage = {
  dataRoot,
  storageRoot,
  cacheRoot,
  sessionDir: ensureDirectory(
    resolveAppPath(process.env.SESSION_DIR || path.join(storageRoot, 'sessions'))
  ),
  userFilesRoot: ensureDirectory(
    resolveAppPath(process.env.USER_FILES_ROOT || path.join(storageRoot, 'user-files'))
  ),
  userImportsRoot: ensureDirectory(
    resolveAppPath(
      process.env.USER_IMPORTS_ROOT || path.join(storageRoot, 'user-files', 'imports')
    )
  ),
  userUploadsRoot: ensureDirectory(
    resolveAppPath(
      process.env.USER_UPLOADS_ROOT || path.join(storageRoot, 'user-files', 'uploads')
    )
  ),
  novelMirrorRoot: ensureDirectory(
    resolveAppPath(process.env.NOVEL_MIRROR_ROOT || path.join(storageRoot, 'novel-mirror'))
  ),
  migrationRoot: ensureDirectory(
    resolveAppPath(process.env.DATA_MIGRATION_ROOT || path.join(dataRoot, 'migrations'))
  ),
} as const;

export function resolveInsideRoot(root: string, requestedPath: string): string {
  const normalizedRoot = path.resolve(root);
  const relativePath = requestedPath.replace(/^[\\/]+/, '');
  const resolvedPath = path.resolve(normalizedRoot, relativePath);

  if (resolvedPath !== normalizedRoot && !resolvedPath.startsWith(`${normalizedRoot}${path.sep}`)) {
    throw new Error('Requested path escapes storage root');
  }

  return resolvedPath;
}
