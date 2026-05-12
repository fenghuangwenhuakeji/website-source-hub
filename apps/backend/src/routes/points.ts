import { Router } from 'express';
import type { PoolConnection } from '../config/database.js';
import { query, transaction } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { durationToSeconds, grantDurationToUser } from '../utils/durationAccess.js';
import { DEFAULT_LICENSE_PRODUCT_ID, upsertProductEntitlement } from '../utils/licenseCenter.js';
import { insertPointsRecord } from '../utils/pointsRecord.js';

const router = Router();

async function selectRows<T = any[]>(
  sql: string,
  params: any[] = [],
  connection?: PoolConnection
): Promise<T> {
  if (connection) {
    const [rows] = await connection.execute(sql, params);
    return rows as T;
  }

  return query<T>(sql, params);
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

  await query(sql, params);
}

router.get('/balance', authMiddleware, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const users = await query<any[]>('SELECT points, balance FROM users WHERE id = ?', [userId]);

    if (!users || users.length === 0) {
      throw new AppError(404, '用户不存在');
    }

    res.json({
      success: true,
      data: users[0],
    });
  } catch (error) {
    next(error);
  }
});

router.post('/exchange', authMiddleware, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const { productId } = req.body;

    if (!productId) {
      throw new AppError(400, '请选择兑换商品');
    }

    const result = await transaction(async (connection) => {
      const products = await selectRows<any[]>(
        'SELECT * FROM points_exchange_products WHERE id = ? AND is_active = 1',
        [productId],
        connection
      );
      if (!products || products.length === 0) {
        throw new AppError(404, '兑换商品不存在或已下架');
      }

      const product = products[0] as any;
      const users = await selectRows<any[]>('SELECT points FROM users WHERE id = ?', [userId], connection);
      if (!users || users.length === 0) {
        throw new AppError(404, '用户不存在');
      }

      const currentPoints = Number((users[0] as any).points || 0);
      if (currentPoints < Number(product.points_cost)) {
        throw new AppError(400, '积分不足');
      }

      await runExecute('UPDATE users SET points = points - ? WHERE id = ?', [product.points_cost, userId], connection);
      await insertPointsRecord({
        userId,
        points: -Number(product.points_cost),
        type: 'exchange',
        description: `积分兑换时长：${product.name}`,
        connection,
      });
      await grantDurationToUser(userId, Number(product.duration), product.duration_unit, connection);
      await upsertProductEntitlement(
        {
          userId,
          productId: DEFAULT_LICENSE_PRODUCT_ID,
          accessType: product.duration_unit === 'permanent' ? 'permanent' : 'paid',
          durationDays: durationToSeconds(Number(product.duration), product.duration_unit) / 86400,
          isPermanent: product.duration_unit === 'permanent',
          seatLimit: 1,
          deviceLimit: 1,
        },
        connection
      );

      return {
        productName: product.name,
        duration: Number(product.duration),
        durationUnit: product.duration_unit,
        pointsCost: Number(product.points_cost),
      };
    });

    res.json({
      success: true,
      message: '兑换成功',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/exchange-duration', authMiddleware, async (_req, _res, next) => {
  next(new AppError(403, '请使用后台配置的积分兑换商品，暂不支持自定义时长兑换。'));
});

router.post('/free-duration', authMiddleware, async (_req, _res, next) => {
  next(new AppError(403, '免费时长入口已关闭，请先充值积分并兑换时长。'));
});

router.get('/free-duration/status', authMiddleware, async (_req, res) => {
  res.json({
    success: true,
    data: {
      canClaimToday: false,
      totalClaimDays: 0,
      maxClaimDays: 0,
      remainingDays: 0,
      message: '免费时长入口已关闭。',
    },
  });
});

router.get('/records', authMiddleware, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const offset = (page - 1) * limit;

    const records = await query<any[]>(
      'SELECT * FROM points_records WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );
    const countRows = await query<any[]>(
      'SELECT COUNT(*) AS total FROM points_records WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      data: {
        list: records,
        pagination: {
          page,
          limit,
          total: Number((countRows[0] as any)?.total || 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/products', async (_req, res, next) => {
  try {
    const products = await query<any[]>(
      'SELECT * FROM points_exchange_products WHERE is_active = 1 ORDER BY sort_order ASC, created_at DESC'
    );
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

export default router;
