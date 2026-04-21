import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import type { PoolConnection } from '../config/database.js';
import { query, transaction } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { getDurationAccessStatus } from '../utils/durationAccess.js';
import {
  EXPERIENCE_CODE_PRESETS,
  buildExperienceCodeBatchNo,
  buildExperienceCodeExpiry,
  generateUniqueExperienceCode,
  getExperienceCodePreset,
  markExpiredExperienceCodes,
  normalizeExperienceCodeRewardType,
} from '../utils/experienceCodes.js';
import { insertPointsRecord } from '../utils/pointsRecord.js';
import {
  applyRechargeCommission,
  diamondsToAmount,
  getReferralSettings,
  reviewWithdrawalRequest,
  saveReferralSettings,
} from '../utils/referralProgram.js';

const router = Router();
const adminRoles = new Set(['admin', 'rootadmin', 'super_admin']);
const elevatedAdminRoles = new Set(['rootadmin', 'super_admin']);
const settledOrderStatuses = new Set(['paid', 'activated']);

type OrderSourceTable = 'orders' | 'recharge_orders';

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

function parseDateInput(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeOrderStatus(value: unknown): string {
  const normalized = String(value || 'pending').trim().toLowerCase();
  if (['pending', 'paid', 'activated', 'expired', 'cancelled'].includes(normalized)) {
    return normalized;
  }

  return 'pending';
}

function normalizeExchangePoints(value: unknown): number {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric === 0) {
    throw new AppError(400, 'Exchange points value is required.');
  }

  return numeric > 0 ? -numeric : numeric;
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = String(value ?? '').trim();
  return normalized ? normalized : null;
}

function normalizeQueryPage(value: unknown, fallback: number = 1): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 1) {
    return fallback;
  }

  return Math.floor(numeric);
}

function normalizeQueryPageSize(
  value: unknown,
  fallback: number = 20,
  max: number = 200
): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 1) {
    return fallback;
  }

  return Math.min(Math.floor(numeric), max);
}

function normalizeBatchQuantity(value: unknown): number {
  const numeric = Number(value ?? 1);
  if (!Number.isFinite(numeric) || numeric < 1) {
    throw new AppError(400, '生成数量必须大于 0。');
  }

  return Math.min(Math.floor(numeric), 500);
}

async function resolveOrderRecord(
  id: string,
  connection?: PoolConnection
): Promise<
  | (Record<string, any> & {
      source_table: OrderSourceTable;
      product_name: string;
      bonus_points: number;
      paid_at: Date | null;
    })
  | null
> {
  const rechargeRows = await selectRows<any[]>(
    `SELECT
       id,
       order_no,
       user_id,
       amount,
       points,
       COALESCE(bonus_points, 0) AS bonus_points,
       product_name,
       status,
       pay_method,
       pay_time AS paid_at,
       provider_transaction_id,
       provider_status,
       payment_scene,
       created_at
     FROM recharge_orders
     WHERE id = ?
     LIMIT 1`,
    [id],
    connection
  );

  if (rechargeRows.length > 0) {
    return {
      ...(rechargeRows[0] as any),
      source_table: 'recharge_orders',
      bonus_points: Number((rechargeRows[0] as any).bonus_points || 0),
      product_name: String((rechargeRows[0] as any).product_name || ''),
      paid_at: parseDateInput((rechargeRows[0] as any).paid_at),
    };
  }

  const legacyRows = await selectRows<any[]>(
    `SELECT
       o.id,
       o.order_no,
       o.user_id,
       o.package_id,
       o.package_name AS product_name,
       o.amount,
       o.points,
       COALESCE(rp.bonus_points, 0) AS bonus_points,
       o.status,
       o.pay_method,
       o.paid_at,
       o.provider_transaction_id,
       o.provider_status,
       o.payment_scene,
       o.created_at
     FROM orders o
     LEFT JOIN recharge_packages rp ON rp.id = o.package_id
     WHERE o.id = ?
     LIMIT 1`,
    [id],
    connection
  );

  if (legacyRows.length === 0) {
    return null;
  }

  return {
    ...(legacyRows[0] as any),
    source_table: 'orders',
    bonus_points: Number((legacyRows[0] as any).bonus_points || 0),
    product_name: String((legacyRows[0] as any).product_name || ''),
    paid_at: parseDateInput((legacyRows[0] as any).paid_at),
  };
}

const resolveManagedRole = (
  explicitRole: string | undefined,
  isAdmin: boolean | undefined,
  currentRole: string = 'user',
): string => {
  if (explicitRole && explicitRole.trim()) {
    return explicitRole.trim();
  }

  if (elevatedAdminRoles.has(currentRole)) {
    return currentRole;
  }

  return isAdmin ? 'admin' : 'user';
};

const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const userRole = (req as any).user?.role;

  if (!adminRoles.has(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Admin permission required.',
    });
  }

  next();
};

router.get('/check-recharge', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user?.role;

    if (adminRoles.has(userRole)) {
      return res.json({
        success: true,
        data: {
          needsRecharge: false,
          totalRecharge: 999999,
          isAdmin: true,
        },
      });
    }

    const users = await query<any[]>('SELECT total_recharge FROM users WHERE id = ?', [userId]);

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const user = users[0];
    const totalRecharge = parseFloat(user.total_recharge) || 0;
    const durationAccess = await getDurationAccessStatus(userId);

    return res.json({
      success: true,
      data: {
        needsRecharge: !durationAccess.canEnter,
        totalRecharge,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/users', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 20;
    const keyword = ((req.query.keyword as string) || '').trim();
    const offset = (page - 1) * pageSize;

    const whereSql = keyword
      ? `WHERE (
           u.username LIKE ?
           OR COALESCE(u.nickname, '') LIKE ?
           OR COALESCE(u.email, '') LIKE ?
           OR COALESCE(u.phone, '') LIKE ?
         )`
      : '';
    const keywordParams = keyword ? Array(4).fill(`%${keyword}%`) : [];

    const users = await query<any[]>(
      `SELECT
         u.id,
         u.username,
         u.email,
         u.phone,
         u.phone_verified_at,
         u.nickname,
         u.role,
         CASE WHEN u.role IN ('admin', 'rootadmin', 'super_admin') THEN 1 ELSE 0 END AS is_admin,
         COALESCE(u.points, 0) AS points,
         COALESCE(u.total_recharge, 0) AS total_recharge,
         u.status,
         u.wechat_openid,
         u.wechat_bound_at,
         COALESCE(u.must_bind_contact, 1) AS must_bind_contact,
         u.password_updated_at,
         u.password_reset_requested_at,
         u.last_password_reset_at,
         u.referral_code,
         u.referred_by,
         ref.username AS referrer_username,
         u.vip_level,
         u.vip_expire_time,
         u.last_login,
         u.created_at,
         COALESCE((
           SELECT COUNT(*)
           FROM recharge_orders ro
           WHERE ro.user_id = u.id
         ), 0) AS recharge_order_count,
         COALESCE((
           SELECT COUNT(*)
           FROM orders o
           WHERE o.user_id = u.id
         ), 0) AS duration_order_count,
         COALESCE((
           SELECT COUNT(*)
           FROM recharge_orders ro
           WHERE ro.user_id = u.id AND ro.status = 'paid'
         ), 0) AS paid_recharge_count,
         COALESCE((
           SELECT SUM(ro.amount)
           FROM recharge_orders ro
           WHERE ro.user_id = u.id AND ro.status = 'paid'
         ), 0) AS paid_recharge_amount
       FROM users u
       LEFT JOIN users ref ON ref.id = u.referred_by
       ${whereSql}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...keywordParams, pageSize, offset],
    );

    const countResult = await query<any[]>(
      `SELECT COUNT(*) AS total
       FROM users u
       ${whereSql}`,
      keywordParams,
    );
    const total = countResult[0]?.total || 0;

    res.json({
      success: true,
      data: {
        list: users,
        pagination: {
          page,
          pageSize,
          total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/users', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password, email, phone, nickname, role, is_admin, points, status, wechat_openid } =
      req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      });
    }

    const targetRole = resolveManagedRole(role, Boolean(is_admin));
    if (targetRole === 'rootadmin') {
      return res.status(400).json({
        success: false,
        message: 'Use the built-in rootadmin account instead of creating another one.',
      });
    }

    const existingUsers = await query<any[]>(
      `SELECT id
       FROM users
       WHERE username = ?
          OR (? IS NOT NULL AND email = ?)
          OR (? IS NOT NULL AND phone = ?)`,
      [username, email || null, email || null, phone || null, phone || null],
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, or phone already exists.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const referralCode = `CW${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const hasPhone = Boolean(phone);
    const hasWechat = Boolean(wechat_openid);

    await query(
      `INSERT INTO users (
         id, username, password_hash, password_updated_at, email, phone, phone_verified_at,
         nickname, role, points, status, referral_code, wechat_openid, wechat_bound_at, must_bind_contact
       ) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        username,
        hashedPassword,
        email || null,
        phone || null,
        hasPhone ? new Date() : null,
        nickname || username,
        targetRole,
        points || 0,
        status || 'active',
        referralCode,
        wechat_openid || null,
        hasWechat ? new Date() : null,
        hasPhone || hasWechat || adminRoles.has(targetRole) ? 0 : 1,
      ],
    );

    res.json({
      success: true,
      message: 'User created successfully.',
      data: { id: userId },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/users/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      role,
      is_admin,
      points,
      status,
      password,
      nickname,
      email,
      phone,
      wechat_openid,
      total_recharge,
      vip_level,
      vip_expire_time,
      must_bind_contact,
    } = req.body;

    const targets = await query<any[]>('SELECT id, username, role FROM users WHERE id = ? LIMIT 1', [id]);
    const target = targets[0];

    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const nextRole = resolveManagedRole(role, is_admin === undefined ? undefined : Boolean(is_admin), target.role);

    if (target.username === 'rootadmin') {
      if (nextRole !== 'rootadmin') {
        return res.status(400).json({
          success: false,
          message: 'The built-in rootadmin role cannot be changed.',
        });
      }

      if (status && status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'The built-in rootadmin account must remain active.',
        });
      }
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (nextRole && nextRole !== target.role) {
      updates.push('role = ?');
      values.push(nextRole);
    }
    if (points !== undefined) {
      updates.push('points = ?');
      values.push(points);
    }
    if (status) {
      updates.push('status = ?');
      values.push(status);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      values.push(hashedPassword);
      updates.push('password_updated_at = NOW()');
    }
    if (nickname !== undefined) {
      updates.push('nickname = ?');
      values.push(nickname);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
      updates.push('phone_verified_at = ?');
      values.push(phone ? new Date() : null);
    }
    if (wechat_openid !== undefined) {
      updates.push('wechat_openid = ?');
      values.push(wechat_openid);
      updates.push('wechat_bound_at = ?');
      values.push(wechat_openid ? new Date() : null);
    }
    if (total_recharge !== undefined) {
      updates.push('total_recharge = ?');
      values.push(total_recharge);
    }
    if (vip_level !== undefined) {
      updates.push('vip_level = ?');
      values.push(vip_level);
    }
    if (vip_expire_time !== undefined) {
      updates.push('vip_expire_time = ?');
      values.push(vip_expire_time);
    }
    if (must_bind_contact !== undefined) {
      updates.push('must_bind_contact = ?');
      values.push(must_bind_contact ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update.',
      });
    }

    values.push(id);
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    res.json({
      success: true,
      message: 'User updated successfully.',
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/users/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const targets = await query<any[]>('SELECT username FROM users WHERE id = ?', [id]);
    if (targets[0]?.username === 'rootadmin') {
      return res.status(400).json({
        success: false,
        message: 'The built-in rootadmin test account cannot be deleted.',
      });
    }

    await query('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'User deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/keys', authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  return res.status(410).json({
    success: false,
    message: 'License key management has been removed.',
  });
});

router.post('/keys', authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  return res.status(410).json({
    success: false,
    message: 'License key management has been removed.',
  });
});

router.put('/keys/:id', authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  return res.status(410).json({
    success: false,
    message: 'License key management has been removed.',
  });
});

router.delete('/keys/:id', authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  return res.status(410).json({
    success: false,
    message: 'License key management has been removed.',
  });
});

router.get('/orders', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 20;
    const status = ((req.query.status as string) || '').trim();
    const orderKind = ((req.query.orderKind as string) || '').trim();
    const keyword = ((req.query.keyword as string) || '').trim();
    const offset = (page - 1) * pageSize;

    const combinedOrdersSql = `
      SELECT
        ro.id,
        'recharge_orders' AS source_table,
        ro.order_no,
        ro.user_id,
        u.username,
        u.nickname,
        u.phone,
        u.email,
        'recharge' AS order_kind,
        ro.product_name,
        ro.amount,
        ro.points,
        COALESCE(ro.bonus_points, 0) AS bonus_points,
        NULL AS duration,
        NULL AS duration_unit,
        ro.pay_method,
        ro.status,
        ro.pay_time AS paid_at,
        ro.provider_transaction_id,
        ro.provider_buyer_id,
        ro.provider_status,
        ro.payment_scene,
        ro.expire_time,
        ro.created_at
      FROM recharge_orders ro
      LEFT JOIN users u ON ro.user_id = u.id

      UNION ALL

      SELECT
        o.id,
        'orders' AS source_table,
        o.order_no,
        o.user_id,
        u.username,
        u.nickname,
        u.phone,
        u.email,
        CASE WHEN COALESCE(o.amount, 0) > 0 THEN 'recharge' ELSE 'duration' END AS order_kind,
        COALESCE(o.package_name, rp.name, 'Legacy Order') AS product_name,
        o.amount,
        o.points,
        COALESCE(rp.bonus_points, 0) AS bonus_points,
        o.duration,
        o.duration_unit,
        o.pay_method,
        o.status,
        o.paid_at,
        o.provider_transaction_id,
        o.provider_buyer_id,
        o.provider_status,
        o.payment_scene,
        NULL AS expire_time,
        o.created_at
      FROM orders o
      LEFT JOIN recharge_packages rp ON rp.id = o.package_id
      LEFT JOIN users u ON o.user_id = u.id
    `;

    const filters: string[] = [];
    const filterParams: any[] = [];

    if (status && status !== 'all') {
      filters.push('status = ?');
      filterParams.push(status);
    }

    if (orderKind && orderKind !== 'all') {
      filters.push('order_kind = ?');
      filterParams.push(orderKind);
    }

    if (keyword) {
      filters.push(`(
        order_no LIKE ?
        OR COALESCE(username, '') LIKE ?
        OR COALESCE(nickname, '') LIKE ?
        OR COALESCE(phone, '') LIKE ?
        OR COALESCE(product_name, '') LIKE ?
      )`);
      filterParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    const whereSql = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const orders = await query<any[]>(
      `SELECT *
       FROM (${combinedOrdersSql}) combined
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...filterParams, pageSize, offset],
    );

    const countResult = await query<any[]>(
      `SELECT COUNT(*) AS total
       FROM (${combinedOrdersSql}) combined
       ${whereSql}`,
      filterParams,
    );
    const total = countResult[0]?.total || 0;

    res.json({
      success: true,
      data: {
        list: orders,
        pagination: {
          page,
          pageSize,
          total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/orders', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sourceTable: OrderSourceTable =
      req.body?.source_table === 'recharge_orders' ? 'recharge_orders' : 'orders';
    const userId = normalizeOptionalText(req.body?.user_id);
    const productName = normalizeOptionalText(req.body?.product_name || req.body?.package_name);

    if (!userId) {
      throw new AppError(400, 'User ID is required.');
    }

    if (!productName) {
      throw new AppError(400, 'Product name is required.');
    }

    const orderId = uuidv4();
    const orderNo = normalizeOptionalText(req.body?.order_no) || `ADM${Date.now()}`;
    const amount = Number(req.body?.amount || 0);
    const points = Number(req.body?.points || 0);
    const bonusPoints = Number(req.body?.bonus_points || 0);
    const status = normalizeOrderStatus(req.body?.status);
    const payMethod = normalizeOptionalText(req.body?.pay_method) || 'admin';
    const providerTransactionId = normalizeOptionalText(req.body?.provider_transaction_id);
    const providerStatus = normalizeOptionalText(req.body?.provider_status);
    const paymentScene = normalizeOptionalText(req.body?.payment_scene);
    const createdAt = parseDateInput(req.body?.created_at) || new Date();
    const paidAt = settledOrderStatuses.has(status)
      ? parseDateInput(req.body?.paid_at) || new Date()
      : null;

    if (sourceTable === 'recharge_orders') {
      const expireTime = parseDateInput(req.body?.expire_time) || new Date(Date.now() + 2 * 60 * 60 * 1000);

      await query(
        `INSERT INTO recharge_orders (
          id, order_no, user_id, amount, points, bonus_points, product_name,
          status, pay_method, pay_time, provider_transaction_id, provider_status,
          payment_scene, expire_time, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          orderId,
          orderNo,
          userId,
          amount,
          points,
          bonusPoints,
          productName,
          status,
          payMethod,
          paidAt,
          providerTransactionId,
          providerStatus,
          paymentScene,
          expireTime,
          createdAt,
        ]
      );
    } else {
      await query(
        `INSERT INTO orders (
          id, order_no, user_id, package_id, package_name, points, amount,
          duration, duration_unit, pay_method, status, paid_at,
          provider_transaction_id, provider_status, payment_scene, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          orderId,
          orderNo,
          userId,
          req.body?.package_id || null,
          productName,
          points,
          amount,
          0,
          null,
          payMethod,
          status,
          paidAt,
          providerTransactionId,
          providerStatus,
          paymentScene,
          createdAt,
        ]
      );
    }

    res.json({
      success: true,
      message: 'Order record created successfully.',
      data: {
        id: orderId,
        order_no: orderNo,
        source_table: sourceTable,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/orders/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existing = await resolveOrderRecord(id);

    if (!existing) {
      throw new AppError(404, 'Order not found.');
    }

    const status = normalizeOrderStatus(req.body?.status ?? existing.status);
    const paidAt = settledOrderStatuses.has(status)
      ? parseDateInput(req.body?.paid_at) || existing.paid_at || new Date()
      : null;
    const productName =
      normalizeOptionalText(req.body?.product_name || req.body?.package_name) || existing.product_name;
    const payMethod = normalizeOptionalText(req.body?.pay_method) || existing.pay_method || 'admin';
    const providerTransactionId =
      normalizeOptionalText(req.body?.provider_transaction_id) || existing.provider_transaction_id || null;
    const providerStatus =
      normalizeOptionalText(req.body?.provider_status) || existing.provider_status || null;
    const paymentScene =
      normalizeOptionalText(req.body?.payment_scene) || existing.payment_scene || null;
    const createdAt = parseDateInput(req.body?.created_at) || parseDateInput(existing.created_at) || new Date();

    if (existing.source_table === 'recharge_orders') {
      await query(
        `UPDATE recharge_orders
         SET order_no = ?,
             user_id = ?,
             amount = ?,
             points = ?,
             bonus_points = ?,
             product_name = ?,
             status = ?,
             pay_method = ?,
             pay_time = ?,
             provider_transaction_id = ?,
             provider_status = ?,
             payment_scene = ?,
             created_at = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [
          normalizeOptionalText(req.body?.order_no) || existing.order_no,
          normalizeOptionalText(req.body?.user_id) || existing.user_id,
          Number(req.body?.amount ?? existing.amount ?? 0),
          Number(req.body?.points ?? existing.points ?? 0),
          Number(req.body?.bonus_points ?? existing.bonus_points ?? 0),
          productName,
          status,
          payMethod,
          paidAt,
          providerTransactionId,
          providerStatus,
          paymentScene,
          createdAt,
          id,
        ]
      );
    } else {
      await query(
        `UPDATE orders
         SET order_no = ?,
             user_id = ?,
             package_id = ?,
             package_name = ?,
             points = ?,
             amount = ?,
             pay_method = ?,
             status = ?,
             paid_at = ?,
             provider_transaction_id = ?,
             provider_status = ?,
             payment_scene = ?,
             created_at = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [
          normalizeOptionalText(req.body?.order_no) || existing.order_no,
          normalizeOptionalText(req.body?.user_id) || existing.user_id,
          req.body?.package_id ?? existing.package_id ?? null,
          productName,
          Number(req.body?.points ?? existing.points ?? 0),
          Number(req.body?.amount ?? existing.amount ?? 0),
          payMethod,
          status,
          paidAt,
          providerTransactionId,
          providerStatus,
          paymentScene,
          createdAt,
          id,
        ]
      );
    }

    res.json({
      success: true,
      message: 'Order updated successfully.',
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/orders/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existing = await resolveOrderRecord(id);

    if (!existing) {
      throw new AppError(404, 'Order not found.');
    }

    if (settledOrderStatuses.has(String(existing.status || '').toLowerCase())) {
      throw new AppError(400, 'Paid orders cannot be deleted directly. Please adjust the record instead.');
    }

    await query(`DELETE FROM ${existing.source_table} WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: 'Order deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/orders/:id/settle', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await transaction(async (connection) => {
      const order = await resolveOrderRecord(id, connection);

      if (!order) {
        throw new AppError(404, 'Order not found.');
      }

      if (settledOrderStatuses.has(String(order.status || '').toLowerCase())) {
        throw new AppError(400, 'Order has already been settled.');
      }

      const totalPoints = Number(order.points || 0) + Number(order.bonus_points || 0);
      const paidAt = parseDateInput(req.body?.paid_at) || new Date();
      const payMethod = normalizeOptionalText(req.body?.pay_method) || normalizeOptionalText(order.pay_method) || 'alipay';
      const providerTransactionId =
        normalizeOptionalText(req.body?.provider_transaction_id) || normalizeOptionalText(order.provider_transaction_id);
      const providerStatus = normalizeOptionalText(req.body?.provider_status) || 'MANUAL_CONFIRMED';
      const paymentScene = normalizeOptionalText(req.body?.payment_scene) || 'ADMIN_MANUAL';

      if (order.source_table === 'recharge_orders') {
        await runExecute(
          `UPDATE recharge_orders
           SET status = 'paid',
               pay_method = ?,
               pay_time = ?,
               provider_transaction_id = ?,
               provider_status = ?,
               payment_scene = ?,
               updated_at = NOW()
           WHERE id = ?`,
          [payMethod, paidAt, providerTransactionId, providerStatus, paymentScene, id],
          connection
        );
      } else {
        await runExecute(
          `UPDATE orders
           SET status = 'paid',
               pay_method = ?,
               paid_at = ?,
               provider_transaction_id = ?,
               provider_status = ?,
               payment_scene = ?,
               updated_at = NOW()
           WHERE id = ?`,
          [payMethod, paidAt, providerTransactionId, providerStatus, paymentScene, id],
          connection
        );
      }

      await runExecute(
        `UPDATE users
         SET points = COALESCE(points, 0) + ?, total_recharge = COALESCE(total_recharge, 0) + ?
         WHERE id = ?`,
        [totalPoints, Number(order.amount || 0), order.user_id],
        connection
      );

      await insertPointsRecord({
        userId: String(order.user_id),
        points: totalPoints,
        type: 'recharge',
        description: `后台手动补单：${order.product_name || order.order_no}`,
        connection,
      });

      const referrerRows = await selectRows<any[]>(
        'SELECT referred_by FROM users WHERE id = ? LIMIT 1',
        [order.user_id],
        connection
      );
      const referrerId = (referrerRows[0] as any)?.referred_by;
      if (referrerId) {
        await applyRechargeCommission(
          String(referrerId),
          String(order.user_id),
          Number(order.points || 0),
          String(order.id),
          connection
        );
      }

      return {
        id: order.id,
        order_no: order.order_no,
        source_table: order.source_table,
        points: totalPoints,
        status: 'paid',
      };
    });

    res.json({
      success: true,
      message: 'Order settled and points credited successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats/overview', authMiddleware, adminMiddleware, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const userCount = await query<any[]>("SELECT COUNT(*) AS count FROM users WHERE username != 'rootadmin'");
    const orderCount = await query<any[]>(`
      SELECT (
        COALESCE((SELECT COUNT(*) FROM recharge_orders), 0) +
        COALESCE((SELECT COUNT(*) FROM orders), 0)
      ) AS count
    `);
    const pointsSum = await query<any[]>(
      "SELECT COALESCE(SUM(points), 0) AS total FROM users WHERE username != 'rootadmin'",
    );
    const revenueSum = await query<any[]>(`
      SELECT (
        COALESCE((SELECT SUM(amount) FROM recharge_orders WHERE status = 'paid'), 0) +
        COALESCE((SELECT SUM(amount) FROM orders WHERE status IN ('paid', 'activated')), 0)
      ) AS total
    `);
    const packageCount = await query<any[]>(
      'SELECT COUNT(*) AS count FROM recharge_packages WHERE is_active = 1',
    );
    const activeMembers = await query<any[]>(
      'SELECT COUNT(*) AS count FROM user_durations WHERE is_active = 1',
    );

    const today = new Date().toISOString().split('T')[0];
    const todayUsers = await query<any[]>(
      "SELECT COUNT(*) AS count FROM users WHERE username != 'rootadmin' AND DATE(created_at) = ?",
      [today],
    );
    const todayOrders = await query<any[]>(
      `SELECT (
         COALESCE((SELECT COUNT(*) FROM recharge_orders WHERE DATE(created_at) = ?), 0) +
         COALESCE((SELECT COUNT(*) FROM orders WHERE DATE(created_at) = ?), 0)
       ) AS count`,
      [today, today],
    );

    res.json({
      success: true,
      data: {
        totalUsers: userCount[0]?.count || 0,
        totalOrders: orderCount[0]?.count || 0,
        totalPoints: pointsSum[0]?.total || 0,
        totalRevenue: revenueSum[0]?.total || 0,
        activePackages: packageCount[0]?.count || 0,
        activeMembers: activeMembers[0]?.count || 0,
        todayUsers: todayUsers[0]?.count || 0,
        todayOrders: todayOrders[0]?.count || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/packages', authMiddleware, adminMiddleware, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const packages = await query<any[]>(
      'SELECT * FROM recharge_packages ORDER BY sort_order ASC, created_at DESC',
    );
    res.json({ success: true, data: packages });
  } catch (error) {
    next(error);
  }
});

router.post('/packages', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      description,
      price,
      points,
      bonus_points,
      duration,
      duration_unit,
      icon,
      recommended,
      is_active,
      sort_order,
    } = req.body;

    const result: any = await query(
      `INSERT INTO recharge_packages
       (name, description, price, points, bonus_points, duration, duration_unit, icon, recommended, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        price,
        points,
        bonus_points || 0,
        duration || 0,
        duration_unit || 'day',
        icon,
        recommended || false,
        is_active !== false,
        sort_order || 0,
      ],
    );

    res.json({
      success: true,
      message: 'Package created successfully.',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/packages/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      points,
      bonus_points,
      duration,
      duration_unit,
      icon,
      recommended,
      is_active,
      sort_order,
    } = req.body;

    await query(
      `UPDATE recharge_packages
       SET name = ?, description = ?, price = ?, points = ?, bonus_points = ?, duration = ?, duration_unit = ?, icon = ?, recommended = ?, is_active = ?, sort_order = ?
       WHERE id = ?`,
      [name, description, price, points, bonus_points, duration, duration_unit, icon, recommended, is_active, sort_order, id],
    );

    res.json({
      success: true,
      message: 'Package updated successfully.',
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/packages/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM recharge_packages WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Package deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/exchange-products', authMiddleware, adminMiddleware, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await query<any[]>(
      'SELECT * FROM points_exchange_products ORDER BY sort_order ASC, created_at DESC',
    );
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

router.post('/exchange-products', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      description,
      points_cost,
      points_reward,
      duration,
      duration_unit,
      icon,
      is_active,
      sort_order,
    } = req.body;

    const result: any = await query(
      `INSERT INTO points_exchange_products
       (name, description, points_cost, points_reward, duration, duration_unit, icon, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        points_cost,
        points_reward || 0,
        duration || 0,
        duration_unit || 'day',
        icon,
        is_active !== false,
        sort_order || 0,
      ],
    );

    res.json({
      success: true,
      message: 'Exchange product created successfully.',
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/exchange-products/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      points_cost,
      points_reward,
      duration,
      duration_unit,
      icon,
      is_active,
      sort_order,
    } = req.body;

    await query(
      `UPDATE points_exchange_products
       SET name = ?, description = ?, points_cost = ?, points_reward = ?, duration = ?, duration_unit = ?, icon = ?, is_active = ?, sort_order = ?
       WHERE id = ?`,
      [name, description, points_cost, points_reward, duration, duration_unit, icon, is_active, sort_order, id],
    );

    res.json({
      success: true,
      message: 'Exchange product updated successfully.',
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/exchange-products/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM points_exchange_products WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Exchange product deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/exchange-records', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 20;
    const keyword = normalizeOptionalText(req.query.keyword);
    const offset = (page - 1) * pageSize;
    const filters = [`pr.type = 'exchange'`];
    const params: any[] = [];

    if (keyword) {
      filters.push(
        `(pr.user_id LIKE ? OR COALESCE(u.username, '') LIKE ? OR COALESCE(u.nickname, '') LIKE ? OR COALESCE(u.phone, '') LIKE ? OR COALESCE(pr.description, '') LIKE ?)`
      );
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    const whereSql = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const list = await query<any[]>(
      `SELECT
         pr.id,
         pr.user_id,
         u.username,
         u.nickname,
         u.phone,
         pr.points,
         pr.type,
         pr.description,
         pr.created_at
       FROM points_records pr
       LEFT JOIN users u ON pr.user_id = u.id
       ${whereSql}
       ORDER BY pr.created_at DESC, pr.id DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const countRows = await query<any[]>(
      `SELECT COUNT(*) AS total
       FROM points_records pr
       LEFT JOIN users u ON pr.user_id = u.id
       ${whereSql}`,
      params
    );

    res.json({
      success: true,
      data: {
        list,
        pagination: {
          page,
          pageSize,
          total: Number((countRows[0] as any)?.total || 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/exchange-records', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = normalizeOptionalText(req.body?.user_id);
    if (!userId) {
      throw new AppError(400, 'User ID is required.');
    }

    const points = normalizeExchangePoints(req.body?.points);
    const description = normalizeOptionalText(req.body?.description) || '后台手动兑换记录';
    const createdAt = parseDateInput(req.body?.created_at) || new Date();

    const result = await transaction(async (connection) => {
      const users = await selectRows<any[]>(
        'SELECT id FROM users WHERE id = ? LIMIT 1',
        [userId],
        connection
      );
      if (users.length === 0) {
        throw new AppError(404, 'User not found.');
      }

      await runExecute(
        'UPDATE users SET points = COALESCE(points, 0) + ? WHERE id = ?',
        [points, userId],
        connection
      );

      const recordId = await insertPointsRecord({
        userId,
        points,
        type: 'exchange',
        description,
        connection,
      });

      await runExecute(
        'UPDATE points_records SET created_at = ? WHERE id = ?',
        [createdAt, recordId],
        connection
      );

      return {
        id: recordId,
      };
    });

    res.json({
      success: true,
      message: 'Exchange record created successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/exchange-records/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await transaction(async (connection) => {
      const existingRows = await selectRows<any[]>(
        `SELECT id, user_id, points, type, description, created_at
         FROM points_records
         WHERE id = ? AND type = 'exchange'
         LIMIT 1`,
        [id],
        connection
      );

      if (existingRows.length === 0) {
        throw new AppError(404, 'Exchange record not found.');
      }

      const existing = existingRows[0] as any;
      const nextUserId = normalizeOptionalText(req.body?.user_id) || String(existing.user_id);
      const nextPoints = req.body?.points !== undefined ? normalizeExchangePoints(req.body?.points) : Number(existing.points || 0);
      const nextDescription =
        normalizeOptionalText(req.body?.description) || String(existing.description || '后台手动兑换记录');
      const nextCreatedAt = parseDateInput(req.body?.created_at) || parseDateInput(existing.created_at) || new Date();

      const userRows = await selectRows<any[]>(
        'SELECT id FROM users WHERE id = ? LIMIT 1',
        [nextUserId],
        connection
      );
      if (userRows.length === 0) {
        throw new AppError(404, 'User not found.');
      }

      if (String(existing.user_id) !== nextUserId) {
        await runExecute(
          'UPDATE users SET points = COALESCE(points, 0) - ? WHERE id = ?',
          [Number(existing.points || 0), String(existing.user_id)],
          connection
        );
        await runExecute(
          'UPDATE users SET points = COALESCE(points, 0) + ? WHERE id = ?',
          [nextPoints, nextUserId],
          connection
        );
      } else {
        const diff = nextPoints - Number(existing.points || 0);
        if (diff !== 0) {
          await runExecute(
            'UPDATE users SET points = COALESCE(points, 0) + ? WHERE id = ?',
            [diff, nextUserId],
            connection
          );
        }
      }

      await runExecute(
        `UPDATE points_records
         SET user_id = ?,
             points = ?,
             description = ?,
             created_at = ?
         WHERE id = ?`,
        [nextUserId, nextPoints, nextDescription, nextCreatedAt, id],
        connection
      );

      return {
        id: Number(id),
        user_id: nextUserId,
        points: nextPoints,
      };
    });

    res.json({
      success: true,
      message: 'Exchange record updated successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/exchange-records/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await transaction(async (connection) => {
      const existingRows = await selectRows<any[]>(
        `SELECT id, user_id, points
         FROM points_records
         WHERE id = ? AND type = 'exchange'
         LIMIT 1`,
        [id],
        connection
      );

      if (existingRows.length === 0) {
        throw new AppError(404, 'Exchange record not found.');
      }

      const existing = existingRows[0] as any;
      await runExecute(
        'UPDATE users SET points = COALESCE(points, 0) - ? WHERE id = ?',
        [Number(existing.points || 0), String(existing.user_id)],
        connection
      );
      await runExecute('DELETE FROM points_records WHERE id = ?', [id], connection);
    });

    res.json({
      success: true,
      message: 'Exchange record deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/referrals/summary', authMiddleware, adminMiddleware, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [referralRows, userDiamondRows, withdrawalRows] = await Promise.all([
      query<any[]>(
        `SELECT
           COUNT(*) AS total_records,
           COUNT(DISTINCT referrer_id) AS total_referrers,
           COUNT(DISTINCT referee_id) AS total_referees,
           SUM(CASE WHEN referee_type = 'paid' THEN 1 ELSE 0 END) AS paid_records,
           SUM(CASE WHEN reward_type = 'diamond' THEN reward_amount ELSE 0 END) AS total_reward_diamonds,
           SUM(CASE WHEN reward_type = 'diamond' AND reward_status = 'pending' THEN reward_amount ELSE 0 END) AS pending_reward_diamonds,
           SUM(CASE WHEN reward_type = 'diamond' AND reward_status = 'settled' THEN reward_amount ELSE 0 END) AS settled_reward_diamonds,
           SUM(CASE WHEN reward_type = 'diamond' AND reward_status = 'completed' THEN reward_amount ELSE 0 END) AS completed_reward_diamonds,
           SUM(CASE WHEN reward_type = 'points' THEN reward_amount ELSE 0 END) AS total_reward_points
         FROM referrals`
      ),
      query<any[]>(
        `SELECT
           COALESCE(SUM(COALESCE(diamond_available, 0)), 0) AS available_diamonds,
           COALESCE(SUM(COALESCE(diamond_pending, 0)), 0) AS pending_diamonds,
           COALESCE(SUM(COALESCE(diamond_frozen, 0)), 0) AS frozen_diamonds,
           COALESCE(SUM(COALESCE(diamond_total_earned, 0)), 0) AS total_earned_diamonds,
           COALESCE(SUM(COALESCE(diamond_total_withdrawn, 0)), 0) AS total_withdrawn_diamonds
         FROM users`
      ),
      query<any[]>(
        `SELECT
           COUNT(*) AS total_requests,
           SUM(CASE WHEN status = 'pending_review' THEN 1 ELSE 0 END) AS pending_review_count,
           SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
           SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_count,
           SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count,
           COALESCE(SUM(CASE WHEN status = 'pending_review' THEN gross_amount ELSE 0 END), 0) AS pending_review_amount,
           COALESCE(SUM(CASE WHEN status = 'approved' THEN gross_amount ELSE 0 END), 0) AS approved_amount,
           COALESCE(SUM(CASE WHEN status = 'paid' THEN gross_amount ELSE 0 END), 0) AS paid_amount,
           COALESCE(SUM(CASE WHEN status = 'paid' THEN tax_amount ELSE 0 END), 0) AS paid_tax_amount,
           COALESCE(SUM(CASE WHEN status = 'paid' THEN net_amount ELSE 0 END), 0) AS paid_net_amount
         FROM withdraw_requests`
      ),
    ]);

    const referralSummary = referralRows[0] || {};
    const userDiamondSummary = userDiamondRows[0] || {};
    const withdrawalSummary = withdrawalRows[0] || {};

    res.json({
      success: true,
      data: {
        referral: {
          totalRecords: Number(referralSummary.total_records || 0),
          totalReferrers: Number(referralSummary.total_referrers || 0),
          totalReferees: Number(referralSummary.total_referees || 0),
          paidRecords: Number(referralSummary.paid_records || 0),
          totalRewardDiamonds: Number(referralSummary.total_reward_diamonds || 0),
          pendingRewardDiamonds: Number(referralSummary.pending_reward_diamonds || 0),
          settledRewardDiamonds: Number(referralSummary.settled_reward_diamonds || 0),
          completedRewardDiamonds: Number(referralSummary.completed_reward_diamonds || 0),
          totalRewardPoints: Number(referralSummary.total_reward_points || 0),
          totalRewardAmount: diamondsToAmount(Number(referralSummary.total_reward_diamonds || 0)),
          pendingRewardAmount: diamondsToAmount(Number(referralSummary.pending_reward_diamonds || 0)),
          settledRewardAmount: diamondsToAmount(Number(referralSummary.settled_reward_diamonds || 0)),
          completedRewardAmount: diamondsToAmount(Number(referralSummary.completed_reward_diamonds || 0)),
        },
        diamonds: {
          availableDiamonds: Number(userDiamondSummary.available_diamonds || 0),
          pendingDiamonds: Number(userDiamondSummary.pending_diamonds || 0),
          frozenDiamonds: Number(userDiamondSummary.frozen_diamonds || 0),
          totalEarnedDiamonds: Number(userDiamondSummary.total_earned_diamonds || 0),
          totalWithdrawnDiamonds: Number(userDiamondSummary.total_withdrawn_diamonds || 0),
          availableAmount: diamondsToAmount(Number(userDiamondSummary.available_diamonds || 0)),
          pendingAmount: diamondsToAmount(Number(userDiamondSummary.pending_diamonds || 0)),
          frozenAmount: diamondsToAmount(Number(userDiamondSummary.frozen_diamonds || 0)),
          totalEarnedAmount: diamondsToAmount(Number(userDiamondSummary.total_earned_diamonds || 0)),
          totalWithdrawnAmount: diamondsToAmount(Number(userDiamondSummary.total_withdrawn_diamonds || 0)),
        },
        withdrawals: {
          totalRequests: Number(withdrawalSummary.total_requests || 0),
          pendingReviewCount: Number(withdrawalSummary.pending_review_count || 0),
          approvedCount: Number(withdrawalSummary.approved_count || 0),
          paidCount: Number(withdrawalSummary.paid_count || 0),
          rejectedCount: Number(withdrawalSummary.rejected_count || 0),
          pendingReviewAmount: Number(withdrawalSummary.pending_review_amount || 0),
          approvedAmount: Number(withdrawalSummary.approved_amount || 0),
          paidAmount: Number(withdrawalSummary.paid_amount || 0),
          paidTaxAmount: Number(withdrawalSummary.paid_tax_amount || 0),
          paidNetAmount: Number(withdrawalSummary.paid_net_amount || 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/referrals', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 20;
    const offset = (page - 1) * pageSize;

    const referrals = await query<any[]>(
      `SELECT r.*, u1.username AS referrer_name, u2.username AS referee_name
       FROM referrals r
       LEFT JOIN users u1 ON r.referrer_id = u1.id
       LEFT JOIN users u2 ON r.referee_id = u2.id
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [pageSize, offset],
    );

    const countResult = await query<any[]>('SELECT COUNT(*) AS total FROM referrals');
    const total = countResult[0]?.total || 0;

    res.json({
      success: true,
      data: {
        list: referrals.map((item) => ({
          ...item,
          reward_amount_display:
            item.reward_type === 'diamond'
              ? diamondsToAmount(Number(item.reward_amount || 0))
              : Number(item.reward_amount || 0),
        })),
        pagination: { page, pageSize, total },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/referral-settings', authMiddleware, adminMiddleware, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await getReferralSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

router.put('/referral-settings', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await saveReferralSettings(req.body || {});
    res.json({
      success: true,
      message: 'Referral settings updated successfully.',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/referrals/leaderboard', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    const [year, monthNumber] = month.split('-').map((value) => Number(value));
    const startDate = new Date(year, Math.max((monthNumber || 1) - 1, 0), 1);
    const endDate = new Date(year, Math.max(monthNumber || 1, 1), 1);

    const leaderboard = await query<any[]>(
      `SELECT
         inviter.id AS referrer_id,
         inviter.username AS referrer_name,
         COUNT(invited.id) AS invite_count
       FROM users inviter
       LEFT JOIN users invited
         ON invited.referred_by = inviter.id
        AND invited.created_at >= ?
        AND invited.created_at < ?
       GROUP BY inviter.id, inviter.username
       HAVING invite_count > 0
       ORDER BY invite_count DESC, inviter.username ASC
       LIMIT 20`,
      [startDate, endDate],
    );

    res.json({
      success: true,
      data: {
        month,
        list: leaderboard,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/referrals/withdrawals', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 20;
    const status = normalizeOptionalText(req.query.status);
    const offset = (page - 1) * pageSize;
    const filters: string[] = [];
    const params: any[] = [];

    if (status) {
      filters.push('wr.status = ?');
      params.push(status);
    }

    const whereSql = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const rows = await query<any[]>(
      `SELECT
         wr.*,
         u.username,
         u.nickname,
         u.phone
       FROM withdraw_requests wr
       LEFT JOIN users u ON u.id = wr.user_id
       ${whereSql}
       ORDER BY wr.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    );

    const countRows = await query<any[]>(
      `SELECT COUNT(*) AS total
       FROM withdraw_requests wr
       ${whereSql}`,
      params,
    );

    res.json({
      success: true,
      data: {
        list: rows,
        pagination: {
          page,
          pageSize,
          total: Number(countRows[0]?.total || 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/referrals/withdrawals/:id/review', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminUser = (req as any).user;
    const { id } = req.params;
    const { action, note, paymentReference } = req.body || {};

    if (!['approve', 'reject', 'mark_paid'].includes(String(action || ''))) {
      throw new AppError(400, 'Invalid withdrawal review action.');
    }

    const status = await reviewWithdrawalRequest(
      id,
      action,
      String(adminUser.id),
      note ? String(note) : null,
      paymentReference ? String(paymentReference) : null,
    );

    res.json({
      success: true,
      message: 'Withdrawal review updated successfully.',
      data: {
        id,
        status,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/redeem-codes/presets', authMiddleware, adminMiddleware, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: EXPERIENCE_CODE_PRESETS,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/redeem-codes', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = new URLSearchParams();
    Object.entries((req.query || {}) as Record<string, unknown>).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      search.set(key, String(value));
    });
    return res.redirect(307, `/api/experience-codes${search.toString() ? `?${search.toString()}` : ''}`);

    await markExpiredExperienceCodes();

    const page = normalizeQueryPage(req.query.page, 1);
    const pageSize = normalizeQueryPageSize(req.query.pageSize, 20, 200);
    const keyword = normalizeOptionalText(req.query.keyword);
    const status = normalizeOptionalText(req.query.status);
    const rewardType = normalizeOptionalText(req.query.rewardType);
    const offset = (page - 1) * pageSize;
    const filters: string[] = [];
    const params: any[] = [];

    if (keyword) {
      filters.push(`(
        rc.code LIKE ?
        OR COALESCE(rc.reward_name, '') LIKE ?
        OR COALESCE(rc.batch_no, '') LIKE ?
        OR COALESCE(ru.username, '') LIKE ?
        OR COALESCE(ru.nickname, '') LIKE ?
        OR COALESCE(ru.phone, '') LIKE ?
      )`);
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    if (status) {
      if (!['unused', 'redeemed', 'expired'].includes(String(status))) {
        throw new AppError(400, '无效的兑换码状态。');
      }
      filters.push('rc.status = ?');
      params.push(String(status));
    }

    if (rewardType) {
      filters.push('rc.reward_type = ?');
      params.push(normalizeExperienceCodeRewardType(String(rewardType)));
    }

    const whereSql = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const list = await query<any[]>(
      `SELECT
         rc.id,
         rc.batch_no,
         rc.code,
         rc.reward_type,
         rc.reward_name,
         rc.points_reward,
         rc.duration_days,
         rc.duration_unit,
         rc.status,
         rc.generated_by,
         gu.username AS generated_by_username,
         gu.nickname AS generated_by_nickname,
         rc.remark,
         rc.redeemed_by,
         ru.username AS redeemed_username,
         ru.nickname AS redeemed_nickname,
         ru.phone AS redeemed_phone,
         rc.redeemed_at,
         rc.redeemed_record_id,
         rc.expires_at,
         rc.created_at,
         rc.updated_at
       FROM experience_redeem_codes rc
       LEFT JOIN users gu ON rc.generated_by = gu.id
       LEFT JOIN users ru ON rc.redeemed_by = ru.id
       ${whereSql}
       ORDER BY rc.created_at DESC, rc.id DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const countRows = await query<any[]>(
      `SELECT COUNT(*) AS total
       FROM experience_redeem_codes rc
       LEFT JOIN users ru ON rc.redeemed_by = ru.id
       ${whereSql}`,
      params
    );

    res.json({
      success: true,
      data: {
        list,
        presets: EXPERIENCE_CODE_PRESETS,
        pagination: {
          page,
          pageSize,
          total: Number((countRows[0] as any)?.total || 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/redeem-codes/generate', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    return handleExperienceCodesCreate(req, res, next);

    const generatedBy = String((req as any).user?.id || '');
    const rewardType = normalizeExperienceCodeRewardType(req.body?.rewardType);
    const quantity = normalizeBatchQuantity(req.body?.quantity);
    const remark = normalizeOptionalText(req.body?.remark);
    const preset = getExperienceCodePreset(rewardType);
    const batchNo = buildExperienceCodeBatchNo();

    const data = await transaction(async (connection) => {
      const localCodes = new Set<string>();
      const createdItems: Array<Record<string, unknown>> = [];

      for (let index = 0; index < quantity; index += 1) {
        const code = await generateUniqueExperienceCode(connection, localCodes);
        const expiresAt = buildExperienceCodeExpiry(preset);

        await runExecute(
          `INSERT INTO experience_redeem_codes (
             batch_no,
             code,
             reward_type,
             reward_name,
             points_reward,
             duration_days,
             duration_unit,
             status,
             generated_by,
             remark,
             expires_at,
             created_at,
             updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, 'unused', ?, ?, ?, NOW(), NOW())`,
          [
            batchNo,
            code,
            preset.type,
            preset.name,
            preset.pointsReward,
            preset.durationDays,
            'day',
            generatedBy || null,
            remark,
            expiresAt,
          ],
          connection
        );

        createdItems.push({
          batch_no: batchNo,
          code,
          reward_type: preset.type,
          reward_name: preset.name,
          points_reward: preset.pointsReward,
          duration_days: preset.durationDays,
          duration_unit: 'day',
          status: 'unused',
          remark,
          expires_at: expiresAt,
        });
      }

      return createdItems;
    });

    res.json({
      success: true,
      message: quantity > 1 ? `已批量生成 ${quantity} 个体验兑换码。` : '已生成 1 个体验兑换码。',
      data: {
        batchNo,
        reward: preset,
        list: data,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/redeem-codes/records', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = new URLSearchParams();
    Object.entries((req.query || {}) as Record<string, unknown>).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      search.set(key, String(value));
    });
    return res.redirect(307, `/api/experience-code-records${search.toString() ? `?${search.toString()}` : ''}`);

    await markExpiredExperienceCodes();

    const page = normalizeQueryPage(req.query.page, 1);
    const pageSize = normalizeQueryPageSize(req.query.pageSize, 20, 200);
    const keyword = normalizeOptionalText(req.query.keyword);
    const rewardType = normalizeOptionalText(req.query.rewardType);
    const offset = (page - 1) * pageSize;
    const filters = [`rc.status = 'redeemed'`];
    const params: any[] = [];

    if (keyword) {
      filters.push(`(
        rc.code LIKE ?
        OR COALESCE(rc.reward_name, '') LIKE ?
        OR COALESCE(u.username, '') LIKE ?
        OR COALESCE(u.nickname, '') LIKE ?
        OR COALESCE(u.phone, '') LIKE ?
      )`);
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    if (rewardType) {
      filters.push('rc.reward_type = ?');
      params.push(normalizeExperienceCodeRewardType(rewardType));
    }

    const whereSql = `WHERE ${filters.join(' AND ')}`;
    const list = await query<any[]>(
      `SELECT
         rc.id,
         rc.batch_no,
         rc.code,
         rc.reward_type,
         rc.reward_name,
         rc.points_reward,
         rc.duration_days,
         rc.duration_unit,
         rc.redeemed_by,
         u.username,
         u.nickname,
         u.phone,
         rc.redeemed_at,
         rc.redeemed_record_id,
         pr.description AS record_description,
         pr.created_at AS record_created_at,
         rc.expires_at,
         rc.created_at
       FROM experience_redeem_codes rc
       LEFT JOIN users u ON rc.redeemed_by = u.id
       LEFT JOIN points_records pr ON rc.redeemed_record_id = pr.id
       ${whereSql}
       ORDER BY rc.redeemed_at DESC, rc.id DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const countRows = await query<any[]>(
      `SELECT COUNT(*) AS total
       FROM experience_redeem_codes rc
       LEFT JOIN users u ON rc.redeemed_by = u.id
       ${whereSql}`,
      params
    );

    res.json({
      success: true,
      data: {
        list,
        presets: EXPERIENCE_CODE_PRESETS,
        pagination: {
          page,
          pageSize,
          total: Number((countRows[0] as any)?.total || 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

const handleExperienceCodesCreate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const generatedBy = String((req as any).user?.id || '');
    const batchName = normalizeOptionalText(req.body?.batch_name);
    const planKey = normalizeExperienceCodeRewardType(req.body?.plan_key);
    const quantity = normalizeBatchQuantity(req.body?.quantity);
    const note = normalizeOptionalText(req.body?.note);
    const prefix = normalizeOptionalText(req.body?.prefix) || '';
    const preset = getExperienceCodePreset(planKey);
    const batchNo = buildExperienceCodeBatchNo();
    const validityDays = Math.max(1, Number(req.body?.validity_days || preset.expiresInDays || 7));
    const points = Math.max(0, Number(req.body?.points || preset.pointsReward));
    const durationDays = Math.max(0, Number(req.body?.duration_days || preset.durationDays));

    const list = await transaction(async (connection) => {
      const localCodes = new Set<string>();
      const createdItems: Array<Record<string, unknown>> = [];

      for (let index = 0; index < quantity; index += 1) {
        const code = await generateUniqueExperienceCode(connection, localCodes, prefix);
        const expiredAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);

        await runExecute(
          `INSERT INTO experience_redeem_codes (
             batch_no,
             batch_name,
             code,
             plan_key,
             points,
             duration_days,
             validity_days,
             status,
             generated_by,
             note,
             expired_at,
             created_at,
             updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, 'unused', ?, ?, ?, NOW(), NOW())`,
          [
            batchNo,
            batchName,
            code,
            planKey,
            points,
            durationDays,
            validityDays,
            generatedBy || null,
            note,
            expiredAt,
          ],
          connection
        );

        createdItems.push({
          code,
          batch_no: batchNo,
          batch_name: batchName,
          plan_key: planKey,
          points,
          duration_days: durationDays,
          validity_days: validityDays,
          status: 'unused',
          created_at: new Date(),
          expired_at: expiredAt,
          note,
        });
      }

      return createdItems;
    });

    res.json({
      success: true,
      message: quantity > 1 ? `已批量生成 ${quantity} 个体验码。` : '体验码已生成。',
      data: {
        batch_no: batchNo,
        batch_name: batchName,
        list,
        codes: list.map((item) => String(item.code)),
      },
    });
  } catch (error) {
    next(error);
  }
};

router.get('/experience-codes', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await markExpiredExperienceCodes();

    const page = normalizeQueryPage(req.query.page, 1);
    const pageSize = normalizeQueryPageSize(req.query.pageSize, 20, 200);
    const keyword = normalizeOptionalText(req.query.keyword);
    const status = normalizeOptionalText(req.query.status);
    const planKey = normalizeOptionalText(req.query.plan_key);
    const batchNo = normalizeOptionalText(req.query.batch_no);
    const offset = (page - 1) * pageSize;
    const filters: string[] = [];
    const params: any[] = [];

    if (keyword) {
      filters.push(`(
        ec.code LIKE ?
        OR COALESCE(ec.batch_no, '') LIKE ?
        OR COALESCE(ec.batch_name, '') LIKE ?
        OR COALESCE(u.username, '') LIKE ?
        OR COALESCE(u.nickname, '') LIKE ?
        OR COALESCE(u.phone, '') LIKE ?
      )`);
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    if (status && status !== 'all') {
      if (!['unused', 'activated', 'expired', 'revoked'].includes(status)) {
        throw new AppError(400, '无效的体验码状态。');
      }
      filters.push('ec.status = ?');
      params.push(status);
    }

    if (planKey && planKey !== 'all') {
      filters.push('ec.plan_key = ?');
      params.push(normalizeExperienceCodeRewardType(planKey));
    }

    if (batchNo) {
      filters.push('ec.batch_no = ?');
      params.push(batchNo);
    }

    const whereSql = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const list = await query<any[]>(
      `SELECT
         ec.id,
         ec.code,
         ec.batch_no,
         ec.batch_name,
         ec.plan_key,
         ec.points,
         ec.duration_days,
         ec.validity_days,
         ec.status,
         ec.bound_user_id,
         u.username AS bound_username,
         u.nickname AS bound_nickname,
         ec.created_at,
         ec.expired_at,
         ec.redeemed_at,
         ec.activated_at,
         ec.note
       FROM experience_redeem_codes ec
       LEFT JOIN users u ON ec.bound_user_id = u.id
       ${whereSql}
       ORDER BY ec.created_at DESC, ec.id DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const countRows = await query<any[]>(
      `SELECT COUNT(*) AS total
       FROM experience_redeem_codes ec
       LEFT JOIN users u ON ec.bound_user_id = u.id
       ${whereSql}`,
      params
    );

    res.json({
      success: true,
      data: {
        list,
        pagination: {
          page,
          pageSize,
          total: Number((countRows[0] as any)?.total || 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/experience-codes/export', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await markExpiredExperienceCodes();

    const batchNo = normalizeOptionalText(req.query.batch_no);
    if (!batchNo) {
      throw new AppError(400, '批次号不能为空。');
    }

    const rows = await query<any[]>(
      `SELECT
         ec.id,
         ec.code,
         ec.batch_no,
         ec.batch_name,
         ec.plan_key,
         ec.points,
         ec.duration_days,
         ec.validity_days,
         ec.status,
         ec.bound_user_id,
         u.username AS bound_username,
         u.nickname AS bound_nickname,
         ec.created_at,
         ec.expired_at,
         ec.redeemed_at,
         ec.activated_at,
         ec.note
       FROM experience_redeem_codes ec
       LEFT JOIN users u ON ec.bound_user_id = u.id
       WHERE ec.batch_no = ?
       ORDER BY ec.created_at ASC, ec.id ASC`,
      [batchNo]
    );

    if (rows.length === 0) {
      throw new AppError(404, '该批次不存在。');
    }

    const batchName = normalizeOptionalText((rows[0] as any)?.batch_name) || batchNo;
    const safeBatchName = batchName.replace(/[\\/:*?"<>|]/g, '-');

    res.json({
      success: true,
      data: {
        batch_no: batchNo,
        batch_name: batchName,
        filename: `${safeBatchName}-${batchNo}.txt`,
        exported_at: new Date().toISOString(),
        list: rows,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/experience-codes', authMiddleware, adminMiddleware, handleExperienceCodesCreate);
router.post('/experience-codes/batch', authMiddleware, adminMiddleware, handleExperienceCodesCreate);

router.post('/experience-codes/:id/revoke', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await transaction(async (connection) => {
      const rows = await selectRows<any[]>(
        `SELECT id, status, bound_user_id
         FROM experience_redeem_codes
         WHERE id = ?
         LIMIT 1`,
        [id],
        connection
      );

      if (rows.length === 0) {
        throw new AppError(404, '体验码不存在。');
      }

      const current = rows[0] as any;
      if (String(current.status || '') === 'activated' || current.bound_user_id) {
        throw new AppError(400, '已激活的体验码不能作废。');
      }

      if (String(current.status || '') !== 'revoked') {
        await runExecute(
          `UPDATE experience_redeem_codes
           SET status = 'revoked',
               updated_at = NOW()
           WHERE id = ?`,
          [id],
          connection
        );
      }

      return { id: Number(id) };
    });

    res.json({
      success: true,
      message: '体验码已作废。',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/experience-code-records', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await markExpiredExperienceCodes();

    const page = normalizeQueryPage(req.query.page, 1);
    const pageSize = normalizeQueryPageSize(req.query.pageSize, 20, 200);
    const keyword = normalizeOptionalText(req.query.keyword);
    const status = normalizeOptionalText(req.query.status);
    const planKey = normalizeOptionalText(req.query.plan_key);
    const offset = (page - 1) * pageSize;
    const filters: string[] = [];
    const params: any[] = [];

    if (keyword) {
      filters.push(`(
        ec.code LIKE ?
        OR COALESCE(ec.batch_no, '') LIKE ?
        OR COALESCE(ec.batch_name, '') LIKE ?
        OR COALESCE(u.username, '') LIKE ?
        OR COALESCE(u.nickname, '') LIKE ?
        OR COALESCE(u.phone, '') LIKE ?
      )`);
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    if (status && status !== 'all') {
      if (!['unused', 'activated', 'expired', 'revoked'].includes(status)) {
        throw new AppError(400, '无效的体验码状态。');
      }
      filters.push('ec.status = ?');
      params.push(status);
    }

    if (planKey && planKey !== 'all') {
      filters.push('ec.plan_key = ?');
      params.push(normalizeExperienceCodeRewardType(planKey));
    }

    const whereSql = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const list = await query<any[]>(
      `SELECT
         ec.id,
         ec.code,
         ec.batch_no,
         ec.batch_name,
         ec.plan_key,
         ec.points,
         ec.duration_days,
         ec.validity_days,
         ec.status,
         ec.bound_user_id,
         u.username AS bound_username,
         u.nickname AS bound_nickname,
         ec.created_at,
         ec.expired_at,
         ec.redeemed_at,
         ec.activated_at,
         ec.note
       FROM experience_redeem_codes ec
       LEFT JOIN users u ON ec.bound_user_id = u.id
       ${whereSql}
       ORDER BY COALESCE(ec.activated_at, ec.redeemed_at, ec.created_at) DESC, ec.id DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const countRows = await query<any[]>(
      `SELECT COUNT(*) AS total
       FROM experience_redeem_codes ec
       LEFT JOIN users u ON ec.bound_user_id = u.id
       ${whereSql}`,
      params
    );

    res.json({
      success: true,
      data: {
        list,
        pagination: {
          page,
          pageSize,
          total: Number((countRows[0] as any)?.total || 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/durations', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 20;
    const keyword = normalizeOptionalText(req.query.keyword);
    const offset = (page - 1) * pageSize;
    const filters: string[] = [];
    const params: any[] = [];

    if (keyword) {
      filters.push(`(
        d.user_id LIKE ?
        OR COALESCE(u.username, '') LIKE ?
        OR COALESCE(u.nickname, '') LIKE ?
        OR COALESCE(u.phone, '') LIKE ?
      )`);
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    const whereSql = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const durations = await query<any[]>(
      `SELECT
         d.user_id,
         u.username,
         u.nickname,
         u.phone,
         d.total_duration,
         d.remaining_duration,
         ROUND(COALESCE(d.total_duration, 0) / 3600, 2) AS total_hours,
         ROUND(COALESCE(d.remaining_duration, 0) / 3600, 2) AS remaining_hours,
         d.is_active,
         d.is_permanent,
         d.activated_at,
         d.expires_at,
         d.created_at
       FROM user_durations d
       LEFT JOIN users u ON d.user_id = u.id
       ${whereSql}
       ORDER BY d.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    );

    const countResult = await query<any[]>(
      `SELECT COUNT(*) AS total
       FROM user_durations d
       LEFT JOIN users u ON d.user_id = u.id
       ${whereSql}`,
      params
    );
    const total = countResult[0]?.total || 0;

    res.json({
      success: true,
      data: {
        list: durations,
        pagination: { page, pageSize, total },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/durations', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = normalizeOptionalText(req.body?.user_id);
    if (!userId) {
      throw new AppError(400, 'User ID is required.');
    }

    const totalHours = Number(req.body?.total_hours ?? 0);
    const remainingHours = Number(req.body?.remaining_hours ?? totalHours);
    const isPermanent = Boolean(req.body?.is_permanent);
    const activatedAt = parseDateInput(req.body?.activated_at) || new Date();
    const expiresAt = isPermanent ? null : parseDateInput(req.body?.expires_at);

    const users = await query<any[]>('SELECT id FROM users WHERE id = ? LIMIT 1', [userId]);
    if (users.length === 0) {
      throw new AppError(404, 'User not found.');
    }

    const existingRows = await query<any[]>('SELECT user_id FROM user_durations WHERE user_id = ? LIMIT 1', [userId]);
    if (existingRows.length > 0) {
      throw new AppError(400, 'Duration record already exists for this user.');
    }

    await query(
      `INSERT INTO user_durations (
        user_id,
        total_duration,
        remaining_duration,
        is_active,
        is_permanent,
        activated_at,
        expires_at,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        Math.round(totalHours * 3600),
        Math.round(remainingHours * 3600),
        req.body?.is_active === undefined ? 1 : Number(Boolean(req.body?.is_active)),
        Number(isPermanent),
        activatedAt,
        expiresAt,
      ]
    );

    res.json({
      success: true,
      message: 'Duration record created successfully.',
    });
  } catch (error) {
    next(error);
  }
});

router.put('/durations/:userId', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const existingRows = await query<any[]>('SELECT user_id FROM user_durations WHERE user_id = ? LIMIT 1', [userId]);
    if (existingRows.length === 0) {
      throw new AppError(404, 'Duration record not found.');
    }

    const totalHours = Number(req.body?.total_hours ?? 0);
    const remainingHours = Number(req.body?.remaining_hours ?? totalHours);
    const isPermanent = Boolean(req.body?.is_permanent);
    const activatedAt = parseDateInput(req.body?.activated_at) || null;
    const expiresAt = isPermanent ? null : parseDateInput(req.body?.expires_at);

    await query(
      `UPDATE user_durations
       SET total_duration = ?,
           remaining_duration = ?,
           is_active = ?,
           is_permanent = ?,
           activated_at = ?,
           expires_at = ?
       WHERE user_id = ?`,
      [
        Math.round(totalHours * 3600),
        Math.round(remainingHours * 3600),
        Number(Boolean(req.body?.is_active)),
        Number(isPermanent),
        activatedAt,
        expiresAt,
        userId,
      ]
    );

    res.json({
      success: true,
      message: 'Duration record updated successfully.',
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/durations/:userId', authMiddleware, adminMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    await query('DELETE FROM user_durations WHERE user_id = ?', [userId]);

    res.json({
      success: true,
      message: 'Duration record deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
