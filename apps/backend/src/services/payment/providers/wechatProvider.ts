import crypto from 'node:crypto';
import axios from 'axios';
import { config } from '../../../config/index.js';
import { ApiError } from '../../../middleware/errorHandler.js';
import {
  ensureWechatConfig,
  extractAxiosErrorMessage,
  getHeaderString,
  getWechatPayAppId,
  randomNonce,
  safeJsonStringify,
  toFen,
} from '../common.js';
import type {
  GatewayIssueResult,
  PaymentOrder,
  WechatNotificationPayload,
  WechatNotificationResource,
  WechatTransactionData,
} from '../types.js';

function buildWechatAuthorization(method: string, urlPath: string, body: string): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = randomNonce();
  const message = `${method}\n${urlPath}\n${timestamp}\n${nonceStr}\n${body}\n`;
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(message, 'utf8')
    .sign(config.wechat.privateKey, 'base64');

  const params = [
    `mchid="${config.wechat.mchId}"`,
    `nonce_str="${nonceStr}"`,
    `timestamp="${timestamp}"`,
    `serial_no="${config.wechat.serialNo}"`,
    `signature="${signature}"`,
  ].join(',');

  return `WECHATPAY2-SHA256-RSA2048 ${params}`;
}

function buildWechatSignatureMessage(timestamp: string, nonce: string, body: string): string {
  return `${timestamp}\n${nonce}\n${body}\n`;
}

function verifyWechatSignature(message: string, signature: string): boolean {
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(message, 'utf8');
  return verifier.verify(config.wechat.payPublicKey, signature, 'base64');
}

function verifyWechatResponseSignature(
  headers: Record<string, any>,
  responseBody: string
): void {
  const serial = getHeaderString(headers['wechatpay-serial']);
  const signature = getHeaderString(headers['wechatpay-signature']);
  const timestamp = getHeaderString(headers['wechatpay-timestamp']);
  const nonce = getHeaderString(headers['wechatpay-nonce']);

  if (!serial || !signature || !timestamp || !nonce) {
    throw ApiError.internal('WeChat Pay response signature headers are missing');
  }

  if (
    config.wechat.payPublicKeyId &&
    serial.startsWith('PUB_KEY_ID_') &&
    serial !== config.wechat.payPublicKeyId
  ) {
    throw ApiError.internal('WeChat Pay response serial does not match current public key id');
  }

  const signMessage = buildWechatSignatureMessage(timestamp, nonce, responseBody);
  if (!verifyWechatSignature(signMessage, signature)) {
    throw ApiError.internal('WeChat Pay response signature verification failed');
  }
}

function decryptWechatResource(resource: WechatNotificationResource): WechatTransactionData {
  if (resource.algorithm !== 'AEAD_AES_256_GCM') {
    throw ApiError.badRequest('Unsupported WeChat callback encryption algorithm');
  }

  const apiV3Key = Buffer.from(config.wechat.apiV3Key, 'utf8');
  if (apiV3Key.length !== 32) {
    throw ApiError.internal('WeChat Pay APIv3 key must be exactly 32 bytes');
  }

  const ciphertext = Buffer.from(resource.ciphertext, 'base64');
  const authTag = ciphertext.subarray(ciphertext.length - 16);
  const encryptedData = ciphertext.subarray(0, ciphertext.length - 16);
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    apiV3Key,
    Buffer.from(resource.nonce, 'utf8')
  );

  if (resource.associated_data) {
    decipher.setAAD(Buffer.from(resource.associated_data, 'utf8'));
  }
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]).toString('utf8');

  return JSON.parse(plaintext) as WechatTransactionData;
}

export function isWechatSignatureTest(headers: Record<string, any>): boolean {
  const signature = getHeaderString(headers['wechatpay-signature']);
  return signature.startsWith('WECHATPAY/SIGNTEST/');
}

export function verifyAndParseWechatCallback(params: {
  headers: Record<string, any>;
  rawBody: string;
  body: unknown;
}): {
  callbackPayload: WechatNotificationPayload;
  decrypted: WechatTransactionData;
} {
  ensureWechatConfig();

  const signature = getHeaderString(params.headers['wechatpay-signature']);
  const timestamp = getHeaderString(params.headers['wechatpay-timestamp']);
  const nonce = getHeaderString(params.headers['wechatpay-nonce']);
  const serial = getHeaderString(params.headers['wechatpay-serial']);

  if (!signature || !timestamp || !nonce || !serial) {
    throw ApiError.badRequest('Missing signature headers');
  }

  if (
    config.wechat.payPublicKeyId &&
    serial.startsWith('PUB_KEY_ID_') &&
    serial !== config.wechat.payPublicKeyId
  ) {
    throw ApiError.badRequest('Unexpected WeChat serial');
  }

  const signMessage = buildWechatSignatureMessage(timestamp, nonce, params.rawBody);
  if (!verifyWechatSignature(signMessage, signature)) {
    throw ApiError.unauthorized('Invalid signature');
  }

  const callbackPayload =
    typeof params.body === 'object' && params.body !== null
      ? (params.body as WechatNotificationPayload)
      : (JSON.parse(params.rawBody) as WechatNotificationPayload);

  const decrypted = decryptWechatResource(callbackPayload.resource);
  const resolvedAppId = getWechatPayAppId();
  if (resolvedAppId && decrypted.appid && decrypted.appid !== resolvedAppId) {
    throw ApiError.badRequest('AppId mismatch');
  }
  if (decrypted.mchid && decrypted.mchid !== config.wechat.mchId) {
    throw ApiError.badRequest('MchId mismatch');
  }

  return {
    callbackPayload,
    decrypted,
  };
}

export async function createWechatNativeOrder(order: PaymentOrder): Promise<GatewayIssueResult> {
  ensureWechatConfig();

  const path = '/v3/pay/transactions/native';
  const appId = getWechatPayAppId();
  const requestBodyObject: Record<string, any> = {
    mchid: config.wechat.mchId,
    description: order.productName,
    out_trade_no: order.orderNo,
    notify_url: config.wechat.callbackUrl,
    attach: `${order.tableName}:${order.id}`,
    amount: {
      total: toFen(order.amount),
      currency: 'CNY',
    },
  };

  if (appId) {
    requestBodyObject.appid = appId;
  }

  const requestBody = JSON.stringify(requestBodyObject);
  const headers: Record<string, string> = {
    Authorization: buildWechatAuthorization('POST', path, requestBody),
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'chaowuqiong-backend/1.0',
  };

  if (config.wechat.payPublicKeyId) {
    headers['Wechatpay-Serial'] = config.wechat.payPublicKeyId;
  }

  try {
    const response = await axios.post<string>(
      `https://api.mch.weixin.qq.com${path}`,
      requestBody,
      {
        headers,
        timeout: 30000,
        transformResponse: [(value) => value],
      }
    );

    const rawResponse = String(response.data || '');
    verifyWechatResponseSignature(response.headers as Record<string, any>, rawResponse);
    const parsed = JSON.parse(rawResponse) as { code_url?: string };

    if (!parsed.code_url) {
      throw ApiError.internal('WeChat Native order did not return code_url');
    }

    return {
      qrCode: parsed.code_url,
      paymentScene: 'NATIVE',
      responsePayload: rawResponse,
    };
  } catch (error: any) {
    throw ApiError.internal(`WeChat Native order failed: ${extractAxiosErrorMessage(error)}`);
  }
}

export async function queryWechatTransaction(orderNo: string): Promise<Record<string, any>> {
  ensureWechatConfig();

  const path = `/v3/pay/transactions/out-trade-no/${encodeURIComponent(orderNo)}?mchid=${encodeURIComponent(
    config.wechat.mchId
  )}`;
  const headers: Record<string, string> = {
    Authorization: buildWechatAuthorization('GET', path, ''),
    Accept: 'application/json',
    'User-Agent': 'chaowuqiong-backend/1.0',
  };

  if (config.wechat.payPublicKeyId) {
    headers['Wechatpay-Serial'] = config.wechat.payPublicKeyId;
  }

  const response = await axios.get<string>(`https://api.mch.weixin.qq.com${path}`, {
    headers,
    timeout: 30000,
    transformResponse: [(value) => value],
  });

  const rawResponse = String(response.data || '');
  verifyWechatResponseSignature(response.headers as Record<string, any>, rawResponse);
  return JSON.parse(rawResponse) as Record<string, any>;
}

export function serializeWechatPayload(payload: unknown): string {
  return safeJsonStringify(payload);
}
