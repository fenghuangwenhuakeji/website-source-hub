import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { RowDataPacket } from 'mysql2/promise';

const router = Router();

interface VIPProduct {
  id: number;
  name: string;
  duration: number;
  price: number;
  description: string;
  discount: number;
}

const VIP_PRODUCTS: VIPProduct[] = [
  { id: 1, name: '月度VIP', duration: 30, price: 30, description: '开通月度VIP，享受30天特权', discount: 0 },
  { id: 2, name: '季度VIP', duration: 90, price: 80, description: '开通季度VIP，享受90天特权', discount: 11 },
  { id: 3, name: '年度VIP', duration: 365, price: 288, description: '开通年度VIP，享受365天特权', discount: 20 },
];

router.get('/products', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: { products: VIP_PRODUCTS },
  });
});

router.get('/status', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;

    const users = await db.query<RowDataPacket[]>(
      'SELECT vip_expire_time, vip_level FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw ApiError.notFound('用户不存在');
    }

    const user = users[0] as any;
    const now = new Date();
    const isVip = user.vip_expire_time && new Date(user.vip_expire_time) > now;

    res.json({
      success: true,
      data: {
        isVip,
        vipLevel: user.vip_level || 0,
        vipExpireTime: user.vip_expire_time,
        daysLeft: isVip
          ? Math.ceil((new Date(user.vip_expire_time).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/subscribe', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const { productId, payMethod } = req.body;

    const product = VIP_PRODUCTS.find(p => p.id === productId);
    if (!product) {
      throw ApiError.badRequest('不存在的VIP套餐');
    }

    const orderId = uuidv4();
    const orderNo = `VIP-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    await db.execute(
      `INSERT INTO vip_orders (id, order_no, user_id, product_id, product_name, duration, amount, status, pay_method, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW())`,
      [orderId, orderNo, userId, product.id, product.name, product.duration, product.price, payMethod]
    );

    res.status(201).json({
      success: true,
      data: {
        orderId,
        orderNo,
        amount: product.price,
        productName: product.name,
        payMethod,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/activate', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const { orderId } = req.body;

    const orders = await db.query<RowDataPacket[]>(
      'SELECT * FROM vip_orders WHERE id = ? AND user_id = ? AND status = ?',
      [orderId, userId, 'paid']
    );

    if (orders.length === 0) {
      throw ApiError.notFound('订单不存在或未支付');
    }

    const order = orders[0] as any;

    const users = await db.query<RowDataPacket[]>(
      'SELECT vip_expire_time FROM users WHERE id = ?',
      [userId]
    );

    const user = users[0] as any;
    const now = new Date();
    let newExpireTime: Date;

    if (user.vip_expire_time && new Date(user.vip_expire_time) > now) {
      newExpireTime = new Date(new Date(user.vip_expire_time).getTime() + order.duration * 24 * 60 * 60 * 1000);
    } else {
      newExpireTime = new Date(now.getTime() + order.duration * 24 * 60 * 60 * 1000);
    }

    await db.execute(
      'UPDATE users SET vip_expire_time = ?, vip_level = 1 WHERE id = ?',
      [newExpireTime.toISOString(), userId]
    );

    await db.execute(
      'UPDATE vip_orders SET status = ? WHERE id = ?',
      ['activated', orderId]
    );

    res.json({
      success: true,
      data: {
        vipExpireTime: newExpireTime,
        message: 'VIP激活成功',
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/privileges', (_req: Request, res: Response) => {
  const privileges = [
    { id: 1, name: 'AI创作加成', description: 'AI生成速度提升50%', level: 1 },
    { id: 2, name: '专属素材库', description: '解锁高级素材和模板', level: 1 },
    { id: 3, name: '优先客服', description: '享受7x24小时优先客服', level: 1 },
    { id: 4, name: '专属皮肤', description: '解锁VIP专属主题皮肤', level: 2 },
    { id: 5, name: '高级分析', description: '查看作品数据分析报告', level: 2 },
    { id: 6, name: '线下活动', description: '受邀参加线下创作活动', level: 3 },
  ];

  res.json({
    success: true,
    data: { privileges },
  });
});

export default router;
