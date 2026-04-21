const SHARED_AUTH_KEYS = {
  token: ['token', 'fhwh_token'],
  refreshToken: ['refreshToken', 'fhwh_refresh_token'],
  user: ['user', 'fhwh_user'],
} as const;

function readFirstValue(keys: readonly string[]) {
  if (typeof window === 'undefined') {
    return null;
  }

  for (const key of keys) {
    const value = window.localStorage.getItem(key);
    if (value) {
      return value;
    }
  }

  return null;
}

function writeAll(keys: readonly string[], value: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  for (const key of keys) {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  }
}

function safeParseJson<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function readSharedToken() {
  return readFirstValue(SHARED_AUTH_KEYS.token);
}

export function readSharedRefreshToken() {
  return readFirstValue(SHARED_AUTH_KEYS.refreshToken);
}

export function readSharedUser<T = any>() {
  return safeParseJson<T>(readFirstValue(SHARED_AUTH_KEYS.user));
}

export function writeSharedAuth(options: {
  token?: string | null;
  refreshToken?: string | null;
  user?: any | null;
}) {
  if (Object.prototype.hasOwnProperty.call(options, 'token')) {
    writeAll(SHARED_AUTH_KEYS.token, options.token ?? null);
  }

  if (Object.prototype.hasOwnProperty.call(options, 'refreshToken')) {
    writeAll(SHARED_AUTH_KEYS.refreshToken, options.refreshToken ?? null);
  }

  if (Object.prototype.hasOwnProperty.call(options, 'user')) {
    writeAll(SHARED_AUTH_KEYS.user, options.user == null ? null : JSON.stringify(options.user));
  }
}

export function clearSharedAuth() {
  writeAll(SHARED_AUTH_KEYS.token, null);
  writeAll(SHARED_AUTH_KEYS.refreshToken, null);
  writeAll(SHARED_AUTH_KEYS.user, null);
}
