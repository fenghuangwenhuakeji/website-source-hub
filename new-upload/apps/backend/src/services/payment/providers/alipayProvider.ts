import { AlipaySdk } from 'alipay-sdk';
import { config } from '../../../config/index.js';
import { ApiError } from '../../../middleware/errorHandler.js';
import { ensureAlipayConfig, getAlipayConfigMode, safeJsonStringify } from '../common.js';
import type {
  AlipayTradeQueryResult,
  GatewayIssueResult,
  PaymentOrder,
} from '../types.js';

let alipaySdkInstance: AlipaySdk | null = null;

function readAlipayField<T = unknown>(payload: Record<string, any>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
      return payload[key] as T;
    }
  }

  return undefined;
}

function getAlipaySdk(): AlipaySdk {
  ensureAlipayConfig();

  if (!alipaySdkInstance) {
    const mode = getAlipayConfigMode();
    const sdkConfig =
      mode === 'cert'
        ? {
            appId: config.alipay.appId,
            privateKey: config.alipay.privateKey,
            appCertContent: config.alipay.appCert,
            alipayRootCertContent: config.alipay.rootCert,
            alipayPublicCertContent: config.alipay.publicCert,
          }
        : {
            appId: config.alipay.appId,
            privateKey: config.alipay.privateKey,
            alipayPublicKey: config.alipay.alipayPublicKey,
          };

    alipaySdkInstance = new AlipaySdk(sdkConfig);
  }

  return alipaySdkInstance;
}

function extractAlipayErrorMessage(error: any, fallback: string): string {
  const raw = error?.responseDataRaw;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      const payload =
        parsed.error_response ||
        parsed.alipay_trade_precreate_response ||
        parsed.alipay_trade_query_response ||
        parsed;
      const detail = payload?.sub_msg || payload?.msg;
      if (detail) {
        return String(detail);
      }
    } catch {
      return raw;
    }
  }

  return error?.message || fallback;
}

export async function createAlipayPrecreate(order: PaymentOrder): Promise<GatewayIssueResult> {
  try {
    const sdk = getAlipaySdk();
    const result = (await sdk.exec('alipay.trade.precreate', {
      notify_url: config.alipay.callbackUrl,
      bizContent: {
        out_trade_no: order.orderNo,
        total_amount: order.amount.toFixed(2),
        subject: order.productName,
        product_code: 'FACE_TO_FACE_PAYMENT',
        timeout_express: '30m',
      },
    })) as {
      code?: string;
      msg?: string;
      sub_msg?: string;
      qr_code?: string;
      qrCode?: string;
    };

    const qrCode = readAlipayField<string>(result, 'qr_code', 'qrCode');
    if (result.code !== '10000' || !qrCode) {
      const detail = result.sub_msg || result.msg || 'Alipay precreate failed';
      throw ApiError.internal(detail);
    }

    return {
      qrCode: String(qrCode),
      paymentScene: 'FACE_TO_FACE_PAYMENT',
      responsePayload: safeJsonStringify(result),
    };
  } catch (error) {
    throw ApiError.internal(extractAlipayErrorMessage(error, 'Alipay precreate failed'));
  }
}

export async function queryAlipayTransaction(orderNo: string): Promise<AlipayTradeQueryResult> {
  try {
    const sdk = getAlipaySdk();
    return (await sdk.exec('alipay.trade.query', {
      bizContent: {
        out_trade_no: orderNo,
      },
    })) as AlipayTradeQueryResult;
  } catch (error) {
    throw ApiError.internal(extractAlipayErrorMessage(error, 'Alipay trade query failed'));
  }
}

export function verifyAlipayNotification(body: Record<string, any>): boolean {
  const sdk = getAlipaySdk();
  return sdk.checkNotifySignV2(body);
}
