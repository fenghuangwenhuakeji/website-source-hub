import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { query } from '../config/database.js';
import {
  applyReferralBindingRewards,
  convertDiamondsToPoints,
  diamondsToAmount,
  getDiamondAccountSummary,
  getReferralSettings,
  getUserPayoutProfile,
  previewWithdrawal,
  submitWithdrawalRequest,
} from '../utils/referralProgram.js';

const router = Router();

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'CW';
  for (let i = 0; i < 6; i += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function toNumber(value: unknown, fallback = 0): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function parseMetadata(value: unknown): Record<string, any> | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(String(value));
  } catch {
    return null;
  }
}

async function ensureUserReferralCode(userId: string): Promise<string> {
  const users = await query<any[]>('SELECT referral_code FROM users WHERE id = ?', [userId]);
  if (!users || users.length === 0) {
    throw new AppError(404, 'User not found.');
  }

  let referralCode = users[0].referral_code;
  if (!referralCode) {
    referralCode = generateReferralCode();
    await query('UPDATE users SET referral_code = ? WHERE id = ?', [referralCode, userId]);
  }

  return referralCode;
}

router.get('/my-code', authMiddleware, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const referralCode = await ensureUserReferralCode(userId);

    res.json({
      success: true,
      data: { referralCode },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/bind/:code', authMiddleware, async (req, res, next) => {
  try {
    const { code } = req.params;
    const userId = (req as any).user.id;

    const currentUserRows = await query<any[]>(
      'SELECT referred_by FROM users WHERE id = ? LIMIT 1',
      [userId],
    );
    if (!currentUserRows || currentUserRows.length === 0) {
      throw new AppError(404, 'User not found.');
    }

    if (currentUserRows[0].referred_by) {
      throw new AppError(400, 'You have already bound an inviter.');
    }

    const referrerRows = await query<any[]>(
      'SELECT id FROM users WHERE referral_code = ? LIMIT 1',
      [code],
    );
    if (!referrerRows || referrerRows.length === 0) {
      throw new AppError(404, 'Referral code does not exist.');
    }

    const referrerId = referrerRows[0].id;
    if (referrerId === userId) {
      throw new AppError(400, 'You cannot bind your own referral code.');
    }

    await query('UPDATE users SET referred_by = ? WHERE id = ?', [referrerId, userId]);
    await applyReferralBindingRewards(referrerId, userId);

    res.json({
      success: true,
      message: 'Referral binding completed successfully.',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', authMiddleware, async (req, res, next) => {
  try {
    const userId = (req as any).user.id || (req as any).user?.userId;
    const referralCode = await ensureUserReferralCode(userId);
    const settings = await getReferralSettings();
    const diamondAccount = await getDiamondAccountSummary(userId);

    res.json({
      success: true,
      data: {
        referralCode,
        totalInvites: diamondAccount.totalInvites,
        paidInvites: diamondAccount.paidInvites,
        nextBoostRemaining: diamondAccount.nextBoostRemaining,
        recruitBoostPaidUsers: settings.recruitBoostPaidUsers,
        diamondAccount: {
          ...diamondAccount,
          availableAmount: diamondsToAmount(diamondAccount.availableDiamonds),
          pendingAmount: diamondsToAmount(diamondAccount.pendingDiamonds),
          frozenAmount: diamondsToAmount(diamondAccount.frozenDiamonds),
          totalEarnedAmount: diamondsToAmount(diamondAccount.totalEarnedDiamonds),
          totalWithdrawnAmount: diamondsToAmount(diamondAccount.totalWithdrawnDiamonds),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/list', authMiddleware, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
    const offset = (page - 1) * limit;

    const records = await query<any[]>(
      `SELECT
         r.id,
         r.referee_type,
         r.reward_type,
         r.reward_amount,
         r.reward_status,
         r.order_id,
         r.gross_order_amount,
         r.commission_mode,
         r.commission_value,
         r.available_at,
         r.settled_at,
         r.metadata,
         r.created_at,
         u.username AS referee_name
       FROM referrals r
       LEFT JOIN users u ON r.referee_id = u.id
       WHERE r.referrer_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset],
    );

    const countRows = await query<any[]>(
      'SELECT COUNT(*) AS total FROM referrals WHERE referrer_id = ?',
      [userId],
    );

    const list = records.map((record) => {
      const metadata = parseMetadata(record.metadata);
      return {
        ...record,
        rewardAmountDisplay: diamondsToAmount(toNumber(record.reward_amount)),
        productName: metadata?.productName || null,
        ruleCode: metadata?.ruleCode || null,
        boosted: Boolean(metadata?.boosted),
      };
    });

    res.json({
      success: true,
      data: {
        list,
        pagination: {
          page,
          limit,
          total: Number((countRows[0] as any)?.total || 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/rules', async (_req, res, next) => {
  try {
    const settings = await getReferralSettings();

    res.json({
      success: true,
      data: {
        settlementDays: settings.settlementDays,
        withdrawThresholdDiamonds: settings.withdrawThresholdDiamonds,
        withdrawThresholdAmount: diamondsToAmount(settings.withdrawThresholdDiamonds),
        diamondToPointsRate: settings.diamondToPointsRate,
        recruitBoostPaidUsers: settings.recruitBoostPaidUsers,
        recruitBoostRate: settings.recruitBoostRate,
        withdrawalNotice: settings.withdrawalNotice,
        commissionRules: settings.commissionRules.map((rule) => ({
          ...rule,
          rewardAmount: rule.rewardMode === 'fixed' ? rule.rewardValue : null,
          rewardRate: rule.rewardMode === 'rate' ? rule.rewardValue : null,
          boostRewardAmount: rule.boostRewardMode === 'fixed' ? rule.boostRewardValue : null,
          boostRewardRate: rule.boostRewardMode === 'rate' ? rule.boostRewardValue : null,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/records', authMiddleware, async (req, res, next) => {
  try {
    const userId = (req as any).user.id || (req as any).user?.userId;
    const records = await query<any[]>(
      `SELECT
         r.id,
         r.referee_id,
         r.referee_type,
         r.reward_type,
         r.reward_amount,
         r.reward_status,
         r.order_id,
         r.gross_order_amount,
         r.available_at,
         r.settled_at,
         r.metadata,
         r.created_at,
         u.username AS referee_name
       FROM referrals r
       LEFT JOIN users u ON r.referee_id = u.id
       WHERE r.referrer_id = ?
       ORDER BY r.created_at DESC
       LIMIT 50`,
      [userId],
    );

    res.json({
      success: true,
      data: records.map((record) => ({
        ...record,
        rewardAmountDisplay: diamondsToAmount(toNumber(record.reward_amount)),
        metadata: parseMetadata(record.metadata),
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/rewards', authMiddleware, async (req, res, next) => {
  try {
    const userId = (req as any).user.id || (req as any).user?.userId;
    const records = await query<any[]>(
      `SELECT id, reward_type, reward_amount, reward_status, order_id, created_at
       FROM referrals
       WHERE referrer_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId],
    );

    res.json({
      success: true,
      data: records.map((record) => ({
        ...record,
        rewardAmountDisplay: diamondsToAmount(toNumber(record.reward_amount)),
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/ledger', authMiddleware, async (req, res, next) => {
  try {
    const userId = (req as any).user.id || (req as any).user?.userId;
    const rows = await query<any[]>(
      `SELECT *
       FROM diamond_ledger
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 100`,
      [userId],
    );

    res.json({
      success: true,
      data: rows.map((row) => ({
        ...row,
        metadata: parseMetadata(row.metadata),
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/withdrawals', authMiddleware, async (req, res, next) => {
  try {
    const userId = (req as any).user.id || (req as any).user?.userId;
    const payoutProfile = await getUserPayoutProfile(userId);
    const rows = await query<any[]>(
      `SELECT *
       FROM withdraw_requests
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId],
    );

    res.json({
      success: true,
      data: {
        payoutProfile,
        list: rows,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/withdrawals/preview', authMiddleware, async (req, res, next) => {
  try {
    const userId = (req as any).user.id || (req as any).user?.userId;
    const diamonds = Math.max(0, Math.floor(Number(req.body?.diamonds || 0)));
    const data = await previewWithdrawal(userId, diamonds);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/withdrawals', authMiddleware, async (req, res, next) => {
  try {
    const userId = (req as any).user.id || (req as any).user?.userId;
    const diamonds = Math.max(0, Math.floor(Number(req.body?.diamonds || 0)));
    const result = await submitWithdrawalRequest(userId, diamonds);

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/convert-diamonds', authMiddleware, async (req, res, next) => {
  try {
    const userId = (req as any).user.id || (req as any).user?.userId;
    const diamonds = Math.max(0, Math.floor(Number(req.body?.diamonds || 0)));
    const result = await convertDiamondsToPoints(userId, diamonds);

    res.json({
      success: true,
      message: 'Diamonds converted into points successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/milestones', authMiddleware, async (req, res, next) => {
  try {
    const userId = (req as any).user.id || (req as any).user?.userId;
    const settings = await getReferralSettings();
    const summary = await getDiamondAccountSummary(userId);

    res.json({
      success: true,
      data: {
        currentPaidInvites: summary.paidInvites,
        recruitBoostPaidUsers: settings.recruitBoostPaidUsers,
        nextBoostRemaining: summary.nextBoostRemaining,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
