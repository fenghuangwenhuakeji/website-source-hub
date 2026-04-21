import type { PoolConnection } from '../../config/database.js';
import { RowDataPacket, db } from '../../config/database.js';
import { ApiError } from '../../middleware/errorHandler.js';
import { insertPointsRecord } from '../../utils/pointsRecord.js';
import { applyRechargeCommission } from '../../utils/referralProgram.js';
import { toDate, toNumber } from './common.js';
import type {
  GatewayIssueResult,
  OrderTableName,
  PaymentOrder,
  PaymentProcessPayload,
  PaymentProvider,
} from './types.js';

function buildOrderWhereClause(
  orderId?: string,
  orderNo?: string,
  tableAlias = ''
): { sql: string; params: string[] } {
  const prefix = tableAlias ? `${tableAlias}.` : '';
  const clauses: string[] = [];
  const params: string[] = [];

  if (orderId) {
    clauses.push(`${prefix}id = ?`);
    params.push(orderId);
  }
  if (orderNo) {
    clauses.push(`${prefix}order_no = ?`);
    params.push(orderNo);
  }

  if (clauses.length === 0) {
    throw ApiError.badRequest('Missing order identifier');
  }

  return {
    sql: clauses.join(' OR '),
    params,
  };
}

function mapRechargeOrder(row: any): PaymentOrder {
  return {
    tableName: 'recharge_orders',
    id: String(row.id),
    orderNo: String(row.order_no),
    userId: String(row.user_id),
    amount: toNumber(row.amount),
    points: toNumber(row.points),
    bonusPoints: toNumber(row.bonus_points),
    productName: String(row.product_name || 'Recharge Order'),
    status: String(row.status),
    payMethod: String(row.pay_method || 'wechat'),
    createdAt: toDate(row.created_at),
    payTime: toDate(row.pay_time),
    expireTime: toDate(row.expire_time),
    packageId: null,
    duration: 0,
    durationUnit: null,
    providerTransactionId: row.provider_transaction_id ? String(row.provider_transaction_id) : null,
    providerStatus: row.provider_status ? String(row.provider_status) : null,
  };
}

function mapLegacyOrder(row: any): PaymentOrder {
  return {
    tableName: 'orders',
    id: String(row.id),
    orderNo: String(row.order_no),
    userId: String(row.user_id),
    amount: toNumber(row.amount),
    points: toNumber(row.points),
    bonusPoints: toNumber(row.bonus_points),
    productName: String(row.product_name || 'Recharge Order'),
    status: String(row.status),
    payMethod: String(row.pay_method || 'wechat'),
    createdAt: toDate(row.created_at),
    payTime: toDate(row.pay_time),
    expireTime: null,
    packageId: row.package_id === null || row.package_id === undefined ? null : Number(row.package_id),
    duration: toNumber(row.duration),
    durationUnit: row.duration_unit ? String(row.duration_unit) : null,
    providerTransactionId: row.provider_transaction_id ? String(row.provider_transaction_id) : null,
    providerStatus: row.provider_status ? String(row.provider_status) : null,
  };
}

function getUpdateStamp(tableName: OrderTableName): string {
  return tableName === 'recharge_orders' ? ', updated_at = NOW()' : '';
}

async function insertPointsLog(
  connection: PoolConnection,
  order: PaymentOrder,
  totalPoints: number
): Promise<void> {
  try {
    const [userRows] = await connection.execute(
      'SELECT points FROM users WHERE id = ? LIMIT 1',
      [order.userId]
    );
    const currentPoints = toNumber((userRows as RowDataPacket[])[0]?.points);

    await connection.execute(
      `INSERT INTO points_log (
         user_id, type, amount, balance_before, balance_after, order_id, description, created_at
       ) VALUES (?, 'recharge', ?, ?, ?, ?, ?, NOW())`,
      [
        order.userId,
        totalPoints,
        currentPoints - totalPoints,
        currentPoints,
        order.id,
        `Recharge: ${order.productName}`,
      ]
    );
  } catch {
    // points_log is not critical for the live payment flow.
  }
}

async function applyReferrerCommission(
  connection: PoolConnection,
  order: PaymentOrder
): Promise<void> {
  const [referrerRows] = await connection.execute(
    'SELECT referred_by FROM users WHERE id = ? LIMIT 1',
    [order.userId]
  );
  const referrerId = (referrerRows as RowDataPacket[])[0]?.referred_by;

  if (referrerId) {
    await applyRechargeCommission(
      String(referrerId),
      order.userId,
      order.points,
      order.id,
      connection
    );
  }
}

async function markRechargeOrderAsPaid(
  connection: PoolConnection,
  order: PaymentOrder,
  provider: PaymentProvider,
  payload: PaymentProcessPayload
): Promise<PaymentOrder> {
  const totalPoints = order.points + order.bonusPoints;
  const paidAmount = payload.paidAmount ?? order.amount;
  const paidAt = payload.paidAt || new Date();

  await connection.execute(
    `UPDATE recharge_orders
     SET status = 'paid',
         pay_method = ?,
         pay_time = ?,
         provider_transaction_id = ?,
         provider_buyer_id = ?,
         provider_status = ?,
         payment_scene = ?,
         paid_amount = ?,
         currency = ?,
         notify_time = ?,
         notify_payload = COALESCE(?, notify_payload),
         response_payload = COALESCE(?, response_payload),
         updated_at = NOW()
     WHERE id = ?`,
    [
      provider,
      paidAt,
      payload.providerTransactionId,
      payload.providerBuyerId || null,
      payload.providerStatus || 'SUCCESS',
      payload.paymentScene || provider.toUpperCase(),
      paidAmount,
      payload.currency || 'CNY',
      payload.notifyTime || new Date(),
      payload.notifyPayload || null,
      payload.responsePayload || null,
      order.id,
    ]
  );

  await connection.execute(
    `UPDATE users
     SET points = COALESCE(points, 0) + ?, total_recharge = COALESCE(total_recharge, 0) + ?
     WHERE id = ?`,
    [totalPoints, order.amount, order.userId]
  );

  await insertPointsRecord({
    userId: order.userId,
    points: totalPoints,
    type: 'recharge',
    description: `Recharge points: ${order.productName}`,
    connection,
  });

  await insertPointsLog(connection, order, totalPoints);
  await applyReferrerCommission(connection, order);

  return {
    ...order,
    status: 'paid',
    payMethod: provider,
    payTime: paidAt,
    providerTransactionId: payload.providerTransactionId,
    providerStatus: payload.providerStatus || 'SUCCESS',
  };
}

async function markLegacyOrderAsPaid(
  connection: PoolConnection,
  order: PaymentOrder,
  provider: PaymentProvider,
  payload: PaymentProcessPayload
): Promise<PaymentOrder> {
  const totalPoints = order.points + order.bonusPoints;
  const paidAmount = payload.paidAmount ?? order.amount;
  const paidAt = payload.paidAt || new Date();

  await connection.execute(
    `UPDATE orders
     SET status = 'paid',
         pay_method = ?,
         paid_at = ?,
         provider_transaction_id = ?,
         provider_buyer_id = ?,
         provider_status = ?,
         payment_scene = ?,
         paid_amount = ?,
         currency = ?,
         notify_time = ?,
         notify_payload = COALESCE(?, notify_payload),
         response_payload = COALESCE(?, response_payload),
         updated_at = NOW()
     WHERE id = ?`,
    [
      provider,
      paidAt,
      payload.providerTransactionId,
      payload.providerBuyerId || null,
      payload.providerStatus || 'SUCCESS',
      payload.paymentScene || provider.toUpperCase(),
      paidAmount,
      payload.currency || 'CNY',
      payload.notifyTime || new Date(),
      payload.notifyPayload || null,
      payload.responsePayload || null,
      order.id,
    ]
  );

  await connection.execute(
    `UPDATE users
     SET points = COALESCE(points, 0) + ?, total_recharge = COALESCE(total_recharge, 0) + ?
     WHERE id = ?`,
    [totalPoints, order.amount, order.userId]
  );

  await insertPointsRecord({
    userId: order.userId,
    points: totalPoints,
    type: 'recharge',
    description: `Recharge points: ${order.productName}`,
    connection,
  });

  await insertPointsLog(connection, order, totalPoints);
  await applyReferrerCommission(connection, order);

  return {
    ...order,
    status: 'paid',
    payMethod: provider,
    payTime: paidAt,
    providerTransactionId: payload.providerTransactionId,
    providerStatus: payload.providerStatus || 'SUCCESS',
  };
}

export async function findPaymentOrder(params: {
  orderId?: string;
  orderNo?: string;
}): Promise<PaymentOrder | null> {
  const { sql, params: values } = buildOrderWhereClause(params.orderId, params.orderNo);

  const rechargeOrders = await db.query<RowDataPacket[]>(
    `SELECT id, order_no, user_id, amount, points, COALESCE(bonus_points, 0) AS bonus_points,
            product_name, status, pay_method, pay_time, expire_time, created_at,
            provider_transaction_id, provider_status
     FROM recharge_orders
     WHERE ${sql}
     LIMIT 1`,
    values
  );

  if (rechargeOrders.length > 0) {
    return mapRechargeOrder(rechargeOrders[0]);
  }

  const legacyWhere = buildOrderWhereClause(params.orderId, params.orderNo, 'o');
  const orders = await db.query<RowDataPacket[]>(
      `SELECT o.id, o.order_no, o.user_id, o.amount, o.points,
            COALESCE(rp.bonus_points, 0) AS bonus_points,
            COALESCE(o.package_name, rp.name, 'Recharge Order') AS product_name,
            COALESCE(NULLIF(o.duration, 0), rp.duration, 0) AS duration,
            COALESCE(NULLIF(o.duration_unit, ''), rp.duration_unit, 'day') AS duration_unit,
            o.status, o.pay_method, o.paid_at AS pay_time, o.created_at, o.package_id,
            o.provider_transaction_id, o.provider_status
     FROM orders o
     LEFT JOIN recharge_packages rp ON rp.id = o.package_id
     WHERE ${legacyWhere.sql}
     LIMIT 1`,
    legacyWhere.params
  );

  if (orders.length > 0) {
    return mapLegacyOrder(orders[0]);
  }

  return null;
}

export async function updateOrderPayMethod(
  order: PaymentOrder,
  payMethod: PaymentProvider
): Promise<void> {
  await db.execute(
    `UPDATE ${order.tableName} SET pay_method = ?${getUpdateStamp(order.tableName)} WHERE id = ?`,
    [payMethod, order.id]
  );
}

export async function persistIssueResult(
  order: PaymentOrder,
  payMethod: PaymentProvider,
  result: GatewayIssueResult
): Promise<void> {
  await db.execute(
    `UPDATE ${order.tableName}
     SET pay_method = ?, payment_scene = ?, provider_status = ?, response_payload = ?${getUpdateStamp(
       order.tableName
     )}
     WHERE id = ?`,
    [payMethod, result.paymentScene, 'PENDING', result.responsePayload, order.id]
  );
}

export async function updateProviderState(
  order: PaymentOrder,
  providerStatus: string,
  responsePayload: string
): Promise<void> {
  await db.execute(
    `UPDATE ${order.tableName}
     SET provider_status = ?, response_payload = ?${getUpdateStamp(order.tableName)}
     WHERE id = ?`,
    [providerStatus, responsePayload, order.id]
  );
}

export async function markRechargeOrderExpired(order: PaymentOrder): Promise<void> {
  if (order.tableName !== 'recharge_orders' || !order.expireTime) {
    return;
  }

  await db.execute(
    `UPDATE recharge_orders
     SET status = 'expired', updated_at = NOW()
     WHERE id = ? AND status = 'pending'`,
    [order.id]
  );
}

export async function ensureOrderPayable(order: PaymentOrder): Promise<void> {
  if (order.status !== 'pending') {
    throw ApiError.badRequest('Order is not pending');
  }

  if (order.tableName === 'recharge_orders' && order.expireTime && order.expireTime < new Date()) {
    await markRechargeOrderExpired(order);
    throw ApiError.badRequest('Order has expired');
  }

  if (order.amount <= 0) {
    throw ApiError.badRequest('Order amount must be greater than zero');
  }
}

export async function processPaymentSuccess(
  orderNo: string,
  provider: PaymentProvider,
  payload: PaymentProcessPayload
): Promise<PaymentOrder | null> {
  return db.transaction(async (connection) => {
    const [rechargeRows] = await connection.execute(
      `SELECT id, order_no, user_id, amount, points, COALESCE(bonus_points, 0) AS bonus_points,
              product_name, status, pay_method, pay_time, expire_time, created_at,
              provider_transaction_id, provider_status
       FROM recharge_orders
       WHERE order_no = ?
       LIMIT 1
       FOR UPDATE`,
      [orderNo]
    );

    if ((rechargeRows as RowDataPacket[]).length > 0) {
      const order = mapRechargeOrder((rechargeRows as RowDataPacket[])[0]);
      if (order.status === 'paid') {
        return order;
      }

      return markRechargeOrderAsPaid(connection, order, provider, payload);
    }

    const [legacyRows] = await connection.execute(
      `SELECT o.id, o.order_no, o.user_id, o.amount, o.points,
              COALESCE(rp.bonus_points, 0) AS bonus_points,
              COALESCE(o.package_name, rp.name, 'Recharge Order') AS product_name,
              COALESCE(NULLIF(o.duration, 0), rp.duration, 0) AS duration,
              COALESCE(NULLIF(o.duration_unit, ''), rp.duration_unit, 'day') AS duration_unit,
              o.status, o.pay_method, o.paid_at AS pay_time, o.created_at, o.package_id,
              o.provider_transaction_id, o.provider_status
       FROM orders o
       LEFT JOIN recharge_packages rp ON rp.id = o.package_id
       WHERE o.order_no = ?
       LIMIT 1
       FOR UPDATE`,
      [orderNo]
    );

    if ((legacyRows as RowDataPacket[]).length === 0) {
      return null;
    }

    const order = mapLegacyOrder((legacyRows as RowDataPacket[])[0]);
    if (order.status === 'paid') {
      return order;
    }

    return markLegacyOrderAsPaid(connection, order, provider, payload);
  });
}
