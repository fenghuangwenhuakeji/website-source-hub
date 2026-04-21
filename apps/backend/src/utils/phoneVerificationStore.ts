type VerificationPurpose = 'login' | 'register' | 'password_reset' | 'bind_phone';

type VerificationRecord = {
  code: string;
  purpose: VerificationPurpose;
  createdAt: Date;
  expiresAt: Date;
};

const verificationStore = new Map<string, VerificationRecord>();

const DEFAULT_TTL_MS = 5 * 60 * 1000;
const DEFAULT_COOLDOWN_MS = 60 * 1000;

function buildKey(phoneNumber: string, purpose: VerificationPurpose): string {
  return `${purpose}:${phoneNumber}`;
}

function getRecord(phoneNumber: string, purpose: VerificationPurpose): VerificationRecord | null {
  const key = buildKey(phoneNumber, purpose);
  const record = verificationStore.get(key);
  if (!record) {
    return null;
  }

  if (Date.now() > record.expiresAt.getTime()) {
    verificationStore.delete(key);
    return null;
  }

  return record;
}

export function canSendPhoneVerificationCode(
  phoneNumber: string,
  purpose: VerificationPurpose,
  cooldownMs = DEFAULT_COOLDOWN_MS,
): { allowed: boolean; retryAfterSeconds: number } {
  const record = getRecord(phoneNumber, purpose);
  if (!record) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const elapsedMs = Date.now() - record.createdAt.getTime();
  if (elapsedMs >= cooldownMs) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.ceil((cooldownMs - elapsedMs) / 1000),
  };
}

export function createPhoneVerificationCode(
  phoneNumber: string,
  purpose: VerificationPurpose,
  code: string,
  ttlMs = DEFAULT_TTL_MS,
): void {
  verificationStore.set(buildKey(phoneNumber, purpose), {
    code,
    purpose,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + ttlMs),
  });
}

export function consumePhoneVerificationCode(
  phoneNumber: string,
  purpose: VerificationPurpose,
  code: string,
): { success: boolean; message?: string } {
  const key = buildKey(phoneNumber, purpose);
  const record = getRecord(phoneNumber, purpose);

  if (!record) {
    return {
      success: false,
      message: '验证码已过期，请重新获取。',
    };
  }

  if (record.code !== code) {
    return {
      success: false,
      message: '验证码错误。',
    };
  }

  verificationStore.delete(key);
  return { success: true };
}

export function peekPhoneVerificationCode(
  phoneNumber: string,
  purpose: VerificationPurpose,
): VerificationRecord | null {
  return getRecord(phoneNumber, purpose);
}

export type { VerificationPurpose };
