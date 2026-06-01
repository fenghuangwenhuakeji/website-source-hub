import type {
  AuthApiEnvelope,
  AuthSession,
  PasswordLoginRequest,
  PhoneCodeLoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  SendPhoneCodeRequest,
  UnifiedAuthUser,
} from '../types/auth';

export const AUTH_ENDPOINTS = {
  register: '/api/auth/register',
  login: '/api/auth/login',
  me: '/api/auth/me',
  refresh: '/api/auth/refresh',
  logout: '/api/auth/logout',
  sendPhoneCode: '/api/auth/phone/code',
  phoneLogin: '/api/auth/phone/login',
  forgotPasswordRequest: '/api/auth/forgot-password/request',
  forgotPasswordReset: '/api/auth/forgot-password/reset',
  changePassword: '/api/auth/change-password',
  bindPhone: '/api/auth/bind-phone',
  wechatLoginQr: '/api/wechat/login-qrcode',
  wechatStatus: (state: string) => `/api/wechat/status/${encodeURIComponent(state)}`,
} as const;

export function buildAuthClientHeaders(input?: {
  clientType?: 'web' | 'desktop' | 'admin' | 'service';
  appId?: string;
  appVersion?: string;
}) {
  return {
    'x-client-type': input?.clientType || 'web',
    ...(input?.appId ? { 'x-app-id': input.appId } : {}),
    ...(input?.appVersion ? { 'x-app-version': input.appVersion } : {}),
  };
}

export function buildPasswordLoginPayload(input: PasswordLoginRequest) {
  return {
    account: input.account,
    username: input.account,
    password: input.password,
  };
}

export function buildRegisterPayload(input: RegisterRequest) {
  return {
    username: input.username,
    password: input.password,
    nickname: input.nickname,
    email: input.email,
    phone: input.phone,
    phoneCode: input.phoneCode,
    referralCode: input.referralCode,
    wechatOpenid: input.wechatOpenid,
    wechatUnionid: input.wechatUnionid,
  };
}

export function buildSendPhoneCodePayload(input: SendPhoneCodeRequest) {
  return {
    phoneNumber: input.phoneNumber,
    purpose: input.purpose,
  };
}

export function buildPhoneCodeLoginPayload(input: PhoneCodeLoginRequest) {
  return {
    phoneNumber: input.phoneNumber,
    code: input.code,
    inviteCode: input.inviteCode,
  };
}

export function buildRefreshTokenPayload(input: RefreshTokenRequest) {
  return {
    refreshToken: input.refreshToken,
  };
}

export function normalizeAuthUser<T extends Record<string, any>>(user: T): UnifiedAuthUser {
  return {
    id: String(user.id ?? user.userId ?? ''),
    username: String(user.username || ''),
    nickname: user.nickname,
    email: user.email ?? null,
    phone: user.phone ?? null,
    avatar: user.avatar ?? user.avatar_url ?? null,
    role: String(user.role || 'user'),
    isAdmin: Boolean(user.isAdmin ?? user.is_admin),
    points: typeof user.points === 'number' ? user.points : Number(user.points || 0),
    totalRecharge:
      typeof user.totalRecharge === 'number'
        ? user.totalRecharge
        : Number(user.totalRecharge ?? user.total_recharge ?? 0),
    referralCode: user.referralCode ?? user.referral_code ?? null,
    bindingStatus: user.bindingStatus,
    createdAt: user.createdAt ?? user.created_at ?? null,
    lastLoginAt: user.lastLoginAt ?? user.last_login ?? null,
  };
}

export function extractAuthUser(
  payload: AuthApiEnvelope<any> | Record<string, any>,
): UnifiedAuthUser | null {
  const data = 'data' in payload && payload.data ? payload.data : payload;
  if (!data) {
    return null;
  }

  if (data.user) {
    return normalizeAuthUser(data.user);
  }

  if (data.id || data.userId) {
    return normalizeAuthUser(data);
  }

  return null;
}

export function extractAuthSession(
  payload: AuthApiEnvelope<any> | Record<string, any>,
): AuthSession | null {
  const data = 'data' in payload && payload.data ? payload.data : payload;
  const user = data?.user;
  const token = data?.token;

  if (!user || !token) {
    return null;
  }

  return {
    user: normalizeAuthUser(user),
    tokens: {
      token,
      refreshToken: data.refreshToken || '',
      tokenType: 'Bearer',
    },
    loginMethod: data.loginMethod,
  };
}

const DEFAULT_AUTH_ERROR_MESSAGES: Record<string, string> = {
  AUTH_BIND_REQUIRED: '注册需要先绑定手机号或微信。',
  AUTH_PHONE_INVALID: '请输入正确的手机号。',
  AUTH_PHONE_REQUIRED: '请输入手机号。',
  AUTH_PHONE_CODE_REQUIRED: '请输入验证码。',
  AUTH_PHONE_CODE_INVALID: '短信验证码不正确或已过期，请重新获取。',
  AUTH_PHONE_CODE_RATE_LIMITED: '验证码发送太频繁，请稍后再试。',
  AUTH_PHONE_CODE_SEND_FAILED: '验证码发送失败，请稍后再试。',
  AUTH_ACCOUNT_ALREADY_EXISTS: '用户名、手机号、邮箱或微信账号已存在，请更换后再试。',
  AUTH_ACCOUNT_PASSWORD_REQUIRED: '请输入账号和密码。',
  AUTH_INVALID_CREDENTIALS: '登录失败，请检查账号和密码。',
  AUTH_ACCOUNT_LOCKED: '账号已被临时锁定，请稍后再试。',
  AUTH_ACCOUNT_DISABLED: '账号已被禁用，请联系管理员。',
  AUTH_PASSWORD_NOT_SET: '该账号尚未设置密码，请先使用短信或微信登录。',
  AUTH_ACCOUNT_NOT_FOUND: '未找到对应账号。',
  AUTH_ACCOUNT_PHONE_MISMATCH: '账号与手机号不匹配。',
  AUTH_REFRESH_REQUIRED: '登录状态缺少刷新凭证，请重新登录。',
  AUTH_REFRESH_INVALID: '登录状态已失效，请重新登录。',
  AUTH_LOGIN_REQUIRED: '请先登录。',
  AUTH_TOKEN_EXPIRED: '登录状态已过期，请重新登录。',
  AUTH_TOKEN_INVALID: '登录凭证无效，请重新登录。',
  APP_UPDATE_REQUIRED: '当前客户端版本过低，请更新后继续使用。',
};

export function normalizeAuthError(
  error: any,
  fallback = '操作失败，请稍后再试。',
  overrides: Record<string, string> = {},
) {
  const code = String(error?.response?.data?.code || error?.code || '').trim();
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    '';

  if (code && overrides[code]) {
    return overrides[code];
  }

  if (code && DEFAULT_AUTH_ERROR_MESSAGES[code]) {
    return DEFAULT_AUTH_ERROR_MESSAGES[code];
  }

  return String(message || fallback);
}
