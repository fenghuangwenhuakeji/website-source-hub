import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { redis } from '../config/redis.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

interface GachaItem {
  id: number;
  name: string;
  type: string;
  rarity: number;
  weight: number;
  is_display: number;
  pool_id: number;
}

interface GachaPool {
  id: number;
  name: string;
  description: string;
  cost_per_draw: number;
  cost_per_ten: number;
  is_active: number;
  start_time: Date;
  end_time: Date;
}

router.get('/list', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pools = await db.query(
      `SELECT id, name, description, cost_per_draw, cost_per_ten, is_active, start_time, end_time
       FROM gacha_pools
       WHERE is_active = 1
       ORDER BY sort_order ASC`
    );

    res.json({
      success: true,
      data: pools
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:poolId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { poolId } = req.params;

    const pools = await db.query<GachaPool[]>(
      `SELECT id, name, description, cost_per_draw, cost_per_ten, is_active, start_time, end_time
       FROM gacha_pools WHERE id = ?`,
      [poolId]
    );

    if (pools.length === 0) {
      throw new AppError(404, '卡池不存在');
    }

    const items = await db.query<GachaItem[]>(
      `SELECT id, name, type, rarity, is_display
       FROM gacha_items
       WHERE pool_id = ? AND is_display = 1
       ORDER BY rarity DESC, id ASC`,
      [poolId]
    );

    res.json({
      success: true,
      data: {
        pool: pools[0],
        items
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:poolId/items', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { poolId } = req.params;
    const showAll = req.query.showAll === 'true';

    let sql = `SELECT id, name, type, rarity, is_display FROM gacha_items WHERE pool_id = ?`;
    if (!showAll) {
      sql += ` AND is_display = 1`;
    }
    sql += ` ORDER BY rarity DESC, id ASC`;

    const items = await db.query<GachaItem[]>(sql, [poolId]);

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/draw',
  authMiddleware,
  body('poolId').isInt().withMessage('卡池ID无效'),
  body('drawType').isIn(['single', 'ten']).withMessage('抽取类型无效'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, errors.array()[0].msg);
      }

      const { poolId, drawType } = req.body;
      const userId = req.user!.id;

      const pools = await db.query<GachaPool[]>(
        'SELECT * FROM gacha_pools WHERE id = ? AND is_active = 1',
        [poolId]
      );

      if (pools.length === 0) {
        throw new AppError(404, '卡池不存在或已关闭');
      }

      const pool = pools[0];
      const cost = drawType === 'single' ? pool.cost_per_draw : pool.cost_per_ten;
      const drawCount = drawType === 'single' ? 1 : 10;

      const balanceCheck = await db.query<{ balance: number }[]>(
        'SELECT balance FROM users WHERE id = ?',
        [userId]
      );

      if (balanceCheck[0].balance < cost) {
        throw new AppError(400, '余额不足');
      }

      const poolCacheKey = `gacha_pool:${poolId}:items`;
      let items: GachaItem[] | null = null;

      try {
        if (redis) {
          const cached = await redis.get(poolCacheKey);
          if (cached) {
            items = JSON.parse(cached);
          }
        }
      } catch (e) {
        // Redis unavailable, query from DB
      }

      if (!items) {
        items = await db.query<GachaItem[]>(
          'SELECT * FROM gacha_items WHERE pool_id = ?',
          [poolId]
        );

        try {
          if (redis && (redis as any).set) {
            await (redis as any).set(poolCacheKey, JSON.stringify(items), { EX: 3600 });
          }
        } catch (e) {
          // Redis unavailable
        }
      }

      if (!items || items.length === 0) {
        throw new AppError(400, '卡池内没有物品');
      }

      const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
      const drawnItems: { id: number; name: string; type: string; rarity: number }[] = [];

      for (let i = 0; i < drawCount; i++) {
        let random = Math.random() * totalWeight;
        for (const item of items) {
          random -= item.weight;
          if (random <= 0) {
            drawnItems.push({
              id: item.id,
              name: item.name,
              type: item.type,
              rarity: item.rarity
            });
            break;
          }
        }
      }

      const result = await db.transaction(async (connection) => {
        const [users] = await connection.execute(
          'SELECT balance FROM users WHERE id = ? FOR UPDATE',
          [userId]
        );

        const balanceBefore = (users as any)[0].balance;

        if (balanceBefore < cost) {
          throw new AppError(400, '余额不足');
        }

        await connection.execute(
          'UPDATE users SET balance = balance - ? WHERE id = ?',
          [cost, userId]
        );

        const recordId = uuidv4();
        await connection.execute(
          `INSERT INTO gacha_records (id, user_id, pool_id, draw_type, items, cost)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [recordId, userId, poolId, drawType, JSON.stringify(drawnItems), cost]
        );

        for (const drawnItem of drawnItems) {
          const [existingItems] = await connection.execute(
            'SELECT id, quantity FROM user_items WHERE user_id = ? AND item_id = ?',
            [userId, drawnItem.id]
          );

          if ((existingItems as any).length > 0) {
            await connection.execute(
              'UPDATE user_items SET quantity = quantity + 1 WHERE id = ?',
              [(existingItems as any)[0].id]
            );
          } else {
            await connection.execute(
              `INSERT INTO user_items (user_id, item_id, item_name, item_type, rarity, quantity, obtained_from)
               VALUES (?, ?, ?, ?, ?, 1, 'gacha')`,
              [userId, drawnItem.id, drawnItem.name, drawnItem.type, drawnItem.rarity]
            );
          }
        }

        const [updatedUsers] = await connection.execute(
          'SELECT balance FROM users WHERE id = ?',
          [userId]
        );

        const recordForConsumption = uuidv4();
        await connection.execute(
          `INSERT INTO consumption_records (id, user_id, type, amount, balance_before, balance_after, reference_id, description)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [recordForConsumption, userId, 'gacha', cost, balanceBefore, (updatedUsers as any)[0].balance, recordId, `抽卡: ${pool.name}`]
        );

        return {
          recordId,
          items: drawnItems,
          cost,
          balanceBefore,
          balanceAfter: (updatedUsers as any)[0].balance
        };
      });

      res.json({
        success: true,
        message: '抽取成功',
        data: {
          recordId: result.recordId,
          items: result.items,
          cost: result.cost,
          balance: result.balanceAfter,
          isGuaranteed: drawnItems.some(item => item.rarity >= 4)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/records', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const records = await db.query(
      `SELECT gr.*, gp.name as pool_name
       FROM gacha_records gr
       JOIN gacha_pools gp ON gr.pool_id = gp.id
       WHERE gr.user_id = ?
       ORDER BY gr.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user!.id, limit, offset]
    );

    const total = await db.query<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM gacha_records WHERE user_id = ?',
      [req.user!.id]
    );

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          total: total[0].count
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
