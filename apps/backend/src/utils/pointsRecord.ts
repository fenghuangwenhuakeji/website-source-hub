import type { PoolConnection } from '../config/database.js';
import { execute as dbExecute } from '../config/database.js';

interface InsertPointsRecordInput {
  userId: string;
  points: number;
  type: string;
  description: string;
  connection?: PoolConnection;
}

let lastGeneratedId = 0;

function nextPointsRecordId(): number {
  const seed = Date.now() * 1000 + Math.floor(Math.random() * 1000);
  lastGeneratedId = Math.max(seed, lastGeneratedId + 1);
  return lastGeneratedId;
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

export async function insertPointsRecord({
  userId,
  points,
  type,
  description,
  connection,
}: InsertPointsRecordInput): Promise<number> {
  const id = nextPointsRecordId();

  await runExecute(
    `INSERT INTO points_records (id, user_id, points, type, description, created_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [id, userId, points, type, description],
    connection
  );

  return id;
}
