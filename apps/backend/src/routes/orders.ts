import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { PoolConnection } from '../config/database.js';
import { query, transaction } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { grantDurationToUser } from '../utils/durationAccess.js';
import { insertPointsRecord } from '../utils/pointsRecord.js';
import { applyRechargeCommission } from '../utils/referralProgram.js';

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

async function getPackageBonusPoints(packageId?: number | null): Promise<number> {
  if (!packageId) {
    return 0;
  }

  const rows = await query<any[]>(
    'SELECT COALESCE(bonus_points, 0) AS bonus_points FROM recharge_packages WHERE id = ? LIMIT 1',
    [packageId]
  );

  return Number((rows[0] as any)?.bonus_points || 0);
}

async function exchangeDurationProduct(userId: string, productId: string) {
  return transaction(async (connection) => {
    const products = await selectRows<any[]>(
      'SELECT * FROM points_exchange_products WHERE id = ? AND is_active = 1',
      [productId],
      connection
    );
    if (!products || products.length === 0) {
      throw new AppError(404, '兑换商品不存在');
    }

    const product = products[0] as any;
    const users = await selectRows<any[]>('SELECT points FROM users WHERE id = ?', [userId], connection);
    if (!users || users.length === 0) {
      throw new AppError(404, '用户不存在');
    }

    const userPoints = Number((users[0] as any).points || 0);
    if (userPoints < Number(product.points_cost)) {
      throw new AppError(400, `积分不足，当前 ${userPoints}，需要 ${product.points_cost}`);
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

    return {
      exchangedPoints: Number(product.points_cost),
      duration: Number(product.duration),
      unit: product.duration_unit,
      name: product.name,
    };
  });
}

router.get('/packages', async (_req, res, next) => {
  try {
    const packages = await query<any[]>(
      `SELECT id, name, description, price, points, COALESCE(bonus_points, 0) AS bonus_points,
              duration, duration_unit, recommended, sort_order
       FROM recharge_packages
       WHERE is_active = 1
       ORDER BY sort_order ASC`
    );

    res.json({
      success: true,
      data: packages || [],
    });
  } catch (error) {
    next(error);
  }
});

router.get('/points-exchange', async (_req, res, next) => {
  try {
    const exchanges = await query<any[]>(
      `SELECT id, name, description, points_cost, duration, duration_unit, sort_order
       FROM points_exchange_products
       WHERE is_active = 1
       ORDER BY sort_order ASC`
    );

    res.json({
      success: true,
      data: exchanges || [],
    });
  } catch (error) {
    next(error);
  }
});

router.get('/trial-card/status', authMiddleware, async (_req, res) => {
  res.json({
    success: true,
    data: {
      totalUsed: 0,
      remainingUses: 0,
      usedToday: false,
      canUse: false,
      message: '免费体验入口已关闭，请先充值积分并兑换时长。',
    },
  });
});

router.post('/trial-card/use', authMiddleware, async (_req, _res, next) => {
  next(new AppError(403, '免费体验入口已关闭，请先充值积分并兑换时长。'));
});

router.post('/points-exchange/:productId', authMiddleware, async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = (req as any).user.id;
    const result = await exchangeDurationProduct(userId, productId);

    res.json({
      success: true,
      message: `成功兑换 ${result.name}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/exchange', authMiddleware, async (req, res, next) => {
  try {
    const { exchangeId } = req.body;
    const userId = (req as any).user.id;

    if (!exchangeId) {
      throw new AppError(400, '请选择要兑换的商品');
    }

    const result = await exchangeDurationProduct(userId, String(exchangeId));
    res.json({
      success: true,
      message: `成功兑换 ${result.name}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/create', authMiddleware, async (req, res, next) => {
  try {
    const { packageId, payMethod } = req.body;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const packages = await query<any[]>(
      'SELECT * FROM recharge_packages WHERE id = ? AND is_active = 1',
      [packageId]
    );
    if (!packages || packages.length === 0) {
      throw new AppError(404, '套餐不存在');
    }

    const pkg = packages[0] as any;
    const orderId = uuidv4();
    const orderNo = `ORD${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const isAdmin = userRole === 'admin' || userRole === 'rootadmin' || userRole === 'super_admin';

    await query(
      `INSERT INTO orders (
        id, order_no, user_id, package_id, package_name,
        points, amount, duration, duration_unit, pay_method, status, paid_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        orderId,
        orderNo,
        userId,
        pkg.id,
        pkg.name,
        pkg.points,
        pkg.price,
        0,
        null,
        payMethod || 'wechat',
        isAdmin ? 'paid' : 'pending',
        isAdmin ? new Date() : null,
      ]
    );

    if (isAdmin) {
      const totalPoints = Number(pkg.points || 0) + Number(pkg.bonus_points || 0);
      await query('UPDATE users SET points = COALESCE(points, 0) + ? WHERE id = ?', [totalPoints, userId]);
      await insertPointsRecord({
        userId,
        points: totalPoints,
        type: 'recharge',
        description: `后台直充积分：${pkg.name}`,
      });

      const referrerRows = await query<any[]>('SELECT referred_by FROM users WHERE id = ?', [userId]);
      const referrerId = (referrerRows[0] as any)?.referred_by;
      if (referrerId) {
        await applyRechargeCommission(referrerId, userId, Number(pkg.points || 0), orderId, undefined, {
          orderAmount: 0,
          productName: pkg.name,
        });
      }

      return res.json({
        success: true,
        message: '管理员已为用户充值积分',
        data: {
          orderId,
          orderNo,
          amount: 0,
          packageName: pkg.name,
          points: totalPoints,
          status: 'paid',
          isAdmin: true,
        },
      });
    }

    res.json({
      success: true,
      data: {
        orderId,
        orderNo,
        amount: pkg.price,
        packageName: pkg.name,
        points: Number(pkg.points || 0) + Number(pkg.bonus_points || 0),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/pay-callback', async (req, res, next) => {
  try {
    const { orderNo } = req.body;

    const orders = await query<any[]>(
      "SELECT * FROM orders WHERE order_no = ? AND status = 'pending' LIMIT 1",
      [orderNo]
    );
    if (!orders || orders.length === 0) {
      throw new AppError(404, '订单不存在或已处理');
    }

    const order = orders[0] as any;
    const bonusPoints = await getPackageBonusPoints(order.package_id);
    const totalPoints = Number(order.points || 0) + bonusPoints;

    await query(
      "UPDATE orders SET status = 'paid', paid_at = NOW() WHERE order_no = ?",
      [orderNo]
    );
    await query('UPDATE users SET points = COALESCE(points, 0) + ? WHERE id = ?', [
      totalPoints,
      order.user_id,
    ]);
    await insertPointsRecord({
      userId: String(order.user_id),
      points: totalPoints,
      type: 'recharge',
      description: `充值到账积分：${order.package_name}`,
    });

    const referrerRows = await query<any[]>(
      'SELECT referred_by FROM users WHERE id = ? LIMIT 1',
      [order.user_id]
    );
    const referrerId = (referrerRows[0] as any)?.referred_by;
    if (referrerId) {
      await applyRechargeCommission(referrerId, order.user_id, Number(order.points || 0), order.id);
    }

    res.json({ success: true, message: '支付成功，积分已到账' });
  } catch (error) {
    next(error);
  }
});

router.get('/list', authMiddleware, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const { status, page = 1, limit = 10 } = req.query;

    let sql = 'SELECT * FROM orders WHERE user_id = ?';
    const params: any[] = [userId];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string, 10), (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10));

    const orders = await query<any[]>(sql, params);
    let countSql = 'SELECT COUNT(*) AS total FROM orders WHERE user_id = ?';
    const countParams: any[] = [userId];

    if (status) {
      countSql += ' AND status = ?';
      countParams.push(status);
    }

    const countRows = await query<any[]>(countSql, countParams);

    res.json({
      success: true,
      data: {
        list: orders,
        pagination: {
          page: parseInt(page as string, 10),
          limit: parseInt(limit as string, 10),
          total: Number((countRows[0] as any)?.total || 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/detail/:orderNo', authMiddleware, async (req, res, next) => {
  try {
    const { orderNo } = req.params;
    const userId = (req as any).user.id;

    const orders = await query<any[]>(
      'SELECT * FROM orders WHERE order_no = ? AND user_id = ?',
      [orderNo, userId]
    );
    if (!orders || orders.length === 0) {
      throw new AppError(404, '订单不存在');
    }

    res.json({ success: true, data: orders[0] });
  } catch (error) {
    next(error);
  }
});

router.post('/cancel/:orderNo', authMiddleware, async (req, res, next) => {
  try {
    const { orderNo } = req.params;
    const userId = (req as any).user.id;

    const result = await query<any[]>(
      "UPDATE orders SET status = 'cancelled' WHERE order_no = ? AND user_id = ? AND status = 'pending'",
      [orderNo, userId]
    );

    if ((result as any).affectedRows === 0) {
      throw new AppError(400, '订单不存在或无法取消');
    }

    res.json({ success: true, message: '订单已取消' });
  } catch (error) {
    next(error);
  }
});

export default router;
