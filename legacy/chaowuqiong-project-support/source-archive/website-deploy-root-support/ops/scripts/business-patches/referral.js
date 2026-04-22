const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');

// 获取用户的邀请码和统计信息
router.get('/info', authMiddleware, async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        if (!db) {
            return res.json({
                success: true,
                data: {
                    referralCode: 'DEMO' + req.user.userId.substring(0, 6),
                    referralLink: 'http://115.190.158.182/register?ref=DEMO' + req.user.userId.substring(0, 6),
                    stats: {
                        totalInvited: 0,
                        registeredCount: 0,
                        rechargedCount: 0,
                        totalRewardPoints: 0
                    },
                    invitedList: []
                }
            });
        }

        // 获取用户的邀请码
        const [users] = await db.query('SELECT referral_code FROM users WHERE id = ?', [req.user.userId]);
        let referralCode = users[0]?.referral_code;
        
        // 如果没有邀请码，生成一个
        if (!referralCode) {
            referralCode = uuidv4().substring(0, 8).toUpperCase();
            await db.query('UPDATE users SET referral_code = ? WHERE id = ?', [referralCode, req.user.userId]);
        }

        // 获取邀请统计
        const [stats] = await db.query(
            'SELECT total_invited, registered_count, recharged_count, total_reward_points FROM invitation_stats WHERE user_id = ?',
            [req.user.userId]
        );

        // 获取邀请记录列表
        const invitedList = await db.query(
            `SELECT 
                ir.id,
                ir.invitee_username,
                ir.status,
                ir.reward_points,
                ir.created_at,
                u.membership_expire,
                u.total_recharge
            FROM invitation_records ir
            LEFT JOIN users u ON ir.invitee_id = u.id
            WHERE ir.inviter_id = ?
            ORDER BY ir.created_at DESC
            LIMIT 20`,
            [req.user.userId]
        );

        res.json({
            success: true,
            data: {
                referralCode,
                referralLink: `http://115.190.158.182/register?ref=${referralCode}`,
                stats: stats[0] || {
                    totalInvited: 0,
                    registeredCount: 0,
                    rechargedCount: 0,
                    totalRewardPoints: 0
                },
                invitedList: invitedList || []
            }
        });
    } catch (error) {
        next(error);
    }
});

// 生成新的邀请码
router.post('/generate-code', authMiddleware, async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        if (!db) {
            return res.json({
                success: true,
                data: { referralCode: 'DEMO' + Date.now() }
            });
        }

        const newCode = uuidv4().substring(0, 8).toUpperCase();
        await db.query('UPDATE users SET referral_code = ? WHERE id = ?', [newCode, req.user.userId]);

        res.json({
            success: true,
            data: { referralCode: newCode }
        });
    } catch (error) {
        next(error);
    }
});

// 获取邀请奖励规则
router.get('/rewards', authMiddleware, async (req, res, next) => {
    try {
        // 邀请奖励规则
        const rewardRules = {
            // 基础奖励
            baseReward: {
                inviterPoints: 100,  // 邀请人获得100积分
                inviteePoints: 50    // 被邀请人获得50积分
            },
            // 阶梯奖励
            milestoneRewards: [
                { count: 3, reward: { type: 'package', value: 'week', name: '周卡' } },
                { count: 5, reward: { type: 'points', value: 200, name: '200积分' } },
                { count: 10, reward: { type: 'package', value: 'month', name: '月卡' } },
                { count: 20, reward: { type: 'points', value: 500, name: '500积分' } },
                { count: 50, reward: { type: 'package', value: 'year', name: '年卡' } }
            ],
            // 充值返佣比例
            rechargeCommission: {
                rate: 0.1,  // 10%返佣
                maxAmount: 100  // 单次最高100积分
            }
        };

        res.json({
            success: true,
            data: rewardRules
        });
    } catch (error) {
        next(error);
    }
});

// 检查邀请码是否有效
router.get('/check-code/:code', async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        if (!db) {
            return res.json({
                success: true,
                data: { valid: true, inviterName: '演示用户' }
            });
        }

        const [users] = await db.query(
            'SELECT id, username, nickname FROM users WHERE referral_code = ?',
            [req.params.code]
        );

        if (users.length === 0) {
            return res.json({
                success: true,
                data: { valid: false }
            });
        }

        res.json({
            success: true,
            data: {
                valid: true,
                inviterId: users[0].id,
                inviterName: users[0].nickname || users[0].username
            }
        });
    } catch (error) {
        next(error);
    }
});

// 获取邀请排行榜
router.get('/leaderboard', async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        if (!db) {
            return res.json({
                success: true,
                data: {
                    daily: [],
                    weekly: [],
                    monthly: [],
                    allTime: []
                }
            });
        }

        // 总榜
        const allTime = await db.query(
            `SELECT 
                u.username,
                u.nickname,
                u.avatar_url,
                is.total_invited,
                is.registered_count,
                is.total_reward_points
            FROM invitation_stats is
            JOIN users u ON is.user_id = u.id
            ORDER BY is.total_invited DESC
            LIMIT 10`
        );

        res.json({
            success: true,
            data: {
                daily: [],  // 可以后续实现日榜
                weekly: [], // 可以后续实现周榜
                monthly: [], // 可以后续实现月榜
                allTime: allTime || []
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
