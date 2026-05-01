import { randomUUID } from 'crypto';
import type { PoolConnection, RowDataPacket } from '../config/database.js';
import { execute as dbExecute, getDatabaseAdapter, query, transaction } from '../config/database.js';
import { insertPointsRecord } from './pointsRecord.js';

export type CommissionRewardMode = 'fixed' | 'rate';
export type WithdrawalStatus = 'pending_review' | 'approved' | 'paid' | 'rejected';

export interface ReferralCommissionRule {
  code: string;
  name: string;
  minAmount: number;
  maxAmount: number | null;
  rewardMode: CommissionRewardMode;
  rewardValue: number;
  boostEnabled: boolean;
  boostRewardMode?: CommissionRewardMode | null;
  boostRewardValue?: number | null;
}

export interface ReferralSettings {
  settlementDays: number;
  withdrawThresholdDiamonds: number;
  diamondToPointsRate: number;
  recruitBoostPaidUsers: number;
  recruitBoostRate: number;
  withdrawalNotice: string;
  commissionRules: ReferralCommissionRule[];
}

export interface DiamondAccountSummary {
  availableDiamonds: number;
  pendingDiamonds: number;
  frozenDiamonds: number;
  totalEarnedDiamonds: number;
  totalWithdrawnDiamonds: number;
  totalInvites: number;
  paidInvites: number;
  nextBoostRemaining: number;
}

export interface PayoutProfileInput {
  realName: string;
  payoutMethod: 'wechat' | 'alipay';
  payoutAccount: string;
  identityNo?: string | null;
  phone?: string | null;
  note?: string | null;
}

export interface PayoutProfile extends PayoutProfileInput {
  userId: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface WithdrawalPreview {
  diamonds: number;
  grossAmount: number;
  taxableBase: number;
  taxRate: number;
  quickDeduction: number;
  taxAmount: number;
  netAmount: number;
  thresholdDiamonds: number;
  thresholdAmount: number;
  notice: string;
}

export interface RechargeCommissionOptions {
  orderAmount?: number;
  productName?: string | null;
  connection?: PoolConnection;
}

const DIAMOND_SCALE = 100;
const DEFAULT_SETTLEMENT_DAYS = 3;
const DEFAULT_WITHDRAW_THRESHOLD_DIAMONDS = 100 * DIAMOND_SCALE;
const DEFAULT_DIAMOND_TO_POINTS_RATE = 1;
const DEFAULT_RECRUIT_BOOST_USERS = 5;
const DEFAULT_RECRUIT_BOOST_RATE = 0.5;

const DEFAULT_COMMISSION_RULES: ReferralCommissionRule[] = [
  {
    code: 'trial-8h',
    name: '8小时卡',
    minAmount: 0,
    maxAmount: 9.9,
    rewardMode: 'fixed',
    rewardValue: 0,
    boostEnabled: true,
    boostRewardMode: 'rate',
    boostRewardValue: 0.5,
  },
  {
    code: 'daily-1d',
    name: '日卡',
    minAmount: 14.9,
    maxAmount: 14.9,
    rewardMode: 'fixed',
    rewardValue: 0.2,
    boostEnabled: true,
    boostRewardMode: 'rate',
    boostRewardValue: 0.5,
  },
  {
    code: 'weekly-7d',
    name: '周卡',
    minAmount: 29.9,
    maxAmount: 29.9,
    rewardMode: 'fixed',
    rewardValue: 0.4,
    boostEnabled: true,
    boostRewardMode: 'rate',
    boostRewardValue: 0.5,
  },
  {
    code: 'monthly-plus',
    name: '月卡及以上',
    minAmount: 79.9,
    maxAmount: null,
    rewardMode: 'rate',
    rewardValue: 0.5,
    boostEnabled: false,
    boostRewardMode: null,
    boostRewardValue: null,
  },
];

const DEFAULT_REFERRAL_SETTINGS: ReferralSettings = {
  settlementDays: DEFAULT_SETTLEMENT_DAYS,
  withdrawThresholdDiamonds: DEFAULT_WITHDRAW_THRESHOLD_DIAMONDS,
  diamondToPointsRate: DEFAULT_DIAMOND_TO_POINTS_RATE,
  recruitBoostPaidUsers: DEFAULT_RECRUIT_BOOST_USERS,
  recruitBoostRate: DEFAULT_RECRUIT_BOOST_RATE,
  withdrawalNotice:
    '钻石按 T+3 结算，可用钻石满 100 元对应额度后才可申请提现。提现会按劳务报酬预扣预缴规则试算税费，后台人工审核并手工打款。',
  commissionRules: DEFAULT_COMMISSION_RULES,
};

let tablesReady = false;

function toNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function amountToDiamonds(amount: number): number {
  return Math.max(0, Math.round(toNumber(amount) * DIAMOND_SCALE));
}

export function diamondsToAmount(diamonds: number): number {
  return Number((toNumber(diamonds) / DIAMOND_SCALE).toFixed(2));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + Math.max(0, days) * 24 * 60 * 60 * 1000);
}

function isIgnorableAlterError(error: unknown): boolean {
  const message = String((error as Error | undefined)?.message || '').toLowerCase();
  return (
    message.includes('duplicate column') ||
    message.includes('already exists') ||
    message.includes('duplicate key name') ||
    message.includes('multiple primary key') ||
    message.includes('check that column/key exists')
  );
}

async function selectRows<T = RowDataPacket[]>(
  sql: string,
  params: any[] = [],
  connection?: PoolConnection,
): Promise<T> {
  if (connection) {
    const [rows] = await connection.execute(sql, params);
    return rows as T;
  }

  return query<T>(sql, params);
}

async function runExecute(sql: string, params: any[] = [], connection?: PoolConnection): Promise<void> {
  if (connection) {
    await connection.execute(sql, params);
    return;
  }

  await dbExecute(sql, params);
}

async function safeExecute(sql: string, params: any[] = [], connection?: PoolConnection): Promise<void> {
  try {
    await runExecute(sql, params, connection);
  } catch (error) {
    if (isIgnorableAlterError(error)) {
      return;
    }
    throw error;
  }
}

function normalizeRule(raw: Partial<ReferralCommissionRule> | null | undefined): ReferralCommissionRule | null {
  if (!raw || !raw.code || !raw.name) {
    return null;
  }

  const rewardMode: CommissionRewardMode = raw.rewardMode === 'rate' ? 'rate' : 'fixed';
  const boostRewardMode: CommissionRewardMode | null =
    raw.boostRewardMode === 'fixed' || raw.boostRewardMode === 'rate'
      ? raw.boostRewardMode
      : null;

  return {
    code: String(raw.code),
    name: String(raw.name),
    minAmount: Number(raw.minAmount ?? 0),
    maxAmount:
      raw.maxAmount === undefined || raw.maxAmount === null ? null : Number(raw.maxAmount),
    rewardMode,
    rewardValue: Number(raw.rewardValue ?? 0),
    boostEnabled: Boolean(raw.boostEnabled),
    boostRewardMode,
    boostRewardValue:
      raw.boostRewardValue === undefined || raw.boostRewardValue === null
        ? null
        : Number(raw.boostRewardValue),
  };
}

function normalizeCommissionRules(value: unknown): ReferralCommissionRule[] {
  if (!Array.isArray(value)) {
    return DEFAULT_COMMISSION_RULES;
  }

  const rules = value
    .map((item) => normalizeRule(item as Partial<ReferralCommissionRule>))
    .filter(Boolean) as ReferralCommissionRule[];

  return rules.length > 0 ? rules : DEFAULT_COMMISSION_RULES;
}

function buildInClause(values: Array<string | number>): string {
  return values.map(() => '?').join(', ');
}

function matchCommissionRule(
  orderAmount: number,
  paidInviteCount: number,
  settings: ReferralSettings,
): {
  rule: ReferralCommissionRule;
  rewardMode: CommissionRewardMode;
  rewardValue: number;
  boosted: boolean;
} | null {
  const epsilon = 0.011;
  const normalizedAmount = Number(orderAmount.toFixed(2));
  const rule =
    settings.commissionRules.find((item) => {
      const minMatched = normalizedAmount + epsilon >= item.minAmount;
      const maxMatched = item.maxAmount === null || normalizedAmount <= item.maxAmount + epsilon;
      return minMatched && maxMatched;
    }) || null;

  if (!rule) {
    return null;
  }

  const boosted =
    rule.boostEnabled &&
    paidInviteCount >= settings.recruitBoostPaidUsers &&
    rule.boostRewardMode !== null &&
    rule.boostRewardValue !== null;

  return {
    rule,
    rewardMode: boosted ? (rule.boostRewardMode as CommissionRewardMode) : rule.rewardMode,
    rewardValue: boosted ? Number(rule.boostRewardValue || 0) : rule.rewardValue,
    boosted,
  };
}

function calculateRewardDiamonds(
  orderAmount: number,
  rewardMode: CommissionRewardMode,
  rewardValue: number,
): number {
  if (rewardMode === 'rate') {
    return amountToDiamonds(orderAmount * rewardValue);
  }

  return amountToDiamonds(rewardValue);
}

function calculateLaborServiceTax(grossAmount: number): Omit<WithdrawalPreview, 'diamonds' | 'thresholdDiamonds' | 'thresholdAmount' | 'notice'> {
  const gross = Number(grossAmount.toFixed(2));
  let taxableBase = 0;

  if (gross <= 4000) {
    taxableBase = Math.max(0, gross - 800);
  } else {
    taxableBase = Number((gross * 0.8).toFixed(2));
  }

  let taxRate = 0.2;
  let quickDeduction = 0;

  if (taxableBase > 50000) {
    taxRate = 0.4;
    quickDeduction = 7000;
  } else if (taxableBase > 20000) {
    taxRate = 0.3;
    quickDeduction = 2000;
  }

  const taxAmount =
    taxableBase <= 0 ? 0 : Math.max(0, Number((taxableBase * taxRate - quickDeduction).toFixed(2)));
  const netAmount = Number((gross - taxAmount).toFixed(2));

  return {
    grossAmount: gross,
    taxableBase: Number(taxableBase.toFixed(2)),
    taxRate,
    quickDeduction,
    taxAmount,
    netAmount,
  };
}

async function insertDiamondLedger(
  userId: string,
  source: string,
  direction: 'credit' | 'debit',
  accountType: 'pending' | 'available' | 'frozen',
  diamonds: number,
  description: string,
  relatedOrderId?: string | null,
  relatedUserId?: string | null,
  metadata?: Record<string, unknown> | null,
  connection?: PoolConnection,
): Promise<void> {
  if (!diamonds) {
    return;
  }

  await runExecute(
    `INSERT INTO diamond_ledger (
      id,
      user_id,
      source,
      direction,
      account_type,
      diamonds,
      amount,
      related_order_id,
      related_user_id,
      description,
      metadata,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      randomUUID(),
      userId,
      source,
      direction,
      accountType,
      diamonds,
      diamondsToAmount(diamonds),
      relatedOrderId || null,
      relatedUserId || null,
      description,
      metadata ? JSON.stringify(metadata) : null,
    ],
    connection,
  );
}

async function resolveOrderMeta(
  orderId: string,
  connection?: PoolConnection,
): Promise<{ amount: number; productName: string | null } | null> {
  const rechargeRows = await selectRows<any[]>(
    `SELECT amount, product_name
     FROM recharge_orders
     WHERE id = ?
     LIMIT 1`,
    [orderId],
    connection,
  );

  if (rechargeRows.length > 0) {
    return {
      amount: toNumber(rechargeRows[0].amount),
      productName: rechargeRows[0].product_name ? String(rechargeRows[0].product_name) : null,
    };
  }

  const legacyRows = await selectRows<any[]>(
    `SELECT o.amount, COALESCE(o.package_name, rp.name, 'Recharge Order') AS product_name
     FROM orders o
     LEFT JOIN recharge_packages rp ON rp.id = o.package_id
     WHERE o.id = ?
     LIMIT 1`,
    [orderId],
    connection,
  );

  if (legacyRows.length > 0) {
    return {
      amount: toNumber(legacyRows[0].amount),
      productName: legacyRows[0].product_name ? String(legacyRows[0].product_name) : null,
    };
  }

  return null;
}

async function getDistinctPaidInviteCount(
  referrerId: string,
  connection?: PoolConnection,
): Promise<number> {
  const rows = await selectRows<any[]>(
    `SELECT COUNT(DISTINCT referee_id) AS total
     FROM referrals
     WHERE referrer_id = ? AND referee_type = 'paid'`,
    [referrerId],
    connection,
  );

  return Number(rows[0]?.total || 0);
}

async function settleDueReferralDiamondsForUserInternal(
  userId: string,
  connection?: PoolConnection,
): Promise<number> {
  await ensureReferralProgramTables(connection);

  const dueRows = await selectRows<any[]>(
    `SELECT id, reward_amount
     FROM referrals
     WHERE referrer_id = ?
       AND reward_type = 'diamond'
       AND reward_status = 'pending'
       AND reward_amount > 0
       AND available_at IS NOT NULL
       AND available_at <= NOW()
     ORDER BY created_at ASC`,
    [userId],
    connection,
  );

  if (dueRows.length === 0) {
    return 0;
  }

  const ids = dueRows.map((item) => item.id);
  const totalDiamonds = dueRows.reduce((sum, item) => sum + Number(item.reward_amount || 0), 0);

  await runExecute(
    `UPDATE users
     SET diamond_pending = CASE
           WHEN COALESCE(diamond_pending, 0) >= ? THEN COALESCE(diamond_pending, 0) - ?
           ELSE 0
         END,
         diamond_available = COALESCE(diamond_available, 0) + ?
     WHERE id = ?`,
    [totalDiamonds, totalDiamonds, totalDiamonds, userId],
    connection,
  );

  await runExecute(
    `UPDATE referrals
     SET reward_status = 'settled',
         settled_at = NOW()
     WHERE id IN (${buildInClause(ids)})`,
    ids,
    connection,
  );

  await insertDiamondLedger(
    userId,
    'commission_settlement',
    'credit',
    'available',
    totalDiamonds,
    'Referral commission settled and moved to available diamonds.',
    null,
    null,
    {
      referralCount: dueRows.length,
    },
    connection,
  );

  return totalDiamonds;
}

export async function settleDueReferralDiamondsForUser(
  userId: string,
  connection?: PoolConnection,
): Promise<number> {
  if (!connection) {
    return transaction(async (tx) => settleDueReferralDiamondsForUserInternal(userId, tx));
  }

  return settleDueReferralDiamondsForUserInternal(userId, connection);
}

export async function ensureReferralProgramTables(connection?: PoolConnection): Promise<void> {
  if (tablesReady && !connection) {
    return;
  }

  if (getDatabaseAdapter() === 'sqlite') {
    await runExecute(
      `CREATE TABLE IF NOT EXISTS referral_settings (
        id INTEGER PRIMARY KEY,
        inviter_points INTEGER NOT NULL DEFAULT 0,
        invitee_points INTEGER NOT NULL DEFAULT 0,
        recharge_commission_rate REAL NOT NULL DEFAULT 0,
        milestone_rewards TEXT NOT NULL DEFAULT '[]',
        leaderboard_rewards TEXT,
        settlement_days INTEGER NOT NULL DEFAULT 3,
        withdraw_threshold_diamonds INTEGER NOT NULL DEFAULT 10000,
        diamond_to_points_rate INTEGER NOT NULL DEFAULT 1,
        recruit_boost_paid_users INTEGER NOT NULL DEFAULT 5,
        recruit_boost_rate REAL NOT NULL DEFAULT 0.5,
        commission_rules TEXT NOT NULL DEFAULT '[]',
        withdrawal_notice TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      [],
      connection,
    );

    await runExecute(
      `CREATE TABLE IF NOT EXISTS diamond_ledger (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        source TEXT NOT NULL,
        direction TEXT NOT NULL,
        account_type TEXT NOT NULL,
        diamonds INTEGER NOT NULL DEFAULT 0,
        amount REAL NOT NULL DEFAULT 0,
        related_order_id TEXT,
        related_user_id TEXT,
        description TEXT,
        metadata TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      [],
      connection,
    );

    await runExecute(
      `CREATE TABLE IF NOT EXISTS withdraw_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        diamonds INTEGER NOT NULL,
        gross_amount REAL NOT NULL,
        taxable_base REAL NOT NULL DEFAULT 0,
        tax_rate REAL NOT NULL DEFAULT 0,
        quick_deduction REAL NOT NULL DEFAULT 0,
        tax_amount REAL NOT NULL DEFAULT 0,
        net_amount REAL NOT NULL DEFAULT 0,
        payout_method TEXT NOT NULL,
        payout_account TEXT NOT NULL,
        payout_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending_review',
        note TEXT,
        reviewed_by TEXT,
        reviewed_at TEXT,
        paid_at TEXT,
        payment_reference TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      [],
      connection,
    );

    await runExecute(
      `CREATE TABLE IF NOT EXISTS user_payout_profiles (
        user_id TEXT PRIMARY KEY,
        real_name TEXT NOT NULL,
        payout_method TEXT NOT NULL,
        payout_account TEXT NOT NULL,
        identity_no TEXT,
        phone TEXT,
        note TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      [],
      connection,
    );
  } else {
    await runExecute(
      `CREATE TABLE IF NOT EXISTS referral_settings (
        id INT PRIMARY KEY,
        inviter_points INT NOT NULL DEFAULT 0,
        invitee_points INT NOT NULL DEFAULT 0,
        recharge_commission_rate DECIMAL(6,4) NOT NULL DEFAULT 0,
        milestone_rewards LONGTEXT NOT NULL,
        leaderboard_rewards LONGTEXT NULL,
        settlement_days INT NOT NULL DEFAULT 3,
        withdraw_threshold_diamonds INT NOT NULL DEFAULT 10000,
        diamond_to_points_rate INT NOT NULL DEFAULT 1,
        recruit_boost_paid_users INT NOT NULL DEFAULT 5,
        recruit_boost_rate DECIMAL(6,4) NOT NULL DEFAULT 0.5000,
        commission_rules LONGTEXT NOT NULL,
        withdrawal_notice LONGTEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      [],
      connection,
    );

    await runExecute(
      `CREATE TABLE IF NOT EXISTS diamond_ledger (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        source VARCHAR(64) NOT NULL,
        direction VARCHAR(20) NOT NULL,
        account_type VARCHAR(20) NOT NULL,
        diamonds INT NOT NULL DEFAULT 0,
        amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        related_order_id VARCHAR(64) NULL,
        related_user_id VARCHAR(64) NULL,
        description VARCHAR(255) NULL,
        metadata LONGTEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        KEY idx_diamond_ledger_user_created (user_id, created_at)
      )`,
      [],
      connection,
    );

    await runExecute(
      `CREATE TABLE IF NOT EXISTS withdraw_requests (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        diamonds INT NOT NULL,
        gross_amount DECIMAL(12,2) NOT NULL,
        taxable_base DECIMAL(12,2) NOT NULL DEFAULT 0,
        tax_rate DECIMAL(6,4) NOT NULL DEFAULT 0,
        quick_deduction DECIMAL(12,2) NOT NULL DEFAULT 0,
        tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        net_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        payout_method VARCHAR(20) NOT NULL,
        payout_account VARCHAR(128) NOT NULL,
        payout_name VARCHAR(64) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending_review',
        note VARCHAR(255) NULL,
        reviewed_by VARCHAR(64) NULL,
        reviewed_at DATETIME NULL,
        paid_at DATETIME NULL,
        payment_reference VARCHAR(128) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_withdraw_user_created (user_id, created_at),
        KEY idx_withdraw_status_created (status, created_at)
      )`,
      [],
      connection,
    );

    await runExecute(
      `CREATE TABLE IF NOT EXISTS user_payout_profiles (
        user_id VARCHAR(64) PRIMARY KEY,
        real_name VARCHAR(64) NOT NULL,
        payout_method VARCHAR(20) NOT NULL,
        payout_account VARCHAR(128) NOT NULL,
        identity_no VARCHAR(64) NULL,
        phone VARCHAR(32) NULL,
        note VARCHAR(255) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      [],
      connection,
    );
  }

  await safeExecute(
    `ALTER TABLE users ADD COLUMN diamond_available ${
      getDatabaseAdapter() === 'sqlite' ? 'INTEGER' : 'INT'
    } NOT NULL DEFAULT 0`,
    [],
    connection,
  );
  await safeExecute(
    `ALTER TABLE users ADD COLUMN diamond_pending ${
      getDatabaseAdapter() === 'sqlite' ? 'INTEGER' : 'INT'
    } NOT NULL DEFAULT 0`,
    [],
    connection,
  );
  await safeExecute(
    `ALTER TABLE users ADD COLUMN diamond_frozen ${
      getDatabaseAdapter() === 'sqlite' ? 'INTEGER' : 'INT'
    } NOT NULL DEFAULT 0`,
    [],
    connection,
  );
  await safeExecute(
    `ALTER TABLE users ADD COLUMN diamond_total_earned ${
      getDatabaseAdapter() === 'sqlite' ? 'INTEGER' : 'INT'
    } NOT NULL DEFAULT 0`,
    [],
    connection,
  );
  await safeExecute(
    `ALTER TABLE users ADD COLUMN diamond_total_withdrawn ${
      getDatabaseAdapter() === 'sqlite' ? 'INTEGER' : 'INT'
    } NOT NULL DEFAULT 0`,
    [],
    connection,
  );

  await safeExecute(
    `ALTER TABLE referrals ADD COLUMN gross_order_amount ${
      getDatabaseAdapter() === 'sqlite' ? 'REAL' : 'DECIMAL(12,2)'
    } NULL`,
    [],
    connection,
  );
  await safeExecute(
    `ALTER TABLE referrals ADD COLUMN commission_mode ${
      getDatabaseAdapter() === 'sqlite' ? 'TEXT' : 'VARCHAR(20)'
    } NULL`,
    [],
    connection,
  );
  await safeExecute(
    `ALTER TABLE referrals ADD COLUMN commission_value ${
      getDatabaseAdapter() === 'sqlite' ? 'REAL' : 'DECIMAL(12,4)'
    } NULL`,
    [],
    connection,
  );
  await safeExecute(
    `ALTER TABLE referrals ADD COLUMN available_at ${
      getDatabaseAdapter() === 'sqlite' ? 'TEXT' : 'DATETIME'
    } NULL`,
    [],
    connection,
  );
  await safeExecute(
    `ALTER TABLE referrals ADD COLUMN settled_at ${
      getDatabaseAdapter() === 'sqlite' ? 'TEXT' : 'DATETIME'
    } NULL`,
    [],
    connection,
  );
  await safeExecute(
    `ALTER TABLE referrals ADD COLUMN metadata ${
      getDatabaseAdapter() === 'sqlite' ? 'TEXT' : 'LONGTEXT'
    } NULL`,
    [],
    connection,
  );

  await safeExecute(
    `ALTER TABLE referral_settings ADD COLUMN settlement_days ${
      getDatabaseAdapter() === 'sqlite' ? 'INTEGER' : 'INT'
    } NOT NULL DEFAULT 3`,
    [],
    connection,
  );
  await safeExecute(
    `ALTER TABLE referral_settings ADD COLUMN withdraw_threshold_diamonds ${
      getDatabaseAdapter() === 'sqlite' ? 'INTEGER' : 'INT'
    } NOT NULL DEFAULT 10000`,
    [],
    connection,
  );
  await safeExecute(
    `ALTER TABLE referral_settings ADD COLUMN diamond_to_points_rate ${
      getDatabaseAdapter() === 'sqlite' ? 'INTEGER' : 'INT'
    } NOT NULL DEFAULT 1`,
    [],
    connection,
  );
  await safeExecute(
    `ALTER TABLE referral_settings ADD COLUMN recruit_boost_paid_users ${
      getDatabaseAdapter() === 'sqlite' ? 'INTEGER' : 'INT'
    } NOT NULL DEFAULT 5`,
    [],
    connection,
  );
  await safeExecute(
    `ALTER TABLE referral_settings ADD COLUMN recruit_boost_rate ${
      getDatabaseAdapter() === 'sqlite' ? 'REAL' : 'DECIMAL(6,4)'
    } NOT NULL DEFAULT 0.5`,
    [],
    connection,
  );
  await safeExecute(
    `ALTER TABLE referral_settings ADD COLUMN commission_rules ${
      getDatabaseAdapter() === 'sqlite' ? "TEXT NOT NULL DEFAULT '[]'" : 'LONGTEXT NULL'
    }`,
    [],
    connection,
  );
  await safeExecute(
    `ALTER TABLE referral_settings ADD COLUMN withdrawal_notice ${
      getDatabaseAdapter() === 'sqlite' ? 'TEXT' : 'LONGTEXT'
    } NULL`,
    [],
    connection,
  );

  const existingSettings = await selectRows<any[]>(
    'SELECT id FROM referral_settings WHERE id = 1 LIMIT 1',
    [],
    connection,
  );

  if (existingSettings.length === 0) {
    await runExecute(
      `INSERT INTO referral_settings (
        id,
        inviter_points,
        invitee_points,
        recharge_commission_rate,
        milestone_rewards,
        leaderboard_rewards,
        settlement_days,
        withdraw_threshold_diamonds,
        diamond_to_points_rate,
        recruit_boost_paid_users,
        recruit_boost_rate,
        commission_rules,
        withdrawal_notice
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        0,
        0,
        0,
        JSON.stringify([]),
        '',
        DEFAULT_REFERRAL_SETTINGS.settlementDays,
        DEFAULT_REFERRAL_SETTINGS.withdrawThresholdDiamonds,
        DEFAULT_REFERRAL_SETTINGS.diamondToPointsRate,
        DEFAULT_REFERRAL_SETTINGS.recruitBoostPaidUsers,
        DEFAULT_REFERRAL_SETTINGS.recruitBoostRate,
        JSON.stringify(DEFAULT_REFERRAL_SETTINGS.commissionRules),
        DEFAULT_REFERRAL_SETTINGS.withdrawalNotice,
      ],
      connection,
    );
  }

  await runExecute(
    `UPDATE referral_settings
        SET commission_rules = COALESCE(commission_rules, ?),
            withdrawal_notice = COALESCE(withdrawal_notice, ?)
      WHERE id = 1`,
    [
      JSON.stringify(DEFAULT_REFERRAL_SETTINGS.commissionRules),
      DEFAULT_REFERRAL_SETTINGS.withdrawalNotice,
    ],
    connection,
  );

  if (!connection) {
    tablesReady = true;
  }
}

export async function getReferralSettings(connection?: PoolConnection): Promise<ReferralSettings> {
  await ensureReferralProgramTables(connection);

  const rows = await selectRows<any[]>(
    `SELECT
       settlement_days,
       withdraw_threshold_diamonds,
       diamond_to_points_rate,
       recruit_boost_paid_users,
       recruit_boost_rate,
       commission_rules,
       withdrawal_notice
     FROM referral_settings
     WHERE id = 1
     LIMIT 1`,
    [],
    connection,
  );

  if (rows.length === 0) {
    return DEFAULT_REFERRAL_SETTINGS;
  }

  const row = rows[0];
  let parsedRules: unknown = DEFAULT_REFERRAL_SETTINGS.commissionRules;

  try {
    parsedRules = row.commission_rules ? JSON.parse(String(row.commission_rules)) : parsedRules;
  } catch {
    parsedRules = DEFAULT_REFERRAL_SETTINGS.commissionRules;
  }

  return {
    settlementDays: Math.max(1, Number(row.settlement_days || DEFAULT_REFERRAL_SETTINGS.settlementDays)),
    withdrawThresholdDiamonds: Math.max(
      1,
      Number(row.withdraw_threshold_diamonds || DEFAULT_REFERRAL_SETTINGS.withdrawThresholdDiamonds),
    ),
    diamondToPointsRate: Math.max(
      1,
      Number(row.diamond_to_points_rate || DEFAULT_REFERRAL_SETTINGS.diamondToPointsRate),
    ),
    recruitBoostPaidUsers: Math.max(
      1,
      Number(row.recruit_boost_paid_users || DEFAULT_REFERRAL_SETTINGS.recruitBoostPaidUsers),
    ),
    recruitBoostRate: Number(row.recruit_boost_rate || DEFAULT_REFERRAL_SETTINGS.recruitBoostRate),
    commissionRules: normalizeCommissionRules(parsedRules),
    withdrawalNotice: String(row.withdrawal_notice || DEFAULT_REFERRAL_SETTINGS.withdrawalNotice),
  };
}

export async function saveReferralSettings(
  payload: Partial<ReferralSettings>,
  connection?: PoolConnection,
): Promise<ReferralSettings> {
  const current = await getReferralSettings(connection);

  const next: ReferralSettings = {
    settlementDays:
      payload.settlementDays !== undefined
        ? Math.max(1, Number(payload.settlementDays))
        : current.settlementDays,
    withdrawThresholdDiamonds:
      payload.withdrawThresholdDiamonds !== undefined
        ? Math.max(1, Number(payload.withdrawThresholdDiamonds))
        : current.withdrawThresholdDiamonds,
    diamondToPointsRate:
      payload.diamondToPointsRate !== undefined
        ? Math.max(1, Number(payload.diamondToPointsRate))
        : current.diamondToPointsRate,
    recruitBoostPaidUsers:
      payload.recruitBoostPaidUsers !== undefined
        ? Math.max(1, Number(payload.recruitBoostPaidUsers))
        : current.recruitBoostPaidUsers,
    recruitBoostRate:
      payload.recruitBoostRate !== undefined
        ? Number(payload.recruitBoostRate)
        : current.recruitBoostRate,
    withdrawalNotice:
      payload.withdrawalNotice !== undefined
        ? String(payload.withdrawalNotice || '')
        : current.withdrawalNotice,
    commissionRules: payload.commissionRules
      ? normalizeCommissionRules(payload.commissionRules)
      : current.commissionRules,
  };

  await runExecute(
    `UPDATE referral_settings
     SET settlement_days = ?,
         withdraw_threshold_diamonds = ?,
         diamond_to_points_rate = ?,
         recruit_boost_paid_users = ?,
         recruit_boost_rate = ?,
         commission_rules = ?,
         withdrawal_notice = ?
     WHERE id = 1`,
    [
      next.settlementDays,
      next.withdrawThresholdDiamonds,
      next.diamondToPointsRate,
      next.recruitBoostPaidUsers,
      next.recruitBoostRate,
      JSON.stringify(next.commissionRules),
      next.withdrawalNotice,
    ],
    connection,
  );

  return next;
}

export async function applyReferralBindingRewards(
  referrerId: string,
  refereeId: string,
  connection?: PoolConnection,
): Promise<void> {
  if (!referrerId || !refereeId || referrerId === refereeId) {
    return;
  }

  await ensureReferralProgramTables(connection);

  const existingRows = await selectRows<any[]>(
    `SELECT id
     FROM referrals
     WHERE referrer_id = ? AND referee_id = ? AND referee_type = 'trial'
     LIMIT 1`,
    [referrerId, refereeId],
    connection,
  );

  if (existingRows.length > 0) {
    return;
  }

  await runExecute(
    `INSERT INTO referrals (
      referrer_id,
      referee_id,
      referee_type,
      reward_type,
      reward_amount,
      reward_status,
      metadata,
      created_at
    ) VALUES (?, ?, 'trial', 'bind', 0, 'completed', ?, NOW())`,
    [
      referrerId,
      refereeId,
      JSON.stringify({
        note: 'Bound by referral code. Registration does not grant withdrawable diamonds.',
      }),
    ],
    connection,
  );
}

export async function applyRechargeCommission(
  referrerId: string,
  refereeId: string,
  _basePoints: number,
  orderId: string,
  connection?: PoolConnection,
  options?: RechargeCommissionOptions,
): Promise<number> {
  if (!referrerId || !refereeId || !orderId || referrerId === refereeId) {
    return 0;
  }

  const executeWithConnection = async (tx: PoolConnection): Promise<number> => {
    await ensureReferralProgramTables(tx);

    const existingRows = await selectRows<any[]>(
      `SELECT id
       FROM referrals
       WHERE referrer_id = ? AND referee_id = ? AND referee_type = 'paid' AND order_id = ?
       LIMIT 1`,
      [referrerId, refereeId, orderId],
      tx,
    );

    if (existingRows.length > 0) {
      return 0;
    }

    const meta = await resolveOrderMeta(orderId, tx);
    const orderAmount =
      options?.orderAmount !== undefined ? Number(options.orderAmount) : Number(meta?.amount || 0);
    const productName = options?.productName ?? meta?.productName ?? 'Recharge Order';
    const settings = await getReferralSettings(tx);
    const existingPaidInviteCount = await getDistinctPaidInviteCount(referrerId, tx);

    const priorRows = await selectRows<any[]>(
      `SELECT id
       FROM referrals
       WHERE referrer_id = ? AND referee_id = ? AND referee_type = 'paid'
       LIMIT 1`,
      [referrerId, refereeId],
      tx,
    );

    const effectivePaidInviteCount =
      existingPaidInviteCount + (priorRows.length > 0 ? 0 : 1);
    const matched = matchCommissionRule(orderAmount, effectivePaidInviteCount, settings);
    const rewardDiamonds = matched
      ? calculateRewardDiamonds(orderAmount, matched.rewardMode, matched.rewardValue)
      : 0;
    const availableAt = addDays(new Date(), settings.settlementDays);

    await runExecute(
      `INSERT INTO referrals (
        referrer_id,
        referee_id,
        referee_type,
        reward_type,
        reward_amount,
        reward_status,
        order_id,
        gross_order_amount,
        commission_mode,
        commission_value,
        available_at,
        metadata,
        created_at
      ) VALUES (?, ?, 'paid', 'diamond', ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        referrerId,
        refereeId,
        rewardDiamonds,
        rewardDiamonds > 0 ? 'pending' : 'completed',
        orderId,
        Number(orderAmount.toFixed(2)),
        matched?.rewardMode || null,
        matched?.rewardValue ?? null,
        rewardDiamonds > 0 ? availableAt : null,
        JSON.stringify({
          ruleCode: matched?.rule.code || null,
          ruleName: matched?.rule.name || null,
          boosted: matched?.boosted || false,
          productName,
          paidInviteCount: effectivePaidInviteCount,
        }),
      ],
      tx,
    );

    if (rewardDiamonds <= 0) {
      return 0;
    }

    await runExecute(
      `UPDATE users
       SET diamond_pending = COALESCE(diamond_pending, 0) + ?,
           diamond_total_earned = COALESCE(diamond_total_earned, 0) + ?
       WHERE id = ?`,
      [rewardDiamonds, rewardDiamonds, referrerId],
      tx,
    );

    await insertDiamondLedger(
      referrerId,
      'commission_pending',
      'credit',
      'pending',
      rewardDiamonds,
      `Referral commission pending settlement: ${productName}`,
      orderId,
      refereeId,
      {
        orderAmount: Number(orderAmount.toFixed(2)),
        ruleCode: matched?.rule.code || null,
        boosted: matched?.boosted || false,
        availableAt: availableAt.toISOString(),
      },
      tx,
    );

    return rewardDiamonds;
  };

  if (!connection) {
    return transaction(async (tx) => executeWithConnection(tx));
  }

  return executeWithConnection(connection);
}

export async function getDiamondAccountSummary(
  userId: string,
  connection?: PoolConnection,
): Promise<DiamondAccountSummary> {
  if (!connection) {
    return transaction(async (tx) => getDiamondAccountSummary(userId, tx));
  }

  await settleDueReferralDiamondsForUserInternal(userId, connection);

  const userRows = await selectRows<any[]>(
    `SELECT
       COALESCE(diamond_available, 0) AS diamond_available,
       COALESCE(diamond_pending, 0) AS diamond_pending,
       COALESCE(diamond_frozen, 0) AS diamond_frozen,
       COALESCE(diamond_total_earned, 0) AS diamond_total_earned,
       COALESCE(diamond_total_withdrawn, 0) AS diamond_total_withdrawn
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId],
    connection,
  );

  const inviteRows = await selectRows<any[]>(
    'SELECT COUNT(*) AS total FROM users WHERE referred_by = ?',
    [userId],
    connection,
  );
  const paidInviteCount = await getDistinctPaidInviteCount(userId, connection);
  const settings = await getReferralSettings(connection);

  return {
    availableDiamonds: Number(userRows[0]?.diamond_available || 0),
    pendingDiamonds: Number(userRows[0]?.diamond_pending || 0),
    frozenDiamonds: Number(userRows[0]?.diamond_frozen || 0),
    totalEarnedDiamonds: Number(userRows[0]?.diamond_total_earned || 0),
    totalWithdrawnDiamonds: Number(userRows[0]?.diamond_total_withdrawn || 0),
    totalInvites: Number(inviteRows[0]?.total || 0),
    paidInvites: paidInviteCount,
    nextBoostRemaining: Math.max(0, settings.recruitBoostPaidUsers - paidInviteCount),
  };
}

export async function getUserPayoutProfile(
  userId: string,
  connection?: PoolConnection,
): Promise<PayoutProfile | null> {
  await ensureReferralProgramTables(connection);

  const rows = await selectRows<any[]>(
    `SELECT
       user_id,
       real_name,
       payout_method,
       payout_account,
       identity_no,
       phone,
       note,
       created_at,
       updated_at
     FROM user_payout_profiles
     WHERE user_id = ?
     LIMIT 1`,
    [userId],
    connection,
  );

  if (rows.length === 0) {
    return null;
  }

  return {
    userId: String(rows[0].user_id),
    realName: String(rows[0].real_name),
    payoutMethod: String(rows[0].payout_method) === 'wechat' ? 'wechat' : 'alipay',
    payoutAccount: String(rows[0].payout_account),
    identityNo: rows[0].identity_no ? String(rows[0].identity_no) : null,
    phone: rows[0].phone ? String(rows[0].phone) : null,
    note: rows[0].note ? String(rows[0].note) : null,
    createdAt: rows[0].created_at ? String(rows[0].created_at) : null,
    updatedAt: rows[0].updated_at ? String(rows[0].updated_at) : null,
  };
}

export async function saveUserPayoutProfile(
  userId: string,
  payload: PayoutProfileInput,
  connection?: PoolConnection,
): Promise<PayoutProfile> {
  const realName = String(payload.realName || '').trim();
  const payoutAccount = String(payload.payoutAccount || '').trim();
  const payoutMethod: 'wechat' = 'wechat';

  if (!realName) {
    throw new Error('Real name is required.');
  }

  if (!payoutAccount) {
    throw new Error('Payout account is required.');
  }

  const executeWithConnection = async (tx: PoolConnection): Promise<PayoutProfile> => {
    await ensureReferralProgramTables(tx);

    const existing = await getUserPayoutProfile(userId, tx);

    if (existing) {
      await runExecute(
        `UPDATE user_payout_profiles
         SET real_name = ?,
             payout_method = ?,
             payout_account = ?,
             identity_no = ?,
             phone = ?,
             note = ?,
             updated_at = NOW()
         WHERE user_id = ?`,
        [
          realName,
          payoutMethod,
          payoutAccount,
          payload.identityNo || null,
          payload.phone || null,
          payload.note || null,
          userId,
        ],
        tx,
      );
    } else {
      await runExecute(
        `INSERT INTO user_payout_profiles (
          user_id,
          real_name,
          payout_method,
          payout_account,
          identity_no,
          phone,
          note,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userId,
          realName,
          payoutMethod,
          payoutAccount,
          payload.identityNo || null,
          payload.phone || null,
          payload.note || null,
        ],
        tx,
      );
    }

    return (await getUserPayoutProfile(userId, tx)) as PayoutProfile;
  };

  if (!connection) {
    return transaction(async (tx) => executeWithConnection(tx));
  }

  return executeWithConnection(connection);
}

export async function previewWithdrawal(
  userId: string,
  diamonds: number,
  connection?: PoolConnection,
): Promise<WithdrawalPreview> {
  const executeWithConnection = async (tx: PoolConnection): Promise<WithdrawalPreview> => {
    const normalizedDiamonds = Math.max(0, Math.floor(Number(diamonds || 0)));
    if (normalizedDiamonds <= 0) {
      throw new Error('Withdrawal diamonds must be greater than 0.');
    }

    await settleDueReferralDiamondsForUserInternal(userId, tx);
    const summary = await getDiamondAccountSummary(userId, tx);
    const settings = await getReferralSettings(tx);

    if (normalizedDiamonds > summary.availableDiamonds) {
      throw new Error('Insufficient available diamonds.');
    }

    if (normalizedDiamonds < settings.withdrawThresholdDiamonds) {
      throw new Error(
        `Minimum withdrawal is ${diamondsToAmount(settings.withdrawThresholdDiamonds).toFixed(2)} yuan equivalent diamonds.`,
      );
    }

    const tax = calculateLaborServiceTax(diamondsToAmount(normalizedDiamonds));

    return {
      diamonds: normalizedDiamonds,
      ...tax,
      thresholdDiamonds: settings.withdrawThresholdDiamonds,
      thresholdAmount: diamondsToAmount(settings.withdrawThresholdDiamonds),
      notice: settings.withdrawalNotice,
    };
  };

  if (!connection) {
    return transaction(async (tx) => executeWithConnection(tx));
  }

  return executeWithConnection(connection);
}

export async function submitWithdrawalRequest(
  userId: string,
  diamonds: number,
  connection?: PoolConnection,
): Promise<{ id: string; preview: WithdrawalPreview }> {
  const executeWithConnection = async (tx: PoolConnection): Promise<{ id: string; preview: WithdrawalPreview }> => {
    const profile = await getUserPayoutProfile(userId, tx);
    if (!profile) {
      throw new Error('Please complete your payout profile before requesting a withdrawal.');
    }

    if (profile.payoutMethod !== 'wechat') {
      throw new Error('Only WeChat withdrawals are supported right now.');
    }

    const userRows = await selectRows<any[]>(
      `SELECT wechat_openid
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId],
      tx,
    );

    if (userRows.length === 0) {
      throw new Error('User not found.');
    }

    if (!userRows[0]?.wechat_openid) {
      throw new Error('Please bind your WeChat account before requesting a withdrawal.');
    }

    const preview = await previewWithdrawal(userId, diamonds, tx);
    const requestId = randomUUID();

    await runExecute(
      `UPDATE users
       SET diamond_available = CASE
             WHEN COALESCE(diamond_available, 0) >= ? THEN COALESCE(diamond_available, 0) - ?
             ELSE 0
           END,
           diamond_frozen = COALESCE(diamond_frozen, 0) + ?
       WHERE id = ?`,
      [preview.diamonds, preview.diamonds, preview.diamonds, userId],
      tx,
    );

    await runExecute(
      `INSERT INTO withdraw_requests (
        id,
        user_id,
        diamonds,
        gross_amount,
        taxable_base,
        tax_rate,
        quick_deduction,
        tax_amount,
        net_amount,
        payout_method,
        payout_account,
        payout_name,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_review', NOW(), NOW())`,
      [
        requestId,
        userId,
        preview.diamonds,
        preview.grossAmount,
        preview.taxableBase,
        preview.taxRate,
        preview.quickDeduction,
        preview.taxAmount,
        preview.netAmount,
        profile.payoutMethod,
        profile.payoutAccount,
        profile.realName,
      ],
      tx,
    );

    await insertDiamondLedger(
      userId,
      'withdraw_apply',
      'debit',
      'available',
      preview.diamonds,
      'Withdrawal request submitted. Diamonds frozen pending manual review.',
      null,
      null,
      {
        withdrawRequestId: requestId,
        grossAmount: preview.grossAmount,
        taxAmount: preview.taxAmount,
        netAmount: preview.netAmount,
      },
      tx,
    );

    await insertDiamondLedger(
      userId,
      'withdraw_freeze',
      'credit',
      'frozen',
      preview.diamonds,
      'Withdrawal request frozen for manual review.',
      null,
      null,
      {
        withdrawRequestId: requestId,
      },
      tx,
    );

    return {
      id: requestId,
      preview,
    };
  };

  if (!connection) {
    return transaction(async (tx) => executeWithConnection(tx));
  }

  return executeWithConnection(connection);
}

export async function reviewWithdrawalRequest(
  requestId: string,
  action: 'approve' | 'reject' | 'mark_paid',
  adminUserId: string,
  note?: string | null,
  paymentReference?: string | null,
  connection?: PoolConnection,
): Promise<WithdrawalStatus> {
  const executeWithConnection = async (tx: PoolConnection): Promise<WithdrawalStatus> => {
    await ensureReferralProgramTables(tx);

    const rows = await selectRows<any[]>(
      `SELECT *
       FROM withdraw_requests
       WHERE id = ?
       LIMIT 1`,
      [requestId],
      tx,
    );

    if (rows.length === 0) {
      throw new Error('Withdrawal request not found.');
    }

    const request = rows[0];
    const currentStatus = String(request.status || 'pending_review') as WithdrawalStatus;

    if (action === 'approve') {
      if (currentStatus !== 'pending_review') {
        throw new Error('Only pending withdrawal requests can be approved.');
      }

      await runExecute(
        `UPDATE withdraw_requests
         SET status = 'approved',
             note = ?,
             reviewed_by = ?,
             reviewed_at = NOW(),
             updated_at = NOW()
         WHERE id = ?`,
        [note || null, adminUserId, requestId],
        tx,
      );

      return 'approved';
    }

    if (action === 'reject') {
      if (currentStatus !== 'pending_review' && currentStatus !== 'approved') {
        throw new Error('Only pending or approved withdrawal requests can be rejected.');
      }

      await runExecute(
        `UPDATE users
         SET diamond_frozen = CASE
               WHEN COALESCE(diamond_frozen, 0) >= ? THEN COALESCE(diamond_frozen, 0) - ?
               ELSE 0
             END,
             diamond_available = COALESCE(diamond_available, 0) + ?
         WHERE id = ?`,
        [request.diamonds, request.diamonds, request.diamonds, request.user_id],
        tx,
      );

      await runExecute(
        `UPDATE withdraw_requests
         SET status = 'rejected',
             note = ?,
             reviewed_by = ?,
             reviewed_at = NOW(),
             updated_at = NOW()
         WHERE id = ?`,
        [note || null, adminUserId, requestId],
        tx,
      );

      await insertDiamondLedger(
        String(request.user_id),
        'withdraw_reject',
        'debit',
        'frozen',
        Number(request.diamonds || 0),
        'Withdrawal rejected. Frozen diamonds returned to available balance.',
        null,
        null,
        {
          withdrawRequestId: requestId,
        },
        tx,
      );

      await insertDiamondLedger(
        String(request.user_id),
        'withdraw_return',
        'credit',
        'available',
        Number(request.diamonds || 0),
        'Withdrawal rejected. Diamonds restored to available balance.',
        null,
        null,
        {
          withdrawRequestId: requestId,
        },
        tx,
      );

      return 'rejected';
    }

    if (currentStatus !== 'approved') {
      throw new Error('Only approved withdrawal requests can be marked as paid.');
    }

    await runExecute(
      `UPDATE users
       SET diamond_frozen = CASE
             WHEN COALESCE(diamond_frozen, 0) >= ? THEN COALESCE(diamond_frozen, 0) - ?
             ELSE 0
           END,
           diamond_total_withdrawn = COALESCE(diamond_total_withdrawn, 0) + ?
       WHERE id = ?`,
      [request.diamonds, request.diamonds, request.diamonds, request.user_id],
      tx,
    );

    await runExecute(
      `UPDATE withdraw_requests
       SET status = 'paid',
           note = ?,
           payment_reference = ?,
           reviewed_by = ?,
           reviewed_at = COALESCE(reviewed_at, NOW()),
           paid_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [note || null, paymentReference || null, adminUserId, requestId],
      tx,
    );

    await insertDiamondLedger(
      String(request.user_id),
      'withdraw_paid',
      'debit',
      'frozen',
      Number(request.diamonds || 0),
      'Withdrawal paid manually by admin.',
      null,
      null,
      {
        withdrawRequestId: requestId,
        grossAmount: Number(request.gross_amount || 0),
        taxAmount: Number(request.tax_amount || 0),
        netAmount: Number(request.net_amount || 0),
        paymentReference: paymentReference || null,
      },
      tx,
    );

    return 'paid';
  };

  if (!connection) {
    return transaction(async (tx) => executeWithConnection(tx));
  }

  return executeWithConnection(connection);
}

export async function convertDiamondsToPoints(
  userId: string,
  diamonds: number,
  connection?: PoolConnection,
): Promise<{ diamonds: number; points: number }> {
  const executeWithConnection = async (tx: PoolConnection): Promise<{ diamonds: number; points: number }> => {
    const normalizedDiamonds = Math.max(0, Math.floor(Number(diamonds || 0)));
    if (normalizedDiamonds <= 0) {
      throw new Error('Diamonds to convert must be greater than 0.');
    }

    await settleDueReferralDiamondsForUserInternal(userId, tx);
    const summary = await getDiamondAccountSummary(userId, tx);
    const settings = await getReferralSettings(tx);

    if (normalizedDiamonds > summary.availableDiamonds) {
      throw new Error('Insufficient available diamonds.');
    }

    const points = Math.floor(normalizedDiamonds * settings.diamondToPointsRate);
    if (points <= 0) {
      throw new Error('Current conversion settings do not produce any points.');
    }

    await runExecute(
      `UPDATE users
       SET diamond_available = CASE
             WHEN COALESCE(diamond_available, 0) >= ? THEN COALESCE(diamond_available, 0) - ?
             ELSE 0
           END,
           points = COALESCE(points, 0) + ?
       WHERE id = ?`,
      [normalizedDiamonds, normalizedDiamonds, points, userId],
      tx,
    );

    await insertDiamondLedger(
      userId,
      'diamond_to_points',
      'debit',
      'available',
      normalizedDiamonds,
      'Converted diamonds into site points.',
      null,
      null,
      {
        points,
        rate: settings.diamondToPointsRate,
      },
      tx,
    );

    await insertPointsRecord({
      userId,
      points,
      type: 'diamond_convert',
      description: `Converted ${normalizedDiamonds} diamonds into ${points} points`,
      connection: tx,
    });

    return {
      diamonds: normalizedDiamonds,
      points,
    };
  };

  if (!connection) {
    return transaction(async (tx) => executeWithConnection(tx));
  }

  return executeWithConnection(connection);
}
