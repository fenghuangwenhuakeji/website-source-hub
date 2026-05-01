import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config();

function normalizeEnvValue(value: string | undefined): string {
  if (!value) {
    return '';
  }

  const trimmed = value.trim();
  const unquoted = trimmed
    .replace(/^"(.*)"$/, '$1')
    .replace(/^'(.*)'$/, '$1')
    .trim();

  return unquoted.replace(/\\n/g, '\n');
}

function loadSecretValue(value: string | undefined): string {
  const normalized = normalizeEnvValue(value);
  if (!normalized) {
    return '';
  }

  const filePrefix = 'file:';
  const atPrefix = '@';
  const candidate =
    normalized.startsWith(filePrefix)
      ? normalized.slice(filePrefix.length).trim()
      : normalized.startsWith(atPrefix)
        ? normalized.slice(atPrefix.length).trim()
        : '';

  if (candidate) {
    try {
      const resolved = path.resolve(candidate);
      return fs.readFileSync(resolved, 'utf8').trim();
    } catch {
      return '';
    }
  }

  return normalized;
}

function formatPrivateKey(key: string): string {
  if (!key) {
    return '';
  }

  if (key.includes('-----BEGIN')) {
    return key;
  }

  const lines = key.match(/.{1,64}/g) || [];
  return `-----BEGIN RSA PRIVATE KEY-----\n${lines.join('\n')}\n-----END RSA PRIVATE KEY-----`;
}

function formatPublicKey(key: string): string {
  if (!key) {
    return '';
  }

  if (key.includes('-----BEGIN')) {
    return key;
  }

  const lines = key.match(/.{1,64}/g) || [];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`;
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  jwt: {
    secret: process.env.JWT_SECRET || 'chaowuqiong-secret-key-2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '365d',
  },

  database: {
    adapter: process.env.DB_ADAPTER || 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chaowuqiong_db',
    sqlitePath: process.env.DB_SQLITE_PATH || './data/local-dev.sqlite',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  wechat: {
    appId: normalizeEnvValue(process.env.WECHAT_PAY_APPID || process.env.WECHAT_APPID || ''),
    appSecret: normalizeEnvValue(process.env.WECHAT_APPSECRET || ''),
    mchId: normalizeEnvValue(process.env.WECHAT_MCH_ID || ''),
    apiKey: normalizeEnvValue(process.env.WECHAT_API_KEY || ''),
    apiV3Key: normalizeEnvValue(process.env.WECHAT_PAY_API_V3_KEY || ''),
    serialNo: normalizeEnvValue(process.env.WECHAT_PAY_SERIAL_NO || ''),
    privateKey: formatPrivateKey(loadSecretValue(process.env.WECHAT_PAY_PRIVATE_KEY || '')),
    payPublicKey: formatPublicKey(loadSecretValue(process.env.WECHAT_PAY_PUBLIC_KEY || '')),
    payPublicKeyId: normalizeEnvValue(process.env.WECHAT_PAY_PUBLIC_KEY_ID || ''),
    callbackUrl:
      normalizeEnvValue(process.env.WECHAT_CALLBACK_URL) ||
      'https://chaowuqiong.com/api/payment/wechat/callback',
  },

  alipay: {
    appId: normalizeEnvValue(process.env.ALIPAY_APP_ID || ''),
    privateKey: formatPrivateKey(loadSecretValue(process.env.ALIPAY_PRIVATE_KEY || '')),
    alipayPublicKey: formatPublicKey(loadSecretValue(process.env.ALIPAY_PUBLIC_KEY || '')),
    publicCert: loadSecretValue(
      process.env.ALIPAY_PUBLIC_CERT || process.env.ALIPAY_PUBLIC_CERT_PATH || '',
    ),
    appCert: loadSecretValue(process.env.ALIPAY_APP_CERT || process.env.ALIPAY_APP_CERT_PATH || ''),
    rootCert: loadSecretValue(
      process.env.ALIPAY_ROOT_CERT || process.env.ALIPAY_ROOT_CERT_PATH || '',
    ),
    callbackUrl:
      normalizeEnvValue(process.env.ALIPAY_CALLBACK_URL) ||
      'https://chaowuqiong.com/api/payment/alipay/callback',
  },

  volcengine: {
    accessKeyId: normalizeEnvValue(process.env.VOLCENGINE_ACCESS_KEY_ID || ''),
    secretKey: normalizeEnvValue(process.env.VOLCENGINE_SECRET_KEY || ''),
    smsAccount: normalizeEnvValue(process.env.VOLCENGINE_SMS_ACCOUNT || ''),
    smsSign: normalizeEnvValue(process.env.VOLCENGINE_SMS_SIGN || '南京凤煌文化科技有限公司'),
    smsTemplateId: normalizeEnvValue(process.env.VOLCENGINE_SMS_TEMPLATE_ID || 'SPT_09a29a26'),
  },

  wechatLogin: {
    appId: normalizeEnvValue(process.env.WECHAT_LOGIN_APPID || 'wxd361efda71076624'),
    appSecret: normalizeEnvValue(process.env.WECHAT_LOGIN_APPSECRET || ''),
    callbackDomain: normalizeEnvValue(process.env.WECHAT_LOGIN_CALLBACK_DOMAIN || 'fhwhkj.top'),
  },

  security: {
    loginMaxAttempts: 5,
    loginLockoutMinutes: 30,
    bcryptRounds: 12,
  },
} as const;

export type Config = typeof config;
