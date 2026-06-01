import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { config } from '../config/index.js';
import {
  authMiddleware,
  generateRefreshToken,
  generateToken,
  verifyToken,
  AuthRequest,
} from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { getDurationAccessStatus } from '../utils/durationAccess.js';
import {
  DEFAULT_LICENSE_PRODUCT_ID,
  ensureTrialForUserProduct,
  getProductAccessStatus,
} from '../utils/licenseCenter.js';
import {
  applyReferralBindingRewards,
  getDiamondAccountSummary,
  getUserPayoutProfile,
  saveUserPayoutProfile,
} from '../utils/referralProgram.js';
import {
  canSendPhoneVerificationCode,
  consumePhoneVerificationCode,
  createPhoneVerificationCode,
} from '../utils/phoneVerificationStore.js';
import {
  generateVerificationCode,
  isValidPhoneNumber,
  sendVerificationCode,
} from '../utils/sms.js';
import { requireSupportedDesktopVersion } from '../utils/appVersion.js';

const router = Router();

type UserRow = Record<string, any>;

interface RegisterBody {
  username: string;
  password: string;
  email?: string;
  nickname?: string;
  referralCode?: string;
  phone?: string;
  phoneCode?: string;
  wechatOpenid?: string;
  wechatUnionid?: string;
}

interface LoginBody {
  username: string;
  password: string;
}

interface ForgotPasswordRequestBody {
  phoneNumber: string;
  account?: string;
}

interface ForgotPasswordResetBody {
  phoneNumber: string;
  code: string;
  newPassword: string;
}

interface PhoneCodeBody {
  phone?: string;
  phoneNumber?: string;
}

interface PhoneLoginBody {
  phone?: string;
  phoneNumber?: string;
  code: string;
  inviteCode?: string;
}

interface ChangePasswordBody {
  currentPassword?: string;
  newPassword: string;
}

interface BindPhoneBody {
  phoneNumber: string;
  code: string;
}

interface PayoutProfileBody {
  realName: string;
  payoutMethod: 'wechat' | 'alipay';
  payoutAccount: string;
  identityNo?: string;
  phone?: string;
  note?: string;
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'CW';

  for (let i = 0; i < 6; i += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}

function ensurePasswordValid(password: string): void {
  if (!password || password.length < 6) {
    throw ApiError.badRequest('Password must be at least 6 characters.');
  }
}

function ensureUsernameValid(username: string): void {
  if (!username) {
    throw ApiError.badRequest('Username is required.');
  }

  if (username.length < 3 || username.length > 50) {
    throw ApiError.badRequest('Username length must be between 3 and 50 characters.');
  }
}

function buildBindingStatus(user: UserRow) {
  const phoneBound = Boolean(user.phone);
  const phoneVerified = Boolean(user.phone_verified_at || user.phone);
  const wechatBound = Boolean(user.wechat_openid);

  return {
    phoneBound,
    phoneVerified,
    phoneVerifiedAt: user.phone_verified_at || null,
    wechatBound,
    wechatBoundAt: user.wechat_bound_at || null,
    mustBindContact: Boolean(user.must_bind_contact),
  };
}

function createAuthPayload(user: UserRow) {
  const isAdmin = ['admin', 'rootadmin', 'super_admin'].includes(String(user.role || '').toLowerCase());
  return {
    userId: String(user.id),
    username: user.username,
    nickname: user.nickname,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar_url,
    role: user.role,
    isAdmin,
    is_admin: isAdmin,
    points: Number(user.points || 0),
    referralCode: user.referral_code || null,
    bindingStatus: buildBindingStatus(user),
    hasPassword: Boolean(user.password_hash),
    mustSetPassword: !user.password_hash,
  };
}

async function findUserByAccount(account: string): Promise<UserRow | null> {
  const users = await db.query<UserRow[]>(
    `SELECT *
     FROM users
     WHERE username = ?
        OR phone = ?
        OR (email = ? AND email IS NOT NULL)
     LIMIT 1`,
    [account, account, account],
  );

  return users[0] || null;
}

async function bindReferralIfNeeded(userId: string, referralCode?: string): Promise<string | null> {
  if (!referralCode) {
    return null;
  }

  const referrers = await db.query<UserRow[]>(
    'SELECT id, username FROM users WHERE referral_code = ? LIMIT 1',
    [referralCode],
  );

  if (referrers.length === 0) {
    return null;
  }

  const referrer = referrers[0];
  if (referrer.id === userId) {
    return null;
  }

  await db.execute('UPDATE users SET referred_by = ? WHERE id = ?', [referrer.id, userId]);
  await applyReferralBindingRewards(referrer.id, userId);
  return referrer.username || null;
}

async function fetchUserById(userId: string): Promise<UserRow> {
  const users = await db.query<UserRow[]>('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);

  if (users.length === 0) {
    throw ApiError.notFound('User not found.');
  }

  return users[0];
}

async function handlePhoneLogin(phoneNumber: string, code: string, inviteCode?: string) {
  if (!isValidPhoneNumber(phoneNumber)) {
    throw ApiError.badRequest('Invalid phone number format.');
  }

  const verification = consumePhoneVerificationCode(phoneNumber, 'login', code);
  if (!verification.success) {
    throw ApiError.badRequest(verification.message || 'Invalid verification code.');
  }

  const users = await db.query<UserRow[]>('SELECT * FROM users WHERE phone = ? LIMIT 1', [phoneNumber]);
  let user = users[0];
  const isNewUser = !user;

  if (!user) {
    const userId = uuidv4();
    const username = `user_${phoneNumber.slice(-4)}_${Date.now().toString().slice(-4)}`;
    const referralCode = generateReferralCode();

    await db.execute(
      `INSERT INTO users (
        id, username, password_hash, phone, phone_verified_at, nickname, role, status,
        points, referral_code, must_bind_contact, created_at, last_login
      ) VALUES (?, ?, ?, ?, NOW(), ?, 'user', 'active', 0, ?, 0, NOW(), NOW())`,
      [userId, username, '', phoneNumber, username, referralCode],
    );

    if (inviteCode) {
      await bindReferralIfNeeded(userId, inviteCode);
    }

    user = await fetchUserById(userId);
  } else {
    await db.execute(
      `UPDATE users
       SET phone_verified_at = COALESCE(phone_verified_at, NOW()),
           must_bind_contact = 0,
           last_login = NOW()
       WHERE id = ?`,
      [user.id],
    );
    user = await fetchUserById(String(user.id));
  }

  const token = generateToken({
    userId: String(user.id),
    username: user.username,
    role: user.role || 'user',
  });
  const refreshToken = generateRefreshToken({
    userId: String(user.id),
    username: user.username,
    role: user.role || 'user',
  });

  return {
    token,
    refreshToken,
    user,
    isNewUser,
  };
}

router.post('/register', requireSupportedDesktopVersion, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      username,
      password,
      email,
      nickname,
      referralCode,
      phone,
      phoneCode,
      wechatOpenid,
      wechatUnionid,
    } = req.body as RegisterBody;

    ensureUsernameValid(username);
    ensurePasswordValid(password);

    const hasPhoneBinding = Boolean(phone && phoneCode);
    const hasWechatBinding = Boolean(wechatOpenid);

    if (!hasPhoneBinding && !hasWechatBinding) {
      throw ApiError.badRequest('New accounts must bind a phone number or WeChat before registration.');
    }

    if (phone) {
      if (!isValidPhoneNumber(phone)) {
        throw ApiError.badRequest('Invalid phone number format.');
      }

      if (!phoneCode) {
        throw ApiError.badRequest('Phone registration requires a verification code.');
      }

      const verification = consumePhoneVerificationCode(phone, 'register', phoneCode);
      if (!verification.success) {
        throw ApiError.badRequest(verification.message || 'Phone verification failed.');
      }
    }

    const existingUsers = await db.query<UserRow[]>(
      `SELECT id
       FROM users
       WHERE username = ?
          OR (? IS NOT NULL AND phone = ?)
          OR (? IS NOT NULL AND email = ?)
          OR (? IS NOT NULL AND wechat_openid = ?)`,
      [
        username,
        phone || null,
        phone || null,
        email || null,
        email || null,
        wechatOpenid || null,
        wechatOpenid || null,
      ],
    );

    if (existingUsers.length > 0) {
      throw ApiError.badRequest('Username, phone, email, or WeChat account already exists.');
    }

    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);
    const userReferralCode = generateReferralCode();
    const mustBindContact = hasPhoneBinding || hasWechatBinding ? 0 : 1;

    await db.execute(
      `INSERT INTO users (
        id,
        username,
        password_hash,
        password_updated_at,
        email,
        phone,
        phone_verified_at,
        nickname,
        role,
        status,
        points,
        referral_code,
        wechat_openid,
        wechat_unionid,
        wechat_bound_at,
        must_bind_contact,
        created_at
      ) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, 'user', 'active', 0, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        username,
        passwordHash,
        email || null,
        phone || null,
        phone ? new Date() : null,
        nickname || username,
        userReferralCode,
        wechatOpenid || null,
        wechatUnionid || null,
        wechatOpenid ? new Date() : null,
        mustBindContact,
      ],
    );

    const referredByName = await bindReferralIfNeeded(userId, referralCode);
    await ensureTrialForUserProduct(userId, DEFAULT_LICENSE_PRODUCT_ID, 'user');
    const user = await fetchUserById(userId);

    const token = generateToken({ userId, username, role: 'user' });
    const refreshToken = generateRefreshToken({ userId, username, role: 'user' });

    res.status(201).json({
      success: true,
      data: {
        user: createAuthPayload(user),
        token,
        refreshToken,
        welcomeBonus: {
          points: Number(user.points || 0),
          memberPoints: 0,
          totalPoints: Number(user.points || 0),
          durationDays: 0,
          referredBy: referredByName,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', requireSupportedDesktopVersion, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body as LoginBody;

    if (!username || !password) {
      throw ApiError.badRequest('Account and password are required.');
    }

    const user = await findUserByAccount(username);
    if (!user) {
      throw ApiError.unauthorized('Invalid account or password.');
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutes = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
      throw ApiError.forbidden(`Account is locked. Try again in ${minutes} minute(s).`);
    }

    if (user.status === 'banned') {
      throw ApiError.forbidden('This account has been disabled.');
    }

    if (!user.password_hash) {
      throw ApiError.unauthorized(
        'This account does not have a password yet. Please sign in with phone or WeChat first.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      const nextAttempts = Number(user.login_attempts || 0) + 1;
      const lockedUntil =
        nextAttempts >= config.security.loginMaxAttempts
          ? new Date(Date.now() + config.security.loginLockoutMinutes * 60 * 1000)
          : null;

      await db.execute('UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?', [
        nextAttempts,
        lockedUntil,
        user.id,
      ]);

      throw ApiError.unauthorized('Invalid account or password.');
    }

    await db.execute(
      'UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ?',
      [user.id],
    );
    await ensureTrialForUserProduct(String(user.id), DEFAULT_LICENSE_PRODUCT_ID, user.role);

    const token = generateToken({
      userId: String(user.id),
      username: user.username,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      userId: String(user.id),
      username: user.username,
      role: user.role,
    });

    const latestUser = await fetchUserById(String(user.id));

    res.json({
      success: true,
      data: {
        user: createAuthPayload(latestUser),
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/forgot-password/request', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phoneNumber, account } = req.body as ForgotPasswordRequestBody;

    if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
      throw ApiError.badRequest('Please enter a valid phone number.');
    }

    const user = (
      await db.query<UserRow[]>('SELECT * FROM users WHERE phone = ? LIMIT 1', [phoneNumber])
    )[0];

    if (!user) {
      throw ApiError.notFound('No account is bound to this phone number.');
    }

    if (account && ![user.username, user.email, user.phone].includes(account)) {
      throw ApiError.badRequest('The account does not match the phone number.');
    }

    const sendStatus = canSendPhoneVerificationCode(phoneNumber, 'password_reset');
    if (!sendStatus.allowed) {
      throw ApiError.badRequest(
        `Sending too frequently. Try again in ${sendStatus.retryAfterSeconds} second(s).`,
      );
    }

    const code = generateVerificationCode();
    const result = await sendVerificationCode(phoneNumber, code);
    if (!result.success) {
      throw ApiError.internal(result.message || 'Failed to send password reset code.');
    }

    createPhoneVerificationCode(phoneNumber, 'password_reset', code);
    await db.execute('UPDATE users SET password_reset_requested_at = NOW() WHERE id = ?', [user.id]);

    res.json({
      success: true,
      message: 'Password reset code sent successfully.',
      ...(process.env.NODE_ENV === 'development' ? { code } : {}),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/forgot-password/reset', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phoneNumber, code, newPassword } = req.body as ForgotPasswordResetBody;

    if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
      throw ApiError.badRequest('Please enter a valid phone number.');
    }

    ensurePasswordValid(newPassword);

    const verification = consumePhoneVerificationCode(phoneNumber, 'password_reset', code);
    if (!verification.success) {
      throw ApiError.badRequest(verification.message || 'Invalid verification code.');
    }

    const user = (
      await db.query<UserRow[]>('SELECT * FROM users WHERE phone = ? LIMIT 1', [phoneNumber])
    )[0];

    if (!user) {
      throw ApiError.notFound('No account is bound to this phone number.');
    }

    const passwordHash = await bcrypt.hash(newPassword, config.security.bcryptRounds);
    await db.execute(
      `UPDATE users
       SET password_hash = ?,
           password_updated_at = NOW(),
           last_password_reset_at = NOW(),
           login_attempts = 0,
           locked_until = NULL
       WHERE id = ?`,
      [passwordHash, user.id],
    );

    res.json({
      success: true,
      message: 'Password has been reset successfully.',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/phone/code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, phoneNumber } = req.body as PhoneCodeBody;
    const targetPhone = phoneNumber || phone;

    if (!targetPhone || !isValidPhoneNumber(targetPhone)) {
      throw ApiError.badRequest('Please enter a valid phone number.');
    }

    const sendStatus = canSendPhoneVerificationCode(targetPhone, 'login');
    if (!sendStatus.allowed) {
      throw ApiError.badRequest(
        `Sending too frequently. Try again in ${sendStatus.retryAfterSeconds} second(s).`,
      );
    }

    const code = generateVerificationCode();
    const result = await sendVerificationCode(targetPhone, code);
    if (!result.success) {
      throw ApiError.internal(result.message || 'Failed to send SMS code.');
    }

    createPhoneVerificationCode(targetPhone, 'login', code);

    res.json({
      success: true,
      message: 'Verification code sent successfully.',
      ...(process.env.NODE_ENV === 'development' ? { code } : {}),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/phone/login', requireSupportedDesktopVersion, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, phoneNumber, code, inviteCode } = req.body as PhoneLoginBody;
    const targetPhone = phoneNumber || phone;

    if (!targetPhone) {
      throw ApiError.badRequest('Phone number is required.');
    }

    const result = await handlePhoneLogin(targetPhone, code, inviteCode);
    await ensureTrialForUserProduct(String(result.user.id), DEFAULT_LICENSE_PRODUCT_ID, result.user.role);

    res.json({
      success: true,
      data: {
        token: result.token,
        refreshToken: result.refreshToken,
        user: {
          ...createAuthPayload(result.user),
          isNewUser: result.isNewUser,
          loginMethod: 'sms',
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/wechat/login', (_req: Request, res: Response) => {
  res.status(410).json({
    success: false,
    message: 'Use /api/wechat/login-qrcode for WeChat QR login.',
  });
});

router.post('/wechat/callback', (_req: Request, res: Response) => {
  res.status(410).json({
    success: false,
    message: 'Use /api/wechat/callback for WeChat OAuth callback handling.',
  });
});

router.post('/logout', authMiddleware, (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;

    const users = await db.query<UserRow[]>(
      `SELECT id, username, email, phone, phone_verified_at, nickname, avatar_url, role,
              wechat_openid, wechat_unionid, wechat_bound_at,
              points, total_recharge, must_bind_contact, created_at, last_login
       FROM users
       WHERE id = ?`,
      [userId],
    );

    if (users.length === 0) {
      throw ApiError.notFound('User not found.');
    }

    const user = users[0];

    res.json({
      success: true,
      data: {
        ...createAuthPayload(user),
        gender: user.gender || null,
        birthday: user.birthday || null,
        location: user.location || null,
        website: user.website || null,
        wechatOpenid: user.wechat_openid || null,
        wechatUnionid: user.wechat_unionid || null,
        totalRecharge: Number(user.total_recharge || 0),
        createdAt: user.created_at,
        lastLoginAt: user.last_login,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/change-password', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const { currentPassword, newPassword } = req.body as ChangePasswordBody;

    ensurePasswordValid(newPassword);

    const users = await db.query<UserRow[]>(
      'SELECT id, password_hash FROM users WHERE id = ? LIMIT 1',
      [userId],
    );

    if (users.length === 0) {
      throw ApiError.notFound('User not found.');
    }

    const user = users[0];
    const currentHash = String(user.password_hash || '');

    if (currentHash) {
      if (!currentPassword) {
        throw ApiError.badRequest('Current password is required.');
      }

      const matched = await bcrypt.compare(currentPassword, currentHash);
      if (!matched) {
        throw ApiError.badRequest('Current password is incorrect.');
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, config.security.bcryptRounds);
    await db.execute(
      `UPDATE users
       SET password_hash = ?,
           password_updated_at = NOW()
       WHERE id = ?`,
      [passwordHash, userId],
    );

    res.json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/bind-phone', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const { phoneNumber, code } = req.body as BindPhoneBody;

    if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
      throw ApiError.badRequest('Please enter a valid phone number.');
    }

    if (!code) {
      throw ApiError.badRequest('Verification code is required.');
    }

    const verification = consumePhoneVerificationCode(phoneNumber, 'bind_phone', code);
    if (!verification.success) {
      throw ApiError.badRequest(verification.message || 'Invalid verification code.');
    }

    const conflicts = await db.query<UserRow[]>(
      'SELECT id FROM users WHERE phone = ? AND id <> ? LIMIT 1',
      [phoneNumber, userId],
    );
    if (conflicts.length > 0) {
      throw ApiError.badRequest('This phone number is already bound to another account.');
    }

    await db.execute(
      `UPDATE users
       SET phone = ?,
           phone_verified_at = NOW(),
           must_bind_contact = 0
       WHERE id = ?`,
      [phoneNumber, userId],
    );

    res.json({
      success: true,
      message: 'Phone number bound successfully.',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/payout-profile', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const profile = await getUserPayoutProfile(userId);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/payout-profile', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const profile = await saveUserPayoutProfile(userId, req.body as PayoutProfileBody);

    res.json({
      success: true,
      message: 'Payout profile saved successfully.',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/profile', requireSupportedDesktopVersion, authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;

    const users = await db.query<UserRow[]>(
      `SELECT id, username, email, phone, phone_verified_at, nickname, avatar_url, role,
              password_hash,
              COALESCE(points, 0) AS points,
              COALESCE(total_recharge, 0) AS total_recharge,
              COALESCE(total_earnings, 0) AS total_earnings,
              referral_code, wechat_openid, wechat_bound_at, must_bind_contact,
              created_at, last_login, password_updated_at, last_password_reset_at
       FROM users
       WHERE id = ?`,
      [userId],
    );

    if (users.length === 0) {
      throw ApiError.notFound('User not found.');
    }

    const user = users[0];
    const durationAccess = await getDurationAccessStatus(userId);
    const licenseAccess = await getProductAccessStatus(userId, DEFAULT_LICENSE_PRODUCT_ID, user.role);
    const diamondAccount = await getDiamondAccountSummary(userId);
    const payoutProfile = await getUserPayoutProfile(userId);

    res.json({
      success: true,
      data: {
        ...createAuthPayload(user),
        totalRecharge: Number(user.total_recharge || 0),
        referralCode: user.referral_code,
        totalEarnings: Number(user.total_earnings || 0),
        createdAt: user.created_at,
        lastLoginAt: user.last_login,
        passwordUpdatedAt: user.password_updated_at || null,
        lastPasswordResetAt: user.last_password_reset_at || null,
        diamondAccount: {
          ...diamondAccount,
          availableAmount: diamondAccount.availableDiamonds / 100,
          pendingAmount: diamondAccount.pendingDiamonds / 100,
          frozenAmount: diamondAccount.frozenDiamonds / 100,
          totalEarnedAmount: diamondAccount.totalEarnedDiamonds / 100,
          totalWithdrawnAmount: diamondAccount.totalWithdrawnDiamonds / 100,
        },
        payoutProfile,
        duration: {
          isPermanent: durationAccess.isPermanent,
          isActive: durationAccess.canEnter,
          remainingSeconds: durationAccess.remainingSeconds,
          expiresAt: durationAccess.expiresAt,
          canEnter: durationAccess.canEnter || licenseAccess.canEnter,
        },
        license: licenseAccess,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/check-recharge', requireSupportedDesktopVersion, authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.id;
    const userRole = (authReq.user as any)?.role;

    if (userRole === 'admin' || userRole === 'rootadmin' || userRole === 'super_admin') {
      return res.json({
        success: true,
        data: {
          needsRecharge: false,
          totalRecharge: 999999,
          needsLogin: false,
          hasActiveMembership: true,
          membershipExpiry: null,
          points: Number((authReq.user as any)?.points || 0),
          accessType: 'admin',
          isTrial: false,
          trialStartedAt: null,
          trialExpiresAt: null,
          remainingSeconds: 999999999,
          canEnter: true,
          requiresPurchase: false,
        },
      });
    }

    const users = await db.query<UserRow[]>(
      'SELECT id, total_recharge, points FROM users WHERE id = ?',
      [userId],
    );

    if (users.length === 0) {
      throw ApiError.notFound('User not found.');
    }

    const user = users[0];
    const durationAccess = await getDurationAccessStatus(userId);
    const licenseAccess = await getProductAccessStatus(userId, DEFAULT_LICENSE_PRODUCT_ID, userRole);
    const canEnter = durationAccess.canEnter || licenseAccess.canEnter;

    return res.json({
      success: true,
      data: {
        needsRecharge: !canEnter,
        totalRecharge: Number(user.total_recharge || 0),
        needsLogin: false,
        hasActiveMembership: canEnter,
        membershipExpiry: licenseAccess.expiresAt || durationAccess.expiresAt,
        points: Number(user.points || 0),
        license: licenseAccess,
        accessType: licenseAccess.accessType,
        isTrial: licenseAccess.isTrial,
        trialStartedAt: licenseAccess.trialStartedAt,
        trialExpiresAt: licenseAccess.trialExpiresAt,
        remainingSeconds: Math.max(durationAccess.remainingSeconds, licenseAccess.remainingSeconds),
        canEnter,
        requiresPurchase: !canEnter,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/refresh', requireSupportedDesktopVersion, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };

    if (!refreshToken) {
      throw ApiError.badRequest('Refresh token is required.');
    }

    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      throw ApiError.unauthorized('Refresh token is invalid.');
    }

    const newToken = generateToken({
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    });
    const nextRefreshToken = generateRefreshToken({
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    });

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: nextRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
