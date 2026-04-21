import { readSharedToken, readSharedUser } from './authStorage';

type SharedUser = {
  id?: string | number;
  userId?: string | number;
  username?: string;
  account?: string;
  phone?: string;
  role?: string;
  type?: string;
  userType?: string;
  isAdmin?: boolean | number;
  is_admin?: boolean | number;
};

const ADMIN_ROLES = new Set(['admin', 'rootadmin', 'super_admin']);

function normalizeSegment(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\-.]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'guest';
}

export function getCurrentUserIdentity(): SharedUser | null {
  return readSharedUser<SharedUser>();
}

export function getCurrentUserRole(): string {
  const user = getCurrentUserIdentity();
  if (user?.isAdmin || user?.is_admin) {
    return 'admin';
  }
  return String(user?.role ?? user?.type ?? user?.userType ?? 'normal').trim() || 'normal';
}

export function isCurrentUserAdmin(): boolean {
  return ADMIN_ROLES.has(getCurrentUserRole().toLowerCase());
}

export function getCurrentUserScopeId(): string {
  const user = getCurrentUserIdentity();
  const rawId =
    user?.userId ??
    user?.id ??
    user?.username ??
    user?.account ??
    user?.phone ??
    'guest';

  return normalizeSegment(String(rawId));
}

export function getUserScopedStorageKey(baseKey: string): string {
  return `user:${getCurrentUserScopeId()}:${baseKey}`;
}

export function readScopedStorageValue(baseKey: string, fallbackKeys: string[] = []): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const scopedKey = getUserScopedStorageKey(baseKey);
  const scopedValue = window.localStorage.getItem(scopedKey);
  if (scopedValue !== null) {
    return scopedValue;
  }

  for (const key of [baseKey, ...fallbackKeys]) {
    const legacyValue = window.localStorage.getItem(key);
    if (legacyValue !== null) {
      window.localStorage.setItem(scopedKey, legacyValue);
      return legacyValue;
    }
  }

  return null;
}

export function writeScopedStorageValue(baseKey: string, value: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(getUserScopedStorageKey(baseKey), value);
}

export function removeScopedStorageValue(baseKey: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(getUserScopedStorageKey(baseKey));
}

export function buildUserScopedPath(path: string): string {
  const cleaned = path.replace(/^[\\/]+/, '');
  return `users/${getCurrentUserScopeId()}/${cleaned}`;
}

export function buildUserScopedSessionPath(charId: string, modId: string): string {
  return buildUserScopedPath(`${charId}/${modId}`);
}

export function buildScopedAuthHeaders(extraHeaders: HeadersInit = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Config-Scope': getCurrentUserScopeId(),
  };

  const token = readSharedToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (extraHeaders instanceof Headers) {
    extraHeaders.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }

  if (Array.isArray(extraHeaders)) {
    for (const [key, value] of extraHeaders) {
      headers[key] = value;
    }
    return headers;
  }

  return {
    ...headers,
    ...(extraHeaders as Record<string, string>),
  };
}
