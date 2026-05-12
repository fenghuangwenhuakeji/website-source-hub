import { execute, getDatabaseAdapter, query } from './database.js';
import { DEFAULT_LICENSE_PRODUCT_ID } from '../utils/licenseCenter.js';

const ROOTADMIN_HASH = '$2a$12$I548cdBv/YfCiehCzCGvuOCHlGRxdCHEd3GjYb7wwrI7jzStqYki2';
const STANDARD_TEST_USER_HASH = '$2a$12$UpbnhrjUJBDV9nf2t/RWIu7lxWA1G4H8ZluF3.MEfR7R.Q64e0kzO';

type SqliteColumnRow = {
  name: string;
};

type MySqlColumnRow = {
  Field: string;
};

type ColumnStatement = {
  name: string;
  sql: string;
};

async function ensureSqliteUserColumns(): Promise<void> {
  const columns = await query<SqliteColumnRow[]>('PRAGMA table_info(users)');
  const columnNames = new Set(columns.map((column) => column.name));

  const statements: ColumnStatement[] = [
    { name: 'phone_verified_at', sql: 'ALTER TABLE users ADD COLUMN phone_verified_at TEXT' },
    { name: 'wechat_bound_at', sql: 'ALTER TABLE users ADD COLUMN wechat_bound_at TEXT' },
    { name: 'password_updated_at', sql: 'ALTER TABLE users ADD COLUMN password_updated_at TEXT' },
    {
      name: 'password_reset_requested_at',
      sql: 'ALTER TABLE users ADD COLUMN password_reset_requested_at TEXT',
    },
    { name: 'last_password_reset_at', sql: 'ALTER TABLE users ADD COLUMN last_password_reset_at TEXT' },
    {
      name: 'must_bind_contact',
      sql: 'ALTER TABLE users ADD COLUMN must_bind_contact INTEGER NOT NULL DEFAULT 1',
    },
  ];

  for (const statement of statements) {
    if (!columnNames.has(statement.name)) {
      await execute(statement.sql);
    }
  }
}

async function runSqliteBackfill(): Promise<void> {
  await execute(
    `UPDATE users
     SET phone_verified_at = COALESCE(phone_verified_at, created_at),
         must_bind_contact = 0
     WHERE phone IS NOT NULL`,
  );

  await execute(
    `UPDATE users
     SET wechat_bound_at = COALESCE(wechat_bound_at, created_at),
         must_bind_contact = 0
     WHERE wechat_openid IS NOT NULL`,
  );

  await execute(
    `UPDATE users
     SET password_updated_at = COALESCE(password_updated_at, created_at)
     WHERE password_hash IS NOT NULL`,
  );

  await execute(
    `UPDATE users
     SET must_bind_contact = 0
     WHERE role IN ('admin', 'rootadmin', 'super_admin')`,
  );
}

async function ensureSqliteExperienceCodeTables(): Promise<void> {
  await execute(
    `CREATE TABLE IF NOT EXISTS experience_redeem_codes (
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
    )`,
  );

  const columns = await query<SqliteColumnRow[]>('PRAGMA table_info(experience_redeem_codes)');
  const columnNames = new Set(columns.map((column) => column.name));
  const statements: ColumnStatement[] = [
    { name: 'batch_name', sql: 'ALTER TABLE experience_redeem_codes ADD COLUMN batch_name TEXT' },
    { name: 'plan_key', sql: 'ALTER TABLE experience_redeem_codes ADD COLUMN plan_key TEXT NOT NULL DEFAULT \'points_75_day_1\'' },
    { name: 'points', sql: 'ALTER TABLE experience_redeem_codes ADD COLUMN points INTEGER NOT NULL DEFAULT 0' },
    { name: 'duration_days', sql: 'ALTER TABLE experience_redeem_codes ADD COLUMN duration_days INTEGER NOT NULL DEFAULT 0' },
    { name: 'validity_days', sql: 'ALTER TABLE experience_redeem_codes ADD COLUMN validity_days INTEGER NOT NULL DEFAULT 7' },
    { name: 'note', sql: 'ALTER TABLE experience_redeem_codes ADD COLUMN note TEXT' },
    { name: 'bound_user_id', sql: 'ALTER TABLE experience_redeem_codes ADD COLUMN bound_user_id TEXT' },
    { name: 'activated_at', sql: 'ALTER TABLE experience_redeem_codes ADD COLUMN activated_at TEXT' },
    { name: 'redeemed_at', sql: 'ALTER TABLE experience_redeem_codes ADD COLUMN redeemed_at TEXT' },
    { name: 'redeemed_record_id', sql: 'ALTER TABLE experience_redeem_codes ADD COLUMN redeemed_record_id INTEGER' },
    { name: 'expired_at', sql: 'ALTER TABLE experience_redeem_codes ADD COLUMN expired_at TEXT' },
  ];

  for (const statement of statements) {
    if (!columnNames.has(statement.name)) {
      await execute(statement.sql);
    }
  }

  await execute(
    'CREATE INDEX IF NOT EXISTS idx_experience_redeem_codes_status ON experience_redeem_codes(status)',
  );
  await execute(
    'CREATE INDEX IF NOT EXISTS idx_experience_redeem_codes_plan_key ON experience_redeem_codes(plan_key)',
  );
  await execute(
    'CREATE INDEX IF NOT EXISTS idx_experience_redeem_codes_bound_user_id ON experience_redeem_codes(bound_user_id)',
  );
  await execute(
    'CREATE INDEX IF NOT EXISTS idx_experience_redeem_codes_expired_at ON experience_redeem_codes(expired_at)',
  );
}

async function ensureSqliteLicenseCenterTables(): Promise<void> {
  await execute(
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client_key TEXT,
      default_trial_days INTEGER NOT NULL DEFAULT 3,
      offline_valid_days INTEGER NOT NULL DEFAULT 3,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
  );

  await execute(
    `CREATE TABLE IF NOT EXISTS product_plans (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      name TEXT NOT NULL,
      duration_days INTEGER NOT NULL DEFAULT 30,
      seat_limit INTEGER NOT NULL DEFAULT 1,
      device_limit INTEGER NOT NULL DEFAULT 1,
      is_permanent INTEGER NOT NULL DEFAULT 0,
      features TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
  );

  await execute(
    `CREATE TABLE IF NOT EXISTS user_product_entitlements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      access_type TEXT NOT NULL DEFAULT 'paid',
      expires_at TEXT,
      is_permanent INTEGER NOT NULL DEFAULT 0,
      trial_started_at TEXT,
      trial_expires_at TEXT,
      trial_claimed_at TEXT,
      seat_limit INTEGER NOT NULL DEFAULT 1,
      device_limit INTEGER NOT NULL DEFAULT 1,
      features TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id)
    )`,
  );

  await execute(
    `CREATE TABLE IF NOT EXISTS license_codes (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      display_code TEXT NOT NULL,
      product_id TEXT NOT NULL,
      plan_name TEXT,
      duration_days INTEGER NOT NULL DEFAULT 30,
      seat_limit INTEGER NOT NULL DEFAULT 1,
      device_limit INTEGER NOT NULL DEFAULT 1,
      is_permanent INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'unused',
      features TEXT,
      generated_by TEXT,
      redeemed_by TEXT,
      redeemed_at TEXT,
      note TEXT,
      expired_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
  );

  await execute(
    `CREATE TABLE IF NOT EXISTS license_code_redemptions (
      id TEXT PRIMARY KEY,
      code_id TEXT NOT NULL,
      code TEXT NOT NULL,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      redeemed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
  );

  await execute(
    `CREATE TABLE IF NOT EXISTS user_devices (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      device_id TEXT NOT NULL,
      device_name TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      first_activated_at TEXT,
      last_seen_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id, device_id)
    )`,
  );

  await execute(
    `CREATE TABLE IF NOT EXISTS license_sessions (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      device_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      started_at TEXT,
      last_heartbeat_at TEXT,
      heartbeat_expires_at TEXT,
      ended_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
  );

  await execute('CREATE INDEX IF NOT EXISTS idx_entitlements_user_product ON user_product_entitlements(user_id, product_id)');
  await execute('CREATE INDEX IF NOT EXISTS idx_license_codes_product_status ON license_codes(product_id, status)');
  await execute('CREATE INDEX IF NOT EXISTS idx_user_devices_user_product ON user_devices(user_id, product_id)');
  await execute('CREATE INDEX IF NOT EXISTS idx_license_sessions_active ON license_sessions(user_id, product_id, status, heartbeat_expires_at)');
  await execute(
    `INSERT OR IGNORE INTO products (
      id, name, client_key, default_trial_days, offline_valid_days, is_active, created_at, updated_at
    ) VALUES (?, '凤煌', 'fenghuang-desktop', 3, 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [DEFAULT_LICENSE_PRODUCT_ID],
  );
}

async function ensureMySqlUserColumns(): Promise<void> {
  const columns = await query<MySqlColumnRow[]>('SHOW COLUMNS FROM users');
  const columnNames = new Set(columns.map((column) => column.Field));

  await execute(
    `ALTER TABLE users
     MODIFY COLUMN role ENUM('user', 'admin', 'rootadmin', 'super_admin') NOT NULL DEFAULT 'user'`,
  );

  const statements: ColumnStatement[] = [
    { name: 'phone_verified_at', sql: 'ALTER TABLE users ADD COLUMN phone_verified_at DATETIME NULL' },
    { name: 'wechat_openid', sql: 'ALTER TABLE users ADD COLUMN wechat_openid VARCHAR(255) NULL' },
    { name: 'wechat_unionid', sql: 'ALTER TABLE users ADD COLUMN wechat_unionid VARCHAR(255) NULL' },
    { name: 'wechat_bound_at', sql: 'ALTER TABLE users ADD COLUMN wechat_bound_at DATETIME NULL' },
    {
      name: 'password_updated_at',
      sql: 'ALTER TABLE users ADD COLUMN password_updated_at DATETIME NULL',
    },
    {
      name: 'password_reset_requested_at',
      sql: 'ALTER TABLE users ADD COLUMN password_reset_requested_at DATETIME NULL',
    },
    {
      name: 'last_password_reset_at',
      sql: 'ALTER TABLE users ADD COLUMN last_password_reset_at DATETIME NULL',
    },
    {
      name: 'must_bind_contact',
      sql: 'ALTER TABLE users ADD COLUMN must_bind_contact TINYINT(1) NOT NULL DEFAULT 1',
    },
  ];

  for (const statement of statements) {
    if (!columnNames.has(statement.name)) {
      await execute(statement.sql);
    }
  }
}

async function mysqlTableExists(tableName: string): Promise<boolean> {
  const rows = await query<Record<string, unknown>[]>('SHOW TABLES LIKE ?', [tableName]);
  return rows.length > 0;
}

async function mysqlColumnNames(tableName: string): Promise<Set<string>> {
  const rows = await query<MySqlColumnRow[]>(`SHOW COLUMNS FROM ${tableName}`);
  return new Set(rows.map((column) => column.Field));
}

async function ensureMySqlColumns(tableName: string, statements: ColumnStatement[]): Promise<Set<string>> {
  if (!(await mysqlTableExists(tableName))) {
    return new Set();
  }

  const columnNames = await mysqlColumnNames(tableName);
  for (const statement of statements) {
    if (!columnNames.has(statement.name)) {
      await execute(statement.sql);
      columnNames.add(statement.name);
    }
  }

  return columnNames;
}

async function mysqlIndexExists(tableName: string, indexName: string): Promise<boolean> {
  if (!(await mysqlTableExists(tableName))) {
    return false;
  }

  const rows = await query<Record<string, unknown>[]>(
    `SELECT 1
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND INDEX_NAME = ?
     LIMIT 1`,
    [tableName, indexName],
  );

  return rows.length > 0;
}

async function ensureMySqlReferralCompatibility(): Promise<void> {
  if (!(await mysqlTableExists('referrals'))) {
    return;
  }

  await ensureMySqlColumns('referrals', [
    {
      name: 'gross_order_amount',
      sql: 'ALTER TABLE referrals ADD COLUMN gross_order_amount DECIMAL(12,2) NULL',
    },
    {
      name: 'commission_mode',
      sql: 'ALTER TABLE referrals ADD COLUMN commission_mode VARCHAR(20) NULL',
    },
    {
      name: 'commission_value',
      sql: 'ALTER TABLE referrals ADD COLUMN commission_value DECIMAL(12,4) NULL',
    },
    {
      name: 'available_at',
      sql: 'ALTER TABLE referrals ADD COLUMN available_at DATETIME NULL',
    },
    {
      name: 'settled_at',
      sql: 'ALTER TABLE referrals ADD COLUMN settled_at DATETIME NULL',
    },
    {
      name: 'metadata',
      sql: 'ALTER TABLE referrals ADD COLUMN metadata LONGTEXT NULL',
    },
  ]);

  await execute("ALTER TABLE referrals MODIFY COLUMN referee_type VARCHAR(20) NOT NULL DEFAULT 'trial'");
  await execute("ALTER TABLE referrals MODIFY COLUMN reward_type VARCHAR(20) NOT NULL DEFAULT 'points'");
  await execute("ALTER TABLE referrals MODIFY COLUMN reward_status VARCHAR(20) NOT NULL DEFAULT 'completed'");

  if (await mysqlIndexExists('referrals', 'uk_referrals_referee')) {
    await execute('ALTER TABLE referrals DROP INDEX uk_referrals_referee');
  }

  if (!(await mysqlIndexExists('referrals', 'idx_referrals_referee'))) {
    await execute('CREATE INDEX idx_referrals_referee ON referrals(referee_id)');
  }

  if (await mysqlIndexExists('referrals', 'uk_referrals_paid_order')) {
    await execute('ALTER TABLE referrals DROP INDEX uk_referrals_paid_order');
  }

  if (!(await mysqlIndexExists('referrals', 'idx_referrals_paid_order'))) {
    await execute(
      `CREATE INDEX idx_referrals_paid_order
       ON referrals(referrer_id, referee_id, referee_type, order_id)`,
    );
  }
}

async function ensureMySqlRechargeColumns(): Promise<void> {
  await ensureMySqlColumns('recharge_packages', [
    {
      name: 'bonus_points',
      sql: 'ALTER TABLE recharge_packages ADD COLUMN bonus_points INT NOT NULL DEFAULT 0',
    },
  ]);

  const rechargeOrderColumns = await ensureMySqlColumns('recharge_orders', [
    {
      name: 'bonus_points',
      sql: 'ALTER TABLE recharge_orders ADD COLUMN bonus_points INT NOT NULL DEFAULT 0',
    },
    {
      name: 'product_name',
      sql: 'ALTER TABLE recharge_orders ADD COLUMN product_name VARCHAR(100) NULL',
    },
    {
      name: 'pay_time',
      sql: 'ALTER TABLE recharge_orders ADD COLUMN pay_time DATETIME NULL',
    },
    {
      name: 'provider_transaction_id',
      sql: 'ALTER TABLE recharge_orders ADD COLUMN provider_transaction_id VARCHAR(128) NULL',
    },
    {
      name: 'provider_buyer_id',
      sql: 'ALTER TABLE recharge_orders ADD COLUMN provider_buyer_id VARCHAR(128) NULL',
    },
    {
      name: 'provider_status',
      sql: 'ALTER TABLE recharge_orders ADD COLUMN provider_status VARCHAR(64) NULL',
    },
    {
      name: 'payment_scene',
      sql: 'ALTER TABLE recharge_orders ADD COLUMN payment_scene VARCHAR(64) NULL',
    },
    {
      name: 'paid_amount',
      sql: 'ALTER TABLE recharge_orders ADD COLUMN paid_amount DECIMAL(12, 2) NULL',
    },
    {
      name: 'currency',
      sql: "ALTER TABLE recharge_orders ADD COLUMN currency VARCHAR(16) NOT NULL DEFAULT 'CNY'",
    },
    {
      name: 'notify_time',
      sql: 'ALTER TABLE recharge_orders ADD COLUMN notify_time DATETIME NULL',
    },
    {
      name: 'notify_payload',
      sql: 'ALTER TABLE recharge_orders ADD COLUMN notify_payload LONGTEXT NULL',
    },
    {
      name: 'response_payload',
      sql: 'ALTER TABLE recharge_orders ADD COLUMN response_payload LONGTEXT NULL',
    },
    {
      name: 'expire_time',
      sql: 'ALTER TABLE recharge_orders ADD COLUMN expire_time DATETIME NULL',
    },
    {
      name: 'updated_at',
      sql: 'ALTER TABLE recharge_orders ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    },
  ]);

  if (rechargeOrderColumns.size > 0) {
    const packageNameExpr = rechargeOrderColumns.has('package_name') ? 'package_name' : 'NULL';
    const paidAtExpr = rechargeOrderColumns.has('paid_at') ? 'paid_at' : 'NULL';
    const createdAtExpr = rechargeOrderColumns.has('created_at') ? 'created_at' : 'NOW()';

    await execute(
      `UPDATE recharge_orders
       SET bonus_points = COALESCE(bonus_points, 0),
           product_name = COALESCE(NULLIF(product_name, ''), ${packageNameExpr}, 'Recharge Order'),
           pay_time = COALESCE(pay_time, ${paidAtExpr}),
           paid_amount = COALESCE(paid_amount, amount),
           currency = COALESCE(NULLIF(currency, ''), 'CNY'),
           expire_time = COALESCE(expire_time, DATE_ADD(${createdAtExpr}, INTERVAL 30 MINUTE))`,
    );

    await execute(
      `ALTER TABLE recharge_orders
       MODIFY COLUMN product_name VARCHAR(100) NOT NULL`,
    );

    await execute(
      `ALTER TABLE recharge_orders
       MODIFY COLUMN expire_time DATETIME NOT NULL`,
    );
  }

  const orderColumns = await ensureMySqlColumns('orders', [
    {
      name: 'provider_transaction_id',
      sql: 'ALTER TABLE orders ADD COLUMN provider_transaction_id VARCHAR(128) NULL',
    },
    {
      name: 'provider_buyer_id',
      sql: 'ALTER TABLE orders ADD COLUMN provider_buyer_id VARCHAR(128) NULL',
    },
    {
      name: 'provider_status',
      sql: 'ALTER TABLE orders ADD COLUMN provider_status VARCHAR(64) NULL',
    },
    {
      name: 'payment_scene',
      sql: 'ALTER TABLE orders ADD COLUMN payment_scene VARCHAR(64) NULL',
    },
    {
      name: 'paid_amount',
      sql: 'ALTER TABLE orders ADD COLUMN paid_amount DECIMAL(12, 2) NULL',
    },
    {
      name: 'currency',
      sql: "ALTER TABLE orders ADD COLUMN currency VARCHAR(16) NOT NULL DEFAULT 'CNY'",
    },
    {
      name: 'notify_time',
      sql: 'ALTER TABLE orders ADD COLUMN notify_time DATETIME NULL',
    },
    {
      name: 'notify_payload',
      sql: 'ALTER TABLE orders ADD COLUMN notify_payload LONGTEXT NULL',
    },
    {
      name: 'response_payload',
      sql: 'ALTER TABLE orders ADD COLUMN response_payload LONGTEXT NULL',
    },
    {
      name: 'updated_at',
      sql: 'ALTER TABLE orders ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    },
  ]);

  if (orderColumns.size > 0) {
    await execute(
      `UPDATE orders
       SET paid_amount = COALESCE(paid_amount, amount),
           currency = COALESCE(NULLIF(currency, ''), 'CNY'),
           provider_status = COALESCE(
             provider_status,
             CASE
               WHEN status = 'paid' THEN 'SUCCESS'
               WHEN status = 'pending' THEN 'PENDING'
               ELSE provider_status
             END
           )`,
    );
  }
}

async function ensureMySqlExperienceCodeTables(): Promise<void> {
  await execute(
    `CREATE TABLE IF NOT EXISTS experience_redeem_codes (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      batch_no VARCHAR(64) NOT NULL,
      batch_name VARCHAR(100) NULL,
      code VARCHAR(64) NOT NULL UNIQUE,
      plan_key VARCHAR(32) NOT NULL,
      points INT NOT NULL DEFAULT 0,
      duration_days INT NOT NULL DEFAULT 0,
      validity_days INT NOT NULL DEFAULT 7,
      status VARCHAR(16) NOT NULL DEFAULT 'unused',
      generated_by VARCHAR(64) NULL,
      note VARCHAR(255) NULL,
      bound_user_id VARCHAR(64) NULL,
      activated_at DATETIME NULL,
      redeemed_at DATETIME NULL,
      redeemed_record_id BIGINT NULL,
      expired_at DATETIME NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_experience_redeem_codes_status (status),
      INDEX idx_experience_redeem_codes_plan_key (plan_key),
      INDEX idx_experience_redeem_codes_bound_user_id (bound_user_id),
      INDEX idx_experience_redeem_codes_expired_at (expired_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  await ensureMySqlColumns('experience_redeem_codes', [
    { name: 'batch_name', sql: 'ALTER TABLE experience_redeem_codes ADD COLUMN batch_name VARCHAR(100) NULL' },
    { name: 'plan_key', sql: 'ALTER TABLE experience_redeem_codes ADD COLUMN plan_key VARCHAR(32) NOT NULL DEFAULT \'points_75_day_1\'' },
    { name: 'points', sql: 'ALTER TABLE experience_redeem_codes ADD COLUMN points INT NOT NULL DEFAULT 0' },
    { name: 'duration_days', sql: 'ALTER TABLE experience_redeem_codes ADD COLUMN duration_days INT NOT NULL DEFAULT 0' },
    { name: 'validity_days', sql: 'ALTER TABLE experience_redeem_codes ADD COLUMN validity_days INT NOT NULL DEFAULT 7' },
    { name: 'note', sql: 'ALTER TABLE experience_redeem_codes ADD COLUMN note VARCHAR(255) NULL' },
    { name: 'bound_user_id', sql: 'ALTER TABLE experience_redeem_codes ADD COLUMN bound_user_id VARCHAR(64) NULL' },
    { name: 'activated_at', sql: 'ALTER TABLE experience_redeem_codes ADD COLUMN activated_at DATETIME NULL' },
    { name: 'redeemed_at', sql: 'ALTER TABLE experience_redeem_codes ADD COLUMN redeemed_at DATETIME NULL' },
    { name: 'redeemed_record_id', sql: 'ALTER TABLE experience_redeem_codes ADD COLUMN redeemed_record_id BIGINT NULL' },
    { name: 'expired_at', sql: 'ALTER TABLE experience_redeem_codes ADD COLUMN expired_at DATETIME NULL' },
  ]);
}

async function ensureMySqlLicenseCenterTables(): Promise<void> {
  await execute(
    `CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      client_key VARCHAR(100) NULL,
      default_trial_days INT NOT NULL DEFAULT 3,
      offline_valid_days INT NOT NULL DEFAULT 3,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  await execute(
    `CREATE TABLE IF NOT EXISTS product_plans (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      product_id VARCHAR(64) NOT NULL,
      name VARCHAR(100) NOT NULL,
      duration_days INT NOT NULL DEFAULT 30,
      seat_limit INT NOT NULL DEFAULT 1,
      device_limit INT NOT NULL DEFAULT 1,
      is_permanent TINYINT(1) NOT NULL DEFAULT 0,
      features TEXT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_product_plans_product (product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  await execute(
    `CREATE TABLE IF NOT EXISTS user_product_entitlements (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      product_id VARCHAR(64) NOT NULL,
      access_type VARCHAR(32) NOT NULL DEFAULT 'paid',
      expires_at DATETIME NULL,
      is_permanent TINYINT(1) NOT NULL DEFAULT 0,
      trial_started_at DATETIME NULL,
      trial_expires_at DATETIME NULL,
      trial_claimed_at DATETIME NULL,
      seat_limit INT NOT NULL DEFAULT 1,
      device_limit INT NOT NULL DEFAULT 1,
      features TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_entitlements_user_product (user_id, product_id),
      INDEX idx_entitlements_product (product_id),
      INDEX idx_entitlements_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  await execute(
    `CREATE TABLE IF NOT EXISTS license_codes (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      code VARCHAR(80) NOT NULL UNIQUE,
      display_code VARCHAR(100) NOT NULL,
      product_id VARCHAR(64) NOT NULL,
      plan_name VARCHAR(100) NULL,
      duration_days INT NOT NULL DEFAULT 30,
      seat_limit INT NOT NULL DEFAULT 1,
      device_limit INT NOT NULL DEFAULT 1,
      is_permanent TINYINT(1) NOT NULL DEFAULT 0,
      status VARCHAR(24) NOT NULL DEFAULT 'unused',
      features TEXT NULL,
      generated_by VARCHAR(36) NULL,
      redeemed_by VARCHAR(36) NULL,
      redeemed_at DATETIME NULL,
      note VARCHAR(255) NULL,
      expired_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_license_codes_product_status (product_id, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  await execute(
    `CREATE TABLE IF NOT EXISTS license_code_redemptions (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      code_id VARCHAR(36) NOT NULL,
      code VARCHAR(80) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      product_id VARCHAR(64) NOT NULL,
      redeemed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_license_redemptions_user (user_id),
      INDEX idx_license_redemptions_product (product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  await execute(
    `CREATE TABLE IF NOT EXISTS user_devices (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      product_id VARCHAR(64) NOT NULL,
      device_id VARCHAR(128) NOT NULL,
      device_name VARCHAR(128) NULL,
      status VARCHAR(24) NOT NULL DEFAULT 'active',
      first_activated_at DATETIME NULL,
      last_seen_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_user_devices_user_product_device (user_id, product_id, device_id),
      INDEX idx_user_devices_user_product (user_id, product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  await execute(
    `CREATE TABLE IF NOT EXISTS license_sessions (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      session_id VARCHAR(64) NOT NULL UNIQUE,
      user_id VARCHAR(36) NOT NULL,
      product_id VARCHAR(64) NOT NULL,
      device_id VARCHAR(128) NOT NULL,
      status VARCHAR(24) NOT NULL DEFAULT 'active',
      started_at DATETIME NULL,
      last_heartbeat_at DATETIME NULL,
      heartbeat_expires_at DATETIME NULL,
      ended_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_license_sessions_active (user_id, product_id, status, heartbeat_expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );

  await execute(
    `INSERT INTO products (
       id, name, client_key, default_trial_days, offline_valid_days, is_active, created_at
     ) VALUES (?, '凤煌', 'fenghuang-desktop', 3, 3, 1, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       client_key = VALUES(client_key),
       default_trial_days = VALUES(default_trial_days),
       offline_valid_days = VALUES(offline_valid_days),
       is_active = 1`,
    [DEFAULT_LICENSE_PRODUCT_ID],
  );
}

async function runMySqlBackfill(): Promise<void> {
  await execute(
    `UPDATE users
     SET phone_verified_at = COALESCE(phone_verified_at, created_at),
         must_bind_contact = 0
     WHERE phone IS NOT NULL`,
  );

  await execute(
    `UPDATE users
     SET wechat_bound_at = COALESCE(wechat_bound_at, created_at),
         must_bind_contact = 0
     WHERE wechat_openid IS NOT NULL`,
  );

  await execute(
    `UPDATE users
     SET password_updated_at = COALESCE(password_updated_at, created_at)
     WHERE password_hash IS NOT NULL`,
  );

  await execute(
    `UPDATE users
     SET must_bind_contact = 0
     WHERE role IN ('admin', 'rootadmin', 'super_admin')`,
  );
}

async function upsertRootAdminSqlite(): Promise<void> {
  await execute(
    `INSERT INTO users (
      id, username, password_hash, nickname, role, status, points, referral_code,
      password_updated_at, must_bind_contact, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 0, CURRENT_TIMESTAMP)
    ON CONFLICT(username) DO UPDATE SET
      password_hash = excluded.password_hash,
      nickname = excluded.nickname,
      role = excluded.role,
      status = excluded.status,
      points = excluded.points,
      referral_code = excluded.referral_code,
      password_updated_at = excluded.password_updated_at,
      must_bind_contact = excluded.must_bind_contact`,
    [
      'rootadmin-001',
      'rootadmin',
      ROOTADMIN_HASH,
      'Root Admin',
      'rootadmin',
      'active',
      49900,
      'ROOTADMIN',
    ],
  );
}

async function upsertRootAdminMySql(): Promise<void> {
  await execute(
    `INSERT INTO users (
      id, username, password_hash, nickname, role, status, points, referral_code,
      password_updated_at, must_bind_contact, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 0, CURRENT_TIMESTAMP)
    ON DUPLICATE KEY UPDATE
      password_hash = VALUES(password_hash),
      nickname = VALUES(nickname),
      role = VALUES(role),
      status = VALUES(status),
      points = VALUES(points),
      referral_code = VALUES(referral_code),
      password_updated_at = VALUES(password_updated_at),
      must_bind_contact = VALUES(must_bind_contact)`,
    [
      'rootadmin-001',
      'rootadmin',
      ROOTADMIN_HASH,
      'Root Admin',
      'rootadmin',
      'active',
      49900,
      'ROOTADMIN',
    ],
  );
}

async function upsertStandardTestUserSqlite(): Promise<void> {
  await execute(
    `INSERT INTO users (
      id, username, password_hash, nickname, role, status, points, referral_code,
      password_updated_at, must_bind_contact, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 0, CURRENT_TIMESTAMP)
    ON CONFLICT(username) DO UPDATE SET
      password_hash = excluded.password_hash,
      nickname = excluded.nickname,
      role = excluded.role,
      status = excluded.status,
      points = excluded.points,
      referral_code = excluded.referral_code,
      password_updated_at = excluded.password_updated_at,
      must_bind_contact = excluded.must_bind_contact`,
    [
      'test-user-123456',
      '123456',
      STANDARD_TEST_USER_HASH,
      'Standard Test User',
      'user',
      'active',
      1000,
      'TEST123456',
    ],
  );
}

async function upsertStandardTestUserMySql(): Promise<void> {
  await execute(
    `INSERT INTO users (
      id, username, password_hash, nickname, role, status, points, referral_code,
      password_updated_at, must_bind_contact, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 0, CURRENT_TIMESTAMP)
    ON DUPLICATE KEY UPDATE
      password_hash = VALUES(password_hash),
      nickname = VALUES(nickname),
      role = VALUES(role),
      status = VALUES(status),
      points = VALUES(points),
      referral_code = VALUES(referral_code),
      password_updated_at = VALUES(password_updated_at),
      must_bind_contact = VALUES(must_bind_contact)`,
    [
      'test-user-123456',
      '123456',
      STANDARD_TEST_USER_HASH,
      'Standard Test User',
      'user',
      'active',
      1000,
      'TEST123456',
    ],
  );
}

export async function runAuthSystemMigrations(): Promise<void> {
  const adapter = getDatabaseAdapter();

  if (adapter === 'sqlite') {
    await ensureSqliteUserColumns();
    await ensureSqliteExperienceCodeTables();
    await ensureSqliteLicenseCenterTables();
    await runSqliteBackfill();
    await upsertRootAdminSqlite();
    await upsertStandardTestUserSqlite();
    return;
  }

  await ensureMySqlUserColumns();
  await ensureMySqlRechargeColumns();
  await ensureMySqlReferralCompatibility();
  await ensureMySqlExperienceCodeTables();
  await ensureMySqlLicenseCenterTables();
  await runMySqlBackfill();
  await upsertRootAdminMySql();
  await upsertStandardTestUserMySql();
}
