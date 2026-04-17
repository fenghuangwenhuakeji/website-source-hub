import { execute, getDatabaseAdapter, query } from './database.js';

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
    await runSqliteBackfill();
    await upsertRootAdminSqlite();
    await upsertStandardTestUserSqlite();
    return;
  }

  await ensureMySqlUserColumns();
  await ensureMySqlRechargeColumns();
  await ensureMySqlExperienceCodeTables();
  await runMySqlBackfill();
  await upsertRootAdminMySql();
  await upsertStandardTestUserMySql();
}
