import crypto from 'node:crypto';
import { config } from '../../config/index.js';
import { ApiError } from '../../middleware/errorHandler.js';
import type { PaymentOrder } from './types.js';

export function getWechatPayAppId(): string {
  return config.wechat.appId || config.wechatLogin.appId || '';
}

export function randomNonce(length = 32): string {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

export function getHeaderString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] || '';
  }
  return typeof value === 'string' ? value : '';
}

export function toNumber(value: unknown, fallback = 0): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

export function toFen(amount: number): number {
  return Math.round(amount * 100);
}

export function toDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value).trim();
  const sqliteUtcLike =
    config.database.adapter === 'sqlite' &&
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(raw);

  const parsed = sqliteUtcLike
    ? new Date(raw.replace(' ', 'T') + 'Z')
    : new Date(raw);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function parseAlipayDate(value: unknown): Date | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  return toDate(value.replace(/-/g, '/'));
}

export function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '{}';
  }
}

export function extractAxiosErrorMessage(error: any): string {
  const data = error?.response?.data;
  if (typeof data === 'string' && data.trim()) {
    try {
      const parsed = JSON.parse(data);
      return parsed.message || parsed.detail || data;
    } catch {
      return data;
    }
  }

  if (data && typeof data === 'object') {
    return data.message || data.detail || error.message || 'Gateway request failed';
  }

  return error?.message || 'Gateway request failed';
}

export function hasWechatConfig(): boolean {
  return Boolean(
    config.wechat.mchId &&
      config.wechat.privateKey &&
      config.wechat.serialNo &&
      config.wechat.apiV3Key &&
      config.wechat.payPublicKey &&
      config.wechat.callbackUrl
  );
}

export function ensureWechatConfig(): void {
  if (!hasWechatConfig()) {
    throw ApiError.internal('WeChat Pay is not fully configured');
  }
}

export function hasAlipayConfig(): boolean {
  return Boolean(config.alipay.appId && config.alipay.privateKey && getAlipayConfigMode() !== 'missing');
}

export function hasAlipayCertConfig(): boolean {
  return Boolean(config.alipay.appCert && config.alipay.rootCert && config.alipay.publicCert);
}

export function usesAlipayCertMode(): boolean {
  return Boolean(config.alipay.appCert || config.alipay.rootCert || config.alipay.publicCert);
}

export function getAlipayConfigMode(): 'cert' | 'key' | 'missing' {
  if (!config.alipay.appId || !config.alipay.privateKey) {
    return 'missing';
  }

  if (hasAlipayCertConfig()) {
    return 'cert';
  }

  if (config.alipay.alipayPublicKey) {
    return 'key';
  }

  return 'missing';
}

export function ensureAlipayConfig(): void {
  if (!hasAlipayConfig()) {
    throw ApiError.internal('Alipay is not fully configured');
  }
}

export function buildStatusResponse(order: PaymentOrder) {
  return {
    orderId: order.id,
    orderNo: order.orderNo,
    amount: order.amount,
    points: order.points,
    bonusPoints: order.bonusPoints,
    duration: order.duration,
    durationUnit: order.durationUnit,
    status: order.status,
    payMethod: order.payMethod,
    paidAt: order.payTime,
    createdAt: order.createdAt,
    expireTime: order.expireTime,
    providerTransactionId: order.providerTransactionId,
    providerStatus: order.providerStatus,
  };
}
