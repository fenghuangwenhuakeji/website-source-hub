import type { Request } from 'express';
import { getDatabaseAdapter } from '../../config/database.js';
import { config } from '../../config/index.js';
import { ApiError } from '../../middleware/errorHandler.js';
import {
  buildStatusResponse,
  hasAlipayCertConfig,
  hasAlipayConfig,
  hasWechatConfig,
  parseAlipayDate,
  safeJsonStringify,
  toDate,
  toNumber,
} from './common.js';
import {
  ensureOrderPayable,
  findPaymentOrder,
  markRechargeOrderExpired,
  persistIssueResult,
  processPaymentSuccess,
  updateOrderPayMethod,
  updateProviderState,
} from './orderStore.js';
import {
  createAlipayPrecreate,
  queryAlipayTransaction,
  verifyAlipayNotification,
} from './providers/alipayProvider.js';
import {
  createWechatNativeOrder,
  isWechatSignatureTest,
  queryWechatTransaction,
  serializeWechatPayload,
  verifyAndParseWechatCallback,
} from './providers/wechatProvider.js';
import type {
  GatewayIssueResult,
  PaymentCallbackResponse,
  PaymentOrder,
  PaymentProvider,
} from './types.js';

function readAlipayField<T = unknown>(payload: Record<string, any>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
      return payload[key] as T;
    }
  }

  return undefined;
}

function normalizePayMethod(value: unknown): PaymentProvider {
  if (value === 'wechat' || value === 'alipay') {
    return value;
  }

  throw ApiError.badRequest('Unsupported payment method');
}

function buildLocalDevPaymentUrl(orderNo: string, payMethod: PaymentProvider): string {
  const params = new URLSearchParams({
    method: payMethod,
  });
  return `http://127.0.0.1:${config.port}/api/payment/mock-confirm/${encodeURIComponent(orderNo)}?${params.toString()}`;
}

async function issuePaymentCode(
  order: PaymentOrder,
  payMethod: PaymentProvider
): Promise<GatewayIssueResult> {
  if (getDatabaseAdapter() === 'sqlite') {
    const result: GatewayIssueResult = {
      qrCode: buildLocalDevPaymentUrl(order.orderNo, payMethod),
      paymentScene: 'LOCAL_DEV',
      responsePayload: safeJsonStringify({
        mock: true,
        provider: payMethod,
        orderNo: order.orderNo,
      }),
    };

    await persistIssueResult(order, payMethod, result);
    return result;
  }

  const result =
    payMethod === 'wechat'
      ? await createWechatNativeOrder(order)
      : await createAlipayPrecreate(order);

  await persistIssueResult(order, payMethod, result);
  return result;
}

async function syncPendingOrderStatus(order: PaymentOrder): Promise<PaymentOrder> {
  if (order.status !== 'pending') {
    return order;
  }

  if (order.tableName === 'recharge_orders' && order.expireTime && order.expireTime < new Date()) {
    await markRechargeOrderExpired(order);
    const expiredOrder = await findPaymentOrder({ orderNo: order.orderNo });
    return expiredOrder || order;
  }

  if (order.payMethod === 'wechat' && hasWechatConfig()) {
    try {
      const remote = await queryWechatTransaction(order.orderNo);
      await updateProviderState(
        order,
        String(remote.trade_state || 'UNKNOWN'),
        safeJsonStringify(remote)
      );

      if (remote.trade_state === 'SUCCESS') {
        await processPaymentSuccess(order.orderNo, 'wechat', {
          providerTransactionId: String(remote.transaction_id),
          providerBuyerId: remote.payer?.openid ? String(remote.payer.openid) : null,
          providerStatus: String(remote.trade_state),
          paymentScene: String(remote.trade_type || 'NATIVE'),
          paidAmount: toNumber(remote.amount?.payer_total ?? remote.amount?.total) / 100,
          currency: remote.amount?.currency ? String(remote.amount.currency) : 'CNY',
          paidAt: toDate(remote.success_time),
          responsePayload: safeJsonStringify(remote),
        });
      }
    } catch {
      // Keep local status when remote query is temporarily unavailable.
    }
  }

  if (order.payMethod === 'alipay' && hasAlipayConfig()) {
    try {
      const remote = await queryAlipayTransaction(order.orderNo);
      const tradeStatus = String(
        readAlipayField(remote as Record<string, any>, 'trade_status', 'tradeStatus', 'code') || 'UNKNOWN',
      );
      await updateProviderState(
        order,
        tradeStatus,
        safeJsonStringify(remote)
      );

      if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
        await processPaymentSuccess(order.orderNo, 'alipay', {
          providerTransactionId: String(
            readAlipayField(remote as Record<string, any>, 'trade_no', 'tradeNo') || '',
          ),
          providerBuyerId: readAlipayField(remote as Record<string, any>, 'buyer_user_id', 'buyerUserId')
            ? String(readAlipayField(remote as Record<string, any>, 'buyer_user_id', 'buyerUserId'))
            : null,
          providerStatus: tradeStatus,
          paymentScene: 'FACE_TO_FACE_PAYMENT',
          paidAmount: toNumber(
            readAlipayField(
              remote as Record<string, any>,
              'receipt_amount',
              'receiptAmount',
              'total_amount',
              'totalAmount',
            ),
          ),
          currency: 'CNY',
          paidAt: parseAlipayDate(
            readAlipayField(remote as Record<string, any>, 'send_pay_date', 'sendPayDate') || null,
          ),
          responsePayload: safeJsonStringify(remote),
        });
      }
    } catch {
      // Keep local status when remote query is temporarily unavailable.
    }
  }

  return (await findPaymentOrder({ orderNo: order.orderNo })) || order;
}

export function getPaymentConfig() {
  if (getDatabaseAdapter() === 'sqlite') {
    return {
      wechat: {
        enabled: true,
        mode: 'local-dev',
      },
      alipay: {
        enabled: true,
        mode: 'local-dev',
      },
    };
  }

  return {
    wechat: {
      enabled: hasWechatConfig(),
      mode: 'native-v3',
    },
    alipay: {
      enabled: hasAlipayConfig(),
      mode: hasAlipayCertConfig() ? 'precreate-cert' : 'precreate-key',
    },
  };
}

export async function createPaymentCode(params: {
  orderId?: string;
  orderNo?: string;
  payMethod?: unknown;
}): Promise<{
  order: PaymentOrder;
  issued: GatewayIssueResult;
}> {
  const payMethod = normalizePayMethod(params.payMethod);
  const order = await findPaymentOrder({
    orderId: params.orderId,
    orderNo: params.orderNo,
  });

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  await ensureOrderPayable(order);

  if (order.payMethod !== payMethod) {
    await updateOrderPayMethod(order, payMethod);
    order.payMethod = payMethod;
  }

  const issued = await issuePaymentCode(order, payMethod);
  return {
    order,
    issued,
  };
}

export async function getOrderStatus(orderNo: string): Promise<PaymentOrder> {
  const order = await findPaymentOrder({ orderNo });
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  return syncPendingOrderStatus(order);
}

export async function confirmLocalPayment(params: {
  orderNo: string;
  payMethod?: unknown;
}): Promise<PaymentOrder> {
  if (getDatabaseAdapter() !== 'sqlite') {
    throw ApiError.notFound('Mock payment confirmation is only available in local dev mode');
  }

  const order = await findPaymentOrder({ orderNo: params.orderNo });
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  const payMethod = params.payMethod
    ? normalizePayMethod(params.payMethod)
    : normalizePayMethod(order.payMethod);
  await ensureOrderPayable(order);

  if (order.payMethod !== payMethod) {
    await updateOrderPayMethod(order, payMethod);
  }

  const processed = await processPaymentSuccess(order.orderNo, payMethod, {
    providerTransactionId: `local-${payMethod}-${order.orderNo}`,
    providerStatus: 'SUCCESS',
    paymentScene: 'LOCAL_DEV',
    paidAmount: order.amount,
    currency: 'CNY',
    paidAt: new Date(),
    responsePayload: safeJsonStringify({
      mock: true,
      provider: payMethod,
      orderNo: order.orderNo,
      confirmedAt: new Date().toISOString(),
    }),
  });

  if (!processed) {
    throw ApiError.internal('Local payment confirmation failed');
  }

  return processed;
}

export async function getWechatRemoteStatus(orderNo: string): Promise<Record<string, any>> {
  return queryWechatTransaction(orderNo);
}

export async function getAlipayRemoteStatus(orderNo: string) {
  return queryAlipayTransaction(orderNo);
}

export async function handleWechatCallback(req: Request): Promise<PaymentCallbackResponse> {
  try {
    const rawBody =
      typeof (req as any).rawBody === 'string'
        ? (req as any).rawBody
        : safeJsonStringify(req.body || {});

    if (isWechatSignatureTest(req.headers as Record<string, any>)) {
      return {
        statusCode: 200,
        end: true,
      };
    }

    const { callbackPayload, decrypted } = verifyAndParseWechatCallback({
      headers: req.headers as Record<string, any>,
      rawBody,
      body: req.body,
    });

    if (callbackPayload.event_type !== 'TRANSACTION.SUCCESS') {
      return {
        statusCode: 200,
        end: true,
      };
    }

    const processed = await processPaymentSuccess(decrypted.out_trade_no, 'wechat', {
      providerTransactionId: decrypted.transaction_id,
      providerBuyerId: decrypted.payer?.openid || null,
      providerStatus: decrypted.trade_state || callbackPayload.event_type,
      paymentScene: decrypted.trade_type || 'NATIVE',
      paidAmount: toNumber(decrypted.amount?.payer_total ?? decrypted.amount?.total) / 100,
      currency: decrypted.amount?.currency || 'CNY',
      paidAt: toDate(decrypted.success_time),
      notifyTime: toDate(callbackPayload.create_time) || new Date(),
      notifyPayload: rawBody,
      responsePayload: serializeWechatPayload(decrypted),
    });

    if (!processed) {
      return {
        statusCode: 500,
        json: {
          code: 'FAIL',
          message: 'Order processing failed',
        },
      };
    }

    return {
      statusCode: 200,
      end: true,
    };
  } catch (error: any) {
    console.error('WeChat callback error:', error);
    return {
      statusCode: error instanceof ApiError ? error.statusCode : 500,
      json: {
        code: 'FAIL',
        message: error?.message || 'Callback handling failed',
      },
    };
  }
}

export async function handleAlipayCallback(
  body: Record<string, any>
): Promise<PaymentCallbackResponse> {
  try {
    if (!verifyAlipayNotification(body)) {
      return {
        statusCode: 400,
        text: 'fail',
      };
    }

    const tradeStatus = String(body.trade_status || '');
    if (tradeStatus !== 'TRADE_SUCCESS' && tradeStatus !== 'TRADE_FINISHED') {
      return {
        statusCode: 200,
        text: 'success',
      };
    }

    const outTradeNo = String(body.out_trade_no || '');
    if (!outTradeNo) {
      return {
        statusCode: 400,
        text: 'fail',
      };
    }

    const processed = await processPaymentSuccess(outTradeNo, 'alipay', {
      providerTransactionId: String(body.trade_no || ''),
      providerBuyerId: body.buyer_id ? String(body.buyer_id) : null,
      providerStatus: tradeStatus,
      paymentScene: 'FACE_TO_FACE_PAYMENT',
      paidAmount: toNumber(body.receipt_amount || body.total_amount),
      currency: 'CNY',
      paidAt: parseAlipayDate(body.gmt_payment || body.send_pay_date),
      notifyTime: new Date(),
      notifyPayload: safeJsonStringify(body),
      responsePayload: safeJsonStringify(body),
    });

    if (!processed) {
      return {
        statusCode: 500,
        text: 'fail',
      };
    }

    return {
      statusCode: 200,
      text: 'success',
    };
  } catch (error) {
    console.error('Alipay callback error:', error);
    return {
      statusCode: 500,
      text: 'fail',
    };
  }
}

export function formatOrderStatus(order: PaymentOrder) {
  return buildStatusResponse(order);
}
