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
  `sqlite-business-export-${timestamp}.json`
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

const database = new DatabaseSync(resolvedDbPath, { readonly: true });

try {
  const existingTables = new Set(
    database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((row) => row.name)
  );

  const payload = {
    exportedAt: new Date().toISOString(),
    source: {
      adapter: 'sqlite',
      dbPath: resolvedDbPath,
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

    const rows = database.prepare(`SELECT * FROM ${tableName}`).all();
    payload.data[tableName] = rows;
    payload.summary.rowCounts[tableName] = rows.length;
    payload.summary.exportedTables += 1;
  }

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`SQLite business data exported to: ${outputPath}`);
  console.log(
    `Exported ${payload.summary.exportedTables} tables, ${payload.summary.missingTables.length} missing.`
  );
} finally {
  database.close();
}
