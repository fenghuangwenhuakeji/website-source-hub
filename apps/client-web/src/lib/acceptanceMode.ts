const ACCEPTANCE_QUERY_KEYS = ['localAcceptance', 'acceptanceMode'];
const ACCEPTANCE_SESSION_KEY = 'fhwh-local-acceptance-mode';

function hasAcceptanceQueryFlag(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  return ACCEPTANCE_QUERY_KEYS.some((key) => {
    const value = params.get(key);
    return value === '1' || value === 'true';
  });
}

function hasAcceptanceSessionFlag(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.sessionStorage.getItem(ACCEPTANCE_SESSION_KEY) === '1';
}

function persistAcceptanceSessionFlag(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(ACCEPTANCE_SESSION_KEY, '1');
}

export function isLocalAcceptanceMode(): boolean {
  const enabled =
    hasAcceptanceQueryFlag() ||
    import.meta.env.VITE_LOCAL_ACCEPTANCE_MODE === '1' ||
    hasAcceptanceSessionFlag();

  if (enabled) {
    persistAcceptanceSessionFlag();
  }

  return enabled;
}

export function buildAcceptanceAwarePath(path: string): string {
  if (!path || !isLocalAcceptanceMode()) {
    return path;
  }

  try {
    const normalized = new URL(path, 'http://local.acceptance');
    const hasExistingFlag = ACCEPTANCE_QUERY_KEYS.some((key) => {
      const value = normalized.searchParams.get(key);
      return value === '1' || value === 'true';
    });

    if (!hasExistingFlag) {
      normalized.searchParams.set('localAcceptance', '1');
    }

    return `${normalized.pathname}${normalized.search}${normalized.hash}`;
  } catch {
    return path;
  }
}
