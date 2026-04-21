import mysql from 'mysql2/promise';
import type {
  Pool as MysqlPool,
  RowDataPacket,
  FieldPacket,
  PoolConnection as MysqlPoolConnection,
  ResultSetHeader,
} from 'mysql2/promise';
import { config } from './index.js';
import type { SqliteConnection } from './sqliteAdapter.js';

type DatabaseAdapter = 'mysql' | 'sqlite';
type SqliteAdapterModule = typeof import('./sqliteAdapter.js');
type SqliteDatabase = ReturnType<SqliteAdapterModule['initializeSqliteDatabase']>;

let pool: MysqlPool | null = null;
let sqliteDb: SqliteDatabase | null = null;
let isDbConnected = false;
let activeAdapter: DatabaseAdapter =
  config.database.adapter === 'sqlite' ? 'sqlite' : 'mysql';
let sqliteAdapterPromise: Promise<SqliteAdapterModule> | null = null;

export type PoolConnection = MysqlPoolConnection | SqliteConnection;

async function loadSqliteAdapter(): Promise<SqliteAdapterModule> {
  if (!sqliteAdapterPromise) {
    sqliteAdapterPromise = import('./sqliteAdapter.js');
  }

  return sqliteAdapterPromise;
}

export function getDatabaseAdapter(): DatabaseAdapter {
  return activeAdapter;
}

export async function initializeDatabase(): Promise<boolean> {
  if (config.database.adapter === 'sqlite') {
    const { initializeSqliteDatabase } = await loadSqliteAdapter();
    sqliteDb = initializeSqliteDatabase(config.database.sqlitePath);
    isDbConnected = true;
    activeAdapter = 'sqlite';
    console.log(`SQLite database initialized at ${config.database.sqlitePath}`);
    return true;
  }

  try {
    pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000,
    });

    const connection = await pool.getConnection();
    console.log('MySQL pool initialized');
    connection.release();
    isDbConnected = true;
    activeAdapter = 'mysql';
    return true;
  } catch (error: any) {
    console.warn('Database connection failed:', error.message);
    console.warn('Backend will continue in limited mode without a connected database.');
    isDbConnected = false;
    return false;
  }
}

export function isDatabaseConnected(): boolean {
  return isDbConnected;
}

export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T> {
  if (activeAdapter === 'sqlite') {
    if (!sqliteDb) {
      throw new Error('SQLite database not initialized');
    }
    const { runSqliteQuery } = await loadSqliteAdapter();
    return runSqliteQuery<T>(sqliteDb, sql, params || []);
  }

  if (!pool) {
    throw new Error('Database not connected');
  }

  const [rows] = (await pool.query(sql, params)) as [T, FieldPacket[]];
  return rows;
}

export async function execute(
  sql: string,
  params?: any[]
): Promise<ResultSetHeader> {
  if (activeAdapter === 'sqlite') {
    if (!sqliteDb) {
      throw new Error('SQLite database not initialized');
    }
    const { runSqliteQuery } = await loadSqliteAdapter();
    return runSqliteQuery<ResultSetHeader>(sqliteDb, sql, params || []);
  }

  if (!pool) {
    throw new Error('Database not connected');
  }

  const [result] = (await pool.execute(sql, params)) as [ResultSetHeader, FieldPacket[]];
  return result;
}

export async function getConnection(): Promise<PoolConnection> {
  if (activeAdapter === 'sqlite') {
    if (!sqliteDb) {
      throw new Error('SQLite database not initialized');
    }
    const { SqliteConnection } = await loadSqliteAdapter();
    return new SqliteConnection(sqliteDb);
  }

  if (!pool) {
    throw new Error('Database not connected');
  }

  return pool.getConnection();
}

export async function transaction<T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  if (activeAdapter === 'sqlite') {
    if (!sqliteDb) {
      throw new Error('SQLite database not initialized');
    }

    const { SqliteConnection } = await loadSqliteAdapter();
    const connection = new SqliteConnection(sqliteDb);
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  if (!pool) {
    throw new Error('Database not connected');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function closeDatabase(): Promise<void> {
  if (activeAdapter === 'sqlite') {
    sqliteDb?.close();
    sqliteDb = null;
    return;
  }

  if (pool) {
    await pool.end();
    pool = null;
  }
}

const db = {
  query,
  execute,
  getConnection,
  transaction,
};

export { pool, RowDataPacket, db };
