import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { PoolConnection } from '../config/database.js';
import { db } from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { paymentRateLimiter } from '../middleware/rateLimiter.js';
import { grantDurationToUser } from '../utils/durationAccess.js';
import {
  markExpiredExperienceCodes,
  maskExperienceCode,
  normalizeExperienceCode,
} from '../utils/experienceCodes.js';
import { insertPointsRecord } from '../utils/pointsRecord.js';
import { RowDataPacket } from 'mysql2/promise';

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

  return db.query<T>(sql, params);
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

  await db.execute(sql, params);
}

router.get('/products', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await db.query<RowDataPacket[]>(
      `SELECT id, name, description, price AS amount, points, COALESCE(bonus_points, 0) AS bonusPoints,
              duration, duration_unit, recommended
       FROM recharge_packages
       WHERE is_active = 1
       ORDER BY sort_order ASC, id ASC`
    );

    res.json({
      success: true,
      data: { products },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/create', paymentRateLimiter, authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const { productId, payMethod } = req.body;

    const products = await db.query<RowDataPacket[]>(
      `SELECT id, name, price, points, COALESCE(bonus_points, 0) AS bonus_points
       FROM recharge_packages
       WHERE id = ? AND is_active = 1
       LIMIT 1`,
      [productId]
    );

    if (products.length === 0) {
      throw ApiError.badRequest('充值套餐不存在');
    }

    if (!['wechat', 'alipay'].includes(payMethod)) {
      throw ApiError.badRequest('不支持的支付方式');
    }

    const product = products[0] as any;
    const orderId = uuidv4();
    const orderNo = `${payMethod === 'wechat' ? 'W' : 'A'}${Date.now()}${uuidv4().substring(0, 8).toUpperCase()}`;
    const expireTime = new Date(Date.now() + 30 * 60 * 1000);

    await db.execute(
      `INSERT INTO recharge_orders (
        id, order_no, user_id, amount, points, bonus_points, product_name, status, pay_method, expire_time, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, NOW())`,
      [
        orderId,
        orderNo,
        userId,
        product.price,
        product.points,
        product.bonus_points,
        product.name,
        payMethod,
        expireTime,
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        orderId,
        orderNo,
        amount: product.price,
        points: product.points,
        bonusPoints: product.bonus_points,
        productName: product.name,
        payMethod,
        status: 'pending',
        expireTime,
        qrCodeUrl: `/api/recharge/qr/${orderId}`,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/orders', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 20;
    const status = req.query.status as string | undefined;
    const offset = (page - 1) * pageSize;

    let sql = 'SELECT * FROM recharge_orders WHERE user_id = ?';
    const params: (string | number)[] = [userId];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const orders = await db.query<RowDataPacket[]>(sql, params);
    const countResult = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM recharge_orders
       WHERE user_id = ?${status ? ' AND status = ?' : ''}`,
      status ? [userId, status] : [userId]
    );

    res.json({
      success: true,
      data: {
        orders: orders.map((order) => ({
          orderId: (order as any).id,
          orderNo: (order as any).order_no,
          amount: (order as any).amount,
          points: (order as any).points,
          bonusPoints: (order as any).bonus_points,
          productName: (order as any).product_name,
          status: (order as any).status,
          payMethod: (order as any).pay_method,
          paidAt: (order as any).pay_time,
          createdAt: (order as any).created_at,
        })),
        pagination: {
          page,
          pageSize,
          total: Number(countResult[0]?.total || 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/order/:orderId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const { orderId } = req.params;

    const orders = await db.query<RowDataPacket[]>(
      'SELECT * FROM recharge_orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      throw ApiError.notFound('订单不存在');
    }

    const order = orders[0] as any;
    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNo: order.order_no,
        amount: order.amount,
        points: order.points,
        bonusPoints: order.bonus_points,
        productName: order.product_name,
        status: order.status,
        payMethod: order.pay_method,
        paidAt: order.pay_time,
        createdAt: order.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/experience-code/redeem', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const code = normalizeExperienceCode(req.body?.code);

    const result = await db.transaction(async (connection: PoolConnection) => {
      await markExpiredExperienceCodes(connection);

      const users = await selectRows<any[]>('SELECT id FROM users WHERE id = ? LIMIT 1', [userId], connection);
      if (users.length === 0) {
        throw ApiError.notFound('用户不存在');
      }

      const activatedRows = await selectRows<any[]>(
        `SELECT id, code, activated_at
         FROM experience_redeem_codes
         WHERE bound_user_id = ? AND status = 'activated'
         LIMIT 1`,
        [userId],
        connection
      );
      if (activatedRows.length > 0) {
        throw ApiError.badRequest('同一账号只能永久激活一次体验码');
      }

      const rows = await selectRows<any[]>(
        `SELECT
           id,
           code,
           plan_key,
           points,
           duration_days,
           validity_days,
           status,
           bound_user_id,
           expired_at,
           note
         FROM experience_redeem_codes
         WHERE code = ?
         LIMIT 1`,
        [code],
        connection
      );

      if (rows.length === 0) {
        throw ApiError.notFound('体验码不存在');
      }

      const current = rows[0] as any;
      if (String(current.status || '') === 'revoked') {
        throw ApiError.badRequest('该体验码已作废');
      }
      if (String(current.status || '') === 'activated' || current.bound_user_id) {
        throw ApiError.badRequest('该体验码已被使用');
      }

      const expiredAt = current.expired_at ? new Date(current.expired_at) : null;
      if (expiredAt && !Number.isNaN(expiredAt.getTime()) && expiredAt.getTime() <= Date.now()) {
        await runExecute(
          `UPDATE experience_redeem_codes
           SET status = 'expired',
               updated_at = NOW()
           WHERE id = ?`,
          [current.id],
          connection
        );
        throw ApiError.badRequest('该体验码已过期');
      }

      const points = Math.max(0, Number(current.points || 0));
      const durationDays = Math.max(0, Number(current.duration_days || 0));
      const activatedAt = new Date();

      if (points > 0) {
        await runExecute(
          'UPDATE users SET points = COALESCE(points, 0) + ? WHERE id = ?',
          [points, userId],
          connection
        );
      }

      const recordId = await insertPointsRecord({
        userId,
        points,
        type: 'experience_code',
        description: `体验码激活：${maskExperienceCode(code)}`,
        connection,
      });

      if (durationDays > 0) {
        await grantDurationToUser(userId, durationDays, 'day', connection);
      }

      await runExecute(
        `UPDATE experience_redeem_codes
         SET status = 'activated',
             bound_user_id = ?,
             activated_at = ?,
             redeemed_at = ?,
             redeemed_record_id = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [userId, activatedAt, activatedAt, recordId, current.id],
        connection
      );

      return {
        id: Number(current.id),
        code: maskExperienceCode(code),
        plan_key: String(current.plan_key || ''),
        points,
        duration_days: durationDays,
        validity_days: Math.max(1, Number(current.validity_days || 7)),
        activated_at: activatedAt,
      };
    });

    res.json({
      success: true,
      message:
        result.duration_days > 0
          ? `体验码激活成功，已到账 ${result.points} 积分，并补充 ${result.duration_days} 天体验时长。`
          : `体验码激活成功，已到账 ${result.points} 积分。`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/qr/:orderId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;

    const orders = await db.query<RowDataPacket[]>(
      'SELECT * FROM recharge_orders WHERE id = ?',
      [orderId]
    );

    if (orders.length === 0) {
      throw ApiError.notFound('订单不存在');
    }

    const order = orders[0] as any;

    if (order.status !== 'pending') {
      res.json({
        success: true,
        data: {
          orderId: order.id,
          status: order.status,
          message: order.status === 'paid' ? '订单已支付' : '订单已过期',
        },
      });
      return;
    }

    if (new Date(order.expire_time) < new Date()) {
      await db.execute('UPDATE recharge_orders SET status = ? WHERE id = ?', ['expired', orderId]);
      res.json({
        success: true,
        data: {
          orderId: order.id,
          status: 'expired',
          message: '订单已过期',
        },
      });
      return;
    }

    const qrCodeUrl =
      order.pay_method === 'wechat'
        ? `/api/payment/wechat/qr/${orderId}`
        : `/api/payment/alipay/qr/${orderId}`;

    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNo: order.order_no,
        amount: order.amount,
        productName: order.product_name,
        status: order.status,
        payMethod: order.pay_method,
        qrCodeUrl,
        expireTime: order.expire_time,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
