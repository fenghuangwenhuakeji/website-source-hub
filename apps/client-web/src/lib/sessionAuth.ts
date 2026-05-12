import {
  clearSharedAuth,
  readSharedRefreshToken,
  readSharedToken,
  writeSharedAuth,
} from './authStorage';

const API_BASE = '/api';

const AUTH_FAILURE_PATTERNS = [
  'unauthorized',
  'session expired',
  'invalid login token',
  'please log in',
  'refresh token is invalid',
  'refresh token is required',
] as const;

type RefreshAttemptResult = {
  token: string | null;
  refreshToken: string | null;
  invalid: boolean;
};

let refreshPromise: Promise<string | null> | null = null;
let desktopVersionPromise: Promise<string | null> | null = null;

function getFailureMessage(payload: any): string {
  if (!payload) {
    return '';
  }

  if (typeof payload === 'string') {
    return payload;
  }

  return String(payload.message || payload.error || '');
}

export function isAuthFailureMessage(message?: string | null): boolean {
  if (!message) {
    return false;
  }

  const normalized = message.toLowerCase();
  return AUTH_FAILURE_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export function hasStoredSession(): boolean {
  return Boolean(readSharedToken() || readSharedRefreshToken());
}

async function buildClientHeaders(): Promise<Record<string, string>> {
  if (typeof window === 'undefined' || !window.electronAPI) {
    return {
      'X-Client-Type': 'web',
    };
  }

  if (!desktopVersionPromise) {
    desktopVersionPromise = Promise.resolve(window.electronAPI.getAppVersion?.())
      .then((version) => (version ? String(version) : null))
      .catch(() => null);
  }

  const appVersion = await desktopVersionPromise;
  return {
    'X-Client-Type': 'desktop',
    ...(appVersion ? { 'X-App-Version': appVersion } : {}),
  };
}

async function requestRefreshToken(refreshToken: string): Promise<RefreshAttemptResult> {
  try {
    const clientHeaders = await buildClientHeaders();
    if (typeof window !== 'undefined' && window.electronAPI?.api?.request) {
      const payload: any = await window.electronAPI.api.request(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        body: { refreshToken },
        headers: { 'Content-Type': 'application/json', ...clientHeaders },
      });

      const token = typeof payload?.data?.token === 'string' ? payload.data.token : null;
      const nextRefreshToken =
        typeof payload?.data?.refreshToken === 'string' ? payload.data.refreshToken : null;
      if (token) {
        return { token, refreshToken: nextRefreshToken, invalid: false };
      }

      return {
        token: null,
        refreshToken: null,
        invalid: isAuthFailureMessage(getFailureMessage(payload)),
      };
    }

    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...clientHeaders,
      },
      body: JSON.stringify({ refreshToken }),
    });

    const rawText = await response.text();
    let payload: any = null;

    if (rawText) {
      try {
        payload = JSON.parse(rawText);
      } catch {
        payload = { success: response.ok, message: rawText };
      }
    }

    const token = typeof payload?.data?.token === 'string' ? payload.data.token : null;
    const nextRefreshToken =
      typeof payload?.data?.refreshToken === 'string' ? payload.data.refreshToken : null;
    if (response.ok && token) {
      return { token, refreshToken: nextRefreshToken, invalid: false };
    }

    return {
      token: null,
      refreshToken: null,
      invalid: response.status === 401 || response.status === 403 || isAuthFailureMessage(getFailureMessage(payload)),
    };
  } catch {
    return { token: null, refreshToken: null, invalid: false };
  }
}

export async function refreshSharedAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = readSharedRefreshToken();
    if (!refreshToken) {
      return null;
    }

    const result = await requestRefreshToken(refreshToken);
    if (result.token) {
      writeSharedAuth({
        token: result.token,
        refreshToken: result.refreshToken ?? refreshToken,
      });
      return result.token;
    }

    if (result.invalid) {
      clearSharedAuth();
    }

    return null;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function getUsableAccessToken(): Promise<string | null> {
  const token = readSharedToken();
  if (token) {
    return token;
  }

  return refreshSharedAccessToken();
}
