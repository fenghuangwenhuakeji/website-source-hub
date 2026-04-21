import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { ResultSetHeader } from 'mysql2/promise';

export interface SqliteResultSetHeader
  extends Pick<
    ResultSetHeader,
    'affectedRows' | 'insertId' | 'changedRows' | 'fieldCount' | 'warningStatus' | 'info'
  > {}

function normalizeSql(sql: string): string {
  return sql
    .replace(/`/g, '')
    .replace(/\bNOW\(\)/gi, 'CURRENT_TIMESTAMP')
    .replace(/\bTRUE\b/gi, '1')
    .replace(/\bFALSE\b/gi, '0')
    .replace(/\s+FOR UPDATE\b/gi, '')
    .replace(
      /DATE_ADD\(\s*CURRENT_TIMESTAMP\s*,\s*INTERVAL\s+\?\s+SECOND\s*\)/gi,
      "datetime(CURRENT_TIMESTAMP, ? || ' seconds')",
    )
    .replace(
      /DATE_ADD\(\s*NOW\(\)\s*,\s*INTERVAL\s+\?\s+SECOND\s*\)/gi,
      "datetime(CURRENT_TIMESTAMP, ? || ' seconds')",
    )
    .trim();
}

function mapParam(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 19).replace('T', ' ');
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  if (value === undefined) {
    return null;
  }

  return value;
}

function isSelectSql(sql: string): boolean {
  return /^(SELECT|PRAGMA|WITH)\b/i.test(sql.trim());
}

function createHeader(changes: number, lastInsertRowid: number | bigint): SqliteResultSetHeader {
  return {
    affectedRows: Number(changes || 0),
    changedRows: Number(changes || 0),
    insertId: Number(lastInsertRowid || 0),
    fieldCount: 0,
    warningStatus: 0,
    info: '',
  };
}

function createSchema(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      phone_verified_at TEXT,
      password_hash TEXT,
      password_updated_at TEXT,
      password_reset_requested_at TEXT,
      last_password_reset_at TEXT,
      nickname TEXT NOT NULL,
      avatar_url TEXT,
      role TEXT DEFAULT 'user',
      gender TEXT,
      birthday TEXT,
      location TEXT,
      website TEXT,
      wechat_openid TEXT,
      wechat_unionid TEXT,
      wechat_bound_at TEXT,
      email_verified INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      locked_until TEXT,
      login_attempts INTEGER DEFAULT 0,
      must_bind_contact INTEGER DEFAULT 1,
      points INTEGER DEFAULT 0,
      total_recharge REAL DEFAULT 0,
      total_earnings REAL DEFAULT 0,
      referral_code TEXT UNIQUE,
      referred_by TEXT,
      vip_level INTEGER DEFAULT 0,
      vip_expire_time TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS recharge_packages (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      points INTEGER NOT NULL,
      bonus_points INTEGER DEFAULT 0,
      duration INTEGER DEFAULT 0,
      duration_unit TEXT DEFAULT 'month',
      icon TEXT,
      recommended INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS points_exchange_products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      points_cost INTEGER NOT NULL,
      points_reward INTEGER DEFAULT 0,
      duration INTEGER DEFAULT 0,
      duration_unit TEXT DEFAULT 'month',
      icon TEXT,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recharge_orders (
      id TEXT PRIMARY KEY,
      order_no TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      points INTEGER NOT NULL,
      bonus_points INTEGER DEFAULT 0,
      product_name TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      pay_method TEXT NOT NULL,
      pay_time TEXT,
      provider_transaction_id TEXT,
      provider_buyer_id TEXT,
      provider_status TEXT,
      payment_scene TEXT,
      paid_amount REAL,
      currency TEXT DEFAULT 'CNY',
      notify_time TEXT,
      notify_payload TEXT,
      response_payload TEXT,
      expire_time TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_no TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      package_id INTEGER,
      package_name TEXT,
      points INTEGER DEFAULT 0,
      amount REAL DEFAULT 0,
      duration INTEGER DEFAULT 0,
      duration_unit TEXT,
      pay_method TEXT DEFAULT 'wechat',
      status TEXT DEFAULT 'pending',
      paid_at TEXT,
      provider_transaction_id TEXT,
      provider_buyer_id TEXT,
      provider_status TEXT,
      payment_scene TEXT,
      paid_amount REAL,
      currency TEXT DEFAULT 'CNY',
      notify_time TEXT,
      notify_payload TEXT,
      response_payload TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vip_orders (
      id TEXT PRIMARY KEY,
      order_no TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      duration INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      pay_method TEXT NOT NULL,
      pay_time TEXT,
      provider_transaction_id TEXT,
      provider_buyer_id TEXT,
      provider_status TEXT,
      payment_scene TEXT,
      paid_amount REAL,
      currency TEXT DEFAULT 'CNY',
      notify_time TEXT,
      notify_payload TEXT,
      response_payload TEXT,
      expire_time TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_durations (
      user_id TEXT PRIMARY KEY,
      total_duration INTEGER DEFAULT 0,
      remaining_duration INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 0,
      is_permanent INTEGER DEFAULT 0,
      activated_at TEXT,
      expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS points_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      points INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS experience_redeem_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_no TEXT NOT NULL,
      batch_name TEXT,
      code TEXT NOT NULL UNIQUE,
      plan_key TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      duration_days INTEGER NOT NULL DEFAULT 0,
      validity_days INTEGER NOT NULL DEFAULT 7,
      status TEXT NOT NULL DEFAULT 'unused',
      generated_by TEXT,
      note TEXT,
      bound_user_id TEXT,
      activated_at TEXT,
      redeemed_at TEXT,
      redeemed_record_id INTEGER,
      expired_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS points_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      balance_before INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      order_id TEXT,
      description TEXT,
      election_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS election_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      node_id TEXT NOT NULL UNIQUE,
      host TEXT NOT NULL,
      port INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'follower',
      last_active_at TEXT DEFAULT CURRENT_TIMESTAMP,
      vote_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS election_log (
      id TEXT PRIMARY KEY,
      term INTEGER NOT NULL DEFAULT 0,
      type TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      client_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referrer_id TEXT NOT NULL,
      referee_id TEXT NOT NULL,
      referee_type TEXT NOT NULL,
      reward_type TEXT NOT NULL,
      reward_amount INTEGER NOT NULL DEFAULT 0,
      reward_status TEXT NOT NULL DEFAULT 'completed',
      order_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS referral_settings (
      id INTEGER PRIMARY KEY,
      inviter_points INTEGER NOT NULL DEFAULT 50,
      invitee_points INTEGER NOT NULL DEFAULT 50,
      recharge_commission_rate REAL NOT NULL DEFAULT 0.1,
      milestone_rewards TEXT NOT NULL,
      leaderboard_rewards TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS referral_reward_claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referrer_id TEXT NOT NULL,
      reward_key TEXT NOT NULL,
      reward_name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(referrer_id, reward_key)
    );

    CREATE TABLE IF NOT EXISTS novels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      genre TEXT,
      cover_url TEXT,
      tags TEXT,
      status TEXT DEFAULT 'ongoing',
      word_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      chapter_count INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL,
      chapter_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      word_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(novel_id, chapter_number),
      FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
    CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
    CREATE INDEX IF NOT EXISTS idx_recharge_orders_user ON recharge_orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_recharge_orders_status ON recharge_orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_points_records_user ON points_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_experience_redeem_codes_status ON experience_redeem_codes(status);
    CREATE INDEX IF NOT EXISTS idx_experience_redeem_codes_plan_key ON experience_redeem_codes(plan_key);
    CREATE INDEX IF NOT EXISTS idx_experience_redeem_codes_bound_user_id ON experience_redeem_codes(bound_user_id);
    CREATE INDEX IF NOT EXISTS idx_experience_redeem_codes_expired_at ON experience_redeem_codes(expired_at);
    CREATE INDEX IF NOT EXISTS idx_election_nodes_role ON election_nodes(role);
    CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
    CREATE INDEX IF NOT EXISTS idx_novels_author ON novels(author_id);
    CREATE INDEX IF NOT EXISTS idx_novels_published ON novels(is_published, status);
    CREATE INDEX IF NOT EXISTS idx_chapters_novel ON chapters(novel_id, chapter_number);
  `);
}

function seedDatabase(database: DatabaseSync): void {
  const insertAdmin = database.prepare(`
    INSERT OR IGNORE INTO users (
      id, username, password_hash, password_updated_at, nickname, role, status, points, referral_code, must_bind_contact, created_at
    ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
  `);
  insertAdmin.run(
    'admin-001',
    'admin',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYvz1GvN7S',
    'Admin',
    'admin',
    'active',
    0,
    'CWADMIN',
  );

  const upsertRootAdmin = database.prepare(`
    INSERT INTO users (
      id, username, password_hash, password_updated_at, nickname, role, status, points, referral_code, must_bind_contact, created_at
    ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    ON CONFLICT(username) DO UPDATE SET
      password_hash = excluded.password_hash,
      password_updated_at = excluded.password_updated_at,
      nickname = excluded.nickname,
      role = excluded.role,
      status = excluded.status,
      points = excluded.points,
      referral_code = excluded.referral_code,
      must_bind_contact = excluded.must_bind_contact
  `);
  upsertRootAdmin.run(
    'rootadmin-001',
    'rootadmin',
    '$2a$12$I548cdBv/YfCiehCzCGvuOCHlGRxdCHEd3GjYb7wwrI7jzStqYki2',
    'Root Admin',
    'rootadmin',
    'active',
    49900,
    'ROOTADMIN',
  );

  const upsertPackage = database.prepare(`
    INSERT INTO recharge_packages (
      id, name, description, price, points, bonus_points, duration, duration_unit, recommended, is_active, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      price = excluded.price,
      points = excluded.points,
      bonus_points = excluded.bonus_points,
      duration = excluded.duration,
      duration_unit = excluded.duration_unit,
      recommended = excluded.recommended,
      is_active = excluded.is_active,
      sort_order = excluded.sort_order,
      updated_at = CURRENT_TIMESTAMP
  `);

  const packagePresets = [
    [1, '8小时卡', '适合首次体验与临时使用', 9.9, 99, 0, 8, 'hour', 0, 1, 1],
    [2, '日卡', '轻量高频使用的单日时长卡', 14.9, 149, 0, 1, 'day', 0, 1, 2],
    [3, '周卡', '适合短周期连续使用', 29.9, 299, 0, 7, 'day', 0, 1, 3],
    [4, '月卡', '主推卡种，适合长期稳定使用', 79.9, 799, 0, 30, 'day', 1, 1, 4],
    [5, '季卡', '中长期用户的高性价比选择', 299, 2990, 0, 90, 'day', 0, 1, 5],
    [6, '半年卡', '适合工作流深度接入与持续协作', 699, 6990, 0, 180, 'day', 0, 1, 6],
    [7, '年卡', '全年稳定使用的旗舰方案', 999, 9990, 0, 365, 'day', 1, 1, 7],
    [8, '永久卡', '一次开通，长期有效', 4999, 49990, 0, 0, 'permanent', 0, 1, 8],
  ] as const;
  packagePresets.forEach((preset) => upsertPackage.run(...preset));

  const upsertExchange = database.prepare(`
    INSERT INTO points_exchange_products (
      id, name, description, points_cost, points_reward, duration, duration_unit, is_active, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      points_cost = excluded.points_cost,
      points_reward = excluded.points_reward,
      duration = excluded.duration,
      duration_unit = excluded.duration_unit,
      is_active = excluded.is_active,
      sort_order = excluded.sort_order,
      updated_at = CURRENT_TIMESTAMP
  `);

  const exchangePresets = [
    [1, '8小时卡', '使用积分兑换8小时访问时长', 99, 0, 8, 'hour', 1, 1],
    [2, '日卡', '使用积分兑换1天访问时长', 149, 0, 1, 'day', 1, 2],
    [3, '周卡', '使用积分兑换7天访问时长', 299, 0, 7, 'day', 1, 3],
    [4, '月卡', '使用积分兑换30天访问时长', 799, 0, 30, 'day', 1, 4],
    [5, '季卡', '使用积分兑换90天访问时长', 2990, 0, 90, 'day', 1, 5],
    [6, '半年卡', '使用积分兑换180天访问时长', 6990, 0, 180, 'day', 1, 6],
    [7, '年卡', '使用积分兑换365天访问时长', 9990, 0, 365, 'day', 1, 7],
    [8, '永久卡', '使用积分兑换永久访问资格', 49990, 0, 0, 'permanent', 1, 8],
  ] as const;
  exchangePresets.forEach((preset) => upsertExchange.run(...preset));

  const upsertReferralSettings = database.prepare(`
    INSERT INTO referral_settings (
      id, inviter_points, invitee_points, recharge_commission_rate, milestone_rewards, leaderboard_rewards
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      inviter_points = excluded.inviter_points,
      invitee_points = excluded.invitee_points,
      recharge_commission_rate = excluded.recharge_commission_rate,
      milestone_rewards = excluded.milestone_rewards,
      leaderboard_rewards = excluded.leaderboard_rewards,
      updated_at = CURRENT_TIMESTAMP
  `);
  upsertReferralSettings.run(
    1,
    50,
    50,
    0.1,
    JSON.stringify([
      { inviteCount: 3, name: '周卡', duration: 7, durationUnit: 'day' },
      { inviteCount: 10, name: '月卡', duration: 30, durationUnit: 'day' },
      { inviteCount: 50, name: '年卡', duration: 365, durationUnit: 'day' },
    ]),
    '月度邀请榜奖励请在后台说明中维护。',
  );
}

export class SqliteConnection {
  private inTransaction = false;

  constructor(private readonly database: DatabaseSync) {}

  async beginTransaction(): Promise<void> {
    if (!this.inTransaction) {
      this.database.exec('BEGIN IMMEDIATE');
      this.inTransaction = true;
    }
  }

  async execute(sql: string, params: any[] = []): Promise<[any, []]> {
    return [runSqliteQuery(this.database, sql, params), []];
  }

  async commit(): Promise<void> {
    if (this.inTransaction) {
      this.database.exec('COMMIT');
      this.inTransaction = false;
    }
  }

  async rollback(): Promise<void> {
    if (this.inTransaction) {
      this.database.exec('ROLLBACK');
      this.inTransaction = false;
    }
  }

  release(): void {
    // Shared SQLite connection, no explicit release needed.
  }
}

export function initializeSqliteDatabase(sqlitePath: string): DatabaseSync {
  const resolvedPath =
    sqlitePath === ':memory:'
      ? sqlitePath
      : path.isAbsolute(sqlitePath)
        ? sqlitePath
        : path.resolve(process.cwd(), sqlitePath);

  if (resolvedPath !== ':memory:') {
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  }

  const database = new DatabaseSync(resolvedPath);
  database.exec('PRAGMA foreign_keys = ON;');
  createSchema(database);
  seedDatabase(database);
  return database;
}

export function runSqliteQuery<T = any>(
  database: DatabaseSync,
  sql: string,
  params: any[] = [],
): T {
  const normalizedSql = normalizeSql(sql);
  const mappedParams = params.map(mapParam);
  const statement = database.prepare(normalizedSql);

  if (isSelectSql(normalizedSql)) {
    return statement.all(...mappedParams) as T;
  }

  const result = statement.run(...mappedParams);
  return createHeader(result.changes, result.lastInsertRowid) as T;
}
