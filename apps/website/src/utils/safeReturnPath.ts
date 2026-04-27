const DEFAULT_RETURN_PATH = '/dashboard';

function isSafeInternalPath(value: string) {
  return value.startsWith('/') && !value.startsWith('//');
}

export function getSafeReturnPath(search: string, fallback = DEFAULT_RETURN_PATH) {
  const params = new URLSearchParams(search);
  const from = (params.get('from') || '').trim();

  if (!isSafeInternalPath(from)) {
    return fallback;
  }

  if (from === '/login' || from.startsWith('/login?') || from === '/register' || from.startsWith('/register?')) {
    return fallback;
  }

  return from;
}

export function buildPathWithFrom(path: string, from: string) {
  const [pathname, query = ''] = path.split('?');
  const params = new URLSearchParams(query);

  if (isSafeInternalPath(from)) {
    params.set('from', from);
  }

  const nextQuery = params.toString();
  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

export function openReturnPath(path: string, navigate: (path: string) => void) {
  if (path.startsWith('/access/')) {
    window.location.assign(path);
    return;
  }

  navigate(path);
}
