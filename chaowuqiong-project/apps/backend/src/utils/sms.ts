import axios from 'axios';
import crypto from 'crypto';
import { config } from '../config/index.js';

const VOLCENGINE_HOST = 'sms.volcengineapi.com';
const VOLCENGINE_REGION = 'cn-north-1';
const VOLCENGINE_SERVICE = 'volcSMS';
const VOLCENGINE_ACTION = 'SendSms';
const VOLCENGINE_VERSION = '2020-01-01';
const CONTENT_TYPE = 'application/json;charset=utf-8';

function sha256Hex(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function hmacSha256(key: crypto.BinaryLike, content: string): Buffer {
  return crypto.createHmac('sha256', key).update(content, 'utf8').digest();
}

function getXDate(): { longDate: string; shortDate: string } {
  const iso = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const longDate = iso.replace(/[-:]/g, '').replace('.000', '');

  return {
    longDate,
    shortDate: longDate.slice(0, 8),
  };
}

function buildAuthorization(body: string, accessKeyId: string, secretKey: string) {
  const query = `Action=${VOLCENGINE_ACTION}&Version=${VOLCENGINE_VERSION}`;
  const payloadHash = sha256Hex(body);
  const { longDate, shortDate } = getXDate();
  const signedHeaders = 'content-type;host;x-content-sha256;x-date';
  const canonicalHeaders =
    `content-type:${CONTENT_TYPE}\n` +
    `host:${VOLCENGINE_HOST}\n` +
    `x-content-sha256:${payloadHash}\n` +
    `x-date:${longDate}\n`;

  const canonicalRequest = ['POST', '/', query, canonicalHeaders, signedHeaders, payloadHash].join(
    '\n',
  );
  const credentialScope = `${shortDate}/${VOLCENGINE_REGION}/${VOLCENGINE_SERVICE}/request`;
  const stringToSign = ['HMAC-SHA256', longDate, credentialScope, sha256Hex(canonicalRequest)].join(
    '\n',
  );

  const kDate = hmacSha256(secretKey, shortDate);
  const kRegion = hmacSha256(kDate, VOLCENGINE_REGION);
  const kService = hmacSha256(kRegion, VOLCENGINE_SERVICE);
  const kSigning = hmacSha256(kService, 'request');
  const signature = crypto
    .createHmac('sha256', kSigning)
    .update(stringToSign, 'utf8')
    .digest('hex');

  return {
    authorization: `HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    xDate: longDate,
    payloadHash,
  };
}

function normalizeVolcengineSmsErrorMessage(message: string): string {
  if (
    message.includes('子账号不存在') ||
    message.includes('SmsAccount') ||
    message.includes('瀛愯处鍙蜂笉瀛樺湪')
  ) {
    return 'SMS provider config is invalid: VOLCENGINE_SMS_ACCOUNT must be the SmsAccount message group ID from Volcengine SMS, not an account ID.';
  }

  if (message.includes('签名错误') || message.includes('签名') || message.includes('绛惧悕')) {
    return 'SMS provider config is invalid: VOLCENGINE_SMS_SIGN is not available under the current SmsAccount or has not been approved.';
  }

  if (message.includes('模板错误') || message.includes('模板') || message.includes('妯℃澘')) {
    return 'SMS provider config is invalid: VOLCENGINE_SMS_TEMPLATE_ID is not available under the current SmsAccount or has not been approved.';
  }

  if (message.includes('短信服务未开通') || message.includes('鐭俊鏈嶅姟鏈紑閫')) {
    return 'SMS provider config is invalid: the current Volcengine AccessKey has not enabled SMS service.';
  }

  return message;
}

export async function sendVerificationCode(
  phoneNumber: string,
  code: string,
): Promise<{ success: boolean; message: string }> {
  try {
    if (config.database.adapter === 'sqlite') {
      return {
        success: true,
        message: `Development SMS mocked for ${phoneNumber}: ${code}`,
      };
    }

    const accessKeyId = config.volcengine.accessKeyId;
    const secretKey = config.volcengine.secretKey;
    const smsAccount = config.volcengine.smsAccount;
    const smsSign = config.volcengine.smsSign;
    const templateId = config.volcengine.smsTemplateId;

    if (!accessKeyId || !secretKey || !smsAccount || !smsSign || !templateId) {
      return {
        success: false,
        message:
          'SMS production config is incomplete: fill VOLCENGINE_ACCESS_KEY_ID, VOLCENGINE_SECRET_KEY, VOLCENGINE_SMS_ACCOUNT, VOLCENGINE_SMS_SIGN, and VOLCENGINE_SMS_TEMPLATE_ID.',
      };
    }

    const requestBody = JSON.stringify({
      SmsAccount: smsAccount,
      Sign: smsSign,
      TemplateID: templateId,
      PhoneNumbers: phoneNumber,
      TemplateParam: JSON.stringify({ code }),
      Tag: 'login',
    });

    const { authorization, xDate, payloadHash } = buildAuthorization(
      requestBody,
      accessKeyId,
      secretKey,
    );

    const response = await axios.post(
      `https://${VOLCENGINE_HOST}/?Action=${VOLCENGINE_ACTION}&Version=${VOLCENGINE_VERSION}`,
      requestBody,
      {
        timeout: 10000,
        headers: {
          Authorization: authorization,
          'Content-Type': CONTENT_TYPE,
          Host: VOLCENGINE_HOST,
          'X-Date': xDate,
          'X-Content-Sha256': payloadHash,
        },
      },
    );

    const providerMessage = response.data?.ResponseMetadata?.Error?.Message;
    if (providerMessage) {
      return {
        success: false,
        message: normalizeVolcengineSmsErrorMessage(providerMessage),
      };
    }

    return {
      success: true,
      message: 'Verification code sent successfully.',
    };
  } catch (error: any) {
    const providerMessage =
      error?.response?.data?.ResponseMetadata?.Error?.Message ||
      error?.message ||
      'SMS send failed';

    return {
      success: false,
      message: normalizeVolcengineSmsErrorMessage(providerMessage),
    };
  }
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function isValidPhoneNumber(phoneNumber: string): boolean {
  return /^1[3-9]\d{9}$/.test(phoneNumber);
}
