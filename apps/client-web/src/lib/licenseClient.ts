export const DEFAULT_PRODUCT_ID = 'fenghuang';

const DEVICE_ID_KEY = 'fh_license_device_id';
const SESSION_ID_KEY = 'fh_license_session_id';
const LICENSE_KEY = 'fh_license_cache_v1';

export type CachedLicense = {
  userId?: string;
  productId: string;
  deviceId: string;
  sessionId?: string | null;
  licenseType: string;
  expiresAt: string | null;
  offlineValidUntil: string;
  seatLimit: number;
  deviceLimit: number;
  features?: Record<string, unknown>;
  issuedAt?: string;
  signature?: string;
};

function randomId(prefix: string): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${random}`;
}

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function getLicenseDeviceId(): string {
  const store = storage();
  const existing = store?.getItem(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }

  const next = randomId('device');
  store?.setItem(DEVICE_ID_KEY, next);
  return next;
}

export function getLicenseSessionId(): string {
  const store = storage();
  const existing = store?.getItem(SESSION_ID_KEY);
  if (existing) {
    return existing;
  }

  const next = randomId('session');
  store?.setItem(SESSION_ID_KEY, next);
  return next;
}

export function getLicenseDeviceName(): string {
  if (typeof window === 'undefined') {
    return 'unknown-client';
  }

  const platform = navigator.platform || 'web';
  return window.electronAPI ? `desktop-${platform}` : `web-${platform}`;
}

export function saveCachedLicense(license: CachedLicense | null): void {
  const store = storage();
  if (!store) {
    return;
  }

  if (!license) {
    store.removeItem(LICENSE_KEY);
    return;
  }

  store.setItem(LICENSE_KEY, JSON.stringify(license));
}

export function readCachedLicense(productId = DEFAULT_PRODUCT_ID): CachedLicense | null {
  const store = storage();
  const raw = store?.getItem(LICENSE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as CachedLicense;
    return parsed.productId === productId ? parsed : null;
  } catch {
    store?.removeItem(LICENSE_KEY);
    return null;
  }
}

export function canUseCachedLicense(productId = DEFAULT_PRODUCT_ID): boolean {
  const license = readCachedLicense(productId);
  if (!license || !license.signature) {
    return false;
  }

  const offlineUntil = new Date(license.offlineValidUntil).getTime();
  if (!Number.isFinite(offlineUntil) || offlineUntil <= Date.now()) {
    return false;
  }

  if (license.expiresAt) {
    const expiresAt = new Date(license.expiresAt).getTime();
    return Number.isFinite(expiresAt) && expiresAt > Date.now();
  }

  return true;
}
