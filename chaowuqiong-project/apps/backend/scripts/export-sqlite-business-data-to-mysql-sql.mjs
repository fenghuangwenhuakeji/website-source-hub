import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const dbPathInput = process.env.DB_SQLITE_PATH || './data/local-dev.sqlite';
if (dbPathInput === ':memory:') {
  console.error('Cannot export an in-memory SQLite database.');
  process.exit(1);
}

const migrationRootInput = process.env.DATA_MIGRATION_ROOT || './data/migrations';
const resolvedDbPath = path.isAbsolute(dbPathInput)
  ? dbPathInput
  : path.resolve(projectRoot, dbPathInput);
const resolvedMigrationRoot = path.isAbsolute(migrationRootInput)
  ? migrationRootInput
  : path.resolve(projectRoot, migrationRootInput);

if (!fs.existsSync(resolvedDbPath)) {
  console.error(`SQLite database not found: ${resolvedDbPath}`);
  process.exit(1);
}

fs.mkdirSync(resolvedMigrationRoot, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputPath = path.join(
  resolvedMigrationRoot,
  `sqlite-business-export-${timestamp}.mysql.sql`
);

const tables = [
  'users',
  'recharge_packages',
  'points_exchange_products',
  'referral_settings',
  'recharge_orders',
  'orders',
  'vip_orders',
  'user_durations',
  'points_records',
  'points_log',
  'referrals',
  'referral_reward_claims',
  'novels',
  'chapters',
];

const protectedColumnsByTable = {
  users: ['id'],
  recharge_packages: ['id'],
  points_exchange_products: ['id'],
  referral_settings: ['id'],
  recharge_orders: ['id'],
  orders: ['id'],
  vip_orders: ['id'],
  user_durations: ['user_id'],
  points_records: ['id'],
  points_log: ['id'],
  referrals: ['id'],
  referral_reward_claims: ['id'],
  novels: ['id'],
  chapters: ['id'],
};

function escapeIdentifier(value) {
  return `\`${String(value).replace(/`/g, '``')}\``;
}

function escapeString(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\u0000/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\u001a/g, '\\Z')
    .replace(/'/g, "\\'");
}

function normalizeDateString(value) {
  if (typeof value !== 'string') {
    return value;
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 19).replace('T', ' ');
    }
  }

  return value;
}

function escapeValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : 'NULL';
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }

  return `'${escapeString(normalizeDateString(value))}'`;
}

function buildInsertStatement(tableName, row) {
  const columns = Object.keys(row);
  const values = columns.map((column) => escapeValue(row[column]));
  const protectedColumns = new Set(protectedColumnsByTable[tableName] || []);
  const updateColumns = columns.filter((column) => !protectedColumns.has(column));
  const updateClause =
    updateColumns.length > 0
      ? updateColumns
          .map((column) => `${escapeIdentifier(column)} = VALUES(${escapeIdentifier(column)})`)
          .join(', ')
      : `${escapeIdentifier(columns[0])} = VALUES(${escapeIdentifier(columns[0])})`;

  return [
    `INSERT INTO ${escapeIdentifier(tableName)} (${columns.map(escapeIdentifier).join(', ')})`,
    `VALUES (${values.join(', ')})`,
    `ON DUPLICATE KEY UPDATE ${updateClause};`,
  ].join(' ');
}

const database = new DatabaseSync(resolvedDbPath, { readonly: true });

try {
  const existingTables = new Set(
    database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((row) => row.name)
  );

  const lines = [
    '-- Generated from SQLite business data for MySQL import',
    `-- Source: ${resolvedDbPath}`,
    `-- Exported at: ${new Date().toISOString()}`,
    'SET NAMES utf8mb4;',
    'SET time_zone = "+00:00";',
    'SET FOREIGN_KEY_CHECKS = 0;',
    'START TRANSACTION;',
    '',
  ];

  let exportedTables = 0;
  let exportedRows = 0;

  for (const tableName of tables) {
    if (!existingTables.has(tableName)) {
      lines.push(`-- Skipped missing table: ${tableName}`, '');
      continue;
    }

    const rows = database.prepare(`SELECT * FROM ${tableName}`).all();
    lines.push(`-- Table: ${tableName} (${rows.length} rows)`);

    for (const row of rows) {
      lines.push(buildInsertStatement(tableName, row));
    }

    lines.push('');
    exportedTables += 1;
    exportedRows += rows.length;
  }

  lines.push('COMMIT;');
  lines.push('SET FOREIGN_KEY_CHECKS = 1;');
  lines.push('');
  lines.push(`-- Exported tables: ${exportedTables}`);
  lines.push(`-- Exported rows: ${exportedRows}`);

  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(`SQLite business data converted to MySQL SQL: ${outputPath}`);
  console.log(`Exported ${exportedTables} tables, ${exportedRows} rows.`);
} finally {
  database.close();
}
