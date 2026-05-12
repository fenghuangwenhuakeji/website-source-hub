import crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import type { PoolConnection } from '../config/database.js';
import { execute as dbExecute, getDatabaseAdapter, query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { durationToSeconds, parseStoredDateTime } from './durationAccess.js';

export const DEFAULT_LICENSE_PRODUCT_ID = process.env.DEFAULT_LICENSE_PRODUCT_ID || 'fenghuang';
const DEFAULT_OFFLINE_VALID_DAYS = Number(process.env.LICENSE_OFFLINE_VALID_DAYS || 3);
const SESSION_TTL_SECONDS = Number(process.env.LICENSE_SESSION_TTL_SECONDS || 180);
const SIGNING_SECRET = process.env.LICENSE_SIGNING_SECRET || process.env.JWT_SECRET || 'local-license-secret';
const LICENSE_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

type Role = string | undefined;

export interface ProductAccessStatus {
  productId: string;
  accessType: 'admin' | 'permanent' | 'paid' | 'trial' | 'none';
  isTrial: boolean;
  isPermanent: boolean;
  trialStartedAt: Date | null;
  trialExpiresAt: Date | null;
  expiresAt: Date | null;
  remainingSeconds: number;
  canEnter: boolean;
  requiresPurchase: boolean;
  seatLimit: number;
  deviceLimit: number;
  activeDeviceCount: number;
  activeSessionCount: number;
  offlineValidDays: number;
  features: Record<string, unknown>;
  reason?: string;
}

type EntitlementRow = Record<string, any>;

function isAdminRole(role: Role): boolean {
  return ['admin', 'rootadmin', 'super_admin'].includes(String(role || '').toLowerCase());
}

function normalizeProductId(productId?: string): string {
  const normalized = String(productId || DEFAULT_LICENSE_PRODUCT_ID).trim();
  return normalized || DEFAULT_LICENSE_PRODUCT_ID;
}

function parseFeatures(value: unknown): Record<string, unknown> {
  if (!value) {
    return {};
  }

  if (typeof value === 'object') {
    return value as Record<string, unknown>;
  }

  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function selectRows<T = any[]>(
  sql: string,
  params: any[] = [],
  connection?: PoolConnection
): Promise<T> {
  if (connection) {
    const [rows] = await connection.execute(sql, params);
    return rows as T;
  }

  return query<T>(sql, params);
}

async function runExecute(
  sql: string,
  params: any[] = [],
  connection?: PoolConnection
): Promise<void> {
  if (connection) {
    await connection.execute(sql, params);
    return;
  }

  await dbExecute(sql, params);
}

export function buildLicenseCode(prefix = ''): string {
  const normalizedPrefix = String(prefix || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
  const parts: string[] = [];

  for (let partIndex = 0; partIndex < 4; partIndex += 1) {
    let part = '';
    for (let index = 0; index < 4; index += 1) {
      part += LICENSE_CODE_CHARSET[Math.floor(Math.random() * LICENSE_CODE_CHARSET.length)];
    }
    parts.push(part);
  }

  return normalizedPrefix ? `${normalizedPrefix}-${parts.join('-')}` : parts.join('-');
}

export function normalizeLicenseCode(rawCode: unknown): string {
  const normalized = String(rawCode ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  if (!normalized) {
    throw new AppError(400, '请输入卡密或兑换码。');
  }

  return normalized;
}

export async function generateUniqueLicenseCode(
  prefix = '',
  connection?: PoolConnection,
  localCodes: Set<string> = new Set()
): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const code = buildLicenseCode(prefix);
    const lookupCode = normalizeLicenseCode(code);

    if (localCodes.has(lookupCode)) {
      continue;
    }

    const rows = await selectRows<any[]>(
      'SELECT id FROM license_codes WHERE code = ? LIMIT 1',
      [lookupCode],
      connection
    );

    if (!rows || rows.length === 0) {
      localCodes.add(lookupCode);
      return code;
    }
  }

  throw new AppError(500, '卡密生成失败，请稍后重试。');
}

export async function ensureDefaultProduct(connection?: PoolConnection): Promise<void> {
  if (getDatabaseAdapter() === 'sqlite') {
    await runExecute(
      `INSERT OR IGNORE INTO products (
         id, name, client_key, default_trial_days, offline_valid_days, is_active, created_at, updated_at
       ) VALUES (?, ?, ?, 3, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [DEFAULT_LICENSE_PRODUCT_ID, '凤煌', 'fenghuang-desktop', DEFAULT_OFFLINE_VALID_DAYS],
      connection
    );
    return;
  }

  await runExecute(
    `INSERT INTO products (
       id, name, client_key, default_trial_days, offline_valid_days, is_active, created_at, updated_at
     ) VALUES (?, ?, ?, 3, ?, TRUE, NOW(), NOW())
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       client_key = VALUES(client_key),
       offline_valid_days = VALUES(offline_valid_days),
       is_active = TRUE`,
    [DEFAULT_LICENSE_PRODUCT_ID, '凤煌', 'fenghuang-desktop', DEFAULT_OFFLINE_VALID_DAYS],
    connection
  );
}

async function getProduct(productId: string, connection?: PoolConnection): Promise<Record<string, any>> {
  await ensureDefaultProduct(connection);
  const rows = await selectRows<any[]>('SELECT * FROM products WHERE id = ? LIMIT 1', [productId], connection);
  if (!rows || rows.length === 0) {
    throw new AppError(404, '产品不存在或未配置授权。');
  }
  return rows[0];
}

async function getLegacyDurationEntitlement(userId: string): Promise<Partial<EntitlementRow> | null> {
  const rows = await selectRows<any[]>(
    'SELECT is_permanent, expires_at FROM user_durations WHERE user_id = ? LIMIT 1',
    [userId]
  );

  if (!rows || rows.length === 0) {
    return null;
  }

  const row = rows[0];
  const isPermanent = row.is_permanent === 1 || row.is_permanent === true;
  const expiresAt = parseStoredDateTime(row.expires_at);
  const isValid = isPermanent || (expiresAt && expiresAt.getTime() > Date.now());

  if (!isValid) {
    return null;
  }

  return {
    access_type: isPermanent ? 'permanent' : 'paid',
    is_permanent: isPermanent ? 1 : 0,
    expires_at: expiresAt,
    seat_limit: 1,
    device_limit: 1,
    features: '{}',
  };
}

export async function ensureTrialForUserProduct(
  userId: string,
  productId = DEFAULT_LICENSE_PRODUCT_ID,
  role?: Role,
  connection?: PoolConnection
): Promise<void> {
  const normalizedProductId = normalizeProductId(productId);
  if (isAdminRole(role)) {
    return;
  }

  const product = await getProduct(normalizedProductId, connection);
  const existingRows = await selectRows<any[]>(
    `SELECT *
     FROM user_product_entitlements
     WHERE user_id = ? AND product_id = ?
     LIMIT 1`,
    [userId, normalizedProductId],
    connection
  );

  if (existingRows.length > 0) {
    return;
  }

  if (normalizedProductId === DEFAULT_LICENSE_PRODUCT_ID) {
    const legacy = await getLegacyDurationEntitlement(userId);
    if (legacy) {
      await upsertProductEntitlement(
        {
          userId,
          productId: normalizedProductId,
          accessType: legacy.access_type === 'permanent' ? 'permanent' : 'paid',
          durationDays: 0,
          isPermanent: Boolean(legacy.is_permanent),
          expiresAt: parseStoredDateTime(legacy.expires_at) || null,
          seatLimit: Number(legacy.seat_limit || 1),
          deviceLimit: Number(legacy.device_limit || 1),
          features: parseFeatures(legacy.features),
        },
        connection
      );
      return;
    }
  }

  const trialDays = Math.max(Number(product.default_trial_days || 0), 0);
  if (trialDays <= 0) {
    return;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + trialDays * 86400 * 1000);
  await runExecute(
    `INSERT INTO user_product_entitlements (
       id, user_id, product_id, access_type, expires_at, is_permanent,
       trial_started_at, trial_expires_at, trial_claimed_at,
       seat_limit, device_limit, features, created_at, updated_at
     ) VALUES (?, ?, ?, 'trial', ?, FALSE, ?, ?, ?, 1, 1, '{}', NOW(), NOW())`,
    [uuidv4(), userId, normalizedProductId, expiresAt, now, expiresAt, now],
    connection
  );
}

export async function getProductAccessStatus(
  userId: string,
  productId = DEFAULT_LICENSE_PRODUCT_ID,
  role?: Role
): Promise<ProductAccessStatus> {
  const normalizedProductId = normalizeProductId(productId);
  const product = await getProduct(normalizedProductId);
  const now = new Date();

  const devices = await selectRows<any[]>(
    `SELECT COUNT(*) AS count
     FROM user_devices
     WHERE user_id = ? AND product_id = ? AND status = 'active'`,
    [userId, normalizedProductId]
  );
  const sessions = await selectRows<any[]>(
    `SELECT COUNT(*) AS count
     FROM license_sessions
     WHERE user_id = ? AND product_id = ? AND status = 'active' AND heartbeat_expires_at > ?`,
    [userId, normalizedProductId, now]
  );

  if (isAdminRole(role)) {
    return {
      productId: normalizedProductId,
      accessType: 'admin',
      isTrial: false,
      isPermanent: true,
      trialStartedAt: null,
      trialExpiresAt: null,
      expiresAt: null,
      remainingSeconds: 999999999,
      canEnter: true,
      requiresPurchase: false,
      seatLimit: 999999,
      deviceLimit: 999999,
      activeDeviceCount: Number(devices[0]?.count || 0),
      activeSessionCount: Number(sessions[0]?.count || 0),
      offlineValidDays: Number(product.offline_valid_days || DEFAULT_OFFLINE_VALID_DAYS),
      features: { admin: true },
    };
  }

  await ensureTrialForUserProduct(userId, normalizedProductId, role);

  const rows = await selectRows<EntitlementRow[]>(
    `SELECT *
     FROM user_product_entitlements
     WHERE user_id = ? AND product_id = ?
     LIMIT 1`,
    [userId, normalizedProductId]
  );
  const entitlement = rows[0];

  if (!entitlement) {
    return {
      productId: normalizedProductId,
      accessType: 'none',
      isTrial: false,
      isPermanent: false,
      trialStartedAt: null,
      trialExpiresAt: null,
      expiresAt: null,
      remainingSeconds: 0,
      canEnter: false,
      requiresPurchase: true,
      seatLimit: 0,
      deviceLimit: 0,
      activeDeviceCount: Number(devices[0]?.count || 0),
      activeSessionCount: Number(sessions[0]?.count || 0),
      offlineValidDays: Number(product.offline_valid_days || DEFAULT_OFFLINE_VALID_DAYS),
      features: {},
      reason: 'no_entitlement',
    };
  }

  const isPermanent = entitlement.is_permanent === 1 || entitlement.is_permanent === true;
  const expiresAt = parseStoredDateTime(entitlement.expires_at);
  const trialStartedAt = parseStoredDateTime(entitlement.trial_started_at);
  const trialExpiresAt = parseStoredDateTime(entitlement.trial_expires_at);
  const remainingSeconds = isPermanent
    ? 999999999
    : expiresAt && expiresAt > now
      ? Math.floor((expiresAt.getTime() - now.getTime()) / 1000)
      : 0;
  const canEnter = isPermanent || remainingSeconds > 0;

  return {
    productId: normalizedProductId,
    accessType: canEnter ? (entitlement.access_type || 'paid') : 'none',
    isTrial: canEnter && entitlement.access_type === 'trial',
    isPermanent,
    trialStartedAt,
    trialExpiresAt,
    expiresAt: isPermanent ? null : expiresAt,
    remainingSeconds,
    canEnter,
    requiresPurchase: !canEnter,
    seatLimit: Number(entitlement.seat_limit || 1),
    deviceLimit: Number(entitlement.device_limit || 1),
    activeDeviceCount: Number(devices[0]?.count || 0),
    activeSessionCount: Number(sessions[0]?.count || 0),
    offlineValidDays: Number(product.offline_valid_days || DEFAULT_OFFLINE_VALID_DAYS),
    features: parseFeatures(entitlement.features),
    reason: canEnter ? undefined : 'expired',
  };
}

export async function upsertProductEntitlement(
  input: {
    userId: string;
    productId?: string;
    accessType: 'trial' | 'paid' | 'permanent';
    durationDays: number;
    isPermanent?: boolean;
    expiresAt?: Date | null;
    seatLimit?: number;
    deviceLimit?: number;
    features?: Record<string, unknown>;
  },
  connection?: PoolConnection
): Promise<void> {
  const productId = normalizeProductId(input.productId);
  await getProduct(productId, connection);
  const existingRows = await selectRows<any[]>(
    'SELECT * FROM user_product_entitlements WHERE user_id = ? AND product_id = ? LIMIT 1',
    [input.userId, productId],
    connection
  );
  const isPermanent = Boolean(input.isPermanent || input.accessType === 'permanent');
  const now = new Date();
  const features = JSON.stringify(input.features || {});

  if (existingRows.length === 0) {
    const expiresAt = isPermanent
      ? null
      : input.expiresAt || new Date(now.getTime() + Math.max(input.durationDays, 0) * 86400 * 1000);
    await runExecute(
      `INSERT INTO user_product_entitlements (
         id, user_id, product_id, access_type, expires_at, is_permanent,
         seat_limit, device_limit, features, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        uuidv4(),
        input.userId,
        productId,
        input.accessType,
        expiresAt,
        isPermanent,
        Math.max(Number(input.seatLimit || 1), 1),
        Math.max(Number(input.deviceLimit || 1), 1),
        features,
      ],
      connection
    );
    return;
  }

  const existing = existingRows[0];
  if (existing.is_permanent === 1 || existing.is_permanent === true) {
    return;
  }

  const nextSeatLimit = Math.max(Number(existing.seat_limit || 1), Math.max(Number(input.seatLimit || 1), 1));
  const nextDeviceLimit = Math.max(Number(existing.device_limit || 1), Math.max(Number(input.deviceLimit || 1), 1));
  const existingExpiresAt = parseStoredDateTime(existing.expires_at);
  const baseTime = existingExpiresAt && existingExpiresAt > now ? existingExpiresAt : now;
  const expiresAt = isPermanent
    ? null
    : input.expiresAt || new Date(baseTime.getTime() + Math.max(input.durationDays, 0) * 86400 * 1000);

  await runExecute(
    `UPDATE user_product_entitlements
     SET access_type = ?,
         expires_at = ?,
         is_permanent = ?,
         seat_limit = ?,
         device_limit = ?,
         features = ?,
         updated_at = NOW()
     WHERE user_id = ? AND product_id = ?`,
    [
      input.accessType,
      expiresAt,
      isPermanent,
      nextSeatLimit,
      nextDeviceLimit,
      features,
      input.userId,
      productId,
    ],
    connection
  );
}

export async function activateDeviceForProduct(input: {
  userId: string;
  productId?: string;
  role?: Role;
  deviceId: string;
  deviceName?: string;
}): Promise<ProductAccessStatus & { deviceId: string }> {
  const productId = normalizeProductId(input.productId);
  const deviceId = String(input.deviceId || '').trim();
  if (!deviceId) {
    throw new AppError(400, '设备 ID 不能为空。');
  }

  const status = await getProductAccessStatus(input.userId, productId, input.role);
  if (!status.canEnter) {
    throw new AppError(402, '当前产品权益已过期，请购买或兑换后继续使用。');
  }

  const existingRows = await selectRows<any[]>(
    'SELECT id FROM user_devices WHERE user_id = ? AND product_id = ? AND device_id = ? LIMIT 1',
    [input.userId, productId, deviceId]
  );

  if (existingRows.length === 0 && status.activeDeviceCount >= status.deviceLimit) {
    throw new AppError(403, '设备数量已达到当前套餐上限。');
  }

  if (existingRows.length === 0) {
    await runExecute(
      `INSERT INTO user_devices (
         id, user_id, product_id, device_id, device_name, status, first_activated_at, last_seen_at, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW(), NOW(), NOW())`,
      [uuidv4(), input.userId, productId, deviceId, input.deviceName || null]
    );
  } else {
    await runExecute(
      `UPDATE user_devices
       SET device_name = COALESCE(?, device_name),
           status = 'active',
           last_seen_at = NOW(),
           updated_at = NOW()
       WHERE user_id = ? AND product_id = ? AND device_id = ?`,
      [input.deviceName || null, input.userId, productId, deviceId]
    );
  }

  const nextStatus = await getProductAccessStatus(input.userId, productId, input.role);
  return { ...nextStatus, deviceId };
}

function signLicensePayload(payload: Record<string, unknown>): string {
  const canonical = JSON.stringify(payload);
  return crypto.createHmac('sha256', SIGNING_SECRET).update(canonical).digest('hex');
}

export async function issueLocalLicense(input: {
  userId: string;
  productId?: string;
  role?: Role;
  deviceId: string;
  deviceName?: string;
  sessionId?: string;
}) {
  const activated = await activateDeviceForProduct(input);
  const now = new Date();
  const statusExpiresAt = activated.expiresAt;
  const offlineValidUntil = new Date(
    Math.min(
      now.getTime() + activated.offlineValidDays * 86400 * 1000,
      statusExpiresAt ? statusExpiresAt.getTime() : Number.MAX_SAFE_INTEGER
    )
  );
  const payload = {
    userId: input.userId,
    productId: activated.productId,
    deviceId: activated.deviceId,
    sessionId: input.sessionId || null,
    licenseType: activated.accessType,
    expiresAt: statusExpiresAt ? statusExpiresAt.toISOString() : null,
    offlineValidUntil: offlineValidUntil.toISOString(),
    seatLimit: activated.seatLimit,
    deviceLimit: activated.deviceLimit,
    features: activated.features,
    issuedAt: now.toISOString(),
  };

  return {
    ...payload,
    signature: signLicensePayload(payload),
  };
}

export async function heartbeatLicenseSession(input: {
  userId: string;
  productId?: string;
  role?: Role;
  deviceId: string;
  deviceName?: string;
  sessionId?: string;
}) {
  const productId = normalizeProductId(input.productId);
  const sessionId = input.sessionId || uuidv4();
  const status = await activateDeviceForProduct({ ...input, productId });

  const currentRows = await selectRows<any[]>(
    'SELECT id FROM license_sessions WHERE session_id = ? AND user_id = ? AND product_id = ? LIMIT 1',
    [sessionId, input.userId, productId]
  );
  const activeRows = await selectRows<any[]>(
    `SELECT COUNT(*) AS count
     FROM license_sessions
     WHERE user_id = ? AND product_id = ? AND status = 'active' AND heartbeat_expires_at > ? AND session_id <> ?`,
    [input.userId, productId, new Date(), sessionId]
  );

  if (currentRows.length === 0 && Number(activeRows[0]?.count || 0) >= status.seatLimit) {
    throw new AppError(403, '在线席位已达到当前套餐上限。');
  }

  const heartbeatExpiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  if (currentRows.length === 0) {
    await runExecute(
      `INSERT INTO license_sessions (
         id, session_id, user_id, product_id, device_id, status, started_at,
         last_heartbeat_at, heartbeat_expires_at, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW(), ?, NOW(), NOW())`,
      [uuidv4(), sessionId, input.userId, productId, input.deviceId, heartbeatExpiresAt]
    );
  } else {
    await runExecute(
      `UPDATE license_sessions
       SET device_id = ?,
           status = 'active',
           last_heartbeat_at = NOW(),
           heartbeat_expires_at = ?,
           updated_at = NOW()
       WHERE session_id = ? AND user_id = ? AND product_id = ?`,
      [input.deviceId, heartbeatExpiresAt, sessionId, input.userId, productId]
    );
  }

  return {
    sessionId,
    heartbeatExpiresAt,
    license: await issueLocalLicense({ ...input, productId, sessionId }),
    status: await getProductAccessStatus(input.userId, productId, input.role),
  };
}

export async function releaseLicenseSeat(input: {
  userId: string;
  productId?: string;
  sessionId?: string;
  deviceId?: string;
}): Promise<void> {
  const productId = normalizeProductId(input.productId);
  if (input.sessionId) {
    await runExecute(
      `UPDATE license_sessions
       SET status = 'released', ended_at = NOW(), updated_at = NOW()
       WHERE user_id = ? AND product_id = ? AND session_id = ?`,
      [input.userId, productId, input.sessionId]
    );
    return;
  }

  if (input.deviceId) {
    await runExecute(
      `UPDATE license_sessions
       SET status = 'released', ended_at = NOW(), updated_at = NOW()
       WHERE user_id = ? AND product_id = ? AND device_id = ? AND status = 'active'`,
      [input.userId, productId, input.deviceId]
    );
  }
}

export async function redeemLicenseCodeForUser(input: {
  userId: string;
  productId?: string;
  code: string;
}, connection?: PoolConnection) {
  const productId = normalizeProductId(input.productId);
  const code = normalizeLicenseCode(input.code);
  const rows = await selectRows<any[]>(
    `SELECT *
     FROM license_codes
     WHERE code = ? AND product_id = ?
     LIMIT 1`,
    [code, productId],
    connection
  );

  if (!rows || rows.length === 0) {
    throw new AppError(404, '卡密不存在或不属于当前产品。');
  }

  const card = rows[0];
  const now = new Date();
  const expiredAt = parseStoredDateTime(card.expired_at);
  if (String(card.status || '').toLowerCase() !== 'unused') {
    throw new AppError(400, '该卡密已被使用或不可用。');
  }
  if (expiredAt && expiredAt <= now) {
    await runExecute('UPDATE license_codes SET status = ? WHERE id = ?', ['expired', card.id], connection);
    throw new AppError(400, '该卡密已过期。');
  }

  const durationDays = Number(card.duration_days || 0);
  const isPermanent = card.is_permanent === 1 || card.is_permanent === true;
  await upsertProductEntitlement(
    {
      userId: input.userId,
      productId,
      accessType: isPermanent ? 'permanent' : 'paid',
      durationDays,
      isPermanent,
      seatLimit: Number(card.seat_limit || 1),
      deviceLimit: Number(card.device_limit || 1),
      features: parseFeatures(card.features),
    },
    connection
  );

  const redemptionId = uuidv4();
  await runExecute(
    `INSERT INTO license_code_redemptions (
       id, code_id, code, user_id, product_id, redeemed_at, created_at
     ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
    [redemptionId, card.id, code, input.userId, productId],
    connection
  );
  await runExecute(
    `UPDATE license_codes
     SET status = 'redeemed',
         redeemed_by = ?,
         redeemed_at = NOW(),
         updated_at = NOW()
     WHERE id = ?`,
    [input.userId, card.id],
    connection
  );

  return { redemptionId, productId, durationDays, seatLimit: Number(card.seat_limit || 1), deviceLimit: Number(card.device_limit || 1) };
}

export async function createLicenseCodes(input: {
  productId?: string;
  planName?: string;
  durationDays: number;
  seatLimit: number;
  deviceLimit: number;
  quantity: number;
  prefix?: string;
  generatedBy?: string;
  note?: string;
  expiresInDays?: number;
  isPermanent?: boolean;
}) {
  const productId = normalizeProductId(input.productId);
  await getProduct(productId);
  const quantity = Math.min(Math.max(Math.floor(Number(input.quantity || 1)), 1), 500);
  const localCodes = new Set<string>();
  const codes: string[] = [];
  const expiredAt = input.expiresInDays
    ? new Date(Date.now() + Math.max(Number(input.expiresInDays), 1) * 86400 * 1000)
    : null;

  for (let index = 0; index < quantity; index += 1) {
    const displayCode = await generateUniqueLicenseCode(input.prefix, undefined, localCodes);
    const code = normalizeLicenseCode(displayCode);
    await runExecute(
      `INSERT INTO license_codes (
         id, code, display_code, product_id, plan_name, duration_days, seat_limit, device_limit,
         is_permanent, status, features, generated_by, note, expired_at, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'unused', '{}', ?, ?, ?, NOW(), NOW())`,
      [
        uuidv4(),
        code,
        displayCode,
        productId,
        input.planName || null,
        Math.max(Number(input.durationDays || 0), 0),
        Math.max(Number(input.seatLimit || 1), 1),
        Math.max(Number(input.deviceLimit || 1), 1),
        Boolean(input.isPermanent),
        input.generatedBy || null,
        input.note || null,
        expiredAt,
      ]
    );
    codes.push(displayCode);
  }

  return codes;
}
