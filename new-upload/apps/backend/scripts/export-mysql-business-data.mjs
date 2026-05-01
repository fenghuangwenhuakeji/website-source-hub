import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const migrationRootInput = process.env.DATA_MIGRATION_ROOT || './data/migrations';
const resolvedMigrationRoot = path.isAbsolute(migrationRootInput)
  ? migrationRootInput
  : path.resolve(projectRoot, migrationRootInput);

fs.mkdirSync(resolvedMigrationRoot, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputPath = path.join(
  resolvedMigrationRoot,
  `mysql-business-export-${timestamp}.json`
);

const tables = [
  'users',
  'recharge_packages',
  'points_exchange_products',
  'recharge_orders',
  'orders',
  'vip_orders',
  'user_durations',
  'points_records',
  'points_log',
  'referrals',
  'referral_settings',
  'referral_reward_claims',
  'novels',
  'chapters',
];

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chaowuqiong_db',
  waitForConnections: true,
  connectionLimit: 2,
});

function jsonReplacer(_key, value) {
  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Buffer.isBuffer(value)) {
    return value.toString('base64');
  }

  return value;
}

try {
  const [existingRows] = await pool.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = ?`,
    [process.env.DB_NAME || 'chaowuqiong_db']
  );

  const existingTables = new Set(existingRows.map((row) => row.table_name));

  const payload = {
    exportedAt: new Date().toISOString(),
    source: {
      adapter: 'mysql',
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_NAME || 'chaowuqiong_db',
    },
    summary: {
      exportedTables: 0,
      missingTables: [],
      rowCounts: {},
    },
    data: {},
  };

  for (const tableName of tables) {
    if (!existingTables.has(tableName)) {
      payload.summary.missingTables.push(tableName);
      continue;
    }

    const [rows] = await pool.query(`SELECT * FROM \`${tableName}\``);
    payload.data[tableName] = rows;
    payload.summary.rowCounts[tableName] = rows.length;
    payload.summary.exportedTables += 1;
  }

  fs.writeFileSync(outputPath, JSON.stringify(payload, jsonReplacer, 2), 'utf8');
  console.log(`MySQL business data exported to: ${outputPath}`);
  console.log(
    `Exported ${payload.summary.exportedTables} tables, ${payload.summary.missingTables.length} missing.`
  );
} finally {
  await pool.end();
}
