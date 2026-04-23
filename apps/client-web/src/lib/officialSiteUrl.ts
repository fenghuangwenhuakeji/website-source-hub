const LOCAL_OFFICIAL_SITE_PORT = '5182';

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

function normalizeOfficialPath(path: string) {
  const trimmed = (path || '').trim();
  if (!trimmed) {
    return '/login';
  }

  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return '/login';
  }

  return trimmed;
}

export function resolveOfficialSiteUrl(path = '/login') {
  const normalizedPath = normalizeOfficialPath(path);

  if (typeof window === 'undefined') {
    return normalizedPath;
  }

  const envUrl = (import.meta.env.VITE_OFFICIAL_SITE_URL as string | undefined)?.trim();
  const { hostname, origin, protocol, port } = window.location;
  const isLocalHost = isLoopbackHost(hostname);

  if (envUrl && (!isLoopbackUrl(envUrl) || isLocalHost)) {
    return new URL(normalizedPath, envUrl).toString();
  }

  if (isLocalHost && port !== LOCAL_OFFICIAL_SITE_PORT) {
    return `${protocol}//${hostname}:${LOCAL_OFFICIAL_SITE_PORT}${normalizedPath}`;
  }

  return `${origin}${normalizedPath}`;
}

export function resolveOfficialSiteUrlFromSearch(search: string, fallbackPath = '/login') {
  const params = new URLSearchParams(search);
  const from = params.get('from');

  if (from) {
    return resolveOfficialSiteUrl(from);
  }

  return resolveOfficialSiteUrl(fallbackPath);
}
