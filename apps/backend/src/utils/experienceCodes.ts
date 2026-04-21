import type { PoolConnection } from '../config/database.js';
import { execute as dbExecute, query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export type ExperienceCodeRewardType = 'points_75_day_1' | 'points_150_day_7';
export type ExperienceCodeStatus = 'unused' | 'activated' | 'expired' | 'revoked';

export interface ExperienceCodePreset {
  type: ExperienceCodeRewardType;
  name: string;
  label: string;
  description: string;
  pointsReward: number;
  durationDays: number;
  expiresInDays: number;
}

export const EXPERIENCE_CODE_PRESETS: ExperienceCodePreset[] = [
  {
    type: 'points_75_day_1',
    name: '1天体验码',
    label: '75积分（1天）',
    description: '兑换后发放 75 积分，并追加 1 天体验时长。',
    pointsReward: 75,
    durationDays: 1,
    expiresInDays: 7,
  },
  {
    type: 'points_150_day_7',
    name: '7天体验码',
    label: '150积分（7天）',
    description: '兑换后发放 150 积分，并追加 7 天体验时长。',
    pointsReward: 150,
    durationDays: 7,
    expiresInDays: 7,
  },
];

const EXPERIENCE_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

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

export function normalizeExperienceCodeRewardType(value: unknown): ExperienceCodeRewardType {
  const normalized = String(value ?? '').trim().toLowerCase();
  const preset = EXPERIENCE_CODE_PRESETS.find((item) => item.type === normalized);
  if (!preset) {
    throw new AppError(400, '无效的兑换码类型。');
  }

  return preset.type;
}

export function getExperienceCodePreset(type: ExperienceCodeRewardType): ExperienceCodePreset {
  const preset = EXPERIENCE_CODE_PRESETS.find((item) => item.type === type);
  if (!preset) {
    throw new AppError(400, '无效的兑换码类型。');
  }

  return preset;
}

export function normalizeExperienceCode(rawCode: unknown): string {
  const normalized = String(rawCode ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  if (!normalized) {
    throw new AppError(400, '请输入兑换码。');
  }

  return normalized;
}

export function buildExperienceCodeBatchNo(): string {
  return `BATCH${Date.now().toString(36).toUpperCase()}`;
}

export function buildExperienceCodeExpiry(preset: ExperienceCodePreset, now: Date = new Date()): Date {
  return new Date(now.getTime() + preset.expiresInDays * 24 * 60 * 60 * 1000);
}

export function normalizeExperienceCodePrefix(value: unknown): string {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);

  return normalized;
}

export function maskExperienceCode(code: string): string {
  if (code.length <= 6) {
    return code;
  }

  return `${code.slice(0, 3)}***${code.slice(-3)}`;
}

export async function markExpiredExperienceCodes(connection?: PoolConnection): Promise<void> {
  await runExecute(
    `UPDATE experience_redeem_codes
     SET status = 'expired'
     WHERE status = 'unused'
       AND expired_at IS NOT NULL
       AND expired_at < ?`,
    [new Date()],
    connection
  );
}

export async function generateUniqueExperienceCode(
  connection?: PoolConnection,
  localCodes: Set<string> = new Set(),
  prefix: string = ''
): Promise<string> {
  const normalizedPrefix = normalizeExperienceCodePrefix(prefix);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    let coreCode = '';
    for (let index = 0; index < 4; index += 1) {
      if (index > 0) {
        coreCode += '-';
      }

      for (let partIndex = 0; partIndex < 4; partIndex += 1) {
        const randomIndex = Math.floor(Math.random() * EXPERIENCE_CODE_CHARSET.length);
        coreCode += EXPERIENCE_CODE_CHARSET[randomIndex];
      }
    }

    const code = normalizedPrefix ? `${normalizedPrefix}-${coreCode}` : coreCode;

    if (localCodes.has(code)) {
      continue;
    }

    const rows = connection
      ? ((await connection.execute('SELECT id FROM experience_redeem_codes WHERE code = ? LIMIT 1', [code]))[0] as any[])
      : await query<any[]>('SELECT id FROM experience_redeem_codes WHERE code = ? LIMIT 1', [code]);

    if (!rows || rows.length === 0) {
      localCodes.add(code);
      return code;
    }
  }

  throw new AppError(500, '兑换码生成失败，请稍后重试。');
}
