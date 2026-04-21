const DESKTOP_LOGIN_PATH = '/access/login';
const LOCAL_DESKTOP_PORT = '4173';

function withForceLogin(url: string) {
  if (url.includes('forceLogin=')) {
    return url;
  }

  return `${url}${url.includes('?') ? '&' : '?'}forceLogin=1`;
}

function isLoopbackHost(hostname: string) {
  return hostname === '127.0.0.1' || hostname === 'localhost';
}

function isLoopbackUrl(url: string) {
  try {
    return isLoopbackHost(new URL(url).hostname);
  } catch {
    return false;
  }
}

export function resolveDesktopLoginUrl() {
  if (typeof window === 'undefined') {
    return withForceLogin(DESKTOP_LOGIN_PATH);
  }

  const envUrl = (import.meta.env.VITE_DESKTOP_LOGIN_URL as string | undefined)?.trim();
  const { hostname, origin, protocol, port } = window.location;
  const isLocalHost = isLoopbackHost(hostname);

  // Never let a local development override leak into the cloud site.
  if (envUrl && (!isLoopbackUrl(envUrl) || isLocalHost)) {
    return withForceLogin(envUrl);
  }

  if (isLocalHost && port !== LOCAL_DESKTOP_PORT) {
    return withForceLogin(`${protocol}//${hostname}:${LOCAL_DESKTOP_PORT}${DESKTOP_LOGIN_PATH}`);
  }

  return withForceLogin(`${origin}${DESKTOP_LOGIN_PATH}`);
}
