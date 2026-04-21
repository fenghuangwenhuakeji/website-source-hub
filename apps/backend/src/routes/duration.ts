import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { query } from '../config/database.js';
import { parseStoredDateTime } from '../utils/durationAccess.js';

const router = Router();

router.get('/status', authMiddleware, async (req, res, next) => {
    try {
        const userId = (req as any).user.id;

        const userDuration = await query(
            `SELECT total_duration, remaining_duration, is_active, is_permanent, activated_at, expires_at
             FROM user_durations 
             WHERE user_id = ?`,
            [userId]
        );

        if (!userDuration || userDuration.length === 0) {
            return res.json({
                success: true,
                data: {
                    hasDuration: false,
                    isPermanent: false,
                    remainingSeconds: 0,
                    expiresAt: null,
                    canEnter: false
                }
            });
        }

        const duration = userDuration[0];
        const now = new Date();
        let remainingSeconds = 0;
        let isExpired = false;

        if (duration.is_permanent) {
            remainingSeconds = 999999999;
        } else if (duration.expires_at) {
            const expiresAt = parseStoredDateTime(duration.expires_at);
            if (expiresAt && expiresAt > now) {
                remainingSeconds = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
            } else {
                isExpired = true;
                await query(
                    'UPDATE user_durations SET is_active = FALSE WHERE user_id = ?',
                    [userId]
                );
            }
        }

        res.json({
            success: true,
            data: {
                hasDuration: !isExpired,
                isPermanent: duration.is_permanent === 1,
                remainingSeconds,
                totalSeconds: duration.total_duration,
                activatedAt: duration.activated_at,
                expiresAt: duration.is_permanent ? null : duration.expires_at,
                isExpired,
                canEnter: !isExpired && (duration.is_permanent === 1 || remainingSeconds > 0)
            }
        });
    } catch (error) {
        next(error);
    }
});

router.post('/activate', authMiddleware, async (req, res, next) => {
    try {
        const userId = (req as any).user.id;

        const userDuration = await query(
            'SELECT * FROM user_durations WHERE user_id = ? AND (is_permanent = 1 OR expires_at > NOW())',
            [userId]
        );

        if (!userDuration || userDuration.length === 0) {
            throw new AppError(400, '没有可用的时长，请先充值或兑换');
        }

        await query(
            `UPDATE user_durations SET is_active = TRUE, activated_at = COALESCE(activated_at, NOW()) WHERE user_id = ?`,
            [userId]
        );

        res.json({
            success: true,
            message: '主程序已激活'
        });
    } catch (error) {
        next(error);
    }
});

router.post('/check-entry', authMiddleware, async (req, res, next) => {
    try {
        const userId = (req as any).user.id;

        const userDuration = await query(
            `SELECT total_duration, remaining_duration, is_active, is_permanent, activated_at, expires_at
             FROM user_durations 
             WHERE user_id = ?`,
            [userId]
        );

        if (!userDuration || userDuration.length === 0) {
            return res.json({
                success: true,
                data: {
                    canEnter: false,
                    reason: 'no_duration',
                    message: '您还没有时长，请先充值或兑换'
                }
            });
        }

        const duration = userDuration[0];
        const now = new Date();

        if (duration.is_permanent === 1) {
            return res.json({
                success: true,
                data: {
                    canEnter: true,
                    isPermanent: true,
                    remainingSeconds: 999999999,
                    message: '永久会员，欢迎进入'
                }
            });
        }

        const expiresAt = parseStoredDateTime(duration.expires_at);

        if (!expiresAt || expiresAt <= now) {
            await query('UPDATE user_durations SET is_active = FALSE WHERE user_id = ?', [userId]);
            
            return res.json({
                success: true,
                data: {
                    canEnter: false,
                    reason: 'expired',
                    message: '您的时长已过期，请续费'
                }
            });
        }

        const remainingSeconds = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);

        await query(
            `UPDATE user_durations SET is_active = TRUE, activated_at = COALESCE(activated_at, NOW()) WHERE user_id = ?`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                canEnter: true,
                isPermanent: false,
                remainingSeconds,
                expiresAt: duration.expires_at,
                message: `欢迎进入，剩余时长 ${Math.floor(remainingSeconds / 3600)} 小时 ${Math.floor((remainingSeconds % 3600) / 60)} 分钟`
            }
        });
    } catch (error) {
        next(error);
    }
});

router.post('/add', authMiddleware, async (req, res, next) => {
    try {
        const userId = (req as any).user.id;
        const { hours, source, sourceId } = req.body;

        if (!hours || hours <= 0) {
            throw new AppError(400, '时长必须大于0');
        }

        const existingDuration = await query('SELECT * FROM user_durations WHERE user_id = ?', [userId]);
        
        if (existingDuration && existingDuration.length > 0) {
            const current = existingDuration[0] as any;
            const currentExpires = parseStoredDateTime(current.expires_at) || new Date();
            const baseTime = currentExpires > new Date() ? currentExpires : new Date();
            const newExpires = new Date(baseTime.getTime() + hours * 60 * 60 * 1000);
            
            await query(
                `UPDATE user_durations 
                 SET total_duration = total_duration + ?,
                     remaining_duration = remaining_duration + ?,
                     expires_at = ?,
                     is_active = 1
                 WHERE user_id = ?`,
                [hours * 3600, hours * 3600, newExpires, userId]
            );
        } else {
            const newExpires = new Date(Date.now() + hours * 60 * 60 * 1000);
            await query(
                `INSERT INTO user_durations (user_id, total_duration, remaining_duration, is_active, expires_at, created_at)
                 VALUES (?, ?, ?, 1, ?, NOW())`,
                [userId, hours * 3600, hours * 3600, newExpires]
            );
        }

        res.json({ 
            success: true, 
            message: `成功添加${hours}小时时长` 
        });
    } catch (error) {
        next(error);
    }
});

export default router;
