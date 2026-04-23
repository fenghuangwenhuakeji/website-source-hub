const DESKTOP_LOGIN_PATH = '/access/login';
const LOCAL_DESKTOP_PORT = '4173';

type DesktopLoginMode = 'password' | 'sms' | 'register' | 'wechat';

type DesktopLoginOptions = {
  mode?: DesktopLoginMode;
  from?: string;
};

function withForceLogin(url: string, options: DesktopLoginOptions = {}) {
  const [base, hash = ''] = url.split('#');
  const [pathname, query = ''] = base.split('?');
  const params = new URLSearchParams(query);
  const fromPath = options.from?.trim();

  if (!params.has('forceLogin')) {
    params.set('forceLogin', '1');
  }

  if (options.mode) {
    params.set('mode', options.mode);
  }

  if (fromPath && fromPath.startsWith('/') && !fromPath.startsWith('//')) {
    params.set('from', fromPath);
  }

  const nextUrl = `${pathname}?${params.toString()}`;
  return hash ? `${nextUrl}#${hash}` : nextUrl;
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

export function resolveDesktopLoginUrl(options: DesktopLoginOptions = {}) {
  if (typeof window === 'undefined') {
    return withForceLogin(DESKTOP_LOGIN_PATH, options);
  }

  const envUrl = (import.meta.env.VITE_DESKTOP_LOGIN_URL as string | undefined)?.trim();
  const { hostname, origin, protocol, port } = window.location;
  const isLocalHost = isLoopbackHost(hostname);

  // Never let a local development override leak into the cloud site.
  if (envUrl && (!isLoopbackUrl(envUrl) || isLocalHost)) {
    return withForceLogin(envUrl, options);
  }

  if (isLocalHost && port !== LOCAL_DESKTOP_PORT) {
    return withForceLogin(`${protocol}//${hostname}:${LOCAL_DESKTOP_PORT}${DESKTOP_LOGIN_PATH}`, options);
  }

  return withForceLogin(`${origin}${DESKTOP_LOGIN_PATH}`, options);
}
