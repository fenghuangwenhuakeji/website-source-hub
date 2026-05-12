import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_PRODUCT_ID,
  canUseCachedLicense,
  getLicenseDeviceId,
  getLicenseDeviceName,
  getLicenseSessionId,
  readCachedLicense,
  saveCachedLicense,
  type CachedLicense,
} from '../licenseClient';

function buildLicense(overrides: Partial<CachedLicense> = {}): CachedLicense {
  return {
    userId: 'user-1',
    productId: DEFAULT_PRODUCT_ID,
    deviceId: 'device-1',
    sessionId: 'session-1',
    licenseType: 'paid',
    expiresAt: new Date(Date.now() + 86400_000).toISOString(),
    offlineValidUntil: new Date(Date.now() + 3600_000).toISOString(),
    seatLimit: 2,
    deviceLimit: 3,
    features: { writing: true },
    issuedAt: new Date().toISOString(),
    signature: 'signed',
    ...overrides,
  };
}

describe('licenseClient local license cache', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('creates stable device and session ids', () => {
    const firstDeviceId = getLicenseDeviceId();
    const firstSessionId = getLicenseSessionId();

    expect(firstDeviceId).toMatch(/^device-/);
    expect(firstSessionId).toMatch(/^session-/);
    expect(getLicenseDeviceId()).toBe(firstDeviceId);
    expect(getLicenseSessionId()).toBe(firstSessionId);
  });

  it('saves, reads and clears cached licenses by product id', () => {
    const license = buildLicense();

    saveCachedLicense(license);
    expect(readCachedLicense(DEFAULT_PRODUCT_ID)).toEqual(license);
    expect(readCachedLicense('another-product')).toBeNull();

    saveCachedLicense(null);
    expect(readCachedLicense(DEFAULT_PRODUCT_ID)).toBeNull();
  });

  it('rejects cached licenses without signatures', () => {
    saveCachedLicense(buildLicense({ signature: undefined }));

    expect(canUseCachedLicense(DEFAULT_PRODUCT_ID)).toBe(false);
  });

  it('rejects cached licenses after offline validity expires', () => {
    saveCachedLicense(buildLicense({
      offlineValidUntil: new Date(Date.now() - 1000).toISOString(),
    }));

    expect(canUseCachedLicense(DEFAULT_PRODUCT_ID)).toBe(false);
  });

  it('rejects cached licenses after the server entitlement expires', () => {
    saveCachedLicense(buildLicense({
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    }));

    expect(canUseCachedLicense(DEFAULT_PRODUCT_ID)).toBe(false);
  });

  it('accepts valid permanent cached licenses with no expiresAt', () => {
    saveCachedLicense(buildLicense({
      licenseType: 'permanent',
      expiresAt: null,
    }));

    expect(canUseCachedLicense(DEFAULT_PRODUCT_ID)).toBe(true);
  });

  it('uses web or desktop device names based on runtime', () => {
    expect(getLicenseDeviceName()).toContain('web-');

    (window as any).electronAPI = {};
    expect(getLicenseDeviceName()).toContain('desktop-');
    delete (window as any).electronAPI;
  });
});
