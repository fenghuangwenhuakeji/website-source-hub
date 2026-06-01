export type AuthLoginMethod = 'password' | 'phone_code' | 'wechat';

export type AuthVerificationPurpose =
  | 'login'
  | 'register'
  | 'password_reset'
  | 'bind_phone';

export type AuthClientType = 'web' | 'desktop' | 'admin' | 'service';

export interface AuthBindingStatus {
  phoneBound?: boolean;
  phoneVerified?: boolean;
  phoneVerifiedAt?: string | null;
  wechatBound?: boolean;
  wechatBoundAt?: string | null;
  mustBindContact?: boolean;
}

export interface UnifiedAuthUser {
  id: string;
  username: string;
  nickname?: string;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  role: string;
  isAdmin?: boolean;
  points?: number;
  totalRecharge?: number;
  referralCode?: string | null;
  bindingStatus?: AuthBindingStatus;
  createdAt?: string | null;
  lastLoginAt?: string | null;
}

export interface AuthTokenSet {
  token: string;
  refreshToken: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
  tokenType?: 'Bearer';
}

export interface AuthSession {
  user: UnifiedAuthUser;
  tokens: AuthTokenSet;
  loginMethod?: AuthLoginMethod;
}

export interface AuthApiEnvelope<T> {
  success: boolean;
  code?: string;
  message?: string;
  data?: T;
}

export interface AuthClientHeaders {
  authorization?: string;
  'x-client-type'?: AuthClientType;
  'x-app-id'?: string;
  'x-app-version'?: string;
}

export interface PasswordLoginRequest {
  account: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  nickname?: string;
  email?: string;
  phone?: string;
  phoneCode?: string;
  referralCode?: string;
  wechatOpenid?: string;
  wechatUnionid?: string;
}

export interface SendPhoneCodeRequest {
  phoneNumber: string;
  purpose?: AuthVerificationPurpose;
}

export interface PhoneCodeLoginRequest {
  phoneNumber: string;
  code: string;
  inviteCode?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  phoneNumber: string;
  account?: string;
}

export interface ResetPasswordRequest {
  phoneNumber: string;
  code: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword: string;
}

export interface BindPhoneRequest {
  phoneNumber: string;
  code: string;
}

export interface WechatQrLoginStartResponse {
  authUrl: string;
  state: string;
  expiresAt?: string;
}

export interface WechatQrLoginStatusResponse {
  status: 'pending' | 'success' | 'expired' | 'error';
  message?: string;
  token?: string;
  refreshToken?: string;
  user?: UnifiedAuthUser;
}
