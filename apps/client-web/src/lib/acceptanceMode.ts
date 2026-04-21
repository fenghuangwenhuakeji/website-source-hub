const ACCEPTANCE_QUERY_KEYS = ['localAcceptance', 'acceptanceMode'];

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

export function isLocalAcceptanceMode(): boolean {
  return hasAcceptanceQueryFlag() || import.meta.env.VITE_LOCAL_ACCEPTANCE_MODE === '1';
}
