import { clearSharedAuth } from './authStorage';
import { isLocalAcceptanceMode } from './acceptanceMode';
import {
  getUsableAccessToken,
  hasStoredSession,
  isAuthFailureMessage,
  refreshSharedAccessToken,
} from './sessionAuth';
import {
  DEFAULT_PRODUCT_ID,
  canUseCachedLicense,
  getLicenseDeviceId,
  getLicenseDeviceName,
  getLicenseSessionId,
  saveCachedLicense,
  type CachedLicense,
} from './licenseClient';

export type UserRole = 'normal' | 'admin' | 'rootadmin' | 'super_admin';

export interface UserPermission {
  role: UserRole;
  canViewAdminPanel: boolean;
  canViewLicenseManager: boolean;
  canViewMonitorPanel: boolean;
  canViewRevenueStats: boolean;
  canViewFinancialAnalysis: boolean;
  canViewUserProfile: boolean;
  canViewUserManagement: boolean;
  canViewNovelComics: boolean;
  canAccessAllApps: boolean;
  hasRecharged: boolean;
  points: number;
}

const NORMAL_USER_PERMISSION: UserPermission = {
  role: 'normal',
  canViewAdminPanel: false,
  canViewLicenseManager: false,
  canViewMonitorPanel: false,
  canViewRevenueStats: false,
  canViewFinancialAnalysis: false,
  canViewUserProfile: false,
  canViewUserManagement: false,
  canViewNovelComics: false,
  canAccessAllApps: false,
  hasRecharged: false,
  points: 0,
};

const ADMIN_PERMISSION: UserPermission = {
  role: 'admin',
  canViewAdminPanel: true,
  canViewLicenseManager: true,
  canViewMonitorPanel: true,
  canViewRevenueStats: true,
  canViewFinancialAnalysis: true,
  canViewUserProfile: true,
  canViewUserManagement: true,
  canViewNovelComics: true,
  canAccessAllApps: true,
  hasRecharged: true,
  points: 0,
};

const ROOTADMIN_PERMISSION: UserPermission = {
  role: 'rootadmin',
  canViewAdminPanel: true,
  canViewLicenseManager: true,
  canViewMonitorPanel: true,
  canViewRevenueStats: true,
  canViewFinancialAnalysis: true,
  canViewUserProfile: true,
  canViewUserManagement: true,
  canViewNovelComics: true,
  canAccessAllApps: true,
  hasRecharged: true,
  points: 0,
};

export function getPermission(role: UserRole, hasRecharged = false): UserPermission {
  if (!hasRecharged) {
    return { ...NORMAL_USER_PERMISSION, hasRecharged: false };
  }

  switch (role) {
    case 'rootadmin':
      return { ...ROOTADMIN_PERMISSION, hasRecharged: true };
    case 'super_admin':
    case 'admin':
      return { ...ADMIN_PERMISSION, hasRecharged: true };
    default:
      return { ...NORMAL_USER_PERMISSION, hasRecharged: true };
  }
}

export function isRootAdmin(role: UserRole): boolean {
  return role === 'rootadmin';
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin' || role === 'rootadmin' || role === 'super_admin';
}

let currentUserRole: UserRole = 'normal';
let currentHasRecharged = false;
let currentPoints = 0;

export function setUserRole(role: UserRole): void {
  currentUserRole = role;
}

export function getUserRole(): UserRole {
  return currentUserRole;
}

export function getCurrentPermission(): UserPermission {
  return getPermission(currentUserRole, currentHasRecharged);
}

export function getHasRecharged(): boolean {
  return currentHasRecharged;
}

export function getCurrentPoints(): number {
  return currentPoints;
}

const API_BASE = '/api';

interface FetchResult {
  success: boolean;
  data?: any;
  message?: string;
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<FetchResult> {
  const execute = async (token: string | null): Promise<FetchResult & { status?: number }> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers,
      });
      const rawText = await response.text();
      let data: any = null;

      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = { success: response.ok, message: rawText };
        }
      }

      if (!response.ok) {
        return {
          success: false,
          message: data?.message || data?.error || `Request failed with status ${response.status}`,
          data: data?.data,
          status: response.status,
        };
      }

      return {
        success: data?.success ?? true,
        data: data?.data,
        message: data?.message,
        status: response.status,
      };
    } catch {
      return { success: false, message: '网络异常', status: 0 };
    }
  };

  let token = await getUsableAccessToken();
  let result = await execute(token);

  if (result.status === 401 || isAuthFailureMessage(result.message)) {
    const refreshedToken = await refreshSharedAccessToken();
    if (refreshedToken && refreshedToken !== token) {
      token = refreshedToken;
      result = await execute(refreshedToken);
    }
  }

  return result;
}

function hasDurationAccessFromProfile(data: any): boolean {
  const role = data?.role || 'normal';
  if (role === 'admin' || role === 'rootadmin' || role === 'super_admin') {
    return true;
  }

  return !!(data?.duration?.isPermanent || (data?.duration?.remainingSeconds || 0) > 0);
}

async function refreshLocalLicense(productId = DEFAULT_PRODUCT_ID): Promise<CachedLicense | null> {
  const body = {
    deviceId: getLicenseDeviceId(),
    deviceName: getLicenseDeviceName(),
    sessionId: getLicenseSessionId(),
  };
  const res = await fetchWithAuth(`/license/products/${encodeURIComponent(productId)}/heartbeat`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const license = res.data?.license as CachedLicense | undefined;
  if (res.success && license) {
    saveCachedLicense(license);
    return license;
  }

  return null;
}

export async function checkAdminAccess(): Promise<{ hasAccess: boolean; level: UserRole }> {
  if (isLocalAcceptanceMode()) {
    currentUserRole = 'admin';
    currentHasRecharged = true;
    currentPoints = 9999;
    return { hasAccess: true, level: 'admin' };
  }

  const res = await fetchWithAuth('/auth/profile');
  if (res.success && res.data) {
    const role = (res.data.role || 'normal') as UserRole;
    const hasRecharged = hasDurationAccessFromProfile(res.data);
    currentUserRole = role;
    currentHasRecharged = hasRecharged;
    currentPoints = res.data.points || 0;
    return { hasAccess: hasRecharged, level: role };
  }

  return { hasAccess: false, level: 'normal' };
}

export async function syncUserRoleFromBackend(): Promise<UserRole> {
  const result = await checkAdminAccess();
  currentUserRole = result.hasAccess ? result.level : 'normal';
  return currentUserRole;
}

export async function checkRechargeRequired(): Promise<{
  needsRecharge: boolean;
  totalRecharge: number;
  needsLogin: boolean;
  hasActiveMembership?: boolean;
  membershipExpiry?: string;
  accessType?: string;
  isTrial?: boolean;
  canEnter?: boolean;
  requiresPurchase?: boolean;
  remainingSeconds?: number;
}> {
  if (isLocalAcceptanceMode()) {
    currentUserRole = 'admin';
    currentHasRecharged = true;
    currentPoints = 9999;
    return {
      needsRecharge: false,
      totalRecharge: 0,
      needsLogin: false,
      hasActiveMembership: true,
      membershipExpiry: 'local-acceptance-mode',
    };
  }

  const res = await fetchWithAuth(`/license/products/${encodeURIComponent(DEFAULT_PRODUCT_ID)}/status`);

  if (isAuthFailureMessage(res.message)) {
    return { needsRecharge: true, totalRecharge: 0, needsLogin: true };
  }

  if (res.message === '网络异常') {
    const offlineUsable = canUseCachedLicense(DEFAULT_PRODUCT_ID);
    return {
      needsRecharge: !offlineUsable,
      totalRecharge: 0,
      needsLogin: false,
      hasActiveMembership: offlineUsable,
      canEnter: offlineUsable,
      requiresPurchase: !offlineUsable,
      accessType: offlineUsable ? 'offline' : 'none',
    };
  }

  if (res.success && res.data) {
    const canEnter = !!res.data.canEnter;
    currentHasRecharged = canEnter;
    if (canEnter) {
      await refreshLocalLicense(DEFAULT_PRODUCT_ID);
    } else {
      saveCachedLicense(null);
    }
    return {
      needsRecharge: !!res.data.requiresPurchase,
      totalRecharge: res.data.totalRecharge || 0,
      needsLogin: false,
      hasActiveMembership: canEnter,
      membershipExpiry: res.data.expiresAt,
      accessType: res.data.accessType,
      isTrial: !!res.data.isTrial,
      canEnter,
      requiresPurchase: !!res.data.requiresPurchase,
      remainingSeconds: res.data.remainingSeconds || 0,
    };
  }

  return { needsRecharge: true, totalRecharge: 0, needsLogin: false };
}

export function isLoggedIn(): boolean {
  return isLocalAcceptanceMode() || hasStoredSession();
}

export function logout(): void {
  clearSharedAuth();
  currentUserRole = 'normal';
  currentHasRecharged = false;
  currentPoints = 0;
}
