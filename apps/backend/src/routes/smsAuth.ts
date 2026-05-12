import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { generateRefreshToken, generateToken } from '../middleware/auth.js';
import { applyReferralBindingRewards } from '../utils/referralProgram.js';
import {
  generateVerificationCode,
  isValidPhoneNumber,
  sendVerificationCode,
} from '../utils/sms.js';
import {
  canSendPhoneVerificationCode,
  consumePhoneVerificationCode,
  createPhoneVerificationCode,
  type VerificationPurpose,
} from '../utils/phoneVerificationStore.js';
import { DEFAULT_LICENSE_PRODUCT_ID, ensureTrialForUserProduct } from '../utils/licenseCenter.js';
import { requireSupportedDesktopVersion } from '../utils/appVersion.js';

const router = Router();

function normalizePurpose(value?: string): VerificationPurpose {
  switch (value) {
    case 'register':
      return 'register';
    case 'password_reset':
      return 'password_reset';
    case 'bind_phone':
      return 'bind_phone';
    default:
      return 'login';
  }
}

router.post(
  '/send-code',
  requireSupportedDesktopVersion,
  [
    body('phoneNumber')
      .notEmpty()
      .withMessage('Phone number is required.')
      .custom((value) => isValidPhoneNumber(value))
      .withMessage('Invalid phone number format.'),
    body('purpose')
      .optional()
      .isIn(['login', 'register', 'password_reset', 'bind_phone'])
      .withMessage('Invalid verification code purpose.'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request parameters.',
          errors: errors.array(),
        });
      }

      const { phoneNumber } = req.body as { phoneNumber: string };
      const purpose = normalizePurpose(req.body?.purpose);
      const sendStatus = canSendPhoneVerificationCode(phoneNumber, purpose);

      if (!sendStatus.allowed) {
        return res.status(429).json({
          success: false,
          message: `Sending too frequently. Try again in ${sendStatus.retryAfterSeconds} second(s).`,
        });
      }

      const code = generateVerificationCode();
      const result = await sendVerificationCode(phoneNumber, code);
      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: result.message,
        });
      }

      createPhoneVerificationCode(phoneNumber, purpose, code);

      return res.json({
        success: true,
        message: 'Verification code sent successfully.',
        ...(process.env.NODE_ENV === 'development' ? { code } : {}),
      });
    } catch (error) {
      console.error('Failed to send SMS verification code:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification code.',
      });
    }
  },
);

router.post(
  '/login',
  requireSupportedDesktopVersion,
  [
    body('phoneNumber')
      .notEmpty()
      .withMessage('Phone number is required.')
      .custom((value) => isValidPhoneNumber(value))
      .withMessage('Invalid phone number format.'),
    body('code')
      .notEmpty()
      .withMessage('Verification code is required.')
      .isLength({ min: 6, max: 6 })
      .withMessage('Verification code must be 6 digits.'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request parameters.',
          errors: errors.array(),
        });
      }

      const { phoneNumber, code, inviteCode } = req.body as {
        phoneNumber: string;
        code: string;
        inviteCode?: string;
      };

      const verification = consumePhoneVerificationCode(phoneNumber, 'login', code);
      if (!verification.success) {
        return res.status(400).json({
          success: false,
          message: verification.message,
        });
      }

      const users = await db.query<any[]>('SELECT * FROM users WHERE phone = ?', [phoneNumber]);
      let user = users[0];
      const isNewUser = !user;

      if (!user) {
        const userId = uuidv4();
        const username = `user_${phoneNumber.slice(-4)}_${Date.now().toString().slice(-4)}`;
        const referralCode = `CW${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

        await db.execute(
          `INSERT INTO users (
            id, username, password_hash, phone, nickname, status, role, points, referral_code,
            phone_verified_at, must_bind_contact, created_at, last_login
          ) VALUES (?, ?, ?, ?, ?, 'active', 'user', 0, ?, NOW(), 0, NOW(), NOW())`,
          [userId, username, '', phoneNumber, username, referralCode],
        );

        user = (await db.query<any[]>('SELECT * FROM users WHERE id = ?', [userId]))[0];

        if (inviteCode) {
          await handleInviteCode(userId, inviteCode);
          user = (await db.query<any[]>('SELECT * FROM users WHERE id = ?', [userId]))[0];
        }
      } else {
        await db.execute(
          `UPDATE users
           SET phone_verified_at = COALESCE(phone_verified_at, NOW()),
               must_bind_contact = 0,
               last_login = NOW()
           WHERE id = ?`,
          [user.id],
        );
        user = (await db.query<any[]>('SELECT * FROM users WHERE id = ?', [user.id]))[0];
      }

      await ensureTrialForUserProduct(String(user.id), DEFAULT_LICENSE_PRODUCT_ID, user.role);

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

      return res.json({
        success: true,
        message: isNewUser ? 'Registration completed.' : 'Login successful.',
        data: {
          token,
          refreshToken,
          user: {
            id: user.id,
            username: user.username,
            phone: user.phone,
            email: user.email,
            role: user.role,
            points: user.points || 0,
            isNewUser,
          },
        },
      });
    } catch (error) {
      console.error('Phone login failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Phone login failed.',
      });
    }
  },
);

async function handleInviteCode(newUserId: string, inviteCode: string): Promise<void> {
  const inviters = await db.query<any[]>(
    'SELECT id FROM users WHERE referral_code = ? LIMIT 1',
    [inviteCode],
  );
  const inviter = inviters[0];

  if (!inviter || inviter.id === newUserId) {
    return;
  }

  await db.execute('UPDATE users SET referred_by = ? WHERE id = ?', [inviter.id, newUserId]);
  await applyReferralBindingRewards(inviter.id, newUserId);
}

export default router;
