import type { PoolConnection } from '../config/database.js';
import { execute as dbExecute, query } from '../config/database.js';

export type DurationUnit = 'hour' | 'day' | 'month' | 'year' | 'permanent';

export interface DurationAccessStatus {
  hasRecord: boolean;
  hasValidDuration: boolean;
  canEnter: boolean;
  isPermanent: boolean;
  remainingSeconds: number;
  expiresAt: Date | null;
}

const SQLITE_UTC_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

export function parseStoredDateTime(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const normalized = SQLITE_UTC_DATETIME_PATTERN.test(trimmed)
      ? `${trimmed.replace(' ', 'T')}Z`
      : trimmed;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value as string | number);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function durationToSeconds(duration: number, unit: DurationUnit): number {
  switch (unit) {
    case 'hour':
      return duration * 3600;
    case 'day':
      return duration * 86400;
    case 'month':
      return duration * 30 * 86400;
    case 'year':
      return duration * 365 * 86400;
    case 'permanent':
      return 0;
    default:
      return duration * 86400;
  }
}

export async function getDurationAccessStatus(userId: string): Promise<DurationAccessStatus> {
  const rows = await query<any[]>(
    `SELECT is_active, is_permanent, expires_at
     FROM user_durations
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );

  if (!rows || rows.length === 0) {
    return {
      hasRecord: false,
      hasValidDuration: false,
      canEnter: false,
      isPermanent: false,
      remainingSeconds: 0,
      expiresAt: null,
    };
  }

  const duration = rows[0] as any;
  const isPermanent = duration.is_permanent === 1 || duration.is_permanent === true;

  if (isPermanent) {
    return {
      hasRecord: true,
      hasValidDuration: true,
      canEnter: true,
      isPermanent: true,
      remainingSeconds: 999999999,
      expiresAt: null,
    };
  }

  const expiresAt = parseStoredDateTime(duration.expires_at);
  const now = Date.now();
  const remainingSeconds =
    expiresAt && expiresAt.getTime() > now
      ? Math.floor((expiresAt.getTime() - now) / 1000)
      : 0;
  const canEnter = remainingSeconds > 0;

  if (!canEnter && (duration.is_active === 1 || duration.is_active === true)) {
    await query('UPDATE user_durations SET is_active = FALSE WHERE user_id = ?', [userId]);
  }

  return {
    hasRecord: true,
    hasValidDuration: canEnter,
    canEnter,
    isPermanent: false,
    remainingSeconds,
    expiresAt,
  };
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

export async function grantDurationToUser(
  userId: string,
  duration: number,
  unit: DurationUnit,
  connection?: PoolConnection
): Promise<void> {
  if (unit === 'permanent') {
    const existingRows = await selectRows<any[]>('SELECT * FROM user_durations WHERE user_id = ?', [userId], connection);

    if (!existingRows || existingRows.length === 0) {
      await runExecute(
        `INSERT INTO user_durations (
          user_id, total_duration, remaining_duration, is_active, is_permanent, activated_at, expires_at
        ) VALUES (?, 0, 0, TRUE, TRUE, NOW(), NULL)`,
        [userId],
        connection
      );
      return;
    }

    await runExecute(
      `UPDATE user_durations
       SET is_active = TRUE,
           is_permanent = TRUE,
           activated_at = COALESCE(activated_at, NOW()),
           expires_at = NULL
       WHERE user_id = ?`,
      [userId],
      connection
    );
    return;
  }

  const durationSeconds = durationToSeconds(duration, unit);
  const existingRows = await selectRows<any[]>('SELECT * FROM user_durations WHERE user_id = ?', [userId], connection);

  if (!existingRows || existingRows.length === 0) {
    const expiresAt = new Date(Date.now() + durationSeconds * 1000);
    await runExecute(
      `INSERT INTO user_durations (user_id, total_duration, remaining_duration, is_active, activated_at, expires_at)
       VALUES (?, ?, ?, TRUE, NOW(), ?)`,
      [userId, durationSeconds, durationSeconds, expiresAt],
      connection
    );
    return;
  }

  const existing = existingRows[0] as any;

  if (existing.is_permanent === 1 || existing.is_permanent === true) {
    return;
  }

  const newRemaining = Number(existing.remaining_duration || 0) + durationSeconds;
  const newTotal = Number(existing.total_duration || 0) + durationSeconds;
  const now = new Date();
  const existingExpiresAt = parseStoredDateTime(existing.expires_at);
  const baseTime =
    existingExpiresAt && existingExpiresAt > now
      ? existingExpiresAt
      : now;
  const newExpiresAt = new Date(baseTime.getTime() + durationSeconds * 1000);

  await runExecute(
    `UPDATE user_durations
     SET total_duration = ?,
         remaining_duration = ?,
         is_active = TRUE,
         activated_at = COALESCE(activated_at, NOW()),
         expires_at = ?
     WHERE user_id = ?`,
    [newTotal, newRemaining, newExpiresAt, userId],
    connection
  );
}
