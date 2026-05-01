/**
 * Disk-based File Storage
 * Drop-in replacement for indexedDbStorage — all operations go through
 * the session-data API (Vite dev server middleware) which persists to
 * ~/.openroom/sessions/{charId}/{modId}/apps/...
 */

import { getSessionPath } from './sessionPath';

const API_PATH = '/api/session-data';
let warnedEmptySession = false;
export type StorageScope = 'session-apps' | 'desktop-global' | 'direct';

const isDiskStorageDebugEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage?.getItem('diskStorageDebug') === '1';
  } catch {
    return false;
  }
};

function resolveScopedPath(filePath: string, scope: StorageScope): string {
  const session = getSessionPath();
  const cleaned = filePath.startsWith('/') ? filePath.slice(1) : filePath;

  if (scope === 'direct') {
    return cleaned;
  }

  if (scope === 'desktop-global') {
    return cleaned.startsWith('desktop-runtime/')
      ? cleaned
      : `desktop-runtime/${cleaned}`;
  }

  const alreadyPrefixed = cleaned.startsWith('apps/') || cleaned === 'apps';
  if (!session && scope === 'session-apps' && !warnedEmptySession && typeof window !== 'undefined') {
    if (isDiskStorageDebugEnabled()) {
      console.debug('[diskStorage] sessionPath is empty; using fallback apps/ path', { filePath, scope });
    }
    warnedEmptySession = true;
  }
  return session
    ? alreadyPrefixed
      ? `${session}/${cleaned}`
      : `${session}/apps/${cleaned}`
    : alreadyPrefixed
      ? cleaned
      : `apps/${cleaned}`;
}

/** Build the full API URL for a file path, scoped under the selected storage namespace */
function apiUrl(filePath: string, action?: string, scope: StorageScope = 'session-apps'): string {
  const fullPath = resolveScopedPath(filePath, scope);
  let url = `${API_PATH}?path=${encodeURIComponent(fullPath)}`;
  if (action) url += `&action=${encodeURIComponent(action)}`;
  return url;
}

async function ensureOk(
  response: Response,
  operation: string,
  filePath: string,
): Promise<void> {
  if (response.ok) return;

  const detail = await response.text().catch(() => '');
  throw new Error(
    `[diskStorage] ${operation} failed for ${filePath}: ${response.status}${detail ? ` ${detail}` : ''}`,
  );
}

/**
 * List files in a directory.
 * Returns { files: [{ path, type, size }], not_exists: boolean }
 */
export async function listFiles(dirPath: string): Promise<{
  files: Array<{ path: string; type: number; size?: number }>;
  not_exists: boolean;
}> {
  try {
    const res = await fetch(apiUrl(dirPath, 'list'));
    if (res.ok) {
      return await res.json();
    }
    return { files: [], not_exists: true };
  } catch (e) {
    console.warn('[diskStorage] listFiles failed:', e);
    return { files: [], not_exists: true };
  }
}

/**
 * Read a file. Returns parsed JSON (if JSON file) or string content, or null if not found.
 */
export async function getFile(filePath: string): Promise<unknown> {
  return getScopedFile(filePath, 'session-apps');
}

export async function getScopedFile(
  filePath: string,
  scope: StorageScope,
): Promise<unknown> {
  try {
    const res = await fetch(apiUrl(filePath, undefined, scope));
    if (!res.ok) return null;
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (e) {
    console.warn('[diskStorage] getFile failed:', e);
    return null;
  }
}

/**
 * Write files. Compatible with the old putTextFilesByJSON signature.
 * files: [{ path: "directory", name: "filename", content: "..." }]
 */
export async function putTextFilesByJSON(data: {
  files: Array<{ path?: string; name?: string; content?: string }>;
}): Promise<void> {
  return putScopedTextFilesByJSON(data, 'session-apps');
}

export async function putScopedTextFilesByJSON(
  data: {
    files: Array<{ path?: string; name?: string; content?: string }>;
  },
  scope: StorageScope,
): Promise<void> {
  const promises = data.files.map(async (file) => {
    const fullPath = file.path ? `${file.path}/${file.name}` : file.name || '';
    if (!fullPath) return;
    const response = await fetch(apiUrl(fullPath, undefined, scope), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: file.content || '',
    });
    await ensureOk(response, 'write', fullPath);
  });
  await Promise.all(promises);
}

/**
 * Delete files by paths.
 */
/**
 * Write a binary file (e.g. image) from base64 data.
 */
export async function putBinaryFile(
  filePath: string,
  base64: string,
  mimeType: string,
): Promise<void> {
  return putScopedBinaryFile(filePath, base64, mimeType, 'session-apps');
}

export async function putScopedBinaryFile(
  filePath: string,
  base64: string,
  mimeType: string,
  scope: StorageScope,
): Promise<void> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const response = await fetch(apiUrl(filePath, undefined, scope), {
    method: 'POST',
    headers: { 'Content-Type': mimeType },
    body: bytes,
  });
  await ensureOk(response, 'write', filePath);
}

export async function deleteFilesByPaths(data: { file_paths: string[] }): Promise<void> {
  return deleteScopedFilesByPaths(data, 'session-apps');
}

export async function deleteScopedFilesByPaths(
  data: { file_paths: string[] },
  scope: StorageScope,
): Promise<void> {
  const promises = data.file_paths.map(async (filePath) => {
    const response = await fetch(apiUrl(filePath, undefined, scope), { method: 'DELETE' });
    await ensureOk(response, 'delete', filePath);
  });
  await Promise.all(promises);
}

/**
 * Search files by query string (filename match).
 */
export async function searchFiles(data: { query: string }): Promise<unknown[]> {
  // Search by listing root recursively and filtering — simplified to root listing + filter
  try {
    const result = await listFiles('/');
    const q = data.query.toLowerCase();
    return result.files
      .filter((f) => f.path.toLowerCase().includes(q))
      .map((f) => ({
        id: '',
        name: f.path.split('/').pop() || '',
        path: '/' + f.path,
        type: f.type === 1 ? 'directory' : 'file',
        parentId: null,
        metadata: { size: f.size || 0 },
      }));
  } catch (e) {
    console.warn('[diskStorage] searchFiles failed:', e);
    return [];
  }
}
