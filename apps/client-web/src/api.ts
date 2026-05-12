import { getUsableAccessToken, isAuthFailureMessage, refreshSharedAccessToken } from './lib/sessionAuth';

const API_BASE = '/api';

const isElectron = typeof window !== 'undefined' && window.electronAPI;
const electronApi = isElectron ? window.electronAPI : null;
let desktopVersionPromise: Promise<string | null> | null = null;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, any>;
}

interface RequestResult {
  ok: boolean;
  status?: number;
  data: any;
}

function buildUrl(endpoint: string, params?: Record<string, any>) {
  let url = `${API_BASE}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    if (searchParams.toString()) {
      url += `?${searchParams.toString()}`;
    }
  }

  return url;
}

async function getDesktopAppVersion(): Promise<string | null> {
  if (!isElectron || !electronApi?.getAppVersion) {
    return null;
  }

  if (!desktopVersionPromise) {
    desktopVersionPromise = Promise.resolve(electronApi.getAppVersion())
      .then((version) => (version ? String(version) : null))
      .catch(() => null);
  }

  return desktopVersionPromise;
}

async function buildClientHeaders(): Promise<Record<string, string>> {
  if (!isElectron) {
    return {
      'X-Client-Type': 'web',
    };
  }

  const appVersion = await getDesktopAppVersion();
  return {
    'X-Client-Type': 'desktop',
    ...(appVersion ? { 'X-App-Version': appVersion } : {}),
  };
}

async function sendRequest(
  url: string,
  options: RequestOptions,
  token: string | null,
): Promise<RequestResult> {
  const clientHeaders = await buildClientHeaders();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...clientHeaders,
    ...options.headers,
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (isElectron && electronApi?.api) {
    const payload = await electronApi.api.request(url, {
      method: options.method || 'GET',
      body: options.body,
      headers,
    });

    return {
      ok: !(payload && (payload.success === false || payload.error)),
      data: payload,
    };
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const rawText = await response.text();
  let data: any = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = {
        success: response.ok,
        message: rawText,
      };
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    data:
      data ??
      ({
        success: response.ok,
        message: response.ok ? undefined : `Request failed with status ${response.status}`,
      } as any),
  };
}

function shouldRetryWithRefresh(result: RequestResult): boolean {
  if (result.status === 401) {
    return true;
  }

  return isAuthFailureMessage(result.data?.message || result.data?.error);
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = buildUrl(endpoint, options.params);
  const canRefresh = endpoint !== '/auth/refresh';

  const perform = (token: string | null) => sendRequest(url, options, token);

  let token = canRefresh ? await getUsableAccessToken() : null;
  let result = await perform(token);

  if (canRefresh && shouldRetryWithRefresh(result)) {
    const refreshedToken = await refreshSharedAccessToken();
    if (refreshedToken && refreshedToken !== token) {
      token = refreshedToken;
      result = await perform(refreshedToken);
    }
  }

  if (!result.ok) {
    return {
      success: false,
      code: result.data?.code,
      message:
        result.data?.message ||
        result.data?.error ||
        `Request failed with status ${result.status ?? 0}`,
      data: result.data?.data,
    } as T;
  }

  return (result.data ?? ({ success: true } as T)) as T;
}

const api = {
  app: {
    version: () => request('/app/version'),
  },
  auth: {
    login: (data: { username: string; password: string }) =>
      request('/auth/login', { method: 'POST', body: data }),
    register: (data: {
      username: string;
      password: string;
      phone?: string;
      email?: string;
      referralCode?: string;
      phoneCode?: string;
    }) => request('/auth/register', { method: 'POST', body: data }),
    profile: () => request('/auth/profile'),
    checkRecharge: () => request('/auth/check-recharge'),
    wechatStatus: (state: string) => request(`/wechat/status/${state}`),
    sendSmsCode: (
      phoneNumber: string,
      purpose: 'login' | 'register' | 'password_reset' | 'bind_phone' = 'login',
    ) => request('/sms/send-code', { method: 'POST', body: { phoneNumber, purpose } }),
    smsLogin: (data: { phoneNumber: string; code: string; inviteCode?: string }) =>
      request('/sms/login', { method: 'POST', body: data }),
    wechatLogin: () => request('/auth/wechat/login'),
    wechatCallback: (code: string) =>
      request('/auth/wechat/callback', { method: 'POST', body: { code } }),
    sendPhoneCode: (phone: string) =>
      request('/auth/phone/code', { method: 'POST', body: { phone } }),
    phoneLogin: (data: { phone: string; code: string }) =>
      request('/auth/phone/login', { method: 'POST', body: data }),
    bindEmail: (email: string) =>
      request('/auth/email/bind', { method: 'POST', body: { email } }),
    requestPasswordReset: (data: { phoneNumber: string; account?: string }) =>
      request('/auth/forgot-password/request', { method: 'POST', body: data }),
    resetPassword: (data: { phoneNumber: string; code: string; newPassword: string }) =>
      request('/auth/forgot-password/reset', { method: 'POST', body: data }),
    sendEmailCode: (email: string, type: 'bind' | 'reset') =>
      request('/auth/email/code', { method: 'POST', body: { email, type } }),
    changePassword: (data: { currentPassword?: string; newPassword: string }) =>
      request('/auth/change-password', { method: 'POST', body: data }),
    bindPhone: (data: { phoneNumber: string; code: string }) =>
      request('/auth/bind-phone', { method: 'POST', body: data }),
    getPayoutProfile: () => request('/auth/payout-profile'),
    savePayoutProfile: (data: {
      realName: string;
      payoutMethod: 'wechat' | 'alipay';
      payoutAccount: string;
      identityNo?: string;
      phone?: string;
      note?: string;
    }) => request('/auth/payout-profile', { method: 'PUT', body: data }),
  },
  orders: {
    packages: () => request('/orders/packages'),
    create: (data: { packageId: string; payMethod?: string }) =>
      request('/orders/create', { method: 'POST', body: data }),
    list: (params?: { page?: number; limit?: number }) =>
      request('/orders', { params }),
    pointsExchange: () => request('/orders/points-exchange'),
    exchange: (data: { exchangeId: string }) =>
      request('/orders/exchange', { method: 'POST', body: data }),
  },
  payment: {
    config: () => request('/payment/config'),
    create: (data: {
      orderId?: string;
      orderNo?: string;
      payMethod?: 'wechat' | 'alipay';
      method?: 'wechat' | 'alipay';
      openid?: string;
    }) => request('/payment/create', { method: 'POST', body: data }),
    status: (orderNo: string) => request(`/payment/status/${orderNo}`),
    refreshQrCode: (orderNo: string) =>
      request(`/payment/alipay/refresh-qr/${orderNo}`, { method: 'POST' }),
  },
  recharge: {
    products: () => request('/recharge/products'),
    create: (data: { productId: number | string; payMethod: 'wechat' | 'alipay' }) =>
      request('/recharge/create', { method: 'POST', body: data }),
    order: (orderId: string) => request(`/recharge/order/${orderId}`),
    redeemExperienceCode: (data: { code: string }) =>
      request('/recharge/experience-code/redeem', { method: 'POST', body: data }),
  },
  license: {
    status: (productId = 'fenghuang') => request(`/license/products/${encodeURIComponent(productId)}/status`),
    activateDevice: (productId: string, data: { deviceId: string; deviceName?: string }) =>
      request(`/license/products/${encodeURIComponent(productId)}/activate-device`, { method: 'POST', body: data }),
    issue: (productId: string, data: { deviceId: string; deviceName?: string; sessionId?: string }) =>
      request(`/license/products/${encodeURIComponent(productId)}/issue`, { method: 'POST', body: data }),
    heartbeat: (productId: string, data: { deviceId: string; deviceName?: string; sessionId?: string }) =>
      request(`/license/products/${encodeURIComponent(productId)}/heartbeat`, { method: 'POST', body: data }),
    releaseSeat: (productId: string, data: { deviceId?: string; sessionId?: string }) =>
      request(`/license/products/${encodeURIComponent(productId)}/release-seat`, { method: 'POST', body: data }),
    redeemCode: (productId: string, data: { code: string }) =>
      request(`/license/products/${encodeURIComponent(productId)}/redeem-code`, { method: 'POST', body: data }),
  },
  wechat: {
    getLoginQrcode: () => request('/wechat/login-qrcode'),
    getBindQrcode: () => request('/wechat/bind-qrcode'),
    getPaymentQrcode: (orderNo: string) => request(`/wechat/qrcode-page?orderNo=${orderNo}`),
    getOpenId: (code: string) =>
      request('/wechat/get-openid', { method: 'POST', body: { code } }),
  },
  points: {
    getRecords: () => request('/points/records'),
  },
  referral: {
    getMyCode: () => request('/referral/my-code'),
    bindCode: (code: string) =>
      request(`/referral/bind/${encodeURIComponent(code)}`, { method: 'POST' }),
    getList: (params?: { page?: number; limit?: number }) =>
      request('/referral/list', { params }),
    getRules: () => request('/referral/rules'),
    getRecords: () => request('/referral/records'),
    getRewards: () => request('/referral/rewards'),
    getStats: () => request('/referral/stats'),
    getLedger: () => request('/referral/ledger'),
    getWithdrawals: () => request('/referral/withdrawals'),
    previewWithdrawal: (data: { diamonds: number }) =>
      request('/referral/withdrawals/preview', { method: 'POST', body: data }),
    submitWithdrawal: (data: { diamonds: number }) =>
      request('/referral/withdrawals', { method: 'POST', body: data }),
    convertDiamonds: (data: { diamonds: number }) =>
      request('/referral/convert-diamonds', { method: 'POST', body: data }),
    getMilestones: () => request('/referral/milestones'),
  },
};

export default api;
