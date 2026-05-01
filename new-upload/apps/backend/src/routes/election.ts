import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { cacheGet, cacheSet, cacheIncr, getRedisClient } from '../config/redis.js';
import { config } from '../config/index.js';
import { RowDataPacket } from 'mysql2/promise';

const router = Router();

interface ElectionState {
  currentTerm: number;
  votedFor: string | null;
  leaderId: string | null;
  commitIndex: number;
  lastApplied: number;
  state: 'leader' | 'follower' | 'candidate';
  lastHeartbeat: number;
}

const electionState: ElectionState = {
  currentTerm: 0,
  votedFor: null,
  leaderId: null,
  commitIndex: 0,
  lastApplied: 0,
  state: 'follower',
  lastHeartbeat: Date.now(),
};

let electionTimer: ReturnType<typeof setInterval> | null = null;
const ELECTION_TIMEOUT = 5000;
const HEARTBEAT_INTERVAL = 3000;

async function initializeElectionNode(): Promise<void> {
  try {
    const nodeId = uuidv4();
    const host = process.env.HOST || 'localhost';
    const port = config.port;

    const dbConnected = await import('../config/database.js').then(m => m.isDatabaseConnected());
    if (!dbConnected) {
      electionState.state = 'leader';
      electionState.leaderId = 'standalone';
      console.log('Election节点初始化完成（standalone模式，无数据库）');
      return;
    }

    const existing = await db.query<RowDataPacket[]>(
      'SELECT * FROM election_nodes WHERE host = ? AND port = ?',
      [host, port]
    );

    if (existing.length === 0) {
      await db.execute(
        `INSERT INTO election_nodes (node_id, host, port, role, last_active_at, vote_count, created_at)
         VALUES (?, ?, ?, 'leader', NOW(), 0, NOW())`,
        [nodeId, host, port]
      );
      electionState.leaderId = nodeId;
      electionState.state = 'leader';
    } else {
      const node = existing[0] as any;
      electionState.leaderId = node.node_id;
      electionState.state = node.role === 'leader' ? 'leader' : 'follower';
    }

    console.log(`Election节点初始化完成, NodeId: ${electionState.leaderId}, Role: ${electionState.state}`);
    startHeartbeat();
  } catch (error) {
    console.error('Election初始化失败:', error);
    electionState.state = 'leader';
    electionState.leaderId = 'standalone';
  }
}

function startHeartbeat(): void {
  if (electionTimer) {
    clearInterval(electionTimer);
  }

  electionTimer = setInterval(async () => {
    if (electionState.state === 'leader') {
      await sendHeartbeat();
    } else {
      checkElectionTimeout();
    }
  }, HEARTBEAT_INTERVAL);
}

async function sendHeartbeat(): Promise<void> {
  try {
    await cacheSet(`election:heartbeat:${electionState.leaderId}`, {
      term: electionState.currentTerm,
      leaderId: electionState.leaderId,
      timestamp: Date.now(),
    }, 10);

    electionState.lastHeartbeat = Date.now();
  } catch (error) {
    console.error('发送心跳失败:', error);
  }
}

function checkElectionTimeout(): void {
  const timeSinceLastHeartbeat = Date.now() - electionState.lastHeartbeat;

  if (timeSinceLastHeartbeat > ELECTION_TIMEOUT && electionState.state !== 'leader') {
    startElection();
  }
}

async function startElection(): Promise<void> {
  electionState.state = 'candidate';
  electionState.currentTerm += 1;
  electionState.votedFor = electionState.leaderId;

  console.log(`开始选举，Term: ${electionState.currentTerm}`);

  try {
    const nodes = await db.query<RowDataPacket[]>(
      'SELECT * FROM election_nodes WHERE role = ?',
      ['leader']
    );

    let votes = 1;

    if (nodes.length > 0) {
      if (electionState.currentTerm > 0) {
        votes = 1;
      }
    }

    if (votes >= 1) {
      electionState.state = 'leader';
      electionState.leaderId = electionState.leaderId || uuidv4();

      await db.execute(
        'UPDATE election_nodes SET role = ?, last_active_at = NOW() WHERE node_id = ?',
        ['leader', electionState.leaderId]
      );

      console.log(`赢得选举，成为Leader，Term: ${electionState.currentTerm}`);
      startHeartbeat();
    }
  } catch (error) {
    console.error('选举失败:', error);
    electionState.state = 'follower';
  }
}

router.get('/status', authMiddleware, async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      term: electionState.currentTerm,
      leaderId: electionState.leaderId,
      state: electionState.state,
      commitIndex: electionState.commitIndex,
      lastApplied: electionState.lastApplied,
      isLeader: electionState.state === 'leader',
    },
  });
});

router.get('/leader', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const nodes = await db.query<RowDataPacket[]>(
      'SELECT * FROM election_nodes WHERE role = ? ORDER BY last_active_at DESC LIMIT 1',
      ['leader']
    );

    if (nodes.length === 0) {
      res.json({
        success: true,
        data: {
          leaderId: electionState.leaderId,
          isLocal: true,
          message: '当前没有Leader，使用本地节点',
        },
      });
      return;
    }

    const leader = nodes[0] as any;

    res.json({
      success: true,
      data: {
        leaderId: leader.node_id,
        host: leader.host,
        port: leader.port,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/submit', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const { type, key, value } = req.body;

    if (!type || !key) {
      throw ApiError.badRequest('type和key不能为空');
    }

    if (electionState.state !== 'leader') {
      throw ApiError.badRequest('当前不是Leader节点，请稍后重试');
    }

    const electionId = uuidv4();
    const clientId = `client_${userId}`;

    await db.execute(
      `INSERT INTO election_log (id, term, type, key, value, client_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [electionId, electionState.currentTerm, type, key, value || '', clientId]
    );

    await commitLog(electionId);

    res.json({
      success: true,
      data: {
        electionId,
        term: electionState.currentTerm,
        status: 'applied',
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/sync/:clientId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clientId } = req.params;
    const sinceTerm = parseInt(req.query.sinceTerm as string) || 0;

    const logs = await db.query<RowDataPacket[]>(
      `SELECT * FROM election_log
       WHERE client_id = ? AND term >= ? AND status IN ('committed', 'applied')
       ORDER BY term ASC, created_at ASC
       LIMIT 100`,
      [clientId, sinceTerm]
    );

    const appliedLogs = await db.query<RowDataPacket[]>(
      `SELECT * FROM election_log
       WHERE status = 'applied' AND term > ?
       ORDER BY term ASC, created_at ASC
       LIMIT 100`,
      [sinceTerm]
    );

    res.json({
      success: true,
      data: {
        term: electionState.currentTerm,
        leaderId: electionState.leaderId,
        state: electionState.state,
        pendingLogs: logs.map(log => ({
          id: (log as any).id,
          type: (log as any).type,
          key: (log as any).key,
          value: (log as any).value,
          term: (log as any).term,
        })),
        appliedLogs: appliedLogs.map(log => ({
          id: (log as any).id,
          type: (log as any).type,
          key: (log as any).key,
          value: (log as any).value,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/vote', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { candidateId, term } = req.body;

    if (term > electionState.currentTerm) {
      electionState.currentTerm = term;
      electionState.votedFor = null;
      electionState.leaderId = null;
      electionState.state = 'follower';
    }

    let voteGranted = false;

    if (electionState.votedFor === null || electionState.votedFor === candidateId) {
      electionState.votedFor = candidateId;
      electionState.currentTerm = term;
      voteGranted = true;

      console.log(`投票给候选者 ${candidateId}，Term: ${term}`);
    }

    res.json({
      success: true,
      data: {
        voteGranted,
        term: electionState.currentTerm,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/heartbeat', async (req: Request, res: Response) => {
  try {
    const { leaderId, term } = req.body;

    if (term >= electionState.currentTerm) {
      electionState.currentTerm = term;
      electionState.leaderId = leaderId;
      electionState.votedFor = leaderId;
      electionState.state = 'follower';
      electionState.lastHeartbeat = Date.now();

      await db.execute(
        'UPDATE election_nodes SET last_active_at = NOW() WHERE node_id = ?',
        [leaderId]
      );

      res.json({
        success: true,
        data: {
          term: electionState.currentTerm,
          success: true,
        },
      });
    } else {
      res.json({
        success: true,
        data: {
          term: electionState.currentTerm,
          success: false,
        },
      });
    }
  } catch (error) {
    console.error('Heartbeat处理错误:', error);
    res.json({
      success: false,
      data: {
        term: electionState.currentTerm,
        success: false,
      },
    });
  }
});

router.get('/nodes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const nodes = await db.query<RowDataPacket[]>(
      'SELECT * FROM election_nodes ORDER BY created_at ASC'
    );

    res.json({
      success: true,
      data: {
        nodes: nodes.map(node => ({
          nodeId: (node as any).node_id,
          host: (node as any).host,
          port: (node as any).port,
          role: (node as any).role,
          lastActiveAt: (node as any).last_active_at,
          isLocal: (node as any).host === (process.env.HOST || 'localhost') && (node as any).port === config.port,
        })),
        currentNodeId: electionState.leaderId,
        currentState: electionState.state,
      },
    });
  } catch (error) {
    next(error);
  }
});

async function commitLog(logId: string): Promise<void> {
  try {
    await db.transaction(async (connection) => {
      const [logs] = await connection.execute(
        'SELECT * FROM election_log WHERE id = ? FOR UPDATE',
        [logId]
      );

      const logArray = logs as RowDataPacket[];
      if (logArray.length === 0) {
        throw new Error('Election log not found');
      }

      const log = logArray[0] as any;

      if (log.status === 'applied') {
        return;
      }

      await connection.execute(
        'UPDATE election_log SET status = ?, committed_at = NOW() WHERE id = ? AND status = ?',
        ['committed', logId, 'pending']
      );

      await connection.execute(
        'UPDATE election_log SET status = ? WHERE id = ?',
        ['applied', logId]
      );

      electionState.commitIndex += 1;
      electionState.lastApplied = electionState.commitIndex;
    });
  } catch (error) {
    console.error('提交日志失败:', error);
    throw error;
  }
}

setTimeout(initializeElectionNode, 2000);

export default router;
