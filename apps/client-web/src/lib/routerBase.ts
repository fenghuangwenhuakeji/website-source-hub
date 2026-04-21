declare const __ROUTER_BASE__: string;

function normalizeBase(base: string): string {
  if (!base || base === '/') {
    return '/';
  }

  return `/${base.replace(/^\/+|\/+$/g, '')}`;
}

export function getRouterBase(): string {
  if (typeof __ROUTER_BASE__ !== 'undefined' && __ROUTER_BASE__) {
    return normalizeBase(__ROUTER_BASE__);
  }

  if (typeof window !== 'undefined') {
    if (window.location.pathname === '/access' || window.location.pathname.startsWith('/access/')) {
      return '/access';
    }
  }

  return '/';
}

export function buildRouterPath(path: string): string {
  const routerBase = getRouterBase();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (routerBase === '/') {
    return normalizedPath;
  }

  return `${routerBase}${normalizedPath}`;
}
